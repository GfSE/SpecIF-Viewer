/*!	DDP-Schema import
	Dependencies: -
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)

	Limitations:
	- The schema is blindly traversed, so that almost every little change in structure will lead to failure
	
*/

// Constructor for DDP-Schema import:
// (A module constructor is needed, because there is an access to parent's data via 'self.parent..')
moduleManager.construct({
	name: 'ioDdpSchema'
}, (self:ITransform) =>{
	"use strict";

	const
/*		opts: any,
		mime,
		zipped:boolean,
//		template,	// a new Id is given and user is asked to input a project-name
		errNoOptions = new xhrMessage( 896, 'No options or no mediaTypes defined.' ),
		errNoDdpSchemaFile = new xhrMessage( 897, 'No DDP-Schema file in the reqifz container.' ),
        //errInvalidJson = { status: 900, statusText: 'SpecIF data is not valid JSON.' }, */
		errInvalidXML = new xhrMessage(898, 'DDP Schema is not valid XML.'),
		errTransformationCancelled = new xhrMessage(999, 'Transformation cancelled on user request.'),
		errTransformationFailed = new xhrMessage(999, 'Input file could not be transformed to SpecIF.'),
		domainOfDDPElements = "V-Domain-20";
		
	self.init = (/*options:any*/):boolean =>{
	//	mime = undefined;
	//	opts = options;
		return true;
	};

	self.verify = ( f:File ):boolean =>{
			// Verify the type (and eventually the content) of a DDP Schema import file:
	
	/*		function ddpSchemaFile2mediaType( fname:string ):string|undefined {
				if( fname.endsWith('.reqifz') || fname.endsWith('.reqif.zip') ) {
					zipped = true;
					return 'application/zip';
				};
				if( fname.endsWith('.reqif') ) {
					zipped = false;
					return 'application/xml';
				};
				return; // undefined
			}
				
		mime = reqifFile2mediaType( f.name );
		if ( mime )
			return true;
		// else:
		message.show( i18n.lookup('ErrInvalidFileReqif', f.name) );
		return false; */

			function isDdpSchema(fname: string): boolean {
				// importAny let's us import only files with this extension, so this should always succeed:
			//	return fname.endsWith('.xsd') 
				return fname == "Dictionary.xsd";
			}
				
		// ToDo: Briefly check for DDP-Schema content
		if ( !isDdpSchema(f.name) ) {
		//	message.show( i18n.lookup('ErrInvalidFile', f.name) );
			message.show( "This transformation works only for 'Dictionary.xsd'." )
			return false;
		};
		return true;
	};
	self.toSpecif = (buf: ArrayBuffer): JQueryDeferred<SpecIF> => {
		// Transform DDP-Schema to SpecIF for import:
		// buf is an array-buffer containing reqif data:
//		console.debug('ioDdpSchema.toSpecif');
		//self.abortFlag = false;
		let dDO = $.Deferred(),
			xsd = LIB.ab2str(buf);

		if (LIB.validXML(xsd)) {

			// @ts-ignore - BootstrapDialog() is loaded at runtime
			new BootstrapDialog({
				title: "Choose result type",
				type: 'type-primary',
				message: () => {
					return $(
						'<div>'
						+ "<p>" + i18n.MsgExport + "</p>"
						+ makeRadioField(
							i18n.LblFormat,
							[
								{ title: 'SpecIF Ontology for DDP', id: 'ontology', checked: true },
								{ title: 'SpecIF Classes for DDP', id: 'specifClasses' }
							]
						)
						+ '</div>'
					)
				},
				buttons: [
					{
						label: i18n.BtnCancel,
						action: (thisDlg: any) => {
							dDO.reject(errTransformationCancelled);
							thisDlg.close()
						}
					},
					{
						label: i18n.LblNextStep,
						cssClass: 'btn-success',
						action: (thisDlg: any) => {
							// Obtain selected options:
							// add 'zero width space' (&#x200b;) to make the label = div-id unique:

							// Retrieve further options:
							let data: SpecIF;
							switch (radioValue(i18n.LblFormat)) {
								case 'ontology':
									data = ddpSchema2specifOntology(xsd /*, self.parent.projectName, fDate*/);
									break;
								case 'specifClasses':
									data = ddpSchema2specifClasses(xsd /*, self.parent.projectName, fDate*/);
							//		break;
							//	default:
							};
							// @ts-ignore - in all cases which can occur, the variable data has a value:
							if (typeof (data) == 'object' && data.id)
								dDO.resolve(data)
							else
								dDO.reject(errTransformationFailed);

							thisDlg.close();
						}
					}
				]
			})
			.open();
        }
		else
			dDO.reject(errInvalidXML);

		return dDO;
	};
/*	self.fromSpecif = ( pr:SpecIF, opts?:any ):string =>{
	}; */
	self.abort = ():void =>{
//		app.projects.abort();
//		server.project().cancelImport();
		self.abortFlag = true;
	};
	return self;

	function ddpSchema2specifClasses(xsd: string /*, pN:string, pchAt: string */): SpecIF {
		"use strict";

		// Transform the content of the "Dictionary.xsd" file provided by prostep iViP on 2023-03-10.

		var xlsTerms = ["xs:boolean", "xs:integer", "xs:double", "xs:dateTime", "xs:anyURI", CONFIG.propClassId, CONFIG.propClassType, CONFIG.resClassFolder],
			spD: SpecIF = app.ontology.generateSpecifClasses({ terms: xlsTerms, adoptOntologyDataTypes: true });
		spD.title = [{ text: "SpecIF Classes for prostep iViP DDP (Data Model)" }];
		spD.description = [{ text: "SpecIF Classes derived from DDP Schema Version 2.0 created 10.03.2023 08:09:28 by Michael Kirsch, :em engineering methods AG on behalf of prostep iViP Association" }];
		spD.id = "P-DDP-Schema-V20";
		spD.createdAt = new Date().toISOString();

		let parser = new DOMParser(),
			xsdDoc = parser.parseFromString(xsd, "text/xml");

		// 1. Extract the dictionaryEntities from the DictionaryEntitiesCollection in the upper part of the schema file

		// 1.a Extract the DictionaryEntity with (currently 2) properties als parent:


		// 1.b Extract the specialized DictionaryEntities with their individual properties:
		let dictionaryEntities = Array.from(xsdDoc.getElementsByTagName('xs:schema')[0].children)
			.filter((ch) => { return ch.tagName == "xs:complexType"; })
			.filter((ch) => { return ch.getAttribute("name") == "DictionaryEntitiesCollection" });

		Array.from(
			dictionaryEntities[0].children[0].children,
			(d) => {
				let dE = d.children[0].children[0].children[0];
				// dE is the dictionaryEntity, now.

				let ti = dE.getAttribute("name") || "",
					rC = {
						id: CONFIG.prefixRC + simpleHash(ti),
						title: ti,
						description: getDesc(dE),
						instantiation: ["auto", "user"],
						propertyClasses: [],
						changedAt: spD.createdAt
					};
				let attC = dE.getElementsByTagName('xs:complexContent'),
					atts = attC[0].children[0].children;
				let prpL = (atts && atts.length == 1) ? Array.from(atts[0].getElementsByTagName('xs:element')) : [];
//				console.debug('d', dE, atts/*,seq*/, prpL);
				prpL.forEach((prp) => {
					let ti = prp.getAttribute("ref") || prp.getAttribute("name") || "",
						id = CONFIG.prefixPC + simpleHash(ti),
						ty = prp.getAttribute("type") || "xs:string",
						dT = LIB.itemBy(spD.dataTypes, "type", ty);
					if (dT) {
						let pC = {
							id: id,
							title: ti,
							description: getDesc(prp),
							dataType: { id: dT.id },
							changedAt: spD.createdAt
						};
						LIB.cacheE(spD.propertyClasses, pC);
						LIB.cacheE(rC.propertyClasses, { id: id });
					}
					else
						console.warn('Property with title '+ti+' has unknown data type '+ty);
				});
				LIB.cacheE(spD.resourceClasses, rC);
			}
		);

/*		// Extract the dictionary entities from the top-level list of <complexType> in the lower part of the schema file;
 		// Note: The dictionaryEntities don't have annotations/documentation, here

		// 1.c Extract the specialized DictionaryEntities with their individual properties:
		let dictionaryEntities = Array.from(xsdDoc.getElementsByTagName('xs:schema')[0].children)
				.filter((ch) => { return ch.tagName == "xs:complexType" })
				// ToDo: filter those which are listed in DictionaryEntitiesCollection - this is quick and dirty:
				.filter((ch) => {
					return ![
						"DictionaryEntitiesCollection",
						"DictionaryEntity",
						"customAttribute",
						"DictionaryRelationsCollection",
						"DictionaryEntityRef",
						"DictionaryRelation",
						"string",
						"SourceEntitiesCollection",
						"SourceEntityRef",
						"SourceRelationsCollection",
						"Relation"
					].includes(ch.getAttribute("name"))
				});
		//	.filter((cpxT)=>{ return cpxT.getAttribute("name")=="DictionaryEntitiesCollection"});

		//        console.debug('ddp', xsdDoc, dictionaryEntities);
	//	console.debug('#',Array.from(xsdDoc.getElementsByTagName('xs:element')));

		dictionaryEntities.forEach(
			(dE) => {
				let ti = dE.getAttribute("name"),
					rC = {
						id: "RC-" + simpleHash(ti),
						title: ti,
						instantiation: ["auto", "user"],
						propertyClasses: [],
						changedAt: spD.createdAt
					};

				// Look for the properties:
				let atts = dE.children[0],
					seq = atts ? Array.from(atts.getElementsByTagName('xs:sequence')) : undefined;
				//	chc = atts ? Array.from(atts.getElementsByTagName('xs:choice')) : undefined;
				//	ch = atts? Array.from(atts.children) : undefined;
				//				console.debug('atts',atts,seq,seq.length,chc,chc.length);

				let prpL = (seq && seq.length == 1) ? Array.from(seq[0].getElementsByTagName('xs:element')) : [];
				//				console.debug('prpL',prpL);

				prpL.forEach(
					(prp) => {
						let ti = prp.getAttribute("ref") || prp.getAttribute("name"),
							id = "PC-" + simpleHash(ti),
							ty = prp.getAttribute("type") || "xs:string",
							dT = LIB.itemBy(spD.dataTypes, "type", ty);
						//	console.debug('prp',ti,ty,dT);
						if (dT) {
							let pC = {
								id: id,
								title: ti,
								description: getDesc(prp),
								dataType: { id: dT.id },
								changedAt: spD.createdAt
							};
							LIB.cacheE(spD.propertyClasses, pC);
							LIB.cacheE(rC.propertyClasses, { id: id });
						}
						else
							console.warn('Unknown data type', ty);
					}
				);
				LIB.cacheE(spD.resourceClasses, rC);
			}
		); */

		// 2. Extract the dictionaryRelations from the "DictionaryRelationsCollection" in the upper part of the schema file
		let dictionaryRelations = Array.from(xsdDoc.getElementsByTagName('xs:schema')[0].children)
			.filter((ch) => { return ch.tagName == "xs:complexType"; })
			.filter((ch) => { return ch.getAttribute("name") == "DictionaryRelationsCollection" });
//        console.debug('rels', Array.from(dictionaryRelations[0].children[0].children));

		Array.from(
			dictionaryRelations[0].children[0].children,
			(rel) => {
				if (rel.tagName == "xs:element") {

					let ti = rel.getAttribute("name") || "",
						sC:SpecifStatementClass = {
							id: CONFIG.prefixSC + simpleHash(ti),
							title: ti,
							description: getDesc(rel),
							subjectClasses: [],
							objectClasses: [],
							// @ts-ignore - createdAt *is* defined
							changedAt: spD.createdAt
						};

					let entities = Array.from(rel.getElementsByTagName('xs:element')),
						subj = entities.filter(
							(en) => {
								return en.getAttribute("name").includes("subject");
							}
						),
						obj = entities.filter(
							(en) => {
								return en.getAttribute("name").includes("object");
							}
						);
					//					console.debug('#',entities, subj, obj);

					// This is an ugly hack, because semantic significance is derived from the relation names ...
					let sTi = subj[0].getAttribute("name").substring(7),
						oTi = obj[0].getAttribute("name").substring(6);
				/*	// Remove the subject and object names from the relation title
					sC.title = ti.substring(sTi.length, ti.length - oTi.length); */
					// @ts-ignore - sC.subjectClasses *is* defined, here:
					sC.subjectClasses.push({
						id: CONFIG.prefixRC + simpleHash(sTi)
					});
					// @ts-ignore - sC.objectClasses *is* defined, here:
					sC.objectClasses.push({
						id: CONFIG.prefixRC + simpleHash(oTi)
					});

					LIB.cacheE(spD.statementClasses, sC);
				}
			}
		);

		console.info('SpecIF data from DDP', spD);
		return spD;
	} // end of ddpSchema2specifClasses

	function ddpSchema2specifOntology(xsd: string /*, pN:string, pchAt: string */): SpecIF {
		"use strict";

		// Transform the content of the "Dictionary.xsd" file provided by prostep iViP on 2023-03-10.

		let spD: SpecIF = app.ontology.generateSpecifClasses({ domains: ["SpecIF:DomainOntology"], adoptOntologyDataTypes: true }),
			termPropertyClasses = new Map();

		// Initialize - create an inverted map from data type to property class id:
		app.ontology.primitiveDataTypes.forEach(
			(v:string, k:string) => {  // astonishingly the value is provided first
				termPropertyClasses.set(v, k);
			}
		);

		spD.title = [{ text: "prostep iViP DDP (Ontology)" }];
		spD.description = [{ text: "Ontology derived from DDP Schema Version 2.0 created 10.03.2023 08:09:28 by Michael Kirsch, :em engineering methods AG on behalf of prostep iViP Association" }];
		spD.id = "P-DDP-Ontology-V20";
		spD.createdAt = new Date().toISOString();

		let parser = new DOMParser(),
			xsdDoc = parser.parseFromString(xsd, "text/xml");

		// 1. Extract the dictionaryEntities from the DictionaryEntitiesCollection in the upper part of the schema file

		// 1.a Extract the DictionaryEntity with (currently 2) properties als parent:


		// 1.b Extract the specialized DictionaryEntities with their individual properties:
		let dictionaryEntities = Array.from(xsdDoc.getElementsByTagName('xs:schema')[0].children)
			.filter((ch) => { return ch.tagName == "xs:complexType"; })
			.filter((ch) => { return ch.getAttribute("name") == "DictionaryEntitiesCollection" });

		Array.from(
			dictionaryEntities[0].children[0].children,
			(d) => {
				let dE = d.children[0].children[0].children[0];
				// dE is the dictionaryEntity, now.

				// 1a. Create the resource term; the DDP entity is a termResourceClass in SpecIF:
				let ti = dE.getAttribute("name") || "",
					// the resourceTerm:
					rT:SpecifResource = {
						id: CONFIG.prefixR + simpleHash(ti),
						changedAt: spD.createdAt,
						class: {
							"id": "RC-SpecifTermresourceclass"
						},
						properties: []
					};

				// 1b. Add the native properties of the term:
				if (!RE.isolateNamespace.test(ti)) ti = "DDP:" + ti;
				rT.properties.push( { "class": { "id": "PC-SpecifTerm" }, "values": [[{ "text": ti }]] },
									{ "class": { "id": "PC-Description" }, "values": [getDesc(dE)] },
									{ "class": { "id": "PC-TermStatus" }, "values": ["V-TermStatus-50"] },
									{ "class": { "id": "PC-Domain" }, "values": [domainOfDDPElements] },
									{ "class": { "id": "PC-Instantiation" }, "values": ["V-Instantiation-10", "V-Instantiation-20"] });

				// 1c. Store the term ..
				LIB.cacheE(spD.resources, rT);
				// ...  and add it to the hierarchy:
				add2Hierarchy(rT.id, "N-FolderTermsResourceClass");

				// 2a. Create the property terms; the DDP entity attribute is a termPropertyClass in SpecIF:
				let attC = dE.getElementsByTagName('xs:complexContent'),
					atts = attC[0].children[0].children;
				let prpL = (atts && atts.length == 1) ? Array.from(atts[0].getElementsByTagName('xs:element')) : [];
//				console.debug('d', dE, atts, prpL);

				prpL.forEach((prp) => {
					let ti = prp.getAttribute("ref") || prp.getAttribute("name") || "",
						ty = prp.getAttribute("type") || "xs:string",
						dT = LIB.itemBy(spD.dataTypes, "type", ty);
					if (dT) {
						// the propertyTerm:
						let pT: SpecifResource = {
							id: CONFIG.prefixR + simpleHash(ti),
							changedAt: spD.createdAt,
							class: {
								"id": termPropertyClasses.get(ty)
							},
							properties: []
						};
						// 2b. Add the native properties of the term:
						if (!RE.isolateNamespace.test(ti)) ti = "DDP:" + ti;
						pT.properties.push( { "class": { "id": "PC-SpecifTerm" }, "values": [[{ "text": ti }]] },
											{ "class": { "id": "PC-Description" }, "values": [getDesc(dE)] },
											{ "class": { "id": "PC-TermStatus" }, "values": ["V-TermStatus-50"] },
											{ "class": { "id": "PC-Domain" }, "values": [domainOfDDPElements] });

						// 2c. Store the term ..
						LIB.cacheE(spD.resources, pT);
						// ...  and add it to the hierarchy:
						add2Hierarchy(pT.id,"N-FolderTermsPropertyClass");

						// 2d. Relate the termPropertyClass with a "SpecIF:hasPropety" to the termResourceClass
						spD.statements.push({
							id: CONFIG.prefixS + simpleHash(rT.id + pT.id),
							class: { id: "SC-hasProperty" },
							subject: { id: rT.id },
							object: { id: pT.id },
							changedAt: spD.createdAt
						});
					}
					else
						console.warn('Property with title ' + ti + ' has unknown data type ' + ty);
				})
			}
		);

		// 3. Extract the dictionaryRelations from the "DictionaryRelationsCollection" in the upper part of the schema file
		let dictionaryRelations = Array.from(xsdDoc.getElementsByTagName('xs:schema')[0].children)
			.filter((ch) => { return ch.tagName == "xs:complexType"; })
			.filter((ch) => { return ch.getAttribute("name") == "DictionaryRelationsCollection" });
		//        console.debug('rels', Array.from(dictionaryRelations[0].children[0].children));

		Array.from(
			dictionaryRelations[0].children[0].children,
			(rel) => {
				if (rel.tagName == "xs:element") {

					let ti = rel.getAttribute("name") || "",
						// the statementTerm:
						sT: SpecifResource = {
							id: CONFIG.prefixR + simpleHash(ti),  // it is a resource describing a statementTerm
							changedAt: spD.createdAt,
							class: {
								"id": "RC-SpecifTermstatementclass"
							},
							properties: []
						};

					// 1b. Add the native properties of the term:
					if (!RE.isolateNamespace.test(ti)) ti = "DDP:" + ti;
					sT.properties.push( { "class": { "id": "PC-SpecifTerm" }, "values": [[{ "text": ti }]] },
										{ "class": { "id": "PC-Description" }, "values": [getDesc(rel)] },
										{ "class": { "id": "PC-TermStatus" }, "values": ["V-TermStatus-50"] },
										{ "class": { "id": "PC-Domain" }, "values": [domainOfDDPElements] },
										{ "class": { "id": "PC-Instantiation" }, "values": ["V-Instantiation-10", "V-Instantiation-20"] });

					// 1c. Store the term ..
					LIB.cacheE(spD.resources, sT);  // it is a resource describing a statementTerm
					// ...  and add it to the hierarchy:
					add2Hierarchy(sT.id, "N-FolderTermsStatementClass");

					// 3b. Store the relations to eligible subjects and objects:
					// This is an ugly hack, because semantic significance is derived from the relation names ...
					let entities = Array.from(rel.getElementsByTagName('xs:element')),
						subj = entities.filter(
							(en) => {
								return en.getAttribute("name").includes("subject");
							}
						),
						obj = entities.filter(
							(en) => {
								return en.getAttribute("name").includes("object");
							}
						);
//					console.debug('#1',entities, ti, subj, obj);

					let sTi = subj[0].getAttribute("name").substring(7),
						oTi = obj[0].getAttribute("name").substring(6),
						subId = CONFIG.prefixR + simpleHash(sTi),
						obId = CONFIG.prefixR + simpleHash(oTi);

					// It is possible that subject and object point to the same termResourceClass, thus distinguish their ids:
					spD.statements.push({
						id: CONFIG.prefixS + simpleHash(sT.id + 'subject' + subId),
						class: { id: "SC-isEligibleAsSubject" },
						subject: { id: subId },
						object: { id: sT.id },
						changedAt: spD.createdAt
					});
					spD.statements.push({
						id: CONFIG.prefixS + simpleHash(sT.id + 'object' + obId),
						class: { id: "SC-isEligibleAsObject" },
						subject: { id: obId },
						object: { id: sT.id },
						changedAt: spD.createdAt
					});
				}
			}
		);

//		console.info('SpecIF Ontology from DDP', spD);
		return spD;

		function add2Hierarchy(termId:string, folderName:string) {
			if (spD.hierarchies.length == 1 && spD.hierarchies[0].nodes) {
				//	LIB.itemByKey(spD.resources, LIB.makeKey(app.ontology.termPrincipalClasses.value()))
				let fld = LIB.itemByKey(spD.hierarchies[0].nodes, LIB.makeKey(folderName));
				if (fld && fld.nodes)
					LIB.cacheE(
						fld.nodes,
						{
							id: LIB.replacePrefix(CONFIG.prefixN, termId),
							resource: LIB.makeKey(termId),
							changedAt: spD.createdAt
						}
					)
				else
					throw Error("Assumption not met: Did'nt find the folder with id='" + folderName +"'.");
			}
			else
				throw Error("Assumption not met: Hierarchy should have a single element with a folder for ontologies.");
		}
	} // end of ddpSchema2specifOntology

	function getDesc(el: any): SpecifMultiLanguageText {
		//	let docL = Array.from(el.getElementsByTagName('xs:documentation'));  ... yields all subordinated elements in case of an entity
		// assuming that the 'annotation' is first subordinated element:
		let docL = el.children && el.children.length > 0 ? Array.from(el.children[0].children) : [];
		return docL.map(
			(doc: any) => {
				return {
					text: doc.innerHTML,
					language: doc.getAttribute("xml:lang")
				} as SpecifLanguageText
			}
		);
	}
});
