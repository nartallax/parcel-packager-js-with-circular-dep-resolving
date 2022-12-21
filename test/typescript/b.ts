import {A} from "./a"

export class B {
	constructor(readonly arg: string) {}

	sayIt() {
		console.log(this.arg)
	}
}

{
	if(typeof(A) === "undefined"){
		throw new Error("No A defined")
	}
}