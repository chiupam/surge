/*

## ---------- Surge ---------- ##
[Script]
# > 广东财经大学日检日报获取JWSESSION (student.wozaixiaoyuan.com)
广东财经大学日检日报获取JWSESSION = type=http-request, pattern=^https?:\/\/student\.wozaixiaoyuan\.com\/health\/(getToday|save)\.json, requires-body=1, max-size=-1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/epidemic_gdufe.js
# > 广东财经大学日检日报
广东财经大学日检日报 = type=cron, cronexp="0 3 0,7,12,18 * * *", wake-system=1, timeout=180, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/epidemic_gdufe.js

[MITM]
hostname = %APPEND% student.wozaixiaoyuan.com

## ---------- Loon ---------- ##
[Script]
# > 广东财经大学日检日报获取JWSESSION (student.wozaixiaoyuan.com)
http-request ^https?:\/\/student\.wozaixiaoyuan\.com\/health\/(getToday|save)\.json script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/epidemic_gdufe.js, requires-body=true, timeout=10, tag=广东财经大学日检日报获取JWSESSION
# > 广东财经大学日检日报
cron "0 3 0,7,12,18 * * *" script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/epidemic_gdufe.js, tag=广东财经大学日检日报

[MITM]
hostname = student.wozaixiaoyuan.com

## ---------- Quantumult X ---------- ##
[rewrite_local]
# > 广东财经大学日检日报获取JWSESSION (student.wozaixiaoyuan.com)
^https?:\/\/student\.wozaixiaoyuan\.com\/health\/(getToday|save)\.json url script-request-header https://raw.githubusercontent.com/chiupam/surge/main/scripts/epidemic_gdufe.js

[task_local]
# > 广东财经大学日检日报
3 0,7,12,18 * * * https://raw.githubusercontent.com/chiupam/surge/main/scripts/epidemic_gdufe.js, tag=广东财经大学日检日报, enabled=true

[mitm]
hostname = student.wozaixiaoyuan.com

regex: ^https?:\/\/student\.wozaixiaoyuan\.com\/health\/(getToday|save)\.json
git: https://github.com/chiupam/surge/blob/main/scripts/epidemic_gdufe.js
raw: https://raw.githubusercontent.com/chiupam/surge/main/scripts/epidemic_gdufe.js
sgmoudule: https://raw.githubusercontent.com/chiupam/surge/main/Surge/Task.sgmodule
boxjs: https://raw.githubusercontent.com/chiupam/surge/main/boxjs/chiupam.boxjs.json

*/

const $ = new Env('广东财经大学')
const host = `https://student.wozaixiaoyuan.com/`
const inSchool = $.getdata("gdufe_inSchool")
const username = $.getdata("gdufe_username")
const pwd = $.getdata("gdufe_pwd")
const nowHours = new Date().getHours()
typeof $request !== 'undefined' ? set() : run()

function set() {
  const Method = $request.method
  const JWSESSION = $.getdata("gdufe_JWSESSION")
  if (Method == "POST" || Method == "GET") {
    if ($request.headers) {
      if ($request.headers.JWSESSION != JWSESSION || !JWSESSION) {
        $.setdata($request.headers.JWSESSION, "gdufe_JWSESSION")
        $.msg($.name, "✅写入 JWSESSION 成功", $request.headers.JWSESSION)
      } else if ($request.url.indexOf("save") != -1) {
        const body = $response.body.split("&")
        const arr = ["latitude", "longitude"]
        const arr_cn = ["纬度", "经度"]
        var writein = ""
        for (var m = 0; m < body.length; m++) {
          for (var n = 0; n < arr.length; n++) {
            if (body[m].indexOf(arr[n]) != -1) {
              $.setdata(decodeURIComponent(body[m].split("=")[1]), `gdufe_${arr[n]}`)
              $.log(`✅写入：gdufe_${arr[n]} --> ${decodeURIComponent(body[m].split("=")[1])}`)
              writein += `${arr_cn[n]} --> ${decodeURIComponent(body[m].split("=")[1])}\n`
            }
          }
        }
        $.msg($.name, `✅写入打卡数据成功`, writein)
      }
    } else {
      $.msg($.name, ``, `⭕无法读取请求头`)
    }
  }
  $.done()
}

function period() {
  if (0 <= nowHours && nowHours < 9) {
    i = 0, t = `晨检`
  } else if (11 <= nowHours && nowHours < 15) {
    i = 1, t = `午检`
  } else if (17 <= nowHours && nowHours < 23) {
    i = 2, t = `晚检`
  } else {
    i = -1, t = `未在`
  }
  return {i, t}
}

function jwtask() {
  return new Promise(resolve => {
    const options = {
      url: `${host}heat/getTodayHeatList.json`,
      headers: {"JWSESSION": $.getdata("gdufe_JWSESSION")}
    }
    $.log(`🧑‍💻获取当天日检日报情况`)
    $.post(options, (err, resp ,data) => {
      try {
        if (data) {
          if (JSON.parse(data).code != -10) {
            $.log(`✅获取任务列表成功`)
            $.list = JSON.parse(data).data[period().i]
          } else {
            $.log(`❌当前JWSESSION已过期`)
            $.list = -10
          }
        } else if (err) {
          $.log(`❌获取日检日报时发生错误`)
          $.log(JSON.stringify(err))
        }
      } catch (e) {
        $.log(`❌访问日检日报API时发生错误`)
        $.logErr(e, resp)
      } finally {
        resolve()
      }
    })
  })
}

function jwsession() {
  return new Promise(resolve => {
    const options = {
      url: `https://gw.wozaixiaoyuan.com/basicinfo/mobile/login/username?username=${$.getdata("gdufe_username")}&password=${$.getdata("gdufe_pwd")}`,
      headers: {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 "},
      body: `{}`
    }
    $.log(`🧑‍💻正在获取新的JWSESSION值`)
    $.post(options, (err, resp, data) => {
      try {
        if (data) {
          if (JSON.parse(data).code == 0) {
            $.list = JSON.stringify(resp.headers.JWSESSION).replace(/"/g, "")
            $.setdata($.list, "gdufe_JWSESSION")
            $.log(`✅成功设置${JSON.parse(data).sessionUser.name}的JWSESSION`)
          } else {
            $.list = -10
            $.log(`❌登录失败！建议改密码后再尝试！`)
          }
        } else {
          $.log(`❌登录时API请求失败！`)
          $.log(JSON.stringify(err))
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve()
      }
    })
  })
}

function geocoding() {
  inSchool == "true" ? address = `广东省佛山市三水区广东财经大学` : address = $.getdata("gdufe_address")
  $.log(`${inSchool == "true" ? "🏫" : "🏠"}${address}`)
  return new Promise(resolve => {
    const options = {
      url: `https://api.map.baidu.com/geocoding/v3/?address=${encodeURI(address)}&output=json&ak=2ZrHEZzf1z4gbNGZ96GmIaWYoWGGDMZC`
    }
    $.log(`🧑‍💻正在通过地址转换出经纬度`)
    $.get(options, (err, resp, data) => {
      try {
        if (data) {
          $.location = JSON.parse(data).result.location
          $.latitude = $.location.lat
          $.log(`✅所在纬度 --> ${$.latitude}`)
          $.longitude = $.location.lng
          $.log(`✅所在经度 --> ${$.longitude}`)
        } else if (err) {
          $.log(`❌获取地址时API请求失败`)
          $.log(`⭕将使用默认地址`)
          $.log(JSON.stringify(err))
        }
      } catch (e) {
        $.log(`❌获取地址时发生错误`)
        $.log(`⭕将使用默认地址`)
        $.logErr(e, resp)
      } finally {
        resolve()
      }
    })
  })
}

function reverse_geocoding() {
  $.log(`🧑‍💻正在通过经纬度转换出地址信息`)
  return new Promise(resolve => {
    const options = {
      url: `https://api.map.baidu.com/reverse_geocoding/v3/?ak=2ZrHEZzf1z4gbNGZ96GmIaWYoWGGDMZC&output=json&location=${$.latitude ? $.latitude : inSchool == "true" ? "23.212478651049256" : $.getdata("gdufe_latitude")},${$.longitude ? $.longitude : inSchool == "true" ? "112.86226153904119" : $.getdata("gdufe_longitude")}&extensions_town=true`
    }
    $.get(options, (err, resp, data) => {
      try {
        if (data) {
          $.location = JSON.parse(data).result.addressComponent
          $.province = $.location.province
          $.log(`✅所在省份 --> ${$.province}`)
          if ($.getdata("gdufe_province") != $.province) {$.setdata($.province, "gdufe_province")}
          $.city = $.location.city
          $.log(`✅所在城市 --> ${$.city}`)
          if ($.getdata("gdufe_city") != $.city) {$.setdata($.city, "gdufe_city")}
          $.district = $.location.district
          $.log(`✅所在政区 --> ${$.district}`)
          if ($.getdata("gdufe_district") != $.district) {$.setdata($.district, "gdufe_district")}
          $.township = $.location.town
          $.log(`✅所在街道 --> ${$.township}`)
          if ($.getdata("gdufe_township") != $.township) {$.setdata($.township, "gdufe_township")}
          $.street = $.location.street
          $.log(`✅所在道路 --> ${$.street}`)
          if ($.getdata("gdufe_street") != $.street) {$.setdata($.street, "gdufe_street")}
          $.areacode = $.location.adcode
          $.log(`✅行政编码 --> ${$.areacode}`)
          if ($.getdata("gdufe_areacode") != $.areacode) {$.setdata($.areacode, "gdufe_areacode")}
        } else if (err) {
          $.log(`⭕获取地址时API请求失败`)
          $.log(`⭕将使用默认地址`)
          $.log(JSON.stringify(err))
        }
      } catch (e) {
        $.log(`⭕获取地址时发生错误`)
        $.log(`⭕将使用默认地址`)
        $.logErr(e, resp)
      } finally {
        resolve()
      }
    })
  })
}

function jwdosign() {
  const answers = `answers=["0"]&`
  const userId = `userId=&`
  const myArea = `myArea=&`
  const temperature = `temperature=36.0&`
  const seq = `seq=${$.list.seq}&`
  const country = `country=中国&` // 国家
  const province = `province=${$.province ? $.province : inSchool == "true" ? "广东省" : $.getdata("gdufe_province")}&`
  const city = `city=${$.city ? $.city : inSchool == "true" ? "佛山市" : $.getdata("gdufe_city")}&`
  const district = `district=${$.district ? $.district : inSchool == "true" ? "三水区" : $.getdata("gdufe_district")}&`
  const township = `township=${$.township ? $.township : inSchool == "true" ? "云海东街道" : $.getdata("gdufe_township")}&`
  const street = `street=${$.street ? $.street : inSchool == "true" ? "大学路" : $.getdata("gdufe_street")}&`
  const areacode = `areacode=${$.areacode ? $.areacode : inSchool == "true" ? "440607" : $.getdata("gdufe_areacode")}`
  const latitude = `latitude=${$.latitude ? $.latitude : inSchool == "true" ? "23.212478651049256" : $.getdata("gdufe_latitude")}&` // 纬度
  const longitude = `longitude=${$.longitude ? $.longitude : inSchool == "true" ? "112.86226153904119" : $.getdata("gdufe_longitude")}&` // 经度
  const body0 = `${answers}${seq}${temperature}${userId}`
  const body1 = `${latitude}${longitude}${country}${province}${city}${district}${township}${street}`
  const body2 = `${myArea}${areacode}`
  const body = `${body0}${body1}${body2}`
  return new Promise(resolve => {
    const options = {
      url: `${host}heat/save.json`,
      headers: {"JWSESSION": $.getdata("gdufe_JWSESSION")},
      body: encodeURI(body)
    }
    $.log(`🧑‍💻信息完成组装，开始${period().t}打卡`)
    $.post(options, (err, resp, data) => {
      try {
        if (data) {
          $.checkin = JSON.parse(data)
        } else if (err) {
          $.log(`❌签到时API请求失败`)
          $.log(JSON.stringify(err))
        }
      } catch (e) {
        $.log(`❌签到时发生错误`)
        $.logErr(e, resp)
      } finally {
        resolve()
      }
    })
  })
}

async function jwsign() {
  if ($.list == -10) {
    delete $.list
    await jwtask()
  }
  if ($.list != -10) {
    if ($.list.state == 1 && $.list.type == 0) {
      $.log(`⭕${period().t}没有打卡`)
      await geocoding()
      await reverse_geocoding()
      await jwdosign()
      if ($.checkin.code == 0) {
        $.log(`✅${period().t}打卡成功`)
        $.log(`✅返回数据包：${JSON.stringify($.checkin)}`)
        // $.msg($.name, `✅${period().t}打卡成功`, ``)
      } else {
        $.log(`❌${period().t}打卡失败`)
        $.log(`❌返回数据包：${JSON.stringify($.checkin)}`)
        $.msg($.name, `❌${period().t}打卡失败`, ``)
      }
    } else {
      $.log(`✅${period().t}已经打卡了！`)
      // $.msg($.name, `✅${period().t}已经打卡`, ``)
    }
  } else {
    $.log(`❌登录失败！建议改密码后再尝试！`)
    $.msg($.name, `❌登录失败！建议改密码后再尝试！`, ``)
  }
}

async function run() {
  if (period().i == -1) {
    $.log(`❌不在打卡时间内！`)
    $.msg($.name, `❌打卡失败`, `${period().t}规定的时间范围内！`)
  } else {
    if ($.getdata("gdufe_JWSESSION")) {
      await jwtask()
      if ($.list == -10) {
        delete $.list
        await jwsession()
      }
      await jwsign()
    } else if (username && pwd) {
      await jwsession()
      await jwsign()
    } else {
      $.log(`❌赞无我在校园JWSESSION，也暂未设置登陆账号和密码，进入boxjs设置`)
      $.msg($.name, `❌暂未设置登陆账号和密码❗`, `前点击通知栏前往boxjs设置❗`, `http://boxjs.net`)
    }
  }
  $.done()
}

// prettier-ignore
function Env(t,e){"undefined"!=typeof process&&JSON.stringify(process.env).indexOf("GITHUB")>-1&&process.exit(0);class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)}
