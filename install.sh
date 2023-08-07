#!/bin/bash

ver = $(uname -m)
folder = "node_modules"

function install() {
  if ! command -v npm &>/dev/null; then
    echo "npm is not installed. Installing..."
    install_npm
  else
    echo "Installing Dependencies..."
    yarn add https://github.com/Deivu/Shoukaku.git
    yarn add
    if [ "$ver" = "aarch64" ]; then
      npm rebuild @tensorflow/tfjs-node --build-from-source
    fi
  fi
  echo Done
  echo
  mkdir db
  cd db
    mkdir backup
    mkdir data
    cd data
      mkdir database
      mkdir files
      mkdir nsfwjs
        cd nsfwjs
        curl -o model.json https://raw.github.com/infinitered/nsfwjs/blob/master/example/nsfw_demo/public/model/model.json
        curl -o group1-shard1of6 https://raw.github.com/infinitered/nsfwjs/blob/master/example/nsfw_demo/public/model/group1-shard1of6
        curl -o group1-shard2of6 https://raw.github.com/infinitered/nsfwjs/blob/master/example/nsfw_demo/public/model/group1-shard2of6
        curl -o group1-shard3of6 https://raw.github.com/infinitered/nsfwjs/blob/master/example/nsfw_demo/public/model/group1-shard3of6
        curl -o group1-shard4of6 https://raw.github.com/infinitered/nsfwjs/blob/master/example/nsfw_demo/public/model/group1-shard4of6
        curl -o group1-shard5of6 https://raw.github.com/infinitered/nsfwjs/blob/master/example/nsfw_demo/public/model/group1-shard5of6
        curl -o group1-shard6of6 https://raw.github.com/infinitered/nsfwjs/blob/master/example/nsfw_demo/public/model/group1-shard6of6
        cd ..
      cd ..
    mkdir music
    cd ..
  start_lavalink
  if [ -f .env ]; then
    echo ".env File is already exist. skip"
    echo "starting..."
    start_bot
  else
    echo "Making .env File..."
    content = "DISCORD_TOKEN=\"Write Discod Token Here..\"\nCLIENT_ID=\"Write Client Id Here..\"\nGUILD_ID=\"Write Main Server Guild Id Here..\"\nYOUTUBE_API=\"Write Youtbe API Key Here..(Optional)\"\nARTIVA_API=\"Write Artiva API Key Here..\""
    echo -e "$content" >.env
    echo Done
    echo
    echo "Please Write Your Token in .env File"
    echo "And, please execute 'ts-node app.ts'"
    echo "bye!"
    exit 0
  fi
}

function install_npm() {
  if [ "$ver" = "aarch64" ]; then
    wget https://nodejs.org/dist/v18.14.2/node-v18.14.2-linux-arm64.tar.xz
    tar -xvf node-v18.14.2-linux-arm64.tar.xz
    cd node-v18.14.2-linux-arm64
    sudo cp -R * /usr/local/
  fi
  if [ "$ver" = "x86_64" ]; then
    wget https://nodejs.org/dist/v18.14.2/node-v18.14.2-linux-x64.tar.xz
    tar -xvf node-v18.14.2-linux-x64.tar.xz
    cd node-v18.14.2-linux-x64
    sudo cp -R * /usr/local/
  fi
  sudo npm i -g n
  sudo n stable
  sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
  sudo i -g ts-node        # for typescript
  sudo npm install -g yarn # for yarn
  echo
  echo
  echo Done!
}

function start_bot() {
  # 현재 디렉토리 경로를 변수에 저장
  APP_DIR=$(pwd)

  # 스크린 세션 종료
  screen -S shapbot -X quit

  # 스크린 세션 시작
  screen -dmS shapbot

  # 스크린 세션에 명령어 전송하여 애플리케이션 실행
  screen -S shapbot -p 0 -X stuff "cd $APP_DIR\n ts-node app.ts\n"

  echo "shapbot started."
  echo "'screen -r shapbot' to view logs."
}

function start_lavalink() {
  # 현재 디렉토리 경로를 변수에 저장
  APP_DIR=$(pwd)

  # 스크린 세션 종료
  screen -S lavalink -X quit

  # 스크린 세션 시작
  screen -dmS lavalink

  # 스크린 세션에 명령어 전송하여 애플리케이션 실행
  screen -S lavalink -p 0 -X stuff "java -jar Lavalink.jar\n"

  echo "lavalink started."
  echo "'screen -r lavalink' to view logs."
}

function download() {
  mkdir server
  cd server
  curl -LJO https://github.com/lavalink-devs/Lavalink/releases/download/4.0.0-beta.3/Lavalink.jar
  config=$(
    cat <<EOF
server:
  port: 2333
  address: 0.0.0.0
lavalink:
  plugins:
    dependency: "com.github.topi314.lavasrc:lavasrc-plugin:3.2.5"
    repository: "https://maven.topi.wtf/releases"
  server:
    password: "shaper12340w"
    sources:
      youtube: true
      bandcamp: true
      soundcloud: true
      twitch: true
      vimeo: true
      http: true
      local: false
    filters:
      volume: true
      equalizer: true
      karaoke: true
      timescale: true
      tremolo: true
      vibrato: true
      distortion: true
      rotation: true
      channelMix: true
      lowPass: true
    bufferDurationMs: 400
    frameBufferDurationMs: 5000
    opusEncodingQuality: 10
    resamplingQuality: LOW
    trackStuckThresholdMs: 10000
    useSeekGhosting: true
    youtubePlaylistLoadLimit: 6
    playerUpdateInterval: 5
    youtubeSearchEnabled: true
    soundcloudSearchEnabled: true
    gc-warnings: true
metrics:
  prometheus:
    enabled: false
    endpoint: /metrics
sentry:
  dsn: ""
  environment: ""
logging:
  file:
    path: ./logs/
  level:
    root: INFO
    lavalink: INFO
  request:
    enabled: true
    includeClientInfo: true
    includeHeaders: false
    includeQueryString: true
    includePayload: true
    maxPayloadLength: 10000
  logback:
    rollingpolicy:
      max-file-size: 1GB
      max-history: 30
EOF
  )
  echo "$config" >application.yml
  start_lavalink

}

if [ "$ver" = "x86_64" ]; then
  if [ -d "$folder" ] && [ -d "server" ]; then
    start_lavalink
    start_bot
  else
    echo "64-bit Supported. Install will be starting..."
    install
  fi
elif [ "$ver" = "i386" ]; then
  echo "32-bit is not supported."
  exit 1
elif [ "$ver" = "aarch64" ]; then
  if [ -d "$folder" ] && [ -d "server" ]; then
    start_lavalink
    start_bot
  else
    echo "Arm64 Supported. Install will be starting..."
    install
  fi
elif [ "$ver" = "armv7l" ]; then
  echo "Arm32 is not supported"
  exit 1
fi
