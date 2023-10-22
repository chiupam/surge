/**
 * 
 * 脚本说明：抓取网页版百度贴吧Cookie
 * 抓取网页：https://tieba.baidu.com/index/
 * 搭配脚本：https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/script/tieba/tieba_checkin.js
 * 
 * hostname: tieba.baidu.com
 * 
 * type: http-request
 * regex: ^https?://tieba\.baidu\.com/mo/q/getUpConfigData
 * path: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/tieba.js
 * 
 * type: cron
 * cron: 0 0 0 * * *
 * path: https://raw.githubusercontent.com/blackmatrix7/ios_rule_script/master/script/tieba/tieba_checkin.js
 * 
 */

const $ = Env()
if (typeof $request !== 'undefined') start()

async function start() {
  cookie = $request.headers.Cookie
  if (cookie.indexOf('BDUSS') != -1) {
    $.write(cookie, `tieba_signin_cookie`)
    $.log(cookie)
  }
  $.done()
}

function Env() {
  LN = typeof $loon != "undefined"
  SG = typeof $httpClient != "undefined" && !LN
  QX = typeof $task != "undefined"
  read = (key) => {
    if (LN || SG) return $persistentStore.read(key)
    if (QX) return $prefs.valueForKey(key)
  }
  write = (key, val) => {
    if (LN || SG) return $persistentStore.write(key, val);
    if (QX) return $prefs.setValueForKey(key, val)
  }
  notice = (title, subtitle, message, url) => {
    if (LN) $notification.post(title, subtitle, message, url)
    if (SG) $notification.post(title, subtitle, message, { url: url })
    if (QX) $notify(title, subtitle, message, { "open-url": url })
  }
  log = (message) => console.log(message)
  done = (value = {}) => {$done(value)}
  return { read, write, notice, log, done }
}
