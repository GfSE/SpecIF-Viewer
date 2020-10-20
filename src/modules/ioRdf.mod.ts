/*!	RDF import and export
	Dependencies: 
	Author: 
	(C)copyright 
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution!  
*/

// Constructor for ReqIF import:
// (A module constructor is needed, because there is an access to parent's data via 'self')
modules.construct({
	name: 'ioRdf'
}, function(self) {
	"use strict";
    var mime = null;
	self.init = function() {
		mime = null
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
	return self
});
