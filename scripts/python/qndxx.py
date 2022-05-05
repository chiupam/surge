import requests


def main():
    url = "http://home.yngqt.org.cn/qndxx/user/"
    headers = {
        "Cookie": "",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, "
                      "like Gecko) Mobile/15E148 MicroMessenger/8.0.18(0x1800123f) NetType/4G Language/zh_CN",
    }
    response = requests.get(url, headers=headers, allow_redirects=False)
    print(response.text)


if __name__ == "__main__":
    main()
