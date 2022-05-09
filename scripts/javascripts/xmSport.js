/*

[Script]
# > 小米运动获取Cookie (account.huami.com)
# 小米运动 = type=http-response, pattern=^https?:\/\/account\.huami\.com\/v2\/client\/login, requires-body=1, max-size=-1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/xmSport.js
# > 小米运动
小米运动 = type=cron, cronexp="22 22 22 * * *", wake-system=1, timeout=180, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/xmSport.js

[MITM]
hostname = %APPEND% account.huami.com
git: https://github.com/chiupam/surge/blob/main/scripts/xmSport.js
raw: https://raw.githubusercontent.com/chiupam/surge/main/scripts/xmSport.js
sgmoudule: https://raw.githubusercontent.com/chiupam/surge/main/Surge/Task.sgmodule

*/

const $ = new Env('小米运动')
const step = randomFriendPin($.getdata('xmMinStep') * 1, $.getdata('xmMaxStep') * 1)
typeof $request != "undefined" ? set() : main()

function set() {
  if ($response.body) {
    const body = JSON.parse($response.body)
    const loginToken = body.token_info.login_token
    $.setdata(loginToken, 'xmSportsToken')
    $.msg($.name, "", "【成功】写入 Token 成功！🎉")
  } else {
    $.msg($.name, "", "【失败】无法读取 response 啊，自查原因！🤦‍♂️")
  }
  $.done({})
}

async function main() {
  login_token = $.getdata('xmSportsToken')
  if (login_token) {
	  await get_dataJSON()
    await get_app_token(login_token)
    if ($.tokenInfo && $.tokenInfo.result === 'ok') {
      const {app_token, user_id} = $.tokenInfo.token_info
      await get_time()
      await change_step(app_token, user_id)
      if ($.changeStepRes && $.changeStepRes.code === 1) {
        $.log(`步数修改成功:${step}步`)
        $.msg($.name, `${step}步🏃修改成功`, `时间：${timeFormat(localtime())}‍`)
      } else {
        $.log(`修改运动步数失败`)
      }
    } else {
      $.msg($.name, '', "【失败】小米运动Token已失效，请重新登录获取！")
    }
  } else {
	  $.msg($.name, '', "【失败】暂无小米运动Token，请登录获取！")
    $.log("【失败】暂无小米运动Token，请登录获取！")
  }
  $.done()
}

function get_dataJSON() {
  return new Promise(resolve => {
    $.get({
        url: `https://raw.githubusercontent.com/chiupam/surge/main/scripts/xmSport.json`, 
        headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36 Edg/95.0.1020.44'}
    }, (err, resp, data) => {
      try {
        if (err) {
          $.log(JSON.stringify(err))
        } else {
          if (data) {
            $.xmsportdata = JSON.parse(data).data
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve()
      }
    })
  })
}

async function change_step(app_token, user_id) {
  const date = $.xmsportdata.match(/.*?date%22%3A%22(.*?)%22%2C%22data.*?/)[1]
  const ttf = $.xmsportdata.match(/.*?ttl%5C%22%3A(.*?)%2C%5C%22dis.*?/)[1]
  dataJSON = $.xmsportdata.replace(date, timeFormat(localtime()))
  dataJSON = $.xmsportdata.replace(ttf, step.toString())
  return new Promise(resolve => {
    const options = {
      "url": `https://api-mifit-cn.huami.com/v1/data/band_data.json?&t=${$.t}`,
      "body": `userid=${user_id.toString()}&last_sync_data_time=1597306380&device_type=0&last_deviceid=DA932FFFFE8816E7&data_json=${dataJSON}`,
      "headers": {"Content-Type": "application/x-www-form-urlencoded", "apptoken": app_token}
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          $.log(JSON.stringify(err))
        } else {
          $.log(`修改步数结果:${data}`)
          $.changeStepRes = JSON.parse(data)
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve()
      }
    })
  })
}

function get_app_token(login_token) {
  return new Promise(resolve => {
    $.get({
        url: `https://account-cn.huami.com/v1/client/app_tokens?app_name=com.xiaomi.hm.health&dn=api-user.huami.com%2Capi-mifit.huami.com%2Capp-analytics.huami.com&login_token=${login_token}`, 
        headers: {'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 9; MI 6 MIUI/20.6.18)'}
    }, (err, resp, data) => {
      try {
        if (err) {
          $.log(JSON.stringify(err))
        } else {
          if (data) {
            $.tokenInfo = JSON.parse(data)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve()
      }
    })
  })
}

function get_time() {
  return new Promise(resolve => {
    $.get({url: "http://api.m.taobao.com/rest/api3.do?api=mtop.common.getTimestamp"}, (err, resp, data) => {
      try {
        if (err) {
          $.log(JSON.stringify(err))
        } else {
          if (data) {
            $.t = JSON.parse(data).data.t
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data)
      }
    })
  })
}

function localtime() {return new Date().getTime() + new Date().getTimezoneOffset()*60*1000 + 8*60*60*1000}

function timeFormat(time) {
  let date
  if (time) {date = new Date(time)} else {date = new Date()}
  return date.getFullYear() + '-' + ((date.getMonth() + 1) >= 10 ? (date.getMonth() + 1) : '0' + (date.getMonth() + 1)) + '-' + (date.getDate() >= 10 ? date.getDate() : '0' + date.getDate())
}

function randomFriendPin(m,n) {
  return Math.round(Math.random()*(n - m) + m)
}

// prettier-ignore
function Env(t,e){"undefined"!=typeof process&&JSON.stringify(process.env).indexOf("GITHUB")>-1&&process.exit(0);class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
