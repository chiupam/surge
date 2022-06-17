import os


def get_file_name():
    for root, dirs, file_lists in os.walk("../Surge"):
        return file_lists


def main(file_lists):
    for file_name in file_lists:
        with open(f"../Surge/{file_name}", "r", encoding='utf-8') as read:
            note = read.read()
        note = note.replace(", ", ",").replace(",", ", ")
        print(file_name)
        with open(f"../Surge/{file_name}", "w", encoding='utf-8') as write:
            write.write(note)


if __name__ == '__main__':
    main(get_file_name())
