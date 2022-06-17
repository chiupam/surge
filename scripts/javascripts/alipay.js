/**
 * 
 * 脚本说明：提醒支付宝蚂蚁森林收取绿色能量。
 * 建议搭配小米修改步数脚本使用。
 * 
 * type: cron
 * cronexp: 1 1 7 * * *
 * script-path: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/alipay.js
 * timeout: 5
 * 
 */

const $ = new Env()

$.notice(
  "🌲 蚂蚁森林 🌲", 
  "", 
  "点击立马收取296g能量！",
  "alipay://platformapi/startapp?appId=60000002"
)
$.done()

function Env() {
  LN = typeof $loon != "undefined"
  SG = typeof $httpClient != "undefined" && !LN
  QX = typeof $task != "undefined"
  notice = (title, subtitle, message, url) => {
    if (LN) $notification.post(title, subtitle, message, url)
    if (SG) $notification.post(title, subtitle, message, { url: url })
    if (QX) $notify(title, subtitle, message, { "open-url": url })
  }
  done = (value = {}) => {$done(value)}
  return { notice, done }
}