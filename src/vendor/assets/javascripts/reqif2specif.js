testTransformReqIfToSpecIf = (reqIfDocument) => {               
    const element = extractXmlDocFromString(reqIfDocument);
    const specIfObject = extractMainSpecifProperties(element.getElementsByTagName("REQ-IF-HEADER"));
    specIfObject.dataTypes = extractSpecifDatatypesFromXmlDoc(element.getElementsByTagName("DATATYPES"));
    specIfObject.propertyClasses = extractSpecifPropertyClassesFromXmlDoc(element.getElementsByTagName("SPEC-TYPES"));
    specIfObject.resourceClasses = extractSpecifResourceClassesFromXmlDoc(element.getElementsByTagName("SPEC-TYPES"));
    specIfObject.statementClasses = extractSpecifStatementClassesFromXmlDoc(element.getElementsByTagName("SPEC-TYPES"));
    resources = extractSpecifResourcesFromXmlDoc(element.getElementsByTagName("SPEC-OBJECTS"));
    //resources.concat(extractRootSpecIfObjectsArray(element.getElementsByTagName("SPECIFICATIONS")))
    resources.push(extractRootSpecIfObjectsArray(element.getElementsByTagName("SPECIFICATIONS")))
    specIfObject.resources = resources.flat(); //Was bedeutet die Flat methode?
    //specIfObject.resources = resources
    specIfObject.statements = element.getElementsByTagName("SPEC-RELATIONS")[0] ? extractSpecifStatementsFromXmlDoc(element.getElementsByTagName("SPEC-RELATIONS")) : [];
    specIfObject.hierarchies = element.getElementsByTagName("SPECIFICATIONS")[0] ? extractSpecifHierarchiesFromXmlDoc(element.getElementsByTagName("SPECIFICATIONS")) : [];
    
    console.log(specIfObject)
    return specIfObject
}

extractMainSpecifProperties = (XmlDocReqIfHeader) => {
    const specIfProeprties = {};
    if (!XmlDocReqIfHeader.length) return specIfProeprties;
    specIfProeprties.id = XmlDocReqIfHeader[0].getAttribute("IDENTIFIER");
    specIfProeprties.title = XmlDocReqIfHeader[0].getElementsByTagName("TITLE")[0].innerHTML;
    //specIfProeprties.description = XmlDocReqIfHeader[0].getElementsByTagName("COMMENT")[0].innerHTML;
    XmlDocReqIfHeader[0].getElementsByTagName("COMMENT")[0] ? specIfProeprties.description = XmlDocReqIfHeader[0].getElementsByTagName("COMMENT")[0].innerHTML : '';

    specIfProeprties.$schema = "https://specif.de/v1.0/schema.json";
    specIfProeprties.createdAt = XmlDocReqIfHeader[0].getElementsByTagName("CREATION-TIME")[0].innerHTML; 
    
    return specIfProeprties;
}
var test;
extractSpecifDatatypesFromXmlDoc = (XmlDocDatatypes) => {
    const specIfDatatypes = [];
    if (!XmlDocDatatypes.length) return specIfDatatypes;
    const datatypesArray = extractElementsOutOfHtmlCollection(XmlDocDatatypes[0].children)                  
    datatypesArray.forEach( datatype => {
        specIfDatatypes.push(extractSpecifDatatype(datatype))
    });
    return specIfDatatypes;
}

extractSpecifDatatype = (datatype) => {
    const specifDatatype = {};
    datatype.getAttribute("IDENTIFIER") ? specifDatatype.id = datatype.getAttribute("IDENTIFIER") : '';
    datatype.getAttribute("LONG-NAME") ? specifDatatype.title = datatype.getAttribute("LONG-NAME") : '';
    datatype.getAttribute("DESC") ? specifDatatype.description = datatype.getAttribute("DESC") : '';
    specifDatatype.type = getTypeOfDatatype(datatype);
    datatype.getAttribute("MIN") ? specifDatatype.minInclusive = Number(datatype.getAttribute("MIN")) : '';
    datatype.getAttribute("MAX") ? specifDatatype.maxInclusive = Number(datatype.getAttribute("MAX")) : '';
    datatype.getAttribute("MAX-LENGTH") ? specifDatatype.maxLength = Number(datatype.getAttribute("MAX-LENGTH")) : '';
    datatype.getAttribute("ACCURACY") ? specifDatatype.fractionDigits = Number(datatype.getAttribute("ACCURACY")) : '';
    datatype.childElementCount ? specifDatatype.values = extractDataTypeValues(datatype.children) : '';
    datatype.getAttribute("LAST-CHANGE") ? specifDatatype.changedAt = datatype.getAttribute("LAST-CHANGE") : '';

    return specifDatatype;
}

getTypeOfDatatype = (datatype) => {
    let type;

    switch(datatype.tagName) {
        case "DATATYPE-DEFINITION-BOOLEAN": type = 'xs:boolean'; break; 
        case "DATATYPE-DEFINITION-DATE": type = 'xs:dateTime'; break;
        case "DATATYPE-DEFINITION-INTEGER": type = 'xs:integer'; break;
        case "DATATYPE-DEFINITION-REAL": type = 'xs:double'; break;
        case "DATATYPE-DEFINITION-STRING": type = 'xs:string'; break;
        case "DATATYPE-DEFINITION-XHTML": type = 'xhtml'; break;
        case "DATATYPE-DEFINITION-ENUMERATION": type = 'xs:enumeration'; break;

        default: type = 'xs:string'
    }

    return type;
}

extractDataTypeValues = (DataTypeValuesHtmlCollection) => {
    const specIfValuesArray = [];
    if (!DataTypeValuesHtmlCollection.length) return specIfValuesArray;                                
    const valuesArray = extractElementsOutOfHtmlCollection(DataTypeValuesHtmlCollection[0].children);
    valuesArray.forEach( value => {specIfValuesArray.push(extractSpecIfValue(value))});
    
    return specIfValuesArray;
}

extractSpecIfValue = (valueDocument) => {
    if (!valueDocument.getAttribute("IDENTIFIER")) return;

    const specifValueObject = {};
    valueDocument.getAttribute("IDENTIFIER") ?  specifValueObject.id = valueDocument.getAttribute("IDENTIFIER") : '' ;
    valueDocument.getAttribute("LONG-NAME") ?   specifValueObject.value = valueDocument.getAttribute("LONG-NAME") : specifValueObject.value = 'Value undefined';
    
    return specifValueObject;
}

extractSpecifPropertyClassesFromXmlDoc = (XmlSpecTypeDocument) => {
    const specAttributesMap = extractSpecAttributesMap(XmlSpecTypeDocument[0]);                                 
    const specifPropertyClassesArray = extractPropertyClassesFromSpecAttributeMap(specAttributesMap);
    
    return specifPropertyClassesArray;
}

extractSpecifResourceClassesFromXmlDoc = (XmlSpecTypeDocument) => {
    const specifResourceClassesArray = [];
    if (!XmlSpecTypeDocument.length) return specifResourceClassesArray;
    const specificationArray = extractElementsOutOfHtmlCollection(XmlSpecTypeDocument[0].children)              
    const resourceClassArray = specificationArray.filter(specType => isResourceClass(specType))                 
    resourceClassArray.forEach( resourceClassDocument => {
        specifResourceClassesArray.push(extractSpecIfResourceClass(resourceClassDocument))
    })
    return specifResourceClassesArray;
}

extractSpecIfResourceClass = (resourceClassDocument) => {
    const specifResourceClass = {};
    specifResourceClass.id = resourceClassDocument.getAttribute("IDENTIFIER");
    specifResourceClass.title = resourceClassDocument.getAttribute("LONG-NAME");

    resourceClassDocument.getAttribute("DESC") ? specifResourceClass.description = resourceClassDocument.getAttribute("DESC") : '';
    resourceClassDocument.getElementsByTagName("SPEC-ATTRIBUTES")[0] ? specifResourceClass.propertyClasses = extractResourceClassProperties(resourceClassDocument.getElementsByTagName("SPEC-ATTRIBUTES")) : '';
    specifResourceClass.changedAt = resourceClassDocument.getAttribute("LAST-CHANGE");
    //specifResourceClass.description = resourceClassDocument.getAttribute("DESC");
   
    return specifResourceClass;
}

extractResourceClassProperties = (propertyClassesDocument) => {
    let propertiesArray = extractElementsOutOfHtmlCollection(propertyClassesDocument[0].children);
    propertiesArray = propertiesArray.map( property => {return property.getAttribute("IDENTIFIER")});
    
    return propertiesArray;
}

extractSpecifStatementClassesFromXmlDoc = (XmlSpecTypeDocument) => {
    const specifStatementClassesArray = [];
    if (!XmlSpecTypeDocument.length) return specifStatementClassesArray;
    const specificationArray = extractElementsOutOfHtmlCollection(XmlSpecTypeDocument[0].children)          
    const statementClassArray = specificationArray.filter(specType => isStatementClass(specType))           
    statementClassArray.forEach( statementClassDocument => {
        specifStatementClassesArray.push(extractSpecIfStatementClass(statementClassDocument))
    })
    return specifStatementClassesArray;
}

extractSpecIfStatementClass = (statementClassDocument) => {
    const specifStatementClass = {};
    specifStatementClass.id = statementClassDocument.getAttribute("IDENTIFIER")
    specifStatementClass.title = statementClassDocument.getAttribute("LONG-NAME") ? statementClassDocument.getAttribute("LONG-NAME") : statementClassDocument.getAttribute("IDENTIFIER");
    specifStatementClass.description = statementClassDocument.getAttribute("DESC") ? statementClassDocument.getAttribute("DESC") : '';
    specifStatementClass.changedAt = statementClassDocument.getAttribute("LAST-CHANGE")

    return specifStatementClass;
}

extractSpecifResourcesFromXmlDoc = (XmlDocResources) => {
    const specifResourcesArray = [];
    if (!XmlDocResources.length) return specifResourcesArray;
    const resourcesArray = extractElementsOutOfHtmlCollection(XmlDocResources[0].children)                  
    resourcesArray.forEach( resourceDocument => {
        specifResourcesArray.push(extractSpecIfResource(resourceDocument))
    })
    return specifResourcesArray;
}

// start what i need 

extractSpecIfResource = (resourceDocument) => {
    const specifResource = {};
    resourceDocument.getAttribute("IDENTIFIER") ? specifResource.id = resourceDocument.getAttribute("IDENTIFIER") : '';
    //resourceDocument.getAttribute("LONG-NAME") ? specifResource.title = resourceDocument.getAttribute("LONG-NAME") : '';
    specifResource.title = resourceDocument.getAttribute("LONG-NAME") ? resourceDocument.getAttribute("LONG-NAME") : resourceDocument.getAttribute("IDENTIFIER");
    resourceDocument.getElementsByTagName("TYPE")[0] ? specifResource.class = resourceDocument.getElementsByTagName("TYPE")[0].children[0].innerHTML : '';
    //resourceDocument.getElementsByTagName("VALUES")[0].childElementCount ? specifResource.properties = extractResourceProperties(resourceDocument.getElementsByTagName("VALUES")) : '';
    resourceDocument.getElementsByTagName("VALUES")[0] ? specifResource.properties = extractResourceProperties(resourceDocument.getElementsByTagName("VALUES")) : '';

    //<VALUES>-child <ATTRIBUTE-VALUE-XHTML> --> child <THE-VALUE> -->remove child <xhtml:div>
    resourceDocument.getAttribute("LAST-CHANGE") ? specifResource.changedAt = resourceDocument.getAttribute("LAST-CHANGE") : '';
    
    return specifResource;
}

extractResourceProperties = (specObjectsValuesDocument) => {
    const valuesDoc = specObjectsValuesDocument[0];                                            
    const childrenArray = extractElementsOutOfHtmlCollection(valuesDoc.children);
    const specIfResourcePropertyArray = childrenArray.map(property => {return extractSpecIfProperty(property)});
    
    return specIfResourcePropertyArray;
}

extractSpecIfProperty = (property) => {
    const specifProperty = {};
    property.getElementsByTagName("DEFINITION") ? specifProperty.class = property.getElementsByTagName("DEFINITION")[0].children[0].innerHTML : '';
    property.getAttribute("THE-VALUE") ? specifProperty.value = property.getAttribute("THE-VALUE") : '';
    property.getElementsByTagName("THE-VALUE")[0] ? specifProperty.value = property.getElementsByTagName("THE-VALUE")[0].innerHTML : '';
    property.getElementsByTagName("VALUES")[0] ? specifProperty.value = property.getElementsByTagName("VALUES")[0].children[0].innerHTML : '';
    
    //specifProperty.value.removeNamespaces()

    specifProperty.value = removeNamespaces(specifProperty.value)
    //console.log("Value: " + specifProperty.value)
    return specifProperty;
}

//end what i need 

extractRootSpecIfObjectsArray = (specificationsDocument) => {
    return extractSpecifResourcesFromXmlDoc(specificationsDocument);
}

extractSpecifStatementsFromXmlDoc = (XmlDocStatements) => {
    const specifStatementsArray = [];
    if (!XmlDocStatements.length) return specifStatementsArray;
    const statementsArray = extractElementsOutOfHtmlCollection(XmlDocStatements[0].children)                
    statementsArray.forEach( statementDocument => {
        specifStatementsArray.push(extractSpecIfStatement(statementDocument));
    }) 
    return specifStatementsArray;
}

extractSpecIfStatement = (statementDocument) => {
    const specifStatement = {};
    statementDocument.getAttribute("IDENTIFIER") ? specifStatement.id = statementDocument.getAttribute("IDENTIFIER") : '';
    statementDocument.getElementsByTagName("TYPE")[0] ? specifStatement.class = statementDocument.getElementsByTagName("TYPE")[0].children[0].innerHTML : '';
    statementDocument.getAttribute("LAST-CHANGE") ? specifStatement.changedAt = statementDocument.getAttribute("LAST-CHANGE") : '';
    statementDocument.getElementsByTagName("SOURCE")[0] ? specifStatement.subject = statementDocument.getElementsByTagName("SOURCE")[0].children[0].innerHTML : '';
    statementDocument.getElementsByTagName("TARGET")[0] ? specifStatement.object = statementDocument.getElementsByTagName("TARGET")[0].children[0].innerHTML : '';
    
    return specifStatement;
}

extractSpecifHierarchiesFromXmlDoc = (XmlDocSpecifications) => {
    const specifHierarchiesArray = [];
    if (!XmlDocSpecifications.length) return specifHierarchiesArray;
    const specifications = extractElementsOutOfHtmlCollection(XmlDocSpecifications[0].getElementsByTagName("SPECIFICATION"))
    specifications.forEach( specification => {
        specifHierarchiesArray.push(extractRootNode(specification))
    })  
    return specifHierarchiesArray;
}

extractRootNode = (specificationDocument) => {
    const specIfRootNode = {};
    //specIfRootNode.id = "R-1"; //TODO: hash-algorhythmus 
    specIfRootNode.id = "HR-" + specificationDocument.getAttribute("IDENTIFIER").simpleHash().toString()
    //console.log( specIfRootNode.id)
    specIfRootNode.resource = specificationDocument.getAttribute("IDENTIFIER");
    specIfRootNode.changedAt = specificationDocument.getAttribute("LAST-CHANGE");
    specIfRootNode.nodes = extractSpecIfSubNodes(specificationDocument)
    return specIfRootNode;
}

extractSpecIfSubNodes = (rootElement) => {
    const specifNodesArray = [];
    const childrenDocElement = getChildNodeswithTag(rootElement, "CHILDREN")[0];
    if(childrenDocElement != undefined){
        const hierarchyDocumentsArray = extractElementsOutOfHtmlCollection(childrenDocElement.children)
        hierarchyDocumentsArray.forEach( hierarchyDocument => {
            specifNodesArray.push(extractSpecIfHierarchy(hierarchyDocument))
        })
    }
    return specifNodesArray;
}

extractSpecIfHierarchy = (hierarchyDocument) => {
    const specIfHierarchy = {};
    specIfHierarchy.id = hierarchyDocument.getAttribute("IDENTIFIER");
    specIfHierarchy.resource = hierarchyDocument.getElementsByTagName("OBJECT")[0].firstElementChild.innerHTML;
    specIfHierarchy.changedAt = hierarchyDocument.getAttribute("LAST-CHANGE");
    
    const specifSubnodesArray = extractSpecIfSubNodes(hierarchyDocument);
    specifSubnodesArray.length ? specIfHierarchy.nodes = specifSubnodesArray : '';
    
    return specIfHierarchy;
}


/* 
##########################################################################
########################## Tools #########################################  
##########################################################################
*/

//      (xmlns:.*?=)\\".*?\\" Regular Expression to match namespace links (at beginning)

extractXmlDocFromString = (string) => {
    const parser = new DOMParser();
    return parser.parseFromString(string,"text/xml");
}

extractElementsOutOfHtmlCollection = (htmlCollection) => {
    const result = [];
    for (let node of htmlCollection) { result.push(node) }
    return result;
}

isResourceClass = (classDocument) => {
    return classDocument.tagName === 'SPEC-OBJECT-TYPE' || classDocument.tagName === 'SPECIFICATION-TYPE'
}

isStatementClass = (classDocument) => {
    return classDocument.tagName === 'SPEC-RELATION-TYPE' || classDocument.tagName === 'RELATION-GROUP-TYPE'
}

getChildNodeswithTag = (parentDocument, tagName) => {
    return extractElementsOutOfHtmlCollection(parentDocument.children).filter(element => {return element.tagName == tagName})
}

extractSpecAttributesMap = (specTypesDocument) => {
    const StringsSpecification = extractSpecAttributeStringsMap(specTypesDocument);
    const XHTMLSpecification = extractSpecAttributeXHTMLMap(specTypesDocument);
    const EnumsSpecification = extractSpecAttributeEnumsMap(specTypesDocument);
    const DateSpecification = extractSpecAttributeDateMap(specTypesDocument);
    const BooleanSpecification = extractSpecAttributeBooleanMap(specTypesDocument);
    const IntegerSpecification = extractSpecAttributeIntegerMap(specTypesDocument);
    const RealSpecification = extractSpecAttributeRealMap(specTypesDocument);
    return Object.assign({}, StringsSpecification, XHTMLSpecification, EnumsSpecification, DateSpecification, BooleanSpecification, IntegerSpecification, RealSpecification);
}

extractSpecAttributeStringsMap = (specTypesDocument) => {
    return extractSpecAttributeTypeMap(specTypesDocument, "ATTRIBUTE-DEFINITION-STRING");
}

extractSpecAttributeXHTMLMap = (specTypesDocument) => {
    return extractSpecAttributeTypeMap(specTypesDocument, "ATTRIBUTE-DEFINITION-XHTML");
}

extractSpecAttributeEnumsMap = (specTypesDocument) => {
    return extractSpecAttributeTypeMap(specTypesDocument, "ATTRIBUTE-DEFINITION-ENUMERATION");
}

extractSpecAttributeDateMap = (specTypesDocument) => {
    return extractSpecAttributeTypeMap(specTypesDocument, "ATTRIBUTE-DEFINITION-DATE");
}

extractSpecAttributeBooleanMap = (specTypesDocument) => {
    return extractSpecAttributeTypeMap(specTypesDocument, "ATTRIBUTE-DEFINITION-BOOLEAN");
}

extractSpecAttributeIntegerMap = (specTypesDocument) => {
    return extractSpecAttributeTypeMap(specTypesDocument, "ATTRIBUTE-DEFINITION-INTEGER");
}

extractSpecAttributeRealMap = (specTypesDocument) => {
    return extractSpecAttributeTypeMap(specTypesDocument, "ATTRIBUTE-DEFINITION-REAL");
}

extractSpecAttributeTypeMap = (specTypesDocument, tagName) => {
    let attributeDefinition = specTypesDocument.getElementsByTagName(tagName)
    let attributeDefinitionArray = extractElementsOutOfHtmlCollection(attributeDefinition)
    let attributeDefinitionMap = {}
    attributeDefinitionArray.forEach(definition => {
        attributeDefinitionMap[definition.getAttribute("IDENTIFIER")]={ 
                                                                        title : definition.getAttribute("LONG-NAME"),
                                                                        dataType : definition.children[0].children[0].innerHTML,
                                                                        changedAt : definition.getAttribute("LAST-CHANGE"),
                                                                    } 
        // Enumeration have the optional value MULTI-VALUED                                                 
        definition.getAttribute("MULTI-VALUED")?attributeDefinitionMap[definition.getAttribute("IDENTIFIER")].multipleChoice=true:'';
                                                                });
    return attributeDefinitionMap;
}

extractPropertyClassesFromSpecAttributeMap = (specAttributeMap) => {
    const propertyClasses = Object.entries(specAttributeMap).map( entry => { 
        const propertyClass = {};

        propertyClass.id = entry[0];
        propertyClass.title = entry[1].title;
        propertyClass.dataType = entry[1].dataType;
        propertyClass.changedAt = entry[1].changedAt ;
        entry[1].multipleChoice? propertyClass.multipleChoice = entry[1].multipleChoice: '';

        return propertyClass;
    })

    return propertyClasses;
}



String.prototype.simpleHash = function(){
    for(var r=0,i=0;i<this.length;i++)r=(r<<5)-r+this.charCodeAt(i),r&=r;
    return r
};

/*String.prototype.removeNamespaces = function(){
    if( this ) return this.replace( /(xmlns:.*?=)\\".*?\\"/g, '' ); 
	return;
};*/

/*String.prototype.removeNamespaces = function(){
    console.log("is in remove Namespace method")
    if( this ) {
        console.log("in this")
        const RE_NS_LINK = /\sxmlns:(.*?)=\".*?\"/
        let namespace = getNameSpace(RE_NS_LINK, this)
        let string = this.replace(RE_NS_LINK, '' ); 
        string = string.replaceAll(namespace, '')
        console.log(string)
        return string;
    }
	return;
};*/

removeNamespaces = (input) => {
    const RE_NS_LINK = /\sxmlns:(.*?)=\".*?\"/
        let namespace = getNameSpace(RE_NS_LINK, input)
        let string = input.replace(RE_NS_LINK, '' ); 
        //string = string.replaceAll(namespace, '')
        const RE_namespace = new RegExp(namespace, 'g' )
        string = string.replace(RE_namespace, '')
        //console.log(string)
        return string;
}

getNameSpace = (regEX, string) => {
    let namespace = ''
    string = string.replace(regEX, function($0, $1){
        //console.log("$1:" + $1)
        namespace = $1 + ":";
        return ''
    })
    //console.log("Namespace: " + namespace)
    return namespace
}


/* 
############################ UI ###########################################
 */

getInputValue = () => {
    const element = document.getElementById('input');
    return element.value;
}

transform = () => {
    const input = getInputValue();
    const specIf = testTransformReqIfToSpecIf(input);
    let element = document.getElementById('output');
    element.innerHTML = JSON.stringify(specIf, null, '\t');
}


