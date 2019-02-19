/////////////////////////////////////////////////
/*	ReqIF Server Configuration Parameters.
	Dependencies: none
	According to the concept of 'semantic versioning' (http://semver.org/),
		all minor versions j.n.p of this library work with all ReqIF Server minor versions j.n.q
	(C)copyright 2010-2017 enso managers gmbh (http://www.enso-managers.com)
	Author: se@enso-managers.com, Berlin
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de            
*/
const CONFIG = {};
	CONFIG.productTitle = 'Interactive-Spec';
	CONFIG.productVersion = '0.95.1';	// major and minor must correspond to the server version installed.
	CONFIG.specifVersion = '0.10.5';
	CONFIG.imgURL = './images';
	CONFIG.userNameAnonymous = 'anonymous'; // as configured in the server
	CONFIG.passwordAnonymous = 'keyless'; // as configured in the server
	CONFIG.loginTimeout = 3000;
	CONFIG.defaultCommunicationTimeout = 12000;
	CONFIG.imageRenderingTimelag = 100;  // timelag between building the DOM and inserting the images
	CONFIG.messageDisplayTimeShort = 4000;
	CONFIG.messageDisplayTimeNormal = 8000;
	CONFIG.messageDisplayTimeLong = 12000;
	CONFIG.noMultipleRefreshWithin = 240;  // avoid multiple refreshes in this time period (in ms). The faster the browser and processor, the shorter the time may be chosen.
	CONFIG.textThreshold = 96;  // for longer strings a text area is offered for editing.
	CONFIG.maxStringLength = 8192;  // max. length of formatted or unformatted strings
	CONFIG.minInteger = -32768;
	CONFIG.maxInteger = 32767;
	CONFIG.minReal = -10000000.0;
	CONFIG.maxReal = 10000000.0;
	CONFIG.maxAccuracy = 3;		// max decimals of real numbers
	CONFIG.maxTitleLength = CONFIG.textThreshold;  // truncate longer titles (modules reqifserver*.js, specifications*.mod.js)
	CONFIG.treeMaxTitleLength = 60;  // truncate longer titles in the tree (module specifications*.mod.js)
	CONFIG.objToGetCount = 16;  // number of elements to get to fill the objectList (modules reqifserver*.js, specifications*.mod.js, objectFilter*.mod.js)
	CONFIG.objToShowCount = 8;  // number of elements to show in the objectList (module specifications*.mod.js)
	CONFIG.genIdLength = 27;  // length of generated GUIDs, any prefix comes in addition (but it does not add significantly to the probability of collision)
	CONFIG.maxObjToCacheCount = 2000; // 0: object cache is disabled; null: object cache is enabled with no limit
//	CONFIG.cacheAutoLoadPeriod = 90000; // in ms ... should be at least 60000ms
//	CONFIG.cacheAutoLoadReader = false; // load the cache for the reader app
	CONFIG.addIconToType = true;
	CONFIG.addIconToInstance = true;	// applies to objects, relations, outlines
	CONFIG.findMentionedObjects = true;	// looks for object titles mentiones in the text and shows 'mentions' relations; uses the same markings as the dynamic linking
	CONFIG.dynLinking = true;  // add internal links to all substrings in description attributes which match object titles
	CONFIG.dynLinkBegin = '[[';  // marks the beginning of any internal link, shall not include ", <, >
	CONFIG.dynLinkEnd = ']]';  // marks the end of any internal link, shall not include ", <, >
	CONFIG.dynLinkMinLength = 3;  // min title length, so that it is considered for dynamic linking
	

	// The indices of ..Extentions and ..Types must correspond!
	// Also, for each entry 'xxx' in officeExtensions provide a corresponding icon file named xxx-icon.png 
	// ToDo: Change to a map.
	// ToDo: use https://github.com/jshttp/mime-types
	CONFIG.imgExtensions = [ 'png', 'jpg', 'svg', 'gif', 'jpeg', 'png' ];
	CONFIG.imgTypes = [ 'image/png', 'image/jpeg', 'image/svg+xml', 'image/gif', 'image/jpeg', 'image/x-png' ];
	// mime image/x-png does not exist by standard, but it has been seen in real data ...
	CONFIG.officeExtensions = [ 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'ppsx', 'vsd', 'vsdx' ];
	CONFIG.officeTypes = [ 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.openxmlformats-officedocument.presentationml.slideshow', 'application/vnd.visio', 'application/vnd/ms-visio.drawing'];

	// Keys for the query parameters - if changed, existing links will end up in default view:
	CONFIG.keyUId = 'uid';	// userId
	CONFIG.keyPId = 'pid';	// projectId
	CONFIG.keySId = 'sid';	// specificationId 
//	CONFIG.keyONm = 'onm';	// objectName
	CONFIG.keyOId = 'oid';	// objectId
//	CONFIG.keyAtt = 'att';	// attribute
//	CONFIG.keyDlg = 'dlg';	// dialog
	
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
	CONFIG.objectList = 'document';  
	CONFIG.objectFilter = 'filter';
	CONFIG.objectDetails = 'resources';
	CONFIG.objectRevisions = 'revisions';
	CONFIG.relations = 'statements';
//	CONFIG.objectSort = 'sort';
	CONFIG.files = 'files';
	CONFIG.comments = 'comments';
	CONFIG.timeline = 'timeline';
	CONFIG.reports = 'reports';
	CONFIG.specDialogDefault = CONFIG.objectList;
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
	CONFIG.permissions = 'permissions';
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
	CONFIG.projectDialogDefault = 'types';
	// Users:
	CONFIG.userList = CONFIG.users;
	CONFIG.userAbout = 'about';
	CONFIG.userProjects = CONFIG.projects;
	CONFIG.userAdminister = 'administer';
	CONFIG.userDelete = 'delete';
	CONFIG.userDialogDefault = CONFIG.userAbout;
	// these are not externally visible:
//	CONFIG.object = 'object';
//	CONFIG.linker = 'linker';

	// The following can have an i18n label in the translation files:
//	CONFIG.dataTypeString = 'String';
//	CONFIG.dataTypeText = 'Text';
//	CONFIG.dataTypeFormattedText = 'XHTML';
//	CONFIG.dataTypeDateTime = 'Date-Time';
//	CONFIG.dataTypeBoolean = 'BOOLEAN';
//	CONFIG.dataTypeEnumeration = 'ENUMERATION';
//	CONFIG.dataTypeInteger = 'INTEGER';
//	CONFIG.dataTypeReal = 'REAL';
//	CONFIG.dataTypeXlsText = 'XLS:Text';
	CONFIG.dataTypeComment = 'Datatype for comment text';
	CONFIG.attrTypeTitle = 'dcterms:title';
	CONFIG.attrTypeText = 'dcterms:description';
	CONFIG.objTypeXlsRow = 'XLS:Object';
//	CONFIG.attrTypeXlsCol = 'XLS:Attribute';
	CONFIG.spcTypeOutline = 'SpecIF:Outline';
	CONFIG.objTypeFolder = 'SpecIF:Heading';   
	CONFIG.objTypeComment = 'SpecIF:Comment';   
//	CONFIG.objTypeIssue = 'SpecIF:Issue';   	
//	CONFIG.relTypeRefersTo = 'SpecIF:refersTo';	
	CONFIG.relTypeCommentRefersTo = 'SpecIF:commentRefersTo';	
//	CONFIG.relTypeIssueRefersTo = 'SpecIF:issueRefersTo';	
	CONFIG.stereotype = 'SpecIF:Stereotype';
	CONFIG.resType = 'SpecIF:Type';
	
/////////////////////////////////////////////////
// Lists controlling the visibility and arrangement in various tabs

	// All attribute titles=longNames which denote an attribute as identifier in another context.
	// Is necessary in certain use-cases such as updating content via Excel-sheet.
	// The value of the first idAttribute found will be used to form the internal id.
	CONFIG.idAttributes = [
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

	// If an objectType or an object has an attribute carrying a longName equal to one of the values in the following list, 
	// it is considered a heading (chapter title) and will be included in the outline numbering.
	// Also, this attribute will be used for the title when displaying the object.
	CONFIG.headingAttributes = [
		CONFIG.objTypeFolder,	// do not remove
		// ReqIF 1.0 and 1.1 Implementation Guide:
		'ReqIF.ChapterName',	// do not remove
		// DocBridge Resource Director:
		'DBRD.ChapterName',
		// Glossary:
		'Heading.en',
		'Heading.de',
		'Heading.fr',
		'Heading.es',
		// Other:
		'Überschrift'
	];

	// The content of the attribute with a longName in this list will be used for the title when displaying the object:
	// The sequence defines a priority, in case an object has multiple attributes with a longName appearing in this list.
	// For example, if an object has an attribute with longName 'Title' and another with longName 'ReqiF.Name', the value of the latter will be the title of the object.
	CONFIG.titleAttributes = [
		// Dublin core:
		'dcterms:title',
		'DC.title',
		// ReqIF 1.0 and 1.1 Implementation Guide:
		'ReqIF.Name',
		// DocBridge Resource Director:
		'DBRD.Name',
/*		// ARCWAY Cockpit Copilot:
		'Objektüberschrift',
		'Name',
		// carhs SafetyWissen:
		'carhs.Title.en',
		'carhs.Title.de',
*/		// RIF 1.1a Atego Exerpt:	
		'Object Heading',
//		'VALUE-Object Heading',   // 'VALUE-' is now removed right at the beginning
		// Glossary:
		'Title.en',
		'Title.de',
		'Title.fr',
		'Title.es',
		// Viacar Glossary:
		'Bezeichnung_DE',
		'Bezeichnung_FR',
		// openETCS:
//		'requirementID',
		// Other:
		'Title',
		'Titel'
	];

	// The content of all attributes with a longName in this list will be concatenated to form the description in the 'document' view (object list):
	CONFIG.descriptionAttributes = [
		// Dublin core:
		'dcterms:description',
		'DC.description',
		'SpecIF:Diagram',
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

	CONFIG.stereotypeAttributes = [
		CONFIG.stereotype
	];

	// A list of attributes to suppress generally, specified by longName.  
	// Applies to attributeDefinitions and attribute values (types and instances).
	// Attributes with longNames corresponding to the list entries are hidden:
	// You must enter the longNames used by SpecIF.
	CONFIG.hiddenAttributes = [
		'VALUE_Table',   // RIF exports with Extessy/Atego Exerpt
		'VALUE_TableType',
		'Table',    // 'Table*' as used in DOORS ReqIF Exports
		'TableType',
		'PlainText',
		'implementerEnhanced',
		'ListNumberText'
	];

	// A list of attributes not to show in the object list (document view), specified by longName:
	// You must enter the longNames used by SpecIF.
	CONFIG.overviewHiddenAttributes = [
		'SpecIF:Id',
		CONFIG.resType
	];

	// Show or suppress empty attributes in the object list (document view):
	CONFIG.overviewShowEmptyAttributes = false;

	// A list of relations not to show in tab named CONFIG.relations, specified by longName:
	CONFIG.hiddenRelations = [
		CONFIG.relTypeCommentRefersTo
	];
	
	// A list of types which are excluded from the type filtering, specified by longName:
	// All types for objects which are not referenced in the tree should be listed, here.
	// Note that only objects which are referenced in a hierarchy (tree) are included in the filter process.
	CONFIG.excludedFromTypeFiltering = [
		CONFIG.objTypeComment
	];
	
	CONFIG.clickableModelElements = true;		// diagram elements can be clicked to select the represented model element; it's class must specify the model element's id.
	CONFIG.selectCorrespondingPlanFirst = true;	// when clicking on a diagram element, select a diagram having the same title as the clicked model element
	// A list of resources representing Model Diagrams, specified by title resp. longName:
	CONFIG.plans = [
		'SpecIF:Diagram',
		'FMC:Plan'
	];
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
	
	// values for boolean 'true' and 'false':
	CONFIG.valuesTrue = ['true','yes','wahr','ja','vrai','oui','1'];
	CONFIG.valuesFalse = ['false','no','falsch','nein','faux','non','0'];
	
const vocabulary = {
// Translate between different vocabularies such as ReqIF, Dublin Core, OSLC and SpecIF:
	property: {
		// for properyTypes and properties:
		specif: function( iT ) {
			// Target language: SpecIF
			var oT = '';
			switch( iT.toLowerCase() ) {
	//			case "reqif.chapternumber":			oT = ""; break;
				case "überschrift":
				case "title":
				case "titel":
				case "dc.title":
				case "specif:heading":				//  'SpecIF:Heading' may be used falsely as attribute longName
				case "reqif.chaptername": 	
				case "reqif.name": 					oT = "dcterms:title"; break;
				case "description":
				case "beschreibung":
				case "text":
				case "dc.description":
				case "reqif.description":
				case "reqif.text":					oT = "dcterms:description"; break;
				case "reqif.category":				oT = "SpecIF:Category"; break;
				case "reqif.revision":				oT = "SpecIF:Revision"; break;
				case 'specif:id':					// deprecated, for compatibility
				case "reqif.foreignid":				oT = "dcterms:identifier"; break;
				case "reqif.foreignstate":			oT = "SpecIF:Status"; break;
				case "dcterms:author":				// deprecated, for compatibility		
				case "reqif.foreigncreatedby":		oT = "dcterms:creator"; break;
	//			case "reqif.foreignmodifiedby":		oT = ""; break;
	//			case "reqif.foreigncreatedon":		oT = ""; break;
	//			case "reqif.foreigncreatedthru":	oT = ""; break;
	//			case "reqif.changedescription":		oT = "dcterms:description"; break;
	//			case "reqif.fitcriteria":			oT = ""; break;
	//			case "reqif.prefix":				oT = ""; break;
	//			case "reqif.associatedfiles":		oT = ""; break;
	//			case "reqif.project":				oT = ""; break;
				default:							oT = iT
			};
			return oT
		},
		reqif: function( iT ) {
			// Target language: ReqIF
			var oT = '';
			switch( iT.toLowerCase() ) {
				case "specif:heading": 				oT = "ReqIF.ChapterName"; break;	// for compatibility
				case "dcterms:title": 				oT = "ReqIF.Name"; break;
				case "dcterms:description": 		oT = "ReqIF.Text"; break;
				case "specif:category":				oT = "ReqIF.Category"; break;
				case "specif:revision":				oT = "ReqIF.Revision"; break;
				case "dcterms:identifier":			oT = "ReqIF.ForeignId"; break;
				case "specif:state":			// deprecated, for compatibility			
				case "specif:status":				oT = "ReqIF.ForeignState"; break;
				case "dcterms:author":			// deprecated, for compatibility
				case "dcterms:creator":				oT = "ReqIF.ForeignCreatedBy"; break;
	//			case "dcterms:modified":			oT = "";
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
			switch( iT.toLowerCase() ) {
				case 'anforderung':
				case 'requirement':
				case 'specif:requirement':			oT = "IREB:Requirement"; break;
				case 'specif:folder':				oT = "SpecIF:Heading"; break;
				case 'specif:outline':				oT = "SpecIF:Hierarchy"; break;
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
var RE = {};
	RE.Id = /^[_a-zA-Z]{1}[_a-zA-Z0-9.-]*$/;	// compliant with ReqIF and SpecIF
//	RE.Email = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;
//	RE.Email = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;  // http://www.w3resource.com/javascript/form/javascript-sample-registration-form-validation.php
	RE.Email = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;
	
	// Reliably recognize an URL, not validate an URL:
	// text strings are be encoded for json, thus '\t', '\r\n' or '\n' may be contained explicitly
	RE.URL = /(^|\s|\\t|\\n|\\r\\n|>)((https?:\/\/|www\.)([^\s\/.$?#=]+\.)*[^\s\/.$?#=]+\.[\w]{2,4}(\/[()\w\/\.%-]*[\w])?\/?(#[\w\/\.()%-]*[\w])?([?][\w\.()=&;%\"\'-]*[\w\/)\'])?)(\s|\.\s|:\s|\\t|\\n|\\r\\n|<|\.$|$)/g;
//             $1: Begins with start of text or space or tag end
//                                    $2: complete link
//                                     $3: "http(s)://" or "www."
//                                                        $3: 0..n subdomains  domain         tld
//                                                                                                  $4: 0..n subdirectories with or without trailing '/'
//                                                                                                                         0..1 page anchor (hash)
//                                                                                                                               0..1 query string
//                                                                                                                                           ends with space or .space or .end or end
	
	const 	chars_de = '\u00c4\u00e4\u00d6\u00f6\u00dc\u00fc\u00df', // ÄäÖöÜüß
			chars_fr = '\u00c0\u00e0\u00c2\u00e2\u00c7\u00e7\u00c8\u00e8\u00c9\u00e9\u00ca\u00ea\u00d4\u00f4\u00d9\u00f9\u00db\u00fb\u00cb\u00eb'; // ÀàÂâÇçÈèÉéÊêÔôÙùÛûËë
//	const	chars_icon = "&#[0-9]{1,5};|&#x[0-9]{1,4};|&[a-zA-Z]{1,6};|[^0-9a-zA-Z"+chars_de+chars_fr+"&\"'\\s\\\\/]{1,6}";
	//                HTML-encoded chars ...
	//                                               OR all except alphanumerical characters (allowing not-escaped unicode chars)
//	RE.Icon = new RegExp( '^('+chars_icon+')$', '');
	// corresponding to SpecIF schema v0.10.0+:
	RE.Icon = new RegExp( '^(&#[0-9]{1,5};|&#x[0-9]{1,4};|&[a-zA-Z]{1,6};|[@$%#*_\u007B\u20AC\u00A3\u00A5\u00A7]{1,1}[0-9a-zA-Z@$%#*_\u007D\u20AC\u00A3\u00A5\u00A7]{0,6})$', '');

	// allowed are extensions with 3 or 4 alpha characters 
	//                        OR an extension with 2 alpha characters plus '~' (this is used for inactive Compart filter profiles):
	RE.FileExt = /\.([a-z]{3,7}|[a-z]{2}\~)$/i;
//	RE.FileName = /^([\ a-z0-9_\.\-\(\)\/\\]+)\.[a-z]{2,4}$/i;  // name excluding '.'    
	RE.FileName = /^([a-z0-9\u00e4\u00f6\u00fc\u00df\u00e0\u00e2\u00e7\u00e8\u00e9\u00ea\u00f4_\s\.\-\(\)\[\]\%\/\\]+)\.([a-z]{3,7}|[a-z]{2}\~)$/i;  // name excluding '.'

	// Various datatypes:
	RE.IsoDate = /^(\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;	
	// see also http://stackoverflow.com/questions/3143070/javascript-regex-iso-datetime#3143231:
	// /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/
//	RE.Integer = /^[+-]?[0-9]+$/;   // server does not accept '+'
	RE.Integer = /^-?[0-9]+$/;
//	RE.Real = /^[\-]{0,1}[0-9]+[.][0-9]+$|^[\-]{0,1}[0-9]+$/;  // any number of decimals >1
	RE.Real = function( decimals ) {
		return new RegExp( '^-?[0-9]+[.][0-9]{1,'+Math.max(1,decimals)+'}$|^-?[0-9]+$', '' )
	};
//	RE.CSV = /^[\s\-,_#&$§0-9a-zA-Z]+$/;   // works!
//	RE.CSV = new RegExp( '^[\\s\\-,_#&$§0-9a-zA-Z]+$', '');  // works: escape the \ in js strings!
	RE.CSV = new RegExp( '^[\\s\\-,_#&$§0-9a-zA-Z'+chars_de+chars_fr+']+$', '');  // comma-separated values	
