#!/usr/bin/env bash

echo "Ensuring material-ui is available"

if [ ! -e "${PWD}/node_modules/material-ui" ]; then
	echo "Building material-ui local"
	./etc/scripts/build-material-ui.sh
fi

RAMDISK=${HOME}/RAMDISK
RAMDISK_EPICPATH=${HOME}/RAMDISK/epictask
COMPILE_DIRS="dist .awcache .happypack-electron-renderer-db .happypack-electron-renderer-ui"


#if [ -e "${RAMDISK}" ]; then
#	echo "RAM DISK EXISTS"
#	if [ ! -e "${RAMDISK_EPICPATH}" ]; then
#		echo "RAM DISK ECPI PATH DOS NOT EXIST"
#
#		for compileDir in ${COMPILE_DIRS}
#		do
#			echo "Going to setup path: ${compileDir}"
#			rm -Rf ${compileDir}
#			NEW_DIR="${RAMDISK_EPICPATH}/${compileDir}"
#			mkdir -p ${NEW_DIR}
#			echo "New path ${NEW_DIR}"
#			ln -fs "${NEW_DIR}" "${PWD}/${compileDir}"
#		done
#	fi
#fi

#./etc/scripts/notify-on-error.sh

# Redirect stdout ( > ) into a named pipe ( >() ) running "tee"
exec > >(tee -i logs/compile.log)

# Without this, only stdout would be captured - i.e. your
# log file would not contain any error messages.
# SEE (and upvote) the answer by Adam Spiers, which keeps STDERR
# as a seperate stream - I did not want to steal from him by simply
# adding his answer to mine.
exec 2>&1

node --max-old-space-size=6000 ./node_modules/.bin/gulp compile-watch
