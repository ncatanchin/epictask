#!/bin/bash -e

HOME=~/.electron-gyp
pushd node_modules/leveldown
node-gyp rebuild --target=1.2.3 --arch=x64 --dist-url=https://atom.io/download/atom-shell
popd

#pushd node_modules/sqlite3
#node-gyp rebuild --target=1.2.3 --arch=x64 --dist-url=https://atom.io/download/atom-shell
#popd
