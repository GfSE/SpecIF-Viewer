/*!	SpecIF: Generate Specif classes from the vocabulary.
	Dependencies: -
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	Author: se@enso-managers.de, Berlin
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
    
    The following constraints apply:
    - Don't generate a class from a deprecated term
    - In a set of classes (per domain, but also when multiple domains are combined), there shall not be the same term with different namespaces
    - a TermPropertyClass has exactly one "SpecIF:hasDataType" statement
*/

app.generateSpecifClasses = function(pr: SpecIF, opts?: any): SpecIF {
    console.debug('generateSpecifClasses', pr, opts);
    let localOpts = Object.assign({ SpecIF_LifecycleStatusReleased: true }, opts),
        primitiveDataTypes = new Map([
            ["RC-DataTypeString", SpecifDataTypeEnum.String],
            ["RC-DataTypeBoolean", SpecifDataTypeEnum.Boolean],
            ["RC-DataTypeInteger", SpecifDataTypeEnum.Integer],
            ["RC-DataTypeReal", SpecifDataTypeEnum.Double],
            ["RC-DataTypeTimestamp", SpecifDataTypeEnum.DateTime],
            ["RC-DataTypeDuration", SpecifDataTypeEnum.Duration],
            ["RC-DataTypeAnyURI", SpecifDataTypeEnum.AnyUri],
        ]),
        dTDomains = LIB.itemById(pr.dataTypes, "DT-Domain"),
        allDomains = dTDomains.enumeration.map(
            (v: SpecifEnumeratedValue) => LIB.languageValueOf(v.value, { targetLanguage: "default" })
        ),
        selDomains = allDomains.filter((d: string) => { return opts[d.jsIdOf()] } ),
        prTi = "P-SpecifClasses";

    if (selDomains.length < 1)
        message.show("No domain selected, so no classes will be generated.", { severity: 'warning'});

    // add the domains to the project title:
    selDomains.forEach((d: string) => { prTi += '-' + d.jsIdOf()});

    console.debug('#', dTDomains, allDomains, selDomains, prTi);
    return {
        "id": prTi,
        "$schema": "https://specif.de/v1.1/schema.json",
        "title": [
            {
                "text": "SpecIF Classes"
            }
        ],
        "description": [
            {
                "text": "A set of SpecIF Classes derived from a SpecIF Ontology for the domains ..."
            }
        ],
        "generator": app.title,
        "generatorVersion": CONFIG.appVersion,
        "createdAt": new Date().toISOString(),
        "rights": {
            "title": "Creative Commons 4.0 CC BY-SA",
            "url": "https://creativecommons.org/licenses/by-sa/4.0/"
        },
        "dataTypes": makeClasses("F-DataTypes", Array.from(primitiveDataTypes.keys()), createDT) as SpecifDataType[],
        "propertyClasses": makeClasses("F-TermsPropertyClass", ["RC-TermPropertyClass"], createPC) as SpecifPropertyClass[],
        "resourceClasses": makeClasses("F-TermsResourceClass", ["RC-TermResourceClass"], createRC) as SpecifResourceClass[],
        "statementClasses": makeClasses("F-TermsStatementClass", ["RC-TermStatementClass"], createSC) as SpecifStatementClass[],
        "resources": [],
        "statements": [],
        "files": [],
        "hierarchies": []
    };

    function makeClasses(folderId:string, rCIdL:string[], createFn:Function) {
        // Take the resources listed in the hierarchy only ... and in that sequence:

        // 1. Find the folder with ResourceClass terms:
        let rCL: SpecifItem[] = [],
            idL = containedInFolder(pr.hierarchies, folderId);
        if (idL.length>0) {
            rCL = idL
                .map(
                    // 2. Replace ids by their elements:
                    id => LIB.itemById(pr.resources, id) as SpecifResource
                )
                .filter(
                    // 3. Keep only those with selected domain abd lifecycleStatus:
                    r => keepSelected(r, rCIdL)
                );
            // 4. Create a class per term:
            rCL = LIB.forAll(rCL, createFn);
        };
        return rCL as SpecifItem[];
    }
    function belongsToSelectedDomain(el: SpecifItem):boolean {
        let myDomains = LIB.valuesByTitle(el, [CONFIG.propClassDomain],pr);
        for (var d of myDomains) {
            if (opts[LIB.displayValueOf(d, { targetLanguage: 'default' }).jsIdOf()])
                return true;
        };
        return false;
    }
    function hasSelectedStatus(el: SpecifItem, opts: any): boolean {
        let selStatus = LIB.valuesByTitle(el, [CONFIG.propClassLifecycleStatus], pr);
        for (var s of selStatus) {
            if (opts[LIB.displayValueOf(s, { targetLanguage: 'default' }).jsIdOf()])
                return true;
        };
        return false;
    }
    function isRequired(el: SpecifItem): boolean {
        return false;
    }
    function containedInFolder(h: SpecifNode[], folderId: string): string[] {
        let idL: string[] = [];
        (LIB.iterateNodes(
            h,
            (nd: SpecifNode) => {
                if (nd.resource.id == folderId && nd.nodes && nd.nodes.length>0) {
                    idL = nd.nodes.map(
                        ch => ch.resource.id
                    );
                    return false; // stop iterating
                };
                return true; // continue to iterate
            }
        ))
        return idL;
    }
    function keepSelected(r: SpecifResource, cIdL: string[]): boolean {
        // True, if specified per domain abd lifecycleStatus ..
        // or if it is referenced by another class:
        return cIdL.includes(r['class'].id)  // even though it always should be the case
            && (hasSelectedStatus(r, localOpts) && belongsToSelectedDomain(r)
                || isRequired(r));
    }
    function getStatementsOfClass(r:SpecifResource, clTi:string) {
        // Find the statements of the class with title clTi referencing the given term:
        return pr.statements.filter(
            (st: SpecifStatement) => {
                return LIB.classTitleOf(st['class'], pr.statementClasses) == clTi
                    && st.subject.id == r.id;
            }
        ) as SpecifStatement[];
    }
    function createDT(r: SpecifResource) {
        // Find the "hasDataType" statement for the given propertyClass term:
        let stL = getStatementsOfClass(r, "SpecIF:hasEnumValue"),
            oL = stL.map(
                (st: SpecifStatement) => {
                    return LIB.itemById(pr.resources,st.object.id)
                }
            ),
            enumL = oL.map(
                (o:SpecifResource, idx:number) => {
                    let eV = LIB.valuesByTitle(o, [CONFIG.propClassTitle], pr)[0];
                    return {
                        id: r.id + '-' + idx.toString(),
                        value: eV
                    }
                }
            );
//      console.debug('createDT',r,stL,oL,enumL);
        return Object.assign(
            createItem(r, 'DT-'),
            {
                // add the primitive dataType:
                type: primitiveDataTypes.get(r["class"].id),
                enumeration: enumL.length>0? enumL : undefined
            }
        ) as SpecifDataType;
    }
    function createPC(r: SpecifResource) {
        // Find the "hasDataType" statement for the given propertyClass term:
        let stL = getStatementsOfClass(r, "SpecIF:hasDataType");
        if (stL.length < 1) {
            console.warn("Skipped the propertyClass with id "+r.id+", because it has no data type relation.");
            return;
        };
        if (stL.length > 1)
            console.warn("The propertyClass with id " + r.id + "has more than one data type relation.");

        return Object.assign(
            createItem(r, 'PC-'),
            {
                // add the reference to the dataType:
                dataType: stL[0].object
            }
        ) as SpecifPropertyClass;
    }
    function createRC(r: SpecifResource) {
        return Object.assign(
            createItem(r, 'RC-'),
            {
                // add the references per propertyClass:
                propertyClasses: [{ id: "PC-1" }]
            }
        ) as SpecifResourceClass;
    }
    function createSC(r: SpecifResource) {
//      console.debug('createSC',r);
        return Object.assign(
            createItem(r,'SC-'),
            {
                // add the references per propertyClass:
                propertyClasses: [{ id: "PC-1" }]
                // add the eligible subjectClasses and objectClasses:
            }
        ) as SpecifDataType;
    }
    function createItem(r:SpecifResource,prefix:string) {
        // Create the attributes common to all classes;
        // - take the resource's title as title
        // - and the title without namespace as distinctive portion of the id.
        // ToDo: There is a potential problem - in case of equal terms with different namespace we end up with a duplicate id.
        let ti = LIB.getTitleFromProperties(r.properties, { targetLanguage: 'default' }),
            ti2 = ti.split(':').pop(),  // remove namespace
            dscL = LIB.valuesByTitle(r, [CONFIG.propClassDesc], pr);
        if (dscL.length > 1)
            console.info("Only the fist value of the description property will be used for the class generated from " + r.id + " with title " + ti + ".");
        return {
            id: prefix + (ti2 || r.id).jsIdOf(),
            revision: opts.rev,
            title: ti,
            description: (dscL.length > 0 ? dscL[0] : undefined), // only the first property value is taken for the class description
            changedAt: r.changedAt
        } as SpecifClass;
    }
}
