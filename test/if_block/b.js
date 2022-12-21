import {A} from "./a"

export class B {
	constructor(arg) {
		this.arg = arg
	}

	sayIt() {
		console.log(this.arg)
	}
}

if(Math.random() >= 0){
	if(typeof(A) === "undefined"){
		throw new Error("No A defined")
	}
}