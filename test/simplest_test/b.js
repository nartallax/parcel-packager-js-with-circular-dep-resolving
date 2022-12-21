import {a} from "./a"

export const b = () => {
	return Math.random() > 0.5 ? a() : 1
}

console.log(a())