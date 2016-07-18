#!/bin/bash -e

ELECTRON_VERSION=$(cat package.json| grep electron-prebuilt | awk '{ print substr($2,2,length($2) - 3) }')

HOME=~/.electron-gyp
pushd node_modules/leveldown
node-gyp rebuild --target=${ELECTRON_VERSION} --arch=x64 --dist-url=https://atom.io/download/atom-shell
popd



#pushd node_modules/sqlite3
#node-gyp rebuild --target=1.2.3 --arch=x64 --dist-url=https://atom.io/download/atom-shell
#popd


echo "Creating Electron EpicTask.app for DEV"
./etc/scripts/electron-package-dev.sh
