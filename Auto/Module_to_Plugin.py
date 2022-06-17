from cmath import e
import os
import re


def get_file_name():
    for root, dirs, file_lists in os.walk("../Surge"):
        return file_lists


def main(file_lists):
    for file_name in file_lists:
        print(f"\r{file_name}", end="")
        file_name = file_name.replace(".sgmodule", "")
        with open(f"../Surge/{file_name}.sgmodule", "r", encoding='utf-8') as file:
            check = file.read()
        if "Rule" in check:
            continue
        elif "URL Rewrite" in check:
            continue
        elif "General" in check:
            continue
        with open(f"../Surge/{file_name}.sgmodule", "r", encoding='utf-8') as file:
            notes = file.readlines()
        name = notes[0].replace("#!name=", "")
        desc = notes[1].replace("#!desc=", "").replace("Surge", "Loon").replace("module", "plugin")
        line_hostname = 0
        line_scripts = []
        for note in notes:
            if "type" in note:
                line_scripts.append(notes.index(note))
            if "hostname" in note:
                line_hostname = notes.index(note)
                break
        tasks = []
        requests = []
        responses = []
        for line in line_scripts:
            if "type=cron" in notes[line]:
                tag = re.findall(r'(.+)type=cron', notes[line])[0].replace("=", "").replace(" ", "")
                cronexp = re.findall(r'cronexp="([^"]+)', notes[line])[0]
                path = re.findall(r'script-path=([^,]+)', notes[line])[0]
                try:
                    argument = re.findall(r'argument=([^,]+)', notes[line])[0]
                    task = f'cron "{cronexp}" script-path={path}, tag={tag}, argument={argument}, enable=true\n'
                except IndexError:
                    task = f'cron "{cronexp}" script-path={path}, tag={tag}, enable=true\n'
                tasks.append(task)
            elif "type=http-request" in notes[line]:
                tag = re.findall(r'(.*)type=http-request', notes[line])[0].replace("=", "").replace(" ", "")
                pattern = re.findall(r'pattern=([^,]+)', notes[line])[0]
                path = re.findall(r'script-path=([^,]+)', notes[line])[0]
                body = re.findall(r'requires-body=([^,]+)', notes[line])
                argument = re.findall(r'argument=([^,]+)', notes[line])
                try:
                    timeout = re.findall(r'timeout=([^,]+)', notes[line])[0].replace("\n", "")
                except IndexError:
                    timeout = 10
                if body and not argument:
                    request = f'http-request {pattern} script-path={path}, requires-body=true, timeout={timeout}, tag={tag}, enable = true\n '
                elif body and argument:
                    request = f'http-request {pattern} script-path={path}, requires-body=true, timeout={timeout}, tag={tag}, argument={argument[0]}, enable = true\n'
                elif not body and argument:
                    request = f'http-request {pattern} script-path={path}, timeout={timeout}, tag={tag}, argument={argument[0]}, enable = true\n'
                else:
                    request = f'http-request {pattern} script-path={path}, timeout={timeout}, tag={tag}, enable = true\n'
                requests.append(request)
            elif "type=http-response" in notes[line]:
                tag = re.findall(r'(.*)type=http-response', notes[line])[0].replace("=", "").replace(" ", "")
                pattern = re.findall(r'pattern=([^,]+)', notes[line])[0]
                path = re.findall(r'script-path=([^,]+)', notes[line])[0]
                body = re.findall(r'requires-body=([^,]+)', notes[line])
                argument = re.findall(r'argument=([^,]+)', notes[line])
                try:
                    timeout = re.findall(r'timeout=([^,]+)', notes[line])[0].replace("\n", "")
                except IndexError:
                    timeout = 10
                if body and argument:
                    response = f'http-response {pattern} script-path={path}, requires-body=true, timeout={timeout}, tag={tag}, argument={argument[0]}, enable = true\n'
                elif body and not argument:
                    response = f'http-response {pattern} script-path={path}, requires-body=true, timeout={timeout}, tag={tag}, enable = true\n'
                elif not body and argument:
                    response = f'http-response {pattern} script-path={path}, timeout={timeout}, tag={tag}, argument={argument[0]}, enable = true\n'
                else:
                    response = f'http-response {pattern} script-path={path} timeout={timeout}, tag={tag}, enable = true\n'
                responses.append(response)
        scripts_cache = ""
        responses_cache = ""
        tasks_cache = ""
        for _ in requests:
            scripts_cache += _
        for _ in responses:
            responses_cache += _
        for _ in tasks:
            tasks_cache += _
        handle = f"#!name= {name}" \
                 f"#!desc= {desc}" \
                 f"#!icon= https://raw.githubusercontent.com/chiupam/surge/main/boxjs/icon/xxxxxx.jpeg\n\n"
        scripts = f'[Script]\n{scripts_cache}{responses_cache}{tasks_cache}\n'
        mitm = f'[Mitm]\nhostname = {notes[line_hostname].replace("hostname = %APPEND% ", "")}\n'
        with open(f"../Loon/cache/{file_name}.plugin", "w", encoding="utf-8") as plugin:
            if "." in mitm:
                plugin.write( handle + scripts + mitm)
            else:
                plugin.write( handle + scripts)


if __name__ == '__main__':
    main(get_file_name())
