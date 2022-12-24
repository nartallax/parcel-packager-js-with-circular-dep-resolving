export function makeUwu(text: string): {uwu: string} {
	const myUwu = {uwu: text}
	allUwus.push(myUwu)
	return myUwu
}

export const allUwus: {uwu: string}[] = []
export const expectedUwusCount = 1