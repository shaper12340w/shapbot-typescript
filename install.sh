#!/bin/bash

ver = $(uname -m)

function install() {
  if ! command -v npm &>/dev/null; then
    echo "npm is not installed. Installing..."
    install_npm
  else
    echo "Installing Dependencies..."
    yarn add
    if [ "$ver" = "aarch64" ]; then
      npm rebuild @tensorflow/tfjs-node --build-from-source
    fi
  fi
  echo Done
  echo
  if [ -f .env ]; then
    echo ".env File is already exist. skip"
    echo "starting..."
    ts-node app.ts
  else
    echo "Making .env File..."
    content = "DISCORD_TOKEN=\"Write Discod Token Here..\"\nCLIENT_ID=\"Write Client Id Here..\"\nGUILD_ID=\"Write Main Server Guild Id Here..\"\nYOUTUBE_API=\"Write Youtbe API Key Here..(Optional)\"\nARTIVA_API=\"Write Artiva API Key Here..\""
    echo -e "$content" > .env
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

if [ "$ver" = "x86_64" ]; then
  echo "64-bit Supported. Install will be starting..."
  install
elif [ "$ver" = "i386" ]; then
  echo "32-bit is not supported."
  exit 1
elif [ "$ver" = "aarch64" ]; then
  echo "Arm64 Supported. Install will be starting..."
  install
elif [ "$ver" = "armv7l" ]; then
  echo "Arm32 is not supported"
  exit 1
fi
