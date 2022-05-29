/*

type: http-request
regex: ^https:\/\/api\-dd\.jd\.com\/client\.action\?functionId=getSessionLog
script-path: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/wskey.js
box: https://raw.githubusercontent.com/chiupam/surge/main/boxjs/chiupam.boxjs.json

###### Surge ######
[Script]
京东获取wskey = type=http-request, pattern=^https:\/\/api\-dd\.jd\.com\/client\.action\?functionId=getSessionLog, requires-body=1, max-size=-1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/wskey.js

[Mitm]
hostname = %APPEND% api-dd.jd.com

###### Loon ######
[Script]
http-request ^https:\/\/api\-dd\.jd\.com\/client\.action\?functionId=getSessionLog script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/wskey.js, requires-body=true, timeout=120, tag=京东获取wskey

[Mitm]
hostname = api-dd.jd.com

###### QuanX ######
[rewrite_local]
^https:\/\/api\-dd\.jd\.com\/client\.action\?functionId=getSessionLog url script-request-header https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/wskey.js

[Mitm]
hostname = api-dd.jd.com

*/

const $ = Env()
if (typeof $request !== 'undefined') {set()}


async function set() {
  if (!$.read("jd_time")) $.write((Date.parse(new Date())/1000 - 20).toString(), 'jd_time')
  if (Date.parse(new Date())/1000 - ($.read("jd_time") * 1)  > 15) {
    cookie = $request.headers.Cookie
    pin = "pin=" + encodeURIComponent(cookie.match(/(pin=[^;]*)/)[1].replace("pin=", "")) + ";"
    wskey = cookie.match(/(wskey=[^;]*)/)[1] + ";"
    jd_wskey = pin + wskey
    $.write((Date.parse(new Date())/1000).toString(), 'jd_time')
    if ($.read("TG_USER_ID") && $.read("TG_BOT_TOKEN")) {
      await tgNotify(jd_wskey)
      $.notice("【京东】", "打开Telegram去复制！", jd_wskey, "")
      $.write("undefined", "jd_wskey")
    } else if ($.read("BARK_PUSH")) {
      await BarkNotify(jd_wskey)
      $.write("undefined", "jd_wskey")
    } else {
      $.notice("【京东】", "点击通知栏去复制！", jd_wskey, "http://boxjs.net")
      $.write(jd_wskey, "jd_wskey")
    }
  }
  $.done()
}


function BarkNotify(text) {
  $.log(text)
  return new Promise((resolve) => {
    BARK_PUSH = $.read("BARK_PUSH")
    const options = {
      url: `https://api.day.app/${BARK_PUSH}`,
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: `title=【京东】&body=长按或下拉复制！&autoCopy=1&copy=${text}&url=http://boxjs.net&sound=mailsent`,
      timeout: 5
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          $.log('Bark APP发送通知调用API失败！！')
          $.log(err)
        } else {
          data = JSON.parse(data)
          if (data.code === 200) {
            $.log('Bark APP发送通知消息成功');
          } else {
            $.log(`${data.message}`)
          }
        }
      } catch (e) {
        $.log(e)
        $.log(resp)
      } finally {
        resolve()
      }
    })
  })
}


function tgNotify(text) {
  $.log(text)
  return  new Promise((resolve) => {
    TG_USER_ID = $.read("TG_USER_ID")
    TG_BOT_TOKEN = $.read("TG_BOT_TOKEN")
    const options = {
      url: `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`,
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: `chat_id=${TG_USER_ID}&text=${text}&disable_web_page_preview=true`,
      timeout: 30000
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          $.log('Telegram Bot发送通知调用API失败！！')
          $.log(err)
        } else {
          data = JSON.parse(data)
          if (data.ok) {
            $.log('Telegram Bot发送通知消息完成')
          } else {
            $.log('Telegram Bot发送通知消息失败！')
          }
        }
      } catch (e) {
        $.log(e)
        $.log(resp)
      } finally {
        resolve()
      }
    })
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
