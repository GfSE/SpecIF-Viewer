"use strict";
/*!
    SpecIF to Turtle Transformation
    (C)copyright adesso SE, enso managers gmbh (http://enso-managers.de)
    Author: ??@adesso.de, se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-RDF-Bridge/issues)
*/
app.specif2turtle = (specifData, opts) => {
    let resultTtlString = defineNamespaces(specifData.id, opts)
        + defineSpecifClasses()
        + transformNativeAttributes(specifData)
        + transformResourceClasses(specifData.resourceClasses)
        + transformStatementClasses(specifData.statementClasses)
        + transformResources(specifData.resources)
        + transformStatements(specifData.statements)
        + transformFiles(specifData.files)
        + transformHierarchies(specifData.hierarchies)
        + emptyLine();
    return resultTtlString
        .replace(/; \./g, '.');
    function defineNamespaces(projectID, opts) {
        let pfxL = '';
        for (var [key, val] of app.ontology.namespaces) {
            pfxL += tier0RdfEntry(`@prefix ${key.replace('.', ':')} <${val.url}> .`);
        }
        ;
        pfxL += emptyLine()
            + tier0RdfEntry(`@prefix : <${opts.baseURI}${projectID}#> .`);
        return pfxL;
    }
    ;
    function defineSpecifClasses() {
        return emptyLine()
            + tier0RdfEntry(`W3C:Ontology rdfs:subClassOf rdfs:Resource .`)
            + tier0RdfEntry(`SpecIF:Project rdfs:subClassOf rdfs:Resource .`)
            + tier0RdfEntry(`SpecIF:File rdfs:subClassOf rdfs:Resource .`)
            + tier0RdfEntry(`SpecIF:Glossary rdfs:subClassOf rdfs:Resource .`)
            + tier0RdfEntry(`SpecIF:Node rdfs:subClassOf rdfs:Resource .`)
            + tier0RdfEntry(`SpecIF:HierarchyRoot rdfs:subClassOf SpecIF:Node .`);
    }
    function transformNativeAttributes(project) {
        let { id, title, description, $schema, generator, generatorVersion, rights, createdAt, createdBy } = project;
        let baseProjectTtlString = emptyLine()
            + tier0RdfEntry(`: a SpecIF:Project ;`)
            + tier1RdfEntry(`dcterms:identifier '${escapeTtl(id)}' ;`)
            + (title ? tier1RdfEntry(`rdfs:label ${textWithLang(title)} ;`) : '')
            + (description ? tier1RdfEntry(`rdfs:comment ${textWithLang(description)} ;`) : '')
            + tier1RdfEntry(`SpecIF:schema <${$schema}> ;`)
            + (generator ? tier1RdfEntry(`SpecIF:generator '${escapeTtl(generator)}' ;`) : '')
            + (generatorVersion ? tier1RdfEntry(`SpecIF:generatorVersion '${escapeTtl(generatorVersion)}' ;`) : '');
        if (rights) {
            baseProjectTtlString += (rights.title ? tier1RdfEntry(`SpecIF:rights-title '${escapeTtl(rights.title)}' ;`) : '')
                + (rights.url ? tier1RdfEntry(`SpecIF:rights-url '${escapeTtl(rights.url)}' ;`) : '');
        }
        ;
        baseProjectTtlString += (createdAt ? tier1RdfEntry(`dcterms:modified '${createdAt}' ;`) : '');
        if (createdBy) {
            baseProjectTtlString += (createdBy.familyName ? tier1RdfEntry(`SpecIF:createdBy-familyName '${escapeTtl(createdBy.familyName)}' ;`) : '')
                + (createdBy.givenName ? tier1RdfEntry(`SpecIF:createdBy-givenName '${escapeTtl(createdBy.givenName)}' ;`) : '')
                + tier1RdfEntry(`SpecIF:createdBy-email '${escapeTtl(createdBy.email)}' ;`)
                + (createdBy.org && createdBy.org.organizationName ? tier1RdfEntry(`SpecIF:createdBy-org-organizationName '${escapeTtl(createdBy.org.organizationName)}' ;`) : '');
        }
        ;
        baseProjectTtlString += ' .';
        return baseProjectTtlString;
    }
    ;
    function transformDatatypes(dataTypes) {
        if (!isArrayWithContent(dataTypes)) {
            return '';
        }
        ;
        let dataTypesTtlString = '';
        dataTypes.forEach((dataType) => {
            dataTypesTtlString += emptyLine()
                + tier1RdfEntry(`rdfs:label '${escapeTtl(dataType.title)}' ;`)
                + tier1RdfEntry(`SpecIF:type '${escapeTtl(dataType.type)}' ; `)
                + (dataType.maxLength ? tier1RdfEntry(`SpecIF:maxLength '${dataType.maxLength}' ;`) : '')
                + (dataType.minInclusive ? tier1RdfEntry(`SpecIF:minInclusive '${dataType.minInclusive}' ;`) : '')
                + (dataType.maxInclusive ? tier1RdfEntry(`SpecIF:maxInclusive '${dataType.maxInclusive}' ;`) : '')
                + (dataType.fractionDigits ? tier1RdfEntry(`SpecIF:fractionDigits '${dataType.fractionDigits}' ;`) : '')
                + tier1RdfEntry(`dcterms:modified '${dataType.changedAt}' ;`)
                + (dataType.changedBy ? tier1RdfEntry(`SpecIF:changedBy '${escapeTtl(dataType.changedBy)}' ;`) : '');
            if (isArrayWithContent(dataType.enumeration)) {
                dataType.enumeration.forEach(enumValue => {
                    dataTypesTtlString += emptyLine()
                        + tier0RdfEntry(`:${escapeTtl(enumValue.id)} a :${escapeTtl(dataType.title)} ;`)
                        + tier1RdfEntry(`SpecIF:id '${escapeTtl(enumValue.id)}' ;`)
                        + tier1RdfEntry(`rdfs:label '${escapeTtl(enumValue.value)}' ;`)
                        + ' .';
                });
            }
            ;
        });
        return dataTypesTtlString;
    }
    ;
    function transformPropertyClasses(propertyClasses) {
        if (!isArrayWithContent(propertyClasses)) {
            return '';
        }
        ;
        let propertyClassesTtlString = '';
        propertyClasses.forEach(propertyClass => {
            propertyClassesTtlString += emptyLine()
                + tier1RdfEntry(`rdfs:label '${escapeTtl(propertyClass.title)}' ; `)
                + (propertyClass.description ? tier1RdfEntry(`rdfs:comment ${textWithLang(propertyClass.description)} ;`) : '')
                + tier1RdfEntry(`SpecIF:dataType '${escapeTtl(propertyClass.dataType.id)}' ;`)
                + tier1RdfEntry(`dcterms:modified '${propertyClass.changedAt}' ;`)
                + (propertyClass.changedBy ? tier1RdfEntry(`SpecIF:changedBy '${escapeTtl(propertyClass.changedBy)}' ;`) : '')
                + ' .';
        });
        return propertyClassesTtlString;
    }
    ;
    function transformResourceClasses(resourceClasses) {
        if (!isArrayWithContent(resourceClasses)) {
            return '';
        }
        ;
        let resourceClassesTtlString = '';
        resourceClasses.forEach(resourceClass => {
            let superC = resourceClass.extends ? ':' + resourceClass.extends.id : "rdfs:Resource";
            resourceClassesTtlString += emptyLine()
                + tier0RdfEntry(`:${resourceClass.id} rdfs:subClassOf ${superC} ;`)
                + tier1RdfEntry(`rdfs:label '${escapeTtl(resourceClass.title)}';`)
                + (resourceClass.description ? tier1RdfEntry(`rdfs:comment ${textWithLang(resourceClass.description)} ;`) : '')
                + (resourceClass.icon ? tier1RdfEntry(`SpecIF:icon '${escapeTtl(resourceClass.icon)}' ;`) : '')
                + tier1RdfEntry(`dcterms:modified '${resourceClass.changedAt}' ;`)
                + (resourceClass.changedBy ? tier1RdfEntry(`SpecIF:changedBy '${escapeTtl(resourceClass.changedBy)}' ;`) : '')
                + ' .';
        });
        return resourceClassesTtlString;
    }
    ;
    function transformStatementClasses(statementClasses) {
        if (!isArrayWithContent(statementClasses)) {
            return '';
        }
        ;
        let statementClassesTtlString = '';
        statementClasses.forEach(statementClass => {
            let superC = statementClass.extends ? ':' + statementClass.extends.id : "rdf:Property";
            statementClassesTtlString += emptyLine()
                + tier0RdfEntry(`:${statementClass.id} rdfs:subPropertyOf ${superC} ;`)
                + tier1RdfEntry(`rdfs:label  '${escapeTtl(statementClass.title)}' ;`)
                + (statementClass.description ? tier1RdfEntry(`rdfs:comment ${textWithLang(statementClass.description)} ;`) : '')
                + tier1RdfEntry(`dcterms:modified '${statementClass.changedAt}' ;`)
                + (statementClass.changedBy ? tier1RdfEntry(`SpecIF:changedBy '${escapeTtl(statementClass.changedBy)}' ;`) : '')
                + ' .';
        });
        return statementClassesTtlString;
    }
    ;
    function transformProperties(prpL) {
        let turtleStr = '';
        if (isArrayWithContent(prpL)) {
            prpL.forEach(prp => {
                let pC = LIB.itemByKey(specifData.propertyClasses, prp['class']), dT = LIB.itemByKey(specifData.dataTypes, pC.dataType), ti = shapeEntity(escapeTtl(pC.title)), ct = '';
                if (dT.enumeration) {
                    prp.values = prp.values.map((v) => LIB.itemById(dT.enumeration, v).value);
                }
                ;
                for (var v of prp.values) {
                    switch (dT.type) {
                        case XsDataType.String:
                            switch (ti) {
                                case 'SpecIF:Revision':
                                case 'rdfs:label':
                                case 'rdfs:comment':
                                    ct += appendVal(ct, textWithLang(v));
                                    break;
                                default:
                                    let txt = "'" + escapeTtl(v[0].text) + "'";
                                    ct += appendVal(ct, txt);
                            }
                            ;
                            break;
                        default:
                            ct += appendVal(ct, "'" + v + "'");
                    }
                }
                ;
                if (ct)
                    turtleStr += tier1RdfEntry(`${ti} ${ct} ;`);
            });
        }
        ;
        return turtleStr;
        function appendVal(str, val) {
            return (str.length == 0 ? "" : " , ") + val;
        }
    }
    ;
    function transformResources(resources) {
        if (isArrayWithContent(resources)) {
            let resourcesTtlString = '';
            resources.forEach(resource => {
                resourcesTtlString += emptyLine()
                    + tier0RdfEntry(`:${resource.id} a :${escapeTtl(resource["class"].id)} ;`)
                    + transformProperties(resource.properties)
                    + tier1RdfEntry(`dcterms:modified '${resource.changedAt}' ;`)
                    + (resource.changedBy ? tier1RdfEntry(`SpecIF:changedBy '${escapeTtl(resource.changedBy)}' ;`) : '')
                    + ' .';
            });
            return resourcesTtlString;
        }
        else
            return '';
    }
    ;
    function transformStatements(statements) {
        if (isArrayWithContent(statements)) {
            let statementsTtlString = '';
            statements.forEach(statement => {
                statementsTtlString
                    += emptyLine()
                        + tier0RdfEntry(`:${statement.id} a rdf:Statement ;`)
                        + tier1RdfEntry(`rdf:predicate :${statement['class'].id} ;`)
                        + tier1RdfEntry(`rdf:subject :${statement.subject.id} ;`)
                        + tier1RdfEntry(`rdf:object :${statement.object.id} ;`)
                        + (statement.properties ? transformProperties(statement.properties) : '')
                        + tier1RdfEntry(`dcterms:modified '${statement.changedAt}' ;`)
                        + (statement.changedBy ? tier1RdfEntry(`SpecIF:changedBy '${escapeTtl(statement.changedBy)}' ;`) : '')
                        + ' .';
            });
            return statementsTtlString;
        }
        else
            return '';
    }
    ;
    function transformHierarchies(hierarchies) {
        if (isArrayWithContent(hierarchies)) {
            let hierarchyTtlString = '';
            hierarchies.forEach(node => {
                hierarchyTtlString += transformNode(node, { root: true });
            });
            return hierarchyTtlString;
        }
        else
            return '';
    }
    ;
    function transformNode(nd, opts) {
        let nodeClass = opts && opts.root ? 'SpecIF:HierarchyRoot' : 'SpecIF:Node', nodeTtlString = emptyLine()
            + tier0RdfEntry(`:${nd.id} a ${nodeClass} ;`)
            + (nd.resource ? tier1RdfEntry(`SpecIF:shows :${escapeTtl(nd.resource.id)} ;`) : '')
            + (nd.changedAt ? tier1RdfEntry(`dcterms:modified '${nd.changedAt}' ;`) : '');
        if (isArrayWithContent(nd.nodes)) {
            let containedNodeTtlString = tier1RdfEntry(`rdf:Seq`);
            nd.nodes.forEach(node => {
                containedNodeTtlString += tier2RdfEntry(`:${node.id} ,`);
            });
            nodeTtlString += containedNodeTtlString.replace(/,([^,]*)$/, ';')
                + ` .`;
            nd.nodes.forEach(node => {
                nodeTtlString += transformNode(node);
            });
        }
        else {
            nodeTtlString += ` .`;
        }
        ;
        return nodeTtlString;
    }
    ;
    function transformFiles(files) {
        if (isArrayWithContent(files)) {
            let filesTtlString = '';
            files.forEach(file => {
                filesTtlString += emptyLine()
                    + tier0RdfEntry(`:${file.id} a SpecIF:File ;`)
                    + (file.title ? tier1RdfEntry(`rdfs:label '${file.title}' ;`) : '')
                    + (file.type ? tier1RdfEntry(`iana:mediaType '${file.type}' ;`) : '')
                    + tier1RdfEntry(`dcterms:modified '${file.changedAt}' ;`)
                    + ' .';
            });
            return filesTtlString;
        }
        else
            return '';
    }
    ;
    function isArrayWithContent(array) {
        return (Array.isArray(array) && array.length > 0);
    }
    function extractRdfFromSpecif(predicate, itemL) {
        let TtlString = '';
        if (isArrayWithContent(itemL)) {
            TtlString = tier1RdfEntry(predicate);
            itemL.forEach(itm => {
                TtlString += tier2RdfEntry(`:${itm} ,`);
            });
            TtlString = TtlString.replace(/,([^,]*)$/, ';');
        }
        ;
        return TtlString;
    }
    function tier0RdfEntry(str) {
        return `\n${str}`;
    }
    function tier1RdfEntry(str) {
        return `\n\t${str}`;
    }
    function tier2RdfEntry(str) {
        return `\n\t\t${str}`;
    }
    function emptyLine() {
        return `\n`;
    }
    function escapeTtl(str) {
        return str.replace("\\", "\\\\").replace(/\\([\s\S])|(')/g, "\\$1$2").replace(/\n/g, "\\n");
    }
    function hasNamespace(str) {
        return RE.Namespace.test(str);
    }
    function textWithLang(vL) {
        let txt = escapeTtl(vL[0]['text']);
        return "'" + txt + "'";
    }
    function shapeEntity(str) {
        let tkn = "_4_7_1_1_", nSp = false;
        str = str
            .replace(RE.Namespace, (match, $1, $2) => { nSp = true; return $1 + tkn + $2; })
            .replace(/[\W]/g, "-")
            .replace(new RegExp(tkn + "(\\w)"), (match, $1) => { return ":" + $1; });
        return (nSp ? str : ":" + str);
    }
};
