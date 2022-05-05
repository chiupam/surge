/*

抓包网址：http://yibandw.kmmu.edu.cn/
Surge订阅模块：https://raw.githubusercontent.com/chiupam/surge/main/Surge/Location.sgmodule

###### Surge ######
[Script]
易班定位签到 = type=http-request,pattern=^https:\/\/e\.kmmu\.edu\.cn\/lyuapServer\/v1\/tickets$|^http:\/\/yibandw\.kmmu\.edu\.cn\/caswisedu\/login\.htm$,requires-body=1,max-size=0,script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/Location.js

易班定位签到 = type=http-response,pattern=^http:\/\/yibandw\.kmmu\.edu\.cn\/syt\/other\/index\.htm\?.*,requires-body=1,max-size=0,script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/Location.js

[Mitm]
hostname = %APPEND% e.kmmu.edu.cn, yibandw.kmmu.edu.cn

*/

const $ = Env()
if (typeof $request !== 'undefined') {set()}


async function set() {
  url = $request.url
  if (url.indexOf("ticket") != -1) {
    body = $request.body
    username = body.match(/(username=[^&]*)/)[1].replace(/username=/, "")
    password = body.match(/(password=[^&]*)/)[1].replace(/password=/, "")
    config = `{"name": "my_name", "username": "${username}", "password": "${password}", "uid": "my_uid", "inschool":  true}`
    $.write(config, "location")
  } else if (url.indexOf("login") != -1) {
    uid = decodeURIComponent($request.body.replace(/uid=/, ""))
    config = $.read("location").replace(/my_uid/, uid)
    $.write(config, "location")
  } else {
    body = $response.body
    myname = body.match(/(姓名:[^<]*)/)[1].replace(/姓名:/, "")
    config = $.read("location").replace(/my_name/, myname)
    $.write(config, "location")
    if ($.read("BARK_PUSH")) {
      if ($.read("location_api_open") == 'true') {
        body = encodeURI(JSON.stringify(eval(("("+config+")"))))
        url = `${$.read("serverless_api")}Fast_Location/body?body=${body}`
        await BarkNotify("点击即可快捷签到！", url, url)
      } else {
        await BarkNotify("长按或下拉复制！", config, "http://boxjs.net")
      }
    } else if ($.read("TG_USER_ID") && $.read("TG_BOT_TOKEN")) {
      await tgNotify(config)
      $.notice("易班定位签到", "打开Telegram去复制！", config, "")
      $.write("undefined", "location")
    } else {
      $.notice("易班定位签到", "点击通知栏去复制！", config, "http://boxjs.net")
    }
  }
  $.done()
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


function BarkNotify(body, text, url) {
  $.log(text)
  return new Promise((resolve) => {
    BARK_PUSH = $.read("BARK_PUSH")
    const options = {
      url: `https://api.day.app/push`,
      headers: {'Content-Type': 'application/json; charset=utf-8'},
      body: {
        "body": body,
        "device_key": BARK_PUSH,
        "title": '易班定位签到抓包结果',
        "autoCopy": '1',
        "copy": text,
        "url": url,
        "sound": 'mailsent'
      },
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