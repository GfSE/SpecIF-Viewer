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
    let localOpts = Object.assign({ SpecIF_LifecycleStatusReleased: true},opts);
    return {
        "id": "P-SpecifClasses",
        "$schema": "https://specif.de/v1.1/schema.json",
        "title": [
            {
                "text": "SpecIF Classes"
            }
        ],
        "description": [
            {
                "text": "A set of SpecIF Classes derived from a SpecIF Ontology."
            }
        ],
        "generator": app.title,
        "generatorVersion": CONFIG.appVersion,
        "createdAt": new Date().toISOString(),
        "rights": {
            "title": "Creative Commons 4.0 CC BY-SA",
            "url": "https://creativecommons.org/licenses/by-sa/4.0/"
        },
        "dataTypes": makeClasses("F-DataTypes", "RC-DataType", createDT) as SpecifDataType[],
        "propertyClasses": makeClasses("F-TermsPropertyClass", "RC-TermPropertyClass", createPC) as SpecifPropertyClass[],
        "resourceClasses": makeClasses("F-TermsResourceClass", "RC-TermResourceClass", createRC) as SpecifResourceClass[],
        "statementClasses": [],
        "resources": [],
        "statements": [],
        "files": [],
        "hierarchies": []
    };

    function makeClasses(folderId:string, rCId:string, createFn:Function) {
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
                    r => keepSelected(r, rCId)
                );
            // 4. Create a class per term:
            rCL = LIB.forAll(rCL, createFn);
        };
        return rCL as SpecifItem[];
    }
    function belongsToSelectedDomain(el: SpecifItem):boolean {
        let selDomains = LIB.valuesByTitle(el, [CONFIG.propClassDomain],pr);
        for (var d of selDomains) {
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
    function keepSelected(r: SpecifResource, cId: string): boolean {
        // True, if specified per domain abd lifecycleStatus ..
        // or if it is referenced by another class:
        return r['class'].id == cId  // even though it always should be the case
            && (hasSelectedStatus(r, localOpts) && belongsToSelectedDomain(r)
                || isRequired(r));
    }
    function createDT(r: SpecifResource) {
        let ty = LIB.valuesByTitle(r, ["SpecIF:DataType"], pr);
//      console.debug('createDT',r,ty);
        if (ty.length < 1 || !LIB.isMultiLanguageText(ty[0]) ) {
            console.warn("Skipped the dataType with id " + r.id + ", because it has no dataType property.");
            return;
        }
        return Object.assign(
            createItem(r),
            {
                // add the references per propertyClass:
                type: ty[0][0].text  // first value, first language
            }
        ) as SpecifDataType;
    }
    function createPC(r: SpecifResource) {
        // Find the "hasDataType" statement for the given propertyClass term:
        let stL = pr.statements.filter(
            (st: SpecifStatement) => {
                return LIB.classTitleOf(st['class'], pr.statementClasses) == "SpecIF:hasDataType"
                    && st.subject.id == r.id;
            }
        ) as SpecifStatement[];
        if (stL.length < 1) {
            console.warn("Skipped the propertyClass with id "+r.id+", because it has no data type relation.");
            return;
        };
        if (stL.length > 1)
            console.warn("The propertyClass with id " + r.id + "has more than one data type relation.");

        return Object.assign(
            createItem(r),
            {
                // add the reference to the dataType:
                dataType: stL[0].object
            }
        ) as SpecifPropertyClass;
    }
    function createRC(r: SpecifResource) {
        return Object.assign(
            createItem(r),
            {
                // add the references per propertyClass:
                propertyClasses: [{ id: "PC-1" }]
            }
        ) as SpecifResourceClass;
    }
    function createItem(r:SpecifResource) {
        // We take the resource's title as title 
        // and the title without namespace as distinctive portion of the id.
        // ToDo: There is a potential problem - in case of equal terms with different namespace we end up with a duplicate id.
        let ti = LIB.getTitleFromProperties(r.properties, { targetLanguage: 'default' }),
            ti2 = ti.split(':').pop(),  // remove namespace
            dscL = LIB.valuesByTitle(r, [CONFIG.propClassDesc], pr);
        if (dscL.length > 1)
            console.info("Only the fist value of the description property will be used for the class generated from " + r.id + " with title " + ti + ".");
        return {
            id: 'RC-' + (ti2 || r.id).jsIdOf(),
            revision: opts.rev,
            title: ti,
            description: (dscL.length > 0 ? dscL[0] : undefined), // only the first property value is taken for the class description
            changedAt: r.changedAt
        } as SpecifClass;
    }
}
