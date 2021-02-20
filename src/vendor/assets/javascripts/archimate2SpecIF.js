/* 	Transform an Open Group Archimate Open Exchange File to SpecIF
	Author: se@enso-managers.de
	License: Apache 2.0
*/

// Parse the Archimate Open-Exchange file (XML) and extract both model-elements and semantic relations in SpecIF Format
function Archimate2Specif( xmlString, opts ) {
	"use strict";
	if( typeof(opts)!='object' || !opts.fileName ) return null;
	if( !opts.fileDate ) 
		opts.fileDate = new Date().toISOString();
	if( !opts.title ) 
		opts.title = opts.fileName.split(".")[0];
	if( typeof(opts.titleLength)!='number' )
		opts.titleLength = 96;
/*	if( typeof(opts.descriptionLength)!='number' )
		opts.descriptionLength = 8192;
	if( !opts.mimeType ) 
		opts.mimeType = "application/archimate+xml"; */

	if( !opts.resClassOutline ) 
		opts.resClassOutline = 'SpecIF:Outline';
	if( !opts.strFolderType ) 
		opts.strFolderType = "SpecIF:Heading";
	if( !opts.strDiagramsType ) 
		opts.strDiagramsType = "SpecIF:Diagrams";
	if( !opts.strGlossaryType ) 
		opts.strGlossaryType = "SpecIF:Glossary";
	if( !opts.strActorFolder ) 
		opts.strActorFolder = "Actors";
	if( !opts.strStateFolder ) 
		opts.strStateFolder = "States";
	if( !opts.strEventFolder ) 
		opts.strEventFolder = "Events";
	if( !opts.strCollectionFolder ) 
		opts.strCollectionFolder = "Collections and Groups";
/*	if( !opts.strAnnotationFolder ) 
		opts.strAnnotationFolder = "Text Annotations";
	if( !opts.strRoleType ) 
		opts.strRoleType = "SpecIF:Role";  */
	if( !opts.strNamespace ) 
		opts.strNamespace = "Archimate:";
	
	let parser = new DOMParser(),
		xmlDoc = parser.parseFromString(xmlString, "text/xml");
//	console.debug('xml',xmlDoc);
		
	// Get the model metadata:
	let L = Array.from(xmlDoc.querySelectorAll("model"));
/*	// There should be exactly one model per Open Exchange file:
	if( L.length<1 ) {
		console.error("... with id '",model.id,"' has no model.");
		return
	};
	if( L.length>1 )
		console.warn("Diagram with id '",model.id,"' has more than one model.");  */
	
	var model = {};
	// The project's id and title:
	model.id = L[0].getAttribute("identifier");

	const nbsp = '&#160;', // non-breakable space
		apx = simpleHash(model.id),
		hId = 'Archimate-' + apx;

	model["$schema"] = "https://specif.de/v1.0/schema.json";
	model.dataTypes = DataTypes();
	model.propertyClasses = PropertyClasses();
	model.resourceClasses = ResourceClasses();
	model.statementClasses = StatementClasses();
//	model.resources = Folders();
	model.resources = [];
	model.statements = [];

	// 1. Additional attributes such as title and description:
	Array.from( L[0].children, 
		(ch)=>{
			switch( ch.nodeName ) {
				case 'name': 
					model.title = ch.innerHTML;
					break;
				case 'documentation':
					model.description = ch.innerHTML
			}
		}
	);

	// 2. Transform the model elements:
	Array.from(xmlDoc.querySelectorAll("element"), 
		(el)=>{
			let r = {
					id: el.getAttribute('identifier'),
				//	title: '',
					properties: [],
					changedAt: opts.fileDate
				},
				ty = el.getAttribute('xsi:type');

			// Determine the resourceClass:
			switch( ty ) {
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
				case 'DistributionNetwork':
				case 'Device':
				case 'SystemSoftware':
				case 'TechnologyCollaboration':
				case 'TechnologyInterface':
				case 'Path':
				case 'CommunicationNetwork':
				case 'TechnologyFunction':
				case 'TechnologyProcess':
				case 'TechnologyInteraction':
				case 'TechnologyService':
				case "OrJunction":
				case "AndJunction":
					r['class'] = "RC-Actor"
					break;
				case "Goal":
				case 'Capability':
				case 'BusinessObject':
				case 'Contract':
				case 'Representation':
				case 'Product':
				case 'DataObject':
				case 'Artifact':
					r['class'] = "RC-State";
					break;
				case 'BusinessEvent':
				case 'ApplicationEvent':
				case 'TechnologyEvent':
					r['class'] = "RC-Event";
					break;
				case 'Location':
				case 'Grouping':
					r['class'] = "RC-Collection";
					break;
				default: 
					// The Archimate element with tag  extensionElements  and title  <empty string>  has not been transformed.
					console.warn('Element: Unknown xsi:type ', ty);
					r['class'] = "RC-Paragraph";  // better than nothing .. but the element will not appear in the glossary!
			};

			if( r['class'] ) {
				// Additional attributes such as title and description:
				Array.from( el.children, 
					(ch)=>{
						switch( ch.nodeName ) {
							case 'name': 
								r.title = ch.innerHTML;
								break;
							case 'documentation':
								r.properties.push({
									class: "PC-Description",
									value: ch.innerHTML
								})
						};
					}
				);

				// Store the Archimate element-type:
				r.properties.push({
					class: "PC-Type", 
					value: opts.strNamespace+ty
				});

				model.resources.push(r);
			};
		}
	);
	
	// 3. Transform the relations:
	Array.from(xmlDoc.querySelectorAll("relationship"), 
		(rs)=>{
			let s = {
					id: rs.getAttribute('identifier'),
					subject: rs.getAttribute('source'),
					object: rs.getAttribute('target'),
					changedAt: opts.fileDate
				},
				ty = rs.getAttribute('xsi:type');

			// Determine the statementClass:
			switch( ty ) {
				case 'Access':
					switch( rs.getAttribute('accessType') ) {
						case 'Write':
							s['class'] = "SC-writes";
							break
						case 'Read':
							s['class'] = "SC-reads"
					};
					break;
				case 'Serving':
					s['class'] = "SC-serves";
					break;
				case 'Influence':
					s['class'] = "SC-influences";
					break;
				case 'Triggering':
					s['class'] = "SC-triggers";
					break;
				case 'Flow':
					s['class'] = "SC-precedes";
					break;
				case 'Composition':
			//		s['class'] = "SC-isComposedOf";
					s['class'] = "SC-contains";
					break;
				case 'Aggregation':
					s['class'] = "SC-isAggregatedBy";
					break;
				case 'Realization':
					s['class'] = "SC-realizes";
					break;
				case 'Specialization':
					s['class'] = "SC-isSpecializationOf";
					break;
				case 'Association':
					s['class'] = "SC-isAssociatedWith";
					s.isUndirected = !rs.getAttribute('isDirected');
					break;
				case 'Assignment':
					s['class'] = "SC-isAssignedTo";
					break;
				default: 
					// The Archimate element with tag  extensionElements  and title  <empty string>  has not been transformed.
					console.warn('Relationship: Unknown xsi:type ', ty)
			};

			// Store a relation, only if it has a known class and when both subject and object have been recognized:
			if( s['class'] 
				&& indexById(model.resources,s.subject)>-1
				&& indexById(model.resources,s.object)>-1 ) {
				// Additional attributes such as title and description:
				Array.from( rs.children, 
					// if a relation does not have a name, the statementClass' title acts as default value.
					(ch)=>{
						switch( ch.nodeName ) {
							case 'name': 
								s.title = ch.innerHTML;
								break;
							case 'documentation':
								s.description = ch.innerHTML
						}
					}
				);
			
				model.statements.push( s );
			};
		}
	);

	// 4. Transform the diagrams:
	Array.from(xmlDoc.querySelectorAll("view"), 
		(vi)=>{
			let dId = vi.getAttribute('identifier'),
				r = {
					id: dId,
				//	title: '',
					class: "RC-Diagram",
					properties: [],
					changedAt: opts.fileDate
				};
				
				// The view's nodes are hierarchically ordered: 
				function getNode(nd) {
					// ToDo: Extract nodes of xsi:type "Label" = Note elements
					//       as well as xsi:type="Container" = Group

					// This node is contained in the diagram in the outer loop;
					// it is of xsi:type "Element":
					let ref = nd.getAttribute('elementRef');
					// Store a relation, only if the element has been recognized before:
					if( ref && indexById(model.resources,ref)>-1 )
						model.statements.push({
							id: genID('S-'),
							class: "SC-shows",
							subject: dId,
							object: ref,
							changedAt: opts.fileDate
						});
					Array.from( nd.children, 
						(ch)=>{
							if( ch.nodeName=='node' )
								getNode(ch)
						}
					)
				}
			
			// Additional attributes such as title and description:
			Array.from( vi.children, 
				(ch)=>{
					switch( ch.nodeName ) {
						case 'name': 
							r.title = ch.innerHTML;
							break;
						case 'documentation':
							r.properties.push({
								class: "PC-Description",
								value: ch.innerHTML
							});
							break;
						case 'node':
							getNode(ch);
					/*		break;
						case 'connection':
							// This connection is contained in the diagram in the outer loop:
							model.statements.push({
								id: genID('S-'),
								class: "SC-shows",
								subject: dId,
								object: ch.getAttribute('relationshipRef'),
								changedAt: opts.fileDate  
							})  */
					};
				}
			);
			
			// ToDo: Add diagram reference (but we need to get or find the diagram, first).
			
			let vp = vi.getAttribute('viewpoint');
			// Classify the diagram depending on the viewpoint:
		/*	switch( vp ) {
				default:
					r.properties.push({
						class: "PC-Type", 
						value: ""
					});
			}; */
			// Store the Archimate viewpoint:
			if( vp ) 
					r.properties.push({
						class: "PC-Notation", 
						value: vp+" Viewpoint"
					});
			
			model.resources.push(r);
		}
	);

	// 5. Add the resource for the hierarchy root:
	model.resources.push({
		id: hId,
		title: model.title,
		class: "RC-Folder",
		properties: [{
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
	
/*	// Reference used files,
	// - the Archimate Open Exchange file:
	model.files = [{
		id: 'F-'+simpleHash(opts.fileName),
		title: opts.fileName,
		blob: new Blob([xmlString], {type: opts.mimeType}),
		type: opts.mimeType,
		changedAt: opts.fileDate
	}];  */

//	console.debug('Archimate',model);
	return model;


// =======================================
// called functions:	

	// The hierarchy with pointers to all resources:
	function NodeList(resL) {
		// a) first add the folders:
		let nodeL =  [{
			id: "H-"+hId,
			resource: hId,
			nodes: [{
				id: "N-"+simpleHash("FolderDiagrams-" + apx),
				resource: "FolderDiagrams-" + apx,
				nodes: [],
				changedAt: opts.fileDate
	/*		},{
				id: genID("N-"),
				resource: "FolderGlossary-" + apx,
				nodes: [{
					id: genID("N-"),
					resource: "FolderAct-" + apx,
					nodes: [],
					changedAt: opts.fileDate
				},{
					id: genID("N-"),
					resource: "FolderSta-" + apx,
					nodes: [],
					changedAt: opts.fileDate
				},{
					id: genID("N-"),
					resource: "FolderEvt-" + apx,
					nodes: [],
					changedAt: opts.fileDate
				},{
					id: genID("N-"),
					resource: "FolderCol-" + apx,
					nodes: [],
					changedAt: opts.fileDate
				}],
				changedAt: opts.fileDate */
			}],
			changedAt: opts.fileDate
		}];

		// b) Add the folders and the diagrams to the hierarchy:

			function parseItem(ch,resL,ndL) {
				if(ch.nodeName=="item") {
					let idRef = ch.getAttribute("identifierRef");
					if( idRef ) {
//						console.debug('#5a', ch );
						// It is a diagram reference, 
						// it should have been transformed before,
						// so no resource needs to be crated.
						// However, create hierarchy node:
						ndL.push({
							id: "N-"+simpleHash(idRef),
							resource: idRef,
							nodes: [],
							changedAt: opts.fileDate
						});
					}
					else {
//						console.debug('#5b', ch );
						// It is another folder,
						// create the resource:
						let ti = getChildsInnerByTag(ch,"label");
						idRef = "N-"+simpleHash( ti+apx );
						resL.push({
							id: idRef,
							class: "RC-Folder",
							title: ti,
							description: getChildsInnerByTag(ch,"documentation"),
							properties: [],
							changedAt: opts.fileDate
						});
						// create the node:
						ndL.push({
							id: "N-"+simpleHash(idRef),
							resource: idRef,
							nodes: [],
							changedAt: opts.fileDate
						});
						// step down to get children:
						Array.from(ch.children, 
							(ch)=>{parseItem( ch, resL, ndL[ndL.length-1].nodes )}
						);
					};
				};
			}

		Array.from(xmlDoc.querySelectorAll("organizations"), 
			(org)=>{
				Array.from(org.children,
					(ch)=>{
						if(ch.nodeName=="item")
							switch(	getChildsInnerByTag(ch,"label")) {
							/*	case "Business":
								case "Application":
								case "Technology &amp; Physical":
								case "Other":
								case "Relations":
									break; */
								case "Views":
									// We've got the 'Views' folder.
									// a) create the folder resource:
									resL.push({
										id: "FolderDiagrams-" + apx,
										class: "RC-Folder",
										title: opts.strDiagramsType,
										description: getChildsInnerByTag(ch,"documentation"),
										properties: [{
											class: "PC-Type",
											value: opts.strDiagramsType
										}],
										changedAt: opts.fileDate
									});
									console.debug('Views',ch,resL[resL.length-1]);
									
									// b) the hierarchy node has been created before: nodeL[0].nodes[0]

									// c) get the <item> subfolders:
									Array.from(ch.children, 
										(ch)=>{parseItem( ch, resL, nodeL[0].nodes[0].nodes )}
									);
							}
					}
				);
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
				id: genID("N-"),
				resource: r.id,
				changedAt: opts.fileDate
			};
			// sort resources according to their type:
			let idx = ["RC-Actor","RC-State","RC-Event","RC-Collection"].indexOf( r['class'] );
			if( idx>-1 )
				nodeL[0].nodes[1].nodes[idx].nodes.push(nd)
		}); */
		return nodeL
	};

	// The dataTypes:
	function DataTypes() {
		return [{
	/*		id: "DT-Integer",
			title: "Integer",
			type: "xs:integer",
			minInclusive: -32768,
			maxInclusive: 32767,
			changedAt: opts.fileDate
		},{  */
			id: "DT-ShortString",
			title: "String ["+opts.titleLength+"]",
			type: "xs:string",
			maxLength: opts.titleLength,
			changedAt: opts.fileDate
		},{
			id: "DT-Text",
			title: "Text",
		//	title: "String ["+opts.descriptionLength+"]",
			type: "xs:string",
		//	maxLength: opts.descriptionLength,
			changedAt: opts.fileDate
		}]
	}
	
	// The property classes:
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
	
	// The resource classes:
	function ResourceClasses() {
		return [{
			id: "RC-Diagram",
			title: "SpecIF:Diagram",
			description: "A 'Diagram' is a graphical model view with a specific communication purpose, e.g. a business process or system composition.",
			instantiation: ['user'],
			propertyClasses: ["PC-Description","PC-Diagram","PC-Type","PC-Notation"],
			icon: "&#9635;",
			changedAt: opts.fileDate
		},{
			id: "RC-Actor",
			title: "FMC:Actor",
			description: "An 'Actor' is a fundamental model element type representing an active entity, be it an activity, a process step, a function, a system component or a role.",
			instantiation: ['auto'],
			propertyClasses: ["PC-Description","PC-Type"],
			icon: "&#9632;",
			changedAt: opts.fileDate
		},{
			id: "RC-State",
			title: "FMC:State",
			description: "A 'State' is a fundamental model element type representing a passive entity, be it a value, a condition, an information storage or even a physical shape.",
			instantiation: ['auto'],
			propertyClasses: ["PC-Description","PC-Type"],
			icon: "&#9679;",
			changedAt: opts.fileDate
		},{
			id: "RC-Event",
			title: "FMC:Event",
			description: "An 'Event' is a fundamental model element type representing a time reference, a change in condition/value or more generally a synchronisation primitive.",
			instantiation: ['auto'],
			propertyClasses: ["PC-Description","PC-Type"],
			icon: "&#11047;",
			changedAt: opts.fileDate
		},{
/*			id: "RC-Note",
			title: "SpecIF:Note",
			description: "A 'Note' is additional information by the author referring to any resource.",
			propertyClasses: ["PC-Description","PC-Type"],
			changedAt: opts.fileDate  
		},{  */
			id: "RC-Collection",
			title: "SpecIF:Collection",
			instantiation: ['auto'],
			description: "A 'Collection' is an arbitrary group of resources linked with a SpecIF:contains statement. It corresponds to a 'Group' in BPMN Diagrams.",
			propertyClasses: ["PC-Description","PC-Type"],
			icon: "&#11034;",
			changedAt: opts.fileDate
		},{
			id: "RC-Folder",
			title: opts.strFolderType,
			description: "Folder with title and text for chapters or descriptive paragraphs.",
			isHeading: true,
			instantiation: ['auto','user'],
			propertyClasses: ["PC-Description","PC-Type"],
			changedAt: "2016-05-26T08:59:00+02:00"
		},{
			id: "RC-Paragraph",
			title: "SpecIF:Paragraph",
			description: "Information with title and text for descriptive paragraphs.",
			instantiation: ["auto","user"],
			propertyClasses: ["PC-Description","PC-Type"],
			changedAt: "2020-12-04T18:59:00+01:00"
		}]
	}
	// The statement classes:
	function StatementClasses() {
		return [{
			id: "SC-shows",
			title: "SpecIF:shows",
			description: "Statement: Plan shows Model-Element",
			instantiation: ['auto'],
			subjectClasses: ["RC-Diagram"],
			objectClasses: ["RC-Actor", "RC-State", "RC-Event"],
			changedAt: opts.fileDate
		},{
			id: "SC-contains",
			title: "SpecIF:contains",
			description: "Statement: Model-Element contains Model-Element",
			instantiation: ['auto'],
			subjectClasses: ["RC-Actor", "RC-State", "RC-Event"],
			objectClasses: ["RC-Actor", "RC-State", "RC-Event"],
			changedAt: opts.fileDate
		},{
			// ToDo: Make more specific with respect to subjectClasses and objectClasses, if possible
			id: "SC-isAssignedTo",
			title: "SpecIF:isAssignedTo",
			description: "Statement: The allocation of responsibility, performance of behavior, or execution",
			instantiation: ['auto'],
			subjectClasses: ["RC-Actor", "RC-State", "RC-Event"],
			objectClasses: ["RC-Actor", "RC-State", "RC-Event"],
			changedAt: opts.fileDate
		},{
			id: "SC-isComposedOf",
			title: "SpecIF:isComposedOf",
			description: "Statement: A state (data-object) is composed of a state",
			instantiation: ['auto'],
			subjectClasses: ["RC-State"],
			objectClasses: ["RC-State"],
			changedAt: opts.fileDate
		},{
			id: "SC-isAggregatedBy",
			title: "SpecIF:isAggregatedBy",
			description: "Statement: A state (data-object) is aggregated by a state",
			instantiation: ['auto'],
			subjectClasses: ["RC-State"],
			objectClasses: ["RC-State"],
			changedAt: opts.fileDate
		},{
			id: "SC-isSpecializationOf",
			title: "SpecIF:isSpecializationOf",
			description: "Statement: A state (data-object) is a specialization of a state",
			instantiation: ['auto'],
			subjectClasses: ["RC-State"],
			objectClasses: ["RC-State"],
			changedAt: opts.fileDate
		},{
			id: "SC-realizes",
			title: "SpecIF:realizes",
			description: "Statement: An entity plays a critical role in the creation, achievement, sustenance, or operation of a more abstract entity.",
			instantiation: ['auto'],
			subjectClasses: ["RC-Actor"],
			objectClasses: ["RC-Actor"],
			changedAt: opts.fileDate
		},{
			id: "SC-serves",
			title: "SpecIF:serves",
			description: "Statement: An element provides its functionality to another element.",
			instantiation: ['auto'],
			subjectClasses: ["RC-Actor"],
			objectClasses: ["RC-Actor"],
			changedAt: opts.fileDate
		},{
			id: "SC-influences",
			title: "SpecIF:influences",
			description: "Statement: An element affects the implementation or achievement of some motivation element.",
			instantiation: ['auto'],
			subjectClasses: ["RC-Actor","RC-State"],
			objectClasses: ["RC-Actor","RC-State"],
			changedAt: opts.fileDate
		},{
			id: "SC-isAssociatedWith",
			title: "SpecIF:isAssociatedWith",
			description: "Statement: Actor (Component,Function) is associated with an Actor (Component,Function).",
			instantiation: ['auto'],
			subjectClasses: ["RC-Actor"],
			objectClasses: ["RC-Actor"],
			changedAt: opts.fileDate
		},{
			id: "SC-stores",
			title: "SpecIF:stores",
			description: "Statement: Actor (Role, Function) writes and reads State (Information).",
			instantiation: ['auto'],
			subjectClasses: ["RC-Actor"],
			objectClasses: ["RC-State"],
			changedAt: opts.fileDate
		},{
			id: "SC-writes",
			title: "SpecIF:writes",
			description: "Statement: Actor (Role, Function) writes State (Information).",
			instantiation: ['auto'],
			subjectClasses: ["RC-Actor"],
			objectClasses: ["RC-State"],
			changedAt: opts.fileDate
		},{
			id: "SC-reads",
			title: "SpecIF:reads",
			description: "Statement: Actor (Role, Function) reads State (Information)",
			instantiation: ['auto'],
			subjectClasses: ["RC-Actor"],
			objectClasses: ["RC-State"],
			changedAt: opts.fileDate
		},{
			id: "SC-precedes",
			title: "SpecIF:precedes",
			description: "A FMC:Actor 'precedes' a FMC:Actor; e.g. in a business process or activity flow.",
			instantiation: ['auto'],
			subjectClasses: ["RC-Actor"],
			objectClasses: ["RC-Actor"],
			changedAt: opts.fileDate
		},{
			id: "SC-signals",
			title: "SpecIF:signals",
			description: "A FMC:Actor 'signals' a FMC:Event.",
			instantiation: ['auto'],
			subjectClasses: ["RC-Actor", "RC-Event"],
			objectClasses: ["RC-Event"],
			changedAt: opts.fileDate
		},{
			id: "SC-triggers",
			title: "SpecIF:triggers",
			description: "A temporal or causal relationship between elements.",
			instantiation: ['auto'],
			subjectClasses: ["RC-Event"],
			objectClasses: ["RC-Actor"],
			changedAt: opts.fileDate
	/*	},{
			id: "SC-refersTo",
			title: "SpecIF:refersTo",
			description: "A SpecIF:Comment, SpecIF:Note or SpecIF:Issue 'refers to' any other resource.",
			instantiation: ['auto'],
			subjectClasses: ["RC-Note"],
			objectClasses: ["RC-Diagram", "RC-Actor", "RC-State", "RC-Event", "RC-Collection"],
			changedAt: opts.fileDate  */
		}]
	}

	// The folder resources for the glossary:
/*	function Folders() {
		return [{
			id: "FolderGlossary-" + apx,
			class: "RC-Folder",
			title: opts.strGlossaryType,
			properties: [{
				class: "PC-Type",
				value: opts.strGlossaryType
			}],
			changedAt: opts.fileDate
		}, {
			id: "FolderAct-" + apx,
			class: "RC-Folder",
			title: opts.strActorFolder,
			properties: [],
			changedAt: opts.fileDate
		}, {
			id: "FolderSta-" + apx,
			class: "RC-Folder",
			title: opts.strStateFolder,
			properties: [],
			changedAt: opts.fileDate
		}, {
			id: "FolderEvt-" + apx,
			class: "RC-Folder",
			title: opts.strEventFolder,
			properties: [],
			changedAt: opts.fileDate
		}, {
			id: "FolderCol-" + apx,
			class: "RC-Folder",
			title: opts.strCollectionFolder,
			properties: [],
			changedAt: opts.fileDate
		}, {
			id: "FolderNte-" + apx,
			class: "RC-Folder",
			title: opts.strAnnotationFolder,
			properties: [],
			changedAt: opts.fileDate 
		}]
	} */
	
// =======================================
// some helper functions:	

	// Make a very simple hash code from a string:
	// http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
	function simpleHash(str) {for(var r=0,i=0;i<str.length;i++)r=(r<<5)-r+str.charCodeAt(i),r&=r;return r};
	// http://stackoverflow.com/questions/10726909/random-alpha-numeric-string-in-javascript
	function genID(pfx) {
		if( !pfx || pfx.length<1 )
			pfx = 'ID_'
		else
			if( !/^[A-Za-z_]/.test(pfx) ) pfx = '_'+pfx;   // prefix must begin with a letter or '_'
		const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		let result = '';
		for( var i=27; i>0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
		return pfx+result
	}
	function getChildsInnerByTag(itm,tag) {
		// Get innerHTML of the child with the given nodeName:
		let lst = Array.from(itm.children);
	//	console.debug('#',itm,lst);
		for( var i=0,I=lst.length; i<I; i++ ) {
	//		console.debug('#'+i,lst[i].nodeName,lst[i].innerHTML);
			if( lst[i].nodeName==tag ) return lst[i].innerHTML;
		};
		return "";
	}
}
