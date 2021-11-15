/*

[Script]
# > 掌上飞车 (mwegame.qq.com)
掌上飞车 = type=http-request,pattern=^https:\/\/mwegame\.qq\.com\/ams\/(sign|send)+.*, ,requires-body=1, max-size=-1 script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/qqspeed.js

[MITM]
hostname = %APPEND% mwegame.qq.com

git: https://github.com/chiupam/surge/blob/main/scripts/qqspeed.js
raw: https://raw.githubusercontent.com/chiupam/surge/main/scripts/qqspeed.js
sgmoudule: https://raw.githubusercontent.com/chiupam/surge/main/Surge/Task.sgmodule

*/

var appName = '掌上飞车'
var $ = Env()
var sign_url = $.getdata("UrlFC")
var gift_url = "https://mwegame.qq.com/ams/send/handle"
var KEY = $.getdata("CookieFC")
var GIFTID = $.getdata("GiftIdFC")
const Id1 = $.getdata("UrlIdFC") || "12826"
const Id2 = $.getdata("SpeedId2") || "12810"
var newDate = new Date()
var Day = newDate.getDate()
var ID1 = parseInt(Id1) - Day
var ID2 = parseInt(Id2) - Day

let isGetCookie = typeof $request !== 'undefined'

if (isGetCookie) {
   getcookie()
} else {
   sign1()
   sign2()
   sign3()
}

function getcookie() {
  var message = "";
  if ($request.url.indexOf('doSign') != -1) {
    if ($request.url) {
      var UrlKeyFC = "UrlFC";
      var UrlValueFC = $request.url;
      if ($.getdata(UrlKeyFC) != (undefined || null)) {
        if ($.getdata(UrlKeyFC) != UrlValueFC) {
          var url = $.setdata(UrlValueFC, UrlKeyFC);
          $.log(`本次飞车签到链接是：${UrlValueFC}`);
          if (!url) {
            message = "更新Url失败❗️"
          } else {
            message = "更新Url成功🎉"
          }
        } else {
          message = "Url未变化❗️"
        }
      } else {
        var url = $.setdata(UrlValueFC, UrlKeyFC);
        $.log(`本次飞车签到链接是：${UrlValueFC}`);
        if (!url) {
          message = "首次写入Url失败❗️"
        } else {
          message = "首次写入Url成功🎉"
        }
      }
      var IdKeyFC = "UrlIdFC";
      var IdValueFC = $request.url.split("=").slice(-1).toString();
      var id = $.setdata(IdValueFC, IdKeyFC)
      $.log(`本期飞车礼包Id是：${IdValueFC}`)
    } else {
      $.msg(appName, "写入Url失败❗️", "配置错误, 无法读取URL❗️");
    }
    if ($request.headers) {
      var CookieKeyFC = "CookieFC";
      var CookieValueFC = JSON.stringify($request.headers);
      if ($.getdata(CookieKeyFC) != (undefined || null)) {
         if ($.getdata(CookieKeyFC) != CookieValueFC) {
            var cookie = $.setdata(CookieValueFC, CookieKeyFC);
            $.log(`本次飞车签到请求头是：${CookieValueFC}`);
            if (!cookie) {
              message = "更新Cookie失败❗️"
            } else {
              message = "更新Cookie成功🎉"
            }
          } else {
            message = "Cookie未变化❗️"
          }
      } else {
        var cookie = $.setdata(CookieValueFC, CookieKeyFC);
        $.log(`本次飞车签到请求头是：${CookieValueFC}`);
        if (!cookie) {
          message = "首次写入Cookie失败❗️"
        } else {
          message = "首次写入Cookie成功🎉"
        }
      }
    } else {
      $.msg(appName, "写入Cookie失败❗️", "配置错误, 无法读取请求头❗️");
    }
  }
  if ($request.url.indexOf('handle') != -1) {
    if ($request.headers) {      
      var GiftKeyFC = "GiftIdFC"
      var GiftValueFC = $request.body.replace(/\"/g, "").split("&").slice(0, -1).join("&") + "&gift_id="
      if ($.getdata(GiftKeyFC) != (undefined || null)) {
        if ($.getdata(GiftKeyFC) != GiftValueFC) {
          var NewValue = $.setdata(GiftValueFC, GiftKeyFC);
          $.log(`本次飞车礼包的请求体是：${GiftValueFC}`);
          if (!NewValue) {
            message = "更新GitfId失败❗️"
          } else {
            message = "更新GitfId成功🎉"
          }
        } else {
          message = "GitfId未变化❗️"
        }
      } else {
        var NewValue = $.setdata(GiftValueFC, GiftKeyFC);
        $.log(`本次飞车礼包的请求体是：${GiftValueFC}`);
        if (!NewValue) {
          message = "首次写入GitfId失败❗️"
        } else {
          message = "首次写入GitfId成功🎉"
        }
      }
    } else {
      $.msg(appName, "写入GitfId失败❗️", "配置错误, 无法读取请求头❗️");
    }
  }
  $.msg(appName, "", message)
  $.done()
}

function sign1() {
  const title = `${appName}`
  const url1 = { url: sign_url, headers: JSON.parse(KEY) }
  $.get(url1, (error, response, data) => {
    $.log(`${appName}, data: ${data}`)
    let subTitle = ''
    let detail = ''
    const obj = JSON.parse(data)
    if (obj.status == 1 && obj.data == 1) {
      subTitle = `【每日签到】签到结果：成功`
    } else if (obj.status == 11 && obj.data == false) {
      subTitle = `【每日签到】签到结果：成功(重复)`
    } else {
      subTitle = `【每日签到】签到结果：失败`
    }
    $.msg(title, subTitle, `说明: ${obj.message}`)
    $.done()
  })
}

function sign2() {
  const title = `${appName}`
  const url2 = { url: gift_url, body: GIFTID + ID1.toString() };
  $.post(url2, (error, response, data) => {
    $.log(`${appName}, data: ${data}`)
    let subTitle = ''
    let detail = ''
    const obj = JSON.parse(data)
    if (obj.status == 1 && obj.data == 1) {
      subTitle = `【累积礼包】领取结果：成功`
    } else if (obj.status == 11 && obj.data == false) {
      subTitle = `【累积礼包】领取结果：成功(重复)`
    } else {
      subTitle = `【累积礼包】领取结果：失败`
    }
    $.msg(title, subTitle, `说明: ${obj.message}`)
    $.done()
  })
}

function sign3() {
  const title = `${appName}`
  const url3 = { url: gift_url, body: GIFTID + ID2.toString() };
  $.post(url3, (error, response, data) => {
    $.log(`${appName}, data: ${data}`)
    let subTitle = ''
    let detail = ''
    const obj = JSON.parse(data)
    if (obj.status == 1 && obj.data == 1) {
      subTitle = `【假日礼包】领取结果: 成功`
    } else if (obj.status == 11 && obj.data == false) {
      subTitle = `【假日礼包】领取结果: 成功(重复)`
    } else {
      subTitle = `【假日礼包】领取结果: 失败`
    }
    $.msg(title, subTitle, `说明: ${obj.message}`)
    $.done()
  })
}

function Env() {
  SL = () => {return undefined === this.$httpClient ? false : true}
  QX = () => {return undefined === this.$task ? false : true}
  read = (key) => {
    if (SL()) return $persistentStore.read(key)
    if (QX()) return $prefs.valueForKey(key)
  }
  set = (key, val) => {
    if (SL()) return $persistentStore.write(key, val)
    if (QX()) return $prefs.setValueForKey(key, val)
  }
  msg = (title, subtitle, body) => {
    if (SL()) $notification.post(title, subtitle, body)
    if (QX()) $notify(title, subtitle, body)
  }
  get = (url, cb) => {
    if (SL()) {$httpClient.get(url, cb)}
    if (QX()) {url.method = 'GET'; $task.fetch(url).then((resp) => cb(null, {}, resp.body))}
  }
  post = (url, cb) => {
    if (SL()) {$httpClient.post(url, cb)}
    if (QX()) {url.method = 'POST'; $task.fetch(url).then((resp) => cb(null, {}, resp.body))}
  }
  put = (url, cb) => {
    if (SL()) {$httpClient.put(url, cb)}
    if (QX()) {url.method = 'PUT'; $task.fetch(url).then((resp) => cb(null, {}, resp.body))}
  }
  log = (message) => console.log(message)
  done = (value = {}) => {$done(value)}
  return { SL, QX, msg, read, set, get, post, put, log, done }
}
