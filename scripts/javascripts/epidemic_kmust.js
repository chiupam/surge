/**
 * 
 * 使用方法：打开我在校园，点击日检日报即可。
 * 
 * Surge's Moudule: https://raw.githubusercontent.com/chiupam/surge/main/Surge/KMUST.sgmodule
 * BoxJs: https://raw.githubusercontent.com/chiupam/surge/main/boxjs/chiupam.boxjs.json
 * 
 * hostname: student.wozaixiaoyuan.com
 * 
 * type: http-request
 * regex: ^https?://student\.wozaixiaoyuan\.com/heat/getTodayHeatList\.json
 * script-path: https://raw.githubusercontent.com/chiupam/surge/main/Surge/KMUST.js
 * requires-body: 1 | true
 * 
 * type: cron
 * cron: 1 0 7,12,22 * * *
 * script-path: https://raw.githubusercontent.com/chiupam/surge/main/Surge/KMUST.js
 * 
 * =============== Surge ===============
 * 昆工疫情SESSION = type=http-request, pattern=^https?://student\.wozaixiaoyuan\.com/heat/getTodayHeatList\.json, requires-body=1, max-size=-1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/epidemic_kmust.js, script-update-interval=0, timeout=10
 * 昆工疫情签到 = type=cron, cronexp="1 0 7,12,22 * * *", wake-system=1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/epidemic_kmust.js, script-update-interval=0, timeout=10
 * 
 * =============== Loon ===============
 * http-request ^https?://student\.wozaixiaoyuan\.com/heat/getTodayHeatList\.json script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/epidemic_kmust.js, requires-body=true, timeout=10, tag=昆工疫情JWSESSION
 * cron "0 0 7,12,22 * * *" script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/epidemic_kmust.js, tag=昆工疫情签到
 * 
 */


const $ = new Env('🌼 我在校园 🌼')
const inSchool = $.toObj($.read("kmust_inSchool"))
inSchool ? address = "云南省昆明市呈贡区致远路与郎溪街交叉口" : address = $.read("kmust_address")
const username = $.read(`kmust_username`)
const passwd = $.read(`kmust_password`)
const nowHours = new Date().getHours()
const illustrate = `微信 => 小程序 => 我在校园 => 日检日报`

typeof $request !== `undefined` ? start() : main()

function start() {
  const Method = $request.method
  if ((Method == "POST" || Method == "GET") && (!username && !passwd)) {
    if ($request.headers) {
      if (!$.read(`kmust_JWSESSION`)) {
        $.write($request.headers.JWSESSION, "kmust_JWSESSION")
        $.notice($.name, `✅`, `首次写入 JWSESSION 成功`)
      } else if ($request.headers.JWSESSION != $.read(`kmust_JWSESSION`)) {
        $.write($request.headers.JWSESSION, "kmust_JWSESSION")
        $.notice($.name, `✅`, `更新 JWSESSION 成功`)
      }
    } else {
      $.notice($.name, ``, `⭕ 无法读取请求头`)
    }
  }
  $.done()
}

async function main() {
  try {
    if (!username && !passwd && !$.read(`kmust_JWSESSION`)) {
      $.notice($.name, `❌ 赞无我在校园JWSESSION, 请先抓包❗`, illustrate)
      $.log(`❌ 赞无我在校园JWSESSION`)
    } else {
      username && passwd ? $.JWSESSION = await login() : $.JWSESSION = $.read(`kmust_JWSESSION`)
      if ($.JWSESSION != -10) {
        list = await index()
        if (inSchool) {
          // state 0: 未开启 1: 开启中 2: 已结束
          // type 0: 未打卡 1: 已打卡
          if (list.state == 0) {
            $.log(`⭕ ${period().t}未开启`)
          } else if (list.state == 1 && list.type == 1) {
            $.log(`⭕ ${period().t}已经完成`)
          } else if (list.state == 2) {
            $.log(`⭕ ${period().t}已经结束`)
          } else {
            await geocoding()
            if ($.body) await reverse()
            if (!$.body) $.body = $.read(`kmust_body`)
            await checkin()
          }
        } else {
          // country 有该键的存在则为打卡成功
          if (list.country) {
            $.log(`⭕ 今日${period().t}已经完成`)
          } else {
            await geocoding()
            if ($.body) await reverse()
            if (!$.body) $.body = $.read(`kmust_body`)
            await checkin()
          }
        }
      } else {
        $.notice($.name, `❌ 我在校园JWSESSION已过期, 请重新抓包❗`, illustrate)
        $.log(`❌ 获取 JWSESSION 失败`)
      }
    }
  } catch (e) {
    $.notice($.name, `❌ 程序出错❗`, `具体情况请查看日志`)
    $.log(e)
  } finally {
    $.done()
  }
}

function period() {
  if (inSchool) {
    if (nowHours < 10) {
      i = 0, t = `晨检打卡`
    } else if (nowHours < 15) {
      i = 1, t = `午检打卡`
    } else {
      i = 2, t = `晚检打卡`
    }
  } else {
    i = 0, t = `健康打卡`
  }
  return {i, t}
}

function login() {
  cookie = -10
  return new Promise(resolve => {
    const options = {
      url: `https://gw.wozaixiaoyuan.com/basicinfo/mobile/login/username?` +
           `username=${username}&password=${passwd}`,
      headers: {"Content-Type": "application/x-www-form-urlencoded"},
      body: ``
    }
    $.post(options, (error, response, data) => {
      if ($.toObj(data).code == 0) {
        cookie = response.headers.JWSESSION
        $.write(cookie, `kmust_JWSESSION`)
      }
      resolve(cookie)
    })
  })
}

function index() {
  inSchool ? _url = `heat/getTodayHeatList` : _url = `health/getToday`
  return new Promise(resolve => {
    const options = {
      url: `https://student.wozaixiaoyuan.com/${_url}.json`,
      headers: {"JWSESSION": $.JWSESSION}
    }
    $.log(`🧑‍💻 正在获取当天${period().t}情况`)
    $.post(options, (error, response , data) => {
      $.log(`✅ 成功获取${period().t}任务`)
      if (inSchool) {
        list = $.toObj(data).data[period().i]
      } else {
        list = $.toObj(data).data
      }
      resolve(list)
    })
  })
}

function geocoding() {
  $.body = 0
  return new Promise(resolve => {
    const options = {
      url: `https://apis.map.qq.com/ws/geocoder/v1/`,
      body: `address=${address}&key=WOPBZ-NLJCX-NST4X-ZJHV3-7TUWH-2SBSU`
    }
    $.log(`${inSchool ? "🏫" : "🏠"} ${address}`)
    $.post(options, (error, response, data) => {
      try {
        if (data) {
          data = $.toObj(data)
          location = data.result.location
          $.body = `${location.lat},${location.lng}`
          $.log(`📍 经纬度: ${$.body}`)
        } else {
          $.log(`❌ 无法通过地址转换出经纬度`)
        }
      } catch {
        $.log(`❌ 地址转换出经纬度时, API请求可能出现问题`)
      } finally {
        resolve()
      }
    })
  })
}

function reverse() {
  return new Promise(resolve => {
    const options = {
      url: `https://apis.map.qq.com/ws/geocoder/v1/`,
      body: `location=${$.body}&key=WOPBZ-NLJCX-NST4X-ZJHV3-7TUWH-2SBSU`
    }
    $.body = 0
    $.log(`🧑‍💻 正在通过经纬度转换出地址`)
    $.post(options, (error, response, data) => {
      try {
        if (data) {
          $.log(`✅ 成功获取打卡封包`)
          data = $.toObj(data)
          data = {
            "answers":'["0"]',
            "latitude": data.result.location.lat,
            "longitude": data.result.location.lng,
            "country": data.result.address_component.nation,
            "province": data.result.address_component.province,
            "city": data.result.address_component.city,
            "district": data.result.address_component.district,
            "street": data.result.address_component.street,
            "township": data.result.address_reference.town.title,
            "towncode": data.result.address_reference.town.id,
            "citycode": data.result.ad_info.city_code,
            "areacode": data.result.ad_info.adcode
          }
          $.body = ``
          for (let key in data) $.body += `${key}=${data[key]}&`
          $.write($.body, `kmust_body`)
        } else {
          $.log(`❌ 无法通过经纬度转换出地址`)
        }
      } catch {
        $.log(`❌ 经纬度转换出地址时, API请求可能出现问题`)
      } finally {
        resolve()
      }
    })
  })
}

function checkin() {
  inSchool ? _url = `heat` : _url = `health`
  if (inSchool) {
    _body = `seq=${period().i + 1}` +
            `&temperature=36.${Math.floor(Math.random() * 5)}` +
            `&userId=&myArea=&`
  } else {
    _body = ``
  }
  return new Promise(resolve => {
    const options = {
      url: `https://student.wozaixiaoyuan.com/${_url}/save.json`,
      headers: {"JWSESSION": $.JWSESSION},
      body: encodeURI(_body + $.body + `timestampHeader=${new Date().getTime()}`)
    }
    $.log(`🧑‍💻 信息完成组装, 开始${period().t}`)
    $.post(options, (error, response, data) => {
      if (data) {
        data = $.toObj(data)
        if (data.code == 0) {
          $.log(`✅ ${period().t}成功`)
          // $.notice($.name, `✅ ${period().t}成功 ✅`, ``)
        } else {
          $.log(`❌ ${period().t}失败`)
          $.log($.toStr(data))
          $.notice($.name, `❌ ${period().t}失败 ❌`, `📡 ${data.message}`)
        }
      } else {
        $.log(`❌ 签到时 API 请求失败`)
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
  toObj = (str) => JSON.parse(str)
  toStr = (obj) => JSON.stringify(obj)
  log = (message) => console.log(message)
  done = (value = {}) => {$done(value)}
  return { name, read, write, notice, get, post, put, toObj, toStr, log, done }
}