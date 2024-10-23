/*!	RDF import and export
	Dependencies: 
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/

// Constructor for RDF import and export:
// (A module constructor is needed, because there is an access to parent's data via 'self.parent..')
moduleManager.construct({
	name: 'ioRdf'
}, function(self:ITransform) {

	var mime: string;
	self.init = function():boolean {
		return true;
	};
	self.verify = function( f ):boolean {
	
			function rdfFile2mediaType( fname:string ):string {
				if( fname.endsWith('.rdf') || fname.endsWith('.xml') ) return 'application/rdf+xml';
				return '';
			}
				
		mime = rdfFile2mediaType( f.name );
		if ( mime ) 
			return true;
		// else:
		message.show( i18n.lookup('ErrInvalidFileRdf', f.name) );
		return false;
	};
/*	self.toSpecif = function( buf: ArrayBuffer ) {
	}; 
	self.fromSpecif = function(pr:SpecIF):string {
		// pr is SpecIF data in JSON format (not the internal cache),
		// transform pr to RDF:
		
//		console.debug( 'ioRdf.fromSpecif', simpleClone(pr) );
		
		var xml = '';

		return xml;
	}; */
	self.abort = function():void {
//		app.projects.abort();
		self.abortFlag = true
	};
	return self;
});
