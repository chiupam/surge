/**
 * 
 * hostname: xg.kmmu.edu.cn
 * 
 * type: http-response
 * regex: ^https?://xg\.kmmu\.edu\.cn/KmmcXG/webapi/api/(Leave/AllLeaveManage(_Edit)?|Student/GetStuHomePage|Student/GetStuPersonInfo)\?LoginStatus=.*
 * script-path: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/leave_kmmu.js
 *
 * BoxJs: https://raw.githubusercontent.com/chiupam/surge/main/boxjs/chiupam.boxjs.json
 *
 */


 Date.prototype.format = function(format) {
  var o = {
    "M+": this.getMonth() + 1, //month
    "d+": this.getDate(), //day
    "h+": this.getHours(), //hour
    "m+": this.getMinutes(), //minute
    "s+": this.getSeconds(), //second
    "q+": Math.floor((this.getMonth() + 3) / 3), //quarter
    "S": this.getMilliseconds() //millisecond
  }
  if (/(y+)/.test(format)) format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length))
  for (var k in o) if (new RegExp("(" + k + ")").test(format)) format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length))
  return format
}

var $ = Env()
const Time = new Date()
Time.setHours(Math.max(0, (Time.getHours() - 4)))
const LeaveBeginTime = Time.format("hh")
Time.setHours(Math.min(23, (Time.getHours() + 6)))
const LeaveEndTime = Time.format("hh")
const interval = $.read("interval") * 1 || 1
const LeaveEndDate = Time.format("yyyy-MM-dd")
Time.setDate(Time.getDate() - interval + 1)
const LeaveBeginDate = Time.format("yyyy-MM-dd")
const LeaveNumNo = ((LeaveEndTime - LeaveBeginTime) / 24 + interval - 1).toFixed(2)
const ID = "452" + Time.getDate().toString().padStart(2, "0")

var Body = $.toObj($response.body)
if ($request.url.indexOf("Student/GetStu") != -1) {
	if ($request.url.indexOf("GetStuHomePage") != -1) {
		Body.UserInfo.Name = $.read("StudentName") || ""
		Body.UserInfo.UserId = $.read("StudentId") || "2022010001"
		Body.UserInfo.Photo = ""
	} else if ($request.url.indexOf("GetStuPersonInfo") != -1) {
		Body.Name = $.read("StudentName") || ""
		Body.CollegeName = $.read("CollegeName") || "第一临床学院"
		Body.StudentId = $.read("StudentId") || "2022010001"
		Body.Nation = "汉"
		Body.NativePlace = $.read("NativePlace") || "云南省昆明市盘龙区"
		Body.Polity = "共青团员"
		Body.IdCard = $.read("StudentIdCard") || ""
		Body.MoveTel = $.read("StudentTel") || ""
		Body.Photo = ""
	}
} else {
	if ($.read("isLeave") != "false") {
		if ($request.url.indexOf("_Edit") == -1) {
			Body.IsLeave = 1
			if (Body.AllLeaveManages.length > 0) {
				if (Body.AllLeaveManages[0].Status == "假期中") {
					LeaveManages = Body.AllLeaveManages[0]
					LeaveManages.LeaveEndTime = LeaveEndTime
					LeaveNumNoCache = (LeaveEndTime - LeaveManages.LeaveBeginTime * 1) / 24
					LeaveManages.LeaveNumNo = (LeaveNumNoCache + interval - 1).toFixed(2)
				} else {
					Body.AllLeaveManages.unshift(All())
				}
			} else {
				Body.AllLeaveManages.push(All())
			}
		} else if ($request.url.indexOf("_Edit") != -1 && Body.OverStatus == "1") {
			Body.LeaveEndTime = LeaveEndTime
			Body.BackTime = LeaveEndTime
		} else if ($request.url.indexOf(ID) != -1) {
			Body = One()
		}
	}
}
$.done({body: $.toStr(Body)})

function All() {
  return {
    "LeaveType": $.read("LeaveType") || "事假（含家人生病）",
    "WithNumNo": $.read("WithNumNo") || "0",
    "OutAddress": $.read("OutAddress") || "市区",
    "Status": "已通过",
    "StatusName": "辅导员审核通过",
    "ID": ID,
    "LeaveBeginDate": LeaveBeginDate,
    "LeaveBeginTime": LeaveBeginTime,
    "LeaveEndDate": LeaveEndDate,
    "LeaveEndTime": LeaveEndTime,
    "LeaveNumNo": LeaveNumNo
  }
}

function One() {
  Note = All()
	Note.GoOutConfirmName = "是"
  Note.LeaveThing = $.read("LeaveThing") || "家中急事"
  Note.OutName = $.read("StudentName") || ""
  Note.OutMoveTel = $.read("StudentTel") || ""
  Note.Relation = "本人"
  Note.StuMoveTel = $.read("StudentTel") || ""
  Note.ParentContacts = $.read("ParentName") || ""
  Note.ParentTel = $.read("ParentTel") || ""
  Note.GoVehicle = $.read("Vehicle") || "汽车"
  Note.BackVehicle = $.read("Vehicle") || "汽车"
  Note.StuName = $.read("StudentName") || ""
  Note.GoOut = "1"
  Note.Inputdate = LeaveBeginDate
  Note.GoDate = LeaveBeginDate
  Note.BackDate = LeaveEndDate
  Note.GoTime = LeaveBeginTime
  Note.BackTime = LeaveEndTime
  return Note
}

function Env() {
  LN = typeof $loon != "undefined"
  SG = typeof $httpClient != "undefined" && !LN
  QX = typeof $task != "undefined"
  read = (key) => {
    if (LN || SG) return $persistentStore.read(key)
    if (QX) return $prefs.valueForKey(key)
  }
  toStr = (obj) => JSON.stringify(obj)
  toObj = (str) => JSON.parse(str)
  log = (message) => console.log(message)
  done = (value = {}) => {$done(value)}
  return { read, toStr, toObj, log, done }
}
