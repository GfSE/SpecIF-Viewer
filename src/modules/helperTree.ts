/*!	Helper functions for Marco Braak's jqTree (https://mbraak.github.io/jqTree/)
	Dependencies: jQuery 3.1 and later.
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/
interface JQuery {
	tree: Function;
}
interface jqTreeNode {
	id: string;
	name: string;
	order: string;
	ref: any;
	parent: jqTreeNode;
	children: jqTreeNode[];
	is_open: boolean;
	getLevel: Function;
	getPreviousSibling: Function;
	getPreviousNode: Function;
	getPreviousVisibleNode: Function;
	getNextVisibleNode: Function;
	getNextNode: Function;
	getNextSibling: Function;
}
interface jqTreeState {
	open_nodes: string[];
	selected_node: string[];
}
// a constructor for the tree object:
class Tree {
	domE:JQuery;
	savedState: jqTreeState;
	selectedNode: jqTreeNode;
	constructor(options: any) {
		// options.loc is the id of a DOM element to which the tree is attached.
		this.domE = $(options.loc);
		this.domE.tree({
			data: [],
		//	saveState: true,
			//  in SpecIF.default.css, remove overriding css declaration in case of buttonLeft:true !
			buttonLeft: false,
			dragAndDrop: options.dragAndDrop
		});
		for (var e in options.eventHandlers) {
			this.domE.on(
				'tree.' + e,
				options.eventHandlers[e]
			)
		};
		this.savedState = { open_nodes: [], selected_node: [] };
		this.selectedNode = this.firstNode();
	}
	clear(): void {
		this.set([]);
		this.savedState = { open_nodes: [], selected_node: [] };
		// @ts-ignore - undefined is assigned on purpose
		this.selectedNode = undefined;
	}
	set(tr: jqTreeNode[], nId?:string ):void {
		let nd=undefined;
		if( typeof(nId)=='string' && nId.length>0 ) nd = this.nodeById(nId);
		// insert tr as a subtree, if nd is defined, or as a tree, otherwise:
		this.domE.tree('loadData', tr, nd);
		// this.selectedNode may be invalid
	}
	get(): jqTreeNode[] {
		// return the list of root nodes with their subtree:
		let tr = this.domE.tree('getTree');
		return tr? tr.children : undefined
	}
	iterate(fn:Function) {
		// apply the function fn to every node of the tree,
		// the node is handed in as a call parameter function(node) {},
		// if the return parameter is 'true', the iteration descends to the children:
		this.domE.tree('getTree').iterate( fn )
	};
	firstNode(): jqTreeNode {
		let tr = this.domE.tree('getTree');	// first get the root
//		console.debug('firstNode',tr);
		return tr? tr.children[0] : undefined	// avoid an exception when there is none ...
	};
/*	rootNode(nd: jqTreeNode): jqTreeNode {
		// return the root node of the given node:
		if( !nd ) nd = this.selectedNode;
		// step up until the parent is the jqTree root node; it has no id:
		while( nd.parent.id ) {
			nd = nd.parent;
		};
		return nd;
	}; */
	private preciseRef(ref: SpecifKey, chk: SpecifKey):boolean {
		return LIB.references(chk, ref);
    }
	private similarRef(ref: SpecifKey, chk: SpecifKey):boolean {
		return ref.id.indexOf(chk.id) > -1;
	}
	nodesByRef(k:SpecifKey, similar?: boolean):jqTreeNode[] {
		// Find all the nodes referencing the object and return them in a list.
		// Use case: Update all tree entries after an object (title) has been changed.
		let nodes: jqTreeNode[] = [];
		// Try to find the objects in the currently loaded tree:

		// iterate through all nodes of all levels and list the nodes, where oId is a substring:
		this.domE.tree('getTree').iterate((nd: jqTreeNode) => {
			if (similar? this.similarRef(nd.ref, k) : this.preciseRef(nd.ref, k) )
				nodes.push(nd);
			return true	// continue iteration
		});
		return nodes
	};
	references(k:SpecifKey, similar?: boolean):boolean {
		// Does the tree reference a resource with the given id?
		return this.nodesByRef(k,similar).length>0
	};
	nodeByRef(k: SpecifKey, similar?: boolean): jqTreeNode {
		// Find the tree node for the specified tree obj.
		// Use case: jump to a clicked object.
		// similar: the object id may be just a substring of the reference
		// !similar: the object id must be identical with the reference

		// a) Try to find the object:
		let nodes = this.nodesByRef(k,similar);
		if( nodes && nodes.length>0 ) { 
			return nodes[0]   // select the first occurrence in the tree
		}; 
		// b) If a node cannot be found (has been deleted), return first node, instead:
		return this.firstNode()   // default: first node
	};
	nodeById(nId: string): jqTreeNode {
		// Find the node with the specified ID:
		
		// a) Try to find the node:
		let nd = this.domE.tree('getNodeById', nId);
		if( nd )
			return nd;   // return the node with the specified ID
		// b) If a node cannot be found (has been deleted), return first node, instead:
		return this.firstNode()   // default: first node
	};
	selectNode(nd: jqTreeNode): jqTreeNode {
		if( this.selectedNode && nd && this.selectedNode.id==nd.id )
			// no change:
			return this.selectedNode; 
		// selectNode( null ) is a valid use case:
		if( nd&&nd.id ) {
			nd = this.nodeById(nd.id);
			this.domE.tree('selectNode', nd )
		};
		this.selectedNode = nd;		// update the node handle; can be null
		return nd
	}
	selectFirstNode(): jqTreeNode {
		// Note: This works, only if the tree is visible.
		let fN = this.firstNode();
		if( fN ) this.selectNode( fN );
		return fN
	};
	selectNodeById(nId: string): jqTreeNode {
		// Select an arbitrary node:
		// Note: This works, only if the tree is visible.
		if( this.selectedNode && this.selectedNode.id==nId ) 
			return this.selectedNode;
		// else:
		return this.selectNode( this.nodeById( nId ) )
	};
	selectNodeByRef(k: SpecifKey, similar?: boolean): jqTreeNode {
		// If an arbitrary object is specified (when clicking a link somewhere), select it's first occurrence in the tree:
		// Note: This works only if the tree is visible.
		if (this.selectedNode && (similar ? this.similarRef(this.selectedNode.ref, k)
										: this.preciseRef(this.selectedNode.ref, k)))
			return this.selectedNode;
		// else:
		return this.selectNode( this.nodeByRef( k, similar ) )
	};
	openNode(nd?: jqTreeNode ):void {
		if( !nd ) nd = this.selectedNode;
		if (nd && nd.children.length > 0 && !nd.is_open )
			this.domE.tree('openNode', nd)
	};
/*	toggleNode(nd?: jqTreeNode ):void {
		if( !nd ) nd = this.selectedNode;
		if (nd && nd.children.length>0)
			this.domE.tree('toggle', nd)
	}; */
	closeNode(nd?: jqTreeNode ):void {
		if( !nd ) nd = this.selectedNode;
		if (nd && nd.children.length > 0 && nd.is_open )
			this.domE.tree('closeNode', nd)
	};
/*	appendNode( nd, val ) {
		if( nd ) this.domE.tree( 'appendNode', val, nd )
	};
	addNodeBefore( nd, val ) {
		if( nd ) this.domE.tree( 'addNodeBefore', val, nd )
	}; 
	addNodeAfter( nd, val ) {
		if( nd ) this.domE.tree( 'addNodeAfter', val, nd )
	};  */
	updateNode(nd: jqTreeNode, val:object ):void {
		// update node nd with the properties specified in val={tag:value},
		// where val may be a title string or an object with all attributes:
		if( nd ) this.domE.tree('updateNode', nd, val )
	};
	removeNode(nd: jqTreeNode ):void {
		if( !nd ) nd = this.selectedNode;
		if( nd ) this.domE.tree('removeNode', nd)
	};
	moveUp(): void {
		// starting from the selected node, creep backwards opening all nodes, if they have children
		// - to the previous sibling, if it has no children
		// - to the last child of the previous sibling, if it exists
		// - in fact to the last successor having no children, as deep as it gets.
		let cur = this.selectedNode;  //  keep in mind the current position
		if (!cur) { this.selectFirstNode(); return };

		// close open node below
		this.closeNode();
		// with jqtree v1.8.0 getPreviousNode brings results depending on whether the previous nodes are opened or closed, thus a workaround:
		let prv = cur.getPreviousSibling();
		if (prv) {
			// current node is *not* first of siblings (children), so the previous sibling exists:
			let plen = prv.children.length;
			while (plen > 0) {
				this.openNode(prv);
				prv = prv.children[plen - 1];
				plen = prv.children.length;
			};
			this.domE.tree('moveUp');
		}
		else {
			// current node is first of siblings (children), so the previous sibling does not exist:
			this.domE.tree('moveUp');
			this.closeNode();
		};

	/*	This has worked until jqtree 1.6.3, but not any more with v1.8.0
	 *	// close open nodes below (in this case we are coming from the next node)
		// @ts-ignore - cur has a value, here
		if (cur.getNextNode() && cur.getLevel() < cur.getNextNode().getLevel()) {
			this.domE.tree('closeNode', cur )
		};
		
		// if the previous node (as visible) is closed, open it, potentially over several levels:
		// (is_open is undefined, if the node does not have children, and is null, if there is no previous )
		// (is_open is also undefined, if the node hasn't been actively opened or closed, before)
		while( this.selectedNode.getPreviousNode() && this.selectedNode.getPreviousNode().children.length && !this.selectedNode.getPreviousNode().is_open) {
			this.domE.tree('openNode', this.selectedNode.getPreviousNode())
			if( !this.selectedNode.getPreviousNode().children.length ) return
		};

		if( cur.getPreviousNode() ) {
			this.domE.tree('moveUp');
		
			this.selectNode( cur.getPreviousNode() );  // the event handler does it also, but it is asynchronous
			if( this.selectedNode.getLevel()<cur.getLevel() ) {  
				this.domE.tree('closeNode', this.selectedNode );
			};
			while( this.selectedNode.getPreviousNode() && this.selectedNode.getPreviousNode().children.length && !this.selectedNode.getPreviousNode().is_open) {
				this.domE.tree('openNode', this.selectedNode.getPreviousNode());
				if( !this.selectedNode.getPreviousNode().children.length ) return
			}
		} */
	};
	moveDown():void {
		// starting from the selected node, creep forward opening all nodes, if they have children
		// - to the next sibling, if the current node has no children
		// - to the first child of the current node, if it exists
		let cur=this.selectedNode;  // keep in mind the current position
		if (!cur) { this.selectFirstNode(); return };

		if( cur != this.firstNode())
			this.closeNode(cur.getPreviousSibling());
		this.openNode();
		if (cur.getNextNode()) {
			this.domE.tree('moveDown');
			this.closeNode(this.selectedNode.getPreviousSibling());
		};

	/*	This has worked until jqtree 1.6.3, but not any more with v1.8.0
		// close nodes behind, if open:
		while( cur.getPreviousNode() && cur.getPreviousNode().getLevel()>cur.getLevel() ) {   // 'getPreviousNode' refers to the previous visible node
			this.domE.tree('closeNode', cur.getPreviousNode().parent)
		};

		// if selected node has children and is closed, open it:
		if( this.selectedNode.children.length && !this.selectedNode.is_open ) {
			this.domE.tree('openNode', this.selectedNode);
			return;
		};
		
		if( cur.getNextNode() ) {
			// if selected node has no children, step down;
			// and if selected node is opened, step into:
			this.domE.tree('moveDown');

			// if it was the last child, close the folder behind:
			this.selectNode( cur.getNextNode() );  // the event handler does it also, but it is asynchronous
			while( this.selectedNode.getPreviousNode().getLevel()>this.selectedNode.getLevel() )
				this.domE.tree('closeNode', this.selectedNode.getPreviousNode().parent);
			if( this.selectedNode.children.length && !this.selectedNode.is_open )
				this.domE.tree('openNode', this.selectedNode)
		}  */
	};
	numberize():void {
		// set the order numbers (such as 1.3.2):
		let oNo = '',  	// tree outline number
			setONo = (nd: jqTreeNode, oNoP:string ):void =>{
				for( var k=0, K=nd.children.length; k<K; k++ ) {
					oNo = oNoP.length? oNoP+'.'+(k+1) : (k+1).toString();	// deeper levels : first level
					this.updateNode( nd.children[k], {order: oNo} );
					setONo( nd.children[k], oNo )
				}
			};
		setONo( this.domE.tree('getTree'), '' )	// start numberizing with the root
	};
	saveState():void {
		this.savedState = this.domE.tree('getState')
	};
	restoreState():void {
		this.domE.tree('setState', this.savedState);
		this.selectedNode = this.domE.tree('getSelectedNode')
	};
	destroy():void {
		// Destroy the tree. This removes the dom elements and event bindings:
		this.domE.tree('destroy')
	};
}
