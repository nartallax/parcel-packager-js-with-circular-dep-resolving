/** This function wraps module definition function into proxy
 * That way module definition is only called when any value from this module is requested
 */
const wrapParcelDevelopmentModuleDefinitionIntoProxyWithCallback = (base, callback) => {
	let callbackWasExecuted = false

	function getProduct() {
		if(!callbackWasExecuted){
			callbackWasExecuted = true
			callback()
		}
		return base
	}

	return new Proxy(base, {
		getPrototypeOf: () => Object.getPrototypeOf(getProduct()),
		setPrototypeOf: (_, newProto) => (Object.setPrototypeOf(getProduct(), newProto), true),
		isExtensible: () => Reflect.isExtensible(getProduct()),
		preventExtensions: () => Reflect.preventExtensions(getProduct()),
		getOwnPropertyDescriptor: (_, prop) => Reflect.getOwnPropertyDescriptor(getProduct(), prop),
		defineProperty: (_, prop, descriptor) => Object.defineProperty(getProduct(), prop, descriptor),
		has: (_, prop) => prop in (getProduct()),
		get: (_, prop) => getProduct()[prop],
		set: (_, prop, value) => ((getProduct()[prop] = value), true),
		deleteProperty: (_, prop) => Object.deleteProperty(getProduct(), prop),
		ownKeys: () => Object.ownKeys(getProduct()),
		apply: (_, self, args) => getProduct().apply(self, args),
		construct: (_, args) => new(getProduct())(...args)
	})
}