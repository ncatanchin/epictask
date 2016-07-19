#!/bin/bash -e

pushd libs/material-ui
npm i
npm run build
npm link
popd

#ln -fs ${PWD}/libs/material-ui/build ${PWD}/node_modules/material-ui
npm link material-ui
