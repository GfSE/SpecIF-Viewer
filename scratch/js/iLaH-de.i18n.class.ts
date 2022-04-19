/* 	Provide i18ns and messages in a certain language, in this case 'Deutsch' (de).
	The result can be obtained by reference of:
	- yourVarName.MsgText (in most cases, when there are only characters allowed for js variable names)
	- yourVarName.lookup('MsgName')
	- yourVarName.phrase('MsgName')
	- yourVarName.phrase('MsgName', 'param')
	- In the messages defined below, '~A' can be inserted at the location where a call parameter shall be placed.
*/
class LanguageTextsDe {
	IcoUser = '<span class="glyphicon glyphicon-user"></span>';
	IcoSpecification = '<span class="glyphicon glyphicon-book"></span>';
//	IcoReadSpecification = '<span class="glyphicon glyphicon-eye-open"></span>';
//	IcoUpdateSpecification = '<i class="fa fa-pencil"></i>';
//	IcoRead = '<span class="glyphicon glyphicon-eye-open"></span>';
	IcoImport = '<span class="glyphicon glyphicon-import"></span>';
	IcoExport = '<span class="glyphicon glyphicon-export"></span>';
	IcoAdminister = '<span class="glyphicon glyphicon-wrench"></span>';
	IcoUpdate = '<i class="fa fa-pencil"></i>';
	IcoDelete = '<span class="glyphicon glyphicon-remove"></span>';
	IcoAdd = '<span class="glyphicon glyphicon-plus"></span>';
	IcoClone = '<span class="glyphicon glyphicon-duplicate"></span>';
	IcoPrevious = '<span class="glyphicon glyphicon-chevron-up"></span>';
	IcoNext = '<span class="glyphicon glyphicon-chevron-down"></span>';
	IcoGo = '<span class="glyphicon glyphicon-search"></span>';
	IcoFilter = '<span class="glyphicon glyphicon-filter"></span>';
	IcoComment = '<span class="glyphicon glyphicon-comment"></span>';
	IcoURL = '<span class="glyphicon glyphicon-map-marker"></span>';
	IcoLogout = '<span class="glyphicon glyphicon-log-out"></span>';
	IcoAbout = '<strong>&#169;</strong>'; // copyright sign

// Buttons:
//	LblImportReqif = 'ReqIF Import';
//	LblImportCsv = 'CSV Import';
//	LblImportXls = 'XLS Import';
//	LblExportPdf = 'PDF Export';
	LblAll = "Alle";
	LblAllObjects = "Alle Ressourcen";
	LblImport = 'Importieren';
	LblExport = 'Exportieren';
	LblExportReqif = 'ReqIF-Datei exportieren';
	LblExportSpecif = 'SpecIF-Datei exportieren';
	LblAdminister = 'Administrieren';
	LblCreate ="Anlegen";
	LblRead = 'Lesen';
	LblUpdate = 'Aktualisieren';
	LblUpdateProject = 'Projekt-Eigenschaften aktualisieren';
	LblUpdateSpec = 'Gliederungs-Eigenschaften aktualisieren';
	LblUpdateTypes = 'Typen und Rechte aktualisieren';
	LblUpdateObject = 'Diese Ressource aktualisieren';
	LblDelete = 'Löschen';
	LblDeleteProject = 'Dieses Projekt löschen';
	LblDeleteType = 'Diesen Typ löschen';
	LblDeleteObject = 'Diese Ressource löschen';
	LblDeleteAttribute = 'Dieses Attribut löschen';
	LblDeleteRelation = 'Diese Aussage löschen';
	LblDeleteRole = 'Rolle löschen';
	LblAdd = 'Anlegen';
	LblAddItem = '~A anlegen';
	LblAddProject = "Projekt anlegen";
	LblAddType = "Typ anlegen";
	LblAddDataType = 'Datentyp anlegen';
	LblAddObjType = 'Ressource-Typ anlegen';
	LblAddRelType = 'Aussage-Typ anlegen';
	LblAddSpcType = 'Gliederungs-Typ anlegen';
	LblAddTypeComment = 'Typen für Kommentare anlegen';
	LblAddObject = "Ressource anlegen";
	LblAddRelation = "Aussage anlegen";
	LblAddAttribute = "Attribut anlegen";
	LblAddUser = "Nutzer anlegen";
	LblAddComment = 'Kommentieren';
	LblAddCommentTo = "Einen Kommentar zu '~A' hinzufügen:";
	LblAddCommentToObject = 'Diese Ressource kommentieren';
	LblAddFolder = "Ordner anlegen";
	LblAddSpec = "Gliederung anlegen";
	LblClone = 'Klonen';
	LblCloneObject = 'Diese Ressource klonen';
	LblCloneType = 'Diesen Typ klonen';
	LblCloneSpec = 'Diese Gliederung klonen';
	LblUserName = 'Nutzername';
	LblPassword = 'Kennwort';
	LblTitle = 'Titel';
	LblProject = 'Projekt';
	LblName = 'Name';
	LblFirstName = 'Vorname';
	LblLastName = 'Nachname';
	LblOrganizations = 'Organisation';  // until multiple orgs per user are supported
	LblEmail = 'e-mail';
	LblFileName = 'Dateiname';
	LblRoleGeneralAdmin = 'GENERAL-ADMIN';
	LblRoleProjectAdmin = 'PROJECT-ADMIN';
	LblRoleUserAdmin = 'USER-ADMIN';
	LblRoleReader = 'READER';
//	LblRoleReqif = 'REQIF';
	LblGlobalActions = 'Aktionen';
	LblItemActions = 'Aktionen';
	LblIdentifier = 'Identifikator';
	LblProjectName = 'Projektname';
	LblDescription = 'Beschreibung';
	LblState = 'Status';
	LblPriority = 'Priorität';
	LblCategory = 'Kategorie';
	LblAttribute = 'Attribut';
	LblAttributes = 'Attribute';
	LblAttributeValueRange = "Wertebereich";
	LblAttributeValues = "Werte";
	LblAttributeValue = "Wert";
	LblTool = 'Autoren-Werkzeug';
	LblMyRole = 'Meine Rolle';
	LblRevision = 'Revision';
	LblCreatedAt = 'Erstellt am';
	LblCreatedBy = 'Erstellt von';
	LblCreatedThru = 'Erstellt durch';
	LblModifiedAt = 'Geändert am';
	LblModifiedBy = 'Geändert von';
	LblProjectDetails = 'Eigenschaften';
	LblProjectUsers = '<span class="glyphicon glyphicon-user"></span>&#160;Nutzer dieses Projekts';
	LblOtherUsers = 'Andere Nutzer';
	LblUserProjects = '<span class="glyphicon glyphicon-book"></span>&#160;Projekte dieses Nutzers';
	LblOtherProjects = 'Andere Projekte';
	LblType = 'Typ';
	LblTypes = 'Typen';
	LblDataTypes = 'Datentypen';
	LblDataType = 'Datentyp';
	LblDataTypeTitle = 'Datentyp-Name';
	LblSpecTypes = 'Typen';
	LblSpecType = 'Typ';
	LblResourceClasses = 'Ressource-Klassen';
	LblResourceClass = 'Ressource-Klasse';
	LblStatementClasses = 'Aussage-Klassen';
	LblStatementClass = 'Aussage-Klasse';
//	LblRelGroupTypes = 'Aussagegruppen-Typen';
//	LblRelGroupType = 'Aussagegruppen-Typ';
	LblSpecificationTypes = 'Gliederungs-Typen';
	hierarchyType = 
	LblSpecificationType = 'Gliederungs-Typ';
//	LblRifTypes = 'Typen';
//	rifType = 
//	LblRifType = 'Typ';
	LblSpecTypeTitle = 'Name';
	LblAttributeTitle = 'Attribut-Name';
	LblSecondaryFiltersForObjects = 	this.IcoFilter+"&#160;Facetten-Filter für '~A'";
	LblPermissions = 'Rechte';
	LblRoles = 'Rollen';
	LblFormat = 'Format';
	LblOptions = 'Optionen';
	LblFileFormat = 'Dateiformat';
	modelElements = 'Modell-Elemente';
	withOtherProperties = 'mit weiteren Eigenschaften';
	withStatements = 'mit Aussagen';
	LblStringMatch = '<span class="glyphicon glyphicon-text-background" ></span>&#160;Textsuche';
	LblWordBeginnings = 'Nur Wortanfänge berücksichtigen';
	LblWholeWords = 'Nur ganze Worte berücksichtigen';
	LblCaseSensitive = 'Groß/Kleinschreibung beachten';
	LblExcludeEnums = 'Auswahlwerte übergehen';
	LblNotAssigned = '(ohne zugewiesenen Wert)';
	LblPrevious = 'Voriges';
	LblNext = 'Nächstes';
	LblPreviousStep = 'Zurück';
	LblNextStep = 'Weiter';
	LblGo = 'Los!';
	LblHitCount = 'Trefferzahl';
	LblRelateAs = 'Verknüpfen als';
	LblSource = 'Subjekt';
	LblTarget = 'Objekt';
	LblEligibleSources = "Zulässige Ressourcen als "+	this.LblSource;
	LblEligibleTargets = "Zulässige Ressourcen als "+	this.LblTarget;
	LblSaveRelationAsSource = 'Ressource als '+	this.LblSource+' verknüpfen';
	LblSaveRelationAsTarget = 'Ressource als '+	this.LblTarget+' verknüpfen';
	LblIcon = 'Symbol';
	LblCreation = 'Anzulegen';
	LblCreateLink1 = "&#x2776;&#160;Gewünschter Aussage-Typ";
	LblCreateLink2 = "&#x2777;&#160;Zu verknüpfende Ressource";
	LblReferences = "Referenzen";
	LblInherited = "Geerbt";
	LblMaxLength = "Max. Länge";
	LblMinValue = "Min. Wert";
	LblMaxValue = "Max. Wert";
	LblAccuracy = "Dezimalstellen";
	LblEnumValues = "Werte (kommagetr.)";
	LblSingleChoice = "Einfach-Auswahl";
	LblMultipleChoice = "Mehrfach-Auswahl";
	LblDirectLink = "Direktverweis";

	BtnLogin = '<span class="glyphicon glyphicon-log-in"></span>&#160;Anmelden';
	BtnLogout = '<span class="glyphicon glyphicon-log-out"></span>&#160;Abmelden';
	BtnProfile = 'Profil';
	BtnBack = 'Zurück';
	BtnCancel = 'Abbrechen';
	BtnCancelImport = 'Abbrechen';
	BtnApply = 'Anwenden';
	BtnDelete = '<span class="glyphicon glyphicon-remove"></span>&#160;Löschen';
	BtnDeleteObject = '<span class="glyphicon glyphicon-remove"></span>&#160;Ressource mit Referenzen löschen';
	BtnDeleteObjectRef = '<span class="glyphicon glyphicon-remove"></span>&#160;Diesen Verweis löschen';
	BtnImport = '<span class="glyphicon glyphicon-import"></span>&#160;Import';
	BtnCreate = '<span class="glyphicon glyphicon-import"></span>&#160;Anlegen';
	BtnReplace = '<span class="glyphicon glyphicon-import"></span>&#160;Ersetzen';
	BtnAdopt = '<span class="glyphicon glyphicon-import"></span>&#160;Adoptieren'; //Aneignen
	BtnUpdate = '<span class="glyphicon glyphicon-import"></span>&#160;'+	this.LblUpdate;
//	BtnImportSpecif = '<span class="glyphicon glyphicon-import"></span>&#160;SpecIF';
//	BtnImportReqif = '<span class="glyphicon glyphicon-import"></span>&#160;ReqIF';
//	BtnImportXls = '<span class="glyphicon glyphicon-import"></span>&#160;xlsx';
//	BtnProjectFromTemplate = "Projekt mit ReqIF-Vorlage anlegen";
	BtnRead = '<span class="glyphicon glyphicon-eye-open"></span>&#160;Lesen';
	BtnExport = '<span class="glyphicon glyphicon-export"></span>&#160;Export';
//	BtnExportSpecif = '<span class="glyphicon glyphicon-export"></span>&#160;SpecIF';
//	BtnExportReqif = '<span class="glyphicon glyphicon-export"></span>&#160;ReqIF';
	BtnAdd = '<span class="glyphicon glyphicon-plus"></span>&#160;Neu';
	BtnAddUser = '<span class="glyphicon glyphicon-plus"></span>&#160;Nutzer';
	BtnAddProject = '<span class="glyphicon glyphicon-plus"></span>&#160;'+	this.LblProject;
	BtnAddSpec = '<span class="glyphicon glyphicon-plus"></span>&#160;Gliederung';
	BtnAddFolder = '<span class="glyphicon glyphicon-plus"></span>&#160;Ordner';
	BtnAddAttribute = '<span class="glyphicon glyphicon-plus"></span>&#160;Attribut';
	BtnAddTypeComment = '<span class="glyphicon glyphicon-plus"></span>&#160;Klassen für Kommentare';
	BtnClone = '<span class="glyphicon glyphicon-duplicate"></span>&#160;Klonen';
	BtnEdit = '<i class="fa fa-pencil"></i>&#160;Bearbeiten';
	BtnSave = '<span class="glyphicon glyphicon-save"></span>&#160;Speichern';
	BtnSaveRole = '<span class="glyphicon glyphicon-save"></span>&#160;Rolle anlegen';
	BtnSaveAttr = '<span class="glyphicon glyphicon-save"></span>&#160;Attribut anlegen';
	BtnInsert = '<span class="glyphicon glyphicon-save"></span>&#160;Einfügen';
	BtnInsertSuccessor = '<span class="glyphicon glyphicon-save"></span>&#160;Einfügen hinter';
	BtnInsertChild = '<span class="glyphicon glyphicon-save"></span>&#160;Einfügen unter';
	BtnSaveRelation = '<span class="glyphicon glyphicon-save"></span>&#160;Aussage anlegen';
	BtnSaveItem = '<span class="glyphicon glyphicon-save"></span>&#160;~A anlegen';
	BtnDetails = 'Details';
	BtnAddRole = '<span class="glyphicon glyphicon-plus" ></span>&#160;Rolle';
	BtnFileSelect = '<span class="glyphicon glyphicon-plus" ></span>&#160;Datei auswählen ...';
	BtnPrevious = '<span class="glyphicon glyphicon-chevron-up"></span>&#160;'+	this.LblPrevious;
	BtnNext = '<span class="glyphicon glyphicon-chevron-down"></span>&#160;'+	this.LblNext;
	BtnGo = 	this.IcoGo+'&#160;'+	this.LblGo;
	BtnFilterReset = 	this.IcoFilter+'&#160;Neu';
	BtnSelectHierarchy = "Gliederung auswählen";

// Tabs:
	TabAll = '<span class="glyphicon glyphicon-list"></span>';
	TabUserList = '<span class="glyphicon glyphicon-list"></span>&#160;Nutzer';
	TabProjectList = '<span class="glyphicon glyphicon-list"></span>&#160;Projekte';
//	TabProjectDetails = '<i class="fa fa-pencil"></i>&#160;Meta';
	TabUserDetails = '<i class="fa fa-pencil"></i>&#160;Meta';
	TabProjectUsers = '<span class="glyphicon glyphicon-user"></span>&#160;Nutzer';
	TabUserProjects = '<span class="glyphicon glyphicon-book"></span>&#160;Projekte';
	TabPermissions = '<span class="glyphicon glyphicon-lock"></span>&#160;Rechte';
	TabTypes = '<span class="glyphicon glyphicon-cog"></span>&#160;'+	this.LblTypes;
	TabDataTypes = '<span class="glyphicon glyphicon-cog"></span>&#160;'+	this.LblDataTypes;
	TabSpecTypes = '<span class="glyphicon glyphicon-cog"></span>&#160;'+	this.LblResourceClasses;
	TabObjectTypes = '<span class="glyphicon glyphicon-cog"></span>&#160;'+	this.LblResourceClasses;
	TabRelationTypes = '<span class="glyphicon glyphicon-cog"></span>&#160;'+	this.LblRelationTypes;
//	TabRelGroupTypes = '<span class="glyphicon glyphicon-cog"></span>&#160;'+	this.LblRelGroupTypes;
	TabSpecificationTypes = '<span class="glyphicon glyphicon-cog"></span>&#160;'+	this.LblSpecificationTypes;
//	TabRifTypes = '<span class="glyphicon glyphicon-cog"></span>&#160;'+	this.LblRifTypes;
	TabTable = '<span class="glyphicon glyphicon-th"></span>&#160;Tabelle';
	TabDocument = '<span class="glyphicon glyphicon-book"></span>&#160;Dokument';
	TabFind = '<span class="glyphicon glyphicon-search"></span>&#160;Suche';
	TabFilter = 	this.IcoFilter+'&#160;Filter';
	TabPage = '<span class="glyphicon glyphicon-file"></span>&#160;Seite';
	TabRevisions = '<span class="glyphicon glyphicon-grain"></span>&#160;Revisionen';
	TabTimeline = '<span class="glyphicon glyphicon-film"></span>&#160;Zeitleiste';
	TabRelations = '<span class="glyphicon glyphicon-link"></span>&#160;Aussagen';
	TabSort = '<span class="glyphicon glyphicon-magnet"></span>&#160;Sortieren';
	TabAttachments = '<span class="glyphicon glyphicon-paperclip"></span>&#160;Bilder und Dateien';
	TabComments = '<span class="glyphicon glyphicon-comment"></span>&#160;Kommentare';
	TabReports = '<span class="glyphicon glyphicon-stats"></span>&#160;Berichte';

// Functions:
	FnProjectCreate = '<span class="glyphicon glyphicon-plus"></span>&#160;Projekt';
	FnProjectImport = '<span class="glyphicon glyphicon-import"></span>&#160;Projekt importieren';
//	FnImportReqif = '<span class="glyphicon glyphicon-import"></span>&#160;ReqIF importieren';
//	FnImportCsv = '<span class="glyphicon glyphicon-import"></span>&#160;CSV importieren';
//	FnImportXls = '<span class="glyphicon glyphicon-import"></span>&#160;XLS importieren';
//	FnProjectFromTemplate = '<span class="glyphicon glyphicon-plus"></span>&#160;Neues Projekt von Vorlage erstellen';
	FnRefresh = '<span class="glyphicon glyphicon-refresh"></span>&#160;Aktualisieren';
	FnRead = '<span class="glyphicon glyphicon-eye-open"></span>';
	FnOpen = 	this.FnRead;
	FnUpdate = '<span class="glyphicon glyphicon-wrench"></span>';
	FnDelete = '<span class="glyphicon glyphicon-remove"></span>';
	FnRemove = 	this.FnDelete;

// ReqIF attribute names (replace any '.' by '_', so 'ReqIF.Text' becomes 'ReqIF_Text ):
	ReqIF_ForeignID = 'ID';
	ReqIF_ChapterName = 'Titel';
	ReqIF_Name = 'Titel';
	ReqIF_Text = 'Text';
	ReqIF_ForeignCreatedOn = 	this.LblCreatedAt;
	ReqIF_ForeignCreatedBy = 	this.LblCreatedBy;
	ReqIF_ForeignCreatedThru = 	this.LblCreatedThru;
	ReqIF_ForeignModifiedOn = 	this.LblModifiedAt;
	ReqIF_ForeignModifiedBy = 	this.LblModifiedBy;
	ReqIF_Revision = 	this.LblRevision;
	ReqIF_Description = 	this.LblDescription;
	ReqIF_ChangeDescription = 'Änderungs-Beschreibung';
	ReqIF_Project = 	this.LblProject;
	ReqIF_ForeignState = 	this.LblState;
	ReqIF_Category = 	this.LblCategory;
	ReqIF_Prefix = 'Prefix';
	ReqIF_FitCriteria = 'Abnahme-Kriterium';
	ReqIF_AssociatedFiles = 'Dateien';
	ReqIF_ChapterNumber = 'Kapitelnummer';   // shouldn't be used, as an object cannot (should not) know its position in the outline
// Dublin Core (DCMI) attribute names:
	DC_title =
	dcterms_title = "Titel";
	DC_description =
	dcterms_description = "Beschreibung";
	DC_identifier =
	dcterms_identifier = this.LblIdentifier;
	DC_type =
	dcterms_type = "Element-Typ";
	DC_creator =
	dcterms_creator = "Autor";
	DC_source =
	dcterms_source = "Quelle";
	DC_subject =
	dcterms_subject = "Stichworte";
	DC_modified =
	dcterms_modified = this.LblModifiedAt;
//	dcterms_contributor = "";
//	dcterms_serviceProvider = "";
//	dcterms_instanceShape = "";
// OSLC attribute names:
//	rdf_type = "Type";
//	oslc_rm_elaboratedBy = "";
//	oslc_rm_elaborates = "";
//	oslc_rm_specifiedBy = "";
//	oslc_rm_specifies = "";
//	oslc_rm_affectedBy = "";
//	oslc_rm_trackedBy = "";
	SpecIF_implements = 
	oslc_rm_implements = "realisiert";
	oslc_rm_implementedBy = "wird realisiert von";
	oslc_rm_validates = "validiert";
	oslc_rm_validatedBy = "wird validiert von";
//	oslc_rm_decomposes = "ist Bestandteil von";
//	oslc_rm_decomposedBy = "besteht aus";
//	oslc_rm_constrainedBy = "";
//	oslc_rm_constrains = "";
// SpecIF entity, relation and attribute names
	SpecIF_Heading = "Überschrift";
	SpecIF_Headings = "Überschriften";
	SpecIF_HeadingDescription = this.SpecIF_Heading+"' hat einen Titel für Kapitel mit optionaler Beschreibung.";
	SpecIF_Name = this.LblName;
//	SpecIF_Names = "Namen";
	SpecIF_Folder = "Ordner";	// deprecated, use SpecIF:Heading
	SpecIF_Folders = "Ordner";	// deprecated, use SpecIF:Headings
	SpecIF_Chapter = "Kapitel";	// deprecated, use SpecIF:Heading
	SpecIF_Chapters = "Kapitel";// deprecated, use SpecIF:Headings
	SpecIF_Paragraph = "Abschnitt";
	SpecIF_Paragraphs = "Abschnitte";
	SpecIF_Information = "Information";// deprecated, use SpecIF:Paragraph
	SpecIF_Diagram = "Diagramm";
	SpecIF_Diagrams = "Diagramme";
	SpecIF_DiagramDescription = "Ein '"+this.SpecIF_Diagram+"' ist eine graphische Modellsicht zur Vermittlung eines bestimmten Sachverhalts, z.B. ein Geschäftsprozess oder Systemaufbau.";
	SpecIF_View = "Diagramm";		// deprecated
	SpecIF_Views = "Diagramme";	// deprecated
	FMC_Plan = "Plan";
	FMC_Plans = "Pläne";
	SpecIF_Object = 
	SpecIF_Resource = "Ressource";
	SpecIF_Objects = 
	SpecIF_Resources = "Ressourcen";
	SpecIF_Relation = 
	SpecIF_Statement = "Aussage";
	SpecIF_Relations = 
	SpecIF_Statements = "Aussagen";
	SpecIF_Property = "Attribut";
	SpecIF_Properties = "Attribute";
	FMC_Actor = "Akteur";
	FMC_Actors = "Akteure";
	FMC_State = "Zustand";
	FMC_States = "Zustände";
	FMC_Event = "Ereignis";
	FMC_Events = "Ereignisse";
	FMC_ActorDescription = "Ein '"+this.FMC_Actor+"' ist ein fundamentaler Modellelement-Typ für ein aktives Objekt, z.B. eine Aktivität, ein Prozess-Schritt, eine Funktion, eine Systemkomponente oder eine Rolle.";
	FMC_StateDescription = "Ein '"+this.FMC_State+"' ist ein fundamentaler Modellelement-Typ für ein passives Objekt, z.B. ein Wert, ein Dokument, ein Informationsspeicher oder eine physische Beschaffenheit.";
	FMC_EventDescription = "Ein '"+this.FMC_Event+"' ist ein fundamentaler Modellelement-Typ für eine zeitliche Referenz, eine Änderung einer Bedingung bzw. eines Zustandes oder generell ein Synchronisations-Mittel.";
	SpecIF_Feature = "Merkmal";
	SpecIF_Features = "Merkmale";
	SpecIF_Requirement =
	IREB_Requirement = "Anforderung";
	SpecIF_Requirements = 
	SpecIF_FeatureDescription = "Ein '"+this.SpecIF_Feature+"' ist eine beabsichtigte differenzierende Eigenschaft eines Systems, oft ein Alleinstellungsmerkmal.";
	IREB_RequirementDescription = "Eine '"+this.IREB_Requirement+"' ist ein einzelnes dokumentiertes physisches oder funktionales Bedürfnis, das der betreffende Entwurf, das Produkt oder der Prozess erfüllen muss.";
	IREB_Requirements = "Anforderungen";
	IREB_RequirementType = "Art";
	IREB_RequirementTypeFunction = 
	IREB_FunctionalRequirement = "Funktionsanforderung oder 'User Story'";
	IREB_RequirementTypeQuality =
	IREB_QualityRequirement = "Qualitätsanforderung";
	IREB_RequirementTypeConstraint =
	IREB_Constraint = "Randbedingung";
	IREB_PerspectiveBusiness = "Business";
	IREB_PerspectiveStakeholder = "Stakeholder";
	IREB_PerspectiveUser = "User";
	IREB_PerspectiveOperator = "Operator";
	IREB_PerspectiveSystem = "System";
	SpecIF_LifecycleStatusDeprecated = "veraltet";
	SpecIF_LifecycleStatusRejected = "abgelehnt";
	SpecIF_LifecycleStatusInitial = "initial";
	SpecIF_LifecycleStatusDrafted = "entworfen";
	SpecIF_LifecycleStatusSubmitted = "vorgelegt";
	SpecIF_LifecycleStatusApproved = "genehmigt";
	SpecIF_LifecycleStatusReady = 'bereit ("ready")';
	SpecIF_LifecycleStatusDone = 'fertig ("done")';
	SpecIF_LifecycleStatusValidated = "validiert";
	SpecIF_LifecycleStatusReleased = "freigegeben";
	SpecIF_LifecycleStatusWithdrawn = "zurückgezogen";
	SpecIF_DisciplineSystem = "System";
	SpecIF_DisciplineMechanics = "Mechanik";
	SpecIF_DisciplineElectronics = "Elektronik";
	SpecIF_DisciplineSoftware = "Software";
	SpecIF_DisciplineSafety = "Sicherheit";
	SpecIF_BusinessProcess = 'Geschäftsprozess'; 
	SpecIF_BusinessProcesses = 'Geschäftsprozesse';
	SpecIF_Rationale = "Motivation";
	SpecIF_Note = "Anmerkung";
	SpecIF_Notes = "Anmerkungen";
	SpecIF_Comment = "Kommentar";
	SpecIF_Comments = "Kommentare";
	SpecIF_Issue = "Offener Punkt";
	SpecIF_Issues = "Offene Punkte";
	SpecIF_IssueDescription = "Ein '"+this.SpecIF_Issue+"' ist eine zu beantwortende Frage oder eine zu treffende Entscheidung.";
	SpecIF_Outline =
	SpecIF_Hierarchy = "Gliederung";
	SpecIF_Outlines =
	SpecIF_Hierarchies = "Gliederungen";
	SpecIF_Glossary = "Modellelemente (Glossar)";
	SpecIF_Collection = "Kollektion oder Gruppe";
	SpecIF_Collections = "Kollektionen und Gruppen";
	SpecIF_CollectionDescription = "Eine '"+this.SpecIF_Collection+"' ist eine logische Gruppierung von '"+this.modelElements+"'.";
	SpecIF_Annotations = "Annotationen";
	SpecIF_Vote = "Wertung";
	SpecIF_Votes = "Wertungen";
	SpecIF_Perspective = "Perspektive";
	SpecIF_Discipline = "Disziplin";
	SpecIF_Effort = "Aufwand";
	SpecIF_Risk = 
	IREB_Risk = "Risiko";
	SpecIF_Benefit = "Nutzen";
	SpecIF_Damage = "Schaden";
	SpecIF_Probability = "Wahrscheinlichkeit";
	SpecIF_shows = "zeigt";
	SpecIF_contains = "enthält";
	oslc_rm_satisfiedBy = "wird erfüllt von";;
	oslc_rm_satisfies = 
	SpecIF_satisfies =
	IREB_satisfies = "erfüllt";
	SpecIF_modifies =
	SpecIF_stores = "schreibt und liest";
	SpecIF_reads = "liest";
	SpecIF_writes = "schreibt";
	SpecIF_sendsTo = "sendet an";
	SpecIF_receivesFrom = "empfängt von";
	SpecIF_influences = "beeinflusst";
	SpecIF_follows = "folgt auf";
	SpecIF_precedes = "ist Vorgänger von";
	SpecIF_signals = "signalisiert";
	SpecIF_triggers = "löst aus";
	SpecIF_dependsOn = "hängt ab von";
	SpecIF_realizes = "realisiert";
	SpecIF_serves = "wird aufgerufen von";
	SpecIF_refines = 
	IREB_refines = "verfeinert";
	IREB_refinedBy = "wird verfeinert von";
	SpecIF_duplicates = "dupliziert";
	SpecIF_contradicts = "widerspricht";
	SpecIF_isAssignedTo =
	SpecIF_isAssociatedWith =
	SysML_isAssociatedWith = "ist assoziiert mit";
	SysML_isAllocatedTo = "wird ausgeführt von";
	SysML_includes = "inkludiert";
	SysML_extends = "erweitert";
	SpecIF_isDerivedFrom = 
	SysML_isDerivedFrom = "ist abgeleitet von";
	SpecIF_isComposedOf = 
	SysML_isComposedOf = "ist Komposition von";
	SpecIF_isAggregatedBy =
	SysML_isAggregatedBy = "ist Aggregation von";
	SpecIF_isGeneralizationOf = 
	SysML_isGeneralizationOf = "ist generalisiert von";
	SpecIF_isSpecializationOf =
	SysML_isSpecializationOf = "ist spezialisiert von";
	SpecIF_isSynonymOf = "ist Synonym von";
	SpecIF_isInverseOf = 						// DEPRECATED
	SpecIF_isAntonymOf = "ist Antonym von";
	SpecIF_inheritsFrom = "erbt von";
	SpecIF_refersTo = "bezieht sich auf";
	SpecIF_commentRefersTo = 	this.SpecIF_refersTo;
	SpecIF_issueRefersTo = 	this.SpecIF_refersTo;
	SpecIF_includes = "schließt ein";
	SpecIF_excludes = "schließt aus";
	SpecIF_mentions = "erwähnt"; 
	SpecIF_sameAs =
	owl_sameAs = "ist identisch mit";
	SpecIF_Id = 	this.LblIdentifier;
	SpecIF_Type = 	this.LblType;
	SpecIF_Notation = "Notation";
//	SpecIF_Stereotype = 
//	SpecIF_SubClass = "Unterklasse";
	SpecIF_Category = 	this.LblCategory;
	SpecIF_State =								// DEPRECATED
	SpecIF_LifecycleStatus =
	SpecIF_Status = 	this.LblState;
	SpecIF_Priority = 	this.LblPriority;
	SpecIF_Milestone = "Meilenstein";
	SpecIF_DueDate = "Termin";
	SpecIF_Icon = "Symbol";
	SpecIF_Tag = "Schlagwort";
	SpecIF_Tags = "Schlagworte";
	SpecIF_UserStory = "User-Story";
//	SpecIF_Creation = "";
	SpecIF_Instantiation = "Instanziierung";
	SpecIF_Origin = "Quelle";		// oder "Herkunft"
	SpecIF_Source = this.LblSource;
	SpecIF_Target = this.LblTarget;
//	SpecIF_Author = "Autor";
//	SpecIF_Authors = "Autoren";
	IREB_Stakeholder = "Stakeholder";
	SpecIF_Responsible = "Verantwortlicher";
	SpecIF_Responsibles = "Verantwortliche";
// attribute names used by the Interaction Room:
	IR_Annotation = "Annotation";
	IR_AnnotationDescription = "Eine Interaction-Room '"+this.IR_Annotation+"' weist auf einen Punkt besonderen Interesses hin. Hierzu gehören Werte, die Kundenbedürfnisse widerspiegeln oder positiven Effekt auf die Ziele der Organisation haben, Produkteigenschaften, deren Umsetzung Nutzen/Aufwand verursacht, und Herausforderungen, die während der Entwicklung zu berücksichtigen sind.";
	IR_refersTo = this.SpecIF_refersTo;
	IR_approves = "unterstützt";
	IR_opposes = "lehnt ab";
	IR_inheritsFrom = 	this.SpecIF_inheritsFrom;
// for oem-supplier agreement as defined by the "Hersteller-Initiative-Software":
	HIS_OemStatus = 'Status Hersteller';
	HIS_OemComment = 'Kommentar Hersteller';
	HIS_SupplierStatus = 'Status Lieferant';
	HIS_SupplierComment = 'Kommentar Lieferant';
/*
// attribute names used by DocBridge Resource Director:
	DBRD_ChapterName = 'Titel';
	DBRD_Name = 'Titel';
	DBRD_Text = 'Text';
// attribute names used by Atego Exerpt with RIF 1.1a:
	VALUE_Object_Heading =
	Object_Heading = this.ReqIF_Name;
	VALUE_Object_Text =
	Object_Text = this.ReqIF_Text;
	VALUE_Object_ID =
	Object_ID = this.ReqIF_ForeignID; */
	SpecIF_priorityHigh = "hoch";
	SpecIF_priorityRatherHigh = "eher hoch";
	SpecIF_priorityMedium = "mittel";
	SpecIF_priorityRatherLow = "eher niedrig";
	SpecIF_priorityLow = "niedrig";
	SpecIF_sizeXL = "sehr groß";
	SpecIF_sizeL = "groß";
	SpecIF_sizeM = "mittelgroß";
	SpecIF_sizeS = "klein";
	SpecIF_sizeXS = "sehr klein";
	SpecIF_rejected =
	SpecIF_statusRejected = "00_abgelehnt";
	SpecIF_initial =
	SpecIF_statusInitial = "10_initial";
	SpecIF_drafted =
	SpecIF_statusDrafted = "20_entworfen";
	SpecIF_submitted =
	SpecIF_statusSubmitted = "30_vorgelegt";
	SpecIF_approved =
	SpecIF_statusApproved = "40_genehmigt";
	SpecIF_ready =
	SpecIF_statusReady = "50_bereit";
	SpecIF_done =
	SpecIF_statusDone = "60_umgesetzt";
	SpecIF_validated =
	SpecIF_statusValidated = "70_validiert";
	SpecIF_released =
	SpecIF_statusReleased = "80_freigegeben";
	SpecIF_deprecated =
	SpecIF_statusDeprecated = "88_veraltet";
	SpecIF_withdrawn =
	SpecIF_statusWithdrawn = "90_zurückgezogen";

// Messages:
	MsgConfirm = 'Bitte bestätigen:';
	MsgConfirmDeletion = "'~A' löschen?";
	MsgConfirmObjectDeletion = "Ressource '<b>~A</b>' löschen?";
	MsgConfirmUserDeletion = "Nutzer '<b>~A</b>' löschen?";
	MsgConfirmProjectDeletion = "Projekt '<b>~A</b>' löschen?";
	MsgConfirmSpecDeletion = "Gliederung '<b>~A</b>' mit allen Verweisen löschen?";
	MsgConfirmRoleDeletion = "Rolle '<b>~A</b>' löschen?";
	MsgConfirmFolderDeletion = "Ordner '<b>~A</b>' löschen?";
	MsgInitialLoading = 'Lade den Index für flottere Navigation ... ';
	MsgNoProjectLoaded = 'Kein Projekt geladen.';
	MsgNoProject = 'Kein Projekt gefunden.';
	MsgNoUser = 'Keinen Nutzer gefunden.';
	MsgNoObject = 'Keine Ressource gewählt.';
	MsgCreateResource = "Ressource anlegen";
	MsgCloneResource = "Ressource klonen";
	MsgUpdateResource = "Ressource bearbeiten";
	MsgDeleteResource = "Ressource löschen";
	MsgCreateStatement = "Aussage anlegen";
	MsgOtherProject = "Verspätete Antwort; inzwischen wurde ein anderes Projekt gewählt.";
	MsgWaitPermissions = 'Rechte werden geladen - es ist gleich soweit.';
/*	MsgImportReqif = 'Zulässige Dateitypen sind *.reqifz, *.reqif, *.zip und *.xml. Inhalte müssen den Schemata für ReqIF 1.0+, RIF 1.1a oder RIF 1.2 entsprechen. Der Import dauert meist einige Sekunden und bei sehr großen Dateien mehrere Minuten.'; */
	MsgImportReqif = 'Zulässige Dateitypen sind *.reqifz, *.reqif, *.zip und *.xml. Inhalte müssen den Schemata für ReqIF 1.0+ entsprechen. Der Import dauert meist einige Sekunden und bei sehr großen Dateien mehrere Minuten.';
	MsgImportSpecif = 'Zulässige Dateitypen sind *.specif, *.specif.zip und *.specifz. Inhalte müssen den Schemata für SpecIF 0.10.4+ entsprechen. Bei großen Dateien kann der Import einige Minuten dauern.';
	MsgImportBpmn = 'Zulässiger Dateityp *.bpmn. Inhalte müssen den Schemata für BPMN 2.0 XML entsprechen. Der Import kann bis zu einigen Minuten dauern.';
	MsgImportXls = 'Zulässige Dateitypen sind *.xls, *.xlsx und *.csv. Der Import kann bei sehr großen Dateien mehrere Minuten dauern.';
	MsgExport = 'Es wird eine zip-gepackte Datei im gewählten Format erzeugt. Der Export dauert meist einige Sekunden und im Falle sehr großer Dateien mehrere Minuten; Ihr Browser wird die Datei gemäß Voreinstellungen speichern.';
	MsgLoading = 'Lade soeben ...';
	MsgSearching = 'Suche weiter ...';
	MsgObjectsProcessed = '~A Ressourcen analysiert.';
	MsgObjectsFound = '~A Ressourcen gefunden.';
	MsgNoMatchingObjects = 'Keine Ressource gefunden.';
	MsgNoRelatedObjects = 'Zu dieser Ressource gibt es keine Aussagen.';
	MsgNoComments = 'Zu dieser Ressource gibt es keine Kommentare.';
	MsgNoFiles = 'Keine Datei gefunden.';
	MsgAnalyzing = 'Setze Analyse fort ...';
	MsgNoReports = 'Keine Auswertungen für dieses Projekt.';
	MsgTypeNoObjectType = "Mindestens eine Ressource-Klasse anlegen, sonst können keine Ressourcen erzeugt werden.";
	MsgTypeNoAttribute = "Mindestens ein Attribut anlegen, sonst ist der Typ nicht brauchbar.";
	MsgNoObjectTypeForManualCreation = "Es können keine Ressourcen angelegt werden, weil entweder keine Rechte eingeräumt sind oder weil kein Ressouce-Typ für manuelles Anlegen vorgesehen ist.";
	MsgFilterClogged = 'Filter ist undurchlässig - mindestens ein Kriterium ist nicht erfüllbar.';
	MsgCredentialsUnknown = 'Anmeldeinformation ist unbekannt.';
	MsgUserMgmtNeedsAdminRole = 'Bitten Sie einen Administrator die Nutzer und Rollen zu verwalten.';
	MsgProjectMgmtNeedsAdminRole = 'Bitten Sie einen Administrator die Projekteigenschaften, Rollen und Rechte zu verwalten.';
	MsgImportSuccessful = "'~A' wurde erfolgreich importiert.";
	MsgImportDenied = "'~A' wurde nicht importiert: Das Projekt wird von einer anderen Organisation bearbeitet oder das Schema wird nicht eingehalten.";
	MsgImportFailed = "Der Import von '~A' wurde wegen eines Fehlers abgebrochen.";
	MsgImportAborted = 'Der Import wurde durch den Nutzer abgebrochen.';
	MsgChooseRoleName = 'Bitte benennen Sie die Rolle:';
	MsgIdConflict = "Existiert bereits: Konnte Element '~A' nicht anlegen.";
	MsgRoleNameConflict = "Existiert bereits: Konnte Rolle '~A' nicht anlegen.";
	MsgUserNameConflict = "Existiert bereits: Konnte Nutzer '~A' nicht anlegen.";
	MsgFileApiNotSupported = 'Dieser Browser unterstützt nicht den Zugriff auf Dateien. Bitte wählen Sie einen aktuellen Browser.';
	MsgDoNotLoadAllObjects = 'Es ist nicht zu empfehlen alle Ressourcen in einem Aufruf zu laden.';
	MsgReading = "Lesen";
	MsgCreating = "Anlegen";
	MsgUploading = "übertragen";
	MsgImporting = "Importieren";
	MsgBrowserSaving = "Ihr Browser speichert die Datei gemäß Voreinstellungen.";
	MsgSuccess = "Erfolgreich!";
	MsgSelectImg = "Wählen oder laden Sie ein Bild";
	MsgImgWidth = "Bildbreite [px]";
	MsgSelectResClass = 	this.LblResourceClass+" auswählen";
	MsgSelectStaClass = 	this.LblStatementClass+" auswählen";
	MsgNoEligibleRelTypes = "Keine Aussage-Typen für diesen Ressource-Typ definiert.";
	MsgClickToNavigate = "Eine Ressource doppelt klicken, um dorthin zu navigieren:";
	MsgClickToDeleteRel = "Eine Ressource doppelt klicken, um die betreffende Aussage zu löschen:";
	MsgNoSpec = "Keine Gliederung gefunden."
	MsgTypesCommentCreated = 'Die Typen für Kommentare wurden angelegt.';
	MsgOutlineAdded = 'Gliederung wurde oben hinzu gefügt - bitte konsolidieren Sie die bestehende und die neue manuell.';
	MsgLoadingTypes = 'Lade Typen';
	MsgLoadingFiles = 'Lade Bilder und Dateien';
	MsgLoadingObjects = 'Lade Ressourcen';
	MsgLoadingRelations = 'Lade Aussagen';
	MsgLoadingHierarchies = 'Lade Gliederungen';
	MsgProjectCreated = 'Projekt erfolgreich angelegt';
	MsgProjectUpdated = 'Projekt erfolgreich aktualisiert';
	MsgNoneSpecified = 'leer';

// Error messages:
	Error = 'Fehler';
	Err403Forbidden = 'Kein Zugriffsrecht für Ihre Rolle.';
	Err403NoProjectFolder = 'Mindestens ein Projekt im gewählten Baum dürfen Sie nicht ändern.';
//	Err403NoProjectUpdate = 'Ihre Rolle erlaubt nicht das Aktualisieren des Projekts.';
	Err403NoProjectDelete = 'Ihre Rolle erlaubt nicht das Löschen des Projekts.';
	Err403NoUserDelete = 'Ihre Rolle erlaubt nicht das Löschen von Nutzern.';
	Err403NoRoleDelete = 'Ihre Berechtigungen erlauben nicht das Löschen von Rollen.';
	Err404NotFound = "Element nicht gefunden; es wurde vermutlich gelöscht.";
	ErrNoItem = "Element '~A' nicht gefunden.";
	ErrNoObject = "Ressource '~A' nicht gefunden; es wurde vermutlich gelöscht.";
	ErrNoSpec = "Dieses Projekt hat keine Gliederung; es muss mindestens eine angelegt werden.";
	ErrInvalidFile = 'Ungültige oder unzulässige Datei.';
	ErrInvalidFileType = "'~A' hat einen unzulässigen Dateityp.";
	ErrInvalidAttachment = "Unzulässiger Dateityp. Wählen Sie bitte unter ~A.";
	ErrInvalidFileReqif = "'~A' hat einen unzulässigen Dateityp. Wählen Sie '*.reqifz', '*.reqif', '*.zip' oder '*.xml'.";
	ErrInvalidFileSpecif = "'~A' hat einen unzulässigen Dateityp. Wählen Sie '*.specif.zip', '*.specifz' oder '*.specif'.";
	ErrInvalidFileBpmn = "'~A' hat einen unzulässigen Dateityp. Wählen Sie '*.bpmn'.";
	ErrInvalidFileTogaf = "'~A' hat einen unzulässigen Dateityp. Wählen Sie '*.xml'.";
	ErrInvalidFileXls = "'~A' hat einen unzulässigen Dateityp. Wählen Sie '*.xlsx', '*.xls', oder '*.csv'.";
//	ErrInvalidFileElic = "'~A' hat einen unzulässigen Dateityp. Wählen Sie '*.elic_signed.xml'.";
	ErrUpload = 'Fehler beim Dateitransfer zum Server.';
	ErrImport = "Fehler beim Import.";
	ErrImportTimeout = 'Zeitüberschreitung beim Import.';
	ErrCommunicationTimeout = 'Zeitüberschreitung bei Server-Anfrage.';
	ErrInvalidData = 'Ungültige oder schädliche Daten.';
	ErrInvalidContent = 'Ungültige Daten; sehr wahrscheinlich XHTML-Strukturfehler oder schädlicher Inhalt.';
	ErrInvalidRoleName = "'~A' ist ein ungültiger Rollenname.";
	ErrUpdateConflict = "Ihre Aktualisierung ist im Konflikt mit einer zwischenzeitlichen änderung eines anderen Nutzers.";
	ErrInconsistentPermissions = "Berechtigungen sind widersprüchlich, bitte wenden Sie sich an einen Administrator.";
	ErrObjectNotEligibleForRelation = "Diese Ressourcen können nicht mit der gewählten Aussage verknüpft werden.";
	Err400TypeIsInUse = "Dieser Typ kann nicht gelöscht werden, weil er bereits verwendet wird."
	Err402InsufficientLicense = "Die hinterlegte Lizenz reicht nicht für diese Operation.";

//	monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'October', 'November', 'Dezember' ];
//	monthAbbrs = ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dez' ];

// App icons:
	IcoHome = '<span class="glyphicon glyphicon-home"></span>';
	IcoSystemAdministration = '<span class="glyphicon glyphicon-wrench"></span>';
	IcoUserAdministration = '<span class="glyphicon glyphicon-user"></span>';
	IcoProjectAdministration = '<span class="glyphicon glyphicon-cog"></span>';
//	IcoProjectAdministration = '<span style="font-size:130%">&#9881;</span>';
	IcoSpecifications = '<span class="glyphicon glyphicon-book"></span>';
	IcoReader = '<span class="glyphicon glyphicon-eye-open"></span>';
//	IcoImportReqif = '<span class="glyphicon glyphicon-import"></span>';
//	IcoImportCsv = '<span class="glyphicon glyphicon-import"></span>';
//	IcoImportXls = '<span class="glyphicon glyphicon-import"></span>';
	IcoSupport = '<span class="glyphicon glyphicon-question-sign"></span>';

// App names:
	LblHome = 'Willkommen!';
	LblProjects = 'Projekte';
	LblSystemAdministration = 'Konfiguration';
	LblUserAdministration = 'Nutzer';
	LblProjectAdministration = 'Typen & Rechte';   // for the browser tabs - no HTML!
	LblSpecifications = 'Inhalte';
	LblReader = 'SpecIF Leser';
	LblEditor = 'SpecIF Editor';
	LblSupport = 'Unterstützung';
	AppHome = 	this.IcoHome+'&#160;'+	this.LblHome;
	AppSystemAdministration = 	this.IcoSystemAdministration+'&#160;Interaktives Lastenheft: '+	this.LblSystemAdministration;
	AppUserAdministration = 	this.IcoUserAdministration+'&#160;Interaktives Lastenheft: '+	this.LblUserAdministration;
	AppProjectAdministration = 	this.IcoProjectAdministration+'&#160;Interaktives Lastenheft: '+	this.LblProjectAdministration;
	AppSpecifications = 	this.IcoSpecifications+'&#160;Interaktives Lastenheft: '+	this.LblSpecifications;
	AppReader = 	this.IcoReader+'&#160;'+	this.LblReader;
	AppImport = 	this.IcoImport+'&#160;Import';
	AppLocal = 	this.IcoSpecifications+'&#160;'+	this.LblEditor;
	AppSupport = 	this.IcoSupport+'&#160;'+	this.LblSupport;

	phrase( ms:string, pA:string ):string { 
		// replace a variable '~A' with pA, if available:
        if (ms) {
            if (pA) return this[ms].replace(/~A/, pA);
            return this[ms];
		};
		return '';
	}
	lookup( lb:string ):string { 
		// jsIdOf(): first replace '.' '-' '(' ')' and white-space by '_'
		// for use in regular text fields.
		return this[lb.jsIdOf()] || lb;
	}
};
