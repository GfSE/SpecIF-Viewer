/*	GUI and control for SpecIF, ReqIF and XLS import
	Dependencies: jQuery 3.0+, bootstrap
	Copyright 2010-2017 enso managers gmbh (http://enso-managers.de)
	Author: se@enso-managers.com, Berlin
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
	var showFileSelect = null;

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
				+		'<span id="selectFileBtn" class="btn btn-default btn-fileinput btn-sm" style="margin: 0 0 0.8em 0" >'
				+			'<span id="lblSelectFile" >'+i18n.BtnFileSelect+'</span>'
				+			'<input id="importFile" type="file" onchange="importAny.select()" />'
				+		'</span>'
				+   '</div>'
			+	'</div>'
			+	'<form id="formNames" class="form-horizontal" role="form"></form>'
			+	'<div class="fileSelect" style="display:none;" >'
				+	'<div class="attribute-label" ></div>'	// empty column to the left
				+	'<div class="attribute-value" >'
				+		'<div style="margin: 0 0 0.4em 0" >'
				+			'<button id="importBtn" onclick="importAny.doImport()" class="btn btn-primary btn-sm">'+i18n.BtnImport+'</button>'
				+		'</div>'
				+   '</div>'
			+	'</div>'
			+	'<div>'
				+	'<div class="attribute-label" ></div>'	// empty column to the left
				+	'<div class="attribute-value" >'
				+		'<div class="pull-right" >'
				+			'<button id="cancelImportBtn" onclick="importAny.abort()" class="btn btn-danger btn-xs">'+i18n.BtnCancelImport+'</button>'
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
			console.debug('mod',mod);
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
						.done( terminateWithSuccess )
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
		[
			{ fmt: 'mm',		mod: 'ioMm',	desc: 'Freemind Mindmap',					label: 'MM'		},
			{ fmt: 'bpmn',		mod: 'ioBpmn',	desc: 'Business Process',					label: 'BPMN'	},
			{ fmt: 'specif',	mod: 'ioSpecif',desc: 'Specification Integration Facility',	label: 'SpecIF'	},
			{ fmt: 'reqif',		mod: 'ioReqif',	desc: 'Requirement Interchange Format',		label: 'ReqIF'	},
			{ fmt: 'xls',		mod: 'ioXls',	desc: 'MS Excel® Spreadsheet',				label: 'Excel®' }
		].forEach( function(s) {
			str += '<button '+(modules.isReady(s.mod)?'id="FormatSelector-'+s.fmt+'" onclick="importAny.setFormat(\''+s.fmt+'\')"':'disabled')+' class="btn btn-default" data-toggle="popover" title="'+s.desc+'">'+s.label+'</button>'
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
				rF += textInput(i18n.LblProjectName,self.projectName,"line","importAny.valid('"+i18n.LblProjectName+"')");
		};
		
		$("#formNames").html( rF );
		self.valid()
	};

	let importing = false,
		allValid = false;
	self.valid = function( item ) {
		// enable/disable the import button depending on the input state of all fields;
		// in this case only a non-zero length of the project name is required:
		let pnl = getTextLength(i18n.LblProjectName)>0;
		allValid = self.file && self.file.name.length>0 && (self.format!='xls' || pnl);
		
		setTextState( i18n.LblProjectName, pnl?'has-success':'has-error' );
		try {
			document.getElementById("importBtn").disabled = !allValid
		} catch(e) {}
//		console.debug('valid',allValid)
	};
	function setImporting( st ) {
		importing = st;
		busy.set( st );
		try {
			document.getElementById("selectFileBtn").disabled = st;
	//		if( self.format=='xls' ) document.getElementById("inputProjectName").disabled = st;
			document.getElementById("importBtn").disabled = st || !allValid;
			document.getElementById("cancelImportBtn").disabled = !st
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
	self.doImport = function() {
		if( importing ) return;   // ignore further clicks while working
		
		setImporting( true );
		setProgress(i18n.MsgReading,10); 

		self.projectName = getTextValue(i18n.LblProjectName);
//		console.debug( 'doImport', self.projectName, self.file );
		switch( self.format ) {
			case 'reqif':	readFile( self.file, ioReqif.asBuf ); break;
			case 'specif':	readFile( self.file, ioSpecif.asBuf ); break;
			case 'bpmn':	readFile( self.file, ioBpmn.asBuf ); break;
			case 'xls':		readFile( self.file, ioXls.asBuf )
		};
		return
		
		function readFile( f, fn ) {
			let rdr = new FileReader();
			rdr.onload = function(evt) {
				fn( evt.target.result )		// process the buffer
					.progress( setProgress )
					.done( terminateWithSuccess )
					.fail( handleError )
			};
			rdr.readAsArrayBuffer( f )
		}
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
		}
	};
	return self
});

