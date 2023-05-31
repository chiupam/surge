/*

使用方法：打开中国联通APP，点击我的，点击右上角签到即可，

##### Surge #####
[MITM]
hostname = %APPEND% act.10010.com

[Script]
中国联通(Scriptable) = type=http-request, pattern=^https?://act\.10010\.com/SigninApp/signin/querySigninActivity\.htm, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scriptable/rewrite/10010.cookie.js, script-update-interval=0, timeout=60

*/

const $ = Env()

if ($request.method != "OPTIONS" && $request.headers) {
  const CUCC_Cookie = $request.headers.Cookie
  $.write(CUCC_Cookie, "CUCC_Cookie")
  const CUCC_Mobile = $request.headers.Cookie.match(/c_mobile=([^;]+)/)[1]
  $.write(CUCC_Mobile, "CUCC_Mobile")
}
$.done()

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
  log = (message) => console.log(message)
  done = (value = {}) => {$done(value)}
  return { read, write, notice, log, done }
}
