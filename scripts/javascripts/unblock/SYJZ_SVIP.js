/*

[Script]
# > 鲨鱼记账 SVIP (api.shayujizhang.com)
鲨鱼记账 SVIP = type=http-response, pattern=https:\/\/api\.shayujizhang\.com\/account\/grant\/detail\/info, requires-body=1, max-size=-1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/unblock/SYJZ_SVIP.js

[MITM]
hostname = %APPEND% api.shayujizhang.com

*/

var body = $response.body;
var url = $request.url;
const path1 = "/account/grant/detail/info/";
if (url.indexOf(path1) != -1) {
	let obj = JSON.parse(body);
	obj.data.vip = {"isvip": 1,"days": 999};
	body = JSON.stringify(obj);
 }
$done({body});
