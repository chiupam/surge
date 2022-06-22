const $ = Env()
var Body = {
  "product_infos": [
    {
      "product_id": "5210897752128663390",
      "start_time": 1405674945,
      "end_time": 2147483648,
      "buy_time": "1405674945",
      "cluster": "offlinedl",
      "detail_cluster": "offlinedl",
      "product_name": "offlinedl_permanent"
    },
    {
      "product_name": "contentvip_nd",
      "product_description": "超级会员",
      "function_num": 0,
      "start_time": 1655518919,
      "buy_description": "",
      "buy_time": 0,
      "product_id": "1",
      "auto_upgrade_to_svip": 0,
      "end_time": 1687103999,
      "cluster": "vip",
      "detail_cluster": "svip",
      "status": 0
    }
  ],
  "currenttime": 1655745382,
  "reminder": {
    "reminderWithContent": [],
    "advertiseContent": []
  },
  "request_id": 508438507580862691
}
$.done({body: $.toStr(Body)})

function Env() {
  LN = typeof $loon != "undefined"
  SG = typeof $httpClient != "undefined" && !LN
  QX = typeof $task != "undefined"
  toStr = (obj) => JSON.stringify(obj)
  done = (value = {}) => {$done(value)}
  return { toStr, done }
}