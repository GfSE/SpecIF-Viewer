/*! 
    ReqIF to SpecIF Transformation
    (C)copyright adesso SE, enso managers gmbh (http://www.enso-managers.de)
    Author: jasmin.droescher@adesso.de, se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de 
    .. or even better as Github issue (https://github.com/GfSE/ReqIF-SpecIF-Bridge/issues)

    ToDo:
    - transform RELATION-GROUP-TYPES and RELATION-GROUPS
    - extract default values
*/

/*
########################## Main #########################################
*/
function transformReqif2Specif(reqifDocument,options) {
	const RE_DateTime = /[0-9-]{4,}(T[0-9:]{2,}(\.[0-9]+)?)?(Z|\+[0-9:]{2,}|\-[0-9:]{2,})?/,
		RE_NS_LINK = /\sxmlns:(.*?)=\".*?\"/;
	
    if( typeof(options)!='object' ) options = {};
    if( typeof(options.translateTitle2Specif)!='function' ) options.translateTitle2Specif = function(ti) {return ti};
	
	// Transform ReqIF data provided as an XML string to SpecIF data.
    const xmlDoc = parse(reqifDocument);
    let specifData = extractMetaData(xmlDoc.getElementsByTagName("REQ-IF-HEADER"));
    specifData.dataTypes = extractDatatypes(xmlDoc.getElementsByTagName("DATATYPES"));
    specifData.propertyClasses = extractPropertyClasses(xmlDoc.getElementsByTagName("SPEC-TYPES"));
    specifData.resourceClasses = extractResourceClasses(xmlDoc.getElementsByTagName("SPEC-TYPES"));
    specifData.statementClasses = extractStatementClasses(xmlDoc.getElementsByTagName("SPEC-TYPES"));
    specifData.resources = extractResources(xmlDoc.getElementsByTagName("SPEC-OBJECTS"))
							// ReqIF hierarchy roots are SpecIF resouces:
							.concat(extractResources(xmlDoc.getElementsByTagName("SPECIFICATIONS")));
    specifData.statements = xmlDoc.getElementsByTagName("SPEC-RELATIONS")[0] ? extractStatements(xmlDoc.getElementsByTagName("SPEC-RELATIONS")) : [];
    specifData.hierarchies = xmlDoc.getElementsByTagName("SPECIFICATIONS")[0] ? extractHierarchies(xmlDoc.getElementsByTagName("SPECIFICATIONS")) : [];
    
//  console.info(specifData);
    return specifData;

/*
########################## Subroutines #########################################
*/
function extractMetaData(header) {
    if (header.length<1) return {};
    let specifHeader = {};
    specifHeader.id = header[0].getAttribute("IDENTIFIER");
    specifHeader.title = header[0].getElementsByTagName("TITLE")[0] && header[0].getElementsByTagName("TITLE")[0].innerHTML;
    specifHeader.description = header[0].getElementsByTagName("COMMENT")[0] && header[0].getElementsByTagName("COMMENT")[0].innerHTML || '';
    specifHeader.generator = 'reqif2specif';

    specifHeader.$schema = "https://specif.de/v1.0/schema.json";
    specifHeader.createdAt = addTimezoneIfMissing(header[0].getElementsByTagName("CREATION-TIME")[0].innerHTML); 
    
    return specifHeader;
};
function extractDatatypes(xmlDatatypes) {
    return xmlDatatypes.length<1? [] : Array.from(xmlDatatypes[0].children, extractDatatype );

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
        specifDatatype.changedAt = addTimezoneIfMissing(datatype.getAttribute("LAST-CHANGE") || '');

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

function extractPropertyClasses(xmlSpecTypes) {
    const specAttributesMap = extractSpecAttributesMap(xmlSpecTypes[0]);                                 
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
                                                                                changedAt: addTimezoneIfMissing(definition.getAttribute("LAST-CHANGE")),
                                                                            } 
                // Enumerations have an optional attribute MULTI-VALUED                                                 
                if( definition.getAttribute("MULTI-VALUED") )
                    attributeDefinitionMap[definition.getAttribute("IDENTIFIER")].multiple=true;
            });
            return attributeDefinitionMap;
        }
    }
}

function extractResourceClasses(xmlSpecTypes) {
    if (xmlSpecTypes.length<1) return [];
    const specifResourceClasses = [];
    // consider to use .querySelectorAll("nodeName")
    Array.from(xmlSpecTypes[0].children,
        xmlSpecType => {
            if( isResourceClass(xmlSpecType) )
                specifResourceClasses.push(extractElementClass(xmlSpecType));
        }
    );
    return specifResourceClasses;

    function isResourceClass(xmlSpecType) {
        return xmlSpecType.nodeName === 'SPEC-OBJECT-TYPE' || xmlSpecType.nodeName === 'SPECIFICATION-TYPE'
    }
}
function extractStatementClasses(xmlSpecTypes) {
    if (xmlSpecTypes.length<1) return [];
    let specifStatementClasses = [];
    // consider to use .querySelectorAll("nodeName")
    Array.from(xmlSpecTypes[0].children,
        xmlSpecType => {
            if( isStatementClass(xmlSpecType) )
                specifStatementClasses.push(extractElementClass(xmlSpecType));
        }
    );
    return specifStatementClasses;
    
    function isStatementClass(xmlSpecType) {
        return xmlSpecType.nodeName === 'SPEC-RELATION-TYPE';
    //    return xmlSpecType.nodeName === 'SPEC-RELATION-TYPE' || xmlSpecType.nodeName === 'RELATION-GROUP-TYPE';
    }
}
function extractElementClass(xmlSpecType) {
    // for both resourceClasses and statementClasses:
    const specifElementClass = {};
    specifElementClass.id = xmlSpecType.getAttribute("IDENTIFIER");
//    specifElementClass.title = xmlSpecType.getAttribute("LONG-NAME");
    specifElementClass.title = xmlSpecType.getAttribute("LONG-NAME") || xmlSpecType.getAttribute("IDENTIFIER");
    if( xmlSpecType.getAttribute("DESC") ) 
        specifElementClass.description = xmlSpecType.getAttribute("DESC");
    if( xmlSpecType.getElementsByTagName("SPEC-ATTRIBUTES")[0] )
        specifElementClass.propertyClasses = extractPropertyClassReferenceses(xmlSpecType.getElementsByTagName("SPEC-ATTRIBUTES"));
    specifElementClass.changedAt = addTimezoneIfMissing(xmlSpecType.getAttribute("LAST-CHANGE"));
   
    return specifElementClass;

    function extractPropertyClassReferenceses(propertyClassesDocument) {
        return Array.from( propertyClassesDocument[0].children, property => {return property.getAttribute("IDENTIFIER")} )
    }
}

function extractResources(xmlSpecObjects) {
    return xmlSpecObjects.length<1? [] : Array.from(xmlSpecObjects[0].children,extractResource);

    function extractResource(xmlSpecObject) {
        let specifResource = {};
        specifResource.id = xmlSpecObject.getAttribute("IDENTIFIER");
        //xmlSpecObject.getAttribute("LONG-NAME") ? specifResource.title = xmlSpecObject.getAttribute("LONG-NAME") : '';
        specifResource.title = xmlSpecObject.getAttribute("LONG-NAME") || xmlSpecObject.getAttribute("IDENTIFIER");
        specifResource['class'] = xmlSpecObject.getElementsByTagName("TYPE")[0].children[0].innerHTML;
        //xmlSpecObject.getElementsByTagName("VALUES")[0].childElementCount ? specifResource.properties = extractProperties(xmlSpecObject.getElementsByTagName("VALUES")) : '';
        let values = xmlSpecObject.getElementsByTagName("VALUES");
        if( values && values.length>0 ) 
            specifResource.properties = extractProperties(values);
        specifResource.changedAt = addTimezoneIfMissing(xmlSpecObject.getAttribute("LAST-CHANGE"));
        
        return specifResource;
    }
}
function extractStatements(xmlSpecRelations) {
    return xmlSpecRelations.length<1? [] : Array.from(xmlSpecRelations[0].children,extractStatement);

    function extractStatement(xmlSpecRelation) {
        let specifStatement = {};
        specifStatement.id = xmlSpecRelation.getAttribute("IDENTIFIER");
        specifStatement['class'] = xmlSpecRelation.getElementsByTagName("TYPE")[0].children[0].innerHTML;
        specifStatement.subject = xmlSpecRelation.getElementsByTagName("SOURCE")[0].children[0].innerHTML;
        specifStatement.object = xmlSpecRelation.getElementsByTagName("TARGET")[0].children[0].innerHTML;
        let values = xmlSpecRelation.getElementsByTagName("VALUES");
        if( values && values.length>0 ) 
            specifStatement.properties = extractProperties(values);
        specifStatement.changedAt = addTimezoneIfMissing(xmlSpecRelation.getAttribute("LAST-CHANGE"));
        
        return specifStatement;
    }
}
function extractProperties(specObjectsValuesDocument) {
    // used for OBJECTS as well as RELATIONS:
	let list = [];
	// Only add a SpecIF property, if it has a value:
    Array.from( specObjectsValuesDocument[0].children, (prp)=>{ let p=extractSpecIfProperty(prp); if(p.value) list.push(p)} );
	return list;

    function extractSpecIfProperty(property) {
        let specifProperty = {};
    /*  // Provide the id, even though it is not required by SpecIF:
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
            specifProperty.value = removeNamespace(property.getElementsByTagName("THE-VALUE")[0].innerHTML);
        // ENUMERATION:
        else if( property.getElementsByTagName("VALUES")[0] ) 
            specifProperty.value = property.getElementsByTagName("VALUES")[0].children[0].innerHTML;
        else
            console.error('ReqIF to SpecIF transformation: Attribute value of attribute '+property.getAttribute("IDENTIFIER")+' is missing.');
        
        return specifProperty;
    }
}

function extractHierarchies(xmlSpecifications) {
    return Array.from(xmlSpecifications[0].getElementsByTagName("SPECIFICATION"),extractRootNode);

    function extractRootNode(xmlSpecification) {
        let specifRootNode = {};
        specifRootNode.resource = xmlSpecification.getAttribute("IDENTIFIER");
        specifRootNode.id = "HR-" + specifRootNode.resource;
        //console.log( specifRootNode.id)
        specifRootNode.changedAt = addTimezoneIfMissing(xmlSpecification.getAttribute("LAST-CHANGE"));
        specifRootNode.nodes = extractSpecIfSubNodes(xmlSpecification)
        return specifRootNode;

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
                let specifHierarchy = {};
                specifHierarchy.id = hierarchyDocument.getAttribute("IDENTIFIER");
                specifHierarchy.resource = hierarchyDocument.getElementsByTagName("OBJECT")[0].firstElementChild.innerHTML;
                specifHierarchy.changedAt = addTimezoneIfMissing(hierarchyDocument.getAttribute("LAST-CHANGE"));
                
                let specifSubnodesArray = extractSpecIfSubNodes(hierarchyDocument);
                if( specifSubnodesArray.length>0 ) 
                    specifHierarchy.nodes = specifSubnodesArray;
                
                return specifHierarchy;
            }
        }
    }
}
function parse(string) {
    const parser = new DOMParser();
    return parser.parseFromString(string,"text/xml");
}


/* 
########################## Tools #########################################  
*/
    /*
    //      (xmlns:.*?=)\\".*?\\" Regular Expression to match namespace links (at beginning)
    String.prototype.removeNamespace = function(){
        if( this ) return this.replace( /(xmlns:.*?=)\\".*?\\"/g, '' ); 
        return;
    };*/
    function removeNamespace(input) {
        let namespace = getNameSpace(RE_NS_LINK, input);
        let string = input.replace(RE_NS_LINK, '' ); 
        //string = string.replaceAll(namespace, '')
        const RE_namespace = new RegExp(namespace, 'g' )
        string = string.replace(RE_namespace, '');
        return string;

	    function getNameSpace(regEX, string) {
		    let namespace = '';
		    string = string.replace(regEX, function($0, $1){
			    namespace = $1 + ":";
			    return ''
		    });
		    return namespace;
	    }
    }
    function addTimezoneIfMissing(dt) {
	    if( dt ) {
            let match = RE_DateTime.exec(dt);
            // ReqIF data generated by PTC Integrity has been observed to have timestamps without timezone.
		    // If date and time are specified, but no timezone, add "Z" for Greenwich time:
		    if( match[0] && match[1] && !match[3] ) {
			    console.info("ReqIF to SpecIF transformation: Added missing time-zone to "+dt);
			    return dt + "Z";
		    };
	    };
	    return dt;
    }
}
