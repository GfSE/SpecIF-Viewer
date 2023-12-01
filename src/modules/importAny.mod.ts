/*!	GUI and control for all importers
	Dependencies: jQuery 3.1+, bootstrap 3.1
	Copyright enso managers gmbh (http://enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de 
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/

// Importing modules must implement the following interface:
interface ITransform extends IModule {
	verify(f:File): boolean;
	toSpecif(buf: ArrayBuffer): JQueryDeferred<SpecIF>;
	abort(): void;
}

moduleManager.construct({
	name: 'importAny'
}, function(self:IModule) {

	// The modes for selection when an import is encountered which is already loaded:
	const importModes = [{
			id: 'create',
			title: 'Create a new project with the given id',
			desc: 'All types, objects, relations and hierarchies will be created as specified.',
			label: i18n.BtnCreate
		},{
			id: 'clone',
			title: 'Create a new instance of the project with a new id',
			desc: 'There will be two projects with the existing and the new content.',
			label: i18n.BtnClone
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
			extensions: ".specif, .specifz, .specif.zip",
			help: i18n.MsgImportSpecif,
			opts: { mediaTypeOf: LIB.attachment2mediaType, doCheck: ['statementClass.subjectClasses', 'statementClass.objectClasses'] }
		},{
			id:'xml',	
			name:'ioArchimate',	
			desc:'ArchiMate Open Exchange',
			label:'ArchiMate®',
			extensions: ".xml",
//			help: i18n.MsgImportArchimate,
			help: "Experimental: Import an ArchiMate Open Exchange file (*.xml) and add the diagrams (*.png or *.svg) to their respective resources using the 'edit' function.", 
			opts: { mediaTypeOf: LIB.attachment2mediaType } 
		},{
			id:'bpmn',
			name:'ioBpmn',
			desc:'Business Process',
			label:'BPMN',
			extensions: ".bpmn",
			help: i18n.MsgImportBpmn
		},{
			id:'reqif',	
			name:'ioReqif',	
			desc:'Requirement Interchange Format',
			label:'ReqIF',
			extensions: ".reqif, .reqifz",
			help: i18n.MsgImportReqif,
		opts: { multipleMode: "adopt", mediaTypeOf: LIB.attachment2mediaType, dontCheck: ["statement.subject", "statement.object"] }
	/*	},{
            id: 'rdf',
            name: 'ioRdf',
            desc: 'Resource Description Format',
            label: 'RDF',
			extensions: "",
            help: 'ToDo' */
		}, {
			id: 'xsd',
			name: 'ioDdpSchema',
			desc: 'Schema (.xsd) of the Prostep iViP Digital Data Package (DDP)',
			label: 'DDP',
			extensions: ".xsd",
			help: "Experimental: Import a DDP-Schema file (Dictionary.xsd).",
			opts: { mediaTypeOf: LIB.attachment2mediaType }
		},{
			id:'xls',
			name:'ioXls',
			desc:'MS Excel® Spreadsheet',
			label:'Excel®',
			extensions: ".xlsx, .xls, .csv",
			help: i18n.MsgImportXls,
			opts: { dontCheck: ["statement.object"] }
		},{
			id:'mm',
			name:'ioMm',
			desc:'Freemind Mindmap',
			label: 'MM',
			extensions: ".mm",
			help: i18n.MsgImportMm
		}];
	// list of projects to check whether the project is already existent in the server.
	// keep the list variable at all times, do not overwrite it:
//	self.projectL = [];  	// list of the projects already available
	self.projectName = '';  // user input for project name
	self.format = undefined;
	var showFileSelect:State,
		importMode = {id:'replace'},
		myFullName = 'app.'+self.loadAs,
		urlP:any,				// the latest URL parameters
		importing = false,
		cacheLoaded = false,
		allValid = false;
 
	self.clear = function():void {
		$('input[type=file]').val( '' );  // otherwise choosing the same file twice does not create a change event in Chrome
		setTextValue(i18n.LblFileName,'');
		setTextValue(i18n.LblProjectName,'');
	//	self.projectL.length = 0;  // list of projects
		self.file = {name: ''};
		self.projectName = '';
		setProgress('',0);     // reset progress bar
		setImporting( false );
		app.busy.reset();
		self.enableActions();
	};
	self.init = function():boolean {
		// initialize the module:
		if ( !browser.supportsFileAPI ) {
			message.show( i18n.MsgFileApiNotSupported, {severity:'danger'} );
			return false;
		}; 
//		console.debug('import.init',self);

		let h = 
			'<div style="max-width:768px; margin-top:1em">'
			+	'<div class="fileSelect" style="display:none;" >'
				+   '<div class="attribute-label" style="vertical-align:top; font-size:140%; padding-top:0.2em" >' + i18n.LblImport + '</div>'	// column to the left
				+	'<div class="attribute-value" >'
				+		'<div id="formatSelector" class="btn-group" style="margin: 0 0 0.4em 0" ></div>'
				+		'<div id="helpImport" style="margin: 0 0 0.4em 0" ></div>'
				+		'<div id="fileSelectBtn" class="btn btn-default btn-fileinput" style="margin: 0 0 0.8em 0" ></div>'
				+   '</div>'
			+	'</div>'
			+	'<form id="formNames" class="form-horizontal" role="form"></form>'
			+	'<div class="fileSelect" style="display:none;" >'
				+	'<div class="attribute-label" ></div>'	// empty column to the left
				+	'<div class="attribute-value" >'
				+		'<div id="modeSelector" class="btn-group" style="margin: 0 0 0.4em 0" >'
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
			+	'<div style="padding-top:2em">'
				+	'<div class="attribute-label" ></div>'	// empty column to the left
				+	'<div class="attribute-value" >'+i18n.MsgIntro+'</div>'
			+	'</div>'
		+	'</div>';
	/*	if(self.selector)
			$(self.selector).after( h );
		else */
			$(self.view).prepend( h );

		self.clear();
		self.setFormat('specif');
		importMode = {id:'replace'};
		// certain GUI elements will only be shown if the user must pick a file:
		showFileSelect = new State({
			showWhenSet: ['.fileSelect'],
			hideWhenSet: []
		});
		return true;
	};
	// The module entry;
	// called by the moduleManager:
	self.show = function( opts:any ):void {
		if( !opts ) opts = {};
//		console.debug( 'import.show', opts );
	/*	if( me.userName == CONFIG.userNameAnonymous ) {
			handleError({status:403});
			self.hide();
			me.logout();
			return
		};  */
		
		$('#pageTitle').html( app.title );
		
			function getFormat(uParms: string): object | undefined {
				// Derive the format from the file extension:
				// - this is however too insignificant, when there are multiple formats with the same extension.
				// - at least allow any extension listed in 'extensions', see Excel.
//				console.debug('getFormat',uParms);
				for( var f of formats) {
					// 1. look for format parameter
					// ToDo ..
					// 2. derive from file extension
					if (uParms[CONFIG.keyImport].includes('.' + f.id) && moduleManager.isReady(f.name))
						return f;
				};
			}
		urlP = opts.urlParams;
		if( urlP && urlP[CONFIG.keyImport] ) {
			// Case 1: A file name for import has been specified in the URL:
//			console.debug('import 1',urlP);
			// replace project with same id, unless a different import mode is specified:
			importMode = {id: urlP[CONFIG.keyMode] || 'replace'};
			self.file.name = urlP[CONFIG.keyImport];
			// check the file format:
			self.format = getFormat( urlP );
//			console.debug('filename:',self.file.name,self.format);
			if( self.format && app[self.format.name] ) {
				// initialize the import module:
				app[self.format.name].init( self.format.opts );
				
				if( app[self.format.name].verify( {name:urlP[CONFIG.keyImport]} ) ) {
					// Show the name of the specified import file:
					let rF = makeTextField(i18n.LblFileName,self.file.name);
					$("#formNames").html( rF );
					// Take fileName as project name:
					self.projectName = self.file.name.fileName();	
					setImporting( true );

					// Assume it is an absolute or relative URL;
					// must be either from the same URL or CORS-enabled.
					// Import the file: 
					LIB.httpGet({
						// force a reload through cache-busting:
						url: urlP[CONFIG.keyImport] + '?' + Date.now().toString(),
						responseType: 'arraybuffer',
						withCredentials: false,
						done: function (result: XMLHttpRequest) {
//							console.debug('httpGet done',result.response);
							app[self.format.name].toSpecif(result.response)
								.progress( setProgress )
								.done( handleResult )
								.fail( handleError );
						},
						fail: handleError
					});
					return
				}
			};
			// otherwise:
			message.show( i18n.lookup('ErrInvalidFileType',self.file.name), {severity:'error'} );
			self.clear();
			self.show();
			return;
		};
		// Case 2: let the user pick an import file.
//		console.debug('import 2');
		self.setFormat( 'specif' );
		
		// At first, add the format selector;
		// only at this point of time it is known which modules are loaded and initialized:
		let str = '';
		formats.forEach( function(s) {
			if( moduleManager.isReady(s.name) ) {
//				console.debug('isReady',s.id,self.format);
			//	app[s.name].init( self.format.opts );
				if( typeof(app[s.name].toSpecif)=='function' && typeof(app[s.name].verify)=='function' ) {
					str += '<button id="formatSelector-'+s.id+'" onclick="'+myFullName+'.setFormat(\''+s.id+'\')" class="btn btn-default'+(self.format.id==s.id?' active':'')+'" data-toggle="popover" title="'+s.desc+'">'+s.label+'</button>';
				}
				else {
					str += '<button disabled class="btn btn-default" data-toggle="popover" title="'+s.desc+'">'+s.label+'</button>';
				};
			};
		});
		$('#formatSelector').html( str );
		showFileSelect.set();

		setImporting( false );
	};
	// module exit;
	// called by the modules view management:
	self.hide = function():void {
//		console.debug( 'importAny.hide' )
		app.busy.reset()
	};
	
	self.setFormat = function ( fId:string ):void {
		if( importing || !fId ) return;
//		console.debug('setFormat',self.format,fId);

		if( typeof(self.format)=='object' && fId!=self.format.id )
			$('#formatSelector-'+self.format.id).removeClass('active');
		if( typeof(self.format)!='object' || fId!=self.format.id ) {
			$('#formatSelector-'+fId).addClass('active');
			self.format = LIB.itemById(formats,fId);
		};

		// initialize the importer:
		app[self.format.name].init( self.format.opts );

		// show the file name:
		let rF = makeTextField(i18n.LblFileName,'');
		if( fId=='xls' )
			// create input form for the project name:
			rF += makeTextField(i18n.LblProjectName, self.projectName, { typ:'line', handle:myFullName + '.enableActions()' });

		$('#helpImport').html( self.format.help ); 
		$("#formNames").html( rF );

		$("#fileSelectBtn").html(
			  '<span>' + i18n.BtnFileSelect + '</span>'
			+ '<input id="importFile" type="file" accept="'+self.format.extensions+'" onchange="' + myFullName + '.pickFiles()" />'
		);

		self.enableActions();
	};

	function checkState():void {
		// in this case only the project name must have a length>0:
		let pnl = getTextLength(i18n.LblProjectName)>0;
		// it may happen that this module is initialized (and thus this routine executed), before app.projects is loaded:
		cacheLoaded = typeof(app.projects)=='object' && typeof(app.projects.selected)=='object' && app.projects.selected.isLoaded();	
		allValid = self.file && self.file.name.length>0 && (self.format.id!='xls' || pnl);
		setTextState( i18n.LblProjectName, pnl?'has-success':'has-error' );
	};
	self.enableActions = function():void {
		// enable/disable the import button depending on the input state of all fields;
		
		checkState();
		try {
		//	document.getElementById("cloneBtn").disabled =
			// @ts-ignore - .disabled is an accessible attribute
			document.getElementById("createBtn").disabled = !allValid || cacheLoaded;
			// @ts-ignore - .disabled is an accessible attribute
			document.getElementById("cloneBtn").disabled =
			// @ts-ignore - .disabled is an accessible attribute
			document.getElementById("updateBtn").disabled = true;
			// @ts-ignore - .disabled is an accessible attribute
			document.getElementById("adoptBtn").disabled =
			// @ts-ignore - .disabled is an accessible attribute
			document.getElementById("replaceBtn").disabled = !allValid || !cacheLoaded;
		}
		catch (e) {
			console.error("importAny: enabling actions has failed ("+e+").");
		};
	};
	function setImporting( st:boolean ):void {
		importing = st;
		app.busy.set( st );
		checkState();
		try {
			// @ts-ignore - .disabled is an accessible attribute
			document.getElementById("fileSelectBtn").disabled = st;
			// @ts-ignore - .disabled is an accessible attribute
			document.getElementById("createBtn").disabled = st || !allValid || cacheLoaded;
			// @ts-ignore - .disabled is an accessible attribute
			document.getElementById("cloneBtn").disabled =
			// @ts-ignore - .disabled is an accessible attribute
			document.getElementById("updateBtn").disabled = true;
			// @ts-ignore - .disabled is an accessible attribute
			document.getElementById("adoptBtn").disabled =
			// @ts-ignore - .disabled is an accessible attribute
			document.getElementById("replaceBtn").disabled = st || !allValid || !cacheLoaded;
			// @ts-ignore - .disabled is an accessible attribute
			document.getElementById("cancelBtn").disabled = !st;
		}
		catch (e) {
			console.error("importAny: setting state 'importing' has failed ("+e+").");
		};
	}
	self.pickFiles = function():void {
		// @ts-ignore - .files is in fact accessible
        let f = document.getElementById("importFile").files[0];
		// check if file-type is eligible:
//		console.debug('pickFiles',f.name,self.format);

		if (app[self.format.name].verify(f)) {
			self.file = f;
			//	self.projectL.length = 0;  // https://stackoverflow.com/questions/1232040/how-do-i-empty-an-array-in-javascript

			setTextValue(i18n.LblFileName, f.name);

			if( self.format.id=='xls' && getTextLength(i18n.LblProjectName)<1 ) {
				self.projectName = self.file.name.fileName();	// propose fileName as project name
				setTextValue( i18n.LblProjectName, self.projectName );
				setFocus( i18n.LblProjectName );
			};

			self.enableActions();
//			console.debug('pickFiles',self.fileName(), self.projectName);
		}
		else {
			self.clear();
		}
	};
	self.importLocally = function(mode:string):void {
		if( importing || !mode ) return;   // ignore further clicks while working
		
		setImporting( true );
		importMode = {id:mode};
		setProgress(i18n.MsgReading,10); 

		self.projectName = textValue(i18n.LblProjectName);
//		console.debug( 'importLocally', self.projectName, self.file );

		readFile( self.file, app[self.format.name].toSpecif );
		return;

		function readFile( f:File, fn:Function ):void {
			let rdr = new FileReader();
			rdr.onload = (evt) => {
				if (evt.target && evt.target.result )
					fn( evt.target.result )		// process the buffer
						.progress( setProgress )
						.done( handleResult )
						.fail( handleError )
			};
			rdr.readAsArrayBuffer( f )
		}
	};

	function terminateWithSuccess(): void {
		message.show(i18n.lookup('MsgImportSuccessful', self.file.name), { severity: "success", duration: CONFIG.messageDisplayTimeShort });
		setTimeout(function () {
			self.clear();
			if (urlP) delete urlP[CONFIG.keyImport];
			// change view to browse the content:
			moduleManager.show({ view: '#' + (app.title=="check"? CONFIG.importAny : (urlP && urlP[CONFIG.keyView]? urlP[CONFIG.keyView] : CONFIG.specifications)), urlParams: urlP })
		},
			CONFIG.showTimelag
		)
	}
	function handleError(xhr: xhrMessage): void {
//		console.debug( 'handleError', xhr );
		self.clear();
		LIB.stdError(xhr);
		self.show();
	}
	// ToDo: construct an object ...
	var resQ:SpecIF[] = [],
		resIdx = 0;
	function handleResult( data:SpecIF|SpecIF[] ):void {
		// import specif data as JSON:
		if( Array.isArray( data ) ) {
			// The first object shall be imported as selected by the user;
			// all subsequent ones according to self.format.opts.multipleMode:
			// (use-case: ioReqif imports a reqifz with multiple reqif files)
			resQ = data;
			resIdx = 0;
			handle( resQ.shift() as SpecIF, resIdx );
		}
		else {
			resQ.length = 0;
			resIdx = 0;
			handle( data, 0 );
		};
		return;
	
		function handleNext():void {
			if( resQ.length>0 )
				handle( resQ.shift() as SpecIF, ++resIdx )
			else
				terminateWithSuccess();
		}
		function handle( dta:SpecIF, idx:number ):void {
//			console.debug('handleResult',simpleClone(dta),idx);
			/*	//  First check if there is a project with the same id:
					function sameId() {
						for( var p=self.projectL.length-1; p>-1; p-- ) {
//							console.debug(dta.id,self.projectL[p].id);
							if( dta.id==self.projectL[p].id ) return true
						};
						return false
					}
					function sameName() {
						for( var p=self.projectL.length-1; p>-1; p-- ) {
//							console.debug(data.id,self.projectL[p]);
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
							form.append( makeRadioField( 'Import Mode', modes ) );
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
											dta.id = LIB.genID('P-');
											// no break
										case 'replace':
											setProgress('Creating project',20); 
											app.projects.selected.create( dta )
												.progress( setProgress )
												.done( terminateWithSuccess )
												.fail( handleError );
											break;
										case 'update':
											// First, load the project for comparison:
											setProgress('Updating project',20); 
											app.projects.selected.read({id:dta.id}, {reload:true})	// reload from server
												.done( function(refD) {
//													console.debug('specif.update',refD,dta)
													// ... then start to save the new or updated elements:
													app.projects.selected.update( dta, 'extend' )
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

				// The first object shall be imported as selected by the user --> importMode.id;
				// all subsequent ones according to self.format.opts.multipleMode:
				let opts: any = self.format.opts || {};
				opts.mode = idx<1? importMode.id : opts.multipleMode;
				opts.normalizeTerms = true;  // replace terms by preferred/released ontology terms; is overridden if an ontology is imported
				opts.deduplicate = true;
				opts.addGlossary = true;
				opts.addUnreferencedResources = true;

				switch( opts.mode ) {
				/*	case 'clone': 	
						dta.id = LIB.genID('P-');
						// no break */
					case 'create':
					case 'replace':
						opts.collectProcesses = false;
						app.projects.create( dta, opts )
							.progress( setProgress )
							.done( handleNext )
							.fail( handleError );
						break;
				/*	case 'update':
						opts.collectProcesses = false;
						app.projects.update(dta, opts)
							.progress(setProgress)
							.done(handleNext)
							.fail(handleError)
						break; */
					case 'adopt':
						opts.collectProcesses = true;
						app.projects.selected.adopt( dta, opts )
							.progress( setProgress )
							.done( handleNext )
							.fail( handleError )
			};
			console.info(importMode.id + ' project ' + (typeof (dta.title) == 'string' ? dta.title : LIB.languageTextOf(dta.title, { targetLanguage: browser.language })) || dta.id);
		};
	}; 
	function setProgress(msg:string,perc:number):void {
		$('#progress .progress-bar').css( 'width', perc+'%' ).html(msg)
	}
	self.abort = function():void {
		console.info('abort pressed');
		app[self.format.name].abort();
		app.projects.selected.abort();
	};
	return self;
});
