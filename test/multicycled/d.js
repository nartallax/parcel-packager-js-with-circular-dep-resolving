import {E} from "./e"

export class D {

	static checkForE() {
		if(typeof(E) !== "function"){
			throw new Error("E is not a function")
		}
	}

	runOn(obj) {
		obj.sayTheLine()
	}
}