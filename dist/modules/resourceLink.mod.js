"use strict";
/*!	SpecIF: Link Resources.
    Dependencies: jQuery, bootstrap
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    Author: se@enso-managers.de, Berlin
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/
moduleManager.construct({
    name: CONFIG.resourceLink
}, (self) => {
    "use strict";
    let myName = self.loadAs, myFullName = 'app.' + myName, selPrj, cData, selRes, opts;
    self.eligibleSCL = [];
    self.selResStatements = [];
    self.allResources = [];
    function candidateMayBeObject(sC, res) {
        return (!sC.subjectClasses || LIB.indexByKey(sC.subjectClasses, selRes['class']) > -1)
            && (!sC.objectClasses || LIB.indexByKey(sC.objectClasses, res['class']) > -1);
    }
    function candidateMayBeSubject(sC, res) {
        return (!sC.objectClasses || LIB.indexByKey(sC.objectClasses, selRes['class']) > -1)
            && (!sC.subjectClasses || LIB.indexByKey(sC.subjectClasses, res['class']) > -1);
    }
    self.init = () => {
        self.clear();
        return true;
    };
    self.clear = () => {
        self.eligibleSCL.length = 0;
        self.selResStatements.length = 0;
        self.allResources.length = 0;
    };
    self.show = (options) => {
        self.clear();
        selPrj = app.projects.selected;
        cData = selPrj.cache;
        opts = Object.assign({}, options, {
            targetLanguage: browser.language,
            addIcon: true
        });
        selPrj.readItems('resource', [self.parent.tree.selectedNode.ref])
            .then((rL) => {
            selRes = rL[0];
            createStatement(opts);
        }, LIB.stdError);
        return;
        function createStatement(opts) {
            let pend = 3;
            self.eligibleSCL.length = 0;
            opts.eligibleStatementClasses.subjectClasses.concat(opts.eligibleStatementClasses.objectClasses).forEach((sCk) => { LIB.cacheE(self.eligibleSCL, sCk); });
            selPrj.readItems('statementClass', self.eligibleSCL, { extendClasses: true })
                .then((list) => {
                self.eligibleSCL = list;
                chooseResourceToLink();
            }, LIB.stdError);
            selPrj.readStatementsOf(LIB.keyOf(selRes))
                .then((list) => {
                self.selResStatements = list;
                chooseResourceToLink();
            }, LIB.stdError);
            self.allResources.length = 0;
            LIB.iterateNodes(cData.get("hierarchy", selPrj.hierarchies)
                .filter((h) => {
                return LIB.typeOf(h.resource, cData) != CONFIG.resClassUnreferencedResources;
            }), (nd) => {
                LIB.cacheE(self.allResources, nd.resource);
                return true;
            });
            selPrj.readItems('resource', self.allResources)
                .then((list) => {
                LIB.sortBy(list, (el) => { return cData.instanceTitleOf(el, opts); });
                self.allResources = list;
                chooseResourceToLink();
            }, LIB.stdError);
            return;
            function chooseResourceToLink() {
                if (--pend < 1) {
                    let staClasses = LIB.forAll(self.eligibleSCL, (sC) => {
                        return {
                            title: LIB.titleOf(sC, { lookupTitles: true, targetLanguage: selPrj.language }),
                            description: sC.description
                        };
                    });
                    staClasses[0].checked = true;
                    new BootstrapDialog({
                        title: i18n.MsgCreateStatement,
                        type: 'type-primary',
                        size: BootstrapDialog.SIZE_WIDE,
                        onshown: () => { app[myName].filterClicked(); },
                        message: () => {
                            var form = '<div class="row" style="margin: 0 -4px 0 -4px">'
                                + '<div class="col-sm-12 col-md-6" style="padding: 0 4px 0 4px"><div class="panel panel-default panel-options" style="margin-bottom:0">'
                                + makeRadioField(i18n.LblStatementClass, staClasses, { handle: myFullName + '.filterClicked()' })
                                + makeTextField(i18n.TabFilter, '', { typ: 'line', handle: myFullName + '.filterClicked()' })
                                + '</div></div>'
                                + '<div class="col-sm-12 col-md-6" style="padding: 0 4px 0 4px"><div class="panel panel-default panel-options" style="margin-bottom:0">'
                                + '<div id="resCandidates" style="max-height:' + ($('#app').outerHeight(true) - 220) + 'px; overflow:auto" >'
                                + '</div></div>'
                                + '</div>';
                            return $(form);
                        },
                        buttons: [{
                                label: i18n.BtnCancel,
                                action: (thisDlg) => {
                                    thisDlg.close();
                                }
                            }, {
                                id: 'btn-modal-saveResourceAsSubject',
                                label: i18n.IcoAdd + '&#160;' + i18n.LblSaveRelationAsSource,
                                cssClass: 'btn-success',
                                action: (thisDlg) => {
                                    self.saveStatement({ secondAs: 'subject' })
                                        .then(() => {
                                        self.parent.doRefresh({ forced: true });
                                    }, LIB.stdError);
                                    thisDlg.close();
                                }
                            }, {
                                id: 'btn-modal-saveResourceAsObject',
                                label: i18n.IcoAdd + '&#160;' + i18n.LblSaveRelationAsTarget,
                                cssClass: 'btn-success',
                                action: (thisDlg) => {
                                    self.saveStatement({ secondAs: 'object' })
                                        .then(() => {
                                        self.parent.doRefresh({ forced: true });
                                    }, LIB.stdError);
                                    thisDlg.close();
                                }
                            }]
                    })
                        .open();
                }
            }
        }
    };
    self.hide = () => {
        self.clear();
    };
    self.filterClicked = () => {
        self.selectedStatementClass = self.eligibleSCL[radioValue(i18n.LblStatementClass)];
        setFocus(i18n.TabFilter);
        let eligibleRs = '', searchStr = textValue(i18n.TabFilter), reTi = new RegExp(searchStr.escapeRE(), 'i');
        let sL = self.selResStatements.filter((s) => { return LIB.references(s['class'], self.selectedStatementClass); });
        self.allResources.forEach((res, i) => {
            if (res.id != selRes.id
                && LIB.referenceIndexBy(sL, 'subject', res) < 0
                && LIB.referenceIndexBy(sL, 'object', res) < 0
                && (candidateMayBeObject(self.selectedStatementClass, res)
                    || candidateMayBeSubject(self.selectedStatementClass, res))) {
                let ti = cData.instanceTitleOf(res, $.extend({}, opts, { neverEmpty: true }));
                if (reTi.test(ti))
                    eligibleRs += '<div id="cand-' + i + '" class="candidates" onclick="' + myFullName + '.itemClicked(\'' + i + '\')">' + ti + '</div>';
            }
        });
        document.getElementById("resCandidates").innerHTML = eligibleRs || "<em>" + i18n.MsgNoMatchingObjects + "</em>";
        document.getElementById("btn-modal-saveResourceAsObject").disabled = true;
        document.getElementById("btn-modal-saveResourceAsSubject").disabled = true;
    };
    self.itemClicked = (idx) => {
        if (self.selectedCandidate && !LIB.equalKey(self.selectedCandidate.resource, self.allResources[idx])) {
            self.selectedCandidate.div.style.background = 'white';
            self.selectedCandidate.div.style.color = 'black';
        }
        ;
        let el = document.getElementById("cand-" + idx);
        el.style.background = CONFIG.focusColor;
        el.style.color = 'white';
        self.selectedCandidate = { resource: self.allResources[idx], div: el };
        let btn = document.getElementById("btn-modal-saveResourceAsObject");
        if (candidateMayBeObject(self.selectedStatementClass, self.selectedCandidate.resource)) {
            btn.disabled = false;
            btn.setAttribute("data-toggle", "popover");
            btn.setAttribute("title", "'" + cData.instanceTitleOf(selRes, opts) + "' "
                + LIB.titleOf(self.selectedStatementClass, opts) + " '"
                + cData.instanceTitleOf(self.selectedCandidate.resource, opts) + "'");
        }
        else {
            btn.disabled = true;
        }
        ;
        btn = document.getElementById("btn-modal-saveResourceAsSubject");
        if (candidateMayBeSubject(self.selectedStatementClass, self.selectedCandidate.resource)) {
            btn.disabled = false;
            btn.setAttribute("data-toggle", "popover");
            btn.setAttribute("title", "'" + cData.instanceTitleOf(self.selectedCandidate.resource, opts) + "' "
                + LIB.titleOf(self.selectedStatementClass, opts) + " '"
                + cData.instanceTitleOf(selRes, opts) + "'");
        }
        else {
            btn.disabled = true;
        }
        ;
    };
    self.saveStatement = (dir) => {
        let sta = {
            id: LIB.genID(CONFIG.prefixS),
            class: LIB.makeKey(self.selectedStatementClass.id),
            subject: LIB.makeKey(dir.secondAs == 'object' ? selRes.id : self.selectedCandidate.resource.id),
            object: LIB.makeKey(dir.secondAs == 'object' ? self.selectedCandidate.resource.id : selRes.id),
            changedAt: new Date().toISOString()
        };
        if (self.selectedStatementClass.propertyClasses && self.selectedStatementClass.propertyClasses.length > 0) {
        }
        ;
        return selPrj.createItems('statement', [sta]);
    };
    return self;
});
