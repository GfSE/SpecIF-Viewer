///////////////////////////////
/*	Cache Library for SpecIF data.
	Dependencies: jQuery
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de            

	Naming:
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
}, function(self) {
	"use strict";
	// Construct a representative of the selected project with cached data:
	// ToDo: enforce CONFIG.maxObjToCacheCount
/*	var autoLoadId,				// max 1 autoLoad chain
		autoLoadCb;				// callback function when the cache has been updated  */
	self.cacheInstances = true;
	
	// initialization is at the end of this constructor.
	self.init = function() {
		// initialize/clear all variables:
		self.projects = [];
		self.selectedProject = undefined;
	//	autoLoadId = undefined;  // stop any autoLoad chain
	//	autoLoadCb = undefined;
		return true
	};
	self.create = function(p) {
		// in this implementation, delete existing projects to save memory space:
//		console.debug( 'cache.create', self );
		self.projects.length = 0;
		// append a project to the list:
		self.projects.push( new Project() );
		self.selectedProject = self.projects[self.projects.length-1];
		return self.selectedProject.create( p )
	};
/*	// Periodically update the selected project with the current server state in a multi-user context:
	self.startAutoLoad = function( cb ) {
//		if( !self.cacheInstances ) return;
//		console.info( 'startAutoLoad' );
		if( typeof(cb)=="function" ) { autoLoadCb = cb };
		autoLoadId = genID( 'aU-' );
		// get all resources from the server to fill the cache:
		setTimeout( function() { autoLoad(autoLoadId) }, 600 )  // start a little later ...			
	};
	self.stopAutoLoad = function() {
//		console.info('stopAutoLoad');
		autoLoadId = null;
		loading = false
	};  
	self.loadInstances = function( cb ) {
		// for the time being - until the synchronizing will be implemented:
//		if( !self.cacheInstances ) return;
		// load the instances of the selected hierarchy (spec) into the cache (but not the types):
//		console.debug( 'self.loadInstances', self.selectedHierarchy, cb );
		if( self.selectedHierarchy ) {
			loading = true;  
			// update all resources referenced by the selectedHierarchy:
			loadObjsOf( self.selectedHierarchy )
				.done( function() {			
//					loadRelsOf( self.selectedHierarchy );
					// update the hierarchy (outline).
					// it is done after the resources to reflect any change in the hierarchy made during the loading.
					self.readContent( 'hierarchy', self.selectedHierarchy, true )	// true: reload
						// - call cb to refresh the app:
						.done( function() { 
							if( typeof(cb)=="function" ) cb();
							loading = false
						})
						.fail( function(xhr) { 
							loading = false
						})
				})
				.fail( function(xhr) { 
					loading = false
				})
		}
	};
	self.load = function(opts) {
		var lDO = $.Deferred();

		// load referenced resources and statements ... 
		if( opts.loadObjects ) {
			if( opts.loadAllSpecs ) 
				loadAll( 'resource' )
					.done( function() { 
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
					.done( function() { 
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
	// Constructor for a project containing SpecIF data.
	var self = this,
		loading = false;		// true: data is being gathered from the server.
	self.init = function() {
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
			allClasses: [], 		// common list of all resourceClasses and statementClasses
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
	self.loaded = function() {
		return typeof(self.data.id)=='string' && self.data.id.length>0
	};

	self.create = function( newD, mode ) {
		// create a project, if there is no project with the given id, or replace a project with the same id.
		// (The roles/permissions and the role assignment to users are preserved, when import via ReqIF-file is made)
		// If there is no newD.id, it will be generated by the server.
		if( !newD ) return;
		mode = mode || 'deduplicate';
		var pend=0,
			sDO = $.Deferred();
		if( !newD ) {
			sDO.reject({
				status: 995,
				statusText: i18n.MsgImportFailed
			});
			return sDO
		};
//		console.debug('app.cache.selectedProject.data.create',newD);

		self.abortFlag = false;

		// Create the specified project:
		newD = specif.toInt(newD);	// transform to internal data structure
		
		self.data.id = newD.id;
		self.data.title = newD.title;
		self.data.description = newD.description;
		self.data.generator = newD.generator;
		self.data.generatorVersion = newD.generatorVersion;
		self.data.myRole = i18n.LblRoleProjectAdmin;
	//	self.data.cre = self.data.upd = self.data.del = self.data.exp = app.label!=i18n.LblReader;
		self.data.cre = self.data.upd = self.data.del = app.label!=i18n.LblReader;
		self.data.exp = true;
		// ToDo: should use 

		// Create the project 
		// The project meta-data and each item are created as a separate document in a document database;
		// at the same time the cache is updated.
		sDO.notify(i18n.MsgLoadingTypes,30);
		self.createContent( 'dataType', newD.dataTypes );
		self.createContent( 'propertyClass', newD.propertyClasses );
		self.createContent( 'resourceClass', newD.resourceClasses );
		self.createContent( 'statementClass', newD.statementClasses );
		sDO.notify(i18n.MsgLoadingFiles,40);
		self.createContent( 'file', newD.files );
		sDO.notify(i18n.MsgLoadingObjects,50);
		self.createContent( 'resource', newD.resources );
		sDO.notify(i18n.MsgLoadingRelations,70);
		self.createContent( 'statement', newD.statements );
		sDO.notify(i18n.MsgLoadingHierarchies,90);
		self.createContent( 'hierarchy', newD.hierarchies );
		sDO.notify(i18n.MsgProjectCreated,100);

		self.data.locked = app.label==i18n.LblReader;	
		self.data.createdAt = newD.createdAt;
		self.data.createdBy = newD.createdBy;
		
		hookStatements();
		
		if( mode == 'deduplicate')
			self.deduplicate();	// deduplicate equal items
			// ToDo: Update the server !

//		console.debug('*',self.data.propertyClasses,self.data.resourceClasses);
		sDO.resolve({status:0});
		return sDO
	};
	self.read = function( prj, opts ) { 
		// Assemble the data of the project from all documents in a document database:
		switch( typeof(opts) ) {
			case 'boolean':
				// for backward compatibility:
				opts = {reload: opts, loadAllSpecs: false, loadObjects: false, loadRelations: false};
				break;
			case 'object':
				// normal case (as designed):
//				if( typeof opts.reload!='boolean' ) opts.reload = false;
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
		/*	// ToDo: not just return the cache, but do it stepwise using app.cache.selectedProject.readContent() !
			self.readContent( 'hierarchy', self.data.hierarchies, true )	// reload the hierarchies
				.done( function() { 	
					loadFiles()	// reload the files
						.done( function() { 	
							// load referenced resources and statements ... 
							loadAll( 'resource' )
								.done( function() { 
									loadAll( 'statement' )
										.done( function() { 
											// here we go:
											
										})
										.fail( handleError )
								})
								.fail( handleError )
						})
						.fail( handleError )
				})
				.fail( handleError )  */
		};
		// else
		return null	
	};
/*	self.updateMeta = function( prj ) {
		if( !prj ) return;
		for( var p in prj ) self[p] = prj[p];			// update only the provided properties
		// Update the meta-data (header):
	//	return server.project(self).update()
	};*/
	const types = [{
					name: 'dataType',
					list: 'dataTypes',
					eqFn: eqDT,
					sbFn: substituteDT
				},{ 
					name: 'propertyClass',
					list: 'propertyClasses',
					eqFn: eqPC,
					sbFn: substitutePC
				},{ 
					name: 'resourceClass',
					list: 'resourceClasses',
					eqFn: eqRC,
					sbFn: substituteRC
				},{ 
					name: 'statementClass',
					list: 'statementClasses',
					eqFn: eqSC,
					sbFn: substituteSC
				}];
	function eqDT(r,n) {
		// return true, if reference and new dataType are equal:
		if( r.type!=n.type ) return false;
		switch( r.type ) {
			case 'xs:double':
				if( r.fragmentDigits!=n.fragmentDigits ) return false;
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
		// return true, if reference and new resourceClass are equal:
		return r.title==n.title
			&& eqSCL( r.propertyClasses, n.propertyClasses )
			&& eqSCL( r.subjectClasses, n.subjectClasses )
			&& eqSCL( r.objectClasses, n.objectClasses )
			&& eqSCL( r.instantiation, n.instantiation );
			
		function eqSCL(rL,nL) {
			// return true, if both lists have equal member,
			// in this case we allow also less specified statementClasses
			// (for example, when a statement is created from an Excel sheet):
			if( typeof(nL)==undefined ) return true;
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
	function eqR(dta,r,n) {
		// return true, if reference and new resource are equal:
		// ToDo: Consider, if model-elements are only considered equal, if they have the same type, 
		// i.e. if a property with title CONFIG.propClassType has the same value 
		return r.title==n.title
				&& classTitleOf(dta,r)==classTitleOf(dta,n)
		// Note that the content of the new resource is lost;
		// this is no problem, if the new data is a BPMN model, for example, 
		// which usually have a title and do not carry any description.
	}
	function eqS(r,n) {
		// return true, if reference and new statement are equal:
		// ToDo: Model-elements are only equal, if they have the same type,
		// i.e. a property with title CONFIG.propClassType has the same value
		return r['class']==n['class']
			&& r.subject.id==n.subject.id
			&& r.subject.revision==n.subject.revision
			&& r.object.id==n.object.id
			&& r.object.revision==n.object.revision
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
	function substituteDT(dta,rId,nId) {
		substituteAtt(dta.propertyClasses,'dataType',rId,nId)
	}
	function substitutePC(dta,rId,nId) {
		// For all resourceClasses, substitute new by the original propertyClass:
		substituteLe(dta.resourceClasses,'propertyClasses',rId,nId);
		// Also substitute the resource properties' class:
		dta.resources.forEach( function(res) {
			substituteAtt(res.properties,'class',rId,nId)
		});
		// The same with the statementClasses:
		substituteLe(dta.statementClasses,'propertyClasses',rId,nId);
		dta.statements.forEach( function(sta) {
			substituteAtt(sta.properties,'class',rId,nId)
		})
	}
	function substituteRC(dta,rId,nId) {
		substituteLe(dta.statementClasses,'subjectClasses',rId,nId);
		substituteLe(dta.statementClasses,'objectClasses',rId,nId);
		substituteAtt(dta.resources,'class',rId,nId)
	}
	function substituteSC(dta,rId,nId) {
		substituteAtt(dta.statements,'class',rId,nId)
	}
	function substituteR(prj,r,n,opts) {
		// Substitute resource n by r in all references of n,
		// where r is always an element of self.data.
		// But: Rescue any property of n, if undefined for r.
//		console.debug('substituteR',r,n);
		
		if( opts && opts.rescueProperties ) {
			// 1 Rescue property values, 
			// if the corresponding property of the adopted resource is undefined or empty.
			// 1.1 Looking at the property types, which ones are in common:
			n.properties.forEach( function(nP) { 
				if( hasContent(nP.value) ) {
					// check whether existing resource has similar property;
					// a property is similar, if it has the same title,
					// where the title may be defined with the property class.
					let pT = propTitleOf(prj,nP),
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
		prj.statements.forEach( function(st) {
				if( st.object.id==n.id ) st.object.id = r.id;
				if( st.subject.id==n.id ) st.subject.id = r.id
		});
		// 3 Replace the references in all hierarchies:
		substituteRef(prj.hierarchies,r.id,n.id)
	}
	function substituteAtt(L,attN,rAV,dAV) {
		// replace ids of the duplicate item by the id of the original one;
		// this applies to the attribute 'attN' of each element in the list L:
		if( Array.isArray(L) )
			L.forEach( function(e) { if(e[attN]==dAV) e[attN] = rAV } )
	}
	function substituteLe(L,attN,rAV,dAV) {
		// Replace the duplicate id by the id of the original item;
		// so replace dAV by rAV in the list named 'attN'
		// (for example: in L[i].attN (which is a list as well), replace dAV by rAV):
		let idx;
		if( Array.isArray(L) )
			L.forEach( function(e) { 
				if( !Array.isArray(e[attN]) ) return; 
				idx = e[attN].indexOf(dAV); 
				if( idx>-1 ) e[attN].splice( idx, 1, rAV )
			})
	}
	function substituteRef(L,rId,dId) {
		// For all hierarchies, replace any reference to dId by rId;
		// eliminate double entries in the same folder (together with the children):
		iterateNodes( L, 
				// replace resource id:
				function(nd) { if(nd.resource==dId) {nd.resource=rId}; return true },
				// eliminate duplicates within a folder (assuming that it will not make sense to show the same resource twice in a folder;
				// for example it avoids that the same diagram is shown twice if it has been imported twice:
				function(ndL) { for(var i=ndL.length-1; i>0; i--) { if( indexBy(ndL.slice(0,i),'resource',ndL[i].resource)>-1 ) { ndL.splice(i,1) }}}
		)
	}  
	function hookStatements( dta ) {
		if( typeof(dta)!='object' || !dta.id ) dta = self.data;
		// For all statements with a loose end, hook the resource 
		// specified by title or by a property titled dcterms:identifier:
		dta.statements.forEach( function(st) {
			// Check every statement;
			// it is assumed that only one end is loose:
			if( st.subjectToFind ) {
				// Find the resource with the given title:
				let s = itemByTitle( dta.resources, st.subjectToFind );
//				console.debug('hookStatements subject',s);
				if( s ) {
					st.subject = {id: s.id, revision: 0};
					delete st.subjectToFind;
					return
				}
				// ToDo: Find the resource with a value of property titled dcterms:identifier:
			};
			if( st.objectToFind ) {
				// Find the resource with the given title:
				let o = itemByTitle( dta.resources, st.objectToFind );
//				console.debug('hookStatements object',o);
				if( o ) {
					st.object = {id: o.id, revision: 0};
					delete st.objectToFind;
					return
				}
				// ToDo: Find the resource with a value of property titled dcterms:identifier:
			}
		});
		return dta
	}
	self.deduplicate = function( dta ) {
		// Uses the cache.
		// ToDo: update the server.
		if( typeof(dta)!='object' || !dta.id ) dta = self.data;
//		console.debug('deduplicate',dta);
		let n,r,nR,rR;

		// 1. Deduplicate equal types having different ids;
		// the first of a equivalent pair in the list is considered the reference or original ... and stays,
		// whereas the second in a pair is removed.
		types.forEach( function(ty) {
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
		// 2. Remove duplicate resources:
		// skip last loop, as no duplicates can be found:
		for( n=dta.resources.length-1; n>0; n-- ) {
			for( r=0; r<n; r++ ) {
				// Do it for all model elements, diagrams and folders
				// but exclude process gateways and generated events for optional branches: 
				nR = dta.resources[n];
				rR = dta.resources[r];
//				console.debug( 'duplicate resource ?', rR, nR );
				if( CONFIG.modelElementClasses.concat(CONFIG.diagramClasses).concat(CONFIG.folderClasses).indexOf( classTitleOf(dta,rR) )>-1 
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
		return dta
	};
		function DataTypes(chAt) {
			return [{
				id: "DT-ShortString",
				title: "String ["+CONFIG.textThreshold+"]",
				description: "String with length "+CONFIG.textThreshold,
				type: "xs:string",
				maxLength: CONFIG.textThreshold,
				changedAt: chAt
			},{
				id: "DT-FormattedText",
				title: "XHTML ["+CONFIG.maxStringLength+"]",
				description: "Formatted String with length "+CONFIG.maxStringLength,
				type: "xhtml",
				maxLength: CONFIG.maxStringLength,
				changedAt: chAt 
			}]
		} 
		function PropertyClasses(chAt) {
			return [{
					id: "PC-Name",
					title: "dcterms:title",
					dataType: "DT-ShortString",
					changedAt: chAt
				},{
					id: "PC-Description",
					title: "dcterms:description",
					dataType: "DT-FormattedText",
					changedAt: chAt
				},{
					id: "PC-Type",
					title: "dcterms:type",
					dataType: "DT-ShortString",
					changedAt: chAt
				}]
		}
		function ResourceClasses(chAt) {
			return [{
				id: "RC-Folder",
				title: "SpecIF:Heading",
				description: "Folder with title and text for chapters or descriptive paragraphs.",
				isHeading: true,
				instantiation: ['auto','user'],
				propertyClasses: ["PC-Name","PC-Description","PC-Type"],
				changedAt: chAt
			}]
		}
	self.createProcessesFolder = function( dta ) {	
		if( typeof(dta)!='object' || !dta.id ) dta = self.data;
		// Assumes that the folder objects for the process folder are available
		
		// 1 Find all process folders:
		let dF = [], pL = [], res, pV,
			apx = self.data.id.simpleHash(),
			tim = new Date().toISOString();
//		console.debug('createProcessesFolder',dta.hierarchies);
		iterateNodes( dta.hierarchies, function(nd) {
											// get the referenced resource:
											res = itemById( dta.resources, nd.resource );
											// find the property defining the type:
											pV = valByTitle(dta,res,CONFIG.propClassType);
											if( pV==CONFIG.resClassProcesses ) {
												dF.push( nd );
											};
											// collect all process diagrams:
											if( pV=="SpecIF:BusinessProcess" ) {
												pL.push( nd );
											}; 
											return true  // continue always to the end
										}
		);
//		console.debug('process diagrams',dF,pL);
		if( pL.length>0 ) {
			// 2. Delete any existing process folders,
			self.deleteContent( 'node', dF );

			// Sort the list of process diagrams alphabetically by title:
			if( pL.length>1 )
				pL.sort( function(bim, bam) {
							bim = itemById( dta.resources, bim.resource ).title.toLowerCase();
							bam = itemById( dta.resources, bam.resource ).title.toLowerCase();
							return bim==bam ? 0 : (bim<bam ? -1 : 1) 
				});

			// 3. Create a new combined process folder:
			let processF = {
				specifVersion: 'v1.0',
				dataTypes: DataTypes(tim),
				propertyClasses: PropertyClasses(tim),
				resourceClasses: ResourceClasses(tim),
				resources: Folders(),
				hierarchies: [{
					id: "H-FolderProcesses-" + apx,
					resource: "FolderProcesses-" + apx,
					nodes: pL,
					changedAt: tim
				}]
			};
			self.update( processF, {mode:'adopt'} )
		};
		return;
		
		function Folders() {
			var fL = [{
				id: "FolderProcesses-" + apx,
				class: "RC-Folder",
				title: i18n.lookup(CONFIG.resClassProcesses),
				properties: [{
					class: "PC-Name",
					value: i18n.lookup(CONFIG.resClassProcesses)
				},{
					class: "PC-Type",
					value: CONFIG.resClassProcesses
				}],
				changedAt: tim
			}];
			return fL
		}
	};
	self.createGlossary = function( dta ) {	
		if( typeof(dta)!='object' || !dta.id ) dta = self.data;
		// Assumes that the folder objects for the glossary are available
		
		// 1. Delete any existing glossaries
		// 1.1 Find all Glossary folders:
		let gF = [], res, pV,
			apx = self.data.id.simpleHash(),
			tim = new Date().toISOString();
//		console.debug('createGlossary',dta.hierarchies);
		iterateNodes( dta.hierarchies, function(nd) {
											// get the referenced resource:
											res = itemById( dta.resources, nd.resource );
											// check, whether it is a glossary:
											pV = valByTitle(dta,res,CONFIG.propClassType);
											if( pV==CONFIG.resClassGlossary ) {
												gF.push( nd );
											};
											return true  // continue always to the end
										}
		);
		// 1.2 Delete now:
		self.deleteContent( 'node', gF )

		// 2. Create a new combined glossary:
		let glossary = {
			specifVersion: 'v1.0',
			dataTypes: DataTypes(tim),
			propertyClasses: PropertyClasses(tim),
			resourceClasses: ResourceClasses(tim),
			resources: Folders(),
			hierarchies: NodeList(self.data.resources)
		};
//		console.debug('glossary',glossary);
		self.update( glossary, {mode:'adopt'} )
		return;
		
		function Folders() {
			var fL = [{
				id: "FolderGlossary-" + apx,
				class: "RC-Folder",
				title: i18n.lookup(CONFIG.resClassGlossary),
				properties: [{
					class: "PC-Name",
					value: i18n.lookup(CONFIG.resClassGlossary)
				},{
					class: "PC-Type",
					value: CONFIG.resClassGlossary
				}],
				changedAt: tim
			}];
			// Create a folder resource for every model-element type:
			CONFIG.modelElementClasses.forEach( function (mEl) {
				fL.push({
					id: "Folder-" + mEl.toJsId() + "-" + apx,
					class: "RC-Folder",
					title: i18n.lookup(mEl+'s'),  // just adding the 's' is an ugly quickfix ... that works for now.
					properties: [{
						class: "PC-Name",
						value: i18n.lookup(mEl+'s')
					}],
					changedAt: tim
				})
			});
			return fL
		}
		function NodeList(resL) {
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
			// b. Add Actors, States and Events to the respective folders in alphabetical order.
			// In case of model elements the resource class is distinctive;
			// The title of the resource class indicates the model element type.
			if( resL.length>1 )
				resL.sort( function(bim, bam) {
							bim = bim.title.toLowerCase();
							bam = bam.title.toLowerCase();
							return bim==bam ? 0 : (bim<bam ? -1 : 1) 
				});
			// Create a list tL of equivalence lists per model-element type;
			// we must assume that type adoption/deduplication is not always successful
			// and that there are multiple resourceClasses per model-element type:
			let idx,
				tL = forAll( CONFIG.modelElementClasses, function() { return [] } );
			// Each equivalence list carries the ids of resourceClasses for the give model-element type:
			self.data.resourceClasses.forEach( function(rC) {
													idx = CONFIG.modelElementClasses.indexOf(rC.title);
													if( idx>-1 ) tL[idx].push(rC.id)
												}
			);
//			console.debug('gl tL',gl,tL);
			resL.forEach( function(r) { 
				// Sort resources according to their type:
				for( idx=tL.length-1;idx>-1;idx-- ) {
					if( tL[idx].indexOf( r['class'] )>-1 ) break
				};
//				console.debug('idx',idx);
				if( idx>-1 )
					gl.nodes[idx].nodes.push({
						// ID should be the same when generated multiple times, 
						// but must be different from a potential reference somewhere else.
						id: 'N-' + (r.id + '-gen').simpleHash(),
						resource: r.id,
						changedAt: tim
					})
			});
			return [gl]
		}
	};
	function hasDuplicateId(dta,id) {
		// check whether there is an item with the same id in dta.
		// If so, return the item:
		if( dta.id==id ) return dta;
		let duplId;
		for( var i in dta ) {
			if( Array.isArray( dta[i] ) ) {
				for( var j=dta[i].length-1;j>-1;j-- ) {
					duplId = hasDuplicateId(dta[i][j],id);
					if( duplId ) return duplId
				}
			}	
		};
		return
	}
	// var updateModes = ["adopt","match","extend","ignore"];
	self.update = function( newD, opts ) {	
		newD = specif.toInt(newD);	// transform to internal data structure
		var uDO = $.Deferred();
		switch( opts.mode ) {
			case 'adopt': 
				adopt( newD, opts );
				uDO.resolve({status:0});
				break;
			default:
				uDO.reject({status:999,statusText:'No update mode specified'});
		};
		return uDO
		
		// --------------------------------
		// The processing per mode:
		function adopt( nD, opts ) {
			// First check whether BPMN collaboration and process have unique ids:
//			console.debug('uni',nD);
			// The new collaboration id gets lost, so far!
			
			// 1. Integrate the types:
			//    a) if different id, save new one and use it.
			//    b) if same id and same content, just use it (no action)
			//    c) if same id and different content, save with new id and update all references
			let i,I;
//			console.debug('#1',simpleClone(self.data));
			types.forEach( function(ty) {
				for( i=0,I=nD[ty.list].length; i<I; i++ ) {
					let itm = nD[ty.list][i],
						// types are compared by id, instances by title:
						idx = indexById( self.data[ty.list], itm.id );
					if( idx<0 ) {
						// a) there is no item with the same id:
						self.createContent( ty.name, itm )
					} else {
						// there is an item with the same id:
						if( !ty.eqFn( self.data[ty.list][idx], itm) ) {
							// c) create a new id and update all references:
							// Note: According to the SpecIF schema, dataTypes may have no additional XML-attribute
							// ToDo: In ReqIF an attribute named "Reqif.ForeignId" serves the same purpose as 'alterId':
							let alterId = itm.id;
							itm.id += '-' + new Date().toISOString().simpleHash();
							ty.sbFn( nD, itm.id, alterId );
							self.createContent( ty.name, itm )
						}
					}
				}
			});
//			console.debug('#2',simpleClone(self.data));
			// 2. Integrate the instances:
			//    a) if different title or type, save new one and use it.
			//    b) if same title and type, just use it and update all references
			for( i=0,I=nD.resources.length; i<I; i++ ) {
				let itm = nD.resources[i];
			//		typ = itemById( nD.resourceClasses, itm['class'] );
			//	if( CONFIG.modelElementClasses.indexOf( typ.title )>-1
				if( CONFIG.modelElementClasses.concat(CONFIG.diagramClasses).concat(CONFIG.folderClasses).indexOf( classTitleOf(nD,itm) )>-1 
					&& CONFIG.excludedFromDeduplication.indexOf( valByTitle(nD,itm,CONFIG.propClassType) )<0 
				) {
						// Check for a resource with the same title:
						let exs = itemByTitle( self.data.resources, itm.title );
						// If there is an instance with the same title ... and if the types match;
						// the class title reflects the role of it's instances ...
						// and is less restrictive than the class ID:
//						console.debug('~1',itm,exs?exs:'');
						if( exs 
							&& CONFIG.excludedFromDeduplication.indexOf(valByTitle( self.data, exs, CONFIG.propClassType ))<0 
							&& classTitleOf(nD,itm)==classTitleOf(self.data,exs) 
					//		&& valByTitle(nD,itm,CONFIG.propClassType)==valByTitle(self.data,exs,CONFIG.propClassType) 
						) {
//							console.debug('~2',exs,itm);
							// There is an item with the same title and type,
							// adopt it and update all references:
							substituteR( nD, exs, itm, {rescueProperties:true} );
							continue
						}
				};
				// Else, keep separate instances:
				
				// Note that in theory, there shouldn't be any conflicting ids, but in reality there are;
				// for example it has been observed with BPMN/influx which is based on bpmn.io like cawemo.
				// ToDo: make it an option.

				// Check, whether the existing model has an element with the same id,
				// and if it has a different title, assign a new id to the new element:
				if( hasDuplicateId(self.data,itm.id) ) {
					// ToDo: check whether titles are different .... otherwise adopt as well ??
//					console.debug('duplicate ID',itm);
					let newId = genID('R-');
					// first assign new ID to all references:
					substituteR( nD, {id:newId}, itm );
					// and then to the resource itself:
					itm.id = newId
				};
//				console.debug('+ resource',itm);
				self.createContent( 'resource', itm )
			};
//			console.debug('#3',simpleClone(self.data));

			// 3. Create the remaining items:
			self.createContent( 'statement', nD.statements );
			self.createContent( 'hierarchy', nD.hierarchies );
			self.createContent( 'file', nD.files );
//			console.debug('#4',simpleClone(self.data));
			
			// 4. Finally some house-keeping:
			hookStatements();
			self.deduplicate();	// deduplicate equal items
			// ToDo: Save changes from deduplication to the server.
		//	console.debug('#5',simpleClone(self.data));
			if( opts.addProcessesFolder )
				self.createProcessesFolder();
//			console.debug('#6',simpleClone(self.data));
			if( opts.addGlossary )
				self.createGlossary();
//			console.debug('#7',simpleClone(self.data));
		};
	
/*		// newD is new data in 'internal' data structure
		// add new elements
		// update elements with the same id
		// exception: since types cannot be updated, return with error in case newD contains incompatible types
		// There are tree modes with respect to the types:
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
		function classesAreCompatible( ctg, mode ) {
			let aL= null, nL= null; 
			switch( ctg ) {
				case 'dataType': aL = self.data.dataTypes; nL = newD.dataTypes; break;
				case 'resourceClass': aL = self.data.resourceClasses; nL = newD.resourceClasses; break;
				case 'statementClass': aL = self.data.statementClasses; nL = newD.statementClasses; break;
				default: return null //should never arrive here
			};
			// true, if every element in nL is compatibly present in aL or if it can be added;
			// loop backwards because only one variable is needed:
			let j=null, rC=null;
			for( var i=nL.length-1;i>-1;i-- ) {
				for( j=aL.length-1;j>-1;j-- ) {
//					console.debug('classesAreCompatible',aL[j],nL[i]);
					// if a single element is incompatible the lists are incompatible:
					rC = classIsCompatible(ctg,aL[j],nL[i],mode);
					// on first error occurring, quit with return code:
					if( rC.status>0 ) return rC 
				}
			};
			return {status:0}
		}
		function addNewTypes( ctg ) {
			// Is commonly used for resource and statement classes with their propertyClasses.
			let rL= null, nL= null, rT=null, nT=null; 
			switch( ctg ) {
				case 'dataType': rL = self.data.dataTypes; nL = newD.dataTypes; break;
				case 'resourceClass': rL = self.data.resourceClasses; nL = newD.resourceClasses; break;
				case 'statementClass': rL = self.data.statementClasses; nL = newD.statementClasses; break;
				default: return null //should never arrive here
			};
			nL.forEach( function(nT) {
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
								addNewAT( rT, nT.propertyClasses, 0 )
							}
					}
				} else {
					// else: the type does not exist and will be created, therefore:
					pend++;
					console.info('Creating type',nT.title);
					self.createContent(nT.category,nT)
						.done(function() {
							if( --pend<1 ) updateNext( ctg )
						})
						.fail( uDO.reject )
				}
			});
			// if no type needs to be created, continue with the next:
			if(pend<1) updateNext( ctg );
			return
				
				function addNewAT( r, nATs, idx ) {
					// r: existing (=reference) type with its propertyClasses
					// nATs: new list of propertyClasses
					// idx: current index of nATs
					if( nATs[idx].id?itemById( r.propertyClasses, nATs[idx].id ):itemByName( r.propertyClasses, nATs[idx].title ) ) {
						// not missing, so try next:
						if( ++idx<nATs.length ) addNewAT( r, nATs, idx );
						return
					};

					// else: not found, so create:
					pend++;
					if( idx>0 ) 
						nATs[idx].predecessor = nATs[idx-1].id;

					// add the new property class also to r:
					let p = indexById( r.propertyClasses, nATs[idx].predecessor );
					console.info('Creating property class', nATs[idx].title);
					// insert at the position similarly to the new type;
					// if p==-1, then it will be inserted at the first position:
					r.propertyClasses.splice( p+1, 0, nATs[idx] );
				//	nATs[idx].class = r.id;  // eine Verzweiflungstat ... siehe server...js
					server.project({id:self.data.id}).allClasses({id:r.id}).class(nATs[idx]).create()
						.done( function() {
							// Type creation must be completed before starting to update the elements:
							if( ++idx<nATs.length ) addNewAT( r, nATs, idx );
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
							.done( function() {
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
			itemL.forEach( function(itm) {
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
				// Use case: Update diagrams with model elements only:
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
								rV = enumValStr(rDT,rA);
								nV = enumValStr(nDT,nA);
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
					.done( function(rI) {
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
							rI.properties.forEach( function(rA) {
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
					.fail( function(xhr) {
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
									.done(function() {
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
						h.children.forEach( function(ch) {
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
						.done( function() {
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

	self.createContent = function( ctg, item ) {  
		// item can be a js-object or a list of js-objects
		// ctg is a member of [dataType, resourceClass, statementClass, propertyClass, resource, statement, hierarchy]
		// ...  not all of them may be implemented, so far.
		// cache the value before sending it to the server, as the result is not received after sending (except for 'resource' and 'statement')

//		console.debug('createContent', ctg, item );
		switch( ctg ) {
			case 'node':
				return null;  // not supported
		//	case 'resource':
		//	case 'statement':
		//	case 'hierarchy':
				// add the baseType to property values to simplify the transformation for storing:
		//		addBaseTypes( item );
				// no break
			default:
				// if current user can create an item, he has the other permissions, as well:
		//		addPermissions( item );
		//		item.createdAt = new Date().toISOString();
		//		item.createdBy = item.changedBy;
				cache( ctg, item )
		};
		var sDO = $.Deferred();
		sDO.resolve({status:0});
		return sDO
	};
	self.readContent = function( ctg, item, opts ) {  
		// ctg is a member of [dataType, resourceClass, statementClass, resource, statement, hierarchy]
		//  for compatibility with older callers:
	/*	if( typeof(opts)=='boolean' )
			opts = {reload: opts};
		// .. and by default:
		if( !opts )
			opts = {reload: false}; */
		
	//	if( !opts.reload ) {
			// Try to read from cache:
			if( typeof(opts)=='undefined') opts = {reload:false,timelag:10};
			// override 'reload' as long as there is no server and we know that the resource is found in the cache:
			opts.reload = false;
			var dO = readCache( ctg, item, opts );
			if( dO ) return dO;
	//	};
		return null
	};
	self.updateContent = function( ctg, item ) {  
		// ctg is a member of [resource, statement, hierarchy], 'null' is returned in all other cases.
			function updateCh( itm ) {
				itm.changedAt = new Date().toISOString();
				itm.changedBy = app.me.userName
			}

		switch( ctg ) {
			case 'node':	
				// nodes can only be created or deleted
				return null; 
		//	case 'resource':
		//	case 'statement':
		//	case 'hierarchy':
				// add the baseType to property values to simplify the transformation for storing:
		//		addBaseTypes( item );
				// no break
			default:
//				console.debug('updateContent - cache', ctg );
				if( Array.isArray(item) )
					item.forEach( updateCh )
				else
					updateCh(item);
				cache( ctg, item )
		};
		var uDO = $.Deferred();
		uDO.resolve({status:0});
		return uDO
	};
	self.deleteContent = function( ctg, item ) {  
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
		var dDO = $.Deferred();
		// Do not try to delete types which are in use;
		// ToDo: Delete in the server, as well.
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
			case 'node':			
				uncache( ctg, item );
				break;
			default:				
				return null
		};
		dDO.resolve({status:0});
		return dDO
	};
/*	self.createNode = function( el ) {
		// creating a node is updating the hierarchy:
		var cPr = $.Deferred();
		let sId = self.data.selectedHierarchy.id, // memorize
			nI; 
		// 1. reload hierarchy to minimize update conflict,
		//    just specify the id to obtain the last revision:
	//	self.readContent( 'hierarchy', {id:self.data.selectedHierarchy.id}, {reload: true} )
	//		.done( function( nH ) {
//				console.debug('createNode current hierarchy',nH,el);
	//			cache( 'hierarchy', nH );
	//			self.data.selectedHierarchy = itemById( self.data.hierarchies, sId ) // update address
//				console.debug('createNode selected hierarchy',sId,self.data.selectedHierarchy);
				// 2. insert the node:
				nI = cache( 'node', el );
//				console.debug('createNode updated hierarchy',nI,self.data.selectedHierarchy);
				if( typeof(nI)=='number' && nI>-1 ) 
					// 3. update the hierarchy:
					self.updateContent( 'hierarchy', self.data.selectedHierarchy )
						.done( cPr.resolve )
						.fail( cPr.reject )
	//		})
	//		.fail( cPr.reject )
		return cPr
	};
	self.moveNode = function( el ) {
	};
	self.deleteNodes = function( el ) {
		// deleting a node is updating a hierarchy:
		uncache( 'node', el );  // good enough, if there is no server
		var dPr = $.Deferred();
		let nI
		// 1. reload hierarchy to minimize update conflict,
		//    just specify the id to obtain the last revision:
		self.readContent( 'hierarchy', {id:self.data.selectedHierarchy.id}, {reload: true} )
	//		.done( function( nH ) {
//				console.debug('deleteNodes current hierarchy',nH,el);
	//			cache( 'hierarchy', nH );
	//			app.cache.selectedProject.data.selectedHierarchy = itemById( self.data.hierarchies, sId )
//				console.debug('deleteNodes selected hierarchy',self.data.selectedHierarchy);  
				// 2. delete the node:
				nI = uncache( 'node', el );
//				console.debug('deleteNodes updated hierarchy',nI,self.data.hierarchies);
				No need without server:
				if( nI ) 
					// 3. update the hierarchy:
					self.updateContent( 'hierarchy', self.data.hierarchies )
						.done( dPr.resolve )
						.fail( dPr.reject )  
	//		})
	//		.fail( dPr.reject )  
		return dPr 
	};

	self.createResource = function( oT ) { 
		// Create an empty form (resource instance) for the resource class oT:
		var fDO = $.Deferred();
//		console.debug( 'createResource', oT );

		// Get the class's permissions. So far, it's property permissions are not loaded ...
		self.readContent( 'resourceClass', oT, {reload:true} )
			.done( function(dta) {
				// return an empty resource instance of the given type: 
				var res = 
					{ class: dta.id,
					title: '',
					upd: true,
					properties: [] };
				dta.propertyClasses.forEach( function(pC) {
					if( pC.cre )
						res.properties.push( createPropC(pC) )
				});
//				console.debug('fillObject',res);
				if( res.properties.length ) 
					fDO.resolve( res )
				else
					fDO.reject({status:977, statusText:i18n.ErrInconsistentPermissions})
			})
			.fail( fDO.reject );
		return fDO
	};*/
	self.readStatementsOf = function( res, showComments ) {  
		// Get the statements of a resource ... there are 2 use-cases:
		// - All statements between resources appearing in a hierarchy shall be shown for navigation;
		//   it is possible that a resource is deleted (from all hierarchies), but not it's statements.
		//   --> set 'showComments' to false
		// - All comments referring to the selected resource shall be shown;
		//   the resource is found in the cache, but the comment is not.
		//   --> set 'showComments' to true
		
			function isReferenced( rId ) {
			/*	for( var s=self.data.hierarchies.length-1; s>-1; s-- )
					if( iterateNodes( self.data.hierarchies[s], function(nd) { return nd.resource!=rId } ) ) return true;
				return false */
				return iterateNodes( self.data.hierarchies, function(nd) { return nd.resource!=rId } )
			}
		var sDO = $.Deferred();

		var rsp = app.cache.selectedProject.data.statements.filter( function(s){ 
								// filter all statements involving res as subject or object:
								return ( res.id==s.subject.id || res.id==s.object.id )
								// AND fulfilling certain conditions:
									&&  ( 	
											// related subject and object must be referenced in the tree to be navigable,
											// also, the statement must not be declared 'hidden':
											!showComments
												&&	isReferenced( s.subject.id )
												&&	isReferenced( s.object.id )
												&&	s.title!=CONFIG.staClassCommentRefersTo
												&& 	CONFIG.hiddenStatements.indexOf( s.title )<0
											// In case of a comment, the comment itself is not referenced, but the resource:
										||	showComments
												&&	isReferenced( s.object.id )
												&&	s.title==CONFIG.staClassCommentRefersTo
										)
							});
		sDO.resolve(rsp);
		return sDO
	};
	self.export = function() {
		if( self.data.exporting ) return;
		let dlg = new BootstrapDialog({
			title: i18n.LblExport+": '"+self.data.title+"'",
			type: 'type-default',
			message: function (thisDlg) {
				var form = $('<form id="exportFmt" role="form" class="form-horizontal" ></form>');
				form.append( 
					"<p>"+i18n.MsgExport+"</p>"
				+	radioInput( i18n.LblFormat, [
						{ title: 'SpecIF', id: 'specif' },
						{ title: 'ReqIF', id: 'reqif' },
						{ title: 'ePub', id: 'epub' },
						{ title: 'MS WORD (Open XML)', id: 'oxml' }
					]) 
				);
				return form },
			buttons: [
				{ 	label: i18n.BtnCancel,
					action: function(thisDlg){ 
						thisDlg.close() 
					}
				},
				{ 	label: i18n.BtnExport,
					cssClass: 'btn-success', 
					action: function (thisDlg) {
						// Get index of option:
						app.busy.set();
						self.exportAs( {format: radioValue( i18n.LblFormat )} )
							.done( function() { 
								message.show( "OK (200): "+i18n.MsgBrowserSaving, {severity:'success', duration:CONFIG.messageDisplayTimeShort} );
								app.busy.reset();
							})
							.fail( handleError );
//						app.busy.reset();
						thisDlg.close()
					}
				}
			]
		})
		.open()

		// --- 
		function handleError(xhr) {
			self.data.exporting = false;
			message.show( xhr )
		}  
	};
	self.exportAs = function(opts) {
		if( self.data.exporting ) return;
		
		if( !opts ) opts = {};
		if( !opts.format ) opts.format = 'specif';
		// in certain cases, try to export files with the same name in PNG format, as well.
		// - ole: often, preview images are supplied in PNG format;
		// - svg: for generation of DOC or ePub, equivalent images in PNG-format are needed.
	//	if( typeof(opts.preferPng)!='boolean' ) opts.preferPng = true;   ... is the default
	//	if( !opts.alternatePngFor ) opts.alternatePngFor = ['svg','ole'];	... not yet supported
		
		var eDO = $.Deferred();

		/*	function handleError(xhr) {
				self.data.exporting = false; 
				eDO.reject(xhr)
			}  */
		
		if( self.data.exp ) {
			self.data.exporting = true;

			switch( opts.format ) {
				case 'specif':
				case 'reqif':
					storeAs( opts );
					break;
				case 'epub':
				case 'oxml':
					generate( opts )  
			}
		} else {
			eDO.reject({status: 999, statusText: "No permission to export"})
		};
		return eDO

		function generate( opts ) {
//				console.debug( "generate", opts );
			if( !opts || ['epub','oxml'].indexOf(opts.format)<0 ) return null;
			if( typeof(opts.translateTitles)!='boolean' ) opts.translateTitles = true;
			// don't translate now, but within toOxml() to ascertain that classifyProps() works properly:
				// ToDo; Use self.read() to get the newest data from the server.
			let data = specif.toExt( self.data, {translateTitles: false} ), 
				options = { 
					classifyProperties: classifyProps,
					translateTitles: opts.translateTitles,
					translate: i18n.lookup,
					// Values of declared stereotypeProperties get enclosed by double-angle quotation mark '&#x00ab;' and '&#x00bb;'
					stereotypeProperties: CONFIG.stereotypeProperties,
					// If a hidden property is defined with value, it is suppressed only if it has this value;
					// if the value is undefined, the property is suppressed in all cases.
					// so far (iLaH v0.92.44), property titles are translated:
				//	hiddenProperties: opts.translateTitles? [{title:i18n.lookup('SpecIF:Type'),value:'SpecIF:Folder'}] : [{title:'SpecIF:Type',value:'SpecIF:Folder'}],
					hiddenProperties: [{title:'SpecIF:Type',value:'SpecIF:Folder'}],
					showEmptyProperties: CONFIG.showEmptyProperties,
					imgExtensions: CONFIG.imgExtensions,
					applExtensions: CONFIG.applExtensions,
				//	hasContent: hasContent,
					propertiesLabel: 'SpecIF:Properties',
					statementsLabel: 'SpecIF:Statements',
					done: function() { app.cache.selectedProject.data.exporting=false; eDO.resolve() },
					fail: function(xhr) { app.cache.selectedProject.data.exporting=false; eDO.reject(xhr) }
				},
				pend=0;

			if( data.files )
				// Transform any special format:
				data.files.forEach( function(f,i,L) {  
					switch( f.type ) {
						case 'application/bpmn+xml':
							pend++;
							// Read and render BPMN as SVG:
							blob2text(f,function(b) {
								bpmn2svg(b, function(err, svg) { 
											// this is the bpmnViewer callback function:
											if (err) {
												console.error('BPMN-Viewer could not deliver SVG', err)
											} else {
												// replace:
												L.splice(i,1,{
													blob: new Blob([svg],{type: "text/plain; charset=utf-8"}),
													id: 'F-'+f.title.simpleHash(),
													title: f.title.fileName()+'.svg',
													type: 'image/svg+xml',
													changedAt: f.changedAt
												})
											};
	//										console.debug('SVG',svg,L);
											if( --pend<1 ) 
												// Now, generate in the desired format:
												gen();
										})
							}, 0)
					}
				});  
			// In case there is nothing to transform, we start right away:
			if( pend<1 ) 
				// Generate in the desired format:
				gen();
			return;
			
			function gen() {
				switch( opts.format ) {
					case 'epub':
						toEpub( data, options );
						break;
					case 'oxml':
						toOxml( data, options )
				}
			}
		}
		function storeAs( opts ) {
			if( !opts || ['specif','reqif'].indexOf(opts.format)<0 ) return null;
			let zip = new JSZip(),
				// ToDo; Use self.read() to get the newest data from the server.
				data = specif.toExt( self.data, {translateTitles: false} );

			// Add the files:
			if( data.files )
				data.files.forEach( function(f) {
//					console.debug('zip a file',f);
					zip.file( f.title, f.blob );
					delete f.blob // the SpecIF data below shall not contain it ...
				});

			// Prepare the output data:
			let fName = data.title+"."+opts.format;
			switch( opts.format ) {
				case 'specif':
					data = JSON.stringify( data );
					break;
				case 'reqif':
					data = app.ioReqif.toReqif( data )
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
					function(blob) {
//							console.debug("storing ",data.title+".specifz");
						saveAs(blob, fName+"z");
						self.data.exporting = false;
						eDO.resolve()
				}, 
					function(xhr) {
						console.error("Cannot store ",fName+"z");
						self.data.exporting = false;
						eDO.reject()
				})
		}
	}
	self.abort = function() {
		console.info('abort specif');
	//	server.abort();
		self.abortFlag = true
	};
	self.init();
	return self;
//////////
// some local helper routines:

/*	function queryObjects( qu, reload ) {   
		// get all resources of the specified type: qu is {type: class}
	//	if( !reload ) {
			// collect all resources with the queried type:
			var oL = forAll( self.data.resources, function(o) { return o['class']==qu.type?o:null } ),
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
				if( !loading && !self.data.exporting ) { return };  // in case the loading has been stopped (by stopAutoLoad) ...
				// convert list of hierarchy entries to list of resources:
				var rL=[];
				for( var o=oL.length-1;o>-1;o-- ) rL[o] = {id: oL[o]};  

				return server.readContent( 'resource', rL )
					.done(function(rsp) {
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
				if( !loading && !self.data.exporting ) { return };  // in case the loading has been stopped (by stopAutoLoad) ...
//				console.debug( 'loadRels', ob );
				self.readStatementsOf( ob )
					.done(function(rsp) {
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
				.done(function() {
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
			setTimeout( function() { autoLoad( aU ) }, CONFIG.cacheAutoLoadPeriod )
			
			// skip this turn, if autoLoad from last trigger is still being executed (avoid multiple updates in parallel):
			if( loading ) { console.info( 'Skipping autoLoad cycle' ); return };
			// else, start the update:
			loading = true;
			// 1) load the dataTypes:
			self.readContent( 'dataType', [], true )	// true: reload
				.done( function() {
					if( autoLoadId && aU==autoLoadId ) {  // if the update hasn't been stopped, meanwhile
						// 2) load allClasses:
						self.readContent( 'anyClass', [], true )
							.done( function() {
								// new allClasses and the permissions have arrived.
								// 3) update the current spec and the referenced resources:
								if( autoLoadId && aU==autoLoadId )   // if the update hasn't been stopped, meanwhile
									self.loadInstances( autoLoadCb )
							})
							.fail( function(xhr) { 
								loading = false	// e.g. when importing, the calls will fail, but thereafter the autoLoad shall resume.
							})
					}
				})
				.fail( function(xhr) { 
					loading = false	// e.g. when importing, the calls will fail, but thereafter the autoLoad shall resume.
				})
		}
		// else: project has been left or another autoLoad chain has been started, so break this chain.
	} 

	function addBaseTypes( item ) {
		if( !server || server.type=='PouchDB' ) return;
		// only needed for ReqIF Server:
		// add base types for easier (context-free) processing of properties when storing; 
		// for use with createContent and updateContent functions. 
		if( !item || Array.isArray(item)&&item.length<1 ) return;
			function addBT(itm) {
				if( !itm.properties || itm.properties.length<1 ) return;
				let sT = itemById( self.data.allClasses, itm['class'] ),pT=null,dT=null;
				for( var a=itm.properties.length-1; a>-1; a-- ) {
					pT = itemById( sT.propertyClasses, itm.properties[a].class );
					dT = itemById( self.data.dataTypes, pT.dataType );
					itm.properties[a].baseType = dT.type
				}
			}
		if( Array.isArray(item) )
			item.forEach( function(itm) {addBT(itm)} )
		else 
			addBT(item)
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
					itm.properties.forEach( function(ip) {
						ip.upd=true;
						ip.del=true
					})
			}
		if( Array.isArray(item) )
			item.forEach( function(itm) {addPerms(itm)} )
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
						// to be compatible, the new 'fragmentDigits' must be lower or equal:
						if( refC.fragmentDigits<newC.fragmentDigits )
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
						return {status:0}
				};
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
				return {status:0}
		};
		return null		// should never arrive here ...
	}
	function cache( ctg, item ) { 
		if( !item || Array.isArray(item)&&item.length<1 ) return;
		// If item is a list, all elements must have the same category.
		let fn = Array.isArray(item)?cacheL:cacheE;
		switch(ctg) {
			case 'hierarchy':
			case 'dataType':
			case 'propertyClass':		return fn( cacheOf(ctg), item );
			case 'resourceClass': 
			case 'statementClass':		fn( self.data.allClasses, item); return fn( cacheOf(ctg), item );
			case 'class':				if(Array.isArray(item)||!item['class']) return null;  // cannot process arrays in this case, yet.
//										console.debug('cache class',item,itemById(self.data.allClasses,item['class'])); 
										return cacheAtPosition( itemById(self.data.allClasses,item['class']).propertyClasses, item ); ;
			case 'resource': 		
			case 'statement': 	
			case 'file': 				if(app.cache.cacheInstances) return fn( cacheOf(ctg), item );
										else return;
			case 'node':				if(Array.isArray(item)||!item.parent) return null;
//										console.debug('cache',ctg,item);
										return cacheNode( item ); 
			default: return null
		}
	}
	function delNodes( L, el ) {
		// Delete all nodes referencing the specified element;
		// if el is the node, 'id' will be used,
		// and if el is the referenced resource, 'resource' will be used to identify the node.
		if( !Array.isArray( L ) ) return;
//		console.debug('delNodes',simpleClone(L),el);
		for( var h=L.length-1; h>-1; h-- ) {
			if( L[h].id==el.id || L[h].resource==el.resource ) {
//				console.debug( 'deleting node ',simpleClone(L[h]) );
				L.splice(h,1);
				break	// can't delete more than once ;-)
			};
			// step down, if the node hasn't been deleted:
			delNodes( L[h].nodes, el )
		}
	}
	function uncache( ctg, item ) { 
		if( !item ) return;
		let fn = Array.isArray(item)?uncacheL:uncacheE;
		switch(ctg) {
			case 'hierarchy':		
			case 'dataType': 
			case 'propertyClass':		return fn( cacheOf(ctg), item );
			case 'resourceClass': 	
			case 'statementClass': 		fn( self.data.allClasses, item); return fn( cacheOf(ctg), item );
			case 'class':				let sT = itemById(self.data.allClasses,item['class']);
//										console.debug('uncache class',item,sT); 
										return fn( sT.propertyClasses, item );
			case 'resource': 	
			case 'statement': 			
			case 'file':				if(app.cache.cacheInstances) return fn( cacheOf(ctg), item );
										else return;
			case 'node':				if( Array.isArray(item) )
											item.forEach( function(it) { delNodes( self.data.hierarchies, it ) })
										else
											delNodes( self.data.hierarchies, item );
										return;
			default: return null
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
			default: return null
		}
	}
	function readCache( ctg, itm, opts ) {
		// Read an item from cache, unless 'reload' is specified:
		if( !opts.reload ) {
			let arr = cacheOf(ctg),
				idx=null;
//			console.debug( 'readCache', arr );
			if( itm=='all' ) {
					// return all cached resources asynchronously:
					var dO = $.Deferred();  
//					console.debug( 'readCache', arr, itm );
					dO.resolve( [].concat(arr) );	// return a new list with the original elements
					return dO
			};
			if( Array.isArray(itm) ) {
				let allFound=true, i=0, I=itm.length;
				while( allFound && i<I ) {
					idx = indexById( arr, itm[i].id );
					if( idx>-1 )
						itm[i] = arr[idx]
					else
						allFound = false;
					i++
				};
				if( allFound ) {
					// return the cached resources asynchronously:
					var dO = $.Deferred();  
//					console.debug( 'readCache array - allFound', arr, itm );
					// delay the answer a little, so that the caller can properly process a batch:
					setTimeout(function() {
						dO.resolve( itm )
					}, opts.timelag );
					return dO
				}
			} else {
				// is a single item:
				idx = indexById( arr, itm.id );
				if( idx>-1 ) {
					// return the cached object asynchronously:
					var dO = $.Deferred();  
					// delay the answer a little, so that the caller can properly process a batch:
					setTimeout(function() {
						dO.resolve( arr[idx] )
					}, opts.timelag );
//					console.debug('readCache single item - found', ctg, 'from cache:',arr[idx]);
					return dO
				}
			}
//			console.debug('readCache - not found', ctg, itm);
		};
		return null
	}
/*	function cacheNode( e ) {  // ( hierarchy entry )
		// add or replace a node in a hierarchy;
		// e must specify the parent node and optionally a predecessor.
			function findNode( L, eId ) {
//				console.debug('findNode',L);
				let n=null;
				for( var h=L.length-1;h>-1;h-- ) {
					if( L[h].id==eId ) return L[h];
					n = findNode( L[h].nodes, eId );
					if( n ) return n
				};
				return null
			}
		if( !(e && e.parent) ) return null;
		// cycle through all hierarchies and nodes to find the parent:
	//	let pa = findNode( self.data.hierarchies, e.parent ); 
		// assuming that nodes are only inserted deleted in the selected hierarchy:
		let pa = findNode( self.data.selectedHierarchy.nodes, e.parent );
//		console.debug('cacheNode',e,pa);
		if( !pa ) return -1;
		if(pa.nodes==undefined) pa.nodes = [];
		return cacheAtPosition( pa.nodes, e )
	}
	function cacheAtPosition( L, e ) {  // ( list, entry )
		// add or update the element e in a list L:
		let n = indexById( L, e.id );
		let p = indexById( L, e.predecessor );
		if( n<0 ) 	{  
			// add, if not yet listed:
			L.splice(++p,0,e);   
//			console.debug('cacheA',p,L);
			return p
		};
		if( n!=p ) {
			// remove existing and add the new element:
			L.splice(n,1);  
			p = indexById( L, e.predecessor );			
			L.splice(++p,0,e);
//			console.debug('cacheA',p,L);
			return p
		};
		// update the existing otherwise:
		L[n] = e; 
		return n 
	}  */
}  // end of function Project()

//////////////////////////
// global helper functions:
const specif = {
	check: function( data, opts ) {
		// Check the SpecIF data for schema compliance and consistency;
		// no data of app.cache is modified:
		var cDO = $.Deferred();
		if( typeof(data)!='object' ) {
			cDO.reject( {status:999,statusText:'No SpecIF data to check'} ); 
			return cDO
		};
		// 1. Validate the data using the SpecIF schema:
		cDO.notify('Checking schema',10);

		// Get the specified schema file from the server:
		httpGet({
		//	url: "https://specif.de/v"+data.specifVersion+"/schema", 
			url: "./specif.de/v"+data.specifVersion+"/schema", 
			responseType: 'arraybuffer',
			withCredentials: false,	
			done: function(xhr) { 
//				console.debug('schema', xhr);
						// 1. check data against schema:
			let rc = checkSchema( data, {schema: JSON.parse( buf2str(xhr.response) )} );
						if( rc.status!=0 ) {
							// older versions of the checking routine don't set the responseType:
							if( typeof(rc.responseText)=='string' && rc.responseText.length>0 )
								rc.responseType = 'text';
							cDO.reject( rc ); 
							return 
						};

						// 2. Check further constraints:
						cDO.notify('Checking constraints',20);
						rc = checkConstraints( data, opts );
						if( rc.status==0 ) {
							cDO.resolve( data, rc )
						} else {
							// older versions of the checking routine don't set the responseType:
							if( typeof(rc.responseText)=='string' && rc.responseText.length>0 )
								rc.responseType = 'text';
//							console.debug('SpecIF Consistency Check:', rc);
							cDO.reject( rc )
						}
			},	
			fail: function(xhr) { 
				switch( xhr.status ) {
					case 404:
						xhr = { status: 903, statusText: 'SpecIF version '+data.specifVersion+' is not supported by the program!' };
					default:
						cDO.reject(xhr)
				}
			} 
		//	then: 
		});
		return cDO
	},
	toInt: function( spD ) {
		// transform SpecIF to internal data;
		// no data of app.cache is modified.
		// It is assumed that spD has passed the schema and consistency check.
//		console.debug('set',spD);
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
		if( spD.specifVersion.startsWith('0.1') ) {
				names.frct = 'accuracy';
				names.minI = 'min';
				names.maxI = 'max'
		} else {
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
			return null
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
					case 'undefined':
						break;
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
		//		iE.category = 'dataType';
				var oE = i2int( iE );
				oE.title = cleanValue(iE.title);
				oE.type = iE.type;
				switch( iE.type ) {
					case "double":
					case "integer":
						oE.fractionDigits = iE[names.frct];
						oE.minInclusive = iE[names.minI];
						oE.maxInclusive = iE[names.maxI];
						break;
					case "xhtml": 
					case "xs:string":		
						if( typeof(iE.maxLength)!='number' ) iE.maxLength = CONFIG.maxStringLength;
						break;
					case "xs:enumeration": 	
						if( iE.values ) 
							oE.values = forAll( iE.values, function(v) {
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
				if( iE.icon ) oE.icon = iE.icon;
				if( iE.creation ) oE.instantiation = iE.creation;	// deprecated, for compatibility
				if( iE['extends'] ) oE._extends = iE['extends'];	// 'extends' is a reserved word starting with ES5 
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
						iE[names.pClasses].forEach( function(e) {
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
		//		oE.category = 'resourceClass';

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
				oE.isHeading = false;
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
		//		oE.category = 'statementClass';
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
		//		oE.category = 'resourceClass';
//				console.debug('hierarchyClass 2int',iE,oE);
				return oE
			}
			// a property:
			function p2int( iE ) {
				let pT = itemById( iD.propertyClasses, iE[names.pClass] ),
					dT = itemById( iD.dataTypes, pT.dataType ),
					oE = {
						// no id
						class: iE[names.pClass]
					};
				if( iE.title ) oE.title = cleanValue(iE.title);
				if( iE.description ) oE.description = cleanValue(iE.description);

				// According to the schema, all property values are represented by a string
				// and internally they are stored as string as well to avoid inaccuracies 
				// by multiple transformations:
				oE.value = cleanValue(iE.value);
			/*	switch( dT.type ) {
					case 'xhtml':
					//	oE.value = iE.value.unescapeHTML();  // includes noCode(), works
						oE.value = makeHTML(iE.value.unescapeHTMLTags());  // unescapeHTMLTags includes noCode()
						break;
					default:
						oE.value = cleanValue(iE.value)
				};  */
				// sub-elements do not have their own revision and change info
//				console.debug('propValue 2int',iE,pT,oE);
				return oE
			}
			// common for all instances:
			function a2int( iE ) {
				var oE = i2int( iE );
				if( iE.properties && iE.properties.length>0 )
					oE.properties = forAll( iE.properties, p2int );
				if( iE.title ) {
					oE.title = cleanValue(iE.title)
				};
				return oE
			}
			// a resource:
			function r2int( eR ) {
				var oE = a2int( eR );
				oE['class'] = eR[names.rClass];
//				console.debug('resource 2int',eR,oE);
				return oE
			}
			// a statement:
			function s2int( eS ) {
				var iS = a2int( eS );
				// by default of a title adopt the title of the statement class:
				// ToDo: consider to replace the native title only for viewing and editing;
				//       idea: don't change the original data without need.
				iS.title = eS.title || itemById( iD.statementClasses, eS[names.sClass] ).title;
				iS['class'] = eS[names.sClass];
				// SpecIF allows subjects and objects with id alone or with  a key (id+revision),
				// so normalize internally to id+revision:
				// ToDo: consider to replace the native title only for viewing and editing;
				//       idea: don't change the original data without need.
				iS.subject = keyOf( eS.subject );
				iS.object = keyOf( eS.object );

				// special feature to import statements to complete, 
				// used for example by the XLS or ReqIF import:
				if( eS.subjectToFind ) iS.subjectToFind = eS.subjectToFind;
				if( eS.objectToFind ) iS.objectToFind = eS.objectToFind;
//				console.debug('statement 2int',eS,iS);
				return iS
			}
			// a hierarchy:
			function h2int( eH ) {
			//	var iH = a2int( eH );
			//	iH['class'] = eH[names.hClass];
				// the properties are stored with a resource, while the hierarchy is stored as a node with reference to that resource:
				if( names.hClasses ) {
					// up until v0.10.6;
					var iR = a2int( eH ),
						iH = {
							id: 'N-'+iR.id,
							resource: iR.id,
							changedAt: eH.changedAt
						};
					iR['class'] = eH[names.hClass];
					iD.resources.push(iR);
					
			//		if(iR.title) iH.title = iR.title;
					if(eH.revision) iH.revision = eH.revision.toString()
				} else {
					// starting v0.10.8:
					var iH = i2int( eH );
					iH.resource = eH.resource
				};
			/*	// list all resource ids in a flat list:
				iH.flatL = [eH.id];  */
				iH.nodes = forAll( eH.nodes, n2int );
//				console.debug('hierarchy 2int',eH,iH);
				return iH

				// a hierarchy node:
				function n2int( eN ) {
			//		iH.flatL.push(eN.resource);
					switch( typeof(eN.revision) ) {
						case 'undefined':
							break;
						case 'number':
							eN.revision = eN.revision.toString();
							break;
						case 'string':
							eN.revision = eN.revision
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
	toExt: function( iD, opts ) {
		// transform the data in internal data format to SpecIF:
		if( opts ) {
			if( typeof(opts.translateTitles)!='boolean' ) 
				opts.translateTitles = false
		} else {
			opts = {
				translateTitles: false
			}
		};
		
		// transform internal data to SpecIF:
		var spD = {
				id: iD.id,
				title: iD.title,
				specifVersion: app.specifVersion,
				generator: app.productTitle,
				generatorVersion: app.productVersion
			};
		if( app.cache.selectedProject.data.description ) spD.description = iD.description;
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
			// else: no createdBy, if there is no data 
		};
		if( iD.dataTypes && iD.dataTypes.length>0 ) 
			spD.dataTypes = forAll( iD.dataTypes, dT2ext );
		if( iD.propertyClasses && iD.propertyClasses.length>0 ) 
			spD.propertyClasses = forAll( iD.propertyClasses, pC2ext );
		spD.resourceClasses = forAll( iD.resourceClasses, rC2ext );
		spD.statementClasses = forAll( iD.statementClasses, sC2ext );
		spD.resources = forAll( iD.resources, r2ext );
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
				if( iE.description ) oE.description = iE.description;
				if( iE.revision ) oE.revision = iE.revision;
				if( iE.replaces ) oE.replaces = iE.replaces;
				if( iE.changedBy ) oE.changedBy = iE.changedBy;
				if( iE.createdAt ) oE.createdAt = iE.createdAt;
				if( iE.createdBy ) oE.createdBy = iE.createdBy;
				return oE
			}
			// a data type:
			function dT2ext( iE ) {
		/*		var oE = simpleClone(iE);
		//		delete oE.category;
				return oE  */
				return iE 
			}
			// a property class:
			function pC2ext( iE ) {
				var oE = i2ext( iE );
				oE.title = opts.translateTitles? titleOf(iE) : iE.title;
				if( iE.description ) oE.description = iE.description;
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
				oE.title = opts.translateTitles? titleOf(iE) : iE.title;
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
				if( iE.subjectClasses && iE.subjectClasses.length>0 ) oE.subjectClasses = iE.subjectClasses;
				if( iE.objectClasses && iE.objectClasses.length>0 ) oE.objectClasses = iE.objectClasses;
				return oE
			}
			// a property:
			function p2ext( iE ) {
				if( !iE.value ) return;	// skip empty properties
				var oE = {
					// no id
					// internally only valid SpecIF terms are used (hope so ;-)
					title: opts.translateTitles? titleOf(iE) : iE.title		
				};
				oE['class'] = iE['class'];
				if( iE.description ) oE.description = iE.description;
				
				// According to the schema, all property values are represented by a string
				// and we want to store them as string to avoid inaccuracies by multiple transformations:
				oE.value = iE.value;
				// properties do not have their own revision and change info; the parent's apply.
				return oE
			}
			// common for all instances:
			function a2ext( iE ) {
				var oE = i2ext( iE );
				// resources and hierarchies usually have individual titles, and so we will not translate:
				oE.title = elementTitleOf( iE );
				oE['class'] = iE['class'];
				if( iE.alternativeIds ) oE.alternativeIds = iE.alternativeIds;
				if( iE.properties && iE.properties.length>0 ) oE.properties = forAll( iE.properties, p2ext );
				return oE
			}
			// a resource:
			function r2ext( iE ) {
				var eR = a2ext( iE );
//				console.debug('resource 2int',iE,eR);
				return eR
			}
			// a statement:
			function s2ext( iS ) {
//				console.debug('statement 2ext',iS.title);
				if( CONFIG.hiddenStatements.indexOf( iS.title )>-1 ) return;  // do not export invisible statements
				var eS = a2ext( iS );
				// The statements usually do use a vocabulary item (and not have an individual title), 
				// so we translate, if so desired, e.g. when exporting to ePub:
				// ToDo: Take the title from statement properties, if provided (similarly to resources).
				// Take the statementClass's title, if the statement does not have it:
				iS.title = iS.title || itemById( iD.statementClasses, iS['class'] ).title;
				eS.title = opts.translateTitles? titleOf(iS) : iS.title;
				eS.subject = iS.subject.id;
				eS.object = iS.object.id;
				return eS
			}
			// a hierarchy node:
			function n2ext( iN ) {
				// just take the non-redundant properties (omit 'title', for example):
				let eN = {
					id: iN.id,
					resource: iN.resource,
					changedAt: iN.changedAt
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
function keyOf( item ) {
	// Normalize the identification including revision:
	switch( typeof(item) ) {
		case "object": return item;
		case "string": return {id: item, revision: "0"};
		default: return null // programming error
	}
}
function dataTypeOf( prj, pCid ) {
	// given a propertyClass id, return it's dataType:
	if( typeof(pCid)=='string' && pCid.length>0 )
		return itemById( prj.dataTypes, itemById( prj.propertyClasses, pCid ).dataType )
		//                             get class
		//	   get dataType
	// else:
	// may happen, if a resource does not have any properties and it's title or description is being used:
	return {type: 'xs:string'} // by default
}
function enumValStr( dT, prp ) {
	// for a property value of type ENUMERATION, create a comma-separated-value string of titles;
	// for all others, return the value as is:
	if( dT.type!='xs:enumeration' || !prp.value ) return prp.value;
	let ct = '',
		eV,
	//	st = CONFIG.stereotypeProperties.indexOf(prp.title)>-1,
		vL = prp.value.split(',');  // in case of ENUMERATION, value carries comma-separated value-IDs
	vL.forEach( function(v,i) {
	//	if( !v ) return;
	//	console.debug('enumValStr',dT,prp,vL);
		eV = languageValueOf( itemById(dT.values,v).value );
		// If 'eV' is an id, replace it by title, otherwise don't change:
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
	if( !prj ) prj = app.cache.selectedProject.data;
	let ti;
	if( pL )
		for( var a=0,A=pL.length;a<A;a++ ) {
			ti = vocabulary.property.specif( pL[a].title || itemById( prj.propertyClasses, pL[a]['class'] ).title );
			// First, check the configured headings:
			if( CONFIG.headingProperties.indexOf( ti )>-1 ) return a;
			// If nothing has been found, check the configured titles:
			if( CONFIG.titleProperties.indexOf( ti )>-1 ) return a
		};
	return -1
}
function languageValueOf( val ) {
	// Get the value according the current browser setting .. or the first value in the list by default.
	// 'val' can be a string or a multi-language object. 
	if( typeof(val)=='string' ) return val;
	if( !Array.isArray(val) ) return null;  // programming error
	
	let lVs = val.filter( function(v) {
		return browser.language == v.language
	});
	// lVs should have none or one elements; any additional ones are simply ignored:
	if( lVs.length>0 ) return lVs[0].text;
	
	// next try a little less stringent:
	lVs = val.filter( function(v) {
		return browser.language.slice(0,2) == v.language.slice(0,2)
	});
	// lVs should have none or one elements; any additional ones are simply ignored:
	if( lVs.length>0 ) return lVs[0].text;
	
	// As a final resourt take the first element in the list:
	return val[0].text
}
function titleOf( item ) {
	// Pick up the native title of any item;
	// look for a translation, take it as is or take the id by default.
	// It can be a title string or a multi-language title object. 
	return i18n.lookup( languageValueOf(item.title) ) || item.id
}
function titleFromProperties( pL ) {
	// look for a property serving as title:
	let idx = titleIdx( pL );
	if( idx>-1 ) {  // found!
		// Remove all formatting for the title, as the app's format shall prevail.
		// Before, remove all marked deletions (as prepared be diffmatchpatch) explicitly with the contained text.
		// ToDo: Check, whether this is at all called in a context where deletions and insertions are marked ..
		// (also, change the regex with 'greedy' behavior allowing HTML-tags between deletion marks).
	//	if( modules.ready.indexOf( 'diff' )>-1 )
	//		return pL[idx].value.replace(/<del[^<]+<\/del>/g,'').stripHTML().trim()
		// For now, let's try without replacements; so far this function is called before the filters are applied,
		// perhaps this needs to be reconsidered a again once the revisions list is featured, again:
//		console.debug('titleFromProperties', pL[idx], languageValueOf( pL[idx].value ) );
		return languageValueOf( pL[idx].value ).stripHTML().trim()
	};
	return
}
function elementTitleOf( res ) {
	// get the title from the properties or a replacement value in case of default:
	if( typeof(res)!='object' ) return null;  // programming error
	return titleFromProperties( res.properties ) || titleOf( res )
}
function propTitleOf( dta, prp ) {
	// get the title of a property as defined by itself or it's class:
	return prp.title || itemById(dta.propertyClasses,prp['class']).title
}
function elementTitleWithIcon( el ) {
	// add an icon to an element's title;
	// works for all types of elements, i.e. resources, statements and hierarchies.
	// The icon is defined in the elements's type:
	return CONFIG.addIconToInstance? elementTitleOf(el).addIcon( itemById( app.cache.selectedProject.data.allClasses, el['class'] ).icon ) : elementTitleOf(el)
}
/*	function classTitleWithIcon( t ) {
	// add the icon to a type's title, if defined:
	return (CONFIG.addIconToType?titleOf(t).addIcon( t.icon ):titleOf(t))
}*/
function classTitleOf(dta,r) {
	return itemById(dta.resourceClasses,r['class']).title
	// ToDo: .. or the title of the title attribute (dcterms:title) if the resource title is undefined
}
function typeOf( res ) {
	let tP = itemByTitle(res.properties,CONFIG.propClassType);
	// ToDo: .. or the title of the property class (dcterms:title) if the property title is undefined
	if( tP ) return tP.value
}
function hasContent( pV ) {
	// must be a string with the value of the selected language.
	if( !pV ) return false;
	return pV.stripHTML().trim().length>0
		|| RE.tagSingleObject.test(pV) // covers nested object tags, as well
		|| RE.tagImg.test(pV)
		|| RE.tagA.test(pV)
}
function iterateNodes( tree, eFn, lFn ) {
	// 1. Execute eFn for every node of the tree as long as eFn returns true;
	//    return true as a whole, if iterating is finished early.
	//    For example, if eFn tests for a certain attribute value of a tree node,
	//    the iterate function ends with true, as soon as the test is positive (cont is false).
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
//	console.debug('createProp',pCs,pCid);
	if( Array.isArray(pC) )
		pC = itemById( pC, pCid );
	var	p = {
		title: pC.title,
		class: pC.id,
		// supply default value if available:
		value: pC.value||'',	
		upd: pC.upd,
		del: pC.del
	};
/*	switch( itemById( app.cache.selectedProject.data.dataTypes, pC.dataType ).type ) {
		case 'xhtml':
			p.value = '<div>\n</div>';
			break;
		case 'xs:enumeration':
		//	p.valueIDs = [];	// needed for editing
		default:
			p.value = ''
	}; */
//	console.debug('createProp',p);
	return p
}
function createPropR( pCs, pCid ) {
	// Return an initialized property, if read permission is given:
//	Return pC.rea?createProp( pCs, pCid ):undefined
	// we assume that the current user has read permission for all data in cache:
	return createProp( pCs, pCid )
}
function createPropC( pCs, pCid ) {
	// return an initialized property, if create permission is given:
	return pC.cre?createProp( pCs, pCid ):undefined
}
/* function propClassByTitle(itm,pN) {
	// Return the class of a resource's (or statement's) property with title pN:
	if( itm.properties ) {
		var pC, i;
		for( i=itm.properties.length-1;i>-1;i-- ) {
			pC = itemById( self.data.propertyClasses, itm.properties[i]['class'] );
			if( pC.title==pN )
				return pC
		}
	};
	return
} */
function propByTitle(dta,itm,pN) {
	// Return the property of itm with title pN.
	// If it doesn't exist, create it,
	// if there is no property with that title, return undefined.
	
	// Look for the propertyClasses pCs of the item's class iC:
	// ToDo: Add statementClasses, as soon as needed.
	var iC = itemById( dta.resourceClasses, itm['class'] ),
	//	pCs = dta.propertyClasses.filter( function(pC) { return iC.propertyClasses.indexOf(pC.id)>-1 } ),
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
	return
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
	return
}
function classifyProps( el, data ) {
	"use strict";
	// add missing (empty) properties and classify properties into title, descriptions and other;
	// for resources and statements.
	// Note that here 'class' is the class object itself ... and not the id as is the case with SpecIF.
	if( !data ) data = app.cache.selectedProject.data;
	var cP = {
			id: el.id,
			title: undefined,
			class: itemById( data.resourceClasses, el['class']),  // the object, not the id !
			revision: el.revision,
			descriptions: [],
			// create a new list by copying the elements (do not copy the list ;-):
			other: normalizeProps( el, data )
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
	let a = titleIdx( cP.other, data );
	if( a>-1 ) {  // found!
		if( cP.other[a].value ) cP.title = cP.other[a].value;
		// remove title from other:
		cP.other.splice(a,1) 
	};
		
	// b) Check the configured descriptions:
	// We must iterate backwards, because we alter the list of other.
	// ToDo: use cP.other.filter()
	for( a=cP.other.length-1;a>-1;a-- ) {
		if( CONFIG.descProperties.indexOf( cP.other[a].title )>-1 ) {
			// To keep the original order of the properties, the unshift() method is used.
			if( cP.other[a].value ) cP.descriptions.unshift( cP.other[a] );
			cP.other.splice(a,1) 
		}
	};
	// In certain cases (SpecIF hierarchy root, comment or ReqIF export), there is no title or no description property: 
	if( !cP.title && el.title ) cP.title = el.title;
	if( cP.descriptions.length<1 && el.description ) cP.descriptions.push( {title: CONFIG.propClassDesc, value: el.description} );
//	console.debug( 'classifyProps', simpleClone(cP) );
	return cP

	function normalizeProps( i, dta ) { 
		// i: instance (resource or statement)
		// Create a list of properties in the sequence of propertyClasses of the respective class.
		// Use those provided by the instance's properties and fill in missing ones with default (no) values.
		let p,pCs,nL=[],
			// iCs: instance class list (resourceClasses or statementClasses),
			// the existence of subject (or object) let's us recognize that it is a statement:
			iCs = i.subject? dta.statementClasses : dta.resourceClasses,
			iC = itemById(iCs,i['class']);
		// build a list of propertyClass identifiers including the extended class':
		pCs = iC._extends? itemById( iCs, iC._extends ).propertyClasses||[] : [];
		pCs = pCs.concat( itemById( iCs, i['class'] ).propertyClasses||[] );
		// add the properties in sequence of the propertyClass identifiers:
		pCs.forEach( function(pCid) {
			p = itemBy( i.properties, 'class', pCid )
				|| createPropR(dta.propertyClasses,pCid);
			if( p ) {
				// by default, use the propertyClass' title,
				// replace the result with a current vocabulary term:
				if( !p.title ) 
					p.title = itemById( dta.propertyClasses, pCid ).title;
				// An input data-set may have titles which are not from the SpecIF vocabulary:
				p.title = vocabulary.property.specif( p.title );	
				nL.push( p )
			}
		});
//		console.debug('normalizeProps result',simpleClone(nL));
		return nL // normalized property list
	}
}
