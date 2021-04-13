/*!	Transformation Library for SpecIF data.
	Dependencies: jQuery
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de 
*/

const vocabulary = {
// Translate between different vocabularies such as ReqIF, Dublin Core, OSLC and SpecIF:
	property: {
		// for properyTypes and properties:
		specif: function( iT:string ):string {
			// Target language: SpecIF
			var oT = '';
			switch( specifIdOf(iT).toLowerCase() ) {
				case "_berschrift":
				case "title":
				case "titel":
				case "name":
				case "dc_title":
				case "specif_heading":			//  'SpecIF:Heading' has been used falsely as property title
				case "reqif_chaptername":
				case "reqif_name": 					oT = CONFIG.propClassTitle; break;
				case "description":
				case "beschreibung":
				case "text":
				case "dc_description":
	//			case "reqif_changedescription":
				case "reqif_description":
				case "reqif_text":					oT = CONFIG.propClassDesc; break;
				case "reqif_revision":				oT = "SpecIF:Revision"; break;
				case "specif_stereotype":		// deprecated, for compatibility, not to confound with "UML:Stereotype"
				case "specif_subclass":			// deprecated, for compatibility
				case "reqif_category":				oT = CONFIG.propClassType; break;
				case 'specif_id':				// deprecated, for compatibility
				case "reqif_foreignid":				oT = CONFIG.propClassId; break;
				case "specif_state":			// deprecated, for compatibility
				case "reqif_foreignstate":			oT = "SpecIF:Status"; break;
				case "dc_author":
				case "dcterms_author":			// deprecated, for compatibility
				case "reqif_foreigncreatedby":		oT = "dcterms:creator"; break;
				case "specif_createdat":			oT = "dcterms:modified"; break;
	//			case "reqif_foreignmodifiedby":		oT = ""; break;
	//			case "reqif_foreigncreatedon":		oT = ""; break;
	//			case "reqif_foreigncreatedthru":	oT = ""; break;
	//			case "reqif_fitcriteria":			oT = ""; break;
	//			case "reqif_prefix":				oT = ""; break;
	//			case "reqif_associatedfiles":		oT = ""; break;
	//			case "reqif_project":				oT = ""; break;
	//			case "reqif_chapternumber":			oT = ""; break;
				default:							oT = iT
			};
			return oT;
		},
		reqif: function( iT:string ):string {
			// Target language: ReqIF
			var oT = '';
			switch( specifIdOf(iT).toLowerCase() ) {
				case "dcterms_title": 				oT = "ReqIF.Name"; break;
				case "dcterms_description": 		oT = "ReqIF.Text"; break;
				case "dcterms_identifier":			oT = "ReqIF.ForeignId"; break;
				case "specif_heading": 				oT = "ReqIF.ChapterName"; break;	// for compatibility
				case "specif_category":
				case "dcterms_type":				oT = "ReqIF.Category"; break;
				case "specif_revision":				oT = "ReqIF.Revision"; break;
				case "specif_state":			// deprecated, for compatibility
				case "specif_status":				oT = "ReqIF.ForeignState"; break;
				case "dcterms_author":			// deprecated, for compatibility
				case "dcterms_creator":				oT = "ReqIF.ForeignCreatedBy"; break;
	//			case "specif_createdat":
	//			case "dcterms_modified":			oT = "ReqIF.ForeignCreatedAt";  // exists?
				default:							oT = iT
			};
			return oT;
		}
	},
	resource: {
		// for resource types, such as dataType, resourceType, ...:
		specif: function( iT:string ):string {
			// Target language: SpecIF
			var oT = '';
			switch( specifIdOf(iT).toLowerCase() ) {
				case 'actors':
				case 'actor':
				case 'akteure':
				case 'akteur':						oT = "FMC:Actor"; break;
				case 'states':
				case 'state':
				case 'zustände':
				case 'zustand':						oT = "FMC:State"; break;
				case 'events':
				case 'event':
				case 'ereignisse':
				case 'ereignis':					oT = "FMC:Event"; break;
				case 'anforderungen':
				case 'anforderung':
				case 'requirements':
				case 'requirement':
				case 'specif_requirement':			oT = "IREB:Requirement"; break;
				case 'merkmale':
				case 'merkmal':
				case 'features':
				case 'feature':						oT = "SpecIF:Feature"; break;
				case 'annotations':
				case 'annotationen':
				case 'annotation':					oT = "IR:Annotation"; break;
				case 'user_stories':
				case 'user_story':					oT = 'SpecIF:UserStory'; break;
				case 'specif_view':
				case 'fmc_plan':					oT = CONFIG.resClassDiagram; break;
				case 'specif_folder':				oT = CONFIG.resClassFolder; break;
				case 'specif_hierarchyroot':
				case 'specif_hierarchy':			oT = CONFIG.resClassOutline; break;
				default:							oT = iT
			};
			return oT
/*		},
		reqif: function( iT:string ):string {
			// no translation to OSLC or ReqIF, because both don't have a vocabulary for resources
			return iT */
		}
	}
};
const specif = {
	check: ( data:SpecIF, opts?:any ):Promise<SpecIF> =>{
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
					// force a reload through cache-busting:
					url: (data['$schema'] || 'https://specif.de/v' + data.specifVersion + '/schema') + '?' + simpleHash(Date.now().toString()),
					responseType: 'arraybuffer',
					withCredentials: false,
					done: (xhr)=>{
//						console.debug('schema', xhr);
						// 1. check data against schema:
						let rc = checkSchema( data, {schema: JSON.parse( ab2str(xhr.response) )} );
						if( rc.status!=0 ) {
							// older versions of the checking routine don't set the responseType:
							if( typeof(rc.responseText)=='string' && rc.responseText.length>0 )
								rc.responseType = 'text';
							reject( rc );
							return;
						};

						// 2. Check further constraints:
						rc = checkConstraints( data, opts );
						if( rc.status==0 ) {
//							console.debug('SpecIF Consistency Check:', rc, simpleClone(data));
							resolve( data );
						} 
						else {
//							console.debug('SpecIF Consistency Check:', rc);
							reject( rc );
						};
					},
					fail: (xhr)=>{
						switch( xhr.status ) {
							case 404:
								let v = data.specifVersion? 'version '+data.specifVersion : 'with Schema '+data['$schema'];
								xhr = { status: 903, statusText: 'SpecIF '+v+' is not supported by the program!' };
								// no break
							default:
								reject(xhr);
						};
					}
				});
			}
		);
	},
	toInt: (spD):SpecIF => {
		// transform SpecIF to internal data;
		// no data of app.cache is modified.
		// It is assumed that spD has passed the schema and consistency check.
//		console.debug('set',simpleClone(spD));
		class ItemNames {
			rClasses:string;
			sClasses: string;
			hClasses?: string;
			pClasses: string;
			subClasses: string;
			objClasses: string;
			rClass: string;
			sClass: string;
			hClass?: string;
			pClass: string;
			frct: string;
			minI: string;
			maxI: string;
			constructor(ver:string) {
				switch (ver) {
					case '0.10.7':
						throw "Version " + ver + " is not supported.";
					case '0.10.2':
					case '0.10.3':
						this.rClasses = 'resourceTypes';
						this.sClasses = 'statementTypes';
						this.hClasses = 'hierarchyTypes';
						this.pClasses = 'propertyTypes';
						this.subClasses = 'subjectTypes';
						this.objClasses = 'objectTypes';
						this.rClass = 'resourceType';
						this.sClass = 'statementType';
						this.hClass = 'hierarchyType';
						this.pClass = 'propertyType';
						break;
					case '0.10.4':
					case '0.10.5':
					case '0.10.6':
					case '0.11.2':
						this.hClasses = 'hierarchyClasses';
						this.hClass = 'class';
					// no break
					default:
						this.rClasses = 'resourceClasses';
						this.sClasses = 'statementClasses';
						this.pClasses = 'propertyClasses';
						this.subClasses = 'subjectClasses';
						this.objClasses = 'objectClasses';
						this.rClass = 'class';
						this.sClass = 'class';
						this.pClass = 'class'
				};
				if (ver) {
					// for all versions <1.0:
					this.frct = 'accuracy';
					this.minI = 'min';
					this.maxI = 'max'
				} 
				else {
					// starting SpecIF v1.0:
					this.frct = 'fractionDigits';
					this.minI = 'minInclusive';
					this.maxI = 'maxInclusive'
				};
			}
		}
		let names = new ItemNames(spD.specifVersion);

		let iD:SpecIF = {};
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
			return; // undefined 
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
			function dT2int( iE ):DataType {
				var oE:any = i2int( iE );
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
							oE.values = forAll( iE.values, (v):EnumeratedValue =>{
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
			function pC2int( iE ):PropertyClass {
				var oE:any = i2int( iE );
				oE.title = cleanValue(iE.title);	// an input file may have titles which are not from the SpecIF vocabulary.
				if( iE.description ) oE.description = cleanValue(iE.description);
				if( iE.value ) oE.value = cleanValue(iE.value);
				oE.dataType = iE.dataType;
				let dT:DataType = itemById( iD.dataTypes, iE.dataType );
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
			function rC2int( iE ):ResourceClass {
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
		function sC2int(iE): StatementClass {
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
				var dT:DataType = dataTypeOf(iD, iE[names.pClass]), 
					oE = {
						// no id
						class: iE[names.pClass]
					};
				if( iE.title ) oE.title = cleanValue(iE.title);
				if( iE.description ) oE.description = cleanValue(iE.description);

				switch( dT.type ) {
					case 'xs:string':
					case 'xhtml':
						oE.value = cleanValue( iE.value );
						oE.value = Array.isArray(oE.value)?
							// multiple languages:
							forAll( oE.value, 
								( val )=>{ 
									val.text = uriBack2slash( val.text ); 
									return val;  
								})
							// single language:
							: uriBack2slash( oE.value );
						break;
					default:
						// According to the schema, all property values are represented by a string
						// and internally they are stored as string as well to avoid inaccuracies
						// by multiple transformations:
						oE.value = cleanValue(iE.value);
				};
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
			function r2int( iE ):Resource {
				var oE = a2int( iE );
				oE['class'] = iE[names.rClass];
//				console.debug('resource 2int',iE,simpleClone(oE));
				return oE
			}
			// a statement:
			function s2int( iE ):Statement {
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
				} 
				else {
					// starting v0.10.8:
					var iH = i2int( eH );
					iH.resource = eH.resource
				};

				// SpecIF allows resource references with id alone or with  a key (id+revision):
				iH.nodes = forAll( eH.nodes, n2int );
//				console.debug('hierarchy 2int',eH,iH);
				return iH

				// a hierarchy node:
				function n2int( eN ):Node {
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
				oF.title = iF.title? iF.title.replace(/\\/g,'/') : iF.id;
				// store the blob and it's type:
				if( iF.blob ) {
					oF.type = iF.blob.type || iF.type || attachment2mediaType( iF.title );
					oF.blob = iF.blob;
				}
				else if( iF.dataURL ) {
					oF.type = iF.type || attachment2mediaType( iF.title );
					oF.dataURL = iF.dataURL;
				}
				else
					oF.type = iF.type;
				return oF
			}
	},
	toExt: ( iD:SpecIF, opts ):SpecIF =>{
		// transform iD (data in internal data format) to SpecIF;
		// if opts.targetLanguage has no value, all available languages are kept.

//		console.debug('toExt', iD, opts );
		// transform internal data to SpecIF:
		var spD:SpecIF = {
				id: iD.id,
				title: languageValueOf( iD.title, opts ),
				$schema: 'https://specif.de/v'+CONFIG.specifVersion+'/schema.json',
				generator: app.title,
				generatorVersion: CONFIG.appVersion
			},
			names = {
				// starting SpecIF v1.0:
				frct: 'fractionDigits',
				minI: 'minInclusive',
				maxI: 'maxInclusive'
			};

		if( iD.description ) spD.description = languageValueOf( iD.description, opts );
		
		if( iD.rights && iD.rights.title && iD.rights.url ) {
			spD.rights = iD.rights;
			if( !iD.type ) spD.type = "dcterms:rights";
		}
		else
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
				spD.createdBy.org = {organizationName: app.me.organization};
		}
		else {
			if( iD.createdBy && iD.createdBy.email && iD.createdBy.email.value )  {
				spD.createdBy = {
					familyName: iD.createdBy.familyName,
					givenName: iD.createdBy.givenName,
					email: {type:"text/html",value:iD.createdBy.email.value}
				};
				if( iD.createdBy.org && iD.createdBy.org.organizationName )
					spD.createdBy.org = iD.createdBy.org;
			};
			// else: don't add createdBy without data
		};
		
		// Now start to assemble the SpecIF output:
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

		// Check whether all statements reference resources or statements, which are listed.
		// Obviously this check can only be done at the end ..
		let lenBefore: number;
		do {
			lenBefore = spD.statements.length;
			spD.statements = spD.statements.filter(
				(s) => {
					return (indexById(spD.resources, itemIdOf(s.subject)) > -1
							|| indexById(spD.statements, itemIdOf(s.subject)) > -1)
						&& (indexById(spD.resources, itemIdOf(s.object)) > -1
							|| indexById(spD.statements, itemIdOf(s.object)) > -1)
				}
			);
			console.info("Suppressed " + (lenBefore-spD.statements.length)+" statements, because subject or object are not listed.");
		}
		while (spD.statements.length<lenBefore);

		// Add a resource as hierarchyRoot, if needed.
		// It is assumed, 
		// - that in general SpecIF data do not have a hierarchy root with meta-data.
		// - that ReqIF specifications (=hierarchyRoots) are transformed to regular resources on input.
			function outlineTypeIsNotHidden(hPL?):boolean {
				if( !hPL || hPL.length<1 ) return true;
				for( var i=hPL.length-1;i>-1;i-- ) {
					if( hPL[i].title==CONFIG.propClassType
						&& (typeof(hPL[i].value)!='string' || hPL[i].value==CONFIG.resClassOutline ) )
							return false;
				};
				return true;
			}
		if( opts.createHierarchyRootIfNotPresent && aHierarchyHasNoRoot(spD) ) {

			console.info("Adding a hierarchyRoot");
			addE("resourceClass","RC-HierarchyRoot",spD);

			// ToDo: Let the program derive the referenced class ids from the above
			addE("propertyClass","PC-Type",spD);
			addE("propertyClass","PC-Description",spD);
			addE("propertyClass","PC-Name",spD);
			addE("dataType","DT-ShortString",spD);
			addE("dataType","DT-Text",spD);

			var res = {
				id: 'R-' + simpleHash(spD.id),
					title: spD.title,
					class: "RC-HierarchyRoot",
					properties: [{
						class: "PC-Name",
						value: spD.title
					}],
					changedAt: spD.changedAt
			};
			// Add the resource type, if it is not hidden:
			let rC = itemById( spD.resourceClasses, "RC-HierarchyRoot" );
			if( outlineTypeIsNotHidden( opts.hiddenProperties ) ) {
				addP( res, {
						class: "PC-Type",
						value: rC.title // should be CONFIG.resClassOutline
				});
			};
			// Add a description property only if it has a value:
			if( spD.description ) 
				addP( res, {
						class: "PC-Description",
						value: spD.description
				});
			spD.resources.push( r2ext(res) );
			// create a new root instance:
			spD.hierarchies = [{
					id: "H-"+res.id,
					resource: res.id,
					// .. and add the previous hierarchies as children:
					nodes: spD.hierarchies,
					changedAt: spD.changedAt
			}];
		};
		
		// ToDo: schema and consistency check (if we want to detect any programming errors)
//		console.debug('specif.toExt exit',spD);
		return spD

			function aHierarchyHasNoRoot(dta):boolean {
				for( var i=dta.hierarchies.length-1;i>-1;i-- ) {
					let hR = itemById( dta.resources, dta.hierarchies[i].resource );
					if( !hR ) {
						throw "Hierarchy '",dta.hierarchies[i].id,"' is corrupt";
					};
					let	prpV = valByTitle( hR, CONFIG.propClassType, dta ),
						hC = itemById( dta.resourceClasses, hR['class'] );
					// The type of the hierarchy root can be specified by a property titled CONFIG.propClassType
					// or by the title of the resourceClass:
					if( (!prpV || CONFIG.hierarchyRoots.indexOf( prpV )<0) 
						&& (!hC || CONFIG.hierarchyRoots.indexOf( hC.title )<0) )
						return true;
				};
				return false;
			}	
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
				return oE;
			}
			// a data type:
		function dT2ext( iE ) {
				var oE: DataType = i2ext( iE );
				oE.type = iE.type;
				switch( iE.type ) {
					case "xs:double":
						if( iE.fractionDigits ) oE[names.frct] = iE.fractionDigits;
					case "xs:integer":
						if( typeof(iE.minInclusive)=='number' ) oE[names.minI] = iE.minInclusive;
						if( typeof(iE.maxInclusive)=='number' ) oE[names.maxI] = iE.maxInclusive;
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
			function pC2ext(iE) {
				var oE: PropertyClass = i2ext(iE);
				if( iE.value ) oE.value = iE.value;  // a default value
				oE.dataType = iE.dataType;
				let dT = itemById( spD.dataTypes, iE.dataType );
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
				var oE:ResourceClass = aC2ext( iE );
				// Include "isHeading" in SpecIF only if true:
				if( iE.isHeading ) oE.isHeading = true;
				return oE
			}
			// a statement class:
			function sC2ext( iE ) {
				var oE:StatementClass = aC2ext( iE );
				if( iE.isUndirected ) oE.isUndirected = iE.isUndirected;
				if( iE.subjectClasses && iE.subjectClasses.length>0 ) oE.subjectClasses = iE.subjectClasses;
				if( iE.objectClasses && iE.objectClasses.length>0 ) oE.objectClasses = iE.objectClasses;
				return oE
			}
			// a property:
			function p2ext( iE ) {
				// skip empty properties:
				if( !iE.value ) return;	
				
				// skip hidden properties:
				let pC: PropertyClass = itemById(spD.propertyClasses, iE['class']);
				if( Array.isArray( opts.hiddenProperties ) ) {
				//	CONFIG.hiddenProperties.forEach( (hP)=>{
					opts.hiddenProperties.forEach( (hP)=>{
						if( hP.title==(iE.title||pC.title) && (hP.value==undefined || hP.value==iE.value ) ) return;
					});
				};
				
				var oE:Property = {
					// no id
					class:  iE['class']
				};
				if( iE.title ) {
					// skip the property title, if it is equal to the propertyClass' title:
					let ti = titleOf( iE, opts );
					if( ti!=pC.title ) oE.title = ti;
				};
				if( iE.description ) oE.description = languageValueOf( iE.description, opts );

				// According to the schema, all property values are represented by a string
				// and we want to store them as string to avoid inaccuracies by multiple transformations:
				if( opts.targetLanguage ) {
					// reduce to the selected language; is used for generation of human readable documents
					// or for formats not supporting multiple languages:
					let dT:DataType = dataTypeOf( spD, iE['class'] );
					switch( dT.type ) {
						case 'xs:string':
						case 'xhtml':
							if( opts.targetLanguage ) {
								if (CONFIG.excludedFromFormatting.indexOf(iE.title || pC.title) > -1)
									// if it is e.g. a title, remove all formatting:
									oE.value = stripHTML(languageValueOf(iE.value, opts)
													.replace(/^\s+/, ""));
								else
									// otherwise transform to HTML, if possible;
									// especially for publication, for example using WORD format:
									oE.value = makeHTML( 
													languageValueOf( iE.value, opts )
														.replace( /^\s+/, "" ), 
													opts 
												);
								
								// remove any leading whiteSpace:
								oE.value = oE.value.replace( /^\s+/, "" );
//								console.debug('p2ext',iE,languageValueOf( iE.value, opts ),oE.value);
								break;
							};
							// else: no break - return the original value
						default:
							//	in case of 'xs:enumeration', 
							//  an id of the dataType's value is given, so it can be taken directly:
							oE.value = iE.value;
					};
				} 
				else {
					// for SpecIF export, keep full data structure:
					oE.value = iE.value;
				};
				// properties do not have their own revision and change info; the parent's apply.
				return oE;
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
				var oE:Resource = a2ext( iE );
//				console.debug('resource 2int',iE,oE);
				return oE;
			}
			// a statement:
			function s2ext( iE ) {
//				console.debug('statement2ext',iE.title);
				// Skip statements with an open end;
				// At the end it will be checked, wether all referenced resources resp. statements are listed:
				if( !iE.subject || itemIdOf(iE.subject)==CONFIG.placeholder 
					|| !iE.object || itemIdOf(iE.object)==CONFIG.placeholder
				) return;

				// The statements usually do use a vocabulary item (and not have an individual title),
				// so we lookup, if so desired, e.g. when exporting to ePub:
				var oE:Statement = a2ext( iE );

				// Skip the title, if it is equal to the statementClass' title;
				// ToDo: remove limitation of single language.
				if( oE.title && typeof(oE.title)=="string" ) {
					let sC = itemById( spD.statementClasses, iE['class']);
					if( typeof(sC.title)=="string" && oE.title==sC.title )
						delete oE.title;
				};

				if( iE.isUndirected ) oE.isUndirected = iE.isUndirected;
				// for the time being, multiple revisions are not supported:
				if( opts.revisionDate ) {
					// supply only the id, but not a key:
					oE.subject = itemIdOf(iE.subject);
					oE.object = itemIdOf(iE.object);
				} 
				else {
					// supply key or id:
					oE.subject = iE.subject;
					oE.object = iE.object;
				};
				return oE;
			}
			// a hierarchy node:
			function n2ext( iN ) {
//				console.debug( 'n2ext', iN );
				// just take the non-redundant properties (omit 'title', for example):
				let eN:Node = {
					id: iN.id,
					changedAt: iN.changedAt
				};
				// for the time being, multiple revisions are not supported:
				if( opts.revisionDate ) {
					// supply only the id, but not a key:
					eN.resource = itemIdOf(iN.resource)
				} 
				else {
					// supply key or id:
					eN.resource = iN.resource
				};
				if( iN.nodes && iN.nodes.length>0 )
					eN.nodes = forAll(iN.nodes,n2ext);
				if( iN.revision ) 
					eN.revision = iN.revision;
				return eN
			}
			// a hierarchy:
			function h2ext( iH ):Node {
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
