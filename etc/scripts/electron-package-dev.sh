#!/bin/bash -ex

#ROOT=$PWD
#
#pushd node_modules
##rm -Rf epictask-prebuilt
##mkdir epictask-prebuilt
##cp -R electron-prebuilt epictask-prebuilt
##pushd epictask-prebuilt
#pushd electron-prebuilt
#rm -Rf dist/EpicTask.app
#cp -R dist/Electron.app dist/EpicTask.app
#cp $ROOT/src/assets/images/icons/icon-darwin.icns dist/EpicTask.app/Contents/Resources/electron.icns
#cp $ROOT/src/assets/images/icons/icon-darwin.icns dist/EpicTask.app/Contents/Resources/epictask.icns
#cp $ROOT/src/assets/images/icons/icon-darwin.icns dist/EpicTask.app/Contents/Resources/EpicTask.icns
#echo "dist/EpicTask.app/Contents/MacOS/Electron" > path.txt
#popd
#popd
#
#DIST=$PWD/target/electron-dev
#
#
#mkdir -p ${DIST}
#electron-packager ./ \
#	--platform=darwin \
#	--overwrite \
#	--arch=x64 \
#	--asar=false \
#	--appname=EpicTask \
#	--out=${DIST} --ignore="src|etc|libs|docs|bin|dist\/electron|logs|typings|\.*" \
#	--icon=./src/assets/images/icons/icon-darwin.icns \
#	--derefSymlinks=false
#
#ln -fs ${PWD} ${DIST}/epictask-darwin-x64/epictask.app/Contents/Resources/app


echo "Cleaning"
rm -Rf dist/* .awcache

echo "Starting Compilation"
NODE_ENV=production gulp compile


echo "Copy resources"
mkdir -p dist/app/bin
cp bin/epictask-start.js dist/app/bin


# ./node_modules/.bin/build -m --dir

echo "Packaging"
./node_modules/.bin/build -m