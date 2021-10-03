
function checkSpecif():IApp {

	// construct main app:
	var self:any = {};
	// IE does not support ()=>{..} --> "syntax error" at load time.
	self.init = function() {
		// must set it here, because the language files must be read first:
		document.title = self.title = "check";
		// Add a global spinner with state control;
		// all actions are deactivated as long as the app is busy.
		// - 'pageActions' are at the top of the page and can be initiated independently of the app's state
		// - 'contentActions' appear on the content pane (the shown tab) depending on the app's state
		// - 'elementActions' apply to a single list entry in the content pane (tab)
		self.busy = new State({
			showWhenSet: ['#spinner'],
			hideWhenSet: ['.pageActions','.contentActions']
		//	hideWhenSet: ['.pageActions','.contentActions','.elementActions']
		});
		// Define the module hierarchy; it will be used to load the modules and to control the views later on:
		let define = {
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
			},{
				name: 'cache'
				// no view
			},{
				name: 'importAny',
				// no loadAs, so name will be used for the controller object
				// This is a view of the parent:
				view: '#import',				// uses implicit actions show/hide
				viewClass: 'contentWide',		// whole width under control of the view
				label: i18n.BtnImport,
				selectedBy: '#selectImport',	// DOM element in parent's selector to choose this view
				// no selector: the children don't have views
				children: [{
					name: 'ioSpecif'
				},{
					name: 'ioArchimate'
				},{
					name: 'ioReqif'
				},{
					name: 'ioBpmn'
				},{
					name: 'ioXls'
				}]
			},{
				name: 'about',
				view: '#about',
				viewClass: 'contentWide',			// whole width under control of the view
				label: i18n.IcoAbout,
				selectedBy: '#selectAbout'			// DOM element in parent's selector to choose this view
			}]
		};

		// React on Browser Back/Forward buttons:
		window.addEventListener("hashchange", self.show );
		// Warn before leaving the page (browser back button or tab deletion ... or outgoing link):
		window.onbeforeunload = function() {
		   return "You are about to leave this application - did you save any changes you made?";
		};

		// Make sure page divs are resized, if the browser window is changed in size:
		bindResizer();

		moduleManager.load(define, { done: self.show });
	};
	self.show = function() {
		console.info( self.title+" started!" );
		self.me.read()
		.then(
			function() {
				var uP = getUrlParams(), v:string;
				if( !self.cache.selectedProject
					|| !self.cache.selectedProject.isLoaded()
					|| uP[CONFIG.keyProject] && uP[CONFIG.keyProject]!=self.cache.selectedProject.data.id
					|| uP[CONFIG.keyImport] && uP[CONFIG.keyImport].length>0 )
					// - no project is loaded
					// - a project id is found in the URL parameters and it differs from the one of the loaded project
					// - an URL parameter 'import' has been found:
					v = '#import'
				else
					v = '#'+ (uP[CONFIG.keyView] || CONFIG.specifications);
//				console.debug( 'app.view', uP, v );
				moduleManager.show({view:v,urlParams:uP});
			},
			self.logout
		);
	};
	self.export = function (): void {
		if (self.cache.selectedProject && self.cache.selectedProject.isLoaded())
			self.cache.selectedProject.chooseFormatAndExport();
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
