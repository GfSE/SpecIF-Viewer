/* 	Provide i18ns and messages in a certain language, in this case 'Deutsch' (de).
	The result can be obtained by reference of:
	- yourVarName.MsgText (in most cases, when there are only characters allowed for js variable names)
	- yourVarName.lookup('MsgName', 'param')
	- In the messages defined below, '~A' can be inserted at the location where a call parameter shall be placed.
*/
function LanguageTextsDe() {
    var self:any = {};
	self.lookup = function( lb:string, pA:string ):string { 
		// replace a variable '~A' with pA, if available:
		if (lb) {
			// jsIdOf(): first replace '.' '-' '(' ')' and white-space by '_'
			let res = self[jsIdOf(lb)] || lb;
            if (pA) return res.replace(/~A/, pA);
            return res;
		};
		return '';
	};

	self.IcoUser = '<span class="glyphicon glyphicon-user"></span>';
	self.IcoSpecification = '<span class="glyphicon glyphicon-book"></span>';
//	self.IcoReadSpecification = '<span class="glyphicon glyphicon-eye-open"></span>';
//	self.IcoUpdateSpecification = '<span class="glyphicon glyphicon-pencil"></span>';
//	self.IcoRead = '<span class="glyphicon glyphicon-eye-open"></span>';
	self.IcoImport = '<span class="glyphicon glyphicon-import"></span>';
	self.IcoExport = '<span class="glyphicon glyphicon-export"></span>';
	self.IcoAdminister = '<span class="glyphicon glyphicon-wrench"></span>';
	self.IcoUpdate = '<span class="glyphicon glyphicon-pencil"></span>';
	self.IcoDelete = '<span class="glyphicon glyphicon-remove"></span>';
	self.IcoAdd = '<span class="glyphicon glyphicon-plus"></span>';
	self.IcoClone = '<span class="glyphicon glyphicon-duplicate"></span>';
	self.IcoPrevious = '<span class="glyphicon glyphicon-chevron-up"></span>';
	self.IcoNext = '<span class="glyphicon glyphicon-chevron-down"></span>';
	self.IcoGo = '<span class="glyphicon glyphicon-search"></span>';
	self.IcoFilter = '<span class="glyphicon glyphicon-filter"></span>';
	self.IcoComment = '<span class="glyphicon glyphicon-comment"></span>';
	self.IcoURL = '<span class="glyphicon glyphicon-map-marker"></span>';
	self.IcoLogout = '<span class="glyphicon glyphicon-log-out"></span>';
	self.IcoAbout = '<strong>&#169;</strong>'; // copyright sign

// Buttons:
//	self.LblImportReqif = 'ReqIF Import';
//	self.LblImportCsv = 'CSV Import';
//	self.LblImportXls = 'XLS Import';
//	self.LblExportPdf = 'PDF Export';
	self.LblAll = "Alle";
	self.LblAllObjects = "Alle Ressourcen";
	self.LblImport = 'Importieren';
	self.LblExport = 'Exportieren';
	self.LblExportReqif = 'ReqIF-Datei exportieren';
	self.LblExportSpecif = 'SpecIF-Datei exportieren';
	self.LblAdminister = 'Administrieren';
	self.LblCreate ="Anlegen";
	self.LblRead = 'Lesen';
	self.LblUpdate = 'Aktualisieren';
	self.LblUpdateProject = 'Projekt-Eigenschaften aktualisieren';
	self.LblUpdateSpec = 'Gliederungs-Eigenschaften aktualisieren';
	self.LblUpdateTypes = 'Typen und Rechte aktualisieren';
	self.LblUpdateObject = 'Diese Ressource aktualisieren';
	self.LblDelete = 'Löschen';
	self.LblDeleteProject = 'Dieses Projekt löschen';
	self.LblDeleteType = 'Diesen Typ löschen';
	self.LblDeleteObject = 'Diese Ressource löschen';
	self.LblDeleteAttribute = 'Dieses Attribut löschen';
	self.LblDeleteRelation = 'Diese Aussage löschen';
	self.LblDeleteRole = 'Rolle löschen';
	self.LblAdd = 'Anlegen';
	self.LblAddItem = '~A anlegen';
	self.LblAddProject = "Projekt anlegen";
	self.LblAddType = "Typ anlegen";
	self.LblAddDataType = 'Datentyp anlegen';
	self.LblAddObjType = 'Ressource-Typ anlegen';
	self.LblAddRelType = 'Aussage-Typ anlegen';
	self.LblAddSpcType = 'Gliederungs-Typ anlegen';
	self.LblAddTypeComment = 'Typen für Kommentare anlegen';
	self.LblAddObject = "Ressource anlegen";
	self.LblAddRelation = "Aussage anlegen";
	self.LblAddAttribute = "Attribut anlegen";
	self.LblAddUser = "Nutzer anlegen";
	self.LblAddComment = 'Kommentieren';
	self.LblAddCommentTo = "Einen Kommentar zu '~A' hinzufügen:";
	self.LblAddCommentToObject = 'Diese Ressource kommentieren';
	self.LblAddFolder = "Ordner anlegen";
	self.LblAddSpec = "Gliederung anlegen";
	self.LblClone = 'Klonen';
	self.LblCloneObject = 'Diese Ressource klonen';
	self.LblCloneType = 'Diesen Typ klonen';
	self.LblCloneSpec = 'Diese Gliederung klonen';
	self.LblUserName = 'Nutzername';
	self.LblPassword = 'Kennwort';
	self.LblTitle = 'Titel';
	self.LblProject = 'Projekt';
	self.LblName = 'Name';
	self.LblFirstName = 'Vorname';
	self.LblLastName = 'Nachname';
	self.LblOrganizations = 'Organisation';  // until multiple orgs per user are supported
	self.LblEmail = 'e-mail';
	self.LblFileName = 'Dateiname';
	self.LblRoleGeneralAdmin = 'GENERAL-ADMIN';
	self.LblRoleProjectAdmin = 'PROJECT-ADMIN';
	self.LblRoleUserAdmin = 'USER-ADMIN';
	self.LblRoleReader = 'READER';
//	self.LblRoleReqif = 'REQIF';
	self.LblGlobalActions = 'Aktionen';
	self.LblItemActions = 'Aktionen';
	self.LblIdentifier = 'Identifikator';
	self.LblProjectName = 'Projektname';
	self.LblDescription = 'Beschreibung';
	self.LblState = 'Status';
	self.LblPriority = 'Priorität';
	self.LblCategory = 'Kategorie';
	self.LblAttribute = 'Attribut';
	self.LblAttributes = 'Attribute';
	self.LblAttributeValueRange = "Wertebereich";
	self.LblAttributeValues = "Werte";
	self.LblAttributeValue = "Wert";
	self.LblTool = 'Autoren-Werkzeug';
	self.LblMyRole = 'Meine Rolle';
	self.LblRevision = 'Revision';
	self.LblCreatedAt = 'Erstellt am';
	self.LblCreatedBy = 'Erstellt von';
	self.LblCreatedThru = 'Erstellt durch';
	self.LblModifiedAt = 'Geändert am';
	self.LblModifiedBy = 'Geändert von';
	self.LblProjectDetails = 'Eigenschaften';
	self.LblProjectUsers = '<span class="glyphicon glyphicon-user"></span>&#160;Nutzer dieses Projekts';
	self.LblOtherUsers = 'Andere Nutzer';
	self.LblUserProjects = '<span class="glyphicon glyphicon-book"></span>&#160;Projekte dieses Nutzers';
	self.LblOtherProjects = 'Andere Projekte';
	self.LblType = 'Typ';
	self.LblTypes = 'Typen';
	self.LblDataTypes = 'Datentypen';
	self.LblDataType = 'Datentyp';
	self.LblDataTypeTitle = 'Datentyp-Name';
	self.LblSpecTypes = 'Typen';
	self.LblSpecType = 'Typ';
	self.LblResourceClasses = 'Ressource-Klassen';
	self.LblResourceClass = 'Ressource-Klasse';
	self.LblStatementClasses = 'Aussage-Klassen';
	self.LblStatementClass = 'Aussage-Klasse';
//	self.LblRelGroupTypes = 'Aussagegruppen-Typen';
//	self.LblRelGroupType = 'Aussagegruppen-Typ';
	self.LblSpecificationTypes = 'Gliederungs-Typen';
	self.hierarchyType = 
	self.LblSpecificationType = 'Gliederungs-Typ';
//	self.LblRifTypes = 'Typen';
//	self.rifType = 
//	self.LblRifType = 'Typ';
	self.LblSpecTypeTitle = 'Name';
	self.LblAttributeTitle = 'Attribut-Name';
	self.LblSecondaryFiltersForObjects = 	self.IcoFilter+"&#160;Facetten-Filter für '~A'";
	self.LblPermissions = 'Rechte';
	self.LblRoles = 'Rollen';
	self.LblFormat = 'Format';
	self.LblOptions = 'Optionen';
	self.LblFileFormat = 'Dateiformat';
	self.modelElements = 'Modell-Elemente';
	self.withOtherProperties = 'mit weiteren Eigenschaften';
	self.withStatements = 'mit Aussagen';
	self.LblStringMatch = '<span class="glyphicon glyphicon-text-background" ></span>&#160;Textsuche';
	self.LblWordBeginnings = 'Nur Wortanfänge berücksichtigen';
	self.LblWholeWords = 'Nur ganze Worte berücksichtigen';
	self.LblCaseSensitive = 'Groß/Kleinschreibung beachten';
	self.LblExcludeEnums = 'Auswahlwerte übergehen';
	self.LblNotAssigned = '(ohne zugewiesenen Wert)';
	self.LblPrevious = 'Voriges';
	self.LblNext = 'Nächstes';
	self.LblPreviousStep = 'Zurück';
	self.LblNextStep = 'Weiter';
	self.LblGo = 'Los!';
	self.LblHitCount = 'Trefferzahl';
	self.LblRelateAs = 'Verknüpfen als';
	self.LblSource = 'Subjekt';
	self.LblTarget = 'Objekt';
	self.LblEligibleSources = "Zulässige Ressourcen als "+	self.LblSource;
	self.LblEligibleTargets = "Zulässige Ressourcen als "+	self.LblTarget;
	self.LblSaveRelationAsSource = 'Ressource als '+	self.LblSource+' verknüpfen';
	self.LblSaveRelationAsTarget = 'Ressource als '+	self.LblTarget+' verknüpfen';
	self.LblIcon = 'Symbol';
	self.LblCreation = 'Anzulegen';
	self.LblCreateLink1 = "&#x2776;&#160;Gewünschter Aussage-Typ";
	self.LblCreateLink2 = "&#x2777;&#160;Zu verknüpfende Ressource";
	self.LblReferences = "Referenzen";
	self.LblInherited = "Geerbt";
	self.LblMaxLength = "Max. Länge";
	self.LblMinValue = "Min. Wert";
	self.LblMaxValue = "Max. Wert";
	self.LblAccuracy = "Dezimalstellen";
	self.LblEnumValues = "Werte (kommagetr.)";
	self.LblSingleChoice = "Einfach-Auswahl";
	self.LblMultipleChoice = "Mehrfach-Auswahl";
	self.LblDirectLink = "Direktverweis";

	self.BtnLogin = '<span class="glyphicon glyphicon-log-in"></span>&#160;Anmelden';
	self.BtnLogout = '<span class="glyphicon glyphicon-log-out"></span>&#160;Abmelden';
	self.BtnProfile = 'Profil';
	self.BtnBack = 'Zurück';
	self.BtnCancel = 'Abbrechen';
	self.BtnCancelImport = 'Abbrechen';
	self.BtnApply = 'Anwenden';
	self.BtnDelete = '<span class="glyphicon glyphicon-remove"></span>&#160;Löschen';
	self.BtnDeleteObject = '<span class="glyphicon glyphicon-remove"></span>&#160;Ressource mit Referenzen löschen';
	self.BtnDeleteObjectRef = '<span class="glyphicon glyphicon-remove"></span>&#160;Diesen Verweis löschen';
	self.BtnImport = '<span class="glyphicon glyphicon-import"></span>&#160;Import';
	self.BtnCreate = '<span class="glyphicon glyphicon-import"></span>&#160;Anlegen';
	self.BtnReplace = '<span class="glyphicon glyphicon-import"></span>&#160;Ersetzen';
	self.BtnAdopt = '<span class="glyphicon glyphicon-import"></span>&#160;Adoptieren'; //Aneignen
	self.BtnUpdate = '<span class="glyphicon glyphicon-import"></span>&#160;'+	self.LblUpdate;
//	self.BtnImportSpecif = '<span class="glyphicon glyphicon-import"></span>&#160;SpecIF';
//	self.BtnImportReqif = '<span class="glyphicon glyphicon-import"></span>&#160;ReqIF';
//	self.BtnImportXls = '<span class="glyphicon glyphicon-import"></span>&#160;xlsx';
//	self.BtnProjectFromTemplate = "Projekt mit ReqIF-Vorlage anlegen";
	self.BtnRead = '<span class="glyphicon glyphicon-eye-open"></span>&#160;Lesen';
	self.BtnExport = '<span class="glyphicon glyphicon-export"></span>&#160;Export';
//	self.BtnExportSpecif = '<span class="glyphicon glyphicon-export"></span>&#160;SpecIF';
//	self.BtnExportReqif = '<span class="glyphicon glyphicon-export"></span>&#160;ReqIF';
	self.BtnAdd = '<span class="glyphicon glyphicon-plus"></span>&#160;Neu';
	self.BtnAddUser = '<span class="glyphicon glyphicon-plus"></span>&#160;Nutzer';
	self.BtnAddProject = '<span class="glyphicon glyphicon-plus"></span>&#160;'+	self.LblProject;
	self.BtnAddSpec = '<span class="glyphicon glyphicon-plus"></span>&#160;Gliederung';
	self.BtnAddFolder = '<span class="glyphicon glyphicon-plus"></span>&#160;Ordner';
	self.BtnAddAttribute = '<span class="glyphicon glyphicon-plus"></span>&#160;Attribut';
	self.BtnAddTypeComment = '<span class="glyphicon glyphicon-plus"></span>&#160;Klassen für Kommentare';
	self.BtnClone = '<span class="glyphicon glyphicon-duplicate"></span>&#160;Klonen';
	self.BtnEdit = '<span class="glyphicon glyphicon-pencil"></span>&#160;Bearbeiten';
	self.BtnSave = '<span class="glyphicon glyphicon-save"></span>&#160;Speichern';
	self.BtnSaveRole = '<span class="glyphicon glyphicon-save"></span>&#160;Rolle anlegen';
	self.BtnSaveAttr = '<span class="glyphicon glyphicon-save"></span>&#160;Attribut anlegen';
	self.BtnInsert = '<span class="glyphicon glyphicon-save"></span>&#160;Einfügen';
	self.BtnInsertSuccessor = '<span class="glyphicon glyphicon-save"></span>&#160;Einfügen hinter';
	self.BtnInsertChild = '<span class="glyphicon glyphicon-save"></span>&#160;Einfügen unter';
	self.BtnSaveRelation = '<span class="glyphicon glyphicon-save"></span>&#160;Aussage anlegen';
	self.BtnSaveItem = '<span class="glyphicon glyphicon-save"></span>&#160;~A anlegen';
	self.BtnDetails = 'Details';
	self.BtnAddRole = '<span class="glyphicon glyphicon-plus" ></span>&#160;Rolle';
	self.BtnFileSelect = '<span class="glyphicon glyphicon-plus" ></span>&#160;Datei auswählen ...';
	self.BtnPrevious = '<span class="glyphicon glyphicon-chevron-up"></span>&#160;'+	self.LblPrevious;
	self.BtnNext = '<span class="glyphicon glyphicon-chevron-down"></span>&#160;'+	self.LblNext;
	self.BtnGo = 	self.IcoGo+'&#160;'+	self.LblGo;
	self.BtnFilterReset = 	self.IcoFilter+'&#160;Neu';
	self.BtnSelectHierarchy = "Gliederung auswählen";

// Tabs:
	self.TabAll = '<span class="glyphicon glyphicon-list"></span>';
	self.TabUserList = '<span class="glyphicon glyphicon-list"></span>&#160;Nutzer';
	self.TabProjectList = '<span class="glyphicon glyphicon-list"></span>&#160;Projekte';
//	self.TabProjectDetails = '<span class="glyphicon glyphicon-pencil"></span>&#160;Meta';
	self.TabUserDetails = '<span class="glyphicon glyphicon-pencil"></span>&#160;Meta';
	self.TabProjectUsers = '<span class="glyphicon glyphicon-user"></span>&#160;Nutzer';
	self.TabUserProjects = '<span class="glyphicon glyphicon-book"></span>&#160;Projekte';
	self.TabPermissions = '<span class="glyphicon glyphicon-lock"></span>&#160;Rechte';
	self.TabTypes = '<span class="glyphicon glyphicon-cog"></span>&#160;'+	self.LblTypes;
	self.TabDataTypes = '<span class="glyphicon glyphicon-cog"></span>&#160;'+	self.LblDataTypes;
	self.TabSpecTypes = '<span class="glyphicon glyphicon-cog"></span>&#160;'+	self.LblResourceClasses;
	self.TabObjectTypes = '<span class="glyphicon glyphicon-cog"></span>&#160;'+	self.LblResourceClasses;
	self.TabRelationTypes = '<span class="glyphicon glyphicon-cog"></span>&#160;'+	self.LblRelationTypes;
//	self.TabRelGroupTypes = '<span class="glyphicon glyphicon-cog"></span>&#160;'+	self.LblRelGroupTypes;
	self.TabSpecificationTypes = '<span class="glyphicon glyphicon-cog"></span>&#160;'+	self.LblSpecificationTypes;
//	self.TabRifTypes = '<span class="glyphicon glyphicon-cog"></span>&#160;'+	self.LblRifTypes;
	self.TabTable = '<span class="glyphicon glyphicon-th"></span>&#160;Tabelle';
	self.TabDocument = '<span class="glyphicon glyphicon-book"></span>&#160;Dokument';
	self.TabFind = '<span class="glyphicon glyphicon-search"></span>&#160;Suche';
	self.TabFilter = 	self.IcoFilter+'&#160;Filter';
	self.TabPage = '<span class="glyphicon glyphicon-file"></span>&#160;Seite';
	self.TabRevisions = '<span class="glyphicon glyphicon-grain"></span>&#160;Revisionen';
	self.TabTimeline = '<span class="glyphicon glyphicon-film"></span>&#160;Zeitleiste';
	self.TabRelations = '<span class="glyphicon glyphicon-link"></span>&#160;Aussagen';
	self.TabSort = '<span class="glyphicon glyphicon-magnet"></span>&#160;Sortieren';
	self.TabAttachments = '<span class="glyphicon glyphicon-paperclip"></span>&#160;Bilder und Dateien';
	self.TabComments = '<span class="glyphicon glyphicon-comment"></span>&#160;Kommentare';
	self.TabReports = '<span class="glyphicon glyphicon-stats"></span>&#160;Berichte';

// Functions:
	self.FnProjectCreate = '<span class="glyphicon glyphicon-plus"></span>&#160;Projekt';
	self.FnProjectImport = '<span class="glyphicon glyphicon-import"></span>&#160;Projekt importieren';
//	self.FnImportReqif = '<span class="glyphicon glyphicon-import"></span>&#160;ReqIF importieren';
//	self.FnImportCsv = '<span class="glyphicon glyphicon-import"></span>&#160;CSV importieren';
//	self.FnImportXls = '<span class="glyphicon glyphicon-import"></span>&#160;XLS importieren';
//	self.FnProjectFromTemplate = '<span class="glyphicon glyphicon-plus"></span>&#160;Neues Projekt von Vorlage erstellen';
	self.FnRefresh = '<span class="glyphicon glyphicon-refresh"></span>&#160;Aktualisieren';
	self.FnRead = '<span class="glyphicon glyphicon-eye-open"></span>';
	self.FnOpen = 	self.FnRead;
	self.FnUpdate = '<span class="glyphicon glyphicon-wrench"></span>';
	self.FnDelete = '<span class="glyphicon glyphicon-remove"></span>';
	self.FnRemove = 	self.FnDelete;

// ReqIF attribute names (replace any '.' by '_', so 'ReqIF.Text' becomes 'ReqIF_Text ):
	self.ReqIF_ForeignID = 'ID';
	self.ReqIF_ChapterName = 'Titel';
	self.ReqIF_Name = 'Titel';
	self.ReqIF_Text = 'Text';
	self.ReqIF_ForeignCreatedOn = 	self.LblCreatedAt;
	self.ReqIF_ForeignCreatedBy = 	self.LblCreatedBy;
	self.ReqIF_ForeignCreatedThru = 	self.LblCreatedThru;
	self.ReqIF_ForeignModifiedOn = 	self.LblModifiedAt;
	self.ReqIF_ForeignModifiedBy = 	self.LblModifiedBy;
	self.ReqIF_Revision = 	self.LblRevision;
	self.ReqIF_Description = 	self.LblDescription;
	self.ReqIF_ChangeDescription = 'änderungs-Beschreibung';
	self.ReqIF_Project = 	self.LblProject;
	self.ReqIF_ForeignState = 	self.LblState;
	self.ReqIF_Category = 	self.LblCategory;
	self.ReqIF_Prefix = 'Prefix';
	self.ReqIF_FitCriteria = 'Abnahme-Kriterium';
	self.ReqIF_AssociatedFiles = 'Dateien';
	self.ReqIF_ChapterNumber = 'Kapitelnummer';   // shouldn't be used, as an object cannot (should not) know its position in the outline
// Dublin Core (DCMI) attribute names:
	self.DC_title =
	self.dcterms_title = "Titel";
	self.DC_description =
	self.dcterms_description = "Beschreibung";
	self.DC_identifier =
	self.dcterms_identifier = self.LblIdentifier;
	self.DC_type =
	self.dcterms_type = "Element-Typ";
	self.DC_creator =
	self.dcterms_creator = "Autor";
	self.DC_source =
	self.dcterms_source = "Quelle";
	self.DC_subject =
	self.dcterms_subject = "Stichworte";
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
	self.oslc_rm_implements = "realisiert";
	self.oslc_rm_implementedBy = "wird realisiert von";
	self.oslc_rm_validates = "validiert";
	self.oslc_rm_validatedBy = "wird validiert von";
//	self.oslc_rm_decomposes = "ist Bestandteil von";
//	self.oslc_rm_decomposedBy = "besteht aus";
//	self.oslc_rm_constrainedBy = "";
//	self.oslc_rm_constrains = "";
// SpecIF entity, relation and attribute names
	self.SpecIF_Heading = "Überschrift";
	self.SpecIF_Headings = "Überschriften";
	self.SpecIF_HeadingDescription = self.SpecIF_Heading+"' hat einen Titel für Kapitel mit optionaler Beschreibung.";
	self.SpecIF_Name = self.LblName;
//	self.SpecIF_Names = "Namen";
	self.SpecIF_Folder = "Ordner";	// deprecated, use SpecIF:Heading
	self.SpecIF_Folders = "Ordner";	// deprecated, use SpecIF:Headings
	self.SpecIF_Chapter = "Kapitel";	// deprecated, use SpecIF:Heading
	self.SpecIF_Chapters = "Kapitel";// deprecated, use SpecIF:Headings
	self.SpecIF_Paragraph = "Abschnitt";
	self.SpecIF_Paragraphs = "Abschnitte";
	self.SpecIF_Information = "Information";// deprecated, use SpecIF:Paragraph
	self.SpecIF_Diagram = "Diagramm";
	self.SpecIF_Diagrams = "Diagramme";
	self.SpecIF_DiagramDescription = "Ein '"+self.SpecIF_Diagram+"' ist eine graphische Modellsicht zur Vermittlung eines bestimmten Sachverhalts, z.B. ein Geschäftsprozess oder Systemaufbau.";
	self.SpecIF_View = "Diagramm";		// deprecated
	self.SpecIF_Views = "Diagramme";	// deprecated
	self.FMC_Plan = "Plan";
	self.FMC_Plans = "Pläne";
	self.SpecIF_Object = 
	self.SpecIF_Resource = "Ressource";
	self.SpecIF_Objects = 
	self.SpecIF_Resources = "Ressourcen";
	self.SpecIF_Relation = 
	self.SpecIF_Statement = "Aussage";
	self.SpecIF_Relations = 
	self.SpecIF_Statements = "Aussagen";
	self.SpecIF_Property = "Attribut";
	self.SpecIF_Properties = "Attribute";
	self.FMC_Actor = "Akteur";
	self.FMC_Actors = "Akteure";
	self.FMC_State = "Zustand";
	self.FMC_States = "Zustände";
	self.FMC_Event = "Ereignis";
	self.FMC_Events = "Ereignisse";
	self.FMC_ActorDescription = "Ein '"+self.FMC_Actor+"' ist ein fundamentaler Modellelement-Typ für ein aktives Objekt, z.B. eine Aktivität, ein Prozess-Schritt, eine Funktion, eine Systemkomponente oder eine Rolle.";
	self.FMC_StateDescription = "Ein '"+self.FMC_State+"' ist ein fundamentaler Modellelement-Typ für ein passives Objekt, z.B. ein Wert, ein Dokument, ein Informationsspeicher oder eine physische Beschaffenheit.";
	self.FMC_EventDescription = "Ein '"+self.FMC_Event+"' ist ein fundamentaler Modellelement-Typ für eine zeitliche Referenz, eine Änderung einer Bedingung bzw. eines Zustandes oder generell ein Synchronisations-Mittel.";
	self.SpecIF_Feature = "Merkmal";
	self.SpecIF_Features = "Merkmale";
	self.SpecIF_Requirement =
	self.IREB_Requirement = "Anforderung";
	self.SpecIF_Requirements = 
	self.SpecIF_FeatureDescription = "Ein '"+self.SpecIF_Feature+"' ist eine beabsichtigte differenzierende Eigenschaft eines Systems, oft ein Alleinstellungsmerkmal.";
	self.IREB_RequirementDescription = "Eine '"+self.IREB_Requirement+"' ist ein einzelnes dokumentiertes physisches oder funktionales Bedürfnis, das der betreffende Entwurf, das Produkt oder der Prozess erfüllen muss.";
	self.IREB_Requirements = "Anforderungen";
	self.IREB_RequirementType = "Art";
	self.IREB_RequirementTypeFunction = 
	self.IREB_FunctionalRequirement = "Funktionsanforderung oder 'User Story'";
	self.IREB_RequirementTypeQuality =
	self.IREB_QualityRequirement = "Qualitätsanforderung";
	self.IREB_RequirementTypeConstraint =
	self.IREB_Constraint = "Randbedingung";
	self.IREB_PerspectiveBusiness = "Business";
	self.IREB_PerspectiveStakeholder = "Stakeholder";
	self.IREB_PerspectiveUser = "User";
	self.IREB_PerspectiveOperator = "Operator";
	self.IREB_PerspectiveSystem = "System";
	self.SpecIF_LifecycleStatusDeprecated = "veraltet";
	self.SpecIF_LifecycleStatusRejected = "abgelehnt";
	self.SpecIF_LifecycleStatusInitial = "initial";
	self.SpecIF_LifecycleStatusDrafted = "entworfen";
	self.SpecIF_LifecycleStatusSubmitted = "vorgelegt";
	self.SpecIF_LifecycleStatusApproved = "genehmigt";
	self.SpecIF_LifecycleStatusReady = 'bereit ("ready")';
	self.SpecIF_LifecycleStatusDone = 'fertig ("done")';
	self.SpecIF_LifecycleStatusValidated = "validiert";
	self.SpecIF_LifecycleStatusReleased = "freigegeben";
	self.SpecIF_LifecycleStatusWithdrawn = "zurückgezogen";
	self.SpecIF_DisciplineSystem = "System";
	self.SpecIF_DisciplineMechanics = "Mechanik";
	self.SpecIF_DisciplineElectronics = "Elektronik";
	self.SpecIF_DisciplineSoftware = "Software";
	self.SpecIF_DisciplineSafety = "Sicherheit";
	self.SpecIF_BusinessProcess = 'Geschäftsprozess'; 
	self.SpecIF_BusinessProcesses = 'Geschäftsprozesse';
	self.SpecIF_Rationale = "Motivation";
	self.SpecIF_Note = "Anmerkung";
	self.SpecIF_Notes = "Anmerkungen";
	self.SpecIF_Comment = "Kommentar";
	self.SpecIF_Comments = "Kommentare";
	self.SpecIF_Issue = "Offener Punkt";
	self.SpecIF_Issues = "Offene Punkte";
	self.SpecIF_IssueDescription = "Ein '"+self.SpecIF_Issue+"' ist eine zu beantwortende Frage oder eine zu treffende Entscheidung.";
	self.SpecIF_Outline =
	self.SpecIF_Hierarchy = "Gliederung";
	self.SpecIF_Outlines =
	self.SpecIF_Hierarchies = "Gliederungen";
	self.SpecIF_Glossary = "Modellelemente (Glossar)";
	self.SpecIF_Collection = "Kollektion oder Gruppe";
	self.SpecIF_Collections = "Kollektionen und Gruppen";
	self.SpecIF_CollectionDescription = "Eine '"+self.SpecIF_Collection+"' ist eine logische Gruppierung von '"+self.modelElements+"'.";
	self.SpecIF_Annotations = "Annotationen";
	self.SpecIF_Vote = "Wertung";
	self.SpecIF_Votes = "Wertungen";
	self.SpecIF_Perspective = "Perspektive";
	self.SpecIF_Discipline = "Disziplin";
	self.SpecIF_Effort = "Aufwand";
	self.SpecIF_Risk = 
	self.IREB_Risk = "Risiko";
	self.SpecIF_Benefit = "Nutzen";
	self.SpecIF_Damage = "Schaden";
	self.SpecIF_Probability = "Wahrscheinlichkeit";
	self.SpecIF_shows = "zeigt";
	self.SpecIF_contains = "enthält";
	self.oslc_rm_satisfiedBy = "wird erfüllt von";;
	self.oslc_rm_satisfies = 
	self.SpecIF_satisfies =
	self.IREB_satisfies = "erfüllt";
	self.SpecIF_modifies =
	self.SpecIF_stores = "schreibt und liest";
	self.SpecIF_reads = "liest";
	self.SpecIF_writes = "schreibt";
	self.SpecIF_sendsTo = "sendet an";
	self.SpecIF_receivesFrom = "empfängt von";
	self.SpecIF_influences = "beeinflusst";
	self.SpecIF_follows = "folgt auf";
	self.SpecIF_precedes = "ist Vorgänger von";
	self.SpecIF_signals = "signalisiert";
	self.SpecIF_triggers = "löst aus";
	self.SpecIF_dependsOn = "hängt ab von";
	self.SpecIF_realizes = "realisiert";
	self.SpecIF_serves = "wird aufgerufen von";
	self.SpecIF_refines = 
	self.IREB_refines = "verfeinert";
	self.IREB_refinedBy = "wird verfeinert von";
	self.SpecIF_duplicates = "dupliziert";
	self.SpecIF_contradicts = "widerspricht";
	self.SpecIF_isAssignedTo =
	self.SpecIF_isAssociatedWith =
	self.SysML_isAssociatedWith = "ist assoziiert mit";
	self.SysML_isAllocatedTo = "wird ausgeführt von";
	self.SysML_includes = "inkludiert";
	self.SysML_extends = "erweitert";
	self.SpecIF_isDerivedFrom = 
	self.SysML_isDerivedFrom = "ist abgeleitet von";
	self.SpecIF_isComposedOf = 
	self.SysML_isComposedOf = "ist Komposition von";
	self.SpecIF_isAggregatedBy =
	self.SysML_isAggregatedBy = "ist Aggregation von";
	self.SpecIF_isGeneralizationOf = 
	self.SysML_isGeneralizationOf = "ist generalisiert von";
	self.SpecIF_isSpecializationOf =
	self.SysML_isSpecializationOf = "ist spezialisiert von";
	self.SpecIF_isSynonymOf = "ist Synonym von";
	self.SpecIF_isInverseOf = 						// DEPRECATED
	self.SpecIF_isAntonymOf = "ist Antonym von";
	self.SpecIF_inheritsFrom = "erbt von";
	self.SpecIF_refersTo = "bezieht sich auf";
	self.SpecIF_commentRefersTo = 	self.SpecIF_refersTo;
	self.SpecIF_issueRefersTo = 	self.SpecIF_refersTo;
	self.SpecIF_includes = "schließt ein";
	self.SpecIF_excludes = "schließt aus";
	self.SpecIF_mentions = "erwähnt"; 
	self.SpecIF_sameAs =
	self.owl_sameAs = "ist identisch mit";
	self.SpecIF_Id = 	self.LblIdentifier;
	self.SpecIF_Type = 	self.LblType;
	self.SpecIF_Notation = "Notation";
//	self.SpecIF_Stereotype = 
//	self.SpecIF_SubClass = "Unterklasse";
	self.SpecIF_Category = 	self.LblCategory;
	self.SpecIF_State =								// DEPRECATED
	self.SpecIF_Status = 	self.LblState;
	self.SpecIF_Priority = 	self.LblPriority;
	self.SpecIF_Milestone = "Meilenstein";
	self.SpecIF_DueDate = "Termin";
	self.SpecIF_Icon = "Symbol";
	self.SpecIF_Tag = "Schlagwort";
	self.SpecIF_Tags = "Schlagworte";
	self.SpecIF_UserStory = "User-Story";
//	self.SpecIF_Creation = "";
	self.SpecIF_Instantiation = "Instanziierung";
	self.SpecIF_Origin = "Quelle";		// oder "Herkunft"
	self.SpecIF_Source = self.LblSource;
	self.SpecIF_Target = self.LblTarget;
//	self.SpecIF_Author = "Autor";
//	self.SpecIF_Authors = "Autoren";
	self.IREB_Stakeholder = "Stakeholder";
	self.SpecIF_Responsible = "Verantwortlicher";
	self.SpecIF_Responsibles = "Verantwortliche";
// attribute names used by the Interaction Room:
	self.IR_Annotation = "Annotation";
	self.IR_AnnotationDescription = "Eine Interaction-Room '"+self.IR_Annotation+"' weist auf einen Punkt besonderen Interesses hin. Hierzu gehören Werte, die Kundenbedürfnisse widerspiegeln oder positiven Effekt auf die Ziele der Organisation haben, Produkteigenschaften, deren Umsetzung Nutzen/Aufwand verursacht, und Herausforderungen, die während der Entwicklung zu berücksichtigen sind.";
	self.IR_refersTo = self.SpecIF_refersTo;
	self.IR_approves = "unterstützt";
	self.IR_opposes = "lehnt ab";
	self.IR_inheritsFrom = 	self.SpecIF_inheritsFrom;
// for oem-supplier agreement as defined by the "Hersteller-Initiative-Software":
	self.HIS_OemStatus = 'Status Hersteller';
	self.HIS_OemComment = 'Kommentar Hersteller';
	self.HIS_SupplierStatus = 'Status Lieferant';
	self.HIS_SupplierComment = 'Kommentar Lieferant';
/*
// attribute names used by DocBridge Resource Director:
	self.DBRD_ChapterName = 'Titel';
	self.DBRD_Name = 'Titel';
	self.DBRD_Text = 'Text';
// attribute names used by Atego Exerpt with RIF 1.1a:
	self.VALUE_Object_Heading =
	self.Object_Heading = self.ReqIF_Name;
	self.VALUE_Object_Text =
	self.Object_Text = self.ReqIF_Text;
	self.VALUE_Object_ID =
	self.Object_ID = self.ReqIF_ForeignID; */
	self.SpecIF_priorityHigh = "hoch";
	self.SpecIF_priorityRatherHigh = "eher hoch";
	self.SpecIF_priorityMedium = "mittel";
	self.SpecIF_priorityRatherLow = "eher niedrig";
	self.SpecIF_priorityLow = "niedrig";
	self.SpecIF_sizeXL = "sehr groß";
	self.SpecIF_sizeL = "groß";
	self.SpecIF_sizeM = "mittelgroß";
	self.SpecIF_sizeS = "klein";
	self.SpecIF_sizeXS = "sehr klein";
	self.SpecIF_rejected =
	self.SpecIF_statusRejected = "00_abgelehnt";
	self.SpecIF_initial =
	self.SpecIF_statusInitial = "10_initial";
	self.SpecIF_drafted =
	self.SpecIF_statusDrafted = "20_entworfen";
	self.SpecIF_submitted =
	self.SpecIF_statusSubmitted = "30_vorgelegt";
	self.SpecIF_approved =
	self.SpecIF_statusApproved = "40_genehmigt";
	self.SpecIF_ready =
	self.SpecIF_statusReady = "50_bereit";
	self.SpecIF_done =
	self.SpecIF_statusDone = "60_umgesetzt";
	self.SpecIF_validated =
	self.SpecIF_statusValidated = "70_validiert";
	self.SpecIF_released =
	self.SpecIF_statusReleased = "80_freigegeben";
	self.SpecIF_deprecated =
	self.SpecIF_statusDeprecated = "88_veraltet";
	self.SpecIF_withdrawn =
	self.SpecIF_statusWithdrawn = "90_zurückgezogen";

// Messages:
	self.MsgConfirm = 'Bitte bestätigen:';
	self.MsgConfirmDeletion = "'~A' löschen?";
	self.MsgConfirmObjectDeletion = "Ressource '<b>~A</b>' löschen?";
	self.MsgConfirmUserDeletion = "Nutzer '<b>~A</b>' löschen?";
	self.MsgConfirmProjectDeletion = "Projekt '<b>~A</b>' löschen?";
	self.MsgConfirmSpecDeletion = "Gliederung '<b>~A</b>' mit allen Verweisen löschen?";
	self.MsgConfirmRoleDeletion = "Rolle '<b>~A</b>' löschen?";
	self.MsgConfirmFolderDeletion = "Ordner '<b>~A</b>' löschen?";
	self.MsgInitialLoading = 'Lade den Index für flottere Navigation ... ';
	self.MsgNoProjectLoaded = 'Kein Projekt geladen.';
	self.MsgNoProject = 'Kein Projekt gefunden.';
	self.MsgNoUser = 'Keinen Nutzer gefunden.';
	self.MsgNoObject = 'Keine Ressource gewählt.';
	self.MsgCreateResource = "Ressource anlegen";
	self.MsgCloneResource = "Ressource klonen";
	self.MsgUpdateResource = "Ressource bearbeiten";
	self.MsgDeleteResource = "Ressource löschen";
	self.MsgCreateStatement = "Aussage anlegen";
	self.MsgOtherProject = "Verspätete Antwort; inzwischen wurde ein anderes Projekt gewählt.";
	self.MsgWaitPermissions = 'Rechte werden geladen - es ist gleich soweit.';
/*	self.MsgImportReqif = 'Zulässige Dateitypen sind *.reqifz, *.reqif, *.zip und *.xml. Inhalte müssen den Schemata für ReqIF 1.0+, RIF 1.1a oder RIF 1.2 entsprechen. Der Import dauert meist einige Sekunden und bei sehr großen Dateien mehrere Minuten.'; */
	self.MsgImportReqif = 'Zulässige Dateitypen sind *.reqifz, *.reqif, *.zip und *.xml. Inhalte müssen den Schemata für ReqIF 1.0+ entsprechen. Der Import dauert meist einige Sekunden und bei sehr großen Dateien mehrere Minuten.';
	self.MsgImportSpecif = 'Zulässige Dateitypen sind *.specif, *.specif.zip und *.specifz. Inhalte müssen den Schemata für SpecIF 0.10.4+ entsprechen. Bei großen Dateien kann der Import einige Minuten dauern.';
	self.MsgImportBpmn = 'Zulässiger Dateityp *.bpmn. Inhalte müssen den Schemata für BPMN 2.0 XML entsprechen. Der Import kann bis zu einigen Minuten dauern.';
	self.MsgImportXls = 'Zulässige Dateitypen sind *.xls, *.xlsx und *.csv. Der Import kann bei sehr großen Dateien mehrere Minuten dauern.';
	self.MsgExport = 'Es wird eine zip-gepackte Datei im gewählten Format erzeugt. Der Export dauert meist einige Sekunden und im Falle sehr großer Dateien mehrere Minuten; Ihr Browser wird die Datei gemäß Voreinstellungen speichern.';
	self.MsgLoading = 'Lade soeben ...';
	self.MsgSearching = 'Suche weiter ...';
	self.MsgObjectsProcessed = '~A Ressourcen analysiert.';
	self.MsgObjectsFound = '~A Ressourcen gefunden.';
	self.MsgNoMatchingObjects = 'Keine Ressource gefunden.';
	self.MsgNoRelatedObjects = 'Zu dieser Ressource gibt es keine Aussagen.';
	self.MsgNoComments = 'Zu dieser Ressource gibt es keine Kommentare.';
	self.MsgNoFiles = 'Keine Datei gefunden.';
	self.MsgAnalyzing = 'Setze Analyse fort ...';
	self.MsgNoReports = 'Keine Auswertungen für dieses Projekt.';
	self.MsgTypeNoObjectType = "Mindestens eine Ressource-Klasse anlegen, sonst können keine Ressourcen erzeugt werden.";
	self.MsgTypeNoAttribute = "Mindestens ein Attribut anlegen, sonst ist der Typ nicht brauchbar.";
	self.MsgNoObjectTypeForManualCreation = "Es können keine Ressourcen angelegt werden, weil entweder keine Rechte eingeräumt sind oder weil kein Ressouce-Typ für manuelles Anlegen vorgesehen ist.";
	self.MsgFilterClogged = 'Filter ist undurchlässig - mindestens ein Kriterium ist nicht erfüllbar.';
	self.MsgCredentialsUnknown = 'Anmeldeinformation ist unbekannt.';
	self.MsgUserMgmtNeedsAdminRole = 'Bitten Sie einen Administrator die Nutzer und Rollen zu verwalten.';
	self.MsgProjectMgmtNeedsAdminRole = 'Bitten Sie einen Administrator die Projekteigenschaften, Rollen und Rechte zu verwalten.';
	self.MsgImportSuccessful = "'~A' wurde erfolgreich importiert.";
	self.MsgImportDenied = "'~A' wurde nicht importiert: Das Projekt wird von einer anderen Organisation bearbeitet oder das Schema wird nicht eingehalten.";
	self.MsgImportFailed = "Der Import von '~A' wurde wegen eines Fehlers abgebrochen.";
	self.MsgImportAborted = 'Der Import wurde durch den Nutzer abgebrochen.';
	self.MsgChooseRoleName = 'Bitte benennen Sie die Rolle:';
	self.MsgIdConflict = "Existiert bereits: Konnte Element '~A' nicht anlegen.";
	self.MsgRoleNameConflict = "Existiert bereits: Konnte Rolle '~A' nicht anlegen.";
	self.MsgUserNameConflict = "Existiert bereits: Konnte Nutzer '~A' nicht anlegen.";
	self.MsgFileApiNotSupported = 'Dieser Browser unterstützt nicht den Zugriff auf Dateien. Bitte wählen Sie einen aktuellen Browser.';
	self.MsgDoNotLoadAllObjects = 'Es ist nicht zu empfehlen alle Ressourcen in einem Aufruf zu laden.';
	self.MsgReading = "Lesen";
	self.MsgCreating = "Anlegen";
	self.MsgUploading = "übertragen";
	self.MsgImporting = "Importieren";
	self.MsgBrowserSaving = "Ihr Browser speichert die Datei gemäß Voreinstellungen.";
	self.MsgSuccess = "Erfolgreich!";
	self.MsgSelectImg = "Wählen oder laden Sie ein Bild";
	self.MsgImgWidth = "Bildbreite [px]";
	self.MsgSelectResClass = 	self.LblResourceClass+" auswählen";
	self.MsgSelectStaClass = 	self.LblStatementClass+" auswählen";
	self.MsgNoEligibleRelTypes = "Keine Aussage-Typen für diesen Ressource-Typ definiert.";
	self.MsgClickToNavigate = "Eine Ressource doppelt klicken, um dorthin zu navigieren:";
	self.MsgClickToDeleteRel = "Eine Ressource doppelt klicken, um die betreffende Aussage zu löschen:";
	self.MsgNoSpec = "Keine Gliederung gefunden."
	self.MsgTypesCommentCreated = 'Die Typen für Kommentare wurden angelegt.';
	self.MsgOutlineAdded = 'Gliederung wurde oben hinzu gefügt - bitte konsolidieren Sie die bestehende und die neue manuell.';
	self.MsgLoadingTypes = 'Lade Typen';
	self.MsgLoadingFiles = 'Lade Bilder und Dateien';
	self.MsgLoadingObjects = 'Lade Ressourcen';
	self.MsgLoadingRelations = 'Lade Aussagen';
	self.MsgLoadingHierarchies = 'Lade Gliederungen';
	self.MsgProjectCreated = 'Projekt erfolgreich angelegt';
	self.MsgProjectUpdated = 'Projekt erfolgreich aktualisiert';
	self.MsgNoneSpecified = 'leer';

// Error messages:
	self.Error = 'Fehler';
	self.Err403Forbidden = 'Kein Zugriffsrecht für Ihre Rolle.';
	self.Err403NoProjectFolder = 'Mindestens ein Projekt im gewählten Baum dürfen Sie nicht ändern.';
//	self.Err403NoProjectUpdate = 'Ihre Rolle erlaubt nicht das Aktualisieren des Projekts.';
	self.Err403NoProjectDelete = 'Ihre Rolle erlaubt nicht das Löschen des Projekts.';
	self.Err403NoUserDelete = 'Ihre Rolle erlaubt nicht das Löschen von Nutzern.';
	self.Err403NoRoleDelete = 'Ihre Berechtigungen erlauben nicht das Löschen von Rollen.';
	self.Err404NotFound = "Element nicht gefunden; es wurde vermutlich gelöscht.";
	self.ErrNoItem = "Element '~A' nicht gefunden.";
	self.ErrNoObject = "Ressource '~A' nicht gefunden; es wurde vermutlich gelöscht.";
	self.ErrNoSpec = "Dieses Projekt hat keine Gliederung; es muss mindestens eine angelegt werden.";
	self.ErrInvalidFile = 'Ungültige oder unzulässige Datei.';
	self.ErrInvalidFileType = "'~A' hat einen unzulässigen Dateityp.";
	self.ErrInvalidAttachment = "Unzulässiger Dateityp. Wählen Sie bitte unter ~A.";
	self.ErrInvalidFileReqif = "'~A' hat einen unzulässigen Dateityp. Wählen Sie '*.reqifz', '*.reqif', '*.zip' oder '*.xml'.";
	self.ErrInvalidFileSpecif = "'~A' hat einen unzulässigen Dateityp. Wählen Sie '*.specif.zip', '*.specifz' oder '*.specif'.";
	self.ErrInvalidFileBpmn = "'~A' hat einen unzulässigen Dateityp. Wählen Sie '*.bpmn'.";
	self.ErrInvalidFileTogaf = "'~A' hat einen unzulässigen Dateityp. Wählen Sie '*.xml'.";
	self.ErrInvalidFileXls = "'~A' hat einen unzulässigen Dateityp. Wählen Sie '*.xlsx', '*.xls', oder '*.csv'.";
//	self.ErrInvalidFileElic = "'~A' hat einen unzulässigen Dateityp. Wählen Sie '*.elic_signed.xml'.";
	self.ErrUpload = 'Fehler beim Dateitransfer zum Server.';
	self.ErrImport = "Fehler beim Import.";
	self.ErrImportTimeout = 'Zeitüberschreitung beim Import.';
	self.ErrCommunicationTimeout = 'Zeitüberschreitung bei Server-Anfrage.';
	self.ErrInvalidData = 'Ungültige oder schädliche Daten.';
	self.ErrInvalidContent = 'Ungültige Daten; sehr wahrscheinlich XHTML-Strukturfehler oder schädlicher Inhalt.';
	self.ErrInvalidRoleName = "'~A' ist ein ungültiger Rollenname.";
	self.ErrUpdateConflict = "Ihre Aktualisierung ist im Konflikt mit einer zwischenzeitlichen änderung eines anderen Nutzers.";
	self.ErrInconsistentPermissions = "Berechtigungen sind widersprüchlich, bitte wenden Sie sich an einen Administrator.";
	self.ErrObjectNotEligibleForRelation = "Diese Ressourcen können nicht mit der gewählten Aussage verknüpft werden.";
	self.Err400TypeIsInUse = "Dieser Typ kann nicht gelöscht werden, weil er bereits verwendet wird."
	self.Err402InsufficientLicense = "Die hinterlegte Lizenz reicht nicht für diese Operation.";

//	self.monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'October', 'November', 'Dezember' ];
//	self.monthAbbrs = ['Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dez' ];

// App icons:
	self.IcoHome = '<span class="glyphicon glyphicon-home"></span>';
	self.IcoSystemAdministration = '<span class="glyphicon glyphicon-wrench"></span>';
	self.IcoUserAdministration = '<span class="glyphicon glyphicon-user"></span>';
	self.IcoProjectAdministration = '<span class="glyphicon glyphicon-cog"></span>';
//	self.IcoProjectAdministration = '<span style="font-size:130%">&#9881;</span>';
	self.IcoSpecifications = '<span class="glyphicon glyphicon-book"></span>';
	self.IcoReader = '<span class="glyphicon glyphicon-eye-open"></span>';
//	self.IcoImportReqif = '<span class="glyphicon glyphicon-import"></span>';
//	self.IcoImportCsv = '<span class="glyphicon glyphicon-import"></span>';
//	self.IcoImportXls = '<span class="glyphicon glyphicon-import"></span>';
	self.IcoSupport = '<span class="glyphicon glyphicon-question-sign"></span>';

// App names:
	self.LblHome = 'Willkommen!';
	self.LblProjects = 'Projekte';
	self.LblSystemAdministration = 'Konfiguration';
	self.LblUserAdministration = 'Nutzer';
	self.LblProjectAdministration = 'Typen & Rechte';   // for the browser tabs - no HTML!
	self.LblSpecifications = 'Inhalte';
	self.LblReader = 'SpecIF Leser';
	self.LblEditor = 'SpecIF Editor';
	self.LblSupport = 'Unterstützung';
	self.AppHome = 	self.IcoHome+'&#160;'+	self.LblHome;
	self.AppSystemAdministration = 	self.IcoSystemAdministration+'&#160;Interaktives Lastenheft: '+	self.LblSystemAdministration;
	self.AppUserAdministration = 	self.IcoUserAdministration+'&#160;Interaktives Lastenheft: '+	self.LblUserAdministration;
	self.AppProjectAdministration = 	self.IcoProjectAdministration+'&#160;Interaktives Lastenheft: '+	self.LblProjectAdministration;
	self.AppSpecifications = 	self.IcoSpecifications+'&#160;Interaktives Lastenheft: '+	self.LblSpecifications;
	self.AppReader = 	self.IcoReader+'&#160;'+	self.LblReader;
	self.AppImport = 	self.IcoImport+'&#160;Import';
	self.AppLocal = 	self.IcoSpecifications+'&#160;'+	self.LblEditor;
	self.AppSupport = 	self.IcoSupport+'&#160;'+	self.LblSupport;
	return self;
};
