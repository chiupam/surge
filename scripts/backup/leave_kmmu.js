/*

##### Surge #####
[Script]
# > 易班假条(xg.kmmu.edu.c(n|om))
易班假条 = type=http-response, pattern=^https?:\/\/xg\.kmmu\.edu.cn\/KmmcXG\/webapi\/api\/Leave\/AllLeaveManage(_Edit)?\?LoginStatus=.*, requires-body=1, max-size=-1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/leave_kmmu.js

[Mitm]
hostname = %APPEND% xg.kmmu.edu.c(n|om)

##### Loon #####
[Script]
http-response ^https?:\/\/xg\.kmmu\.edu.cn\/KmmcXG\/webapi\/api\/Leave\/AllLeaveManage(_Edit)?\?LoginStatus=.* script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/leave_kmmu.js, requires-body=true, timeout=120, tag=学工假条

[Mitm]
hostname = xg.kmmu.edu.cn

type: http-response
body: true
raw: https://raw.githubusercontent.com/chiupam/surge/main/scripts/leave_kmmu.js
regex: ^https?:\/\/xg\.kmmu\.edu.cn\/KmmcXG\/webapi\/api\/Leave\/AllLeaveManage(_Edit)?\?LoginStatus=.*

git: https://github.com/chiupam/surge/blob/main/scripts/leave_kmmu.js
plugin: https://raw.githubusercontent.com/chiupam/surge/main/Loon/leave_kmmu.plugin
sgmoudule: https://raw.githubusercontent.com/chiupam/surge/main/Surge/Leave.sgmodule
box: https://raw.githubusercontent.com/chiupam/surge/main/boxjs/chiupam.boxjs.json

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
const isLeave = $.read("isLeave") || "true"
if (isLeave == "false") {
  Body = JSON.parse($response.body)
} else {
  const LeaveType = $.read("LeaveType") || "事假"
  const LeaveThing = $.read("LeaveThing") || "有事外出"
  const WithNumNo = $.read("WithNumNo") || "0"
  const OutAddress = $.read("OutAddress") || ""
  const StudentName = $.read("StudentName") || ""
  const StudentTel = $.read("StudentTel") || ""
  const ParentName = $.read("ParentName") || ""
  const ParentTel = $.read("ParentTel") || ""
  const Vehicle = $.read("Vehicle") || "汽车"
  const interval = $.read("interval") * 1 || 1

  const time = new Date()
  time.setHours(Math.max(0, (time.getHours() - 4)))
  const LeaveBeginTime = time.format("hh")
  time.setHours(Math.min(23, (time.getHours() + 6)))
  const LeaveEndTime = time.format("hh")
  time.setDate(time.getDate() - interval + 1)
  const LeaveBeginDate = time.format("yyyy-MM-dd")
  time.setDate(time.getDate() + interval - 1)
  const LeaveEndDate = time.format("yyyy-MM-dd")
  const LeaveNumNo = ((LeaveEndTime - LeaveBeginTime) / 24 + interval * 1 - 1).toFixed(2)
  // const ID = Math.round(Math.random() * (30000 - 45000) + 46000)
  const ID = "452" + time.getDate().toString().padStart(2, "0")
  if (Url.indexOf("_Edit") == -1) {
    Note = {
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
    }
    Body.AllLeaveManages.unshift(Note)
    Body.IsLeave = 1
  } else if (Url.indexOf(ID) != -1) {
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
  } else {
    Body = JSON.parse($response.body)
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
  log = (message) => console.log(message)
  done = (value = {}) => {$done(value)}
  return { read, log, done }
}
