"""
测试阶段
"""

import base64
import json
import os
import re
import time

import requests


def userLogin():
    def s(x, j=False):
        returnList = [e["value"] for e in h if e["name"].lower() == x]
        return "; ".join(returnList) if j else returnList[0]

    url = "https://api2.helper.qq.com/user/login"
    headers = {
        "authority": "api2.helper.qq.com",
        "accept": s("accept"),
        "content-type": s("content-type"),
        "cookie": s("cookie", j=True),
        "content-length": s("content-length"),
        "x-request-id": s("x-request-id"),
        "gh-header": s("gh-header"),
        "user-agent": s("user-agent"),
        "accept-language": s("accept-language"),
        "accept-encoding": s("accept-encoding"),
    }

    print(postData)
    print(headers)

    if os.environ.get("HOSTNAME"):
        session.post(url, headers=headers, data=base64.b64decode(postData))
    else:
        response = session.post(url, headers=headers, data=base64.b64decode(postData))
        responseData = base64.b64encode(response.content).decode('utf-8')
        print(responseData)


def checkLogSwitch():
    url = "https://api2.helper.qq.com/report/checklogswitch"
    body = {
        "gameId": "1003",
        "cSystem": "iOS",
        "cGameId": "1003",
        "userId": userId if userId else userData['zsfc_userId'],
        "token": token if token else userData['zsfc_token']
    }

    response = session.post(url, data=body)
    responseJson = response.json()
    print(responseJson)

    return True if responseJson['returnMsg'] == "" else False


def fetchMapData():
    url = "https://bang.qq.com/app/speed/treasure/index"
    params = {
        "roleId": roleId if roleId else userData['zsfc_roleId'],
        "uin": uin if uin else userData['zsfc_uin'],
        "areaId": areaId if areaId else userData['zsfc_areaId']
    }

    response = session.get(url, params=params)
    responseHtml = response.text
    leftTimes = re.search(r'id="leftTimes">(\d+)</i><span', responseHtml).group(1)
    print("剩余次数：", leftTimes)


if __name__ == '__main__':
    loginJson = {}
    loginData = os.environ.get('ZSFC_LOGIN')
    userData = json.loads(os.environ.get('ZSFC_CONFIG'))
    session = requests.session()

    userId, token = "", ""

    roleId, uin, areaId = "", "", ""

    try:
        loginJson = json.loads(loginData.replace("\\", ""))
    except json.decoder.JSONDecodeError:
        loginJson = json.loads(loginData.replace("\\/", "/"))
    finally:
        requestsData = loginJson["log"]['entries'][0]['request']
        h = requestsData['headers']
        postData = requestsData['postData']['text']

    for n in range(0, 2):
        userLogin()
        time.sleep(2.5)
        checkLogSwitch()
        time.sleep(2.5)
        fetchMapData()
        time.sleep(2.5)
