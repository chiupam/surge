import os
from utils import *


def name():
    return os.path.basename(__file__).split(".")[0]


def main(_data, _app):
    module = ""
    for body in _data:
        module += assemble(body, _app)
    if "s" in _app:
        form = "sgmodule"
    elif "o" in _app:
        form = "plugin"
    else:
        return
    with open(f"../cache/{name()}.{form}", "w", encoding="utf-8") as f:
        f.write(module)


if __name__ == "__main__":
    config = [
        {
            "type": "describe",
            "data": {
                "name": "Cookie",
                "desc": "This is a Surge module used to collect JaveScripts on Get Cookie.",
                "icon": "https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Lab.png"
            }
        },
        {
            "type": "http-request",
            "data": {
                "tag": "网易云音乐获取Cookie",
                "regex": "^https?://music\.163\.com/weapi/user/level",
                "script": "https://raw.githubusercontent.com/chavyleung/scripts/master/neteasemusic/neteasemusic.cookie.js",
                "requires-body": False
            }
        },
        {
            "type": "http-request",
            "data": {
                "tag": "百度贴吧Cookie",
                "regex": "^https?://tieba\.baidu\.com/mo/q/getUpConfigData",
                "script": "https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/tieba.js",
                "requires-body": True
            }
        },
        {
            "type": "http-request",
            "data": {
                "tag": "掌上飞车Cookie",
                "regex": "^https?://mwegame\.qq\.com/ams/sign/doSign/month",
                "script": "https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/zsfc.js",
                "requires-body": True
            }
        },
        {
            "type": "hostname",
            "data": "music.163.com, tieba.baidu.com, mwegame.qq.com"
        }
    ]
    main(config, "surge")
    main(config, "loon")
