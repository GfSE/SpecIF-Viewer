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

	var xhr: xhrMessage;

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
		idStatementClassComprises = app.ontology.getClassId("statementClass", "uml:Composition"),
		idStatementClassAggregates = app.ontology.getClassId("statementClass", "uml:Aggregation"),
		idStatementClassSpecializes = app.ontology.getClassId("statementClass", "uml:Specialization"),
		idStatementClassRealizes = app.ontology.getClassId("statementClass", "uml:Realization"),
		idStatementClassAssociatedWith = app.ontology.getClassId("statementClass", "uml:Association"),
		idStatementClassShows = app.ontology.getClassId("statementClass", "SpecIF:shows"),
		idStatementClassDefault = app.ontology.getClassId("statementClass", "SpecIF:relates");

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
		return new xhrMessage(0, '', 'text', cameo2specif(xmiDoc, opts));

	return new xhrMessage(899, 'Cameo Import: Input file is not supported');

	
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
			models = xmi.getElementsByTagName('uml:Model'), // in case of a model
			packgs = xmi.getElementsByTagName('uml:Package'), // in case of a shared model
			modDoc = models.length>0? models[0] : packgs[0],
			spD: CSpecIF = app.ontology.generateSpecifClasses({ domains: ["SpecIF:DomainBase", "SpecIF:DomainSystemModelIntegration"] }),

			// Intermediate storage for statements:
			usedElements: SpecifStatement[] = [],     // --> shows
			specializations: SpecifStatement[] = [],
			associationEnds: any[] = [],
			abstractions: SpecifStatement[] = [];

		spD.id = modDoc.getAttribute("xmi:id");
		spD.title = [{ text: modDoc.getAttribute("name") }];

		// 3. Analyse the package structure and create a hierarchy of folders:
		parseElements(modDoc, { package: '', nodes: spD.hierarchies });

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
								ti = LIB.titleFromProperties(gE.properties, spD.propertyClasses, {targetLanguage: "default"}),  // its title
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

		// 6. Add all statements:
		spD.statements = spD.statements
			.concat(abstractions)
			.concat(specializations)
			.concat(usedElements);

		// 7. Keep only the valid statements:
		//    Repeat until no more invalid statements are suppressed:
		let prevLength: number;
		do {
			prevLength = spD.statements.length;
			spD.statements = spD.statements
				.filter(validateStatement);
		} while(prevLength > spD.statements.length);

		console.debug('SysML', spD, opts);
		return spD;
		// ----- End -----

		function parseElements(parent: Element, params: IParams): void {
			// 1. pass: The graph nodes:
			Array.from(
				parent.children,
				(ch) => {
					switch (ch.tagName) {
						case "xmi:Extension":
							// One or more 'owned' diagrams:
							makeDiagrams(ch, params);
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

									// Recursively parse the tree:
									parseElements(ch, { package: r1.id, nodes: nd1.nodes });
									break;
								case 'uml:Class':
									parseClass(ch, params);
									break;
								case "uml:DataType":
									// ToDo
									break;
								case "uml:Association":
								case "uml:Abstraction":
								case "uml:Realization":
									// next pass
									break;
								case "uml:Profile":
									// So far, no additional info to extract ..
									break;
								case "uml:ProfileApplication":
								case "uml:Usage":
									// No idea what this is good for in terms of semantics ...
									break;
							};
					};
				}
			);
			// 2. pass: The graph edges referencing the nodes:
			Array.from(
				parent.children,
				(ch) => {
					switch (ch.tagName) {
						case "xmi:Extension":
							// previous pass
							break;
						case "packagedElement":
							let ty = ch.getAttribute("xmi:type");
							if(ty)
								switch (ty) {
									case 'uml:Package':
									case 'uml:Class':
										// previous pass
										break;
									case "uml:Association":
										parseAssociation(ch);
										break;
									case "uml:Abstraction":
										// Used for sysml:refine, for example, where the type of abstraction (refinement in this case) is specified further down in an element <sysml:Refine ... />
										let sbj = ch.getElementsByTagName('client')[0].getAttribute("xmi:idref"),
											obj = ch.getElementsByTagName('supplier')[0].getAttribute("xmi:idref");
										//	console.debug('ö',sbj,obj);

										abstractions.push({
											id: ch.getAttribute("xmi:id"),
											class: LIB.makeKey(idStatementClassDefault),
											subject: LIB.makeKey(sbj),
											object: LIB.makeKey(obj),
											changedAt: opts.fileDate
										});
										break;
									case "uml:Realization":
										let sbjR = ch.getElementsByTagName('client')[0].getAttribute("xmi:idref"),
											objR = ch.getElementsByTagName('supplier')[0].getAttribute("xmi:idref"),
											staR = {
												id: ch.getAttribute("xmi:id"),
												class: LIB.makeKey(idStatementClassRealizes || idStatementClassAssociatedWith),
												subject: LIB.makeKey(sbjR),
												object: LIB.makeKey(objR),
												changedAt: opts.fileDate
											};
										/*	if (!idStatementClassRealizes) {
												LIB.addProperty(staR, {
													class: LIB.makeKey("PC-Type"),
													values: [[{ text: ty }]]
												} as SpecifProperty);
											}; */
										spD.statements.push(staR);
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
						/*	else
								// A packagedElement in a model as pointer to a shared model has no type  */
					};
				}
			);
			function parseClass(ch: Element, params: IParams):any {
/*
	<packagedElement xmi:type='uml:Class' xmi:id='_19_0_3_e40094_1719087054560_761584_42161' name='SpecIF:Statement'>
		<generalization xmi:type='uml:Generalization' xmi:id='_19_0_3_e40094_1719087551972_193117_42331' general='_19_0_3_e40094_1719086921605_648048_42122'/>
		<ownedAttribute xmi:type='uml:Property' xmi:id='_19_0_3_e40094_1719087088548_659833_42191' visibility='public' type='_19_0_3_e40094_1718951245605_496836_42285' association='_19_0_3_e40094_1719087088548_861018_42190'/>
		<ownedAttribute xmi:type='uml:Property' xmi:id='_19_0_3_e40094_1719087218370_359410_42282' visibility='public' aggregation='composite' type='_19_0_3_e40094_1719087139932_194471_42226' association='_19_0_3_e40094_1719087218370_769674_42281'/>
		<ownedAttribute xmi:type='uml:Property' xmi:id='_19_0_3_e40094_1719087744976_47616_42343' visibility='public' type='_19_0_3_e40094_1719086921605_648048_42122' association='_19_0_3_e40094_1719087744975_500336_42342'/>
		<ownedAttribute xmi:type='uml:Property' xmi:id='_19_0_3_e40094_1719087753882_499580_42356' visibility='public' type='_19_0_3_e40094_1719086921605_648048_42122' association='_19_0_3_e40094_1719087753881_699229_42355'/>
	</packagedElement>
*/
				let r2: SpecifResource = makeResource(ch),
					// If is an ontology term, use the corresponding class:
					rC = LIB.itemByTitle(spD.resourceClasses, ch.getAttribute("name"));
				if (rC) {
					// The block itself has a name which is an ontology term:
					r2["class"] = LIB.makeKey(rC.id);
					console.info("Cameo Import: Assigning class " + rC.id + " to model-element " + r2.id + " with title " + r2.properties[0].values[0][0].text);
				}
				else {
					// At the end of the transformation the class will be updated, if the block's generalization is an ontology term.
					r2["class"] = LIB.makeKey(idResourceClassDefault);
				};
				spD.resources.push(r2);

				// Add the hierarchy node referencing the resource:
				let nd2: SpecifNode = makeNode(r2, params.package),
					nextLevel = { package: params.package, nodes: nd2.nodes };
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

				Array.from(
					ch.children,
					(ch2: Element) => {
						switch (ch2.tagName) {
							case "xmi:Extension":
								// One or more model diagrams:
								makeDiagrams(ch2,nextLevel);
								break;
							case 'generalization':
								// Add the generalizations as specializations:
								specializations.push({
									id: ch2.getAttribute("xmi:id"),
									class: LIB.makeKey(idStatementClassSpecializes),
									subject: LIB.makeKey(r2.id),
									object: LIB.makeKey(ch2.getAttribute("general")),
									changedAt: opts.fileDate
								});
								break;
							case 'ownedAttribute':
								// Add the properties=associationEnds and ports:
								parseOwnedAttribute(ch2, {parent: r2})
								break;
							case 'nestedClassifier':
								parseClass(ch2, nextLevel);
						}
					}
				);
			//	return { resource: r2, node: nd2 };

				function parseOwnedAttribute(oA: Element, params:any): void {
					let pId: string, ty: string, ti: string, nm: string, cl: string, ob: string;
					switch (oA.getAttribute("xmi:type")) {
						case "uml:Property":
/*	
	------ Case 1: Undirected association without name and role name ----
	<packagedElement xmi:type='uml:Class' xmi:id='_19_0_3_e40094_1719151263881_543569_42635' name='Class_A'>
		<ownedAttribute xmi:type='uml:Property' xmi:id='_19_0_3_e40094_1719151383717_532960_42745' visibility='public' type='_19_0_3_e40094_1719151285180_119765_42662' association='_19_0_3_e40094_1719151383717_97517_42744'/>
	</packagedElement>
	<packagedElement xmi:type='uml:Class' xmi:id='_19_0_3_e40094_1719151285180_119765_42662' name='Class_B1'>
		<ownedAttribute xmi:type='uml:Property' xmi:id='_19_0_3_e40094_1719151383717_260588_42746' visibility='public' type='_19_0_3_e40094_1719151263881_543569_42635' association='_19_0_3_e40094_1719151383717_97517_42744'/>
	</packagedElement>
	<packagedElement xmi:type='uml:Association' xmi:id='_19_0_3_e40094_1719151383717_97517_42744'>
		<memberEnd xmi:idref='_19_0_3_e40094_1719151383717_532960_42745'/>
		<memberEnd xmi:idref='_19_0_3_e40094_1719151383717_260588_42746'/>
	</packagedElement>
	------ Case 2: Directed association without name and role name ----
	<packagedElement xmi:type='uml:Class' xmi:id='_19_0_3_e40094_1719151263881_543569_42635' name='Class_A'>
		<ownedAttribute xmi:type='uml:Property' xmi:id='_19_0_3_e40094_1719151408550_963899_42758' visibility='public' type='_19_0_3_e40094_1719151326789_405745_42689' association='_19_0_3_e40094_1719151408550_923366_42757'/>
	</packagedElement>
	<packagedElement xmi:type='uml:Class' xmi:id='_19_0_3_e40094_1719151326789_405745_42689' name='Class_B2'/>
	<packagedElement xmi:type='uml:Association' xmi:id='_19_0_3_e40094_1719151408550_923366_42757'>
		<memberEnd xmi:idref='_19_0_3_e40094_1719151408550_963899_42758'/>
		<memberEnd xmi:idref='_19_0_3_e40094_1719151408550_828739_42759'/>
		<ownedEnd xmi:type='uml:Property' xmi:id='_19_0_3_e40094_1719151408550_828739_42759' visibility='public' type='_19_0_3_e40094_1719151263881_543569_42635' association='_19_0_3_e40094_1719151408550_923366_42757'/>
	</packagedElement>
	------ Case 3: Directed association with name and without role name ----
	------ Case 4: Directed association without name and with role name ----
*/
							pId = oA.getAttribute("xmi:id");
							ob = oA.getAttribute("type");

							// ty and ob are defined, if it is about composition, aggregation and association:
							if (ob) {
								ty = oA.getAttribute("aggregation");
								cl = ty == "composite" ? idStatementClassComprises : (ty == "shared" ? idStatementClassAggregates : undefined);
								// Class references on an IBD (see [1] p.122) or association ends can have a name or not:
								nm = oA.getAttribute("name");
								if (nm) {
									// The association end has a name (= role), so create a subclass/specialization:
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
									// ... and use it as other end:
									ob = pId;
								};
								// The class' property
								// - has a name: use the newly created subclass as object
								// - has no name: use its type as object
								associationEnds.push({
									//	id: CONFIG.prefixS + simpleHash(params.parent.id + cl + ob),
									id: pId,
									associationId: oA.getAttribute("association"),
									associationType: LIB.makeKey(cl), // composition, aggregation or association
									thisEnd: LIB.makeKey(params.parent.id),
									otherEnd: LIB.makeKey(ob)
								});
								//	console.debug('associationEnds', simpleClone(associationEnds));

								// a) Add the mentioned properties of a class (within the block) to the list of used elements.
								// b) The IBD lists the uml:Property as usedElement, but not the referenced class.
								//	  Assuming that the IBD with its usedElements has been parsed before,
								//	  we look for the shown property to obtain the id of the IBD and add the referenced class, if missing.
								//	  (If we had the id of the local IBD at hand, it would be much simpler). 
								usedElements
									.filter(
										(e) => {
											// Filter the property shown on any diagram, including the local IBD:
											return e.object.id == pId
										}
									)
									.forEach(
										(e) => {
											// For every shown property there shall be a shown class: 
										//	let l = usedElements.length;
											makeStatementShows(e.subject.id, ob)
										//	if (l < usedElements.length) console.debug('#2', e.subject.id, ob, simpleClone(usedElements));
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
							ti = LIB.titleFromProperties(params.parent.properties, spD.propertyClasses, { targetLanguage: "default" });

							// Store the port as FMC:Actor:
							spD.resources.push({
								id: pId,
								class: LIB.makeKey(idResourceClassActor),
								properties: [{
									class: LIB.makeKey("PC-Name"),
									values: [[{ text: (ti? ti + " Port " + nm : nm )}]]
								}, {
									class: LIB.makeKey("PC-Type"),
									values: [[{ text: "uml:Port" }]]
								}],
								changedAt: opts.fileDate
							});

							// Relate the port to the containing element:
							spD.statements.push({
								id: CONFIG.prefixS + simpleHash(params.parent.id + idStatementClassHasPart + pId),
								class: LIB.makeKey(idStatementClassHasPart),
								subject: LIB.makeKey(params.parent.id),
								object: LIB.makeKey(pId),
								changedAt: opts.fileDate
							});

						// Interestingly enough a block shown on an IBD is not listed as usedElement, whereas its ports are.
						// So let us add the parent block of the port to the usedElement list, which will become 'shows' statements during post-processing.


					/*		break;
						case 
							// Add the connectors (in an IBD):
						*/
					};
				};  // end of 'ownedAttribute'
			}  // end of 'parseClass'

			function parseAssociation(el: Element) {
				// Carries the association's name, if specified.
				// - The class' attribute of type uml:Property has an attribute 'association' pointing to this element, here.
				//   It is assumed that the pointer is found first.
				// ToDo: Can it happen, that the pointer is found after this element? Both are at the same level.
				let nm = el.getAttribute("name"),
					prpL,
					aId = el.getAttribute("xmi:id"),
					aEnds = associationEnds.filter(
						aE => aE.associationId == aId
					);

				if (nm)
					prpL = [{
						class: LIB.makeKey("PC-Type"),
						values: [[{ text: nm }]]
					}];

				if (aEnds.length == 1) {
					// It is a directed association;
					// the uml:Association should have an element ownedEnd pointing to the origin, buth we use otherEnd = 'type' attribute of the ownedAttribute:
					spD.statements.push({
						id: aId,
						class: LIB.makeKey(aEnds[0].associationType || idStatementClassAssociatedWith),
						properties: nm ? prpL : undefined,
						subject: LIB.makeKey(aEnds[0].thisEnd),
						object: LIB.makeKey(aEnds[0].otherEnd),
						changedAt: opts.fileDate
					});
				}
				else if (aEnds.length == 2) {
					// It is an undirected association:
					// ToDo: Define an undirected association in the ontology
					//	console.debug("uml:Association", el, aEnds);

					/*	.. this can happen, if the association specifies a role at the other end:
						if (aEnds[0].thisEnd.id != aEnds[1].otherEnd.id)
							console.error("Cameo Import: For an undirected association, the association ends don't match: " + aEnds[0].thisEnd.id + " and " + aEnds[1].otherEnd.id);
						if (aEnds[1].thisEnd.id != aEnds[0].otherEnd.id)
							console.error("Cameo Import: For an undirected association, the association ends don't match: " + aEnds[1].thisEnd.id + " and " + aEnds[0].otherEnd.id);
					*/
					let cl, sbj, obj;
					// aEnds[x].associationType is defined in case of composition and aggregation:
					if (aEnds[1].associationType) {
						// not expected, but who knows:
						cl = aEnds[1].associationType;
						sbj = aEnds[1].thisEnd;
						obj = aEnds[1].otherEnd;
					}
					else {
						// usual case:
						cl = aEnds[0].associationType || idStatementClassAssociatedWith;
						sbj = aEnds[0].thisEnd;
						obj = aEnds[0].otherEnd;
					};

					spD.statements.push({
						id: aId,
						class: LIB.makeKey(cl),
						properties: nm ? prpL : undefined,
						subject: LIB.makeKey(sbj),
						object: LIB.makeKey(obj),
						changedAt: opts.fileDate
					});
					//	console.debug("uml:Association", simpleClone('spD.statements'));
				}
				else if (aEnds.length < 1) {
					console.error("Cameo Import: Too few association ends found; must be 2 and is " + aEnds.length);
					console.info("Cameo Import: Skipping the uml:Association with id " + aId + ", because it is not referenced by a uml:Class.");
				}
				else if (aEnds.length > 2) {
					console.error("Cameo Import: Too many association ends found; must be 2 and is " + aEnds.length);
					console.info("Cameo Import: Skipping the uml:Association with id " + aId + ", because it is not referenced by a uml:Class.");
				};
			}  // end of 'parseAssociation'
		}  // end of 'parseElements'
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

		// One or more model diagrams:
		function makeDiagrams(el: Element, params: IParams): void {
			Array.from(
				el.getElementsByTagName('ownedDiagram'),
				(oD: any) => {
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
					if (params.package)
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
						uE => makeStatementShows(r.id, uE.innerHTML)
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
		};

		function makeResource(el: any) {
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
			addDesc(r, el);
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
		function makeStatementShows(sbj:string, obj:string):void {
			// Store a 'shows' statement avoiding duplicates:
			let stId = CONFIG.prefixS + simpleHash(sbj + idStatementClassShows + obj);
			if (LIB.indexById(usedElements,stId)<0 )
				usedElements.push({
					id: stId,
					class: LIB.makeKey(idStatementClassShows),
					subject: LIB.makeKey(sbj),
					object: LIB.makeKey(obj),
					changedAt: opts.fileDate
				});
		}

		function validateStatement(st: SpecifStatement, idx: number, stL: SpecifStatement[]): boolean {
			// This is also part of the SpecIF constraint check, but rather skip a statement here than fail altogether during import.
			// Thus check:
			// - Are both subject and object defined
			// - Are both subject and object listed in spD.resources or spD.statements
			// - Are the subjectClasses and objectClasses listed in the statementClass, thus eligible
			if (LIB.isKey(st.subject) && LIB.isKey(st.object)) {
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
			};
			console.warn("Cameo Import: Skipping statement " + st.id + ", because subject or object is undefined.");
			return false;
		}
	}
}
