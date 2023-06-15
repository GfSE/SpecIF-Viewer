/*!	A simple module loader and object (singleton) factory.
	When all registered modules are ready, a callback function is executed to start or continue the application.
	Dependencies: jQuery 3.1 and later.
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/

interface IModule {
	name: string;
	label: string;
	loadAs: string;
	view: string;
	viewClass: string;
	selector: string;
	selectorType: string;
	selectedBy: string;
	children: IModule[];
	parent: IModule;
	viewControl: ViewControl;
	init: Function;
	clear: Function;
	show: Function;
	hide: Function;
	// additional properties and methods are possible,
	// see: https://stackoverflow.com/questions/33836671/typescript-interface-that-allows-other-properties
	[x: string]: any;  
}
interface IModuleManager {
	init: Function;
	load: Function;			// load a hierarchy of modules to construct
	construct: Function;	// construct a single executable module
	show: Function;			// select a new module for operation
//	hide: Function;
	isReady: Function;		// check, if a module is loaded and ready for operation
}
interface IApp {
	title: string;
	busy: State;
	standards: CStandards;
	cache: IProjects;
	init(): boolean;
	show(): void;
	export(): void;
	hide():void;
	logout():void;
	about: IModule;
	me: IMe;
	specs: IModule;
	doc: IModule;
	statements: IModule;
	filter: IModule;
	reports: IModule; 
//	vicinityGraph?: IModule;
	importAny: IModule;
	ioSpecif: IModule;
	ioReqif?: IModule;
	ioBpmn?: IModule;
	ioArchimate?: IModule;
	ioXls?: IModule;
	// additional properties and methods are possible,
	// see: https://stackoverflow.com/questions/33836671/typescript-interface-that-allows-other-properties
	[x: string]: any;  
}

class ViewControl {
	// Constructs an object to control the visibility of the DOM-tree elements listed in 'list';
	// the selected view is shown, all others are hidden.
	// ViewControl can switch pages or tabs, depending on the navigation level:
	list:IModule[];		// the list of alternative views under control of the respective object
	selected:IModule|undefined;	// the currently selected view

	constructor() {
		this.list = [];
//		this.selected = undefined;
	}
	exists(v:string): boolean {
		return LIB.indexBy(this.list, 'view', v) > -1;
	}
	add(v:IModule): void {
		// add the module to the view list of this level:
		this.list.push(v);
		$(v.view).hide();
		// we could add the visual selector, here ... it is now part of loadH.
	}
	show(params:any): void {
		// Select a new view
		// by calling functions 'show'/'hide' in case they are implemented in the respective modules.
		// - simple case: params is a string with the name of the new view.
		// - more powerful: params is an object with the new target view plus optionally content or other parameters
		if (typeof (params)!='object') 
			throw Error("moduleManager.show() needs a parameter.");
//		console.debug('ViewControl.show',this.list,this.selected,params);

		/*	if( self.selected && params.view==self.selected.view ) {
				// just update the current view:
				if( typeof(params.content)=='string' ) $(self.selected.view).html(params.content);
					return
			};  */
		// else: show params.view and hide all others:
		let v:JQuery, s:JQuery;
		this.list.forEach((le:IModule) => {
//					console.debug('ViewControl.show le',le);
			v = $(le.view);			// the view
			s = $(le.selectedBy); 	// the visual selector
			if (params.view == le.view) {
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
//				console.debug('ViewControl.hide: ',le.view,le.selectedBy,v,s);
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
	hide(v:string):void {
		if (typeof (v) == 'string' && this.exists(v)) {
			// hide a specific view:
			$(v).hide();
			return;
		};
		// else, hide the selected view:
		if (this.selected) {
//					console.debug( 'hide', self.selected );
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

var app:IApp,
	browser:Browser,
	i18n: any,
	message: any,
//	standardTypes:StandardTypes,
	moduleManager:IModuleManager = function() {
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

	var self:any = {};
	let callWhenReady:Function|undefined,
		loadPath = './';

	self.init = ( opts?:any ):void =>{

		// identify browser capabilities:
		browser = new Browser();

		// Check the browser type, the first test is true for IE <= 10, the second for IE 11.
		if( browser.isIE() ) {
			let txt = 'Stopping: The web-browser Internet Explorer is not supported.';
			console.error(txt);
			alert(txt);
			return;
		};

		if (opts && opts.path)
			loadPath = opts.path;

		self.registered = [];
		self.ready = [];

		// init phase 1: Load the javascript routines common to all apps:
		loadL(['bootstrap','font','types','i18n','tree'], {done:init2} );
		return;

		// init phase 2: the following must be loaded and accessible before any other modules can be loaded:
		function init2():void {
//			console.debug('init2',opts);
			let modL = ['helper', 'helperTree', 'bootstrapDialog', 'mainCSS', 'generateClasses', 'standards', "xSpecif"];
			if( CONFIG.convertMarkdown ) modL.push('markdown');
			loadL(modL,
				{
					done: () => {
						// Create and initialize the app,
						app = window['SpecifApp']();

						// Add a global spinner with state control;
						// all actions are deactivated as long as the app is busy.
						// - 'pageActions' are at the top of the page and can be initiated independently of the app's state
						// - 'contentActions' appear on the content pane (the shown tab) depending on the app's state
						// - 'elementActions' apply to a single list entry in the content pane (tab)
						app.busy = new State({
							showWhenSet: ['#spinner'],
							hideWhenSet: ['.pageActions', '.contentActions']
						//	hideWhenSet: ['.pageActions','.contentActions','.elementActions']
						});

						// Make sure page divs are resized, if the browser window is changed in size:
						bindResizer();
					}
				}
			);
		}
		function loadL(L: string[], opts?: any): void {
			// load the modules in hierarchy h
			// specified by a name string or an object with property 'name';
			// h can be a single element, a list or a tree.

			if (opts && typeof (opts.done) == "function")
				callWhenReady = opts.done
			else
				callWhenReady = undefined;

			L.forEach((e) => { loadModule(e) });
		}
	};
	function register( mod:string ):boolean {
		// return true, if mod has been successfully registered and is ready to load
		// return false, if mod is already registered and there is no need to load it
		if( self.registered.includes(mod) ) {
			console.warn( "WARNING: Did not reload module '"+mod+"'." );
			return false;
		};

		self.registered.push( mod );
//		console.info( "Register: "+mod+" ("+self.registered.length+")" );
		return true
	}
/*	self.deregister = function( mod ) {
		// remove the module name from the lists:
		let i=self.ready.indexOf(mod);
		if( i>-1 ) self.ready.splice(i,1);
		i=self.registered.indexOf(mod);
		if( i>-1 ) self.registered.splice(i,1);
//		console.info( "Deregister: "+mod+" ("+self.registered.length+")" );
	};  */
	self.load = ( tr:IModule, opts:any ):void =>{
		// tr is a hierarchy of modules, where the top element represents the application itself;
		// only modules with a specified 'name' will be loaded:
			// load the modules in hierarchy tr
			// specified by a name string or an object with property 'name';
			// tr can be a single element, a list or a tree.
		self.tree = tr;
//		console.debug('loadH',h,opts);
		if (opts && typeof (opts.done) == "function")
			callWhenReady = opts.done;
		ld(tr);
		return;

		function ld(e: IModule): void {
			// else, the module is described by an object with a property 'name':
			// append the view to the parent view, where
			// - the visibility of the view shall be controlled by the parent's ViewControl
			if (e.view && e.parent) {
				let c = e.viewClass ? 'class="' + e.viewClass + '" ' : '',
					d = '<div id="' + e.view.substring(1) + '" ' + c + ' style="display:none;"></div>';
//				console.debug('l.view',e,c,d);
				$(e.parent.view).append(d);
			};
			// load a module in case of elements with a name:
			// (lazy loading is not yet implemented)
			if (e.name /* && !e.lazy */) {
				loadModule(e);
			};
			if (e.children) {
				loadChildren(e);
			};
			return;

			function loadChildren(e: IModule): void {
				// in certain cases prepare for controlling the children's views:
				if (e.selector) {
//					console.debug('l.selector',e);
					// The element has children and a selector, so add the view controller:
					e.ViewControl = new ViewControl();

					// ... and create a corresponding visual selector for the children's views,
					// if it has not been defined manually:
//					console.debug('s',e.selector,$(e.selector),$(e.selector).length);
					if ($(e.selector).length < 1) {
						let s = '';
						switch (e.selectorType) {
							case 'btns':
								s = '<div id="' + e.selector.substring(1) + '" class="btn-group" ></div>';
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
								throw Error("Module '" + ch.name + "' must have both properties 'view' and 'selectedBy' or none.");
							};
							// else, both 'view' and 'selectedBy' are present:

							// Add the child's view to the view controller;
							// the elements of ViewControl are a subset of the elements of children, namely those with a view:
							e.ViewControl.add(ch);

							// Add a view selector element for the child (button resp. tab):
							id = ch.selectedBy.substring(1);	// without '#'
							lbl = ch.label || id;
//							console.debug('e',e,ch,id,lbl);
							switch (e.selectorType) {
								case 'btns':
									$(e.selector).append(
										'<button id="' + id + '" type="button" class="btn btn-default" onclick="moduleManager.show({view:\'' + ch.view + '\'})" >' + lbl + '</button>'
									);
									break;
							//	case 'tabs':
								default:
									$(e.selector).append(
										'<li id="' + id + '" onclick="moduleManager.show({view:\'' + ch.view + '\'})"><a>' + lbl + '</a></li>'
									);
							};
						};
						if (ch.action) {
							if (!ch.selectedBy) {
								// only one of them is present:
								throw Error("Module '" + ch.name + "' must have both properties 'action' and 'selectedBy' or none.");
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
									throw Error("Action'" + lbl + "' needs a parent selector of type 'btns'.");
							};
						};
					});
				};
				// finally load all the children, as well:
				e.children.forEach((c) => {
					c.parent = e;
					ld(c);
				});
			}
		}
	};
	self.construct = ( defs:IModule, constructorFn:Function ):void =>{
		// Construct controller and view of a module.
		// This routine is called by the respective module in the code file, once loaded with 'loadH'/'loadModule',
		// make sure that 'setReady' is not called in 'loadModule', if 'construct' is used.
		// Or, the routine is called explicitly to construct a module without loading a dedicated file.

		// find module by name or by view somewhere in the complete module tree of the app:
		let mo = findModule(self.tree,defs.name||defs.view);
		if(!mo)
			throw Error(defs.name? "'"+defs.name+"' is not a defined module name" : "'"+defs.view+"' is not a defined view");

		$.extend(mo, defs);
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
		if( defs.name && self.registered.includes(defs.name) )
			setReady( defs.name )

		// the module will be initialized within setReady() once all modules are loaded.
	};
	self.show = ( params:any ):void =>{
		// Show the specified view, which may be located somewhere in the hierarchy;
		// Assuming that it's parent has a ViewControl:
		if ( typeof(params)!='object' )
			throw Error("Undefined target view.");
//		console.debug('moduleManager.show',params);

		let mo = findModule(self.tree, params.view);
		if( !mo || !mo.parent.ViewControl )
			throw Error("'"+params.view+"' is not a defined view");

		// Set the view from the top-level to the lowest level,
		// so that it is possible to jump from any branch to another at any level.
		// Begin from the top:
		setViewFromRoot( mo, params );
		// Now we have selected the specified view;
		// select a subview, if there is any:
		setViewToLeaf( mo, params );
		return;

		function setViewFromRoot( le:IModule, pL:any[] ):void {
			// step up, if there is a parent view:
			if( le.parent.selectedBy ) {
				// all levels get access to the parameters besides view, if needed:
				let nPL = simpleClone( pL );
				nPL.view = le.parent.view;
				setViewFromRoot( le.parent, nPL )
			};
			// set this level's view controller to choose the desired view:
			le.parent.ViewControl.show( pL )
		}
		function setViewToLeaf(le: IModule, pL: any[] ):void {
			// step down, if there is a child view:
				function findDefault(vL: IModule[]): IModule {
					for( var i=vL.length-1; i>-1; i-- ) {
						if( vL[i].isDefault ) return vL[i]
					};
					// in absence of a default view, take the first in the list:
					return vL[0]
				}
			if( le.ViewControl && le.ViewControl.list.length>0 ) {
				let ch = findDefault( le.ViewControl.list ),
					nPL = simpleClone( pL );
				nPL.view = ch.view;
				le.ViewControl.show( nPL );
				setViewToLeaf( ch, pL )
			}
		}
	};
/*	self.hide = ():void =>{
		// hide all views of the top level:
		self.tree.ViewControl.hide()
	}; */
	self.isReady = ( mod:string ):boolean =>{
		return self.ready.includes( mod )
	};
	return self;

	function initModuleTree( h: IModule ): void {
		// initialize the hierarchy of modules;
		// where h can be a module or an array of modules
		// ... and a module can have children:
		function it(e: IModule) {
				if( typeof(e.init)=='function' )
					e.init();
				if (e.children)
					// initialize all the children:
					e.children.forEach((c) => { it(c) });
			}

		if( h ) {
			it(h)
		}
	}
	function findModule( tr:IModule[]|IModule, token:string ):IModule|undefined {
		// find the module with the given token in the module hierarchy 'tr':
		let m:IModule|undefined = undefined;
		if( Array.isArray(tr) ) {
			for( var i=tr.length-1; !m&&i>-1; i-- ) {
				m = find(tr[i]);
			};
		}
		else {
			m = find(tr);
		};
		return m;

		function find(e:IModule):IModule|undefined {
			// by design: name without '#' and view with '#'
			if( e.name==token || e.view==token ) return e;
			if( e.children ) {
				let m = findModule(e.children,token);
				if( m ) return m;
			}
		//	return undefined;
		}
	}
	function loadModule(mod: IModule | string): void {
		var module: any = typeof (mod) == 'string' ? { name: mod } : mod;

		if (register(module.name)) {
			// Load the module, if registration went well:
			loadAfterRequiredModules(module,ldM)
		};
		return;

		function ldM(mod:string):boolean {
			switch (mod) {
				// 3rd party:
			//	case "font":				getCss("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"); setReady(mod); return true;
				case "font":				getCss("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.1/font/bootstrap-icons.css"); setReady(mod); return true;
				case "bootstrap":			getCss("https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.4.1/css/bootstrap.min.css");
											getCss("https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.4.1/css/bootstrap-theme.min.css");
											getScript('https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.4.1/js/bootstrap.min.js'); return true;
				case "bootstrapDialog":		getCss("https://cdnjs.cloudflare.com/ajax/libs/bootstrap3-dialog/1.35.4/css/bootstrap-dialog.min.css");
											getScript('https://cdnjs.cloudflare.com/ajax/libs/bootstrap3-dialog/1.35.4/js/bootstrap-dialog.min.js'); return true;

			//	case "tree":				getCss( "https://cdnjs.cloudflare.com/ajax/libs/jqtree/1.6.3/jqtree.css" );
				// temporary solution with fix for buttonLeft=false:
				case "tree":				getCss(loadPath + 'vendor/assets/stylesheets/jqtree-buttonleft.css');
											getScript('https://cdnjs.cloudflare.com/ajax/libs/jqtree/1.6.3/tree.jquery.js'); return true;
				case "fileSaver":			getScript('https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js'); return true;
				case "zip":					getScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'); return true;
				case "jsonSchema":			getScript('https://cdnjs.cloudflare.com/ajax/libs/ajv/4.11.8/ajv.min.js'); return true;
			//	case "jsonSchema":			getScript( 'https://cdnjs.cloudflare.com/ajax/libs/ajv/8.6.1/ajv2019.min.js'); return true;
				case "excel":				getScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'); return true;
			//	case "bpmnViewer":			getScript('https://unpkg.com/bpmn-js@11.5.0/dist/bpmn-viewer.production.min.js'); return true;
				case "bpmnViewer":			getScript('https://unpkg.com/bpmn-js@13.2.0/dist/bpmn-viewer.production.min.js'); return true;
				case "graphViz":	 	//	getCss( "https://cdnjs.cloudflare.com/ajax/libs/vis/4.20.1/vis-network.min.css" );
											getScript('https://cdnjs.cloudflare.com/ajax/libs/vis/4.20.1/vis-network.min.js'); return true;
			/*	case "pouchDB":		 		getScript( 'https://unpkg.com/browse/pouchdb@7.2.2/dist/pouchdb.min.js' ); return true;
				case "dataTable": 			getCss( loadPath+'vendor/assets/stylesheets/jquery.dataTables-1.10.19.min.css' );
											getScript( loadPath+'vendor/assets/javascripts/jquery.dataTables-1.10.19.min.js' ); return true;
				case "diff": 				getScript( 'https://cdnjs.cloudflare.com/ajax/libs/diff_match_patch/20121119/diff_match_patch.js' ); return true; */

				//	Consider https://github.com/rsms/markdown-wasm
				case "markdown":			getScript('https://cdn.jsdelivr.net/npm/markdown-it@13.0.1/dist/markdown-it.min.js')
											// @ts-ignore - 'window.markdown' is defined, if loaded
											.done(() => { window.markdown = window.markdownit({ html: true, xhtmlOut: true, breaks: true, linkify: false }) });
											return true;

				// libraries:
				case "mainCSS": getCss(loadPath + 'vendor/assets/stylesheets/SpecIF.default.css'); setReady(mod); return true;
			//	case "config": 				getScript( loadPath+'config/definitions.js' ); return true;
				case "types": getScript(loadPath + 'types/specif.types.js'); return true;
				case "i18n": switch (browser.language.slice(0, 2)) {
								case 'de': getScript(loadPath + 'config/locales/iLaH-de.i18n.js')
									.done(() => { i18n = LanguageTextsDe() }); break;
								case 'fr': getScript(loadPath + 'config/locales/iLaH-fr.i18n.js')
									.done(() => { i18n = LanguageTextsFr() }); break;
								default: getScript(loadPath + 'config/locales/iLaH-en.i18n.js')
									.done(() => { i18n = LanguageTextsEn() })
							};
							return true;
				case "helper": getScript(loadPath + 'modules/helper.js')
					.done(() => { message = new CMessage(); });
					return true;
				case "standards": getScript(loadPath + 'modules/standards.js'); return true;
				case 'generateClasses': getScript(loadPath + 'modules/generateClasses.js'); return true;
				case "Ontology": getOntology(); return true;
				case "helperTree": getScript(loadPath + 'modules/helperTree.js'); return true;
				case "xSpecif": getScript(loadPath + 'modules/xSpecif.js'); return true;
				case "cache":
					loadModule("Ontology");
				//	loadModule('standards');
					getScript(loadPath + 'modules/cache.mod.js'); return true;
				case "profileAnonymous": getScript(loadPath + 'modules/profileAnonymous.mod.js'); return true;
			/*	case "profileMe":			$('#'+mod).load( loadPath+'modules/profileMe-0.93.1.mod.html', function() {setReady(mod)} ); return true;
				case "user":				$('#'+mod ).load( loadPath+'modules/user-0.92.44.mod.html', function() {setReady(mod)} ); return true;
				case "projects":			loadModule( 'toEpub' );
											$('#'+mod).load( loadPath+'modules/projects-0.93.1.mod.html', function() {setReady(mod)} ); return true; */
				case 'toHtml': // the loading of fileSaver is attached here for all exports:
								loadModule('fileSaver');
								getScript(loadPath + 'modules/toHtml.js'); return true;
				case "toXhtml": getScript(loadPath + 'vendor/assets/javascripts/toXhtml.js'); return true;
				case "toEpub": loadModule('toXhtml');
								getScript(loadPath + 'vendor/assets/javascripts/toEpub.js'); return true;
				case "toOxml":	getScript(loadPath + 'vendor/assets/javascripts/toOxml.js'); return true;
				case "toTurtle": getScript(loadPath + 'vendor/assets/javascripts/specif2turtle.js'); return true;
				case 'bpmn2specif': getScript(loadPath + 'vendor/assets/javascripts/BPMN2SpecIF.js'); return true;
				case 'archimate2specif': getScript(loadPath + 'vendor/assets/javascripts/archimate2SpecIF.js'); return true;
				case 'reqif2specif': getScript(loadPath + 'vendor/assets/javascripts/reqif2specif.js'); return true;
				case 'vicinityGraph': loadModule('graphViz');
								getScript(loadPath + 'modules/graph.js'); return true;
			/*	case CONFIG.objectTable:  	loadModule( 'dataTable' );
										//	loadModule( 'dataTableButtons' );
											getScript( loadPath+'modules/objectTable-0.93.1.js' ); return true;
				case "serverPouch":			loadModule('pouchDB');
											getScript(loadPath + 'modules/serverPouch.mod.js'); return true; */

				// constructors/modules:
				case "about": getScript(loadPath + 'modules/about.mod.js'); return true;
				case 'importAny': loadModule('zip');
								loadModule('jsonSchema');
								getScript(loadPath + 'modules/importAny.mod.js'); return true;
				case 'ioSpecif': getScript(loadPath + 'modules/ioSpecif.mod.js'); return true;
				case 'ioReqif': loadModule('reqif2specif');
								getScript(loadPath + 'modules/ioReqif.mod.js'); return true;
			//	case 'ioRdf': 	getScript( loadPath+'modules/ioRdf.mod.js' ); return true;
				case 'ioXls': loadModule('excel');
								getScript(loadPath + 'modules/ioXls.mod.js'); return true;
				case 'ioBpmn': loadModule('bpmn2specif');
								loadModule('bpmnViewer');
								getScript(loadPath + 'modules/ioBpmn.mod.js'); return true;
				case 'ioArchimate': loadModule('archimate2specif');
								getScript(loadPath + 'modules/ioArchimate.mod.js'); return true;

				// CONFIG.project and CONFIG.specifications are mutually exclusive (really true ??):
			/*	case CONFIG.users:		//	loadModule( 'mainCSS' );
											$('#'+mod).load( "./modules/users-0.92.41.mod.html", function() {setReady(mod)} ); return true;
				case CONFIG.project:		// if( self.registered.includes(CONFIG.specifications) ) { console.warn( "modules: Modules '"+CONFIG.specifications+"' and '"+mod+"' cannot be used in the same app." ); return false; }
										//	loadModule( 'mainCSS' );
										//	loadModule( 'cache' );
											loadModule( 'standards' );
											$('#'+mod).load( "./modules/project-0.92.45.mod.html", function() {setReady(mod)} ); return true;
			*/
				case CONFIG.specifications: // if( self.registered.includes(CONFIG.project) ) { console.warn( "modules: Modules '"+CONFIG.project+"' and '"+mod+"' cannot be used in the same app." ); return false; }
							//	loadModule( 'diff' );
								getScript(loadPath + 'modules/specifications.mod.js'); return true;

				// sub-modules of module 'specifications':
				case CONFIG.reports: getScript(loadPath + 'modules/reports.mod.js'); return true;
				case CONFIG.objectFilter: getScript(loadPath + 'modules/filter.mod.js'); return true;
				case CONFIG.resourceEdit:
								// loadModule( 'xhtmlEditor' );
								getScript(loadPath + 'modules/resourceEdit.mod.js'); return true;
				case CONFIG.resourceLink: getScript(loadPath + 'modules/resourceLink.mod.js'); return true;
			//	case CONFIG.files: 			getScript( loadPath+'modules/files-0.93.1.js'); return true;

				default: console.warn("Module loader: Module '" + mod + "' is unknown."); return false;
			}
		}

		// Add cache-busting on version-change to all files from this development project,
		// i.e. all those having a relative URL.
		// see: https://curtistimson.co.uk/post/front-end-dev/what-is-cache-busting/
		// Thus, append appVersion to all files of this particular app
		// (third party libraries delivered by CDN have a version in the path);
		// it must work for the regular app and the embedded app:
		function bust(url: string): string {
			return url + (url.startsWith(loadPath) ? "?" + CONFIG.appVersion : "");
        }
		function getCss( url:string ) {
			$('head').append('<link rel="stylesheet" type="text/css" href="'+bust(url)+'" />' );
			// Do not call 'setReady', because 'getCss' is almost always called in conjunction 
			// with 'getScript' which is taking care of 'setReady'; 
			// thus call 'setReady' explicitly, if not in conjunction with 'getScript'.
		}
		function getScript( url:string, options?:any ):JQueryXHR {
			// see http://api.jquery.com/jQuery.getScript/
			// Any option may be set by the caller except for dataType and cache:
			let settings = $.extend( options || {}, {
				dataType: "script",
				cache: true,
				url: bust(url)
			});
			// Use $.ajax() with options since it is more flexible than $.getScript:
			if( url.indexOf('.mod.')>0 )
				// 'setReady' is called by 'construct':
				return $.ajax( settings )
			else
				// call 'setReady' from here:
				return $.ajax(settings)
						.done(() => { setReady(module.name) })
		}
		function getOntology() {
			LIB.httpGet({
			//	url: loadPath + 'config/Ontology.specif.zip',
				url: 'https://specif.de/v1.2/Ontology.specif',
				responseType: 'arraybuffer',
				withCredentials: false,
				done: (xhr: XMLHttpRequest) => {
					let ont = JSON.parse(LIB.ab2str(xhr.response));
//					console.debug('Ontology loaded: ',ont);
					app.ontology = new COntology(ont);
					setReady(module.name)
				},
				fail: LIB.stdError
			//	fail: () => { console.error('Failed loading ' + module.name) }
			})
		}
		function loadAfterRequiredModules(mod: IModule, fn: Function): void {
			// start the loading of the modules not before all required modules are ready:
			if (!Array.isArray(mod.requires) || LIB.containsAllStrings( self.ready, mod.requires ))
				fn(mod.name)
			else
				setTimeout(function () { loadAfterRequiredModules(mod, fn) }, 33);
		}
	}
	function setReady( mod:string ):void {
		// Include mod in the 'ready' list, once successfully loaded;
		// Execute 'callWhenReady()', if/when the last registered module is ready.
		if( self.ready.indexOf(mod)<0 ) {
			self.ready.push( mod );
			console.info( mod+" loaded ("+self.ready.length+"/"+self.registered.length+")" );
		}
		else {
			throw Error("Module '"+mod+"' cannot be set 'ready' more than once");
		};

		if( self.registered.length === self.ready.length ) {
			// All modules have been loaded:
			initModuleTree( self.tree );
			console.info( "All "+self.ready.length+" modules loaded --> ready!" );
			if (typeof (callWhenReady) == 'function')
				callWhenReady()
			else
				throw Error("No callback provided to continue after module loading.");
		};
	}
}();
class State {
	// sets and resets some binary state (e.g. 'busy'),
	// hides resp. shows certain DOM elements according to the lists specified.
	state = false;
	showWhenSet:string[];
	hideWhenSet:string[];

	constructor(opts:any) {
		this.showWhenSet = Array.isArray(opts.showWhenSet) ? opts.showWhenSet : [];
		this.hideWhenSet = Array.isArray(opts.hideWhenSet) ? opts.hideWhenSet : [];
	}
	set ( flag?:boolean ):void {
		switch( flag ) {
			case false:
				this.reset();
				break;
			case undefined:
			case true:
				this.state = true;
				this.hideWhenSet.forEach((v: string): void => {
					$(v).hide();
				});
				this.showWhenSet.forEach((v: string): void => {
					$(v).show();
				});
		};
	}
	reset ():void {
				this.state = false;
				this.showWhenSet.forEach((v:string):void =>{
					$(v).hide()
				});
				this.hideWhenSet.forEach((v:string):void =>{
					$(v).show();
				});
	}
	get():boolean {
		return this.state;
	}
}
function doResize(): void {
	// Resizes DOM-tree elements to fit in the current browser window.
	// In effect it is assured that correct vertical sliders are shown.

	// reduce by the padding; it is assumed that only padding-top is set and that it is equal for content and contentWide:
	// consider that there may be no element of type content or contentWide at a given instant.
	// see: https://stackoverflow.com/questions/3437786/get-the-size-of-the-screen-current-web-page-and-browser-window
	let wH = window.innerHeight
		|| document.documentElement.clientHeight
		|| document.body.clientHeight,

		// @ts-ignore . in this case it is defined
		hH = $('#pageHeader').outerHeight(true)
			// @ts-ignore . in this case it is defined
			+ $('.nav-tabs').outerHeight(true),
		pH = wH - hH;
//	console.debug( 'doResize', hH, pH, vP );

	$('.content').outerHeight(pH);
	$('.contentWide').outerHeight(pH);
	$('.pane-tree').outerHeight(pH);
	$('.pane-details').outerHeight(pH);
	$('.pane-filter').outerHeight(pH);

	// adjust the vertical position of the contentActions:
	$('.contentCtrl').css("top", hH);
	/*	return
		
		function getNavbarHeight() {
			return $('#navbar').css("height")
		} */
}
function bindResizer(): void {
	// adapt the display in case the window is being resized:
	$(window).resize(() => {
		//		console.debug('resize'); 
		doResize();
	});
}
