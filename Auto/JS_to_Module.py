import os
import re


def get_file_name():
    for root, dirs, file_lists in os.walk("../Surge"):
        return file_lists


def value(_string):
    if len(_string) < 5:
        return None
    _type = re.findall(r'type: (.*)', _string)
    if _type:
        return "type", _type[0]
    _cron = re.findall(r'cron: (.*)', _string)
    if _cron:
        return "cronexp", _cron[0]
    _regex = re.findall(r'regex: (.*)', _string)
    if _regex:
        return "pattern", _regex[0]
    _path = re.findall(r'script-path: (.*)', _string)
    if _path:
        return "path", _path[0]
    _body = re.findall(r'requires-body: (.*)', _string)
    if _body:
        return "body", _body[0]


def main():
    file_name = "qndxx"
    file_name = file_name.replace(".sgmodule", "")
    with open(f"../scripts/javascripts/{file_name}.js", "r", encoding='utf-8') as file:
        notes = file.readlines()
    end_line = 0
    for note in notes:
        if "===============" in note:
            end_line = notes.index(note)
            break
    crons = []
    requests = []
    responses = []
    for note in notes[0:end_line]:
        if "type: http-request" in note:
            request = {}
            start = notes.index(note)
            for cron_note in notes[start:end_line]:
                if value(cron_note):
                    request[value(cron_note)[0]] = value(cron_note)[1]
                if cron_note == " * \n":
                    break
            requests.append(request)
        elif "type: http-response" in note:
            response = {}
            start = notes.index(note)
            for cron_note in notes[start:end_line]:
                if value(cron_note):
                    response[value(cron_note)[0]] = value(cron_note)[1]
                if cron_note == " * \n":
                    break
            responses.append(response)
        elif "type: cron" in note:
            cron = {}
            start = notes.index(note)
            for cron_note in notes[start:end_line]:
                if value(cron_note):
                    cron[value(cron_note)[0]] = value(cron_note)[1]
                if cron_note == " * \n":
                    break
            crons.append(cron)
    print(requests)
    print(responses)
    print(crons)


if __name__ == '__main__':
    main()
