#!/bin/bash -e

#ELECTRON_VERSION=$( cat package.json| grep -v node | grep '\"electron\"' | awk '{ print substr($2,2,length($2) - 3) }' )
ELECTRON_VERSION=$( cat package.json| grep -v node | grep '\"electron-prebuilt\"' | awk '{ print substr($2,2,length($2) - 3) }' )

HOME=~/.electron-gyp
DIRS="node_modules/leveldown node_modules/typestore-plugin-pouchdb/node_modules/leveldown"
BUILT=""
for dir in ${DIRS}
do
	if [ -e "${dir}" ]; then
		echo "Using ${dir} for leveldown"
		pushd ${dir}
		node-gyp rebuild --target=${ELECTRON_VERSION} --arch=x64 --dist-url=https://atom.io/download/atom-shell
		popd
		BUILT=1
		break
	fi
done

#
#node_modules/.bin/node-pre-gyp --target=${ELECTRON_VERSION} --runtime=electron --fallback-to-build --directory node_modules/v8-debug/ --dist-url=https://atom.io/download/atom-shell reinstall
#node_modules/.bin/node-pre-gyp --target=${ELECTRON_VERSION} --runtime=electron --fallback-to-build --directory node_modules/v8-profiler/ --dist-url=https://atom.io/download/atom-shell reinstall

if [ "${BUILT}" != "1" ]; then
	echo "No leveldown found"
	exit 1
fi
