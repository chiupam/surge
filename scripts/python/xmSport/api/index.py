import re

import requests
from flask import Flask, request

app = Flask(__name__)


@app.route('/', methods=['GET'])
def hello():
    return "Hello World!"


@app.route('/', methods=['POST'])
def xmSport():
    phoneNumber = request.form.get('phoneNumber')
    password = request.form.get('password')

    return main(phoneNumber, password)


def main(pn, pw):
    url = f"https://api-user.huami.com/registrations/+86{pn}/tokens"
    headers = {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": "MiFit/4.6.0 (iPhone; iOS 14.0.1; Scale/2.00)"
    }
    data = {
        "client_id": "HuaMi",
        "password": str(pw),
        "redirect_uri": "https://s3-us-west-2.amazonaws.com/hm-registration/successsignin.html",
        "token": "access"
    }
    response = requests.post(url, headers=headers, data=data, allow_redirects=False)

    try:
        location = response.headers["Location"]
        code = re.compile("(?<=access=).*?(?=&)").findall(location)
        if len(code) != 0:
            return code[0]
        else:
            return "无法获取Code值，请检查手机号码和登录密码"
    except:
        return "请求失败"


if __name__ == '__main__':
    app.run(port=3000)
