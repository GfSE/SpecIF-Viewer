/* 	Provide i18ns and messages in a certain language, in this case 'English' (en).
	The result can be obtained by reference of:
	- i18n.MsgText
	- phrase('MsgText')
	- phrase('MsgText', 'param')
	- In the messages defined below, '~A' can be inserted at the location where a call parameter shall be placed.
*/
var i18n = new Object();
i18n.phrase = function( ms, pA ) { 
	// replace a variable '~A' with pA, if available:
	// for use in HTML fields.
	if( ms ) {
		if( pA!=undefined ) return i18n[ms].replace( /(.*)~A(.*)/g, function( $0, $1, $2 ){ return $1+pA+$2 } ); 
		return i18n[ms] 
	};
	return ''
};
i18n.lookup = function( lb ) { 
	// toJsId: first replace '.' '-' '(' ')' and white-space by '_'
	// for use in regular text fields.
	try {
		return i18n[lb.toJsId()].stripHTML()
	} catch (e) {
		return lb
	}
};
	
i18n.IcoUser = '<span class="glyphicon glyphicon-user"/>';
i18n.IcoSpecification = '<span class="glyphicon glyphicon-book"/>';
//i18n.IcoReadSpecification = '<span class="glyphicon glyphicon-eye-open"/>';
//i18n.IcoUpdateSpecification = '<span class="glyphicon glyphicon-pencil"/>';
//i18n.IcoRead = '<span class="glyphicon glyphicon-eye-open"/>';
i18n.IcoImport = '<span class="glyphicon glyphicon-import"/>';
i18n.IcoExport = '<span class="glyphicon glyphicon-export"/>';
i18n.IcoAdminister = '<span class="glyphicon glyphicon-wrench"/>';
i18n.IcoUpdate = '<span class="glyphicon glyphicon-pencil"/>';
i18n.IcoDelete = '<span class="glyphicon glyphicon-remove"/>';
i18n.IcoAdd = '<span class="glyphicon glyphicon-plus"/>';
i18n.IcoClone = '<span class="glyphicon glyphicon-duplicate"/>';
i18n.IcoPrevious = '<span class="glyphicon glyphicon-chevron-up"/>';
i18n.IcoNext = '<span class="glyphicon glyphicon-chevron-down"/>';
i18n.IcoGo = '<span class="glyphicon glyphicon-search"/>';
i18n.IcoFilter = '<span class="glyphicon glyphicon-filter"/>';
i18n.IcoComment = '<span class="glyphicon glyphicon-comment"/>';
i18n.IcoURL = '<span class="glyphicon glyphicon-map-marker"/>';
i18n.IcoLogout = '<span class="glyphicon glyphicon-log-out"/>';

// Buttons:
//i18n.LblImportReqif = 'ReqIF Import';
//i18n.LblImportCsv = 'CSV Import';
//i18n.LblImportXls = 'XLS Import';
//i18n.LblExportPdf = 'PDF Export';
i18n.LblAll = "All";
i18n.LblAllObjects = "All resources";
i18n.LblImport = 'Import';
i18n.LblExport = 'Export';
i18n.LblExportReqif = 'Export ReqIF-file';
i18n.LblExportSpecif = 'Export SpecIF-file';
i18n.LblAdminister = 'Administer';
i18n.LblCreate ="Create";
i18n.LblRead = 'Read';
i18n.LblUpdate = 'Update';
i18n.LblUpdateProject = 'Update project properties';
i18n.LblUpdateSpec = 'Update outline properties';
i18n.LblUpdateTypes = 'Update types & permissions';
i18n.LblUpdateObject = 'Update this resource';
i18n.LblDelete = 'Delete';
i18n.LblDeleteProject = 'Delete this project';
i18n.LblDeleteType = 'Delete this type';
i18n.LblDeleteObject = 'Delete this resource';
i18n.LblDeleteAttribute = 'Delete attribute';
i18n.LblDeleteRelation = 'Delete statement';
i18n.LblDeleteRole = 'Delete role';
i18n.LblSaveRelationAsSource = 'Link resource as '+i18n.LblSource;
i18n.LblSaveRelationAsTarget = 'Link resource as '+i18n.LblTarget;
i18n.LblAdd = 'Create';
i18n.LblAddItem = 'Create ~A';
i18n.LblAddProject = "Add project";
i18n.LblAddType = "Add type";
i18n.LblAddDataType = "Add datatype";
i18n.LblAddObjType = "Add ressource-type";
i18n.LblAddRelType = "Add statement-type";
i18n.LblAddSpcType = "Add outline-type";
i18n.LblAddTypeComment = 'Add types for comments';
i18n.LblAddObject = "Add resource";
i18n.LblAddRelation = "Add statement";
i18n.LblAddAttribute = "Add attribute";
i18n.LblAddUser = "Add user";
i18n.LblAddComment = 'Add a comment';
i18n.LblAddCommentTo = "Add a comment to '~A':";
i18n.LblAddCommentToObject = 'Add comment to this resource';
i18n.LblAddFolder = "Create a folder";
i18n.LblAddSpec = "Create an outline";
i18n.LblClone = 'Clone';
i18n.LblCloneObject = 'Clone this resource';
i18n.LblCloneType = 'Clone this type';
i18n.LblCloneSpec = 'Clone this outline';
i18n.LblUserName = 'Username';
i18n.LblPassword = 'Password';
i18n.LblTitle = 'Title';
i18n.LblProject = 'Project';
i18n.LblName = 'Name';
i18n.LblFirstName = 'First Name';
i18n.LblLastName = 'Last Name';
i18n.LblOrganizations = 'Organization';  // until multiple orgs per user are supported
i18n.LblEmail = 'e-mail';
i18n.LblFileName = 'File name';
i18n.LblRoleGeneralAdmin = 'GENERAL-ADMIN';
i18n.LblRoleProjectAdmin = 'ADMIN';
i18n.LblRoleUserAdmin = 'USER-ADMIN';
i18n.LblRoleReader = 'READER';
i18n.LblRoleReqif = 'REQIF';
i18n.LblGlobalActions = 'Actions';
i18n.LblItemActions = 'Actions';
i18n.LblIdentifier = 'Identifier';
i18n.LblProjectName = 'Project name';
i18n.LblDescription = 'Description';
i18n.LblState = 'Status';
i18n.LblPriority = 'Priority';
i18n.LblCategory = 'Category';
i18n.LblAttribute = 'Attribute';
i18n.LblAttributes = 'Attributes';
i18n.LblAttributeValueRange = "Value Range";
i18n.LblAttributeValues = "Values";
i18n.LblAttributeValue = "Value";
i18n.LblTool = 'Authoring Tool';
i18n.LblMyRole = 'My role';
i18n.LblRevision = 'Revision';
i18n.LblCreatedAt = 'Created at';
i18n.LblCreatedBy = 'Created by';
i18n.LblCreatedThru = 'Created thru';
i18n.LblModifiedAt = 'Modified at';
i18n.LblModifiedBy = 'Modified by';
i18n.LblProjectDetails = 'Properties';
i18n.LblProjectUsers = '<span class="glyphicon glyphicon-user"/>&nbsp;Users with a role in this project';
i18n.LblOtherUsers = 'Other Users';
i18n.LblUserProjects = '<span class="glyphicon glyphicon-book"/>&nbsp;Projects of this user';
i18n.LblOtherProjects = 'Other Projects';
i18n.LblType = 'Type';
i18n.LblTypes = 'Types';
i18n.LblDataTypes = 'Data-types';
i18n.LblDataType = 'Data-type';
i18n.LblDataTypeTitle = 'Data-type Name';
i18n.LblSpecTypes = 'Types';
i18n.LblSpecType = "Type";
i18n.LblObjectTypes = 
i18n.LblResourceClasses = 'Resource-types';
i18n.LblObjectType = 'Resource-type';
i18n.LblRelationTypes = 
i18n.LblStatementClasses = 'Statement-types';
i18n.LblRelationType = 'Statement-type';
//i18n.LblRelGroupTypes = 'Relationgroup-Types';
//i18n.LblRelGroupType = 'Relationgroup-Type';
i18n.LblSpecificationTypes = 'Outline-types';
i18n.hierarchyType = 
i18n.LblSpecificationType = 'Outline-type';
i18n.LblRifTypes = 'Types';
i18n.rifType = 
i18n.LblRifType = 'Type';
i18n.LblSpecTypeTitle = 'Name';
i18n.LblAttributeTitle = 'Attribute Name';
i18n.LblSecondaryFiltersForObjects = i18n.IcoFilter+"&nbsp;Facet filters for '~A'";
i18n.LblPermissions = 'Permissions';
i18n.LblRoles = 'Roles';
i18n.LblFormat = 'Format';
i18n.LblFileFormat = 'File format';
i18n.LblStringMatch = '<span class="glyphicon glyphicon-text-background" />&nbsp;String Match';
i18n.LblWordBeginnings = 'Word beginnings only';
i18n.LblWholeWords = 'Whole words only';
i18n.LblCaseSensitive = 'Case sensitive';
i18n.LblExcludeEnums = 'Exclude enumerated values';
i18n.LblNotAssigned = '(not assigned)';
i18n.LblPrevious = 'Previous';
i18n.LblNext = 'Next';
i18n.LblGo = 'Go!';
i18n.LblAll = 'All';
i18n.LblHitCount = 'Hit Count';
i18n.LblRelateAs = 'Relate as';
i18n.LblSource = 'Subject';
i18n.LblTarget = 'Object';
i18n.LblEligibleSources = "Eligible resources as "+i18n.LblSource;
i18n.LblEligibleTargets = "Eligible resources as "+i18n.LblTarget;
i18n.LblIcon = 'Icon';
i18n.LblCreation = 'Creation';
i18n.LblCreateLink1 = "&#x2776;&nbsp;Desired Statement";
i18n.LblCreateLink2 = "&#x2777;&nbsp;Resource to link";
i18n.LblReferences = "References";
i18n.LblInherited = "Inherited";
i18n.LblMaxLength = "Max. length";
i18n.LblMinValue = "Min. value";
i18n.LblMaxValue = "Max. value";
i18n.LblAccuracy = "Decimals";
i18n.LblEnumValues = "Values (comma-sep.)";
i18n.LblSingleChoice = "Single choice";
i18n.LblMultipleChoice = "Multiple choice";
i18n.LblDirectLink = "Direct link";

i18n.BtnLogin = '<span class="glyphicon glyphicon-log-in"/>&nbsp;Login';
i18n.BtnLogout = '<span class="glyphicon glyphicon-log-out"/>&nbsp;Logout';
i18n.BtnProfile = 'Profile';
i18n.BtnBack = 'Back';
i18n.BtnCancel = 'Cancel';
i18n.BtnCancelImport = 'Abort';
i18n.BtnApply = 'Apply';
i18n.BtnDelete = '<span class="glyphicon glyphicon-remove"/>&nbsp;Delete';
i18n.BtnDeleteObject = '<span class="glyphicon glyphicon-remove"/>&nbsp;Delete resource and all it\'s references';
i18n.BtnDeleteObjectRef = '<span class="glyphicon glyphicon-remove"/>&nbsp;Delete this resource reference';
i18n.BtnImport = '<span class="glyphicon glyphicon-import"/>&nbsp;Import';
i18n.BtnCreate = '<span class="glyphicon glyphicon-import"/>&nbsp;Create';
i18n.BtnReplace = '<span class="glyphicon glyphicon-import"/>&nbsp;Replace';
i18n.BtnAdopt = '<span class="glyphicon glyphicon-import"/>&nbsp;Adopt';
i18n.BtnUpdate = '<span class="glyphicon glyphicon-import"/>&nbsp;'+i18n.LblUpdate;
//i18n.BtnImportSpecif = '<span class="glyphicon glyphicon-import"/>&nbsp;SpecIF';
//i18n.BtnImportReqif = '<span class="glyphicon glyphicon-import"/>&nbsp;ReqIF';
//i18n.BtnImportXls = '<span class="glyphicon glyphicon-import"/>&nbsp;xlsx';
//i18n.BtnProjectFromTemplate = "Create a new project from ReqIF-template";
i18n.BtnRead = '<span class="glyphicon glyphicon-eye-open"/>&nbsp;Read';
i18n.BtnExport = '<span class="glyphicon glyphicon-export"/>&nbsp;Export';
//i18n.BtnExportSpecif = '<span class="glyphicon glyphicon-export"/>&nbsp;SpecIF';
//i18n.BtnExportReqif = '<span class="glyphicon glyphicon-export"/>&nbsp;ReqIF';
i18n.BtnAdd = '<span class="glyphicon glyphicon-plus"/>&nbsp;Add';
i18n.BtnAddUser = '<span class="glyphicon glyphicon-plus"/>&nbsp;User  ';
i18n.BtnAddProject = '<span class="glyphicon glyphicon-plus"/>&nbsp;'+i18n.LblProject;
i18n.BtnAddSpec = '<span class="glyphicon glyphicon-plus"/>&nbsp;Outline';
i18n.BtnAddFolder = '<span class="glyphicon glyphicon-plus"/>&nbsp;Folder';
i18n.BtnAddAttribute = '<span class="glyphicon glyphicon-plus"/>&nbsp;Attribute';
i18n.BtnAddTypeComment = '<span class="glyphicon glyphicon-plus"/>&nbsp;Types for comments';
i18n.BtnClone = '<span class="glyphicon glyphicon-duplicate"/>&nbsp;Clone';
i18n.BtnEdit = '<span class="glyphicon glyphicon-pencil"/>&nbsp;Edit';
i18n.BtnSave = '<span class="glyphicon glyphicon-save"/>&nbsp;Save';
i18n.BtnSaveRole = '<span class="glyphicon glyphicon-save"/>&nbsp;Save Role';
i18n.BtnSaveAttr = '<span class="glyphicon glyphicon-save"/>&nbsp;Save Attribute';
i18n.BtnInsert = '<span class="glyphicon glyphicon-save"/>&nbsp;Insert';
i18n.BtnInsertSuccessor = '<span class="glyphicon glyphicon-save"/>&nbsp;Insert as successor';
i18n.BtnInsertChild = '<span class="glyphicon glyphicon-save"/>&nbsp;Insert as child';
i18n.BtnSaveRelation = '<span class="glyphicon glyphicon-save"/>&nbsp;Save statement';
i18n.BtnSaveItem = '<span class="glyphicon glyphicon-save"/>&nbsp;Save ~A';
i18n.BtnDetails = 'Details';
i18n.BtnAddRole = '<span class="glyphicon glyphicon-plus" />&nbsp;Role';
i18n.BtnFileSelect = '<span class="glyphicon glyphicon-plus" />&nbsp;Select file ...';
i18n.BtnPrevious = '<span class="glyphicon glyphicon-chevron-up"/>&nbsp;'+i18n.LblPrevious;
i18n.BtnNext = '<span class="glyphicon glyphicon-chevron-down"/>&nbsp;'+i18n.LblNext;
i18n.BtnGo = i18n.IcoGo+'&nbsp;'+i18n.LblGo;
i18n.BtnFilterReset = i18n.IcoFilter+'&nbsp;New';
i18n.BtnSelectHierarchy = "Select a hierarchy (outline)";

// Tabs:
i18n.TabAll = '<span class="glyphicon glyphicon-list"/>';
i18n.TabUserList = '<span class="glyphicon glyphicon-list"/>&nbsp;Users';
i18n.TabProjectList = '<span class="glyphicon glyphicon-list"/>&nbsp;Projects';
//i18n.TabProjectDetails = '<span class="glyphicon glyphicon-pencil"/>&nbsp;About';
i18n.TabUserDetails = '<span class="glyphicon glyphicon-pencil"/>&nbsp;About';
i18n.TabProjectUsers = '<span class="glyphicon glyphicon-user"/>&nbsp;Users';
i18n.TabUserProjects = '<span class="glyphicon glyphicon-book"/>&nbsp;Projects';
i18n.TabPermissions = '<span class="glyphicon glyphicon-lock"/>&nbsp;Permissions';
i18n.TabTypes = '<span class="glyphicon glyphicon-cog"/>&nbsp;'+i18n.LblTypes;
i18n.TabDataTypes = '<span class="glyphicon glyphicon-cog"/>&nbsp;'+i18n.LblDataTypes;
i18n.TabSpecTypes = '<span class="glyphicon glyphicon-cog"/>&nbsp;'+i18n.LblObjectTypes;
i18n.TabObjectTypes = '<span class="glyphicon glyphicon-cog"/>&nbsp;'+i18n.LblObjectTypes;
i18n.TabRelationTypes = '<span class="glyphicon glyphicon-cog"/>&nbsp;'+i18n.LblRelationTypes;
i18n.TabRelGroupTypes = '<span class="glyphicon glyphicon-cog"/>&nbsp;'+i18n.LblRelGroupTypes;
i18n.TabSpecificationTypes = '<span class="glyphicon glyphicon-cog"/>&nbsp;'+i18n.LblSpecificationTypes;
i18n.TabRifTypes = '<span class="glyphicon glyphicon-cog"/>&nbsp;'+i18n.LblRifTypes;
i18n.TabTable = '<span class="glyphicon glyphicon-th"/>&nbsp;Table';
i18n.TabDocument = '<span class="glyphicon glyphicon-book"/>&nbsp;Document';
i18n.TabFind = '<span class="glyphicon glyphicon-search"/>&nbsp;Search';
i18n.TabFilter = i18n.IcoFilter+'&nbsp;Filter';
i18n.TabPage = '<span class="glyphicon glyphicon-file"/>&nbsp;Page';
i18n.TabRevisions = '<span class="glyphicon glyphicon-grain"/>&nbsp;Revisions';
i18n.TabTimeline = '<span class="glyphicon glyphicon-film"/>&nbsp;Timeline';
i18n.TabRelations = '<span class="glyphicon glyphicon-link"/>&nbsp;Statements';
i18n.TabSort = '<span class="glyphicon glyphicon-magnet"/>&nbsp;Sort';
i18n.TabAttachments = '<span class="glyphicon glyphicon-paperclip"/>&nbsp;Images and Files';
i18n.TabComments = '<span class="glyphicon glyphicon-comment"/>&nbsp;Comments';
i18n.TabReports = '<span class="glyphicon glyphicon-stats"/>&nbsp;Reports';

// Functions:
i18n.FnProjectCreate = '<span class="glyphicon glyphicon-plus"/>&nbsp;Project';
i18n.FnProjectImport = '<span class="glyphicon glyphicon-import"/>&nbsp;Import project';
//i18n.FnImportReqif = '<span class="glyphicon glyphicon-import"/>&nbsp;Import ReqIF';
//i18n.FnImportCsv = '<span class="glyphicon glyphicon-import"/>&nbsp;Import CSV';
//i18n.FnImportXls = '<span class="glyphicon glyphicon-import"/>&nbsp;Import XLS';
//i18n.FnProjectFromTemplate = '<span class="glyphicon glyphicon-plus"/>&nbsp;Create project from template';
i18n.FnRefresh = '<span class="glyphicon glyphicon-refresh"/>&nbsp;Refresh';
i18n.FnRead = '<span class="glyphicon glyphicon-eye-open"/>';
i18n.FnOpen = i18n.FnRead;
i18n.FnUpdate = '<span class="glyphicon glyphicon-wrench"/>';
i18n.FnDelete = '<span class="glyphicon glyphicon-remove"/>';
i18n.FnRemove = i18n.FnDelete;

// ReqIF attribute names (replace any '.' by '_', so 'ReqIF.Text' becomes 'ReqIF_Text ):
i18n.ReqIF_ForeignID = 'ID';
i18n.ReqIF_ChapterName = 'Title';
i18n.ReqIF_Name = 'Title';
i18n.ReqIF_Text = 'Text';
i18n.ReqIF_ForeignCreatedOn = i18n.LblCreatedAt;
i18n.ReqIF_ForeignCreatedBy = i18n.LblCreatedBy;
i18n.ReqIF_ForeignCreatedThru = i18n.LblCreatedThru;
i18n.ReqIF_ForeignModifiedOn = i18n.LblModifiedAt;
i18n.ReqIF_ForeignModifiedBy = i18n.LblModifiedBy;
i18n.ReqIF_Revision = i18n.LblRevision;
i18n.ReqIF_Description = i18n.LblDescription;
i18n.ReqIF_ChangeDescription = 'Change Description';
i18n.ReqIF_Project = i18n.LblProject;
i18n.ReqIF_ForeignState = i18n.LblState;
i18n.ReqIF_Category = i18n.LblCategory;
i18n.ReqIF_Prefix = 'Prefix';
i18n.ReqIF_FitCriteria = 'Fit Criteria';
i18n.ReqIF_AssociatedFiles = 'Associated Files';
i18n.ReqIF_ChapterNumber = 'Chapter Number';   // shouldn't be used, as an object cannot (should not) know its position in the outline
// Dublin Core (DCMI) attribute names:
i18n.DC_title =
i18n.dcterms_title = "Title";
i18n.DC_description =
i18n.dcterms_description = "Description";
i18n.DC_identifier =
i18n.dcterms_identifier = i18n.LblIdentifier;
i18n.DC_type =
i18n.dcterms_type = "Element Type";
i18n.DC_creator =
i18n.dcterms_creator = "Author";
i18n.dcterms_source = "Source";
i18n.DC_modified =
i18n.dcterms_modified = i18n.LblModifiedAt;
//i18n.dcterms_contributor = "";
//i18n.dcterms_serviceProvider = "";
//i18n.dcterms_instanceShape = "";
// OSLC attribute names:
//i18n.rdf_type = "Type";
//i18n.oslc_rm_elaboratedBy = "";
//i18n.oslc_rm_elaborates = "";
//i18n.oslc_rm_specifiedBy = "";
//i18n.oslc_rm_specifies = "";
//i18n.oslc_rm_affectedBy = "";
//i18n.oslc_rm_trackedBy = "";
//i18n.oslc_rm_implementedBy = "";
i18n.oslc_rm_validates = "validates";
i18n.oslc_rm_validatedBy = "is validated by";
//i18n.oslc_rm_decomposes = "decomposes";
//i18n.oslc_rm_decomposedBy = "is decomposed by";
//i18n.oslc_rm_constrainedBy = "";
//i18n.oslc_rm_constrains = "";
// SpecIF entity, relation and attribute names:
i18n.SpecIF_Heading = "Heading";
i18n.SpecIF_Headings = "Headings";
i18n.SpecIF_Name = i18n.LblName;
//i18n.SpecIF_Names = "Names";
i18n.SpecIF_Folder = "Folder";	// deprecated, use SpecIF:Heading
i18n.SpecIF_Folders = "Folders";// deprecated, use SpecIF:Headings
i18n.SpecIF_Chapter = "Chapter";  // deprecated, use SpecIF:Heading
i18n.SpecIF_Chapters = "Chapters";// deprecated, use SpecIF:Headings
i18n.SpecIF_Paragraph = "Paragraph";
i18n.SpecIF_Paragraphs = "Paragraphs";
i18n.SpecIF_Information = "Information";  // deprecated, use SpecIF:Paragraph
i18n.SpecIF_Diagram = "Schematic";
i18n.SpecIF_Diagrams = "Schematics";
i18n.SpecIF_View = "Schematic";		// deprecated
i18n.SpecIF_Views = "Schematics";	// deprecated
i18n.FMC_Plan = "Schematic";
i18n.FMC_Plans = "Schematics";
i18n.SpecIF_Object = 
i18n.SpecIF_Resource = "Resource";
i18n.SpecIF_Objects = 
i18n.SpecIF_Resources = "Resources";
i18n.SpecIF_Relation = 
i18n.SpecIF_Statement = "Statement";
i18n.SpecIF_Relations = 
i18n.SpecIF_Statements = "Statements";
i18n.SpecIF_Property = "Property";
i18n.SpecIF_Properties = "Properties";
i18n.FMC_Actor = "Actor";
i18n.FMC_Actors = "Actors";
i18n.FMC_State = "State";
i18n.FMC_States = "States";
i18n.FMC_Event = "Event";
i18n.FMC_Events = "Events";
i18n.SpecIF_Feature = "Feature";
i18n.SpecIF_Features = "Features";
i18n.SpecIF_Requirement =
i18n.IREB_Requirement = "Requirement";
i18n.SpecIF_Requirements = 
i18n.IREB_Requirements = "Requirements";
i18n.SpecIF_BusinessProcess = 'Business Process'; 
i18n.SpecIF_BusinessProcesses = 'Business Processes';
i18n.SpecIF_Rationale = "Rationale";
i18n.SpecIF_Note = "Note";
i18n.SpecIF_Notes = "Notes";
i18n.SpecIF_Comment = "Comment";
i18n.SpecIF_Comments = "Comments";
i18n.SpecIF_Issue = "Issue";
i18n.SpecIF_Issues = "Issues";
i18n.SpecIF_Outline =
i18n.SpecIF_Hierarchy = "Outline";
i18n.SpecIF_Outlines =
i18n.SpecIF_Hierarchies = "Outlines";
i18n.SpecIF_Glossary = "Model-Elements (Glossary)";
i18n.SpecIF_Annotations = "Annotations";
i18n.SpecIF_Vote = "Vote";
i18n.SpecIF_Votes = "Votes";
i18n.SpecIF_Effort = "Effort";
i18n.SpecIF_Risk = 
i18n.IREB_Risk = "Risk";
i18n.SpecIF_Benefit = "Benefit";
i18n.SpecIF_Damage = "Damage";
i18n.SpecIF_Probability = "Probability";
i18n.SpecIF_shows = "shows";
i18n.SpecIF_contains = "contains";
i18n.oslc_rm_satisfiedBy = "satisfied bv";
i18n.oslc_rm_satisfies =
i18n.SpecIF_satisfies =
i18n.IREB_satisfies = "satisfies";
i18n.SpecIF_implements = "implements";
i18n.SpecIF_modifies =
i18n.SpecIF_stores = "writes and reads";
i18n.SpecIF_reads = "reads";
i18n.SpecIF_writes = "writes";
i18n.SpecIF_sendsTo = "sends to";
i18n.SpecIF_receivesFrom = "receives from";
i18n.SpecIF_influences = "influences";
i18n.SpecIF_follows = "follows";
i18n.SpecIF_precedes = "precedes";
i18n.SpecIF_signals = "signals";
i18n.SpecIF_triggers = "triggers";
i18n.SpecIF_dependsOn = "depends on";
i18n.SpecIF_refines =
i18n.IREB_refines = "refines";
i18n.IREB_refinedBy = "is refined by";
i18n.SpecIF_duplicates = "duplicates";
i18n.SpecIF_contradicts = "contradicts";
i18n.SpecIF_isAssociatedWith =
i18n.SysML_isAssociatedWith = "is associated with";
i18n.SysML_isAllocatedTo = "is executed by (allocated to)";
i18n.SysML_includes = "includes";
i18n.SysML_extends = "extends";
i18n.SpecIF_isDerivedFrom = 
i18n.SysML_isDerivedFrom = "is derived from";
i18n.SysML_isComposedOf = "is composed of";
i18n.SysML_isAggregatedBy = "is aggregated by";
i18n.SysML_isGeneralisationOf = "is Generalisation of";
i18n.SysML_isSpecialisationOf = "is Specialisation of";
i18n.SpecIF_isSynonymOf = "is synonymous with";
i18n.SpecIF_isInverseOf = "is inverse of";
i18n.SpecIF_inheritsFrom = "inherits from";
i18n.SpecIF_refersTo = "refers to";
i18n.SpecIF_commentRefersTo = "refers to";
i18n.SpecIF_issueRefersTo = "refers to";
i18n.SpecIF_includes = "includes";
i18n.SpecIF_excludes = "excludes";
i18n.SpecIF_mentions = "mentions";
i18n.SpecIF_sameAs = 
i18n.owl_sameAs = "is same as";
i18n.SpecIF_Id = i18n.LblIdentifier;
i18n.SpecIF_Type = i18n.LblType;
i18n.SpecIF_Notation = "Notation";
//i18n.SpecIF_Stereotype =
//i18n.SpecIF_SubClass = "SubClass";
i18n.SpecIF_Category = i18n.LblCategory;  
i18n.SpecIF_Status = i18n.LblState;
i18n.SpecIF_State = i18n.LblState;			// DEPRECATED
i18n.SpecIF_Priority = i18n.LblPriority;
i18n.SpecIF_Milestone = "Milestone";
i18n.SpecIF_DueDate = "Due date";
i18n.SpecIF_Icon = "Symbol";
i18n.SpecIF_Tag = "Tag";
i18n.SpecIF_Tags = "Tags";
//i18n.SpecIF_Creation = "";
i18n.SpecIF_Instantiation = "Instantiation";
i18n.SpecIF_Origin = "Origin";
i18n.SpecIF_Source = i18n.LblSource;
i18n.SpecIF_Target = i18n.LblTarget;
//i18n.SpecIF_Author = "Author";
//i18n.SpecIF_Authors = "Authors";
i18n.IREB_Stakeholder = "Stakeholder";
i18n.SpecIF_Responsible = "Responsible";
i18n.SpecIF_Responsibles = "Responsibles";
// attribute names used by the Interaction Room:
i18n.IR_Annotation = "Annotation";
i18n.IR_refersTo = i18n.SpecIF_refersTo;
i18n.IR_approves = "approves";
i18n.IR_opposes = "opposes";
i18n.IR_inheritsFrom = i18n.SpecIF_inheritsFrom;
// for oem-supplier agreement as defined by the "Hersteller-Initiative-Software":
i18n.HIS_OemStatus = 'OEM-Status';
i18n.HIS_OemComment = 'OEM-Comment';
i18n.HIS_SupplierStatus = 'Supplier-Status';
i18n.HIS_SupplierComment = 'Supplier-Comment';
// attribute names used by DocBridge Resource Director:
i18n.DBRD_ChapterName = 'Title';
i18n.DBRD_Name = 'Title';
i18n.DBRD_Text = 'Text';
// attribute names used by Atego Exerpt with RIF 1.1a:
i18n.Object_Heading = i18n.ReqIF_Name;
i18n.VALUE_Object_Heading = i18n.ReqIF_Name;
i18n.Object_Text = i18n.ReqIF_Text;
i18n.VALUE_Object_Text = i18n.ReqIF_Text;
i18n.Object_ID = i18n.ReqIF_ForeignID;
i18n.VALUE_Object_ID = i18n.ReqIF_ForeignID;

// Messages:
i18n.MsgConfirm = 'Please confirm:';
i18n.MsgConfirmDeletion = "Delete '~A'?";
i18n.MsgConfirmObjectDeletion = "Delete resource '<b>~A</b>' ?";
i18n.MsgConfirmUserDeletion = "Delete user '<b>~A</b>' ?";
i18n.MsgConfirmProjectDeletion = "Delete project '<b>~A</b>' ?";
i18n.MsgConfirmSpecDeletion = "Delete outline '<b>~A</b>' with all resource references ?";
i18n.MsgConfirmRoleDeletion = "Delete role '<b>~A</b>' ?";
i18n.MsgConfirmFolderDeletion = "Delete folder '<b>~A</b>' ?";
i18n.MsgInitialLoading = 'Loading the index for brisker navigation ... ';
i18n.MsgNoProject = 'No project found.';
i18n.MsgNoUser = 'No user found.';
i18n.MsgNoObject = 'No resource selected.';
i18n.MsgOtherProject = "Late response; another project has been selected meanwhile";
i18n.MsgWaitPermissions = 'Please wait while loading the permissions.';
i18n.MsgImportReqif = 'Permissible filetypes are *.reqifz, *.reqif, *.zip and *.xml. The content must conform with the ReqIF 1.0+, RIF 1.1a or RIF 1.2 schemata. The import may take several minutes for very large files.';
i18n.MsgImportSpecif = 'Permissible filetypes are *.specifz and *.specif. The content must conform with the SpecIF 0.10.4+ schemata. In case of large files, the import may take a couple of minutes.';
i18n.MsgImportBpmn = 'Permissible filetype is *.bpmn. The content must conform with the schema BPMN 2.0 XML. The import may take a couple of minutes.';
i18n.MsgImportXls = 'Permissible filetypes are *.xls, *.xlsx and *.csv. The import may take a couple of minutes for very large files.';
i18n.MsgExport = 'A zip-compressed file of the chosen format will be created. The export may take several minutes up for very large files; your browser will save the file according to its settings.';
i18n.MsgLoading = 'Still loading ...';
i18n.MsgSearching = 'Still searching ...';
i18n.MsgObjectsProcessed = '~A resources analyzed. ';
i18n.MsgObjectsFound = '~A resources found. ';
i18n.MsgNoMatchingObjects = 'No (more) matching resources.';
i18n.MsgNoRelatedObjects = 'This resource does not have any statements.';
i18n.MsgNoComments = 'This resource does not have any comments.';
i18n.MsgNoFiles = 'No file found.';
i18n.MsgAnalyzing = 'Still analyzing ...';
i18n.MsgNoReports = 'No reports for this project.';
i18n.MsgTypeNoObjectType = "Please add at least one resource-type, otherwise no resources can be created.";
i18n.MsgTypeNoAttribute = "Please add at least one attribute, otherwise the type is not useful.";
i18n.MsgNoObjectTypeForManualCreation = "Ressources cannot be created, because of missing permission or because there are no resourc-types for manual creation.";
i18n.MsgFilterClogged = 'Filter is clogged - at least one branch will not yield any results!';
i18n.MsgCredentialsUnknown = 'Credentials are unknown to the system.';
i18n.MsgUserMgmtNeedsAdminRole = 'Please ask an administrator to manage the users and roles.';
i18n.MsgProjectMgmtNeedsAdminRole = 'Please ask an administrator to manage the project characteristics, roles and permissios.';
i18n.MsgImportSuccessful = "Successfully imported '~A'.";
i18n.MsgImportDenied = "Import of '~A' denied: The project is owned by another organization or the schema is violated.";
i18n.MsgImportFailed = "Import of '~A' failed: The import has been aborted.";
i18n.MsgImportAborted = 'Import aborted on user request.';
i18n.MsgChooseRoleName = 'Please choose a role name:';
i18n.MsgIdConflict = "Could not create item '~A', as it already exists.";
i18n.MsgRoleNameConflict = "Could not create role '~A', as it already exists.";
i18n.MsgUserNameConflict = "Could not create user '~A', as it already exists.";
i18n.MsgFileApiNotSupported = 'This browser does not fully support the file API. Please choose a current browser.';
i18n.MsgDoNotLoadAllObjects = 'Loading all resources in a single call is not recommended.';
i18n.MsgReading = 'Reading';
i18n.MsgCreating = "Creating";
i18n.MsgUploading = "Uploading";
i18n.MsgImporting = "Importing";
i18n.MsgBrowserSaving = "Your browser saves the file according to its settings.";
i18n.MsgSuccess = "Successful!";
i18n.MsgSelectImg = "Select or upload an image:";
i18n.MsgImgWidth = "Image width [px]";
i18n.MsgNoEligibleRelTypes = "No statement-type defined for this resource-type.";
i18n.MsgClickToNavigate = "Double-click a resource to navigate:";
i18n.MsgClickToDeleteRel = "Double-click a resource to delete the respective statement:";
i18n.MsgNoSpec = "No outline found.";
i18n.MsgTypesCommentCreated = 'The types for comments have been created.';
i18n.MsgOutlineAdded = 'Outline will be prepended - please consolidate the existing and the new one manually.';
i18n.MsgLoadingTypes = 'Loading types';
i18n.MsgLoadingFiles = 'Loading images and files';
i18n.MsgLoadingObjects = 'Loading resources';
i18n.MsgLoadingRelations = 'Loading statements';
i18n.MsgLoadingHierarchies = 'Loading hierarchies';
i18n.MsgProjectCreated = 'Project successfully created';
i18n.MsgProjectUpdated = 'Project successfully updated';
i18n.MsgNoneSpecified = 'empty';

// Error messages:
i18n.Error = "Error";
i18n.Err403Forbidden = 'Access denied.';
i18n.Err403NoProjectFolder = 'Your role does not allow to update at least one of the concerned projects.';
//i18n.Err403NoProjectUpdate = 'Your role does not allow to update this project.';
i18n.Err403NoProjectDelete = 'Your role does not allow to delete this project.';
i18n.Err403NoUserDelete = 'Your role does not allow to delete a user.';
i18n.Err403NoRoleDelete = 'Your permissions do not allow to delete a role.';
i18n.Err404NotFound = "Item not found; it has probably been deleted.";
i18n.ErrNoItem = "Item '~A' not found.";
i18n.ErrNoObject = "Resource '~A' not found; it has probably been deleted.";
i18n.ErrNoSpec = "This project has no outline; at least one must be created.";
i18n.ErrInvalidFile = 'Invalid file.';
i18n.ErrInvalidFileType = "Invalid file type of '~A'.";
i18n.ErrInvalidAttachment = "Invalid file type. Please select one of ~A.";
i18n.ErrInvalidFileReqif = "Invalid file type of '~A'. Please select '*.reqifz', '*.reqif', '*.zip' or '*.xml'.";
i18n.ErrInvalidFileSpecif = "Invalid file type of '~A'. Please select '*.specifz' or '*.specif'.";
i18n.ErrInvalidFileBpmn = "Invalid file type of '~A'. Please select '*.bpmn'.";
i18n.ErrInvalidFileXls = "Invalid file type of '~A'. Please select '*.xlsx', '*.xls', or '*.csv'.";
//i18n.ErrInvalidFileElic = "Invalid file type of '~A'. Please select '*.elic_signed.xml'.";
i18n.ErrUpload = 'Upload error.';
i18n.ErrImport = "Import error.";
i18n.ErrImportTimeout = 'Import timeout.';
i18n.ErrCommunicationTimeout = 'Server-request timeout.';
i18n.ErrInvalidData = 'Invalid or harmful data.';
i18n.ErrInvalidContent = 'Invalid data; very probably erroneous XHTML-structure or harmful content.';
i18n.ErrInvalidRoleName = "Invalid role name '~A'.";
i18n.ErrUpdateConflict = "Your update is in conflict with another user's update.";
i18n.ErrInconsistentPermissions = "Permissions are contradictory, please contact your administrator.";
i18n.ErrObjectNotEligibleForRelation = "The resources cannot be related with the chosen statement type.";
i18n.Err400TypeIsInUse = "This type cannot be deleted, because it is in use."
i18n.Err402InsufficientLicense = "The submitted license is not sufficient for this operation.";

i18n.monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];
//i18n.monthAbbrs = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];

// App icons:
i18n.IcoHome = '<span class="glyphicon glyphicon-home"/>';
i18n.IcoSystemAdministration = '<span class="glyphicon glyphicon-wrench"/>';
i18n.IcoUserAdministration = '<span class="glyphicon glyphicon-user"/>';
i18n.IcoProjectAdministration = '<span class="glyphicon glyphicon-cog"/>';
//i18n.IcoProjectAdministration = '<span style="font-size:130%">&#9881;</span>';
i18n.IcoSpecifications = '<span class="glyphicon glyphicon-book"/>';
i18n.IcoReader = '<span class="glyphicon glyphicon-eye-open"/>';
//i18n.IcoImportReqif = '<span class="glyphicon glyphicon-import"/>';
//i18n.IcoImportCsv = '<span class="glyphicon glyphicon-import"/>';
//i18n.IcoImportXls = '<span class="glyphicon glyphicon-import"/>';
i18n.IcoSupport = '<span class="glyphicon glyphicon-question-sign"/>';

// App names:
i18n.LblHome = 'Welcome!';
i18n.LblProjects = 'Projects';
i18n.LblSystemAdministration = 'Setup';
i18n.LblUserAdministration = 'Users';
i18n.LblProjectAdministration = 'Types & Permissions';   // for the browser tabs - no HTML!
i18n.LblSpecifications = 'Content';
i18n.LblReader = 'SpecIF Reader';
i18n.LblLocal = 'SpecIF Editor';
i18n.LblSupport = 'Support';
i18n.AppHome = i18n.IcoHome+'&nbsp;'+i18n.LblHome;
i18n.AppSystemAdministration = i18n.IcoSystemAdministration+'&nbsp;Interactive Spec: '+i18n.LblSystemAdministration;
i18n.AppUserAdministration = i18n.IcoUserAdministration+'&nbsp;Interactive Spec: '+i18n.LblUserAdministration;
i18n.AppProjectAdministration = i18n.IcoProjectAdministration+'&nbsp;Interactive Spec: '+i18n.LblProjectAdministration;
i18n.AppSpecifications = i18n.IcoSpecifications+'&nbsp;Interactive Spec: '+i18n.LblSpecifications;
i18n.AppReader = i18n.IcoReader+'&nbsp;'+i18n.LblReader;
i18n.AppImport = i18n.IcoImport+'&nbsp;Import';
i18n.AppLocal = i18n.IcoSpecifications+'&nbsp;'+i18n.LblLocal;
i18n.AppSupport = i18n.IcoSupport+'&nbsp;'+i18n.LblSupport;
