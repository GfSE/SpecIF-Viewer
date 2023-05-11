/*!    SpecIF: Generate Specif classes from the Ontology.
    Dependencies: -
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    Author: se@enso-managers.de, Berlin
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/

class COntology {
    ontology: SpecIF;
    allDomains = [];
    // Assign the primitive dataType to the propertyClass types of a SpecIF Ontology: 
    primitiveDataTypes = new Map([
        ["RC-TermPropertyClassString", SpecifDataTypeEnum.String],
        ["RC-TermPropertyClassBoolean", SpecifDataTypeEnum.Boolean],
        ["RC-TermPropertyClassInteger", SpecifDataTypeEnum.Integer],
        ["RC-TermPropertyClassReal", SpecifDataTypeEnum.Double],
        ["RC-TermPropertyClassTimestamp", SpecifDataTypeEnum.DateTime],
        ["RC-TermPropertyClassDuration", SpecifDataTypeEnum.Duration],
        ["RC-TermPropertyClassAnyURI", SpecifDataTypeEnum.AnyUri]
    ]);
    options: any;
    required: any;
    generated: any;

    constructor(ontology: SpecIF) {
        // 'ontology' is a SpecIF data set with classes and instances defining an Ontology.The hierarchy root has a property of "dcterms:type" with value "W3C:Ontology".
        this.ontology = ontology;

        // Filter all hierarchies having a property of "dcterms:type" with value "W3C:Ontology";
        // there is a side-effect on the data handed-in, but in case of the SpecIF Viewer/Editor, this isn't harmful.
        ontology.hierarchies = ontology.hierarchies.filter(
            (h: SpecifNode) => {
                let r = LIB.itemByKey(ontology.resources, h.resource);
                return this.valueByTitle(r, "dcterms:type") == "W3C:Ontology"
            }
        );
        if (ontology.hierarchies.length < 1) {
            message.show("No ontology found, so no classes will be generated.", { severity: 'warning' });
            return
        };
        // Make a list of all defined domains in the SpecIF Ontology:
        let dTDomains = LIB.itemById(this.ontology.dataTypes, "DT-Domain");
        this.allDomains = dTDomains.enumeration.map(
            (v: SpecifEnumeratedValue) => LIB.languageValueOf(v.value, { targetLanguage: "default" })
        );
        this.options = {};
    }

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

        if (!this.checkConstraintsOntology(this.ontology)) {
            message.show("The Ontology violates one or more constraints, so no classes will be generated. Please see the browser log for details.", { severity: 'error' });
            return
        };

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
            { resultL: this.generated.rCL, classes: ["RC-TermResourceClass"], fn: this.createRC.bind(this) },
            { resultL: this.generated.sCL, classes: ["RC-TermStatementClass"], fn: this.createSC.bind(this) }
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

        // We are done, so we can return the result:
        return Object.assign(
            app.standards.makeTemplate(),
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
    exportOntologyClasses(opts?: any): SpecIF | undefined {
        /* Return a SpecIF data set with all classes of the ontology */

        if (!this.ontology) {
            message.show("No valid ontology loaded.", { severity: 'error' });
            return
        };
        return Object.assign(
            opts.delta ? {} : app.standards.makeTemplate(),
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
                "dataTypes": this.ontology.dataTypes,
                "propertyClasses": this.ontology.propertyClasses,
                "resourceClasses": this.ontology.resourceClasses,
                "statementClasses": this.ontology.statementClasses
            }
        )
    }

    // ---------------- Invoked methods ---------------------

    private makeClasses(rCIdL: string[], createFn: Function) {
        // Take the resources listed in the hierarchy, filter the selected ones and generate a class for each.
        // ToDo: Better a method to CGenerated.

        let self = this;

        let rCL: SpecifItem[] = [],  // the result list
            // 1. Find the terms of the classes listed in rCIdL:
            idL = LIB.referencedResourcesByClass(this.ontology.resources, this.ontology.hierarchies, rCIdL) as SpecifResource[];

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
                let myDomains = LIB.valuesByTitle(el, [CONFIG.propClassDomain], self.ontology);
                for (let d of myDomains) {
                    if (self.options[LIB.displayValueOf(d, { targetLanguage: 'default' }).toJsId()])
                        return true;
                };
                return false;
            }
            function hasSelectedStatus(el: SpecifItem): boolean {
                let selStatus = LIB.valuesByTitle(el, [CONFIG.propClassLifecycleStatus], self.ontology);
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
            prep = this.makeIdAndTitle(r, "PC-"),  // only used for dataTypes with enumerated values - must have prefix DT-, so that the replacement works ..
            dtId = prep.id.replace(/^PC-/, "DT-"), // also
            vId = prep.id.replace(/^PC-/, "V-"),   // also
            // Find any assigned enumerated values; these are defined by related propertyValues:
            stL = this.statementsByClass(r, "SpecIF:hasEnumValue", { asSubject: true }),  // all statements pointing to enumerated values
            oL = stL.map(
                (st: SpecifStatement) => {
                    return LIB.itemById(this.ontology.resources, st.object.id)
                }
            ),  // the objects of those statements are the enumerated values

            // Create the entries of the list 'enumeration':
            enumL = oL.map(
                (o: SpecifResource, idx: number) => {
                    let eV = LIB.valuesByTitle(o, [CONFIG.propClassTitle], this.ontology)[0];
                    return {
                        id: vId + '-' + idx.toString(),
                        value: eV
                    }
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
            for (let dT of self.ontology.dataTypes) {
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
            defaultVs = LIB.valuesByTitle(r, ["SpecIF:DefaultValue"], this.ontology);

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
    private pCsOf(el: SpecifResource) {
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
            let term = LIB.itemByKey(this.ontology.resources, p.object),
                prep = this.makeIdAndTitle(term, "PC-"); // need the id only, here
            //            console.debug('pCsOf', term, LIB.valuesByTitle(term, ["dcterms:identifier"], this.ontology));
            // an entry in the propertyClasses of the resourceClass resp statementClass to generate:
            LIB.cacheE(pCL, { id: prep.id });
            // Ascertain that all referenced propertyClasses will be available.
            // Thus, generate the referenced propertyClasses together with the dataTypes;
            // if they exist already due to correct selection, duplicates are avoided:
            LIB.cacheE(this.generated.pCL, this.createPC(term))
        };
        //        console.debug('pCsOf', pL, pCL);

        return pCL
    }
    private createRC(r: SpecifResource) {
        let iL = LIB.valuesByTitle(r, ["SpecIF:Instantiation"], this.ontology);
        //        console.debug('insta', iL, iL.map((ins) => { return LIB.displayValueOf(ins, { targetLanguage: 'default' }) }));

        // Create a resourceClass for the TermResourceClass r;
        // undefined attributes will not appear in the generated classes (omitted by JSON.stringify)
        return Object.assign(
            this.createItem(r, 'RC-'),
            {
                instantiation: iL.map((ins: SpecifValue) => { return LIB.displayValueOf(ins, { targetLanguage: 'default' }) }),
                isHeading: LIB.isTrue(this.valueByTitle(r, "SpecIF:isHeading")) ? true : undefined,
                icon: this.valueByTitle(r, "SpecIF:Icon"),
                // the references per propertyClass:
                propertyClasses: this.pCsOf(r)
            }
        ) as SpecifResourceClass;
    }
    private sCsOf(el: SpecifResource, cl: string) {
        // Return a list of resourceClasses and/or statementClasses which are related 
        // to term el (the statementClass to be generated) by the given statementClass cl:

        let iCL: SpecifResourceClass[] = [],  // the result list
            // We are interested only in statements where *other* statementClasses are eligible as subjectClasses:
            sL = this.statementsByClass(el, cl, { asObject: true }); // list of statements of the specified class

        for (let s of sL) {
            let term = LIB.itemByKey(this.ontology.resources, s.subject),
                prep = this.makeIdAndTitle(term, term['class'].id == "RC-TermResourceClass" ? "RC-" : "SC-"); // need the id only, here
            //            console.debug('sCsOf', term, LIB.valuesByTitle(term, ["dcterms:identifier"], this.ontology));
            LIB.cacheE(iCL, { id: prep.id })

            if (this.options.includeEligibleSubjectClassesAndObjectClasses) {
                if (term['class'].id == "RC-TermResourceClass") {
                    if (LIB.indexById(this.generated.rCL, prep.id) < 0)
                        // Ascertain that all referenced resourceClasses will be available.
                        LIB.cacheE(this.generated.rCL, this.createRC(term))
                }
                else {
                    // the class is "RC-TermStatementClass":
                    if (LIB.indexById(this.generated.sCL, prep.id) < 0)
                        // Any missing statementClasses are collected in this.required.sTL until the end of the generation 
                        // ... to avoid infinite recursion, because statementClasses can reference statementClasses.
                        // Thus, generate only the referenced resourceClasses immediately;
                        // if they exist already due to correct selection, duplicates are avoided:
                        LIB.cacheE(this.required.sTL, term)
                }
            }
        };
        //        console.debug('sCsOf', el, sL, iCL, this.required.sTL);

        return iCL
    }
    private createSC(r: SpecifResource) {
        // Create a statementClass for the TermStatementClass r:

        let
            iL = LIB.valuesByTitle(r, ["SpecIF:Instantiation"], this.ontology),
            // In case of statementClasses a list of propertyClasses is optional and most often not used:
            pCL = this.pCsOf(r),
            // The eligible subjectClasses:
            sCL = this.sCsOf(r, "SpecIF:isEligibleAsSubject"),
            // The eligible objectClasses:
            oCL = this.sCsOf(r, "SpecIF:isEligibleAsObject");
        //        console.debug('createSC', r, pCL, sCL, oCL);

        // Undefined attributes will not appear in the generated classes (omitted by JSON.stringify)
        return Object.assign(
            this.createItem(r, 'SC-'),
            {
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
        if (['RC-', 'SC-'].includes(pfx)) {

            let
                // We are interested only in statements where *other* resources resp. statements are the object:
                sL = this.statementsByClass(el, "SpecIF:isSpecializationOf", { asSubject: true });

            if (sL.length > 1) {
                console.warn('Term ' + el.id + ' has more than one extended class; the first found prevails.');
                // see: https://stackoverflow.com/questions/31547315/is-it-an-antipattern-to-set-an-array-length-in-javascript
                sL.length = 1
            };

            if (sL.length > 0) {
                let term = LIB.itemByKey(this.ontology.resources, sL[0].object),
                    prep = this.makeIdAndTitle(term, pfx); // need the id only, here

                // Ascertain that the referenced resourceClass resp. statementClass will be available;
                // if it exists already due to correct selection, there will be no duplicate:
                switch (pfx) {
                    case 'RC-':
                        LIB.cacheE(this.generated.rCL, this.createRC(term));
                        break;
                    case 'SC-':
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
            dscL = LIB.valuesByTitle(r, [CONFIG.propClassDesc], this.ontology);
        if (dscL.length > 1)
            console.info("Only the fist value of the description property will be used for the class generated from " + r.id + " with title " + prep.title + ".");

        // Undefined attributes will not appear in the generated classes (omitted by JSON.stringify)
        return {
            // Take the specified identifier if available or build one with the title ... :
            id: prep.id,
            revision: this.valueByTitle(r, "SpecIF:Revision") || r.revision,
            extends: this.extCOf(r, prefix),
            title: prep.title,
            // ToDo: Consider to complement the multilanguageText with format and language:
            description: (dscL.length > 0 ? dscL[0] : undefined), // only the first property value is taken for the class description
            changedAt: r.changedAt
        } as SpecifClass;
    }
    // @ts-ignore
    private checkConstraintsOntology(dta: SpecIF): boolean {
        /*  Check the following constraints / conventions:
            - Don't generate a class from a deprecated term --> No referenced term may be 'deprecated'
            - A TermResourceClass must have at least one propertyClass, either self or inherited from an extended class
            - A TermResourceClass or TermStatementClass may not have >1 statements with title "SpecIF:isSpecializationOf"
            - Chains of "isSpecializationOf" relations must not be circular.
            - Chains of "isEligibleAsSubject" relations must not be circular.
            - Chains of "isEligibleAsObject" relations must not be circular.
            - ToDo: complete the list ...
        */
        // A TermResourceClass or TermStatementClass may not have > 1 statements with title "SpecIF:isSpecializationOf":

        return true
    }

    private statementsByClass(r: SpecifResource, ti: string, opts: any) {
        // Find the statements of the class with title ti referencing the given term r as subject or object:
        // - if opts.asSubject, then all statements where r is the subject are selected
        // - if opts.asObject, then all statements where r is the object are selected
        return this.ontology.statements.filter(
            (st: SpecifStatement) => {
                // better use 'instanceTitleOf', but it is not available, here:
                return LIB.classTitleOf(st['class'], this.ontology.statementClasses) == ti
                    && (opts.asSubject && st.subject.id == r.id
                        || opts.asObject && st.object.id == r.id);
            }
        ) as SpecifStatement[];
    }
    private valueByTitle(el: SpecifResource, ti: string): string {
        // Return the value of el's property with title ti:
        let pVL = LIB.valuesByTitle(el, [ti], this.ontology);
        return pVL.length > 0 ? LIB.displayValueOf(pVL[0], { targetLanguage: 'default' }) : undefined
    }
    private distinctiveCoreOf(ti: string): string {
        return ti.toCamelCase();
    }
    private makeIdAndTitle(r: SpecifResource, pfx: string) {
        // Make an id and a title for the class generated for term r
        let visIdL = LIB.valuesByTitle(r, ["dcterms:identifier"], this.ontology),
            ti = LIB.getTitleFromProperties(r.properties, { targetLanguage: 'default' });
        return {
            // Use the identifier provided by the user or generate it using the title:
            id: visIdL && visIdL.length > 0 ?
                LIB.languageValueOf(visIdL[0], { targetLanguage: 'default' }).toSpecifId()
                : (pfx + this.distinctiveCoreOf(ti)),
            title: ti
        }
    }
}

