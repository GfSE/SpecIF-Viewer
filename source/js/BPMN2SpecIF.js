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
	if( !opts.mimeType ) 				opts.mimeType = "application/bpmn+xml";

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
	let x = Array.from(xmlDoc.querySelectorAll("collaboration"));
	// There should be only one collaboration per BPMN file:
	if( x.length>1 )
		console.warn("Diagram with id ',model.id,' has more than one collaboration.");
//	console.debug('collaboration',x);

	// The project's id and title:
	model.id = x[0].getAttribute("id");
	model.title = opts.title || x[0].nodeName;
	model.description = opts.description;
	model.specifVersion = "0.10.8";
	model.dataTypes = DataTypes();
	model.propertyClasses = PropertyClasses();
	model.resourceClasses = ResourceClasses();
	model.statementClasses = StatementClasses();

	// Reference used files,
	// - the BPMN file:
	model.files = [{
		id: 'F-'+simpleHash(opts.xmlName),
		title: opts.xmlName,
		blob: new Blob([xmlString], {type: opts.mimeType}),
		type: "application/bpmn+xml",
		changedAt: opts.xmlDate
	}];
/*	// - an image of the process, if available:
	if( opts.svgName )
		model.files.push({
			id: 'F-'+simpleHash(opts.svgName),
			title: opts.svgName,
		//	blob: ,
			type: "image/svg+xml"
		}); */
	model.resources = Folders();
	model.statements = [];

	// 1. Represent the diagram itself:
	const diagramId = 'D-' + model.id,
		dg = opts.svgName?"<object data=\""+opts.svgName+"\" type=\"image/svg+xml\" >"+opts.svgName+"</object>"
						:"<object data=\""+opts.xmlName+"\" type=\"application/bpmn+xml\" >"+opts.xmlName+"</object>";
	model.resources.push({
		id: diagramId,
		title: model.title,
		class: 'RC-Diagram',
		properties: [{
			class: "PC-Name",
			value: model.title
		}, {
			class: "PC-Diagram",
			value: "<div><p class=\"inline-label\">Model View:</p><p>"+dg+"</p></div>"
		}, {
			class: "PC-Notation",
			value: "BPMN 2.0 Process Diagram"
		}],
		changedAt: opts.xmlDate
	});
	
	// 2. Analyse the 'collaboration' and get the participating processes plus the exchanged messages.
//	console.debug('#',x[0].childNodes);
//	x[0].childNodes.forEach( function(el) {
	// forEach does not work for NodeLists in IE:
	Array.from(x[0].childNodes).forEach( function(el) {
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
				class: 'RC-Actor',
				properties: [{
					class: "PC-Name",
					value: el.getAttribute("name")
				}, {
					class: "PC-Type",
					value: "BPMN:"+tag
				}],
				changedAt: opts.xmlDate
			})
		};
		// The messages between the processes:
		if (el.nodeName.includes("messageFlow")) {
			// a. The message data (FMC:State):
			model.resources.push({
				id: el.getAttribute("id"),
				title: el.getAttribute("name"),
				class: 'RC-State',
				properties: [{
					class: "PC-Name",
					value: el.getAttribute("name")
				}, {
					class: "PC-Type",
					value: "BPMN:"+tag
				}],
				changedAt: opts.xmlDate
			});
			// b. We assume that the sourceRef and targetRef will be found later on.
			// c. The writing relation (statement):
			model.statements.push({
				id: el.getAttribute("sourceRef")+'-S',
				title: 'SpecIF:writes',
				class: 'SC-writes',
				subject: el.getAttribute("sourceRef"),
				object: el.getAttribute("id"),
				changedAt: opts.xmlDate
			});
			// d. The reading relation (statement):
			// Todo: Is the signalling characteristic well covered? It is not just reading!
			model.statements.push({
				id: el.getAttribute("targetRef")+'-O',
				title: 'SpecIF:reads',
				class: 'SC-reads',
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
	x = Array.from(xmlDoc.querySelectorAll("process"));
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
		Array.from(pr.childNodes).forEach( function(el) {
			tag = el.nodeName.split(':').pop();	// tag without namespace
//			console.debug('#1',tag);
			switch(tag) {
				case 'laneSet':
					// 3.1 Get the laneSets/lanes with their model elements;
					//    	note that a 'laneSet' is not mandatory, e.g. BPMNio does not necessarily provide any.
					/* Nested lanes are possible, as well, but not yet supported (ToDo):
						  <lane id="dienststelle" name="Dienststelle">
							<flowNodeRef>approveInvoice</flowNodeRef>
							<flowNodeRef>Task_1ymb2ic</flowNodeRef>
							<flowNodeRef>ExclusiveGateway_0loe7o7</flowNodeRef>
							<flowNodeRef>StartEvent_1tkg7k8</flowNodeRef>
							<childLaneSet id="LaneSet_1w3soel">
							  <lane id="Lane_15kot5t" name="Leiter">
								<flowNodeRef>approveInvoice</flowNodeRef>
							  </lane>
							  <lane id="Lane_0jy9eq0" name="Mitarbeiter">
								<flowNodeRef>Task_1ymb2ic</flowNodeRef>
								<flowNodeRef>ExclusiveGateway_0loe7o7</flowNodeRef>
								<flowNodeRef>StartEvent_1tkg7k8</flowNodeRef>
							  </lane>
							</childLaneSet>
						  </lane>
					*/
					Array.from(el.childNodes).forEach( function(el2) {
						if( el2.nodeName.includes('lane') ) {
							let elName = el2.getAttribute("name"),
								el2Id = el2.getAttribute("id");
							if( elName ) {
								// store the lane as SpecIF:Role
								model.resources.push({
									id: el2Id,
									title: elName,
									class: 'RC-Actor',
									properties: [{
										class: "PC-Name",
										value: elName
									}, {
										class: "PC-Type",
								//		value: "BPMN:"+'lane'
										value: "SpecIF:Role"
									}],
									changedAt: opts.xmlDate
								});
								// store the containment relation for the lane:
								model.statements.push({
									id: pa.id + '-contains-' + el2Id,
									title: 'SpecIF:contains',
									class: 'SC-contains',
									subject: pa.id,	// the process
									object: el2Id,		// the lane
									changedAt: opts.xmlDate
								});
								// temporarily store relations for the contained model-elements:
								Array.from(el2.childNodes).forEach( function(el3) {
									if( el3.nodeName.includes('flowNodeRef') ) {
										ctL.push({
											class: 'SC-contains',
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
		Array.from(pr.childNodes).forEach( function(el) {
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
				case 'serviceTask':
				case 'sendTask':
				case 'receiveTask':
				case 'callActivity':
				case 'subProcess':
					// store the model-element as FMC:Actor:
					model.resources.push({
						id: id,
						title: title || tag,
						class: "RC-Actor",
						properties: [{
							class: "PC-Name",
							value: title || tag
						}, {
							class: "PC-Type",
							value: 'BPMN:'+tag
						}],
						changedAt: opts.xmlDate
					});
					// store the read/write associations:
					Array.from(el.childNodes).forEach( function(ch) {
						if( !ch.tagName ) return;
						if( ch.tagName.includes('dataInputAssociation') ) {
							// find sourceRef:
							Array.from(ch.childNodes).forEach( function(ref) {
//								console.debug('dataInputAssociation.childNode',ref);
								if( !ref.tagName ) return;
								if( ref.tagName.includes('sourceRef') ) {
									let dS = ref.innerHTML
									// store reading association:
									model.statements.push({
										id: id+'-reads-'+dS,
										title: 'SpecIF:reads',
										class: 'SC-reads',
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
							Array.from(ch.childNodes).forEach( function(ref) {
//								console.debug('dataOutputAssociation.childNode',ref);
								if( !ref.tagName ) return;
								if( ref.tagName.includes('targetRef') ) {
									let dS = ref.innerHTML
									// store writing association:
									model.statements.push({
										id: id+'-writes-'+dS,
										title: 'SpecIF:writes',
										class: 'SC-writes',
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
					// - Even though we use 'dataObject' or 'dataStore' as SubClass.
					model.resources.push({
						id: id,
						title: title || tag,
						class: "RC-State",
						properties: [{
							class: "PC-Name",
							value: title || tag
						}, {
							class: "PC-Type",
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
					// store the model-element as FMC:Event:
					model.resources.push({
						id: id,
						title: title || tag,
						class: "RC-Event",
						properties: [{
							class: "PC-Name",
							value: title || tag
						}, {
							class: "PC-Type",
							value: 'BPMN:'+tag
						}],
						changedAt: opts.xmlDate
					});
					found = true;
					break;
				case 'exclusiveGateway':
				case 'parallelGateway':
					gw = {id:id,class:tag,incoming:[],outgoing:[]};
					Array.from(el.childNodes).forEach( function(ch) {
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
							class: "RC-Actor",
							properties: [{
								class: "PC-Name",
								value: title
							}, {
								class: "PC-Description",
								value: desc
							}, {
								class: "PC-Type",
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
							class: "RC-Actor",
							properties: [{
								class: "PC-Name",
								value: title
							}, {
								class: "PC-Description",
								value: opts.strForkParGatewayDesc
							}, {
								class: "PC-Type",
								value: 'BPMN:'+tag
							}],
							changedAt: opts.xmlDate
						});
						return
					};
					// else: 'exclusiveGateway' && gw.outgoing.length>1
					gw.title = title || tag;
					// Add the title (condition), if specified:
					title = opts.strForkExcGateway+(title? ': '+title : '');
					model.resources.push({
						id: id,
						title: title,
						class: "RC-Actor",
						properties: [{
							class: "PC-Name",
							value: title
						}, {
							class: "PC-Description",
							value: opts.strForkExcGatewayDesc
						}, {
							class: "PC-Type",
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
					class: 'SC-contains',
					subject: cId,
					object: id,
					changedAt: opts.xmlDate
				})
			}
		});
		// 4.3 Third pass to collect the text annotations:
		let tL = Array.from(xmlDoc.querySelectorAll("textAnnotation"));
		tL.forEach( function(ta,idx) {
			id = ta.getAttribute("id");
			title = opts.strTextAnnotation + (++idx>9? ' '+idx : ' 0'+idx);
			// even though there should be only one sub-element:
			Array.from(ta.childNodes).forEach( function(txt) {
//				console.debug('textAnnotation.childNode',txt);
				if( !txt.tagName ) return;
				if( txt.tagName.includes('text') ) {
					model.resources.push({
						id: id,
						title: title,
						class: "RC-Note",
						properties: [{
							class: "PC-Name",
							value: title
						}, {
							class: "PC-Description",
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
		Array.from(pr.childNodes).forEach( function(el) {
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
						title = (seqF.subject.title? seqF.subject.title+' → ' : '')+title; // → = &rarr; = &#8594;
						model.resources.push({
							id: id,
							title: title,
							class: "RC-Event",
							properties: [{
								class: "PC-Name",
								value: title
							}, {
								class: "PC-Type",
								value: 'SpecIF:'+'Condition'
							}],
							changedAt: opts.xmlDate
						});
						// b. store the signal relation:
						model.statements.push({
							id: id+'-s',
							title: "SpecIF:signals",
							class: "SC-signals",
							subject: seqF.subject.id,
							object: id,
							changedAt: opts.xmlDate
						});
						// c. store the trigger relation:
						model.statements.push({
							id: id+'-t',
							title: "SpecIF:triggers",
							class: "SC-triggers",
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
					if( seqF.subject.class=='RC-Actor' && seqF.object.class=='RC-Actor' ) {
						model.statements.push({
							id: id,
							title: "SpecIF:precedes",
							class: "SC-precedes",
							subject: seqF.subject.id,
							object: seqF.object.id,
							changedAt: opts.xmlDate
						});
						return
					};
					if ((["RC-Actor","RC-Event"].indexOf(seqF.subject.class)>-1) && seqF.object.class=="RC-Event") {
						model.statements.push({
							id: id,
							title: "SpecIF:signals",
							class: "SC-signals",
							subject: seqF.subject.id,
							object: seqF.object.id,
							changedAt: opts.xmlDate
						});
						return
					};
					// else: seqF.subject.class=="RC-Event" && seqF.object.class=="RC-Actor"
					model.statements.push({
						id: id,
						title: "SpecIF:triggers",
						class: "SC-triggers",
						subject: seqF.subject.id,
						object: seqF.object.id,
						changedAt: opts.xmlDate
					});
					break;
				case 'association':
					model.statements.push({
						id: id,
						title: "SpecIF:refersTo",
						class: "SC-refersTo",
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
		if( ['RC-Actor','RC-State','RC-Event'].indexOf(r.class)>-1 ) {
			model.statements.push({
				id: model.id+'-shows-'+r.id,
				title: 'SpecIF:shows',
				class: 'SC-shows',
				subject: diagramId,
				object: r.id,
				changedAt: opts.xmlDate
			})
		}
	});
	// 6. The hierarchy with pointers to all resources:
	function NodeList(res) {
		// 6.1 first add the folders:
		let nL =  [{
			id: "H-BPMN-outline",
			resource: "BPMN-outline",
			nodes: [{
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
			let idx = ["RC-Actor","RC-State","RC-Event"].indexOf( r.class );
			if( idx>-1 )
				nL[0].nodes[1].nodes[idx].nodes.push(nd)
		});
		if( taL.length<1 ) return nL;
		// else:
		// 6.3 Add text annotations:
		nL[0].nodes.push({
			id: "N-FolderNte",
			resource: "FolderNte",
			nodes: [],
			changedAt: opts.xmlDate
		});
		taL.forEach( function(a) { 
			nL[0].nodes[2].nodes.push({
				id: "N-" + a,
				resource: a,
				changedAt: opts.xmlDate
			})
		});
		return nL
	};
	// Add the resource for the hierarchy root:
	model.resources.push({
		id: "BPMN-outline",
		title: model.title,
		class: "RC-Processmodel",
		changedAt: opts.xmlDate
	});
	// Add the tree:
	model.hierarchies = NodeList(model.resources);
	
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
	
	// The property classes:
	function PropertyClasses() {
		return [{
				id: "PC-Name",
				title: "dcterms:title",
				dataType: "DT-ShortString",
				changedAt: opts.xmlDate
			},{
				id: "PC-Description",
				title: "dcterms:description",
				dataType: "DT-formattedText",
				changedAt: opts.xmlDate
			},{
				id: "PC-Diagram",
				title: "SpecIF:Diagram",
				dataType: "DT-formattedText",
				changedAt: opts.xmlDate
			},{
				id: "PC-Notation",
				title: "SpecIF:Notation",
				dataType: "DT-ShortString",
				changedAt: opts.xmlDate
			},{
				id: "PC-Type",
				title: "dcterms:type",
				dataType: "DT-ShortString",
				changedAt: opts.xmlDate
			}]
	}
	
	// The resource classes:
	function ResourceClasses() {
		return [{
			id: "RC-Diagram",
			title: "SpecIF:Diagram",
			description: "A 'Diagram' is a graphical model view with a specific communication purpose, e.g. a business process or system composition.",
			propertyClasses: ["PC-Name","PC-Diagram","PC-Notation"],
			icon: "&#9635;",
			changedAt: opts.xmlDate
		},{
			id: "RC-Actor",
			title: "FMC:Actor",
			description: "An 'Actor' is a fundamental model element type representing an active entity, be it an activity, a process step, a function, a system component or a role.",
			propertyClasses: ["PC-Name","PC-Description","PC-Type"],
			icon: "&#9632;",
			changedAt: opts.xmlDate
		},{
			id: "RC-State",
			title: "FMC:State",
			description: "A 'State' is a fundamental model element type representing a passive entity, be it a value, a condition, an information storage or even a physical shape.",
			propertyClasses: ["PC-Name","PC-Description","PC-Type"],
			icon: "&#9679;",
			changedAt: opts.xmlDate
		},{
			id: "RC-Event",
			title: "FMC:Event",
			description: "An 'Event' is a fundamental model element type representing a time reference, a change in condition/value or more generally a synchronisation primitive.",
			propertyClasses: ["PC-Name","PC-Description","PC-Type"],
			icon: "&#9830;",
			changedAt: opts.xmlDate
		},{
			id: "RC-Note",
			title: "SpecIF:Note",
			description: "A 'Note' is additional information by the author referring to any resource.",
			propertyClasses: ["PC-Name","PC-Description"],
			changedAt: opts.xmlDate
		},{
			id: "RC-Collection",
			title: "SpecIF:Collection",
			description: "A 'Collection' is an arbitrary group of resources linked with a SpecIF:contains statement. It corresponds to a 'Group' in BPMN Diagrams.",
			propertyClasses: ["PC-Name"],
			changedAt: opts.xmlDate
		},{
			id: "RC-Folder",
			title: "SpecIF:Heading",
			description: "Folder with title and text for chapters or descriptive paragraphs.",
			isHeading: true,
			propertyClasses: ["PC-Name","PC-Description"],
			changedAt: opts.xmlDate
		},{
			id: "RC-Processmodel",
			title: "SpecIF:Hierarchy",
			description: "Root node of a process model (outline).",
			changedAt: opts.xmlDate
		}]
	}
	// The statement classes:
	function StatementClasses() {
		return [{
			id: "SC-shows",
			title: "SpecIF:shows",
			description: "Statement: Plan shows Model-Element",
			subjectTypes: ["RC-Diagram"],
			objectTypes: ["RC-Actor", "RC-State", "RC-Event"],
			changedAt: opts.xmlDate
		},{
			id: "SC-contains",
			title: "SpecIF:contains",
			description: "Statement: Model-Element contains Model-Element",
			subjectTypes: ["RC-Actor", "RC-State", "RC-Event"],
			objectTypes: ["RC-Actor", "RC-State", "RC-Event"],
			changedAt: opts.xmlDate
		},{
			id: "SC-stores",
			title: "SpecIF:stores",
			description: "Statement: Actor (Role, Function) writes and reads State (Information)",
			subjectTypes: ["RC-Actor"],
			objectTypes: ["RC-State"],
			changedAt: opts.xmlDate
		},{
			id: "SC-writes",
			title: "SpecIF:writes",
			description: "Statement: Actor (Role, Function) writes State (Information)",
			subjectTypes: ["RC-Actor"],
			objectTypes: ["RC-State"],
			changedAt: opts.xmlDate
		},{
			id: "SC-reads",
			title: "SpecIF:reads",
			description: "Statement: Actor (Role, Function) reads State (Information)",
			subjectTypes: ["RC-Actor"],
			objectTypes: ["RC-State"],
			changedAt: opts.xmlDate
		},{
			id: "SC-precedes",
			title: "SpecIF:precedes",
			description: "A FMC:Actor 'precedes' a FMC:Actor; e.g. in a business process or activity flow.",
			subjectTypes: ["RC-Actor"],
			objectTypes: ["RC-Actor"],
			changedAt: opts.xmlDate
		},{
			id: "SC-signals",
			title: "SpecIF:signals",
			description: "A FMC:Actor 'signals' a FMC:Event.",
			subjectTypes: ["RC-Actor", "RC-Event"],
			objectTypes: ["RC-Event"],
			changedAt: opts.xmlDate
		},{
			id: "SC-triggers",
			title: "SpecIF:triggers",
			description: "A FMC:Event 'triggers' a FMC:Actor.",
			subjectTypes: ["RC-Event"],
			objectTypes: ["RC-Actor"],
			changedAt: opts.xmlDate
		},{
			id: "SC-refersTo",
			title: "SpecIF:refersTo",
			description: "A SpecIF:Comment, SpecIF:Note or SpecIF:Issue 'refers to' any other resource.",
			subjectTypes: ["RC-Note"],
			objectTypes: ["RC-Diagram", "RC-Actor", "RC-State", "RC-Event", "RC-Collection"],
			changedAt: opts.xmlDate
		}]
	}

	// The folder resources within a hierarchy:
	function Folders() {
		return [{
			id: "FolderGlossary",
			class: "RC-Folder",
			title: opts.strGlossaryFolder,
			properties: [{
				class: "PC-Name",
				value: opts.strGlossaryFolder
			}],
			changedAt: opts.xmlDate
		}, {
			id: "FolderAct",
			class: "RC-Folder",
			title: opts.strActorFolder,
			properties: [{
				class: "PC-Name",
				value: opts.strActorFolder
			}],
			changedAt: opts.xmlDate
		}, {
			id: "FolderSta",
			class: "RC-Folder",
			title: opts.strStateFolder,
			properties: [{
				class: "PC-Name",
				value: opts.strStateFolder
			}],
			changedAt: opts.xmlDate
		}, {
			id: "FolderEvt",
			class: "RC-Folder",
			title: opts.strEventFolder,
			properties: [{
				class: "PC-Name",
				value: opts.strEventFolder
			}],
			changedAt: opts.xmlDate
		}, {
			id: "FolderNte",
			class: "RC-Folder",
			title: opts.strAnnotationFolder,
			properties: [{
				class: "PC-Name",
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
		if( typeof( str )!='string' ) str = '';
		return str.replace( /\r|\f/g, '' ).replace( /\t/g, ' ' ).replace( /\n/g, '<br />' )
	}
	// Make a very simple hash code from a string:
	// http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
	function simpleHash(str) {for(var r=0,i=0;i<str.length;i++)r=(r<<5)-r+str.charCodeAt(i),r&=r;return r};
}
