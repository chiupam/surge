/**
 *
 * 使用方法：打开掌上飞车APP, 点击咨询栏的签到（每日福利）即可，无需点击签到，然后点击下方游戏栏，最后点击掌飞商城即可获取所需商城数据。
 * 注意事项：1、每月需手动打开一次掌上飞车APP并进入签到页面，以重新抓包更新礼包数据，为此需要每日运行两次脚本；2、如果账号信息没有发生根本性变化的话，抓取 Cookie 等信息的脚本就不会被执行；3、如需购买掌飞商店中的指定商品，请订阅boxjs链接，并在掌上飞车应用中填写在售商品的完整名称
 *
 * boxjs订阅地址：https://raw.githubusercontent.com/chiupam/surge/main/boxjs/chiupam.boxjs.json
 *
 * 
 * hostname: comm.ams.game.qq.com
 *
 * type: http-request
 * regex: ^https?://(comm\.ams\.game\.qq\.com/ams/ame/amesvr*|bang\.qq\.com/app/speed/mall/main2\?*)
 * script-path: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/zsfc.v3.js
 * requests-body: 1
 *
 * type: cron
 * cron: 0 10 0,21 * * *
 * script-path: https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/zsfc.v3.js
 *
 * =============== Surge ===============
 * 掌上飞车Cookie = type=http-request, pattern=^https?://(comm\.ams\.game\.qq\.com/ams/ame/amesvr*|bang\.qq\.com/app/speed/mall/main2\?*), requires-body=true, max-size=-1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/zsfc.v3.js, script-update-interval=0, timeout=5
 * 掌上飞车 =type=cron, cronexp="0 10 0,21 * * *", wake-system=1, script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/zsfc.v3.js, script-update-interval=0, timeout=60
 *
 * =============== Loon ===============
 * http-request ^https?://(comm\.ams\.game\.qq\.com/ams/ame/amesvr*|bang\.qq\.com/app/speed/mall/main2\?*) script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/zsfc.v3.js, requires-body=true, timeout=60, tag=掌上飞车Cookie
 * cron "0 10 0,21 * * *" script-path=https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/zsfc.v3.js, tag=掌上飞车
 *
 * =============== Quan X ===============
 * ^https?://(comm\.ams\.game\.qq\.com/ams/ame/amesvr*|bang\.qq\.com/app/speed/mall/main2\?*) url script-request-body https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/zsfc.v3.js
 * 0 10 0,21 * * * https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/zsfc.v3.js, tag=掌上飞车, enabled=true
 *
*/

/**
 * 创建一个名为 $ 的环境变量实例，用于处理掌上飞车相关操作
 */
const $ = new Env()

/**
 * 检查是否为请求阶段
 */
const isRequest = typeof $request !== 'undefined';

/**
 * 主函数，用于执行签到操作或设置请求数据
 */
(async () => {
  if (isRequest) {

    if ($request.url.includes(`amesvr`)) {
      /**
       * 以下获取签到数据
       */

      // 提取请求数据
      const cookie = $request.headers.cookie;
      const body = $request.body;
  
      // 提取请求体中的 iActivityId 和 iFlowId 作为检验使用
      $.iActivityId = matchParam(body, 'iActivityId');
      $.iFlowId = matchParam(body, 'iFlowId') - 1;
  
      // 初始化 cookieToWrite 词典，填充待写入内存的键值对
      const cookieToWrite = {
        'zsfc_accessToken': matchParam(cookie, 'accessToken'),
        'zsfc_openid': matchParam(cookie, 'openId')
      };
  
      // 将请求数据写入内存
      Object.entries(cookieToWrite).forEach(([key, value]) => $.write(value, key));
  
      // 发起请求检验 iActivityId 和 iFlowId 是否为需要的值，如果返回的对象中不存在任何一个键值对则立即终止程序
      if (!Object.keys(await getSignInGifts()).length) return;
  
      // 初始化 dataToWrite 词典，填充待写入内存的键值对
      const dataToWrite = {
        'zsfc_iActivityId': ($.iActivityId).toString(),
        'zsfc_iFlowId': ($.iFlowId).toString(),
        'zsfc_month': (new Date().getMonth() + 1).toString()
      }
  
      // 如果所有键值都与内存中的值相同，则立即终止程序
      if (Object.keys(dataToWrite).every(key => dataToWrite[key] === $.read(key))) return;
  
      // 将请求数据写入内存，并输出到日志中
      Object.entries(dataToWrite).forEach(([key, value]) => $.write(value, key));
      $.log(dataToWrite)
  
      // 显示获取结果通知
      $.notice(`🏎️ 掌上飞车`, `✅ 获取签到数据成功！`, `流水ID：${$.iFlowId}，活动ID：${$.iActivityId}`);
  
      // 检查并设置青龙相关变量
      if ($.read(`ql_url`) && $.read(`ql_client_id`) && $.read(`ql_client_secret`) && $.toObj($.read(`zsfc_upload_id`))) {
        const qlUrlCache = $.read(`ql_url`);
        $.qlUrl = qlUrlCache.charAt(qlUrlCache.length - 1) === '/' ? qlUrlCache.slice(0, -1) : qlUrlCache;
        $.qlId = $.read(`ql_client_id`);
        $.qlSecret = $.read(`ql_client_secret`);
        $.qlToken = await qlToken();
  
        const qlEnvsName = `ZSFC_iFlowdId`;
        const qlEnvsValue = `${$.iFlowId}/${$.iActivityId}`;
        const qlEnvsRemarks = `掌飞签到`;
  
        // 获取青龙面板令牌，若成功则执行后续操作
        if ($.qlToken) {
          const qlEnvsNewBody = await qlEnvsSearch(qlEnvsName, qlEnvsValue, qlEnvsRemarks);
          if (!qlEnvsNewBody) return;  // 环境变量的值没有发生变化，不需要进行操作
  
          // 检查并处理环境变量的返回值类型
          if (Array.isArray(qlEnvsNewBody)) {
            // 暂时无法完成新增操作，后续再修改
            $.log(`⭕ 手动添加名为 ${qlEnvsName} 变量`);
          } else {
            await qlEnvsEdit(qlEnvsNewBody);
          }
        } else {
          $.log("❌ 无法获取 token，请检查青龙相关配置");
        }
      }
    } else {
      /**
       * 以下获取商城数据
       */

      // 提取请求的URL并去除引号
      const url = $.toStr($request.url).replace(/^"|"$/g, '');
      const cookie = $request.headers.cookie;
  
      // 对比 token 是否发生变化
      if ($.read(`zsfc_token`) == matchParam(url, "token")) return;
  
      // 初始化 dataToWrite 词典，填充待写入内存的键值对
      const dataToWrite = {
        'zsfc_iActivityId': $.read(`zsfc_iActivityId`),  // 掌飞商城无法抓取，只能读取签到页面的脚本获取情况
        "zsfc_accessToken": matchParam(url, "accessToken"),
        "zsfc_openid": matchParam(cookie, "openid"),
        "zsfc_token": matchParam(url, "token"),
        "zsfc_roleId": matchParam(url, "roleId"),
        "zsfc_userId": matchParam(url, "userId"),
        "zsfc_areaId": matchParam(url, "areaId"),
        'zsfc_uin': matchParam(url, "uin"),
      };
  
      // 将请求数据写入内存
      Object.entries(dataToWrite).forEach(([key, value]) => $.write(value, key));
  
      // 输出到日志只输出特定的键值对
      // const { zsfc_iActivityId, zsfc_iFlowId, zsfc_accessToken, zsfc_openid } = dataToWrite;
      // $.log({ zsfc_iActivityId, zsfc_iFlowId, zsfc_accessToken, zsfc_openid });
      $.log(dataToWrite)
  
      // 发送通知
      $.notice(`🏎️ 掌飞购物`, `✅ 获取商城数据成功！`, `请不要再次打开掌上飞车APP, 否则 Cookie 将失效！`);

    }

  } else {
    /**
     * 以下进行签到阶段
     */

    // 检查用户本月是否打开过签到页面
    const month = (new Date().getMonth() + 1).toString();
    if (month != $.read(`zsfc_month`)) {
      $.notice(`🏎️ 掌上飞车`, `❌ 本月未打开过掌上飞车APP`, `每月需打开一次掌上飞车APP并进到签到页面`);
      return;
    }

    // 获取本月签到礼物列表
    const signInGifts = await getSignInGifts();

    // 进行每日签到
    await dailyCheckin(signInGifts['每日签到']);

    // 获取本月累签天数
    const totalSignInDay = await getTotalSignInDays();

    // 初始化 signInInfoArray 数组
    let signInInfoArray = [];

    // 判断当前累签天数是否有礼包
    if (signInGifts[`${totalSignInDay}天`]) {
      signInInfoArray.push({ code: signInGifts[`${totalSignInDay}天`], title: `累签奖励` });
    }

    // 判断当前日期是否有特别福利礼包
    const today = `${new Date().getMonth() + 1}月${new Date().getDate()}日`;
    if (signInGifts[today]) {
      signInInfoArray.push({ code: signInGifts[today], title: `特别福利` });
    }

    if (signInInfoArray.length) {
      $.log(`🎉 共有 ${signInInfoArray.length} 个礼包待领取`);
    }

    // 遍历礼包数组，领取奖励
    for (let signInInfo of signInInfoArray) {
      let { code, title } = signInInfo;
      await claimGift(code, title);
    }

    // 显示签到结果通知
    if ($.checkInMsg) $.notice(`🏎️ 掌上飞车`, $.subtitle, $.checkInMsg, ``);


    /**
     * 以下进行购物阶段
     */

    // 读取到设置不进行购物
    if (!$.toObj($.read(`zsfc_shop`))) {
      $.log(`⭕ 设置为不执行购物`)
      return;
    }

    // 读取到没有获取过商城数据
    if (!$.read(`zsfc_token`)) {
      $.notice(`🏎️ 掌飞购物`, `❌ 请先获取商城数据`, `请打开掌上飞车，点击游戏，最后点击掌上商城即可`);
      return;
    }

    // 读取要购买的商品名称并生成商品列表
    const shopName = $.read(`zsfc_bang_shopname`) || autoGetGameItem();
    const shopIdArray = await searchShop(shopName);

    // 无法在掌上商城中搜索到相关商品时终止程序
    if (!Object.keys(shopIdArray).length) {
      $.notice(`🏎️ 掌飞购物`, `❌ ${shopName} 未在商店中售卖`, `请在掌上商城中认真核对商品名称`);
      return;
    }

    // 获取当前点券和消费券
    const packBefore = await getPackInfo(`before`);

    // Cookie 已过期，程序终止
    if (!packBefore) {
      $.log(`❌ Cookie 已过期，请重新获取`)
      $.notice(`🏎️ 掌飞购物`, `❌ Cookie 已过期`, `请打开掌上飞车，点击游戏，最后点击掌上商城即可`);
      return;
    }

    // 获取当前余额
    const moneyBefore = packBefore.money * 1;
    const couponsBefore = packBefore.coupons * 1;
    const beforeLog = `✅ 当前共有${moneyBefore}点券，${couponsBefore}消费券`;
    $.log(beforeLog);
    $.subtitle = beforeLog;

    // 获取购物包
    const [shopArray, totalCount, unit] = getShopItems(shopName, shopIdArray[shopName],
      isLastDays(3) ? moneyBefore + couponsBefore : couponsBefore
    );

    // 开始购物循环
    if (shopArray.length) {
      $.log(`✅ 预计可购买${totalCount ? totalCount : ""}${unit}${shopName}`);
      let successBuyCounts = 0;
      let failedBuyCounts = 0;

      // 开始购物
      for (let buyInfo of shopArray) {
        let { name, count, id, idx } = buyInfo;
        successBuyCounts += await purchaseItem(name, count, id, idx);
      }
      failedBuyCounts = totalCount - (successBuyCounts === 999 ? 1 : successBuyCounts);

      if (successBuyCounts > 0) {
        successBuyCounts === 999 ? successBuyCounts = "" : successBuyCounts;
        $.shopMsg = `🎉 成功购买${successBuyCounts}${unit}${shopName}`;
        if (failedBuyCounts > 0) {
          $.shopMsg += `（未成功购买${failedBuyCounts}${unit}）`;
        }
      } else {
        $.shopMsg = `❌ 全部购买失败，共计${totalCount ? totalCount : ""}${unit}`;
      }
      $.log($.shopMsg)

      // 获取剩余余额
      const packAfter = await getPackInfo(`after`);
      const moneyAfter = packAfter.money * 1;
      const couponsAfter = packAfter.coupons * 1;
      const afterLog = `✅ 现在剩余${moneyAfter}点券，${couponsAfter}消费券`;
      $.log(afterLog);
      $.subtitle = afterLog;

    } else {
      $.log(`⭕ 余额不足以购买${shopName}`);
    }

    // 显示购物结果通知
    if ($.shopMsg) $.notice(`🏎️ 掌飞购物`, $.subtitle, $.shopMsg, ``);

  }
})()
  .catch((e) => $.notice(`🏎️ 掌上飞车`, '❌ 未知错误无法打卡', e, ''))
  .finally(() => $.done());

/**
 * 从输入字符串中提取指定关键字的值。
 *
 * @param {string} input - 输入字符串，要从中提取关键字的值。
 * @param {string} key - 要提取的关键字。
 * @returns {string} - 返回匹配到的关键字值，如果没有匹配到则返回空字符串。
 */
function matchParam(input, key) {
  const separator = input.includes("&") ? "&" : ";";
  const pattern = new RegExp(`${key}=([^${separator}]+)`);
  const match = input.match(pattern);
  return match ? match[1] : '';
}

/**
 * @description 掌飞购物相关函数，处理输入对象，转换成输出对象
 * @param {Object} shopInfo - 输入对象
 * @returns {Object} 处理后的输出对象
 */
function processInput(shopInfo) {
  // 初始化一些变量
  let resultObject = {};
  let price_idx = {};
  let item = shopInfo.szItems[0];

  // 准备工作：去除可能的逗号结尾
  if (item.ItemNum) {
    item.ItemNum = item.ItemNum.slice(0, -1);
  } else {
    item.ItemAvailPeriod = item.ItemAvailPeriod.slice(0, -1);
  }

  // 对每个项目数量或可用期限和价格执行逻辑
  let itemArray = (item.ItemNum ? item.ItemNum : item.ItemAvailPeriod).split(',');

  // 构建 price_idx 词典信息
  itemArray.forEach((value, index) => {
    let key = item.ItemNum ? value : (value === "-1" ? "999" : (Number(value) / 24).toString());
    let itemPrice = shopInfo.szPrices[index].SuperMoneyPrice;
    price_idx[key] = {
      index: index.toString(),  // 价格索引
      price: itemPrice
    };
  });

  // 构建最终结果对象，包括单位信息
  resultObject[shopInfo.szName] = {
    price_idx: price_idx,
    itemId: shopInfo.iId,
    unit: item.ItemNum ? "个" : "天"  // 根据 ItemNum 存在与否确定单位
  };

  return resultObject;
}

/**
 * @description 掌飞购物相关函数，检查今天是否是当月的最后几天
 * @param {number} N - 要检查的倒数第N天
 * @returns {boolean} true 表示今天是当月的倒数第N天，false 表示反之
 */
function isLastDays(N) {
  // 获取当前日期的 Date 对象
  const today = new Date();

  // 迭代从1到N的整数，用于检查倒数第N天
  for (let i = 1; i <= N; i++) {
    // 创建一个新的 Date 对象，表示明天的日期
    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + i);

    // 检查如果明天的月份不等于今天的月份，则表示今天是当月的倒数第N天
    if (today.getMonth() !== nextDay.getMonth()) {
      return true;
    }
  }

  // 如果没有在循环中返回 true，表示今天不是当月的倒数第N天
  return false;
}

/**
 * @description 掌飞购物相关函数，获取当前月份对应的游戏道具。
 * @returns {string} 返回当前月份对应的游戏道具名称。
 */
function autoGetGameItem() {
  // 定义游戏道具的列表，包括普通改装道具和进阶改装道具
  const gameItems = [
    "进气系统+1", "燃料系统+1", "点火装置+1", "引擎装置+1", // 普通改装道具
    // "普通粒子推进", "普通阿尔法离合" // 进阶改装道具，我不需要，注释掉了
  ];

  // 获取当前月份（加1是因为月份从0开始）
  const currentMonth = new Date().getMonth() + 1;

  // 计算当前月份对应的游戏道具的索引
  const index = (currentMonth - 1) % gameItems.length;

  // 返回当前月份对应的游戏道具名称
  return gameItems[index];
}

/**
 * @description 掌飞购物相关函数，根据当前余额和道具价格生成购物列表
 * @param {string} name - 道具名称
 * @param {object} item - 包含道具价格信息的对象
 * @param {number} money - 当前可用余额
 * @returns {[array, number, str]} - 一个包含待购物对象、总购物数量和计数单位的数组
 */
function getShopItems(name, item, money) {
  // 获取道具价格的所有可购买数量，并由高到低排序
  const itemCounts = Object.keys(item.price_idx)
    .map((key) => parseInt(key.match(/\d+/)))
    .filter((num) => !isNaN(num))
    .sort((a, b) => b - a);

  // 获取道具价格的所有价格，并由高到低排序
  const itemPrices = Object.values(item.price_idx)
    .map((priceData) => priceData.price)
    .sort((a, b) => b - a);

  // 初始化总购物数量和购物列表
  let totalCounts = 0;
  let shopArray = [];

  for (let i = 0; i < itemPrices.length; i++) {
    // 商品数量索引
    let shopIdx = item.price_idx[itemCounts[i]].index;
    
    // 如果购买的商品可以购买永久且当前余额可以购买永久
    if (itemCounts[i] === 999 && money > itemPrices[i]) {
      shopArray.push({"name": name, "count": "999", "id": item.itemId, "idx": shopIdx});
      item.unit = "永久"
      break;
    }

    // 计算当前余额可以购买的最大道具数量
    const maxItems = Math.floor(money / itemPrices[i]); // 这是一个计算出的整数，表示根据当前余额和道具价格，最多可以购买的道具数量。
    totalCounts += maxItems * itemCounts[i]; // 这是一个累加的变量，用于跟踪购买的总道具数量。
    money -= maxItems * itemPrices[i]; // 这是当前可用的余额。在每次购买道具后，余额会根据购买的道具数量和价格进行更新，以反映购买后的余额。

    if (maxItems) {
      // 将可购买的道具添加到购物列表
      for (let m = 0; m < maxItems; m++) {
        shopArray.push({"name": name, "count": itemCounts[i].toString(), "id": item.itemId, "idx": shopIdx});
      }
    }

    // 如果当前余额不足以购买最便宜的道具，跳出循环
    if (money < itemPrices[itemPrices.length - 1]) {
      break;
    }
  }
  
  return [shopArray, totalCounts ? totalCounts : 0, item.unit];
}

/**
 * @description 掌飞签到相关函数，获取签到信息，并返回签到礼物列表
 * @returns {Promise<Array>} 返回一个包含本月礼物的数组的 Promise。
 */
async function getSignInGifts() {
  // 初始化礼包词典
  let giftsDictionary = {};

  // 构建请求体
  const options = {
    url: `https://comm.ams.game.qq.com/ams/ame/amesvr?iActivityId=${isRequest ? $.iActivityId : $.read(`zsfc_iActivityId`)}`,
    headers: {
      "Cookie": `access_token=${$.read(`zsfc_accessToken`)}; acctype=qc; appid=1105330667; openid=${$.read(`zsfc_openid`)}`
    },
    body: $.queryStr({
      "iActivityId": isRequest ? $.iActivityId : $.read(`zsfc_iActivityId`),
      "g_tk": "1842395457",
      "sServiceType": "speed",
      "iFlowId": isRequest ? $.iFlowId : $.read(`zsfc_iFlowId`)
    })
  };

  // 返回一个 Promise 对象，用于异步操作
  return new Promise(resolve => {
    // 发送 POST 请求，获取本月所有礼包情况
    $.post(options, (err, resp, data) => {
      if (data) {
        const body = $.toObj(data);
        const flowRegex = /#(\d+)#:{#flow_id#:(\d+),#flow_name#:#([^#]+)#/g;

        while ((match = flowRegex.exec($.toStr(body))) !== null) {
          const flowId = match[2];
          const flowName = match[3].replace(/累计签到|领取/g, '');
          giftsDictionary[flowName] = flowId;
        }

        if (!isRequest) {
          $.log(`✅ 本月共有 ${Object.keys(giftsDictionary).length} 个礼包`);
        }
      } else {
        $.log(`❌ 获取本月礼物列表时发生错误`);
        $.log($.toStr(err));
      }
      resolve(giftsDictionary);
    });
  });
}

/**
 * @description 掌飞签到相关函数，每日签到函数
 * @param {string} iFlowId - 每日签到礼包的 iFlowId
 */
async function dailyCheckin(iFlowId) {
  // 构建请求体
  const options = {
    url: `https://comm.ams.game.qq.com/ams/ame/amesvr?iActivityId=${$.read(`zsfc_iActivityId`)}`, 
    headers: {
      "Cookie": `access_token=${$.read(`zsfc_accessToken`)}; acctype=qc; appid=1105330667; openid=${$.read(`zsfc_openid`)}`
    },
    body: $.queryStr({
      "iActivityId": $.read(`zsfc_iActivityId`),
      "g_tk": "1842395457",
      "sServiceType": "speed",
      "iFlowId": iFlowId
    })
  };
  
  // 返回一个 Promise 对象，用于异步操作
  return new Promise(resolve => {
    // 发送 POST 请求，获取今日签到结果
    $.post(options, (err, resp, data) => {
      if (data) {
        const body = $.toObj(data.replace(/\r|\n/ig, ``));

        if (body.msg.includes(`已经`)) {
          const sMsg = body.flowRet.sMsg;
          $.log(`⭕ 领取结果: ${sMsg}`);
          // $.checkInMsg = `签到结果: ${sMsg}`
        } else {
          const sPackageName = body.modRet.sPackageName;
          $.log(`✅ 领取结果: 获得${sPackageName}`);
          $.checkInMsg = `恭喜获得：${sPackageName}`;
        }
      } else {
        $.log(`❌ 进行每日签到时发生错误`);
        $.log($.toStr(err));
      }
      resolve();
    });
  });
}

/**
 * @description 掌飞签到相关函数，获取累签天数的情况
 * @returns {Promise<string>} 返回累签天数
 */
async function getTotalSignInDays() {
  // 初始化总签到天数
  let totalSignInDays;

  // 构建请求体
  const options = {
    url: `https://comm.ams.game.qq.com/ams/ame/amesvr?iActivityId=${$.read(`zsfc_iActivityId`)}`, 
    headers: {
      "Cookie": `access_token=${$.read(`zsfc_accessToken`)}; acctype=qc; appid=1105330667; openid=${$.read(`zsfc_openid`)}`
    },
    body: $.queryStr({
      "iActivityId": $.read(`zsfc_iActivityId`),
      "g_tk": "1842395457",
      "sServiceType": "speed",
      "iFlowId": $.read(`zsfc_iFlowId`) * 1 + 1
    })
  };
  
  // 返回一个 Promise 对象，用于异步操作
  return new Promise(resolve => {
    // 发送 POST 请求，获取累签天数
    $.post(options, (err, resp, data) => {
      if (data) {
        totalSignInDays = $.toObj(data).modRet.sOutValue1.split(":")[1];
        const missedDays = new Date().getDate() - totalSignInDays;
        const missedDaysText = missedDays !== 0 ? `(漏签 ${missedDays} 天)` : ``;

        $.subtitle = `✅ 累计签到 ${totalSignInDays} 天${missedDaysText}`;
        $.log($.subtitle);
      } else {
        $.log(`❌ 获取累签天数时发生错误`);
        $.log($.toStr(err));
      }
      resolve(totalSignInDays);
    });
  });
}

/**
 * @description 掌飞签到相关函数，领取礼物函数
 * @param {string} giftId 礼物 ID
 * @param {string} giftName 礼物名称
 */
async function claimGift(giftId, giftName) {
  // 构建请求体
  const options = {
    url: `https://comm.ams.game.qq.com/ams/ame/amesvr?iActivityId=${$.read(`zsfc_iActivityId`)}`, 
    headers: {
      "Cookie": `access_token=${$.read(`zsfc_accessToken`)}; acctype=qc; appid=1105330667; openid=${$.read(`zsfc_openid`)}`
    },
    body: $.queryStr({
      "iActivityId": $.read(`zsfc_iActivityId`),
      "g_tk": "1842395457",
      "sServiceType": "speed",
      "iFlowId": giftId
    })
  };

  // 返回一个 Promise 对象，用于异步操作
  return new Promise(resolve => {
    // 发送 POST 请求，获取领取结果
    $.post(options, (err, resp, data) => {
      if (data) {
        let body = $.toObj(data.replace(/\r|\n/ig, ``));
        if (body.msg.includes(`已经`)) {
          $.log(`⭕ 领取结果: 已经领取`);
          // $.checkInMsg += `, ${giftName}`;
        } else {
          const sPackageName = body.modRet.sPackageName;
          $.log(`✅ 领取结果: 获得${sPackageName}`);
          if ($.checkInMsg) {
            $.checkInMsg += `，${sPackageName}`;
          } else {
            $.checkInMsg = `领取结果: 获得${sPackageName}`
          }
        }
      } else {
        $.log(`❌ 领取 ${giftName} 时发生错误`);
        $.log($.toStr(err));
      }
      resolve();
    });
  });
}

/**
 * @description 掌飞购物相关函数，根据商品名称搜索商品信息
 * @param {string} shopName - 要搜索的商品名称
 * @returns {Promise<Object>} 包含商品信息的 Promise 对象
 */
async function searchShop(shopName) {
  // 初始化目标商品对象
  let targetShopObject = {};

  // 获取 URL 中的查询参数
  const params = {
    'uin': $.read(`zsfc_uin`),
    'userId': $.read(`zsfc_userId`),
    'token': $.read(`zsfc_token`),
    'start': '0',
    'paytype': '1',  // 按点券筛选
    'order': '2', // 按点券筛选
    'text': encodeURIComponent(shopName)
  };

  // 构建请求体
  const options = {
    url: `https://bang.qq.com/app/speed/mall/search?${$.queryStr(params)}`,
    headers: { Referer: `https://bang.qq.com/app/speed/mall/main2` },
  };

  // 返回一个 Promise 对象，用于异步操作
  return new Promise(resolve => {
    // 发送 POST 请求，获取商品信息
    $.post(options, (err, resp, data) => {
      if (data) {
        const body = $.toObj(data);
        const targetObject = body.data.find(item => item.szName === shopName);
        if (targetObject) {
          // 处理商品信息，将结果赋给目标商品对象
          targetShopObject = processInput(targetObject);
        }
      }
      // 解析 Promise，将结果对象传递给 resolve 函数
      resolve(targetShopObject);
    });
  });
}

/**
 * @description 掌飞购物相关函数，获取点券和消费券信息
 * @param {string} argument - 余额状态，可选值为 "before" 或 "after"
 * @returns {Promise<object|false>} - 包含点券和消费券数量的对象，或者在获取失败时返回 false
 */
async function getPackInfo(argument) {
  // 创建一个空对象，用于存储点券和消费券信息
  let result = {};

  // 根据参数值设置状态文本
  const statu = (argument === "before") ? "当前" : "剩余";

  // 获取 URL 中的查询参数
  const params = {
    'areaId': $.read(`zsfc_areaId`),
    'accessToken': $.read(`zsfc_accessToken`),
    'token': $.read(`zsfc_token`),
    'uin': $.read(`zsfc_uin`),
    'userId': $.read(`zsfc_userId`),
  };

  // 构建请求体
  const options = {
    url: `https://bang.qq.com/app/speed/mall/main2?${$.queryStr(params)}`
  };

  // 输出日志，表示开始获取点券和消费券
  if (statu === "before") $.log(`🧑‍💻 开始获取${statu}点券和消费券`);

  // 返回一个 Promise 对象，用于异步操作
  return new Promise(resolve => {
    // 发送 GET 请求，获取点券和消费券信息
    $.get(options, (err, resp, data) => {
      if (data) {
        // 将响应数据转换为字符串
        const body = data.toString();

        // 使用正则表达式匹配点券和消费券数量
        money = body.match(/<b id="super_money">(\d+)<\/b>/)[1];
        coupons = body.match(/<b id="coupons">(\d+)<\/b>/)[1];

        // 将点券和消费券数量存储在结果对象中
        result.money = money;
        result.coupons = coupons;
      } else {
        // 如果获取失败，将结果对象设置为 false
        result = false;
      }

      // 解析 Promise，将结果对象传递给 resolve 函数
      resolve(result);
    });
  });
}

/**
 * @description 掌飞购物相关函数，购买道具
 * @param {string} name - 道具名称
 * @param {number} count - 购买数量
 * @param {string} id - 道具的唯一标识符
 * @param {string} idx - 道具的价格索引
 * @returns {Promise<number>} - 返回成功购买的道具数量
 */
async function purchaseItem(name, count, id, idx) {
  // 构建请求体
  const options = {
    url: `https://bang.qq.com/app/speed/mall/getPurchase`,
    headers: {
      "Referer": `https://bang.qq.com/app/speed/mall/detail2`
    },
    body: $.queryStr({
      'areaId': $.read(`zsfc_areaId`),
      'token': $.read(`zsfc_token`),
      'userId': $.read(`zsfc_userId`),
      'uin': $.read(`zsfc_uin`),
      'pay_type': "1",
      'commodity_id': id,
      'price_idx': idx
    })
  };

  // 返回一个 Promise 对象，用于异步操作
  return new Promise(resolve => {
    // 发送 POST 请求，购买道具
    $.post(options, (err, resp, data) => {
      if (data) {
        // 将响应数据转换为对象
        const body = $.toObj(data);

        // 提取响应中的消息
        const msg = body.msg;

        // 检查响应结果，如果购买失败，输出错误消息
        if (body.res == -1) {
          $.log(`❌ ${msg}`);
        } else {
          // 如果购买成功，将成功购买的道具数量设置为购买数量
          totalCount = count * 1;
        }
      } else {
        // 如果发生错误，输出错误消息和错误信息
        $.log(`❌ 购买${name}时发生错误`);
        $.log($.toStr(err));
      }

      // 解析 Promise，将成功购买的道具数量传递给 resolve 函数
      resolve(totalCount ? totalCount : 0);
    });
  });
}

/**
 * @description 获取青龙面板令牌
 * @returns {Promise<string|boolean>} 返回一个包含青龙面板令牌或布尔值的 Promise。
 */
async function qlToken() {
  // 初始化访问令牌
  let accessToken; 

  // 构建请求体
  const options = {
    url: `${$.qlUrl}/open/auth/token?client_id=${$.qlId}&client_secret=${$.qlSecret}`
  };
  // 返回一个 Promise 对象，用于异步操作
  return new Promise(resolve => {
    // 发送 GET 请求，获取token令牌
    $.get(options, (err, resp, data) => {
      if (data) {
        const responseBody = $.toObj(data);
        if (responseBody.code === 200) {
          // 获取成功
          accessToken = responseBody.data.token;
        } else {
          accessToken = false;
        }
      }
      resolve(accessToken);
    });
  });
}

/**
 * @description 搜索环境变量并生成新的请求体部分参数
 * @param {string} envsName - 新环境变量的名称
 * @param {string} envsValue - 新环境变量的具体值
 * @param {string} envsRemarks - 新环境变量的备注名
 * @returns {Promise<object|Array|boolean>} 返回一个请求体对象或列表或布尔值的 Promise。
 */
async function qlEnvsSearch(envsName, envsValue, envsRemarks) {
  // 初始化请求体的变量名
  let requestPayload;

  // 构建请求体
  const options = {
    url: `${$.qlUrl}/open/envs?searchValue=${envsName}`,
    headers: { "Authorization": `Bearer ${$.qlToken}` }
  };

  // 返回一个 Promise 对象，用于异步操作
  return new Promise(resolve => {
    // 发送 GET 请求，搜索指定变量
    $.get(options, (err, resp, data) => {
      if (data) {
        const responseBody = $.toObj(data).data;
        if (responseBody.length === 1) {
          // 找到匹配的环境变量，生成单个请求体对象
          const matchingEnv = responseBody[0];
          if (matchingEnv.value === envsValue) {
            requestPayload = false;
          } else {
            requestPayload = {
              'id': matchingEnv.id,
              'name': envsName,
              'value': envsValue,
              'remarks': envsRemarks
            };
          }
        } else {
          // 未找到匹配的环境变量，生成包含一个对象的数组
          requestPayload = [{
            'name': envsName,
            'value': envsValue,
            'remarks': envsRemarks
          }];
        }
      }
      resolve(requestPayload);
    });
  });
}

/**
 * @description 编辑青龙面板的环境变量
 * @param {object} data - 请求参数
 */
async function qlEnvsEdit(data) {
  // 构建请求体
  const options = {
    url: `${$.qlUrl}/open/envs`,
    headers: { "Authorization": `Bearer ${$.qlToken}` },
    body: data
  };

  // 返回一个 Promise 对象，用于异步操作
  return new Promise(resolve => {
    // 判断请求方法（post还是put）
    const requestMethod = Array.isArray(data) ? $.post : $.put;
    requestMethod(options, (err, resp, responseData) => {
      if (responseData) {
        let body = $.toObj(responseData);
        // 根据返回的状态码处理结果
        if (body.code !== 200) {
          $.log(`❌ 上传青龙面板失败`);
        }
      }
      resolve(); // 完成Promise
    });
  });
}

/**
 * @description 创建一个名为 Env 的构造函数，用于处理环境相关操作。
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

  // 定义 queryStr 方法，用于将对象转为可以请求的字符串
  const queryStr = (obj) => {
    return Object.keys(obj)
      .map(key => `${key}=${obj[key]}`)
      .join('&');
  };

  // 定义 log 方法，用于输出日志
  const log = (message) => console.log(message);

  // 定义 done 方法，用于结束任务
  const done = (value = {}) => $done(value);

  // 返回包含所有方法的对象
  return { name, read, write, notice, get, post, put, toObj, toStr, queryStr, log, done };
}
