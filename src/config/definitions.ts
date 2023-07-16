/*  Configuration Parameters for Interactive-Spec (Interaktives Lastenheft)
    Dependencies: none
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    Author: se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de 
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/
const CONFIG:any = {};
    CONFIG.appVersion = "1.1.q.1",
    CONFIG.specifVersion = "1.1";
    CONFIG.imgURL = './vendor/assets/images';
    CONFIG.QuickStartGuideEn = "https://specif.de/files/SpecIF/documents/SpecIF-Introduction.pdf";
    CONFIG.QuickStartGuideDe = "https://specif.de/files/SpecIF/documents/SpecIF-Einfuehrung.pdf";
    CONFIG.userNameAnonymous = 'Anonymous'; // as configured in the server
    CONFIG.passwordAnonymous = ''; // as configured in the server
    CONFIG.placeholder = 'to-be-replaced';
    CONFIG.notAssigned = 'notAssigned';
//    CONFIG.loginTimeout = 3000;
//    CONFIG.communicationTimeout = 12000;
    CONFIG.messageDisplayTimeShort = 4000;
    CONFIG.messageDisplayTimeNormal = 8000;
    CONFIG.messageDisplayTimeLong = 12000;
    CONFIG.noMultipleRefreshWithin = 240;  // avoid multiple refreshes in this time period (in ms)
    CONFIG.imageRenderingTimelag = 240;  // timelag between building the DOM and inserting the images
    CONFIG.showTimelag = 400;
    CONFIG.minInteger = -2147483648;  // for ReqIF Export
    CONFIG.maxInteger = 2147483647;  // for ReqIF Export
    CONFIG.minReal = -1.7976931348623157E+308;  // for ReqIF Export
    CONFIG.maxReal = 1.7976931348623157E+308;  // for ReqIF Export
    CONFIG.maxAccuracy = 9;        // max decimals of real numbers .. for ReqIF Export
    CONFIG.maxStringLength = 16384;  // max. length of formatted or unformatted strings
    CONFIG.maxTitleLength =      // truncate longer titles (modules specifications.mod.ts)
    CONFIG.textThreshold = 256;  // for longer strings a text area is offered for editing.
    CONFIG.treeMaxTitleLength = 48;  // truncate longer titles in the tree (module specifications.mod.ts)
    CONFIG.objToGetCount = 16;  // number of elements to get to fill the objectList (modules specifications.mod.ts, filter.mod.ts)
//    CONFIG.objToShowCount = 8;  // number of elements to show in the objectList (module specifications.mod.ts)
    CONFIG.genIdLength = 27;  // length of generated GUIDs, any prefix comes in addition (but does not add significantly to the probability of collision)
//    CONFIG.maxItemsToCache = 2000; // 0: item cache is disabled; undefined: item cache is enabled without limit
//    CONFIG.cacheAutoLoadPeriod = 90000; // in ms ... should be at least 60000ms
//    CONFIG.cacheAutoLoadReader = false; // load the cache for the reader app
    CONFIG.convertMarkdown = true; // convert markdown syntax to HTML
    CONFIG.addIconToType = true;
    CONFIG.addIconToInstance = true;    // applies to resources, statements and hierarchies/outlines
    CONFIG.fileIconStyle = 'width="48px"'; // style of icons representing the file type, in download links
    CONFIG.findMentionedObjects = true;    // looks for resource titles mentioned in the text and shows 'mentions' relations; uses the same markings as the dynamic linking
    CONFIG.titleLinking = true;  // add internal links to all substrings in description properties which match resource titles
    // the following two strings are escaped twice to build a regex via 'new regex(CONFIG.titleLinkBegin+(.*?)+CONFIG.titleLinkEnd,i)'
    CONFIG.titleLinkBegin = '\\[\\[';  // marks the beginning of any internal link, shall not be composed of ", <, >
    CONFIG.titleLinkEnd = '\\]\\]([^\\]]|$)';  // marks the end of any internal link, shall not be composed of ", <, >
    CONFIG.titleLinkMinLength = 3;  // min title length, so that it is considered for dynamic linking
    CONFIG.focusColor = '#1690D8';

    // The indices of ..Extensions and ..Types must correspond!
    // - Bidirectional mapping is needed ...
    // Also, for each entry 'xxx' in officeExtensions a corresponding icon file named xxx-icon.png is expected!
    // ToDo: use https://github.com/jshttp/mime-types
    CONFIG.imgExtensions = [ 'svg', 'png', 'jpg', 'gif', 'jpeg', 'png' ];
    CONFIG.imgTypes = [ 'image/svg+xml', 'image/png', 'image/jpeg', 'image/gif', 'image/jpeg', 'image/x-png' ];
    // mime image/x-png does not exist by standard, but it has been seen in real data ...
    CONFIG.officeExtensions = [ 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'ppsx', 'vsd', 'vsdx' ];
    CONFIG.officeTypes = [ 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.openxmlformats-officedocument.presentationml.slideshow', 'application/vnd.visio', 'application/vnd/ms-visio.drawing'];
    CONFIG.applExtensions = [ 'bpmn', 'ole' ];
    CONFIG.applTypes = [ 'application/bpmn+xml', 'application/ole' ];

    // Keys for the query parameters - if changed, existing links will end up in default view:
//    CONFIG.keyUId = 'uid';    // userId
    CONFIG.importAny =
    CONFIG.keyImport = 'import';
    CONFIG.keyMode = 'mode';
    CONFIG.keyProject = 'project';    // projectId
    CONFIG.keyItem = 'item';
    CONFIG.keyNode = 'node';
    CONFIG.keyView = 'view';    // dialog
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
//    CONFIG.objectSort = 'sort';
    CONFIG.files = 'files';
    CONFIG.comments = 'comments';
//    CONFIG.timeline = 'timeline';
    CONFIG.reports = 'reports';
    CONFIG.permissions = 'permissions';
//    CONFIG.specDialogDefault = CONFIG.objectList;
/*    // Projects:
//    CONFIG.projectList = CONFIG.projects;
    CONFIG.projectAbout = 'about';
    CONFIG.projectUsers = CONFIG.users;
//    CONFIG.projectAdminister = 'administer';
//    CONFIG.projectDelete = 'delete';
//    CONFIG.projectUpdate = 'update';
//    CONFIG.projectRead = 'read';
//    CONFIG.projectCreate = 'create';
//    CONFIG.system = 'system';
//    CONFIG.exportReqif = 'exportReqif';
//    CONFIG.importReqif = 'importReqif';
//    CONFIG.exportSpecif = 'exportSpecif';
//    CONFIG.importSpecif = 'importSpecif';  // import ReqIF project
//    CONFIG.exportXls = 'exportXls';
//    CONFIG.importXls = 'importXls';
//    CONFIG.type = 'type';
//    CONFIG.types = 'types';
//    CONFIG.dataType = 'dataType';
//    CONFIG.dataTypes = 'dataTypes';
//    CONFIG.objType = 'objType';
//    CONFIG.objTypes = 'objTypes';
//    CONFIG.relType = 'relType';
//    CONFIG.relTypes = 'relTypes';
//    CONFIG.grpType = 'grpType';
//    CONFIG.grpTypes = 'grpTypes';
//    CONFIG.spcType = 'specType';
//    CONFIG.spcTypes = 'specTypes';
//    CONFIG.rifType = 'rifType';
//    CONFIG.rifTypes = 'rifTypes';
//    CONFIG.projectDialogDefault = 'types';
    // Users:
    CONFIG.userList = CONFIG.users;
    CONFIG.userAbout = 'about';
    CONFIG.userProjects = CONFIG.projects;
    CONFIG.userAdminister = 'administer';
    CONFIG.userDelete = 'delete';
//    CONFIG.userDialogDefault = CONFIG.userAbout;
    // these are not externally visible:
//    CONFIG.object = 'object';
//    CONFIG.linker = 'linker';
*/

// Show or suppress empty properties in the resource list (document view):
CONFIG.showEmptyProperties = false;

/////////////////////////////////////////////////
// Regular expressions:
const RE:any = {};
    RE.Id = /^[_a-zA-Z]{1}[_a-zA-Z\d.-]*$/;    // compliant with ReqIF and SpecIF
//    RE.Email = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\])|(([a-zA-Z\-\d]+\.)+[a-zA-Z]{2,}))$/i;
//    RE.Email = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;  // http://www.w3resource.com/javascript/form/javascript-sample-registration-form-validation.php
    RE.Email = /^[A-Z\d._%+-]+@[A-Z\d.-]+\.[A-Z]{2,4}$/i;

    // Reliably recognize an URI, not validate an URI:
RE.URI = /(^|\s|>)((https?:\/\/|www\.)([^\s\/.$?#=]+\.)*([^\s\/.$?#=]+\.[\w]{2,4})(\/[^\s\?#]*?)*(\?[^\s#]+?)?(#\S*?)?)($|\s|\.\s|:\s|\.<|:<|<|\.$)/gm;
//             $1: Begins with start of text or space or tag end
//                     $2: complete link
//                      $3: "http(s)://" or "www."
//                                         $4: 0..n subdomains
//                                                           $5: domain.tld
//                                                                                     $6: 0..n subdirectories with or without trailing '/'
//                                                                                                    $7: 0..1 query string
//                                                                                                                 $8: 0..1 fragment=page anchor (hash)
//                                                                                                                          $9: ends with space or .space or .end or end

    // text strings are be encoded for json, thus '\t', '\r\n' or '\n' may be contained explicitly
    const     chars_de = '\u00c4\u00e4\u00d6\u00f6\u00dc\u00fc\u00df', // �������
            chars_fr = '\u00c0\u00e0\u00c2\u00e2\u00c7\u00e7\u00c8\u00e8\u00c9\u00e9\u00ca\u00ea\u00d4\u00f4\u00d9\u00f9\u00db\u00fb\u00cb\u00eb'; // ��������������������
//    const    chars_icon = "&#\d{1,5};|&#x\d{1,4};|&[a-zA-Z]{1,6};|[^\da-zA-Z"+chars_de+chars_fr+"&\"'\\s\\\\/]{1,6}";
    //                HTML-encoded chars ...
    //                                               OR all except alphanumerical characters (allowing not-escaped unicode chars)
//    RE.Icon = new RegExp( '^('+chars_icon+')$', '');
    // corresponding to SpecIF schema v0.10.0+:
    RE.Icon = new RegExp( '^(&#\d{1,5};|&#x\d{1,4};|&[a-zA-Z]{1,6};|[@$%#*_\u007B\u20AC\u00A3\u00A5\u00A7]{1,1}[\da-zA-Z@$%#*_\u007D\u20AC\u00A3\u00A5\u00A7]{0,6})$', '');

    // Various datatypes:
//    RE.IsoDateTime = /^(\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;
RE.IsoDateTime = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[1-2]\d|30|31)(?:T([0-1]\d|2[0-4]):([0-5]\d):([0-5]\d(?:\.\d{1,3})?)(\+(0\d|11|12):([0-5]\d)|-(0\d|11|12):([0-5]\d)|Z)?)?$/;
/*    RE.hasTimezone =/(Z|\+\d{2}(:\d{2})?|\-\d{2}(:\d{2})?)$/  */
    // see also http://stackoverflow.com/questions/3143070/javascript-regex-iso-datetime#3143231:
    // /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/
/*  see: https://stackoverflow.com/questions/3143070/javascript-regex-iso-datetime
 *  RE.DateTime = /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/
 */

//    RE.Number = /^-?\d+(?:(?:.|,){1}\d+){0,1}(?:e-?\d+)?$/;
    RE.Integer = /^(-?[1-9]\d*|0)$/;
    RE.Real = function( decimals:number ) {
        let mult = (typeof(decimals)=='number'&&decimals>0)? '{1,'+Math.floor(decimals)+'}':'+';
        return new RegExp( '^-?([1-9]\\d*|0)\\.\\d'+mult+'$|^(-?[1-9]\\d*|0)$', '' );
    };
//    RE.CSV = /^[\s\-,_#&$�\da-zA-Z]+$/;   // works!
    RE.CSV = new RegExp( '^[\\s\\-,_#&$�\da-zA-Z'+chars_de+chars_fr+']+$', '');  // comma-separated values

// Regexes to identify XHTML tags for objects and links:
// a) Especially OLE-Objects from DOORS are coming in this format; the outer object is the OLE, the inner is the preview image.
//    The inner object can be a tag pair <object .. >....</object> or comprehensive tag <object .. />.
//        Sample data from french branch of a japanese car OEM:
//            <object data=\"OLE_AB_4b448d054fad33a1_23_2100028c0d_28000001c9__2bb521e3-8a8c-484d-988a-62f532b73612_OBJECTTEXT_0.ole\" type=\"text/rtf\">
//                <object data=\"OLE_AB_4b448d054fad33a1_23_2100028c0d_28000001c9__2bb521e3-8a8c-484d-988a-62f532b73612_OBJECTTEXT_0.png\" type=\"image/png\">OLE Object</object>
//            </object>
//        Sample data from ReX:
//            <object data=\"Tabelle mit WordPics_Partner1/4_Object_Text_0.ole\" type=\"application/oleobject\">\n
//                <object data=\"Tabelle mit WordPics_Partner1/4_Object_Text_0.png\" type=\"image/png\">OLE Object</object>\n
//            </object>
//        Sample from ProSTEP ReqIF Implementation Guide:
//            <xhtml:object data="files/powerpoint.rtf" height="96" type="application/rtf" width="96">
//                <xhtml:object data="files/powerpoint.png" height="96" type="image/png"     width="96">
//                    This text is shown if alternative image can't be shown
//                </xhtml:object>
//            </xhtml:object>
//      For example, the ARCWAY Cockpit export uses this pattern:
//            <object data=\"files_and_images\\27420ffc0000c3a8013ab527ca1b71f5.svg\" name=\"27420ffc0000c3a8013ab527ca1b71f5.svg\" type=\"image/svg+xml\"/>
//            <object data=\"files_and_images\\27420ffc0000c3a8013ab527ca1b71f5.svg\" type=\"image/svg+xml\">27420ffc0000c3a8013ab527ca1b71f5.svg</object>
// b) But there is also the case where the outer object is a link and the inner object is an image:
//          <object data=\"https://adesso.de\" ><object data=\"files_and_images/Logo-adesso.png\" type=\"image/png\" />Project Information</object>
// c) A single object to link+object resp. link+image:
//      For example, the ARCWAY Cockpit export uses this pattern:
//            <object data=\"files_and_images\\27420ffc0000c3a8013ab527ca1b71f5.svg\" name=\"27420ffc0000c3a8013ab527ca1b71f5.svg\" type=\"image/svg+xml\"/>
const tagA = '<a ([^>]+)>([\\s\\S]*?)</a>',
      tagImg = '<img ([^>]+)/>';
    RE.tagA = new RegExp( tagA, 'g' );
    RE.tagImg = new RegExp( tagImg, 'g');
    RE.tagObject = /<object ([^>]+?)(\/>|>)/g;
    RE.attrType = /type="([^"]+)"/;
    RE.attrData = /data="([^"]+)"/;

const tagSO = '<object ([^>]+?)(/>|>(.*?)</object>)',
      tagNO = '<object ([^>]+?)>[\\s]*' + tagSO + '([\\s\\S]*?)</object>';
    RE.tagSingleObject = new RegExp( tagSO, 'g' );
    RE.tagNestedObjects = new RegExp( tagNO, 'g' );

const inBr = "\\((\\S[^\\)]*?\\S)\\)|\\[(\\S[^\\]]*?\\S)\\]"; // empty space in the middle allowed, but not as first and last character
//    RE.inBrackets = new RegExp( inBr, 'i');
    RE.inBracketsAtEnd = new RegExp(inBr + "$", 'i');
    RE.withoutBracketsAtEnd = /^(.*?)\s+(\(\S[^\)]*?\S\)|\[\S[^\]]*?\S\])$/i;
    RE.inQuotes = /"(\S[^"]*?\S)"|'(\S[^']*?\S)'/i;  // empty space in the middle allowed, but not as first and last character

const tagStr = "(<\\/?)([a-z]{1,10}(?: [^<>]+)?\\/?>)";
    RE.tag = new RegExp( tagStr, 'g' );
    RE.innerTag = new RegExp("([\\s\\S]*?)" + tagStr, 'g');
        // $1: inner text (before the next tag)
        // $2: start of opening tag '<' or closing tag '</'
        // $3: rest of the tag including '>' or '/>'

const tagsHtml = "(p|div|object|img|a|br|b|i|em|span|ul|ol|li|table|thead|tbody|tfoot|th|td)";
    RE.escapedHtmlTag = new RegExp("&(?:lt|#60);(\\/?)" + tagsHtml + "(.*?\\/?)&(?:gt|#62);", "g");
//    RE.htmlTag = new RegExp("(<\\/?)" + tagsHtml + "(.*?\\/?)>", "g");
    RE.innerHtmlTag = new RegExp("([\\s\\S]*?)(<\\/?)" + tagsHtml + "((?: [^<>]+)?\\/?>)", 'g');
        // $1: inner text (before the next tag)
        // $2: start of opening tag '<' or closing tag '</'
        // $3: any of the tokens listed in tagsHtml 
        // $4: the rest of the tag including '>' or '/>'

    RE.vocabularyTerm = /^[\w-]+(?:\:|\.)[\w\.:-]+$/;  // '_' is a word character, thus included in \w
    RE.splitVocabularyTerm = /^([\w-]+:|[\w-]+\.)?([\w\.:-]+)$/;
// (\w+)(?:\.|:|$)   ^[\w:\.]+$
