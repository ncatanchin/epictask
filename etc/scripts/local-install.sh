#!/bin/bash -e

rm -Rf node_modules

# typestore typestore-mocks typestore-plugin-pouchdb pouchdb pouchdb-quick-search pouchdb-find
#npm i -g redux react react-dom
MODS="react-valid-props redux react react-dom material-ui typelogger typedux typestore typestore-mocks typestore-plugin-pouchdb"
npm link ${MODS}
npm i

#for pkg in ${MODS}
#do
#	echo "Linking ${pkg}"
#	npm link ${pkg}
#done



