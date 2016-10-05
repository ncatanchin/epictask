echo "Cleaning"
rmdir /y dist .awcache

echo "Starting Compilation"
set NODE_ENV=production gulp compile


echo "Copy resources"
mkdir -p dist/app/bin
cp bin/epictask-start.js dist/app/bin

echo "Packaging"
./node_modules/.bin/build -w
