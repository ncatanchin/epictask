#!/usr/bin/env bash

./etc/scripts/configure-dev-env.sh



#./etc/scripts/notify-on-error.sh

# Redirect stdout ( > ) into a named pipe ( >() ) running "tee"
#exec > >(tee -i logs/compile.log)
#exec 2>&1

if [ "${NODE_ENV}" == "" ];then
	export NODE_ENV=development
	export HOT=1
	export DEBUG=1
fi

node --max-old-space-size=4000 ./node_modules/.bin/gulp compile-watch
