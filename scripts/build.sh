#!/usr/bin/env bash

set -e
cd `dirname "$0"`
cd ..

rm -rf target 2> /dev/null
rm -rf js 2> /dev/null
rm -rf .parcel-cache 2> /dev/null
rm -rf bundler.js 2> /dev/null
rm -rf bundler.js.map 2> /dev/null

#./node_modules/.bin/tsc --noEmit
./node_modules/.bin/parcel build

rm target/packager.js.map
cp package.json target/
cp LICENSE target/
cp README.md target/
cp lib/dev-prelude.js target
cp patch/dev-prelude-patch.js target

node scripts/patch_packagejson_after_build.mjs