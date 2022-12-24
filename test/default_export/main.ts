import uwu from "./a"
import {allUwus, expectedUwusCount} from "./b"

if(allUwus.length !== expectedUwusCount){
	throw new Error("Wrong amount of uwu")
}

console.log(uwu.uwu)