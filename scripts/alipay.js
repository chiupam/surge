/*

[Script]
# > 支付宝
支付宝 = type=cron,cronexp="0 30 7 * * *", wake-system=1, timeout=180, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/alipay.js


git: https://github.com/chiupam/surge/blob/main/scripts/alipay.js
raw: https://raw.githubusercontent.com/chiupam/surge/main/scripts/alipay.js
sgmoudule: https://raw.githubusercontent.com/chiupam/surge/main/Surge/Task.sgmodule

*/

const $ = new Env()

$.notice("🌲 蚂蚁森林 🌲", "", "点击立马收取296g能量！", "alipay://platformapi/startapp?appId=60000002")
/*
sleep(6000) // 1000=1S
$.notice("🐥 蚂蚁庄园 🐥", "", "", "alipays://platformapi/startapp?appId=66666674")
*/
$done()

/*
function sleep(milliSeconds) {
  var startTime = new Date().getTime()
  while (new Date().getTime() < startTime + milliSeconds) {}
}
*/

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