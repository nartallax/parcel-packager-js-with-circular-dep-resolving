import {B} from "./b"

export class A {
	constructor(arg) {
		if(arg){
			new B("Test passed!").sayIt()
		}
	}
}