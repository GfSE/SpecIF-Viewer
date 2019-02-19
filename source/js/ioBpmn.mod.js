/*	iLaH: BPMN import 
	Dependencies: jQuery 3.0+, module 'importAny'
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.com, Berlin
	License: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de            
*/

// Constructor for BPMN import:
// (A module constructor is needed, because there is an access to parent's data via 'self')
modules.construct({
	name: 'ioBpmn'
}, function(self) {
	"use strict";
	// the mode for creating a new project:
/*	modeCre = {
		id: 'create',
		title: 'Create a new project with the given id',
		description: "The entities ('resources') will be created as specified in a folder per worksheet."
	};
*/	// the modes for selection when an import is encountered which is already loaded:
	var	modes = [{
			id: 'update',
			title: "Update changed entities of a project with the same name. All entities (worksheet lines) must have an 'id' property with a unique value; otherwise a new instance of the entity will be created.",
			description: "New entities ('resources') will be created, modified ones will be superseded and the hierarchy will be replaced."
		},{
			id: 'replace',
			title: 'Replace the project with the same name',
			description: 'Existing content will be lost.'
		},{
			id: 'clone',
			title: 'Create a new instance of the project with a new id',
			description: 'There will be two projects with the existing and the new content.'
		}],
		mode = null,		// selected mode (how to import)
		fDate = null,		// the file modification date
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
	self.asBuf = function( buf ) {
		// import a BPMN file from a buffer:
		self.abortFlag = false;
		bDO = $.Deferred();
		
//		bDO.notify('Transforming BPMN to SpecIF',10); 
		data = BPMN2Specif( buf2str(buf), {xmlName:fName, xmlDate:fDate} );
//		console.debug('input.prjName', self.parent.projectName, data );
		specif.check( data )
			.progress( bDO.notify )
			.done( function() {

				// First check if there is a project with the same id:
					function sameId() {
						for( var p=self.parent.projectL.length-1; p>-1; p-- ) {
		//					console.debug(data.id,self.parent.projectL[p].id);
							if( data.id==self.parent.projectL[p].id ) return true
						};
						return false
					}
				if( sameId() ) {
					var dlg = new BootstrapDialog({
						title: 'Please choose the import mode:',
						type: 'type-default',
						message: function (thisDlg) {
							// ToDo: error message, if no specification type is found.
							var form = $('<form id="attrInput" role="form" class="form-horizontal" ></form>');
							form.append( radioInput( 'Import Mode', modes ) );
							return form },
						buttons: [{
								label: i18n.BtnCancel,
								action: function(thisDlg){ 
									bDO.reject({status: 1, statusText:'Cancelled'});
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
											bDO.notify('Creating project',20); 
											myProject.create( specif.set(data) )
												.progress( bDO.notify )
												.done( bDO.resolve )
												.fail( bDO.reject );
											break;
										case 'update':
											// First, load the project for comparison:
											bDO.notify('Updating project',20); 
											myProject.read({id:data.id}, {reload:true})	// reload from server
												.done( function(refD) {
		//											console.debug('specif.update',refD,data)
													// ... then start to save the new or updated elements:
													myProject.update( specif.set(data), 'extend' )
														.progress( bDO.notify )
														.done( bDO.resolve )
														.fail( bDO.reject )
												})
												.fail( bDO.reject )
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
					bDO.notify('Creating project',20); 
					myProject.create( specif.set(data) )
						.progress( bDO.notify )
						.done( bDO.resolve )
						.fail( bDO.reject )
				}
			})
			.fail( bDO.reject )
			return bDO
	};
	self.abort = function() {
		myProject.abort();
		self.abortFlag = true
	};
	return self
});
