#!/usr/bin/env bash

set -e
cd `dirname "$0"`
cd ..

scripts/build.sh
cd target
npm publish --access public