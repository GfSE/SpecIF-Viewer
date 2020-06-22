/* 	Provide i18ns and messages in a certain language, in this case 'English' (en).
	The result can be obtained by reference of:
	- 	self.MsgText
	- phrase('MsgText')
	- phrase('MsgText', 'param')
	- In the messages defined below, '~A' can be inserted at the location where a call parameter shall be placed.
*/
function LanguageTextsEn() {
	var self = this;
	self.phrase = function( ms, pA ) { 
		// replace a variable '~A' with pA, if available:
		// for use in HTML fields.
		if( ms ) {
			if( pA ) return self[ms].replace( /(.*)~A(.*)/g, function( $0, $1, $2 ){ return $1+pA+$2 } ); 
			return self[ms] 
		};
		return ''
	};
	self.lookup = function( lb ) { 
		// toJsId: first replace '.' '-' '(' ')' and white-space by '_'
		// for use in regular text fields.
		return self[lb.toJsId()] || lb
	};

	self.IcoUser = '<span class="glyphicon glyphicon-user"/>';
	self.IcoSpecification = '<span class="glyphicon glyphicon-book"/>';
//	self.IcoReadSpecification = '<span class="glyphicon glyphicon-eye-open"/>';
//	self.IcoUpdateSpecification = '<span class="glyphicon glyphicon-pencil"/>';
//	self.IcoRead = '<span class="glyphicon glyphicon-eye-open"/>';
	self.IcoImport = '<span class="glyphicon glyphicon-import"/>';
	self.IcoExport = '<span class="glyphicon glyphicon-export"/>';
	self.IcoAdminister = '<span class="glyphicon glyphicon-wrench"/>';
	self.IcoUpdate = '<span class="glyphicon glyphicon-pencil"/>';
	self.IcoDelete = '<span class="glyphicon glyphicon-remove"/>';
	self.IcoAdd = '<span class="glyphicon glyphicon-plus"/>';
	self.IcoClone = '<span class="glyphicon glyphicon-duplicate"/>';
	self.IcoPrevious = '<span class="glyphicon glyphicon-chevron-up"/>';
	self.IcoNext = '<span class="glyphicon glyphicon-chevron-down"/>';
	self.IcoGo = '<span class="glyphicon glyphicon-search"/>';
	self.IcoFilter = '<span class="glyphicon glyphicon-filter"/>';
	self.IcoComment = '<span class="glyphicon glyphicon-comment"/>';
	self.IcoURL = '<span class="glyphicon glyphicon-map-marker"/>';
	self.IcoLogout = '<span class="glyphicon glyphicon-log-out"/>';
	self.IcoAbout = '<strong>&#169;</strong>'; // copyright sign

// Buttons:
//	self.LblImportReqif = 'ReqIF Import';
//	self.LblImportCsv = 'CSV Import';
//	self.LblImportXls = 'XLS Import';
//	self.LblExportPdf = 'PDF Export';
	self.LblAll = "All";
	self.LblAllObjects = "All resources";
	self.LblImport = 'Import';
	self.LblExport = 'Export';
	self.LblExportReqif = 'Export ReqIF-file';
	self.LblExportSpecif = 'Export SpecIF-file';
	self.LblAdminister = 'Administer';
	self.LblCreate ="Create";
	self.LblRead = 'Read';
	self.LblUpdate = 'Update';
	self.LblUpdateProject = 'Update project properties';
	self.LblUpdateSpec = 'Update outline properties';
	self.LblUpdateTypes = 'Update types & permissions';
	self.LblUpdateObject = 'Update this resource';
	self.LblDelete = 'Delete';
	self.LblDeleteProject = 'Delete this project';
	self.LblDeleteType = 'Delete this type';
	self.LblDeleteObject = 'Delete this resource';
	self.LblDeleteAttribute = 'Delete attribute';
	self.LblDeleteRelation = 'Delete statement';
	self.LblDeleteRole = 'Delete role';
	self.LblAdd = 'Create';
	self.LblAddItem = 'Create ~A';
	self.LblAddProject = "Add project";
	self.LblAddType = "Add type";
	self.LblAddDataType = "Add datatype";
	self.LblAddObjType = "Add ressource-type";
	self.LblAddRelType = "Add statement-type";
	self.LblAddSpcType = "Add outline-type";
	self.LblAddTypeComment = 'Add types for comments';
	self.LblAddObject = "Add resource";
	self.LblAddRelation = "Add statement";
	self.LblAddAttribute = "Add attribute";
	self.LblAddUser = "Add user";
	self.LblAddComment = 'Add a comment';
	self.LblAddCommentTo = "Add a comment to '~A':";
	self.LblAddCommentToObject = 'Add comment to this resource';
	self.LblAddFolder = "Create a folder";
	self.LblAddSpec = "Create an outline";
	self.LblClone = 'Clone';
	self.LblCloneObject = 'Clone this resource';
	self.LblCloneType = 'Clone this type';
	self.LblCloneSpec = 'Clone this outline';
	self.LblUserName = 'Username';
	self.LblPassword = 'Password';
	self.LblTitle = 'Title';
	self.LblProject = 'Project';
	self.LblName = 'Name';
	self.LblFirstName = 'First Name';
	self.LblLastName = 'Last Name';
	self.LblOrganizations = 'Organization';  // until multiple orgs per user are supported
	self.LblEmail = 'e-mail';
	self.LblFileName = 'File name';
	self.LblRoleGeneralAdmin = 'GENERAL-ADMIN';
	self.LblRoleProjectAdmin = 'PROJECT-ADMIN';
	self.LblRoleUserAdmin = 'USER-ADMIN';
	self.LblRoleReader = 'READER';
//	self.LblRoleReqif = 'REQIF';
	self.LblGlobalActions = 'Actions';
	self.LblItemActions = 'Actions';
	self.LblIdentifier = 'Identifier';
	self.LblProjectName = 'Project name';
	self.LblDescription = 'Description';
	self.LblState = 'Status';
	self.LblPriority = 'Priority';
	self.LblCategory = 'Category';
	self.LblAttribute = 'Attribute';
	self.LblAttributes = 'Attributes';
	self.LblAttributeValueRange = "Value Range";
	self.LblAttributeValues = "Values";
	self.LblAttributeValue = "Value";
	self.LblTool = 'Authoring Tool';
	self.LblMyRole = 'My role';
	self.LblRevision = 'Revision';
	self.LblCreatedAt = 'Created at';
	self.LblCreatedBy = 'Created by';
	self.LblCreatedThru = 'Created thru';
	self.LblModifiedAt = 'Modified at';
	self.LblModifiedBy = 'Modified by';
	self.LblProjectDetails = 'Properties';
	self.LblProjectUsers = '<span class="glyphicon glyphicon-user"/>&#160;Users with a role in this project';
	self.LblOtherUsers = 'Other Users';
	self.LblUserProjects = '<span class="glyphicon glyphicon-book"/>&#160;Projects of this user';
	self.LblOtherProjects = 'Other Projects';
	self.LblType = 'Type';
	self.LblTypes = 'Types';
	self.LblDataTypes = 'Data-types';
	self.LblDataType = 'Data-type';
	self.LblDataTypeTitle = 'Data-type Name';
	self.LblSpecTypes = 'Types';
	self.LblSpecType = "Type";
	self.LblResourceClasses = 'Resource-classes';
	self.LblResourceClass = 'Resource-class';
	self.LblStatementClasses = 'Statement-classes';
	self.LblStatementClass = 'Statement-class';
//	self.LblRelGroupTypes = 'Relationgroup-Types';
//	self.LblRelGroupType = 'Relationgroup-Type';
	self.LblSpecificationTypes = 'Outline-types';
	self.hierarchyType = 
	self.LblSpecificationType = 'Outline-type';
//	self.LblRifTypes = 'Types';
//	self.rifType = 
//	self.LblRifType = 'Type';
	self.LblSpecTypeTitle = 'Name';
	self.LblAttributeTitle = 'Attribute Name';
	self.LblSecondaryFiltersForObjects = 	self.IcoFilter+"&#160;Facet filters for '~A'";
	self.LblPermissions = 'Permissions';
	self.LblRoles = 'Roles';
	self.LblFormat = 'Format';
	self.LblOptions = 'Options';
	self.LblFileFormat = 'File format';
	self.modelElements = 'Model-Elements';
	self.withOtherProperties = 'with other Properties';
	self.withStatements = 'with Statements';
	self.LblStringMatch = '<span class="glyphicon glyphicon-text-background" />&#160;String Match';
	self.LblWordBeginnings = 'Word beginnings only';
	self.LblWholeWords = 'Whole words only';
	self.LblCaseSensitive = 'Case sensitive';
	self.LblExcludeEnums = 'Exclude enumerated values';
	self.LblNotAssigned = '(not assigned)';
	self.LblPrevious = 'Previous';
	self.LblNext = 'Next';
	self.LblPreviousStep = 'Backward';
	self.LblNextStep = 'Forward';
	self.LblGo = 'Go!';
	self.LblAll = 'All';
	self.LblHitCount = 'Hit Count';
	self.LblRelateAs = 'Relate as';
	self.LblSource = 'Subject';
	self.LblTarget = 'Object';
	self.LblEligibleSources = "Eligible resources as "+	self.LblSource;
	self.LblEligibleTargets = "Eligible resources as "+	self.LblTarget;
	self.LblSaveRelationAsSource = 'Link resource as '+	self.LblSource;
	self.LblSaveRelationAsTarget = 'Link resource as '+	self.LblTarget;
	self.LblIcon = 'Icon';
	self.LblCreation = 'Creation';
	self.LblCreateLink1 = "&#x2776;&#160;Desired Statement";
	self.LblCreateLink2 = "&#x2777;&#160;Resource to link";
	self.LblReferences = "References";
	self.LblInherited = "Inherited";
	self.LblMaxLength = "Max. length";
	self.LblMinValue = "Min. value";
	self.LblMaxValue = "Max. value";
	self.LblAccuracy = "Decimals";
	self.LblEnumValues = "Values (comma-sep.)";
	self.LblSingleChoice = "Single choice";
	self.LblMultipleChoice = "Multiple choice";
	self.LblDirectLink = "Direct link";

	self.BtnLogin = '<span class="glyphicon glyphicon-log-in"/>&#160;Login';
	self.BtnLogout = '<span class="glyphicon glyphicon-log-out"/>&#160;Logout';
	self.BtnProfile = 'Profile';
	self.BtnBack = 'Back';
	self.BtnCancel = 'Cancel';
	self.BtnCancelImport = 'Abort';
	self.BtnApply = 'Apply';
	self.BtnDelete = '<span class="glyphicon glyphicon-remove"/>&#160;Delete';
	self.BtnDeleteObject = '<span class="glyphicon glyphicon-remove"/>&#160;Delete resource and all it\'s references';
	self.BtnDeleteObjectRef = '<span class="glyphicon glyphicon-remove"/>&#160;Delete this resource reference';
	self.BtnImport = '<span class="glyphicon glyphicon-import"/>&#160;Import';
	self.BtnCreate = '<span class="glyphicon glyphicon-import"/>&#160;Create';
	self.BtnReplace = '<span class="glyphicon glyphicon-import"/>&#160;Replace';
	self.BtnAdopt = '<span class="glyphicon glyphicon-import"/>&#160;Adopt';
	self.BtnUpdate = '<span class="glyphicon glyphicon-import"/>&#160;'+	self.LblUpdate;
//	self.BtnImportSpecif = '<span class="glyphicon glyphicon-import"/>&#160;SpecIF';
//	self.BtnImportReqif = '<span class="glyphicon glyphicon-import"/>&#160;ReqIF';
//	self.BtnImportXls = '<span class="glyphicon glyphicon-import"/>&#160;xlsx';
//	self.BtnProjectFromTemplate = "Create a new project from ReqIF-template";
	self.BtnRead = '<span class="glyphicon glyphicon-eye-open"/>&#160;Read';
	self.BtnExport = '<span class="glyphicon glyphicon-export"/>&#160;Export';
//	self.BtnExportSpecif = '<span class="glyphicon glyphicon-export"/>&#160;SpecIF';
//	self.BtnExportReqif = '<span class="glyphicon glyphicon-export"/>&#160;ReqIF';
	self.BtnAdd = '<span class="glyphicon glyphicon-plus"/>&#160;Add';
	self.BtnAddUser = '<span class="glyphicon glyphicon-plus"/>&#160;User  ';
	self.BtnAddProject = '<span class="glyphicon glyphicon-plus"/>&#160;'+	self.LblProject;
	self.BtnAddSpec = '<span class="glyphicon glyphicon-plus"/>&#160;Outline';
	self.BtnAddFolder = '<span class="glyphicon glyphicon-plus"/>&#160;Folder';
	self.BtnAddAttribute = '<span class="glyphicon glyphicon-plus"/>&#160;Attribute';
	self.BtnAddTypeComment = '<span class="glyphicon glyphicon-plus"/>&#160;Classes for comments';
	self.BtnClone = '<span class="glyphicon glyphicon-duplicate"/>&#160;Clone';
	self.BtnEdit = '<span class="glyphicon glyphicon-pencil"/>&#160;Edit';
	self.BtnSave = '<span class="glyphicon glyphicon-save"/>&#160;Save';
	self.BtnSaveRole = '<span class="glyphicon glyphicon-save"/>&#160;Save Role';
	self.BtnSaveAttr = '<span class="glyphicon glyphicon-save"/>&#160;Save Attribute';
	self.BtnInsert = '<span class="glyphicon glyphicon-save"/>&#160;Insert';
	self.BtnInsertSuccessor = '<span class="glyphicon glyphicon-save"/>&#160;Insert as successor';
	self.BtnInsertChild = '<span class="glyphicon glyphicon-save"/>&#160;Insert as child';
	self.BtnSaveRelation = '<span class="glyphicon glyphicon-save"/>&#160;Save statement';
	self.BtnSaveItem = '<span class="glyphicon glyphicon-save"/>&#160;Save ~A';
	self.BtnDetails = 'Details';
	self.BtnAddRole = '<span class="glyphicon glyphicon-plus" />&#160;Role';
	self.BtnFileSelect = '<span class="glyphicon glyphicon-plus" />&#160;Select file ...';
	self.BtnPrevious = '<span class="glyphicon glyphicon-chevron-up"/>&#160;'+	self.LblPrevious;
	self.BtnNext = '<span class="glyphicon glyphicon-chevron-down"/>&#160;'+	self.LblNext;
	self.BtnGo = 	self.IcoGo+'&#160;'+	self.LblGo;
	self.BtnFilterReset = 	self.IcoFilter+'&#160;New';
	self.BtnSelectHierarchy = "Select a hierarchy (outline)";

// Tabs:
	self.TabAll = '<span class="glyphicon glyphicon-list"/>';
	self.TabUserList = '<span class="glyphicon glyphicon-list"/>&#160;Users';
	self.TabProjectList = '<span class="glyphicon glyphicon-list"/>&#160;Projects';
//	self.TabProjectDetails = '<span class="glyphicon glyphicon-pencil"/>&#160;About';
	self.TabUserDetails = '<span class="glyphicon glyphicon-pencil"/>&#160;About';
	self.TabProjectUsers = '<span class="glyphicon glyphicon-user"/>&#160;Users';
	self.TabUserProjects = '<span class="glyphicon glyphicon-book"/>&#160;Projects';
	self.TabPermissions = '<span class="glyphicon glyphicon-lock"/>&#160;Permissions';
	self.TabTypes = '<span class="glyphicon glyphicon-cog"/>&#160;'+	self.LblTypes;
	self.TabDataTypes = '<span class="glyphicon glyphicon-cog"/>&#160;'+	self.LblDataTypes;
	self.TabSpecTypes = '<span class="glyphicon glyphicon-cog"/>&#160;'+	self.LblResourceClasses;
	self.TabObjectTypes = '<span class="glyphicon glyphicon-cog"/>&#160;'+	self.LblResourceClasses;
	self.TabRelationTypes = '<span class="glyphicon glyphicon-cog"/>&#160;'+	self.LblRelationTypes;
//	self.TabRelGroupTypes = '<span class="glyphicon glyphicon-cog"/>&#160;'+	self.LblRelGroupTypes;
	self.TabSpecificationTypes = '<span class="glyphicon glyphicon-cog"/>&#160;'+	self.LblSpecificationTypes;
//	self.TabRifTypes = '<span class="glyphicon glyphicon-cog"/>&#160;'+	self.LblRifTypes;
	self.TabTable = '<span class="glyphicon glyphicon-th"/>&#160;Table';
	self.TabDocument = '<span class="glyphicon glyphicon-book"/>&#160;Document';
	self.TabFind = '<span class="glyphicon glyphicon-search"/>&#160;Search';
	self.TabFilter = 	self.IcoFilter+'&#160;Filter';
	self.TabPage = '<span class="glyphicon glyphicon-file"/>&#160;Page';
	self.TabRevisions = '<span class="glyphicon glyphicon-grain"/>&#160;Revisions';
	self.TabTimeline = '<span class="glyphicon glyphicon-film"/>&#160;Timeline';
	self.TabRelations = '<span class="glyphicon glyphicon-link"/>&#160;Statements';
	self.TabSort = '<span class="glyphicon glyphicon-magnet"/>&#160;Sort';
	self.TabAttachments = '<span class="glyphicon glyphicon-paperclip"/>&#160;Images and Files';
	self.TabComments = '<span class="glyphicon glyphicon-comment"/>&#160;Comments';
	self.TabReports = '<span class="glyphicon glyphicon-stats"/>&#160;Reports';

// Functions:
	self.FnProjectCreate = '<span class="glyphicon glyphicon-plus"/>&#160;Project';
	self.FnProjectImport = '<span class="glyphicon glyphicon-import"/>&#160;Import project';
//	self.FnImportReqif = '<span class="glyphicon glyphicon-import"/>&#160;Import ReqIF';
//	self.FnImportCsv = '<span class="glyphicon glyphicon-import"/>&#160;Import CSV';
//	self.FnImportXls = '<span class="glyphicon glyphicon-import"/>&#160;Import XLS';
//	self.FnProjectFromTemplate = '<span class="glyphicon glyphicon-plus"/>&#160;Create project from template';
	self.FnRefresh = '<span class="glyphicon glyphicon-refresh"/>&#160;Refresh';
	self.FnRead = '<span class="glyphicon glyphicon-eye-open"/>';
	self.FnOpen = 	self.FnRead;
	self.FnUpdate = '<span class="glyphicon glyphicon-wrench"/>';
	self.FnDelete = '<span class="glyphicon glyphicon-remove"/>';
	self.FnRemove = 	self.FnDelete;

// ReqIF attribute names (replace any '.' by '_', so 'ReqIF.Text' becomes 'ReqIF_Text ):
	self.ReqIF_ForeignID = 'ID';
	self.ReqIF_ChapterName = 'Title';
	self.ReqIF_Name = 'Title';
	self.ReqIF_Text = 'Text';
	self.ReqIF_ForeignCreatedOn = 	self.LblCreatedAt;
	self.ReqIF_ForeignCreatedBy = 	self.LblCreatedBy;
	self.ReqIF_ForeignCreatedThru = 	self.LblCreatedThru;
	self.ReqIF_ForeignModifiedOn = 	self.LblModifiedAt;
	self.ReqIF_ForeignModifiedBy = 	self.LblModifiedBy;
	self.ReqIF_Revision = 	self.LblRevision;
	self.ReqIF_Description = 	self.LblDescription;
	self.ReqIF_ChangeDescription = 'Change Description';
	self.ReqIF_Project = 	self.LblProject;
	self.ReqIF_ForeignState = 	self.LblState;
	self.ReqIF_Category = 	self.LblCategory;
	self.ReqIF_Prefix = 'Prefix';
	self.ReqIF_FitCriteria = 'Fit Criteria';
	self.ReqIF_AssociatedFiles = 'Associated Files';
	self.ReqIF_ChapterNumber = 'Chapter Number';   // shouldn't be used, as an object cannot (should not) know its position in the outline
// Dublin Core (DCMI) attribute names:
	self.DC_title =
	self.dcterms_title = "Title";
	self.DC_description =
	self.dcterms_description = "Description";
	self.DC_identifier =
	self.dcterms_identifier = 	self.LblIdentifier;
	self.DC_type =
	self.dcterms_type = "Element Type";
	self.DC_creator =
	self.dcterms_creator = "Author";
	self.DC_source =
	self.dcterms_source = "Source";
	self.DC_subject =
	self.dcterms_subject = "Subject";
	self.DC_modified =
	self.dcterms_modified = 	self.LblModifiedAt;
//	self.dcterms_contributor = "";
//	self.dcterms_serviceProvider = "";
//	self.dcterms_instanceShape = "";
// OSLC attribute names:
//	self.rdf_type = "Type";
//	self.oslc_rm_elaboratedBy = "";
//	self.oslc_rm_elaborates = "";
//	self.oslc_rm_specifiedBy = "";
//	self.oslc_rm_specifies = "";
//	self.oslc_rm_affectedBy = "";
//	self.oslc_rm_trackedBy = "";
	self.SpecIF_implements = 
	self.oslc_rm_implements = "implements";
	self.oslc_rm_implementedBy = "implemented by";
	self.oslc_rm_validates = "validates";
	self.oslc_rm_validatedBy = "is validated by";
//	self.oslc_rm_decomposes = "decomposes";
//	self.oslc_rm_decomposedBy = "is decomposed by";
//	self.oslc_rm_constrainedBy = "";
//	self.oslc_rm_constrains = "";
// SpecIF entity, relation and attribute names:
	self.SpecIF_Heading = "Heading";
	self.SpecIF_Headings = "Headings";
	self.SpecIF_Name = 	self.LblName;
//	self.SpecIF_Names = "Names";
	self.SpecIF_Folder = "Folder";	// deprecated, use SpecIF:Heading
	self.SpecIF_Folders = "Folders";// deprecated, use SpecIF:Headings
	self.SpecIF_Chapter = "Chapter";  // deprecated, use SpecIF:Heading
	self.SpecIF_Chapters = "Chapters";// deprecated, use SpecIF:Headings
	self.SpecIF_Paragraph = "Paragraph";
	self.SpecIF_Paragraphs = "Paragraphs";
	self.SpecIF_Information = "Information";  // deprecated, use SpecIF:Paragraph
	self.SpecIF_Diagram = "Schematic";
	self.SpecIF_Diagrams = "Schematics";
	self.SpecIF_View = "Schematic";		// deprecated
	self.SpecIF_Views = "Schematics";	// deprecated
	self.FMC_Plan = "Schematic";
	self.FMC_Plans = "Schematics";
	self.SpecIF_Object = 
	self.SpecIF_Resource = "Resource";
	self.SpecIF_Objects = 
	self.SpecIF_Resources = "Resources";
	self.SpecIF_Relation = 
	self.SpecIF_Statement = "Statement";
	self.SpecIF_Relations = 
	self.SpecIF_Statements = "Statements";
	self.SpecIF_Property = "Property";
	self.SpecIF_Properties = "Properties";
	self.FMC_Actor = "Actor";
	self.FMC_Actors = "Actors";
	self.FMC_State = "State";
	self.FMC_States = "States";
	self.FMC_Event = "Event";
	self.FMC_Events = "Events";
	self.SpecIF_Feature = "Feature";
	self.SpecIF_Features = "Features";
	self.SpecIF_Requirement =
	self.IREB_Requirement = "Requirement";
	self.SpecIF_Requirements = 
	self.IREB_Requirements = "Requirements";
	self.IREB_RequirementType = 	self.LblType;
	self.IREB_RequirementTypeFunction = "Function";
	self.IREB_RequirementTypeQuality = "Quality";
	self.IREB_RequirementTypeConstraint = "Constraint";
	self.SpecIF_BusinessProcess = 'Business Process'; 
	self.SpecIF_BusinessProcesses = 'Business Processes';
	self.SpecIF_Rationale = "Rationale";
	self.SpecIF_Note = "Note";
	self.SpecIF_Notes = "Notes";
	self.SpecIF_Comment = "Comment";
	self.SpecIF_Comments = "Comments";
	self.SpecIF_Issue = "Issue";
	self.SpecIF_Issues = "Issues";
	self.SpecIF_Outline =
	self.SpecIF_Hierarchy = "Outline";
	self.SpecIF_Outlines =
	self.SpecIF_Hierarchies = "Outlines";
	self.SpecIF_Glossary = "Model-Elements (Glossary)";
	self.SpecIF_Collection = "Collection or Group";
	self.SpecIF_Collections = "Collections and Groups";
	self.SpecIF_Annotations = "Annotations";
	self.SpecIF_Vote = "Vote";
	self.SpecIF_Votes = "Votes";
	self.SpecIF_Effort = "Effort";
	self.SpecIF_Risk = 
	self.IREB_Risk = "Risk";
	self.SpecIF_Benefit = "Benefit";
	self.SpecIF_Damage = "Damage";
	self.SpecIF_Probability = "Probability";
	self.SpecIF_shows = "shows";
	self.SpecIF_contains = "contains";
	self.oslc_rm_satisfiedBy = "satisfied bv";
	self.oslc_rm_satisfies =
	self.SpecIF_satisfies =
	self.IREB_satisfies = "satisfies";
	self.SpecIF_modifies =
	self.SpecIF_stores = "writes and reads";
	self.SpecIF_reads = "reads";
	self.SpecIF_writes = "writes";
	self.SpecIF_sendsTo = "sends to";
	self.SpecIF_receivesFrom = "receives from";
	self.SpecIF_influences = "influences";
	self.SpecIF_follows = "follows";
	self.SpecIF_precedes = "precedes";
	self.SpecIF_signals = "signals";
	self.SpecIF_triggers = "triggers";
	self.SpecIF_dependsOn = "depends on";
	self.SpecIF_realizes = "realisizes";
	self.SpecIF_refines =
	self.SpecIF_serves = "serves";
	self.IREB_refines = "refines";
	self.IREB_refinedBy = "is refined by";
	self.SpecIF_duplicates = "duplicates";
	self.SpecIF_contradicts = "contradicts";
	self.SpecIF_isAssociatedWith =
	self.SysML_isAssociatedWith = "is associated with";
	self.SysML_isAllocatedTo = "is executed by (allocated to)";
	self.SysML_includes = "includes";
	self.SysML_extends = "extends";
	self.SpecIF_isDerivedFrom = 
	self.SysML_isDerivedFrom = "is derived from";
	self.SpecIF_isComposedOf = 
	self.SysML_isComposedOf = "is composed of";
	self.SpecIF_isAggregatedBy =
	self.SysML_isAggregatedBy = "is aggregated by";
	self.SpecIF_isGeneralisationOf = 
	self.SysML_isGeneralisationOf = "is Generalization of";
	self.SpecIF_isSpecializationOf =
	self.SpecIF_isSpecialisationOf = 
	self.SysML_isSpecialisationOf = "is Specialization of";
	self.SpecIF_isSynonymOf = "is synonymous with";
	self.SpecIF_isInverseOf = "is inverse of";
	self.SpecIF_inheritsFrom = "inherits from";
	self.SpecIF_refersTo = "refers to";
	self.SpecIF_commentRefersTo = "refers to";
	self.SpecIF_issueRefersTo = "refers to";
	self.SpecIF_includes = "includes";
	self.SpecIF_excludes = "excludes";
	self.SpecIF_mentions = "mentions";
	self.SpecIF_sameAs = 
	self.owl_sameAs = "is same as";
	self.SpecIF_Id = 	self.LblIdentifier;
	self.SpecIF_Type = 	self.LblType;
	self.SpecIF_Notation = "Notation";
//	self.SpecIF_Stereotype =
//	self.SpecIF_SubClass = "SubClass";
	self.SpecIF_Category = 	self.LblCategory;  
	self.SpecIF_Status = 	self.LblState;
	self.SpecIF_State = 	self.LblState;			// DEPRECATED
	self.SpecIF_Priority = 	self.LblPriority;
	self.SpecIF_Milestone = "Milestone";
	self.SpecIF_DueDate = "Due date";
	self.SpecIF_Icon = "Symbol";
	self.SpecIF_Tag = "Tag";
	self.SpecIF_Tags = "Tags";
	self.SpecIF_UserStory = "User-Story";
//	self.SpecIF_Creation = "";
	self.SpecIF_Instantiation = "Instantiation";
	self.SpecIF_Origin = "Origin";
	self.SpecIF_Source = 	self.LblSource;
	self.SpecIF_Target = 	self.LblTarget;
//	self.SpecIF_Author = "Author";
//	self.SpecIF_Authors = "Authors";
	self.IREB_Stakeholder = "Stakeholder";
	self.SpecIF_Responsible = "Responsible";
	self.SpecIF_Responsibles = "Responsibles";
// attribute names used by the Interaction Room:
	self.IR_Annotation = "Annotation";
	self.IR_refersTo = 	self.SpecIF_refersTo;
	self.IR_approves = "approves";
	self.IR_opposes = "opposes";
	self.IR_inheritsFrom = 	self.SpecIF_inheritsFrom;
// for oem-supplier agreement as defined by the "Hersteller-Initiative-Software":
	self.HIS_OemStatus = 'OEM-Status';
	self.HIS_OemComment = 'OEM-Comment';
	self.HIS_SupplierStatus = 'Supplier-Status';
	self.HIS_SupplierComment = 'Supplier-Comment';
// attribute names used by DocBridge Resource Director:
	self.DBRD_ChapterName = 'Title';
	self.DBRD_Name = 'Title';
	self.DBRD_Text = 'Text';
// attribute names used by Atego Exerpt with RIF 1.1a:
	self.Object_Heading = 	self.ReqIF_Name;
	self.VALUE_Object_Heading = 	self.ReqIF_Name;
	self.Object_Text = 	self.ReqIF_Text;
	self.VALUE_Object_Text = 	self.ReqIF_Text;
	self.Object_ID = 	self.ReqIF_ForeignID;
	self.VALUE_Object_ID = 	self.ReqIF_ForeignID;
	self.SpecIF_priorityHigh = "high";
	self.SpecIF_priorityRatherHigh = "rather high";
	self.SpecIF_priorityMedium = "medium";
	self.SpecIF_priorityRatherLow = "rather low";
	self.SpecIF_priorityLow = "low";
	self.SpecIF_sizeXL = "very large";
	self.SpecIF_sizeL = "large";
	self.SpecIF_sizeM = "medium";
	self.SpecIF_sizeS = "small";
	self.SpecIF_sizeXS = "very small";

// Messages:
	self.MsgConfirm = 'Please confirm:';
	self.MsgConfirmDeletion = "Delete '~A'?";
	self.MsgConfirmObjectDeletion = "Delete resource '<b>~A</b>' ?";
	self.MsgConfirmUserDeletion = "Delete user '<b>~A</b>' ?";
	self.MsgConfirmProjectDeletion = "Delete project '<b>~A</b>' ?";
	self.MsgConfirmSpecDeletion = "Delete outline '<b>~A</b>' with all resource references ?";
	self.MsgConfirmRoleDeletion = "Delete role '<b>~A</b>' ?";
	self.MsgConfirmFolderDeletion = "Delete folder '<b>~A</b>' ?";
	self.MsgInitialLoading = 'Loading the index for brisker navigation ... ';
	self.MsgNoProject = 'No project found.';
	self.MsgNoUser = 'No user found.';
	self.MsgNoObject = 'No resource selected.';
	self.MsgCreateResource = "Create a resource";
	self.MsgCloneResource = "Clone a resource";
	self.MsgUpdateResource = 	self.LblUpdate+" a resource";
	self.MsgDeleteResource = "Delete a resource";
	self.MsgCreateStatement = "Create a statement";
	self.MsgOtherProject = "Late response; another project has been selected meanwhile";
	self.MsgWaitPermissions = 'Please wait while loading the permissions.';
	self.MsgImportReqif = 'Permissible filetypes are *.reqifz, *.reqif, *.zip and *.xml. The content must conform with the ReqIF 1.0+, RIF 1.1a or RIF 1.2 schemata. The import may take several minutes for very large files.';
	self.MsgImportSpecif = 'Permissible filetypes are *.specifz and *.specif. The content must conform with the SpecIF 0.10.4+ schemata. In case of large files, the import may take a couple of minutes.';
	self.MsgImportBpmn = 'Permissible filetype is *.bpmn. The content must conform with the schema BPMN 2.0 XML. The import may take a couple of minutes.';
	self.MsgImportXls = 'Permissible filetypes are *.xls, *.xlsx and *.csv. The import may take a couple of minutes for very large files.';
	self.MsgExport = 'A zip-compressed file of the chosen format will be created. The export may take several minutes up for very large files; your browser will save the file according to its settings.';
	self.MsgLoading = 'Still loading ...';
	self.MsgSearching = 'Still searching ...';
	self.MsgObjectsProcessed = '~A resources analyzed. ';
	self.MsgObjectsFound = '~A resources found. ';
	self.MsgNoMatchingObjects = 'No (more) matching resources.';
	self.MsgNoRelatedObjects = 'This resource does not have any statements.';
	self.MsgNoComments = 'This resource does not have any comments.';
	self.MsgNoFiles = 'No file found.';
	self.MsgAnalyzing = 'Still analyzing ...';
	self.MsgNoReports = 'No reports for this project.';
	self.MsgTypeNoObjectType = "Please add at least one resource-class, otherwise no resources can be created.";
	self.MsgTypeNoAttribute = "Please add at least one attribute, otherwise the type is not useful.";
	self.MsgNoObjectTypeForManualCreation = "Ressources cannot be created, because of missing permission or because there are no resourc-types for manual creation.";
	self.MsgFilterClogged = 'Filter is clogged - at least one branch will not yield any results!';
	self.MsgCredentialsUnknown = 'Credentials are unknown to the system.';
	self.MsgUserMgmtNeedsAdminRole = 'Please ask an administrator to manage the users and roles.';
	self.MsgProjectMgmtNeedsAdminRole = 'Please ask an administrator to manage the project characteristics, roles and permissios.';
	self.MsgImportSuccessful = "Successfully imported '~A'.";
	self.MsgImportDenied = "Import of '~A' denied: The project is owned by another organization or the schema is violated.";
	self.MsgImportFailed = "Import of '~A' failed: The import has been aborted.";
	self.MsgImportAborted = 'Import aborted on user request.';
	self.MsgChooseRoleName = 'Please choose a role name:';
	self.MsgIdConflict = "Could not create item '~A', as it already exists.";
	self.MsgRoleNameConflict = "Could not create role '~A', as it already exists.";
	self.MsgUserNameConflict = "Could not create user '~A', as it already exists.";
	self.MsgFileApiNotSupported = 'This browser does not fully support the file API. Please choose a current browser.';
	self.MsgDoNotLoadAllObjects = 'Loading all resources in a single call is not recommended.';
	self.MsgReading = 'Reading';
	self.MsgCreating = "Creating";
	self.MsgUploading = "Uploading";
	self.MsgImporting = "Importing";
	self.MsgBrowserSaving = "Your browser saves the file according to its settings.";
	self.MsgSuccess = "Successful!";
	self.MsgSelectImg = "Select or upload an image:";
	self.MsgImgWidth = "Image width [px]";
	self.MsgSelectResClass = "Choose a "+	self.LblResourceClass;
	self.MsgSelectStaClass = "Choose a "+	self.LblStatementClass;
	self.MsgNoEligibleRelTypes = "No statement-type defined for this resource-type.";
	self.MsgClickToNavigate = "Double-click a resource to navigate:";
	self.MsgClickToDeleteRel = "Double-click a resource to delete the respective statement:";
	self.MsgNoSpec = "No outline found.";
	self.MsgTypesCommentCreated = 'The types for comments have been created.';
	self.MsgOutlineAdded = 'Outline will be prepended - please consolidate the existing and the new one manually.';
	self.MsgLoadingTypes = 'Loading types';
	self.MsgLoadingFiles = 'Loading images and files';
	self.MsgLoadingObjects = 'Loading resources';
	self.MsgLoadingRelations = 'Loading statements';
	self.MsgLoadingHierarchies = 'Loading hierarchies';
	self.MsgProjectCreated = 'Project successfully created';
	self.MsgProjectUpdated = 'Project successfully updated';
	self.MsgNoneSpecified = 'empty';

// Error messages:
	self.Error = "Error";
	self.Err403Forbidden = 'Access denied.';
	self.Err403NoProjectFolder = 'Your role does not allow to update at least one of the concerned projects.';
//	self.Err403NoProjectUpdate = 'Your role does not allow to update this project.';
	self.Err403NoProjectDelete = 'Your role does not allow to delete this project.';
	self.Err403NoUserDelete = 'Your role does not allow to delete a user.';
	self.Err403NoRoleDelete = 'Your permissions do not allow to delete a role.';
	self.Err404NotFound = "Item not found; it has probably been deleted.";
	self.ErrNoItem = "Item '~A' not found.";
	self.ErrNoObject = "Resource '~A' not found; it has probably been deleted.";
	self.ErrNoSpec = "This project has no outline; at least one must be created.";
	self.ErrInvalidFile = 'Invalid file.';
	self.ErrInvalidFileType = "Invalid file type of '~A'.";
	self.ErrInvalidAttachment = "Invalid file type. Please select one of ~A.";
	self.ErrInvalidFileReqif = "Invalid file type of '~A'. Please select '*.reqifz', '*.reqif', '*.zip' or '*.xml'.";
	self.ErrInvalidFileSpecif = "Invalid file type of '~A'. Please select '*.specifz' or '*.specif'.";
	self.ErrInvalidFileBpmn = "Invalid file type of '~A'. Please select '*.bpmn'.";
	self.ErrInvalidFileTogaf = "Invalid file type of '~A'. Please select '*.xml'.";
	self.ErrInvalidFileXls = "Invalid file type of '~A'. Please select '*.xlsx', '*.xls', or '*.csv'.";
//	self.ErrInvalidFileElic = "Invalid file type of '~A'. Please select '*.elic_signed.xml'.";
	self.ErrUpload = 'Upload error.';
	self.ErrImport = "Import error.";
	self.ErrImportTimeout = 'Import timeout.';
	self.ErrCommunicationTimeout = 'Server-request timeout.';
	self.ErrInvalidData = 'Invalid or harmful data.';
	self.ErrInvalidContent = 'Invalid data; very probably erroneous XHTML-structure or harmful content.';
	self.ErrInvalidRoleName = "Invalid role name '~A'.";
	self.ErrUpdateConflict = "Your update is in conflict with another user's update.";
	self.ErrInconsistentPermissions = "Permissions are contradictory, please contact your administrator.";
	self.ErrObjectNotEligibleForRelation = "The resources cannot be related with the chosen statement type.";
	self.Err400TypeIsInUse = "This type cannot be deleted, because it is in use."
	self.Err402InsufficientLicense = "The submitted license is not sufficient for this operation.";

//	self.monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];
//	self.monthAbbrs = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];

// App icons:
	self.IcoHome = '<span class="glyphicon glyphicon-home"/>';
	self.IcoSystemAdministration = '<span class="glyphicon glyphicon-wrench"/>';
	self.IcoUserAdministration = '<span class="glyphicon glyphicon-user"/>';
	self.IcoProjectAdministration = '<span class="glyphicon glyphicon-cog"/>';
//	self.IcoProjectAdministration = '<span style="font-size:130%">&#9881;</span>';
	self.IcoSpecifications = '<span class="glyphicon glyphicon-book"/>';
	self.IcoReader = '<span class="glyphicon glyphicon-eye-open"/>';
//	self.IcoImportReqif = '<span class="glyphicon glyphicon-import"/>';
//	self.IcoImportCsv = '<span class="glyphicon glyphicon-import"/>';
//	self.IcoImportXls = '<span class="glyphicon glyphicon-import"/>';
	self.IcoSupport = '<span class="glyphicon glyphicon-question-sign"/>';

// App names:
	self.LblHome = 'Welcome!';
	self.LblProjects = 'Projects';
	self.LblSystemAdministration = 'Setup';
	self.LblUserAdministration = 'Users';
	self.LblProjectAdministration = 'Types & Permissions';   // for the browser tabs - no HTML!
	self.LblSpecifications = 'Content';
	self.LblReader = 'SpecIF Reader';
	self.LblEditor = 'SpecIF Editor';
	self.LblSupport = 'Support';
	self.AppHome = 	self.IcoHome+'&#160;'+	self.LblHome;
	self.AppSystemAdministration = 	self.IcoSystemAdministration+'&#160;Interactive Spec: '+	self.LblSystemAdministration;
	self.AppUserAdministration = 	self.IcoUserAdministration+'&#160;Interactive Spec: '+	self.LblUserAdministration;
	self.AppProjectAdministration = 	self.IcoProjectAdministration+'&#160;Interactive Spec: '+	self.LblProjectAdministration;
	self.AppSpecifications = 	self.IcoSpecifications+'&#160;Interactive Spec: '+	self.LblSpecifications;
	self.AppReader = 	self.IcoReader+'&#160;'+	self.LblReader;
	self.AppImport = 	self.IcoImport+'&#160;Import';
	self.AppLocal = 	self.IcoSpecifications+'&#160;'+	self.LblEditor;
	self.AppSupport = 	self.IcoSupport+'&#160;'+	self.LblSupport;
};
