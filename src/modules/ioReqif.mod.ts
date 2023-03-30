/*!	ReqIF import and export
	Dependencies: -
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)

	Limitations:
	- It is assumed that all text values within the provided SpecIF data set have only a single language,
	  so a "SpecifMultiLanguageText" array has a single entry only.
	- SpecIF v1.1 supports multiple values per property, but ReqIF does not. 
	  For the time being, only the first value is picked for transformation.

	ToDo: escapeXML the content. See toXHTML.
	ToDo: Design the ReqIF import and export such that a roundtrip works; neither loss nor growth is acceptable.
*/

// Constructor for ReqIF import and export:
// (A module constructor is needed, because there is an access to parent's data via 'self.parent..')
moduleManager.construct({
	name: 'ioReqif'
}, (self:ITransform) =>{
	"use strict";
	let mime,
		zipped:boolean,
//		template,	// a new Id is given and user is asked to input a project-name
		opts:any,
		errNoOptions = new xhrMessage( 896, 'No options or no mediaTypes defined.' ),
		errNoReqifFile = new xhrMessage( 897, 'No ReqIF file in the reqifz container.' ),
        //errInvalidJson = { status: 900, statusText: 'SpecIF data is not valid JSON.' },
		errInvalidXML = new xhrMessage( 898, 'ReqIF data is not valid XML.' );
		
	self.init = (options:any):boolean =>{
		mime = undefined;
		opts = options;
		return true;
	};

	self.verify = ( f:File ):boolean =>{
			// Verify the type (and eventually the content) of a ReqIF import file:
	
			function reqifFile2mediaType( fname:string ):string|undefined {
				if( fname.endsWith('.reqifz') || fname.endsWith('.reqif.zip') ) {
					zipped = true;
					return 'application/zip';
				};
				if( fname.endsWith('.reqif') ) {
					zipped = false;
					return 'application/xml';
				};
				return; // undefined
			}
				
		mime = reqifFile2mediaType( f.name );
		if ( mime )
			return true;
		// else:
		message.show( i18n.lookup('ErrInvalidFileReqif', f.name) );
		return false;
	};
	self.toSpecif = (buf: ArrayBuffer): JQueryDeferred<SpecIF> => {
		// Transform ReqIF to SpecIF for import:
		// buf is an array-buffer containing reqif data:
//		console.debug('ioReqif.toSpecif');
		//self.abortFlag = false;
		let zDO = $.Deferred(),
			fileL = [],
			resL:SpecIF[] = [],
			pend = 0;

		if( zipped ) {
			// @ts-ignore - JSZIP is loaded at runtime
			new JSZip().loadAsync(buf)
			.then( (zip:any) =>{
				// @ts-ignore - all's fine, no need to re-declare the zip interface.
				fileL = zip.filter( (relPath, file) => {return file.name.endsWith('.reqif')});

				if( fileL.length < 1 ) {
					zDO.reject( errNoReqifFile );
					return zDO
				};
//				console.debug('iospecif.toSpecif 1',fileL[0].name);

				// transform all reqif files found:
				pend = fileL.length;
				for( var i=fileL.length-1;i>-1;i-- ) {
					zip.file( fileL[i].name ).async("string")
					.then( (dta:any) =>{
						// Check if data is valid XML:
						// Please note:
						// - the file may have a UTF-8 BOM
						// - all property values are encoded as string, even if boolean, integer or double.

						if (!validateXML(dta)) {
							//console.debug(dta)
							zDO.reject( errInvalidXML );
							return zDO;
						};
						// XML data is valid:
						// @ts-ignore - transformReqif2Specif() is loaded at runtime
						let result = transformReqif2Specif(dta, { translateTitle: vocabulary.property.specif });
						if (result.status != 0) {
							//console.debug(dta)
							zDO.reject(result);
							return zDO;
						};

						// ReqIF data is valid:
						// @ts-ignore - transformReqif2Specif() is loaded at runtime
						resL.unshift( result.response );

						// add all other files (than reqif) to the last specif data set:
						if( --pend<1 )
							if( opts && typeof( opts.mediaTypeOf ) == 'function' ) {
								// First load the files, so that they get a lower revision number as the referencing resources.
								// Create a list of all attachments:
								// @ts-ignore - relPath is never read, but must be specified anyways
								fileL = zip.filter( (relPath, file) =>{return !file.name.endsWith('.reqif')});
//								console.debug('iospecif.toSpecif 2',fileL);
								if( fileL.length > 0 ) {
									// add the files to the first specif data set:
									resL[0].files = [];
									pend = fileL.length;
									fileL.forEach( (aFile:any) =>{ 
													// skip directories:
													if( aFile.dir ) { pend--; return false };

													let type = opts.mediaTypeOf(aFile.name);
												   // skip files with unknown mediaTypes:
													if( !type ) { pend--; return false };
													
//													console.debug('iospecif.toSpecif 3',t,e.date,e.date.toISOString());
													zip.file(aFile.name).async("blob")
													.then( (f:Blob) =>{
														resL[0].files.push({ 
															blob: f, 
															id: 'F-' + simpleHash(aFile.name), 
															title: aFile.name, 
															type: type, 
															changedAt: aFile.date.toISOString() 
														});
//														console.debug('file',pend-1,e,data.files);
														if(--pend < 1)
															// now all files are extracted from the ZIP, so we can return the data:
															zDO.resolve( resL );
													}) 
									});
									if( pend < 1 ) 
										// no suitable file found, continue anyways:
										zDO.resolve( resL );	
								} 
								else {
									// no files with permissible types are supplied:
									zDO.resolve( resL );
								};
							} 
							else {
								// no function for filtering and mapping the mediaTypes supplied:
								console.error(errNoOptions.statusText);
								// but import anyways:
								zDO.resolve( resL );
							};
					});
				};
			});
		} 
		else {
			// Cut-off UTF-8 byte-order-mask ( 3 bytes xEF xBB xBF ) at the beginning of the file, if present. ??
			// The resulting data before parsing must be a JSON string enclosed in curly brackets "{" and "}".

            // Selected file is not zipped - it is expected to be ReqIF data in XML format.
			// Check if data is valid XML:
                
			let str = LIB.ab2str(buf);
            if( validateXML(str) ) {
				// transformReqif2Specif gibt string zurück
				// @ts-ignore - transformReqif2Specif() is loaded at runtime
				var result = transformReqif2Specif(str, { translateTitle: vocabulary.property.specif });
				if (result.status == 0)
					zDO.resolve(result.response)
				else
					zDO.reject(result);

			}
			else {
				zDO.reject(errInvalidXML);
			}
		};
		return zDO;

		function validateXML(xml_data:string):boolean {
			if (window.DOMParser) {
				let parser = new DOMParser();
				let xmlDoc = parser.parseFromString(xml_data,"text/xml");
				return xmlDoc.getElementsByTagName('parsererror').length<1
			};
			throw Error("Browser is too old; it does not offer window.DOMParser.");
		}
	};
		
	self.fromSpecif = ( pr:SpecIF, opts?:any ):string =>{
		// Transform pr to ReqIF,
		// where pr is a SpecIF data in JSON format (not the internal cache):
		// ToDo:
		// - transform any default values
		// - suppress or replace xhtml-tags not supported by ReqIF, e.g. <img>
		// - in ReqIF an attribute named "Reqif.ForeignId" serves the same purpose as 'alterId':

//		console.debug( 'ioReqif.fromSpecif', simpleClone(pr) );

		// Check for missing options:
		if( typeof(opts)!='object' ) opts = {};
		if( !Array.isArray(opts.hierarchyRoots) ) opts.hierarchyRoots = ['SpecIF:Outline','SpecIF:HierarchyRoot','SpecIF:Hierarchy','SpecIF:BillOfMaterials'];


		const
			RE_hasDiv = /^<([a-z]{1,6}:)?div>.+<\/([a-z]{1,6}:)?div>$/,
			RE_class = / class=\"[^\"]+\"/g,
			RE_objectName = /(<object[^>]*) name=\"[^\"]+\"/g,
			RE_objectId = /(<object[^>]*) id=\"[^\"]+\"/g,
			RE_aTarget = /(<a[^>]*) target=\"[^\"]+\"/g,
			
			date = new Date().toISOString(),
			ns = 'xhtml';

		// ------------------------------------------------------------------------------
		// PREPARATION
		//
		// SpecIF has *optional* items which are *required* for ReqIF;
		// these are complemented in the following.
		//    - XHTML-formatted text has a special data type
		//    - A hierarchy root has already been added before the ReqIF export is called.

		// ReqIF does not allow media objects other than PNG.
		// Thus, provide a fall-back image with format PNG for XHTML objects pointing to any other media object.
		// ToDo!

		// Text may be XHTML-formatted, even if it is not properly assigned in attribute 'format'.
		// So change all propertyClasses of dataType 'xs:string' to 'xhtml', 
		// if XHTML-formatted text exists in at least one instance.

			const
				dTFormattedText = {
					// DEPRECATED for SpecIF, but needed for ReqIF:
					id: "DT-FormattedText",
					title: "XHTML formatted text",
					description: [{ text: "This dataType is beyond SpecIF; it has been added by ioReqif specifically for the SpecIF to ReqIF transformation." }],
					type: "xhtml",
					changedAt: "2020-11-06T08:59:00+02:00"
				};

			function specializeClassToFormattedText(ctg: string, eC: SpecifResourceClass | SpecifStatementClass): void {
				// get all instances of eC:
				//	if( eC.subjectClasses ) .. subjectClasses are mandatory and cannot serve to recognize the category ...

					function withHtml(L: SpecifResource[] | SpecifStatement[], k: SpecifKey): boolean {
						// for all elements (resources or statements) in list L, 
						// check whether a property of the given propertyClass id
						// has HTML content; a single occurrence is sufficient: 
						for( var l of L ) {
							if( l.properties )
								for( var prp of l.properties ) {
									// check only the property with the specified class:
									if (LIB.equalKey(prp['class'], k) && LIB.isHTML((prp.values[0] as SpecifMultiLanguageText)[0].text) ) return true;
								};
						};
						return false;
					}

				if( eC.propertyClasses ) {
					// list elements, i.e. resources or statements, of a certain class:
					let eL = ctg=='statementClass'? 
							pr.statements.filter((sta) => { return LIB.references(sta['class'], eC ) } )
							: pr.resources.filter((res) => { return LIB.references(res['class'], eC ) } ),
						pC;
//					console.debug( 'specializeClassToFormattedText', ctg, eC, eL );

					eC.propertyClasses.forEach( (pCk)=>{
						pC = LIB.itemByKey( pr.propertyClasses, pCk );
						// Has any given property value of the listed resources or statements XHTML-content:
						if ((LIB.itemByKey(pr.dataTypes, pC.dataType).type == SpecifDataTypeEnum.String) && withHtml(eL, pCk)) {
//							console.debug( 'specializeClassToFormattedText', eC, pC );
							console.info("Specializing propertyClass for formatted text to element with title '"+pCk.id+"'");
							// specialize propertyClass to "DT-Text"; this is perhaps too radical, 
							// as *all* resourceClasses/statementClasses using this propertyClass are affected:
							pC.dataType = LIB.makeKey(dTFormattedText.id);
							pC.format = "xhtml";
						//	standardTypes.addTo("dataType",pC.dataType,pr);
							LIB.cacheE(pr.dataTypes, dTFormattedText);
						};
					});
				};
			}
		pr.resourceClasses.forEach( (rC)=>{ specializeClassToFormattedText('resourceClass',rC) });
		pr.statementClasses.forEach( (sC)=>{ specializeClassToFormattedText('statementClass',sC) });
//		console.debug('pr 3',simpleClone(pr));

		// ------------------------------------------------------------------------------
		// TRANSFORMATION
		//
		// After the preparation, begin to convert:
		var xml = 
				'<?xml version="1.0" encoding="UTF-8"?>'
			+	'<REQ-IF xmlns="http://www.omg.org/spec/ReqIF/20110401/reqif.xsd" xmlns:'+ns+'="http://www.w3.org/1999/xhtml">'
			+	'<THE-HEADER>'
			+	  '<REQ-IF-HEADER IDENTIFIER="'+pr.id+'">'
		//	+		'<COMMENT>'+(pr.description || '')+'</COMMENT>'
					// the project description is made available in the resource referenced by first hierarchy root:
			+		'<COMMENT></COMMENT>'
			+		'<CREATION-TIME>'+date+'</CREATION-TIME>'
			+		'<REQ-IF-TOOL-ID></REQ-IF-TOOL-ID>'
			+		'<REQ-IF-VERSION>1.2</REQ-IF-VERSION>'
			+		'<SOURCE-TOOL-ID>'+(pr.generator || '')+'</SOURCE-TOOL-ID>'
			+		'<TITLE>'+pr.title+'</TITLE>'
			+	  '</REQ-IF-HEADER>'
			+	'</THE-HEADER>'
			+	'<CORE-CONTENT>'
			+	  '<REQ-IF-CONTENT>'
			+		'<DATATYPES>';
		
		// 1. Transform dataTypes:
		if (pr.dataTypes)
			pr.dataTypes.forEach((dT: SpecifDataType) => {
				if (dT.enumeration) {
					// Limitation: Whereas SpecIF may have enumerated values of any dataType except xs:boolean,
					// ReqIF only has one specific DATATYPE ENUMERATION with implicit data-type string.
					// So, SpecIF enumerations of all dataTypes are mapped to the single ReqIF ENUMERATION.
					xml += '<DATATYPE-DEFINITION-ENUMERATION ' + commonAttsOf(dT) + '>' +
						'<SPECIFIED-VALUES>';
					dT.enumeration.forEach((val, i) => {
						xml += '<ENUM-VALUE IDENTIFIER="' + val.id + '" LONG-NAME="' + (Array.isArray(val.value) ? val.value[0].text : val.value) + '" LAST-CHANGE="' + dateTime(dT) + '" >' +
							'<PROPERTIES><EMBEDDED-VALUE KEY="' + i + '" OTHER-CONTENT="" /></PROPERTIES>' +
							'</ENUM-VALUE>';
					});
					xml += '</SPECIFIED-VALUES>' +
						'</DATATYPE-DEFINITION-ENUMERATION>';
					return;
				};
				// else:
				switch (dT.type) {
					case SpecifDataTypeEnum.Boolean:
						xml += '<DATATYPE-DEFINITION-BOOLEAN ' + commonAttsOf(dT) + '/>';
						break;
					case SpecifDataTypeEnum.Integer:
						xml += '<DATATYPE-DEFINITION-INTEGER ' + commonAttsOf(dT)
							+ ' MAX="' + (typeof (dT.maxInclusive) == 'number' ? dT.maxInclusive : CONFIG.maxInteger)
							+ '" MIN="' + (typeof (dT.minInclusive) == 'number' ? dT.minInclusive : CONFIG.minInteger)
							+ '" />';
						break;
					case SpecifDataTypeEnum.Double:
						xml += '<DATATYPE-DEFINITION-REAL ' + commonAttsOf(dT)
							+ ' MAX="' + (typeof (dT.maxInclusive) == 'number' ? dT.maxInclusive : CONFIG.maxReal)
							+ '" MIN="' + (typeof (dT.minInclusive) == 'number' ? dT.minInclusive : CONFIG.minReal)
							+ '" ACCURACY="' + (typeof (dT.fractionDigits) == 'number' ? dT.fractionDigits : CONFIG.maxAccuracy)
							+ '" />';
						break;
					case SpecifDataTypeEnum.DateTime:
						xml += '<DATATYPE-DEFINITION-DATE ' + commonAttsOf(dT) + '/>';
						break;
					case SpecifDataTypeEnum.AnyUri:
					case SpecifDataTypeEnum.Duration:
						// Remember that pr is supposed to arrive with a single selected language, here:
						let info = JSON.stringify({ SpecIF_DataType: dT.type });
						if (LIB.isMultiLanguageText(dT.description) && dT.description.length>0)
							dT.description[0].text += '\n' + info
						else
							dT.description = LIB.makeMultiLanguageText(info);
						// no break
					case SpecifDataTypeEnum.String:
						xml += '<DATATYPE-DEFINITION-STRING '+commonAttsOf( dT )+' MAX-LENGTH="'+(dT.maxLength||CONFIG.maxStringLength)+'" />';
						break;
					// @ts-ignore - this is only used in ioReqif
					case 'xhtml':
						xml += '<DATATYPE-DEFINITION-XHTML ' + commonAttsOf(dT) + '/>';
						break;
					default:
						console.error('Error: unknown dataType: '+dT.type);
				};
			});
		xml +=  '</DATATYPES>'
			+	'<SPEC-TYPES>';
			
		// 2. Separate resourceClasses to make SPEC-OBJECT-TYPEs and SPECIFICATION-TYPEs, 
		//    and collect resources to make OBJECTS:
		class separatedHierarchyClasses {
			objTypes: SpecifResourceClass[] = [];
			spcTypes: SpecifResourceClass[] = [];
			objects: SpecifResource[] = []
		};
		let separatedHC = new separatedHierarchyClasses;

			function prepObj(n: SpecifNode): void {
				let r = LIB.itemByKey(pr.resources,n.resource) as SpecifResource,
					rC = LIB.itemByKey(pr.resourceClasses, r['class']) as SpecifResourceClass;
				// a) Collect resourceClass without duplication:
				if( LIB.indexById(separatedHC.objTypes,rC.id)<0 ) {
					// ReqIF does not support inheritance, so include any properties of an ancestor:
					if( rC['_extends'] ) {
						let anc = LIB.itemByKex(pr.resourceClasses,rC['_extends']);
						if( Array.isArray(anc.propertyClasses) ) {
							if ( Array.isArray(rC.propertyClasses) ) 
								rC.propertyClasses = anc.propertyClasses.concat(rC.propertyClasses);
							else
								rC.propertyClasses = anc.propertyClasses;
						};
					};
					// ToDo: Support multi-level inheritance
					separatedHC.objTypes.push( rC );
				};
				// b) Collect resource without duplication:
				if( LIB.indexById(separatedHC.objects,r.id)<0 ) 
					// ToDo: Sort properties according to the propertyClasses
					separatedHC.objects.push( r );
			}
		// First, collect all resources referenced by the hierarchies,
		// ignore the hierarchy roots here, they are handled further down:
		pr.hierarchies.forEach( (h) =>{
			if( h.nodes )
				h.nodes.forEach( (n) =>{
					iterate( n, prepObj );
				});
		});
//		console.debug( 'after collecting referenced resources: ', xml, separatedHC );

		// Then, have a look at the hierarchy roots:
		pr.hierarchies.forEach( (h) =>{
			// The resources referenced at the lowest level of hierarchies (the 'roots')
			// are SPECIFICATIONS in terms of ReqIF.
			// If a resourceClass is shared between a ReqIF OBJECT and a ReqIF SPECIFICATION, 
			// it must have a different id:
			let hR = LIB.itemByKey( pr.resources, h.resource ) as SpecifResource,			// the resource referenced by this hierarchy root
				hC = LIB.itemByKey( pr.resourceClasses, hR['class'] ) as SpecifResourceClass;	// it's class
			
			if (LIB.referenceIndexBy(separatedHC.objects, 'class', hC) > -1) {
				// The hierarchy root's class is shared by a resource:
				hC = simpleClone(hC);  
				hC.id = 'HC-'+hC.id;
				// ToDo: If somebody uses interitance with 'extends' in case of a hierarchy root classes, 
				// we need to update all affected 'extend' properties. There is rather improbable, though.
			};
			// Collect hierarchy root's class without duplication:
			if( LIB.indexById(separatedHC.spcTypes,hC.id)<0 )
				separatedHC.spcTypes.push( hC );
			
			// add the resources attributes to the hierarchy root:
			h.id = hR.id;  // the resource's id takes precedence
		//	h.title = hR.title || '';
		//	h.description = hR.description || '';
			// @ts-ignore - index is ok:
			h['class'] = LIB.keyOf(hC);
			// @ts-ignore - the ReqIF SPECIFICATION root elements *have* properties
			if( hR.properties ) h.properties = hR.properties;
			// further down, only the resources referenced by the children will be included as OBJECT,
			// so there is no need to delete the resource originally representing the hierarchy root.
		});
//		console.debug( 'reqSort', separatedHC );
		
		// 3. Transform resourceClasses to OBJECT-TYPES:
		separatedHC.objTypes.forEach( (oT) =>{
			xml += '<SPEC-OBJECT-TYPE '+commonAttsOf( oT )+'>'
				+		attrTypesOf( oT )
				+ '</SPEC-OBJECT-TYPE>';
		});
		
		// 4. Transform statementClasses to RELATION-TYPES:
		if(pr.statementClasses)	
			pr.statementClasses.forEach( (sC) =>{
			/*	// ToDo: transform only the statementClasses
				// - having at least one resourceClass in each subjectClasses and objectClasses
				//   ... unless subjectClasses or objectClasses are missing.
				// Note that both subjectClasses or objectClasses are not transformed, themselves.
				// However, currently (2021), 
				// - Only the "shows" statement is used to relate diagrams and resources plus statements,
				//   this means that the statementClass titled 'SpecIF:shows' must be transformed.
				// - There are *no* statementClasses allowing only statements as subject or object,
				//   so there is no known statementClass which should be excluded from transformation.
				// Therefore we do not implement the check at this point in time.  */
				xml += '<SPEC-RELATION-TYPE ' + commonAttsOf(sC) + '>'
					+ attrTypesOf(sC)
					+ '</SPEC-RELATION-TYPE>';
			});
		
		// 5. Write SPECIFICATION-TYPES:
		separatedHC.spcTypes.forEach( (hC) =>{
			xml += '<SPECIFICATION-TYPE '+commonAttsOf( hC )+'>'
				+		attrTypesOf( hC )
				+  '</SPECIFICATION-TYPE>';
		}); 
		xml +=  '</SPEC-TYPES>'
			+	'<SPEC-OBJECTS>';
		
		// 6. Transform resources to OBJECTS:
		separatedHC.objects.forEach( (r:SpecifResource) =>{
			xml += '<SPEC-OBJECT '+commonAttsOf( r )+'>'
				+		'<TYPE><SPEC-OBJECT-TYPE-REF>'+r['class'].id+'</SPEC-OBJECT-TYPE-REF></TYPE>'
				+		attsOf( r )
				+ '</SPEC-OBJECT>';
		});
		xml +=  '</SPEC-OBJECTS>'
			+	'<SPEC-RELATIONS>';
		
		// 7. Transform statements to RELATIONs:
		pr.statements.forEach( (s) =>{
			// Skip all statements which relate to statements, which is not accepted by the ReqIF schema;
			// in other words, transform only statements whose subject and object relating to resources:
			if( LIB.indexByKey(pr.resources, s.object)>-1 && LIB.indexByKey(pr.resources, s.subject)>-1 ) {
				// SpecIF statements do not require a title, take the class' title by default:
				// @ts-ignore - set the title attribute for the sake of ReqIF
				s.title = LIB.itemByKey(pr.statementClasses, s['class']).title;
				xml += '<SPEC-RELATION ' + commonAttsOf(s) + '>'
					+ '<TYPE><SPEC-RELATION-TYPE-REF>' + s['class'].id + '</SPEC-RELATION-TYPE-REF></TYPE>'
					+ attsOf(s)
					+ '<SOURCE><SPEC-OBJECT-REF>' + s.subject.id + '</SPEC-OBJECT-REF></SOURCE>'
					+ '<TARGET><SPEC-OBJECT-REF>' + s.object.id + '</SPEC-OBJECT-REF></TARGET>'
					+ '</SPEC-RELATION>'
			};
		});
		xml +=  '</SPEC-RELATIONS>'
			+	'<SPECIFICATIONS>';
		
		// 8. Transform hierarchies to SPECIFICATIONs:
		pr.hierarchies.forEach( (h) =>{
			xml += '<SPECIFICATION '+commonAttsOf( h )+'>'
				// @ts-ignore - index is ok:
				+		'<TYPE><SPECIFICATION-TYPE-REF>'+h['class'].id+'</SPECIFICATION-TYPE-REF></TYPE>'
				// @ts-ignore - here, the hierarchy roots may have properties (taken from the hierarchy root's resource):
				+		attsOf( h )
				+   	childrenOf( h )
				+ '</SPECIFICATION>'
		});
		xml +=  '</SPECIFICATIONS>'
			+	'<SPEC-RELATION-GROUPS></SPEC-RELATION-GROUPS>'
			+ '</REQ-IF-CONTENT>'
		+	'</CORE-CONTENT>'
		+	'<TOOL-EXTENSIONS></TOOL-EXTENSIONS>'
		+	'</REQ-IF>';
/*		let blob = new Blob([xml], {type: "text/plain; charset=utf-8"});
		// save to file using fileSaver.js:
		saveAs(blob, "debug.reqif", true);		// true: no_auto_bom, i.e. suppress EF BB BF at the beginning of the file
		console.debug('reqif',xml);  */
		return xml;

			function dateTime(e: SpecifItem): string {
				return e.changedAt || pr.createdAt || date
			}
			function commonAttsOf(e: SpecifItem): string {
				// @ts-ignore - title does not always exist, but that's why it is checked: 
				return 'IDENTIFIER="' + e.id + '" LONG-NAME="' + (e.title ? e.title.stripHTML().escapeXML() : '') + '" DESC="' + (e.description && e.description[0] && e.description[0].text ? e.description[0].text.stripHTML().escapeXML():'')+'" LAST-CHANGE="'+dateTime(e)+'"'
			}
			function attrTypesOf(eC: SpecifResourceClass | SpecifStatementClass): string {
				if (!eC.propertyClasses || eC.propertyClasses.length < 1) return '<SPEC-ATTRIBUTES></SPEC-ATTRIBUTES>';
				// else
				var xml='<SPEC-ATTRIBUTES>';
				eC.propertyClasses.forEach((pCk) => {
					let pC = LIB.itemByKey(pr.propertyClasses, pCk),  // replace id by the item itself
						dT = LIB.itemByKey(pr.dataTypes, pC.dataType),
						adId = simpleHash(eC.id + pC.id);
					// SpecIF resourceClasses and statementClasses may share propertyClasses,
					// but in ReqIF every type has its own ATTRIBUTE-DEFINITIONs.
					// Issue: The attribute-definition ids are different from those on import, as the propertyClasses are consolidated/deduplicated;
					// If this is inacceptable, any propertyClass derived from a ReqIF ATTRIBUTE-DEFINITION must be excluded from deduplication 
					// - and here the original id must be taken, if the propertyClass is exclusively used by the respective resourceClass (OBJECT-TYPE) or statementClass (RELATION-TYPE).
					// - If it is changed here, it must be changed for the ATTRIBUTE-DEFINITION-REFs further down, as well.
					if (dT.enumeration) {
						// the property 'multiValued' in case of enumerated types must be specified in any case, because the ReqIF Server (like ReqIF) requires it. 
						// The property 'dataType.multiple' is invisible for the server. 
						xml += '<ATTRIBUTE-DEFINITION-ENUMERATION IDENTIFIER="PC-' + adId + '" LONG-NAME="' + vocabulary.property.reqif(pC.title) + '" MULTI-VALUED="' + multipleChoice(pC, pr) + '" LAST-CHANGE="' + dateTime(pC) + '">'
							+ '<TYPE><DATATYPE-DEFINITION-ENUMERATION-REF>' + dT.id + '</DATATYPE-DEFINITION-ENUMERATION-REF></TYPE>'
							+ '</ATTRIBUTE-DEFINITION-ENUMERATION>'
					}
					else {
						switch (dT.type) {
							case SpecifDataTypeEnum.Boolean:
								xml += '<ATTRIBUTE-DEFINITION-BOOLEAN IDENTIFIER="PC-' + adId + '" LONG-NAME="' + vocabulary.property.reqif(pC.title) + '" LAST-CHANGE="' + dateTime(pC) + '">'
									+ '<TYPE><DATATYPE-DEFINITION-BOOLEAN-REF>' + dT.id + '</DATATYPE-DEFINITION-BOOLEAN-REF></TYPE>'
									+ '</ATTRIBUTE-DEFINITION-BOOLEAN>'
								break;
							case SpecifDataTypeEnum.Integer:
								xml += '<ATTRIBUTE-DEFINITION-INTEGER IDENTIFIER="PC-' + adId + '" LONG-NAME="' + vocabulary.property.reqif(pC.title) + '" LAST-CHANGE="' + dateTime(pC) + '">'
									+ '<TYPE><DATATYPE-DEFINITION-INTEGER-REF>' + dT.id + '</DATATYPE-DEFINITION-INTEGER-REF></TYPE>'
									+ '</ATTRIBUTE-DEFINITION-INTEGER>'
								break;
							case SpecifDataTypeEnum.Double:
								xml += '<ATTRIBUTE-DEFINITION-REAL IDENTIFIER="PC-' + adId + '" LONG-NAME="' + vocabulary.property.reqif(pC.title) + '" LAST-CHANGE="' + dateTime(pC) + '">'
									+ '<TYPE><DATATYPE-DEFINITION-REAL-REF>' + dT.id + '</DATATYPE-DEFINITION-REAL-REF></TYPE>'
									+ '</ATTRIBUTE-DEFINITION-REAL>'
								break;
							case SpecifDataTypeEnum.String:
								xml += '<ATTRIBUTE-DEFINITION-STRING IDENTIFIER="PC-' + adId + '" LONG-NAME="' + vocabulary.property.reqif(pC.title) + '" LAST-CHANGE="' + dateTime(pC) + '">'
									+ '<TYPE><DATATYPE-DEFINITION-STRING-REF>' + dT.id + '</DATATYPE-DEFINITION-STRING-REF></TYPE>'
									+ '</ATTRIBUTE-DEFINITION-STRING>'
								break;
							case 'xhtml':
								xml += '<ATTRIBUTE-DEFINITION-XHTML IDENTIFIER="PC-' + adId + '" LONG-NAME="' + vocabulary.property.reqif(pC.title) + '" LAST-CHANGE="' + dateTime(pC) + '">'
									+ '<TYPE><DATATYPE-DEFINITION-XHTML-REF>' + dT.id + '</DATATYPE-DEFINITION-XHTML-REF></TYPE>'
									+ '</ATTRIBUTE-DEFINITION-XHTML>'
								break;
							case SpecifDataTypeEnum.DateTime:
								xml += '<ATTRIBUTE-DEFINITION-DATE IDENTIFIER="PC-' + adId + '" LONG-NAME="' + vocabulary.property.reqif(pC.title) + '" LAST-CHANGE="' + dateTime(pC) + '">'
									+ '<TYPE><DATATYPE-DEFINITION-DATE-REF>' + dT.id + '</DATATYPE-DEFINITION-DATE-REF></TYPE>'
									+ '</ATTRIBUTE-DEFINITION-DATE>'
								break;
						};
					};
				});
				return xml + '</SPEC-ATTRIBUTES>';
			}
			function attsOf(me: SpecifResource | SpecifStatement): string {
				if( !me || !me.properties || me.properties.length<1 ) return '<VALUES></VALUES>';
				var xml='<VALUES>';
				me.properties.forEach( (prp) =>{
					let pC = LIB.itemByKey( pr.propertyClasses, prp['class'] ),
						dT = LIB.itemByKey( pr.dataTypes, pC.dataType ),
						adId = simpleHash(me['class'].id+prp['class'].id);

					if (dT.enumeration) {
						xml += '<ATTRIBUTE-VALUE-ENUMERATION>'
							+ '<DEFINITION><ATTRIBUTE-DEFINITION-ENUMERATION-REF>PC-' + adId + '</ATTRIBUTE-DEFINITION-ENUMERATION-REF></DEFINITION>'
							+ '<VALUES>';
						prp.values.forEach((v) => {
							xml += '<ENUM-VALUE-REF>' + v + '</ENUM-VALUE-REF>';
						});
						xml += '</VALUES>'
							+ '</ATTRIBUTE-VALUE-ENUMERATION>';
					}
					else {
						switch (dT.type) {
							case SpecifDataTypeEnum.Boolean:
								xml += '<ATTRIBUTE-VALUE-BOOLEAN THE-VALUE="' + prp.values[0] + '">'
									+ '<DEFINITION><ATTRIBUTE-DEFINITION-BOOLEAN-REF>PC-' + adId + '</ATTRIBUTE-DEFINITION-BOOLEAN-REF></DEFINITION>'
									+ '</ATTRIBUTE-VALUE-BOOLEAN>'
								break;
							case SpecifDataTypeEnum.Integer:
								xml += '<ATTRIBUTE-VALUE-INTEGER THE-VALUE="' + prp.values[0] + '">'
									+ '<DEFINITION><ATTRIBUTE-DEFINITION-INTEGER-REF>PC-' + adId + '</ATTRIBUTE-DEFINITION-INTEGER-REF></DEFINITION>'
									+ '</ATTRIBUTE-VALUE-INTEGER>'
								break;
							case SpecifDataTypeEnum.Double:
								xml += '<ATTRIBUTE-VALUE-REAL THE-VALUE="' + prp.values[0] + '">'
									+ '<DEFINITION><ATTRIBUTE-DEFINITION-REAL-REF>PC-' + adId + '</ATTRIBUTE-DEFINITION-REAL-REF></DEFINITION>'
									+ '</ATTRIBUTE-VALUE-REAL>'
								break;
							case SpecifDataTypeEnum.String:
								xml += '<ATTRIBUTE-VALUE-STRING THE-VALUE="' + (prp.values[0] as SpecifMultiLanguageText)[0].text.stripHTML().escapeXML() + '">'
									+ '<DEFINITION><ATTRIBUTE-DEFINITION-STRING-REF>PC-' + adId + '</ATTRIBUTE-DEFINITION-STRING-REF></DEFINITION>'
									+ '</ATTRIBUTE-VALUE-STRING>'
								break;
							case 'xhtml':
								// ToDo: Replace or remove XHTML tags not supported by ReqIF
								// - <img ..>
								/*	// Transform a single image to an object, because <img..> is not allowed in ReqIF:
									txt = txt.replace( /<img([^>]+)[\/]{0,1}>/g,
										function( $0, $1 ){
											var u = getUrl( $1, 'src' );
											if( u==null ) return ''
											var t = getType( $1 );
											var s = getStyle( $1 );
						
											if( t=='' ) {
												// Derive mime-type from file extension, as <img> does not have a type attribute,
												// It is essential for SVG, otherwise the formatting in IE will not be correct.
												var e = u.fileExt();
												if( e ) {
													let ei = CONFIG.imgExtensions.indexOf( e.toLowerCase() ); 
													if( ei>-1 ) {t = ' type="'+CONFIG.imgTypes[ei]+'"'}
												}
											};
											return ('<object data="'+u+'"'+t+s+' >'+u+'</object>');  
										} 
									); */
								// add a xtml namespace and an enclosing <div> bracket, if not yet present:
								// ToDo: HTML-characters in markup links (label)[http://...] such as '&' are falsely escaped
								let hasDiv = RE_hasDiv.test((prp.values[0] as SpecifMultiLanguageText)[0].text),
									txt =
										// escape text except for HTML tags:
										LIB.escapeInnerHtml((prp.values[0] as SpecifMultiLanguageText)[0].text)
											// ReqIF does not support the class attribute:
											.replace(RE_class, () => {
												return '';
											})
											// ReqIF does not support the target attribute within the anchor tag <a>:
											// @ts-ignore - $0 is never read, but must be specified anyways
											.replace(RE_aTarget, ($0, $1) => {
												return $1;
											})
											// ReqIF schema: "Only data, type, width and height are allowed as attributes 
											// for XHTML object element and type must be set to MIME-Type (if one exists)"
											// @ts-ignore - $0 is never read, but must be specified anyways
											.replace(RE_objectId, ($0, $1) => {
												return $1;
											})
											// @ts-ignore - $0 is never read, but must be specified anyways
											.replace(RE_objectName, ($0, $1) => {
												return $1;
											})
											// Add the namespace to XHTML-tags:
											// @ts-ignore - $0 is never read, but must be specified anyways
											.replace(RE.tag, ($0, $1, $2) => {
												return $1 + ns + ':' + $2;
											});
								xml += '<ATTRIBUTE-VALUE-XHTML>'
									+ '<DEFINITION><ATTRIBUTE-DEFINITION-XHTML-REF>PC-' + adId + '</ATTRIBUTE-DEFINITION-XHTML-REF></DEFINITION>'
									+ '<THE-VALUE>' + (hasDiv ? '' : '<' + ns + ':div>') + txt + (hasDiv ? '' : '</' + ns + ':div>') + '</THE-VALUE>'
									+ '</ATTRIBUTE-VALUE-XHTML>'
								break;
							case SpecifDataTypeEnum.DateTime:
								xml += '<ATTRIBUTE-VALUE-DATE THE-VALUE="' + prp.values[0] + '">'
									+ '<DEFINITION><ATTRIBUTE-DEFINITION-DATE-REF>PC-' + adId + '</ATTRIBUTE-DEFINITION-DATE-REF></DEFINITION>'
									+ '</ATTRIBUTE-VALUE-DATE>'
								break;
						};
					};
				});
				return xml + '</VALUES>';
			}
			function childrenOf( el:SpecifNode ):string {
				if( !el.nodes || el.nodes.length<1 ) return ''
				var xml = '<CHILDREN>'
					el.nodes.forEach( (ch) =>{
						xml += '<SPEC-HIERARCHY IDENTIFIER="'+(ch.id||'N-'+ch.resource)+'" LONG-NAME="'+(ch.title||'')+'" LAST-CHANGE="'+(ch.changedAt||el.changedAt)+'">'
							+		'<OBJECT><SPEC-OBJECT-REF>'+ch.resource.id+'</SPEC-OBJECT-REF></OBJECT>'
							+		childrenOf( ch )
							+ '</SPEC-HIERARCHY>'
					});
				return xml + '</CHILDREN>';
			}
			function iterate( tree:SpecifNode, fn:Function ) {
				fn( tree );
				if( tree.nodes )
					tree.nodes.forEach( (n) => {
						iterate( n, fn );
					});
			}
			function multipleChoice(pC: SpecifPropertyClass, prj: SpecIF): boolean {
				// return 'true', if either the property type specifies it, or by default its datatype;
				// if defined, the property type's value supersedes the datatype's value:
				return (typeof (pC.multiple) == 'boolean' ? pC.multiple : !!LIB.itemByKey(prj.dataTypes, pC.dataType).multiple)
				// Note: specif-check applies the same logic in function 'checkPropValues(..)'
			}
	};
	self.abort = ():void =>{
//		app.cache.abort();
//		server.project().cancelImport();
		self.abortFlag = true;
	};
	return self;
});
