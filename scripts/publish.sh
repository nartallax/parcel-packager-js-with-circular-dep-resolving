#!/usr/bin/env bash

set -e
cd `dirname "$0"`
cd ..

./node_modules/typescript/bin/tsc --noEmit
scripts/test.sh
scripts/build.sh

cd target
npm publish --access public