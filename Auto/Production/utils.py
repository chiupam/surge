def assemble(_data, app="surge"):
    if _data["type"] == "describe":
        name = _data["data"]["name"] + "\n"
        desc = _data["data"]["desc"] + "\n"
        icon = _data["data"]["icon"] + "\n"
        if "s" in app:
            return f"#!name={name}#!desc={desc}#!system=ios\n\n[Script]\n"
        elif "o" in app:
            return f"#!name= {name}#!desc= {desc.replace('Surge module', 'Loon plugin')}#!author= chiupam\n#!homepage= https://github.com/chiupam/surge/tree/main/Loon\n#!icon= {icon}\n[Script]\n"
        else:
            return None
    elif _data["type"] == "cron":
        types = _data["type"]
        tag = _data["data"]["tag"]
        cronexp = _data["data"]["cronexp"]
        script = _data["data"]["script"]
        if "s" in app:
            return f'{tag} = type={types}, cronexp="{cronexp}", wake-system=1, script-path={script}, script-update-interval=0, timeout=15\n'
        elif "o" in app:
            return f'{types} "{cronexp}" script-path={script}, tag={tag}\n'
        else:
            return None
    elif _data["type"] == "http-request":
        types = _data["type"]
        tag = _data["data"]["tag"]
        regex = _data["data"]["regex"]
        script = _data["data"]["script"]
        if "s" in app:
            body = "1" if _data["data"]["requires-body"] else "0"
            size = ", max-size=-1"if _data["data"]["requires-body"] else ""
            return f'{tag} = type={types}, pattern={regex}, requires-body={body}{size}, script-path={script}, script-update-interval=0, timeout=15\n'
        elif "o" in app:
            body = ", requires-body=true" if _data["data"]["requires-body"] else ""
            return f'{types} {regex} script-path={script}{body}, timeout=15, tag={tag}\n'
        else:
            return None
    elif _data["type"] == "http-response":
        types = _data["type"]
        tag = _data["data"]["tag"]
        regex = _data["data"]["regex"]
        script = _data["data"]["script"]
        if "s" in app:
            body = "1" if _data["data"]["requires-body"] else "0"
            size = ", max-size=-1"if _data["data"]["requires-body"] else ""
            return f'{tag} = type={types}, pattern={regex}, requires-body={body}{size}, script-path={script}, script-update-interval=0, timeout=15\n'
        elif "o" in app:
            body = ", requires-body=true" if _data["data"]["requires-body"] else ""
            return f'{types} {regex} script-path={script}{body}, timeout=15, tag={tag}\n'
        else:
            return None
    else:
        if "s" in app:
            return f"\n[MITM]\nhostname = %APPEDN% {_data['data']}\n"
        elif "o" in app:
            hostname = _data['data'].replace(" ", "")
            return f"\n[Mitm]\nhostname = {hostname}\n"
        else:
            return None
