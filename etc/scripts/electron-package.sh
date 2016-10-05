#!/bin/bash -ex

echo "Cleaning"
rm -Rf dist/* .awcache

echo "Starting Compilation"
NODE_ENV=production gulp compile


echo "Copy resources"
mkdir -p dist/app/bin
cp bin/epictask-start.js dist/app/bin


# ./node_modules/.bin/build -m --dir

echo "Packaging"
./node_modules/.bin/build -wm