/*!
    SpecIF to Turtle Transformation
    (C)copyright adesso SE, enso managers gmbh (http://www.enso-managers.de)
    Author: ??@adesso.de, se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-RDF-Bridge/issues)
*/

/*
########################## Main #########################################
*/
testTransformSpecifToTTL = (specifData) => {
   return transformSpecifToTTL("https://www.example.com",specifData)
};

transformSpecifToTTL = (baseUri, specifData) => {
    let {id,dataTypes,propertyClasses,resourceClasses,statementClasses,resources,statements,hierarchies,files} = specifData;
    let projectID = id;
    let resultTtlString = defineTurtleVocabulary(baseUri, projectID)
                + transformProjectBaseInformations( specifData )
                + transformDatatypes(dataTypes)
                + transformPropertyClasses(propertyClasses)
                + transformResourceClasses(resourceClasses)
                + transformStatementClasses(statementClasses)
                + transformResources(resources)
                + transformStatements(statements)
                + transformHierarchies(hierarchies)
                + transformFiles(files)
				+ emptyLine();

    return resultTtlString;

    /*
    ########################## Subroutines #########################################
    */
    function defineTurtleVocabulary(baseUri, projectID) {
        let TtlString = tier0RdfEntry(`@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .`)
                    + tier0RdfEntry(`@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .`)
                    + tier0RdfEntry(`@prefix foaf: <http://xmlns.com/foaf/0.1/> .`)
                    + tier0RdfEntry(`@prefix owl: <http://www.w3.org/2002/07/owl#> .`)
                    + tier0RdfEntry(`@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .`)
                    + tier0RdfEntry(`@prefix xs: <http://www.w3.org/2001/XMLSchema#> .`)
                    + tier0RdfEntry(`@prefix dcterms: <http://purl.org/dc/terms/> .`)
                    + tier0RdfEntry(`@prefix vann: <http://purl.org/vocab/vann/> .`)
                    + tier0RdfEntry(`@prefix foaf: <http://xmlns.com/foaf/0.1/> .`)
                    + emptyLine()
                    + tier0RdfEntry(`@prefix meta: <http://specif.de/v1.0/schema/meta#> .`)
                    + tier0RdfEntry(`@prefix SpecIF: <http://specif.de/v1.0/schema/core#> .`)
                    + tier0RdfEntry(`@prefix FMC: <http://specif.de/v1.0/schema/fmc#> .`)
                    + tier0RdfEntry(`@prefix IREB: <http://specif.de/v1.0/schema/ireb#> .`)
                    + tier0RdfEntry(`@prefix SysML: <http://specif.de/v1.0/schema/sysml#> .`)
                    + tier0RdfEntry(`@prefix oslc: <http://specif.de/v1.0/schema/oslc#> .`)
                    + tier0RdfEntry(`@prefix oslc_rm: <http://specif.de/v1.0/schema/oslc_rm#> .`)
                    + tier0RdfEntry(`@prefix HIS: <http://specif.de/v1.0/schema/HIS#> .`)
                    + tier0RdfEntry(`@prefix BPMN: <http://specif.de/v1.0/schema/bpmn#> .`)
                    + emptyLine()
                    + tier0RdfEntry(`@prefix : <${baseUri}/${projectID}/> .`)
                    + tier0RdfEntry(`@prefix this: <${baseUri}/${projectID}/> .`);
    
        return TtlString;
    };

    function transformProjectBaseInformations(project) {
        let { id ,  title , description , $schema , generator , generatorVersion , rights , createdAt , createdBy } = project;

        let baseProjectTtlString = emptyLine()
                    + tier0RdfEntry(`this: a meta:Document ;`)
                    + tier1RdfEntry(`meta:id '${escapeSpecialCharaters(id)}' ;`)
                    + (title? tier1RdfEntry(`rdfs:label '${escapeSpecialCharaters(title)}' ;`) : '')
                    + (description? tier1RdfEntry(`rdfs:comment '${escapeSpecialCharaters(description)}' ;`) : '')
                    + tier1RdfEntry(`meta:schema <${$schema}> ;`)
                    + (generator? tier1RdfEntry(`meta:generator '${escapeSpecialCharaters(generator)}' ;`) : '')
                    + (generatorVersion? tier1RdfEntry(`meta:generatorVersion '${escapeSpecialCharaters(generatorVersion)}' ;`) : '');
        if(rights){
            baseProjectTtlString += (rights.title? tier1RdfEntry(`meta:rights-title '${escapeSpecialCharaters(rights.title)}' ;`) : '')
                        + (rights.type? tier1RdfEntry(`meta:rights-type '${escapeSpecialCharaters(rights.type)}' ;`) : '')
                        + (rights.url? tier1RdfEntry(`meta:rights-url '${escapeSpecialCharaters(rights.url)}' ;`) : '');
        };
        baseProjectTtlString += (createdAt? tier1RdfEntry(`dcterms:modified '${createdAt}' ;`) : '');
        if(createdBy){
            baseProjectTtlString += (createdBy.familyName? tier1RdfEntry(`meta:createdBy-familyName '${escapeSpecialCharaters(createdBy.familyName)}' ;`) : '')
                        + (createdBy.givenName? tier1RdfEntry(`meta:createdBy-givenName '${escapeSpecialCharaters(createdBy.givenName)}' ;`) : '')
                        + (createdBy.email.value? tier1RdfEntry(`meta:createdBy-email '${escapeSpecialCharaters(createdBy.email.value)}' ;`) : '')
                        + (createdBy.org.organizationName? tier1RdfEntry(`meta:createdBy-org-organizationName '${escapeSpecialCharaters(createdBy.org.organizationName)}' ;`) : '');
        };
        baseProjectTtlString += ' .';
        
        return baseProjectTtlString;
    };

    function transformDatatypes(dataTypes) {
        if (!isArrayWithContent(dataTypes)){
            return '';
        };
    
        let dataTypesTtlString = '';

        dataTypes.forEach( dataType => {
            let {id , title , type , revision , maxLength , fractionDigits , minInclusive , maxInclusive , changedAt} = dataType;
		    dataTypesTtlString += emptyLine()
                        + tier0RdfEntry(`this: meta:containsDataTypeMapping :${id} .`)
                        + tier0RdfEntry(`:${id} a meta:DataTypeMapping , owl:Class ;`)
                        + tier1RdfEntry(`meta:id '${escapeSpecialCharaters(id)}' ;`)
                        + (title? tier1RdfEntry(`rdfs:label '${escapeSpecialCharaters(title)}' ;`) : '')
                        + (type? tier1RdfEntry(`meta:type '${escapeSpecialCharaters(type)}' ; `) : '')
            //          + (type? tier1RdfEntry(`meta:vocabularyElement '${escapeSpecialCharaters(type)}' ;`) : '')
                        + (revision? tier1RdfEntry(`meta:revision '${revision}' ;`) : '')
                        + (maxLength? tier1RdfEntry(`meta:maxLength '${maxLength}' ;`) : '')
                        + (fractionDigits? tier1RdfEntry(`meta:fractionDigits '${fractionDigits}' ;`) : '')
                        + (minInclusive? tier1RdfEntry(`meta:minInclusive '${minInclusive}' ;`) : '')
                        + (maxInclusive? tier1RdfEntry(`meta:maxInclusive '${maxInclusive}' ;`) : '')
                        + tier1RdfEntry(`dcterms:modified '${escapeSpecialCharaters(changedAt)}' ;`)
                        + ' .';

            if(isArrayWithContent(dataType.values)){
                dataType.values.forEach( enumValue => {
                    dataTypesTtlString += emptyLine()
                                + tier0RdfEntry(`:${escapeSpecialCharaters(enumValue.id)} a :${escapeSpecialCharaters(dataType.title)} ;`)
                                + tier1RdfEntry(`meta:id '${escapeSpecialCharaters(enumValue.id)}' ;`)
                                + tier1RdfEntry(`rdfs:label '${escapeSpecialCharaters(enumValue.value)}' ;`)
                                + ' .';
                });
            };
        });

        return dataTypesTtlString;
    };
 
    function transformPropertyClasses(propertyClasses) {
        if (!isArrayWithContent(propertyClasses)){
            return '';
        };

        let propertyClassesTtlString = '';
    
        propertyClasses.forEach(propertyClass => {     
            let {id , title , dataType , revision , changedAt} = propertyClass;   
            propertyClassesTtlString += emptyLine()
                        + tier0RdfEntry(`this: meta:containsPropertyClassMapping :${id} .`)
                        + tier0RdfEntry(`:${id} a meta:PropertyClassMapping ;`)
                        + tier1RdfEntry(`meta:id '${escapeSpecialCharaters(id)}' ;`)
                        + (title? tier1RdfEntry(`rdfs:label '${escapeSpecialCharaters(title)}' ; `) : '')
            //          + (title? tier1RdfEntry(`meta:vocabularyElement ${escapeSpecialCharaters(title)} ;`) : '')
                        + tier1RdfEntry(`meta:dataType '${escapeSpecialCharaters(dataType)}' ;`)
                        + (revision? tier1RdfEntry(`meta:revision '${escapeSpecialCharaters(revision)}' ;`) : '')
                        + tier1RdfEntry(`dcterms:modified '${escapeSpecialCharaters(changedAt)}' ;`)
                        + ' .';
        });
        return propertyClassesTtlString;
    };

    function transformResourceClasses (resourceClasses) {
        if (!isArrayWithContent(resourceClasses)){
            return '';
        };

        let resourceClassesTtlString='';

        resourceClasses.forEach( resourceClass => {
            let {id , title , description , icon , instantiation , changedAt , revision , propertyClasses} = resourceClass;
            resourceClassesTtlString += emptyLine()
                        + tier0RdfEntry(`this: meta:containsResourceClassMapping :${id} .`)
                        + tier0RdfEntry(`:${id} a meta:ResourceClassMapping ;`)
                        + tier1RdfEntry(`meta:id '${escapeSpecialCharaters(id)}' ;`)
                        + (title? tier1RdfEntry(`rdfs:label '${escapeSpecialCharaters(title)}';`):'')
            //          + (title? tier1RdfEntry(`meta:vocabularyElement '${escapeSpecialCharaters(title)}' ;`):'')
                        + (description? tier1RdfEntry(`rdfs:comment '${escapeSpecialCharaters(description)}' ;`):'')
                        + (icon? tier1RdfEntry(`meta:icon '${escapeSpecialCharaters(icon)}' ;`):'')
                        + tier1RdfEntry(`dcterms:modified '${escapeSpecialCharaters(changedAt)}' ;`)
                        + (revision? tier1RdfEntry(`meta:revision '${escapeSpecialCharaters(revision)}' ;`):'')
                        + (instantiation? extractRdfFromSpecif(`meta:instantiation`,instantiation) : '')
                        + (propertyClasses? extractRdfFromSpecif(`meta:propertyClasses`,propertyClasses) : '')
                        + ' .';
        });

        return resourceClassesTtlString;
    };

    function transformStatementClasses (statementClasses) {
        if (!isArrayWithContent(statementClasses)){
            return '';
        };

        let statementClassesTtlString = '';

        statementClasses.forEach( statementClass => {
            let {id , title , description , revision , changedAt , instantiation , subjectClasses , objectClasses} = statementClass;
            statementClassesTtlString += emptyLine()
                        + tier0RdfEntry(`this: meta:containsStatementClassMapping :${id} .`)
                        + tier0RdfEntry(`:${id} a meta:StatementClassMapping ;`)
                        + tier0RdfEntry(`meta:id '${escapeSpecialCharaters(id)}' ;`)
                        + (title? tier1RdfEntry(`rdfs:label  '${escapeSpecialCharaters(title)}' ;`) : '')
            //          + (title? tier1RdfEntry(`meta:vocabularyElement '${escapeSpecialCharaters(title)}' ;`) : '')
                        + (description? tier1RdfEntry(`rdfs:comment '${escapeSpecialCharaters(description)}' ;`) : '')
                        + (revision? tier1RdfEntry(`meta:revision: '${revision}' ;`) : '')
                        + tier1RdfEntry(`dcterms:modified '${escapeSpecialCharaters(changedAt)}' ;`)
                        + (instantiation? extractRdfFromSpecif(`meta:instantiation`,instantiation) : '')
                        + (subjectClasses? extractRdfFromSpecif(`meta:subjectClasses`,subjectClasses) : '')
                        + (objectClasses? extractRdfFromSpecif(`meta:objectClasses `,objectClasses) : '')
                        + ' .';
            });
    
        return statementClassesTtlString;
    };

    function transformResources(resources) {
        if (!isArrayWithContent(resources)){
            return '';
        };

        let resourcesTtlString = ''
        resources.forEach( resource => {
            let {id , title , properties, class : resourceClass, revision , changedAt , changedBy} = resource;
            resourcesTtlString += emptyLine()
                        + tier0RdfEntry(`:${id} a IREB:Requirement ;`)
                        + (title? tier1RdfEntry(`rdfs:label '${escapeSpecialCharaters(title)}' ;`) : '')
                        + tier1RdfEntry(`meta:id '${escapeSpecialCharaters(id)}' ;`)
                        + (resourceClass? tier1RdfEntry(`meta:PropertyClassMapping '${escapeSpecialCharaters(resourceClass)}' ;`) : '')
                        + (revision? tier1RdfEntry(`meta:revision '${revision}' ;`) : '')
                        + tier1RdfEntry(`dcterms:modified '${escapeSpecialCharaters(changedAt)}' ;`)
                        + (changedBy? tier1RdfEntry(`meta:changedBy '${escapeSpecialCharaters(changedBy)}' ;`) : '');
            if(isArrayWithContent(properties)){
                properties.forEach( property => {
                    resourcesTtlString += tier1RdfEntry(`:${property.class} '${escapeSpecialCharaters(property.value)}' ;`);
                });
            };
            resourcesTtlString += ' .';
        });

        return resourcesTtlString;
    };

    function transformStatements(statements) {
        if (!isArrayWithContent(statements)){
            return '';
        };

        let statementsTtlString = '';
    
        statements.forEach( statement => {
            let {id , subject , class : statementClass , object , changedAt , changedBy , revision} = statement;
            statementsTtlString += emptyLine()
                        + tier0RdfEntry(`:${id} a meta:Statement ;`)
                        + tier1RdfEntry(`meta:id '${escapeSpecialCharaters(id)}' ;`)
                        + (subject? tier1RdfEntry(`rdf:subject :${subject} ;`) : '')
                        + (statementClass? tier1RdfEntry(`rdf:predicate :${statementClass} ;`) : '')
                        + (object? tier1RdfEntry(`rdf:object :${object} ;`) : '')
                        + tier1RdfEntry(`meta:modified '${escapeSpecialCharaters(changedAt)}' ;`)
                        + (changedBy? tier1RdfEntry(`meta:changedBy '${escapeSpecialCharaters(changedBy)}' ;`) : '')
                        + (revision? tier1RdfEntry(`meta:revision '${revision}' ;`) : '')
                        + ' .';
        });

        return statementsTtlString;
    };

    function transformHierarchies(hierarchies) {
        if (!isArrayWithContent(hierarchies)){
            return '';
        };

        let hierarchyTtlString = '';

        hierarchies.forEach( node => {
            hierarchyTtlString += transformNodes(node);
        });

        return hierarchyTtlString;
    };

    function transformNodes(hierarchyNode) {
        let {id ,resource ,revision ,changedAt ,nodes} = hierarchyNode;
        let hierarchyNodeTtlString = emptyLine()
                    + tier0RdfEntry(`:${id} a SpecIF:RC-Hierarchy ;`)
                    + tier1RdfEntry(`meta:id '${escapeSpecialCharaters(id)}' ;`)
                    + (resource? tier1RdfEntry(`meta:resource '${escapeSpecialCharaters(resource)}' ;`) : '')
                    + (revision? tier1RdfEntry(`meta:revision '${revision}' ;`) : '')
                    + (changedAt? tier1RdfEntry(`dcterms:modified '${escapeSpecialCharaters(changedAt)}' ;`) : '');
    
        if(isArrayWithContent(nodes)){
            let NodeTtlString = tier1RdfEntry(`meta:nodes`);
            nodes.forEach( node => {
                NodeTtlString += tier2RdfEntry(`:${node.id} ,`);
            });
            hierarchyNodeTtlString += NodeTtlString.replace(/,([^,]*)$/, ';')
                        + ` .`;  

            nodes.forEach( node => {
                hierarchyNodeTtlString += transformNodes(node); 
            });
        } else {
            hierarchyNodeTtlString += ` .`;
        };
        return hierarchyNodeTtlString;
    };

    function transformFiles(files) {
        if (!isArrayWithContent(files)){
            return '';
        };

        let filesTtlString = '';
        files.forEach( file => {
            let {id , title , type , changedAt} = file;
            filesTtlString += emptyLine()
                        + tier0RdfEntry(`:${id} a meta:File ;`)
                        + tier1RdfEntry(`meta:id '${id}' ;`)
                        + (title? tier1RdfEntry(`rdfs:label '${title}' ;`) : '')
                        + (type? tier1RdfEntry(`meta:type '${type}' ;`) : '')
                        + tier1RdfEntry(`dcterms:modified '${changedAt}' ;`)
                        + ' .';
        });

        return filesTtlString;
    };

    /* 
    ########################## Tools #########################################
    */

    function isArrayWithContent(array) {
        return (Array.isArray(array) && array.length > 0);
    };

    function extractRdfFromSpecif(predicate, objectArray) {
        let TtlString = '';
        if(isArrayWithContent(objectArray)){
            TtlString = tier1RdfEntry(predicate);
            objectArray.forEach( object => {
                TtlString += tier2RdfEntry(`:${object} ,`);
            });
            TtlString=TtlString.replace(/,([^,]*)$/, ';');
        };
        return TtlString;
    };

    function tier0RdfEntry(content) {
        return `\n${content}`;
    };

    function tier1RdfEntry(content) {
        return `\n\t${content}`;
    };

    function tier2RdfEntry(content) {
        return `\n\t\t${content}`;
    };

    function tier3RdfEntry(content) {
        return `\n\t\t\t${content}`;
    };

    function emptyLine() {
        return `\n`;
    };

    function escapeSpecialCharaters(string) {
        return string.replace("\\","\\\\").replace(/\\([\s\S])|(')/g, "\\$1$2").replace(/\n/g, "\\n");
    };

};
