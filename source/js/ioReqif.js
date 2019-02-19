/*	ReqIF Server: ReqIF import and Creation of new projects from template
	Dependencies: jQuery
	(C)copyright 2010-2017 enso managers gmbh (http://www.enso-managers.com)
	Author: se@enso-managers.com, Berlin
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de            
*/
/*		ToDo: Move to the transformation from SpecIF to ReqIF:
		// 4. If there is just an image, create a single object, because <img..> is not allowed in ReqIF:
		// This has been created interactively by a user
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
		);
//		console.debug('fromGUI 5:', JSON.stringify(txt));  */

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
	self.verify = function( f ) {
		console.log(f.name);
	
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
	self.asBuf = function( buf ) {
		return server.project().upload( buf, mime )
	};
	self.abort = function() {
//		myProject.abort();
		server.project().cancelImport()
	};
	return self

	function toReqif(pr) {
		// transform pr as SpecIF to ReqIF:
		let date = new Date().toISOString(),
			i, I, el;

		var xml = 
			'<?xml version="1.0" encoding="UTF-8"?>' +
			'<REQ-IF xmlns="http://www.omg.org/spec/ReqIF/20110401/reqif.xsd" xmlns:xhtml="http://www.w3.org/1999/xhtml">' +
			'<THE-HEADER>' +
			  '<REQ-IF-HEADER IDENTIFIER="'+pr.id+'">' +
				'<COMMENT>'+(pr.description || '')+'</COMMENT>' +
				'<CREATION-TIME>'+date+'</CREATION-TIME>' +
				'<REQ-IF-TOOL-ID></REQ-IF-TOOL-ID>' +
				'<REQ-IF-VERSION>1.0</REQ-IF-VERSION>' +
				'<SOURCE-TOOL-ID>'+(pr.tool || '')+'</SOURCE-TOOL-ID>' +
				'<TITLE>'+pr.title+'</TITLE>' +
			  '</REQ-IF-HEADER>' +
			'</THE-HEADER>' +
			'<CORE-CONTENT>' +
			  '<REQ-IF-CONTENT>' +
				'<DATATYPES>';
		if(pr.dataTypes)	
			for( i=0, I=pr.dataTypes.length; i<I; i++ ) {
				el = pr.dataTypes[i];
				switch( el.type ) {
					case 'BOOLEAN':
						xml += '<DATATYPE-DEFINITION-BOOLEAN '+commonAtts( el )+'/>';
						break;
					case 'INTEGER':
						xml += '<DATATYPE-DEFINITION-INTEGER '+commonAtts( el )+' MAX="'+el.max+'" MIN="'+el.min+'" />';
						break;
					case 'REAL':
						xml += '<DATATYPE-DEFINITION-REAL '+commonAtts( el )+' MAX="'+el.max+'" MIN="'+el.min+'" ACCURACY="'+el.accuracy+'" />';
						break;
					case 'STRING':
						xml += '<DATATYPE-DEFINITION-STRING '+commonAtts( el )+' MAX-LENGTH="'+el.maxLength+'" />';
						break;
					case 'XHTML':
						xml += '<DATATYPE-DEFINITION-XHTML '+commonAtts( el )+'/>';
						break;
					case 'ENUMERATION':
						xml += '<DATATYPE-DEFINITION-ENUMERATION '+commonAtts( el )+'>' +
								'<SPECIFIED-VALUES>';
						for( var v=0,V=el.values.length;v<V;v++ ) {
							xml += '<ENUM-VALUE IDENTIFIER="'+el.values[v].id+'" LONG-NAME="'+el.values[v].title+'" LAST-CHANGE="'+dateTime(el)+'" >' +
									 '<PROPERTIES><EMBEDDED-VALUE KEY="'+v+'" OTHER-CONTENT="" /></PROPERTIES>' +
								   '</ENUM-VALUE>';
						};
						xml += 	'</SPECIFIED-VALUES>' +
								'</DATATYPE-DEFINITION-ENUMERATION>';
						break;
					case 'DATETIME':
						xml += '<DATATYPE-DEFINITION-DATE '+commonAtts( el )+'/>';
						break;
				}
			};
		xml +=  '</DATATYPES>' +
				'<SPEC-TYPES>';
		if(pr.objTypes)	
			for( i=0, I=pr.objTypes.length; i<I; i++ ) {
				el = pr.objTypes[i];
				xml += '<SPEC-OBJECT-TYPE '+commonAtts( el )+'>' +
							attrTypes( el.attributeTypes ) +
				      '</SPEC-OBJECT-TYPE>';
			};
		if(pr.relTypes)	
			for( i=0, I=pr.relTypes.length; i<I; i++ ) {
				el = pr.relTypes[i];
				xml += '<SPEC-RELATION-TYPE '+commonAtts( el )+'>' +
							attrTypes( el.attributeTypes ) +
				      '</SPEC-RELATION-TYPE>';
			};
		if(pr.spcTypes)	
			for( i=0, I=pr.spcTypes.length; i<I; i++ ) {
				el = pr.spcTypes[i];
				xml += '<SPECIFICATION-TYPE '+commonAtts( el )+'>' +
							attrTypes( el.attributeTypes ) +
				      '</SPECIFICATION-TYPE>';
			};
		xml +=  '</SPEC-TYPES>' +
				'<SPEC-OBJECTS></SPEC-OBJECTS>' +
				'<SPEC-RELATIONS></SPEC-RELATIONS>' +
				'<SPECIFICATIONS></SPECIFICATIONS>' +
				'<SPEC-RELATION-GROUPS></SPEC-RELATION-GROUPS>' +
			  '</REQ-IF-CONTENT>' +
			'</CORE-CONTENT>' +
			'<TOOL-EXTENSIONS></TOOL-EXTENSIONS>' +
			'</REQ-IF>';
/*		let blob = new Blob([xml], {type: "text/plain; charset=utf-8"});
		// save to file using fileSaver.js:
		saveAs(blob, "debug.reqif", true);		// true: no_auto_bom, i.e. suppress EF BB BF at the beginning of the file
		console.debug('reqif',xml);
*/		return xml

			function dateTime( e ) {
				return e.changedAt || pr.changedAt || date
			}
			function commonAtts( e ) {
				return 'IDENTIFIER="'+e.id+'" LONG-NAME="'+e.longName+'" DESC="'+typInfo.toReqif(e).escapeXML()+'" LAST-CHANGE="'+dateTime(e)+'"'
			}
			function attrTypes( at ) {
				if( !at ) return '';
				var xml='<SPEC-ATTRIBUTES>';
				for( var j=0, J=at.length; j<J; j++ ) {
					switch( itemById( pr.dataTypes, at[j].dataType ).type ) {
						case 'BOOLEAN':
							xml += 	'<ATTRIBUTE-DEFINITION-BOOLEAN IDENTIFIER="'+at[j].id+'" LONG-NAME="'+vocabulary.property.reqif(at[j].longName)+'" LAST-CHANGE="'+dateTime(at[j])+'">' +
										'<TYPE><DATATYPE-DEFINITION-BOOLEAN-REF>'+at[j].dataType+'</DATATYPE-DEFINITION-BOOLEAN-REF></TYPE>' +
									'</ATTRIBUTE-DEFINITION-BOOLEAN>'
							break;
						case 'INTEGER':
							xml += 	'<ATTRIBUTE-DEFINITION-INTEGER IDENTIFIER="'+at[j].id+'" LONG-NAME="'+vocabulary.property.reqif(at[j].longName)+'" LAST-CHANGE="'+dateTime(at[j])+'">' +
										'<TYPE><DATATYPE-DEFINITION-INTEGER-REF>'+at[j].dataType+'</DATATYPE-DEFINITION-INTEGER-REF></TYPE>' +
									'</ATTRIBUTE-DEFINITION-INTEGER>'
							break;
						case 'REAL':
							xml += 	'<ATTRIBUTE-DEFINITION-REAL IDENTIFIER="'+at[j].id+'" LONG-NAME="'+vocabulary.property.reqif(at[j].longName)+'" LAST-CHANGE="'+dateTime(at[j])+'">' +
										'<TYPE><DATATYPE-DEFINITION-REAL-REF>'+at[j].dataType+'</DATATYPE-DEFINITION-REAL-REF></TYPE>' +
									'</ATTRIBUTE-DEFINITION-REAL>'
							break;
						case 'STRING':
							xml += 	'<ATTRIBUTE-DEFINITION-STRING IDENTIFIER="'+at[j].id+'" LONG-NAME="'+vocabulary.property.reqif(at[j].longName)+'" LAST-CHANGE="'+dateTime(at[j])+'">' +
										'<TYPE><DATATYPE-DEFINITION-STRING-REF>'+at[j].dataType+'</DATATYPE-DEFINITION-STRING-REF></TYPE>' +
									'</ATTRIBUTE-DEFINITION-STRING>'
							break;
						case 'XHTML':
							xml += 	'<ATTRIBUTE-DEFINITION-XHTML IDENTIFIER="'+at[j].id+'" LONG-NAME="'+vocabulary.property.reqif(at[j].longName)+'" LAST-CHANGE="'+dateTime(at[j])+'">' +
										'<TYPE><DATATYPE-DEFINITION-XHTML-REF>'+at[j].dataType+'</DATATYPE-DEFINITION-XHTML-REF></TYPE>' +
									'</ATTRIBUTE-DEFINITION-XHTML>'
							break;
						case 'ENUMERATION':
							// the property 'multiValued' in case of enumerated types must be specified in any case, because the ReqIF Server (like ReqIF) requires it. 
							// The property 'dataType.multiple' is invisible for the server. 
							xml += 	'<ATTRIBUTE-DEFINITION-ENUMERATION IDENTIFIER="'+at[j].id+'" LONG-NAME="'+vocabulary.property.reqif(at[j].longName)+'" MULTI-VALUED="'+multipleChoice(at[j],pr)+'" LAST-CHANGE="'+dateTime(at[j])+'">' +
										'<TYPE><DATATYPE-DEFINITION-ENUMERATION-REF>'+at[j].dataType+'</DATATYPE-DEFINITION-ENUMERATION-REF></TYPE>' +
									'</ATTRIBUTE-DEFINITION-ENUMERATION>'
							break;
						case 'DATETIME':
							xml += 	'<ATTRIBUTE-DEFINITION-DATE IDENTIFIER="'+at[j].id+'" LONG-NAME="'+vocabulary.property.reqif(at[j].longName)+'" LAST-CHANGE="'+dateTime(at[j])+'">' +
										'<TYPE><DATATYPE-DEFINITION-DATE-REF>'+at[j].dataType+'</DATATYPE-DEFINITION-DATE-REF></TYPE>' +
									'</ATTRIBUTE-DEFINITION-DATE>'
							break;
					}
				};
				return xml + '</SPEC-ATTRIBUTES>'
			}
	}
});
