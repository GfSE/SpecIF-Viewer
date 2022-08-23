/* 	Provide i18ns and messages in a certain language, in this case 'English' (en).
	The result can be obtained by reference of:
	- yourVarName.MsgText (in most cases, when there are only characters allowed for js variable names)
	- yourVarName.lookup('MsgName', 'param')
	- In the messages defined below, '~A' can be inserted at the location where a call parameter shall be placed.

	Search Icons: https://fontawesome.com/v4.7/icons/
*/
function LanguageTextsEn() {
    var self:any = {};
	self.lookup = function (lb: string, pA: string): string {
		// replace a variable '~A' with pA, if available:
		if (lb) {
			// jsIdOf(): first replace '.' '-' '(' ')' and white-space by '_'
			let res = self[lb.jsIdOf()] || lb;
			if (pA) return res.replace(/~A/, pA);
			return res;
		};
		return '';
	};

//	self.IcoUser = '<i class="bi-person"></i>';
	self.IcoSpecification = '<i class="bi-book"></i>';
	self.IcoRead = '<i class="bi-eye"></i>';
	self.IcoImport = '<i class="bi-box-arrow-in-right"></i>';
	self.IcoExport = '<i class="bi-box-arrow-right"></i>';
	self.IcoAdminister = '<i class="bi-wrench"></i>';
//	self.IcoUpdateSpecification =
	self.IcoEdit = '<i class="bi-pencil"></i>';
	self.IcoDelete = '<i class="bi-x-lg"></i>';
	self.IcoAdd = '<i class="bi-plus-lg"></i>';
	self.IcoClone = '<i class="bi-files"></i>';
	self.IcoSave = '<i class="bi-check-lg"></i>';
//	self.IcoReadSpecification = self.IcoRead;
	self.IcoPrevious = '<i class="bi-chevron-up"></i>';
	self.IcoNext = '<i class="bi-chevron-down"></i>';
	self.IcoFilter = '<i class="bi-search"></i>';
	self.IcoType = '<i class="bi-wrench"></i>';
//	self.IcoGo =
//	self.IcoFind = '<i class="bi-search"></i>';
	self.IcoComment = '<i class="bi-chat"></i>';
//	self.IcoURL = '<span class="glyphicon glyphicon-map-marker"></span>';
//	self.IcoLogout = '<span class="glyphicon glyphicon-log-out"></span>';
	self.IcoAbout = '<strong>&#169;</strong>'; // copyright sign
//	self.IcoAbout = '<i class="fa fa-copyright"></i>';
	self.IcoRelation = '<i class="bi-link-45deg" ></i>';
	self.IcoReport = '<i class="bi-bar-chart-line" ></i>';

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
//	self.LblProjectUsers = self.IcoUser+'&#160;Users with a role in this project';
//	self.LblOtherUsers = 'Other Users';
//	self.LblUserProjects = self.IcoSpecification+'&#160;Projects of this user';
//	self.LblOtherProjects = 'Other Projects';
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
	self.LblSecondaryFiltersForObjects = self.IcoFilter+"&#160;Facet filters for '~A'";
	self.LblPermissions = 'Permissions';
	self.LblRoles = 'Roles';
	self.LblFormat = 'Format';
	self.LblOptions = 'Options';
	self.LblFileFormat = 'File format';
	self.modelElements = 'Model-Elements';
	self.withOtherProperties = 'with other Properties';
	self.showEmptyProperties = 'show empty Properties';
	self.withStatements = 'with Statements';
	self.LblStringMatch = 'String <mark>Match</mark>';
	self.LblWordBeginnings = 'Word beginnings only';
	self.LblWholeWords = 'Whole words only';
	self.LblCaseSensitive = 'Case sensitive';
	self.LblExcludeEnums = 'Exclude enumerated values';
	self.LblNotAssigned = '(not assigned)';
	self.LblPrevious = 'Previous';
	self.LblNext = 'Next';
	self.LblPreviousStep = 'Backward';
	self.LblNextStep = 'Forward';
//	self.LblGo = 'Go!';
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

//	self.BtnLogin = '<span class="glyphicon glyphicon-log-in"></span>&#160;Login';
//	self.BtnLogout = '<span class="glyphicon glyphicon-log-out"></span>&#160;Logout';
	self.BtnProfile = 'Profile';
	self.BtnBack = 'Back';
	self.BtnCancel = 'Cancel';
	self.BtnCancelImport = 'Abort';
	self.BtnApply = 'Apply';
	self.BtnDelete = self.IcoDelete+'&#160;Delete';
	self.BtnDeleteObject = self.IcoDelete+'&#160;Delete resource and all it\'s references';
	self.BtnDeleteObjectRef = self.IcoDelete+'&#160;Delete this resource reference';
	self.BtnImport = self.IcoImport + '&#160;Import';
	self.BtnCreate = self.IcoImport + '&#160;Create';
	self.BtnReplace = self.IcoImport + '&#160;Replace';
	self.BtnAdopt = self.IcoImport + '&#160;Adopt';
	self.BtnUpdate = self.IcoImport + '&#160;' + self.LblUpdate;
	self.BtnUpdateObject = self.IcoSave + '&#160;' + self.LblUpdate;
//	self.BtnImportSpecif = self.IcoImport+'&#160;SpecIF';
//	self.BtnImportReqif = self.IcoImport+'&#160;ReqIF';
//	self.BtnImportXls = self.IcoImport+'&#160;xlsx';
//	self.BtnProjectFromTemplate = "Create a new project from ReqIF-template";
	self.BtnRead = self.IcoRead+'&#160;Read';
	self.BtnExport = self.IcoExport + '&#160;Export';
//	self.BtnExportSpecif = self.IcoExport+'&#160;SpecIF';
//	self.BtnExportReqif = self.IcoExport+'&#160;ReqIF';
	self.BtnAdd = self.IcoAdd+'&#160;Add';
	self.BtnAddUser = self.IcoAdd+'&#160;User  ';
	self.BtnAddProject = self.IcoAdd+'&#160;'+	self.LblProject;
	self.BtnAddSpec = self.IcoAdd+'&#160;Outline';
	self.BtnAddFolder = self.IcoAdd+'&#160;Folder';
	self.BtnAddAttribute = self.IcoAdd+'&#160;Attribute';
	self.BtnAddTypeComment = self.IcoAdd+'&#160;Classes for comments';
	self.BtnClone = self.IcoClone +'&#160;Clone';
	self.BtnEdit = self.IcoEdit +'&#160;Edit';
	self.BtnSave = self.IcoSave+'&#160;Save';
	self.BtnSaveRole = self.IcoSave+'&#160;Save Role';
	self.BtnSaveAttr = self.IcoSave+'&#160;Save Attribute';
	self.BtnInsert = self.IcoAdd+'&#160;Insert';
	self.BtnInsertSuccessor = self.IcoAdd+'&#160;Insert as successor';
	self.BtnInsertChild = self.IcoAdd+'&#160;Insert as child';
	self.BtnSaveRelation = self.IcoSave+'&#160;Save statement';
	self.BtnSaveItem = self.IcoSave+'&#160;Save ~A';
	self.BtnDetails = 'Details';
	self.BtnAddRole = self.IcoAdd +'&#160;Role';
	self.BtnFileSelect = self.IcoAdd +'&#160;Select file ...';
//	self.BtnPrevious = self.IcoPrevious+'&#160;' + self.LblPrevious;
//	self.BtnNext = self.IcoNext+'&#160;' + self.LblNext;
//	self.BtnGo = self.IcoGo+'&#160;'+self.LblGo;
	self.BtnFilterReset = self.IcoFilter+'&#160;New';
	self.BtnSelectHierarchy = "Select a hierarchy (outline)";

// Tabs:
/*	self.TabAll = '<span class="glyphicon glyphicon-list"></span>';
	self.TabUserList = '<span class="glyphicon glyphicon-list"></span>&#160;Users';
	self.TabProjectList = '<span class="glyphicon glyphicon-list"></span>&#160;Projects';
//	self.TabProjectDetails = self.IcoEdit+'&#160;About';
	self.TabUserDetails = self.IcoEdit +'&#160;About';
	self.TabProjectUsers = self.IcoUser+'&#160;Users';
	self.TabUserProjects = self.IcoSpecification+'&#160;Projects';
	self.TabPermissions = '<span class="glyphicon glyphicon-lock"></span>&#160;Permissions';
	self.TabTypes = self.IcoType+'&#160;'+	self.LblTypes;
	self.TabDataTypes = self.IcoType+'&#160;'+	self.LblDataTypes; */
	self.TabSpecTypes = self.IcoType+'&#160;'+	self.LblResourceClasses;
/*	self.TabObjectTypes = self.IcoType+'&#160;'+	self.LblResourceClasses;
	self.TabRelationTypes = self.IcoType+'&#160;'+	self.LblRelationTypes;
//	self.TabRelGroupTypes = self.IcoType+'&#160;'+	self.LblRelGroupTypes;
	self.TabSpecificationTypes = self.IcoType+'&#160;'+	self.LblSpecificationTypes;
//	self.TabRifTypes = self.IcoType+'&#160;'+	self.LblRifTypes;
	self.TabTable = '<span class="glyphicon glyphicon-th"></span>&#160;Table'; */
	self.TabDocument = self.IcoSpecification+'&#160;Document';
//	self.TabFind = self.IcoFind + '&#160;Search';
	self.TabFilter = self.IcoFilter+'&#160;Filter';
//	self.TabPage = '<span class="glyphicon glyphicon-file"></span>&#160;Page';
//	self.TabRevisions = '<span class="glyphicon glyphicon-grain"></span>&#160;Revisions';
//	self.TabTimeline = '<span class="glyphicon glyphicon-film"></span>&#160;Timeline';
	self.TabRelations = self.IcoRelation +'&#160;Relations';
//	self.TabSort = '<span class="glyphicon glyphicon-magnet"></span>&#160;Sort';
//	self.TabAttachments = '<span class="glyphicon glyphicon-paperclip"></span>&#160;Images and Files';
//	self.TabComments = self.IcoComment+'&#160;Comments';
	self.TabReports = self.IcoReport +'&#160;Reports';

// Functions:
//	self.FnProjectCreate = self.IcoAdd+'&#160;Project';
//	self.FnProjectImport = self.IcoImport+'&#160;Import project';
//	self.FnImportReqif = self.IcoImport+'&#160;Import ReqIF';
//	self.FnImportCsv = self.IcoImport+'&#160;Import CSV';
//	self.FnImportXls = self.IcoImport+'&#160;Import XLS';
//	self.FnProjectFromTemplate = self.IcoAdd+'&#160;Create project from template';
//	self.FnRefresh = '<span class="glyphicon glyphicon-refresh"></span>&#160;Refresh';
	self.FnOpen =
	self.FnRead = self.IcoRead;
	self.FnUpdate = self.IcoAdminister;
//	self.FnRemove =
	self.FnDelete = self.IcoDelete;

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
	self.dcterms_identifier = self.LblIdentifier;
	self.DC_type =
	self.dcterms_type = "Element Type";
	self.DC_creator =
	self.dcterms_creator = "Author";
	self.DC_source =
	self.dcterms_source = "Source";
	self.DC_subject =
	self.dcterms_subject = "Subject";
	self.DC_modified =
	self.dcterms_modified = self.LblModifiedAt;
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
	self.SpecIF_HeadingDescription = "A '"+self.SpecIF_Heading+"' has a title for chapters with optional description.";
	self.SpecIF_Name = self.LblName;
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
	self.SpecIF_DiagramDescription = "A '"+self.SpecIF_Diagram+"' is a graphical model view with a specific communication purpose, e.g. a business process or system composition.";
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
	self.FMC_ActorDescription = "An '"+self.FMC_Actor+"' is a fundamental model element type representing an active entity, be it an activity, a process step, a function, a system component or a role.";
	self.FMC_StateDescription = "A '"+self.FMC_State+"' is a fundamental model element type representing a passive entity, be it a value, a document, an information storage or even a physical shape.";
	self.FMC_EventDescription = "An '"+self.FMC_Event+"' is a fundamental model element type representing a time reference, a change in condition/value or more generally a synchronisation primitive.";
	self.SpecIF_Feature = "Feature";
	self.SpecIF_Features = "Features";
	self.SpecIF_Requirement =
	self.IREB_Requirement = "Requirement";
	self.SpecIF_Requirements = 
	self.IREB_Requirements = "Requirements";
	self.SpecIF_FeatureDescription = "A '"+self.SpecIF_Feature+"' is an intentional distinguishing characteristic of a system, often a unique selling proposition.";
	self.IREB_RequirementDescription = "A '"+self.IREB_Requirement+"' is a singular documented physical and functional need that a particular design, product or process must be able to perform.";
	self.IREB_RequirementType = self.LblType;
	self.IREB_RequirementTypeFunction = 
	self.IREB_FunctionalRequirement = "Function Requirement or User Story";
	self.IREB_RequirementTypeQuality =
	self.IREB_QualityRequirement = "Quality Requirement";
	self.IREB_RequirementTypeConstraint =
	self.IREB_Constraint = "Constraint";
	self.IREB_PerspectiveBusiness = "Business";
	self.IREB_PerspectiveStakeholder = "Stakeholder";
	self.IREB_PerspectiveUser = "User";
	self.IREB_PerspectiveOperator = "Operator";
	self.IREB_PerspectiveSystem = "System";
	self.SpecIF_LifecycleStatusDeprecated = "deprecated";
	self.SpecIF_LifecycleStatusRejected = "rejected";
	self.SpecIF_LifecycleStatusInitial = "initial";
	self.SpecIF_LifecycleStatusDrafted = "drafted";
	self.SpecIF_LifecycleStatusSubmitted = "submitted";
	self.SpecIF_LifecycleStatusApproved = "approved";
	self.SpecIF_LifecycleStatusReady = "ready";
	self.SpecIF_LifecycleStatusDone = "done";
	self.SpecIF_LifecycleStatusValidated = "validated";
	self.SpecIF_LifecycleStatusReleased = "released";
	self.SpecIF_LifecycleStatusWithdrawn = "withdrawn";
	self.SpecIF_DisciplineSystem = "System";
	self.SpecIF_DisciplineMechanics = "Mechanics";
	self.SpecIF_DisciplineElectronics = "Electronics";
	self.SpecIF_DisciplineSoftware = "Software";
	self.SpecIF_DisciplineSafety = "Safety";
	self.SpecIF_BusinessProcess = 'Business Process'; 
	self.SpecIF_BusinessProcesses = 'Business Processes';
	self.SpecIF_Rationale = "Rationale";
	self.SpecIF_Note = "Note";
	self.SpecIF_Notes = "Notes";
	self.SpecIF_Comment = "Comment";
	self.SpecIF_Comments = "Comments";
	self.SpecIF_Issue = "Issue";
	self.SpecIF_Issues = "Issues";
	self.SpecIF_Issue = "An '"+self.SpecIF_Issue+"' is a question to answer or decision to take which is worth tracking.";
	self.SpecIF_Outline =
	self.SpecIF_Hierarchy = "Outline";
	self.SpecIF_Outlines =
	self.SpecIF_Hierarchies = "Outlines";
	self.SpecIF_Glossary = "Model-Elements (Glossary)";
	self.SpecIF_UnreferencedResources = "Unreferenced Resources (Recycle Bin)";
	self.SpecIF_Collection = "Collection or Group";
	self.SpecIF_Collections = "Collections and Groups";
	self.SpecIF_CollectionDescription = "A '"+self.SpecIF_Collection+"' is a logical grouping of '"+self.modelElements+"'.";
	self.SpecIF_Annotations = "Annotations";
	self.SpecIF_Vote = "Vote";
	self.SpecIF_Votes = "Votes";
	self.SpecIF_Perspective = "Perspective";
	self.SpecIF_Discipline = "Discipline";
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
	self.archimate_accesses =
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
	self.SpecIF_realizes = "realizes";
	self.SpecIF_refines =
	self.SpecIF_serves = "serves";
	self.IREB_refines = "refines";
	self.IREB_refinedBy = "is refined by";
	self.SpecIF_duplicates = "duplicates";
	self.SpecIF_contradicts = "contradicts";
	self.SpecIF_isAssociatedWith =
	self.SpecIF_isAssignedTo =
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
	self.SpecIF_isGeneralizationOf = 
	self.SysML_isGeneralizationOf = "is Generalization of";
	self.SpecIF_isSpecializationOf =
	self.SysML_isSpecializationOf = "is Specialization of";
	self.SysML_uses = "uses";
	self.SysML_usedBy = "is used by";
	self.SpecIF_isSynonymOf = "is synonym of";
	self.SpecIF_isInverseOf = 						// DEPRECATED
	self.SpecIF_isAntonymOf = "is antonym of";
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
	self.SpecIF_State =								// DEPRECATED
	self.SpecIF_LifecycleStatus =
	self.SpecIF_Status = 	self.LblState;
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
	self.SpecIF_DataObject = "Data-Object";
//	self.SpecIF_Author = "Author";
//	self.SpecIF_Authors = "Authors";
	self.IREB_Stakeholder = "Stakeholder";
	self.SpecIF_Responsible = "Responsible";
	self.SpecIF_Responsibles = "Responsibles";
	self.SpecIF_UserRole = "User-Role";
// attribute names used by the Interaction Room:
	self.IR_Annotation = "Annotation";
	self.IR_AnnotationDescription = "An Interaction-Room '"+self.IR_Annotation+"' indicates a point of special interest. Examples are customer or user value, product features with prominent benefit,effort or challenges during development.";
	self.IR_refersTo = 	self.SpecIF_refersTo;
	self.IR_approves = "approves";
	self.IR_opposes = "opposes";
	self.IR_inheritsFrom = 	self.SpecIF_inheritsFrom;
// for oem-supplier agreement as defined by the "Hersteller-Initiative-Software":
	self.HIS_OemStatus =
	self.ReqIF_WF_CustomerStatus = 'Customer-Status';
	self.HIS_OemComment =
	self.ReqIF_WF_CustomerComment = 'Customer-Comment';
	self.HIS_SupplierStatus =
	self.ReqIF_WF_SupplierStatus = 'Supplier-Status';
	self.HIS_SupplierComment =
	self.ReqIF_WF_SupplierComment = 'Supplier-Comment';
/*
// attribute names used by DocBridge Resource Director:
	self.DBRD_ChapterName = 'Title';
	self.DBRD_Name = 'Title';
	self.DBRD_Text = 'Text';
// attribute names used by Atego Exerpt with RIF 1.1a:
	self.VALUE_Object_Heading =
	self.Object_Heading = self.ReqIF_Name;
	self.VALUE_Object_Text =
	self.Object_Text = self.ReqIF_Text;
	self.VALUE_Object_ID =
	self.Object_ID = self.ReqIF_ForeignID; */
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
	self.SpecIF_rejected =
	self.SpecIF_statusRejected = "00_rejected";
	self.SpecIF_initial =
	self.SpecIF_statusInitial = "10_initial";
	self.SpecIF_drafted =
	self.SpecIF_statusDrafted = "20_drafted";
	self.SpecIF_submitted =
	self.SpecIF_statusSubmitted = "30_submitted";
	self.SpecIF_approved =
	self.SpecIF_statusApproved = "40_approved";
	self.SpecIF_ready =
	self.SpecIF_statusReady = "50_ready";
	self.SpecIF_done =
	self.SpecIF_statusDone = "60_done";
	self.SpecIF_validated =
	self.SpecIF_statusValidated = "70_validated";
	self.SpecIF_released =
	self.SpecIF_statusReleased = "80_released";
	self.SpecIF_deprecated =
	self.SpecIF_statusDeprecated = "88_deprecated";
	self.SpecIF_withdrawn =
	self.SpecIF_statusWithdrawn = "90_withdrawn";

// Messages:
	self.MsgIntro = 'Are you new here? Read a short <a href="' + CONFIG.QuickStartGuideEn + '" target="_blank" rel="noopener">introduction</a>, if you like.';
	self.MsgConfirm = 'Please confirm:';
	self.MsgConfirmDeletion = "Delete '~A'?";
	self.MsgConfirmObjectDeletion = "Delete resource '<b>~A</b>' ?";
	self.MsgConfirmUserDeletion = "Delete user '<b>~A</b>' ?";
	self.MsgConfirmProjectDeletion = "Delete project '<b>~A</b>' ?";
	self.MsgConfirmSpecDeletion = "Delete outline '<b>~A</b>' with all resource references ?";
	self.MsgConfirmRoleDeletion = "Delete role '<b>~A</b>' ?";
	self.MsgConfirmFolderDeletion = "Delete folder '<b>~A</b>' ?";
	self.MsgInitialLoading = 'Loading the index for brisker navigation ... ';
	self.MsgNoProjectLoaded = 'No project loaded.';
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
/*	self.MsgImportReqif = 'Permissible filetypes are *.reqifz, *.reqif, *.zip and *.xml. The content must conform with the ReqIF 1.0+, RIF 1.1a or RIF 1.2 schemata. The import may take several minutes for very large files.'; */
	self.MsgImportReqif = 'Permissible filetypes are *.reqif or *.reqifz. The content must conform with the ReqIF 1.0+ schemata. The import may take several minutes for very large files.';
	self.MsgImportSpecif = 'Permissible filetypes are *.specif, *.specif.zip and *.specifz. The content must conform with the SpecIF 0.10.4+ schemata. In case of large files, the import may take a couple of minutes.';
	self.MsgImportBpmn = 'Permissible filetype is *.bpmn. The content must conform with the schema BPMN 2.0 XML. The import may take a couple of minutes.';
	self.MsgImportXls = 'Permissible filetypes are *.xls, *.xlsx and *.csv. The import may take a couple of minutes for very large files.';
	self.MsgExport = 'A zip-compressed file of the chosen format will be created. The export may take several minutes up for very large files; your web-browser will save the file according to its settings.';
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
	self.MsgNoObjectTypeForManualCreation = "Ressources cannot be created, because of missing permission or because there are no resource-types for manual creation.";
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
	self.MsgFileApiNotSupported = 'This web-browser does not fully support the file API. Please choose a current browser.';
	self.MsgDoNotLoadAllObjects = 'Loading all resources in a single call is not recommended.';
	self.MsgReading = 'Reading';
	self.MsgCreating = "Creating";
	self.MsgUploading = "Uploading";
	self.MsgImporting = "Importing";
	self.MsgBrowserSaving = "Your web-browser saves the file according to its settings.";
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
	self.ErrInvalidFileReqif = "Invalid file type of '~A'. Please select '*.reqif' or '*.reqifz'.";
	self.ErrInvalidFileSpecif = "Invalid file type of '~A'. Please select '*.specif.zip', '*.specifz' or '*.specif'.";
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
//	self.IcoHome = '<span class="glyphicon glyphicon-home"></span>';
//	self.IcoSystemAdministration = self.IcoAdminister;
//	self.IcoUserAdministration = self.IcoUser;
//	self.IcoProjectAdministration = self.IcoType;
//	self.IcoProjectAdministration = '<span style="font-size:130%">&#9881;</span>';
//	self.IcoSpecifications = self.IcoSpecification;
//	self.IcoReader = self.IcoRead;
//	self.IcoImportReqif = self.IcoImport;
//	self.IcoImportCsv = self.IcoImport;
//	self.IcoImportXls = self.IcoImport;
//	self.IcoSupport = '<span class="glyphicon glyphicon-question-sign"></span>';

// App names:
//	self.LblHome = 'Welcome!';
//	self.LblProjects = 'Projects';
//	self.LblSystemAdministration = 'Setup';
//	self.LblUserAdministration = 'Users';
//	self.LblProjectAdministration = 'Types & Permissions';   // for the browser tabs - no HTML!
//	self.LblSpecifications = 'Content';
	self.LblReader = 'SpecIF Reader';
	self.LblEditor = 'SpecIF Editor';
//	self.LblSupport = 'Support';
//	self.AppHome = 	self.IcoHome+'&#160;'+	self.LblHome;
//	self.AppSystemAdministration = 	self.IcoSystemAdministration+'&#160;Interactive Spec: '+	self.LblSystemAdministration;
//	self.AppUserAdministration = 	self.IcoUserAdministration+'&#160;Interactive Spec: '+	self.LblUserAdministration;
//	self.AppProjectAdministration = 	self.IcoProjectAdministration+'&#160;Interactive Spec: '+	self.LblProjectAdministration;
//	self.AppSpecifications = 	self.IcoSpecifications+'&#160;Interactive Spec: '+	self.LblSpecifications;
//	self.AppReader = 	self.IcoReader+'&#160;'+	self.LblReader;
//	self.AppImport = 	self.IcoImport+'&#160;Import';
//	self.AppLocal = 	self.IcoSpecifications+'&#160;'+	self.LblEditor;
//	self.AppSupport = 	self.IcoSupport+'&#160;'+	self.LblSupport;
	return self;
};
