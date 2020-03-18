/* 	Provide i18ns and messages in a certain language, in this case 'Français' (fr).
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
i18n.LblCreate = 'Créer';
i18n.LblRead = 'Lire';
i18n.LblUpdate = 'Mettre à jour';
i18n.LblUpdateProject = "Mettre à jour les attributs du projet";
i18n.LblUpdateSpec = "Mettre à jour les attributs de l'arborescence";
i18n.LblUpdateTypes = 'Mettre à jour les types & permissions';
i18n.LblUpdateObject = "Mettre à jour cette ressource";
i18n.LblDelete = 'Effacer';
i18n.LblDeleteProject = 'Effacer ce project';
i18n.LblDeleteType = 'Effacer ce type';
i18n.LblDeleteObject = 'Effacer cette ressource';
i18n.LblDeleteAttribute = 'Effacer cet attribut';
i18n.LblDeleteRelation = 'Effacer cette affirmation';
i18n.LblDeleteRole = 'Effacer ce rôle';
i18n.LblSaveRelationAsSource = 'Relier ressource comme '+LblSource;
i18n.LblSaveRelationAsTarget = 'Relier ressource comme '+LblTarget;
i18n.LblAdd = 'Créer';
i18n.LblAddItem = 'Créer ~A';
i18n.LblAddProject = "Créer un projet";
i18n.LblAddType = "Créer un type";
i18n.LblAddDataType = "Créer un type de données";
i18n.LblAddObjType = "Créer un type de ressources";
i18n.LblAddRelType = "Créer un type d'affirmations";
i18n.LblAddSpcType = "Créer un type d'arborescence";
i18n.LblAddTypeComment = 'Créer les types pour commentaires';
i18n.LblAddObject = "Créer une ressource";
i18n.LblAddRelation = "Créer une affirmation";
i18n.LblAddAttribute = "Créer un attribut";
i18n.LblAddUser = "Créer un utilisateur";
i18n.LblAddComment = 'Commenter';
i18n.LblAddCommentTo = "Ajouter un commentaire à '~A':";
i18n.LblAddCommentToObject = 'Commenter cette ressource';
i18n.LblAddFolder = "Créer un dossier";
i18n.LblAddSpec = "Créer une arborescence";
i18n.LblClone = 'Cloner';
i18n.LblCloneObject = 'Cloner cette ressource';
i18n.LblCloneType = 'Cloner ce type';
i18n.LblCloneSpec = 'Cloner cet arborescence';
i18n.LblUserName = "Nom d'utilisateur";
i18n.LblPassword = 'Mot de passe';
i18n.LblTitle = 'Titre';
i18n.LblProject = 'Projet';
i18n.LblName = 'Nom';
i18n.LblFirstName = 'Prénom';
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
i18n.LblPriority = 'Priorité';
i18n.LblCategory = 'Catégorie';
i18n.LblAttribute = 'Attribut';
i18n.LblAttributes = 'Attributs';
i18n.LblAttributeValueRange = "Plage de valeurs";
i18n.LblAttributeValues = "Valeurs";
i18n.LblAttributeValue = "Valeur";
i18n.LblTool = "Outil auteur";
i18n.LblMyRole = 'Mon rôle';
i18n.LblRevision = 'Révision';
i18n.LblCreatedAt = 'Créé le';
i18n.LblCreatedBy = 'Créé par';
i18n.LblCreatedThru = 'Créé par';
i18n.LblModifiedAt = 'Modifié le';
i18n.LblModifiedBy = 'Modifié par';
i18n.LblProjectDetails = 'Attributs';
i18n.LblProjectUsers = '<span class="glyphicon glyphicon-user"/>&#160;Utilisateur de ce projet';
i18n.LblOtherUsers = 'Autres utilisateurs';
i18n.LblUserProjects = '<span class="glyphicon glyphicon-book"/>&#160;Projets de cet utilisateur';
i18n.LblOtherProjects = 'Autres projets';
i18n.LblType = 'Type';
i18n.LblTypes = 'Types';
i18n.LblDataTypes = 'Types de données';
i18n.LblDataType = 'Type de données';
i18n.LblDataTypeTitle = 'Nom de type de données';
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
i18n.LblSecondaryFiltersForObjects = i18n.IcoFilter+"&#160;Filtres à facette pour '~A'";
i18n.LblPermissions = 'Autorisations';
i18n.LblRoles = 'Rôles';
i18n.LblFormat = 'Format';
i18n.LblFileFormat = 'Format de fichier';
i18n.LblStringMatch = '<span class="glyphicon glyphicon-text-background" />&#160;Recherche de texte';
i18n.LblWordBeginnings = 'Seulement mots commençant par';
i18n.LblWholeWords = 'Seulement mots entiers';
i18n.LblCaseSensitive = 'Respecter majuscules et minuscules';
i18n.LblExcludeEnums = 'Ignorer énumérateurs';
i18n.LblNotAssigned = '(sans attribution de valeur)';
i18n.LblPrevious = 'Dernier';
i18n.LblNext = 'Prochain';
i18n.LblGo = 'Démarrer';
i18n.LblAll = 'Tous';
i18n.LblHitCount = 'Score';
i18n.LblRelateAs = "Relier comme";
i18n.LblSource = "Sujet";
i18n.LblTarget = "Objet";
i18n.LblEligibleSources = "Ressources éligible comme "+i18n.LblSource;
i18n.LblEligibleTargets = "Ressources éligible comme "+i18n.LblTarget;
i18n.LblIcon = 'Symbole';
i18n.LblCreation = 'Création';
i18n.LblCreateLink1 = "&#x2776;&#160;Affirmation désirée";
i18n.LblCreateLink2 = "&#x2777;&#160;Ressource à relier";
i18n.LblReferences = "Références";
i18n.LblInherited = "hérité";
i18n.LblMaxLength = "Longueur max.";
i18n.LblMinValue = "Valeur min.";
i18n.LblMaxValue = "Valeur max.";
i18n.LblAccuracy = "Décimales";
i18n.LblEnumValues = "Valeurs (sép. par virgules)";
i18n.LblSingleChoice = "Choix unique";
i18n.LblMultipleChoice = "Choix multiple";
i18n.LblDirectLink = "Lien direct";

i18n.BtnLogin = '<span class="glyphicon glyphicon-log-in"/>&#160;Se connecter';
i18n.BtnLogout = '<span class="glyphicon glyphicon-log-out"/>&#160;Se déconnecter';
i18n.BtnProfile = 'Profile';
i18n.BtnBack = 'Retour';
i18n.BtnCancel = 'Annuler';
i18n.BtnCancelImport = "Interrompre";
i18n.BtnApply = 'Appliquer';
i18n.BtnDelete = '<span class="glyphicon glyphicon-remove"/>&#160;Effacer';
i18n.BtnDeleteObject = '<span class="glyphicon glyphicon-remove"/>&#160;Effacer la ressource avec ses references';
i18n.BtnDeleteObjectRef = '<span class="glyphicon glyphicon-remove"/>&#160;Effacer cette reference de ressource';
i18n.BtnImport = '<span class="glyphicon glyphicon-import"/>&#160;Importer';
i18n.BtnCreate = '<span class="glyphicon glyphicon-import"/>&#160;Créer';
i18n.BtnReplace = '<span class="glyphicon glyphicon-import"/>&#160;Remplacer';
i18n.BtnAdopt = '<span class="glyphicon glyphicon-import"/>&#160;Adopter';
i18n.BtnUpdate = '<span class="glyphicon glyphicon-import"/>&#160;'+i18n.LblUpdate;
//i18n.BtnImportSpecif = '<span class="glyphicon glyphicon-import"/>&#160;SpecIF';
//i18n.BtnImportReqif = '<span class="glyphicon glyphicon-import"/>&#160;ReqIF';
//i18n.BtnImportXls = '<span class="glyphicon glyphicon-import"/>&#160;xlsx';
//i18n.BtnProjectFromTemplate = "Créer un projet avec métadonnées ReqIF";
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
i18n.BtnSaveRole = '<span class="glyphicon glyphicon-save"/>&#160;Enregistrer rôle';
i18n.BtnSaveAttr = '<span class="glyphicon glyphicon-save"/>&#160;Enregistrer attribut';
i18n.BtnInsert = '<span class="glyphicon glyphicon-save"/>&#160;Enregistrer';
i18n.BtnInsertSuccessor = '<span class="glyphicon glyphicon-save"/>&#160;Enregistrer après';
i18n.BtnInsertChild = '<span class="glyphicon glyphicon-save"/>&#160;Enregistrer en dessous';
i18n.BtnSaveRelation = '<span class="glyphicon glyphicon-save"/>&#160;Enregistrer affirmation';
i18n.BtnSaveItem = '<span class="glyphicon glyphicon-save"/>&#160;Enregistrer ~A';
i18n.BtnDetails = 'Détails';
i18n.BtnAddRole = '<span class="glyphicon glyphicon-plus" />&#160;Rôle';
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
//i18n.TabProjectDetails = '<span class="glyphicon glyphicon-pencil"/>&#160;Attributs';  // métadonnées
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
i18n.TabRevisions = '<span class="glyphicon glyphicon-grain"/>&#160;Révisions';
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
//i18n.FnProjectFromTemplate = '<span class="glyphicon glyphicon-plus"/>&#160;Projet avec métadonnées';
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
i18n.ReqIF_Prefix = 'Préfixe';
i18n.ReqIF_FitCriteria = "Critères d'acceptation";
i18n.ReqIF_AssociatedFiles = 'Fichiers';
i18n.ReqIF_ChapterNumber = 'Numéro de chapitre';   // shouldn't be used, as an object cannot (should not) know its position in the outline
// Dublin Core (DCMI) attribute names:
i18n.DC_title =
i18n.dcterms_title = "Titre";
i18n.DC_description =
i18n.dcterms_description = "Description";
i18n.DC_identifier =
i18n.dcterms_identifier = i18n.LblIdentifier;
i18n.DC_type =
i18n.dcterms_type = "Type d'élément";
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
i18n.oslc_rm_validatedBy = "est validé de";
//i18n.oslc_rm_decomposes = "decomposes";
//i18n.oslc_rm_decomposedBy = "is decomposed by";
//i18n.oslc_rm_constrainedBy = "";
//i18n.oslc_rm_constrains = "";
// SpecIF entity, relation and attribute names
i18n.SpecIF_Heading = "Intitulé";
i18n.SpecIF_Headings = "Intitulés";
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
i18n.FMC_State = "état";
i18n.FMC_States = "états";
i18n.FMC_Event = "évenement";
i18n.FMC_Events = "évenements";
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
i18n.SpecIF_Issue = "Problème";
i18n.SpecIF_Issues = "Problèmes";
i18n.SpecIF_Outline =
i18n.SpecIF_Hierarchy = "Arborescence";
i18n.SpecIF_Outlines =
i18n.SpecIF_Hierarchies = "Arborescences";
i18n.SpecIF_Glossary = "élements de modèle (Glossaire)";
i18n.SpecIF_Annotations = "Annotations";
i18n.SpecIF_Vote = "Evaluation";
i18n.SpecIF_Votes = "Evaluations";
i18n.SpecIF_Effort = "Effort";
i18n.SpecIF_Risk = 
i18n.IREB_Risk = "Risque";
i18n.SpecIF_Benefit = "Bénéfice";
i18n.SpecIF_Damage = "Dommage";
i18n.SpecIF_Probability = "Probabilité";
i18n.SpecIF_shows = "montre";
i18n.SpecIF_contains = "contient";
i18n.oslc_rm_satisfiedBy = "satisfait par";
i18n.oslc_rm_satisfies =
i18n.SpecIF_satisfies =
i18n.IREB_satisfies = "satisfait";
i18n.SpecIF_implements = "realise";
i18n.SpecIF_modifies =
i18n.SpecIF_stores = "écrit et lit";
i18n.SpecIF_reads = "lit";
i18n.SpecIF_writes = "écrit";
i18n.SpecIF_sendsTo = "émets à";
i18n.SpecIF_receivesFrom = "reçoit de";
i18n.SpecIF_influences = "influence";
i18n.SpecIF_follows = "succèdes à";
i18n.SpecIF_precedes = "precède";
i18n.SpecIF_signals = "signale";
i18n.SpecIF_triggers = "déclenche";
i18n.SpecIF_dependsOn = "depend de";
i18n.SpecIF_refines =
i18n.IREB_refines = "affine";
i18n.IREB_refinedBy = "est affiné de";
i18n.SpecIF_duplicates = "reprend";
i18n.SpecIF_contradicts = "contredit";
i18n.SpecIF_isAssociatedWith =
i18n.SysML_isAssociatedWith = "est associé avec";
i18n.SysML_isAllocatedTo = "est éxecuté par";
i18n.SpecIF_isSynonymOf = "est synonyme de";
i18n.SysML_includes = "inclut";
i18n.SysML_extends = "élargit";
i18n.SpecIF_isDerivedFrom = 
i18n.SysML_isDerivedFrom = "est dérivé de";
i18n.SysML_isComposedOf = "est composé de";
i18n.SysML_isAggregatedBy = "est aggregé de";
i18n.SysML_isGeneralisationOf = "est generalisé de";
i18n.SysML_isSpecialisationOf = "est specialisé de";
i18n.SpecIF_isInverseOf = "est l'inverse de";
i18n.SpecIF_inheritsFrom = "hérite de";
i18n.SpecIF_refersTo = "concerne";
i18n.SpecIF_commentRefersTo = "concerne";
i18n.SpecIF_issueRefersTo = "concerne";
i18n.SpecIF_includes = "inclures";
i18n.SpecIF_excludes = "exclures";
i18n.SpecIF_mentions = "évoque";
i18n.SpecIF_sameAs =
i18n.owl_sameAs = "est identique à";
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
i18n.SpecIF_DueDate = "Délai";
i18n.SpecIF_Icon = "Symbole";
i18n.SpecIF_Tag = "Mot-clé";
i18n.SpecIF_Tags = "Mots-clés";
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
i18n.MsgConfirm = "Confirmez, s'il vous plaît:";
i18n.MsgConfirmDeletion = "Effacer '~A'?";
i18n.MsgConfirmObjectDeletion = "Effacer la ressource '<b>~A</b>' ?";
i18n.MsgConfirmUserDeletion = "Effacer l'utilisateur '<b>~A</b>' ?";
i18n.MsgConfirmProjectDeletion = "Effacer le projet '<b>~A</b>' ?";
i18n.MsgConfirmSpecDeletion = "Effacer l'arborescence '<b>~A</b>' avec tout les references de ressource?";
i18n.MsgConfirmRoleDeletion = "Effacer le rôle '<b>~A</b>' ?";
i18n.MsgConfirmFolderDeletion = "Effacer le dossier '<b>~A</b>' ?";
i18n.MsgInitialLoading = "Téléchargement de l'indexe en cours ...";
i18n.MsgNoProject = 'Aucun projet trouvé.';
i18n.MsgNoUser = 'Aucun utilisateur trouvé.';
i18n.MsgNoObject = 'Aucune ressource choisi.';
i18n.MsgOtherProject = "Response tardive; entre temps, un autre projet a été choisi.";
i18n.MsgWaitPermissions = 'Téléchargement des autorisations en cours ...';
i18n.MsgImportReqif = "Types de fichiers valides: *.reqifz, *.reqif, *.zip et *.xml. Le contenu doit correspondre au schéma ReqIF 1.0+, RIF 1.1a ou RIF 1.2. Le téléchargement peut durer quelques minutes dans le cas de très gros fichiers.";
i18n.MsgImportSpecif = "Types de fichiers valides: *.specifz et *.specif. Le contenu doit correspondre au schéma SpecIF 0.10.4+. En cas de très gros fichiers, le téléchargement peut durer quelques minutes.";
i18n.MsgImportBpmn = "Type de fichier valide est *.bpmn. Le contenu doit correspondre au schéma BPMN 2.0 XML. Le téléchargement peut durer quelques minutes.";
i18n.MsgImportXls = "Types de fichiers valides: *.xls, *.xlsx et *.csv. Le téléchargement peut durer quelques minutes dans le cas de très gros fichiers.";
i18n.MsgExport = "Un fichier zip-comprimé au format choisi sera créé. Le téléchargement peut durer quelques minutes dans le cas de très gros projets; le navigateur va enregistrer le fichier comme configuré.";
i18n.MsgLoading = 'Téléchargement en cours ...';
i18n.MsgSearching = 'Recherche en cours ...';
i18n.MsgObjectsProcessed = '~A ressources analysé. ';
i18n.MsgObjectsFound = '~A ressources trouvé.';
i18n.MsgNoMatchingObjects = 'Aucune ressource trouvé.';
i18n.MsgNoRelatedObjects = "Cette ressource n'a pas d'affirmations.";
i18n.MsgNoComments = "Cette ressource n'a pas de commentaires.";
i18n.MsgNoFiles = 'Aucun fichier trouvé.';
i18n.MsgAnalyzing = 'Analyse en cours ...';
i18n.MsgNoReports = 'Aucun rapport pour ce projet.';
i18n.MsgTypeNoObjectType = "Ajoutez au moins un type de ressource, sinon il est impossible de créer une ressource.";
i18n.MsgTypeNoAttribute = "Ajoutez au moins un attribut, sinon le type n'est pas utile.";
i18n.MsgNoObjectTypeForManualCreation = "Les ressources ne peuvent pas être créés, parce que vous n'avez pas de permission ou parce que il n'y a pas de type de ressource pouvant être créé manuellement.";
i18n.MsgFilterClogged = "Filtre trôp restreint - au moins un critère n'est peut pas être rempli.";
i18n.MsgCredentialsUnknown = 'Utilisateur inconnu ou mot de passe erroné.';
i18n.MsgUserMgmtNeedsAdminRole = "Adressez-vous à l'administrateur pour gérer les utilisateurs et leur rôle.";
i18n.MsgProjectMgmtNeedsAdminRole = "Adressez-vous à l'administrateur pour gérer les projets, leurs utilisateurs et autorisations.";
i18n.MsgImportSuccessful = "Importation de '~A' achevée.";
i18n.MsgImportDenied = "Import refusé: Le projet '~A' est en cours d'utilisation ou le schema n'est pas respecté.";
i18n.MsgImportFailed = "Import interrompu à cause d'une erreur.";
i18n.MsgImportAborted = "Import interrompu par l'utilisateur.";
i18n.MsgChooseRoleName = "Choisissez un nom de rôle, s'il vous plaît:";
i18n.MsgIdConflict = "Existe déja - '~A' ne peut pas être créé.";
i18n.MsgRoleNameConflict = "Existe déja - rôle '~A' ne peut pas être créé.";
i18n.MsgUserNameConflict = "Existe déja - l'utilisateur '~A' ne peut pas être créé.";
i18n.MsgFileApiNotSupported = "Ce navigateur ne permet pas l'accès aux fichiers. Choisissez un navigateur plus récent.";
i18n.MsgDoNotLoadAllObjects = "Il n'est pas recommandé de charger tous les ressources en une seule demande.";
i18n.MsgReading = "Lire";
i18n.MsgCreating = "Créer";
i18n.MsgUploading = "Transmettre";
i18n.MsgImporting = "Importer";
i18n.MsgBrowserSaving = "Le navigateur enregistres le fichier comme configuré.";
i18n.MsgSuccess = "Succès!";
i18n.MsgSelectImg = "Choisissez ou chargez un image:";
i18n.MsgImgWidth = "Largeur de l'image [px]";
i18n.MsgNoEligibleRelTypes = "Aucune affirmation défini pour ce type de ressource.";
i18n.MsgClickToNavigate = "Double-cliquer une ressource pour y naviguer:";
i18n.MsgClickToDeleteRel = "Double-cliquer une ressource pour supprimer l'affirmation respective:";
i18n.MsgNoSpec = "Aucune arborescence trouvé.";
i18n.MsgTypesCommentCreated = 'Les types pour commentaires ont été créés.';
i18n.MsgOutlineAdded = "L'arborescence à été ajoutée au debut - consolidez l'existante avec la nouvelle, si vous desirez";
i18n.MsgLoadingTypes = 'Transmets types';
i18n.MsgLoadingFiles = 'Transmets images et fichiers';
i18n.MsgLoadingObjects = 'Transmets ressources';
i18n.MsgLoadingRelations = 'Transmets affirmations';
i18n.MsgLoadingHierarchies = "Transmets l'arborescences";
i18n.MsgProjectCreated = 'Projet cré avec succes';
i18n.MsgProjectUpdated = 'Project mis à jour avec succes';
i18n.MsgNoneSpecified = 'vide';

// Error messages:
i18n.Error = "Erreur";
i18n.Err403Forbidden = "Vous n'avez pas les permissions requises pour cet information.";
i18n.Err403NoProjectFolder = 'Votre rôle ne permet pas de mettre à jour au moins un projet concerné.';
//i18n.Err403NoProjectUpdate = 'Votre rôle ne permet pas de mettre à jour ce projet.';
i18n.Err403NoProjectDelete = "Votre rôle ne permet pas d'effacer ce projet.";
i18n.Err403NoUserDelete = "Votre rôle ne permet pas d'effacer des utilisateurs.";
i18n.Err403NoRoleDelete = "Votre rôle ne permet pas d'effacer des rôles.";
i18n.Err404NotFound = "élement n'a pas été trouvé.";
i18n.ErrNoItem = "élement '~A' n'a pas été trouvé.";
i18n.ErrNoObject = "Ressource '~A' n'a pas été trouvé.";
i18n.ErrNoSpec = "Ce projet n'a pas d'arborescence; il faut en créer au moins une.";
i18n.ErrInvalidFile = 'Fichier non valide ou erroné.';
i18n.ErrInvalidFileType = "Type de fichier '~A' non valide.";
i18n.ErrInvalidAttachment = "Type de fichier non valide. Choisissez entre ~A.";
i18n.ErrInvalidFileReqif = "Type de fichier '~A' non valide. Choisissez '*.reqifz', '*.reqif', '*.zip' ou '*.xml'.";
i18n.ErrInvalidFileSpecif = "Type de fichier '~A' non valide. Choisissez '*.specifz' ou '*.specif'.";
i18n.ErrInvalidFileBpmn = "Type de fichier '~A' non valide. Choisissez '*.bpmn'.";
i18n.ErrInvalidFileXls = "Type de fichier '~A' non valide. Choisissez '*.xlsx', '*.xls', ou '*.csv'.";
//i18n.ErrInvalidFileElic = "Type de fichier '~A' non valide. Choisissez '*.elic_signed.xml'.";
i18n.ErrUpload = 'Erreur pendant le téléchargement.';
i18n.ErrImport = "Erreur pendant l'import.";
i18n.ErrImportTimeout = "Temps limite dépassé lors de l'import.";
i18n.ErrCommunicationTimeout = "Temps limite dépassé lors de demande de serveur";
i18n.ErrInvalidData = 'Données nocives ou non valides.';
i18n.ErrInvalidContent = 'Données non valides; très probablement contenu nocif ou structure XHTML erronée.';
i18n.ErrInvalidRoleName = "Nom de rôle '~A' non valide.";
i18n.ErrUpdateConflict = "Votre modification est en conflit avec une modification d'un autre utilisateur.";
i18n.ErrInconsistentPermissions = "Les permissions sont contradictoires, s'il vous plaît contactez l'administrateur.";
i18n.ErrObjectNotEligibleForRelation = "Cettes ressources ne peuvent pas être reliées avec l'affirmation choisie.";
i18n.Err400TypeIsInUse = "Impossible d'effacer ce type, parce qu'il est utilisé."
i18n.Err402InsufficientLicense = "La license déposée ne suffit pas pour cette opération.";

i18n.monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre' ];
//i18n.monthAbbrs = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juill.', 'août', 'sept.', 'oct.', 'nov.', 'déc.' ];

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
i18n.AppSystemAdministration = i18n.IcoSystemAdministration+'&#160;Spécification interactive: '+i18n.LblSystemAdministration;
i18n.AppUserAdministration = i18n.IcoUserAdministration+'&#160;Spécification interactive: '+i18n.LblUserAdministration;
i18n.AppProjectAdministration = i18n.IcoProjectAdministration+'&#160;Spécification interactive: '+i18n.LblProjectAdministration;
i18n.AppSpecifications = i18n.IcoSpecifications+'&#160;Spécification interactive: '+i18n.LblSpecifications;
i18n.AppReader = i18n.IcoReader+'&#160;'+i18n.LblReader;
i18n.AppImport = i18n.IcoImport+'&#160;Import';
i18n.AppLocal = i18n.IcoSpecifications+'&#160;'+i18n.LblLocal;
i18n.AppSupport = i18n.IcoSupport+'&#160;'+i18n.LblSupport;
