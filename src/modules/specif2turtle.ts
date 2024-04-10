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
   return transformSpecifToTurtle("https://www.example.com",specifData)
};
*/

let transformSpecifToTurtle = (baseUri:string, specifData:SpecIF) => {
    // Assumptions:
    // - specifData is expected in v1.1 format.

    let resultTtlString =
        defineNamespaces(baseUri, specifData.id)
        + defineSpecifClasses()
        + transformNativeAttributes( specifData )
    //    + transformDatatypes(specifData.dataTypes)
    //    + transformPropertyClasses(specifData.propertyClasses)
    //    + transformResourceClasses(specifData.resourceClasses)
    //    + transformStatementClasses(specifData.statementClasses)
        + transformResources(specifData.resources)
        + transformStatements(specifData.statements)
        + transformFiles(specifData.files)
        + transformHierarchies(specifData.hierarchies)
		+ emptyLine();

    return resultTtlString
        // Post processing:
        .replace(new RegExp(CONFIG.propClassTitle, 'g'), 'rdfs:label')  // temporary hack
        .replace(new RegExp(CONFIG.propClassTerm, 'g'), 'rdfs:label')  // temporary hack
        .replace(new RegExp(CONFIG.propClassDesc, 'g'), 'rdfs:comment')  // temporary hack
        .replace(/; \./g, '.');

    /*
    ########################## Subroutines #########################################
    */
    function defineNamespaces(baseUri: string, projectID: string) {
        return tier0RdfEntry(`@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .`)
            + tier0RdfEntry(`@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .`)
        //    + tier0RdfEntry(`@prefix owl: <http://www.w3.org/2002/07/owl#> .`)
            + tier0RdfEntry(`@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .`)
            + tier0RdfEntry(`@prefix xs: <http://www.w3.org/2001/XMLSchema#> .`)
            + tier0RdfEntry(`@prefix dcterms: <http://purl.org/dc/terms/> .`)
        //    + tier0RdfEntry(`@prefix vann: <http://purl.org/vocab/vann/> .`)
            + tier0RdfEntry(`@prefix foaf: <http://xmlns.com/foaf/0.1/> .`)
        //    + tier0RdfEntry(`@prefix iana: <http://www.w3.org/ns/iana/media-types/> .`)
            + tier0RdfEntry(`@prefix iana: <https://www.iana.org/assignments/media-types#> .`)
            + emptyLine()
            + tier0RdfEntry(`@prefix SpecIF: <http://specif.de/v1.1/schema#> .`)
            + tier0RdfEntry(`@prefix FMC: <http://specif.de/v1.1/schema/fmc#> .`)
            + tier0RdfEntry(`@prefix IREB: <http://specif.de/v1.1/schema/ireb#> .`)
            + tier0RdfEntry(`@prefix oslc: <http://specif.de/v1.1/schema/oslc#> .`)
            + tier0RdfEntry(`@prefix oslc_rm: <http://specif.de/v1.1/schema/oslc_rm#> .`)
            + tier0RdfEntry(`@prefix ReqIF: <http://specif.de/v1.1/schema/reqif#> .`)
            + tier0RdfEntry(`@prefix ReqIF-WF: <http://specif.de/v1.1/schema/reqif-wf#> .`)
         //   + tier0RdfEntry(`@prefix HIS: <http://specif.de/v1.1/schema/HIS#> .`)
            + tier0RdfEntry(`@prefix SysML: <http://specif.de/v1.1/schema/sysml#> .`)
            + tier0RdfEntry(`@prefix BPMN: <http://specif.de/v1.1/schema/bpmn#> .`)
            + tier0RdfEntry(`@prefix DDP: <http://www.prostep.org/dictionary/2.0#> .`)
            + tier0RdfEntry(`@prefix W3C: <http://specif.de/v1.1/schema/w3c#> .`)
            + emptyLine()
            + tier0RdfEntry(`@prefix : <${baseUri}${projectID}#> .`)
            + tier0RdfEntry(`@prefix this: <${baseUri}${projectID}#> .`);
    };

    function defineSpecifClasses() {
        return emptyLine()
            + tier0RdfEntry(`W3C:Ontology rdfs:subClassOf rdfs:Resource .`)
            + tier0RdfEntry(`SpecIF:Project rdfs:subClassOf rdfs:Resource .`)
            + tier0RdfEntry(`SpecIF:Glossary rdfs:subClassOf rdfs:Resource .`)
            + tier0RdfEntry(`SpecIF:Node rdfs:subClassOf rdfs:Resource .`)
            + tier0RdfEntry(`SpecIF:HierarchyRoot rdfs:subClassOf SpecIF:Node .`)
    }

    function transformNativeAttributes(project:SpecIF) {
        // ... using the default (first) values of the project title and description.
        let { id ,  title , description , $schema , generator , generatorVersion , rights , createdAt , createdBy } = project;

        console.debug('turtle transformNativeAttributes',project)
        let baseProjectTtlString = emptyLine()
                + tier0RdfEntry(`this: a SpecIF:Project ;`)
                + tier1RdfEntry(`dcterms:identifier '${escapeTtl(id)}' ;`)
                + (title? tier1RdfEntry(`rdfs:label '${escapeTtl(title[0].text)}' ;`) : '')
                + (description ? tier1RdfEntry(`rdfs:comment '${escapeTtl(textWithLang(description[0]))}' ;`) : '')
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
                + tier0RdfEntry(`this: SpecIF:containsDataTypeMapping :${dataType.id} .`)
                + tier0RdfEntry(`:${dataType.id} a SpecIF:DataTypeMapping , owl:Class ;`)
                + tier1RdfEntry(`SpecIF:id '${escapeTtl(dataType.id)}' ;`)
                + (dataType.title ? tier1RdfEntry(`rdfs:label '${escapeTtl(dataType.title)}' ;`) : '')
                + (dataType.type ? tier1RdfEntry(`SpecIF:type '${escapeTtl(dataType.type)}' ; `) : '')
            //          + (dataType.type? tier1RdfEntry(`SpecIF:vocabularyTerm '${escapeTtl(dataType.type)}' ;`) : '')
                + (dataType.maxLength ? tier1RdfEntry(`SpecIF:maxLength '${dataType.maxLength}' ;`) : '')
                + (dataType.minInclusive ? tier1RdfEntry(`SpecIF:minInclusive '${dataType.minInclusive}' ;`) : '')
                + (dataType.maxInclusive ? tier1RdfEntry(`SpecIF:maxInclusive '${dataType.maxInclusive}' ;`) : '')
                + (dataType.fractionDigits ? tier1RdfEntry(`SpecIF:fractionDigits '${dataType.fractionDigits}' ;`) : '')
                + (dataType.revision ? tier1RdfEntry(`SpecIF:revision '${dataType.revision}' ;`) : '')
                + tier1RdfEntry(`dcterms:modified '${escapeTtl(dataType.changedAt)}' ;`)
                + (dataType.changedBy ? tier1RdfEntry(`SpecIF:changedBy '${escapeTtl(dataType.changedBy)}' ;`) : '');
                        + ' .';

            // @ts-ignore - that's why we are checking for the existence of 'enumeration'
            if(isArrayWithContent(dataType.enumeration)){
                // @ts-ignore - that's why we are checking for the existence of 'enumeration'
                dataType.enumeration.forEach( enumValue => {
                    dataTypesTtlString += emptyLine()
                                + tier0RdfEntry(`:${escapeTtl(enumValue.id)} a :${escapeTtl(dataType.title)} ;`)
                                + tier1RdfEntry(`SpecIF:id '${escapeTtl(enumValue.id)}' ;`)
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
            let {id , title , dataType , revision , changedAt} = propertyClass;   
            propertyClassesTtlString += emptyLine()
                        + tier0RdfEntry(`this: SpecIF:containsPropertyClassMapping :${id} .`)
                        + tier0RdfEntry(`:${id} a SpecIF:PropertyClassMapping ;`)
                        + tier1RdfEntry(`SpecIF:id '${escapeTtl(id)}' ;`)
                        + (title? tier1RdfEntry(`rdfs:label '${escapeTtl(title)}' ; `) : '')
            //          + (title? tier1RdfEntry(`SpecIF:vocabularyTerm ${escapeTtl(title)} ;`) : '')
                        + tier1RdfEntry(`SpecIF:dataType '${escapeTtl(dataType.id)}' ;`)
                        + (revision? tier1RdfEntry(`SpecIF:revision '${escapeTtl(revision)}' ;`) : '')
                        + tier1RdfEntry(`dcterms:modified '${escapeTtl(changedAt)}' ;`)
                        + (changedBy ? tier1RdfEntry(`SpecIF:changedBy '${escapeTtl(changedBy)}' ;`) : '');
                        + ' .';
        });
        return propertyClassesTtlString;
    };

    function transformResourceClasses (resourceClasses:SpecifResourceClass[]) {
        if (!isArrayWithContent(resourceClasses)){
            return '';
        };

        let resourceClassesTtlString='';

        resourceClasses.forEach( resourceClass => {
            let {id , title , description , icon , instantiation , changedAt , revision , propertyClasses} = resourceClass;
            resourceClassesTtlString += emptyLine()
                        + tier0RdfEntry(`this: SpecIF:containsResourceClassMapping :${id} .`)
                        + tier0RdfEntry(`:${id} a SpecIF:ResourceClassMapping ;`)
                        + tier1RdfEntry(`SpecIF:id '${escapeTtl(id)}' ;`)
                        + (title? tier1RdfEntry(`rdfs:label '${escapeTtl(title)}';`):'')
            //          + (title? tier1RdfEntry(`SpecIF:vocabularyTerm '${escapeTtl(title)}' ;`):'')
                        + (description? tier1RdfEntry(`rdfs:comment '${escapeTtl(description[0].text)}' ;`):'')
                        + (icon? tier1RdfEntry(`SpecIF:icon '${escapeTtl(icon)}' ;`):'')
                        + (instantiation ? extractRdfFromSpecif(`SpecIF:instantiation`, instantiation) : '')
                        + (propertyClasses ? extractRdfFromSpecif(`SpecIF:propertyClasses`, propertyClasses) : '')
                        + (revision? tier1RdfEntry(`SpecIF:revision '${escapeTtl(revision)}' ;`):'')
                        + tier1RdfEntry(`dcterms:modified '${escapeTtl(changedAt)}' ;`)
                        + (changedBy ? tier1RdfEntry(`SpecIF:changedBy '${escapeTtl(changedBy)}' ;`) : '');
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
            let {id , title , description , revision , changedAt , instantiation , subjectClasses , objectClasses} = statementClass;
            statementClassesTtlString += emptyLine()
                        + tier0RdfEntry(`this: SpecIF:containsStatementClassMapping :${id} .`)
                        + tier0RdfEntry(`:${id} a SpecIF:StatementClassMapping ;`)
                        + tier0RdfEntry(`SpecIF:id '${escapeTtl(id)}' ;`)
                        + (title? tier1RdfEntry(`rdfs:label  '${escapeTtl(title)}' ;`) : '')
            //          + (title? tier1RdfEntry(`SpecIF:vocabularyTerm '${escapeTtl(title)}' ;`) : '')
                        + (description? tier1RdfEntry(`rdfs:comment '${escapeTtl(description[0].text)}' ;`) : '')
                        + (instantiation? extractRdfFromSpecif(`SpecIF:instantiation`,instantiation) : '')
                        + (subjectClasses? extractRdfFromSpecif(`SpecIF:subjectClasses`,subjectClasses) : '')
                        + (objectClasses? extractRdfFromSpecif(`SpecIF:objectClasses `,objectClasses) : '')
                        + (revision ? tier1RdfEntry(`SpecIF:revision: '${revision}' ;`) : '')
                        + tier1RdfEntry(`dcterms:modified '${escapeTtl(changedAt)}' ;`)
                        + (changedBy ? tier1RdfEntry(`SpecIF:changedBy '${escapeTtl(changedBy)}' ;`) : '');
                        + ' .';
            });
    
        return statementClassesTtlString;
    };

    function transformProperties(prpL:SpecifPropertyClass[]) {
        let turtleStr = '';
        if (isArrayWithContent(prpL)) {
            prpL.forEach(
                prp => {
                    let pC = LIB.itemByKey(specifData.propertyClasses, prp['class']),
                        dT = LIB.itemByKey(specifData.dataTypes, pC.dataType),
                    //    ti = LIB.titleOf(prp['class'], specifData.propertyClasses),
                    //    ti = LIB.classTitleOf(pC),
                        ti = shapeName(pC.title),
                        ct = '';
                    if (dT.enumeration) {
                        // from toOxml:
                        for (var v of prp.values) {
                            // multiple values in a comma-separated string;
                            // string values should have just a single language (already filtered during export):
                            switch (dT.type) {
                                case "xs:string":
                                //   ct += val2str(LIB.itemById(dT.enumeration, v).value[0]['text'] + (value[0].language ? '@' + value[0].language : ""));
                                    ct += val2str( ct, textWithLang( LIB.itemById(dT.enumeration, v).value[0] ) );
                                    break;
                                default:
                                    ct += val2str( ct, escapeTtl(LIB.itemById(dT.enumeration, v).value) );
                            }
                        };
                    }
                    else {
                    //    ct = prp.values[0][0] && prp.values[0][0].text || prp.values[0];
                        for (var v of prp.values) {
                            // multiple values in a comma-separated string;
                            // string values should have just a single language (already filtered during export):
                            switch (dT.type) {
                                case "xs:string":
                                //    ct += val2str(v[0]['text'] + (v[0].language ? '@' + v[0].language : ""));
                                    // @ts-ignore - here it *is* a SpecifLanguageText (dataType == "xs:string")
                                    ct += val2str( ct, textWithLang( v[0] ) );
                                    break;
                                default:
                                    // @ts-ignore - here it *is* a string (dataType != "xs:string")
                                    ct += val2str( ct, escapeTtl(v));
                            }
                        };
                    };
                    if (ct)
                        //    turtleStr += tier1RdfEntry(`:${prp.class.id} '${escapeTtl(val)}' ;`);
                        turtleStr += tier1RdfEntry(`${escapeTtl(ti)} ${ct} ;`);
                }
            );
        };
        return turtleStr;

        function val2str(str:string,val:string) {
            return (str.length == 0 ? "" : " , ") + "'" + val + "'"
        }
    };

    function transformResources(resources:SpecifResource[]) {
        if (isArrayWithContent(resources)){
            let resourcesTtlString = ''
            resources.forEach( resource => {
                resourcesTtlString
                    += emptyLine()
                    + tier0RdfEntry(`:${resource.id} a rdfs:Resource ;`)
                //    + tier1RdfEntry(`SpecIF:PropertyClassMapping '${escapeTtl(resourceClass.id)}' ;`)
                    + transformProperties(resource.properties)
                    + (resource.revision ? tier1RdfEntry(`SpecIF:revision '${resource.revision}' ;`) : '')
                    + tier1RdfEntry(`dcterms:modified '${escapeTtl(resource.changedAt)}' ;`)
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
                let ti = LIB.classTitleOf(statement['class'], specifData.statementClasses);
                statementsTtlString
                    += emptyLine()
                    + tier0RdfEntry(`:${statement.id} a rdf:Statement ;`)
                //    + tier1RdfEntry(`rdf:predicate :${statement['class'].id} ;`)
                    + tier1RdfEntry(`rdf:predicate '${escapeTtl(ti)}' ;`)
                    // @ts-ignore - that's why we are checking for the existence of 'properties'
                    + (statement.properties ? transformProperties(statement.properties) : '')
                    + tier1RdfEntry(`rdf:subject :${statement.subject.id} ;`)
                    + tier1RdfEntry(`rdf:object :${statement.object.id} ;`)
                    + (statement.revision ? tier1RdfEntry(`SpecIF:revision '${statement.revision}' ;`) : '')
                    + tier1RdfEntry(`dcterms:modified '${escapeTtl(statement.changedAt)}' ;`)
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
            nodeTtlString =
                    emptyLine()
                    + tier0RdfEntry(`:${nd.id} a ${nodeClass} ;`)
               //     + tier1RdfEntry(`SpecIF:id '${escapeTtl(nd.id)}' ;`)
               //     + (root && ty? tier1RdfEntry(`dcterms:type '${escapeTtl(ty)}' ;`) : '')
                    + (nd.resource ? tier1RdfEntry(`SpecIF:shows '${escapeTtl(nd.resource.id)}' ;`) : '')
                    + (nd.revision ? tier1RdfEntry(`SpecIF:revision '${nd.revision}' ;`) : '')
                    + (nd.changedAt ? tier1RdfEntry(`dcterms:modified '${escapeTtl(nd.changedAt)}' ;`) : '');
    
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
                filesTtlString +=
                    emptyLine()
                    + tier0RdfEntry(`:${file.id} a SpecIF:File ;`)
                    + tier1RdfEntry(`SpecIF:id '${file.id}' ;`)
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

    function textWithLang(el:SpecifLanguageText) {
        // el is a SpecifLanguageText
        return escapeTtl(el['text']) /* + (el['text'] && el.language ? "@" + el.language : "") */;
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

/*    function tier3RdfEntry(str:string) {
        return `\n\t\t\t${str}`;
    } */

    function emptyLine() {
        return `\n`;
    }

    function escapeTtl(str:string) {
        return str.replace("\\","\\\\").replace(/\\([\s\S])|(')/g, "\\$1$2").replace(/\n/g, "\\n");
    }

    function shapeName(str: string) {
        let tkn = "_4_7_1_1_",
            nSp = false;
        str = str
            // In SpecIF, a namespace may be separated by ':' or '.', so mark the first occurrence with tkn:
            // @ts-ignore - 'match' not used, but must anyways be declared
            .replace(/(\w)[.:](\w)/, (match, $1, $2) => { nSp = true; return $1 + tkn + $2 })
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
