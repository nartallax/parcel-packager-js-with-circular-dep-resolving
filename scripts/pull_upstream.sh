#!/usr/bin/env bash

set -e
cd `dirname "$0"`
cd ..

TMPDIR="/tmp/packager_upstream"

rm -rf "$TMPDIR" 2> /dev/null
mkdir "$TMPDIR"
cd "$TMPDIR"

npm init -y
npm install @parcel/packager-js
cd -

rm -rf "./lib" 2> /dev/null
rm -rf $TMPDIR/src
rm -rf $TMPDIR/README.md 2> /dev/null
rm -rf $TMPDIR/README.MD 2> /dev/null
rm -rf ./lib
cp -r $TMPDIR/node_modules/@parcel/packager-js/* ./
rm -rf "$TMPDIR"
rm -rf node_modules 2> /dev/null

# I cannot put this stuff into package.json 
# because it will get replaced each time I pull upstream
npm install --save-dev typescript @types/node @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint parcel parcel-resolver-ts-base-url
npm install acorn

node scripts/patch_upstream_packagejson.mjs