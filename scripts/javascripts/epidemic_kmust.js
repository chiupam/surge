/*

##### Surge #####
[Script]
# > 昆工疫情JWSESSION (student.wozaixiaoyuan.com)
昆工疫情SESSION = type=http-request, pattern=^https?://student\.wozaixiaoyuan\.com/heat/getTodayHeatList\.json, requires-body=1, max-size=-1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/epidemic_kmust.js
# > 昆工疫情签到
昆工疫情签到 = type=cron, cronexp="1 0 7,12,22 * * *", wake-system=1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/epidemic_kmust.js, script-update-interval=0

[MITM]
hostname = %APPEND% student.wozaixiaoyuan.com

##### Loon #####
[Script]
# > 昆工疫情JWSESSION (student.wozaixiaoyuan.com)
http-request ^https?://student\.wozaixiaoyuan\.com/heat/getTodayHeatList\.json script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/epidemic_kmust.js, requires-body=true, timeout=10, tag=昆工疫情JWSESSION
# > 昆工疫情签到
cron "0 0 7,12,22 * * *" script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/epidemic_kmust.js, tag=昆工疫情签到

[MITM]
hostname = student.wozaixiaoyuan.com

##### Settings #####
type: http-request
body: true | 1
raw: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/epidemic_kmust.js
regex: ^https?://student\.wozaixiaoyuan\.com/heat/getTodayHeatList\.json

type: cron
crontab: 0 0 7,12,22 * * *
raw: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/epidemic_kmust.js

##### URL #####
regex: ^https?://student\.wozaixiaoyuan\.com/heat/getTodayHeatList\.json
git: https://github.com/chiupam/surge/blob/main/scripts/javascripts/epidemic_kmust.js
raw: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/epidemic_kmust.js
sgmoudule: https://raw.githubusercontent.com/chiupam/surge/main/Surge/KMUST.sgmodule
boxjs: https://raw.githubusercontent.com/chiupam/surge/main/boxjs/chiupam.boxjs.json

*/

const $ = new Env('🌼 昆明理工大学 🌼')
const host = `https://student.wozaixiaoyuan.com/`
const inSchool = $.getdata("kmust_inSchool")
const checkin_address = $.getdata("kmust_address") || "云南省昆明市呈贡区致远路与郎溪街交叉口"
const nowHours = new Date().getHours()
const illustrate = `微信 => 小程序 => 我在校园 => 日检日报`

if (typeof $request !== `undefined`) {
  start() // 写入JWSESSION
} else {
  if (inSchool == `true`) {
    heal_run() // 日检日报
  } else {
    health_run() // 健康打卡
  }
}

function start() {
  const Method = $request.method
  const JWSESSION = $.getdata("kmust_JWSESSION")
  if (Method == "POST" || Method == "GET") {
    if ($request.headers) {
      if ($request.headers.JWSESSION != JWSESSION || !JWSESSION) {
        $.setdata($request.headers.JWSESSION, "kmust_JWSESSION")
        $.log($request.headers.JWSESSION)
      }
    } else {
      $.msg($.name, ``, `⭕ 无法读取请求头`)
    }
  }
  $.done()
}

function period() {
  if (nowHours < 10) {
    i = 0, t = `晨检`
  } else if (nowHours < 15) {
    i = 1, t = `午检`
  } else {
    i = 2, t = `晚检`
  }
  return {i, t}
}

function geocoding() {
  $.log(`${inSchool == "true" ? "🏫" : "🏠"} ${checkin_address}`)
  return new Promise(resolve => {
    const options = {
      url: `${$.getdata("serverless_api")}KMUST`,
      body: `address=${checkin_address}`
    }
    $.log(`🧑‍💻 正在通过地址转换出打卡封包`)
    $.post(options, (err, resp, data) => {
      try {
        if (data) {
          $.dkbody = $.toObj(data)
          $.latitude = $.dkbody.latitude
          if ($.latitude == 0) {
            $.log(`❌ 无法获取正确的打卡封包`)
          } else {
            $.log(`✅ 获取打卡封包成功`)
            $.log(`✅ 所在国家 --> ${$.dkbody.country}`)
            $.log(`✅ 所在省份 --> ${$.dkbody.province}`)
            $.log(`✅ 所在城市 --> ${$.dkbody.city}`)
            $.log(`✅ 所在政区 --> ${$.dkbody.district}`)
            $.log(`✅ 所在街道 --> ${$.dkbody.township}`)
            $.log(`✅ 所在道路 --> ${$.dkbody.street}`)
            $.log(`✅ 行政编码 --> ${$.dkbody.areacode}`)
            $.log(`✅ 所在纬度 --> ${$.dkbody.latitude}`)
            $.log(`✅ 所在经度 --> ${$.dkbody.longitude}`)
            $.timestampHeader = $.dkbody.timestampHeader
            $.signatureHeader = $.dkbody.signatureHeader
            $.fastbody = $.dkbody.data
          }
        } else if (err) {
          $.log(`❌ 获取打卡封包时 API 请求失败`)
          $.log($.toStr(err))
        }
      } catch (e) {
        $.log(`❌ 获取打卡封包时发生错误`)
        $.logErr(e, resp)
      } finally {
        resolve()
      }
    })
  })
}

function heat_task() {
  return new Promise(resolve => {
    const options = {
      url: `${host}heat/getTodayHeatList.json`,
      headers: {"JWSESSION": $.getdata("kmust_JWSESSION")}
    }
    $.log(`🧑‍💻 获取当天日检日报签到情况`)
    $.post(options, (err, resp ,data) => {
      try {
        if (data) {
          if ($.toObj(data).code != -10) {
            $.log(`✅ 成功获取本次打卡任务`)
            $.list = $.toObj(data).data[period().i]
          } else {
            $.log(`❌ 当前JWSESSION已过期`)
            $.list = -10
          }
        } else if (err) {
          $.log(`❌ 获取日检日报任务列表时发生错误`)
          $.log($.toStr(err))
        }
      } catch (e) {
        $.log(`❌ 访问日检日报 API 时发生错误`)
        $.logErr(e, resp)
      } finally {
        resolve()
      }
    })
  })
}

function heat_save() {
  const quantitative = `answers=["0"]&seq=${$.list.seq}&temperature=36.0&userId=&myArea=&`
  return new Promise(resolve => {
    const options = {
      url: `${host}heat/save.json`,
      headers: {"JWSESSION": $.getdata("kmust_JWSESSION")},
      body: encodeURI(quantitative + $.fastbody)
    }
    $.log(`🧑‍💻 信息完成组装,开始${period().t}打卡`)
    $.post(options, (err, resp, data) => {
      try {
        if (data) {
          $.checkin = $.toObj(data)
          if ($.checkin.code == 0) {
            $.log(`✅ ${period().t}打卡成功`)
            // $.msg($.name, `✅ ${period().t}打卡成功 ✅`, ``)
          } else {
            $.log(`❌ ${period().t}打卡失败`)
            $.log($.toStr($.checkin))
            $.msg($.name, `❌ ${period().t}打卡失败 ❌`, `📡 ${$.checkin.message}`)
          }
        } else if (err) {
          $.log(`❌ 签到时 API 请求失败`)
          $.log($.toStr(err))
        }
      } catch (e) {
        $.log(`❌ 签到时发生错误`)
        $.logErr(e, resp)
      } finally {
        resolve()
      }
    })
  })
}

async function heal_run() {
  if ($.getdata("kmust_JWSESSION")) {
    await heat_task()
    if ($.list != -10) {
      if ($.list.state == 0) {
        $.log(`⭕ ${period().t}打卡未开启`)
      } else if ($.list.state == 2) {
        $.log(`⭕ ${period().t}打卡已经结束`)
      } else if ($.list.type == 1) {
        $.log(`⭕ ${period().t}已经打卡`)
      } else {
        await geocoding()
        if ($.latitude != 0) {
          await heat_save()
        } else {
          $.msg($.name, `❌ ${period().t}打卡失败 ❌`, `📡 无法获取正确的打卡封包`)
        }
      }
    } else {
      $.log(`❌ 我在校园JWSESSION已过期`)
      $.msg($.name, `❌ 我在校园JWSESSION已过期,请重新抓包❗`, illustrate)
    }
  } else {
    $.log(`❌ 暂无我在校园JWSESSION`)
    $.msg($.name, `❌ 暂无我在校园JWSESSION,请先抓包❗`, illustrate)
  }
  $.done()
}

function health_task() {
  return new Promise(resolve => {
    const options = {
      url: `${host}health/getToday.json`,
      headers: {"JWSESSION": $.getdata("kmust_JWSESSION")}
    }
    $.log(`🧑‍💻 获取当天健康打卡情况`)
    $.post(options, (err, resp ,data) => {
      try {
        if (data) {
          if ($.toObj(data).code != -10) {
            $.log(`✅ 成功获取当天健康打卡任务`)
            $.list = $.toObj(data).data
          } else {
            $.log(`❌ 当前JWSESSION已过期`)
            $.list = -10
          }
        } else if (err) {
          $.log(`❌ 获取日检日报任务列表时发生错误`)
          $.log($.toStr(err))
        }
      } catch (e) {
        $.log(`❌ 访问日检日报 API 时发生错误`)
        $.logErr(e, resp)
      } finally {
        resolve()
      }
    })
  })
}

function health_save() {
  const quantitative = `answers=["0"]`
  return new Promise(resolve => {
    const options = {
      url: `${host}health/save.json`,
      headers: {"JWSESSION": $.getdata("kmust_JWSESSION")},
      body: encodeURI(quantitative + $.fastbody)
    }
    $.log(`🧑‍💻 信息完成组装,开始今日健康打卡`)
    $.post(options, (err, resp, data) => {
      try {
        if (data) {
          $.checkin = $.toObj(data)
          if ($.checkin.code == 0) {
            $.log(`✅ 今日健康打卡成功`)
            // $.msg($.name, `✅ 今日健康打卡成功 ✅`, ``)
          } else {
            $.log(`❌ 今日健康打卡失败`)
            $.log($.toStr($.checkin))
            $.msg($.name, `❌ 今日健康打卡失败 ❌`, `📡 ${$.checkin.message}`)
          }
        } else if (err) {
          $.log(`❌ 签到时 API 请求失败`)
          $.log($.toStr(err))
        }
      } catch (e) {
        $.log(`❌ 签到时发生错误`)
        $.logErr(e, resp)
      } finally {
        resolve()
      }
    })
  })
}

async function health_run() {
  if ($.getdata("kmust_JWSESSION")) {
    await health_task()
    if ($.list != -10) {
      if ($.list.country) {
        $.log(`⭕ 今日健康已经打卡`)
      } else {
        await geocoding()
        if ($.latitude != 0) {
          await health_save()
        } else {
          $.msg($.name, `❌ 健康打卡失败 ❌`, `📡 无法获取正确的打卡封包`)
        }
      }
    } else {
      $.log(`❌ 我在校园JWSESSION已过期`)
      $.msg($.name, `❌ 我在校园JWSESSION已过期,请重新抓包❗`, illustrate)
    }
  } else {
    $.log(`❌ 暂无我在校园JWSESSION`)
    $.msg($.name, `❌ 暂无我在校园JWSESSION,请先抓包❗`, illustrate)
  }
  $.done()
}

function Env(t,e){"undefined"!=typeof process&&JSON.stringify(process.env).indexOf("GITHUB")>-1&&process.exit(0);class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log(`🏃 开始执行程序!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["📣 系统通知"];console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log(`❌ 错误!`,t.stack):this.log(`❌ 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log(`🕛 ${s} 秒`),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}

