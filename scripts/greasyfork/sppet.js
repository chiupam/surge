// ==UserScript==
// @name         中检网自动学习
// @namespace    https://github.com/chiupam
// @version      1.6
// @description  中国检察教育培训网络学院全自动学习课程，点击学习中心，然后进入班级，最后刷新页面即可。
// @author       chiupam
// @match        https://www.sppet.cn/portal/play.do*
// @match        https://www.sppet.cn/examine/index.html*
// @icon         https://www.sppet.cn/examine/data/imgs/favicon.ico
// @grant        none
// @license      GNU GPLv3
// ==/UserScript==
 
(async function () {
  'use strict';
 
  // 动态插入日志容器到页面
  function createLogContainer() {
    const logContainer = document.createElement('div');
    logContainer.id = 'log-container';
    logContainer.style.padding = '10px'; // 设置容器内部的边距为 10px
    logContainer.style.backgroundColor = '#333'; // 设置背景颜色为深灰色
    logContainer.style.color = '#fff'; // 设置文本颜色为白色
    logContainer.style.border = '1px solid #ddd'; // 设置边框为 1px 的浅灰色实线，以区分容器和背景
    logContainer.style.maxHeight = `${window.innerHeight / 3}px`; // 设置容器的最大高度为 200px
    logContainer.style.maxWidth = '400px'; // 设置容器的最大宽度为 400px
    logContainer.style.overflowY = 'auto'; // 当内容超过容器高度时，自动显示垂直滚动条
    logContainer.style.position = 'fixed'; // 固定位置，始终显示在页面上
    logContainer.style.top = `${window.innerHeight / 3}px`; // 设置容器顶部距离页面顶部三分之一窗口高度的位置
    logContainer.style.right = '10px'; // 距离页面右侧10px
    logContainer.style.zIndex = '1000'; // 确保在页面上层显示
 
    document.body.appendChild(logContainer); // 将日志容器添加到页面中
 
    return logContainer;
  }
 
  // 添加日志到日志容器
  function logPage(logContainer, message) {
    console.log(message); // 同时在控制台输出日志
 
    const logEntry = document.createElement('div');
    logEntry.textContent = message; // 设置日志内容
    logEntry.style.whiteSpace = 'nowrap'; // 禁止换行
    logEntry.style.overflow = 'hidden'; // 超出部分隐藏
    logEntry.style.textOverflow = 'ellipsis'; // 超出部分显示省略号
    logContainer.appendChild(logEntry); // 将日志内容添加到日志容器中
    logContainer.scrollTop = logContainer.scrollHeight; // 自动滚动到容器底部
  }
 
  // 格式化日期
  function formatDate() {
    // 获取 UTC 时间的毫秒数，并加上 8 小时的毫秒数 (8 * 60 * 60 * 1000)
    const offsetMilliseconds = 8 * 60 * 60 * 1000;
    const beijingTime = new Date(new Date().getTime() + offsetMilliseconds);
 
    // 格式化为 YYYY-MM-DD HH:MM:SS
    return beijingTime.toISOString().replace('T', ' ').split('.')[0];
  }
 
  // 格式化播放时长
  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600); // 1小时 = 3600秒
    const minutes = Math.floor((seconds % 3600) / 60); // 1分钟 = 60秒
    const secs = Math.floor(seconds % 60); // 余下的秒数
 
    // 使用padStart确保两位数格式，不足两位的补0
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(secs).padStart(2, '0');
 
    if (formattedHours === '00') { // 如果没有小时数，只显示分钟和秒数
      return `${formattedMinutes}:${formattedSeconds}`;
    } else { // 如果有小时数，显示小时、分钟和秒数
      return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
    }
  }
 
  const logContainer = createLogContainer(); // 创建日志容器
  logPage(logContainer, `程序执行时间: ${formatDate()}`);
 
  if (window.location.href.includes('stady_detail')) { // 在学习详情页面执行以下操作
    const intervalId = setInterval(function() {
      const study = document.querySelectorAll('.btn'); // 获取所有继续学习的按钮元素
      const timeElement = document.querySelectorAll('.text_iconTime span:first-child span'); // 获取所有课程时间的元素
      const progress = document.querySelectorAll('.el-progress__text'); // 获取所有进度条的元素
      const name = document.querySelectorAll('.text_title.oneEllipsis'); // 获取所有课程的名称
 
      if (progress.length === 0) location.reload(); // 如果 progress.length 等于0, 刷新页面
 
      let count = 0; // 用于计数已完成课程的数量
      progress.forEach(element => {if (parseFloat(element.textContent.trim()) === 100) count++}); // 如果课程进度为100，计数加1
 
      if (count < progress.length) { // 如果有未完成的课程
        const division = `${count}/${progress.length}` // 计算已完成课程的数量和总课程数量
        const percentage = `${(count / progress.length * 100).toFixed(2)}%`; // 计算已完成课程的百分比
        logPage(logContainer, `总课程完成进度: ${division} (${percentage})`);
 
        // 遍历所有课程，找到未完成的课程并点击继续学习按钮
        for (let i = 0; i < progress.length; i++) {
          let progressFloat = parseFloat(progress[i].textContent.trim()); // 课程进度，转换为浮点数
          logPage(logContainer, `${name[i].textContent.trim()}`);
 
          if (progressFloat < 100) {
            logPage(logContainer, `上述课程进度: ${progressFloat}%，${progressFloat === 0 ? '开始' : '继续'}学习`);
            logPage(logContainer, `若未弹出新窗口, 请检查是否被浏览器拦截`); // 新窗口有可能被拦截, 提示一下用户
            localStorage.setItem('progressFloat', progressFloat); // 将进度保存到 localStorage
            study[i].click(); // 点击继续学习按钮
            break; // 找到并点击按钮后，停止遍历
          } else {
            logPage(logContainer, `上述课程已学完, 跳过`);
          };
        };
      } else {
        logPage(logContainer, '所有课程已完成');
      };
 
      clearInterval(intervalId); // 停止轮询
    }, 3000); // 每隔3秒检查一次
 
  } else if (window.location.href.includes('play.do')) { // 在播放页面执行以下操作
    let percentage = parseFloat(localStorage.getItem('progressFloat')); // 获取进度百分比
 
    let video; // 声明视频变量
    const intervalVideo = setInterval(function() {
      // 延迟获取视频元素，确保页面加载完成
      if (!video) {
        video = document.querySelector('video'); // 获取第一个视频元素
        if (!video) {
          logPage(logContainer, '未找到视频, 等待加载...');
          return; // 如果未找到视频元素，继续等待
        } else {
          clearInterval(intervalVideo); // 视频播放完毕, 停止循环
          logPage(logContainer, '找到视频, 开始监控学习进度');
          video.muted = true; // 强制静音
 
          // 事件监听器：视频播放结束时自动刷新第一个页面并关闭当前窗口
          video.addEventListener('ended', () => {localStorage.setItem('refresh', 'true'); window.close();});
          video.addEventListener('pause', () => {video.play()}); // 事件监听器：视频暂停时自动播放
          video.addEventListener('volumechange', () => {video.muted = true}); // 事件监听器：视频音量变化时强制静音
        }
      }
      
      // 轮询检查 "开始学习" 或 "继续学习" 按钮
      const intervalChoise = setInterval(function() {
        const choise = document.querySelector('.user_choise'); // 获取选项元素
        if (choise) {
          clearInterval(intervalChoise); // 停止轮询
          choise.click(); // 点击 "开始学习" 或 "继续学习" 按钮
        }
      });
 
      // 轮询检查并设置视频播放进度
      const intervalProgress = setInterval(function() {
        if (video.play() && video.duration) {
          clearInterval(intervalProgress); // 停止轮询
          const percentageToFixed = percentage.toFixed(2); // 将进度百分比转换为字符串并保留两位小数
          percentage > 2 ? percentage -= 1.9 : percentage = 0; // 如果进度大于2，则减去2，否则设为0
          video.currentTime = video.duration * (percentage / 100); // 设置视频播放位置
          logPage(logContainer, `已学习: ${formatTime(video.currentTime)}(${percentageToFixed}%)`); // 输出当前播放时间
        }
      })
    }, 1000); // 每1秒检查一次
    
  } else { // 在第一个页面执行以下操作
    logPage(logContainer, '首先请先登录');
    logPage(logContainer, '接着点击学习中心');
    logPage(logContainer, '然后点击进入班级');
    logPage(logContainer, '最后刷新浏览器');
  }
})();
 
// 在第一个页面中，添加以下脚本用于检测 localStorage 变化并执行刷新
if (window.location.href.includes('www.sppet.cn') && !window.location.href.includes('play.do')) {
  window.addEventListener('storage', function(event) {
    if (event.key === 'refresh' && event.newValue === 'true') {
      localStorage.removeItem('refresh');
      location.reload();
    }
  });
}