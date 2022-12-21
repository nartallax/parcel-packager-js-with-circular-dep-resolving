// this script updates target/package.json to point to correct main file

import {readFileSync, writeFileSync} from "fs"

const packagejson = JSON.parse(readFileSync("target/package.json", "utf-8"))

packagejson.main = packagejson.main.replace("target/", "")
delete packagejson.src
delete packagejson.devDependencies

writeFileSync("target/package.json", JSON.stringify(packagejson, null, 2), "utf-8")