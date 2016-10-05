set ELECTRON_VERSION=1.3.5

#HOME=~/.electron-gyp
#DIRS="node_modules/leveldown node_modules/typestore-plugin-pouchdb/node_modules/leveldown"
#BUILT=""
#for dir in ${DIRS}
#do
#	if [ -e "${dir}" ]; then
#		echo "Using ${dir} for leveldown"

cd node_modules/leveldown
node-gyp rebuild --target=1.3.5 --arch=x64 --dist-url=https://atom.io/download/atom-shell
cd ../..
