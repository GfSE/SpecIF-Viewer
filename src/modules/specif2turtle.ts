/*!
    SpecIF to Turtle Transformation
    (C)copyright adesso SE, enso managers gmbh (http://enso-managers.de)
    Author: ??@adesso.de, se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-RDF-Bridge/issues)
*/

/*
########################## Main #########################################

testTransformSpecifToTurtle = (specifData) => {
   return specif2turtle("https://www.example.com",specifData)
};
*/

app.specif2turtle = (specifData:SpecIF,opts:any) => {
    // Assumptions:
    // - specifData is expected in v1.1 format.

    let resultTtlString =
        defineNamespaces(specifData.id, opts)
        + defineSpecifClasses()
        + transformNativeAttributes( specifData )
    //    + transformDatatypes(specifData.dataTypes)
    //    + transformPropertyClasses(specifData.propertyClasses)
        + transformResourceClasses(specifData.resourceClasses)
        + transformStatementClasses(specifData.statementClasses)
        + transformResources(specifData.resources)
        + transformStatements(specifData.statements)
        + transformFiles(specifData.files)
        + transformHierarchies(specifData.hierarchies)
		+ emptyLine();

    return resultTtlString
        // Post processing:
        .replace(/; \./g, '.');

    /*
    ########################## Subroutines #########################################
    */
    function defineNamespaces(projectID: string, opts: any) {
        // ToDo: List only the namespaces actually referenced.
        let pfxL = '';
        for( var [key,val] of app.ontology.namespaces ) {
            pfxL += tier0RdfEntry(`@prefix ${key.replace('.',':')} <${val.url}> .`);
        };
        pfxL += emptyLine()
            + tier0RdfEntry(`@prefix : <${opts.baseURI}${projectID}#> .`);
        return pfxL;

    /*    return tier0RdfEntry(`@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .`)
            + tier0RdfEntry(`@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .`)
            + tier0RdfEntry(`@prefix owl: <http://www.w3.org/2002/07/owl#> .`)
            + tier0RdfEntry(`@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .`)
            + tier0RdfEntry(`@prefix xs: <http://www.w3.org/2001/XMLSchema#> .`)
            + tier0RdfEntry(`@prefix dcterms: <http://purl.org/dc/terms/> .`)
            + tier0RdfEntry(`@prefix dc: <http://purl.org/dc/elements/1.1/> .`)
        //    + tier0RdfEntry(`@prefix vann: <http://purl.org/vocab/vann/> .`)
            + tier0RdfEntry(`@prefix schema: <https://schema.org#> .`)
            + tier0RdfEntry(`@prefix foaf: <http://xmlns.com/foaf/0.1/> .`)
        //    + tier0RdfEntry(`@prefix iana: <http://www.w3.org/ns/iana/media-types/> .`)
            + tier0RdfEntry(`@prefix iana: <https://www.iana.org/assignments/media-types#> .`)
            + emptyLine()

            // ToDo: Get the namespaces from the SpecIF Ontology
            + tier0RdfEntry(`@prefix SpecIF: <http://specif.de/v1.1/schema#> .`)
            + tier0RdfEntry(`@prefix FMC: <http://specif.de/v1.1/schema/fmc#> .`)
            + tier0RdfEntry(`@prefix IREB: <http://specif.de/v1.1/schema/ireb#> .`)
            + tier0RdfEntry(`@prefix oslc: <http://specif.de/v1.1/schema/oslc#> .`)
            + tier0RdfEntry(`@prefix oslc_rm: <http://specif.de/v1.1/schema/oslc_rm#> .`)
            + tier0RdfEntry(`@prefix oslc_cm: <http://specif.de/v1.1/schema/oslc_cm#> .`)
            + tier0RdfEntry(`@prefix ReqIF: <http://specif.de/v1.1/schema/reqif#> .`)
            + tier0RdfEntry(`@prefix ReqIF-WF: <http://specif.de/v1.1/schema/reqif-wf#> .`)
            + tier0RdfEntry(`@prefix HIS: <http://specif.de/v1.1/schema/his#> .`)
            + tier0RdfEntry(`@prefix uml: <http://specif.de/v1.1/schema/uml#> .`)
            + tier0RdfEntry(`@prefix SysML: <http://specif.de/v1.1/schema/sysml#> .`)
            + tier0RdfEntry(`@prefix IR: <http://specif.de/v1.1/schema/ir#> .`)
            + tier0RdfEntry(`@prefix ArchiMate: <http://specif.de/v1.1/schema/archimate#> .`)
            + tier0RdfEntry(`@prefix bpmn: <http://specif.de/v1.1/schema/bpmn#> .`)
            + tier0RdfEntry(`@prefix DDP: <http://www.prostep.org/dictionary/2.0#> .`)
            + tier0RdfEntry(`@prefix W3C: <http://specif.de/v1.1/schema/w3c#> .`)
            + emptyLine()
            + tier0RdfEntry(`@prefix : <${opts.baseURI}${projectID}#> .`)
            + tier0RdfEntry(`@prefix this: <${opts.baseURI}${projectID}#> .`);
        */
    };

    function defineSpecifClasses() {
        // SpecIF:Resource is considered equivalent with rdfs:Resource and is thus skipped
        // SpecIF:Statement is considered equivalent with rdf:Statement and is thus skipped
        return emptyLine()
            + tier0RdfEntry(`W3C:Ontology rdfs:subClassOf rdfs:Resource .`)
            + tier0RdfEntry(`SpecIF:Project rdfs:subClassOf rdfs:Resource .`)
            + tier0RdfEntry(`SpecIF:File rdfs:subClassOf rdfs:Resource .`)
            + tier0RdfEntry(`SpecIF:Glossary rdfs:subClassOf rdfs:Resource .`)
            + tier0RdfEntry(`SpecIF:Node rdfs:subClassOf rdfs:Resource .`)
            + tier0RdfEntry(`SpecIF:HierarchyRoot rdfs:subClassOf SpecIF:Node .`)
    }

    function transformNativeAttributes(project:SpecIF) {
        // ... using the default (first) values of the project title and description.
        let { id ,  title , description , $schema , generator , generatorVersion , rights , createdAt , createdBy } = project;

//        console.debug('turtle transformNativeAttributes',project)
        let baseProjectTtlString = emptyLine()
                + tier0RdfEntry(`: a SpecIF:Project ;`)
                + tier1RdfEntry(`dcterms:identifier '${escapeTtl(id)}' ;`)
                + (title ? tier1RdfEntry(`rdfs:label ${textWithLang(title)} ;`) : '')
                + (description ? tier1RdfEntry(`rdfs:comment ${textWithLang(description)} ;`) : '')
                + tier1RdfEntry(`SpecIF:schema <${$schema}> ;`)
                + (generator? tier1RdfEntry(`SpecIF:generator '${escapeTtl(generator)}' ;`) : '')
                + (generatorVersion? tier1RdfEntry(`SpecIF:generatorVersion '${escapeTtl(generatorVersion)}' ;`) : '');
        if(rights){
            baseProjectTtlString += (rights.title? tier1RdfEntry(`SpecIF:rights-title '${escapeTtl(rights.title)}' ;`) : '')
                + (rights.url? tier1RdfEntry(`SpecIF:rights-url '${escapeTtl(rights.url)}' ;`) : '');
        };
        baseProjectTtlString += (createdAt? tier1RdfEntry(`dcterms:modified '${createdAt}' ;`) : '');
        if(createdBy){
            baseProjectTtlString += (createdBy.familyName? tier1RdfEntry(`SpecIF:createdBy-familyName '${escapeTtl(createdBy.familyName)}' ;`) : '')
                + (createdBy.givenName? tier1RdfEntry(`SpecIF:createdBy-givenName '${escapeTtl(createdBy.givenName)}' ;`) : '')
                + tier1RdfEntry(`SpecIF:createdBy-email '${escapeTtl(createdBy.email)}' ;`)
                + (createdBy.org && createdBy.org.organizationName? tier1RdfEntry(`SpecIF:createdBy-org-organizationName '${escapeTtl(createdBy.org.organizationName)}' ;`) : '');
        };
        baseProjectTtlString += ' .';
        
        return baseProjectTtlString;
    };

    function transformDatatypes(dataTypes: SpecifDataType[]) {
        if (!isArrayWithContent(dataTypes)){
            return '';
        };
    
        let dataTypesTtlString = '';

        dataTypes.forEach( (dataType) => {
		    dataTypesTtlString += emptyLine()
            //    + tier0RdfEntry(`: SpecIF:containsDataTypeMapping :${dataType.id} .`)
            //    + tier0RdfEntry(`:${dataType.id} a SpecIF:DataTypeMapping , owl:Class ;`)
            //    + tier1RdfEntry(`SpecIF:id '${escapeTtl(dataType.id)}' ;`)
                + tier1RdfEntry(`rdfs:label '${escapeTtl(dataType.title)}' ;`)
                // @ts-ignore - the XsDatatype *is* a string
                + tier1RdfEntry(`SpecIF:type '${escapeTtl(dataType.type)}' ; `)
            //    + (dataType.type? tier1RdfEntry(`SpecIF:vocabularyTerm '${escapeTtl(dataType.type)}' ;`) : '')
                + (dataType.maxLength ? tier1RdfEntry(`SpecIF:maxLength '${dataType.maxLength}' ;`) : '')
                + (dataType.minInclusive ? tier1RdfEntry(`SpecIF:minInclusive '${dataType.minInclusive}' ;`) : '')
                + (dataType.maxInclusive ? tier1RdfEntry(`SpecIF:maxInclusive '${dataType.maxInclusive}' ;`) : '')
                + (dataType.fractionDigits ? tier1RdfEntry(`SpecIF:fractionDigits '${dataType.fractionDigits}' ;`) : '')
            //    + (dataType.revision ? tier1RdfEntry(`SpecIF:revision '${dataType.revision}' ;`) : '')
                + tier1RdfEntry(`dcterms:modified '${dataType.changedAt}' ;`)
                + (dataType.changedBy ? tier1RdfEntry(`SpecIF:changedBy '${escapeTtl(dataType.changedBy)}' ;`) : '');

            // @ts-ignore - that's why we are checking for the existence of 'enumeration'
            if(isArrayWithContent(dataType.enumeration)){
                // @ts-ignore - that's why we are checking for the existence of 'enumeration'
                dataType.enumeration.forEach( enumValue => {
                    dataTypesTtlString += emptyLine()
                        + tier0RdfEntry(`:${escapeTtl(enumValue.id)} a :${escapeTtl(dataType.title)} ;`)
                        + tier1RdfEntry(`SpecIF:id '${escapeTtl(enumValue.id)}' ;`)
                        // @ts-ignore - the XsDatatype *is* a string
                        + tier1RdfEntry(`rdfs:label '${escapeTtl(enumValue.value)}' ;`)
                        + ' .';
                });
            };
        });

        return dataTypesTtlString;
    };
 
    function transformPropertyClasses(propertyClasses:SpecifPropertyClass[]) {
        if (!isArrayWithContent(propertyClasses)){
            return '';
        };

        let propertyClassesTtlString = '';
    
        propertyClasses.forEach(propertyClass => {     
            propertyClassesTtlString += emptyLine()
            //    + tier0RdfEntry(`: SpecIF:containsPropertyClassMapping :${propertyClass.id} .`)
            //    + tier0RdfEntry(`:${propertyClass.id} a SpecIF:PropertyClassMapping ;`)
             //   + tier1RdfEntry(`SpecIF:id '${escapeTtl(propertyClass.id)}' ;`)
                + tier1RdfEntry(`rdfs:label '${escapeTtl(propertyClass.title)}' ; `)
                + (propertyClass.description ? tier1RdfEntry(`rdfs:comment ${textWithLang(propertyClass.description)} ;`) : '')
            //    + (title? tier1RdfEntry(`SpecIF:vocabularyTerm ${escapeTtl(title)} ;`) : '')
                + tier1RdfEntry(`SpecIF:dataType '${escapeTtl(propertyClass.dataType.id)}' ;`)
            //    + (propertyClass.revision ? tier1RdfEntry(`SpecIF:revision '${escapeTtl(propertyClass.revision)}' ;`) : '')
                + tier1RdfEntry(`dcterms:modified '${propertyClass.changedAt}' ;`)
                + (propertyClass.changedBy ? tier1RdfEntry(`SpecIF:changedBy '${escapeTtl(propertyClass.changedBy)}' ;`) : '')
                + ' .';
        });
        return propertyClassesTtlString;
    };

    function transformResourceClasses (resourceClasses:SpecifResourceClass[]) {
        if (!isArrayWithContent(resourceClasses)){
            return '';
        };

        let resourceClassesTtlString='';

        resourceClasses.forEach(resourceClass => {
            let superC = resourceClass.extends ? ':'+resourceClass.extends.id : "rdfs:Resource";
            resourceClassesTtlString += emptyLine()
                + tier0RdfEntry(`:${resourceClass.id} rdfs:subClassOf ${superC} ;`)
            //     + tier1RdfEntry(`SpecIF:id '${escapeTtl(id)}' ;`)
                + tier1RdfEntry(`rdfs:label '${escapeTtl(resourceClass.title)}';`)
            //          + (title? tier1RdfEntry(`SpecIF:vocabularyTerm '${escapeTtl(title)}' ;`):'')
                + (resourceClass.description ? tier1RdfEntry(`rdfs:comment ${textWithLang(resourceClass.description)} ;`) : '')
            //    + (resourceClass.description ? tier1RdfEntry(`rdfs:comment '${escapeTtl(resourceClass.description[0].text)}' ;`):'')
                + (resourceClass.icon ? tier1RdfEntry(`SpecIF:icon '${escapeTtl(resourceClass.icon)}' ;`):'')
            //    + (resourceClass.instantiation ? extractRdfFromSpecif(`SpecIF:instantiation`, resourceClass.instantiation) : '')
            //    + (resourceClass.propertyClasses ? extractRdfFromSpecif(`SpecIF:propertyClasses`, resourceClass.propertyClasses) : '')
            //    + (resourceClass.revision ? tier1RdfEntry(`SpecIF:revision '${escapeTtl(resourceClass.revision)}' ;`):'')
                + tier1RdfEntry(`dcterms:modified '${resourceClass.changedAt}' ;`)
                + (resourceClass.changedBy ? tier1RdfEntry(`SpecIF:changedBy '${escapeTtl(resourceClass.changedBy)}' ;`) : '')
                + ' .';
        });

        return resourceClassesTtlString;
    };

    function transformStatementClasses(statementClasses: SpecifStatementClass[]) {
        if (!isArrayWithContent(statementClasses)){
            return '';
        };

        let statementClassesTtlString = '';

        statementClasses.forEach( statementClass => {
            let superC = statementClass.extends ? ':' + statementClass.extends.id : "rdf:Property";
            statementClassesTtlString += emptyLine()
                + tier0RdfEntry(`:${statementClass.id} rdfs:subPropertyOf ${superC} ;`)
              //  + tier0RdfEntry(`SpecIF:id '${escapeTtl(id)}' ;`)
                + tier1RdfEntry(`rdfs:label  '${escapeTtl(statementClass.title)}' ;`)
            //          + (title? tier1RdfEntry(`SpecIF:vocabularyTerm '${escapeTtl(title)}' ;`) : '')
                + (statementClass.description ? tier1RdfEntry(`rdfs:comment ${textWithLang(statementClass.description)} ;`) : '')
            //    + (statementClass.description ? tier1RdfEntry(`rdfs:comment '${escapeTtl(statementClass.description[0].text)}' ;`) : '')
            //    + (statementClass.instantiation ? extractRdfFromSpecif(`SpecIF:instantiation`, statementClass.instantiation) : '')
            //    + (statementClass.subjectClasses ? extractRdfFromSpecif(`SpecIF:subjectClasses`, statementClass.subjectClasses) : '')
            //    + (statementClass.objectClasses ? extractRdfFromSpecif(`SpecIF:objectClasses `, statementClass.objectClasses) : '')
            //   + (revision ? tier1RdfEntry(`SpecIF:revision: '${statementClass.revision}' ;`) : '')
                + tier1RdfEntry(`dcterms:modified '${statementClass.changedAt}' ;`)
                + (statementClass.changedBy ? tier1RdfEntry(`SpecIF:changedBy '${escapeTtl(statementClass.changedBy)}' ;`) : '')
                + ' .';
            });
    
        return statementClassesTtlString;
    };

    function transformProperties(prpL:SpecifProperty[]) {
        let turtleStr = '';
        if (isArrayWithContent(prpL)) {
            prpL.forEach(
                prp => {
                    let pC = LIB.itemByKey(specifData.propertyClasses, prp['class']),
                        dT = LIB.itemByKey(specifData.dataTypes, pC.dataType),
                    //    ti = LIB.titleOf(prp['class'], specifData.propertyClasses),
                    //    ti = LIB.classTitleOf(pC),
                        ti = shapeEntity(escapeTtl(pC.title)),
                        ct = '';

                    // Replace identifiers of enumerated values by their value as defined in the dataType:
                    if (dT.enumeration) {
                        // Replace identifiers of enumerated values by their value as defined in the dataType:
                        // ToDo: Check use of default values
                        // @ts-ignore
                        prp.values = prp.values.map((v) => LIB.itemById(dT.enumeration, v).value);
                    };

                    for (var v of prp.values) {
                        // multiple values in a comma-separated string;
                        // string values should have just a single language (already filtered during export):
                        switch (dT.type) {
                            case XsDataType.String:
                                switch (ti) {
                                    case 'SpecIF:Revision':
                                        // considered literals without language variants in all cases; covered by 'textWithLang()':
                                    case 'rdfs:label':
                                    case 'rdfs:comment':
                                        // considered literals in all cases:
                                        // @ts-ignore - here it *is* a SpecifLanguageText (dataType == "xs:string")
                                        ct += appendVal(ct, textWithLang(v));
                                        break;
                                    default:
                                    /*    // considered an entity or literal without language variants:
                                        // @ts-ignore - here it *is* a SpecifLanguageText (dataType == "xs:string")
                                        let nSp = hasNamespace(v[0].text),
                                            // @ts-ignore - here it *is* a SpecifLanguageText (dataType == "xs:string")
                                            txt = (nSp ? shapeEntity(v[0].text) : "'" + escapeTtl(v[0].text) + "'"); // + (txt && el.language ? "@" + el.language : "") */

                                        // temporarily considered a literal without language variants:
                                        let txt = "'" + escapeTtl(v[0].text) + "'"; // + (txt && el.language ? "@" + el.language : "")
                                        // @ts-ignore - here it *is* a SpecifLanguageText (dataType == "xs:string")
                                        ct += appendVal(ct, txt);
                                };
                                break;
                            default:
                                // Values of all other dataTypes are always literals:
                                // @ts-ignore - here it *is* a string (dataType != "xs:string")
                                ct += appendVal(ct, "'" + v + "'");
                        }
                    };

                    if (ct)
                        //    turtleStr += tier1RdfEntry(`:${prp.class.id} '${escapeTtl(val)}' ;`);
                        turtleStr += tier1RdfEntry(`${ti} ${ct} ;`);
                }
            );
        };
        return turtleStr;

        function appendVal(str: string, val: string) {
            // Separate multiple values by a comma;
            // if a value doesn't have a namespace, it is considered a literal:
            return (str.length == 0 ? "" : " , ") + val
        }
    };

    function transformResources(resources:SpecifResource[]) {
        if (isArrayWithContent(resources)){
            let resourcesTtlString = ''
            resources.forEach( resource => {
                resourcesTtlString += emptyLine()
                    + tier0RdfEntry(`:${resource.id} a :${escapeTtl(resource["class"].id)} ;`)
                    + transformProperties(resource.properties)
                //    + (resource.revision ? tier1RdfEntry(`SpecIF:revision '${resource.revision}' ;`) : '')
                    + tier1RdfEntry(`dcterms:modified '${resource.changedAt}' ;`)
                    + (resource.changedBy ? tier1RdfEntry(`SpecIF:changedBy '${escapeTtl(resource.changedBy)}' ;`) : '')
                    + ' .';
            });
            return resourcesTtlString;
        }
        else
            return '';
    };

    function transformStatements(statements:SpecifStatement[]) {
        if (isArrayWithContent(statements)){
            let statementsTtlString = '';
            statements.forEach( statement => {
                statementsTtlString
                    += emptyLine()
                    + tier0RdfEntry(`:${statement.id} a rdf:Statement ;`)
                    + tier1RdfEntry(`rdf:predicate :${statement['class'].id} ;`)
                    + tier1RdfEntry(`rdf:subject :${statement.subject.id} ;`)
                    + tier1RdfEntry(`rdf:object :${statement.object.id} ;`)
                    + (statement.properties ? transformProperties(statement.properties) : '')
                //    + (statement.revision ? tier1RdfEntry(`SpecIF:revision '${statement.revision}' ;`) : '')
                    + tier1RdfEntry(`dcterms:modified '${statement.changedAt}' ;`)
                    + (statement.changedBy ? tier1RdfEntry(`SpecIF:changedBy '${escapeTtl(statement.changedBy)}' ;`) : '')
                    + ' .';
            });
            return statementsTtlString;
        }
        else
            return '';
    };

    function transformHierarchies(hierarchies: SpecifNodes) {
        if (isArrayWithContent(hierarchies)){
            let hierarchyTtlString = '';
            hierarchies.forEach(node => {
                hierarchyTtlString += transformNode(node, { root: true });
            });
            return hierarchyTtlString;
        }
        else
            return '';
    };

    function transformNode(nd:SpecifNode, opts?:any) {
        let
        //    r = LIB.itemByKey(specifData.resources,nd.resource),
        //    ty = LIB.valueByTitle(r, CONFIG.propClassType, specifData),
            nodeClass = opts && opts.root ? 'SpecIF:HierarchyRoot' : 'SpecIF:Node',
            nodeTtlString = emptyLine()
                    + tier0RdfEntry(`:${nd.id} a ${nodeClass} ;`)
               //     + tier1RdfEntry(`SpecIF:id '${escapeTtl(nd.id)}' ;`)
               //     + (root && ty? tier1RdfEntry(`dcterms:type '${escapeTtl(ty)}' ;`) : '')
                    + (nd.resource ? tier1RdfEntry(`SpecIF:shows :${escapeTtl(nd.resource.id)} ;`) : '')
               //     + (nd.revision ? tier1RdfEntry(`SpecIF:revision '${nd.revision}' ;`) : '')
                    + (nd.changedAt ? tier1RdfEntry(`dcterms:modified '${nd.changedAt}' ;`) : '');
    
        // @ts-ignore - that's why we are checking for the existence of 'nd.nodes'
        if (isArrayWithContent(nd.nodes)){
            let containedNodeTtlString = tier1RdfEntry(`rdf:Seq`);
            // @ts-ignore - that's why we are checking for the existence of 'nd.nodes'
            nd.nodes.forEach( node => {
                containedNodeTtlString += tier2RdfEntry(`:${node.id} ,`);
            });
            nodeTtlString += containedNodeTtlString.replace(/,([^,]*)$/, ';')
                        + ` .`;  

            // @ts-ignore - that's why we are checking for the existence of 'nd.nodes'
            nd.nodes.forEach( node => {
                nodeTtlString += transformNode(node); 
            });
        } else {
            nodeTtlString += ` .`;
        };
        return nodeTtlString;
    };

    function transformFiles(files?:SpecifFile[]) {
        // @ts-ignore - that's why we are checking for the existence of 'files'
        if (isArrayWithContent(files)){
            let filesTtlString = '';
            // @ts-ignore - that's why we are checking for the existence of 'files'
            files.forEach(file => {
                filesTtlString += emptyLine()
                    + tier0RdfEntry(`:${file.id} a SpecIF:File ;`)
                //    + tier1RdfEntry(`SpecIF:id '${file.id}' ;`)
                    + (file.title ? tier1RdfEntry(`rdfs:label '${file.title}' ;`) : '')
                    + (file.type ? tier1RdfEntry(`iana:mediaType '${file.type}' ;`) : '')
                    + tier1RdfEntry(`dcterms:modified '${file.changedAt}' ;`)
                    + ' .';
            });
            return filesTtlString;
        }
        else
            return '';
    };

    /* 
    ########################## Tools #########################################
    */

    function isArrayWithContent(array: any[]) {
        return (Array.isArray(array) && array.length > 0);
    }

    function extractRdfFromSpecif(predicate:string, itemL:any[]) {
        let TtlString = '';
        if(isArrayWithContent(itemL)){
            TtlString = tier1RdfEntry(predicate);
            itemL.forEach( itm => {
                TtlString += tier2RdfEntry(`:${itm} ,`);
            });
            TtlString=TtlString.replace(/,([^,]*)$/, ';');
        };
        return TtlString;
    }

    function tier0RdfEntry(str:string) {
        return `\n${str}`;
    }

    function tier1RdfEntry(str:string) {
        return `\n\t${str}`;
    }

    function tier2RdfEntry(str:string) {
        return `\n\t\t${str}`;
    }
/*
    function tier3RdfEntry(str:string) {
        return `\n\t\t\t${str}`;
    } */

    function emptyLine() {
        return `\n`;
    }

    function escapeTtl(str:string) {
        return str.replace("\\","\\\\").replace(/\\([\s\S])|(')/g, "\\$1$2").replace(/\n/g, "\\n");
    }

    function hasNamespace(str: string) {
        return RE.Namespace.test(str)
    }
/*
    function textWithLang(vL: SpecifLanguageText[]) {
        let txt = escapeTtl(vL[0]['text']),
            // ToDo: If a description text begins with a term including a namespace, the whole text is considered as such. Solve the issue.
            // ToDo: There is a similar issue with revision values such as '1.1'.
            // Idea: Check whether the namespace has been declared (case-sensitive) - this may help in some, certainly not in all cases.
            // Idea: We may restrict labels/titels and comments/descriptions to literal values, but this may be too restrictive.
            nSp = hasNamespace(txt);
        return (nSp ? shapeEntity(txt) : "'" + txt + "'") /* + (txt && el.language ? "@" + el.language : "") * /;
    } */

    function textWithLang(vL: SpecifLanguageText[]) {
        // here it is assumed that the languageValues are rdf literals: 
        let txt = escapeTtl(vL[0]['text']);
        return "'" + txt + "'" /* + (txt && el.language ? "@" + el.language : "") */;
    }

    function shapeEntity(str: string) {
        // Shape a name so that it corresponds to RDF syntax.
        let tkn = "_4_7_1_1_",
            nSp = false; // has nameSpace
        str = str
            // In SpecIF, a namespace may be separated by ':' or '.', so mark the first occurrence with tkn:
            // @ts-ignore - 'match' not used, but must anyways be declared
            .replace(RE.Namespace, (match, $1, $2) => { nSp = true; return $1 + tkn + $2 })
            // Replace any spaces and other non-word characters by a hyphen:
            .replace(/[\W]/g, "-")
            // @ts-ignore - 'match' not used, but must anyways be declared
            .replace(new RegExp(tkn + "(\\w)"), (match, $1) => { return ":" + $1 });
        // Add any name without namespace to the local namespace:
        return (nSp ? str : ":" + str);

        /*    // Replace first '.' by ':' (for example in 'ReqIF.Name'), as Turtle allows only namespaces with ':'
            // @ts-ignore - 'match' not used, but must anyways be declared
            .replace(/(\w)\.(\w)/, (match, $1, $2) => { return $1 + ":" + $2 })  // temporary hack

            // Replace all other '.' by '-' 
            // @ts-ignore - 'match' not used, but must anyways be declared
            .replace(/(\w)\.(\w)/g, (match, $1, $2) => { return $1 + "-" + $2 })  // temporary hack */

    }

};
