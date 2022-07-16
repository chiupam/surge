/**
 * 
 * 使用方法：打开云南共青团公众号，点击我的进入青年大学习，点击注册团员登录学习或进入主界面即可。
 * 
 * Surge's Moudule: https://raw.githubusercontent.com/chiupam/surge/main/Surge/QNDXX.sgmodule
 * Loon's Plugin: https://raw.githubusercontent.com/chiupam/surge/main/Loon/qndxx.plugin
 * BoxJs: https://raw.githubusercontent.com/chiupam/surge/main/boxjs/chiupam.boxjs.json
 * 
 * hostname: home.yngqt.org.cn
 * 
 * type: http-response
 * regex: ^http://home\.yngqt\.org\.cn/user/weixin_yngqt\.aspx\?getcode=.*|^https?://home\.yngqt\.org\.cn/qndxx/default\.aspx$
 * script-path: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/qndxx.js
 * requires-body: 0 | false
 * 
 * type: cron
 * cron: 13 13 13 * * *
 * script-path: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/qndxx.js
 * 
 * =============== Surge ===============
 * 云南青年大学习Cookie = type=http-response, pattern=^http://home\.yngqt\.org\.cn/user/weixin_yngqt\.aspx\?getcode=.*|^https?://home\.yngqt\.org\.cn/qndxx/default\.aspx$, requires-body=0, timeout=5, max-size=-1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/qndxx.js, script-update-interval=0, timeout=5
 * 云南青年大学习 = type=cron, cronexp="13 13 13 * * *", wake-system=1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/qndxx.js, script-update-interval=0, timeout=5
 * 
 * =============== Loon ===============
 * http-response ^http://home\.yngqt\.org\.cn/user/weixin_yngqt\.aspx\?getcode=.*|^https?://home\.yngqt\.org\.cn/qndxx/default\.aspx$ script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/qndxx.js, requires-body=true, timeout=5, tag=云南青年大学习Cookie
 * cron "13 13 13 * * *" script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/qndxx.js, tag=云南青年大学习
 * 
 */

const $ = new Env("👨‍🎓 云南大学习")
const review = $.toObj($.read("qndxx_review"))
const headers = {
  "Cookie": $.read("qndxx_cookie"),
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.18(0x1800123f) NetType/4G Language/zh_CN"
}
const illustrate = `微信 => 通讯录 => 公众号 => 云南共青团 => 大学习 => 注册团员登录学习`
typeof $request !== 'undefined' ? start() : main()

function start() {
  if ($request.headers) {
    if ($request.url.indexOf(`weixin_yngqt`) != -1) {
      set_cookie = $response.headers["Set-Cookie"].match(/DianCMSUser(\S*)/)[1]
      set_cookie = "DianCMSUser" + set_cookie
      $.write(set_cookie, "qndxx_cookie")
    } else {
      set_cookie = $request.headers.Cookie
      $.write(set_cookie, "qndxx_cookie")
    }
  } else {
    $.notice($.name, ``, `⭕ 无法读取请求头,请检查配置`)
  }
  $.done()
}

async function main() {
  if ($.read("qndxx_cookie")) {
    if (await qiandao()) {
      await user()
      await txtid()
      if ($.txtid) await study($.txtid)
      if ($.txtid && review) await study($.txtid * 1 - 1)
    } else {
      $.notice($.name, `❌ Cookie已失效,请重新获取`, illustrate)
    }
  } else {
    $.notice($.name, `❌ Cookie为空,请先获取`, illustrate)
  }
  $.done()
}

function qiandao() {
  return new Promise((resolve) => {
    const options = {
      url: `http://home.yngqt.org.cn/qndxx/user/qiandao.ashx`,
      headers: headers,
    }
    $.log(`🧑‍💻 开始签到`)
    $.post(options, (error, response, data) => {
      if (data) {
        message = $.toObj(data).message
        if (message.indexOf(`登录`) != -1) {
          $.log(`❌ ${message}`)
          check = $.toObj(`false`)
        } else {
          $.log(`✅ ${message}`)
          check = $.toObj(`true`)
        }
      } else {
        $.log(`❌ 签到时发生错误`)
        $.log($.toStr(error))
      }
      resolve(check)
    })
  })
}

function user() {
  return new Promise((resolve) => {
    const options = {
      url: `http://home.yngqt.org.cn/qndxx/user/`,
      headers: headers
    }
    $.log(`🧑‍💻 开始获取用户信息`)
    $.get(options, (error, response, data) => {
     if (data) {
       integral = data.match(/积分：(\d*)/)[1]
       $.log(`✅ 当前积分:${integral}`)
     } else {
       $.log(`❌ 访问 user 接口时发生错误`)
       $.log($.toStr(error))
     }
     resolve()
    })
  })
}

function txtid() {
  return new Promise((resolve) => {
    const options = {
      url: `http://home.yngqt.org.cn/qndxx/default.aspx`,
      headers: headers
    }
    $.log(`🧑‍💻 开始获取青年大学习数据`)
    $.get(options, (error, response, data) => {
     if (data) {
       $.txtid = data.match(/study\((\d*)\)/)[1] * 1
       $.title = data.match(/习”(\S*)<\/p><p class="p2">(\S*)<\/p>/)
       $.log(`✅ 最新一期期数:${$.title[1]}(${$.txtid})`)
       $.log(`✅ 最新一期名称:${$.title[2]}`)
     } else {
       $.txtid = $.toObj(`false`)
       $.log(`❌ 获取青年大学习时发生错误`)
       $.log($.toStr(error))
     }
     resolve()
    })
  })
}

function study(id) {
  return new Promise((resolve) => {
    const options = {
      url: `http://home.yngqt.org.cn/qndxx/xuexi.ashx`,
      headers: headers,
      body: `{"txtid": ${id * 1}}`
    }
    $.log(`🧑‍💻 开始学习第${id}期青年大学习`)
    $.post(options, (error, response, data) => {
     if (data) {
       result = $.toObj(data).message
       $.log(`✅ ${result}`)
     } else {
       $.log(`❌ 学习第${id}期青年大学习时发生错误`)
       $.log($.toStr(error))
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
  toObj = (str) => JSON.parse(str)
  toStr = (obj) => JSON.stringify(obj)
  log = (message) => console.log(message)
  done = (value = {}) => {$done(value)}
  return { name, read, write, notice, get, post, toObj, toStr, log, done }
}
