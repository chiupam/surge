// ==UserScript==
// @name         学堂网自动学习
// @namespace    https://github.com/chiupam
// @version      1.2
// @description  自动检测学堂课程的需学章节并自动播放视频。
// @author       chiupam
// @match        https://picclearning.piccgroup.cn/*
// @icon         https://picclearning-noauth.piccgroup.cn/e810e071-8990-44be-9104-b042a89ece53/image/00d5ac9fba914ba892e806da1d7a16e5.ico
// @grant        none
// @license      GNU GPLv3
// ==/UserScript==

(function() {
  'use strict';

  // 公共函数：动态插入日志容器到页面
  function createLogContainer() {
    const logContainer = document.createElement('div');
    logContainer.id = 'log-container';
    logContainer.style.padding = '10px';
    logContainer.style.backgroundColor = '#333';
    logContainer.style.color = '#fff';
    logContainer.style.border = '2px solid #fff';
    logContainer.style.maxHeight = '200px';
    logContainer.style.maxWidth = '400px';
    logContainer.style.overflowY = 'auto';
    logContainer.style.position = 'fixed';
    logContainer.style.top = '10px';
    logContainer.style.left = '10px';
    logContainer.style.zIndex = '99999';
    logContainer.style.fontFamily = 'Arial, sans-serif';
    logContainer.style.fontSize = '12px';
    logContainer.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';

    document.body.appendChild(logContainer);
    console.log('日志容器已创建');
    
    return logContainer;
  }

  // 公共函数：添加日志到日志容器
  function logPage(logContainer, message) {
    console.log(message);

    const logEntry = document.createElement('div');
    logEntry.textContent = new Date().toLocaleTimeString() + ': ' + message;
    logEntry.style.marginBottom = '5px';
    logEntry.style.whiteSpace = 'nowrap';
    logEntry.style.overflow = 'hidden';
    logEntry.style.textOverflow = 'ellipsis';
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  // 检查所有章节并开始播放需要学习的章节
  function checkAndPlaySections(logContainer) {
    // 内置函数1：检查章节是否需要学习
    function checkSectionNeedsStudy(sectionElement) {
      const sectionText = sectionElement.textContent || sectionElement.innerText;
      const needsStudy = sectionText.includes('需学') || sectionText.includes('需再学');
      console.log('检查章节是否需要学习:', needsStudy, sectionText);
      return needsStudy;
    }

    // 内置函数2：查找视频元素
    function findVideoElement() {
      console.log('开始查找视频元素');
      const playerContainer = document.querySelector('.player-container') || document.querySelector('.video-container') || document.body;
      const videoElement = playerContainer.querySelector('video') || document.querySelector('video');
      console.log('找到视频元素:', videoElement);
      return videoElement;
    }

    // 内置函数3：配置视频播放设置
    function configureVideoPlayback(videoElement, logContainer) {
      logPage(logContainer, '配置视频播放设置(播放速度1.5倍, 音量0, 禁止暂停)');
      videoElement.playbackRate = 1.5; // 设置播放速度为1.5倍速
      Object.defineProperty(videoElement, 'playbackRate', {writable: false, value: 1.5}); // 禁止修改播放速度
      videoElement.volume = 0; // 设置音量为0
      Object.defineProperty(videoElement, 'volume', {writable: false, value: 0}); // 禁止修改音量
      videoElement.addEventListener('pause', function() {this.play()}, true); // 禁止暂停
      startSectionMonitoring(logContainer); // 开始循环监控
    }

    // 内置函数4：持续监控播放页面的学习状态
    function startSectionMonitoring(logContainer) {
      logPage(logContainer, '每5秒检查一次章节学习状态');
      logPage(logContainer, '检查学习计时提醒弹窗、网络波动提示弹窗、倍速播放提示弹窗');

      setInterval(() => {
        const timingAlert = document.querySelector('.alert-wrapper.new-alert-wrapper'); // 检查学习计时提醒弹窗
        if (timingAlert) {
          const confirmButton = timingAlert.querySelector('#D215btn-ok'); // 查找ID为D215btn-ok的确定按钮
          if (confirmButton) {
            try {
              confirmButton.click();
              logPage(logContainer, '检测到学习计时提醒弹窗，已自动点击确定按钮');
            } catch (e) {
              logPage(logContainer, '点击确定按钮错误: ' + e.message);
            }
          }
        }
        
        // 检查网络波动提示弹窗
        const networkAlert = document.querySelector('.alert-wrapper:not(.new-alert-wrapper)');
        if (networkAlert) {
          const alertText = networkAlert.querySelector('.alert-text');
          if (alertText && alertText.textContent.includes('由于网络原因，您的学习状态异常')) {
            logPage(logContainer, '检测到网络波动提示，正在刷新页面...');
            location.reload();
            return; // 提前结束当前循环，避免重复执行
          }
        }
        
        // 检查倍速播放提示弹窗
        const speedAlert = document.querySelector('.alert-wrapper');
        if (speedAlert) {
          const alertText = speedAlert.querySelector('.alert-text');
          if (alertText && alertText.textContent.includes('切换播放倍速，将不会影响您正常学习时长的统计哦~')) {
            const confirmButton = speedAlert.querySelector('#D662btn-ok'); // 查找ID为D662btn-ok的确定按钮
            if (confirmButton) {
              try {
                confirmButton.click();
                logPage(logContainer, '检测到倍速播放提示弹窗，已自动点击确定按钮');
              } catch (e) {
                logPage(logContainer, '点击倍速提示确定按钮错误: ' + e.message);
              }
            }
          }
        }
        
        // 检查当前章节学习状态(因为有些章节没必要学习到完全的视频长度)
        const currentSection = document.querySelector('.chapter-list-box.focus');
        if (currentSection) {
          if (!checkSectionNeedsStudy(currentSection)) {
            logPage(logContainer, '当前章节学习完成，刷新页面以继续'); // 刷新页面
            location.reload();
          }
        }
      }, 5000);
    }
    
    const sections = document.querySelectorAll('.chapter-list-box'); // 获取所有章节元素
    
    if (sections.length === 0) {
      logPage(logContainer, '未找到章节列表');
      return false;
    }

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionTitle = section.querySelector('.chapter-item .text-overflow')?.textContent || '未知章节';
      
      if (checkSectionNeedsStudy(section)) {
        logPage(logContainer, `发现需学章节: ${sectionTitle}`);
        section.click(); // 点击章节开始学习
        setTimeout(() => {
          const videoElement = findVideoElement(); // 等待视频加载
          if (videoElement) {
            configureVideoPlayback(videoElement, logContainer); // 配置视频播放
            videoElement.play().catch(error => {logPage(logContainer, `播放失败: ${error}`)}); // 开始播放
          } else {
            logPage(logContainer, '未找到视频元素');
          }
        }, 2000);
        return true;
      }
    }
    
    logPage(logContainer, '所有章节都已学习完成');
    logPage(logContainer, '3秒后将自动关闭页面');
    
    setTimeout(() => {
      localStorage.setItem('refresh', 'true'); // 标记需要刷新
      window.open('about:blank', '_self').close(); // 关闭当前标签页
    }, 3000); // 延迟3秒后执行
    return false;
  }

  // 初始化视频学习脚本
  function studyInit() {
    const logContainer = createLogContainer(); // 创建日志容器
    logPage(logContainer, 'studyInit函数开始执行');
    // 添加延迟确保页面完全加载
    setTimeout(() => {
      logPage(logContainer, '页面加载完成，开始检查章节');
      checkAndPlaySections(logContainer); // 初始检查所有章节
    }, 3000);
  }

  // 初始化课程详情页面脚本
  function courseInit() {
    const logContainer = createLogContainer(); // 创建日志容器
    logPage(logContainer, 'courseInit函数开始执行');
    
    let hasClickedButton = false; // 标志变量，用于记录是否已经点击过按钮
    const checkInterval = setInterval(() => {checkDOMStatus(logContainer)}, 2000); // 设置定时器定期检查DOM状态
    
    // 30秒后停止检查（作为备用机制）
    const timeoutId = setTimeout(() => {
      clearInterval(checkInterval);
      logPage(logContainer, 'DOM状态检查结束（超时）');
      location.reload(); // 刷新页面
    }, 30000);
    
    // 修改checkDOMStatus函数，添加参数防止重复点击
    function checkDOMStatus(logContainer) {
      logPage(logContainer, '开始检查DOM状态...');
      
      // // 检查当前URL
      // logPage(logContainer, '当前URL: ' + window.location.href);
      
      // 如果已经点击过按钮，则不再继续查找和点击，并停止定时器
      if (hasClickedButton) {
        // logPage(logContainer, '按钮已点击过，跳过本次检查');
        clearInterval(checkInterval); // 立即停止定时器
        clearTimeout(timeoutId); // 清除超时检查
        logPage(logContainer, 'DOM状态检查结束（按钮已点击）');
        return;
      }
      
      let startStudyButton = null; // 尝试多种方式查找"开始学习"按钮
      
      // 使用data-v属性和类名直接查找
      try {
        startStudyButton = document.querySelector('button[data-v-1473d9f3].ant-btn.ant-btn-primary');
        logPage(logContainer, '使用data-v属性和类名查找: ' + (startStudyButton ? '找到按钮' : '未找到'));
      } catch (error) {
        logPage(logContainer, '查找错误: ' + error.message);
      }
      
      // 如果找到按钮，输出按钮信息并尝试点击
      if (startStudyButton) {
        // const btnText = startStudyButton.textContent || startStudyButton.innerText;
        // const btnClass = startStudyButton.className;
        // const btnAttributes = startStudyButton.outerHTML;
        // logPage(logContainer, '找到"开始学习"按钮: 文本="' + btnText + '", 类名="' + btnClass + '"');
        // logPage(logContainer, '按钮完整HTML: ' + btnAttributes);
        
        // 尝试点击按钮
        try {
          logPage(logContainer, '尝试点击"开始学习"按钮...');
          // startStudyButton.scrollIntoView({ behavior: 'smooth', block: 'center' }); // 确保按钮在可视区域内
          startStudyButton.click(); // 点击按钮
          hasClickedButton = true; // 标记按钮已点击
          clearInterval(checkInterval); // 立即停止定时器和超时检查
          clearTimeout(timeoutId); // 清除超时检查
          logPage(logContainer, 'DOM状态检查结束（按钮已点击）');
        } catch (error) {
          logPage(logContainer, '点击按钮错误: ' + error.message);
        }
      }
    };
  }
  
  // 执行脚本的函数
  function executeScript() {
    const url = window.location.href;
    console.log('当前URL: ', url);
    
    // 检查URL是否包含"paas-container"，如果包含则不执行脚本
    if (url.includes('paas-container')) {
      console.log('URL包含paas-container，不执行脚本');
      return;
    }

    // 检查当前URL是否匹配目标路径
    if (url.includes('#/study/course/detail/')) {
      console.log('当前是视频播放页面');
      setTimeout(studyInit, 3000);
    } else if (url.includes('/vue/paas-designer/')) {
      console.log('当前是课程详情页面');
      setTimeout(courseInit, 3000);
    } else {
      console.log('当前URL不匹配目标路径：', window.location.href);
    }
  }
  
  // 页面加载处理 - 采用多种触发机制确保脚本执行
  console.log('脚本已加载，等待页面加载完成...');
  
  // 标记是否已执行过脚本
  let scriptExecuted = false;
  
  // 核心执行函数
  function executeScriptIfNeeded(type) {
    if (!scriptExecuted) {
      scriptExecuted = true;
      console.log(['1. DOMContentLoaded事件触发，执行脚本','2. load事件触发，执行脚本','3. 超时机制，强制执行脚本'][type-1]);
      executeScript();
    }
  }
  
  // 1. DOMContentLoaded事件 - DOM结构加载完成后立即执行
  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM结构加载完成');
    executeScriptIfNeeded(1);
  });
  
  // 2. load事件 - 页面完全加载完成后执行（作为备用）
  window.addEventListener('load', function() {
    console.log('页面完全加载完成');
    executeScriptIfNeeded(2);
  });
  
  // 3. 超时机制 - 如果5秒内没有触发上述事件，则自动执行（防止事件不触发的情况）
  setTimeout(function() {
    if (!scriptExecuted) {
      console.log('5秒超时，强制执行脚本');
      executeScriptIfNeeded(3);
    }
  }, 5000);

})();

// 在第一个页面中，添加以下脚本用于检测 localStorage 变化并执行刷新
if (window.location.href.includes('picclearning.piccgroup.cn') && !window.location.href.includes('paas-container')) {
  window.addEventListener('storage', function(event) {
    if (event.key === 'refresh' && event.newValue === 'true') {
      localStorage.removeItem('refresh');
      location.reload();
    }
  });
}