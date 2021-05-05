/*!	A simple module loader and object (singleton) factory.
	When all registered modules are ready, a callback function is executed to start or continue the application.
	Dependencies: jQuery 3.1 and later.
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
*/

class ViewControl {
	// Constructs an object to control the visibility of the DOM-tree elements listed in 'list';
	// the selected view is shown, all others are hidden.
	// ViewControl can switch pages or tabs, depending on the navigation level:
	list;			// the list of alternative views under control of the respective object
	selected: any;	// the currently selected view

	constructor() {
		this.list = [];
		this.selected = undefined;
	}
	exists(v): boolean {
		return indexBy(this.list, 'view', v) > -1;
	}
	add(v): void {
		// add the module to the view list of this level:
		this.list.push(v);
		$(v.view).hide();
		// we could add the visual selector, here ... it is now part of loadH.
	}
	show(params): void {
		// Select a new view
		// by calling functions 'show'/'hide' in case they are implemented in the respective modules.
		// - simple case: params is a string with the name of the new view.
		// - more powerful: params is an object with the new target view plus optionally content or other parameters
		switch (typeof (params)) {
			case 'undefined': return;	// should never be the case.
			case 'string': params = { newView: params };
		};
//				console.debug('ViewControl.show',this.list,this.selected,params);

		/*	if( this.selected && params.newView==this.selected.view ) {
				// just update the current view:
				if( typeof(params.content)=='string' ) $(this.selected.view).html(params.content);
					return
			};  */
		// else: show params.newView and hide all others:
		let v, s;
		this.list.forEach((le) => {
//					console.debug('ViewControl.show le',le);
			v = $(le.view);			// the view
			s = $(le.selectedBy); 	// the visual selector
			if (params.newView == le.view) {
				//					console.debug('ViewControl.show: ',le.view,le.selectedBy,v,s);
				this.selected = le;
				// set status of the parent's view selector:
				s.addClass('active');
				// control visibility:
				v.show();
				// usually none or one of the following options are used:
				// a) update the content
				if (typeof (params.content) == 'string') {
					v.html(params.content);
					return;
				};
				// b) initiate the corresponding action implicitly:
				if (typeof (le.show) == 'function') {
					params.forced = true;	// update the view even if the resource hasn't changed
					le.show(params);
					return;
				}
			}
			else {
//						console.debug('ViewControl.hide: ',le.view,le.selectedBy,v,s);
				// set status of the parent's view selector:
				s.removeClass('active');
				// control visibility:
				v.hide();
				// initiate the corresponding action implicitly:
				if (typeof (le.hide) == 'function') {
					le.hide();
					return;
				};
			};
		});
		if (typeof (doResize) == 'function') {
			doResize();
		};
	}
	hide(v): void {
		if (typeof (v) == 'string' && this.exists(v)) {
			// hide a specific view:
			$(v).hide();
			return;
		};
		// else, hide the selected view:
		if (this.selected) {
//					console.debug( 'hide', this.selected );
			// initiate the corresponding (implicit) action:
			$(this.selected.view).hide();
			// set status of the parent's view selector:
			$(this.selected.selectedBy).removeClass('active');
			this.selected = undefined;
		};
	}
}
class Browser {
	language: string;
	supportsHtml5History: boolean;
	supportsCORS: boolean;
	supportsFileAPI: boolean;
	constructor() {
		this.language = navigator.language; // || navigator.userLanguage;
		console.info("Browser Language is '" + this.language + "'.");

		this.supportsHtml5History = Boolean(window.history && window.history.pushState);
		if (!this.supportsHtml5History) console.info("Browser does not support HTML5 History");

		this.supportsCORS = $.support.cors;
		if (!this.supportsCORS) console.info("Browser does not support CORS");

		this.supportsFileAPI = Boolean(window.File && window.FileReader && window.FileList && window.Blob);
/*		this.supportsHtml5Storage = function() {
			// see: http://diveintohtml5.info/storage.html
			try {
				return 'sessionStorage' in window && window['sessionStorage'] !== null;
			} catch(e) {
				return false
			}
		}();
		if( !this.supportsHtml5Storage ) console.info( "Browser does not support HTML5 Storage" ); */
	}
	isIE():boolean {
		return /MSIE |rv:11.0/i.test(navigator.userAgent);
	}
}

class ModuleManager {
		/* Supports two types of modules:
		   1. Libraries
				- 'load()' registers and loads a file or a list of files with named javascript functions
				- 'setReady()' is executed when the 'getScipt' load-event triggers
				- the specified callback function is executed as soon as all modules are ready.
				- Libraries can be used globally and don't support view control.
		   2. Controllers
				- 'load()' registers and loads a file or a list of files with constructors (similar to reqireJs 'reqire')
				- 'construct()' creates a controller using the constructor specified as parameter (similar to reqireJs 'define')
				- the constructor may append a new subtree to a DOM element to be used by the constructed object
				- 'setReady()' is executed, if 'construct()' finishes successfully.
				- the specified callback function is executed as soon as all modules are ready.
				- 'show()' selects the view of the specified module and hides all others.  */

	callWhenReady: Function;
	loadPath = './';
	registered = [];
	ready = [];
	tree;

	init ( appName:string, opts? ):void {

		// Identify browser type:
		browser = new Browser();

		// Check the browser type, the first test is true for IE <= 10, the second for IE 11.
		if( browser.isIE() ) {
			let txt = 'Stopping: The web-browser Internet Explorer is not supported.';
			console.error(txt);
			alert(txt);
			return;
		};

		if (opts && opts.path)
			this.loadPath = opts.path;

		this.registered.length = 0;
		this.ready.length = 0;

		// init phase 1: Load the javascript routines common to all apps:
		this.loadH(['bootstrap','types','i18n'], {done:init2} );
		return

		// init phase 2: the following must be loaded and accessible before any other modules can be loaded:
		function init2() {
//			console.debug('init2',opts);
			let loadL = ['helper','helperTree','tree','stdTypes',"xSpecif",'bootstrapDialog','mainCSS'];
			if( CONFIG.convertMarkdown ) loadL.push('markdown');
			this.loadH(loadL, { done: function () { window.app = window[appName](); window.app.init() } });
		}
	}
	load( tr, opts ) {
		// tr is a hierarchy of modules, where the top element represents the application itself;
		// only modules with a specified name will be loaded:
		this.tree = tr;
		return this.loadH(tr, opts);
	}
	construct ( defs, constructorFn:Function ):void {
		// Construct controller and view of a module.
		// This routine is called by the respective module in the code file, once loaded with 'loadH'/'loadM',
		// make sure that 'setReady' is not called in 'loadM', if 'construct' is used.
		// Or, the routine is called explicitly to construct a module without loading a dedicated file.

		// find module by name or by view somewhere in the complete module tree of the app:
		let mo = this.findM(this.tree,defs.name||defs.view);
		if(!mo) {
			throw defs.name? "'"+defs.name+"' is not a defined module name" : "'"+defs.view+"' is not a defined view";
		};
		$.extend( mo, defs );
//		console.debug('construct', defs, mo);

		// An execution name ('loadAs') may be specified when different modules (with diffent names)
		// create a component with similar interface, but different function.
		// For example, 'me' can be implemented by 'profileAnonymous' with minimal function or
		// by 'profileMe' with full-fledged user management including user-roles and permissions;
		// in this case the modules carry the name 'profileAnonymous' resp. 'profileMe', while both
		// specify loadAs: 'me'.
		// An app uses both similarly, e.g. me.attribute or me.function().
		// Of course, loadAs must be unique in an app at any time.

		// By default of 'loadAs', use 'name' or 'view' without the leading '#':
		if( !mo.loadAs ) mo.loadAs = mo.name || mo.view.substring(1);

		// construct the controller using the provided function:
		constructorFn(mo);
		// make the module directly addressable by loadAs:
		app[ mo.loadAs ] = mo;

//		console.debug('construct',defs,mo);
		// Set the module to 'ready', if registered, ignore otherwise.
		// If a module is constructed explicitly and not as a result of file loading, it is not registered.
		// In that case it does not have a name, so the condition is in fact redundant:
		if( defs.name && this.registered.indexOf(defs.name)>-1 )
			this.setReady( defs.name )

		// the module will be initialized within setReady() once all modules are loaded.
	}
	show ( params ):void {
		// Show the specified view, which may be located somewhere in the hierarchy;
		// Assuming that it's parent has a ViewControl:
		switch( typeof(params) ) {
			case 'undefined': throw "Programming Error: Undefined target view.";
			case 'string': params = { newView: params };
		};
//		console.debug('moduleManager.show',params);
		let mo = this.findM( this.tree, params.newView );
		if( !mo || !mo.parent.ViewControl ) {
			console.error("'"+params.newView+"' is not a defined view");
			return // undefined
		};
		// Set the view from the top-level to the lowest level,
		// so that it is possible to jump from any branch to another at any level.
		// Begin from the top:
		setViewFromRoot( mo, params );
		// Now we have selected the specified view;
		// select a subview, if there is any:
		setViewToLeaf( mo, params );
		return;

		function setViewFromRoot( le, pL ):void {
			// step up, if there is a parent view:
			if( le.parent.selectedBy ) {
				// all levels get access to the parameters besides newView, if needed:
				let nPL = simpleClone( pL );
				nPL.newView = le.parent.view;
				setViewFromRoot( le.parent, nPL )
			};
			// set this level's view controller to choose the desired view:
			le.parent.ViewControl.show( pL )
		}
		function setViewToLeaf( le, pL ):void {
			// step down, if there is a child view:
				function findDefault( vL ) {
					for( var i=vL.length-1; i>-1; i-- ) {
						if( vL[i].isDefault ) return vL[i]
					};
					// in absence of a default view, take the first in the list:
					return vL[0]
				}
			if( le.ViewControl && le.ViewControl.list.length>0 ) {
				let ch = findDefault( le.ViewControl.list ),
					nPL = simpleClone( pL );
				nPL.newView = ch.view;
				le.ViewControl.show( nPL );
				setViewToLeaf( ch, pL )
			}
		}
	};
	hide ():void {
		// hide all views of the top level:
		this.tree.ViewControl.hide()
	};
	isReady ( mod:string ):boolean {
		return this.ready.indexOf( mod ) >-1
	}

	private register(mod: string): boolean {
		// return true, if mod has been successfully registered and is ready to load
		// return false, if mod is already registered and there is no need to load it
		if (this.registered.indexOf(mod) > -1) {
			console.warn("WARNING: Did not reload module '" + mod + "'.");
			return false
		};

		this.registered.push(mod);
		//		console.info( "Register: "+mod+" ("+this.registered.length+")" );
		return true
	}
/*	deregister( mod ) {
		// remove the module name from the lists:
		let i=this.ready.indexOf(mod);
		if( i>-1 ) this.ready.splice(i,1);
		i=this.registered.indexOf(mod);
		if( i>-1 ) this.registered.splice(i,1);
//		console.info( "Deregister: "+mod+" ("+this.registered.length+")" );
	}  */
	private findM( tr, token:string ) {
		// find the module with the given token in the module hierarchy 'tr':
		let m=null;
		if( Array.isArray(tr) ) {
			for( var i=tr.length-1; !m&&i>-1; i-- ) {
				m = find(tr[i]);
			};
		} else {
			m = find(tr);
		};
		return m;

		function find(e) {
			// by design: name without '#' and view with '#'
			if( e.name==token || e.view==token ) return e;
			if( e.children ) {
				let m = this.findM(e.children,token);
				if( m ) return m;
			};
			return false;
		}
	}
	loadM(mod: string): boolean {
		if( this.register( mod ) ) {
			// Load the module, if registration went well (if it hadn't been registered before):
//			console.debug('this.loadM',mod);
			switch( mod ) {
				// 3rd party:
				case "bootstrap":			getCss( "https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.4.1/css/bootstrap.min.css" );
											getCss( "https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.4.1/css/bootstrap-theme.min.css" );
											getScript( 'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.4.1/js/bootstrap.min.js' ); return true;
				case "bootstrapDialog":		getCss( "https://cdnjs.cloudflare.com/ajax/libs/bootstrap3-dialog/1.35.4/css/bootstrap-dialog.min.css" );
											getScript( 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap3-dialog/1.35.4/js/bootstrap-dialog.min.js' ); return true;
				case "tree": 				getCss( "https://cdnjs.cloudflare.com/ajax/libs/jqtree/1.5.3/jqtree.css" );
											getScript( 'https://cdnjs.cloudflare.com/ajax/libs/jqtree/1.5.3/tree.jquery.js' ); return true;
				case "fileSaver": 			getScript( 'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.2/FileSaver.min.js' ); return true;
				case "zip": 				getScript( 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.5.0/jszip.min.js' ); return true;
				case "jsonSchema": 			getScript( 'https://cdnjs.cloudflare.com/ajax/libs/ajv/4.11.8/ajv.min.js' ); return true;
				case "excel": 				getScript( 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.16.7/xlsx.full.min.js' ); return true;
				case "bpmnViewer":			getScript( 'https://unpkg.com/bpmn-js@7.2.1/dist/bpmn-viewer.production.min.js' ); return true;
				case "graphViz":	 	//	getCss( "https://cdnjs.cloudflare.com/ajax/libs/vis/4.20.1/vis-network.min.css" );
											getScript( 'https://cdnjs.cloudflare.com/ajax/libs/vis/4.20.1/vis-network.min.js' ); return true;
		//		case "pouchDB":		 		getScript( 'https://unpkg.com/browse/pouchdb@7.2.2/dist/pouchdb.min.js' ); return true;
		//		case "dataTable": 			getCss( this.loadPath+'vendor/assets/stylesheets/jquery.dataTables-1.10.19.min.css' );
		//									getScript( this.loadPath+'vendor/assets/javascripts/jquery.dataTables-1.10.19.min.js' ); return true;
		//		case "diff": 				getScript( 'https://cdnjs.cloudflare.com/ajax/libs/diff_match_patch/20121119/diff_match_patch.js' ); return true;
		/*		case "markdown": 			import( 'https://cdn.jsdelivr.net/combine/npm/remarkable@2/dist/esm/index.browser.min.js,npm/remarkable@2/dist/esm/linkify.min.js' )
											.then( (m)=>{ window.markdown = new m.Remarkable('full',{xhtmlOut:true,breaks:true}) });
											return true;  */
				case "markdown": 			getScript( 'https://cdn.jsdelivr.net/npm/markdown-it@12/dist/markdown-it.min.js' )
											.done( ()=>{ window.markdown = window.markdownit({html:true,xhtmlOut:true,breaks:true,linkify:false}) });
											return true;

				// libraries:
		//		case "config": 				getScript( this.loadPath+'config/definitions.js' ); return true;
				case "types":				getScript( this.loadPath+'types/specif.types.js'); return true;
				case "i18n": 				switch( browser.language.slice(0,2) ) {
												case 'de':  getScript( this.loadPath+'config/locales/iLaH-de.i18n.js' )
															.done( ()=>{ i18n = LanguageTextsDe() } ); break;
												case 'fr':  getScript( this.loadPath+'config/locales/iLaH-fr.i18n.js' )
															.done( ()=>{ i18n = LanguageTextsFr() } ); break;
												default:	getScript( this.loadPath+'config/locales/iLaH-en.i18n.js' )
															.done( ()=>{ i18n = LanguageTextsEn() } )
											};
											return true;
				case "mainCSS":				getCss( this.loadPath+'vendor/assets/stylesheets/SpecIF.default.css' ); this.setReady(mod); return true;
				case "stdTypes":			getScript(this.loadPath + 'modules/stdTypes.js')
											.done(() => { standardTypes = new StandardTypes(); });
											return true;
				case "helper": 				getScript( this.loadPath+'modules/helper.js' ); return true;
				case "helperTree": 			getScript( this.loadPath+'modules/helperTree.js' ); return true;
				case "xSpecif":				getScript( this.loadPath+'modules/xSpecif.js' ); return true;
				case "cache": 				getScript( this.loadPath+'modules/cache.mod.js' ); return true;
				case "profileAnonymous":	getScript( this.loadPath+'modules/profileAnonymous.mod.js' ); return true;
		/*		case "profileMe":			$('#'+mod).load( this.loadPath+'modules/profileMe-0.93.1.mod.html', function() {this.setReady(mod)} ); return true;
				case "user":				$('#'+mod ).load( this.loadPath+'modules/user-0.92.44.mod.html', function() {this.setReady(mod)} ); return true;
				case "projects":			this.loadM( 'toEpub' );
											$('#'+mod).load( this.loadPath+'modules/projects-0.93.1.mod.html', function() {this.setReady(mod)} ); return true; */
				case 'toHtml': 				getScript( this.loadPath+'modules/toHtml.js' ); return true;
				case "toXhtml": 			getScript( this.loadPath+'vendor/assets/javascripts/toXhtml.js' ); return true;
				case "toEpub": 				this.loadM( 'toXhtml' );
											getScript( this.loadPath+'vendor/assets/javascripts/toEpub.js' ); return true;
				case "toOxml":				// the loading of fileSaver is attached here for all exports:
											this.loadM('fileSaver');
											getScript( this.loadPath+'vendor/assets/javascripts/toOxml.js' ); return true;
				case "toTurtle":			getScript( this.loadPath+'vendor/assets/javascripts/specif2turtle.js' ); return true;
				case 'bpmn2specif':			getScript( this.loadPath+'vendor/assets/javascripts/BPMN2SpecIF.js' ); return true;
				case 'archimate2specif':	getScript( this.loadPath+'vendor/assets/javascripts/archimate2SpecIF.js' ); return true;
				case 'reqif2specif':		getScript( this.loadPath+'vendor/assets/javascripts/reqif2specif.js' ); return true;
				case 'checkSpecif':			getScript( 'https://specif.de/v'+CONFIG.specifVersion+'/check.js' ); return true;
				case 'statementsGraph': 	this.loadM( 'graphViz' );
											getScript( this.loadPath+'modules/graph.js' ); return true;
		/*		case CONFIG.objectTable:  	this.loadM( 'dataTable' );
										//	this.loadM( 'dataTableButtons' );
										//	this.loadM( 'zip' );  // needed for Excel export
											getScript( this.loadPath+'modules/objectTable-0.93.1.js' ); return true;
				case "serverPouch":			this.loadM('pouchDB');
											getScript(this.loadPath + 'modules/serverPouch.mod.js'); return true; */

				// constructors/modules:
				case "about":				getScript( this.loadPath+'modules/about.mod.js' ); return true;
				case 'importAny':			this.loadM( 'zip' );
											getScript( this.loadPath+'modules/importAny.mod.js' ); return true;
				case 'ioSpecif':			this.loadM( 'jsonSchema' );
											this.loadM( 'checkSpecif' );
											getScript( this.loadPath+'modules/ioSpecif.mod.js' ); return true;
				case 'ioReqif': 			this.loadM( 'reqif2specif' );
											getScript( this.loadPath+'modules/ioReqif.mod.js' ); return true;
				case 'ioRdf': 				getScript( this.loadPath+'modules/ioRdf.mod.js' ); return true;
				case 'ioXls': 				this.loadM( 'excel' );
											getScript( this.loadPath+'modules/ioXls.mod.js' ); return true;
				case 'ioBpmn':				this.loadM( 'bpmn2specif' );
											this.loadM( 'bpmnViewer' );
											getScript( this.loadPath+'modules/ioBpmn.mod.js' ); return true;
				case 'ioArchimate':			this.loadM( 'archimate2specif' );
											getScript( this.loadPath+'modules/ioArchimate.mod.js' ); return true;

				// CONFIG.project and CONFIG.specifications are mutually exclusive (really true ??):
		/*		case CONFIG.users:		//	this.loadM( 'mainCSS' );
											$('#'+mod).load( "./modules/users-0.92.41.mod.html", function() {this.setReady(mod)} ); return true;
				case CONFIG.project:		// if( this.registered.indexOf(CONFIG.specifications)>-1 ) { console.warn( "modules: Modules '"+CONFIG.specifications+"' and '"+mod+"' cannot be used in the same app." ); return false; }
										//	this.loadM( 'mainCSS' );
										//	this.loadM( 'cache' );
											this.loadM( 'stdTypes' );
											$('#'+mod).load( "./modules/project-0.92.45.mod.html", function() {this.setReady(mod)} ); return true;
		*/
				case CONFIG.specifications: // if( this.registered.indexOf(CONFIG.project)>-1 ) { console.warn( "modules: Modules '"+CONFIG.project+"' and '"+mod+"' cannot be used in the same app." ); return false; }
										//	this.loadM( 'stdTypes' );
										//	this.loadM( 'diff' );
											getScript( this.loadPath+'modules/specifications.mod.js' ); return true;

				// sub-modules of module 'specifications':
				case CONFIG.reports: 		getScript( this.loadPath+'modules/reports.mod.js' ); return true;
				case CONFIG.objectFilter:  	getScript( this.loadPath+'modules/filter.mod.js' ); return true;
				case CONFIG.resourceEdit:	// this.loadM( 'xhtmlEditor' );
											getScript( this.loadPath+'modules/resourceEdit.mod.js' ); return true;
				case CONFIG.resourceLink:	getScript( this.loadPath+'modules/resourceLink.mod.js' ); return true;
		//		case CONFIG.files: 			getScript( this.loadPath+'modules/files-0.93.1.js'); return true;

				default:					console.warn( "Module loader: Module '"+mod+"' is unknown." ); return false;
			}
		};
		return false;

		// Add cache-busting on version-change to all files from this development project,
		// i.e. all those having a relative URL.
		// see: https://curtistimson.co.uk/post/front-end-dev/what-is-cache-busting/
		function getCss( url:string ):void {
			$('head').append( '<link rel="stylesheet" type="text/css" href="'+url+(url.slice(0,4)=='http'? "" : "?"+CONFIG.appVersion)+'" />' );
			// Do not call 'setReady', because 'getCss' is almost always called in conjunction 
			// with 'getScript' which is taking care of 'setReady'.
			// Must be called explicitly, if not in conjunction with 'getScript'.
		}
		function getScript( url:string, options? ) {
			// see http://api.jquery.com/jQuery.getScript/
			// Any option may be set by the caller except for dataType and cache:
			options = $.extend( options || {}, {
				dataType: "script",
				cache: true,
				url: url + (url.slice(0,4)=='http'? "" : "?"+CONFIG.appVersion)
			});
			// Use $.ajax() with options since it is more flexible than $.getScript:
			if( url.indexOf('.mod.')>0 )
				// 'setReady' is called by 'construct':
				return $.ajax( options );
			else
				// call 'setReady' from here:
				return $.ajax( options ).done( ()=>{this.setReady(mod)} );
		}
	}
	private loadH(h, opts?): void {
		// load the modules in hierarchy h
		// specified by a name string or an object with property 'name';
		// h can be a single element, a list or a tree.
		function ld(e): void {
			// load a module named 'e':
			if (typeof (e) == 'string') {
				this.loadM(e);
				return
			};
			// else, the module is described by an object with a property 'name':
			// append the view to the parent view, where
			// - the visibility of the view shall be controlled by the parent's ViewControl
			if (e.view && e.parent) {
				let c = e.viewClass ? 'class="' + e.viewClass + '" ' : '',
					d = '<div id="' + e.view.substring(1) + '" ' + c + ' style="display:none;"></div>';
				//					console.debug('l.view',e,c,d);
				$(e.parent.view).append(d);
			};
			// load a module in case of elements with a name:
			// (lazy loading is not yet implemented)
			if (e.name && !e.lazy)
				this.loadM(e.name);
			if (e.children) {
				// in certain cases prepare for controlling the children's views:
				if (e.selector) {
					//						console.debug('l.selector',e);
					// The element has children and a selector, so add the view controller:
					e.ViewControl = new ViewControl();

					// ... and create a corresponding visual selector for the children's views,
					// if it has not been defined manually:
					//						console.debug('s',e.selector,$(e.selector),$(e.selector).length);
					if ($(e.selector).length < 1) {
						let s = '';
						switch (e.selectorType) {
							case 'btns':
								s = '<div id="' + e.selector.substring(1) + '" class="btn-group btn-group-md" ></div>';
								break;
							//	case 'tabs':
							default:
								s = '<ul id="' + e.selector.substring(1) + '" role="tablist" class="nav nav-tabs"></ul>'
						};
						$(e.view).append(s);
					};

					// Then care for the entries in the view controller and in the visual selector:
					let id = null, lbl = null;
					e.children.forEach(function (ch) {
						if (ch.view) {
							if (!ch.selectedBy) {
								// only one of them is present:
								console.error("Module '" + ch.name + "' must have both properties 'view' and 'selectedBy' or none.");
								return
							};
							// else, both 'view' and 'selectedBy' are present:

							// Add the child's view to the view controller;
							// the elements of ViewControl are a subset of the elements of children, namely those with a view:
							e.ViewControl.add(ch);

							// Add a view selector element for the child (button resp. tab):
							id = ch.selectedBy.substring(1);	// without '#'
							lbl = ch.label || id;
							//								console.debug('e',e,ch,id,lbl);
							switch (e.selectorType) {
								case 'btns':
									$(e.selector).append(
										'<button id="' + id + '" type="button" class="btn btn-default" onclick="moduleManager.show(\'' + ch.view + '\')" >' + lbl + '</button>'
									);
									break;
								//	case 'tabs':
								default:
									$(e.selector).append(
										'<li id="' + id + '" onclick="moduleManager.show(\'' + ch.view + '\')"><a>' + lbl + '</a></li>'
									);
							};
						};
						if (ch.action) {
							if (!ch.selectedBy) {
								// only one of them is present:
								console.error("Module '" + ch.name + "' must have both properties 'action' and 'selectedBy' or none.");
								return
							};
							// Add a view selector element for the child (only button is implemented):
							id = ch.selectedBy.substring(1);	// without '#'
							lbl = ch.label || id;
							switch (e.selectorType) {
								case 'btns':
									$(e.selector).append(
										'<button id="' + id + '" type="button" class="btn btn-default" onclick="' + ch.action + '" >' + lbl + '</button>'
									);
									break;
								default:
									console.error("Action'" + lbl + "' needs a parent selector of type 'btns'.");
							};
						};
					});
				};
				// finally load all the children, as well:
				e.children.forEach((c) => {
					c.parent = e;
					this.loadH(c);
				});
			};
		}
		//		console.debug('loadH',h,opts);

		if (opts && typeof (opts.done) == "function")
			this.callWhenReady = opts.done;

		if (Array.isArray(h))
			h.forEach((e) => { ld(e) });
		else
			ld(h);
	}
	private initH(h) {
		// initialize the hierarchy of modules;
		// where h can be a module or an array of modules
		// ... and a module can have children:
		function it(e) {
			if (typeof (e.init) == 'function')
				e.init();
			if (e.children)
				// initialize all the children:
				e.children.forEach((c) => { this.initH(c) })
		}

		if (h) {
			if (Array.isArray(h))
				h.forEach((e) => { it(e) })
			else
				it(h)
		};
	}
	private setReady( mod:string ):boolean {
		// Include mod in the 'ready' list, once successfully loaded;
		// Execute 'callWhenReady()', if/when the last registered module is ready.
		if( this.ready.indexOf(mod)<0 ) {
			this.ready.push( mod );
			console.info( mod+" loaded ("+this.ready.length+"/"+this.registered.length+")" );
		}
		else {
			throw "Programming Error: Module '"+mod+"' is set 'ready' more than once";
		};

		if( this.registered.length === this.ready.length ) {
			this.initH( this.tree );
			console.info("All " + this.ready.length + " modules loaded --> ready!");
			if( typeof(this.callWhenReady)=='function' )
				this.callWhenReady()
			else
				throw "Programming Error: No callback provided to continue after module loading.";
		}
	}
}
class State {
	// sets and resets some binary state (e.g. 'busy'),
	// hides resp. shows certain DOM elements according to the lists specified.
	state = false;
	showWhenSet = [];
	hideWhenSet = [];

	constructor(opts:any) {
		if (Array.isArray(opts.showWhenSet))
			this.showWhenSet = opts.showWhenSet;
		if (Array.isArray(opts.hideWhenSet))
			this.hideWhenSet = opts.hideWhenSet;
	}
	set ( flag:boolean|undefined ):void {
		switch( flag ) {
			case false:
				this.reset();
				break;
			case undefined:
			case true:
				this.state = true;
				this.hideWhenSet.forEach( (v):void =>{
					$(v).hide();
				});
				this.showWhenSet.forEach((v):void =>{
					$(v).show();
				})
		}
	}
	reset ():void {
				this.state = false;
				this.showWhenSet.forEach( (v):void =>{
					$(v).hide()
				});
				this.hideWhenSet.forEach((v):void =>{
					$(v).show();
				});
	}
	get():boolean {
		return this.state;
	}
}
var app,
	browser,
	i18n,
	standardTypes,
	modules = new ModuleManager();
