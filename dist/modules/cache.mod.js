"use strict";
/*!	Cache Library for SpecIF data.
    Dependencies: jQuery
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    Author: se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/
class CCache {
    constructor(opts) {
        this.dataTypes = [];
        this.propertyClasses = [];
        this.resourceClasses = [];
        this.statementClasses = [];
        this.resources = [];
        this.statements = [];
        this.hierarchies = [];
        this.files = [];
        this.cacheInstances = opts.cacheInstances;
    }
    length(ctg) {
        return this[app.standards.listName.get(ctg)].length;
    }
    has(ctg, rL) {
        let L = this[app.standards.listName.get(ctg)];
        for (var i = rL.length - 1; i > -1; i--) {
            if (LIB.indexByKey(L, rL[i]) < 0)
                return false;
        }
        ;
        return true;
    }
    put(ctg, itmL) {
        if (!Array.isArray(itmL))
            throw Error("Programming Error: " + JSON.stringify(itmL) + " is not a list.");
        if (itmL.length < 1)
            return [];
        function putItemL(L, es) {
            let isCached = [];
            for (var e of es)
                isCached.push(cacheIfNewerE(L, e));
            return isCached;
            function cacheIfNewerE(L, e) {
                if (typeof (e) != 'object' || !e.id)
                    throw Error("Cache 'put' operation with old reference (string instead of object with id)");
                let n = LIB.indexById(L, e.id);
                if (n < 0
                    || L[n].changedAt && e.changedAt && new Date(L[n].changedAt) < new Date(e.changedAt)
                    || L[n].resourceToLink && !e.resourceToLink) {
                    LIB.cacheE(L, e);
                    return true;
                }
                ;
                return false;
            }
        }
        switch (ctg) {
            case 'hierarchy':
            case 'dataType':
            case 'propertyClass':
            case 'resourceClass':
            case 'statementClass':
                return putItemL(this[app.standards.listName.get(ctg)], itmL);
            case 'resource':
            case 'statement':
            case 'file':
                if (this.cacheInstances) {
                    return putItemL(this[app.standards.listName.get(ctg)], itmL);
                }
                ;
                return itmL.map(itm => false);
            case 'node':
                let isHierarchyRoot = [];
                itmL.forEach((n) => { isHierarchyRoot.push(this.putNode(n)); });
                return isHierarchyRoot;
            default:
                throw Error("Invalid category '" + ctg + "'.");
        }
    }
    get(ctg, req) {
        if (req) {
            let itmL = this[app.standards.listName.get(ctg)];
            if (Array.isArray(req)) {
                let idx, rL = [];
                for (var k of req) {
                    idx = LIB.indexByKey(itmL, k);
                    if (idx > -1)
                        rL.push(itmL[idx]);
                    else
                        console.error("Cache: Requested element with id '" + k.id + "' of category '" + ctg + "' not found");
                }
                ;
                return simpleClone(rL);
            }
            else if (typeof (req) == 'function') {
                return simpleClone(itmL.filter(req));
            }
            else if (req === "all") {
                if (['resource', 'statement', 'file'].includes(ctg))
                    console.warn("Cache 'get' operation called for 'all' items of category '" + ctg + "'.");
                return simpleClone(itmL);
            }
            ;
        }
        ;
        return [];
    }
    delete(ctg, itemL) {
        switch (ctg) {
            case 'hierarchy':
            case 'dataType':
            case 'propertyClass':
            case 'resourceClass':
            case 'statementClass':
                return LIB.uncacheL(this[app.standards.listName.get(ctg)], itemL);
            case 'resource':
            case 'statement':
            case 'file':
                if (this.cacheInstances)
                    return LIB.uncacheL(this[app.standards.listName.get(ctg)], itemL);
                return true;
            case 'node':
                itemL.forEach((el) => { delNodes(this.hierarchies, el); });
                return true;
            default:
                throw Error("Invalid category '" + ctg + "'.");
        }
        ;
        function delNodes(L, el) {
            if (Array.isArray(L))
                for (var h = L.length - 1; h > -1; h--) {
                    if (L[h].id == el.id || L[h].resource == el.resource) {
                        L.splice(h, 1);
                        break;
                    }
                    ;
                    delNodes(L[h].nodes, el);
                }
            ;
        }
    }
    putNode(e) {
        if (!e.predecessor && !e['parent'] && LIB.iterateNodes(this.hierarchies, (nd) => { return nd.id != e.id; }, (ndL) => {
            let i = LIB.indexById(ndL, e.id);
            if (i > -1) {
                ndL.splice(i, 1, e);
            }
            ;
        }))
            return LIB.indexByKey(this.hierarchies, e) > -1;
        this.delete('node', [LIB.keyOf(e)]);
        if (e.predecessor && LIB.iterateNodes(this.hierarchies, (nd) => { return nd.id != e.predecessor; }, (ndL) => {
            let i = LIB.indexById(ndL, e.predecessor);
            if (i > -1) {
                delete e.predecessor;
                ndL.splice(i + 1, 0, e);
            }
            ;
        }))
            return LIB.indexByKey(this.hierarchies, e) > -1;
        if (e['parent'] && LIB.iterateNodes(this.hierarchies, (nd) => {
            if (nd.id == e['parent']) {
                delete e['parent'];
                if (Array.isArray(nd.nodes))
                    nd.nodes.unshift(e);
                else
                    nd.nodes = [e];
                return false;
            }
            ;
            return true;
        }))
            return false;
        this.hierarchies.unshift(e);
        return true;
    }
    instanceTitleOf(el, opts) {
        var self = this;
        return function (el, opts) {
            if (typeof (el) != 'object')
                throw Error('First input parameter is invalid');
            if (!(el.properties || el['class']))
                return '';
            let ti = "";
            if (el.subject) {
                ti = LIB.titleFromProperties(el.properties, self.propertyClasses, opts)
                    || LIB.classTitleOf(el['class'], self.statementClasses, opts);
            }
            else {
                let rC = LIB.itemByKey(self.resourceClasses, el['class']);
                ti = LIB.titleFromProperties(el.properties, self.propertyClasses, {
                    lookupValues: opts.lookupValues && rC && rC.isHeading,
                    targetLanguage: opts.targetLanguage
                });
                if (ti) {
                    if (opts && opts.addIcon && CONFIG.addIconToInstance)
                        ti = LIB.addIcon(ti, rC.icon);
                }
                else {
                    ti = (LIB.valueByTitle(el, CONFIG.propClassDesc, self) || '')
                        .substring(0, CONFIG.treeMaxTitleLength);
                }
            }
            ;
            return ti.stripHTML();
        }(el, opts) || (opts.neverEmpty ? el.id : '');
    }
    resourcesByTitle(ti, opts) {
        if (ti) {
            return this.resources.filter((r) => {
                if (opts.targetLanguage == 'any') {
                    let tiVL = LIB.valuesByTitle(r, CONFIG.titleProperties, this);
                    if (tiVL.length > 1)
                        console.warn("Resource " + r.id + " has more than one title property");
                    if (tiVL.length > 0)
                        for (var v of tiVL[0]) {
                            if (v.text == ti)
                                return true;
                        }
                    ;
                    return false;
                }
                else
                    return this.instanceTitleOf(r, opts) == ti;
            });
        }
        else
            return [];
    }
    clear(ctg) {
        if (ctg)
            this[app.standards.listName.get(ctg)].length = 0;
        else
            for (var le of app.standards.listName.keys())
                this[app.standards.listName.get(le)].length = 0;
    }
}
class CItem {
    constructor(ctg, eqF, compF, subsF) {
        this.category = ctg;
        this.listName = app.standards.listName.get(ctg);
        this.isEqual = eqF;
        this.isCompatible = compF;
        this.substitute = subsF;
    }
}
const noPermission = { C: false, E: false, R: false, U: false, D: false };
class CPermission {
    constructor(iId, prm) {
        this.item = iId;
        this.permissionVector = {
            C: prm.includes('C'),
            E: prm.includes('E'),
            R: prm.includes('R'),
            U: prm.includes('U'),
            D: prm.includes('D')
        };
    }
}
class CProjectRole {
    constructor(roleName) {
        this.permissions = [];
        this.id = roleName.toJsId();
        this.title = roleName;
    }
    setPermissions(iId, prm) {
        if (iId) {
            let idx = LIB.indexBy(this.permissions, 'item', iId);
            if (idx > -1)
                this.permissions[idx] = new CPermission(iId, prm);
            else
                this.permissions.push(new CPermission(iId, prm));
        }
        ;
        return this;
    }
}
class CRoleAssignment {
    constructor(prj, roleName) {
        this.project = '';
        this.role = '';
        this.project = prj;
        this.role = roleName;
    }
}
class CProject {
    constructor(cData) {
        this.roles = [];
        this.myPermissions = [];
        this.dataTypes = [];
        this.propertyClasses = [];
        this.resourceClasses = [];
        this.statementClasses = [];
        this.hierarchies = [];
        this.cache = cData;
        this.exporting = false;
        this.abortFlag = false;
        this.types = [
            new CItem('dataType', LIB.equalDT, this.compatibleDT.bind(this), this.substituteDT.bind(this)),
            new CItem('propertyClass', LIB.equalPC, this.compatiblePC.bind(this), this.substitutePC.bind(this)),
            new CItem('resourceClass', LIB.equalRC, this.compatibleRC.bind(this), this.substituteRC.bind(this)),
            new CItem('statementClass', LIB.equalSC, this.compatibleSC.bind(this), this.substituteSC.bind(this))
        ];
    }
    ;
    isLoaded() {
        return typeof (this.id) == 'string' && this.id.length > 0;
    }
    ;
    setMeta(spD) {
        this.id = spD.id;
        this.$schema = spD.$schema;
        this.title = spD.title;
        this.description = spD.description;
        this.language = spD.language || browser.language;
        this.generator = spD.generator;
        this.generatorVersion = spD.generatorVersion;
        this.createdAt = spD.createdAt;
        this.createdBy = spD.createdBy;
        this.exportParams = {
            projectName: LIB.languageTextOf(this.title, { targetLanguage: this.language }),
            fileName: LIB.languageTextOf(this.title, { targetLanguage: this.language })
        };
        ["hierarchies", "resourceClasses", "statementClasses", "propertyClasses", "dataTypes"].forEach((list) => {
            for (var p of spD[list])
                this[list].push({ id: p.id });
        });
        function findPrp(ti) {
            for (var pC of spD.propertyClasses) {
                if (ti == app.ontology.normalize("propertyClass", pC.title))
                    return pC.id;
            }
        }
        if (spD.roles) {
            this.roles = spD.roles;
        }
        else {
            this.roles.push(new CProjectRole("SpecIF:Reader")
                .setPermissions(spD.id, 'R'));
            this.roles.push(new CProjectRole("SpecIF:Editor")
                .setPermissions(spD.id, 'CRUD'));
            let supS = findPrp("ReqIF-WF.SupplierStatus"), supC = findPrp("ReqIF-WF.SupplierComment");
            if (supS || supC) {
                this.roles.push(new CProjectRole("ReqIF-WF.Supplier")
                    .setPermissions(spD.id, 'R')
                    .setPermissions(supS, 'RU')
                    .setPermissions(supC, 'RU'));
                this.roles.push(new CProjectRole("ReqIF-WF.Customer")
                    .setPermissions(spD.id, 'CRUD')
                    .setPermissions(supS, 'R')
                    .setPermissions(supC, 'R'));
            }
            ;
        }
        ;
        let role = LIB.itemById(this.roles, app.me.myRole(spD.id).toJsId());
        if (role)
            this.myPermissions = role.permissions;
    }
    ;
    getMeta() {
        var spD = new CSpecIF();
        spD.id = this.id;
        spD.title = this.title;
        spD.description = this.description;
        spD.generator = this.generator;
        spD.generatorVersion = this.generatorVersion;
        spD.createdAt = this.createdAt;
        spD.createdBy = this.createdBy;
        return spD;
    }
    ;
    create(newD, opts) {
        var cDO = $.Deferred(), self = this, pend = 0;
        this.abortFlag = false;
        new CSpecIF().set(newD, opts)
            .then((nD) => {
            cDO.notify(i18n.MsgLoadingTypes, 30);
            this.setMeta(nD);
            pend = app.standards.iterateLists((ctg, listName) => {
                this.createItems(ctg, nD[listName])
                    .then(finalize, cDO.reject);
            });
        }, cDO.reject);
        return cDO;
        function finalize() {
            if (--pend < 1) {
                cDO.notify(i18n.MsgLoadingFiles, 100);
                self.hookStatements();
                self.deduplicate(opts);
                self.createFolderWithGlossary(opts)
                    .then(() => {
                    return self.createFolderWithUnreferencedResources(opts);
                })
                    .then(cDO.resolve)
                    .catch(cDO.reject);
            }
        }
    }
    read(opts) {
        var exD = this.getMeta();
        return new Promise((resolve, reject) => {
            this.readItems('hierarchy', this.hierarchies.filter((n) => { return !n.id.includes("FolderUnreferencedResources-"); }), opts)
                .then((hL) => {
                exD.hierarchies = hL;
                return this.readItems('resource', LIB.referencedResources(this.cache.resources, hL), opts);
            })
                .then((rL) => {
                exD.resources = rL;
                return this.readItems('statement', flt, opts);
                function flt(s) {
                    return LIB.indexByKey(rL, s.subject) > -1 && LIB.indexByKey(rL, s.object) > -1;
                }
            })
                .then((sL) => {
                exD.statements = sL;
                return this.readItems('statement', flt, opts);
                function flt(s) {
                    let L = exD.resources.concat(sL);
                    return LIB.indexByKey(L, s.subject) > -1 && LIB.indexByKey(sL, s.object) > -1
                        || LIB.indexByKey(sL, s.subject) > -1 && LIB.indexByKey(L, s.object) > -1;
                }
            })
                .then((sL) => {
                exD.statements = exD.statements.concat(sL);
                let rCL = [].concat(this.resourceClasses), rcLen = this.resourceClasses.length;
                for (var r of exD.resources) {
                    LIB.cacheE(rCL, r['class']);
                    if (rcLen < rCL.length) {
                        console.warn('Project with id ' + this.id + ' references a resource with id ' + r.id + ', which has a resourceClass not memorized in the project.');
                        rcLen = rCL.length;
                    }
                    ;
                }
                ;
                return this.readItems('resourceClass', rCL, opts);
            })
                .then((rCL) => {
                exD.resourceClasses = rCL;
                let sCL = [].concat(this.statementClasses), scLen = this.statementClasses.length;
                for (var s of exD.statements) {
                    LIB.cacheE(sCL, s['class']);
                    if (scLen < sCL.length) {
                        console.warn('Project with id ' + this.id + ' references a statement with id ' + s.id + ', which has a statementClass not memorized in the project.');
                        scLen = sCL.length;
                    }
                }
                ;
                return this.readItems('statementClass', sCL, opts);
            })
                .then((sCL) => {
                exD.statementClasses = sCL;
                let pCL = [].concat(this.propertyClasses);
                for (var eC of exD.resourceClasses.concat(exD.statementClasses)) {
                    for (var pC of eC.propertyClasses) {
                        LIB.cacheE(pCL, pC);
                    }
                }
                ;
                return this.readItems('propertyClass', pCL, opts);
            })
                .then((pCL) => {
                exD.propertyClasses = pCL;
                let dTL = [].concat(this.dataTypes);
                for (var pC of exD.propertyClasses) {
                    LIB.cacheE(dTL, pC['dataType']);
                }
                ;
                return this.readItems('dataType', dTL, opts);
            })
                .then((dTL) => {
                exD.dataTypes = dTL;
                let fL = [], dT;
                for (var r of exD.resources) {
                    for (var p of r.properties) {
                        dT = LIB.dataTypeOf(p['class'], this.cache);
                        if (dT && dT.type == XsDataType.String) {
                            for (var v of p.values) {
                                for (var l of v) {
                                    let re = /data="([^"]+)"/g, mL;
                                    while ((mL = re.exec(l.text)) !== null) {
                                        LIB.cacheE(fL, mL[1]);
                                    }
                                }
                            }
                        }
                    }
                }
                ;
                return this.readItems('file', (f) => { return fL.includes(f.title); }, opts);
            })
                .then((fL) => {
                exD.files = fL;
                return exD.get(opts);
            })
                .then(resolve)
                .catch(reject);
        });
    }
    typesAreCompatible(newD) {
        let idx, refC;
        for (var ctg of this.types) {
            let refL = this.cache.get(ctg.category, this[ctg.listName]);
            for (var ty of newD[ctg.listName]) {
                idx = LIB.indexById(refL, ty.id);
                if (idx < 0)
                    continue;
                refC = simpleClone(refL[idx]);
                ty = simpleClone(ty);
                if (['resourceClass', 'statementClass'].includes(ctg.category)) {
                    ty = LIB.getExtendedClasses(newD[ctg.listName], [LIB.keyOf(ty)])[0];
                    refC = LIB.getExtendedClasses(refL, [LIB.keyOf(refC)])[0];
                }
                if (ty.changedAt == refC.changedAt) {
                    if (ctg.isEqual(refC, ty))
                        continue;
                    else {
                        console.warn('Items with same change date are not equal: ' + refC.id + ' and ' + ty.id + '.');
                        return false;
                    }
                }
                ;
                if (ty.changedAt > refC.changedAt) {
                    if (ctg.isCompatible(ty, refC, { mode: "include" }))
                        continue;
                    else
                        return false;
                }
                ;
                if (ctg.isCompatible(refC, ty, { mode: "include" }))
                    continue;
                else
                    return false;
            }
            ;
        }
        ;
        return true;
    }
    update(newD, opts) {
        var uDO = $.Deferred(), self = this, pend = 0;
        new CSpecIF().set(newD, opts)
            .then((newD) => {
            if (this.typesAreCompatible(newD)) {
                console.info('Update - classes are compatible');
                pend = app.standards.iterateLists((ctg, listName) => {
                    this.updateItems(ctg, newD[listName])
                        .then(finalize, uDO.reject);
                });
            }
            else {
                uDO.reject('Automatic update is not possible, because types are incompatible');
                return;
            }
            ;
        })
            .catch(uDO.reject);
        return uDO;
        function finalize() {
            if (--pend < 1) {
                uDO.notify(i18n.MsgLoadingFiles, 100);
                self.hookStatements();
                self.deduplicate(opts);
                self.createFolderWithGlossary(opts)
                    .then(() => {
                    return self.createFolderWithUnreferencedResources(opts);
                })
                    .then(uDO.resolve)
                    .catch(uDO.reject);
            }
        }
    }
    adopt(newD, opts) {
        var aDO = $.Deferred(), self = this, dta = this.cache, pend = 0;
        new CSpecIF().set(newD, opts)
            .then((newD) => {
            for (var ty of self.types) {
                if (Array.isArray(newD[ty.listName])) {
                    let itmL = [];
                    for (var newT of newD[ty.listName]) {
                        let idx = LIB.indexById(dta[ty.listName], newT.id);
                        if (idx < 0) {
                            itmL.push(newT);
                        }
                        else {
                            let hasExt = !!newT['extends'], refC = (hasExt ?
                                LIB.getExtendedClasses(dta.get(ty.category, "all"), [{ id: newT.id }])[0] : dta[ty.listName][idx]), newC = (hasExt ?
                                LIB.getExtendedClasses(newD[ty.listName], [{ id: newT.id }])[0] : newT);
                            if (!ty.isCompatible(refC, newC, { mode: "include" })) {
                                let alterK = LIB.keyOf(newT);
                                newT.id += '-' + simpleHash(new Date().toISOString());
                                ty.substitute(newD, newT, alterK);
                                itmL.push(newT);
                                console.info("When adopting a project with id " + newD.id
                                    + ", a class with same id and incompatible content has been encountered: " + alterK.id
                                    + "; it has been saved with a new identifier " + newT.id + ".");
                            }
                        }
                    }
                    ;
                    console.info((newD[ty.listName].length - itmL.length) + " " + ty.listName + " adopted and " + itmL.length + " added.");
                    pend++;
                    self.createItems(ty.category, itmL)
                        .then(finalize, aDO.reject);
                }
            }
            ;
            if (Array.isArray(newD.resources)) {
                let itmL = [];
                newD.resources.forEach((newR) => {
                    let existR = LIB.itemByKey(dta.resources, newR);
                    if (existR && self.equalR(existR, newR))
                        return;
                    let selOpts = Object.assign({}, opts, { targetLanguage: self.language || newD.language });
                    if (LIB.hasResClass(newR, app.ontology.modelElementClasses.concat(CONFIG.diagramClasses), newD)
                        && !LIB.hasType(newR, CONFIG.excludedFromDeduplication, newD, opts)) {
                        existR = self.cache.resourcesByTitle(LIB.titleFromProperties(newR.properties, newD.propertyClasses, selOpts), selOpts)[0];
                        if (existR
                            && !LIB.hasType(existR, CONFIG.excludedFromDeduplication, dta, opts)
                            && LIB.classTitleOf(newR['class'], newD.resourceClasses) == LIB.classTitleOf(existR['class'], dta.resourceClasses)) {
                            self.substituteR(newD, existR, newR);
                            if (!Array.isArray(existR.alternativeIds))
                                existR.alternativeIds = [];
                            LIB.cacheE(existR.alternativeIds, { id: newR.id, revision: newR.revision, project: newD.id });
                            return;
                        }
                    }
                    ;
                    if (LIB.duplicateId(dta, newR.id)) {
                        let newId = LIB.genID(CONFIG.prefixR);
                        self.substituteR(newD, { id: newId }, newR);
                        newR.id = newId;
                    }
                    ;
                    itmL.push(newR);
                });
                console.info((newD.resources.length - itmL.length) + " resources adopted and " + itmL.length + " added.");
                pend++;
                self.createItems('resource', itmL)
                    .then(finalize, aDO.reject);
            }
            ;
            if (Array.isArray(newD.statements)) {
                let itmL = [];
                newD.statements.forEach((nS) => {
                    let eS = LIB.itemByKey(dta.statements, nS);
                    if (eS && self.equalS(eS, nS))
                        return;
                    itmL.push(nS);
                });
                console.info((newD.statements.length - itmL.length) + " statements adopted and " + itmL.length + " added.");
                pend++;
                self.createItems('statement', itmL)
                    .then(finalize, aDO.reject);
            }
            ;
            pend++;
            self.createItems('hierarchy', newD.hierarchies)
                .then(finalize, aDO.reject);
            if (Array.isArray(newD.files)) {
                let itmL = [];
                newD.files.forEach((nF) => {
                    let eF = LIB.itemByKey(dta.files, nF);
                    if (eF && self.equalF(eF, nF))
                        return;
                    itmL.push(nF);
                });
                console.info((newD.files.length - itmL.length) + " files adopted and " + itmL.length + " added.");
                pend++;
                self.createItems('file', itmL)
                    .then(finalize, aDO.reject);
            }
            ;
        }, aDO.reject);
        return aDO;
        function finalize() {
            if (--pend < 1) {
                self.hookStatements();
                self.deduplicate(opts);
                self.createFolderWithResourcesByType(opts)
                    .then(() => {
                    return self.createFolderWithGlossary(opts);
                })
                    .then(() => {
                    return self.createFolderWithUnreferencedResources(opts);
                })
                    .then(aDO.resolve)
                    .catch(aDO.reject);
            }
            ;
        }
    }
    memorizeScope(ctg, itm) {
        switch (ctg) {
            case 'dataType':
            case 'propertyClass':
            case 'resourceClass':
            case 'statementClass':
                LIB.cacheE(this[app.standards.listName.get(ctg)], LIB.makeKey(itm.id));
                break;
            case 'hierarchy':
            case 'node':
                LIB.cacheE(this.hierarchies, (itm.predecessor ? { id: itm.id, predecessor: LIB.makeKey(itm.predecessor) } : LIB.makeKey(itm.id)));
        }
    }
    createItems(ctg, itmL) {
        let self = this;
        return new Promise((resolve) => {
            self.cache.put(ctg, itmL)
                .forEach((b, i) => { if (b)
                self.memorizeScope(ctg, itmL[i]); });
            resolve();
        });
    }
    readItems(ctg, itemL, opts) {
        if (!opts)
            opts = { reload: false, timelag: 10 };
        let self = this;
        return new Promise((resolve) => {
            if (itemL == "all" && ['resource', 'statement', 'file', 'node'].includes(ctg))
                throw Error("Don't request 'all' model element instances, since the result list can be very long!");
            setTimeout(() => {
                let items = [], toGet = itemL == "all" ?
                    this[app.standards.listName.get(ctg)]
                    : itemL;
                if (opts.extendClasses && ['resourceClass', 'statementClass'].includes(ctg)) {
                    items = LIB.getExtendedClasses(self.cache.get(ctg, "all"), toGet);
                }
                else {
                    items = this.cache.get(ctg, toGet);
                    if (opts.showEmptyProperties && ['resource', 'statement'].includes(ctg)) {
                        items.forEach((itm) => {
                            itm.properties = normalizeProperties(itm);
                        });
                    }
                }
                ;
                resolve(items);
            }, opts.timelag);
        });
        function normalizeProperties(el) {
            if (el.properties) {
                let idL = [], pCid;
                el.properties.forEach((p) => {
                    pCid = p['class'].id;
                    if (idL.indexOf(pCid) < 0)
                        idL.push(pCid);
                    else
                        console.warn('The property class ' + pCid + ' of element ' + el.id + ' is occurring more than once.');
                });
            }
            ;
            let nL = [], pCL, cL = el.subject ?
                self.cache.get("statementClass", "all")
                : self.cache.get("resourceClass", "all"), iCs = LIB.getExtendedClasses(cL, [el["class"]]);
            pCL = self.cache.get("propertyClass", iCs[0].propertyClasses);
            pCL.forEach((pC) => {
                if (CONFIG.hiddenProperties.includes(pC.title))
                    return;
                let p = theListItemReferencingByClass(el.properties, pC);
                nL.push(p || { class: LIB.makeKey(pC.id), values: [] });
            });
            return nL;
            function theListItemReferencingByClass(L, cl) {
                if (L && cl) {
                    for (var l of L)
                        if (LIB.references(l['class'], cl))
                            return l;
                }
            }
        }
    }
    updateItems(ctg, itmL) {
        let self = this;
        return new Promise((resolve) => {
            self.cache.put(ctg, itmL)
                .forEach((toMemorize, i) => { if (toMemorize)
                self.memorizeScope(ctg, itmL[i]); });
            switch (ctg) {
                case 'hierarchy':
                case 'node':
                    self.hierarchies = self.cache.get('hierarchy', 'all').map(h => LIB.makeKey(h.id));
            }
            ;
            resolve();
        });
    }
    deleteItems(ctg, itmL) {
        return new Promise((resolve, reject) => {
            switch (ctg) {
                case 'dataType':
                case 'propertyClass':
                case 'resourceClass':
                case 'statementClass':
                case "hierarchy":
                case 'node':
                    let listName = app.standards.listName.get(ctg == 'node' ? 'hierarchy' : ctg);
                    for (var i of itmL) {
                        LIB.uncacheE(this[listName], { id: i.id });
                    }
                    ;
                default:
                    if (this.cache.delete(ctg, itmL))
                        break;
                    reject(new resultMsg(999, 'One or more items of ' + ctg + ' not found and thus not deleted.'));
                    return;
            }
            ;
            resolve();
        });
    }
    ;
    makeEmptyResource(rC) {
        return new Promise((resolve, reject) => {
            var res;
            this.readItems('resourceClass', [LIB.keyOf(rC)], { extendClasses: true, reload: true })
                .then((rCL) => {
                res = {
                    id: LIB.genID(CONFIG.prefixR),
                    class: LIB.makeKey(rCL[0].id),
                    properties: [],
                    changedAt: new Date().toISOString()
                };
                return this.readItems('propertyClass', rCL[0].propertyClasses, { reload: true });
            })
                .then((pCL) => {
                res.properties = LIB.forAll(pCL, LIB.createProp);
                resolve(res);
            })
                .catch(reject);
        });
    }
    hookStatements() {
        var self = this, dta = this.cache, opts = {
            targetLanguage: 'any',
            addIcon: false
        };
        let toReplace = [];
        dta.get("statement", "all").forEach((st) => {
            if (st.resourceToLink) {
                let oL = itemsByVisibleId(st.resourceToLink), o = oL.length > 0 ?
                    oL[0]
                    :
                        dta.resourcesByTitle(st.resourceToLink, opts)[0];
                if (o) {
                    st.object = LIB.keyOf(o);
                    delete st.resourceToLink;
                    toReplace.push(st);
                    return;
                }
                ;
            }
            ;
        });
        if (toReplace.length > 0)
            dta.put('statement', toReplace);
        return;
        function itemsByVisibleId(vId) {
            return dta.get("resource", (r) => {
                for (var p of r.properties) {
                    if (CONFIG.idProperties.includes(LIB.classTitleOf(p['class'], dta.propertyClasses))
                        && LIB.languageTextOf(p.values[0], { targetLanguage: self.language }) == vId)
                        return true;
                }
                ;
                return false;
            });
        }
    }
    deduplicate(opts) {
        if (!opts || !opts.deduplicate)
            return;
        let self = this, dta = this.cache, lst, cL = dta.get('resourceClass', 'all').concat(dta.get('statementClass', 'all'));
        function areNotUsedInParallel(refK, newK) {
            for (var c of cL) {
                if (LIB.indexById(c.propertyClasses, refK.id) > -1 && LIB.indexById(c.propertyClasses, newK.id) > -1)
                    return false;
            }
            ;
            return true;
        }
        function removeDuplicate(ctg, subst, replacingE, replacedE) {
            subst(dta, replacingE, replacedE);
            console.info(ctg + " with id=" + replacedE.id + " has been removed because it is a duplicate of id=" + replacingE.id);
            self.deleteItems(ctg, [LIB.keyOf(replacedE)]);
        }
        this.types.forEach((ty) => {
            lst = dta.get(ty.category, 'all');
            for (let n = lst.length - 1; n > 0; n--) {
                for (let r = 0; r < n; r++) {
                    if (ty.isEqual(lst[r], lst[n])) {
                        if (ty.category != "propertyClass" || areNotUsedInParallel(lst[r], lst[n])) {
                            removeDuplicate(ty.category, ty.substitute, lst[r], lst[n]);
                            break;
                        }
                        ;
                    }
                }
            }
        });
        lst = dta.get('resource', "all");
        for (let n = lst.length - 1; n > 0; n--) {
            for (let r = 0; r < n; r++) {
                if (app.ontology.modelElementClasses.concat(CONFIG.diagramClasses).includes(LIB.classTitleOf(lst[r]['class'], dta.resourceClasses))
                    && this.equalR(lst[r], lst[n])
                    && !LIB.hasType(lst[r], CONFIG.excludedFromDeduplication, dta, opts)
                    && !LIB.hasType(lst[n], CONFIG.excludedFromDeduplication, dta, opts)) {
                    removeDuplicate('resource', this.substituteR.bind(this), lst[r], lst[n]);
                    break;
                }
            }
        }
        ;
        lst = dta.get('statement', "all");
        for (let n = lst.length - 1; n > 0; n--) {
            for (let r = 0; r < n; r++) {
                if (this.equalS(lst[r], lst[n])) {
                    removeDuplicate('statement', () => { }, lst[r], lst[n]);
                    break;
                }
            }
        }
        ;
    }
    createFolderWithResourcesByType(opts) {
        let self = this, dta = this.cache;
        const resourcesToCollect = [
            { type: CONFIG.resClassProcess, flag: "collectProcesses", folder: CONFIG.resClassProcesses, folderNamePrefix: "FolderProcesses-" }
        ];
        return new Promise((resolve, reject) => {
            if (typeof (opts) != 'object') {
                resolve();
                return;
            }
            ;
            let apx = simpleHash(self.id), tim = new Date().toISOString();
            function resDoesNotExist(rL, res) {
                for (var i = rL.length - 1; i > -1; i--)
                    if (rL[i].r.id == res.id)
                        return false;
                return true;
            }
            resourcesToCollect.forEach((r2c) => {
                if (!opts[r2c.flag]) {
                    resolve();
                    return;
                }
                ;
                let fldL = [], resL = [];
                LIB.iterateNodes(dta.get("hierarchy", self.hierarchies), (nd) => {
                    let res = dta.get("resource", [nd.resource])[0], pVs = LIB.valuesByTitle(res, [CONFIG.propClassType], dta);
                    if (pVs.length > 0) {
                        let pV = LIB.languageTextOf(pVs[0], { targetLanguage: 'default' });
                        if (pV == r2c.folder)
                            fldL.push(nd);
                        if (pV == r2c.type && resDoesNotExist(resL, res))
                            resL.push({ n: nd, r: res });
                    }
                    ;
                    return true;
                });
                if (resL.length > 0) {
                    self.deleteItems('node', fldL.slice(1))
                        .then(() => {
                        LIB.sortBy(resL, (el) => LIB.titleFromProperties(el.r.properties, dta.propertyClasses, { targetLanguage: self.language }));
                        if (fldL.length > 0) {
                            let nd = fldL[0];
                            nd.nodes = nodesOf(resL);
                            self.updateItems('node', [nd])
                                .then(resolve, reject);
                        }
                        else {
                            let newD = Object.assign(app.ontology.generateSpecifClasses({ terms: [CONFIG.resClassFolder] }), {
                                resources: Folders(r2c.folderNamePrefix + apx, CONFIG.resClassProcesses),
                                hierarchies: Nodes(r2c, resL)
                            });
                            self.adopt(newD, { noCheck: true, deduplicate: true })
                                .done(resolve)
                                .fail(reject);
                        }
                    });
                }
                else
                    self.deleteItems('node', fldL)
                        .then(resolve, reject);
            });
            return;
            function Folders(fId, ti, ty) {
                return [{
                        id: fId,
                        class: LIB.makeKey("RC-Folder"),
                        properties: [{
                                class: LIB.makeKey("PC-Name"),
                                values: [LIB.makeMultiLanguageValue(ti)]
                            }, {
                                class: LIB.makeKey("PC-Type"),
                                values: [LIB.makeMultiLanguageValue(ty || ti)]
                            }],
                        changedAt: tim
                    }];
            }
            function nodesOf(L) {
                return L.map(Le => Le.n);
            }
            function Nodes(r2c, creL) {
                let gl = {
                    id: CONFIG.prefixH + r2c.folderNamePrefix + apx,
                    resource: { id: r2c.folderNamePrefix + apx },
                    nodes: nodesOf(creL),
                    changedAt: tim
                };
                return [gl];
            }
        });
    }
    ;
    createFolderWithUnreferencedResources(opts) {
        let self = this, dta = this.cache;
        return new Promise((resolve, reject) => {
            if (typeof (opts) != 'object' || !opts.addUnreferencedResources) {
                resolve();
                return;
            }
            ;
            let unRL = [], resL = dta.get('resource', "all"), apx = simpleHash(self.id), tim = new Date().toISOString(), hL = dta.get("hierarchy", self.hierarchies)
                .filter((nd) => {
                let idx = LIB.indexByKey(resL, nd.resource);
                if (idx > -1) {
                    if (LIB.hasType(resL[idx], [CONFIG.resClassUnreferencedResources], dta, opts)) {
                        unRL.push(nd);
                        resL.splice(idx, 1);
                        return false;
                    }
                    ;
                    return true;
                }
                ;
                throw Error('Node ' + nd.id + ' references a resource ' + nd.resource.id + ' which is not found.');
            });
            LIB.iterateNodes(hL, (nd) => {
                let idx = LIB.indexByKey(resL, nd.resource);
                if (idx > -1)
                    resL.splice(idx, 1);
                return true;
            });
            resL = resL.filter((r) => {
                return !r.id.includes("FolderUnreferencedResources-");
            });
            if (resL.length > 0) {
                if (unRL.length > 0)
                    self.deleteItems('node', unRL)
                        .then(() => { return self.createItems('node', Nodes(resL)); })
                        .then(resolve)
                        .catch(reject);
                else {
                    let newD = Object.assign(app.ontology.generateSpecifClasses({ terms: [CONFIG.resClassFolder] }), {
                        resources: Folders(),
                        hierarchies: Nodes(resL)
                    });
                    self.adopt(newD, { noCheck: true, deduplicate: true })
                        .done(resolve)
                        .fail(reject);
                }
            }
            else {
                if (unRL.length > 0)
                    self.deleteItems('node', unRL)
                        .then(resolve, reject);
                else
                    resolve();
            }
            ;
            return;
            function Folders() {
                return [{
                        id: "FolderUnreferencedResources-" + apx,
                        class: LIB.makeKey("RC-Folder"),
                        properties: [{
                                class: LIB.makeKey("PC-Name"),
                                values: [LIB.makeMultiLanguageValue(CONFIG.resClassUnreferencedResources)]
                            }, {
                                class: LIB.makeKey("PC-Type"),
                                values: [LIB.makeMultiLanguageValue(CONFIG.resClassUnreferencedResources)]
                            }],
                        changedAt: tim
                    }];
            }
            function Nodes(resources) {
                LIB.sortBy(resources, (r) => { return LIB.titleFromProperties(r.properties, dta.propertyClasses, { targetLanguage: self.language }); });
                let gl = {
                    id: "H-FolderUnreferencedResources-" + apx,
                    predecessor: hL.length > 0 ? hL[hL.length - 1].id : undefined,
                    resource: LIB.makeKey("FolderUnreferencedResources-" + apx),
                    nodes: resources.map((r) => { return { id: CONFIG.prefixN + r.id, resource: LIB.keyOf(r), changedAt: tim }; }),
                    changedAt: tim
                };
                return [gl];
            }
        });
    }
    ;
    createFolderWithGlossary(opts) {
        let self = this, dta = this.cache;
        return new Promise((resolve, reject) => {
            if (typeof (opts) != 'object' || !opts.addGlossary) {
                resolve();
                return;
            }
            ;
            let gloL = [], resL = [], diagramL = [], apx = simpleHash(self.id), tim = new Date().toISOString(), lastContentH, hL = dta.get("hierarchy", self.hierarchies)
                .filter((nd) => {
                let res = dta.get("resource", [nd.resource])[0];
                if (res && !LIB.hasType(res, [CONFIG.resClassGlossary, CONFIG.resClassUnreferencedResources], dta, opts))
                    lastContentH = nd;
                return res && !LIB.hasType(res, [CONFIG.resClassUnreferencedResources], dta, opts);
            });
            LIB.iterateNodes(hL, (nd) => {
                let res = dta.get("resource", [nd.resource])[0];
                if (LIB.hasType(res, [CONFIG.resClassGlossary], dta, opts)) {
                    gloL.push(nd);
                    resL.push(nd.resource);
                }
                ;
                if (isDiagram(res)) {
                    diagramL.push(res);
                }
                ;
                return true;
            });
            if (diagramL.length > 0) {
                self.deleteItems('node', gloL)
                    .then(() => {
                    return self.deleteItems('resource', resL);
                })
                    .then(() => {
                    let newD = Object.assign(app.ontology.generateSpecifClasses({ terms: [CONFIG.resClassFolder] }), {
                        resources: Folders(),
                        hierarchies: FolderNodes(lastContentH)
                    });
                    self.adopt(newD, { noCheck: true, deduplicate: true })
                        .done(resolve)
                        .fail(reject);
                })
                    .catch(reject);
            }
            else {
                self.deleteItems('node', gloL)
                    .then(() => {
                    return self.deleteItems('resource', resL);
                })
                    .then(resolve)
                    .catch(reject);
            }
            ;
            return;
            function isDiagram(r) {
                return LIB.hasResClass(r, CONFIG.diagramClasses, dta)
                    || LIB.hasType(r, CONFIG.diagramClasses, dta, opts)
                    || dta.get("statement", (s) => {
                        return LIB.classTitleOf(s['class'], dta.statementClasses) == CONFIG.staClassShows && LIB.references(s.subject, r);
                    }).length > 0;
            }
            function Folders() {
                let term = app.ontology.getTermResource('resourceClass', CONFIG.resClassGlossary);
                if (term) {
                    let fL = [{
                            id: "FolderGlossary-" + apx,
                            class: LIB.makeKey("RC-Folder"),
                            properties: [{
                                    class: LIB.makeKey("PC-Name"),
                                    values: LIB.valuesByTitle(term, ["SpecIF:LocalTerm"], app.ontology.data)
                                }, {
                                    class: LIB.makeKey("PC-Type"),
                                    values: [LIB.makeMultiLanguageValue(CONFIG.resClassGlossary)]
                                }],
                            changedAt: tim
                        }];
                    return fL;
                }
                ;
                console.warn("Ontology has no term '" + CONFIG.resClassGlossary + "'");
                return [];
            }
            function FolderNodes(lastContentH) {
                let gl = {
                    id: CONFIG.prefixN + "FolderGlossary-" + apx,
                    predecessor: lastContentH ? lastContentH.id : undefined,
                    resource: LIB.makeKey("FolderGlossary-" + apx),
                    nodes: [],
                    changedAt: tim
                };
                return Nodes(gl);
            }
            function Nodes(gl) {
                let staL = dta.get("statement", (s) => { return LIB.classTitleOf(s['class'], dta.statementClasses) == CONFIG.staClassShows && LIB.indexByKey(diagramL, s.subject) > -1; });
                let resL = dta.get("resource", (r) => { return LIB.referenceIndexBy(staL, 'object', r) > -1; });
                LIB.sortBy(resL, (r) => { return LIB.titleFromProperties(r.properties, dta.propertyClasses, { targetLanguage: self.language }); });
                resL.forEach((r) => {
                    gl.nodes.push({
                        id: CONFIG.prefixN + simpleHash(r.id + '-gen'),
                        resource: LIB.keyOf(r),
                        changedAt: tim
                    });
                });
                return [gl];
            }
        });
    }
    readStatementsOf(res, opts) {
        if (typeof (opts) != 'object')
            opts = { asSubject: true, asObject: true };
        let dta = this.cache, sCL, showsL;
        return new Promise((resolve, reject) => {
            this.readItems('statementClass', this.statementClasses)
                .then((sCs) => {
                sCL = sCs;
                return this.readItems('statement', (s) => { return LIB.classTitleOf(s['class'], dta.statementClasses) == CONFIG.staClassShows && LIB.isReferencedByHierarchy(s.subject); });
            })
                .then((sL) => {
                showsL = sL;
                return this.readItems('statement', (s) => { return opts.asSubject && res.id == s.subject.id || opts.asObject && res.id == s.object.id; });
            })
                .then((sL) => {
                resolve(sL.filter((s) => {
                    let sC = LIB.itemByKey(sCL, s['class']), ti = LIB.titleOf(sC);
                    if (ti)
                        return ((opts.dontCheckStatementVisibility
                            || !Array.isArray(sC.instantiation) || sC.instantiation.includes(SpecifInstantiation.User)
                            || CONFIG.staClassShows == ti
                            || LIB.referenceIndexBy(showsL, "object", s) > -1)
                            && (opts.showComments ?
                                CONFIG.staClassCommentRefersTo == ti
                                    && LIB.isReferencedByHierarchy(s.object)
                                :
                                    CONFIG.staClassCommentRefersTo != ti
                                        && CONFIG.hiddenStatements.indexOf(ti) < 0
                                        && LIB.isReferencedByHierarchy(s.subject)
                                        && LIB.isReferencedByHierarchy(s.object)));
                    console.error("When searching for statements of resource '" + res.id + "' no title was found for statement '" + s.id + "'.");
                    return false;
                }));
            })
                .catch(reject);
        });
    }
    renderExportOptions(fmt) {
        var pnl = '<div class="panel panel-default panel-options" style="margin-bottom:0">'
            + (['specif', 'specif_v10', 'html'].includes(fmt) ? '' : makeTextField('&#x200b;' + i18n.LblProjectName, (fmt == 'specifClasses' ? 'SpecIF Classes' : this.exportParams.projectName), { typ: 'line' }))
            + makeTextField('&#x200b;' + i18n.LblFileName, (fmt == 'specifClasses' ? 'SpecIF-Classes' : this.exportParams.fileName), { typ: 'line' });
        switch (fmt) {
            case 'epub':
            case 'oxml':
                pnl += makeCheckboxField(i18n.LblOptions, [
                    { title: i18n.elementsWithIcons, id: 'elementsWithIcons', checked: true },
                    { title: i18n.elementsWithOrdernumbers, id: 'elementsWithOrdernumbers', checked: false },
                    { title: i18n.withStatements, id: 'withStatements', checked: false },
                    { title: i18n.withOtherProperties, id: 'withOtherProperties', checked: false },
                    { title: i18n.showEmptyProperties, id: 'showEmptyProperties', checked: CONFIG.showEmptyProperties }
                ]);
                break;
            case 'html':
                if (app.title == i18n.LblEditor) {
                    pnl += makeRadioField(app.ontology.localize('SpecIF:Permissions', { targetLanguage: browser.language }), this.roles.map((r, i) => {
                        return { title: i18n.lookup('MsgForRole') + " '" + app.ontology.localize(r.title, { targetLanguage: browser.language }) + "'", id: r.title, checked: i < 1 };
                    }));
                }
                ;
                break;
            case 'specifClasses':
                let domains = LIB.enumeratedValuesOf(LIB.makeKey('DT-Domain'));
                if (domains.length > 0)
                    pnl += makeCheckboxField(i18n.LblOptions, domains.map((d) => {
                        return { title: app.ontology.localize(d, { targetLanguage: browser.language }), id: d.toJsId(), checked: false };
                    }));
        }
        ;
        pnl += '</div>';
        return pnl;
    }
    exportFormatClicked() {
        document.getElementById("expOptions").innerHTML = this.renderExportOptions(radioValue(i18n.LblFormat));
    }
    chooseFormatAndExport() {
        if (this.exporting)
            return;
        var self = this;
        const exportFormatClicked = 'app.projects.selected.exportFormatClicked()';
        new BootstrapDialog({
            title: i18n.LblExport,
            type: 'type-primary',
            message: () => {
                let formats = app.title == i18n.LblEditor ?
                    [
                        { title: 'SpecIF v1.0', id: 'specif_v10' },
                        { title: 'SpecIF v' + CONFIG.specifVersion, id: 'specif', checked: true },
                        { title: 'HTML with embedded SpecIF v' + CONFIG.specifVersion, id: 'html' },
                        { title: 'ReqIF v1.0', id: 'reqif' },
                        { title: 'MS Excel® (experimental)', id: 'xlsx' },
                        { title: 'Turtle (experimental)', id: 'turtle' },
                        { title: 'ePub v2', id: 'epub' },
                        { title: 'MS Word® (Open XML)', id: 'oxml' }
                    ]
                    :
                        [
                            { title: 'HTML with embedded SpecIF v' + CONFIG.specifVersion, id: 'html', checked: true },
                        ];
                if (moduleManager.isReady('ioOntology') && hasOntology())
                    formats.splice(3, 0, { title: 'SpecIF Class Definitions', id: 'specifClasses' });
                var form = '<div class="row" style="margin: 0 -4px 0 -4px">'
                    + '<div class="col-sm-12" style="padding: 0 4px 0 4px">'
                    + '<div class="panel panel-default panel-options" style="margin-bottom:4px">'
                    + "<p>" + i18n.MsgExport + "</p>"
                    + makeRadioField(i18n.LblFormat, formats, { handle: exportFormatClicked })
                    + '</div>'
                    + '</div>'
                    + '<div id="expOptions" class="col-sm-12" style="padding: 0 4px 0 4px">'
                    + this.renderExportOptions(app.title == i18n.LblEditor ? 'specif' : 'html')
                    + '</div>'
                    + '</div>';
                return $(form);
                function hasOntology() {
                    let hL = self.cache.get("hierarchy", self.hierarchies);
                    for (var h of hL) {
                        let rL = self.cache.get("resource", [h.resource]);
                        if (rL.length > 0 && LIB.hasType(rL[0], [CONFIG.resClassOntology], self.cache))
                            return true;
                    }
                    ;
                    return false;
                }
            },
            buttons: [
                {
                    label: i18n.BtnCancel,
                    action: (thisDlg) => {
                        thisDlg.close();
                    }
                },
                {
                    label: i18n.BtnExport,
                    cssClass: 'btn-success',
                    action: (thisDlg) => {
                        app.busy.set();
                        message.show(i18n.MsgBrowserSaving, { severity: 'success', duration: CONFIG.messageDisplayTimeShort });
                        let prjN = textValue('&#x200b;' + i18n.LblProjectName);
                        this.exportParams.fileName = textValue('&#x200b;' + i18n.LblFileName) || prjN || this.id;
                        if (prjN)
                            this.exportParams.projectName = prjN;
                        let options = {
                            projectName: this.exportParams.projectName,
                            fileName: this.exportParams.fileName,
                            format: radioValue(i18n.LblFormat),
                            role: '',
                            domains: []
                        };
                        switch (options.format) {
                            case 'html':
                                if (app.title == i18n.LblEditor) {
                                    options.role = radioValue(app.ontology.localize("SpecIF:Permissions", { targetLanguage: browser.language }));
                                }
                                else
                                    options.role = window.role || "SpecIF:Supplier";
                                break;
                            case 'specifClasses':
                                let chkDomains = checkboxValues(i18n.LblOptions);
                                options.domains = LIB.enumeratedValuesOf(LIB.makeKey('DT-Domain')).filter((d) => chkDomains.includes(d.toJsId()));
                                break;
                            default:
                                checkboxValues(i18n.LblOptions).forEach((op) => {
                                    options[op] = true;
                                });
                        }
                        ;
                        this.exportAs(options)
                            .then(() => { app.busy.reset(); }, handleError);
                        thisDlg.close();
                    }
                }
            ]
        })
            .open();
        return;
        function handleError(xhr) {
            self.exporting = false;
            app.busy.reset();
            message.show(xhr);
        }
    }
    exportAs(opts) {
        var self = this;
        if (!opts)
            opts = {};
        if (!opts.format)
            opts.format = 'specif';
        return new Promise((resolve, reject) => {
            if (self.exporting) {
                reject(new resultMsg(999, "Export in process, please wait a little while"));
            }
            else {
                self.exporting = true;
                switch (opts.format) {
                    case 'specif_v10':
                    case 'turtle':
                    case 'reqif':
                    case 'specif':
                    case 'html':
                    case 'specifClasses':
                        storeAs(opts);
                        break;
                    case 'xlsx':
                    case 'epub':
                    case 'oxml':
                        publish(opts);
                        break;
                    default:
                        let msg = "Programming error: Invalid format specified on export.";
                        throw Error(msg);
                }
                ;
            }
            ;
            return;
            function publish(opts) {
                opts.skipProperties = [
                    { title: CONFIG.propClassType, value: CONFIG.resClassFolder },
                    { title: CONFIG.propClassType, value: CONFIG.resClassOutline }
                ];
                if (!opts.targetLanguage)
                    opts.targetLanguage = self.language;
                opts.lookupTitles =
                    opts.lookupValues =
                        opts.allDiagramsAsImage = true;
                opts.makeHTML =
                    opts.linkifyURLs = ['epub', 'oxml'].includes(opts.format);
                opts.revisionDate = new Date().toISOString();
                let optsLabel = Object.assign({}, opts, { plural: true });
                self.read(opts).then((expD) => {
                    let localOpts = {
                        titleLinkTargets: app.standards.titleLinkTargets().map((e) => { return app.ontology.localize(e, opts); }),
                        titleProperties: CONFIG.titleProperties.map((e) => { return app.ontology.localize(e, opts); }),
                        descriptionProperties: CONFIG.descProperties.map((e) => { return app.ontology.localize(e, opts); }),
                        stereotypeProperties: CONFIG.stereotypeProperties.map((e) => { return app.ontology.localize(e, opts); }),
                        showEmptyProperties: opts.showEmptyProperties,
                        imgExtensions: CONFIG.imgExtensions,
                        applExtensions: CONFIG.applExtensions,
                        addIcon: opts.elementsWithIcons,
                        addOrder: opts.elementsWithOrdernumbers,
                        propertiesLabel: opts.withOtherProperties ? app.ontology.localize('SpecIF:Property', optsLabel) : undefined,
                        statementsLabel: opts.withStatements ? app.ontology.localize('SpecIF:Statement', optsLabel) : undefined,
                        fileName: self.exportParams.fileName,
                        colorAccent1: '0071B9',
                        done: () => { app.projects.selected.exporting = false; resolve(); },
                        fail: (xhr) => { app.projects.selected.exporting = false; reject(xhr); }
                    };
                    expD.title = LIB.makeMultiLanguageValue(opts.projectName);
                    switch (opts.format) {
                        case 'epub':
                            localOpts.fileName = LIB.addFileExtIfMissing(localOpts.fileName, ".epub");
                            toEpub(expD, localOpts);
                            break;
                        case 'oxml':
                            localOpts.fileName = LIB.addFileExtIfMissing(localOpts.fileName, ".doc");
                            toOxml(expD, localOpts);
                            break;
                        case 'xlsx':
                            app.ioXls.fromSpecif(expD, localOpts);
                    }
                    ;
                }, reject);
            }
            function storeAs(opts) {
                opts.allDiagramsAsImage = ["html", "turtle", "reqif"].includes(opts.format);
                switch (opts.format) {
                    case 'specif_v10':
                        opts.v10 = true;
                    case 'specif':
                    case 'html':
                        opts.lookupTitles = false;
                        opts.lookupValues = false;
                        break;
                    case 'reqif':
                        opts.lookupTitles = true;
                        opts.targetNamespaces = ["ReqIF."];
                        opts.allDiagramsAsImage = true;
                        opts.makeHTML = true;
                        opts.linkifyURLs = true;
                        opts.createHierarchyRootIfMissing = true;
                        opts.revisionDate = new Date().toISOString();
                        break;
                    case 'turtle':
                        opts.lookupTitles = true;
                        opts.targetNamespaces = ["rdf:", "rdfs:"];
                        opts.allDiagramsAsImage = true;
                        opts.makeHTML = true;
                        opts.linkifyURLs = true;
                        opts.revisionDate = new Date().toISOString();
                        break;
                    case 'specifClasses':
                        opts.adoptOntologyDataTypes = true;
                        break;
                    default:
                        reject(new resultMsg(999, "Programming Error: Invalid format selector on export."));
                        return;
                }
                ;
                self.read(opts)
                    .then((expD) => {
                    let fName = opts.fileName;
                    if (['html', 'reqif', 'turtle'].includes(opts.format))
                        expD.title = LIB.makeMultiLanguageValue(opts.projectName);
                    if (opts.targetLanguage)
                        expD.language = opts.targetLanguage;
                    if (opts.format == 'html') {
                        opts.cdn = window.cdn
                            || window.location.href.substring(0, window.location.href.lastIndexOf("/") + 1);
                        app.specif2html(expD, opts)
                            .then((dta) => {
                            let blob = new Blob([dta], { type: "text/html; charset=utf-8" });
                            saveAs(blob, fName + (opts.role == "SpecIF:Reader" ? '' : '.' + app.ontology.localize(opts.role, { targetLanguage: browser.language })) + '.specif.html');
                            self.exporting = false;
                            resolve();
                        }, (xhr) => {
                            self.exporting = false;
                            reject(xhr);
                        });
                        return;
                    }
                    ;
                    let expStr, zipper = new JSZip(), zName, mimetype = "application/zip";
                    if (expD.files)
                        for (var f of expD.files) {
                            zipper.file(f.title, f.blob);
                            delete f.blob;
                        }
                    ;
                    switch (opts.format) {
                        case 'specif_v10':
                            fName += ".v10";
                        case 'specif':
                            fName += ".specif";
                            zName = fName + '.zip';
                            expStr = JSON.stringify(expD);
                            break;
                        case 'specifClasses':
                            fName += ".specif";
                            zName = fName + '.zip';
                            if (!Array.isArray(opts.domains) || opts.domains.length < 1) {
                                reject(new resultMsg(999, "No domain selected, so no classes will be generated."));
                                return;
                            }
                            ;
                            expStr = JSON.stringify(new COntology(expD).generateSpecifClasses(opts));
                            break;
                        case 'reqif':
                            fName += ".reqif";
                            zName = fName + 'z';
                            mimetype = "application/reqif+zip";
                            expStr = app.ioReqif.fromSpecif(expD);
                            break;
                        case 'turtle':
                            fName += ".ttl";
                            zName = fName + '.zip';
                            expStr = app.specif2turtle(expD, { baseURI: "https://specif.de/examples/" });
                    }
                    ;
                    expD = null;
                    zipper.file(fName, new Blob([expStr], { type: "text/plain; charset=utf-8" }));
                    zipper.generateAsync({
                        type: "blob",
                        compression: "DEFLATE",
                        compressionOptions: { level: 7 },
                        mimeType: mimetype
                    })
                        .then((blob) => {
                        saveAs(blob, zName);
                        self.exporting = false;
                        resolve();
                    }, (xhr) => {
                        console.error("Cannot create ZIP of '" + fName + "'.");
                        self.exporting = false;
                        reject(xhr);
                    });
                }, reject);
            }
        });
    }
    equalR(refE, newE) {
        let opts = { targetLanguage: this.language };
        return LIB.equalKey(refE['class'], newE['class'])
            && this.cache.instanceTitleOf(refE, opts) == this.cache.instanceTitleOf(newE, opts)
            && LIB.valueByTitle(refE, CONFIG.propClassType, this.cache) == LIB.valueByTitle(newE, CONFIG.propClassType, this.cache);
    }
    equalS(refE, newE) {
        return LIB.equalKey(refE['class'], newE['class'])
            && LIB.equalKey(refE.subject, newE.subject)
            && LIB.equalKey(refE.object, newE.object)
            && LIB.valueByTitle(refE, CONFIG.propClassType, this.cache) == LIB.valueByTitle(newE, CONFIG.propClassType, this.cache);
    }
    equalF(refE, newE) {
        return LIB.equalKey(refE, newE)
            && refE.title == newE.title
            && refE.type == newE.type;
    }
    compatibleDT(refC, newC) {
        if (refC.type == newC.type) {
            switch (newC.type) {
                case XsDataType.Boolean:
                    return true;
                case XsDataType.Double:
                    if (refC.fractionDigits < newC.fractionDigits) {
                        new resultMsg(952, "new dataType '" + newC.id + "' of type '" + newC.type + "' is incompatible").log();
                        return false;
                    }
                    ;
                case XsDataType.Integer:
                    if (refC.maxInclusive < newC.maxInclusive || refC.minInclusive > newC.minInclusive) {
                        new resultMsg(953, "new dataType '" + newC.id + "' of type '" + newC.type + "' is incompatible").log();
                        return false;
                    }
                    ;
                    break;
                case XsDataType.String:
                    if (refC.maxLength && (newC.maxLength == undefined || refC.maxLength < newC.maxLength)) {
                        new resultMsg(951, "new dataType '" + newC.id + "' of type '" + newC.type + "' is incompatible").log();
                        return false;
                        ;
                    }
                    ;
                    break;
                case XsDataType.DateTime:
                case XsDataType.Duration:
                case XsDataType.AnyURI:
                    break;
                default:
                    throw Error("Invalid data type.");
            }
            ;
            return compatibleEnumeration(refC, newC);
        }
        return false;
        function compatibleEnumeration(refC, newC) {
            if (!refC.enumeration && !newC.enumeration)
                return true;
            if (!refC.enumeration == !!newC.enumeration)
                return false;
            var idx;
            for (var v = newC.enumeration.length - 1; v > -1; v--) {
                idx = LIB.indexById(refC.enumeration, newC.enumeration[v].id);
                if (idx < 0) {
                    new resultMsg(954, "new dataType '" + newC.id + "' of type '" + newC.type + "' is incompatible").log();
                    return false;
                }
                ;
            }
            ;
            console.debug("new dataType '" + newC.id + "' of type '" + newC.type + "' is compatible with '" + refC.id + "' of type '" + refC.type + "'", refC, newC);
            return true;
        }
    }
    compatiblePC(refC, newC) {
        if (LIB.equalPC(refC, newC))
            return true;
        new resultMsg(956, "new propertyClass '" + newC.id + "' is incompatible").log();
        return false;
    }
    compatiblePCReferences(rCL, nCL, opts) {
        if (!opts || !opts.mode)
            opts = { mode: "match" };
        if (Array.isArray(rCL) && Array.isArray(nCL)) {
            switch (opts.mode) {
                case "include":
                    return rCL.length >= nCL.length && LIB.containsAllKeys(rCL, nCL);
                case "match":
                default:
                    return rCL.length == nCL.length && LIB.containsAllKeys(rCL, nCL);
            }
            ;
        }
        ;
        switch (opts.mode) {
            case "include":
                return !Array.isArray(nCL) || nCL.length < 1;
            case "match":
            default:
                return !Array.isArray(rCL) && !Array.isArray(nCL);
        }
        ;
    }
    compatibleECReferences(rCL, nCL, opts) {
        if (!opts || !opts.mode)
            opts = { mode: "match" };
        if (Array.isArray(rCL)) {
            if (Array.isArray(nCL))
                switch (opts.mode) {
                    case "include":
                        return rCL.length >= nCL.length && LIB.containsAllKeys(rCL, nCL);
                    case "match":
                    default:
                        return rCL.length == nCL.length && LIB.containsAllKeys(rCL, nCL);
                }
            else
                return false;
        }
        ;
        return opts.mode == "match" ? !Array.isArray(nCL) : true;
    }
    compatibleRC(refC, newC, opts) {
        if (this.compatiblePCReferences(refC.propertyClasses, newC.propertyClasses, opts))
            return true;
        new resultMsg(963, "new resourceClass '" + newC.id + "' is incompatible; propertyClasses don't match").log();
        return false;
    }
    compatibleSC(refC, newC, opts) {
        if (refC.title != newC.title) {
            new resultMsg(961, "new statementClass '" + newC.id + "' is incompatible; titles don't match").log();
            return false;
        }
        if (!this.compatibleECReferences(refC.subjectClasses, newC.subjectClasses)) {
            new resultMsg(962, "new statementClass '" + newC.id + "' is incompatible; subjectClasses don't match").log();
            return false;
        }
        ;
        if (!this.compatibleECReferences(refC.objectClasses, newC.objectClasses)) {
            new resultMsg(962, "new statementClass '" + newC.id + "' is incompatible; objectClasses don't match").log();
            return false;
        }
        ;
        if (this.compatiblePCReferences(refC.propertyClasses, newC.propertyClasses, opts))
            return true;
        new resultMsg(963, "new statementClass '" + newC.id + "' is incompatible; propertyClasses don't match").log();
        return false;
    }
    substituteProp(L, propN, rK, dK) {
        if (Array.isArray(L))
            for (var e of L) {
                if (LIB.references(e[propN], dK))
                    e[propN] = rK;
            }
        ;
    }
    substituteLe(L, propN, rK, dK) {
        let idx;
        if (Array.isArray(L))
            L.forEach((e) => {
                if (Array.isArray(e[propN])) {
                    idx = LIB.referenceIndex(e[propN], dK);
                    if (idx > -1) {
                        if (LIB.referenceIndex(e[propN], rK) < 0)
                            e[propN].splice(idx, 1, rK);
                        else
                            e[propN].splice(idx, 1);
                    }
                    ;
                }
                ;
            });
    }
    substituteRef(L, rK, dK) {
        LIB.iterateNodes(L, (nd) => { if (LIB.references(nd.resource, dK)) {
            nd.resource = rK;
        } ; return true; }, (ndL) => { for (var i = ndL.length - 1; i > 0; i--) {
            if (LIB.referenceIndexBy(ndL.slice(0, i), 'resource', ndL[i].resource) > -1) {
                ndL.splice(i, 1);
            }
        } });
    }
    substituteDT(prj, replacingE, replacedE) {
        this.substituteProp(prj.propertyClasses, 'dataType', LIB.makeKey(replacingE.id), LIB.keyOf(replacedE));
    }
    substitutePC(prj, replacingE, replacedE) {
        this.substituteLe(prj.resourceClasses, 'propertyClasses', LIB.makeKey(replacingE.id), LIB.keyOf(replacedE));
        prj.resources.forEach((res) => {
            this.substituteProp(res.properties, 'class', LIB.makeKey(replacingE.id), LIB.keyOf(replacedE));
        });
        this.substituteLe(prj.statementClasses, 'propertyClasses', LIB.makeKey(replacingE.id), LIB.keyOf(replacedE));
        if (Array.isArray(prj.statements))
            prj.statements.forEach((sta) => {
                this.substituteProp(sta.properties, 'class', LIB.makeKey(replacingE.id), LIB.keyOf(replacedE));
            });
    }
    substituteRC(prj, replacingE, replacedE) {
        this.substituteProp(prj.resourceClasses, 'extends', LIB.makeKey(replacingE.id), LIB.keyOf(replacedE));
        this.substituteLe(prj.statementClasses, 'subjectClasses', LIB.makeKey(replacingE.id), LIB.keyOf(replacedE));
        this.substituteLe(prj.statementClasses, 'objectClasses', LIB.makeKey(replacingE.id), LIB.keyOf(replacedE));
        this.substituteProp(prj.resources, 'class', LIB.makeKey(replacingE.id), LIB.keyOf(replacedE));
    }
    substituteSC(prj, replacingE, replacedE) {
        this.substituteProp(prj.statementClasses, 'extends', LIB.makeKey(replacingE.id), LIB.keyOf(replacedE));
        this.substituteProp(prj.statements, 'class', LIB.makeKey(replacingE.id), LIB.keyOf(replacedE));
    }
    substituteR(prj, replacingE, replacedE) {
        if (LIB.equalKey(replacingE, replacedE))
            return;
        prj.statements.forEach((st) => {
            if (LIB.references(st.subject, replacedE))
                st.subject = LIB.makeKey(replacingE.id);
            if (LIB.references(st.object, replacedE))
                st.object = LIB.makeKey(replacingE.id);
        });
        this.substituteRef(prj.hierarchies, LIB.makeKey(replacingE.id), LIB.keyOf(replacedE));
        if (replacingE['class'] && replacedE['class'] && !LIB.equalKey(replacingE['class'], replacedE['class']))
            prj.statementClasses.forEach((sC) => {
                let idx = LIB.referenceIndexBy(sC.subjectClasses, replacedE['class']);
                if (idx > -1) {
                    sC.subjectClasses.splice(idx, 1);
                    LIB.cacheE(sC.subjectClasses, replacingE['class']);
                }
                ;
                idx = LIB.referenceIndexBy(sC.objectClasses, replacedE['class']);
                if (idx > -1) {
                    sC.objectClasses.splice(idx, 1);
                    LIB.cacheE(sC.objectClasses, replacingE['class']);
                }
                ;
            });
    }
    abort() {
        console.info('abort project');
        this.abortFlag = true;
    }
    ;
}
moduleManager.construct({
    name: 'cache'
}, (self) => {
    self.init = () => {
        self.cache = new CCache({ cacheInstances: true });
        self.list = [];
        self.selected = undefined;
        app.standards = new CStandards();
        return true;
    };
    self.create = (dta, opts) => {
        self.list.length = 0;
        self.cache.clear();
        self.selected = new CProject(self.cache);
        self.list.push(self.selected);
        return self.selected.create(dta, opts);
    };
    return self;
});
