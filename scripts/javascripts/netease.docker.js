/**
 * 
 * 使用说明：抓包获取docker部署命令
 * 使用方法：打开QQ音乐APP，点击社区
 * 
 * type: http-request
 * regex: ^https?://y\.qq\.com/v3/static/msg\.json\.z
 * script-paht: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/netease.docker.js
 *  
 * =============== Surge ===============
 * 网易云节点部署命令 = type=http-request, pattern=^https?://y\.qq\.com/v3/static/msg\.json\.z, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/netease.docker.js, script-update-interval=0, timeout=10
 * 
 */

const $ = Env()
const user_id = $.read("TG_USER_ID") || arg().split(`&`)[0]
const bot_token = $.read("TG_BOT_TOKEN") || `5099904762:AA` + arg().split(`&`)[1]
if (typeof $request !== 'undefined') start()

function arg() {
  try {return $argument.match(/api=(.*)/)[1]} 
  catch {return `none&none`}
} 

async function start() {
  cookie = $request.headers.Cookie
  try {qm_keyst = cookie.match(/qm_keyst=([^;]*)/)[1]} catch {qm_keyst = undefined}
  try {uin = cookie.match(/uin=([^;]*)/)[1]} catch {uin = undefined}
  if (qm_keyst && uin) {
    container = `docker run -dit --name netease --restart unless-stopped `
    container_parameters = `-p 55555:8080 -e ENABLE_FLAC=true -e QQ_COOKIE="uin=${uin}; qm_keyst=${qm_keyst}" `
    usering_images = `pan93412/unblock-netease-music-enhanced:latest `
    incoming_parameters = `-o qq `
    ios_parameters = `-s -e https://music.163.com`
    pc_command = container + container_parameters + usering_images + incoming_parameters
    ios_command = pc_command + ios_parameters
    await tgNotify(pc_command.replace(`netease`, `music`))
    await tgNotify(ios_command.replace(`55555`, `55556`))
  }
  $.done()
}

function tgNotify(text) {
  $.log(text)
  return  new Promise(resolve => {
    const options = {
      url: `https://api.telegram.org/bot${bot_token}/sendMessage`,
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: `chat_id=${user_id}&text=${text}&disable_web_page_preview=true`,
      timeout: 50000
    }
    $.post(options, () => {resolve()})
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
  post = (url, cb) => {
    if (LN || SG) {$httpClient.post(url, cb)}
    if (QX) {url.method = 'POST'; $task.fetch(url).then((resp) => cb(null, {}, resp.body))}
  }
  log = (message) => console.log(message)
  done = (value = {}) => {$done(value)}
  return { read, write, notice, post, log, done }
}
