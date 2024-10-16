﻿/*!	Transform SysML XMI to SpecIF
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
		idResourceClassDiagram = "RC-SpecifView",
		idResourceClassActor = "RC-Actor",
		idResourceClassState = "RC-State",
		idResourceClassEvent = "RC-Event",
		idResourceClassCollection = "RC-Collection",
	//	idResourceClassFolder = "RC-Folder",
		idResourceClassDefault = "RC-SpecifModelelement",
	//	idStatementClassAccesses = "SC-accesses",
		idStatementClassContains = "SC-DctermsHaspart",
		idStatementClassShows = "SC-shows";

	if (typeof (options) != 'object' || !options.fileName) return null;

	let opts = Object.assign(
		{
			fileDate: new Date().toISOString(),
			titleLength: 96,
			textLength: 8192,
			mimeType: "application/vnd.xmi+xml",
			strNamespace: "SysML:",
			modelElementClasses: [idResourceClassActor, idResourceClassState, idResourceClassEvent, idResourceClassCollection],
			strRoleType: "SpecIF:Role",
			strFolderType: "SpecIF:Heading",
			strDiagramType: "SpecIF:View",
		//	strAnnotationFolder: "SpecIF:Annotations",
			strTextAnnotation: "Text Annotation"
		},
		options
	);
	
	var parser = new DOMParser(),
		xmiDoc = parser.parseFromString(xmi, "text/xml");

	console.debug('xmi', xmiDoc);

	if (xmiDoc.getElementsByTagName('xmi:exporter')[0].innerHTML.includes("MagicDraw")
		&& xmiDoc.getElementsByTagName('xmi:exporterVersion')[0].innerHTML.includes("19.0"))
		return cameo2specif(xmiDoc, opts);

	return null;

	
// =======================================
// called functions:

	function cameo2specif(xmi:Document, opts:any):SpecIF {
		//	let Cs = Array.from(xmlDoc.querySelectorAll("collaboration"));
		interface IAssociation {
			association: string;
			statement: SpecifStatement;
		}
		interface IParams {
			package: string;
			nodes: SpecifNodes;
		}

		var modDoc = xmi.getElementsByTagName('uml:Model')[0],
			spD: SpecIF = app.ontology.generateSpecifClasses({ domains: ["SpecIF:DomainBase", "SpecIF:DomainSystemModelIntegration"] });

		spD.id = modDoc.getAttribute("xmi:id");
		spD.title = [{ text: modDoc.getAttribute("name") }];

		// Intermediate storage for statements:
		let usedElements: SpecifStatement[] = [],     // --> shows
			specializations: SpecifStatement[] = [],
			associations: IAssociation[] = [];

		// 1. Analyse the package structure and create a hierarchy of folders:
		Array.from(
			modDoc.children,
			ch => parseEl(ch, { package: undefined, nodes: spD.hierarchies })
		);

		// 2. Find specialized classes for the model elements:
		//    - traverse the tree of specialization to the top to find a class as derived from the ontology
		//    - assign the class to the model element
		specializations = specializations
			.filter(validateStatement);
		spD.resources
			.forEach(
				(me) => {
					if (me["class"].id==idResourceClassDefault ) {
						// --- Case 1: Look for the generalizing class in the set of resourceClasses generated from the ontology ---
						let rC = generalizingResourceClassOf(me);
						if (rC && rC.id != idResourceClassDefault ) {
							me["class"] = LIB.makeKey(rC.id);
							console.info("Cameo Import: Re-assigning class " + rC.id + " to model-element " + me.id + " with title " + me.properties[0].values[0][0].text);
							return;
						};

						// --- Case 2: Look for generalization in the ontology as loaded during startup: ---
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

		// 3. Add the associations, skip duplicates:
		LIB.cacheL(
			spD.statements,
			associations
				.map(
					(ac: IAssociation) => {
						//	if (ac.statement.properties) console.debug('stp', ac.statement);
						return ac.statement;
					}
				)
		);

		// 4. Add remaining statements and keep only the valid ones:
		spD.statements = usedElements
			.concat(spD.statements)
			.filter(validateStatement)
			.concat(specializations);  // has already been validated

		console.debug('SysML', spD, opts);
		return spD;

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
								id: CONFIG.prefixN + r.id,
								resource: LIB.makeKey(r.id),
								changedAt: opts.fileDate
							});
						}
					);
					break;
				case "packagedElement":
					let ty = ch.getAttribute("xmi:type"),
						// @ts-ignore - class will be assigned further down
						r: SpecifResource = {
							id: ch.getAttribute("xmi:id"),
							properties: [{
								class: LIB.makeKey("PC-Name"),
								values: [[{ text: ch.getAttribute("name") }]]
							},{
								class: LIB.makeKey("PC-Type"),
								values: [[{ text: ty }]]
							}],
							changedAt: opts.fileDate
						},
						nd = {
							id: CONFIG.prefixN + r.id,
							resource: LIB.makeKey(r.id),
							nodes: [],
							changedAt: opts.fileDate
						};

					// Recursively parse the tree;
					// must be located here, because not only a uml:Package, but also a uml:Class can have subordinated diagrams (IBD, ..): 
					Array.from(
						ch.children,
						ch => parseEl(ch, { package: r.id, nodes: nd.nodes })
					);

					switch (ty) {
						case 'uml:Package':
							r["class"] = LIB.makeKey(idResourceClassCollection);   // or "RC-UmlPackage" - but it is not listed in the glossary, so far
							spD.resources.push(r);
							params.nodes.push(nd);
							break;
						case 'uml:Class':
							// If is an ontology term, use the corresponding class:
							let rC = LIB.itemByTitle(spD.resourceClasses, ch.getAttribute("name"));
							if (rC) {
								// The block itself has a name which is an ontology term:
								r["class"] = LIB.makeKey(rC.id);
								console.info("Cameo Import: Assigning class " + rC.id + " to model-element " + r.id + " with title " + r.properties[0].values[0][0].text);
							}
							else {
								// At the end of the transformation the class will be updated, if the block's generalization is an ontology term.
								r["class"] = LIB.makeKey(idResourceClassDefault);
							};
							spD.resources.push(r);
							params.nodes.push(nd);

							// Relate the class to the containing package:
							if(params.package)
								spD.statements.push({
									id: CONFIG.prefixS + simpleHash(params.package + idStatementClassContains + r.id),
									class: LIB.makeKey(idStatementClassContains),
									subject: LIB.makeKey(params.package),
									object: LIB.makeKey(r.id),
									changedAt: opts.fileDate
								});

							// Add the generalizations as specializations:
							Array.from(
								ch.getElementsByTagName('generalization'),
								(gn: any) => {
									specializations.push({
										id: gn.getAttribute("xmi:id"),
										class: LIB.makeKey("SC-UmlIsspecializationof"),
										subject: LIB.makeKey(r.id),
										object: LIB.makeKey(gn.getAttribute("general")),
										changedAt: opts.fileDate
									})
								}
							);

							// Add the attributes/associations:
							Array.from(
								ch.getElementsByTagName('ownedAttribute'),
								(oA: any) => {
									switch (oA.getAttribute("xmi:type")) { 
										case "uml:Property":
											let pId = oA.getAttribute("xmi:id"),
												ty = oA.getAttribute("aggregation"),
												cl = ty == "composite" ? "SC-UmlIscomposedof" : (ty == "shared" ? "SC-UmlAggregates" : "SC-UmlIsassociatedwith"),
												ob = oA.getAttribute("type"),
												nm = oA.getAttribute("name");

											// If it is about composition, aggregation and association, ob is defined:
											if (ob) {
												// Class references on an IBD can have a name or not, see [1] p.122:
												if (nm) {
													// The property has a name, so create a subclass/specialization and use it as object:
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
														id: CONFIG.prefixS + simpleHash(pId + "SC-UmlIsspecializationof" + ob),
														class: LIB.makeKey("SC-UmlIsspecializationof"),
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
													// The attribute 'association' points to a 'uml:Association' which may specify a name of the association
													association: oA.getAttribute("association"),
													statement: {
														id: CONFIG.prefixS + simpleHash(r.id + cl + ob),
														class: LIB.makeKey(cl), // composition, aggregation or association
														subject: LIB.makeKey(r.id),
														object: LIB.makeKey(ob),
													/*	// The class with its name may be normalized, but the type shouldn't: <-- not sure, though
														properties: [{
															class: LIB.makeKey("PC-Type"),
															values: [[{ text: LIB.itemByKey(spD.statementClasses, LIB.makeKey(cl)).title }]]
														}], */
														changedAt: opts.fileDate
													}
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
												console.info("Cameo Import: Skipping the packagedElement", pId, "with name", nm, ".");
											};
											break;
										case "uml:Port":
									};
								}
							);
							break;
						case "uml:Association":
							// Carries the association's name, if specified.
							// - The class' attribute of type uml:Property has an attribute 'association' pointing to this element, here.
							let nm = ch.getAttribute("name"),
								aId = ch.getAttribute("xmi:id");
							if (nm) {
								// update the respective association: 
								associations.forEach(
									(ac: IAssociation) => {
										if (aId == ac.association) {
											// The model element with aId is referenced by the current relation.

											// Add a name property to the statement:
											let prp: SpecifProperty = {
												class: LIB.makeKey("PC-Type"),
												values: [[{ text: nm }]]
											};
											if (ac.statement.properties)
												ac.statement.properties.push(prp)
											else
												ac.statement.properties = [prp];

											// There may be associations between the same classes with different name:
											ac.statement.id = CONFIG.prefixS + simpleHash(ac.statement.subject.id + ac.statement["class"] + ac.statement.object.id + nm);

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
								)
							};
							break;
						case "uml:ProfileApplication":
							// No idea what this is goof for in terms of semantics ...
							break;
						case "uml:DataType":
						default:
							console.info("Cameo Import: Skipping the packagedElement",ch,"with name", ch.getAttribute("name"), "and type",ty,".");
					}
			}
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
		function validateStatement(st: SpecifStatement):boolean {
			// This is also part of the SpecIF constraint check, but rather skip a statement here than fail altogether during import.
			// Thus check:
			// - Are both subject and object listed in spD.resources or spD.statements
			// - Are the subjectClasses and objectClasses listed in the statementClass, thus eligible
			let
				stC = LIB.itemByKey(spD.statementClasses, st["class"]),
				// @ts-ignore - can join lists of different classes, here
				sbj = LIB.itemByKey(spD.resources.concat(spD.statements), st.subject),
			// @ts-ignore - can join lists of different classes, here
				obj = LIB.itemByKey(spD.resources.concat(spD.statements), st.object),
				valid = sbj && obj;
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
