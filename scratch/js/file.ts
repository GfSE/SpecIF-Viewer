/*! file object for conversions
	Dependencies: 
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	Author: se@enso-managers.de, Berlin
	We appreciate any correction, comment or contribution!
*/

function File( fi ) {
	var self = this;

	self.set = (f)=>{
		self.projects = f;
	};
	self.get = ( opts )=>{
		return new Promise( (resolve,reject)=>{
			switch( opts.type ) {
				case 'png':
					switch( self.projects.type ) {
						case 'image/png':
						case 'image/x-png':
							if( opts.as=='dataURL' )
							
							else 
								resolve( self.projects );
							break;
						case 'image/jpeg':
						case 'image/jpg':
						case 'image/gif':
						case 'image/svg+xml':
							console.error('File '+self.projects.id+' cannot returned with type '+opts.type+'.');
							reject();
							break;
						default:
							console.error('File '+self.projects.id+' has no type.');
							reject();
					};
					break;
				default:
					console.error('Unknown type '+opts.type+'.');
					reject();
			};
		});
	};

	// initialize:
	self.set( fi );
	return self;
}  // end of File()
