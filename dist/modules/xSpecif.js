"use strict";
/*!	Transformation Library for SpecIF data for import to and export from the internal data structure.
    Dependencies: jQuery 3.5+
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    Author: se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/
class CSpecifItemNames {
    constructor(ver) {
        switch (ver) {
            case '0.10.2':
            case '0.10.3':
                this.rClasses = 'resourceTypes';
                this.sClasses = 'statementTypes';
                this.hClasses = 'hierarchyTypes';
                this.pClasses = 'propertyTypes';
                this.sbjClasses = 'subjectTypes';
                this.objClasses = 'objectTypes';
                this.rClass = 'resourceType';
                this.sClass = 'statementType';
                this.hClass = 'hierarchyType';
                this.pClass = 'propertyType';
                this.rs = 'resources';
                this.sts = 'statements';
                this.r = 'resource';
                break;
            case '0.10.4':
            case '0.10.5':
            case '0.10.6':
            case '0.11.2':
                this.hClasses = 'hierarchyClasses';
                this.hClass = 'class';
            default:
                this.rClasses = 'resourceClasses';
                this.sClasses = 'statementClasses';
                this.pClasses = 'propertyClasses';
                this.sbjClasses = 'subjectClasses';
                this.objClasses = 'objectClasses';
                this.rClass = 'class';
                this.sClass = 'class';
                this.pClass = 'class';
                this.rs = 'resources';
                this.sts = 'statements';
                this.r = 'resource';
        }
        ;
        if (typeof (ver) == 'string' && ver.startsWith('0.')) {
            this.frct = 'accuracy';
            this.minI = 'min';
            this.maxI = 'max';
        }
        else {
            this.frct = 'fractionDigits';
            this.minI = 'minInclusive';
            this.maxI = 'maxInclusive';
        }
        ;
    }
}
class CSpecIF {
    constructor() {
        this.dataTypes = [];
        this.propertyClasses = [];
        this.resourceClasses = [];
        this.statementClasses = [];
        this.files = [];
        this.resources = [];
        this.statements = [];
        this.hierarchies = [];
    }
    isValid(spD) {
        if (!spD)
            spD = this;
        if (spD.$schema || ['0.10.2', '0.10.3', '0.10.4', '0.10.5', '0.10.6', '0.10.8', '0.11.2', '0.11.8'].includes(spD.specifVersion))
            return typeof (spD.id) == 'string' && spD.id.length > 0;
        return false;
    }
    set(spD, opts) {
        return new Promise((resolve, reject) => {
            let msg;
            if (this.isValid(spD)) {
                msg = this.toInt(spD, opts);
                if (msg.status == 0) {
                    if (opts && opts.noCheck) {
                        resolve(this);
                    }
                    else {
                        this.check(this, opts)
                            .then(() => { resolve(this); }, reject);
                    }
                    ;
                }
                else
                    reject(msg);
            }
            else {
                msg = new resultMsg(999, "SpecIF id is not defined or version is not supported.").warn();
                reject(msg);
            }
        });
    }
    get(opts) {
        if (opts && opts.v10)
            return this.toExt_v10(opts);
        return this.toExt(opts);
    }
    check(spD, opts) {
        return new Promise((resolve, reject) => {
            let checker;
            if (this.isValid(spD)) {
                if (spD['$schema'] && !spD['$schema'].includes('v1.0')) {
                    import(window.location.href.startsWith('file:/') ? '../../SpecIF-Schema/check/CCheck.mjs'
                        : 'https://specif.de/v' + /\/(?:v|specif-)(\d+\.\d+)\//.exec(spD['$schema'])[1] + '/CCheck.mjs')
                        .then(modChk => {
                        getSchema();
                        checker = new modChk.CCheck();
                    })
                        .catch(handleError);
                }
                else {
                    throw "Programming Error: Inexpected check of SpecIF data set < v1.1";
                }
            }
            else {
                reject(new resultMsg(999, 'No SpecIF data provided for checking'));
            }
            ;
            return;
            function handleResult(xhr) {
                if (typeof (checker.checkSchema) == 'function' && typeof (checker.checkConstraints) == 'function') {
                    let sma = JSON.parse(LIB.ab2str(xhr.response));
                    sma['$schema'] = "http://json-schema.org/draft-04/schema#";
                    let rc = checker.checkSchema(spD, { schema: sma });
                    if (rc.status == 0) {
                        rc = checker.checkConstraints(spD, opts);
                        if (rc.status == 0) {
                            resolve(spD);
                            return;
                        }
                    }
                    ;
                    reject(rc);
                }
                else
                    throw Error('Standard routines checkSchema and/or checkConstraints are not available.');
            }
            function handleError(xhr) {
                switch (xhr.status) {
                    case 404:
                        let v = spD.specifVersion ? 'version ' + spD.specifVersion : 'with Schema ' + spD['$schema'];
                        xhr = new resultMsg(903, 'SpecIF ' + v + ' is not supported by this program!');
                    default:
                        reject(xhr);
                }
                ;
            }
            function getSchema() {
                LIB.httpGet({
                    url: (spD['$schema'] || 'https://specif.de/v' + spD.specifVersion + '/schema'),
                    responseType: 'arraybuffer',
                    withCredentials: false,
                    done: handleResult,
                    fail: handleError
                });
            }
        });
    }
    isOntology(specifData) {
        return (specifData.id.includes("Ontology")
            && Array.isArray(specifData.title) && specifData.title[0] && specifData.title[0]['text']
            && specifData.title[0]['text'].includes("Ontology"));
    }
    ;
    toInt(spD, opts) {
        if (this.isOntology(spD) || spD.id == "P-DDP-Schema-V20")
            opts.normalizeTerms = false;
        let self = this, names = new CSpecifItemNames(spD.specifVersion);
        console.info("References are imported *without* revision to ascertain that updates of the referenced element do not break the link. "
            + "(References without revision always relate to the latest revision of the referenced element.)");
        try {
            this.dataTypes = LIB.forAll(spD.dataTypes, dT2int);
            this.propertyClasses = LIB.forAll(spD.propertyClasses, pC2int);
            this.resourceClasses = LIB.forAll(spD[names.rClasses], rC2int);
            this.statementClasses = LIB.forAll(spD[names.sClasses], sC2int);
            if (names.hClasses)
                this.resourceClasses = this.resourceClasses.concat(LIB.forAll(spD[names.hClasses], hC2int));
            this.files = LIB.forAll(spD.files, f2int);
            this.resources = LIB.forAll(spD[names.rs], r2int);
            this.statements = LIB.forAll(spD[names.sts], s2int);
            this.hierarchies = LIB.forAll(spD.hierarchies, h2int);
            this.dataTypes = LIB.forAll(this.dataTypes, (dT) => {
                switch (dT.type) {
                    case 'xs:enumeration':
                    case "xhtml":
                        dT.type = XsDataType.String;
                }
                ;
                return dT;
            });
        }
        catch (e) {
            let txt = "Error when importing the project '" + LIB.displayValueOf(spD.title, { targetLanguage: spD.language || browser.language }) + "': " + e;
            console.error(txt);
            return new resultMsg(904, txt);
        }
        ;
        if (spD.rights)
            this.rights = { title: spD.rights.title, url: spD.rights.url };
        if (spD.generator)
            this.generator = spD.generator;
        if (spD.generatorVersion)
            this.generatorVersion = spD.generatorVersion;
        if (spD.createdBy) {
            this.createdBy = spD.createdBy;
            if (spD.createdBy.email && spD.createdBy.email.value)
                this.createdBy.email = spD.createdBy.email.value;
        }
        ;
        if (spD.createdAt)
            this.createdAt = LIB.addTimezoneIfMissing(spD.createdAt);
        if (spD.description)
            this.description = makeMultiLanguageText(spD.description);
        if (spD.title)
            this.title = makeMultiLanguageText(spD.title);
        this.id = spD.id;
        this.$schema = 'https://specif.de/v' + CONFIG.specifVersion + '/schema.json';
        return new resultMsg(0, 'SpecIF data has been successfully imported!');
        function i2int(iE) {
            var oE = {
                id: iE.id ? iE.id.toSpecifId() : undefined,
                changedAt: LIB.addTimezoneIfMissing(iE.changedAt || '1970-01-01T00:00:00Z')
            };
            if (iE.description)
                oE.description = makeMultiLanguageText(iE.description);
            if (iE.revision)
                oE.revision = typeof (iE.revision) == 'number' ? iE.revision.toString() : iE.revision;
            if (iE.replaces)
                oE.replaces = iE.replaces;
            if (iE.changedBy)
                oE.changedBy = iE.changedBy;
            if (iE.createdAt)
                oE.createdAt = iE.createdAt;
            if (iE.createdBy)
                oE.createdBy = iE.createdBy;
            return oE;
        }
        function dT2int(iE) {
            var oE = i2int(iE);
            oE.title = makeTitle('propertyClass', iE.title);
            oE.type = iE.type == "xs:enumeration" ? XsDataType.String : iE.type;
            switch (iE.type) {
                case XsDataType.Double:
                    oE.fractionDigits = iE[names.frct];
                    oE.minInclusive = iE[names.minI];
                    oE.maxInclusive = iE[names.maxI];
                    break;
                case XsDataType.Integer:
                    oE.minInclusive = iE[names.minI];
                    oE.maxInclusive = iE[names.maxI];
                    break;
                case "xhtml":
                case XsDataType.String:
                    if (typeof (iE.maxLength) == 'number')
                        oE.maxLength = iE.maxLength;
            }
            ;
            if (iE.enumeration)
                oE.enumeration = (iE.type == XsDataType.String && opts.normalizeTerms ?
                    iE.enumeration.map(makeEnumValue)
                    : iE.enumeration);
            if (iE.values)
                oE.enumeration = iE.values.map((v) => {
                    let lv = Array.isArray(v.value) ?
                        v.value
                        : [{ text: v.value || v.title || '' }];
                    return {
                        id: v.id,
                        value: opts.normalizeTerms ? lv.map(normalizeLanguageText) : lv
                    };
                });
            return oE;
            function makeEnumValue(eV) {
                let oV = {
                    id: eV.id,
                    value: eV.value.map(normalizeLanguageText)
                };
                return oV;
            }
        }
        function pC2int(iE) {
            var oE = i2int(iE);
            oE.title = makeTitle('propertyClass', iE.title);
            oE.dataType = LIB.makeKey(iE.dataType.id || iE.dataType);
            let dT = LIB.itemByKey(spD.dataTypes, oE.dataType);
            if (dT) {
                if (typeof (iE.multiple) == 'boolean')
                    oE.multiple = iE.multiple;
                else if (dT.multiple)
                    oE.multiple = true;
            }
            else {
                throw "The dataType " + oE.dataType.id + " for propertyClass " + oE.id + " has not been found.";
            }
            ;
            dT = LIB.itemByKey(self.dataTypes, oE.dataType);
            if (iE.value || iE.values) {
                let vL = makeValues(iE, dT);
                if (vL.length > 0)
                    oE.values = vL;
            }
            ;
            if (dT.type == XsDataType.String) {
                if (app.ontology.propertyClassIsFormatted(oE.title))
                    oE.format = SpecifTextFormat.Xhtml;
                else
                    oE.format = typeof (iE.format) == 'string' && iE.format == SpecifTextFormat.Xhtml ?
                        SpecifTextFormat.Xhtml
                        : SpecifTextFormat.Plain;
            }
            ;
            if (iE.unit)
                oE.unit = iE.unit;
            return oE;
        }
        function aC2int(iE) {
            var oE = i2int(iE);
            if (iE['extends'])
                oE['extends'] = iE['extends'].id ? iE['extends'] : LIB.makeKey(iE['extends']);
            if (iE.creation)
                oE.instantiation = iE.creation;
            if (iE.instantiation)
                oE.instantiation = iE.instantiation;
            if (oE.instantiation) {
                let idx = oE.instantiation.indexOf('manual');
                if (idx > -1)
                    oE.instantiation.splice(idx, 1, 'user');
            }
            ;
            if (Array.isArray(iE[names.pClasses]) && iE[names.pClasses].length > 0) {
                if (typeof (iE[names.pClasses][0]) == 'object' && iE[names.pClasses][0].dataType == undefined) {
                    oE.propertyClasses = iE.propertyClasses.map((pC) => { return LIB.makeKey(pC.id); });
                }
                else if (typeof (iE[names.pClasses][0]) == 'string') {
                    oE.propertyClasses = iE[names.pClasses].map((el) => { return LIB.makeKey(el.id || el); });
                }
                else {
                    oE.propertyClasses = [];
                    iE[names.pClasses].forEach((e) => {
                        let pC = pC2int(e);
                        self.propertyClasses.push(pC);
                        oE.propertyClasses.push(LIB.makeKey(pC.id));
                    });
                }
                ;
            }
            else
                oE.propertyClasses = [];
            return oE;
        }
        function rC2int(iE) {
            var oE = aC2int(iE);
            oE.title = makeTitle('resourceClass', iE.title);
            let ic = app.ontology.getIcon('resourceClass', oE.title);
            if (ic || iE.icon)
                oE.icon = ic || iE.icon;
            if (typeof (iE.isHeading) == 'boolean') {
                oE.isHeading = iE.isHeading;
            }
            else if (app.ontology.headings.includes(iE.title)) {
                oE.isHeading = true;
            }
            ;
            if (oE.propertyClasses.length < 0)
                console.warn('The resourceClass with id="' + iE.id + '" does not specify any propertyClasses.');
            return oE;
        }
        function sC2int(iE) {
            var oE = aC2int(iE);
            oE.title = makeTitle('statementClass', iE.title);
            let ic = app.ontology.getIcon('statementClass', oE.title);
            if (ic || iE.icon)
                oE.icon = ic || iE.icon;
            if (iE.isUndirected)
                oE.isUndirected = iE.isUndirected;
            if (iE[names.sbjClasses])
                oE.subjectClasses = iE[names.sbjClasses].map((el) => { return LIB.makeKey(el.id || el); });
            if (iE[names.objClasses])
                oE.objectClasses = iE[names.objClasses].map((el) => { return LIB.makeKey(el.id || el); });
            return oE;
        }
        function hC2int(iE) {
            var oE = aC2int(iE);
            oE.title = makeTitle('resourceClass', iE.title);
            oE.isHeading = true;
            return oE;
        }
        function p2int(iE) {
            if (Array.isArray(iE.values) && iE.values.length > 0 || iE.value) {
                var oE = {
                    class: LIB.makeKey(iE[names.pClass].id || iE[names.pClass])
                }, dT = LIB.dataTypeOf(oE["class"], self);
                oE.values = makeValues(iE, dT);
                if (oE.values.length > 0)
                    return oE;
            }
            ;
        }
        function a2int(iE) {
            let eCkey = iE.subject ? LIB.makeKey(iE[names.sClass].id || iE[names.sClass])
                : (iE.nodes ? LIB.makeKey(iE[names.hClass].id || iE[names.hClass])
                    : LIB.makeKey(iE[names.rClass].id || iE[names.rClass]));
            var oE = {
                id: iE.id,
                class: eCkey,
                changedAt: LIB.addTimezoneIfMissing(iE.changedAt)
            };
            if (iE.alternativeIds)
                oE.alternativeIds = iE.alternativeIds.map((a) => { return LIB.makeKey(a); });
            if (iE.changedBy)
                oE.changedBy = iE.changedBy;
            if (iE.revision)
                oE.revision = typeof (iE.revision) == 'number' ? iE.revision.toString() : iE.revision;
            if (iE.replaces)
                oE.replaces = iE.replaces;
            if (iE.properties && iE.properties.length > 0)
                oE.properties = LIB.forAll(iE.properties, (e) => { return p2int(e); });
            [
                { name: 'description', nativePrp: iE.description, tiL: CONFIG.descProperties, cl: CONFIG.propClassDesc },
                { name: 'title', nativePrp: iE.title, tiL: CONFIG.titleProperties, cl: CONFIG.propClassTitle }
            ].forEach((pD) => {
                if (pD.nativePrp && propertyMissing(pD.tiL, oE)) {
                    LIB.addProperty(oE, {
                        class: { id: suitablePropertyClassId(pD, eCkey) },
                        values: [makeMultiLanguageText(pD.nativePrp)]
                    });
                    console.info("Added a " + pD.name + " property to element with id '" + oE.id + "'");
                }
                ;
            });
            return oE;
            function propertyMissing(L, el) {
                if (Array.isArray(el.properties))
                    for (var p of el.properties) {
                        if (L.includes(LIB.classTitleOf(p['class'], self.propertyClasses)))
                            return false;
                    }
                ;
                return true;
            }
            function suitablePropertyClassId(pDef, eCk) {
                let eC = LIB.itemByKey((iE.subject ? self.statementClasses : self.resourceClasses), eCk);
                for (var pCk of eC.propertyClasses) {
                    let pC = LIB.itemByKey(self.propertyClasses, pCk);
                    if (pC && pDef.tiL.includes(pC.title))
                        return pC.id;
                }
                ;
                for (var ti of pDef.tiL) {
                    let pC = LIB.itemBy(self.propertyClasses, 'title', ti);
                    if (pC) {
                        LIB.addPCReference(eC, { id: pC.id });
                        return pC.id;
                    }
                }
                ;
                let pCid = LIB.addClassesTo(pDef.cl, self).id;
                LIB.addPCReference(eC, { id: pCid });
                return pCid;
            }
        }
        function r2int(iE) {
            var oE = a2int(iE);
            return oE;
        }
        function s2int(iE) {
            var oE = a2int(iE);
            oE.subject = LIB.makeKey(iE.subject.id || iE.subject);
            oE.object = LIB.makeKey(iE.object.id || iE.object);
            if (iE.resourceToLink)
                oE.resourceToLink = iE.resourceToLink;
            return oE;
        }
        function h2int(iE) {
            var oE;
            if (names.hClasses) {
                var iR = a2int(iE);
                iR['class'] = LIB.makeKey(iE[names.hClass].id || iE[names.hClass]);
                self.resources.push(iR);
                oE = {
                    id: CONFIG.prefixN + iR.id,
                    resource: LIB.keyOf(iR),
                    changedAt: LIB.addTimezoneIfMissing(iE.changedAt || spD.changedAt) || new Date().toISOString()
                };
                if (iE.revision)
                    oE.revision = typeof (iE.revision) == 'number' ? iE.revision.toString() : iE.revision;
                if (iE.changedBy)
                    oE.changedBy = iE.changedBy;
            }
            else {
                oE = i2int(iE);
                oE.resource = LIB.makeKey(iE.resource.id || iE.resource);
                if (iE.predecessor)
                    oE.predecessor = LIB.makeKey(iE.predecessor.id || iE.predecessor);
            }
            ;
            oE.nodes = LIB.forAll(iE.nodes, n2int);
            return oE;
            function n2int(iE) {
                var oE = {
                    id: iE.id,
                    resource: LIB.makeKey(iE[names.r].id || iE[names.r]),
                    changedAt: LIB.addTimezoneIfMissing(iE.changedAt || spD.changedAt) || new Date().toISOString()
                };
                if (iE.revision)
                    oE.revision = typeof (iE.revision) == 'number' ? iE.revision.toString() : iE.revision;
                if (iE.changedBy)
                    oE.changedBy = iE.changedBy;
                if (iE.nodes)
                    oE.nodes = LIB.forAll(iE.nodes, n2int);
                return oE;
            }
        }
        function f2int(iE) {
            var oE = i2int(iE);
            oE.title = (iE.title ? iE.title : iE.id).replace(/\\/g, '/');
            if (iE.revision)
                oE.revision = typeof (iE.revision) == 'number' ? iE.revision.toString() : iE.revision;
            if (iE.blob) {
                oE.type = iE.blob.type || iE.type || LIB.attachment2mediaType(oE.title);
                oE.blob = iE.blob;
            }
            else if (iE.dataURL) {
                oE.type = iE.type || LIB.attachment2mediaType(oE.title);
                oE.dataURL = iE.dataURL;
            }
            else
                oE.type = iE.type;
            return oE;
        }
        function makeTitle(ctg, ti) {
            let str = LIB.cleanValue(typeof (ti) == 'string' ? ti : ti[0].text);
            return (opts.normalizeTerms ? app.ontology.normalize(ctg, str) : str);
        }
        function normalizeLanguageText(v) {
            let o = {
                text: app.ontology.normalize('all', v.text)
            };
            if (v.language)
                o.language = v.language;
            return o;
        }
        function makeValues(prp, dT) {
            if (Array.isArray(prp.values)) {
                return prp.values
                    .map((val) => {
                    if (val) {
                        if (dT.enumeration) {
                            return val;
                        }
                        ;
                        switch (dT.type) {
                            case XsDataType.String:
                                if (typeof (val) == 'string') {
                                    if (val.length < 1)
                                        return;
                                    console.warn("With SpecIF v1.1 and later, a property of type '" + XsDataType.String + "' should be a multi-language text.");
                                    val = LIB.makeMultiLanguageValue(LIB.uriBack2slash(LIB.cleanValue(val)));
                                }
                                ;
                                if (LIB.multiLanguageValueHasContent(val))
                                    return val.map((singleLang) => {
                                        let sl = { text: LIB.uriBack2slash(LIB.cleanValue(singleLang.text)) };
                                        if (singleLang.language)
                                            sl.language = singleLang.language;
                                        return sl;
                                    })
                                        .filter((sl) => !!sl.text);
                                else
                                    return;
                            case XsDataType.DateTime:
                                if (typeof (val) == 'string')
                                    return makeISODate(LIB.cleanValue(val));
                                else
                                    throw "Property Value of " + prp.id + " with class " + val['class'] + " must be a string.";
                            case XsDataType.Boolean:
                                if (CONFIG.valuesTrue.includes(LIB.cleanValue(val)))
                                    return "true";
                                if (CONFIG.valuesFalse.includes(LIB.cleanValue(val)))
                                    return "false";
                                console.warn('Unknown boolean value ' + LIB.cleanValue(val) + ' skipped.');
                                break;
                            default:
                                return LIB.cleanValue(val);
                        }
                    }
                })
                    .filter((p) => !!p);
            }
            ;
            if (LIB.isString(prp.value) || LIB.isMultiLanguageValue(prp.value)) {
                switch (dT.type) {
                    case XsDataType.String:
                    case "xhtml":
                        if (dT.enumeration) {
                            let vL = LIB.cleanValue(prp.value).split(',');
                            return vL.map((v) => { return v.trim(); });
                        }
                        ;
                        let vL = Array.isArray(prp.value) ?
                            prp.value.map((val) => {
                                val.text = LIB.uriBack2slash(LIB.cleanValue(val.text));
                                return val;
                            })
                            : LIB.uriBack2slash(LIB.cleanValue(prp.value));
                        return [makeMultiLanguageText(vL)];
                    case XsDataType.DateTime:
                        return [makeISODate(LIB.cleanValue(prp.value))];
                    case XsDataType.Boolean:
                        if (CONFIG.valuesTrue.includes(LIB.cleanValue(prp.value)))
                            return ["true"];
                        if (CONFIG.valuesFalse.includes(LIB.cleanValue(prp.value)))
                            return ["false"];
                        console.warn('Unknown boolean value ' + LIB.cleanValue(prp.value) + ' skipped.');
                        return [];
                    default:
                        return [LIB.cleanValue(prp.value)];
                }
            }
            else
                throw "Invalid property with class " + prp[names.pClass] + ".";
            function makeISODate(str) {
                return LIB.addTimezoneIfMissing(str.replace(/(\d\+|\d-)(\d\d)(\d\d)$/, (match, $1, $2, $3) => {
                    return $1 + $2 + ':' + $3;
                }));
            }
        }
        function makeMultiLanguageText(iE) {
            return (typeof (iE) == 'string' ?
                [{ text: LIB.cleanValue(iE) }]
                : LIB.cleanValue(iE));
        }
    }
    toExt(opts) {
        return new Promise((resolve, reject) => {
            let self = this, pend = 0;
            let spD = Object.assign(app.ontology.makeTemplate(), {
                id: this.id,
                title: LIB.selectTargetLanguage(this.title, opts)
            });
            function nodeIsNoRoot(r) {
                let valL = LIB.valuesByTitle(r, [CONFIG.propClassType], self);
                return valL.length < 1 || LIB.languageTextOf(valL[0], { targetLanguage: "default" }) != CONFIG.hierarchyRoot;
            }
            if (opts && opts.createHierarchyRootIfMissing) {
                for (var i = this.hierarchies.length - 1; i > -1; i--) {
                    let r = LIB.itemByKey(this.resources, this.hierarchies[i].resource);
                    if (nodeIsNoRoot(r)) {
                        let oC = app.ontology.generateSpecifClasses({ terms: [CONFIG.resClassFolder], referencesWithoutRevision: true, delta: true });
                        ['dataTypes', 'propertyClasses', 'resourceClasses'].forEach((li) => { LIB.cacheL(spD[li], oC[li]); });
                        break;
                    }
                }
            }
            ;
            if (LIB.multiLanguageValueHasContent(this.description))
                spD.description = LIB.selectTargetLanguage(this.description, opts);
            if (this.language)
                spD.language = this.language;
            if (this.rights && this.rights.title && this.rights.url)
                spD.rights = this.rights;
            if (app.me && app.me.email) {
                spD.createdBy = {
                    familyName: app.me.lastName,
                    givenName: app.me.firstName,
                    email: app.me.email
                };
                if (app.me.organization)
                    spD.createdBy.org = { organizationName: app.me.organization };
            }
            else {
                if (this.createdBy && this.createdBy.email) {
                    spD.createdBy = {
                        familyName: this.createdBy.familyName,
                        givenName: this.createdBy.givenName,
                        email: this.createdBy.email
                    };
                    if (this.createdBy.org && this.createdBy.org.organizationName)
                        spD.createdBy.org = this.createdBy.org;
                }
                ;
            }
            ;
            LIB.cacheL(spD.dataTypes, LIB.forAll(this.dataTypes, dT2ext));
            LIB.cacheL(spD.propertyClasses, LIB.forAll(this.propertyClasses, pC2ext));
            LIB.cacheL(spD.resourceClasses, LIB.forAll(this.resourceClasses, rC2ext));
            LIB.cacheL(spD.statementClasses, LIB.forAll(this.statementClasses, sC2ext));
            for (var f of this.files) {
                pend++;
                f2ext(f)
                    .then((oF) => {
                    spD.files.push(oF);
                    if (--pend < 1)
                        finalize();
                }, reject);
            }
            ;
            LIB.cacheL(spD.resources, LIB.forAll((this.resources), r2ext));
            LIB.cacheL(spD.statements, LIB.forAll(this.statements, s2ext));
            LIB.cacheL(spD.hierarchies, LIB.forAll(this.hierarchies, h2ext));
            if (pend < 1)
                finalize();
            return;
            function finalize() {
                resolve(spD);
            }
            function i2ext(iE) {
                var oE = {
                    id: iE.id,
                    changedAt: iE.changedAt
                };
                if (iE.title)
                    oE.title = LIB.titleOf(iE, opts);
                if (LIB.multiLanguageValueHasContent(iE.description))
                    oE.description = LIB.makeMultiLanguageValue(LIB.languageTextOf(iE.description, opts));
                if (iE.revision)
                    oE.revision = iE.revision;
                if (iE.replaces)
                    oE.replaces = iE.replaces;
                if (iE.changedBy && iE.changedBy != CONFIG.userNameAnonymous)
                    oE.changedBy = iE.changedBy;
                if (iE.createdAt)
                    oE.createdAt = iE.createdAt;
                if (iE.createdBy && iE.createdBy != CONFIG.userNameAnonymous)
                    oE.createdBy = iE.createdBy;
                return oE;
            }
            function dT2ext(iE) {
                var oE = i2ext(iE);
                oE.type = iE.type;
                switch (iE.type) {
                    case XsDataType.Double:
                        if (iE.fractionDigits)
                            oE.fractionDigits = iE.fractionDigits;
                    case XsDataType.Integer:
                        if (typeof (iE.minInclusive) == 'number')
                            oE.minInclusive = iE.minInclusive;
                        if (typeof (iE.maxInclusive) == 'number')
                            oE.maxInclusive = iE.maxInclusive;
                        break;
                    case XsDataType.String:
                        if (iE.maxLength)
                            oE.maxLength = iE.maxLength;
                }
                ;
                if (iE.enumeration) {
                    if (iE.type == XsDataType.String && opts.targetLanguage)
                        oE.enumeration = iE.enumeration.map((v) => {
                            let txt = LIB.languageTextOf(v.value, opts);
                            if (opts.lookupValues)
                                txt = app.ontology.localize(txt, opts);
                            return { id: v.id, value: LIB.makeMultiLanguageValue(txt) };
                        });
                    else
                        oE.enumeration = iE.enumeration;
                }
                ;
                return oE;
            }
            function pC2ext(iE) {
                var oE = i2ext(iE);
                if (iE.values)
                    oE.values = iE.values;
                oE.dataType = iE.dataType;
                let dT = LIB.itemByKey(self.dataTypes, iE.dataType);
                if (typeof (iE.multiple) == 'boolean')
                    oE.multiple = iE.multiple;
                else if (dT.multiple)
                    oE.multiple = true;
                if (iE.values)
                    oE.values = iE.values;
                if (iE.format)
                    oE.format = iE.format;
                if (iE.unit)
                    oE.unit = iE.unit;
                return oE;
            }
            function aC2ext(iE) {
                var oE = i2ext(iE);
                if (iE.icon)
                    oE.icon = iE.icon;
                if (iE.instantiation)
                    oE.instantiation = iE.instantiation;
                if (iE['extends'])
                    oE['extends'] = iE['extends'];
                if (iE.propertyClasses && iE.propertyClasses.length > 0)
                    oE.propertyClasses = iE.propertyClasses;
                return oE;
            }
            function rC2ext(iE) {
                var oE = aC2ext(iE);
                if (iE.isHeading)
                    oE.isHeading = true;
                if (Array.isArray(oE.propertyClasses) && oE.propertyClasses.length > 0 || LIB.isKey(oE['extends']))
                    return oE;
                console.error('Skipping resourceClass with id="' + iE.id + '" on export, because it does not specify any propertyClasses.');
            }
            function sC2ext(iE) {
                var oE = aC2ext(iE);
                if (iE.isUndirected)
                    oE.isUndirected = iE.isUndirected;
                if (iE.subjectClasses && iE.subjectClasses.length > 0)
                    oE.subjectClasses = iE.subjectClasses;
                if (iE.objectClasses && iE.objectClasses.length > 0)
                    oE.objectClasses = iE.objectClasses;
                return oE;
            }
            function p2ext(iE) {
                if (opts.showEmptyProperties || Array.isArray(iE.values) && iE.values.length > 0) {
                    let pC = LIB.itemByKey(spD.propertyClasses, iE['class']);
                    if (Array.isArray(opts.skipProperties)) {
                        for (var sP of opts.skipProperties) {
                            if (sP.title == pC.title && (sP.value == undefined || sP.value == LIB.displayValueOf(iE.values[0], opts)))
                                return;
                        }
                        ;
                    }
                    ;
                    var oE = {
                        class: iE['class'],
                        values: []
                    };
                    let dT = LIB.itemByKey(spD.dataTypes, pC.dataType);
                    if (dT.type == XsDataType.String && !dT.enumeration) {
                        if (opts.targetLanguage) {
                            let txt;
                            for (var v of iE.values) {
                                txt = LIB.languageTextOf(v, opts);
                                if (RE.vocabularyTerm.test(txt)) {
                                    if (opts.lookupValues)
                                        txt = app.ontology.localize(txt, opts);
                                }
                                else {
                                    if (pC.format == SpecifTextFormat.Xhtml) {
                                        txt = txt
                                            .replace(/^\s+/, "")
                                            .makeHTML(opts)
                                            .replace(/<br ?\/>\n/g, "<br/>");
                                        if (opts.allDiagramsAsImage)
                                            txt = refDiagramsAsImg(txt);
                                    }
                                    else {
                                        txt = txt
                                            .replace(/^\s+/, "")
                                            .stripHTML();
                                    }
                                    ;
                                }
                                ;
                                oE.values.push(LIB.makeMultiLanguageValue(txt));
                            }
                            ;
                            return oE;
                        }
                        ;
                        if (opts.allDiagramsAsImage) {
                            let lL;
                            for (var v of iE.values) {
                                lL = [];
                                for (var l of v)
                                    lL.push(l.language ? { text: refDiagramsAsImg(l.text), language: l.language } : { text: refDiagramsAsImg(l.text) });
                                oE.values.push(lL);
                            }
                            ;
                            return oE;
                        }
                    }
                    ;
                    oE.values = iE.values;
                    return oE;
                }
                ;
                return;
                function refDiagramsAsImg(val) {
                    let replaced = false;
                    val = val.replace(RE.tagObject, ($0, $1, $2) => {
                        if ($1)
                            $1 = $1.replace(RE.attrType, ($4, $5) => {
                                if (["application/bpmn+xml"].includes($5)) {
                                    replaced = true;
                                    return 'type="image/svg+xml"';
                                }
                                else
                                    return $4;
                            });
                        if (replaced)
                            $1 = $1.replace(RE.attrData, ($6, $7) => {
                                return 'data="' + $7.fileName() + '.svg"';
                            });
                        return '<object ' + $1 + $2;
                    });
                    return val;
                }
            }
            function a2ext(iE) {
                var oE = i2ext(iE);
                oE['class'] = iE['class'];
                if (iE.alternativeIds)
                    oE.alternativeIds = iE.alternativeIds;
                let pL = iE.properties;
                if (pL && pL.length > 0)
                    oE.properties = LIB.forAll(pL, p2ext);
                return oE;
            }
            function r2ext(iE) {
                var oE = a2ext(iE);
                return oE;
            }
            function s2ext(iE) {
                var oE = a2ext(iE);
                oE.subject = iE.subject;
                oE.object = iE.object;
                return oE;
            }
            function n2ext(iN) {
                let oN = {
                    id: iN.id,
                    resource: { id: iN.resource.id },
                    changedAt: iN.changedAt
                };
                if (iN.nodes && iN.nodes.length > 0)
                    oN.nodes = LIB.forAll(iN.nodes, n2ext);
                if (iN.revision)
                    oN.revision = iN.revision;
                return oN;
            }
            function h2ext(iN) {
                let r = LIB.itemByKey(self.resources, iN.resource);
                if (opts && opts.createHierarchyRootIfMissing && nodeIsNoRoot(r)) {
                    console.info("Adding hierarchy root to hierarchy with id '" + iN.id + "'");
                    let rId = LIB.replacePrefix(CONFIG.prefixHR, iN.id);
                    spD.resources.push({
                        id: rId,
                        class: LIB.makeKey("RC-Folder"),
                        properties: [{
                                class: LIB.makeKey("PC-Name"),
                                values: [[{ text: "Root for " + iN.id }]]
                            }, {
                                class: LIB.makeKey("PC-Type"),
                                values: [[{ text: CONFIG.hierarchyRoot }]]
                            }],
                        changedAt: new Date().toISOString()
                    });
                    return {
                        id: CONFIG.prefixN + rId,
                        resource: LIB.makeKey(rId),
                        nodes: [n2ext(iN)],
                        changedAt: new Date().toISOString()
                    };
                }
                ;
                return n2ext(iN);
            }
            function f2ext(iE) {
                return new Promise((resolve, reject) => {
                    if (!opts || !opts.allDiagramsAsImage || CONFIG.imgTypes.includes(iE.type)) {
                        resolve(iE);
                    }
                    else {
                        switch (iE.type) {
                            case 'application/bpmn+xml':
                                LIB.blob2text(iE, (txt) => {
                                    bpmn2svg(txt).then((result) => {
                                        let nFileName = iE.title.fileName() + '.svg';
                                        resolve({
                                            blob: new Blob([result.svg], { type: "image/svg+xml" }),
                                            id: 'F-' + simpleHash(nFileName),
                                            title: nFileName,
                                            type: 'image/svg+xml',
                                            changedAt: iE.changedAt
                                        });
                                    }, reject);
                                });
                                break;
                            default:
                                console.warn("Cannot transform file '" + iE.title + "' of type '" + iE.type + "' to an image.");
                                resolve({
                                    id: 'F-' + simpleHash(iE.title),
                                    title: iE.title,
                                    changedAt: iE.changedAt
                                });
                        }
                    }
                });
            }
        });
    }
    toExt_v10(opts) {
        const myLang = { targetLanguage: opts.targetLanguage || this.language || 'en' };
        return new Promise((resolve, reject) => {
            var pend = 0, spD = {
                id: this.id,
                title: LIB.languageTextOf(this.title, myLang),
                $schema: 'https://specif.de/v1.0/schema.json',
                generator: app.title,
                generatorVersion: CONFIG.appVersion,
                createdAt: new Date().toISOString()
            };
            if (LIB.multiLanguageValueHasContent(this.description))
                spD.description = LIB.languageTextOf(this.description, myLang);
            if (this.language)
                spD.language = this.language;
            if (this.rights && this.rights.title && this.rights.url)
                spD.rights = this.rights;
            else
                spD.rights = {
                    title: "Creative Commons 4.0 CC BY-SA",
                    url: "https://creativecommons.org/licenses/by-sa/4.0/"
                };
            if (app.me && app.me.email) {
                spD.createdBy = {
                    familyName: app.me.lastName,
                    givenName: app.me.firstName,
                    email: { value: app.me.email, type: "text/html" }
                };
                if (app.me.organization)
                    spD.createdBy.org = { organizationName: app.me.organization };
            }
            else {
                if (this.createdBy && this.createdBy.email) {
                    spD.createdBy = {
                        familyName: this.createdBy.familyName,
                        givenName: this.createdBy.givenName,
                        email: { value: this.createdBy.email, type: "text/html" }
                    };
                    if (this.createdBy.org && this.createdBy.org.organizationName)
                        spD.createdBy.org = this.createdBy.org;
                }
                ;
            }
            ;
            spD.dataTypes = LIB.forAll(this.dataTypes, dT2ext);
            spD.propertyClasses = LIB.forAll(this.propertyClasses, pC2ext);
            spD.resourceClasses = LIB.forAll(this.resourceClasses, rC2ext);
            spD.statementClasses = LIB.forAll(this.statementClasses, sC2ext);
            spD.files = [];
            for (var f of this.files) {
                pend++;
                f2ext(f)
                    .then((oF) => {
                    spD.files.push(oF);
                    if (--pend < 1)
                        finalize();
                }, reject);
            }
            ;
            spD.resources = LIB.forAll((this.resources), r2ext);
            spD.statements = LIB.forAll(this.statements, s2ext);
            spD.hierarchies = LIB.forAll(this.hierarchies, n2ext);
            if (pend < 1)
                finalize();
            return;
            function finalize() {
                resolve(spD);
            }
            function i2ext(iE) {
                var oE = {
                    id: iE.id,
                    changedAt: iE.changedAt
                };
                if (iE.title)
                    oE.title = LIB.titleOf(iE, opts);
                if (LIB.multiLanguageValueHasContent(iE.description))
                    oE.description = LIB.languageTextOf(iE.description, myLang);
                if (iE.revision)
                    oE.revision = iE.revision;
                if (iE.replaces)
                    oE.replaces = iE.replaces;
                if (iE.changedBy)
                    oE.changedBy = iE.changedBy;
                if (iE.createdAt)
                    oE.createdAt = iE.createdAt;
                if (iE.createdBy)
                    oE.createdBy = iE.createdBy;
                return oE;
            }
            function dT2ext(iE) {
                var oE = i2ext(iE);
                switch (iE.type) {
                    case XsDataType.Double:
                        if (iE.fractionDigits)
                            oE.fractionDigits = iE.fractionDigits;
                    case XsDataType.Integer:
                        if (typeof (iE.minInclusive) == 'number')
                            oE.minInclusive = iE.minInclusive;
                        if (typeof (iE.maxInclusive) == 'number')
                            oE.maxInclusive = iE.maxInclusive;
                        break;
                    case XsDataType.String:
                        if (iE.maxLength)
                            oE.maxLength = iE.maxLength;
                }
                ;
                if (iE.enumeration) {
                    oE.values = LIB.forAll(iE.enumeration, (v) => {
                        return { id: v.id, value: LIB.languageTextOf(v.value, myLang) };
                    });
                    oE.type = 'xs:enumeration';
                }
                else
                    oE.type = iE.type;
                if (iE.multiple)
                    oE.multiple = true;
                return oE;
            }
            function pC2ext(iE) {
                var oE = i2ext(iE);
                if (iE.values)
                    oE.values = iE.values;
                oE.dataType = iE.dataType;
                let dT = LIB.itemByKey(spD.dataTypes, iE.dataType);
                if (iE.multiple && !dT.multiple)
                    oE.multiple = true;
                if (iE.values) {
                    oE.value = iE.values[0];
                    if (iE.values.length > 1)
                        console.warn('Upon exporting to v1.0, only the first default value of ' + iE.id + ' can be included in the result.');
                }
                ;
                if (iE.format)
                    oE.format = iE.format;
                if (iE.unit)
                    oE.unit = iE.unit;
                return oE;
            }
            function aC2ext(iE) {
                var oE = i2ext(iE);
                if (iE.icon)
                    oE.icon = iE.icon;
                if (iE.instantiation)
                    oE.instantiation = iE.instantiation;
                if (iE['extends'])
                    oE['extends'] = iE['extends'];
                if (iE.propertyClasses && iE.propertyClasses.length > 0)
                    oE.propertyClasses = iE.propertyClasses;
                return oE;
            }
            function rC2ext(iE) {
                var oE = aC2ext(iE);
                if (iE.isHeading)
                    oE.isHeading = true;
                return oE;
            }
            function sC2ext(iE) {
                var oE = aC2ext(iE);
                if (iE.isUndirected)
                    oE.isUndirected = iE.isUndirected;
                if (iE.subjectClasses && iE.subjectClasses.length > 0)
                    oE.subjectClasses = iE.subjectClasses;
                if (iE.objectClasses && iE.objectClasses.length > 0)
                    oE.objectClasses = iE.objectClasses;
                return oE;
            }
            function p2ext(iE) {
                if (!iE.values || iE.values.length < 1)
                    return;
                let pC = LIB.itemByKey(spD.propertyClasses, iE['class']);
                if (Array.isArray(opts.skipProperties))
                    for (var sP of opts.skipProperties) {
                        if (sP.title == pC.title && (sP.value == undefined || sP.value == LIB.displayValueOf(iE.values[0], opts)))
                            return;
                    }
                ;
                var oE = {
                    class: iE['class']
                };
                let dT = LIB.itemByKey(spD.dataTypes, pC.dataType);
                if (dT.type == 'xs:enumeration') {
                    oE.value = "";
                    for (var v of iE.values) {
                        oE.value += (oE.value.length > 0 ? ", " : "") + v;
                    }
                    ;
                    return oE;
                }
                ;
                if (iE.values.length > 1)
                    console.warn('When transforming to SpecIF v1.0, only the first value of a property of class ' + iE['class'].id + ' has been taken.');
                if (dT.type == XsDataType.String) {
                    let v = iE.values[0];
                    if (opts.targetLanguage) {
                        let txt = LIB.languageTextOf(v, opts)
                            .replace(/^\s+/, "");
                        if (!RE.vocabularyTerm.test(txt)) {
                            if (pC.format == SpecifTextFormat.Xhtml) {
                                txt = txt
                                    .makeHTML(opts)
                                    .replace(/<br ?\/>\n/g, "<br/>");
                                if (opts.allDiagramsAsImage)
                                    txt = refDiagramsAsImg(txt);
                            }
                            else {
                                txt = txt
                                    .stripHTML();
                            }
                        }
                        ;
                        oE.value = opts.lookupValues ? app.ontology.localize(txt, opts) : txt;
                    }
                    else {
                        oE.value = [];
                        for (var l of v)
                            oE.value.push(l.language ? { text: refDiagramsAsImg(l.text), language: l.language } : { text: refDiagramsAsImg(l.text) });
                    }
                    ;
                    return oE;
                }
                ;
                oE.value = iE.values[0];
                return oE;
                function refDiagramsAsImg(val) {
                    if (!opts || !opts.allDiagramsAsImage)
                        return val;
                    let replaced = false;
                    val = val.replace(RE.tagObject, ($0, $1, $2) => {
                        if ($1)
                            $1 = $1.replace(RE.attrType, ($4, $5) => {
                                if (["application/bpmn+xml"].includes($5)) {
                                    replaced = true;
                                    return 'type="image/svg+xml"';
                                }
                                else
                                    return $4;
                            });
                        if (replaced)
                            $1 = $1.replace(RE.attrData, ($6, $7) => {
                                return 'data="' + $7.fileName() + '.svg"';
                            });
                        return '<object ' + $1 + $2;
                    });
                    return val;
                }
            }
            function a2ext(iE) {
                var oE = i2ext(iE);
                oE['class'] = iE['class'];
                if (iE.alternativeIds)
                    oE.alternativeIds = iE.alternativeIds;
                let pL = iE.properties;
                if (pL && pL.length > 0)
                    oE.properties = LIB.forAll(pL, p2ext);
                return oE;
            }
            function r2ext(iE) {
                var oE = a2ext(iE);
                oE.title = '';
                return oE;
            }
            function s2ext(iE) {
                var oE = a2ext(iE);
                oE.subject = iE.subject;
                oE.object = iE.object;
                return oE;
            }
            function n2ext(iN) {
                let oN = {
                    id: iN.id,
                    resource: { id: iN.resource.id },
                    changedAt: iN.changedAt
                };
                if (iN.nodes && iN.nodes.length > 0)
                    oN.nodes = LIB.forAll(iN.nodes, n2ext);
                if (iN.revision)
                    oN.revision = iN.revision;
                return oN;
            }
            function f2ext(iE) {
                return new Promise((resolve, reject) => {
                    if (!opts || !opts.allDiagramsAsImage || CONFIG.imgTypes.includes(iE.type)) {
                        resolve(iE);
                    }
                    else {
                        switch (iE.type) {
                            case 'application/bpmn+xml':
                                LIB.blob2text(iE, (txt) => {
                                    bpmn2svg(txt).then((result) => {
                                        let nFileName = iE.title.fileName() + '.svg';
                                        resolve({
                                            blob: new Blob([result.svg], { type: "image/svg+xml" }),
                                            id: 'F-' + simpleHash(nFileName),
                                            title: nFileName,
                                            type: 'image/svg+xml',
                                            changedAt: iE.changedAt
                                        });
                                    }, reject);
                                });
                                break;
                            default:
                                reject(new resultMsg(999, "Cannot transform file '" + iE.title + "' of type '" + iE.type + "' to an image."));
                        }
                    }
                });
            }
        });
    }
}
