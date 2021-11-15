/*

[Script]
# > 青年大学习获取Cookie (home.yngqt.org.cn)
青年大学习获取Cookie = type=http-request,pattern=^https?:\/\/home\.yngqt\.org\.cn\/qndxx\/user\/qiandao\.ashx, ,requires-body=1, max-size=-1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/qndxx.js
# > 青年大学习
青年大学习 = type=cron, cronexp="13 13 13,23 * * *", wake-system=1, timeout=180, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/qndxx.js

[MITM]
hostname = %APPEND% home.yngqt.org.cn

git: https://github.com/chiupam/surge/blob/main/scripts/qndxx.js
raw: https://raw.githubusercontent.com/chiupam/surge/main/scripts/qndxx.js
sgmoudule: https://raw.githubusercontent.com/chiupam/surge/main/Surge/Task.sgmodule

*/

const $ = new Env()
const appName = '🌼 青年大学习 🌼'
const host = "http://home.yngqt.org.cn/"
const difference = $.read("qndxx_difference") * 1 || 42
const study = $.read("qndxx_study")
const cookie = {"Cookie": $.read("qndxx_cookie")}
const num = $.read("qndxx_num") * 1 < 4 ? 4 : $.read("qndxx_num") * 1 || 4
const illustrate = `微信 => 通讯录 => 公众号 => 云南共青团 => 大学习 => 注册团员登录学习 => 我的 => 签到`
typeof $request !== 'undefined' ? set() : sign()

function set() {
  if ($request.headers) {
    $.write($request.headers.Cookie, "qndxx_cookie")
    $.notice(appName, "【成功】写入 cookie 成功！🎉", $request.headers.Cookie)
  } else {
    $.notice(appName, "", "【失败】无法读取 headers 啊，自查原因！🤦‍♂️")
  }
  $.done()
}

function txtid(number) {
  date = new Date()
  beginDate = new Date(date.getFullYear(), 0, 1)
  day = ((date - beginDate) / 86400000) * 1 - 1 + beginDate.getDay()
  number == -1 ? result =  (Math.ceil(day / 7)).toString() : result =  (Math.ceil(day / 7) + difference - number).toString()
  return result
}

function sign() {
  if (cookie) {
    options = {url: `${host}qndxx/user/qiandao.ashx`, headers: cookie}
    $.post(options, (err, resp, data) => {$.log(JSON.parse(data).message)
      if (JSON.parse(data).message.indexOf("登录") != -1) {
        $.notice(appName, `【过期】按下列步骤获取 cookie 噢！🤯`, illustrate)
        $.done()
      } 
      else if (study == "false") {
        $.log(`假期愉快！`)
        $.done()
      }
      else {
        $.log(`周数为：${txtid(-1)} || 差值为：${difference}`)
        const study0 = {url: `${host}qndxx/xuexi.ashx`, headers: cookie, body: {"txtid": txtid(0)}}
        $.post(study0, (err, resp, data) => {$.log(study0.body); $.log(JSON.parse(data).message)
          if (JSON.parse(data).message.indexOf("未填写") != -1) {
            var illustrate = `脚本计算周数为：${txtid(-1)}\n目前使用差值为：${difference}\n点击通知后设置差值！`
            $.notice(appName, JSON.parse(data).message, illustrate, "http://boxjs.net/")
            $.done()
          } else {
            let arr = []
            for (let i = 1; i < num; i++) {arr.push(i)}
            $.log(`学习前面的 ${arr.length + 1} 期青年大学习`)
            for(let i = 0; i　< arr.length; i++) {
              const studyx = {url: `${host}qndxx/xuexi.ashx`, headers: cookie, body: {"txtid": txtid(arr[i])}}
              $.post(studyx, (err, resp, data) => {$.log(JSON.parse(data).message)})
            }
            const studyz = {url: `${host}qndxx/xuexi.ashx`, headers: cookie, body: {"txtid": txtid(arr.length + 2)}}
            $.post(studyz, (err, resp, data) => {$.log(JSON.parse(data).message); $.done()})
          }
        })
      }
    })
  } else {
    $.notice(appName, `【失败】您还没有获取 cookie 呢！🤦‍♂️`, illustrate)
    $.done()
  }
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
