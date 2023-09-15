/*!	Transform an Open Group ArchiMate Open Exchange File to SpecIF
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de 
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/

// Parse the ArchiMate Open-Exchange file (XML) and extract both model-elements and semantic relations in SpecIF Format;
// see also: https://pubs.opengroup.org/architecture/archimate31-exchange-file-format-guide/.
// Test cases: http://www.opengroup.org/xsd/archimate/3.1/examples/
function Archimate2Specif(xmlString, options) {
	"use strict";

	const
		idResourceClassDiagram = "RC-Diagram",
		idResourceClassActor = "RC-Actor",
		idResourceClassState = "RC-State",
		idResourceClassEvent = "RC-Event",
		idResourceClassCollection = "RC-Collection",
		idResourceClassRequirement = "RC-Requirement",
		idResourceClassFolder = "RC-Folder",
		idStatementClassAccesses = "SC-accesses";

	if (typeof (options) != 'object' || !options.fileName) return null;

	let nameSpace = "ArchiMate:",
		opts = Object.assign(
		{
			fileDate: new Date().toISOString(),
			titleLength: 96,
			textLength: 8192,
		//	mimeType: "application/archimate+xml",
			strNamespace: nameSpace,
			modelElementClasses: [idResourceClassActor, idResourceClassState, idResourceClassEvent, idResourceClassCollection],
			resClassOutline: 'SpecIF:Outline',
			strFolderType: "SpecIF:Heading",
			strDiagramType: nameSpace + "Viewpoint",
			strDiagramFolderType: "SpecIF:Views",
	//		strAnnotationFolder: "Text Annotations",
	//		strRoleType: "SpecIF:Role",  
			hiddenDiagramProperties: [],
			// if false, only shown elements are included
			includeAllElements: true,
			// if true, consolidation on SpecIF import is precluded
			propertyClassesShallHaveDifferentTitles: false,
			// if false, statementClasses are altered to support all used statements
			// if true, all statements not supported by it's statementClass are ignored
			transformPermissibleStatementsOnly: false
		},
		options
	);

	let parser = new DOMParser(),
		xmlDoc = parser.parseFromString(xmlString, "text/xml");
	//	console.debug('xml',xmlDoc);

	// Get the model metadata:
	let L = Array.from(xmlDoc.querySelectorAll("model"));
	// There should be exactly one model per Open Exchange file:
	if (L.length < 1) {
		console.error("Open-Exchange file with id '", model.id, "' has no model.");
		return
	};
	/*	if( L.length>1 )
			console.warn("Open-Exchange file with id '",model.id,"' has more than one model.");  */

	var model = {};
	// The project's id and title:
	model.id = L[0].getAttribute("identifier");

	const
		//	nbsp = '&#160;', // non-breakable space
		apx = simpleHash(model.id),
		hId = 'ArchiMate-' + apx;

	// Have chosen to prefer 'nodeName' over 'tagName',
	// see: http://aleembawany.com/2009/02/11/tagname-vs-nodename/
	// see: https://stackoverflow.com/questions/4878484/difference-between-tagname-and-nodename

	model["$schema"] = "https://specif.de/v1.0/schema.json";
	model.dataTypes = DataTypes();
	model.propertyClasses = PropertyClasses();
	model.resourceClasses = ResourceClasses();
	model.statementClasses = StatementClasses();
	//	model.resources = Folders();
	model.resources = [];
	model.statements = [];

	// Include the original Archimate Open Exchange file:
	model.files = [ /*{
		id: 'F-'+simpleHash(opts.fileName),
		title: opts.fileName,
		blob: new Blob([xmlString], {type: opts.mimeType}),
		type: opts.mimeType,
		changedAt: opts.fileDate
	} */ ];

	// 1. Add attributes:
	Array.from(L[0].children,
		(ch) => {
			switch (ch.nodeName) {
				case 'name':
					model.title = truncStr(ch.innerHTML || opts.title || opts.fileName.split(".")[0], opts.titleLength, 'Title of model');
					break;
				case 'documentation':
					model.description = truncStr(ch.innerHTML, opts.textLength, 'Description of model');
			}
		}
	);

	// 2. List the defined propertyDefinitions:
	let propertyDefinitions = new Map();
	Array.from(xmlDoc.querySelectorAll("propertyDefinition"),
		(pD) => {
			let ty = pD.getAttribute("type");
			if (["string", "date", "number", "boolean"].includes(ty)) {
				let id = pD.getAttribute("identifier"),
					nm = getChildsInnerByTag(pD, "name");

				// Preclude/avoid the consolidation of disparate propertyTypes during SpecIF import:
				if (opts.propertyClassesShallHaveDifferentTitles && Array.from(propertyDefinitions.values()).includes(nm))
					nm += " (" + id + ")";

				// 2a List them in a map:
				propertyDefinitions.set(id, nm);
				// 2b create a propertyClass only, if not used to flag hidden diagrams:
				if (opts.hiddenDiagramProperties.indexOf(nm) < 0) {
					let pC = {
						id: id,
						title: nm,
						changedAt: opts.fileDate
					};
					switch (ty) {
						case 'string':
							pC.dataType = "DT-ShortString";
							break;
						case 'date':
							pC.dataType = "DT-DateTime";
							break;
						case 'number':
							// ToDo: find all instances, check the type ...
							pC.dataType = "DT-Integer";
							break;
						case 'boolean':
							pC.dataType = "DT-Boolean";
					};
					model.propertyClasses.push(pC);
				};
			}
			else
				console.warn("Skipping ArchiMate propertyDefinition of type '" + ty + "'.");
		}
	);
//	console.debug('propertyDefinitions', propertyDefinitions, model.propertyClasses);

	// 3. Transform the diagrams, i.e. Archimate views:
	let diagramsDefinedButNotYetReferencedInHierarchy = [],
		graphicallyContainsL = [];  // temporary list of implicit model-element aggregation by graphical containment.

	function isNotHidden(view) {
		// This works with 'Hide' properties defined in tool 'Archi 4.6' and probably later.
		var pL = Array.from(view.children).filter(
			(ch) => { return ch.nodeName == 'properties' }
		);
		if (pL[0]) {
			pL = Array.from(pL[0].children).filter(
				(p) => { return p.nodeName == "property" }
			);
			// pL is the list of the view's properties.
//			console.debug( 'pL', pL );
			for (var p of pL) {
				// look up the name of the referenced propertyDefinition,
				// if the name is listed in opts.hiddenDiagramProperties
				// and the property's value is "true",
				// then the diagram shall be hidden:
				if (opts.hiddenDiagramProperties.includes(propertyDefinitions.get(p.getAttribute("propertyDefinitionRef")))
					&& getChildsInnerByTag(p, "value") == "true") return false;   // => diagram is hidden!
			};
		};
		// none of the view's properties is listed;
		// show the diagram, it is not hidden:
		return true;
	}
	function storeOtherProperties(prL, res) {
		Array.from(
			prL.children,
			(pr) => {
				if (pr.nodeName == 'property') {
					let pCId = pr.getAttribute('propertyDefinitionRef'),
						val = getChildsInnerByTag(pr, 'value');

					if (pCId && val) {
						val = truncStr(val, opts.titleLength, 'Property value ' + pCId + ' of element with id ' + res.id);

						switch (pCId) {
							// Discover native properties and assign the value to those,
							// e.g.: Author, Last editor, Creation date, Date of last change.
							case 'AUTHOR':
								// used by ADOIT, perhaps others
								res.createdBy = val;
								break;
							case 'CREATION_DATE':
								// used by ADOIT, perhaps others
								res.createdAt = makeISODate(val);
								break;
							case 'LAST_EDITOR':
								// used by ADOIT, perhaps others
								res.changedBy = val;
								break;
							case 'DATE_OF_LAST_CHANGE':
								// used by ADOIT, perhaps others
								res.changedAt = makeISODate(val);
								break;
							default:
								// Certain Archimate propertyDefinitions are used to hide a view,
								// namely the ones whose names are listed in opts.hiddenDiagramProperties,
								// and are thus not transformed to a propertyClass;
								// properties referencing these can/must be skipped here.
								// In fact, execution gets here only and the if condition fails, 
								// only if the property is defined for a view, but set to 'false'.
								let pCi = indexById(model.propertyClasses, pCId);
								if (pCi > -1) {
									// Due to an error in ADOIT export it has been observed that a property has been listed twice
									// with different, but substantially equivalent propertyClasses.
									// So we store a property only, if it's propertyClass is different in terms of title and dataType
									// than any other property of that element (resource).
									// Otherwise, upon import equivalent propertyClasses would be deduplicated and the resource res
									// would have two property values with the same propertyClass, which is not permissible according
									// to the SpecIF schema.
									// If it is necessary to keep all properties, set opts.propertyClassesShallHaveDifferentTitles to 'true'.
									function isReferenced(cl, pL) {
										for (var p of pL) if (cl.id == p['class']) return true;
										return false;
									}
									let nPC = model.propertyClasses[pCi],
										pCs = model.propertyClasses
											.filter(
												(pC) => { return isReferenced(pC, res.properties) && pC.dataType == nPC.dataType && pC.title == nPC.title }
											);
									if (pCs.length < 1) {
										// This resource res does not have another property with essentially the same propertyClass as nPC, yet

										// Add keys to the resourceClass, if not yet present:
										addPropertyClassRefToResourceClassIfNotListed(res['class'], pCId);

										// Add property to the resource res at hand:
										switch (nPC.dataType) {
											case "DT-DateTime":
												res.properties.push({
													class: pCId,
													value: makeISODate(val)
												});
												break;
											default: 
												res.properties.push({
													class: pCId,
													value: val
												});
                                        }
									}
								}
						}
					}
				}
			}
		)
	}

	Array.from(xmlDoc.querySelectorAll("view"),
		(vi) => {
//			console.debug('view',vi);

			// Skip the view, if there is a propety indicating that it is hidden:
			if (isNotHidden(vi)) {

				let nodeL = [],  // list of nodes for analysis of containment by their coordinates
					diagramId = vi.getAttribute('identifier'),
					diagram = {
						id: diagramId,
						//	title: '',
						class: idResourceClassDiagram,
						properties: [],
						changedAt: opts.fileDate
					};

				function storeContainsStatement(chId, pId) {
					// temporarily store all containment relations derived from the node hierarchy,
					// which corresponds to the graphical nesting of model elements:
					let stId = "S-" + simpleHash("SC-contains" + pId + chId);
					if (indexById(model.statements, stId) < 0) {
						graphicallyContainsL.push({
							contains: {
								id: stId,
								class: "SC-contains",
								subject: pId,
								object: chId,
								changedAt: opts.fileDate
							},
							// even though implicitly, the containment is shown by this diagram:
							shows: {
								id: "S-" + simpleHash("SC-shows" + diagramId + stId),
								class: "SC-shows",
								subject: diagramId,
								object: stId,
								changedAt: opts.fileDate
							}
						});
					};
				}

				// The view's nodes are hierarchically ordered (at least in case of tool Archi):
				function storeShowsAndContainsStatements(nd, parentId) {
					// Ignore visual elements of xsi:type="Label" (Note)
					// as well as xsi:type="Container" (VisualGroup).

					let
					//	ty = nd.getAttribute('xsi:type'),
						refId = nd.getAttribute('elementRef');

					// Only nodes of xsi:type="Element" have an 'elementRef'.
					// Store a 'shows' relation; it is assumed that the referred resource will be found later on:
					if (refId) {
						addStatementIfNotListed({
							id: "S-" + simpleHash("SC-shows" + diagramId + refId),
							class: "SC-shows",
							subject: diagramId,
							object: refId,
							changedAt: opts.fileDate
						});

						// do it only for contained elements, but not for the top-level elements:
						if (parentId)
							storeContainsStatement(refId, parentId);

						// step down, only nodes of xsi:type="Element" have child nodes:
						Array.from(nd.children,
							(ch) => {
								if (ch.nodeName == 'node')
									// the current element becomes parent of the next level:
									storeShowsAndContainsStatements(ch, refId);
							}
						);
					};
				}

				// Add attributes:
				Array.from(
					vi.children,
					(ch) => {
						switch (ch.nodeName) {
							case 'name':
								diagram.title = truncStr(ch.innerHTML, opts.titleLength, 'Title of diagram with id '+diagram.id);
							/*	diagram.properties.push({
									class: "PC-Name",
									value: diagram.title
								}); */
								break;
							case 'documentation':
								diagram.properties.push({
									class: "PC-Description",
									value: truncStr(ch.innerHTML, opts.textLength, 'Description of diagram with id ' + diagram.id)
								});
								break;
							case 'properties':
								// custom properties:
								storeOtherProperties(ch, diagram);
								break;
							case 'node':
								// A node is the *graphical* representation of an Element, Note or VisualGroup;
								// so it is not stored as a SpecIF resource.
								// However, any implicit relationships through graphical containment 
								// will be discovered and stored, here:
								storeShowsAndContainsStatements(ch);
								// Some tools like ADOIT export a flat list of nodes, so the coordinates must be analysed further down:
								nodeL.push(ch);
								break;
							case 'connection':
								// A connection is the *graphical* representation of a shown relationship;
								// so it is not stored as a SpecIF statement.
								// This connection is contained in the diagram's outer loop;
								// they have xsi:type=relationship.
								// Ignore connections with xsi:type="line" used for annotations;
								// only Relationships have an attribute 'relationshipRef'.
								let refId = ch.getAttribute('relationshipRef');
								if (refId)
									addStatementIfNotListed({
										id: "S-" + simpleHash("SC-shows" + diagramId + refId),
										class: "SC-shows",
										subject: diagramId,
										object: refId,
										changedAt: opts.fileDate
									})
						};
					}
				);

				// Some tools like ADOIT export a flat list of nodes, so analyse the coordinates of all node pairs:
				let xi, yi, wi, hi, xj, yj, wj, hj;
				for (var i = 1; i < nodeL.length; i++) {
					xi = parseInt(nodeL[i].getAttribute('x'));
					yi = parseInt(nodeL[i].getAttribute('y'));
					wi = parseInt(nodeL[i].getAttribute('w'));
					hi = parseInt(nodeL[i].getAttribute('h'));
					for (var j = 0; j < i; j++) {
						xj = parseInt(nodeL[j].getAttribute('x'));
						yj = parseInt(nodeL[j].getAttribute('y'));
						wj = parseInt(nodeL[j].getAttribute('w'));
						hj = parseInt(nodeL[j].getAttribute('h'));

						if (   xi+1 > xj
							&& yi+1 > yj
							&& xi+wi < xj+wj+1
							&& yi+hi < yj+hj+1
						) {
							// NodeL[i] is graphically contained in nodeL[j]:
							storeContainsStatement(nodeL[i].getAttribute('elementRef'), nodeL[j].getAttribute('elementRef'));
						}
						else
							if (   xi < xj+1
								&& yi < yj+1
								&& xi+wi+1 > xj+wj
								&& yi+hi+1 > yj+hj
							) {
								// NodeL[j] is graphically contained in nodeL[i]:
								storeContainsStatement(nodeL[j].getAttribute('elementRef'), nodeL[i].getAttribute('elementRef'));
							}
					};
				};

				diagram.properties.push({
					class: "PC-Type",
					value: opts.strDiagramType
				});
				// Store the Archimate viewpoint:
				let vp = vi.getAttribute('viewpoint');
				if (vp)
					diagram.properties.push({
						class: "PC-Notation",
						value: vp
					});

				// ToDo: Add image reference to the diagram resource (but we need to export/find the image, first);
				//       so far, we must add them manually after import. 

				model.resources.push(diagram);
				diagramsDefinedButNotYetReferencedInHierarchy.push(diagramId);
			};
		}
	);

	// 4. Transform the model elements as SpecIF resources:
	Array.from(xmlDoc.querySelectorAll("element"),
		(el) => {
			let r = {
				id: el.getAttribute('identifier'),
				//	title: '',
				properties: [],
				changedAt: opts.fileDate
			},
				ty = el.getAttribute('xsi:type');

			// Determine the resourceClass:
			switch (ty) {
				case "Stakeholder":
				case 'BusinessActor':
				case 'BusinessRole':
				case 'BusinessCollaboration':
				case 'BusinessInterface':
				case 'BusinessProcess':
				case 'BusinessFunction':
				case 'BusinessInteraction':
				case 'BusinessService':
				case 'ApplicationComponent':
				case 'ApplicationCollaboration':
				case 'ApplicationInterface':
				case 'ApplicationFunction':
				case 'ApplicationInteraction':
				case 'ApplicationProcess':
				case 'ApplicationService':
				case 'Node':
				case 'Equipment':
				case 'Facility':
				case 'Device':
				case 'SystemSoftware':
				case 'Path':
				case 'CommunicationNetwork':
				case "DistributionNetwork":
				case 'TechnologyCollaboration':
				case 'TechnologyInterface':
				case 'TechnologyFunction':
				case 'TechnologyProcess':
				case 'TechnologyInteraction':
				case 'TechnologyService':
				case "OrJunction":
				case "AndJunction":
					r['class'] = idResourceClassActor
					break;
				case "Assessment":
				case "Goal":
				case 'Capability':
				case 'BusinessObject':
				case 'Contract':
				case 'Representation':
				case "Material":
				case 'Product':
				case 'DataObject':
				case 'Artifact':
				case "WorkPackage":
				case "Deliverable":
				case "Plateau":
				case "Gap":
				case "Outcome":
				case "Principle":
				case "Meaning":
				case "Value":
					r['class'] = idResourceClassState;
					break;
				case 'BusinessEvent':
				case 'ApplicationEvent':
				case 'TechnologyEvent':
				case 'ImplementationEvent':
					r['class'] = idResourceClassEvent;
					break;
				case 'Location':
				case 'Grouping':
					r['class'] = idResourceClassCollection;
					break;
				case 'Requirement':
				case 'Constraint':
					r['class'] = idResourceClassRequirement;
					break;
				default:
					// The Archimate element with tag  extensionElements  and title  <empty string>  has not been transformed.
					console.warn("Skipping element with unknown xsi:type '" + ty + "'.");
				//	r['class'] = "RC-Paragraph";  // better than nothing .. but the element will not appear in the glossary!
			};

			if (r['class']
				&& (opts.includeAllElements || isShown(r))) {
				// a. Add title and description:
				Array.from(
					el.children,
					(ch) => {
						switch (ch.nodeName) {
							case 'name':
								r.title = truncStr(ch.innerHTML, opts.titleLength, 'Title of resource with id ' + r.id);
							/*	r.properties.push({
									class: "PC-Name",
									value: r.title
								}); */
								break;
							case 'documentation':
								r.properties.push({
									class: "PC-Description",
									value: truncStr(ch.innerHTML, opts.textLength, 'Description of resource with id ' + r.id)
								});
						};
					}
				);

				// b. Store the Archimate element-type as third property:
				r.properties.push({
					class: "PC-Type",
					value: opts.strNamespace + ty
				});

				// c. Store custom properties:
				Array.from(
					el.children,
					(ch) => {
						switch (ch.nodeName) {
							case 'properties':
								storeOtherProperties(ch, r);
						};
					}
				);

				model.resources.push(r);
			};
		}
	);

	// 5. Transform the relations:
	Array.from(xmlDoc.querySelectorAll("relationship"),
		(rs) => {
			let s = {
				id: rs.getAttribute('identifier'),
				subject: rs.getAttribute('source'),
				object: rs.getAttribute('target'),
				properties: [],
				changedAt: opts.fileDate
			},
				ty = rs.getAttribute('xsi:type');

			// Determine the statementClass:
			switch (ty) {
				case 'Access':
					switch (rs.getAttribute('accessType')) {
						case 'Write':
							s['class'] = "SC-writes";
							break;
						case 'Read':
							s['class'] = "SC-reads";
							break;
						case 'ReadWrite':
						case 'Access':
							s['class'] = idStatementClassAccesses;
					};
					break;
				case 'Serving':
					s['class'] = "SC-serves";
					break;
				case 'Influence':
					s['class'] = "SC-influences";
					break;
				case 'Triggering':
				//		s['class'] = "SC-triggers";
				case 'Flow':
					s['class'] = "SC-precedes";
					break;
				// The "uniting" relationships:
				case 'Composition':
				//	s['class'] = "SC-isComposedOf";
				case 'Aggregation':
				//	s['class'] = "SC-isAggregatedBy";
				case 'Realization':
				//	s['class'] = "SC-realizes";
				case 'Assignment':
				//	s['class'] = "SC-isAssignedTo";
					s['class'] = "SC-contains";
					break;
				case 'Specialization':
					s['class'] = "SC-isSpecializationOf";
					break;
				case 'Association':
					s['class'] = "SC-isAssociatedWith";
					s.isUndirected = !rs.getAttribute('isDirected');
					break;
				default:
					// The Archimate element with tag  extensionElements  and title  <empty string>  has not been transformed.
					console.warn('Relationship: Unknown xsi:type ', ty)
			};

			// Store a relation, only if it has a known class and when both subject and object have been recognized:
			if (s['class']
				/*	// include only relations between available resources:
					&& indexById(model.resources,s.subject)>-1
					&& indexById(model.resources,s.object)>-1  */
				// include only relations which are shown on at least one visible diagram (suppress relations only shown on hidden diagrams);
				// Note: A relation like "realizes", which is implicit in some diagrams, is accepted by isShown().
				&& (opts.includeAllElements || isShown(s))) {
				// Additional attributes such as title and description:
				Array.from(rs.children,
					// if a relation does not have a name, the statementClass' title acts as default value.
					(ch) => {
						switch (ch.nodeName) {
							case 'name':
								s.title = truncStr(ch.innerHTML, opts.titleLength, 'Title of statement with id ' + s.id);
								break;
							case 'documentation':
								s.description = truncStr(ch.innerHTML, opts.textLength, 'Description of statement with id ' + s.id);
							/*	s.properties.push({
									class: "PC-Description",
									value: s.description
								}); */
						}
					}
				);
				s.properties.push({
					class: "PC-Type",
					value: opts.strNamespace + ty
				});
				addStatementIfNotListed(s);
			}
			else {
				// Archimate (or at least the tool Archi) allows relations from or to a relation;
				// in this transformation we don't ...
				// except for 'shows' relations, see definition of "SC-shows" below.
				console.info("Skipping relation (statement) with id='" + s.id + "' of xsi:type=\"" + ty + "\", because it is not shown on a visible diagram.");
				// delete all "shows" statements pointing at this statement:
				for (var i = model.statements.length - 1; i > -1; i--)
					if (model.statements[i]["class"] == "SC-shows"
						&& model.statements[i].object == s.id)
						model.statements.splice(i, 1);
			};
		}
	);
	// Now add all implicit statements derived from graphical nesting,
	// unless an equivalent statement has already been created from an explicit composition or aggregation.
	// graphicallyContainsL holds pairs of contains and shows statements:
	graphicallyContainsL.forEach(
		(stPair) => {
			let equivalentRel = addStatementIfNotListed(stPair.contains);
			if (equivalentRel) {
				// there is already an explicit, but potentially hidden statement, for example one of the 'unites' relations
				// including realization, composition, aggregation and assignment (the relation may or may not be explicitly shown)
				// So check, whether it has already a shows relation:
				stPair.shows.object = equivalentRel.id;
				addStatementIfNotListed(stPair.shows);
			}
			else {
				addStatementIfNotListed(stPair.shows);
				console.info('Added an implicit \'contains\' statement with subject="' + stPair.contains.subject
					+ '" and object="' + stPair.contains.object + '".');
			};
		}
	);

	// Check the relations;
	// relations can reference skipped relations, so the check is repeated until no more statements are removed:
	let removed;
	do {
		removed = false;
		for (var i = model.statements.length - 1; i > -1; i--) {
			let st = model.statements[i];
			// Check the statement consistency. 
			// So far only problems with "shows" statements have been encountered, and so it is sufficient to check the objects.
			// However, the subjects are checked, as well, to be on the 'safe side':
			if (indexById(model.resources, st.subject) < 0
				//	&& indexById( model.statements, st.subject )<0  .. no statement will ever appear as a subject, here
				|| indexById(model.resources, st.object) < 0
				&& indexById(model.statements, st.object) < 0) {
				console.warn('Skipping statement '
					+ ' with id="' + st.id
					+ '" of class="' + st["class"]
					+ '" with subject="' + st.subject
					+ '" and object="' + st.object
					+ '", because subject or object are not listed.');
				// remove any statement which is not consistent:
				model.statements.splice(i, 1);
				removed = true;
			}
			else {
				if (opts.transformPermissibleStatementsOnly) {
					if (!isStatementPermissible(st)) {
						console.warn('Skipping statement '
							+ ' with id="' + st.id
							+ '" of class="' + st["class"]
							+ '" with subject="' + st.subject
							+ '" and object="' + st.object
							+ '", because the subject or object class is not listed with the statement class.');
						// remove any statement which is not consistent:
						model.statements.splice(i, 1);
						removed = true;
					};
				}
				else {
					extendStatementClassIfNecessary(st);
				}
			}
		};
	} while (removed);

	// 6. Add the resource for the hierarchy root:
	model.resources.push({
		id: hId,
		title: model.title,
		class: idResourceClassFolder,
		properties: [{
		/*	class: "PC-Name",
			value: model.title
		},{ */
			class: "PC-Description",
			value: model.description || ''
		},{
			class: "PC-Type",
			value: opts.resClassOutline
		}],
		changedAt: opts.fileDate
	});
	// Add the tree:
	model.hierarchies = NodeList(model.resources);
	
//	console.debug('Archimate',model);
	return model;


// =======================================
// called functions:	

	// The hierarchy with pointers to all resources:
	function NodeList(resL) {
		const
			diagramFolder = {
				id: "FolderDiagrams-" + apx,
				class: idResourceClassFolder,
				title: opts.strDiagramFolderType,
				properties: [{
				/*	class: "PC-Name",
					value: opts.strDiagramFolderType
				}, {
					class: "PC-Description",
					value: getChildsInnerByTag(ch, "documentation") || ''
				}, { */
					class: "PC-Type",
					value: opts.strDiagramFolderType
				}],
				changedAt: opts.fileDate
			},
			diagramFolderNode = {
				id: "N-" + simpleHash("FolderDiagrams-" + apx),
				resource: "FolderDiagrams-" + apx,
				nodes: [],
				changedAt: opts.fileDate
			};

		// a) First create the hierarchy list with the hierarchy root:
		let nodeL =  [{
			id: "H-"+hId,
			resource: hId,
			nodes: [],
			changedAt: opts.fileDate
		}];

		// b) Add the folders and the diagrams to the hierarchy:

			function createFolderWithNode(ch, rL, nL) {
				let ti = getChildsInnerByTag(ch, "label"),
					dsc = getChildsInnerByTag(ch, "documentation") || '',
					idRef = "Folder-" + simpleHash(ti + apx);

				ti = truncStr(ti, opts.titleLength, 'Title of folder with id ' + idRef);

				// create the folder resource:
				rL.push({
					id: idRef,
					class: idResourceClassFolder,
					title: ti,
					properties: [{
					/*	class: "PC-Name",
						value: ti
					}, { */
						class: "PC-Description",
						value: truncStr(dsc, opts.textLength, 'Description of folder with id ' + idRef)
					}, {
						class: "PC-Type",
						value: opts.strFolderType
					}],
					changedAt: opts.fileDate
				});
				// create the node referencing the folder:
				nL.push({
					id: "N-" + simpleHash(idRef),
					resource: idRef,
					nodes: [],
					changedAt: opts.fileDate
				});
			}
			function parseItem(ch,resL,ndL) {
				if(ch.nodeName=="item") {
					let idRef = ch.getAttribute("identifierRef");
					if (idRef) {
//						console.debug('#5a', ch, idRef, indexById(model.resources,idRef));
						// It is a diagram reference; 
						// it should have been transformed before,
						// so no resource needs to be crated.
						// However, create hierarchy node, if the diagram is available,
						// (a view may be hidden and excluded from transformation):
						if (indexById(model.resources, idRef) > -1) {
							// reference the view:
							ndL.push({
								id: "N-" + simpleHash(idRef),
								resource: idRef,
								nodes: [],
								changedAt: opts.fileDate
							});
							// remove referenced view from the list:
							diagramsDefinedButNotYetReferencedInHierarchy.splice(diagramsDefinedButNotYetReferencedInHierarchy.indexOf(idRef), 1);
						};
					}
					else {
//						console.debug('#5b', ch );
						// It is another folder,
						// create the resource:
						createFolderWithNode( ch, resL, ndL);

						// step down to get children:
						Array.from(ch.children, 
							(ch)=>{parseItem( ch, resL, ndL[ndL.length-1].nodes )}
						);
					};
				};
			}

		// Since not all tools export an <organizations> section (e.g. ADOIT, at least not always),
		// it is first tried to extract the folder hierarchy with references to the views from an <organizations> section
		// ... and the remaining diagrams are added subsequenty.
		// Ideal is, if all views=diagrams are referenced in the <organizations> section (as does Archi).
		if (diagramsDefinedButNotYetReferencedInHierarchy.length > 0) {
			// create the folder resource:
			resL.push(diagramFolder);
			// create the hierarchy node: nodeL[0].nodes[0]:
			nodeL[0].nodes.push(diagramFolderNode);
		};
		Array.from( xmlDoc.querySelectorAll("organizations"),
			(org)=>{
				Array.from( org.children,
					(ch)=>{
						if(ch.nodeName=="item")
							switch(	getChildsInnerByTag(ch,"label")) {
								case "Views":
									// We've got the 'Views' folder;
									// 1. Add the description of the 'Views' folder to the diagramFolder, if there is any:
									// ToDo
									// 2. get the <item> subfolders:
									Array.from( ch.children,
										(ch) => { parseItem(ch, resL, nodeL[0].nodes[0].nodes) }
									);
								case "Relations":
									// Relations cannot yet be displayed as pert of the hierarchy
									break;
							/*	case "Business":
								case "Application":
								case "Technology &amp; Physical":
								case "Other": */
								default:
									// Add a list of model elements per category as listed in <organizations>.
									// a. Create a folder object and it's reference in the hierarchy:
									createFolderWithNode(ch, resL, nodeL[0].nodes);
									// b. Add the items to new folder in the hierarchy:
									Array.from( ch.children,
										(ch2) => {
											if (ch2.nodeName == "item") {
												let idRef = ch2.getAttribute("identifierRef");
												// add to the folder created just above:
												nodeL[0].nodes[nodeL[0].nodes.length-1].nodes.push({
													id: "N-" + simpleHash(idRef),
													resource: idRef,
													changedAt: opts.fileDate
												});
											};
										}
									);
							}
					}
				);
			}
		);
		// Defined diagrams which have not been referenced in an <organizations> section:
		diagramsDefinedButNotYetReferencedInHierarchy.forEach(
			(idRef) => {
				// add to diagramFolderNode:
				if (indexById(model.resources, idRef) > -1)
					nodeL[0].nodes[0].nodes.push({
						id: "N-" + simpleHash(idRef),
						resource: idRef,
						nodes: [],
						changedAt: opts.fileDate
					});
			}
		);

	/*	// c) Add Actors, States and Events to the respective folders in alphabetical order:
		if( resL.length>1 )
			resL.sort( function(bim, bam) {
						bim = bim.title.toLowerCase();
						bam = bam.title.toLowerCase();
						return bim==bam ? 0 : (bim<bam ? -1 : 1) 
			});
		resL.forEach( function(r) { 
			let nd = {
				id: simpleHash("N-"+r.id),
				resource: r.id,
				changedAt: opts.fileDate
			};
			// sort resources according to their type:
			let idx = opts.modelElementClasses.indexOf( r['class'] );
			if( idx>-1 )
				nodeL[0].nodes[1].nodes[idx].nodes.push(nd)
		}); */
		return nodeL
	};

	// The dataTypes should correspond to standards.ts:
	function DataTypes() {
		return [{
			id: "DT-ShortString",
			title: "String ["+opts.titleLength+"]",
			description: "String with max. length "+opts.titleLength,
			type: "xs:string",
			maxLength: opts.titleLength,
			changedAt: "2016-05-26T08:59:00+02:00"
		},{
			id: "DT-Text",
			title: "Plain or formatted Text",
			description: "A text string, plain, or formatted with XHTML or markdown",
			type: "xs:string",
			changedAt: "2021-02-14T08:59:00+02:00"
		}, {
			id: "DT-DateTime",
			title: "Date or Timestamp",
			description: "Date or Timestamp in ISO-Format",
			type: "xs:dateTime",
			changedAt: "2016-05-26T08:59:00+02:00"
		}, {
			id: "DT-Integer",
			title: "Integer",
			description: "A numerical integer value from -32768 to 32768.",
			type: "xs:integer",
		//	minInclusive: CONFIG.minInteger,
		//	maxInclusive: CONFIG.maxInteger,
			changedAt: "2016-05-26T08:59:00+02:00"
		}, {
			id: "DT-Boolean",
			title: "Boolean",
			description: "The Boolean data type.",
			type: "xs:boolean",
			changedAt: "2016-05-26T08:59:00+02:00"
		}]
	}
	
	// The property classes should correspond to standards.ts:
	function PropertyClasses() {
		return [{
			id: "PC-Name",
			title: "dcterms:title",
			dataType: "DT-ShortString",
			changedAt: opts.fileDate
		},{
			id: "PC-Description",
			title: "dcterms:description",
			dataType: "DT-Text",
			changedAt: opts.fileDate
		},{
			id: "PC-Diagram",
			title: "SpecIF:Diagram",
			dataType: "DT-Text",
			changedAt: opts.fileDate
		},{
			id: "PC-Notation",
			title: "SpecIF:Notation",
			dataType: "DT-ShortString",
			changedAt: opts.fileDate
		},{
			id: "PC-Type",
			title: "dcterms:type",
			dataType: "DT-ShortString",
			changedAt: opts.fileDate
		}]
	}
	
	// The resource classes should correspond to standards.ts:
	function ResourceClasses() {
		return [{
			id: idResourceClassDiagram,
			title: "SpecIF:View",
			description: "A 'View' is a graphical model view with a specific communication purpose, e.g. a business process or system composition.",
			instantiation: ["user"],
			propertyClasses: ["PC-Name","PC-Description","PC-Diagram","PC-Type","PC-Notation"],
			icon: "&#9635;",
			changedAt: opts.fileDate
		},{
			id: idResourceClassActor,
			title: "FMC:Actor",
			description: "An 'Actor' is a fundamental model element type representing an active entity, be it an activity, a process step, a function, a system component or a role.",
			instantiation: ["auto"],
			propertyClasses: ["PC-Name","PC-Description","PC-Type"],
			icon: "&#9632;",
			changedAt: opts.fileDate
		},{
			id: idResourceClassState,
			title: "FMC:State",
			description: "A 'State' is a fundamental model element type representing a passive entity, be it a value, a condition, an information storage or even a physical shape.",
			instantiation: ["auto"],
			propertyClasses: ["PC-Name","PC-Description","PC-Type"],
			icon: "&#9679;",
			changedAt: opts.fileDate
		},{
			id: idResourceClassEvent,
			title: "FMC:Event",
			description: "An 'Event' is a fundamental model element type representing a time reference, a change in condition/value or more generally a synchronisation primitive.",
			instantiation: ["auto"],
			propertyClasses: ["PC-Name","PC-Description","PC-Type"],
			icon: "&#11047;",
			changedAt: opts.fileDate
		},{
			id: idResourceClassCollection,
			title: "SpecIF:Collection",
			instantiation: ["auto"],
			description: "A 'Collection' is an arbitrary group of resources linked with a SpecIF:contains statement. It corresponds to a 'Group' in BPMN Diagrams.",
			propertyClasses: ["PC-Name","PC-Description","PC-Type"],
			icon: "&#11034;",
			changedAt: opts.fileDate
		},{
			id: idResourceClassRequirement,
			title: "IREB:Requirement",
			description: "A 'Requirement' is a singular documented physical and functional need that a particular design, product or process must be able to perform.",
			icon: "&#8623;",
			instantiation: ["auto","user"],
			propertyClasses: ["PC-Name","PC-Description","PC-Type"],
			changedAt: "2021-02-22T08:59:00+02:00"
		},{
			id: idResourceClassFolder,
			title: opts.strFolderType,
			description: "Folder with title and text for chapters or descriptive paragraphs.",
			isHeading: true,
			instantiation: ["auto","user"],
			propertyClasses: ["PC-Name","PC-Description","PC-Type"],
			changedAt: "2016-05-26T08:59:00+02:00"
	/*	},{
			id: "RC-Paragraph",
			title: "SpecIF:Paragraph",
			description: "Information with title and text for descriptive paragraphs.",
			instantiation: ["auto","user"],
			propertyClasses: ["PC-Name","PC-Description","PC-Type"],
			changedAt: "2020-12-04T18:59:00+01:00"
		},{  
			id: "RC-Note",
			title: "SpecIF:Note",
			description: "A 'Note' is additional information by the author referring to any resource.",
			propertyClasses: ["PC-Description","PC-Type"],
			changedAt: opts.fileDate  */
		}]
	}
	// The statement classes should correspond to standards.ts;
	// Archimate is not very precise about relations, so in many cases there is no specification
	// of eligible resourceClasses or statementClasses for subjects and objects (deactivated with //?):
	function StatementClasses() {
		return [{
			id: "SC-shows",
			title: "SpecIF:shows",
			description: "Statement: Plan shows Model-Element",
			instantiation: ["auto"],
			propertyClasses: ["PC-Type"],
			subjectClasses: [idResourceClassDiagram],
		//?	objectClasses: opts.modelElementClasses.concat(["SC-contains", "SC-writes", "SC-reads", "SC-precedes", "SC-isSpecializationOf", "SC-serves", "SC-influences", "SC-isAssociatedWith" ]),
			changedAt: opts.fileDate
		},{
			id: "SC-contains",
			title: "SpecIF:contains",
			description: "Statement: Model-Element contains Model-Element",
			instantiation: ["auto"],
			propertyClasses: ["PC-Type"], // may hold sub-type UML:Composition or UML:Aggregation
			subjectClasses: opts.modelElementClasses,
			objectClasses: opts.modelElementClasses,
			changedAt: opts.fileDate
		},{
			id: "SC-writes",
			title: "SpecIF:writes",
			description: "Statement: Actor (Role, Function) writes State (Information).",
			instantiation: ["auto"],
			propertyClasses: ["PC-Type"],
			subjectClasses: [idResourceClassActor, idResourceClassEvent],
			objectClasses: [idResourceClassState],
			changedAt: opts.fileDate
		},{
			id: "SC-reads",
			title: "SpecIF:reads",
			description: "Statement: Actor (Role, Function) reads State (Information)",
			instantiation: ["auto"],
			propertyClasses: ["PC-Type"],
			subjectClasses: [idResourceClassActor, idResourceClassEvent],
			objectClasses: [idResourceClassState],
			changedAt: opts.fileDate
		},{
			id: "SC-accesses",
			title: "ArchiMate:accesses",
			description: "Statement: Actor (Role, Function) writes and reads State (Information).",
			instantiation: ["auto"],
			propertyClasses: ["PC-Type"],
			subjectClasses: [idResourceClassActor, idResourceClassEvent],
			objectClasses: [idResourceClassState],
			changedAt: opts.fileDate
	/*	},{
			id: "SC-isComposedOf",
			title: "UML:Composition",
			description: "Statement: A state (data-object) is composed of a state",
			instantiation: ["auto"],
			subjectClasses: [idResourceClassState],
			objectClasses: [idResourceClassState],
			changedAt: opts.fileDate
		},{
			id: "SC-isAggregatedBy",
			title: "UML:Aggregation",
			description: "Statement: A state (data-object) is aggregated by a state",
			instantiation: ["auto"],
			subjectClasses: [idResourceClassState],
			objectClasses: [idResourceClassState],
			changedAt: opts.fileDate
		},{
			id: "SC-realizes",
			title: "SpecIF:realizes",
			description: "Statement: An entity plays a critical role in the creation, achievement, sustenance, or operation of a more abstract entity.",
			instantiation: ["auto"],
			subjectClasses: [idResourceClassActor],
			objectClasses: [idResourceClassActor],
			changedAt: opts.fileDate
		},{
			// ToDo: Make more specific with respect to subjectClasses and objectClasses, if possible
			id: "SC-isAssignedTo",
			title: "SpecIF:isAssignedTo",
			description: "Statement: The allocation of responsibility, performance of behavior, or execution",
			instantiation: ["auto"],
		//?	subjectClasses: opts.modelElementClasses,
		//?	objectClasses: opts.modelElementClasses,
			changedAt: opts.fileDate */
		},{ 
			id: "SC-isSpecializationOf",
			title: "UML:isSpecializationOf",
			description: "Statement: A state (data-object) is a specialization of a state",
			instantiation: ["auto"],
			propertyClasses: ["PC-Type"],
		//?	subjectClasses: [idResourceClassState],
		//?	objectClasses: [idResourceClassState],
			changedAt: opts.fileDate
		},{
			id: "SC-serves",
			title: "ArchiMate:serves",
			description: "Statement: An element provides its functionality to another element.",
			instantiation: ["auto"],
			propertyClasses: ["PC-Type"],
			subjectClasses: [idResourceClassActor],
			objectClasses: [idResourceClassActor],
			changedAt: opts.fileDate
		},{
			id: "SC-influences",
			title: "SpecIF:influences",
			description: "Statement: An element affects the implementation or achievement of some motivation element.",
			instantiation: ["auto"],
			propertyClasses: ["PC-Type"],
		//?	subjectClasses: [idResourceClassState],
		//?	objectClasses: [idResourceClassActor,idResourceClassState],
			changedAt: opts.fileDate
		},{
			id: "SC-isAssociatedWith",
			title: "UML:isAssociatedWith",
			description: "Statement: Actor (Component,Function) is associated with an Actor (Component,Function).",
			instantiation: ["auto"],
			propertyClasses: ["PC-Type"],
		//?	subjectClasses: [idResourceClassActor],
		//?	objectClasses: [idResourceClassActor],
			changedAt: opts.fileDate
		},{
			id: "SC-precedes",
			title: "SpecIF:precedes",
			description: "A FMC:Actor 'precedes' a FMC:Actor; e.g. in a business process or activity flow.",
			instantiation: ["auto"],
			propertyClasses: ["PC-Type"],
			subjectClasses: [idResourceClassActor, idResourceClassEvent],
			objectClasses: [idResourceClassActor, idResourceClassEvent],
			changedAt: opts.fileDate
	/*	},{
			id: "SC-signals",
			title: "SpecIF:signals",
			description: "A FMC:Actor 'signals' a FMC:Event.",
			instantiation: ["auto"],
			propertyClasses: ["PC-Type"],
		//?	subjectClasses: [idResourceClassActor, idResourceClassEvent],
		//?	objectClasses: [idResourceClassEvent],
			changedAt: opts.fileDate
		},{
			id: "SC-triggers",
			title: "SpecIF:triggers",
			description: "A temporal or causal relationship between elements.",
			instantiation: ["auto"],
			propertyClasses: ["PC-Type"],
		//?	subjectClasses: [idResourceClassEvent],
		//?	objectClasses: [idResourceClassActor],
			changedAt: opts.fileDate
		},{
			id: "SC-refersTo",
			title: "SpecIF:refersTo",
			description: "A SpecIF:Comment, SpecIF:Note or SpecIF:Issue 'refers to' any other resource.",
			instantiation: ["auto"],
			propertyClasses: ["PC-Type"],
			subjectClasses: ["RC-Note"],
			objectClasses: [idResourceClassDiagram].concat(opts.modelElementClasses),
			changedAt: opts.fileDate  */
		}]
	}
	
// =======================================
// some helper functions:	

	// Make a very simple hash code from a string:
	// http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
	function simpleHash(str) {
		for (var r = 0, i = 0; i < str.length; i++)r = (r << 5) - r + str.charCodeAt(i), r &= r;
		return r;
	};
	function indexById(L,id) {
		if( L && id ) {
			// given an ID of an item in a list, return it's index:
			id = id.trim();
			for( var i=L.length-1;i>-1;i-- )
				if( L[i].id==id ) return i   // return list index 
		};
		return -1;
	}
	function itemById(L, id) {
		if (L && id) {
			// given an ID of an item in a list, return it's index:
			id = id.trim();
			for (var l of L)
				if (l.id == id) return l   // return list item 
		};
	//	return; // undefined
	}
	function getChildsInnerByTag(itm,tag) {
		// Get innerHTML of the child with the given nodeName:
		for (var l of Array.from(itm.children) ) {
			if( l.nodeName==tag ) return l.innerHTML;
		};
		return "";
	}
	function truncStr(orig, mxLen, errT) {
		// ADOIT adds single spaces to empty lines causing trouble for the markdown parser:
		let str = orig.replace(/^\s\n/gm,'\n');
		if (str && str.length > mxLen) {
			console.warn(errT + ' has been truncated because it is too long');
			return str.slice(0, mxLen)
		};
		return str;
	}
	function isShown(item) {
		// Some Archimate structural relationships ("uniting") can be implicit and are accepted:
		if( ["SC-contains"].includes(item['class']) ) return true;
		// accept shown items:
		for( var s of model.statements )
			if( s["class"]=="SC-shows"
				&& s.object==item.id ) return true
		return false;	
	}
	function addStatementIfNotListed(nS) {
		// There is a special case: When a principle realizes a goal and the principle is
		// graphically contained in the goal, there are two 'contains' relationships in
		// the opposite direction, thus contradictory.
		// So, it is refrained from adding a new relationship, if there is one already
		// for the respective model elements, no matter which direction.
		// This is OK, because the first entry is based on an explicit relation and
		// an entry based on graphical analysis is added later.
		for( var s of model.statements ) 
			if(		s["class"] == nS["class"]
				&&	(
						s.subject == nS.subject && s.object == nS.object
					|| s.subject == nS.object && s.object == nS.subject
					)
			)
				return s;
		// not found, so add:
		model.statements.push( nS );
	//	return undefined
	}
	function addPropertyClassRefToResourceClassIfNotListed(rCId, pCId) {
		let rC = itemById(model.resourceClasses, rCId);
		if (!rC.propertyClasses.includes(pCId)) rC.propertyClasses.push(pCId);
	}
	function extendStatementClassIfNecessary(st) {
		if (st['class'] == "SC-shows") return;
		// in Archimate, all statements except "SC-shows" have only resources as subject or object:
		let sC = itemById(model.statementClasses, st['class']),
			subC = itemById(model.resources, st.subject)['class'],
			obC = itemById(model.resources, st.object)['class'];
		// Add a subjectClass, if a statement has a subject with class which is not yet listed;
		// if the statementClass has no subjectClasses, subjects of all classes are eligible:
		if (sC.subjectClasses && !sC.subjectClasses.includes(subC)) {
			console.info('Adding resourceClass="' + subC 
				+ '" of subject="' + st.subject
				+ 'of statement="' + st.id
				+ (st.title ? " with title '" + st.title + "' " : "")
				+ '" to the statementClass\' subject class.');
			sC.subjectClasses.push(subC);
		};
		// Add an objectClass, if a statement has an object with class which is not yet listed;
		// if the statementClass has no objectClasses, objects of all classes are eligible:
		if (sC.objectClasses && !sC.objectClasses.includes(obC)) {
			console.info('Adding resourceClass="' + obC
				+ '" of subject="' + st.object
				+ 'of statement="' + st.id
				+ (st.title ? " with title '" + st.title + "' " : "")
				+ '" to the statementClass\' object class.');
			sC.objectClasses.push(obC);
		};
	}
	function isStatementPermissible(st) {
		if (st['class'] == "SC-shows") return true;
		// check if the classes of a statement's subject and object are listed 
		// in it's class subjectClasses resp. objectClasses, return a boolean value;
		// in Archimate, all statements except "SC-shows" have only resources as subject or object:
		let sC = itemById(model.statementClasses, st['class']),
			subC = itemById(model.resources, st.subject)['class'],
			obC = itemById(model.resources, st.object)['class'];
		return ((!sC.subjectClasses || sC.subjectClasses.includes(subC))
			&& (!sC.objectClasses || sC.objectClasses.includes(obC)));
	}
	function makeISODate(str) {
		// repair faulty time-zone from ADOIT (add missing colon between hours and minutes):
		return str.replace(
			/(\d\+|\d-)(\d\d)(\d\d)$/,
			(match, $1, $2, $3) => {
				return $1 + $2 + ':' + $3;
			});
	}
}
