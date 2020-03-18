/* 	Provide i18ns and messages in a certain language, in this case 'Fran�ais' (fr).
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
i18n.LblAll = "Tous";
i18n.LblAllObjects = "Tous les ressources";
i18n.LblImport = 'Importer';
i18n.LblExport = 'Exporter';
i18n.LblExportReqif = 'Exporter fichier ReqIF';
i18n.LblExportSpecif = 'Exporter fichier SpecIF';
i18n.LblAdminister = 'Administrer';
i18n.LblCreate = 'Cr�er';
i18n.LblRead = 'Lire';
i18n.LblUpdate = 'Mettre � jour';
i18n.LblUpdateProject = "Mettre � jour les attributs du projet";
i18n.LblUpdateSpec = "Mettre � jour les attributs de l'arborescence";
i18n.LblUpdateTypes = 'Mettre � jour les types & permissions';
i18n.LblUpdateObject = "Mettre � jour cette ressource";
i18n.LblDelete = 'Effacer';
i18n.LblDeleteProject = 'Effacer ce project';
i18n.LblDeleteType = 'Effacer ce type';
i18n.LblDeleteObject = 'Effacer cette ressource';
i18n.LblDeleteAttribute = 'Effacer cet attribut';
i18n.LblDeleteRelation = 'Effacer cette affirmation';
i18n.LblDeleteRole = 'Effacer ce r�le';
i18n.LblSaveRelationAsSource = 'Relier ressource comme '+LblSource;
i18n.LblSaveRelationAsTarget = 'Relier ressource comme '+LblTarget;
i18n.LblAdd = 'Cr�er';
i18n.LblAddItem = 'Cr�er ~A';
i18n.LblAddProject = "Cr�er un projet";
i18n.LblAddType = "Cr�er un type";
i18n.LblAddDataType = "Cr�er un type de donn�es";
i18n.LblAddObjType = "Cr�er un type de ressources";
i18n.LblAddRelType = "Cr�er un type d'affirmations";
i18n.LblAddSpcType = "Cr�er un type d'arborescence";
i18n.LblAddTypeComment = 'Cr�er les types pour commentaires';
i18n.LblAddObject = "Cr�er une ressource";
i18n.LblAddRelation = "Cr�er une affirmation";
i18n.LblAddAttribute = "Cr�er un attribut";
i18n.LblAddUser = "Cr�er un utilisateur";
i18n.LblAddComment = 'Commenter';
i18n.LblAddCommentTo = "Ajouter un commentaire � '~A':";
i18n.LblAddCommentToObject = 'Commenter cette ressource';
i18n.LblAddFolder = "Cr�er un dossier";
i18n.LblAddSpec = "Cr�er une arborescence";
i18n.LblClone = 'Cloner';
i18n.LblCloneObject = 'Cloner cette ressource';
i18n.LblCloneType = 'Cloner ce type';
i18n.LblCloneSpec = 'Cloner cet arborescence';
i18n.LblUserName = "Nom d'utilisateur";
i18n.LblPassword = 'Mot de passe';
i18n.LblTitle = 'Titre';
i18n.LblProject = 'Projet';
i18n.LblName = 'Nom';
i18n.LblFirstName = 'Pr�nom';
i18n.LblLastName = 'Nom';
i18n.LblOrganizations = 'Organisation';  // until multiple orgs per user are supported
i18n.LblEmail = 'e-mail';
i18n.LblFileName = 'Nom de fichier';
i18n.LblRoleGeneralAdmin = 'GENERAL-ADMIN';
i18n.LblRoleProjectAdmin = 'ADMIN';
i18n.LblRoleUserAdmin = 'USER-ADMIN';
i18n.LblRoleReader = 'READER';
i18n.LblRoleReqif = 'REQIF';
i18n.LblGlobalActions = 'Actions';
i18n.LblItemActions = 'Actions';
i18n.LblIdentifier = "Identifiant";
i18n.LblProjectName = 'Nom de projet';
i18n.LblDescription = 'Description';
i18n.LblState = 'Statut';
i18n.LblPriority = 'Priorit�';
i18n.LblCategory = 'Cat�gorie';
i18n.LblAttribute = 'Attribut';
i18n.LblAttributes = 'Attributs';
i18n.LblAttributeValueRange = "Plage de valeurs";
i18n.LblAttributeValues = "Valeurs";
i18n.LblAttributeValue = "Valeur";
i18n.LblTool = "Outil auteur";
i18n.LblMyRole = 'Mon r�le';
i18n.LblRevision = 'R�vision';
i18n.LblCreatedAt = 'Cr�� le';
i18n.LblCreatedBy = 'Cr�� par';
i18n.LblCreatedThru = 'Cr�� par';
i18n.LblModifiedAt = 'Modifi� le';
i18n.LblModifiedBy = 'Modifi� par';
i18n.LblProjectDetails = 'Attributs';
i18n.LblProjectUsers = '<span class="glyphicon glyphicon-user"/>&#160;Utilisateur de ce projet';
i18n.LblOtherUsers = 'Autres utilisateurs';
i18n.LblUserProjects = '<span class="glyphicon glyphicon-book"/>&#160;Projets de cet utilisateur';
i18n.LblOtherProjects = 'Autres projets';
i18n.LblType = 'Type';
i18n.LblTypes = 'Types';
i18n.LblDataTypes = 'Types de donn�es';
i18n.LblDataType = 'Type de donn�es';
i18n.LblDataTypeTitle = 'Nom de type de donn�es';
i18n.LblSpecTypes = "Types";
i18n.LblSpecType = "Type";
i18n.LblObjectTypes = 
i18n.LblResourceClasses = "Classes de ressource";
i18n.LblObjectType = "Classe de ressource";
i18n.LblRelationTypes = 
i18n.LblStatementClasses = "Types d'affirmation";
i18n.LblRelationType = "Classe d'affirmation";
//i18n.LblRelGroupTypes = "Types de groupe d'affirmations";
//i18n.LblRelGroupType = "Type de groupe d'affirmation";
i18n.LblSpecificationTypes = "Types d'arborescence";
i18n.hierarchyType = 
i18n.LblSpecificationType = "Type d'arborescence";
i18n.LblRifTypes = 'Types';
i18n.rifType = 
i18n.LblRifType = 'Type';
i18n.LblSpecTypeTitle = "Nom";
i18n.LblAttributeTitle = "Nom d'attribut";
i18n.LblSecondaryFiltersForObjects = i18n.IcoFilter+"&#160;Filtres � facette pour '~A'";
i18n.LblPermissions = 'Autorisations';
i18n.LblRoles = 'R�les';
i18n.LblFormat = 'Format';
i18n.LblFileFormat = 'Format de fichier';
i18n.LblStringMatch = '<span class="glyphicon glyphicon-text-background" />&#160;Recherche de texte';
i18n.LblWordBeginnings = 'Seulement mots commen�ant par';
i18n.LblWholeWords = 'Seulement mots entiers';
i18n.LblCaseSensitive = 'Respecter majuscules et minuscules';
i18n.LblExcludeEnums = 'Ignorer �num�rateurs';
i18n.LblNotAssigned = '(sans attribution de valeur)';
i18n.LblPrevious = 'Dernier';
i18n.LblNext = 'Prochain';
i18n.LblGo = 'D�marrer';
i18n.LblAll = 'Tous';
i18n.LblHitCount = 'Score';
i18n.LblRelateAs = "Relier comme";
i18n.LblSource = "Sujet";
i18n.LblTarget = "Objet";
i18n.LblEligibleSources = "Ressources �ligible comme "+i18n.LblSource;
i18n.LblEligibleTargets = "Ressources �ligible comme "+i18n.LblTarget;
i18n.LblIcon = 'Symbole';
i18n.LblCreation = 'Cr�ation';
i18n.LblCreateLink1 = "&#x2776;&#160;Affirmation d�sir�e";
i18n.LblCreateLink2 = "&#x2777;&#160;Ressource � relier";
i18n.LblReferences = "R�f�rences";
i18n.LblInherited = "h�rit�";
i18n.LblMaxLength = "Longueur max.";
i18n.LblMinValue = "Valeur min.";
i18n.LblMaxValue = "Valeur max.";
i18n.LblAccuracy = "D�cimales";
i18n.LblEnumValues = "Valeurs (s�p. par virgules)";
i18n.LblSingleChoice = "Choix unique";
i18n.LblMultipleChoice = "Choix multiple";
i18n.LblDirectLink = "Lien direct";

i18n.BtnLogin = '<span class="glyphicon glyphicon-log-in"/>&#160;Se connecter';
i18n.BtnLogout = '<span class="glyphicon glyphicon-log-out"/>&#160;Se d�connecter';
i18n.BtnProfile = 'Profile';
i18n.BtnBack = 'Retour';
i18n.BtnCancel = 'Annuler';
i18n.BtnCancelImport = "Interrompre";
i18n.BtnApply = 'Appliquer';
i18n.BtnDelete = '<span class="glyphicon glyphicon-remove"/>&#160;Effacer';
i18n.BtnDeleteObject = '<span class="glyphicon glyphicon-remove"/>&#160;Effacer la ressource avec ses references';
i18n.BtnDeleteObjectRef = '<span class="glyphicon glyphicon-remove"/>&#160;Effacer cette reference de ressource';
i18n.BtnImport = '<span class="glyphicon glyphicon-import"/>&#160;Importer';
i18n.BtnCreate = '<span class="glyphicon glyphicon-import"/>&#160;Cr�er';
i18n.BtnReplace = '<span class="glyphicon glyphicon-import"/>&#160;Remplacer';
i18n.BtnAdopt = '<span class="glyphicon glyphicon-import"/>&#160;Adopter';
i18n.BtnUpdate = '<span class="glyphicon glyphicon-import"/>&#160;'+i18n.LblUpdate;
//i18n.BtnImportSpecif = '<span class="glyphicon glyphicon-import"/>&#160;SpecIF';
//i18n.BtnImportReqif = '<span class="glyphicon glyphicon-import"/>&#160;ReqIF';
//i18n.BtnImportXls = '<span class="glyphicon glyphicon-import"/>&#160;xlsx';
//i18n.BtnProjectFromTemplate = "Cr�er un projet avec m�tadonn�es ReqIF";
i18n.BtnRead = '<span class="glyphicon glyphicon-eye-open"/>&#160;Lire';
i18n.BtnExport = '<span class="glyphicon glyphicon-export"/>&#160;Exporter';
//i18n.BtnExportSpecif = '<span class="glyphicon glyphicon-export"/>&#160;SpecIF';
//i18n.BtnExportReqif = '<span class="glyphicon glyphicon-export"/>&#160;ReqIF';
i18n.BtnAdd = '<span class="glyphicon glyphicon-plus"/>&#160;Ajouter';
i18n.BtnAddUser = '<span class="glyphicon glyphicon-plus"/>&#160;Utilisateur';
i18n.BtnAddProject = '<span class="glyphicon glyphicon-plus"/>&#160;'+i18n.LblProject;
i18n.BtnAddSpec = '<span class="glyphicon glyphicon-plus"/>&#160;Arborescence';
i18n.BtnAddFolder = '<span class="glyphicon glyphicon-plus"/>&#160;Dossier';
i18n.BtnAddAttribute = '<span class="glyphicon glyphicon-plus"/>&#160;Attribut';
i18n.BtnAddTypeComment = '<span class="glyphicon glyphicon-plus"/>&#160;Classes pour commentaires';
i18n.BtnClone = '<span class="glyphicon glyphicon-duplicate"/>&#160;Clone';
i18n.BtnEdit = '<span class="glyphicon glyphicon-pencil"/>&#160;Modifier';
i18n.BtnSave = '<span class="glyphicon glyphicon-save"/>&#160;Enregistrer';
i18n.BtnSaveRole = '<span class="glyphicon glyphicon-save"/>&#160;Enregistrer r�le';
i18n.BtnSaveAttr = '<span class="glyphicon glyphicon-save"/>&#160;Enregistrer attribut';
i18n.BtnInsert = '<span class="glyphicon glyphicon-save"/>&#160;Enregistrer';
i18n.BtnInsertSuccessor = '<span class="glyphicon glyphicon-save"/>&#160;Enregistrer apr�s';
i18n.BtnInsertChild = '<span class="glyphicon glyphicon-save"/>&#160;Enregistrer en dessous';
i18n.BtnSaveRelation = '<span class="glyphicon glyphicon-save"/>&#160;Enregistrer affirmation';
i18n.BtnSaveItem = '<span class="glyphicon glyphicon-save"/>&#160;Enregistrer ~A';
i18n.BtnDetails = 'D�tails';
i18n.BtnAddRole = '<span class="glyphicon glyphicon-plus" />&#160;R�le';
i18n.BtnFileSelect = '<span class="glyphicon glyphicon-plus" />&#160;Choisir un fichier ...';
i18n.BtnPrevious = '<span class="glyphicon glyphicon-chevron-up"/>&#160;'+i18n.LblPrevious;
i18n.BtnNext = '<span class="glyphicon glyphicon-chevron-down"/>&#160;'+i18n.LblNext;
i18n.BtnGo = i18n.IcoGo+'&#160;'+i18n.LblGo;
i18n.BtnFilterReset = i18n.IcoFilter+'&#160;Neuf';
i18n.BtnSelectHierarchy = "Choix d'une arborescence";

// Tabs:
i18n.TabAll = '<span class="glyphicon glyphicon-list"/>';   
i18n.TabUserList = '<span class="glyphicon glyphicon-list"/>&#160;Utilisateurs';
i18n.TabProjectList = '<span class="glyphicon glyphicon-list"/>&#160;Projets';
//i18n.TabProjectDetails = '<span class="glyphicon glyphicon-pencil"/>&#160;Attributs';  // m�tadonn�es
i18n.TabUserDetails = '<span class="glyphicon glyphicon-pencil"/>&#160;Attributs';
i18n.TabProjectUsers = '<span class="glyphicon glyphicon-user"/>&#160;Utilisateurs';
i18n.TabUserProjects = '<span class="glyphicon glyphicon-book"/>&#160;Projets';
i18n.TabPermissions = '<span class="glyphicon glyphicon-lock"/>&#160;Autorisations';
i18n.TabTypes = '<span class="glyphicon glyphicon-cog"/>&#160;'+i18n.LblTypes;
i18n.TabDataTypes = '<span class="glyphicon glyphicon-cog"/>&#160;'+i18n.LblDataTypes;
i18n.TabSpecTypes = '<span class="glyphicon glyphicon-cog"/>&#160;'+i18n.LblObjectTypes;
i18n.TabObjectTypes = '<span class="glyphicon glyphicon-cog"/>&#160;'+i18n.LblObjectTypes;
i18n.TabRelationTypes = '<span class="glyphicon glyphicon-cog"/>&#160;'+i18n.LblRelationTypes;
i18n.TabRelGroupTypes = '<span class="glyphicon glyphicon-cog"/>&#160;'+i18n.LblRelGroupTypes;
i18n.TabSpecificationTypes = '<span class="glyphicon glyphicon-cog"/>&#160;'+i18n.LblSpecificationTypes;
i18n.TabRifTypes = '<span class="glyphicon glyphicon-cog"/>&#160;'+i18n.LblRifTypes;
i18n.TabTable = '<span class="glyphicon glyphicon-th"/>&#160;Table';
i18n.TabDocument = '<span class="glyphicon glyphicon-book"/>&#160;Document';
i18n.TabFind = '<span class="glyphicon glyphicon-search"/>&#160;Recherche';
i18n.TabFilter = i18n.IcoFilter+'&#160;Filtre';
i18n.TabPage = '<span class="glyphicon glyphicon-file"/>&#160;Page';
i18n.TabRevisions = '<span class="glyphicon glyphicon-grain"/>&#160;R�visions';
i18n.TabTimeline = '<span class="glyphicon glyphicon-film"/>&#160;Chronologie';
i18n.TabRelations = '<span class="glyphicon glyphicon-link"/>&#160;Affirmations';
i18n.TabSort = '<span class="glyphicon glyphicon-magnet"/>&#160;Triage';
i18n.TabAttachments = '<span class="glyphicon glyphicon-paperclip"/>&#160;Images et fichiers';
i18n.TabComments = '<span class="glyphicon glyphicon-comment"/>&#160;Commentaires';
i18n.TabReports = '<span class="glyphicon glyphicon-stats"/>&#160;Rapports';

// Functions:
i18n.FnProjectCreate = '<span class="glyphicon glyphicon-plus"/>&#160;Projet';
i18n.FnProjectImport = '<span class="glyphicon glyphicon-import"/>&#160;Importer projet';
//i18n.FnImportReqif = '<span class="glyphicon glyphicon-import"/>&#160;Importer ReqIF';
//i18n.FnImportCsv = '<span class="glyphicon glyphicon-import"/>&#160;Importer CSV';
//i18n.FnImportXls = '<span class="glyphicon glyphicon-import"/>&#160;XLS Import';
//i18n.FnProjectFromTemplate = '<span class="glyphicon glyphicon-plus"/>&#160;Projet avec m�tadonn�es';
i18n.FnRefresh = '<span class="glyphicon glyphicon-refresh"/>&#160;Actualiser';
i18n.FnRead = '<span class="glyphicon glyphicon-eye-open"/>';
i18n.FnOpen = i18n.FnRead;
i18n.FnUpdate = '<span class="glyphicon glyphicon-wrench"/>';
i18n.FnDelete = '<span class="glyphicon glyphicon-remove"/>';
i18n.FnRemove = i18n.FnDelete;

// ReqIF attribute names (replace any '.' by '_', so 'ReqIF.Text' becomes 'ReqIF_Text ):
i18n.ReqIF_ForeignID = 'Identifiant';
i18n.ReqIF_ChapterName = 'Titre';
i18n.ReqIF_Name = 'Titre';
i18n.ReqIF_Text = 'Texte';
i18n.ReqIF_ForeignCreatedOn = i18n.LblCreatedAt;
i18n.ReqIF_ForeignCreatedBy = i18n.LblCreatedBy;
i18n.ReqIF_ForeignCreatedThru = i18n.LblCreatedThru;
i18n.ReqIF_ForeignModifiedOn = i18n.LblModifiedAt;
i18n.ReqIF_ForeignModifiedBy = i18n.LblModifiedBy;
i18n.ReqIF_Revision = i18n.LblRevision;
i18n.ReqIF_Description = i18n.LblDescription;
i18n.ReqIF_ChangeDescription = 'Description de la modification';
i18n.ReqIF_Project = i18n.LblProject;
i18n.ReqIF_ForeignState = i18n.LblState;
i18n.ReqIF_Category = i18n.LblCategory;
i18n.ReqIF_Prefix = 'Pr�fixe';
i18n.ReqIF_FitCriteria = "Crit�res d'acceptation";
i18n.ReqIF_AssociatedFiles = 'Fichiers';
i18n.ReqIF_ChapterNumber = 'Num�ro de chapitre';   // shouldn't be used, as an object cannot (should not) know its position in the outline
// Dublin Core (DCMI) attribute names:
i18n.DC_title =
i18n.dcterms_title = "Titre";
i18n.DC_description =
i18n.dcterms_description = "Description";
i18n.DC_identifier =
i18n.dcterms_identifier = i18n.LblIdentifier;
i18n.DC_type =
i18n.dcterms_type = "Type d'�l�ment";
i18n.DC_creator =
i18n.dcterms_creator = "Auteur";
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
i18n.oslc_rm_validates = "valides";
i18n.oslc_rm_validatedBy = "est valid� de";
//i18n.oslc_rm_decomposes = "decomposes";
//i18n.oslc_rm_decomposedBy = "is decomposed by";
//i18n.oslc_rm_constrainedBy = "";
//i18n.oslc_rm_constrains = "";
// SpecIF entity, relation and attribute names
i18n.SpecIF_Heading = "Intitul�";
i18n.SpecIF_Headings = "Intitul�s";
i18n.SpecIF_Name = i18n.LblName;
//i18n.SpecIF_Names = "Namen";
i18n.SpecIF_Folder = "Dossier";   // deprecated, use SpecIF:Heading
i18n.SpecIF_Folders = "Dossiers"; // deprecated, use SpecIF:Headings
i18n.SpecIF_Chapter = "Chapitre"; // deprecated, use SpecIF:Heading
i18n.SpecIF_Chapters = "Chapitres";// deprecated, use SpecIF:Headings
i18n.SpecIF_Paragraph = "Section";
i18n.SpecIF_Paragraphs = "Sections";
i18n.SpecIF_Information = "Information";// deprecated, use SpecIF:Paragraph
i18n.SpecIF_Diagram = "Diagramme";
i18n.SpecIF_Diagrams = "Diagrammes";
i18n.SpecIF_View = "Diagramme";		// deprecated
i18n.SpecIF_Views = "Diagrammes";	// deprecated
i18n.FMC_Plan = "Plan";
i18n.FMC_Plans = "Plans";
i18n.SpecIF_Object = 
i18n.SpecIF_Resource = "Ressource";
i18n.SpecIF_Objects = 
i18n.SpecIF_Resources = "Ressources";
i18n.SpecIF_Relation = 
i18n.SpecIF_Statement = "Affirmation";
i18n.SpecIF_Relations = 
i18n.SpecIF_Statements = "Affirmations";
i18n.SpecIF_Property = "Attribut";
i18n.SpecIF_Properties = "Attributs";
i18n.FMC_Actor = "Acteur";
i18n.FMC_Actors = "Acteurs";
i18n.FMC_State = "�tat";
i18n.FMC_States = "�tats";
i18n.FMC_Event = "�venement";
i18n.FMC_Events = "�venements";
i18n.SpecIF_Feature = "Marque";
i18n.SpecIF_Features = "Marques";
i18n.SpecIF_Requirement =
i18n.IREB_Requirement = "Exigence";
i18n.SpecIF_Requirements = 
i18n.IREB_Requirements = "Exigences";
i18n.SpecIF_BusinessProcess = 'Processus'; 
i18n.SpecIF_BusinessProcesses = 'Processus';
i18n.SpecIF_Rationale = "Motivation";
i18n.SpecIF_Note = "Remarque";
i18n.SpecIF_Notes = "Remarques";
i18n.SpecIF_Comment = "Commentaire";
i18n.SpecIF_Comments = "Commentaires";
i18n.SpecIF_Issue = "Probl�me";
i18n.SpecIF_Issues = "Probl�mes";
i18n.SpecIF_Outline =
i18n.SpecIF_Hierarchy = "Arborescence";
i18n.SpecIF_Outlines =
i18n.SpecIF_Hierarchies = "Arborescences";
i18n.SpecIF_Glossary = "�lements de mod�le (Glossaire)";
i18n.SpecIF_Annotations = "Annotations";
i18n.SpecIF_Vote = "Evaluation";
i18n.SpecIF_Votes = "Evaluations";
i18n.SpecIF_Effort = "Effort";
i18n.SpecIF_Risk = 
i18n.IREB_Risk = "Risque";
i18n.SpecIF_Benefit = "B�n�fice";
i18n.SpecIF_Damage = "Dommage";
i18n.SpecIF_Probability = "Probabilit�";
i18n.SpecIF_shows = "montre";
i18n.SpecIF_contains = "contient";
i18n.oslc_rm_satisfiedBy = "satisfait par";
i18n.oslc_rm_satisfies =
i18n.SpecIF_satisfies =
i18n.IREB_satisfies = "satisfait";
i18n.SpecIF_implements = "realise";
i18n.SpecIF_modifies =
i18n.SpecIF_stores = "�crit et lit";
i18n.SpecIF_reads = "lit";
i18n.SpecIF_writes = "�crit";
i18n.SpecIF_sendsTo = "�mets �";
i18n.SpecIF_receivesFrom = "re�oit de";
i18n.SpecIF_influences = "influence";
i18n.SpecIF_follows = "succ�des �";
i18n.SpecIF_precedes = "prec�de";
i18n.SpecIF_signals = "signale";
i18n.SpecIF_triggers = "d�clenche";
i18n.SpecIF_dependsOn = "depend de";
i18n.SpecIF_refines =
i18n.IREB_refines = "affine";
i18n.IREB_refinedBy = "est affin� de";
i18n.SpecIF_duplicates = "reprend";
i18n.SpecIF_contradicts = "contredit";
i18n.SpecIF_isAssociatedWith =
i18n.SysML_isAssociatedWith = "est associ� avec";
i18n.SysML_isAllocatedTo = "est �xecut� par";
i18n.SpecIF_isSynonymOf = "est synonyme de";
i18n.SysML_includes = "inclut";
i18n.SysML_extends = "�largit";
i18n.SpecIF_isDerivedFrom = 
i18n.SysML_isDerivedFrom = "est d�riv� de";
i18n.SysML_isComposedOf = "est compos� de";
i18n.SysML_isAggregatedBy = "est aggreg� de";
i18n.SysML_isGeneralisationOf = "est generalis� de";
i18n.SysML_isSpecialisationOf = "est specialis� de";
i18n.SpecIF_isInverseOf = "est l'inverse de";
i18n.SpecIF_inheritsFrom = "h�rite de";
i18n.SpecIF_refersTo = "concerne";
i18n.SpecIF_commentRefersTo = "concerne";
i18n.SpecIF_issueRefersTo = "concerne";
i18n.SpecIF_includes = "inclures";
i18n.SpecIF_excludes = "exclures";
i18n.SpecIF_mentions = "�voque";
i18n.SpecIF_sameAs =
i18n.owl_sameAs = "est identique �";
i18n.SpecIF_Id = i18n.LblIdentifier;
i18n.SpecIF_Type = i18n.LblType;
i18n.SpecIF_Notation = "Notation";
//i18n.SpecIF_Stereotype = 
//i18n.SpecIF_SubClass = "Sous-classe";
i18n.SpecIF_Category = i18n.LblCategory;
i18n.SpecIF_Status = i18n.LblState;
i18n.SpecIF_State = i18n.LblState;			// DEPRECATED
i18n.SpecIF_Priority = i18n.LblPriority;
i18n.SpecIF_Milestone = "Jalon";
i18n.SpecIF_DueDate = "D�lai";
i18n.SpecIF_Icon = "Symbole";
i18n.SpecIF_Tag = "Mot-cl�";
i18n.SpecIF_Tags = "Mots-cl�s";
//i18n.SpecIF_Creation = "";
i18n.SpecIF_Instantiation = "Instanciation";
i18n.SpecIF_Origin = "Origine";
i18n.SpecIF_Source = i18n.LblSource;
i18n.SpecIF_Target = i18n.LblTarget;
//i18n.SpecIF_Author = "Auteur";
//i18n.SpecIF_Authors = "Auteurs";
i18n.IREB_Stakeholder = "Stakeholder";
i18n.SpecIF_Responsible = "Responsable";
i18n.SpecIF_Responsibles = "Responsables";
// attribute names used by the Interaction Room:
i18n.IR_Annotation = "Annotation";
i18n.IR_refersTo = i18n.SpecIF_refersTo;
i18n.IR_approves = "approves";
i18n.IR_opposes = "retoques";
i18n.IR_inheritsFrom = i18n.SpecIF_inheritsFrom;
// for oem-supplier agreement as defined by the "Hersteller-Initiative-Software":
i18n.HIS_OemStatus = 'OEM-Status';
i18n.HIS_OemComment = 'OEM-Comment';
i18n.HIS_SupplierStatus = 'Supplier-Status';
i18n.HIS_SupplierComment = 'Supplier-Comment';
// attribute names used by DocBridge Resource Director:
i18n.DBRD_ChapterName = 'Titre';
i18n.DBRD_Name = 'Titre';
i18n.DBRD_Text = 'Texte';
// attribute names used by Atego Exerpt with RIF 1.1a:
i18n.Object_Heading = i18n.ReqIF_Name;
i18n.VALUE_Object_Heading = i18n.ReqIF_Name;
i18n.Object_Text = i18n.ReqIF_Text;
i18n.VALUE_Object_Text = i18n.ReqIF_Text;
i18n.Object_ID = i18n.ReqIF_ForeignID;
i18n.VALUE_Object_ID = i18n.ReqIF_ForeignID;

// Messages:
i18n.MsgConfirm = "Confirmez, s'il vous pla�t:";
i18n.MsgConfirmDeletion = "Effacer '~A'?";
i18n.MsgConfirmObjectDeletion = "Effacer la ressource '<b>~A</b>' ?";
i18n.MsgConfirmUserDeletion = "Effacer l'utilisateur '<b>~A</b>' ?";
i18n.MsgConfirmProjectDeletion = "Effacer le projet '<b>~A</b>' ?";
i18n.MsgConfirmSpecDeletion = "Effacer l'arborescence '<b>~A</b>' avec tout les references de ressource?";
i18n.MsgConfirmRoleDeletion = "Effacer le r�le '<b>~A</b>' ?";
i18n.MsgConfirmFolderDeletion = "Effacer le dossier '<b>~A</b>' ?";
i18n.MsgInitialLoading = "T�l�chargement de l'indexe en cours ...";
i18n.MsgNoProject = 'Aucun projet trouv�.';
i18n.MsgNoUser = 'Aucun utilisateur trouv�.';
i18n.MsgNoObject = 'Aucune ressource choisi.';
i18n.MsgOtherProject = "Response tardive; entre temps, un autre projet a �t� choisi.";
i18n.MsgWaitPermissions = 'T�l�chargement des autorisations en cours ...';
i18n.MsgImportReqif = "Types de fichiers valides: *.reqifz, *.reqif, *.zip et *.xml. Le contenu doit correspondre au sch�ma ReqIF 1.0+, RIF 1.1a ou RIF 1.2. Le t�l�chargement peut durer quelques minutes dans le cas de tr�s gros fichiers.";
i18n.MsgImportSpecif = "Types de fichiers valides: *.specifz et *.specif. Le contenu doit correspondre au sch�ma SpecIF 0.10.4+. En cas de tr�s gros fichiers, le t�l�chargement peut durer quelques minutes.";
i18n.MsgImportBpmn = "Type de fichier valide est *.bpmn. Le contenu doit correspondre au sch�ma BPMN 2.0 XML. Le t�l�chargement peut durer quelques minutes.";
i18n.MsgImportXls = "Types de fichiers valides: *.xls, *.xlsx et *.csv. Le t�l�chargement peut durer quelques minutes dans le cas de tr�s gros fichiers.";
i18n.MsgExport = "Un fichier zip-comprim� au format choisi sera cr��. Le t�l�chargement peut durer quelques minutes dans le cas de tr�s gros projets; le navigateur va enregistrer le fichier comme configur�.";
i18n.MsgLoading = 'T�l�chargement en cours ...';
i18n.MsgSearching = 'Recherche en cours ...';
i18n.MsgObjectsProcessed = '~A ressources analys�. ';
i18n.MsgObjectsFound = '~A ressources trouv�.';
i18n.MsgNoMatchingObjects = 'Aucune ressource trouv�.';
i18n.MsgNoRelatedObjects = "Cette ressource n'a pas d'affirmations.";
i18n.MsgNoComments = "Cette ressource n'a pas de commentaires.";
i18n.MsgNoFiles = 'Aucun fichier trouv�.';
i18n.MsgAnalyzing = 'Analyse en cours ...';
i18n.MsgNoReports = 'Aucun rapport pour ce projet.';
i18n.MsgTypeNoObjectType = "Ajoutez au moins un type de ressource, sinon il est impossible de cr�er une ressource.";
i18n.MsgTypeNoAttribute = "Ajoutez au moins un attribut, sinon le type n'est pas utile.";
i18n.MsgNoObjectTypeForManualCreation = "Les ressources ne peuvent pas �tre cr��s, parce que vous n'avez pas de permission ou parce que il n'y a pas de type de ressource pouvant �tre cr�� manuellement.";
i18n.MsgFilterClogged = "Filtre tr�p restreint - au moins un crit�re n'est peut pas �tre rempli.";
i18n.MsgCredentialsUnknown = 'Utilisateur inconnu ou mot de passe erron�.';
i18n.MsgUserMgmtNeedsAdminRole = "Adressez-vous � l'administrateur pour g�rer les utilisateurs et leur r�le.";
i18n.MsgProjectMgmtNeedsAdminRole = "Adressez-vous � l'administrateur pour g�rer les projets, leurs utilisateurs et autorisations.";
i18n.MsgImportSuccessful = "Importation de '~A' achev�e.";
i18n.MsgImportDenied = "Import refus�: Le projet '~A' est en cours d'utilisation ou le schema n'est pas respect�.";
i18n.MsgImportFailed = "Import interrompu � cause d'une erreur.";
i18n.MsgImportAborted = "Import interrompu par l'utilisateur.";
i18n.MsgChooseRoleName = "Choisissez un nom de r�le, s'il vous pla�t:";
i18n.MsgIdConflict = "Existe d�ja - '~A' ne peut pas �tre cr��.";
i18n.MsgRoleNameConflict = "Existe d�ja - r�le '~A' ne peut pas �tre cr��.";
i18n.MsgUserNameConflict = "Existe d�ja - l'utilisateur '~A' ne peut pas �tre cr��.";
i18n.MsgFileApiNotSupported = "Ce navigateur ne permet pas l'acc�s aux fichiers. Choisissez un navigateur plus r�cent.";
i18n.MsgDoNotLoadAllObjects = "Il n'est pas recommand� de charger tous les ressources en une seule demande.";
i18n.MsgReading = "Lire";
i18n.MsgCreating = "Cr�er";
i18n.MsgUploading = "Transmettre";
i18n.MsgImporting = "Importer";
i18n.MsgBrowserSaving = "Le navigateur enregistres le fichier comme configur�.";
i18n.MsgSuccess = "Succ�s!";
i18n.MsgSelectImg = "Choisissez ou chargez un image:";
i18n.MsgImgWidth = "Largeur de l'image [px]";
i18n.MsgNoEligibleRelTypes = "Aucune affirmation d�fini pour ce type de ressource.";
i18n.MsgClickToNavigate = "Double-cliquer une ressource pour y naviguer:";
i18n.MsgClickToDeleteRel = "Double-cliquer une ressource pour supprimer l'affirmation respective:";
i18n.MsgNoSpec = "Aucune arborescence trouv�.";
i18n.MsgTypesCommentCreated = 'Les types pour commentaires ont �t� cr��s.';
i18n.MsgOutlineAdded = "L'arborescence � �t� ajout�e au debut - consolidez l'existante avec la nouvelle, si vous desirez";
i18n.MsgLoadingTypes = 'Transmets types';
i18n.MsgLoadingFiles = 'Transmets images et fichiers';
i18n.MsgLoadingObjects = 'Transmets ressources';
i18n.MsgLoadingRelations = 'Transmets affirmations';
i18n.MsgLoadingHierarchies = "Transmets l'arborescences";
i18n.MsgProjectCreated = 'Projet cr� avec succes';
i18n.MsgProjectUpdated = 'Project mis � jour avec succes';
i18n.MsgNoneSpecified = 'vide';

// Error messages:
i18n.Error = "Erreur";
i18n.Err403Forbidden = "Vous n'avez pas les permissions requises pour cet information.";
i18n.Err403NoProjectFolder = 'Votre r�le ne permet pas de mettre � jour au moins un projet concern�.';
//i18n.Err403NoProjectUpdate = 'Votre r�le ne permet pas de mettre � jour ce projet.';
i18n.Err403NoProjectDelete = "Votre r�le ne permet pas d'effacer ce projet.";
i18n.Err403NoUserDelete = "Votre r�le ne permet pas d'effacer des utilisateurs.";
i18n.Err403NoRoleDelete = "Votre r�le ne permet pas d'effacer des r�les.";
i18n.Err404NotFound = "�lement n'a pas �t� trouv�.";
i18n.ErrNoItem = "�lement '~A' n'a pas �t� trouv�.";
i18n.ErrNoObject = "Ressource '~A' n'a pas �t� trouv�.";
i18n.ErrNoSpec = "Ce projet n'a pas d'arborescence; il faut en cr�er au moins une.";
i18n.ErrInvalidFile = 'Fichier non valide ou erron�.';
i18n.ErrInvalidFileType = "Type de fichier '~A' non valide.";
i18n.ErrInvalidAttachment = "Type de fichier non valide. Choisissez entre ~A.";
i18n.ErrInvalidFileReqif = "Type de fichier '~A' non valide. Choisissez '*.reqifz', '*.reqif', '*.zip' ou '*.xml'.";
i18n.ErrInvalidFileSpecif = "Type de fichier '~A' non valide. Choisissez '*.specifz' ou '*.specif'.";
i18n.ErrInvalidFileBpmn = "Type de fichier '~A' non valide. Choisissez '*.bpmn'.";
i18n.ErrInvalidFileXls = "Type de fichier '~A' non valide. Choisissez '*.xlsx', '*.xls', ou '*.csv'.";
//i18n.ErrInvalidFileElic = "Type de fichier '~A' non valide. Choisissez '*.elic_signed.xml'.";
i18n.ErrUpload = 'Erreur pendant le t�l�chargement.';
i18n.ErrImport = "Erreur pendant l'import.";
i18n.ErrImportTimeout = "Temps limite d�pass� lors de l'import.";
i18n.ErrCommunicationTimeout = "Temps limite d�pass� lors de demande de serveur";
i18n.ErrInvalidData = 'Donn�es nocives ou non valides.';
i18n.ErrInvalidContent = 'Donn�es non valides; tr�s probablement contenu nocif ou structure XHTML erron�e.';
i18n.ErrInvalidRoleName = "Nom de r�le '~A' non valide.";
i18n.ErrUpdateConflict = "Votre modification est en conflit avec une modification d'un autre utilisateur.";
i18n.ErrInconsistentPermissions = "Les permissions sont contradictoires, s'il vous pla�t contactez l'administrateur.";
i18n.ErrObjectNotEligibleForRelation = "Cettes ressources ne peuvent pas �tre reli�es avec l'affirmation choisie.";
i18n.Err400TypeIsInUse = "Impossible d'effacer ce type, parce qu'il est utilis�."
i18n.Err402InsufficientLicense = "La license d�pos�e ne suffit pas pour cette op�ration.";

i18n.monthNames = ['janvier', 'f�vrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'ao�t', 'septembre', 'octobre', 'novembre', 'd�cembre' ];
//i18n.monthAbbrs = ['janv.', 'f�vr.', 'mars', 'avr.', 'mai', 'juin', 'juill.', 'ao�t', 'sept.', 'oct.', 'nov.', 'd�c.' ];

// App icons and titles:
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
i18n.LblHome = 'Bienvenue!';
i18n.LblProjects = 'Projets';
i18n.LblSystemAdministration = 'Configuration';
i18n.LblUserAdministration = 'Utilisateurs';
i18n.LblProjectAdministration = 'Types & Permissions';   // for the browser tabs - no HTML!
i18n.LblSpecifications = 'Contenu';
i18n.LblReader = 'Lecteur SpecIF';
i18n.LblLocal = 'Editeur SpecIF';
i18n.LblSupport = 'Support';
i18n.AppHome = i18n.IcoHome+'&#160;'+i18n.LblHome;
i18n.AppSystemAdministration = i18n.IcoSystemAdministration+'&#160;Sp�cification interactive: '+i18n.LblSystemAdministration;
i18n.AppUserAdministration = i18n.IcoUserAdministration+'&#160;Sp�cification interactive: '+i18n.LblUserAdministration;
i18n.AppProjectAdministration = i18n.IcoProjectAdministration+'&#160;Sp�cification interactive: '+i18n.LblProjectAdministration;
i18n.AppSpecifications = i18n.IcoSpecifications+'&#160;Sp�cification interactive: '+i18n.LblSpecifications;
i18n.AppReader = i18n.IcoReader+'&#160;'+i18n.LblReader;
i18n.AppImport = i18n.IcoImport+'&#160;Import';
i18n.AppLocal = i18n.IcoSpecifications+'&#160;'+i18n.LblLocal;
i18n.AppSupport = i18n.IcoSupport+'&#160;'+i18n.LblSupport;
