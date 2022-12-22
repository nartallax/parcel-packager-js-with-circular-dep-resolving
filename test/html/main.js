import {A} from "./a"
import {B} from "./b"
import * as css from "./style.module.scss"

export function main() {
	if(!("body" in css) || typeof(css.body) !== "string"){
		throw new Error("SCSS modules are malfunctioning")
	}
	void new A(B)
}

main()