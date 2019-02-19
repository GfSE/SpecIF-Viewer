///////////////////////////////
/*	Helper functions for Marco Braak's jqTree (https://mbraak.github.io/jqTree/)
	Dependencies: jQuery 2.1 and later.
	(C)copyright 2010-2017 enso managers gmbh (http://www.enso-managers.com)
	Author: se@enso-managers.com, Berlin
	License and terms of use: MIT license (http://opensource.org/licenses/MIT)
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de            
*/
// a constructor for the tree object:
function Tree( tId ) {
	"use strict";
	let self = this;
	self.init = function() {
		self.id = null;
		self.savedState = null;
		self.selectedNode = null
	};
	self.set = function( tr ) {
		self.id = tr.id;
		return $(tId).tree('loadData', tr.children)
	};
	self.get = function() {
		// return the root node with it's children:
		return $(tId).tree('getTree')
	};
	self.firstNode = function() {
		let rt = $(tId).tree('getTree');	// first get the root
		return rt? rt.children[0] : null	// avoid an exception when there is none ...
	};
	self.nodesByRef = function( obj, similar ) {
		// Find all the nodes referencing the object and return them in a list.
		// Use case: Update all tree entries after an object (title) has been changed.
		let nodes = [];
		// Try to find the objects in the currently loaded tree (selectedSpec):
		if( similar ) {
			// iterate through all nodes of all levels and list the nodes, where obj.id is a substring:
			self.get().iterate( function(nd) {
				if( nd.ref.indexOf(obj.id)>-1 ) nodes.push( nd );
				return true		// continue iteration
			})
		} else {
			nodes = $(tId).tree('getNodesByProperty', 'ref', obj.id)
		};
		return nodes
	};
	self.nodeByRef = function( obj, similar ) {
		// Find the tree node for the specified tree obj.
		// Use case: jump to a clicked object.
		// similar: the obj.id may be just a substring of the reference
		// !similar: the obj.id must be identical with the reference

		// a) Try to find the obj:
		let nodes = self.nodesByRef(obj,similar);
		if( nodes && nodes.length>0 ) { 
			return nodes[0]   // select the first occurrence in the tree
		}; 
		// b) If a node cannot be found (has been deleted), return first node, instead:
		return self.firstNode()   // default: first node
	};
	self.nodeById = function( nId ) {
		// Find the node with the specified ID:
		
		let nd = $(tId).tree('getNodeById', nId);
		if( nd )
			return nd;   // return the node with the specified ID
		// else:
		return null
	};
	self.selectNode = function( nd ) {
		if( self.selectedNode && self.selectedNode.id==nd.id ) 
			return self.selectedNode;
		// selectNode( null ) is a valid use case:
		if( nd&&nd.id ) {
			nd = self.nodeById(nd.id);
			$(tId).tree('selectNode', nd )
		};
		self.selectedNode = nd;		// update the node handle; can be null
		return nd
	};
	self.selectFirstNode = function() {
		// Anm: Das klappt nur, wenn der Baum sichtbar ist:
		let fN = self.firstNode();
		if( fN ) self.selectNode( fN );
		return fN
	};
	self.selectNodeByRef = function( obj, similar ) {
		// If an arbitrary obj is specified (when clicking a link somewhere), select it's first occurrence in the tree:
		// Anm: Das klappt nur, wenn ein Template aktiv ist, in dem der Baum sichtbar ist
		if( self.selectedNode && self.selectedNode.ref==obj.id ) return self.selectedNode;
		// else:
		self.selectNode( self.nodeByRef( obj, similar ) )
		return self.selectedNode
	};
	self.openNode = function( nd ) {
		if( !nd ) nd = self.selectedNode;
		if( !nd ) return;			
		$(tId).tree('openNode', nd)
	};
	self.toggleNode = function( nd ) {
		if( !nd ) nd = self.selectedNode;
		if( !nd ) return;			
		$(tId).tree('toggleNode', nd)
	};
	self.closeNode = function( nd ) {
		if( !nd ) nd = self.selectedNode;
		if( !nd ) return;			
		$(tId).tree('closeNode', nd)
	};
	self.appendNode = function( nd, val ) {
		if( !nd ) return;			
		$(tId).tree( 'appendNode', val, nd )
	};
	self.addNodeBefore = function( nd, val ) {
		if( !nd ) return;			
		$(tId).tree( 'addNodeBefore', val, nd )
	};
	self.addNodeAfter = function( nd, val ) {
		if( !nd ) return;			
		$(tId).tree( 'addNodeAfter', val, nd )
	};
	self.updateNode = function( nd, val ) {
		if( !nd ) return;			
		// update node nd with the properties specified in {val}:
		$(tId).tree('updateNode', nd, val )
	};
	self.removeNode = function( nd ) {
		if( !nd ) nd = self.tree.selectedNode;
		if( !nd ) return;			
		$(tId).tree('removeNode', nd)
	};
	self.moveUp = function() {
		let cur=self.selectedNode;  // save the current position
		if( !cur ) { selectFirstNode(); return };
		
		// close open nodes behind (in this case we are coming from the next node)
		if( cur.getNextNode() && cur.getLevel()<cur.getNextNode().getLevel() ) {  
			$(tId).tree('closeNode', cur )
		};
		
		// if the previous node (as visible) is closed, open it, potentially over several levels:
		// (is_open is undefined, if the node does not have children, and is null, if there is no previous )
		// (is_open is also undefined, if the node hasn't been actively opened or closed, before)
		while( self.selectedNode.getPreviousNode() && self.selectedNode.getPreviousNode().children.length && !self.selectedNode.getPreviousNode().is_open) {
			$(tId).tree('openNode', self.selectedNode.getPreviousNode())
			if( !self.selectedNode.getPreviousNode().children.length ) return
		};

		if( cur.getPreviousNode() ) {
			$(tId).tree('moveUp');
		
			self.selectNode( cur.getPreviousNode() );  // the event handler does it also, but it is asynchronous
			if( self.selectedNode.getLevel()<cur.getLevel() ) {  
				$(tId).tree('closeNode', self.selectedNode );
			};
			while( self.selectedNode.getPreviousNode() && self.selectedNode.getPreviousNode().children.length && !self.selectedNode.getPreviousNode().is_open) {
				$(tId).tree('openNode', self.selectedNode.getPreviousNode());
				if( !self.selectedNode.getPreviousNode().children.length ) return
			}
		}
	};
	self.moveDown = function() {
		let cur=self.selectedNode;  // save the current position
		if( !cur ) { self.selectFirstNode(); return };

		// close nodes behind, if open:
		while( cur.getPreviousNode() && cur.getPreviousNode().getLevel()>cur.getLevel() ) {   // 'getPreviousNode' refers to the previous visible node
			$(tId).tree('closeNode', cur.getPreviousNode().parent)
		};

		// if selected node has children and is closed, open it:
		if( self.selectedNode.children.length && !self.selectedNode.is_open ) {
			$(tId).tree('openNode', self.selectedNode);
			return
		};
		
		if( cur.getNextNode() ) {
			// if selected node has no children, step down:
			// selected node is opened, step into:
			$(tId).tree('moveDown');

			// if it was the last child, close the folder behind:
			self.selectNode( cur.getNextNode() );  // the event handler does it also, but it is asynchronous
			while( self.selectedNode.getPreviousNode().getLevel()>self.selectedNode.getLevel() )
				$(tId).tree('closeNode', self.selectedNode.getPreviousNode().parent);
			if( self.selectedNode.children.length && !self.selectedNode.is_open )
				$(tId).tree('openNode', self.selectedNode)
		}
	};
	self.numberize = function() {
		// set the order numbers (such as 1.3.2):
		let oNo='';  	// tree outline number

			function setONo( nd, oNoP ) {
				for( var k=0, K=nd.children.length; k<K; k++ ) {
					oNo = oNoP.length ? oNoP+'.'+(k+1) : (k+1).toString();	// deeper levels : first level
					self.updateNode( nd.children[k], {order: oNo} );
					setONo( nd.children[k], oNo )
				}
			};
		setONo( $(tId).tree('getTree'), '' )	// start numberizing with the root
	};
	self.newIds = function( nd ) {
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
	};
	self.saveState = function() {
		self.savedState = $(tId).tree('getState')
	};
	self.restoreState = function() {
		$(tId).tree('setState', self.savedState);
		self.selectedNode = $(tId).tree('getSelectedNode')
	};
	self.init();
	return self
}
