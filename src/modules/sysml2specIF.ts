/*!	Transform SysML XMI to SpecIF
    - Parse the XMI file
	- Extract both model-elements and semantic relations in SpecIF Format
	- Model elements with same type and title are NOT consolidated by this transformation
	
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de 

	References:
	[1] S.Friedenthal et al: A Practical Guide to SysML, The MK/OMG Press, Third Edition
*/

function sysml2specif( xmi:string, options: any ):SpecIF|null {
	"use strict";

	const
		idResourceClassDiagram = app.ontology.getClassId("resourceClass", "SpecIF:View"),
		idResourceClassActor = app.ontology.getClassId("resourceClass", "FMC:Actor"),
	//	idResourceClassState = "RC-State",
	//	idResourceClassEvent = "RC-Event",
	//	idResourceClassCollection = "RC-Collection",
		idResourceClassPackage = app.ontology.getClassId("resourceClass", "uml:Package"),
	//	idResourceClassFolder = "RC-Folder",
		idResourceClassDefault = app.ontology.getClassId("resourceClass", "SpecIF:ModelElement"),
	//	idStatementClassAccesses = "SC-accesses",
		idStatementClassContains = app.ontology.getClassId("statementClass", "SpecIF:contains"),
		idStatementClassHasPart = app.ontology.getClassId("statementClass", "dcterms:hasPart"),
		idStatementClassSpecializes = app.ontology.getClassId("statementClass", "uml:Specialization"),
		idStatementClassShows = app.ontology.getClassId("statementClass", "SpecIF:shows");

	if (typeof (options) != 'object' || !options.fileName) return null;

	let opts = Object.assign(
		{
		//	titleLength: 96,
		//	textLength: 8192,
		//	strNamespace: "sysml:",
		//	modelElementClasses: [idResourceClassActor, idResourceClassState, idResourceClassEvent, idResourceClassCollection],
		//	strRoleType: "SpecIF:Role",
		//	strFolderType: "SpecIF:Heading",
		//	strDiagramType: "SpecIF:View",
		//	strAnnotationFolder: "SpecIF:Annotations",
		//	strTextAnnotation: "Text Annotation",
			mimeType: "application/vnd.xmi+xml",
			fileDate: new Date().toISOString()
		},
		options
	);
	
	var parser = new DOMParser(),
		xmiDoc = parser.parseFromString(xmi, "text/xml");

//	console.debug('xmi', xmiDoc);

	if (xmiDoc.getElementsByTagName('xmi:exporter')[0].innerHTML.includes("MagicDraw")
		&& xmiDoc.getElementsByTagName('xmi:exporterVersion')[0].innerHTML.includes("19.0"))
		return cameo2specif(xmiDoc, opts);

	return null;

	
// =======================================
// called functions:

	function cameo2specif(xmi:Document, opts:any):SpecIF {
		//	let Cs = Array.from(xmlDoc.querySelectorAll("collaboration"));
		interface IParams {
			package: string;
			nodes: SpecifNodes;
		}

		// ----- Preprocessing -----
		// 1. Create maps with stereotypes for classes und abstractions:
		function makeMap(att: any) {
			let top = xmi.getElementsByTagName('xmi:XMI')[0],
				map = new Map();
			Array.from(
				top.children,
				(ch: any) => {
					let base = ch.getAttribute(att);
					if (base) {
						map.set(base, ch.tagName);
					};
				}
			);
			return map;
		}
		let classStereotypes = makeMap("base_Class"),
			abstractionStereotypes = makeMap("base_Abstraction"),

		// ----- Processing -----
		// 2. Create project:
			modDoc = xmi.getElementsByTagName('uml:Model')[0],
			spD: CSpecIF = app.ontology.generateSpecifClasses({ domains: ["SpecIF:DomainBase", "SpecIF:DomainSystemModelIntegration"] }),

			// Intermediate storage for statements:
			usedElements: SpecifStatement[] = [],     // --> shows
			specializations: SpecifStatement[] = [],
			associations: SpecifStatement[] = [],
			abstractions: SpecifStatement[] = [];

		spD.id = modDoc.getAttribute("xmi:id");
		spD.title = [{ text: modDoc.getAttribute("name") }];

		// 3. Analyse the package structure and create a hierarchy of folders:
		Array.from(
			modDoc.children,
			ch => parseEl(ch, { package: '', nodes: spD.hierarchies })
		);

		// ----- Postprocessing -----
		// 4. Find stereotypes and specialized classes for the model elements:
		//    - traverse the tree of specialization to the top to find a class as derived from the ontology
		//    - assign the class to the model element
		specializations = specializations
			.filter(validateStatement);
		spD.resources
			.forEach(
				(me) => {
					if (me["class"].id==idResourceClassDefault ) {
						// --- Case 1: Look for	a stereotype ---
						let sTy = classStereotypes.get(me.id);
						if (sTy) {
							// Find or create a typeproperty:
							let prp = LIB.propByTitle(me, CONFIG.propClassType, spD);
							if (prp) {
								prp.values = [[{ text: sTy }]];
								console.info("Cameo Import: Assigning stereotype '" + sTy + "' to  model-element " + me.id + " with title " + me.properties[0].values[0][0].text);
							};
						};

						// --- Case 2: Look for the generalizing class in the set of resourceClasses generated from the ontology ---
						let rC = generalizingResourceClassOf(me);
						if (rC && rC.id != idResourceClassDefault ) {
							me["class"] = LIB.makeKey(rC.id);
							console.info("Cameo Import: Re-assigning class " + rC.id + " to model-element " + me.id + " with title " + me.properties[0].values[0][0].text);
							return;
						};

						// --- Case 3: Look for generalization in the ontology as loaded during startup: ---
					};
					return;

					function generalizingResourceClassOf(r: SpecifResource): SpecifResourceClass | undefined {
						// Return the resourceClass generated from the ontology having the same title as a generalizing model-element;
						// move up the chain of generalization until found.

						// Get all specialization statements of the model-element r:
						let spL = specializations.filter(
							(sp) => {
								return sp.subject.id == r.id
							}
						);
						if (spL.length > 1)
							console.warn("Cameo Import: Model-elment with id " + me.id + " specializes " + spL.length + " classes");
						for (var sp of spL) {
							let gE = LIB.itemByKey(spD.resources, sp.object),  // the generalizing model-element
								ti = LIB.getTitleFromProperties(gE.properties, spD.propertyClasses, {targetLanguage: "default"}),  // its title
								rC = LIB.itemByTitle(spD.resourceClasses, ti);  // the resourceClass generated from the ontology having the same title
							if (rC)
								return rC;
							rC = generalizingResourceClassOf(gE);
							if (rC)
								return rC;
						};
					}
				}
			);
		// 5. Find stereotypes for relations of type uml:Abstraction:
		abstractions = abstractions
			.filter(validateStatement)
			.map(
				(a) => {
					let sTy = abstractionStereotypes.get(a.id);
					if (sTy) {
						// Use a statementClass with a title equal to the stereotype sTy, if it exists:
						let sC = LIB.itemByTitle(spD.statementClasses, sTy);
						if (sC) {
							a['class'] = LIB.makeKey(sC.id);
							console.info("Cameo Import: Re-assigning class " + sC.id + " with title " + sTy + " to statement " + a.id);
						}
						else {
							// Otherwise, add a type property to the statement: 
							let prp: SpecifProperty = {
								class: LIB.makeKey("PC-Type"),
								values: [[{ text: sTy }]]
							};
							LIB.addProperty(a, prp);
							console.info("Cameo Import: Assigning stereotype " + sTy + " to statement " + a.id);
						};
					};
					return a;
				}
			);

	/*	// 6. Add the associations, skip duplicates:
		LIB.cacheL(
			spD.statements,
			associations
				.map(
					(ac: IAssociation) => {
						//	if (ac.statement.properties) console.debug('stp', ac.statement);
						return ac.statement;
					}
				)
		); */

		// 7. Add all statements:
		spD.statements = spD.statements
			.concat(associations)
			.concat(abstractions)
			.concat(specializations)
			.concat(usedElements);

		// 8. Keep only the valid statements:
		let prevLength: number;
		do {
			prevLength = spD.statements.length;
			spD.statements = spD.statements
				.filter(validateStatement);
		} while(prevLength > spD.statements.length);

		console.debug('SysML', spD, opts);
		return spD;
		// ----- End -----

		function parseEl(ch:Element,params:IParams) {
			switch (ch.tagName) {
				case "xmi:Extension":
					// One or more model diagrams:
					Array.from(
						ch.getElementsByTagName('ownedDiagram'),
						(oD:any) => {
						//	console.debug('D', oD.getAttribute("name"));
							let dg = oD.getElementsByTagName('diagram:DiagramRepresentationObject')[0];

							// Transform the diagram object:
							let r: SpecifResource = {
								id: oD.getAttribute("xmi:id"),
								class: LIB.makeKey(idResourceClassDiagram),
								properties: [{
									class: LIB.makeKey("PC-Name"),
									values: [[{ text: oD.getAttribute("name") }]]
								}, {
									class: LIB.makeKey("PC-Type"),
									values: [[{ text: oD.getAttribute("xmi:type") }]]
								}, {
									class: LIB.makeKey("PC-Notation"),
									values: [[{ text: dg.getAttribute("type") }]]
								}],
								changedAt: opts.fileDate
							};

							// Relate the diagram to the containing package:
							if(params.package)
								spD.statements.push({
									id: CONFIG.prefixS + simpleHash(params.package + idStatementClassContains + r.id),
									class: LIB.makeKey(idStatementClassContains),
									subject: LIB.makeKey(params.package),
									object: LIB.makeKey(r.id),
									changedAt: opts.fileDate
								}); 
						
							// Extract 'shows' relations:
							Array.from(
								dg.getElementsByTagName('usedElements'),
								(uE:any) => {
									usedElements.push({
										id: CONFIG.prefixS + simpleHash(r.id + idStatementClassShows + uE.innerHTML),
										class: LIB.makeKey(idStatementClassShows),
										subject: LIB.makeKey(r.id),
										object: LIB.makeKey(uE.innerHTML),
										changedAt: opts.fileDate
									})
								}
							);
							// console.debug('usedElements', simpleClone(usedElements));

							// Store the diagram object and add a referencing node to the hierarchy:
							spD.resources.push(r);
							params.nodes.push({
								id: CONFIG.prefixN + simpleHash(params.package + r.id),
								resource: LIB.makeKey(r.id),
								changedAt: opts.fileDate
							});
						}
					);
					break;
				case "packagedElement":
					let ty = ch.getAttribute("xmi:type");

					switch (ty) {
						case 'uml:Package':
							let r1: SpecifResource = makeResource(ch);
							r1["class"] = LIB.makeKey(idResourceClassPackage);
							spD.resources.push(r1);

							// Add the hierarchy node referencing the resource:
							let nd1: SpecifNode = makeNode(r1, params.package);
							params.nodes.push(nd1);

							// Recursively parse the tree;
							Array.from(
								ch.children,
								ch => parseEl(ch, { package: r1.id, nodes: nd1.nodes })
							);
							break;
						case 'uml:Class':
							let r2: SpecifResource = makeResource(ch);
							// If is an ontology term, use the corresponding class:
							let rC = LIB.itemByTitle(spD.resourceClasses, ch.getAttribute("name"));
							if (rC) {
								// The block itself has a name which is an ontology term:
								r2["class"] = LIB.makeKey(rC.id);
								console.info("Cameo Import: Assigning class " + rC.id + " to model-element " + r2.id + " with title " + r2.properties[0].values[0][0].text);
							}
							else {
								// At the end of the transformation the class will be updated, if the block's generalization is an ontology term.
								r2["class"] = LIB.makeKey(idResourceClassDefault);
							};
							addDesc(r2, ch);
							spD.resources.push(r2);

							// Add the hierarchy node referencing the resource:
							let nd2: SpecifNode = makeNode(r2, params.package);
							params.nodes.push(nd2);

							// Relate the class to the containing package:
							if (params.package)
								spD.statements.push({
									id: CONFIG.prefixS + simpleHash(params.package + idStatementClassContains + r2.id),
									class: LIB.makeKey(idStatementClassContains),
									subject: LIB.makeKey(params.package),
									object: LIB.makeKey(r2.id),
									changedAt: opts.fileDate
								});

							// Add the generalizations as specializations:
							Array.from(
								ch.getElementsByTagName('generalization'),
								(gn: any) => {
									specializations.push({
										id: gn.getAttribute("xmi:id"),
										class: LIB.makeKey("SC-UmlSpecialization"),
										subject: LIB.makeKey(r2.id),
										object: LIB.makeKey(gn.getAttribute("general")),
										changedAt: opts.fileDate
									})
								}
							);

							// Add the attributes/associations:
							Array.from(
								ch.getElementsByTagName('ownedAttribute'),
								(oA: any) => {
									let pId: string, ty: string, nm: string, cl: string, ob: string;
									switch (oA.getAttribute("xmi:type")) {
										case "uml:Property":
											pId = oA.getAttribute("xmi:id");
											ty = oA.getAttribute("aggregation");
											cl = ty == "composite" ? "SC-UmlComposition" : (ty == "shared" ? "SC-UmlAggregation" : "SC-UmlAssociation");
											ob = oA.getAttribute("type");
											nm = oA.getAttribute("name");

											// ty and ob are defined, if it is about composition, aggregation and association:
											if (ty && ob) {
												// Class references on an IBD can have a name or not, see [1] p.122:
												if (nm) {
													// The property has a name (= association role), so create a subclass/specialization and use it as object:
													spD.resources.push({
														id: pId,
														class: LIB.makeKey(idResourceClassDefault),
														properties: [{
															class: LIB.makeKey("PC-Name"),
															values: [[{ text: nm }]]
														}, {
															class: LIB.makeKey("PC-Type"),
															values: [[{ text: "uml:Class" }]]
														}],
														changedAt: opts.fileDate
													});
													specializations.push({
														id: CONFIG.prefixS + simpleHash(pId + idStatementClassSpecializes + ob),
														class: LIB.makeKey(idStatementClassSpecializes),
														subject: LIB.makeKey(pId),
														object: LIB.makeKey(ob),
														changedAt: opts.fileDate
													});
													ob = pId;
												};
												// The class' property
												// - has a name: use the newly created subclass as object
												// - has no name: use its role/type as object
												associations.push({
													//	id: CONFIG.prefixS + simpleHash(r2.id + cl + ob),
													id: oA.getAttribute("association"),
													class: LIB.makeKey(cl), // composition, aggregation or association
													subject: LIB.makeKey(r2.id),
													object: LIB.makeKey(ob),
													/*	// The class with its name may be normalized, but the type shouldn't: <-- not sure, though
														properties: [{
															class: LIB.makeKey("PC-Type"),
															values: [[{ text: LIB.itemByKey(spD.statementClasses, LIB.makeKey(cl)).title }]]
														}], */
													changedAt: opts.fileDate
												});
												//	console.debug('#', simpleClone(spD.statements));

												// The IBD lists the uml:Property as usedElement, but not the referenced class.
												// Assuming that the IBD with its usedElements has been parsed before,
												// we look for the shown property to obtain the id of the IBD and add the referenced class, if missing.
												// (If we had the id of the local IBD at hand, it would be much simpler). 
												usedElements
													.filter(
														(e) => {
															// Filter the property shown on any diagram, including the local IBD:
															return e.object.id == pId
														}
													)
													.forEach(
														(e) => {
															// For every shown property without name there shall be a shown class: 
															let stId = CONFIG.prefixS + simpleHash(e.subject.id + idStatementClassShows + ob),
																shownClass = LIB.itemByKey(usedElements, LIB.makeKey(stId));
															if (!shownClass) {
																usedElements.push({
																	id: stId,
																	class: LIB.makeKey(idStatementClassShows),
																	subject: e.subject,
																	object: LIB.makeKey(ob),
																	changedAt: opts.fileDate
																});
															};
															//	console.debug('#2',stId,shownClass,simpleClone(usedElements));
														}
													);
											}
											else {
												console.info("Cameo Import: Skipping the " + oA.getAttribute("xmi:type") + " with id " + pId + ".");
											};
											break;
										case "uml:Port":
											pId = oA.getAttribute("xmi:id");
											ty = oA.getAttribute("type");  // the id of the interface block
											nm = oA.getAttribute("name");

											// Store the port as FMC:Actor:
											spD.resources.push({
												id: pId,
												class: LIB.makeKey(idResourceClassActor),
												properties: [{
													class: LIB.makeKey("PC-Name"),
													values: [[{ text: nm }]]
												}, {
													class: LIB.makeKey("PC-Type"),
													values: [[{ text: "uml:Port" }]]
												}],
												changedAt: opts.fileDate
											});

											// Relate the port to the containing element:
											spD.statements.push({
												id: CONFIG.prefixS + simpleHash(r2.id + idStatementClassHasPart + pId),
												class: LIB.makeKey(idStatementClassHasPart),
												subject: LIB.makeKey(r2.id),
												object: LIB.makeKey(pId),
												changedAt: opts.fileDate
											});
										/*		break;
											case 
												// Add the connectors (in an IBD):
											*/
									};
								}
							);

							// Recursively parse the tree, because a uml:Class can have subordinated diagrams such as IBD:
							Array.from(
								ch.children,
								ch => parseEl(ch, { package: r2.id, nodes: nd2.nodes })
							);
							break;
						case "uml:Association":
							// Carries the association's name, if specified.
							// - The class' attribute of type uml:Property has an attribute 'association' pointing to this element, here.
							//   It is assumed that the pointer is found first.
							// ToDo: Can it happen, that the pointer is found after this element? Both are at the same level.
							let nm = ch.getAttribute("name"),
								aId = ch.getAttribute("xmi:id");
							if (nm) {
								// update the respective association: 
								let referenced = false;
								associations.forEach(
									(ac: SpecifStatement) => {
										if (aId == ac.id) {
											// The model element with aId is referenced by the current relation.
											referenced = true;

											// Add a type property to the statement:
											let prp: SpecifProperty = {
												class: LIB.makeKey("PC-Type"),
												values: [[{ text: nm }]]
											};
											LIB.addProperty(ac, prp);

											/*	// Reassign the statement class:
												let acId = ac.statement.id;
												ac.statement.id = CONFIG.prefixS + simpleHash(ac.statement.subject.id + nm + ac.statement.object.id);
												console.info("Cameo Import: Reassigning statement id " + acId + " → " + ac.statement.id+", because of its name '"+nm+"'.");
	
												let aC = LIB.itemByTitle(spD.statementClasses, nm)	// look at classes already loaded
														|| LIB.addClassesTo(nm, spD);				// look at ontology, otherwise
												if (aC) {
													// a. If a corresponding statementClass exists, assign it:
													// Note: Now the same statements are used for the content=model as for the meta-model,
													//       e.g. a BDD 'shows' an element named 'diagram', which is related to another element with an association named 'shows'.
													console.info("Cameo Import: Reassigning statementClass " + ac.statement["class"].id + " → "+aC.id+" of statement " + ac.statement.id + ".");
													ac.statement["class"] = LIB.makeKey(aC.id);
												}
												else {
													// b. Otherwise specify a subtype:
													if (!Array.isArray(ac.statement.properties))
														ac.statement.properties = [];
													ac.statement.properties.push({
														class: LIB.makeKey("PC-Type"),
														values: [[{ text: nm }]]
													});
												}  */
										}
									}
								);
								if (!referenced)
									console.info("Cameo Import: Skipping the uml:Association with id " + aId + ", because it is not referenced by a uml:Class.");
								/*	}
									else {
										console.info("Cameo Import: Skipping the packagedElement", ch, "with type", ty, ", because it has no name."); */
							};
							break;
						case "uml:Abstraction":
							// Used for sysml:refine, for example, where the type of abstraction (refinement in this case) is specified further down in an element <sysml:Refine ... />
							let sbj = ch.getElementsByTagName('client')[0].getAttribute("xmi:idref"),
								obj = ch.getElementsByTagName('supplier')[0].getAttribute("xmi:idref");
							//	console.debug('ö',sbj,obj);

							abstractions.push({
								id: ch.getAttribute("xmi:id"),
								class: LIB.makeKey("SC-SpecifRelates"),
								subject: LIB.makeKey(sbj),
								object: LIB.makeKey(obj),
								changedAt: opts.fileDate
							});
							break;
						case "uml:Profile":
							// So far, no additional info to extract ..
							break;
						case "uml:ProfileApplication":
						case "uml:Usage":
							// No idea what this is good for in terms of semantics ...
							break;
						case "uml:DataType":
						default:
							console.info("Cameo Import: Skipping the packagedElement", ch, "with name", ch.getAttribute("name"), "and type", ty, ".");
					};
			};
		}
	/*	function addClasses(termL:string[]):void {
			let newD = app.ontology.generateSpecifClasses({ terms: termL, delta: true /*, adoptOntologyDataTypes: true });
			app.standards.iterateLists(
				// @ts-ignore - ctg not used, but it needs to be specified, anyways:
				(ctg: string, listName: string) => {
					// @ts-ignore - the indexing works fine:
					LIB.cacheL(spD[listName], newD[listName]);
				}
			)
		} */
		function makeResource(el:any) {
			// @ts-ignore - class will be assigned later
			let r: SpecifResource = {
				id: el.getAttribute("xmi:id"),
				properties: [{
					class: LIB.makeKey("PC-Name"),
					values: [[{ text: el.getAttribute("name") }]]
				}, {
					class: LIB.makeKey("PC-Type"),
					values: [[{ text: el.getAttribute("xmi:type") }]]
				}],
				changedAt: opts.fileDate
			};
			return r;
		}
		function makeNode(r:SpecifResource, pck:string) {
			let nd: SpecifNode = {
				// build the id differently from the glossary to avoid duplicates:
				id: CONFIG.prefixN + simpleHash(pck + r.id),
				resource: LIB.makeKey(r.id),
				nodes: [],
				changedAt: opts.fileDate
			};
			return nd;
		}
		function addDesc(r: SpecifResource, el: any): void {
			// Add the description:
			Array.from(
				el.getElementsByTagName('ownedComment'),
				(oC: any, i: number) => {
					if (i > 0) {
						console.warn("Element " + r.id + " has more than one comment/description.");
						return;
					};
					//	if (oC.getAttribute("xmi:type") == "uml:comment") ... never gets true for some reason
					let desc = oC.getAttribute("body");
					if (desc)
						r.properties.push({
							class: LIB.makeKey("PC-Description"),
							values: [[{ text: desc }]]
						})
				}
			);
		}

		function validateStatement(st: SpecifStatement, idx: number, stL: SpecifStatement[]): boolean {
			// This is also part of the SpecIF constraint check, but rather skip a statement here than fail altogether during import.
			// Thus check:
			// - Are both subject and object listed in spD.resources or spD.statements
			// - Are the subjectClasses and objectClasses listed in the statementClass, thus eligible
			let
				stC = LIB.itemByKey(spD.statementClasses, st["class"]),
				// @ts-ignore - can join lists of different classes, here
				list = spD.resources.concat(stL),
				sbj = LIB.itemByKey(list, st.subject),
				obj = LIB.itemByKey(list, st.object),
				valid = sbj && obj;
			if (!stC) {
				console.warn("Cameo Import: Class " + st["class"].id +" for statement " + st.id + " not found.");
				return false;
			};
			if (!valid)
				console.info("Cameo Import: Skipping", stC.title, "statement " + st.id + ", because " + (sbj ? ("object " + st.object.id) : ("subject " + st.subject.id)) + " isn't listed as resource resp. statement.");
			else {
				valid = ((!stC.subjectClasses || LIB.referenceIndex(stC.subjectClasses, sbj["class"]) > -1)
					&& (!stC.objectClasses || LIB.referenceIndex(stC.objectClasses, obj["class"]) > -1))
				if (!valid)
					console.info("Cameo Import: Skipping", stC.title, "statement " + st.id + " with subject", sbj, " and object", obj, ", because they violate the statementClass.");
			};
			return valid;
		}
	}
}
