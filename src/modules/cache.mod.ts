///////////////////////////////
/*!	Cache Library for SpecIF data.
	Dependencies: jQuery
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	Author: se@enso-managers.de, Berlin
	We appreciate any correction, comment or contribution!
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

modules.construct({
	name: 'cache'
}, (self)=>{
	"use strict";
	// Construct a representative of the selected project with cached data:
	// ToDo: enforce CONFIG.maxObjToCacheCount

/*	var autoLoadId,				// max 1 autoLoad chain
		autoLoadCb;				// callback function when the cache has been updated  */
	self.cacheInstances = true;

	// initialization is at the end of this constructor.
	self.init = ()=>{
		// initialize/clear all variables:
		self.projects = [];
		self.selectedProject = undefined;
	/*	autoLoadId = undefined;  // stop any autoLoad chain
		autoLoadCb = undefined;  */

		return true
	};
	self.create = (p)=>{
		// in this implementation, delete existing projects to save memory space:
//		console.debug( 'cache.create', self );
		self.projects.length = 0;
		// append a project to the list:
		self.projects.push( new Project() );
		self.selectedProject = self.projects[self.projects.length-1];
		return self.selectedProject.create( p )
	};
/*	// Periodically update the selected project with the current server state in a multi-user context:
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
	return self
});

function Project( pr ) {
	"use strict";
	// Constructor for a project containing SpecIF data.
	var self = this,
		loading = false,		// true: data is being gathered from the server.
		fileName = undefined;
	self.init = ()=>{
		// initialize/clear all variables:
		self.data = {
			id: '',
			title: '',
			description: '',
			generator: '',
			generatorVersion: '',
			myRole: undefined,
			cre: undefined,
			upd: undefined,
			del: undefined,
			exp: undefined,
			locked: undefined,		// the server has locked the project ( readOnly )
			createdAt: undefined,
			createdBy: undefined,

			dataTypes: [],
			propertyClasses: [],
			resourceClasses: [],
			statementClasses: [],
			resources: [],   		// list of resources as referenced by the hierarchies
			statements: [],
			hierarchies: [],    	// listed specifications (aka hierarchies, outlines) of the project.
			files: []
		};
		loading = false;
		self.exporting = false;		// prevent concurrent exports
		self.abortFlag = false
	};
	self.loaded = ()=>{
		return typeof(self.data.id)=='string' && self.data.id.length>0
	};

	self.create = ( newD, mode )=>{
		// create a project, if there is no project with the given id, or replace a project with the same id.
		// (The roles/permissions and the role assignment to users are preserved, when import via ReqIF-file is made)
		// If there is no newD.id, it will be generated by the server.
		mode = mode || 'deduplicate';
		// Use jQuery instead of ECMA Promises for the time being, because of progress notification.
		var sDO = $.Deferred();

		// Create the specified project:
		newD = specif.toInt(newD);	// transform to internal data structure
		if( !newD ) {
			sDO.reject({ status: 995, statusText: i18n.MsgImportFailed }); // ToDo: this message may specify a file or similar.
			return sDO
		};
//		console.debug('app.cache.selectedProject.data.create',newD);

		self.data.id = newD.id;
		self.data.title = newD.title;
		self.data.description = newD.description;
		self.data.generator = newD.generator;
		self.data.generatorVersion = newD.generatorVersion;
		self.data.myRole = i18n.LblRoleProjectAdmin;
	//	self.data.cre = self.data.upd = self.data.del = self.data.exp = app.label!=i18n.LblReader;
		self.data.cre = self.data.upd = self.data.del = app.label!=i18n.LblReader;
		self.data.exp = true;
		self.data.locked = app.label==i18n.LblReader;
		self.data.createdAt = newD.createdAt;
		self.data.createdBy = newD.createdBy;
		self.abortFlag = false;

		// Create the project
		// The project meta-data and each item are created as a separate document in a document database;
		// at the same time the cache is updated.
		sDO.notify(i18n.MsgLoadingTypes,30);
		let pend = 8;
		self.createContent( 'dataType', newD.dataTypes )
			.then( finalize, sDO.reject );
		self.createContent( 'propertyClass', newD.propertyClasses )
			.then( finalize, sDO.reject );
		self.createContent( 'resourceClass', newD.resourceClasses )
			.then( finalize, sDO.reject );
		self.createContent( 'statementClass', newD.statementClasses )
			.then( finalize, sDO.reject );
		self.createContent( 'file', newD.files )
			.then( finalize, sDO.reject );
		self.createContent( 'resource', newD.resources )
			.then( finalize, sDO.reject );
		self.createContent( 'statement', newD.statements )
			.then( finalize, sDO.reject );
		self.createContent( 'hierarchy', newD.hierarchies )
			.then( finalize, sDO.reject );
		return sDO

		function finalize() {
			if(--pend<1) {
				sDO.notify(i18n.MsgLoadingFiles,100);
				hookStatements();

				if( mode == 'deduplicate' )
					self.deduplicate();	// deduplicate equal items
					// ToDo: Update the server !

				sDO.resolve({status:0})
			}
		}
	};
/*	self.read = ( prj, opts )=>{
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
		if( self.data.loaded && !opts.reload && ( !prj || prj.id==self.data.id ) ) {
			// return the loaded project:
			pDO.resolve( self );
			return pDO
		};
		// else
		return null
	};
	self.updateMeta = ( prj )=>{
		if( !prj ) return;
		for( var p in prj ) self[p] = prj[p];			// update only the provided properties
		// Update the meta-data (header):
	//	return server.project(self).update()
	};*/
	const types = [
			{ name: 'dataType', 		list: 'dataTypes', 			eqFn: eqDT, 	sbFn: substituteDT },
			{ name: 'propertyClass', 	list: 'propertyClasses', 	eqFn: eqPC, 	sbFn: substitutePC },
			{ name: 'resourceClass', 	list: 'resourceClasses', 	eqFn: eqRC, 	sbFn: substituteRC },
			{ name: 'statementClass', 	list: 'statementClasses', 	eqFn: eqSC, 	sbFn: substituteSC }
		];
	function eqDT(r,n) {
		// return true, if reference and new dataType are equal:
		if( r.type!=n.type ) return false;
		switch( r.type ) {
			case 'xs:double':
				if( r.fractionDigits!=n.fractionDigits ) return false;
				// no break
			case 'xs:integer':
				return r.minInclusive==n.minInclusive && r.maxInclusive==n.maxInclusive
			case 'xs:string':
			case 'xhtml':
				return r.maxLength==n.maxLength;
			case 'xs:enumeration':
				if( r.values.length!=n.values.length ) return false
				for( var i=n.values.length-1; i>-1; i-- )
					// assuming that the titles/values don't matter:
					if( indexById(r.values, n.values[i].id<0 ) ) return false;
				// the list of enumerated values *is* equal:
				// no break
			default:
				return true
		}
	}
	function eqPC(r,n) {
		// return true, if reference and new propertyClass are equal:
		return r.dataType==n.dataType && r.title==n.title
	}
	function eqRC(r,n) {
		// return true, if reference and new resourceClass are equal:
		if( !r.isHeading&&n.isHeading || r.isHeading&&!n.isHeading ) return false;
		return r.title==n.title
			&& eqL( r.propertyClasses, n.propertyClasses )
			&& eqL( r.instantiation, n.instantiation )
	}
	function eqSC(r,n) {
		// return true, if reference and new statementClass are equal:
		return r.title==n.title
			&& eqSCL( r.propertyClasses, n.propertyClasses )
			&& eqSCL( r.subjectClasses, n.subjectClasses )
			&& eqSCL( r.objectClasses, n.objectClasses )
			&& eqSCL( r.instantiation, n.instantiation );

		function eqSCL(rL,nL) {
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
			return true
		}
	}

	function eqKey(r,n) {
		// Return true if both keys are equivalent;
		// this applies if only an id is given or a key with id and revision:
		return itemIdOf(r)==itemIdOf(n)
			&& r.revision==n.revision
	}
	function eqR(dta,r,n) {
//		console.debug('eqR',r,n,resClassTitleOf(r,dta),resClassTitleOf(n,dta));
		// return true, if reference and new resource are equal:
		// ToDo: Consider, if model-elements are only considered equal, if they have the same type,
		// i.e. if a property with title CONFIG.propClassType has the same value
		return r.title==n.title
				&& resClassTitleOf(r,dta)==resClassTitleOf(n,dta)
		// Note that the content of the new resource is lost;
		// this is no problem, if the new data is a BPMN model, for example,
		// which usually have a title and do not carry any description.
	}
	function eqS(r,n) {
		// return true, if reference and new statement are equal:
		// ToDo: Model-elements are only equal, if they have the same type,
		// i.e. a property with title CONFIG.propClassType has the same value
		return r['class']==n['class']
			&& eqKey(r.subject,n.subject)
			&& eqKey(r.object,n.object)
	}
	function eqL(rL,nL) {
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
		return true
	}
	function substituteDT(prj,rId,nId) {
		// For all propertyClasses, substitute new by the original dataType:
		substituteProp(prj.propertyClasses,'dataType',rId,nId)
	}
	function substitutePC(prj,rId,nId) {
		// For all resourceClasses, substitute new by the original propertyClass:
		substituteLe(prj.resourceClasses,'propertyClasses',rId,nId);
		// Also substitute the resource properties' class:
		prj.resources.forEach( (res)=>{
			substituteProp(res.properties,'class',rId,nId)
		});
		// The same with the statementClasses:
		substituteLe(prj.statementClasses,'propertyClasses',rId,nId);
		prj.statements.forEach( (sta)=>{
			substituteProp(sta.properties,'class',rId,nId)
		})
	}
	function substituteRC(prj,rId,nId) {
		// Substitute new by original resourceClasses:
		substituteLe(prj.statementClasses,'subjectClasses',rId,nId);
		substituteLe(prj.statementClasses,'objectClasses',rId,nId);
		substituteProp(prj.resources,'class',rId,nId)
	}
	function substituteSC(prj,rId,nId) {
		// Substitute new by original statementClasses:
		substituteProp(prj.statements,'class',rId,nId)
	}
	function substituteR(prj,r,n,opts) {
		// Substitute resource n by r in all references of n,
		// where r is always an element of self.data.
		// But: Rescue any property of n, if undefined for r.
//		console.debug('substituteR',r,n,prj.statements);

		if( opts && opts.rescueProperties ) {
			// Rescue any property value of n,
			// if the corresponding property of the adopted resource r is undefined or empty;
			// looking at the property types, which ones are in common:
			n.properties.forEach( (nP)=>{
				if( hasContent(nP.value) ) {
					// check whether existing resource has similar property;
					// a property is similar, if it has the same title,
					// where the title may be defined with the property class.
					let pT = propTitleOf(nP,prj),
						rP = propByTitle(self.data,r,pT);
//					console.debug('substituteR 3a',nP,pT,rP,hasContent(valByTitle( self.data, r, pT )));
					if( !hasContent(valByTitle( self.data, r, pT ))
						// dataTypes must be compatible:
						&& classIsCompatible( 'dataType', dataTypeOf(self.data,rP['class']), dataTypeOf(prj,nP['class']) ) ) {
							rP.value = nP.value
					}
				}
			})
		};
		// In the rare case that the ids are identical, there is no need to update the references:
		if( r.id==n.id ) return;

		// memorize the replaced id, if not yet listed:
		if( !Array.isArray(r.alternativeIds) ) r.alternativeIds = [];
		cacheE( r.alternativeIds, n.id );

		// 2 Replace the references in all statements:
		prj.statements.forEach( (st)=>{
			if( eqKey(st.object,n) ) { if( st.object.id ) {st.object.id=itemIdOf(r)} else {st.object=itemIdOf(r)} };
			if( eqKey(st.subject,n) ) { if( st.subject.id ) {st.subject.id=itemIdOf(r)} else {st.subject=itemIdOf(r)} }
			// ToDo: Is the substitution is too simple, if a key is used?
		});
		// 3 Replace the references in all hierarchies:
		substituteRef(prj.hierarchies,r.id,n.id)
	}
	function substituteProp(L,propN,rAV,dAV) {
		// replace ids of the duplicate item by the id of the original one;
		// this applies to the property 'propN' of each member of the list L:
		if( Array.isArray(L) )
			L.forEach( (e)=>{ if(e[propN]==dAV) e[propN] = rAV } )
	}
	function substituteLe(L,propN,rAV,dAV) {
		// Replace the duplicate id by the id of the original item;
		// so replace dAV by rAV in the list named 'propN'
		// (for example: in L[i].propN (which is a list as well), replace dAV by rAV):
		let idx;
		if( Array.isArray(L) )
			L.forEach( (e)=>{
				if( !Array.isArray(e[propN]) ) return;
				idx = e[propN].indexOf(dAV);
				if( idx>-1 ) e[propN].splice( idx, 1, rAV )
			})
	}
	function substituteRef(L,rId,dId) {
		// For all hierarchies, replace any reference to dId by rId;
		// eliminate double entries in the same folder (together with the children):
		iterateNodes( L,
				// replace resource id:
				(nd)=>{ if(nd.resource==dId) {nd.resource=rId}; return true },
				// eliminate duplicates within a folder (assuming that it will not make sense to show the same resource twice in a folder;
				// for example it is avoided that the same diagram is shown twice if it has been imported twice:
				(ndL)=>{ for(var i=ndL.length-1; i>0; i--) { if( indexBy(ndL.slice(0,i),'resource',ndL[i].resource)>-1 ) { ndL.splice(i,1) }}}
		)
		// ToDo: Make it work, if keys are used as a reference.
	}
	function hookStatements( dta ) {
		if( typeof(dta)!='object' || !dta.id ) dta = self.data;
//		console.debug('hookStatements',dta);
		// For all statements with a loose end, hook the resource
		// specified by title or by a property titled dcterms:identifier:
		dta.statements.forEach( (st)=>{
			// Check every statement;
			// it is assumed that only one end is loose:
			if( st.subjectToFind ) {
				// Find the resource with a value of property titled CONFIG.propClassId:
				let s, sL = itemsByVisibleId( dta.resources, st.subjectToFind );
				if( sL.length>0 )
					s = sL[0]
				else
					// Find the resource with the given title:
					s = itemByTitle( dta.resources, st.subjectToFind );
//				console.debug('hookStatements subject',s);
				if( s ) {
					st.subject = s.id;
					delete st.subjectToFind;
					return
				}
			};
			if( st.objectToFind ) {
				// Find the resource with a value of property titled CONFIG.propClassId:
				let o, oL = itemsByVisibleId( dta.resources, st.objectToFind );
				if( oL.length>0 )
					o = oL[0]
				else
					// Find the resource with the given title:
					o = itemByTitle( dta.resources, st.objectToFind );
//				console.debug('hookStatements object',o);
				if( o ) {
					st.object = o.id;
					delete st.objectToFind;
					return
				}
			}
		});
		return dta

		function itemsByVisibleId(L,vId) {
			return forAll( L, (r)=>{
				if( visibleIdOf(r)==vId ) return r
			})
		}
	}
	self.collectResourcesByClass = ( dta, opts )=>{
		// Collect all business processes, requirements etc according to 'resourcesToCollect':
		return new Promise(
			(resolve,reject)=>{
				if( typeof(opts)!='object' ) { resolve({status:0}); return };
				if( typeof(dta)!='object' || !dta.id ) dta = self.data;
				let	apx = dta.id.simpleHash(),
					tim = new Date().toISOString();

				const resourcesToCollect = [
					{id: "SpecIF:BusinessProcess", flag:"collectProcesses", folder:CONFIG.resClassProcesses, folderName:"FolderProcesses-"}
				];
				resourcesToCollect.forEach(
					( r2c )=>{
//						console.debug('rc2c',r2c,opts);
						if( !opts[r2c.flag] ) { resolve({status:0}); return };
						// Assumes that the folder objects for the respective folder are available

						// 1 Find all resp. folders (e.g. process folder):
						let delL = [], prL = [], res, pV;
//						console.debug('collectResourcesByClass',dta.hierarchies,opts);
						iterateNodes( dta.hierarchies,
										(nd)=>{
											// get the referenced resource:
											res = itemById( dta.resources, nd.resource );
											// find the property defining the type:
											pV = valByTitle(dta,res,CONFIG.propClassType);
											// collect all nodes to delete, there should be only one:
											if( pV==r2c.folder ) {
												delL.push( nd )
											};
											// collect all diagrams for the new folders:
											if( pV==r2c.id ) {
												prL.push( {n:nd,r:res} )
											};
											return true  // continue always to the end
										}
						);
//						console.debug('collectResourcesByClass',delL,prL);
						resolve({status:0});
						// 2. Delete any existing folders,
						self.deleteContent( 'node', delL )
							.then(
								()=>{
									// Create a folder with all respective objects (e.g. diagrams):
									if( prL.length>0 ) {
										// 3. Sort the list alphabetically by the resources' title:
										sortBy( prL, (el)=>{ return el.r.title } );

										// 4. Create a new combined folder:
										let newD = {
											$schema: 'https://specif.de/v1.0/schema.json',
											dataTypes: [
												app.standardTypes.get('dataType',"DT-ShortString"),
												app.standardTypes.get('dataType',"DT-FormattedText")
											],
											propertyClasses: [
												app.standardTypes.get('propertyClass',"PC-Description"),
												app.standardTypes.get('propertyClass',"PC-Type")
											],
											resourceClasses: [
												app.standardTypes.get('resourceClass',"RC-Folder")
											],
											resources: Folder( r2c.folderName+apx, CONFIG.resClassProcesses ),
											hierarchies: [{
												id: "H"+r2c.folderName+apx,
												resource: r2c.folderName+apx,
												// re-use the nodes with their references to the resources:
												nodes: forAll( prL, (pr)=>{ return pr.n } ),
												changedAt: tim
											}]
										};
										// use the update function to eliminate duplicate types:
										self.update( newD, {mode:'adopt'} )
										.done( resolve )
										.fail( reject )
									} else {
										resolve({status:0})
									}
								},
								reject
							)
					}
				);
				return;

				function Folder(fId,ti) {
					var fL = [{
						id: fId,
						class: "RC-Folder",
						title: ti,
						properties: [{
							class: "PC-Type",
							value: CONFIG.resClassProcesses
						}],
						changedAt: tim
					}];
					return fL
				}
			}
		)
	};
	self.createGlossary = ( dta, opts )=>{
		return new Promise(
			(resolve,reject)=>{
				if( typeof(opts)!='object' || !opts.addGlossary ) { resolve({status:0}); return };
				if( typeof(dta)!='object' || !dta.id ) dta = self.data;
				// Assumes that the folder objects for the glossary are available

				// 1. Delete any existing glossaries
				// 1.1 Find all Glossary folders:
				let delL=[], dgL=[], res, pV,
					apx = self.data.id.simpleHash(),
					tim = new Date().toISOString();
//				console.debug('createGlossary',dta.hierarchies);
				iterateNodes( dta.hierarchies,
							(nd)=>{
								// get the referenced resource:
								res = itemById( dta.resources, nd.resource );
								// check, whether it is a glossary:
								pV = valByTitle(dta,res,CONFIG.propClassType);
								// collect all items to delete, there should be only one:
								if( pV==CONFIG.resClassGlossary ) {
									delL.push( nd )
								};
								// collect all diagrams which are referenced in the hierarchy
								// for inclusion in the new folders:
								if( isDiagram( res ) ) {
									dgL.push( res )
								};
								return true  // continue always to the end
							}
				);
				// 1.2 Delete now:
//				console.debug('createGlossary',delL,dgL);
				self.deleteContent( 'node', delL )
					.then(
						()=>{
							// 2. Create a new combined glossary:
							if( dgL.length>0 ) {
								let newD = {
									$schema: 'https://specif.de/v1.0/schema.json',
									dataTypes: [
										app.standardTypes.get('dataType',"DT-ShortString"),
										app.standardTypes.get('dataType',"DT-FormattedText")
									],
									propertyClasses: [
										app.standardTypes.get('propertyClass',"PC-Description"),
										app.standardTypes.get('propertyClass',"PC-Type")
									],
									resourceClasses: [
										app.standardTypes.get('resourceClass',"RC-Folder")
									],
									resources: Folders(),
									hierarchies: NodeList(self.data.resources)
								};
//								console.debug('glossary',newD);
								// use the update function to eliminate duplicate types;
								// 'opts.addGlossary' must not be true to avoid an infinite loop:
								self.update( newD, {mode:'adopt'} )
								.done( resolve )
								.fail( reject );
							} else {
								resolve({status:0});
							}
						},
						reject
					);
				return;

				function isDiagram( r ) {
					// a resource is a diagram, if it's type has a title 'SpecIF:Diagram':
					// .. or if it has a property dcterms:type with value 'SpecIF:Diagram':
					// .. or if it has at least one statement with title 'SpecIF:shows':
					return resClassTitleOf( r, dta )==CONFIG.resClassDiagram
						|| valByTitle(dta,r,CONFIG.propClassType)==CONFIG.resClassDiagram
						|| dta.statements.filter(
								(sta)=>{
									return staClassTitleOf( sta, dta )==CONFIG.staClassShows && sta.subject==r.id
								}
							).length>0
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
					return L
				}
				function extractDiagrams() {
					return extractByType(
						(nd)=>{
							// get the referenced resource:
							var res = itemById( dta.resources, nd.resource );
							if( isDiagram( res ) ) return res
						}
					)
				} */
				function Folders() {
					var fL = [{
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
					CONFIG.modelElementClasses.forEach( (mEl)=>{
						fL.push({
							id: "Folder-" + mEl.toJsId() + "-" + apx,
							class: "RC-Folder",
							title: mEl+'s',  // just adding the 's' is an ugly quickfix ... that works for now.
							properties: [],
							changedAt: tim
						})
					});
					return fL
				}
				function NodeList(resources) {
					// a. Add the folders:
					let gl = {
							id: "H-FolderGlossary-" + apx,
							resource: "FolderGlossary-" + apx,
							nodes: [],
							changedAt: tim
					};
					// Create a hierarchy node for each folder per model-element type
					CONFIG.modelElementClasses.forEach( function (mEl) {
						gl.nodes.push({
							id: "N-Folder-" + mEl.toJsId() + "-" + apx,
							resource: "Folder-" + mEl.toJsId() + "-" + apx,
							nodes: [],
							changedAt: tim
						})
					});
					// Create a list tL of collections per model-element type;
					// assuming that type adoption/deduplication is not always successful
					// and that there may be multiple resourceClasses per model-element type:
					let idx,
						tL = forAll( CONFIG.modelElementClasses, ()=>{ return [] } );
					// Each collection carries the ids of resourceClasses for the given model-element type:
					self.data.resourceClasses.forEach(
						(rC)=>{
							idx = CONFIG.modelElementClasses.indexOf(rC.title);
							if( idx>-1 ) tL[idx].push(rC.id)
						}
					);
//					console.debug('gl tL',gl,tL);

					// b. list all statements typed SpecIF:shows of diagrams found in the hierarchy:
					let staL = dta.statements.filter(
							(s)=>{
								return staClassTitleOf( s, dta )==CONFIG.staClassShows && indexById( dgL, s.subject )>-1
							}
						);
//					console.debug('gl tL dL',gl,tL,staL);

					// c. Add model-elements by class to the respective folders.
					// In case of model-elements the resource class is distinctive;
					// the title of the resource class indicates the model-element type.
					// List only resources which are shown on a referenced diagram:
					let resL = resources.filter( (r)=>{ return indexBy( staL, 'object', r.id )>-1 } );
					// in alphanumeric order:
					sortByTitle( resL );

					// Categorize resources:
					resL.forEach(
						(r)=>{
							// ... using the collections per fundamental model-element type:
							for( idx=tL.length-1;idx>-1;idx-- ) {
								if( tL[idx].indexOf( r['class'] )>-1 ) break
							};
							if( idx>-1 )
								gl.nodes[idx].nodes.push({
									// Create new hierarchy node with reference to the resource:
									// ID should be the same when the glossary generated multiple times,
									// but must be different from a potential reference somewhere else.
									id: 'N-' + (r.id + '-gen').simpleHash(),
									resource: r.id,
									changedAt: tim
								})
						}
					);
					return [gl]
				}
			}
		)
	};
	self.deduplicate = ( dta )=>{
		// Uses the cache.
		// ToDo: update the server.
		if( typeof(dta)!='object' || !dta.id ) dta = self.data;
//		console.debug('deduplicate',simpleClone(dta));
		let n,r,nR,rR;

		// 1. Deduplicate equal types having different ids;
		// the first of a equivalent pair in the list is considered the reference or original ... and stays,
		// whereas the second in a pair is removed.
		types.forEach( (ty)=>{
			if( Array.isArray(dta[ty.list]) )
				// skip last loop, as no duplicates can be found:
				for( n=dta[ty.list].length-1; n>0; n-- ) {
					for( r=0; r<n; r++ ) {
//						console.debug( '##', dta[ty.list][r],dta[ty.list][n],ty.eqFn(dta[ty.list][r],dta[ty.list][n]) );
						// Do it for all types:
						if( ty.eqFn(dta[ty.list][r],dta[ty.list][n]) ) {
							// Are equal, so substitute it's ids by the original item:
							ty.sbFn( dta, dta[ty.list][r].id, dta[ty.list][n].id );
							// ... and remove the duplicate item:
							dta[ty.list].splice(n,1);
							// skip the remaining iterations of the inner loop:
							break
						}
					}
				}
		});
//		console.debug( 'deduplicate 1', simpleClone(dta) );

		// 2. Remove duplicate resources:
		// skip last loop, as no duplicates can be found:
		for( n=dta.resources.length-1; n>0; n-- ) {
			for( r=0; r<n; r++ ) {
				// Do it for all model-elements, diagrams and folders
				// but exclude process gateways and generated events for optional branches:
				nR = dta.resources[n];
				rR = dta.resources[r];
//				console.debug( 'duplicate resource ?', rR, nR );
				if( CONFIG.modelElementClasses.concat(CONFIG.diagramClasses).indexOf( resClassTitleOf(rR,dta) )>-1
					&& eqR(dta,rR,nR)
					&& CONFIG.excludedFromDeduplication.indexOf(valByTitle( dta, nR, CONFIG.propClassType ))<0
					&& CONFIG.excludedFromDeduplication.indexOf(valByTitle( dta, rR, CONFIG.propClassType ))<0
				) {
					// Are equal, so remove the duplicate resource:
//					console.debug( 'duplicate resource', rR, nR, valByTitle( dta, nR, CONFIG.propClassType ) );
					substituteR(dta,rR,nR,{rescueProperties:true});
					dta.resources.splice(n,1);
					// skip the remaining iterations of the inner loop:
					break
				}
			}
		};
//		console.debug( 'deduplicate 2', simpleClone(dta) );

		// 3. Remove duplicate statements:
		// skip last loop, as no duplicates can be found:
		for( n=dta.statements.length-1; n>0; n-- ) {
			for( r=0; r<n; r++ ) {
				// Do it for all statements:
				if( eqS(dta.statements[r],dta.statements[n]) ) {
					// Are equal, so remove the duplicate statement:
					dta.statements.splice(n,1);
					// skip the remaining iterations of the inner loop:
					break
				}
			}
		};
//		console.debug( 'deduplicate 3', simpleClone(dta) );
		return dta
	};
	function getDuplicate(dta,id) {
		// check whether there is an item with the same id in dta.
		// If so, return the item:
		if( dta.id==id ) return dta;
		let dupl;
		for( var i in dta ) {
			if( Array.isArray( dta[i] ) ) {
				for( var j=dta[i].length-1;j>-1;j-- ) {
					dupl = getDuplicate(dta[i][j],id);
					if( dupl ) return dupl
				}
			}
		};
		return
	}
	// var updateModes = ["adopt","match","extend","ignore"];
	self.update = ( newD, opts )=>{
//		console.debug('update',newD,opts);
		// Use jQuery instead of ECMA Promises for the time being, because of progress notification.
		var uDO = $.Deferred();

		newD = specif.toInt(newD);	// transform to internal data structure
	/*	if( !newD ) {
			uDO.reject({ status: 995, statusText: i18n.MsgImportFailed });
			return uDO
		}; */

		switch( opts.mode ) {
			case 'update':
				updateWithLastChanged( newD, opts );
				break;
			case 'adopt':
				adopt( newD, opts );
				break;
			default:
				uDO.reject({status:999,statusText:'No update mode specified'});
		};
		return uDO

		// --------------------------------
		// The processing per mode:
		function adopt( nD, opts ) {
			// First check whether BPMN collaboration and process have unique ids:
//			console.debug('adopt project',nD);
			// ToDo: The new collaboration id gets lost, so far!

			// 1. Integrate the types:
			//    a) if different id, save new one and use it.
			//    b) if same id and same content, just use it (no action)
			//    c) if same id and different content, save with new id and update all references
			let i,I,pend=0,itmL;
//			console.debug('#1',simpleClone(self.data),simpleClone(nD));
			types.forEach( (ty)=>{
				if( Array.isArray(nD[ty.list]) ) {
					itmL=[];
					for( i=0,I=nD[ty.list].length; i<I; i++ ) {
						let nC = nD[ty.list][i],  // nC is a class in the new data
							// types are compared by id, instances by title:
							idx = indexById( self.data[ty.list], nC.id );
						if( idx<0 ) {
							// there is no item with the same id:
							itmL.push( nC )
						} else {
							// there is an item with the same id:
							if( !ty.eqFn( self.data[ty.list][idx], nC) ) {
								// c) create a new id and update all references:
								// Note: According to the SpecIF schema, dataTypes may have no additional XML-attribute
								// ToDo: In ReqIF an attribute named "Reqif.ForeignId" serves the same purpose as 'alterId':
								let alterId = nC.id;
								nC.id += '-' + new Date().toISOString().simpleHash();
								ty.sbFn( nD, nC.id, alterId );
								itmL.push( nC );
							}
						}
					};
					pend++;
					self.createContent( ty.name, itmL )
						.then( finalize, uDO.reject )
				}
			});
//			console.debug('#2',simpleClone(self.data),simpleClone(nD));

			// 2. Integrate the instances:
			//    a) if different title or type, save new one and use it.
			//    b) if same title and type, just use it and update all references
			itmL=[];
			for( i=0,I=nD.resources.length; i<I; i++ ) {
				let nR = nD.resources[i]; // nR is a resource in the new data

				// If the resource' class belongs to a collection of class-titles and is not excluded from deduplication.
				// The folders are not consolidated, because it may happen that there are
				// multiple folders with the same name but different description in different locations of the hierarchy.
				if( CONFIG.modelElementClasses.concat(CONFIG.diagramClasses).indexOf( resClassTitleOf(nR,nD) )>-1
					&& CONFIG.excludedFromDeduplication.indexOf( valByTitle(nD,nR,CONFIG.propClassType) )<0
				) {
						// Check for a resource with the same title:
						let eR = itemByTitle( self.data.resources, nR.title );  // resource in the existing data
						// If there is an instance with the same title ... and if the types match;
						// the class title reflects the role of it's instances ...
						// and is less restrictive than the class ID:
//						console.debug('~1',nR,eR?eR:'');
						if( eR
							&& CONFIG.excludedFromDeduplication.indexOf(valByTitle( self.data, eR, CONFIG.propClassType ))<0
							&& resClassTitleOf(nR,nD)==resClassTitleOf(eR,self.data)
					//		&& valByTitle(nD,nR,CONFIG.propClassType)==valByTitle(self.data,eR,CONFIG.propClassType)
						) {
//							console.debug('~2',eR,nR);
							// There is an item with the same title and type,
							// adopt it and update all references:
							substituteR( nD, eR, nR, {rescueProperties:true} );
							continue
						}
				};

				// Execution gets here, unless a substitution has taken place;
				// keep separate instances:

				// Note that in theory, there shouldn't be any conflicting ids, but in reality there are;
				// for example it has been observed with BPMN/influx which is based on bpmn.io like cawemo.
				// ToDo: make it an option.

				// Check, whether the existing model has an element with the same id,
				// and since it does have a different title or different type (otherwise it would have been substituted above),
				// assign a new id to the new element:
				if( getDuplicate(self.data,nR.id) ) {
					let newId = genID('R-');
					// first assign new ID to all references:
					substituteR( nD, {id:newId}, nR );
					// and then to the resource itself:
					nR.id = newId
				};
//				console.debug('+ resource',nR);
				itmL.push( nR )
			};
			pend++;
			self.createContent( 'resource', itmL )
				.then( finalize, uDO.reject );
//			console.debug('#3',simpleClone(self.data),simpleClone(nD));

			// 3. Create the remaining items:
			pend += 3;
			self.createContent( 'statement', nD.statements )
				.then( finalize, uDO.reject );
			self.createContent( 'hierarchy', nD.hierarchies )
				.then( finalize, uDO.reject );
			self.createContent( 'file', nD.files )
				.then( finalize, uDO.reject );
			return

			function finalize() {
				if(--pend<1) {
//					console.debug('#4',simpleClone(self.data),simpleClone(nD));
					// 4. Finally some house-keeping:
					hookStatements();
					self.deduplicate();	// deduplicate equal items
					// ToDo: Save changes from deduplication to the server.
//					console.debug('#5',simpleClone(self.data),opts);
				//	uDO.resolve({status:0});
					self.collectResourcesByClass(self.data,opts)
					.then(
						()=>{
							self.createGlossary(self.data,opts)
							.then( ()=>{ uDO.resolve({status:0}) }, uDO.reject )
						},
						uDO.reject
					)
				}
			}
		}
		function updateWithLastChanged( nD, opts ) {
			console.debug('update project',nD,opts);
			// Update a loaded project with data of the new:
			// - Types with the same id must be compatible
			// - New types will be added
			// - Instances with newer changedAt replace older ones
			// - Both the id and alternativeIds are used to associate existing and new instances

		/*	// In a first pass check, if there is any incompatible type making an update impossible:
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
			console.info("All existing types are compatible with '"+newD.title+"'");  */

		}

/*		// newD is new data in 'internal' data structure
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

		function updateNext(ctg) {
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
		function addNewTypes( ctg ) {
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
		function updateIfChanged(ctg) {
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

			function contentChanged(ctg, r, n) { // ref and new resources
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
						//		rV = toHex(rA.value.stripCtrl().reduceWhiteSpace());
						//		nV = toHex(fileRef.toServer(nA.value).stripCtrl().reduceWhiteSpace());
						//		rV = rA.value.stripCtrl().reduceWhiteSpace();
								rV = rA.value;
								// apply the same transformation to nV which has been applied to rV before storing:
						//		nV = fileRef.toServer(nA.value).stripCtrl().reduceWhiteSpace();
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
			function updateInstanceIfChanged(ctg,nI) {
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
			function updateTreeIfChanged( ctg, aI, nI ) {
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

	self.createContent = ( ctg, item )=>{
		// item can be a js-object or a list of js-objects
		// ctg is a member of [dataType, resourceClass, statementClass, propertyClass, resource, statement, hierarchy]
		// ...  not all of them may be implemented, so far.
		// cache the value before sending it to the server, as the result is not received after sending (except for 'resource' and 'statement')
		return new Promise(
			(resolve,reject)=>{
//				console.debug('createContent', ctg, item );
				switch( ctg ) {
				//	case 'resource':
				//	case 'statement':
				//	case 'hierarchy':
				//	case 'node':
						// no break
					default:
						// if current user can create an item, he has the other permissions, as well:
				//		addPermissions( item );
				//		item.createdAt = new Date().toISOString();
				//		item.createdBy = item.changedBy;
						cache( ctg, item )
				};
				resolve({status:0})
			}
		)
	};
	self.readContent = ( ctg, item, opts )=>{
		// ctg is a member of [dataType, resourceClass, statementClass, resource, statement, hierarchy]
		//  for compatibility with older callers:
	/*	if( typeof(opts)=='boolean' )
			opts = {reload: opts};
		// .. and by default:
		if( !opts )
			opts = {reload: false}; */

	//	if( !opts.reload ) {
			// Try to read from cache:
			if( !opts ) opts = {reload:false,timelag:10};
			// override 'reload' as long as there is no server and we know that the resource is found in the cache:
			opts.reload = false;
//			console.debug('readContent',ctg,item,opts);
			return readCache( ctg, item, opts );
	//	};
	//	return null
	};
	self.updateContent = ( ctg, item )=>{
		// ctg is a member of [resource, statement, hierarchy], 'null' is returned in all other cases.
			function updateCh( itm ) {
				itm.changedAt = new Date().toISOString();
				itm.changedBy = app.me.userName
			}

		return new Promise(
			(resolve, reject) => {
				switch( ctg ) {
					case 'node':
						// nodes can only be created or deleted
						return null;
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
						cache( ctg, item )
				};
				resolve({status:0})
			}
		)
	};
	self.deleteContent = ( ctg, item )=>{
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
												|| pCIsInUse(self.data.statements,itm)
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
					case 'statement':
					case 'node':
//						console.debug('deleteContent',ctg,item);
						if( uncache( ctg, item )<0 ) reject({status:999,statusText:ctg+' '+item.id+' not found and thus not deleted.'});
						break;
					default:
						reject({status:999,statusText:'Category '+ctg+' is unknown; item '+item.id+' could not be deleted.'})
				};
				resolve({status:0})
			}
		)
	};

	self.createResource = ( oT )=>{
		// Create an empty form (resource instance) for the resource class oT:
		// Note: ES6 promises are used;
		// see https://codeburst.io/a-simple-guide-to-es6-promises-d71bacd2e13a
		// also https://javascript.info/promise-chaining
		return new Promise(
			(resolve, reject) => {
				// Get the class's permissions. So far, it's property permissions are not loaded ...
				var res;

				self.readContent( 'resourceClass', oT, {reload:true} )
				.then(
					(rC)=>{
//						console.debug('#1',rC);
						// return an empty resource instance of the given type:
						res = {
							id: genID('R-'),
							class: rC.id,
							title: '',
							permissions: rC.permissions||{cre:true,rea:true,upd:true,del:true},
							properties: []
						};
						return self.readContent( 'propertyClass', rC.propertyClasses )
					}
				)
				.then(
					(pCL)=>{
//						console.debug('#2',pCL);
						res.properties = forAll( pCL, createProp );
						resolve( res )
					}
				)
				.catch(	reject )
			}
		)
	};
	self.readStatementsOf = ( res, showComments )=>{
		// Get the statements of a resource ... there are 2 use-cases:
		// - All statements between resources appearing in a hierarchy shall be shown for navigation;
		//   it is possible that a resource is deleted (from all hierarchies), but not it's statements.
		//   --> set 'showComments' to false
		// - All comments referring to the selected resource shall be shown;
		//   the resource is found in the cache, but the comment is not.
		//   --> set 'showComments' to true

		return new Promise(
			(resolve, reject) => {
				self.readContent( 'statement', 'all' )
				.then(
					(sL)=>{
						// filter all statements involving res as subject or object:
						resolve(
							sL.filter(
								(s)=>{
									return ( res.id==itemIdOf(s.subject) || res.id==itemIdOf(s.object) )
										// AND fulfilling certain conditions:
										&&  (
												// related subject and object must be referenced in the tree to be navigable,
												// also, the statement must not be declared 'hidden':
												!showComments
													// cheap tests first:
													&&	s.title!=CONFIG.staClassCommentRefersTo
													&& 	CONFIG.hiddenStatements.indexOf( s.title )<0
													&&	isReferencedByHierarchy( itemIdOf(s.subject) )
													&&	isReferencedByHierarchy( itemIdOf(s.object) )
												// In case of a comment, the comment itself is not referenced in the tree:
											||	showComments
													&&	s.title==CONFIG.staClassCommentRefersTo
													&&	isReferencedByHierarchy( itemIdOf(s.object) )
											)
								}
							)
						)
					},
					reject
				)
			}
		)
	};

	// Select format and options with a modal dialog, then export the data:
	self.exportFormatClicked = ()=>{
		// Display options depending on selected format:
		// In case of ReqIF OOXML and ePub, let the user choose the language, if there are more than one:
		document.getElementById( "expOptions" ).innerHTML = self.exportOptions( radioValue( i18n.LblFormat ) );

//		console.debug('exportFormatClicked',radioValue( i18n.LblFormat ))
	};
	self.exportOptionsClicked = ()=>{
		// Obtain selected options:
		// add 'zero with space' (&#x200b;) to make the label = div-id unique:
		self.data.title = textValue( '&#x200b;'+i18n.LblProjectName );
		fileName = textValue( '&#x200b;'+i18n.LblFileName );

//		console.debug('exportOptionsClicked',self.data.title,fileName)
	};
	self.exportOptions = (fmt)=>{
		const exportOptionsClicked = 'app.cache.selectedProject.exportOptionsClicked()';
		var pnl =  '<div class="panel panel-default panel-options" style="margin-bottom:0">'
			//	+		"<h4>"+i18n.LblOptions+"</h4>"
						// add 'zero with space' (&#x200b;) to make the label = div-id unique:
				+ 		textField( '&#x200b;'+i18n.LblProjectName, self.data.title, 'line', exportOptionsClicked )
				+ 		textField( '&#x200b;'+i18n.LblFileName, self.data.title, 'line', exportOptionsClicked );
		switch( fmt ) {
			case 'epub':
			case 'oxml':
				pnl +=	checkboxField(
						//	i18n.LblOptions,
							i18n.modelElements,
							[
								{ title: i18n.withOtherProperties, id: 'withOtherProperties', checked: true },
								{ title: i18n.withStatements, id: 'withStatements', checked: true }
							],
							{ handle: exportOptionsClicked }
						)
		};
		pnl +=		'</div>';
//		console.debug('exportOptions',fmt,pnl);
		return pnl
	};
	self.export = ()=>{
		if( self.exporting ) return;

		const exportFormatClicked = 'app.cache.selectedProject.exportFormatClicked()';
		let dlg = new BootstrapDialog({
			title: i18n.LblExport+": '"+self.data.title+"'",
			type: 'type-primary',
			size: BootstrapDialog.SIZE_WIDE,
			message: (thisDlg)=>{
				var form = '<div class="row" style="margin: 0 -4px 0 -4px">'
						+	'<div class="col-sm-12 col-md-6" style="padding: 0 4px 0 4px">'
						+     '<div class="panel panel-default panel-options" style="margin-bottom:4px">'
					//	+		"<h4>"+i18n.LblFormat+"</h4>"
						+		"<p>"+i18n.MsgExport+"</p>"
						+		radioField(
									i18n.LblFormat,
									[
										{ title: 'SpecIF v'+app.specifVersion, id: 'specif', checked: true },
										{ title: 'ReqIF v1.2', id: 'reqif' },
										{ title: 'ePub v2', id: 'epub' },
										{ title: 'MS WORD® (Open XML)', id: 'oxml' }
									],
									{handle:exportFormatClicked}  // options depend on format
								)
						+	  '</div>'
						+   '</div>'
						+	'<div id="expOptions" class="col-sm-12 col-md-6" style="padding: 0 4px 0 4px">'
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
							app.busy.reset,
							handleError
						);
						thisDlg.close()
					}
				}
			]
		})
		.open()

		// ---
		function handleError(xhr) {
			self.exporting = false;
			message.show( xhr )
		}
	};
	self.exportAs = (opts)=>{
		if( self.exporting ) return;

		if( !opts ) opts = {};
		if( !opts.format ) opts.format = 'specif';
		// in certain cases, try to export files with the same name in PNG format, as well.
		// - ole: often, preview images are supplied in PNG format;
		// - svg: for generation of DOC or ePub, equivalent images in PNG-format are needed.
	//	if( typeof(opts.preferPng)!='boolean' ) opts.preferPng = true;   ... is the default
	//	if( !opts.alternatePngFor ) opts.alternatePngFor = ['svg','ole'];	... not yet supported

		return new Promise( (resolve, reject)=>{

			/*	function handleError(xhr) {
					self.exporting = false;
					reject(xhr)
				}  */

			if( self.data.exp ) {
				self.exporting = true;

				switch( opts.format ) {
					case 'reqif':
					case 'specif':
						storeAs( opts );
						break;
					case 'epub':
					case 'oxml':
						publish( opts )
				}
			} else {
				reject({status: 999, statusText: "No permission to export"})
			};
			return

			function publish( opts ) {
				if( !opts || ['epub','oxml'].indexOf(opts.format)<0 ) return null; // programming error
				// ToDo: Get the newest data from the server.
//				console.debug( "publish", opts );

				// Don't lookup titles now, but within toOxml(), so that that the publication can properly classify the properties.
				opts.lookupTitles = false;  // applies to specif.toExt()
				opts.lookupValues = true;  // applies to specif.toExt()
				// But DO reduce to the language desired.
				if( typeof(opts.targetLanguage)!='string' ) opts.targetLanguage = browser.language;
				opts.makeHTML = true;
				opts.linkifyURLs = true;
				// take newest revision:
				opts.revisionDate = new Date().toISOString();

				let data = specif.toExt( self.data, opts ),
					options = {
						// Values of declared stereotypeProperties get enclosed by double-angle quotation mark '&#x00ab;' and '&#x00bb;'
						titleProperties: CONFIG.titleProperties.concat(CONFIG.headingProperties),
						descriptionProperties: CONFIG.descProperties,
						stereotypeProperties: CONFIG.stereotypeProperties,
						lookup: i18n.lookup,
						// If a hidden property is defined with value, it is suppressed only if it has this value;
						// if the value is undefined, the property is suppressed in all cases.
					//	hiddenProperties: opts.lookupTitles? [{title:i18n.lookup('SpecIF:Type'),value:'SpecIF:Folder'}] : [{title:'SpecIF:Type',value:'SpecIF:Folder'}],
						hiddenProperties: [{title:'SpecIF:Type',value:'SpecIF:Folder'},{title:'SpecIF:Type',value:'SpecIF:Heading'}],
						showEmptyProperties: CONFIG.showEmptyProperties,
						imgExtensions: CONFIG.imgExtensions,
						applExtensions: CONFIG.applExtensions,
					//	hasContent: hasContent,
						propertiesLabel: opts.withOtherProperties? 'SpecIF:Properties' : undefined,
						statementsLabel: opts.withStatements? 'SpecIF:Statements' : undefined,
						fileName: opts.fileName,
						done: ()=>{ app.cache.selectedProject.exporting=false; resolve() },
						fail: (xhr)=>{ app.cache.selectedProject.exporting=false; reject(xhr) }
					},
					pend=0;

				if( data.files )
					// Transform any special format:
					data.files.forEach( (f,i,L)=>{
						switch( f.type ) {
							case 'application/bpmn+xml':
								pend++;
								// Read and render BPMN as SVG:
								blob2text(f, (b)=>{
									bpmn2svg(b)
									.then(
										(result)=>{
											// replace BPMN by SVG:
											L.splice(i,1,{
												blob: new Blob([result.svg],{type: "text/plain; charset=utf-8"}),
												id: 'F-'+f.title.simpleHash(),
												title: f.title.fileName()+'.svg',
												type: 'image/svg+xml',
												changedAt: f.changedAt
											});
//											console.debug('SVG',result.svg,L);
											if( --pend<1 )
												// Finally publish in the desired format:
												pub();
										},
										(err)=>{
											console.error('BPMN-Viewer could not deliver SVG', err)
										}
									)
								}, 0)
						}
					});
				// In case there is nothing to transform, we start right away:
				if( pend<1 )
					// publish in the desired format:
					pub();
				return;

				function pub() {
					switch( opts.format ) {
						case 'epub':
							toEpub( data, options );
							break;
						case 'oxml':
							toOxml( data, options );
					};
				}
			}
			function storeAs( opts ) {
				if( !opts || ['specif','reqif'].indexOf(opts.format)<0 ) return null;
				// ToDo: Get the newest data from the server.
//				console.debug( "storeAs", opts );

				switch( opts.format ) {
					case 'specif':
						// keep vocabulary terms:
						opts.lookupTitles = false;
						opts.lookupValues = false;
						// export all languages:
						opts.targetLanguage = undefined;
						// keep all revisions:
						opts.revisionDate = undefined;
						break;
					case 'reqif':
						// keep vocabulary terms:
						opts.lookupTitles = false;
						opts.lookupValues = false;
						// ReqIF only supports a single Language:
						if( typeof(opts.targetLanguage)!='string' ) opts.targetLanguage = browser.language;
						opts.makeHTML = true;
						opts.linkifyURLs = true;
						// take newest revision:
						opts.revisionDate = new Date().toISOString();
				};
				let zip = new JSZip(),
					data = specif.toExt( self.data, opts ),
					fName = (opts.fileName || data.title);

				// Add the files to the ZIP container:
				if( data.files )
					data.files.forEach( (f)=>{
//						console.debug('zip a file',f);
						zip.file( f.title, f.blob );
						delete f.blob; // the SpecIF data below shall not contain it ...
					});

				// Prepare the output data:
				switch( opts.format ) {
					case 'specif':
						fName += ".specif";
						data = JSON.stringify( data );
						break;
					case 'reqif':
						fName += ".reqif";
						data = app.ioReqif.toReqif( data );
				};
				let blob = new Blob([data], {type: "text/plain; charset=utf-8"});
				// Add the project:
				zip.file( fName, blob );
				blob = undefined; // free heap space

				// done, store the specifz:
				zip.generateAsync({
						type: "blob"
					})
					.then(
						(blob)=>{
							// successfully generated:
//							console.debug("storing ",fName+"z");
							saveAs(blob, fName+"z");
							self.exporting = false;
							resolve()
						},
						(xhr)=>{
							// an error has occurred:
							console.error("Cannot store ",fName+"z");
							self.exporting = false;
							reject();
						}
					);
			}
		});
	}
	self.abort = ()=>{
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
		return rDO
	}
	function loadAll( ctg ) {
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
		return dO
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
	function classIsCompatible(ctg,refC,newC,mode) {
	//	if(refC.id!=newC.id) return {status:0};
		// else: identifiers are equal:
//		console.debug( 'classIsCompatible', refC, newC );
		switch( ctg ) {
			case 'dataType':
				// A dataType is incompatible, if an existing one has the same id and a smaller value range.
				// A dataType is compatible, if an existing one has the same id and an equal or larger value range.
				switch( refC.type ) {
					case 'xs:boolean':
					case 'xs:dateTime':
						return {status:0};
					case 'xhtml':
					case 'xs:string':
//						console.debug( refC.maxLength>newC.maxLength-1 );
						if ( refC.maxLength==undefined )
							return {status:0};
						if ( newC.maxLength==undefined || refC.maxLength<newC.maxLength )
							return {status:951, statusText:"new dataType '"+newC.id+"' of type '"+newC.type+"' is incompatible"};
						return {status:0};
					case 'xs:double':
						// to be compatible, the new 'fractionDigits' must be lower or equal:
						if( refC.fractionDigits<newC.fractionDigits )
							return {status:952, statusText:"new dataType '"+newC.id+"' of type '"+newC.type+"' is incompatible"};
						// else: go on ...
					case 'xs:integer':
						// to be compatible, the new 'maxInclusive' must be lower or equal and the new 'minInclusive' must be higher or equal:
//						console.debug( refC.maxInclusive<newC.maxInclusive || refC.minInclusive>newC.minInclusive );
						if( refC.maxInclusive<newC.maxInclusive || refC.minInclusive>newC.minInclusive )
							return {status:953, statusText:"new dataType '"+newC.id+"' of type '"+newC.type+"' is incompatible"}
						else
							return {status:0};
					case 'xs:enumeration':
						// to be compatible, every value of the new 'enumeration' must be present in the present one:
						// ToDo: Add a new enum value to an existing enum dataType.
						var idx=null;
						for( var v=newC.values.length-1; v>-1; v-- ) {
							idx = indexById( refC.values, newC.values[v].id );
							// the id must be present:
							if( idx<0 )
								return {status:954, statusText:"new dataType '"+newC.id+"' of type '"+newC.type+"' is incompatible"};
							//  ... and the titles must be equal:
							if( refC.values[idx].title != newC.values[v].title )
								return {status:955, statusText:"new dataType '"+newC.id+"' of type '"+newC.type+"' is incompatible"}
						};
						return {status:0};
				};
				return null;	// should never arrive here ... as every branch in every case above has a return.
			case 'propertyClass':
				// ToDo
				return null;	// should never arrive here ... as every branch in every case above has a return.
			case 'statementClass':
				// To be compatible, all sourceTypes of newC must be contained in the sourceTypes of refC;
				// no sourceTypes means that all resourceClasses are permissible as subject.
				// ... and similarly for the targetTypes:
				if( refC.sourceTypes && !newC.sourceTypes
					|| refC.sourceTypes && newC.sourceTypes && !containsById( refC.sourceTypes, newC.sourceTypes ) ) {
							return {status:961, statusText:"new "+ctg+" '"+newC.id+"' is incompatible"}
				};
				if( refC.targetTypes && !newC.targetTypes
					|| refC.targetTypes && newC.targetTypes && !containsById( refC.targetTypes, newC.targetTypes ) ) {
							return {status:962, statusText:"new "+ctg+" '"+newC.id+"' is incompatible"}
				};
				// else: so far everything is OK, but go on checking ... (no break!)
			case 'resourceClass':
				// A resourceClass or statementClass is incompatible, if it has an equally-named property class with a different dataType
				// A resourceClass or statementClass is compatible, if all equally-named propertyClasses have the same dataType
				if( !newC.propertyClasses || !newC.propertyClasses.length )
							return {status:0};
				// else: The new type has at least one property.
				if( mode=='match' && (!refC.propertyClasses || !refC.propertyClasses.length) )
							return {status:963, statusText:"new "+ctg+" '"+newC.id+"' is incompatible"};
				var idx=null, pc=null;
				for( var a=newC.propertyClasses.length-1; a>-1; a-- ) {
					npc = newC.propertyClasses[a];
					if( npc.id ) {
						// If an id exists, it must be equal to one of refC's propertyClasses:
						idx = indexById( refC.propertyClasses, npc.id )
					} else {
						// If there is no id, the type is new and there are no referencing elements, yet.
						// So it does not matter.
						// But there must be a property class with the same name:
						idx = indexByTitle( refC.propertyClasses, npc.title )
					};
					if( idx<0 ) {
						// The property class in the new data is not found in the existing (reference) data:
						if( mode=='match' )
							// the property class is expected and thus an error is signalled:
							return {status:964, statusText:"new "+ctg+" '"+newC.id+"' is incompatible"}
						else
							// cases 'extend' and 'ignore';
							// either the property will be created later on, or it will be ignored;
							// we are checking only in a first pass.
							continue;
					};
					//  else: the property class is present; in this case and in all modes the dataTypes must be equal:
					if( refC.propertyClasses[idx].dataType != npc.dataType ) {
						return {status:965, statusText:"new "+ctg+" '"+newC.id+"' is incompatible"}
					}
				};
				return {status:0};
		};
		return null;	// should never arrive here ...
	}
/*	function classesAreCompatible( ctg, mode ) {
		let aL= null, nL= null;
		switch( ctg ) {
			case 'dataType': aL = self.data.dataTypes; nL = newD.dataTypes; break;
			case 'propertyClass': aL = self.data.propertyClasses; nL = newD.propertyClasses; break;
			case 'resourceClass': aL = self.data.resourceClasses; nL = newD.resourceClasses; break;
			case 'statementClass': aL = self.data.statementClasses; nL = newD.statementClasses; break;
			default: return null //should never arrive here
		};
		// true, if every element in nL is compatibly present in aL or if it can be added:
		let j=null, rC=null;
		for( var i=nL.length-1;i>-1;i-- ) {
			for( j=aL.length-1;j>-1;j-- ) {
				console.debug('classesAreCompatible',aL[j],nL[i]);
				// if a single element is incompatible the lists are incompatible:
				rC = classIsCompatible(ctg,aL[j],nL[i],mode);
				// on first error occurring, quit with return code:
				if( rC.status>0 ) return rC
			}
		};
		return {status:0}
	} */

	function cache( ctg, item ) {
		if( !item || Array.isArray(item)&&item.length<1 ) return;
		// If item is a list, all elements must have the same category.
		let fn = Array.isArray(item)?cacheL:cacheE;
		switch(ctg) {
			case 'hierarchy':
			case 'dataType':
			case 'propertyClass':
			case 'resourceClass':
			case 'statementClass':		return fn( cacheOf(ctg), item );
			case 'resource':
			case 'statement':
			case 'file': 				if(app.cache.cacheInstances) return fn( cacheOf(ctg), item );
										else return;
			case 'node':				if(Array.isArray(item)) return null;
//										console.debug('cache',ctg,item);
										return cacheNode( item );
			default: return null;
		}
		// all cases have a return statement ..

		function cacheNode( e ) {
			// add or replace a node in a hierarchy;
			// e may specify a predecessor or parent, the former prevails if both are specified
			// - if there is no predecessor or it isn't found, insert as first element
			// - if no parent is specified or the parent isn't found, insert at root level

			// 1. Delete the node, if it exists somewhere to prevent
			//    that there are multiple nodes with the same id;
			//    Thus, 'cacheNode' is in fact a 'move':
			uncache( 'node', {id:e.id} );

			// 2. Insert the node, if the predecessor exists somewhere:
			if( iterateNodes( self.data.hierarchies,
							// continue searching until found:
							(nd)=>{ return nd.id!=e.predecessor },
							// insert the node after the predecessor:
							(ndL)=>{
								let i=indexById(ndL,e.predecessor);
								if(i>-1) ndL.splice(i+1,0,e)
							}
						)
			) return true;

			// 3. Insert the node, if the parent exists somewhere:
			if( iterateNodes( self.data.hierarchies,
							// continue searching until found:
							(nd)=>{
								if( nd.id==e['parent'] ) {
									if( !Array.isArray(nd.nodes) ) nd.nodes = [];
									// we will not find a predecessor at this point any more,
									// so insert as first element of the children:
									nd.nodes.unshift( e );
//									console.debug('parent found', nd );
									return false // stop searching
								};
								return true  // continue searching
							}
							// no list function
						)
			) return true;

			// 4. insert the node as first root element, otherwise:
			self.data.hierarchies.unshift( e );
		}
		function cacheAtPosition( L, e ) {  // ( list, entry )
			// add or update the element e in a list L:
			let n = indexById( L, e.id ),
				p = indexById( L, e.predecessor );
			if( n<0 ) 	{
				// not yet listed, so add;
				// after the predecessor, if specified, or by default as first element:
				e.predecessor? L.splice(++p,0,e) : L.unshift(e);
//				console.debug('cacheA 1',p,L);
				return p
			};
			if( e.predecessor && n!=p ) {
				// remove existing and add the new element:
				L.splice(n,1).splice(++p,0,e);
//				console.debug('cacheA 2',p,L);
				return p
			};
			// update the existing otherwise:
			L[n] = e;
			return n;
		}
	}
	function uncache( ctg, item ) {
		if( !item ) return;
		let fn = Array.isArray(item)?uncacheL:uncacheE;
		switch(ctg) {
			case 'hierarchy':
			case 'dataType':
			case 'propertyClass':
			case 'resourceClass':
			case 'statementClass':		return fn( cacheOf(ctg), item );
			case 'resource':
			case 'statement':
			case 'file':				if(app.cache.cacheInstances) return fn( cacheOf(ctg), item );
										else return;
			case 'node':				if( Array.isArray(item) )
											item.forEach( (it)=>{ delNodes( self.data.hierarchies, it ) })
										else
											delNodes( self.data.hierarchies, item );
										return;
			default: return null; // programming error
		};
		// all cases have a return statement ..

		function delNodes( L, el ) {
			// Delete all nodes specified by the element;
			// if el is the node, 'id' will be used to identify it (obviously at most one node),
			// and if el is the referenced resource, 'resource' will be used to identify all referencing nodes.
			if( !Array.isArray( L ) ) return;
			for( var h=L.length-1; h>-1; h-- ) {
				if( L[h].id==el.id || L[h].resource==el.resource ) {
					L.splice(h,1);
					break;	// can't delete any children
				};
				// step down, if the node hasn't been deleted:
				delNodes( L[h].nodes, el );
			}
		}
	}
	function cacheOf( ctg ) {
		// Return the cache for a given category:
		switch(ctg) {
			case 'dataType':		return self.data.dataTypes;
			case 'propertyClass':	return self.data.propertyClasses;
			case 'resourceClass':	return self.data.resourceClasses;
			case 'statementClass':	return self.data.statementClasses;
			case 'resource':		return self.data.resources;
			case 'statement':		return self.data.statements;
			case 'hierarchy':		return self.data.hierarchies;
			case 'file':			return self.data.files;
		}
	}
	function readCache( ctg, itm, opts ) {
		// Read an item from cache, unless 'reload' is specified.
		// - itm can be single or a list,
		// - each element can be an object with attribute id or an id string
		if( !opts.reload ) {
			let cch = cacheOf(ctg),
				idx=null;
			if( itm=='all' ) {
				// return all cached items asynchronously:
				return new Promise(( resolve, reject)=>{
					resolve( [].concat(cch) );	// return a new list with the original elements
				})
			};
			if( Array.isArray(itm) ) {
				let allFound=true, i=0, I=itm.length;
				var rL = [];
				while( allFound && i<I ) {
					idx = indexById( cch, itm[i].id||itm[i] );
					if( idx>-1 ) {
						rL.push( cch[idx] );
						i++;
					} else {
						allFound = false;
					}
				};
				// return the cached resources asynchronously:
				return new Promise((resolve, reject) => {
					// delay the answer a little, so that the caller can properly process a batch:
					setTimeout( ()=>{
						if( allFound ) {
//							console.debug( 'readCache array - allFound', cch, itm );
							resolve( rL );
						} else {
							reject( {status:999,statusText:ctg+' with id '+(itm[i].id||itm[i])+' not found.'} );
						};
					}, opts.timelag );
				})
			} else {
				// is a single item:
				idx = indexById( cch, itm.id||itm );
				// return the cached object asynchronously:
				return new Promise( (resolve, reject)=>{
					// delay the answer a little, so that the caller can properly process a batch:
					setTimeout( ()=>{
						if( idx>-1 ) {
							resolve( cch[idx] )
						} else {
							reject( {status:999,statusText:ctg+' with id '+(itm.id||itm)+' not found.'} )
						}
					}, opts.timelag )
				})
			}
//			console.debug('readCache - not found', ctg, itm);
		};
		return null;
	}
}  // end of function Project()

//////////////////////////
// global helper functions:
const specif = {
	check: ( data, opts )=>{
		// Check the SpecIF data for schema compliance and consistency;
		// no data of app.cache is modified:
		return new Promise(
			(resolve,reject)=>{

				if( typeof(data)!='object' ) {
					reject( {status:999,statusText:'No SpecIF data to check'} );
				};

				// 1. Validate the data using the SpecIF schema:

				// Get the specified schema file from the server:
				httpGet({
					url: data['$schema'] || 'https://specif.de/v'+data.specifVersion+'/schema',
					responseType: 'arraybuffer',
					withCredentials: false,
					done: (xhr)=>{
//						console.debug('schema', xhr);
						// 1. check data against schema:
						let rc = checkSchema( data, {schema: JSON.parse( buf2str(xhr.response) )} );
						if( rc.status!=0 ) {
							// older versions of the checking routine don't set the responseType:
							if( typeof(rc.responseText)=='string' && rc.responseText.length>0 )
								rc.responseType = 'text';
							reject( rc );
							return
						};

						// 2. Check further constraints:
						rc = checkConstraints( data, opts );
						if( rc.status==0 ) {
//							console.debug('SpecIF Consistency Check:', rc, simpleClone(data));
							resolve( data, rc )
						} else {
//							console.debug('SpecIF Consistency Check:', rc);
							reject( rc )
						}
					},
					fail: (xhr)=>{
						switch( xhr.status ) {
							case 404:
								let v = data.specifVersion? 'version '+data.specifVersion : 'with Schema '+data['$schema'];
								xhr = { status: 903, statusText: 'SpecIF '+v+' is not supported by the program!' };
							default:
								reject(xhr)
						}
					}
				})
			}
		)
	},
	toInt: ( spD )=>{
		"use strict";
		// transform SpecIF to internal data;
		// no data of app.cache is modified.
		// It is assumed that spD has passed the schema and consistency check.
//		console.debug('set',simpleClone(spD));
		let names = {};
		switch( spD.specifVersion ) {
			case '0.10.7':
				return null;
			case '0.10.2':
			case '0.10.3':
				names.rClasses = 'resourceTypes';
				names.sClasses = 'statementTypes';
				names.hClasses = 'hierarchyTypes';
				names.pClasses = 'propertyTypes';
				names.subClasses = 'subjectTypes';
				names.objClasses = 'objectTypes';
				names.rClass = 'resourceType';
				names.sClass = 'statementType';
				names.hClass = 'hierarchyType';
				names.pClass = 'propertyType';
				break;
			case '0.10.4':
			case '0.10.5':
			case '0.10.6':
			case '0.11.2':
				names.hClasses = 'hierarchyClasses';
				names.hClass = 'class';
				// no break
			default:
				names.rClasses = 'resourceClasses';
				names.sClasses = 'statementClasses';
				names.pClasses = 'propertyClasses';
				names.subClasses = 'subjectClasses';
				names.objClasses = 'objectClasses';
				names.rClass = 'class';
				names.sClass = 'class';
				names.pClass = 'class'
		};
		if( spD.specifVersion ) {
				// for all versions <1.0:
				names.frct = 'accuracy';
				names.minI = 'min';
				names.maxI = 'max'
		} else {
				// starting SpecIF v1.0:
				names.frct = 'fractionDigits';
				names.minI = 'minInclusive';
				names.maxI = 'maxInclusive'
		};

		let iD = {};
		try {
			iD.dataTypes = 			forAll( spD.dataTypes, dT2int )
			iD.propertyClasses = 	forAll( spD.propertyClasses, pC2int );	// starting v0.10.6
			iD.resourceClasses = 	forAll( spD[names.rClasses], rC2int );
			iD.statementClasses =	forAll( spD[names.sClasses], sC2int );
			if( names.hClasses )
				iD.resourceClasses = iD.resourceClasses.concat(forAll( spD[names.hClasses], hC2int ));
			iD.resources = 			forAll( spD.resources, r2int );
			iD.statements =			forAll( spD.statements, s2int );
			iD.hierarchies =		forAll( spD.hierarchies, h2int );
			iD.files =				forAll( spD.files, f2int )
		} catch (e) {
			console.error( "Error when importing the project '"+spD.title+"'" );
			message.show( i18n.phrase( 'MsgImportFailed', spD.title ), {severity:'danger'} );
			return
		};

		// header information provided only in case of project creation, but not in case of project update:
		if( spD.id ) iD.id = spD.id;
		if( spD.title ) iD.title = spD.title;
		if( spD.description ) iD.description = spD.description;
		if( spD.generator ) iD.generator = spD.generator;
		if( spD.generatorVersion ) iD.generatorVersion = spD.generatorVersion;
		if( spD.createdBy ) iD.createdBy = spD.createdBy;
		if( spD.createdAt ) iD.createdAt = spD.createdAt;

//		console.debug('specif.toInt',simpleClone(iD));
		return iD

			// common for all items:
			function i2int( iE ) {
				var oE = {
					id: iE.id,
					changedAt: iE.changedAt
				};
				if( iE.description ) oE.description = cleanValue(iE.description);
				// revision is a number up until v0.10.6 and a string thereafter:
				switch( typeof(iE.revision) ) {
				/*	case 'undefined':
						break; */
					case 'number':
						oE.revision = iE.revision.toString();	// for <v0.10.8
						break;
					case 'string':
						oE.revision = iE.revision
				};
				if( iE.replaces ) oE.replaces = iE.replaces;
				if( iE.changedBy ) oE.changedBy = iE.changedBy;
				if( iE.createdAt ) oE.createdAt = iE.createdAt;
				if( iE.createdBy ) oE.createdBy = iE.createdBy;
//				console.debug('item 2int',iE,oE);
				return oE
			}
			// a data type:
			function dT2int( iE ) {
				var oE = i2int( iE );
				oE.title = cleanValue(iE.title);
				oE.type = iE.type;
				switch( iE.type ) {
					case "xs:double":
						oE.fractionDigits = iE[names.frct];
						oE.minInclusive = iE[names.minI];
						oE.maxInclusive = iE[names.maxI];
						break;
					case "xs:integer":
						oE.minInclusive = iE[names.minI];
						oE.maxInclusive = iE[names.maxI];
						break;
					case "xhtml":
					case "xs:string":
						if( typeof(iE.maxLength)=='number' )
							oE.maxLength = iE.maxLength;
						break;
					case "xs:enumeration":
						if( iE.values )
							oE.values = forAll( iE.values, (v)=>{
								// 'v.title' until v0.10.6, 'v.value' thereafter;
								// 'v.value' can be a string or a multilanguage object.
								return {
									id: v.id,
									value: typeof(v.value)=='string'||typeof(v.value)=='object'? v.value : v.title  // works also for v.value==''
								}
							})
				};
//				console.debug('dataType 2int',iE);
				return oE
			}
			// a property class:
			function pC2int( iE ) {
				var oE = i2int( iE );
				oE.title = cleanValue(iE.title);	// an input file may have titles which are not from the SpecIF vocabulary.
				if( iE.description ) oE.description = cleanValue(iE.description);
				if( iE.value ) oE.value = cleanValue(iE.value);
				oE.dataType = iE.dataType;
				let dT = itemById( iD.dataTypes, iE.dataType );
//				console.debug('pC2int',iE,dT);
				switch( dT.type ) {
					case 'xs:enumeration':
						// include the property only, if is different from the dataType's:
						if( iE.multiple && !dT.multiple ) oE.multiple = true
						else if( iE.multiple==false && dT.multiple ) oE.multiple = false
				};
//				console.debug('propClass 2int',iE,oE);
				return oE
			}
			// common for all instance classes:
			function aC2int( iE ) {
				var oE = i2int( iE );
				oE.title = cleanValue(iE.title);
				if( iE['extends'] ) oE._extends = iE['extends'];	// 'extends' is a reserved word starting with ES5
				if( iE.icon ) oE.icon = iE.icon;
				if( iE.creation ) oE.instantiation = iE.creation;	// deprecated, for compatibility
				if( iE.instantiation ) oE.instantiation = iE.instantiation;
				if( oE.instantiation ) 	{
					let idx = oE.instantiation.indexOf('manual');	// deprecated
					if( idx>-1 ) oE.instantiation.splice(idx,1,'user')
				};
				// Up until v0.10.5, the pClasses themself are listed, starting v0.10.6 their ids are listed as a string.
				if( Array.isArray(iE[names.pClasses]) && iE[names.pClasses].length>0 )
					if( typeof(iE[names.pClasses][0])=='string' )
						// copy the list of pClasses' ids:
						oE.propertyClasses = iE.propertyClasses
					else {
						// internally, the pClasses are stored like in v0.10.6.
						oE.propertyClasses = [];
						iE[names.pClasses].forEach( (e)=>{
							// Store the pClasses at the top level:
							iD.propertyClasses.push(pC2int(e));
							// Add to a list with pClass' ids, here:
							oE.propertyClasses.push(e.id)
						})
					}
				else
					oE.propertyClasses = [];
//				console.debug('anyClass 2int',iE,oE);
				return oE
			}
			// a resource class:
			function rC2int( iE ) {
				var oE = aC2int( iE );

				// If "iE.isHeading" is defined, use it:
				if( typeof(iE.isHeading)=='boolean' ) {
					oE.isHeading = iE.isHeading;
					return oE
				};
				// else: take care of older data without "isHeading":
				if( iE.title=='SpecIF:Heading' ) {
					oE.isHeading = true;
					return oE
				};
				// else: look for a property class being configured in CONFIG.headingProperties
				let pC;
				for( var a=oE.propertyClasses.length-1;a>-1;a-- ) {
					pC = oE.propertyClasses[a];
					// look up propertyClass starting v0.101.6:
					if( typeof(pC)=='string' ) pC = itemById(iD.propertyClasses, pC);
					if( CONFIG.headingProperties.indexOf( pC.title )>-1 ) {
						oE.isHeading = true;
						break
					}
				};
//				console.debug('resourceClass 2int',iE,oE);
				return oE
			}
			// a statementClass:
			function sC2int( iE ) {
				var oE = aC2int( iE );
				if( iE.isUndirected ) oE.isUndirected = iE.isUndirected;
				if( iE[names.subClasses] ) oE.subjectClasses = iE[names.subClasses];
				if( iE[names.objClasses] ) oE.objectClasses = iE[names.objClasses];
//				console.debug('statementClass 2int',iE,oE);
				return oE
			}
			// a hierarchyClass:
			function hC2int( iE ) {
				// hierarchyClasses (used up until v0.10.6) are stored as resourceClasses,
				// later on, the hierarchy-roots will be stored as resources referenced by a node:
				var oE = aC2int( iE );
				oE.isHeading = true;
//				console.debug('hierarchyClass 2int',iE,oE);
				return oE
			}
			// a property:
			function p2int( iE ) {
				var	oE = {
						// no id
						class: iE[names.pClass]
					};
				if( iE.title ) oE.title = cleanValue(iE.title);
				if( iE.description ) oE.description = cleanValue(iE.description);

				// According to the schema, all property values are represented by a string
				// and internally they are stored as string as well to avoid inaccuracies
				// by multiple transformations:
				oE.value = cleanValue(iE.value);
				// properties do not have their own revision and change info
//				console.debug('propValue 2int',iE,pT,oE);
				return oE
			}
			// common for all instances:
			function a2int( iE ) {
				var oE = i2int( iE );
				// resources must have a title, but statements may come without:
				if( iE.title )
					oE.title = cleanValue(iE.title);
				if( iE.properties && iE.properties.length>0 )
					oE.properties = forAll( iE.properties, p2int );
//				console.debug('a2int',iE,simpleClone(oE));
				return oE
			}
			// a resource:
			function r2int( iE ) {
				var oE = a2int( iE );
				oE['class'] = iE[names.rClass];
//				console.debug('resource 2int',iE,simpleClone(oE));
				return oE
			}
			// a statement:
			function s2int( iE ) {
				var oE = a2int( iE );
				oE['class'] = iE[names.sClass];
				// SpecIF allows subjects and objects with id alone or with  a key (id+revision):
				// keep original and normalize to id+revision for display:
				if( iE.isUndirected ) oE.isUndirected = iE.isUndirected;
				oE.subject = iE.subject;
				oE.object = iE.object;

				// special feature to import statements to complete,
				// used for example by the XLS or ReqIF import:
				if( iE.subjectToFind ) oE.subjectToFind = iE.subjectToFind;
				if( iE.objectToFind ) oE.objectToFind = iE.objectToFind;
//				console.debug('statement 2int',iE,oE);
				return oE
			}
			// a hierarchy:
			function h2int( eH ) {
				// the properties are stored with a resource, while the hierarchy is stored as a node with reference to that resource:
				if( names.hClasses ) {
					// up until v0.10.6, transform hierarchy root to a regular resource:
					var iR = a2int( eH ),
					//  ... and add a link to the hierarchy:
						iH = {
							id: 'N-'+iR.id,
							resource: iR.id,
							changedAt: eH.changedAt
						};
					iR['class'] = eH[names.hClass];
					iD.resources.push(iR);

					if(eH.revision) iH.revision = eH.revision.toString()
				} else {
					// starting v0.10.8:
					var iH = i2int( eH );
					iH.resource = eH.resource
				};

				// SpecIF allows resource references with id alone or with  a key (id+revision):
				iH.nodes = forAll( eH.nodes, n2int );
//				console.debug('hierarchy 2int',eH,iH);
				return iH

				// a hierarchy node:
				function n2int( eN ) {
					switch( typeof(eN.revision) ) {
						case 'number':
							eN.revision = eN.revision.toString()
					};
					forAll( eN.nodes, n2int );
					return eN
				}
			}
			// a file:
			function f2int( iF ) {
				var oF = i2int( iF );
				oF.title = iF.title? iF.title.replace('\\','/') : iF.id;
				// store the blob and it's type:
				if( iF.blob ) {
					oF.type = iF.blob.type || iF.type || attachment2mediaType( iF.title );
					oF.blob = iF.blob
				};
				return oF
			}
	},
	toExt: ( iD, opts )=>{
		"use strict";
		// transform iD (data in internal data format) to SpecIF:
	/*	if( opts ) {
			if( typeof(opts.lookupTitles)!='boolean' ) opts.lookupTitles = true;
			if( typeof(opts.targetLanguage)!='string' ) opts.targetLanguage = browser.language
		} else {
			opts = {
				lookupTitles: true,
				targetLanguage: browser.language
			}
		};  */
		// if opts.targetLanguage has no value, all available languages are kept.

//		console.debug('toExt', iD, opts );
		// transform internal data to SpecIF:
		var spD = {
				id: iD.id,
				title: languageValueOf( iD.title, opts ),
				$schema: 'https://specif.de/v'+app.specifVersion+'/schema.json',
				generator: app.title,
				generatorVersion: app.version
			},
			names = {
				// starting SpecIF v1.0:
				frct: 'fractionDigits',
				minI: 'minInclusive',
				maxI: 'maxInclusive'
			};

		if( iD.description ) spD.description = languageValueOf( iD.description, opts );
		spD.rights = {
			title: "Creative Commons 4.0 CC BY-SA",
			type: "dcterms:rights",
			url: "https://creativecommons.org/licenses/by-sa/4.0/"
		};
		spD.changedAt = new Date().toISOString();
		if( app.me && app.me.email ) {
			spD.createdBy = {
				familyName: app.me.lastName,
				givenName: app.me.firstName,
				email: {type:"text/html",value:app.me.email}
			};
			if( app.me.organization )
				spD.createdBy.org = {organizationName: app.me.organization}
		} else {
			if( iD.createdBy && iD.createdBy.email && iD.createdBy.email.value )  {
				spD.createdBy = {
					familyName: iD.createdBy.familyName,
					givenName: iD.createdBy.givenName,
					email: {type:"text/html",value:iD.createdBy.email.value}
				};
				if( iD.createdBy.org && iD.createdBy.org.organizationName )
					spD.createdBy.org = iD.createdBy.org
			}
			// else: don't add createdBy without data
		};
		if( iD.dataTypes && iD.dataTypes.length>0 )
			spD.dataTypes = forAll( iD.dataTypes, dT2ext );
		if( iD.propertyClasses && iD.propertyClasses.length>0 )
			spD.propertyClasses = forAll( iD.propertyClasses, pC2ext );
		spD.resourceClasses = forAll( iD.resourceClasses, rC2ext );
		spD.statementClasses = forAll( iD.statementClasses, sC2ext );
		spD.resources = forAll( (opts.allResources? iD.resources : collectResourcesByHierarchy( iD )), r2ext );
		spD.statements = forAll( iD.statements, s2ext );
		spD.hierarchies = forAll( iD.hierarchies, h2ext );
		if( iD.files && iD.files.length>0 )
			spD.files = forAll( iD.files, f2ext );
		// ToDo: schema and consistency check (if we want to detect any programming errors)
//		console.debug('specif.get exit',spD);
		return spD

			// common for all items:
			function i2ext( iE ) {
				var oE = {
					id: iE.id,
					changedAt: iE.changedAt
				};
				// most items must have a title, but statements may come without:
				if( iE.title ) oE.title = titleOf( iE, opts );
				if( iE.description ) oE.description = languageValueOf( iE.description, opts );
				if( iE.revision ) oE.revision = iE.revision;
				if( iE.replaces ) oE.replaces = iE.replaces;
				if( iE.changedBy ) oE.changedBy = iE.changedBy;
				if( iE.createdAt ) oE.createdAt = iE.createdAt;
				if( iE.createdBy ) oE.createdBy = iE.createdBy;
				return oE
			}
			// a data type:
			function dT2ext( iE ) {
				var oE = i2ext( iE );
				oE.type = iE.type;
				switch( iE.type ) {
					case "xs:double":
						if( iE.fractionDigits ) oE[names.frct] = iE.fractionDigits;
					case "xs:integer":
						if( iE.minInclusive ) oE[names.minI] = iE.minInclusive;
						if( iE.maxInclusive ) oE[names.maxI] = iE.maxInclusive;
						break;
					case "xhtml":
					case "xs:string":
						if( iE.maxLength ) oE.maxLength = iE.maxLength;
						break;
					case "xs:enumeration":
						if( opts.targetLanguage )
							// reduce to the language specified:
							oE.values = forAll( iE.values, (val)=>{ return {id:val.id,value:languageValueOf(val.value,opts)} })
						else
							oE.values = iE.values
				};
				return oE
			}
			// a property class:
			function pC2ext( iE ) {
				var oE = i2ext( iE );
				if( iE.value ) oE.value = iE.value;  // a default value
				oE.dataType = iE.dataType;
				let dT = itemById( iD.dataTypes, iE.dataType );
				switch( dT.type ) {
					case 'xs:enumeration':
						// With SpecIF, he 'multiple' property should be defined at dataType level
						// and can be overridden at propertyType level.
						// 	dT.multiple 	aTs.multiple 	aTs.multiple	effect
						// ---------------------------------------------------------
						//	undefined		undefined 		undefined		false
						//	false			undefined		undefined		false
						//	true			undefined		undefined		true
						//	undefined		false			undefined		false
						//	false			false			undefined		false
						//	true 			false			false			false
						//	undefined		true 			true			true
						//	false			true 			true			true
						//	true 			true 			undefined		true
						// Include the property only, if is different from the dataType's:
						if( iE.multiple && !dT.multiple ) oE.multiple = true
						else if( iE.multiple==false && dT.multiple ) oE.multiple = false
				};
				return oE
			}
			// common for all instance classes:
			function aC2ext( iE ) {
				var oE = i2ext( iE );
				if( iE.icon ) oE.icon = iE.icon;
				if( iE.instantiation ) oE.instantiation = iE.instantiation;
				if( iE._extends ) oE['extends'] = iE._extends;
				if( iE.propertyClasses.length>0 ) oE.propertyClasses = iE.propertyClasses;
				return oE
			}
			// a resource class:
			function rC2ext( iE ) {
				var oE = aC2ext( iE );
				// Include "isHeading" in SpecIF only if true:
				if( iE.isHeading ) oE.isHeading = true;
				return oE
			}
			// a statement class:
			function sC2ext( iE ) {
				var oE = aC2ext( iE );
				if( iE.isUndirected ) oE.isUndirected = iE.isUndirected;
				if( iE.subjectClasses && iE.subjectClasses.length>0 ) oE.subjectClasses = iE.subjectClasses;
				if( iE.objectClasses && iE.objectClasses.length>0 ) oE.objectClasses = iE.objectClasses;
				return oE
			}
			// a property:
			function p2ext( iE ) {
				if( !iE.value ) return;	// skip empty properties
				var oE = {
					// no id
					class:  iE['class']
				};
				if( iE.title ) oE.title = titleOf( iE, opts );
				if( iE.description ) oE.description = languageValueOf( iE.description, opts );

				// According to the schema, all property values are represented by a string
				// and we want to store them as string to avoid inaccuracies by multiple transformations:
				if( opts.targetLanguage ) {
					// reduce to the selected language; is used for generation of human readable documents
					// or for formats not supporting multiple languages:
					let dT = dataTypeOf( iD, iE['class'] );
					switch( dT.type ) {
						case 'xs:string':
						case 'xhtml':
							if( opts.targetLanguage ) {
								if( CONFIG.titleProperties.indexOf( iE.title )>-1
									|| CONFIG.headingProperties.indexOf( iE.title )>-1 )
									// if it is a title, remove all formatting:
									oE.value = languageValueOf( iE.value, opts ).stripHTML();
								else
									// otherwise transform to HTML, if possible;
									// especially for publication, for example using WORD format:
									oE.value = makeHTML( languageValueOf( iE.value, opts ), opts )
								
	//							console.debug('p2ext',iE,languageValueOf( iE.value, opts ),oE.value);
								break
							}
							// else: no break - return the original value
						default:
							//	in case of 'xs:enumeration', 
							//  an id of the dataType's value is given, so it can be taken directly:
							oE.value = iE.value
					}
				} else {
					// for SpecIF export, keep full data structure:
					oE.value = iE.value
				};
				// properties do not have their own revision and change info; the parent's apply.
				return oE
			}
			// common for all instances:
			function a2ext( iE ) {
				var oE = i2ext( iE );
//				console.debug('a2ext',iE,opts);
				// resources and hierarchies usually have individual titles, and so we will not lookup:
				oE['class'] = iE['class'];
				if( iE.alternativeIds ) oE.alternativeIds = iE.alternativeIds;
				if( iE.properties && iE.properties.length>0 ) oE.properties = forAll( iE.properties, p2ext );
				return oE;
			}
			// a resource:
			function r2ext( iE ) {
				var oE = a2ext( iE );
//				console.debug('resource 2int',iE,oE);
				return oE;
			}
			// a statement:
			function s2ext( iE ) {
//				console.debug('statement2ext',iE.title);
				if( CONFIG.hiddenStatements.indexOf( iE.title )>-1 	 // do not export invisible statements
					|| !iE.subject || itemIdOf(iE.subject)==CONFIG.placeholder // ... or statements with an open end
					|| indexById( spD.resources, itemIdOf(iE.subject) )<0    // ... or statements referencing absent resources
					|| !iE.object || itemIdOf(iE.object)==CONFIG.placeholder
					|| indexById( spD.resources, itemIdOf(iE.object) )<0 ) return;

				var oE = a2ext( iE );
				// The statements usually do use a vocabulary item (and not have an individual title),
				// so we lookup, if so desired, e.g. when exporting to ePub:
				// ToDo: Take the title from statement properties, if provided (similarly to resources).

				if( iE.isUndirected ) oE.isUndirected = iE.isUndirected;
				// for the time being, multiple revisions are not supported:
				if( opts.revisionDate ) {
					// supply only the id, but not a key:
					oE.subject = itemIdOf(iE.subject);
					oE.object = itemIdOf(iE.object)
				} else {
					// supply key or id:
					oE.subject = iE.subject;
					oE.object = iE.object
				};
				return oE;
			}
			// a hierarchy node:
			function n2ext( iN ) {
//				console.debug( 'n2ext', iN );
				// just take the non-redundant properties (omit 'title', for example):
				let eN = {
					id: iN.id,
					changedAt: iN.changedAt
				};
				// for the time being, multiple revisions are not supported:
				if( opts.revisionDate ) {
					// supply only the id, but not a key:
					eN.resource = itemIdOf(iN.resource)
				} else {
					// supply key or id:
					eN.resource = iN.resource
				};
				if( iN.nodes && iN.nodes.length>0 )
					eN.nodes = forAll(iN.nodes,n2ext);
				if( iN.revision ) eN.revision = iN.revision;
				return eN
			}
			// a hierarchy:
			function h2ext( iH ) {
				return n2ext(iH)
			}
			// a file:
			function f2ext( iF ) {
				var eF = {
					id: iF.id,  // is the distinguishing/relative part of the URL
					title: iF.title,
					type: iF.type
				};
				if( iF.blob ) eF.blob = iF.blob;
				if( iF.revision ) eF.revision = iF.revision;
				eF.changedAt = iF.changedAt;
				if( iF.changedBy ) eF.changedBy = iF.changedBy;
	//			if( iF.createdAt ) eF.createdAt = iF.createdAt;
	//			if( iF.createdBy ) eF.createdBy = iF.createdBy;
				return eF
			}
	}
}
	function itemIdOf( key ) {
		// Return the id of the referenced item; the key can be
		// - a string with the requested id
		// - an pbject with id and a revision
		return key.id || key
	}
/*
	function keyOf( item ) {
		// Normalize the identification including revision:
		switch( typeof(item) ) {
			case "object": return item;
			case "string": return {id: item, revision: "0"};
			default: return null // programming error
		}
	}
*/
function isReferencedByHierarchy( rId, H ) {
	// checks whether a resource is referenced by the hierarchy:
	// ToDo: make it work with revisions.
	if( !H ) H = app.cache.selectedProject.data.hierarchies;
	return iterateNodes( H, (nd)=>{ return nd.resource!=rId } )
}
function collectResourcesByHierarchy( prj, H ) {
	// collect all resources referenced by the given hierarchy:
	if( !prj ) prj = app.cache.selectedProject.data;
	if( !H ) H = prj.hierarchies;
	var rL=[];
	iterateNodes( H, (nd)=>{ cacheE( rL, itemById(prj.resources,itemIdOf(nd.resource)) ); return true } );
	return rL
}
function dataTypeOf( prj, pCid ) {
	// given a propertyClass id, return it's dataType:
	if( typeof(pCid)=='string' && pCid.length>0 )
		return itemById( prj.dataTypes, itemById( prj.propertyClasses, pCid ).dataType )
		//     |                        get class
		//	   get dataType
	// else:
	// may happen, if a resource does not have any properties and it's title or description is being used:
	return {type: 'xs:string'} // by default
}
function enumValueOf( dT, val, opts ) {
	// for a property value of type ENUMERATION, create a comma-separated-value string of titles;
	// for all others, return the value as is:
//	console.debug('enumValueOf',dT,val,opts);
	if( dT.type!='xs:enumeration' || !val ) return val;
	let ct = '',
		eV,
	//	st = CONFIG.stereotypeProperties.indexOf(prp.title)>-1,
		vL = val.split(',');  // in case of a multi-valued ENUMERATION, val may carry comma-separated value-IDs
//	console.debug('enumValueOf',dT,val,vL,opts);
	vL.forEach( (v,i)=>{
	//	if( !v ) return;
		eV = languageValueOf( itemById(dT.values,v).value, opts );
		if( opts&&opts.lookupValues )
			eV = i18n.lookup(eV);
		// If 'eV' is an id, replace it by the corresponding value, otherwise don't change:
		// For example, when an object is from a search hitlist or from a revision list,
		// the value ids of an ENUMERATION have already been replaced by the corresponding titles.
		// Add 'double-angle quotation' in case of stereotype values.
	//	if( eV ) ct += (i==0?'':', ')+(st?('&#x00ab;'+eV+'&#x00bb;'):eV)
		if( eV ) ct += (i==0?'':', ')+eV
		else ct += (i==0?'':', ')+v
	});
	return ct
}
function multipleChoice( pC, prj ) {
	prj = prj || app.cache.selectedProject.data;
	// return 'true', if either the property type specifies it, or by default its datatype;
	// if defined, the property type's value supersedes the datatype's value:
	return ( typeof(pC.multiple)=='boolean'?pC.multiple : !!itemById(prj.dataTypes,pC.dataType).multiple )
	// Note: specif-check applies the same logic in function 'checkPropValues(..)'
}
function visibleIdOf( r, prj ) {
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
function titleIdx( pL, prj ) {
	// Find the index of the property to be used as title.
	// The result depends on the current user - only the properties with read permission are taken into consideration.
	// This works for title strings and multi-language title objects.

/*	// Note that the logic has been simplified.
	// Up until revision 0.92.34, the title property which was listed first in CONFIG.XXAttributes was chosen.
		var idx = -1;
		for( var c=0, C=CONFIG.headingProperties.length; c<C; c++) {  // iterate configuration list; leading entry has priority
			idx = indexByTitle( pL, CONFIG.headingProperties[c] );
			if( idx>-1 ) return idx
		};
	// Now, the first property which is found in the respective list is chosen.
	// ToDo: Check, if the results differ in practice ...
*/
	if( pL ) {
		if( !prj ) prj = app.cache.selectedProject.data;
		let pt;
		for( var a=0,A=pL.length;a<A;a++ ) {
			pt = vocabulary.property.specif( propTitleOf(pL[a],prj) );
			// First, check the configured headings:
			if( CONFIG.headingProperties.indexOf( pt )>-1 ) return a;
			// If nothing has been found, check the configured titles:
			if( CONFIG.titleProperties.indexOf( pt )>-1 ) return a
		}
	};
	return -1
}
function elementTitleOf( el, opts, dta ) {
	// Get the title of a resource or a statement
	// ... from the properties or a replacement value in case of default:
	if( typeof(el)!='object' ) return;
	let pt = titleFromProperties( el.properties, opts ) || titleOf( el, opts );
	// if it is a statement and does not have a title of it's own, take the class' title:
// 	console.debug('elementTitleOf',el,opts,pt);

	// In case of a resource, we never want to lookup a title,
	// however in case of a statement, we do:
	if( el.subject ) {
		// it is a statement
		if( !pt && dta )
			pt = staClassTitleOf( el, dta, opts )
	} else {
		// it is a resource
		if( opts && opts.addIcon && CONFIG.addIconToInstance && dta && pt )
			pt = pt.addIcon( itemById( dta.resourceClasses, el['class'] ).icon )
	};
//	return opts.targetLanguage? pt.unescapeHTMLEntities() : pt
	return typeof(pt)=='string'? pt.stripHTML() : pt

	function titleFromProperties( pL, opts ) {
	//	if( !pL ) return;
		// look for a property serving as title:
		let idx = titleIdx( pL );
		if( idx>-1 ) {  // found!
			// Remove all formatting for the title, as the app's format shall prevail.
			// Before, remove all marked deletions (as prepared be diffmatchpatch) explicitly with the contained text.
			// ToDo: Check, whether this is at all called in a context where deletions and insertions are marked ..
			// (also, change the regex with 'greedy' behavior allowing HTML-tags between deletion marks).
		//	if( modules.ready.indexOf( 'diff' )>-1 )
		//		return pL[idx].value.replace(/<del[^<]+<\/del>/g,'').stripHTML()
			// For now, let's try without replacements; so far this function is called before the filters are applied,
			// perhaps this needs to be reconsidered a again once the revisions list is featured, again:
//			console.debug('titleFromProperties', idx, pL[idx], op, languageValueOf( pL[idx].value,op ) );
			return languageValueOf( pL[idx].value, opts )
		};
	//	return undefined
	}
}
function resClassTitleOf( e, prj, opts ) {
	return titleOf( itemById( prj.resourceClasses, e['class'] ), opts )
}
function staClassTitleOf( e, prj, opts ) {
	return titleOf( itemById( prj.statementClasses, e['class'] ), opts )
}
function propTitleOf( prp, prj ) {
	// get the title of a property as defined by itself or it's class:
	return prp.title || itemById(prj.propertyClasses,prp['class']).title
}
function titleOf( item, opts ) {
	// Pick up the native title of any item;
	// look for a translation, take it as is or take the id by default.
	// It can be a title string or a multi-language title object.
	let ti = languageValueOf( item.title, opts );
//	console.debug('titleOf',item,opts,ti);
	if( ti ) return opts&&opts.lookupTitles? i18n.lookup(ti) : ti
//	return undefined
}
function languageValueOf( val, opts ) {
	// Get the value according to a specified target language .. or the first value in the list by default.
	// 'val' can be a string or a multi-language object;
	// if targetLanguage is not defined, keep all language options:
	if( typeof(val)=='string' || !(opts&&opts.targetLanguage) ) return val;
	// The value may be undefined:
	if( val==undefined ) return;
	if( !Array.isArray(val) ) {
		// neither a strring nor an array is a programming error:
		console.error('Invalid value: ',val);
		return null
	};

	let lVs = val.filter( (v)=>{
		return opts.targetLanguage == v.language
	});
	// lVs should have none or one elements; any additional ones are simply ignored:
	if( lVs.length>0 ) return lVs[0].text;

	// next try a little less stringently:
	lVs = val.filter( (v)=>{
		return opts.targetLanguage.slice(0,2) == v.language.slice(0,2)
	});
	// lVs should have none or one elements; any additional ones are simply ignored:
	if( lVs.length>0 ) return lVs[0].text;

	// As a final resourt take the first element in the original list of values:
	return val[0].text
}
/* function typeOf( el ) {
	let tP = itemByTitle(el.properties,CONFIG.propClassType);
	// ToDo: .. or the title of the property class (dcterms:title) if the property title is undefined
	if( tP ) return tP.value
} */
function hasContent( pV ) {
	// must be a string with the value of the selected language.
	if( typeof(pV)!="string" ) return false;
	return pV.stripHTML().length>0
		|| RE.tagSingleObject.test(pV) // covers nested object tags, as well
		|| RE.tagImg.test(pV)
		|| RE.tagA.test(pV)
}
function iterateNodes( tree, eFn, lFn ) {
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
			cont = !iterateNodes( tree[i], eFn, lFn )
		};
		if( typeof(lFn)=='function' ) lFn( tree )
	} else {
		cont = eFn( tree );
		if( cont && tree.nodes ) {
			cont = !iterateNodes( tree.nodes, eFn, lFn )
		}
	};
	return !cont
}
function createProp( pC, pCid ) {
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
	}
}
function propByTitle(dta,itm,pN) {
	// Return the property of itm with title pN.
	// If it doesn't exist, create it,
	// if there is no property with that title, return undefined.

	// Look for the propertyClasses pCs of the item's class iC:
	// ToDo: Add statementClasses, as soon as needed.
	var iC = itemById( dta.resourceClasses, itm['class'] ),
	//	pCs = dta.propertyClasses.filter( (pC)=>{ return iC.propertyClasses.indexOf(pC.id)>-1 } ),
		pC,prp;
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
		}
	};
//	return undefined
}
function valByTitle(dta,itm,pN) {
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
function classifyProps( el, prj ) {
	"use strict";
	// add missing (empty) properties and classify properties into title, descriptions and other;
	// for resources and statements.
	// Note that here 'class' is the class object itself ... and not the id as is the case with SpecIF.
	if( !prj ) prj = app.cache.selectedProject.data;
	var cP = {
			id: el.id,
		//	title: undefined,  .. assigned further down
			class: itemById( prj.resourceClasses, el['class']),  // the object, not the id !
			revision: el.revision,
			descriptions: [],
			// create a new list by copying the elements (do not copy the list ;-):
			other: normalizeProps( el, prj );
		};
	cP.isHeading = cP['class'].isHeading || CONFIG.headingProperties.indexOf(cP.title)>-1;
	if( el.order ) cP.order = el.order;
	cP.changedAt = el.changedAt;
	if( el.revision ) cP.revision = el.revision;
	if( el.replaces ) cP.replaces = el.replaces;
	if( el.changedBy ) cP.changedBy = el.changedBy;
	if( el.createdAt ) cP.createdAt = el.createdAt;
	if( el.createdBy ) cP.createdBy = el.createdBy;

	// Now, all properties are listed in cP.other;
	// in the following, the properties used as title and description will be identified
	// and removed from cP.other.
	// ToDo: Hide hidden properties: CONFIG.hiddenProperties

	// a) Find and set the configured title:
	let a = titleIdx( cP.other, prj );
	if( a>-1 ) {  // found!
		cP.title = cP.other[a];
		// remove title from other:
		cP.other.splice(a,1);
		
		// Special case:
		// - if the current instance does not have a title property
		// - but it's class defines one,
		// the title would get lost.
		// Thus, the instance title is copied to the title property,
		// which has been newly created by normalizeProps():
		if( !cP.title.value && el.title )
			cP.title.value = el.title;
	};

	// b) Check the configured descriptions:
	// We must iterate backwards, because we alter the list of other.
	// ToDo: use cP.other.filter()
	for( a=cP.other.length-1;a>-1;a-- ) {
		if( CONFIG.descProperties.indexOf( propTitleOf(cP.other[a]), prj )>-1 ) {
			// To keep the original order of the properties, the unshift() method is used.
			cP.descriptions.unshift( cP.other[a] );
			cP.other.splice(a,1)
		};
	};

	// c) In certain cases (SpecIF hierarchy root, comment or ReqIF export), 
	//    there is no title or no description property:
	//    ToDo: If the instance is a statement, a title is optional - don't create if it doesn't exist!
	if( !cP.title )
		cP.title = {title: CONFIG.propClassTitle, value: el.title || ''};
	if( cP.descriptions.length<1 )
		cP.descriptions.push( {title: CONFIG.propClassDesc, value: el.description || ''} );
//	console.debug( 'classifyProps 2', simpleClone(cP) );
	return cP;

	function normalizeProps( el, dta ) {
		// el: instance (resource or statement)
		// Create a list of properties in the sequence of propertyClasses of the respective class.
		// Use those provided by the instance's properties and fill in missing ones with default (no) values.
		// Assumption: Property classes are unique!

		// check uniqueness of property classes:
		if( el.properties ) {
			let cL=[], pC;
			el.properties.forEach( (p)=>{
				pC = p['class'];
				if( cL.indexOf(pC)>-1 )
					console.warn('The property class '+pC+' of element '+el.id+' is occurring more than once.');
				cL.push( pC )
			})
		};

		let p,pCs,nL=[],
			// iCs: instance class list (resourceClasses or statementClasses),
			// the existence of subject (or object) let's us recognize that it is a statement:
			iCs = el.subject? dta.statementClasses : dta.resourceClasses,
			iC = itemById(iCs,el['class']);
		// build a list of propertyClass identifiers including the extended class':
		pCs = iC._extends? itemById( iCs, iC._extends ).propertyClasses||[] : [];
		pCs = pCs.concat( itemById( iCs, el['class'] ).propertyClasses||[] );
		// add the properties in sequence of the propertyClass identifiers:
		pCs.forEach( (pCid)=>{
			// the following matching will fail, if the property classes are not unique:
			p = simpleClone( itemBy( el.properties, 'class', pCid ) )
				|| createProp(dta.propertyClasses,pCid);
			if( p ) {
				// by default, use the propertyClass' title:
				// (dta.propertyClasses contains all propertyClasses of all resource/statement classes)
				// An input data-set may have titles which are not from the SpecIF vocabulary;
				// replace the result with a current vocabulary term:
				p.title = vocabulary.property.specif( propTitleOf(p,dta) );
				nL.push( p )
			}
		});
//		console.debug('normalizeProps result',simpleClone(nL));
		return nL // normalized property list
	}
}
