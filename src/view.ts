// @ts-ignore - only one of the files defining SpecifApp will be loaded at runtime
function SpecifApp():IApp {
	"use strict";

	// construct main app:
	var self:any = {};

	// Define the module hierarchy; it will be used to load the modules and to control the views later on:
	self.moduleTree = {
		// Define
		// - name: the modules to load as specified in 'moduleManager.js'
		// - loadAs: name for execution (addressable javascript object)
		// - the hierarchy of views using implicit actions hide/show or refresh
		// - the explicit actions independent of any view

		// Let's start at the top level:
		// no name, thus no additional script file will be loaded at top level
		view: '#app',
		selector: '#pageSelector',			// DOM element to choose the view of a child (top level)
		selectorType: 'btns',
		children: [{
			name: 'profileAnonymous',
			loadAs: 'me'					// the name of the controller object to construct
			// no view
		}, {
			name: 'cache',
			loadAs: 'projects'
			// no view
		}, {
			name: 'importAny',
			// no loadAs, so name will be used for the controller object
			// This is a view of the parent:
			view: '#' + CONFIG.importAny,	// uses implicit actions show/hide
			viewClass: 'contentWide',		// whole width under control of the view
			label: i18n.BtnImport,
			selectedBy: '#selectImport',	// DOM element in parent's selector to choose this view
			// no selector: the children don't have views
			children: [{
				name: 'ioSpecif'
			}, {
				name: 'ioReqif'
			}, {
				name: 'ioArchimate'
				/*	},{
						name: 'ioRdf' */
			}, {
				name: 'ioBpmn'
			}, {
				name: 'ioXls'
			}]
		}, {
			name: CONFIG.specifications,
			loadAs: 'specs',					// the name of the controller object to construct
			// This is a view of the parent:
			view: '#' + CONFIG.specifications,	// uses implicit actions show/hide
			label: i18n.BtnRead,
			selectedBy: '#selectSpecs',			// DOM element in parent's selector to choose this view
			// To control the views of the children:
			selector: '#specsSelector',			// DOM element to choose the view of a child (next level)
			selectorType: 'tabs',
			children: [{
				// nothing to load, code is contained in parent's file
				// Definitions as a view of the parent:
				view: '#' + CONFIG.objectList,	// uses implicit action refresh at parent level
				byDefault: true,				// select this view at the current level, if unspecified
				viewClass: 'content',
				label: i18n.TabDocument,
				selectedBy: '#selectDocument'	// DOM element in parent's selector to choose this view
			}, {
				// nothing to load, code is contained in parent's file
				// Definitions as a view of the parent:
				view: '#' + CONFIG.relations,		// uses implicit action refresh at parent level
				viewClass: 'content',
				label: i18n.TabRelations,
				selectedBy: '#selectStatements',// DOM element in parent's selector to choose this view
				children: [{
					name: 'vicinityGraph'
					// no view
				}]
			}, {
				name: CONFIG.objectFilter,
				// no loadAs, so name will be used for the controller object
				// Definitions as a view of the parent:
				view: '#' + CONFIG.objectFilter,	// uses implicit action refresh at parent level
				viewClass: 'contentWide',		// whole width under control of the view
				label: i18n.TabFilter,
				selectedBy: '#selectFilters'	// DOM element in parent's selector to choose this view
			}, {
				name: CONFIG.reports,
				// no loadAs, so name will be used for the controller object
				// Definitions as a view of the parent:
				view: '#' + CONFIG.reports,		// uses implicit action refresh at parent level
				viewClass: 'contentWide',		// whole width under control of the view
				label: i18n.TabReports,
				selectedBy: '#selectReports'	// DOM element in parent's selector to choose this view
			}]
			/*	},{
					action: 'app.export()',
					label: i18n.BtnExport,
					selectedBy: '#selectExport',		// DOM element in parent's selector to initiate this action
					// no selector: the children don't have views
					children: [{
						name: 'toHtml'
					},{
						name: 'toEpub'
					},{
						name: 'toOxml'
					},{
						name: 'toTurtle'
					}]  */
		}, {
			name: 'about',
			view: '#about',
			viewClass: 'contentWide',			// whole width under control of the view
			label: i18n.IcoAbout,
			selectedBy: '#selectAbout'			// DOM element in parent's selector to choose this view
		}]
	};

	// IE does not support ()=>{..} --> "syntax error" at load time.
	self.init = function (): void {
				
		// must set it here, because the language files must be read first:
		document.title = self.title = i18n.LblReader;
		 
		// React on Browser Back/Forward buttons:
		window.addEventListener("hashchange", self.show );

		moduleManager.load(self.moduleTree, { done: self.login });
	};
	self.login = function ():void {
		console.info(self.title + " " + CONFIG.appVersion + " started!");
		self.me.login()
			.then(
				self.show,
				self.logout
			)
	};
	self.show = function ():void {
		var uP = getUrlParams(), v: string;
		if (!self.projects.selected
			|| !self.projects.selected.isLoaded()
			|| uP[CONFIG.keyProject] && uP[CONFIG.keyProject] != self.projects.selected.id
			|| uP[CONFIG.keyImport] && uP[CONFIG.keyImport].length > 0)
			// - no project is loaded
			// - a project id is found in the URL parameters and it differs from the one of the loaded project
			// - an URL parameter 'import' has been found:
			v = '#' + CONFIG.importAny
		else
			v = '#' + (uP[CONFIG.keyView] || CONFIG.specifications);
		//		console.debug( 'app.show', uP, v );
		moduleManager.show({ view: v, urlParams: uP });
	};
	self.export = function():void {
		if (self[CONFIG.projects].selected && self[CONFIG.projects].selected.isLoaded())
			self[CONFIG.projects].selected.chooseFormatAndExport();
		else
			message.show(i18n.MsgNoProjectLoaded, { severity: 'warning', duration: CONFIG.messageDisplayTimeShort });
	};
/*	self.updateMe = function() {
		self.me.beginUpdate();
	}; */
	self.logout = function() {
		self.me.logout();
		self.hide();
	};
	self.hide = function() {
		// hide the app and show the login dialog:
		// ToDo
	};
	self.init();
	return self;
}
