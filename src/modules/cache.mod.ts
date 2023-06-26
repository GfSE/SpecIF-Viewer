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

class CCache {
	// Common Cache for all locally handled projects (SpecIF data-sets)
	cacheInstances: boolean;
	dataTypes: SpecifDataType[] = [];
	propertyClasses: SpecifPropertyClass[] = [];
	resourceClasses: SpecifResourceClass[] = [];
	statementClasses: SpecifStatementClass[] = [];
	resources: SpecifResource[] = [];   		// list of resources as referenced by the hierarchies
	statements: SpecifStatement[] = [];
	hierarchies: SpecifNode[] = [];    	// listed specifications (aka hierarchies, outlines) of all loaded projects
	files: IFileWithContent[] = [];
	constructor(opts:any) {
		this.cacheInstances = opts.cacheInstances;
	/*	for (var le of app.standards.listName.keys())
			// @ts-ignore - index is ok:
			this[app.standards.listName.get(le)] = []; */
	}
	length(ctg: string): number {
		// Return the number of cached items per category:
		// @ts-ignore - index is ok:
		return this[app.standards.listName.get(ctg)].length;
	}
	has(ctg: string, rL: SpecifKeys): boolean {
		// @ts-ignore - index is ok:
		let L = this[app.standards.listName.get(ctg)];
		for (var i = rL.length - 1; i > -1;i--) {
			if (LIB.indexByKey(L, rL[i]) < 0) return false;
		};
		return true;
	}
	put(ctg: string, item: SpecifItem[] | SpecifItem): boolean {
		if (!item || Array.isArray(item) && item.length < 1)
			return false;
		// If item is a list, all elements must have the same category.
		function cacheIfNewerE(L: SpecifItem[], e: SpecifItem): boolean {  // ( list, entry )
			// Add or update the item e in a list L, if created later:
			if (typeof (e) != 'object' || !e.id)
				throw Error("Cache 'put' operation with old reference (string instead of object with id)");
			let n = LIB.indexById(L, e.id);
			// add, if not yet listed:
			if (n < 0) {
				L.push(e);
				return true;
			};
			// Update, if newer or when reference 'resourceToLink' has been resolved:
			if (L[n].changedAt && e.changedAt && new Date(L[n].changedAt) < new Date(e.changedAt)
				|| (L[n] as IIncompleteStatement).resourceToLink && !(e as IIncompleteStatement).resourceToLink
				)
				L[n] = e;
			return true;
		}
		function cacheIfNewerL(L: SpecifItem[], es: SpecifItem[]): boolean {  // ( list, entries )
			// add or update the items es in a list L:
			for (var e of es) cacheIfNewerE(L, e);
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
				return fn(this[app.standards.listName.get(ctg)], item);
			case 'resource':
			case 'statement':
			case 'file':
				if (this.cacheInstances) {
					// @ts-ignore - indexing is perfectly ok
					return fn(this[app.standards.listName.get(ctg)], item);
				};
				return true;
			case 'node':
				if (Array.isArray(item)) {
					item.forEach((n) => { this.putNode(n as INodeWithPosition) });
					return true
				};
//				console.debug('cache',ctg,item);
				return this.putNode(item as INodeWithPosition);
			default:
				throw Error("Invalid category '" + ctg + "'.");
		};
	}
	get(ctg: string, req: SpecifKeys | Function | string): SpecifItem[] {
		// Read items from cache; req can be 
		// - a list with keys,
		// - a filter function returning 'true' for all items to select
		// - a string with "all" to return all items of the category (DEPRECATED)
		if (req) {
			// @ts-ignore - addressing is perfectly ok
			let itmL = this[app.standards.listName.get(ctg)];

			if (Array.isArray(req)) {
				let allFound = true, i = 0, I = req.length, idx: number;
				var rL: SpecifItem[] = [];
				while (allFound && i < I) {
					idx = LIB.indexByKey(itmL, req[i]);
					if (idx > -1) {
						rL.push(itmL[idx]);
						i++;
					}
					else
						allFound = false;
				};
				if (allFound)
					return simpleClone(rL);
			}
			else if (typeof (req) == 'function') {
				return simpleClone(itmL.filter(req));
			}
			else if (req === "all") {		// DEPRECATED
				return simpleClone(itmL);	// return all cached items in a new list
			};
		};
		return [];
	}
	delete(ctg: string, itemL: SpecifKeys ): boolean | undefined {
		switch (ctg) {
			case 'hierarchy':
			case 'dataType':
			case 'propertyClass':
			case 'resourceClass':
			case 'statementClass':
				// @ts-ignore - addressing is perfectly ok
				return LIB.uncacheL(this[app.standards.listName.get(ctg)], itemL);
			case 'resource':
			case 'statement':
			case 'file':
				if (this.cacheInstances)
					// @ts-ignore - addressing is perfectly ok
					return LIB.uncacheL(this[app.standards.listName.get(ctg)], itemL);
				return true;
			case 'node':
				itemL.forEach((el):void => { delNodes(this.hierarchies, el) })
				return true;
			default:
				throw Error("Invalid category '" + ctg + "'.");
		};
		// all cases have a return statement ..

		function delNodes(L: SpecifNode[]|undefined, el: SpecifKey): void {
			// Delete all nodes specified by the element;
			// if el is the node, 'id' will be used to identify it (obviously at most one node),
			// and if el is the referenced resource, 'resource' will be used to identify all referencing nodes.
			if (Array.isArray(L))
				for (var h = L.length - 1; h > -1; h--) {
					// @ts-ignore - doesn't matter if el.resource is undefined:
					if (L[h].id == el.id || L[h].resource == el.resource) {
						L.splice(h, 1);
						break;	// can't delete any children
					};
					// step down, if the node hasn't been deleted:
					delNodes(L[h].nodes, el);
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
		this.delete('node', [LIB.keyOf(e)]);

		// 2. Insert the node, if the predecessor exists somewhere:
		if (e.predecessor && LIB.iterateNodes(
			this.hierarchies,
			// continue searching until found:
			(nd: SpecifNode) => { return nd.id != e.predecessor },
			// insert the node after the predecessor:
			(ndL: SpecifNode[]) => {
				// @ts-ignore - e.predecessor is defined:
				let i = LIB.indexById(ndL as SpecifItem[], e.predecessor);
				if (i > -1) {
					delete e.predecessor;
					ndL.splice(i + 1, 0, e);
				};
			}
		))
			return true;

		// 3. Insert the node, if the parent exists somewhere:
		if (e['parent'] && LIB.iterateNodes(
			this.hierarchies,
			// continue searching until found:
			(nd: SpecifNode) => {
				if (nd.id == e['parent']) {
					if (!Array.isArray(nd.nodes)) nd.nodes = [];

					delete e['parent'];

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
	instanceTitleOf(el: SpecifInstance, opts: any): string {
		// Return the title of the resource or statement 
		// - in the language defined in opts
		// - add the icon, if opts.addIcon is true
		// - if no title is found and opts.neverEmpty is true, the id is returned
		var self = this;
		return function (el: SpecifInstance, opts: any): string {
			// Get the title of a resource or a statement;
			// ... from the properties or a replacement value in case of default.
			// 'el' is an original element without 'classifyProps()'.
			// It is assumed that the classes are always cached.
			if (typeof (el) != 'object') throw Error('First input parameter is invalid');
			if (!(el.properties || el['class'])) return '';

			// Lookup titles only in case of a resource serving as heading or in case of a statement:
			// @ts-ignore - of course resources have no subject, that's why we ask
			let resOpts = el.subject?
					// it is a statement:
					opts
				:
					// it is a resource:
					{
					//	lookupTitles: opts.lookupTitles && LIB.itemByKey(self.resourceClasses, el['class']).isHeading,
						targetLanguage: opts.targetLanguage
					};
			let ti = LIB.getTitleFromProperties(el.properties, self.propertyClasses, resOpts);

			// In case of a resource, we never want to lookup a title,
			// however in case of a statement, we do:
			// @ts-ignore - of course resources have no subject, that's why we ask
			if (el.subject) {
				// it is a statement
				if (!ti)
					// take the class' title by default:
					ti = LIB.classTitleOf(el['class'], self.statementClasses, opts);
			}
			else {
				// it is a resource
				if (opts && opts.addIcon && CONFIG.addIconToInstance && ti)
					ti = LIB.addIcon(ti, LIB.itemByKey(self.resourceClasses, el['class']).icon);
			};

// 			console.debug('instanceTitleOf',el,opts,ti);
			return ti.stripHTML();
		}(el, opts) || (opts.neverEmpty ? el.id : '');
	}
	resourcesByTitle(ti: string, opts: any) {
		if (ti) {
			// given the title of a resource, return the instance itself:
			return this.resources.filter(
				(r) => {
					if (opts.targetLanguage == 'any') {
					//	let tiVL = LIB.valuesByTitle(r, [CONFIG.propClassTitle], this);
						let tiVL = LIB.valuesByTitle(r, CONFIG.titleProperties, this);
						// length od tiVL should be 0..1, but certainly not any more than 1 title property per resource!
						if (tiVL.length > 0)
							for (var v of tiVL[0]) {
								// the property of class CONFIG.propClassTitle should be a multiLanguageText;
								// v is a single languageValue:
								if (v.text == ti) return true;
						};
						return false;
					}
					else
						return this.instanceTitleOf(r, opts) == ti
				}
			) as SpecifResource[];
		}
		else
			return [] as SpecifResource[];
	}
	clear(ctg?:string):void {
		if (ctg)
			// @ts-ignore - in this branch it is not undefined:
			this[app.standards.listName.get(ctg)].length = 0
		else
			// clear all lists, if undefined:
			for (var le of app.standards.listName.keys())
				// @ts-ignore - shouldn't be undefined:
				this[app.standards.listName.get(le)].length = 0;
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
		this.listName = app.standards.listName.get(ctg) as string;
		this.isEqual = eqF;
		this.isCompatible = compF;
		this.substitute = subsF;
	}
}
interface IExportParams {
	fileName: string;
	projectName: string;
}
class CProject {
	// Applies the project data (SpecIF data-set) to the respective data sources
	// - Common Cache (for all locally known projects)
	// - assigned Server(s)
//	context: string;
	// @ts-ignore - initialized by this.setMeta()
	id: SpecifId;
	// @ts-ignore - initialized by this.setMeta()
	title?: SpecifMultiLanguageText;
	// @ts-ignore - initialized by this.setMeta()
	description?: SpecifMultiLanguageText;
	// @ts-ignore - initialized by this.setMeta()
	generator?: string;
	// @ts-ignore - initialized by this.setMeta()
	generatorVersion?: string;
	// @ts-ignore - initialized by this.setMeta()
	createdAt?: SpecifDateTime;
	// @ts-ignore - initialized by this.setMeta()
	createdBy?: SpecifCreatedBy;

	// all project roles with permissions:
	roles: CRole[] = [];
	// the permissions of the current user, selected at login by his/her role:
	myItemPermissions: CItemPermissions[] = [];

	// Remember the ids of all types and classes, so they can be exported, even if they have no instances (yet);
	// store all keys without revision, so that the referenced elements can be updated without breaking the link:
	// ToDo: Reconsider! Can projects share classes, but use different revision levels?
	dataTypes: SpecifKeys = [];
	propertyClasses: SpecifKeys = [];
	resourceClasses: SpecifKeys = [];
	statementClasses: SpecifKeys = [];
	hierarchies: SpecifKeys = [];    	// reference the specifications (aka hierarchies, outlines) of the project.
	// @ts-ignore - initialized by this.setMeta()
	language: string;
	cache: CCache;
/*	server: URL // or servers ??
 	myRole = i18n.LblRoleProjectAdmin;
	cre;
	upd;
	del = app.title != i18n.LblReader;
	locked = app.title == i18n.LblReader; 
	exp: boolean = true;			// permission to export  */
	// @ts-ignore - initialized by this.setMeta()
	exportParams: IExportParams;
	exporting: boolean;		// prevent concurrent exports
	abortFlag: boolean;
	types: CElement[];

	constructor(cData: CCache) {
		// The common cache for all local projects:
		this.cache = cData;
	//	this.exp = true;
		this.exporting = false;		// prevent concurrent exports
		this.abortFlag = false;

		//	Create a table of types and relevant attributes:	
		this.types = [
			new CElement('dataType', LIB.equalDT, this.compatibleDT.bind(this), this.substituteDT.bind(this)),
			new CElement('propertyClass', LIB.equalPC, this.compatiblePC.bind(this), this.substitutePC.bind(this)),
			new CElement('resourceClass', LIB.equalRC, this.compatibleRC.bind(this), this.substituteRC.bind(this)),
			new CElement('statementClass', LIB.equalSC, this.compatibleSC.bind(this), this.substituteSC.bind(this))
		];
	};
	isLoaded(): boolean {
		return typeof (this.id) == 'string' && this.id.length > 0;
	};
	private setMeta(spD: SpecIF): void {
		// store a project's individual data apart from the common cache:
	//	this.context = spD.context;
		this.id = spD.id;
		this.title = spD.title;
		this.description = spD.description;
		this.language = spD.language || browser.language;

		this.generator = spD.generator;
		this.generatorVersion = spD.generatorVersion;
		this.createdAt = spD.createdAt;
		this.createdBy = spD.createdBy;
		this.exportParams = {
			projectName: LIB.languageTextOf(this.title, { targetLanguage: this.language }),
			fileName: LIB.languageTextOf(this.title, { targetLanguage: this.language })
		};
		// remember the hierarchies associated with this projects - the cache holds all;
		// store only the id, so that the newest revision will be selected on export:
		["hierarchies", "resourceClasses", "statementClasses", "propertyClasses", "dataTypes"].forEach(
			(list) => {
				// @ts-ignore - indexing by string is perfectly ok.
				for (var p of spD[list]) this[list].push({ id: p.id });
			}
		);
	/*	this.locked = app.title == i18n.LblReader; 
		this.exp = true; */

		if (spD.roles) {
			// In future, the roles and permissions may be imported with the project:
			this.roles = spD.roles
		}
		else {
			// ... but by default, they are created here:
		/*	this.roles.push(
				new CRole('Manager')
					.setItemPermissions(spD.id, 'A')
			); */
			this.roles.push(
				new CRole('Reader')
					.setItemPermissions(spD.id, 'R')
			);
			this.roles.push(
				new CRole('Supplier')
					.setItemPermissions(spD.id, 'R')
					//		.setItemPermissions("PC-CustomerStatus", 'RU')
					//		.setItemPermissions("PC-CustomerComment", 'RU')
					.setItemPermissions("PC-SupplierStatus", 'RU')
					.setItemPermissions("PC-SupplierComment", 'RU')
			);
			this.roles.push(
				new CRole('Customer')
					.setItemPermissions(spD.id, 'CRUD')
					.setItemPermissions("PC-SupplierStatus", 'R')
					.setItemPermissions("PC-SupplierComment", 'R')
			);
			this.roles.push(
				new CRole('Editor')
					.setItemPermissions(spD.id, 'CRUD')
			)
		};

		// find the itemPermissions of the current user for this project:
		let role = LIB.itemById(this.roles, app.me.myRole(spD.id));
		if (role) this.myItemPermissions = role.itemPermissions;
	};
	private getMeta(): CSpecIF {
		// retrieve a project's individual data apart from the common cache;
		// a new SpecIF data set is created, so this shall be called before the data is retrieved from the cache:
		var spD = new CSpecIF();
	//	spD.context = this.context;
		spD.id = this.id;
		spD.title = this.title;
		spD.description = this.description;
		spD.generator = this.generator;
		spD.generatorVersion = this.generatorVersion;
		spD.createdAt = this.createdAt;
		spD.createdBy = this.createdBy;
		return spD;
	};
	create(newD: SpecIF, opts: any): JQueryDeferred<void> {
		// create a project, if there is no project with the given id, or replace a project with the same id.
		// (The roles/permissions and the role assignment to users are preserved, when import via ReqIF-file is made)
		// If there is no newD.id, it will be generated by the server.
		// Use jQuery instead of ECMA Promises for the time being, because of progress notification.
		var cDO = $.Deferred(),
			self = this,  // make the class attributes and methods available within local function 'finalize'
			pend = 0;

		this.abortFlag = false;

//		console.debug('app.projects.selected.cache.create',newD);

		new CSpecIF().set(newD,opts)
			.then(
				(nD: CSpecIF) => {
					// Create the project
					// The project meta-data and each item are created as a separate document in a document database;
					// at the same time the cache is updated.
					cDO.notify(i18n.MsgLoadingTypes, 30);
					this.setMeta(nD);
					pend = app.standards.iterateLists(
						(ctg: string, listName: string) => {
							// @ts-ignore - the indexing works fine:
							this.createItems(ctg, nD[listName])
								.then(finalize, cDO.reject);
						}
					)
				},
				cDO.reject
			/*	(xhr) => {
				//	cDO.reject({ status: 995, statusText: i18n.lookup('MsgImportFailed', newD.title) })
				} */
			);
		return cDO;

		function finalize(): void {
			// ToDo: Update the server !
			if (--pend < 1) {
				cDO.notify(i18n.MsgLoadingFiles, 100);
				self.createFolderWithGlossary(opts)
				.then(
					() => {
						return self.createFolderWithUnreferencedResources(opts)
					}
				)
				.then(
					() => {
						self.hookStatements();
						self.deduplicate(opts);
						cDO.resolve();
					}
				)
				.catch( cDO.reject );
			}
		}
	}
	read(opts?: any): Promise<SpecIF> {
		// Extract all items of this project from the cache containing elements of multiple projects
		var exD = this.getMeta();

		return new Promise(
			(resolve, reject) => {
				// Get the memorized hierarchies of this project - except the folder with unreferenced resources:
				this.readItems(
					'hierarchy',
					this.hierarchies.filter((n: SpecifKey) => { return !n.id.includes("FolderUnreferencedResources-"); }),
					opts
				)
				.then(
					(hL) => {
						exD.hierarchies = hL as SpecifNode[];
//						console.debug('1', simpleClone(exD));
						return this.readItems('resource', LIB.referencedResources(this.cache.resources, hL), opts)
					}
				)
				.then(
					(rL) => {
						exD.resources = rL as SpecifResource[];
//						console.debug('2', simpleClone(exD));
						return this.readItems('statement', flt, opts);

						function flt(s:SpecifStatement) {
							let rL = exD.resources;
							return LIB.indexByKey(rL, s.subject) > -1 && LIB.indexByKey(rL, s.object) > -1
						}
					}
				)
				.then(
					(sL) => {
						exD.statements = sL as SpecifStatement[];
						// collect the resourceClasses referenced by the resources of this project:
						// start with the stored resourceClasses of this project in case they have no instances (yet):
						// @ts-ignore - ts-compiler is very picky, here
						let rCL: SpecifKeys = [].concat(this.resourceClasses),
							rcLen = this.resourceClasses.length;
						// add those actually used by the project - avoiding duplicates, of course;
						// in fact, this shouldn't happen:
						for( var r of exD.resources ) {
							// assuming all used classes have the same revision
							LIB.cacheE(rCL, r['class']);
							if (rcLen < rCL.length) {
								console.warn('Project with id ' + this.id + ' references a resource with id ' + r.id + ', which has a resourceClass not memorized in the project.');
								rcLen = rCL.length;
							};
						};
//						console.debug('3', simpleClone(exD), rCL);
						return this.readItems('resourceClass', rCL, opts);
					}
				)
				.then(
					(rCL) => {
						exD.resourceClasses = rCL as SpecifResourceClass[];
						// collect the statementClasses referenced by the resources of this project:
						// start with the stored statementClasses of this project in case they have no instances (yet):
						// @ts-ignore - ts-compiler is very picky, here
						let sCL: SpecifKeys = [].concat(this.statementClasses),
							scLen = this.statementClasses.length;
						// add those actually used by the project - avoiding duplicates, of course;
						// in fact, this shouldn't happen:
						for (var s of exD.statements ) {
							// assuming all used classes have the same revision
							LIB.cacheE(sCL, s['class']);
							if (scLen < sCL.length) {
								console.warn('Project with id ' + this.id + ' references a statement with id ' + s.id + ', which has a statementClass not memorized in the project.');
								scLen = sCL.length;
							}
						};
//						console.debug('4', simpleClone(exD), sCL);
						return this.readItems('statementClass', sCL, opts);
					}
				)
				.then(
					(sCL) => {
						exD.statementClasses = sCL as SpecifStatementClass[];
						// collect the propertyClasses referenced by the resourceClasses and statementClasses of this project:
						// start with the stored propertyClasses of this project in case they have no references (yet):
						// @ts-ignore - ts-compiler is very picky, here
						let pCL: SpecifKeys = [].concat(this.propertyClasses);
						// add those actually used by the project - avoiding duplicates, of course:
						// @ts-ignore - both resourceClasses and statementClasses have a list of propertyClasses:
						for (var eC of exD.resourceClasses.concat(exD.statementClasses) ) {
							// assuming all used classes have the same revision
							for (var pC of eC.propertyClasses) {
								LIB.cacheE(pCL, pC);
							}
						};
//						console.debug('5', simpleClone(exD),pCL);
						return this.readItems('propertyClass', pCL, opts);
					}
				)
				.then(
					(pCL) => {
						exD.propertyClasses = pCL as SpecifPropertyClass[];
						// collect the dataTypes referenced by the propertyClasses of this project:
						// start with the stored dataTypes of this project in case they have no references (yet):
						// @ts-ignore - ts-compiler is very picky, here
						let dTL: SpecifKeys = [].concat(this.dataTypes);
						// add those actually used by the project - avoiding duplicates, of course:
						for( var pC of exD.propertyClasses ) {
							// assuming all used classes have the same revision
							LIB.cacheE(dTL, pC['dataType']);
						};

//						console.debug('6', simpleClone(exD),dTL);
						return this.readItems('dataType', dTL, opts)
					}
				)
				.then(
					(dTL) => {
						exD.dataTypes = dTL as SpecifDataType[];
						// collect the files referenced by the resource properties of this project:
						let fL: string[] = [],
							dT: SpecifDataType;
						for (var r of exD.resources) {
							for (var p of r.properties) {
								dT = LIB.dataTypeOf(p['class'], this.cache);
								if (dT && dT.type == SpecifDataTypeEnum.String) {
									// Cycle through all values:
									for (var v of p.values) {
										// Cycle through all languages of a value:
										for (var l of v) {
											// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec#specifications
											let re = /data="([^"]+)"/g,
												mL;
											// Get multiple references in a single property:
											// @ts-ignore - in case of SpecifDataTypeEnum there is a property 'text'
											while ((mL = re.exec(l.text)) !== null) {
												// mL[1] is the file title
												LIB.cacheE(fL, mL[1]);
											}
										}
									}
								}
							}
						};
//						console.debug('7', simpleClone(exD),fL);
						return this.readItems('file', (f: IFileWithContent) => { return fL.includes(f.title) }, opts);
					}
				)
				.then(
					(fL) => {
						exD.files = fL as IFileWithContent[];
//						console.debug('8', simpleClone(exD));
						return exD.get(opts);
					}
				)
				.then(resolve)
				.catch(reject)

			} 
		);
    }
/*	update(newD: SpecIF, opts: any): Promise<void> {
		var uDO = $.Deferred();
		newD = new CSpecIF(newD); // transform to internal data structure
		uDO.resolve();
		return uDO;
	} */

	adopt(newD: SpecIF, opts?: any): JQueryDeferred<void> {
		// First check whether BPMN collaboration and process have unique ids:
//		console.debug('adopt project',newD);

		var aDO = $.Deferred(),
			self = this,  // make the class attributes and methods available within local function 'finalize'
			dta = this.cache,
			pend = 0;

		new CSpecIF().set(newD,opts)
			.then(

				// 1. Integrate the types:
				//    a) if different id, save new one and use it.
				//       (the case of different id and same content will be covered by deduplicate() at the end)
				//    b) if same id and same content, just use it (no action)
				//    c) if same id and different content, save with new id and update all references
				(newD: CSpecIF) => {
//					console.debug('adopt #1',simpleClone(self.cache),simpleClone(newD));
					self.types.forEach((ty:CElement) => {
						// @ts-ignore - dta is defined in all cases and the addressing using a string is allowed
						if (Array.isArray(newD[ty.listName])) {
							let itmL: SpecifItem[] = [];
							// @ts-ignore - dta is defined in all cases and the addressing using a string is allowed
							newD[ty.listName].forEach((newT) => {
								// newT is a type/class in new data
								// types are compared by id:
								// @ts-ignore - indexing by string works fine
								let idx = LIB.indexByKey(dta[ty.listName], newT);
							//	let idx = LIB.indexBy(dta[ty.listName], 'title', newT.title);   // does certainly not yield a good result in case of dataTypes
								if (idx < 0) {
									// a) there is no item with the same id
									itmL.push(newT);
								}
								else {
									// there is an item with the same id.
									//	if( !ty.isEqual( self.cache[ty.listName][idx], newT) ) {
									// @ts-ignore - indexing by string works fine
									if (!ty.isCompatible(dta[ty.listName][idx], newT, { mode: "include" })) {
										// there is an item with the same id and different content.
										// c) create a new id and update all references:
										// Note: According to the SpecIF schema, dataTypes may have no additional XML-attribute
										// ToDo: In ReqIF an attribute named "Reqif.ForeignId" serves the same purpose as 'alterId':
										let alterId = LIB.keyOf(newT);
										newT.id += '-' + simpleHash(new Date().toISOString());
										ty.substitute(newD, newT, alterId );
										itmL.push(newT);
										console.info("When adopting a project" + (newD.id ? " with id " + newD.id : "")
											+	", a class with same id and incompatible content has been encountered: " + alterId.id
											+	"; it has been saved with a new identifier " + newT.id + ".");
									};
									// b) no action
								};
							});
							// @ts-ignore - newD[ty.listName] is a valid address
							console.info((newD[ty.listName].length - itmL.length) + " " + ty.listName + " adopted and " + itmL.length + " added.");
							pend++;
							self.createItems(ty.category, itmL)
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
							self = self,  // make the class attributes and methods available within local function 'finalize'
							dta = self.cache,
							pend = 0;
//						console.debug('adopt #1',simpleClone(self.cache),simpleClone(newD));
						self.types.forEach((ty) => {
							// @ts-ignore - dta is defined in all cases and the addressing using a string is allowed
							if (Array.isArray(newD[ty.listName])) {
							};
						}); */
//						console.debug('#2',simpleClone(dta),simpleClone(newD));

					// 2. Integrate the instances:
					//    a) if different title or type, save new one and use it.
					//    b) if same title and type, just use it and update all references
					if (Array.isArray(newD.resources)) {
						let itmL: SpecifResource[] = [];
						newD.resources.forEach((newR: SpecifResource) => {
							// newR is a resource in the new data

							// Adopt resource with the same key, title and class right away;
							// obviously there is no need to update any reference:
							let existR: SpecifResource = LIB.itemByKey(dta.resources, newR);  // resource in the existing data
							if (existR && self.equalR(existR, newR)) return;

							// Adopt a resource, only if it's class belongs to a certain collection of class-titles and is not excluded from deduplication.
							// The folders are excluded from consolidation, because it may happen that there are
							// multiple folders with the same name but different description in different locations of the hierarchy.
							// The title of the resource class signifies the main (abstract) type for model integration,
							// whereas the property with a class title CONFIG.propClassType (dcterms:type) is used to store the type of the original notation.

							// For matching, the title and fundamental type are used. 
							// The title can have multiple languages - so far only the project's or browser's language (fallback when initializing this.language)
							// are used, so the matching may lead to different results depending on the language selected.
							let selOpts = Object.assign(
								{},
								opts,
								{ targetLanguage: self.language || newD.language /*, lookupTitles: true */ }
							);
							if ( LIB.hasResClass(newR, CONFIG.modelElementClasses.concat(CONFIG.diagramClasses),newD)
								&& !LIB.hasType(newR, CONFIG.excludedFromDeduplication, newD, opts)
						//	if (CONFIG.modelElementClasses.concat(CONFIG.diagramClasses).indexOf(LIB.classTitleOf(newR['class'], newD.resourceClasses)) > -1
						//		&& CONFIG.excludedFromDeduplication.indexOf(LIB.displayValueOf(LIB.valuesByTitle(newR, [CONFIG.propClassType], newD)[0])) < 0
							) {
								// Check for an exsiting resource with the same title:
								existR = self.cache.resourcesByTitle(LIB.getTitleFromProperties(newR.properties, newD.propertyClasses, selOpts), selOpts)[0] as SpecifResource;
								// If there is a resource with the same title ... and if the types match;
								// the class title reflects the role of it's instances ...
								// and is less restrictive than the class ID:
//								console.debug('~1',newR,existR?existR:'');
								if (existR
									&& !LIB.hasType(existR, CONFIG.excludedFromDeduplication, dta, opts)
									&& LIB.classTitleOf(newR['class'], newD.resourceClasses) == LIB.classTitleOf(existR['class'], dta.resourceClasses)
						//			&& CONFIG.excludedFromDeduplication.indexOf(LIB.displayValueOf(LIB.valuesByTitle(existR, [CONFIG.propClassType], dta)[0])) < 0
						//			&& LIB.valuesByTitle(newR,[CONFIG.propClassType],newD)==LIB.valuesByTitle(existR,[CONFIG.propClassType],dta)
								) {
//									console.debug('~2',existR,newR);
									// There is an item with the same title and type,
									// adopt it and update all references:
									self.substituteR(newD, existR, newR, { rescueProperties: true });

									// Memorize the replaced id, if not yet listed:
									if (!Array.isArray(existR.alternativeIds))
										existR.alternativeIds = [];
									LIB.cacheE(existR.alternativeIds, {id:newR.id,revision:newR.revision,project:newD.id});

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
							if (LIB.duplicateId(dta, newR.id)) {
								let newId = LIB.genID('R-');
								// first assign new ID to all references;
								// no need to specify the class in the second parameter, as it is equal to the class of newR 
								// ... and thus there is no need to substitute the class:
								self.substituteR(newD, { id: newId } as SpecifResource, newR);
								// and then to the resource itself:
								newR.id = newId;
							};
//							console.debug('+ resource',newR);
							itmL.push(newR)
						});
						console.info((newD.resources.length - itmL.length) + " resources adopted and " + itmL.length + " added.");
						pend++;
						self.createItems('resource', itmL)
							.then(finalize, aDO.reject);
					};
//					console.debug('#3',simpleClone(dta),simpleClone(newD));

					// 3. Create the remaining items;
					// self.createItems('statement', newD.statements) could be called, 
					// but then the new elements would replace the existing ones.
					// In case of 'adopt' the existing shall prevail!
					if (Array.isArray(newD.statements)) {
						let itmL: SpecifStatement[] = [];
						newD.statements.forEach((nS: SpecifStatement) => {
							// newR is a resource in the new data

							// Adopt statement with the same id, title and class right away:
							let eS: SpecifStatement = LIB.itemByKey(dta.statements, nS);  // statement in the existing data
							if (eS && self.equalS(eS, nS)) return;
							// Else, create new element:
							itmL.push(nS);
						});
						console.info((newD.statements.length - itmL.length) + " statements adopted and " + itmL.length + " added.");
						pend++;
						self.createItems('statement', itmL)
							.then(finalize, aDO.reject);
					};
					pend++;
					self.createItems('hierarchy', newD.hierarchies)
						.then(finalize, aDO.reject);

					if (Array.isArray(newD.files)) {
						let itmL: any[] = [];
						newD.files.forEach((nF: any) => {
							// newR is a resource in the new data

							// Adopt equal file right away:
							let eF: any = LIB.itemByKey(dta.files, nF);  // file in the existing data
							if (eF && self.equalF(eF, nF)) return;
							// Else, create new element:
							itmL.push(nF);
						});
						console.info((newD.files.length - itmL.length) + " files adopted and " + itmL.length + " added.");
						pend++;
						self.createItems('file', itmL)
							.then(finalize, aDO.reject);
					};
				},
				aDO.reject
			);
		return aDO;

		function finalize(): void {
			// ToDo: Save changes from deduplication to the server.
			if (--pend < 1) {
				// 4. Finally some house-keeping:
//				console.debug('#5',simpleClone(dta),opts);
				self.createFolderWithResourcesByType(opts)
				.then(
					() => {
						return self.createFolderWithGlossary(opts)
					}
				)
				.then(
					() => {
						return self.createFolderWithUnreferencedResources(opts)
					}
				)
				.then(
					() => {
						self.hookStatements();
						self.deduplicate(opts);
						aDO.resolve()
					}
				)
				.catch( aDO.reject);
			};
		}
	}
	createItems(ctg: string, itmL: SpecifItem[] | INodeWithPosition[]): Promise<void> {
		// Create one or more items of a given category in cache and in the remote store (server).
//		console.debug('createItems', ctg, itmL );
		let self = this;

		// - itmL is list of js-objects
		// - ctg is a member of [dataType, propertyClass, resourceClass, statementClass, resource, statement, hierarchy, node]
		return new Promise(
			(resolve) => {
				function isRoot(nd: INodeWithPosition): boolean {
					// Return true, if the node is placed in the hierarchies folder as root element:
					return (!nd.parent
						&& (!nd.predecessor || LIB.indexByKey(self.hierarchies, LIB.makeKey(nd.predecessor))>-1 )
					);
				}
				switch (ctg) {
					case 'dataType':
					case 'propertyClass':
					case 'resourceClass':
					case 'statementClass':
						// Update the project's remembering list;
						// but don't keep the revision, as it can change:
						LIB.cacheL(self[app.standards.listName.get(ctg)], LIB.forAll(itmL, (el: SpecifClass) => { return { id: el.id } }));
						break;
					case 'hierarchy':
					case 'node':
						for (var el of itmL) {
							// all nodes to become hierarchy root elements shall be memorized in the selected project:
							if (isRoot(el as INodeWithPosition))
								LIB.cacheE(self.hierarchies, ((el as INodeWithPosition).predecessor ? { id: el.id, predecessor: LIB.makeKey((el as INodeWithPosition).predecessor) } : { id: el.id }));
						};
				//		break;
				//	case 'file':
				//	case 'resource':
				//	case 'statement':
				};

			/*	// if current user can create an item, he has the other permissions, as well:
				addPermissions( item );
				for( var i of itemL ) {
			 		i.createdAt = new Date().toISOString();
					i.createdBy = i.changedBy; 
				}; */
				self.cache.put(ctg, itmL);
				resolve();
			}
		);
	}
	private readClassesWithParents(ctg: string, toGet: SpecifKeys) {
		// Applies to resourceClasses and statementClasses;
		// classes are always cached, so there is no need for a call with promise.
		let resL: SpecifItem[] = [];
		do {
			let rL = this.cache.get(ctg, toGet);
			toGet = [];
			for (var c of rL) {
				// @ts-ignore - checking for extends, because it doesn't exist on all elements
				if (c['extends']) {
					// The propoerties of the extending (parent's) class first:
					// @ts-ignore - checking for extends, because it doesn't exist on all elements
					toGet.unshift(c['extends']);
				};
			};
			resL = rL.concat(resL);
		} while (toGet.length > 0);
		return resL;
	}
	readExtendedClasses(ctg: string, toGet: SpecifKeys) {
		// Applies to resourceClasses and statementClasses;
		// classes are always cached, so there is no need for a call with promise.
		let self = this,
			resL: any = [];
		for (var clk of toGet) {
			resL.push( extendClass(clk) )
		};
		return resL;

		function extendClass(k:SpecifKey) {
			let rC:any = {};
			self.readClassesWithParents(ctg, [k])
				// A list with classes is returned, the ancestors first and the requested class last.
				// - Starting with most elderly, copy to and potentially overwrite the attributes of rC
				// - Also the list of eligible subjectClasses and objectClasses are overwritten,
				//   because it is assumed that more specialized statementClasses have fewer eligible subjectClasses and objectClasses
				// - Just the propertyClasses are collected along the line of ancestors ... as usual in object oriented programming.
				.forEach(
					(cl: SpecifItem) => {
						for (let att in cl) {
						//	if (["propertyClasses", "subjectClasses", "objectClasses"].includes(att) && Array.isArray(cl[att]) && Array.isArray(rC[att]))
							// @ts-ignore - indexing an object with a string is perfectly OK
							if (["propertyClasses"].includes(att) && Array.isArray(cl[att]) && Array.isArray(rC[att]))
								// @ts-ignore - indexing an object with a string is perfectly OK
								LIB.cacheL(rC[att], cl[att])
							else
								// @ts-ignore - indexing an object with a string is perfectly OK
								rC[att] = cl[att]
                        }
					}
				);
			delete rC['extends'];
			return rC
        }
	}
	readItems(ctg: string, itemL: SpecifKeys | Function | string, opts?: any): Promise<SpecifItem[]> {
		// Read one or more items of a given category either from cache or from the permanent store (server), otherwise:
//		console.debug('readItems', ctg, item, opts);
		// - ctg is a member of [dataType, propertyClass, resourceClass, statementClass, resource, statement, hierarchy, node]
		if (!opts) opts = { reload: false, timelag: 10 };
		let self = this;

		return new Promise(
			(resolve) => {
				/*	if (opts.reload) {
						// try to get the items from the server, but meanwhile:
						reject({ status: 745, statusText: "No server available" })
					}
					else { */
				// return the cached object asynchronously:

				// the list of model element instances must include all SpecIF elements which are not remembered by the project:
				if (itemL == "all" && ['resource', 'statement', 'file', 'node'].includes(ctg))
					throw Error("Don't request 'all' model element instances, since the result list can be very long!");

				// delay the answer a little, so that the caller can properly process a batch:
				setTimeout(() => {
					let items: SpecifItem[] = [],
						toGet: SpecifKeys = itemL == "all" ?
									// @ts-ignore- index type is ok
									this[app.standards.listName.get(ctg)]  // only those remembered by the project
									: itemL;

					if (opts.extendClasses && ['resourceClass', 'statementClass'].includes(ctg)) {
						// Special case: Extend the classes:
						items = this.readExtendedClasses(ctg, toGet);
					}
				/*	else if (opts.withExtendedClasses && ['resourceClass', 'statementClass'].includes(ctg)) {
						// Special case: Add the extended classes to the list:
						items = this.readClassesWithParents(ctg, toGet);
					}  */
					else {
						// Normal case: Item can't have an extended class or is requested without:
						items = this.cache.get(
							ctg,
							toGet
						);
						// Normalize the properties if desired:
						if (opts.showEmptyProperties && ['resource', 'statement'].includes(ctg)) {
							items.forEach((itm: any) => {
								// classes are alwways cached, so we can use this.cache:
								itm.properties = normalizeProperties(itm)
							})
						}
					};

				/*	// add the permissions:
					if (CONFIG.categoriesWithPermission.includes(ctg))
						items.forEach(
							(item) => {
								item.permissions = {}
                            }
						); */

//					console.debug('readItems',opts,items);
					resolve(items);
				}, opts.timelag);
				//	};
			}
		);

		function normalizeProperties(el: SpecifInstance): SpecifProperty[] {
			// el: original instance (resource or statement)
			// Create a list of properties in the sequence of propertyClasses of the respective class.
			// Use those provided by the instance's properties and fill in missing ones with default (no) values.
			// Property classes must be unique!

			// Check uniqueness of property classes:
			if (el.properties) {
				let idL: string[] = [],
					pCid: string;
				el.properties.forEach((p: SpecifProperty) => {
					pCid = p['class'].id;
					if (idL.indexOf(pCid) < 0)
						idL.push(pCid);
					else
						console.warn('The property class ' + pCid + ' of element ' + el.id + ' is occurring more than once.');
				});
			};

			let nL: SpecifProperty[] = [],  // normalized property list
				pCL: SpecifPropertyClass[],
				// iCs: instance class list (resourceClasses or statementClasses),
				// the existence of subject (or object) let's us recognize that it is a statement:
				// @ts-ignore - existance of subject signifies whether it is a resource or statement
				ctg = (el.subject ? "statementClass" : "resourceClass"),
				iCs = self.readExtendedClasses(ctg, [el["class"]]);

			// Obtain the full propertyClasses referenced by iCs[0]:
			pCL = self.cache.get("propertyClass", iCs[0].propertyClasses) as SpecifPropertyClass[];
			// assuming that the property classes are unique:

			// Add the properties in sequence of the propertyClass keys as specified by the instance class:
			pCL.forEach((pC: SpecifPropertyClass): void => {
				// skip hidden properties:
				if (CONFIG.hiddenProperties.includes(pC.title)) return;

				let p = theListItemReferencingByClass(el.properties, pC);
				// take the original property if it exists or create an empty one, otherwise:
				nL.push(p || { class: LIB.makeKey(pC.id), values: [] })
			});
			//			console.debug('normalizeProps result',simpleClone(nL));
			return nL; // normalized property list

			function theListItemReferencingByClass(L: SpecifProperty[] | undefined, cl: SpecifPropertyClass | undefined): any {
				if (L && cl) {
					// Return the item in list 'L' whose class references pC:
					for (var l of L)
						if (LIB.references(l['class'], cl)) return l // return list item
				}
			}
		}
	}
	updateItems(ctg: string, itmL: SpecifItem[]): Promise<void> {
		// ctg is a member of [resource, statement, hierarchy], 'null' is returned in all other cases.
		function updateCh(itm: SpecifItem): void {
			itm.changedAt = new Date().toISOString();
			if (app.me.userName != CONFIG.userNameAnonymous )
				itm.changedBy = app.me.userName;
		}

		return new Promise(
			(resolve) => {
				switch (ctg) {
					case 'node':
						throw Error("Nodes can only be created, read or deleted");
				//	case 'resource':
				//	case 'statement':
				//	case 'hierarchy':
				//	case 'file':
					// no break
					default:
//						console.debug('updateItems - cache', ctg );
						itmL.forEach(updateCh)
						this.cache.put(ctg, itmL)
				};
				resolve()
			}
		)
	}
	deleteItems(ctg: string, itmL: SpecifKeys): Promise<void> {
		// ctg is a member of [dataType, resourceClass, statementClass, propertyClass, resource, statement, hierarchy]
		/*			function isInUse( ctg, itm ) {
							function dTIsInUse( L, dT ) {
								let i=null;
								for( var e=L.length-1;e>-1;e-- ) {
									i = L[e].propertyClasses?LIB.indexBy(L[e].propertyClasses,'dataType',dT.id):-1;
		//							console.debug('dTIsInUse',dT,L,e,i);
									if( i>-1 ) return true
								};
								return false
							}
							function aCIsInUse( ctg, sT ) {
								let c = ctg.substr(0,ctg.length-4),  // xyzType --> xyz, xyzClass ??
									L = cacheOf(c),
									i = LIB.indexBy(L,ctg,sT.id);
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
									i = L[e].properties?LIB.indexBy(L[e].properties,'class',pT.id):-1;
		//							console.debug('pCIsInUse property class',pT,L,e,i);
									if( i>-1 ) return true
								};
								return false
							}
		//				console.debug('isInUse',ctg,itmL);
						switch( ctg ) {
							case 'dataType':		return dTIsInUse(self.cache.allClasses,itm);
							case 'resourceClass':
							case 'statementClass':	return aCIsInUse(ctg,itm);
							case 'class':			return pCIsInUse(self.cache.resources,itm)
														|| pCIsInUse(self.cache.hierarchies,itm)
														|| pCIsInUse(self.cache.statements,itm);
						};
						return false
					}  */

		//		console.debug('deleteItems',ctg,itmL);
		return new Promise(
			(resolve, reject) => {
				// Do not delete types which are in use;
				switch (ctg) {
					case 'dataType':
					case 'propertyClass':
					case 'resourceClass':
					case 'statementClass':	
				/*		if( Array.isArray(itmL) ) return null;	// not yet supported
						if( isInUse(ctg,item) ) {
							reject({status:972, statusText:i18n.Err400TypeIsInUse});
							return;
						};
						// no break;  */
					case 'node':
					case "hierarchy":
						// delete also the respective keys remembered by the project;
						// - a node can also be a hierarchy, thus try to remove it as well;
						// - disregard the revision:
						let listName = app.standards.listName.get(ctg=='node'?'hierarchy':ctg);
						for (var i of itmL)
							LIB.uncacheE(this[listName], { id: i.id });
						// no break; 
				//	case 'file':
					default:
//						console.debug('deleteItems',ctg,itmL);
						if (this.cache.delete(ctg, itmL))
							break;
						reject( new xhrMessage( 999, 'One or more items of ' + ctg + ' not found and thus not deleted.' ));
						return;
				};
				resolve()
			}
		)
	};
	makeEmptyResource(rC: SpecifResourceClass): Promise<SpecifResource> {
		// Create an empty form (resource instance) for the resource class rC:
		// see https://codeburst.io/a-simple-guide-to-es6-promises-d71bacd2e13a
		// and https://javascript.info/promise-chaining
		return new Promise(
			(resolve, reject) => {
				// Get the class's permissions. So far, it's property permissions are not loaded ...
				var res: SpecifResource;

				this.readItems('resourceClass', [LIB.keyOf(rC)], { extendClasses: true, reload: true })
					.then(
						(rCL) => {
//							console.debug('makeEmptyResource resourceClasses', rCL);
							// return an empty resource instance of the given type; 
							res = {
								id: LIB.genID('R-'),
								class: LIB.makeKey(rCL[0].id),
								//	permissions: rCL[0].permissions || { cre: true, rea: true, upd: true, del: true },
								properties: [],
								changedAt: new Date().toISOString()
							};
//							console.debug('makeEmptyResource propertyClasses', pCL);
							return this.readItems('propertyClass', (rCL[0] as SpecifResourceClass).propertyClasses, { reload: true })
						}
					)
					.then(
						(pCL: SpecifItem[]) => {
							res.properties = LIB.forAll(pCL, LIB.createProp);
							resolve(res)
						}
					)
					.catch(reject);
			}
		);
	}

	private hookStatements(): void {
		// For all statements with a loose end, hook the resource
		// specified by title or visibleId in a proprietory attribute resourceToLink.
		// - Used by ioXLS.
		// - ioReqIF may list statements with subjects or objects which are not present in the same SpecIF data-set;
		//   in contrast to the method used here, the reference is by id.
		//   Thus upon import, no 'hooking' is needed in case of a data-set originating from ioReqIF.
		var self = this,
			dta = this.cache,
			opts = {
			//	lookupTitles: false,
				targetLanguage: 'any',
				addIcon: false
			};
//		console.debug('hookStatements',dta);
		let toReplace: SpecifStatement[] = [];
		(dta.get("statement", "all") as IIncompleteStatement[]).forEach(
			(st) => {
				// Check every statement, if it is incomplete:
				if (st.resourceToLink) {
					// Find the resource with a value of property titled CONFIG.propClassId:
					let oL = itemsByVisibleId(st.resourceToLink),
						o = oL.length > 0 ?
								oL[0]
							:	// Find the resource with the given title:
								dta.resourcesByTitle(st.resourceToLink, opts)[0];
	//				console.debug('hookStatements object',o);
					if (o) {
						st.object = LIB.keyOf(o);
						// @ts-ignore - resourceToLink shall be deleted, so that st becomes a SpecifStatement
						delete st.resourceToLink;
						toReplace.push(st)
						return;
					};
				};
			}
		);
		if (toReplace.length > 0) dta.put('statement', toReplace);
		return;

		function itemsByVisibleId(vId: string): SpecifResource[] {
			// return a list with all elements in L having a property 
			// containing a visible id with value vId;
			// should only be one resulting element:
			return dta.get(
				"resource",
				// filter function:
				(r: SpecifResource) => {
					// loop to find the *first* occurrence:
					for (var p of r.properties ) {
						// Check the configured ids:
					//	if (CONFIG.idProperties.includes(vocabulary.property.specif(LIB.classTitleOf(p['class'], dta.propertyClasses)))
						if (CONFIG.idProperties.includes(LIB.classTitleOf(p['class'], dta.propertyClasses))
							&& LIB.languageTextOf(p.values[0], { targetLanguage: self.language }) == vId)
							return true;
					};
					return false
				//	return visibleIdOf(r) == vId
				}
			) as SpecifResource[]

		/*	function visibleIdOf(r: SpecifResource): string | undefined {
				if (r && r.properties) {
				//	let prj = app.projects.selected.cache;
				//	let prj = this.cache;
					// loop to find the *first' occurrence:
					for (var a = 0, A = r.properties.length; a < A; a++) {
						// Check the configured ids:
						if (CONFIG.idProperties.includes(vocabulary.property.specif(LIB.classTitleOf(r.properties[a]['class'], dta.propertyClasses))))
							return LIB.languageTextOf(r.properties[a].values[0], { targetLanguage: self.language })
					};
				};
				//	return undefined
			} */
		}
	}
	private deduplicate(opts:any): void {
		// Uses the cache.
		// ToDo: update the server.
		if (!opts || !opts.deduplicate) return;

		let dta = this.cache,
			lst: SpecifItem[], r: number, n: number;
//		console.debug('deduplicate',simpleClone(dta));

		// 1. Deduplicate equal types having different ids;
		// the first of an equivalent pair in the list is considered the reference or original ... and stays,
		// whereas the second in a pair is removed.
		this.types.forEach((ty) => {
			// @ts-ignore - indexing by string works fine
			lst = dta.get(ty.category,this[ty.listName]);
			// skip last loop, as no duplicates can be found:
			for (n = lst.length - 1; n > 0; n--) {
				for (r = 0; r < n; r++) {
//					console.debug( '##', lst[r],lst[n],ty.isEqual(lst[r],lst[n]) );
					// Do it for all types:
					if (ty.isEqual(lst[r], lst[n])) {
						// Are equal, so substitute it's ids by the original item:
						ty.substitute(dta, lst[r], lst[n]);
						console.info(ty.category + " with id=" + lst[n].id + " has been removed because it is a duplicate of id=" + lst[r].id);
						// ... and remove the duplicate item:
						this.deleteItems(ty.category,[LIB.keyOf(lst[n])]);
						// skip the remaining iterations of the inner loop:
						break
					}
				}
			}
		});
//		console.debug( 'deduplicate 1', simpleClone(dta) );

		// 2. Remove duplicate resources:
		lst = dta.get('resource',"all");
		// skip last loop, as no duplicates can be found:
		for (n = lst.length - 1; n > 0; n--) {
			for (r = 0; r < n; r++) {
				// Do it for all model-elements and diagrams,
				// but exclude process gateways and generated events for optional branches:
//				console.debug( 'duplicate resource ?', rR, nR );
				if (CONFIG.modelElementClasses.concat(CONFIG.diagramClasses).includes(LIB.classTitleOf((lst[r] as SpecifResource)['class'], dta.resourceClasses))
					&& this.equalR(lst[r] as SpecifResource, lst[n] as SpecifResource)
					&& !LIB.hasType(lst[r], CONFIG.excludedFromDeduplication, dta, opts)
					&& !LIB.hasType(lst[n], CONFIG.excludedFromDeduplication, dta, opts)
				//	&& CONFIG.excludedFromDeduplication.indexOf(LIB.displayValueOf(LIB.valuesByTitle(lst[n], [CONFIG.propClassType], dta)[0])) < 0
				//	&& CONFIG.excludedFromDeduplication.indexOf(LIB.displayValueOf(LIB.valuesByTitle(lst[r], [CONFIG.propClassType], dta)[0])) < 0
				) {
					// Are equal, so remove the duplicate resource:
//					console.debug( 'duplicate resource', rR, nR, LIB.valuesByTitle( nR, [CONFIG.propClassType], dta ) );
					this.substituteR(dta, lst[r] as SpecifResource, lst[n] as SpecifResource, Object.assign({ rescueProperties: true, targetLanguage: 'default' }, opts));
					console.info("Resource with id=" + lst[n].id + " and class=" + (lst[n] as SpecifResource)['class'].id + " has been removed because it is a duplicate of id=" + lst[r].id);
					this.deleteItems('resource', [LIB.keyOf(lst[n])]);
					// skip the remaining iterations of the inner loop:
					break
				}
			}
		};
//		console.debug( 'deduplicate 2', simpleClone(dta) );

		// 3. Remove duplicate statements:
		lst = dta.get('statement', "all");
		// skip last loop, as no duplicates can be found:
		for (n = lst.length - 1; n > 0; n--) {
			for (r = 0; r < n; r++) {
				// Do it for all statements:
				if (this.equalS(lst[r] as SpecifStatement, lst[n] as SpecifStatement)) {
					// Are equal, so remove the duplicate statement:
					// @ts-ignore - the elements are defined
					console.info("Statement with id=" + lst[n].id + " and class=" + (lst[n] as SpecifStatement)['class'].id + " has been removed because it is a duplicate of id=" + lst[r].id);
					this.deleteItems('statement', [LIB.keyOf(lst[n])]);
					// skip the remaining iterations of the inner loop:
					break
				}
			}
		};
//		console.debug( 'deduplicate 3', simpleClone(dta) );
	//	return undefined
	}
	private createFolderWithResourcesByType(opts: any): Promise<void> {
		// Collect all business processes, requirements etc according to 'resourcesToCollect':
		let self = this,
			dta = this.cache;
		const resourcesToCollect = [
			{ type: CONFIG.resClassProcess, flag: "collectProcesses", folder: CONFIG.resClassProcesses, folderNamePrefix: "FolderProcesses-" }
		];
	/*	var r = dta.get('resource', [dta.hierarchies[0].resource])[0] as SpecifResource,
			// true, if there is a 'single' hierarchy and if it is a hierarchyRoot:
			singleHierarchyRoot = dta.hierarchies.length == 1
				&& (LIB.hasResClass(r, CONFIG.hierarchyRoots, dta)
					|| LIB.hasType(r, CONFIG.hierarchyRoots, dta));  */

		return new Promise(
			(resolve, reject) => {
				if (typeof (opts) != 'object') { resolve(); return; };

				let apx = simpleHash(self.id),
					tim = new Date().toISOString();

				function resDoesNotExist(rL: any[], res: SpecifResource): boolean {
					for (var i = rL.length - 1; i > -1; i--)
						if (rL[i].r.id == res.id) return false;
					return true;
				}

				resourcesToCollect.forEach(
					(r2c) => {
//						console.debug('rc2c',r2c,opts);
						// As soon as resourcesToCollect has >1 entries, we must spawn a promise each ...
						if (!opts[r2c.flag]) { resolve(); return; };

						// Assuming that the folder objects for the respective folder are available
						// 1. Find all resp. folders (e.g. process folder):
						let delL: SpecifNode[] = [],
							creL: any[] = [];
//						console.debug('createFolderWithResourcesByType',dta.hierarchies,opts);
						LIB.iterateNodes(
							dta.get("hierarchy", self.hierarchies),
							(nd: SpecifNode) => {
								// get the referenced resource:
								let res = dta.get("resource", [nd.resource])[0] as SpecifResource,
									// find the property defining the type:
									pVs = LIB.valuesByTitle(res, [CONFIG.propClassType], dta);

								if (pVs.length > 0) {
									let pV = LIB.languageTextOf(pVs[0], { targetLanguage: 'default' });
									// collect all existing folders of the respective type; there can be 0..n:
									if (pV == r2c.folder )
										delL.push(nd);
									// collect all elements for the new folder,
									// but avoid duplicate entries:
									if (pV == r2c.type && resDoesNotExist(creL, res))
										creL.push({ n: nd, r: res });
								};
								return true;  // continue to the end
							}
						);
//						console.debug('createFolderWithResourcesByType',delL,creL);

						// 2. Delete any existing folders:
						self.deleteItems('node', delL)
							.then(
								() => {
									// Create a folder with all respective objects (e.g. diagrams):
									if (creL.length > 0) {
										// 3. Sort the list alphabetically by the resources' title:
										LIB.sortBy(creL, (el: any) => { return el.r.title });

										// 4. Create a new combined folder:
										let newD: SpecIF = {
											id: 'Create ' + r2c.type + ' ' + new Date().toISOString(),
											$schema: 'https://specif.de/v1.1/schema.json',
											dataTypes: [
												app.standards.get('dataType', { id: "DT-ShortString" }) as SpecifDataType,
												app.standards.get('dataType', { id: "DT-Text" }) as SpecifDataType
											],
											propertyClasses: [
												app.standards.get('propertyClass', { id: "PC-Name" }) as SpecifPropertyClass,
												app.standards.get('propertyClass', { id: "PC-Description" }) as SpecifPropertyClass,
												app.standards.get("propertyClass", { id: "PC-Diagram" }) as SpecifPropertyClass,
												app.standards.get('propertyClass', { id: "PC-Type" }) as SpecifPropertyClass
											],
											resourceClasses: [
												app.standards.get("resourceClass", { id: "RC-Paragraph" }) as SpecifResourceClass,
												app.standards.get('resourceClass', { id: "RC-Folder" }) as SpecifResourceClass
											],
											statementClasses: [],
											resources: Folder(r2c.folderNamePrefix + apx, CONFIG.resClassProcesses),
											statements: [],
											hierarchies: NodeList(r2c,creL)
										};
										// use the update function to eliminate duplicate types:
										self.adopt(newD, {noCheck:true})
										/*	.done(() => {
												// Finally create the node referencing the folder to create:
												let nd: INodeWithPosition = {
													id: "H-" + r2c.folderNamePrefix + apx,
													resource: { id: r2c.folderNamePrefix + apx },
													// re-use the nodes with their references to the resources:
													nodes: LIB.forAll(creL, (pr:any) => { return pr.n; }),
													changedAt: tim
												};
												// Insert the hierarchy node as first element of a hierarchy root 
												// - if it is present and
												// - if there is only one hierarchy root
												// or as first element at root level, otherwise:
											//	if (singleHierarchyRoot)
											//		nd.parent = dta.hierarchies[0].id; 
												self.createItems('node', [nd])
													.then(resolve, reject);
											}) */
											.done(resolve)
											.fail(reject);
									}
									else {
										resolve()
									}
								},
								reject
							)
					}
				);
				return;

				function Folder(fId: string, ti: string, ty?: string): SpecifResource[] {
					return [{
						id: fId,
						class: LIB.makeKey("RC-Folder"),
						properties: [{
							class: LIB.makeKey("PC-Name" ),
							values: [LIB.makeMultiLanguageValue(ti)]
						}, {
							class: LIB.makeKey("PC-Type" ),
							values: [LIB.makeMultiLanguageValue(ty||ti)]
						}],
						changedAt: tim
					}]
				}
				function NodeList(r2c:any,creL:any[]): INodeWithPosition[] {
					// Add the folder:
					let gl: INodeWithPosition = {
						id: "H-" + r2c.folderNamePrefix + apx,
						resource: { id: r2c.folderNamePrefix + apx },
						// re-use the nodes with their references to the resources:
						nodes: LIB.forAll(creL, (pr: any) => { return pr.n; }),
						changedAt: tim
					};
					return [gl]
				}
			}
		)
	};
	private createFolderWithUnreferencedResources(opts: any): Promise<void> {
		// Create a folder with a flat list of resources which are not otherwise listed in a hierarchy.
		let self = this,
			dta = this.cache;
		return new Promise(
			(resolve, reject) => {
				if (typeof (opts) != 'object' || !opts.addUnreferencedResources) { resolve(); return; };

				let unRL: SpecifNode[] = [],
					resL = dta.get('resource', "all") as SpecifResource[],
					apx = simpleHash(self.id),
					tim = new Date().toISOString(),

					// Get the hierarchies without the folder listing the unreferenced resources:
					hL = (dta.get("hierarchy", self.hierarchies) as SpecifNode[])
						.filter(
							(nd: SpecifNode) => {
								// Find the referenced resource:
								let idx = LIB.indexByKey(resL, nd.resource);
								if (idx > -1) {
									if (LIB.hasType(resL[idx], [CONFIG.resClassUnreferencedResources], dta, opts)) {
										// List the node of the FolderWithUnreferencedResources for deletion:
										unRL.push(nd);
										// ... but don't consider it's resource to be an unreferenced resource, itself:
										resL.splice(idx, 1);
										return false  // do NOT include nd in hL
									};
									return true  // include nd in hL
								};
								throw Error('Node '+nd.id+' references a resource '+nd.resource.id+' which is not found.');
							}
						);

				// Delete all resources from resL, which are referenced in any hierarchy:
				LIB.iterateNodes(
					hL,
					(nd: SpecifNode) => {
						let idx = LIB.indexByKey(resL, nd.resource);
						if (idx > -1)
							resL.splice(idx, 1);
						return true  // continue always to the end
					}
				);

				// Delete the resource from the list, if it is the FolderUnreferencedResources, itself:
				resL = resL.filter((r) => {
					return !r.id.includes("FolderUnreferencedResources-")
				});

//				console.debug('createFolderWithUnreferencedResources',delL,resL);
				// 2. Create or re - use the node of the FolderWithUnreferencedResources,
				//    but only if there are no unreferenced resources:
				if (resL.length > 0) {
					// There are unreferenced resources, so create or reuse a folder to collect them.
					if (unRL.length > 0)
						// First delete the hierarchy with folder and all references,
						// then create it with the new list of unreferenced resources.
						self.deleteItems('node', unRL)
							.then(
								() => { return self.createItems('node', NodeList(resL)) }
							)
							.then(resolve)
							.catch(reject)
					else {
						// create a new folder:
						let newD: any = {
							id: 'Create FolderWithUnreferencedResources ' + new Date().toISOString(),
							$schema: 'https://specif.de/v1.1/schema.json',
							dataTypes: [
								app.standards.get('dataType', { id: "DT-ShortString" }),
								app.standards.get('dataType', { id: "DT-Text" })
							],
							propertyClasses: [
								app.standards.get('propertyClass', { id: "PC-Name" }),
								app.standards.get('propertyClass', { id: "PC-Description" }),
								app.standards.get("propertyClass", { id: "PC-Diagram" }) as SpecifPropertyClass,
								app.standards.get('propertyClass', { id: "PC-Type" })
							],
							resourceClasses: [
								app.standards.get("resourceClass", { id: "RC-Paragraph" }) as SpecifResourceClass,
								app.standards.get('resourceClass', { id: "RC-Folder" })
							],
							resources: Folder(),
							hierarchies: NodeList(resL)
						};
//						console.debug('glossary',newD);
						// use the update function to eliminate duplicate types;
						// 'opts.addGlossary' must not be true to avoid an infinite loop:
						self.adopt(newD as SpecIF, { noCheck: true })
							.done(resolve)
							.fail(reject);
                    }
				}
				else {
					// There are no unreferenced resources, so delete the folder if present.
					if (unRL.length > 0)
						self.deleteItems('node', unRL)
							.then(resolve, reject)
					else
						resolve();
				};
				return; 

				function Folder(): SpecifResource[] {
					// Create the folder resource for the unreferenced resources:
					return [{
						id: "FolderUnreferencedResources-" + apx,
						class: LIB.makeKey("RC-Folder"),
						properties: [{
							class: LIB.makeKey("PC-Name"),
							values: [LIB.makeMultiLanguageValue(CONFIG.resClassUnreferencedResources)]
						}, {
							class: LIB.makeKey("PC-Type"),
							values: [LIB.makeMultiLanguageValue(CONFIG.resClassUnreferencedResources)]
						}],
						changedAt: tim
					}];
				}
				function NodeList(resources: SpecifResource[]): INodeWithPosition[] {
					// in alphanumeric order:
					LIB.sortBy(resources, (r: SpecifResource) => { return LIB.getTitleFromProperties(r.properties, dta.propertyClasses, { targetLanguage: self.language }) });

					// Add the folder:
					let gl: INodeWithPosition = {
						id: "H-FolderUnreferencedResources-" + apx,
						predecessor: hL.length>0? hL[hL.length - 1].id : undefined,   // add as last hierarchy
						resource: LIB.makeKey("FolderUnreferencedResources-" + apx),
						nodes: resources.map((r) => { return { id: 'N-' + r.id, resource: LIB.keyOf(r), changedAt: tim } }),
						changedAt: tim
					};
					return [gl];
				}
			}
		)
	};
	createFolderWithGlossary(opts: any): Promise<void> {
//		console.debug('createFolderWithGlossary');
		let self = this,
			dta = this.cache;
		return new Promise(
			(resolve, reject) => {
				if (typeof (opts) != 'object' || !opts.addGlossary) { resolve(); return; };

				// 1. Delete any existing glossaries
				// 1.1 Find all Glossary folders:
				let glL: SpecifNode[] = [],		// glossary folders to keep
					delGL: SpecifNode[] = [],	// old glossary folders to replace
					delRL: SpecifKeys = [],
					diagramL: SpecifResource[] = [],
				//	pVs: SpecifValues,
					apx = simpleHash(self.id),
					tim = new Date().toISOString(),
					lastContentH: SpecifNode,
					hL = (dta.get("hierarchy", self.hierarchies) as SpecifNode[])
						.filter(
							(nd: SpecifNode) => {
								// Find the referenced resource:
								let res = dta.get("resource", [nd.resource])[0] as SpecifResource;
								// Remember the last hierarchy with original content:
								if (res && !LIB.hasType(res, [CONFIG.resClassGlossary, CONFIG.resClassUnreferencedResources], dta, opts))
									lastContentH = nd;
								// Include all original hierarchies, i.e. those except the generated ones:
								return res && !LIB.hasType(res, [CONFIG.resClassUnreferencedResources], dta, opts);
							}
						);

//				console.debug('createFolderWithGlossary',self.hierarchies);
				LIB.iterateNodes(
					hL,
					(nd: SpecifNode): boolean => {
						// get the referenced resource:
						let res = dta.get("resource", [nd.resource])[0] as SpecifResource;

						// check, whether it is a glossary:
						if (LIB.hasType(res, [CONFIG.resClassGlossary], dta, opts)) {
							// delete any older glossary folders; 
							// the subordinated nodes are automatically deleted, as well:
							delGL.push(nd);
							if (nd.resource.id == "FolderGlossary-" + apx)
								// Keep current glossary folders, there should be only one:
								glL.push(nd)
							else {
								// Delete the referenced resources:
								delRL.push(nd.resource);
								if (nd.nodes)
									for (var ch of nd.nodes)
										delRL.push(ch.resource);
							}
						};

						// collect all diagrams which are referenced in the hierarchy
						// as (only) the shown elements shall be included in the glossary:
						if (isDiagram(res)) {
							diagramL.push(res)
						};
						return true  // continue to the end
					}
				);
//				console.debug('createFolderWithGlossary', glL, delGL, diagramL);

				// 1.2 (Re-)Create the glossary:
				if (diagramL.length > 0) {
					self.deleteItems('node', delGL)
						.then(
							() => {
								return self.deleteItems('resource', delRL);
							}
						)
						.then(
							() => {
								if (glL.length > 0) {
									// Add the glossary items to the existing folder:
									self.createItems('node', NodeList(lastContentH))
										.then(resolve, reject)
								}
								else {
									// create a new folder with the glossary entries:
									let newD: any = {
										id: 'Create Glossary ' + new Date().toISOString(),
										$schema: 'https://specif.de/v1.1/schema.json',
										dataTypes: [
											app.standards.get('dataType', LIB.makeKey("DT-ShortString")),
											app.standards.get('dataType', LIB.makeKey("DT-Text"))
										],
										propertyClasses: [
											app.standards.get('propertyClass', LIB.makeKey("PC-Name")),
											app.standards.get('propertyClass', LIB.makeKey("PC-Description")),
											app.standards.get("propertyClass", { id: "PC-Diagram" }) as SpecifPropertyClass,
											app.standards.get('propertyClass', LIB.makeKey("PC-Type"))
										],
										resourceClasses: [
											app.standards.get("resourceClass", { id: "RC-Paragraph" }) as SpecifResourceClass,
											app.standards.get('resourceClass', LIB.makeKey("RC-Folder"))
										],
										statementClasses: [],
										resources: Folders(),
										statements: [],
										hierarchies: NodeList(lastContentH)
									};
//									console.debug('glossary',newD);
									// use the update function to eliminate duplicate types;
									// 'opts.addGlossary' must not be true to avoid an infinite loop:
									self.adopt(newD as SpecIF, { noCheck: true })
										.done(resolve)
										.fail(reject);
								}

							}
						)
						.catch(	reject )
				}
				else {
					// There are no diagrams, so there is no glossary;
					// delete any current or older glossary, for example if the last diagram has been deleted from the project.
					// No problem, if the list is empty:
					self.deleteItems('node', delGL.concat(glL))
						.then(
							() => {
								return self.deleteItems('resource', delRL);
                            }
						)
						.then(resolve)
						.catch(reject)
				};
				return;

				function isDiagram(r: SpecifResource): boolean {
					// a resource is a diagram, 
					// - if it's type has a title 'SpecIF:View',
					// - if it has a property dcterms:type with value 'SpecIF:View', or
					// - if it has at least one statement with title 'SpecIF:shows':
					return LIB.hasResClass(r, CONFIG.diagramClasses, dta)
						|| LIB.hasType(r, CONFIG.diagramClasses, dta, opts)
						|| dta.get(
							"statement",
							(s: SpecifStatement) => {
									// @ts-ignore - subject does exist on a statement
									return LIB.classTitleOf(s['class'], dta.statementClasses) == CONFIG.staClassShows && LIB.references(s.subject,r)
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
								var res = LIB.itemById( self.resources, nd.resource );
								if( isDiagram( res ) ) return res;
							}
						);
					} */
				function Folders(): SpecifResource[] {
					// Create the resources for folder and subfolders of the glossary:
					let term = app.ontology.getTermResource(CONFIG.resClassGlossary);
					var fL: SpecifResource[] = [{
							id: "FolderGlossary-" + apx,
							class: LIB.makeKey("RC-Folder"),
							properties: [{
								class: LIB.makeKey("PC-Name"),
								values: LIB.valuesByTitle(term, ["SpecIF:LocalTerm"], app.ontology.data)
							}, {
								class: LIB.makeKey("PC-Type"),
								values: [ LIB.makeMultiLanguageValue(CONFIG.resClassGlossary) ]
							}],
							changedAt: tim
						}];
					// Create a folder resource for every model-element type:
					for (var eC of CONFIG.modelElementClasses) {
						term = app.ontology.getTermResource(eC);
						fL.push({
							id: "Folder-" + eC.toJsId() + "-" + apx,
							class: LIB.makeKey("RC-Folder"),
							properties: [{
								class: LIB.makeKey("PC-Name"),
								values: LIB.valuesByTitle(term, ["SpecIF:LocalTermPlural"], app.ontology.data)
							}, {
								class: LIB.makeKey("PC-Description"),
								values: LIB.valuesByTitle(term, ["dcterms:description"], app.ontology.data)
							}, {
								class: LIB.makeKey("PC-Type"),
								values: [LIB.makeMultiLanguageValue(CONFIG.resClassFolder)]
							}],
							changedAt: tim
						});
					};
					return fL;
				}
				function NodeList(lastContentH:SpecifNode): INodeWithPosition[] {
					// a. Add the folders:
					let gl: INodeWithPosition = {
						id: "H-FolderGlossary-" + apx,
						predecessor: lastContentH? lastContentH.id : undefined,	// add as last hierarchy
						resource: LIB.makeKey("FolderGlossary-" + apx),
						nodes: [],
						changedAt: tim
					};
					// Create a hierarchy node for each folder per model-element type
					for (var mEl of CONFIG.modelElementClasses) {
						gl.nodes.push({
							id: "N-Folder-" + mEl.toJsId() + "-" + apx,
							resource: LIB.makeKey("Folder-" + mEl.toJsId() + "-" + apx),
							nodes: [],
							changedAt: tim
						});
					};
					// Create a list tL of collections per model-element type;
					// assuming that type adoption/deduplication is not always successful
					// and that there may be multiple resourceClasses per model-element type:
					let idx: number,
						tL = LIB.forAll(CONFIG.modelElementClasses, () => { return [] });
					// Each array in tL shall carry the keys of resourceClasses for the model-element to collect:
					dta.get("resourceClass",self.resourceClasses).forEach(
						(rC) => {
							// @ts-ignore - a resourceClass *has* a title
							idx = CONFIG.modelElementClasses.indexOf(rC.title);
							if (idx > -1) tL[idx].push(LIB.keyOf(rC));
						}
					);
//					console.debug('gl tL',gl,tL);

					// b. list all statements typed SpecIF:shows of diagrams found in the hierarchy:
					let staL = dta.get(
						"statement",
						(s: SpecifStatement) => { return LIB.classTitleOf(s['class'], dta.statementClasses) == CONFIG.staClassShows && LIB.indexByKey(diagramL, s.subject) > -1; }
					) as SpecifStatement[];
//					console.debug('gl tL dL',gl,tL,staL);

					// c. Add model-elements by class to the respective folders.
					// In case of model-elements the resource class is distinctive;
					// the title of the resource class indicates the model-element type.
					// List only resources which are shown on a referenced diagram:
					let resL = dta.get(
						"resource",
						(r: SpecifResource) => { return LIB.referenceIndexBy(staL, 'object', r) > -1 }
					) as SpecifResource[];
					// in alphanumeric order:
					LIB.sortBy(resL, (r: SpecifResource) => { return LIB.getTitleFromProperties(r.properties, dta.propertyClasses, { targetLanguage: self.language }) });

					// Categorize resources:
					resL.forEach(
						(r: SpecifResource): void => {
							// ... using the collections per fundamental model-element type:
							for (idx = tL.length - 1; idx > -1; idx--) {
								if (LIB.indexByKey(tL[idx], r['class']) > -1) {
									gl.nodes[idx].nodes.push({
										// Create new hierarchy node with reference to the resource:
										// ID should be the same when the glossary generated multiple times,
										// but must be different from a potential reference somewhere else.
										id: 'N-' + simpleHash(r.id + '-gen'),
										resource: LIB.keyOf(r),
										changedAt: tim
									});
									break;
								};
							};
						}
					);
					return [gl];
				}
			}
		)
	}
	readStatementsOf(res: SpecifKey, opts?: any): Promise<SpecifStatement[]> {
		// Get the statements of a resource ... there are 2 use-cases:
		// - All statements between resources appearing in a hierarchy shall be shown for navigation;
		//   it is possible that a resource is deleted (from all hierarchies), but not it's statements.
		//   --> set 'showComments' to false
		// - All comments referring to the selected resource shall be shown;
		//   the resource is found in the cache, but the comment is not.
		//   --> set 'showComments' to true
		// - It is assumed that the hierarchies contain only model-elements shown on a visible diagram,
		//   so only stetements are returned for visible resources.
		// - In addition, only statements are returned which are shown on a visible diagram.
		//   (perhaps both checks are not necessary, as visible statements only referto visible resources ...)

		if (typeof (opts) != 'object') opts = {};
		let dta = this.cache,
			sCL: SpecifStatementClass[],
			showsL: SpecifStatement[];
		return new Promise(
			(resolve, reject) => {
				this.readItems('statementClass', this.statementClasses)
					.then(
						(sCs) => {
							sCL = sCs as SpecifStatementClass[];
							// Query: The 'shows' statements of this project's diagrams (only those can be a subject of a 'shows' statement):
							return this.readItems(
								'statement',
								(s: SpecifStatement) => { return LIB.classTitleOf(s['class'], dta.statementClasses) == CONFIG.staClassShows && LIB.isReferencedByHierarchy(s.subject) }
							);
						}
					)
					.then(
						(sL) => {
							showsL = sL as SpecifStatement[];
							// Query: The statements involving the selected resource as subject or object:
							return this.readItems(
								'statement',
								(s: SpecifStatement) => { return res.id == s.subject.id || res.id == s.object.id }
							);
						}
					)
					.then(
						(sL) => {
							resolve(
								(sL as SpecifStatement[]).filter(
									(s) => {
										let sC = LIB.itemByKey(sCL, s['class']) as SpecifStatementClass,
											ti = LIB.titleOf(sC);
										if (ti)
											return (
													// statement must be visible on a diagram referenced in a hierarchy
													// or be a shows statement itself.
													// ToDo: - Some Archimate relations are implicit (not shown on a diagram) and are unduly suppressed, here)
													(opts.dontCheckStatementVisibility
														// Accept manually created relations (including those imported via Excel):
														|| !Array.isArray(sC.instantiation) || sC.instantiation.includes(SpecifInstantiation.User)
														|| CONFIG.staClassShows == ti
														// Accept, if statement s is shown by a diagram in the hierarchy:
														|| LIB.referenceIndexBy(showsL, "object", s) > -1
													)
												// AND fulfill certain conditions:
												&& (
													opts.showComments?
														// In case of a comment, the comment itself is not referenced in the tree:
															CONFIG.staClassCommentRefersTo == ti
														&& LIB.isReferencedByHierarchy(s.object)
													:
														// related subject and object must be referenced in the tree to be navigable,
														// also, the statement must not be declared 'hidden':
														// cheap tests first:
															CONFIG.staClassCommentRefersTo != ti
														&& CONFIG.hiddenStatements.indexOf(ti) < 0
														&& LIB.isReferencedByHierarchy(s.subject)
														&& LIB.isReferencedByHierarchy(s.object)
													)
											);
										// else
										console.error("When searching for statements of resource '" + res.id + "' no title was found for statement '" + s.id + "'.");
										return false
									}
								)
							)
						}
					)
					.catch(reject);
			}
		)
	}
	// Select format and options with a modal dialog, then export the data:
	private renderExportOptions(fmt: string) {
		var pnl = '<div class="panel panel-default panel-options" style="margin-bottom:0">'
			//	+		"<h4>"+i18n.LblOptions+"</h4>"
			// add 'zero width space' (&#x200b;) to make the label = div-id unique:
			+ (['specif', 'specif_v10', 'html'].includes(fmt) ? '' : makeTextField('&#x200b;' + i18n.LblProjectName, (fmt == 'specifClasses' ? 'SpecIF Classes' : this.exportParams.projectName), { typ: 'line' }))
			+ makeTextField('&#x200b;' + i18n.LblFileName, (fmt == 'specifClasses' ? 'SpecIF-Classes' : this.exportParams.fileName), { typ: 'line' });
		switch (fmt) {
			case 'epub':
			case 'oxml':
				pnl += makeCheckboxField(
					i18n.LblOptions,
					[
						{ title: i18n.withStatements, id: 'withStatements', checked: false },
						{ title: i18n.withOtherProperties, id: 'withOtherProperties', checked: false },
						{ title: i18n.showEmptyProperties, id: 'showEmptyProperties', checked: CONFIG.showEmptyProperties }
					]
				);
				break;
			case 'html':
				// Choice of role only in case of the Editor: 
				if (app.title == i18n.LblEditor) {
					pnl += makeRadioField(
						app.ontology.localize('SpecIF:Permissions', { targetLanguage: browser.language }),
						// a radio button for each of the roles of the selected project:
						this.roles.map(
							(r,i) => {
								return { title: i18n.lookup('MsgForRole')+" '"+r.id+"'", id: r.id, checked: i<1 }
                            }
						)
					)
				};
				break;
			case 'specifClasses':
				let domains = LIB.enumeratedValuesOf(LIB.makeKey('DT-Domain'));
				if (domains.length>0)
					pnl += makeCheckboxField(
						i18n.LblOptions,
						domains.map(
							(d: string) => {
								return { title: d, id: d.toJsId(), checked: false }
							}
						)
					)
		};
		pnl += '</div>';
//		console.debug('renderExportOptions',fmt,pnl);
		return pnl;
	}
	exportFormatClicked(): void {
		// Display options depending on selected format:
		// ToDo: In case of ReqIF OOXML and ePub, let the user choose the language, if there are more than one:
		document.getElementById("expOptions").innerHTML = this.renderExportOptions(radioValue(i18n.LblFormat));

//		console.debug('exportFormatClicked',radioValue( i18n.LblFormat ));
	}
/*	exportOptionsClicked(): void {
		// Obtain selected options:
		// add 'zero width space' (&#x200b;) to make the label = div-id unique:
		let prjN = textValue('&#x200b;' + i18n.LblProjectName);
		this.exportParams.fileName = textValue('&#x200b;' + i18n.LblFileName) || prjN || this.id;
		if (prjN)
			this.exportParams.projectName = prjN;
//		console.debug('exportOptionsClicked',this.title,this.fileName);
	} */
	chooseFormatAndExport() {
		if (this.exporting) return;

		var self = this;
		const exportFormatClicked = 'app.projects.selected.exportFormatClicked()';
		// @ts-ignore - BootstrapDialog() is loaded at runtime
		new BootstrapDialog({
		//	title: i18n.LblExport + ": '" + LIB.languageTextOf(this.title, { targetLanguage: this.language }) + "'",
			title: i18n.LblExport,
			type: 'type-primary',
		/*	// @ts-ignore - BootstrapDialog() is loaded at runtime
			size: BootstrapDialog.SIZE_WIDE,  */
			message: () => {
				// export is available for Editor and Reviewer:
				let formats = app.title == i18n.LblEditor ?
						[
							{ title: 'SpecIF v1.0', id: 'specif_v10' },
							{ title: 'SpecIF v' + CONFIG.specifVersion, id: 'specif', checked: true },
							{ title: 'HTML with embedded SpecIF v' + CONFIG.specifVersion, id: 'html' },
							{ title: 'ReqIF v1.0', id: 'reqif' },
							//	{ title: 'RDF', id: 'rdf' },
							//	{ title: 'Turtle (experimental)', id: 'turtle' },
							{ title: 'ePub v2', id: 'epub' },
							{ title: 'MS Word® (Open XML)', id: 'oxml' }
						]
					:
						[
							{ title: 'HTML with embedded SpecIF v' + CONFIG.specifVersion, id: 'html', checked: true },
						];
				// add an option to generate class definitions, if there is a SpecIF ontology found in the hierarchies:
				if( moduleManager.isReady('ioOntology') && hasOntology() )
					formats.splice(3, 0, { title: 'SpecIF Class Definitions', id: 'specifClasses' });

				var form = '<div class="row" style="margin: 0 -4px 0 -4px">'
				//	+ '<div class="col-sm-12 col-md-6" style="padding: 0 4px 0 4px">'
					+ '<div class="col-sm-12" style="padding: 0 4px 0 4px">'
					+ '<div class="panel panel-default panel-options" style="margin-bottom:4px">'
				//	+ "<h4>"+i18n.LblFormat+"</h4>"
					+ "<p>" + i18n.MsgExport + "</p>"
					+ makeRadioField(
						i18n.LblFormat,
						formats,
						{ handle: exportFormatClicked }  // options depend on format
					)
					+ '</div>'
					+ '</div>'
				//	+ '<div id="expOptions" class="col-sm-12 col-md-6" style="padding: 0 4px 0 4px">'
					+ '<div id="expOptions" class="col-sm-12" style="padding: 0 4px 0 4px">'
					+ this.renderExportOptions(app.title == i18n.LblEditor ?'specif':'html')   // parameter must correspond to the checked option above
					+ '</div>'
					+ '</div>';
				return $(form)

				function hasOntology(): boolean {
					let hL = self.cache.get("hierarchy", self.hierarchies) as SpecifNode[];
					for (var h of hL) {
						let rL = self.cache.get("resource", [h.resource]) as SpecifResource[];
						if (rL.length>0 && LIB.hasType(rL[0], [CONFIG.resClassOntology], self.cache))
							return true;
					};
					return false;
                }
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

						// Obtain selected options:
						// add 'zero width space' (&#x200b;) to make the label = div-id unique:
						let prjN = textValue('&#x200b;' + i18n.LblProjectName);
						this.exportParams.fileName = textValue('&#x200b;' + i18n.LblFileName) || prjN || this.id;
						if (prjN)
							this.exportParams.projectName = prjN;

						let options = {
							projectName: this.exportParams.projectName,
							fileName: this.exportParams.fileName,
							format: radioValue(i18n.LblFormat)
						};

						// Retrieve further options:
						switch (options.format) {
							case 'html':
								if (app.title == i18n.LblEditor) {
									options.role = radioValue(app.ontology.localize('SpecIF:Permissions', { targetLanguage: browser.language }))
								}
								else
									// in case this is an HTML to create an HTML, adopt the same role:
									options.role = window.role || 'Supplier';
								break;
							default:
								checkboxValues(i18n.LblOptions).forEach(
									(op: string) => {
										// @ts-ignore - indexing is valid: 
										options[op] = true
									}
								);
						};

						this.exportAs(options)
						.then(
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
				reject(new xhrMessage( 999, "Export in process, please wait a little while" ));
			}
			else {
			//	if (self.cache.exp) { // check permission
					self.exporting = true; // set status to prohibit multiple entry

					switch (opts.format) {
						case 'specif_v10':
					//	case 'rdf':
						case 'turtle':
							opts.v10 = true;
							// no break
						case 'reqif':
						case 'specif':
						case 'html':
						case 'specifClasses':
							storeAs(opts);
							break;
						case 'epub':
						case 'oxml':
							opts.v10 = true;
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
					reject(new xhrMessage(999, "Invalid format specified on export" ));
					throw Error("Invalid format specified on export");
				};

				// ToDo: Get the newest data from the server.
//				console.debug( "publish", opts );

				// If a hidden property is defined with value, it is suppressed only if it has this value;
				// if the value is undefined, the property is suppressed in all cases.
				opts.skipProperties = [
					{ title: CONFIG.propClassType, value: CONFIG.resClassFolder },
					{ title: CONFIG.propClassType, value: CONFIG.resClassOutline }
				];

				// Don't lookup titles now, but within toOxml(), so that that the publication can properly classify the properties.
			//	opts.lookupValues = true;  // applies to self.cache.get()
				// But DO reduce to the language desired.
				if ( !opts.targetLanguage ) opts.targetLanguage = self.language;
				opts.makeHTML = true;
				opts.linkifyURLs = true;
			//	opts.createHierarchyRootIfMissing = true;
				opts.allDiagramsAsImage = true;
			//	opts.allImagesAsPNG = ["oxml"].includes(opts.format);   .. not yet implemented!!
				// take newest revision:
				opts.revisionDate = new Date().toISOString();

				self.read(opts).then(
					(expD:SpecIF) => {
//						console.debug('publish',expD,opts);
						let localOpts = {
							titleLinkTargets: CONFIG.titleLinkTargets.map((e:string) => { return i18n.lookup(e) }),
							titleProperties: CONFIG.titleProperties.map((e: string) => { return i18n.lookup(e) }),
							descriptionProperties: CONFIG.descProperties.map((e: string) => { return i18n.lookup(e) }),
							// Values of declared stereotypeProperties get enclosed by double-angle quotation mark '&#x00ab;' and '&#x00bb;'
							stereotypeProperties: CONFIG.stereotypeProperties.map((e: string) => { return i18n.lookup(e) }),
							showEmptyProperties: opts.showEmptyProperties,
							imgExtensions: CONFIG.imgExtensions,
							applExtensions: CONFIG.applExtensions,
						//	hasContent: LIB.hasContent,
							propertiesLabel: opts.withOtherProperties ? i18n.lookup('SpecIF:Properties') : undefined,
							statementsLabel: opts.withStatements ? i18n.lookup('SpecIF:Statements') : undefined,
							fileName: self.exportParams.fileName,
							colorAccent1: '0071B9',	// adesso blue
							done: () => { app.projects.selected.exporting = false; resolve() },
							fail: (xhr:xhrMessage) => { app.projects.selected.exporting = false; reject(xhr) }
						};

						expD.title = opts.projectName;
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
				if (!opts || ['specif', 'specif_v10', 'html', 'reqif', 'turtle', 'specifClasses'].indexOf(opts.format) < 0) {
					// programming error!
					reject(new xhrMessage( 999, "Invalid format specified on export" ));
					throw Error("Invalid format specified on export");
				};

				// ToDo: Get the newest data from the server.
//				console.debug( "storeAs", opts );

				// keep vocabulary terms:
			//	opts.lookupTitles = false;
			//	opts.lookupValues = false;
				opts.allDiagramsAsImage = ["html","turtle","reqif"].includes(opts.format);

				switch (opts.format) {
					case 'specif_v10':
					case 'specif':
					case 'html':
						// export all languages:
						opts.lookupTitles = false;
						opts.lookupValues = false;
					//	opts.targetLanguage = undefined;
						// keep all revisions:
					//	opts.revisionDate = undefined;
						break;
					case 'reqif':
						opts.lookupTitles = true;
						opts.targetNamespace = "ReqIF.";
						// XHTML is supported:
						opts.makeHTML = true;
						opts.linkifyURLs = true;
						//	opts.createHierarchyRootIfMissing = true;
						// take newest revision:
						opts.revisionDate = new Date().toISOString();
						break;
				//	case 'rdf':
					case 'turtle':
						// only single language is supported:
						opts.lookupTitles = true;
						opts.targetLanguage = self.language;
						// XHTML is supported:
						opts.makeHTML = true;
						opts.linkifyURLs = true;
					//	opts.createHierarchyRootIfMissing = true;
						// take newest revision:
						opts.revisionDate = new Date().toISOString();
						break;
					case 'specifClasses':
						opts.adoptOntologyDataTypes = true;
						break;
					default:
						reject();
						return; // should never arrive here
				};
//				console.debug( "storeAs", simpleClone(self), opts );

				self.read(opts).then(
					(expD) => {
//						console.debug('storeAs', simpleClone(expD), opts);
						let fName = opts.fileName;
						if( ['html', 'reqif', 'turtle'].includes(opts.format) )
							expD.title = opts.projectName;
						if (opts.targetLanguage) expD.language = opts.targetLanguage;

						// A) Processing for 'html':
						if (opts.format == 'html') {
							// find the fully qualified path of the content delivery server to fetch the viewer modules:
							opts.cdn = window.cdn  // in case the calling app is itself html with embedded SpecIF
									||	window.location.href.substr(0, window.location.href.lastIndexOf("/") + 1);

							toHtmlDoc(expD, opts)
							.then(
								(dta) =>{
									let blob = new Blob([dta], { type: "text/html; charset=utf-8" });
									// Add the role to the filename except for 'Reader' (default):
									// @ts-ignore - saveAs() is loaded at runtime
									saveAs(blob, fName + (opts.role=='Reader'? '':'.'+opts.role)+'.specif.html');
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
						let expStr: string,
							// @ts-ignore - JSZip has been loaded dynamically
							zipper = new JSZip(),
							zName: string,
							mimetype = "application/zip";

						// Add the files to the ZIP container:
						if (expD.files)
							for (var f of expD.files) {
//								console.debug('zip a file',f);
								zipper.file(f.title, f.blob);
								delete f.blob; // the SpecIF data below shall not contain it ...
							};

						// Prepare the output data:
						switch (opts.format) {
							case 'specif_v10':
								fName += ".v10";
								// no break
							case 'specif':
								fName += ".specif";
								zName = fName + '.zip';
								expStr = JSON.stringify(expD);
								break;
							case 'specifClasses':
								fName += ".specif";
								zName = fName + '.zip';
								expStr = JSON.stringify(
									new COntology(expD).generateSpecifClasses(opts)
								);
//								console.debug('expStr', expStr);
								break;
							case 'reqif':
								fName += ".reqif";
								zName = fName + 'z';
								mimetype = "application/reqif+zip";
								expStr = app.ioReqif.fromSpecif(expD);
								break;
							case 'turtle':
								fName += ".ttl";
								zName = fName + '.zip';
								// @ts-ignore - transformSpecifToTTL() is loaded at runtime
								expStr = transformSpecifToTTL("https://specif.de/examples", expD);
						/*		break;
							case 'rdf':
								if( !app.ioRdf ) {
									reject({status:999,statusText:"ioRdf not loaded."});
									return;
								};
								fName += ".rdf";
								expStr = app.ioRdf.fromSpecif( expD ); */
						};
						expD = undefined; // save some memory space
						// Add the project:
						// @ts-ignore - expStr gets a value in each case of the switch ...
						zipper.file(fName, new Blob([expStr], { type: "text/plain; charset=utf-8" }));

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

	// Equality Checks:
	// equalDT, equalPC, equalRC and equalSC are now part of LIB

	private equalR(refE: SpecifResource, newE: SpecifResource): boolean {
		// Return true, if reference and new resource are equal.
		// Resources are considered equal, if they have the same title *and* class.
		// ToDo: Also, if a property with title CONFIG.propClassType has the same value?
//		console.debug('equalR',refE,newE);

		// Sort out most cases with minimal computing;
		// assuming that the types have already been consolidated:
		let opts = { targetLanguage: this.language };
		return LIB.equalKey(refE['class'], newE['class'])
			&& this.cache.instanceTitleOf(refE, opts) == this.cache.instanceTitleOf(newE, opts);

	/*	if (LIB.equalKey(refE['class'], newE['class'])
			&& LIB.instanceTitleOf(refE, opts) == LIB.instanceTitleOf(newE, opts)
			)
				return true;

		// ToDo: Consider, if a property with title CONFIG.propClassType has the same value?

		// being equal to the content of property CONFIG.propClassType is not considered equal
		// (for example BPMN endEvents which don't have a genuine title):
		let typ = LIB.valuesByTitle(refE, [CONFIG.propClassType], dta)[0],
			rgT = RE.splitVocabularyTerm.exec(typ);
		// rgT[2] contains the type without namespace (works also, if there is no namespace).
		return (!rgT || rgT[2] != refE.title);  */
	}
	private equalS(refE: SpecifStatement, newE: SpecifStatement): boolean {
		// return true, if reference and new statement are equal:
		// Model-elements are only equal, if they have the same class.
		// ToDo: Also, if a property with title CONFIG.propClassType has the same value?
		return LIB.equalKey(refE['class'], newE['class'])
		//	&& this.cache.instanceTitleOf(refE, opts) == this.cache.instanceTitleOf(newE, opts)
			&& LIB.equalKey(refE.subject, newE.subject)
			&& LIB.equalKey(refE.object, newE.object);
	}
	private equalF(refE: SpecifFile, newE: SpecifFile): boolean {
		// return true, if reference and new file are equal:
		return LIB.equalKey(refE,newE)
			&& refE.title == newE.title
			&& refE.type == newE.type;
	}
	// Compatibility Checks:
	private compatibleDT(refC: SpecifDataType, newC: SpecifDataType): boolean {
		if (refC.type == newC.type) {
			switch (newC.type) {
				case SpecifDataTypeEnum.Boolean:
					// can't have enumerated values
					return true;
				case SpecifDataTypeEnum.Double:
					// to be compatible, the new 'fractionDigits' must be lower or equal:
					if (refC.fractionDigits < newC.fractionDigits) {
						new xhrMessage(952, "new dataType '" + newC.id + "' of type '" + newC.type + "' is incompatible").log();
						return false;
					};
				// else: go on ...
				case SpecifDataTypeEnum.Integer:
					// to be compatible, the new 'maxInclusive' must be lower or equal and the new 'minInclusive' must be higher or equal:
//					console.debug( refC.maxInclusive<newC.maxInclusive || refC.minInclusive>newC.minInclusive );
					if (refC.maxInclusive < newC.maxInclusive || refC.minInclusive > newC.minInclusive) {
						new xhrMessage(953, "new dataType '" + newC.id + "' of type '" + newC.type + "' is incompatible").log();
						return false;
					};
					break;
				case SpecifDataTypeEnum.String:
//					console.debug( refC.maxLength>newC.maxLength-1 );
					if (refC.maxLength && (newC.maxLength == undefined || refC.maxLength < newC.maxLength)) {
						new xhrMessage(951, "new dataType '" + newC.id + "' of type '" + newC.type + "' is incompatible").log();
						return false;;
					};
					break;
				case SpecifDataTypeEnum.DateTime:
				case SpecifDataTypeEnum.Duration:
				case SpecifDataTypeEnum.AnyUri:
					break;
				default:
					// should never arrive here ... as every branch in every case above has a return.
					throw Error("Invalid data type.");
			};
			return compatibleEnumeration(refC, newC);
		}
		return false;

		function compatibleEnumeration(refC: SpecifDataType, newC: SpecifDataType): boolean {
			// A SpecifEnumeratedValue can be scalar or in case of type string a multiLanguageValue.
			if (!refC.enumeration && !newC.enumeration) return true;
			if (!refC.enumeration == !!newC.enumeration) return false;

			// else, both refC and newC have enumerations:
			var idx: number;
			// @ts-ignore - newC.enumeration *is* present:
			for (var v = newC.enumeration.length - 1; v > -1; v--) {
				// @ts-ignore - refC.enumeration *is* present:
				idx = LIB.indexById(refC.enumeration, newC.enumeration[v].id);
				// a. The id of the new 'enumeration' must be present in the present one:
				if (idx < 0) {
					new xhrMessage( 954, "new dataType '" + newC.id + "' of type '" + newC.type + "' is incompatible" ).log();
					return false;
				};
			/*	//  b. the values must be equal; distinguish between data types:
			 	// - SpecifDataTypeEnum.String: multiLanguage text (ToDo:  needs rework!)
				// - all others: string
				if (refC.enumeration[idx].value != newC.enumeration[v].value) { 
					new xhrMessage( 955, "new dataType '" + newC.id + "' of type '" + newC.type + "' is incompatible" ).log();
					return false;
				}; */
			};
			return true;
        }
	}
	private compatiblePC(refC: SpecifPropertyClass, newC: SpecifPropertyClass): boolean {
		if (LIB.equalPC(refC, newC))
			return true;
		// else:
		new xhrMessage(956, "new propertyClass '" + newC.id + "' is incompatible" ).log();
		return false;

	/*	// A resourceClass or statementClass is incompatible, if it has an equally-named property class with a different dataType
		// A resourceClass or statementClass is compatible, if all equally-named propertyClasses have the same dataType
		if (!newC.propertyClasses || !newC.propertyClasses.length)
			return { status: 0 };
		// else: The new type has at least one property.
	
		if (!refC.propertyClasses || refC.propertyClasses.length < newC.propertyClasses.length)
			return { status: 963, statusText: "new resourceClass or statementClass '" + newC.id + "' is incompatible (additional propertyClasses)" };
		// else: The new type has no more properties than the reference
	
		var idx: number,
			nPC: SpecifPropertyClass;
		for (var a = newC.propertyClasses.length - 1; a > -1; a--) {
			nPC = newC.propertyClasses[a];
			if (nPC.id) {
				// If an id exists, it must be equal to one of refC's propertyClasses:
				idx = LIB.indexById(refC.propertyClasses, nPC.id)
			} 
			else {
				// If there is no id, the type is new and there are no referencing elements, yet.
				// So it does not matter.
				// But there must be a property class with the same name:
				idx = indexByTitle(refC.propertyClasses, nPC.title)
			};
			if (idx < 0) {
				// The property class in the new data is not found in the existing (reference) data:
				if (!opts || !opts.mode || ["match", "include"].includes(opts.mode))
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
	}
	private compatiblePCReferences(rCL: SpecifKeys | undefined, nCL: SpecifKeys | undefined, opts?: any): boolean {
		// to be used for a resourceClass' or statementClass' propertyClasses
		if (!opts || !opts.mode) opts = { mode: "match" }; // most restrictive by default
		if (Array.isArray(rCL) && Array.isArray(nCL)) {
			switch (opts.mode) {
				case "include":
					return rCL.length >= nCL.length && LIB.containsAllKeys(rCL, nCL);
				case "match":
				default:
					return rCL.length == nCL.length && LIB.containsAllKeys(rCL, nCL);
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
	private compatibleECReferences(rCL: SpecifKeys | undefined, nCL: SpecifKeys | undefined, opts?: any): boolean {
		// to be used for a statementClass's subjectClasses and objectClasses;
		// if any of these arrays is missing, subjects or objects of any class are allowed:
		if (!opts || !opts.mode) opts = { mode: "match" }; // most restrictive by default

		if (Array.isArray(rCL)) {
			if (Array.isArray(nCL))
				switch (opts.mode) {
					case "include":
						return rCL.length >= nCL.length && LIB.containsAllKeys(rCL, nCL);
					case "match":
					default:
						return rCL.length == nCL.length && LIB.containsAllKeys(rCL, nCL);
				}
			else
				// there is a reference list, but no new list (i.e. subjects or objects of any class are allowed):
				return false;
		};
		// else:
		return opts.mode == "match" ? !Array.isArray(nCL) : true;
	}
	private compatibleRC(refC: SpecifResourceClass, newC: SpecifResourceClass, opts?:any): boolean {
		if (this.compatiblePCReferences(refC.propertyClasses, newC.propertyClasses, opts))
			return true;
		// else:
		new xhrMessage( 963, "new resourceClass '" + newC.id + "' is incompatible; propertyClasses don't match" ).log();
		return false;
	}
	private compatibleSC(refC: SpecifStatementClass, newC: SpecifStatementClass, opts?:any): boolean {
		if (refC.title != newC.title) {
			new xhrMessage( 961, "new statementClass '" + newC.id + "' is incompatible; titles don't match" ).log();
			return false;
        }
		// To be compatible, all subjectClasses of newC must be contained in the subjectClasses of refC;
		// no subjectClasses means that all resourceClasses are permissible as subject.
		if (!this.compatibleECReferences(refC.subjectClasses, newC.subjectClasses) ) {
			new xhrMessage( 962, "new statementClass '" + newC.id + "' is incompatible; subjectClasses don't match" ).log();
			return false;
		};
		// ... and similarly for the objectClasses:
		if (!this.compatibleECReferences(refC.objectClasses, newC.objectClasses)) {
			new xhrMessage( 962, "new statementClass '" + newC.id + "' is incompatible; objectClasses don't match" ).log();
			return false;
		};
		// else: so far everything is OK, but go on checking ... (no break!)
		if (this.compatiblePCReferences(refC.propertyClasses, newC.propertyClasses, opts))
			return true;
		// else:
		new xhrMessage( 963, "new statementClass '" + newC.id + "' is incompatible; propertyClasses don't match" ).log();
		return false;
	}
	// Substritutions:
	private substituteProp(L:any[]|undefined, propN: string, rK: SpecifKey, dK: SpecifKey): void {
		// replace key of the duplicate item dK by the key of the original one rK;
		// this applies to the property 'propN' of each member of the list L:
		if (Array.isArray(L))
			for (var e of L) {
				if (LIB.references(e[propN], dK)) e[propN] = rK;
			/*	if (e[propN].revision) {
					if (LIB.equalKey(e[propN], dK)) e[propN] = rK
				}
				else {
					// If the duplicate key dK (to be replaced) has no revision, 
					// the replacement shall have no revision either: 
					if (e[propN].id == dK.id) e[propN].id = rK.id
				}; */
			};
	}
	private substituteLe(L:any[], propN: string, rK: SpecifKey, dK: SpecifKey): void {
		// Replace the duplicate id by the id of the original item;
		// so replace dK by rK in the list named 'propN'
		// (for example: in L[i][propN] (which is a list as well), replace dK by rK):
		let idx: number;
		if (Array.isArray(L))
			L.forEach((e) => {
				// e is a resourceClass or statementClass;
				if (Array.isArray(e[propN])) {
					// find the element in e[propN] referencing dK:
					idx = LIB.referenceIndex(e[propN], dK);
					if (idx > -1) {
						// dK is an element of e[propN]
						if (LIB.referenceIndex(e[propN], rK) < 0)
							// replace dK with rK
							e[propN].splice(idx, 1, rK);
						else
							// rK is already member of the list, just remove dK:
							e[propN].splice(idx, 1)
					};
				};
			});
	}
	private substituteRef(L: SpecifNodes, rK: SpecifKey, dK: SpecifKey): void {
		// For all hierarchies, replace any reference to dK by rK;
		// eliminate double entries in the same folder (together with the children):
		LIB.iterateNodes(
			L,
			// replace resource id:
			(nd: SpecifNode) => { if (LIB.references(nd.resource, dK)) { nd.resource = rK }; return true },
			// eliminate duplicates within a folder (assuming that it will not make sense to show the same resource twice in a folder;
			// for example it is avoided that the same diagram is shown twice if it has been imported twice:
			(ndL: SpecifNodes) => { for (var i = ndL.length - 1; i > 0; i--) { if (LIB.referenceIndexBy(ndL.slice(0, i), 'resource', ndL[i].resource) > -1) { ndL.splice(i, 1) } } }
		);
	}
	private substituteDT(prj: CSpecIF | CCache, refE: SpecifDataType, newE: SpecifDataType,): void {
		// For all propertyClasses, substitute new by the original dataType:
		this.substituteProp(prj.propertyClasses, 'dataType', LIB.keyOf(refE), LIB.keyOf(newE));
	}
	private substitutePC(prj: CSpecIF | CCache, refE: SpecifResourceClass, newE: SpecifResourceClass, ): void {
		// For all resourceClasses, substitute new by the original propertyClass:
		this.substituteLe(prj.resourceClasses, 'propertyClasses', LIB.keyOf(refE), LIB.keyOf(newE));
		// Also substitute the resource properties' class:
		prj.resources.forEach((res) => {
			this.substituteProp(res.properties, 'class', LIB.keyOf(refE), LIB.keyOf(newE));
		});
		// The same with the statementClasses:
		this.substituteLe(prj.statementClasses, 'propertyClasses', LIB.keyOf(refE), LIB.keyOf(newE));
		if (Array.isArray(prj.statements))
			prj.statements.forEach((sta) => {
				this.substituteProp(sta.properties, 'class', LIB.keyOf(refE), LIB.keyOf(newE))
			});
	}
	private substituteRC(prj: CSpecIF | CCache, refE: SpecifResourceClass, newE: SpecifResourceClass): void {
		// Substitute new by original resourceClass:
		this.substituteLe(prj.statementClasses, 'subjectClasses', LIB.keyOf(refE), LIB.keyOf(newE));
		this.substituteLe(prj.statementClasses, 'objectClasses', LIB.keyOf(refE), LIB.keyOf(newE));
		this.substituteProp(prj.resources, 'class', LIB.keyOf(refE), LIB.keyOf(newE));
	}
	private substituteSC(prj: CSpecIF | CCache, refE: SpecifStatementClass, newE: SpecifStatementClass): void {
		// Substitute new by original statementClass:
		this.substituteProp(prj.statements, 'class', LIB.keyOf(refE), LIB.keyOf(newE));
	}
	private substituteR(prj: CSpecIF | CCache, refE: SpecifResource, newE: SpecifResource, opts?: any): void {
		// Substitute all references of resource newE by refE,
		// where refE is always an element of this.cache.
		// But: Rescue any property of newE, if undefined for refE.
//		console.debug('substituteR',refE,newE,prj.statements);

		if (opts && opts.rescueProperties) {
			// Rescue any property value of newE,
			// if the corresponding property of the adopted resource refE is undefined or empty;
			// looking at the property types, which ones are in common:
			newE.properties.forEach((nP: SpecifProperty) => {
				if (LIB.hasContent(nP.values[0])) {
					// check whether existing resource has similar property;
					// a property is similar, if it has the same title,
					// where the title may be defined with the property class.
					let ti = LIB.classTitleOf(nP['class'], prj.propertyClasses),
						rP = LIB.propByTitle(refE, ti, this.cache);
//					console.debug('substituteR 3a',nP,ti,rP,LIB.hasContent(LIB.valuesByTitle( refE, ti, this.cache )));
					if (!LIB.hasContent(LIB.displayValueOf(LIB.valuesByTitle(refE, [ti], this.cache)[0],opts))
						// resource r must have a corresponding property
						// ToDo: Copy the whole property, if it is defined in the resourceClass, but not instantiated
						&& rP
						// dataTypes must be compatible:
						&& this.compatibleDT(LIB.dataTypeOf(rP['class'], this.cache), LIB.dataTypeOf(nP['class'], prj))) {
						//	&& this.typeIsCompatible( 'dataType', LIB.dataTypeOf(rP['class'],this.cache), LIB.dataTypeOf(nP['class'],prj) ).status==0 ) {
						rP.values = nP.values;
					};
				};
			});
		};

		// In the rare case that the keys are identical, there is no need to update the references:
		if (LIB.equalKey(refE,newE)) return;

		// 1. Replace the references in all statements:
		prj.statements.forEach((st: SpecifStatement) => {
			if (LIB.references(st.subject, newE)) st.subject = LIB.keyOf(refE);
			if (LIB.references(st.object, newE)) st.object = LIB.keyOf(refE);
		});

		// 2. Replace the references in all hierarchies:
		this.substituteRef(prj.hierarchies, LIB.keyOf(refE), LIB.keyOf(newE));

		// 3. Make sure all statementClasses allowing newE.class also allow refE.class (the class of the adopted resource):
		if (refE['class'] && newE['class'] && !LIB.equalKey(refE['class'], newE['class']))
			prj.statementClasses.forEach((sC: SpecifStatementClass) => {
				let idx = LIB.referenceIndexBy(sC.subjectClasses, newE['class']);
				if ( idx > -1) {
					sC.subjectClasses.splice(idx, 1);
					LIB.cacheE(sC.subjectClasses, refE['class']);
				};
				idx = LIB.referenceIndexBy(sC.objectClasses, newE['class']);
				if (idx > -1) {
					sC.objectClasses.splice(idx, 1);
					LIB.cacheE(sC.objectClasses, refE['class']);
				};
			});
	}
	abort(): void {
		console.info('abort project');
	//	server.abort();
		this.abortFlag = true;
	};
}
/*///////////////////////////////////////////////////////
 * This funtion formerly had the role of CProject, there are perhaps some algorithms which can be used again in future:
function Project(): IProject {
	// Constructor for a project containing SpecIF data.
	var self: any = {},
		//	loading = false,		// true: data is being gathered from the server.
		fileName: string;

	self.updateMeta = ( prj )=>{
		if( !prj ) return;
		// update only the provided properties:
		for( var p in prj ) self[p] = prj[p];
		// Update the meta-data (header):
	//	return server.project(self).update()
 	};
	self.read = ( prj, opts )=>{
		// Assemble the data of the project from all documents in a document database:
		switch( typeof(opts) ) {
			case 'boolean':
				// for backward compatibility:
				opts = {reload: opts, loadAllSpecs: false, loadObjects: false, loadRelations: false};
				break;
			case 'object':
				// normal case (as designed):
			//	if( typeof opts.reload!='boolean' ) opts.reload = false;
				break;
			default:
				opts = {reload: false}
		};
//		console.debug( 'cache.read', opts, self.cache.id, prj );
	
		var pDO = $.Deferred();
		// Read from cache in certain cases:
		if( self.cache.isLoaded && !opts.reload && ( !prj || prj.id==self.cache.id ) ) {
			// return the loaded project:
			pDO.resolve( self );
			return pDO
		};
		// else
		return null
	}; 
	// var updateModes = ["adopt","match","extend","ignore"];
	self.update = (newD, opts:any): JQueryDeferred<void> => {
//		console.debug('update',newD,opts);
		// Use jQuery instead of ECMA Promises for the time being, because of progress notification.
		var uDO = $.Deferred();

		newD = new CSpecIF(newD); // transform to internal data structure

		switch( opts.mode ) {
			case 'update':
			//	updateWithLastChanged( newD, opts );
			//	break;
			case 'adopt':
				adopt(newD, opts);
				break;
			default:
				uDO.reject({status:999,statusText:'Invalid update mode specified'});
		};
		return uDO;

	/*	function updateWithLastChanged( nD, opts ) {
			console.debug('update project',nD,opts);
			// Update a loaded project with data of the new:
			// - Types with the same id must be compatible
			// - New types will be added
			// - Instances with newer changedAt replace older ones
			// - Both the id and alternativeIds are used to associate existing and new instances

			// In a first pass check, if there is any incompatible type making an update impossible:
			rc = classesAreCompatible('dataType',mode);
			if( rc.status>0 ) {
				uDO.reject( rc );
				return uDO
			};
			rc = classesAreCompatible('propertyClass',mode);
			if( rc.status>0 ) {
				uDO.reject( rc );
				return uDO
			};
			rc = classesAreCompatible('resourceClass',mode);
			if( rc.status>0 ) {
				uDO.reject( rc );
				return uDO
			};
			rc = classesAreCompatible('statementClass',mode);
			if( rc.status>0 ) {
				uDO.reject( rc );
				return uDO
			};
			console.info("All existing types are compatible with '"+newD.title+"'");  
		}

		// newD is new data in 'internal' data structure
		// add new elements
		// update elements with the same id
		// exception: since types cannot be updated, return with error in case newD contains incompatible types
		// There are four modes with respect to the types:
		//	- "match": if a type in newD with the same id is already present and it differs, quit with error-code.
		//    This is the minimum condition and true for all of the following modes, as well.
		//  - "deduplicate": if an identical type in newD with a different id is found, take the existing one
		//    and update the instances of the suppressed class.
		//	- "extend": in addition to "deduplicate", combine similar types. E.g. combine integer types and take the overall value range
		//    or add additional propertyClasses to a resourceClass.
		//	- "ignore": new propertyClasses and all their instances are ignored
		mode = mode || 'deduplicate';
//		console.debug('cache.update',newD,mode);
		var rc = {},
			uDO = $.Deferred();
	//	newD = self.set( newD );  // transform to internal data structure
		if( !newD ) {
			uDO.reject({
				status: 995,
				statusText: i18n.MsgImportFailed
			});
			return uDO
		};

		// In a first pass check, if there is any incompatible type making an update impossible:
		rc = classesAreCompatible('dataType',mode);
		if( rc.status>0 ) {
			uDO.reject( rc );
			return uDO
		};
		rc = classesAreCompatible('resourceClass',mode);
		if( rc.status>0 ) {
			uDO.reject( rc );
			return uDO
		};
		rc = classesAreCompatible('statementClass',mode);
		if( rc.status>0 ) {
			uDO.reject( rc );
			return uDO
		};
		console.info("All existing types are compatible with '"+newD.title+"'");

		// In a second pass, start with creating any type which does not yet exist.
		// Start with the datatypes; the next steps will be chained by function updateNext:
		var pend=0;
		addNewTypes('dataType');

		return uDO

		function classesAreCompatible( ctg:string, mode ) {
			let tL = app.standards.listName.get(ctg),
				aL = self.cache[tL],
				nL = newD[tL];
			// true, if every element in nL is compatibly present in aL or if it can be added:
			let j:number, rC;
			for( var i=nL.length-1;i>-1;i-- ) {
				for( j=aL.length-1;j>-1;j-- ) {
//					console.debug('classesAreCompatible',aL[j],nL[i]);
					// if a single element is incompatible the lists are incompatible:
					rC = typeIsCompatible(ctg,aL[j],nL[i],mode);
					// on first error occurring, quit with return code:
					if( rC.status>0 ) return rC
				}
			};
			return {status:0}
		} 
		function updateNext(ctg:string) {
			// chains the updating of types and elements in asynchronous operation:
			console.info('Finished updating:',ctg);
			// having finished with elements of category 'ctg', start next step:
			switch( ctg ) {
				case 'dataType': addNewTypes( 'resourceClass' ); break;
				case 'resourceClass': addNewTypes( 'statementClass' ); break;
				case 'statementClass': updateIfChanged( 'file' ); break;
				case 'file': updateIfChanged( 'resource' ); break;
				case 'resource': updateIfChanged( 'statement' ); break;
				case 'statement': updateIfChanged( 'hierarchy' ); break;
				case 'hierarchy':
						uDO.notify(i18n.MsgProjectUpdated,100);
						console.info('Project successfully updated');
						uDO.resolve();
						break;
				default: uDO.reject() //should never arrive here
			}
		}
		function addNewTypes( ctg:string ) {
			// Is commonly used for resource and statement classes with their propertyClasses.
			let rL, nL, rT;
			switch( ctg ) {
				case 'dataType': rL = self.cache.dataTypes; nL = newD.dataTypes; break;
				case 'resourceClass': rL = self.cache.resourceClasses; nL = newD.resourceClasses; break;
				case 'statementClass': rL = self.cache.statementClasses; nL = newD.statementClasses; break;
				default: return null //should never arrive here
			};
			nL.forEach( (nT)=>{
				rT = LIB.itemById(rL,nT.id);
				if( rT ) {
					// a type with the same id exists.
					// ToDo: Add a new enum value to an existing enum dataType (server does not allow it yet)

					// Add a new property class to an existing type:
					switch( mode ) {
						case 'match':
							// Reference and new data DO match (as checked, before)
							// ... so nothing needs to be done, here.
							// no break
						case 'ignore':
							// later on, only properties for which the user has update permission will be considered,
							// ... so nothing needs to be done here, either.
							break;
						case 'extend':
							// add all missing propertyClasses:
							// ToDo: Is it possible that the user does not have read permission for a property class ??
							// Then, if it is tried to create the supposedly missing property class, an error occurs.
							// But currently all *types* are visible for everybody, so there is no problem.
							if( nT.propertyClasses && nT.propertyClasses.length>0 ) {
								// must create missing propertyClasses one by one in ascending sequence,
								// because a newly added property class can be specified as predecessor:
								addNewPC( rT, nT.propertyClasses, 0 )
							}
					}
				} 
				else {
					// else: the type does not exist and will be created, therefore:
					pend++;
					console.info('Creating type',nT.title);
					self.createItems(nT.category,nT)
						.done(()=>{
							if( --pend<1 ) updateNext( ctg )
						})
						.fail( uDO.reject )
				}
			});
			// if no type needs to be created, continue with the next:
			if(pend<1) updateNext( ctg );
			return

				function addNewPC( r, nPCs, idx ) {
					// r: existing (=reference) type with its propertyClasses
					// nPCs: new list of propertyClasses
					// idx: current index of nPCs
					if( nPCs[idx].id?LIB.itemById( r.propertyClasses, nPCs[idx].id ):itemByName( r.propertyClasses, nPCs[idx].title ) ) {
						// not missing, so try next:
						if( ++idx<nPCs.length ) addNewPC( r, nPCs, idx );
						return
					};

					// else: not found, so create:
					pend++;
					if( idx>0 )
						nPCs[idx].predecessor = nPCs[idx-1].id;

					// add the new property class also to r:
					let p = LIB.indexById( r.propertyClasses, nPCs[idx].predecessor );
					console.info('Creating property class', nPCs[idx].title);
					// insert at the position similarly to the new type;
					// if p==-1, then it will be inserted at the first position:
					r.propertyClasses.splice( p+1, 0, nPCs[idx] );
					server.project({id:self.cache.id}).allClasses({id:r.id}).class(nPCs[idx]).create()
						.done( ()=>{
							// Type creation must be completed before starting to update the elements:
							if( ++idx<nPCs.length ) addNewPC( r, nPCs, idx );
							if( --pend<1 ) updateNext( ctg )
						})
						.fail( uDO.reject )
				}
		}
		function updateIfChanged(ctg:string) {
			// Update a list of the specified category element by element, if changed.
			// Is commonly used for file, resource, statement and hierarchy instances.
			// ToDo: Delete statements of all types provided by the import, which are missing
			// ... not so easy to decide.
			// So perhaps restrict the deletion to those types with creation "auto" only.
			let itemL=null;
			switch( ctg ) {
				case 'file':
					uDO.notify(i18n.MsgLoadingFiles,40);
					// ToDo: check MD5 and upload any file only if changed.
					// For the time being, upload all files anyways. The server does not save duplicate blobs.
					// So we lose 'only' the transfer time.
					if( newD.files && newD.files.length>0 )
						self.updateItems(ctg,newD.files)
							.done( ()=>{
								// Wait for all files to be loaded, so that resources will have higher revision numbers:
								newD.files = [];
								updateNext(ctg)
							})
							.fail( uDO.reject )
					else
						updateNext(ctg);
					return;
				case 'resource': itemL = newD.resources; uDO.notify(i18n.MsgLoadingObjects,50); break;
				case 'statement': itemL = newD.statements; uDO.notify(i18n.MsgLoadingRelations,70); break;
				case 'hierarchy': itemL = newD.hierarchies; uDO.notify(i18n.MsgLoadingHierarchies,80); break;
				default: return null //should never arrive here
			};
			itemL.forEach( (itm)=>{
				updateInstanceIfChanged(ctg,itm)
			});
			// if list is empty, continue directly with the next item type:
			if(pend<1) updateNext( ctg )
			return

			function contentChanged(ctg:string, r, n) { // ref and new resources
//				console.debug('contentChanged',ctg, r, n);
				// Is commonly used for resource, statement and hierarchy instances.
				if( r['class']!=n['class'] ) return null;  // fatal error, they must be equal!

				// Continue in case of resources and statements:
				let i=null, rA=null, nA=null, rV=null, nV=null;
				// 1) Are the property values equal?
				// Skipped, if the new instance does not have any property (list is empty or not present).
				// Statements and hierarchies often have no properties.
				// Resources without properties are useless, as they do not carry any user payload (information).
				// Note that the actual property list delivered by the server depends on the read privilege of the user.
				// Only the properties, for which the current user has update privilege, will be compared.
				// Use case: Update diagrams with model-elements only:
				//		Create a user with update privileges for resourceClass 'diagram'
				//		and property class 'title' of resourceClass 'model-element'.
				//		Then, only the diagrams and the title of the model-elements will be updated.
				if( n.properties && n.properties.length>0 ) {
					for( i=(r.properties?r.properties.length:0)-1;i>-1;i--) {
						rA = r.properties[i];
//						console.debug( 'update?', r, n);
						// no update, if the current user has no privilege:
						if( !rA.upd ) continue;
						// look for the corresponding property:
						nA = LIB.itemBy( n.properties, 'class', rA['class'] );
						// no update, if there is no corresponding property in the new data:
						if( !nA ) continue;
						// in all other cases compare the value:
						let oT = LIB.itemById( app.projects.selected.cache.resourceClasses, n['class'] ),  // applies to both r and n
							rDT = LIB.dataTypeOf( rA['class'], app.projects.selected.cache ),
							nDT = LIB.dataTypeOf( nA['class'], newD );
						if( rDT.type!=nDT.type ) return null;  // fatal error, they must be equal!
						switch( nDT.type ) {
							case 'xs:enumeration':
								// value has a comma-separated list of value-IDs,
								rV = enumValueOf(rDT,rA);
								nV = enumValueOf(nDT,nA);
//								console.debug('contentChanged','ENUM',rA,nA,rV!=nV);
								if( rV!=nV ) return true;
								break;
							case 'xhtml':
						//		rV = toHex(stripCtrl(rA.value).reduceWhiteSpace());
						//		nV = toHex(stripCtrl(fileRef.toServer(nA.value)).reduceWhiteSpace());
						//		rV = stripCtrl(rA.value).reduceWhiteSpace();
								rV = rA.value;
								// apply the same transformation to nV which has been applied to rV before storing:
						//		nV = stripCtrl(fileRef.toServer(nA.value)).reduceWhiteSpace();
						//		nV = fileRef.toServer(nA.value);
								nV = nA.value;
//								console.debug('contentChanged','xhtml',rA,nA,rV!=nV);
								if( rV!=nV ) return true;
								// If a file is referenced, pretend that the resource has changed.
								// Note that a resource always references a file having the next lower revision number than istself.
								// It is possible that a file has been updated, so a referencing resource must be updated, as well.
								// ToDo: Analyse whether a referenced file has really been updated.
								if( RE.tagNestedObjects.test(nV)
									||  RE.tagSingleObject.test(nV) ) return true;
								break;
							default:
								if( rA.value!=nA.value ) return true
						}
					}
				};
				// 2) Statements must have equal subjectClasses and objectClasses - with equal revisions?
				if( ctg == 'statement' ) {
	//				if( n.subject.id!=r.subject.id || n.subject.revision!=r.subject.revision) return true;
	//				if( n.object.id!=r.object.id || n.object.revision!=r.object.revision) return true;
					if( n.subject.id!=r.subject.id
						|| n.object.id!=r.object.id ) return true
				};
				return false // ref and new are the same
			}
			function updateInstanceIfChanged(ctg:string,nI) {
				// Update an element/item of the specified category, if changed.
				pend++;
				self.readItems(ctg,nI,true)	// reload from the server to obtain most recent data
					.done( (rI)=>{
						// compare actual and new item:
//						console.debug('updateInstanceIfChanged',ctg,rI,nI);
						// ToDo: Detect parallel changes and merge interactively ...
						if( Date.parse(rI.changedAt)<Date.parse(nI.changedAt)
								&& contentChanged(ctg,rI,nI) ) {
							nI.revision = rI.revision; // avoid the optimistic locking
							// properties without update permission will not be sent to the server:
							nI.upd = rI.upd;
							nI.del = rI.del;
							let nA=null;
							rI.properties.forEach( (rA)=>{
								// in case the nI.properties are supplied in a different order:
								nA = LIB.itemBy(nI.properties,'class',rA['class']);
								if( nA ) {
									nA.upd = rA.upd;
									nA.del = rA.del
								}
							});
							console.info('Updating instance',nI.title);
							// ToDo: Test whether only supplied properties are updated by the server; otherwise implement the behavior, here.
							self.updateItems( ctg, nI )
								.done( updateTreeIfChanged( ctg, rI, nI ) )	// update the tree, if necessary.
								.fail( uDO.reject )
						} 
						else {
							// no change, so continue directly:
							updateTreeIfChanged( ctg, rI, nI )	// update the tree, if necessary.
						}
					})
					.fail( (xhr)=Y{
						switch( xhr.status ) {
							case 403:
								// This is a hack to circumvent a server limitation.
								// In case the user is not admin, the server delivers 403, if a resource does not exist,
								// whereas it delivers 404, if it is an admin.
								// Thus: If 403 is delivered and the user has read access according to the resourceClass,
								// do as if 404 had been delivered.
								var pT = LIB.itemById(app.projects.selected.cache.allClasses,nI['class']);
//								console.debug('403 instead of 404',nI,pT);
								if( !pT.rea || !pT.cre ) { uDO.reject(xhr); return };
								// else the server should have delivered 404, so go on ...
							case 404:
//								console.debug('not found',xhr.status);
								// no item with this id, so create a new one:
								self.createItems(ctg,nI)
									.done(()=>{
										if( --pend<1 ) updateNext( ctg )
									})
									.fail( uDO.reject )
								break;
							default:
								uDO.reject(xhr)
						}
					})
			}
			function updateTreeIfChanged( ctg:string, aI, nI ) {
				// Update all children (nodes) of a hierarchy root.
				// This is a brute force solution, since any mismatch causes an update of the whole tree.
				// ToDo: Add or delete a single child as required.
				// ToDo: Update the smallest possible subtree in case addition or deletion of a single child is not sufficient.

					function newIds(h) {
						// new and updated hierarchy entries must have a new id (server does not support revisions for hierarchies):
						h.children.forEach( (ch)=>{
							ch.id = LIB.genID('N-');
							newIds(ch)
						})
					}
					function treeChanged(a,n) {
						// Equal hierarchies?
						// All children (nodes in SpecIF terms) on all levels must have the same sequence.
						return nodesChanged(a.children,n.children)

						function nodesChanged(aL,nL) {
//							console.debug( 'nodesChanged',aL,nL )
							if( (!aL || aL.length<1) && (!nL || nL.length<1) ) return false;	// no update needed
							if( aL.length!=nL.length ) return true;								// update!
							for( let i=nL.length-1; i>-1; i-- ) {
								// compare the references only, as the hierarchy ids can change:
								if( !aL[i] || aL[i].ref!=nL[i].ref ) return true;
								if( nodesChanged(aL[i].children,nL[i].children) ) return true
							};
							return false
						}
					}

				// Note: 'updateTreeIfChanged' is called for instance of ALL types, even though only a hierarchy has children.
				// In case of a resource or statement, the tree operations are skipped:
				if( ctg == 'hierarchy' && treeChanged(aI,nI) ) {
					message.show( i18n.MsgOutlineAdded, {severity:'info', duration:CONFIG.messageDisplayTimeShort} );
			//		self.deleteItems('hierarchy',aI.children);		// can be be prohibited by removing the permission, but it is easily forgotten to change the role ...
					newIds(nI);
					server.project(app.projects.selected.cache).specification(nI).createChildren()
						.done( ()=>{
							if( --pend<1 ) updateNext( ctg )
						})
						.fail( uDO.reject )
				} 
				else {
					// no hierarchy (tree) has been changed, so no update:
					if( --pend<1 ) updateNext( ctg )
				}
			}
		} 
	};

	self.init();
	return self;
//////////
// some local helper routines:

/*	function queryObjects( qu, reload ) {
		// get all resources of the specified type: qu is {type: class}
	//	if( !reload ) {
			// collect all resources with the queried type:
			var oL = LIB.forAll( self.cache.resources, (o)=>{ return o['class']==qu.type?o:null } ),
				dO = $.Deferred();
			dO.resolve( oL );
			return dO
	//	};
	}
	function loadFiles() {
		// in case of ReqIF Server, only a list of file meta data is delivered,
		// whereas in case of PouchDB, the files themselves are delivered.
		return self.readItems( 'file', "all", {reload:true} )
	}
	function loadObjsOf( sp ) {
		// Cache all resources referenced in the given spec (hierarchy):
		if( !sp ) { sp = self.cache.selectedHierarchy };
//		console.debug( 'loadObjsOf', sp );

		var cDO = $.Deferred();

			// is called recursively until the whole list has been processed:
			function loadObjs( oL ) {
				if( !loading && !self.exporting ) { return };  // in case the loading has been stopped (by stopAutoLoad) ...
				// convert list of hierarchy entries to list of resources:
				var rL=[];
				for( var o=oL.length-1;o>-1;o-- ) rL[o] = {id: oL[o]};

				return server.readItems( 'resource', rL )
					.done( (rsp)=>{
						// continue caching, if the project hasn't been left, meanwhile:
						if( sp ) {  // sp is null, if the project has been left.
							LIB.cacheL( self.cache.resources, rsp );

							if( cI<sp.flatL.length ) {
								rL = sp.flatL.slice(cI,cI+CONFIG.objToGetCount),  // object list; slice just extracts and does not change original list
								cI += rL.length;  // current index
								loadObjs( rL );
								return
							} 
							else {
								cDO.resolve( self.cache.resources );
								return
							}
						}
					})
					.fail( cDO.reject )
			}
		if( sp && sp.flatL.length>0 ) {
			var rL = sp.flatL.slice(0,CONFIG.objToGetCount),  // object list; slice just extracts and does not change original list
				cI=rL.length;  // current index pointing to start of next batch
			loadObjs( rL )
		} 
		else {
			cDO.resolve([])
		};
		return cDO
	}
	function loadRelsOf( sp ) {
		// Check all referenced resources and get their statements.  Cache the results.
		// Not efficient, but effective and without alternative in light of the server API.
		if( !sp ) { sp = self.cache.selectedHierarchy };
//		console.debug( 'loadRelsOf', sp );

		var rDO = $.Deferred();

			// is called recursively until the whole list has been processed:
			function loadRels( ob ) {
				if( !loading && !self.exporting ) { return };  // in case the loading has been stopped (by stopAutoLoad) ...
//				console.debug( 'loadRels', ob );
				self.readStatementsOf( ob )
					.done( (rsp)=>{
						// continue caching, if the project hasn't been left, meanwhile (sp==null):
						if( sp && ++cI<sp.flatL.length ) {
							loadRels( {id:sp.flatL[cI]} )
						} 
						else {
							rDO.resolve( self.cache.statements )
						}
					})
					.fail( rDO.reject )
			}
		if( sp && sp.flatL.length && self.cache.statementClasses.length>0 ) {
			var cI=0;  // current index
			loadRels( {id:sp.flatL[cI]} )
		} 
		else {
			rDO.resolve([])
		};
		return rDO;
	}
	function loadAll( ctg:string ) {
		// Cycle through all hierarchies and load the instances of the specified ctg:
		// The loaded data is cached.
		switch( ctg ) {
			case 'resource': 	var fn=loadObjsOf; break;
			case 'statement': 	var fn=loadRelsOf; break;
			default: return null
		};
		var dO = $.Deferred(),
			pend = self.cache.hierarchies.length;
		for( var i=self.cache.hierarchies.length-1; i>-1; i-- ) {
			fn( self.cache.hierarchies[i] )
				.done(()=>{
					if(--pend<1) dO.resolve()
				})
				.fail( dO.reject )
		};
		if( self.cache.hierarchies.length<1 ) dO.resolve();
		return dO;
	}
	function autoLoad( aU ) {
//		console.debug( 'cache.autoLoad', aU );
		// only update the cache and continue the chain, if autoLoadId of the time of execution is equal to the time of calling (aU):
		if( autoLoadId && aU==autoLoadId ) {
			// Start timer for next update:
			setTimeout( ()=>{ autoLoad( aU ) }, CONFIG.cacheAutoLoadPeriod )

			// skip this turn, if autoLoad from last trigger is still being executed (avoid multiple updates in parallel):
			if( loading ) { console.info( 'Skipping autoLoad cycle' ); return };
			// else, start the update:
			loading = true;
			// 1) load the dataTypes:
			self.readItems( 'dataType', [], true )	// true: reload
				.done( ()=>{
					if( autoLoadId && aU==autoLoadId ) {  // if the update hasn't been stopped, meanwhile
						// 2) load allClasses:
						self.readItems( 'anyClass', [], true )
							.done( ()=>{
								// new allClasses and the permissions have arrived.
								// 3) update the current spec and the referenced resources:
								if( autoLoadId && aU==autoLoadId )   // if the update hasn't been stopped, meanwhile
									self.loadInstances( autoLoadCb )
							})
							.fail( (xhr)=>{
								loading = false	// e.g. when importing, the calls will fail, but thereafter the autoLoad shall resume.
							})
					}
				})
				.fail( (xhr)=>{
					loading = false	// e.g. when importing, the calls will fail, but thereafter the autoLoad shall resume.
				})
		}
		// else: project has been left or another autoLoad chain has been started, so break this chain.
	}

	function addPermissions( item ) {
		// add permissions;
		// for use with createItems and updateItems functions.
		// Take the correct permissions from the type:
		if( !item || Array.isArray(item)&&item.length<1 ) return;
			function addPerms( itm ) {
				// if current user can create an type, he has the other permissions, as well:
				itm.upd=true;
				itm.del=true;
				if( itm.properties )
					itm.properties.forEach( (ip)=>{
						ip.upd=true;
						ip.del=true
					})
			}
		if( Array.isArray(item) )
			item.forEach( (itm)=>{addPerms(itm)} )
		else
			addPerms(item)
	}
}  // end of function Project()
*/


// This will be merged with the basic declaration of IModule in moduleManager.ts:
// interface IModule {
interface IProjects extends IModule {
	cache: CCache;
	list: CProject[];
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
		self.cache = new CCache({cacheInstances:true});
		self.list = [];
		self.selected = undefined;

		app.standards = new CStandards();

	/*	autoLoadId = undefined;  // stop any autoLoad chain
		autoLoadCb = undefined;  */

		return true
	};
	self.create = (dta: SpecIF, opts: any): JQueryDeferred<void> => {
		// in this implementation, delete existing projects to save memory space:
		self.list.length = 0;
		self.cache.clear();
		// append a project to the list:
		self.selected = new CProject(self.cache);
		self.list.push( self.selected );
		return self.selected.create(dta, opts);
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
						self.readItems( 'hierarchy', self.selectedHierarchy, true )	// true: reload
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
