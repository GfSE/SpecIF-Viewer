/*	ReqIF Server: File List.
	Dependencies: jQuery, bootstrap
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de            
*/

function FilesVM() {
	"use strict";
	var self = this;
//	var returnView = null;

	// Standard module interface methods:
	self.open = function( cb ) {
//		if( $.isFunction(cb) ) returnView = cb;   // callback
		self.list = [];  // list of files
		// Get the permissions; for files the project's permissions apply:
		self.filCre = myProject.cre;
		self.filUpd = myProject.upd;
		self.filDel = myProject.del
	};
	self.clear = function() {
		self.list.length = 0;
		$('#files').empty()
	};
	self.hide = function() {
		projects.busy.set( false )
	};
	self.close = function() {
		self.hide();
		self.clear()
	};
/*	// This is a sub-module to specs, so use it's return method
	function returnOnSuccess() {
		self.hide();
		self.clear();
		returnView();
	};
*/	// here, the only way to get out is by selecting another tab.

		function handleError(xhr) {
			self.hide();
			self.clear();
			stdError(xhr,specs.returnToCaller)
		}
		function handleRsp(xhr) {
			switch( xhr.status ) {
				case 200:  // OK!
					projects.busy.set(false);
					return
			};
			handleError( xhr )
		}
		function hasImgRef( obj, re ) {
			// return 'true', if the img is referenced in obj:
			for( var a=obj.attributes.length-1;a>-1;a-- ) {
				// replace all backslashes, even if it is needed in file URLs only:
				if( re.test( obj.attributes[a].content.replace( /\\/g, '/' ) ) ) { return true }
			};
			// no reference in any attribute:
			return false
		}
	
	self.show = function( opts ) {
		if( !myProject || !myProject.id ) return null;
//		console.debug('myFiles.show');
		if( typeof opts != 'object' ) opts = {reload: true}
		
		setContentHeight('new');

		projects.busy.set( true );
		specs.updateHistory();

		// Get the files:
		return getFiles( opts )
			.done(function() {   
				self.list.sort(function(a,b) { return a.id.toLowerCase() > b.id.toLowerCase() });
				$('#files').html( renderFiles( self.list ) );
				projects.busy.set(false);
//				$( '#pageActions' ).html( specs.pageActionBtns() )
				$( '#pageActions' ).empty()
			})
			.fail( handleError )
	};

	function upload( fn, f, name ) {
		var rdr = new FileReader();
		rdr.onload = function(evt) {
			let data = new DataView(evt.target.result);
			data = new Blob([data], { type: f.type });
			fn( 'file', { blob:data, id:name||f.name, type: f.type } )
				.done( function() { self.show({reload: false}) } )
				.fail( handleError )
		};
		rdr.readAsArrayBuffer( f )
	}
	// http://wiki.selfhtml.org/wiki/JavaScript/API/File_Upload
	self.create = function() {
        self.file = document.getElementById('createAttachment').files[0];
//		console.debug('create file',self.file)

		projects.busy.set(true);  
		
		// ToDo: Check, if file with same name/id exists already --> update.
		// ToDo: let user specify a sub-directory.

		upload( myProject.createContent, self.file )
	};
	self.update = function( fileN ) {
		// Load another image (or image revision) using the same name;
		// the file type must be identical, otherwise all references become invalid.
		// ToDo: The new image is not shown in the list due to a caching problem.
        self.file = document.getElementById('f'+fileN.simpleHash()).files[0];
		// the file just picked may have a different name, but must have the same type.
		console.debug('self.file',self.file,fileN)
		if( fileN.fileExt().toLowerCase()!=self.file.name.fileExt().toLowerCase() ) {
			message.show( 'Please select a file of the same type', 'warning', CONFIG.messageDisplayTimeNormal );
			return
		};

		projects.busy.set(true);  

		upload( myProject.updateContent, self.file, fileN )
	};
	self.download = function( id ) {
		// save specified file to local disk:
		let f = itemById( myProject.files, id ),
			fN = id.split('/');
//		console.debug('files.download',id,f,fN);
		// store without path:
		saveAs(f.blob, fN[fN.length-1]);
	};
	self.remove = function( fileN ) {
		// delete the specified file:
		var idx = indexById( self.list, fileN ),
			itm = self.list[idx],
			pend=0;
		var dlg = new BootstrapDialog({
			title: i18n.MsgConfirm,
			type: 'type-danger',
			message: i18n.phrase('MsgConfirmDeletion', itm.id ),
			buttons: [{
				label: i18n.BtnCancel,
				action: function(thisDlg){ 
					thisDlg.close() 
				}
			},{ 
				label: i18n.BtnDelete,
				cssClass: 'btn-danger', 
				action: function (thisDlg) {
					projects.busy.set(true);
					console.info( "Deleting file '"+itm.id+"'." );
					pend++;
					myProject.deleteContent( 'file', {id: itm.id} )
							.done( function() { if( --pend <1 ) projects.busy.set(false) })
							.fail( handleRsp );
					if( itm.preview ) {
						// In practice this is a preview for an OLE object originating from DOORS:
						pend++;
						myProject.deleteContent( 'file', {id: itm.preview} )
							.done( function() { if( --pend <1 ) projects.busy.set(false) })
							.fail( handleRsp )
					};
					// Delete the image from list and DOM:
					self.list.splice( idx, 1 );
					$('#imgFL-'+idx).remove();
					thisDlg.close()
				}
			}]
		})
		.open()		
	};

	self.referencingItemClicked = function( oId ) {
		// Jump to the page view of the clicked object:
		self.hide();
		specs.showTab( CONFIG.objectDetails );  
		specs.selectNodeByRef( {id:oId} )			// changing the tree node triggers an event, by which 'self.refresh' will be called.
	};
	return self

		function renderFiles( fL ) {
			var rL = '<table class="table table-striped table-condensed" >' +
						'<thead>' +
							'<tr>' +
								'<th></th>' +
								'<th></th>' +
								'<th>'+i18n.LblReferences+'</th>' +
								'<th width="40px">'+i18n.LblItemActions+'</th>' +
							'</tr>' +
						'</thead>' +
						'<tbody>';
			if( self.filCre ) 
				rL += 		'<tr>' +
								'<td></td>' +
								'<td>' +
									'<span class="btn btn-success btn-fileinput btn-sm">' +
										'<span >'+i18n.BtnFileSelect+'</span>' +
										'<input id="createAttachment" type="file" onchange="myFiles.create()" />' + 
									'</span>' +
								'</td>' +
								'<td></td>' +
								'<td></td>' +
							'</tr>';
			if( fL.length>0 ) {
				let i, I, r=null,R=null;
				for( i=0,I=fL.length; i<I; i++ ) {
					// every row gets an id, so that we can delete selected images from the DOM:
					rL +=	'<tr id="imgFL-'+i+'">' +
								'<td><div class="forImagePreview" >'+fL[i].link+'</div></td>' +
								'<td><div>'+fL[i].id+'</div></td>' +
								'<td>';
					for( r=0,R=fL[i].refs.length; r<R; r++ ) {
						rL +=		'<a onclick="myFiles.referencingItemClicked(\''+fL[i].refs[r].id+'\')" >'+objTitleOf(fL[i].refs[r])+'</a><br />'
					};
					rL +=		'</td>' +
								'<td>' +
									'<div class="btn-group btn-group-xs pull-right" >';
					if( self.filUpd ) {
						rL +=			'<span class="btn btn-default btn-fileinput btn-xs">' +
											'<span>'+i18n.IcoUpdate+'</span>' +
											'<input id="f'+fL[i].id.simpleHash()+'" type="file" onchange="myFiles.update(\''+fL[i].id+'\')" />' + 
										'</span>'
					};
					if( self.filDel ) {
						rL +=			'<button class="btn btn-danger" data-toggle="popover" onclick="myFiles.remove(\''+fL[i].id+'\')" title="'+i18n.LblDelete+'">'+i18n.IcoDelete+'</button>'
					};
					rL +=			'</div>' +
								'</td>' +
							'</tr>'
				}
			} else {
				rL += 		'<tr>' +
								'<td></td>' +
								'<td><div><i>'+i18n.MsgNoFiles+'</i></div></td>' +
								'<td></td>' +
								'<td></td>' +
							'</tr>'
			}
			rL += 		'</tbody>' +
					'</table>';
//			console.debug( 'renderedList', rL );
			return rL.reduceWhiteSpace()	// return rendered list
		}
	
	function getFiles( opts ) { 
		return myProject.readContent( 'file', 'all', opts )
			.done( function(fL) {
				var i, ext, ti, ti2, file2, to,
					s=null, j=null, o=null, m=null, re=null;

				// create a working list so that the original file list remains unchanged:
				self.list.length = 0;
				for( i=0; i<fL.length; i++ ) {
					self.list.push({
						id: fL[i].id,
						type: fL[i].type
					})
				};
					
				for( i=0; i<self.list.length; i++ ) {  // length may change in case entries are deleted ...
					// Create a preview image with link:
					// If two list entries with equal file name are found and one of them is an image, 
					//   it is assumed that one is the preview for the other (in accordance with ReqIF Implementation Guide):
					ext = self.list[i].id.fileExt().toLowerCase();  // the extension excluding '.'
					ti = CONFIG.imgExtensions.indexOf( ext ); 
					to = CONFIG.officeExtensions.indexOf( ext );
					file2 = findPairedFile(i);

					if( file2==null ) {
						// Single file is normal case: if it is an image show it, otherwise show an icon:
//						console.debug('files 2',self.list[i],ext,ti);
						if( ti>-1 ) {  
							// it is an image:
							self.list[i].img = '<span id="'+self.list[i].id.simpleHash()+'" />'
							showImg(itemById( myProject.files, self.list[i].id ))
						} else {
							if( to>-1 ) {  
								// it is an office file, add an icon:
								self.list[i].img = '<img src="'+CONFIG.imgURL+'/'+ext+'-icon.png" type="image/png" />'
							} else {
								self.list[i].img = '<span>download: '+ext+'</span>'
							}
						}
					} else {
						// Combine two complementary files:
						// the second file is an image, the first is not:
//						console.debug('files 3',i,ext,file2);
						self.list[i].img = '<img src="'+file2.href+'" '+self.list[i].type+'/>'   // show image
					};
					// in both cases, add a link to the image:
//					self.list[i].link = self.list[i].img
					// ToDo: Add a link to download the original file:
					self.list[i].link = '<a ondblclick="myFiles.download(\''+self.list[i].id+'\')" data-toggle="popover" title="Double-click to download" >'+self.list[i].img+'</a>'
//					self.list[i].link = '<a href="'+self.list[i].href+'" >'+self.list[i].img+'</a>'
//					console.debug('files 4',self.list[i]);

					// list all references of the given file in objects,
					// assuming that the directory path of any file is separated by '/':
					re = new RegExp( self.list[i].id.escapeRE(), '' );

					self.list[i].refs = [];
					for( s=myProject.specs.length-1; s>-1; s-- ) {
						for( j=myProject.specs[s].objectRefs.length-1; j>-1; j-- ) {
							// find referenced object in the objects list:
							o = itemById( myProject.objects, myProject.specs[s].objectRefs[j] );
							// look whether this object is already listed:
							m = indexById( self.list[i].refs, myProject.specs[s].objectRefs[j] );
							// list, if object found, not yet listed and if it has a reference to the image:
							if( o && m<0 && hasImgRef( o, re ) )
								self.list[i].refs.unshift( o )
						}
					}
					// ToDo: load objects of other specs
				};
				console.debug('self.list',self.list);
				return

					function findPairedFile(i) {
						// In practice this is to detect a combination of an OLE object with a preview image originating from DOORS:
						// As a result there is the main file at index 'i', whereas the preview image is returned (if exists):
						// It is assumed that only 2 files with equal names exist.
						let nam = self.list[i].id.fileName();  // get the name excluding '.'
						if( nam==null ) {
							console.error( "When showing the file list, the name '"+self.list[i].id+"' has not been recognized as file-name." )
						} else {
							for( var j=i+1; j<self.list.length; j++ ) {
								let nam2 = self.list[j].id.fileName();  // get the name excluding '.'
								if( nam2 && nam==nam2 ) {
									// two equal file names found
									let ext2 = self.list[j].id.fileExt().toLowerCase();  // get the extension including '.'
									ti2 = CONFIG.imgExtensions.indexOf( ext2 );
									if (ti<0 && ti2>-1) {
										// the second file is an image, the other is not:
										self.list[i].preview = self.list[j].id;
										return self.list.splice(j,1)[0]
									};
									if (ti>-1 && ti2<0) {
										// the first file is an image, the other is not.
										// exchange the file positions
										self.list[j].preview = self.list[i].id;
										ext = ext2;
										ti = ti2;
										let p = self.list.splice(j,1)[0];  // remove the main file
										return self.list.splice(i,1,p)	   // remove the image and reinsert the main file at the same position
									};
									// no combination of files:
									return null
								}
							}
						};
						return null
					}
			})
	}
};
var myFiles = new FilesVM();
