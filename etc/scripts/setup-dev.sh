#!/bin/bash

npm -Rf node_modules

# typestore typestore-mocks typestore-plugin-pouchdb pouchdb pouchdb-quick-search pouchdb-find
MODS="react-valid-props redux react react-dom material-ui typelogger typedux"

for pkg in ${MODS}
do
	echo "Linking ${pkg}"
	npm link ${pkg}
done


