/////////////////////////////////////////////////
/*	Configuration Parameters for Interactive-Spec (Interaktives Lastenheft)
	Dependencies: none
	According to the concept of 'semantic versioning' (http://semver.org/),
		all minor versions j.n.p of this library work with all ReqIF Server minor versions j.n.q
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de
*/
const CONFIG = {};
	CONFIG.imgURL = './'+app.productVersion+'./../vendor/assets/images';
	CONFIG.userNameAnonymous = 'anonymous'; // as configured in the server
	CONFIG.passwordAnonymous = 'keyless'; // as configured in the server
	CONFIG.placeholder = 'to-be-replaced';
	CONFIG.notAssigned = 'notAssigned';
//	CONFIG.loginTimeout = 3000;
//	CONFIG.communicationTimeout = 12000;
	CONFIG.messageDisplayTimeShort = 4000;
	CONFIG.messageDisplayTimeNormal = 8000;
	CONFIG.messageDisplayTimeLong = 12000;
	CONFIG.noMultipleRefreshWithin = 240;  // avoid multiple refreshes in this time period (in ms). The faster the browser and processor, the shorter the time may be chosen.
	CONFIG.imageRenderingTimelag = 160;  // timelag between building the DOM and inserting the images
	CONFIG.minInteger = -32768;
	CONFIG.maxInteger = 32767;
	CONFIG.minReal = -10000000.0;
	CONFIG.maxReal = 10000000.0;
	CONFIG.maxAccuracy = 9;		// max decimals of real numbers
	CONFIG.maxStringLength = 16384;  // max. length of formatted or unformatted strings
	CONFIG.textThreshold = 256;  // for longer strings a text area is offered for editing.
	CONFIG.maxTitleLength = CONFIG.textThreshold;  // truncate longer titles (modules reqifserver*.js, specifications*.mod.js)
	CONFIG.treeMaxTitleLength = 48;  // truncate longer titles in the tree (module specifications*.mod.js)
	CONFIG.objToGetCount = 16;  // number of elements to get to fill the objectList (modules reqifserver*.js, specifications*.mod.js, objectFilter*.mod.js)
	CONFIG.objToShowCount = 8;  // number of elements to show in the objectList (module specifications*.mod.js)
	CONFIG.genIdLength = 27;  // length of generated GUIDs, any prefix comes in addition (but it does not add significantly to the probability of collision)
	CONFIG.maxObjToCacheCount = 2000; // 0: object cache is disabled; null: object cache is enabled with no limit
//	CONFIG.cacheAutoLoadPeriod = 90000; // in ms ... should be at least 60000ms
//	CONFIG.cacheAutoLoadReader = false; // load the cache for the reader app
	CONFIG.convertMarkdown = true; // convert markdown syntax to HTML
	CONFIG.addIconToType = true;
	CONFIG.addIconToInstance = true;	// applies to objects, relations, outlines
	CONFIG.findMentionedObjects = true;	// looks for object titles mentioned in the text and shows 'mentions' relations; uses the same markings as the dynamic linking
	CONFIG.dynLinking = true;  // add internal links to all substrings in description properties which match object titles
	CONFIG.dynLinkBegin = '[[';  // marks the beginning of any internal link, shall not be composed of ", <, >
	CONFIG.dynLinkEnd = ']]';  // marks the end of any internal link, shall not be composed of ", <, >
	CONFIG.dynLinkMinLength = 3;  // min title length, so that it is considered for dynamic linking

	// values for boolean 'true' and 'false':
	CONFIG.valuesTrue = ['true','yes','wahr','ja','vrai','oui','1'];
	CONFIG.valuesFalse = ['false','no','falsch','nein','faux','non','0'];

	// The indices of ..Extensions and ..Types must correspond!
	// Also, for each entry 'xxx' in officeExtensions provide a corresponding icon file named xxx-icon.png
	// ToDo: Change to a map.
	// ToDo: use https://github.com/jshttp/mime-types
//	CONFIG.rasterImgExtensions = [ 'png', 'jpg', 'gif', 'jpeg' ];
	CONFIG.imgExtensions = [ 'png', 'jpg', 'svg', 'gif', 'jpeg', 'png' ];
	CONFIG.imgTypes = [ 'image/png', 'image/jpeg', 'image/svg+xml', 'image/gif', 'image/jpeg', 'image/x-png' ];
	// mime image/x-png does not exist by standard, but it has been seen in real data ...
	CONFIG.officeExtensions = [ 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'ppsx', 'vsd', 'vsdx' ];
	CONFIG.officeTypes = [ 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.openxmlformats-officedocument.presentationml.slideshow', 'application/vnd.visio', 'application/vnd/ms-visio.drawing'];
	CONFIG.applExtensions = [ 'bpmn', 'ole' ];
	CONFIG.applTypes = [ 'application/bpmn+xml', 'application/ole' ];

	// Keys for the query parameters - if changed, existing links will end up in default view:
//	CONFIG.keyUId = 'uid';	// userId
	CONFIG.keyImport = 'import';
	CONFIG.keyMode = 'mode';
	CONFIG.keyProject = 'project';	// projectId
	CONFIG.keyItem = 'item';
	CONFIG.keyNode = 'node';
	CONFIG.keyView = 'view';	// dialog
	CONFIG.urlParamTags = [CONFIG.keyImport,CONFIG.keyMode,CONFIG.keyProject,CONFIG.keyItem,CONFIG.keyNode,CONFIG.keyView];

	// Dialog names used as query parameters - if changed, existing links will end up in default view:
	// Base:
	CONFIG.user = 'user';
	CONFIG.users = 'users';
	CONFIG.project = 'project';
	CONFIG.projects = 'projects';
	CONFIG.specification = 'specification';
	CONFIG.specifications = 'specifications';
	CONFIG.object = 'resource';
	CONFIG.objects = 'resources';
	CONFIG.folder = 'folder';
	CONFIG.folders = 'folders';
	// Specifications:
	CONFIG.objectTable = 'table';
	CONFIG.objectList = 'doc';
	CONFIG.objectFilter = 'filter';
	CONFIG.resourceEdit = 'edit';
	CONFIG.resourceLink = 'link';
	CONFIG.objectDetails = 'resource';
	CONFIG.objectRevisions = 'revisions';
	CONFIG.relations = 'statements';
//	CONFIG.objectSort = 'sort';
	CONFIG.files = 'files';
	CONFIG.comments = 'comments';
	CONFIG.timeline = 'timeline';
	CONFIG.reports = 'reports';
	CONFIG.permissions = 'permissions';
//	CONFIG.specDialogDefault = CONFIG.objectList;
	// Projects:
//	CONFIG.projectList = CONFIG.projects;
	CONFIG.projectAbout = 'about';
	CONFIG.projectUsers = CONFIG.users;
//	CONFIG.projectAdminister = 'administer';
//	CONFIG.projectDelete = 'delete';
//	CONFIG.projectUpdate = 'update';
//	CONFIG.projectRead = 'read';
//	CONFIG.projectCreate = 'create';
//	CONFIG.system = 'system';
//	CONFIG.exportReqif = 'exportReqif';
//	CONFIG.importReqif = 'importReqif';
//	CONFIG.exportSpecif = 'exportSpecif';
//	CONFIG.importSpecif = 'importSpecif';  // import ReqIF project
//	CONFIG.exportXls = 'exportXls';
//	CONFIG.importXls = 'importXls';
//	CONFIG.type = 'type';
//	CONFIG.types = 'types';
//	CONFIG.dataType = 'dataType';
//	CONFIG.dataTypes = 'dataTypes';
//	CONFIG.objType = 'objType';
//	CONFIG.objTypes = 'objTypes';
//	CONFIG.relType = 'relType';
//	CONFIG.relTypes = 'relTypes';
//	CONFIG.grpType = 'grpType';
//	CONFIG.grpTypes = 'grpTypes';
//	CONFIG.spcType = 'specType';
//	CONFIG.spcTypes = 'specTypes';
//	CONFIG.rifType = 'rifType';
//	CONFIG.rifTypes = 'rifTypes';
//	CONFIG.projectDialogDefault = 'types';
/*	// Users:
	CONFIG.userList = CONFIG.users;
	CONFIG.userAbout = 'about';
	CONFIG.userProjects = CONFIG.projects;
	CONFIG.userAdminister = 'administer';
	CONFIG.userDelete = 'delete';
//	CONFIG.userDialogDefault = CONFIG.userAbout;
	// these are not externally visible:
//	CONFIG.object = 'object';
//	CONFIG.linker = 'linker';  */

	// The following can have an i18n label in the translation files:
	CONFIG.dataTypeComment = 'Datatype for comment text';
	CONFIG.propClassId = 'dcterms:identifier';
	CONFIG.propClassTitle = 'dcterms:title';
	CONFIG.propClassDesc = 'dcterms:description';
	CONFIG.resClassDiagram = 'SpecIF:Diagram';
	CONFIG.propClassType = 'dcterms:type';
//	CONFIG.propClassXlsCol = 'XLS:Property';
	CONFIG.resClassXlsRow = 'XLS:Resource';
	CONFIG.resClassOutline = 'SpecIF:Outline';
	CONFIG.resClassGlossary = 'SpecIF:Glossary';
	CONFIG.resClassProcesses = 'SpecIF:BusinessProcesses';
	CONFIG.resClassFolder = 'SpecIF:Heading';
	CONFIG.resClassParagraph = "SpecIF:Paragraph";
	CONFIG.resClassComment = 'SpecIF:Comment';
//	CONFIG.resClassIssue = 'SpecIF:Issue';
	CONFIG.staClassShows = 'SpecIF:shows';
//	CONFIG.staClassRefersTo = 'SpecIF:refersTo';
	CONFIG.staClassCommentRefersTo = 'SpecIF:commentRefersTo';
//	CONFIG.staClassIssueRefersTo = 'SpecIF:issueRefersTo';
	CONFIG.staClassMentions = 'SpecIF:mentions';

/////////////////////////////////////////////////
// Lists controlling the visibility and arrangement in various tabs

	// All property titles which denote a property as identifier in another context.
	// Is necessary in certain use-cases such as updating content via Excel-sheet.
	// The value of the first element found in idProperties will be used to form the internal id.
	CONFIG.idProperties = [
		'dcterms:identifier',
		'DC.identifier',
		'ReqIF.ForeignID',
		// RIF 1.1a Atego Exerpt:
		'Object Identifier',
		'VALUE-Object Identifier',
		'id',
		'ID',
		'Identifier'
	];

	// If a resourceClass or a resource has a property carrying a title equal to one of the values in the following list,
	// it is considered a heading (chapter title) and will be included in the outline numbering.
	// Also, this property will be used for the title when displaying the resource.
	CONFIG.headingProperties = [
		CONFIG.resClassOutline, // do not remove
		CONFIG.resClassFolder,	// do not remove
		// ReqIF 1.0 and 1.1 Implementation Guide:
		'ReqIF.ChapterName',	// do not remove
		// DocBridge Resource Director:
		'DBRD.ChapterName',
	/*	// Viacar Glossary:
		'Heading.en',
		'Heading.de',
		'Heading.fr',
		'Heading.es', */
		// Other:
		'�berschrift'
	];

	// The content of the property with a title in this list will be used for the title when displaying the resource:
	// The sequence defines a priority, in case a resource has multiple properties with a title appearing in this list.
	// For example, if a resource has a property with title 'Title' and another with title 'ReqiF.Name',
	// the value of the latter will be the title of the resource.
	CONFIG.titleProperties = [
		// Dublin core:
		CONFIG.propClassTitle,
		'DC.title',
		// ReqIF 1.0 and 1.1 Implementation Guide:
		'ReqIF.Name',
		// DocBridge Resource Director:
		'DBRD.Name',
/*		// ARCWAY Cockpit Copilot:
		'Objekt�berschrift',
		'Name',
		// carhs SafetyWissen:
		'carhs.Title.en',
		'carhs.Title.de',  */
		// RIF 1.1a Atego Exerpt:
		'Object Heading',
//		'VALUE-Object Heading',   // 'VALUE-' is now removed right at the beginning
/*		// Glossary:
		'Title.en',
		'Title.de',
		'Title.fr',
		'Title.es', */
		// Viacar Glossary:
		'Bezeichnung_DE',
		'Bezeichnung_FR',
		// openETCS:
//		'requirementID',
		// Other:
		'Title',
		'Titel'
	];

	// The content of all properties with a title in this list will be concatenated to form the description in the 'document' view:
	CONFIG.descProperties = [
		// Dublin core:
		CONFIG.propClassDesc,
		'DC.description',
		CONFIG.resClassDiagram,
		// ReqIF 1.0 and 1.1 Implementation Guide:
		'ReqIF.Text',
		// DocBridge Resource Director:
		'DBRD.Text',
		'Preview',
/*		// ARCWAY Cockpit Copilot:
		'Beschreibung',
		'Description',
		'Diagramm',
		// DocBride Resource Director:
		// carhs SafetyWissen:
		'carhs.Text.en',
		'carhs.Text.de',
		'carhs.Image',
		'Dokument',
*/		// RIF 1.1a Atego Exerpt:
		'Object Text',
//		'VALUE-Object Text',  // 'VALUE-' is now removed right at the beginning
		// Glossary:
		'Text.en',
		'Text.de',
		'Text.fr',
		'Text.es',
		// Viacar Glossary:
		'Definition_DE',
		'Definition_FR',
		// openETCS:
		'RichText'
	];

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

	// A list of attributes not to show in the object list (document view), specified by title:
	// You must enter the titles used by SpecIF.
	CONFIG.overviewHiddenProperties = [
	];

	// Show or suppress empty properties in the object list (document view):
	CONFIG.showEmptyProperties = false;

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

	// A list of model elements to be exluded from deduplication on model import or model integration,
	// specified by value of a property titled CONFIG.propClassType ...
	// .. even if they have the same or no title/name.
	// Note: For example, these are generated items when transforming BPMN models:
	CONFIG.excludedFromDeduplication = [
		CONFIG.resClassFolder,
		CONFIG.resClassParagraph,
		'SpecIF:Condition',
		'BPMN:parallelGateway',
		'BPMN:exclusiveGateway',
		'BPMN:inclusiveGateway',
		'BPMN:boundaryEvent',
		'BPMN:intermediateThrowEvent',
		'BPMN:intermediateCatchEvent',
		'BPMN:callActivity'
	];

	CONFIG.clickableModelElements = true;		// diagram elements can be clicked to select the represented model element; it's class must specify the model element's id.
/*	// A list of SVG diagram class names. SVGs having a root element with this class will be subject to diagram level events:
	CONFIG.clickDiagramClasses = [
		'diagram'
	];
*/
	// A list of SVG element class names. A click handler will be attached to all SVG elements having a class in the list:
	CONFIG.clickElementClasses = [
		'clickEl',
		'com.arcway.cockpit.uniqueelement'
	];
	CONFIG.selectCorrespondingDiagramFirst = true;	// when clicking on a diagram element, select a diagram having the same title as the clicked model element
	// A list of resources representing Model Diagrams, specified by title resp. class title:
	CONFIG.diagramClasses = [
		CONFIG.resClassDiagram,
		'FMC:Plan',
		'SpecIF:View'		// deprecated
	];
	CONFIG.folderClasses = [
		CONFIG.resClassOutline,
		CONFIG.resClassFolder
	];
	// A list with all model-element types by title,
	// is used for example to build a glossary;
	// it is expected that a plural of any list element exists ( element+'s' ):
	CONFIG.modelElementClasses = [
		'FMC:Actor',
		'FMC:State',
		'FMC:Event',
		'SpecIF:Collection'
	];
	// A list of statement types by title,
	// is used for example to recognize a statement to create when importing an xls sheet:
	CONFIG.statementClasses = [
		'oslc_rm:satisfies',
		'oslc_rm:satisfiedBy',
		'oslc_rm:implements',
		'oslc_rm:implementedBy',
		'oslc_rm:validates',
		'oslc_rm:validatedBy',
	//	'oslc_rm:decomposes',
	//	'oslc_rm:decomposedBy',
		'IREB:refines',
		'IREB:refinedBy',
		'IR:refersTo'
	];
/*	// List of lists with equivalent resource types, e.g. in different notations or standards;
	// The term appearing in the first position of an equivalence list is the preferred one:
	// ToDo: Very similar purpose as the vocabulary translation below.
	CONFIG.eqivalentTypes = [
	];  */

const vocabulary = {
// Translate between different vocabularies such as ReqIF, Dublin Core, OSLC and SpecIF:
	property: {
		// for properyTypes and properties:
		specif: function( iT ) {
			// Target language: SpecIF
			var oT = '';
			switch( iT.toSpecifId().toLowerCase() ) {
				case "_berschrift":
				case "title":
				case "titel":
				case "dc_title":
				case "specif_heading":			//  'SpecIF:Heading' may be used falsely as property title
				case "reqif_chaptername":
				case "reqif_name": 					oT = "dcterms:title"; break;
				case "description":
				case "beschreibung":
				case "text":
				case "dc_description":
	//			case "reqif_changedescription":
				case "reqif_description":
				case "reqif_text":					oT = "dcterms:description"; break;
				case "reqif_revision":				oT = "SpecIF:Revision"; break;
				case "specif_stereotype":		// deprecated, for compatibility, not to confound with "UML:Stereotype"
				case "specif_subclass":			// deprecated, for compatibility
				case "reqif_category":
				case "specif_notation":				oT = "dcterms:type"; break;
				case 'specif_id':				// deprecated, for compatibility
				case "reqif_foreignid":				oT = "dcterms:identifier"; break;
				case "specif_state":			// deprecated, for compatibility
				case "reqif_foreignstate":			oT = "SpecIF:Status"; break;
				case "dc_author":
				case "dcterms_author":			// deprecated, for compatibility
				case "reqif_foreigncreatedby":		oT = "dcterms:creator"; break;
				case "specif_createdat":			oT = "dcterms:modified"; break;
	//			case "reqif_foreignmodifiedby":		oT = ""; break;
	//			case "reqif_foreigncreatedon":		oT = ""; break;
	//			case "reqif_foreigncreatedthru":	oT = ""; break;
	//			case "reqif_fitcriteria":			oT = ""; break;
	//			case "reqif_prefix":				oT = ""; break;
	//			case "reqif_associatedfiles":		oT = ""; break;
	//			case "reqif_project":				oT = ""; break;
	//			case "reqif_chapternumber":			oT = ""; break;
				default:							oT = iT
			};
			return oT
		},
		reqif: function( iT ) {
			// Target language: ReqIF
			var oT = '';
			switch( iT.toSpecifId().toLowerCase() ) {
				case "dcterms_title": 				oT = "ReqIF.Name"; break;
				case "dcterms_description": 		oT = "ReqIF.Text"; break;
				case "dcterms_identifier":			oT = "ReqIF.ForeignId"; break;
				case "specif_heading": 				oT = "ReqIF.ChapterName"; break;	// for compatibility
				case "specif_category":
				case "dcterms_type":				oT = "ReqIF.Category"; break;
				case "specif_revision":				oT = "ReqIF.Revision"; break;
				case "specif_state":			// deprecated, for compatibility
				case "specif_status":				oT = "ReqIF.ForeignState"; break;
				case "dcterms_author":			// deprecated, for compatibility
				case "dcterms_creator":				oT = "ReqIF.ForeignCreatedBy"; break;
	//			case "specif_createdat":
	//			case "dcterms_modified":			oT = "ReqIF.ForeignCreatedAt";  // exists?
				default:							oT = iT
			};
			return oT
		}
	},
	resource: {
		// for resource types, such as dataType, resourceType, ...:
		specif: function( iT ) {
			// Target language: SpecIF
			var oT = '';
			switch( iT.toSpecifId().toLowerCase() ) {
				case 'actors':
				case 'actor':
				case 'akteure':
				case 'akteur':						oT = "FMC:Actor"; break;
				case 'states':
				case 'state':
				case 'zust�nde':
				case 'zustand':						oT = "FMC:State"; break;
				case 'events':
				case 'event':
				case 'ereignisse':
				case 'ereignis':					oT = "FMC:Event"; break;
				case 'anforderungen':
				case 'anforderung':
				case 'requirements':
				case 'requirement':
				case 'specif_requirement':			oT = "IREB:Requirement"; break;
				case 'merkmale':
				case 'merkmal':
				case 'features':
				case 'feature':						oT = "SpecIF:Feature"; break;
				case 'annotations':
				case 'annotationen':
				case 'annotation':					oT = "IR:Annotation"; break;
				case 'user_stories':
				case 'user_story':					oT = 'SpecIF:UserStory'; break;
				case 'specif_view':
				case 'fmc_plan':					oT = 'SpecIF:Diagram'; break;
				case 'specif_folder':				oT = "SpecIF:Heading"; break;
				case 'specif_outline':				oT = "SpecIF:Hierarchy"; break;
				default:							oT = iT
			};
			return oT
//		},
//		reqif: function( iT ) {
//			// no translation to OSLC or ReqIF, because both don't have a vocabulary for resources
//			return iT
		}
	}
};

/////////////////////////////////////////////////
// Regular expressions:
const RE = {};
	RE.Id = /^[_a-zA-Z]{1}[_a-zA-Z0-9.-]*$/;	// compliant with ReqIF and SpecIF
//	RE.Email = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;
//	RE.Email = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;  // http://www.w3resource.com/javascript/form/javascript-sample-registration-form-validation.php
	RE.Email = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;

	// Reliably recognize an URI, not validate an URI:
	// text strings are be encoded for json, thus '\t', '\r\n' or '\n' may be contained explicitly
	RE.URI = /(^|\s|>)((https?:\/\/|www\.)([^\s\/.$?#=]+\.)*([^\s\/.$?#=]+\.[\w]{2,4})(\/[^\s\?#]*?)*(\?[^\s#]+?)?(#\S+?)?)(\.\s|:\s|\s|\.<|:<|<|\.$|:$|$)/g;
//             $1: Begins with start of text or space or tag end
//                     $2: complete link
//                      $3: "http(s)://" or "www."
//                                         $4: 0..n subdomains
//                                                           $5: domain.tld
//                                                                                     $6: 0..n subdirectories with or without trailing '/'
//                                                                                                    $7: 0..1 query string
//                                                                                                                 $8: 0..1 fragment=page anchor (hash)
//                                                                                                                          $9: ends with space or .space or .end or end

	const 	chars_de = '\u00c4\u00e4\u00d6\u00f6\u00dc\u00fc\u00df', // �������
			chars_fr = '\u00c0\u00e0\u00c2\u00e2\u00c7\u00e7\u00c8\u00e8\u00c9\u00e9\u00ca\u00ea\u00d4\u00f4\u00d9\u00f9\u00db\u00fb\u00cb\u00eb'; // ��������������������
//	const	chars_icon = "&#[0-9]{1,5};|&#x[0-9]{1,4};|&[a-zA-Z]{1,6};|[^0-9a-zA-Z"+chars_de+chars_fr+"&\"'\\s\\\\/]{1,6}";
	//                HTML-encoded chars ...
	//                                               OR all except alphanumerical characters (allowing not-escaped unicode chars)
//	RE.Icon = new RegExp( '^('+chars_icon+')$', '');
	// corresponding to SpecIF schema v0.10.0+:
	RE.Icon = new RegExp( '^(&#[0-9]{1,5};|&#x[0-9]{1,4};|&[a-zA-Z]{1,6};|[@$%#*_\u007B\u20AC\u00A3\u00A5\u00A7]{1,1}[0-9a-zA-Z@$%#*_\u007D\u20AC\u00A3\u00A5\u00A7]{0,6})$', '');

	// Various datatypes:
	RE.IsoDate = /^(\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;
	// see also http://stackoverflow.com/questions/3143070/javascript-regex-iso-datetime#3143231:
	// /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/
	RE.Integer = /^(-?[1-9]\d*|0)$/;
	RE.Real = function( decimals ) {
		let mult = (typeof(decimals)=='number'&&decimals>0)? '{1,'+Math.floor(decimals)+'}':'+';
		return new RegExp( '^-?([1-9]\\d*|0)\\.\\d'+mult+'$|^(-?[1-9]\\d*|0)$', '' )
	};
//	RE.CSV = /^[\s\-,_#&$�0-9a-zA-Z]+$/;   // works!
	RE.CSV = new RegExp( '^[\\s\\-,_#&$�0-9a-zA-Z'+chars_de+chars_fr+']+$', '');  // comma-separated values

// Regexes to identify XHTML tags for objects and links:
// a) Especially OLE-Objects from DOORS are coming in this format; the outer object is the OLE, the inner is the preview image.
//    The inner object can be a tag pair <object .. >....</object> or comprehensive tag <object .. />.
//		Sample data from french branch of a japanese car OEM:
//			<object data=\"OLE_AB_4b448d054fad33a1_23_2100028c0d_28000001c9__2bb521e3-8a8c-484d-988a-62f532b73612_OBJECTTEXT_0.ole\" type=\"text/rtf\">
//				<object data=\"OLE_AB_4b448d054fad33a1_23_2100028c0d_28000001c9__2bb521e3-8a8c-484d-988a-62f532b73612_OBJECTTEXT_0.png\" type=\"image/png\">OLE Object</object>
//			</object>
//		Sample data from ReX:
//			<object data=\"Tabelle mit WordPics_Partner1/4_Object_Text_0.ole\" type=\"application/oleobject\">\n
//				<object data=\"Tabelle mit WordPics_Partner1/4_Object_Text_0.png\" type=\"image/png\">OLE Object</object>\n
//			</object>
//		Sample from ProSTEP ReqIF Implementation Guide:
//			<xhtml:object data="files/powerpoint.rtf" height="96" type="application/rtf" width="96">
//				<xhtml:object data="files/powerpoint.png" height="96" type="image/png" 	width="96">
//					This text is shown if alternative image can't be shown
//				</xhtml:object>
//			</xhtml:object>
//      For example, the ARCWAY Cockpit export uses this pattern:
//			<object data=\"files_and_images\\27420ffc0000c3a8013ab527ca1b71f5.svg\" name=\"27420ffc0000c3a8013ab527ca1b71f5.svg\" type=\"image/svg+xml\"/>
//			<object data=\"files_and_images\\27420ffc0000c3a8013ab527ca1b71f5.svg\" type=\"image/svg+xml\">27420ffc0000c3a8013ab527ca1b71f5.svg</object>
// b) But there is also the case where the outer object is a link and the inner object is an image:
//          <object data=\"https://adesso.de\" ><object data=\"files_and_images/Logo-adesso.png\" type=\"image/png\" />Project Information</object>
// c) A single object to link+object resp. link+image:
//      For example, the ARCWAY Cockpit export uses this pattern:
//			<object data=\"files_and_images\\27420ffc0000c3a8013ab527ca1b71f5.svg\" name=\"27420ffc0000c3a8013ab527ca1b71f5.svg\" type=\"image/svg+xml\"/>
	RE.tagA = new RegExp( '<a([^>]+)>([\\s\\S]*?)</a>', 'g' );
	RE.tagImg = new RegExp( '<img([^>]+)/>', 'g' );
	let reSO = '<object([^>]+)(/>|>([^<]*?)</object>)';
	RE.tagSingleObject = new RegExp( reSO, 'g' );
	RE.tagNestedObjects = new RegExp( '<object([^>]+)>[\\s]*'+reSO+'([\\s\\S]*)</object>', 'g' );
	RE.quote = /"([a-z0-9_].*?)"|'([a-z0-9_].*?)'/i;

/////////////////
const nbsp = '&#160;'; // non-breakable space