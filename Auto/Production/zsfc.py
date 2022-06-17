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
                "name": "掌上飞车APP",
                "desc": "This is a Surge module for 掌上飞车APP.",
                "icon": ""
            }
        },
        {
            "type": "http-request",
            "data": {
                "tag": "掌上飞车Cookie",
                "regex": "^https:\/\/mwegame\.qq\.com\/ams\/sign\/doSign\/month",
                "script": "https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/zsfc.js",
                "requires-body": False
            }
        },
        {
            "type": "cron",
            "data": {
                "tag": "掌上飞车",
                "cronexp": "30 0 0 * * * ",
                "script": "https://raw.githubusercontent.com/chiupam/surge/main/scripts/javascripts/zsfc.js",
            }
        },
        {
            "type": "hostname",
            "data": "mwegame.qq.com"
        }
    ]
    main(config, "surge")
    main(config, "loon")
