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
//  domains: string[] = [];

    // List with all namespaces and their origins:
    namespaces: any;

    // List of all heading types:
    // If a resourceClass has a title equal to one of the values in the following list,
    // it is considered a heading (chapter title) and will be included in the outline numbering.
    headings: string[] = [];

    // List with all model-element types by title,
    // is used for example to build a glossary;
    // it is expected that a plural of any list element exists:
    modelElementClasses: string[] = [];

    // List with all term classes by title:
    termPrincipalClasses = new Map([
        ["SpecIF:TermResourceClass", "R-FolderTermsResourceClass"],
        ["SpecIF:TermStatementClass", "R-FolderTermsStatementClass"],
        ["SpecIF:TermPropertyClass", "R-FolderTermsPropertyClass"],
        ["SpecIF:TermPropertyValue", "R-FolderTermsPropertyValue"]
    ]);

    // List with all term classes by title:
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

    // Assign the primitive dataType to the termPropertyClasses of a SpecIF Ontology:
    private primitiveDataTypes = new Map([
        ["RC-SpecifTermpropertyclassstring", XsDataType.String],
        ["RC-SpecifTermpropertyclassboolean", XsDataType.Boolean],
        ["RC-SpecifTermpropertyclassinteger", XsDataType.Integer],
        ["RC-SpecifTermpropertyclassreal", XsDataType.Double],
        ["RC-SpecifTermpropertyclasstimestamp", XsDataType.DateTime],
        ["RC-SpecifTermpropertyclassduration", XsDataType.Duration],
        ["RC-SpecifTermpropertyclassuri", XsDataType.AnyURI]
    ]);

    // List the terms for default values per data type:
    private termDefaultValues: string[] = [
        "SpecIF:DefaultValueString",
        "SpecIF:DefaultValueBoolean",
        "SpecIF:DefaultValueInteger",
        "SpecIF:DefaultValueReal",
        "SpecIF:DefaultValueTimestamp",
        "SpecIF:DefaultValueDuration",
        "SpecIF:DefaultValueAnyURI",
    ]

    // Assign titles of special relations for synonyms per class of terms:
    private termCategories = new Map([
        ["resourceClass", { synonymStatement: "SpecIF:isSynonymOfResource", prefix: CONFIG.prefixRC }],
        ["statementClass", { synonymStatement: "SpecIF:isSynonymOfStatement", prefix: CONFIG.prefixSC }],
        ["propertyClass", { synonymStatement: "SpecIF:isSynonymOfProperty", prefix: CONFIG.prefixPC }],
        ["propertyValue", { synonymStatement: "SpecIF:isSynonymOfValue", prefix: CONFIG.prefixV }]
    ]);

    // List with all values of lifecycleStatus eligible for use in SpecIF:
    private eligibleLifecycleStatus: string[] = [
        "SpecIF:LifecycleStatusReleased",
        "SpecIF:LifecycleStatusEquivalent",
        "SpecIF:LifecycleStatusSubmitted",
        "SpecIF:LifecycleStatusExperimental"
    ];

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
                return this.valueByTitle(r, CONFIG.propClassType) == "W3C:Ontology"
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

     /*   // Make a list of all defined domains in the SpecIF Ontology:
        // ToDo: Use LIB.enumeratedValuesOf
        let dTDomains = LIB.itemById(this.data.dataTypes, "DT-Domain");
        this.domains = dTDomains.enumeration.map(
            (v: SpecifEnumeratedValue) => LIB.languageTextOf(v.value, { targetLanguage: "default" })
        ); */

        this.namespaces = this.getNamespaces();
        this.headings = this.getHeadings();
        this.modelElementClasses = this.getModelElementClasses();

        // Create all statements 'isNamespace' from the resource title namespaces:
        this.makeStatementsIsNamespace();

        this.options = {};
    }

    private getTermResources(ctg: string, term: string): SpecifResource[] {
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
    getTermResource(ctg: string, term: string): SpecifResource | undefined {
        // Get the resource defining a given term:
        let resL = this.getTermResources(ctg, term);
        // Just one result is expected (a term should be unique):
        if (resL.length > 1)
            console.warn("Multiple resources describe term '" + term + "': " + resL.map((r: SpecifResource) => { return r.id }).toString());
        //    console.warn('Multiple definitions of the term found: ', resL.map((r) => { return r.id }).toString());
        if (resL.length > 0)
            return resL[0];
        // return /// undefined
    }
    getTerms(ctg: string): string[] {
        // Get the list of terms for a category such as 'statementClass'.
        //    let ctgL = ['resourceClass', 'statementClass', 'propertyClass', 'propertyValue'];
        let ctgL = Array.from(this.termCategories.keys());
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
    getClassId(ctg: string, term: string): string {
        // Return the identifier of the class derived from the term:
        if (RE.vocabularyTerm.test(term)) {
            let tR = this.getTermResource(ctg, term);
            if (tR) {
                // Find prefix depending on 
                return this.makeIdAndTitle(tR, this.termCategories.get(ctg).prefix).id;
            };
        };
        // return undefined
    }
    localize(term: string, opts: any): string {
        // Translate an ontology term to the selected local language:

        if (RE.vocabularyTerm.test(term)) {
            let tR = this.getTermResource('all', term);
            if (tR) {
                // return the name in the local language specifed:
                let lnL = [];
                if (opts.plural) {
                    // look for plural from property:
                    lnL = LIB.valuesByTitle(tR, ["SpecIF:LocalTermPlural"], this.data);
                    if (lnL.length < 1) {
                        // if not found, look for plural from a term related with 'isPluralOfResource':
                        let stL = this.statementsByTitle(tR, ["SpecIF:isPluralOfResource"], { asSubject: false, asObject: true });
                        if (stL.length > 0) {
                            let tR = LIB.itemByKey(this.data.resources, stL[0].subject);
                            lnL = LIB.valuesByTitle(tR, ["SpecIF:LocalTerm"], this.data);
                        }
                    }
                }
                else {
                    lnL = LIB.valuesByTitle(tR, ["SpecIF:LocalTerm"], this.data);
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
    globalize(ctg: string, name: string): string {
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
                if (this.termClasses.includes(LIB.titleOf(rC))
                    && (
                        LIB.titleOf(rC).toLowerCase().includes(ctg.toLowerCase())
                        || ['all','any'].includes(ctg)
                    )
                ) {
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
            // select the most confirmed term:
            for (let status of this.eligibleLifecycleStatus)
                for (let t of termL) {
                    if (this.valueByTitle(t, "SpecIF:TermStatus") == status) {
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
        // ToDo: Deliver not only the normalized term, but also its definition (description)

        // Shortcut for preferred vocabulary terms (dcterms are always preferred, if they exist):
        if (term.startsWith('dcterms:'))
            return term;

        let tR = this.getTermResource(ctg, term);
        if (tR) {
            // If the term is itself released/preferred, just return it:
            if (this.valueByTitle(tR, "SpecIF:TermStatus") == "SpecIF:LifecycleStatusReleased")
                return term;

            // Collect all synonyms (relation is bi-directional):
            let
                ctgV = this.termCategories.get(ctg),
                ctgL = ctgV ? [ctgV] : Array.from(this.termCategories.values()),
                staL = this.statementsByTitle(tR, ctgL.map(c => c.synonymStatement), { asSubject: true, asObject: true }),
                // the resources related by those statements are synonym terms:
                resL = staL.map(
                    (st: SpecifStatement) => {
                        return LIB.itemById(this.data.resources, (st.object.id == tR.id ? st.subject.id : st.object.id))
                    }
                ),
                // Find the released (preferred) term:
                synL = resL.filter(
                    (r: SpecifResource) => {
                        return this.valueByTitle(r, "SpecIF:TermStatus") == "SpecIF:LifecycleStatusReleased";
                    }
                );
            //            console.debug('getPreferredTerm', tR, staL, resL, synL);
            if (synL.length < 1)
                return term;

            if (synL.length > 1)
                console.warn('Multiple equivalent terms are released: ', synL.map((r:SpecifResource) => { return r.id }).toString());

            let newT = this.valueByTitle(synL[0], CONFIG.propClassTerm);
            console.info('Preferred term assigned: ' + term + ' → ' + newT);
            return newT;
        };
        // else, return the input value:
        return term;
    }
    normalize(ctg: string, term: string): string {
        // Find languageTerm and replace with vocabulary term ("Anforderung" --> "IREB:Requirement"):
        let str = this.globalize(ctg, term);

        // Find equivalent term and replace with preferred ("ReqIF.Name" --> "dcterms:title"):
        // ToDo: include antonyms: If there is an antonym with a 'better' lifecycle status than a synonym, take it.
        str = this.getPreferredTerm(ctg, str);

        return str;
    }
    getTermValue(ctg: string, term: string, title: string): string | undefined {
        // Return the property value of a given term:

        let tR = this.getTermResource(ctg, term);
        if (tR) {
            return this.valueByTitle(tR, title) // || ''
        };
        // else:
        // return '';
    }
    propertyClassIsText(term: string): boolean {
        // Return if the propertyClass defines a string with a certain length:
        let len = this.getTermValue("propertyClass", term, "SpecIF:StringMaxLength");
        return len == undefined || typeof(len) == 'number' && len > CONFIG.textThreshold;
    }
    propertyClassIsFormatted(term: string): boolean {
        // Return if the propertyClass defines a formatted string:
        // @ts-ignore - no problem to compare this ..
        return this.getTermValue("propertyClass", term, "SpecIF:TextFormat") == SpecifTextFormat.Xhtml;
    }
    getIcon(ctg: string, term: string): string | undefined {
        // Return an icon of a given term:
        return this.getTermValue(ctg, term, "SpecIF:Icon");
    }
    changeNamespace(term: string, opts:any): string {
        // Given a term, try mapping it to the target namespace.
        let self = this;

        if (!opts.targetNamespaces || opts.targetNamespaces.length<1 ) {
        //    console.warn("Cannot change namespace; no target namespace specified.");
            return term
        };

        // If the term belongs to any of the desired namespaces, just return it:
        for (var nsp of opts.targetNamespaces) {
            if (term.startsWith(nsp))
                return term;
        };

        let tR = this.getTermResource('all',term);

        if (tR) {
            // Look for a synonym relation pointing to a term with the specified target namespace;
            // go through all termCategories one-by-one to allow early return in case of a hit.
        //    console.warn("No namespace specified or ontology does not include the specified namespace: " + term);
            let
                v = findSynonymStatementOf(tR['class']),
                // Collect all synonyms (relation is bi-directional):
                staL = this.statementsByTitle(tR, [v], { asSubject: true, asObject: true }),
                // the resources related by those statements are synonym terms:
                resL = staL.map(
                    (st: SpecifStatement) => {
                        return LIB.itemById(this.data.resources, (st.object.id == tR.id ? st.subject.id : st.object.id))
                    }
                ),
                // Find the term with the desired namespace, either released or equivalent:
                synL = findSynonym(resL, opts.targetNamespaces);
            //            console.debug('changeNamespace', tR, staL, resL, synL);
            if (synL.length < 1)
                return term;

            if (synL.length > 1)
                console.warn('Multiple equivalent terms have the desired namespace: ', synL.map((r:SpecifResource) => { return r.id }).toString());

            let newT = this.valueByTitle(synL[0], CONFIG.propClassTerm);
            console.info('Term with desired namespace assigned: ' + term + ' → ' + newT);
            return newT
        };
        // else, return the input value:
        return term;

        function findSynonymStatementOf(rCk:SpecifKey) {
            let rC = LIB.itemByKey(self.data.resourceClasses,rCk);
            for (let [ctg, syn] of self.termCategories) {
                if (rC.title.toLowerCase().includes(ctg.toLowerCase()))
                    return syn
            };
            throw (new Error("No synonym statement found for '"+rCk.id+"'."));
        }
        function findSynonym(rL: SpecifResource[], nspL: string[]) {
            // In the sequence of namespaces in the list nspL,
            // try to find a synonym among the terms contained in rL:
            let sL = [];
            for( var nsp of nspL ) {
                sL = rL.filter(
                    (r: SpecifResource) => {
                        return self.valueByTitle(r, CONFIG.propClassTerm).startsWith(nsp)
                            && ["SpecIF:LifecycleStatusReleased", "SpecIF:LifecycleStatusEquivalent"].includes(self.valueByTitle(r, "SpecIF:TermStatus"))
                    }
                );
                if(sL.length>0) return sL
            };
            return [];
        }
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
    makeTemplate(/* opts?: any*/): SpecIF {
        /* Return an empty SpecIF data set */
        return {
            // @ts-ignore
            '@Context': "http://purl.org/dc/terms/",  // first step to introduce JSON-LD
        //	'@Context': this.context,
            "id": "",
            "$schema": "https://specif.de/v1.1/schema.json",
            "title": [],
        //    "description": [],
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
    generateSpecifClasses(opts?: any): SpecIF {
        /*  Generate SpecIF classes for ontology terms (represented as SpecIF resources of the ontology) which
            - selected by domain or by term
            - and are selected by lifecyclestatus (so far only those with lifecycleState=="preferred")
            - or are referenced by others selected by domain and lifecyclestatus
        
            - 'opts' contains the selected domains, for which classes shall be generated, e.g. {domains: ["SpecIF:DomainBase", "SpecIF:DomainSystemModelIntegration"]}
            - or a list of terms, such as {terms: ["xs:anyURI", CONFIG.propClassId]}
        */

        if ( Array.isArray(opts.domains) && opts.domains.length > 0
            || Array.isArray(opts.terms) && opts.terms.length > 0 ) {

            this.options = opts;

            let spId = "P-SpecifClasses",  // id of the SpecIF data set with the generated classes, will be complemented with the selected domains
                now = new Date().toISOString();

         /*   if (Array.isArray(opts.terms)) {
                // Check whether all listed terms are defined by the Ontology:

            }; */

            // add the domains to the id of the generated data set:
            if (Array.isArray(opts.domains)) {
                // Check whether all listed domains are defined by the Ontology:

                // Add domains to id:
                opts.domains.forEach((d: string) => { spId += '-' + d.toCamelCase() });
            };
            //    console.debug('#', dTDomains, domains, opts.domains, spId);

            // List of referenced but missing instances of termStatementClass:
            this.required = {
                sTL: [] as SpecifResource[]  // list of terms waiting for generation of statementClasses
            };
            // Intermediate storage of the generated classes:
            this.generated = {
                dTL: [] as SpecifDataType[],  // is filled by the function creating the propertyClasses, as there are no explicit dataTypes in a SpecIF Ontology.
                pCL: [] as SpecifPropertyClass[],
                rCL: [] as SpecifResourceClass[],
                sCL: [] as SpecifStatementClass[],
                rL: [] as SpecifResource[],
                hL: [] as SpecifNodes
            };

            // Generate in 3 steps;
            // note that referenced propertyClasses and resourceClasses are generated as soon as they are identified:
            [
                { resultL: this.generated.pCL, classes: Array.from(this.primitiveDataTypes.keys()), fn: this.makePC.bind(this) },
                { resultL: this.generated.rCL, classes: ["RC-SpecifTermresourceclass"], fn: this.makeRC.bind(this) },
                { resultL: this.generated.sCL, classes: ["RC-SpecifTermstatementclass"], fn: this.makeSC.bind(this) }
            ].forEach(
                (step) => { LIB.cacheL(step.resultL, this.makeClasses(step.classes, step.fn)); }
            );

            // Referenced statementClasses are generated at the end to avoid endless recursion:
            while (this.required.sTL.length > 0) {
                let sCL = [].concat(this.required.sTL);
                this.required.sTL.length = 0;
                LIB.cacheL(this.generated.sCL, sCL.map(this.makeSC.bind(this)));
                //        console.debug('required sCL', simpleClone(this.generated.sCL), simpleClone(this.required.sTL));
            };

            // In some cases, prepare a folder structure for the hierarchy:
            if (this.options.domains && this.options.domains.includes("SpecIF:DomainOntology")) {
                let rId = "R-FolderOntology";
                this.generated.rL.push( LIB.itemByKey(this.data.resources, { id: rId }) );
                let h: SpecifNode = {
                    id: LIB.replacePrefix(CONFIG.prefixN, rId),
                    resource: { id: rId },
                    nodes: [],
                    changedAt: now
                };

                Array.from(this.termPrincipalClasses.values(),
                    (clId:string) => {
                        this.generated.rL.push(LIB.itemByKey(this.data.resources, { id: clId }));
                        h.nodes.push({
                            id: LIB.replacePrefix(CONFIG.prefixN, clId),
                            resource: { id: clId },
                            nodes: [],
                            changedAt: now
                        })
                    }
                );
                this.generated.hL.push(h);
            };

            // Finally return the result:
            // @ts-ignore - the required properties are only missing, if specifically asked for via 'delta' option
            return Object.assign(
                opts.delta ? {} : this.makeTemplate(),
                {
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
                }
            )
        }
        else {
            message.show("No domain or term specified, so no classes will be generated.", { severity: 'warning' });
            return this.makeTemplate();
        }
    }

    // ---------------- Invoked methods ---------------------

    private makeClasses(rCIdL: string[], createFn: Function) {
        // Take the resources listed in the hierarchy, filter the selected ones and generate a class for each.
        // - rCIdL is a list of resourceClasses for SpecifTerms (such as SpecifTermResourceClass or SpecifTermStatementClass),
        // - fn creates the respective list of dataTypes and classes
        // ToDo: Better a method to CGenerated.

        let self = this;

        let cL: SpecifClass[] = [],  
            // 1. Find the terms of the classes listed in rCIdL:
            idL = LIB.referencedResourcesByClass(this.data.resources, this.data.hierarchies, rCIdL) as SpecifResource[];

        if (idL.length > 0) {
            let tL = idL
                // 2. Keep only those with selected domain and lifecycleStatus:
                .filter(isSelected);
            // 3. Create a class per term:
            cL = LIB.forAll(tL, createFn);
        };
        // the list of generated propertyClasses, resourceClasses or statementClasses:
        return cL as SpecifClass[];  

        function isSelected(r: SpecifResource): boolean {
            let localOpts = Object.assign({ SpecIF_LifecycleStatusReleased: true }, self.options);
            // True, if specified per lifecycleStatus and domain or title ..
            // or if it is referenced by another class:
            return hasSelectedStatus(r)
                && (hasSelectedDomain(r) || hasSelectedTerm(r));

            function hasSelectedDomain(el: SpecifResource): boolean {
                if (Array.isArray(self.options.domains)) {
                    let elDomains = LIB.valuesByTitle(el, [CONFIG.propClassDomain], self.data);
                    for (let d of elDomains) {
                        if (self.options.domains.includes(LIB.displayValueOf(d, { targetLanguage: 'default' })))
                            return true;
                    }
                };
                return false;
            }
            function hasSelectedTerm(el: SpecifResource): boolean {
                if (Array.isArray(self.options.terms)) {
                    let elTerms = LIB.valuesByTitle(el, [CONFIG.propClassTerm], self.data);
                    if (elTerms.length > 0 && self.options.terms.includes(LIB.displayValueOf(elTerms[0], { targetLanguage: 'default' })))
                        return true;
                };
                return false;
            }
            function hasSelectedStatus(el: SpecifResource): boolean {
                let selStatus = LIB.valuesByTitle(el, ["SpecIF:TermStatus"], self.data);
                for (let s of selStatus) {
                    if (localOpts[LIB.displayValueOf(s, { targetLanguage: 'default' }).toJsId()])
                        return true;
                };
                return false;
            }
        }
    }
    private makeDT(r: SpecifResource) {
        // Create a dataType for the TermPropertyClass r:
        let self = this;

        let ty = this.primitiveDataTypes.get(r["class"].id) as XsDataType, // get the primitive dataType implied by the term's class
            // make sure that in case of a dataType with enumerated values, the ids correspond to the ids of the dataTypes:
            prep = this.makeIdAndTitle(r, CONFIG.prefixPC),  // only used for dataTypes with enumerated values
            dtId = LIB.replacePrefix(CONFIG.prefixDT, prep.id), // also
            vId = LIB.replacePrefix(CONFIG.prefixV, prep.id),   // also

            // Find any assigned enumerated values; these are defined by related propertyValues:
            stL: SpecifStatement[] = this.statementsByTitle(r, ["SpecIF:hasEnumValue"], { asSubject: true }),  // all statements pointing to enumerated values
            oL: SpecifResource[] = stL.map(
                (st: SpecifStatement) => {
                    return LIB.itemById(this.data.resources, st.object.id)
                }
            ),  // the objects of those statements are the enumerated values

            // Create the entries of the list 'enumeration':
            enumL: SpecifEnumeratedValue[] = LIB.forAll(
                oL,
                (o: SpecifResource, idx: number) => {
                    // list of enumerated values:
                    let evL = LIB.valuesByTitle(o, [CONFIG.propClassTerm], this.data);
                    if( evL.length>0 )
                        return {
                            id: this.valueByTitle(o, CONFIG.propClassId) || vId + '-' + idx.toString(),
                            value: evL[0]
                        } as SpecifEnumeratedValue
                    else
                        console.warn("Property value term '" + o.id + "' is undefined")
                    // return undefined
                }
            ),
            dT = {} as SpecifDataType;
        //        console.debug('makeDT', r, stL, oL, enumL);

        // Look for any parameters per primitive data type:
        switch (ty) {
            case XsDataType.String:
                let maxLen = this.valueByTitle(r, "SpecIF:StringMaxLength");
                // @ts-ignore - missing attributes come further down
                dT = {
                    id: "DT-String" + (maxLen ? "-LE" + maxLen : ""),
                    title: "String" + (maxLen ? " <=" + maxLen : ""),
                    description: [{ text: "Text string" + (enumL.length > 0 ? " with enumerated values for " + prep.title : (maxLen ? " with maximum length " + maxLen : "")) }],
                    maxLength: maxLen ? parseInt(maxLen) : undefined
                };
                break;
            case XsDataType.Boolean:
                // @ts-ignore - missing attributes come further down
                dT = {
                    id: "DT-Boolean",
                    title: "Boolean Value",
                    description: [{ text: "A Boolean value." }]
                };
                break;
            case XsDataType.Integer:
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
            case XsDataType.Double:
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
            case XsDataType.DateTime:
                // @ts-ignore - missing attributes come further down
                dT = {
                    id: "DT-DateTime",
                    title: "Date/Time",
                    description: [{ text: "Date or timestamp in ISO-8601 format." }]
                };
                break;
            case XsDataType.Duration:
                // @ts-ignore - missing attributes come further down
                dT = {
                    id: "DT-Duration",
                    title: "Duration",
                    description: [{ text: "A duration as defined by the ISO 8601 ABNF for 'duration'." }]
                };
                break;
            case XsDataType.AnyURI:
                // @ts-ignore - missing attributes come further down
                dT = {
                    id: "DT-AnyURI",
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
            dT.enumeration = enumL;
        };
        dT.revision = this.valueByTitle(r, "SpecIF:Revision") || r.revision;
        dT.changedAt = r.changedAt;

        if (this.options.adoptOntologyDataTypes) {
            // if selected by an option, replace the generated dataType by an equivalent one of the Ontology itself:
            dT = adoptOntologyDataType(dT) || dT
        };

        LIB.cacheE(this.generated.dTL, dT); // store avoiding duplicates

        // In this case, return the whole dataType, as its type is needed for generating the propertyClass
        return dT;  

        function adoptOntologyDataType(d: SpecifDataType) {
            for (let dT of self.data.dataTypes) {
                if (LIB.equalDT(d, dT)) return dT
            }
            // return undefined
        }
    }
    private makePC(r: SpecifResource) {
        // Create a propertyClass for the TermPropertyClass r:

        // Create the dataType, unless it exists already:
        let dT = this.makeDT(r),
            defaultVL = LIB.valuesByTitle(r, this.termDefaultValues, this.data);

        // Undefined attributes will not appear in the generated classes (skipped by JSON.stringify)
        // @ts-ignore - the checker is formally right, but it is valid way to specialize a general item factory:
        return Object.assign(
            this.makeItem(r, CONFIG.prefixPC),
            {
                dataType: this.options.referencesWithoutRevision ? LIB.makeKey(dT.id) : LIB.makeKey(dT),  // the reference to the dataType
                format: this.valueByTitle(r, "SpecIF:TextFormat"),  // one or none of 'plain' or 'xhtml'
                multiple: LIB.isTrue(this.valueByTitle(r, "SpecIF:multiple")) ? true : undefined,
                values: (defaultVL.length > 0 && (dT.type != XsDataType.Boolean || defaultVL[0]=="true") ? defaultVL : undefined)
            }
        ) as SpecifPropertyClass;
    }
    private makeRC(r: SpecifResource) {
        // Create a resourceClass for the TermResourceClass r:

        let
            iL = LIB.valuesByTitle(r, ["SpecIF:Instantiation"], this.data),
            eC = this.extendingClassOf(r, CONFIG.prefixRC),
            eCk: SpecifKey,
            pCL = this.propertyClassesOf(r);
//        console.debug('insta', iL, iL.map((ins) => { return LIB.displayValueOf(ins, { targetLanguage: 'default' }) }));

        // Delete all properties from pCL which are already defined in an extending class;
        // this is a little more complicated than usual, because the resourceClass to generate is not yet listed in this.generated.sCL:
        if (eC) {
            eCk = LIB.makeKey(eC.id);
            if (Array.isArray(eC.propertyClasses) && eC.propertyClasses.length > 0 && pCL.length > 0) {
                eC = LIB.getExtendedClasses(this.generated.rCL, [eCk])[0]; // now with all collected properties
                pCL = pCL.filter(
                    (p) => {
                        // Keep the property only if it is not yet listed in any extending class
                        return LIB.referenceIndex(eC.propertyClasses, p) < 0;
                    }
                );
            };
        };

        // Create a resourceClass for the TermResourceClass r;
        // undefined attributes will not appear in the generated classes (omitted by JSON.stringify)
        return Object.assign(
            this.makeItem(r, CONFIG.prefixRC),
            {
                // @ts-ignore - eCk may be undefined and extends will be suppressed in that case
                extends: eCk,
                // no checkmark at instantiation means it is an abstract class, so an empty list:
                instantiation: iL.map((ins: SpecifValue) => { return LIB.displayValueOf(ins, { targetLanguage: 'default' }); }),
                isHeading: LIB.isTrue(this.valueByTitle(r, "SpecIF:isHeading")) ? true : undefined,
                icon: this.valueByTitle(r, "SpecIF:Icon"),
                propertyClasses: pCL.length>0? pCL : undefined
            }
        ) as SpecifResourceClass;
    }
    private makeSC(r: SpecifResource) {
        // Create a statementClass for the TermStatementClass r:

        let
            iL = LIB.valuesByTitle(r, ["SpecIF:Instantiation"], this.data),
            eC = this.extendingClassOf(r, CONFIG.prefixSC),
            eCk: SpecifKey,
            // In case of statementClasses a list of propertyClasses is optional and most often not used:
            pCL = this.propertyClassesOf(r),
            // The eligible subjectClasses:
            sCL = this.eligibleClassesOf(r, ["SpecIF:isEligibleAsSubject"]),
            // The eligible objectClasses:
            oCL = this.eligibleClassesOf(r, ["SpecIF:isEligibleAsObject"]);
//        console.debug('makeSC', r, pCL, sCL, oCL);

        // Delete all properties from pCL which are already defined in an extending class;
        // this is a little more complicated than usual, because the statementClass to generate is not yet listed in this.generated.sCL:
        if (eC) {
            eCk = LIB.makeKey(eC.id);
            if (Array.isArray(eC.propertyClasses) && eC.propertyClasses.length > 0 && pCL.length > 0) {
                eC = LIB.getExtendedClasses(this.generated.sCL, [eCk])[0]; // now with all collected properties
                pCL = pCL.filter(
                    (p) => {
                        // Keep the property only if it is not yet listed in any extending class
                        return LIB.referenceIndex(eC.propertyClasses, p) < 0;
                    }
                );
            };
        };

        // Undefined attributes will not appear in the generated classes (omitted by JSON.stringify)
        return Object.assign(
                this.makeItem(r, CONFIG.prefixSC),
                {
                    // @ts-ignore - eCk may be undefined and extends will be suppressed in that case
                    extends: eCk,
                    // no checkmark at instantiation means it is an abstract class, so an empty list:
                    instantiation: iL.map((ins: SpecifValue) => { return LIB.displayValueOf(ins, { targetLanguage: 'default' }); }),
                    isUndirected: LIB.isTrue(this.valueByTitle(r, "SpecIF:isUndirected")) ? true : undefined,
                    icon: this.valueByTitle(r, "SpecIF:Icon"),
                    // the eligible subjectClasses and objectClasses;
                    // no list means that all resourceClasses and statementClasses are eligible,
                    // whereas an empty list is not allowed:
                    subjectClasses: sCL.length > 0 ? sCL : undefined,
                    objectClasses: oCL.length > 0 ? oCL : undefined,
                    // the references per propertyClass;
                    // in case of propertyClasses no or an empty list is equivalent:
                    propertyClasses: pCL.length > 0 ? pCL : undefined
                }
            ) as SpecifDataType;
    }
    private extendingClassOf(el: SpecifResource, pfx: string) {
        // Return a resourceClass resp. statementClass which is related by "SpecIF:isSpecializationOfxx"
        // to el (the term describing the resourceClass resp. statementClass to be generated):
        if ([CONFIG.prefixRC, CONFIG.prefixSC].includes(pfx)) {

            let
                // We are interested only in statements where *other* resources resp. statements are the object:
                sL = this.statementsByTitle(el, (pfx == CONFIG.prefixRC ? ["SpecIF:isSpecializationOfResource"] : ["SpecIF:isSpecializationOfStatement"]), { asSubject: true });

            if (sL.length > 1) {
                console.warn('Term ' + el.id + ' has more than one extended class; the first found prevails.');
                // see: https://stackoverflow.com/questions/31547315/is-it-an-antipattern-to-set-an-array-length-in-javascript
                sL.length = 1;
            };

            if (sL.length > 0) {
                let term = LIB.itemByKey(this.data.resources, sL[0].object),
                    eC: any; // the generated extending class

                // Ascertain that the referenced resourceClass resp. statementClass will be included;
                // if it exists already due to correct selection, there will be no duplicate:
                switch (pfx) {
                    case CONFIG.prefixRC:
                        eC = this.makeRC(term);
                        LIB.cacheE(this.generated.rCL, eC);
                        break;
                    case CONFIG.prefixSC:
                        eC = this.makeSC(term);
                        LIB.cacheE(this.generated.sCL, eC);
                };

                return eC;
            };
        };
        // return undefined
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

        let pL = this.statementsByTitle(el, ["SpecIF:hasProperty"], { asSubject: true });
        for (let p of pL) {
            let term = LIB.itemByKey(this.data.resources, p.object),
                prep = this.makeIdAndTitle(term, CONFIG.prefixPC); // need the id only, here
            //            console.debug('propertyClassesOf', term, LIB.valuesByTitle(term, ["dcterms:identifier"], this.data));
            // an entry in the propertyClasses of the resourceClass resp statementClass to generate:
            LIB.cacheE(pCL, { id: prep.id });
            // Ascertain that all referenced propertyClasses will be available.
            // Thus, generate the referenced propertyClasses together with the dataTypes;
            // if they exist already due to correct selection, duplicates are avoided:
            LIB.cacheE(this.generated.pCL, this.makePC(term))
        };
        //        console.debug('propertyClassesOf', pL, pCL);

        return pCL;
    }
    /*  private relatedClassesOf(el: SpecifResource, clL: string[]) {
        .. this could be coded more generalized, but so far it is not: */
    private eligibleClassesOf(el: SpecifResource, clL: string[]) {
        // Return a list of resourceClasses and/or statementClasses which are related 
        // to term el (the statementClass to be generated) by a statementClass with a title listed in clL:

        // Todo: What about the revisions in iCL if this.options.referencesWithoutRevision is false?
        let iCL: SpecifResourceClass[] = [],  // the result list
            // We are interested only in statements where *other* statementClasses are eligible as subjectClasses:
            sL = this.statementsByTitle(el, clL, { asObject: true }); // list of statements of the specified class

        for (let s of sL) {
            let term = LIB.itemByKey(this.data.resources, s.subject),
                // need the id only, here:
                prep = this.makeIdAndTitle(term, term['class'].id == "RC-SpecifTermresourceclass" ? CONFIG.prefixRC : CONFIG.prefixSC);
            //            console.debug('eligibleClassesOf', term, prep);
            LIB.cacheE(iCL, { id: prep.id })

            if (!this.options.excludeEligibleSubjectClassesAndObjectClasses) {
                if (term['class'].id == "RC-SpecifTermresourceclass") {
                    if (LIB.indexById(this.generated.rCL, prep.id) < 0)
                        // Ascertain that all referenced resourceClasses will be available.
                        LIB.cacheE(this.generated.rCL, this.makeRC(term))
                }
                else {
                    // the class is "RC-SpecifTermstatementclass":
                    if (LIB.indexById(this.generated.sCL, prep.id) < 0)
                        // Any missing statementClasses are collected in this.required.sTL until the end of the generation 
                        // ... to avoid infinite recursion, because statementClasses can reference statementClasses.
                        // Thus, generate only the referenced resourceClasses immediately;
                        // duplicates are avoided:
                        LIB.cacheE(this.required.sTL, term)
                }
            }
        };
        //        console.debug('eligibleClassesOf', el, sL, iCL, simpleClone(this.required.sTL));

        return iCL
    }
    private makeItem(r: SpecifResource, prefix: string) {
        // Create the attributes common to all classes except dataType;
        // - take the resource's title as title
        // - and a derivative of the title as distinctive portion of the id.
        let prep = this.makeIdAndTitle(r, prefix),
            dscL = LIB.valuesByTitle(r, [CONFIG.propClassDesc], this.data),
            dsc: SpecifLanguageText;

        if (dscL.length > 1)
            console.info("Only the fist value of the description property will be used for the class generated from "
                + r.id + " with title " + prep.title + ".");

        if (dscL.length > 0) {
            dsc = dscL[0];
            dsc.format = LIB.isHTML(dsc.text) ? SpecifTextFormat.Xhtml : SpecifTextFormat.Plain;
        };

        // Undefined attributes will not appear in the generated classes (omitted by JSON.stringify)
        return {
            id: prep.id,
            revision: this.valueByTitle(r, "SpecIF:Revision") || r.revision,
            title: prep.title,
            // @ts-ignore - doesn't matter if dsc is undefined
            description: dsc, 
            changedAt: r.changedAt
        } as SpecifClass;
    }
    private checkConstraintsOntology(): boolean {
        /*  Check the following constraints / conventions:
            - Don't generate a class from a deprecated term --> No referenced term may be 'deprecated'
            - A term must have a property "PC-SpecifTerm" with the name of the term (the title contains the name in national languages)
            - A term name *must* have a name-space separated by ':' or '.', whereas a localTerm must *not*.
            - A term should have a relation 'SpecIF:isNamespace' with a namespace amd *must* not have more than one.
            - A TermResourceClass must have at least one propertyClass, either self or inherited from an extended class
            - A TermResourceClass or TermStatementClass must not have >1 statements with title "SpecIF:isSpecializationOf"
            - Chains of "isSpecializationOf" relations must not be cyclic.
            - Chains of "isEligibleAsSubject" relations must not be cyclic.
            - Chains of "isEligibleAsObject" relations must not be cyclic.
            - A term can be the plural of one or more other terms, but a term must not have more than one plural
            - A term having a plural attribute should not have a term related by 'isPluralOfResource' ... and vice versa.
            - A term which is the plural of another term must not have a plural itself.
            - A property with enumerated values must have >1.
            - Data format of a propertyClass CONFIG.propClassTitle ('dcterms:title') must be 'plain'
            - Data format of a propertyClass CONFIG.propClassDesc ('dcterms:description') should be 'xhtml'
            - Data format of a propertyClass CONFIG.propClassDiagram ('SpecIF:Diagram') must be 'xhtml'
            - Data format of a propertyClasses with enumerated values of type xs:string should be 'plain'
            - Among synonyms, there should be just one 'preferred' term
            - must define a term CONFIG.resClassFolder ("SpecIF:Heading") and some basic propertyClasses used by ioXls
            - ToDo: complete the list ...
        */

        return true
    }

    private statementsByTitle(r: SpecifResource, tiL: string[], opts: any) {
        // Find the statements of the class with title in tiL referencing the given term r as subject or object:
        // - if opts.asSubject, then all statements where r is the subject are selected
        // - if opts.asObject, then all statements where r is the object are selected

    /*  In certain cases this ends in an infinite loop, therefore we skip it for now ...
        // First make it a little more robust against changes in the ontology:
        // ToDo: a more efficient solution is to do it once in the construction phase ...
        ti = this.normalize("statementClass", ti);  */

        return this.data.statements.filter(
            (st: SpecifStatement) => {
                // better use 'instanceTitleOf', but it is not available, here:
                return tiL.includes(LIB.classTitleOf(st['class'], this.data.statementClasses))
                    && (opts.asSubject && st.subject.id == r.id
                        || opts.asObject && st.object.id == r.id);
            }
        ) as SpecifStatement[]
    }
    valueByTitle(el: SpecifResource, ti: string): string {
        // Return the value of el's property with title ti:
        return LIB.valueByTitle(el, ti, this.data);
    //    let pVL = LIB.valuesByTitle(el, [ti], this.data);
    //    return pVL.length > 0 ? LIB.displayValueOf(pVL[0], { targetLanguage: 'default' }) : undefined
    }
    private distinctiveCoreOf(ti: string): string {
        return ti.toCamelCase();
    }
    private makeIdAndTitle(r: SpecifResource, pfx: string) {
        // Make an id and a title for the class generated for term r
        // Todo: What about the revision if this.options.referencesWithoutRevision is false?
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
    private getModelElementClasses(): string[] {
        // Return a list of all model element types by title;
        // these are all specializations of SpecIF:ModelElement:
        // ToDo: Derive from SpecIF Ontology: All specializations of "SpecIF:ModelElement"

        let tR = this.getTermResource('resourceClass', "SpecIF:ModelElement"),
            sL: string[] = [];
        if (tR) {
            // We are interested only in statements where *other* resources resp. statements are the object:
            sL = this.statementsByTitle(tR, ["SpecIF:isSpecializationOfResource"], { asObject: true })
                .map(
                    (s:SpecifStatement) => {
                        let r = LIB.itemByKey(this.data.resources, s.subject);
                        return this.valueByTitle(r, CONFIG.propClassTerm);
                    }
                );
        };
        return ["SpecIF:ModelElement"].concat(sL);
    }
    private getHeadings(): string[] {
        // Return a list of all heading types,
        // i.e. those termresourceClasses whose attribute 'isHeading' is true:
        return this.data.resources
            .filter(
                (r) => {
                    return (LIB.classTitleOf(r['class'], this.data.resourceClasses) == "SpecIF:TermResourceClass")
                        && LIB.isTrue(this.valueByTitle(r, "SpecIF:isHeading"))
                    //  || is specialization of ("SpecIF:Heading")
                }
            )
            .map(
                (r) => {
                    return this.valueByTitle(r, CONFIG.propClassTerm)
                }
            );
    }
    private getNamespaces() {
        // Fill the map of all namespaces:
        let m = new Map();
        this.data.resources
        .filter(
            (r) => {
                return LIB.classTitleOf(r['class'], this.data.resourceClasses) == "SpecIF:Namespace"
            }
        )
        .forEach(
            (r) => {
                m.set(this.valueByTitle(r, CONFIG.propClassTerm), { id: r.id, url:this.valueByTitle(r, "SpecIF:Origin") })
            }
        );
        return m;
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
            let now = new Date().toISOString();
            for (var r of this.data.resources) {
                if (this.termClasses.includes(LIB.classTitleOf(r['class'], this.data.resourceClasses))) {
                    let term = this.valueByTitle(r, CONFIG.propClassTerm),
                        match = RE.splitVocabularyTerm.exec(term);
                    if (Array.isArray(match) && match[1]) {
                        let stC = LIB.makeKey(item),
                            noNs = true;
                        // the term has a namespace:
                        for (let [key,val] of this.namespaces) {
                            if (match[1] == key) {
                                this.data.statements.push({
                                    id: LIB.genID(CONFIG.prefixS),
                                    changedAt: now,
                                    class: stC,
                                    subject: LIB.makeKey(val.id),
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
