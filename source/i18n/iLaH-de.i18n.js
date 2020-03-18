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
	return i18n[lb.toJsId()] || lb
/*	try {
		return i18n[lb.toJsId()].stripHTML()
	} catch(e) {
		return lb
	}  */
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
i18n.IcoAbout = '<strong>&#169;</strong>'; // copyright sign

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
i18n.LblDelete = 'Löschen';
i18n.LblDeleteProject = 'Dieses Projekt löschen';
i18n.LblDeleteType = 'Diesen Typ löschen';
i18n.LblDeleteObject = 'Diese Ressource löschen';
i18n.LblDeleteAttribute = 'Dieses Attribut löschen';
i18n.LblDeleteRelation = 'Diese Aussage löschen';
i18n.LblDeleteRole = 'Rolle löschen';
i18n.LblSaveRelationAsSource = 'Ressource als '+i18n.LblSource+' verknüpfen';
i18n.LblSaveRelationAsTarget = 'Ressource als '+i18n.LblTarget+' verknüpfen';
i18n.LblAdd = 'Anlegen';
i18n.LblAddItem = '~A anlegen';
i18n.LblAddProject = "Projekt anlegen";
i18n.LblAddType = "Typ anlegen";
i18n.LblAddDataType = 'Datentyp anlegen';
i18n.LblAddObjType = 'Ressource-Typ anlegen';
i18n.LblAddRelType = 'Aussage-Typ anlegen';
i18n.LblAddSpcType = 'Gliederungs-Typ anlegen';
i18n.LblAddTypeComment = 'Typen für Kommentare anlegen';
i18n.LblAddObject = "Ressource anlegen";
i18n.LblAddRelation = "Aussage anlegen";
i18n.LblAddAttribute = "Attribut anlegen";
i18n.LblAddUser = "Nutzer anlegen";
i18n.LblAddComment = 'Kommentieren';
i18n.LblAddCommentTo = "Einen Kommentar zu '~A' hinzufügen:";
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
i18n.LblPriority = 'Priorität';
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
i18n.LblModifiedAt = 'Geändert am';
i18n.LblModifiedBy = 'Geändert von';
i18n.LblProjectDetails = 'Eigenschaften';
i18n.LblProjectUsers = '<span class="glyphicon glyphicon-user"/>&#160;Nutzer dieses Projekts';
i18n.LblOtherUsers = 'Andere Nutzer';
i18n.LblUserProjects = '<span class="glyphicon glyphicon-book"/>&#160;Projekte dieses Nutzers';
i18n.LblOtherProjects = 'Andere Projekte';
i18n.LblType = 'Typ';
i18n.LblTypes = 'Typen';
i18n.LblDataTypes = 'Datentypen';
i18n.LblDataType = 'Datentyp';
i18n.LblDataTypeTitle = 'Datentyp-Name';
i18n.LblSpecTypes = 'Typen';
i18n.LblSpecType = 'Typ';
i18n.LblObjectTypes = 
i18n.LblResourceClasses = 'Ressource-Klassen';
i18n.LblObjectType = 'Ressource-Klasse';
i18n.LblRelationTypes = 
i18n.LblStatementClasses = 'Aussage-Klassen';
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
i18n.LblSecondaryFiltersForObjects = i18n.IcoFilter+"&#160;Facetten-Filter für '~A'";
i18n.LblPermissions = 'Rechte';
i18n.LblRoles = 'Rollen';
i18n.LblFormat = 'Format';
i18n.LblFileFormat = 'Dateiformat';
i18n.LblStringMatch = '<span class="glyphicon glyphicon-text-background" />&#160;Textsuche';
i18n.LblWordBeginnings = 'Nur Wortanfänge berücksichtigen';
i18n.LblWholeWords = 'Nur ganze Worte berücksichtigen';
i18n.LblCaseSensitive = 'Groß/Kleinschreibung beachten';
i18n.LblExcludeEnums = 'Auswahlwerte übergehen';
i18n.LblNotAssigned = '(ohne zugewiesenen Wert)';
i18n.LblPrevious = 'Voriges';
i18n.LblNext = 'Nächstes';
i18n.LblGo = 'Los!';
i18n.LblAll = 'Alle';
i18n.LblHitCount = 'Trefferzahl';
i18n.LblRelateAs = 'Verknüpfen als';
i18n.LblSource = 'Subjekt';
i18n.LblTarget = 'Objekt';
i18n.LblEligibleSources = "Zulässige Ressourcen als "+i18n.LblSource;
i18n.LblEligibleTargets = "Zulässige Ressourcen als "+i18n.LblTarget;
i18n.LblIcon = 'Symbol';
i18n.LblCreation = 'Anzulegen';
i18n.LblCreateLink1 = "&#x2776;&#160;Gewünschter Aussage-Typ";
i18n.LblCreateLink2 = "&#x2777;&#160;Zu verknüpfende Ressource";
i18n.LblReferences = "Referenzen";
i18n.LblInherited = "Geerbt";
i18n.LblMaxLength = "Max. Länge";
i18n.LblMinValue = "Min. Wert";
i18n.LblMaxValue = "Max. Wert";
i18n.LblAccuracy = "Dezimalstellen";
i18n.LblEnumValues = "Werte (kommagetr.)";
i18n.LblSingleChoice = "Einfach-Auswahl";
i18n.LblMultipleChoice = "Mehrfach-Auswahl";
i18n.LblDirectLink = "Direktverweis";

i18n.BtnLogin = '<span class="glyphicon glyphicon-log-in"/>&#160;Anmelden';
i18n.BtnLogout = '<span class="glyphicon glyphicon-log-out"/>&#160;Abmelden';
i18n.BtnProfile = 'Profil';
i18n.BtnBack = 'Zurück';
i18n.BtnCancel = 'Abbrechen';
i18n.BtnCancelImport = 'Abbrechen';
i18n.BtnApply = 'Anwenden';
i18n.BtnDelete = '<span class="glyphicon glyphicon-remove"/>&#160;Löschen';
i18n.BtnDeleteObject = '<span class="glyphicon glyphicon-remove"/>&#160;Ressource mit Referenzen löschen';
i18n.BtnDeleteObjectRef = '<span class="glyphicon glyphicon-remove"/>&#160;Diesen Verweis löschen';
i18n.BtnImport = '<span class="glyphicon glyphicon-import"/>&#160;Import';
i18n.BtnCreate = '<span class="glyphicon glyphicon-import"/>&#160;Anlegen';
i18n.BtnReplace = '<span class="glyphicon glyphicon-import"/>&#160;Ersetzen';
i18n.BtnAdopt = '<span class="glyphicon glyphicon-import"/>&#160;Adoptieren'; //Aneignen
i18n.BtnUpdate = '<span class="glyphicon glyphicon-import"/>&#160;'+i18n.LblUpdate;
//i18n.BtnImportSpecif = '<span class="glyphicon glyphicon-import"/>&#160;SpecIF';
//i18n.BtnImportReqif = '<span class="glyphicon glyphicon-import"/>&#160;ReqIF';
//i18n.BtnImportXls = '<span class="glyphicon glyphicon-import"/>&#160;xlsx';
//i18n.BtnProjectFromTemplate = "Projekt mit ReqIF-Vorlage anlegen";
i18n.BtnRead = '<span class="glyphicon glyphicon-eye-open"/>&#160;Lesen';
i18n.BtnExport = '<span class="glyphicon glyphicon-export"/>&#160;Export';
//i18n.BtnExportSpecif = '<span class="glyphicon glyphicon-export"/>&#160;SpecIF';
//i18n.BtnExportReqif = '<span class="glyphicon glyphicon-export"/>&#160;ReqIF';
i18n.BtnAdd = '<span class="glyphicon glyphicon-plus"/>&#160;Neu';
i18n.BtnAddUser = '<span class="glyphicon glyphicon-plus"/>&#160;Nutzer';
i18n.BtnAddProject = '<span class="glyphicon glyphicon-plus"/>&#160;'+i18n.LblProject;
i18n.BtnAddSpec = '<span class="glyphicon glyphicon-plus"/>&#160;Gliederung';
i18n.BtnAddFolder = '<span class="glyphicon glyphicon-plus"/>&#160;Ordner';
i18n.BtnAddAttribute = '<span class="glyphicon glyphicon-plus"/>&#160;Attribut';
i18n.BtnAddTypeComment = '<span class="glyphicon glyphicon-plus"/>&#160;Klassen für Kommentare';
i18n.BtnClone = '<span class="glyphicon glyphicon-duplicate"/>&#160;Klonen';
i18n.BtnEdit = '<span class="glyphicon glyphicon-pencil"/>&#160;Bearbeiten';
i18n.BtnSave = '<span class="glyphicon glyphicon-save"/>&#160;Speichern';
i18n.BtnSaveRole = '<span class="glyphicon glyphicon-save"/>&#160;Rolle anlegen';
i18n.BtnSaveAttr = '<span class="glyphicon glyphicon-save"/>&#160;Attribut anlegen';
i18n.BtnInsert = '<span class="glyphicon glyphicon-save"/>&#160;Einfügen';
i18n.BtnInsertSuccessor = '<span class="glyphicon glyphicon-save"/>&#160;Einfügen hinter';
i18n.BtnInsertChild = '<span class="glyphicon glyphicon-save"/>&#160;Einfügen unter';
i18n.BtnSaveRelation = '<span class="glyphicon glyphicon-save"/>&#160;Aussage anlegen';
i18n.BtnSaveItem = '<span class="glyphicon glyphicon-save"/>&#160;~A anlegen';
i18n.BtnDetails = 'Details';
i18n.BtnAddRole = '<span class="glyphicon glyphicon-plus" />&#160;Rolle';
i18n.BtnFileSelect = '<span class="glyphicon glyphicon-plus" />&#160;Datei auswählen ...';
i18n.BtnPrevious = '<span class="glyphicon glyphicon-chevron-up"/>&#160;'+i18n.LblPrevious;
i18n.BtnNext = '<span class="glyphicon glyphicon-chevron-down"/>&#160;'+i18n.LblNext;
i18n.BtnGo = i18n.IcoGo+'&#160;'+i18n.LblGo;
i18n.BtnFilterReset = i18n.IcoFilter+'&#160;Neu';
i18n.BtnSelectHierarchy = "Gliederung auswählen";

// Tabs:
i18n.TabAll = '<span class="glyphicon glyphicon-list"/>';
i18n.TabUserList = '<span class="glyphicon glyphicon-list"/>&#160;Nutzer';
i18n.TabProjectList = '<span class="glyphicon glyphicon-list"/>&#160;Projekte';
//i18n.TabProjectDetails = '<span class="glyphicon glyphicon-pencil"/>&#160;Meta';
i18n.TabUserDetails = '<span class="glyphicon glyphicon-pencil"/>&#160;Meta';
i18n.TabProjectUsers = '<span class="glyphicon glyphicon-user"/>&#160;Nutzer';
i18n.TabUserProjects = '<span class="glyphicon glyphicon-book"/>&#160;Projekte';
i18n.TabPermissions = '<span class="glyphicon glyphicon-lock"/>&#160;Rechte';
i18n.TabTypes = '<span class="glyphicon glyphicon-cog"/>&#160;'+i18n.LblTypes;
i18n.TabDataTypes = '<span class="glyphicon glyphicon-cog"/>&#160;'+i18n.LblDataTypes;
i18n.TabSpecTypes = '<span class="glyphicon glyphicon-cog"/>&#160;'+i18n.LblObjectTypes;
i18n.TabObjectTypes = '<span class="glyphicon glyphicon-cog"/>&#160;'+i18n.LblObjectTypes;
i18n.TabRelationTypes = '<span class="glyphicon glyphicon-cog"/>&#160;'+i18n.LblRelationTypes;
i18n.TabRelGroupTypes = '<span class="glyphicon glyphicon-cog"/>&#160;'+i18n.LblRelGroupTypes;
i18n.TabSpecificationTypes = '<span class="glyphicon glyphicon-cog"/>&#160;'+i18n.LblSpecificationTypes;
i18n.TabRifTypes = '<span class="glyphicon glyphicon-cog"/>&#160;'+i18n.LblRifTypes;
i18n.TabTable = '<span class="glyphicon glyphicon-th"/>&#160;Tabelle';
i18n.TabDocument = '<span class="glyphicon glyphicon-book"/>&#160;Dokument';
i18n.TabFind = '<span class="glyphicon glyphicon-search"/>&#160;Suche';
i18n.TabFilter = i18n.IcoFilter+'&#160;Filter';
i18n.TabPage = '<span class="glyphicon glyphicon-file"/>&#160;Seite';
i18n.TabRevisions = '<span class="glyphicon glyphicon-grain"/>&#160;Revisionen';
i18n.TabTimeline = '<span class="glyphicon glyphicon-film"/>&#160;Zeitleiste';
i18n.TabRelations = '<span class="glyphicon glyphicon-link"/>&#160;Aussagen';
i18n.TabSort = '<span class="glyphicon glyphicon-magnet"/>&#160;Sortieren';
i18n.TabAttachments = '<span class="glyphicon glyphicon-paperclip"/>&#160;Bilder und Dateien';
i18n.TabComments = '<span class="glyphicon glyphicon-comment"/>&#160;Kommentare';
i18n.TabReports = '<span class="glyphicon glyphicon-stats"/>&#160;Berichte';

// Functions:
i18n.FnProjectCreate = '<span class="glyphicon glyphicon-plus"/>&#160;Projekt';
i18n.FnProjectImport = '<span class="glyphicon glyphicon-import"/>&#160;Projekt importieren';
//i18n.FnImportReqif = '<span class="glyphicon glyphicon-import"/>&#160;ReqIF importieren';
//i18n.FnImportCsv = '<span class="glyphicon glyphicon-import"/>&#160;CSV importieren';
//i18n.FnImportXls = '<span class="glyphicon glyphicon-import"/>&#160;XLS importieren';
//i18n.FnProjectFromTemplate = '<span class="glyphicon glyphicon-plus"/>&#160;Neues Projekt von Vorlage erstellen';
i18n.FnRefresh = '<span class="glyphicon glyphicon-refresh"/>&#160;Aktualisieren';
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
i18n.ReqIF_ChangeDescription = 'änderungs-Beschreibung';
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
i18n.DC_type =
i18n.dcterms_type = "Element-Typ";
i18n.DC_creator =
i18n.dcterms_creator = "Autor";
i18n.dcterms_source = "Quelle";
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
i18n.oslc_rm_validates = "validiert";
i18n.oslc_rm_validatedBy = "wird validiert von";
//i18n.oslc_rm_decomposes = "ist Bestandteil von";
//i18n.oslc_rm_decomposedBy = "besteht aus";
//i18n.oslc_rm_constrainedBy = "";
//i18n.oslc_rm_constrains = "";
// SpecIF entity, relation and attribute names
i18n.SpecIF_Heading = "überschrift";
i18n.SpecIF_Headings = "überschriften";
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
i18n.FMC_Plans = "Pläne";
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
i18n.FMC_States = "Zustände";
i18n.FMC_Event = "Ereignis";
i18n.FMC_Events = "Ereignisse";
i18n.SpecIF_Feature = "Merkmal";
i18n.SpecIF_Features = "Merkmale";
i18n.SpecIF_Requirement =
i18n.IREB_Requirement = "Anforderung";
i18n.SpecIF_Requirements = 
i18n.IREB_Requirements = "Anforderungen";
i18n.SpecIF_BusinessProcess = 'Geschäftsprozess'; 
i18n.SpecIF_BusinessProcesses = 'Geschäftsprozesse';
i18n.SpecIF_Rationale = "Motivation";
i18n.SpecIF_Note = "Anmerkung";
i18n.SpecIF_Notes = "Anmerkungen";
i18n.SpecIF_Comment = "Kommentar";
i18n.SpecIF_Comments = "Kommentare";
i18n.SpecIF_Issue = "Offener Punkt";
i18n.SpecIF_Issues = "Offene Punkte";
i18n.SpecIF_Outline =
i18n.SpecIF_Hierarchy = "Gliederung";
i18n.SpecIF_Outlines =
i18n.SpecIF_Hierarchies = "Gliederungen";
i18n.SpecIF_Glossary = "Modellelemente (Glossar)";
i18n.SpecIF_Annotations = "Annotationen";
i18n.SpecIF_Vote = "Wertung";
i18n.SpecIF_Votes = "Wertungen";
i18n.SpecIF_Effort = "Aufwand";
i18n.SpecIF_Risk = 
i18n.IREB_Risk = "Risiko";
i18n.SpecIF_Benefit = "Nutzen";
i18n.SpecIF_Damage = "Schaden";
i18n.SpecIF_Probability = "Wahrscheinlichkeit";
i18n.SpecIF_shows = "zeigt";
i18n.SpecIF_contains = "enthält";
i18n.oslc_rm_satisfiedBy = "wird erfüllt von";;
i18n.oslc_rm_satisfies = 
i18n.SpecIF_satisfies =
i18n.IREB_satisfies = "erfüllt";
i18n.SpecIF_implements = "realisiert";
i18n.SpecIF_modifies =
i18n.SpecIF_stores = "schreibt und liest";
i18n.SpecIF_reads = "liest";
i18n.SpecIF_writes = "schreibt";
i18n.SpecIF_sendsTo = "sendet an";
i18n.SpecIF_receivesFrom = "empfängt von";
i18n.SpecIF_influences = "beeinflusst";
i18n.SpecIF_follows = "folgt auf";
i18n.SpecIF_precedes = "ist Vorgänger von";
i18n.SpecIF_signals = "signalisiert";
i18n.SpecIF_triggers = "löst aus";
i18n.SpecIF_dependsOn = "hängt ab von";
i18n.SpecIF_refines = 
i18n.IREB_refines = "verfeinert";
i18n.IREB_refinedBy = "wird verfeinert von";
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
i18n.SpecIF_includes = "schließt ein";
i18n.SpecIF_excludes = "schließt aus";
i18n.SpecIF_mentions = "erwähnt"; 
i18n.SpecIF_sameAs =
i18n.owl_sameAs = "ist identisch mit";
i18n.SpecIF_Id = i18n.LblIdentifier;
i18n.SpecIF_Type = i18n.LblType;
i18n.SpecIF_Notation = "Notation";
//i18n.SpecIF_Stereotype = 
//i18n.SpecIF_SubClass = "Unterklasse";
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
i18n.IR_approves = "unterstützt";
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
i18n.MsgConfirm = 'Bitte bestätigen:';
i18n.MsgConfirmDeletion = "'~A' löschen?";
i18n.MsgConfirmObjectDeletion = "Ressource '<b>~A</b>' löschen?";
i18n.MsgConfirmUserDeletion = "Nutzer '<b>~A</b>' löschen?";
i18n.MsgConfirmProjectDeletion = "Projekt '<b>~A</b>' löschen?";
i18n.MsgConfirmSpecDeletion = "Gliederung '<b>~A</b>' mit allen Verweisen löschen?";
i18n.MsgConfirmRoleDeletion = "Rolle '<b>~A</b>' löschen?";
i18n.MsgConfirmFolderDeletion = "Ordner '<b>~A</b>' löschen?";
i18n.MsgInitialLoading = 'Lade den Index für flottere Navigation ... ';
i18n.MsgNoProject = 'Kein Projekt gefunden.';
i18n.MsgNoUser = 'Keinen Nutzer gefunden.';
i18n.MsgNoObject = 'Keine Ressource gewählt.';
i18n.MsgOtherProject = "Verspätete Antwort; inzwischen wurde ein anderes Projekt gewählt.";
i18n.MsgWaitPermissions = 'Rechte werden geladen - es ist gleich soweit.';
i18n.MsgImportReqif = 'Zulässige Dateitypen sind *.reqifz, *.reqif, *.zip und *.xml. Inhalte müssen den Schemata für ReqIF 1.0+, RIF 1.1a oder RIF 1.2 entsprechen. Der Import dauert meist einige Sekunden und bei sehr großen Dateien mehrere Minuten.';
i18n.MsgImportSpecif = 'Zulässige Dateitypen sind *.specifz und *.specif. Inhalte müssen den Schemata für SpecIF 0.10.4+ entsprechen. Bei großen Dateien kann der Import einige Minuten dauern.';
i18n.MsgImportBpmn = 'Zulässiger Dateityp *.bpmn. Inhalte müssen den Schemata für BPMN 2.0 XML entsprechen. Der Import kann bis zu einigen Minuten dauern.';
i18n.MsgImportXls = 'Zulässige Dateitypen sind *.xls, *.xlsx und *.csv. Der Import kann bei sehr großen Dateien mehrere Minuten dauern.';
i18n.MsgExport = 'Es wird eine zip-gepackte Datei im gewählten Format erzeugt. Der Export dauert meist einige Sekunden und im Falle sehr großer Dateien mehrere Minuten; Ihr Browser wird die Datei gemäß Voreinstellungen speichern.';
i18n.MsgLoading = 'Lade soeben ...';
i18n.MsgSearching = 'Suche weiter ...';
i18n.MsgObjectsProcessed = '~A Ressourcen analysiert.';
i18n.MsgObjectsFound = '~A Ressourcen gefunden.';
i18n.MsgNoMatchingObjects = 'Keine Ressource gefunden.';
i18n.MsgNoRelatedObjects = 'Zu dieser Ressource gibt es keine Aussagen.';
i18n.MsgNoComments = 'Zu dieser Ressource gibt es keine Kommentare.';
i18n.MsgNoFiles = 'Keine Datei gefunden.';
i18n.MsgAnalyzing = 'Setze Analyse fort ...';
i18n.MsgNoReports = 'Keine Auswertungen für dieses Projekt.';
i18n.MsgTypeNoObjectType = "Mindestens einen Ressource-Typ anlegen, sonst können keine Ressourcen erzeugt werden.";
i18n.MsgTypeNoAttribute = "Mindestens ein Attribut anlegen, sonst ist der Typ nicht brauchbar.";
i18n.MsgNoObjectTypeForManualCreation = "Es können keine Ressourcen angelegt werden, weil entweder keine Rechte eingeräumt sind oder weil kein Ressouce-Typ für manuelles Anlegen vorgesehen ist.";
i18n.MsgFilterClogged = 'Filter ist undurchlässig - mindestens ein Kriterium ist nicht erfüllbar.';
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
i18n.MsgFileApiNotSupported = 'Dieser Browser unterstützt nicht den Zugriff auf Dateien. Bitte wählen Sie einen aktuellen Browser.';
i18n.MsgDoNotLoadAllObjects = 'Es ist nicht zu empfehlen alle Ressourcen in einem Aufruf zu laden.';
i18n.MsgReading = "Lesen";
i18n.MsgCreating = "Anlegen";
i18n.MsgUploading = "übertragen";
i18n.MsgImporting = "Importieren";
i18n.MsgBrowserSaving = "Ihr Browser speichert die Datei gemäß Voreinstellungen.";
i18n.MsgSuccess = "Erfolgreich!";
i18n.MsgSelectImg = "Wählen oder laden Sie ein Bild:";
i18n.MsgImgWidth = "Bildbreite [px]";
i18n.MsgNoEligibleRelTypes = "Keine Aussage-Typen für diesen Ressource-Typ definiert.";
i18n.MsgClickToNavigate = "Eine Ressource doppelt klicken, um dorthin zu navigieren:";
i18n.MsgClickToDeleteRel = "Eine Ressource doppelt klicken, um die betreffende Aussage zu löschen:";
i18n.MsgNoSpec = "Keine Gliederung gefunden."
i18n.MsgTypesCommentCreated = 'Die Typen für Kommentare wurden angelegt.';
i18n.MsgOutlineAdded = 'Gliederung wurde oben hinzu gefügt - bitte konsolidieren Sie die bestehende und die neue manuell.';
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
i18n.Err403Forbidden = 'Kein Zugriffsrecht für Ihre Rolle.';
i18n.Err403NoProjectFolder = 'Mindestens ein Projekt im gewählten Baum dürfen Sie nicht ändern.';
//i18n.Err403NoProjectUpdate = 'Ihre Rolle erlaubt nicht das Aktualisieren des Projekts.';
i18n.Err403NoProjectDelete = 'Ihre Rolle erlaubt nicht das Löschen des Projekts.';
i18n.Err403NoUserDelete = 'Ihre Rolle erlaubt nicht das Löschen von Nutzern.';
i18n.Err403NoRoleDelete = 'Ihre Berechtigungen erlauben nicht das Löschen von Rollen.';
i18n.Err404NotFound = "Element nicht gefunden; es wurde vermutlich gelöscht.";
i18n.ErrNoItem = "Element '~A' nicht gefunden.";
i18n.ErrNoObject = "Ressource '~A' nicht gefunden; es wurde vermutlich gelöscht.";
i18n.ErrNoSpec = "Dieses Projekt hat keine Gliederung; es muss mindestens eine angelegt werden.";
i18n.ErrInvalidFile = 'Ungültige oder unzulässige Datei.';
i18n.ErrInvalidFileType = "'~A' hat einen unzulässigen Dateityp.";
i18n.ErrInvalidAttachment = "Unzulässiger Dateityp. Wählen Sie bitte unter ~A.";
i18n.ErrInvalidFileReqif = "'~A' hat einen unzulässigen Dateityp. Wählen Sie '*.reqifz', '*.reqif', '*.zip' oder '*.xml'.";
i18n.ErrInvalidFileSpecif = "'~A' hat einen unzulässigen Dateityp. Wählen Sie '*.specifz' oder '*.specif'.";
i18n.ErrInvalidFileBpmn = "'~A' hat einen unzulässigen Dateityp. Wählen Sie '*.bpmn'.";
i18n.ErrInvalidFileXls = "'~A' hat einen unzulässigen Dateityp. Wählen Sie '*.xlsx', '*.xls', oder '*.csv'.";
//i18n.ErrInvalidFileElic = "'~A' hat einen unzulässigen Dateityp. Wählen Sie '*.elic_signed.xml'.";
i18n.ErrUpload = 'Fehler beim Dateitransfer zum Server.';
i18n.ErrImport = "Fehler beim Import.";
i18n.ErrImportTimeout = 'Zeitüberschreitung beim Import.';
i18n.ErrCommunicationTimeout = 'Zeitüberschreitung bei Server-Anfrage.';
i18n.ErrInvalidData = 'Ungültige oder schädliche Daten.';
i18n.ErrInvalidContent = 'Ungültige Daten; sehr wahrscheinlich XHTML-Strukturfehler oder schädlicher Inhalt.';
i18n.ErrInvalidRoleName = "'~A' ist ein ungültiger Rollenname.";
i18n.ErrUpdateConflict = "Ihre Aktualisierung ist im Konflikt mit einer zwischenzeitlichen änderung eines anderen Nutzers.";
i18n.ErrInconsistentPermissions = "Berechtigungen sind widersprüchlich, bitte wenden Sie sich an einen Administrator.";
i18n.ErrObjectNotEligibleForRelation = "Diese Ressourcen können nicht mit der gewählten Aussage verknüpft werden.";
i18n.Err400TypeIsInUse = "Dieser Typ kann nicht gelöscht werden, weil er bereits verwendet wird."
i18n.Err402InsufficientLicense = "Die hinterlegte Lizenz reicht nicht für diese Operation.";

i18n.monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'October', 'November', 'Dezember' ];
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
i18n.LblSupport = 'Unterstützung';
i18n.AppHome = i18n.IcoHome+'&#160;'+i18n.LblHome;
i18n.AppSystemAdministration = i18n.IcoSystemAdministration+'&#160;Interaktives Lastenheft: '+i18n.LblSystemAdministration;
i18n.AppUserAdministration = i18n.IcoUserAdministration+'&#160;Interaktives Lastenheft: '+i18n.LblUserAdministration;
i18n.AppProjectAdministration = i18n.IcoProjectAdministration+'&#160;Interaktives Lastenheft: '+i18n.LblProjectAdministration;
i18n.AppSpecifications = i18n.IcoSpecifications+'&#160;Interaktives Lastenheft: '+i18n.LblSpecifications;
i18n.AppReader = i18n.IcoReader+'&#160;'+i18n.LblReader;
i18n.AppImport = i18n.IcoImport+'&#160;Import';
i18n.AppLocal = i18n.IcoSpecifications+'&#160;'+i18n.LblLocal;
i18n.AppSupport = i18n.IcoSupport+'&#160;'+i18n.LblSupport;
