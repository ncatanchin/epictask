#!/bin/bash -e

npm i -g redux react@15.3.0 react-dom@15.3.0 react-tap-event-plugin
rm -Rf node_modules
MODS="react-valid-props redux react react-dom react-tap-event-plugin material-ui typelogger typedux typestore typestore-mocks typestore-plugin-pouchdb"

if [ -e "../material-ui" ]; then
	echo "Building material-ui"
	pushd ../material-ui
	rm -Rf node_modules build
	npm link react react-dom react-tap-event-plugin
	npm i
	npm run build
	pushd build
	npm link react react-dom react-tap-event-plugin
	popd
	popd
else
	echo "Material-ui is not available one level up, skipping"
fi

echo "Linking modules ${MODS}"
npm link ${MODS}
echo "Installing others"
npm i

echo "\n\nReady to code"



