/**
 *
 * 使用方法: 打开打开小程序手动进行一次打卡即可。
 *
 * Surge's Moudule: https://raw.githubusercontent.com/chiupam/surge/main/Surge/Procuratorate.sgmodule
 * BoxJs: https://raw.githubusercontent.com/chiupam/surge/main/boxjs/chiupam.boxjs.json
 *
 * hostname: xxxx.xxxxxxx.xx
 *
 * type: http-request
 * regex: ^https?://xxxx\.xxxxxxx\.xx/AttendanceCard/SaveAttCheckinout$
 * script-path: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/procuratorate.js
 * requires-body: 1 | true
 *
 * type: cron
 * cron: 1 56,58 8 * * *
 * script-path: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/procuratorate.js
 *
 * type: cron
 * cron: 1 1 17 * * *
 * script-path: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/procuratorate.js

 * =============== Surge ===============
 * 工作打卡Cookie = type=http-request, pattern=^https?://xxxx\.xxxxxxx\.xx/AttendanceCard/SaveAttCheckinout$, requires-body=1, max-size=-1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/procuratorate.js, script-update-interval=0, timeout=30
 * 工作打卡 = type=cron, cronexp="1 56,58 8 * * *", wake-system=1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/procuratorate.js, script-update-interval=0, timeout=60
 * 工作打卡 = type=cron, cronexp="1 1 17 * * *", wake-system=1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/procuratorate.js, script-update-interval=0, timeout=60
 */


/**
 * 创建一个名为 $ 的环境变量实例，用于处理工作打卡相关操作
 */
const $ = new Env(`🧑‍💼 工作打卡`);

/**
 * 工作打卡的主机地址
 */
const host = $.read(`procuratorate_host`);

/**
 * 检查是否为请求阶段
 */
let isreq = typeof $request !== 'undefined';

/**
 * 主函数，用于执行打卡操作或设置请求数据
 */
!(async () => {
  if (isreq) {
    // 请求阶段，设置请求数据
    const requestBody = $.toObj($request.body);
    const { lng, lat } = requestBody.model;

    // 将请求数据保存到文件
    const dataToWrite = {
      'procuratorate_body': requestBody,
      'procuratorate_UnitCode': requestBody.model.UnitCode,
      'procuratorate_userID': requestBody.model.userID,
      'procuratorate_userDepID': requestBody.model.userDepID,
      'procuratorate_Mid': requestBody.model.Mid,
      'procuratorate_RunID': requestBody.model.Num_RunID,
      'procuratorate_lng': lng.substr(0, lng.length - 3),
      'procuratorate_lat': lat.substr(0, lat.length - 3),
      'procuratorate_realaddress': requestBody.model.realaddress,
      'procuratorate_address': requestBody.model.administratorChangesRemark,
      'procuratorate_cookie': $request.headers['cookie'],
      'procuratorate_agent': $request.headers['user-agent']
    };
    Object.entries(dataToWrite).forEach(([key, value]) => $.write(value, key));

    // 发送通知，显示写入数据成功
    $.notice($.name, '✅ 写入数据成功', '', '');
  } else {
    // 执行打卡操作阶段
    const storedRequestBody = $.read('procuratorate_body');
    if (storedRequestBody) {
      // 检查当天是否为工作日
      let workday = getDayStatus();

      if (workday === null) {
        $.log('⭕ 本地假日表需要更新, 尽快更新');

        // 本地假日表需要更新，使用api主接口再次检查
        workday = await checkWorkdayStatus();

        // 请求主接口出现错误，使用备用接口再次检查
        if (workday === null) workday = await checkWorkdayStatus(false);
      }

      // 如果当天不是工作日，取消打卡
      if (!workday) {
        $.log('⭕ 当天是休息日, 取消打卡');
        // 获取当前是星期几，0代表周日，1代表周一，依此类推
        if (new Date().getDay() >= 1 && new Date().getDay() <= 5) {
          $.notice(`🧑‍💼 警告提醒`, `⭕ 今天确定是休息吗？`, ``, ``)
        }
        return;
      }

      // 检查打卡类型是否符合条件
      const punchType = checkPunchCardAvailability();

      // 判断是否需要进行打卡
      if (!punchType) {
        $.log('⭕ 不符合打卡情况, 取消打卡');
      } else {
        $.log(`✅ 成功获取${punchType}任务`);
        await SaveAttCheckinout(punchType);
      }
    } else {
      // 发送通知，要求用户手动打卡
      $.notice($.name, '⭕', '首次使用请手动打卡', '');
    }
  }
})()
  .catch((e) => $.notice($.name, '❌ 未知错误无法打卡', e, ''))
  .finally(() => $.done());

/**
 * 检查当前时间的打卡状态
 * @param {boolean} status - 指定的打卡状态，可选值为 '上班打卡' 或 '下班打卡'，默认为 false
 * @returns {boolean|string|null} 打卡状态，可能的取值为：'上班打卡'、'下班打卡'、false（不能打卡）
 */
async function checkPunchCardAvailability(status = false) {
  
  /**
   * 检查给定时间是否在指定的时间范围内
   * @param {string} currentTime - 当前时间，格式为 'HH:mm:ss'
   * @param {string} startTime - 起始时间，格式为 'HH:mm:ss'
   * @param {string} endTime - 结束时间，格式为 'HH:mm:ss'
   * @returns {boolean} 给定时间是否在指定的时间范围内
   */
  function isCurrentTimeInRange(currentTime, startTime, endTime) {
    return currentTime >= startTime && currentTime <= endTime;
  }

  // 定义不同时间范围和对应的打卡状态
  const timeRanges = [
    { start: '00:00:00', end: '08:29:59', status: false }, // 凌晨时段，不允许打卡
    { start: '08:30:00', end: '09:00:59', status: '上班打卡' }, // 上班打卡时段
    { start: '09:01:00', end: '16:59:59', status: false }, // 工作时段，不允许打卡
    { start: '17:00:00', end: '20:59:59', status: '下班打卡' }, // 下班打卡时段
    { start: '21:00:00', end: '23:59:59', status: false } // 夜晚时段，不允许打卡
  ];

  // 获取当前时间
  const now = new Date();

  // 获取当前时间的时分秒，并确保格式为 HH:mm:ss
  const currentTime = now.toTimeString().slice(0, 8);

  // 初始化打卡状态为 false
  let result = false;

  // 遍历时间范围，判断当前时间的打卡状态
  for (const range of timeRanges) {
    if (isCurrentTimeInRange(currentTime, range.start, range.end)) {
      if (status === range.status) {
        // 如果指定了打卡状态，且当前时间在对应的打卡时间范围内，则返回对应的打卡状态
        return range.status;
      } else {
        // 如果没有指定打卡状态，则根据当前时间和打卡时间范围判断是否可以打卡
        const attCheckinoutList = await GetAttCheckinoutList(range.status);
        if (
          (range.status === '上班打卡' && attCheckinoutList === 0) || // 上班打卡时段，且当天还未进行过上班打卡
          (range.status === '下班打卡' && (attCheckinoutList === 0 || attCheckinoutList === 1)) // 下班打卡时段，且当天还未进行过上班打卡或下班打卡
        ) {
          result = range.status;
        }
        break; // 跳出循环
      }
    }
  }

  return result;
}

/**
 * 检查工作日状态
 * @param {boolean} [apiType=true] - API类型，true表示主接口，false表示备用接口
 * @returns {Promise<boolean|null>} - 返回工作日状态，true表示工作日，false表示非工作日，null表示请求错误或获取失败
 */
async function checkWorkdayStatus(apiType = true) {
  // 获取当前时间
  const currentTime = new Date();

  // 获取当前时间的年份并转换为字符串
  const currentYear = currentTime.getFullYear().toString();

  // 获取当前时间的月份，并确保格式为两位数
  const currentMonth = (`0` + (currentTime.getMonth() + 1)).slice(-2);

  // 获取当前时间的日期，并确保格式为两位数
  const currentDay = (`0` + currentTime.getDate()).slice(-2);

  // 设置请求参数，并且根据API类型选择不同的请求地址
  const options = {
    url: apiType
      ? `http://timor.tech/api/holiday/info/${currentYear + currentMonth + currentDay}` // 主接口
      : `http://tool.bitefu.net/jiari/?d=${currentYear + currentMonth + currentDay}`, // 备用接口
    timeout: 10000 // 设置请求超时时间为10秒
  };

  // 发送 GET 异步请求并返回一个 Promise 对象
  return new Promise(resolve => {
    $.get(options, (error, response, data) => {
      let result;
      try {
        if (data) {
          if (apiType) {
            // 解析主要API的响应数据
            data = $.toObj(data);
            result = data.code === 0 ? (data.type.type === 0) : null;
          } else {
            // 解析备用API的响应数据
            result = data === '0';
          }
        }
      } catch (e) {
        // 发生异常时，根据API类型返回适当的结果
        result = apiType ? null : $.toObj($.read('procuratorate_fast'));
        $.log(`⭕ 请求超时, ${apiType ? '使用备用接口' : '读取快速签到设置'}`);
      } finally {
        // 返回工作日状态
        resolve(result);
      }
    });
  });
}

/**
 * 获取打卡情况列表
 * @param {string} status - 打卡状态，可选值为 '上班打卡' 或 '下班打卡'
 * @returns {Promise<number>} - Promise对象，在获取完成后解析一个数字表示打卡记录数量
 */
async function GetAttCheckinoutList(status) {
  // 构造请求参数
  const options = {
    url: `https://${host}/AttendanceCard/GetAttCheckinoutList?AttType=1&` +
         `UnitCode=${$.read(`procuratorate_UnitCode`)}&` +
         `userid=${$.read(`procuratorate_userID`)}&` +
         `Mid=${$.read(`procuratorate_Mid`)}`,
    timeout: 10000
  };

  // 发送 POST 异步请求并返回一个 Promise 对象
  return new Promise(resolve => {
    $.post(options, (error, response, data) => {
      let result;
      try {
        if (data) {
          // 解析响应数据并获取打卡记录数量
          const recordCount = $.toObj(data).length;
          $.log(`⏰ ${status}已完成任务长度: ${recordCount}`);
          result = recordCount;
        }
      } catch (e) {
        // 发生异常时，读取快速签到设置并判断是否存在
        $.log(`⭕ 请求超时, 读取快速签到设置`);
        if ($.toObj($.read(`procuratorate_fast`))) {
          result = 0;
        }
      } finally {
        // 无论是否发生异常，都要返回结果
        resolve(result);
      }
    });
  });
}

/**
 * 保存打卡记录
 * @param {string} punchType - 打卡任务的描述，如 "上班打卡" 或 "下班打卡"
 * @returns {Promise<void>} - Promise对象，在保存完成后解析
 */
async function SaveAttCheckinout(punchType) {
  const currentTimeString = new Date().toLocaleTimeString();

  // 调用checkPunchCardAvailability函数检查打卡状态(二重保险以免打了 "迟到" 卡)
  const punchCardAvailable = await checkPunchCardAvailability(punchType);

  // 如果打卡状态为false，则退出运行
  if (!punchCardAvailable) {
    // 程序认为非打卡时段，拒绝进行打卡并发出警告内容
    $.notice($.name, `⭕ 操作时间: ${currentTimeString}`, `💻 程序认为该打卡严重违规, 因此拒绝了打卡请求`, ``)
    return;
  }

  // 生成随机经度
  let lng = Math.floor(Math.random() * 1000);

  // 生成随机纬度
  let lat = Math.floor(Math.random() * 1000);

  // 构造请求参数
  const options = {
    // 请求URL
    url: `https://${host}/AttendanceCard/SaveAttCheckinout`,
    // 头部信息
    headers: {
      "Host": host,
      "Origin": `https://${host}`,
      "Accept": "application/json, text/javascript, */*; q=0.01",
      "Accept-Language": "zh-CN,zh-Hans;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "User-Agent": $.read(`procuratorate_agent`), // 设置请求头部中的 User-Agent
      "cookie": $.read(`procuratorate_cookie`), // 设置请求头部中的 cookie
      "Referer": `https://${host}/AttendanceCard/Attendancecard?` + // 设置请求头部中的 Referer
                 `UnitCode=${$.read(`procuratorate_UnitCode`)}&` +
                 `UserID=${$.read(`procuratorate_userID`)}&` +
                 `appid=103`,
      "X-Requested-With": "XMLHttpRequest"
    },
    // 请求体数据
    body: {
      "model": {
        "Aid": 0,
        "UnitCode": $.read(`procuratorate_UnitCode`), // 设置请求体中的 UnitCode
        "userID": $.read(`procuratorate_userID`), // 设置请求体中的 userID
        "userDepID": $.read(`procuratorate_userDepID`), // 设置请求体中的 userDepID
        "Mid": $.read(`procuratorate_Mid`) * 1, // 设置请求体中的 Mid
        "Num_RunID": $.read(`procuratorate_RunID`) * 1, // 设置请求体中的 Num_RunID
        "lng": $.read(`procuratorate_lng`) + lng, // 设置请求体中的 lng
        "lat": $.read(`procuratorate_lat`) + lat, // 设置请求体中的 lat
        "realaddress": $.read(`procuratorate_realaddress`), // 设置请求体中的 realaddress
        "iSDelete": 0,
        "administratorChangesRemark": $.read(`procuratorate_address`) // 设置请求体中的 administratorChangesRemark
      },
      "AttType": 1
    }
  };

  // 生成随机等待时间（单位：毫秒）
  const randomWaitTime = Math.floor(Math.random() * 5000) + 1000; // 随机等待时间为 1 到 6 秒之间

  // 输出日志，记录经纬度具体情况
  $.log(`📍 经纬度: ${$.read(`procuratorate_lat`)}${lat}, ${$.read(`procuratorate_lng`)}${lng}`);

  // 输出日志，开始打卡操作
  $.log(`💤 程序休眠 ${randomWaitTime / 1000}s 后继续...`);

  // 发送 POST 异步请求并返回一个 Promise 对象
  return new Promise(resolve => {
    setTimeout(() => {
      $.post(options, (error, response, data) => {
        // 在POST请求的回调函数内部输出日志
        $.log(`🧑‍💻 开始进行${punchType}...`);

        if (data) {
          data = $.toObj(data);
          title = `🧑‍💼 ${punchType ? punchType : "非法操作"}${$.url ? "(点击获取最新假日表)" : ""}`;
          url = $.url || ``;
          let subtitle, message;

          if (data.success) {
            // 打卡成功
            subtitle = `✅ 打卡时间: ${currentTimeString}`;
            message = `💻 返回数据: ${data.message}`;
            $.write(`false`, `procuratorate_fast`);
            $.log(`✅ ${punchType}: ${data.message}`);
          } else {
            // 打卡失败
            subtitle = `❌ 当前时间: ${currentTimeString}`;
            message = `💻 打卡失败, 返回数据: ${$.toStr(data)}`;
            $.log(`❌ ${punchType}: ${$.toStr(data)}`);
          }
          subtitle += `(${randomWaitTime / 1000}s)`;
          $.notice(title, subtitle, message, url);
        }
        resolve();
      });
    }, randomWaitTime);
  });
}

/**
 * 获取当前日期的工作日状态
 * @returns {boolean|null} 工作日状态，可能的取值为：true（工作日）、false（非工作日）、null（假日表需要更新）
 */
function getDayStatus() {
  // 获取当前时间
  const currentTime = new Date();

  // 获取当前时间的年份并转换为字符串
  const currentYear = currentTime.getFullYear().toString();

  // 获取当前时间的月份，并确保格式为两位数
  const currentMonth = (`0` + (currentTime.getMonth() + 1)).slice(-2);

  // 获取当前时间的日期，并确保格式为两位数
  const currentDay = (`0` + currentTime.getDate()).slice(-2);

  // 定义节假日json文件内容
  const holidays = {
    "code":0,
    "holiday":{
      "01-01":{"holiday":true,"name":"元旦","wage":3,"date":"2023-01-01","rest":1},
      "01-02":{"holiday":true,"name":"元旦","wage":2,"date":"2023-01-02","rest":1},
      "01-21":{"holiday":true,"name":"除夕","wage":3,"date":"2023-01-21","rest":15},
      "01-22":{"holiday":true,"name":"初一","wage":3,"date":"2023-01-22","rest":1},
      "01-23":{"holiday":true,"name":"初二","wage":3,"date":"2023-01-23","rest":1},
      "01-24":{"holiday":true,"name":"初三","wage":3,"date":"2023-01-24","rest":1},
      "01-25":{"holiday":true,"name":"初四","wage":2,"date":"2023-01-25","rest":1},
      "01-26":{"holiday":true,"name":"初五","wage":2,"date":"2023-01-26","rest":1},
      "01-27":{"holiday":true,"name":"初六","wage":2,"date":"2023-01-27","rest":1},
      "01-28":{"holiday":false,"name":"春节后补班","wage":1,"after":true,"target":"春节","date":"2023-01-28","rest":1},
      "01-29":{"holiday":false,"name":"春节后补班","wage":1,"after":true,"target":"春节","date":"2023-01-29","rest":1},
      "04-05":{"holiday":true,"name":"清明节","wage":3,"date":"2023-04-05","rest":42},
      "04-23":{"holiday":false,"name":"劳动节前补班","wage":1,"target":"劳动节","after":false,"date":"2023-04-23","rest":4},
      "04-29":{"holiday":true,"name":"劳动节","wage":2,"date":"2023-04-29","rest":5},
      "04-30":{"holiday":true,"name":"劳动节","wage":2,"date":"2023-04-30","rest":1},
      "05-01":{"holiday":true,"name":"劳动节","wage":3,"date":"2023-05-01","rest":1},
      "05-02":{"holiday":true,"name":"劳动节","wage":3,"date":"2023-05-02","rest":1},
      "05-03":{"holiday":true,"name":"劳动节","wage":3,"date":"2023-05-03","rest":1},
      "05-06":{"holiday":false,"name":"劳动节后补班","wage":1,"after":true,"target":"劳动节","date":"2023-05-06","rest":1},
      "06-22":{"holiday":true,"name":"端午节","wage":3,"date":"2023-06-22","rest":1},
      "06-23":{"holiday":true,"name":"端午节","wage":3,"date":"2023-06-23","rest":1},
      "06-24":{"holiday":true,"name":"端午节","wage":2,"date":"2023-06-24","rest":1},
      "06-25":{"holiday":false,"name":"端午节后补班","wage":1,"after":true,"target":"端午节","date":"2023-06-25","rest":1},
      "09-29":{"holiday":true,"name":"中秋节","wage":3,"date":"2023-09-29","rest":96},
      "09-30":{"holiday":true,"name":"中秋节","wage":3,"date":"2023-09-30","rest":1},
      "10-01":{"holiday":true,"name":"国庆节","wage":3,"date":"2023-10-01","rest":1},
      "10-02":{"holiday":true,"name":"国庆节","wage":3,"date":"2023-10-02","rest":1},
      "10-03":{"holiday":true,"name":"国庆节","wage":2,"date":"2023-10-03","rest":1},
      "10-04":{"holiday":true,"name":"国庆节","wage":2,"date":"2023-10-04","rest":1},
      "10-05":{"holiday":true,"name":"国庆节","wage":2,"date":"2023-10-05","rest":1},
      "10-06":{"holiday":true,"name":"国庆节","wage":2,"date":"2023-10-06","rest":1},
      "10-07":{"holiday":false,"name":"国庆节后补班","wage":1,"after":true,"target":"国庆节","date":"2023-10-07","rest":1},
      "10-08":{"holiday":false,"name":"国庆节后补班","wage":1,"after":true,"target":"国庆节","date":"2023-10-08","rest":1},
      "12-31":{"holiday":true,"name":"元旦","wage":2,"date":"2023-12-31","rest":86}}
  };

  // 输出日志，本地检查工作日状态
  $.log(`🧑‍💻 本地检查工作日状态...`);

  // 判断上述假日表是否需要更新
  const latestHolidayDate = Object.values(holidays.holiday)[Object.values(holidays.holiday).length - 1].date;
  const latestHolidayYear = latestHolidayDate.substring(0, 4);
  if (latestHolidayYear !== currentYear.toString()) {
    $.url = `http://timor.tech/api/holiday/year/${currentYear}/`
    return null;
  } else {
    const todayStr = `${currentMonth}-${currentDay}`;
    const holidayData = holidays.holiday[todayStr];
    // 判断当天是否在节假日和补休日中
    if (holidayData) {
      return !holidayData.holiday;
    } else {
      // 判断当天是否是一般工作日
      const dayOfWeek = currentTime.getDay();
      return !(dayOfWeek === 6 || dayOfWeek === 0);
    }
  }
}

/**
 * 创建一个名为 Env 的构造函数，用于处理环境相关操作。
 * @param {string} name - 环境名称
 */
function Env(name) {
  // 判断当前环境是否为 Loon
  const isLoon = typeof $loon !== "undefined";
  // 判断当前环境是否为 Surge
  const isSurge = typeof $httpClient !== "undefined" && !isLoon;
  // 判断当前环境是否为 QuantumultX
  const isQX = typeof $task !== "undefined";

  // 定义 read 方法，用于读取数据
  const read = (key) => {
    if (isLoon || isSurge) return $persistentStore.read(key);
    if (isQX) return $prefs.valueForKey(key);
  };

  // 定义 write 方法，用于写入数据
  const write = (key, value) => {
    if (isLoon || isSurge) return $persistentStore.write(key, value);
    if (isQX) return $prefs.setValueForKey(key, value);
  };

  // 定义 notice 方法，用于发送通知
  const notice = (title, subtitle, message, url) => {
    if (isLoon) $notification.post(title, subtitle, message, url);
    if (isSurge) $notification.post(title, subtitle, message, { url });
    if (isQX) $notify(title, subtitle, message, { "open-url": url });
  };

  // 定义 get 方法，用于发送 GET 请求
  const get = (url, callback) => {
    if (isLoon || isSurge) $httpClient.get(url, callback);
    if (isQX) {url.method = `GET`; $task.fetch(url).then((resp) => callback(null, {}, resp.body))};
  };

  // 定义 post 方法，用于发送 POST 请求
  const post = (url, callback) => {
    if (isLoon || isSurge) $httpClient.post(url, callback);
    if (isQX) {url.method = `POST`; $task.fetch(url).then((resp) => callback(null, {}, resp.body))};
  };

  // 定义 put 方法，用于发送 PUT 请求
  const put = (url, callback) => {
    if (isLoon || isSurge) $httpClient.put(url, callback)
    if (isQX) {url.method = 'PUT'; $task.fetch(url).then((resp) => callback(null, {}, resp.body))};
  };

  // 定义 toObj 方法，用于将字符串转为对象
  const toObj = (str) => JSON.parse(str);

  // 定义 toStr 方法，用于将对象转为字符串
  const toStr = (obj) => JSON.stringify(obj);

  // 定义 log 方法，用于输出日志
  const log = (message) => console.log(message);

  // 定义 done 方法，用于结束任务
  const done = (value = {}) => $done(value);

  // 返回包含所有方法的对象
  return { name, read, write, notice, get, post, put, toObj, toStr, log, done };
}
