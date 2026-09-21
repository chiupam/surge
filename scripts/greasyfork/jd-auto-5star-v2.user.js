// ==UserScript==
// @name         京东自动评价（大模型版）
// @namespace    http://tampermonkey.net/
// @version      6.0
// @description  打开页面自动运行，精准识别商品特性生成评价，过滤隐藏元素，一键五星好评。支持按需接入各类大模型（DeepSeek/OpenAI/GLM等）。适配新版五星 radio 元素。
// @author       oscar (Modified)
// @match        https://comment.m.jd.com/pc-static/deliveryrate*
// @match        https://comment.m.jd.com/pc-static/publish*
// @match        https://club.jd.com/myJdcomments/orderVoucher*
// @match        https://club.jd.com/afterComments/productPublish.action*
// @match        https://club.jd.com/afterComments/saveAfterCommentSuccess.action*
// @match        https://club.jd.com/myJdcomments/saveCommentSuccess.action*
// @icon         https://www.jd.com/favicon.ico
// @require      http://libs.baidu.com/jquery/1.11.1/jquery.min.js
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  // ==================== 🛠️ 用户配置区域 ====================

  // 1. 请在此处填入您的 API 密钥 (必填)
  const API_KEY = '';

  // 2. 接口地址 (默认 DeepSeek 接口，可替换为 OpenAI 或 智谱 GLM 等其他兼容 OpenAI 格式的地址)
  // 例如 DeepSeek: https://api.deepseek.com/v1/chat/completions
  // 例如 OpenAI: https://api.openai.com/v1/chat/completions
  // 例如 智谱GLM: https://open.bigmodel.cn/api/paas/v4/chat/completions
  const API_URL = 'https://api.deepseek.com/v1/chat/completions';

  // 3. 模型名称 (请根据您选择的 API 提供商进行修改)
  // 例如 DeepSeek: deepseek-v4-flash
  // 例如 OpenAI: gpt-3.5-turbo 或 gpt-4o
  // 例如 智谱GLM: glm-4
  const MODEL_NAME = 'deepseek-v4-flash';

  // 4. 页面加载后自动开始的延迟时间（单位：毫秒）
  const AUTO_START_DELAY = 500;

  // 5. 是否自动点击“发表”按钮提交评价 (true: 自动提交, false: 手动提交)
  const AUTO_SUBMIT = false;

  // =========================================================

  // ------ 成功页专用：等待延迟后自动关闭 ------
  if ((location.href.indexOf('saveAfterCommentSuccess.action') !== -1 ||
           location.href.indexOf('saveCommentSuccess.action') !== -1) && AUTO_SUBMIT) {
    var delaySec = (AUTO_START_DELAY / 1000).toFixed(1);
    console.log('[AI Auto Review] 评价提交成功，' + delaySec + '秒后关闭窗口...');
    setTimeout(function () {
      window.close();
      setTimeout(function () {
        window.open('', '_self', '');
        window.close();
      }, 500);
      setTimeout(function () {
        window.location.replace('about:blank');
      }, 1500);
    }, AUTO_START_DELAY);
    return;
  }

  // 移除图片上传区域
  function removeThumbnailUploads() {
    $('.thumbnail-list').remove();
  }

  // 1. 创建控制面板 UI
  function createUI() {
    const uiHTML = `
      <div id="ai-auto-review-ui" style="position: fixed; top: 30%; right: 20px; width: 260px; background: #fff; border: 2px solid #e4393c; border-radius: 8px; padding: 15px; z-index: 99999; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-family: 'Microsoft YaHei', sans-serif;">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #e4393c; text-align: center; border-bottom: 1px solid #eee; padding-bottom: 10px;">🤖 AI 自动评价助手</h3>
        <button id="ai-btn-generate" style="width: 100%; padding: 10px; background: #e4393c; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: bold; transition: background 0.3s; margin-bottom: 10px;">手动生成</button>
        <div id="ai-status" style="font-size: 12px; color: #666; min-height: 40px; background: #f8f8f8; padding: 8px; border-radius: 4px; word-wrap: break-word; line-height: 1.5;">状态：等待页面加载...</div>
      </div>
    `;
    $('body').append(uiHTML);

    $('#ai-btn-generate').hover(
      function() { $(this).css('background', '#c81623'); },
      function() { $(this).css('background', '#e4393c'); }
    );

    $('#ai-btn-generate').click(function() {
      startReviewProcess();
    });
  }

  // 2. 更新面板状态
  function updateStatus(text, color = '#666') {
    $('#ai-status').text('状态：' + text).css('color', color);
    console.log('[AI Auto Review]', text);
  }

  // 3. 校验用户是否配置了秘钥
  function checkConfig() {
    if (!API_KEY || API_KEY === '请在此处填入你的API密钥' || API_KEY.trim() === '') {
      updateStatus('❌ 错误：请先在油猴脚本代码中配置您的 API_KEY！', 'red');
      $('#ai-btn-generate').prop('disabled', false).text('请配置秘钥后重试');
      return false;
    }
    return true;
  }

  // 4. 请求 大模型 API
  function generateProductReview(productName, successCallback, errorCallback) {
    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_KEY
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          {
            role: "system",
            content: "你是一名真实的网购买家。我刚买了商品，商品全称是：【" + productName + "】。\n\n请写一段60到100字的商品评价，严格遵守以下纪律：\n1. 必须根据名称推断出它具体是什么东西（比如是保鲜膜、垃圾袋还是零食），然后只评价它该有的特定属性（如保鲜膜就评价粘性/厚度/好撕，垃圾袋评价承重/不漏）。\n2. 绝对禁止使用“物流快”、“客服好”、“包装严实”等万能模板废话。\n3. 不要把商品全名抄一遍，用“这款”、“这个”代替。\n4. 字数必须大于60个字。直接输出纯文本正文，绝对不要有任何前缀或提示语。"
          }
        ]
      })
    })
    .then(function(response) {
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      return response.json();
    })
    .then(function(result) {
      if (result.error) {
        errorCallback(result.error.message || result.error.code || 'API 拒绝请求');
        return;
      }
      var review = result.choices && result.choices.length > 0 ? result.choices[0].message.content : "";
      if (review && review.length > 5) {
        successCallback(review.trim());
      } else {
        errorCallback('返回内容过短或为空');
      }
    })
    .catch(function(e) {
      errorCallback('请求失败: ' + e.message);
    });
  }

  // 5. 从 React 组件上找出 onClick 处理函数
  function getReactOnClick(el) {
    // 方式一：React 18 直接在元素上挂 __reactProps$
    var propsKey = Object.keys(el).find(function (k) {
      return k.indexOf('__reactProps$') === 0;
    });
    if (propsKey) {
      var p = el[propsKey];
      if (p && typeof p.onClick === 'function') return p.onClick;
    }
    // 方式二：沿 fiber 向上找 onClick
    var fiberKey = Object.keys(el).find(function (k) {
      return k.indexOf('__reactFiber$') === 0;
    });
    if (fiberKey) {
      var f = el[fiberKey];
      while (f) {
        var mp = f.memoizedProps;
        if (mp && typeof mp.onClick === 'function') return mp.onClick;
        f = f.return;
      }
    }
    return null;
  }

  // 6. 触发 React 元素点击（多重兜底）
  function triggerReactClick(el) {
    // 优先直接调用 React 的 onClick，绕过事件系统，最可靠
    var onClick = getReactOnClick(el);
    if (onClick) {
      onClick({
        preventDefault: function () {},
        stopPropagation: function () {},
        currentTarget: el,
        target: el
      });
      console.log('[AI Auto Review] 已通过 React onClick 触发点击');
      return;
    }

    // 兜底一：派发完整 pointer/mouse 事件序列
    ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(function (type) {
      el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
    });

    // 兜底二：原生 click
    if (typeof el.click === 'function') {
      el.click();
    }
  }

  // 7. 统一打五星（新版 radio 元素）
  function clickAllFiveStars() {
    var stars = $('div[role="radio"][aria-label="满意值：5星"]:visible');
    console.log('[AI Auto Review] 检测到五星元素数量:', stars.length);
    stars.each(function () {
      triggerReactClick(this);
    });
  }

  // 8. 点击配送骑手「满意」
  function clickRiderSatisfied() {
    var btns = $('button[role="radio"][aria-label="满意"]:visible');
    console.log('[AI Auto Review] 检测到骑手「满意」按钮数量:', btns.length);
    btns.each(function () {
      triggerReactClick(this);
    });
  }

  // 9. 自动点击“发布”按钮并关闭窗口
  function autoClickSubmit() {
    if (!AUTO_SUBMIT) {
      return false;
    }
    var submitBtn = document.querySelector('[class*="index-module__submitBtn"]');
    if (submitBtn) {
      triggerReactClick(submitBtn);
      var delaySec = (AUTO_START_DELAY / 1000).toFixed(1);
      updateStatus('✅ 已自动点击“发布”按钮，' + delaySec + '秒后关闭窗口...', 'green');
      setTimeout(function () {
        window.close();
      }, AUTO_START_DELAY);
      return true;
    }
    return false;
  }

  // 10. 填充 contenteditable 编辑区（新版评价输入框）
  function fillEditor(el, content) {
    el.focus();
    el.textContent = '';
    var inserted = false;
    try {
      inserted = document.execCommand('insertText', false, content);
    } catch (e) {}
    if (!inserted) {
      el.textContent = content;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // 通过原生 value setter 设置 React 受控 textarea 的值（避免被 React 劫持）
  function setTextareaValue(el, value) {
    var setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    if (setter) {
      setter.call(el, value);
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // 11. 递归处理每一个可见的编辑区
  function processNextItem(index) {
    let $editors = $('[class*="TagEditor-module__editor"][contenteditable="true"]').filter(':visible');
    let $names = $('[class*="index-module__skuName"]').filter(':visible');

    if (index >= $editors.length) {
      var delaySec = (AUTO_START_DELAY / 1000).toFixed(1);

      // 先点配送骑手「满意」
      updateStatus('正在点击配送骑手「满意」...', 'blue');
      clickRiderSatisfied();

      if (AUTO_SUBMIT) {
        var submitMsg = '✅ 评价生成完毕！' + delaySec + '秒后自动发布...';
      } else {
        var submitMsg = '✅ 评价生成完毕！请手动点击“发布”按钮提交。';
      }
      updateStatus(submitMsg, 'green');
      $('#ai-btn-generate').prop('disabled', false).text('重新生成');

      if (AUTO_SUBMIT) {
        setTimeout(function () {
          autoClickSubmit();
        }, AUTO_START_DELAY);
      }
      return;
    }

    let nameNode = $names.eq(index);
    let productName = nameNode.text().trim() || '未知商品';
    console.log('[AI Auto Review] 商品名:', productName);

    let shortName = productName.length > 15 ? productName.substring(0, 15) + '...' : productName;
    updateStatus(`正在生成第 ${index + 1}/${$editors.length} 个评价: ${shortName}`, 'blue');

    generateProductReview(productName,
      function(review) {
        fillEditor($editors.eq(index)[0], review);
        setTimeout(function() {
          processNextItem(index + 1);
        }, 1500);
      },
      function(errMsg) {
        updateStatus(`第 ${index + 1} 个失败: ${errMsg}，已填入兜底评价。`, 'red');
        fillEditor($editors.eq(index)[0], "这款商品质量不错，材质很好，做工精细，使用体验满意，五星好评。");
        setTimeout(function() {
          processNextItem(index + 1);
        }, 1500);
      }
    );
  }

  // 12. 等待编辑区出现（点五星后才会渲染）
  function waitForEditor(retry) {
    retry = retry || 0;
    var $editors = $('[class*="TagEditor-module__editor"][contenteditable="true"]').filter(':visible');
    if ($editors.length > 0) {
      updateStatus('检测到 ' + $editors.length + ' 个编辑区，开始填充评价...', 'blue');
      $('#ai-btn-generate').prop('disabled', true).text('处理中...');
      processNextItem(0);
      return;
    }
    if (retry >= 20) {
      updateStatus('等待编辑区超时，请确认五星是否已点亮。', 'red');
      return;
    }
    setTimeout(function () {
      waitForEditor(retry + 1);
    }, 300);
  }

  // 13. 主控制流程
  function startReviewProcess() {
    if (!checkConfig()) return; // 拦截未配置秘钥的情况

    removeThumbnailUploads();

    // 先点五星，触发编辑区渲染
    updateStatus('正在点击五星...', 'blue');
    clickAllFiveStars();

    waitForEditor();
  }

  // 14. 判断是否为 publish 评价页
  function isPublishPage() {
    return location.href.indexOf('pc-static/publish') !== -1;
  }

  // 15. publish 页：主控制流程
  function startPublishReviewProcess() {
    if (!checkConfig()) return;

    removeThumbnailUploads();

    let $textareas = $('textarea.rate-comment-content-textarea');
    if ($textareas.length === 0) {
      updateStatus('未检测到评价输入框，请确认当前在 publish 评价页。', 'red');
      return;
    }

    updateStatus('检测到 ' + $textareas.length + ' 个输入框，开始处理...', 'blue');
    $('#ai-btn-generate').prop('disabled', true).text('处理中...');
    processPublishItem(0);
  }

  // 16. publish 页：递归处理每个 textarea
  function processPublishItem(index) {
    let $textareas = $('textarea.rate-comment-content-textarea');
    let $names = $('.rate-comment-goods-title');

    if (index >= $textareas.length) {
      updateStatus('✅ 评价生成完毕！', 'green');
      $('#ai-btn-generate').prop('disabled', false).text('重新生成');

      if (AUTO_SUBMIT) {
        setTimeout(function () {
          autoPublishSubmit();
        }, AUTO_START_DELAY);
      }
      return;
    }

    let productName = $names.eq(index).text().trim() || '未知商品';
    console.log('[AI Auto Review] 商品名:', productName);

    let shortName = productName.length > 15 ? productName.substring(0, 15) + '...' : productName;
    updateStatus(`正在生成第 ${index + 1}/${$textareas.length} 个评价: ${shortName}`, 'blue');

    generateProductReview(productName,
      function(review) {
        setTextareaValue($textareas.eq(index)[0], review);
        setTimeout(function () {
          processPublishItem(index + 1);
        }, 1500);
      },
      function(errMsg) {
        updateStatus(`第 ${index + 1} 个失败: ${errMsg}，已填入兜底评价。`, 'red');
        setTextareaValue($textareas.eq(index)[0], '这款商品质量不错，材质很好，做工精细，使用体验满意，五星好评。');
        setTimeout(function () {
          processPublishItem(index + 1);
        }, 1500);
      }
    );
  }

  // 17. publish 页：点击发布按钮
  function autoPublishSubmit() {
    if (!AUTO_SUBMIT) return false;
    var submitBtn = document.querySelector('.rate-publish-submit-button');
    if (submitBtn) {
      triggerReactClick(submitBtn);
      updateStatus('✅ 已自动点击“发布”按钮...', 'green');
      setTimeout(function () {
        window.close();
      }, AUTO_START_DELAY);
      return true;
    }
    return false;
  }

  // 18. 页面加载完成后注入 UI 并自动运行
  $(document).ready(function() {
    createUI();

    if (!checkConfig()) {
      return; // 如果未配置秘钥，停止自动运行，面板已标红提示
    }

    var delaySec = (AUTO_START_DELAY / 1000).toFixed(1);
    updateStatus('等待页面加载，' + delaySec + '秒后自动开始...', 'blue');
    setTimeout(function() {
      if (isPublishPage()) {
        startPublishReviewProcess();
      } else {
        startReviewProcess();
      }
    }, AUTO_START_DELAY);
  });
})();
