/**
 * 蚂蚁森林能量通知用户收取脚本
 */

// 创建Env对象
const $ = new Env(`🌲 蚂蚁森林收能量`);

// 发送通知
$.notice(
  $.name, // 标题
  "", // 副标题
  "点击立马收取296g能量！", // 消息内容
  "alipay://platformapi/startapp?appId=60000002" // 跳转链接
);

// 完成脚本
$.done();

/**
 * 创建Env对象
 * @returns {Object} 包含notice和done方法的对象
 */
function Env(name) {
  // 判断运行环境
  LN = typeof $loon != "undefined"; // Loon
  SG = typeof $httpClient != "undefined" && !LN; // Surge
  QX = typeof $task != "undefined"; // Quantumult X

  // 发送通知
  notice = (title, subtitle, message, url) => {
    if (LN) $notification.post(title, subtitle, message, url); // Loon
    if (SG) $notification.post(title, subtitle, message, { url: url }); // Surge
    if (QX) $notify(title, subtitle, message, { "open-url": url }); // Quantumult X
  };

  // 完成脚本
  done = (value = {}) => {
    $done(value);
  };

  // 返回对象
  return { name, notice, done };
}
