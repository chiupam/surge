/**
 *
 * 使用方法: 打开打开小程序手动进行一次打卡即可。
 *
 * Surge's Moudule: https://raw.githubusercontent.com/chiupam/surge/main/Surge/Procuratorate.sgmodule
 * BoxJs: https://raw.githubusercontent.com/chiupam/surge/main/boxjs/chiupam.boxjs.json
 *
 * hostname: ????.???????.??
 *
 * type: http-request
 * regex: ^https?://????\.???????\.??/AttendanceCard/SaveAttCheckinout$
 * script-path: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/procuratorate.js
 * requires-body: 1 | true
 *
 * type: cron
 * cron: 1 56,58 8 * * *
 * script-path: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/procuratorate.js
 *
 * type: cron
 * cron: 1 1 17 * * *
 * script-path: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/procuratorate.js

 * =============== Surge ===============
 * 工作打卡Cookie = type=http-request, pattern=^https?://????\.???????\.??/AttendanceCard/SaveAttCheckinout$, requires-body=1, max-size=-1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/procuratorate.js, script-update-interval=0, timeout=30
 * 工作打卡 = type=cron, cronexp="1 56,58 8 * * *", wake-system=1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/procuratorate.js, script-update-interval=0, timeout=60
 * 工作打卡 = type=cron, cronexp="1 1 17 * * *", wake-system=1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/procuratorate.js, script-update-interval=0, timeout=60
 */


const $ = new Env(`🧑‍💼 工作打卡`)
const host = $.read(`procuratorate_host`)
const time = new Date()
const years = time.getFullYear().toString()
const month = (`0` + (time.getMonth() + 1)).slice(-2)
const day = (`0` + time.getDate()).slice(-2)
const hours = (`0` + time.getHours()).slice(-2)
const minutes = (`0` + time.getMinutes()).slice(-2)

let isreq = typeof $request !== 'undefined'
!(async () => {
  if (isreq) {
    let body = $.toObj($request.body)
    let lng = body.model.lng
    let lat = body.model.lat
    $.write(body, `procuratorate_body`)
    $.write(body.model.UnitCode, `procuratorate_UnitCode`)
    $.write(body.model.userID, `procuratorate_userID`)
    $.write(body.model.userDepID, `procuratorate_userDepID`)
    $.write(body.model.Mid, `procuratorate_Mid`)
    $.write(body.model.Num_RunID, `procuratorate_RunID`)
    $.write(lng.substr(0, lng.length - 3), `procuratorate_lng`)
    $.write(lat.substr(0, lat.length - 3), `procuratorate_lat`)
    $.write(body.model.realaddress, `procuratorate_realaddress`)
    $.write(body.model.administratorChangesRemark, `procuratorate_address`)
    $.write($request.headers['cookie'], `procuratorate_cookie`)
    $.write($request.headers['user-agent'], `procuratorate_agent`)
    $.notice($.name, `✅ 写入数据成功`, ``, ``)
  } else {
    if ($.read(`procuratorate_body`)) {
      if (await checkWorkDay()) {
        $.log(`✅ 当天是工作日, 开始打卡`)
        tasks = await checkTasks()
        if (tasks == 0 && checkTime(`08:50`, `09:00`)) {
          await checkIn(`上班打卡`)
        } else if (tasks == 1 && checkTime(`08:50`, `09:00`)) {
          $.log(`⭕ 上班已经打卡`)
        } else if (tasks == 0 && checkTime(`09:01`, `16:59`)) {
          $.log(`⭕ 请自行申请迟到补卡`)
        } else if (tasks == 1 && checkTime(`09:01`, `16:59`)) {
          $.log(`⭕ 下班打卡未到时间`)
        } else if (checkTime(`17:00`, `20:59`)) {
          await checkIn(`下班打卡`)
        } else if (checkTime(`21:00`, `23:59`)) {
          $.log(`⭕ 下班打卡时间已过`)
        } else if (tasks == 0 && checkTime(`00:00`, `08:49`)) {
          $.log(`⭕ 未到打卡时间`)
        } else if (tasks == 2) {
          $.log(`✅ 今天已经全部打卡`)
        } else {
          $.notice($.name, `❌`, `请自行检查运行日志`, ``)
        }
      } else {
        $.log(`⭕ 当天是休息日, 取消打卡`)
      }
    } else {
      $.notice($.name, `⭕`, `首次使用请手动打卡`, ``)
    }
  }
})()
.catch((e) => $.notice($.name, `❌ 未知错误无法打卡`, e, ``))
.finally(() => $.done())

function checkTime(_start, _end){
  let date = `${years}-${month}-${day}`
  let start = new Date(`${date} ${_start}:00`).getTime()
  let end = new Date(`${date} ${_end}:59`).getTime()
  let now = time.getTime()
  return start <= now && now <= end ? true : false
}

function waitTime(_content) {
  let s = Math.round(Math.random() * 30000)
  return new Promise(resolve => {
    $.log(`✅ 获取到${_content}任务`)
    $.log(`💤 休眠 ${s} 毫秒后程序继续...`)
    setTimeout(resolve, s)
  })
}

function checkWorkDay() {
  return new Promise(resolve => {
    const options = {
      url: `http://tool.bitefu.net/jiari/?d=${years + month + day}`,
      timeout: 10000
    }
    $.log(`🧑‍💻 开始检查工作日状态...`)
    $.get(options, (error, response, data) => {
      try {
        if (data) data == `0` ? result = true : result = false
      } catch (e) {
        $.log(`⭕ 请求超时, 读取快速签到设置`)
        result = $.toObj($.read(`procuratorate_fast`))
      } finally {
        resolve(result)
      }
    })
  })
}

function checkTasks() {
  return new Promise(resolve => {
    const options = {
      url: `https://${host}/AttendanceCard/GetAttCheckinoutList?AttType=1&` +
           `UnitCode=${$.read(`procuratorate_UnitCode`)}&` +
           `userid=${$.read(`procuratorate_userID`)}&` +
           `Mid=${$.read(`procuratorate_Mid`)}`,
      timeout: 10000
    }
    $.log(`🧑‍💻 开始检查打卡情况...`)
    $.post(options, (error, response, data) => {
      try {
        if (data) result = $.toObj(data).length
      } catch(e) {
        $.log(`⭕ 请求超时, 读取快速签到设置`)
        if ($.toObj($.read(`procuratorate_fast`))) result = 0
      } finally {
        resolve(result)
      }
    })
  })
}

async function checkIn(_period) {
  let lng = Math.floor(Math.random() * 1000)
  let lat = Math.floor(Math.random() * 1000)
  $.log(`📍 经纬度: ${lat}, ${lng}`)
  await waitTime(_period)
  return new Promise(resolve => {
    const options = {
      url: `https://${host}/AttendanceCard/SaveAttCheckinout`,
      headers: {
        "Host": host,
        "Origin": `https://${host}`,
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "zh-CN,zh-Hans;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "User-Agent": $.read(`procuratorate_agent`),
        "cookie": $.read(`procuratorate_cookie`),
        "Referer": `https://${host}/AttendanceCard/Attendancecard?` +
                   `UnitCode=${$.read(`procuratorate_UnitCode`)}&` +
                   `UserID=${$.read(`procuratorate_userID`)}&` +
                   `appid=103`,
        "X-Requested-With": "XMLHttpRequest"
      },
      body: {
        "model": {
          "Aid": 0,
          "UnitCode": $.read(`procuratorate_UnitCode`),
          "userID": $.read(`procuratorate_userID`),
          "userDepID": $.read(`procuratorate_userDepID`),
          "Mid": $.read(`procuratorate_Mid`) * 1, 
          "Num_RunID": $.read(`procuratorate_RunID`) * 1,
          "lng": $.read(`procuratorate_lng`) + lng,
          "lat": $.read(`procuratorate_lat`) + lat,
          "realaddress": $.read(`procuratorate_realaddress`),
          "iSDelete": 0,
          "administratorChangesRemark": $.read(`procuratorate_address`)
        },
        "AttType": 1
      }
    }
    $.log(`🧑‍💻 开始${_period}...`)
    $.post(options, (error, response, data) => {
      if (data) {
        let localtime = new Date().toLocaleTimeString()
        data = $.toObj(data)
        if (data.success) {
          $.notice(`🧑‍💼 ${_period}`, `✅ 打卡时间: ${localtime}`, `💻 返回数据: ${data.message}`, ``)
          $.write(`false`, `procuratorate_fast`)
          $.log(`✅ ${data.message}`)
        } else {
          $.notice(`🧑‍💼 ${_period}`, `❌ 当前时间: ${localtime}`, `💻 打卡失败, 返回数据: ${$.toStr(data)}`, ``)
          $.log(`❌ ${$.toStr(data)}`)
        }
      }
      resolve()
    })
  })
}

function Env(name) {
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
    if (QX) {url.method = `GET`; $task.fetch(url).then((resp) => cb(null, {}, resp.body))}
  }
  post = (url, cb) => {
    if (LN || SG) {$httpClient.post(url, cb)}
    if (QX) {url.method = 'POST'; $task.fetch(url).then((resp) => cb(null, {}, resp.body))}
  }
  toObj = (str) => JSON.parse(str)
  toStr = (obj) => JSON.stringify(obj)
  log = (message) => console.log(message)
  done = (value = {}) => {$done(value)}
  return { name, read, write, notice, get, post, toObj, toStr, log, done }
}
