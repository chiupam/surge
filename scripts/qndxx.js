/*

##### Surge #####
[Script]
# > 青年大学习获取Cookie (home.yngqt.org.cn)
青年大学习获取Cookie = type=http-response, pattern=^http://home\.yngqt\.org\.cn/user/weixin_yngqt\.aspx\?getcode=.*, requires-body=0, timeout=120, max-size=-1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/qndxx.js
# > 青年大学习
青年大学习 = type=cron, cronexp="13 13 13 * 1,2,3,4,5 *", wake-system=1, timeout=180, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/qndxx.js

[MITM]
hostname = %APPEND% home.yngqt.org.cn

##### Loon #####
[Script]
# > 青年大学习获取Cookie (home.yngqt.org.cn)
青年大学习获取Cookie = type=http-response, pattern=^http://home\.yngqt\.org\.cn/user/weixin_yngqt\.aspx\?getcode=.*, requires-body=0, timeout=120, max-size=-1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/qndxx.js
# > 青年大学习
cron "13 13 13 * 1,2,3,4,5 *" script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/qndxx.js, tag=青年大学习

[Mitm]
hostname = home.yngqt.org.cn

##### Settings #####
type: http-response
body: false | 0
raw: https://raw.githubusercontent.com/chiupam/surge/main/scripts/qndxx.js
regex: ^http://home\.yngqt\.org\.cn/user/weixin_yngqt\.aspx\?getcode=.*

type: cron
crontab: 13 13 13 * 1,2,3,4,5 *
raw: https://raw.githubusercontent.com/chiupam/surge/main/scripts/qndxx.js


##### URL #####
git: https://github.com/chiupam/surge/blob/main/scripts/qndxx.js
raw: https://raw.githubusercontent.com/chiupam/surge/main/scripts/qndxx.js
boxjs: https://raw.githubusercontent.com/chiupam/surge/main/boxjs/chiupam.boxjs.json
sgmoudule: https://raw.githubusercontent.com/chiupam/surge/main/Surge/Task.sgmodule
plugin: https://raw.githubusercontent.com/chiupam/surge/main/Loon/qndxx.plugin

*/

const $ = new Env()
const appName = '🌼 青年大学习 🌼'
const host = "http://home.yngqt.org.cn/"
const review = $.read("qndxx_review")
const headers = {
  "Cookie": $.read("qndxx_cookie"),
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.18(0x1800123f) NetType/4G Language/zh_CN"
}
const illustrate = `微信 => 通讯录 => 公众号 => 云南共青团 => 大学习 => 注册团员登录学习`
typeof $request !== 'undefined' ? set() : study()

function set() {
  if ($response.headers) {
    set_cookie = $response.headers["Set-Cookie"]
    set_cookie = set_cookie.match(/DianCMSUser(\S*)/)[1]
    set_cookie = "DianCMSUser" + set_cookie
    $.write(set_cookie, "qndxx_cookie")
    $.notice(appName, "【成功】写入 cookie 成功！🎉", set_cookie)
  }
  $.done()
}

function study() {
  if (!$.read("qndxx_cookie")) {$.notice(appName, `【失败】您还没有获取 cookie 呢！🤦‍♂️`, illustrate); $.done()}
  options = {url: `${host}qndxx/user/qiandao.ashx`, headers: headers}
  $.post(options, (error, response, data) => {check =JSON.parse(data).message
    if (check.indexOf("登录") != -1) {$.notice(appName, `【过期】按下列步骤重新获取！🤯`, illustrate); $.done()}
    else if ($.read("qndxx_study") == "false") {$.log(`假期愉快！🎉`); $.done()}
    else {options = {url: `${host}qndxx/default.aspx`, headers: headers}
      $.get(options, (error, response, data) => {txtid = data.match(/.*study\((\d*)\).*/)[1] * 1
      options = {url: `${host}qndxx/xuexi.ashx`, headers: headers, body: {"txtid": txtid}}
      $.post(options, (error, response, data) => {$.log(`${txtid}, ${JSON.parse(data).message}`)
      if ($.read("qndxx_review") == "true") {
        options = {url: `${host}qndxx/xuexi.ashx`, headers: headers, body: {"txtid": txtid - 1}}
        $.post(options, (error, response, data) => {$.log(`${txtid - 1}, ${JSON.parse(data).message}`)
  })}})}); $.done()}})
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
  get = (url, cb) => {
    if (LN || SG) {$httpClient.get(url, cb)}
    if (QX) {url.method = 'GET'; $task.fetch(url).then((resp) => cb(null, {}, resp.body))}
  }
  post = (url, cb) => {
    if (LN || SG) {$httpClient.post(url, cb)}
    if (QX) {url.method = 'POST'; $task.fetch(url).then((resp) => cb(null, {}, resp.body))}
  }
  put = (url, cb) => {
    if (LN || SG) {$httpClient.put(url, cb)}
    if (QX) {url.method = 'PUT'; $task.fetch(url).then((resp) => cb(null, {}, resp.body))}
  }
  log = (message) => console.log(message)
  done = (value = {}) => {$done(value)}
  return { LN, SG, QX, read, write, notice, get, post, put, log, done }
}
