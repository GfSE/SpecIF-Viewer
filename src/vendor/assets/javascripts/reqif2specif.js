/*! 
    ReqIF to SpecIF Transformation
    (C)copyright adesso SE, enso managers gmbh (http://www.enso-managers.de)
    Author: jasmin.droescher@adesso.de, se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de 
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)

    ToDo:
    - transform RELATION-GROUP-TYPES and RELATION-GROUPS
    - extract default values
*/

/*
########################## Main #########################################
*/
function transformReqif2Specif(reqifDoc,options) {
	const RE_NS_LINK = /\sxmlns:(.*?)=\".*?\"/;
	
    if( typeof(options)!='object' ) options = {};

    const xmlDoc = parse(reqifDoc);

    var xhr;
    if (validateReqif(xmlDoc))
        xhr = { status: 0, statusText: "ReqIF data is valid" }
    else
        xhr = options.errInvalidReqif || { status: 899, statusText: "ReqIF data is invalid" };

    if (xhr.status == 0) {
        // Transform ReqIF data provided as an XML string to SpecIF data.
        xhr.response = extractMetaData(xmlDoc.getElementsByTagName("REQ-IF-HEADER"));
        xhr.response.dataTypes = extractDatatypes(xmlDoc.getElementsByTagName("DATATYPES"));
        xhr.response.propertyClasses = extractPropertyClasses(xmlDoc.getElementsByTagName("SPEC-TYPES"));
        xhr.response.resourceClasses = extractResourceClasses(xmlDoc.getElementsByTagName("SPEC-TYPES"));
        xhr.response.statementClasses = extractStatementClasses(xmlDoc.getElementsByTagName("SPEC-TYPES"));
        xhr.response.resources = extractResources(xmlDoc.getElementsByTagName("SPEC-OBJECTS"))
            // ReqIF hierarchy roots are SpecIF resouces:
            .concat(extractResources(xmlDoc.getElementsByTagName("SPECIFICATIONS")));
        xhr.response.statements = extractStatements(xmlDoc.getElementsByTagName("SPEC-RELATIONS"));
        xhr.response.hierarchies = extractHierarchies(xmlDoc.getElementsByTagName("SPECIFICATIONS"));
    };

    // get project title from hierarchy roots in case of default;
    // for example the ReqIF exports from Cameo do not have a TITLE:
    if (!xhr.response.title) {
        let ti = '', r;
        xhr.response.hierarchies.forEach((h) => {
            r = itemById(xhr.response.resources, h.resource);
            ti += (ti.length > 0 ? ', ' : '') + r.title;
        });
        xhr.response.title = ti;
        console.info('Project title assembled from ReqIF SPECIFICATION roots');
    };

//  console.info(xhr);
    return xhr;

/*
########################## Subroutines #########################################
*/
function validateReqif(xml) {
    return xml.getElementsByTagName("REQ-IF-HEADER").length > 0
        && xml.getElementsByTagName("REQ-IF-CONTENT").length > 0;
}
function extractMetaData(header) {
    return (header.length < 1 ? {} : {
        id: header[0].getAttribute("IDENTIFIER"),
        title: header[0].getElementsByTagName("TITLE")[0] && header[0].getElementsByTagName("TITLE")[0].innerHTML,
        description: header[0].getElementsByTagName("COMMENT")[0] && header[0].getElementsByTagName("COMMENT")[0].innerHTML || '',
        generator: 'reqif2specif',
        $schema: "https://specif.de/v1.0/schema.json",
        createdAt: header[0].getElementsByTagName("CREATION-TIME")[0].innerHTML
    });
};
function extractDatatypes(xmlDatatypes) {
    return xmlDatatypes.length<1? [] : Array.from(xmlDatatypes[0].children, extractDatatype );

    function extractDatatype(datatype) {
        let specifDatatype = {
            id: datatype.getAttribute("IDENTIFIER"),
            type: getTypeOfDatatype(datatype),
            title: datatype.getAttribute("LONG-NAME") || '',
            description: datatype.getAttribute("DESC") || '',
            changedAt: datatype.getAttribute("LAST-CHANGE") || ''
        };
        if( datatype.getAttribute("MIN") ) specifDatatype.minInclusive = Number(datatype.getAttribute("MIN"));
        if( datatype.getAttribute("MAX") ) specifDatatype.maxInclusive = Number(datatype.getAttribute("MAX"));
        if( datatype.getAttribute("MAX-LENGTH") ) specifDatatype.maxLength = Number(datatype.getAttribute("MAX-LENGTH"));
        if( datatype.getAttribute("ACCURACY") ) specifDatatype.fractionDigits = Number(datatype.getAttribute("ACCURACY"));
        if( datatype.childElementCount>0 ) specifDatatype.values = extractDataTypeValues(datatype.children);

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
                title: entry[1].title,
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
            let attributeDefinition = specTypesDocument.getElementsByTagName(nodeName),
                attributeDefinitionMap = {};

            Array.from(attributeDefinition).forEach(definition => {
                attributeDefinitionMap[definition.getAttribute("IDENTIFIER")] =
                    {
                        title: definition.getAttribute("LONG-NAME"),
                        dataType: definition.children[0].children[0].innerHTML,
                        changedAt: definition.getAttribute("LAST-CHANGE"),
                    };

                // Enumerations have an optional attribute MULTI-VALUED:  
                if (nodeName == "ATTRIBUTE-DEFINITION-ENUMERATION") {
                    let multiple = definition.getAttribute("MULTI-VALUED");
                    if (multiple && multiple.toLowerCase() == 'true')
                        attributeDefinitionMap[definition.getAttribute("IDENTIFIER")].multiple = true;
                }
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
            switch (xmlSpecType.nodeName) {
                case 'SPECIFICATION-TYPE':
                case 'SPEC-OBJECT-TYPE':
                    specifResourceClasses.push(extractElementClass(xmlSpecType));
            }
        }
    );
    return specifResourceClasses;
}
function extractStatementClasses(xmlSpecTypes) {
    if (xmlSpecTypes.length<1) return [];
    let specifStatementClasses = [];
    // consider to use .querySelectorAll("nodeName")
    Array.from(xmlSpecTypes[0].children,
        xmlSpecType => {
            switch (xmlSpecType.nodeName) {
            //  case 'RELATION-GROUP-TYPE':
                case 'SPEC-RELATION-TYPE':
                    specifStatementClasses.push(extractElementClass(xmlSpecType));
            }
        }
    );
    return specifStatementClasses;
}
function extractElementClass(xmlSpecType) {
    // for both resourceClasses and statementClasses:
    const specifElementClass = {
        id: xmlSpecType.getAttribute("IDENTIFIER"),
        title: xmlSpecType.getAttribute("LONG-NAME") || xmlSpecType.getAttribute("IDENTIFIER"),
        changedAt: xmlSpecType.getAttribute("LAST-CHANGE")
    };
    if( xmlSpecType.getAttribute("DESC") ) 
        specifElementClass.description = xmlSpecType.getAttribute("DESC");
    if( xmlSpecType.getElementsByTagName("SPEC-ATTRIBUTES")[0] )
        specifElementClass.propertyClasses = extractPropertyClassReferences(xmlSpecType.getElementsByTagName("SPEC-ATTRIBUTES"));
   
    return specifElementClass;

    function extractPropertyClassReferences(propertyClassesDocument) {
        return Array.from( propertyClassesDocument[0].children, property => {return property.getAttribute("IDENTIFIER")} )
    }
}

function extractResources(xmlSpecObjects) {
    return xmlSpecObjects.length<1? [] : Array.from(xmlSpecObjects[0].children,extractResource);

    function extractResource(xmlSpecObject) {
        let specifResource = {
            id: xmlSpecObject.getAttribute("IDENTIFIER"),
            title: xmlSpecObject.getAttribute("LONG-NAME") || xmlSpecObject.getAttribute("IDENTIFIER"),
            changedAt: xmlSpecObject.getAttribute("LAST-CHANGE")
        };
        specifResource['class'] = xmlSpecObject.getElementsByTagName("TYPE")[0].children[0].innerHTML;
        //xmlSpecObject.getElementsByTagName("VALUES")[0].childElementCount ? specifResource.properties = extractProperties(xmlSpecObject.getElementsByTagName("VALUES")) : '';
        let values = xmlSpecObject.getElementsByTagName("VALUES");
        specifResource.properties = extractProperties(values);
        
        return specifResource;
    }
}
function extractStatements(xmlSpecRelations) {
    return xmlSpecRelations.length<1? [] : Array.from(xmlSpecRelations[0].children,extractStatement);

    function extractStatement(xmlSpecRelation) {
        let specifStatement = {
            id: xmlSpecRelation.getAttribute("IDENTIFIER"),
            subject: xmlSpecRelation.getElementsByTagName("SOURCE")[0].children[0].innerHTML,
            object: xmlSpecRelation.getElementsByTagName("TARGET")[0].children[0].innerHTML,
            changedAt: xmlSpecRelation.getAttribute("LAST-CHANGE")
        };
        specifStatement['class'] = xmlSpecRelation.getElementsByTagName("TYPE")[0].children[0].innerHTML;
        let values = xmlSpecRelation.getElementsByTagName("VALUES");
        specifStatement.properties = extractProperties(values);
        
        return specifStatement;
    }
}
function extractProperties(specAttributes) {
    // used for OBJECTS as well as RELATIONS:
    if ( specAttributes.length<1 ) return [];
	let list = [];
	// Only add a SpecIF property, if it has a value:
    Array.from( specAttributes[0].children, (prp)=>{ let p=extractSpecIfProperty(prp); if(p.value) list.push(p)} );
	return list;

    function extractSpecIfProperty(property) {
        let specifProperty = {}, pC, dT;
        /*  // Provide the id, even though it is not required by SpecIF:
            // The attribute-value id is not required by ReqIF, 
            // ToDo: check wether it *may* be specified, at all ...  
            specifProperty.id = property.getAttribute("IDENTIFIER"); */
        specifProperty['class'] = property.getElementsByTagName("DEFINITION")[0].children[0].innerHTML;

        //  ToDo: Check whether ReqIF ATTRIBUTES can have an individual LONG-NAME ..

        if (property.getAttribute("THE-VALUE")) {
            specifProperty.value = property.getAttribute("THE-VALUE");

            pC = itemById(xhr.response.propertyClasses, specifProperty['class']);
            dT = itemById(xhr.response.dataTypes, pC.dataType);
//          console.debug('maxL', dT, pC, specifProperty.value, specifProperty.value.length);
            if( typeof(dT.maxLength)=='number' && dT.maxLength < specifProperty.value.length ) {
                console.warn("Truncated ReqIF Attribute with value '" + specifProperty.value + "' to the specified maxLength of " + dT.maxLength + " characters");
                specifProperty.value = specifProperty.value.substring(0, dT.maxLength);
            };
        }
        // XHTML:
        else if( property.getElementsByTagName("THE-VALUE")[0] ) 
            specifProperty.value = removeNamespace(property.getElementsByTagName("THE-VALUE")[0].innerHTML);
        // ENUMERATION:
        else if (property.getElementsByTagName("VALUES")[0]) {
            specifProperty.value = '';
            Array.from(property.getElementsByTagName("VALUES")[0].children, (ch) => { specifProperty.value += (specifProperty.value.length > 0 ? ',' : '') + ch.innerHTML });
        };
        return specifProperty;
    }
}

function extractHierarchies(xmlSpecifications) {
    return xmlSpecifications.length < 1 ? [] : Array.from(xmlSpecifications[0].getElementsByTagName("SPECIFICATION"),extractRootNode);

    function extractRootNode(xmlSpecification) {
        let rId = xmlSpecification.getAttribute("IDENTIFIER");
        return {
            id: "HR-" + rId,
            resource: rId,
            changedAt: xmlSpecification.getAttribute("LAST-CHANGE"),
            nodes: extractSpecIfSubNodes(xmlSpecification)
        };

        function extractSpecIfSubNodes(rootElement) {
            let specifNodesArray = [];
            const childrenDocElement = getChildNodeswithTag(rootElement, "CHILDREN")[0];
            if(childrenDocElement != undefined){
                specifNodesArray = Array.from(childrenDocElement.children,extractSpecifNode)
            };
            return specifNodesArray;

            function getChildNodeswithTag(parentDocument, nodeName) {
                return Array.from(parentDocument.children).filter(element => {return element.nodeName == nodeName});
            }
            function extractSpecifNode(hierarchyDocument) {
                let specifHierarchy = {
                    id: hierarchyDocument.getAttribute("IDENTIFIER"),
                    resource: hierarchyDocument.getElementsByTagName("OBJECT")[0].firstElementChild.innerHTML,
                    changedAt: hierarchyDocument.getAttribute("LAST-CHANGE")
                };
                
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
    function itemById(L, id) {
        if (L && id) {
            // given an ID of an item in a list, return it's index:
            id = id.trim();
            for (var i = L.length - 1; i > -1; i--)
                if (L[i].id == id) return L[i]   // return list item
        };
    }
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
}
