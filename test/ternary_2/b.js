import {A} from "./a"

export class B {
	constructor(arg) {
		this.arg = arg
	}

	sayIt() {
		console.log(this.arg)
	}
}

const res = Math.random() >= 0 ? A : false
if(!res){
	throw new Error("No A!")
}