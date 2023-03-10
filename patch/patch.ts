import * as Parcel from "@parcel/types"
import ParcelSourceMap from "@parcel/source-map"
import {buildDependencyGraph} from "./graph_builder"
import {ParcelDependenciesBanner} from "./parcel_dependencies_banner"

export class Patch {

	// assetId (as in asset) -> sourceAssetId (as in dependency)
	private roots: Set<string> = new Set()
	private rootDepsCode = ""
	private rootDepsList: Parcel.Dependency[] = []

	constructor(private readonly bundle: Parcel.Bundle, private readonly bundleGraph: Parcel.BundleGraph<Parcel.Bundle>) {
	}

	prepareForAssetBuilding(codeMap: ReadonlyMap<string, {readonly code: string}>): void {
		const {graph, roots, allDependencies} = buildDependencyGraph(this.bundle, this.bundleGraph)
		this.roots = new Set(roots)

		// I feel like taking just first asset here can bite in some cases
		// but I'm not sure in which cases in particular
		// maybe JS bundles always have exactly one root...?
		const rootSourceAssetId = roots.map(assetId => {
			const asset = this.bundleGraph.getAssetById(assetId)
			const deps = this.bundleGraph.getDependencies(asset)
			return deps[0]?.sourceAssetId
		}).find(x => !!x)

		const bannedDependencies = new ParcelDependenciesBanner(graph, this.bundleGraph, codeMap)
			.getBannedDependencies()

		for(const [sourceId, depIds] of bannedDependencies){
			for(const depId of depIds){
				graph.removeDependency(sourceId, depId)
			}
		}
		const properAssetOrder = graph.getSequenceAssumeNoCycles()

		const depImports: string[] = []
		const rootDepList: Parcel.Dependency[] = []
		for(const assetId of properAssetOrder){
			if(this.roots.has(assetId)){
				continue
			}
			const asset = this.bundleGraph.getAssetById(assetId)
			depImports.push(`import "${this.formSpecialDependencyReplacementByAsset(asset)}";`)
			const deps = allDependencies.get(assetId)

			const rootDep = deps?.find(dep => dep.sourceAssetId === rootSourceAssetId)

			const dep = rootDep ?? deps?.[0]
			if(!dep){
				throw new Error(`Nothing depends on asset ${asset.filePath}, but it's still in bundle graph somehow...?`)
			}
			rootDepList.push(dep)
		}
		this.rootDepsCode = depImports.join("\n")
		this.rootDepsList = rootDepList
	}

	updateAssetCode(asset: Parcel.Asset, code: string, map: ParcelSourceMap | null | undefined): string {
		if(this.roots.has(asset.id)){
			code = this.rootDepsCode + "\n" + code
			if(map){
				map.offsetLines(1, this.rootDepsList.length + 1)
			}
		}

		return code
	}

	getAssetDependencies(asset: Parcel.Asset): Parcel.Dependency[] {
		if(!this.roots.has(asset.id)){
			return this.bundleGraph.getDependencies(asset)
		}

		return this.rootDepsList
	}

	shouldVisitAssetDependencyImports(asset: Parcel.Asset): boolean {
		return this.roots.has(asset.id)
	}

	// technically we could use default format for dependency import specifiers
	// I just don't want to, because it will require copypasting logic about it here
	// though I still kinda have to rely on parcel's format...?
	formSpecialDependencyReplacement(dependency: Parcel.Dependency): string | null {
		const resolved = this.bundleGraph.getResolvedAsset(dependency, this.bundle)
		if(!resolved){
			return null
		}
		return this.formSpecialDependencyReplacementByAsset(resolved)
	}

	private formSpecialDependencyReplacementByAsset(asset: Parcel.Asset): string {
		return `${asset.id}:THIS_IS_PATCHED_DEPENDENCY:esm`
	}


}