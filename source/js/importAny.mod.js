/*	GUI and control for SpecIF, ReqIF and XLS import
	Dependencies: jQuery 3.1+, bootstrap 3.1
	Copyright enso managers gmbh (http://enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de
*/

modules.construct({
	name: 'importAny'
}, function(self) {
	"use strict";

	// The modes for selection when an import is encountered which is already loaded:
	const importModes = [{
			id: 'create',
			title: 'Create a new project with the given id',
			desc: 'All types, objects, relations and hierarchies will be created as specified.',
			label: i18n.BtnCreate
	/*	},{
			id: 'clone',
			title: 'Create a new instance of the project with a new id',
			desc: 'There will be two projects with the existing and the new content.',
			label: i18n.BtnClone  */
		},{
			id: 'replace',
			title: 'Replace the project having the same id',
			desc: 'Existing content will be lost.',
			label: i18n.BtnReplace
		},{
			id: 'adopt',
			title: 'Add the new project without effect on the existing one',
			desc: 'Add diagrams and adopt any existing resource having an identical name.',
			label: i18n.BtnAdopt
		},{
			id: 'update',
			title: 'Update the project with new or changed content',
			desc: 'New objects will be created, modified ones will be superseded.',
			label: i18n.BtnUpdate
		}]; 

	// The import formats
	const formats = [{
			id:'specif',
			name:'ioSpecif',
			desc:'Specification Integration Facility',	
			label:'SpecIF',	
			help: i18n.MsgImportSpecif,	
			opts: {mediaTypeOf: attachment2mediaType}
		},{
			id:'reqif',	
			name:'ioReqif',	
			desc:'Requirement Interchange Format',
			label:'ReqIF',
			help: i18n.MsgImportReqif, 
			opts: {mediaTypeOf: attachment2mediaType}
		},{
			id:'bpmn',
			name:'ioBpmn',
			desc:'Business Process',
			label:'BPMN',
			help: i18n.MsgImportBpmn
	/*	},{
			id:'togaf',	
			name:'ioTogaf',	
			desc:'The Open Group Architecture Framework',
			label:'TOGAF®',
			help: i18n.MsgImportTogaf, 
			opts: {mediaTypeOf: attachment2mediaType}  */
		},{ 
			id:'xls',
			name:'ioXls',
			desc:'MS Excel® Spreadsheet',
			label:'Excel®',
			help: i18n.MsgImportXls,
			opts: {dontCheck:['statement.object']}
		},{
			id:'mm',
			name:'ioMm',
			desc:'Freemind Mindmap',
			label:'MM',	
			help: i18n.MsgImportMm
		}];
	// list of projects to check whether the project is already existent in the server.
	// keep the list variable at all times, do not overwrite it:
//	self.projectL = [];  	// list of the projects already available
	self.projectName = '';  // user input for project name
	self.format = undefined;
	var showFileSelect = undefined,
		importMode = {id:'replace'},
		myFullName = 'app.'+self.loadAs,
		urlP;				// the latest URL parameters

	function terminateWithSuccess() {
		message.show( i18n.phrase( 'MsgImportSuccessful', self.file.name ), {severity:"success",duration:CONFIG.messageDisplayTimeShort} );
		setTimeout( function() {
				self.clear();
				if( urlP ) delete urlP[CONFIG.keyImport];
				// change view to browse the content:
				modules.show({ newView: '#'+(urlP&&urlP[CONFIG.keyView] || CONFIG.specifications), urlParams:urlP })
			}, 
			400 
		)
	}
	function handleError(xhr) {
		self.clear();
		stdError(xhr);
		self.show()
	}
 
	self.init = function() {
		// initialize the module:
		if ( !browser.supportsFileAPI ) {
			message.show( i18n.MsgFileApiNotSupported, {severity:'danger'} );
			return false
		}; 
//		console.debug('import.init',self);

		self.clear();
		self.setFormat('specif');
		importMode = {id:'replace'};
		// certain GUI elements will only be shown if the user must select a file:
		showFileSelect = new State({
			showWhenSet: ['.fileSelect'],
			hideWhenSet: []
		});
		let h = 
			'<div style="max-width:768px;">'
			+	'<div class="fileSelect" style="display:none;" >'
				+	'<div class="attribute-label" ></div>'	// empty column to the left
				+	'<div class="attribute-value" >'
				+		'<div id="FormatSelector" class="btn-group btn-group-sm" style="margin: 0 0 0.4em 0" ></div>'
				+		'<div id="HelpImport" style="margin: 0 0 0.4em 0" />'
				+		'<span id="selectBtn" class="btn btn-default btn-fileinput btn-sm" style="margin: 0 0 0.8em 0" >'
				+			'<span id="lblSelectFile" >'+i18n.BtnFileSelect+'</span>'
				+			'<input id="importFile" type="file" onchange="'+myFullName+'.select()" />'
				+		'</span>'
				+   '</div>'
			+	'</div>'
			+	'<form id="formNames" class="form-horizontal" role="form"></form>'
			+	'<div class="fileSelect" style="display:none;" >'
				+	'<div class="attribute-label" ></div>'	// empty column to the left
				+	'<div class="attribute-value" >'
				+		'<div id="FormatSelector" class="btn-group btn-group-sm" style="margin: 0 0 0.4em 0" >'
				+	function() {
						let btns = '';
						importModes.forEach( function(b) { 
							btns += '<button id="'+b.id+'Btn" onclick="'+myFullName+'.importLocally(\''+b.id+'\')" data-toggle="popover" title="'+b.title+'" class="btn btn-primary">'+b.label+'</button>'
						});
						return btns
					}()
				+		'</div>'
				+   '</div>'
			+	'</div>'
			+	'<div>'
				+	'<div class="attribute-label" ></div>'	// empty column to the left
				+	'<div class="attribute-value" >'
				+		'<div class="pull-right" >'
				+			'<button id="cancelBtn" onclick="'+myFullName+'.abort()" class="btn btn-danger btn-xs">'+i18n.BtnCancelImport+'</button>'
				+		'</div>'
				+		'<div id="progress" class="progress" >'
				+			'<div class="progress-bar progress-bar-primary" ></div>'
				+		'</div>'
				+   '</div>'
			+	'</div>'
		+	'</div>';
	//	if(self.selector)
	//		$(self.selector).after( h )
	//	else
			$(self.view).prepend( h );

		return true
	};
	// The module entry;
	// called by the modules view management:
	self.show = function( opts ) {
//		console.debug( 'import.show', opts );
	/*	if( me.userName == CONFIG.userNameAnonymous ) {
			handleError({status:403});
			self.hide();
			me.logout();
			return
		};  */
		
		$('#pageTitle').html( i18n.LblImport );
		
			function getFormat(p) {
				// filename without extension must have at least a length of 1:
//				console.debug('getFormat',p.indexOf('.specif'),p.indexOf('.xls'));
				for( var i=0, I=formats.length; i<I; i++) {
					if( p.indexOf('.'+formats[i].id)>0 && modules.isReady(formats[i].name) ) 
						return formats[i].id
				};
				return undefined
			}
		urlP = opts.urlParams;
		if( urlP && urlP[CONFIG.keyImport] ) {
			// Case 1: A file name for import has been specified in the URL:
//			console.debug('import 1',urlP);
			importMode = {id: urlP[CONFIG.keyMode] || 'replace'};
			self.file.name = urlP[CONFIG.keyImport];
			// check the format:
			self.setFormat( getFormat( urlP[CONFIG.keyImport] ));
			app[self.format.name].init( self.format.opts );
//			console.debug('filename:',self.file.name,self.format);
			if( !app[self.format.name] || !app[self.format.name].verify( {name:urlP[CONFIG.keyImport]} )) {
				self.clear();
				message.show( i18n.phrase('ErrInvalidFileType',self.file.name), {severity:'error'} );
				self.show();
				return
			}; 
			// Show the name of the specified import file:
			let rF = textInput(i18n.LblFileName,self.file.name);
			$("#formNames").html( rF );
			// Take fileName as project name:
			self.projectName = self.file.name.fileName();	
			setImporting( true );

			// Assume it is an absolute or relative URL;
			// must be either from the same URL or CORS-enabled.
			// Import the file:
			httpGet({
				url: urlP[CONFIG.keyImport],
				responseType: 'arraybuffer',
				withCredentials: false,
				done: function(result) {
//					console.debug('httpGet done',result.response);
					app[self.format.name].toSpecif(result.response)
						.progress( setProgress )
						.done( handleResult )
						.fail( handleError )
				},
				fail: handleError
			//	then:
			});
			return
		};
		// Case 2: let the user pick an import file.
//		console.debug('import 2');
		self.setFormat( 'specif' );
		
		// At first, add the format selector;
		// only at this point of time it is known which modules are loaded and initialized:
		let str = '';
		formats.forEach( function(s) {
			if( modules.isReady(s.name) ) {
//				console.debug('isReady',s.id,self.format);
				app[s.name].init( self.format.opts );
				if( typeof(app[s.name].toSpecif)=='function' ) {
					str += '<button id="FormatSelector-'+s.id+'" onclick="'+myFullName+'.setFormat(\''+s.id+'\')" class="btn btn-default'+(self.format.id==s.id?' active':'')+'" data-toggle="popover" title="'+s.desc+'">'+s.label+'</button>'
				} else {
					str += '<button disabled class="btn btn-default" data-toggle="popover" title="'+s.desc+'">'+s.label+'</button>'
				}
			}
		});
		$('#FormatSelector').html( str );
		showFileSelect.set();

		setImporting( false )
	};
	// module exit;
	// called by the modules view management:
	self.hide = function() {
//		console.debug( 'importAny.hide' )
		app.busy.reset()
	};
	self.clear = function() {
		$('input[type=file]').val( null );  // otherwise choosing the same file twice does not create a change event in Chrome
		setTextValue(i18n.LblFileName,'');
		setTextValue(i18n.LblProjectName,'');
	//	self.projectL.length = 0;  // list of projects
		self.file = {name: ''};
		self.projectName = '';
		setProgress('',0);     // reset progress bar
		setImporting( false );
		self.enableActions()
	};
	
	self.setFormat = function( fId ) {
		if( importing || !fId ) return;
//		console.debug('setFormat',self.format,fId);

		if( typeof(self.format)=='object' && fId!=self.format.id )
			$('#FormatSelector-'+self.format.id).removeClass('active');
		if( typeof(self.format)!='object' || fId!=self.format.id ) {
			$('#FormatSelector-'+fId).addClass('active');
			self.format = itemById(formats,fId)
		};

		// show the file name:
		let rF = textInput(i18n.LblFileName,'&nbsp;');
		if( fId=='xls' )
			// create input form for the project name:
			rF += textInput(i18n.LblProjectName,self.projectName,'line',myFullName+'.enableActions()');

		$('#HelpImport').html( self.format.help ); 
		$("#formNames").html( rF );
		self.enableActions()
	};

	let importing = false,
		allValid = false;
	self.enableActions = function() {
		// enable/disable the import button depending on the input state of all fields;
		// in this case only a non-zero length of the project name is required:
		let pnl = getTextLength(i18n.LblProjectName)>0,
			// it may happen that this module is initialized (and thus this routine executed), before app.cache is loaded:
			loaded = typeof(app.cache)=='object' && typeof(app.cache.selectedProject)=='object' && app.cache.selectedProject.loaded();	
		allValid = self.file && self.file.name.length>0 && (self.format.id!='xls' || pnl);
		
		setTextState( i18n.LblProjectName, pnl?'has-success':'has-error' );
		try {
		//	document.getElementById("cloneBtn").disabled =
			document.getElementById("createBtn").disabled = !allValid || loaded;
			document.getElementById("updateBtn").disabled = true;
			document.getElementById("adoptBtn").disabled =
			document.getElementById("replaceBtn").disabled = !allValid || !loaded
		} catch(e) {}
//		console.debug('enableActions',pnl,allValid)
	};
	function setImporting( st ) {
		importing = st;
		app.busy.set( st );
		try {
			document.getElementById("selectBtn").disabled = st;
		//	document.getElementById("cloneBtn").disabled = 
			document.getElementById("createBtn").disabled = st || !allValid || loaded;
			document.getElementById("updateBtn").disabled = true;
			document.getElementById("adoptBtn").disabled =
			document.getElementById("replaceBtn").disabled = st || !allValid || !loaded;
			document.getElementById("cancelBtn").disabled = !st
		} catch(e) {}
	}
	self.select = function() {
        let f = document.getElementById("importFile").files[0];
		// check if file-type is eligible:
//		console.debug('select',f.name,self.format);

		f = app[self.format.name].verify( f );
		if( f ) {
			self.file = f;
		//	self.projectL.length = 0;  // https://stackoverflow.com/questions/1232040/how-do-i-empty-an-array-in-javascript

			setTextValue(i18n.LblFileName, f.name);

			if( self.format.id=='xls' && getTextLength(i18n.LblProjectName)<1 ) {
				self.projectName = self.file.name.fileName();	// propose fileName as project name
				setTextValue( i18n.LblProjectName, self.projectName );
				setTextFocus( i18n.LblProjectName )
			};

			self.enableActions()
//			console.debug('select',self.fileName(), self.projectName)
		} else {
			self.clear()
		}
	};
	self.importLocally = function(mode) {
		if( importing || !mode ) return;   // ignore further clicks while working
		
		setImporting( true );
		importMode = {id:mode};
		setProgress(i18n.MsgReading,10); 

		self.projectName = textValue(i18n.LblProjectName);
//		console.debug( 'importLocally', self.projectName, self.file );

		readFile( self.file, app[self.format.name].toSpecif );
		return
		
		function readFile( f, fn ) {
			let rdr = new FileReader();
			rdr.onload = function(evt) {
				fn( evt.target.result )		// process the buffer
					.progress( setProgress )
					.done( handleResult )
					.fail( handleError )
			};
			rdr.readAsArrayBuffer( f )
		}
	};
	function handleResult( data ) {
		// import specif data as JSON:
//		console.debug('handleResult',data);

		return specif.check( data, self.format.opts )
			.fail( handleError )
			.done( function(dta) {
			/*	// First check if there is a project with the same id:
					function sameId() {
						for( var p=self.projectL.length-1; p>-1; p-- ) {
//							console.debug(dta.id,self.projectL[p].id);
							if( dta.id==self.projectL[p].id ) return true
						};
						return false
					}
					function sameName() {
						for( var p=self.projectL.length-1; p>-1; p-- ) {
							console.debug(data.id,self.projectL[p]);
							if( self.projectName==self.projectL[p].title ) return self.projectL[p]
						};
						return false 	// no project with the same name
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
									message.show({status: 1, statusText:'Cancelled'});
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
											dta.id = genID('P-');
											// no break
										case 'replace':
											setProgress('Creating project',20); 
											app.cache.selectedProject.create( dta )
												.progress( setProgress )
												.done( terminateWithSuccess )
												.fail( handleError );
											break;
										case 'update':
											// First, load the project for comparison:
											setProgress('Updating project',20); 
											app.cache.selectedProject.read({id:dta.id}, {reload:true})	// reload from server
												.done( function(refD) {
//													console.debug('specif.update',refD,dta)
													// ... then start to save the new or updated elements:
													app.cache.selectedProject.update( dta, 'extend' )
														.progress( setProgress )
														.done( terminateWithSuccess )
														.fail( handleError )
												})
												.fail( handleError )
									};
									thisDlg.close()
								}
							}]
					})
					.open()
				} else {   */
				setProgress(importMode.id+' project',20); 
				let opts = {mode:importMode.id};
				switch( importMode.id ) {
					case 'clone': 	
						dta.id = genID('P-');
						// no break
					case 'create':
					case 'replace':
						app.cache.create( dta )
							.progress( setProgress )
							.done( terminateWithSuccess )
							.fail( handleError );
						break;
					case 'adopt':
						opts.addGlossary = true;
						opts.addProcessesFolder = true;
					case 'update':
						app.cache.selectedProject.update( dta, opts )
							.progress( setProgress )
							.done( terminateWithSuccess )
							.fail( handleError );
				};
				console.info(importMode.id+' project',dta.title||dta.id);
			})
	}; 
	function setProgress(msg,perc) {
		$('#progress .progress-bar').css( 'width', perc+'%' ).html(msg)
	}
	self.abort = function() {
		console.info('abort pressed');
		app[self.format.name].abort();
		app.cache.selectedProject.abort()
	};
	return self
});
