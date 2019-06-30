/*	SpecIF View
	Dependencies: jQuery, jqTree, bootstrap
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de            
*/

modules.construct({
	name: 'specifications'
}, function(self) {
	"use strict";
	self.modeStaDel = false;	// controls what the resource links in the statements view will do: jump or delete statement
//	const circle = '<svg width="100" height="100"><circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" /></svg>';
	
	// Permissions for resources and statements:
	self.resCreTypes = [];  // all resource types, of which the user can create new instances. Identifiers are stored, as they are invariant when the cache is updated.
	self.staCreTypes = [];  // all statement types, of which the user can create new instances. Identifiers are stored, as they are invariant when the cache is updated.
	self.staDelTypes = [];  // all statement types, of which the user can delete any instance. Identifiers are stored, as they are invariant when the cache is updated.
	self.resCre = false; 	// controls whether resp. button is enabled; true if the user has permission to create resources of at least one type.
	self.resCln = false;	//  " , true if the user has permission to create a resource like the selected one.
	self.staCre = false;
	self.staDel = false;
	self.filCre = false;
	self.cmtCre = false;
	self.cmtDel = false;
		
	self.resources = new Resources(); 	// flat-listed resources for display, is a small subset of app.cache.resources
//	self.comments = new Resources();  	// flat-listed comments for display
//	self.files = new Files();			// files for display

	// ToDo: There are lots of calls to self.showLeft in refresh() --> redundant ?

	let myName = self.loadAs || self.name,
		myFullName = 'app.'+myName,
		tabsWithLeftPane = [ CONFIG.objectList, CONFIG.objectDetails, 'object', CONFIG.comments, CONFIG.objectRevisions, CONFIG.relations, 'linker' ],
		tabsWithEditActions = [ CONFIG.objectList, CONFIG.objectDetails ];
	// Return 'true', if the tab/view includes the hierarchy tree:
	function isTabWithLeftPanel(tab) { return ( tabsWithLeftPane.indexOf( tab || self.selectedTab() )>-1 ) }

	self.selectedTab = function() {
//		console.debug('selectedTab',self.viewCtl.selected);
		if( self.viewCtl.selected && self.viewCtl.selected.view )
			return self.viewCtl.selected.view.substring(1);
		return null
	};
	self.selectTab = function( newV ) {
//		console.debug('selectTab',self.selectedTab(),newV,isTabWithLeftPanel(newV));
		// skip, if no change:
		if( self.selectedTab()==newV ) return false;	// no change
		// else set new dialog:
		self.resources.init();
		$('#contentActions').empty();
		self.showLeft.set(isTabWithLeftPanel(newV));
		self.showTree.set();
		self.viewCtl.show('#'+newV);
		return true		// changed
	};
	self.showTab = function( newV ) {
		// select the specified tab and refresh the view:
		self.selectTab( newV );
	//	$('#contentNotice').empty();
	//	self.refresh()
	};
	function emptyTab( div ) {
		selectResource( null );
		app.busy.reset();
		// but show the buttons anyways, so the user can create the first resource:
		$( '#contentNotice' ).empty();
		$( '#contentActions' ).html( self.actionBtns() );
		$( '#'+div ).empty()
	}

	// standard module interface:
	self.init = function() {
	//	if( !opts || ( typeof(opts.callback) != "function" ) ) return false;
		// initialize the module:
//		console.debug( 'specs.init', self );
		
		//  Add the left panel for tree or details and the up/down buttons to the DOM:
		let h = '<div class="paneLeft">'
			+		'<div id="hierarchy" class="pane-tree" />'
			+		'<div id="details" class="pane-details" />'
			+	'</div>'
			+	'<div class="contentCtrl" >'
			+		'<div id="navBtns" class="btn-group btn-group-sm" >'
			+			'<button class="btn btn-default" onclick="'+myFullName+'.tree.moveUp()" data-toggle="popover" title="'+i18n.LblPrevious+'" >'+i18n.IcoPrevious+'</button>'
			+			'<button class="btn btn-default" onclick="'+myFullName+'.tree.moveDown()" data-toggle="popover" title="'+i18n.LblNext+'" >'+i18n.IcoNext+'</button>'
			+		'</div>'
			+		'<div id="contentNotice" class="contentNotice" />'
			+		'<div id="contentActions" class="btn-group btn-group-sm contentActions" />'
			+	'</div>';
		if(self.selector)
			$(self.selector).after( h )
		else
			$(self.view).prepend( h );

		// Construct jqTree,
		// holds the hierarchy tree (or outline):
		self.tree = new Tree({
			loc: '#hierarchy',
			dragAndDrop: false,
			events: {
				'select':  
					// when a node is clicked or traversed by up/down keys
					function(event) {  // The clicked node is 'event.node'
						// just update the node handle (don't use self.tree.selectNode() ... no need to update the tree ;-):
//						console.debug('tree.select',event);
						self.tree.selectedNode = event.node;
						document.getElementById(CONFIG.objectList).scrollTop = 0;
						self.refresh()
					},
				'open':
					// when a node is opened, but not when an opened node receives an open command
					function(event) {  // The clicked node is 'event.node', but we don't care
						// refresh is only needed in document view:
						if( self.selectedTab()==CONFIG.objectList ) self.refresh()
					},
				'close':
					// when a node is closed, but not when a closed node receives a close command
					function(event) {  // The clicked node is 'event.node', but we don't care
						// refresh is only needed in document view:
						if( self.selectedTab() == CONFIG.objectList ) self.refresh()
			/*		},
				'move':
					function(event) {
						// event: A node, potentially with children, has been moved by drag'n'drop.
						app.busy.set();
						
							function finishMove() {
								self.tree.numberize();
//								console.debug( self.tree.selectedNode, event.move_info.moved_node );
								self.tree.selectedNode = null;
								self.tree.selectNode( event.move_info.moved_node );
								app.busy.reset()
							}
							function moveNodeInside( movedNd, targetNd ) {
								let rT = self.tree.newIds( movedNd );
//								console.debug( 'insert inside: ', movedNd.name, targetNd.name, rT );
								app.cache.createNode({
									id: rT.id,
									name: rT.name,
									ref: rT.ref,
									children: rT.children,
									parent: targetNd.id || app.cache.selectedHierarchy.id
								})
									.done( finishMove )
									.fail( handleError )
							}
							function moveNodeAfter( movedNd, targetNd ) {
								let rT = self.tree.newIds( movedNd );
//								console.debug( 'insert after: ', movedNd.name, targetNd.name, rT );
								app.cache.createNode({
									id: rT.id,
									name: rT.name,
									ref: rT.ref,
									children: rT.children,
									parent: targetNd.id || app.cache.selectedHierarchy.id,
									predecessor: targetNd.id
								})
									.done( finishMove )
									.fail( handleError )
							}
						
						// 1. Delete the moved node with all its children:
						// ToDo: implement 'app.cache.moveNode()'
						app.cache.deleteNode( {id: event.move_info.moved_node.id} )
							.done( function() {
//								console.debug('delete node done',event)
								// 2. Move the entry including any sub-tree to the new position
								//  - Update the server, where the tree entries get new ids.
								//  - Update the moved tree entries with the new id corresponding with the server.
								let are = /after/,
									ire = /inside/;
								if( are.test(event.move_info.position) ) {
									// (a) event.move_info.position=='position after': 
									//     The node is dropped between two nodes.
									moveNodeAfter( event.move_info.moved_node, event.move_info.target_node )
								} else if( ire.test(event.move_info.position) ) {
									// (b) event.move_info.position=='position inside': 
									//     The node is dropped on a target node without children or before the first node in a folder.
									moveNodeInside( event.move_info.moved_node, event.move_info.target_node )
								} else {
									// (c) event.move_info.position=='position before': 
									//     The node is dropped before the first node in the tree:
									moveNodeInside( event.move_info.moved_node, event.move_info.target_node.parent )
								}
							})
							.fail( handleError );
			*/		}
			}
		});
		// controls whether the left panel with the tree or details is shown or not:
		self.showLeft = new State({
			showWhenSet: ['.paneLeft','.contentCtrl'],
			hideWhenSet: []
		});
		// controls whether the left panel shows tree or details (when showLeft is true):
		self.showTree = new State({
			showWhenSet: ['#hierarchy'],
			hideWhenSet: ['#details']
		});
	//	self.typesComment = null;
	//	self.typesComment = new StdTypes( app.cache, new CommentTypes() );  // types needed for commenting, defined in stdTypes-*.js
	//	self.dmp = new diff_match_patch();	// to compare the revisions and mark changes
		refreshReqCnt = 0;
		
		return true
	};
	self.clear = function() {
		$('#pageTitle').empty();
		selectResource(null);
		self.resources.init();
	//	self.comments.init();
		self.modeStaDel = false;
		self.modeCmtDel = false;
		self.resCreTypes = [];
		self.staCreTypes = [];
		self.staDelTypes = [];
		self.tree.init();
		refreshReqCnt = 0;
		app.cache.clear();
		app.busy.reset()
	//	self.cacheLoaded( false );
	//	if( modules.isReady( CONFIG.objectFilter ) ) filterView.clear();  // clear the filter, if it is loaded.
	};
	// module entry 'self.show()' see further down
	// module exit;
	// called by the modules view management:
	self.hide = function() {
//		console.debug( 'specs.hide' );
		$('#pageTitle').empty();
		app.busy.reset()
	}; 
	self.returnToCaller = function() {
		// is also called by sub-modules, so it must be globally accessible
//		console.debug( 'returnToCaller' );
	//	app.cache.stopAutoLoad();
	//	self.hide();
		self.clear()
		// Todo: jump!
	};
	function handleError(xhr) {
//		console.debug( 'handleError', xhr );
		self.clear();
		switch( xhr.status ) {
			case 0:
			case 200:
			case 201:
				return; // some calls end up in the fail trail, even though all went well.
			default:
				stdError(xhr,self.returnToCaller)
		}
	}

	function selectResource( nd ) {
		setPermissions( nd );   // nd may be null
		if( !nd ) return self.resources.init();
		// Assuming that the resource has been refreshed shortly before selectResource is called:
		var r = itemById( app.cache.resources, nd.ref );
		if( !r ) return self.resources.init();  // this shouldn't ever happen ...
		
		// Must update the selected resource, if it has a different id or if it has been updated:
		r.order = nd.order;
		return self.resources.updateSelected( r )
	}
	function setPermissions( nd ) {
			function noPerms() {
				self.resCln = false;
				self.staCre = false
			}
		if( !nd ) { noPerms(); return };
		
		var r = itemById( app.cache.resources, nd.ref );
		if( r ) {
			// self.resCre is set when objCreTypes are filled ...
			self.resCln = self.resCreTypes.indexOf( r['class'] )>-1;
			// In case of RIF, there is not yet a list of types for instantiation, but give permission to an admin, anyway:
//			self.resCln = ( r && indexById( self.resCreTypes, r['class'] )>-1 || me.iAmAdmin(app.cache) )

			// Set the permissions to enable or disable the create statement buttons;
			// a statement can be created, if the selected resource's type is listed in subjectClasses or objectClasses of any statementClass:
				function mayHaveStatements( selO ) {
//					if( selO ) console.debug( 'selO', selO );
//					console.debug( 'relCreTypes', self.staCreTypes );
					// iterate all statements for which the user has instantiation rights
					var creR = null;  
					self.staCreTypes.forEach( function(sT) {   
						creR = itemById( app.cache.statementClasses, sT );
//						console.debug( 'mayHaveStatements', self.staCreTypes[s], creR, selO['class'] );
						if( 
							// if creation mode is not specified or 'user' is listed, the statement may be applied to this resource:
							( !creR.instantiation || creR.instantiation.indexOf( 'user' )>-1 )
							// if subjectClasses or objectClasses are not specified or the type of the selected resource is listed, the statement may be applied to this resource:
							&& ((!creR.subjectClasses || creR.subjectClasses.indexOf( selO['class'] )>-1 
								|| !creR.objectClasses || creR.objectClasses.indexOf( selO['class'] )>-1 ))
						) return true   // at least one statement is available for this resource for which the user has creation rights
					});
					return false  // no statement is available for this resource for which the user has creation rights
				};
			self.staCre = mayHaveStatements( r )
		} else {
			noPerms()
		}
	}
	function getPermissions() {
		// using the cached allClasses:
		// a) identify the resource and statement types which can be created by the current user:
		self.resCreTypes = [];
		self.staCreTypes = [];
		self.staDelTypes = [];

		app.cache.resourceClasses.forEach( function(rC) {
			// list all resource types, for which the current user has permission to create new instances
			// ... and which allow manual instantiation:
			// store the type's id as it is invariant, when app.cache.allClasses is updated
			if( rC.cre && (!rC.instantiation || rC.instantiation.indexOf('user')>-1) && rC.propertyClasses && rC.propertyClasses.length>0 )
				self.resCreTypes.push( rC.id )
		});
		app.cache.statementClasses.forEach( function(sC) {
			// list all statement types, for which the current user has permission to create new instances:
			// ... and which allow user instantiation:
			// store the type's id as it is invariant, when app.cache.allClasses is updated
			if( sC.cre && (!sC.instantiation || sC.instantiation.indexOf('user')>-1) ) 
				self.staCreTypes.push( sC.id );
			if( sC.del ) 
				self.staDelTypes.push( sC.id );
		});
							
		// b) set the permissions for the edit buttons:
		self.resCre = self.resCreTypes.length>0;
		self.staCre = self.staCreTypes.length>0;
		self.staDel = self.staDelTypes.length>0;
		self.filCre = app.cache.cre;
	//	let cT = itemByName( app.cache.resourceClasses, CONFIG.objTypeComment ),
	//		rT = itemByName( app.cache.statementClasses, CONFIG.relTypeCommentRefersTo );
	//	self.cmtCre = ( self.typesComment && self.typesComment.available() && cT.cre && rT.cre );
	//	self.cmtDel = ( self.typesComment && self.typesComment.available() && cT.del && rT.del )
//		console.debug('permissions',self.resCreTypes,self.staCreTypes,self.staDelTypes)
	}

	self.updateTree = function( spc ) {
		// Load the SpecIF hierarchies to a jqTree,
		// a dialog (tab) with the tree (#hierarchy) must be visible.
		// There are two modes:
		// - 'insert': insert spc at its position by id in the loaded tree, if it is found,
		//   or add it at the end of the hierarchy list, otherwise.
		// - 'replace': replace the current tree with spc
		// - use this function to auto-update the tree in the background.

		// replace or append spc:
	//	let tr = self.tree.get(), // don't ask me why this does not work ..
		let tr = [].concat(self.tree.get()),
			idx = indexById( tr, spc.id );
	//	console.debug('updateTree',tr,idx,Array.isArray(tr));
		if( idx<0 )
			tr.push(toChild(spc))
		else
			tr = tr.splice(idx,1,toChild(spc)); 
	//	tr = [toChild(spc)]; // this works
		
		// load the tree:
		self.tree.saveState();
		self.tree.set(tr);
		self.tree.numberize();
		self.tree.restoreState();
		if( !self.tree.selectedNode ) self.tree.selectFirstNode();
		self.tree.openNode();
		return self.tree.selectedNode;

		// -----------------
		function toChild( iE ) {
			// transform SpecIF hierarchy to jqTree:
			let r = itemById( app.cache.resources, iE.resource );
			var oE = {
				id: iE.id,
				// take the referenced resource's title, replace XML-entities by their UTF-8 character:
				// ToDo!!
				// String.fromCodePoint()
				name: resTitleOf(r), 
				ref: iE.resource.id || iE.resource // for SpecIF 0.11.x and 0.10.x
			};
			oE.children = forAll( iE.nodes, toChild );
		//	if( typeof(iE.upd)=='boolean' ) oE.upd = iE.upd;
			if( iE.revision ) oE.revision = iE.revision;
			oE.changedAt = iE.changedAt;
		//	console.debug( 'toChild', iE,r,oE )
			return oE
		}
	};
	self.loadHierarchy = function( idx ) {
		// load the hierarchy with the index specified
		// and add it to the list of hierarchies:
		
		if( !self.showLeft.get() ) return null;
	/*	if( idx<0 || idx>app.cache.hierarchies.length-1 ) {
			$('#contentNotice').html( '<div class="notice-danger">'+i18n.MsgNoSpec+'</div>' );
			app.busy.reset();
			return null
		};
	*/
		// Get the spec's tree data:
		return app.cache.readContent( 'hierarchy', app.cache.hierarchies[idx], {reload:true} )
			.done(function(rsp) {
//				console.debug('load',rsp);
				self.updateTree( itemById( app.cache.hierarchies, rsp.id ) );
				if( !self.tree.firstNode() ) {
					// Warn, if tree is empty and there are no resource classes for user instantiation:
					if( !self.resCre )
						message.show( i18n.MsgNoObjectTypeForManualCreation, {duration:CONFIG.messageDisplayTimeLong} );
					return
				};
				self.refresh()
			})
			.fail( handleError )
	};

	// The module entry;
	// called by the parent's view controller:
	self.show = function() {
//		console.debug( 'specifications.show', app.cache );

		$('#pageTitle').html( app.cache.title );
		app.busy.set();
	//	$('#contentNotice').html( '<div class="notice-default">'+i18n.MsgInitialLoading+'</div>' );
		$('#contentNotice').empty();
		
		// assure that the page is properly built in all cases:
		self.tree.init();

		getPermissions();
		
 	//	let uP = getUrlParms() );
		let uP = null;
		// show the specified dialog, or the default:
		self.showTab( getDlg( uP ) );   
		
		// assuming that all initializing is completed (project and types are loaded), 
		// get and show the specs:
		if( app.cache.hierarchies && app.cache.hierarchies.length>0 ) {
			// get the hierarchies one by one, so that the first can be shown as quickly as possible;
			// each might be coming from a different source (in future):
			for( var h=0, H=app.cache.hierarchies.length; h<H; h++ ) {
	//			self.loadHierarchy( getSpecIdx( uP ), {id: getRId( uP )} );
				self.loadHierarchy( h );
				// "busy" is reset in showX as called by doRefresh
			};
			// select the specified hierarchy and resource:
	/*		let res = getRId( uP );
			if( res && res.id ) {
				// tree has entries and a known resource is specified: select the first node referencing the resource
//				console.debug('#filled and resource specified',res);
				self.tree.selectNodeByRef( res )
			} else {
				// tree has entries, no or unknown resource specified: select first node
//				console.debug('#filled and no resource specified');
				self.tree.selectFirstNode()
				// changing the tree node triggers an event, by which 'self.refresh' will be called.
			};
			self.tree.openNode( self.tree.selectedNode )
			// opening a tree node triggers an event, by which 'self.refresh' will be called.
	*/	} else {
			// the project has no spec:
			$('#contentNotice').html( '<div class="notice-danger">'+i18n.MsgNoSpec+'</div>' );
			app.busy.reset()
		};
		return

		// -----------------
		// get data from urlP:
		function getSpecIdx( p ) {
			// select the specification/hierarchy:
			if( p && p.sid ) {
				let s = indexById( app.cache.hierarchies, p.sid );
				if( s>-1 ) return s
			};
			if( app.cache.hierarchies.length>0 ) return 0;	// by default, start with the first spec, if it exists
			return -1   
		}
		function getDlg( p ) {
			// select the dialog/view, if specified in the query string:
			if( p && p.dlg && self.viewCtl.exists('#'+p.dlg) )
				return p.dlg;
			// return default dialog, otherwise:
			return CONFIG.specDialogDefault 
		}
		function getRId( p ) {
			// select first node of those specified as query parameter:
			if( p && p.oids && p.oids.length )
				return p.oids[0];
			return undefined
		}
	};

	// Multiple refresh requests in a short time are consolidated to a single refresh at the end.
	// This reduces the server traffic and the screen updates considerably, 
	// for example if the user quickly traverses the tree. 
	// Do finally refresh, if there has been no further request in a certain time period.
	var refreshReqCnt = 0;
	self.refresh = function( params ) {
		// refresh the content, only;
		// primarily provided for showing changes made by this client:
			function tryRefresh() {
				if( --refreshReqCnt<1 ) doRefresh( params )
			}
		refreshReqCnt++;
		setTimeout( tryRefresh, CONFIG.noMultipleRefreshWithin )
	};
	function doRefresh( parms ) {
		// Route execution depending on the current state (selected tab):
		// This routine is called in the following situations:
		// - user clicks in the tree -> update the view only if in a pure view (reading) mode, but not in editing mode
		// - user clicks on a tab -> show the content in view mode 
		// - cache update is signalled -> again, refresh only any content in view mode.
		// --> Don't disturb the user in case of the editing views ('object', 'linker').
//		console.debug('doRefresh',parms,self.selectedTab());

		setContentHeight();
		$('#contentNotice').empty();
		self.showLeft.set( isTabWithLeftPanel( self.selectedTab() ) );
		self.showTree.set();
		
	//	switch( parms && parms.view.substring(1) || self.selectedTab() ) {
		switch( self.selectedTab() ) {
			case CONFIG.objectList:			
				self.showDocument( parms ); // just get some resources beginning with the selected node
				break;
			case CONFIG.relations:			
				self.showStatements( parms );
				break;
/*			case CONFIG.objectDetails:		
				self.showResource( parms );
				break;
			case CONFIG.objectRevisions:	
				self.showRevisions();
				break;
			case CONFIG.comments:			
				self.showComments();
				break;
			case CONFIG.objectTable:		
				$('#contentActions').empty();
				self.showTable();
				break;
			case CONFIG.files:				
				$('#contentActions').empty();
				self.showFiles();
				break;*/
			case CONFIG.objectFilter: 
				self.showFilter( parms );
				break;
			case CONFIG.reports:			
				$( '#contentActions' ).empty();
				self.showReports();
				break;
/*			// these are secondary views and need special handling:
			case 'object':
				$('#contentActions').empty();
				self.views.show('object');
			case 'linker':
				linker.show( self.staCreTypes, self.tree.selectedNode );
//				break;  */
		}
	}
/*	function refreshAll() {
		// refresh tree and content with cached data;
		// primarily for showing changes made by other clients:
//		console.debug( 'refreshAll', app.cache.hierarchies, app.cache.selectedHierarchy );
	//	self.cacheLoaded( true );

		app.cache.selectedHierarchy = itemById( app.cache.hierarchies, app.cache.selectedHierarchy.id )
	//							|| app.cache.hierarchies[0];
		// it is assumed that the cache and the hierarchy have been updated, before:
		self.updateTree( app.cache.selectedHierarchy );  // populate the tree view with new data from the cache.
		self.refresh()		
	}
	self.reload = function() {
		// reload the currently shown resources from the server;
		// care is taken to load the minimum amount of data:
		if( app.cache.selectedHierarchy && self.resources.selected().value && self.resources.selected().value.id ) {
			app.busy.set(); 
			// delete the selected resource from cache to force a reload when refreshing:
			uncacheE( app.cache.resources, self.resources.selected().value );
			app.cache.readContent( 'hierarchy', app.cache.selectedHierarchy, {reload:true} )
				.done( refreshAll )
				.fail( handleError )
		}
	};  */

	self.showDocument = function( opts ) {
		// Show the next resources starting with the selected one:
		
		if( !self.tree.selectedNode ) self.tree.selectFirstNode();
		if( !self.tree.selectedNode ) { emptyTab(CONFIG.objectList); return };  // quit, because the tree is empty

		app.busy.set();
		if( self.resources.values.length<1 )
			$( '#'+CONFIG.objectList ).html( '<div class="notice-default" >'+i18n.MsgLoading+'</div>' );

		var nd = self.tree.selectedNode,
			oL = [],  // id list of the resources to view
			nL = [];  // list of nodes of the hierarchy.
		// lazy loading: only a few resources are loaded from the server starting with the selected node
		// only visible tree nodes are collected in oL (excluding those in closed folders ..), so the main column corresponds with the tree.
		for( var i=0, I=CONFIG.objToGetCount; i<I && nd; i++ ) {
			oL.push({ id: nd.ref });  // nd.ref is the id of a resource to show
			nL.push( nd );
			nd = nd.getNextNode()   // get next visible tree node
		};

		app.cache.readContent( 'resource', oL )
			.done(function(obs) {
				for( var i=0, I=obs.length; i<I; i++) { 
					// Format the titles with numbering:
					obs[i].order = nL[i].order
				};	
				// update the view list, if changed:
				if( self.resources.update( obs ) || opts && opts.forced ) {
					// list value has changed in some way:
					setPermissions( self.tree.selectedNode );  // use the newest revision to get the permissions ...
					$( '#'+CONFIG.objectList ).html( self.resources.render() )
				};
				app.busy.reset();
				$( '#contentActions' ).html( self.actionBtns() )
			})
			.fail( handleError )
	};

/*	self.showResource = function( opts ) {   
		// Display the resource with its properties on a page:
//		console.debug( CONFIG.objectDetails, self.tree.selectedNode, opts );
		if( !self.tree.selectedNode ) self.tree.selectFirstNode();
		if( !self.tree.selectedNode ) { emptyTab(CONFIG.objectDetails); return };  // quit, because the tree is empty

		// else: the tree has entries:
		app.busy.set();
		if( self.resources.values.length<1 )
			$( '#'+CONFIG.objectDetails ).html( '<div class="notice-default" >'+i18n.MsgLoading+'</div>' );
		
		app.cache.readContent( 'resource', { id: self.tree.selectedNode.ref } )
			.done(function() {
				if( selectResource( self.tree.selectedNode ) || opts && opts.forced ) {
					// render anew, if it is a different resource or if it has been updated:
//					console.debug( 'showResource', self.resources.selected() );
					$( '#'+CONFIG.objectDetails ).html( self.resources.selected().details() );
					registerAllClickEls()
				};
				app.busy.reset();	
				$( '#contentActions' ).html( self.actionBtns() )
			})
			.fail( handleError )
	};  */

	function renderStatements() {
		if( self.modeStaDel ) 
			$('#contentNotice').html( '<span class="notice-danger" >'+i18n.MsgClickToDeleteRel+'</span>' )
		else
			$('#contentNotice').html( '<span class="notice-default" >'+i18n.MsgClickToNavigate+'</span>' );

//		console.debug('renderStatements',self.resources.selected());
		let net = self.resources.selected().statements();
		switch( typeof(net) ) {
			case 'string':
				// notice or statements in a table:
				$( '#'+CONFIG.relations ).html( net );
				break;
			case 'object':
				// statements as a SpecIF data-set for graph rendering:
				showStaGraph( net )
		};
		return
		
		function showStaGraph(net) {
			// Show the graph of the statements:
			$( '#'+CONFIG.relations ).html( '<div id="statementGraph" style="width:100%; height: 600px;" />' );
			let options = {
				index: 0,
				canvas:'statementGraph',
				titleProperties: CONFIG.titleProperties,
				onDoubleClick: function( evt ) {
//					console.debug('Double Click on:',evt);
					if( evt.target.resource && (typeof(evt.target.resource)=='string') ) 
						self.relatedItemClicked(evt.target.resource,evt.target.statement);
						// changing the tree node triggers an event, by which 'self.refresh' will be called.
				}
			};
			if( self.modeStaDel )
				options.nodeColor = '#ef9a9a';
//			console.debug('showStaGraph',net,options);
			app.busy.reset();
			statementsGraph.show(net,options)
		}
	}
	self.showStatements = function( opts ) {
		// Show all statements of the selected resource:
//		console.debug( 'statements of', self.tree.selectedNode.name );
		if( !self.tree.selectedNode ) self.tree.selectFirstNode();
		if( !self.tree.selectedNode ) { emptyTab(CONFIG.relations); return };  // quit, because the tree is empty

		// else: the tree has entries:
		app.busy.set();
		if( self.resources.values.length<1 )
			$( '#'+CONFIG.relations ).html( '<div class="notice-default" >'+i18n.MsgLoading+'</div>' );

		var mG = null;
		app.cache.readStatementsOf( {id: self.tree.selectedNode.ref} )
			.done(function(sL) {
				// sL is the list of statements involving the selected resource.
				var relatedObjs = [];
//				console.debug( 'statements', sL );
				// Store all related resources while avoiding duplicate entries:
				sL.forEach( function(s) {
					// skip hidden statements:
					if( CONFIG.hiddenStatements.indexOf( s.title )>-1 ) return;
						
					if( s.subject.id == self.tree.selectedNode.ref ) { 
						// the selected node is a subject, so the related resource is a object:
						if( indexById( relatedObjs, s.object.id )<0 ) 
							//  list the related resource, but only once:
							relatedObjs.unshift( {id: s.object.id} )
					} else {
						// the related resource is a subject:
						if( indexById( relatedObjs, s.subject.id )<0 ) 
							//  list the related resource, but only once:
							relatedObjs.unshift( {id: s.subject.id} )
					}
				});
				// Finally, add the selected resource itself to the list as first element:
				relatedObjs.unshift({id: self.tree.selectedNode.ref});
//				console.debug( 'relatedObjs', relatedObjs );

				// Obtain the titles (labels) of all resources in the list.
				// The titles in the tree don't have the icon, therefore obtain the title from the resources, themselves.
				// Since the resources are cached, this is not too expensive.
				app.cache.readContent( 'resource', relatedObjs )
					.done( function(roL) {   
						// roL is a list of the selected plus it's related resources
						selectResource( self.tree.selectedNode );
						self.resources.selected().staGroups = [];
					
						// For display, sort all statements in groups (=table rows) according to their type and direction;
						// the groups shall be ordered according to the statementClasses, therefore we cycle through the types:
						app.cache.statementClasses.forEach( function(sC) { 
							var rG = { rGs: [], rGt: [] };		// construct a statement group per type
							sL.forEach( function(s) {    // iterate statements
								// skip hidden statements:
								if( CONFIG.hiddenStatements.indexOf( s.title )>-1 ) return;
								// for sorting continue only if the class matches;
								// it assumed that every class appears only once:
								if( s['class'] != sC.id ) return;
							
								// ToDo:
								// this grouping of statements is only needed to show the statementsTable in IE,
								// so move it to renderStatementsTable.
							
								// for every statement type found, make an entry with a subgroup per direction:
								// - rGs contains statements of a given type, where the related resource is a subject
								// - rGt contains statements of a given type, where the related resource is a object
								if((s.subject.id == self.tree.selectedNode.ref) ) { 
									// selected resource, replace cripple by full resource:
									s.subject = roL[0];
									// the related partner, replace cripple by full resource:
									s.object = itemById(roL,s.object.id);
									rG.rGt.push( s )
								} else {
									// similarly in the opposite direction:
									s.subject = itemById(roL,s.subject.id);
									s.object = roL[0];
									rG.rGs.push( s )
								}
							});
							// add the statements for display:
//							console.debug( 'rG', t, rG );
							if( rG.rGs.length || rG.rGt.length) self.resources.selected().staGroups.push( rG )
						});
						// finally add the mentions-Relations:
						// find the 'mentions' statements:
						mG = addMentionsRels();
						if( mG && (mG.rGs.length || mG.rGt.length)) self.resources.selected().staGroups.push( mG )
						app.busy.reset();	
						$( '#contentActions' ).html( self.linkBtns() );
//						console.debug('statement groups',self.resources.selected().staGroups);
						renderStatements()
					})
					.fail( function(xhr) {
						app.busy.reset();	
						switch( xhr.status ) {
							case 404:   // related resource(s) not found, just ignore it
								break;
							default:
								handleError(xhr)
						}
					})
			})
			.fail( handleError )
		return

			function addMentionsRels() {
				// Search all resource text properties and detect where other resource's titles are referenced.
				// Only findings with marks for dynamic linking are taken.
				// Add a statement for each finding for display; do not save any of these statements in the server.
				if( !CONFIG.findMentionedObjects ) return;
				if( !self.tree.selectedNode ) return;
				// take the original (unchanged) resources from cache:
				// First the currently selected resource:
				let sO=itemById( app.cache.resources, self.tree.selectedNode.ref );
				if( !sO ) return;
				// There is no need to have a statementClass .... at least currently:
//				var rT = itemByName( app.cache.statementClasses, 'SpecIF:mentions' );
//				if( !rT ) return;
				
				sO.ti = resTitleOf( sO );
				var rG = { rGs: [], rGt: [] };		// construct a statement group for the new statement type
				// In contrast to the statements collected before, these are not stored in the server.

				let rPatt=null, rStr=null, sT=null,
					// assumption: the dynamic link tokens don't need to be HTML-escaped:
					sPatt = new RegExp( (CONFIG.dynLinkBegin+sO.ti+CONFIG.dynLinkEnd).escapeRE(), "i" );

				// ToDo: Find text references also in other hierarchies.
				app.cache.resources.forEach( function(rO) {
					// The server delivers a tree with nodes referencing only resources for which the user has read permission,
					// so there is no need to check it, here:
					// disregard resources which are not referenced in the current tree:
					if( app[myName].tree.nodesByRef(rO).length<1 ) return;
					rO.ti = resTitleOf( rO );
					if( !rO.ti || rO.ti.length<CONFIG.dynLinkMinLength || rO.id==sO.id ) return;
					
					// 1. The titles of other resource's found in the selected resource's texts 
					//    result in a 'this mentions other' statement (selected resource is subject):
					rStr = (CONFIG.dynLinkBegin+rO.ti+CONFIG.dynLinkEnd).escapeRE();
					rPatt = new RegExp( rStr, "i" );

					sT = itemById( app.cache.resourceClasses, sO['class'] );
					sO.properties.forEach( function(ay) {
						switch( dataTypeOf( app.cache, ay['class'] ).type ) {
							case 'xs:string':
							case 'xhtml':	
								// add, if the iterated resource's title appears in the selected resource's property ..
								// and if it is not yet listed:
								if( rPatt.test( ay.value ) && notListed( rG.rGt,sO,rO ) ) {
									rG.rGt.push( {
										title: 	'SpecIF:mentions',
//										class:	// no class indicates that the statement cannot be deleted
										subject:	sO,
										object:		rO
									} )
									// - rGt contains statements of a given type, where the related resource is a object
								}
						}
					});
					// 2. The selected resource's title found in other resource's texts 
					//    result in a 'other mentions this' statement (selected resource is object):
					sT = itemById( app.cache.resourceClasses, rO['class'] );
					rO.properties.forEach( function(ay) {
						switch( dataTypeOf( app.cache, ay['class'] ).type ) {
							case 'xs:string':
							case 'xhtml':	
								// add, if the selected resource's title appears in the iterated resource's property ..
								// and if it is not yet listed:
								if( sPatt.test( ay.value ) && notListed( rG.rGs,rO,sO ) ) {
									rG.rGs.push( {
										title: 	'SpecIF:mentions',
//										class:	// no class indicates that the statement cannot be deleted
										subject:	rO,
										object:		sO
									} )
									// - rGs contains statements of a given type, where the related resource is a subject
								}
						}
					})
				});
				return rG
			
				function notListed( L,s,t ) {
					for( var i=L.length-1;i>-1;i--  ) {
						if( L[i].subject.id==s.id && L[i].object.id==t.id ) return false
					};
					return true
				}
			}
	};

/*	self.showComments = function( obj ) {
		self.comments.init();

		if( !self.tree.selectedNode ) self.tree.selectFirstNode();
		if( !self.tree.selectedNode ) { emptyTab('comments'); return };  // quit, because the tree is empty

		// else: the tree has entries:
		app.busy.set();
		if( self.comments.values.length<1 )
			$( '#comments' ).html( '<div class="notice-default" >'+i18n.MsgLoading+'</div>' );

		// store the selected resource and set it's permissions:
		selectResource( self.tree.selectedNode );

//		console.debug('showComments',self.tree.selectedNode.ref);
		app.cache.readStatementsOf( {id: self.tree.selectedNode.ref}, true )	// true: show statements with comments
			.done(function(sL) {  // sL is a list of statements between the selected resource and it's comments

					function render() {
						app.busy.reset();	
						$( '#contentActions' ).html( self.cmtBtns() );
						$( '#comments' ).html( self.comments.render() )
					}

				// pick all referencing comments:
				let relatedCmts = [];
				// sequence does not matter, the comments will be sorted before display:
				sL.forEach( function(s) {
//					console.debug('showComments',sL[i].title,CONFIG.relTypeCommentRefersTo);
					if( s.title == CONFIG.relTypeCommentRefersTo 
						&& s.object.id == self.tree.selectedNode.ref ) {  
						// the statement is a reference to a comment, so the subject is a comment; list it:
						relatedCmts.push( {id: s.subject.id} )
					} else {
						// should never arrive here, if the statements are correctly filtered, below
						console.error('ERROR: Inconsistent statements with comments.')  
					}
				});
			
//				console.debug( 'cmt', sL, relatedCmts );
				if( relatedCmts.length>0 ) {
					app.cache.readContent( 'resource', relatedCmts, {reload:true} )
						.done(function(cL) {   // cL is a list of related comments

							// sort the list with descending revision:
							cL.sort(function(laurel, hardy) { return hardy.revision - laurel.revision });

							if( self.comments.update( cL ) ) {
								render()
							}
						})
						.fail( function(xhr) {
							app.busy.reset();	
							switch( xhr.status ) {
								case 404:   // related resource(s) not found, just ignore it
									break;
								default:
									handleError(xhr)
							}
						})
				} else {
					render()
				}
			})
			.fail( handleError )
	};

	self.showRevisions = function( opts ) {
		// Show all revisions of a resource and compare them:
		if( !self.tree.selectedNode ) self.tree.selectFirstNode();
		if( !self.tree.selectedNode ) { emptyTab('revisions'); return };  // quit, because the tree is empty

		// else: the tree has entries:
		app.busy.set();
		if( self.resources.values.length<1 )
			$( '#revisions' ).html( '<div class="notice-default" >'+i18n.MsgLoading+'</div>' );

		var rL = [],  		// temporary list of the revisions to view
			revL = [],
			revCnt = 0,		// revision count
			diffs = [],
			sT=null, dT=null;
		
		// get the resource revisions with properties:
		server.readRevisions('resource',{ id: self.tree.selectedNode.ref })
			.done(function(oL) {
//				console.debug('revisions',oL);
				revCnt = oL.length;
				oL.forEach( function(o) {    // iterate resource revisions, respect the sequence
					// get the resource revisions one by one:
					server.readContent('resource',o)
						.done(function(rev) {
//							console.debug('revisions 2',rev);
							sT = itemById( app.cache.resourceClasses, rev['class'] );
							rev.properties.forEach( function(aV) { 
								// for a property value of type ENUMERATION, replace value-IDs with titles,
								// for all others, let the value unchanged:
								dT = dataTypeOf( app.cache, aV['class'] );
								aV.value = enumValStr( dT, aV )
							});
							// arrange properties in a sequence corresponding to the resourceClass's propertyClasses:
							rev.properties = normalizeProps( sT.propertyClasses, rev.properties );
							revL.push( rev );	// add response=revision to the list of revisions.
							
							// when the last response has been received, do the postprocessing:
							if( revL.length == revCnt ) {
//								console.debug('revisions 3',revL);
								// sort by revision number:
								revL.sort(function(a, b) { return b.revision - a.revision });
								// use the newest revision to get the permissions:
								setPermissions( self.tree.selectedNode );  
								
								// insert the oldest revision as first (and so far only) element of the resource list to show:
								rL.unshift( revL[revCnt-1] );   
								
								let chgO=null, refO= null, chgA=null, a=null;
								// find the differences starting with the first modification 
								// (i.e. the second but last revision):
								for( var r=revCnt-2; r>-1; r-- ) {
									chgO = revL[r];		// changed=newer revision
									refO = revL[r+1];	// reference=older revision

									// clone chgO to leave it unchanged for the next loop:
									let tmpO = {};  // get a new variable for each revision
									tmpO.id = chgO.id;
									tmpO.properties = [];
									tmpO.revision = chgO.revision;
									tmpO['class'] = chgO['class'];
									tmpO.changedAt = chgO.changedAt;
									tmpO.changedBy = chgO.changedBy;
									
									sT = itemById( app.cache.resourceClasses, chgO['class'] );
									for( a=chgO.properties.length-1; a>-1; a--) {
										chgA=chgO.properties[a];
										dT = dataTypeOf( app.cache, chgA['class'] ); // ToDo: knowing the resourceClass of 'obj', this can be made more efficient
										// compare the properties and mark the differences:
										switch( dT.type ) {
											case 'xhtml':
												// Remove the XHTML-tags before comparing:
												chgA.value = chgA.value.stripCtrl();
												diffs = self.dmp.diff_main( refO.properties[a].value.stripHTML(), chgA.value.stripHTML() );
//												diffs = self.dmp.diff_main( refO.properties[a].value, chgA.value );
		//										// Remove object/img-tags before and re-insert after diff ...
		//	let imgL = [];
		//	txt = txt.replace(/<object[^<]+<\/object>|<object[^>]+\/>/g, function($0) {
		//									imgL.push($0);
		//									return 'hoKu§pokus'+(imgL.length-1)+'§'
		//								});
		
		//										diffs = self.dmp.diff_main( fileRef.toGUI( refO.properties[a].value, {rev:refO.revision} ), fileRef.toGUI( chgA.value, {rev:chgO.revision} ) );
		//	txt = txt.replace( /hoKu§pokus([0-9]+)§/g, function( $0, $1 ) { return imgL[$1] });
												break;
											case 'xs:enumeration':
												chgA.value = enumValStr( dT, chgA );		// translate IDs to values
												// no break
											default:
												diffs = self.dmp.diff_main( refO.properties[a].value, chgA.value )
										};
										self.dmp.diff_cleanupSemantic(diffs);
//										console.debug( 'ref: ', refO.properties[a].value, 'chg: ', chgA.value, diffs );
										tmpO.properties[a] = {
//											title: chgA.title, 
											title: chgA.title, 
											class: chgA['class'],
											// Remove the '&para;' which have been added by the diff routine:
//											value: self.dmp.diff_prettyHtml( diffs ).replace( /&para;/g, '' ) 
											value: fileRef.toGUI( self.dmp.diff_prettyHtml( diffs ).replace( /&para;/g, '' ), {rev:chgO.revision} ) 
										}
									};
									rL.unshift( tmpO )   // insert chgO with change marks as first element
								};
//								console.debug( 'revisions', rL );

								if( self.resources.update( rL ) || opts && opts.forced ) {
									$( '#revisions' ).html( self.resources.render() )
								};
								app.busy.reset();
								$( '#contentActions' ).html( self.actionBtns() )
							}
						})
				})
			})
			.fail( handleError )
	};  */

/* +++++++++++++++++++++++++++++++ */                     
//  Functions in sub-modules:
/*	self.showTable = function() {

		// load the table module, if not yet available:
		app.busy.set();
		if( modules.load( CONFIG.objectTable, function() {self.showTable()} ) ) return;  // try again as soon as both modules are loaded.

		objectTable.init( function(){ self.showTab(CONFIG.specDialogDefault) } ); 
		objectTable.show()
	};
	self.showFiles = function() {
		// List all files of the current project:
	
		// load the files module, if not yet available:
		app.busy.set();
		if( modules.load( CONFIG.files, function() {self.showFiles()} ) ) return;  // try again as soon as module is loaded.
		
		myFiles.init( function(){ self.showTab(CONFIG.specDialogDefault) } );  
		myFiles.show()		// for app.cache, of course
	}; */
	self.showFilter = function( filterList ) {
		// All resources as referenced by the tree are batchwise requested from the server. 
		// Objects meeting the filter criteria are displayed.
		// New batches of resources are requested until at least 'CONFIG.objToShowCount' hits are shown or the end of the tree has been reached.
		// The next set of hits is obtained by pressing the 'next' button.

		app.busy.set();
		
		app.filter.init( function(){ self.showTab(CONFIG.specDialogDefault) } );  
		app.filter.show( filterList )
	};	
	self.showReports = function() {
		// Show statistics of the current spec:
	//	console.debug('showReports!');
	
		app.busy.set();

	//	reports.init( function(){ self.showTab(CONFIG.specDialogDefault) } );
		app.reports.init();
		app.reports.show( app.cache )
	};  

/* +++++++++++++++++++++++++++++++                    
	Functions called by GUI events */
/*	self.addLinkClicked = function() {
		// load the linker template:
		// The button to which this function is bound is enabled only if the current user has permission to create statements.
		
		// load the linker module, if not yet available:
		if( modules.load( 'linker', function() {self.addLinkClicked()} ) ) return;  // try again as soon as module is loaded, a WARNING will be logged.

		self.modeStaDel = false;  // when returning, the statement table shan't be in delete mode.
		
	//	$( '#contentActions' ).empty();
		self.selectTab( 'linker' );
	//	self.views.show('linker');

		linker.init( function(){self.showTab(CONFIG.relations)} );  // callback to continue when finished.
		linker.show( self.staCreTypes, self.tree.selectedNode )
	};
	self.editObjClicked = function( mode ) {
		// enter edit mode: load the edit template:
		// The button to which this function is bound is enabled only if the current user has edit permission.

		// load the edit module, if not yet available:
		if( modules.load( 'object', function() {self.editObjClicked( mode )} ) ) return;  // try again as soon as module is loaded.

	//	$( '#contentActions' ).empty();
		var returnTab = self.selectedTab();		// after editing, return to the tab we are coming from
		self.selectTab( 'object' );
	//	self.views.show('object');

		objectEdit.init( function(){self.showTab(returnTab)}, mode );  // callback to continue when finished with editing.
		objectEdit.show( self.resCreTypes )
	};
	self.deleteObject = function() {
		// Delete the selected resource, all tree nodes and their children.
		// very dangerous ....
	}); 
		
	self.deleteNode = function() {
		// Delete the selected node and its children.
		// The resource is just dereferenced, but not deleted, itself.
		function delNd( nd ) {
//			console.info( 'deleting', nd.name );
			// 1. Delete the hierarchy entry with all its children in the cache and server:
			app[myName].tree.selectNode( nd.getNextSibling() );  // select the inserted node, where the current node may have children
			app.cache.deleteContent( 'node', {id: nd.id} )
				.done( function() {
					app[myName].updateTree();
				doRefresh({forced:true})
				})
				.fail( handleError );
			
			// 2. Delete the resource from the cache, so that it is not any more used for dynamic linking
			// - assuming that the resource is referenced only once, which is true in most cases.
			// - However, on next autoload, all referenced resources are updated, so all is again fine, then.
			uncacheE( app.cache.resources, {id:nd.ref} )
		};
		var dlg = new BootstrapDialog({
			title: i18n.MsgConfirm,
			type: BootstrapDialog.TYPE_DANGER,
			size: BootstrapDialog.SIZE_WIDE,
			message: i18n.phrase( 'MsgConfirmObjectDeletion', self.tree.selectedNode.name ),
			buttons: [{
				label: i18n.BtnCancel,
				action: function(thisDlg){ 
					thisDlg.close() 
				}
			},{
				label: i18n.BtnDeleteObjectRef,
				action: function (thisDlg) {
//					console.debug( "Deleting tree object '"+self.tree.selectedNode.name+"'." );
					delNd( self.tree.selectedNode );
					thisDlg.close() 
				}
		//	},{
		//		label: i18n.BtnDeleteObject,
		//		// This button is enabled, if the user has permission to delete the referenced resource,
		//		// and if the resource has no further references in any tree:
		//		cssClass: 'btn-danger'+(self.resources.selected().value.del?'':' disabled'), 
		//		action: function (thisDlg) {
//					console.debug( "Deleting resource '"+self.tree.selectedNode.name+"'." );
		//			delNd( self.tree.selectedNode );
					// ToDo: Delete the resource itself
					// ToDo: Delete all other references
		//			thisDlg.close() 
		//		}
			}]
		})
		.init()
	};  */
		
	self.itemClicked = function( rId ) {
		if( self.selectedTab() == CONFIG.objectRevisions || self.selectedTab() == CONFIG.comments ) return;

		// When a resource is clicked in the list (main row), select it and move it to the top.
		// If it is a resource with children (folder with content), assure it is open.
		// If it is already selected, at the top and open, then close it.
		// So, after first selecting a node, it ends always up open at the top,
		//     with further clicks it toggles between opened and closed.
		self.showTab(CONFIG.objectList);  // itemClicked can be called from the hitlist ..
		if( self.tree.selectedNode.ref != rId ) {
			// different node: select it and open it:
			self.tree.selectNodeByRef( {id:rId} );
			document.getElementById(CONFIG.objectList).scrollTop = 0;
			// changing the tree node triggers an event, by which 'self.refresh' will be called.
			self.tree.openNode( self.tree.selectedNode )
			// opening a node triggers an event, by which 'self.refresh' will be called.
		} else {
			if( self.tree.selectedNode.children.length ) {
				// open the node if closed, close it if open:
				self.tree.toggleNode( self.tree.selectedNode )
				// opening or closing a node triggers an event, by which 'self.refresh' will be called.
			}
		};
	};
	self.relatedItemClicked = function( rId, sId ) {
		// Depending on the delete statement mode ('modeStaDel'), either select the clicked resource or delete the statement.
//		console.debug( 'relatedItemClicked', rId, sId, self.modeStaDel, itemById( app.cache.statements, sId ) );
		if( self.selectedTab()==CONFIG.relations && self.modeStaDel ) {
			// Delete the statement between the selected resource and rId;
			// but delete only a statement which is stored in the server, i.e. if it is cached:
			if( itemById( app.cache.statements, sId ) )
				app.cache.deleteContent( 'statement', {id: sId} )
					.done( self.showStatements )
					.fail( handleError )
		} else { 
			// Jump to resource rId:
		//	self.selectTab( CONFIG.objectList );  
			self.tree.selectNodeByRef( {id: rId} );
			document.getElementById(CONFIG.objectList).scrollTop = 0;
			// changing the tree node triggers an event, by which 'self.refresh' will be called.
		}
	};
/*	self.togglemodeStaDel = function() {
		// self.modeStaDel controls what the resource links in the statement view will do: jump or delete statement
		self.modeStaDel = !self.modeStaDel;  // toggle delete mode for statements
//		console.debug( 'toggle delete statement mode:', self.modeStaDel);
		$( '#contentActions' ).html( self.linkBtns() );
		renderStatements()
	};
	self.addComment = function() {
//		console.debug( 'addComment', self.tree.selectedNode );
		var cT = itemByName( app.cache.resourceClasses, CONFIG.objTypeComment ),
			rT = itemByName( app.cache.statementClasses, CONFIG.relTypeCommentRefersTo );
		if( !cT || !rT ) return null;
		
		var newC = {}, 
			newId = genID('R-');
		app.cache.initResource( cT )
			.done( function(rsp) {
				// returns an initialized resource of the requested type:
				newC = rsp;
				newC.id = newId
			})
			.fail( handleError );
		
		// ToDo: The dialog is hard-coded for the currently defined allClasses for comments (stdTypes-*.js).  Generalize!
		var txtLbl = i18n.lookup( CONFIG.attrTypeText ),
			txtAtT = itemByName( cT.propertyClasses, CONFIG.attrTypeText );
		var dT = itemById( app.cache.dataTypes, txtAtT.dataType );

		var addC = new BootstrapDialog({
			title: i18n.phrase( 'LblAddCommentTo', self.tree.selectedNode.name ),
			type: 'type-success',
			message: function (thisDlg) {
				var form = $('<form id="attrInput" role="form" class="form-horizontal" ></form>');
				form.append( $(textInput( txtLbl, '', 'area' )) );
				return form 
			},
			buttons: [{
				label: i18n.BtnCancel,
				action: function(thisDlg){ thisDlg.close() }
			},{ 	
				label: i18n.BtnSave,
				cssClass: 'btn-success', 
				action: function (thisDlg) {
					// 1. get comment text
					newC.properties[0].value = textValue(txtLbl).substr(0,dT.maxLength);
//					newC.title = ....	// an instance-specific name (or title)

//					console.info( 'saving comment', newC );
					app.cache.createContent( 'resource', newC )
						.done( function(newO) {
							var newR = {
								subject: { id: newId, revision: 0 },
								object: { id: self.tree.selectedNode.ref, revision: 0 },
								class: rT.id,
								title: CONFIG.relTypeCommentRefersTo
//								description: ''
							};
//							console.info( 'saving statement', newR );
							app.cache.createContent( 'statement', newR )
								.done( self.refresh )
								.fail( handleError )
						})
						.fail( handleError )
				
					thisDlg.close()
				}
			}]
		})
		.init()
	};
	self.delComment = function(el) {
//		console.debug('delComment',id);
		app.busy.set();
		var pend=2;
		app.cache.readStatementsOf({id:el})
			.done( function(rL) {
				// delete all statements of the comment - should just be one, currently:
//				console.debug('deleteComment',rL.statements,el);
				app.cache.deleteContent('statement',rL)
					.done( function(dta, textStatus, xhr) { 
						if( --pend<1 ) self.refresh()
					})
					.fail( handleError );
				// and delete the resource, as well:
				app.cache.deleteContent('resource',{id:el})
					.done( function(dta, textStatus, xhr) { 
						if( --pend<1 ) self.refresh()
					})
					.fail( handleError )
			})
	};
*/
	self.actionBtns = function() {
		if( tabsWithEditActions.indexOf( self.selectedTab() )<0 ) return '';

		// rendered buttons:
		var selO = null,
			rB = '';
		if( self.resources.selected() ) selO = self.resources.selected().value;
	/*	if( selO )
			// Create a 'direct link' to the resource (the server renders the resource without client app):
			rB = '<a class="btn btn-link" href="'+CONFIG.serverURL+'/projects/'+app.cache.id+'/specObjects/'+self.resources.selected().value.id+'">'+i18n.LblDirectLink+'</a>';  
	*/	
		// Add the create button depending on the current user's permissions:
		// In order to create a resource, the user needs permission to create one or more resource types PLUS a permission to update the hierarchy:
	//	if( self.resCre && app.cache.selectedHierarchy.upd )
	//		rB += '<button class="btn btn-success" onclick="'+myFullName+'.editObjClicked(\'new\')" data-toggle="popover" title="'+i18n.LblAddObject+'" >'+i18n.IcoAdd+'</button>'
	//	else
			rB += '<button disabled class="btn btn-default" >'+i18n.IcoAdd+'</button>';
			
		if( !selO ) { return( rB )};

			function attrUpd() {
				// check whether at least one property is editable:
				for( var a=selO.properties.length-1;a>-1;a-- ) {
					if( selO.properties[a].upd ) return true   // true, if at least one property is editable
				};
				return false
			}

		// Add the clone, update and delete buttons depending on the current user's permissions:
	//	if( self.resCln && app.cache.selectedHierarchy.upd )
	//		rB += '<button class="btn btn-success" onclick="'+myFullName+'.editObjClicked(\'clone\')" data-toggle="popover" title="'+i18n.LblCloneObject+'" >'+i18n.IcoClone+'</button>';
	//	else
			rB += '<button disabled class="btn btn-default" >'+i18n.IcoClone+'</button>';

		if( attrUpd() )    // relevant is whether at least one property is editable, obj.upd is not of interest here. No hierarchy-related permission needed.
			rB += '<button class="btn btn-default" onclick="'+myFullName+'.editObjClicked(\'update\')" data-toggle="popover" title="'+i18n.LblUpdateObject+'" >'+i18n.IcoUpdate+'</button>';
		else
			rB += '<button disabled class="btn btn-default" >'+i18n.IcoUpdate+'</button>';

		// Add the commenting button, if all needed types are available and if permitted:
		if( self.cmtCre )
			rB += '<button class="btn btn-default" onclick="'+myFullName+'.addComment()" data-toggle="popover" title="'+i18n.LblAddCommentToObject+'" >'+i18n.IcoComment+'</button>';
		else
			rB += '<button disabled class="btn btn-default" >'+i18n.IcoComment+'</button>';

		// The delete button is shown, if a hierarchy entry can be deleted.
		// The confirmation dialog offers the choice to delete the resource as well, if the user has the permission.
	//	if( app.cache.selectedHierarchy.del )
	//		rB += '<button class="btn btn-danger" onclick="'+myFullName+'.deleteNode()" data-toggle="popover" title="'+i18n.LblDeleteObject+'" >'+i18n.IcoDelete+'</button>';
	//	else
			rB += '<button disabled class="btn btn-default" >'+i18n.IcoDelete+'</button>';

		return rB	// return rendered buttons for display
	};
	self.cmtBtns = function() {
		if( !self.selectedTab()==CONFIG.comments || !self.resources.selected().value ) return '';
		// Show the commenting button, if all needed types are available and if permitted:
		if( self.cmtCre )
			return '<button class="btn btn-default" onclick="'+myFullName+'.addComment()" data-toggle="popover" title="'+i18n.LblAddCommentToObject+'" >'+i18n.IcoComment+'</button>';
		else
			return '<button disabled class="btn btn-default" >'+i18n.IcoComment+'</button>'
	};
	self.linkBtns = function() {
		if( !self.selectedTab()==CONFIG.relations || !self.resources.selected().value ) return '';
		if( self.modeStaDel ) return '<div class="btn-group btn-group-sm" ><button class="btn btn-default" onclick="'+myFullName+'.toggleModeRelDel()" >'+i18n.BtnCancel+'</button></div>';

		var rB = '<div class="btn-group btn-group-sm" >';
//		console.debug( 'linkBtns', self.staCre );

		if( self.staCre )
			rB += '<button class="btn btn-success" onclick="'+myFullName+'.addLinkClicked()" data-toggle="popover" title="'+i18n.LblAddRelation+'" >'+i18n.IcoAdd+'</button>'
		else
			rB += '<button disabled class="btn btn-default" >'+i18n.IcoAdd+'</button>';

		// Add the commenting button, if all needed types are available and if permitted:
		if( self.cmtCre )
			rB += '<button class="btn btn-default" onclick="'+myFullName+'.addComment()" data-toggle="popover" title="'+i18n.LblAddCommentToObject+'" >'+i18n.IcoComment+'</button>';
		else
			rB += '<button disabled class="btn btn-default" >'+i18n.IcoComment+'</button>';

		if( self.staDel && self.resources.selected().staGroups.length ) {
			rB += '<button class="btn btn-danger '+(self.modeRelDel?'active':'')+'" onclick="'+myFullName+'.toggleModeRelDel()" data-toggle="popover" title="'+i18n.LblDeleteRelation+'" >'+i18n.IcoDelete+'</button>';
		} else
			rB += '<button disabled class="btn btn-default" >'+i18n.IcoDelete+'</button>';

		return rB+'</div>'	// return rendered buttons for display
	};

	return self
});

RE.titleLink = new RegExp( CONFIG.dynLinkBegin.escapeRE()+'(.+?)'+CONFIG.dynLinkEnd.escapeRE(), 'g' );
function valOf( ob, pV, opts ) {
	"use strict";
	if( opts ) {
		if( typeof(opts.dynLinks)!='boolean' ) 			opts.dynLinks = false;
		if( typeof(opts.clickableElements)!='boolean' ) opts.clickableElements = false
	} else {
		var opts = {
			dynLinks: false,
			clickableElements: false
		}
	};
//	console.debug('valOf',ob,pV,opts);
	let dT = dataTypeOf( app.cache, pV['class'] ); 
	switch( dT.type ) {
		case 'xs:string':
			ct = noCode(pV.value).ctrl2HTML().linkifyURLs();
			ct = titleLinks( ct, opts.dynLinks );
			switch(pV.title) {
				case CONFIG.stereotype: ct = '&#x00ab;'+ct+'&#x00bb;'
			};
			break;
		case 'xhtml':
			var os = {
					rev: ob.revision,
					clickableElements: opts.clickableElements
				},
				ct = fileRef.toGUI( noCode(pV.value), os ).linkifyURLs();
//			console.debug('valOf XHTML',ct);
			ct = titleLinks( ct, opts.dynLinks );
			break;
		case 'xs:date':
			var ct = localDateTime( pV.value );
			break;
		case 'xs:enumeration':
			// usually value has a comma-separated list of value-IDs,
			// but the filter module delivers potentially marked titles in content.
			var ct = enumValStr( dT, pV );		// translate IDs to values, if appropriate
			break;
		default:
			var ct = pV.value
	};
	return ct

	function titleLinks( str, add ) {
		// Transform sub-strings with dynamic linking pattern to internal links.
		// Syntax:
		// - A resource title between CONFIG.dynLinkBegin and CONFIG.dynLinkEnd will be transformed to a link to that resource.
		// - Icons in front of titles are ignored
		// - Titles shorter than 4 characters are ignored
		// - see: https://www.mediawiki.org/wiki/Help:Links

			function lnk(o,t){ 
//				console.debug('lnk',o,t,'app.specs.relatedItemClicked(\''+o.id+'\')');
				return '<a onclick="app.specs.relatedItemClicked(\''+o.id+'\')">'+t+'</a>'
			}				
		
		// in certain situations, remove the dynamic linking pattern from the text:
		if( !CONFIG.dynLinking || !add )
			return str.replace( RE.titleLink, function( $0, $1 ) { return $1 } );
			
	/*	let date1 = new Date();
		let n1 = date1.getTime(); 
	*/
		// else, find all dynamic link patterns in the current property and replace them by a link, if possible:
		let replaced = false;
		do {
			replaced = false;
			str = str.replace( RE.titleLink, 
				function( $0, $1 ) { 
					replaced = true;
					// disregard links being too short:
					if( $1.length<CONFIG.dynLinkMinLength ) return $1;
					let m=$1.toLowerCase(), cO=null, ti=null, target=null, notFound=true;
					// is ti a title of any resource?
					app.specs.tree.iterate( function(nd) {
						cO = itemById( app.cache.resources, nd.ref );
						// avoid self-reflection:
					//	if(ob.id==cO.id) return true;
					//	ti = resTitleOf( cO ).stripHTML();
						ti = resTitleOf( cO );
						// if the dynLink content equals a resource's title, remember the first occurrence:
						if( notFound && ti && m==ti.toLowerCase() ) {
							notFound = false;
							target = cO;
						};
						return notFound // go into depth (return true) only if not yet found
					});
					// replace it with a link in case of a match:
					if( target )
						return lnk(target,$1); 
					// The dynamic link has NOT been matched/replaced, so mark it:
					return '<span style="color:#D82020">'+$1+'</span>'
				}
			)
		} while( replaced );
		return str

	/*	let date2 = new Date();
		let n2 = date2.getTime(); 
		console.info( 'dynamic linking in ', n2-n1,'ms' )
	*/
	}
}
function Resource( obj ) {
	"use strict";
	// for the list view, where title and text are shown in the main column and the others to the right.
	var self = this;
	self.value = null;
	self.resToShow = {title:null,class:null,descriptions:[],other:[]};
	self.staGroups = [];

	self.set = function( res ) { 
		if( res ) {
			if( self.value && self.value.id==res.id && self.value.changedAt==res.changedAt ) {
				// assume that no change has happened:
//				console.debug('object.set: no change');
				return false   // no change
			};
			self.value = res;
			self.resToShow = classifyProps( res, app.cache );
//			console.debug( 'Resource.set', res, self.value, self.resToShow );
			return true			// has changed
		} else {
			if( self.value==null ) return false;	// no change
			self.value = null;
			self.resToShow = {title:null,class:null,descriptions:[],other:[]};
//			console.debug('set new',self.value);
			return true			// has changed
		}
	};

	self.listEntry = function() {
			function showAtt( att ) {
//				console.debug('#att#',att);
				if( CONFIG.overviewHiddenProperties.indexOf( att.title )>-1 ) return false;  // hide, if it is configured in the list
				return (CONFIG.overviewShowEmptyProperties || hasContent(att.value))
			} 
		if( !self.value ) return '<div class="notice-default">'+i18n.MsgNoObject+'</div>';
		// Create HTML for a list entry:
//		console.debug( 'Resource.listEntry', self.value, self.resToShow );
		var rO = '<div class="listEntry">'
			+		'<div class="content-main">';
		
		// 1 Fill the main column:
		// 1.1 The title:
		switch( app.specs.selectedTab() ) {
			case CONFIG.objectList:
				// move item to the top, if the title is clicked:
				rO += '<div onclick="app.specs.itemClicked(\''+self.value.id+'\')">'
					+	renderTitle( self.resToShow, self.value.order )
					+ '</div>';
				break;
			default:
				rO += renderTitle( self.resToShow, self.value.order );
		};
		
		// 1.2 The description properties:
		self.resToShow.descriptions.forEach( function(ai) {
			if( showAtt( ai ) ) {
				var v = [CONFIG.objectList, CONFIG.objectDetails].indexOf(app.specs.selectedTab())>-1,
					os = {
						dynLinks: v,
						clickableElements: v
					};
				rO += '<div class="attribute attribute-wide">'+valOf(self.resToShow,ai,os)+'</div>'
			}
		});
		rO += 	'</div>' +  // end of content-main
				'<div class="content-other">';
		// 2 Add elementActions:
		switch( app.specs.selectedTab() ) {
			case CONFIG.comments:
				rO += 	'<div class="btn-group btn-group-xs" style="margin-top:3px; position:absolute;right:1.6em" >';
				if( self.value.del )
					rO +=	'<button onclick="app.specs.delComment(\''+self.value.id+'\')" class="btn btn-danger" >'+i18n.IcoDelete+'</button>'
			//	else
			//		rO +=	'<button disabled class="btn btn-default btn-xs" >'+i18n.IcoDelete+'</button>';
				rO +=	'</div>'
		//		break;
		//	default:
				// nothing, so far
		};
		// 3 Fill a separate column to the right
		// 3.1 The remaining atts:
		self.resToShow.other.forEach( function( ai ) {
			if( showAtt( ai ) ) {
				rO += attrV( titleOf(ai), valOf(self.resToShow,ai), 'attribute-condensed' )
			}
		});
		// 3.2 The type info:
//		rO += attrV( i18n.lookup("SpecIF:Type"), titleOf( self.resToShow['class'] ), 'attribute-condensed' )
		// 3.3 The change info depending on selectedTab:
		rO += renderChangeInfo( self.value );		
		rO +=   '</div>'	// end of content-other
		+	'</div>';  // end of listEntry
		
		return rO  // return rendered resource for display
	};
/*	self.details = function() {
		if( !self.value ) return '<div class="notice-default">'+i18n.MsgNoObject+'</div>';

		// Create HTML for a detail view:
		// 1 The title:
		var rO = renderTitle( self.resToShow, self.value.order );	
		// 2 The description properties:
		self.resToShow.descriptions.forEach( function(ai) {
//			console.debug('details.descr',ai.value);
			if( hasContent(ai.value) ) {
				var os = {
//						dynLinks: [CONFIG.objectList, CONFIG.objectDetails].indexOf(app.specs.selectedTab())>-1,
						dynLinks: true,
						clickableElements: true
					};
				rO += 	'<div class="attribute attribute-wide">'+valOf(self.resToShow,ai,os)+'</div>'
			}
		});
		// 3 The remaining properties:
		self.resToShow.other.forEach( function( ai ) {
//			console.debug('details.other',ai.value);
			rO += attrV( titleOf(ai), valOf(self.resToShow,ai) )
		});
		// 4 The type info:
		rO += attrV( i18n.lookup("SpecIF:Type"), titleOf( self.resToShow['class'] ) );
		// 5 The change info depending on selectedTab:
		rO += renderChangeInfo( self.value );
//		console.debug( 'Resource.details', self.value, rO );
		return rO  // return rendered resource for display
	};
*/
	//  Create a reduced SpecIF data set for rendering a graph:
	self.statements = function() {
		if( !self.value ) return '<div class="notice-default">'+i18n.MsgNoObject+'</div>';
		if( browser.isIE ) return renderStatementsTable();
		
		// build data set with the selected resource in focus: 
		var net = {
			// here, the icon is transferred in a resourceClass ... like SpecIF:
			resourceClasses: [{
				id:		self.value['class'],
				icon:	self.resToShow['class'].icon
			}],
			resources: [{
				id: 	self.value.id,
				title: 	self.resToShow.title,
				class: self.value['class']
			}],
			statements: []
		};
		
		// add all statements:
		let sGL = self.staGroups, rel= null, rR=null;
		if( sGL.length>0 ) {
			sGL.forEach( function(sG) {
				// each statement group, where the selected resource is the object:
				sG.rGs.forEach( function(s) {
					rR = s.subject;
					// add each statement:
//					console.debug('s',s,titleOf(s));
					net.statements.push({
						title:		titleOf(s),	// translated
						id:			s.id,
						subject:	rR.id,
						object:		self.value.id
					});
					// add related resource:
					if( indexById( net.resources, rR.id )<0 )    // avoid duplication 
						// here, the icon is added to the string right away and there is no need to supply the resourceType:
						net.resources.push({
							id: 	rR.id,
							title: 	elementTitleWithIcon(rR)
/*							title: 	resTitleOf(rR),
							class: rR['class']
						});
					// add its resourceClass:
					if( indexById( net.resourceClasses, rR['class'] )<0 )    // avoid duplication 
						net.resourceClasses.push({
							id: 	rR['class'],
							icon: 	itemById( app.cache.resourceClasses, rR['class'] ).icon
*/						})
				});
				sG.rGt.forEach( function(s) {
					rR = s.object;
					// add each statement:
//					console.debug('s',s,titleOf(s));
					net.statements.push({
						title:		titleOf(s),	// translated
						id:			s.id,
						subject:	self.value.id,
						object:		rR.id
					});
					// add related resource:
					if( indexById( net.resources, rR.id )<0 )    // avoid duplication 
						net.resources.push({
							id: 	rR.id,
							title: 	elementTitleWithIcon(rR)
						})
				})
			});
//			console.debug('statements to render',net);
			return net
		} else {
			return '<div class="notice-default">'+i18n.MsgNoRelatedObjects+'</div>'
		}

		function renderStatementsTable() {
			// Render a table with all statements grouped by type:
			if( !self.value ) return '<div class="notice-default">'+i18n.MsgNoObject+'</div>';

//			console.debug( 'Resource.statements', self.value );
			let sGL = self.staGroups;
			// ToDo: The 'mentions' statements shall not be for deletion, and not appear to be for deletion (in red)
			if( app.specs.modeRelDel ) 
				var rT = '<div style="color: #D82020;" >'  // render table with the resource's statements in delete mode
			else
				var rT = '<div>';  // render table with the resource's statements in display mode
			rT += renderTitle( self.resToShow, self.value.order );	// rendered statements
			if( sGL.length>0 ) {
//				console.debug( sGL.length, sGL );
				if( app.specs.modeRelDel ) 
					rT += '<div class="notice-danger" style="margin-bottom:0.4em" >'+i18n.MsgClickToDeleteRel+'</div>';
				rT += '<table id="relationsTable" class="table table-condensed listEntry" ><tbody>';
				let relG=null;
				sGL.forEach( function(sG) {
					if( sG.rGs.length ) {
						// Show a table row with a group of statements where the selected resource is the object.
						// First, get the relevant properties and get the title of the related subject (subject object), in particular:
						relG=[];
						sG.rGs.forEach( function(r) {
							relG.push({
								id: r.id,
								tId: r.object.id,
								tT: elementTitleWithIcon(r.object),
								computed: !r['class']
							});
						});
						// Then, sort the statements by title of the subject in descending order, as the loop further down iterates backwards:
						relG.sort( function(fix, foxi) { 
										fix = fix.sT.toLowerCase();
										foxi = foxi.sT.toLowerCase();
										return fix==foxi ? 0 : (fix>foxi ? -1 : 1) 
						});
						rT += '<tr><td>';
						// The list of subject resources:
						relG.forEach( function(sc) {
							// Do not linkify, if the statement cannot be deleted (since it is not stored in the server).
							if( app.specs.modeRelDel && sc.computed )
								rT += sc.sT+'<br />'
							else
								rT += '<a onclick="app.specs.relatedItemClicked(\''+sc.sId+'\', \''+sc.id+'\')">'+sc.sT+'</a><br />'
						});
						// Title and object are the same for all statements in this list:
						rT += '</td><td style="vertical-align: middle"><i>'+resTitleOf(sG.rGs[0])+'</i></td>';
						rT += '<td style="vertical-align: middle"><span>'+elementTitleWithIcon(sG.rGs[0].object)+'</span></td></tr>'
					};
					if( sG.rGt.length ) {
						// Show a table row with a group of statements where the selected resource is the subject (subject).
						// First, get the relevant properties and get the title of the related object, in particular:
						relG=[];
						sG.rGt.forEach( function(r) {
							relG.push({
								id: r.id,
								tId: r.object.id,
								tT: elementTitleWithIcon(r.object),
								computed: !r['class']
							});
						});
						// Then, sort the statements by title of the object title in descending order, as the loop further down iterates backwards:
						relG.sort( function(dick, doof) { 
										dick = dick.tT.toLowerCase();
										doof = doof.tT.toLowerCase();
										return dick==doof?0:(dick>doof?-1:1) 
						});
						// Title and subject are the same for all statements in this list:
						rT += '<tr><td style="vertical-align: middle"><span>'+elementTitleWithIcon(sG.rGt[0].subject)+'</span></td>';
						rT += '<td style="vertical-align: middle"><i>'+resTitleOf(sG.rGt[0])+'</i></td><td>';
						// The list of resources:
						relG.forEach( function(tg) {
							if( app.specs.modeRelDel && tg.computed )
								rT += tg.tT+'<br />'
							else
								rT += '<a onclick="app.specs.relatedItemClicked(\''+tg.tId+'\', \''+tg.id+'\')">'+tg.tT+'</a><br />'
						});
						rT += '</td></tr>'
					}
				});
				rT += 	'</tbody></table>';
				if( app.specs.modeRelDel ) 
					rT += '<div class="doneBtns"><button class="btn btn-default btn-sm" onclick="app.specs.toggleModeRelDel()" >'+i18n.BtnCancel+'</button></div>'
			} else {
				rT += '<div class="notice-default">'+i18n.MsgNoRelatedObjects+'</div>'
			};
			rT += '</div>';
			return rT  // return rendered statement table for display
		}
	};
	function renderTitle( clAtts, ord ) {
		if( !clAtts.title ) return '';
		if( self.resToShow['class'].isHeading ) 
			// it is assumed that a heading never has an icon:
			return '<div class="chapterTitle" >'+(ord?ord+'&#xa0;':'')+clAtts.title+'</div>';
		// else: is not a heading:
		// take title and add icon, if configured:
		return '<div class="objectTitle" >'+(CONFIG.addIconToInstance?clAtts.title.addIcon(clAtts['class'].icon):clAtts.title)+'</div>'
	}
	function renderChangeInfo( ob ) {
		if( !ob || !ob.revision ) return '';  // the view may be faster than the data, so avoid an error
		var rChI = '';
		switch( app.specs.selectedTab() ) {
			case CONFIG.objectRevisions: 
				rChI = 	attrV( i18n.LblRevision, ob.revision.toString(), 'attribute-condensed' );
				// no break
			case CONFIG.comments: 
				rChI += attrV( i18n.LblModifiedAt, localDateTime(ob.changedAt), 'attribute-condensed' ) +
						attrV( i18n.LblModifiedBy, ob.changedBy, 'attribute-condensed' )
		};
		return rChI
	}

	// initialize:
	self.set( obj );
	return self
}
function Resources() {
	"use strict";
	var self = this;

	self.init = function() { 
		self.values = [] 
	};
	self.push = function( el ) {
		// append a resource to the list:
		self.values.push( new Resource( el ) );
		return true  // a change has been effected
	};
	self.append = function( oL ) {
		// append a list of resources:
		oL.forEach( function(o) { 
			self.values.push( new Resource( o ) )
		})
	};
	self.update = function( oL ) {
		// update self.values with oL and return 'true' if a change has been effected:
		if( oL.length==self.values.length ) {
			// there is a chance no change is necessary:
			var chg=false;
			for( var i=oL.length-1;i>-1;i-- ) 
				// set() must be on the left, so that it is executed for every list item:
				chg = self.values[i].set( oL[i] ) || chg;
			return chg
		} else {
			// there will be a change anyways:
			self.init();
			self.append( oL );
			return true
		}
	};
	self.updateSelected = function( o ) {
		// update the first element (= selected resource), if it exists, or create it;
		// return 'true' if a change has been effected:
		if( self.values.length>0 )
			return self.values[0].set( o )
		else
			return self.push( o )
	};
	self.selected = function() {
		// return the selected resource; it is the first in the list by design:
		return self.values[0]
	};
	self.exists = function( rId ) {
		for( var i=self.values.length-1; i>-1; i-- )
			if( self.values[i].value.id==rId ) return true;
		return false
	};
	self.render = function() {
		// generate HTML representing the resource list:
		if( !self.values.length )
			return '<div class="notice-default" >'+i18n.MsgNoMatchingObjects+'</div>';
		// else:
		var rL = '';	
		// render list of resources
		self.values.forEach( function(v) {
			rL += v.listEntry()
		});
		return rL	// return rendered resource list
	};

	// initialize:
	self.init();
	return self
}
var fileRef = {
/*	All sample data (except ProSTEP) taken from a JSON response of the ReqIF Server.

	Attention: The html-sanitizing in the xhtml-Editor (SCEditor) 
	- removes resources, which have only properties and do not have a value:
		<object data=\"path/filename.ext\" type=\"...\">
			<object data=\"path/filename.ext\" type=\"..\">Content</object>
		</object>	
	- renames any 'name'-property in resources to an 'id'-property
	
	Known limitation: if there are two references of the same image on a page, only the first is shown,
	because the id of the image container is made from the image file name.
*/
	toGUI: function( txt, opts ) {
		if( opts ) {
			if( opts.projId==undefined ) opts.projId = app.cache.id;
			if( opts.rev==undefined ) opts.rev = 0;
			if( opts.clickableElements==undefined ) opts.clickableElements = false
		} else {
			var opts = {
				projId: app.cache.id,
				rev: 0,
				clickableElements: false
			}
		};
		
/*			function addFilePath( u ) {
				if( /^https?:\/\/|^mailto:/i.test( u ) ) {
					// don't change an external link starting with 'http://', 'https://' or 'mailto:'
//					console.debug('addFilePath no change',u);
					return u  		
				};
				// else, add relative path:
//				console.debug('addFilepath', u );
//				console.debug('addFilepath',itemById( app.cache.files, u ));
				return URL.createObjectURL( itemById( app.cache.files, u ).blob )
			}
*/			function getType( str ) {
				var t = /(type="[^"]+")/.exec( str );
				if( t==null ) return '';
				return (' '+t[1])
			}
			function getStyle( str ) {
				var s = /(style="[^"]+")/.exec( str );
				if( s==null ) return '';  
				return (' '+s[1])
			}
			function getUrl( str ) {
				// get the URL:
				var l = /data="([^"]+)"/.exec( str );  // url in l[1]
				// return null, because an URL is expected in any case:
				if( l == null ) { return null };    
				return l[1].replace('\\','/')
			}
			function getPrp( pnm, str ) {
				// get the value of XHTML property 'pnm':
				let re = new RegExp( pnm+'="([^"]+)"', '' ),
					l = re.exec(str);
				if( l == null ) { return undefined }; 
				return l[1]
			}

		// Prepare a file reference for viewing and editing:
//		console.debug('toGUI 0: ', txt);
		var repSts = [];   // a temporary store for replacement strings
			
		// 1. transform two nested objects to link+object resp. link+image:
		txt = txt.replace( RE.tagNestedObjects,   
			function( $0, $1, $2, $3, $4 ) {        // description is $4
				var u1 = getUrl( $1 ),  			// the primary file
					t1 = getType( $1 ); 
				var u2 = getUrl( $2 ), 				// the preview image
					t2 = getType( $2 ), 
					s2 = getStyle( $2 ); 

				// If there is no description, use the name of the link object:
				if( !$4 ) {
					$4 = u1   // $4 is now the description between object tags
				};
//				console.debug('fileRef.toGUI 1 found: ', $0, $4, u1, t1, u2, t2 );
//				u1 = addFilePath(u1);
//				u2 = addFilePath(u2);
				if( !u2 ) console.info('no image found');

				// all of the following work to a certain extent:
				//   <a></a> for downloading the OLE, 
				//   <object>text</object> allows to obtain the text as part of value after HTMLstrip (e.g. in search of a somewhat meaningful title)
				//   Note that IE displays the object tag only in case of SVG and PNG; the latter is used with DOORS OLE-Objects.

/*				if( opts.clickableElements )
					repSts.push( '<div class="forImage"><a href="'+u1+'"'+t1+' ><object data="'+u2+'"'+t2+s2+' >'+$4+'</object></a></div>' )
				else
					repSts.push( '<div class="forImage"><a href="'+u1+'"'+t1+' ><img src="'+u2+'"'+t2+s2+' alt="'+$4+'" /></a></div>' );
				// avoid that a pattern is processed twice: insert a placeholder and replace it with the prepared string at the end ...

				repSts.push( '<div class="forImage"><a href="'+u1+'"'+t1+' ><img src="'+u2+'"'+t2+s2+' alt="'+$4+'" /></a></div>' );  // works.
*/ 
				let f = itemByTitle(app.cache.files,u2);
//				console.debug('fileRef.toGUI 1a found: ', f );
				if( f.blob ) {
//					console.debug('containerId',containerId(u2));
					repSts.push( '<div id="'+containerId(u2)+'" class="forImage"></div>' );
					showImg( f, opts );
					return 'aBra§kadabra'+(repSts.length-1)+'§'
				} else {
					return '<div class="notice-danger" >Image missing: '+u2+'</div>'
				}
			}
		);
//		console.debug('fileRef.toGUI 1: ', txt);
			
		// 2. transform a single object to link+object resp. link+image:
		txt = txt.replace( RE.tagSingleObject,   //  comprehensive tag or tag pair
			function( $0, $1, $2, $3 ){ 
//				var pairedImgExists = function( url ) {
//					// ToDo: check actually ...
//					return true
//				};

				let u1 = getUrl( $1 ), 
					t1 = getType( $1 ), 
					s1 = getStyle( $1 );

				let e = u1.fileExt();
				if( e==null ) return $0;

				// $3 is the description between the tags <object></object>:
				let d = $3 || u1,
					hasImg = false;
				e = e.toLowerCase();
//				console.debug('fileRef.toGUI 2 found: ', $0, u1, t1, s1, d, e );
//				u1 = addFilePath(u1);
				if( !u1 ) console.info('no image found');
					
				if( CONFIG.imgExtensions.indexOf( e )>-1 || e=='bpmn' ) {  
					// it is an image, show it:
/*					if( opts.clickableElements && ( !browser.isIE || ( e=='svg' || e=='png' ) && browser.displaysObjects ) ) {  
						// For Firefox, Chrome. And for IE10+, if and only if the object is PNG or SVG.
						// Only an <object ..> allows for clicking on svg diagram elements with embedded links:
						d = '<object data="'+u1+'"'+t1+s1+' >'+d+'</object>'
					} else {
						// IE only displays images of type SVG and PNG with an <object> tag, so the others will be rendered with an <img> tag.
						// In case of IE9 prohibit that svg diagram elements can be clicked.
						//   For the time being, the click is handled via URL with hash parameters and with IE9 there is no chance to modify the browser history (=URL).
						//   As soon as the clicks are handled internally, also a clickable svg (via <object ..> can be presented to IE9, as well.
						d = '<img src="'+u1+'"'+t1+s1+' alt="'+d+'" />'
					}
*/				
					let f = itemByTitle(app.cache.files,u1);
//					console.debug('fileRef.toGUI 2a found: ', f, u1 );
					if( f.blob ) {
						hasImg = true;
						d = '<div id="'+containerId(u1)+'" class="forImage"></div>';
						showImg( f, opts );
					} else {
						d = '<div class="notice-danger" >Image missing: '+d+'</div>'
					}
				} else {
					if( CONFIG.officeExtensions.indexOf( e )>-1 ) {  
						// it is an office file, show an icon plus filename:
						hasImg = true;
						d = '<img src="'+CONFIG.imgURL+'/'+e+'-icon.png" type="image/png" alt="'+d+'" />'
					} else {
						switch( e ) { 
							case 'ole': 
								// It is an ole-file, so add a preview image;
								// in case there is no preview image, the browser will display d holding the description
								// IE: works, if preview is PNG, but a JPG is not displayed (perhaps because of wrong type ...)
								// 		But in case of IE it appears that even with correct type a JPG is not shown by an <object> tag
								// ToDo: Check if there *is* a preview image and which type it has, use an <img> tag.
								hasImg = true;
							//	d = '<object data="'+u1.fileName()+'.png" type="image/png" >'+d+'</object>';
								d = '<img src="'+u1.fileName()+'.png" type="image/png" alt="'+d+'" />';
								break;
						//	case 'bpmn':
						//		break;
							default:
								// last resort is to take the filename:
								d = '<span>'+d+'</span>'  
						}
					}
				};
					
				// finally add the link and an enclosing div for the formatting:
//				return ('<div class="forImage"><a href="'+u1+'"'+t1+' >'+d+'</a></div>')

				// avoid that a pattern is processed twice.
				// insert a placeholder and replace it with the prepared string at the end ...
				if( hasImg )
//					repSts.push( '<div class="forImage"><a href="'+u1+'"'+t1+' >'+d+'</a></div>' )
					repSts.push( d )
				else
					repSts.push( '<a href="'+u1+'"'+t1+' >'+d+'</a>' );
				
				return 'aBra§kadabra'+(repSts.length-1)+'§'
			}
		);	
//		console.debug('fileRef.toGUI 2: ', txt);
				
		// 3. process a single link:
		// add an icon to known office files.
		txt = txt.replace( RE.tagA,  
			function( $0, $1, $2 ){ 
				var u1 = getPrp( 'href', $1 ),
					e = u1.fileExt();
//				console.debug( $1, $2, u1, e );
				if( e==null ) return $0     // no change, if no extension found
//				if( /(<object|<img)/g.test( $2 ) ) return $0;		// no change, if an embedded object or image
				if( CONFIG.officeExtensions.indexOf( e.toLowerCase() )<0 ) return $0;	// no change, if not an office file

				var t1 = getType( $1 ); 
				if( !$2 ) {
					var d = u1.split('/');  // the last element is a filename with extension
					$2 = d[d.length-1]   // $2 is now the filename with extension
				};
//				u1 = addFilePath(u1);

				// it is an office file, add an icon:
				e = '<img src="'+CONFIG.imgURL+'/'+e+'-icon.png" type="image/png" />'
					
				// finally add the link and an enclosing div for the formatting:
				return ('<div class="forImage"><a href="'+u1+'"'+t1+' >'+e+'</a></div>')
			}
		);	
//		console.debug('fileRef.toGUI 3: ', txt);

		// Now, at the end, replace the placeholders with the respective strings,
		txt = txt.replace( /aBra§kadabra([0-9]+)§/g,  
			function( $0, $1 ) { 
				return repSts[$1]
			});
//		console.debug('fileRef.toGUI result: ', txt);
		return txt

		function showImg(f, opts) {
			if( typeof(opts)!='object' ) 
				opts = {};

//			console.debug('showImg',f,opts);
		//	if( !f ) 
		//		return;
			if( !f.blob ) {
				document.getElementById(containerId(f.title)).innerHTML = '<div class="notice-danger" >Image missing: '+f.title+'</div>';
				return
			};
			// ToDo: in case of a server, the blob itself must be fetched first (the SpecIF file list just has meta-data)
			
			switch( f.type ) {
				case 'image/png':
				case 'image/x-png':
				case 'image/jpeg':
				case 'image/jpg':
				case 'image/gif':
					// reference the original list item, which has the blob and other properties:
					showRaster( f, {timelag:CONFIG.imageRenderingTimelag} );
					break;
				case 'image/svg+xml':
					opts.timelag = CONFIG.imageRenderingTimelag;
					showSvg( f, opts );
					break;
				case 'application/bpmn+xml':
					showBpmn( f, {timelag:CONFIG.imageRenderingTimelag} );
			};
			return

				function showRaster(f,opts) {
					// Attention: the element with id 'f.id' has not yet been added to the DOM when execution arrives here;
					// increase the timelag between building the DOM and rendering the images, if necessary.
					const reader = new FileReader();
					reader.addEventListener('loadend', function(e) {
//						console.debug('showImg',e.target.result);
						// add image to DOM using an image-tag with data-URI.
						// set a grey background color for images with transparency:
						document.getElementById(containerId(f.title)).innerHTML = '<img src="'+e.target.result+'" type="'+f.type+'" alt="'+f.title+'" style="background-color:#DDD;"/>'
					});
					// load the raster image:
					if( opts && typeof(opts.timelag)=='number' && opts.timelag>0 )
						setTimeout(function() {
							reader.readAsDataURL(f.blob)
						}, opts.timelag )
					else
						reader.readAsDataURL(f.blob)
				}
				function showSvg(f,opts) {
					// Load pixel images embedded in SVG,
					// see: https://stackoverflow.com/questions/6249664/does-svg-support-embedding-of-bitmap-images
					// view-source:https://dev.w3.org/SVG/profiles/1.1F2/test/svg/struct-image-04-t.svg
					let svg = {},		// the SVG image with or without embedded images
						dataURLs = [],	// list of embedded images
						// RegExp for embedded images,
						// e.g. in ARCWAY-generated SVGs: <image x="254.6" y="45.3" width="5.4" height="5.9" xlink:href="name.png"/>
						rE = /(<image .* xlink:href=\")(.+)(\".*\/>)/g,
						pend = 0;		// the count of embedded images waiting for transformation
						
						function toDataURL(file,fn) {
							const reader = new FileReader();
							reader.addEventListener('loadend', function(e) { fn(file.title,e.target.result) });
							reader.readAsDataURL(file.blob)
						} 
					
					// Attention: the element with id 'f.id' has not yet been added to the DOM when execution arrives here;
					// increase the timelag between building the DOM and rendering the images, if necessary.
//					console.debug('showSvg',f,opts);
					const reader = new FileReader();
					reader.addEventListener('loadend', function(ev) {
						let ef = null,
							mL = null;
						svg = {
							loc: document.getElementById(containerId(f.title)),
							// known limitation: if there are two references of the same image on a page, only the first is shown.
							val: ev.target.result
						};
						// process all image references one by one:
						// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec
						while((mL=rE.exec(ev.target.result)) != null ) {
							// skip all images already provided as data-URLs:
							if( mL[2].startsWith('data:') ) continue;
							// avoid transformation of redundant images:
							if( indexById(dataURLs,mL[2])>-1 ) continue;
							pend++;
							ef = itemBySimilarTitle( app.cache.files, mL[2] );
//							console.debug('SVG embedded file',mL[2],ef,pend);
							// transform file to data-URL and display, when done:
							toDataURL(ef, function(ft,res) {
								dataURLs.push({
									id: ft,
									val: res
								});
//								console.debug('last dataURL',pend,dataURLs[dataURLs.length-1],svg);
								if( --pend<1 ) {
									// all embedded images have been transformed,
									// replace references by dataURLs and add complete image to DOM:
									svg.loc.innerHTML = svg.val.replace( rE, function($0,$1,$2,$3) {
																return $1+itemBySimilarId(dataURLs,$2).val+$3
															});
									if( opts && opts.clickableElements ) registerClickEls(svg.loc)
								}
							});
						};
						if( pend==0 ) {
							// there are no embedded images, so display right away:
							svg.loc.innerHTML = svg.val;
							if( opts && opts.clickableElements ) registerClickEls(svg.loc)
						}
					});
					// load the vector image:
					if( opts && typeof(opts.timelag)=='number' && opts.timelag>0 )
						setTimeout(function() {
							reader.readAsText(f.blob)
						}, opts.timelag )
					else
						reader.readAsText(f.blob);
					return

					// see http://tutorials.jenkov.com/svg/scripting.html
					function registerClickEls(svg) {
						if( !CONFIG.clickableModelElements || CONFIG.clickElementClasses.length<1 ) return;
//						console.debug('registerClickEls',svg);
						addViewBoxIfMissing(svg);
						
						// now collect all clickable elements:
						svg.clEls = [];
						// For all elements in CONFIG.clickElementClasses:
						// Note that .getElementsByClassName() returns a HTMLCollection, which is not an array and thus has neither concat nor slice methods.
						// 	Array.prototype.slice.call() converts the HTMLCollection to a regular array, 
						//  see http://stackoverflow.com/questions/24133231/concatenating-html-object-arrays-with-javascript
						CONFIG.clickElementClasses.forEach( function(cl) {
							svg.clEls = svg.clEls.concat(Array.prototype.slice.call( svg.getElementsByClassName( cl )));
						});
//						console.debug(svg.clEls, typeof(svg.clEls))
						let clEl = null;
						svg.clEls.forEach( function(clEl) {
							// set cursor for clickable elements:
							clEl.setAttribute("style", "cursor:pointer;");

							// see https://www.quirksmode.org/js/events_mouse.html
							// see https://www.quirksmode.org/dom/events/
							clEl.addEventListener("dblclick", 
								function(evt){ 
									// ToDo: So far, this only works with ARCWAY generated SVGs.
									let eId = this.className.baseVal.split(' ')[1];		// second class is element id
									// If there is a diagram with the same name as the resource with eId, show it (unless it is currently shown):
									eId = correspondingPlan(eId);
									// delete the details to make sure that that images of the click target are shown,
									// otherwise there will be more than one image container with the same id:
									$("#details").empty();
									// jump to the click target:
									app.specs.tree.selectNodeByRef( {id:eId}, true );  // true: 'similar'; id must be a substring of nd.ref
									// ToDo: In fact, we are either in CONFIG.objectDetails or CONFIG.objectList
									document.getElementById(CONFIG.objectList).scrollTop = 0
								}
							);

							// Show the description of the element under the cursor to the left:
							clEl.addEventListener("mouseover", 
								function(evt){ 
//									console.debug(evt,this,$(this));
									// ToDo: So far, this only works with ARCWAY generated SVGs.
								//	evt.target.setAttribute("style", "stroke:red;"); 	// works, but is not beautiful
									let id = this.className.baseVal.split(' ')[1],		// id is second class
										clAtts = classifyProps( itemBySimilarId(app.cache.resources,id), app.cache ),
										dsc = '';
									clAtts.descriptions.forEach( function(d) {
										dsc = valOf(clAtts,d) + dsc
									});
									if( dsc.stripCtrl().stripHTML().trim() ) {
										// Remove the dynamic linking pattern from the text:
										$("#details").html( '<span style="font-size:120%">' 
															+ (CONFIG.addIconToInstance?clAtts.title.addIcon(clAtts['class'].icon):clAtts.title) 
															+ '</span>\n'
															+ dsc );
										app.specs.showTree.set(false)
									}
								}
							);
							clEl.addEventListener("mouseout", 
								function(evt){ 
								//	evt.target.setAttribute("style", "cursor:default;"); 
									app.specs.showTree.set(true);
									$("#details").empty()
								}
							) 
						});
						return svg
						
						function correspondingPlan(id) {
							// In case a graphic element is clicked, usually the resp. element (resource) with it's properties is shown.
							// This routine checks whether there is a plan with the same name to show that plan instead of the element.
							if( !CONFIG.selectCorrespondingPlanFirst ) return id;
							// else, replace the id of a resource by the id of a diagram carrying the same title:
							let ti = resTitleOf(itemBySimilarId(app.cache.resources,id)),
								rT = null;
							for( var i=app.cache.resources.length-1;i>-1;i--) {
								rT = itemById(app.cache.resourceClasses,app.cache.resources[i]['class']);
								if( CONFIG.plans.indexOf(rT.title)<0 ) continue;
								// else, it is a resource representing a diagram:
								if( resTitleOf(app.cache.resources[i])==ti ) {
									// found: the diagram carries the same title 
									if( app.specs.resources.selected().value && app.specs.resources.selected().value.id==app.cache.resources[i].id )
										// the searched plan is already selected, thus jump to the element: 
										return id
									else
										return app.cache.resources[i].id	// the corresponding diagram's id
								}
							};
							return id	// no corresponding diagram found
						}
						// Add a viewBox in a SVG, if missing (e.g. in case of BPMN diagrams from Signavio and Bizagi):
						function addViewBoxIfMissing(svg) {
							let el=null;
							svg.childNodes.forEach( function(el) {
//								console.debug('svg',svg,el,el.outerHTML);
								// look for '<svg .. >' tag with its properties, often but not always the first child node:
								if( el && el.outerHTML && el.outerHTML.startsWith('<svg') ) {
									if( el.getAttribute("viewBox") ) return;  // all is fine, nothing to do

									// no viewbox property, so add it:
									let w = el.getAttribute('width'),
										h = el.getAttribute('height');
									// get rid of 'px':
									// ToDo: perhaps this is a little too simple ...
									if( w.endsWith('px') ) w = w.slice(0,-2);
									if( h.endsWith('px') ) h = h.slice(0,-2);
									el.setAttribute("viewBox", '0 0 '+w+' '+h );
									return
								}
							})
						}
					}
				}
				function showBpmn(f,opts) {
					// https://github.com/bpmn-io/bpmn-js-examples/tree/master/pre-packaged
					// https://bpmn.io/blog/posts/2014-bpmn-js-viewer-is-here.html
					// https://forum.bpmn.io/t/how-to-get-svg-object-from-viewer/1948
					// https://forum.bpmn.io/t/saving-bpmn-and-svg-to-a-website-rather-than-download/210
					// https://www.pleus.net/blog/?p=2142

//					console.debug('showBpmn',f);
				
					// Attention: the element with id 'f.id' has not yet been added to the DOM when execution arrives here;
					// increase the timelag between building the DOM and rendering the images, if necessary.
						function transformBpmn(f) {
						//	document.getElementById(containerId(f.title)).innerHTML = '<p>Here comes a BPMN diagram '+f.id+'</p>'
							// viewer instance:
							let cvs = containerId(f.title);
								bpmnViewer = new BpmnJS({container: '#'+cvs});
							bpmnViewer.importXML(f.blob, function(err) {
								if (err) {
									console.error('BPMN-Viewer could not import BPMN 2.0 diagram', err);
									return 
								};
								bpmnViewer.saveSVG( function(err, svg) { // do stuff with the SVG 
									if (err) {
										console.error('BPMN-Viewer could not deliver SVG', err);
										return 
									};
//									console.debug('SVG',svg);
									document.getElementById(cvs).innerHTML = svg
								});
						/*		// access viewer components:
								var canvas = bpmnViewer.get('canvas');
								// zoom to fit full viewport:
								canvas.zoom('fit-viewport')  */
							})  
						}
					// transform the BPMN-XML and render the diagram:
					if( opts && typeof(opts.timelag)=='number' && opts.timelag>0 )
						setTimeout(function() {
							transformBpmn(f)
						}, opts.timelag )
					else
						transformBpmn(f)
				}
				function itemBySimilarId(L,id) {
					// return the list element having an id similar to the specified one:
					id = id.trim();
					for( var i=L.length-1;i>-1;i-- )
						// is id a substring of L[i].id?
						if( L[i].id.indexOf(id)>-1 ) return L[i];   // return list item
					return null
				}
				function itemBySimilarTitle(L,ti) {
					// return the list element having an id similar to the specified one:
					ti = ti.trim();
					for( var i=L.length-1;i>-1;i-- )
						// is ti a substring of L[i].title?
						if( L[i].title.indexOf(ti)>-1 ) return L[i];   // return list item
					return null
				}
		}	// end of showImg()
		function containerId(str) {
			return 'C-'+str.simpleHash()
		}
/*	},
	// prepare a file reference to be compatible with ReqIF spec and conventions:
	fromGUI: function( txt ) {
			function getType( str ) {
				var t = /(type="[^"]+")/.exec( str );
				if( t==null ) return '';
				return (' '+t[1])
			}
			function getStyle( str ) {
				var s = /(style="[^"]+")/.exec( str );
				if( s==null ) return '';  
				return (' '+s[1])
			}
			function getUrl( str, prp ) {
				// get the URL:
				var l = new RegExp(prp+'="([^"]+)"','').exec( str );
				// return null, because an URL is expected in any case:
				if( l==null ) return null;    

				// ToDo: More greediness!?
				var loc = /[^"]*\/projects\/[^"]*\/files\/([^"]+)/i.exec( l[1] );    // ...projects/.../files/..
				// If matching, it is a local path, otherwise an external:
				// ToDo: If the path is pointing to a specific revision of a file, the revision is ignored/removed.
				if( loc == null ) return l[1];  		// external link: keep full path
				return loc[1]              				// local link: take path following '.../files/'
			};
//		console.debug('fromGUI 0: ', JSON.stringify(txt));

		// Remove the div which has been added for formatting:
		// ToDo: This does not work in all cases. Observed with <a>..<object ...>text</object></a> used with an OLE object.
		txt = txt.replace( /<div class="forImage">([\s\S]+?<\/a>)[\s]*<\/div>/g,  // note the 'lazy plus' !
			function( $0, $1 ){ return $1 }
		);	
//		console.debug('fromGUI 1: ', JSON.stringify(txt));

		// 1. In case of two nested objects, make the URLs relative to the project
		//    The inner object can be a tag pair <object .. >....</object> or comprehensive tag <object .. />.
		txt = txt.replace( /<object([^>]+)>[\s\S]*?<object([^>]+)(\/>|>([\s\S]*?)<\/object>)[^>]*<\/object>/g,  // description is $4 
			function( $0, $1, $2, $3, $4 ) { 
				var u1 = getUrl( $1, 'data' ),  			// the primary information
					t1 = getType( $1 ); 
				var u2 = getUrl( $2, 'data' ), 
					t2 = getType( $2 ), 
					s2 = getStyle( $2 ); 

				// If there is no description, use the name of the link object:
				if( !$4 ) $4 = u1;   // $4 is now the description between object tags
				
				return '<object data="'+u1+'"'+t1+' ><object data="'+u2+'"'+t2+s2+' />'+$4+'</object>'
			}
		);	
//		console.debug('fromGUI 2: ', JSON.stringify(txt));
			
		// 2. Transform link and image to nested XHTML object(s) or a single XHTML object:
		//    (Img is not allowed in RIF/ReqIF and it is proposed by the ReqIF Implementor Forum to use nested objects)
		txt = txt.replace( /<a([^>]+)>[^<]*<img([^>]+)(\/>|>[^<]*<\/img>)([^<]*)<\/a>/g,  
			function( $0, $1, $2, $3, $4 ) { 
				var u1 = getUrl( $1, 'href' );  			// the primary information
				if( u1==null ) return '';					// suppress it, if incomplete
				var t1 = getType( $1 ); 					

				var u2 = getUrl( $2, 'src' ); 				// the image
				if( u2==null ) return '';					// suppress it, if incomplete
				var t2 = getType( $2 );						
				var s2 = getStyle( $2 );

				// If there is no description, use the name of the link object:
				if( !$4 ) $4 = u1;   // $4 is now the filename with extension
					
				if( u1==u2 )   
					// Create a single object, if objectClasses of link and image are equal:
					return ('<object data="'+u2+'"'+t2+s2+' >'+$4+'</object>');
						
				if( /\.\/im[^-]+-icon\.png/i.test( u2 ) )  // self-supplied icons: "./im*-icon.png"
					// Create a single object, if the image is a locally provided icon:
					// It is assumed that the self-supplied icons are found in a folder starting with '/im' (for 'img' or 'image')
					// ... and that the path does not contain any dash '-'.
					return ('<object data="'+u1+'"'+t1+' >'+$4+'</object>');
						
				// If objectClasses of link and image are different, create a nested pair of objects to keep the preview.
				return '<object data="'+u1+'"'+t1+' ><object data="'+u2+'"'+t2+s2+' >'+$4+'</object></object>'
			}
		);
//		console.debug('fromGUI 3: ', JSON.stringify(txt));

		// 3. Transform a link plus object (in case of svg) to nested XHTML object(s):
		txt = txt.replace( /<a([^>]+)>[^<]*<object([^>]+)(\/>|>([\s\S]*?)<\/object>)[^<]*<\/a>/g,  
			function( $0, $1, $2, $3, $4 ) { 
				// parse the primary information:
				var u1 = getUrl( $1, 'href' ); 				
				if( u1==null ) return '';
				var t1 = getType( $1 ); 					

				// Parse the image information: 
				var u2 = getUrl( $2, 'data' ); 				
				if( u2==null ) return '';
				var t2 = getType( $2 );
				var s2 = getStyle( $2 );
					
				// If there is no description, use the name of the link object:
				if( !$4 ) $4 = u2;   // $4 is now the filename with extension
					
				if( u1==u2 ) {
					// If objectClasses of link and image are equal or the image is locally provided icon, create a single object.
					// Any locally provided icon is removed; it will be added again when reading.
					return ('<object data="'+u2+'"'+t2+s2+' >'+$4+'</object>')
				} else {
					// If objectClasses of link and image are different, create a nested pair of objects to keep the preview.
					return '<object data="'+u1+'"'+t1+' ><object data="'+u2+'"'+t2+s2+' >'+$4+'</object></object>'
				}
			}
		);
//		console.debug('fromGUI 4: ', JSON.stringify(txt));

		// 4. Transformation of <img> to <object> has been moved to SpecIF->ReqIF, because it is a restriction of ReqIF.

		// 5. If there is just a link, make the URLs relative to the project:
		txt = txt.replace( /<a([^>]+)(\/>|>([^>]+)<\/a>)/g,
			function( $0, $1, $2, $3 ){
				var u = getUrl( $1, 'href' );
				if( u==null ) return '';

				// If there is no description, use the name of the link object:
				if( !$3 ) $3 = u;   

				return ('<a href="'+u+'" >'+$3+'</a>');  
			} 
		);
//		console.debug('fromGUI result:', JSON.stringify(txt));

		return txt
*/	}
}	// end of fileRef()
