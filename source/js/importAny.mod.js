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

	// list of projects to check whether the project is already existent in the server.
	// keep the list variable at all times, do not overwrite it:
	self.projectL = [];  	// list of the projects already available
	self.projectName = '';  // user input for project name
	let showFileSelect = null,
		importMode = {id:'replace'},
		// 'importAny' should not be hard-coded here:
		myRole = self.loadAs || self.name;
	const formats = [
			{ id:'mm',		mod:'ioMm',		desc:'Freemind Mindmap',					label:'MM'		},
			{ id:'xls',		mod:'ioXls',	desc:'MS Excel® Spreadsheet',				label:'Excel®'	},
			{ id:'bpmn',	mod:'ioBpmn',	desc:'Business Process',					label:'BPMN'	},
			{ id:'reqif',	mod:'ioReqif',	desc:'Requirement Interchange Format',		label:'ReqIF'	},
			{ id:'specif',	mod:'ioSpecif',	desc:'Specification Integration Facility',	label:'SpecIF',	opts: {mediaTypeOf: attachment2mediaType}}
		];

/*	// The modes for selection when an import is encountered which is already loaded:
	const importModes = [{
			id: 'create',
			title: 'Create a new project with the given id',
			description: 'All types, objects, relations and hierarchies will be created as specified.'
		},{
			id: 'replace',
			title: 'Replace the project having the same id',
			description: 'Existing content will be lost.'
		},{
			id: 'update',
			title: 'Update the project with new or changed content',
			description: 'New objects will be created, modified ones will be superseded and the hierarchy will be replaced.'
		},{
			id: 'clone',
			title: 'Create a new instance of the project with a new id',
			description: 'There will be two projects with the existing and the new content.'
		}];  */

	function terminateWithSuccess() {
		message.show( i18n.phrase( 'MsgImportSuccessful', self.file.name ), {severity:"success",duration:CONFIG.messageDisplayTimeShort} );
		setTimeout( function() {
				self.clear();
				// change view to browse the content:
				modules.show('#specifications')
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
				+			'<input id="importFile" type="file" onchange="'+myRole+'.select()" />'
				+		'</span>'
				+   '</div>'
			+	'</div>'
			+	'<form id="formNames" class="form-horizontal" role="form"></form>'
			+	'<div class="fileSelect" style="display:none;" >'
				+	'<div class="attribute-label" ></div>'	// empty column to the left
				+	'<div class="attribute-value" >'
				+		'<div id="FormatSelector" class="btn-group btn-group-sm" style="margin: 0 0 0.4em 0" >'
				+			'<button id="createBtn" onclick="'+myRole+'.doImport(\'create\')" class="btn btn-primary">'+i18n.BtnCreate+'</button>'
				+			'<button id="replaceBtn" onclick="'+myRole+'.doImport(\'replace\')" class="btn btn-primary">'+i18n.BtnReplace+'</button>'
				+			'<button id="updateBtn" onclick="'+myRole+'.doImport(\'update\')" class="btn btn-primary">'+i18n.BtnUpdate+'</button>'
				+		'</div>'
				+   '</div>'
			+	'</div>'
			+	'<div>'
				+	'<div class="attribute-label" ></div>'	// empty column to the left
				+	'<div class="attribute-value" >'
				+		'<div class="pull-right" >'
				+			'<button id="cancelBtn" onclick="'+myRole+'.abort()" class="btn btn-danger btn-xs">'+i18n.BtnCancelImport+'</button>'
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
	self.show = function() {
//		console.debug( 'import.show' );
	/*	if( me.userName == CONFIG.userNameAnonymous ) {
			handleError({status:403});
			self.hide();
			me.logout();
			return
		};  */
		let m=itemById(formats,'specif');
		if( modules.isReady(m.mod) )
			window[m.mod].init(m.opts);
		
			function getFormat(p) {
				// filename without extension must have at least a length of 1:
//				console.debug('getFormat',p.indexOf('.specif'),p.indexOf('.xls'));
				if( p.indexOf('.specif')>0 ) 	// includes '.specifz'
					return 'specif';
				if( p.indexOf('.xls')>0 )		// includes '.xlsx'
					return 'xls';
				if( p.indexOf('.bpmn')>0 )
					return 'bpmn';
				return undefined
			}
		let hashP = getHashParams(), 
			mod=null;
		clearUrlParams();
		if( hashP && hashP['import'] ) {
			// Case 1: A file name for import has been specified in the URL:
			self.file.name = hashP['import'];
			// check the format:
			self.format = getFormat( hashP['import'] );
			console.debug('filename:',self.file.name,self.format);
			// Depending on the file extension, select a module for importing:
			switch( self.format ) {
				case 'reqif':	mod = ioReqif; break;
				case 'specif':	mod = ioSpecif; break;
				case 'bpmn':	mod = ioBpmn; break;
				case 'xls':		mod = ioXls
			};
//			console.debug('mod',mod);
			if( !mod || !mod.verify( {name:hashP['import']} )) {
				self.clear();
				message.show( i18n.phrase('ErrInvalidFileType',self.file.name), {severity:'error'} );
				self.show();
				return
			};

			// Show the name of the specified import file:
			let rF = textInput(i18n.LblFileName,self.file.name,null,null);
			$("#formNames").html( rF );
			setImporting( true );

			// Assume it is an absolute or relative URL;
			// must be either from the same URL or CORS-enabled.
			// Import the file:
			httpGet({
				url: hashP['import'],
				responseType: 'arraybuffer',
				withCredentials: false,
				done: function(res) {
//					console.debug('httpGet done',res.response);
					mod.asBuf(res.response)
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
		
		// At first, add the format selector;
		// only at this point of time it is known which modules are loaded and initialized:
		let str = '';
		formats.forEach( function(s) {
			str += '<button '+(modules.isReady(s.mod)?'id="FormatSelector-'+s.id+'" onclick="'+myRole+'.setFormat(\''+s.id+'\')"':'disabled')+' class="btn btn-default" data-toggle="popover" title="'+s.desc+'">'+s.label+'</button>'
		});
		$('#FormatSelector').html( str );
		showFileSelect.set();

		self.setFormat( 'specif' );
		setImporting( false )
	};
	// module exit;
	// called by the modules view management:
	self.hide = function() {
//		console.debug( 'importAny.hide' )
		busy.reset()
	};
	self.clear = function() {
		$('input[type=file]').val( null );  // otherwise choosing the same file twice does not create a change event in Chrome
		setTextValue(i18n.LblFileName,'');
		setTextValue(i18n.LblProjectName,'');
//		self.format = 'specif';
		self.projectL.length = 0;  // list of projects
		self.file = {name: ''};
		self.projectName = '';
		setProgress('',0);     // reset progress bar
		setImporting( false );
		self.valid()
	};
	
	self.format = 'specif';
	self.setFormat = function( fmt ) {
		if( importing ) return;
		if( !fmt ) fmt = self.format;
//		console.debug('setFormat',self.format,fmt);

		if( fmt!=self.format ) {
			$('#FormatSelector-'+self.format).removeClass('active');
			self.format = fmt
		};
		$('#FormatSelector-'+fmt).addClass('active');

		// show the file name:
		let rF = textInput(i18n.LblFileName,'&nbsp;',null,null);

		switch( fmt ) {
			case 'specif': 	
				$('#HelpImport').html( i18n.MsgImportSpecif ); 
				break;
			case 'reqif': 	
				$('#HelpImport').html( i18n.MsgImportReqif ); 
				break;
			case 'bpmn': 	
				$('#HelpImport').html( i18n.MsgImportBpmn ); 
				break;
			case 'xls': 	
				$('#HelpImport').html( i18n.MsgImportXls ); 
				// create input form for the project name:
				rF += textInput(i18n.LblProjectName,self.projectName,'line',myRole+'.valid("'+i18n.LblProjectName+'")');
		};
		
		$("#formNames").html( rF );
		self.valid()
	};

	let importing = false,
		allValid = false;
	self.valid = function( item ) {
		// enable/disable the import button depending on the input state of all fields;
		// in this case only a non-zero length of the project name is required:
		let pnl = getTextLength(i18n.LblProjectName)>0,
			loaded = myProject.id;
		allValid = self.file && self.file.name.length>0 && (self.format!='xls' || pnl);
		
		setTextState( i18n.LblProjectName, pnl?'has-success':'has-error' );
		try {
			document.getElementById("createBtn").disabled = loaded || !allValid;
			document.getElementById("replaceBtn").disabled = !loaded || !allValid;
			document.getElementById("updateBtn").disabled = true
		} catch(e) {}
//		console.debug('valid',allValid)
	};
	function setImporting( st ) {
		importing = st;
		busy.set( st );
		try {
			document.getElementById("selectBtn").disabled = st;
	//		if( self.format=='xls' ) document.getElementById("inputProjectName").disabled = st;
			document.getElementById("createBtn").disabled = st || loaded || !allValid;
			document.getElementById("replaceBtn").disabled = st || !loaded || !allValid;
			document.getElementById("cancelBtn").disabled = !st
		} catch(e) {}
	}
	self.select = function() {
        let f = document.getElementById("importFile").files[0];
		// check if file-type is eligible:
//		console.debug('select',f.name,self.format);
		switch( self.format ) {
			case 'reqif':		f = ioReqif.verify( f ); break;
			case 'specif':		f = ioSpecif.verify( f ); break;
			case 'bpmn':		f = ioBpmn.verify( f ); break;
			case 'xls':			f = ioXls.verify( f )
		};
		if( f ) {
			self.file = f;
			self.projectL.length = 0;  // https://stackoverflow.com/questions/1232040/how-do-i-empty-an-array-in-javascript

			setTextValue(i18n.LblFileName, f.name);

			if( self.format=='xls' && getTextLength(i18n.LblProjectName)<1 ) {
				self.projectName = self.file.name.fileName();	// propose fileName as project name
				setTextValue( i18n.LblProjectName, self.projectName );
				setTextFocus( i18n.LblProjectName )
			};

			self.valid()
//			console.debug('select',self.fileName(), self.projectName)
		} else {
			self.file = {name: ''};
			self.projectName = '';	
			setTextValue( i18n.LblFileName, '&nbsp;' );
			setTextValue( i18n.LblProjectName, '&nbsp;' );
			self.valid()
		}
	};
	self.doImport = function(mode) {
		if( importing || !mode ) return;   // ignore further clicks while working
		
		setImporting( true );
		importMode = {id:mode};
		setProgress(i18n.MsgReading,10); 

		self.projectName = getTextValue(i18n.LblProjectName);
//		console.debug( 'doImport', self.projectName, self.file );
		switch( self.format ) {
			case 'reqif':	readFile( self.file, ioReqif.toSpecif ); break;
			case 'specif':	readFile( self.file, ioSpecif.toSpecif ); break;
			case 'bpmn':	readFile( self.file, ioBpmn.toSpecif ); break;
			case 'xls':		readFile( self.file, ioXls.toSpecif )
		};
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

		return myProject.check( data )
			.fail( handleError )
			.done( function(dta) {
				// First check if there is a project with the same id:
			/*		function sameId() {
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
						return null 	// no project with the same name
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
											myProject.create( dta )
												.progress( setProgress )
												.done( terminateWithSuccess )
												.fail( handleError );
											break;
										case 'update':
											// First, load the project for comparison:
											setProgress('Updating project',20); 
											myProject.read({id:dta.id}, {reload:true})	// reload from server
												.done( function(refD) {
//													console.debug('specif.update',refD,dta)
													// ... then start to save the new or updated elements:
													myProject.update( dta, 'extend' )
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
				switch( importMode.id ) {
					case 'create':
					case 'replace':
//						console.debug('Creating project',dta);
						setProgress('Creating project',20); 
						myProject.create( dta )
							.progress( setProgress )
							.done( terminateWithSuccess )
							.fail( handleError );
						break;
					case 'update':
						setProgress('Updating project',20); 
						myProject.update( dta, 'extend' )
							.progress( setProgress )
							.done( terminateWithSuccess )
							.fail( handleError );
				}
			})
	}; 
	function setProgress(msg,perc) {
		$('#progress .progress-bar').css( 'width', perc+'%' ).html(msg)
	}
	self.abort = function() {
		console.info('abort pressed');
		switch( self.format ) {
			case 'reqif':	ioReqif.abort(); break;
			case 'specif':	ioSpecif.abort(); break;
			case 'bpmn':	ioBpmn.abort(); break;
			case 'xls':		ioXls.abort()
		};
		myProject.abort()
	};
	return self
});
