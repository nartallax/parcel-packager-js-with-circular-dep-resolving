import {B} from "./b"

export class A {
	constructor(arg: unknown) {
		if(arg){
			new B("Test passed!").sayIt()
		}
	}
}