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


// 定义一个 Date 类型的格式化方法，用于将日期对象转换为指定格式的字符串
Date.prototype.format = function(format) {
  // 定义一个对象，用于存储日期对象的各个部分
  var o = {
    "M+": this.getMonth() + 1, // 月份
    "d+": this.getDate(), // 日
    "h+": this.getHours(), // 小时
    "m+": this.getMinutes(), // 分钟
    "s+": this.getSeconds(), // 秒钟
    "q+": Math.floor((this.getMonth() + 3) / 3), // 季度
    "S": this.getMilliseconds() // 毫秒
  }
  // 将年份替换为指定格式的字符串
  if (/(y+)/.test(format)) format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length))
  // 遍历对象 o，将对象 o 中的各个部分替换为指定格式的字符串
  for (var k in o) if (new RegExp("(" + k + ")").test(format)) format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length))
  // 返回指定格式的字符串
  return format
}

// 获取环境变量
var $ = Env()

// 获取当前时间，并将小时数减去 4，得到请假开始时间
const Time = new Date()
Time.setHours(Math.max(0, (Time.getHours() - 4)))
const LeaveBeginTime = Time.format("hh")

// 将时间加上 6 小时，得到请假结束时间
Time.setHours(Math.min(23, (Time.getHours() + 6)))
const LeaveEndTime = Time.format("hh")

// 获取请假时间间隔和请假开始、结束日期
const interval = $.read("interval") * 1 || 1
const LeaveEndDate = Time.format("yyyy-MM-dd")
Time.setDate(Time.getDate() - interval + 1)
const LeaveBeginDate = Time.format("yyyy-MM-dd")

// 计算请假天数
const LeaveNumNo = ((LeaveEndTime - LeaveBeginTime) / 24 + interval - 1).toFixed(2)

// 构造请假单 ID
const ID = "452" + Time.getDate().toString().padStart(2, "0")

// 解析响应体，并根据请求 URL 进行相应的修改
var Body = $.toObj($response.body)
if ($request.url.indexOf("Student/GetStu") != -1) {
  // 修改学生信息
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
  // 修改请假信息
  if ($.read("isLeave") != "false") {
    if ($request.url.indexOf("_Edit") == -1) {
      // 添加请假单
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
      // 修改请假结束时间和返校时间
      Body.LeaveEndTime = LeaveEndTime
      Body.BackTime = LeaveEndTime
    } else if ($request.url.indexOf(ID) != -1) {
      // 获取指定 ID 的请假单
      Body = One()
    }
  }
}

// 返回修改后的响应体
$.done({body: $.toStr(Body)})

// 定义一个用于构造请假单的函数
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

// 定义一个用于获取指定 ID 的请假单的函数
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

// 定义一个用于获取环境变量的函数
function Env() {
  // 判断当前运行环境，并返回相应的函数
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
