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
				name: 'ioArchimate'
			}, {
				name: 'ioReqif'
			}, {
				name: 'ioBpmn'
			}, {
				name: 'ioXls'
			}]
		}, {
			name: 'about',
			view: '#about',
			viewClass: 'contentWide',			// whole width under control of the view
			label: i18n.IcoAbout,
			selectedBy: '#selectAbout'			// DOM element in parent's selector to choose this view
		}]
	};

	// IE does not support ()=>{..} --> "syntax error" at load time.
	self.init = function() {
		// must set it here, because the language files must be read first:
		document.title = self.title = "check";

		// React on Browser Back/Forward buttons:
		window.addEventListener("hashchange", self.show );

		moduleManager.load(self.moduleTree, { done: self.login });
	};
	self.login = function () {
		console.info(self.title + " " + CONFIG.appVersion + " started!");
		self.me.read()
		.then(
			self.show,
			self.logout
		);
	};
	self.show = function () {
		var uP = getUrlParams(), v: string;
		if (!self[CONFIG.projects].selected
			|| !self[CONFIG.projects].selected.isLoaded()
			|| uP[CONFIG.keyProject] && uP[CONFIG.keyProject] != self[CONFIG.projects].selected.id
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
	self.export = function (): void {
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
