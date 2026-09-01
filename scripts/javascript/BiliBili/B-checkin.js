/*
使用方法：BoxJs中填入B站Cookie，或手动在Surge持久化中写入B_checkin_cookie键值

type: cron
cron: 30 8,20 * * *
script-path: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascript/BiliBili/B-checkin.js

###### Surge ######
B站签到 = type=cron, cronexp="30 8,20 * * *", wake-system=1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascript/BiliBili/B-checkin.js, script-update-interval=0, timeout=60
*/

const $ = Env()
const cookie = $.read(`B_checkin_cookie`)


!(async () => {
  if (!cookie) {
    $.notice(`📺 Bilibili签到`, ``, `❌ 未获取到Cookie，请先配置B_checkin_cookie`)
    return
  }
  const csrf = getCsrf(cookie)
  if (!csrf) {
    $.notice(`📺 Bilibili签到`, ``, `❌ Cookie中未找到bili_jct，请重新获取`)
    return
  }
  const userInfo = await getUserInfo()
  if (!userInfo) {
    $.notice(`📺 Bilibili签到`, ``, `❌ 获取用户信息失败，Cookie可能已失效`)
    return
  }
  const message = `硬币: ${userInfo.money} 个\n` +
                  `经验: ${userInfo.current_exp} / ${userInfo.next_exp}\n` +
                  `等级: Lv${userInfo.level_info.current_level}\n` +
                  `大会员: ${userInfo.vipStatus ? `是 (剩余${userInfo.vipDueDate}天)` : `否`}`
  $.log(`✅ 签到成功\n${message}`)
})().catch((e) => {
  $.log(`脚本执行失败: ${e.message || e}`)
  $.notice(`📺 Bilibili签到`, ``, `❌ 执行失败: ${e.message || e}`)
}).finally(() => $.done())


function getCsrf(cookie) {
  for (const item of cookie.split(`;`)) {
    const trimItem = item.trim()
    if (trimItem.startsWith(`bili_jct`)) return trimItem.split(`=`)[1]
  }
  return null
}


function getUserInfo() {
  return new Promise((resolve) => {
    const options = {
      url: `https://api.bilibili.com/x/web-interface/nav`,
      headers: {
        'User-Agent': `Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36`,
        'Accept': `application/json, text/plain, */*`,
        'Referer': `https://www.bilibili.com/`,
        'Cookie': cookie
      },
      timeout: 30000
    }
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          $.log(`请求用户信息API异常: ${err}`)
          resolve(null)
          return
        }
        $.log(`API返回数据: ${data}`)
        const result = JSON.parse(data)
        if (result.code === 0) {
          const vipDueDate = Math.max(0, Math.ceil((result.data.vipDueDate * 1000 - Date.now()) / 86400000))
          resolve({
            uname: result.data.uname,
            money: result.data.money,
            current_exp: result.data.level_info.current_exp,
            next_exp: result.data.level_info.next_exp,
            level_info: result.data.level_info,
            vipStatus: result.data.vipStatus,
            vipDueDate: vipDueDate
          })
        } else {
          $.log(`获取用户信息失败: ${result.message}`)
          resolve(null)
        }
      } catch (e) {
        $.log(`解析用户信息失败: ${e.message || e}`)
        resolve(null)
      }
    })
  })
}


function Env() {
  LN = typeof $loon != `undefined`
  SG = typeof $httpClient != `undefined` && !LN
  QX = typeof $task != `undefined`
  read = (key) => {
    if (LN || SG) return $persistentStore.read(key)
    if (QX) return $prefs.valueForKey(key)
  }
  write = (key, val) => {
    if (LN || SG) return $persistentStore.write(key, val)
    if (QX) return $prefs.setValueForKey(key, val)
  }
  notice = (title, subtitle, message, url) => {
    if (LN) $notification.post(title, subtitle, message, url)
    if (SG) $notification.post(title, subtitle, message, { url: url })
    if (QX) $notify(title, subtitle, message, { 'open-url': url })
  }
  get = (url, cb) => {
    if (LN || SG) { $httpClient.get(url, cb) }
    if (QX) { url.method = `GET`; $task.fetch(url).then((resp) => cb(null, {}, resp.body)) }
  }
  post = (url, cb) => {
    if (LN || SG) { $httpClient.post(url, cb) }
    if (QX) { url.method = `POST`; $task.fetch(url).then((resp) => cb(null, {}, resp.body)) }
  }
  put = (url, cb) => {
    if (LN || SG) { $httpClient.put(url, cb) }
    if (QX) { url.method = `PUT`; $task.fetch(url).then((resp) => cb(null, {}, resp.body)) }
  }
  log = (message) => console.log(message)
  done = (value = {}) => { $done(value) }
  return { LN, SG, QX, read, write, notice, get, post, put, log, done }
}
