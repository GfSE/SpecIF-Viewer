/*! 
    ReqIF to SpecIF Transformation
    (C)copyright adesso SE, enso managers gmbh (http://www.enso-managers.de)
    Author: jasmin.droescher@adesso.de, se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de 
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)

    ToDo:
    - transform RELATION-GROUP-TYPES and RELATION-GROUPS
    - identify relationship SOURCEs and TARGETs without referenced OBJECTs and annotate them similarly to the Excel import
    - gather default values
*/

function transformReqif2Specif(reqIfDocument,options) {
    if( typeof(options)!='object' ) options = {};
    if( typeof(options.translateTitle2Specif)!='function' ) options.translateTitle2Specif = function(ti) {return ti};
	
	// Transform ReqIF data provided as an XML string to SpecIF data.
    const xmlDoc = extractXmlDocFromString(reqIfDocument);
    let specIfObject = extractMainSpecifProperties(xmlDoc.getElementsByTagName("REQ-IF-HEADER"));
    specIfObject.dataTypes = extractDatatypesFromXmlDoc(xmlDoc.getElementsByTagName("DATATYPES"));
    specIfObject.propertyClasses = extractPropertyClassesFromXmlDoc(xmlDoc.getElementsByTagName("SPEC-TYPES"));
    specIfObject.resourceClasses = extractResourceClassesFromXmlDoc(xmlDoc.getElementsByTagName("SPEC-TYPES"));
    specIfObject.statementClasses = extractStatementClassesFromXmlDoc(xmlDoc.getElementsByTagName("SPEC-TYPES"));
    specIfObject.resources = extractResourcesFromXmlDoc(xmlDoc.getElementsByTagName("SPEC-OBJECTS"))
							// ReqIF hierarchy roots are SpecIF resouces:
							.concat(extractResourcesFromXmlDoc(xmlDoc.getElementsByTagName("SPECIFICATIONS")));
    specIfObject.statements = xmlDoc.getElementsByTagName("SPEC-RELATIONS")[0] ? extractStatementsFromXmlDoc(xmlDoc.getElementsByTagName("SPEC-RELATIONS")) : [];
    specIfObject.hierarchies = xmlDoc.getElementsByTagName("SPECIFICATIONS")[0] ? extractHierarchiesFromXmlDoc(xmlDoc.getElementsByTagName("SPECIFICATIONS")) : [];
    
    console.debug(specIfObject);
    return specIfObject;

function extractMainSpecifProperties(XmlDocReqIfHeader) {
    if (XmlDocReqIfHeader.length<1) return {};
    let specIfProperties = {};
    specIfProperties.id = XmlDocReqIfHeader[0].getAttribute("IDENTIFIER");
    specIfProperties.title = XmlDocReqIfHeader[0].getElementsByTagName("TITLE")[0] && XmlDocReqIfHeader[0].getElementsByTagName("TITLE")[0].innerHTML;
    specIfProperties.description = XmlDocReqIfHeader[0].getElementsByTagName("COMMENT")[0] && XmlDocReqIfHeader[0].getElementsByTagName("COMMENT")[0].innerHTML || '';

    specIfProperties.$schema = "https://specif.de/v1.0/schema.json";
    specIfProperties.createdAt = XmlDocReqIfHeader[0].getElementsByTagName("CREATION-TIME")[0].innerHTML; 
    
    return specIfProperties;
};
function extractDatatypesFromXmlDoc(XmlDocDatatypes) {
    return XmlDocDatatypes.length<1? [] : Array.from(XmlDocDatatypes[0].children, extractDatatype );

    function extractDatatype(datatype) {
        let specifDatatype = {};
        specifDatatype.id = datatype.getAttribute("IDENTIFIER");
        specifDatatype.type = getTypeOfDatatype(datatype);
        specifDatatype.title = datatype.getAttribute("LONG-NAME") || '';
        specifDatatype.description = datatype.getAttribute("DESC") || '';
        if( datatype.getAttribute("MIN") ) specifDatatype.minInclusive = Number(datatype.getAttribute("MIN"));
        if( datatype.getAttribute("MAX") ) specifDatatype.maxInclusive = Number(datatype.getAttribute("MAX"));
        if( datatype.getAttribute("MAX-LENGTH") ) specifDatatype.maxLength = Number(datatype.getAttribute("MAX-LENGTH"));
        if( datatype.getAttribute("ACCURACY") ) specifDatatype.fractionDigits = Number(datatype.getAttribute("ACCURACY"));
        if( datatype.childElementCount>0 ) specifDatatype.values = extractDataTypeValues(datatype.children);
        specifDatatype.changedAt = datatype.getAttribute("LAST-CHANGE") || '';

        return specifDatatype;
    }
    function getTypeOfDatatype(datatype) {
        return {
            "DATATYPE-DEFINITION-BOOLEAN": 'xs:boolean', 
            "DATATYPE-DEFINITION-DATE": 'xs:dateTime',
            "DATATYPE-DEFINITION-INTEGER": 'xs:integer',
            "DATATYPE-DEFINITION-REAL": 'xs:double',
            "DATATYPE-DEFINITION-STRING": 'xs:string',
            "DATATYPE-DEFINITION-XHTML": 'xhtml',
            "DATATYPE-DEFINITION-ENUMERATION": 'xs:enumeration',
        }[datatype.nodeName];
    }
    function extractDataTypeValues(DataTypeValuesHtmlCollection) {
        return Array.from( DataTypeValuesHtmlCollection[0].children, extractEnumValue );

        function extractEnumValue(ch) {
            return {
                id: ch.getAttribute("IDENTIFIER"),
                value: ch.getAttribute("LONG-NAME") || '&#x00ab;undefined&#x00bb;'
            }
        }
    }
};

function extractPropertyClassesFromXmlDoc(XmlSpecTypeDocument) {
    const specAttributesMap = extractSpecAttributesMap(XmlSpecTypeDocument[0]);                                 
    return extractPropertyClassesFromSpecAttributeMap(specAttributesMap);

    function extractPropertyClassesFromSpecAttributeMap(specAttributeMap) {
        let propertyClasses = Object.entries(specAttributeMap).map( entry => { 
            let propertyClass = {
                id: entry[0],
                title: options.translateTitle2Specif( entry[1].title ),
                dataType: entry[1].dataType,
                changedAt: entry[1].changedAt
            };
            if( entry[1].multiple ) propertyClass.multiple = true;

            return propertyClass;
        });
        return propertyClasses;
    }
    function extractSpecAttributesMap(specTypesDocument) {
        return Object.assign({},
            extractSpecAttributeTypeMap(specTypesDocument, "ATTRIBUTE-DEFINITION-STRING"),
            extractSpecAttributeTypeMap(specTypesDocument, "ATTRIBUTE-DEFINITION-XHTML"),
            extractSpecAttributeTypeMap(specTypesDocument, "ATTRIBUTE-DEFINITION-ENUMERATION"),
            extractSpecAttributeTypeMap(specTypesDocument, "ATTRIBUTE-DEFINITION-DATE"),
            extractSpecAttributeTypeMap(specTypesDocument, "ATTRIBUTE-DEFINITION-BOOLEAN"),
            extractSpecAttributeTypeMap(specTypesDocument, "ATTRIBUTE-DEFINITION-INTEGER"),
            extractSpecAttributeTypeMap(specTypesDocument, "ATTRIBUTE-DEFINITION-REAL"),
        );

        function extractSpecAttributeTypeMap(specTypesDocument, nodeName) {
            let attributeDefinition = specTypesDocument.getElementsByTagName(nodeName)
            let attributeDefinitionArray = Array.from(attributeDefinition)
            let attributeDefinitionMap = {}
            attributeDefinitionArray.forEach(definition => {
                attributeDefinitionMap[definition.getAttribute("IDENTIFIER")]={ 
                                                                                title: definition.getAttribute("LONG-NAME"),
                                                                                dataType: definition.children[0].children[0].innerHTML,
                                                                                changedAt: definition.getAttribute("LAST-CHANGE"),
                                                                            } 
                // Enumerations have an optional attribute MULTI-VALUED                                                 
                if( definition.getAttribute("MULTI-VALUED") )
                    attributeDefinitionMap[definition.getAttribute("IDENTIFIER")].multiple=true;
            });
            return attributeDefinitionMap;
        }
    }
}

function extractResourceClassesFromXmlDoc(XmlSpecTypeDocument) {
    if (XmlSpecTypeDocument.length<1) return [];
    const specifResourceClassesArray = [];
    // consider to use .querySelectorAll("nodeName")
    Array.from(XmlSpecTypeDocument[0].children,
        classDocument => {
            if( isResourceClass(classDocument) )
                specifResourceClassesArray.push(extractElementClass(classDocument));
        }
    );
    return specifResourceClassesArray;

    function isResourceClass(classDocument) {
        return classDocument.nodeName === 'SPEC-OBJECT-TYPE' || classDocument.nodeName === 'SPECIFICATION-TYPE'
    }
}
function extractStatementClassesFromXmlDoc(XmlSpecTypeDocument) {
    if (XmlSpecTypeDocument.length<1) return [];
    let specifStatementClassesArray = [];
    // consider to use .querySelectorAll("nodeName")
    Array.from(XmlSpecTypeDocument[0].children,
        classDocument => {
            if( isStatementClass(classDocument) )
                specifStatementClassesArray.push(extractElementClass(classDocument));
        }
    );
    return specifStatementClassesArray;
    
    function isStatementClass(classDocument) {
        return classDocument.nodeName === 'SPEC-RELATION-TYPE';
    //    return classDocument.nodeName === 'SPEC-RELATION-TYPE' || classDocument.nodeName === 'RELATION-GROUP-TYPE';
    }
}
function extractElementClass(classDocument) {
    // for both resourceClasses and statementClasses:
    const specIfElementClass = {};
    specIfElementClass.id = classDocument.getAttribute("IDENTIFIER");
//    specIfElementClass.title = classDocument.getAttribute("LONG-NAME");
    specIfElementClass.title = classDocument.getAttribute("LONG-NAME") || classDocument.getAttribute("IDENTIFIER");
    if( classDocument.getAttribute("DESC") ) 
        specIfElementClass.description = classDocument.getAttribute("DESC");
    if( classDocument.getElementsByTagName("SPEC-ATTRIBUTES")[0] )
        specIfElementClass.propertyClasses = extractPropertyClasses(classDocument.getElementsByTagName("SPEC-ATTRIBUTES"));
    specIfElementClass.changedAt = classDocument.getAttribute("LAST-CHANGE");
   
    return specIfElementClass;

    function extractPropertyClasses(propertyClassesDocument) {
        return Array.from( propertyClassesDocument[0].children, property => {return property.getAttribute("IDENTIFIER")} )
    }
}

function extractResourcesFromXmlDoc(XmlDocResources) {
    return XmlDocResources.length<1? [] : Array.from(XmlDocResources[0].children,extractResource);

    function extractResource(resourceDocument) {
        let specifResource = {};
        specifResource.id = resourceDocument.getAttribute("IDENTIFIER");
        //resourceDocument.getAttribute("LONG-NAME") ? specifResource.title = resourceDocument.getAttribute("LONG-NAME") : '';
        specifResource.title = resourceDocument.getAttribute("LONG-NAME") || resourceDocument.getAttribute("IDENTIFIER");
        specifResource['class'] = resourceDocument.getElementsByTagName("TYPE")[0].children[0].innerHTML;
        //resourceDocument.getElementsByTagName("VALUES")[0].childElementCount ? specifResource.properties = extractProperties(resourceDocument.getElementsByTagName("VALUES")) : '';
        let values = resourceDocument.getElementsByTagName("VALUES");
        if( values && values.length>0 ) 
            specifResource.properties = extractProperties(values);
        specifResource.changedAt = resourceDocument.getAttribute("LAST-CHANGE");
        
        return specifResource;
    }
}
function extractStatementsFromXmlDoc(XmlDocStatements) {
    return XmlDocStatements.length<1? [] : Array.from(XmlDocStatements[0].children,extractStatement);

    function extractStatement(statementDocument) {
        let specifStatement = {};
        specifStatement.id = statementDocument.getAttribute("IDENTIFIER");
        specifStatement['class'] = statementDocument.getElementsByTagName("TYPE")[0].children[0].innerHTML;
        specifStatement.subject = statementDocument.getElementsByTagName("SOURCE")[0].children[0].innerHTML;
        specifStatement.object = statementDocument.getElementsByTagName("TARGET")[0].children[0].innerHTML;
        let values = statementDocument.getElementsByTagName("VALUES");
        if( values && values.length>0 ) 
            specifStatement.properties = extractProperties(values);
        specifStatement.changedAt = statementDocument.getAttribute("LAST-CHANGE");
        
        return specifStatement;
    }
}
function extractProperties(specObjectsValuesDocument) {
    // used for OBJECTS as well as RELATIONS:
    return Array.from( specObjectsValuesDocument[0].children, extractSpecIfProperty );

    function extractSpecIfProperty(property) {
        let specifProperty = {};
    /*    // Provide the id, even though it is not required by SpecIF:
        // The attribute-value id is not required by ReqIF, 
        // ToDo: check wether it *may* be specified, at all ...  
        specifProperty.id = property.getAttribute("IDENTIFIER"); */
        specifProperty['class'] = property.getElementsByTagName("DEFINITION")[0].children[0].innerHTML;
	/*  ToDo: Check whether ReaIF ATTRIBUTES can have an individual LONG-NAME ..
        if( property.getAttribute("LONG-NAME") ) 
            specifProperty.title = options.translateTitle2Specif( property.getAttribute("LONG-NAME") ); */
        if( property.getAttribute("THE-VALUE") ) 
            specifProperty.value = property.getAttribute("THE-VALUE");
        // XHTML:
        else if( property.getElementsByTagName("THE-VALUE")[0] ) 
            specifProperty.value = removeNamespaces(property.getElementsByTagName("THE-VALUE")[0].innerHTML);
        // ENUMERATION:
        else if( property.getElementsByTagName("VALUES")[0] ) 
            specifProperty.value = property.getElementsByTagName("VALUES")[0].children[0].innerHTML;
        else
            console.error('ReqIF to SpecIF transformation: Attribute value of attribute '+property.getAttribute("IDENTIFIER")+' is missing.');
        
        return specifProperty;
    }
}

function extractHierarchiesFromXmlDoc(XmlDocSpecifications) {
    return Array.from(XmlDocSpecifications[0].getElementsByTagName("SPECIFICATION"),extractRootNode);

    function extractRootNode(specificationDocument) {
        let specIfRootNode = {};
        specIfRootNode.resource = specificationDocument.getAttribute("IDENTIFIER");
        specIfRootNode.id = "HR-" + specIfRootNode.resource;
        //console.log( specIfRootNode.id)
        specIfRootNode.changedAt = specificationDocument.getAttribute("LAST-CHANGE");
        specIfRootNode.nodes = extractSpecIfSubNodes(specificationDocument)
        return specIfRootNode;

        function extractSpecIfSubNodes(rootElement) {
            let specifNodesArray = [];
            const childrenDocElement = getChildNodeswithTag(rootElement, "CHILDREN")[0];
            if(childrenDocElement != undefined){
                specifNodesArray = Array.from(childrenDocElement.children,extractSpecIfHierarchy)
            };
            return specifNodesArray;

            function getChildNodeswithTag(parentDocument, nodeName) {
                return Array.from(parentDocument.children).filter(element => {return element.nodeName == nodeName});
            }
            function extractSpecIfHierarchy(hierarchyDocument) {
                let specIfHierarchy = {};
                specIfHierarchy.id = hierarchyDocument.getAttribute("IDENTIFIER");
                specIfHierarchy.resource = hierarchyDocument.getElementsByTagName("OBJECT")[0].firstElementChild.innerHTML;
                specIfHierarchy.changedAt = hierarchyDocument.getAttribute("LAST-CHANGE");
                
                let specifSubnodesArray = extractSpecIfSubNodes(hierarchyDocument);
                if( specifSubnodesArray.length>0 ) 
                    specIfHierarchy.nodes = specifSubnodesArray;
                
                return specIfHierarchy;
            }
        }
    }
}
function extractXmlDocFromString(string) {
    const parser = new DOMParser();
    return parser.parseFromString(string,"text/xml");
}


/* 
##########################################################################
########################## Tools #########################################  
*/
/*
//      (xmlns:.*?=)\\".*?\\" Regular Expression to match namespace links (at beginning)
String.prototype.removeNamespaces = function(){
    if( this ) return this.replace( /(xmlns:.*?=)\\".*?\\"/g, '' ); 
    return;
};
String.prototype.removeNamespaces = function(){
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
function removeNamespaces(input) {
    const RE_NS_LINK = /\sxmlns:(.*?)=\".*?\"/
    let namespace = getNameSpace(RE_NS_LINK, input);
    let string = input.replace(RE_NS_LINK, '' ); 
    //string = string.replaceAll(namespace, '')
    const RE_namespace = new RegExp(namespace, 'g' )
    string = string.replace(RE_namespace, '');
//  console.log(string)
    return string;
}
function getNameSpace(regEX, string) {
    let namespace = '';
    string = string.replace(regEX, function($0, $1){
        //console.log("$1:" + $1)
        namespace = $1 + ":";
        return ''
    });
//  console.log("Namespace: " + namespace)
    return namespace;
}
}
