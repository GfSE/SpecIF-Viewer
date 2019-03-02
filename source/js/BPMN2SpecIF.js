/* 	Transform BPMN-XML to SpecIF
	Author: Robert Kanitz, adesso AG
	License: Apache 2.0
*/

// Durchlaufen der XML Datei und Überführen der Elemente in das SpecIF Format
// Reference: https://docs.camunda.org/stable/api-references/bpmn20/
function BPMN2Specif( xmlString, opts ) {
	"use strict";
	if( typeof(opts)!='object' ) return null;
	if( !opts.title ) 					opts.title = opts.xmlName.split(".")[0];

	if( !opts.strJoinExcGateway ) 		opts.strJoinExcGateway = "Joining Exclusive Gateway";
	if( !opts.strJoinExcGatewayDesc ) 	opts.strJoinExcGatewayDesc = "<p>Wait for any <em>one</em> incoming connection to continue.</p>";
	if( !opts.strJoinParGateway ) 		opts.strJoinParGateway = "Joining Parallel Gateway";
	if( !opts.strJoinParGatewayDesc ) 	opts.strJoinParGatewayDesc = "<p>Wait for <em>all</em> incoming connections to continue.</p>";
	if( !opts.strForkExcGateway ) 		opts.strForkExcGateway = "Forking Exclusive Gateway";
	if( !opts.strForkExcGatewayDesc ) 	opts.strForkExcGatewayDesc = "<p>Evaluate the condidition and signal the respective event.</p>"
	if( !opts.strForkParGateway ) 		opts.strForkParGateway = "Forking Parallel Gateway";
	if( !opts.strForkParGatewayDesc ) 	opts.strForkParGatewayDesc = "<p>Forward control to <em>all</em> outgoing connections.</p>"
	if( !opts.strTextAnnotation ) 		opts.strTextAnnotation = "Text Annotation"
	
	if( !opts.strGlossaryFolder ) 		opts.strGlossaryFolder = "Model Elements (Glossary)"
	if( !opts.strActorFolder ) 			opts.strActorFolder = "Actors"
	if( !opts.strStateFolder ) 			opts.strStateFolder = "States"
	if( !opts.strEventFolder ) 			opts.strEventFolder = "Events"
	if( !opts.strAnnotationFolder ) 	opts.strAnnotationFolder = "Text Annotations"
	
	var parser = new DOMParser();
	var xmlDoc = parser.parseFromString(xmlString, "text/xml");
	var model = {};

	// BPMN Collaborations list participants (with referenced processes) and messageFlows.
	// Participants are source and/or target for message-flows (not the referenced processes),
	// so we decide to transform the participants to SpecIF, but not the processes.
	let x = xmlDoc.querySelectorAll("collaboration");
	// There should be only one collaboration per BPMN file:
	if( x.length>1 )
		console.warn("Diagram with id ',model.id,' has more than one collaboration.");
//	console.debug('collaboration',x);

	// The project's id and title:
	model.id = x[0].getAttribute("id");
	model.title = opts.title || x[0].nodeName;
	model.description = opts.description;
	model.specifVersion = "0.10.4";
	model.dataTypes = DataTypes();
	model.resourceClasses = ResourceClasses();
	model.statementClasses = StatementClasses();
	model.hierarchyClasses = HierarchyClasses();

	// Reference used files,
	// - the BPMN file:
	model.files = [{
		id: opts.xmlName,
		blob: xmlString,
		type: "application/bpmn+xml"
	}];
	// - an image of the process, if available:
	if( opts.svgName )
		model.files.push({
			id: opts.svgName,
		//	blob: ,
			type: "image/svg+xml"
		});
	model.resources = Folders();
	model.statements = [];

	// 1. Represent the diagram itself:
	const diagramId = 'D-' + model.id,
		dg = opts.svgName?"<object data=\""+opts.svgName+"\" type=\"image/svg+xml\" >"+opts.svgName+"</object>"
						:"<object data=\""+opts.xmlName+"\" type=\"application/bpmn+xml\" >"+opts.xmlName+"</object>";
	model.resources.push({
		id: diagramId,
		title: model.title,
		class: 'RT-Pln',
		properties: [{
			title: "dcterms:title",
			class: "PT-Pln-Name",
			value: model.title
		}, {
			title: "SpecIF:Diagram",
			class: "PT-Pln-Diagram",
			value: "<div><p class=\"inline-label\">Model View:</p><p>"+dg+"</p></div>"
		}, {
			title: "SpecIF:Notation",
			class: "PT-Pln-Notation",
			value: "BPMN 2.0 Process Diagram"
		}],
		changedAt: opts.xmlDate
	});
	
	// 2. Analyse the 'collaboration' and get the participating processes plus the exchanged messages.
	x[0].childNodes.forEach( function(el) {
//		console.debug('collaboration element',el);
		// quit, if the child node does not have a tag, e.g. if it is '#text':
		if( !el.tagName ) return;
		let tag = el.tagName.split(':').pop();	// tag without namespace
		// The participating processes;
		// we transform the participants with their id, but not the processes:
		if (el.nodeName.includes("participant")) {
			model.resources.push({
				id: el.getAttribute("id"),
				process: el.getAttribute("processRef"),
				title: el.getAttribute("name"),
				class: 'RT-Act',
				properties: [{
					title: "dcterms:title",
					class: "PT-Act-Name",
					value: el.getAttribute("name")
				}, {
					title: "SpecIF:Stereotype",
					class: "PT-Act-Stereotype",
					value: "BPMN:"+tag
				}],
				changedAt: opts.xmlDate
			});
		};
		// The messages between the processes:
		if (el.nodeName.includes("messageFlow")) {
			// a. The message data (FMC:State):
			model.resources.push({
				id: el.getAttribute("id"),
				title: el.getAttribute("name"),
				class: 'RT-Sta',
				properties: [{
					title: "dcterms:title",
					class: "PT-Sta-Name",
					value: el.getAttribute("name")
				}, {
					title: "SpecIF:Stereotype",
					class: "PT-Sta-Stereotype",
					value: "BPMN:"+tag
				}],
				changedAt: opts.xmlDate
			});
			// b. We assume that the sourceRef and targetRef will be found later on.
			// c. The writing relation (statement):
			model.statements.push({
				id: el.getAttribute("sourceRef")+'-S',
				title: 'SpecIF:writes',
				class: 'ST-writes',
				subject: el.getAttribute("sourceRef"),
				object: el.getAttribute("id"),
				changedAt: opts.xmlDate
			});
			// d. The reading relation (statement):
			// Todo: Is the signalling characteristic well covered? It is not just reading!
			model.statements.push({
				id: el.getAttribute("targetRef")+'-O',
				title: 'SpecIF:reads',
				class: 'ST-reads',
				subject: el.getAttribute("targetRef"),
				object: el.getAttribute("id"),
				changedAt: opts.xmlDate
			})
		}
	});
	// 3. Parse the processes.
	// For SpecIF, the participant is declared the container for the processes' model-elements ... 
	// and the BPMN 'processes' disappear from the semantics.
	// ToDo: Remove any process having neither contained elements nor messageFlows (e.g. Bizagi 'Hauptprozess').
	x = xmlDoc.querySelectorAll("process");
	let taL = [];	// temporary list of text annotations
	x.forEach( function(pr) {
		// here, we look at a process:
//		console.debug('process',pr);
		// find the participant representing (or being responsible for) the process:
		let pa = model.resources.find( function(e) { return e.process==pr.getAttribute('id') } );
		// depending on the BPMN generator, the name is supplied in the participant or in the process definition ... or both.
		pa.title = pa.title || pr.getAttribute('name');
		let ctL = [],	// temporary list for containment relations between lanes and model-elements
			gwL = [],	// temporary list for gateways needing some special attention later
			tag, id, title, desc, cId, seqF;
		// 4.1 First pass to get the lanes, which do not necessarily come first:
		pr.childNodes.forEach( function(el) {
			tag = el.nodeName.split(':').pop();	// tag without namespace
//			console.debug('#1',tag);
			switch(tag) {
				case 'laneSet':
					// 3.1 Get the laneSets/lanes with their model elements;
					//    	note that a 'laneSet' is not mandatory, e.g. BPMNio does not necessarily provide any.
					el.childNodes.forEach( function(el2) {
						if( el2.nodeName.includes('lane') ) {
							let elName = el2.getAttribute("name"),
								el2Id = el2.getAttribute("id");
							if( elName ) {
								// store the lane as SpecIF:Role
								model.resources.push({
									id: el2Id,
									title: elName,
									class: 'RT-Act',
									properties: [{
										title: "dcterms:title",
										class: "PT-Act-Name",
										value: elName
									}, {
										title: "SpecIF:Stereotype",
										class: "PT-Act-Stereotype",
										value: "BPMN:"+'lane'
									}],
									changedAt: opts.xmlDate
								});
								// store the containment relation for the lane:
								model.statements.push({
									id: pa.id + '-contains-' + el2Id,
									title: 'SpecIF:contains',
									class: 'ST-contains',
									subject: pa.id,	// the process
									object: el2Id,		// the lane
									changedAt: opts.xmlDate
								});
								// temporarily store relations for the contained model-elements:
								el2.childNodes.forEach( function(el3) {
									if( el3.nodeName.includes('flowNodeRef') ) {
										ctL.push({
											class: 'ST-contains',
											subject: el2Id, 		// the lane
											object: el3.innerHTML	// the contained model-element
										})
									}
								})
							}
						}
					})
				// skip all other tags for now.
			}
		});
		// 4.2 Second pass to collect the model-elements:
		pr.childNodes.forEach( function(el) {
			// quit, if the child node does not have a tag, e.g. if it is '#text':
			if( !el.tagName ) return;
			// else:
			tag = el.tagName.split(':').pop();	// tag without namespace
			id = el.getAttribute("id");
			title = el.getAttribute("name");
//			console.debug('#2',tag,id,title);
			let found = false,
				gw;
			switch(tag) {
				case 'laneSet':
					// has been analyzed, before
					return;
				case 'sequenceFlow':
				case 'association':
				case 'textAnnotation':
					// will be analyzed in a later pass
					break;
				case 'task':
				case 'userTask':
				case 'scriptTask':
				case 'callActivity':
				case 'subProcess':
					// store the model-element as FMC:Actor:
					model.resources.push({
						id: id,
						title: title,
						class: "RT-Act",
						properties: [{
							title: "dcterms:title",
							class: "PT-Act-Name",
							value: title
						}, {
							title: "SpecIF:Stereotype",
							class: "PT-Act-Stereotype",
							value: 'BPMN:'+tag
						}],
						changedAt: opts.xmlDate
					});
					// store the read/write associations:
					el.childNodes.forEach( function(ch) {
						if( !ch.tagName ) return;
						if( ch.tagName.includes('dataInputAssociation') ) {
							// find sourceRef:
							ch.childNodes.forEach( function(ref) {
//								console.debug('dataInputAssociation.childNode',ref);
								if( !ref.tagName ) return;
								if( ref.tagName.includes('sourceRef') ) {
									let dS = ref.innerHTML
									// store reading association:
									model.statements.push({
										id: id+'-reads-'+dS,
										title: 'SpecIF:reads',
										class: 'ST-reads',
										subject: id,
										object: dS,
										changedAt: opts.xmlDate
									})
								}
							});
							return
						};
						if( ch.tagName.includes('dataOutputAssociation') ) {
							// find targetRef:
							ch.childNodes.forEach( function(ref) {
//								console.debug('dataOutputAssociation.childNode',ref);
								if( !ref.tagName ) return;
								if( ref.tagName.includes('targetRef') ) {
									let dS = ref.innerHTML
									// store writing association:
									model.statements.push({
										id: id+'-writes-'+dS,
										title: 'SpecIF:writes',
										class: 'ST-writes',
										subject: id,
										object: dS,
										changedAt: opts.xmlDate
									})
								}
							})
						}
					});
					found = true;
					break;
				case 'dataObjectReference':
				case 'dataStoreReference':
					// Store the model-element as FMC:State,
					// Interestingly enough, the name and other information are properties of xxxReference.
					// - Which id to use, the dataObjectReference's or the dataObject's ?
					// - We decide to use the former, as the associations use it.
					// - Even though we use 'dataObject' or 'dataStore' as stereotype.
					model.resources.push({
						id: id,
						title: title,
						class: "RT-Sta",
						properties: [{
							title: "dcterms:title",
							class: "PT-Sta-Name",
							value: title
						}, {
							title: "SpecIF:Stereotype",
							class: "PT-Sta-Stereotype",
							value: 'BPMN:'+( tag=='dataStoreReference'? 'dataStore' : 'dataObject' )
						}],
						changedAt: opts.xmlDate
					});
					found = true;
					break;
				case 'dataObject':
				case 'dataStore':
					// nothing
					break;
				case 'startEvent':
				case 'intermediateThrowEvent':
				case 'intermediateCatchEvent':
				case 'endEvent':
					// store the model-element as FMC:State:
					model.resources.push({
						id: id,
						title: title,
						class: "RT-Evt",
						properties: [{
							title: "dcterms:title",
							class: "PT-Evt-Name",
							value: title
						}, {
							title: "SpecIF:Stereotype",
							class: "PT-Evt-Stereotype",
							value: 'BPMN:'+tag
						}],
						changedAt: opts.xmlDate
					});
					found = true;
					break;
				case 'exclusiveGateway':
				case 'parallelGateway':
					gw = {id:id,class:tag,incoming:[],outgoing:[]};
					el.childNodes.forEach( function(ch) {
						if( !ch.tagName ) return;
						if( ch.tagName.includes('incoming') )
							gw.incoming.push( ch.innerHTML );
						if( ch.tagName.includes('outgoing') )
							gw.outgoing.push( ch.innerHTML );
					});
//					console.debug('Gateway',gw);
					if( gw.incoming.length>1 && gw.outgoing.length>1 ) {
						console.warn("Gateway with id ',id,' has multiple incoming AND multiple outgoing paths!");
						return
					};
					if( gw.incoming.length==1 && gw.outgoing.length==1 ) {
						console.warn("Gateway with id ',id,' has one incoming AND one outgoing path!");
						return
					};
					// else:
					found = true;
					// Transform all joining gateways to actors:
					if( gw.outgoing.length==1 ) {
						if( tag=='exclusiveGateway' ) {
							title = opts.strJoinExcGateway;
							desc = opts.strJoinExcGatewayDesc
						} else {
							title = opts.strJoinParGateway;
							desc = opts.strJoinParGatewayDesc
						};
						model.resources.push({
							id: id,
							title: title,
							class: "RT-Act",
							properties: [{
								title: "dcterms:title",
								class: "PT-Act-Name",
								value: title
							}, {
								title: "dcterms:description",
								class: "PT-Act-Description",
								value: desc
							}, {
								title: "SpecIF:Stereotype",
								class: "PT-Act-Stereotype",
								value: 'BPMN:'+tag
							}],
							changedAt: opts.xmlDate
						});
						return
					}; 
					// else: gw.outgoing.length>1
					if( tag=='parallelGateway' ) {
						title = opts.strForkParGateway;
						model.resources.push({
							id: id,
							title: title,
							class: "RT-Act",
							properties: [{
								title: "dcterms:title",
								class: "PT-Act-Name",
								value: title
							}, {
								title: "dcterms:description",
								class: "PT-Act-Description",
								value: opts.strForkParGatewayDesc
							}, {
								title: "SpecIF:Stereotype",
								class: "PT-Act-Stereotype",
								value: 'BPMN:'+tag
							}],
							changedAt: opts.xmlDate
						});
						return
					};
					// else: 'exclusiveGateway' && gw.outgoing.length>1
					gw.title = title;
					// Add the title (condition), if specified:
					title = opts.strForkExcGateway+(title? ': '+title : '');
					model.resources.push({
						id: id,
						title: title,
						class: "RT-Act",
						properties: [{
							title: "dcterms:title",
							class: "PT-Act-Name",
							value: title
						}, {
							title: "dcterms:description",
							class: "PT-Act-Description",
							value: opts.strForkExcGatewayDesc
						}, {
							title: "SpecIF:Stereotype",
							class: "PT-Act-Stereotype",
							value: 'BPMN:'+tag
						}],
						changedAt: opts.xmlDate
					});
					// list the gateway for postprocessing in the next pass:
					gwL.push(gw);
					break;
				default:
					console.warn('The BPMN element with tag ',tag,' and title ',title,' has not been transformed.')
			};
			// Add a containment relation for every transformed model-element:
			if( found ) {
				// look, whether the element is contained in a lane:
				cId = ctL.find( function(s) {return s.object==id} );
				// use the lane as container, if there is any, or the process otherwise:
				cId = (cId? cId.subject : pa.id);
				// store the containment relation:
				model.statements.push({
					id: cId+'-contains-'+id,
					title: 'SpecIF:contains',
					class: 'ST-contains',
					subject: cId,
					object: id,
					changedAt: opts.xmlDate
				})
			}
		});
		// 4.3 Third pass to collect the text annotations:
		let tL = xmlDoc.querySelectorAll("textAnnotation");
		tL.forEach( function(ta,idx) {
			id = ta.getAttribute("id");
			title = opts.strTextAnnotation + (++idx>9? ' '+idx : ' 0'+idx);
			// even though there should be only one sub-element:
			ta.childNodes.forEach( function(txt) {
//				console.debug('textAnnotation.childNode',txt);
				if( !txt.tagName ) return;
				if( txt.tagName.includes('text') ) {
					model.resources.push({
						id: id,
						title: title,
						class: "RT-Nte",
						properties: [{
							title: "dcterms:title",
							class: "PT-Nte-Name",
							value: title
						}, {
							title: "dcterms:description",
							class: "PT-Nte-Description",
							value: '<p>'+ctrl2HTML(txt.innerHTML)+'</p>'
						}],
						changedAt: opts.xmlDate
					});
					// memorize all text annotations to include them in the hierarchy:
					taL.push(id)
				}
			});
		})
		// 4.4 Fourth pass to collect the relations between model-elements:
		pr.childNodes.forEach( function(el) {
			// quit, if the child node does not have a tag, e.g. it is '#text':
			if( !el.tagName ) return;
			// else:
			tag = el.tagName.split(':').pop();	// tag without namespace
			// quit, if it is a laneSet, as it would cause a runtime error below
			// (it does not have the properties we try to obtain):
			if( tag=='laneSet' ) return;
			// else:
			id = el.getAttribute("id");
			title = el.getAttribute("name");
//			console.debug('#3',tag,id,title);
			switch(tag) {
				case 'sequenceFlow':
					// just the sequenceFlow, where the subject is a forking exclusive gateway, needs special attention:
					let feG = itemById(gwL,el.getAttribute('sourceRef'));
					if( feG ) {
						// In case of a forking exclusive gateway, every outgoing connection is transformed
						// to an event with a signal and trigger relation:
						seqF = {
							subject: feG,
							object:  itemById(model.resources,el.getAttribute('targetRef'))
						};
						// a. store an event representing the case:
						title = (seqF.subject.title? seqF.subject.title+' → ' : '')+title; // &larr; = &#8594;
						model.resources.push({
							id: id,
							title: title,
							class: "RT-Evt",
							properties: [{
								title: "dcterms:title",
								class: "PT-Evt-Name",
								value: title
							}, {
								title: "SpecIF:Stereotype",
								class: "PT-Evt-Stereotype",
								value: 'SpecIF:'+'Condition'
							}],
							changedAt: opts.xmlDate
						});
						// b. store the signal relation:
						model.statements.push({
							id: id+'-s',
							title: "SpecIF:signals",
							class: "ST-signals",
							subject: seqF.subject.id,
							object: id,
							changedAt: opts.xmlDate
						});
						// c. store the trigger relation:
						model.statements.push({
							id: id+'-t',
							title: "SpecIF:triggers",
							class: "ST-triggers",
							subject: id,
							object: seqF.object.id,
							changedAt: opts.xmlDate
						});
						return
					};
					// else:
					seqF = {
						subject: itemById(model.resources,el.getAttribute('sourceRef')),
						object:  itemById(model.resources,el.getAttribute('targetRef'))
					};
					// none or one of the following conditions is true, so we can return right away:
					if( seqF.subject.class=='RT-Act' && seqF.object.class=='RT-Act' ) {
						model.statements.push({
							id: id,
							title: "SpecIF:precedes",
							class: "ST-precedes",
							subject: seqF.subject.id,
							object: seqF.object.id,
							changedAt: opts.xmlDate
						});
						return
					};
					if ((["RT-Act","RT-Evt"].indexOf(seqF.subject.class)>-1) && seqF.object.class=="RT-Evt") {
						model.statements.push({
							id: id,
							title: "SpecIF:signals",
							class: "ST-signals",
							subject: seqF.subject.id,
							object: seqF.object.id,
							changedAt: opts.xmlDate
						});
						return
					};
					// else: seqF.subject.class=="RT-Evt" && seqF.object.class=="RT-Act"
					model.statements.push({
						id: id,
						title: "SpecIF:triggers",
						class: "ST-triggers",
						subject: seqF.subject.id,
						object: seqF.object.id,
						changedAt: opts.xmlDate
					});
					break;
				case 'association':
					model.statements.push({
						id: id,
						title: "SpecIF:refersTo",
						class: "ST-refersTo",
						subject: el.getAttribute('targetRef'),
						object: el.getAttribute('sourceRef'),
						changedAt: opts.xmlDate
					});
				// all other tags (should ;-) have been processed before
			}
		})
	});

	// 5. Add the 'diagram shows model-element' statements:
	model.resources.forEach( function(r) {
		// only certain resources are model-elements:
		if( ['RT-Act','RT-Sta','RT-Evt'].indexOf(r.class)>-1 ) {
			model.statements.push({
				id: model.id+'-shows-'+r.id,
				title: 'SpecIF:shows',
				class: 'ST-shows',
				subject: diagramId,
				object: r.id,
				changedAt: opts.xmlDate
			})
		}
	});
	// 6. The hierarchy with pointers to all resources:
	function NodeList(res) {
		// 6.1 first add the folders:
		let nL = [{
			id: "N-Diagram",
			resource: diagramId,
			changedAt: opts.xmlDate
		},{
			id: "N-FolderGlossary",
			resource: "FolderGlossary",
			nodes: [{
				id: "N-FolderAct",
				resource: "FolderAct",
				nodes: [],
				changedAt: opts.xmlDate
			},{
				id: "N-FolderSta",
				resource: "FolderSta",
				nodes: [],
				changedAt: opts.xmlDate
			},{
				id: "N-FolderEvt",
				resource: "FolderEvt",
				nodes: [],
				changedAt: opts.xmlDate
			}],
			changedAt: opts.xmlDate
		}];
		// 6.2 Add Actors, States and Events to the respective folders,
		// in alphabetical order:
		res.sort( function(bim, bam) {
					bim = bim.title.toLowerCase();
					bam = bam.title.toLowerCase();
					return bim==bam ? 0 : (bim<bam ? -1 : 1) 
		});
		res.forEach( function(r) { 
			let nd = {
				id: "N-" + r.id,
				resource: r.id,
				changedAt: opts.xmlDate
			};
			// sort resources according to their type:
			let idx = ["RT-Act","RT-Sta","RT-Evt"].indexOf( r.class );
			if( idx>-1 )
				nL[1].nodes[idx].nodes.push(nd)
		});
		if( taL.length<1 ) return nL;
		// else:
		// 6.3 Add text annotations:
		nL.push({
			id: "N-FolderNte",
			resource: "FolderNte",
			nodes: [],
			changedAt: opts.xmlDate
		});
		taL.forEach( function(r) { 
			nL[2].nodes.push({
				id: "N-" + r,
				resource: r,
				changedAt: opts.xmlDate
			})
		});
		return nL
	}
	model.hierarchies = [{
		id: "outline",
		title: model.title,
		class: "HT-Processmodel",
		nodes: NodeList(model.resources),
		changedAt: opts.xmlDate
	}]
	
//	console.debug('model',model);
	return model;
	
// =======================================
// called functions:	

	// The dataTypes:
	function DataTypes() {
		return [{
			id: "DT-Integer",
			title: "Integer",
			type: "xs:integer",
			min: -32768,
			max: 32767,
			changedAt: opts.xmlDate
		},{
			id: "DT-ShortString",
			title: "String[96]",
			description: "String with length 96",
			type: "xs:string",
			maxLength: 96,
			changedAt: opts.xmlDate
		},{
			id: "DT-String",
			title: "String[1024]",
			description: "String with length 1024",
			type: "xs:string",
			maxLength: 1024,
			changedAt: opts.xmlDate
		},{
			id: "DT-formattedText",
			title: "xhtml[1024]",
			description: "Formatted String with length 1024",
			type: "xhtml",
			maxLength: 1024,
			changedAt: opts.xmlDate
		}]
	}
	
	// The resource classes:
	function ResourceClasses() {
		return [{
			id: "RT-Pln",
			title: "SpecIF:Diagram",
			description: "A 'Diagram' is a graphical model view with a specific communication purpose, e.g. a business process or system composition.",
			propertyClasses: [{
				id: "PT-Pln-Name",
				title: "dcterms:title",
				dataType: "DT-ShortString",
				changedAt: opts.xmlDate
			},{
				id: "PT-Pln-Diagram",
				title: "SpecIF:Diagram",
				dataType: "DT-formattedText",
				changedAt: opts.xmlDate
			},{
				id: "PT-Pln-Notation",
				title: "SpecIF:Notation",
				dataType: "DT-ShortString",
				changedAt: opts.xmlDate
			}],
			icon: "&#9635;",
			changedAt: opts.xmlDate
		},{
			id: "RT-Act",
			title: "FMC:Actor",
			description: "An 'Actor' is a fundamental model element type representing an active entity, be it an activity, a process step, a function, a system component or a role.",
			propertyClasses: [{
				id: "PT-Act-Name",
				title: "dcterms:title",
				dataType: "DT-ShortString",
				changedAt: opts.xmlDate
			},{
				id: "PT-Act-Description",
				title: "dcterms:description",
				dataType: "DT-formattedText",
				changedAt: opts.xmlDate
			},{
				id: "PT-Act-Stereotype",
				title: "SpecIF:Stereotype",
				dataType: "DT-ShortString",
				changedAt: opts.xmlDate
			}],
			icon: "&#9632;",
			changedAt: opts.xmlDate
		},{
			id: "RT-Sta",
			title: "FMC:State",
			description: "A 'State' is a fundamental model element type representing a passive entity, be it a value, a condition, an information storage or even a physical shape.",
			propertyClasses: [{
				id: "PT-Sta-Name",
				title: "dcterms:title",
				dataType: "DT-ShortString",
				changedAt: opts.xmlDate
			},{
				id: "PT-Sta-Description",
				title: "dcterms:description",
				dataType: "DT-formattedText",
				changedAt: opts.xmlDate
			},{
				id: "PT-Sta-Stereotype",
				title: "SpecIF:Stereotype",
				dataType: "DT-ShortString",
				changedAt: opts.xmlDate
			}],
			icon: "&#9679;",
			changedAt: opts.xmlDate
		},{
			id: "RT-Evt",
			title: "FMC:Event",
			description: "An 'Event' is a fundamental model element type representing a time reference, a change in condition/value or more generally a synchronisation primitive.",
			propertyClasses: [{
				id: "PT-Evt-Name",
				title: "dcterms:title",
				dataType: "DT-ShortString",
				changedAt: opts.xmlDate
			},{
				id: "PT-Evt-Description",
				title: "dcterms:description",
				dataType: "DT-formattedText",
				changedAt: opts.xmlDate
			},{
				id: "PT-Evt-Stereotype",
				title: "SpecIF:Stereotype",
				dataType: "DT-ShortString",
				changedAt: opts.xmlDate
			}],
			icon: "&#9830;",
			changedAt: opts.xmlDate
		},{
			id: "RT-Nte",
			title: "SpecIF:Note",
			description: "A 'Note' is additional information by the author referring to any resource.",
			propertyClasses: [{
				id: "PT-Nte-Name",
				title: "dcterms:title",
				dataType: "DT-ShortString",
				changedAt: opts.xmlDate
			},{
				id: "PT-Nte-Description",
				title: "dcterms:description",
				dataType: "DT-formattedText",
				changedAt: opts.xmlDate
			}],
			changedAt: opts.xmlDate
		},{
			id: "RT-Col",
			title: "SpecIF:Collection",
			description: "A 'Collection' is an arbitrary group of resources linked with a SpecIF:contains statement. It corresponds to a 'Group' in BPMN Diagrams.",
			propertyClasses: [{
				id: "PT-Col-Name",
				title: "dcterms:title",
				dataType: "DT-ShortString",
				changedAt: opts.xmlDate
			}],
			changedAt: opts.xmlDate
		},{
			id: "RT-Fld",
			title: "SpecIF:Heading",
			description: "Folder with title and text for chapters or descriptive paragraphs.",
			isHeading: true,
			propertyClasses: [{
				id: "PT-Fld-Name",
				title: "dcterms:title",
				dataType: "DT-ShortString",
				changedAt: opts.xmlDate
			},{
				id: "PT-Fld-Description",
				title: "dcterms:description",
				dataType: "DT-formattedText",
				changedAt: opts.xmlDate
			}],
			changedAt: opts.xmlDate
		}]
	}
	// The statement classes:
	function StatementClasses() {
		return [{
			id: "ST-shows",
			title: "SpecIF:shows",
			description: "Statement: Plan shows Model-Element",
			subjectTypes: ["RT-Pln"],
			objectTypes: ["RT-Act", "RT-Sta", "RT-Evt"],
			changedAt: opts.xmlDate
		},{
			id: "ST-contains",
			title: "SpecIF:contains",
			description: "Statement: Model-Element contains Model-Element",
			subjectTypes: ["RT-Act", "RT-Sta", "RT-Evt"],
			objectTypes: ["RT-Act", "RT-Sta", "RT-Evt"],
			changedAt: opts.xmlDate
		},{
			id: "ST-stores",
			title: "SpecIF:stores",
			description: "Statement: Actor (Role, Function) writes and reads State (Information)",
			subjectTypes: ["RT-Act"],
			objectTypes: ["RT-Sta"],
			changedAt: opts.xmlDate
		},{
			id: "ST-writes",
			title: "SpecIF:writes",
			description: "Statement: Actor (Role, Function) writes State (Information)",
			subjectTypes: ["RT-Act"],
			objectTypes: ["RT-Sta"],
			changedAt: opts.xmlDate
		},{
			id: "ST-reads",
			title: "SpecIF:reads",
			description: "Statement: Actor (Role, Function) reads State (Information)",
			subjectTypes: ["RT-Act"],
			objectTypes: ["RT-Sta"],
			changedAt: opts.xmlDate
		},{
			id: "ST-precedes",
			title: "SpecIF:precedes",
			description: "A FMC:Actor 'precedes' a FMC:Actor; e.g. in a business process or activity flow.",
			subjectTypes: ["RT-Act"],
			objectTypes: ["RT-Act"],
			changedAt: opts.xmlDate
		},{
			id: "ST-signals",
			title: "SpecIF:signals",
			description: "A FMC:Actor 'signals' a FMC:Event.",
			subjectTypes: ["RT-Act", "RT-Evt"],
			objectTypes: ["RT-Evt"],
			changedAt: opts.xmlDate
		},{
			id: "ST-triggers",
			title: "SpecIF:triggers",
			description: "A FMC:Event 'triggers' a FMC:Actor.",
			subjectTypes: ["RT-Evt"],
			objectTypes: ["RT-Act"],
			changedAt: opts.xmlDate
		},{
			id: "ST-refersTo",
			title: "SpecIF:refersTo",
			description: "A SpecIF:Comment, SpecIF:Note or SpecIF:Issue 'refers to' any other resource.",
			subjectTypes: ["RT-Nte"],
			objectTypes: ["RT-Pln", "RT-Act", "RT-Sta", "RT-Evt", "RT-Col"],
			changedAt: opts.xmlDate
		}]
	}
	// The hierarchy classes:
	function HierarchyClasses() {
		return [{
			id: "HT-Processmodel",
			title: "SpecIF:Hierarchy",
			description: "Root node of a process model (outline).",
			changedAt: opts.xmlDate
		}]
	}
	// The folder resources within a hierarchy:
	function Folders() {
		return [{
			id: "FolderGlossary",
			class: "RT-Fld",
			title: opts.strGlossaryFolder,
			properties: [{
				class: "PT-Fld-Name",
				value: opts.strGlossaryFolder
			}],
			changedAt: opts.xmlDate
		}, {
			id: "FolderAct",
			class: "RT-Fld",
			title: opts.strActorFolder,
			properties: [{
				class: "PT-Fld-Name",
				value: opts.strActorFolder
			}],
			changedAt: opts.xmlDate
		}, {
			id: "FolderSta",
			class: "RT-Fld",
			title: opts.strStateFolder,
			properties: [{
				class: "PT-Fld-Name",
				value: opts.strStateFolder
			}],
			changedAt: opts.xmlDate
		}, {
			id: "FolderEvt",
			class: "RT-Fld",
			title: opts.strEventFolder,
			properties: [{
				class: "PT-Fld-Name",
				value: opts.strEventFolder
			}],
			changedAt: opts.xmlDate
		}, {
			id: "FolderNte",
			class: "RT-Fld",
			title: opts.strAnnotationFolder,
			properties: [{
				class: "PT-Fld-Name",
				value: opts.strAnnotationFolder
			}],
			changedAt: opts.xmlDate
		}]
	}
	function itemById(L,id) {
		// given the ID of an element in a list, return the element itself:
		id = id.trim();
		for( var i=L.length-1;i>-1;i-- )
			if( L[i].id === id ) return L[i];   // return list item
		return null
	}
	function ctrl2HTML(str) {
	// Convert js/json control characters (new line) to HTML-tags and remove the others:
		return str.replace( /\r|\f/g, '' ).replace( /\t/g, ' ' ).replace( /\n/g, '<br />' )
	};
}
