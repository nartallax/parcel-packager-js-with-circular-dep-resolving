import {A} from "./a"

export class C {
	sayIt() {
		if(typeof(A) === "function"){
			console.log("Test passed!")
		} else {
			throw new Error("A is not a function")
		}
	}
}