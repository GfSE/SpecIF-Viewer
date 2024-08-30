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

function sysml2specif( xmi:string, options: any ):resultMsg {
	"use strict";

//	var xhr: resultMsg;

	const
		idResourceClassDiagram = app.ontology.getClassId("resourceClass", "SpecIF:View"),
		idResourceClassActor = app.ontology.getClassId("resourceClass", "FMC:Actor"),
		idResourceClassState = app.ontology.getClassId("resourceClass", "FMC:State"),
	//	idResourceClassEvent = app.ontology.getClassId("resourceClass", "FMC:Event"),
	//	idResourceClassCollection = "RC-Collection",
		idResourceClassPackage = app.ontology.getClassId("resourceClass", "uml:Package"),
	//	idResourceClassFolder = "RC-Folder",
	//	idResourceClassDefault = app.ontology.getClassId("resourceClass", "SpecIF:ModelElement"),
		idResourceClassDefault = app.ontology.getClassId("resourceClass", "uml:Class"),

		idStatementClassContains = app.ontology.getClassId("statementClass", "SpecIF:contains"),
		idStatementClassHasPart = app.ontology.getClassId("statementClass", "dcterms:hasPart"),
		idStatementClassAggregates = idStatementClassHasPart,
		idStatementClassComprises = idStatementClassHasPart,
	//	idStatementClassComprises = app.ontology.getClassId("statementClass", "uml:Composition"),
	//	idStatementClassAggregates = app.ontology.getClassId("statementClass", "SpecIF:aggregates"),
		idStatementClassSpecializes = app.ontology.getClassId("statementClass", "SpecIF:isSpecializationOf"),
		idStatementClassRealizes = app.ontology.getClassId("statementClass", "uml:Realization"),
		idStatementClassServes = app.ontology.getClassId("statementClass", "SpecIF:serves"),
		idStatementClassAssociatedWith = app.ontology.getClassId("statementClass", "SpecIF:isAssociatedWith"),
	//	idStatementClassCommunicatesWith = app.ontology.getClassId("statementClass", "FMC:communicatesWith"),
		idStatementClassHandles = app.ontology.getClassId("statementClass", "SpecIF:handles"),
		idStatementClassProvides = app.ontology.getClassId("statementClass", "SpecIF:provides"),
		idStatementClassConsumes = app.ontology.getClassId("statementClass", "SpecIF:consumes"),
		idStatementClassShows = app.ontology.getClassId("statementClass", "SpecIF:shows"),
	//	idStatementClassDefault = app.ontology.getClassId("statementClass", "SpecIF:relates");
		idStatementClassDefault = idStatementClassAssociatedWith;

	if (typeof (options) != 'object' || !options.fileName)
		throw Error("Programming Error: Cameo import gets no parameter options");

	let opts = Object.assign(
		{
		//	titleLength: 256,
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

	if ( validateCameo(xmiDoc) )
		return new resultMsg(0, '', 'object', cameo2specif(xmiDoc, opts));

	return new resultMsg(899, 'Cameo Import: Input file is not supported');

	
// =======================================
// called functions:

	function cameo2specif(xmi:Document, opts:any):SpecIF {
		//	let Cs = Array.from(xmlDoc.querySelectorAll("collaboration"));
		interface IParams {
			package: string;
			nodes: SpecifNodes;
		}

		// ====== Preprocessing ======
		// 1. Create maps with stereotypes for classes und abstractions:
		function makeMap(att: any) {
			let top = xmi.getElementsByTagName('xmi:XMI')[0],
				map = new Map();
			Array.from(
				top.children,
				(ch: any) => {
					let base = ch.getAttribute(att);
					if (base) {
						if(att=="base_Property")
							// the direction is defined only in case of a flowProperty
							map.set(base, { tag: ch.tagName, dir: ch.getAttribute("direction") });
						else
							map.set(base, ch.tagName);
					};
				}
			);
			return map;
		}
		let classStereotypes = makeMap("base_Class"),
			abstractionStereotypes = makeMap("base_Abstraction"),
			propertyStereotypes = makeMap("base_Property"),
			flowProperties = new Map(),  // interfaceBlock and its direction

			// ====== Processing ======
			// 2. Create project:
			models = xmi.getElementsByTagName('uml:Model'), // in case of a model
			packgs = xmi.getElementsByTagName('uml:Package'), // in case of a shared model
			modDoc = models.length>0? models[0] : packgs[0],
			spD: CSpecIF = app.ontology.generateSpecifClasses({
				domains: [
					"SpecIF:DomainBase",
					"SpecIF:DomainSystemsEngineering",
					"SpecIF:DomainSystemModelIntegration"
				],
				SpecIF_LifecycleStatusReleased: true,
				SpecIF_LifecycleStatusEquivalent: true
			}),

			// Memorized for postprocessing:
			usedElements: SpecifStatement[] = [],     // --> shows
			specializations: SpecifStatement[] = [],
			associationEnds: any[] = [],
			abstractions: SpecifStatement[] = [],
			portL: any[] = [],
			connectors: any[] = [];

		spD.id = modDoc.getAttribute("xmi:id");
		spD.title = [{ text: modDoc.getAttribute("name") }];

		// 3. Analyse the package structure and create a hierarchy of folders:
		parseElements(modDoc, { package: '', nodes: spD.hierarchies });

		// ====== Postprocessing ======
		// 4. Find stereotypes and specialized classes for the model elements:
		//    - traverse the tree of specialization to the top to find a class
		//      with a name which is an ontology term for resources ...
		//      and assign the corresponding class to the model element.
		//    - look for the stereotype and if it is an ontology term for resources
		//      create a property titled dcterms:type.
		specializations = specializations
			.filter(validateStatement);
		spD.resources
			.forEach(
				(me) => {
					if (me["class"].id == idResourceClassDefault) {
						let rC: SpecifResourceClass;

						// --- 1. Look for the generalizing class in the set of resourceClasses generated from the ontology ---
						rC = generalizingResourceClassOf(me);
						if (rC && rC.id != idResourceClassDefault) {
							me["class"] = LIB.makeKey(rC.id);
							console.info("Cameo Import: Re-assigning class " + rC.id + " to model-element " + me.id + " with title " + LIB.valueByTitle(me, CONFIG.propClassTitle, spD));
						};

						// --- 2. Look for	a stereotype to assign a corresponding resourceClass ---
						let sTy = classStereotypes.get(me.id);
						if (sTy) {

							// In SpecIF, an InterfaceBlock is the transferred state (data object in case of information);
							// .. in case an uml:InterfaceBlock is not itself an ontology term with a corresponding resourceClass:
							if (sTy == "sysml:InterfaceBlock") {
								me["class"] = LIB.makeKey(idResourceClassState);
								console.info("Cameo Import: Reassigning class '" + idResourceClassState + "' to  model-element " + me.id + " with title " + LIB.valueByTitle(me, CONFIG.propClassTitle, spD));
								return;
							};

						/*	// Otherwise, check whether it is an ontology term = if a resource class with that name exists:
							rC = LIB.itemByTitle(spD.resourceClasses, sTy);
							if (rC) {
								me["class"] = LIB.makeKey(rC.id);
								console.info("Cameo Import: Reassigning class '" + rC.id + "' to  model-element " + me.id + " with title " + LIB.valueByTitle(me, CONFIG.propClassTitle, spD));
							}; */

							// Find or create a type property:
							let prp = LIB.propByTitle(me, CONFIG.propClassType, spD);
							if (prp) {
								prp.values = [[{ text: sTy }]];
								console.info("Cameo Import: Assigning stereotype '" + sTy + "' to  model-element " + me.id + " with title " + LIB.valueByTitle(me, CONFIG.propClassTitle,spD));
							};
						};
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
		// 6. Find all InterfaceBlocks to assign a flowProperty (in/out/inout) to each port:
		//    - Primarily the flow direction is defined by the InterfaceBlock's data property.
		//      If a port is 'conjugated', the opposite of the InterfaceBlock's direction is assumed.
		//    - The port collects all flow directions of attributed InterfaceBlocks. Says an explanation in Cameo's port dialog:
		//      "A combined direction of all owned and inherited flow properties and directed features.
		//      If all features have direction 'out' or 'provided', the combined direction is 'out'. "
		//      If all features have direction 'in' or 'required', the combined direction is 'in'.
		//      Otherwise the direction is 'inout'."
		portL.forEach(
			(p: any) => {
				let ibId = p.interfaceBlock,
					dir = flowProperties.get(ibId),
					acc: string;
			//	console.debug('port', p, ibId, dir);
				switch (dir) {
					case 'in':
						// Add the flow direction to the port:
						p.resource.properties.push({
							class: "PC-UmlFlowdirection",
							values: [[{ text: p.isConjugated? 'out' : 'in' }]]
						});
						// Relate the port to its 'type', which is an interface Block:
						acc = p.isConjugated ? idStatementClassProvides : idStatementClassConsumes;
						spD.statements.push({
							id: CONFIG.prefixS + simpleHash(p.resource.id + acc + ibId),
							class: LIB.makeKey(acc),
							subject: LIB.makeKey(p.resource),
							object: LIB.makeKey(ibId),
							changedAt: opts.fileDate
						});
						break
					case 'out':
						// Add the flow direction to the port:
						p.resource.properties.push({
							class: "PC-UmlFlowdirection",
							values: [[{ text: p.isConjugated ? 'in' : 'out' }]]
						});
						// Relate the port to its 'type', which is an interface Block:
						acc = p.isConjugated ? idStatementClassConsumes : idStatementClassProvides;
						spD.statements.push({
							id: CONFIG.prefixS + simpleHash(p.resource.id + acc + ibId),
							class: LIB.makeKey(acc),
							subject: LIB.makeKey(p.resource),
							object: LIB.makeKey(ibId),
							changedAt: opts.fileDate
						});
						break
					case 'inout':
						// Add the flow direction to the port:
						p.resource.properties.push({
							class: "PC-UmlFlowdirection",
							values: [[{ text: 'inout' }]]
						});
						// Relate the port to its 'type', which is an interface Block:
						spD.statements.push({
							id: CONFIG.prefixS + simpleHash(p.resource.id + idStatementClassHandles + ibId),
							class: LIB.makeKey(idStatementClassHandles),
							subject: LIB.makeKey(p.resource),
							object: LIB.makeKey(ibId),
							changedAt: opts.fileDate
						});
				};
			}
		);

		// 7. Add a serves relationship per connector:
		//    ToDo: Use this also for BDD item flows?
		connectors.forEach(
			(co) => {
				// In SpecIF, the connectors are represented by 'serves' relationhips.
				let port0 = LIB.itemById(portL, co.ends[0]),
					port1 = LIB.itemById(portL, co.ends[1]),
					p0serves = LIB.valueByTitle(port0.resource, 'uml:is_Service', spD) == 'true',
					p1serves = LIB.valueByTitle(port1.resource, 'uml:is_Service', spD) == 'true';
			//	console.debug('connector', co, port0, port1, p0serves, p1serves);

				// a. If one port is a server and the other is not, the direction is obvious.
				if (p0serves && !p1serves) {
					spD.statements.push({
						id: co.id,
						class: LIB.makeKey(idStatementClassServes),
						subject: LIB.makeKey(port0.id),
						object: LIB.makeKey(port1.id),
						changedAt: opts.fileDate
					});
					return;
				};
				if (!p0serves && p1serves) {
					spD.statements.push({
						id: co.id,
						class: LIB.makeKey(idStatementClassServes),
						subject: LIB.makeKey(port1.id),
						object: LIB.makeKey(port0.id),
						changedAt: opts.fileDate
					});
					return;
				};

				// For the other cases, we need to find out which port belongs to the nested class/block:
				spD.statements.forEach(
					(st) => {
						if (st['class'].id == idStatementClassComprises) {
						//	console.debug('comprises', st, port0.parent, port1.parent);
							// b. If both are servers, the contained ("nested") class is the origin of the serves relationship
							if (st.subject.id == port0.parent.id && st.object.id == port1.parent.id) {
								spD.statements.push({
									id: co.id,
									class: LIB.makeKey(idStatementClassServes),
									subject: LIB.makeKey(p0serves && p1serves? port1.id : port0.id),
									object: LIB.makeKey(p0serves && p1serves? port0.id : port1.id),
									changedAt: opts.fileDate
								});
								return;
							};
							// c. If both are no servers thus clients, the contained ("nested") class is the destination of the serves relationship
							if (st.subject.id == port1.parent.id && st.object.id == port0.parent.id) {
								spD.statements.push({
									id: co.id,
									class: LIB.makeKey(idStatementClassServes),
									subject: LIB.makeKey(p0serves && p1serves ? port0.id : port1.id),
									object: LIB.makeKey(p0serves && p1serves ? port1.id : port0.id),
									changedAt: opts.fileDate
								});
							//	return;
							};
						};
					}
				);
			}
		);

		// 8. Add all statements:
		spD.statements = spD.statements
			.concat(abstractions)
			.concat(specializations)
			.concat(usedElements);

		// 9. Keep only the valid statements:
		//    Repeat until no more invalid statements are suppressed:
		let prevLength: number;
		do {
			prevLength = spD.statements.length;
			spD.statements = spD.statements
				.filter(validateStatement);
		} while(prevLength > spD.statements.length);

		console.debug('SysML', spD, opts);
		return spD;
		// ====== End ======

		function parseElements(parent: Element, params: IParams): void {
			// 1. pass: The data types:
			Array.from(
				parent.children,
				(ch) => {
					let r: SpecifResource, nd: SpecifNode;
					switch (ch.tagName) {
						case "packagedElement":
							switch (ch.getAttribute("xmi:type")) {
								case "uml:DataType":
									// Add a resource representing the data type:
									r = makeResource(ch);
									r["class"] = LIB.makeKey(idResourceClassDefault);
									spD.resources.push(r);
									// Add the hierarchy node referencing the resource:
									nd = makeNode(r, params.package);
									params.nodes.push(nd);
							};
					};
				}
			);
			// 2. pass: The graph nodes:
			Array.from(
				parent.children,
				(ch) => {
					let r: SpecifResource, nd: SpecifNode;
					switch (ch.tagName) {
						case "xmi:Extension":
							// One or more 'owned' diagrams:
							makeDiagrams(ch, params);
							break;
						case "packagedElement":
							switch (ch.getAttribute("xmi:type")) {
								case 'uml:Package':
									// Add a resource representing the package:
									r = makeResource(ch);
									r["class"] = LIB.makeKey(idResourceClassPackage);
									spD.resources.push(r);

									// Add the hierarchy node referencing the resource:
									nd = makeNode(r, params.package);
									params.nodes.push(nd);

									// Recursively parse the tree:
									parseElements(ch, { package: r.id, nodes: nd.nodes });
									break;
								case 'uml:Class':
									parseClass(ch, params);
									break;
								case "uml:DataType":
									// previous pass
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
			// 3. pass: The graph edges referencing the nodes:
			Array.from(
				parent.children,
				(ch) => {
					switch (ch.tagName) {
						case "xmi:Extension":
							// previous pass
							break;
						case "packagedElement":
							let ty = ch.getAttribute("xmi:type");
							switch (ty) {
								case 'uml:Package':
								case 'uml:Class':
								case "uml:DataType":
									// earlier pass
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
										} as SpecifStatement;
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
								default:
									console.info("Cameo Import: Skipping the packagedElement", ch, "with name", ch.getAttribute("name"), "and type", ty, ".");
							};
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
				let r2: SpecifResource = makeResource(ch);
				// At the end of the transformation the class will be updated, if the block's generalization is an ontology term.
				r2["class"] = LIB.makeKey(idResourceClassDefault);
			/*  ... this is not really, what we want:
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
				};  */
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
								makeDiagrams(ch2, nextLevel);
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
								parseOwnedAttribute(ch2, { parent: r2, nodes: nd2.nodes })
								break;
							case 'ownedOperation':
								// Add a resource representing the operation:
								let oO: SpecifResource = makeResource(ch2);
								oO["class"] = LIB.makeKey(idResourceClassActor);
								spD.resources.push(oO);
								// Add the hierarchy node referencing the resource:
								nd2.nodes.push(makeNode(oO, r2.id));
								// Relate the operation to the containing class:
								spD.statements.push({
									id: CONFIG.prefixS + simpleHash(r2.id + idStatementClassComprises + oO.id),
									class: LIB.makeKey(idStatementClassComprises),
									subject: LIB.makeKey(r2.id),
									object: LIB.makeKey(oO.id),
									changedAt: opts.fileDate
								});
							//	console.debug('oO',oO,nd2);
								break;
							case 'ownedConnector':
								// A connector between ports on an IBD (or other?);
								// - the ports are stored as role="port-id" in the children tagged 'end'.

								/*	// Case 1: Both ports have a different client/server role:
									// 1a. Inspired from SpecIF, a connector is transformed to a state of the information, energy- or material (data) type:
									let cId = ch2.getAttribute("role");
									spD.resources.push(ch2, { name="Connector " + cId });
									// 1b. Finally a 'serves' relation if possible  */

								//  Case 2: Both ports have the same client/server role, so the outer is a proxy of the inner port (in general terms, not UML/SysML terms)
								// 2a. A 'communicates with' relation:
								let cId = ch2.getAttribute("xmi:id"),
									ports = Array.from(
										// assuming there are exactly 2 children with tag 'end':
									//	ch2.children,
										ch2.getElementsByTagName("end"),
										(ch3) => {
											return ch3.getAttribute("role")
										}
									);
								if (ports.length < 2) {
									console.error("uml:Connector " + cId + " has too few ends");
									return;
								};
								if (ports.length > 2) {
									console.error("uml:Connector " + cId + " has too many ends");
									return;
								};
							/*	spD.statements.push({
									id: cId,
									class: LIB.makeKey(idStatementClassCommunicatesWith),
									subject: LIB.makeKey(ports[0]),
									object: LIB.makeKey(ports[1]),
									changedAt: opts.fileDate
								});  */
								// Memorize for postprocessing, where a serves relationship will be created based on the port's flow properties:
								connectors.push({ id: cId, ends: [ports[0], ports[1]] })
								break;
							case 'nestedClassifier':
								parseClass(ch2, nextLevel);
						}
					}
				);
			//	return;

				function parseOwnedAttribute(oA: Element, params:any): void {
					let pId: string, ac: string, ty: string, ag: string, ti: string, nm: string, cl: string;
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
							ac = oA.getAttribute("association");
							ty = oA.getAttribute("type");
							ag = oA.getAttribute("aggregation");

							if (ac && ty) {
								// It is about composition, aggregation and association;
								// the elements use vary depending on the 'navigable' flag on either end:
								// ToDo: For example associations without arrow-heads (indicating a navigable end) are not yet properly interpreted
								cl = ag == "composite" ? idStatementClassComprises : (ag == "shared" ? idStatementClassAggregates : undefined);
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
									// Add the hierarchy node referencing the specialized class:
									params.nodes.push(makeNode(LIB.makeKey(pId), params.parent.id));

									// It is a specialization of the class specified by 'type':
									specializations.push({
										id: CONFIG.prefixS + simpleHash(pId + idStatementClassSpecializes + ty),
										class: LIB.makeKey(idStatementClassSpecializes),
										subject: LIB.makeKey(pId),
										object: LIB.makeKey(ty),
										changedAt: opts.fileDate
									});
									// ... and use it as other end:
									ty = pId;
								};
								// The class' property
								// - has a name: use the newly created subclass as object
								// - has no name: use its type as object
								associationEnds.push({
									//	id: CONFIG.prefixS + simpleHash(params.parent.id + cl + ty),
								//	id: pId,  // to find it more easily
									associationId: oA.getAttribute("association"),
									associationType: cl, // composition, aggregation or undefined
									thisEnd: LIB.makeKey(params.parent.id),
									otherEnd: LIB.makeKey(ty)
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
											makeStatementShows(e.subject.id, ty)
											//	if (l < usedElements.length) console.debug('#2', e.subject.id, ty, simpleClone(usedElements));
										}
									);
							}
							else if (classStereotypes.get(params.parent.id) == "sysml:InterfaceBlock") {
								// This is a flowProperty of an InterfaceBlock:

								// Relate to the data type:
								if (ty) {
									// a. The 'type' attribute points to a self-defined (local) uml:DataType:
									spD.statements.push({
									//	id: CONFIG.prefixS + simpleHash(params.parent.id + idStatementClassDefault + ty),
										id: pId,
										class: LIB.makeKey(idStatementClassDefault),
										subject: LIB.makeKey(params.parent.id),
										object: LIB.makeKey(ty),
										properties: [{
											class: LIB.makeKey("PC-Type"),
											values: [[{ text: "has data type" }]]
										}],
										changedAt: opts.fileDate
									});
								}
								else {
									// b. Otherwise a child with tag <type ../> provides a link to a standard data type:

								};

								// Store flowProperty direction to add it to the port when postprocessing:
								let stT = propertyStereotypes.get(pId);
								if(stT && stT.dir)
									flowProperties.set(params.parent.id, stT.dir ); // interfaceBlock and its direction
							}
							else {
								// Without association or type, this is an ordinary attribute 
								// ToDo: Can it be something else?
								// Add a resource representing the operation:
								let r: SpecifResource = makeResource(oA);
								r["class"] = LIB.makeKey(idResourceClassState);
								spD.resources.push(r);
								// Add the hierarchy node referencing the resource:
								nd2.nodes.push(makeNode(r, params.parent.id));
								// Relate the operation to the containing class:
								spD.statements.push({
									id: CONFIG.prefixS + simpleHash(params.parent.id + idStatementClassComprises + r.id),
									class: LIB.makeKey(idStatementClassComprises),
									subject: LIB.makeKey(params.parent.id),
									object: LIB.makeKey(r.id),
									changedAt: opts.fileDate
								});

							//	console.info("Cameo Import: Skipping the " + oA.getAttribute("xmi:type") + " with id " + pId + ".");
							};
							break;
						case "uml:Port":
							pId = oA.getAttribute("xmi:id");
							ty = oA.getAttribute("type");  // id of the interface block
							nm = oA.getAttribute("name");
							ti = LIB.titleFromProperties(params.parent.properties, spD.propertyClasses, { targetLanguage: "default" });

							// Store the port:
							let prt: SpecifResource = {
									id: pId,
									class: LIB.makeKey("RC-UmlPort"),
									properties: [{
										class: LIB.makeKey("PC-Name"),
										values: [[{ text: (ti ? ti + " Port " + nm : nm) }]]
									}, {
										class: LIB.makeKey("PC-Type"),
										values: [[{ text: "uml:Port" }]]
									}, {
										class: LIB.makeKey("PC-UmlIsservice"),  // a boolean property
										values: [oA.getAttribute("isService") || "true"]  // apparently Cameo default is 'true'
										// property "PC-UmlFlowdirection" will be assigned in the postprocessing, because the interfaceblock may be defined later in the xmi file
									}],
									changedAt: opts.fileDate
								};
							spD.resources.push( prt );

							// Relate the port to the containing element:
							spD.statements.push({
								id: CONFIG.prefixS + simpleHash(params.parent.id + idStatementClassHasPart + pId),
								class: LIB.makeKey(idStatementClassHasPart),
								subject: LIB.makeKey(params.parent.id),
								object: LIB.makeKey(pId),
								changedAt: opts.fileDate
							});

						/*	... replaced by reads/writes/accesses relation created when postprocessing:
							// Relate the port to its 'type', which is an interface Block:
							// see also: https://mbse4u.com/2017/09/05/conjugation-considered-harmful/
							spD.statements.push({
								id: CONFIG.prefixS + simpleHash(pId + idStatementClassDefault + ty),
								class: LIB.makeKey(idStatementClassDefault),
								subject: LIB.makeKey(pId),
								object: LIB.makeKey(ty),
								properties: [{
									class: LIB.makeKey("PC-Type"),
									values: [[{ text: "sysml:InterfaceBlock" }]]
								}],
								changedAt: opts.fileDate
							}); */

							// Memorize for postprocessing to assign the port's directionand the serves relationships:
							portL.push({ id: prt.id, resource: prt, interfaceBlock: ty, isConjugated: oA.getAttribute("isConjugated") == 'true', parent: params.parent });

						// Interestingly enough a block shown on an IBD is not listed as usedElement, whereas its ports are.
						// So let us add the parent block of the port to the usedElement list, which will become 'shows' statements during post-processing.

					};
				};  // end of 'ownedAttribute'
			}  // end of 'parseClass'

			function parseAssociation(el: Element) {
				// Carries the association's name, if specified.
				// - The class' attribute of type uml:Property has an attribute 'association' pointing to this element, here.
				//   It is assumed that the pointer is found first.
				// ToDo: Can it happen, that the pointer is found after this element? Both are at the same level.
				let nm = el.getAttribute("name"),
					sC: SpecifStatementClass,
					prpL: SpecifProperty[],
					aId = el.getAttribute("xmi:id"),
					aEnds = associationEnds.filter(
						aE => aE.associationId == aId
					);

				if (nm) {
					// Check whether it is an ontology term = if a statement class with that name exists:
					sC = LIB.itemByTitle(spD.statementClasses, nm);
					if(!sC)
						prpL = [{
							class: LIB.makeKey("PC-Type"),
							values: [[{ text: nm }]]
						}];
				};

				if (aEnds.length == 1) {
					// It is a directed association;
					// the uml:Association should have an element ownedEnd pointing to the origin, buth we use otherEnd = 'type' attribute of the ownedAttribute:
					spD.statements.push({
						id: aId,
						class: LIB.makeKey(aEnds[0].associationType || (sC?sC.id:undefined) || idStatementClassAssociatedWith),
						properties: prpL ? prpL : undefined,
						subject: LIB.makeKey(aEnds[0].thisEnd),
						object: LIB.makeKey(aEnds[0].otherEnd),
						changedAt: opts.fileDate
					});
				}
				else if (aEnds.length == 2) {
					// An association without owned ends, i.e. navigable from both ends (bidirectional in UML terms):
					// - in case of Composition and Aggregation a direction can be assumed from the position of the rhombus,
					// - a non-navigable 'pure' association is not supported, because the direction in SpecIF/RDF terms is unknown.
					//	console.debug("uml:Association", el, aEnds);

					/*	.. this can happen, if the association specifies a role at the other end:
						if (aEnds[0].thisEnd.id != aEnds[1].otherEnd.id)
							console.error("Cameo Import: For an undirected association, the association ends don't match: " + aEnds[0].thisEnd.id + " and " + aEnds[1].otherEnd.id);
						if (aEnds[1].thisEnd.id != aEnds[0].otherEnd.id)
							console.error("Cameo Import: For an undirected association, the association ends don't match: " + aEnds[1].thisEnd.id + " and " + aEnds[0].otherEnd.id);
					*/
					let cl, sbj, obj;
					// aEnds[x].associationType is defined in case of composition and aggregation;
					// in all other cases we do not know the direction and ignore the association:
					if (aEnds[0].associationType || aEnds[1].associationType) {
						if (aEnds[1].associationType) {
							// not expected, but who knows:
							cl = aEnds[1].associationType;
							sbj = aEnds[1].thisEnd;
							obj = aEnds[1].otherEnd;
						}
						else {
							// usual case:
							cl = aEnds[0].associationType || (sC ? sC.id : undefined) || idStatementClassAssociatedWith;
							sbj = aEnds[0].thisEnd;
							obj = aEnds[0].otherEnd;
						};

						spD.statements.push({
							id: aId,
							class: LIB.makeKey(cl),
							properties: prpL ? prpL : undefined,
							subject: LIB.makeKey(sbj),
							object: LIB.makeKey(obj),
							changedAt: opts.fileDate
						});
						//	console.debug("uml:Association", simpleClone('spD.statements'));
					}
					else
						console.warn("Cameo Import: Skipping the uml:Association with id " + aId + ", because it has no direction in RDF terms.");
				}
				else if (aEnds.length < 1) {
					// An association with 2 owned ends (not navigable from both ends, undirected in UML terms)):
					// - in case of Composition and Aggregation a direction can be assumed from the position of the rhombus,
					// - a non-navigable 'pure' association is not supported, because the direction in SpecIF/RDF terms is unknown.
					let st = {
						id: aId,
					//	class:,
						properties: prpL,
					//	subject: LIB.makeKey(sbj),
					//	object: LIB.makeKey(obj),
						changedAt: opts.fileDate
					};
					// The association should have 2 owned ends:
					Array.from(
						el.getElementsByTagName('ownedEnd'),
						(oE) => {
							let ag = oE.getAttribute("aggregation");
							if (ag && ['composite','shared'].includes(ag)) {
								// A composition or an aggregation:
								st['class'] = LIB.makeKey(ag == 'composite' ? idStatementClassComprises : idStatementClassAggregates);
								st.object = LIB.makeKey(oE.getAttribute("type"));
							}
							else {
								// The other end:
								st.subject = LIB.makeKey(oE.getAttribute("type"));
							};
						}
					);
					if (LIB.isKey(st['class']) && LIB.isKey(st.subject) && LIB.isKey(st.object))
						spD.statements.push(st);
					else
						console.warn("Cameo Import: Skipping the uml:Association with id " + aId + ", because it has no direction in RDF terms.");
				}
				else if (aEnds.length > 2) {
					console.error("Cameo Import: Too many association ends found; must be 0, 1 or 2 and is " + aEnds.length);
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
					addDesc(r, el);

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

		function makeResource(el: Element, pars?: any) {
			// @ts-ignore - class will be assigned later
			let r: SpecifResource = {
				id: /* pars && pars.id ? pars.id :*/ el.getAttribute("xmi:id"),
				properties: [{
					class: LIB.makeKey("PC-Name"),
					values: [[{ text: pars && pars.name? pars.name : el.getAttribute("name") }]]
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
			if (LIB.isKey(st.subject) && LIB.isKey(st.object) && LIB.isKey(st["class"])) {
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
			console.warn("Cameo Import: Skipping statement, because class, subject or object is undefined: " + st);
			return false;
		}
	}
	function validateCameo(xmi) {
	/*	return xmi.getElementsByTagName('parsererror').length < 1  // has been checked, before in LIB.validXML ...
			&& */
		return xmi.getElementsByTagName('xmi:exporter')[0].innerHTML.includes("MagicDraw")
			&& xmi.getElementsByTagName('xmi:exporterVersion')[0].innerHTML.includes("19.0");
	}
}
