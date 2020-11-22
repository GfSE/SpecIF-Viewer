﻿/*!	RDF import and export
	Dependencies: 
	Author: 
	(C)copyright 
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution!  
*/

// Constructor for RDF import and export:
// (A module constructor is needed, because there is an access to parent's data via 'self.parent..')
modules.construct({
	name: 'ioRdf'
}, function(self) {
	"use strict";
    var mime;
	self.init = function() {
		mime = undefined;
		return true;
	};
	self.verify = function( f ) {
	
			function rdfFile2mediaType( fname ) {
				if( fname.endsWith('.rdf') || fname.endsWith('.xml') ) return 'application/rdf+xml';
				return; // undefined
			}
				
		mime = rdfFile2mediaType( f.name );
		if ( mime ) 
			return f;
		// else:
		message.show( i18n.phrase('ErrInvalidFileReqif', f.name), 'warning', CONFIG.messageDisplayTimeNormal );
		return; // undefined
	};
	self.toSpecif = function( buf ) {
	};
	self.toRdf = function(pr) {
		// pr is SpecIF data in JSON format (not the internal cache),
		// transform pr to RDF:
		
		console.debug( 'ioRdf.toRdf', simpleClone(pr) );
		
		var xml = '';

		return xml;
	};
	self.abort = function() {
//		app.cache.abort();
		self.abortFlag = true
	};
	return self;
});