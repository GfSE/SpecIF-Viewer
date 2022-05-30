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
}, (self: IModule) => {
	"use strict";

	let myName = self.loadAs,
		myFullName = 'app.' + myName,
	//	pData: CCache,			// the cached data
		opts: any,				// the processing options
		toEdit: CResourceToShow;	// the resource with classified properties to edit

	self.newFiles = [];			// collect uploaded files before committing the change
	self.dialogForm = new DialogForm();

	self.init = (): boolean => {
//		console.debug('resourceEdit.init')
		self.clear();
		return true;
	};
	self.clear = (): void => {
		self.newFiles.length = 0;
		self.dialogForm = new DialogForm();
	};

	// The choice of modal dialog buttons:
	let msgBtns = {
		cancel: {
			id: 'btn-modal-cancel',
			label: i18n.BtnCancel,
			action: (thisDlg: any) => {
//				console.debug('action cancelled');
				thisDlg.close();
			}
		},
		update: {
			id: 'btn-modal-update',
			label: i18n.BtnUpdateObject,
			cssClass: 'btn-success btn-modal-save',
			action: (thisDlg: any) => {
				save('update');
				thisDlg.close();
			}
		},
		insert: {
			id: 'btn-modal-insert',
			label: i18n.BtnInsert,
			cssClass: 'btn-success btn-modal-save',
			action: (thisDlg: any) => {
				save('insert');
				thisDlg.close();
			}
		},
		insertAfter: {
			id: 'btn-modal-insertAfter',
			label: i18n.BtnInsertSuccessor,
			cssClass: 'btn-success btn-modal-save',
			action: (thisDlg: any) => {
				save('insertAfter');
				thisDlg.close();
			}
		},
		insertBelow: {
			id: 'btn-modal-insertBelow',
			label: i18n.BtnInsertChild,
			cssClass: 'btn-success btn-modal-save',
			action: (thisDlg: any) => {
				save('insertBelow');
				thisDlg.close();
			}
		}
	};

	// The module entry;
	self.show = (options: any) => {

		self.clear();
	//	pData = app.cache.selectedProject.data;
		opts = simpleClone(options);
		if (self.parent.tree.selectedNode)
			opts.selNodeId = self.parent.tree.selectedNode.id;

//		console.debug('resourceEdit.show',opts);
		switch (opts.mode) {
			case 'create':
				selectResClass(opts)
				.then(
					(rC:SpecifResourceClass)=>{ 
						app.cache.selectedProject.createResource(rC)
						.then( 
							(r:SpecifResource)=>{
//								console.debug( '#', opts.mode, r );
								self.newRes = r;
								opts.dialogTitle = i18n.MsgCreateResource+' ('+rC.title+')';
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
			/*	.then(
					(rC: SpecifResourceClass) => {
						return app.cache.selectedProject.createResource(rC)
				})
				.then(
					(r: SpecifResource) => {
//						console.debug( '#', opts.mode, r );
						self.newRes = r;
						opts.dialogTitle = i18n.MsgCreateResource + ' (' + LIB.languageValueOf(rC.title) + ')';
						if (opts.selNodeId)
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
						editResource(r, opts);
				})
				.catch ( LIB.stdError ); */
				break;
			case 'clone':
			case 'update':
//				console.debug('~',nd);
				// get the selected resource:
				app.cache.selectedProject.readItems('resource', [self.parent.tree.selectedNode.ref], { showEmptyProperties: true } )
				.then( 
					(rL:SpecifItem[])=>{
						// create a clone to collect the changed values before committing:
						self.newRes = rL[0];
						if( opts.mode=='clone' ) {
							self.newRes.id = LIB.genID('R-');
							opts.dialogTitle = i18n.MsgCloneResource,
							opts.msgBtns = [
								msgBtns.cancel,
								msgBtns.insertAfter,
								msgBtns.insertBelow
							]
						}
						else {
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

		function editResource(res: SpecifResource, opts:any):void {
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
						// @ts-ignore - object $('#app') is only theoretically undefined ...
						var form = '<div style="max-height:'+($('#app').outerHeight(true)-190)+'px; overflow:auto" >';
						// field for the title property:
						form += editPrp(toEdit.title);
						// fields for the description properties: 
						toEdit.descriptions.forEach(
							(d) => { form += editPrp(d); }
						);
						// fields for the remaining properties:
						toEdit.other.forEach(
							(p) => { form += editPrp(p); }
						);
						form += '</div>';
						return $( form );
					},
					buttons: opts.msgBtns
				})
				.open();
			return;

			function editPrp(p: CPropertyToShow):string {
				// Return a form element for a property;

				let opts = {
						lookupTitles: true,
						targetLanguage: browser.language,
						imgClass: 'forImagePreview'
					},
					ti = LIB.titleOf(p,opts);

				// create radio-buttons or checkboxes, if it is an enumerated dataType:
				if (p.dT.enumeration) {
					// entryL is the list of entries for an input field with checkboxes or radio-buttons, 
					// depending on whether multiple values are allowed or not:
					let entryL = LIB.forAll(
						p.dT.enumeration,
						(eV: SpecifEnumeratedValue) => {
							let val = p.dT.type == SpecifDataTypeEnum.String ? i18n.lookup(LIB.languageValueOf(eV.value, opts)) : eV.value;
							return { title: val, id: eV.id, checked: p.enumIdL.includes(eV.id) }
						}
					);

//					console.debug('Enumeration', p, ti, entryL);
					if (typeof (p.pC.multiple) == 'boolean' ? p.pC.multiple : p.dT.multiple)
						return checkboxField(
							ti,
							entryL,
							{ description: (p.pC.description ? LIB.languageValueOf(p.pC.description, opts) : '') }
						);
					else
						return radioField(
							ti,
							entryL,
							{ description: (p.pC.description ? LIB.languageValueOf(p.pC.description, opts) : '') }
						);
				};

				// create an input field depending on the property's dataType;
				// again, the dataType may be missing, the type is assumed to be "xs:string" by default:
				switch ( p.dT.type ) {
					case SpecifDataTypeEnum.Boolean:
						// - no input checking needed
						// - a boolean property is never a SpecIF 'enumeration' (because it is already an enumeration by nature)
//						console.debug('xs:boolean',ti,p);
						return booleanField(
							ti,
							p.values.length > 0 ? LIB.isTrue(p.values[0]) : false,
							{ description: (p.pC.description ? LIB.languageValueOf(p.pC.description, opts) : '') }
						);
					case SpecifDataTypeEnum.String:
						if( p.pC.title == CONFIG.propClassDiagram ) {
							// it is a diagram reference (thus an XHTML-formatted field):
							return renderDiagram(p, opts)
						}
						else {
							// add parameters to check this input field:
							self.dialogForm.addField(ti, p.dT);
							// it is a text;
							// in case of xhtml, it may contain a diagram reference, 
							// as there is no obligation to provide a separate property belonging to CONFIG.diagramClasses:
//							console.debug( 'editPrp', LIB.languageValueOf(p.value,opts) );
							return textField(
								ti,
								p.values.length > 0 ? LIB.languageValueOf(p.values[0], opts) : '',  // only first value for the time being ...
								// - open an input line, if it is a title or has a specified length lower than the threshold
								// - open an input text-area, otherwise
								{
									typ: ((p.dT.maxLength && p.dT.maxLength < CONFIG.textThreshold + 1) || CONFIG.titleProperties.indexOf(ti) > -1) ? 'line' : 'area',
									handle: myFullName + '.check()',
									description: (p.pC.description ? LIB.languageValueOf(p.pC.description, opts) : '')
								} 
							);
						};
					default:
						// add parameters to check this input field:
						self.dialogForm.addField( ti, p.dT );
						return textField(
							ti,
							p.values.length > 0 ? p.values[0] as string : '',
							{
								typ: 'line', handle: myFullName + '.check()',
								description: (p.pC.description ? LIB.languageValueOf(p.pC.description, opts) : '')
							}
						);
				};

				function renderDiagram(p:CPropertyToShow,opts:any) {
//					console.debug('renderDiagram',p);
					return '<div class="form-group form-active" >'
						+ 		'<div class="attribute-label" >'+LIB.titleOf(p,opts)+'</div>'
						+ 		'<div class="attribute-value">'
						+			diagBtns(p)
									// Add a container based on the propertyClass (which should be unique and since there is usually no property-id), 
									// so that the user can update and delete the diagram later on:
						+           '<div id="' + tagId(p['class'].id) + '">'
						+				p.renderFile(p.values.length > 0 ? LIB.languageValueOf(p.values[0], opts) : '', opts)
						+			'</div>'
						+		'</div>'
						+ '</div>';
					
					function diagBtns(p: CPropertyToShow) {
						// p['class'] is used to identify the property; 
						// it is supposed to be unique in the resource's properties
						// and at most one resource is edited in this session at any point in time.
						var bts = 	'<div class="btn-group btn-group-sm pull-right" >';
					//	if( !p.permissions || p.permissions.upd ) {
							bts +=			'<span class="btn btn-default btn-fileinput">'
								+				'<span>'+i18n.IcoEdit+'</span>'
								+	'<input id="file' + simpleHash(p['class'].id)+'" type="file" onchange="'+myFullName+'.updateDiagram(\''+p['class'].id+'\')" />'
								+			'</span>';
					//	};  
					//	if( !p.permissions || p.permissions.del ) {
							bts +=			'<button class="btn btn-danger" data-toggle="popover" '
								+ 'onclick="'+myFullName+'.removeDiagram(\''+p['class'].id+'\')" title="'+i18n.LblDelete+'">'+i18n.IcoDelete+'</button>';
					//	};
						bts +=			'</div>';
						return bts;
					}
				}
			}
		}
		function selectResClass(opts: any): Promise<SpecifResourceClass> {
			// Let the user choose the class of the resource to be created later on:
			return new Promise((resolve, reject) => {
				app.cache.selectedProject.readItems('resourceClass', LIB.forAll(opts.eligibleResourceClasses, (rCId:SpecifId) => { return LIB.makeKey(rCId) }))
				.then( 
					(rCL)=>{
						if( rCL.length>0 ) {
							// Get the title to display:
						//	let resClasses = LIB.forAll(simpleClone(rCL, (rC) => { rC.title = LIB.titleOf(rC, { lookupTitles: true }); return rC });
							let resClasses = LIB.forAll(rCL, (rC: SpecifResourceClass) => { rC.title = LIB.titleOf(rC, { lookupTitles: true }); return rC });
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
								// exactly one class, so we can continue immediately:
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
	self.updateDiagram = (cId:string)=>{
		// @ts-ignore - .files is in fact accessible
		let f = document.getElementById("file" + simpleHash(cId)).files[0];
//		console.debug('updateDiagram',cId,f.name);
		readFile( f, (data:Blob)=>{
				// "<div><p class=\"inline-label\">Plan:</p><p><object type=\"image/svg+xml\" data=\"files_and_images\\50f2e49a0029b1a8016ea6a5f78ff594.svg\">Arbeitsumgebung</object></p></div>"
				let fType = f.type||opts.mediaTypeOf(f.name),
					fName = 'files_and_images/'+f.name,
					newFile = new CFileWithContent({ blob: data, id: 'F-' + simpleHash(fName), title:fName, type: fType, changedAt: new Date( f.lastModified ).toISOString() });
				// store the diagram reference intermediately, before copying it to self.newRes.properties later on;
				// all diagrams should be in toEdit.descriptions, but there may be exceptions in older data:
				// ToDo: Check whether *all* diagram resources are sorted into toEdit.descriptions as member of CONFIG.diagramClasses
				LIB.itemBy(toEdit.descriptions.concat(toEdit.other), 'class', LIB.makeKey(cId)).values = [LIB.makeMultiLanguageText('<object data="'+fName+'" type="'+fType+'">'+fName+'</object>')];
				// store the diagram file itself:
				self.newFiles.push(newFile);
				// @ts-ignore - document.getElementById is only theoretically undefined ...
				document.getElementById(tagId(cId)).innerHTML = '<div class="forImagePreview ' + tagId(fName) + '">' + newFile.renderImage()+'</div>';
		});
		return;
		
		function readFile( f:File, fn:Function ) {
			const rdr = new FileReader();
			rdr.onload = ()=>{
				fn( new Blob([rdr.result], { type: f.type }) );
			};
			rdr.readAsArrayBuffer( f );
		}
	};
	self.removeDiagram = (cId:string):void =>{
//		console.debug('removeDiagram',cId,toEdit);
		// delete the diagram reference intermediately, so that it can be omitted when saving self.newRes.properties later on;
		// all diagrams should be in toEdit.descriptions, but there may be exceptions in older data:
		// ToDo: Check whether *all* diagram resources are sorted into toEdit.descriptions as member of CONFIG.diagramClasses
		LIB.itemBy(toEdit.descriptions.concat(toEdit.other), 'class', LIB.makeKey(cId)).values = [];
		document.getElementById(tagId(cId)).innerHTML = ''
	};
	self.check = ():void =>{
		// called on every key-input;
		// check all input fields:
		let ok = self.dialogForm.check();
		// enable save buttons, if all input fields have acceptable content:
		Array.from(document.getElementsByClassName('btn-modal-save'),
			// @ts-ignore - 'disable' does exist and the assignment does work
			(btn) => { btn.disabled = !ok; }
		)
//		console.debug('input made',document.getElementsByClassName('btn-modal-save'));
	};

	function save(mode:string):void {
		// Save the new or changed resource;
		// 'self.newRes' is updated with the input data and then stored; 
		// it replaces the resource with same id.
		// It may happen that an existing resource and thus 'self.newRes' does not have 
		// a 'properties' list yet, even though it's class defines propertyClasses.
		// ToDo: If the original resource had different languages, take care of them;
		//       The new values must not replace any original multi-language property values!
		let pend = 2, // minimally 2 calls with promise
			chD = new Date().toISOString();  // changedAt

		// A resource must have at least a property with it's title (SpecIF v1.1).
		// - toEdit has all properties according to the resource class, it provides the structure for the collection of input data
		// - the input data is however stored in self.newRes ... which will be saved in the end.
		self.newRes.properties = [];

		// 1. Update the title:
		if (toEdit.title.dT.type == SpecifDataTypeEnum.String) {
			// Update the title; it must be of dataType "xs:string":
			let val = textValue(prpTitle(toEdit.title)).stripHTML() || ("Title of " + self.newRes.id);
			self.newRes.properties.push({ class: LIB.keyOf(toEdit.title.pC), values: [LIB.makeMultiLanguageText(val)] });
		}
		else
			console.warn('Datatype of Title is ' + toEdit.title.dT.type + ', but not ' + SpecifDataTypeEnum.String);
//		console.debug('#1', toEdit, self.newRes);

		// 2. Update the properties serving as description; it is assumed it is of dataType "xs:string":
		toEdit.descriptions.forEach( (p: CPropertyToShow):void => {

			if (p.dT.type == SpecifDataTypeEnum.String) {
				// get the new or unchanged input value of the property from the input field;
				// description properties used to reference a diagram (p.pC.title == CONFIG.propClassDiagram) are included:
//				console.debug('desc',prpTitle(p),textValue(prpTitle(p)))

				// In case of a diagram, the value is stored intermediately in the respective toEdit property when the user uploads a new file;
				// p.values is empthy, if the diagram has been removed while editing:
				if (p.pC.title == CONFIG.propClassDiagram && p.values.length > 0) {
					self.newRes.properties.push({ class: LIB.keyOf(p.pC), values: p.values });
					return;
				};

				let val = textValue(prpTitle(p));
				if (LIB.hasContent(val))
					self.newRes.properties.push({ class: LIB.keyOf(p.pC), values: [LIB.makeMultiLanguageText(val)] });
			}
			else
				console.warn('Datatype of Description is ' + p.dT.type + ', but not ' + SpecifDataTypeEnum.String);

//			console.debug( 'save',mode, p, getP( p ) );
		});

		// 3. Update all other attributes:
		toEdit.other.forEach( (p: CPropertyToShow):void => {
			// Get the new or unchanged input value of the property from the input field:

			// In case of enumeration:
			if (p.dT.enumeration) {
				let valL: string[];
//				console.debug('xs:enumeration',p,pC,separatedValues,vals);
				if (typeof (p.pC.multiple) == 'boolean' ? p.pC.multiple : p.dT.multiple) {
//					console.debug( '*', p, checkboxValues(prpTitle(p) ));
					valL = checkboxValues(prpTitle(p));
				}
				else {
//					console.debug( '+',p,radioValue( prpTitle(p) ));
					let val = radioValue(prpTitle(p));
					valL = val ? [val] : [];
				};
				if (valL.length > 0)
					self.newRes.properties.push({ class: LIB.keyOf(p.pC), values: valL });
				return;
			};

			// Otherwise take the value itself:
			let val: string;
			switch (p.dT.type) {
				case SpecifDataTypeEnum.String:
					val = textValue(prpTitle(p));
					if (LIB.hasContent(val))
						self.newRes.properties.push({ class: LIB.keyOf(p.pC), values: [LIB.makeMultiLanguageText(val)] });
					break;
				case SpecifDataTypeEnum.Boolean:
					val = booleanValue(prpTitle(p)).toString();
					self.newRes.properties.push({ class: LIB.keyOf(p.pC), values: [val] });
					break;
				default:
					val = textValue(prpTitle(p));
					if (LIB.hasContent(val))
						self.newRes.properties.push({ class: LIB.keyOf(p.pC), values: [val] });
			};
		});

		self.newRes.changedAt = chD;
//		console.debug('save',simpleClone(self.newRes));

		app.cache.selectedProject.updateItems('resource', self.newRes)
			.then(finalize, LIB.stdError);

		// If it is a new item, insert a mode in the hierarchy:
		switch (mode) {
			case 'insert':
				pend++;
				app.cache.selectedProject.createItems( 'node', {id:LIB.genID('N-'), resource:LIB.keyOf(self.newRes), changedAt:chD} )
					.then( finalize, LIB.stdError );
				break;
			case 'insertAfter':
				pend++;
				app.cache.selectedProject.createItems('node', { id: LIB.genID('N-'), resource: LIB.keyOf(self.newRes), changedAt: chD, predecessor: opts.selNodeId } as INodeWithPosition )
					.then( finalize, LIB.stdError );
				break;
			case 'insertBelow':
				pend++;
				app.cache.selectedProject.createItems('node', { id: LIB.genID('N-'), resource: LIB.keyOf(self.newRes), changedAt: chD, parent: opts.selNodeId } as INodeWithPosition )
					.then( finalize, LIB.stdError );
		};

		// has no effect, if newFiles is empty:
		app.cache.selectedProject.createItems( 'file', self.newFiles )
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
		function prpTitle(p: CPropertyToShow) {
			return LIB.titleOf( p, { lookupTitles: true, targetLanguage: browser.language } )
        }
	};
	return self;
})
