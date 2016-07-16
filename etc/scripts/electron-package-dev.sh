#!/bin/bash -ex

ROOT=$PWD

pushd node_modules
#rm -Rf epictask-prebuilt
#mkdir epictask-prebuilt
#cp -R electron-prebuilt epictask-prebuilt
#pushd epictask-prebuilt
pushd electron-prebuilt
rm -Rf dist/EpicTask.app
cp -R dist/Electron.app dist/EpicTask.app
cp $ROOT/src/assets/images/icons/icon-darwin.icns dist/EpicTask.app/Contents/Resources/electron.icns
echo "dist/EpicTask.app/Contents/MacOS/Electron" > path.txt
popd
popd

#DIST=dist/electron
#
#
#mkdir -p ${DIST}
#electron-packager ./ --platform=darwin --overwrite --arch=x64 --appname=EpicTask \
#	--out=${DIST} --ignore="src|etc|libs|docs|bin|dist\/electron|logs|typings|\.*" \
#	--icon=./src/assets/images/icons/icon-darwin.icns \
#	--asar.unpackDir=dist/electron-unpack
