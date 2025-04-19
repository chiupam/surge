// ==UserScript==
// @name         云南省干部在线学习学院
// @namespace    https://github.com/chiupam
// @version      1.5
// @description  点击播放课程后使用超级鹰打码平台通过验证, 并自动播放
// @author       chiupam
// @match        https://www.ynsgbzx.cn/index.aspx
// @match        https://www.ynsgbzx.cn//index.aspx
// @match        https://www.ynsgbzx.cn//login.aspx*
// @match        https://www.ynsgbzx.cn/userpage.aspx
// @match        https://www.ynsgbzx.cn//userpage.aspx
// @match        https://www.ynsgbzx.cn/play/play.aspx*
// @match        https://www.ynsgbzx.cn/play/right.html*
// @match        https://www.ynsgbzx.cn/play/Right1.aspx*
// @icon         https://www.ynsgbzx.cn/favicon.ico
// @grant        GM_xmlhttpRequest
// @license      GNU GPLv3
// ==/UserScript==
 
(async function() {
  'use strict';
  
  // 云南省干部在线学习学院登录账号密码
  const loginUserName = "";
  const loginPassWord = "";
 
  // 超级鹰打码设置，具体参考 https://www.chaojiying.com/api-5.html
  const codeUserName = "";
  const codePassWord = "";
  const codeSoftId = "";
 
  // 1: 支持非首页课程播放, 但占用更多内存 2: 占用更少内存, 但不支持非首页课程播放
  const studyType = 1; 
 
  // 动态插入日志容器到页面，支持彻底删除已有容器
  function createLogContainer(clearLogs = false) {
    const existingLogContainer = document.getElementById('log-container');
 
    // 如果容器已存在且clearLogs为true，则彻底移除该容器
    if (existingLogContainer && clearLogs) {
      existingLogContainer.remove(); // 删除日志容器
      return null; // 返回null以表明容器已删除
    } 
    
    // 如果容器不存在，则创建新容器
    if (!existingLogContainer) {
      const logContainer = document.createElement('div');
      logContainer.id = 'log-container';
      logContainer.style.padding = '10px';
      logContainer.style.backgroundColor = '#333';
      logContainer.style.color = '#fff';
      logContainer.style.border = '1px solid #ddd';
      logContainer.style.maxHeight = `${window.innerHeight / 3}px`;
      logContainer.style.maxWidth = '400px';
      logContainer.style.overflowY = 'auto';
      logContainer.style.position = 'fixed';
      logContainer.style.top = `${window.innerHeight / 10}px`;
      logContainer.style.left = '10px';
      logContainer.style.zIndex = '1000';
 
      document.body.appendChild(logContainer); // 将日志容器添加到页面中
      return logContainer;
    }
    
    return existingLogContainer; // 返回已存在的容器
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
 
  async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
 
  function findElement(xpath) {
    return document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
  }
 
  // 生成随机浮点数数组
  function generateFloatNumbers(strLength) {
    const minValue = 0.6; // 生成随机浮点数的下限
    const maxValue = 0.9; // 生成随机浮点数的上限
    const targetMinSum = strLength * 0.5; // 生成随机浮点数的总和下限
    const targetMaxSum = strLength * 1.6; // 生成随机浮点数的总和上限
 
    let numbers; // 生成的随机浮点数数组
    let totalSum; // 随机浮点数的总和
 
    do {
      numbers = []; // 清空数组
      totalSum = 0; // 重置总和
 
      for (let i = 0; i < strLength; i++) {
        const randomFloat = Math.random() * (maxValue - minValue) + minValue; // 生成一个在 minValue 和 maxValue 之间的随机浮点数
        numbers.push(randomFloat); // 将生成的随机浮点数添加到数组中
        totalSum += randomFloat; // 计算随机浮点数的总和
      }
    } while (totalSum < targetMinSum || totalSum > targetMaxSum); // 如果随机浮点数的总和不在 targetMinSum 和 targetMaxSum 之间，则重新生成随机浮点数
 
    return numbers; // 返回生成的随机浮点数数组
  }
 
  // 输入字符串
  async function enterStrings(string, inputFieldXpath, submitButtonXpath = null) {
    const inputField = findElement(inputFieldXpath); // 获取输入框元素
 
    if (inputField) {
      await sleep(Math.random() * 800); // 随机等待 0.8 秒
      inputField.click(); // 点击输入框
      inputField.value = ''; // 清空输入框内容
      const sleepTimeList = generateFloatNumbers(string.length); // 生成随机浮点数数组
      for (let i = 0; i < string.length; i++) {
        await sleep(sleepTimeList[i] * 1000); // 根据随机浮点数数组中的值，等待相应的时间
        inputField.value += string[i]; // 输入字符
      };
 
      // 如果存在提交按钮元素, 则点击提交按钮
      if (submitButtonXpath) {
        const submitButton = findElement(submitButtonXpath); // 获取提交按钮元素
        if (submitButton) {
          await sleep(Math.random() * 800); // 随机等待 0.8 秒
          submitButton.click(); // 点击提交按钮
        }
      }
    }
  }
 
  // 超级鹰打码
  function uploadImageToServer(imgBase64) {
    return new Promise(function(resolve, reject) {
      GM_xmlhttpRequest({
        method: 'POST',
        url: 'https://upload.chaojiying.net/Upload/Processing.php',
        headers: {
          'Content-Type': 'application/json'
        },
        data: JSON.stringify({
          user: codeUserName, // 用户名
          pass: codePassWord, // 密码
          softid: codeSoftId, // 软件ID
          codetype: '4004', // 验证码类型
          file_base64: imgBase64, // 图片的base64编码
        }),
        onload: function(response) {
          const jsonResponse = JSON.parse(response.responseText);
          resolve(jsonResponse.pic_str);  // 请求成功时返回数据
        },
        onerror: function(error) {
          reject('请求出错: ' + error);
        }
      });
    });
  }
 
  function captureImageDataURL(imageElement) {
    const canvas = document.createElement('canvas'); // 创建一个canvas元素
    canvas.width = imageElement.width; // 设置canvas的宽度为图片的宽度
    canvas.height = imageElement.height; // 设置canvas的高度为图片的高度
    const ctx = canvas.getContext('2d'); // 获取canvas的2D绘图上下文
    ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height); // 将图片绘制到canvas上
    const imageDataURL = canvas.toDataURL('image/png'); // 将canvas内容转换为base64编码的PNG图片
    return imageDataURL.split(',')[1]; // 返回base64编码的图片数据
  }
 
  const allCredentialsFilled = loginUserName && loginPassWord && codeUserName && codePassWord && codeSoftId; // 检查所有凭据是否已填写
  const currentURL = window.location.href; // 获取当前页面的URL
  const channel = new BroadcastChannel('page-control-channel'); // 创建一个新的广播频道
  window.addEventListener('load', async function() {
 
    if (currentURL.includes("index.aspx") && allCredentialsFilled) {
      // 首页触发登录行为
      if (document.querySelector("#go")) {
        window.location.href = 'https://www.ynsgbzx.cn/userpage.aspx'
      } else {
        const logContainer = createLogContainer(); // 创建日志容器
        logPage(logContainer, `程序执行时间: ${formatDate()}`); // 记录日志
        const ImageCheck = findElement('//*[@id="ImageCheck"]'); // 获取验证码图片元素
        logPage(logContainer, `账号: ${loginUserName}`); // 记录日志
        await enterStrings(loginUserName, '//*[@id="LoginView1_Login1_UserName"]'); // 输入账号
        logPage(logContainer, `密码: ${loginPassWord}`); // 记录日志
        await enterStrings(loginPassWord, '//*[@id="LoginView1_Login1_Password"]'); // 输入密码
        const imageDataURL = captureImageDataURL(ImageCheck); // 获取验证码图片的base64编码
        const picStrValue = await uploadImageToServer(imageDataURL); // 上传验证码图片到服务器并获取识别结果
        logPage(logContainer, `验证码: ${picStrValue}`); // 记录日志
        await enterStrings(
          picStrValue, // 验证码字符串
          '//*[@id="LoginView1_Login1_txtValidate"]',
          '//*[@id="LoginView1_Login1_LoginButton"]'
        ); // 输入验证码并点击登录按钮
      }
 
    } else if (currentURL.includes('login.aspx') && allCredentialsFilled) {
      // 未登录状态下点击 "个人空间" 时触发
      const logContainer = createLogContainer(); // 创建日志容器
      logPage(logContainer, `程序执行时间: ${formatDate()}`); // 记录日志
      const ImageCheck = findElement('//*[@id="ImageCheck"]'); // 获取验证码图片元素
      logPage(logContainer, `账号: ${loginUserName}`); // 记录日志
      await enterStrings(loginUserName, '//*[@id="Login1_UserName"]'); // 输入账号
      logPage(logContainer, `密码: ${loginPassWord}`); // 记录日志
      await enterStrings(loginPassWord, '//*[@id="Login1_Password"]'); // 输入密码
      const imageDataURL = captureImageDataURL(ImageCheck); // 获取验证码图片的base64编码
      const picStrValue = await uploadImageToServer(imageDataURL); // 上传验证码图片到服务器并获取识别结果
      logPage(logContainer, `验证码: ${picStrValue}`); // 记录日志
      await enterStrings(picStrValue, '//*[@id="Login1_txtValidate"]', '//*[@id="Login1_LoginButton"]'); // 输入验证码并点击登录按钮
 
    } else if (currentURL.includes('userpage.aspx') && !currentURL.includes('login.aspx')) {
      channel.onmessage = (event) => event.data.action === 'refreshPage' && location.reload();
 
      // 登录状态下点击 "个人空间" 时触发
      const logContainer = createLogContainer(); // 创建日志容器
      logPage(logContainer, `程序执行时间: ${formatDate()}`); // 记录日志
      const markElement = document.querySelector("#navbar > ul.nav.navbar-nav.navbar-right > li.hidden-sm > mark");
      const hoursText = markElement.textContent; // 获取学时文本内容
      if (hoursText === "10分") {
        return logPage(logContainer, `您今日获得学时已达上限10分`); // 如果已获得10分学时，则退出函数
      } else {
        const learnedHoursMatch = hoursText.match(/(\d+(\.\d+)?)/); // 匹配数字及小数部分
        logPage(logContainer, `您今日已获得学时 ${learnedHoursMatch[1]}/10 学时`); // 记录日志
      }
      
      const rows = document.querySelectorAll('tbody tr'); // 获取所有课程行
      for (var i = 0; i < rows.length; i++) { // 遍历所有课程行
        var courseName = rows[i].querySelector('input[type="hidden"]').value; // 获取课件名称
        var progress = rows[i].querySelector('.progress-bar').textContent.trim(); // 获取学习进度
        var playButton = rows[i].querySelector('a[href*="redirect.aspx"]'); // 获取播放按钮
        if (progress !== '100%') { // 如果学习进度不是100%
          logPage(logContainer, `课件名称: ${courseName}`); // 记录日志
          logPage(logContainer, `学习进度: ${progress}, 准备学习该课程`); // 记录日志
          for (let i = 5; i > 0; i--) {
            if (i % 2 !== 0) logPage(logContainer, `${i}秒后进入学习`); // 仅在奇数秒时记录日志
            await sleep(975); // 等待接近1秒
          }
          // 读取 sutdyType 的值判断使用哪种方式进入学习页面
          return studyType === 1 ? playButton.click() : window.location.href = playButton.getAttribute('href');
        }
      }
 
      if (studyType === 1) {
        logPage(logContainer, `本页课程已全部学完`); // 记录日志
        logPage(logContainer, `如果有其他页, 请手动翻页`); // 记录日志
      } else {
        logPage(logContainer, `第一页全部课件已经学完`); // 记录日志
        logPage(logContainer, `请在 "课件中心" 内新选课件`); // 记录日志
        logPage(logContainer, `暂无法学习非第一页的课件`); // 记录日志
      }
 
    } else if (currentURL.includes('play.aspx')) {
      // 重写alert函数，当弹出提示框时根据用户设置执行相应操作
      unsafeWindow.alert = () => { 
        if (studyType === 1) {
          channel.postMessage({ action: 'refreshPage' });
          return window.close(); // 关闭当前页面
        }
        window.location.href = "https://www.ynsgbzx.cn/userpage.aspx"; 
      };
 
      // 针对收到不同信号的处理
      channel.onmessage = async (event) => {
        if (event.data.action === 'closePlayPage') {
          window.close(); // 接收到关闭信号时关闭页面
        } else if (event.data.action === 'href') {
          window.location.href = "https://www.ynsgbzx.cn/userpage.aspx";
        }
      };
 
      const logContainer = createLogContainer(); // 创建日志容器
      logPage(logContainer, `程序执行时间: ${formatDate()}`); // 记录日志
 
      if (codeUserName && codePassWord && codeSoftId) {
        const ImageCheck = findElement('//*[@id="ImageCheck"]'); // 获取验证码图片元素
        const imageDataURL = captureImageDataURL(ImageCheck); // 获取验证码图片的base64编码
        const picStrValue = await uploadImageToServer(imageDataURL); // 上传验证码图片到服务器并获取识别结果
        logPage(logContainer, `验证码: ${picStrValue}`); // 记录日志
        await enterStrings(picStrValue, '//*[@id="validanswer"]', '//*[@id="btnvalidanswer"]'); // 输入验证码并点击验证按钮
        createLogContainer(true); // 删除日志容器
      } else {
        logPage(logContainer, `无法完成自动打码, 请选择进行以下操作`); // 记录日志
        logPage(logContainer, `1、在脚本中填写超级鹰打码的相关参数`); // 记录日志
        logPage(logContainer, `2、手动输入验证码并提交`); // 记录日志
      }
    } else if (currentURL.includes('right.html')) {
      // 移除无用标签页
      channel.onmessage = (event) => {
        if (event.data.action === 'remove') {
          document.querySelector("body > div.jumbotron.yx-page-jumbotron").remove();
          document.querySelector("body > div.main_box > div.play_kcnr").remove()
        }
      };
    } else if (currentURL.includes('Right1.aspx')) {
      // 进入真实播放页面时触发
      const logContainer = createLogContainer(); // 创建日志容器
      logPage(logContainer, `程序执行时间: ${formatDate()}`); // 记录日志
      var video; // 声明视频变量
      const intervalVideo = setInterval(() => {
        // 延迟获取视频元素，确保页面加载完成
        if (!video) {
          video = document.querySelector('video'); // 获取第一个视频元素
          if (!video) {
            logPage(logContainer, '未找到视频, 等待加载...');
            return; // 如果未找到视频元素，继续等待
          } else {
            clearInterval(intervalVideo); // 视频播放完毕, 停止循环
            logPage(logContainer, '找到视频, 开始监控学习进度');
            channel.postMessage({ action: 'remove' });
          }
        }
 
        video.muted = true; // 强制静音
        if (video.paused) {video.play();} // 播放视频
 
        // 轮询检查并设置视频播放进度
        const lnode = document.querySelector("#lnode");
        if (lnode) {
          const intervalProgress = setInterval(function() {
            let percentage; // 计算进度
            if (video.paused) {
              video.play(); // 播放视频
              return; // 如果视频暂停，则继续播放
            } else {
              clearInterval(intervalProgress); // 停止轮询
              const content = lnode.textContent; // 获取文本内容
              const startIndex = content.indexOf('：') + 1; // 找到冒号的位置
              const endIndex = content.indexOf('-', startIndex); // 从冒号后面开始获取字符串，并找到第一个 '-' 的位置
              const number = content.substring(startIndex, endIndex).trim(); // 提取数字
              percentage = (number * 60 / video.duration) * 100; // 计算进度
              const percentageToFixed = percentage.toFixed(2); // 将进度百分比转换为字符串并保留两位小数
              percentage > 1 ? percentage -= 1 : percentage = 0; // 如果进度大于1，则减去1，否则设为0
              video.currentTime = video.duration * (percentage / 100); // 设置视频播放位置
              logPage(logContainer, `已学习: ${formatTime(video.currentTime)}(${percentageToFixed}%)`); // 输出当前播放时间
            }
          });
        }
        
        // 进度监听器的实现
        const milestones = [0.24, 0.49, 0.74, 0.99]; // 定义进度百分比
        let milestoneIndex = 0; // 当前进度索引
        function handleTimeUpdate() {
          const progress = video.currentTime / video.duration;
          if (progress >= milestones[milestoneIndex]) {
            logPage(logContainer, `视频播放达到${milestones[milestoneIndex] * 100}%`);
            milestoneIndex++;
            if (milestoneIndex >= milestones.length) {
              video.removeEventListener('timeupdate', handleTimeUpdate);
            }
          }
        }
 
        // 事件监听器部分
        video.addEventListener('ended', () => {
          studyType === 1 // 判断使用何种方式进行重定向
            ? (channel.postMessage({ action: 'refreshPage' }), channel.postMessage({ action: 'closePlayPage' }))
            : channel.postMessage({ action: 'href' });
        }); // 事件监听器：视频播放结束时
        video.addEventListener('pause', () => {video.play()}); // 事件监听器：视频暂停时自动播放
        video.addEventListener('volumechange', () => {video.muted = true}); // 事件监听器：视频音量变化时强制静音
        video.addEventListener('timeupdate', handleTimeUpdate); // 事件监听器：已学习的进度
      }, 1000); // 每秒检查一次
    }
  });
 
})();