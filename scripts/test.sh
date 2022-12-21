#!/usr/bin/env bash

set -e
cd `dirname "$0"`
cd ..

PACKAGE_NAME="@nartallax/parcel-packager-js-with-circular-dep-resolving"

cleanup_test_dir(){
	rm -rf ./node_modules 2> /dev/null
	rm -rf .parcel-cache 2> /dev/null
	rm -rf out.js 2> /dev/null
	rm -rf out.js.map 2> /dev/null
	rm -rf src 2> /dev/null
	rm -rf "./node_modules/${PACKAGE_NAME}" 2> /dev/null
}

find_entrypoint_within_test(){
	ENTRYPOINT="src/index$1.html"
	if [ ! -f $ENTRYPOINT ]; then
		ENTRYPOINT="src/main$1.js"
	else
		cat ./package.json | sed s/\"main\":\ \"out.js\",// > _package.json
		mv _package.json package.json
	fi
	if [ ! -f $ENTRYPOINT ]; then
		ENTRYPOINT="src/main$1.ts"
	fi
	echo $ENTRYPOINT
}

find_output_bundle_within_test(){
	if [ -d "./dist" ]; then
		ls dist/*.js
		return 0
	fi

	echo "out.js"
}

run_single_test(){
	cleanup_test_dir
	ln -s ../node_modules ./node_modules
	mkdir -p "./node_modules/${PACKAGE_NAME}"
	cp -r ../target/* "node_modules/${PACKAGE_NAME}/"
	cp -r "../test/$1" ./src
	cp -r ../test_base/* ./

	ENTRYPOINT=$(find_entrypoint_within_test "")
	# ./node_modules/.bin/parcel build $ENTRYPOINT
	./node_modules/.bin/parcel build $ENTRYPOINT 
	node $(find_output_bundle_within_test)

	ENTRYPOINT=$(find_entrypoint_within_test "_reversed")
	./node_modules/.bin/parcel build $ENTRYPOINT
	node $(find_output_bundle_within_test)
}

scripts/build.sh

rm -rf ./test_tmp 2> /dev/null
# this cp here is to copy .parcelrc
# which won't be copied during test runs
cp -r test_base test_tmp/

cd test_tmp

if [ -z "$1" ]; then
	for test_case in ../test/*; do
  		echo "Running test ${test_case}"
		run_single_test ${test_case}
	done
else
	echo "Running test $1"
	run_single_test "$1"
fi

cd ..
rm -rf test_tmp