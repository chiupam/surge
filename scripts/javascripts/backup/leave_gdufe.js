/*

[Script]
# > 广东财经大学假条(student.wozaixiaoyuan.com)
广东财经大学假条 = type=http-response, pattern=^https?:\/\/student\.wozaixiaoyuan\.com\/(leave2\/getList\.json|leave2\/getLeave\.json|web\/leave2\/.*\?schoolId=89), requires-body=1, max-size=-1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/leave_gdufe.js

[Mitm]
hostname = %APPEND% student.wozaixiaoyuan.com

git: https://github.com/chiupam/surge/blob/main/scripts/leave_gdufe.js
raw: https://raw.githubusercontent.com/chiupam/surge/main/scripts/leave_gdufe.js
plugin: https://raw.githubusercontent.com/chiupam/surge/main/Loon/leave_gdufe.plugin
sgmoudule: https://raw.githubusercontent.com/chiupam/surge/main/Surge/leave_gdufe.sgmodule

*/

Date.prototype.format = function(formatTime) { 
  var o = {"M+": this.getMonth() + 1, "d+": this.getDate(), "h+": this.getHours(), "m+": this.getMinutes()}
  if(/(y+)/.test(formatTime)) {formatTime=formatTime.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length))}
  for(var k in o) {if (new RegExp("("+ k +")").test(formatTime)) {formatTime = formatTime.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)))}}
  return formatTime
}

function approveTime(time, flag) {
  time.setHours(Math.max(9, Math.floor(Math.random() * 23)))
  time.setMinutes(Math.floor(Math.random() * 59))
  date = time.getDate() - 1
  month = time.getMonth()
  if (date <= 0) {
    month == 1 ? month = 12 : month = month - 1
    month == 2 ? date = 28 : date = 30
  }
  time.setMonth(month)
  time.setDate(date)
  flag == 1 ? t = time.format("MM-dd hh:mm") : t = time.format("yyyy-MM-dd hh:mm")
  return t
}

var $ = Env()
var Url = $request.url
var Method = $request.method
const id = $.read('gdufe_id') || "370150523346044894"
if (Method == "GET" && Url.indexOf(id) != -1) {
  var Body = $response.body.toString()
} else if (Method == "POST" && Url.indexOf("get") != -1) {
  var Body = JSON.parse($response.body)
}
if ($.read('gdufe_isLeave') == 'false') {
  Body = JSON.parse($response.body)
} else {
  const time = new Date()
  const nowDate = time.format("yyyy-MM-dd")
  const nowHour = time.getHours()
  time.setHours(Math.max(0, (nowHour - 2)))
  const start = `${nowDate} ${time.format("hh")}:05`
  time.setHours(Math.min(23, (nowHour + 2)))
  const end = `${nowDate} ${time.format("hh")}:59`
  const approve1 = approveTime(time, 1)
  const approve2 = approveTime(time, 2)
  const studentName = $.read('gdufe_studentName') || ''
  const studentId = $.read('gdufe_studentId') || ''
  const college = $.read("gdufe_college") || ""
  const grade = $.read("gdufe_grade") || ""
  const phone = $.read('gdutf_phone') || ''
  const type = $.read('gdufe_type') || '事假'
  const reason = $.read("gdufe_reason") || "有事外出"
  const route = $.read("gdufe_route") || "西门"
  const teacher = $.read("gdufe_teacher") || ""
  if (Url.indexOf('getList') != -1 && Method == "POST") {
    Body= {
      "data": [
        {
          "schoolId": "89",
          "end": end,
          "start": start,
          "id": id,
          "title": reason,
          "type": type,
          "state": 3,
          "out": 1
        }
      ],
      "code": 0
    }
  } else if (Url.indexOf("getLeave") != -1 && Method == "POST") {
    Body= {
      "data": {
        "location": "[\"佛山三水校区\"]",
        "studentName": studentName,
        "college": college,
        "approve": [
          {
            "reason": "批准！",
            "position": college,
            "time": approve1,
            "userType": 4,
            "name": teacher,
            "state": 2
          }
        ],
        "teacher": teacher,
        "tel": phone,
        "scanHistory": [],
        "school": "广东财经大学",
        "type": type,
        "state": 2,
        "number": studentId,
        "date": approve2,
        "studentId": id,
        "route": route,
        "phone": phone,
        "grade": grade,
        "end": end,
        "out": 1,
        "reason": reason,
        "start": start
      },
      "code": 0
    }
  } else if (Url.indexOf(id) != -1 && Method == "GET") {
    Body = `<!DOCTYPE html>
    <!-- saved from url=(0075)https://student.wozaixiaoyuan.com/web/leave2/${id}?schoolId=89 -->
    <html style="font-size: 71.8933px;"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>电子假条</title>
        <script type="text/javascript">
            //JS监听浏览器文字大小代码
            //1rem=24px
            (function (doc, win) {
                var docEl = doc.documentElement,
                    resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize',
                    recalc = function () {
                        var clientWidth = docEl.clientWidth;
                        if (!clientWidth) return;
                        docEl.style.fontSize = 20 * (clientWidth / 375) + 'px';
                    };
                if (!doc.addEventListener) return;
                win.addEventListener(resizeEvt, recalc, false);
                doc.addEventListener('DOMContentLoaded', recalc, false);
            })(document, window);
        </script>
        <style type="text/css">
            * {
                margin: 0px;
                padding: 0px;
            }
            body, div, dl, dt, dd, ul, ol, li, h1, h2, h3, h4, h5, h6, pre, code, form, fieldset, legend, input, button, textarea, p, blockquote, th, td {
                margin: 0;
                padding: 0;
            }
            ul, li {
                list-style: none;
            }
            a {
                text-decoration: none;
                color: #000000;
            }
            body {
                font-family: "微软雅黑";
                /*font-size: 0.625;*/
                padding: 1rem 1rem;
            }
            img {
                display: block;
                max-width: 100%;
            }
            .clean {
                clear: both;
                width: 0px;
                height: 0px;
                line-height: 0px;
                overflow: hidden;
            }
            header {
                display: flex;
                flex-direction: row;
                align-items: center;
                padding-bottom: 0.5rem;
                border-bottom: 1px solid #f3f3f3;
            }
            .header-rt {
                font-size: 0.8rem;
                font-weight: bold;
                margin-bottom: 0.1rem;
            }
            .header-rb {
                font-size: 0.6rem;
            }
            header img {
                width: 2rem;
                height: 2rem;
                margin-right: 0.6rem;
                border-radius: 50%;
            }
            .list-cont {
                padding: 0.6rem 0;
    
            }
            .list {
                font-size: 0.7rem;
                display: flex;
                flex-direction: row;
                line-height: 1.3rem;
            }
            .lisft {
                width: 6rem;
            }
            .listr {
                color: #6c6c6c;
            }
            .list-center {
                font-size: 0.7rem;
                padding: 0.6rem 0;
                border-bottom: 1px solid #f3f3f3;
                color: #6c6c6c;
            }
            .list-center-ul li {
                margin: 0.3rem 0;
            }
            .foot {
                display: flex;
                flex-direction: row;
                align-items: center;
                padding-top: 0.5rem;
                padding-bottom: 0.5rem;
            }
            .foot img {
                width: 2rem;
                height: 2rem;
                margin-right: 0.6rem;
                border-radius: 50%;
            }
            .foot-r {
                flex: 1;
            }
            .foot-rb {
                font-size: 0.6rem;
                display: flex;
                justify-content: space-between;
                flex: 1;
                flex-direction: column;
            }
            .foot-rb > div {
                display: flex;
                justify-content: space-between;
            }
            .foot-context {
                color: #6c6c6c;
                font-size: 0.7rem;
                line-height: 1.3rem;
                text-indent: 2em;
            }
        </style>
    </head>
    <body>
    <header>
        <img src="https://student.wozaixiaoyuan.com/web/leave2/${id}?schoolId=89">
        <div class="header-r">
            <div class="header-rt">${studentName}</div>
            <div class="header-rb">${college}(${grade})</div>
        </div>
    </header>
    <section>
        <ul class="list-cont">
            <li class="list">
                <div class="lisft">请假事由:</div>
                <div class="listr">${type}</div>
            </li>
            <li class="list">
                <div class="lisft">请假开始时间:</div>
                <div class="listr">
                    ${start}
                </div>
            </li>
            <li class="list">
                <div class="lisft">请假结束时间:</div>
                <div class="listr">
                    ${end}
                </div>
            </li>
            <li class="list">
                <div class="lisft">紧急联系人:</div>
                <div class="listr">
                    ${phone}
                </div>
            </li>
            <li class="list">
                <div class="lisft">申请时间:</div>
                <div class="listr">${approve2}</div>
            </li>
            <li class="list">
                <div class="lisft">是否离校:</div>
                <div class="listr">
                        离校
                </div>
            </li>
            <li class="list">
                    <div class="lisft">外出地点:</div>
                    <div class="listr">
                        ${route}
                    </div>
            </li>
        </ul>
    </section>
    <section class="list-center">
        ${reason}
    </section>
    <ul class="list-center-ul">
    </ul>
    <section class="foot">
        <img src="https://student.wozaixiaoyuan.com/web/leave2/${id}?schoolId=89">
        <div class="foot-r">
            <div class="header-rt">${teacher}</div>
            <div class="foot-rb">
                <div>
                <div>
                    审批通过
                </div>
        <div>${approve2}</div>
        </div>
        <div></div>
        </div>
        </div>
    </section>
    <div class="clean"></div>
    </body></html>`
  }
}

if (Method == "GET" && Url.indexOf("school") != -1) {
  $.done({body: Body})
} else if (Method == "POST" && Url.indexOf("get") != -1) {
  $.done({body: JSON.stringify(Body)})
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
  log = (message) => console.log(message)
  done = (value = {}) => {$done(value)}
  return { LN, SG, QX, read, write, notice, get, post, put, log, done }
}
