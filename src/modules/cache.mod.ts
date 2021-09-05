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
interface IProject {
	data: CSpecIF;
	exporting: boolean;
	abortFlag: boolean;
	init: Function;
	isLoaded: Function;
	create: Function;
	update: Function;
	createContent: Function;
	readContent: Function;
	updateContent: Function;
	deleteContent: Function;
	createResource: Function;
	readStatementsOf: Function;
	createFolderWithResourcesByType: Function;
	createFolderWithGlossary: Function;
	deduplicate: Function;
	exportFormatClicked: Function;
	exportOptionsClicked: Function;
	exportOptions: Function;
	chooseFormatAndExport: Function;
	exportAs: Function;
	abort: Function;
}
// This will be merged with the basic declaration of IModule in moduleManager.ts:
// interface IModule {
interface IProjects extends IModule {
	cacheInstances: boolean;
	projects: IProject[];
	selectedProject: IProject;
	create: Function;
}

moduleManager.construct({
	name: 'cache'
}, (self: IProjects) => {
	// Construct a representative of the selected project with cached data:
	// ToDo: enforce CONFIG.maxItemsToCache

/*	var autoLoadId,				// max 1 autoLoad chain
		autoLoadCb;				// callback function when the cache has been updated  */
	self.cacheInstances = true;

	// initialization is at the end of this constructor.
	self.init = ():boolean =>{
		// initialize/clear all variables:
		self.projects = [];
		self.selectedProject = undefined;

	/*	autoLoadId = undefined;  // stop any autoLoad chain
		autoLoadCb = undefined;  */

		return true
	};
	self.create = (prj:SpecIF, opts:any ): JQueryDeferred<void> => {
		// in this implementation, delete existing projects to save memory space:
		self.projects.length = 0;

		// append a project to the list:
		self.projects.push( Project() );
		self.selectedProject = self.projects[self.projects.length-1];
		return self.selectedProject.create( prj, opts );
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
		autoLoadId = genID( 'aU-' );
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
		} else {
			lDO.resolve()
		};
		return lDO
	};
*/
	return self;
});

function Project(): IProject {
	// Constructor for a project containing SpecIF data.
	var self: any = {},
		//	loading = false,		// true: data is being gathered from the server.
		fileName: string;
	self.init = (): void => {
		// initialize/clear all variables:
		self.data = new CSpecIF();

		//	loading = false;
		self.exporting = false;		// prevent concurrent exports
		self.abortFlag = false
	};
	self.isLoaded = (): boolean => {
		return typeof (self.data.id) == 'string' && self.data.id.length > 0
	};

	self.create = (newD: any, opts: any): JQueryDeferred<void> => {
		// create a project, if there is no project with the given id, or replace a project with the same id.
		// (The roles/permissions and the role assignment to users are preserved, when import via ReqIF-file is made)
		// If there is no newD.id, it will be generated by the server.
		// Use jQuery instead of ECMA Promises for the time being, because of progress notification.
		var sDO = $.Deferred();

		// Create the specified project:
		let ti = newD.title,
			pend: number;

		self.abortFlag = false;
		newD = new CSpecIF(newD); // transform to internal data structure
//		console.debug('app.cache.selectedProject.data.create',newD);

		if ( newD.isValid() ) {
			self.data.setMeta(newD);

			// Create the project
			// The project meta-data and each item are created as a separate document in a document database;
			// at the same time the cache is updated.
			sDO.notify(i18n.MsgLoadingTypes, 30);
			pend = 8;
			self.createContent('dataType', newD.dataTypes)
				.then(finalize, sDO.reject);
			self.createContent('propertyClass', newD.propertyClasses)
				.then(finalize, sDO.reject);
			self.createContent('resourceClass', newD.resourceClasses)
				.then(finalize, sDO.reject);
			self.createContent('statementClass', newD.statementClasses)
				.then(finalize, sDO.reject);
			self.createContent('file', newD.files)
				.then(finalize, sDO.reject);
			self.createContent('resource', newD.resources)
				.then(finalize, sDO.reject);
			self.createContent('statement', newD.statements)
				.then(finalize, sDO.reject);
			self.createContent('hierarchy', newD.hierarchies)
				.then(finalize, sDO.reject);
			if (opts.addGlossary) {
				pend++;
				self.createFolderWithGlossary(self.data, opts)
					.then(finalize, sDO.reject);
			};
		}
		else {
			sDO.reject({ status: 995, statusText: i18n.lookup('MsgImportFailed', ti) });
		};
		return sDO;

		function finalize(): void {
			if (--pend < 1) {
				sDO.notify(i18n.MsgLoadingFiles, 100);
				hookStatements();

				if (opts.deduplicate)
					self.deduplicate();	// deduplicate equal items
				// ToDo: Update the server !

				sDO.resolve()
			}
		}
	};
/*	self.updateMeta = ( prj )=>{
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
//		console.debug( 'cache.read', opts, self.data.id, prj );
	
		var pDO = $.Deferred();
		// Read from cache in certain cases:
		if( self.data.isLoaded && !opts.reload && ( !prj || prj.id==self.data.id ) ) {
			// return the loaded project:
			pDO.resolve( self );
			return pDO
		};
		// else
		return null
	}; */
	class CType {
		ctg: string;
		list: string;
		isEqual: Function;
		isCompatible: Function;
		substitute: Function;
		constructor(ctg:string, eqF:Function, compF:Function, subsF:Function) {
			this.ctg = ctg;
			this.list = standardTypes.listNameOf(ctg);
			this.isEqual = eqF;
			this.isCompatible = compF;
			this.substitute = subsF;
		}
	}
//	Create a table of types and relevant attributes:	
	const types = [
		new CType('dataType', equalDT, compatibleDT, substituteDT),
		new CType('propertyClass', equalPC, compatiblePC, substitutePC),
		new CType('resourceClass', equalRC, compatibleRC, substituteRC),
		new CType('statementClass', equalSC, compatibleSC, substituteSC)
	];

	function equalDT(r: DataType, n: DataType): boolean {
		// return true, if reference and new dataType are equal:
		if( r.type!=n.type ) return false;
		switch (r.type) {
			case TypeEnum.XsDouble:
				if( r.fractionDigits!=n.fractionDigits ) return false;
				// no break
			case TypeEnum.XsInteger:
				return r.minInclusive == n.minInclusive && r.maxInclusive == n.maxInclusive;
			case TypeEnum.XsString:
			case TypeEnum.XHTML:
				return r.maxLength == n.maxLength;
			case TypeEnum.XsEnumeration:
				// Perhaps we must also look at the title ..
				// @ts-ignore - values is optional for a dataType, but not for an enumerated dataType
				if( r.values.length!=n.values.length ) return false;
				// @ts-ignore - values is optional for a dataType, but not for an enumerated dataType
				for( var i=n.values.length-1; i>-1; i-- )
					// assuming that the titles/values don't matter:
					// @ts-ignore - values is optional for a dataType, but not for an enumerated dataType
					if( indexById(r.values, n.values[i].id)<0 ) return false;
				// the list of enumerated values *is* equal,
				// finally check for the multiple flag:
				return (r.multiple && n.multiple || !r.multiple && !n.multiple);
			default:
				return true;
		};
	}
	function equalPC(r: PropertyClass, n: PropertyClass):boolean {
		// return true, if reference and new propertyClass are equal:
		return r.dataType == n.dataType
			&& r.title == n.title
			&& (r.multiple && n.multiple || !r.multiple && !n.multiple);
	}
	function equalRC(r: ResourceClass, n: ResourceClass): boolean {
		// return true, if reference and new resourceClass are equal:
		if( !r.isHeading&&n.isHeading || r.isHeading&&!n.isHeading ) return false;
		return r.title==n.title
			&& eqL( r.propertyClasses, n.propertyClasses )
		//	&& eqL( r.instantiation, n.instantiation )
			// --> the instantiation setting of the reference shall prevail
	}
	function equalSC(r:StatementClass, n:StatementClass): boolean {
		// return true, if reference and new statementClass are equal:
		return r.title==n.title
			&& eqSCL( r.propertyClasses, n.propertyClasses )
			&& eqSCL( r.subjectClasses, n.subjectClasses )
			&& eqSCL( r.objectClasses, n.objectClasses )
			&& eqSCL( r.instantiation, n.instantiation );

		function eqSCL(rL:any, nL:any): boolean {
//			console.debug('eqSCL',rL,nL);
			// return true, if both lists have equal members,
			// in this case we allow also less specified statementClasses
			// (for example, when a statement is created from an Excel sheet):
			if( !Array.isArray(nL) ) return true;
			// no or empty lists are allowed and considerated equal:
			let rArr = Array.isArray(rL) && rL.length>0,
				nArr = Array.isArray(nL) && nL.length>0;
			if( !rArr&&nArr
				|| rL.length!=nL.length ) return false;
			// the sequence may differ:
			for( var i=rL.length-1; i>-1; i-- )
				if( nL.indexOf( rL[i] )<0 ) return false;
			return true;
		}
	}

	function equalKey(r: KeyObject, n: KeyObject): boolean {
		// Return true if both keys are equivalent;
		// this applies if only an id is given or a key with id and revision:
		return itemIdOf(r)==itemIdOf(n)
			&& r.revision==n.revision;
	}
	RE.splitNamespace = /^(\w+:|\w+\.)?(\w+)$/;
	function equalR(prj: SpecIF, r:Resource, n:Resource): boolean {
//		console.debug('equalR',r,n,resClassTitleOf(r,dta),resClassTitleOf(n,dta));
		// return true, if reference and new resource are equal.
		// ToDo: Consider, if model-elements are only considered equal, if they have the same type,
		// i.e. if a property with title CONFIG.propClassType has the same value

		// Sort out most cases with minimal computing:
		if (r.title != n.title || resClassTitleOf(r, prj) != resClassTitleOf(n, prj))
			return false;

		// Here, both resources have equal titles and class-titles:

		// Only a genuine title will be considered truly equal, but not a default title
		// being equal to the content of property CONFIG.propClassType is not considered equal
		// (for example BPMN endEvents which don't have a genuine title):
		let typ = valByTitle(r, CONFIG.propClassType, prj),
			rgT = RE.splitNamespace.exec(typ);
		// rgT[2] contains the type without namespace (works also, if there is no namespace).
		return (!rgT || rgT[2] != r.title);
		// Note that the content of the new resource is lost;
		// this is no problem, if the new data is a BPMN model, for example,
		// which usually have a title and do not carry any description.
	}
	function equalS(r:Statement, n:Statement): boolean {
		// return true, if reference and new statement are equal:
		// ToDo: Model-elements are only equal, if they have the same type,
		// i.e. a property with title CONFIG.propClassType has the same value
		return r['class']==n['class']
			&& equalKey(r.subject,n.subject)
			&& equalKey(r.object,n.object);
	}
	function equalF(r: any, n: any): boolean {
		// return true, if reference and new file are equal:
		return r.id == n.id
			&& r.title == n.title
			&& r.type == n.type;
	}
	function eqL(rL: any[], nL: any[]): boolean {
		// return true, if both lists have equal members:
		// no or empty lists are allowed and considerated equal:
		let rArr = Array.isArray(rL) && rL.length>0,
			nArr = Array.isArray(nL) && nL.length>0;
		if( !rArr&&!nArr ) return true;
		if( !rArr&&nArr
			|| rArr&&!nArr
			|| rL.length!=nL.length ) return false;
		// the sequence may differ:
		for( var i=rL.length-1; i>-1; i-- )
			if( nL.indexOf( rL[i] )<0 ) return false;
		return true;
	}
	function typeIsCompatible(ctg: string, refC:any, newC:any, mode?: string): xhrMessage {
		//	if(refC.id!=newC.id) return {status:0};
		// else: identifiers are equal:
		//		console.debug( 'typeIsCompatible', refC, newC );
		switch (ctg) {
			case 'dataType':
				// A dataType is incompatible, if an existing one has the same id and a smaller value range.
				// A dataType is compatible, if an existing one has the same id and an equal or larger value range.
				switch (refC.type) {
					case TypeEnum.XsBoolean:
					case TypeEnum.XsDateTime:
						return { status: 0 };
					case TypeEnum.XHTML:
					case TypeEnum.XsString:
						//						console.debug( refC.maxLength>newC.maxLength-1 );
						if (refC.maxLength == undefined)
							return { status: 0 };
						if (newC.maxLength == undefined || refC.maxLength < newC.maxLength)
							return { status: 951, statusText: "new dataType '" + newC.id + "' of type '" + newC.type + "' is incompatible" };
						return { status: 0 };
					case TypeEnum.XsDouble:
						// to be compatible, the new 'fractionDigits' must be lower or equal:
						if (refC.fractionDigits < newC.fractionDigits)
							return { status: 952, statusText: "new dataType '" + newC.id + "' of type '" + newC.type + "' is incompatible" };
						// else: go on ...
					case TypeEnum.XsInteger:
						// to be compatible, the new 'maxInclusive' must be lower or equal and the new 'minInclusive' must be higher or equal:
						//						console.debug( refC.maxInclusive<newC.maxInclusive || refC.minInclusive>newC.minInclusive );
						if (refC.maxInclusive < newC.maxInclusive || refC.minInclusive > newC.minInclusive)
							return { status: 953, statusText: "new dataType '" + newC.id + "' of type '" + newC.type + "' is incompatible" }
						else
							return { status: 0 };
					case TypeEnum.XsEnumeration:
						// to be compatible, every value of the new 'enumeration' must be present in the present one:
						// ToDo: Add a new enum value to an existing enum dataType.
						var idx: number;
						for (var v = newC.values.length - 1; v > -1; v--) {
							idx = indexById(refC.values, newC.values[v].id);
							// the id must be present:
							if (idx < 0)
								return { status: 954, statusText: "new dataType '" + newC.id + "' of type '" + newC.type + "' is incompatible" };
							//  ... and the titles must be equal:
							if (refC.values[idx].title != newC.values[v].title)
								return { status: 955, statusText: "new dataType '" + newC.id + "' of type '" + newC.type + "' is incompatible" }
						};
						return { status: 0 };
				};
				// should never arrive here ... as every branch in every case above has a return.
				throw Error("Invalid data type.");
			case 'propertyClass':
				return equalPC(refC, newC) ? { status: 0 }
					: { status: 956, statusText: "new " + ctg + " '" + newC.id + "' is incompatible" };
			case 'statementClass':
				// To be compatible, all sourceTypes of newC must be contained in the sourceTypes of refC;
				// no sourceTypes means that all resourceClasses are permissible as subject.
				// ... and similarly for the targetTypes:
				if (refC.sourceTypes && !newC.sourceTypes
					|| refC.sourceTypes && newC.sourceTypes && !containsById(refC.sourceTypes, newC.sourceTypes)) {
					return { status: 961, statusText: "new " + ctg + " '" + newC.id + "' is incompatible" }
				};
				if (refC.targetTypes && !newC.targetTypes
					|| refC.targetTypes && newC.targetTypes && !containsById(refC.targetTypes, newC.targetTypes)) {
					return { status: 962, statusText: "new " + ctg + " '" + newC.id + "' is incompatible" }
				};
			// else: so far everything is OK, but go on checking ... (no break!)
			case 'resourceClass':
				// A resourceClass or statementClass is incompatible, if it has an equally-named property class with a different dataType
				// A resourceClass or statementClass is compatible, if all equally-named propertyClasses have the same dataType
				if (!newC.propertyClasses || !newC.propertyClasses.length)
					return { status: 0 };
				// else: The new type has at least one property.
				if (mode == 'match' && (!refC.propertyClasses || refC.propertyClasses.length < 1))
					return { status: 963, statusText: "new " + ctg + " '" + newC.id + "' is incompatible" };
				var idx:number, npc:PropertyClass;
				for (var a = newC.propertyClasses.length - 1; a > -1; a--) {
					npc = newC.propertyClasses[a];
					if (npc.id) {
						// If an id exists, it must be equal to one of refC's propertyClasses:
						idx = indexById(refC.propertyClasses, npc.id)
					} else {
						// If there is no id, the type is new and there are no referencing elements, yet.
						// So it does not matter.
						// But there must be a property class with the same name:
						idx = indexByTitle(refC.propertyClasses, npc.title)
					};
					if (idx < 0) {
						// The property class in the new data is not found in the existing (reference) data:
						if (mode == 'match')
							// the property class is expected and thus an error is signalled:
							return { status: 964, statusText: "new " + ctg + " '" + newC.id + "' is incompatible" }
						else
							// cases 'extend' and 'ignore';
							// either the property will be created later on, or it will be ignored;
							// we are checking only in a first pass.
							continue;
					};
					//  else: the property class is present; in this case and in all modes the dataTypes must be equal:
					if (refC.propertyClasses[idx].dataType != npc.dataType) {
						return { status: 965, statusText: "new " + ctg + " '" + newC.id + "' is incompatible" }
					}
				};
				return { status: 0 };
		};
		// should never arrive here ...
		throw Error("Invalid category '" + ctg + "'.");
	}
	function compatibleDT(refC: DataType, newC: DataType): boolean {
		return typeIsCompatible("dataType", refC, newC).status == 0;
	}
	function compatiblePC(refC: PropertyClass, newC: PropertyClass): boolean {
		return typeIsCompatible("propertyClass", refC, newC).status == 0;
	}
	function compatibleRC(refC: ResourceClass, newC: ResourceClass, mode?: string): boolean {
		return typeIsCompatible("resourceClass", refC, newC, mode).status == 0;
	}
	function compatibleSC(refC: StatementClass, newC: StatementClass): boolean {
		return typeIsCompatible("statementClass", refC, newC).status == 0;
	}
	function substituteDT(prj: SpecIF,rId:string,nId:string):void {
		// For all propertyClasses, substitute new by the original dataType:
		substituteProp(prj.propertyClasses,'dataType',rId,nId);
	}
	function substitutePC(prj: SpecIF, rId: string, nId: string):void {
		// For all resourceClasses, substitute new by the original propertyClass:
		substituteLe(prj.resourceClasses,'propertyClasses',rId,nId);
		// Also substitute the resource properties' class:
		prj.resources.forEach( (res)=>{
			substituteProp(res.properties,'class',rId,nId);
		});
		// The same with the statementClasses:
		substituteLe(prj.statementClasses,'propertyClasses',rId,nId);
		prj.statements.forEach( (sta)=>{
			substituteProp(sta.properties,'class',rId,nId)
		});
	}
	function substituteRC(prj: SpecIF, rId: string, nId: string):void {
		// Substitute new by original resourceClass:
		substituteLe(prj.statementClasses,'subjectClasses',rId,nId);
		substituteLe(prj.statementClasses,'objectClasses',rId,nId);
		substituteProp(prj.resources,'class',rId,nId);
	}
	function substituteSC(prj: SpecIF, rId: string, nId: string):void {
		// Substitute new by original statementClass:
		substituteProp(prj.statements, 'class', rId, nId);
	}
	function substituteR(prj: SpecIF, r: Resource, n: Resource, opts?: any): void {
		// Substitute resource n by r in all references of n,
		// where r is always an element of self.data.
		// But: Rescue any property of n, if undefined for r.
		//		console.debug('substituteR',r,n,prj.statements);

		if (opts && opts.rescueProperties) {
			// Rescue any property value of n,
			// if the corresponding property of the adopted resource r is undefined or empty;
			// looking at the property types, which ones are in common:
			n.properties.forEach((nP) => {
				if (hasContent(nP.value)) {
					// check whether existing resource has similar property;
					// a property is similar, if it has the same title,
					// where the title may be defined with the property class.
					let pT = propTitleOf(nP, prj),
						rP = propByTitle(r, pT, self.data);
//					console.debug('substituteR 3a',nP,pT,rP,hasContent(valByTitle( r, pT, self.data )));
					if (!hasContent(valByTitle(r, pT, self.data))
						// dataTypes must be compatible:
						&& compatibleDT(dataTypeOf(self.data, rP['class']), dataTypeOf(prj, nP['class']))) {
						//	&& typeIsCompatible( 'dataType', dataTypeOf(self.data,rP['class']), dataTypeOf(prj,nP['class']) ).status==0 ) {
						rP.value = nP.value;
					};
				};
			});
		};
		// In the rare case that the ids are identical, there is no need to update the references:
		if (r.id == n.id) return;

		// 1. Memorize the replaced id, if not yet listed:
		if (!Array.isArray(r.alternativeIds)) r.alternativeIds = [];
		cacheE(r.alternativeIds, n.id);

		// 2. Replace the references in all statements:
		prj.statements.forEach((st: Statement) => {
			if (equalKey(st.object, n)) { if (st.object.id) { st.object.id = itemIdOf(r) } else { st.object = itemIdOf(r) } };
			if (equalKey(st.subject, n)) { if (st.subject.id) { st.subject.id = itemIdOf(r) } else { st.subject = itemIdOf(r) } }
			// ToDo: Is the substitution is too simple, if a key is used?
		});

		// 3. Replace the references in all hierarchies:
		substituteRef(prj.hierarchies, r.id, n.id);

		// 4. Make sure all statementClasses allowing n.class also allow r.class (the class of the adopted resource):
		prj.statementClasses.forEach((sC: StatementClass) => {
			if (Array.isArray(sC.subjectClasses) && sC.subjectClasses.indexOf(n['class']) > -1) cacheE(sC.subjectClasses, r['class']);
			if (Array.isArray(sC.objectClasses) && sC.objectClasses.indexOf(n['class']) > -1) cacheE(sC.objectClasses, r['class']);
		});
	}
	function substituteProp(L,propN:string,rAV:string,dAV:string):void {
		// replace ids of the duplicate item by the id of the original one;
		// this applies to the property 'propN' of each member of the list L:
		if( Array.isArray(L) )
			L.forEach( (e)=>{ if(e[propN]==dAV) e[propN] = rAV } );
	}
	function substituteLe(L,propN:string,rAV:string,dAV:string):void {
		// Replace the duplicate id by the id of the original item;
		// so replace dAV by rAV in the list named 'propN'
		// (for example: in L[i][propN] (which is a list as well), replace dAV by rAV):
		let idx:number;
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
	function substituteRef(L,rId:string,dId:string):void {
		// For all hierarchies, replace any reference to dId by rId;
		// eliminate double entries in the same folder (together with the children):
		iterateNodes( L,
				// replace resource id:
				(nd)=>{ if(nd.resource==dId) {nd.resource=rId}; return true },
				// eliminate duplicates within a folder (assuming that it will not make sense to show the same resource twice in a folder;
				// for example it is avoided that the same diagram is shown twice if it has been imported twice:
				(ndL)=>{ for(var i=ndL.length-1; i>0; i--) { if( indexBy(ndL.slice(0,i),'resource',ndL[i].resource)>-1 ) { ndL.splice(i,1) }}}
		);
		// ToDo: Make it work, if keys are used as a reference.
	}
	function hookStatements( dta?:SpecIF ):void {
		if( typeof(dta)!='object' || !dta.id ) dta = self.data;
//		console.debug('hookStatements',dta);
		// For all statements with a loose end, hook the resource
		// specified by title or by a property titled dcterms:identifier:
		dta.statements.forEach( (st:Statement)=>{
			// Check every statement;
			// it is assumed that only one end is loose:
			if( st.subjectToFind ) {
				// Find the resource with a value of property titled CONFIG.propClassId:
				let s, sL = itemsByVisibleId( dta.resources, st.subjectToFind );
				if( sL.length>0 )
					s = sL[0];
				else
					// Find the resource with the given title:
					s = itemByTitle( dta.resources, st.subjectToFind );
//				console.debug('hookStatements subject',s);
				if( s ) {
					st.subject = s.id;
					delete st.subjectToFind;
					return;
				};
			};
			if( st.objectToFind ) {
				// Find the resource with a value of property titled CONFIG.propClassId:
				let o, oL = itemsByVisibleId( dta.resources, st.objectToFind );
				if( oL.length>0 )
					o = oL[0];
				else
					// Find the resource with the given title:
					o = itemByTitle( dta.resources, st.objectToFind );
//				console.debug('hookStatements object',o);
				if( o ) {
					st.object = o.id;
					delete st.objectToFind;
					return;
				};
			};
		});
		return;

		function itemsByVisibleId(L,vId:string):Resource[] {
			// return a list with all elements in L having a property 
			// containing a visible id with value vId;
			// should only be one resulting element:
			return forAll( L, (r)=>{
				if( visibleIdOf(r)==vId ) return r;
			});
		}
	}
	self.createFolderWithResourcesByType = ( dta:SpecIF, opts?:any ):Promise<void> =>{
		// Collect all business processes, requirements etc according to 'resourcesToCollect':
		const resourcesToCollect = [
			{ type: CONFIG.resClassProcess, flag:"collectProcesses", folder: CONFIG.resClassProcesses, folderNamePrefix:"FolderProcesses-"}
		];
		var r:Instance = itemById( dta.resources, dta.hierarchies[0].resource ),
			rC:ResourceClass = itemById( dta.resourceClasses, r['class'] ),
			prp:Property = itemByTitle( r.properties, CONFIG.propClassType ),
			// the type of the hierarchy root can be specified by a property titled CONFIG.propClassType
			// or by the title of the resourceClass:
			singleHierarchyRoot = dta.hierarchies.length==1 
									&& (prp && CONFIG.hierarchyRoots.indexOf(prp.value)>-1
										|| rC && CONFIG.hierarchyRoots.indexOf(rC.title)>-1);
		return new Promise(
			(resolve,reject)=>{
				if (typeof (opts) != 'object') {
					resolve();
					return;
				};
				if( typeof(dta)!='object' || !dta.id ) dta = self.data;
				let apx = simpleHash(dta.id),
					tim = new Date().toISOString();

					function resDoesNotExist(rL:any[],res:Resource):boolean {
						for (var i = rL.length - 1; i > -1; i--)
							if (rL[i].r.id == res.id) return false;
						return true;
					}

				resourcesToCollect.forEach(
					( r2c )=>{
//						console.debug('rc2c',r2c,opts);
						if( !opts[r2c.flag] ) { resolve(); return; };
						// Assuming that the folder objects for the respective folder are available

						// 1 Find all resp. folders (e.g. process folder):
						let delL: SpecifNode[] = [],
							creL: any[] = [],
							res: Resource,
							pV;
//						console.debug('createFolderWithResourcesByType',dta.hierarchies,opts);
						iterateNodes( dta.hierarchies,
										(nd:SpecifNode)=>{
											// get the referenced resource:
											res = itemById( dta.resources, nd.resource );
											// find the property defining the type:
											pV = valByTitle(res,CONFIG.propClassType,dta);
											// collect all nodes to delete, there should be only one:
											if( pV==r2c.folder ) {
												delL.push( nd );
											};
											// collect all elements for the new folder,
											// but avoid duplicate entries:
											if (pV == r2c.type && resDoesNotExist(creL,res)) {
												creL.push( {n:nd,r:res} );
											};
											return true;  // continue always to the end
										}
						);
//						console.debug('createFolderWithResourcesByType',delL,creL);

						// 2. Delete any existing folders:
						//    (Alternative: Keep folder and delete only the children.)
						self.deleteContent( 'node', delL )
						.then(
							()=>{
								// Create a folder with all respective objects (e.g. diagrams):
								if( creL.length>0 ) {
									// 3. Sort the list alphabetically by the resources' title:
									sortBy( creL, (el:any)=>{ return el.r.title } );

									// 4. Create a new combined folder:
									let newD = {
										id: 'Create ' + r2c.type + ' ' + new Date().toISOString(),
										$schema: 'https://specif.de/v1.0/schema.json',
										dataTypes: [
											standardTypes.get('dataType',"DT-ShortString"),
											standardTypes.get('dataType',"DT-Text")
										],
										propertyClasses: [
											standardTypes.get('propertyClass',"PC-Name"),
											standardTypes.get('propertyClass',"PC-Description"),
											standardTypes.get('propertyClass',"PC-Type")
										],
										resourceClasses: [
											standardTypes.get('resourceClass',"RC-Folder")
										],
										resources: Folder( r2c.folderNamePrefix+apx, CONFIG.resClassProcesses ),
										hierarchies: []
									};
									// use the update function to eliminate duplicate types:
									self.update( newD, {mode:'adopt'} )
									.done( ()=>{
										// Finally create the node referencing the folder to create:
										let nd: INodeWithPosition = {
											id: "H"+r2c.folderNamePrefix+apx,
											resource: r2c.folderNamePrefix+apx,
											// re-use the nodes with their references to the resources:
											nodes: forAll( creL, (pr)=>{ return pr.n; } ),
											changedAt: tim
										};
										// Insert the hierarchy node as first element of a hierarchy root 
										// - if it is present and
										// - if there is only one hierarchy root
										// or as first element at root level, otherwise:
										if( singleHierarchyRoot )
											nd.parent = dta.hierarchies[0].id;
										self.createContent( 'node', nd )
										.then( resolve, reject );
									})
									.fail( reject ); 
								} else {
									resolve();
								};
							},
							reject
						);
					}
				);
				return;

				function Folder(fId:string,ti:string):Resource[] {
					var fL:Resource[] = [{
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
	self.createFolderWithGlossary = ( dta:SpecIF, opts:any ):Promise<void> =>{
		return new Promise(
			(resolve,reject)=>{
				if (typeof (opts) != 'object' || !opts.addGlossary) { resolve(); return; };
				if( typeof(dta)!='object' || !dta.id ) dta = self.data;
				// Assumes that the folder objects for the glossary are available

				// 1. Delete any existing glossaries
				// 1.1 Find all Glossary folders:
				let delL: SpecifNode[] = [],
					diagramL: Resource[] = [],
					res: Resource,
					pV,
					apx = simpleHash(self.data.id),
					tim = new Date().toISOString();
//				console.debug('createFolderWithGlossary',dta.hierarchies);
				iterateNodes( dta.hierarchies,
					(nd: SpecifNode):boolean =>{
								// get the referenced resource:
								res = itemById( dta.resources, nd.resource );
								// check, whether it is a glossary:
								pV = valByTitle(res,CONFIG.propClassType,dta);
								// collect all items to delete, there should be only one:
								if( pV==CONFIG.resClassGlossary ) {
									delL.push( nd )
								};
								// collect all diagrams which are referenced in the hierarchy
								// for inclusion in the new folders:
								if( isDiagram( res ) ) {
									diagramL.push( res )
								};
								return true  // continue always to the end
							}
				);
				// 1.2 Delete now:
//				console.debug('createFolderWithGlossary',delL,diagramL);
				self.deleteContent( 'node', delL )
				.then(
					()=>{
						// 2. Create a new combined glossary:
						if( diagramL.length>0 ) {
							let newD = {
								id: 'Create Glossary ' + new Date().toISOString(),
								$schema: 'https://specif.de/v1.0/schema.json',
								dataTypes: [
									standardTypes.get('dataType',"DT-ShortString"),
									standardTypes.get('dataType',"DT-Text")
								],
								propertyClasses: [
									standardTypes.get('propertyClass',"PC-Name"),
									standardTypes.get('propertyClass',"PC-Description"),
									standardTypes.get('propertyClass',"PC-Type")
								],
								resourceClasses: [
									standardTypes.get('resourceClass',"RC-Folder")
								],
								resources: Folders(),
								hierarchies: NodeList(self.data.resources)
							};
//							console.debug('glossary',newD);
							// use the update function to eliminate duplicate types;
							// 'opts.addGlossary' must not be true to avoid an infinite loop:
							self.update( newD, {mode:'adopt'} )
							.done( resolve )
							.fail( reject );
						} else {
							resolve();
						}
					},
					reject
				);
				return;

				function isDiagram( r:Resource ):boolean {
					// a resource is a diagram, if it's type has a title 'SpecIF:Diagram':
					// .. or if it has a property dcterms:type with value 'SpecIF:Diagram':
					// .. or if it has at least one statement with title 'SpecIF:shows':
					return resClassTitleOf( r, dta )==CONFIG.resClassDiagram
						|| valByTitle(r,CONFIG.propClassType,dta)==CONFIG.resClassDiagram
						|| dta.statements.filter(
								(sta)=>{
									return staClassTitleOf( sta, dta )==CONFIG.staClassShows && sta.subject==r.id
								}
							).length>0;
				}
			/*	function extractByType(fn) {
					var L=[], el;
					iterateNodes( dta.hierarchies,
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
							var res = itemById( dta.resources, nd.resource );
							if( isDiagram( res ) ) return res;
						}
					);
				} */
				function Folders():Resource[] {
					// Create the resources for folder and subfolders of the glossary:
					var fL:Resource[] = [{
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
					CONFIG.modelElementClasses.forEach( (mEl:string)=>{
						fL.push({
							id: "Folder-" + mEl.jsIdOf() + "-" + apx,
							class: "RC-Folder",
							title: mEl+'s',  // just adding the 's' is an ugly quickfix ... that works for now.
							properties: [],
							changedAt: tim
						});
					});
					return fL;
				}
				function NodeList(resources:Resource[]):SpecifNode[] {
					// a. Add the folders:
					let gl:SpecifNode = {
							id: "H-FolderGlossary-" + apx,
							resource: "FolderGlossary-" + apx,
							nodes: [],
							changedAt: tim
					};
					// Create a hierarchy node for each folder per model-element type
					CONFIG.modelElementClasses.forEach( function (mEl:string) {
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
					let idx:number,
						tL = forAll( CONFIG.modelElementClasses, ()=>{ return [] } );
					// Each collection carries the ids of resourceClasses for the given model-element type:
					self.data.resourceClasses.forEach(
						(rC:ResourceClass)=>{
							idx = CONFIG.modelElementClasses.indexOf(rC.title);
							if( idx>-1 ) tL[idx].push(rC.id);
						}
					);
//					console.debug('gl tL',gl,tL);

					// b. list all statements typed SpecIF:shows of diagrams found in the hierarchy:
					let staL = dta.statements.filter(
							(s)=>{ return staClassTitleOf( s, dta )==CONFIG.staClassShows && indexById( diagramL, s.subject )>-1; }
						);
//					console.debug('gl tL dL',gl,tL,staL);

					// c. Add model-elements by class to the respective folders.
					// In case of model-elements the resource class is distinctive;
					// the title of the resource class indicates the model-element type.
					// List only resources which are shown on a referenced diagram:
					let resL = resources.filter( (r)=>{ return indexBy( staL, 'object', r.id )>-1 } );
					// in alphanumeric order:
					sortByTitle( resL );
					// ToDo: consider to sort by the title property via elementTitleOf()

					// Categorize resources:
					resL.forEach(
						(r:Resource):void =>{
							// ... using the collections per fundamental model-element type:
							for( idx=tL.length-1;idx>-1;idx-- ) {
								if( tL[idx].indexOf( r['class'] )>-1 ) break;
							};
							if( idx>-1 )
								gl.nodes[idx].nodes.push({
									// Create new hierarchy node with reference to the resource:
									// ID should be the same when the glossary generated multiple times,
									// but must be different from a potential reference somewhere else.
									id: 'N-' + simpleHash(r.id + '-gen'),
									resource: r.id,
									changedAt: tim
								});
						}
					);
					return [gl];
				}
			}
		)
	};
	self.deduplicate = ( dta?:SpecIF ):void =>{
		// Uses the cache.
		// ToDo: update the server.
		if( typeof(dta)!='object' || !dta.id ) dta = self.data;
//		console.debug('deduplicate',simpleClone(dta));
		let n:number,r:number,nR:Resource,rR:Resource;

		// 1. Deduplicate equal types having different ids;
		// the first of a equivalent pair in the list is considered the reference or original ... and stays,
		// whereas the second in a pair is removed.
		types.forEach( (ty)=>{
			// @ts-ignore - dta is defined in all cases and the addressing using a string is allowed
			if( Array.isArray(dta[ty.list]) )
				// skip last loop, as no duplicates can be found:
				// @ts-ignore - dta is defined in all cases and the addressing using a string is allowed
				for( n=dta[ty.list].length-1; n>0; n-- ) {
					for( r=0; r<n; r++ ) {
//						console.debug( '##', dta[ty.list][r],dta[ty.list][n],ty.isEqual(dta[ty.list][r],dta[ty.list][n]) );
						// Do it for all types:
						// @ts-ignore - this addressing is perfectly fine and the list names are defined.
						if( ty.isEqual(dta[ty.list][r],dta[ty.list][n]) ) {
							// Are equal, so substitute it's ids by the original item:
							// @ts-ignore - this addressing is perfectly fine and the list names are defined.
							ty.substitute(dta, dta[ty.list][r].id, dta[ty.list][n].id);
							// @ts-ignore - this addressing with a string is perfectly supported
							console.info(ty.ctg + " with id=" + dta[ty.list][n].id + " and title=" + dta[ty.list][n].title+" has been removed because it is a duplicate of id=" + dta[ty.list][r].id);
							// ... and remove the duplicate item:
							// @ts-ignore - this addressing is perfectly fine and the list names are defined.
							dta[ty.list].splice(n,1);
							// skip the remaining iterations of the inner loop:
							break;
						};
					};
				};
		});
//		console.debug( 'deduplicate 1', simpleClone(dta) );

		// 2. Remove duplicate resources:
		// skip last loop, as no duplicates can be found:
		for( n=dta.resources.length-1; n>0; n-- ) {
			for( r=0; r<n; r++ ) {
				// Do it for all model-elements and diagrams,
				// but exclude process gateways and generated events for optional branches:
				nR = dta.resources[n];
				rR = dta.resources[r];
//				console.debug( 'duplicate resource ?', rR, nR );
				if( CONFIG.modelElementClasses.concat(CONFIG.diagramClasses).indexOf( resClassTitleOf(rR,dta) )>-1
					&& equalR(dta,rR,nR)
					&& CONFIG.excludedFromDeduplication.indexOf(valByTitle( nR, CONFIG.propClassType, dta ))<0
					&& CONFIG.excludedFromDeduplication.indexOf(valByTitle( rR, CONFIG.propClassType, dta ))<0
				) {
					// Are equal, so remove the duplicate resource:
//					console.debug( 'duplicate resource', rR, nR, valByTitle( nR, CONFIG.propClassType, dta ) );
					substituteR(dta,rR,nR,{rescueProperties:true});
					console.info("Resource with id=" + nR.id + " and title=" + nR.title + " has been removed because it is a duplicate of id=" + rR.id);
					dta.resources.splice(n,1);
					// skip the remaining iterations of the inner loop:
					break;
				};
			};
		};
//		console.debug( 'deduplicate 2', simpleClone(dta) );

		// 3. Remove duplicate statements:
		// skip last loop, as no duplicates can be found:
		for( n=dta.statements.length-1; n>0; n-- ) {
			for( r=0; r<n; r++ ) {
				// Do it for all statements:
				if( equalS(dta.statements[r],dta.statements[n]) ) {
					// Are equal, so remove the duplicate statement:
					// @ts-ignore - the elements are defined
					console.info("Statement with id=" + dta.statements[n].id + " and class=" + dta.statements[n]['class'] + " has been removed because it is a duplicate of id=" + dta.statements[r].id);
					dta.statements.splice(n,1);
					// skip the remaining iterations of the inner loop:
					break;
				};
			};
		};
//		console.debug( 'deduplicate 3', simpleClone(dta) );
	//	return undefined
	};
	function duplicateId(dta:any,id:string):boolean {
		// check whether there is an item with the same id in dta.
		// If so, return the item:
		if( dta.id==id ) return true;
		for( var i in dta ) {
			if( Array.isArray( dta[i] ) ) {
				for( var j=dta[i].length-1;j>-1;j-- ) {
					if (duplicateId(dta[i][j], id) ) return true;
				};
			};
		};
		return false;
	}
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

		// --------------------------------
		// The processing per mode:
		function adopt(nD: SpecIF, opts:any):void {
			// First check whether BPMN collaboration and process have unique ids:
//			console.debug('adopt project',nD);
			// ToDo: The new collaboration id gets lost, so far!

			// 1. Integrate the types:
			//    a) if different id, save new one and use it.
			//    b) if same id and same content, just use it (no action)
			//    c) if same id and different content, save with new id and update all references
			let pend = 0;
//			console.debug('adopt #1',simpleClone(self.data),simpleClone(nD));
			types.forEach( (ty)=>{
				// @ts-ignore - dta is defined in all cases and the addressing using a string is allowed
				if( Array.isArray(nD[ty.list]) ) {
					let itmL:any[] = [];
					// @ts-ignore - dta is defined in all cases and the addressing using a string is allowed
					nD[ty.list].forEach( (nT)=>{
						// nT is a type/class in new data
						// types are compared by id:
						let idx = indexById( self.data[ty.list], nT.id );
						if( idx<0 ) {
							// a) there is no item with the same id
							itmL.push( nT );
						} else {
							// there is an item with the same id.
						//	if( !ty.isEqual( self.data[ty.list][idx], nT) ) {
							if (!ty.isCompatible(self.data[ty.list][idx], nT)) {
								// there is an item with the same id and different content.
								// c) create a new id and update all references:
								// Note: According to the SpecIF schema, dataTypes may have no additional XML-attribute
								// ToDo: In ReqIF an attribute named "Reqif.ForeignId" serves the same purpose as 'alterId':
								let alterId = nT.id;
								nT.id += '-' + simpleHash(new Date().toISOString());
								ty.substitute( nD, nT.id, alterId );
								itmL.push(nT);
								console.info("When importing a project"+(nD.id? " with id "+nD.id : "")+" using mode " + opts.mode +
											", a class with same id and incompatible content has been encountered: " + alterId +
											"; it has been saved with a new identifier "+nT.id+".");
							};
							// b) no action
						};
					});
					// @ts-ignore - nD[ty.list] is a valid address
					console.info((nD[ty.list].length - itmL.length)+" "+ty.list+" adopted and "+itmL.length+" added.");
					pend++;
					self.createContent( ty.ctg, itmL )
						.then( finalize, uDO.reject );
				};
			});
//			console.debug('#2',simpleClone(self.data),simpleClone(nD));

			// 2. Integrate the instances:
			//    a) if different title or type, save new one and use it.
			//    b) if same title and type, just use it and update all references
			if (Array.isArray(nD.resources)) {
				let itmL:Resource[] = [];
				nD.resources.forEach((nR: Resource) => {
					// nR is a resource in the new data

					// Adopt resource with the same id, title and class right away:
					let eR: Resource = itemById(self.data.resources, nR.id);  // resource in the existing data
					if (eR && equalR(self.data, eR, nR)) return;

					// Adopt resource, if it's class belongs to a collection of class-titles and is not excluded from deduplication.
					// The folders are excluded from consolidation, because it may happen that there are
					// multiple folders with the same name but different description in different locations of the hierarchy.
					if (CONFIG.modelElementClasses.concat(CONFIG.diagramClasses).indexOf(resClassTitleOf(nR, nD)) > -1
						&& CONFIG.excludedFromDeduplication.indexOf(valByTitle(nR, CONFIG.propClassType, nD)) < 0
					) {
						// Check for a resource with the same title:
						eR = itemByTitle(self.data.resources, nR.title);  // resource in the existing data
						// If there is an instance with the same title ... and if the types match;
						// the class title reflects the role of it's instances ...
						// and is less restrictive than the class ID:
						//						console.debug('~1',nR,eR?eR:'');
						if (eR
							&& CONFIG.excludedFromDeduplication.indexOf(valByTitle(eR, CONFIG.propClassType, self.data)) < 0
							&& resClassTitleOf(nR, nD) == resClassTitleOf(eR, self.data)
							//		&& valByTitle(nR,CONFIG.propClassType,nD)==valByTitle(eR,CONFIG.propClassType,self.data)
						) {
							//							console.debug('~2',eR,nR);
							// There is an item with the same title and type,
							// adopt it and update all references:
							substituteR(nD, eR, nR, { rescueProperties: true });
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
					if (duplicateId(self.data, nR.id)) {
						let newId = genID('R-');
						// first assign new ID to all references:
						substituteR(nD, { id: newId } as Resource, nR);
						// and then to the resource itself:
						nR.id = newId
					};
					//				console.debug('+ resource',nR);
					itmL.push(nR)
				});
				console.info((nD.resources.length - itmL.length) + " resources adopted and " + itmL.length+" added.");
				pend++;
				self.createContent('resource', itmL)
				.then(finalize, uDO.reject);
			};
//			console.debug('#3',simpleClone(self.data),simpleClone(nD));

			// 3. Create the remaining items;
			// self.createContent('statement', nD.statements) could be called, 
			// but then the new elements would replace the existing ones.
			// In case of 'adopt' the existing shall prevail!
			if (Array.isArray(nD.statements)) {
				let itmL: Statement[] = [];
				nD.statements.forEach((nS: Statement) => {
					// nR is a resource in the new data

					// Adopt statement with the same id, title and class right away:
					let eS: Statement = itemById(self.data.statements, nS.id);  // statement in the existing data
					if (eS && equalS(eS, nS)) return;
					// Else, create new element:
					itmL.push(nS);
				});
				console.info((nD.statements.length - itmL.length) + " statements adopted and " + itmL.length + " added.");
				pend++;
				self.createContent('statement', itmL)
				.then(finalize, uDO.reject);
			};
			pend++;
			self.createContent( 'hierarchy', nD.hierarchies )
			.then( finalize, uDO.reject );

			if (Array.isArray(nD.files)) {
				let itmL:any[] = [];
				nD.files.forEach((nF:any) => {
					// nR is a resource in the new data

					// Adopt equal file right away:
					let eF:any = itemById(self.data.files, nF.id);  // file in the existing data
					if (eF && equalF(eF, nF)) return;
					// Else, create new element:
					itmL.push(nF);
				});
				console.info((nD.files.length - itmL.length) + " files adopted and " + itmL.length+" added.");
				pend++;
				self.createContent('file', itmL)
				.then(finalize, uDO.reject);
			};
			return;

			function finalize():void {
				if(--pend<1) {
//					console.debug('#4',simpleClone(self.data),simpleClone(nD));
					// 4. Finally some house-keeping:
					hookStatements();
					self.deduplicate();	// deduplicate equal items
					// ToDo: Save changes from deduplication to the server.
//					console.debug('#5',simpleClone(self.data),opts);
					self.createFolderWithResourcesByType(self.data,opts)
					.then(
						()=>{
							self.createFolderWithGlossary(self.data,opts)
							.then( uDO.resolve, uDO.reject )
						},
						uDO.reject
					);
				};
			}
		}
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
			let tL = standardTypes.listNameOf(ctg),
				aL = self.data[tL],
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
				case 'dataType': rL = self.data.dataTypes; nL = newD.dataTypes; break;
				case 'resourceClass': rL = self.data.resourceClasses; nL = newD.resourceClasses; break;
				case 'statementClass': rL = self.data.statementClasses; nL = newD.statementClasses; break;
				default: return null //should never arrive here
			};
			nL.forEach( (nT)=>{
				rT = itemById(rL,nT.id);
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
				} else {
					// else: the type does not exist and will be created, therefore:
					pend++;
					console.info('Creating type',nT.title);
					self.createContent(nT.category,nT)
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
					if( nPCs[idx].id?itemById( r.propertyClasses, nPCs[idx].id ):itemByName( r.propertyClasses, nPCs[idx].title ) ) {
						// not missing, so try next:
						if( ++idx<nPCs.length ) addNewPC( r, nPCs, idx );
						return
					};

					// else: not found, so create:
					pend++;
					if( idx>0 )
						nPCs[idx].predecessor = nPCs[idx-1].id;

					// add the new property class also to r:
					let p = indexById( r.propertyClasses, nPCs[idx].predecessor );
					console.info('Creating property class', nPCs[idx].title);
					// insert at the position similarly to the new type;
					// if p==-1, then it will be inserted at the first position:
					r.propertyClasses.splice( p+1, 0, nPCs[idx] );
					server.project({id:self.data.id}).allClasses({id:r.id}).class(nPCs[idx]).create()
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
						self.updateContent(ctg,newD.files)
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
						nA = itemBy( n.properties, 'class', rA['class'] );
						// no update, if there is no corresponding property in the new data:
						if( !nA ) continue;
						// in all other cases compare the value:
						let oT = itemById( app.cache.selectedProject.data.resourceClasses, n['class'] ),  // applies to both r and n
							rDT = dataTypeOf( app.cache.selectedProject.data, rA['class'] ),
							nDT = dataTypeOf( newD, nA['class'] );
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
				self.readContent(ctg,nI,true)	// reload from the server to obtain most recent data
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
								nA = itemBy(nI.properties,'class',rA['class']);
								if( nA ) {
									nA.upd = rA.upd;
									nA.del = rA.del
								}
							});
							console.info('Updating instance',nI.title);
							// ToDo: Test whether only supplied properties are updated by the server; otherwise implement the behavior, here.
							self.updateContent( ctg, nI )
								.done( updateTreeIfChanged( ctg, rI, nI ) )	// update the tree, if necessary.
								.fail( uDO.reject )
						} else {
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
								var pT = itemById(app.cache.selectedProject.data.allClasses,nI['class']);
//								console.debug('403 instead of 404',nI,pT);
								if( !pT.rea || !pT.cre ) { uDO.reject(xhr); return };
								// else the server should have delivered 404, so go on ...
							case 404:
//								console.debug('not found',xhr.status);
								// no item with this id, so create a new one:
								self.createContent(ctg,nI)
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
							ch.id = genID('N-');
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
			//		self.deleteContent('hierarchy',aI.children);		// can be be prohibited by removing the permission, but it is easily forgotten to change the role ...
					newIds(nI);
					server.project(app.cache.selectedProject.data).specification(nI).createChildren()
						.done( ()=>{
							if( --pend<1 ) updateNext( ctg )
						})
						.fail( uDO.reject )
				} else {
					// no hierarchy (tree) has been changed, so no update:
					if( --pend<1 ) updateNext( ctg )
				}
			}
		} */
	};

	self.createContent = ( ctg:string, item:Item ):Promise<Item> =>{
		// item can be a js-object or a list of js-objects
		// ctg is a member of [dataType, resourceClass, statementClass, propertyClass, resource, statement, hierarchy]
		// ...  not all of them may be implemented, so far.
		// cache the value before sending it to the server, as the result is not received after sending (except for 'resource' and 'statement')
		return new Promise(
			(resolve) => {
		//	(resolve,reject)=>{
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
						self.data.cache( ctg, item )
			//	};
				resolve(item);
			}
		);
	};
	self.readContent = ( ctg:string, item:Item[]|Item|string, opts?:any ):Promise<Item[]>=>{
		// ctg is a member of [dataType, resourceClass, statementClass, resource, statement, hierarchy]

		if (!opts) opts = { reload: false, timelag: 10 };
		// override 'reload' as long as there is no server and we know that the resource is found in the cache:
		opts.reload = false;

		return new Promise((resolve, reject) => {
			if (!opts.reload) {
				// return the cached object asynchronously:
				// delay the answer a little, so that the caller can properly process a batch:
				setTimeout(() =>{
					resolve(self.data.readCache(ctg, item));
				}, opts.timelag);
			}
			else
				// try to get the items from the server, but meanwhile:
				reject({ status: 745, statusText: "No server available" })
		});
	};
	self.updateContent = ( ctg:string, item:Item[]|Item ):Promise<void> =>{
		// ctg is a member of [resource, statement, hierarchy], 'null' is returned in all other cases.
			function updateCh( itm:Item ):void {
				itm.changedAt = new Date().toISOString();
				itm.changedBy = app.me.userName;
			}

		return new Promise(
			(resolve) => {
				switch( ctg ) {
					case 'node':
						throw Error("Nodes can only be created or deleted");
				//	case 'resource':
				//	case 'statement':
				//	case 'hierarchy':
						// no break
					default:
//						console.debug('updateContent - cache', ctg );
						if( Array.isArray(item) )
							item.forEach( updateCh )
						else
							updateCh(item);
						self.data.cache( ctg, item )
				};
				resolve();
			}
		);
	};
	self.deleteContent = ( ctg:string, item:Item ):Promise<void> =>{
		// ctg is a member of [dataType, resourceClass, statementClass, propertyClass, resource, statement, hierarchy]
	/*		function isInUse( ctg, itm ) {
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
				// Do not try to delete types which are in use;
				switch( ctg ) {
				/*	case 'class':
					case 'dataType':
					case 'resourceClass':
					case 'statementClass':	if( Array.isArray(item) ) return null;	// not yet supported
											if( isInUse(ctg,item) ) {
												dDO.reject({status:972, statusText:i18n.Err400TypeIsInUse});
												return dDO
											};
											// no break;  */
					case "resource":
					case "statement":
					case "node":
//						console.debug('deleteContent',ctg,item);
						if( self.data.uncache( ctg, item )<0 ) reject({status:999,statusText:ctg+' '+item.id+' not found and thus not deleted.'});
						break;
					default:
						reject({status:999,statusText:'Category '+ctg+' is unknown; item '+item.id+' could not be deleted.'});
				};
				resolve();
			}
		);
	};

	self.createResource = ( rC:ResourceClass ):Promise<Resource> =>{
		// Create an empty form (resource instance) for the resource class rC:
		// Note: ES6 promises are used;
		// see https://codeburst.io/a-simple-guide-to-es6-promises-d71bacd2e13a
		// also https://javascript.info/promise-chaining
		return new Promise(
			(resolve, reject) => {
				// Get the class's permissions. So far, it's property permissions are not loaded ...
				var res:Resource;

				self.readContent( 'resourceClass', rC, {reload:true} )
				.then(
					(rCL:ResourceClass[])=>{
//						console.debug('#1',rC);
						// return an empty resource instance of the given type:
						res = {
							id: genID('R-'),
							class: rCL[0].id,
							title: '',
							permissions: rCL[0].permissions||{cre:true,rea:true,upd:true,del:true},
							properties: []
						};
						return self.readContent( 'propertyClass', rC.propertyClasses, {reload:true} )
					}
				)
				.then(
					(pCL:PropertyClass[])=>{
//						console.debug('#2',pCL);
						res.properties = forAll( pCL, createProp );
						resolve( res )
					}
				)
				.catch(	reject );
			}
		);
	};
	self.readStatementsOf = ( res:Resource, opts?:any ):Statement[] =>{
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
				self.readContent('statementClass', 'all')
				.then(
					(sCs: StatementClass[]) => {
						sCL = sCs;
						return self.readContent('statement', 'all');
					}
				)
				.then(
					(sL:Statement[]) => {
						// make a list of shows statements for all diagrams shown in the hierarchy:
						let showsL = sL.filter((s) => { return staClassTitleOf(s) == CONFIG.staClassShows && isReferencedByHierarchy(itemIdOf(s.subject))});
						// filter all statements involving res as subject or object:
						resolve(
							sL.filter(
								(s) => {
									let sC: StatementClass = itemById(sCL,s['class'] as string);
									return (res.id == itemIdOf(s.subject) || res.id == itemIdOf(s.object))
										// statement must be visible on a diagram referenced in a hierarchy
										// or be a shows statement itself.
										// ToDo: - Some Archimate relations are implicit (not shown on a diagram) and are unduly suppressed, here)
										&& (opts.dontCheckStatementVisibility
										// Accept manually created relations (including those imported via Excel):
											|| !sC.instantiation || sC.instantiation.indexOf(Instantiation.User)>-1
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
												&& isReferencedByHierarchy(itemIdOf(s.subject))
												&& isReferencedByHierarchy(itemIdOf(s.object))
											// In case of a comment, the comment itself is not referenced in the tree:
											|| opts.showComments
												&& titleOf(sC) == CONFIG.staClassCommentRefersTo
												&& isReferencedByHierarchy(itemIdOf(s.object))
										)
								}
							)
						);
					}
				)
				.catch( reject );
			}
		);
	};

	// Select format and options with a modal dialog, then export the data:
	self.exportFormatClicked = ():void =>{
		// Display options depending on selected format:
		// In case of ReqIF OOXML and ePub, let the user choose the language, if there are more than one:
		document.getElementById( "expOptions" ).innerHTML = self.exportOptions( radioValue( i18n.LblFormat ) );

//		console.debug('exportFormatClicked',radioValue( i18n.LblFormat ));
	};
	self.exportOptionsClicked = ():void =>{
		// Obtain selected options:
		// add 'zero with space' (&#x200b;) to make the label = div-id unique:
		self.data.title = textValue( '&#x200b;'+i18n.LblProjectName );
		fileName = textValue( '&#x200b;'+i18n.LblFileName );

//		console.debug('exportOptionsClicked',self.data.title,fileName);
	};
	self.exportOptions = (fmt)=>{
		const exportOptionsClicked = 'app.cache.selectedProject.exportOptionsClicked()';
		var pnl =  '<div class="panel panel-default panel-options" style="margin-bottom:0">'
			//	+		"<h4>"+i18n.LblOptions+"</h4>"
						// add 'zero with space' (&#x200b;) to make the label = div-id unique:
				+ 		textField( '&#x200b;'+i18n.LblProjectName, self.data.title, {typ:'line', handle:exportOptionsClicked} )
				+ 		textField( '&#x200b;'+i18n.LblFileName, self.data.title, {typ:'line', handle:exportOptionsClicked} );
		switch( fmt ) {
			case 'epub':
			case 'oxml':
				pnl +=	checkboxField(
						//	i18n.LblOptions,
							i18n.modelElements,
							[
								{ title: i18n.withOtherProperties, id: 'withOtherProperties', checked: false },
								{ title: i18n.withStatements, id: 'withStatements', checked: false }
							],
							{ handle: exportOptionsClicked }
						);
		};
		pnl +=		'</div>';
//		console.debug('exportOptions',fmt,pnl);
		return pnl;
	};
	self.chooseFormatAndExport = ()=>{
		if( self.exporting ) return;

		const exportFormatClicked = 'app.cache.selectedProject.exportFormatClicked()';
		// @ts-ignore - BootstrapDialog() is loaded at runtime
		new BootstrapDialog({
			title: i18n.LblExport+": '"+self.data.title+"'",
			type: 'type-primary',
		/*	// @ts-ignore - BootstrapDialog() is loaded at runtime
			size: BootstrapDialog.SIZE_WIDE,  */
			message: ()=>{
				var form = '<div class="row" style="margin: 0 -4px 0 -4px">'
					//	+	'<div class="col-sm-12 col-md-6" style="padding: 0 4px 0 4px">'
						+	'<div class="col-sm-12" style="padding: 0 4px 0 4px">'
						+     '<div class="panel panel-default panel-options" style="margin-bottom:4px">'
					//	+		"<h4>"+i18n.LblFormat+"</h4>"
						+		"<p>"+i18n.MsgExport+"</p>"
						+		radioField(
									i18n.LblFormat,
									[
										{ title: 'SpecIF v'+CONFIG.specifVersion, id: 'specif', checked: true },
										{ title: 'HTML with embedded SpecIF v'+CONFIG.specifVersion, id: 'html' },
										{ title: 'ReqIF v1.2', id: 'reqif' },
									//	{ title: 'RDF', id: 'rdf' },
										{ title: 'Turtle (experimental)', id: 'turtle' },
										{ title: 'ePub v2', id: 'epub' },
										{ title: 'MS WORD® (Open XML)', id: 'oxml' }
									],
									{handle:exportFormatClicked}  // options depend on format
								)
						+	  '</div>'
						+   '</div>'
					//	+	'<div id="expOptions" class="col-sm-12 col-md-6" style="padding: 0 4px 0 4px">'
						+	'<div id="expOptions" class="col-sm-12" style="padding: 0 4px 0 4px">'
						+     self.exportOptions( 'specif' )   // parameter must correspond to the checked option above
						+   '</div>'
						+  '</div>';
				return $( form )
			},
			buttons: [
				{ 	label: i18n.BtnCancel,
					action: (thisDlg)=>{
						thisDlg.close()
					}
				},
				{ 	label: i18n.BtnExport,
					cssClass: 'btn-success',
					action: (thisDlg)=>{
						// Get index of option:
						app.busy.set();
						message.show( i18n.MsgBrowserSaving, {severity:'success', duration:CONFIG.messageDisplayTimeShort} );
//						console.debug('options',checkboxValues( i18n.LblOptions ));
						let options = {
							format: radioValue( i18n.LblFormat ),
							fileName: fileName
						};
						// further options according to the checkboxes:
						checkboxValues( i18n.modelElements ).forEach(
							(op)=>{
								options[op] = true
							}
						);
						self.exportAs( options )
						.then(
						//	app.busy.reset,     --> doesn't work for some reason, 'this' within reset() is undefined ...
							function() {app.busy.reset()},
							handleError
						);
						thisDlg.close()
					}
				}
			]
		})
		.open();

		// ---
		function handleError(xhr: xhrMessage): void {
			self.exporting = false;
			app.busy.reset();
			message.show( xhr );
		}
	};
	self.exportAs = (opts?: any): Promise<void> => {
		if (!opts) opts = {};
		if (!opts.format) opts.format = 'specif';
		// in certain cases, try to export files with the same name in PNG format, as well.
		// - ole: often, preview images are supplied in PNG format;
		// - svg: for generation of DOC or ePub, equivalent images in PNG-format are needed.
		//	if( typeof(opts.preferPng)!='boolean' ) opts.preferPng = true;   ... is the default
		//	if( !opts.alternatePngFor ) opts.alternatePngFor = ['svg','ole'];	... not yet supported

		return new Promise((resolve, reject) => {

			if (self.exporting) {
				// prohibit multiple entry
				reject({ status: 999, statusText: "Export in process, please wait a little while" });
			}
			else {
				if (self.data.exp) { // check permission
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
				}
				else {
					reject({ status: 999, statusText: "No permission to export" });
				};
			};
			return;

			function transform2image(dta, fn: Function): void {
				let pend = 0,
					re = /<object ([^>]+?)(\/>|>)/,
					reT = /type="[^"]+"/,
					replaced = false;
				if (Array.isArray(dta.files))
					// Transform any special file format to an image:
					dta.files.forEach((f, i, L) => {
						let nFileName = f.title.fileName() + '.svg',
							reD = new RegExp('data="' + f.title + '"');
						switch (f.type) {
							case 'application/bpmn+xml':
								pend++;

								// Replace the file reference names and types:
								dta.resources.forEach((res) => {
									if (Array.isArray(res.properties))
										res.properties.forEach((prp) => {
											prp.value = prp.value.replace(re, ($0, $1, $2) => {
//												console.debug('#a', $0, $1, $2);
												replaced = false;
												if ($1) $1 = $1.replace(reD, ($4) => {
//													console.debug('#b', $4, nFileName);
													replaced = true;
													return 'data="' + nFileName + '"'
												});
												if (replaced) $1 = $1.replace(reT, () => {
													return 'type="image/svg+xml"'
												});
												return '<object ' + $1 + $2;
											});
//											console.debug('#c', prp);
										});
								});

								// Read and render BPMN as SVG:
								blob2text(f, (b: string) => {
									bpmn2svg(b)
									.then(
										(result) => {
											// replace BPMN by SVG:
											L.splice(i, 1, {
											//	blob: new Blob([result.svg], { type: "image/svg+xml; charset=utf-8" }),
												blob: new Blob([result.svg], { type: "image/svg+xml" }),
												id: 'F-' + simpleHash(f.title),
												title: nFileName,
												type: 'image/svg+xml',
												changedAt: f.changedAt
											});
//											console.debug('SVG',result.svg,L);
											if (--pend < 1)
												// Finally publish in the desired format:
												fn();
										},
										(err) => {
											console.error('BPMN-Viewer could not deliver SVG', err);
											reject();
										}
									);
								}, 0);
						};
					});
				// In case there is nothing to transform, we start right away:
				if (pend < 1)
					// publish in the desired format:
					fn();
			}
			function publish(opts: any): void {
				if (!opts || ['epub', 'oxml'].indexOf(opts.format) < 0) {
					// programming error!
					reject();
					return;
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
				if (typeof (opts.targetLanguage) != 'string') opts.targetLanguage = browser.language;
				opts.makeHTML = true;
				opts.linkifyURLs = true;
				opts.createHierarchyRootIfNotPresent = true;
				// take newest revision:
				opts.revisionDate = new Date().toISOString();

				let data = self.data.toExt(opts),
					localOpts = {
						// Values of declared stereotypeProperties get enclosed by double-angle quotation mark '&#x00ab;' and '&#x00bb;'
						titleProperties: CONFIG.titleProperties.concat(CONFIG.headingProperties),
						descriptionProperties: CONFIG.descProperties,
						stereotypeProperties: CONFIG.stereotypeProperties,
						lookup: i18n.lookup,
						showEmptyProperties: CONFIG.showEmptyProperties,
						imgExtensions: CONFIG.imgExtensions,
						applExtensions: CONFIG.applExtensions,
						//	hasContent: hasContent,
						propertiesLabel: opts.withOtherProperties ? 'SpecIF:Properties' : undefined,
						statementsLabel: opts.withStatements ? 'SpecIF:Statements' : undefined,
						fileName: opts.fileName,
						colorAccent1: '0071B9',	// adesso blue
						done: () => { app.cache.selectedProject.exporting = false; resolve() },
						fail: (xhr) => { app.cache.selectedProject.exporting = false; reject(xhr) }
					};

				transform2image( data,
					() => {
						switch (opts.format) {
							case 'epub':
								// @ts-ignore - toEpub() is loaded at runtime
								toEpub(data, localOpts);
								break;
							case 'oxml':
								// @ts-ignore - toOxml() is loaded at runtime
								toOxml(data, localOpts);
						};
						// resolve() is called in the call-backs defined by opts
					}
				);
			}
			function storeAs(opts: any): void {
				if (!opts || ['specif', 'html', 'reqif', 'turtle'].indexOf(opts.format) < 0)
					// programming error!
					throw Error("Invalid format specified on export");

				// ToDo: Get the newest data from the server.
//				console.debug( "storeAs", opts );

				opts.allResources = false;  // only resources referenced by a hierarchy.
				// keep vocabulary terms:
				opts.lookupTitles = false;
				opts.lookupValues = false;

				switch (opts.format) {
					case 'specif':
						opts.allResources = true;  // even, if not referenced by a hierarchy.
					// no break
					case 'html':
						// export all languages:
						opts.targetLanguage = undefined;
						// keep all revisions:
						opts.revisionDate = undefined;
						break;
					//	case 'rdf':
					case 'turtle':
					case 'reqif':
						// only single language is supported:
						if (typeof (opts.targetLanguage) != 'string') opts.targetLanguage = browser.language;
						// XHTML is supported:
						opts.makeHTML = true;
						opts.linkifyURLs = true;
						opts.createHierarchyRootIfNotPresent = true;
						// take newest revision:
						opts.revisionDate = new Date().toISOString();
						break;
					default:
						reject();
						return; // should never arrive here
				};
				//				console.debug( "storeAs", opts );
				let data = self.data.toExt(opts),
					fName = opts.fileName || data.title;

				// A) Processing for 'html':
				if (opts.format == 'html') {
					// find the fully qualified path of the content delivery server to fetch the viewer modules:
					opts.cdn = window.location.href.substr(0, window.location.href.lastIndexOf("/") + 1);

					transform2image( data,
						() => {
							toHtmlDoc(data, opts)
							.then(
								function (dta): void {
									let blob = new Blob([dta], { type: "text/html; charset=utf-8" });
									//	let blob = new Blob([dta], {type: "application/xhtml+xml; charset=utf-8"});
									// @ts-ignore - saveAs() is loaded at runtime
									saveAs(blob, fName + '.specif.html');
									self.exporting = false;
									resolve();
								}
							)
							.catch(
								function (xhr): void {
									self.exporting = false;
									reject(xhr);
								}
							);
						}
					);
					return;
				};

				// B) Processing for all formats except 'html':
				// @ts-ignore - JSZip() is loaded at runtime
				let zip = new JSZip(),
					zName: string,
					mimetype = "application/zip";

				// Add the files to the ZIP container:
				if (data.files)
					data.files.forEach((f) => {
						//						console.debug('zip a file',f);
						zip.file(f.title, f.blob);
						delete f.blob; // the SpecIF data below shall not contain it ...
					});

				// Prepare the output data:
				switch (opts.format) {
					case 'specif':
						fName += ".specif";
						zName = fName + '.zip';
						data = JSON.stringify(data);
						break;
					case 'reqif':
						fName += ".reqif";
						zName = fName + 'z';
						mimetype = "application/reqif+zip";
						data = app.ioReqif.toReqif(data);
						break;
					case 'turtle':
						fName += ".ttl";
						zName = fName + '.zip';
						// @ts-ignore - transformSpecifToTTL() is loaded at runtime
						data = transformSpecifToTTL("https://specif.de/examples", data);
					/*		break;
						case 'rdf':
							if( !app.ioRdf ) {
								reject({status:999,statusText:"ioRdf not loaded."});
								return;
							};
							fName += ".rdf";
							data = app.ioRdf.toRdf( data ); */
				};
				let blob = new Blob([data], { type: "text/plain; charset=utf-8" });
				// Add the project:
				zip.file(fName, blob);
				blob = undefined; // free heap space

				// done, store the specif.zip:
				zip.generateAsync({
					type: "blob",
					compression: "DEFLATE",
					compressionOptions: { level: 7 },
					mimeType: mimetype
				})
					.then(
						(blob: Blob) => {
							// successfully generated:
							//							console.debug("storing ZIP of '"+fName+"'.");
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
			}
		});
	};
	self.abort = ():void =>{
		console.info('abort specif');
	//	server.abort();
		self.abortFlag = true;
	};
	self.init();
	return self;
//////////
// some local helper routines:

/*	function queryObjects( qu, reload ) {
		// get all resources of the specified type: qu is {type: class}
	//	if( !reload ) {
			// collect all resources with the queried type:
			var oL = forAll( self.data.resources, (o)=>{ return o['class']==qu.type?o:null } ),
				dO = $.Deferred();
			dO.resolve( oL );
			return dO
	//	};
	}
	function loadFiles() {
		// in case of ReqIF Server, only a list of file meta data is delivered,
		// whereas in case of PouchDB, the files themselves are delivered.
		return self.readContent( 'file', 'all', {reload:true} )
	}
	function loadObjsOf( sp ) {
		// Cache all resources referenced in the given spec (hierarchy):
		if( !sp ) { sp = self.data.selectedHierarchy };
//		console.debug( 'loadObjsOf', sp );

		var cDO = $.Deferred();

			// is called recursively until the whole list has been processed:
			function loadObjs( oL ) {
				if( !loading && !self.exporting ) { return };  // in case the loading has been stopped (by stopAutoLoad) ...
				// convert list of hierarchy entries to list of resources:
				var rL=[];
				for( var o=oL.length-1;o>-1;o-- ) rL[o] = {id: oL[o]};

				return server.readContent( 'resource', rL )
					.done( (rsp)=>{
						// continue caching, if the project hasn't been left, meanwhile:
						if( sp ) {  // sp is null, if the project has been left.
							cacheL( self.data.resources, rsp );

							if( cI<sp.flatL.length ) {
								rL = sp.flatL.slice(cI,cI+CONFIG.objToGetCount),  // object list; slice just extracts and does not change original list
								cI += rL.length;  // current index
								loadObjs( rL );
								return
							} else {
								cDO.resolve( self.data.resources );
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
		} else {
			cDO.resolve([])
		};
		return cDO
	}
	function loadRelsOf( sp ) {
		// Check all referenced resources and get their statements.  Cache the results.
		// Not efficient, but effective and without alternative in light of the server API.
		if( !sp ) { sp = self.data.selectedHierarchy };
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
						} else {
							rDO.resolve( self.data.statements )
						}
					})
					.fail( rDO.reject )
			}
		if( sp && sp.flatL.length && self.data.statementClasses.length>0 ) {
			var cI=0;  // current index
			loadRels( {id:sp.flatL[cI]} )
		} else {
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
			pend = self.data.hierarchies.length;
		for( var i=self.data.hierarchies.length-1; i>-1; i-- ) {
			fn( self.data.hierarchies[i] )
				.done(()=>{
					if(--pend<1) dO.resolve()
				})
				.fail( dO.reject )
		};
		if( self.data.hierarchies.length<1 ) dO.resolve();
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
			self.readContent( 'dataType', [], true )	// true: reload
				.done( ()=>{
					if( autoLoadId && aU==autoLoadId ) {  // if the update hasn't been stopped, meanwhile
						// 2) load allClasses:
						self.readContent( 'anyClass', [], true )
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
		// for use with createContent and updateContent functions.
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
*/

}  // end of function Project()

//////////////////////////
// global helper functions:
function itemIdOf( key:KeyObject|string ):string {
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
	return iterateNodes( H, (nd)=>{ return nd.resource!=rId } )
}
function collectResourcesByHierarchy(prj: SpecIF, H?: SpecifNode[] ):Resource[] {
	// collect all resources referenced by the given hierarchy:
	if( !prj ) prj = app.cache.selectedProject.data;
	if( !H ) H = prj.hierarchies;
	var rL:Resource[] = [];
	iterateNodes( H, (nd)=>{ cacheE( rL, itemById(prj.resources,itemIdOf(nd.resource)) ); return true } );
	return rL;
}
function dataTypeOf(prj: SpecIF, pCid:string ):DataType {
	// given a propertyClass id, return it's dataType:
	if( typeof(pCid)=='string' && pCid.length>0 )
		return itemById( prj.dataTypes, itemById( prj.propertyClasses, pCid ).dataType )
		//     |                        get class
		//	   get dataType
	// else:
	// may happen, if a resource does not have any properties and it's title or description is being used:
	return { type: TypeEnum.XsString}; // by default
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
		if( eV ) ct += (i==0?'':', ')+eV
		else ct += (i==0?'':', ')+v
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
		}
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
	// if targetLanguage is not defined, keep all language options:
	if( typeof(val)=='string' || !(opts&&opts.targetLanguage) ) return val;
	// The value may be undefined:
	if( val==undefined ) return;
	if( !Array.isArray(val) ) {
		// neither a string nor an array is a programming error:
		throw Error('Invalid value: ',val);
	};

	let lVs = val.filter( (v):boolean =>{
		return opts.targetLanguage == v.language
	});
	// lVs should have none or one elements; any additional ones are simply ignored:
	if( lVs.length>0 ) return lVs[0].text;

	// next try a little less stringently:
	lVs = val.filter( (v):boolean =>{
		return opts.targetLanguage.slice(0,2) == v.language.slice(0,2);
	});
	// lVs should have none or one elements; any additional ones are simply ignored:
	if( lVs.length>0 ) return lVs[0].text;

	// As a final resourt take the first element in the original list of values:
	return val[0].text;
}
function hasContent( pV:string ):boolean {
	// must be a string with the value of the selected language.
	if( typeof(pV)!="string" ) return false;
	return stripHTML(pV).length>0
		|| RE.tagSingleObject.test(pV) // covers nested object tags, as well
		|| RE.tagImg.test(pV)
		|| RE.tagA.test(pV)
}
function iterateNodes(tree: SpecifNode[]|SpecifNode, eFn:Function, lFn?:Function): boolean {
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
			cont = !iterateNodes( tree[i], eFn, lFn );
		};
		if( typeof(lFn)=='function' ) lFn( tree );
	}
	else {
		cont = eFn( tree );
		if( cont && tree.nodes ) {
			cont = !iterateNodes( tree.nodes, eFn, lFn );
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
function valByTitle(itm:Resource,pN:string,prj:SpecIF):string|undefined {
	// Return the value of a resource's (or statement's) property with title pN:
	// ToDo: return the class's default value, if available.
//	console.debug('valByTitle',prj,itm,pN);
	if( itm.properties ) {
		for( var i=itm.properties.length-1;i>-1;i-- ) {
			if( (itm.properties[i].title || itemById( prj.propertyClasses, itm.properties[i]['class'] ).title)==pN )
				return itm.properties[i].value
		}
	};
//	return undefined
}
function titleIdx(pL: Property[], prj?: SpecIF): number {
	// Find the index of the property to be used as title.
	// The result depends on the current user - only the properties with read permission are taken into consideration.
	// This works for title strings and multi-language title objects.

	// The first property which is found in the list of headings or titles is chosen:
	if( pL ) {
		if( !prj ) prj = app.cache.selectedProject.data;
		let pt;
		for( var a=0,A=pL.length;a<A;a++ ) {
			pt = vocabulary.property.specif( propTitleOf(pL[a],prj) );
			// Check the configured headings and titles:
			if( CONFIG.titleProperties.indexOf( pt )>-1 ) return a;
		};
	};
	return -1;
}
function elementTitleOf(el: Resource | Statement, opts?:any, prj?:SpecIF): string {
	// Get the title of a resource or a statement;
	// ... from the properties or a replacement value in case of default.
	// 'el' is an original element without 'classifyProps()'.
	if( typeof(el)!='object' ) return;
	if( !prj ) prj = app.cache.selectedProject.data;
	
	// Lookup titles only in case of a resource serving as heading or in case of a statement:
	let localOpts;
	if( el.subject ) {
		// it is a statement
		localOpts = opts;
	}
	else {
		// it is a resource
		localOpts = {
			targetLanguage: opts.targetLanguage,
			lookupTitles: opts.lookupTitles && itemById( prj.resourceClasses, el['class'] ).isHeading
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
			ti = staClassTitleOf( el, prj, opts );
	} else {
		// it is a resource
		if( opts && opts.addIcon && CONFIG.addIconToInstance && prj && ti )
			ti = addIcon( ti, itemById( prj.resourceClasses, el['class'] ).icon );
	};

// 	console.debug('elementTitleOf',el,opts,ti);
	return typeof (ti) == 'string' ? stripHTML(ti) : ti;

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
