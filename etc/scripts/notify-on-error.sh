#!/usr/bin/env bash

echo "Looking for errors"
pkill -9 notify-on-error
touch logs/compile.log
tail -f logs/compile.log | grep --line-buffered -i error | xargs -n4 terminal-notifier -sound Funk
#
echo "Stopped watching for errors"