"use strict";
/*!	SpecIF: Resource Edit.
    Dependencies: jQuery, bootstrap
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    Author: se@enso-managers.de, Berlin
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/
class CPropertyToEdit extends CPropertyToShow {
    constructor(p, rC) {
        super(p, rC);
    }
    dispOpts() {
        let opts = { hint: this.pC.description };
        if (!this.pC.permissionVector.U)
            opts.typ = 'display';
        return opts;
    }
    editField(opts) {
        let localOpts = Object.assign({
            lookupTitles: true,
            keepTitleLinkingPatterns: true,
            targetLanguage: this.selPrj.language
        }, opts), ti = LIB.titleOf(this, localOpts);
        if (this.dT.enumeration) {
            let entryL = LIB.forAll(this.dT.enumeration, (eV) => {
                let val = this.dT.type == XsDataType.String ? app.ontology.localize(LIB.languageTextOf(eV.value, localOpts), localOpts) : eV.value;
                return { title: val, id: eV.id, checked: this.enumIdL.includes(eV.id) };
            });
            if (typeof (this.pC.multiple) == 'boolean' ? this.pC.multiple : this.dT.multiple)
                return makeCheckboxField(ti, entryL, this.dispOpts());
            else
                return makeRadioField(ti, entryL, this.dispOpts());
        }
        ;
        switch (this.dT.type) {
            case XsDataType.Boolean:
                return makeBooleanField(ti, this.values.length > 0 ? LIB.isTrue(this.values[0]) : false, this.dispOpts());
            case XsDataType.String:
                if (this.pC.title == CONFIG.propClassDiagram) {
                    return this.makeDiagramField(localOpts);
                }
                else {
                    if (this.pC.permissionVector.U) {
                        if (opts && opts.dialogForm)
                            opts.dialogForm.addField(ti, this.dT);
                        return makeTextField(ti, this.get(localOpts).escapeHTML(), {
                            typ: app.ontology.propertyClassIsText(this.pC.title) ? 'area' : 'line',
                            handle: opts.myFullName + '.check()',
                            hint: this.pC.description
                        });
                    }
                    else {
                        return makeTextField(ti, this.get(localOpts), {
                            typ: 'display',
                            hint: this.pC.description
                        });
                    }
                }
                ;
            default:
                if (this.pC.permissionVector.U) {
                    if (opts && opts.dialogForm)
                        opts.dialogForm.addField(ti, this.dT);
                    return makeTextField(ti, this.get(localOpts), {
                        typ: 'line',
                        handle: opts.myFullName + '.check()',
                        hint: this.pC.description
                    });
                }
                else {
                    return makeTextField(ti, this.get(localOpts), {
                        typ: 'display',
                        hint: this.pC.description
                    });
                }
        }
    }
    renderImg(opts) {
        return '<div id="' + tagId(this['class'].id) + '">'
            + this.renderFile(this.values.length > 0 ? LIB.languageTextOf(this.values[0], opts) : '', Object.assign({ renderFiles: true, imgClass: 'forImagePreview' }, opts))
            + '</div>';
    }
    makeDiagramField(opts) {
        function imgExts() {
            let str = '';
            CONFIG.imgExtensions.forEach((ext, idx) => {
                str += (idx < 1 ? '.' + ext : (str.includes(ext) ? '' : ',.' + ext));
            });
            return str;
        }
        if (this.pC.permissionVector.U) {
            return '<div class="form-group form-active" >'
                + '<div class="attribute-label" >' + LIB.titleOf(this, opts) + '</div>'
                + '<div class="attribute-value">'
                + '<div class="btn-group btn-group-sm pull-right" >'
                + '<span class="btn btn-default btn-fileinput">'
                + '<span>' + i18n.IcoEdit + '</span>'
                + '<input id="file' + simpleHash(this['class'].id)
                + '" type="file" accept="' + imgExts() + '" onchange="' + opts.myFullName + '.updateDiagram(\'' + this['class'].id + '\')" />'
                + '</span>'
                + '<button class="btn btn-danger" data-toggle="popover" '
                + 'onclick="' + opts.myFullName + '.removeDiagram(\'' + this['class'].id + '\')" title="' + i18n.LblDelete + '">' + i18n.IcoDelete
                + '</button>'
                + '</div>'
                + this.renderImg(opts)
                + '</div>'
                + '</div>';
        }
        else {
            return '<div class="attribute-label" >' + LIB.titleOf(this, opts) + '</div>'
                + '<div class="attribute-value">'
                + this.renderImg(opts)
                + '</div>';
        }
    }
    getEditedValue(opts) {
        if (!this.pC.permissionVector.U)
            return;
        let localOpts = Object.assign({
            lookupTitles: true,
            keepTitleLinkingPatterns: true,
            targetLanguage: this.selPrj.language,
            imgClass: 'forImagePreview'
        }, opts), ti = LIB.titleOf(this, localOpts);
        if (this.dT.enumeration) {
            let valL;
            if (typeof (this.pC.multiple) == 'boolean' ? this.pC.multiple : this.dT.multiple) {
                valL = checkboxValues(ti);
            }
            else {
                let val = radioValue(ti);
                valL = val ? [val] : [];
            }
            ;
            return { class: LIB.makeKey(this.pC.id), values: valL };
        }
        ;
        let val;
        switch (this.dT.type) {
            case XsDataType.String:
                if (this.pC.title == CONFIG.propClassDiagram) {
                    return { class: LIB.makeKey(this.pC.id), values: this.values };
                }
                else {
                    val = textValue(ti);
                    if (LIB.hasContent(val)) {
                        let term = app.ontology.getTermResource('propertyClass', this.pC.title);
                        if (term && app.ontology.valueByTitle(term, "SpecIF:multiLanguage") == 'true') {
                            if (this.values.length > 0 && LIB.multiLanguageValueHasContent(this.values[0])) {
                                let langV = LIB.languageValueOf(this.values[0], { targetLanguage: localOpts.targetLanguage, dontReturnDefaultValue: true });
                                if (langV) {
                                    langV.text = val;
                                    langV.language = localOpts.targetLanguage;
                                }
                                else {
                                    this.values[0].push({ text: val, language: localOpts.targetLanguage });
                                }
                                ;
                                return { class: LIB.makeKey(this.pC.id), values: this.values };
                            }
                            ;
                            return { class: LIB.makeKey(this.pC.id), values: [[{ text: val, language: localOpts.targetLanguage }]] };
                        }
                        ;
                        return { class: LIB.makeKey(this.pC.id), values: [[{ text: val }]] };
                    }
                    ;
                    return { class: LIB.makeKey(this.pC.id), values: [] };
                }
                ;
            case XsDataType.Boolean:
                val = booleanValue(ti).toString();
                return { class: LIB.makeKey(this.pC.id), values: [val] };
            default:
                val = textValue(ti);
                return { class: LIB.makeKey(this.pC.id), values: (LIB.hasContent(val) ? [val] : []) };
        }
        ;
    }
}
class CResourceToEdit {
    constructor(el) {
        this.selPrj = app.projects.selected;
        this.id = el.id;
        this.rC = LIB.getExtendedClasses(this.selPrj.cache.get("resourceClass", "all"), [el['class']])[0];
        this.language = el.language || this.selPrj.language;
        this.dialogForm = new CCheckDialogInput();
        this.properties = LIB.forAll(el.properties, (pr) => { return new CPropertyToEdit(pr, this.rC); });
        this.newFiles = [];
    }
    editForm(opts) {
        if (this.properties.length > 0) {
            let localOpts = {
                lookupTitles: true,
                targetLanguage: this.language
            }, editOpts = Object.assign({
                dialogForm: this.dialogForm,
            }, opts);
            new BootstrapDialog({
                title: opts.dialogTitle,
                type: 'type-primary',
                size: BootstrapDialog.SIZE_WIDE,
                onshown: () => { setFocus(app.ontology.localize(CONFIG.propClassTitle, localOpts)); this.check(); },
                message: () => {
                    var form = '<div style="max-height:' + ($('#app').outerHeight(true) - 190) + 'px; overflow:auto" >';
                    this.properties.forEach((p) => { form += p.editField(editOpts); });
                    form += '</div>';
                    return $(form);
                },
                buttons: opts.msgBtns
            })
                .open();
        }
    }
    check() {
        let ok = this.dialogForm.check();
        Array.from(document.getElementsByClassName('btn-modal-save'), (btn) => { btn.disabled = !ok; });
    }
    ;
    updateDiagram(cId) {
        let f = document.getElementById("file" + simpleHash(cId)).files[0];
        readFile(f, (data) => {
            let fType = f.type || LIB.attachment2mediaType(f.name), fName = 'files_and_images/' + f.name, newFile = new CFileWithContent({ blob: data, id: 'F-' + simpleHash(fName), title: fName, type: fType, changedAt: new Date(f.lastModified).toISOString() });
            LIB.itemBy(this.properties, 'class', LIB.makeKey(cId))
                .values = [LIB.makeMultiLanguageValue('<object data="' + fName + '" type="' + fType + '">' + fName + '</object>')];
            this.newFiles.push(newFile);
            document.getElementById(tagId(cId)).innerHTML = '<div class="forImagePreview ' + tagId(fName) + '">' + newFile.renderImage() + '</div>';
        });
        return;
        function readFile(f, fn) {
            const rdr = new FileReader();
            rdr.onload = () => {
                fn(new Blob([rdr.result], { type: f.type }));
            };
            rdr.readAsArrayBuffer(f);
        }
    }
    removeDiagram(cId) {
        LIB.itemBy(this.properties, 'class', LIB.makeKey(cId)).values = [];
        document.getElementById(tagId(cId)).innerHTML = '';
    }
    getNewFiles() {
        return this.newFiles;
    }
    getEditedProperties() {
        let editedProps = LIB.forAll(this.properties, (p) => {
            return p.getEditedValue({ targetLanguage: this.language });
        });
        return editedProps;
    }
}
moduleManager.construct({
    name: CONFIG.resourceEdit
}, (self) => {
    "use strict";
    self.init = () => {
        self.clear();
        return true;
    };
    self.clear = () => {
    };
    let msgBtns = {
        cancel: {
            id: 'btn-modal-cancel',
            label: i18n.BtnCancel,
            action: (thisDlg) => {
                self.parent.doRefresh({ forced: true });
                thisDlg.close();
            }
        },
        update: {
            id: 'btn-modal-update',
            label: i18n.BtnUpdateObject,
            cssClass: 'btn-success btn-modal-save',
            action: (thisDlg) => {
                save('update');
                thisDlg.close();
            }
        },
        insert: {
            id: 'btn-modal-insert',
            label: i18n.BtnInsert,
            cssClass: 'btn-success btn-modal-save',
            action: (thisDlg) => {
                save('insert');
                thisDlg.close();
            }
        },
        insertAfter: {
            id: 'btn-modal-insertAfter',
            label: i18n.BtnInsertSuccessor,
            cssClass: 'btn-success btn-modal-save',
            action: (thisDlg) => {
                save('insertAfter');
                thisDlg.close();
            }
        },
        insertBelow: {
            id: 'btn-modal-insertBelow',
            label: i18n.BtnInsertChild,
            cssClass: 'btn-success btn-modal-save',
            action: (thisDlg) => {
                save('insertBelow');
                thisDlg.close();
            }
        }
    };
    self.show = (opts) => {
        self.clear();
        self.localOpts = Object.assign({
            myFullName: 'app.' + self.loadAs + '.toEdit'
        }, opts);
        if (self.parent.tree.selectedNode)
            self.localOpts.selNodeId = self.parent.tree.selectedNode.id;
        switch (self.localOpts.mode) {
            case 'create':
                selectResClass(self.localOpts)
                    .then((rC) => {
                    self.localOpts.dialogTitle = i18n.MsgCreateResource + ' (' + rC.title + ')';
                    return app.projects.selected.makeEmptyResource(rC);
                })
                    .then((r) => {
                    self.newRes = r;
                    if (app.me.userName != CONFIG.userNameAnonymous)
                        self.newRes.createdBy = app.me.userName;
                    if (self.localOpts.selNodeId)
                        self.localOpts.msgBtns = [
                            msgBtns.cancel,
                            msgBtns.insertAfter,
                            msgBtns.insertBelow
                        ];
                    else
                        self.localOpts.msgBtns = [
                            msgBtns.cancel,
                            msgBtns.insert
                        ];
                    finalize();
                })
                    .catch(LIB.stdError);
                break;
            case 'clone':
            case 'update':
                app.projects.selected.readItems('resource', [self.parent.tree.selectedNode.ref], { showEmptyProperties: true })
                    .then((rL) => {
                    self.newRes = rL[0];
                    if (self.localOpts.mode == 'clone') {
                        self.newRes.id = LIB.genID(CONFIG.prefixR);
                        self.localOpts.dialogTitle = i18n.MsgCloneResource,
                            self.localOpts.msgBtns = [
                                msgBtns.cancel,
                                msgBtns.insertAfter,
                                msgBtns.insertBelow
                            ];
                    }
                    else {
                        if (rL[0].revision)
                            self.newRes.replaces = [rL[0].revision];
                        self.localOpts.dialogTitle = i18n.MsgUpdateResource;
                        self.localOpts.msgBtns = [
                            msgBtns.cancel,
                            msgBtns.update
                        ];
                    }
                    ;
                    finalize();
                })
                    .catch(LIB.stdError);
        }
        ;
        return;
        function finalize() {
            self.toEdit = new CResourceToEdit(self.newRes);
            self.toEdit.editForm(self.localOpts);
        }
        function selectResClass(opts) {
            return new Promise((resolve, reject) => {
                app.projects.selected.readItems('resourceClass', LIB.forAll(opts.eligibleResourceClasses, (rCId) => { return LIB.makeKey(rCId); }))
                    .then((rCL) => {
                    if (rCL.length > 0) {
                        let resClasses = LIB.forAll(rCL, (rC) => { rC.title = LIB.titleOf(rC, { lookupTitles: true, targetLanguage: app.projects.selected.language }); return rC; });
                        if (resClasses.length > 1) {
                            resClasses[0].checked = true;
                            new BootstrapDialog({
                                title: i18n.MsgSelectResClass,
                                type: 'type-primary',
                                message: () => {
                                    var form = '<form id="attrInput" role="form" >'
                                        + makeRadioField(i18n.LblResourceClass, resClasses)
                                        + '</form>';
                                    return $(form);
                                },
                                buttons: [{
                                        label: i18n.BtnCancel,
                                        action: (thisDlg) => {
                                            reject({ status: 0, statusText: 'Create Resource cancelled by the user' });
                                            thisDlg.close();
                                        }
                                    }, {
                                        label: i18n.LblNextStep,
                                        cssClass: 'btn-success',
                                        action: (thisDlg) => {
                                            resolve(LIB.itemById(resClasses, radioValue(i18n.LblResourceClass)));
                                            thisDlg.close();
                                        }
                                    }]
                            })
                                .open();
                        }
                        else {
                            resolve(resClasses[0]);
                        }
                    }
                    else {
                        reject({ status: 999, statusText: "No resource class defined for manual creation of a resource." });
                    }
                    ;
                }, reject);
            });
        }
    };
    self.hide = () => {
    };
    function save(mode) {
        let pend = 2, chD = new Date().toISOString();
        self.toEdit.getEditedProperties().forEach((nP) => {
            let i = LIB.indexBy(self.newRes.properties, 'class', nP['class']);
            if (i > -1)
                self.newRes.properties.splice(i, 1, nP);
            else
                throw Error('Programming error: Edited property does not replace an existing');
        });
        self.newRes.properties = LIB.forAll(self.newRes.properties, (p) => {
            if (p.values.length > 0)
                return p;
        });
        self.newRes.changedAt = chD;
        if (app.me.userName != CONFIG.userNameAnonymous)
            self.newRes.changedBy = app.me.userName;
        self.newRes.revision = "rev-" + simpleHash(chD);
        switch (mode) {
            case 'update':
                app.projects.selected.updateItems('resource', [self.newRes])
                    .then(finalize, LIB.stdError);
                break;
            default:
                app.projects.selected.createItems('resource', [self.newRes])
                    .then(finalize, LIB.stdError);
        }
        ;
        switch (mode) {
            case 'insert':
                pend++;
                app.projects.selected.createItems('node', [{ id: LIB.genID(CONFIG.prefixN), resource: LIB.makeKey(self.newRes.id), changedAt: chD }])
                    .then(finalize, LIB.stdError);
                break;
            case 'insertAfter':
                pend++;
                app.projects.selected.createItems('node', [{ id: LIB.genID(CONFIG.prefixN), resource: LIB.makeKey(self.newRes.id), changedAt: chD, predecessor: self.localOpts.selNodeId }])
                    .then(finalize, LIB.stdError);
                break;
            case 'insertBelow':
                pend++;
                app.projects.selected.createItems('node', [{ id: LIB.genID(CONFIG.prefixN), resource: LIB.makeKey(self.newRes.id), changedAt: chD, parent: self.localOpts.selNodeId }])
                    .then(finalize, LIB.stdError);
        }
        ;
        app.projects.selected.createItems('file', self.toEdit.getNewFiles())
            .then(finalize, LIB.stdError);
        return;
        function finalize() {
            if (--pend < 1) {
                self.parent.updateTree({
                    targetLanguage: self.newRes.language || browser.language
                });
                let selNd = self.parent.tree.selectedNode;
                if (selNd) {
                    switch (mode) {
                        case 'insertBelow':
                            self.parent.tree.openNode();
                        case 'insertAfter':
                            self.parent.tree.selectNode(selNd.getNextNode());
                    }
                }
                else {
                    self.parent.tree.selectFirstNode();
                }
                ;
                self.parent.doRefresh({ forced: true });
            }
        }
    }
    ;
    return self;
});
