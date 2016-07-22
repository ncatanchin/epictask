#/bin/bash

echo "Looking for errors"
pkill -9 notify-on-error
touch logs/compile.log
tail -f logs/compile.log | grep --line-buffered -i error | xargs echo
#| xargs -I _val_ terminal-notifier -sound Funk "Error: _val_"
#
echo "Stopped watching for errors"