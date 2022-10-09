/*!	SpecIF: Semantic Graphing.
	Dependencies: vis-network
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/
interface IGraphResource {
	id: SpecifId;
	revision?: SpecifRevision;
	title: string;
}
interface IGraphStatement extends IGraphResource {
	subject: SpecifId;
	object: SpecifId;
}

class CGraph {
	resources: IGraphResource[];
	statements: IGraphStatement[];
	constructor(inD: any) {
		this.resources = inD && Array.isArray(inD.resources) ? LIB.forAll( inD.resources, this.cpyRes ) : [];
		this.statements = inD && Array.isArray(inD.statements) ? LIB.forAll(inD.statemens, this.cpySta.bind(this) ) : [];
	}
	add(inD: any) {
		if (inD && Array.isArray(inD.resources))
			LIB.cacheL(this.resources, LIB.forAll(inD.resources, this.cpyRes));
		if (inD && Array.isArray(inD.statements))
			LIB.cacheL(this.statements, LIB.forAll(inD.statements, this.cpySta.bind(this)));
	}
	private cpyRes(el: IGraphResource): IGraphResource | undefined {
		return el ? {
			id: el.id,
			revision: el.revision,
			title: el.title ? LIB.xmlChar2utf8(el.title) : ''
		} : undefined;
    }
	private cpySta(el: IGraphStatement): IGraphStatement | undefined {
		let st = this.cpyRes( el );
		return st && el.subject && el.object ? Object.assign(st, {
			subject: el.subject,
			object: el.object
		}) : undefined;
	}

    /**
    * Return the item for the given id
    * @param id the id of the item
    * @returns the item for the id or undefined if there is none
    */
    private resourceById(id: SpecifId):IGraphResource {
		for (var res of this.resources)
			if (res.id === id) return res;
		throw Error('Graph node with id '+id+' not found in data structure of class CGraph');
	}
/*  private statementById(id) {
		for(var i = graphData.statements.length-1; i>-1; i--)
			if (graphData.statements[i].id === id) return this.statements[i];
		return // undefined
	} */

    /**
    * Return an object with pattern {relationtype:{targets:[],sources:[]}} containing all targets and sources
    * related to the given resource and sorted by statement types
    * @param object The resource, where the relations are to
    * @returns json object of the statements with titles for statements, subjects and objects
    */
    statementsOrderedByType(resIdx:number) {
		let res = this.resources[resIdx],
			stC = {}, cid: string, oid: string, sid: string;
		this.statements.forEach((st: IGraphStatement) => {
			oid = st.object;
			sid = st.subject;

			if (sid === res.id || oid === res.id) {
				// all statements having the same title are clustered:
				cid = st.title;
				/*	// all statements having the same class are clustered:
					cid = st['class']; */
				// @ts-ignore - cid as string *can* be used as index:
				if (!stC[cid]) {
					// @ts-ignore - cid as string *can* be used as index:
					stC[cid] = { targets: [], sources: [] }
				};
				if (oid === res.id)
					// @ts-ignore - cid as string *can* be used as index:
					stC[cid].sources.push({ resource: this.resourceById(sid), statement: st })
				else
					// @ts-ignore - cid as string *can* be used as index:
					stC[cid].targets.push({ resource: this.resourceById(oid), statement: st })
			}
		});
		return stC;
	}
}
interface IGraphOptions {
	canvas: string;
	index?: number;
	titleProperties?: string[];
	lineLength?: number;
	focusColor?: string;
	nodeColor?: string;
	edgeColor?: string;
	clusterColor?: string;
	fontFace?: string;
	fontSize?: string;
	onDoubleClick?: Function;
}
app.vicinityGraph = function() {
	// For a selected SpecIF resource, draw a graph of all statements and related resources.
	// - Group all statements of the same type to make the reading easier.
	// - Position incoming relations (where the selected resource is object of the statement) at the upper left half,
	//   and outgoing relations (where the selected resource is subject of the statement) at the lower right half
	var self:any = {};
	self.init = () => {};
	self.clear = () => {};
	self.hide = () => {};

	self.show = function (graphData: CGraph, opts:IGraphOptions ):void {
		// Check for missing options:
		if (!opts || !opts.canvas)
			throw Error("Graphing of local semantic net of a resource misses specification of 'canvas'."); // minimum requirement

		if( !opts.index || opts.index>graphData.resources.length-1 ) opts.index = 0;
		if( !opts.titleProperties ) opts.titleProperties = [];
		if( !opts.lineLength ) opts.lineLength = 22;
		if( !opts.focusColor ) opts.focusColor = '#6ca0dc';
		if( !opts.nodeColor ) opts.nodeColor = '#afcbef';
		if( !opts.edgeColor ) opts.edgeColor = 'black';
		if( !opts.clusterColor ) opts.clusterColor = '#c3daf6';
		if( !opts.fontFace ) opts.fontFace = 'Arial';
		if( !opts.fontSize ) opts.fontSize = '14px';

		// All required parameters are available, so we can begin:
		let relations = graphData.statementsOrderedByType( opts.index );
//		console.debug('init relations',relations);
		// if there are no relations, do not create a graph:
		if ( !relations ) return;

		type IPos = {
			x: number;
			y: number;
			alpha?: number;
		}
		type ICnt = {
			types: number;
			sources: number;
			targets: number;
		}
		type INode = {
			id: number,
			label: string,
			x: number,
			y: number,
			color: string,
			font: string,
			shape: string
        }
		type IEdge = {
			id: number,
			label: string,
			from: number,
			to: number,
			arrows: string,
			color: string
		}
		let nodeL: INode[] = [],
			edgeL: IEdge[] = [];

		let relProp = countRelationTypesAndEdges(relations),
			idx = pushMainNode( graphData.resources[opts.index] );  // returns always 1
		for(var entry in relations) {
			// an iteration per relation type,
			// first the inbound relations, i.e. where the node in focus is target:
			// @ts-ignore - indexing by string works fine
			if (relations.hasOwnProperty(entry) && relations[entry].sources.length )
					// @ts-ignore - indexing by string works fine
					idx = pushChildNodesAndEdges(idx, relations[entry].sources, relProp, true)
		};
		for(var entry in relations) {
			// an iteration per relation type,
			// now the outbound relations, i.e. where the node in focus is source:
			// @ts-ignore - indexing by string works fine
			if (relations.hasOwnProperty(entry) && relations[entry].targets.length )
					// @ts-ignore - indexing by string works fine
					idx = pushChildNodesAndEdges(idx, relations[entry].targets, relProp, false)
		};

//		console.debug('rawData',nodeL,edgeL);
		let data = {
			// @ts-ignore - 'vis' is loaded at runtime
			nodes: new vis.DataSet(nodeL),
			// @ts-ignore - 'vis' is loaded at runtime
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

		// @ts-ignore - 'vis' is loaded at runtime
		let network = new vis.Network(document.getElementById(opts.canvas), data, options);
		// Collapse/close a 'large' sub-network ("cluster node"):
		// see https://github.com/GfSE/SpecIF-Graph/blob/master/src/modules/graph.js
		network.getConnectedNodes("0").forEach(function (connectedNode:any) {
			let neighbours = network.getConnectedNodes(connectedNode);
			if (neighbours.length > 5) {
				closeCluster(connectedNode, network);
			}
		});
		network.on("doubleClick", (prms:any) => {
//			console.debug("doubleClick",prms);
			if (prms.nodes.length === 1) {
				if( prms.nodes[0] == 0 ) return;  // no action for the node in focus
				if( typeof(opts.onDoubleClick)==="function"
					&& network.getConnectedNodes(prms.nodes[0]).length === 1
					&& !network.clustering.isCluster(prms.nodes[0])) {
						// it is a peripheral node with a single edge,
						// extract the node-id from 'n:m=id':
						let nId = prms.nodes[0].match(/.+=([\S]+)/)[1];
						opts.onDoubleClick({target:{resource:nId,statement:prms.edges[0]}});
						return
				};
				if (typeof(prms.nodes[0])==="string" && prms.nodes[0].includes(":")) {
					if (!network.clustering.isCluster(prms.nodes[0])) return
				};
				// else, open or close the cluster depending in its state:
				if (network.clustering.isCluster(prms.nodes[0])) {
					let releaseOptions = {
						releaseFunction: function (clusterPosition:IPos, containedNodesPositions:any) {
							let newPositions = {};
							let dist, offset;
							let i = 0;
							let length = Object.keys(containedNodesPositions).length - 1;
							for(var id in containedNodesPositions) {
								if (containedNodesPositions.hasOwnProperty(id)) {
									if (id === "0" || (!containedNodesPositions["0"] && !id.includes(":"))) {
										// @ts-ignore - index is ok:
										newPositions[id] = {x: clusterPosition.x, y: clusterPosition.y};
										if (id !== "0") {
											offset = Math.atan(clusterPosition.y / clusterPosition.x);
											if (clusterPosition.x < 0) offset += Math.PI;
											dist = 160;
										}
									}
									else {
										// @ts-ignore - index is ok:
										newPositions[id] = calculateNodePosition(
											i,
											Math.sqrt(2)*Math.PI,
											length,
											clusterPosition,
											dist,
											offset);
										i++
									}
								}
							};
							return newPositions
						}
					};
					network.clustering.openCluster(prms.nodes[0], releaseOptions)
				}
				else {
					closeCluster(prms.nodes[0], network);
				}
			}
		});
		return		// we're done ...

        /**
         * This function closes a given cluster
         * @param node A node that is a cluster
         * @param network the network the node is part of
         */
        function closeCluster(node:number, network:any) {
            if (node === 0) {
                network.getConnectedNodes("0").forEach(function (connectedNode:number) {
                    closeCluster(connectedNode, network)
                })
            };
            let options = {
				// @ts-ignore - nodeOptions is not used, but must me declared anyhow.
                joinCondition: function (nodeOptions, childNode) {
                    return childNode.id !== 0
                },
                clusterNodeProperties: {
                    label: "",
					color: opts.clusterColor,
                    shape: "diamond"
                }
            };
            network.clustering.clusterByConnection(node, options)
        }

        /**
         * wraps a text after e specific number of chars;
		 * str is undefined in case of a collapsible cluster node.
         * @param str The String that hast to be wrapped
         * @returns {string} the wrapped string
         */
        function wrap( str:string, maxLen:number ) {
            if ( !str || str.length<maxLen+1 ) return str || '';
			// separate title into single words:
			let words = str.match(/[^-\s]+[-\s]{0,}/g),  // don't like '*/', even if it is correct and working
				newLine = '\n',
				lineLength = 0,
				part = '',
				out = '';
			// simple algorithm working quite nicely with words < maxLen/2.
			for(var i=0;i<words.length;i++) {	// re-evaluate words.length every time, as it may grow while looping
				// hyphenate 'long' words:
				if( words[i].length>maxLen ) {
					part = words[i].slice(Math.round(words[i].length/2));
					words.splice(i+1,0,part);  // insert second part
					words[i] = words[i].slice(0,Math.round(words[i].length/2)) +'-'  // update first part
				};
				// combine words to lines with length<maxLen:
				if( (lineLength+words[i].length)<maxLen ) {
					out += words[i];
					lineLength += words[i].length
				}
				else {
					out += newLine + words[i];
					lineLength = words[i].length
				}
			};
			return out
        }

        /**
         * test a char if it is a whitespace
         * @param x the given char as string
         * @returns {boolean}
         */
    /*    function testWhite(x) {
            let white = new RegExp(/^\s$/);
            return white.test(x.charAt(0))
        } */

        /**
         * Returns a calculated Position for a given node
         * @param i the index of the node in the list of neighbour nodes of the parent
         * @param count The length of the list of neighbour nodes per half-circle
         * @param parentPos the position of the parent
         * @param dist the preferred distance between the parent node and this node
         * @param offset the offset angle [rad] to start the placement
         * @returns {{x: number, y: number, alpha: number}}
         */
		function calculateNodePosition(i:number, sector:number, count:number, parentPos:IPos, dist?:number, offset?:number) {

			let pos:IPos = {x: 0, y: 0, alpha: 0};
			let r = dist || 200;
			// alternate distance of neighboring nodes:
			r = (i%2 === 1)? (r/1.2):(r*1.2);

			let segment = sector/count;
			let alpha = (offset || 0) - sector/2 + segment*i + segment/2;
			pos.x = parentPos.x + r * Math.cos(alpha);
			pos.y = parentPos.y + r * Math.sin(alpha);
			pos.alpha = alpha;
//			console.debug('calculateNodePosition',i,alpha)
			return pos
		}

        /**
         * Pushes one child node and edge in the nodeL and edgeL object
         * @param idx The id of the node
         * @param nodeL The nodeL object
         * @param edgeL The childData object
         * @param children Array of all connected child nodes
         * @param rel The edge label
         * @param relProp The relation properties object
         * @param isTarget A bool that represents if it is a object or a subject relationship
         * @returns {*}
         */
        function pushChildNodesAndEdges(idx:number, children:any, relProp:ICnt, inbound:boolean):number {
			// the number of edges for the current half sector (inbound resp outbound):
			let edges = inbound? relProp.sources:relProp.targets;
			// the index for the relations in the current sector:
			let sectorIdx = idx - (inbound? 0:relProp.sources) -1;
			// position the inbound relation to the upper left side,
			// and the outbound to the lower right.
			// zero degrees is to the 'east', so inbound come from north-west and outbound go to south-east.
			let offs = inbound? (Math.PI*1.25):(Math.PI*0.25);
//			console.debug('push',relG,children,inbound)

            if ( children.length < 2 ) {
				// there is a single node related by the same type and same direction,
				// so the node is connected directly:
				let pos = calculateNodePosition( sectorIdx, Math.PI, edges, {x:0, y:0}, 240, offs );
				pushNodeAndEdge(
					idx,
					0,		// node in focus has id==0
					children[0].resource,
					pos,
					children[0].statement,
					inbound);
			}
			else {
				// there are several nodes related by the same type and same direction,
				// so there will be a cluster node:
                let pos = calculateNodePosition( sectorIdx, Math.PI, edges, {x:0, y:0}, 300, offs );
				pushNodeAndEdge(
						idx,
						0,
						{},		// cluster node
						pos,
						{title: children[0].statement.title},	// assuming that all have the same title; don't supply id!
						inbound
					);
				let childID = 0;
				children.forEach(function (child:any) {
					let childPos = calculateNodePosition(
							childID,
							Math.sqrt(2)*Math.PI,
							children.length,
							pos,
							160,
							pos.alpha
						);
					let childIDString = idx + ":" + childID;
					pushNodeAndEdge(childIDString, idx, child.resource, childPos, child.statement, false);
					childID++
				});
			};
			return ++idx
        }

        /**
         * Finally create and push the child and parent node and edge objects into the nodeL and edgeL object
         * @param id The id of the Parent node(main node or helper node)
         * @param sourceID the id of the subject the arrow comes from
         * @param targetID the id of the traget the arrow goes to
         * @param nodeL The node list
         * @param edgeL The edge list
         * @param res The new node (resource) to show
         * @param edgeLabel The edge label
         * @param pos the pos of the new node
         */
		function pushNodeAndEdge(idx: number, parentId: number, res: IGraphResource, pos: IPos, rel: IGraphStatement, inbound: boolean): void {
			// include always idx, as the same element can be shown several times and childID must be unique:
			let childId = res.id ? idx + '=' + res.id : idx;
			nodeL.push(
				{
					// cluster nodes don't have id nor label:
					id: childId,
					label: wrap(res.title, opts.lineLength),
					x: pos.x,
					y: pos.y,
					color: res.id ? opts.nodeColor : opts.clusterColor,
					shape: res.id ? "box" : "circle"
				} as INode
			);
			// show arrows and label only on edges starting at the node in focus (parentId==0),
			// but not for those in a cluster:
			let edge: IEdge = {
				from: inbound? childId:parentId,
				to: inbound? parentId:childId,
				arrows: parentId==0? "to":"",
				color: opts.edgeColor,
				label: parentId==0? rel.title : ""
			};
			if( rel.id ) edge.id = rel.id;
			edgeL.push( edge )
		}

        /**
         * push the Main Node into the nodeL array
         * @param resource = node in Focus
         * @returns {number} next index
         */
		function pushMainNode(res: IGraphResource) {
            nodeL.push(
                {
                    id: 0,
                    label: wrap( res.title, opts.lineLength ),
                    x: 0,
                    y: 0,
					color: opts.focusColor,
					font: opts.fontSize+" "+opts.fontFace+" #fff",
                    shape: "box"
                } as INode
            );
            return 1
        }

        /**
         * Returns an object containing two properties:
         * - types is the number of relation types
         * - edges is the number of edges in the future graph
		 * If a relation type has both sources and targets, types is 1 and edges is 2.
		 * If a relation type has only sources OR targets, types and edges are 1.
         * @param rels The relations object
         * @returns {{types: number, edges: number}}
         */
        function countRelationTypesAndEdges(rels:any) {
            let cnt:ICnt = {types: 0, sources: 0, targets: 0};
            for(let entry in rels) {
                if (rels.hasOwnProperty(entry)) {
                        if (rels[entry].targets.length) cnt.targets++;
                        if (rels[entry].sources.length) cnt.sources++;
                        cnt.types++
                }
            };
//			console.debug('countRelationTypesAndEdges',rels,cnt);
            return cnt
        }
    };
//	self.init();
	return self
}();
