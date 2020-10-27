/*!	ReqIF Server: ReqIF import
	Dependencies: -
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de  

	ToDo: escapeXML the content. See toXHTML.
*/

// Constructor for ReqIF import:
// (A module constructor is needed, because there is an access to parent's data via 'self')
modules.construct({
	name: 'ioReqif'
}, function(self) {
	"use strict";
    var mime = null;
	self.init = function() {
		mime = null
	};
	const RE_hasDiv = /^<([a-z]{1,6}:)?div>.+<\/([a-z]{1,6}:)?div>$/,
		RE_class = / class=\"[^\"]+\"/g,
		RE_target = / target=\"[^\"]+\"/g;
		
/*	self.verify = function( f ) {
//		console.debug(f.name);
	
			function reqifFile2mediaType( fname ) {
				if( fname.endsWith('.reqifz') || fname.endsWith('.zip') ) return 'application/zip';
				if( fname.endsWith('.reqif') || fname.endsWith('.xml') ) return 'application/xml';
				return null
			}
				
		mime = reqifFile2mediaType( f.name );
		if ( !mime ) {
			message.show( i18n.phrase('ErrInvalidFileReqif', f.name), 'warning', CONFIG.messageDisplayTimeNormal );
			return null
		};
		return f
	};
	self.toSpecif = function( buf ) {
	};   */
	self.toReqif = function(pr) {
		// pr is a SpecIF data in JSON format (not the internal cache),
		// transform pr to ReqIF:
		// ToDo:
		// - transform any default values
		// - suppress or replace xhtml-tags not supported by ReqIF, e.g. <img>
		// - detect a xhtml namespace used and set nsxhtml accordingly
		// - sort properties according to the propertyClasses
		// - in ReqIF an attribute named "Reqif.ForeignId" serves the same purpose as 'alterId':
		
//		console.debug( 'ioReqif.toReqif', simpleClone(pr) );

		const date = new Date().toISOString(),
			ns = 'xhtml';

		// 0. SpecIF has a number of optional items which are required for ReqIF;
		//    these are complemented in the following.
		//    - Add title properties of resources and statements
		//    - Add description properties of resources and statements
		//    - Add hierarchy root

		// Are there resources with description, but without description property?
		// See tutorial 2 "Related Terms": https://github.com/GfSE/SpecIF/blob/master/tutorials/02_Related-Terms.md
		// In this case, add a description property to hold the description as required by ReqIF:
			function addDescProperty( ctg, eC ) {
				// get all instances of this resourceClass:
			//	if( eC.subjectClasses ) .. subjectClasses are mandatory and cannot serve to recognize the category ...

				// list of elements, i.e. resources or statements
				let eL = ctg=='statementClass'? 
							pr.statements.filter( function(sta) { return sta['class']==eC.id } )
						: 	pr.resources.filter( function(res) { return res['class']==eC.id } );
//				console.debug( 'addDescProperty', eC, eL );
				
					function descPropertyNeeded(r) {
						if( r.description && r.description.length>0 ) {
							if( Array.isArray( r.properties ) )
								for (var i = r.properties.length - 1; i > -1; i--) {
										if( CONFIG.descProperties.indexOf( propTitleOf(r.properties[i],pr) )>-1 )
											// SpecIF assumes that any description property *replaces* the resource's description,
											// so we just look for the case of a resource description and *no* description property.
											// There is no consideration of the content.
											// It is expected that descriptions with multiple languages have been reduced, before.
											return false; // description property is available
								};
							return true; // no array or no description property
						};
						return false; // no description, thus no property needed
					}
				// for every element of the given class:
				for( var j=eL.length-1; j>-1; j-- ) {
					if( descPropertyNeeded(eL[j]) ) {
						
						// a. add property class, if not yet defined:
						if (!Array.isArray(pr.propertyClasses)) pr.propertyClasses = [];
						// avoid duplicates:
						if( indexById( pr.propertyClasses, "PC-Description" )<0 ) 
							pr.propertyClasses.push( app.standardTypes.get("propertyClass","PC-Description") );
						
						// b. add dataType, if not yet defined:
						if( !Array.isArray( pr.dataTypes ) ) pr.dataTypes = [];
						// avoid duplicates:
						if( indexById( pr.dataTypes, "DT-FormattedText" )<0 ) 
							pr.dataTypes.push( app.standardTypes.get("dataType","DT-FormattedText") );
						
						// c. Add propertyClass to element class:
						if( !Array.isArray( eC.propertyClasses ) ) eC.propertyClasses = [];
						// avoid duplicates:
						if( eC.propertyClasses.indexOf( "PC-Description" )<0 ) 
							eC.propertyClasses.unshift( "PC-Description" );
						
						// d. Add description property to element;
						let p = {
								class: "PC-Description",
								value: eL[j].description
						};
						if( !Array.isArray( eL[j].properties ) ) eL[j].properties = [];
						eL[j].properties.unshift( p );
					};
				};
			};
		pr.resourceClasses.forEach( (rC)=>{ addDescProperty('resourceClass',rC) });
		pr.statementClasses.forEach( (sC)=>{ addDescProperty('statementClass',sC) });
		
		// If missing, add a title property:
			function addTitleProperty( ctg, eC ) {
				// get all instances of this resourceClass:

				// list of elements, i.e. resources or statements
				let eL = ctg=='statementClass'? 
							pr.statements.filter( function(sta) { return sta['class']==eC.id } )
						: 	pr.resources.filter( function(res) { return res['class']==eC.id } );
//				console.debug( 'addTitleProperty', eC, eL );
				
					function titlePropertyNeeded(r) {
							if( Array.isArray( r.properties ) )
								for ( var i = r.properties.length-1; i>-1; i-- ) {
										let ti = propTitleOf(r.properties[i],pr);
										if( CONFIG.titleProperties.indexOf( ti )>-1
											|| CONFIG.headingProperties.indexOf( ti )>-1 )
											// SpecIF assumes that any title property *replaces* the element's title,
											// so we just look for the case of *no* title property.
											// There is no consideration of the content.
											// It is expected that titles with multiple languages have been reduced, before.
											return false; // title property is available
								};
							return true;
					}
				// for every element of the given class:
				for( var j=eL.length-1; j>-1; j-- ) {
					if( titlePropertyNeeded(eL[j]) ) {
						
						// a. add property class, if not yet defined:
						if (!Array.isArray(pr.propertyClasses)) pr.propertyClasses = [];
						// avoid duplicates:
						if( indexById( pr.propertyClasses, "PC-Name" )<0 ) 
							pr.propertyClasses.push( app.standardTypes.get("propertyClass","PC-Name") );
						
						// b. add dataType, if not yet defined:
						if( !Array.isArray( pr.dataTypes ) ) pr.dataTypes = [];
						// avoid duplicates:
						if( indexById( pr.dataTypes, "DT-ShortString" )<0 ) 
							pr.dataTypes.push( app.standardTypes.get("dataType","DT-ShortString") );
						
						// c. Add propertyClass to element class:
						if( !Array.isArray( eC.propertyClasses ) ) eC.propertyClasses = [];
						// avoid duplicates:
						if( eC.propertyClasses.indexOf( "PC-Name" )<0 ) 
							eC.propertyClasses.unshift( "PC-Name" );
						
						// d. Add title property to element;
						let p = {
								class: "PC-Name",
								// no title is required in case of statements; it's class' title applies by default:
								value: eL[j].title || eC.title
						};
						if( !Array.isArray( eL[j].properties ) ) eL[j].properties = [];
						eL[j].properties.unshift( p );
					};
				};
			};
		pr.resourceClasses.forEach( (rC)=>{ addTitleProperty('resourceClass',rC) });
		pr.statementClasses.forEach( (sC)=>{ addTitleProperty('statementClass',sC) });

		// ReqIF does not allow media objects other than PNG.
		// Thus, provide a fall-back image with format PNG for XHTML objects pointing to any other media object.
		// ToDo!

		// Add a resource as hierarchyRoot, if needed.
		// It is assumed, 
		// - that general SpecIF data do not have a hierarchy root with meta-data.
		// - that ReqIF specifications (=hierarchyRoots) are transformed to regular resources on input.
		// Therefore, a somewhat complicated solution is chosen, in which hierarchyRoots are added as resources, 
		// *only when needed* and then, later on, the resources at the root are transformed to SPECIFICATION roots.
		// ToDo: Design the ReqIF import and export so that a roundtrip works; neither loss nor growth is acceptable.
		if( indexById( pr.resourceClasses, "RC-HierarchyRoot" )<0 ) 
			pr.resourceClasses.push( app.standardTypes.get("resourceClass","RC-HierarchyRoot") );

		// ToDo: Get the referenced propertyClass ids from the above
		if( indexById( pr.propertyClasses, "PC-Description" )<0 ) 
			pr.propertyClasses.push( app.standardTypes.get("propertyClass","PC-Description") );
		if( indexById( pr.propertyClasses, "PC-Name" )<0 ) 
			pr.propertyClasses.push( app.standardTypes.get("propertyClass","PC-Name") );

		// ToDo: Get the referenced dataType ids from the above
		if( indexById( pr.dataTypes, "DT-ShortString" )<0 ) 
			pr.dataTypes.push( app.standardTypes.get("dataType","DT-ShortString") );
		if( indexById( pr.dataTypes, "DT-FormattedText" )<0 ) 
			pr.dataTypes.push( app.standardTypes.get("dataType","DT-FormattedText") );

		let resId = 'R-'+pr.id.simpleHash(),
			res = {
				id: resId,
				title: pr.title,
				class: "RC-HierarchyRoot",
				properties: [{
					class: "PC-Name",
					value: pr.title
				}],
				changedAt: date
		};
		// add a description property only if it has a value:
		if( pr.description ) 
			res.properties.push({
					class: "PC-Description",
					value: pr.description
			});
		pr.resources.push( res );
		pr.hierarchies = [{
				id: "H-"+resId,
				resource: resId,
				nodes: pr.hierarchies,
				changedAt: date
		}];

		// After the preparations, begin with the conversion:
		var xml = 
				'<?xml version="1.0" encoding="UTF-8"?>'
			+	'<REQ-IF xmlns="http://www.omg.org/spec/ReqIF/20110401/reqif.xsd" xmlns:'+ns+'="http://www.w3.org/1999/xhtml">'
			+	'<THE-HEADER>'
			+	  '<REQ-IF-HEADER IDENTIFIER="'+pr.id+'">'
			+		'<COMMENT>'+(pr.description || '')+'</COMMENT>'
			+		'<CREATION-TIME>'+date+'</CREATION-TIME>'
			+		'<REQ-IF-TOOL-ID></REQ-IF-TOOL-ID>'
			+		'<REQ-IF-VERSION>1.0</REQ-IF-VERSION>'
			+		'<SOURCE-TOOL-ID>'+(pr.tool || '')+'</SOURCE-TOOL-ID>'
			+		'<TITLE>'+pr.title+'</TITLE>'
			+	  '</REQ-IF-HEADER>'
			+	'</THE-HEADER>'
			+	'<CORE-CONTENT>'
			+	  '<REQ-IF-CONTENT>'
			+		'<DATATYPES>';
		
		// 1. Transform dataTypes:
		if(pr.dataTypes)	
			pr.dataTypes.forEach( function(dT) {
				switch( dT.type ) {
					case 'xs:boolean':
						xml += '<DATATYPE-DEFINITION-BOOLEAN '+commonAttsOf( dT )+'/>';
						break;
					case 'xs:integer':
						xml += '<DATATYPE-DEFINITION-INTEGER '+commonAttsOf( dT )
									+' MAX="'+(dT.maxInclusive||CONFIG.maxInteger)+'" MIN="'+(dT.minInclusive||CONFIG.minInteger)+'" />';
						break;
					case 'xs:double':
						xml += '<DATATYPE-DEFINITION-REAL '+commonAttsOf( dT )
									+' MAX="'+(dT.maxInclusive||CONFIG.maxReal)+'" MIN="'+(dT.minInclusive||CONFIG.minReal)
									+'" ACCURACY="'+(dT.fragmentDigits||CONFIG.maxAccuracy)+'" />';
						break;
					case 'xs:string':
						xml += '<DATATYPE-DEFINITION-STRING '+commonAttsOf( dT )+' MAX-LENGTH="'+(dT.maxLength||CONFIG.maxStringLength)+'" />';
						break;
					case 'xhtml':
						xml += '<DATATYPE-DEFINITION-XHTML '+commonAttsOf( dT )+'/>';
						break;
					case 'xs:enumeration':
						xml += '<DATATYPE-DEFINITION-ENUMERATION '+commonAttsOf( dT )+'>' +
								'<SPECIFIED-VALUES>';
						dT.values.forEach( function(val,i) {
							xml += '<ENUM-VALUE IDENTIFIER="'+val.id+'" LONG-NAME="'+val.value+'" LAST-CHANGE="'+dateTime(dT)+'" >' +
									 '<PROPERTIES><EMBEDDED-VALUE KEY="'+i+'" OTHER-CONTENT="" /></PROPERTIES>' +
								   '</ENUM-VALUE>';
						});
						xml += 	'</SPECIFIED-VALUES>' +
								'</DATATYPE-DEFINITION-ENUMERATION>';
						break;
					case 'xs:dateTime':
						xml += '<DATATYPE-DEFINITION-DATE '+commonAttsOf( dT )+'/>';
						break;
					default: 
						console.error('Error: unknown dataType: ',dT.type)
				}
			});
		xml +=  '</DATATYPES>'
			+	'<SPEC-TYPES>';
			
		// 2. Sort SPEC-OBJECT-TYPEs and SPECIFICATION-TYPEs, collect OBJECTS:
		let sorted = {
			objTypes: [],
			spcTypes: [],
			objects: []
		};

			function prepObj( n ) {
				let r = itemById(pr.resources,n.resource),
					rC = itemById(pr.resourceClasses,r['class']);
				// a) Collect resourceClass without duplication:
				if( indexById(sorted.objTypes,rC.id)<0 ) {
					// ReqIF does not support inheritance, so include any properties of an ancestor:
					if( rC['extends'] ) {
						let anc = itemById(pr.resourceClasses,rC['extends']);
						if( anc.propertyClasses && rC.propertyClasses ) 
							rC.propertyClasses = anc.propertyClasses.concat(rC.propertyClasses)
					};
					sorted.objTypes.push( rC )
				};
				// b) Collect resource without duplication:
				if( indexById(sorted.objects,r.id)<0 ) 
					// ToDo: Sort properties according to the propertyClasses
					sorted.objects.push( r )
			}
		// First, collect all resources referenced by the hierarchies,
		// ignore the hierarchy roots here, they are handled further down:
		pr.hierarchies.forEach( function(h) {
			if( h.nodes )
				h.nodes.forEach( function(n) {
					iterate( n, prepObj )
				});
		});
		console.debug( 'after collecting referenced resources: ', sorted );
		// Then, have a look at the hierarchy roots:
		pr.hierarchies.forEach( function(h) {
			// The resources referenced at the lowest level of hierarchies 
			// are SPECIFICATIONS in terms of ReqIF.
			// If a resourceClass is shared between a ReqIF OBJECT and a ReqIF SPECIFICATION, 
			// it must have a different id:
			let hR = itemById( pr.resources, h.resource ),			// the resource referenced by this hierarchy root
				hC = itemById( pr.resourceClasses, hR['class'] );	// its class
			
			if( indexBy( sorted.objects, 'class', hC.id )>-1 ) {
				// The hierarchy root's class is shared by a resource:
				hC = simpleClone(hC);  
				hC.id = 'HC-'+hC.id
				// ToDo: If somebody uses interitance with 'extends' in case of a hierarchy root classes, 
				// we need to update all affected 'extend' properties. There is a minor chance, though.
			};
			// Collect hierarchy root's class without duplication:
			if( indexById(sorted.spcTypes,hC.id)<0 )
				sorted.spcTypes.push( hC );
			
			// prepare the hierarchy root, itself:
			h.title = hR.title || '';
			h.description = hR.description || '';
			h['class'] = hC.id;
			if( hR.properties ) h.properties = hR.properties
		});
//		console.debug( 'reqSort', sorted );
		
		// 3. Transform resourceClasses to OBJECT-TYPES:
		sorted.objTypes.forEach( function(oT) {
			xml += '<SPEC-OBJECT-TYPE '+commonAttsOf( oT )+'>'
				+		attrTypesOf( oT )
				+ '</SPEC-OBJECT-TYPE>'
		});
		
		// 4. Transform statementClasses to RELATION-TYPES:
		if(pr.statementClasses)	
			pr.statementClasses.forEach( function(sC) {
				xml += '<SPEC-RELATION-TYPE '+commonAttsOf( sC )+'>'
					+		attrTypesOf( sC )
				    +  '</SPEC-RELATION-TYPE>'
			});
		
		// 5. Write SPECIFICATION-TYPES:
		sorted.spcTypes.forEach( function(sC) {
			xml += '<SPECIFICATION-TYPE '+commonAttsOf( sC )+'>'
				+		attrTypesOf( sC )
				+  '</SPECIFICATION-TYPE>';
		}); 
		xml +=  '</SPEC-TYPES>'
			+	'<SPEC-OBJECTS>';
		
		// 6. Transform resources to OBJECTS:
		sorted.objects.forEach( function(sC) {
			xml += '<SPEC-OBJECT '+commonAttsOf( sC )+'>'
				+		'<TYPE><SPEC-OBJECT-TYPE-REF>'+sC['class']+'</SPEC-OBJECT-TYPE-REF></TYPE>'
				+		attsOf( sC )
				+ '</SPEC-OBJECT>'
		});
		xml +=  '</SPEC-OBJECTS>'
			+	'<SPEC-RELATIONS>';
		
		// 7. Transform statements to RELATIONs:
		pr.statements.forEach( function(sC) {
			xml += '<SPEC-RELATION '+commonAttsOf( sC )+'>'
				+		'<TYPE><SPEC-RELATION-TYPE-REF>'+sC['class']+'</SPEC-RELATION-TYPE-REF></TYPE>'
				+		attsOf( sC )
				+		'<SOURCE><SPEC-OBJECT-REF>'+sC.subject+'</SPEC-OBJECT-REF></SOURCE>'
				+		'<TARGET><SPEC-OBJECT-REF>'+sC.object+'</SPEC-OBJECT-REF></TARGET>'
				+ '</SPEC-RELATION>'
		});
		xml +=  '</SPEC-RELATIONS>'
			+	'<SPECIFICATIONS>';
		
		// 8. Transform hierarchies to SPECIFICATIONs:
		pr.hierarchies.forEach( function(sC) {
			xml += '<SPECIFICATION '+commonAttsOf( sC )+'>'
				+		'<TYPE><SPECIFICATION-TYPE-REF>'+sC['class']+'</SPECIFICATION-TYPE-REF></TYPE>'
				+		attsOf( sC )
				+   	childrenOf( sC )
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
		return xml

			function dateTime( e ) {
				return e.changedAt || pr.changedAt || date
			}
			function commonAttsOf( e ) {
				return 'IDENTIFIER="'+e.id+'" LONG-NAME="'+(e.title?e.title.stripHTML().escapeXML():'')+'" DESC="'+(e.description?e.description.stripHTML().escapeXML():'')+'" LAST-CHANGE="'+dateTime(e)+'"'
			}
			function attrTypesOf( eC ) { 
				// eC: resourceClass or statementClass
				if( !eC || !eC.propertyClasses || eC.propertyClasses.length<1 ) return '<SPEC-ATTRIBUTES></SPEC-ATTRIBUTES>';
				var xml='<SPEC-ATTRIBUTES>';
				// SpecIF resourceClasses and statementClasses may share propertyClasses,
				// but in ReqIF every type has its own ATTRIBUTE-DEFINITIONs.
				// This is taken care of below, but it may not be necessary to extend the id, e.g. if SpecIF has been created from ReqIF, before.
				// ToDo: Avoid that the id gets longer every time a ReqIF-SpecIF roundtrip is made.
				eC.propertyClasses.forEach( function(pC) {
					pC = itemById( pr.propertyClasses, pC );  // replace id by the item itself
					switch( itemById( pr.dataTypes, pC.dataType ).type ) {
						case 'xs:boolean':
							xml += 	'<ATTRIBUTE-DEFINITION-BOOLEAN IDENTIFIER="RC-'+(eC.id+pC.id).simpleHash()+'" LONG-NAME="'+vocabulary.property.reqif(pC.title)+'" LAST-CHANGE="'+dateTime(pC)+'">' 
								+		'<TYPE><DATATYPE-DEFINITION-BOOLEAN-REF>'+pC.dataType+'</DATATYPE-DEFINITION-BOOLEAN-REF></TYPE>' 
								+	'</ATTRIBUTE-DEFINITION-BOOLEAN>'
							break;
						case 'xs:integer':
							xml += 	'<ATTRIBUTE-DEFINITION-INTEGER IDENTIFIER="RC-'+(eC.id+pC.id).simpleHash()+'" LONG-NAME="'+vocabulary.property.reqif(pC.title)+'" LAST-CHANGE="'+dateTime(pC)+'">' 
								+		'<TYPE><DATATYPE-DEFINITION-INTEGER-REF>'+pC.dataType+'</DATATYPE-DEFINITION-INTEGER-REF></TYPE>' 
								+	'</ATTRIBUTE-DEFINITION-INTEGER>'
							break;
						case 'xs:double':
							xml += 	'<ATTRIBUTE-DEFINITION-REAL IDENTIFIER="RC-'+(eC.id+pC.id).simpleHash()+'" LONG-NAME="'+vocabulary.property.reqif(pC.title)+'" LAST-CHANGE="'+dateTime(pC)+'">' 
								+		'<TYPE><DATATYPE-DEFINITION-REAL-REF>'+pC.dataType+'</DATATYPE-DEFINITION-REAL-REF></TYPE>' 
								+	'</ATTRIBUTE-DEFINITION-REAL>'
							break;
						case 'xs:string':
							xml += 	'<ATTRIBUTE-DEFINITION-STRING IDENTIFIER="RC-'+(eC.id+pC.id).simpleHash()+'" LONG-NAME="'+vocabulary.property.reqif(pC.title)+'" LAST-CHANGE="'+dateTime(pC)+'">' 
								+		'<TYPE><DATATYPE-DEFINITION-STRING-REF>'+pC.dataType+'</DATATYPE-DEFINITION-STRING-REF></TYPE>' 
								+	'</ATTRIBUTE-DEFINITION-STRING>'
							break;
						case 'xhtml':
							xml += 	'<ATTRIBUTE-DEFINITION-XHTML IDENTIFIER="RC-'+(eC.id+pC.id).simpleHash()+'" LONG-NAME="'+vocabulary.property.reqif(pC.title)+'" LAST-CHANGE="'+dateTime(pC)+'">' 
								+		'<TYPE><DATATYPE-DEFINITION-XHTML-REF>'+pC.dataType+'</DATATYPE-DEFINITION-XHTML-REF></TYPE>' 
								+	'</ATTRIBUTE-DEFINITION-XHTML>'
							break;
						case 'xs:enumeration':
							// the property 'multiValued' in case of enumerated types must be specified in any case, because the ReqIF Server (like ReqIF) requires it. 
							// The property 'dataType.multiple' is invisible for the server. 
							xml += 	'<ATTRIBUTE-DEFINITION-ENUMERATION IDENTIFIER="RC-'+(eC.id+pC.id).simpleHash()+'" LONG-NAME="'+vocabulary.property.reqif(pC.title)+'" MULTI-VALUED="'+multipleChoice(pC,pr)+'" LAST-CHANGE="'+dateTime(pC)+'">' 
								+		'<TYPE><DATATYPE-DEFINITION-ENUMERATION-REF>'+pC.dataType+'</DATATYPE-DEFINITION-ENUMERATION-REF></TYPE>' 
								+	'</ATTRIBUTE-DEFINITION-ENUMERATION>'
							break;
						case 'xs:dateTime':
							xml += 	'<ATTRIBUTE-DEFINITION-DATE IDENTIFIER="RC-'+(eC.id+pC.id).simpleHash()+'" LONG-NAME="'+vocabulary.property.reqif(pC.title)+'" LAST-CHANGE="'+dateTime(pC)+'">' 
								+		'<TYPE><DATATYPE-DEFINITION-DATE-REF>'+pC.dataType+'</DATATYPE-DEFINITION-DATE-REF></TYPE>' 
								+	'</ATTRIBUTE-DEFINITION-DATE>'
							break;
					}
				});
				return xml + '</SPEC-ATTRIBUTES>'
			}
			function attsOf( me ) {
				if( !me || !me.properties || me.properties.length<1 ) return '<VALUES></VALUES>';
				var xml='<VALUES>',
					eC = itemById( pr.resourceClasses.concat(pr.statementClasses), me['class'] );
				me.properties.forEach( function(prp) {
					let pC = itemById( pr.propertyClasses, prp['class'] ),
						dT = itemById( pr.dataTypes, pC.dataType );
					switch( dT.type ) {
						case 'xs:boolean':
							xml += '<ATTRIBUTE-VALUE-BOOLEAN THE-VALUE="'+prp.value+'">'
								+	  '<DEFINITION><ATTRIBUTE-DEFINITION-BOOLEAN-REF>RC-'+(eC.id+prp['class']).simpleHash()+'</ATTRIBUTE-DEFINITION-BOOLEAN-REF></DEFINITION>'
								+  '</ATTRIBUTE-VALUE-BOOLEAN>'
							break;
						case 'xs:integer':
							xml += '<ATTRIBUTE-VALUE-INTEGER THE-VALUE="'+prp.value+'">'
								+	  '<DEFINITION><ATTRIBUTE-DEFINITION-INTEGER-REF>RC-'+(eC.id+prp['class']).simpleHash()+'</ATTRIBUTE-DEFINITION-INTEGER-REF></DEFINITION>'
								+  '</ATTRIBUTE-VALUE-INTEGER>'
							break;
						case 'xs:double':
							xml += '<ATTRIBUTE-VALUE-REAL THE-VALUE="'+prp.value+'">'
								+	  '<DEFINITION><ATTRIBUTE-DEFINITION-REAL-REF>RC-'+(eC.id+prp['class']).simpleHash()+'</ATTRIBUTE-DEFINITION-REAL-REF></DEFINITION>'
								+  '</ATTRIBUTE-VALUE-REAL>'
							break;
						case 'xs:string':
							xml += '<ATTRIBUTE-VALUE-STRING THE-VALUE="'+prp.value.stripHTML().escapeXML()+'">'
								+	  '<DEFINITION><ATTRIBUTE-DEFINITION-STRING-REF>RC-'+(eC.id+prp['class']).simpleHash()+'</ATTRIBUTE-DEFINITION-STRING-REF></DEFINITION>'
								+  '</ATTRIBUTE-VALUE-STRING>'
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
							let	hasDiv = RE_hasDiv.test(prp.value),
								txt = 	escapeInner( prp.value )
										// ReqIF does not support the target attribute within the anchor tag <a>:
										.replace( RE_target, function() { 
											return '';
										})
										// ReqIF does not support the class attribute within the <div> tag:
										.replace( RE_class, function() { 
											return '';
										})
										// Add the namespace to XHTML-tags:
										.replace( RE.tag, function($0,$1,$2) { 
											return $1+ns+':'+$2;
										});
							xml += '<ATTRIBUTE-VALUE-XHTML>'
								+	  '<DEFINITION><ATTRIBUTE-DEFINITION-XHTML-REF>RC-'+(eC.id+prp['class']).simpleHash()+'</ATTRIBUTE-DEFINITION-XHTML-REF></DEFINITION>'
								+     '<THE-VALUE>'+(hasDiv?'':'<'+ns+':div>')+txt+(hasDiv?'':'</'+ns+':div>')+'</THE-VALUE>'
								+  '</ATTRIBUTE-VALUE-XHTML>'
							break;
						case 'xs:enumeration':
							xml += '<ATTRIBUTE-VALUE-ENUMERATION>'
								+		'<DEFINITION><ATTRIBUTE-DEFINITION-ENUMERATION-REF>RC-'+(eC.id+prp['class']).simpleHash()+'</ATTRIBUTE-DEFINITION-ENUMERATION-REF></DEFINITION>'
								+			'<VALUES>'
							let vL = prp.value.split(',');  // in case of ENUMERATION, value carries comma-separated value-IDs
							vL.forEach( function(v) {
								xml += '<ENUM-VALUE-REF>'+v+'</ENUM-VALUE-REF>'
							});
							xml += 			'</VALUES>'
								+	'</ATTRIBUTE-VALUE-ENUMERATION>'
							break;
						case 'xs:dateTime':
							xml += '<ATTRIBUTE-VALUE-DATE THE-VALUE="'+prp.value+'">'
								+	  '<DEFINITION><ATTRIBUTE-DEFINITION-DATE-REF>RC-'+(eC.id+prp['class']).simpleHash()+'</ATTRIBUTE-DEFINITION-DATE-REF></DEFINITION>'
								+  '</ATTRIBUTE-VALUE-DATE>'
							break;
					};
				});
				return xml + '</VALUES>';
			}
			function childrenOf( el ) {
				if( !el.nodes || el.nodes.length<1 ) return ''
				var xml = '<CHILDREN>'
					el.nodes.forEach( function(ch) {
						xml += '<SPEC-HIERARCHY IDENTIFIER="'+(ch.id||'N-'+ch.resource)+'" LONG-NAME="'+(ch.title||'')+'" LAST-CHANGE="'+(ch.changedAt||el.changedAt)+'">'
							+		'<OBJECT><SPEC-OBJECT-REF>'+ch.resource+'</SPEC-OBJECT-REF></OBJECT>'
							+		childrenOf( ch )
							+ '</SPEC-HIERARCHY>'
					});
				return xml + '</CHILDREN>';
			}
			function iterate( tree, fn ) {
				fn( tree );
				if( tree.nodes )
					tree.nodes.forEach( function(n) {
						iterate( n, fn );
					});
			}
	};
	self.abort = function() {
//		app.cache.abort();
//		server.project().cancelImport();
		self.abortFlag = true;
	};
	return self;
});
