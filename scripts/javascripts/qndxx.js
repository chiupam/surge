/*

##### Surge #####
[Script]
# > 云南青年大学习Cookie (home.yngqt.org.cn)
云南青年大学习Cookie = type=http-response, pattern=^http://home\.yngqt\.org\.cn/user/weixin_yngqt\.aspx\?getcode=.*, requires-body=0, timeout=120, max-size=-1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/qndxx.js
# > 云南青年大学习
云南青年大学习 = type=cron, cronexp="13 13 13 * * 1,2,3,4,5", wake-system=1, timeout=180, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/qndxx.js

[MITM]
hostname = %APPEND% home.yngqt.org.cn

##### Loon #####
[Script]
# > 云南青年大学习Cookie (home.yngqt.org.cn)
云南青年大学习Cookie = type=http-response, pattern=^http://home\.yngqt\.org\.cn/user/weixin_yngqt\.aspx\?getcode=.*, requires-body=0, timeout=120, max-size=-1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/qndxx.js
# > 云南青年大学习
cron "13 13 13 * * 1,2,3,4,5" script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/qndxx.js, tag=云南青年大学习

[Mitm]
hostname = home.yngqt.org.cn

##### Settings #####
type: http-response
body: false | 0
raw: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/qndxx.js
regex: ^http://home\.yngqt\.org\.cn/user/weixin_yngqt\.aspx\?getcode=.*

type: cron
crontab: 13 13 13 * * 1,2,3,4,5
raw: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/qndxx.js


##### URL #####
git: https://github.com/chiupam/surge/blob/main/scripts/javascripts/qndxx.js
raw: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/qndxx.js
boxjs: https://raw.githubusercontent.com/chiupam/surge/main/boxjs/chiupam.boxjs.json
sgmoudule: https://raw.githubusercontent.com/chiupam/surge/main/Surge/QNDXX.sgmodule
plugin: https://raw.githubusercontent.com/chiupam/surge/main/Loon/qndxx.plugin

*/

const $ = new Env("👨‍🎓 云南大学习")
const host = "http://home.yngqt.org.cn/"
const review = $.getdata("qndxx_review")
const holiday = $.getdata("qndxx_study")
const headers = {
  "Cookie": $.getdata("qndxx_cookie"),
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.18(0x1800123f) NetType/4G Language/zh_CN"
}
const illustrate = `微信 => 通讯录 => 公众号 => 云南共青团 => 大学习 => 注册团员登录学习`
typeof $request !== 'undefined' ? start() : main()

function start() {
  if ($response.headers) {
    set_cookie = $response.headers["Set-Cookie"]
    set_cookie = set_cookie.match(/DianCMSUser(\S*)/)[1]
    set_cookie = "DianCMSUser" + set_cookie
    $.setdata(set_cookie, "qndxx_cookie")
    $.log(set_cookie)
  } else {
    $.msg($.name, ``, `⭕ 无法读取请求头`)
  }
  $.done()
}

function user() {
  return new Promise((resolve) => {
    const options = {
      url: `${host}qndxx/user/`,
      headers: headers
    }
    $.log(`🧑‍💻 开始获取用户信息`)
    $.get(options, (error, response, data) => {
      try {
        if (data) {
          integral = data.match(/积分：(\d*)/)[1]
          $.log(`✅ 当前积分:${integral}`)
          $.check = `true`
        } else if (error) {
          $.log(`❌ 访问 user 接口时发生错误`)
          $.log($.toStr(error))
          $.check = `false`
        }
      } catch (e) {
        $.log(`❌ Cookie已失效`)
        $.check = `false`
      } finally {
        resolve()
      }
    })
  })
}

function qiandao() {
  return new Promise((resolve) => {
    const options = {
      url: `${host}qndxx/user/qiandao.ashx`,
      headers: headers,
    }
    $.log(`🧑‍💻 开始签到`)
    $.post(options, (error, response, data) => {
      try {
        if (data) {
          $.log(`✅ ${$.toObj(data).message}`)
        } else if (error) {
          $.log(`❌ 签到时发生错误`)
          $.log($.toStr(error))
        }
      } catch (e) {
        $.log(`❌ 访问 qiandao 接口时发生错误`)
        $.logErr(e, response)
      } finally {
        resolve()
      }
    })
  })
}

function txtid() {
  return new Promise((resolve) => {
    const options = {
      url: `${host}qndxx/default.aspx`,
      headers: headers
    }
    $.log(`🧑‍💻 开始获取青年大学习数据`)
    $.get(options, (error, response, data) => {
      try {
        if (data) {
          $.txtid = data.match(/study\((\d*)\)/)[1] * 1
          $.title = data.match(/习”(\S*)<\/p><p class="p2">(\S*)<\/p>/)
          $.log(`✅ 最新一期期数:${$.title[1]}(${$.txtid})`)
          $.log(`✅ 最新一期名称:${$.title[2]}`)
        } else if (error) {
          $.txtid = `false`
          $.log(`❌ 获取青年大学习时发生错误`)
          $.log($.toStr(error))
        }
      } catch (e) {
        $.log(`❌ 访问 default 接口时发生错误`)
        $.logErr(e, response)
      } finally {
        resolve()
      }
    })
  })
}

function study(id) {
  return new Promise((resolve) => {
    const options = {
      url: `${host}qndxx/xuexi.ashx`,
      headers: headers,
      body: `{"txtid": ${id * 1}}`
    }
    $.log(`🧑‍💻 开始学习第${id}期青年大学习`)
    $.post(options, (error, response, data) => {
      try {
        if (data) {
          $.log(`✅ ${$.toObj(data).message}`)
        } else if (error) {
          $.log(`❌ 学习第${id}期青年大学习时发生错误`)
          $.log($.toStr(error))
        }
      } catch (e) {
        $.log(`❌ 访问 xuexi 接口时发生错误`)
        $.logErr(e, response)
      } finally {
        resolve()
      }
    })
  })
}

async function main() {
  if ($.getdata("qndxx_cookie")) {
    await user()
    if ($.check == `true`) {
      await qiandao()
      if (holiday == "true") {
        await txtid()
        if ($.txtid != `false`) {
          await study($.txtid)
          if (review == `true`) {
            await study($.txtid * 1 - 1)
          }
        }
      } else {
        $.log(`🎉 今天偷懒了,不用学习`)
      }
    } else {
      $.msg($.name, `❌ Cookie已失效,请重新获取`, illustrate)
    }
  } else {
    $.msg($.name, `❌ Cookie为空,请先获取`, illustrate)
  }
  $.done()
}


function Env(t,e){"undefined"!=typeof process&&JSON.stringify(process.env).indexOf("GITHUB")>-1&&process.exit(0);class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log(`🏃 开始执行程序!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["📣 系统通知"];console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log(`❌ 错误!`,t.stack):this.log(`❌ 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log(`🕛 ${s} 秒`),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}

