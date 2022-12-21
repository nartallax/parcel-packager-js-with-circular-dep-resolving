import {A} from "./a"
import {B} from "./b"
import * as css from "./style.module.scss"

export function main() {
	void new A(B)
	if(!("body" in css) || typeof(css.body) !== "string"){
		throw new Error("SCSS modules are malfunctioning")
	}
}

main()