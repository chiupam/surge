/**
 * 
 * 使用方法：打开我在校园，点击日检日报即可。
 * 
 * 备注：目前仅做了假期日常打卡，未清楚是否会有开学后的每日打卡。
 * 
 * Surge's Moudule: https://raw.githubusercontent.com/chiupam/surge/main/platforms/Surge/KMUST.sgmodule
 * BoxJs: https://raw.githubusercontent.com/chiupam/surge/main/platforms/boxjs/chiupam.boxjs.json
 * 
 * hostname: student.wozaixiaoyuan.com
 * 
 * type: http-request
 * regex: ^https?://student\.wozaixiaoyuan\.com/heat/getTodayHeatList\.json
 * script-path: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascript/epidemic_kmust.js
 * requires-body: 1 | true
 * 
 * type: cron
 * cron: 1 0 9,11 * * *
 * script-path: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascript/epidemic_kmust.js
 * 
 * =============== Surge ===============
 * 昆工疫情SESSION = type=http-request, pattern=^https?://student\.wozaixiaoyuan\.com/heat/getTodayHeatList\.json, requires-body=1, max-size=-1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascript/epidemic_kmust.js, script-update-interval=0, timeout=10
 * 昆工疫情签到 = type=cron, cronexp="1 0 9,11 * * *", wake-system=1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascript/epidemic_kmust.js, script-update-interval=0, timeout=10
 * 
 * =============== Loon ===============
 * http-request ^https?://student\.wozaixiaoyuan\.com/heat/getTodayHeatList\.json script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascript/epidemic_kmust.js, requires-body=true, timeout=10, tag=昆工疫情JWSESSION
 * cron "0 0 9,11 * * *" script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascript/epidemic_kmust.js, tag=昆工疫情签到
 * 
 */


const $ = new Env('🌼 我在校园 🌼')

const inSchool = $.toObj($.read("kmust_inSchool"))
inSchool ? address = `云南省昆明市呈贡区致远路与郎溪街交叉口` : address = $.read("kmust_address")

!(async () => {
  if (!typeof $request !== 'undefined') {
    jwsession = $.read(`kmust_JWSESSION`)
    list = await index(jwsession)
    // state 0: 未开启 1: 开启中 2: 已结束
    // type 0: 未打卡 1: 已打卡
    if (list.state == 0) {
      $.log(`⭕ ${period().t}未开启`)
    } else if (list.state == 1 && list.type == 1) {
      $.log(`⭕ ${period().t}已经完成`)
    } else if (list.state == 2) {
      $.log(`⭕ ${period().t}已经结束`)
    } else {
      address =  await reverse(await geocoding(address))
      await main(jwsession, list.id, address)
    }
  } else {
    let Method = $request.method
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
  }
})()
.catch((e) => $.log(e))
.finally(() => $.done())

function period() {
  /**
   * 暂时注释以下部分代码，后期可能会有开学每日打卡
   */
  // let nowHours = new Date().getHours()
  // if (nowHours < 10) {
  //   i = 0, t = `晨检打卡`
  // } else if (nowHours < 15) {
  //   i = 0, t = `午检打卡`
  // } else {
  //   i = 0, t = `晚检打卡`
  // }
  // return {i, t}
  i = 0, t = `健康自测上报`
  return {i, t}
}

async function login(_username, _password) {
  return new Promise(resolve => {
    let options = {
      url: `https://gw.wozaixiaoyuan.com/basicinfo/mobile/login/username?` +
      `username=${username}&password=${passwd}`,
      headers: {"Content-Type": "application/x-www-form-urlencoded"},
      body: ``
    }
    $.post(options, (error, response, data) => {
      try {
        if (error) {
          $.log(`API请求失败, 请检查网路重试`)
          $.log($.toStr(error))
        } else {
          if ($.toObj(data).code == 0) {
            cookie = response.headers.JWSESSION
            $.write(cookie, `kmust_JWSESSION`)
          } else {
            cookie = -10
          }
        }
      } catch (e) {
        $.log(`程序错误, 请检查代码`)
        $.log(e)
      } finally {
        resolve(cookie)
      }
    })
  })
}

async function index(_jwsession) {
  return new Promise(resolve => {
    let options = {
      url: `https://gw.wozaixiaoyuan.com/health/mobile/health/getBatch`,
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-CN,zh-Hans;q=0.9",
        "Content-Type": "application/json;charset=UTF-8",
        "Origin": "https://gw.wozaixiaoyuan.com",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) " +
                      "Mobile/15E148 MicroMessenger/8.0.32(0x18002030) NetType/WIFI Language/zh_CN miniProgram/wxce6d08f781975d91",
        "Connection": "keep-alive",
        "Cookie": `JWSESSION=${_jwsession}; JWSESSION=${_jwsession}`,
        "JWSESSION": _jwsession
      }
    }
    $.log(`🧑‍💻 正在获取当天${period().t}情况`)
    $.post(options, (error, response, data) => {
      try {
        if (error) {
          $.log(`API请求失败, 请检查网路重试`)
          $.log($.toStr(error))
        } else {
          $.log(`✅ 成功获取${period().t}任务`)
          list = $.toObj(data).data.list[period().i]
        }
      } catch (e) {
        $.log(`程序错误, 请检查代码`)
        $.log(e)
      } finally {
        resolve(list)
      }
    })
  })
}

async function geocoding(_address) {
  let location = 0
  return new Promise(resolve => {
    let options = {
      url: `https://apis.map.qq.com/ws/geocoder/v1/`,
      body: `address=${_address}&key=WOPBZ-NLJCX-NST4X-ZJHV3-7TUWH-2SBSU`
    }
    $.post(options, (error, response, data) => {
      try {
        if (error) {
          $.log(`API请求失败, 请检查网路重试`)
          $.log($.toStr(error))
        } else {
          if (data) {
            data = $.toObj(data)
            location = data.result.location
            location = `${location.lat},${location.lng}`
            $.log(`📍 经纬度: ${location}`)
          }
        }
      } catch (e) {
        $.log(`程序错误, 请检查代码`)
        $.log(e)
      } finally {
        resolve(location)
      }
    })
  })
}

async function reverse(_location) {
  let address = ``
  return new Promise(resolve => {
    let options = {
      url: `https://apis.map.qq.com/ws/geocoder/v1/`,
      body: `location=${_location}&key=WOPBZ-NLJCX-NST4X-ZJHV3-7TUWH-2SBSU`
    }
    $.log(`🧑‍💻 正在通过经纬度转换出地址`)
    $.post(options, (error, response, data) => {
      try {
        if (error) {
          $.log(`API请求失败, 请检查网路重试`)
          $.log($.toStr(error))
        } else {
          if (data) {
            $.log(`✅ 成功获取打卡封包`)
            data = $.toObj(data)
            data = {
              "country": data.result.address_component.nation,
              "province": data.result.address_component.province,
              "city": data.result.address_component.city,
              "district": data.result.address_component.district,
              "township": data.result.address_reference.town.title,
              "street": data.result.address_component.street,
              "nationcode": data.result.ad_info.nation_code,
              "areacode": data.result.ad_info.adcode,
              "citycode": data.result.ad_info.city_code,
              "towncode": data.result.address_reference.town.id,
              "latitude": data.result.location.lat,
              "longitude": data.result.location.lng
            }
            for (let key in data) address += `${data[key]}/`
            body = {
              "t1": "正常（37.3℃以下）",
              "t2": "否",
              "t3": "无下列情况，身体健康",
              "type": 0,
              "locationMode": 0,
              "location": address.slice(0, address.length - 1),
              "locationType": 0
            }
            $.write(body, `kmust_body`)
          }
        }
      } catch (e) {
        $.log(`程序错误, 请检查代码`)
        $.log(e)
      } finally {
        resolve(body)
      }
    })
  })
}

async function main(_jwsession, _batch, _body) {
  return new Promise(resolve => {
    let options = {
      url: `https://gw.wozaixiaoyuan.com/health/mobile/health/save?batch=${_batch}`,
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-CN,zh-Hans;q=0.9",
        "Content-Type": "application/json;charset=UTF-8",
        "Origin": "https://gw.wozaixiaoyuan.com",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) " +
                      "Mobile/15E148 MicroMessenger/8.0.32(0x18002030) NetType/WIFI Language/zh_CN miniProgram/wxce6d08f781975d91",
        "Connection": "keep-alive",
        "Referer": `https://gw.wozaixiaoyuan.com/h5/mobile/health/0.3.7/health/detail?id=${_batch}`,
        "Cookie": `JWSESSION=${_jwsession}; JWSESSION=${_jwsession}`,
        "JWSESSION": _jwsession
      },
      body: _body
    }
    $.log(`🧑‍💻 信息完成组装, 开始${period().t}`)
    $.post(options, (error, response, data) => {
      try {
        if (error) {
          $.log(`API请求失败, 请检查网路重试`)
          $.log($.toStr(error))
        } else {
          data = $.toObj(data)
          if (data.code == 0) {
            $.log(`✅ ${period().t}成功`)
            // $.notice($.name, `✅ ${period().t}成功 ✅`, ``)
          } else {
            $.log(`❌ ${period().t}失败`)
            $.log($.toStr(data))
            $.notice($.name, `❌ ${period().t}失败 ❌`, `📡 ${data.message}`)
          }
        }
      } catch (e) {
        $.log(`程序错误, 请检查代码`)
        $.log(e)
      } finally {
        resolve()
      }
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