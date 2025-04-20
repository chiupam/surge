/**
 * 
 * 使用说明：抓包获取docker部署命令
 * 使用方法：打开QQ音乐APP，点击社区
 * 
 * type: http-request
 * regex: ^https?://y\.qq\.com/v3/static/msg\.json\.z
 * script-paht: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascript/netease.docker.js
 *  
 * =============== Surge ===============
 * 网易云节点部署命令 = type=http-request, pattern=^https?://y\.qq\.com/v3/static/msg\.json\.z, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascript/netease.docker.js, script-update-interval=0, timeout=10
 * 
 */

 const $ = Env()
 const user_id = $.read("TG_USER_ID") || arg().split(`&`)[0]
 const bot_token = $.read("TG_BOT_TOKEN") || `5099904762:AA` + arg().split(`&`)[1]
 const vps_ip = $.read("vps_ip")
 const vps_password = $.read("vps_password")
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
     command = `docker rm -f music netease; ${pc_command.replace(`netease`, `music`)}; ${ios_command.replace(`55555`, `55556`)}`
     await vps(command)
   }
   $.done()
 }
 
 function vps(text) {
   return  new Promise(resolve => {
     const options = {
       url: `http://${vps_ip}/music`,
       body: `password=${vps_password}&command=${encodeURI(text)}`
     }
     $.post(options, (error, response, data) => {
       $.log(data)
       resolve()
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
   get = (url, cb) => {
     if (LN || SG) {$httpClient.get(url, cb)}
     if (QX) {url.method = 'GET'; $task.fetch(url).then((resp) => cb(null, {}, resp.body))}
   }
   post = (url, cb) => {
     if (LN || SG) {$httpClient.post(url, cb)}
     if (QX) {url.method = `POST`; $task.fetch(url).then((resp) => cb(null, {}, resp.body))}
  }
   toStr = (obj) => JSON.stringify(obj)
   log = (message) => console.log(message)
   done = (value = {}) => {$done(value)}
   return { read, get, post, toStr, log, done }
 }
 
