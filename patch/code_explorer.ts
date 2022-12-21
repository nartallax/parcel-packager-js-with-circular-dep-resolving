import * as Acorn from "acorn"

// better typing of Acorn.Node because original typings suck
// probably incomplete, if in doubt - check on https://astexplorer.net/
type AcornNode = Acorn.Node & ({
	type: "BinaryExpression" | "AssignmentExpression"
	left: AcornNode
	right: AcornNode
} | {
	type: "UnaryExpression"
	argument: AcornNode
} | {
	type: "Identifier"
	name: string
} | {
	type: "CallExpression" | "NewExpression"
	callee: AcornNode
	arguments?: AcornNode[]
} | {
	type: "UpdateExpression"
	argument: AcornNode
} | {
	type: "MemberExpression"
	object: AcornNode
	property: AcornNode
} | {
	type: "SequenceExpression"
	expressions: AcornNode[]
} | {
	type: "ClassDeclaration"
	superClass?: AcornNode
} | {
	type: "ExpressionStatement"
	expression: AcornNode
} | {
	type: "VariableDeclaration"
	declarations: (AcornNode & {type: "VariableDeclarator"})[]
} | {
	type: "VariableDeclarator"
	init?: AcornNode
} | {
	type: "Program" | "BlockStatement"
	body: AcornNode[]
} | {
	type: "FunctionExpression" | "ArrowFunctionExpression"
	id?: AcornNode
	body: AcornNode
} | {
	type: "FunctionDeclaration"
	id: AcornNode
	body: AcornNode
} | {
	type: "ForStatement"
	body: AcornNode
	init?: AcornNode
	test?: AcornNode
	update?: AcornNode
} | {
	type: "ForInStatement" | "ForOfStatement"
	body: AcornNode
	left: AcornNode
	right: AcornNode
} | {
	type: "IfStatement" | "ConditionalExpression"
	test: AcornNode
	consequent: AcornNode
	alternate?: AcornNode
} | {
	type: "DoWhileStatement" | "WhileStatement"
	body: AcornNode
	test: AcornNode
})

export class CodeExplorer {

	// this part is a little sketchy
	// here we rely on a particular look of symbols Parcel provides us with:
	//    $95930220612465e5$import$61a9e60a12024cdc$ef35774e6d314e91
	// importing module id |keyword|      ???      | id of symbol
	// problem is, we have no other way to know what symbol comes from what asset
	// only the last part (id of symbol) seems stable across assets
	static isImportedSymbol(str: string): boolean {
		return str.split("$")[2] === "import"
	}

	static getSymbolId(str: string): string {
		const arr = str.split("$")
		const symbolId = arr[arr.length - 1]
		if(!symbolId){
			throw new Error(`Imported symbol ${str} does not contain a symbol ID`)
		}
		return symbolId
	}

	constructor(private readonly code: string) {}

	/** Explore the code and return IDs of symbols that are immediately used in the declaration
 	* Not really reliable, only catches simple cases */
	getImmediatelyUsedImportedSymbolIds(): string[] {
		const file = Acorn.parse(this.code, {ecmaVersion: "latest", sourceType: "module"})

		const symbolsUsed = new Set<string>()
		const nodeStack: Acorn.Node[] = []

		function exploreNode(node: AcornNode | null | undefined) {
			if(!node){
				return
			}

			// console.log(new Array(nodeStack.length + 1).join("\t") + node.type)
			nodeStack.push(node)
			switch(node.type){
				case "BinaryExpression":
					exploreNode(node.left)
					exploreNode(node.right)
					break
				case "UnaryExpression":
					exploreNode(node.argument)
					break
				case "Identifier":
					if(CodeExplorer.isImportedSymbol(node.name)){
						symbolsUsed.add(CodeExplorer.getSymbolId(node.name))
					}
					break
				case "CallExpression":
				case "NewExpression":
					exploreNode(node.callee)
					if(node.arguments){
						node.arguments.forEach(argument => exploreNode(argument))
					}
					break
				case "UpdateExpression":
					exploreNode(node.argument)
					break
				case "AssignmentExpression":
					exploreNode(node.left)
					exploreNode(node.right)
					break
				case "MemberExpression":
					exploreNode(node.object)
					exploreNode(node.property)
					break
				case "SequenceExpression":
					node.expressions.forEach(expr => exploreNode(expr))
					break
				case "ClassDeclaration":
					if(node.superClass){
						exploreNode(node.superClass)
					}
					break
				case "ExpressionStatement":
					exploreNode(node.expression)
					break
				case "VariableDeclaration":
					node.declarations.forEach(decl => {
						if(decl.init){
							exploreNode(decl.init)
						}
					})
					break
				case "Program": // root node type btw
				case "BlockStatement":
					node.body.forEach(node => exploreNode(node))
					break
				case "FunctionExpression":
				case "ArrowFunctionExpression": {
					const parent = nodeStack[nodeStack.length - 2]
					// only explore functions if they're IIFE
					if(parent && parent.type === "CallExpression"){
						exploreNode(node.body)
					}
				} break
				case "ForStatement":
					exploreNode(node.body)
					exploreNode(node.init)
					exploreNode(node.test)
					exploreNode(node.update)
					break
				case "ForInStatement":
				case "ForOfStatement":
					exploreNode(node.body)
					exploreNode(node.left)
					exploreNode(node.right)
					break
				case "ConditionalExpression":
				case "IfStatement":
					exploreNode(node.test)
					exploreNode(node.consequent)
					exploreNode(node.alternate)
					break
				case "DoWhileStatement":
				case "WhileStatement":
					exploreNode(node.body)
					exploreNode(node.test)
					break
			}
			nodeStack.pop()
		}

		exploreNode(file as AcornNode)

		return [...symbolsUsed]
	}
}