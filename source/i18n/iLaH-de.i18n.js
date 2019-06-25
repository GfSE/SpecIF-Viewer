/* 	Provide i18ns and messages in a certain language, in this case 'Deutsch' (de).
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
i18n.LblAll = "Alle";
i18n.LblAllObjects = "Alle Ressourcen";
i18n.LblImport = 'Importieren';
i18n.LblExport = 'Exportieren';
i18n.LblExportReqif = 'ReqIF-Datei exportieren';
i18n.LblExportSpecif = 'SpecIF-Datei exportieren';
i18n.LblAdminister = 'Administrieren';
i18n.LblCreate ="Anlegen";
i18n.LblRead = 'Lesen';
i18n.LblUpdate = 'Aktualisieren';
i18n.LblUpdateProject = 'Projekt-Eigenschaften aktualisieren';
i18n.LblUpdateSpec = 'Gliederungs-Eigenschaften aktualisieren';
i18n.LblUpdateTypes = 'Typen und Rechte aktualisieren';
i18n.LblUpdateObject = 'Diese Ressource aktualisieren';
i18n.LblDelete = 'L&ouml;schen';
i18n.LblDeleteProject = 'Dieses Projekt l&ouml;schen';
i18n.LblDeleteType = 'Diesen Typ l&ouml;schen';
i18n.LblDeleteObject = 'Diese Ressource l&ouml;schen';
i18n.LblDeleteAttribute = 'Dieses Attribut l&ouml;schen';
i18n.LblDeleteRelation = 'Diese Aussage l&ouml;schen';
i18n.LblDeleteRole = 'Rolle l&ouml;schen';
i18n.LblSaveRelationAsSource = 'Ressource als '+i18n.LblSource+' verkn&uuml;pfen';
i18n.LblSaveRelationAsTarget = 'Ressource als '+i18n.LblTarget+' verkn&uuml;pfen';
i18n.LblAdd = 'Anlegen';
i18n.LblAddItem = '~A anlegen';
i18n.LblAddProject = "Projekt anlegen";
i18n.LblAddType = "Typ anlegen";
i18n.LblAddDataType = 'Datentyp anlegen';
i18n.LblAddObjType = 'Ressource-Typ anlegen';
i18n.LblAddRelType = 'Aussage-Typ anlegen';
i18n.LblAddSpcType = 'Gliederungs-Typ anlegen';
i18n.LblAddTypeComment = 'Typen f&uuml;r Kommentare anlegen';
i18n.LblAddObject = "Ressource anlegen";
i18n.LblAddRelation = "Aussage anlegen";
i18n.LblAddAttribute = "Attribut anlegen";
i18n.LblAddUser = "Nutzer anlegen";
i18n.LblAddComment = 'Kommentieren';
i18n.LblAddCommentTo = "Einen Kommentar zu '~A' hinzuf&uuml;gen:";
i18n.LblAddCommentToObject = 'Diese Ressource kommentieren';
i18n.LblAddFolder = "Ordner anlegen";
i18n.LblAddSpec = "Gliederung anlegen";
i18n.LblClone = 'Klonen';
i18n.LblCloneObject = 'Diese Ressource klonen';
i18n.LblCloneType = 'Diesen Typ klonen';
i18n.LblCloneSpec = 'Diese Gliederung klonen';
i18n.LblUserName = 'Nutzername';
i18n.LblPassword = 'Kennwort';
i18n.LblTitle = 'Titel';
i18n.LblLongName = "Stereotyp";
i18n.LblProject = 'Projekt';
i18n.LblName = 'Name';
i18n.LblFirstName = 'Vorname';
i18n.LblLastName = 'Nachname';
i18n.LblOrganizations = 'Organisation';  // until multiple orgs per user are supported
i18n.LblEmail = 'e-mail';
i18n.LblFileName = 'Dateiname';
i18n.LblRoleGeneralAdmin = 'GENERAL-ADMIN';
i18n.LblRoleProjectAdmin = 'ADMIN';
i18n.LblRoleUserAdmin = 'USER-ADMIN';
i18n.LblRoleReader = 'READER';
i18n.LblRoleReqif = 'REQIF';
i18n.LblGlobalActions = 'Aktionen';
i18n.LblItemActions = 'Aktionen';
i18n.LblIdentifier = 'Identifikator';
i18n.LblProjectName = 'Projektname';
i18n.LblDescription = 'Beschreibung';
i18n.LblState = 'Status';
i18n.LblPriority = 'Priorit&auml;t';
i18n.LblCategory = 'Kategorie';
i18n.LblAttribute = 'Attribut';
i18n.LblAttributes = 'Attribute';
i18n.LblAttributeValueRange = "Wertebereich";
i18n.LblAttributeValues = "Werte";
i18n.LblAttributeValue = "Wert";
i18n.LblTool = 'Autoren-Werkzeug';
i18n.LblMyRole = 'Meine Rolle';
i18n.LblRevision = 'Revision';
i18n.LblCreatedAt = 'Erstellt am';
i18n.LblCreatedBy = 'Erstellt von';
i18n.LblCreatedThru = 'Erstellt durch';
i18n.LblModifiedAt = 'Ge&auml;ndert am';
i18n.LblModifiedBy = 'Ge&auml;ndert von';
i18n.LblProjectDetails = 'Eigenschaften';
i18n.LblProjectUsers = '<span class="glyphicon glyphicon-user"/>&nbsp;Nutzer dieses Projekts';
i18n.LblOtherUsers = 'Andere Nutzer';
i18n.LblUserProjects = '<span class="glyphicon glyphicon-book"/>&nbsp;Projekte dieses Nutzers';
i18n.LblOtherProjects = 'Andere Projekte';
i18n.LblType = 'Typ';
i18n.LblTypes = 'Typen';
i18n.LblDataTypes = 'Datentypen';
i18n.LblDataType = 'Datentyp';
i18n.LblDataTypeTitle = 'Datentyp-Name';
i18n.LblSpecTypes = 'Typen';
i18n.LblSpecType = 'Typ';
i18n.LblObjectTypes = 
i18n.LblResourceClasses = 'Ressource-Typen';
i18n.LblObjectType = 'Ressource-Typ';
i18n.LblRelationTypes = 
i18n.LblStatementClasses = 'Aussage-Typen';
i18n.LblRelationType = 'Aussage-Typ';
//i18n.LblRelGroupTypes = 'Aussagegruppen-Typen';
//i18n.LblRelGroupType = 'Aussagegruppen-Typ';
i18n.LblSpecificationTypes = 'Gliederungs-Typen';
i18n.hierarchyType = 
i18n.LblSpecificationType = 'Gliederungs-Typ';
i18n.LblRifTypes = 'Typen';
i18n.rifType = 
i18n.LblRifType = 'Typ';
i18n.LblSpecTypeTitle = 'Name';
i18n.LblAttributeTitle = 'Attribut-Name';
i18n.LblSecondaryFiltersForObjects = i18n.IcoFilter+"&nbsp;Facetten-Filter f&uuml;r '~A'";
i18n.LblPermissions = 'Rechte';
i18n.LblRoles = 'Rollen';
i18n.LblFormat = 'Format';
i18n.LblFileFormat = 'Dateiformat';
i18n.LblStringMatch = '<span class="glyphicon glyphicon-text-background" />&nbsp;Textsuche';
i18n.LblWordBeginnings = 'Nur Wortanf&auml;nge ber&uuml;cksichtigen';
i18n.LblWholeWords = 'Nur ganze Worte ber&uuml;cksichtigen';
i18n.LblCaseSensitive = 'Gro&szlig;/Kleinschreibung beachten';
i18n.LblIncludeEnums = 'Auswahlwerte einbeziehen';
i18n.LblNotAssigned = '(ohne zugewiesenen Wert)';
i18n.LblPrevious = 'Voriges';
i18n.LblNext = 'N&auml;chstes';
i18n.LblGo = 'Los!';
i18n.LblAll = 'Alle';
i18n.LblRelateAs = 'Verkn&uuml;pfen als';
i18n.LblSource = 'Subjekt';
i18n.LblTarget = 'Objekt';
i18n.LblEligibleSources = "Zul&auml;ssige Ressourcen als "+i18n.LblSource;
i18n.LblEligibleTargets = "Zul&auml;ssige Ressourcen als "+i18n.LblTarget;
i18n.LblIcon = 'Symbol';
i18n.LblCreation = 'Anzulegen';
i18n.LblCreateLink1 = "&#x2776;&nbsp;Gew&uuml;nschter Aussage-Typ";
i18n.LblCreateLink2 = "&#x2777;&nbsp;Zu verkn&uuml;pfende Ressource";
i18n.LblReferences = "Referenzen";
i18n.LblInherited = "Geerbt";
i18n.LblMaxLength = "Max. L&auml;nge";
i18n.LblMinValue = "Min. Wert";
i18n.LblMaxValue = "Max. Wert";
i18n.LblAccuracy = "Dezimalstellen";
i18n.LblEnumValues = "Werte (kommagetr.)";
i18n.LblSingleChoice = "Einfach-Auswahl";
i18n.LblMultipleChoice = "Mehrfach-Auswahl";
i18n.LblDirectLink = "Direktverweis";

i18n.BtnLogin = '<span class="glyphicon glyphicon-log-in"/>&nbsp;Anmelden';
i18n.BtnLogout = '<span class="glyphicon glyphicon-log-out"/>&nbsp;Abmelden';
i18n.BtnProfile = 'Profil';
i18n.BtnBack = 'Zur&uuml;ck';
i18n.BtnCancel = 'Abbrechen';
i18n.BtnCancelImport = 'Abbrechen';
i18n.BtnApply = 'Anwenden';
i18n.BtnDelete = '<span class="glyphicon glyphicon-remove"/>&nbsp;L&ouml;schen';
i18n.BtnDeleteObject = '<span class="glyphicon glyphicon-remove"/>&nbsp;Ressource mit Referenzen l&ouml;schen';
i18n.BtnDeleteObjectRef = '<span class="glyphicon glyphicon-remove"/>&nbsp;Diesen Verweis l&ouml;schen';
i18n.BtnImport = '<span class="glyphicon glyphicon-import"/>&nbsp;Import';
i18n.BtnCreate = '<span class="glyphicon glyphicon-import"/>&nbsp;Anlegen';
i18n.BtnReplace = '<span class="glyphicon glyphicon-import"/>&nbsp;Ersetzen';
i18n.BtnUpdate = '<span class="glyphicon glyphicon-import"/>&nbsp;Aktualisieren';
//i18n.BtnImportSpecif = '<span class="glyphicon glyphicon-import"/>&nbsp;SpecIF';
//i18n.BtnImportReqif = '<span class="glyphicon glyphicon-import"/>&nbsp;ReqIF';
//i18n.BtnImportXls = '<span class="glyphicon glyphicon-import"/>&nbsp;xlsx';
//i18n.BtnProjectFromTemplate = "Projekt mit ReqIF-Vorlage anlegen";
i18n.BtnRead = '<span class="glyphicon glyphicon-eye-open"/>&nbsp;Lesen';
i18n.BtnExport = '<span class="glyphicon glyphicon-export"/>&nbsp;Export';
//i18n.BtnExportSpecif = '<span class="glyphicon glyphicon-export"/>&nbsp;SpecIF';
//i18n.BtnExportReqif = '<span class="glyphicon glyphicon-export"/>&nbsp;ReqIF';
i18n.BtnAdd = '<span class="glyphicon glyphicon-plus"/>&nbsp;Neu';
i18n.BtnAddUser = '<span class="glyphicon glyphicon-plus"/>&nbsp;Nutzer';
i18n.BtnAddProject = '<span class="glyphicon glyphicon-plus"/>&nbsp;'+i18n.LblProject;
i18n.BtnAddSpec = '<span class="glyphicon glyphicon-plus"/>&nbsp;Gliederung';
i18n.BtnAddFolder = '<span class="glyphicon glyphicon-plus"/>&nbsp;Ordner';
i18n.BtnAddAttribute = '<span class="glyphicon glyphicon-plus"/>&nbsp;Attribut';
i18n.BtnAddTypeComment = '<span class="glyphicon glyphicon-plus"/>&nbsp;Typen f&uuml;r Kommentare';
i18n.BtnClone = '<span class="glyphicon glyphicon-duplicate"/>&nbsp;Klonen';
i18n.BtnEdit = '<span class="glyphicon glyphicon-pencil"/>&nbsp;Bearbeiten';
i18n.BtnSave = '<span class="glyphicon glyphicon-save"/>&nbsp;Speichern';
i18n.BtnSaveRole = '<span class="glyphicon glyphicon-save"/>&nbsp;Rolle anlegen';
i18n.BtnSaveAttr = '<span class="glyphicon glyphicon-save"/>&nbsp;Attribut anlegen';
i18n.BtnInsert = '<span class="glyphicon glyphicon-save"/>&nbsp;Einf&uuml;gen';
i18n.BtnInsertSuccessor = '<span class="glyphicon glyphicon-save"/>&nbsp;Einf&uuml;gen hinter';
i18n.BtnInsertChild = '<span class="glyphicon glyphicon-save"/>&nbsp;Einf&uuml;gen unter';
i18n.BtnSaveRelation = '<span class="glyphicon glyphicon-save"/>&nbsp;Aussage anlegen';
i18n.BtnSaveItem = '<span class="glyphicon glyphicon-save"/>&nbsp;~A anlegen';
i18n.BtnDetails = 'Details';
i18n.BtnAddRole = '<span class="glyphicon glyphicon-plus" />&nbsp;Rolle';
i18n.BtnFileSelect = '<span class="glyphicon glyphicon-plus" />&nbsp;Datei ausw&auml;hlen ...';
i18n.BtnPrevious = '<span class="glyphicon glyphicon-chevron-up"/>&nbsp;'+i18n.LblPrevious;
i18n.BtnNext = '<span class="glyphicon glyphicon-chevron-down"/>&nbsp;'+i18n.LblNext;
i18n.BtnGo = i18n.IcoGo+'&nbsp;'+i18n.LblGo;
i18n.BtnFilterReset = i18n.IcoFilter+'&nbsp;Neu';
i18n.BtnSelectHierarchy = "Gliederung ausw&auml;hlen";

// Tabs:
i18n.TabAll = '<span class="glyphicon glyphicon-list"/>';
i18n.TabUserList = '<span class="glyphicon glyphicon-list"/>&nbsp;Nutzer';
i18n.TabProjectList = '<span class="glyphicon glyphicon-list"/>&nbsp;Projekte';
//i18n.TabProjectDetails = '<span class="glyphicon glyphicon-pencil"/>&nbsp;Meta';
i18n.TabUserDetails = '<span class="glyphicon glyphicon-pencil"/>&nbsp;Meta';
i18n.TabProjectUsers = '<span class="glyphicon glyphicon-user"/>&nbsp;Nutzer';
i18n.TabUserProjects = '<span class="glyphicon glyphicon-book"/>&nbsp;Projekte';
i18n.TabPermissions = '<span class="glyphicon glyphicon-lock"/>&nbsp;Rechte';
i18n.TabTypes = '<span class="glyphicon glyphicon-cog"/>&nbsp;'+i18n.LblTypes;
i18n.TabDataTypes = '<span class="glyphicon glyphicon-cog"/>&nbsp;'+i18n.LblDataTypes;
i18n.TabSpecTypes = '<span class="glyphicon glyphicon-cog"/>&nbsp;'+i18n.LblObjectTypes;
i18n.TabObjectTypes = '<span class="glyphicon glyphicon-cog"/>&nbsp;'+i18n.LblObjectTypes;
i18n.TabRelationTypes = '<span class="glyphicon glyphicon-cog"/>&nbsp;'+i18n.LblRelationTypes;
i18n.TabRelGroupTypes = '<span class="glyphicon glyphicon-cog"/>&nbsp;'+i18n.LblRelGroupTypes;
i18n.TabSpecificationTypes = '<span class="glyphicon glyphicon-cog"/>&nbsp;'+i18n.LblSpecificationTypes;
i18n.TabRifTypes = '<span class="glyphicon glyphicon-cog"/>&nbsp;'+i18n.LblRifTypes;
i18n.TabTable = '<span class="glyphicon glyphicon-th"/>&nbsp;Tabelle';
i18n.TabDocument = '<span class="glyphicon glyphicon-book"/>&nbsp;Dokument';
i18n.TabFind = '<span class="glyphicon glyphicon-search"/>&nbsp;Suche';
i18n.TabFilter = i18n.IcoFilter+'&nbsp;Filter';
i18n.TabPage = '<span class="glyphicon glyphicon-file"/>&nbsp;Seite';
i18n.TabRevisions = '<span class="glyphicon glyphicon-grain"/>&nbsp;Revisionen';
i18n.TabTimeline = '<span class="glyphicon glyphicon-film"/>&nbsp;Zeitleiste';
i18n.TabRelations = '<span class="glyphicon glyphicon-link"/>&nbsp;Aussagen';
i18n.TabSort = '<span class="glyphicon glyphicon-magnet"/>&nbsp;Sortieren';
i18n.TabAttachments = '<span class="glyphicon glyphicon-paperclip"/>&nbsp;Bilder und Dateien';
i18n.TabComments = '<span class="glyphicon glyphicon-comment"/>&nbsp;Kommentare';
i18n.TabReports = '<span class="glyphicon glyphicon-stats"/>&nbsp;Berichte';

// Functions:
i18n.FnProjectCreate = '<span class="glyphicon glyphicon-plus"/>&nbsp;Projekt';
i18n.FnProjectImport = '<span class="glyphicon glyphicon-import"/>&nbsp;Projekt importieren';
//i18n.FnImportReqif = '<span class="glyphicon glyphicon-import"/>&nbsp;ReqIF importieren';
//i18n.FnImportCsv = '<span class="glyphicon glyphicon-import"/>&nbsp;CSV importieren';
//i18n.FnImportXls = '<span class="glyphicon glyphicon-import"/>&nbsp;XLS importieren';
//i18n.FnProjectFromTemplate = '<span class="glyphicon glyphicon-plus"/>&nbsp;Neues Projekt von Vorlage erstellen';
i18n.FnRefresh = '<span class="glyphicon glyphicon-refresh"/>&nbsp;Aktualisieren';
i18n.FnRead = '<span class="glyphicon glyphicon-eye-open"/>';
i18n.FnOpen = i18n.FnRead;
i18n.FnUpdate = '<span class="glyphicon glyphicon-wrench"/>';
i18n.FnDelete = '<span class="glyphicon glyphicon-remove"/>';
i18n.FnRemove = i18n.FnDelete;

// ReqIF attribute names (replace any '.' by '_', so 'ReqIF.Text' becomes 'ReqIF_Text ):
i18n.ReqIF_ForeignID = 'ID';
i18n.ReqIF_ChapterName = 'Titel';
i18n.ReqIF_Name = 'Titel';
i18n.ReqIF_Text = 'Text';
i18n.ReqIF_ForeignCreatedOn = i18n.LblCreatedAt;
i18n.ReqIF_ForeignCreatedBy = i18n.LblCreatedBy;
i18n.ReqIF_ForeignCreatedThru = i18n.LblCreatedThru;
i18n.ReqIF_ForeignModifiedOn = i18n.LblModifiedAt;
i18n.ReqIF_ForeignModifiedBy = i18n.LblModifiedBy;
i18n.ReqIF_Revision = i18n.LblRevision;
i18n.ReqIF_Description = i18n.LblDescription;
i18n.ReqIF_ChangeDescription = '&Auml;nderungs-Beschreibung';
i18n.ReqIF_Project = i18n.LblProject;
i18n.ReqIF_ForeignState = i18n.LblState;
i18n.ReqIF_Category = i18n.LblCategory;
i18n.ReqIF_Prefix = 'Prefix';
i18n.ReqIF_FitCriteria = 'Abnahme-Kriterium';
i18n.ReqIF_AssociatedFiles = 'Dateien';
i18n.ReqIF_ChapterNumber = 'Kapitelnummer';   // shouldn't be used, as an object cannot (should not) know its position in the outline
// Dublin Core (DCMI) attribute names:
i18n.DC_title =
i18n.dcterms_title = "Titel";
i18n.DC_description =
i18n.dcterms_description = "Beschreibung";
i18n.DC_identifier =
i18n.dcterms_identifier = i18n.LblIdentifier;
i18n.DC_creator =
i18n.dcterms_creator = "Autor";
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
//i18n.oslc_rm_validatedBy = "";
//i18n.oslc_rm_decomposedBy = "";
//i18n.oslc_rm_decomposes = "";
//i18n.oslc_rm_constrainedBy = "";
//i18n.oslc_rm_constrains = "";
// SpecIF entity, relation and attribute names
i18n.SpecIF_Heading = "&Uuml;berschrift";
i18n.SpecIF_Headings = "&Uuml;berschriften";
i18n.SpecIF_Name = i18n.LblName;
//i18n.SpecIF_Names = "Namen";
i18n.SpecIF_Folder = "Ordner";	// deprecated, use SpecIF:Heading
i18n.SpecIF_Folders = "Ordner";	// deprecated, use SpecIF:Headings
i18n.SpecIF_Chapter = "Kapitel";	// deprecated, use SpecIF:Heading
i18n.SpecIF_Chapters = "Kapitel";// deprecated, use SpecIF:Headings
i18n.SpecIF_Paragraph = "Abschnitt";
i18n.SpecIF_Paragraphs = "Abschnitte";
i18n.SpecIF_Information = "Information";// deprecated, use SpecIF:Paragraph
i18n.SpecIF_Diagram = "Diagramm";
i18n.SpecIF_Diagrams = "Diagramme";
i18n.SpecIF_View = "Diagramm";		// deprecated
i18n.SpecIF_Views = "Diagramme";	// deprecated
i18n.FMC_Plan = "Plan";
i18n.FMC_Plans = "Pl&auml;ne";
i18n.SpecIF_Object = 
i18n.SpecIF_Resource = "Ressource";
i18n.SpecIF_Objects = 
i18n.SpecIF_Resources = "Ressourcen";
i18n.SpecIF_Relation = 
i18n.SpecIF_Statement = "Aussage";
i18n.SpecIF_Relations = 
i18n.SpecIF_Statements = "Aussagen";
i18n.SpecIF_Property = "Attribut";
i18n.SpecIF_Properties = "Attribute";
i18n.FMC_Actor = "Akteur";
i18n.FMC_Actors = "Akteure";
i18n.FMC_State = "Zustand";
i18n.FMC_States = "Zust&auml;nde";
i18n.FMC_Event = "Ereignis";
i18n.FMC_Events = "Ereignisse";
i18n.SpecIF_Feature = "Merkmal";
i18n.SpecIF_Features = "Merkmale";
i18n.SpecIF_Requirement =
i18n.IREB_Requirement = "Anforderung";
i18n.SpecIF_Requirements = "Anforderungen";
i18n.SpecIF_Note = "Anmerkung";
i18n.SpecIF_Notes = "Anmerkungen";
i18n.SpecIF_Comment = "Kommentar";
i18n.SpecIF_Comments = "Kommentare";
i18n.SpecIF_Issue = "Offener Punkt";
i18n.SpecIF_Issues = "Offene Punkte";
i18n.SpecIF_Hierarchy = "Gliederung";
i18n.SpecIF_Hierarchies = "Gliederungen";
i18n.SpecIF_Outline = "Gliederung";
i18n.SpecIF_Outlines = "Gliederungen";
i18n.SpecIF_Vote = "Wertung";
i18n.SpecIF_Votes = "Wertungen";
i18n.SpecIF_Effort = "Aufwand";
i18n.SpecIF_Risk = 
i18n.IREB_Risk = "Risiko";
i18n.SpecIF_Benefit = "Nutzen";
i18n.SpecIF_Damage = "Schaden";
i18n.SpecIF_Probability = "Wahrscheinlichkeit";
i18n.SpecIF_shows = "zeigt";
i18n.SpecIF_contains = "enth&auml;lt";
i18n.oslc_rm_satisfiedBy = "erf&uuml;llt von";;
i18n.oslc_rm_satisfies = 
i18n.SpecIF_satisfies =
i18n.IREB_satisfies = "erf&uuml;llt";
i18n.SpecIF_implements = "realisiert";
i18n.SpecIF_modifies =
i18n.SpecIF_stores = "schreibt und liest";
i18n.SpecIF_reads = "liest";
i18n.SpecIF_writes = "schreibt";
i18n.SpecIF_sendsTo = "sendet an";
i18n.SpecIF_receivesFrom = "empf&auml;ngt von";
i18n.SpecIF_influences = "beeinflusst";
i18n.SpecIF_follows = "folgt auf";
i18n.SpecIF_precedes = "ist Vorgänger von";
i18n.SpecIF_signals = "signalisiert";
i18n.SpecIF_triggers = "l&ouml;st aus";
i18n.SpecIF_dependsOn = "h&auml;ngt ab von";
i18n.SpecIF_refines = 
i18n.IREB_refines = "verfeinert";
i18n.SpecIF_duplicates = "dupliziert";
i18n.SpecIF_contradicts = "widerspricht";
i18n.SpecIF_isAssociatedWith =
i18n.SysML_isAssociatedWith = "ist assoziiert mit";
i18n.SysML_isAllocatedTo = "wird ausgeführt von";
i18n.SysML_includes = "includiert";
i18n.SysML_extends = "erweitert";
i18n.SpecIF_isDerivedFrom = 
i18n.SysML_isDerivedFrom = "ist abgeleitet von";
i18n.SysML_isComposedOf = "ist Komposition von";
i18n.SysML_isAggregatedBy = "ist Aggregation von";
i18n.SysML_isGeneralisationOf = "ist generalisiert von";
i18n.SysML_isSpecialisationOf = "ist spezialisiert von";
i18n.SpecIF_isSynonymOf = "ist synonym mit";
i18n.SpecIF_isInverseOf = "ist Gegenteil von";
i18n.SpecIF_inheritsFrom = "erbt von";
i18n.SpecIF_refersTo = "bezieht sich auf";
i18n.SpecIF_commentRefersTo = i18n.SpecIF_refersTo;
i18n.SpecIF_issueRefersTo = i18n.SpecIF_refersTo;
i18n.SpecIF_includes = "schlie&szlig;t ein";
i18n.SpecIF_excludes = "schlie&szlig;t aus";
i18n.SpecIF_mentions = "erw&auml;hnt"; 
i18n.SpecIF_sameAs =
i18n.owl_sameAs = "identisch mit";
i18n.SpecIF_Id = i18n.LblIdentifier;
i18n.SpecIF_Type = i18n.LblType;
i18n.SpecIF_Notation = "Notation";
i18n.SpecIF_Stereotype = "Stereotyp";
i18n.SpecIF_Category = i18n.LblCategory;
i18n.SpecIF_Status = i18n.LblState;
i18n.SpecIF_State = i18n.LblState;			// DEPRECATED
i18n.SpecIF_Priority = i18n.LblPriority;
i18n.SpecIF_Milestone = "Meilenstein";
i18n.SpecIF_DueDate = "Termin";
i18n.SpecIF_Icon = "Symbol";
i18n.SpecIF_Tag = "Schlagwort";
i18n.SpecIF_Tags = "Schlagworte";
//i18n.SpecIF_Creation = "";
i18n.SpecIF_Instantiation = "Instanziierung";
i18n.SpecIF_Origin = "Quelle";		// oder "Herkunft"
i18n.SpecIF_Source = i18n.LblSource;
i18n.SpecIF_Target = i18n.LblTarget;
//i18n.SpecIF_Author = "Autor";
//i18n.SpecIF_Authors = "Autoren";
i18n.IREB_Stakeholder = "Stakeholder";
i18n.SpecIF_Responsible = "Verantwortlicher";
i18n.SpecIF_Responsibles = "Verantwortliche";
// attribute names used by the Interaction Room:
i18n.IR_Annotation = "Annotation";
i18n.IR_refersTo = i18n.SpecIF_refersTo;
i18n.IR_approves = "unterst&uuml;tzt";
i18n.IR_opposes = "lehnt ab";
i18n.IR_inheritsFrom = i18n.SpecIF_inheritsFrom;
// for oem-supplier agreement as defined by the "Hersteller-Initiative-Software":
i18n.HIS_OemStatus = 'Status Hersteller';
i18n.HIS_OemComment = 'Kommentar Hersteller';
i18n.HIS_SupplierStatus = 'Status Lieferant';
i18n.HIS_SupplierComment = 'Kommentar Lieferant';
// attribute names used by DocBridge Resource Director:
i18n.DBRD_ChapterName = 'Titel';
i18n.DBRD_Name = 'Titel';
i18n.DBRD_Text = 'Text';
// attribute names used by Atego Exerpt with RIF 1.1a:
i18n.Object_Heading = i18n.ReqIF_Name;
i18n.VALUE_Object_Heading = i18n.ReqIF_Name;
i18n.Object_Text = i18n.ReqIF_Text;
i18n.VALUE_Object_Text = i18n.ReqIF_Text;
i18n.Object_ID = i18n.ReqIF_ForeignID;
i18n.VALUE_Object_ID = i18n.ReqIF_ForeignID;

// Messages:
i18n.MsgConfirm = 'Bitte best&auml;tigen:';
i18n.MsgConfirmDeletion = "'~A' l&ouml;schen?";
i18n.MsgConfirmObjectDeletion = "Ressource '<b>~A</b>' l&ouml;schen?";
i18n.MsgConfirmUserDeletion = "Nutzer '<b>~A</b>' l&ouml;schen?";
i18n.MsgConfirmProjectDeletion = "Projekt '<b>~A</b>' l&ouml;schen?";
i18n.MsgConfirmSpecDeletion = "Gliederung '<b>~A</b>' mit allen Verweisen l&ouml;schen?";
i18n.MsgConfirmRoleDeletion = "Rolle '<b>~A</b>' l&ouml;schen?";
i18n.MsgConfirmFolderDeletion = "Ordner '<b>~A</b>' l&ouml;schen?";
i18n.MsgInitialLoading = 'Lade den Index f&uuml;r flottere Navigation ... ';
i18n.MsgNoProject = 'Kein Projekt gefunden.';
i18n.MsgNoUser = 'Keinen Nutzer gefunden.';
i18n.MsgNoObject = 'Keine Ressource gew&auml;hlt.';
i18n.MsgOtherProject = "Versp&auml;tete Antwort; inzwischen wurde ein anderes Projekt gew&auml;hlt.";
i18n.MsgWaitPermissions = 'Rechte werden geladen - es ist gleich soweit.';
i18n.MsgImportReqif = 'Zul&auml;ssige Dateitypen sind *.reqifz, *.reqif, *.zip und *.xml. Inhalte m&uuml;ssen den Schemata f&uuml;r ReqIF 1.0+, RIF 1.1a oder RIF 1.2 entsprechen. Der Import dauert meist einige Minuten und im Falle sehr gro&szlig;er Dateien bis zu einer Stunde.';
i18n.MsgImportSpecif = 'Zul&auml;ssige Dateitypen sind *.specifz und *.specif. Inhalte m&uuml;ssen den Schemata f&uuml;r SpecIF 0.10.4+ entsprechen. Bei gro&szlig;en Dateien kann der Import einige Minuten dauern.';
i18n.MsgImportBpmn = 'Zul&auml;ssiger Dateityp *.bpmn. Inhalte m&uuml;ssen den Schemata f&uuml;r BPMN 2.0 XML entsprechen. Der Import kann bis zu einigen Minuten dauern.';
i18n.MsgImportXls = 'Zul&auml;ssige Dateitypen sind *.xls, *.xlsx und *.csv. Der Import dauert meist einige Minuten und im Falle sehr gro&szlig;er Dateien bis zu einer Stunde.';
i18n.MsgExport = 'Es wird eine zip-gepackte Datei im gew&auml;hlten Format erzeugt. Der Export dauert meist einige Minuten und im Falle sehr gro&szlig;er Dateien bis zu einer Stunde; Ihr Browser wird die Datei gem&auml;&szlig; Voreinstellungen speichern.';
i18n.MsgLoading = 'Lade soeben ...';
i18n.MsgSearching = 'Suche weiter ...';
i18n.MsgObjectsProcessed = '~A Ressourcen analysiert.';
i18n.MsgObjectsFound = '~A Ressourcen gefunden.';
i18n.MsgNoMatchingObjects = 'Keine Ressource gefunden.';
i18n.MsgNoRelatedObjects = 'Zu dieser Ressource gibt es keine Aussagen.';
i18n.MsgNoComments = 'Zu dieser Ressource gibt es keine Kommentare.';
i18n.MsgNoFiles = 'Keine Datei gefunden.';
i18n.MsgAnalyzing = 'Setze Analyse fort ...';
i18n.MsgNoReports = 'Keine Auswertungen f&uuml;r dieses Projekt.';
i18n.MsgTypeNoObjectType = "Mindestens einen Ressource-Typ anlegen, sonst k&ouml;nnen keine Ressourcen erzeugt werden.";
i18n.MsgTypeNoAttribute = "Mindestens ein Attribut anlegen, sonst ist der Typ nicht brauchbar.";
i18n.MsgNoObjectTypeForManualCreation = "Es k&ouml;nnen keine Ressourcen angelegt werden, weil entweder keine Rechte einger&auml;umt sind oder weil kein Ressouce-Typ f&uuml;r manuelles Anlegen vorgesehen ist.";
i18n.MsgFilterClogged = 'Filter ist undurchl&auml;ssig - mindestens ein Kriterium ist nicht erf&uuml;llbar.';
i18n.MsgCredentialsUnknown = 'Anmeldeinformation ist unbekannt.';
i18n.MsgUserMgmtNeedsAdminRole = 'Bitten Sie einen Administrator die Nutzer und Rollen zu verwalten.';
i18n.MsgProjectMgmtNeedsAdminRole = 'Bitten Sie einen Administrator die Projekteigenschaften, Rollen und Rechte zu verwalten.';
i18n.MsgImportSuccessful = "'~A' wurde erfolgreich importiert.";
i18n.MsgImportDenied = "'~A' wurde nicht importiert: Das Projekt wird von einer anderen Organisation bearbeitet oder das Schema wird nicht eingehalten.";
i18n.MsgImportFailed = "Der Import von '~A' wurde wegen eines Fehlers abgebrochen.";
i18n.MsgImportAborted = 'Der Import wurde durch den Nutzer abgebrochen.';
i18n.MsgChooseRoleName = 'Bitte benennen Sie die Rolle:';
i18n.MsgIdConflict = "Existiert bereits: Konnte Element '~A' nicht anlegen.";
i18n.MsgRoleNameConflict = "Existiert bereits: Konnte Rolle '~A' nicht anlegen.";
i18n.MsgUserNameConflict = "Existiert bereits: Konnte Nutzer '~A' nicht anlegen.";
i18n.MsgFileApiNotSupported = 'Dieser Browser unterst&uuml;tzt nicht den Zugriff auf Dateien. Bitte w&auml;hlen Sie einen aktuellen Browser.';
i18n.MsgDoNotLoadAllObjects = 'Es ist nicht zu empfehlen alle Ressourcen in einem Aufruf zu laden.';
i18n.MsgReading = "Lesen";
i18n.MsgCreating = "Anlegen";
i18n.MsgUploading = "&Uuml;bertragen";
i18n.MsgImporting = "Importieren";
i18n.MsgBrowserSaving = "Ihr Browser speichert die Datei gem&auml;&szlig; Voreinstellungen.";
i18n.MsgSuccess = "Erfolgreich!";
i18n.MsgSelectImg = "W&auml;hlen oder laden Sie ein Bild:";
i18n.MsgImgWidth = "Bildbreite [px]";
i18n.MsgNoEligibleRelTypes = "Keine Aussage-Typen f&uuml;r diesen Ressource-Typ definiert.";
i18n.MsgClickToNavigate = "Eine Ressource doppelt klicken, um dorthin zu navigieren:";
i18n.MsgClickToDeleteRel = "Eine Ressource doppelt klicken, um die betreffende Aussage zu l&ouml;schen:";
i18n.MsgNoSpec = "Keine Gliederung gefunden."
i18n.MsgTypesCommentCreated = 'Die Typen f&uuml;r Kommentare wurden angelegt.';
i18n.MsgOutlineAdded = 'Gliederung wurde oben hinzu gef&uuml;gt - bitte konsolidieren Sie die bestehende und die neue manuell.';
i18n.MsgLoadingTypes = 'Lade Typen';
i18n.MsgLoadingFiles = 'Lade Bilder und Dateien';
i18n.MsgLoadingObjects = 'Lade Ressourcen';
i18n.MsgLoadingRelations = 'Lade Aussagen';
i18n.MsgLoadingHierarchies = 'Lade Gliederungen';
i18n.MsgProjectCreated = 'Projekt erfolgreich angelegt';
i18n.MsgProjectUpdated = 'Projekt erfolgreich aktualisiert';
i18n.MsgNoneSpecified = 'leer';

// Error messages:
i18n.Error = 'Fehler';
i18n.Err403Forbidden = 'Kein Zugriffsrecht f&uuml;r Ihre Rolle.';
i18n.Err403NoProjectFolder = 'Mindestens ein Projekt im gew&auml;hlten Baum d&uuml;rfen Sie nicht &auml;ndern.';
//i18n.Err403NoProjectUpdate = 'Ihre Rolle erlaubt nicht das Aktualisieren des Projekts.';
i18n.Err403NoProjectDelete = 'Ihre Rolle erlaubt nicht das L&ouml;schen des Projekts.';
i18n.Err403NoUserDelete = 'Ihre Rolle erlaubt nicht das L&ouml;schen von Nutzern.';
i18n.Err403NoRoleDelete = 'Ihre Berechtigungen erlauben nicht das L&ouml;schen von Rollen.';
i18n.Err404NotFound = "Element nicht gefunden; es wurde vermutlich gel&ouml;scht.";
i18n.ErrNoItem = "Element '~A' nicht gefunden.";
i18n.ErrNoObject = "Ressource '~A' nicht gefunden; es wurde vermutlich gel&ouml;scht.";
i18n.ErrNoSpec = "Dieses Projekt hat keine Gliederung; es muss mindestens eine angelegt werden.";
i18n.ErrInvalidFile = 'Ung&uuml;ltige oder unzul&auml;ssige Datei.';
i18n.ErrInvalidFileType = "'~A' hat einen unzul&auml;ssigen Dateityp.";
i18n.ErrInvalidAttachment = "Unzul&auml;ssiger Dateityp. W&auml;hlen Sie bitte unter ~A.";
i18n.ErrInvalidFileReqif = "'~A' hat einen unzul&auml;ssigen Dateityp. W&auml;hlen Sie '*.reqifz', '*.reqif', '*.zip' oder '*.xml'.";
i18n.ErrInvalidFileSpecif = "'~A' hat einen unzul&auml;ssigen Dateityp. W&auml;hlen Sie '*.specifz' oder '*.specif'.";
i18n.ErrInvalidFileBpmn = "'~A' hat einen unzul&auml;ssigen Dateityp. W&auml;hlen Sie '*.bpmn'.";
i18n.ErrInvalidFileXls = "'~A' hat einen unzul&auml;ssigen Dateityp. W&auml;hlen Sie '*.xlsx', '*.xls', oder '*.csv'.";
//i18n.ErrInvalidFileElic = "'~A' hat einen unzul&auml;ssigen Dateityp. W&auml;hlen Sie '*.elic_signed.xml'.";
i18n.ErrUpload = 'Fehler beim Dateitransfer zum Server.';
i18n.ErrImport = "Fehler beim Import.";
i18n.ErrImportTimeout = 'Zeit&uuml;berschreitung beim Import.';
i18n.ErrCommunicationTimeout = 'Zeit&uuml;berschreitung bei Server-Anfrage.';
i18n.ErrInvalidData = 'Ung&uuml;ltige oder sch&auml;dliche Daten.';
i18n.ErrInvalidContent = 'Ung&uuml;ltige Daten; sehr wahrscheinlich XHTML-Strukturfehler oder sch&auml;dlicher Inhalt.';
i18n.ErrInvalidRoleName = "'~A' ist ein ung&uuml;ltiger Rollenname.";
i18n.ErrUpdateConflict = "Ihre Aktualisierung ist im Konflikt mit einer zwischenzeitlichen &Auml;nderung eines anderen Nutzers.";
i18n.ErrInconsistentPermissions = "Berechtigungen sind widerspr&uuml;chlich, bitte wenden Sie sich an einen Administrator.";
i18n.ErrObjectNotEligibleForRelation = "Diese Ressourcen k&ouml;nnen nicht mit der gew&auml;hlten Aussage verkn&uuml;pft werden.";
i18n.Err400TypeIsInUse = "Dieser Typ kann nicht gel&ouml;scht werden, weil er bereits verwendet wird."
i18n.Err402InsufficientLicense = "Die hinterlegte Lizenz reicht nicht f&uuml;r diese Operation.";

i18n.monthNames = ['Januar', 'Februar', 'M&auml;rz', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'October', 'November', 'Dezember' ];
//i18n.monthAbbrs = ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dez' ];

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
i18n.LblHome = 'Willkommen!';
i18n.LblProjects = 'Projekte';
i18n.LblSystemAdministration = 'Konfiguration';
i18n.LblUserAdministration = 'Nutzer';
i18n.LblProjectAdministration = 'Typen & Rechte';   // for the browser tabs - no HTML!
i18n.LblSpecifications = 'Inhalte';
i18n.LblReader = 'SpecIF Leser';
i18n.LblLocal = 'SpecIF Editor';
i18n.LblSupport = 'Unterst&uuml;tzung';
i18n.AppHome = i18n.IcoHome+'&nbsp;'+i18n.LblHome;
i18n.AppSystemAdministration = i18n.IcoSystemAdministration+'&nbsp;Interaktives Lastenheft: '+i18n.LblSystemAdministration;
i18n.AppUserAdministration = i18n.IcoUserAdministration+'&nbsp;Interaktives Lastenheft: '+i18n.LblUserAdministration;
i18n.AppProjectAdministration = i18n.IcoProjectAdministration+'&nbsp;Interaktives Lastenheft: '+i18n.LblProjectAdministration;
i18n.AppSpecifications = i18n.IcoSpecifications+'&nbsp;Interaktives Lastenheft: '+i18n.LblSpecifications;
i18n.AppReader = i18n.IcoReader+'&nbsp;'+i18n.LblReader;
i18n.AppImport = i18n.IcoImport+'&nbsp;Import';
i18n.AppLocal = i18n.IcoSpecifications+'&nbsp;'+i18n.LblLocal;
i18n.AppSupport = i18n.IcoSupport+'&nbsp;'+i18n.LblSupport;
