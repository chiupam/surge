/**
 * 
 * 使用方法：打开 https://kyyjswx.kmmu.edu.cn/SmartGmis5_0/kmyk_cas/login 登录即可。
 * 
 * Surge's Moudule: https://raw.githubusercontent.com/chiupam/surge/main/Surge/Psotgraduate.sgmodule
 * BoxJs: https://raw.githubusercontent.com/chiupam/surge/main/boxjs/chiupam.boxjs.json
 * 
 * hostname: kyyjswx.kmmu.edu.cn
 * 
 * type: http-request
 * regex: ^https?://kyyjswx\.kmmu\.edu\.cn/SmartGmis5_0/kmyk/sfkyrxbd$
 * script-path: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/psotgraduate.js
 * requires-body: 1 | true
 * 
 * type: cron
 * cron: 1 0 7,12,22 * * *
 * script-path: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/psotgraduate.js

 * =============== Surge ===============
 * 疫情防控打卡GmisToken = type=http-request, pattern=^https?://kyyjswx\.kmmu\.edu\.cn/SmartGmis5_0/kmyk/sfkyrxbd$, requires-body=1, max-size=-1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/psotgraduate.js, script-update-interval=0, timeout=10
 * 疫情防控打卡(研究生) = type=cron, cronexp="1 0 7,12,22 * * *", wake-system=1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/psotgraduate.js, script-update-interval=0, timeout=10
 * 
 * =============== Loon ===============
 * http-request ^https?://kyyjswx\.kmmu\.edu\.cn/SmartGmis5_0/kmyk/sfkyrxbd$ script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/psotgraduate.js, requires-body=true, timeout=10, tag=疫情防控打卡GmisToken
 * cron "0 0 7,12,22 * * *" script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/psotgraduate.js, tag=疫情防控打卡(研究生) 
 * 
 */


const $ = new Env('疫情防控打卡(研究生)')
const address = $.read(`postgraduate_address`) || `云南省昆明市呈贡区癸西大道`
const login = `https://kyyjswx.kmmu.edu.cn/SmartGmis5_0/kmyk_cas/login`

typeof $request !== `undefined` ? start() : main()

function start() {
  if ($request.headers) {
    if ($.read(`postgraduate_gmistoken`)) {
      $.write($request.headers.GmisToken, `postgraduate_gmistoken`)
      $.notice($.name, `✅ 首次使用 ✅`, `写入数据成功`, ``)
    } else if ($request.headers.GmisToken != $.read(`postgraduate_gmistoken`)) {
      $.write($request.headers.GmisToken, `postgraduate_gmistoken`)
      $.notice($.name, `✅ 更新成功 ✅`, ``, ``)
    } else {
      $.log(`无需写入或更新数据`)
    }
  }
  $.done()
}

async function main() {
  if (!$.read(`postgraduate_gmistoken`)) {
    $.notice($.name, `❌ 首次使用请先登录 ❌`, `点击通知栏前往登录页面`, login)
  } else {
    if (!$.read(`postgraduate_address`)) $.log(`⭕ 使用默认地址进行打卡`)
    user = await index()
    if (user) {
      $.log(`✅ 当前帐号: ${user}`)
      condition = await checkin()
      if (condition) {
        $.log(`✅ 今日疫情防控打卡成功`)
      } else {
        $.log(`❌ 今日疫情防控打卡失败`)
        $.notice($.name, `❌ 打卡失败 ❌`, `点击通知栏手动打卡`, login)
      }
    } else {
      $.log(`❌ 获取账号信息失败, 请重新登录`)
      $.notice($.name, `❌ 请重新登录 ❌`, `点击通知栏前往登录页面`, login)
    }
  }
  $.done()
}

function index() {
  username = 0
  return new Promise(resolve => {
    const options = {
      url: `https://kyyjswx.kmmu.edu.cn/SmartGmis5_0/xsjbxx/xh`,
      headers: {"GmisToken": $.read(`postgraduate_gmistoken`)}
    }
    $.log(`🧑‍💻 开始获取研究生账号信息`)
    $.get(options, (error, response, data) => {
      if (data) {
        data = $.toObj(data)
        username = data.xm
      }
      resolve(username)
    })
  })
}

function checkin() {
  state = 0
  return new Promise(resolve => {
    const options = {
      url: `https://kyyjswx.kmmu.edu.cn/SmartGmis5_0/health_daily/add`,
      headers: {"GmisToken": $.read(`postgraduate_gmistoken`)},
      body: {
        "temperature": "36.5",
        "address": address,
        "addressRiskLevel": 2,  // 所在地风险等级 2 低风险 4 中风险 6 高风险
        "healthStatus": 2,  // 健康情况 2 低风险人群 4 中风险人群 6 高风险人群
        "healthRemark": "无", // 健康备注
        "promiseTruth": 1, // 承诺信息真实
        "sfsyljs1":  "否",  // 是否问题1
        "sfsyljs2":  "否",  // 是否问题2
        "sfsyljs3":  "否",  // 是否问题3
        "sfyzdycqk": "否"  // 是否问题4
      }
    }
    $.log(`🧑‍💻 开始疫情防控打卡`)
    $.post(options, (error, response, data) => {
      if (data) {
        try {
          data = $.toObj(data)
          if (data.zt == "1") {
            state = 1
          } else {
            $.log($.toStr(data))
          }
        } catch {
          $.log($.toStr(error))
        }
      } else {
        $.log(`❌ 签到时 API 请求失败`)
      }
      resolve(state)
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