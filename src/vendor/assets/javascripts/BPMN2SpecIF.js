/*!	Transform BPMN-XML to SpecIF
    - Parse the BPMN-XML file
	- Extract both model-elements and semantic relations in SpecIF Format
	- Model elements with same type and title are NOT consolidated by this transformation
	- Reference: https://docs.camunda.org/stable/api-references/bpmn20/
	
	(C)copyright adesso SE (http://adesso.de) and enso managers gmbh (http://www.enso-managers.de)
	Author: Robert.Kanitz@adesso.de and se@enso-managers.de
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de 
*/

function BPMN2Specif( xmlString, opts ) {
	"use strict";

	const
		idResourceClassDiagram = "RC-Diagram",
		idResourceClassActor = "RC-Actor",
		idResourceClassState = "RC-State",
		idResourceClassEvent = "RC-Event",
		idResourceClassCollection = "RC-Collection",
		idResourceClassFolder = "RC-Folder";
	//	idStatementClassAccesses = "SC-accesses";

	if (typeof (opts) != 'object' || !opts.fileName) return null;
	if( !opts.fileDate ) 
		opts.fileDate = new Date().toISOString();
	if( typeof(opts.titleLength)!='number' )
		opts.titleLength = 96;
	if( typeof(opts.textLength)!='number' )
		opts.textLength = 8192;
	if( !opts.mimeType ) 
		opts.mimeType = "application/bpmn+xml";
	if (!opts.strNamespace)
		opts.strNamespace = "bpmn:";

	if (!opts.modelElementClasses)
		opts.modelElementClasses = [idResourceClassActor, idResourceClassState, idResourceClassEvent, idResourceClassCollection];
	if (!opts.strRoleType)
		opts.strRoleType = "SpecIF:Role";
	if( !opts.strConditionType ) 
		opts.strConditionType = "SpecIF:Condition";
	if( !opts.strBusinessProcessType ) 
		opts.strBusinessProcessType = 'SpecIF:BusinessProcess';
	if( !opts.strBusinessProcessesType ) 
		opts.strBusinessProcessesType = 'SpecIF:BusinessProcesses';
	if( !opts.strFolderType ) 
		opts.strFolderType = "SpecIF:Heading";
	if( !opts.strDiagramType ) 
		opts.strDiagramType = "SpecIF:Diagram";
	if( !opts.strBusinessProcessFolder ) 
		opts.strBusinessProcessFolder = "SpecIF:BusinessProcesses";
/*	if( !opts.strAnnotationFolder ) 
		opts.strAnnotationFolder = "SpecIF:Annotations"; */

	if (!opts.strNotation)
		opts.strNotation = "BPMN 2.0 Process Diagram";
	if( !opts.strJoinExcGateway )
		opts.strJoinExcGateway = "Joining Exclusive Gateway";
	if( !opts.strJoinExcGatewayDesc ) 
		opts.strJoinExcGatewayDesc = "Wait for any *one* incoming branch to continue.";
	if( !opts.strJoinParGateway ) 
		opts.strJoinParGateway = "Joining Parallel Gateway";
	if( !opts.strJoinParGatewayDesc ) 
		opts.strJoinParGatewayDesc = "Wait for *all* incoming branches to continue.";
	if( !opts.strJoinIncGateway ) 
		opts.strJoinIncGateway = "Joining Inclusive Gateway";
	if( !opts.strJoinIncGatewayDesc ) 
		opts.strJoinIncGatewayDesc = "Wait for *all active* incoming branches to continue.";
	if( !opts.strForkEvtGateway ) 
		opts.strForkEvtGateway = "Forking (exclusive) Event Gateway";
	if( !opts.strForkEvtGatewayDesc ) 
		opts.strForkEvtGatewayDesc = "The first of the following events to occur will prevail.";
	if( !opts.strForkExcGateway ) 
		opts.strForkExcGateway = "Forking Exclusive Gateway";
	if( !opts.strForkExcGatewayDesc ) 
		opts.strForkExcGatewayDesc = "Evaluate the condidition and signal the respective event.";
	if( !opts.strForkParGateway ) 
		opts.strForkParGateway = "Forking Parallel Gateway";
	if( !opts.strForkParGatewayDesc ) 
		opts.strForkParGatewayDesc = "Forward control to *all* outgoing branches.";
	if( !opts.strForkIncGateway ) 
		opts.strForkIncGateway = "Forking Inclusive Gateway";
	if( !opts.strForkIncGatewayDesc ) 
		opts.strForkIncGatewayDesc = "Evaluate all condiditions and signal the respective events.";
	if( !opts.strTextAnnotation ) 
		opts.strTextAnnotation = "Text Annotation";
	
	var parser = new DOMParser();
	var xmlDoc = parser.parseFromString(xmlString, "text/xml");
	var model = {};
	model["$schema"] = "https://specif.de/v1.0/schema.json";

	// BPMN Collaborations list participants (with referenced processes) and messageFlows.
	// Participants are source and/or target for message-flows (not the referenced processes),
	// so we decide to transform the participants to SpecIF, but not the processes.
	let Cs = Array.from(xmlDoc.querySelectorAll("collaboration"));
	// There should be exactly one collaboration per BPMN file:
	if( Cs.length<1 ) {
		console.error("Diagram with id '",model.id,"' has no collaboration.");
		return
	};
	if( Cs.length>1 )
		console.warn("Diagram with id '",model.id,"' has more than one collaboration.");
//	console.debug('collaboration',Cs);

	// The project's id and title:
	model.id = Cs[0].getAttribute("id");
	// A collaboration may have a documentation, but we haven't come across a name:
	model.title = truncStr(opts.title || opts.fileName.split(".")[0] || Cs[0].nodeName+' "'+model.id+'"', opts.titleLength, 'Name of model');
	// 1. Additional attributes such as title and description:
	model.dataTypes = DataTypes();
	model.propertyClasses = PropertyClasses();
	model.resourceClasses = ResourceClasses();
	model.statementClasses = StatementClasses();
	model.statements = [];

	// Include the original BPMN file itself:
	model.files = [{
		id: 'F-'+simpleHash(opts.fileName),
		title: opts.fileName,
		blob: new Blob([xmlString], {type: opts.mimeType}),
		type: opts.mimeType,
		changedAt: opts.fileDate
	}];

	const
	//	nbsp = '&#160;', // non-breakable space
		apx = simpleHash(model.id),
		diagramId = 'D-' + apx,
	//	hId = 'BPMN-outline-' + apx,
		diagRef = '<object data="'+opts.fileName+'" type="'+opts.mimeType+'" >'+opts.fileName+'</object>';

	// 1. Add the folders:
	model.resources = Folders();

	// 2. Represent the diagram itself:
	model.resources.push({
		id: diagramId,
		title: model.title,
		class: idResourceClassDiagram,
		properties: [{
			class: "PC-Diagram",
			value: "<div><p class=\"inline-label\">Model View:</p><p>"+diagRef+"</p></div>"
		}, {
			class: "PC-Type",
			value: opts.strBusinessProcessType
		}, {
			class: "PC-Notation",
			value: opts.strNotation
		}],
		changedAt: opts.fileDate
	});

	// ToDo: Choose carefully between using tagName or nodeName,
	// see: http://aleembawany.com/2009/02/11/tagname-vs-nodename/
	// see: https://stackoverflow.com/questions/4878484/difference-between-tagname-and-nodename
	
	// 3. Analyse the 'collaboration' and get the participating processes plus the exchanged messages.
	Array.from(Cs[0].childNodes, (el) => {
//		console.debug('collaboration element',el);
		// quit, if the child node does not have a tag, e.g. if it is '#text':
		if (!el.tagName) return;
		let tag = withoutNamespace(el.tagName),	// tag without namespace
			res;

	//	if (el.nodeName.includes("documentation")) {
		switch (tag) {
			case "documentation":
				// 3.1 The documentation of the collaboration (model):
				res = itemById(model.resources, diagramId);
				if (res && el.innerHTML) {
					res.properties.push({
						class: "PC-Description",
						value: truncStr(el.innerHTML, opts.textLength, 'Documentation of collaboration')
					})
				};
				return;
	//	};
	//	if (el.nodeName.includes("group")) {
			case "group":
				// 3.2 Groups - this works with models created by Camunda Modeler:
						/* Example from Camunda Modeler
							<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1rvjown" targetNamespace="http://bpmn.io/schema/bpmn" exporter="Camunda Modeler" exporterVersion="4.4.0">
								<bpmn:collaboration id="Collaboration_038004f">
									<bpmn:participant id="Participant_00yr49w" name="lane-1" processRef="Process_002m5kk" />
									<bpmn:group id="Group_07dtl7v" categoryValueRef="CategoryValue_11tztz5" />
								</bpmn:collaboration>
								...
								<bpmn:category id="Category_1b95mz3">
									<bpmn:categoryValue id="CategoryValue_11tztz5" value="group-1" />
								</bpmn:category>
								...
							</bpmn:definitions>
						*/
				let ref = el.getAttribute("categoryValueRef"),
					name;
				Array.from(xmlDoc.querySelectorAll("categoryValue"),  // the categories are ignored
					(cV) => {
						// only one categoryValue element has the referenced id:
						if (cV.getAttribute("id") == ref) name = cV.getAttribute("value")
					}
				);
				model.resources.push({
					id: el.getAttribute("id"),
					title: name,
					class: idResourceClassCollection,
					properties: [{
						class: "PC-Type",
						value: opts.strNamespace + tag
					}],
					changedAt: opts.fileDate
				});
				return;
	//	};
	//	if (el.nodeName.includes("participant")) {
			case "participant":
				// 3.3 The participating processes;
				// Looking at the specs, 
				// - there is no process without a participant.
				// - there can be participants without a process.
				// see: https://www.omg.org/spec/BPMN/2.0/PDF/
				// We transform the participants with their id, but not the processes;
				// thus any process documentation is lost.
				res = {
					id: el.getAttribute("id"),
					process: el.getAttribute("processRef"),  // temporarily store process id
					// make them unique, but do not take simply the id, as it may be long or misleading (sometimes it contains a wrong tag-name):
					title: truncStr((el.getAttribute("name") || tag + '_' + simpleHash(el.getAttribute("id"))), opts.titleLength, 'Name of participant'),
					class: 'RC-Actor',
					properties: [{
						class: "PC-Type",
						value: opts.strNamespace + tag
					}],
					changedAt: opts.fileDate
				};
				break;
	//	}
	//	else if (el.nodeName.includes("messageFlow")) {
			case "messageFlow":
				// 3.4 The messages between the participants:
				let oId = el.getAttribute("id"),
					sRef = el.getAttribute("sourceRef"),
					tRef = el.getAttribute("targetRef");
				//			console.debug('#8',el.nodeName,oId,sRef,tRef);

				// a. The message data (FMC:State):
				res = {
					id: oId,
					// make them unique, but do not take simply the id:
					title: truncStr((el.getAttribute("name") || tag + '_' + simpleHash(oId)), opts.titleLength, 'Name of message-flow between participants'),
					class: 'RC-State',
					properties: [{
						class: "PC-Type",
						value: opts.strNamespace + tag
					}],
					changedAt: opts.fileDate
				};
				// b. We assume that the sourceRef and targetRef will be found later on.
				// c. The writing relation (statement):
				model.statements.push({
					id: 'S-' + simpleHash('SpecIF:writes' + sRef + oId),
					class: 'SC-writes',
					subject: sRef,
					object: oId,
					properties: [{
						class: "PC-Type",
						value: opts.strNamespace + "dataOutputAssociation"
					}],
					changedAt: opts.fileDate
				});
				// d. The reading relation (statement):
				// ToDo: Is the signalling characteristic well covered? It is not just reading!
				model.statements.push({
					id: 'S-' + simpleHash('SpecIF:reads' + tRef + oId),
					class: 'SC-reads',
					subject: tRef,
					object: oId,
					properties: [{
						class: "PC-Type",
						value: opts.strNamespace + "dataInputAssociation"
					}],
					changedAt: opts.fileDate
				});
				break;
	//	}
	//	else {
			default:
				// skip all other tags:
				console.info("BPMN tag " + tag + " has been skipped.");
				return;
		};
		// arrives here only in cases "participant" and "messageFlow"
		if (!res)
			throw Error("Programming Error in BPMN2Specif: Resource should be defined ...");
		// Get the documentation of participant resp. messageFlow:
		Array.from(el.childNodes, (ch) => {
			if (ch.nodeName.includes("documentation")) {
				if (res && ch.innerHTML) {
					res.properties.push({
						class: "PC-Description",
						value: truncStr(ch.innerHTML, opts.textLength, 'Documentation of ' + (res['class'] == idResourceClassActor ? 'participant' : 'message flow') + ' with id ' + res.id)
					});
				};
				return;
			};
		});
		model.resources.push(res);
	});

	// 4. Parse the processes.
	// For SpecIF, the participant is declared the container for the processes' model-elements ... 
	// and the BPMN 'processes' disappear from the semantics.
	// ToDo: Remove any process having neither contained elements nor messageFlows (e.g. Bizagi 'Hauptprozess').
	let	ctL = [],					// temporary list for containment relations between lanes and model-elements
		gwL = [];					// temporary list for gateways needing some special attention later
				
		function findStoredResource( id ) {
			let	itm = itemById(model.resources,id);
			if( itm )
				return itm
			else
				console.error("Did not find a resource with id '"+id+"'.")
		}
		function analyzeProcess(prc) {
			// analyze a process or subprocess and transform all contained model elements;
			// the container element with a temporary attribute 'project' must be found in model.resources:

			let prcId = prc.getAttribute('id'),
				// find the participant representing (or being responsible for) the process:
				participant = model.resources.find( (e)=>{ return e.process==prcId } ),
				tag, id, title, desc;
//			console.debug('process',model.resources,prc,prcId,participant);
			// depending on the BPMN generator, the name is supplied in the participant or in the process definition ... or both.
			// ToDo: prc.title is never used ??
		//	prc.title = truncStr((participant.title || prc.getAttribute('name')), opts.titleLength, 'Name of process');
			let prcCh = Array.from(prc.childNodes);

			// 4.1 First pass to get the lanes, which do not necessarily come first,
			//     plus the dataStores/dataObjects, so that the input- and outputAssociations can be added in the next pass:
				function getLane(nd, pId) {
//					console.debug('getLane',nd,pId);
					if (nd.nodeName.includes('lane')) {
						let ndId = nd.getAttribute("id"),
							ndName = truncStr(nd.getAttribute("name"), opts.titleLength, 'Name of lane with id ' + ndId);
						if (ndName) {
							// define the lane:
							let lane = {
								id: ndId,
								title: ndName,
								class: 'RC-Actor',
								properties: [{
									class: "PC-Type",
									value: opts.strRoleType
								}],
								changedAt: opts.fileDate
							};
							// store the containment relation for the lane:
							storeContainsStatement(pId, ndId, diagramId)
						/*	model.statements.push({
								id: pId + '-contains-' + ndId,
								class: 'SC-contains',
								subject: pId,	// the process
								object: ndId,	// the lane
								changedAt: opts.fileDate
							}); */
							Array.from(nd.childNodes, (nd) => {
								if (nd.nodeName.includes('documentation')) {
									lane.properties.unshift({
										class: "PC-Description",
										value: truncStr(nd.innerHTML, opts.textLength, 'Documentation of lane id ' + ndId)
									});
								};
								// temporarily store relations for the contained model-elements:
								if (nd.nodeName.includes('flowNodeRef')) {
									ctL.push({
										class: 'SC-contains',
										subject: ndId, 			// the lane
										object: nd.innerHTML	// the contained model-element
									})
								};
								/* Nested lanes are possible, as well:
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
									  </lane> */
								if (nd.nodeName.includes('childLaneSet')) {
									Array.from(nd.childNodes, (ch) => { getLane(ch, ndId) })
								};
							});
							// store the lane:
							model.resources.push(lane);
						}
					}
				}
			prcCh.forEach( (el)=>{
				// quit, if the child node does not have a tag, e.g. if it is '#text':
				if( !el.tagName ) return;
				// else:
				id = el.getAttribute("id");
				title = el.getAttribute("name");
				desc = '';
				Array.from(el.childNodes, (nd)=>{
					if ( withoutNamespace(nd.tagName) == 'documentation'
						&& nd.innerHTML ) 
							desc = nd.innerHTML
				});
				tag = withoutNamespace(el.nodeName);
//				console.debug('#1',tag);
				switch(tag) {
					case 'laneSet':
						// 4.1 The laneSet is not represented in SpecIF, but get the lanes with their model elements;
						//    	note that a 'laneSet' is not mandatory, e.g. BPMNio does not necessarily provide any.
						Array.from( el.childNodes, (ch)=>{ getLane(ch,participant.id) });
						break;
					case 'dataObjectReference':
					case 'dataStoreReference':
						// Store the model-element as FMC:State,
						// Interestingly enough, the name and other information are properties of xxxReference.
						// - Which id to use, the dataObjectReference's or the dataObject's ?
						// - We decide to use the former, as the associations use it.
						// - Even though we use 'dataObject' or 'dataStore' as SubClass.
						// Since it is quite possible that there are multiple elememts with the same title,
						// we consolidate them, here. 
						// The first to provide a description will prevail.
						tag = ( tag=='dataStoreReference'? 'dataStore' : 'dataObject' );
						let res = {
								id: id,
								// make dataObjects unique per model (should be per participant/process):
								title: truncStr((title || tag + (tag == 'dataObject' ? '_' + apx : '')), opts.titleLength, 'Name of '+tag+' with id '+id),
								class: idResourceClassState,
								properties: [{
									class: "PC-Type",
									value: opts.strNamespace+tag
								}],
								changedAt: opts.fileDate
							};
						// add a property, if there is content:
						if( desc ) {
							res.properties.unshift({
								class: "PC-Description",
								value: truncStr(desc, opts.textLength, 'Documentation of '+tag+' with id ' + id)
							})
						};

						// Now, model-elements with duplicate names are not consolidated any more;
						// this will be done upon import/adoption/update of the model:
						model.resources.push( res )
				/*		break;
					case 'dataObject':
					case 'dataStore':
						// nothing
						break;
					default:
						// skip all other tags here and now; they are analysed elsewhere  */
				}
			});

			// 4.2 Second pass to collect the model-elements:
				function storeAccessAssociations(el) {
					Array.from(el.childNodes, (ch)=>{
						if( !ch.tagName ) return;
						if( ch.tagName.includes('dataInputAssociation') ) {
							// find sourceRef:
							Array.from(ch.childNodes, (ref)=>{
//								console.debug('dataInputAssociation.childNode',ref);
								if( !ref.tagName ) return;
								if( ref.tagName.includes('sourceRef') ) {
									let dS = findStoredResource( ref.innerHTML );  // does not work in IE, not even IE11
//									console.debug('storeAccessAssociations',ref.innerHTML,dS);
									if( dS ) {
										// store reading association:
										model.statements.push({
											id: ch.getAttribute("id"),
											class: 'SC-reads',
											subject: id,
											object: dS.id,
											properties: [{
												class: "PC-Type",
												value: opts.strNamespace+"dataInputAssociation"
											}],
											changedAt: opts.fileDate
										})
									}
									else {
										console.error("Did not find a dataStore or dataObject with id '"+dSId+"'.")
									}
								}
							});
							return
						};
						if( ch.tagName.includes('dataOutputAssociation') ) {
							// find targetRef:
							Array.from(ch.childNodes, (ref)=>{
//								console.debug('dataOutputAssociation.childNode',ref);
								if( !ref.tagName ) return;
								if( ref.tagName.includes('targetRef') ) {
									let dS = findStoredResource( ref.innerHTML );  // does not work in IE, not even IE11
									if( dS ) {
										// store writing association:
										model.statements.push({
											id: ch.getAttribute("id"),
											class: 'SC-writes',
											subject: id,
											object: dS.id,
											properties: [{
												class: "PC-Type",
												value: opts.strNamespace+"dataOutputAssociation"
											}],
											changedAt: opts.fileDate
										})
									}
									else {
										console.error("Did not find a dataStore or dataObject with id '"+dSId+"'.")
									}
								}
							})
						}
					})
				}
			prcCh.forEach( (el)=>{
				// quit, if the child node does not have a tag, e.g. if it is '#text':
				if( !el.tagName ) return;
				// else:
				tag = withoutNamespace(el.tagName);
				id = el.getAttribute("id");
				title = el.getAttribute("name")||'';
				desc = '';
				Array.from(el.childNodes, (nd)=>{
					if (withoutNamespace(nd.tagName) == 'documentation'
						&& nd.innerHTML) {
							desc = nd.innerHTML
					}
				});
//				console.debug('#2',el,tag,id,title,desc);
				let addContainment = false,
					gw;
				switch(tag) {
					case 'laneSet':
					case 'dataObjectReference':
					case 'dataStoreReference':
					case 'dataObject':
					case 'dataStore':
						// has been analyzed, before
					case 'sequenceFlow':
					case 'association':
						// will be analyzed in a later pass
						return;
					case 'task':
					case 'manualTask':
					case 'userTask':
					case 'scriptTask':
					case 'serviceTask':
					case 'sendTask':
					case 'receiveTask':
					case 'callActivity':
					case "transaction":
					case 'subProcess':
						// store the model-element as FMC:Actor:
						// Note that a dataInputAssociation may specify a property in lieu of the subprocess.
						let r = {
							id: id,
							// make them unique to avoid consolidation at import:
							title: truncStr((title || tag + '_' + simpleHash(id)), opts.titleLength, 'Name of '+tag+' with id ' + id),
							class: idResourceClassActor,
							properties: [{
								class: "PC-Type",
								value: opts.strNamespace+tag
							}],
							changedAt: opts.fileDate
						};
						if( desc ) {
							r.properties.unshift({
								class: "PC-Description",
								value: truncStr(desc, opts.textLength, 'Documentation of ' + tag + ' with id ' + id)
							})
						};
						if( tag=='subProcess' ) {
							r.process = id   // temporarily store process id
						}
						model.resources.push( r );
						// only add a property, if there is content:

						// Analyze the inner definition of a subProcess;
						// must be called after storing the container element with temporary attribute 'project' as done above:
						if( tag=='subProcess' ) {
//							console.debug( 'sPr', el, tag, id, title );
							analyzeProcess( el )
						};  

						// Store the read/write associations:
						storeAccessAssociations(el);

						addContainment = true;
						break;
					case 'startEvent':
					case 'intermediateThrowEvent':
					case 'intermediateCatchEvent':
					case 'endEvent':
					case 'boundaryEvent':
						// store the model-element as FMC:Event:
						model.resources.push({
							id: id,
							// no need to make unnamed events unique, the consolidation takes care of the needs of different event types:
							title: truncStr((title || tag), opts.titleLength, 'Name of ' + tag + ' with id ' + id),
							class: idResourceClassEvent,
							properties: [{
								class: "PC-Type",
								value: opts.strNamespace+tag
							}],
							changedAt: opts.fileDate
						});
						// only add a property, if there is content:
						if( desc ) {
							model.resources[model.resources.length-1].properties.unshift({
								class: "PC-Description",
								value: truncStr(desc, opts.textLength, 'Documentation of ' + tag + ' with id ' + id)
							})
						};

						// store the read/write associations:
						storeAccessAssociations(el);
						// ToDo: create a statement indicating to which task a boundaryEvent belongs ...
						addContainment = true;
						break;
					case 'parallelGateway':
					case 'exclusiveGateway':
					case 'inclusiveGateway':
					case "eventBasedGateway":
						gw = {id:id,class:tag,incoming:[],outgoing:[]};
						Array.from(el.childNodes, (ch)=>{
							if( !ch.tagName ) return;
							if( ch.tagName.includes('incoming') )
								gw.incoming.push( ch.innerHTML );
							if( ch.tagName.includes('outgoing') )
								gw.outgoing.push( ch.innerHTML );
						});
//						console.debug('Gateway',gw);
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
						}
						else {
							// forking gateway (gw.outgoing.length>1):
							switch( tag ) {
								case 'parallelGateway':
									title = opts.strForkParGateway;
									desc = opts.strForkParGatewayDesc;
									// no events per branch in this case, as there is no decision 
									break;
								case "eventBasedGateway":
									title = opts.strForkEvtGateway;
									desc = opts.strForkEvtGatewayDesc;
									// no events per branch in this case, as there is no decision 
									break;
								case 'exclusiveGateway':
									// Add the title (condition), if specified:
									title = opts.strForkExcGateway + (title ? ': ' + title : '');
									desc = opts.strForkExcGatewayDesc;
									// list the gateway for adding an event per option in the next pass:
									gw.title = title;
									gwL.push(gw);
									break;
								case 'inclusiveGateway':
									// Add the title (condition), if specified:
									title = opts.strForkIncGateway + (title ? ': ' + title : '');
									desc = opts.strForkIncGatewayDesc;
									// list the gateway for adding an event per option in the next pass:
									gw.title = title;
									gwL.push(gw)
							}
						};
						model.resources.push({
							id: id,
							title: truncStr(title, opts.titleLength, 'Name of gateway with id ' + id),
							class: idResourceClassActor,
							properties: [{
								class: "PC-Description",
								value: truncStr(desc, opts.textLength, 'Documentation of gateway with id ' + id)
							}, {
								class: "PC-Type",
								value: opts.strNamespace+tag
							}],
							changedAt: opts.fileDate
						});
						break;
					case 'textAnnotation':
						// will be analyzed in a later pass
						break;
					default:
						// also getting here, when a documentation of the process hase been encountered.
						console.warn('The BPMN element with tag ',tag,' and title ',title,' has not been transformed.')
				};
				// Add a containment relation for every transformed model-element:
				if( addContainment ) {
					// look, whether the element is contained in a lane:
					let cL = ctL.filter( (s)=>{return s.object==id} );
					// use the lane as container, if there is any, or the process otherwise:
					cL.forEach( 
						(c)=>{
							// store the containment relation:
							storeContainsStatement(c.subject, id, diagramId)
						/*	model.statements.push({
								id: cId+'-contains-'+id,
								class: 'SC-contains',
								subject: c.subject,
								object: id,
								changedAt: opts.fileDate
							}) */
						}
					);
					// In certain cases of data generated by Signavio, 
					// the participant is not associated with the process:
					if( cL.length<1 && participant ) 
						storeContainsStatement(participant.id, id, diagramId)
						/*	model.statements.push({
								id: participant.id+'-contains-'+id,
								class: 'SC-contains',
								subject: participant.id,
								object: id,
								changedAt: opts.fileDate
							}) */
				}
			})
		}
	Array.from( xmlDoc.querySelectorAll("process"), analyzeProcess );

	// 5. Collect the sequence flows between model-elements:
	Array.from(xmlDoc.querySelectorAll("sequenceFlow"), (el)=>{
		// At least in case of Signavio-generated files it may happen that a sequenceFlow 
		// references a model-element (resource) which is defined in *another* subprocess. 
		// That's why the sequenceFlows are parsed separately after collecting all resouces.
		let	id = el.getAttribute("id"),
			title = el.getAttribute("name"),
			tag = withoutNamespace(el.tagName),
			feG = itemById(gwL,el.getAttribute('sourceRef')), 
			seqF;
//		console.debug('#3',gwL,el,id,title);

		// A sequenceFlow, where the subject is a forking exclusive or inclusive gateway, needs special attention,
		// these have been listed in gwL in the previous pass:

		// In case of a forking exclusive or inclusive gateway, every outgoing connection is transformed
		// to an event with a signal and trigger relation,
		// but only, if the sequenceFlow's title is defined:
		if( feG && title ) {
			seqF = {
				subject: feG,
				object:  itemById(model.resources,el.getAttribute('targetRef'))
			};
			// a. store an event representing the case:
			let ev = {
				id: id,
				title: truncStr(title, opts.titleLength, 'Name of sequence flow with id ' + id),
				class: idResourceClassEvent,
				properties: [{
					class: "PC-Type",
					value: opts.strConditionType
				}],
				changedAt: opts.fileDate
			};
			// Add a description to the last element, if there is additional information:
			if( seqF.subject.title ) 
				ev.properties.unshift({
					class: "PC-Description",
					value: truncStr((seqF.subject.title + ' → ' + title), opts.textLength, 'Documentation of sequence flow with id ' + id)	// → = &rarr; = &#8594;
				});
				
			model.resources.push( ev );
			// b. store the signal relation:
			model.statements.push({
				id: id+'-s',
			//	class: "SC-signals",
				class: "SC-precedes",
				subject: seqF.subject.id,
				object: id,
				properties: [{
					class: "PC-Type",
					value: opts.strConditionType
				}],
				changedAt: opts.fileDate
			});
			// c. store the trigger relation:
			model.statements.push({
				id: id+'-t',
			//	class: "SC-triggers",
				class: "SC-precedes",
				subject: id,
				object: seqF.object.id,
				properties: [{
					class: "PC-Type",
					value: opts.strConditionType
				}],
				changedAt: opts.fileDate
			});
			return
		};
		// else:
		seqF = {
			subject: itemById(model.resources,el.getAttribute('sourceRef')),
			object:  itemById(model.resources,el.getAttribute('targetRef'))
		};
//		console.debug('seqF',model.resources,el,seqF);
		if( seqF.subject['class']=='RC-Actor' && seqF.object['class']=='RC-Actor' ) {
			model.statements.push({
				id: id,
				class: "SC-precedes",
				subject: seqF.subject.id,
				object: seqF.object.id,
				properties: [{
					class: "PC-Type",
					value: opts.strNamespace+tag
				}],
				changedAt: opts.fileDate
			});
			return
		};
		if (([idResourceClassActor,idResourceClassEvent].indexOf(seqF.subject['class'])>-1) && seqF.object['class']==idResourceClassEvent) {
			model.statements.push({
				id: id,
			//	class: "SC-signals",
				class: "SC-precedes",
				subject: seqF.subject.id,
				object: seqF.object.id,
				properties: [{
					class: "PC-Type",
					value: opts.strNamespace+tag
				}],
				changedAt: opts.fileDate
			});
			return
		};
		// else: seqF.subject['class']==idResourceClassEvent && seqF.object['class']==idResourceClassActor
		model.statements.push({
				id: id,
			//	class: "SC-triggers",
				class: "SC-precedes",
				subject: seqF.subject.id,
				object: seqF.object.id,
					properties: [{
						class: "PC-Type",
						value: opts.strNamespace+tag
					}],
				changedAt: opts.fileDate
		});
	});

	// 6. Select all textAnnotations:
	let annL = []; 	// temporary list of text annotations
	Array.from(xmlDoc.querySelectorAll("textAnnotation"), (ann)=>{
//		console.debug('ann',ann);
		let idx = annL.length+1,
			id = ann.getAttribute("id");  
		// even though there should be only one sub-element:
		Array.from(ann.childNodes, (txt)=>{
//			console.debug('textAnnotation.childNode',txt);
			if( txt.tagName && txt.tagName.includes('text') && txt.innerHTML ) {
				model.resources.push({
					id: id,
					// assuming there won't be more than 99 annotations:
					title: opts.strTextAnnotation + (idx > 9 ? ' ' + idx : ' 0' + idx),
					class: "RC-Note",
					properties: [{
						class: "PC-Description",
						value: truncStr(txt.innerHTML, opts.textLength, 'Annotation with id '+id)
					}],
					changedAt: opts.fileDate
				});
				// memorize all text annotations to include them in the hierarchy:
				annL.push(id)
			}
		})
	});
	
	// 7. Select all associations of textAnnotations:
	Array.from(xmlDoc.querySelectorAll("association"), (asc)=>{
//		console.debug('asc',asc);
		let id = asc.getAttribute("id"),
			su = findStoredResource( asc.getAttribute('targetRef') ),
			ob = findStoredResource( asc.getAttribute('sourceRef') );
		if( su && ob )
			model.statements.push({
				id: id,
				class: "SC-refersTo",
				subject: su.id,
				object: ob.id,
				changedAt: opts.fileDate
			})
		else
			console.warn("Omitted association "+id+", because either the source or more probably the target is missing")
	});

	// 8. Collect 'contains' statements using graphical information
	// 8.1 First get all 'BPMNShape's
	let shapes = Array.from(xmlDoc.querySelectorAll("BPMNShape"),
			(sh) => {
				let bounds,
					refId = sh.getAttribute('bpmnElement');  // id of the represented model element
				Array.from(sh.children, (ch) => {
					if (ch.tagName && ch.tagName.includes('Bounds')) bounds = ch;
				});
				return (bounds ?
					{
						ref: refId,
						type: getType(refId),
						x: parseInt(bounds.getAttribute('x')),
						y: parseInt(bounds.getAttribute('y')),
						w: parseInt(bounds.getAttribute('width')),
						h: parseInt(bounds.getAttribute('height'))
					} : undefined);

				function getType(id) {
					let refEl = itemById(model.resources, id);
					if( refEl ) 
						for (var prp of refEl.properties)
							if (prp['class'] == 'PC-Type')
								return withoutNamespace(prp.value);
					// else:
				//	return // undefined
                }
			}
		);
//	console.debug('shapes',shapes);
	// 8.2 Then check for shapes contained in those shapes representing a 'group':
	for (var sh of shapes) {
		// outer loop:
		if (sh.type == 'group') {
			for (var el of shapes) {
				// inner loop
				if (el.type != 'group') {
					if(
						   sh.x + 1 > el.x
						&& sh.y + 1 > el.y
						&& sh.x + sh.w < el.x + el.w + 1
						&& sh.y + sh.h < el.y + el.h + 1
					) {
						storeContainsStatement(el.ref,sh.ref,diagramId)
					}
					else if (
						   sh.x < el.x + 1
						&& sh.y < el.y + 1
						&& sh.x + sh.w + 1 > el.x + el.w
						&& sh.y + sh.h + 1 > el.y + el.h
					) {
						storeContainsStatement(sh.ref, el.ref, diagramId)
					}
				};
			};
		};
	};

	// 9. Add the 'diagram shows model-element' statements:
	model.statements.forEach( (s)=>{
			// elements which are added while looping will *not* be visited:
			model.statements.push({
				id: model.id+'-shows-'+s.id,
				class: "SC-shows",
				subject: diagramId,
				object: s.id,
				changedAt: opts.fileDate
			})
	});
	model.resources.forEach( (r)=>{
		// only certain resources are model-elements:
		if( opts.modelElementClasses.includes(r['class']) ) {
			model.statements.push({
				id: model.id+'-shows-'+r.id,
				class: "SC-shows",
				subject: diagramId,
				object: r.id,
				changedAt: opts.fileDate
			})
		}
	});
	
/*	// 10. Add the resource for the hierarchy root:
	model.resources.push({
		id: hId,
		title: model.title,
		description: model.description,
		class: idResourceClassFolder,
		properties: [{
			class: "PC-Description",
			value: model.description || ''
		},{
			class: "PC-Type",
			value: opts.resClassOutline
		}],
		changedAt: opts.fileDate
	}); */

	// 11. The hierarchy with pointers to all resources;
	//    the glossary is added during import:
		function NodeList(res) {
			// 9.1 first add the folders:
			let nL =  [{
				id: "H-FolderProcesses-" + apx,
				resource: "FolderProcesses-" + apx,
				nodes: [{
					id: "N-" + diagramId,
					resource: diagramId,
					nodes: [],
					changedAt: opts.fileDate
				}],
				changedAt: opts.fileDate
		/*	},{
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
				changedAt: opts.fileDate */
			}];
		/*	// 9.2 Add Actors, States and Events to the respective folders in alphabetical order:
			if( res.length>1 )
				res.sort( (bim, bam)=>{
							bim = bim.title.toLowerCase();
							bam = bam.title.toLowerCase();
							return bim==bam ? 0 : (bim<bam ? -1 : 1) 
				});
			res.forEach( (r)=>{ 
				let nd = {
					id: genID("N-"),
					resource: r.id,
					changedAt: opts.fileDate
				};
				// sort resources according to their type:
				let idx = [idResourceClassActor,idResourceClassState,idResourceClassEvent].indexOf( r['class'] );
				if( idx>-1 )
					nL[1].nodes[idx].nodes.push(nd)
			}); */
			// 9.3 Add text annotations to the model diagram:
			annL.forEach( (a)=>{ 
				nL[0].nodes[0].nodes.push({
					id: genID("N-"),
					resource: a,
					changedAt: opts.fileDate
				})
			});
			return nL;
		}
	// Add the tree:
	model.hierarchies = NodeList(model.resources);
	
//	console.debug('BPMN-XML',model);
	return model;
	
// =======================================
// called functions:	

	// The dataTypes should correspond to stdTypes.ts:
	function DataTypes() {
		return [{
			id: "DT-ShortString",
			title: "String ["+opts.titleLength+"]",
			description: "String with max. length "+opts.titleLength,
			revision: "1",
			type: "xs:string",
			maxLength: opts.titleLength,
			changedAt: "2016-05-26T08:59:00+02:00"
		},{
			id: "DT-Text",
			title: "Plain or formatted Text",
			description: "A text string, plain, or formatted with XHTML or markdown",
			revision: "1.1",
			replaces: ["1"],
			type: "xs:string",
			changedAt: "2021-02-14T08:59:00+02:00"
		}]
	}
	
	// The property classes should correspond to stdTypes.ts:
	function PropertyClasses() {
		return [{
			id: "PC-Name",
			title: "dcterms:title",
			dataType: "DT-ShortString",
			changedAt: "2016-05-26T08:59:00+02:00"
		},{
			id: "PC-Description",
			title: "dcterms:description",
			dataType: "DT-Text",
			changedAt: "2016-05-26T08:59:00+02:00"
		},{
			id: "PC-Diagram",
			title: "SpecIF:Diagram",
			dataType: "DT-Text",
			changedAt: "2016-05-26T08:59:00+02:00"
		},{
			id: "PC-Notation",
			title: "SpecIF:Notation",
			dataType: "DT-ShortString",
			changedAt: "2016-05-26T08:59:00+02:00"
		},{
			id: "PC-Type",
			title: "dcterms:type",
			dataType: "DT-ShortString",
			changedAt: "2016-05-26T08:59:00+02:00"
		}]
	}
	
	// The resource classes:
	function ResourceClasses() {
		return [{
			id: idResourceClassDiagram,
			title: opts.strDiagramType,
			description: "A 'Diagram' is a graphical model view with a specific communication purpose, e.g. a business process or system composition.",
			instantiation: ['user'],
			propertyClasses: ["PC-Name","PC-Diagram","PC-Description","PC-Type","PC-Notation"],
			icon: "&#9635;",
			changedAt: opts.fileDate
		},{
			id: idResourceClassActor,
			title: "FMC:Actor",
			description: "An 'Actor' is a fundamental model element type representing an active entity, be it an activity, a process step, a function, a system component or a role.",
			instantiation: ['auto'],
			propertyClasses: ["PC-Name","PC-Description","PC-Type"],
			icon: "&#9632;",
			changedAt: opts.fileDate
		},{
			id: idResourceClassState,
			title: "FMC:State",
			description: "A 'State' is a fundamental model element type representing a passive entity, be it a value, a condition, an information storage or even a physical shape.",
			instantiation: ['auto'],
			propertyClasses: ["PC-Name","PC-Description","PC-Type"],
			icon: "&#9679;",
			changedAt: opts.fileDate
		},{
			id: idResourceClassEvent,
			title: "FMC:Event",
			description: "An 'Event' is a fundamental model element type representing a time reference, a change in condition/value or more generally a synchronisation primitive.",
			instantiation: ['auto'],
			propertyClasses: ["PC-Name","PC-Description","PC-Type"],
			icon: "&#11047;",
			changedAt: opts.fileDate
		},{
			id: idResourceClassCollection,
			title: "SpecIF:Collection",
			instantiation: ['auto'],
			description: "A 'Collection' is an arbitrary group of resources linked with a SpecIF:contains statement. It corresponds to a 'Group' in BPMN Diagrams.",
			propertyClasses: ["PC-Name","PC-Description","PC-Type"],
			icon: "&#11034;",
			changedAt: opts.fileDate
		},{
			id: idResourceClassFolder,
			title: opts.strFolderType,
			description: "Folder with title and text for chapters or descriptive paragraphs.",
			isHeading: true,
			instantiation: ['auto','user'],
			propertyClasses: ["PC-Name","PC-Description","PC-Type"],
			changedAt: opts.fileDate
		},{
			id: "RC-Note",
			title: "SpecIF:Note",
			description: "A 'Note' is additional information by the author referring to any resource.",
			propertyClasses: ["PC-Name","PC-Description"],
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
			propertyClasses: ["PC-Type"],
			subjectClasses: [idResourceClassDiagram],
		//?	objectClasses: opts.modelElementClasses.concat(["SC-contains", "SC-writes", "SC-reads", "SC-precedes", "SC-refewrsTo" ]),
			changedAt: opts.fileDate
		},{
			id: "SC-contains",
			title: "SpecIF:contains",
			description: "Statement: Model-Element contains Model-Element",
			instantiation: ['auto'],
			propertyClasses: ["PC-Type"],
			subjectClasses: opts.modelElementClasses,
			objectClasses: opts.modelElementClasses,
			changedAt: opts.fileDate
		},{
			id: "SC-writes",
			title: "SpecIF:writes",
			description: "Statement: Actor (Role, Function) writes State (Information)",
			instantiation: ['auto'],
			propertyClasses: ["PC-Type"],
			subjectClasses: [idResourceClassActor, idResourceClassEvent],
			objectClasses: [idResourceClassState],
			changedAt: opts.fileDate
		},{
			id: "SC-reads",
			title: "SpecIF:reads",
			description: "Statement: Actor (Role, Function) reads State (Information)",
			instantiation: ['auto'],
			propertyClasses: ["PC-Type"],
			subjectClasses: [idResourceClassActor, idResourceClassEvent],
			objectClasses: [idResourceClassState],
			changedAt: opts.fileDate
		},{
			id: "SC-precedes",
			title: "SpecIF:precedes",
			description: "A FMC:Actor 'precedes' a FMC:Actor; e.g. in a business process or activity flow.",
			instantiation: ['auto'],
			propertyClasses: ["PC-Type"],
			subjectClasses: [idResourceClassActor, idResourceClassEvent],
			objectClasses: [idResourceClassActor, idResourceClassEvent],
			changedAt: opts.fileDate
	/*	},{
			id: idStatementClassAccesses,
			title: "SpecIF:accesses",
			description: "Statement: Actor (Role, Function) writes and reads State (Information)",
			instantiation: ['auto'],
			propertyClasses: ["PC-Type"],
			subjectClasses: [idResourceClassActor],
			objectClasses: [idResourceClassState],
			changedAt: opts.fileDate 
		},{
			id: "SC-signals",
			title: "SpecIF:signals",
			description: "A FMC:Actor 'signals' a FMC:Event.",
			instantiation: ['auto'],
			propertyClasses: ["PC-Type"],
			subjectClasses: [idResourceClassActor, idResourceClassEvent],
			objectClasses: [idResourceClassEvent],
			changedAt: opts.fileDate
		},{
			id: "SC-triggers",
			title: "SpecIF:triggers",
			description: "A FMC:Event 'triggers' a FMC:Actor.",
			instantiation: ['auto'],
			propertyClasses: ["PC-Type"],
			subjectClasses: [idResourceClassEvent],
			objectClasses: [idResourceClassActor, idResourceClassEvent],
			changedAt: opts.fileDate */
		},{ 
			id: "SC-refersTo",
			title: "SpecIF:refersTo",
			description: "A SpecIF:Comment, SpecIF:Note or SpecIF:Issue 'refers to' any other resource.",
			instantiation: ['auto'],
			propertyClasses: ["PC-Type"],
			subjectClasses: ["RC-Note"],
			objectClasses: [idResourceClassDiagram].concat(opts.modelElementClasses),
			changedAt: opts.fileDate
		}]
	}

	// The folder resources within a hierarchy:
	function Folders() {
		return [{
			id: "FolderProcesses-" + apx,
		//	class: "RC-ProcessModel",
			class: idResourceClassFolder,
			title: opts.strBusinessProcessFolder,
			properties: [{
				class: "PC-Type",
				value: opts.strBusinessProcessesType
			}],
			changedAt: opts.fileDate
		}]
	}
	
	function itemById(L, id) {
		if (L && id) {
			// given an ID of an item in a list, return it's index:
			id = id.trim();
			for (var l of L)
				if (l.id == id) return l   // return list item 
		};
		//	return undefined
	}
/*	function indexBy( L, p, s ) {
		if( L && p && s ) {
			// Return the index of an element in list 'L' whose property 'p' equals searchterm 's':
			// hand in property and searchTerm as string !
			for( var i=L.length-1;i>-1;i-- )
				if( L[i][p]==s ) return i
		};
		return -1
	} */
	function withoutNamespace(str) {
		return (str ? str.split(':').pop() : '');
    }
	function truncStr(orig, mxLen, errT) {
		if (orig && orig.length > mxLen) {
			console.warn(errT + ' has been truncated because it is too long');
			return orig.slice(0, mxLen)
		};
		return orig;
	}
	function addStatementIfNotListed(nS) {
		// In the BPMN transformation, this routine is used only for 'contains' statements.
		// Two 'contains' statements in opposite direction between two given resources are logically inconsistent.
		// So, it is refrained from adding a new relationship, if there is one already
		// for the respective model elements, no matter which direction.
		// This is OK, because the first entry is based on an explicit relation and
		// an entry based on graphical analysis is added later.
		for (var s of model.statements)
			if (s["class"] == nS["class"]
				&& (
					s.subject == nS.subject && s.object == nS.object
					|| s.subject == nS.object && s.object == nS.subject
				)
			)
				return false; // has not been stored
		// not found, so add:
		model.statements.push(nS);
		return true; // has been stored
	}
	function storeContainsStatement(sId, oId, dId) {
		let stId = "S-" + simpleHash("SC-contains" + sId + oId);
		addStatementIfNotListed({
			id: stId,
			class: "SC-contains",
			subject: sId,
			object: oId,
			changedAt: opts.fileDate
		});
	/*	The shows statement is anyways added for all statements at the end of the transformation.
	 *	if (addStatementIfNotListed({
				id: stId,
				class: "SC-contains",
				subject: sId,
				object: oId,
				changedAt: opts.fileDate
		})) {
			// A 'contains' statement has been stored, so the statement itself gets a statement that it is shown:
			model.statements.push({
				id: "S-" + simpleHash("SC-shows" + dId + stId),
				class: "SC-shows",
				subject: dId,
				object: stId,
				changedAt: opts.fileDate
			})}; */
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
