/*

[Script]
# 今日校园假条(kmu.campusphere.net)
今日校园假条 = type=http-response, pattern=^https:\/\/kmu\.campusphere\.net\/wec-counselor-leave-apps\/leave\/stu\/.*, requires-body=1, max-size=-1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/leave_kmu.js

[Mitm]
hostname = %APPEND% kmu.campusphere.net

git: https://github.com/chiupam/surge/blob/main/scripts/leave_kmm.js
raw: https://raw.githubusercontent.com/chiupam/surge/main/scripts/leave_kmm.js

*/

const $ = new Env()
var Url = $request.url
var Body = JSON.parse($response.body)
const isLeave = $.read('isLeave') || 'true'
if (isLeave == 'false') {
  Body = JSON.parse($response.body)
} else {
  var newDate = new Date()
  var Month = newDate.getMonth() + 1
  var Day = newDate.getDate()
  var Hour = newDate.getHours()
  var hours = Hour + 1
  if (hours < 10) {
    hours = 8
    auto_end_date = Day + 1
  } else {
    if (hours >= 11) {
      auto_begin_hours = Hour - 3
      var auto_begin_hours = ('0' + auto_begin_hours).slice(-2)
    }
    auto_end_date = Day
  }
  var preset_begin_date = ('0' + Day).slice(-2)
  var preset_end_date = ('0' + auto_end_date).slice(-2)
  var current_hours =  ('0' + hours).slice(-2)
  const leaveType = $.read('leaveType') || '其他'
  const leaveReason = $.read('leaveReason') || '外出购买生活用品'
  const destination = $.read('destination') || ''
  const studentInfo = $.read('studentInfo') || ''
  const urgencyMobile = $.read('urgencyMobile') || ''
  const approverName = $.read('approverName') || ''
  const begin_date = $.read('begin_date') || preset_begin_date
  const end_date = $.read('end_date') || preset_end_date
  const begin_hours = $.read('begin_hours') || auto_begin_hours || '08'
  const end_hours = $.read('end_hours') || current_hours
  if (parseInt(end_date) >= parseInt(begin_date)) {
    begin_month = Month
    end_month = Month
    if (parseInt(end_date) == parseInt(begin_date)) {
      between_day = parseInt(end_date) - parseInt(begin_date)
      between_hour = parseInt(end_hours) - parseInt(begin_hours)
    } else {
      if ( parseInt(end_hours) >= parseInt(begin_hours)) {
        between_day = parseInt(end_date) - parseInt(begin_date)
        between_hour = parseInt(end_hours) - parseInt(begin_hours)
      } else {
        between_day = parseInt(end_date) - parseInt(begin_date) - 1
        between_hour = parseInt(end_hours) - parseInt(begin_hours) + 24
      }
    }
  } else {
    begin_month = Month
    end_month = Month + 1
    var Year = newDate.getFullYear()
    between_day = parseInt(end_date) - parseInt(begin_date) + new Date(Year, Month, 0).getDate()
    if (parseInt(end_hours) >= parseInt(begin_hours)) {
      between_hour = parseInt(end_hours) - parseInt(begin_hours)
    } else {
      between_hour = parseInt(end_hours) - parseInt(begin_hours) + 24
    }
  }
  const BeginMonth = ('0' + begin_month).slice(-2)
  const EndMonth = ('0' + end_month).slice(-2)
  const createDate = ('0' + (parseInt(begin_date) - 1)).slice(-2)
  const approverDate = ('0' + (parseInt(begin_date) - 1)).slice(-2)
  const BeginDate = ('0' + begin_date).slice(-2)
  const EndDate = ('0' + end_date).slice(-2)
  const LeaveBeginTime = ('0' + begin_hours).slice(-2)
  const LeaveEndTime = ('0' + end_hours).slice(-2)
  const leaveTime = between_day + "天" + between_hour + "小时0分钟"
  const createTime = BeginMonth + "-" + createDate + " " + (begin_hours - 2).toString() + ":11"
  const approverTime = BeginMonth + "-" + approverDate + " " + (begin_hours - 2).toString() + ":28"
  const startTime = BeginMonth + "-" + BeginDate + " " + LeaveBeginTime + ":00"
  const endTime = EndMonth + "-" + EndDate + " " + LeaveEndTime + ":00"
  if (Url.indexOf('list') != -1) {
    Body= {
      "message": "success", 
      "datas": {
        "rows": [{
          "leaveType": leaveType,
          "status": "2",
          "createTime":createTime,
          "startTime": startTime,
          "endTime": endTime,
          "leaveTime": leaveTime
        }]
      },
      "code": "0"
    }
  } else if (Url.indexOf('detail') != -1) {
    Body= {
      "message": "SUCCESS",
      "datas": {
        "detail": {
          "startTime": startTime,
          "approvers": [{
            "status": "1",
            "handled": true,
            "approveNode": [{
              "createTime": createTime,
              "approvers": [],
              "status": "1"
            }],
            "approver": {"userName": studentInfo.split("，")[0]},
            "createTime": createTime
            },{
              "status": "3",
              "handled": true,
              "approveNode": [{
                "nodeType": "1",
                "nodeWid": "1003",
                "nodeName": "辅导员",
                "approvers": []
              }],
              "approver": {"userName": approverName},
              "level": "1",
              "approveOption": "同意批假，路上注意个人防护！",
              "createTime": approverTime
          }],
          "leaveReason": leaveReason,
          "urgencyMobile": urgencyMobile,
          "totalDays": leaveTime,
          "destination": destination.toString().replace(/，/g, "/"),
          "leaveType": leaveType,
          "endTime": endTime,
          "outStatus": true,
          "status": "2",
          "applyLocation": {
            "locationType": 0,
            "latitude": "24.982288",
            "longitude": "102.805404",
            "address": "中国云南省昆明市官渡区阿拉街道云大北路1号"
          },
          "actStatus": "7",
          "disclaimers": "本人承诺填写的信息真实有效，并对本次提交请假申请的信息真实性负责。",
        },
        "studentInfo": {
          "userName": studentInfo.split("，")[0],
          "userId": studentInfo.split("，")[1],
          "dept": studentInfo.split("，")[2],
          "grade": studentInfo.split("，")[3],
          "major": studentInfo.split("，")[4],
          "cls": studentInfo.split("，")[5]
        },
        "recordStatus": "6",
        "notOutReport": {
          "setedNotOutReport": 1,
          "rule": 0,
          "operatorName": "李雄",
          "operatorDate": "2021-06-07 10:06:36"
        }
      },
    "code": "0"
    }
  } else {
    var s = ""
    var qr = ""
    for (let i = 0; i < 9; i ++) {
      qr += (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
    }
    Body = {
      "message": "SUCCESS",
      "datas": {
        "qr": qr,
        "currentTime": new Date().Format("yyyy-MM-dd hh:mm:ss")
      },
      "code": "0"
    }
  }
}
$.done({body: JSON.stringify(Body)})

function Env() {
  // NE = typeof module && !!module.exports != "undefined"
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
