/** This function wraps module definition function into proxy
 * That way module definition is only called when any value from this module is requested
 */
(() => {
	var globalObject
		= typeof globalThis !== "undefined"
			? globalThis
			: typeof self !== "undefined"
				? self
				: typeof window !== "undefined"
					? window
					: typeof global !== "undefined"
						? global
						: {}

	function proxyBase() {
		throw new Error("This function is never meant to be called directly")
	}

	if(globalObject.wrapParcelDevelopmentModuleDefinitionIntoProxyWithCallback){
		return
	}

	const proxyCheckSymbol = Symbol("parcel-patch-proxy-check")
	const proxyProductSymbol = Symbol("parcel-patch-proxy-product") // oh wow, 4 P's in a row

	globalObject.wrapParcelDevelopmentModuleDefinitionIntoProxyWithCallback = (module, callback) => {
		let callbackWasExecuted = false

		function getProduct() {
			if(!callbackWasExecuted){
				callbackWasExecuted = true
				callback()
			}
			return module.exports
		}

		return new Proxy(proxyBase, {
			getPrototypeOf: () => Object.getPrototypeOf(getProduct()),
			setPrototypeOf: (_, newProto) => (Object.setPrototypeOf(getProduct(), newProto), true),
			isExtensible: () => Reflect.isExtensible(getProduct()),
			preventExtensions: () => Reflect.preventExtensions(getProduct()),
			getOwnPropertyDescriptor: (_, prop) => Reflect.getOwnPropertyDescriptor(getProduct(), prop),
			defineProperty: (_, prop, descriptor) => Object.defineProperty(getProduct(), prop, descriptor),
			has: (_, prop) => prop in (getProduct()),
			get: (_, prop) => {
				if(prop === proxyProductSymbol){
					return getProduct()
				} else if(prop === proxyCheckSymbol){
					return true
				} else {
					return getProduct()[prop]
				}
			},
			set: (_, prop, value) => ((getProduct()[prop] = value), true),
			deleteProperty: (_, prop) => Object.deleteProperty(getProduct(), prop),
			ownKeys: () => Object.ownKeys(getProduct()),
			apply: (_, self, args) => getProduct().apply(self, args),
			construct: (_, args) => new(getProduct())(...args)
		})
	}

	// this is required to properly await asyncronously required modules
	// thing is, await just does something like Promise.prototype.then.apply(myImport)
	// when myImport is a proxy which didn't get a chance to resolve into product
	const origThen = Promise.prototype.then
	Promise.prototype.then = function(...args) {
		const proxyProduct = !this[proxyCheckSymbol] ? null : this[proxyProductSymbol]
		return origThen.apply(proxyProduct ?? this, args)
	}

})()