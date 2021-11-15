/*

[Script]
# > 易班假条(xg.kmmu.edu.c(n|om))
易班假条 = type=http-response, pattern=^https?:\/\/xg\.kmmu\.edu.cn\/KmmcXG\/webapi\/api\/Leave\/AllLeaveManage(_Edit)?\?LoginStatus=.*, requires-body=1, max-size=-1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/leave_kmmu.js

[Mitm]
hostname = %APPEND% xg.kmmu.edu.c(n|om)

git: https://github.com/chiupam/surge/blob/main/scripts/leave_kmmu.js
raw: https://raw.githubusercontent.com/chiupam/surge/main/scripts/leave_kmmu.js
plugin: https://raw.githubusercontent.com/chiupam/surge/main/Loon/Leave.plugin
sgmoudule: https://raw.githubusercontent.com/chiupam/surge/main/Surge/Leave.sgmodule

*/
Date.prototype.format = function(formatTime) { 
  var o = {"M+" : this.getMonth() + 1, "d+": this.getDate(), "h+": this.getHours()}
  if(/(y+)/.test(formatTime)) {formatTime=formatTime.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length))}
  for(var k in o) {if (new RegExp("("+ k +")").test(formatTime)) {formatTime = formatTime.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)))}}
  return formatTime
}
var $ = Env()
var Url = $request.url
var Body = JSON.parse($response.body)
const isLeave = $.read('isLeave') || 'true'
if (isLeave == 'false') {
  Body = JSON.parse($response.body)
} else {
  const time = new Date()
  const nowHour = time.getHours()
  time.setHours(Math.max(0, (nowHour - 2)))
  const LeaveBeginTime = time.format("hh")
  time.setHours(Math.min(23, (nowHour + 2)))
  const LeaveEndTime = time.format("hh")
  const LeaveBeginDate = time.format("yyyy-MM-dd")
  const interval = $.read("interval") * 1 || 1
  time.setDate(time.getDate() + interval - 1)
  const LeaveEndDate = time.format("yyyy-MM-dd")
  const LeaveNumNo = ((LeaveEndTime - LeaveBeginTime) / 24 + interval * 1 - 1).toFixed(2)
  const LeaveType = $.read('LeaveType') || '事假'
  const LeaveThing = $.read('LeaveThing') || '有事外出'
  const WithNumNo = $.read('WithNumNo') || '0'
  const OutAddress = $.read('OutAddress') || ''
  const StudentName = $.read('StudentName') || ''
  const StudentTel = $.read('StudentTel') || ''
  const ParentName = $.read('ParentName') || ''
  const ParentTel = $.read('ParentTel') || ''
  const Vehicle = $.read('Vehicle') || '汽车'
  const ID = Math.random().toString().substr(2, 4)
  if (Url.indexOf('_Edit') == -1) {
    Body= {
      "AllLeaveManages": [{
        "LeaveType": LeaveType,
        "WithNumNo": WithNumNo,
        "OutAddress": OutAddress, 
        "FDYThing": "同意",
        "Status": "假期中",
        "StatusName": "辅导员审核通过",
        "ID": ID,
        "LeaveBeginDate": LeaveBeginDate,
        "LeaveBeginTime": LeaveBeginTime,
        "LeaveEndDate": LeaveEndDate,
        "LeaveEndTime": LeaveEndTime,
        "LeaveNumNo": LeaveNumNo
      }],
      "IsLeave": 1
    }
  } else {
    Body= {
      "LeaveType": LeaveType,
      "LeaveThing": LeaveThing,
      "OutAddress": OutAddress,
      "OutName": StudentName,
      "OutMoveTel": StudentTel,
      "OutTel": "",
      "Relation": "本人",
      "StuMoveTel": StudentTel,
      "StuOtherTel": "",
      "ParentContacts": ParentName,
      "ParentTel": ParentTel,
      "LeaveBeginDate": LeaveBeginDate,
      "Inputdate": LeaveBeginDate,
      "GoDate": LeaveBeginDate,
      "LeaveEndDate": LeaveEndDate,
      "BackDate": LeaveEndDate,
      "LeaveBeginTime": LeaveBeginTime,
      "GoTime": LeaveBeginTime,
      "LeaveEndTime": LeaveEndTime,
      "BackTime": LeaveEndTime,
      "GoVehicle": Vehicle,
      "BackVehicle": Vehicle,
      "StuName": StudentName,
      "WithNumNo": WithNumNo,
      "LeaveNumNo": LeaveNumNo,
      "GoOut": "1",
      "studentId": "202010001",
      "ID": ID,
      "Status": "假期中",
      "FDYThing": "同意"
    }
  }    
}
$.done({body: JSON.stringify(Body)})

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
