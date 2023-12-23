"""
青龙面板识别内容：
new Env("掌飞登录")
1 0 * * * zsfc_login.py

脚本说明：
    脚本处于测试阶段，不描述部署过程
"""

from base64 import b64decode
from json import loads, decoder
from os import environ as env
from re import search
from time import sleep

import requests


def fetchMapData():
    url = "https://bang.qq.com/app/speed/treasure/index"
    params = {
        "roleId": roleId if roleId else userData['zsfc_roleId'],
        "uin": uin if uin else userData['zsfc_uin'],
        "areaId": areaId if areaId else userData['zsfc_areaId']
    }

    response = session.get(url, params=params)
    responseHtml = response.text
    c = int(search(r'"todaycanTimes":(\d+)', responseHtml).group(1))

    return True if c >= 3 else False


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

    print("💻 今日未登录，开始登录")
    session.post(url, headers=headers, data=b64decode(postData))
    sleep(2.5)


if __name__ == '__main__':
    session = requests.session()

    loginJson = {}

    if env.get("HOSTNAME"):
        # 青龙环境
        userData = loads(env.get('ZSFC_CONFIG'))
        loginData = env.get('ZSFC_LOGIN')
    else:
        # 本地环境
        userData = {}
        if env.get('ZSFC_LOGIN'):
            loginData = env.get('ZSFC_LOGIN')
        else:
            loginData = r""

    p = search(r'"text":"([^"]+)"', loginData).group(1)
    postData = p.replace("\\", "/") if env.get("HOSTNAME") else p.replace("\\/", "/")

    roleId, uin, areaId = "", "", ""
    if not roleId and not uin and not areaId:
        # 有 ZSFC_USER 环境变量则读取
        if env.get("ZSFC_USER"):
            roleId, uin, areaId = env.get("ZSFC_USER").split("/")
        else:
            # 读取 ZSFC_CONFIG 环境变量并赋值
            roleId = loads(env.get("ZSFC_CONFIG"))['zsfc_roleId']
            uin = loads(env.get("ZSFC_CONFIG"))['zsfc_uin']
            areaId = loads(env.get("ZSFC_CONFIG"))['zsfc_areaId']

    try:
        loginJson = loads(loginData.replace("\\", ""))
    except decoder.JSONDecodeError:
        loginJson = loads(loginData.replace("\\/", "/"))
    finally:
        h = loginJson["log"]['entries'][0]['request']['headers']

    print("🏎️ 检测今日是否已登录")
    if fetchMapData():
        print("⭕ 今天已登录")
    else:
        userLogin()
        print(f"✅ 登陆成功" if fetchMapData() else "❌ 登录失败")
