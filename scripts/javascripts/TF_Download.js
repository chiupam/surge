/**
 * 
 * 脚本说明：突破 TestFlight 下载限制，脚本搬运至 NobyDa 大佬。
 * 源地址：https://gist.githubusercontent.com/NobyDa/9be418b93afc5e9c8a8f4d28ae403cf2/raw/TF_Download.js
 * 
 */

const $ = new Env('')

let Body = $.toObj($request.body)
Body.storefrontId = '143380-1,29'
$.done({body: $.toStr(Body)})

function Env() {
  LN = typeof $loon != "undefined"
  SG = typeof $httpClient != "undefined" && !LN
  QX = typeof $task != "undefined"
  toObj = (str) => JSON.parse(str)
  toStr = (obj) => JSON.stringify(obj)
  done = (value = {}) => {$done(value)}
  return { toObj, toStr, done }
}
