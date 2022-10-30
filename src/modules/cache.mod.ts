/*!	Cache Library for SpecIF data.
	Dependencies: jQuery
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de 
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/
/*	Naming:
	- 'item' is any SpecIF object including classes and instances
	- 'model-element' or 'element' is a SpecIF resource or a SpecIF statement

	- readX: Get it from cache, if available, or otherwise from the server. Is always asynchronous.
	- loadX: Get it from the server and update the cache
	- cacheX: Add to cache
	- createX: Create a new instance of the specified data which is also cached.
	- updateX: Add non-existing instances and update existing instances. The cache is updated.
	
	Note:
	- No error handling - it is left to the calling layers
*/

enum RoleEnum {
	Administrator,
	Manager,
	Editor,
	Reader,
	Anybody
}
interface INodeWithPosition extends SpecifNode {
	parent?: string;
	predecessor?: string;
}
interface IFileWithContent extends SpecifFile {
	blob?: Blob;
	dataURL?: string;
}
class CCache {
	// Common Cache for all locally handled projects (SpecIF data-sets)
	cacheInstances: boolean;
	// @ts-ignore - see constructor for initializer:
	dataTypes: DataType[];
	// @ts-ignore - see constructor for initializer:
	propertyClasses: PropertyClass[];
	// @ts-ignore - see constructor for initializer:
	resourceClasses: ResourceClass[];
	// @ts-ignore - see constructor for initializer:
	statementClasses: StatementClass[];
	// @ts-ignore - see constructor for initializer:
	resources: Resource[];   		// list of resources as referenced by the hierarchies
	// @ts-ignore - see constructor for initializer:
	statements: Statement[];
	// @ts-ignore - see constructor for initializer:
	hierarchies: SpecifNode[];    	// listed specifications (aka hierarchies, outlines) of all loaded projects
	// @ts-ignore - see constructor for initializer:
	files: IFileWithContent[];
	constructor(opts:any) {
		this.cacheInstances = opts.cacheInstances;
		for (var le of standardTypes.listName.keys())
			// @ts-ignore - index is ok:
			this[standardTypes.listName.get(le)] = [];
	}
	length(ctg: string): number {
		// Return the number of cached items per category:
		// @ts-ignore - index is ok:
		return this[standardTypes.listName.get(ctg)].length;
	}
	has(ctg: string, req: Item[] | Item | string): boolean {
		if (req == 'all')
			// this is a stupid request, in fact.
			throw Error("Querying whether 'all' items are available is pretty useless.");

		if (Array.isArray(req)) {
			// @ts-ignore - index is ok:
			let L = this[standardTypes.listName.get(ctg)];
			for (var i = req.length - 1; i > -1;i--) {
				if (indexById(L, req.id || req) < 0) return false;
			};
			return true;
		}
		else
			// @ts-ignore - index is ok:
			return indexById(this[standardTypes.listName.get(ctg)],req)>-1;
	}
	put(ctg: string, item: Item[] | Item): number | boolean {
		if (!item || Array.isArray(item) && item.length < 1)
			return false;
		// If item is a list, all elements must have the same category.
		function cacheIfNewerE(L: Item[], e: Item): number {  // ( list, entry )
			// Add or update the item e in a list L, if created later:
			let n = typeof (e) == 'object' ? indexById(L, e.id) : L.indexOf(e);
			// add, if not yet listed:
			if (n < 0) {
				L.push(e);
				return L.length - 1;
			};
			// Update, if newer:
			if (L[n].changedAt && e.changedAt && new Date(L[n].changedAt) < new Date(e.changedAt))
				L[n] = e;
			return n;
		}
		function cacheIfNewerL(L: Item[], es: Item[]): boolean {  // ( list, entries )
			// add or update the items es in a list L:
			es.forEach((e) => { cacheIfNewerE(L, e) })
			// this operation cannot fail:
			return true;
		}
		let fn = Array.isArray(item) ? cacheIfNewerL : cacheIfNewerE;
		switch (ctg) {
			case 'hierarchy':
			case 'dataType':
			case 'propertyClass':
			case 'resourceClass':
			case 'statementClass':
				// @ts-ignore - indexing is perfectly ok
				return fn(this[standardTypes.listName.get(ctg)], item);
			case 'resource':
			case 'statement':
			case 'file':
				if (this.cacheInstances) {
					// @ts-ignore - indexing is perfectly ok
					return fn(this[standardTypes.listName.get(ctg)], item);
				};
				return true;
			case 'node':
				if (Array.isArray(item))
					throw Error("No list of nodes supported.");
//				console.debug('cache',ctg,item);
				return this.putNode(item as INodeWithPosition);
			default:
				throw Error("Invalid category '" + ctg + "'.");
		};
	}
	get(ctg: string, req: Item[] | Item | string): Item[] {
		// Read items from cache
		// - req can be single or a list,
		// - each element can be an object with attribute id or an id string
		// - original lists and items are delivered, so don't change them!
		if (!req)
			return [];

		// @ts-ignore - addressing is perfectly ok
		let itmL: Item[] = this[standardTypes.listName.get(ctg)],
			idx: number;

		if (req == 'all')
			return [].concat(itmL);	  // return all cached items in a new list

		if (Array.isArray(req)) {
			let allFound = true, i = 0, I = req.length;
			var rL: Item[] = [];
			while (allFound && i < I) {
				idx = indexById(itmL, req[i].id || req[i]);
				if (idx > -1) {
					rL.push(itmL[idx]);
					i++;
				}
				else
					allFound = false;
			};
			if (allFound)
				return rL;
			else
				return [];
		}
		else {
			// is a single item:
			idx = indexById(itmL, req.id || req);
			if (idx > -1)
				return [itmL[idx]]
			else
				return [];
		};
	}
	delete(ctg: string, item: Item): boolean | undefined {
		if (!item) return;
		let fn = Array.isArray(item) ? LIB.uncacheL : LIB.uncacheE;
		switch (ctg) {
			case 'hierarchy':
			case 'dataType':
			case 'propertyClass':
			case 'resourceClass':
			case 'statementClass':
				// @ts-ignore - addressing is perfectly ok
				return fn(this[standardTypes.listName.get(ctg)], item);
			case 'resource':
			case 'statement':
			case 'file':
				if (this.cacheInstances)
					// @ts-ignore - addressing is perfectly ok
					return fn(this[standardTypes.listName.get(ctg)], item);
				return true;
			case 'node':
				if (Array.isArray(item))
					item.forEach((el: SpecifNode) => { delNodes(this.hierarchies, el) })
				else
					delNodes(this.hierarchies, item as SpecifNode);
				return true;
			default:
				throw Error("Invalid category '" + ctg + "'.");
		};
		// all cases have a return statement ..

		function delNodes(L: SpecifNode[], el: SpecifNode): void {
			// Delete all nodes specified by the element;
			// if el is the node, 'id' will be used to identify it (obviously at most one node),
			// and if el is the referenced resource, 'resource' will be used to identify all referencing nodes.
			if (Array.isArray(L))
				for (var h = L.length - 1; h > -1; h--) {
					if (L[h].id == el.id || L[h].resource == el.resource) {
						L.splice(h, 1);
						break;	// can't delete any children
					};
					// step down, if the node hasn't been deleted:
					delNodes(L[h].nodes as SpecifNode[], el);
				};
		}
	}
	private putNode(e: INodeWithPosition): boolean {
		// add or replace a node in a hierarchy;
		// e may specify a predecessor or parent, the former prevails if both are specified
		// - if there is no predecessor or it isn't found, insert as first element
		// - if no parent is specified or the parent isn't found, insert at root level

		// 1. Delete the node, if it exists somewhere to prevent
		//    that there are multiple nodes with the same id;
		//    Thus, 'putNode' is in fact a 'move':
		this.delete('node', { id: e.id });

		// 2. Insert the node, if the predecessor exists somewhere:
		if (LIB.iterateNodes(
			this.hierarchies,
			// continue searching until found:
			(nd: SpecifNode) => { return nd.id != e.predecessor },
			// insert the node after the predecessor:
			(ndL: SpecifNode[]) => {
				let i = indexById(ndL as Item[], e.predecessor);
				if (i > -1) ndL.splice(i + 1, 0, e);
			}
		))
			return true;

		// 3. Insert the node, if the parent exists somewhere:
		if (LIB.iterateNodes(
			this.hierarchies,
			// continue searching until found:
			(nd: SpecifNode) => {
				if (nd.id == e['parent']) {
					if (!Array.isArray(nd.nodes)) nd.nodes = [];
					// we will not find a predecessor at this point any more,
					// so insert as first element of the children:
					nd.nodes.unshift(e);
					return false; // stop searching
				};
				return true;  // continue searching
			}
			// no list function
		))
			return true;

		// 4. insert the node as first root element, otherwise:
		this.hierarchies.unshift(e);
		return false;
	}
	clear(ctg?:string):void {
		if (ctg)
			this[standardTypes.listName.get(ctg)].length = 0
		else
			for (var le of standardTypes.listName.keys())
				this[standardTypes.listName.get(le)].length = 0;
    }
}
class CElement {
	category: string;
	listName: string;
	isEqual: Function;
	isCompatible: Function;
	substitute: Function;
	constructor(ctg: string, eqF: Function, compF: Function, subsF: Function) {
		this.category = ctg;
		this.listName = standardTypes.listName.get(ctg) as string;
		this.isEqual = eqF;
		this.isCompatible = compF;
		this.substitute = subsF;
	}
}
class CProject {
	// Applies the project data (SpecIF data-set) to the respective data sources
	// - Common Cache (for all locally known projects)
	// - assigned Server(s)
	// @ts-ignore - initialized by this.setMeta()
	id: string;
	// @ts-ignore - initialized by this.setMeta()
	title: string;
	// @ts-ignore - initialized by this.setMeta()
	description?: string;
	// @ts-ignore - initialized by this.setMeta()
	generator?: string;
	// @ts-ignore - initialized by this.setMeta()
	generatorVersion?: string;
	// @ts-ignore - initialized by this.setMeta()
	createdAt?: string;
	// @ts-ignore - initialized by this.setMeta()
	createdBy?: string;
	hierarchies: SpecifNode[] = [];    	// reference the specifications (aka hierarchies, outlines) of the project.
	data: CCache;
/*	myRole = i18n.LblRoleProjectAdmin;
	cre;
	upd;
	del = app.title != i18n.LblReader;
	locked = app.title == i18n.LblReader; 
	exp: boolean = true;			// permission to export  */
	exporting: boolean = false;		// prevent concurrent exports
	abortFlag: boolean = false;
	types: CElement[];
	fileName: string = "";

	constructor(spData: SpecIF, cache: CCache) {
		this.setMeta(spData);
		this.data = cache;
		// remember the hierarchies associated with this projects - the cache holds all:
		for (var i = spData.hierarchies.length - 1; i > -1; i--) {
			this.hierarchies.unshift({ id: spData.hierarchies[i].id, revision: spData.hierarchies[i].revision});
		};
	//	this.exp = true;

		//	Create a table of types and relevant attributes:	
		this.types = [
			new CElement('dataType', this.equalDT.bind(this), this.compatibleDT.bind(this), this.substituteDT.bind(this)),
			new CElement('propertyClass', this.equalPC.bind(this), this.compatiblePC.bind(this), this.substitutePC.bind(this)),
			new CElement('resourceClass', this.equalRC.bind(this), this.compatibleRC.bind(this), this.substituteRC.bind(this)),
			new CElement('statementClass', this.equalSC.bind(this), this.compatibleSC.bind(this), this.substituteSC.bind(this))
		];
	};
	isLoaded(): boolean {
		return typeof (this.id) == 'string' && this.id.length > 0;
	};
	setMeta(spD: SpecIF): void {
		this.id = spD.id;
		this.title = spD.title;
		this.description = spD.description;
		this.generator = spD.generator;
		this.generatorVersion = spD.generatorVersion;
		this.createdAt = spD.createdAt;
		this.createdBy = spD.createdBy;
	/*	this.myRole = i18n.LblRoleProjectAdmin;
		this.cre = this.data.upd = this.data.del = app.title != i18n.LblReader;
		this.locked = app.title == i18n.LblReader; 
		this.exp = true; */
	};
	getMeta(): CSpecIF {
		var spD = new CSpecIF();
		spD.id = this.id;
		spD.title = this.title;
		spD.description = this.description;
		spD.generator = this.generator;
		spD.generatorVersion = this.generatorVersion;
		spD.createdAt = this.createdAt;
		spD.createdBy = this.createdBy;
		return spD;
	};
	create(newD: SpecIF, opts: any):Promise<void> {
		// create a project, if there is no project with the given id, or replace a project with the same id.
		// (The roles/permissions and the role assignment to users are preserved, when import via ReqIF-file is made)
		// If there is no newD.id, it will be generated by the server.
		// Use jQuery instead of ECMA Promises for the time being, because of progress notification.
		var cDO = $.Deferred(),
			self = this,  // make the class attributes and methods available within local function 'finalize'
			pend = 0;

		this.abortFlag = false;

	//	newD = new CSpecIF(newD); // transform to internal data structure
//		console.debug('app.cache.selectedProject.data.create',newD);

		new CSpecIF().set(newD,opts)
			.then(
				(nD) => {
					// Create the project
					// The project meta-data and each item are created as a separate document in a document database;
					// at the same time the cache is updated.
					cDO.notify(i18n.MsgLoadingTypes, 30);
					pend = standardTypes.iterateLists(
						(key, value) => {
							this.createContent(key, nD[value])
								.then( finalize, cDO.reject );
						}
					);
				},
				cDO.reject
			/*	(xhr) => {
				//	cDO.reject({ status: 995, statusText: i18n.lookup('MsgImportFailed', newD.title) })
				} */
			);
		return cDO;

		function finalize(): void {
			if (--pend < 1) {
				// must do these operations strictly sequentially:
				self.createFolderWithGlossary(opts)
					.then(
						() => {
							self.createFolderWithUnreferencedResources(opts)
								.then(
									() => {
										cDO.notify(i18n.MsgLoadingFiles, 100);
										self.hookStatements();
										self.deduplicate(opts);	// deduplicate equal items
										// ToDo: Update the server !

										cDO.resolve()
									},
									cDO.reject
								);
						},
						cDO.reject
					);
			}
		}
	}
	read(opts?: any): Promise<SpecIF> {
		// collect all items of this project from the cache containing elements of multiple projects
		// (.. so far only one project, so the selection-process is pretty simple ..)
		var pend = 0,
			spD = this.getMeta();

		return new Promise(
			(resolve, reject) => {
				pend = standardTypes.iterateLists(
					(ctg: string, listName:string) => {
						this.readContent(ctg, 'all')
						.then(
							(values) => {
								spD[listName] = values;
								if (--pend < 1) {
									spD.toExt(opts)
									.then(resolve, reject)
								}
							},
							reject
						);
					}
				);
			}
		);
    }
/*	update(newD: SpecIF, opts: any): Promise<void> {
		var uDO = $.Deferred();
		newD = new CSpecIF(newD); // transform to internal data structure
		uDO.resolve();
		return uDO;
	} */
	adopt(newD: SpecIF, opts?: any): Promise<void> {
		// First check whether BPMN collaboration and process have unique ids:
//		console.debug('adopt project',newD);

		var aDO = $.Deferred(),
			self = this,  // make the class attributes and methods available within local function 'finalize'
			dta = this.data,
			pend = 0;

		new CSpecIF().set(newD,opts)
			.then(

				// 1. Integrate the types:
				//    a) if different id, save new one and use it.
				//       (the case of different id and same content will be covered by deduplicate() at the end)
				//    b) if same id and same content, just use it (no action)
				//    c) if same id and different content, save with new id and update all references
				(nD) => {
//					console.debug('adopt #1',simpleClone(self.data),simpleClone(nD));
					this.types.forEach((ty) => {
						// @ts-ignore - dta is defined in all cases and the addressing using a string is allowed
						if (Array.isArray(nD[ty.listName])) {
							let itmL: any[] = [];
							// @ts-ignore - dta is defined in all cases and the addressing using a string is allowed
							nD[ty.listName].forEach((nT) => {
								// nT is a type/class in new data
								// types are compared by id:
								let idx = indexById(dta[ty.listName], nT.id);
								if (idx < 0) {
									// a) there is no item with the same id
									itmL.push(nT);
								}
								else {
									// there is an item with the same id.
									//	if( !ty.isEqual( self.data[ty.listName][idx], nT) ) {
									if (!ty.isCompatible(dta[ty.listName][idx], nT, { mode: "include" })) {
										// there is an item with the same id and different content.
										// c) create a new id and update all references:
										// Note: According to the SpecIF schema, dataTypes may have no additional XML-attribute
										// ToDo: In ReqIF an attribute named "Reqif.ForeignId" serves the same purpose as 'alterId':
										let alterId = nT.id;
										nT.id += '-' + simpleHash(new Date().toISOString());
										ty.substitute(nD, nT, { id: alterId });
										itmL.push(nT);
										console.info("When adopting a project" + (nD.id ? " with id " + nD.id : "") +
											", a class with same id and incompatible content has been encountered: " + alterId +
											"; it has been saved with a new identifier " + nT.id + ".");
									};
									// b) no action
								};
							});
							// @ts-ignore - nD[ty.listName] is a valid address
							console.info((nD[ty.listName].length - itmL.length) + " " + ty.listName + " adopted and " + itmL.length + " added.");
							pend++;
							this.createContent(ty.category, itmL)
								.then(finalize, aDO.reject);
						};
					});
					/*	ALTERNATIVE
					 *	// 1. Integrate the types:
						//    a) if same id and different content, save with new id and update all references
						//    b) if same id and same content, just use it (no action)
						//    c) if different id and same content, adopt existing class and update all references
						//    d) if different id and different content, save new one and use it.
						var aDO = $.Deferred(),
							self = this,  // make the class attributes and methods available within local function 'finalize'
							dta = this.data,
							pend = 0;
//						console.debug('adopt #1',simpleClone(self.data),simpleClone(nD));
						this.types.forEach((ty) => {
							// @ts-ignore - dta is defined in all cases and the addressing using a string is allowed
							if (Array.isArray(nD[ty.listName])) {
							};
						}); */
//						console.debug('#2',simpleClone(dta),simpleClone(nD));

					// 2. Integrate the instances:
					//    a) if different title or type, save new one and use it.
					//    b) if same title and type, just use it and update all references
					if (Array.isArray(nD.resources)) {
						let itmL: Resource[] = [];
						nD.resources.forEach((nR: Resource) => {
							// nR is a resource in the new data

							// Adopt resource with the same id, title and class right away:
							let eR: Resource = itemById(dta.resources, nR.id);  // resource in the existing data
							if (eR && this.equalR(eR, nR)) return;

							// Adopt resource, if it's class belongs to a collection of class-titles and is not excluded from deduplication.
							// The folders are excluded from consolidation, because it may happen that there are
							// multiple folders with the same name but different description in different locations of the hierarchy.
							if (CONFIG.modelElementClasses.concat(CONFIG.diagramClasses).indexOf(resClassTitleOf(nR, nD)) > -1
								&& CONFIG.excludedFromDeduplication.indexOf(valByTitle(nR, CONFIG.propClassType, nD)) < 0
							) {
								// Check for a resource with the same title:
								eR = itemByTitle(dta.resources, nR.title);  // resource in the existing data
								// If there is an instance with the same title ... and if the types match;
								// the class title reflects the role of it's instances ...
								// and is less restrictive than the class ID:
//								console.debug('~1',nR,eR?eR:'');
								if (eR
									&& CONFIG.excludedFromDeduplication.indexOf(valByTitle(eR, CONFIG.propClassType, dta)) < 0
									&& resClassTitleOf(nR, nD) == resClassTitleOf(eR, dta)
									//		&& valByTitle(nR,CONFIG.propClassType,nD)==valByTitle(eR,CONFIG.propClassType,dta)
								) {
//									console.debug('~2',eR,nR);
									// There is an item with the same title and type,
									// adopt it and update all references:
									this.substituteR(nD, eR, nR, { rescueProperties: true });

									// Memorize the replaced id, if not yet listed:
									if (!Array.isArray(eR.alternativeIds)) eR.alternativeIds = [];
									LIB.cacheE(eR.alternativeIds, {id:nR.id,revision:nR.revision,project:nD.id});

									return;
								}
							};

							// Execution gets here, unless a substitution has taken place;
							// thus add the new resource as separate instance:

							// Note that in theory, there shouldn't be any conflicting ids, but in reality there are;
							// for example it has been observed with BPMN/influx which is based on bpmn.io like cawemo.
							// ToDo: make it an option.

							// Check, whether the existing model has an element with the same id,
							// and since it does have a different title or different type (otherwise it would have been substituted above),
							// assign a new id to the new element:
							if (this.duplicateId(dta, nR.id)) {
								let newId = LIB.genID('R-');
								// first assign new ID to all references:
								this.substituteR(nD, { id: newId } as Resource, nR);
								// and then to the resource itself:
								nR.id = newId;
							};
//							console.debug('+ resource',nR);
							itmL.push(nR)
						});
						console.info((nD.resources.length - itmL.length) + " resources adopted and " + itmL.length + " added.");
						pend++;
						this.createContent('resource', itmL)
							.then(finalize, aDO.reject);
					};
//					console.debug('#3',simpleClone(dta),simpleClone(nD));

					// 3. Create the remaining items;
					// this.createContent('statement', nD.statements) could be called, 
					// but then the new elements would replace the existing ones.
					// In case of 'adopt' the existing shall prevail!
					if (Array.isArray(nD.statements)) {
						let itmL: Statement[] = [];
						nD.statements.forEach((nS: Statement) => {
							// nR is a resource in the new data

							// Adopt statement with the same id, title and class right away:
							let eS: Statement = itemById(dta.statements, nS.id);  // statement in the existing data
							if (eS && this.equalS(eS, nS)) return;
							// Else, create new element:
							itmL.push(nS);
						});
						console.info((nD.statements.length - itmL.length) + " statements adopted and " + itmL.length + " added.");
						pend++;
						this.createContent('statement', itmL)
							.then(finalize, aDO.reject);
					};
					pend++;
					this.createContent('hierarchy', nD.hierarchies)
						.then(finalize, aDO.reject);

					if (Array.isArray(nD.files)) {
						let itmL: any[] = [];
						nD.files.forEach((nF: any) => {
							// nR is a resource in the new data

							// Adopt equal file right away:
							let eF: any = itemById(dta.files, nF.id);  // file in the existing data
							if (eF && this.equalF(eF, nF)) return;
							// Else, create new element:
							itmL.push(nF);
						});
						console.info((nD.files.length - itmL.length) + " files adopted and " + itmL.length + " added.");
						pend++;
						this.createContent('file', itmL)
							.then(finalize, aDO.reject);
					};
				},
				aDO.reject
			);
		return aDO;

		function finalize(): void {
			if (--pend < 1) {
//				console.debug('#4',simpleClone(dta),simpleClone(nD));
				// 4. Finally some house-keeping:
				self.hookStatements();
				self.deduplicate(opts);	// deduplicate equal items
				// ToDo: Save changes from deduplication to the server.
//				console.debug('#5',simpleClone(dta),opts);
				self.createFolderWithResourcesByType(opts)
					.then(
						() => {
							self.createFolderWithGlossary(opts)
								.then(
									() => {
										self.createFolderWithUnreferencedResources(opts)
											.then(
												aDO.resolve,
												aDO.reject
											)
									},
									aDO.reject
								)
						},
						aDO.reject
					)
			};
		}
	}
	private hookStatements(): void {
		let dta = this.data;
//		console.debug('hookStatements',dta);
		// For all statements with a loose end, hook the resource
		// specified by title or by a property titled dcterms:identifier:
		dta.statements.forEach((st: Statement) => {
			// Check every statement;
			// it is assumed that only one end is loose:
			if (st.subjectToFind) {
				// Find the resource with a value of property titled CONFIG.propClassId:
				let s, sL = itemsByVisibleId(dta.resources, st.subjectToFind);
				if (sL.length > 0)
					s = sL[0];
				else
					// Find the resource with the given title:
					s = itemByTitle(dta.resources, st.subjectToFind);
//				console.debug('hookStatements subject',s);
				if (s) {
					st.subject = s.id;
					delete st.subjectToFind;
					return;
				};
			};
			if (st.objectToFind) {
				// Find the resource with a value of property titled CONFIG.propClassId:
				let o, oL = itemsByVisibleId(dta.resources, st.objectToFind);
				if (oL.length > 0)
					o = oL[0];
				else
					// Find the resource with the given title:
					o = itemByTitle(dta.resources, st.objectToFind);
//				console.debug('hookStatements object',o);
				if (o) {
					st.object = o.id;
					delete st.objectToFind;
					return;
				};
			};
		});
		return;

		function itemsByVisibleId(L, vId: string): Resource[] {
			// return a list with all elements in L having a property 
			// containing a visible id with value vId;
			// should only be one resulting element:
			return LIB.forAll(L, (r) => {
				if (visibleIdOf(r) == vId) return r;
			});
		}
	}
	private duplicateId(dta: any, id: string): boolean {
		// check whether there is an item with the same id in dta.
		// If so, return the item:
		if (dta.id == id) return true;
		for (var i in dta) {
			if (Array.isArray(dta[i])) {
				for (var j = dta[i].length - 1; j > -1; j--) {
					if (this.duplicateId(dta[i][j], id)) return true;
				};
			};
		};
		return false;
	}
	private deduplicate(opts?:any): void {
		// Uses the cache.
		// ToDo: update the server.
		if (!opts || !opts.deduplicate) return;

		let dta = this.data,
			r: number, n: number, rR: Resource, nR: Resource;
//		console.debug('deduplicate',simpleClone(dta));

		// 1. Deduplicate equal types having different ids;
		// the first of a equivalent pair in the list is considered the reference or original ... and stays,
		// whereas the second in a pair is removed.
		this.types.forEach((ty) => {
			let lst = dta[ty.listName];
			// @ts-ignore - dta is defined in all cases and the addressing using a string is allowed
			if (Array.isArray(lst))
				// skip last loop, as no duplicates can be found:
				// @ts-ignore - dta is defined in all cases and the addressing using a string is allowed
				for (n = lst.length - 1; n > 0; n--) {
					for (r = 0; r < n; r++) {
//						console.debug( '##', lst[r],lst[n],ty.isEqual(lst[r],lst[n]) );
						// Do it for all types:
						// @ts-ignore - this addressing is perfectly fine and the list names are defined.
						if (ty.isEqual(lst[r], lst[n])) {
							// Are equal, so substitute it's ids by the original item:
							// @ts-ignore - this addressing is perfectly fine and the list names are defined.
							ty.substitute(dta, lst[r], lst[n]);
							// @ts-ignore - this addressing with a string is perfectly supported
							console.info(ty.category + " with id=" + lst[n].id + " and title=" + lst[n].title + " has been removed because it is a duplicate of id=" + lst[r].id);
							// ... and remove the duplicate item:
							// @ts-ignore - this addressing is perfectly fine and the list names are defined.
							lst.splice(n, 1);
							// skip the remaining iterations of the inner loop:
							break;
						};
					};
				};
		});
//		console.debug( 'deduplicate 1', simpleClone(dta) );

		// 2. Remove duplicate resources:
		// skip last loop, as no duplicates can be found:
		for (n = dta.resources.length - 1; n > 0; n--) {
			for (r = 0; r < n; r++) {
				// Do it for all model-elements and diagrams,
				// but exclude process gateways and generated events for optional branches:
				nR = dta.resources[n];
				rR = dta.resources[r];
//				console.debug( 'duplicate resource ?', rR, nR );
				if (CONFIG.modelElementClasses.concat(CONFIG.diagramClasses).indexOf(resClassTitleOf(rR, dta)) > -1
					&& this.equalR(rR, nR)
					&& CONFIG.excludedFromDeduplication.indexOf(valByTitle(nR, CONFIG.propClassType, dta)) < 0
					&& CONFIG.excludedFromDeduplication.indexOf(valByTitle(rR, CONFIG.propClassType, dta)) < 0
				) {
					// Are equal, so remove the duplicate resource:
//					console.debug( 'duplicate resource', rR, nR, valByTitle( nR, CONFIG.propClassType, dta ) );
					this.substituteR(dta, rR, nR, { rescueProperties: true });
					console.info("Resource with id=" + nR.id + " and title=" + nR.title + " has been removed because it is a duplicate of id=" + rR.id);
					dta.resources.splice(n, 1);
					// skip the remaining iterations of the inner loop:
					break;
				};
			};
		};
//		console.debug( 'deduplicate 2', simpleClone(dta) );

		// 3. Remove duplicate statements:
		// skip last loop, as no duplicates can be found:
		for (n = dta.statements.length - 1; n > 0; n--) {
			for (r = 0; r < n; r++) {
				// Do it for all statements:
				if (this.equalS(dta.statements[r], dta.statements[n])) {
					// Are equal, so remove the duplicate statement:
					// @ts-ignore - the elements are defined
					console.info("Statement with id=" + dta.statements[n].id + " and class=" + dta.statements[n]['class'] + " has been removed because it is a duplicate of id=" + dta.statements[r].id);
					dta.statements.splice(n, 1);
					// skip the remaining iterations of the inner loop:
					break;
				};
			};
		};
//		console.debug( 'deduplicate 3', simpleClone(dta) );
	//	return undefined
	}
	private createFolderWithResourcesByType(opts: any): Promise<void> {
		// Collect all business processes, requirements etc according to 'resourcesToCollect':
		let dta = this.data;
		const resourcesToCollect = [
			{ type: CONFIG.resClassProcess, flag: "collectProcesses", folder: CONFIG.resClassProcesses, folderNamePrefix: "FolderProcesses-" }
		];
		var r: Instance = itemById(dta.resources, dta.hierarchies[0].resource),
			rC: ResourceClass = itemById(dta.resourceClasses, r['class']),
			prp: Property = itemByTitle(r.properties, CONFIG.propClassType),
			// the type of the hierarchy root can be specified by a property titled CONFIG.propClassType
			// or by the title of the resourceClass:
			singleHierarchyRoot = dta.hierarchies.length == 1
				&& (prp && CONFIG.hierarchyRoots.indexOf(prp.value) > -1
					|| rC && CONFIG.hierarchyRoots.indexOf(rC.title) > -1);
		return new Promise(
			(resolve, reject) => {
				if (typeof (opts) != 'object') {
					resolve();
					return;
				};
				let apx = simpleHash(this.id),
					tim = new Date().toISOString();

				function resDoesNotExist(rL: any[], res: Resource): boolean {
					for (var i = rL.length - 1; i > -1; i--)
						if (rL[i].r.id == res.id) return false;
					return true;
				}

				resourcesToCollect.forEach(
					(r2c) => {
//						console.debug('rc2c',r2c,opts);
						if (!opts[r2c.flag]) { resolve(); return; };
						// Assuming that the folder objects for the respective folder are available

						// 1 Find all resp. folders (e.g. process folder):
						let delL: SpecifNode[] = [],
							creL: any[] = [],
							res: Resource,
							pV;
//						console.debug('createFolderWithResourcesByType',dta.hierarchies,opts);
						LIB.iterateNodes(
							dta.get("hierarchy", "all"),
							(nd: SpecifNode) => {
								// get the referenced resource:
								res = dta.get("resource", nd.resource)[0];
								// find the property defining the type:
								pV = valByTitle(res, CONFIG.propClassType, dta);
								// collect all nodes to delete, there should be only one:
								if (pV == r2c.folder) {
									delL.push(nd);
								};
								// collect all elements for the new folder,
								// but avoid duplicate entries:
								if (pV == r2c.type && resDoesNotExist(creL, res)) {
									creL.push({ n: nd, r: res });
								};
								return true;  // continue always to the end
							}
						);
//						console.debug('createFolderWithResourcesByType',delL,creL);

						// 2. Delete any existing folders:
						//    (Alternative: Keep folder and delete only the children.)
						this.deleteContent('node', delL)
							.then(
								() => {
									// Create a folder with all respective objects (e.g. diagrams):
									if (creL.length > 0) {
										// 3. Sort the list alphabetically by the resources' title:
										LIB.sortBy(creL, (el: any) => { return el.r.title });

										// 4. Create a new combined folder:
										let newD = {
											id: 'Create ' + r2c.type + ' ' + new Date().toISOString(),
											$schema: 'https://specif.de/v1.0/schema.json',
											dataTypes: [
												standardTypes.get('dataType', "DT-ShortString"),
												standardTypes.get('dataType', "DT-Text")
											],
											propertyClasses: [
												standardTypes.get('propertyClass', "PC-Name"),
												standardTypes.get('propertyClass', "PC-Description"),
												standardTypes.get('propertyClass', "PC-Type")
											],
											resourceClasses: [
												standardTypes.get('resourceClass', "RC-Folder")
											],
											resources: Folder(r2c.folderNamePrefix + apx, CONFIG.resClassProcesses),
											hierarchies: []
										};
										// use the update function to eliminate duplicate types:
										this.adopt(newD, {noCheck:true})
											.done(() => {
												// Finally create the node referencing the folder to create:
												let nd: INodeWithPosition = {
													id: "H" + r2c.folderNamePrefix + apx,
													resource: r2c.folderNamePrefix + apx,
													// re-use the nodes with their references to the resources:
													nodes: LIB.forAll(creL, (pr) => { return pr.n; }),
													changedAt: tim
												};
												// Insert the hierarchy node as first element of a hierarchy root 
												// - if it is present and
												// - if there is only one hierarchy root
												// or as first element at root level, otherwise:
												if (singleHierarchyRoot)
													nd.parent = dta.hierarchies[0].id;
												this.createContent('node', nd)
													.then(resolve, reject);
											})
											.fail(reject);
									}
									else {
										resolve();
									};
								},
								reject
							);
					}
				);
				return;

				function Folder(fId: string, ti: string): Resource[] {
					var fL: Resource[] = [{
						id: fId,
						class: "RC-Folder",
						title: ti,
						properties: [{
							class: "PC-Type",
							value: CONFIG.resClassProcesses
						}],
						changedAt: tim
					}];
					return fL;
				}
			}
		)
	};
	private createFolderWithUnreferencedResources(opts: any): Promise<void> {
		// Create a folder with a flat list of resources which are not otherwise listed in a hierarchy.
		let dta = this.data;
		return new Promise(
			(resolve, reject) => {
				if (typeof (opts) != 'object' || !opts.addUnreferencedResources) { resolve(); return; };

				let delL: SpecifNode[] = [],
					resL = dta.get('resource', 'all') as Resource[],
				//	pV: string,
					idx: number,
					apx = simpleHash(this.id),
					tim = new Date().toISOString(),

					// the hierarchies without the folder listing the unreferenced resources:
					ndL = dta.get("hierarchy", "all").filter(
						(nd: SpecifNode) => {
							// a. get the referenced resource:
						/*	res = dta.get("resource", nd.resource)[0];
							// Find all respective folders:
							pV = valByTitle(res, CONFIG.propClassType, dta); 
							return (pV != "SpecIF:UnreferencedResources")  */
							idx = indexById(resL, nd.resource);
							if (idx > -1) {
							//	pV = valByTitle(resL[idx], CONFIG.propClassType, dta);
							//	if (pV == "SpecIF:UnreferencedResources") {
								if (resL[idx].title == "SpecIF:UnreferencedResources") {
									delL.push(nd);
									resL.splice(idx, 1);
									return false
								};
								return true
							};
							throw Error('Node '+nd.id+' references a resource '+nd.resource+' which is not found.');
						}
					);

				LIB.iterateNodes(
					ndL,
					(nd: SpecifNode) => {
						// Delete the resource, as it is referenced:
						idx = indexById(resL, nd.resource);
						if (idx > -1)
							resL.splice(idx, 1);
						return true  // continue always to the end
					}
				);

				// 1.2 Delete now:
//				console.debug('createFolderWithGlossary',delL,resL);
				this.deleteContent('node', delL)
					.then(
						() => {
							if (resL.length > 0) {
								let newD = {
									id: 'Create FolderWithUnreferencedResources ' + new Date().toISOString(),
									$schema: 'https://specif.de/v1.0/schema.json',
									dataTypes: [
										standardTypes.get('dataType', "DT-ShortString"),
										standardTypes.get('dataType', "DT-Text")
									],
									propertyClasses: [
										standardTypes.get('propertyClass', "PC-Name"),
										standardTypes.get('propertyClass', "PC-Description"),
										standardTypes.get('propertyClass', "PC-Type")
									],
									resourceClasses: [
										standardTypes.get('resourceClass', "RC-Folder")
									],
									resources: Folder(),
									hierarchies: NodeList(resL)
								};
//								console.debug('glossary',newD);
								// use the update function to eliminate duplicate types;
								// 'opts.addGlossary' must not be true to avoid an infinite loop:
								this.adopt(newD, { noCheck: true })
									.done(resolve)
									.fail(reject);
							}
							else
								resolve();
						}
					)
				return;

				function Folder(): Resource[] {
					// Create the resources for folder and subfolders of the glossary:
					var fL: Resource[] = [{
						id: "FolderUnreferencedResources-" + apx,
						class: "RC-Folder",
						title: "SpecIF:UnreferencedResources",
						properties: [{
							class: "PC-Type",
							value: "SpecIF:UnreferencedResources"
						}],
						changedAt: tim
					}];
					return fL;
				}
				function NodeList(resources: Resource[]): SpecifNode[] {
					// Add the folder:
					let gl: SpecifNode = {
						id: "H-FolderUnreferencedResources-" + apx,
						resource: "FolderUnreferencedResources-" + apx,
						nodes: resources.map((r) => { return { id: 'N-' + r.id, resource: r.id } }),
						changedAt: tim
					};
//					console.debug('##', resources,gl);
					return [gl];
				}
			}
		)
	};
	private createFolderWithGlossary(opts: any): Promise<void> {
//		console.debug('createFolderWithGlossary');
		let dta = this.data;
		return new Promise(
			(resolve, reject) => {
				if (typeof (opts) != 'object' || !opts.addGlossary) { resolve(); return; };

				// 1. Delete any existing glossaries
				// 1.1 Find all Glossary folders:
				let delL: SpecifNode[] = [],
					diagramL: Resource[] = [],
					res: Resource,
					pV: string,
					hasGlossaryItems = false,
					apx = simpleHash(this.id),
					tim = new Date().toISOString();
//				console.debug('createFolderWithGlossary',this.hierarchies);
				LIB.iterateNodes(
					dta.get("hierarchy","all"),
					(nd: SpecifNode): boolean => {
						// get the referenced resource:
						res = dta.get("resource", nd.resource)[0];
						// check, whether it is a glossary:
						pV = valByTitle(res, CONFIG.propClassType, dta);
						// collect all items to delete, there should be only one:
						if (pV == CONFIG.resClassGlossary) {
							delL.push(nd)
						};
						// collect all diagrams which are referenced in the hierarchy
						// for inclusion in the new folders:
						if (isDiagram(res)) {
							diagramL.push(res)
						};
						return true  // continue always to the end
					}
				);
				// 1.2 Delete now:
//				console.debug('createFolderWithGlossary',delL,diagramL);
				this.deleteContent('node', delL)
					.then(
						() => {
							// 2. Create a new combined glossary:
							if (diagramL.length > 0) {
								let newD = {
									id: 'Create Glossary ' + new Date().toISOString(),
									$schema: 'https://specif.de/v1.0/schema.json',
									dataTypes: [
										standardTypes.get('dataType', "DT-ShortString"),
										standardTypes.get('dataType', "DT-Text")
									],
									propertyClasses: [
										standardTypes.get('propertyClass', "PC-Name"),
										standardTypes.get('propertyClass', "PC-Description"),
										standardTypes.get('propertyClass', "PC-Type")
									],
									resourceClasses: [
										standardTypes.get('resourceClass', "RC-Folder")
									],
									resources: Folders(),
									hierarchies: NodeList(dta.get('resource', 'all'))
								};
//								console.debug('glossary',newD);
								// use the update function to eliminate duplicate types;
								// 'opts.addGlossary' must not be true to avoid an infinite loop:
								if (hasGlossaryItems)
									this.adopt(newD, { noCheck: true })
										.done(resolve)
										.fail(reject)
								else
									resolve();
							}
							else {
								resolve();
							}
						},
						reject
					);
				return;

				function isDiagram(r: Resource): boolean {
					// a resource is a diagram, if it's type has a title 'SpecIF:Diagram':
					// .. or if it has a property dcterms:type with value 'SpecIF:Diagram':
					// .. or if it has at least one statement with title 'SpecIF:shows':
					return resClassTitleOf(r, dta) == CONFIG.resClassDiagram
						|| valByTitle(r, CONFIG.propClassType, dta) == CONFIG.resClassDiagram
						|| dta.get("statement","all").filter(
							(sta) => {
								return staClassTitleOf(sta) == CONFIG.staClassShows && sta.subject == r.id
							}
						).length > 0;
				}
			/*	function extractByType(fn) {
						var L=[], el;
						LIB.iterateNodes( 
							self.hierarchies,
							(nd)=>{
								el = fn(nd);
								if( el ) { Array.isArray(el)? L.concat(el) : L.push( el ) };
								return true  // continue always to the end
							}
						);
						return L;
					}
					function extractDiagrams() {
						return extractByType(
							(nd)=>{
								// get the referenced resource:
								var res = itemById( self.resources, nd.resource );
								if( isDiagram( res ) ) return res;
							}
						);
					} */
				function Folders(): Resource[] {
					// Create the resources for folder and subfolders of the glossary:
					var fL: Resource[] = [{
						id: "FolderGlossary-" + apx,
						class: "RC-Folder",
						title: CONFIG.resClassGlossary,
						properties: [{
							class: "PC-Type",
							value: CONFIG.resClassGlossary
						}],
						changedAt: tim
					}];
					// Create a folder resource for every model-element type:
					CONFIG.modelElementClasses.forEach((mEl: string) => {
						let desc: string;
						// ToDo: terrible style - we lose the advantage of the class list here ...
						switch (mEl) {
							case "FMC:Actor":
								desc = i18n.lookup("FMC:ActorDescription");
								break;
							case "FMC:State":
								desc = i18n.lookup("FMC:StateDescription");
								break;
							case "FMC:Event":
								desc = i18n.lookup("FMC:EventDescription");
								break;
							case "SpecIF:Collection":
								desc = i18n.lookup("SpecIF:CollectionDescription");
						};
						fL.push({
							id: "Folder-" + mEl.jsIdOf() + "-" + apx,
							class: "RC-Folder",
							title: mEl + 's',  // just adding the 's' is an ugly quickfix ... that works for now.
							properties: desc ? [{
								class: "PC-Description",
								value: desc
							}] : [],
							changedAt: tim
						});
					});
					return fL;
				}
				function NodeList(resources: Resource[]): SpecifNode[] {
					// a. Add the folders:
					let gl: SpecifNode = {
						id: "H-FolderGlossary-" + apx,
						resource: "FolderGlossary-" + apx,
						nodes: [],
						changedAt: tim
					};
					// Create a hierarchy node for each folder per model-element type
					CONFIG.modelElementClasses.forEach(function (mEl: string) {
						gl.nodes.push({
							id: "N-Folder-" + mEl.jsIdOf() + "-" + apx,
							resource: "Folder-" + mEl.jsIdOf() + "-" + apx,
							nodes: [],
							changedAt: tim
						});
					});
					// Create a list tL of collections per model-element type;
					// assuming that type adoption/deduplication is not always successful
					// and that there may be multiple resourceClasses per model-element type:
					let idx: number,
						tL = LIB.forAll(CONFIG.modelElementClasses, () => { return [] });
					// Each collection carries the ids of resourceClasses for the given model-element type:
					dta.get("resourceClass","all").forEach(
						(rC: ResourceClass) => {
							idx = CONFIG.modelElementClasses.indexOf(rC.title);
							if (idx > -1) tL[idx].push(rC.id);
						}
					);
//					console.debug('gl tL',gl,tL);

					// b. list all statements typed SpecIF:shows of diagrams found in the hierarchy:
					let staL = dta.get("statement", "all").filter(
						(s) => { return staClassTitleOf(s) == CONFIG.staClassShows && indexById(diagramL, s.subject) > -1; }
					);
//					console.debug('gl tL dL',gl,tL,staL);

					// c. Add model-elements by class to the respective folders.
					// In case of model-elements the resource class is distinctive;
					// the title of the resource class indicates the model-element type.
					// List only resources which are shown on a referenced diagram:
					let resL = resources.filter((r) => { return indexBy(staL, 'object', r.id) > -1 });
					// in alphanumeric order:
					LIB.sortByTitle(resL);
					// ToDo: consider to sort by the title property via elementTitleOf()

					// Categorize resources:
					resL.forEach(
						(r: Resource): void => {
							// ... using the collections per fundamental model-element type:
							for (idx = tL.length - 1; idx > -1; idx--) {
								if (tL[idx].indexOf(r['class']) > -1) break;
							};
							if (idx > -1) {
								hasGlossaryItems = true;
								gl.nodes[idx].nodes.push({
									// Create new hierarchy node with reference to the resource:
									// ID should be the same when the glossary generated multiple times,
									// but must be different from a potential reference somewhere else.
									id: 'N-' + simpleHash(r.id + '-gen'),
									resource: r.id,
									changedAt: tim
								});
							};
						}
					);
					return [gl];
				}
			}
		)
	}
	createResource(rC: ResourceClass): Promise<Resource> {
		// Create an empty form (resource instance) for the resource class rC:
		// see https://codeburst.io/a-simple-guide-to-es6-promises-d71bacd2e13a
		// and https://javascript.info/promise-chaining
		return new Promise(
			(resolve, reject) => {
				// Get the class's permissions. So far, it's property permissions are not loaded ...
				var res: Resource;

				this.readContent('resourceClass', rC, { reload: true })
					.then(
						(rCL: ResourceClass[]) => {
//							console.debug('#1',rC);
							// return an empty resource instance of the given type:
							res = {
								id: LIB.genID('R-'),
								class: rCL[0].id,
								title: '',
								permissions: rCL[0].permissions || { cre: true, rea: true, upd: true, del: true },
								properties: []
							};
							return this.readContent('propertyClass', rC.propertyClasses, { reload: true })
						}
					)
					.then(
						(pCL: PropertyClass[]) => {
//							console.debug('#2',pCL);
							res.properties = LIB.forAll(pCL, createProp);
							resolve(res)
						}
					)
					.catch(reject);
			}
		);
	}
	createContent(ctg: string, item: Item): Promise<Item> {
		// item can be a js-object or a list of js-objects
		// ctg is a member of [dataType, resourceClass, statementClass, propertyClass, resource, statement, hierarchy]
		// ...  not all of them may be implemented, so far.
		// cache the value before sending it to the server, as the result is not received after sending (except for 'resource' and 'statement')
		return new Promise(
			(resolve) => {
//				console.debug('createContent', ctg, item );
			/*	switch( ctg ) {
				//	case 'resource':
				//	case 'statement':
				//	case 'hierarchy':
				//	case 'node':
						// no break
					default:
						// if current user can create an item, he has the other permissions, as well:
				//		addPermissions( item );
				//		item.createdAt = new Date().toISOString();
				//		item.createdBy = item.changedBy; */
						this.data.put(ctg, item);
			//	};
				resolve(item);
			}
		);
	}
	readContent(ctg: string, item: Item[] | Item | string, opts?: any): Promise<Item[]> {
		// ctg is a member of [dataType, resourceClass, statementClass, resource, statement, hierarchy]
		if (!opts) opts = { reload: false, timelag: 10 };

		// override 'reload' as long as there is no server and we know that the resource is found in the cache:
		opts.reload = false;

		return new Promise(
			(resolve, reject) => {
				if (opts.reload) {
					// try to get the items from the server, but meanwhile:
					reject({ status: 745, statusText: "No server available" })
				}
				else {
					// return the cached object asynchronously:
					// delay the answer a little, so that the caller can properly process a batch:
					setTimeout(() => {
					/*	// ToDo:
						if (ctg == "hierarchy" && item == "all")
							// Return only the hierarchies of this project:
							item = this.hierarchies;  */
						resolve(this.data.get(ctg, item));
					}, opts.timelag);
				};
			}
		);
	}
	updateContent (ctg: string, item: Item[] | Item): Promise<void> {
		// ctg is a member of [resource, statement, hierarchy], 'null' is returned in all other cases.
		function updateCh(itm: Item): void {
			itm.changedAt = new Date().toISOString();
			itm.changedBy = app.me.userName;
		}

		return new Promise(
			(resolve) => {
				switch (ctg) {
					case 'node':
						throw Error("Nodes can only be created or deleted");
					//	case 'resource':
					//	case 'statement':
					//	case 'hierarchy':
					// no break
					default:
//						console.debug('updateContent - cache', ctg );
						if (Array.isArray(item))
							item.forEach(updateCh)
						else
							updateCh(item);
						this.data.put(ctg, item)
				};
				resolve();
			}
		);
	}
	deleteContent(ctg: string, item: Item): Promise<void> {
		// ctg is a member of [dataType, resourceClass, statementClass, propertyClass, resource, statement, hierarchy]
/*			function isInUse( ctg, itm ) {
					function dTIsInUse( L, dT ) {
						let i=null;
						for( var e=L.length-1;e>-1;e-- ) {
							i = L[e].propertyClasses?indexBy(L[e].propertyClasses,'dataType',dT.id):-1;
//							console.debug('dTIsInUse',dT,L,e,i);
							if( i>-1 ) return true
						};
						return false
					}
					function aCIsInUse( ctg, sT ) {
						let c = ctg.substr(0,ctg.length-4),  // xyzType --> xyz, xyzClass ??
							L = cacheOf(c),
							i = indexBy(L,ctg,sT.id);
//						console.debug('aCIsInUse',sT,c,L,i);
						// ToDo: In project.html, the resource cache is empty, but the resourceClass may be in use, anyways.
						// Similarly with statements.
						return ( i>-1 )
					}
					function pCIsInUse( L, pT ) {
						if( L==undefined ) return false; // can't be in use, if the list is not (yet) defined/present.
						let i=null;
						// ToDo: In project.html, the resource cache is empty, but the property class may be in use, anyways.
						// Also a deleted resource may have used the propertyClass.
						// As it stores only the newest types, the ReqIF Server will refuse to delete the type.
						// In case of PouchDB, all revisions of classes/types are stored, so it is sufficient to check whether there are currently some elements using the type.
						// Similarly with statements.
						for( var e=L.length-1;e>-1;e-- ) {
							i = L[e].properties?indexBy(L[e].properties,'class',pT.id):-1;
//							console.debug('pCIsInUse property class',pT,L,e,i);
							if( i>-1 ) return true
						};
						return false
					}
//				console.debug('isInUse',ctg,item);
				switch( ctg ) {
					case 'dataType':		return dTIsInUse(self.data.allClasses,itm);
					case 'resourceClass':
					case 'statementClass':	return aCIsInUse(ctg,itm);
					case 'class':			return pCIsInUse(self.data.resources,itm)
												|| pCIsInUse(self.data.hierarchies,itm)
												|| pCIsInUse(self.data.statements,itm);
				};
				return false
			}  */

//		console.debug('deleteContent',ctg,item);
		return new Promise(
			(resolve, reject) => {
				// Do not delete types which are in use;
				switch (ctg) {
				/*	case 'class':
					case 'dataType':
					case 'resourceClass':
					case 'statementClass':	
						if( Array.isArray(item) ) return null;	// not yet supported
						if( isInUse(ctg,item) ) {
							reject({status:972, statusText:i18n.Err400TypeIsInUse});
							return;
						};
						// no break;  */
					case "resource":
					case "statement":
					case "node":
//						console.debug('deleteContent',ctg,item);
						if (this.data.delete(ctg, item))
							break;
						reject({ status: 999, statusText: ctg + ' ' + item.id + ' not found and thus not deleted.' });
						return;
					default:
						reject({ status: 999, statusText: 'Category ' + ctg + ' is unknown; item ' + item.id + ' could not be deleted.' });
						return;
				};
				resolve();
			}
		);
	};
	readStatementsOf(res: Resource, opts?: any): Promise<Statement[]> {
		// Get the statements of a resource ... there are 2 use-cases:
		// - All statements between resources appearing in a hierarchy shall be shown for navigation;
		//   it is possible that a resource is deleted (from all hierarchies), but not it's statements.
		//   --> set 'showComments' to false
		// - All comments referring to the selected resource shall be shown;
		//   the resource is found in the cache, but the comment is not.
		//   --> set 'showComments' to true
		// - It is assumed that the hierarchies contain only model-elements shown on a visible diagram,
		//   so only stetements are returned only for visible resources.
		// - In addirion, only statements are returned which are shown on a visible diagram.
		//   (perhaps both checks are not necessary, as visible statements only referto vosible resources ...)

		if (typeof (opts) != 'object') opts = {};
		let sCL: StatementClass[];
		return new Promise(
			(resolve, reject) => {
				this.readContent('statementClass', 'all')
					.then(
						(sCs: StatementClass[]) => {
							sCL = sCs;
							return this.readContent('statement', 'all');
						}
					)
					.then(
						(sL: Statement[]) => {
							// make a list of shows statements for all diagrams shown in the hierarchy:
							let showsL = sL.filter((s) => { return staClassTitleOf(s) == CONFIG.staClassShows && isReferencedByHierarchy(LIB.idOf(s.subject)) });
							// filter all statements involving res as subject or object:
							resolve(
								sL.filter(
									(s) => {
										let sC: StatementClass = itemById(sCL, s['class'] as string);
										return (res.id == LIB.idOf(s.subject) || res.id == LIB.idOf(s.object))
											// statement must be visible on a diagram referenced in a hierarchy
											// or be a shows statement itself.
											// ToDo: - Some Archimate relations are implicit (not shown on a diagram) and are unduly suppressed, here)
											&& (opts.dontCheckStatementVisibility
												// Accept manually created relations (including those imported via Excel):
												|| !sC.instantiation || sC.instantiation.indexOf(Instantiation.User) > -1
												|| indexBy(showsL, "object", s.id) > -1
												|| titleOf(sC) == CONFIG.staClassShows)
											// AND fulfill certain conditions:
											&& (
												// related subject and object must be referenced in the tree to be navigable,
												// also, the statement must not be declared 'hidden':
												!opts.showComments
												// cheap tests first:
												&& titleOf(sC) != CONFIG.staClassCommentRefersTo
												&& CONFIG.hiddenStatements.indexOf(s.title) < 0
												&& isReferencedByHierarchy(LIB.idOf(s.subject))
												&& isReferencedByHierarchy(LIB.idOf(s.object))
												// In case of a comment, the comment itself is not referenced in the tree:
												|| opts.showComments
												&& titleOf(sC) == CONFIG.staClassCommentRefersTo
												&& isReferencedByHierarchy(LIB.idOf(s.object))
											)
									}
								)
							);
						}
					)
					.catch(reject);
			}
		);
	}
	// Select format and options with a modal dialog, then export the data:
	private chooseExportOptions(fmt) {
		const exportOptionsClicked = 'app.cache.selectedProject.exportOptionsClicked()';
		var pnl = '<div class="panel panel-default panel-options" style="margin-bottom:0">'
			//	+		"<h4>"+i18n.LblOptions+"</h4>"
			// add 'zero width space' (&#x200b;) to make the label = div-id unique:
			+ textField('&#x200b;' + i18n.LblProjectName, this.title, { typ: 'line', handle: exportOptionsClicked })
			+ textField('&#x200b;' + i18n.LblFileName, this.title, { typ: 'line', handle: exportOptionsClicked });
		switch (fmt) {
			case 'epub':
			case 'oxml':
				pnl += checkboxField(
					//	i18n.LblOptions,
					i18n.modelElements,
					[
						{ title: i18n.withStatements, id: 'withStatements', checked: false },
						{ title: i18n.withOtherProperties, id: 'withOtherProperties', checked: false },
						{ title: i18n.showEmptyProperties, id: 'showEmptyProperties', checked: CONFIG.showEmptyProperties }
					],
					{ handle: exportOptionsClicked }
				);
		};
		pnl += '</div>';
		//		console.debug('chooseExportOptions',fmt,pnl);
		return pnl;
	}
	exportFormatClicked(): void {
		// Display options depending on selected format:
		// In case of ReqIF OOXML and ePub, let the user choose the language, if there are more than one:
		document.getElementById("expOptions").innerHTML = this.chooseExportOptions(radioValue(i18n.LblFormat));

//		console.debug('exportFormatClicked',radioValue( i18n.LblFormat ));
	}
	exportOptionsClicked(): void {
		// Obtain selected options:
		// add 'zero width space' (&#x200b;) to make the label = div-id unique:
		this.title = textValue('&#x200b;' + i18n.LblProjectName);
		this.fileName = textValue('&#x200b;' + i18n.LblFileName);

//		console.debug('exportOptionsClicked',self.title,fileName);
	}
	chooseFormatAndExport() {
		if (this.exporting) return;

		var self = this;
		const exportFormatClicked = 'app.cache.selectedProject.exportFormatClicked()';
		// @ts-ignore - BootstrapDialog() is loaded at runtime
		new BootstrapDialog({
			title: i18n.LblExport + ": '" + this.title + "'",
			type: 'type-primary',
		/*	// @ts-ignore - BootstrapDialog() is loaded at runtime
			size: BootstrapDialog.SIZE_WIDE,  */
			message: () => {
				var form = '<div class="row" style="margin: 0 -4px 0 -4px">'
				//	+ '<div class="col-sm-12 col-md-6" style="padding: 0 4px 0 4px">'
					+ '<div class="col-sm-12" style="padding: 0 4px 0 4px">'
					+ '<div class="panel panel-default panel-options" style="margin-bottom:4px">'
				//	+ "<h4>"+i18n.LblFormat+"</h4>"
					+ "<p>" + i18n.MsgExport + "</p>"
					+ radioField(
						i18n.LblFormat,
						[
							{ title: 'SpecIF v' + CONFIG.specifVersion, id: 'specif', checked: true },
							{ title: 'HTML with embedded SpecIF v' + CONFIG.specifVersion, id: 'html' },
							{ title: 'ReqIF v1.2', id: 'reqif' },
							//	{ title: 'RDF', id: 'rdf' },
							{ title: 'Turtle (experimental)', id: 'turtle' },
							{ title: 'ePub v2', id: 'epub' },
							{ title: 'MS Word® (Open XML)', id: 'oxml' }
						],
						{ handle: exportFormatClicked }  // options depend on format
					)
					+ '</div>'
					+ '</div>'
				//	+ '<div id="expOptions" class="col-sm-12 col-md-6" style="padding: 0 4px 0 4px">'
					+ '<div id="expOptions" class="col-sm-12" style="padding: 0 4px 0 4px">'
					+ this.chooseExportOptions('specif')   // parameter must correspond to the checked option above
					+ '</div>'
					+ '</div>';
				return $(form)
			},
			buttons: [
				{
					label: i18n.BtnCancel,
					action: (thisDlg: any) => {
						thisDlg.close()
					}
				},
				{
					label: i18n.BtnExport,
					cssClass: 'btn-success',
					action: (thisDlg: any) => {
						// Get index of option:
						app.busy.set();
						message.show(i18n.MsgBrowserSaving, { severity: 'success', duration: CONFIG.messageDisplayTimeShort });
//						console.debug('options',checkboxValues( i18n.LblOptions ));
						let options = {
							format: radioValue(i18n.LblFormat),
							fileName: this.fileName
						};
						// further options according to the checkboxes:
						checkboxValues(i18n.modelElements).forEach(
							(op: string) => {
								// @ts-ignore - indexing is valid: 
								options[op] = true
							}
						);
						this.exportAs(options).then(
						//	app.busy.reset,     --> doesn't work for some reason, 'this' within reset() is undefined ...
							() =>{ app.busy.reset() },
							handleError
						);
						thisDlg.close();
					}
				}
			]
		})
		.open();

		// ---
		function handleError(xhr: xhrMessage): void {
			self.exporting = false;
			app.busy.reset();
			message.show(xhr);
		}
	}
	private exportAs(opts?: any): Promise<void> {
		var self = this;

		if (!opts) opts = {};
		if (!opts.format) opts.format = 'specif';
		// in certain cases, try to export files with the same name in PNG format, as well.
		// - ole: often, preview images are supplied in PNG format;
		// - svg: for generation of DOC or ePub, equivalent images in PNG-format are needed.
		//	if( typeof(opts.preferPng)!='boolean' ) opts.preferPng = true;   ... is the default
		//	if( !opts.alternatePngFor ) opts.alternatePngFor = ['svg','ole'];	... not yet supported

		return new Promise((resolve, reject) =>{

			if (self.exporting) {
				// prohibit multiple entry
				reject({ status: 999, statusText: "Export in process, please wait a little while" });
			}
			else {
			//	if (self.data.exp) { // check permission
					self.exporting = true; // set status to prohibit multiple entry

					switch (opts.format) {
						//	case 'rdf':
						case 'turtle':
						case 'reqif':
						case 'html':
						case 'specif':
							storeAs(opts);
							break;
						case 'epub':
						case 'oxml':
							publish(opts);
					};
			//	}
			//	else {
			//		reject({ status: 999, statusText: "No permission to export" });
			//	};
			};
			return;

			function publish(opts: any): void {
				if (!opts || ['epub', 'oxml'].indexOf(opts.format) < 0) {
					// programming error!
					reject({ status: 999, statusText: "Invalid format specified on export" });
					throw Error("Invalid format specified on export");
				};

				// ToDo: Get the newest data from the server.
//				console.debug( "publish", opts );

				// If a hidden property is defined with value, it is suppressed only if it has this value;
				// if the value is undefined, the property is suppressed in all cases.
				opts.hiddenProperties = [
					{ title: CONFIG.propClassType, value: CONFIG.resClassFolder },
					{ title: CONFIG.propClassType, value: CONFIG.resClassOutline }
				];

				opts.allResources = false; // only resources referenced by a hierarchy.
				// Don't lookup titles now, but within toOxml(), so that that the publication can properly classify the properties.
				opts.lookupTitles = false;  // applies to self.data.toExt()
				opts.lookupValues = true;  // applies to self.data.toExt()
				// But DO reduce to the language desired.
				opts.lookupLanguage = true;
				if (typeof (opts.targetLanguage) != 'string') opts.targetLanguage = browser.language;
				opts.makeHTML = true;
				opts.linkifyURLs = true;
				opts.createHierarchyRootIfMissing = true;
				opts.allDiagramsAsImage = true;
			//	opts.allImagesAsPNG = ["oxml"].indexOf(opts.format) > -1;   .. not yet implemented!!
				// take newest revision:
				opts.revisionDate = new Date().toISOString();

				self.read(opts).then(
					(expD) => {
//						console.debug('publish',expD,opts);
						let localOpts = {
							// Values of declared stereotypeProperties get enclosed by double-angle quotation mark '&#x00ab;' and '&#x00bb;'
							titleLinkTargets: CONFIG.titleLinkTargets,
							titleProperties: CONFIG.titleProperties.concat(CONFIG.headingProperties),
							descriptionProperties: CONFIG.descProperties,
							stereotypeProperties: CONFIG.stereotypeProperties,
							lookup: i18n.lookup,
							showEmptyProperties: opts.showEmptyProperties,
							imgExtensions: CONFIG.imgExtensions,
							applExtensions: CONFIG.applExtensions,
						//	hasContent: LIB.hasContent,
							propertiesLabel: opts.withOtherProperties ? 'SpecIF:Properties' : undefined,
							statementsLabel: opts.withStatements ? 'SpecIF:Statements' : undefined,
							fileName: self.fileName || expD.title,
							colorAccent1: '0071B9',	// adesso blue
							done: () => { app.cache.selectedProject.exporting = false; resolve() },
							fail: (xhr) => { app.cache.selectedProject.exporting = false; reject(xhr) }
						};

						switch (opts.format) {
							case 'epub':
								// @ts-ignore - toEpub() is loaded at runtime
								toEpub(expD, localOpts);
								break;
							case 'oxml':
								// @ts-ignore - toOxml() is loaded at runtime
								toOxml(expD, localOpts);
						};
						// resolve() is called in the call-backs defined by opts
					},
					reject
				);
			}
			function storeAs(opts: any): void {
				if (!opts || ['specif', 'html', 'reqif', 'turtle'].indexOf(opts.format) < 0) {
					// programming error!
					reject({ status: 999, statusText: "Invalid format specified on export" });
					throw Error("Invalid format specified on export");
				};

				// ToDo: Get the newest data from the server.
//				console.debug( "storeAs", opts );

				opts.allResources = false;  // only resources referenced by a hierarchy.
				// keep vocabulary terms:
				opts.lookupTitles = false;
				opts.lookupValues = false;
				opts.allDiagramsAsImage = ["html","turtle","reqif"].indexOf(opts.format) > -1;

				switch (opts.format) {
					case 'specif':
						opts.allResources = true;  // even if not referenced by a hierarchy.
						// no break
					case 'html':
						// export all languages:
						opts.lookupLanguage = false;
					//	opts.targetLanguage = undefined;
						// keep all revisions:
					//	opts.revisionDate = undefined;
						break;
				//	case 'rdf':
					case 'turtle':
					case 'reqif':
						// only single language is supported:
						opts.lookupLanguage = true;
						if (typeof (opts.targetLanguage) != 'string') opts.targetLanguage = browser.language;
						// XHTML is supported:
						opts.makeHTML = true;
						opts.linkifyURLs = true;
						opts.createHierarchyRootIfMissing = true;
						// take newest revision:
						opts.revisionDate = new Date().toISOString();
						break;
					default:
						reject();
						return; // should never arrive here
				};
//				console.debug( "storeAs", opts );

				self.read(opts).then(
					(expD) => {
//						console.debug('storeAs', expD, opts);
						let fName = self.fileName || expD.title;

						// A) Processing for 'html':
						if (opts.format == 'html') {
							// find the fully qualified path of the content delivery server to fetch the viewer modules:
							opts.cdn = window.location.href.substr(0, window.location.href.lastIndexOf("/") + 1);

							toHtmlDoc(expD, opts).then(
								(dta): void =>{
									let blob = new Blob([dta], { type: "text/html; charset=utf-8" });
									// @ts-ignore - saveAs() is loaded at runtime
									saveAs(blob, fName + '.specif.html');
									self.exporting = false;
									resolve();
								},
								(xhr): void =>{
									self.exporting = false;
									reject(xhr);
								}
							);
							return;
						};

						// B) Processing for all formats except 'html':
						// @ts-ignore - JSZip() is loaded at runtime
						let zipper = new JSZip(),
							zName: string,
							mimetype = "application/zip";

						// Add the files to the ZIP container:
						if (expD.files)
							expD.files.forEach((f) => {
//								console.debug('zip a file',f);
								zipper.file(f.title, f.blob);
								delete f.blob; // the SpecIF data below shall not contain it ...
							});

						// Prepare the output data:
						switch (opts.format) {
							case 'specif':
								fName += ".specif";
								zName = fName + '.zip';
								expD = JSON.stringify(expD);
								break;
							case 'reqif':
								fName += ".reqif";
								zName = fName + 'z';
								mimetype = "application/reqif+zip";
								expD = app.ioReqif.toReqif(expD);
								break;
							case 'turtle':
								fName += ".ttl";
								zName = fName + '.zip';
								// @ts-ignore - transformSpecifToTTL() is loaded at runtime
								expD = transformSpecifToTTL("https://specif.de/examples", expD);
						/*		break;
							case 'rdf':
								if( !app.ioRdf ) {
									reject({status:999,statusText:"ioRdf not loaded."});
									return;
								};
								fName += ".rdf";
								expD = app.ioRdf.toRdf( expD ); */
						};
						let blob = new Blob([expD], { type: "text/plain; charset=utf-8" });
						// Add the project:
						zipper.file(fName, blob);
						blob = undefined; // free heap space

						// done, store the specif.zip:
						zipper.generateAsync({
							type: "blob",
							compression: "DEFLATE",
							compressionOptions: { level: 7 },
							mimeType: mimetype
						})
						.then(
							(blob: Blob) => {
								// successfully generated:
//								console.debug("storing ZIP of '"+fName+"'.");
								// @ts-ignore - saveAs() is loaded at runtime
								saveAs(blob, zName);
								self.exporting = false;
								resolve();
							},
							(xhr: xhrMessage) => {
								// an error has occurred:
								console.error("Cannot create ZIP of '" + fName + "'.");
								self.exporting = false;
								reject(xhr);
							}
						);
					},
					reject
				)
			}
		});
	}

	private equalDT(r: DataType, n: DataType): boolean {
		// return true, if reference and new dataType are equal:
		if (r.type != n.type) return false;
		switch (r.type) {
			case TypeEnum.XsDouble:
				if (r.fractionDigits != n.fractionDigits) return false;
				// no break
			case TypeEnum.XsInteger:
				return r.minInclusive == n.minInclusive && r.maxInclusive == n.maxInclusive;
			case TypeEnum.XsString:
			case TypeEnum.XHTML:
				return r.maxLength == n.maxLength;
			case TypeEnum.XsEnumeration:
				// Perhaps we must also look at the title ..
				// @ts-ignore - values is optional for a dataType, but not for an enumerated dataType
				if (r.values.length != n.values.length) return false;
				// @ts-ignore - values is optional for a dataType in general, but not for an enumerated dataType
				for (var i = n.values.length - 1; i > -1; i--)
					// assuming that the titles/values don't matter:
					// @ts-ignore - values is optional for a dataType in general, but not for an enumerated dataType
					if (indexById(r.values, n.values[i].id) < 0) return false;
				// the list of enumerated values *is* equal,
				// finally the multiple flag must be equal:
				return this.eqBool(r.multiple, n.multiple);
			default:
				return true;
		};
	}
	private equalPC(r: PropertyClass, n: PropertyClass): boolean {
		// return true, if reference and new propertyClass are equal:
		return r.title == n.title
			&& r.dataType == n.dataType
			&& r.value == n.value
			&& this.eqBool(r.multiple, n.multiple);
	}
	private equalRC(r: ResourceClass, n: ResourceClass): boolean {
		// return true, if reference and new resourceClass are equal:
		return r.title == n.title
			&& this.eqBool(r.isHeading, n.isHeading)
			&& this.eqL(r.propertyClasses, n.propertyClasses)
		//	&& this.eqL( r.instantiation, n.instantiation )
		// --> the instantiation setting of the reference shall prevail
	}
	private equalSC(r: StatementClass, n: StatementClass): boolean {
		// return true, if reference and new statementClass are equal:
		return r.title == n.title
			&& eqSCL(r.propertyClasses, n.propertyClasses)
			&& eqSCL(r.subjectClasses, n.subjectClasses)
			&& eqSCL(r.objectClasses, n.objectClasses)
			&& eqSCL(r.instantiation, n.instantiation);

		function eqSCL(rL: any, nL: any): boolean {
//			console.debug('eqSCL',rL,nL);
			// return true, if both lists have equal members,
			// in this case we allow also less specified statementClasses
			// (for example, when a statement is created from an Excel sheet):
			if (!Array.isArray(nL)) return true;
			// no or empty lists are allowed and considerated equal:
			let rArr = Array.isArray(rL) && rL.length > 0,
				nArr = Array.isArray(nL) && nL.length > 0;
			if (!rArr && nArr
				|| rL.length != nL.length) return false;
			// the sequence may differ:
			for (var i = rL.length - 1; i > -1; i--)
				if (nL.indexOf(rL[i]) < 0) return false;
			return true;
		}
	}

	private equalR(r: Resource, n: Resource): boolean {
		// return true, if reference and new resource are equal.
		// ToDo: Consider, if model-elements are considered equal, 
		// only if they have the same title *and* class,
		// ToDo: Also, if a property with title CONFIG.propClassType has the same value?
//		console.debug('equalR',r,n,resClassTitleOf(r,dta),resClassTitleOf(n,dta));

		// Sort out most cases with minimal computing;
		// assuming that the types have already been consolidated:
		let dta = this.data;
		if (resClassTitleOf(r, dta) != resClassTitleOf(n, dta))
			return false;

		if (r.title && n.title) {
			if (r.title != n.title)
				return false;
		}
		else {
			let opts = {
				lookupLanguage: true,
				targetLanguage: browser.language,
				lookupTitles: true
			};
			if (elementTitleOf(r, opts) != elementTitleOf(n, opts))
				return false;
		};

		// Here, both resources have equal titles and class-titles:
		// Only a genuine title will be considered truly equal, but not a default title
		// being equal to the content of property CONFIG.propClassType is not considered equal
		// (for example BPMN endEvents which don't have a genuine title):
		let typ = valByTitle(r, CONFIG.propClassType, dta),
			rgT = RE.splitNamespace.exec(typ);
		// rgT[2] contains the type without namespace (works also, if there is no namespace).
		return (!rgT || rgT[2] != r.title);
	}
	private equalS(r: Statement, n: Statement): boolean {
		// return true, if reference and new statement are equal:
		// Model-elements are only equal, if they have the same class.
		// ToDo: Also, if they have the same class title?
		// ToDo: Also, if a property with title CONFIG.propClassType has the same value?
		return r['class'] == n['class']
			&& this.equalKey(r.subject, n.subject)
			&& this.equalKey(r.object, n.object);
	}
	private equalF(r: any, n: any): boolean {
		// return true, if reference and new file are equal:
		return r.id == n.id
			&& r.title == n.title
			&& r.type == n.type;
	}
	private equalKey(r: KeyObject, n: KeyObject): boolean {
		// Return true if both keys are equivalent;
		// this applies if only an id is given or a key with id and revision:
		return LIB.idOf(r) == LIB.idOf(n)
			&& r.revision == n.revision;
	}
	private eqBool(rB: Boolean, nB: Boolean): boolean {
		return (rB && nB || !rB && !nB);
	}
	private eqL(rL: any[], nL: any[]): boolean {
		// return true, if both lists have equal members:
		// no or empty lists are allowed and considerated equal:
		let rArr = Array.isArray(rL) && rL.length > 0,
			nArr = Array.isArray(nL) && nL.length > 0;
		if (!rArr && !nArr) return true;
		if (!rArr && nArr
			|| rArr && !nArr
			|| rL.length != nL.length) return false;
		// the sequence may differ:
		for (var i = rL.length - 1; i > -1; i--)
			if (nL.indexOf(rL[i]) < 0) return false;
		return true;
	}
	private compatibleDT(refC: DataType, newC: DataType): boolean {
	//	return this.typeIsCompatible("dataType", refC, newC).status == 0;
		switch (refC.type) {
			case TypeEnum.XsBoolean:
			case TypeEnum.XsDateTime:
				return true;
			case TypeEnum.XHTML:
			case TypeEnum.XsString:
//				console.debug( refC.maxLength>newC.maxLength-1 );
				if (refC.maxLength == undefined)
					return true;
				if (newC.maxLength == undefined || refC.maxLength < newC.maxLength) {
					LIB.logMsg({ status: 951, statusText: "new dataType '" + newC.id + "' of type '" + newC.type + "' is incompatible" });
					return false;;
				};
				return true;
			case TypeEnum.XsDouble:
				// to be compatible, the new 'fractionDigits' must be lower or equal:
				if (refC.fractionDigits < newC.fractionDigits) {
					LIB.logMsg({ status: 952, statusText: "new dataType '" + newC.id + "' of type '" + newC.type + "' is incompatible" });
					return false;
				};
				// else: go on ...
			case TypeEnum.XsInteger:
				// to be compatible, the new 'maxInclusive' must be lower or equal and the new 'minInclusive' must be higher or equal:
//				console.debug( refC.maxInclusive<newC.maxInclusive || refC.minInclusive>newC.minInclusive );
				if (refC.maxInclusive < newC.maxInclusive || refC.minInclusive > newC.minInclusive) {
					LIB.logMsg({ status: 953, statusText: "new dataType '" + newC.id + "' of type '" + newC.type + "' is incompatible" });
					return false;
				};
				return true;
			case TypeEnum.XsEnumeration:
				// to be compatible, every value of the new 'enumeration' must be present in the present one:
				// ToDo: Add a new enum value to an existing enum dataType.
				var idx: number;
				for (var v = newC.values.length - 1; v > -1; v--) {
					idx = indexById(refC.values, newC.values[v].id);
					// the id must be present:
					if (idx < 0) {
						LIB.logMsg({ status: 954, statusText: "new dataType '" + newC.id + "' of type '" + newC.type + "' is incompatible" });
						return false;
					};
					//  ... and the values must be equal:
					if (refC.values[idx].value != newC.values[v].value) {
						LIB.logMsg({ status: 955, statusText: "new dataType '" + newC.id + "' of type '" + newC.type + "' is incompatible" });
						return false;
					};
				};
				return true;
		};
		// should never arrive here ... as every branch in every case above has a return.
		throw Error("Invalid data type.");
	}
	private compatiblePC(refC: PropertyClass, newC: PropertyClass): boolean {
	/*	// A resourceClass or statementClass is incompatible, if it has an equally-named property class with a different dataType
		// A resourceClass or statementClass is compatible, if all equally-named propertyClasses have the same dataType
		if (!newC.propertyClasses || !newC.propertyClasses.length)
			return { status: 0 };
		// else: The new type has at least one property.
	
		if (!refC.propertyClasses || refC.propertyClasses.length < newC.propertyClasses.length)
			return { status: 963, statusText: "new resourceClass or statementClass '" + newC.id + "' is incompatible (additional propertyClasses)" };
		// else: The new type has no more properties than the reference
	
		var idx: number,
			nPC: PropertyClass;
		for (var a = newC.propertyClasses.length - 1; a > -1; a--) {
			nPC = newC.propertyClasses[a];
			if (nPC.id) {
				// If an id exists, it must be equal to one of refC's propertyClasses:
				idx = indexById(refC.propertyClasses, nPC.id)
			} 
			else {
				// If there is no id, the type is new and there are no referencing elements, yet.
				// So it does not matter.
				// But there must be a property class with the same name:
				idx = indexByTitle(refC.propertyClasses, nPC.title)
			};
			if (idx < 0) {
				// The property class in the new data is not found in the existing (reference) data:
				if (!opts || !opts.mode || ["match", "include"].indexOf(opts.mode) > -1)
					// the property class is expected and thus an error is signalled:
					return { status: 964, statusText: "new resourceClass or statementClass '" + newC.id + "' is incompatible (additional propertyClass)" }
				else
					// cases 'extend' and 'ignore';
					// either the property will be created later on, or it will be ignored;
					// we are checking only in a first pass.
					continue;
			};
			//  else: the property class is present; in this case and in all modes the dataTypes must be equal:
			if (refC.propertyClasses[idx].dataType != nPC.dataType) {
				return { status: 965, statusText: "new resourceClass or statementClass '" + newC.id + "' is incompatible (different dataType)" }
			}
		};
		return { status: 0 };  */
		if (this.equalPC(refC, newC))
			return true;
		// else:
		LIB.logMsg({ status: 956, statusText: "new propertyClass '" + newC.id + "' is incompatible" });
		return false;
	}
	private compatiblePCReferences(rCL: KeyObject[], nCL: KeyObject[], opts?: any): boolean {
		// to be used for a tesourceClass' or statementClass' propertyClasses
		if (!opts || !opts.mode) opts = { mode: "match" }; // most restrictive by default
		if (Array.isArray(rCL) && Array.isArray(nCL)) {
			switch (opts.mode) {
				case "include":
					return rCL.length >= nCL.length && LIB.containsAll(rCL, nCL);
				case "match":
				default:
					return rCL.length == nCL.length && LIB.containsAll(rCL, nCL);
			};
		};
		switch (opts.mode) {
			case "include":
				// Also OK, if the new class doesn't reference any propertyClass,
				// it is irrelevant whether the reference class references any or not:
				return !Array.isArray(nCL) || nCL.length < 1;
			case "match":
			default:
				return !Array.isArray(rCL) && !Array.isArray(nCL);
		};
	}
	private compatibleECReferences(rCL: KeyObject[], nCL: KeyObject[], opts?: any): boolean {
		// to be used for a statementClass's subjectClasses and objectClasses;
		// if any of these arrays is missing, subjects or objects of any class are allowed:
		if (!opts || !opts.mode) opts = { mode: "match" }; // most restrictive by default

		if (Array.isArray(rCL)) {
			if (Array.isArray(nCL))
				switch (opts.mode) {
					case "include":
						return rCL.length >= nCL.length && LIB.containsAll(rCL, nCL);
					case "match":
					default:
						return rCL.length == nCL.length && LIB.containsAll(rCL, nCL);
				}
			else
				// there is a reference list, but no new list (i.e. subjects or objects of any class are allowed):
				return false;
		};
		// else:
		return opts.mode == "match" ? !Array.isArray(nCL) : true;
	}
	private compatibleRC(refC: ResourceClass, newC: ResourceClass, opts?:any): boolean {
		if (this.compatiblePCReferences(refC.propertyClasses, newC.propertyClasses, opts))
			return true;
		// else:
		LIB.logMsg({ status: 963, statusText: "new resourceClass '" + newC.id + "' is incompatible; propertyClasses don't match" });
		return false;
	}
	private compatibleSC(refC: StatementClass, newC: StatementClass, opts?:any): boolean {
		// To be compatible, all sourceTypes of newC must be contained in the sourceTypes of refC;
		// no sourceTypes means that all resourceClasses are permissible as subject.
		// ... and similarly for the targetTypes:
		if (!this.compatibleECReferences(refC.subjectClasses, newC.subjectClasses) ) {
			LIB.logMsg({ status: 961, statusText: "new statementClass '" + newC.id + "' is incompatible; subjectClasses don't match" });
			return false;
		};
		if (!this.compatibleECReferences(refC.objectClasses, newC.objectClasses)) {
			LIB.logMsg({ status: 962, statusText: "new statementClass '" + newC.id + "' is incompatible; objectClasses don't match" });
			return false;
		};
		// else: so far everything is OK, but go on checking ... (no break!)
		if (this.compatiblePCReferences(refC.propertyClasses, newC.propertyClasses, opts))
			return true;
		// else:
		LIB.logMsg({ status: 963, statusText: "new statementClass '" + newC.id + "' is incompatible; propertyClasses don't match" });
		return false;
	}
	private substituteDT(prj: SpecIF, r: DataType, n: DataType,): void {
		// For all propertyClasses, substitute new by the original dataType:
		this.substituteProp(prj.propertyClasses, 'dataType', r.id, n.id);
	}
	private substitutePC(prj: SpecIF, r: ResourceClass, n: ResourceClass, ): void {
		// For all resourceClasses, substitute new by the original propertyClass:
		this.substituteLe(prj.resourceClasses, 'propertyClasses', r.id, n.id);
		// Also substitute the resource properties' class:
		prj.resources.forEach((res) => {
			this.substituteProp(res.properties, 'class', r.id, n.id);
		});
		// The same with the statementClasses:
		this.substituteLe(prj.statementClasses, 'propertyClasses', r.id, n.id);
		if (Array.isArray(prj.statements))
			prj.statements.forEach((sta) => {
				this.substituteProp(sta.properties, 'class', r.id, n.id)
			});
	}
	private substituteRC(prj: SpecIF, r: ResourceClass, n: ResourceClass): void {
		// Substitute new by original resourceClass:
		this.substituteLe(prj.statementClasses, 'subjectClasses', r.id, n.id);
		this.substituteLe(prj.statementClasses, 'objectClasses', r.id, n.id);
		this.substituteProp(prj.resources, 'class', r.id, n.id);
	}
	private substituteSC(prj: SpecIF, r: StatementClass, n: StatementClass): void {
		// Substitute new by original statementClass:
		this.substituteProp(prj.statements, 'class', r.id, n.id);
	}
	private substituteR(prj: SpecIF, r: Resource, n: Resource, opts?: any): void {
		// Substitute resource n by r in all references of n,
		// where r is always an element of this.data.
		// But: Rescue any property of n, if undefined for r.
//		console.debug('substituteR',r,n,prj.statements);

		if (opts && opts.rescueProperties) {
			// Rescue any property value of n,
			// if the corresponding property of the adopted resource r is undefined or empty;
			// looking at the property types, which ones are in common:
			n.properties.forEach((nP) => {
				if (LIB.hasContent(nP.value)) {
					// check whether existing resource has similar property;
					// a property is similar, if it has the same title,
					// where the title may be defined with the property class.
					let pT = propTitleOf(nP, prj),
						rP = propByTitle(r, pT, this.data);
//					console.debug('substituteR 3a',nP,pT,rP,LIB.hasContent(valByTitle( r, pT, this.data )));
					if (!LIB.hasContent(valByTitle(r, pT, this.data))
						// the existing resource must have a similar property:
						// ToDo: If the property isn't there, but the propertyClass is listed with the resourceClass,
						//       then copy the whole property.
						&& rP
						// dataTypes must be compatible:
						&& this.compatibleDT(dataTypeOf(this.data, rP['class']), dataTypeOf(prj, nP['class']))) {
						rP.value = nP.value;
					};
				};
			});
		};
		// In the rare case that the ids are identical, there is no need to update the references:
		if (r.id == n.id) return;

		// 1. Replace the references in all statements:
		prj.statements.forEach((st: Statement) => {
			if (this.equalKey(st.object, n)) { if (st.object.id) { st.object.id = LIB.idOf(r) } else { st.object = LIB.idOf(r) } };
			if (this.equalKey(st.subject, n)) { if (st.subject.id) { st.subject.id = LIB.idOf(r) } else { st.subject = LIB.idOf(r) } }
			// ToDo: Is the substitution is too simple, if a key is used?
		});

		// 2. Replace the references in all hierarchies:
		this.substituteRef(prj.hierarchies, r.id, n.id);

		// 3. Make sure all statementClasses allowing n.class also allow r.class (the class of the adopted resource):
		prj.statementClasses.forEach((sC: StatementClass) => {
			if (Array.isArray(sC.subjectClasses) && sC.subjectClasses.indexOf(n['class']) > -1) LIB.cacheE(sC.subjectClasses, r['class']);
			if (Array.isArray(sC.objectClasses) && sC.objectClasses.indexOf(n['class']) > -1) LIB.cacheE(sC.objectClasses, r['class']);
		});
	}
	private substituteProp(L, propN: string, rAV: string, dAV: string): void {
		// replace ids of the duplicate item by the id of the original one;
		// this applies to the property 'propN' of each member of the list L:
		if (Array.isArray(L))
			L.forEach((e) => { if (e[propN] == dAV) e[propN] = rAV });
	}
	private substituteLe(L, propN: string, rAV: string, dAV: string): void {
		// Replace the duplicate id by the id of the original item;
		// so replace dAV by rAV in the list named 'propN'
		// (for example: in L[i][propN] (which is a list as well), replace dAV by rAV):
		let idx: number;
		if (Array.isArray(L))
			L.forEach((e) => {
				// e is a resourceClass or statementClass:
				if (Array.isArray(e[propN])) {
					idx = e[propN].indexOf(dAV);
					if (idx > -1) {
						// dAV is an element of e[propN]
						// - replace dAV with rAV
						// - in case rAV is already member of the list, just remove dAV
						if (e[propN].indexOf(rAV) > -1)
							e[propN].splice(idx, 1)
						else
							e[propN].splice(idx, 1, rAV);
					};
				};
			});
	}
	private substituteRef(L, rId: string, dId: string): void {
		// For all hierarchies, replace any reference to dId by rId;
		// eliminate double entries in the same folder (together with the children):
		LIB.iterateNodes(
			L,
			// replace resource id:
			(nd) => { if (nd.resource == dId) { nd.resource = rId }; return true },
			// eliminate duplicates within a folder (assuming that it will not make sense to show the same resource twice in a folder;
			// for example it is avoided that the same diagram is shown twice if it has been imported twice:
			(ndL) => { for (var i = ndL.length - 1; i > 0; i--) { if (indexBy(ndL.slice(0, i), 'resource', ndL[i].resource) > -1) { ndL.splice(i, 1) } } }
		);
		// ToDo: Make it work, if keys are used as a reference.
	}
	abort(): void {
		console.info('abort cache');
	//	server.abort();
		this.abortFlag = true;
	};
}

// This will be merged with the basic declaration of IModule in moduleManager.ts:
// interface IModule {
interface IProjects extends IModule {
	data: CCache;
	projects: CProject[];
	selectedProject: CProject;
	init: Function;
	create: Function;
}

moduleManager.construct({
	name: 'cache'
}, (self: IProjects) => {
	// Construct a representative of the selected project with cached data:
	// ToDo: enforce CONFIG.maxItemsToCache

	/*	var autoLoadId,				// max 1 autoLoad chain
			autoLoadCb;				// callback function when the cache has been updated  */

	// initialization is at the end of this constructor.
	self.init = (): boolean => {
		// initialize/clear all variables:
		self.data = new CCache({cacheInstances:true});
		self.projects = [];
		self.selectedProject = undefined;

	/*	autoLoadId = undefined;  // stop any autoLoad chain
		autoLoadCb = undefined;  */

		return true
	};
	self.create = (prj: SpecIF, opts: any): JQueryDeferred<void> => {
		// in this implementation, delete existing projects to save memory space:
		self.projects.length = 0;
		self.data.clear();
		// append a project to the list:
		self.projects.push(new CProject(prj,self.data));
	//	self.projects.push(Project());
		self.selectedProject = self.projects[self.projects.length - 1];
		return self.selectedProject.create(prj, opts);
	};
	/*	self.update = (prj:SpecIF, opts:any ) => {
			if (!prj) return;
			// search the project and select it:
			...
			// update:
			...
		  };
		// Periodically update the selected project with the current server state in a multi-user context:
		self.startAutoLoad = ( cb )=>{
	//		if( !self.cacheInstances ) return;
	//		console.info( 'startAutoLoad' );
			if( typeof(cb)=="function" ) { autoLoadCb = cb };
			autoLoadId = LIB.genID( 'aU-' );
			// get all resources from the server to fill the cache:
			setTimeout( ()=>{ autoLoad(autoLoadId) }, 600 )  // start a little later ...
		};
		self.stopAutoLoad = ()=>{
	//		console.info('stopAutoLoad');
			autoLoadId = null;
			loading = false
		};
		self.loadInstances = ( cb )=>{
			// for the time being - until the synchronizing will be implemented:
	//		if( !self.cacheInstances ) return;
			// load the instances of the selected hierarchy (spec) into the cache (but not the types):
	//		console.debug( 'self.loadInstances', self.selectedHierarchy, cb );
			if( self.selectedHierarchy ) {
				loading = true;
				// update all resources referenced by the selectedHierarchy:
				loadObjsOf( self.selectedHierarchy )
					.done( ()=>{
	//					loadRelsOf( self.selectedHierarchy );
						// update the hierarchy (outline).
						// it is done after the resources to reflect any change in the hierarchy made during the loading.
						self.readContent( 'hierarchy', self.selectedHierarchy, true )	// true: reload
							// - call cb to refresh the app:
							.done( ()=>{
								if( typeof(cb)=="function" ) cb();
								loading = false
							})
							.fail( (xhr)=>{
								loading = false
							})
					})
					.fail( (xhr)=>{
						loading = false
					})
			}
		};
		self.load = (opts)=>{
			var lDO = $.Deferred();
	
			// load referenced resources and statements ...
			if( opts.loadObjects ) {
				if( opts.loadAllSpecs )
					loadAll( 'resource' )
						.done( ()=>{
							if( opts.loadRelations )
								return loadAll( 'statement' )
									.done( lDO.resolve )
									.fail( lDO.reject );
							// else
							lDO.resolve()
						})
						.fail( lDo.reject )
				else
					loadObjsOf( self.selectedHierarchy )
						.done( ()=>{
							if( opts.loadRelations )
								return loadRelsOf( self.selectedHierarchy )
									.done( lDO.resolve )
									.fail( lDO.reject );
							// else
							lDO.resolve()
						})
						.fail( lDo.reject );
				return
			} 
			else {
				lDO.resolve()
			};
			return lDO
		};
	*/
	return self;
});

//////////////////////////
// global helper functions:
LIB.idOf = ( key:KeyObject|string ):string =>{
	// Return the id of the referenced item; the key can be
	// - a string with the requested id
	// - an pbject with id and a revision
	return key.id || key
}
/*	function keyOf( item ) {
		// Normalize the identification including revision:
		switch( typeof(item) ) {
			case "object": return item;
			case "string": return {id: item, revision: "0"};
			default: return null // programming error
		}
	}*/
function isReferencedByHierarchy(rId: string, H?: SpecifNode[]): boolean {
	// checks whether a resource is referenced by the hierarchy:
	// ToDo: make it work with revisions.
	if( !H ) H = app.cache.selectedProject.data.hierarchies;
	return LIB.iterateNodes( H, (nd)=>{ return nd.resource!=rId } )
}
function collectResourcesByHierarchy(prj: SpecIF, H?: SpecifNode[] ):Resource[] {
	// collect all resources referenced by the given hierarchy:
	if( !prj ) prj = app.cache.selectedProject.data;
	if( !H ) H = prj.hierarchies;
	var rL:Resource[] = [];
	LIB.iterateNodes( H, (nd)=>{ LIB.cacheE( rL, itemById(prj.resources,LIB.idOf(nd.resource)) ); return true } );
	return rL;
}
function dataTypeOf(prj: SpecIF, pCid:string ):DataType {
	// given a propertyClass id, return it's dataType:
	if (typeof(pCid) == 'string' && pCid.length > 0) {
		let dT = itemById(prj.dataTypes, itemById(prj.propertyClasses, pCid).dataType);
		//       |                       get propertyClass
		//	     get dataType
		if (dT)
			return dT
		else
			throw Error("dataType of '" + pCid + "' not found in SpecIF data-set with id " + prj.id);
	};
	// else:
	// happens, if filter replaces an enumeration property by its value - property has no class in this case:
	return { type: TypeEnum.XsString }; // by default  
}
function enumValueOf(dT: DataType, val: string, opts?: any): string {
	// for a property value of type ENUMERATION, create a comma-separated-value string of titles;
	// for all others, return the value as is:
	if (dT.type != TypeEnum.XsEnumeration || !val) return val;
	let ct = '',
		eV,
		vL = val.split(',');  // in case of a multi-valued ENUMERATION, val may carry comma-separated value-IDs
//	console.debug('enumValueOf',dT,val,vL,opts);
	vL.forEach( (v,i)=>{
		eV = languageValueOf( itemById(dT.values,v).value, opts );
		if( opts&&opts.lookupValues )
			eV = i18n.lookup(eV);
		// If 'eV' is an id, replace it by the corresponding value, otherwise don't change:
		// For example, when an object is from a search hitlist or from a revision list,
		// the value ids of an ENUMERATION have already been replaced by the corresponding titles.
		ct += (i == 0 ? '' : ', ') + (eV ? eV : v);
	});
	return ct;
}
function multipleChoice(pC: PropertyClass, prj?: SpecIF): boolean {
	if( !prj ) prj = app.cache.selectedProject.data;
	// return 'true', if either the property type specifies it, or by default its datatype;
	// if defined, the property type's value supersedes the datatype's value:
	return ( typeof(pC.multiple)=='boolean'?pC.multiple : !!itemById(prj.dataTypes,pC.dataType).multiple )
	// Note: specif-check applies the same logic in function 'checkPropValues(..)'
}
function visibleIdOf(r: Resource, prj?: SpecIF ):string|undefined {
	if( r && r.properties ) {
		if( !prj ) prj = app.cache.selectedProject.data;
		for( var a=0,A=r.properties.length;a<A;a++ ) {
			// Check the configured ids:
			if( CONFIG.idProperties.indexOf( vocabulary.property.specif( propTitleOf(r.properties[a],prj) ) )>-1 )
				return r.properties[a].value
		};
	};
//	return undefined
}
function resClassTitleOf(e: Resource, prj?: SpecIF, opts?:any ):string {
	if (!prj) prj = app.cache.selectedProject.data;
	return titleOf( itemById( prj.resourceClasses, e['class'] ), opts );
}
function staClassTitleOf( e:Statement, prj?:SpecIF, opts?:any ):string {
	// Where available, take the statementClass' title, otherwise the statement's;
	// The latter is the case with interpreted relations such as "mentions":
	if (!prj) prj = app.cache.selectedProject.data;
    return e['class']? titleOf(itemById(prj.statementClasses, e['class']), opts) : titleOf(e, opts);
}
function propTitleOf(prp: Property, prj: SpecIF ):string {
	// get the title of a property as defined by itself or it's class:
	return prp.title || itemById(prj.propertyClasses,prp['class']).title;
}
function titleOf( item, opts?:any ):string {
	// Pick up the native title of any item;
	// look for a translation, take it as is or take the id by default.
	// It can be a title string or a multi-language title object.
	let ti = languageValueOf( item.title, opts );
//	console.debug('titleOf',item,opts,ti);
	if( ti ) return opts&&opts.lookupTitles? i18n.lookup(ti) : ti;
//	return undefined
}
function languageValueOf( val, opts?:any ):string|undefined {
	// Return the value in the specified target language .. or the first value in the list by default.
	// 'val' can be a string or a multi-language object;
	// if opts.lookupLanguage is not true, keep all language options:
	if( typeof(val)=='string' || !(opts&&opts.lookupLanguage) ) return val;
	// The value may be undefined:
	if( val==undefined ) return;
	if( !Array.isArray(val) ) {
		// neither a string nor an array is a programming error:
		throw Error("Invalid value: '"+val+"'");
	};

	let lVs = val.filter( (v):boolean =>{
		return opts.targetLanguage == v.language
	});
	// lVs should have none or one elements; any additional ones are simply ignored:
	if( lVs.length>0 ) return lVs[0].text;

	// next try a little less stringently:
	lVs = val.filter( (v):boolean =>{
		return opts && opts.targetLanguage && (opts.targetLanguage.slice(0,2) == v.language.slice(0,2));
	});
	// lVs should have none or one elements; any additional ones are simply ignored:
	if( lVs.length>0 ) return lVs[0].text;

	// As a final resourt take the first element in the original list of values:
	return val[0].text;
}
LIB.hasContent = ( pV:string ):boolean =>{
	// must be a string with the value of the selected language.
	if (typeof (pV) != "string"
		|| /^.{0,2}(?:no entry|empty).{0,2}$/.test(pV.toLowerCase())
	) return false;
	return pV.stripHTML().length>0
		|| RE.tagSingleObject.test(pV) // covers nested object tags, as well
		|| RE.tagImg.test(pV)
		|| RE.tagA.test(pV)
}
LIB.iterateNodes = (tree: SpecifNode[]|SpecifNode, eFn:Function, lFn?:Function): boolean =>{
	// Iterate a SpecIF hierarchy or a branch of a hierarchy.
	// Do NOT use with a tree for display (jqTree).
	// 1. Execute eFn for every node of the tree as long as eFn returns true;
	//    return true as a whole, if iterating is finished early.
	//    For example, if eFn tests for a certain attribute value of a tree node,
	//    iterateNodes() ends with true, as soon as the test is positive (cont is false).
	// 2. Call lFn at the end of treating all elements of a folder (list),
	//    for example to eliminate duplicates.
	let cont=true;
	if( Array.isArray( tree ) ) {
		for( var i=tree.length-1; cont&&(i>-1); i-- ) {
			cont = !LIB.iterateNodes( tree[i], eFn, lFn );
		};
		if( typeof(lFn)=='function' ) lFn( tree );
	}
	else {
		cont = eFn( tree );
		if( cont && tree.nodes ) {
			cont = !LIB.iterateNodes( tree.nodes, eFn, lFn );
		};
	};
	return !cont;
}
function createProp(pC:PropertyClass, pCid?: string): object {
	// Create an empty property from the supplied class;
	// the propertyClass may be supplied by the first parameter
	// or will be selected from the propertyClasses list using the supplied propertyClass id pCid:
	if( Array.isArray(pC) )
		pC = itemById( pC, pCid );
//	console.debug('createProp',pC,pCid);
	return {
		title: pC.title,
		class: pC.id,
		// supply default value if available:
		value: pC.value||''
	//	permissions: pC.permissions||{cre:true,rea:true,upd:true,del:true}
	};
}
function propByTitle(itm: Resource, pN: string, dta:SpecIF): Property|undefined {
	// Return the property of itm with title pN.
	// If it doesn't exist, create it,
	// if there is no propertyClass with that title either, return undefined.

	// Look for the propertyClasses pCs of the item's class iC:
	// ToDo: Add statementClasses, as soon as needed.
	var iC:ResourceClass = itemById( dta.resourceClasses, itm['class'] as string ),
		pC: PropertyClass,
		prp: Property;
//	console.debug('propByTitle',dta,itm,pN,iC);
	for( var i=dta.propertyClasses.length-1;i>-1;i-- ) {
		pC = dta.propertyClasses[i];
		if( iC.propertyClasses.indexOf(pC.id)>-1 	// pC is used by the item's class iC
			&& pC.title==pN ) {						// pC has the specified title
				// take the existing property, if it exists;
				// the property's title is not necessarily present:
				prp = itemBy(itm.properties,'class',pC.id);
				if( prp ) return prp;
				// else create a new one from the propertyClass:
				prp = createProp(pC);
				itm.properties.push(prp);
				return prp
		};
	};
//	return undefined
}
function valByTitle(itm:Resource,pN:string,dta:SpecIF):string|undefined {
	// Return the value of a resource's (or statement's) property with title pN:
	// ToDo: return the class's default value, if available.
//	console.debug('valByTitle',dta,itm,pN);
	if( itm.properties ) {
		for( var i=itm.properties.length-1;i>-1;i-- ) {
			if( (itm.properties[i].title || itemById( dta.propertyClasses, itm.properties[i]['class'] ).title)==pN )
				return itm.properties[i].value
		}
	};
//	return undefined
}
function titleIdx(pL: Property[], dta?: SpecIF): number {
	// Find the index of the property to be used as title.
	// The result depends on the current user - only the properties with read permission are taken into consideration.
	// This works for title strings and multi-language title objects.

	// The first property which is found in the list of headings or titles is chosen:
	if( pL ) {
		if( !dta ) dta = app.cache.selectedProject.data;
		let pt;
		for( var a=0,A=pL.length;a<A;a++ ) {
			pt = vocabulary.property.specif( propTitleOf(pL[a],dta) );
			// Check the configured headings and titles:
			if( CONFIG.titleProperties.indexOf( pt )>-1 ) return a;
		};
	};
	return -1;
}
function elementTitleOf(el: Resource | Statement, opts:any, dta?:SpecIF): string {
	// Get the title of a resource or a statement;
	// ... from the properties or a replacement value in case of default.
	// 'el' is an original element without 'classifyProps()'.
	if( typeof(el)!='object' ) return;
	if( !dta ) dta = app.cache.selectedProject.data;
	
	// Lookup titles only in case of a resource serving as heading or in case of a statement:
	let localOpts;
	if( el.subject ) {
		// it is a statement
		localOpts = opts;
	}
	else {
		// it is a resource
		localOpts = {
			lookupLanguage: opts.lookupLanguage,
			targetLanguage: opts.targetLanguage,
			lookupTitles: opts.lookupTitles && itemById( dta.resourceClasses, el['class'] ).isHeading
		};
	};
	// Get the title from the properties or natively by default:
	let ti:string = getTitle( el.properties, localOpts ) || titleOf( el, localOpts );

	// In case of a resource, we never want to lookup a title,
	// however in case of a statement, we do:
	if( el.subject ) {
		// it is a statement
		if( !ti )
			// take the class' title by default:
			ti = staClassTitleOf( el, dta, opts );
	}
	else {
		// it is a resource
		if( opts && opts.addIcon && CONFIG.addIconToInstance && dta && ti )
			ti = LIB.addIcon( ti, itemById( dta.resourceClasses, el['class'] ).icon );
	};

// 	console.debug('elementTitleOf',el,opts,ti);
	return typeof (ti) == 'string' ? ti.stripHTML() : ti;

	function getTitle(pL: Property[], opts:any ): string {
	//	if( !pL ) return;
		// look for a property serving as title:
		let idx = titleIdx( pL );
		if( idx>-1 ) {  // found!
			// Remove all formatting for the title, as the app's format shall prevail.
			// Before, remove all marked deletions (as prepared be diffmatchpatch) explicitly with the contained text.
			// ToDo: Check, whether this is at all called in a context where deletions and insertions are marked ..
			// (also, change the regex with 'greedy' behavior allowing HTML-tags between deletion marks).
		/*	if( moduleManager.ready.indexOf( 'diff' )>-1 )
				return pL[idx].value.replace(/<del[^<]+<\/del>/g,'').stripHTML(); */
			// For now, let's try without replacements; so far this function is called before the filters are applied,
			// perhaps this needs to be reconsidered a again once the revisions list is featured, again:
//			console.debug('getTitle', idx, pL[idx], op, languageValueOf( pL[idx].value,op ) );
			let ti = languageValueOf( pL[idx].value, opts );
			if( ti ) return opts&&opts.lookupTitles? i18n.lookup(ti) : ti;
		};
		return '';
	}
}
