import * as Parcel from "@parcel/types"
import {Graph} from "./graph"

export function buildDependencyGraph(bundle: Parcel.Bundle, bundleGraph: Parcel.BundleGraph<Parcel.Bundle>): {
	graph: Graph<string>
	allDependencies: ReadonlyMap<string, readonly Parcel.Dependency[]>
	roots: string[]
} {
	const graph = new Graph<string>()
	const roots: string[] = []
	const allDependencies = new Map<string, Parcel.Dependency[]>()

	const traverseAssetDependencies = (asset: Parcel.Asset) => {
		if(graph.has(asset.id)){
			return
		}
		graph.addNode(asset.id)

		for(const dependency of bundleGraph.getDependencies(asset)){
			const resolvedAsset = bundleGraph.getResolvedAsset(dependency, bundle)
			if(!resolvedAsset){
				continue
			}

			let depArr = allDependencies.get(resolvedAsset.id)
			if(!depArr){
				depArr = []
				allDependencies.set(resolvedAsset.id, depArr)
			}
			depArr.push(dependency)

			traverseAssetDependencies(resolvedAsset)
			graph.addDependency(asset.id, resolvedAsset.id)
		}
	}

	for(const entryPointAsset of bundle.getEntryAssets()){
		roots.push(entryPointAsset.id)
		traverseAssetDependencies(entryPointAsset)
	}

	return {graph, roots, allDependencies}
}