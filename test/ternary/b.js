import {A} from "./a"

export class B {
	constructor(arg) {
		this.arg = arg
	}

	sayIt() {
		console.log(this.arg)
	}
}

const res = A ? true : false
if(!res){
	throw new Error("No A!")
}