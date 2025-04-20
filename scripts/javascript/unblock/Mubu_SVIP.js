/*

[Script]
# > 幕布 SVIP (api2.mubu.com)
幕布 SVIP = type=http-response, pattern=https?:\/\/api2\.mubu\.com\/v3\/api\/user\/current_user, requires-body=1, max-size=-1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascript/unblock/Mubu_SVIP.js

[MITM]
hostname = %APPEND% api2.mubu.com

*/

var url = $request.url;
const path = "/v3/api/user/current_user";
if (url.indexOf(path) != -1) {
  let obj = JSON.parse($response.body);
  obj.data.vipEndDate = "20330912";
  body = JSON.stringify(obj);
}
$done({body});

/*
var obj = JSON.parse($response.body);
 obj={
 "code": 0,
 "msg": null,
 "data": {
    "facebookId": "",
    "facebookName": "",
    "province": "",
    "encryptPassword": null,
    "passSecure": false,
    "qqId": "",
    "updateTime": 1602941084029,
    "sort": "time",
    "googleName": "",
    "vipEndDate": "20330912",
    "city": "",
    "year": "",
    "agreeTermService": false,
    "name": "嘤嘤嘤",
    "appleName": "",
    "id": 4960640,
    "gender": "",
    "level": 2,
    "email": "",
    "wxId": "",
    "wxName": "",
    "phone": null,
    "toutiaoId": "",
    "appleId": "",
    "qqName": "",
    "view": "grid",
    "larkId": "",
    "googleId": "",
    "photo": "",
    "remark": "",
    "createTime": 1592534977160,
    "anonymUserFlag": 0
 }
};
$done({body: JSON.stringify(obj)});
*/
