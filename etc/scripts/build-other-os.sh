#!/bin/bash -e

OPTS=`getopt -o op: --long os,publish,help: -n 'parse-options' -- "$@"`
BASE_DIR=$(dirname $(dirname $(dirname $(realpath ${0}))))
echo "Base ${BASE_DIR}"

OS=""
TASK="build"
while true; do
  case "$1" in
    -o | --os) OS="${2}"; shift;shift ;;
    -p | --publish) TASK="publish"; shift;;
    -- ) shift; break ;;
    * ) break ;;
  esac
done

if [[ "${OS}" = "" ]]; then
  echo "No target specified"
  exit -1
fi

if [[ "${FONT_AWESOME_TOKEN}" = "" ]]; then
  echo "No font awesome token provided"
  exit -1
fi

TASK="${TASK}:${OS}"
WORK_DIR=${BASE_DIR}/dist/${OS}
echo "Executing '${TASK}' with work dir ${WORK_DIR}"

mkdir -p ${WORK_DIR}/node-modules
mkdir -p ${WORK_DIR}/dist
mkdir -p ${WORK_DIR}/electron-cache
mkdir -p ${WORK_DIR}/electron-builder-cache
#mkdir -p ~/.cache/electron/${OS}
#mkdir -p ~/.cache/electron-builder/${OS}


docker run --rm -ti \
 --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS_TAG|TRAVIS|TRAVIS_REPO_|TRAVIS_BUILD_|TRAVIS_BRANCH|TRAVIS_PULL_REQUEST_|APPVEYOR_|CSC_|GH_|GITHUB_|BT_|AWS_|STRIP|BUILD_') \
 --env ELECTRON_CACHE="/root/.cache/electron" \
 --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
 -v ${BASE_DIR}:/project \
 -v ${HOME}/.npmrc:/root/.npmrc \
 -v ${WORK_DIR}/dist:/project/dist \
 -v ${WORK_DIR}/node-modules:/project/node_modules \
 -v ${WORK_DIR}/electron-cache:/root/.cache/electron \
 -v ${WORK_DIR}/electron-builder-cache:/root/.cache/electron-builder \
 electronuserland/builder:wine-chrome \
/bin/bash -c "yarn && yarn run ${TASK}"

# npm config set \"@fortawesome:registry\" https://npm.fontawesome.com/ && npm config set \"//npm.fontawesome.com/:_authToken\" ${FONT_AWESOME_TOKEN}
