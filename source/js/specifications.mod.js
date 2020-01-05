/*	SpecIF View
	Dependencies: jQuery, jqTree, bootstrap
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de            
*/

// Construct the specifications controller:
modules.construct({
	name: CONFIG.specifications
}, function(self) {
	"use strict";
	
	// Permissions for resources and statements:
	self.resCreClasses = [];  // all resource types, of which the user can create new instances. Identifiers are stored, as they are invariant when the cache is updated.
	self.staCreClasses = [];  // all statement types, of which the user can create new instances. Identifiers are stored, as they are invariant when the cache is updated.
	self.staDelClasses = [];  // all statement types, of which the user can delete any instance. Identifiers are stored, as they are invariant when the cache is updated.

	// ToDo: sub-views communicate solely via tree and its status, other shared variables shall diappear, if possible.
	self.resCre = false; 	// controls whether resp. button is enabled; true if the user has permission to create resources of at least one type.
	self.resCln = false;	//  " , true if the user has permission to create a resource like the selected one.
	self.staCre = false;
	self.staDel = false;
	self.filCre = false;
	self.cmtCre = false;
	self.cmtDel = false;
		
	self.resources = new Resources(); 	// flat-listed resources for display, is a small subset of app.cache.selectedProject.data.resources
//	self.comments = new Resources();  	// flat-listed comments for display
//	self.files = new Files();			// files for display

	let myName = self.loadAs,
		myFullName = 'app.'+myName,
		tabsWithEditing = [ '#'+CONFIG.objectList, '#'+CONFIG.objectDetails ];

	self.selectedTab = function() {
//		console.debug('selectedTab',self.viewCtl.selected.view)
		return self.viewCtl.selected.view
	};
	self.emptyTab = function( div ) {
		selectResource( null );
		app.busy.reset();
		// but show the buttons anyways, so the user can create the first resource:
		$( '#contentNotice' ).empty();
		$( '#contentActions' ).html( self.actionBtns() );
		$( div ).empty()
	};

	// standard module interface:
	self.init = function() {
	//	if( !opts || ( typeof(opts.callback) != "function" ) ) return false;
		// initialize the module:
//		console.debug( 'specs.init', self );
		
		//  Add the left panel for tree or details and the up/down buttons to the DOM:
		let h = '<div id="specLeft" class="paneLeft">'
			+		'<div id="hierarchy" class="pane-tree" />'
			+		'<div id="details" class="pane-details" />'
			+	'</div>'
			+	'<div id="specCtrl" class="contentCtrl" >'
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
			eventHandlers: {
				'select':  
					// when a node is clicked or traversed by up/down keys
					function(event) {  // The clicked node is 'event.node'
						// just update the node handle (don't use self.tree.selectNode() ... no need to update the tree ;-):
//						console.debug('tree.select',event);
						self.tree.selectedNode = event.node;

					/*	// Update browser history:
						setUrlParams({
							project: app.cache.selectedProject.data.id,
							view: self.viewCtl.selected.view.substr(1),	// remove leading hash
							node: event.node.id,
							item: event.node.ref
						});
						// .. this is done in the leaf view */

						document.getElementById(CONFIG.objectList).scrollTop = 0;
						self.refresh()
					},
				'open':
					// when a node is opened, but not when an opened node receives an open command
					function(event) {  // The clicked node is 'event.node', but we don't care
						// refresh is only needed in document view:
//						console.debug('tree.open',event);
						if( self.selectedTab()=='#'+CONFIG.objectList ) self.refresh()
					},
				'close':
					// when a node is closed, but not when a closed node receives a close command
					function(event) {  // The clicked node is 'event.node', but we don't care
						// refresh is only needed in document view:
						if( self.selectedTab()=='#'+CONFIG.objectList ) self.refresh()
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
								app.cache.selectedProject.createNode({
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
								app.cache.selectedProject.createNode({
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
						// ToDo: implement 'app.cache.selectedProject.moveNode()'
						app.cache.selectedProject.deleteNode( {id: event.move_info.moved_node.id} )
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
							.fail( handleError ); */
					}
			}
		});
		// controls whether the left panel with the tree or details is shown or not:
		self.showLeft = new State({
			showWhenSet: ['#specLeft','#specCtrl'],
			hideWhenSet: []
		});
		// controls whether the left panel shows tree or details (when showLeft is true):
		self.showTree = new State({
			showWhenSet: ['#hierarchy'],
			hideWhenSet: ['#details']
		});
	//	self.typesComment = null;
	//	self.typesComment = new StdTypes( app.cache.selectedProject.data, new CommentTypes() );  // types needed for commenting, defined in stdTypes-*.js
	//	self.dmp = new diff_match_patch();	// to compare the revisions and mark changes
		refreshReqCnt = 0;
		
		return true
	};
	self.clear = function() {
		$('#pageTitle').empty();
		selectResource(null);
		self.resources.init();
	//	self.comments.init();
		self.modeCmtDel = false;
		self.resCreClasses = [];
		self.staCreClasses = [];
		self.staDelClasses = [];
		self.tree.init();
		refreshReqCnt = 0;
		app.cache.clear();
		app.busy.reset()
	//	self.cacheLoaded( false );
	//	if( modules.isReady( CONFIG.objectFilter ) ) filterView.clear();  // clear the filter, if it is loaded.
	};
	// module entry 'self.show()' see further down
	// module exit;
	// called by the parent's view controller:
	self.hide = function() {
//		console.debug( 'specs.hide' );
	//	self.emptyTab();
		$( '#'+CONFIG.specifications ).hide();
		app.busy.reset()
	}; 
/*	function handleError(xhr) {
//		console.debug( 'handleError', xhr );
		self.clear();
		switch( xhr.status ) {
			case 0:
			case 200:
			case 201:
				return; // some calls end up in the fail trail, even though all went well.
			default:
				stdError(xhr)
		}
	} */

	function selectResource( nd ) {
		setPermissions( nd );   // nd may be null
		if( !nd ) return self.resources.init();
		// Assuming that the resource has been refreshed shortly before selectResource is called:
		var r = itemById( app.cache.selectedProject.data.resources, nd.ref );
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
		
		var r = itemById( app.cache.selectedProject.data.resources, nd.ref );
		if( r ) {
			// self.resCre is set when resCreClasses are filled ...
			self.resCln = self.resCreClasses.indexOf( r['class'] )>-1;
			// give permission to an admin, anyway:
//			self.resCln = ( indexById( self.resCreClasses, r['class'] )>-1 || me.iAmAdmin(app.cache.selectedProject.data) )

			// Set the permissions to enable or disable the create statement buttons;
			// a statement can be created, if the selected resource's type is listed in subjectClasses or objectClasses of any statementClass:
				function mayHaveStatements( selR ) {
//					if( selR ) console.debug( 'selR', selR );
//					console.debug( 'staCreClasses', self.staCreClasses );
					// iterate all statements for which the user has instantiation rights
					var creR = null;  
					self.staCreClasses.forEach( function(sT) {   
						creR = itemById( app.cache.selectedProject.data.statementClasses, sT );
//						console.debug( 'mayHaveStatements', self.staCreClasses[s], creR, selR['class'] );
						if( 
							// if creation mode is not specified or 'user' is listed, the statement may be applied to this resource:
							( !creR.instantiation || creR.instantiation.indexOf( 'user' )>-1 )
							// if subjectClasses or objectClasses are not specified or the type of the selected resource is listed, the statement may be applied to this resource:
							&& ((!creR.subjectClasses || creR.subjectClasses.indexOf( selR['class'] )>-1 
								|| !creR.objectClasses || creR.objectClasses.indexOf( selR['class'] )>-1 ))
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
		self.resCreClasses = [];
		self.staCreClasses = [];
		self.staDelClasses = [];

		app.cache.selectedProject.data.resourceClasses.forEach( function(rC) {
			// list all resource types, for which the current user has permission to create new instances
			// ... and which allow manual instantiation:
			// store the type's id as it is invariant, when app.cache.selectedProject.data.allClasses is updated
			if( rC.cre && (!rC.instantiation || rC.instantiation.indexOf('user')>-1) && rC.propertyClasses && rC.propertyClasses.length>0 )
				self.resCreClasses.push( rC.id )
		});
		app.cache.selectedProject.data.statementClasses.forEach( function(sC) {
			// list all statement types, for which the current user has permission to create new instances:
			// ... and which allow user instantiation:
			// store the type's id as it is invariant, when app.cache.selectedProject.data.allClasses is updated
			if( sC.cre && (!sC.instantiation || sC.instantiation.indexOf('user')>-1) ) 
				self.staCreClasses.push( sC.id );
			if( sC.del ) 
				self.staDelClasses.push( sC.id );
		});
							
		// b) set the permissions for the edit buttons:
		self.resCre = self.resCreClasses.length>0;
		self.staCre = self.staCreClasses.length>0;
		self.staDel = self.staDelClasses.length>0;
		self.filCre = app.cache.selectedProject.data.cre;
	//	let cT = itemByName( app.cache.selectedProject.data.resourceClasses, CONFIG.resClassComment ),
	//		rT = itemByName( app.cache.selectedProject.data.statementClasses, CONFIG.staClassCommentRefersTo );
	//	self.cmtCre = ( self.typesComment && self.typesComment.available() && cT.cre && rT.cre );
	//	self.cmtDel = ( self.typesComment && self.typesComment.available() && cT.del && rT.del )
//		console.debug('permissions',self.resCreClasses,self.staCreClasses,self.staDelClasses)
	}

	self.updateTree = function( spc ) {
		// Load the SpecIF hierarchies to a jqTree,
		// a dialog (tab) with the tree (#hierarchy) must be visible.

	/*	// There are two modes:
		// - 'insert': insert spc at its position by id in the loaded tree, if it is found,
		//   or add it at the end of the hierarchy list, otherwise.
		// - 'replace': replace the current tree with spc
		// - use this function to auto-update the tree in the background.

		// replace or append spc:
	//	let tr = self.tree.get(), // don't ask me why this does not work ..
		let tr = [].concat(self.tree.get()),
			idx = indexById( tr, spc.id );
//		console.debug('updateTree',tr,idx,Array.isArray(tr));
		if( idx<0 )
			tr.push(toChild(spc))
		else
			tr = tr.splice(idx,1,toChild(spc));   */
	
		let tr;
		// Replace the tree:
		if( Array.isArray( spc ) )
			tr = forAll( spc, toChild )
		else
			tr = [toChild(spc)];
		
		// load the tree:
		self.tree.saveState();
		self.tree.set(tr);
		self.tree.numberize();
		self.tree.restoreState();
		return;

		// -----------------
		function toChild( iE ) {
			// transform SpecIF hierarchy to jqTree:
			let r = itemById( app.cache.selectedProject.data.resources, iE.resource );
			var oE = {
				id: iE.id,
				// ToDo: take the referenced resource's title, replace XML-entities by their UTF-8 character:
				// String.fromCodePoint()
				name: resTitleOf(r), 
				ref: iE.resource.id || iE.resource // for SpecIF 0.11.x and 0.10.x
			};
			oE.children = forAll( iE.nodes, toChild );
		//	if( typeof(iE.upd)=='boolean' ) oE.upd = iE.upd;
			if( iE.revision ) oE.revision = iE.revision;
			oE.changedAt = iE.changedAt;
//			console.debug( 'toChild', iE,r,oE )
			return oE
		}
	};

	// The module entry;
	// called by the parent's view controller:
	self.show = function( opts ) {
//		console.debug( CONFIG.specifications, 'show', opts );
		if( !(app.cache.selectedProject && app.cache.selectedProject.data && app.cache.selectedProject.data.id) ) {
			console.error( 'No selected project on entry of spec.show' );
			return null // shouldn't ever happen
		};
		
		$('#pageTitle').html( app.cache.selectedProject.data.title );
		app.busy.set();
	//	$('#contentNotice').html( '<div class="notice-default">'+i18n.MsgInitialLoading+'</div>' );
		$('#contentNotice').empty();

		getPermissions();
		
 		let uP = opts.urlParams,
			fNd = self.tree.firstNode(),
			nd = undefined;
		
		// Initialize the tree, unless
		// - URL parameters are specified where the project is equal to the loaded one
		// - just a newView is specifed without URL parameters (coming from another page)
		if( !fNd
			|| indexById( app.cache.selectedProject.data.resources, fNd.ref )<0  // condition is probably too weak
			|| uP && uP[CONFIG.keyProject] && uP[CONFIG.keyProject]!=app.cache.selectedProject.data.id )
			self.tree.init();
		
//		console.debug('show 1',uP,self.tree.selectedNode);
		// assuming that all initializing is completed (project and types are loaded), 
		// get and show the specs:
		if( app.cache.selectedProject.data.hierarchies && app.cache.selectedProject.data.hierarchies.length>0 ) {
			// ToDo: Get the hierarchies one by one, so that the first is shown as quickly as possible;
			// each might be coming from a different source (in future):
			app.cache.selectedProject.readContent( 'hierarchy', app.cache.selectedProject.data.hierarchies, {reload:true} )
			.done(function(rsp) {
//				console.debug('load',rsp);
		//		self.updateTree( itemById( app.cache.selectedProject.data.hierarchies, rsp.id ) )
				self.updateTree( rsp )

				// all hierarchies have been loaded;
				// try to select the requested node:
				if( uP && uP.node ) {
					nd = self.tree.selectNodeById( uP[CONFIG.keyNode] )
				};
				// node has priority over item (usually only one of them is specified ;-):
				if( !nd && uP && uP.item ) {
					nd = self.tree.selectNodeByRef( uP[CONFIG.keyItem] )
				};
				// if none is specified, take the node which is already selected:
				if( !nd ) nd = self.tree.selectedNode;
				// no or unknown resource specified; select first node:
				if( !nd ) nd = self.tree.selectFirstNode();
				if( nd ) {
					self.tree.openNode( nd )
				} else {
					if( !self.resCre ) {
						// Warn, if tree is empty and there are no resource classes for user instantiation:
						message.show( i18n.MsgNoObjectTypeForManualCreation, {duration:CONFIG.messageDisplayTimeLong} );
						return
					}
				}
			})
			.fail( stdError )
		} else {
			// the project has no spec:
			$('#contentNotice').html( '<div class="notice-danger">'+i18n.MsgNoSpec+'</div>' );
			app.busy.reset()
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
		// - user clicks in the tree -> update the view only if in a pure view (reading) mode, but not in editing mode.
		// - cache update is signalled -> again, refresh only any content in view mode.
		// --> Don't disturb the user in case of the editing views ('object', 'linker').
//		console.debug('doRefresh',parms);

		setContentHeight();
		$('#contentNotice').empty();
	
		// update the current view:
		self.viewCtl.selected.show( parms )
	}


/* +++++++++++++++++++++++++++++++                    
	Functions called by GUI events */
/*	self.addLinkClicked = function() {
		// load the linker template:
		// The button to which this function is bound is enabled only if the current user has permission to create statements.
		
		// load the linker module, if not yet available:
		if( modules.load( 'linker', function() {self.addLinkClicked()} ) ) return;  // try again as soon as module is loaded, a WARNING will be logged.

		modeStaDel = false;  // when returning, the statement table shan't be in delete mode.
		
	//	$( '#contentActions' ).empty();
		self.selectTab( 'linker' );
	//	self.views.show('linker');

		linker.init( function(){self.selectTab(CONFIG.relations)} );  // callback to continue when finished.
		linker.show( self.staCreClasses, self.tree.selectedNode )
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

		objectEdit.init( function(){self.selectTab(returnTab)}, mode );  // callback to continue when finished with editing.
		objectEdit.show( self.resCreClasses )
	};
	self.deleteResource = function() {
		// Delete the selected resource, all tree nodes and their children.
		// very dangerous ....
	}); 
		
	self.deleteNode = function() {
		// Delete the selected node and its children.
		// The resources are just dereferenced, but not deleted, themselves.
		function delNd( nd ) {
//			console.info( 'deleting', nd.name );
			// 1. Delete the hierarchy entry with all its children in the cache and server:
			app[myName].tree.selectNode( nd.getNextSibling() );  // select the inserted node, where the current node may have children
			app.cache.selectedProject.deleteContent( 'node', {id: nd.id} )
				.done( function() {
					app[myName].updateTree();
				doRefresh({forced:true})
				})
				.fail( handleError );
			
			// 2. Delete the resource from the cache, so that it is not any more used for dynamic linking
			// - assuming that the resource is referenced only once, which is true in most cases.
			// - However, on next autoload, all referenced resources are updated, so all is again fine, then.
			uncacheE( app.cache.selectedProject.data.resources, {id:nd.ref} )
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
		if( self.selectedTab() == '#'+CONFIG.objectRevisions || self.selectedTab() == '#'+CONFIG.comments ) return;

		// When a resource is clicked in the list (main row), select it and move it to the top.
		// If it is a resource with children (folder with content), assure it is open.
		// If it is already selected, at the top and open, then close it.
		// So, after first selecting a node, it ends always up open at the top,
		//     with further clicks it toggles between opened and closed.
	//	self.selectTab(CONFIG.objectList);  // itemClicked can be called from the hitlist ..
		if( self.tree.selectedNode.ref != rId ) {
			// different node: select it and open it:
			self.tree.selectNodeByRef( rId );
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
//		console.debug( 'relatedItemClicked', rId, sId, modeStaDel, itemById( app.cache.selectedProject.data.statements, sId ) );
	/*	if( self.selectedTab()=='#'+CONFIG.relations && modeStaDel ) {
			// Delete the statement between the selected resource and rId;
			// but delete only a statement which is stored in the server, i.e. if it is cached:
			if( itemById( app.cache.selectedProject.data.statements, sId ) )
				app.cache.selectedProject.deleteContent( 'statement', {id: sId} )
					.done( self.statements.show )
					.fail( stdError )
		} else { */
		//	self.selectTab( CONFIG.objectList );  
			// Jump to resource rId:
			self.tree.selectNodeByRef( rId );
			// changing the tree node triggers an event, by which 'self.refresh' will be called.
			document.getElementById(CONFIG.objectList).scrollTop = 0
	//	}
	};
/*	self.addComment = function() {
//		console.debug( 'addComment', self.tree.selectedNode );
		var cT = itemByName( app.cache.selectedProject.data.resourceClasses, CONFIG.resClassComment ),
			rT = itemByName( app.cache.selectedProject.data.statementClasses, CONFIG.staClassCommentRefersTo );
		if( !cT || !rT ) return null;
		
		var newC = {}, 
			newId = genID('R-');
		app.cache.selectedProject.initResource( cT )
			.done( function(rsp) {
				// returns an initialized resource of the requested type:
				newC = rsp;
				newC.id = newId
			})
			.fail( handleError );
		
		// ToDo: The dialog is hard-coded for the currently defined allClasses for comments (stdTypes-*.js).  Generalize!
		var txtLbl = i18n.lookup( CONFIG.propClassText ),
			txtAtT = itemByName( cT.propertyClasses, CONFIG.propClassText );
		var dT = itemById( app.cache.selectedProject.data.dataTypes, txtAtT.dataType );

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
					app.cache.selectedProject.createContent( 'resource', newC )
						.done( function(newO) {
							var newR = {
								subject: { id: newId, revision: 0 },
								object: { id: self.tree.selectedNode.ref, revision: 0 },
								class: rT.id,
								title: CONFIG.staClassCommentRefersTo
//								description: ''
							};
//							console.info( 'saving statement', newR );
							app.cache.selectedProject.createContent( 'statement', newR )
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
		app.cache.selectedProject.readStatementsOf({id:el})
			.done( function(rL) {
				// delete all statements of the comment - should just be one, currently:
//				console.debug('deleteComment',rL.statements,el);
				app.cache.selectedProject.deleteContent('statement',rL)
					.done( function(dta, textStatus, xhr) { 
						if( --pend<1 ) self.refresh()
					})
					.fail( handleError );
				// and delete the resource, as well:
				app.cache.selectedProject.deleteContent('resource',{id:el})
					.done( function(dta, textStatus, xhr) { 
						if( --pend<1 ) self.refresh()
					})
					.fail( handleError )
			})
	};
*/
	self.actionBtns = function() {
		if( tabsWithEditing.indexOf( self.selectedTab() )<0 ) return '';

		// rendered buttons:
		var selR = null,
			rB = '';
		if( self.resources.selected() ) selR = self.resources.selected().value;
	/*	if( selR )
			// Create a 'direct link' to the resource (the server renders the resource without client app):
			rB = '<a class="btn btn-link" href="'+CONFIG.serverURL+'/projects/'+app.cache.selectedProject.data.id+'/specObjects/'+self.resources.selected().value.id+'">'+i18n.LblDirectLink+'</a>';  
	*/	
		// Add the create button depending on the current user's permissions:
		// In order to create a resource, the user needs permission to create one or more resource types PLUS a permission to update the hierarchy:
	//	if( self.resCre && app.cache.selectedProject.data.selectedHierarchy.upd )
	//		rB += '<button class="btn btn-success" onclick="'+myFullName+'.editObjClicked(\'new\')" data-toggle="popover" title="'+i18n.LblAddObject+'" >'+i18n.IcoAdd+'</button>'
	//	else
			rB += '<button disabled class="btn btn-default" >'+i18n.IcoAdd+'</button>';
			
		if( !selR ) { return( rB )};

			function attrUpd() {
				// check whether at least one property is editable:
				if( selR.properties )
					for( var a=selR.properties.length-1;a>-1;a-- ) {
						if( selR.properties[a].upd ) return true   // true, if at least one property is editable
					};
				return false
			}

		// Add the clone, update and delete buttons depending on the current user's permissions:
	//	if( self.resCln && app.cache.selectedProject.data.selectedHierarchy.upd )
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
	//	if( app.cache.selectedProject.data.selectedHierarchy.del )
	//		rB += '<button class="btn btn-danger" onclick="'+myFullName+'.deleteNode()" data-toggle="popover" title="'+i18n.LblDeleteObject+'" >'+i18n.IcoDelete+'</button>';
	//	else
			rB += '<button disabled class="btn btn-default" >'+i18n.IcoDelete+'</button>';

		return rB	// return rendered buttons for display
	};
/*	self.cmtBtns = function() {
		if( !self.selectedTab()=='#'+CONFIG.comments || !self.resources.selected().value ) return '';
		// Show the commenting button, if all needed types are available and if permitted:
		if( self.cmtCre )
			return '<button class="btn btn-default" onclick="'+myFullName+'.addComment()" data-toggle="popover" title="'+i18n.LblAddCommentToObject+'" >'+i18n.IcoComment+'</button>';
		else
			return '<button disabled class="btn btn-default" >'+i18n.IcoComment+'</button>'
	}; */

	return self
});
// Construct the controller for resource listing ('Document View'):
modules.construct({
	view:'#'+CONFIG.objectList
}, function(self) {
	// Construct an object for displaying a hierarchy of resources:
	var pData;
	self.init = function() {
	};
	self.show = function( opts ) {
		// Show the next resources starting with the selected one:
//		console.debug(CONFIG.objectList, 'show', opts);
		pData = self.parent;
		pData.showLeft.set();
		pData.showTree.set();
		
		if( !pData.tree.selectedNode ) pData.tree.selectFirstNode();
		if( !pData.tree.selectedNode ) { pData.emptyTab('#'+CONFIG.objectList); return };  // quit, because the tree is empty
//		console.debug(CONFIG.objectList, 'show', pData.tree.selectedNode);

		app.busy.set();
		if( pData.resources.values.length<1 )
			$( '#'+CONFIG.objectList ).html( '<div class="notice-default" >'+i18n.MsgLoading+'</div>' );

		var nd = pData.tree.selectedNode,
			oL = [],  // id list of the resources to view
			nL = [];  // list of nodes of the hierarchy.
				
		// Update browser history, if it is a view change or item selection, 
		// but not navigation in the browser history:
		if( !opts || !opts.urlParams ) 
			setUrlParams({
				project: app.cache.selectedProject.data.id,
				view: self.view.substr(1),	// remove leading hash
				node: nd.id,
				item: nd.ref
			}); 

		// lazy loading: only a few resources are loaded from the server starting with the selected node
		// only visible tree nodes are collected in oL (excluding those in closed folders ..), 
		// so the main column corresponds with the tree.
		for( var i=0, I=CONFIG.objToGetCount; i<I && nd; i++ ) {
			oL.push({ id: nd.ref });  // nd.ref is the id of a resource to show
			nL.push( nd );
			nd = nd.getNextNode()   // get next visible tree node
		};

		app.cache.selectedProject.readContent( 'resource', oL )
			.done(function(rL) {
				// Format the titles with numbering:
				for( var i=rL.length-1; i>-1; i-- )
					rL[i].order = nL[i].order;
	
				// Update the view list, if changed:
				// Note that the list is always changed, when execution gets here,
				// unless in a multi-user configuration with server and auto-update enabled.
				if( pData.resources.update( rL ) || opts && opts.forced ) {
					// list value has changed in some way:
				//	setPermissions( pData.tree.selectedNode );  // use the newest revision to get the permissions ...
					$( '#'+CONFIG.objectList ).html( pData.resources.render() )
				};
				app.busy.reset();
				$( '#contentActions' ).html( pData.actionBtns() )
			})
			.fail( stdError )
	};
	self.hide = function() {
//		console.debug(CONFIG.objectList, 'hide');
		$( '#'+CONFIG.objectList ).empty().hide()
	};
	return self
});
// Construct the controller for displaying the statements ('Statement View'):
modules.construct({
	view:'#'+CONFIG.relations
}, function(self) {
	// Render the statements of a selected resource:
	var pData,
		selRes,				// the currently selected resource
		modeStaDel = false;	// controls what the resource links in the statements view will do: jump or delete statement

	self.init = function() {
		modeStaDel = false
	};
	self.show = function( opts ) {
//		console.debug(CONFIG.relations, 'show');
		pData = self.parent;
		pData.showLeft.set();
		pData.showTree.set();

		// The tree knows the selected resource; if not take the first:
		if( !pData.tree.selectedNode ) pData.tree.selectFirstNode();
		if( !pData.tree.selectedNode ) { pData.emptyTab('#'+CONFIG.relations); return };  // quit, because the tree is empty

		// else: the tree has entries:
		app.busy.set();
	//	$( '#'+CONFIG.relations ).html( '<div class="notice-default" >'+i18n.MsgLoading+'</div>' );
		// ToDo: Redraw only if the selected node has changed, to avoid a flicker.

		var nd = pData.tree.selectedNode,
			mG;
						
		// Update browser history, if it is a view change or item selection, 
		// but not navigation in the browser history:
		if( !opts || !opts.urlParams ) 
			setUrlParams({
				project: app.cache.selectedProject.data.id,
				view: self.view.substr(1),	// remove leading hash
				node: nd.id,
				item: nd.ref
			}); 

		app.cache.selectedProject.readStatementsOf( {id: nd.ref} )
			.done(function(sL) {
				// sL is the list of statements involving the selected resource.
				var relatedObjs = [];
//				console.debug( 'statements', sL );
				// Store all related resources while avoiding duplicate entries:
				sL.forEach( function(s) {
					// skip hidden statements:
					if( CONFIG.hiddenStatements.indexOf( s.title )>-1 ) return;
						
					if( s.subject.id == nd.ref ) { 
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
				// Finally, add the selected resource itself to the list as first item:
				relatedObjs.unshift({id: nd.ref});
//				console.debug( 'relatedObjs', relatedObjs );

				// Obtain the titles (labels) of all resources in the list.
				// The titles in the tree don't have the icon, therefore obtain the title from the referenced resources.
				// Since the resources are cached, this is not too expensive.
				app.cache.selectedProject.readContent( 'resource', relatedObjs )
					.done( function(roL) {   
						// roL is a list of the selected plus it's related resources

						// First get the selected resource, 
						// assuming that the sequence is arbitrary:
						selRes = new Resource( itemById(roL,nd.ref) );
						selRes.staGroups = [];
					//	selectResource( pData.tree.selectedNode );
					
						// For display, sort all statements in groups (=table rows) according to their type and direction;
						// the groups shall be ordered according to the statementClasses, therefore we cycle through the types:
						app.cache.selectedProject.data.statementClasses.forEach( function(sC) { 
							var rG = { rGs: [], rGt: [] };		// construct a statement group per type
							sL.forEach( function(s) {    // iterate statements
								// skip hidden statements:
								if( CONFIG.hiddenStatements.indexOf( s.title )>-1 ) return;
								// for sorting continue only if the class matches;
								// it assumed that every class appears only once:
								if( s['class'] != sC.id ) return;
							
								// for every statement type found, make an entry with a subgroup per direction:
								// - rGs contains statements of a given type, where the related resource is a subject
								// - rGt contains statements of a given type, where the related resource is a object
								if((s.subject.id == nd.ref) ) { 
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
							if( rG.rGs.length || rG.rGt.length) selRes.staGroups.push( rG )
						});
						// finally add the mentions-Relations:
						// find the 'mentions' statements:
						mG = addMentionsRels();
						if( mG && (mG.rGs.length || mG.rGt.length)) selRes.staGroups.push( mG )
						app.busy.reset();	
						$( '#contentActions' ).html( linkBtns() );
//						console.debug('statement groups',selRes.staGroups);
						renderStatements()
					})
					.fail( function(xhr) {
						app.busy.reset();	
						switch( xhr.status ) {
							case 404:   // related resource(s) not found, just ignore it
								break;
							default:
								stdError(xhr)
						}
					})
			})
			.fail( stdError );
		return

		function renderStatements() {
			if( modeStaDel ) 
				$('#contentNotice').html( '<span class="notice-danger" >'+i18n.MsgClickToDeleteRel+'</span>' )
			else
				$('#contentNotice').html( '<span class="notice-default" >'+i18n.MsgClickToNavigate+'</span>' );

			// If in delete mode, provide the name of the delete function as string:
			let net = selRes.statements({ fnDel: modeStaDel? 'app.'+self.parent.loadAs+'.deleteNode()':'' });
//			console.debug('renderStatements',net);
			switch( typeof(net) ) {
				case 'string':
					// notice or statements in a table:
					$( '#'+CONFIG.relations ).html( net );
					break;
				case 'object':
					// statements as a SpecIF data-set for graph rendering:
					$( '#'+CONFIG.relations ).html( '<div id="statementGraph" style="width:100%; height: 600px;" />' );
					let options = {
						index: 0,
						canvas:'statementGraph',
						titleProperties: CONFIG.titleProperties,
						onDoubleClick: function( evt ) {
//							console.debug('Double Click on:',evt);
							if( evt.target.resource && (typeof(evt.target.resource)=='string') ) 
								pData.relatedItemClicked(evt.target.resource,evt.target.statement);
								// changing the tree node triggers an event, by which 'self.refresh' will be called.
						}
					};
					if( modeStaDel )
						options.nodeColor = '#ef9a9a';
//					console.debug('showStaGraph',net,options);
					app.busy.reset();
					app.statementsGraph.show(net,options)
			}
		}
		function addMentionsRels() {
			// Search all resource text properties and detect where other resource's titles are referenced.
			// Only findings with marks for dynamic linking are taken.
			// Add a statement for each finding for display; do not save any of these statements in the server.
			if( !CONFIG.findMentionedObjects ) return;
			if( !pData.tree.selectedNode ) return;
			// take the original (unchanged) resources from cache:
			// First the currently selected resource:
			let sO=itemById( app.cache.selectedProject.data.resources, pData.tree.selectedNode.ref );
//			console.debug('addMentionsRels',pData.tree.selectedNode,sO);
			if( !sO ) return;
			// There is no need to have a statementClass .... at least currently:
//				var rT = itemByName( app.cache.selectedProject.data.statementClasses, 'SpecIF:mentions' );
//				if( !rT ) return;
			
			var ti = resTitleOf( sO ),
				rG = { rGs: [], rGt: [] };		// construct a statement group for the new statement type
			// In contrast to the statements collected before, these are not stored in the server.

			let rPatt=null, rStr=null, sT=null,
				// assumption: the dynamic link tokens don't need to be HTML-escaped:
				sPatt = new RegExp( (CONFIG.dynLinkBegin+ti+CONFIG.dynLinkEnd).escapeRE(), "i" );

			app.cache.selectedProject.data.resources.forEach( function(rO) {
				// The server delivers a tree with nodes referencing only resources for which the user has read permission,
				// so there is no need to check it, here:
				// disregard resources which are not referenced in the current tree:
				if( pData.tree.nodesByRef(rO.id).length<1 ) return;
				let ti = resTitleOf( rO );
				if( !ti || ti.length<CONFIG.dynLinkMinLength || rO.id==sO.id ) return;
				
				// 1. The titles of other resource's found in the selected resource's texts 
				//    result in a 'this mentions other' statement (selected resource is subject):
				rStr = (CONFIG.dynLinkBegin+ti+CONFIG.dynLinkEnd).escapeRE();
				rPatt = new RegExp( rStr, "i" );

				sT = itemById( app.cache.selectedProject.data.resourceClasses, sO['class'] );
				if( sO.properties )
					sO.properties.forEach( function(p) {
						switch( dataTypeOf( app.cache.selectedProject.data, p['class'] ).type ) {
							case 'xs:string':
							case 'xhtml':	
								// add, if the iterated resource's title appears in the selected resource's property ..
								// and if it is not yet listed:
								if( rPatt.test( p.value ) && notListed( rG.rGt,sO,rO ) ) {
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
				sT = itemById( app.cache.selectedProject.data.resourceClasses, rO['class'] );
				if( rO.properties )
					rO.properties.forEach( function(p) {
						switch( dataTypeOf( app.cache.selectedProject.data, p['class'] ).type ) {
							case 'xs:string':
							case 'xhtml':	
								// add, if the selected resource's title appears in the iterated resource's property ..
								// and if it is not yet listed:
								if( sPatt.test( p.value ) && notListed( rG.rGs,rO,sO ) ) {
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
	function linkBtns() {
		if( !selRes ) return '';
		if( modeStaDel ) return '<div class="btn-group btn-group-sm" ><button class="btn btn-default" onclick="'+myFullName+'.toggleModeStaDel()" >'+i18n.BtnCancel+'</button></div>';

		var rB = '<div class="btn-group btn-group-sm" >';
//		console.debug( 'linkBtns', self.staCre );

		if( self.staCre )
			rB += '<button class="btn btn-success" onclick="'+myFullName+'.addLinkClicked()" data-toggle="popover" title="'+i18n.LblAddRelation+'" >'+i18n.IcoAdd+'</button>'
		else
			rB += '<button disabled class="btn btn-default" >'+i18n.IcoAdd+'</button>';

		// Add the commenting button, if all needed types are available and if permitted:
	/*	if( self.cmtCre )
			rB += '<button class="btn btn-default" onclick="'+myFullName+'.addComment()" data-toggle="popover" title="'+i18n.LblAddCommentToObject+'" >'+i18n.IcoComment+'</button>';
		else
			rB += '<button disabled class="btn btn-default" >'+i18n.IcoComment+'</button>';  */

		if( self.staDel && selRes.staGroups.length>0 ) {
			rB += '<button class="btn btn-danger '+(modeStaDel?'active':'')+'" onclick="'+myFullName+'.toggleModeStaDel()" data-toggle="popover" title="'+i18n.LblDeleteRelation+'" >'+i18n.IcoDelete+'</button>';
		} else
			rB += '<button disabled class="btn btn-default" >'+i18n.IcoDelete+'</button>';

		return rB+'</div>'	// return rendered buttons for display
	};
/*	self.toggleModeStaDel = function() {
		// modeStaDel controls what the resource links in the statement view will do: jump or delete statement
		modeStaDel = !modeStaDel;  // toggle delete mode for statements
//		console.debug( 'toggle delete statement mode:', modeStaDel);
		$( '#contentActions' ).html( linkBtns() );
		renderStatements()
	}; */
	self.hide = function() {
//		console.debug(CONFIG.relations, 'hide');
		$( '#'+CONFIG.relations ).empty().hide()
	};
	return self
});

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
			self.resToShow = classifyProps( res, app.cache.selectedProject.data );
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
//				console.debug('#att',att);
				if( CONFIG.overviewHiddenProperties.indexOf( att.title )>-1 ) return false;  // hide, if it is configured in the list
				return (CONFIG.showEmptyProperties || hasContent(att.value))
			} 
		if( !self.value ) return '<div class="notice-default">'+i18n.MsgNoObject+'</div>';
		// Create HTML for a list entry:
//		console.debug( 'Resource.listEntry', self.value, self.resToShow );
		var rO = '<div class="listEntry">'
			+		'<div class="content-main">';
		
		// 1 Fill the main column:
		// 1.1 The title:
		switch( app.specs.selectedTab() ) {
			case '#'+CONFIG.objectList:
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
				var v = ['#'+CONFIG.objectList, '#'+CONFIG.objectDetails].indexOf(app.specs.selectedTab())>-1,
					os = {
						dynLinks: v,
						clickableElements: v,
						linkifiedURLs: v
					};
				rO += '<div class="attribute attribute-wide">'+valOf(self.resToShow,ai,os)+'</div>'
			}
		});
		rO += 	'</div>'  // end of content-main
			+	'<div class="content-other">';
		// 2 Add elementActions:
		switch( app.specs.selectedTab() ) {
			case '#'+CONFIG.comments:
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
						clickableElements: true,
						linkifiedURLs: true
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
	self.statements = function( opts ) {
		if( !self.value ) return '<div class="notice-default">'+i18n.MsgNoObject+'</div>';
		if( browser.isIE ) return renderStatementsTable( self.staGroups, opts );
		
		// Build a simplified SpecIF data set with the selected resource in focus: 
		var net = {
			// here, the icon is transferred in a resourceClass ... like SpecIF:
			resourceClasses: [{
				id:		self.value['class'],
				icon:	self.resToShow['class'].icon
			}],
			resources: [{
				id: 	self.value.id,
				title: 	self.resToShow.title,
				class:  self.value['class']
			}],
			statements: []
		};
		
		// add all statements:
		let sGL = self.staGroups, rR=null;
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
							icon: 	itemById( app.cache.selectedProject.data.resourceClasses, rR['class'] ).icon
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

		function renderStatementsTable( sGL, opts ) {
			// Render a table with all statements grouped by type:
		//	if( !self.value ) return '<div class="notice-default">'+i18n.MsgNoObject+'</div>';
			if( typeof(opts)!='object' ) opts = {fnDel:false};

			// opts.fnDel is a name of a delete function to call. If provided, it is assumed that we are in delete mode.
			// ToDo: The 'mentions' statements shall not be for deletion, and not appear to be for deletion (in red)
			if( opts.fnDel ) 
				var rT = '<div style="color: #D82020;" >'  // render table with the resource's statements in delete mode
			else
				var rT = '<div>';  // render table with the resource's statements in display mode
			rT += renderTitle( self.resToShow, self.value.order );	// rendered statements
			if( sGL.length>0 ) {
//				console.debug( sGL.length, sGL );
				if( opts.fnDel ) 
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
								sId: r.subject.id,
								sT: elementTitleWithIcon(r.subject),
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
							if( opts.fnDel && sc.computed )
								rT += sc.sT+'<br />'
							else
								rT += '<a onclick="app.specs.relatedItemClicked(\''+sc.sId+'\', \''+sc.id+'\')">'+sc.sT+'</a><br />'
						});
						// Title and object are the same for all statements in this list:
						rT += '</td><td style="vertical-align: middle"><i>'+titleOf(sG.rGs[0])+'</i></td>';
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
						rT += '<td style="vertical-align: middle"><i>'+titleOf(sG.rGt[0])+'</i></td><td>';
						// The list of resources:
						relG.forEach( function(tg) {
							if( opts.fnDel && tg.computed )
								rT += tg.tT+'<br />'
							else
								rT += '<a onclick="app.specs.relatedItemClicked(\''+tg.tId+'\', \''+tg.id+'\')">'+tg.tT+'</a><br />'
						});
						rT += '</td></tr>'
					}
				});
				rT += 	'</tbody></table>';
				if( opts.fnDel ) 
					rT += '<div class="doneBtns"><button class="btn btn-default btn-sm" onclick="'+opts.fnDel+'" >'+i18n.BtnCancel+'</button></div>'
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
			case '#'+CONFIG.objectRevisions: 
				rChI = 	attrV( i18n.LblRevision, ob.revision, 'attribute-condensed' );
				// no break
			case '#'+CONFIG.comments: 
				rChI += attrV( i18n.LblModifiedAt, localDateTime(ob.changedAt), 'attribute-condensed' ) 
					+	attrV( i18n.LblModifiedBy, ob.changedBy, 'attribute-condensed' )
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
		// update the first item (= selected resource), if it exists, or create it;
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
	self.render = function(resL) {
		if( !Array.isArray(resL) ) resL = self.values;
		// generate HTML representing the resource list:
		if( resL.length<1 )
			return '<div class="notice-default" >'+i18n.MsgNoMatchingObjects+'</div>';
		// else:
		var rL = '';	
		// render list of resources
		resL.forEach( function(v) {
			rL += v? v.listEntry() : ''
		});
		return rL	// return rendered resource list
	};

	// initialize:
	self.init();
	return self
}

RE.titleLink = new RegExp( CONFIG.dynLinkBegin.escapeRE()+'(.+?)'+CONFIG.dynLinkEnd.escapeRE(), 'g' );
function valOf( ob, prp, opts ) {
	"use strict";
	if( typeof(opts)=='object' ) {
		if( typeof(opts.dynLinks)!='boolean' ) 			opts.dynLinks = false;
		if( typeof(opts.clickableElements)!='boolean' ) opts.clickableElements = false;
		if( typeof(opts.linkifiedURLs)!='boolean' ) 	opts.linkifiedURLs = false
	} else {
		opts = {
			dynLinks: false,
			clickableElements: false,
			linkifiedURLs: false
		}
	};
//	console.debug('valOf',ob,prp,opts);
	let dT = dataTypeOf( app.cache.selectedProject.data, prp['class'] ); 
	switch( dT.type ) {
		case 'xs:string':
			var ct = noCode(prp.value).ctrl2HTML();
			if( opts.linkifiedURLs ) ct = ct.linkifyURLs();
			ct = titleLinks( ct, opts.dynLinks );
			if( CONFIG.stereotypeProperties.indexOf(prp.title)>-1 )
				ct = '&#x00ab;'+ct+'&#x00bb;'
			break;
		case 'xhtml':
			var os = {
					rev: ob.revision,
					clickableElements: opts.clickableElements
				},
				ct = fileRef.toGUI( noCode(prp.value), os );
			if( opts.linkifiedURLs ) ct = ct.linkifyURLs();
//			console.debug('valOf XHTML',ct);
			ct = titleLinks( ct, opts.dynLinks );
			break;
		case 'xs:dateTime':
			var ct = localDateTime( prp.value );
			break;
		case 'xs:enumeration':
			// usually value has a comma-separated list of value-IDs,
			// but the filter module delivers potentially marked titles in content.
			var ct = enumValStr( dT, prp );		// translate IDs to values, if appropriate
			break;
		default:
			var ct = noCode(prp.value)
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
		
		// in certain situations, just remove the dynamic linking pattern from the text:
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
						cO = itemById( app.cache.selectedProject.data.resources, nd.ref );
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
/*		Properly handle file references in XHTML-Text. 
		- An image is to be displayed 
		- a file is to be downloaded
		- an external hyperlink is to be included
*/
		if( opts ) {
			if( opts.projId==undefined ) opts.projId = app.cache.selectedProject.data.id;
			if( opts.rev==undefined ) opts.rev = 0
		} else {
			var opts = {
				projId: app.cache.selectedProject.data.id,
				rev: 0,
				clickableElements: false
			}
		};
		
	/*		function addFilePath( u ) {
				if( /^https?:\/\/|^mailto:/i.test( u ) ) {
					// don't change an external link starting with 'http://', 'https://' or 'mailto:'
//					console.debug('addFilePath no change',u);
					return u  		
				};
				// else, add relative path:
//				console.debug('addFilepath', u );
//				console.debug('addFilepath',itemById( app.cache.selectedProject.data.files, u ));
				return URL.createObjectURL( itemById( app.cache.selectedProject.data.files, u ).blob )
			}  */
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

/*				// all of the following work to a certain extent:
				//   <a></a> for downloading the OLE, 
				//   <object>text</object> allows to obtain the text as part of value after HTMLstrip (e.g. in search of a somewhat meaningful title)
				//   Note that IE displays the object tag only in case of SVG and PNG; the latter is used with DOORS OLE-Objects.

				if( opts.clickableElements )
					repSts.push( '<div class="forImage"><a href="'+u1+'"'+t1+' ><object data="'+u2+'"'+t2+s2+' >'+$4+'</object></a></div>' )
				else
					repSts.push( '<div class="forImage"><a href="'+u1+'"'+t1+' ><img src="'+u2+'"'+t2+s2+' alt="'+$4+'" /></a></div>' );
				// avoid that a pattern is processed twice: insert a placeholder and replace it with the prepared string at the end ...

				repSts.push( '<div class="forImage"><a href="'+u1+'"'+t1+' ><img src="'+u2+'"'+t2+s2+' alt="'+$4+'" /></a></div>' );  // works.
*/ 
				let f = itemByTitle(app.cache.selectedProject.data.files,u2);
//				console.debug('fileRef.toGUI 1a found: ', f );
				if( f && f.blob ) {
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
		/*			// it is an image, show it:
					if( opts.clickableElements && ( !browser.isIE || ( e=='svg' || e=='png' ) && browser.displaysObjects ) ) {  
						// For Firefox, Chrome. And for IE10+, if and only if the object is PNG or SVG.
						// Only an <object ..> allows for clicking on svg diagram elements with embedded links:
						d = '<object data="'+u1+'"'+t1+s1+' >'+d+'</object>'
					} else {
						// IE only displays images of type SVG and PNG with an <object> tag, so the others will be rendered with an <img> tag.
						// In case of IE9 prohibit that svg diagram elements can be clicked.
						//   For the time being, the click is handled via URL with hash parameters and with IE9 there is no chance to modify the browser history (=URL).
						//   As soon as the clicks are handled internally, also a clickable svg (via <object ..> can be presented to IE9, as well.
						d = '<img src="'+u1+'"'+t1+s1+' alt="'+d+'" />'
					}  */
				
					let f = itemByTitle(app.cache.selectedProject.data.files,u1);
//					console.debug('fileRef.toGUI 2a found: ', f, u1 );
					if( f && f.blob ) {
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
						// ToDo: Offer a link for downloading the file
						// see: https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications
						// see: https://blog.logrocket.com/programmatic-file-downloads-in-the-browser-9a5186298d5c/ 
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
								// ToDo: Offer a link for downloading the file
								break;
						//	case 'bpmn':
						//		break;
							default:
								// last resort is to take the filename:
								d = '<span>'+d+'</span>'  
								// ToDo: Offer a link for downloading the file
						}
					}
				};
					
				// finally add the link and an enclosing div for the formatting:
			//	return ('<div class="forImage"><a href="'+u1+'"'+t1+' >'+d+'</a></div>')

				// avoid that a pattern is processed twice.
				// insert a placeholder and replace it with the prepared string at the end ...
				if( hasImg )
			//		repSts.push( '<div class="forImage"><a href="'+u1+'"'+t1+' >'+d+'</a></div>' )
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
			//	if( /(<object|<img)/g.test( $2 ) ) return $0;		// no change, if an embedded object or image
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
			if( !f || !f.blob ) {
				document.getElementById(containerId(f.title)).innerHTML = '<div class="notice-danger" >Image missing: '+f.title+'</div>';
				return
			};
			// ToDo: in case of a server, the blob itself must be fetched first ...
			
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
					break;
				default:
					console.warn('Cannot show unknown diagram type: ',f.type)
			};
			return

						
				function showRaster(f,opts) {
					// Attention: the element with id 'f.id' has not yet been added to the DOM when execution arrives here;
					// increase the timelag between building the DOM and rendering the images, if necessary.
					blob2dataURL(f,function(r,fTi,fTy) {
						// add image to DOM using an image-tag with data-URI.
						// set a grey background color for images with transparency:
						document.getElementById(containerId(fTi)).innerHTML = '<img src="'+r+'" type="'+fTy+'" alt="'+fTi+'" style="background-color:#DDD;"/>'
					},opts.timelag)
				}
				function showSvg(f,opts) {
					// Show a SVG image.
					// ToDo: IE shows the image rather small.
					
					// Load pixel images embedded in SVG,
					// see: https://stackoverflow.com/questions/6249664/does-svg-support-embedding-of-bitmap-images
					// view-source:https://dev.w3.org/SVG/profiles/1.1F2/test/svg/struct-image-04-t.svg
					let svg = {},		// the SVG image with or without embedded images
						dataURLs = [],	// list of embedded images
						// RegExp for embedded images,
						// e.g. in ARCWAY-generated SVGs: <image x="254.6" y="45.3" width="5.4" height="5.9" xlink:href="name.png"/>
						rE = /(<image .* xlink:href=\")(.+)(\".*\/>)/g,
						pend = 0;		// the count of embedded images waiting for transformation
					
					// Attention: the element with id 'f.id' has not yet been added to the DOM when execution arrives here;
					// increase the timelag between building the DOM and rendering the images, if necessary.
//					console.debug('showSvg',f,opts);
					// Read and render SVG:
					blob2text(f,function(r) {
						let ef = null,
							mL = null;
						svg = {
							loc: document.getElementById(containerId(f.title)),
							// ToDo: If there are two references of the same image on a page, only the first is shown.
							img: r
						};
						// process all image references one by one:
						// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec
						while((mL=rE.exec(r)) != null ) {
							// skip all images already provided as data-URLs:
							if( mL[2].startsWith('data:') ) continue;
							// avoid transformation of redundant images:
							if( indexById(dataURLs,mL[2])>-1 ) continue;
							pend++;
							ef = itemBySimilarTitle( app.cache.selectedProject.data.files, mL[2] );
//							console.debug('SVG embedded file',mL[2],ef,pend);
							// transform file to data-URL and display, when done:
							blob2dataURL(ef, function(r,fTi) {
								dataURLs.push({
									id: fTi,
									val: r
								});
//								console.debug('last dataURL',pend,dataURLs[dataURLs.length-1],svg);
								if( --pend<1 ) {
									// all embedded images have been transformed,
									// replace references by dataURLs and add complete image to DOM:
									svg.loc.innerHTML = svg.img.replace( rE, function($0,$1,$2,$3) {
																return $1+itemBySimilarId(dataURLs,$2).val+$3
															});
									if( opts && opts.clickableElements ) registerClickEls(svg.loc)
								}
							});
						};
						if( pend==0 ) {
							// there are no embedded images, so display right away:
							svg.loc.innerHTML = svg.img;
							if( opts && opts.clickableElements ) registerClickEls(svg.loc)
						}
					}, opts.timelag)  
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
						// 	Array.from() converts the HTMLCollection to a regular array, 
						//  see https://hackernoon.com/htmlcollection-nodelist-and-array-of-objects-da42737181f9
						CONFIG.clickElementClasses.forEach( function(cl) {
							svg.clEls = svg.clEls.concat(Array.from( svg.getElementsByClassName( cl )));
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
									// delete the details to make sure that images of the click target are shown,
									// otherwise there will be more than one image container with the same id:
									$("#details").empty();
									// jump to the click target:
									app.specs.tree.selectNodeByRef( eId, true );  // true: 'similar'; id must be a substring of nd.ref
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
									let eId = this.className.baseVal.split(' ')[1],		// id is second class
										clAtts = classifyProps( itemBySimilarId(app.cache.selectedProject.data.resources,eId), app.cache.selectedProject.data ),
										dsc = '';
									clAtts.descriptions.forEach( function(d) {
										// to avoid an endless recursive call, valOf shall add neither dynLinks nor clickableElements
										dsc += valOf(clAtts,d)
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
							let ti = resTitleOf(itemBySimilarId(app.cache.selectedProject.data.resources,id)),
								rT = null;
							for( var i=app.cache.selectedProject.data.resources.length-1;i>-1;i--) {
								rT = itemById(app.cache.selectedProject.data.resourceClasses,app.cache.selectedProject.data.resources[i]['class']);
								if( CONFIG.plans.indexOf(rT.title)<0 ) continue;
								// else, it is a resource representing a diagram:
								if( resTitleOf(app.cache.selectedProject.data.resources[i])==ti ) {
									// found: the diagram carries the same title 
									if( app.specs.resources.selected().value && app.specs.resources.selected().value.id==app.cache.selectedProject.data.resources[i].id )
										// the searched plan is already selected, thus jump to the element: 
										return id
									else
										return app.cache.selectedProject.data.resources[i].id	// the corresponding diagram's id
								}
							};
							return id	// no corresponding diagram found
						}
						// Add a viewBox in a SVG, if missing (e.g. in case of BPMN diagrams from Signavio and Bizagi):
						function addViewBoxIfMissing(svg) {
							let el=null;
							// in Case of IE 'forEach' does not work with svg.childNodes
							for( var i=0,I=svg.childNodes.length;i<I;i++ ) {
								let el = svg.childNodes[i];
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
							}
						}
					}
				}
				function showBpmn(f,opts) {
//					console.debug('showBpmn',f);
				
					// Attention: the element with id 'f.id' has not yet been added to the DOM when execution arrives here;
					// increase the timelag between building the DOM and rendering the images, if necessary.
					// Read and render BPMN:
					blob2text(f,function(r,fTi) {
						bpmn2svg(r, function(err, svg) { 
									// this is the bpmnViewer callback function:
									if (err) {
										console.error('BPMN-Viewer could not deliver SVG', err);
										return 
									};
//									console.debug('SVG',svg);
									document.getElementById( containerId(fTi) ).innerHTML = svg
								})
					}, opts.timelag)  
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
					// return the list element having a title similar to the specified one:
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
	// Prepare a file reference to be compatible with ReqIF spec and conventions:
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
