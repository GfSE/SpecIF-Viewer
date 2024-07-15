"use strict";
class CGraphOptions {
    constructor(opts) {
        this.index = 0;
        this.titleProperties = [];
        this.lineLength = 22;
        this.focusColor = '#6ca0dc';
        this.nodeColor = '#afcbef';
        this.edgeColor = 'black';
        this.clusterColor = '#c3daf6';
        this.fontFace = 'Arial';
        this.fontSize = '14px';
        if (typeof (opts.canvas) == 'string' && opts.canvas.length > 0) {
            for (var p in opts)
                this[p] = opts[p];
        }
        else
            throw Error('Invalid options for Statement Graph, in particular canvas to use is not identified.');
    }
}
class CGraph {
    constructor(inD) {
        this.resources = inD && Array.isArray(inD.resources) ? LIB.forAll(inD.resources, this.cpyRes) : [];
        this.statements = inD && Array.isArray(inD.statements) ? LIB.forAll(inD.statemens, this.cpySta.bind(this)) : [];
    }
    add(inD) {
        if (inD && Array.isArray(inD.resources))
            LIB.cacheL(this.resources, LIB.forAll(inD.resources, this.cpyRes));
        if (inD && Array.isArray(inD.statements))
            LIB.cacheL(this.statements, LIB.forAll(inD.statements, this.cpySta.bind(this)));
    }
    cpyRes(el) {
        return el ? {
            id: el.id,
            revision: el.revision,
            title: el.title ? LIB.xmlChar2utf8(el.title) : ''
        } : undefined;
    }
    cpySta(el) {
        let st = this.cpyRes(el);
        return st && el.subject && el.object ? Object.assign(st, {
            subject: el.subject,
            object: el.object
        }) : undefined;
    }
    resourceById(id) {
        for (var res of this.resources)
            if (res.id === id)
                return res;
        throw Error('Resource with id ' + id + ' not found in data structure of class CGraph');
    }
    statementsOrderedByType(resIdx) {
        let res = this.resources[resIdx], stC = {}, cid, oid, sid;
        this.statements.forEach((st) => {
            oid = st.object;
            sid = st.subject;
            if (sid === res.id || oid === res.id) {
                cid = st.title;
                if (!stC[cid]) {
                    stC[cid] = { targets: [], sources: [] };
                }
                ;
                if (oid === res.id)
                    stC[cid].sources.push({ resource: this.resourceById(sid), statement: st });
                else
                    stC[cid].targets.push({ resource: this.resourceById(oid), statement: st });
            }
        });
        return stC;
    }
    show(opts) {
        if (!opts || !opts.canvas)
            throw Error("Graphing of local semantic net of a resource misses specification of 'canvas'.");
        if (!opts.index || opts.index > this.resources.length - 1)
            opts.index = 0;
        let relations = this.statementsOrderedByType(opts.index);
        if (!relations)
            return;
        let nodeL = [], edgeL = [];
        let relProp = countRelationTypesAndEdges(relations), idx = pushMainNode(this.resources[opts.index]);
        for (var entry in relations) {
            if (relations.hasOwnProperty(entry) && relations[entry].sources.length)
                idx = pushChildNodesAndEdges(idx, relations[entry].sources, relProp, true);
        }
        ;
        for (var entry in relations) {
            if (relations.hasOwnProperty(entry) && relations[entry].targets.length)
                idx = pushChildNodesAndEdges(idx, relations[entry].targets, relProp, false);
        }
        ;
        let data = {
            nodes: new vis.DataSet(nodeL),
            edges: new vis.DataSet(edgeL)
        };
        let options = {
            autoResize: true,
            height: '100%',
            width: '100%',
            locale: 'en',
            clickToUse: false,
            nodes: {
                shape: "box"
            },
            edges: {
                font: {
                    align: "bottom"
                },
                smooth: {
                    type: "continuous"
                }
            },
            manipulation: {
                enabled: false
            },
            physics: {
                enabled: false
            }
        };
        let network = new vis.Network(document.getElementById(opts.canvas), data, options);
        network.getConnectedNodes("0").forEach((connectedNode) => {
            let neighbours = network.getConnectedNodes(connectedNode);
            if (neighbours.length > 5) {
                closeCluster(connectedNode, network);
            }
        });
        network.on("doubleClick", (prms) => {
            if (prms.nodes.length === 1) {
                if (prms.nodes[0] == 0)
                    return;
                if (typeof (opts.onDoubleClick) === "function"
                    && network.getConnectedNodes(prms.nodes[0]).length === 1
                    && !network.clustering.isCluster(prms.nodes[0])) {
                    let nId = prms.nodes[0].match(/.+=([\S]+)/)[1];
                    opts.onDoubleClick({ target: { resource: nId, statement: prms.edges[0] } });
                    return;
                }
                ;
                if (typeof (prms.nodes[0]) === "string" && prms.nodes[0].includes(":")) {
                    if (!network.clustering.isCluster(prms.nodes[0]))
                        return;
                }
                ;
                if (network.clustering.isCluster(prms.nodes[0])) {
                    let releaseOptions = {
                        releaseFunction: function (clusterPosition, containedNodesPositions) {
                            let newPositions = {};
                            let dist, offset;
                            let i = 0;
                            let length = Object.keys(containedNodesPositions).length - 1;
                            for (var id in containedNodesPositions) {
                                if (containedNodesPositions.hasOwnProperty(id)) {
                                    if (id === "0" || (!containedNodesPositions["0"] && !id.includes(":"))) {
                                        newPositions[id] = { x: clusterPosition.x, y: clusterPosition.y };
                                        if (id !== "0") {
                                            offset = Math.atan(clusterPosition.y / clusterPosition.x);
                                            if (clusterPosition.x < 0)
                                                offset += Math.PI;
                                            dist = 160;
                                        }
                                    }
                                    else {
                                        newPositions[id] = calculateNodePosition(i, Math.sqrt(2) * Math.PI, length, clusterPosition, dist, offset);
                                        i++;
                                    }
                                }
                            }
                            ;
                            return newPositions;
                        }
                    };
                    network.clustering.openCluster(prms.nodes[0], releaseOptions);
                }
                else {
                    closeCluster(prms.nodes[0], network);
                }
            }
        });
        return;
        function closeCluster(node, network) {
            if (node === 0) {
                network.getConnectedNodes("0").forEach((connectedNode) => {
                    closeCluster(connectedNode, network);
                });
            }
            ;
            let options = {
                joinCondition: function (nodeOptions, childNode) {
                    return childNode.id !== 0;
                },
                clusterNodeProperties: {
                    label: "",
                    color: opts.clusterColor,
                    shape: "diamond"
                }
            };
            network.clustering.clusterByConnection(node, options);
        }
        function wrap(str, maxLen) {
            if (!str || str.length < maxLen + 1)
                return str || '';
            let words = str.match(/[^-\s]+[-\s]{0,}/g), newLine = '\n', lineLength = 0, part = '', out = '';
            for (var i = 0; i < words.length; i++) {
                if (words[i].length > maxLen) {
                    part = words[i].slice(Math.round(words[i].length / 2));
                    words.splice(i + 1, 0, part);
                    words[i] = words[i].slice(0, Math.round(words[i].length / 2)) + '-';
                }
                ;
                if ((lineLength + words[i].length) < maxLen) {
                    out += words[i];
                    lineLength += words[i].length;
                }
                else {
                    out += newLine + words[i];
                    lineLength = words[i].length;
                }
            }
            ;
            return out;
        }
        function calculateNodePosition(i, sector, count, parentPos, dist, offset) {
            let pos = { x: 0, y: 0, alpha: 0 };
            let r = dist || 200;
            r = (i % 2 === 1) ? (r / 1.2) : (r * 1.2);
            let segment = sector / count;
            let alpha = (offset || 0) - sector / 2 + segment * i + segment / 2;
            pos.x = parentPos.x + r * Math.cos(alpha);
            pos.y = parentPos.y + r * Math.sin(alpha);
            pos.alpha = alpha;
            return pos;
        }
        function pushChildNodesAndEdges(idx, children, relProp, inbound) {
            let edges = inbound ? relProp.sources : relProp.targets;
            let sectorIdx = idx - (inbound ? 0 : relProp.sources) - 1;
            let offs = inbound ? (Math.PI * 1.25) : (Math.PI * 0.25);
            if (children.length < 2) {
                let pos = calculateNodePosition(sectorIdx, Math.PI, edges, { x: 0, y: 0 }, 240, offs);
                pushNodeAndEdge(idx, 0, children[0].resource, pos, children[0].statement, inbound);
            }
            else {
                let pos = calculateNodePosition(sectorIdx, Math.PI, edges, { x: 0, y: 0 }, 300, offs);
                pushNodeAndEdge(idx, 0, {}, pos, { title: children[0].statement.title }, inbound);
                let childID = 0;
                children.forEach((child) => {
                    let childPos = calculateNodePosition(childID, Math.sqrt(2) * Math.PI, children.length, pos, 160, pos.alpha);
                    let childIDString = idx + ":" + childID;
                    pushNodeAndEdge(childIDString, idx, child.resource, childPos, child.statement, false);
                    childID++;
                });
            }
            ;
            return ++idx;
        }
        function pushNodeAndEdge(idx, parentId, res, pos, rel, inbound) {
            let childId = res.id ? idx + '=' + res.id : idx;
            nodeL.push({
                id: childId,
                label: wrap(res.title, opts.lineLength),
                x: pos.x,
                y: pos.y,
                color: res.id ? opts.nodeColor : opts.clusterColor,
                shape: res.id ? "box" : "circle"
            });
            let edge = {
                from: inbound ? childId : parentId,
                to: inbound ? parentId : childId,
                arrows: parentId == 0 ? "to" : "",
                color: opts.edgeColor,
                label: parentId == 0 ? rel.title : ""
            };
            if (rel.id)
                edge.id = rel.id;
            edgeL.push(edge);
        }
        function pushMainNode(res) {
            nodeL.push({
                id: 0,
                label: wrap(res.title, opts.lineLength),
                x: 0,
                y: 0,
                color: opts.focusColor,
                font: opts.fontSize + " " + opts.fontFace + " #fff",
                shape: "box"
            });
            return 1;
        }
        function countRelationTypesAndEdges(rels) {
            let cnt = { types: 0, sources: 0, targets: 0 };
            for (let entry in rels) {
                if (rels.hasOwnProperty(entry)) {
                    if (rels[entry].targets.length)
                        cnt.targets++;
                    if (rels[entry].sources.length)
                        cnt.sources++;
                    cnt.types++;
                }
            }
            ;
            return cnt;
        }
    }
}
