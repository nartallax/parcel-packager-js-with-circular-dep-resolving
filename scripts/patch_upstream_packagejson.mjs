// this script patches package.json when it's freshly pulled from upstream

import {readFileSync, writeFileSync} from "fs"

let packagejson = JSON.parse(readFileSync("package.json", "utf-8"))
packagejson = {
	...packagejson,
	name: "@nartallax/parcel-packager-js-with-circular-dep-resolving",
	description: "Packager plugin for Parcel that helps with proper resolution of circular dependencies",
	source: "lib/index.js",
	main: "target/packager.js"
}

delete packagejson.gitHead
delete packagejson.repository
delete packagejson.publishConfig

if(packagejson.author){
	packagejson.author += " and Nartallax"
}

writeFileSync("package.json", JSON.stringify(packagejson, null, 2), "utf-8")