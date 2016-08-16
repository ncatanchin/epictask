#!/usr/bin/env bash

echo "Ensuring material-ui is available"

if [ ! -e "${PWD}/node_modules/material-ui" ]; then
	echo "Building material-ui local"
	./etc/scripts/build-material-ui.sh
fi

RAMDISK=${HOME}/RAMDISK
RAMDISK_EPICPATH=${HOME}/RAMDISK/epictask
COMPILE_DIRS="dist .awcache .happypack-electron-renderer-db .happypack-electron-renderer-ui"


if [ -e "${RAMDISK}" ]; then
	echo "RAM DISK EXISTS"
	mkdir -p ${RAMDISK_EPICPATH}
	if [ ! -h "${RAMDISK_EPICPATH}/node_modules" ]; then
		echo "linking node modules"
		ln -sf $PWD/node_modules "${RAMDISK_EPICPATH}/node_modules"
	fi

	for compileDir in ${COMPILE_DIRS}
		do
		compilePath="${PWD}/${compileDir}"
		NEW_DIR="${RAMDISK_EPICPATH}/${compileDir}"
		if [ ! -e "${NEW_DIR}" ];then
			mkdir -p ${NEW_DIR}
		fi

		if [ ! -h "${compilePath}" ]; then
			echo "RAM DISK Exists and Epic Path ${compilePath} is not a link"

			rm -Rf ${compileDir}
			echo "New path ${NEW_DIR}"
			ln -fs "${NEW_DIR}" "${compilePath}"
		fi
	done
fi

#./etc/scripts/notify-on-error.sh

# Redirect stdout ( > ) into a named pipe ( >() ) running "tee"
exec > >(tee -i logs/compile.log)

# Without this, only stdout would be captured - i.e. your
# log file would not contain any error messages.
# SEE (and upvote) the answer by Adam Spiers, which keeps STDERR
# as a separate stream - I did not want to steal from him by simply
# adding his answer to mine.
exec 2>&1

node --max-old-space-size=6000 ./node_modules/.bin/gulp compile-watch
