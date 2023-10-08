/*!    SpecIF: Generate Specif classes from the Ontology.
    Dependencies: -
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    Author: se@enso-managers.de, Berlin
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/


class COntology {
    data: SpecIF;
    allDomains: string[] = [];
    allNamespaces: string[] = [];
    termClasses: string[] = [
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

    // Assign the primitive dataType to the propertyClass types of a SpecIF Ontology:
    primitiveDataTypes = new Map([
        ["RC-SpecifTermpropertyclassstring", SpecifDataTypeEnum.String],
        ["RC-SpecifTermpropertyclassboolean", SpecifDataTypeEnum.Boolean],
        ["RC-SpecifTermpropertyclassinteger", SpecifDataTypeEnum.Integer],
        ["RC-SpecifTermpropertyclassreal", SpecifDataTypeEnum.Double],
        ["RC-SpecifTermpropertyclasstimestamp", SpecifDataTypeEnum.DateTime],
        ["RC-SpecifTermpropertyclassduration", SpecifDataTypeEnum.Duration],
        ["RC-SpecifTermpropertyclassuri", SpecifDataTypeEnum.AnyUri]
    ]);

    private options: any;   // a temporary storage of options during method execution (reentrancy is not required at this point in time)
    private required: any;  // when generating classes, a temporary list to remember referenced terms for subsequent generation
    private generated: any;

    constructor(dta: SpecIF) {
        // 'dta' is a SpecIF data set with classes and instances defining an Ontology.
        // The hierarchy root has a property of "dcterms:type" with value "W3C:Ontology".

        // Store as is:
        this.data = dta;

        // Keep only the hierarchies having a property of "dcterms:type" with value "W3C:Ontology";
        // there is a side-effect on the data handed-in, but in case of the SpecIF Viewer/Editor, this isn't harmful.
        dta.hierarchies = dta.hierarchies.filter(
            (h: SpecifNode) => {
                let r = LIB.itemByKey(dta.resources, h.resource);
                return this.valueByTitle(r, "dcterms:type") == "W3C:Ontology"
            }
        );
        if (dta.hierarchies.length < 1) {
            message.show("No ontology found.", { severity: 'warning' });
            return
        };

        if (!this.checkConstraintsOntology()) {
            message.show("The Ontology violates one or more constraints, so no classes will be generated. Please see the browser log for details.", { severity: 'error' });
            return
        };

        // Make a list of all defined domains in the SpecIF Ontology:
        let dTDomains = LIB.itemById(this.data.dataTypes, "DT-Domain");
        this.allDomains = dTDomains.enumeration.map(
            (v: SpecifEnumeratedValue) => LIB.languageTextOf(v.value, { targetLanguage: "default" })
        );

        // Make a list of all namespaces:
        this.allNamespaces = this.data.resources.filter(
            (r) => {
                return LIB.classTitleOf(r['class'], this.data.resourceClasses) == "SpecIF:Namespace"
            }
        ).map(
            (r) => {
                return this.valueByTitle(r, CONFIG.propClassTerm)
            }
        );

        this.makeStatementsIsNamespace();
        this.options = {};
    }

    getTermResources(ctg: string, term: string): SpecifResource[] {
        // Get the resources defining a given term; usually there is just one.
        ctg = ctg.toLowerCase();
        return this.data.resources
            .filter(
                (r) => {
                    // find the property with title CONFIG.propClassTerm:
                    let valL = LIB.valuesByTitle(r, [CONFIG.propClassTerm], this.data);
                    // return the resource representing the specified term;
                    // the term does not have different languages:
                    return (
                        valL.length > 0
                        // restrict the result list to resources defining the specified term (usually one):
                        && LIB.languageTextOf(valL[0], { targetLanguage: "default" }) == term
                        // restrict the result list to the specified category of terms:
                        && (ctg == 'all' || LIB.classTitleOf(r['class'], this.data.resourceClasses).toLowerCase().includes(ctg))
                    )
                }
            )
    }
    getTerms(ctg: string): string[] {
        // Get the list of terms for a category such as 'statementClass'.
        let ctgL = ['resourceClass', 'statementClass', 'propertyClass', 'propertyValue'];
        if (ctgL.includes(ctg)) {
            ctg = ctg.toLowerCase();
            return this.data.resources
                .filter(
                    (r) => {
                        // the desired category only;
                        // in case of 'propertyClass', any specialization will match:
                        return LIB.classTitleOf(r['class'], this.data.resourceClasses).toLowerCase().includes(ctg)
                    }
                )
                .map(
                    (r) => {
                        // extract the term from the resource defining it:
                        return this.valueByTitle(r, CONFIG.propClassTerm);
                    }
                )
        };
        throw Error("Programming Error: Category must be one of "+ctgL.toString());
    }
    localize(term: string, opts: any): string {
        // Translate an ontology term to the selected local language:

        if (RE.vocabularyTerm.test(term)) {
            let rL = this.getTermResources('all', term);
            if (rL.length > 0) {
                // return the name in the local language specifed:
                let lnL = [];
                if (opts.plural) {
                    // look for plural from property:
                    lnL = LIB.valuesByTitle(rL[0], ["SpecIF:LocalTermPlural"], this.data);
                    if (lnL.length < 1) {
                        // if not found, look for plural from a term related with 'isPluralOf':
                        let stL = this.statementsByClass(rL[0], "SpecIF:isPluralOf", { asSubject: false, asObject: true });
                        if (stL.length > 0) {
                            let tR = LIB.itemByKey(this.data.resources, stL[0].subject);
                            lnL = LIB.valuesByTitle(tR, ["SpecIF:LocalTerm"], this.data);
                        }
                    }
                }
                else {
                    lnL = LIB.valuesByTitle(rL[0], ["SpecIF:LocalTerm"], this.data);
                };

                if (lnL.length > 0) {
                    let newT = LIB.languageTextOf(lnL[0], opts);
                    //    console.info('Local term assigned: ' + term + ' → ' + newT);
                    return newT;
                }
            }
        };
        //		console.debug('#0', opts, term);
        // else, return the input value:
        return term;
    }
    globalize(name: string): string {
        // Translate a local name to the ontology term;
        // if several are found, select the one with the most confirmed lifecycle status.

        // no need to look for a vocabulary term, if it *is* one:
        if (RE.vocabularyTerm.test(name))
            return name;

        // Find all ontology terms which list the:
        let rC: SpecifResourceClass[];
        let termL = this.data.resources.filter(
            (r) => {
                // is it a term?
                rC = LIB.itemByKey(this.data.resourceClasses, r['class']);
                if (this.termClasses.includes(LIB.titleOf(rC))) {
                    // look for local terms:
                    let tVL = LIB.valuesByTitle(r, ["SpecIF:LocalTerm", "SpecIF:LocalTermPlural"], this.data);
                    for (let v of tVL) {
                        // check all values:
                        for (var l of v) {
                            // check all languages:
                            if (l.text.toLowerCase() == name.toLowerCase()) return true
                        }
                    }
                };
                return false
            }
        );
        //        console.debug('globalize',termL);
        if (termL.length > 0) {
            // search for the most confirmed term:
            for (let status of ["SpecIF:LifecycleStatusReleased", "SpecIF:LifecycleStatusEquivalent", "SpecIF:LifecycleStatusSubmitted", "SpecIF:LifecycleStatusExperimental"])
                for (let t of termL) {
                    if (this.valueByTitle(t, "SpecIF:LifecycleStatus") == status) {
                        let newT = this.valueByTitle(t, CONFIG.propClassTerm);
                        console.info('Global term assigned: ' + name + ' → ' + newT);
                        return newT;
                    }
                }
        };
        // no global term with sufficient lifecycle status found:
        return name;
    }
    getPreferredTerm(ctg: string, term: string): string {
        // Among synonyms, get the preferred (released) term:

        // Shortcut for preferred vocabulary terms (dcterms are always preferred, if they exist):
        if (term.startsWith('dcterms:'))
            return term;

        let rL = this.getTermResources(ctg, term);
        if (rL.length > 0) {
            let r = rL[0];

            // If the term is itself released/preferred, just return it:
            if (this.valueByTitle(r, "SpecIF:LifecycleStatus") == "SpecIF:LifecycleStatusReleased")
                return term;

            // Collect all synonyms (relation can be in any direction):
            let
                stL = this.statementsByClass(r, "SpecIF:isSynonymOf", { asSubject: true, asObject: true }),
                // the resources related by those statements are synonym terms:
                rsL = stL.map(
                    (st: SpecifStatement) => {
                        return LIB.itemById(this.data.resources, (st.object.id == r.id ? st.subject.id : st.object.id))
                    }
                ),
                // Find the released (preferred) term:
                synL = rsL.filter(
                    (r: SpecifResource) => {
                        return this.valueByTitle(r, "SpecIF:LifecycleStatus") == "SpecIF:LifecycleStatusReleased";
                    }
                );
            //            console.debug('getPreferredTerm', r, stL, rsL, synL);
            if (synL.length < 1)
                return term;

            if (synL.length > 1)
                console.warn('Multiple equivalent terms are released: ', synL.map((s) => { return s.id }).toString());

            let newT = this.valueByTitle(synL[0], CONFIG.propClassTerm);
            console.info('Preferred term assigned: ' + term + ' → ' + newT);
            return newT
        };
        // else, return the input value:
        return term;
    }
    normalize(ctg: string, term: string): string {
        // find languageTerm and replace with vocabulary term ("Anforderung" --> "IREB:Requirement"):
        let str = app.ontology.globalize(term);

        // find equivalent term and replace with preferred ("ReqIF.Name" --> "dcterms:title"):
        str = app.ontology.getPreferredTerm(ctg, str);

        return str;
    }
    getIcon(ctg: string, term: string): string {
        // Return an icon of a given term:

        let rL = this.getTermResources(ctg, term);
        if (rL.length > 0) {
            return this.valueByTitle(rL[0], "SpecIF:Icon") || ''
        };
        // else:
        return '';
    }
    changeNamespace(term: string, opts:any): string {
        // Given a term, try mapping it to the target namespace.

        if (!opts.targetNamespace || !this.allNamespaces.includes(opts.targetNamespace)) {
            console.warn("No namespace specified or ontology does not include the specified namespace: "+term);
            return term
        };

        let rL = this.getTermResources('all',term);
        if (rL.length > 0) {
            let r = rL[0];

            // Look for a synonym relation pointing to a term with the specified target namespace:

            // If the term itself belongs to the desired namespace, just return it:
            if (term.startsWith(opts.targetNamespace))
                return term;

            // Collect all synonyms (relation can be in any direction):
            let
                stL = this.statementsByClass(r, "SpecIF:isSynonymOf", { asSubject: true, asObject: true }),
                // the resources related by those statements are synonym terms:
                rsL = stL.map(
                    (st: SpecifStatement) => {
                        return LIB.itemById(this.data.resources, (st.object.id == r.id ? st.subject.id : st.object.id))
                    }
                ),
                // Find the term with the desired namespace, either released or equivalent:
                synL = rsL.filter(
                    (r: SpecifResource) => {
                        return this.valueByTitle(r, CONFIG.propClassTerm).startsWith(opts.targetNamespace)
                            && ["SpecIF:LifecycleStatusReleased", "SpecIF:LifecycleStatusEquivalent"].includes(this.valueByTitle(r, "SpecIF:LifecycleStatus"))
                    }
                );
            //            console.debug('changeNamespace', r, stL, rsL, synL);
            if (synL.length < 1)
                return term;

            if (synL.length > 1)
                console.warn('Multiple equivalent terms have the desired namespace: ', synL.map((s) => { return s.id }).toString());

            let newT = this.valueByTitle(synL[0], CONFIG.propClassTerm);
            console.info('Term with desired namespace assigned: ' + term + ' → ' + newT);
            return newT
        };
        // else, return the input value:
        return term;
    }
/*    getOntologyClasses(opts?: any): SpecIF | undefined {
            // Return a SpecIF data set with all classes of the ontology
    
            if (!this.data) {
                message.show("No valid ontology loaded.", { severity: 'error' });
                return
            };
    
            // @ts-ignore - the required properties are only missing, if specifically asked for via 'delta' option
            return Object.assign(
                opts.delta ? {} : this.makeTemplate(),
                {
                    "id": "P-SpecifClasses-Ontology",
                    "title": [
                        {
                            "text": "SpecIF Classes of the Ontology",
                            "format": SpecifTextFormat.Plain,
                            "language": "en"
                        }
                    ],
                    "description": [
                        {
                            "text": "A set of SpecIF Classes used for a SpecIF Ontology.",
                            "format": SpecifTextFormat.Plain,
                            "language": "en"
                        }
                    ],
                    "dataTypes": this.data.dataTypes,
                    "propertyClasses": this.data.propertyClasses,
                    "resourceClasses": this.data.resourceClasses,
                    "statementClasses": this.data.statementClasses
                }
            )
        }  */
    generateSpecifClasses(opts?: any): SpecIF | undefined {
        /*  Generate SpecIF classes for ontology terms (represented as SpecIF resources of the ontology) which
            - are selected by domain and lifecyclestatus (so far only those with lifecycleState=="preferred")
            - or are referenced by others selected by domain and lifecyclestatus
        
            - 'opts' contains the selected domains, for which classes shall be generated, e.g. {"Base":"true", "Requirement_Engineering":"true"}
        */

        this.options = opts;

        let spId = "P-SpecifClasses",  // id of the SpecIF data set with the generated classes, will be complemented with the selected domains

            // The selected domains for generating classes:
            selDomains = this.allDomains.filter((d: string) => { return this.options[d.toJsId()] });

        if (selDomains.length < 1) {
            message.show("No domain selected, so no classes will be generated.", { severity: 'warning' });
            return
        };

        // add the domains to the id of the generated data set:
        selDomains.forEach((d: string) => { spId += '-' + d.toCamelCase() });
        //    console.debug('#', dTDomains, allDomains, selDomains, spId);

        // List of referenced but missing instances of termStatementClass:
        this.required = {
            sTL: [] as SpecifResource[]  // list of terms waiting for generation of statementClasses
        };
        // Intermediate storage of the generated classes:
        this.generated = {
            dTL: [] as SpecifDataType[],  // is filled by the function creating the propertyClasses, as there are no explicit dataTypes in a SpecIF Ontology.
            pCL: [] as SpecifPropertyClass[],
            rCL: [] as SpecifResourceClass[],
            sCL: [] as SpecifStatementClass[]
        };

        // Generate in 3 steps;
        // note that referenced propertyClasses and resourceClasses are generated as soon as they are identified:
        [
            { resultL: this.generated.pCL, classes: Array.from(this.primitiveDataTypes.keys()), fn: this.createPC.bind(this) },
            { resultL: this.generated.rCL, classes: ["RC-SpecifTermresourceclass"], fn: this.createRC.bind(this) },
            { resultL: this.generated.sCL, classes: ["RC-SpecifTermstatementclass"], fn: this.createSC.bind(this) }
        ].forEach(
            (step) => { LIB.cacheL(step.resultL, this.makeClasses(step.classes, step.fn)); }
        );

        // Referenced statementClasses are generated at the end to avoid endless recursion:
        while (this.required.sTL.length > 0) {
            let sCL = [].concat(this.required.sTL);
            this.required.sTL.length = 0;
            LIB.cacheL(this.generated.sCL, sCL.map(this.createSC.bind(this)));
            //        console.debug('required sCL', simpleClone(this.generated.sCL), simpleClone(this.required.sTL));
        };

        // Finally return the result:
        // @ts-ignore - the required properties are only missing, if specifically asked for via 'delta' option
        return Object.assign(
            opts.delta ? {} : this.makeTemplate(),
            {
                "id": spId,
                "title": [
                    {
                        "text": "SpecIF Classes for " + selDomains.toString(),
                        "format": SpecifTextFormat.Plain,
                        "language": "en"
                    }
                ],
                "description": [
                    {
                        "text": "A set of SpecIF Classes derived from a SpecIF Ontology for the domain" + (selDomains.length < 2 ? " " : "s ") + selDomains.toString() + ".",
                        "format": SpecifTextFormat.Plain,
                        "language": "en"
                    }
                ],
                "dataTypes": this.generated.dTL,
                "propertyClasses": this.generated.pCL,
                "resourceClasses": this.generated.rCL,
                "statementClasses": this.generated.sCL
            }
        )
    }
    makeTemplate(/* opts?: any*/): SpecIF {
        /* Return an empty SpecIF data set */
        return {
            // @ts-ignore
            '@Context': "http://purl.org/dc/terms/",  // first step to introduce JSON-LD
            //	'@Context': this.context,
            "id": "",
            "$schema": "https://specif.de/v1.1/schema.json",
            "title": [],
            "description": [],
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
        }
    }

    // ---------------- Invoked methods ---------------------

    private makeClasses(rCIdL: string[], createFn: Function) {
        // Take the resources listed in the hierarchy, filter the selected ones and generate a class for each.
        // ToDo: Better a method to CGenerated.

        let self = this;

        let rCL: SpecifItem[] = [],  // the result list
            // 1. Find the terms of the classes listed in rCIdL:
            idL = LIB.referencedResourcesByClass(this.data.resources, this.data.hierarchies, rCIdL) as SpecifResource[];

        if (idL.length > 0) {
            let tL = idL
                // 2. Keep only those with selected domain and lifecycleStatus:
                .filter(isSelected);
            // 3. Create a class per term:
            rCL = LIB.forAll(tL, createFn);
        };
        return rCL as SpecifItem[];

        function isSelected(r: SpecifResource): boolean {
            let localOpts = Object.assign({ SpecIF_LifecycleStatusReleased: true }, self.options);
            // True, if specified per domain and lifecycleStatus ..
            // or if it is referenced by another class:
            return hasSelectedStatus(r)
                && hasSelectedDomain(r);

            function hasSelectedDomain(el: SpecifItem): boolean {
                let myDomains = LIB.valuesByTitle(el, [CONFIG.propClassDomain], self.data);
                for (let d of myDomains) {
                    if (self.options[LIB.displayValueOf(d, { targetLanguage: 'default' }).toJsId()])
                        return true;
                };
                return false;
            }
            function hasSelectedStatus(el: SpecifItem): boolean {
                let selStatus = LIB.valuesByTitle(el, [CONFIG.propClassLifecycleStatus], self.data);
                for (let s of selStatus) {
                    if (localOpts[LIB.displayValueOf(s, { targetLanguage: 'default' }).toJsId()])
                        return true;
                };
                return false;
            }
        }
    }
    private createDT(r: SpecifResource) {
        // Create a dataType for the TermPropertyClass r:
        let self = this;

        let ty = this.primitiveDataTypes.get(r["class"].id) as SpecifDataTypeEnum, // get the primitive dataType implied by the term's class
            // make sure that in case of a dataType with enumerated values, the ids correspond to the ids of the dataTypes:
            prep = this.makeIdAndTitle(r, "PC-"),  // only used for dataTypes with enumerated values
            dtId = prep.id.replace(/^PC-/, "DT-"), // also
            vId = prep.id.replace(/^PC-/, "V-"),   // also
            // Find any assigned enumerated values; these are defined by related propertyValues:
            stL = this.statementsByClass(r, "SpecIF:hasEnumValue", { asSubject: true }),  // all statements pointing to enumerated values
            oL = stL.map(
                (st: SpecifStatement) => {
                    return LIB.itemById(this.data.resources, st.object.id)
                }
            ),  // the objects of those statements are the enumerated values

            // Create the entries of the list 'enumeration':
            enumL = oL.map(
                (o: SpecifResource, idx: number) => {
                    let evL = LIB.valuesByTitle(o, [CONFIG.propClassTerm], this.data);
                    if( evL.length>0 )
                        return {
                            id: vId + '-' + idx.toString(),
                            value: evL[0]
                        }
                    else
                        console.warn("Property value term '" + o.id + "' is undefined")
                    // return undefined
                }
            ),
            dT = {} as SpecifDataType;
        //        console.debug('createDT', r, stL, oL, enumL);

        // Look for any parameters per primitive data type:
        switch (ty) {
            case SpecifDataTypeEnum.String:
                let maxLen = this.valueByTitle(r, "SpecIF:StringMaxLength");
                // @ts-ignore - missing attributes come further down
                dT = {
                    id: "DT-String" + (maxLen ? "-LE" + maxLen : ""),
                    title: "String" + (maxLen ? " <=" + maxLen : ""),
                    description: [{ text: "Text string" + (enumL.length > 0 ? " with enumerated values for " + prep.title : (maxLen ? " with maximum length " + maxLen : "")) }],
                    maxLength: maxLen ? parseInt(maxLen) : undefined
                };
                break;
            case SpecifDataTypeEnum.Boolean:
                // @ts-ignore - missing attributes come further down
                dT = {
                    id: "DT-Boolean",
                    title: "Boolean Value",
                    description: [{ text: "A Boolean value." }]
                };
                break;
            case SpecifDataTypeEnum.Integer:
                let maxI = this.valueByTitle(r, "SpecIF:IntegerMaxInclusive"),
                    minI = this.valueByTitle(r, "SpecIF:IntegerMinInclusive");
                // @ts-ignore - missing attributes come further down
                dT = {
                    id: "DT-Integer" + (minI ? "-GE" + minI : "") + (maxI ? "-LE" + maxI : ""),
                    title: "Integer Value" + (minI ? " >=" + minI : "") + (maxI ? " <=" + maxI : ""),
                    description: [{ text: "A numerical integer value" + (minI && maxI ? " with minimum value " + minI + " and maximum value " + maxI : (minI ? " with minimum value " + minI : (maxI ? " with maximum value " + maxI : ""))) + "." }],
                    minInclusive: minI ? parseInt(minI) : undefined,
                    maxInclusive: maxI ? parseInt(maxI) : undefined
                };
                break;
            case SpecifDataTypeEnum.Double:
                let frD  = this.valueByTitle(r, "SpecIF:RealFractionDigits"),
                    maxR = this.valueByTitle(r, "SpecIF:RealMaxInclusive"),
                    minR = this.valueByTitle(r, "SpecIF:RealMinInclusive");
                // @ts-ignore - missing attributes come further down
                dT = {
                    id: "DT-Real" + (minR ? "-GE" + minR : "") + (maxR ? "-LE" + maxR : "") + (frD ? "-FD" + frD : ""),
                    title: "Real Value" + (minR ? " >=" + minR : "") + (maxR ? " <=" + maxR : "") + (frD ? " " + frD + "digits" : ""),
                    description: [{ text: "A numerical floating point number (double precision)" + (minR && maxR ? " with minimum value " + minR + " and maximum value " + maxR : (minR ? " with minimum value " + minR : (maxR ? " with maximum value " + maxR : ""))) + (frD ? " having no more than " + frD + " digits" : "") + "." }],
                    minInclusive: minR ? parseFloat(minR) : undefined,
                    maxInclusive: maxR ? parseFloat(maxR) : undefined,
                    fractionDigits: frD ? parseInt(frD) : undefined
                };
                break;
            case SpecifDataTypeEnum.DateTime:
                // @ts-ignore - missing attributes come further down
                dT = {
                    id: "DT-DateTime",
                    title: "Date/Time",
                    description: [{ text: "Date or timestamp in ISO-8601 format." }]
                };
                break;
            case SpecifDataTypeEnum.Duration:
                // @ts-ignore - missing attributes come further down
                dT = {
                    id: "DT-Duration",
                    title: "Duration",
                    description: [{ text: "A duration as defined by the ISO 8601 ABNF for 'duration'." }]
                };
                break;
            case SpecifDataTypeEnum.AnyUri:
                // @ts-ignore - missing attributes come further down
                dT = {
                    id: "DT-AnyUri",
                    title: "Universal Resource Identifier (URI)",
                    description: [{ text: "A universal resource identifier (URI), according to RFC3986." }]
                };
        };
        dT.type = ty;
        if (enumL.length > 0) {
            // In case of a dataType with enumerated values the title of the propertyClass is borrowed for the id,
            // and the parameters added above can be omitted:
            dT.id = dtId;
            dT.title = prep.title;
            dT.enumeration = enumL
        };
        dT.revision = this.valueByTitle(r, "SpecIF:Revision") || r.revision;
        dT.changedAt = r.changedAt;

        if (this.options.adoptOntologyDataTypes) {
            // if selected by an option, replace the generated dataType by an equivalent one of the Ontology itself:
            dT = adoptOntologyDataType(dT) || dT
        };

        LIB.cacheE(this.generated.dTL, dT); // store avoiding duplicates
        return LIB.makeKey(dT);  // the key as reference for the generated propertyClass

        function adoptOntologyDataType(d: SpecifDataType) {
            for (let dT of self.data.dataTypes) {
                if (LIB.equalDT(d, dT)) return dT
            }
            // return undefined
        }
    }
    private createPC(r: SpecifResource) {
        // Create a propertyClass for the TermPropertyClass r:
        //        console.debug('createPC', r);

        // 1. Create the dataType, unless it exists already:
        let dTk = this.createDT(r),
            defaultVs = LIB.valuesByTitle(r, ["SpecIF:DefaultValue"], this.data);

        // Undefined attributes will not appear in the generated classes (omitted by JSON.stringify)
        return Object.assign(
            this.createItem(r, 'PC-'),
            {
                dataType: dTk,      // the reference to the dataType
                format: this.valueByTitle(r, "SpecIF:TextFormat"),  // one or none of 'plain' or 'xhtml'
                multiple: LIB.isTrue(this.valueByTitle(r, "SpecIF:multiple")) ? true : undefined,
                values: defaultVs.length > 0 ? defaultVs : undefined
            }
        ) as SpecifPropertyClass;
    }
    private propertyClassesOf(el: SpecifResource) {
        // Return a list of propertyClasses which are related by "SpecIF:hasProperty"
        // to el (the term describing the resourceClass resp. statementClass to be generated):

        let pCL: SpecifPropertyClass[] = [
            // All created resourceClasses shall have these two propertyClasses (by title),
            // regardless of any definition in the ontology:
            //   { id: "PC-title" },
            //   { id: "PC-description" }
        ];  // the result list

        let pL = this.statementsByClass(el, "SpecIF:hasProperty", { asSubject: true });
        for (let p of pL) {
            let term = LIB.itemByKey(this.data.resources, p.object),
                prep = this.makeIdAndTitle(term, "PC-"); // need the id only, here
            //            console.debug('propertyClassesOf', term, LIB.valuesByTitle(term, ["dcterms:identifier"], this.data));
            // an entry in the propertyClasses of the resourceClass resp statementClass to generate:
            LIB.cacheE(pCL, { id: prep.id });
            // Ascertain that all referenced propertyClasses will be available.
            // Thus, generate the referenced propertyClasses together with the dataTypes;
            // if they exist already due to correct selection, duplicates are avoided:
            LIB.cacheE(this.generated.pCL, this.createPC(term))
        };
        //        console.debug('propertyClassesOf', pL, pCL);

        return pCL
    }
    private createRC(r: SpecifResource) {
        let iL = LIB.valuesByTitle(r, ["SpecIF:Instantiation"], this.data);
        //        console.debug('insta', iL, iL.map((ins) => { return LIB.displayValueOf(ins, { targetLanguage: 'default' }) }));

        // Create a resourceClass for the TermResourceClass r;
        // undefined attributes will not appear in the generated classes (omitted by JSON.stringify)
        return Object.assign(
            this.createItem(r, CONFIG.prefixRC),
            {
                extends: this.extCOf(r, CONFIG.prefixRC),
                instantiation: iL.map((ins: SpecifValue) => { return LIB.displayValueOf(ins, { targetLanguage: 'default' }) }),
                isHeading: LIB.isTrue(this.valueByTitle(r, "SpecIF:isHeading")) ? true : undefined,
                icon: this.valueByTitle(r, "SpecIF:Icon"),
                // the references per propertyClass:
                propertyClasses: this.propertyClassesOf(r)
            }
        ) as SpecifResourceClass;
    }
    private statementClassesOf(el: SpecifResource, cl: string) {
        // Return a list of resourceClasses and/or statementClasses which are related 
        // to term el (the statementClass to be generated) by the given statementClass cl:

        let iCL: SpecifResourceClass[] = [],  // the result list
            // We are interested only in statements where *other* statementClasses are eligible as subjectClasses:
            sL = this.statementsByClass(el, cl, { asObject: true }); // list of statements of the specified class

        for (let s of sL) {
            let term = LIB.itemByKey(this.data.resources, s.subject),
                prep = this.makeIdAndTitle(term, term['class'].id == "RC-SpecifTermresourceclass" ? CONFIG.prefixRC : CONFIG.prefixSC); // need the id only, here
            //            console.debug('statementClassesOf', term, LIB.valuesByTitle(term, ["dcterms:identifier"], this.data));
            LIB.cacheE(iCL, { id: prep.id })

            if (this.options.includeEligibleSubjectClassesAndObjectClasses) {
                if (term['class'].id == "RC-SpecifTermresourceclass") {
                    if (LIB.indexById(this.generated.rCL, prep.id) < 0)
                        // Ascertain that all referenced resourceClasses will be available.
                        LIB.cacheE(this.generated.rCL, this.createRC(term))
                }
                else {
                    // the class is "RC-SpecifTermstatementclass":
                    if (LIB.indexById(this.generated.sCL, prep.id) < 0)
                        // Any missing statementClasses are collected in this.required.sTL until the end of the generation 
                        // ... to avoid infinite recursion, because statementClasses can reference statementClasses.
                        // Thus, generate only the referenced resourceClasses immediately;
                        // if they exist already due to correct selection, duplicates are avoided:
                        LIB.cacheE(this.required.sTL, term)
                }
            }
        };
        //        console.debug('statementClassesOf', el, sL, iCL, this.required.sTL);

        return iCL
    }
    private createSC(r: SpecifResource) {
        // Create a statementClass for the TermStatementClass r:

        let
            iL = LIB.valuesByTitle(r, ["SpecIF:Instantiation"], this.data),
            // In case of statementClasses a list of propertyClasses is optional and most often not used:
            pCL = this.propertyClassesOf(r),
            // The eligible subjectClasses:
            sCL = this.statementClassesOf(r, "SpecIF:isEligibleAsSubject"),
            // The eligible objectClasses:
            oCL = this.statementClassesOf(r, "SpecIF:isEligibleAsObject");
        //        console.debug('createSC', r, pCL, sCL, oCL);

        // Undefined attributes will not appear in the generated classes (omitted by JSON.stringify)
        return Object.assign(
            this.createItem(r, CONFIG.prefixSC),
            {
                extends: this.extCOf(r, CONFIG.prefixSC),
                instantiation: iL.map((ins: SpecifValue) => { return LIB.displayValueOf(ins, { targetLanguage: 'default' }) }),
                isUndirected: LIB.isTrue(this.valueByTitle(r, "SpecIF:isUndirected")) ? true : undefined,
                icon: this.valueByTitle(r, "SpecIF:Icon"),
                // the eligible subjectClasses and objectClasses:
                subjectClasses: sCL.length > 0 ? sCL : undefined,
                objectClasses: oCL.length > 0 ? oCL : undefined,
                // the references per propertyClass:
                propertyClasses: pCL.length > 0 ? pCL : undefined
            }
        ) as SpecifDataType;
    }
    private extCOf(el: SpecifResource, pfx: string) {
        // Return a resourceClass resp. statementClass which is related by "SpecIF:isSpecializationOf"
        // to el (the term describing the resourceClass resp. statementClass to be generated):
        if ([CONFIG.prefixRC, CONFIG.prefixSC].includes(pfx)) {

            let
                // We are interested only in statements where *other* resources resp. statements are the object:
                sL = this.statementsByClass(el, "UML:isSpecializationOf", { asSubject: true });

            if (sL.length > 1) {
                console.warn('Term ' + el.id + ' has more than one extended class; the first found prevails.');
                // see: https://stackoverflow.com/questions/31547315/is-it-an-antipattern-to-set-an-array-length-in-javascript
                sL.length = 1;
            };

            if (sL.length > 0) {
                let term = LIB.itemByKey(this.data.resources, sL[0].object),
                    prep = this.makeIdAndTitle(term, pfx); // need the id only, here

                // Ascertain that the referenced resourceClass resp. statementClass will be available;
                // if it exists already due to correct selection, there will be no duplicate:
                switch (pfx) {
                    case CONFIG.prefixRC:
                        LIB.cacheE(this.generated.rCL, this.createRC(term));
                        break;
                    case CONFIG.prefixSC:
                        LIB.cacheE(this.generated.sCL, this.createSC(term));
                };

                return LIB.makeKey(prep.id)
            }
            // return undefined
        }
        // return undefined
    }
    private createItem(r: SpecifResource, prefix: string) {
        // Create the attributes common to all classes except dataType;
        // - take the resource's title as title
        // - and the title without namespace as distinctive portion of the id.
        let prep = this.makeIdAndTitle(r, prefix),
            dscL = LIB.valuesByTitle(r, [CONFIG.propClassDesc], this.data);
        if (dscL.length > 1)
            console.info("Only the fist value of the description property will be used for the class generated from " + r.id + " with title " + prep.title + ".");

        // Undefined attributes will not appear in the generated classes (omitted by JSON.stringify)
        return {
            // Take the specified identifier if available or build one with the title ... :
            id: prep.id,
            revision: this.valueByTitle(r, "SpecIF:Revision") || r.revision,
            title: prep.title,
            // ToDo: Consider to complement the multilanguageText with format and language:
            description: (dscL.length > 0 ? dscL[0] : undefined), // only the first property value is taken for the class description
            changedAt: r.changedAt
        } as SpecifClass;
    }
    // @ts-ignore
    private checkConstraintsOntology(): boolean {
        /*  Check the following constraints / conventions:
            - Don't generate a class from a deprecated term --> No referenced term may be 'deprecated'
            - A term must have a property "PC-SpecifTerm" with the name of the term (the title contains the name in national languages)
            - A term name *must* have a name-space separated by ':' or '.', whereas a localTerm must *not*.
            - A term should have a relation 'SpecIF:isNamespace' with a namespace amd *must* not have more than one.
            - A TermResourceClass must have at least one propertyClass, either self or inherited from an extended class
            - A TermResourceClass or TermStatementClass may not have >1 statements with title "SpecIF:isSpecializationOf"
            - Chains of "isSpecializationOf" relations must not be cyclic.
            - Chains of "isEligibleAsSubject" relations must not be cyclic.
            - Chains of "isEligibleAsObject" relations must not be cyclic.
            - A term can be the plural of one or more other terms, but a term must not have more than one plural
            - A term having a plural attribute should not have a term related by 'isPluralOf' ... and vice versa.
            - A term which is the plural of another term must not have a plural itself.
            - ToDo: complete the list ...
        */

        return true
    }

    private statementsByClass(r: SpecifResource, ti: string, opts: any) {
        // Find the statements of the class with title ti referencing the given term r as subject or object:
        // - if opts.asSubject, then all statements where r is the subject are selected
        // - if opts.asObject, then all statements where r is the object are selected

        // First make it a little more robust against changes in the ontology:
        // ToDo: a more efficient solution is to do it once in the construction phase ...
        ti = this.normalize("statementClass", ti);

        return this.data.statements.filter(
            (st: SpecifStatement) => {
                // better use 'instanceTitleOf', but it is not available, here:
                return LIB.classTitleOf(st['class'], this.data.statementClasses) == ti
                    && (opts.asSubject && st.subject.id == r.id
                        || opts.asObject && st.object.id == r.id);
            }
        ) as SpecifStatement[]
    }
    valueByTitle(el: SpecifResource, ti: string): string {
        // Return the value of el's property with title ti:
        let pVL = LIB.valuesByTitle(el, [ti], this.data);
        return pVL.length > 0 ? LIB.displayValueOf(pVL[0], { targetLanguage: 'default' }) : undefined
    }
    private distinctiveCoreOf(ti: string): string {
        return ti.toCamelCase();
    }
    private makeIdAndTitle(r: SpecifResource, pfx: string) {
        // Make an id and a title for the class generated for term r
        const termId = "PC-SpecifTerm";
        let visIdL = LIB.valuesByTitle(r, ["dcterms:identifier"], this.data),
            // In general we don't, but in case of the ontology we know that the resource title
            // is given in a property with class id "PC-SpecifTerm" (which has a title "dcterms:title").
            // Therefore we can get the title in a simple way:
            prp = LIB.itemBy(r.properties, 'class', { id: termId });

        if (prp && prp.values.length > 0) {
            let ti = LIB.languageTextOf(prp.values[0], { targetLanguage: 'default' });
            return {
                // Use the identifier provided by the user or by default generate it using the title:
                id: visIdL && visIdL.length > 0 ?
                    LIB.languageTextOf(visIdL[0], { targetLanguage: 'default' }).toSpecifId()
                    : (pfx + this.distinctiveCoreOf(ti)),
                title: ti
            }
        };
        console.error("No item with id '" + termId+"' found in the Ontology or it has no value");
    }
    private makeStatementsIsNamespace(): void {
        // Relate one of the defined namespaces to each term using a statement 'isNamespace';
        // upon return the literal namespace given in the term and the relation to the namespace resource are consistent.

        let item = LIB.itemBy(this.data.statementClasses, "title", "SpecIF:isNamespace");
        if (item) {

            // 1. Delete all existing statements 'isNamespace':
            for (var i = this.data.statements.length - 1; i > -1; i--) {
                if (LIB.classTitleOf(this.data.statements[i]['class'], this.data.statementClasses) == "SpecIF:isNamespace")
                    this.data.statements.splice(i, 1)
            };

            // 2. Create all statements 'isNamespace':
            for (var r of this.data.resources) {
                if (this.termClasses.includes(LIB.classTitleOf(r['class'], this.data.resourceClasses))) {
                    let term = this.valueByTitle(r, CONFIG.propClassTerm),
                        match = RE.splitVocabularyTerm.exec(term);
                    if (Array.isArray(match) && match[1]) {
                        let stC = LIB.makeKey(item),
                            noNs = true;
                        // the term has a namespace:
                        for (let ns of this.allNamespaces) {
                            if (match[1] == ns) {
                                this.data.statements.push({
                                    id: LIB.genID('S-'),
                                    class: stC,
                                    subject: LIB.makeKey(ns),
                                    object: LIB.makeKey(r)
                                } as SpecifStatement);
                                noNs = false;
                                break
                            }
                        };
                        if (noNs)
                            console.warn("No namespace found for " + r.id)
                    }
                    else
                        console.warn("No namespace given for " + r.id)
                }
            }
        }
        else
            console.warn("No statementClass 'SpecIF:isNamespace' defined")
    }
}
