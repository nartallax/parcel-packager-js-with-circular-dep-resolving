import * as Parcel from "@parcel/types"
import {CodeExplorer} from "./code_explorer"
import {Graph} from "./graph"

export type BannedDepsMap = ReadonlyMap<string, ReadonlySet<string>>

/** A class that can select what dependencies need to be banned
 * Dependencies are banned to correctly resolve circular dependencies
 * (hopefully) */
export class ParcelDependenciesBanner {

	private readonly graph: Graph<string>
	private bannedDependencies: BannedDepsMap | null = null

	constructor(dependencyGraph: Graph<string>, private readonly bundleGraph: Parcel.BundleGraph<Parcel.Bundle>, private readonly codeMap: ReadonlyMap<string, {readonly code: string}>) {
		this.graph = dependencyGraph.clone()
	}

	getBannedDependencies(): BannedDepsMap {
		if(!this.bannedDependencies){
			this.bannedDependencies = this.selectBannedDependencies()
		}
		return this.bannedDependencies
	}

	/** Go over each symbol of graph's assets and record which asset that symbol came from */
	private buildSymbolSourceMap(): Map<string, string> {
		const result = new Map<string, string>()
		for(const assetId of this.graph.getNodesByOutgoingDepsCountAsc()){
			const asset = this.bundleGraph.getAssetById(assetId)
			for(const [, symbol] of asset.symbols){
				const symbolId = CodeExplorer.getSymbolId(symbol.local)
				result.set(symbolId, assetId)
			}
		}
		return result
	}

	/** Having graph of dependencies, choose dependencies that need to be cut in order to resolve circular dependencies
	 * @returns Map source asset id -> array of target asset ids */
	private selectBannedDependencies(): Map<string, Set<string>> {
		const bannedDependencies = new Map<string, Set<string>>()

		const recordBannedDependency = (from: string, to: string): void => {
			let set = bannedDependencies.get(from)
			if(!set){
				set = new Set()
				bannedDependencies.set(from, set)
			}
			set.add(to)
			// console.log(`Banned dependency of ${shortFilePath(this.bundleGraph.getAssetById(from).filePath)} on ${shortFilePath(this.bundleGraph.getAssetById(to).filePath)}`)
		}

		// console.log("Initial graph: " + this.graph.toStringWithResolver(id => shortFilePath(this.bundleGraph.getAssetById(id).filePath)))

		this.graph.removeAllNonCyclicNodes()

		// only build sources of assets that may interest us (i.e. after first cyclic node removal)
		// (just an optimization)
		const symbolSources = this.buildSymbolSourceMap()

		// this logic of selection of which dependencies we should cut is kinda random
		// problem is that with current implementation we don't have 100% way of knowing
		// if the dependency is NOT hot
		// so cutting every dependency is a risk
		// (and also this logic is a bit of performance hit, so maybe I'll change it in the future)
		whileHaveCycles: while(this.graph.size > 0){

			// console.log("Graph at step start: " + this.graph.toStringWithResolver(id => shortFilePath(this.bundleGraph.getAssetById(id).filePath)))

			for(const assetId of this.graph.getNodesByOutgoingDepsCountAsc()){
				const allDeps = new Set([...this.graph.getOutgoingDependencies(assetId)])
				const asset = this.bundleGraph.getAssetById(assetId)
				const hotDeps = this.getHotDependencies(asset, symbolSources)
				// console.log(`Hot deps of ${shortFilePath(asset.filePath)} are ${hotDeps.map(id => shortFilePath(this.bundleGraph.getAssetById(id).filePath))}`)
				for(const hotDep of hotDeps){
					allDeps.delete(hotDep)
				}
				if(allDeps.size > 0){
					const sorted = [...allDeps].sort((a, b) => a > b ? 1 : -1)
					const firstDep = sorted[0]!
					recordBannedDependency(assetId, firstDep)
					this.graph.removeDependencyAndRecursivelyRemoveNonCyclicNodes(assetId, firstDep)
					continue whileHaveCycles
				}
			}

			// realistically should never happen
			// but let's form a nice error message anyway
			const graphStr = this.graph.toStringWithResolver(id => this.bundleGraph.getAssetById(id).filePath)

			throw new Error("Dependency graph contains circular dependencies that cannot be resolved. Asset graph is\n" + graphStr + "\n. Note that there may be more than one cycle.")
		}

		return bannedDependencies
	}

	private hotDepCache = new Map<string, readonly string[]>()
	private getHotDependencies(asset: Parcel.Asset, symbolSources: ReadonlyMap<string, string>): readonly string[] {
		let deps = this.hotDepCache.get(asset.id)
		if(!deps){
			deps = this.findHotDependencies(asset, symbolSources)
			this.hotDepCache.set(asset.id, deps)
		}
		return deps
	}

	/** Explore code of the asset and determine which dependencies cannot be removed */
	private findHotDependencies(asset: Parcel.Asset, symbolSources: ReadonlyMap<string, string>): string[] {
		const code = this.codeMap.get(asset.id)?.code
		if(!code){
			throw new Error(`There is no code loaded for asset ${asset.filePath}`)
		}
		const usedSymbolIds = new CodeExplorer(code).getImmediatelyUsedImportedSymbolIds()
		// console.log(`Asset ${shortFilePath(asset.filePath)} has ${usedSymbolIds.length} immediately used symbols`)

		const result: string[] = []
		for(const symbolId of usedSymbolIds){
			const sourceAssetId = symbolSources.get(symbolId)
			if(!sourceAssetId){
				continue
			}
			result.push(sourceAssetId)
		}

		// console.log(`Asset ${asset.filePath} has ${result.length} hot dependencies`)

		return result
	}

}

function shortFilePath(path: string): string {
	return path.match(/[^/]+$/)![0]
}
void shortFilePath