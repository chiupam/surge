"""
青龙面板识别内容：
new Env("掌飞登录")
1 0 * * * zsfc_login.py

脚本说明：
    目前仅支持 Surge 抓包使用

部署步骤：
    1. Surge 添加 MitM 主机名 api2.helper.qq.com；
    2. 开启抓取流量功能，打开掌上飞车APP，进入后及关闭抓取流量功能；
    3. 从抓包请求中找到链接为 https://api2.helper.qq.com/user/login 的包，导出为HAR发送到电脑；
    4. 使用浏览器打开 .HAR 的文件，将文件内容全部复制；
    5. 青龙面板添加一个名为 ZSFC_LOGIN 的环境变量，值为 .HAR 的文件内容；
    6. 自行添加脚本进入青龙面板，定时运行脚本即可。
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

    session.post(url, headers=headers, data=b64decode(postData))
    sleep(2.5)


if __name__ == '__main__':
    session = requests.session()

    loginJson = {}

    if env.get("HOSTNAME"):
        userData = loads(env.get('ZSFC_CONFIG') if env.get('ZSFC_CONFIG') else "{}")
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
    if not roleId and not uin and not areaId:
        if env.get("ZSFC_USER"):
            roleId, uin, areaId = env.get("ZSFC_USER").split("/")
        else:
            roleId = loads(env.get("ZSFC_CONFIG") if env.get('ZSFC_CONFIG') else '{"zsfc_roleId":""}')['zsfc_roleId']
            uin = loads(env.get("ZSFC_CONFIG") if env.get('ZSFC_CONFIG') else '{"zsfc_uin":""}')['zsfc_uin']
            areaId = loads(env.get("ZSFC_CONFIG") if env.get('ZSFC_CONFIG') else '{"zsfc_areaId":""}')['zsfc_areaId']

    try:
        loginJson = loads(loginData.replace("\\", ""))
    except decoder.JSONDecodeError:
        loginJson = loads(loginData.replace("\\/", "/"))
    finally:
        h = loginJson["log"]['entries'][0]['request']['headers']

    if roleId and uin and areaId:
        print("🏎️ 检测今日是否已登录")
        if fetchMapData():
            print("⭕ 今天已登录")
        else:
            print("💻 今日未登录，开始登录")
            userLogin()
            print(f"✅ 登陆成功" if fetchMapData() else "❌ 登录失败")
    else:
        print("⭕ 不检测登录状态")
        userLogin()
