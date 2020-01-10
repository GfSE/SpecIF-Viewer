/* 	Transform BPMN-XML to SpecIF
	Author: Robert Kanitz, adesso AG
	License: Apache 2.0
*/

// Durchlaufen der XML Datei und Überführen der Elemente in das SpecIF Format
// Reference: https://docs.camunda.org/stable/api-references/bpmn20/
function BPMN2Specif( xmlString, opts ) {
	"use strict";
	if( typeof(opts)!='object' || !opts.fileName ) return null;
	if( !opts.title ) 
		opts.title = opts.fileName.split(".")[0];
	if( typeof(opts.titleLength)!='number' )
		opts.titleLength = 96;
	if( typeof(opts.descriptionLength)!='number' )
		opts.descriptionLength = 8192;
	if( !opts.mimeType ) 
		opts.mimeType = "application/bpmn+xml";
	if( typeof(opts.isIE)!='boolean' )
		opts.isIE = /MSIE |rv:11.0/i.test( navigator.userAgent );
	
	if( !opts.strGlossaryType ) 
		opts.strGlossaryType = "SpecIF:Glossary";
	if( !opts.strGlossaryFolder ) 
		opts.strGlossaryFolder = "Model-Elements (Glossary)";
	if( !opts.strActorFolder ) 
		opts.strActorFolder = "Actors";
	if( !opts.strStateFolder ) 
		opts.strStateFolder = "States";
	if( !opts.strEventFolder ) 
		opts.strEventFolder = "Events";
	if( !opts.strAnnotationFolder ) 
		opts.strAnnotationFolder = "Text Annotations";
	if( !opts.strRoleType ) 
		opts.strRoleType = "SpecIF:Role";
	if( !opts.strConditionType ) 
		opts.strConditionType = "SpecIF:Condition";
	if( !opts.strBusinessProcessType ) 
		opts.strBusinessProcessType = 'SpecIF:BusinessProcess';
	if( !opts.strBusinessProcessesType ) 
		opts.strBusinessProcessesType = 'SpecIF:BusinessProcesses';
	if( !opts.strBusinessProcessFolder ) 
		opts.strBusinessProcessFolder = "Business Processes";

	if( !opts.strJoinExcGateway ) 
		opts.strJoinExcGateway = "Joining Exclusive Gateway";
	if( !opts.strJoinExcGatewayDesc ) 
		opts.strJoinExcGatewayDesc = "<p>Wait for any <em>one</em> incoming branch to continue.</p>";
	if( !opts.strJoinParGateway ) 
		opts.strJoinParGateway = "Joining Parallel Gateway";
	if( !opts.strJoinParGatewayDesc ) 
		opts.strJoinParGatewayDesc = "<p>Wait for <em>all</em> incoming branches to continue.</p>";
	if( !opts.strJoinIncGateway ) 
		opts.strJoinIncGateway = "Joining Inclusive Gateway";
	if( !opts.strJoinIncGatewayDesc ) 
		opts.strJoinIncGatewayDesc = "<p>Wait for <em>all active</em> incoming branches to continue.</p>";
	if( !opts.strForkExcGateway ) 
		opts.strForkExcGateway = "Forking Exclusive Gateway";
	if( !opts.strForkExcGatewayDesc ) 
		opts.strForkExcGatewayDesc = "<p>Evaluate the condidition and signal the respective event.</p>";
	if( !opts.strForkParGateway ) 
		opts.strForkParGateway = "Forking Parallel Gateway";
	if( !opts.strForkParGatewayDesc ) 
		opts.strForkParGatewayDesc = "<p>Forward control to <em>all</em> outgoing branches.</p>";
	if( !opts.strForkIncGateway ) 
		opts.strForkIncGateway = "Forking Inclusive Gateway";
	if( !opts.strForkIncGatewayDesc ) 
		opts.strForkIncGatewayDesc = "<p>Evaluate all condiditions and signal the respective events.</p>";
	if( !opts.strTextAnnotation ) 
		opts.strTextAnnotation = "Text Annotation";
	
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
	model.statements = [];

	// Reference used files,
	// - the BPMN file:
	model.files = [{
		id: 'F-'+simpleHash(opts.fileName),
		title: opts.fileName,
		blob: new Blob([xmlString], {type: opts.mimeType}),
		type: opts.mimeType,
		changedAt: opts.fileDate
	}];

	const nbsp = '&#160;', // non-breakable space
		apx = simpleHash(model.id),
		diagramId = 'D-' + apx,
		hId = 'BPMN-outline-' + apx,
		diagRef = "<object data=\""+opts.fileName+"\" type=\"application/bpmn+xml\" >"+opts.fileName+"</object>";
	// 1. Add the folders:
	model.resources = Folders();
	// 2. Represent the diagram itself:
	model.resources.push({
		id: diagramId,
		title: model.title,
		class: 'RC-Diagram',
		properties: [{
			class: "PC-Name",
			value: model.title
		}, {
			class: "PC-Diagram",
			value: "<div><p class=\"inline-label\">Model View:</p><p>"+diagRef+"</p></div>"
		}, {
			class: "PC-Type",
			value: opts.strBusinessProcessType
		}],
		changedAt: opts.fileDate
	});

	// ToDo: Choose carefully between using tagName or nodeName,
	// see: https://stackoverflow.com/questions/4878484/difference-between-tagname-and-nodename
	
	// 3. Analyse the 'collaboration' and get the participating processes plus the exchanged messages.
	// x[0].childNodes.forEach does not work for NodeLists in IE:
	Array.from(x[0].childNodes).forEach( function(el) {
//		console.debug('collaboration element',el);
		// quit, if the child node does not have a tag, e.g. if it is '#text':
		if( !el.tagName ) return;
		let tag = el.tagName.split(':').pop();	// tag without namespace
		// 3.1 The documentation of the collaboration (model):
		if (el.nodeName.includes("documentation")) {
			let diag = itemById(model.resources,diagramId);
			if( diag && el.innerHTML.length>0 && el.innerHTML.length<opts.descriptionLength ) 
				diag.properties.push({
					class: "PC-Description",
					value: el.innerHTML
			//		value: '<p>'+ctrl2HTML(el.innerHTML)+'</p>'
				})
		};		
		// 3.2 The participating processes;
		// We transform the participants with their id, but not the processes;
		// looking at the specs, 
		// - there is no process without a participant.
		// - there can be participants without a process.
		// see: https://www.omg.org/spec/BPMN/2.0/PDF/
		if (el.nodeName.includes("participant")) {
			model.resources.push({
				id: el.getAttribute("id"),
				process: el.getAttribute("processRef"),  // intermediate store for process id
				title: el.getAttribute("name") || '',
				class: 'RC-Actor',
				properties: [{
					class: "PC-Name",
					value: el.getAttribute("name") || ''
				}, {
					class: "PC-Type",
					value: "BPMN:"+tag
				}],
				changedAt: opts.fileDate
			})
		};
		// 3.3 The messages between the processes:
		if (el.nodeName.includes("messageFlow")) {
			// a. The message data (FMC:State):
			model.resources.push({
				id: el.getAttribute("id"),
				title: el.getAttribute("name") || '',
				class: 'RC-State',
				properties: [{
					class: "PC-Name",
					value: el.getAttribute("name") || ''
				}, {
					class: "PC-Type",
					value: "BPMN:"+tag
				}],
				changedAt: opts.fileDate
			});
			// b. We assume that the sourceRef and targetRef will be found later on.
			// c. The writing relation (statement):
			model.statements.push({
				id: el.getAttribute("sourceRef")+'-S',
				title: 'SpecIF:writes',
				class: 'SC-writes',
				subject: el.getAttribute("sourceRef"),
				object: el.getAttribute("id"),
				changedAt: opts.fileDate
			});
			// d. The reading relation (statement):
			// ToDo: Is the signalling characteristic well covered? It is not just reading!
			model.statements.push({
				id: el.getAttribute("targetRef")+'-O',
				title: 'SpecIF:reads',
				class: 'SC-reads',
				subject: el.getAttribute("targetRef"),
				object: el.getAttribute("id"),
				changedAt: opts.fileDate
			})
		}
	});
	// 4. Parse the processes.
	// For SpecIF, the participant is declared the container for the processes' model-elements ... 
	// and the BPMN 'processes' disappear from the semantics.
	// ToDo: Remove any process having neither contained elements nor messageFlows (e.g. Bizagi 'Hauptprozess').
	let idx, title, id;
	x = Array.from(xmlDoc.querySelectorAll("process"));
	x.forEach( function(pr) {
		// here, we look at a process:
//		console.debug('process',pr);
		// find the participant representing (or being responsible for) the process:
		let pa = model.resources.find( function(e) { return e.process==pr.getAttribute('id') } );
		// depending on the BPMN generator, the name is supplied in the participant or in the process definition ... or both.
		pa.title = pa.title || pr.getAttribute('name');
		let ctL = [],	// temporary list for containment relations between lanes and model-elements
			gwL = [],	// temporary list for gateways needing some special attention later
			tag, desc, cId, seqF;
		// 4.1 First pass to get the lanes, which do not necessarily come first:
		Array.from(pr.childNodes).forEach( function(el) {
			tag = el.nodeName.split(':').pop();	// tag without namespace
//			console.debug('#1',tag);
			switch(tag) {
				case 'laneSet':
					// 4.1 Get the laneSets/lanes with their model elements;
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
									title: elName || '',
									class: 'RC-Actor',
									properties: [{
										class: "PC-Name",
										value: elName || ''
									}, {
										class: "PC-Type",
								//		value: "BPMN:"+'lane'
										value: opts.strRoleType
									}],
									changedAt: opts.fileDate
								});
								// store the containment relation for the lane:
								model.statements.push({
									id: pa.id + '-contains-' + el2Id,
									title: 'SpecIF:contains',
									class: 'SC-contains',
									subject: pa.id,	// the process
									object: el2Id,		// the lane
									changedAt: opts.fileDate
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
			id = el.getAttribute("id");
			title = el.getAttribute("name");
			desc = '';
			Array.from(el.childNodes).forEach( function(el2) {
				if( el2.tagName && el2.tagName.split(':').pop() == 'documentation' 
					&& el2.innerHTML.length>0 && el2.innerHTML.length<opts.descriptionLength ) 
						desc = el2.innerHTML
				//		desc = '<p>'+ctrl2HTML(el2.innerHTML)+'</p>'
			});
			tag = el.tagName.split(':').pop();	// tag without namespace
//			console.debug('#2',el,tag,id,title,desc);
			let addContainment = false,
				gw;
			switch(tag) {
				case 'laneSet':
					// has been analyzed, before
				case 'sequenceFlow':
				case 'association':
					// will be analyzed in a later pass
					return;
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
						changedAt: opts.fileDate
					});
					// only add a property, if there is content:
					if( desc ) 
						model.resources[model.resources.length-1].properties.splice(1,0,{
							class: "PC-Description",
							value: desc
						});
					// store the read/write associations:
					Array.from(el.childNodes).forEach( function(ch) {
						if( !ch.tagName ) return;
						if( ch.tagName.includes('dataInputAssociation') ) {
							// find sourceRef:
							Array.from(ch.childNodes).forEach( function(ref) {
//								console.debug('dataInputAssociation.childNode',ref);
								if( !ref.tagName ) return;
								if( opts.isIE ) {
									console.warn('Omitting Read-statement with subject '+id+', because IE cannot read the object reference.')
									return
								};
								// ToDo: Get it going with IE
								if( ref.tagName.includes('sourceRef') ) {
									let dS = ref.innerHTML;	 // does not work in IE, not even IE11
//									console.debug('#',ref,ref.tagName,dS);
									// store reading association:
									model.statements.push({
										id: id+'-reads-'+dS,
										title: 'SpecIF:reads',
										class: 'SC-reads',
										subject: id,
										object: dS,
										changedAt: opts.fileDate
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
								if( opts.isIE ) {
									console.warn('Omitting Write-statement with subject '+id+', because IE cannot read the object reference.')
									return
								};
								// ToDo: Get it going with IE
								if( ref.tagName.includes('targetRef') ) {
									let dS = ref.innerHTML;  // does not work in IE, not even IE11
									// store writing association:
									model.statements.push({
										id: id+'-writes-'+dS,
										title: 'SpecIF:writes',
										class: 'SC-writes',
										subject: id,
										object: dS,
										changedAt: opts.fileDate
									})
								}
							})
						}
					});
					addContainment = true;
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
						changedAt: opts.fileDate
					});
					// only add a property, if there is content:
					if( desc ) 
						model.resources[model.resources.length-1].properties.splice(1,0,{
							class: "PC-Description",
							value: desc
						});
				//	addContainment = true;
					break;
				case 'dataObject':
				case 'dataStore':
					// nothing
					break;
				case 'startEvent':
				case 'intermediateThrowEvent':
				case 'intermediateCatchEvent':
				case 'endEvent':
				case 'boundaryEvent':
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
						changedAt: opts.fileDate
					});
					// only add a property, if there is content:
					if( desc ) 
						model.resources[model.resources.length-1].properties.splice(1,0,{
							class: "PC-Description",
							value: desc
						});
					addContainment = true;
					break;
				case 'parallelGateway':
				case 'exclusiveGateway':
				case 'inclusiveGateway':
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
						// ToDo: This is quite possible and allowed, but here it is not yet supported.
						// see: https://docs.camunda.org/manual/7.7/reference/bpmn20/gateways/inclusive-gateway/
						return
					};
					if( gw.incoming.length==1 && gw.outgoing.length==1 ) {
						console.warn("Gateway with id ',id,' has one incoming AND one outgoing path!");
						return
					};
					// else:
				//	addContainment = true;
					// Transform all gateways to actors:
					if( gw.outgoing.length==1 ) {
						// joining gateway:
						switch( tag ) {
							case 'parallelGateway':
								title = opts.strJoinParGateway;
								desc = opts.strJoinParGatewayDesc;
								break;
							case 'exclusiveGateway':
								title = opts.strJoinExcGateway;
								desc = opts.strJoinExcGatewayDesc;
								break;
							case 'inclusiveGateway':
								title = opts.strJoinIncGateway;
								desc = opts.strJoinIncGatewayDesc
						}
					} else { 
						// forking gateway (gw.outgoing.length>1):
						switch( tag ) {
							case 'parallelGateway':
								title = opts.strForkParGateway;
								desc = opts.strForkParGatewayDesc;
								// no events per branch in this case, as there is no decision 
								break;
							case 'exclusiveGateway':
								// Add the title (condition), if specified:
								title = opts.strForkExcGateway+(title? ': '+title : '');
								desc = opts.strForkExcGatewayDesc;
								// list the gateway for adding an event per option in the next pass:
								gw.title = title || tag;
								gwL.push(gw);
								break;
							case 'inclusiveGateway':
								// Add the title (condition), if specified:
								title = opts.strForkIncGateway+(title? ': '+title : '');
								desc = opts.strForkIncGatewayDesc;
								// list the gateway for adding an event per option in the next pass:
								gw.title = title || tag;
								gwL.push(gw)
						}
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
						changedAt: opts.fileDate
					});
					break;
				case 'textAnnotation':
					// will be analyzed in a later pass
					break;
				default:
					console.warn('The BPMN element with tag ',tag,' and title ',title,' has not been transformed.')
			};
			// Add a containment relation for every transformed model-element:
			if( addContainment ) {
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
					changedAt: opts.fileDate
				})
			}
		});
		// 4.3 Third pass to collect the relations between model-elements:
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
//			console.debug('#3',gwL,el,tag,id,title);
			switch(tag) {
				case 'sequenceFlow':
					// A sequenceFlow, where the subject is a forking exclusive or inclusive gateway, needs special attention,
					// these have been listed in gwL in the previous pass:

					// In case of a forking exclusive or inclusive gateway, every outgoing connection is transformed
					// to an event with a signal and trigger relation,
					// but only, if the sequenceFlow's title is defined:
					let feG = itemById(gwL,el.getAttribute('sourceRef'));
					if( feG && title ) {
						seqF = {
							subject: feG,
							object:  itemById(model.resources,el.getAttribute('targetRef'))
						};
						// a. store an event representing the case:
						let ev = {
							id: id,
							title: title,
							class: "RC-Event",
							properties: [{
								class: "PC-Name",
								value: title
							}, {
								class: "PC-Type",
								value: opts.strConditionType
							}],
							changedAt: opts.fileDate
						};
						// Add a description to the last element, if there is additional information:
						if( seqF.subject.title )
							ev.properties.push({
								class: "PC-Description",
								value: seqF.subject.title+' → '+title	// → = &rarr; = &#8594;
							});
						model.resources.push( ev );
						// b. store the signal relation:
						model.statements.push({
							id: id+'-s',
							title: "SpecIF:signals",
							class: "SC-signals",
							subject: seqF.subject.id,
							object: id,
							changedAt: opts.fileDate
						});
						// c. store the trigger relation:
						model.statements.push({
							id: id+'-t',
							title: "SpecIF:triggers",
							class: "SC-triggers",
							subject: id,
							object: seqF.object.id,
							changedAt: opts.fileDate
						});
						return
					};
					// else:
					seqF = {
						subject: itemById(model.resources,el.getAttribute('sourceRef')),
						object:  itemById(model.resources,el.getAttribute('targetRef'))
					};
//					console.debug('seqF',seqF);
					// none or one of the following conditions is true, so we can return right away:
					if( seqF.subject['class']=='RC-Actor' && seqF.object['class']=='RC-Actor' ) {
						model.statements.push({
							id: id,
							title: "SpecIF:precedes",
							class: "SC-precedes",
							subject: seqF.subject.id,
							object: seqF.object.id,
							changedAt: opts.fileDate
						});
						return
					};
					if ((["RC-Actor","RC-Event"].indexOf(seqF.subject['class'])>-1) && seqF.object['class']=="RC-Event") {
						model.statements.push({
							id: id,
							title: "SpecIF:signals",
							class: "SC-signals",
							subject: seqF.subject.id,
							object: seqF.object.id,
							changedAt: opts.fileDate
						});
						return
					};
					// else: seqF.subject['class']=="RC-Event" && seqF.object['class']=="RC-Actor"
					model.statements.push({
						id: id,
						title: "SpecIF:triggers",
						class: "SC-triggers",
						subject: seqF.subject.id,
						object: seqF.object.id,
						changedAt: opts.fileDate
					});
					break;
				case 'association':
					// will be analyzed in a later pass
					return;
				// all other tags (should ;-) have been processed before
			}
		})
	});

	// 5. Select all textAnnotations:
	let taL = []; 	// temporary list of text annotations
	x = Array.from(xmlDoc.querySelectorAll("textAnnotation"));
	x.forEach( function(ann) {
//		console.debug('ann',ann);
		idx = taL.length+1;
		id = ann.getAttribute("id");
		title = opts.strTextAnnotation + (idx>9? ' '+idx : ' 0'+idx);  // assuming there won't be more than 99 annotations
		// even though there should be only one sub-element:
		Array.from(ann.childNodes).forEach( function(txt) {
//			console.debug('textAnnotation.childNode',txt);
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
					changedAt: opts.fileDate
				});
				// memorize all text annotations to include them in the hierarchy:
				taL.push(id)
			}
		})
	});
	
	// 6. Select all associations of textAnnotations:
	x = Array.from(xmlDoc.querySelectorAll("association"));
	x.forEach( function(asc) {
//		console.debug('asc',asc);
		id = asc.getAttribute("id");
		model.statements.push({
			id: id,
			title: "SpecIF:refersTo",
			class: "SC-refersTo",
			subject: asc.getAttribute('targetRef'),
			object: asc.getAttribute('sourceRef'),
			changedAt: opts.fileDate
		});
	});

	// 7. Add the 'diagram shows model-element' statements:
	model.resources.forEach( function(r) {
		// only certain resources are model-elements:
		if( ['RC-Actor','RC-State','RC-Event'].indexOf(r['class'])>-1 ) {
			model.statements.push({
				id: model.id+'-shows-'+r.id,
				title: 'SpecIF:shows',
				class: 'SC-shows',
				subject: diagramId,
				object: r.id,
				changedAt: opts.fileDate
			})
		}
	});
	// 8. The hierarchy with pointers to all resources:
	function NodeList(res) {
		// 8.1 first add the folders:
		let nL =  [{
			id: "H-"+hId,
			resource: hId,
			nodes: [{
				id: genID("N-"),
				resource: diagramId,
				nodes: [],
				changedAt: opts.fileDate
			},{
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
				}],
				changedAt: opts.fileDate
			}],
			changedAt: opts.fileDate
		}];
		// 8.2 Add Actors, States and Events to the respective folders,
		// in alphabetical order:
		res.forEach( function(r) { 
			r.title = r.title || ''
		});
		if( res.length>1 )
			res.sort( function(bim, bam) {
						bim = bim.title.toLowerCase();
						bam = bam.title.toLowerCase();
						return bim==bam ? 0 : (bim<bam ? -1 : 1) 
			});
		res.forEach( function(r) { 
			let nd = {
				id: genID("N-"),
				resource: r.id,
				changedAt: opts.fileDate
			};
			// sort resources according to their type:
			let idx = ["RC-Actor","RC-State","RC-Event"].indexOf( r['class'] );
			if( idx>-1 )
				nL[0].nodes[1].nodes[idx].nodes.push(nd)
		});
		if( taL.length<1 ) return nL;
		// else:
		// 8.3 Add text annotations to the model diagram:
	/*	nL[0].nodes[0].nodes.push({
			id: genID("N-"),
			resource: "FolderNte-" + apx,
			nodes: [],
			changedAt: opts.fileDate
		}); */
		taL.forEach( function(a) { 
	//		nL[0].nodes[0].nodes[0].nodes.push({
			nL[0].nodes[0].nodes.push({
				id: genID("N-"),
				resource: a,
				changedAt: opts.fileDate
			})
		});
		return nL
	};
	// 9. Add the resource for the hierarchy root:
	model.resources.push({
		id: hId,
		title: opts.strBusinessProcessFolder,
	//	class: "RC-ProcessModel",
		class: "RC-Folder",
		properties: [{
			class: "PC-Name",
			value: opts.strBusinessProcessFolder
		}, {
			class: "PC-Type",
			value: opts.strBusinessProcessesType
		}],
		changedAt: opts.fileDate
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
			changedAt: opts.fileDate
		},{
			id: "DT-ShortString",
			title: "String ["+opts.titleLength+"]",
			description: "String with length "+opts.titleLength,
			type: "xs:string",
			maxLength: opts.titleLength,
			changedAt: opts.fileDate
		},{
			id: "DT-String",
			title: "String [1024]",
			description: "String with length 1024",
			type: "xs:string",
			maxLength: 1024,
			changedAt: opts.fileDate
		},{
			id: "DT-FormattedText",
			title: "XHTML ["+opts.descriptionLength+"]",
			description: "Formatted String with length "+opts.descriptionLength,
			type: "xhtml",
			maxLength: opts.descriptionLength,
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
				dataType: "DT-FormattedText",
				changedAt: opts.fileDate
			},{
				id: "PC-Diagram",
				title: "SpecIF:Diagram",
				dataType: "DT-FormattedText",
				changedAt: opts.fileDate
		/*	},{
				id: "PC-Notation",
				title: "SpecIF:Notation",
				dataType: "DT-ShortString",
				changedAt: opts.fileDate  */
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
			propertyClasses: ["PC-Name","PC-Description","PC-Diagram","PC-Type"],
			icon: "&#9635;",
			changedAt: opts.fileDate
		},{
			id: "RC-Actor",
			title: "FMC:Actor",
			description: "An 'Actor' is a fundamental model element type representing an active entity, be it an activity, a process step, a function, a system component or a role.",
			instantiation: ['auto'],
			propertyClasses: ["PC-Name","PC-Description","PC-Type"],
			icon: "&#9632;",
			changedAt: opts.fileDate
		},{
			id: "RC-State",
			title: "FMC:State",
			description: "A 'State' is a fundamental model element type representing a passive entity, be it a value, a condition, an information storage or even a physical shape.",
			instantiation: ['auto'],
			propertyClasses: ["PC-Name","PC-Description","PC-Type"],
			icon: "&#9679;",
			changedAt: opts.fileDate
		},{
			id: "RC-Event",
			title: "FMC:Event",
			description: "An 'Event' is a fundamental model element type representing a time reference, a change in condition/value or more generally a synchronisation primitive.",
			instantiation: ['auto'],
			propertyClasses: ["PC-Name","PC-Description","PC-Type"],
			icon: "&#9830;",
			changedAt: opts.fileDate
		},{
			id: "RC-Note",
			title: "SpecIF:Note",
			description: "A 'Note' is additional information by the author referring to any resource.",
			propertyClasses: ["PC-Name","PC-Description"],
			changedAt: opts.fileDate
		},{
			id: "RC-Collection",
			title: "SpecIF:Collection",
			instantiation: ['auto'],
			description: "A 'Collection' is an arbitrary group of resources linked with a SpecIF:contains statement. It corresponds to a 'Group' in BPMN Diagrams.",
			propertyClasses: ["PC-Name"],
			changedAt: opts.fileDate
		},{
			id: "RC-Folder",
			title: "SpecIF:Heading",
			description: "Folder with title and text for chapters or descriptive paragraphs.",
			isHeading: true,
			instantiation: ['auto','user'],
			propertyClasses: ["PC-Name","PC-Description","PC-Type"],
			changedAt: opts.fileDate
	/*	},{
			id: "RC-ProcessModel",
			title: "SpecIF:Hierarchy",
			description: "Root node of a process model (outline).",
			isHeading: true,
			instantiation: ['auto'],
			propertyClasses: ["PC-Name","PC-Description","PC-Type"],
			changedAt: opts.fileDate  */
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
			id: "SC-stores",
			title: "SpecIF:stores",
			description: "Statement: Actor (Role, Function) writes and reads State (Information)",
			instantiation: ['auto'],
			subjectClasses: ["RC-Actor"],
			objectClasses: ["RC-State"],
			changedAt: opts.fileDate
		},{
			id: "SC-writes",
			title: "SpecIF:writes",
			description: "Statement: Actor (Role, Function) writes State (Information)",
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
			description: "A FMC:Event 'triggers' a FMC:Actor.",
			instantiation: ['auto'],
			subjectClasses: ["RC-Event"],
			objectClasses: ["RC-Actor"],
			changedAt: opts.fileDate
		},{
			id: "SC-refersTo",
			title: "SpecIF:refersTo",
			description: "A SpecIF:Comment, SpecIF:Note or SpecIF:Issue 'refers to' any other resource.",
			instantiation: ['auto'],
			subjectClasses: ["RC-Note"],
			objectClasses: ["RC-Diagram", "RC-Actor", "RC-State", "RC-Event", "RC-Collection"],
			changedAt: opts.fileDate
		}]
	}

	// The folder resources within a hierarchy:
	function Folders() {
		return [{
			id: "FolderGlossary-" + apx,
			class: "RC-Folder",
			title: opts.strGlossaryFolder,
			properties: [{
				class: "PC-Name",
				value: opts.strGlossaryFolder
			},{
				class: "PC-Type",
				value: opts.strGlossaryType
			}],
			changedAt: opts.fileDate
		}, {
			id: "FolderAct-" + apx,
			class: "RC-Folder",
			title: opts.strActorFolder,
			properties: [{
				class: "PC-Name",
				value: opts.strActorFolder
			}],
			changedAt: opts.fileDate
		}, {
			id: "FolderSta-" + apx,
			class: "RC-Folder",
			title: opts.strStateFolder,
			properties: [{
				class: "PC-Name",
				value: opts.strStateFolder
			}],
			changedAt: opts.fileDate
		}, {
			id: "FolderEvt-" + apx,
			class: "RC-Folder",
			title: opts.strEventFolder,
			properties: [{
				class: "PC-Name",
				value: opts.strEventFolder
			}],
			changedAt: opts.fileDate
		}, {
			id: "FolderNte-" + apx,
			class: "RC-Folder",
			title: opts.strAnnotationFolder,
			properties: [{
				class: "PC-Name",
				value: opts.strAnnotationFolder
			}],
			changedAt: opts.fileDate
		}]
	}
	
// =======================================
// some helper functions:	

	function itemById(L,id) {
		// given the ID of an element in a list, return the element itself:
		id = id.trim();
		for( var i=L.length-1;i>-1;i-- )
			if( L[i].id === id ) return L[i];   // return list item
		return
	}
	function ctrl2HTML(str) {
		// Convert js/json control characters (new line) to HTML-tags and remove the others:
		if( typeof( str )!='string' ) str = '';
		return str.replace( /\r|\f/g, '' ).replace( /\t/g, nbsp ).replace( /\n/g, '<br />' )
	}
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
}
