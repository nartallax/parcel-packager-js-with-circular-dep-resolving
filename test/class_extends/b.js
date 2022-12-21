import {A, C} from "./a"

export class B extends C {
	constructor(arg) {
		super()
		this.arg = arg
	}
}

if(typeof(A) === "undefined"){
	throw new Error("No A defined")
}