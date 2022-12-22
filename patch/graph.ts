interface GraphNode<ID> {
	id: ID
	in: Set<ID>
	out: Set<ID>
}

function isThisNodeTerminal<ID>(node: GraphNode<ID>): boolean {
	return node.in.size === 0 || node.out.size === 0
}

function cloneNode<ID>(node: GraphNode<ID>): GraphNode<ID> {
	return {
		id: node.id,
		in: new Set(node.in),
		out: new Set(node.out)
	}
}

/** Data structure: oriented graph
 * @param ID type of node */
export class Graph<ID> {

	private nodeById: Map<ID, GraphNode<ID>> = new Map()

	clone(): Graph<ID> {
		const result = new Graph<ID>()
		result.nodeById = new Map([...this.nodeById].map(([id, node]) => [id, cloneNode(node)]))
		return result
	}

	/** Assuming that there's no cycles in the graph, lay out nodes in a sequence
	 * that doesn't violate any dependency rules */
	getSequenceAssumeNoCycles(): ID[] {
		const nodeToPriority = new Map<ID, number>()

		const visit = (node: ID): number => {
			let priority = 0

			const deps = this.getNode(node).out
			for(const dep of deps){
				let depPriority = nodeToPriority.get(dep)
				if(depPriority === undefined){
					depPriority = visit(dep)
				}
				priority = Math.max(priority, depPriority)
			}

			priority += 1
			nodeToPriority.set(node, priority)
			return priority
		}

		const allNodeIds: ID[] = [...this.nodeById.keys()]
		for(const id of allNodeIds){
			if(!nodeToPriority.has(id)){
				visit(id)
			}
		}

		// least priority first; then in alphabetic order
		return allNodeIds.sort((a, b) => nodeToPriority.get(a)! - nodeToPriority.get(b)! || (a > b ? 1 : -1))
	}

	private getNode(id: ID): GraphNode<ID> {
		const node = this.nodeById.get(id)
		if(!node){
			throw new Error("No node with id " + id)
		}
		return node
	}

	get size(): number {
		return this.nodeById.size
	}

	has(id: ID): boolean {
		return this.nodeById.has(id)
	}

	addNode(id: ID): void {
		this.nodeById.set(id, {id, in: new Set(), out: new Set()})
	}

	addDependency(from: ID, to: ID): void {
		this.getNode(from).out.add(to)
		this.getNode(to).in.add(from)
	}

	removeNode(id: ID, node = this.getNode(id)): void {
		this.nodeById.delete(id)
		node.out.forEach(outId => {
			const node = this.nodeById.get(outId)
			if(node){
				node.in.delete(id)
			}
		})
		node.in.forEach(inId => {
			const node = this.nodeById.get(inId)
			if(node){
				node.out.delete(id)
			}
		})
	}

	removeDependency(from: ID, to: ID): void {
		this.getNode(from).out.delete(to)
		this.getNode(to).in.delete(from)
	}

	removeDependencyAndRecursivelyRemoveNonCyclicNodes(from: ID, to: ID): void {
		this.removeDependency(from, to)

		const fromNode = this.getNode(from)
		if(isThisNodeTerminal(fromNode)){
			this.removeNodeAndRecursivelyRemoveNonCyclicNodes(from, fromNode)
		}

		const toNode = this.nodeById.get(to)
		if(toNode && isThisNodeTerminal(toNode)){
			this.removeNodeAndRecursivelyRemoveNonCyclicNodes(to, toNode)
		}
	}

	removeNodeAndRecursivelyRemoveNonCyclicNodes(id: ID, node = this.getNode(id)): void {
		this.removeNode(id, node)
		node.out.forEach(outId => {
			const inNode = this.nodeById.get(outId)
			if(inNode && isThisNodeTerminal(inNode)){
				this.removeNodeAndRecursivelyRemoveNonCyclicNodes(outId, inNode)
			}
		})
		node.in.forEach(inId => {
			const outNode = this.nodeById.get(inId)
			if(outNode && isThisNodeTerminal(outNode)){
				this.removeNodeAndRecursivelyRemoveNonCyclicNodes(inId, outNode)
			}
		})
	}

	removeAllNonCyclicNodes(): void {
		const allKnownIds = [...this.nodeById.keys()]
		for(const id of allKnownIds){
			const node = this.nodeById.get(id)
			if(node && isThisNodeTerminal(node)){
				this.removeNodeAndRecursivelyRemoveNonCyclicNodes(id, node)
			}
		}
	}

	getNodesByOutgoingDepsCountAsc(): readonly ID[] {
		const allNodes = [...this.nodeById.values()]
		// id sorting just for consistency
		allNodes.sort((a, b) => a.out.size - b.out.size || (a.id > b.id ? 1 : -1))
		return allNodes.map(node => node.id)
	}

	getOutgoingDependencies(id: ID): ReadonlySet<ID> {
		return this.getNode(id).out
	}

	toStringWithResolver(resolver: (id: ID) => string): string {
		const result: string[] = []
		for(const [id, node] of this.nodeById){
			result.push(resolver(id) + " -> " + [...node.out].map(id => resolver(id)).join(", "))
			result.push(resolver(id) + " <- " + [...node.in].map(id => resolver(id)).join(", "))
		}
		return result.join("\n")
	}

}