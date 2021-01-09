/*!	SpecIF import 
	Dependencies: jQuery 3.1+
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de            
*/

// constructor for SpecIF import:
// (A module constructor is needed, because there is an access to parent's data via 'self')
modules.construct({
	name: 'ioSpecif'
}, function(self) {
	"use strict";
	let zipped,
//		template,	// a new Id is given and user is asked to input a project-name
		opts;
		
	const 
		errNoOptions = { status: 899, statusText: 'Programming flaw: No options or no mediaTypes defined.' },
		errNoSpecif = { status: 901, statusText: 'No SpecIF file in the specifz container.' },
		errInvalidJson = { status: 900, statusText: 'SpecIF data is not valid JSON.' };
		
	self.init = function(options) {
		opts = options;
//		console.debug('iospecif.init',options);
		return true;
	};

	self.verify = function( f ) {
		// return f if file-type is eligible, null otherwise.
		// 'specifz' is a specif file with optional images/attachments in a zipped file.
		// 'specif' is a plain text file with specif data.
//		console.debug('iospecif.verify',f);

		if( f.name.endsWith('.specif') ) {
			zipped = false;
//			template = false;
			return f;
		};
		if( f.name.endsWith('.specifz') || f.name.endsWith('.specif.zip') ) {
			zipped = true;
//			template = false;
			return f;
		};
	/*	if( f.name.endsWith('.specift') ) {
			zipped = false;
			template = true;
			return f;
		};
		if( f.name.endsWith('.speciftz') ) {
			zipped = true;
			template = true;
			return f;
		}; */
		// else:
		try {
			message.show( i18n.phrase('ErrInvalidFileSpecif', f.name), {severity:'warning'} );
		} catch (err) {
			alert(f.name+' has invalid file type.');
		};
		return null;
	};
	self.toSpecif = function( buf ) {
		// import a read file buffer containing specif data:
		// a button to upload the file appears at <object id="file-object"></object>
//		console.debug('iospecif.toSpecif');
		self.abortFlag = false;
		var zDO = $.Deferred();
		if( zipped ) {
			let zip = new JSZip();
			zip.loadAsync(buf)
			.then( function(zip) {
				let fileL = zip.filter(function (relPath, file) {return file.name.endsWith('.specif')}),
					data = {};

				if( fileL.length<1 ) {
					zDO.reject( errNoSpecif );
					return zDO;
				};
//				console.debug('iospecif.toSpecif 1',fileL[0].name);
				// take the first specif file found, ignore any other so far:
				zip.file( fileL[0].name ).async("string")
				.then( function(dta) {
					// Check if data is valid JSON:
					try {
						// Please note:
						// - the file may have a UTF-8 BOM
						// - all property values are encoded as string, even if boolean, integer or double.
						data = JSON.parse( dta.trimJSON() );
						data.files = [];
						// SpecIF data is valid.
						
						if( opts && typeof(opts.mediaTypeOf)=='function' ) {
							// First load the files, so that they get a lower revision number as the referencing resources.
							// Create a list of all attachments:
							fileL = zip.filter(function (relPath, file) {return !file.name.endsWith('.specif')});
//							console.debug('iospecif.toSpecif 2',fileL);
							if( fileL.length>0 ) {
								let pend = 0;
								fileL.forEach( function(aFile) { 
													if( aFile.dir ) return false;
												//	let fType = aFile.type || opts.mediaTypeOf(aFile.name);
													let fType = opts.mediaTypeOf(aFile.name);
													if( !fType ) return false;
													// only extract files with known mediaTypes:
													
//													console.debug('iospecif.toSpecif 3',fType,aFile.date,aFile.date.toISOString());
													pend++;
													zip.file(aFile.name).async("blob")
													.then( function(f) {
														data.files.push({ 
															blob:f, 
															id: 'F-'+aFile.name.simpleHash(), 
															title: aFile.name, 
															type: fType, 
															changedAt: aFile.date.toISOString() 
														});
//														console.debug('file',pend-1,aFile,data.files);
														if(--pend<1)
															// now all files have been extracted from the ZIP, so we can return the data:
															zDO.resolve( data );  // data is in SpecIF format
													});
												});
								if( pend<1 ) zDO.resolve( data );	// no suitable file found, continue anyways
							} else {
								// no files with permissible types are supplied:
								zDO.resolve( data );		// data is in SpecIF format
							}
						} else {
							// no function for filtering and mapping the mediaTypes supplied:
							console.warn(errNoOptions.statusText);
							// return SpecIF data anyways:
							zDO.resolve( data );		// data is in SpecIF format
						};
					} catch (err) {
						zDO.reject( errInvalidJson );
					};
				});
			});
		} else {
			// Selected file is not zipped - it is expected to be SpecIF data in JSON format.
			// Check if data is valid JSON:
			try {
				// Cut-off UTF-8 byte-order-mask ( 3 bytes xEF xBB xBF ) at the beginning of the file, if present.
				// The resulting data before parsing must be a JSON string enclosed in curly brackets "{" and "}".
				var data = JSON.parse( buf2str(buf).trimJSON() );
				zDO.resolve( data );
			} catch (err) {
				zDO.reject( errInvalidJson );
			};
		};
		return zDO;
	};
	self.abort = function() {
		self.abortFlag = true;
	};
	return self;
});
