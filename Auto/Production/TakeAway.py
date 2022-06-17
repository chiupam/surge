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
                "name": "Take Away",
                "desc": "This is a Surge module used to intercept take-away apps.",
                "icon": "https://github.com/Koolson/Qure/raw/master/IconSet/Color/Cat.png"
            }
        },
        {
            "type": "http-request",
            "data": {
                "tag": "饿了么Cookie",
                "regex": "^https://h5\.ele\.me/restapi/biz.growth_finetune/v1/finetune/operate?",
                "script": "https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/elm.js",
                "requires-body": True
            }
        },
        {
            "type": "http-request",
            "data": {
                "tag": "美团Token",
                "regex": "^https://web\.meituan\.com/wechat/index$",
                "script": "https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/mt.js",
                "requires-body": True
            }
        },
        {
            "type": "http-request",
            "data": {
                "tag": "快手极速版Cookie",
                "regex": "^https?://api\.kuaishouzt\.com/rest/zt/appsupport/reco/content/settings$",
                "script": "https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/ksjsb.js",
                "requires-body": True
            }
        },
        {
            "type": "hostname",
            "data": "h5.ele.me, web.meituan.com, api.kuaishouzt.com"
        }
    ]
    main(config, "surge")
    main(config, "loon")
