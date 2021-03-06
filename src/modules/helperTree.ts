/*!	Helper functions for Marco Braak's jqTree (https://mbraak.github.io/jqTree/)
	Dependencies: jQuery 3.1 and later.
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution!
*/
// a constructor for the tree object:
function Tree( options:any ) {
	"use strict";
	// options.loc is the id of a DOM element to which the tree is attached.
	let self:any = {},
		domE = $(options.loc);
	domE.tree({
		data: [],
	//	saveState: true,
		dragAndDrop: options.dragAndDrop
	});
	for( var e in options.eventHandlers ) {
		domE.on(
			'tree.'+e,
			options.eventHandlers[e]
		)
	};

	self.init = function():void {
		self.set([]);
		self.savedState = undefined;
		self.selectedNode = undefined
	};
	self.set = function( tr, nId ) {
		let nd=undefined;
		if( typeof(nId)=='string' && nId.length>0 ) nd = self.nodeById(nId);
		// insert tr as a subtree, if nd is defined, or as a tree, otherwise:
		return domE.tree( 'loadData', tr, nd )
	};
	self.get = function() {
		// return the list of nodes representing the SpecIF root nodes:
		let tr = domE.tree('getTree');
//		console.debug('get',tr);
		return tr? tr.children : undefined
	};
	self.iterate = function(fn) {
		// apply the function fn to every node of the tree,
		// the node is handed in as a call parameter function(node) {},
		// if the return parameter is 'true', the iteration descends to the children:
		domE.tree('getTree').iterate( fn )
	};
	self.firstNode = function() {
		let tr = domE.tree('getTree');	// first get the root
//		console.debug('firstNode',tr);
		return tr? tr.children[0] : undefined	// avoid an exception when there is none ...
	};
	self.rootNode = function( nd ) {
		// return the root node of the given node:
		if( !nd ) nd = self.selectedNode;
		// step up until the parent is the jqTree root node; it has no id:
		while( nd.parent.id ) {
			nd = nd.parent;
		};
		return nd;
	};
/*	self.nodesByName = function( ti ) {
		return domE.tree('getNodesByProperty', 'name', ti)
	}; */
	self.nodesByRef = function( oId, similar ) {
		// Find all the nodes referencing the object and return them in a list.
		// Use case: Update all tree entries after an object (title) has been changed.
		let nodes = [];
		// Try to find the objects in the currently loaded tree (selectedSpec):
		if( similar ) {
			// iterate through all nodes of all levels and list the nodes, where oId is a substring:
			domE.tree('getTree').iterate( function(nd) {
				if( nd.ref.indexOf(oId)>-1 ) nodes.push( nd );
				return true	// continue iteration
			})
		} else {
			// get the nodes refencing the object id:
			nodes = domE.tree('getNodesByProperty', 'ref', oId)
		};
		return nodes
	};
	self.references = function( oId, similar ) {
		// Does the tree reference a resource with the given id?
		return self.nodesByRef(oId,similar).length>0
	};
	self.nodeByRef = function( oId, similar ) {
		// Find the tree node for the specified tree obj.
		// Use case: jump to a clicked object.
		// similar: the object id may be just a substring of the reference
		// !similar: the object id must be identical with the reference

		// a) Try to find the object:
		let nodes = self.nodesByRef(oId,similar);
		if( nodes && nodes.length>0 ) { 
			return nodes[0]   // select the first occurrence in the tree
		}; 
		// b) If a node cannot be found (has been deleted), return first node, instead:
		return self.firstNode()   // default: first node
	};
	self.nodeById = function( nId ) {
		// Find the node with the specified ID:
		
		// a) Try to find the node:
		let nd = domE.tree('getNodeById', nId);
		if( nd )
			return nd;   // return the node with the specified ID
		// b) If a node cannot be found (has been deleted), return first node, instead:
		return self.firstNode()   // default: first node
	};
	self.selectNode = function( nd ) {
		if( self.selectedNode && nd && self.selectedNode.id==nd.id )
			// no change:
			return self.selectedNode; 
		// selectNode( null ) is a valid use case:
		if( nd&&nd.id ) {
			nd = self.nodeById(nd.id);
			domE.tree('selectNode', nd )
		};
		self.selectedNode = nd;		// update the node handle; can be null
		return nd
	};
	self.selectFirstNode = function() {
		// Note: This works, only if the tree is visible.
		let fN = self.firstNode();
		if( fN ) self.selectNode( fN );
		return fN
	};
	self.selectNodeById = function( nId ) {
		// Select an arbitrary node:
		// Note: This works, only if the tree is visible.
		if( self.selectedNode && self.selectedNode.id==nId ) 
			return self.selectedNode;
		// else:
		return self.selectNode( self.nodeById( nId ) )
	};
	self.selectNodeByRef = function( oId, similar ) {
		// If an arbitrary object is specified (when clicking a link somewhere), select it's first occurrence in the tree:
		// Note: This works, only if the tree is visible.
		if( self.selectedNode && self.selectedNode.ref==oId ) 
			return self.selectedNode;
		// else:
		return self.selectNode( self.nodeByRef( oId, similar ) )
	};
	self.openNode = function( nd ):void {
		if( !nd ) nd = self.selectedNode;
		if( nd ) domE.tree('openNode', nd)
	};
	self.toggleNode = function( nd ):void {
		if( !nd ) nd = self.selectedNode;
		if( nd ) domE.tree('toggleNode', nd)
	};
	self.closeNode = function( nd ):void {
		if( !nd ) nd = self.selectedNode;
		if( nd ) domE.tree('closeNode', nd)
	};
/*	self.appendNode = function( nd, val ) {
		if( nd ) domE.tree( 'appendNode', val, nd )
	};
	self.addNodeBefore = function( nd, val ) {
		if( nd ) domE.tree( 'addNodeBefore', val, nd )
	}; 
	self.addNodeAfter = function( nd, val ) {
		if( nd ) domE.tree( 'addNodeAfter', val, nd )
	};  */
	self.updateNode = function( nd, val ):void {
		// update node nd with the properties specified in {val},
		// where val may be a title string or an object with all attributes:
		if( nd ) domE.tree('updateNode', nd, val )
	};
	self.removeNode = function( nd ):void {
		if( !nd ) nd = self.tree.selectedNode;
		if( nd ) domE.tree('removeNode', nd)
	};
	self.moveUp = function():void {
		let cur=self.selectedNode;  // save the current position
		if( !cur ) return selectFirstNode();
		
		// close open nodes behind (in this case we are coming from the next node)
		if( cur.getNextNode() && cur.getLevel()<cur.getNextNode().getLevel() ) {  
			domE.tree('closeNode', cur )
		};
		
		// if the previous node (as visible) is closed, open it, potentially over several levels:
		// (is_open is undefined, if the node does not have children, and is null, if there is no previous )
		// (is_open is also undefined, if the node hasn't been actively opened or closed, before)
		while( self.selectedNode.getPreviousNode() && self.selectedNode.getPreviousNode().children.length && !self.selectedNode.getPreviousNode().is_open) {
			domE.tree('openNode', self.selectedNode.getPreviousNode())
			if( !self.selectedNode.getPreviousNode().children.length ) return
		};

		if( cur.getPreviousNode() ) {
			domE.tree('moveUp');
		
			self.selectNode( cur.getPreviousNode() );  // the event handler does it also, but it is asynchronous
			if( self.selectedNode.getLevel()<cur.getLevel() ) {  
				domE.tree('closeNode', self.selectedNode );
			};
			while( self.selectedNode.getPreviousNode() && self.selectedNode.getPreviousNode().children.length && !self.selectedNode.getPreviousNode().is_open) {
				domE.tree('openNode', self.selectedNode.getPreviousNode());
				if( !self.selectedNode.getPreviousNode().children.length ) return
			}
		}
	};
	self.moveDown = function():void {
		let cur=self.selectedNode;  // save the current position
		if( !cur ) { self.selectFirstNode(); return };

		// close nodes behind, if open:
		while( cur.getPreviousNode() && cur.getPreviousNode().getLevel()>cur.getLevel() ) {   // 'getPreviousNode' refers to the previous visible node
			domE.tree('closeNode', cur.getPreviousNode().parent)
		};

		// if selected node has children and is closed, open it:
		if( self.selectedNode.children.length && !self.selectedNode.is_open ) {
			domE.tree('openNode', self.selectedNode);
			return
		};
		
		if( cur.getNextNode() ) {
			// if selected node has no children, step down:
			// selected node is opened, step into:
			domE.tree('moveDown');

			// if it was the last child, close the folder behind:
			self.selectNode( cur.getNextNode() );  // the event handler does it also, but it is asynchronous
			while( self.selectedNode.getPreviousNode().getLevel()>self.selectedNode.getLevel() )
				domE.tree('closeNode', self.selectedNode.getPreviousNode().parent);
			if( self.selectedNode.children.length && !self.selectedNode.is_open )
				domE.tree('openNode', self.selectedNode)
		}
	};
	self.numberize = function():void {
		// set the order numbers (such as 1.3.2):
		let oNo='';  	// tree outline number

			function setONo( nd, oNoP ):void {
				for( var k=0, K=nd.children.length; k<K; k++ ) {
					oNo = oNoP.length? oNoP+'.'+(k+1) : (k+1).toString();	// deeper levels : first level
					self.updateNode( nd.children[k], {order: oNo} );
					setONo( nd.children[k], oNo )
				}
			};
		setONo( domE.tree('getTree'), '' )	// start numberizing with the root
	};
/*	self.newIds = function( nd ) {
		// assert new ids to nd and it's sub-tree, as the server doesn't allow to reuse any ID:
		let rt = {};
		for( var p in nd ) rt[p] = nd[p];
		rt.id = genID('N-');
		self.updateNode( nd, { id: rt.id } );  // set the ID of the tree entry with it's new value
		if( nd.children && nd.children.length ) {
			rt.children = [];
			for( var i=0, I=nd.children.length; i<I; i++ ) {
				// get the first level children, then recursively their's:
				rt.children.push( self.newIds( nd.children[i] ) )  
			}
		};
		return rt
	}; */
	self.saveState = function():void {
		self.savedState = domE.tree('getState')
	};
	self.restoreState = function():void {
		domE.tree('setState', self.savedState);
		self.selectedNode = domE.tree('getSelectedNode')
	};
	self.destroy = function():void {
		// Destroy the tree. This removes the dom elements and event bindings:
		domE.tree('destroy')
	};
	
	self.init();
	return self;
}
