#!/bin/bash -e

ELECTRON_VERSION=$(cat package.json| grep electron-prebuilt | awk '{ print substr($2,3,length($2) - 4) }')

HOME=~/.electron-gyp
pushd node_modules/leveldown
node-gyp rebuild --target=${ELECTRON_VERSION} --arch=x64 --dist-url=https://atom.io/download/atom-shell
popd

#pushd node_modules/sqlite3
#node-gyp rebuild --target=1.2.3 --arch=x64 --dist-url=https://atom.io/download/atom-shell
#popd
