docker rm -f bot
docker rmi bot:alpine-3.8.10
cd /docker/Telegram
docker build -t bot:alpine-3.8.10 .
docker run -dit --name bot --restart always -v /docker/Telegram:/Telegram bot:alpine-3.8.10

docker rm -f bot.9
docker rmi bot:alpine-3.9.7
cd /docker/Telegram.9
docker build -t bot:alpine-3.9.7 .
docker run -dit --name bot.9 --restart always -v /docker/Telegram.9:/Telegram bot:alpine-3.9.7
