/*!	SpecIF: Resource Edit.
	Dependencies: jQuery, bootstrap
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	Author: se@enso-managers.de, Berlin
	We appreciate any correction, comment or contribution!
*/

// Construct the resource editor:
moduleManager.construct({
	name: CONFIG.resourceEdit
}, (self:IModule)=>{
	"use strict";

	let myName = self.loadAs,
		myFullName = 'app.'+myName,
		pData = self.parent,	// the parent's data
		cData,					// the cached data
		opts,					// the processing options
		toEdit;					// the classified properties to edit
//	self.newRes;				// the resource to edit
	self.newFiles = [];			// collect uploaded files before committing the change
	self.dialogForm = new DialogForm();

	self.init = ():boolean =>{
//		console.debug('resourceEdit.init')
		self.clear();
		return true;
	};
	self.clear = ():void =>{
		self.newFiles.length = 0;
		self.dialogForm.list.length = 0;
	};

	// The choice of modal dialog buttons:
	let msgBtns = {
		cancel: {
			id: 'btn-modal-cancel',
			label: i18n.BtnCancel,
			action: (thisDlg)=>{ 
//				console.debug('action cancelled');
				thisDlg.close();
			}
		},
		update: { 	
			id: 'btn-modal-update',
			label: i18n.BtnUpdate,
			cssClass: 'btn-success btn-modal-save',
			action: (thisDlg)=>{
				save('update');
				thisDlg.close();
			}  
		},	
		insert: {
			id: 'btn-modal-insert',
			label: i18n.BtnInsert,
			cssClass: 'btn-success btn-modal-save', 
			action: (thisDlg)=>{
				save('insert');
				thisDlg.close();
			}  
		},	
		insertAfter: {
			id: 'btn-modal-insertAfter',
			label: i18n.BtnInsertSuccessor,
			cssClass: 'btn-success btn-modal-save', 
			action: (thisDlg)=>{
				save('insertAfter');
				thisDlg.close();
			}  
		},
		insertBelow: { 	
			id: 'btn-modal-insertBelow',
			label: i18n.BtnInsertChild,
			cssClass: 'btn-success btn-modal-save', 
			action: (thisDlg)=>{
				save('insertBelow');
				thisDlg.close();
			}  
		}
	};

	// The module entry;
	self.show = ( options )=>{

		self.clear();
		cData = app.cache.selectedProject.data;
		opts = simpleClone( options );
		if( pData.tree.selectedNode )
			opts.selNodeId = pData.tree.selectedNode.id;

//		console.debug('resourceEdit.show',opts);
		switch( opts.mode ) {
			case 'create':
				selectResClass( opts )
				.then(
					(rC:ResourceClass)=>{ 
						app.cache.selectedProject.createResource(rC)
						.then( 
							(r:Resource)=>{
//								console.debug( '#', opts.mode, r );
								self.newRes = r;
								opts.dialogTitle = i18n.MsgCreateResource+' ('+languageValueOf(rC.title)+')';
								if( opts.selNodeId )
									opts.msgBtns = [
										msgBtns.cancel,
										msgBtns.insertAfter,
										msgBtns.insertBelow
									]
								else
									opts.msgBtns = [
										msgBtns.cancel,
										msgBtns.insert
									];
								editResource(r,opts);
							}, 
							stdError
						);
					},
					stdError
				);
				break;
			case 'clone':
			case 'update':
//				console.debug('~',nd);
				// get the selected resource:
				app.cache.selectedProject.readContent( 'resource', pData.tree.selectedNode.ref )
				.then( 
					(rL:Resource[])=>{
						// create a clone to collect the changed values before committing:
						self.newRes = simpleClone(rL[0]);
						if( opts.mode=='clone' ) {
							self.newRes.id = genID('R-');
							opts.dialogTitle = i18n.MsgCloneResource,
							opts.msgBtns = [
								msgBtns.cancel,
								msgBtns.insertAfter,
								msgBtns.insertBelow
							]
						} else {
							opts.dialogTitle = i18n.MsgUpdateResource;
							opts.msgBtns = [
								msgBtns.cancel,
								msgBtns.update
							]
						}; 
						editResource(self.newRes,opts)
					},
					stdError
				);
		};
		return;
		
		function editResource(res,opts) {
			// Edit/update the resources properties:
//			console.debug( 'editResource', res, simpleClone(cData.resourceClasses) );
			// complete and sort the properties according to their role (title, descriptions, ..):
			toEdit = new CResourceWithClassifiedProps( res, cData );
			let ti = i18n.lookup(CONFIG.propClassTitle);
			// @ts-ignore - BootstrapDialog() is loaded at runtime
			new BootstrapDialog({
					title: opts.dialogTitle,
				//	type: 'type-success',
					type: 'type-primary',
					// @ts-ignore - BootstrapDialog() is loaded at runtime
					size: BootstrapDialog.SIZE_WIDE,
					// initialize the dialog;
					// set focus to first field, the title, and do a first check on the initial data (should be ok ;-)
					onshown: ()=>{ setTextFocus(ti); app[myName].check() },
				//	message: (thisDlg)=>{
					message: () => {
						var form = '<div style="max-height:'+($('#app').outerHeight(true)-190)+'px; overflow:auto" >';
						// field for the title property:
						form += editP(toEdit.title);
						// fields for the description properties: 
						toEdit.descriptions.forEach( (d)=>{
							form += editP(d);
						});
						// fields for the remaining properties:
						toEdit.other.forEach( (p)=>{
							form += editP(p);
						});
						form += '</div>';
						return $( form );
					},
					buttons: opts.msgBtns
				})
				.open();
			return;
			
			function editP(p) {
				// Return a form element for a property;
				// works only, if all propertyClasses and dataTypes are always cached:
				let pC = itemById( cData.propertyClasses, p['class'] ),
					// title and description may not have a propertyClass (e.g. Tutorial 2 "Related terms"):
					dT = pC? itemById( cData.dataTypes, pC.dataType ) : undefined,
					opts = {
						lookupTitles: true,
						targetLanguage: browser.language,
						imgClass: 'forImagePreview'
					},
					ti = titleOf(p,opts);
				// create an input field depending on the property's dataType;
				// again, the dataType may be missing, the type is assumed to be "xs:string" by default:
				switch( dT? dT.type : "xs:string" ) {
					case 'xs:string':
					case 'xhtml':
						if( propTitleOf(p,cData)==CONFIG.propClassDiagram ) {
							// it is a diagram reference (works only with XHTML-fields):
							return renderDiagram(p,opts)
						} else {
							// add parameters to check this input field:
							self.dialogForm.addField( ti, dT );
							// it is a text;
							// in case of xhtml, it may contain a diagram reference, 
							// as there is no obligation to provide a separate property belonging to CONFIG.diagramClasses:
//							console.debug( 'editP', languageValueOf(p.value,opts) );
							return textField( 
								ti, 
								languageValueOf(p.value,opts), 
								// - open an input line, if it is a title or has a specified length lower than the threshold
								// - open an input text-area, otherwise
								( (dT&&dT.maxLength&&dT.maxLength<CONFIG.textThreshold+1)
									|| CONFIG.titleProperties.indexOf(ti)>-1 )? 'line' : 'area', 
								myFullName+'.check()' 
							);
						};
					case 'xs:enumeration':
						// no input checking needed:
						let separatedValues = p.value.split(','),
							vals = forAll( dT.values, (v)=>{ return {title:i18n.lookup(languageValueOf(v.value,opts)),id:v.id,checked:separatedValues.indexOf(v.id)>-1} });
//						console.debug('xs:enumeration',ti,p,pC,separatedValues,vals);
						if( typeof(pC.multiple)=='boolean'? pC.multiple : dT.multiple ) {
							return checkboxField( ti, vals );
						} else {
							return radioField( ti, vals );
						};
					case 'xs:boolean':
						// no input checking needed:
//						console.debug('xs:boolean',ti,p,pC);
						return booleanField( ti, p.value=='true' );
					case 'xs:dateTime':
					case 'xs:integer':
					case 'xs:double':
						// add parameters to check this input field:
						self.dialogForm.addField( ti, dT );
						return textField( ti, p.value, 'line', myFullName+'.check()' );
				};
				return

				function renderDiagram(p,opts) {
//					console.debug('renderDiagram',p);
					return '<div class="form-group form-active" >'
						+ 		'<div class="attribute-label" >'+titleOf(p,opts)+'</div>'
						+ 		'<div class="attribute-value">'
						+			diagBtns(p)
									// Add a container based on the propertyClass (which should be unique and since there is usually no property-id), 
									// so that the user can update and delete the diagram later on:
						+			'<div id="'+tagId(p['class'])+'">'+fileRef.toGUI( p.value, opts )+'</div>'
						+		'</div>'
						+ '</div>';
					
					function diagBtns(p) {
						// p['class'] is used to identify the property; 
						// it is supposed to be unique in the resource's properties
						// and at most one resource is edited in this session at any point in time.
						var bts = 	'<div class="btn-group btn-group-sm pull-right" >';
						if( !p.permissions || p.permissions.upd ) {
							bts +=			'<span class="btn btn-default btn-fileinput">' +
												'<span>'+i18n.IcoUpdate+'</span>' +
								'<input id="file' + simpleHash(p['class'])+'" type="file" onchange="'+myFullName+'.updateDiagram(\''+p['class']+'\')" />' + 
											'</span>';
						};  
						if( !p.permissions || p.permissions.del ) {
							bts +=			'<button class="btn btn-danger" data-toggle="popover" '
								+ 'onclick="'+myFullName+'.removeDiagram(\''+p['class']+'\')" title="'+i18n.LblDelete+'">'+i18n.IcoDelete+'</button>';
						};
						bts +=			'</div>';
						return bts;
					}
				}
			}
		}
		function selectResClass( opts ) {		
			// Let the user choose the class of the resource to be created later on:
			return new Promise((resolve, reject) => {
				app.cache.selectedProject.readContent( 'resourceClass', forAll( opts.eligibleResourceClasses, (rCId)=>{return {id:rCId}} ))
				.then( 
					(rCL)=>{
						if( rCL.length>0 ) {
							// store a clone and get the title to display:
							let resClasses = forAll( simpleClone( rCL ), (rC)=>{ rC.title=titleOf(rC,{lookupTitles:true}); return rC } );
							if( resClasses.length>1 ) {
								// open a modal dialog to let the user select the class for the resource to create:
								resClasses[0].checked = true;  // default selection
//								console.debug('#2',simpleClone(cData.resourceClasses));
								// @ts-ignore - BootstrapDialog() is loaded at runtime
								new BootstrapDialog({
									title: i18n.MsgSelectResClass,
								//	type: 'type-success',
									type: 'type-primary',
								//	size: BootstrapDialog.SIZE_WIDE,
								//	message: (thisDlg)=>{
									message: () => {
										var form = '<form id="attrInput" role="form" >'
												+ radioField( i18n.LblResourceClass, resClasses )
												+ '</form>';
										return $( form );
									},
									buttons: [{
											label: i18n.BtnCancel,
											action: (thisDlg)=>{ 
												reject({status:0,statusText:'Create Resource cancelled by the user'});
												thisDlg.close();
											}
										},{ 	
											label: i18n.LblNextStep,
											cssClass: 'btn-success', 
											action: (thisDlg)=>{
												resolve( itemById( resClasses, radioValue( i18n.LblResourceClass )));
												thisDlg.close();
											}  
										}]
								})
								.open();
							} else {
								// exactly on class, so we can continue immediately:
								resolve( resClasses[0] );
							};
						} else {
							// ToDo: Don't enable the 'create resource' button, if there are no eligible resourceClasses ..
							reject({status:999,statusText:"No resource class defined for manual creation of a resource."});
						};
					},
					reject
				);
			});
		}
	};
	self.hide = ()=>{
	};

/* ++++++++++++++++++++++++++++++++
	Functions called by GUI events 
*/
	self.updateDiagram = (cId)=>{
		// @ts-ignore - .files is in fact accessible
		let f = document.getElementById("file" + simpleHash(cId)).files[0];
//		console.debug('updateDiagram',cId,f.name);
		readFile( f, (data)=>{
				// "<div><p class=\"inline-label\">Plan:</p><p><object type=\"image/svg+xml\" data=\"files_and_images\\50f2e49a0029b1a8016ea6a5f78ff594.svg\">Arbeitsumgebung</object></p></div>"
				let fType = f.type||opts.mediaTypeOf(f.name),
					fName = 'files_and_images/'+f.name,
					newFile = { blob: data, id: 'F-' + simpleHash(fName), title:fName, type: fType, changedAt: new Date( f.lastModified || f.lastModifiedDate ).toISOString() };
				itemBy(toEdit.descriptions.concat(toEdit.other), 'class', cId ).value = '<object data="'+fName+'" type="'+fType+'">'+fName+'</object>';
				self.newFiles.push( newFile );
				document.getElementById(tagId(cId)).innerHTML = '<div class="forImagePreview '+tagId(fName)+'">'+fileRef.renderImage( newFile )+'</div>';
		});
		return;
		
		function readFile( f, fn ) {
			const rdr = new FileReader();
			rdr.onload = ()=>{
				fn( new Blob([rdr.result], { type: f.type }) );
			};
			rdr.readAsArrayBuffer( f );
		}
	};
	self.removeDiagram = (cId)=>{
//		console.debug('removeDiagram',cId,toEdit);
		itemBy(toEdit.descriptions.concat(toEdit.other), 'class', cId ).value = '';
		document.getElementById(tagId(cId)).innerHTML = ''
	};
	self.check = ()=>{
		// called on every key-input;
		// check all input fields:
		let notOk = !self.dialogForm.check();
		// enable save buttons, if all input fields have acceptable content:
		Array.from( document.getElementsByClassName('btn-modal-save'), (btn)=>{
			btn.disabled = notOk;
		})
	//	console.debug('input made',document.getElementsByClassName('btn-modal-save'));
	};

	function save(mode) {
		// Save the new or changed resource;
		// 'self.newRes' is updated with the input data and then stored; 
		// it replaces the resource with same id.
		// It may happen that an existing resource and thus 'self.newRes' does not have 
		// a 'properties' list yet, even though it's class defines propertyClasses.
		// ToDo: If the original resource had different languages, take care of them;
		//       The new values must not replace any original multi-language property values!
		let pend=2, // minimally 2 calls with promise
			// The properties of toEdit are complete (in contrast to self.newRes):
			chD = new Date().toISOString();  // changedAt

		if( Array.isArray(self.newRes.properties) )
			self.newRes.properties.length = 0;

		toEdit.title.value = getP( toEdit.title );
		// In any case, update the elements native title:
		self.newRes.title = stripHTML(toEdit.title.value);
		// If the title property doesn't have a class, 
		// it has been added by new CResourceWithClassifiedProps() and there is no need to create it;
		// in this case the title will only be seen in the element's title:
		if( toEdit.title['class'] ) {
			delete toEdit.title.title;  // is redundant, the property's class title applies
			if( Array.isArray( self.newRes.properties ) )
				self.newRes.properties.push( toEdit.title );
			else
				self.newRes.properties = [ toEdit.title ];
		};

		toEdit.descriptions.forEach( function(p) {

			// In case of a diagram, the value is already updated when the user uploads a new file:
			if( CONFIG.diagramClasses.indexOf(propTitleOf(p,cData))>-1 ) {
				if( Array.isArray( self.newRes.properties ) )
					self.newRes.properties.push( p );
				else
					self.newRes.properties = [ p ];
				return;
			};

			// get the new or unchanged input value of the property from the input field:
			p.value = getP( p );
			delete p.title;

			let pV = stripHTML(p.value);
			if( pV ) {
				// update the elements native description:
				self.newRes.description = pV

				// If the description property doesn't have a class, 
				// it has been added by new CResourceWithClassifiedProps() and there is no need to create it;
				// in this case the description will only be seen in the element's description:
				if( p['class'] ) {
					if( Array.isArray( self.newRes.properties ) )
						self.newRes.properties.push( p );
					else
						self.newRes.properties = [ p ];
				};
			} else {
				// delete it:
				delete self.newRes.description;
			};
//			console.debug( 'save',mode, p, getP( p ) );
		});

		toEdit.other.forEach( function(p) {
			// get the new or unchanged input value of the property from the input field:
			p.value = getP( p );
			delete p.title;
			// a property class must exist, 
			// because new CResourceWithClassifiedProps() puts only existing properties to 'other':
			if( p['class'] ) {
				if( hasContent(p.value) ) {
					if( Array.isArray( self.newRes.properties ) )
						self.newRes.properties.push( p );
					else
						self.newRes.properties = [ p ];
				};
			} else {
					console.error('Cannot save edited property',p,' because it has no class');
			};
		});

		self.newRes.changedAt = chD;
//		console.debug( 'save', self.newRes );

		switch( mode ) {
			case 'update':
				app.cache.selectedProject.updateContent( 'resource', self.newRes )
					.then( finalize, stdError );
				break;
			case 'insert':
				app.cache.selectedProject.createContent( 'resource', self.newRes )
					.then( finalize, stdError );
				pend++;
				app.cache.selectedProject.createContent( 'node', {id:genID('N-'),resource:self.newRes.id,changedAt:chD} )
					.then( finalize, stdError );
				break;
			case 'insertAfter':
				app.cache.selectedProject.createContent( 'resource', self.newRes )
					.then( finalize, stdError );
				pend++;
				app.cache.selectedProject.createContent( 'node', {id:genID('N-'),resource:self.newRes.id,changedAt:chD,predecessor:opts.selNodeId} )
					.then( finalize, stdError );
				break;
			case 'insertBelow':
				app.cache.selectedProject.createContent( 'resource', self.newRes )
					.then( finalize, stdError );
				pend++;
				app.cache.selectedProject.createContent( 'node', {id:genID('N-'),resource:self.newRes.id,changedAt:chD,parent:opts.selNodeId} )
					.then( finalize, stdError );
		};
		// has no effect, if newFiles is empty:
		app.cache.selectedProject.createContent( 'file', self.newFiles )
			.then( finalize, stdError );
		return;
			
		function finalize() {	
			if(--pend<1) {
				// update the tree because the title may have changed:
				pData.updateTree({
					lookupTitles: true,
					targetLanguage: browser.language
				});
				// get the selected node:
				let selNd = pData.tree.selectedNode;
//				console.debug('save.finalize',selNd);
				// update the node name:
			//	pData.tree.updateNode( selNd, self.newRes.title );
				if( selNd ) {
					switch( mode ) {
				/*		case 'update':
							break; */
						case 'insertBelow':
//							console.debug('nd below',selNd,pData.tree.selectedNode)
							pData.tree.openNode( selNd );
						//	pData.tree.selectNode( selNd.getNextNode() )   // go to next visible tree node
							// no break
						case 'insertAfter':
//							console.debug('nd after',selNd,pData.tree.selectedNode)
						//	pData.tree.selectNode( selNd.getNextSibling() ); 
							pData.tree.selectNode( selNd.getNextNode() );
					};
				} else {
					// we get here only after creating the first node of a tree:
					pData.tree.selectFirstNode();
				};
				pData.doRefresh({forced:true});
			};
		}
		function getP(p) {
			// Get the value of a property:
			// ToDo: Works only, if all propertyClasses are always cached:
			const opts = {
				lookupTitles: true,
				targetLanguage: browser.language
			};
			let pC = itemById( cData.propertyClasses, p['class'] ),
				// title and description may not have a propertyClass (e.g. Tutorial 2 "Related terms"):
				dT = pC? itemById( cData.dataTypes, pC.dataType ) : undefined;
			switch( dT? dT.type : "xs:string" ) {
				case 'xs:integer':
				case 'xs:double':
				case 'xs:dateTime':
				case 'xs:string':
				case 'xhtml':
					// The diagrams are skipped in the calling layer above.
//					console.debug( 'getP',p,textValue( titleOf(p,opts) ) );
					return textValue( titleOf(p,opts) );
				case 'xs:enumeration':
//					console.debug('xs:enumeration',p,pC,separatedValues,vals);
					if( typeof(pC.multiple)=='boolean'? pC.multiple : dT.multiple ) {
//						console.debug( '*',p,checkboxValues( titleOf(p,opts) ).toString() );
						return checkboxValues( titleOf(p,opts) ).toString();
					} else {
//						console.debug( '*',p,radioValue( titleOf(p,opts) ) );
						return radioValue( titleOf(p,opts) );
					};
				case 'xs:boolean':
					return booleanValue( titleOf(p,opts) ).toString();
			}
		}
	};
	return self;
})
