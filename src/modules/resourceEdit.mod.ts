/*!	SpecIF: Resource Edit.
	Dependencies: jQuery, bootstrap
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	Author: se@enso-managers.de, Berlin
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/

// The dependency introduced through the extends directive must be reflected by an entry in the requires list of the module definition in the moduleTree.
// In effect the loading of this module is deferred until all modules listed in its requires list are loaded.
// In this case CPropertyToShow is defined in the module named CONFIG.specifications.
class CPropertyToEdit extends CPropertyToShow  {
	constructor(p: SpecifProperty) {
		super(p);
    }
	
	editForm(opts:any): string {
		// Return a form element for a property;

		let localOpts = Object.assign({
				lookupTitles: true,
				targetLanguage: browser.language,
				imgClass: 'forImagePreview'
			},opts),
			ti = LIB.titleOf(this, localOpts);

		// create radio-buttons or checkboxes, if it is an enumerated dataType:
		if (this.dT.enumeration) {
			// entryL is the list of entries for an input field with checkboxes or radio-buttons, 
			// depending on whether multiple values are allowed or not:
			let entryL = LIB.forAll(
				this.dT.enumeration,
				(eV: SpecifEnumeratedValue) => {
					let val = this.dT.type == SpecifDataTypeEnum.String ? i18n.lookup(LIB.languageValueOf(eV.value, localOpts)) : eV.value;
					return { title: val, id: eV.id, checked: this.enumIdL.includes(eV.id) }
				}
			);

//			console.debug('Enumeration', this, ti, entryL);
			if (typeof (this.pC.multiple) == 'boolean' ? this.pC.multiple : this.dT.multiple)
				return makeCheckboxForm(
					ti,
					entryL,
					{ description: (this.pC.description ? LIB.languageValueOf(this.pC.description, localOpts) : '') }
				);
			else
				return makeRadioForm(
					ti,
					entryL,
					{ description: (this.pC.description ? LIB.languageValueOf(this.pC.description, localOpts) : '') }
				);
		};

		// create an input field depending on the property's dataType;
		// again, the dataType may be missing, the type is assumed to be "xs:string" by default:
		switch (this.dT.type) {
			case SpecifDataTypeEnum.Boolean:
				// - no input checking needed
				// - a boolean property is never a SpecIF 'enumeration' (because it is already an enumeration by nature)
//				console.debug('xs:boolean',ti,this);
				return makeBooleanForm(
					ti,
					this.values.length > 0 ? LIB.isTrue(this.values[0]) : false,
					{ description: (this.pC.description ? LIB.languageValueOf(this.pC.description, localOpts) : '') }
				);
			case SpecifDataTypeEnum.String:
				if (this.pC.title == CONFIG.propClassDiagram) {
					// it is a diagram reference (thus an XHTML-formatted field):
					return this.editDiagramForm(localOpts)
				}
				else {
					// add parameters to check this input field:
					if (opts && opts.dialogForm)
						opts.dialogForm.addField(ti, this.dT);
					// it is a text;
					// in case of xhtml, it may contain a diagram reference, 
					// as there is no obligation to provide a separate property belonging to CONFIG.diagramClasses:
//					console.debug( 'editForm', LIB.languageValueOf(this.value,localOpts) );
					return makeTextForm(
						ti,
						//	this.values.length > 0 ? LIB.languageValueOf(this.values[0], localOpts) : '',  // only first value for the time being ...
						LIB.forAll(
							this.values,
							(v: SpecifMultiLanguageText) => { return LIB.languageValueOf(v, localOpts); }
						),
						// - open an input line, if it is a title or has a specified length lower than the threshold
						// - open an input text-area, otherwise
						{
							typ: ((this.dT.maxLength && this.dT.maxLength < CONFIG.textThreshold + 1) || CONFIG.titleProperties.indexOf(ti) > -1) ? 'line' : 'area',
							handle: opts.myFullName + '.check()',
							description: (this.pC.description ? LIB.languageValueOf(this.pC.description, localOpts) : '')
						}
					);
				};
			default:
				// add parameters to check this input field:
				if (opts && opts.dialogForm)
					opts.dialogForm.addField(ti, this.dT);
				return makeTextForm(
					ti,
					//	this.values.length > 0 ? this.values[0] as string : '',
					this.values as string[],
					{
						typ: 'line', handle: opts.myFullName + '.check()',
						description: (this.pC.description ? LIB.languageValueOf(this.pC.description, localOpts) : '')
					}
				);
		};
	}
	private editDiagramForm(opts: any) {
		//					console.debug('editDiagram',this);
		return '<div class="form-group form-active" >'
			+ '<div class="attribute-label" >' + LIB.titleOf(this, opts) + '</div>'
			+ '<div class="attribute-value">'

			// Add diagram update and delete buttons:
			// this['class'] is used to identify the property; 
			// it is supposed to be unique in the resource's properties
			// and at most one resource is edited in this session at any point in time.
			+ '<div class="btn-group btn-group-sm pull-right" >'
			//	+		( !this.permissions || this.permissions.upd?
			+ '<span class="btn btn-default btn-fileinput">'
			+ '<span>' + i18n.IcoEdit + '</span>'
			+ '<input id="file' + simpleHash(this['class'].id) + '" type="file" onchange="' + opts.myFullName + '.updateDiagram(\'' + this['class'].id + '\')" />'
			+ '</span>'
			//			: '')
			//	+		( !this.permissions || this.permissions.del?
			+ '<button class="btn btn-danger" data-toggle="popover" '
			+ 'onclick="' + opts.myFullName + '.removeDiagram(\'' + this['class'].id + '\')" title="' + i18n.LblDelete + '">' + i18n.IcoDelete + '</button>'
			//			: '')
			+ '</div>'

			// Add a container based on the propertyClass (which should be unique and since there is usually no property-id),
			// so that the user can update and delete the diagram later on:
			+ '<div id="' + tagId(this['class'].id) + '">'
			+ this.renderFile(this.values.length > 0 ? LIB.languageValueOf(this.values[0], opts) : '', opts)
			+ '</div>'
			+ '</div>'
			+ '</div>';
	}
}
class CResourceToEdit {
//	id: string;
//	class: SpecifKey;
	private selPrj: CProject;
	private cData: CCache;
	rC: SpecifResourceClass;
//	isHeading: boolean;
//	order: string;
//	revision?: string;
//	replaces?: string[];
	dialogForm: CCheckDialogInput;
	properties: CPropertyToEdit[];
	newFiles: CFileWithContent[];			// collect uploaded files
//	changedAt: string;
//	changedBy?: string;
	constructor(el: SpecifResource) {
	/*	// @ts-ignore - index is ok:
		for (var a in el) this[a] = el[a]; */

		// add missing (empty) properties and classify properties into title, descriptions and other;
		// for resources.
		this.selPrj = app.cache.selectedProject;
		this.cData = this.selPrj.data;

	//	this.id = el.id;
	//	this['class'] = el['class'];
		this.rC = this.cData.get("resourceClass", [el['class']])[0] as SpecifResourceClass;
	/*	this.isHeading = false; // will be set further down if appropriate
		this.revision = el.revision;
		this.order = el.order;
		this.revision = el.revision;
		this.replaces = el.replaces;
		this.changedAt = el.changedAt;
		this.changedBy = el.changedBy; */

		this.dialogForm = new CCheckDialogInput();
		this.properties = LIB.forAll(el.properties, (pr: SpecifProperty) => { return new CPropertyToEdit(pr) });
		this.newFiles = [];
	}
	editForm(opts: any): void {
	// Edit/update the resources' properties with a modal dialog:
//	console.debug( 'editResource', r2edit, simpleClone(cData.resourceClasses) );
		if (this.properties.length > 0) {

			let localOpts = Object.assign({
				dialogForm: this.dialogForm,
			}, opts);

			// @ts-ignore - BootstrapDialog() is loaded at runtime
			new BootstrapDialog({
				title: opts.dialogTitle,
				type: 'type-primary',
				// @ts-ignore - BootstrapDialog() is loaded at runtime
				size: BootstrapDialog.SIZE_WIDE,
				// initialize the dialog;
				// set focus to first field, the title, and do a first check on the initial data (should be ok ;-)
				onshown: () => { setFocus(i18n.lookup(CONFIG.propClassTitle)); this.check() },
			//	message: (thisDlg)=>{
				message: () => {
					// @ts-ignore - object $('#app') is only theoretically undefined ...
					var form = '<div style="max-height:' + ($('#app').outerHeight(true) - 190) + 'px; overflow:auto" >';
					this.properties.forEach(
						(p) => { form += p.editForm(localOpts); }
					);
					form += '</div>';
					return $(form);
				},
				buttons: opts.msgBtns
			})
			.open();
		};
	}
	check(): void {
		// called on every key-input;
		// check all input fields:
		let ok = this.dialogForm.check();
		// enable save buttons, if all input fields have acceptable content:
		Array.from(document.getElementsByClassName('btn-modal-save'),
			// @ts-ignore - 'disable' does exist and the assignment does work
			(btn) => { btn.disabled = !ok; }
		)
//		console.debug('input made',document.getElementsByClassName('btn-modal-save'));
	};
	updateDiagram(cId: string) {
		// @ts-ignore - .files is in fact accessible
		let f = document.getElementById("file" + simpleHash(cId)).files[0];
//		console.debug('updateDiagram',cId,f.name);
		readFile(f,
			(data: Blob) => {
				// "<div><p class=\"inline-label\">Plan:</p><p><object type=\"image/svg+xml\" data=\"files_and_images\\50f2e49a0029b1a8016ea6a5f78ff594.svg\">Arbeitsumgebung</object></p></div>"
				let fType = f.type || LIB.attachment2mediaType(f.name),
					fName = 'files_and_images/' + f.name,
					newFile = new CFileWithContent({ blob: data, id: 'F-' + simpleHash(fName), title: fName, type: fType, changedAt: new Date(f.lastModified).toISOString() });
				// store the diagram reference intermediately, before copying it to self.newRes.properties later on;
				// all diagrams should be in self.toEdit.descriptions, but there may be exceptions in older data:
				// ToDo: Check whether *all* diagram resources are sorted into self.toEdit.descriptions as member of CONFIG.diagramClasses
				LIB.itemBy(this.properties, 'class', LIB.makeKey(cId))
					.values = [LIB.makeMultiLanguageText('<object data="' + fName + '" type="' + fType + '">' + fName + '</object>')];
				// store the diagram file itself:
				this.newFiles.push(newFile);
				// @ts-ignore - document.getElementById is only theoretically undefined ...
				document.getElementById(tagId(cId)).innerHTML = '<div class="forImagePreview ' + tagId(fName) + '">' + newFile.renderImage() + '</div>';
			});
		return;

		function readFile(f: File, fn: Function) {
			const rdr = new FileReader();
			rdr.onload = () => {
				fn(new Blob([rdr.result], { type: f.type }));
			};
			rdr.readAsArrayBuffer(f);
		}
	}
	removeDiagram(cId: string): void {
//		console.debug('removeDiagram',cId,self.toEdit);
		// delete the diagram reference intermediately, so that it can be omitted when saving self.newRes.properties later on;
		// all diagrams should be in self.toEdit.descriptions, but there may be exceptions in older data:
		// ToDo: Check whether *all* diagram resources are sorted into self.toEdit.descriptions as member of CONFIG.diagramClasses
		LIB.itemBy(this.properties, 'class', LIB.makeKey(cId)).values = [];
		document.getElementById(tagId(cId)).innerHTML = ''
	}
	getNewFiles(): CFileWithContent[] {
		// ToDo: Check whether all files are in fact referenced by a property.
		return this.newFiles;
    }
	getEditedProperties(): SpecifProperty[] {
		// Get all property values from the form:
		let editedProps: SpecifProperty[] = [];
		this.properties.forEach((p: CPropertyToEdit): void => {
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
					// The class reference to pC must not have a revision, if the reference in propertyClasses of rC hasn't a revision.
					// For the time being, the revision is *never* specified here, perhaps the same reference (with or without revision) 
					// as used in the propertyClasses of rC needs to be applied (ToDo?) 
					editedProps.push({ class: LIB.makeKey(p.pC.id), values: valL });
				return;
			};

			// Otherwise take the value itself:
			let val: string;
			switch (p.dT.type) {
				case SpecifDataTypeEnum.String:
					if (p.pC.title == CONFIG.propClassDiagram) {
						// In case of a diagram, the value is stored intermediately in the respective self.toEdit property when the user uploads a new file;
						// p.values is empthy, if the diagram has been removed while editing:
						if (p.values.length > 0)
							// The class reference to pC must not have a revision, if the reference in propertyClasses of rC hasn't a revision.
							// For the time being, the revision is *never* specified here, perhaps the same reference (with or without revision) 
							// as used in the propertyClasses of rC needs to be applied (ToDo?) 
							editedProps.push({ class: LIB.makeKey(p.pC.id), values: p.values });
					}
					else {
						// property isn't of type diagram:
						val = textValue(prpTitle(p));
						if (LIB.hasContent(val))
							editedProps.push({ class: LIB.makeKey(p.pC.id), values: [LIB.makeMultiLanguageText(val)] });
					};
					break;
				case SpecifDataTypeEnum.Boolean:
					val = booleanValue(prpTitle(p)).toString();
					editedProps.push({ class: LIB.makeKey(p.pC.id), values: [val] });
					break;
				default:
					val = textValue(prpTitle(p));
					if (LIB.hasContent(val))
						editedProps.push({ class: LIB.makeKey(p.pC.id), values: [val] });
			};
		});
		return editedProps;

		function prpTitle(p: CPropertyToShow) {
			return LIB.titleOf(p, { lookupTitles: true, targetLanguage: browser.language })
		}
	}
}

// Construct the resource editor:
moduleManager.construct({
	name: CONFIG.resourceEdit
}, (self: IModule) => {
	"use strict";

	self.init = (): boolean => {
//		console.debug('resourceEdit.init')
		self.clear();
		return true;
	};
	self.clear = (): void => {
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
	self.show = (opts: any) => {

		self.clear();
		self.localOpts = Object.assign({
				myFullName: 'app.' + self.loadAs + '.toEdit'   // myName = self.loadAs
			}, opts);

		if (self.parent.tree.selectedNode)
			self.localOpts.selNodeId = self.parent.tree.selectedNode.id;

//		console.debug('resourceEdit.show',self.localOpts);
		switch (self.localOpts.mode) {
			case 'create':
				selectResClass(self.localOpts)
			/*	.then(
					(rC:SpecifResourceClass)=>{ 
						app.cache.selectedProject.makeEmptyResource(rC)
						.then( 
							(r:SpecifResource)=>{
//								console.debug( '#', self.localOpts.mode, r );
								self.newRes = r;
								self.localOpts.dialogTitle = i18n.MsgCreateResource+' ('+rC.title+')';
								if( self.localOpts.selNodeId )
									self.localOpts.msgBtns = [
										msgBtns.cancel,
										msgBtns.insertAfter,
										msgBtns.insertBelow
									]
								else
									self.localOpts.msgBtns = [
										msgBtns.cancel,
										msgBtns.insert
									];
								self.toEdit = new CResourceToEdit(r);
								self.toEdit.editForm(self.localOpts)
							},
							LIB.stdError
						);
					},
					LIB.stdError
				); */
				.then(
					(rC: SpecifResourceClass) => {
					//	self.localOpts.dialogTitle = i18n.MsgCreateResource + ' (' + LIB.languageValueOf(rC.title) + ')';
						self.localOpts.dialogTitle = i18n.MsgCreateResource + ' (' + rC.title + ')';
						return app.cache.selectedProject.makeEmptyResource(rC)
				})
				.then(
					(r: SpecifResource) => {
//						console.debug( '#', self.localOpts.mode, r );
						self.newRes = r;
						if (self.localOpts.selNodeId)
							self.localOpts.msgBtns = [
								msgBtns.cancel,
								msgBtns.insertAfter,
								msgBtns.insertBelow
							]
						else
							self.localOpts.msgBtns = [
								msgBtns.cancel,
								msgBtns.insert
							];
						self.toEdit = new CResourceToEdit(r);
						self.toEdit.editForm(self.localOpts)
				})
				.catch ( LIB.stdError ); 
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
						if( self.localOpts.mode=='clone' ) {
							self.newRes.id = LIB.genID('R-');
							self.localOpts.dialogTitle = i18n.MsgCloneResource,
							self.localOpts.msgBtns = [
								msgBtns.cancel,
								msgBtns.insertAfter,
								msgBtns.insertBelow
							]
						}
						else {
							self.localOpts.dialogTitle = i18n.MsgUpdateResource;
							self.localOpts.msgBtns = [
								msgBtns.cancel,
								msgBtns.update
							]
						}; 
						self.toEdit = new CResourceToEdit(self.newRes);
						self.toEdit.editForm(self.localOpts)
					},
					LIB.stdError
				);
		};
		return;

		function selectResClass(opts: any): Promise<SpecifResourceClass> {
			// Let the user choose the class of the resource to be created later on:
			return new Promise((resolve, reject) => {
				app.cache.selectedProject.readItems('resourceClass', LIB.forAll(opts.eligibleResourceClasses, (rCId:SpecifId) => { return LIB.makeKey(rCId) }))
				.then( 
					(rCL)=>{
						if( rCL.length>0 ) {
							// Get the title to display:
							let resClasses = LIB.forAll(rCL, (rC: SpecifResourceClass) => { rC.title = LIB.titleOf(rC, { lookupTitles: true }); return rC });
							if( resClasses.length>1 ) {
								// open a modal dialog to let the user select the class for the resource to create:
								resClasses[0].checked = true;  // default selection
//								console.debug('#2',simpleClone(cData.resourceClasses));
								// @ts-ignore - BootstrapDialog() is loaded at runtime
								new BootstrapDialog({
									title: i18n.MsgSelectResClass,
									type: 'type-primary',
								//	size: BootstrapDialog.SIZE_WIDE,
								//	message: (thisDlg)=>{
									message: () => {
										var form = '<form id="attrInput" role="form" >'
												+ makeRadioForm( i18n.LblResourceClass, resClasses )
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
*/

	function save(mode:string):void {
		// Save the new or changed resource;
		// 'self.newRes' is updated with the input data and then stored; 
		// it replaces the resource with same id.
		// It may happen that an existing resource and thus 'self.newRes' does not have 
		// a 'properties' list yet, even though it's class defines propertyClasses.

		// ToDo: 
		// - If the original resource had different languages, take care of them;
		// - The new values must not replace any original multi-language property values!

		let pend = 2, // minimally 2 calls with promise
			chD = new Date().toISOString();

		self.newRes.properties = self.toEdit.getEditedProperties();
		self.newRes.changedAt = chD;
//		console.debug('save',simpleClone(self.newRes));

		switch (mode) {
			case 'update':
				app.cache.selectedProject.updateItems('resource', [self.newRes])
					.then(finalize, LIB.stdError);
				break;
			default:
				app.cache.selectedProject.createItems('resource', [self.newRes])
					.then(finalize, LIB.stdError);
		};

		// If it is a new item, insert a mode in the hierarchy:
		switch (mode) {
			case 'insert':
				pend++;
				app.cache.selectedProject.createItems('node', [{ id: LIB.genID('N-'), resource: LIB.keyOf(self.newRes), changedAt: chD } as SpecifNode])
					.then( finalize, LIB.stdError );
				break;
			case 'insertAfter':
				pend++;
				app.cache.selectedProject.createItems('node', [{ id: LIB.genID('N-'), resource: LIB.keyOf(self.newRes), changedAt: chD, predecessor: self.localOpts.selNodeId } as INodeWithPosition ])
					.then( finalize, LIB.stdError );
				break;
			case 'insertBelow':
				pend++;
				app.cache.selectedProject.createItems('node', [{ id: LIB.genID('N-'), resource: LIB.keyOf(self.newRes), changedAt: chD, parent: self.localOpts.selNodeId } as INodeWithPosition ])
					.then( finalize, LIB.stdError );
		};

		// has no effect, if newFiles is empty:
		app.cache.selectedProject.createItems( 'file', self.toEdit.getNewFiles() )
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
	};
	return self;
})
