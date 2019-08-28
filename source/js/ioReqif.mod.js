/*	ReqIF Server: ReqIF import
	Dependencies: jQuery
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de            
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
		// transform pr as SpecIF to ReqIF:
		// ToDo:
		// - default values
		let date = new Date().toISOString();

		var xml = 
				'<?xml version="1.0" encoding="UTF-8"?>'
			+	'<REQ-IF xmlns="http://www.omg.org/spec/ReqIF/20110401/reqif.xsd" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
			+	'<THE-HEADER>'
			+	  '<REQ-IF-HEADER IDENTIFIER="'+pr.id+'">'
			+		'<COMMENT>'+(pr.description || '')+'</COMMENT>'
			+		'<CREATION-TIME>'+date+'</CREATION-TIME>'
			+		'<REQ-IF-TOOL-ID></REQ-IF-TOOL-ID>'
			+		'<REQ-IF-VERSION>1.1</REQ-IF-VERSION>'
			+		'<SOURCE-TOOL-ID>'+(pr.tool || '')+'</SOURCE-TOOL-ID>'
			+		'<TITLE>'+pr.title+'</TITLE>'
			+	  '</REQ-IF-HEADER>'
			+	'</THE-HEADER>'
			+	'<CORE-CONTENT>'
			+	  '<REQ-IF-CONTENT>'
			+		'<DATATYPES>';
		if(pr.dataTypes)	
			pr.dataTypes.forEach( function(el) {
				switch( el.type ) {
					case 'xs:boolean':
						xml += '<DATATYPE-DEFINITION-BOOLEAN '+commonAtts( el )+'/>';
						break;
					case 'xs:integer':
						xml += '<DATATYPE-DEFINITION-INTEGER '+commonAtts( el )+' MAX="'+el.max+'" MIN="'+el.min+'" />';
						break;
					case 'xs:double':
						xml += '<DATATYPE-DEFINITION-REAL '+commonAtts( el )+' MAX="'+el.max+'" MIN="'+el.min+'" ACCURACY="'+el.accuracy+'" />';
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
						console.error('unknown dataType: ',el.type)
				}
			});
		xml +=  '</DATATYPES>'
			+	'<SPEC-TYPES>';
			
		// Sort SPEC-OBJECT-TYPEs and SPECIFICATION-TYPEs:
		let req = {
			objTypes: [],
			spcTypes: [],
			objects: []
		};

			function prepObj( n ) {
				let r = itemById(pr.resources,n.resource),
					rC = itemById(pr.resourceClasses,r['class']);
				// ReqIF does not support inheritance, so include any properties of the ancestor:
				if( rC._extends ) {
					let anc = itemById(pr.resourceClasses,r._extends);
					if( anc.propertyClasses && rC.propertyClasses ) 
						rC.propertyClasses = anc.propertyClasses.concat(rC.propertyClasses)
				};
				// If a resourceClass is shared between a ReqIF OBJECT and a ReqIF SPECIFICATION, 
				// it must have a different id:
				if( indexById( req.spcTypes, rC.id )>-1 ) {
					// clone before changing certain properties:
					rC = simpleClone(rC);  
					rC.id = 'RC-'+rC.id;
					r['class'] = rC.id
					// ToDo: update all other references of rC.id, e.g. 'extends'.
				};
				// store without duplication:
				cacheE( req.objTypes, rC );
				cacheE( req.objects, r )
			}
		pr.hierarchies.forEach( function(h) {
			// The resources referenced at the lowest level of hierarchies 
			// are SPECIFICATIONS in terms of ReqIF:
			let r = itemById(pr.resources,h.resource);
			cacheE( req.spcTypes, itemById(pr.resourceClasses,r['class']) );
			if( r.title ) h.title = r.title;
			if( r.description ) h.description = r.description
			if( r.properties ) h.properties = r.properties;
			if( h.nodes )
				h.nodes.forEach( function(n) {
					iterate( n, prepObj )
				})
		});
//		console.debug( 'reqSort', req );
		
		// Write OBJECT-TYPEs from resourceClasses:
		req.objTypes.forEach( function(el) {
			xml += '<SPEC-OBJECT-TYPE '+commonAtts( el )+'>'
				+		attrTypes( el )
				+ '</SPEC-OBJECT-TYPE>'
		});
		// Write RELATION-TYPES from statementClasses:
		if(pr.statementClasses)	
			pr.statementClasses.forEach( function(el) {
				xml += '<SPEC-RELATION-TYPE '+commonAtts( el )+'>'
					+		attrTypes( el )
				    +  '</SPEC-RELATION-TYPE>'
			});
		// Write SPECIFICATION-TYPEs:
		req.spcTypes.forEach( function(el) {
			xml += '<SPECIFICATION-TYPE '+commonAtts( el )+'>'
				+		attrTypes( el )
				+  '</SPECIFICATION-TYPE>';
		}); 
		xml +=  '</SPEC-TYPES>'
		// Write OBJECTS from resources:
			+	'<SPEC-OBJECTS>';
		req.objects.forEach( function(el) {
			xml += '<SPEC-OBJECT '+commonAtts( el )+'>'
				+		'<TYPE><SPEC-OBJECT-TYPE-REF>'+el['class']+'</SPEC-OBJECT-TYPE-REF></TYPE>'
				+		attsOf( el )
				+ '</SPEC-OBJECT>'
		});
		xml +=  '</SPEC-OBJECTS>'
		// Write RELATIONs from statements:
			+	'<SPEC-RELATIONS>';
		pr.statements.forEach( function(el) {
			xml += '<SPEC-RELATION '+commonAtts( el )+'>'
				+		attsOf( el )
				+		'<TYPE><SPEC-RELATION-TYPE-REF>'+el['class']+'</SPEC-RELATION-TYPE-REF></TYPE>'
				+		'<SOURCE><SPEC-OBJECT-REF>'+el.subject+'</SPEC-OBJECT-REF></SOURCE>'
				+		'<TARGET><SPEC-OBJECT-REF>'+el.object+'</SPEC-OBJECT-REF></TARGET>'
				+ '</SPEC-RELATION>'
		});
		xml +=  '</SPEC-RELATIONS>'
		// Write SPECIFICATIONs from hierarchies:
			+	'<SPECIFICATIONS>';
		pr.hierarchies.forEach( function(el) {
			xml += '<SPECIFICATION '+commonAtts( el )+'>'
				+		attsOf( el )
				+   	childrenOf( el );
			xml + '</SPECIFICATION>'
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
							// - <IMG>
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
							let hasDiv = el.value.startsWith('<div>') && el.value.endsWith('</div>');
							xml += '<ATTRIBUTE-VALUE-XHTML>'
								+	  '<DEFINITION><ATTRIBUTE-DEFINITION-XHTML-REF>'+el['class']+'</ATTRIBUTE-DEFINITION-XHTML-REF></DEFINITION>'
								+     '<THE-VALUE>'+(hasDiv?'':'<div>')+el.value+(hasDiv?'':'</div>')+'</THE-VALUE>'
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
						xml += '<SPEC-HIERARCHY IDENTIFIER="'+(ch.id||'N-'+ch.resource)+'" LONG-NAME="'+(ch.title||'')+'" LAST-CHANGE="'+ch.changedAt+'">'
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
