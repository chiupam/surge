/*

[Script]
# > 掌上飞车 (mwegame.qq.com)
掌上飞车 = type=http-request,pattern=^https:\/\/mwegame\.qq\.com\/ams\/sign\/doSign\/month, ,requires-body=1, max-size=-1 script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/zsfc.js
# > 掌上飞车
掌上飞车 = type=cron, cronexp="10 2 0 * * *", wake-system=1, timeout=180, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/zsfc.js

[MITM]
hostname = %APPEND% mwegame.qq.com

git: https://github.com/chiupam/surge/blob/main/scripts/zsfc.js
raw: https://raw.githubusercontent.com/chiupam/surge/main/scripts/zsfc.js
sgmoudule: https://raw.githubusercontent.com/chiupam/surge/main/Surge/Task.sgmodule

*/

var appName = "掌上飞车"
var $ = new Env()
typeof $request !== 'undefined' ? set() : sign()

function set() {
  $request.url ? $.write($request.url, "zsfc_url") : $.notice(appName, "", "无法读取url")
  $request.headers ? $.write(JSON.stringify($request.headers), "zsfc_headers") : $.notice(appName, "", "无法读取cookie")
  $.done()
}

function sign() {
  const url = {
    url: $.read("zsfc_url"),
    headers: JSON.parse($.read("zsfc_headers"))
  }
  $.get(url, (error, response, data) => {
    try {
      const obj = JSON.parse(data)
      if (obj.status == 1) {
        $.notice(appName, "签到结果: 成功", obj.send_result.sMsg)
      } else if (obj.status == 11) {
        $.notice(appName, "签到结果: 成功（重复）", `说明: ${obj.message}`)
      } else {
        $.notice(appName, "签到结果: 失败", `说明: ${obj.message}`)
      }
    } catch (error) {
      $.log(error)
    } finally {
      $.done()
    }
  })
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
