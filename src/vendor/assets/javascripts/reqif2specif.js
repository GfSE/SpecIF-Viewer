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
	
    if (typeof (options) != 'object') options = {};
    if (!options.propType) options.propType = "ReqIF.Category";  // the type/category of a resource, e.g. folder or diagram.
    if (!options.prefixN) options.prefixN = "N-";

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
        xhr.response.resourceClasses = extractElementClasses(xmlDoc.getElementsByTagName("SPEC-TYPES"), ['SPECIFICATION-TYPE','SPEC-OBJECT-TYPE']);
        xhr.response.statementClasses = extractElementClasses(xmlDoc.getElementsByTagName("SPEC-TYPES"), [/*'RELATION-GROUP-TYPE',*/'SPEC-RELATION-TYPE']);
        xhr.response.resources = extractResources("SPEC-OBJECTS")
            // ReqIF hierarchy roots are SpecIF resouces:
            .concat(extractResources("SPECIFICATIONS"));
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
        // header.length>0 has been checked before: 
        let id = header[0].getAttribute("IDENTIFIER");
        return ({
            id: id,
            title: (header[0].getElementsByTagName("TITLE")[0] && header[0].getElementsByTagName("TITLE")[0].innerHTML) || id,
            description: header[0].getElementsByTagName("COMMENT")[0] && header[0].getElementsByTagName("COMMENT")[0].innerHTML || '',
            generator: 'reqif2specif',
            $schema: "https://specif.de/v1.0/schema.json",
            createdAt: header[0].getElementsByTagName("CREATION-TIME")[0].innerHTML
        })
    };
    function extractDatatypes(xmlDatatypes) {
        let specifDataTypes = xmlDatatypes.length < 1 ? [] : Array.from(xmlDatatypes[0].children, extractDatatype);
        return specifDataTypes;

        function extractDatatype(datatype) {
            let specifDatatype = {
                id: datatype.getAttribute("IDENTIFIER"),
                type: getTypeOfDatatype(datatype),
                title: datatype.getAttribute("LONG-NAME") || '',
                description: datatype.getAttribute("DESC") || '',
                changedAt: datatype.getAttribute("LAST-CHANGE") || ''
            };

            extr("MIN", "minInclusive");
            extr("MAX", "maxInclusive");
            extr("MAX-LENGTH", "maxLength");
            extr("ACCURACY", "fractionDigits");
            if (datatype.childElementCount > 0) specifDatatype.values = extractDataTypeValues(datatype.children);

            return specifDatatype;

            function extr(rqA,spP) {
                let val = datatype.getAttribute(rqA);
                if (val)
                    specifDatatype[spP] = Number(val)
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
                return Array.from(DataTypeValuesHtmlCollection[0].children, extractEnumValue);

                function extractEnumValue(ch) {
                    return {
                        id: ch.getAttribute("IDENTIFIER"),
                        value: ch.getAttribute("LONG-NAME") || '&#x00ab;undefined&#x00bb;'
                    }
                }
            }
        }
    };

    function pcTypeIdL(pCL) {
        // Return a list with all ids of propertyClasses defining the type/category;
        // there may be serveral, as the list of propertyClasses is not yet deduplicated:
        return pCL.filter(
                pC => pC.title == options.propType
            )
            .map(
                pC => pC.id
            )
    }
    function extractPropertyClasses(xmlSpecTypes) {
        const specAttributesMap = extractSpecAttributesMap(xmlSpecTypes[0]);
        let specifPropertyClasses = extractPropertyClassesFromSpecAttributeMap(specAttributesMap);

        // Look for a propertyClass defining the type/category:
        if (pcTypeIdL(specifPropertyClasses).length<1) {
            // 1. Add a dataType for the hierarchy type:
            xhr.response.dataTypes.push({
                id: "DT-ShortString-" + xhr.response.id,
                type: "xs:string",
                title: "String[256]",
                description: "String with length <=256",
                maxLength: 256,
                changedAt: new Date().toISOString()
            });
            // 2. Add a propertyClass for the hierarchy type, unless already present:
            specifPropertyClasses.push({
                id: "PC-Type-" + xhr.response.id,
                dataType: "DT-ShortString-" + xhr.response.id,
                title: options.propType,
                description: "The nature or genre of the resource.",
                changedAt: new Date().toISOString()
            });
        };
        return specifPropertyClasses;

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
                let attributeDefinitions = specTypesDocument.getElementsByTagName(nodeName),
                    attributeDefinitionMap = {};

                Array.from(attributeDefinitions).forEach(definition => {
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

    function extractElementClasses(xmlSpecTypes,subset) {
        if (xmlSpecTypes.length<1) return [];
        const specifElementClasses = [];
        // consider to use .querySelectorAll("nodeName")
        Array.from(xmlSpecTypes[0].children,
            xmlSpecType => {
                if (subset.includes(xmlSpecType.nodeName)) {
                    let elC = extractElementClass(xmlSpecType);

                    // Add a propertyClass for hierarchy type, unless already present:
                    if (xmlSpecType.nodeName == 'SPECIFICATION-TYPE') {
                        // Look for a propertyClass defining the type/category with value 'ReqIF:HierarchyRoot';
                        // there should be at least one:
                        let idL = pcTypeIdL(xhr.response.propertyClasses);
                        if (idL.length > 0) {
                            // Add the propertyClass as reference to the resourceClass, if missing:
                            Array.isArray(elC.propertyClasses) ?
                                addPcTypeIfMissing(elC.propertyClasses, idL)
                                : elC.propertyClasses = [idL[0]];
                        }
                        else
                            console.error("There is no propertyClass ");
                    };
                    specifElementClasses.push(elC)
                }
            }
        );
        return specifElementClasses;

        function addPcTypeIfMissing(pCL,idL) {
            for (pC of pCL) {
                if (idL.includes(pC.id)) return;
            };
            pCL.push(idL[0]);
        }
        function extractElementClass(xmlSpecType) {
            // for both resourceClasses and statementClasses:
            const specifElementClass = {
                id: xmlSpecType.getAttribute("IDENTIFIER"),
                title: xmlSpecType.getAttribute("LONG-NAME") || xmlSpecType.getAttribute("IDENTIFIER"),
                changedAt: xmlSpecType.getAttribute("LAST-CHANGE")
            };
            if (xmlSpecType.getAttribute("DESC"))
                specifElementClass.description = xmlSpecType.getAttribute("DESC");
            if (xmlSpecType.getElementsByTagName("SPEC-ATTRIBUTES")[0])
                specifElementClass.propertyClasses = extractPropertyClassReferences(xmlSpecType.getElementsByTagName("SPEC-ATTRIBUTES"));

            return specifElementClass;

            function extractPropertyClassReferences(propertyClassesDocument) {
                return Array.from(propertyClassesDocument[0].children, property => { return property.getAttribute("IDENTIFIER") })
            }
        }
    }

    function extractResources(tagName) {
        let xmlSpecObjects = xmlDoc.getElementsByTagName(tagName);
        return xmlSpecObjects.length<1? [] : Array.from(xmlSpecObjects[0].children,extractResource);

        function extractResource(xmlSpecObject) {
            let specifResource = {
                id: xmlSpecObject.getAttribute("IDENTIFIER"),
                title: xmlSpecObject.getAttribute("LONG-NAME") || "",
                changedAt: xmlSpecObject.getAttribute("LAST-CHANGE")
            };
            specifResource['class'] = xmlSpecObject.getElementsByTagName("TYPE")[0].children[0].innerHTML;
            let values = xmlSpecObject.getElementsByTagName("VALUES");
            // Get a list of properties with none, one or more items:
            specifResource.properties = extractProperties(values);  

            // a resource must have at least one property:
            if (!specifResource.title && specifResource.properties.length < 1)
                specifResource.title = specifResource.id;

            if (tagName == 'SPECIFICATIONS') {
                // The property defining the type of the hierarchy root to decide whether a hierarchy has a root or not;
                // as SpecIF data from other sources usually do not have an explicit root:
                let idL = pcTypeIdL(xhr.response.propertyClasses),
                    prp = {
                        class: idL[0],
                        value: "ReqIF:HierarchyRoot" // ReqIF root node with meta-data
                    };
                // Add type to properties, unless already present:
                let p = pType(idL);
                if (p)
                    p.value = prp.value
                else
                    specifResource.properties.push(prp)
            };

            return specifResource;

            function pType(L) {
                // Return the propertyClass defining the type/category:
                for (var p of specifResource.properties) {
                    if (L.includes(p['class'])) return p;
                };
                // return undefined;
            }
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
        // There is none or one element with tagname SPECIFICATIONS:
        return xmlSpecifications.length < 1 ? [] : Array.from(xmlSpecifications[0].getElementsByTagName("SPECIFICATION"),extractHierarchy);

        function extractHierarchy(xmlSpecification) {
            let hId = xmlSpecification.getAttribute("IDENTIFIER");
            return {
                id: options.prefixN + hId,
                resource: hId,
                changedAt: xmlSpecification.getAttribute("LAST-CHANGE"),
                nodes: extractNodes(xmlSpecification)
            };

            function extractNodes(rootElement) {
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
                
                    let specifSubnodesArray = extractNodes(hierarchyDocument);
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
