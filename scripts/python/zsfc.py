"""
青龙专用，掌飞签到后进行购物

抓包脚本:
    见此仓库中的 JavaScript 目录

环境变量：
     ZSFC_CONFIG  ==> 掌飞寻宝日志输出的全部内容
    ZSFC_iFlowdId ==> 掌上飞车日志输出内容中的iFlowId
    ZSFC_SHOPNAME ==> 掌飞商店需要购买的道具名称，部分支持

注意事项：
    1.环境变量填写进 config.sh 配置文件中，无法填入环境变量中
        export ZSFC_CONFIG=''
        export ZSFC_iFlowdId=''
        export ZSFC_SHOPNAME=''
    2.多变量使用 & 进行分割，或者使用 @ 进行分割
    3.购物仅支持购买，不填写则默认从普通改装道具中（除防护装置外）按月份排序购买
        雷诺
        进气系统、燃料系统、点火系统、引擎系统、防护装置
        普通粒子推进、普通阿尔法离合
        重生宝珠LV1、效率宝珠LV1、效率宝珠LV2
    4.本脚本不使用异步请求的方式发起请求，因为本身就不需要抢 0 点执行

"""

import datetime
import json
import os
import re

import requests


class QQSpeedApplication:
    def __init__(self):
        self.session = requests.session()
        self.config = None
        self.iFlowdId = None
        self.roleId = None
        self.accessToken = None
        self.openId = None
        self.areaId = None
        self.userId = None
        self.token = None
        self.uin = None
        self.shopIdDict = {
            "雷诺": {"itemId": "12720", "price_idx": {"180天": {"index": "0", "price": 12200}}},
            "进气系统": {"itemId": "12377", "price_idx": {"10个": {"index": "0", "price": 3500}, "5个": {"index": "1", "price": 2000}, "1个": {"index": "2", "price": 500}, "50个": {"index": "3", "price": 17500}}},
            "燃料系统": {"itemId": "12378", "price_idx": {"10个": {"index": "0", "price": 3500}, "5个": {"index": "1", "price": 2000}, "1个": {"index": "2", "price": 500}, "50个": {"index": "3", "price": 17500}}},
            "点火系统": {"itemId": "12376", "price_idx": {"10个": {"index": "0", "price": 3500}, "5个": {"index": "1", "price": 2000}, "1个": {"index": "2", "price": 500}, "50个": {"index": "3", "price": 17500}}},
            "引擎系统": {"itemId": "12380", "price_idx": {"10个": {"index": "0", "price": 3500}, "5个": {"index": "1", "price": 2000}, "1个": {"index": "2", "price": 500}, "50个": {"index": "3", "price": 17500}}},
            "防护装置": {"itemId": "96597", "price_idx": {"10个": {"index": "0", "price": 3500}, "5个": {"index": "1", "price": 2000}, "1个": {"index": "2", "price": 500}, "50个": {"index": "3", "price": 17500}}},
            "普通粒子推进": {"itemId": "64025", "price_idx": {"10个": {"index": "0", "price": 3500}, "5个": {"index": "1", "price": 2000}, "1个": {"index": "2", "price": 500}, "50个": {"index": "3", "price": 17500}}},
            "普通阿尔法离合": {"itemId": "65028", "price_idx": {"10个": {"index": "0", "price": 3500}, "5个": {"index": "1", "price": 2000}, "1个": {"index": "2", "price": 500}, "50个": {"index": "3", "price": 17500}}},
            "重生宝珠LV1": {"itemId": "21983", "price_idx": {"3个": {"index": "0", "price": 2600}, "2个": {"index": "1", "price": 1800}, "1个": {"index": "2", "price": 990}, "4个": {"index": "3", "price": 3390}}},
            "效率宝珠LV1": {"itemId": "21977", "price_idx": {"3个": {"index": "0", "price": 2600}, "2个": {"index": "1", "price": 1800}, "1个": {"index": "2", "price": 990}, "4个": {"index": "3", "price": 3390}}},
            "效率宝珠LV2": {"itemId": "21978", "price_idx": {"3个": {"index": "0", "price": 13000}, "2个": {"index": "1", "price": 9000}, "1个": {"index": "2", "price": 4900}, "4个": {"index": "3", "price": 16990}}}
        }

    @staticmethod
    def isLastDays(N):
        today = datetime.date.today()
        for day in range(1, N + 1):
            nextDay = today + datetime.timedelta(days=day)
            if today.month != nextDay.month:
                return True
        return False

    @staticmethod
    def getGameItem():
        if os.environ.get('ZSFC_SHOPNAME'):
            return os.environ.get('ZSFC_SHOPNAME')

        gameItems = [
            "进气系统",
            "燃料系统",
            "点火系统",
            "引擎系统"
        ]
        return gameItems[datetime.date.today().month % len(gameItems)]

    def getShopItems(self, itemName, inputMoney):
        totalCount, shopArrays, itemCounts, itemPrices = 0, [], [], []
        itemCounts = sorted([int(re.search(r'(\d+)', key).group()) for key in self.shopIdDict[itemName]['price_idx'].keys()], reverse=True)
        itemPrices = sorted([priceData['price'] for priceData in self.shopIdDict[itemName]['price_idx'].values()], reverse=True)
        for m in range(len(itemPrices)):
            maxItems = inputMoney // itemPrices[m]
            totalCount += maxItems * itemCounts[m]
            inputMoney -= maxItems * itemPrices[m]
            index = self.shopIdDict[itemName]['price_idx'].get(f"{itemCounts[m]}天") or self.shopIdDict[itemName]['price_idx'].get(f"{itemCounts[m]}个")
            for _ in range(maxItems):
                shopArray = {
                    "name": itemName,
                    "count": itemCounts[m],
                    "id": self.shopIdDict[itemName]['itemId'],
                    "idx": index['index']
                }
                shopArrays.append(shopArray)
            if inputMoney < itemPrices[-1]:
                break
        return shopArrays, totalCount if totalCount else 0

    def getSignInGifts(self):
        url = "https://comm.ams.game.qq.com/ams/ame/amesvr?iActivityId=587170"

        headers = {
            "Cookie": (
                f"access_token={self.accessToken}; "
                "acctype=qc; "
                "appid=1105330667; "
                f"openid={self.openId}; "
            )
        }

        data = {
            "iActivityId": "587170",
            "g_tk": "1842395457",
            "sServiceType": "speed",
            "iFlowId": self.iFlowdId
        }

        response = self.session.post(url, headers=headers, data=data)
        response.encoding = 'utf-8'

        giftsDict = {}
        regex = r'#(\d+)#:{#flow_id#:(\d+),#flow_name#:#([^#]+)#'
        matches = re.findall(regex, response.json()['modRet']['sOutValue1'])

        for match in matches:
            flowName = match[2].replace("累计签到", "").replace("领取", "")
            giftsDict[flowName] = match[0]
        return giftsDict

    def dailyCheckIn(self, dailyFlowId):
        url = "https://comm.ams.game.qq.com/ams/ame/amesvr?iActivityId=587170"

        headers = {
            "Cookie": (
                f"access_token={self.accessToken}; "
                "acctype=qc; "
                "appid=1105330667; "
                f"openid={self.openId}; "
            )
        }

        data = {
            "iActivityId": "587170",
            "g_tk": "1842395457",
            "sServiceType": "speed",
            "iFlowId": dailyFlowId
        }

        response = self.session.post(url, headers=headers, data=data)
        response.encoding = 'utf-8'

        if "已经" in response.json()['msg']:
            print(f"⭕ 签到结果: {response.json()['flowRet']['sMsg']}")
        else:
            print(f"✅ 签到成功: 获得{response.json()['modRet']['sPackageName']}")

    def getTotalSignInDays(self):
        url = "https://comm.ams.game.qq.com/ams/ame/amesvr?iActivityId=587170"

        headers = {
            "Cookie": (
                f"access_token={self.accessToken}; "
                "acctype=qc; "
                "appid=1105330667; "
                f"openid={self.openId}; "
            )
        }

        data = {
            "iActivityId": "587170",
            "g_tk": "1842395457",
            "sServiceType": "speed",
            "iFlowId": int(self.iFlowdId) + 1
        }

        response = self.session.post(url, headers=headers, data=data)
        response.encoding = 'utf-8'

        totalSignInDays = int(response.json()['modRet']['sOutValue1'].split(":")[1])
        missedDays = datetime.datetime.now().day - totalSignInDays
        missedDays = f"(漏签 {missedDays} 天)" if missedDays != 0 else ""
        print(f"⏰ 累计签到 {totalSignInDays} 天{missedDays}")
        return totalSignInDays

    def claimGift(self, awardFlowId):
        url = "https://comm.ams.game.qq.com/ams/ame/amesvr?iActivityId=587170"
        headers = {
            "Cookie": (
                f"access_token={self.accessToken}; "
                "acctype=qc; "
                "appid=1105330667; "
                f"openid={self.openId}; "
            )
        }
        data = {
            "iActivityId": "587170",
            "g_tk": "1842395457",
            "sServiceType": "speed",
            "iFlowId": awardFlowId
        }

        response = self.session.post(url, headers=headers, data=data)
        response.encoding = 'utf-8'

        if "已经" in response.json()['msg']:
            print(f"⭕ 领取结果: {response.json()['flowRet']['sMsg']}")
        else:
            print(f"✅ 领取结果: 获得{response.json()['modRet']['sPackageName']}")

    def scrapeCouponInfo(self):
        url = "https://bang.qq.com/app/speed/mall/main2"

        params = {
            'accessToken': self.accessToken,
            'areaId': self.areaId,
            'userId': self.userId,
            'token': self.token,
            'uin': self.uin,
        }

        response = self.session.get(url, params=params)
        response.encoding = 'utf-8'

        pattern = r'<span>点券<b id="super_money">(\d+)</b></span><span>消费券<b id="coupons">(\d+)</b></span>'
        match = re.search(pattern, response.text)

        if match:
            return {
                "money": int(match.group(1)),
                "coupons": int(match.group(2))
            }
        else:
            return False

    def purchaseItem(self, inputData):
        url = "https://bang.qq.com/app/speed/mall/getPurchase"

        headers = {
            "Referer": "https://bang.qq.com/app/speed/mall/detail2"
        }

        data = {
            'areaId': self.areaId,
            'userId': self.userId,
            'token': self.token,
            'uin': self.uin,
            'pay_type': '1',
            'commodity_id': inputData['id'],
            'price_idx': inputData['idx']
        }

        response = self.session.post(url, headers=headers, data=data)
        response.encoding = 'utf-8'

        if response.json()['res'] == 0:
            return inputData['count']
        else:
            print(f"❌ 购买{inputData['count']}个{inputData['name']}时失败，{response.json()['msg']}")
            return 0

    def run(self):
        configs = os.environ.get("ZSFC_CONFIG")
        configLists = configs.split('&') if '&' in configs else configs.split('@')
        self.iFlowdId = os.environ.get("ZSFC_iFlowdId")

        for config in configLists:
            self.config = json.loads(config)
            self.roleId = self.config.get('zsfc_roleId', '')
            self.accessToken = self.config.get('zsfc_accessToken', '')
            self.openId = self.config.get('zsfc_openid', '')
            self.areaId = self.config.get('zsfc_areaId', '')
            self.userId = self.config.get('zsfc_userId', '')
            self.token = self.config.get('zsfc_token', '')
            self.uin = self.config.get('zsfc_uin', '')
            print(f"👨‍💻 当前用户: {self.roleId}")

            signInGifts = self.getSignInGifts()
            self.dailyCheckIn(signInGifts['每日签到'])
            totalSignInDay = self.getTotalSignInDays()

            signInInfoLists = []
            if signInGifts.get(f"{totalSignInDay}天"):
                signInInfoLists.append(signInGifts[f"{totalSignInDay}天"])

            formattedDate = f"{datetime.datetime.now().month}月{datetime.datetime.now().day}日"
            if signInGifts.get(formattedDate):
                signInInfoLists.append(signInGifts[formattedDate])

            if len(signInInfoLists):
                for i in signInInfoLists:
                    self.claimGift(i)

            shopName = self.getGameItem()
            backPack = self.scrapeCouponInfo()

            if backPack:
                money, coupons = backPack['money'], backPack['coupons']
                print(f"✅ 当前共有{money}点券，{coupons}消费券")
                shopLists, totalCounts = self.getShopItems(shopName, money + coupons if self.isLastDays(3) else coupons)
                if totalCounts:
                    print(f"✅ 共计可购买{totalCounts}个{shopName}")
                    successBuyCounts = 0
                    for shopDict in shopLists:
                        successBuyCounts += self.purchaseItem(shopDict)
                    failedBuyCounts = totalCounts - successBuyCounts
                    if successBuyCounts > 0:
                        log = f"🎉 成功购买${successBuyCounts}个{shopName}"
                        if failedBuyCounts > 0:
                            log += f"（未成功购买{failedBuyCounts}个）"
                    else:
                        log = f"❌ 全部购买失败，共计{totalCounts}个"
                    backPack = self.scrapeCouponInfo()
                    print(f"{log}\n✅ 现在剩余{backPack['money']}点券，{backPack['coupons']}消费券\n")
                else:
                    print(f"⭕ {'余额' if self.isLastDays(3) else '消费券'}不足以购买{shopName}\n")
            else:
                print(f"❌ 购物 Cookie 已过期，请更新 ZSFC_CONFIG 环境变量\n")


if __name__ == "__main__":
    speed = QQSpeedApplication()
    speed.run()
