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
                "name": "Yunnan Young",
                "desc": "This is a Surge module for YunNan Young.",
                "icon": "https://raw.githubusercontent.com/chiupam/surge/main/boxjs/icon/qndxx.jpg"
            }
        },
        {
            "type": "cron",
            "data": {
                "tag": "青年大学习",
                "cronexp": "0 0/1 * * * ?",
                "script": "https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/qndxx.js",
            }
        },
        {
            "type": "http-response",
            "data": {
                "tag": "青年大学习Cookie",
                "regex": "^http://home\.yngqt\.org\.cn/user/weixin_yngqt\.aspx\?getcode=.*|^https?://home\.yngqt\.org\.cn/qndxx/default\.aspx$",
                "script": "https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/qndxx.js",
                "requires-body": False
            }
        },
        {
            "type": "hostname",
            "data": "home.yngqt.org.cn"
        }
    ]
    main(config, "surge")
    main(config, "loon")
