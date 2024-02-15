/*!	Standard type definitions with methods. 
	Dependencies: -
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	Author: se@enso-managers.com, Berlin
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/

class CStandards {
/*	// @ts-ignore - initialized below
	dataTypes: SpecifDataType[];
	// @ts-ignore - initialized below
	propertyClasses: SpecifPropertyClass[];
	// @ts-ignore - initialized below
	resourceClasses: SpecifResourceClass[]; */
	constructor() {
/*		// Get all classes of the domain 'Base':
		let oC = app.ontology.generateSpecifClasses({ domains: ['Base'], adoptOntologyDataTypes: true, delta: true });
//		console.debug('oC', oC);
		['dataTypes', 'propertyClasses', 'resourceClasses'].forEach(
			// @ts-ignore - indexing is fine
			(li) => { this[li] = oC[li] }
		);

		// In addition we need some more dataTypes which are not covered by a propertyClass, yet:
		["DT-Boolean", "DT-Integer", "DT-Real", "DT-DateTime", "DT-Duration", "DT-AnyURI"].forEach(
			(id) => { LIB.cacheE(this.dataTypes, LIB.itemByKey( app.ontology.data.dataTypes, LIB.makeKey(id) )) }
		);
        */
//		console.debug('CS',simpleClone(this));
	}; 

	// Map category to listname;
	// the sequence is such that every list's elements have references only to list elements above:
	listName = new Map([
		['dataType', "dataTypes"],
		['propertyClass', "propertyClasses"],
		['resourceClass', "resourceClasses"],
		['statementClass', "statementClasses"],
		['file', "files"],
		['resource', "resources"],
		['statement', "statements"],
		['hierarchy', "hierarchies"]
	])
	iterateLists(fn: Function): number {
		// Perform the function fn for each list defined above:
		for (var ctg of this.listName.keys())
			fn(ctg, this.listName.get(ctg));
		return this.listName.size;
	}

	titleLinkTargets(): string[] {
		// (this is a function, because app.ontology is not yet ready when this file is loaded);
		// Return the resource classes which can be targets of title-linking (in [[name]] ):
		return app.ontology.modelElementClasses
			.concat(CONFIG.diagramClasses)
			.concat(CONFIG.folderClasses)
			.concat(app.ontology.termClasses)
    }

/*	get(ctg: string, key: SpecifKey, chAt?: string): SpecifClass {
		// Get the element of the given category: 
		// @ts-ignore - yes, the index can be undefined:
		var item: SpecifClass = LIB.itemByKey(this[this.listName.get(ctg)], key);
		if (item) {
			// shield any subsequent change from the templates available here:
			item = simpleClone(item);
			if (chAt) item.changedAt = chAt;
			// remove revision in references for easier updating of types (which must follow certain rules):
			// @ts-ignore - not all classes have it, but that's why it is checked
			if (item.dataType) item.dataType = { id: item.dataType.id };
			// @ts-ignore - not all classes have it, but that's why it is checked
			if (item.propertyClasses) item.propertyClasses = item.propertyClasses.map((k:SpecifKey) => { return { id: k.id } })
			// @ts-ignore - not all classes have it, but that's why it is checked
			if (item.subjectClasses) item.subjectClasses = item.subjectClasses.map((k: SpecifKey) => { return { id: k.id } })
			// @ts-ignore - not all classes have it, but that's why it is checked
			if (item.objectClasses) item.objectClasses = item.objectClasses.map((k: SpecifKey) => { return { id: k.id } })
			return item;
		};
		throw Error("No standard type with id '" + key.id + "' and revision '" + key.revision +"' of category '"+ctg+"'");
	}
	getByTitle(ctg: string, ti: string, chAt?: string): SpecifItem | undefined {
		var item: SpecifItem = LIB.itemByTitle(this[this.listName.get(ctg)], ti);
		if (item) {
			// shield any subsequent change from the templates available here:
			item = simpleClone(item);
			if (chAt) item.changedAt = chAt;
			return item;
		};
	}
	addTo(ctg: string, key: SpecifKey, dta: SpecIF): void {
		// Add an element (e.g. class) to it's list, if not yet defined:
		// ToDo: Check for revision! It can happen that a class is considered available, but a reference with revision fails.

		// 1. Get the name of the list, e.g. 'dataType' -> 'dataTypes':
		// @ts-ignore - yes, the result can be undefined:
		let lN: string = this.listName.get(ctg),
			item = this.get(ctg, key);

		// ToDo: For avoiding duplicates, The checking for the id is not sufficient;
		// if the existing element has an equal id, but different content,
		// the resulting SpecIF data-set is not consistent.

		// 2. Create it, if not yet available:
		if (item) {
			// @ts-ignore - index is ok:
			if (Array.isArray(dta[lN])) {
				// add the type, but avoid duplicates:
				// @ts-ignore - index is ok:
				if (LIB.indexByKey(dta[lN], key) < 0)
					// @ts-ignore - yes, the object can be undefined:
					dta[lN].unshift( item );
			}
			else {
				// create the list with the item:
				// @ts-ignore - index is ok:
				dta[lN] = [item];
			};
		}
		else
			throw Error("Can't find item with id '"+key.id+"' and revision '"+key.revision+"' in standard types.")
	} */
};


// =========================================================
// Semantic interpretations used for the layout of the app.
// - titleProperties and descProperties are shown in the main column, for example.

//    CONFIG.dataTypeComment = 'Datatype for comment text';
CONFIG.propClassId = "dcterms:identifier";
CONFIG.propClassTerm = "SpecIF:Term";
CONFIG.propClassTitle = "dcterms:title";
CONFIG.propClassDesc = "dcterms:description";
CONFIG.propClassType = "dcterms:type";
CONFIG.propClassLifecycleStatus = 'SpecIF:LifecycleStatus';
CONFIG.propClassDomain = "SpecIF:Domain";
CONFIG.propClassDiagram = 'SpecIF:Diagram';
CONFIG.resClassDiagram = 'SpecIF:View';
//    CONFIG.resClassTerm = "SpecIF:OntologyTerm";
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
CONFIG.hierarchyRoot = 'ReqIF:HierarchyRoot'; // ReqIF root node with meta-data
//    CONFIG.resClassIssue = 'SpecIF:Issue';
CONFIG.staClassShows = 'SpecIF:shows';
//    CONFIG.staClassRefersTo = 'SpecIF:refersTo';
CONFIG.staClassCommentRefersTo = 'SpecIF:commentRefersTo';
//    CONFIG.staClassIssueRefersTo = 'SpecIF:issueRefersTo';
CONFIG.staClassMentions = 'SpecIF:mentions';

CONFIG.prefixDT = "DT-";
CONFIG.prefixPC = "PC-";
CONFIG.prefixRC = "RC-";
CONFIG.prefixSC = "SC-";
CONFIG.prefixHC = "HC-";
CONFIG.prefixH = "H-";
CONFIG.prefixN = "N-";

/////////////////////////////////////////////////
// Lists controlling the visibility and arrangement based on the semantics;
// but use the ontology for looking up or translating terms.

// All property titles which denote a property as identifier in another context.
// Is necessary in certain use-cases such as updating content via Excel-sheet.
// The value of the first element found in idProperties will be used to form the internal id.
CONFIG.idProperties = [
    'dcterms:identifier'
    /*    'DC.identifier',
        'ReqIF.ForeignID',
        // RIF 1.1a Atego Exerpt:
        'Object Identifier',
        'VALUE-Object Identifier',
        'id',
        'ID',
        'Identifier' */
];

// The content of the property with a title in this list will be used for the title when displaying the resource:
// The sequence defines a priority, in case a resource has multiple properties with a title appearing in this list.
// For example, if a resource has a property with title 'Title' and another with title 'ReqiF.Name',
// the value of the latter will be the title of the resource, because it comes first in the list below.
CONFIG.titleProperties = [
	CONFIG.propClassTitle,
	"dc:title",
	"schema:name",
    CONFIG.propClassTerm
    /*       'DC.title',
           // ReqIF 1.0 and 1.1 Implementation Guide:
           'ReqIF.Name',
           // RIF 1.1a Atego Exerpt:
           'Object Heading',
   //        'VALUE-Object Heading',   // 'VALUE-' is now removed right at the beginning
           // DocBridge Resource Director:
           'DBRD.Name',
           // ARCWAY Cockpit Copilot:
           'Objektüberschrift',
           'Name',
           // carhs SafetyWissen:
           'carhs.Title.en',
           'carhs.Title.de',
           // Other:
           'Title',
           'Titel'  */
];

// The content of all properties with a title in this list will be concatenated to form the description when displaying the resource:
CONFIG.descProperties = [
    // Dublin core:
    CONFIG.propClassDesc,
	CONFIG.propClassDiagram,
	"dc:description"
    /*        'DC.description',
            // ReqIF 1.0 and 1.1 Implementation Guide:
            'ReqIF.Text',
            // General:
            'Beschreibung',
            'Description',
            'Diagramm',
            // DocBride Resource Director:
            'DBRD.Text',
            'Preview',
            // carhs SafetyWissen:
            'carhs.Text.en',
            'carhs.Text.de',
            'carhs.Image',
            'Dokument',
            // RIF 1.1a Atego Exerpt:
            'Object Text',
        //    'VALUE-Object Text',  // 'VALUE-' is now removed right at the beginning */
];
CONFIG.commentProperties = [
    "ReqIF-WF.CustomerComment",
	"ReqIF-WF.SupplierComment",
	"SpecIF:Comment"
];
// those will get a larger edit field, just like the description properties:
CONFIG.textProperties =
CONFIG.formattedProperties =
    CONFIG.descProperties
	.concat(CONFIG.commentProperties);

CONFIG.stereotypeProperties = [
    'UML:Stereotype'
];

// A list of properties to suppress generally, specified by title.
// Applies to propertyClasses and property values (types and instances).
// Properties with a title corresponding to the list entries are hidden,
// You must enter the title used by SpecIF (after translation):
CONFIG.hiddenProperties = [
    'VALUE_Table',   // RIF exports with Extessy/Atego Exerpt
    'VALUE_TableType',
    'Table',    // 'Table*' as used in DOORS ReqIF Exports
    'TableType',
    'PlainText',
    'implementerEnhanced',
    'ListNumberText'
];

/*    // A list of attributes not to show in the resource list (document view), specified by title:
    // You must enter the title used by SpecIF (after translation):
    CONFIG.overviewHiddenProperties = [
    ];
*/
// A list of relations not to show in tab named CONFIG.relations, specified by title:
CONFIG.hiddenStatements = [
    CONFIG.staClassCommentRefersTo
];

// A list of classes which are excluded from the class filtering, specified by title:
// All types for resources which are not referenced in the tree should be listed, here.
// Only resources which are referenced in a hierarchy (tree) are included in the filter process.
CONFIG.excludedFromTypeFiltering = [
    CONFIG.resClassComment
];

// A list of property classes which are excluded from text formatting, specified by title;
// Applied only to properties of type "xs:string":
CONFIG.excludedFromFormatting = [
    CONFIG.propClassType,
    "SpecIF:Notation"
]
    .concat(CONFIG.titleProperties)
    .concat(CONFIG.idProperties);

// A list of model elements to be exluded from deduplication on model import or model integration,
// specified by value of a property titled CONFIG.propClassType ...
// .. even if they have the same or no title/name.
// Note: For example, these are generated items when transforming BPMN models:
CONFIG.excludedFromDeduplication = [
    CONFIG.resClassFolder,
    CONFIG.resClassParagraph,
    CONFIG.resClassDiagram,
    CONFIG.resClassCondition,
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

CONFIG.clickableModelElements = true;        // diagram elements can be clicked to select the represented model element; it's class must specify the model element's id.
// A list of SVG element class names. A click handler will be attached to all SVG elements having a class in the list:
CONFIG.clickElementClasses = [
    'clickEl',
    'com.arcway.cockpit.uniqueelement'
];
CONFIG.selectCorrespondingDiagramFirst = true;    // when clicking on a diagram element, select a diagram having the same title as the clicked model element

// A list of resources representing model diagram types, specified by a property with title CONFIG.propClassType,
// where all relations themselves have a "SpecIF:shows" relation.
// The (older) diagrams from ARCWAY don't have, but the BPMN and ArchiMate diagrams have:
CONFIG.diagramTypesHavingShowsStatementsForEdges = [
    CONFIG.resClassProcess,
    "ArchiMate:Viewpoint"
];
// A list of resourceClasses representing Model Diagrams;
// these are used as title of a diagram's class:
CONFIG.diagramClasses = [
    CONFIG.resClassDiagram,
    CONFIG.resClassProcess,
    "ArchiMate:Viewpoint",
    "FMC:Plan"            // equivalent
];
CONFIG.folderClasses = [
    CONFIG.resClassOutline,
    CONFIG.resClassFolder
];

// Used to map resource or statement properties to native properties, where applicable;
// for example in ioXls.ts.
// The key is the property class' title, the value the native property's name plus the data type and validity test applying to both:
CONFIG.nativeProperties = new Map([
    ["dcterms:created", { name: "createdAt", type: "xs:dateTime", check: function (val: string): boolean { return val.length > 0 && LIB.isIsoDateTime(val) } }],
    ["SpecIF:createdAt", { name: "createdAt", type: "xs:dateTime", check: function (val: string): boolean { return val.length > 0 && LIB.isIsoDateTime(val) } }],
    ["dcterms:modified", { name: "changedAt", type: "xs:dateTime", check: function (val: string): boolean { return val.length > 0 && LIB.isIsoDateTime(val) } }],
    ["SpecIF:changedAt", { name: "changedAt", type: "xs:dateTime", check: function (val: string): boolean { return val.length > 0 && LIB.isIsoDateTime(val) } }],
    ["dcterms:creator", { name: "createdBy", type: "xs:string", check: function (): boolean { return true } }],
    ["SpecIF:createdBy", { name: "createdBy", type: "xs:string", check: function (): boolean { return true } }],
    ["SpecIF:changedBy", { name: "changedBy", type: "xs:string", check: function (): boolean { return true } }]
]);
/*
CONFIG.icons = new Map([
    // see: https://www.fileformat.info/info/unicode/char/2702/fontsupport.htm
    // ToDo: Derive from SpecIF Ontology
    ['FMC:Actor', "&#9632;"],
    ['FMC:State', "&#9679;"],
    ['FMC:Event', "&#11047;"],
    //    ['FMC:Event',"&#x2666;"],
    ['SpecIF:Collection', "&#11034;"],
    //    ['IREB:Requirement',"&#8623;"],
    //    ['IREB:Requirement', "&#x2762;"],    // HEAVY EXCLAMATION MARK ORNAMENT 
	// the following is the bootstrap icon "exclamation-diamond". Works fine in the browser, but the word transformer does not deal with an image as icon:
	['IREB:Requirement', "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" fill=\"currentColor\" class=\"bi bi-exclamation-diamond\" viewBox=\"0 0 16 16\"><path d=\"M6.95.435c.58-.58 1.52-.58 2.1 0l6.515 6.516c.58.58.58 1.519 0 2.098L9.05 15.565c-.58.58-1.519.58-2.098 0L.435 9.05a1.482 1.482 0 0 1 0-2.098L6.95.435zm1.4.7a.495.495 0 0 0-.7 0L1.134 7.65a.495.495 0 0 0 0 .7l6.516 6.516a.495.495 0 0 0 .7 0l6.516-6.516a.495.495 0 0 0 0-.7L8.35 1.134z\"/><path d=\"M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z\"/></svg>"],
    ['SpecIF:Feature', "&#10038;"],        // star
    [CONFIG.resClassDiagram, "&#9635;"],
    //    ['SpecIF:UserStory',"&#9830;"],
    //    ['SpecIF:UserStory', "&#9786;"],    // smiley
    ['SpecIF:UserStory', "&#x263A;"],    // WHITE SMILEY
    ["SpecIF:PainPoint", "&#x2702;"],    // BLACK SCISSORS
    //    ["IR:Annotation","&#9755;"]
    ["IR:Annotation", "&#x25BA;"]        // BLACK RIGHT-POINTING POINTER
    //    ["IR:Annotation", "&#x27A4;"]        // BLACK RIGHTWARDS ARROWHEAD
]); */

// string values for boolean 'true' and 'false':
CONFIG.valuesTrue = ['true', 'yes', 'wahr', 'ja', 'vrai', 'oui', '1', 'True'];
CONFIG.valuesFalse = ['false', 'no', 'falsch', 'nein', 'faux', 'non', '0', 'False'];
