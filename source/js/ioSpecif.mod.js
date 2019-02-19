/*	ReqIF Server: SpecIF import 
	Dependencies: jQuery 3.1+, Bootstrap 3, BootstrapDialog, module 'importAny',
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
/*	// the mode for creating a new project:
	modeCre = {
		id: 'create',
		title: 'Create a new project with the given id',
		description: 'All types, objects, relations and hierarchies will be created as specified.'
	};  */	
	// the modes for selection when an import is encountered which is already loaded:
	var	modes = [{
			id: 'update',
			title: 'Update the project with new or changed content',
			description: 'New objects will be created, modified ones will be superseded and the hierarchy will be replaced.'
		},{
			id: 'replace',
			title: 'Replace the project having the same id',
			description: 'Existing content will be lost.'
		},{
			id: 'clone',
			title: 'Create a new instance of the project with a new id',
			description: 'There will be two projects with the existing and the new content.'
		}],
		zipped = null,
//		template = null,	// a new Id is given and user is asked to input a project-name
		mode = null;	// selected mode (how to import)
		
	self.init = function() {
		return true
	};

	self.verify = function( f ) {
		// return f if file-type is eligible, null otherwise.
		// 'specifz' is a specif file with optional images/attachments in a zipped file.
		// 'specif' is a plain text file with specif data.

		if( f.name.endsWith('.specif')) {
			zipped = false;
//			template = false;
			return f
		};
		if( f.name.endsWith('.specifz')) {
			zipped = true;
//			template = false;
			return f
		};
/*		if( f.name.endsWith('.specift')) {
			zipped = false;
			template = true;
			return f
		};
		if( f.name.endsWith('.speciftz')) {
			zipped = true;
			template = true;
			return f
		};
*/		// else:
		try {
			message.show( i18n.phrase('ErrInvalidFileSpecif', f.name), {severity:'warning'} );
		} catch (e) {
			alert(f.name+' has invalid file type.')
		};
		return null
	};
	self.asJson = function( data ) {
		// import specif data as JSON:
		var jDO = $.Deferred();
//		console.debug('asJson',data);
		
		// First check if there is a project with the same id:
			function sameId() {
				for( var p=self.parent.projectL.length-1; p>-1; p-- ) {
//					console.debug(data.id,self.parent.projectL[p].id);
					if( data.id==self.parent.projectL[p].id ) return true
				};
				return false
			}
		if( sameId() ) {
			let dlg = new BootstrapDialog({
				title: 'Please choose the import mode:',
				type: 'type-default',
				message: function (thisDlg) {
					// ToDo: error message, if no specification type is found.
					let form = $('<form id="attrInput" role="form" class="form-horizontal" ></form>');
					form.append( radioInput( 'Import Mode', modes ) );
					return form },
				buttons: [{
						label: i18n.BtnCancel,
						action: function(thisDlg){ 
							jDO.reject({status: 1, statusText:'Cancelled'});
							thisDlg.close() 
						}
					},{ 	
						label: i18n.BtnSave,
						cssClass: 'btn-success', 
						action: function (thisDlg) {
							mode = modes[ radioValue( 'Import Mode' ) ];
							// save according to the selected mode:
							switch( mode.id ) {
								case 'clone': 	
									data.id = genID('P-');
									// no break
								case 'replace':
									jDO.notify('Creating project',20); 
									myProject.create( specif.set(data) )
										.progress( jDO.notify )
										.done( jDO.resolve )
										.fail( jDO.reject );
									break;
								case 'update':
									// First, load the project for comparison:
									jDO.notify('Updating project',20); 
									myProject.read({id:data.id}, {reload:true})	// reload from server
										.done( function(refD) {
//											console.debug('specif.update',refD,data)
											// ... then start to save the new or updated elements:
											myProject.update( specif.set(data), 'extend' )
												.progress( jDO.notify )
												.done( jDO.resolve )
												.fail( jDO.reject )
										})
										.fail( jDO.reject )
							};
							thisDlg.close()
						}
					}]
			})
			.open()
		} else {
			// Create a new project:
//			mode = modeCre;
//			console.debug('Creating project',data);
			jDO.notify('Creating project',20); 
			myProject.create( specif.set(data) )
				.progress( jDO.notify )
				.done( jDO.resolve )
				.fail( jDO.reject )
		};
		return jDO
	};
	self.asBuf = function( buf ) {
		// import a read file buffer containing specif data:
		// a button to upload the file appears at <object id="file-object"></object>
		self.abortFlag = false;
		var zDO = $.Deferred();
		if( zipped ) {
			let zip = new JSZip();
			zip.loadAsync(buf).then( function(zip) {
				let fileList = zip.filter(function (relPath, file) {return file.name.endsWith('.specif')}),
					data = {};

				if( fileList.length<1 ) {
					zDO.reject({ status: 901, statusText: 'No SpecIF file in the specifz container.' });
					return zDO
				};
				// take the first specif file found, ignore any other so far:
				zip.file( fileList[0].name ).async("string")
				.then( function(dta) {
					// Check if data is valid JSON:
					try {
						// Please note:
						// - the file may have a UTF-8 BOM
						// - all property values are encoded as string, even if boolean, integer or double.
						dta = JSON.parse( dta.trimJSON() );
						specif.check( dta )
						.progress( zDO.notify )
						.done( function(dta) {
							data = dta;
							data.files = [];
							// SpecIF data is valid.
							// First load the files, so that they get a lower revision number as the referencing objects.
							// Create a list of all eligible files:
							fileList = zip.filter(function (relPath, file) {
												let x = extOf(file.name);
												// file must have an extension:
												if( !x ) return false;
												x = x.toLowerCase();
												// only certain file types are permissible:
												// extension must be contained in either one of the lists:
												return ( CONFIG.imgExtensions.indexOf( x )>-1 || CONFIG.officeExtensions.indexOf( x )>-1 )
											});
							if( fileList.length>0 ) {
								let pend = fileList.length;
								fileList.forEach( function(e) { zip.file(e.name).async("blob")
													.then( function(f) {
														data.files.push({blob:f, id:e.name});
//														console.debug('file',pend,data.files);
														if(--pend<1)
															// now all files are extracted from the ZIP, so we can import:
															self.asJson( data )		// data is in SpecIF format
																.progress( zDO.notify )
																.done( zDO.resolve )
																.fail( zDO.reject )
													}) 
												})
							} else {
								// no files with permissible types are supplied:
								self.asJson( data )		// data is in SpecIF format
									.progress( zDO.notify )
									.done( zDO.resolve )
									.fail( zDO.reject )
							}
						})
						.fail( zDO.reject )
					} catch (e) {
						zDO.reject({ status: 900, statusText: 'SpecIF data is not valid JSON' });
						return zDO
					}
				})
			});
		} else {
			// Selected file is not zipped - it is expected to be SpecIF data in JSON format.
			// Check if data is valid JSON:
			try {
				// Cut-off UTF-8 byte-order-mask ( 3 bytes xEF xBB xBF ) at the beginning of the file, if present.
				// The resulting data before parsing must be a JSON string enclosed in curly brackets "{" and "}".
				var dta = JSON.parse( buf2str(buf).trimJSON() )
			} catch (e) {
				zDO.reject({ status: 900, statusText: 'SpecIF data is not valid JSON' });
				return zDO
			};
				
			specif.check( dta )
				.progress( zDO.notify )
				.done( function() {
					// SpecIF data is valid.
					self.asJson( dta )
						.progress( zDO.notify )
						.done( zDO.resolve )
						.fail( zDO.reject )
				})
				.fail( zDO.reject )
		};
		return zDO
	};
	self.abort = function() {
		myProject.abort();
		self.abortFlag = true
	};
	return self

	function extOf(str) {
		// return the file extension without the dot:
		return str.substring( str.lastIndexOf('.')+1 )
	}
});
