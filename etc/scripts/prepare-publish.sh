#!/usr/bin/env bash

set -e

npm version patch
git push
git push --tags

