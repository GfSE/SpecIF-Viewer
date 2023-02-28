/*!    SpecIF: Generate Specif classes from the Ontology.
    Dependencies: -
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    Author: se@enso-managers.de, Berlin
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/

function generateSpecifClasses(ontologies: SpecIF, opts?: any): SpecIF|undefined {
/*  Generate SpecIF classes for ontology terms which
    - are selected by domain and lifecyclestatus (so far only those with lifecycleState=="preferred")
    - or are referenced by others selected by domain and lifecyclestatus
*/
    // pr is a SpecIF data set with classes and instances defining an Ontology. The hierarchy root has a property of "dcterms:type" with value "W3C:Ontology".
    // opts contains the selected domains, for which classes shall be generated, e.g. {"Base":"true", "Requirement_Engineering":"true"}

    // Filter all hierarchies having a property of "dcterms:type" with value "W3C:Ontology";
    // there is a side-effect on the data handed-in, but in case of the SpecIF Viewer/Editor, this isn't harmful.
    ontologies.hierarchies = ontologies.hierarchies.filter(
        (h: SpecifNode) => {
            let r = LIB.itemByKey(ontologies.resources, h.resource);
            return valueByTitle(r, "dcterms:type") == "W3C:Ontology"
        }
    );
//    console.debug('generateSpecifClasses', ontologies, opts);

    if (ontologies.hierarchies.length < 1) {
        message.show("No ontology found, so no classes will be generated.", { severity: 'warning' });
        return
    };

    let
        spId = "P-SpecifClasses",  // id of the SpecIF data set with the generated classes, will be complemented with the selected domains

        // Assign the primitive dataType to the propertyClass types of a SpecIF Ontology: 
        primitiveDataTypes = new Map([
            ["RC-TermPropertyClassString", SpecifDataTypeEnum.String],
            ["RC-TermPropertyClassBoolean", SpecifDataTypeEnum.Boolean],
            ["RC-TermPropertyClassInteger", SpecifDataTypeEnum.Integer],
            ["RC-TermPropertyClassReal", SpecifDataTypeEnum.Double],
            ["RC-TermPropertyClassTimestamp", SpecifDataTypeEnum.DateTime],
            ["RC-TermPropertyClassDuration", SpecifDataTypeEnum.Duration],
            ["RC-TermPropertyClassAnyURI", SpecifDataTypeEnum.AnyUri]
        ]),

        // Make a list of all defined domains in the SpecIF Ontology:
        dTDomains = LIB.itemById(ontologies.dataTypes, "DT-Domain"),
        allDomains = dTDomains.enumeration.map(
            (v: SpecifEnumeratedValue) => LIB.languageValueOf(v.value, { targetLanguage: "default" })
        ),

        // The selected domains for generating classes:
        selDomains = allDomains.filter((d: string) => { return opts[d.toJsId()] });

    if ( !checkConstraintsOntology(ontologies) ) {
        message.show("The Ontology violates one or more constraints, so no classes will be generated. Please see the browser log for details.", { severity: 'error' });
        return
    };

    if (selDomains.length < 1) {
        message.show("No domain selected, so no classes will be generated.", { severity: 'warning' });
        return
    };

    // add the domains to the id of the generated data set:
    selDomains.forEach((d: string) => { spId += '-' + d.toJsId() });
//    console.debug('#', dTDomains, allDomains, selDomains, spId);

    class CGenerated {
        dTL: SpecifDataType[] = [];  // is filled by the function creating the propertyClasses, as there are no explicit dataTypes in a SpecIF Ontology.
        pCL: SpecifPropertyClass[] = [];
        rCL: SpecifResourceClass[] = [];
        sCL: SpecifStatementClass[] = []
        // ToDo: all making functions below as methods
    }
    let
        required = {
            sTL: []  // list of referenced but missing instances of termStatementClass
        },
        generated = new CGenerated;  // Intermediate storage of the generated classes

    // Generate in 3 steps;
    // note that referenced propertyClasses and resourceClasses are generated as soon as they are identified:
/*    LIB.cacheL( generated.pCL, makeClasses(Array.from(primitiveDataTypes.keys()), createPC) );
    LIB.cacheL( generated.rCL, makeClasses(["RC-TermResourceClass"], createRC) );
    LIB.cacheL( generated.sCL, makeClasses(["RC-TermStatementClass"], createSC) ); */
    [
        { resultL: generated.pCL, classes: Array.from(primitiveDataTypes.keys()), fn: createPC },
        { resultL: generated.rCL, classes: ["RC-TermResourceClass"], fn: createRC },
        { resultL: generated.sCL, classes: ["RC-TermStatementClass"], fn: createSC }
    ].forEach(
        (step) => { LIB.cacheL(step.resultL, makeClasses(step.classes, step.fn)); }
    );

    // Referenced statementClasses are generated at the end to avoid endless recursion:
    while (required.sTL.length > 0) {
        let sCL = [].concat(required.sTL);
        required.sTL.length = 0;
        LIB.cacheL(generated.sCL, sCL.map(createSC));
//        console.debug('required sCL', simpleClone(generated.sCL), simpleClone(required.sTL));
    };

    // We are done, so we can return the result:
    return {
        "id": spId,
        "$schema": "https://specif.de/v1.1/schema.json",
        "title": [
            {
                "text": "SpecIF Classes"
            }
        ],
        "description": [
            {
                "text": "A set of SpecIF Classes derived from a SpecIF Ontology for the domain"+(selDomains.length<2?" ":"s ")+selDomains.toString()+"."
            }
        ],
        "generator": app.title,
        "generatorVersion": CONFIG.appVersion,
        "createdAt": new Date().toISOString(),
        "rights": {
            "title": "Creative Commons 4.0 CC BY-SA",
            "url": "https://creativecommons.org/licenses/by-sa/4.0/"
        },
        "dataTypes": generated.dTL,
        "propertyClasses": generated.pCL,
        "resourceClasses": generated.rCL,
        "statementClasses": generated.sCL,
        "resources": [],
        "statements": [],
        "files": [],
        "hierarchies": []
    };

    // ---------------- Invoked functions ---------------------

    function makeClasses(rCIdL: string[], createFn: Function) {
        // Take the resources listed in the hierarchy, filter the selected ones and generate a class for each.
        // ToDo: Better a method to CGenerated.

        let rCL: SpecifItem[] = [],  // the result list
            // 1. Find the terms of the classes listed in rCIdL:
            idL = LIB.referencedResourcesByClass(ontologies.resources, ontologies.hierarchies, rCIdL) as SpecifResource[];

        if (idL.length > 0) {
            let tL = idL
                // 2. Keep only those with selected domain and lifecycleStatus:
                .filter( isSelected );
            // 3. Create a class per term:
            rCL = LIB.forAll(tL, createFn);
        };
        return rCL as SpecifItem[];

        function isSelected(r: SpecifResource): boolean {
            let localOpts = Object.assign({ SpecIF_LifecycleStatusReleased: true }, opts);
            // True, if specified per domain abd lifecycleStatus ..
            // or if it is referenced by another class:
            return hasSelectedStatus(r, localOpts)
                && hasSelectedDomain(r);

            function hasSelectedDomain(el: SpecifItem): boolean {
                let myDomains = LIB.valuesByTitle(el, [CONFIG.propClassDomain], ontologies);
                for (let d of myDomains) {
                    if (opts[LIB.displayValueOf(d, { targetLanguage: 'default' }).toJsId()])
                        return true;
                };
                return false;
            }
            function hasSelectedStatus(el: SpecifItem, opts: any): boolean {
                let selStatus = LIB.valuesByTitle(el, [CONFIG.propClassLifecycleStatus], ontologies);
                for (let s of selStatus) {
                    if (opts[LIB.displayValueOf(s, { targetLanguage: 'default' }).toJsId()])
                        return true;
                };
                return false;
            }
        }
    }
    function statementsByClass(r:SpecifResource, ti:string) {
        // Find the statements of the class with title ti referencing the given term r as subject or object:
        return ontologies.statements.filter(
            (st: SpecifStatement) => {
                // better use 'instanceTitleOf', but it is not available, here:
                return LIB.classTitleOf(st['class'], ontologies.statementClasses) == ti
                    && (st.subject.id == r.id || st.object.id == r.id);
            }
        ) as SpecifStatement[];
    }
    function valueByTitle(el: SpecifResource, ti: string): string {
        // Return the value of el's property with title ti:
        let pVL = LIB.valuesByTitle(el, [ti], ontologies);
        return pVL.length > 0 ? LIB.displayValueOf(pVL[0], { targetLanguage: 'default' }) : undefined
    }
    function distinctiveCoreOf(ti:string): string {
        return ti.toCamelCase();
    }
    function makeIdAndTitle(r: SpecifResource, pfx: string) {
        // Make an id and a title for the class generated for term r
        // - use the identifier provided by the user or generate it using the title
        let visIdL = LIB.valuesByTitle(r, ["dcterms:identifier"], ontologies),
            ti = LIB.getTitleFromProperties(r.properties, { targetLanguage: 'default' });
        return {
            id: visIdL && visIdL.length > 0 ?
                  LIB.languageValueOf(visIdL[0], { targetLanguage: 'default' })
                : (pfx + distinctiveCoreOf(ti)),
            title: ti
        }
    }
    function createDT(r: SpecifResource) {
        // Create a dataType for the TermPropertyClass r:

        // Find any assigned enumerated values;
        // these are defined by related propertyValues:
        let ty = primitiveDataTypes.get(r["class"].id) as SpecifDataTypeEnum, // get the primitive dataType implied by the term's class
            ti = LIB.getTitleFromProperties(r.properties, { targetLanguage: 'default' }),  // title (only used for dataTypes with enumerated values)
            stL = statementsByClass(r, "SpecIF:hasEnumValue"),  // all statements pointing to enumerated values
            oL = stL.map(
                (st: SpecifStatement) => {
                    return LIB.itemById(ontologies.resources, st.object.id)
                }
            ),  // the objects of those statements are the enumerated values

            // Create the entries of the list 'enumeration':
            enumL = oL.map(
                (o: SpecifResource, idx: number) => {
                    let eV = LIB.valuesByTitle(o, [CONFIG.propClassTitle], ontologies)[0];
                    return {
                        id: 'V-'+ distinctiveCoreOf(ti) + '-' + idx.toString(),
                        value: eV
                    }
                }
            ),
            dT = {} as SpecifDataType;
//        console.debug('createDT', r, stL, oL, enumL);

        // Look for any parameters per primitive data type:
        switch (ty) {
            case SpecifDataTypeEnum.String:
                let maxLen = valueByTitle(r, "SpecIF:StringMaxLength");
                // @ts-ignore - missing attributes come further down
                dT = {
                    id: "DT-String" + (maxLen ? "-LE" + maxLen : ""),
                    title: (enumL.length > 0 ? ti : "String" + (maxLen? " <=" + maxLen : "")),
                    description: [{ text: "Text string" + (enumL.length > 0? " with enumerated values for "+ti : (maxLen ? " with maximum length " + maxLen : "")) }],
                    maxLength: maxLen? parseInt(maxLen) : undefined
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
                let maxI = valueByTitle(r, "SpecIF:IntegerMaxInclusive"),
                    minI = valueByTitle(r, "SpecIF:IntegerMinInclusive");
                // @ts-ignore - missing attributes come further down
                dT = {
                    id: "DT-Integer" + (minI ? "-GE" + minI : "") + (maxI ? "-LE" + maxI : ""),
                    title: "Integer Value" + (minI ? " >=" + minI : "") + (maxI ? " <=" + maxI : ""),
                    description: [{ text: "A numerical integer value" + (minI && maxI ? " with minimum value " + minI + " and maximum value " + maxI : (minI ? " with minimum value " + minI : (maxI ? " with maximum value " + maxI : "")))+"." }],
                    minInclusive: minI ? parseInt(minI) : undefined,
                    maxInclusive: maxI ? parseInt(maxI) : undefined
                };
                break;
            case SpecifDataTypeEnum.Double:
                let frD = valueByTitle(r, "SpecIF:RealFractionDigits"),
                    maxR = valueByTitle(r, "SpecIF:RealMaxInclusive"),
                    minR = valueByTitle(r, "SpecIF:RealMinInclusive");
                // @ts-ignore - missing attributes come further down
                dT = {
                    id: "DT-Real" + (minR ? "-GE" + minR : "") + (maxR ? "-LE" + maxR : "") + (frD ? "-FD" + frD : ""),
                    title: "Real Value" + (minR ? " >=" + minR : "") + (maxR ? " <=" + maxR : "") + (frD? " "+frD+"digits" : ""),
                    description: [{ text: "A numerical floating point number (double precision)" + (minR && maxR ? " with minimum value " + minR + " and maximum value " + maxR : (minR ? " with minimum value " + minR : (maxR ? " with maximum value " + maxR : ""))) + (frD? " having no more than "+frD+" digits" : "")+"." }],
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
                    description: [{ text: "Date or timestamp in ISO-8601 format."}]
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
            dT.id += "-" + distinctiveCoreOf(ti);
            dT.enumeration = enumL
        };
        dT.revision = valueByTitle(r, "SpecIF:Revision") || r.revision;
        dT.changedAt = r.changedAt;

        if (opts.adoptOntologyDataTypes) {
            // if selected by an option, replace the generated dataType by an equivalent one of the Ontology itself:
            dT = adoptOntologyDataType(dT) || dT
        };

        LIB.cacheE(generated.dTL, dT); // store avoiding duplicates
        return LIB.makeKey(dT);  // the key as reference for the generated propertyClass

        function adoptOntologyDataType(d: SpecifDataType) {
            for ( let dT of ontologies.dataTypes) {
                if( LIB.equalDT(d,dT) ) return dT
            }
            // return undefined
        }
    }
    function createPC(r: SpecifResource) {
        // Create a propertyClass for the TermPropertyClass r:
//        console.debug('createPC', r);

        // 1. Create the dataType, unless it exists already:
        let dTk = createDT(r),
            defaultVs = LIB.valuesByTitle(r, ["SpecIF:DefaultValue"], ontologies);

        return Object.assign(
            createItem(r, 'PC-'),
            {
                dataType: dTk,      // the reference to the dataType
                format: valueByTitle(r, "SpecIF:TextFormat"),  // one or none of 'plain' or 'xhtml'
                multiple: LIB.isTrue(valueByTitle(r, "SpecIF:multiple")),
                values: defaultVs.length > 0 ? defaultVs : undefined
            }
        ) as SpecifPropertyClass;
    }
    function pCsOf(el:SpecifResource) {
        // Return a list of propertyClasses which are related by "SpecIF:hasProperty"
        // to el (the term describing the resourceClass resp. statementClass to be generated):

        let pCL: SpecifPropertyClass[] = [
            // All created resourceClasses shall have these two propertyClasses (by title),
            // regardless of any definition in the ontology:
            //   { id: "PC-title" },
            //   { id: "PC-description" }
            ],  // the result list
            tL: SpecifResource[] = [];  // list of referenced instances of termPropertyClass

        let pL = statementsByClass(el, "SpecIF:hasProperty");
        for (let p of pL) {
            let term = LIB.itemByKey(ontologies.resources, p.object),
                prep = makeIdAndTitle(term, "PC-"); // need the id only, here
//            console.debug('pCsOf', term, LIB.valuesByTitle(term, ["dcterms:identifier"], ontologies));
            // an entry in the propertyClasses of the resourceClass resp statementClass to generate:
            LIB.cacheE(pCL, { id: prep.id });
            // an entry in the list with the terms describing the referenced propertyClass:
            LIB.cacheE(tL, term)
        };
//        console.debug('pCsOf', pL, pCL, tL);

        // Ascertain that all referenced propertyClasses will be available.
        // Thus, generate the referenced propertyClasses together with the dataTypes;
        // if they exist already due to correct selection, duplicates are avoided:
        LIB.cacheL(generated.pCL, tL.map(createPC));

        return pCL
    }
    function createRC(r: SpecifResource) {
        let iL = LIB.valuesByTitle(r, ["SpecIF:Instantiation"], ontologies);
//        console.debug('insta', iL, iL.map((ins) => { return LIB.displayValueOf(ins, { targetLanguage: 'default' }) }));

        // Create a resourceClass for the TermResourceClass r:
        return Object.assign(
            createItem(r, 'RC-'),
            {
                instantiation: iL.map((ins:SpecifValue) => { return LIB.displayValueOf(ins, { targetLanguage: 'default' }) }),
                isHeading: LIB.isTrue(valueByTitle(r, "SpecIF:isHeading")),
                icon: valueByTitle(r, "SpecIF:Icon"),
                // the references per propertyClass:
                propertyClasses: pCsOf(r)
            }
        ) as SpecifResourceClass;
    }
    function sCsOf(el: SpecifResource, cl: string) {
        // Return a list of resourceClasses and/or statementClasses which are related 
        // to term el (the statementClass to be generated) by the given statementClass cl:

        let sL = statementsByClass(el, cl), // list of statements of the specified class
            iCL: SpecifResourceClass[] = [],  // the result list
            rCL: SpecifResource[] = [];  // list of referenced instances of termResourceClass

        for (let s of sL) {
            // We are interested only in statements where *other* statementClasses are eligible as objectClasses or statementClasses:
            if (el.id == s.subject.id) continue;

            let term = LIB.itemByKey(ontologies.resources, s.subject),
                prep = makeIdAndTitle(term, term['class'].id == "RC-TermResourceClass"? "RC-" : "SC-"); // need the id only, here
//            console.debug('sCsOf', term, LIB.valuesByTitle(term, ["dcterms:identifier"], ontologies));
            LIB.cacheE(iCL, { id: prep.id })

            if (term['class'].id == "RC-TermResourceClass") {
                if (LIB.indexById(generated.rCL, prep.id) < 0)
                    // an entry in the list with the terms describing the referenced resourceClass:
                    LIB.cacheE(rCL, term)
            }
            else {
                // the class is "RC-TermStatementClass":
                if (LIB.indexById(generated.sCL, prep.id) < 0)
                    // an entry in the list with the terms describing the referenced statementClass:
                    LIB.cacheE(required.sTL, term)
            }
        };
//        console.debug('sCsOf', el, sL, iCL,rCL,required.sTL);

        // Ascertain that all referenced resourceClasses will be available.
        // Any missing statementClasses are collected in required.sTL until the end of the generation 
        // ... to avoid infinite recursion, because statementClasses can reference statementClasses.
        // Thus, generate only the referenced resourceClasses immediately;
        // if they exist already due to correct selection, duplicates are avoided:
        LIB.cacheL(generated.rCL, rCL.map(createRC));

        return iCL
    }
    function createSC(r: SpecifResource) {
        // Create a statementClass for the TermStatementClass r:

        let
            iL = LIB.valuesByTitle(r, ["SpecIF:Instantiation"], ontologies),
            // In case of statementClasses a list of propertyClasses is optional and most often not used:
            pCL = pCsOf(r),
            // The eligible subjectClasses:
            sCL = sCsOf(r, "SpecIF:isEligibleAsSubject"),
            // The eligible objectClasses:
            oCL = sCsOf(r, "SpecIF:isEligibleAsObject");
//        console.debug('createSC', r, pCL, sCL, oCL);

        return Object.assign(
            createItem(r, 'SC-'),
            {
                instantiation: iL.map((ins: SpecifValue) => { return LIB.displayValueOf(ins, { targetLanguage: 'default' }) }),
                isUndirected: LIB.isTrue(valueByTitle(r, "SpecIF:isUndirected")),
                icon: valueByTitle(r, "SpecIF:Icon"),
                // the eligible subjectClasses and objectClasses:
                subjectClasses: sCL.length > 0 ? sCL : undefined,
                objectClasses: oCL.length > 0 ? oCL : undefined,
                // the references per propertyClass:
                propertyClasses: pCL.length > 0 ? pCL : undefined
            }
        ) as SpecifDataType;
    }
    function extCOf(el: SpecifResource,pfx:string) {
        // Return a resourceClass resp. statementClass which is related by "SpecIF:isSpecializationOf"
        // to el (the term describing the resourceClass resp. statementClass to be generated):
        if (['RC-', 'SC-'].includes(pfx) ) {

            let sL = statementsByClass(el, "SpecIF:isSpecializationOf");
            if (sL.length > 1) {
                console.warn('Term ' + el.id + ' has more than one extended class; the first found prevails.');
                // see: https://stackoverflow.com/questions/31547315/is-it-an-antipattern-to-set-an-array-length-in-javascript
                sL.length = 1
            };

            // We are interested only in statements where *other* resources resp. statements are the object:
            if (sL.length > 0 && el.id != sL[0].object.id) {
                let term = LIB.itemByKey(ontologies.resources, sL[0].object),
                    prep = makeIdAndTitle(term, pfx); // need the id only, here

                // Ascertain that the referenced resourceClass resp. statementClass will be available;
                // if it exist already due to correct selection, there will be no duplicate:
                switch (pfx) {
                    case 'RC-':
                        LIB.cacheE(generated.rCL, createRC(term));
                        break;
                    case 'SC-':
                        LIB.cacheE(generated.sCL, createSC(term));
                };

                return LIB.makeKey(prep.id)
            }
            // return undefined
        }
        // return undefined
    }
    function createItem(r:SpecifResource, prefix:string) {
        // Create the attributes common to all classes except dataType;
        // - take the resource's title as title
        // - and the title without namespace as distinctive portion of the id.
        let prep = makeIdAndTitle(r, prefix),
            dscL = LIB.valuesByTitle(r, [CONFIG.propClassDesc], ontologies);
        if (dscL.length > 1)
            console.info("Only the fist value of the description property will be used for the class generated from " + r.id + " with title " + prep.title + ".");
        return {
            // Take the specified identifier if available or build one with the title ... :
            id: prep.id,
            revision: valueByTitle(r, "SpecIF:Revision") || r.revision,
            extends: extCOf(r,prefix),
            title: prep.title,
            description: (dscL.length > 0 ? dscL[0] : undefined), // only the first property value is taken for the class description
            changedAt: r.changedAt
        } as SpecifClass;
    }
    function checkConstraintsOntology(dta:SpecIF): boolean {
    /*  Check the following constraints / conventions:
        - Don't generate a class from a deprecated term.
        - A TermPropertyClass has exactly one "SpecIF:hasDataType" statement.
        - A TermResourceClass or TermStatementClass may not have >1 statements with title "SpecIF:isSpecializationOf"
        - Chains of "isSpecializationOf" relations must not be circular.
        - Chains of "isEligibleAsSubject" relations must not be circular.
        - Chains of "isEligibleAsObject" relations must not be circular.
        - ToDo: complete the list ...
    */
        return true
    }
}
