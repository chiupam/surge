/*

[Script]
# https://xg.kmmu.edu.cn/SPCP/Web/Report/Index
# > 昆明医科大学疫情签到获取Cookie (xg.kmmu.edu.cn)
昆明医科大学疫情签到获取Cookie = type=http-request,pattern=^https?:\/\/xg\.kmmu\.edu\.cn\/SPCP\/Web\/Report\/Index, requires-body=1, max-size=-1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/epidemic_gdufe.js
# > 昆明医科大学疫情签到
昆明医科大学疫情签到 = type=cron, cronexp="0 30 6 * * *", wake-system=1, timeout=180, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/epidemci_kmmu.js

[MITM]
hostname = %APPEND% xg.kmmu.edu.cn

git: https://github.com/chiupam/surge/blob/main/scripts/epidemci_kmmu.js
raw: https://raw.githubusercontent.com/chiupam/surge/main/scripts/epidemci_kmmu.js
sgmoudule: https://raw.githubusercontent.com/chiupam/surge/main/Surge/Task.sgmodule

*/

var $ = new Env()
var appName = `🌼 昆明医科大学疫情签到 🌼`
var host = `https://xg.kmmu.edu.cn/`
typeof $request !== 'undefined' ? set() : sign()

function set() {
  if ($request.headers) {
    $.write($request.headers.Cookie, "kmmu_cookie")
    $.write($response.body, "kmmu_body")
    $.notice(appName, "【成功】写入 Cookie 和 Body 成功！🎉", ``)
  } else {
    $.notice(appName, "", "【失败】无法读取 headers 啊，自查原因！🤦‍♂️")
  }
  $.done()
}

function sign() {
  var Cookie = $.read("kmmu_cookie")
  var Body = $.read("kmmu_body")
  var illustrate = `点击通知栏 => 登录 => 手动签到`
  if (Cookie && Body) {
    const options = {
      url: `${host}SPCP/Web/Report/Index`, 
      headers: {"Cookie": Cookie},
      body: body()
    }
    $.post(options, (err, resp, data) => {
      if (data.indexOf("成功") != -1) {
        $.notice(appName, `【成功】今日签到成功！`, ``, `${host}SPCP/Web/Report/Index`)
      } else if (data.indexOf("登录") != -1) {
        $.notice(appName, `【过期】请点击重新登录签到！`, ``, `${host}SPCP/Web/`)
      } else if (data.indexOf("当前采集日期已登记！" != -1)) {
        $.notice(appName, `【重复】当前采集日期已登记！`, ``, `${host}SPCP/Web/Report/Index`)
      } else if (data.indexOf("只能1点至18点可以填报") != -1) {
        $.notice(appName, `【失败】未在签到时间！`, ``, `${host}SPCP/Web/Report/Index`)
      } else if (data.indexOf("填报信息还未配置或开启") != -1) {
        $.notice(appName, `【严重】填报信息还未配置或开启！`, ``, `${host}SPCP/Web/Report/Index`)
      } else {
        $.notice(appName, `【严重】发生其他类型严重错误，无法完成签到！`, `建议点击通知栏自查一下！`, `${host}SPCP/Web/`)
      }
    })
  } else if (!Cookie) {
    $.notice(appName, `【错误】还没获取 Cookie 的值！🤦‍♂️`, illustrate, `${host}SPCP/Web/`)
  } else {
    $.notice(appName, `【错误】还没获取 Body 的值！🤦‍♂️`, illustrate, `${host}SPCP/Web/`)
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