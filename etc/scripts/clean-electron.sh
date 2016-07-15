#!/bin/bash -ex

ELECTRON_DIR="$HOME/Library/Application Support/Electron"
cd "${ELECTRON_DIR}"
pwd
echo "Deleting electron storage ${ELECTRON_DIR}"

rm -Rf settings.db
rm -Rf epictask*
rm -Rf Cache caches
