import {b} from "./b"

export const a = () => {
	return Math.random() > 0.5 ? b() : 0
}