"use strict";
/*!    SpecIF: Generate Specif classes from the Ontology.
    Dependencies: -
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    Author: se@enso-managers.de, Berlin
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/
class COntology {
    constructor(dta) {
        this.headings = [];
        this.modelElementClasses = [];
        this.termCategories = new Map([
            ["resourceClass", { synonymStatement: "SpecIF:isSynonymOfResource", prefix: CONFIG.prefixRC }],
            ["statementClass", { synonymStatement: "SpecIF:isSynonymOfStatement", prefix: CONFIG.prefixSC }],
            ["propertyClass", { synonymStatement: "SpecIF:isSynonymOfProperty", prefix: CONFIG.prefixPC }],
            ["propertyValue", { synonymStatement: "SpecIF:isSynonymOfValue", prefix: CONFIG.prefixV }]
        ]);
        this.termPrincipalClasses = new Map([
            ["SpecIF:TermResourceClass", "R-FolderTermsResourceClass"],
            ["SpecIF:TermStatementClass", "R-FolderTermsStatementClass"],
            ["SpecIF:TermPropertyClass", "R-FolderTermsPropertyClass"],
            ["SpecIF:TermPropertyValue", "R-FolderTermsPropertyValue"]
        ]);
        this.termClasses = [
            "SpecIF:TermResourceClass",
            "SpecIF:TermStatementClass",
            "SpecIF:TermPropertyClassString",
            "SpecIF:TermPropertyClassBoolean",
            "SpecIF:TermPropertyClassInteger",
            "SpecIF:TermPropertyClassReal",
            "SpecIF:TermPropertyClassTimestamp",
            "SpecIF:TermPropertyClassDuration",
            "SpecIF:TermPropertyClassURI",
            "SpecIF:TermPropertyValue"
        ];
        this.primitiveDataTypes = new Map([
            ["RC-SpecifTermpropertyclassstring", XsDataType.String],
            ["RC-SpecifTermpropertyclassboolean", XsDataType.Boolean],
            ["RC-SpecifTermpropertyclassinteger", XsDataType.Integer],
            ["RC-SpecifTermpropertyclassreal", XsDataType.Double],
            ["RC-SpecifTermpropertyclasstimestamp", XsDataType.DateTime],
            ["RC-SpecifTermpropertyclassduration", XsDataType.Duration],
            ["RC-SpecifTermpropertyclassuri", XsDataType.AnyURI]
        ]);
        this.termDefaultValues = [
            "SpecIF:DefaultValueString",
            "SpecIF:DefaultValueBoolean",
            "SpecIF:DefaultValueInteger",
            "SpecIF:DefaultValueReal",
            "SpecIF:DefaultValueTimestamp",
            "SpecIF:DefaultValueDuration",
            "SpecIF:DefaultValueAnyURI",
        ];
        this.eligibleLifecycleStatus = [
            "SpecIF:LifecycleStatusReleased",
            "SpecIF:LifecycleStatusEquivalent",
            "SpecIF:LifecycleStatusSubmitted",
            "SpecIF:LifecycleStatusExperimental"
        ];
        this.data = dta;
        dta.hierarchies = dta.hierarchies.filter((h) => {
            let r = LIB.itemByKey(dta.resources, h.resource);
            return this.valueByTitle(r, CONFIG.propClassType) == "W3C:Ontology";
        });
        if (dta.hierarchies.length < 1) {
            message.show("No ontology found.", { severity: 'warning' });
            return;
        }
        ;
        if (!this.checkConstraintsOntology()) {
            message.show("The Ontology violates one or more constraints, so no classes will be generated. Please see the browser log for details.", { severity: 'error' });
            return;
        }
        ;
        this.namespaces = this.getNamespaces();
        this.headings = this.getHeadings();
        this.modelElementClasses = this.getModelElementClasses();
        this.makeStatementsIsNamespace();
        this.options = {};
    }
    getTermResources(ctg, term) {
        ctg = ctg.toLowerCase();
        return this.data.resources
            .filter((r) => {
            let valL = LIB.valuesByTitle(r, [CONFIG.propClassTerm], this.data);
            return (valL.length > 0
                && LIB.languageTextOf(valL[0], { targetLanguage: "default" }) == term
                && (ctg == 'all' || LIB.classTitleOf(r['class'], this.data.resourceClasses).toLowerCase().includes(ctg)));
        });
    }
    getTermResource(ctg, term) {
        let resL = this.getTermResources(ctg, term);
        if (resL.length > 1)
            console.warn("Multiple resources describe term '" + term + "': " + resL.map((r) => { return r.id; }).toString());
        if (resL.length > 0)
            return resL[0];
    }
    getTerms(ctg) {
        let ctgL = Array.from(this.termCategories.keys());
        if (ctgL.includes(ctg)) {
            ctg = ctg.toLowerCase();
            return this.data.resources
                .filter((r) => {
                return LIB.classTitleOf(r['class'], this.data.resourceClasses).toLowerCase().includes(ctg);
            })
                .map((r) => {
                return this.valueByTitle(r, CONFIG.propClassTerm);
            });
        }
        ;
        throw Error("Programming Error: Unknown category '" + ctg + "'; must be one of " + ctgL.toString());
    }
    getClassId(ctg, term) {
        if (RE.vocabularyTerm.test(term)) {
            let tR = this.getTermResource(ctg, term);
            if (tR) {
                let c = this.termCategories.get(ctg);
                if (c)
                    return this.makeIdAndTitle(tR, c.prefix).id;
                else
                    throw Error("Programming Error: Unknown category '" + ctg + "'");
            }
            ;
        }
        ;
    }
    localize(term, opts) {
        if (RE.vocabularyTerm.test(term)) {
            let tR = this.getTermResource('all', term);
            if (tR) {
                let lnL = [];
                if (opts.plural) {
                    lnL = LIB.valuesByTitle(tR, ["SpecIF:LocalTermPlural"], this.data);
                    if (lnL.length < 1) {
                        let stL = this.statementsByTitle(tR, ["SpecIF:isPluralOfResource"], { asSubject: false, asObject: true });
                        if (stL.length > 0) {
                            let tR = LIB.itemByKey(this.data.resources, stL[0].subject);
                            lnL = LIB.valuesByTitle(tR, ["SpecIF:LocalTerm"], this.data);
                        }
                    }
                }
                else {
                    lnL = LIB.valuesByTitle(tR, ["SpecIF:LocalTerm"], this.data);
                }
                ;
                if (lnL.length > 0) {
                    let newT = LIB.languageTextOf(lnL[0], opts);
                    return newT;
                }
            }
        }
        ;
        return term;
    }
    globalize(ctg, name) {
        if (RE.vocabularyTerm.test(name))
            return name;
        let rC;
        let termL = this.data.resources.filter((r) => {
            rC = LIB.itemByKey(this.data.resourceClasses, r['class']);
            if (this.termClasses.includes(LIB.titleOf(rC))
                && (LIB.titleOf(rC).toLowerCase().includes(ctg.toLowerCase())
                    || ['all', 'any'].includes(ctg))) {
                let tVL = LIB.valuesByTitle(r, ["SpecIF:LocalTerm", "SpecIF:LocalTermPlural"], this.data);
                for (let v of tVL) {
                    for (var l of v) {
                        if (l.text.toLowerCase() == name.toLowerCase())
                            return true;
                    }
                }
            }
            ;
            return false;
        });
        if (termL.length > 0) {
            for (let status of this.eligibleLifecycleStatus)
                for (let t of termL) {
                    if (this.valueByTitle(t, "SpecIF:TermStatus") == status) {
                        let newT = this.valueByTitle(t, CONFIG.propClassTerm);
                        console.info('Global term assigned: ' + name + ' → ' + newT);
                        return newT;
                    }
                }
        }
        ;
        return name;
    }
    getPreferredTerm(ctg, term) {
        if (term.startsWith('dcterms:'))
            return term;
        let tR = this.getTermResource(ctg, term);
        if (tR) {
            if (this.valueByTitle(tR, "SpecIF:TermStatus") == "SpecIF:LifecycleStatusReleased")
                return term;
            let ctgV = this.termCategories.get(ctg), ctgL = ctgV ? [ctgV] : Array.from(this.termCategories.values()), staL = this.statementsByTitle(tR, ctgL.map(c => c.synonymStatement), { asSubject: true, asObject: true }), resL = staL.map((st) => {
                return LIB.itemById(this.data.resources, (st.object.id == tR.id ? st.subject.id : st.object.id));
            }), synL = resL.filter((r) => {
                return this.valueByTitle(r, "SpecIF:TermStatus") == "SpecIF:LifecycleStatusReleased";
            });
            if (synL.length < 1)
                return term;
            if (synL.length > 1)
                console.warn('Multiple equivalent terms are released: ', synL.map((r) => { return r.id; }).toString());
            let newT = this.valueByTitle(synL[0], CONFIG.propClassTerm);
            console.info('Preferred term assigned: ' + term + ' → ' + newT);
            return newT;
        }
        ;
        return term;
    }
    normalize(ctg, term) {
        let str = this.globalize(ctg, term);
        str = this.getPreferredTerm(ctg, str);
        return str;
    }
    getTermValue(ctg, term, title) {
        let tR = this.getTermResource(ctg, term);
        if (tR) {
            return this.valueByTitle(tR, title);
        }
        ;
    }
    propertyClassIsText(term) {
        let len = this.getTermValue("propertyClass", term, "SpecIF:StringMaxLength");
        return len == undefined || typeof (len) == 'number' && len > CONFIG.textThreshold;
    }
    propertyClassIsFormatted(term) {
        return this.getTermValue("propertyClass", term, "SpecIF:TextFormat") == SpecifTextFormat.Xhtml;
    }
    getIcon(ctg, term) {
        return this.getTermValue(ctg, term, "SpecIF:Icon");
    }
    changeNamespace(term, opts) {
        let self = this;
        if (!opts.targetNamespaces || opts.targetNamespaces.length < 1) {
            return term;
        }
        ;
        for (var nsp of opts.targetNamespaces) {
            if (term.startsWith(nsp))
                return term;
        }
        ;
        let tR = this.getTermResource('all', term);
        if (tR) {
            let v = findSynonymStatementOf(tR['class']), staL = this.statementsByTitle(tR, [v], { asSubject: true, asObject: true }), resL = staL.map((st) => {
                return LIB.itemById(this.data.resources, (st.object.id == tR.id ? st.subject.id : st.object.id));
            }), synL = findSynonym(resL, opts.targetNamespaces);
            if (synL.length < 1)
                return term;
            if (synL.length > 1)
                console.warn('Multiple equivalent terms have the desired namespace: ', synL.map((r) => { return r.id; }).toString());
            let newT = this.valueByTitle(synL[0], CONFIG.propClassTerm);
            console.info('Term with desired namespace assigned: ' + term + ' → ' + newT);
            return newT;
        }
        ;
        return term;
        function findSynonymStatementOf(rCk) {
            let rC = LIB.itemByKey(self.data.resourceClasses, rCk);
            for (let [ctg, syn] of self.termCategories) {
                if (rC.title.toLowerCase().includes(ctg.toLowerCase()))
                    return syn;
            }
            ;
            throw (new Error("No synonym statement found for '" + rCk.id + "'."));
        }
        function findSynonym(rL, nspL) {
            let sL = [];
            for (var nsp of nspL) {
                sL = rL.filter((r) => {
                    return self.valueByTitle(r, CONFIG.propClassTerm).startsWith(nsp)
                        && ["SpecIF:LifecycleStatusReleased", "SpecIF:LifecycleStatusEquivalent"].includes(self.valueByTitle(r, "SpecIF:TermStatus"));
                });
                if (sL.length > 0)
                    return sL;
            }
            ;
            return [];
        }
    }
    makeTemplate() {
        return {
            '@Context': "http://purl.org/dc/terms/",
            "id": "",
            "$schema": "https://specif.de/v1.1/schema.json",
            "title": [],
            "generator": app.title,
            "generatorVersion": CONFIG.appVersion,
            "createdAt": new Date().toISOString(),
            "rights": {
                "title": "Creative Commons 4.0 CC BY-SA",
                "url": "https://creativecommons.org/licenses/by-sa/4.0/"
            },
            "dataTypes": [],
            "propertyClasses": [],
            "resourceClasses": [],
            "statementClasses": [],
            "resources": [],
            "statements": [],
            "files": [],
            "hierarchies": []
        };
    }
    generateSpecifClasses(opts) {
        if (Array.isArray(opts.domains) && opts.domains.length > 0
            || Array.isArray(opts.terms) && opts.terms.length > 0) {
            this.options = opts;
            let spId = "P-SpecifClasses", now = new Date().toISOString();
            if (Array.isArray(opts.domains)) {
                opts.domains.forEach((d) => { spId += '-' + d.toCamelCase(); });
            }
            ;
            this.required = {
                sTL: []
            };
            this.generated = {
                dTL: [],
                pCL: [],
                rCL: [],
                sCL: [],
                rL: [],
                hL: []
            };
            [
                { resultL: this.generated.pCL, classes: Array.from(this.primitiveDataTypes.keys()), fn: this.makePC.bind(this) },
                { resultL: this.generated.rCL, classes: ["RC-SpecifTermresourceclass"], fn: this.makeRC.bind(this) },
                { resultL: this.generated.sCL, classes: ["RC-SpecifTermstatementclass"], fn: this.makeSC.bind(this) }
            ].forEach((step) => { LIB.cacheL(step.resultL, this.makeClasses(step.classes, step.fn)); });
            while (this.required.sTL.length > 0) {
                let sCL = [].concat(this.required.sTL);
                this.required.sTL.length = 0;
                LIB.cacheL(this.generated.sCL, sCL.map(this.makeSC.bind(this)));
            }
            ;
            if (this.options.domains && this.options.domains.includes("SpecIF:DomainOntology")) {
                let rId = "R-FolderOntology";
                this.generated.rL.push(LIB.itemByKey(this.data.resources, { id: rId }));
                let h = {
                    id: LIB.replacePrefix(CONFIG.prefixN, rId),
                    resource: { id: rId },
                    nodes: [],
                    changedAt: now
                };
                Array.from(this.termPrincipalClasses.values(), (clId) => {
                    this.generated.rL.push(LIB.itemByKey(this.data.resources, { id: clId }));
                    h.nodes.push({
                        id: LIB.replacePrefix(CONFIG.prefixN, clId),
                        resource: { id: clId },
                        nodes: [],
                        changedAt: now
                    });
                });
                this.generated.hL.push(h);
            }
            ;
            return Object.assign(opts.delta ? {} : this.makeTemplate(), {
                "id": spId,
                "title": [{
                        "text": "SpecIF Classes" + (opts.domains ? (" for " + opts.domains.toString().replace(/:/g, " ")) : ""),
                        "format": SpecifTextFormat.Plain,
                        "language": "en"
                    }],
                "description": [{
                        "text": "A set of SpecIF Classes derived from a SpecIF Ontology" + (opts.domains ? (" for the domain" + (opts.domains.length < 2 ? " " : "s ") + opts.domains.toString().replace(/,/g, ", ") + ".") : ""),
                        "format": SpecifTextFormat.Plain,
                        "language": "en"
                    }],
                "dataTypes": this.generated.dTL,
                "propertyClasses": this.generated.pCL,
                "resourceClasses": this.generated.rCL,
                "statementClasses": this.generated.sCL,
                "resources": this.generated.rL,
                "hierarchies": this.generated.hL
            });
        }
        else {
            message.show("No domain or term specified, so no classes will be generated.", { severity: 'warning' });
            return this.makeTemplate();
        }
    }
    makeClasses(rCIdL, createFn) {
        let self = this;
        let cL = [], idL = LIB.referencedResourcesByClass(this.data.resources, this.data.hierarchies, rCIdL);
        if (idL.length > 0) {
            let tL = idL
                .filter(isSelected);
            cL = LIB.forAll(tL, createFn);
        }
        ;
        return cL;
        function isSelected(r) {
            let localOpts = Object.assign({ SpecIF_LifecycleStatusReleased: true }, self.options);
            return hasSelectedStatus(r)
                && (hasSelectedDomain(r) || hasSelectedTerm(r));
            function hasSelectedDomain(el) {
                if (Array.isArray(self.options.domains)) {
                    let elDomains = LIB.valuesByTitle(el, [CONFIG.propClassDomain], self.data);
                    for (let d of elDomains) {
                        if (self.options.domains.includes(LIB.displayValueOf(d, { targetLanguage: 'default' })))
                            return true;
                    }
                }
                ;
                return false;
            }
            function hasSelectedTerm(el) {
                if (Array.isArray(self.options.terms)) {
                    let elTerms = LIB.valuesByTitle(el, [CONFIG.propClassTerm], self.data);
                    if (elTerms.length > 0 && self.options.terms.includes(LIB.displayValueOf(elTerms[0], { targetLanguage: 'default' })))
                        return true;
                }
                ;
                return false;
            }
            function hasSelectedStatus(el) {
                let selStatus = LIB.valuesByTitle(el, ["SpecIF:TermStatus"], self.data);
                for (let s of selStatus) {
                    if (localOpts[LIB.displayValueOf(s, { targetLanguage: 'default' }).toJsId()])
                        return true;
                }
                ;
                return false;
            }
        }
    }
    makeDT(r) {
        let self = this;
        let ty = this.primitiveDataTypes.get(r["class"].id), prep = this.makeIdAndTitle(r, CONFIG.prefixPC), dtId = LIB.replacePrefix(CONFIG.prefixDT, prep.id), vId = LIB.replacePrefix(CONFIG.prefixV, prep.id), stL = this.statementsByTitle(r, ["SpecIF:hasEnumValue"], { asSubject: true }), oL = stL.map((st) => {
            return LIB.itemById(this.data.resources, st.object.id);
        }), enumL = LIB.forAll(oL, (o, idx) => {
            let evL = LIB.valuesByTitle(o, [CONFIG.propClassTerm], this.data);
            if (evL.length > 0)
                return {
                    id: this.valueByTitle(o, CONFIG.propClassId) || vId + '-' + idx.toString(),
                    value: evL[0]
                };
            else
                console.warn("Property value term '" + o.id + "' is undefined");
        }), dT = {};
        switch (ty) {
            case XsDataType.String:
                let maxLen = this.valueByTitle(r, "SpecIF:StringMaxLength");
                dT = {
                    id: "DT-String" + (maxLen ? "-LE" + maxLen : ""),
                    title: "String" + (maxLen ? " <=" + maxLen : ""),
                    description: [{ text: "Text string" + (enumL.length > 0 ? " with enumerated values for " + prep.title : (maxLen ? " with maximum length " + maxLen : "")) }],
                    maxLength: maxLen ? parseInt(maxLen) : undefined
                };
                break;
            case XsDataType.Boolean:
                dT = {
                    id: "DT-Boolean",
                    title: "Boolean Value",
                    description: [{ text: "A Boolean value." }]
                };
                break;
            case XsDataType.Integer:
                let maxI = this.valueByTitle(r, "SpecIF:IntegerMaxInclusive"), minI = this.valueByTitle(r, "SpecIF:IntegerMinInclusive");
                dT = {
                    id: "DT-Integer" + (minI ? "-GE" + minI : "") + (maxI ? "-LE" + maxI : ""),
                    title: "Integer Value" + (minI ? " >=" + minI : "") + (maxI ? " <=" + maxI : ""),
                    description: [{ text: "A numerical integer value" + (minI && maxI ? " with minimum value " + minI + " and maximum value " + maxI : (minI ? " with minimum value " + minI : (maxI ? " with maximum value " + maxI : ""))) + "." }],
                    minInclusive: minI ? parseInt(minI) : undefined,
                    maxInclusive: maxI ? parseInt(maxI) : undefined
                };
                break;
            case XsDataType.Double:
                let frD = this.valueByTitle(r, "SpecIF:RealFractionDigits"), maxR = this.valueByTitle(r, "SpecIF:RealMaxInclusive"), minR = this.valueByTitle(r, "SpecIF:RealMinInclusive");
                dT = {
                    id: "DT-Real" + (minR ? "-GE" + minR : "") + (maxR ? "-LE" + maxR : "") + (frD ? "-FD" + frD : ""),
                    title: "Real Value" + (minR ? " >=" + minR : "") + (maxR ? " <=" + maxR : "") + (frD ? " " + frD + "digits" : ""),
                    description: [{ text: "A numerical floating point number (double precision)" + (minR && maxR ? " with minimum value " + minR + " and maximum value " + maxR : (minR ? " with minimum value " + minR : (maxR ? " with maximum value " + maxR : ""))) + (frD ? " having no more than " + frD + " digits" : "") + "." }],
                    minInclusive: minR ? parseFloat(minR) : undefined,
                    maxInclusive: maxR ? parseFloat(maxR) : undefined,
                    fractionDigits: frD ? parseInt(frD) : undefined
                };
                break;
            case XsDataType.DateTime:
                dT = {
                    id: "DT-DateTime",
                    title: "Date/Time",
                    description: [{ text: "Date or timestamp in ISO-8601 format." }]
                };
                break;
            case XsDataType.Duration:
                dT = {
                    id: "DT-Duration",
                    title: "Duration",
                    description: [{ text: "A duration as defined by the ISO 8601 ABNF for 'duration'." }]
                };
                break;
            case XsDataType.AnyURI:
                dT = {
                    id: "DT-AnyURI",
                    title: "Universal Resource Identifier (URI)",
                    description: [{ text: "A universal resource identifier (URI), according to RFC3986." }]
                };
        }
        ;
        dT.type = ty;
        if (enumL.length > 0) {
            dT.id = dtId;
            dT.title = prep.title;
            dT.enumeration = enumL;
        }
        ;
        dT.revision = this.valueByTitle(r, "SpecIF:Revision") || r.revision;
        dT.changedAt = r.changedAt;
        LIB.cacheE(this.generated.dTL, dT);
        return dT;
    }
    makePC(r) {
        let dT = this.makeDT(r), defaultVL = LIB.valuesByTitle(r, this.termDefaultValues, this.data);
        return Object.assign(this.makeItem(r, CONFIG.prefixPC), {
            dataType: this.options.referencesWithoutRevision ? LIB.makeKey(dT.id) : LIB.makeKey(dT),
            format: this.valueByTitle(r, "SpecIF:TextFormat"),
            multiple: LIB.isTrue(this.valueByTitle(r, "SpecIF:multiple")) ? true : undefined,
            values: (defaultVL.length > 0 && (dT.type != XsDataType.Boolean || defaultVL[0] == "true") ? defaultVL : undefined)
        });
    }
    makeRC(r) {
        let iL = LIB.valuesByTitle(r, ["SpecIF:Instantiation"], this.data), eC = this.extendingClassOf(r, CONFIG.prefixRC), eCk, pCL = this.propertyClassesOf(r);
        if (eC) {
            eCk = LIB.makeKey(eC.id);
            if (Array.isArray(eC.propertyClasses) && eC.propertyClasses.length > 0 && pCL.length > 0) {
                eC = LIB.getExtendedClasses(this.generated.rCL, [eCk])[0];
                pCL = pCL.filter((p) => {
                    return LIB.referenceIndex(eC.propertyClasses, p) < 0;
                });
            }
            ;
        }
        ;
        return Object.assign(this.makeItem(r, CONFIG.prefixRC), {
            extends: eCk,
            instantiation: iL.map((ins) => { return LIB.displayValueOf(ins, { targetLanguage: 'default' }); }),
            isHeading: LIB.isTrue(this.valueByTitle(r, "SpecIF:isHeading")) ? true : undefined,
            icon: this.valueByTitle(r, "SpecIF:Icon"),
            propertyClasses: pCL.length > 0 ? pCL : undefined
        });
    }
    makeSC(r) {
        let iL = LIB.valuesByTitle(r, ["SpecIF:Instantiation"], this.data), eC = this.extendingClassOf(r, CONFIG.prefixSC), eCk, pCL = this.propertyClassesOf(r), sCL = this.eligibleClassesOf(r, ["SpecIF:isEligibleAsSubject"]), oCL = this.eligibleClassesOf(r, ["SpecIF:isEligibleAsObject"]);
        if (eC) {
            eCk = LIB.makeKey(eC.id);
            if (Array.isArray(eC.propertyClasses) && eC.propertyClasses.length > 0 && pCL.length > 0) {
                eC = LIB.getExtendedClasses(this.generated.sCL, [eCk])[0];
                pCL = pCL.filter((p) => {
                    return LIB.referenceIndex(eC.propertyClasses, p) < 0;
                });
            }
            ;
        }
        ;
        return Object.assign(this.makeItem(r, CONFIG.prefixSC), {
            extends: eCk,
            instantiation: iL.map((ins) => { return LIB.displayValueOf(ins, { targetLanguage: 'default' }); }),
            isUndirected: LIB.isTrue(this.valueByTitle(r, "SpecIF:isUndirected")) ? true : undefined,
            icon: this.valueByTitle(r, "SpecIF:Icon"),
            subjectClasses: sCL.length > 0 ? sCL : undefined,
            objectClasses: oCL.length > 0 ? oCL : undefined,
            propertyClasses: pCL.length > 0 ? pCL : undefined
        });
    }
    extendingClassOf(el, pfx) {
        if ([CONFIG.prefixRC, CONFIG.prefixSC].includes(pfx)) {
            let sL = this.statementsByTitle(el, (pfx == CONFIG.prefixRC ? ["SpecIF:isSpecializationOfResource"] : ["SpecIF:isSpecializationOfStatement"]), { asSubject: true });
            if (sL.length > 1) {
                console.warn('Term ' + el.id + ' has more than one extended class; the first found prevails.');
                sL.length = 1;
            }
            ;
            if (sL.length > 0) {
                let term = LIB.itemByKey(this.data.resources, sL[0].object), eC;
                switch (pfx) {
                    case CONFIG.prefixRC:
                        eC = this.makeRC(term);
                        LIB.cacheE(this.generated.rCL, eC);
                        break;
                    case CONFIG.prefixSC:
                        eC = this.makeSC(term);
                        LIB.cacheE(this.generated.sCL, eC);
                }
                ;
                return eC;
            }
            ;
        }
        ;
    }
    propertyClassesOf(el) {
        let pCL = [];
        let pL = this.statementsByTitle(el, ["SpecIF:hasProperty"], { asSubject: true });
        for (let p of pL) {
            let term = LIB.itemByKey(this.data.resources, p.object), prep = this.makeIdAndTitle(term, CONFIG.prefixPC);
            LIB.cacheE(pCL, { id: prep.id });
            LIB.cacheE(this.generated.pCL, this.makePC(term));
        }
        ;
        return pCL;
    }
    eligibleClassesOf(el, clL) {
        let iCL = [], sL = this.statementsByTitle(el, clL, { asObject: true });
        for (let s of sL) {
            let term = LIB.itemByKey(this.data.resources, s.subject), prep = this.makeIdAndTitle(term, term['class'].id == "RC-SpecifTermresourceclass" ? CONFIG.prefixRC : CONFIG.prefixSC);
            LIB.cacheE(iCL, { id: prep.id });
            if (!this.options.excludeEligibleSubjectClassesAndObjectClasses) {
                if (term['class'].id == "RC-SpecifTermresourceclass") {
                    if (LIB.indexById(this.generated.rCL, prep.id) < 0)
                        LIB.cacheE(this.generated.rCL, this.makeRC(term));
                }
                else {
                    if (LIB.indexById(this.generated.sCL, prep.id) < 0)
                        LIB.cacheE(this.required.sTL, term);
                }
            }
        }
        ;
        return iCL;
    }
    makeItem(r, prefix) {
        let prep = this.makeIdAndTitle(r, prefix), dscL = LIB.valuesByTitle(r, [CONFIG.propClassDesc], this.data), dsc;
        if (dscL.length > 1)
            console.info("Only the fist value of the description property will be used for the class generated from "
                + r.id + " with title " + prep.title + ".");
        if (dscL.length > 0) {
            dsc = dscL[0];
            dsc.format = LIB.isHTML(dsc.text) ? SpecifTextFormat.Xhtml : SpecifTextFormat.Plain;
        }
        ;
        return {
            id: prep.id,
            revision: this.valueByTitle(r, "SpecIF:Revision") || r.revision,
            title: prep.title,
            description: dsc,
            changedAt: r.changedAt
        };
    }
    checkConstraintsOntology() {
        return true;
    }
    statementsByTitle(r, tiL, opts) {
        return this.data.statements.filter((st) => {
            return tiL.includes(LIB.classTitleOf(st['class'], this.data.statementClasses))
                && (opts.asSubject && st.subject.id == r.id
                    || opts.asObject && st.object.id == r.id);
        });
    }
    valueByTitle(el, ti) {
        return LIB.valueByTitle(el, ti, this.data);
    }
    distinctiveCoreOf(ti) {
        return ti.toCamelCase();
    }
    makeIdAndTitle(r, pfx) {
        const termId = "PC-SpecifTerm";
        let visIdL = LIB.valuesByTitle(r, ["dcterms:identifier"], this.data), prp = LIB.itemBy(r.properties, 'class', { id: termId });
        if (prp && prp.values.length > 0) {
            let ti = LIB.languageTextOf(prp.values[0], { targetLanguage: 'default' });
            return {
                id: visIdL && visIdL.length > 0 ?
                    LIB.languageTextOf(visIdL[0], { targetLanguage: 'default' }).toSpecifId()
                    : (pfx + this.distinctiveCoreOf(ti)),
                title: ti
            };
        }
        ;
        console.error("No item with id '" + termId + "' found in the Ontology or it has no value");
    }
    getModelElementClasses() {
        let tR = this.getTermResource('resourceClass', "SpecIF:ModelElement"), sL = [];
        if (tR) {
            sL = this.statementsByTitle(tR, ["SpecIF:isSpecializationOfResource"], { asObject: true })
                .map((s) => {
                let r = LIB.itemByKey(this.data.resources, s.subject);
                return this.valueByTitle(r, CONFIG.propClassTerm);
            });
        }
        ;
        return ["SpecIF:ModelElement"].concat(sL);
    }
    getHeadings() {
        return this.data.resources
            .filter((r) => {
            return (LIB.classTitleOf(r['class'], this.data.resourceClasses) == "SpecIF:TermResourceClass")
                && LIB.isTrue(this.valueByTitle(r, "SpecIF:isHeading"));
        })
            .map((r) => {
            return this.valueByTitle(r, CONFIG.propClassTerm);
        });
    }
    getNamespaces() {
        let m = new Map();
        this.data.resources
            .filter((r) => {
            return LIB.classTitleOf(r['class'], this.data.resourceClasses) == "SpecIF:Namespace";
        })
            .forEach((r) => {
            m.set(this.valueByTitle(r, CONFIG.propClassTerm), { id: r.id, url: this.valueByTitle(r, "SpecIF:Origin") });
        });
        return m;
    }
    makeStatementsIsNamespace() {
        let item = LIB.itemBy(this.data.statementClasses, "title", "SpecIF:isNamespace");
        if (item) {
            for (var i = this.data.statements.length - 1; i > -1; i--) {
                if (LIB.classTitleOf(this.data.statements[i]['class'], this.data.statementClasses) == "SpecIF:isNamespace")
                    this.data.statements.splice(i, 1);
            }
            ;
            let now = new Date().toISOString();
            for (var r of this.data.resources) {
                if (this.termClasses.includes(LIB.classTitleOf(r['class'], this.data.resourceClasses))) {
                    let term = this.valueByTitle(r, CONFIG.propClassTerm), match = RE.splitVocabularyTerm.exec(term);
                    if (Array.isArray(match) && match[1]) {
                        let stC = LIB.makeKey(item), noNs = true;
                        for (let [key, val] of this.namespaces) {
                            if (match[1] == key) {
                                this.data.statements.push({
                                    id: LIB.genID(CONFIG.prefixS),
                                    changedAt: now,
                                    class: stC,
                                    subject: LIB.makeKey(val.id),
                                    object: LIB.makeKey(r)
                                });
                                noNs = false;
                                break;
                            }
                        }
                        ;
                        if (noNs)
                            console.warn("No namespace found for " + r.id);
                    }
                    else
                        console.warn("No namespace given for " + r.id);
                }
            }
        }
        else
            console.warn("No statementClass 'SpecIF:isNamespace' defined");
    }
}
