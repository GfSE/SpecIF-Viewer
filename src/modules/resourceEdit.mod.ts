/*!	SpecIF: Resource Edit.
	Dependencies: jQuery, bootstrap
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	Author: se@enso-managers.de, Berlin
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/

interface IDialogField {
	label: string;
	dataType: SpecifDataType;
}
class DialogForm {
	// Construct an object performing the key-by-key input checking on an input form;
	// on a key-stroke check *all* fields and return the overall result.

	list: IDialogField[];  // the list of parameter-sets, each for checking a certain input field.
	constructor() {
		this.list = [] as IDialogField[];
	}
	addField(elementId: string, dT: SpecifDataType): void {
		// Add a parameter-set for checking an input field;
		// - 'elementId' is the id of the HTML input element
		// - 'dataType' is the dataType of the property
		this.list.push({ label: elementId, dataType: dT });
	};
	check(): boolean {
		// Perform tests on all registered input fields; is designed to be called on every key-stroke.
		let val: string, ok: boolean, allOk = true;
		this.list.forEach((cPs) => {
			// cPs holds the parameters for checking a single property resp. input field.
			// Get the input value:
			val = textValue(cPs.label);
			// Perform the test depending on the type:
			switch (cPs.dataType.type) {
				case SpecifDataTypeEnum.String:
			//	case 'xhtml':
					ok = cPs.dataType.maxLength == undefined || val.length <= cPs.dataType.maxLength;
					break;
				case SpecifDataTypeEnum.Double:
					ok = val.length < 1
						|| RE.Real(cPs.dataType.fractionDigits).test(val)
						&& !(typeof (cPs.dataType.minInclusive) == 'number' && parseFloat(val) < cPs.dataType.minInclusive)
						&& !(typeof (cPs.dataType.maxInclusive) == 'number' && parseFloat(val) > cPs.dataType.maxInclusive);
					break;
				case SpecifDataTypeEnum.Integer:
					ok = val.length < 1
						|| RE.Integer.test(val)
						&& !(typeof (cPs.dataType.minInclusive) == 'number' && parseFloat(val) < cPs.dataType.minInclusive)
						&& !(typeof (cPs.dataType.maxInclusive) == 'number' && parseFloat(val) > cPs.dataType.maxInclusive);
					break;
				case SpecifDataTypeEnum.DateTime:
					ok = val.length < 1 || RE.IsoDate.test(val);
				// no need to check enumeration
			};
			setTextState(cPs.label, ok ? 'has-success' : 'has-error');
			allOk = allOk && ok;
//			console.debug( 'DialogForm.check: ', cPs, val );
		});
		return allOk;
	}
}
// Construct the resource editor:
moduleManager.construct({
	name: CONFIG.resourceEdit
}, (self: IModule) =>{
	"use strict";

	let myName = self.loadAs,
		myFullName = 'app.'+myName,
		pData:CCache,			// the cached data
		opts:any,				// the processing options
		toEdit:CResourceToShow;	// the resource with classified properties to edit

	self.newFiles = [];			// collect uploaded files before committing the change
	self.dialogForm = new DialogForm();

	self.init = ():boolean =>{
//		console.debug('resourceEdit.init')
		self.clear();
		return true;
	};
	self.clear = ():void =>{
		self.newFiles.length = 0;
		self.dialogForm = new DialogForm();
	};

	// The choice of modal dialog buttons:
	let msgBtns = {
		cancel: {
			id: 'btn-modal-cancel',
			label: i18n.BtnCancel,
			action: (thisDlg:any)=>{ 
//				console.debug('action cancelled');
				thisDlg.close();
			}
		},
		update: { 	
			id: 'btn-modal-update',
			label: i18n.BtnUpdateObject,
			cssClass: 'btn-success btn-modal-save',
			action: (thisDlg:any)=>{
				save('update');
				thisDlg.close();
			}  
		},	
		insert: {
			id: 'btn-modal-insert',
			label: i18n.BtnInsert,
			cssClass: 'btn-success btn-modal-save', 
			action: (thisDlg: any)=>{
				save('insert');
				thisDlg.close();
			}  
		},	
		insertAfter: {
			id: 'btn-modal-insertAfter',
			label: i18n.BtnInsertSuccessor,
			cssClass: 'btn-success btn-modal-save', 
			action: (thisDlg: any)=>{
				save('insertAfter');
				thisDlg.close();
			}  
		},
		insertBelow: { 	
			id: 'btn-modal-insertBelow',
			label: i18n.BtnInsertChild,
			cssClass: 'btn-success btn-modal-save', 
			action: (thisDlg: any)=>{
				save('insertBelow');
				thisDlg.close();
			}  
		}
	};

	// The module entry;
	self.show = ( options:any )=>{

		self.clear();
		pData = app.cache.selectedProject.data;
		opts = simpleClone( options );
		if( self.parent.tree.selectedNode )
			opts.selNodeId = self.parent.tree.selectedNode.id;

//		console.debug('resourceEdit.show',opts);
		switch( opts.mode ) {
			case 'create':
				selectResClass( opts )
				.then(
					(rC:SpecifResourceClass)=>{ 
						app.cache.selectedProject.createResource(rC)
						.then( 
							(r:SpecifResource)=>{
//								console.debug( '#', opts.mode, r );
								self.newRes = r;
								opts.dialogTitle = i18n.MsgCreateResource+' ('+LIB.languageValueOf(rC.title)+')';
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
							LIB.stdError
						);
					},
					LIB.stdError
				);
				break;
			case 'clone':
			case 'update':
//				console.debug('~',nd);
				// get the selected resource:
				app.cache.selectedProject.readContent( 'resource', self.parent.tree.selectedNode.ref )
				.then( 
					(rL:SpecifResource[])=>{
						// create a clone to collect the changed values before committing:
						self.newRes = simpleClone(rL[0]);
						if( opts.mode=='clone' ) {
							self.newRes.id = LIB.genID('R-');
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
					LIB.stdError
				);
		};
		return;
		
		function editResource(res,opts) {
			// Edit/update the resources properties:
//			console.debug( 'editResource', res, simpleClone(pData.resourceClasses) );
			// complete and sort the properties according to their role (title, descriptions, ..):
			toEdit = new CResourceToShow( res );
			let ti = i18n.lookup(CONFIG.propClassTitle);
			// @ts-ignore - BootstrapDialog() is loaded at runtime
			new BootstrapDialog({
					title: opts.dialogTitle,
					type: 'type-primary',
					// @ts-ignore - BootstrapDialog() is loaded at runtime
					size: BootstrapDialog.SIZE_WIDE,
					// initialize the dialog;
					// set focus to first field, the title, and do a first check on the initial data (should be ok ;-)
					onshown: ()=>{ setFocus(ti); app[myName].check() },
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
				// works only if the classes are cached:
				let pC = pData.get("propertyClass", p['class'])[0],
			// The result is delivered by promise ..:
			//	let pC = app.cache.selectedProject.readContent("propertyClass", p['class']),

					// title and description may not have a propertyClass (e.g. Tutorial 2 "Related terms"):
					dT = pC? pData.get("dataType", pC.dataType )[0] : undefined,
					opts = {
						lookupTitles: true,
						targetLanguage: browser.language,
						imgClass: 'forImagePreview'
					},
					ti = LIB.titleOf(p,opts);
				// create an input field depending on the property's dataType;
				// again, the dataType may be missing, the type is assumed to be "xs:string" by default:
				switch (dT ? dT.type : "xs:string") {
					case 'xs:string':
					case 'xhtml':
						if (LIB.propTitleOf(p, pData) == CONFIG.propClassDiagram) {
							// it is a diagram reference (works only with XHTML-fields):
							return renderDiagram(p, opts)
						}
						else {
							// add parameters to check this input field:
							self.dialogForm.addField(ti, dT);
							// it is a text;
							// in case of xhtml, it may contain a diagram reference, 
							// as there is no obligation to provide a separate property belonging to CONFIG.diagramClasses:
//							console.debug( 'editP', LIB.languageValueOf(p.value,opts) );
							return textField(
								ti,
								LIB.languageValueOf(p.value, opts),
								// - open an input line, if it is a title or has a specified length lower than the threshold
								// - open an input text-area, otherwise
								{
									typ: ((dT && dT.maxLength && dT.maxLength < CONFIG.textThreshold + 1) || CONFIG.titleProperties.indexOf(ti) > -1) ? 'line' : 'area',
									handle: myFullName + '.check()',
									description: pC.description
								} 
							);
						};
					case 'xs:enumeration':
						// no input checking needed:
						let separatedValues = p.value.split(','),
							vals = LIB.forAll( dT.values, (v)=>{ return {title:i18n.lookup(LIB.languageValueOf(v.value,opts)),id:v.id,checked:separatedValues.indexOf(v.id)>-1} });
//						console.debug('xs:enumeration',ti,p,pC,separatedValues,vals);
						if( typeof(pC.multiple)=='boolean'? pC.multiple : dT.multiple )
							return checkboxField(ti, vals, { description: pC.description } );
						else
							return radioField(ti, vals, { description: pC.description } );
					case 'xs:boolean':
						// no input checking needed:
//						console.debug('xs:boolean',ti,p,pC);
						return booleanField(ti, LIB.isTrue(p.value), { description: pC.description } );
					case 'xs:dateTime':
					case 'xs:integer':
					case 'xs:double':
						// add parameters to check this input field:
						self.dialogForm.addField( ti, dT );
						return textField(
							ti,
							p.value,
							{ typ: 'line', handle: myFullName + '.check()', description: pC.description });
				};
				return

				function renderDiagram(p,opts) {
//					console.debug('renderDiagram',p);
					return '<div class="form-group form-active" >'
						+ 		'<div class="attribute-label" >'+LIB.titleOf(p,opts)+'</div>'
						+ 		'<div class="attribute-value">'
						+			diagBtns(p)
									// Add a container based on the propertyClass (which should be unique and since there is usually no property-id), 
									// so that the user can update and delete the diagram later on:
						+			'<div id="'+tagId(p['class'])+'">'+p.renderFile( p.value, opts )+'</div>'
						+		'</div>'
						+ '</div>';
					
					function diagBtns(p) {
						// p['class'] is used to identify the property; 
						// it is supposed to be unique in the resource's properties
						// and at most one resource is edited in this session at any point in time.
						var bts = 	'<div class="btn-group btn-group-sm pull-right" >';
						if( !p.permissions || p.permissions.upd ) {
							bts +=			'<span class="btn btn-default btn-fileinput">' +
												'<span>'+i18n.IcoEdit+'</span>' +
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
				app.cache.selectedProject.readContent( 'resourceClass', LIB.forAll( opts.eligibleResourceClasses, (rCId)=>{return {id:rCId}} ))
				.then( 
					(rCL)=>{
						if( rCL.length>0 ) {
							// store a clone and get the title to display:
							let resClasses = LIB.forAll( simpleClone( rCL ), (rC)=>{ rC.title=LIB.titleOf(rC,{lookupTitles:true}); return rC } );
							if( resClasses.length>1 ) {
								// open a modal dialog to let the user select the class for the resource to create:
								resClasses[0].checked = true;  // default selection
//								console.debug('#2',simpleClone(pData.resourceClasses));
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
											action: (thisDlg: any)=>{
												reject({status:0,statusText:'Create Resource cancelled by the user'});
												thisDlg.close();
											}
										},{ 	
											label: i18n.LblNextStep,
											cssClass: 'btn-success', 
											action: (thisDlg: any)=>{
												resolve( LIB.itemById( resClasses, radioValue( i18n.LblResourceClass )));
												thisDlg.close();
											}  
										}]
								})
								.open();
							}
							else {
								// exactly on class, so we can continue immediately:
								resolve( resClasses[0] );
							};
						}
						else {
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
					newFile = new CFileWithContent({ blob: data, id: 'F-' + simpleHash(fName), title:fName, type: fType, changedAt: new Date( f.lastModified ).toISOString() });
				LIB.itemBy(toEdit.descriptions.concat(toEdit.other), 'class', cId ).value = '<object data="'+fName+'" type="'+fType+'">'+fName+'</object>';
				self.newFiles.push( newFile );
			document.getElementById(tagId(cId)).innerHTML = '<div class="forImagePreview ' + tagId(fName) + '">' + newFile.renderImage()+'</div>';
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
		LIB.itemBy(toEdit.descriptions.concat(toEdit.other), 'class', cId ).value = '';
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
		self.newRes.title = toEdit.title.value.stripHTML();
		// If the title property doesn't have a class, 
		// it has been added by new CResourceToShow() and there is no need to create it;
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
			if( CONFIG.diagramClasses.indexOf(LIB.propTitleOf(p,pData))>-1 ) {
				if( Array.isArray( self.newRes.properties ) )
					self.newRes.properties.push( p );
				else
					self.newRes.properties = [ p ];
				return;
			};

			// get the new or unchanged input value of the property from the input field:
			p.value = getP( p );
			delete p.title;

			let pV = p.value.stripHTML();
			if( pV ) {
				// update the elements native description:
				self.newRes.description = pV

				// If the description property doesn't have a class, 
				// it has been added by new CResourceToShow() and there is no need to create it;
				// in this case the description will only be seen in the element's description:
				if( p['class'] ) {
					if( Array.isArray( self.newRes.properties ) )
						self.newRes.properties.push( p );
					else
						self.newRes.properties = [ p ];
				};
			}
			else {
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
			// because new CResourceToShow() puts only existing properties to 'other':
			if( p['class'] ) {
				if( LIB.hasContent(p.value) ) {
					if( Array.isArray( self.newRes.properties ) )
						self.newRes.properties.push( p );
					else
						self.newRes.properties = [ p ];
				};
			}
			else {
					console.error('Cannot save edited property',p,' because it has no class');
			};
		});

		self.newRes.changedAt = chD;
//		console.debug( 'save', self.newRes );

		app.cache.selectedProject.updateContent('resource', self.newRes)
			.then(finalize, LIB.stdError);
		switch( mode ) {
		//	case 'update':
		//		break;
			case 'insert':
				pend++;
				app.cache.selectedProject.createContent( 'node', {id:LIB.genID('N-'),resource:LIB.keyOf(self.newRes),changedAt:chD} )
					.then( finalize, LIB.stdError );
				break;
			case 'insertAfter':
				pend++;
				app.cache.selectedProject.createContent('node', { id: LIB.genID('N-'), resource: LIB.keyOf(self.newRes),changedAt:chD,predecessor:opts.selNodeId} )
					.then( finalize, LIB.stdError );
				break;
			case 'insertBelow':
				pend++;
				app.cache.selectedProject.createContent('node', { id: LIB.genID('N-'), resource: LIB.keyOf(self.newRes),changedAt:chD,parent:opts.selNodeId} )
					.then( finalize, LIB.stdError );
		};
		// has no effect, if newFiles is empty:
		app.cache.selectedProject.createContent( 'file', self.newFiles )
			.then( finalize, LIB.stdError );
		return;
			
		function finalize() {	
			if(--pend<1) {
				// update the tree because the title may have changed:
				self.parent.updateTree({
					lookupTitles: true,
					targetLanguage: browser.language
				});
				// get the selected node:
				let selNd = self.parent.tree.selectedNode;
//				console.debug('save.finalize',selNd);
				// update the node name:
			//	self.parent.tree.updateNode( selNd, self.newRes.title );
				if( selNd ) {
					switch( mode ) {
				/*		case 'update':
							break; */
						case 'insertBelow':
//							console.debug('nd below',selNd,self.parent.tree.selectedNode)
							self.parent.tree.openNode();
						//	self.parent.tree.selectNode( selNd.getNextNode() )   // go to next visible tree node
							// no break
						case 'insertAfter':
//							console.debug('nd after',selNd,self.parent.tree.selectedNode)
						//	self.parent.tree.selectNode( selNd.getNextSibling() ); 
							self.parent.tree.selectNode( selNd.getNextNode() );
					};
				} else {
					// we get here only after creating the first node of a tree:
					self.parent.tree.selectFirstNode();
				};
				self.parent.doRefresh({forced:true});
			};
		}
		function getP(p) {
			// Get the value of a property:
			// ToDo: Works only, if all propertyClasses are always cached:
			const opts = {
				lookupTitles: true,
				targetLanguage: browser.language
			};
			let pC = pData.get("propertyClass", p['class'] )[0],
				// title and description may not have a propertyClass (e.g. Tutorial 2 "Related terms"):
				dT = pC? pData.get("dataType", pC.dataType )[0] : undefined;
			switch( dT? dT.type : "xs:string" ) {
				case 'xs:integer':
				case 'xs:double':
				case 'xs:dateTime':
				case 'xs:string':
				case 'xhtml':
					// The diagrams are skipped in the calling layer above.
//					console.debug( 'getP',p,textValue( LIB.titleOf(p,opts) ) );
					return textValue( LIB.titleOf(p,opts) );
				case 'xs:enumeration':
//					console.debug('xs:enumeration',p,pC,separatedValues,vals);
					if( typeof(pC.multiple)=='boolean'? pC.multiple : dT.multiple ) {
//						console.debug( '*',p,checkboxValues( LIB.titleOf(p,opts) ).toString() );
						return checkboxValues( LIB.titleOf(p,opts) ).toString();
					} else {
//						console.debug( '*',p,radioValue( LIB.titleOf(p,opts) ) );
						return radioValue( LIB.titleOf(p,opts) );
					};
				case 'xs:boolean':
					return booleanValue( LIB.titleOf(p,opts) ).toString();
			}
		}
	};
	return self;
})
