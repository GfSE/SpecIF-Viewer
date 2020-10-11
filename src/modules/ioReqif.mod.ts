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
		RE_tag = /(<\/?)([a-z]{1,10}( [^<>]+)?\/?>)/g;
		
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
		return server.project().upload( buf, mime )
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
		
		console.debug( 'ioReqif.toReqif', pr );

		const date = new Date().toISOString(),
			ns_xhtml = 'xhtml';

		var xml = 
				'<?xml version="1.0" encoding="UTF-8"?>'
			+	'<REQ-IF xmlns="http://www.omg.org/spec/ReqIF/20110401/reqif.xsd" xmlns:'+ns_xhtml+'="http://www.w3.org/1999/xhtml">'
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
			pr.dataTypes.forEach( function(el) {
				switch( el.type ) {
					case 'xs:boolean':
						xml += '<DATATYPE-DEFINITION-BOOLEAN '+commonAtts( el )+'/>';
						break;
					case 'xs:integer':
						xml += '<DATATYPE-DEFINITION-INTEGER '+commonAtts( el )+' MAX="'+el.maxInclusive+'" MIN="'+el.minInclusive+'" />';
						break;
					case 'xs:double':
						xml += '<DATATYPE-DEFINITION-REAL '+commonAtts( el )+' MAX="'+el.maxInclusive+'" MIN="'+el.minInclusive+'" ACCURACY="'+el.fragmentDigits+'" />';
						break;
					case 'xs:string':
						xml += '<DATATYPE-DEFINITION-STRING '+commonAtts( el )+' MAX-LENGTH="'+el.maxLength+'" />';
						break;
					case 'xhtml':
						xml += '<DATATYPE-DEFINITION-XHTML '+commonAtts( el )+'/>';
						break;
					case 'xs:enumeration':
						xml += '<DATATYPE-DEFINITION-ENUMERATION '+commonAtts( el )+'>' +
								'<SPECIFIED-VALUES>';
						el.values.forEach( function(val,i) {
							xml += '<ENUM-VALUE IDENTIFIER="'+val.id+'" LONG-NAME="'+val.value+'" LAST-CHANGE="'+dateTime(el)+'" >' +
									 '<PROPERTIES><EMBEDDED-VALUE KEY="'+i+'" OTHER-CONTENT="" /></PROPERTIES>' +
								   '</ENUM-VALUE>';
						});
						xml += 	'</SPECIFIED-VALUES>' +
								'</DATATYPE-DEFINITION-ENUMERATION>';
						break;
					case 'xs:dateTime':
						xml += '<DATATYPE-DEFINITION-DATE '+commonAtts( el )+'/>';
						break;
					default: 
						console.error('Error: unknown dataType: ',el.type)
				}
			});
		xml +=  '</DATATYPES>'
			+	'<SPEC-TYPES>';
			
		// 2. Sort SPEC-OBJECT-TYPEs and SPECIFICATION-TYPEs, collect OBJECTS:
		let req = {
			objTypes: [],
			spcTypes: [],
			objects: []
		};

			function prepObj( n ) {
				let r = itemById(pr.resources,n.resource),
					rC = itemById(pr.resourceClasses,r['class']);
				// a) Collect resourceClass without duplication:
				if( indexById(req.objTypes,rC.id)<0 ) {
					// ReqIF does not support inheritance, so include any properties of an ancestor:
					if( rC['extends'] ) {
						let anc = itemById(pr.resourceClasses,rC['extends']);
						if( anc.propertyClasses && rC.propertyClasses ) 
							rC.propertyClasses = anc.propertyClasses.concat(rC.propertyClasses)
					};
					req.objTypes.push( rC )
				};
				// b) Collect resource without duplication:
				if( indexById(req.objects,r.id)<0 ) 
					// ToDo: Sort properties according to the propertyClasses
					req.objects.push( r )
			}
		// First, collect all resources referenced by the hierarchies,
		// ignore the hierarchy roots here, they are handled further down:
		pr.hierarchies.forEach( function(h) {
			if( h.nodes )
				h.nodes.forEach( function(n) {
					iterate( n, prepObj )
				});
		});
		// Then, have a look at the hierarchy roots:
		pr.hierarchies.forEach( function(h) {
			// The resources referenced at the lowest level of hierarchies 
			// are SPECIFICATIONS in terms of ReqIF.
			// If a resourceClass is shared between a ReqIF OBJECT and a ReqIF SPECIFICATION, 
			// it must have a different id:
			let hR = itemById( pr.resources, h.resource ),			// the resource referenced by this hierarchy root
				hC = itemById( pr.resourceClasses, hR['class'] );	// its class
			
			if( indexBy( req.objects, 'class', hC.id )>-1 ) {
				// The hierarchy root's class is shared by a resource:
				hC = simpleClone(hC);  
				hC.id = 'HC-'+hC.id
				// ToDo: If somebody uses interitance with 'extends' in case of a hierarchy root classes, 
				// we need to update all affected 'extend' properties. There is a minor chance, though.
			};
			// Collect hierarchy root's class without duplication:
			if( indexById(req.spcTypes,hC.id)<0 )
				req.spcTypes.push( hC );
			
			// prepare the hierarchy root, itself:
			h.title = hR.title || '';
			h.description = hR.description || '';
			h['class'] = hC.id;
			if( hR.properties ) h.properties = hR.properties
		});
//		console.debug( 'reqSort', req );
		
		// 3. Transform resourceClasses to OBJECT-TYPEs:
		req.objTypes.forEach( function(el) {
			xml += '<SPEC-OBJECT-TYPE '+commonAtts( el )+'>'
				+		attrTypes( el )
				+ '</SPEC-OBJECT-TYPE>'
		});
		
		// 4. Transform statementClasses to RELATION-TYPES:
		if(pr.statementClasses)	
			pr.statementClasses.forEach( function(el) {
				xml += '<SPEC-RELATION-TYPE '+commonAtts( el )+'>'
					+		attrTypes( el )
				    +  '</SPEC-RELATION-TYPE>'
			});
		
		// 5. Write SPECIFICATION-TYPEs:
		req.spcTypes.forEach( function(el) {
			xml += '<SPECIFICATION-TYPE '+commonAtts( el )+'>'
				+		attrTypes( el )
				+  '</SPECIFICATION-TYPE>';
		}); 
		xml +=  '</SPEC-TYPES>'
			+	'<SPEC-OBJECTS>';
		
		// 6. Transform resources to OBJECTS:
		req.objects.forEach( function(el) {
			xml += '<SPEC-OBJECT '+commonAtts( el )+'>'
				+		'<TYPE><SPEC-OBJECT-TYPE-REF>'+el['class']+'</SPEC-OBJECT-TYPE-REF></TYPE>'
				+		attsOf( el )
				+ '</SPEC-OBJECT>'
		});
		xml +=  '</SPEC-OBJECTS>'
			+	'<SPEC-RELATIONS>';
		
		// 7. Transform statements to RELATIONs:
		pr.statements.forEach( function(el) {
			xml += '<SPEC-RELATION '+commonAtts( el )+'>'
				+		'<TYPE><SPEC-RELATION-TYPE-REF>'+el['class']+'</SPEC-RELATION-TYPE-REF></TYPE>'
				+		attsOf( el )
				+		'<SOURCE><SPEC-OBJECT-REF>'+el.subject+'</SPEC-OBJECT-REF></SOURCE>'
				+		'<TARGET><SPEC-OBJECT-REF>'+el.object+'</SPEC-OBJECT-REF></TARGET>'
				+ '</SPEC-RELATION>'
		});
		xml +=  '</SPEC-RELATIONS>'
			+	'<SPECIFICATIONS>';
		
		// 8. Transform hierarchies to SPECIFICATIONs:
		pr.hierarchies.forEach( function(el) {
			xml += '<SPECIFICATION '+commonAtts( el )+'>'
				+		'<TYPE><SPECIFICATION-TYPE-REF>'+el['class']+'</SPECIFICATION-TYPE-REF></TYPE>'
				+		attsOf( el )
				+   	childrenOf( el )
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
			function commonAtts( e ) {
				return 'IDENTIFIER="'+e.id+'" LONG-NAME="'+(e.title?e.title:'')+'" DESC="'+(e.description?e.description:'')+'" LAST-CHANGE="'+dateTime(e)+'"'
			}
			function attrTypes( ty ) {
				if( !ty || !ty.propertyClasses || ty.propertyClasses.length<1 ) return '<SPEC-ATTRIBUTES></SPEC-ATTRIBUTES>';
				var xml='<SPEC-ATTRIBUTES>';
				// SpecIF resourceClasses and statementClasses may share propertyClasses,
				// but in ReqIF every type has its own ATTRIBUTE-DEFINITIONs.
				// This is taken care of below, but it may not be necessary to extend the id, e.g. if SpecIF has been created from ReqIF, before.
				// ToDo: Avoid that the id gets longer every time a ReqIF-SpecIF roundtrip is made.
				ty.propertyClasses.forEach( function(el) {
					el = itemById( pr.propertyClasses, el );  // replace id by the item itself
					switch( itemById( pr.dataTypes, el.dataType ).type ) {
						case 'xs:boolean':
							xml += 	'<ATTRIBUTE-DEFINITION-BOOLEAN IDENTIFIER="'+ty.id+'_'+el.id+'" LONG-NAME="'+vocabulary.property.reqif(el.title)+'" LAST-CHANGE="'+dateTime(el)+'">' 
								+		'<TYPE><DATATYPE-DEFINITION-BOOLEAN-REF>'+el.dataType+'</DATATYPE-DEFINITION-BOOLEAN-REF></TYPE>' 
								+	'</ATTRIBUTE-DEFINITION-BOOLEAN>'
							break;
						case 'xs:integer':
							xml += 	'<ATTRIBUTE-DEFINITION-INTEGER IDENTIFIER="'+ty.id+'_'+el.id+'" LONG-NAME="'+vocabulary.property.reqif(el.title)+'" LAST-CHANGE="'+dateTime(el)+'">' 
								+		'<TYPE><DATATYPE-DEFINITION-INTEGER-REF>'+el.dataType+'</DATATYPE-DEFINITION-INTEGER-REF></TYPE>' 
								+	'</ATTRIBUTE-DEFINITION-INTEGER>'
							break;
						case 'xs:double':
							xml += 	'<ATTRIBUTE-DEFINITION-REAL IDENTIFIER="'+ty.id+'_'+el.id+'" LONG-NAME="'+vocabulary.property.reqif(el.title)+'" LAST-CHANGE="'+dateTime(el)+'">' 
								+		'<TYPE><DATATYPE-DEFINITION-REAL-REF>'+el.dataType+'</DATATYPE-DEFINITION-REAL-REF></TYPE>' 
								+	'</ATTRIBUTE-DEFINITION-REAL>'
							break;
						case 'xs:string':
							xml += 	'<ATTRIBUTE-DEFINITION-STRING IDENTIFIER="'+ty.id+'_'+el.id+'" LONG-NAME="'+vocabulary.property.reqif(el.title)+'" LAST-CHANGE="'+dateTime(el)+'">' 
								+		'<TYPE><DATATYPE-DEFINITION-STRING-REF>'+el.dataType+'</DATATYPE-DEFINITION-STRING-REF></TYPE>' 
								+	'</ATTRIBUTE-DEFINITION-STRING>'
							break;
						case 'xhtml':
							xml += 	'<ATTRIBUTE-DEFINITION-XHTML IDENTIFIER="'+ty.id+'_'+el.id+'" LONG-NAME="'+vocabulary.property.reqif(el.title)+'" LAST-CHANGE="'+dateTime(el)+'">' 
								+		'<TYPE><DATATYPE-DEFINITION-XHTML-REF>'+el.dataType+'</DATATYPE-DEFINITION-XHTML-REF></TYPE>' 
								+	'</ATTRIBUTE-DEFINITION-XHTML>'
							break;
						case 'xs:enumeration':
							// the property 'multiValued' in case of enumerated types must be specified in any case, because the ReqIF Server (like ReqIF) requires it. 
							// The property 'dataType.multiple' is invisible for the server. 
							xml += 	'<ATTRIBUTE-DEFINITION-ENUMERATION IDENTIFIER="'+ty.id+'_'+el.id+'" LONG-NAME="'+vocabulary.property.reqif(el.title)+'" MULTI-VALUED="'+multipleChoice(el,pr)+'" LAST-CHANGE="'+dateTime(el)+'">' 
								+		'<TYPE><DATATYPE-DEFINITION-ENUMERATION-REF>'+el.dataType+'</DATATYPE-DEFINITION-ENUMERATION-REF></TYPE>' 
								+	'</ATTRIBUTE-DEFINITION-ENUMERATION>'
							break;
						case 'xs:dateTime':
							xml += 	'<ATTRIBUTE-DEFINITION-DATE IDENTIFIER="'+ty.id+'_'+el.id+'" LONG-NAME="'+vocabulary.property.reqif(el.title)+'" LAST-CHANGE="'+dateTime(el)+'">' 
								+		'<TYPE><DATATYPE-DEFINITION-DATE-REF>'+el.dataType+'</DATATYPE-DEFINITION-DATE-REF></TYPE>' 
								+	'</ATTRIBUTE-DEFINITION-DATE>'
							break;
					}
				});
				return xml + '</SPEC-ATTRIBUTES>'
			}
			function attsOf( me ) {
				if( !me || !me.properties || me.properties.length<1 ) return '<VALUES></VALUES>';
				var xml='<VALUES>';
				me.properties.forEach( function(el) {
					let dT = itemById( pr.dataTypes, itemById( pr.propertyClasses, el['class'] ).dataType );
					switch( dT.type ) {
						case 'xs:boolean':
							xml += '<ATTRIBUTE-VALUE-BOOLEAN THE-VALUE="'+el.value+'">'
								+	  '<DEFINITION><ATTRIBUTE-DEFINITION-BOOLEAN-REF>'+el['class']+'</ATTRIBUTE-DEFINITION-BOOLEAN-REF></DEFINITION>'
								+  '</ATTRIBUTE-VALUE-BOOLEAN>'
							break;
						case 'xs:integer':
							xml += '<ATTRIBUTE-VALUE-INTEGER THE-VALUE="'+el.value+'">'
								+	  '<DEFINITION><ATTRIBUTE-DEFINITION-INTEGER-REF>'+el['class']+'</ATTRIBUTE-DEFINITION-INTEGER-REF></DEFINITION>'
								+  '</ATTRIBUTE-VALUE-INTEGER>'
							break;
						case 'xs:double':
							xml += '<ATTRIBUTE-VALUE-REAL THE-VALUE="'+el.value+'">'
								+	  '<DEFINITION><ATTRIBUTE-DEFINITION-REAL-REF>'+el['class']+'</ATTRIBUTE-DEFINITION-REAL-REF></DEFINITION>'
								+  '</ATTRIBUTE-VALUE-REAL>'
							break;
						case 'xs:string':
							xml += '<ATTRIBUTE-VALUE-STRING THE-VALUE="'+el.value+'">'
								+	  '<DEFINITION><ATTRIBUTE-DEFINITION-STRING-REF>'+el['class']+'</ATTRIBUTE-DEFINITION-STRING-REF></DEFINITION>'
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
							// add a xtml namespace and an enclosing <div> bracket, if needed:
							let	hasDiv = RE_hasDiv.test(el.value),
								txt = el.value.replace( RE_tag, function($0,$1,$2) { 
									return $1+ns_xhtml+':'+$2
								});
							xml += '<ATTRIBUTE-VALUE-XHTML>'
								+	  '<DEFINITION><ATTRIBUTE-DEFINITION-XHTML-REF>'+el['class']+'</ATTRIBUTE-DEFINITION-XHTML-REF></DEFINITION>'
								+     '<THE-VALUE>'+(hasDiv?'':'<'+ns_xhtml+':div>')+txt+(hasDiv?'':'</'+ns_xhtml+':div>')+'</THE-VALUE>'
								+  '</ATTRIBUTE-VALUE-XHTML>'
							break;
						case 'xs:enumeration':
							xml += '<ATTRIBUTE-VALUE-ENUMERATION>'
								+		'<DEFINITION><ATTRIBUTE-DEFINITION-ENUMERATION-REF>'+el['class']+'</ATTRIBUTE-DEFINITION-ENUMERATION-REF></DEFINITION>'
								+			'<VALUES>'
							let vL = el.value.split(',');  // in case of ENUMERATION, value carries comma-separated value-IDs
							vL.forEach( function(v) {
								xml += '<ENUM-VALUE-REF>'+v+'</ENUM-VALUE-REF>'
							});
							xml += 			'</VALUES>'
								+	'</ATTRIBUTE-VALUE-ENUMERATION>'
							break;
						case 'xs:dateTime':
							break;
					};

				});
				return xml + '</VALUES>'
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
				return xml + '</CHILDREN>'
			}
			function iterate( tree, fn ) {
				fn( tree );
				if( tree.nodes )
					tree.nodes.forEach( function(n) {
						iterate( n, fn )
					})
			}
	};
	self.abort = function() {
//		app.cache.abort();
//		server.project().cancelImport()
		self.abortFlag = true
	};
	return self
});
