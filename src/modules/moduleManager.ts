///////////////////////////////
/*!	A simple module loader and object (singleton) factory.
	When all registered modules are ready, a callback function is executed to start or continue the application.
	Dependencies: jQuery 3.1 and later.
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution!
*/

var browser,
	i18n,
	modules = new function() {
		"use strict";
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

	const self = this;
	let callWhenReady = null;

	self.init = ( initDone, initFail )=>{

		self.registered = [];
		self.ready = [];

		// Identify browser type and load language file:
		browser = new function() {
			var self = this;

			self.language = navigator.language || navigator.userLanguage;
			console.info( "Browser Language is '"+self.language+"'." );

			self.supportsHtml5History = Boolean(window.history && window.history.pushState);
			if( self.supportsHtml5History ) console.info( "Browser supports HTML5 History" );

			self.supportsCORS = $.support.cors;
			if( self.supportsCORS ) console.info( "Browser supports CORS" );

			self.supportsFileAPI = Boolean(window.File && window.FileReader && window.FileList && window.Blob);
		/*	self.supportsHtml5Storage = new function() {
				// see: http://diveintohtml5.info/storage.html
				try {
					return 'sessionStorage' in window && window['sessionStorage'] !== null;
				} catch(e) {
					return false
				}
			};
			if( self.supportsHtml5Storage ) console.info( "Browser supports HTML5 Storage" ); */

			return self
		};
		// init phase 1: Load the javascript routines common to all apps:
		loadH( ['config','bootstrap','i18n'], {done:init2} );
		return

		// init phase 2: the following must be loaded and accessible before any other modules can be loaded:
		function init2() {
//			console.debug('init2',opts);
			let loadL = ['helper','helperTree','tree','stdTypes','bootstrapDialog','mainCSS'];
			if( CONFIG.convertMarkdown ) loadL.push('markdown');
			loadH( loadL, {done:initDone} )
		}
	};
	function register( mod ) {
		// return true, if mod has been successfully registered and is ready to load
		// return false, if mod is already registered and there is no need to load it
		if( self.registered.indexOf(mod)>-1 ) {
			console.warn( "WARNING: Did not reload module '"+mod+"'." );
			return false
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
	self.load = ( tr, opts )=>{
		// tr is a hierarchy of modules, where the top element represents the application itself;
		// only modules with a specified name will be loaded:
		self.tree = tr;
		return loadH( tr, opts )
	};
	self.construct = ( defs, constructorFn )=>{
		// Construct controller and view of a module.
		// This routine is called by the respective module in the code file, once loaded with 'loadH'/'loadM',
		// make sure that 'setReady' is not called in 'loadM', if 'construct' is used.
		// Or, the routine is called explicitly to construct a module without loading a dedicated file.

		// find module by name or by view somewhere in the complete module tree of the app:
		let mo = findM(self.tree,defs.name||defs.view);
		if(!mo) {
			console.error(defs.name? "'"+defs.name+"' is not a defined module name" : "'"+defs.view+"' is not a defined view");
			return null
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
		if( defs.name && self.registered.indexOf(defs.name)>-1 )
			setReady( defs.name )

		// the module will be initialized within setReady() once all modules are loaded.
	};
	self.show = ( params )=>{
		// Show the specified view, which may be located somewhere in the hierarchy;
		// Assuming that it's parent has a viewCtl:
		switch( typeof(params) ) {
			case 'undefined': return null;
			case 'string': params = {newView: params}
		};
//		console.debug('modules.show',params);
		let mo = findM( self.tree, params.newView );
		if( !mo || !mo.parent.viewCtl ) {
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

		function setViewFromRoot( le, pL ) {
			// step up, if there is a parent view:
			if( le.parent.selectedBy ) {
				// all levels get access to the parameters besides newView, if needed:
				let nPL = simpleClone( pL );
				nPL.newView = le.parent.view;
				setViewFromRoot( le.parent, nPL )
			};
			// set this level's view controller to choose the desired view:
			le.parent.viewCtl.show( pL )
		}
		function setViewToLeaf( le, pL ) {
			// step down, if there is a child view:
				function findDefault( vL ) {
					for( var i=vL.length-1; i>-1; i-- ) {
						if( vL[i].isDefault ) return vL[i]
					};
					// in absence of a default view, take the first in the list:
					return vL[0]
				}
			if( le.viewCtl && le.viewCtl.list.length>0 ) {
				let ch = findDefault( le.viewCtl.list ),
					nPL = simpleClone( pL );
				nPL.newView = ch.view;
				le.viewCtl.show( nPL );
				setViewToLeaf( ch, pL )
			}
		}
	};
	self.hide = ()=>{
		// hide all views of the top level:
		self.tree.viewCtl.hide()
	};
	self.isReady = ( mod )=>{
		return self.ready.indexOf( mod ) >-1
	};
	return self

	function initH( h ) {
		// initialize the hierarchy of modules;
		// where h can be a module or an array of modules
		// ... and a module can have children:
			function it(e) {
				if( typeof(e.init)=='function' )
					e.init();
				if( e.children )
					// initialize all the children:
					e.children.forEach( (c)=>{ initH(c) })
			}
		if( h ) {
			if( Array.isArray(h) )
				h.forEach( (e)=>{it(e)} )
			else
				it(h)
		}
	}
	function loadH(h,opts) {
		// load the modules in hierarchy h
		// specified by a name string or an object with property 'name';
		// h can be a single element, a list or a tree.
			function ld(e) {
				// load a module named 'e':
				if( typeof(e)=='string' ) {
					loadM( e );
					return
				};
				// else, the module is described by an object with a property 'name':
				// append the view to the parent view, where
				// - the visibility of the view shall be controlled by the parent's viewCtl
				if( e.view && e.parent ) {
					let c = e.viewClass?'class="'+e.viewClass+'" ':'',
						d = '<div id="'+e.view.substring(1)+'" '+c+' style="display:none;"></div>';
//					console.debug('l.view',e,c,d);
					$(e.parent.view).append(d)
				};
				// load a module in case of elements with a name:
				// (lazy loading is not yet implemented)
				if( e.name && !e.lazy )
					loadM( e.name );
				if( e.children ) {
					// in certain cases prepare for controlling the children's views:
					if( e.selector ) {
//						console.debug('l.selector',e);
						// The element has children and a selector, so add the view controller:
						e.viewCtl = new ViewCtl();

						// ... and create a corresponding visual selector for the children's views,
						// if it has not been defined manually:
//						console.debug('s',e.selector,$(e.selector),$(e.selector).length);
						if( $(e.selector).length<1 ) {
							let s = '';
							switch(e.selectorType) {
								case 'btns':
									s = '<div id="'+e.selector.substring(1)+'" class="btn-group btn-group-md" ></div>';
									break;
							//	case 'tabs':
								default:
									s = '<ul id="'+e.selector.substring(1)+'" role="tablist" class="nav nav-tabs"></ul>'
							};
							$(e.view).append(s);
						};

						// Then care for the entries in the view controller and in the visual selector:
						let id=null, lbl=null;
						e.children.forEach( function(ch) {
							if( ch.view ) {
								if( !ch.selectedBy ) {
									// only one of them is present:
									console.error( "Module '"+ch.name+"' must have both properties 'view' and 'selectedBy' or none." );
									return
								};
								// else, both 'view' and 'selectedBy' are present:

								// Add the child's view to the view controller;
								// the elements of viewCtl are a subset of the elements of children, namely those with a view:
								e.viewCtl.add( ch );

								// Add a view selector element for the child (button resp. tab):
								id = ch.selectedBy.substring(1);	// without '#'
								lbl = ch.label || id;
//								console.debug('e',e,ch,id,lbl);
								switch( e.selectorType ) {
									case 'btns':
										$(e.selector).append(
					'<button id="'+id+'" type="button" class="btn btn-default" onclick="modules.show(\''+ch.view+'\')" >'+lbl+'</button>'
										);
										break;
								//	case 'tabs':
									default:
										$(e.selector).append(
											'<li id="'+id+'" onclick="modules.show(\''+ch.view+'\')"><a>'+lbl+'</a></li>'
										)
								}
							};
							if( ch.action ) {
								if( !ch.selectedBy ) {
									// only one of them is present:
									console.error( "Module '"+ch.name+"' must have both properties 'action' and 'selectedBy' or none." );
									return
								};
								// Add a view selector element for the child (only button is implemented):
								id = ch.selectedBy.substring(1);	// without '#'
								lbl = ch.label || id;
								switch( e.selectorType ) {
									case 'btns':
										$(e.selector).append(
					'<button id="'+id+'" type="button" class="btn btn-default" onclick="'+ch.action+'" >'+lbl+'</button>'
										);
										break;
									default:
										console.error( "Action'"+lbl+"' needs a parent selector of type 'btns'." );
								}
							}
						})
					};
					// finally load all the children, as well:
					e.children.forEach( (c)=>{
											c.parent = e;
											loadH(c)
										})
				}
			}
//		console.debug('loadH',h,opts);

		if( opts&&typeof(opts.done)=="function" )
			callWhenReady = opts.done;

		if( Array.isArray(h) )
			h.forEach( (e)=>{ld(e)} )
		else
			ld(h)
	}
	function findM( tr, key ) {
		// find the module with the given key in the module hierarchy 'tr':
		let m=null;
		if( Array.isArray(tr) ) {
			for( var i=tr.length-1; !m&&i>-1; i-- ) {
				m = find(tr[i])
			}
		} else {
			m = find(tr)
		};
		return m

		function find(e) {
			// by design: name without '#' and view with '#'
			if( e.name==key || e.view==key ) return e;
			if( e.children ) {
				let m = findM(e.children,key);
				if( m ) return m
			};
			return false
		}
	}
	function loadM( mod ) {
		if( register( mod ) ) {
			// Load the module, if registration went well (if it hadn't been registered before):
//			console.debug('loadM',mod);
			switch( mod ) {
				// 3rd party:
				case "bootstrap":			getCss( "https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.4.1/css/bootstrap.min.css" );
											getCss( "https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.4.1/css/bootstrap-theme.min.css" );
											getScript( 'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.4.1/js/bootstrap.min.js' ); return true;
				case "bootstrapDialog":		getCss( "https://cdnjs.cloudflare.com/ajax/libs/bootstrap3-dialog/1.35.4/css/bootstrap-dialog.min.css" );
											getScript( 'https://cdnjs.cloudflare.com/ajax/libs/bootstrap3-dialog/1.35.4/js/bootstrap-dialog.min.js' ); return true;
				case "tree": 				getCss( "https://cdnjs.cloudflare.com/ajax/libs/jqtree/1.4.12/jqtree.css" );
											getScript( 'https://cdnjs.cloudflare.com/ajax/libs/jqtree/1.4.12/tree.jquery.js' ); return true;
				case "fileSaver": 			getScript( 'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.2/FileSaver.min.js' ); return true;
				case "zip": 				getScript( 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.5.0/jszip.min.js' ); return true;
				case "jsonSchema": 			getScript( 'https://cdnjs.cloudflare.com/ajax/libs/ajv/4.11.8/ajv.min.js' ); return true;
				case "excel": 				getScript( 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.16.7/xlsx.full.min.js' ); return true;
				case "bpmnViewer":			getScript( 'https://unpkg.com/bpmn-js@7.2.1/dist/bpmn-viewer.production.min.js' ); return true;
				case "graphViz":	 	//	getCss( "https://cdnjs.cloudflare.com/ajax/libs/vis/4.20.1/vis-network.min.css" );
											getScript( 'https://cdnjs.cloudflare.com/ajax/libs/vis/4.20.1/vis-network.min.js' ); return true;
		//		case "pouchDB":		 		getScript( 'https://unpkg.com/browse/pouchdb@7.2.2/dist/pouchdb.min.js' ); return true;
		//		case "dataTable": 			getCss( "./vendor/assets/stylesheets/jquery.dataTables-1.10.19.min.css" );
		//									getScript('./vendor/assets/javascripts/jquery.dataTables-1.10.19.min.js' ); return true;
		//		case "xhtmlEditor": 		getCss( "./vendor/assets/stylesheets/sceditor-1.5.2.modern.min.css" );
		//									getScript('./vendor/assets/javascripts/jquery.sceditor-1.5.2.xhtml.min.js' ); return true;
		//		case "diff": 				getScript( 'https://cdnjs.cloudflare.com/ajax/libs/diff_match_patch/20121119/diff_match_patch.js' ); return true;
		/*		case "markdown": 			import( 'https://cdn.jsdelivr.net/combine/npm/remarkable@2/dist/esm/index.browser.min.js,npm/remarkable@2/dist/esm/linkify.min.js' )
											.then( (m)=>{ app.markdown = new m.Remarkable('full',{xhtmlOut:true,breaks:true}) });
											return true;  */
				case "markdown": 			getScript( 'https://cdn.jsdelivr.net/npm/markdown-it@11/dist/markdown-it.min.js' )
											.done( ()=>{ app.markdown = window.markdownit({xhtmlOut:true,breaks:true,linkify:false}) });
											return true;

				// libraries:
				case "config": 				getScript( './config/config.js' ); return true;
				case "i18n": 				switch( browser.language.slice(0,2) ) {
												case 'de':  getScript( './config/locales/iLaH-de.i18n.js' )
															.done( ()=>{ i18n = new LanguageTextsDe() }; break;
												case 'fr':  getScript( './config/locales/iLaH-fr.i18n.js' )
															.done( ()=>{ i18n = new LanguageTextsFr() }; break;
												default:	getScript( './config/locales/iLaH-en.i18n.js' )
															.done( ()=>{ i18n = new LanguageTextsEn() }
											};
											return true;
				case "mainCSS":				getCss( "./vendor/assets/stylesheets/SpecIF.default.css"  ); setReady(mod); return true;
				case "stdTypes":			getScript( './modules/stdTypes.js' ); return true;
				case "helper": 				getScript( './modules/helper.js' ); return true;
				case "helperTree": 			getScript( './modules/helperTree.js' ); return true;
				case "cache": 				loadM( 'fileSaver' );
											getScript( './modules/cache.mod.js' ); return true;
				case "profileAnonymous":	getScript( './modules/profileAnonymous.mod.js' ); return true;
		/*		case "profileMe":			$('#'+mod).load( "./modules/profileMe-0.93.1.mod.html", function() {setReady(mod)} ); return true;
				case "user":				$('#'+mod ).load( "./modules/user-0.92.44.mod.html", function() {setReady(mod)} ); return true;
				case "projects":			loadM( 'toEpub' );
											$('#'+mod).load( "./modules/projects-0.93.1.mod.html", function() {setReady(mod)} ); return true; */
				case "toXhtml": 			getScript( './vendor/assets/javascripts/toXhtml.js' ); return true;
				case "toEpub": 				loadM( 'toXhtml' );
											getScript( './vendor/assets/javascripts/toEpub.js' ); return true;
				case "toOxml": 				getScript( './vendor/assets/javascripts/toOxml.js' ); return true;
				case 'bpmn2specif':			getScript( './vendor/assets/javascripts/BPMN2SpecIF.js' ); return true;
				case 'archimate2specif':	getScript( './vendor/assets/javascripts/archimate2SpecIF.js' ); return true;
				case 'checkSpecif':			getScript( 'https://specif.de/v'+app.specifVersion+'/check.js' ); return true;
				case 'statementsGraph': 	loadM( 'graphViz' );
											getScript( './modules/graph.js' ); return true;
		/*		case CONFIG.objectTable:  	loadM( 'dataTable' );
										//	loadM( 'dataTableButtons' );
										//	loadM( 'zip' );  // needed for Excel export
											getScript( "./modules/objectTable-0.93.1.js"); return true; */

				// constructors/modules:
				case "about":				getScript( './modules/about.mod.js' ); return true;
				case 'importAny':			loadM( 'zip' );
											getScript( './modules/importAny.mod.js' ); return true;
				case 'ioSpecif':			loadM( 'jsonSchema' );
											loadM( 'checkSpecif' );
											getScript( './modules/ioSpecif.mod.js' ); return true;
				case 'ioReqif': 			getScript( './modules/ioReqif.mod.js' ); return true;
				case 'ioXls': 				loadM( 'excel' );
											getScript( './modules/ioXls.mod.js' ); return true;
				case 'ioBpmn':				loadM( 'bpmn2specif' );
											loadM( 'bpmnViewer' );
											getScript( './modules/ioBpmn.mod.js' ); return true;
				case 'ioArchimate':			loadM( 'archimate2specif' );
											getScript( './modules/ioArchimate.mod.js' ); return true;
				case "serverPouch": 		loadM( 'pouchDB' );
											getScript( './modules/serverPouch.mod.js' ); return true;

				// CONFIG.project and CONFIG.specifications are mutually exclusive (really true ??):
		/*		case CONFIG.users:		//	loadM( 'mainCSS' );
											$('#'+mod).load( "./modules/users-0.92.41.mod.html", function() {setReady(mod)} ); return true;
				case CONFIG.project:		// if( self.registered.indexOf(CONFIG.specifications)>-1 ) { console.warn( "modules: Modules '"+CONFIG.specifications+"' and '"+mod+"' cannot be used in the same app." ); return false; }
										//	loadM( 'mainCSS' );
										//	loadM( 'cache' );
											loadM( 'stdTypes' );
											$('#'+mod).load( "./modules/project-0.92.45.mod.html", function() {setReady(mod)} ); return true;
		*/
				case CONFIG.specifications: // if( self.registered.indexOf(CONFIG.project)>-1 ) { console.warn( "modules: Modules '"+CONFIG.project+"' and '"+mod+"' cannot be used in the same app." ); return false; }
										//	loadM( 'stdTypes' );
										//	loadM( 'diff' );
											getScript( './modules/specifications.mod.js' ); return true;

				// sub-modules of module 'specifications':
				case CONFIG.reports: 		getScript( './modules/reports.mod.js' ); return true;
				case CONFIG.objectFilter:  	getScript( './modules/filter.mod.js' ); return true;
				case CONFIG.resourceEdit:	// loadM( 'xhtmlEditor' );
											getScript( './modules/resourceEdit.mod.js' ); return true;
				case CONFIG.resourceLink:	getScript( './modules/resourceLink.mod.js' ); return true;
		//		case CONFIG.files: 			getScript( "./modules/files-0.93.1.js"); return true;

				default:					console.warn( "Module loader: Module '"+mod+"' is unknown." ); return false
			}
		};
		return false;

		// Add cache-busting on version-change to all files from this development project,
		// i.e. all those having a relative URL.
		// see: https://curtistimson.co.uk/post/front-end-dev/what-is-cache-busting/
		function getCss( url ) {
			$('head').append( '<link rel="stylesheet" type="text/css" href="'+url+(url.slice(0,4)=='http'? "" : "?"+app.version)+'" />' )
			// Do not call 'setReady', because 'getCss' is almost always called in conjunction 
			// with 'getScript' which is taking care of 'setReady'.
			// Must be called explicitly, if not in conjunction with 'getScript'.
		}
		function getScript( url, options ) {
			// see http://api.jquery.com/jQuery.getScript/
			// Any option may be set by the caller except for dataType and cache:
			options = $.extend( options || {}, {
				dataType: "script",
				cache: true,
				url: url + (url.slice(0,4)=='http'? "" : "?"+app.version)
			});
			// Use $.ajax() with options since it is more flexible than $.getScript:
			if( url.indexOf('.mod.')>0 )
				// 'setReady' is called by 'construct':
				return $.ajax( options )
			else
				// call 'setReady' from here:
				return $.ajax( options ).done( ()=>{setReady(mod)} )
		}
	}
	function setReady( mod ) {
		// Include mod in the 'ready' list, once successfully loaded;
		// Execute 'callWhenReady()', if/when the last registered module is ready.
		if( self.ready.indexOf(mod)<0 ) {
			self.ready.push( mod );
			console.info( mod+" loaded ("+self.ready.length+"/"+self.registered.length+")" )
		} else {
			console.error("Module '"+mod+"' is set 'ready' more than once");
			return null
		};

		if( self.registered.length === self.ready.length ) {
			initH( self.tree );
			console.info( "All "+self.ready.length+" modules loaded --> ready!" );
			try {
				return callWhenReady()  // callback can be null
			} catch(e) {
				return false
			}
		}
	}
	function ViewCtl( viewL ) {
		// Constructor for an object to control the visibility of the DOM-tree elements listed in 'list';
		// the selected view is shown, all others are hidden.
		// ViewCtl can switch pages or tabs, depending on the navigation level:
		var self = this;
		self.selected = {};	// the currently selected view
		self.list = null;	// the list of alternative views under control of the respective object
		self.exists = (v)=>{
			return indexBy(self.list, 'view', v)>-1
		}
		self.init = (vL)=>{
			self.list = vL || [];
			self.list.forEach( (e)=>{$(e).hide()});
			self.selected = {}
		};
		self.add = (v)=>{
			// add the module to the view list of this level:
			self.list.push(v);
			$(v.view).hide()
			// we could add the visual selector, here ... it is now part of loadH.
		};
		self.show = ( params )=>{
			// Select a new view
			// by calling functions 'show'/'hide' in case they are implemented in the respective modules.
			// - simple case: params is a string with the name of the new view.
			// - more powerful: params is an object with the new target view plus optionally content or other parameters
			switch( typeof(params) ) {
				case 'undefined': return null;	// should never be the case.
				case 'string': params = {newView: params}
			};
//			console.debug('ViewCtl.show',self.list,self.selected,params);

		/*	if( self.selected && params.newView==self.selected.view ) {
				// just update the current view:
				if( typeof(params.content)=='string' ) $(self.selected.view).html(params.content);
				return
			};  */
			// else: show params.newView and hide all others:
			let v, s;
			self.list.forEach( (le)=>{
//				console.debug('ViewCtl.show le',le);
				v = $(le.view);			// the view
				s = $(le.selectedBy); 	// the visual selector
				if( params.newView==le.view ) {
//					console.debug('ViewCtl.show: ',le.view,le.selectedBy,v,s);
					self.selected = le;
					// set status of the parent's view selector:
					s.addClass('active');
					// control visibility:
					v.show();
					// usually none or one of the following options are used:
					// a) update the content
					if( typeof(params.content)=='string' ) {
						v.html(params.content);
						return
					};
					// b) initiate the corresponding action implicitly:
					if( typeof(le.show)=='function' ) {
						params.forced = true;	// update the view even if the resource hasn't changed
						le.show( params );
						return
					}
				} else {
//					console.debug('ViewCtl.hide: ',le.view,le.selectedBy,v,s);
					// set status of the parent's view selector:
					s.removeClass('active');
					// control visibility:
					v.hide();
					// initiate the corresponding action implicitly:
					if( typeof(le.hide)=='function' ) {
						le.hide();
						return
					}
				}
			});
			if( typeof(doResize)=='function' ) {
				doResize()
			}
		};
		self.hide = (v)=>{
			if( typeof(v)=='string' && self.exists(v) ) {
				// hide a specific view:
				$(v).hide();
				return
			};
			// else, hide the selected view:
			if( self.selected ) {
//				console.debug( 'hide', self.selected );
				// initiate the corresponding (implicit) action:
				$(self.selected.view).hide();
				// set status of the parent's view selector:
				$(self.selected.selectedBy).removeClass('active');
				self.selected = null
			}
		};
		self.init(viewL);
		return self
	}
};
function State(opt) {
	"use strict";
	// sets and resets some binary state (e.g. 'busy'),
	// hides resp. shows certain DOM elements according to the lists specified.
	var self = this,
		options = opt || {},
		state = false;
	if( !Array.isArray(options.showWhenSet) ) options.showWhenSet = [];
	if( !Array.isArray(options.hideWhenSet) ) options.hideWhenSet = [];
	self.set = ( flag )=>{
		switch( flag ) {
			case false:
				self.reset();
				return;
			case undefined:
			case true:
				state = true;
				options.hideWhenSet.forEach( (e)=>{
					try {
						$(e).hide()
					} catch(e) {}
				});
				options.showWhenSet.forEach( (e)=>{
					try {
						$(e).show()
					} catch(e) {}
				})
		}
	},
	self.reset = ()=>{
				state = false;
				options.showWhenSet.forEach( (e)=>{
					try {
						$(e).hide()
					} catch(e) {}
				})
				options.hideWhenSet.forEach( (e)=>{
					try {
						$(e).show()
					} catch(e) {}
				})
	},
	self.get = ()=>{
		return state
	};
	self.reset();
	return self
}
