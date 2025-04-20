/**
 * 
 * 使用方法：添加 Surge 模块后，打开 http://yibandw.kmmu.edu.cn/ 并完成登录即可。
 * 
 * Surge's Moudule: https://raw.githubusercontent.com/chiupam/surge/main/platforms/Surge/Location.sgmodule
 * 
 * hostname: e.kmmu.edu.cn, yibandw.kmmu.edu.cn
 * 
 * type: http-request
 * regex: ^https?://e\.kmmu\.edu\.cn/lyuapServer/v1/tickets$|^https?://yibandw\.kmmu\.edu\.cn/caswisedu/login\.htm$
 * script-path: https://raw.githubusercontent.com/chiupam/surge/main/platforms/Surge/Location.js
 * requires-body: 1 | true
 * 
 * type: http-response
 * regex: ^https?://yibandw\.kmmu\.edu\.cn/syt/other/index\.htm\?.*
 * script-path: https://raw.githubusercontent.com/chiupam/surge/main/platforms/Surge/Location.js
 * requires-body: 1 | true
 * 
 * =============== Surge ===============
 * 易班定位签到 = type=http-request, pattern^https?://e\.kmmu\.edu\.cn/lyuapServer/v1/tickets$|^https?://yibandw\.kmmu\.edu\.cn/caswisedu/login\.htm$, requires-body=1, max-size=0, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascript/Location.js, script-update-interval=0, timeout=30
 * 易班定位签到 = type=http-response, pattern=^https?://yibandw\.kmmu\.edu\.cn/syt/other/index\.htm\?.*, requires-body=1, max-size=0, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascript/Location.js, script-update-interval=0, timeout=30
 * 
 */

const $ = Env()
const bark_token = $.read("BARK_PUSH")
const fast = $.read("location_api_open")
if (typeof $request !== 'undefined') set()


async function set() {
  if ($request.url.indexOf("ticket") != -1) {
    body = $request.body
    username = body.match(/(username=[^&]*)/)[1].replace(/username=/, "")
    password = body.match(/(password=[^&]*)/)[1].replace(/password=/, "")
    config = `{"name": "my_name", "username": "${username}", "password": "${password}", "uid": "my_uid", "inschool":  true}`
    $.write(config, "location_cache")
  } else if ($request.url.indexOf("login") != -1) {
    body = $request.body
    uid = decodeURIComponent(body.replace(/uid=/, ""))
    $.write($.read("location_cache").replace(/my_uid/, uid), "location_cache")
  } else {
    body = $response.body
    myname = body.match(/(姓名:[^<]*)/)[1].replace(/姓名:/, "")
    config = $.read("location_cache").replace(/my_name/, myname)
    if (bark_token) {
      if (fast == 'true') {
        $.write("undefined", "location")
        body = encodeURI(JSON.stringify(eval(("("+config+")"))))
        url = `${$.read("serverless_api")}Fast_Location/body?body=${body}`
        await BarkNotify("点击即可快捷签到！", url, url)
      } else {
        $.write(config, "location")
        await BarkNotify("长按或下拉复制！", config, "http://boxjs.net")
      }
    } else {
      $.notice("易班定位签到", "点击通知栏去复制！", config, "http://boxjs.net")
    }
  }
  $.done()
}


function BarkNotify(body, text, url) {
  $.log(text)
  return new Promise((resolve) => {
    const options = {
      url: `https://api.day.app/push`,
      headers: {'Content-Type': 'application/json; charset=utf-8'},
      body: {
        "body": body,
        "device_key": bark_token,
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