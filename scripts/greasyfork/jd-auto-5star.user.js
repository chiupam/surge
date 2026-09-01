// ==UserScript==
// @name         京东自动评价（大模型版）
// @namespace    http://tampermonkey.net/
// @version      4.1
// @description  打开页面自动运行，精准识别商品特性生成评价，过滤隐藏元素，一键五星好评。支持按需接入各类大模型（DeepSeek/OpenAI/GLM等）。
// @author       oscar (Modified)
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

  // 1. API 密钥：请勿将密钥写入源码。首次运行时会提示输入，
  //    密钥仅保存在当前浏览器的 localStorage 中，不会出现在脚本代码里。
  const API_KEY_STORAGE_KEY = 'jd_auto_5star_api_key';
  function getApiKey() {
    let key = localStorage.getItem(API_KEY_STORAGE_KEY) || '';
    if (!key) {
      key = (window.prompt('请输入您的 API 密钥（仅保存在本机浏览器，不会写入脚本源码）：') || '').trim();
      if (key) localStorage.setItem(API_KEY_STORAGE_KEY, key);
    }
    return key;
  }
  const API_KEY = getApiKey();

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
  const AUTO_SUBMIT = true;

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
    if (!API_KEY || API_KEY.trim() === '') {
      updateStatus('❌ 错误：未检测到 API 密钥，请刷新页面并在提示框中输入！', 'red');
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

  // 5. 模拟点击五星（兼容 React 事件）
  function simulateClick(el) {
    ['mousedown', 'mouseup', 'click'].forEach(function (type) {
      el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));
    });
  }

  // 6. 统一打五星
  function clickAllFiveStars() {
    $('.star5:visible').each(function () {
      simulateClick(this);
    });
  }

  // 7. 自动点击“发表”按钮并关闭窗口
  function autoClickSubmit() {
    if (!AUTO_SUBMIT) {
      return false;
    }
    var submitBtn = document.querySelector('.btn-submit');
    if (submitBtn) {
      submitBtn.click();
      var delaySec = (AUTO_START_DELAY / 1000).toFixed(1);
      updateStatus('✅ 已自动点击“发表”按钮，' + delaySec + '秒后关闭窗口...', 'green');
      setTimeout(function () {
        window.close();
      }, AUTO_START_DELAY);
      return true;
    }
    return false;
  }

  // 8. 递归处理每一个可见的商品
  function processNextItem(index) {
    let $textareas = $('.f-textarea textarea').filter(':visible');
    let $names = $('.p-name').filter(':visible');

    if (index >= $textareas.length) {
      clickAllFiveStars();
      var delaySec = (AUTO_START_DELAY / 1000).toFixed(1);
      if (AUTO_SUBMIT) {
        var submitMsg = '✅ 评价生成完毕！' + delaySec + '秒后自动提交...';
      } else {
        var submitMsg = '✅ 评价生成完毕！请手动点击“发表”按钮提交。';
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
    let productName = nameNode.find('a').text().trim() || nameNode.text().trim() || "未知商品";
    let shortName = productName.length > 15 ? productName.substring(0, 15) + '...' : productName;

    updateStatus(`正在生成 ${index + 1}/${$textareas.length}: ${shortName}`, 'blue');

    generateProductReview(productName,
      function(review) {
        let $currentTarget = $textareas.eq(index);
        $currentTarget.val(review);
        if ($currentTarget.length > 0) {
          $currentTarget[0].dispatchEvent(new Event('input', { bubbles: true }));
          $currentTarget[0].dispatchEvent(new Event('change', { bubbles: true }));
        }

        setTimeout(function() {
          processNextItem(index + 1);
        }, 1500);
      },
      function(errMsg) {
        updateStatus(`第 ${index + 1} 个失败: ${errMsg}，已填入兜底评价。`, 'red');
        let backupReview = "这款商品的质量非常不错，材质很好，做工精细，实际使用体验远超预期，非常满意的一次购物！";

        let $currentTarget = $textareas.eq(index);
        $currentTarget.val(backupReview);
        if ($currentTarget.length > 0) {
          $currentTarget[0].dispatchEvent(new Event('input', { bubbles: true }));
          $currentTarget[0].dispatchEvent(new Event('change', { bubbles: true }));
        }

        setTimeout(function() {
          processNextItem(index + 1);
        }, 1500);
      }
    );
  }

  // 9. 主控制流程
  function startReviewProcess() {
    if (!checkConfig()) return; // 拦截未配置秘钥的情况

    removeThumbnailUploads();

    let $textareas = $('.f-textarea textarea').filter(':visible');
    if ($textareas.length === 0) {
      updateStatus('未检测到可见的评价输入框，请确保当前在评价页面。', 'red');
      return;
    }

    updateStatus(`检测到 ${$textareas.length} 个商品，准备开始处理...`, 'blue');
    $('#ai-btn-generate').prop('disabled', true).text('处理中...');

    processNextItem(0);
  }

  // 10. 页面加载完成后注入 UI 并自动运行
  $(document).ready(function() {
    createUI();

    if (!checkConfig()) {
      return; // 如果未配置秘钥，停止自动运行，面板已标红提示
    }

    var delaySec = (AUTO_START_DELAY / 1000).toFixed(1);
    updateStatus('等待页面加载，' + delaySec + '秒后自动开始...', 'blue');
    setTimeout(function() {
      startReviewProcess();
    }, AUTO_START_DELAY);
  });
})();
