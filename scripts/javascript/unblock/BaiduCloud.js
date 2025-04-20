// 获取环境变量
const $ = Env()

// 设置请求体
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

// 返回请求结果
$.done({ body: $.toStr(Body) })

// 环境变量函数
function Env() {
  // 判断运行环境
  LN = typeof $loon != "undefined"; // Loon
  SG = typeof $httpClient != "undefined" && !LN; // Surge
  QX = typeof $task != "undefined"; // Quantumult X

  // 定义toStr函数，将对象转换为字符串
  toStr = (obj) => JSON.stringify(obj)

  // 定义done函数，返回请求结果
  done = (value = {}) => { $done(value) }

  // 返回环境变量对象
  return { toStr, done }
}
