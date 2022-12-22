let libName = "not set"
export function setLibName(name) {
	libName = name
}
export function checkLibName(name) {
	if(libName !== name){
		throw new Error(`Expected lib name to be ${name}, but it's ${libName}`)
	}
}