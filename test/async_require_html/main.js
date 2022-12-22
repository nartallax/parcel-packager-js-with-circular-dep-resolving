async function main() {
	const {doStuff} = await import("./a")

	doStuff()
}

main()