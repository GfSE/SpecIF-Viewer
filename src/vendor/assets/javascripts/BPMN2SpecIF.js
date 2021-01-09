/* 	Transform BPMN-XML to SpecIF
    - Parse the BPMN-XML file
	- Extract both model-elements and semantic relations in SpecIF Format
	- Model elements with same type and title are NOT consolidated by this transformation
	- Reference: https://docs.camunda.org/stable/api-references/bpmn20/
	
	Author: Robert.Kanitz@adesso.de and se@enso-managers.de
	License: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution!        
*/

function BPMN2Specif( xmlString, opts ) {
	"use strict";
	if( typeof(opts)!='object' || !opts.fileName ) return null;
	if( !opts.fileDate ) 
		opts.fileDate = new Date().toISOString();
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
	
	if( !opts.strRoleType ) 
		opts.strRoleType = "SpecIF:Role";
	if( !opts.strConditionType ) 
		opts.strConditionType = "SpecIF:Condition";
	if( !opts.strBusinessProcessType ) 
		opts.strBusinessProcessType = 'SpecIF:BusinessProcess';
	if( !opts.strBusinessProcessesType ) 
		opts.strBusinessProcessesType = 'SpecIF:BusinessProcesses';
	if( !opts.strGlossaryType ) 
		opts.strGlossaryType = "SpecIF:Glossary";
	if( !opts.strFolderType ) 
		opts.strFolderType = "SpecIF:Heading";
	if( !opts.strBusinessProcessFolder ) 
		opts.strBusinessProcessFolder = "SpecIF:BusinessProcesses";
	if( !opts.strGlossaryFolder ) 
		opts.strGlossaryFolder = "SpecIF:Glossary";
	if( !opts.strActorFolder ) 
		opts.strActorFolder = "FMC:Actors";
	if( !opts.strStateFolder ) 
		opts.strStateFolder = "FMC:States";
	if( !opts.strEventFolder ) 
		opts.strEventFolder = "FMC:Events";
/*	if( !opts.strAnnotationFolder ) 
		opts.strAnnotationFolder = "SpecIF:Annotations"; */

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
	model.title = opts.title || Cs[0].nodeName;
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
		title: model.title.slice(0,opts.titleLength),
		class: 'RC-Diagram',
		properties: [{
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
	Array.from(Cs[0].childNodes, (el)=>{
//		console.debug('collaboration element',el);
		// quit, if the child node does not have a tag, e.g. if it is '#text':
		if( !el.tagName ) return;
		let tag = el.tagName.split(':').pop();	// tag without namespace
		// 3.1 The documentation of the collaboration (model):
		if (el.nodeName.includes("documentation")) {
			let diag = itemBy(model.resources,'id',diagramId);
			if( diag && el.innerHTML ) {
				if( el.innerHTML.length>opts.descriptionLength ) 
					console.warn('Documentation of collaboration '+diagramId+' has been truncated because it is too long');
				diag.properties.push({
					class: "PC-Description",
					value: el.innerHTML.slice(0,opts.descriptionLength)
				})
			}
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
				process: el.getAttribute("processRef"),  // temporarily store process id
				// make them unique, but do not take id, as it may be long or misleading (sometimes it contains a wrong tag-name):
				title: (el.getAttribute("name") || tag+'_'+simpleHash(el.getAttribute("id"))).slice(0,opts.titleLength),  
				class: 'RC-Actor',
				properties: [{
					class: "PC-Type",
					value: "BPMN:"+tag
				}],
				changedAt: opts.fileDate
			})
		};
		// 3.3 The messages between the processes:
		if (el.nodeName.includes("messageFlow")) {
			let oId = el.getAttribute("id"),
				sRef = el.getAttribute("sourceRef"),
				tRef = el.getAttribute("targetRef");
//			console.debug('#8',el.nodeName,oId,sRef,tRef);
				
			// a. The message data (FMC:State):
			model.resources.push({
				id: oId,
				// no need to give them a unique name; messages and flows are only consolidated if they have equal subject and object:
				title: (el.getAttribute("name") || tag).slice(0,opts.titleLength),
				class: 'RC-State',
				properties: [{
					class: "PC-Type",
					value: "BPMN:"+tag
				}],
				changedAt: opts.fileDate
			});
			// b. We assume that the sourceRef and targetRef will be found later on.
			// c. The writing relation (statement):
			model.statements.push({
				id: 'S-'+simpleHash(sRef+oId+'SpecIF:writes'),
				title: 'SpecIF:writes',
				class: 'SC-writes',
				subject: sRef,
				object: oId,
				changedAt: opts.fileDate
			});
			// d. The reading relation (statement):
			// ToDo: Is the signalling characteristic well covered? It is not just reading!
			model.statements.push({
				id: 'S-'+simpleHash(tRef+oId+'SpecIF:reads'),
				title: 'SpecIF:reads',
				class: 'SC-reads',
				subject: tRef,
				object: oId,
				changedAt: opts.fileDate
			})
		}
	});
	// 4. Parse the processes.
	// For SpecIF, the participant is declared the container for the processes' model-elements ... 
	// and the BPMN 'processes' disappear from the semantics.
	// ToDo: Remove any process having neither contained elements nor messageFlows (e.g. Bizagi 'Hauptprozess').

	let	ctL = [],					// temporary list for containment relations between lanes and model-elements
		gwL = [];					// temporary list for gateways needing some special attention later
				
		function findStoredResource( id ) {
			let	itm = itemBy(model.resources,'id',id);
			if( itm )
				return itm
			else
				console.error("Did not find a resource with id '"+id+"'.")
		}
		function analyzeProcess(pr) {
			// analyze a process or subprocess and transform all contained model elements;
			// the container element with a temporary attribute 'project' must be found in model.resources:

			// find the participant representing (or being responsible for) the process:
			let prId = pr.getAttribute('id'),
				pa = model.resources.find( (e)=>{ return e.process==prId } ),
				tag, id, title, desc;
//			console.debug('process',model.resources,pr,prId,pa);
			// depending on the BPMN generator, the name is supplied in the participant or in the process definition ... or both.
			// ToDo: pa.title is never used ??
		//	pa.title = (pa.title || pr.getAttribute('name')).slice(0,opts.titleLength);
			let chNs = Array.from(pr.childNodes);

			// 4.1 First pass to get the lanes, which do not necessarily come first,
			//     and the dataStores/dataObjects, so that the input- and outputAssociations can be added in the next pass:
			chNs.forEach( (el)=>{
				// quit, if the child node does not have a tag, e.g. if it is '#text':
				if( !el.tagName ) return;
				// else:
				id = el.getAttribute("id");
				title = el.getAttribute("name");
				desc = '';
				Array.from(el.childNodes, (nd)=>{
					if( nd.tagName && nd.tagName.split(':').pop() == 'documentation' 
						&& nd.innerHTML.length>0 && nd.innerHTML.length<opts.descriptionLength ) 
							desc = nd.innerHTML
				});
				tag = el.nodeName.split(':').pop();	// tag without namespace
//				console.debug('#1',tag);
					function getLane(nd,pId) {
//						console.debug('getLane',nd,pId);
						if( nd.nodeName.includes('lane') ) {
							let ndId = nd.getAttribute("id"),
								ndName = (nd.getAttribute("name")||'').slice(0,opts.titleLength);
							if( ndName ) {
								// store the lane:
								model.resources.push({
									id: ndId,
									title: ndName,
									class: 'RC-Actor',
									properties: [{
										class: "PC-Type",
										value: opts.strRoleType
									}],
									changedAt: opts.fileDate
								});
								// store the containment relation for the lane:
								model.statements.push({
									id: pId + '-contains-' + ndId,
									title: 'SpecIF:contains',
									class: 'SC-contains',
									subject: pId,	// the process
									object: ndId,		// the lane
									changedAt: opts.fileDate
								});
								// temporarily store relations for the contained model-elements:
								Array.from(nd.childNodes, (nd)=>{
									if( nd.nodeName.includes('flowNodeRef') ) {
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
									if( nd.nodeName.includes('childLaneSet') ) {
										Array.from(nd.childNodes, (ch)=>{ getLane(ch,ndId) })
									}
								})
							}
						}
					}
				switch(tag) {
					case 'laneSet':
						// 4.1 Get the laneSets/lanes with their model elements;
						//    	note that a 'laneSet' is not mandatory, e.g. BPMNio does not necessarily provide any.
						Array.from( el.childNodes, (ch)=>{ getLane(ch,pa.id) });
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
								title: (title || tag+( tag=='dataObject'? '_'+apx : '' )).slice(0,opts.titleLength),
								class: "RC-State",
								properties: [{
									class: "PC-Type",
									value: 'BPMN:'+tag
								}],
								changedAt: opts.fileDate
							};
						// add a property, if there is content:
						if( desc ) {
							res.properties.push({
								class: "PC-Description",
								value: desc
							})
						};

						// Now, model-elements with duplicate names are not consolidated, any more;
						// this will be done upon import/adoption/update of the model:
						model.resources.push( res )
						break;
					case 'dataObject':
					case 'dataStore':
						// nothing
						break;
					// skip all other tags for now.
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
								if( opts.isIE ) {
									console.warn('Omitting dataInputAssociation with id '+ch.getAttribute("id")
												+', because IE cannot read the object reference.');
									return
								};
								if( ref.tagName.includes('sourceRef') ) {
									let dS = findStoredResource( ref.innerHTML );  // does not work in IE, not even IE11
//									console.debug('storeAccessAssociations',ref.innerHTML,dS);
									if( dS ) {
										// store reading association:
										model.statements.push({
											id: ch.getAttribute("id"),
											title: 'SpecIF:reads',
											class: 'SC-reads',
											subject: id,
											object: dS.id,
											changedAt: opts.fileDate
										})
									} else {
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
								if( opts.isIE ) {
									console.warn('Omitting dataOutputAssociation with id '+ch.getAttribute("id")
												+', because IE cannot read the object reference.');
									return
								};
								if( ref.tagName.includes('targetRef') ) {
									let dS = findStoredResource( ref.innerHTML );  // does not work in IE, not even IE11
									if( dS ) {
										// store writing association:
										model.statements.push({
											id: ch.getAttribute("id"),
											title: 'SpecIF:writes',
											class: 'SC-writes',
											subject: id,
											object: dS.id,
											changedAt: opts.fileDate
										})
									} else {
										console.error("Did not find a dataStore or dataObject with id '"+dSId+"'.")
									}
								}
							})
						}
					})
				};
			chNs.forEach( (el)=>{
				// quit, if the child node does not have a tag, e.g. if it is '#text':
				if( !el.tagName ) return;
				// else:
				tag = el.tagName.split(':').pop();	// tag without namespace
				id = el.getAttribute("id");
				title = (el.getAttribute("name")||'').slice(0,opts.titleLength);
				desc = '';
				Array.from(el.childNodes, (nd)=>{
					if( nd.tagName && nd.tagName.split(':').pop() == 'documentation' && nd.innerHTML ) {
						if( nd.innerHTML.length>opts.descriptionLength ) 
							console.warn('Documentation of element '+id+' has been truncated because it is too long');
						desc = nd.innerHTML.slice(0,opts.descriptionLength)
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
					case 'subProcess':
						// store the model-element as FMC:Actor:
						// Note that a dataInputAssociation may specify a property in lieu of the subprocess.
						let r = {
							id: id,
							// make them unique to avoid consolidation:
							title: (title || tag+'_'+simpleHash(id)).slice(0,opts.titleLength),
							class: "RC-Actor",
							properties: [{
								class: "PC-Type",
								value: 'BPMN:'+tag
							}],
							changedAt: opts.fileDate
						};
						if( desc ) {
							r.properties.push({
								class: "PC-Description",
								value: desc
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
							title: (title || tag).slice(0,opts.titleLength),
							class: "RC-Event",
							properties: [{
								class: "PC-Type",
								value: 'BPMN:'+tag
							}],
							changedAt: opts.fileDate
						});
						// only add a property, if there is content:
						if( desc ) {
							model.resources[model.resources.length-1].properties.push({
								class: "PC-Description",
								value: desc
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
									title = (opts.strForkExcGateway+(title? ': '+title : '')).slice(0,opts.titleLength);
									desc = opts.strForkExcGatewayDesc;
									// list the gateway for adding an event per option in the next pass:
									gw.title = title;
									gwL.push(gw);
									break;
								case 'inclusiveGateway':
									// Add the title (condition), if specified:
									title = (opts.strForkIncGateway+(title? ': '+title : '')).slice(0,opts.titleLength);
									desc = opts.strForkIncGatewayDesc;
									// list the gateway for adding an event per option in the next pass:
									gw.title = title;
									gwL.push(gw)
							}
						};
						model.resources.push({
							id: id,
							title: title,
							class: "RC-Actor",
							properties: [{
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
					let cL = ctL.filter( (s)=>{return s.object==id} ), 
						cId;
					// use the lane as container, if there is any, or the process otherwise:
					cL.forEach( 
						(c)=>{
							cId = c.subject;
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
					);
					// In certain cases of data generated by Signavio, 
					// the participant pa is not associated with the process:
					if( cL.length<1 && pa ) 
							model.statements.push({
								id: pa.id+'-contains-'+id,
								title: 'SpecIF:contains',
								class: 'SC-contains',
								subject: pa.id,
								object: id,
								changedAt: opts.fileDate
							})
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
			feG = itemBy(gwL,'id',el.getAttribute('sourceRef')), 
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
				object:  itemBy(model.resources,'id',el.getAttribute('targetRef'))
			};
			// a. store an event representing the case:
			let ev = {
				id: id,
				title: title,
				class: "RC-Event",
				properties: [{
					class: "PC-Type",
					value: opts.strConditionType
				}],
				changedAt: opts.fileDate
			};
			// Add a description to the last element, if there is additional information:
			if( seqF.subject.title && seqF.subject.title.length+title.length+3<opts.descriptionLength ) 
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
			subject: itemBy(model.resources,'id',el.getAttribute('sourceRef')),
			object:  itemBy(model.resources,'id',el.getAttribute('targetRef'))
		};
//		console.debug('seqF',model.resources,el,seqF);
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
	});

	// 6. Select all textAnnotations:
	let taL = []; 	// temporary list of text annotations
	Array.from(xmlDoc.querySelectorAll("textAnnotation"), (ann)=>{
//		console.debug('ann',ann);
		let idx = taL.length+1,
			id = ann.getAttribute("id"),
			title = opts.strTextAnnotation + (idx>9? ' '+idx : ' 0'+idx);  // assuming there won't be more than 99 annotations
		// even though there should be only one sub-element:
		Array.from(ann.childNodes, (txt)=>{
//			console.debug('textAnnotation.childNode',txt);
			if( txt.tagName && txt.tagName.includes('text') && txt.innerHTML ) {
				if( txt.innerHTML.length>opts.descriptionLength )
					console.warn('Text of annotation '+id+' has been truncated because it is too long');
				model.resources.push({
					id: id,
					title: title,
					class: "RC-Note",
					properties: [{
						class: "PC-Description",
						value: txt.innerHTML.slice(0,opts.descriptionLength)
					}],
					changedAt: opts.fileDate
				});
				// memorize all text annotations to include them in the hierarchy:
				taL.push(id)
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
				title: "SpecIF:refersTo",
				class: "SC-refersTo",
				subject: su.id,
				object: ob.id,
				changedAt: opts.fileDate
			})
		else
			console.warn("Omitted association "+id+", because either the source or more probably the target is missing")
	});

	// 8. Add the 'diagram shows model-element' statements:
	model.resources.forEach( (r)=>{
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
	
	// 9. The hierarchy with pointers to all resources:
	function NodeList(res) {
		// 9.1 first add the folders:
		let nL =  [{
			id: genID("N-"),
			resource: "FolderProcesses-" + apx,
			nodes: [{
				id: genID("N-"),
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
			let idx = ["RC-Actor","RC-State","RC-Event"].indexOf( r['class'] );
			if( idx>-1 )
				nL[1].nodes[idx].nodes.push(nd)
		}); */
		// 9.3 Add text annotations to the model diagram:
		taL.forEach( (a)=>{ 
			nL[0].nodes[0].nodes.push({
				id: genID("N-"),
				resource: a,
				changedAt: opts.fileDate
			})
		});
		return nL;
	};
/*	// 10. Add the resource for the hierarchy root:
	model.resources.push({
		id: hId,
		title: model.title,
		description: model.description,
		class: "RC-Folder",
		changedAt: opts.fileDate
	}); */
	// Add the tree:
	model.hierarchies = NodeList(model.resources);
	
	console.debug('BPMN-XML',model);
	return model;
	
// =======================================
// called functions:	

	// The dataTypes should correspond to stdTypes.ts:
	function DataTypes() {
		return [{
		/*	id: "DT-Integer",
			title: "Integer",
			type: "xs:integer",
			minInclusive: -32768,
			maxInclusive: 32767,
			changedAt: "2016-05-26T08:59:00+02:00"
		},{ */
			id: "DT-ShortString",
			title: "String ["+opts.titleLength+"]",
			description: "String with length "+opts.titleLength,
			type: "xs:string",
			maxLength: opts.titleLength,
			changedAt: "2016-05-26T08:59:00+02:00"
		},{
			id: "DT-Text",
			title: "Text",
		//	title: "String ["+opts.descriptionLength+"]",
			type: "xs:string",
		//	maxLength: opts.descriptionLength,
			changedAt: "2016-05-26T08:59:00+02:00"
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
		/*	},{
				id: "PC-Notation",
				title: "SpecIF:Notation",
				dataType: "DT-ShortString",
				changedAt: "2016-05-26T08:59:00+02:00" */
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
			id: "RC-Diagram",
			title: "SpecIF:Diagram",
			description: "A 'Diagram' is a graphical model view with a specific communication purpose, e.g. a business process or system composition.",
			instantiation: ['user'],
			propertyClasses: ["PC-Description","PC-Diagram","PC-Type"],
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
			id: "RC-Note",
			title: "SpecIF:Note",
			description: "A 'Note' is additional information by the author referring to any resource.",
			propertyClasses: ["PC-Description"],
			changedAt: opts.fileDate
		},{
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
			changedAt: opts.fileDate
	/*	},{
			id: "RC-ProcessModel",
			title: "SpecIF:Hierarchy",
			description: "Root node of a process model (outline).",
			isHeading: true,
			instantiation: ['auto'],
			propertyClasses: ["PC-Description","PC-Type"],
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
			id: "FolderProcesses-" + apx,
		//	class: "RC-ProcessModel",
			class: "RC-Folder",
			title: opts.strBusinessProcessFolder,
			properties: [{
				class: "PC-Type",
				value: opts.strBusinessProcessesType
			}],
			changedAt: opts.fileDate
	/*	}, {
			id: "FolderGlossary-" + apx,
			class: "RC-Folder",
			title: opts.strGlossaryFolder,
			properties: [{
				class: "PC-Type",
				value: opts.strGlossaryType
			}],
			changedAt: opts.fileDate
		}, {
			id: "FolderAct-" + apx,
			class: "RC-Folder",
			title: opts.strActorFolder,
			changedAt: opts.fileDate
		}, {
			id: "FolderSta-" + apx,
			class: "RC-Folder",
			title: opts.strStateFolder,
			changedAt: opts.fileDate
		}, {
			id: "FolderEvt-" + apx,
			class: "RC-Folder",
			title: opts.strEventFolder,
			changedAt: opts.fileDate
		}, {
			id: "FolderNte-" + apx,
			class: "RC-Folder",
			title: opts.strAnnotationFolder,
			properties: [],
			changedAt: opts.fileDate */
		}]
	}
	
// =======================================
// some helper functions:	

	function itemBy( L, p, s ) {
		if( L && p && s ) {
			// Return the element in list 'L' whose property 'p' equals searchterm 's':
			for( var i=L.length-1;i>-1;i-- )
				if( L[i][p]==s ) return L[i]   // return list item
		}
	}
	function indexBy( L, p, s ) {
		if( L && p && s ) {
			// Return the index of an element in list 'L' whose property 'p' equals searchterm 's':
			// hand in property and searchTerm as string !
			for( var i=L.length-1;i>-1;i-- )
				if( L[i][p]==s ) return i
		};
		return -1
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
