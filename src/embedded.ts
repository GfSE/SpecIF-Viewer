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
			name: 'ioSpecif'
			// no view
		}, {
			name: CONFIG.specifications,
			loadAs: 'specs',					// the name of the controller object to construct
			// This is a view of the parent:
			view: '#' + CONFIG.specifications,	// uses implicit actions show/hide
			label: i18n.BtnEdit,
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
			}, {
				name: CONFIG.resourceEdit,
				requires: [CONFIG.specifications]	// load not before the specified modules are ready
				// no loadAs, so name will be used for the controller object
				// no view; just a modal dialog will be used
				// no selector
				// The modal dialog will be called by pressing an item action button; 
				//   the function to call is added manually in view 'CONFIG.specifications'.
			}]
		}, {
			action: 'app.export()',
			label: i18n.BtnExport,
			selectedBy: '#selectExport',		// DOM element in parent's selector to initiate this action
			// no selector: the children don't have views
			children: [{
				name: 'toHtml'
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
		document.title = self.title = i18n.LblReviewer;
		self.embedded = true;
		// React on Browser Back/Forward buttons:
		window.addEventListener("hashchange", self.show );

		moduleManager.load(self.moduleTree, { done: self.login });
	};
	self.login = function() {
		console.info(self.title + " " + CONFIG.appVersion + " started!");
		self.me.login()
			.then(
				(me: IMe) => {
					// as long as we don't have a user/identity management,
					// set a default user role for this app;
					// window.role has a value because this is executed as HTML with embedded SpecIF:
					me.projectRoles = [
						{
							project: "any", // default
							role: window.role || "Supplier"
						} as SpecifProjectRole
					];

					// data and type are valid, but it is necessary to indicate that the data is not zipped:
					self.ioSpecif.init({ mediaTypeOf: LIB.attachment2mediaType });
					self.ioSpecif.verify({ name: 'data.specif' });

					self.busy.set();
					// @ts-ignore - 'data' is a global variable with SpecIF-data defined in the html-file generated by 'toHTML()'.
					self.ioSpecif.toSpecif(LIB.str2ab(window.data))
						.done(function (newD: SpecIF) {
							var opts = {
								noCheck: true, // if data is to be checked, make sure to load module 'jsonSchema' during initialization
								deduplicate: false,
								addGlossary: false,
								collectProcesses: false
							};
							self.projects.create(newD, opts)
								.done(function () {
									message.show(i18n.lookup('MsgImportSuccessful', newD.title), { severity: "success", duration: CONFIG.messageDisplayTimeShort });
									setTimeout(
										self.show,
										CONFIG.showTimelag
									);
								})
								.fail(LIB.stdError);
						})
						.fail(LIB.stdError);
				}
			)
			.catch(
				self.logout
			)
	};
	self.show = function () {
		var uP = getUrlParams(), v: string;
		if (!self.projects.selected
			|| !self.projects.selected.isLoaded()
			|| uP[CONFIG.keyProject] && uP[CONFIG.keyProject] != self.projects.selected.id
			|| uP[CONFIG.keyImport] && uP[CONFIG.keyImport].length > 0)
			// - no project is loaded
			// - a project id is found in the URL parameters and it differs from the one of the loaded project
			// - an URL parameter 'import' has been found:
			v = '#' + CONFIG.specifications
		else
			v = '#' + (uP[CONFIG.keyView] || CONFIG.specifications);
//		console.debug( 'app.show', uP, v );
		moduleManager.show({ view: v, urlParams: uP });
	};
	self.export = function () {
		if (self[CONFIG.projects].selected && self[CONFIG.projects].selected.isLoaded())
			self[CONFIG.projects].selected.chooseFormatAndExport();
		else
			message.show(i18n.MsgNoProjectLoaded, { severity: 'warning', duration: CONFIG.messageDisplayTimeShort });
	};
	self.logout = function() {
		self.me.logout();
		self.hide();
	};
	self.hide = function () {
		// not needed in case of embedded SpecIF
	};
	self.init();
	return self;
}
