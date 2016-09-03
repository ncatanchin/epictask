#!/usr/bin/env bash

./etc/scripts/configure-dev-env.sh

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
