"use strict";
class Tree {
    constructor(options) {
        this.domE = $(options.loc);
        this.domE.tree({
            data: [],
            buttonLeft: false,
            dragAndDrop: options.dragAndDrop
        });
        for (var e in options.eventHandlers) {
            this.domE.on('tree.' + e, options.eventHandlers[e]);
        }
        ;
        this.savedState = { open_nodes: [], selected_node: [] };
        this.selectedNode = this.firstNode();
    }
    clear() {
        this.set([]);
        this.savedState = { open_nodes: [], selected_node: [] };
        this.selectedNode = undefined;
    }
    set(tr, nId) {
        let nd = undefined;
        if (typeof (nId) == 'string' && nId.length > 0)
            nd = this.nodeById(nId);
        this.domE.tree('loadData', tr, nd);
    }
    get() {
        let tr = this.domE.tree('getTree');
        return tr ? tr.children : undefined;
    }
    iterate(fn) {
        this.domE.tree('getTree').iterate(fn);
    }
    ;
    firstNode() {
        let tr = this.domE.tree('getTree');
        return tr ? tr.children[0] : undefined;
    }
    ;
    preciseRef(ref, chk) {
        return LIB.references(chk, ref);
    }
    similarRef(ref, chk) {
        return ref.id.indexOf(chk.id) > -1;
    }
    nodesByRef(k, similar) {
        let nodes = [];
        this.domE.tree('getTree').iterate((nd) => {
            if (similar ? this.similarRef(nd.ref, k) : this.preciseRef(nd.ref, k))
                nodes.push(nd);
            return true;
        });
        return nodes;
    }
    ;
    references(k, similar) {
        return this.nodesByRef(k, similar).length > 0;
    }
    ;
    nodeByRef(k, similar) {
        let nodes = this.nodesByRef(k, similar);
        if (nodes && nodes.length > 0) {
            return nodes[0];
        }
        ;
        return this.firstNode();
    }
    ;
    nodeById(nId) {
        let nd = this.domE.tree('getNodeById', nId);
        if (nd)
            return nd;
        return this.firstNode();
    }
    ;
    selectNode(nd) {
        if (this.selectedNode && nd && this.selectedNode.id == nd.id)
            return this.selectedNode;
        if (nd && nd.id) {
            nd = this.nodeById(nd.id);
            this.domE.tree('selectNode', nd);
        }
        ;
        this.selectedNode = nd;
        return nd;
    }
    selectFirstNode() {
        let fN = this.firstNode();
        if (fN)
            this.selectNode(fN);
        return fN;
    }
    ;
    selectNodeById(nId) {
        if (this.selectedNode && this.selectedNode.id == nId)
            return this.selectedNode;
        return this.selectNode(this.nodeById(nId));
    }
    ;
    selectNodeByRef(k, similar) {
        if (this.selectedNode && (similar ? this.similarRef(this.selectedNode.ref, k)
            : this.preciseRef(this.selectedNode.ref, k)))
            return this.selectedNode;
        return this.selectNode(this.nodeByRef(k, similar));
    }
    ;
    openNode(nd) {
        if (!nd)
            nd = this.selectedNode;
        if (nd && nd.children.length > 0 && !nd.is_open)
            this.domE.tree('openNode', nd);
    }
    ;
    closeNode(nd) {
        if (!nd)
            nd = this.selectedNode;
        if (nd && nd.children.length > 0 && nd.is_open)
            this.domE.tree('closeNode', nd);
    }
    ;
    updateNode(nd, val) {
        if (nd)
            this.domE.tree('updateNode', nd, val);
    }
    ;
    removeNode(nd) {
        if (!nd)
            nd = this.selectedNode;
        if (nd)
            this.domE.tree('removeNode', nd);
    }
    ;
    moveUp() {
        let cur = this.selectedNode;
        if (!cur) {
            this.selectFirstNode();
            return;
        }
        ;
        this.closeNode();
        let prv = cur.getPreviousSibling();
        if (prv) {
            let plen = prv.children.length;
            while (plen > 0) {
                this.openNode(prv);
                prv = prv.children[plen - 1];
                plen = prv.children.length;
            }
            ;
            this.domE.tree('moveUp');
        }
        else {
            this.domE.tree('moveUp');
            this.closeNode();
        }
        ;
    }
    ;
    moveDown() {
        let cur = this.selectedNode;
        if (!cur) {
            this.selectFirstNode();
            return;
        }
        ;
        if (cur != this.firstNode())
            this.closeNode(cur.getPreviousSibling());
        this.openNode();
        if (cur.getNextNode()) {
            this.domE.tree('moveDown');
            this.closeNode(this.selectedNode.getPreviousSibling());
        }
        ;
    }
    ;
    numberize() {
        let oNo = '', setONo = (nd, oNoP) => {
            for (var k = 0, K = nd.children.length; k < K; k++) {
                oNo = oNoP.length ? oNoP + '.' + (k + 1) : (k + 1).toString();
                this.updateNode(nd.children[k], { order: oNo });
                setONo(nd.children[k], oNo);
            }
        };
        setONo(this.domE.tree('getTree'), '');
    }
    ;
    saveState() {
        this.savedState = this.domE.tree('getState');
    }
    ;
    restoreState() {
        this.domE.tree('setState', this.savedState);
        this.selectedNode = this.domE.tree('getSelectedNode');
    }
    ;
    destroy() {
        this.domE.tree('destroy');
    }
    ;
}
