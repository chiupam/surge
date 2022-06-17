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
                "name": "Intercept JD's wskey",
                "desc": "This is a Surge module used to intercept JD's wskey.",
                "icon": "https://raw.githubusercontent.com/chiupam/surge/main/boxjs/icon/jd.jpeg"
            }
        },
        {
            "type": "http-request",
            "data": {
                "tag": "京东上传wskey",
                "regex": "^https?://api-dd\.jd\.com/client\.action\?functionId=getSessionLog",
                "script": "https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/wskey.js",
                "requires-body": True
            }
        },
        {
            "type": "hostname",
            "data": "api-dd.jd.com"
        }
    ]
    main(config, "surge")
    main(config, "loon")
