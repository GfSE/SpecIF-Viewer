"use strict";
/*!	Standard type definitions with methods.
    Dependencies: -
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    Author: se@enso-managers.com, Berlin
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/
class CStandards {
    constructor() {
        this.listName = new Map([
            ['dataType', "dataTypes"],
            ['propertyClass', "propertyClasses"],
            ['resourceClass', "resourceClasses"],
            ['statementClass', "statementClasses"],
            ['file', "files"],
            ['resource', "resources"],
            ['statement', "statements"],
            ['hierarchy', "hierarchies"]
        ]);
    }
    ;
    iterateLists(fn) {
        for (var ctg of this.listName.keys())
            fn(ctg, this.listName.get(ctg));
        return this.listName.size;
    }
    titleLinkTargets() {
        return app.ontology.modelElementClasses
            .concat(CONFIG.diagramClasses)
            .concat(CONFIG.folderClasses)
            .concat(app.ontology.termClasses);
    }
}
;
CONFIG.propClassId = "dcterms:identifier";
CONFIG.propClassTerm = "SpecIF:Term";
CONFIG.propClassTitle = "dcterms:title";
CONFIG.propClassDesc = "dcterms:description";
CONFIG.propClassType = "dcterms:type";
CONFIG.propClassLifecycleStatus = 'SpecIF:LifecycleStatus';
CONFIG.propClassDomain = "SpecIF:Domain";
CONFIG.propClassDiagram = 'SpecIF:Diagram';
CONFIG.resClassDiagram = 'SpecIF:View';
CONFIG.resClassXlsRow = 'XLS:Resource';
CONFIG.resClassUnreferencedResources = "SpecIF:UnreferencedResources";
CONFIG.resClassOutline = 'SpecIF:Outline';
CONFIG.resClassGlossary = 'SpecIF:Glossary';
CONFIG.resClassOntology = "W3C:Ontology";
CONFIG.resClassProcess = 'SpecIF:BusinessProcess';
CONFIG.resClassProcesses = 'SpecIF:BusinessProcesses';
CONFIG.resClassCondition = "SpecIF:Condition";
CONFIG.resClassRole = "SpecIF:Role";
CONFIG.resClassFolder = 'SpecIF:Heading';
CONFIG.resClassParagraph = "SpecIF:Paragraph";
CONFIG.resClassComment = 'SpecIF:Comment';
CONFIG.hierarchyRoot = 'ReqIF:HierarchyRoot';
CONFIG.staClassShows = 'SpecIF:shows';
CONFIG.staClassCommentRefersTo = 'SpecIF:commentRefersTo';
CONFIG.staClassMentions = 'SpecIF:mentions';
CONFIG.prefixDT = "DT-";
CONFIG.prefixPC = "PC-";
CONFIG.prefixRC = "RC-";
CONFIG.prefixSC = "SC-";
CONFIG.prefixHC = "HC-";
CONFIG.prefixHR = "HR-";
CONFIG.prefixR = "R-";
CONFIG.prefixS = "S-";
CONFIG.prefixH = "H-";
CONFIG.prefixN = "N-";
CONFIG.prefixV = "V-";
CONFIG.idProperties = [
    'dcterms:identifier'
];
CONFIG.titleProperties = [
    CONFIG.propClassTitle,
    "dc:title",
    "schema:name",
    CONFIG.propClassTerm
];
CONFIG.descProperties = [
    CONFIG.propClassDesc,
    CONFIG.propClassDiagram,
    "dc:description"
];
CONFIG.commentProperties = [
    "ReqIF-WF.CustomerComment",
    "ReqIF-WF.SupplierComment",
    "SpecIF:Comment"
];
CONFIG.stereotypeProperties = [
    'uml:Stereotype'
];
CONFIG.hiddenProperties = [
    'VALUE_Table',
    'VALUE_TableType',
    'Table',
    'TableType',
    'PlainText',
    'implementerEnhanced',
    'ListNumberText'
];
CONFIG.hiddenStatements = [
    CONFIG.staClassCommentRefersTo
];
CONFIG.excludedFromTypeFiltering = [
    CONFIG.resClassComment
];
CONFIG.excludedFromFormatting = [
    CONFIG.propClassType,
    "SpecIF:Notation"
]
    .concat(CONFIG.titleProperties)
    .concat(CONFIG.idProperties);
CONFIG.excludedFromDeduplication = [
    CONFIG.resClassFolder,
    CONFIG.resClassParagraph,
    CONFIG.resClassDiagram,
    CONFIG.resClassCondition,
    "uml:Port",
    'bpmn:parallelGateway',
    'bpmn:exclusiveGateway',
    'bpmn:inclusiveGateway',
    "bpmn:eventBasedGateway",
    'bpmn:boundaryEvent',
    'bpmn:intermediateThrowEvent',
    'bpmn:intermediateCatchEvent',
    'bpmn:callActivity',
    "ArchiMate:OrJunction",
    "ArchiMate:AndJunction"
];
CONFIG.clickableModelElements = true;
CONFIG.clickElementClasses = [
    'clickEl',
    'com.arcway.cockpit.uniqueelement'
];
CONFIG.selectCorrespondingDiagramFirst = true;
CONFIG.diagramTypesHavingShowsStatementsForEdges = [
    CONFIG.resClassProcess,
    "ArchiMate:Viewpoint"
];
CONFIG.diagramClasses = [
    CONFIG.resClassDiagram,
    CONFIG.resClassProcess,
    "ArchiMate:Viewpoint",
    "FMC:Plan"
];
CONFIG.folderClasses = [
    CONFIG.resClassOutline,
    CONFIG.resClassFolder
];
CONFIG.nativeProperties = new Map([
    ["dcterms:created", { name: "createdAt", type: "xs:dateTime", check: function (val) { return val.length > 0 && LIB.isIsoDateTime(val); } }],
    ["SpecIF:createdAt", { name: "createdAt", type: "xs:dateTime", check: function (val) { return val.length > 0 && LIB.isIsoDateTime(val); } }],
    ["dcterms:modified", { name: "changedAt", type: "xs:dateTime", check: function (val) { return val.length > 0 && LIB.isIsoDateTime(val); } }],
    ["SpecIF:changedAt", { name: "changedAt", type: "xs:dateTime", check: function (val) { return val.length > 0 && LIB.isIsoDateTime(val); } }],
    ["dcterms:creator", { name: "createdBy", type: "xs:string", check: function () { return true; } }],
    ["SpecIF:createdBy", { name: "createdBy", type: "xs:string", check: function () { return true; } }],
    ["SpecIF:changedBy", { name: "changedBy", type: "xs:string", check: function () { return true; } }]
]);
CONFIG.valuesTrue = ['true', 'yes', 'wahr', 'ja', 'vrai', 'oui', '1', 'True'];
CONFIG.valuesFalse = ['false', 'no', 'falsch', 'nein', 'faux', 'non', '0', 'False'];
