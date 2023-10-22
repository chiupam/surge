"""
该文件只适用于 青龙 面板中运行，并在面板中添加以下 3 个环境变量

speed_iFlowId
speed_access_token
speed_openid

具体情况可参考本仓库中的 JavaScript 脚本

"""

import asyncio
import re
import os
from datetime import datetime

import aiohttp


async def get_sign_in_gifts(iFlowId, access_token, openid, session):
    """
    获取签到礼包信息

    参数:
        iFlowId (int): 当前签到流程的标识符
        access_token (str): 用户访问令牌
        openid (str): 用户的唯一标识符
        session (aiohttp.ClientSession): aiohttp客户端会话

    返回:
        gifts_dictionary (dict): 包含签到礼包信息的字典，礼包名称映射到对应的标识符
    """
    url = "https://comm.ams.game.qq.com/ams/ame/amesvr?iActivityId=587170"
    headers = {
        "Cookie": (
            f"access_token={access_token}; "
            "acctype=qc; "
            "appid=1105330667; "
            f"openid={openid}; "
        )
    }
    data = {
        "iActivityId": "587170",
        "g_tk": "1842395457",
        "sServiceType": "speed",
        "iFlowId": iFlowId
    }
    async with session.post(url, headers=headers, data=data) as response:
        data = await response.json(content_type="text/html")
        gifts_dictionary = {}
        flow_regex = r'#(\d+)#:{#flow_id#:(\d+),#flow_name#:#([^#]+)#'
        matches = re.findall(flow_regex, data['modRet']['sOutValue1'])
        for match in matches:
            flow_id = match[0]
            flow_name = match[2].replace("累计签到", "").replace("领取", "")
            gifts_dictionary[flow_name] = flow_id
        print(f"本月共有 {len(gifts_dictionary)} 个礼包")
        return gifts_dictionary


async def daily_check_in(iFlowId, access_token, openid, session):
    url = "https://comm.ams.game.qq.com/ams/ame/amesvr?iActivityId=587170"
    headers = {
        "Cookie": (
            f"access_token={access_token}; "
            "acctype=qc; "
            "appid=1105330667; "
            f"openid={openid}; "
        )
    }
    data = {
        "iActivityId": "587170",
        "g_tk": "1842395457",
        "sServiceType": "speed",
        "iFlowId": iFlowId
    }
    async with session.post(url, headers=headers, data=data) as response:
        data = await response.json(content_type="text/html")
        if "已经" in data['msg']:
            print(f"签到结果: {data['flowRet']['sMsg']}")
        else:
            print(f"领取结果: 获得{data['modRet']['sPackageName']}")


async def get_total_sign_in_days(iFlowId, access_token, openid, session):
    """
    执行每日签到或领取礼包

    参数:
        iFlowId (int): 当前签到流程的标识符
        access_token (str): 用户访问令牌
        openid (str): 用户的唯一标识符
        session (aiohttp.ClientSession): aiohttp客户端会话

    返回:
        无
    """
    url = "https://comm.ams.game.qq.com/ams/ame/amesvr?iActivityId=587170"
    headers = {
        "Cookie": (
            f"access_token={access_token}; "
            "acctype=qc; "
            "appid=1105330667; "
            f"openid={openid}; "
        )
    }
    data = {
        "iActivityId": "587170",
        "g_tk": "1842395457",
        "sServiceType": "speed",
        "iFlowId": int(iFlowId) + 1
    }
    async with session.post(url, headers=headers, data=data) as response:
        data = await response.json(content_type="text/html")
        total_sign_in_days = int(data['modRet']['sOutValue1'].split(":")[1])
        missed_days = datetime.now().day - total_sign_in_days
        missed_days_text = f"(漏签 {missed_days} 天)" if missed_days != 0 else ""
        print(f"累计签到 {total_sign_in_days} 天{missed_days_text}")
        return total_sign_in_days


async def claim_gift(gift_id, gift_name, access_token, openid, session):
    """
    领取指定礼包

    参数:
        gift_id (int): 礼包的标识符
        gift_name (str): 礼包的名称
        access_token (str): 用户访问令牌
        openid (str): 用户的唯一标识符
        session (aiohttp.ClientSession): aiohttp客户端会话

    返回:
        无
    """

    url = "https://comm.ams.game.qq.com/ams/ame/amesvr?iActivityId=587170"
    headers = {
        "Cookie": (
            f"access_token={access_token}; "
            "acctype=qc; "
            "appid=1105330667; "
            f"openid={openid}; "
        )
    }
    data = {
        "iActivityId": "587170",
        "g_tk": "1842395457",
        "sServiceType": "speed",
        "iFlowId": gift_id
    }
    print(f"开始领取{gift_name}")
    async with session.post(url, headers=headers, data=data) as response:
        data = await response.json(content_type="text/html")
        if "已经" in data['msg']:
            print(f"领取结果: {data['flowRet']['sMsg']}")
        else:
            print(f"领取结果: 获得{data['modRet']['sPackageName']}")


async def main():

    iFlowId = os.environ.get("speed_iFlowId")
    access_token_lists = os.environ.get("speed_access_token").split("&")
    openid_lists = os.environ.get("speed_openid").split("&")
    date = datetime.now()

    async with aiohttp.ClientSession() as session:
        tasks = []
        for access_token, openid in zip(access_token_lists, openid_lists):
            signInGifts = await get_sign_in_gifts(iFlowId, access_token, openid, session)

            tasks.append(asyncio.create_task(daily_check_in(signInGifts['每日签到'], access_token, openid, session)))

            totalSignInDay = await get_total_sign_in_days(iFlowId, access_token, openid, session)

            signInInfoArray = []
            formatted_date = f"{date.month}月{date.day}日"

            if signInGifts.get(f"{totalSignInDay}天"):
                signInInfoArray.append({"code": signInGifts[f"{totalSignInDay}天"], "title": "累签奖励"})

            if signInGifts.get(formatted_date):
                signInInfoArray.append({"code": signInGifts[formatted_date], "title": "特别福利"})

            if len(signInInfoArray):
                print(f"共有 {len(signInInfoArray)} 个礼包待领取")

            for signInInfo in signInInfoArray:
                code, title = signInInfo["code"], signInInfo["title"]
                tasks.append(asyncio.create_task(claim_gift(code, title, access_token, openid, session)))

        await asyncio.gather(*tasks)

if __name__ == '__main__':
    asyncio.run(main())
