"""
测试阶段
"""

from base64 import b64decode, b64encode
from json import loads, decoder
from os import environ as env
from re import search
from time import sleep

import requests


def userLogin():
    def s(x, j=0):
        returnList = [e["value"] for e in h if e["name"].lower() == x]
        return "; ".join(returnList) if j else returnList[0]

    url = "https://api2.helper.qq.com/user/login"
    headers = {
        "authority": "api2.helper.qq.com",
        "accept": s("accept"),
        "content-type": s("content-type"),
        "cookie": s("cookie", j=1),
        "content-length": s("content-length"),
        "x-request-id": s("x-request-id"),
        "gh-header": s("gh-header"),
        "user-agent": s("user-agent"),
        "accept-language": s("accept-language"),
        "accept-encoding": s("accept-encoding"),
    }

    # print(postData)
    print("‍💻 开始登录")

    if env.get("HOSTNAME"):
        session.post(url, headers=headers, data=b64decode(postData))
    else:
        response = session.post(url, headers=headers, data=b64decode(postData))
        responseData = b64encode(response.content).decode('utf-8')
        print(responseData)

    sleep(2.5)


def fetchMapData(before):
    url = "https://bang.qq.com/app/speed/treasure/index"
    params = {
        "roleId": roleId if roleId else userData['zsfc_roleId'],
        "uin": uin if uin else userData['zsfc_uin'],
        "areaId": areaId if areaId else userData['zsfc_areaId']
    }

    response = session.get(url, params=params)
    responseHtml = response.text
    todayCanTimes = int(search(r'"todaycanTimes":(\d+)', responseHtml).group(1))

    print(f"🏎️ 当天可寻宝次数：{todayCanTimes}" if not before else f"🏎️ 剩余寻宝次数：{todayCanTimes}")

    return todayCanTimes


if __name__ == '__main__':
    session = requests.session()

    loginJson = {}

    if env.get("HOSTNAME"):
        userData = loads(env.get('ZSFC_CONFIG'))
        loginData = env.get('ZSFC_LOGIN')
    else:
        userData = {}
        if env.get('ZSFC_LOGIN'):
            loginData = env.get('ZSFC_LOGIN')
        else:
            loginData = r""

    p = search(r'"text":"([^"]+)"', loginData).group(1)
    postData = p.replace("\\", "/") if env.get("HOSTNAME") else p.replace("\\/", "/")

    roleId, uin, areaId = "", "", ""

    try:
        loginJson = loads(loginData.replace("\\", ""))
    except decoder.JSONDecodeError:
        loginJson = loads(loginData.replace("\\/", "/"))
    finally:
        h = loginJson["log"]['entries'][0]['request']['headers']

    if fetchMapData(0) <= 1:
        userLogin()
        print(f"✅ 登陆成功" if fetchMapData(1) >= 3 else "❌ 登录失败")
    else:
        print("⭕ 今天已登录")
