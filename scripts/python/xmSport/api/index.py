import re

import requests
from flask import Flask, request, jsonify

app = Flask(__name__)


@app.route('/', methods=['POST'])
def xmSport():
    url = f"https://api-user.huami.com/registrations/+86{request.form.get('phoneNumber')}/tokens"
    headers = {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "User-Agent": "MiFit/4.6.0 (iPhone; iOS 14.0.1; Scale/2.00)"
    }
    data = {
        "client_id": "HuaMi",
        "password": request.form.get('password'),
        "redirect_uri": "https://s3-us-west-2.amazonaws.com/hm-registration/successsignin.html",
        "token": "access"
    }
    response = requests.post(url, headers=headers, data=data, allow_redirects=False)

    try:
        location = response.headers["Location"]
        code = re.compile("(?<=access=).*?(?=&)").findall(location)
        if len(code) != 0:
            return jsonify({
                "status": True,
                "code": code[0]
            })
        else:
            return jsonify({
                "status": False,
                "code": "请检查手机号码和登录密码"
            })
    except:
        return jsonify({
            "status": False,
            "code": "请求失败，请稍后重试"
        })


if __name__ == '__main__':
    app.run(port=3000)