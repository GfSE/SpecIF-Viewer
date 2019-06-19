﻿/*	iLaH: BPMN import 
	Dependencies: jQuery 3.0+
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de            
*/

// Constructor for BPMN import:
// (A module constructor is needed, because there is an access to parent's data via 'self')
modules.construct({
	name: 'ioBpmn'
}, function(self) {
	"use strict";
	var	fDate = null,		// the file modification date
		fName = null,
		data = null,		// the SpecIF data structure for xls content
		bDO = null;
		
	self.init = function() {
		return true
	};

	self.verify = function( f ) {

			function isBpmn( fname ) {
				return fname.endsWith('.bpmn') 
			}
				
		if ( !isBpmn(f.name) ) {
			message.show( i18n.phrase('ErrInvalidFileBpmn', f.name) );
			return null
		};
//		console.debug( 'file', f );
		// remove directory path:
		// see https://stackoverflow.com/questions/423376/how-to-get-the-file-name-from-a-full-path-using-javascript
	//	fName = f.name.replace(/^.*[\\\/]/, '');
		fName = f.name.split('\\').pop().split('/').pop();
		if( f.lastModified ) {
			fDate = new Date(f.lastModified);
			fDate = fDate.toISOString();
//			console.debug( 'file.lastModified', fDate )
			return f
		};
		if( f.lastModifiedDate ) {
			// this is deprecated, but at the time of coding, Edge does not support the above, yet:
			fDate = new Date(f.lastModifiedDate);
			fDate = fDate.toISOString();
//			console.debug( 'file.lastModifiedDate', fDate )
			return f
		};
		// take the actual date as a final fall back
		fDate = new Date();
		fDate = fDate.toISOString();
//		console.debug( 'date', fDate );
		return f
	},
	self.toSpecif = function( buf ) {
		// import a BPMN file from a buffer:
		self.abortFlag = false;
		bDO = $.Deferred();

		bDO.notify('Transforming BPMN to SpecIF',10); 
		data = BPMN2Specif( buf2str(buf), {xmlName:fName, xmlDate:fDate} );
//		console.debug('input.prjName', self.parent.projectName, data );
		bDO.resolve( data );

		return bDO
	};
	self.abort = function() {
		app.cache.abort();
		self.abortFlag = true
	};
	return self
});
