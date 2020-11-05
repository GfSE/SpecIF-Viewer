/* 	Provide i18ns and messages in a certain language, in this case 'Français' (fr).
	The result can be obtained by reference of:
	- 	self.MsgText
	- phrase('MsgText')
	- phrase('MsgText', 'param')
	- In the messages defined below, '~A' can be inserted at the location where a call parameter shall be placed.
*/
function LanguageTextsFr() {
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
	self.LblAll = "Tous";
	self.LblAllObjects = "Tous les ressources";
	self.LblImport = 'Importer';
	self.LblExport = 'Exporter';
	self.LblExportReqif = 'Exporter fichier ReqIF';
	self.LblExportSpecif = 'Exporter fichier SpecIF';
	self.LblAdminister = 'Administrer';
	self.LblCreate = 'Créer';
	self.LblRead = 'Lire';
	self.LblUpdate = 'Mettre à jour';
	self.LblUpdateProject = "Mettre à jour les attributs du projet";
	self.LblUpdateSpec = "Mettre à jour les attributs de l'arborescence";
	self.LblUpdateTypes = 'Mettre à jour les types & permissions';
	self.LblUpdateObject = "Mettre à jour cette ressource";
	self.LblDelete = 'Effacer';
	self.LblDeleteProject = 'Effacer ce project';
	self.LblDeleteType = 'Effacer ce type';
	self.LblDeleteObject = 'Effacer cette ressource';
	self.LblDeleteAttribute = 'Effacer cet attribut';
	self.LblDeleteRelation = 'Effacer cette affirmation';
	self.LblDeleteRole = 'Effacer ce rôle';
	self.LblAdd = 'Créer';
	self.LblAddItem = 'Créer ~A';
	self.LblAddProject = "Créer un projet";
	self.LblAddType = "Créer un type";
	self.LblAddDataType = "Créer un type de données";
	self.LblAddObjType = "Créer un type de ressources";
	self.LblAddRelType = "Créer un type d'affirmations";
	self.LblAddSpcType = "Créer un type d'arborescence";
	self.LblAddTypeComment = 'Créer les types pour commentaires';
	self.LblAddObject = "Créer une ressource";
	self.LblAddRelation = "Créer une affirmation";
	self.LblAddAttribute = "Créer un attribut";
	self.LblAddUser = "Créer un utilisateur";
	self.LblAddComment = 'Commenter';
	self.LblAddCommentTo = "Ajouter un commentaire à '~A':";
	self.LblAddCommentToObject = 'Commenter cette ressource';
	self.LblAddFolder = "Créer un dossier";
	self.LblAddSpec = "Créer une arborescence";
	self.LblClone = 'Cloner';
	self.LblCloneObject = 'Cloner cette ressource';
	self.LblCloneType = 'Cloner ce type';
	self.LblCloneSpec = 'Cloner cet arborescence';
	self.LblUserName = "Nom d'utilisateur";
	self.LblPassword = 'Mot de passe';
	self.LblTitle = 'Titre';
	self.LblProject = 'Projet';
	self.LblName = 'Nom';
	self.LblFirstName = 'Prénom';
	self.LblLastName = 'Nom';
	self.LblOrganizations = 'Organisation';  // until multiple orgs per user are supported
	self.LblEmail = 'e-mail';
	self.LblFileName = 'Nom de fichier';
	self.LblRoleGeneralAdmin = 'GENERAL-ADMIN';
	self.LblRoleProjectAdmin = 'PROJECT-ADMIN';
	self.LblRoleUserAdmin = 'USER-ADMIN';
	self.LblRoleReader = 'READER';
//	self.LblRoleReqif = 'REQIF';
	self.LblGlobalActions = 'Actions';
	self.LblItemActions = 'Actions';
	self.LblIdentifier = "Identifiant";
	self.LblProjectName = 'Nom de projet';
	self.LblDescription = 'Description';
	self.LblState = 'Statut';
	self.LblPriority = 'Priorité';
	self.LblCategory = 'Catégorie';
	self.LblAttribute = 'Attribut';
	self.LblAttributes = 'Attributs';
	self.LblAttributeValueRange = "Plage de valeurs";
	self.LblAttributeValues = "Valeurs";
	self.LblAttributeValue = "Valeur";
	self.LblTool = "Outil auteur";
	self.LblMyRole = 'Mon rôle';
	self.LblRevision = 'Révision';
	self.LblCreatedAt = 'Créé le';
	self.LblCreatedBy = 'Créé par';
	self.LblCreatedThru = 'Créé par';
	self.LblModifiedAt = 'Modifié le';
	self.LblModifiedBy = 'Modifié par';
	self.LblProjectDetails = 'Attributs';
	self.LblProjectUsers = '<span class="glyphicon glyphicon-user"></span>&#160;Utilisateur de ce projet';
	self.LblOtherUsers = 'Autres utilisateurs';
	self.LblUserProjects = '<span class="glyphicon glyphicon-book"></span>&#160;Projets de cet utilisateur';
	self.LblOtherProjects = 'Autres projets';
	self.LblType = 'Type';
	self.LblTypes = 'Types';
	self.LblDataTypes = 'Types de données';
	self.LblDataType = 'Type de données';
	self.LblDataTypeTitle = 'Nom de type de données';
	self.LblSpecTypes = "Types";
	self.LblSpecType = "Type";
	self.LblResourceClasses = "Classes de ressource";
	self.LblResourceClass = "Classe de ressource";
	self.LblStatementClasses = "Classes d'affirmation";
	self.LblStatementClass = "Classe d'affirmation";
//	self.LblRelGroupTypes = "Types de groupe d'affirmations";
//	self.LblRelGroupType = "Type de groupe d'affirmation";
	self.LblSpecificationTypes = "Types d'arborescence";
	self.hierarchyType = 
	self.LblSpecificationType = "Type d'arborescence";
//	self.LblRifTypes = 'Types';
//	self.rifType = 
//	self.LblRifType = 'Type';
	self.LblSpecTypeTitle = "Nom";
	self.LblAttributeTitle = "Nom d'attribut";
	self.LblSecondaryFiltersForObjects = 	self.IcoFilter+"&#160;Filtres à facette pour '~A'";
	self.LblPermissions = 'Autorisations';
	self.LblRoles = 'Rôles';
	self.LblFormat = 'Format';
	self.LblOptions = 'Options';
	self.LblFileFormat = 'Format de fichier';
	self.modelElements = 'Élements de modèle';
	self.withOtherProperties = 'avec autres attributes';
	self.withStatements = 'avec affirmations';
	self.LblStringMatch = '<span class="glyphicon glyphicon-text-background" ></span>&#160;Recherche de texte';
	self.LblWordBeginnings = 'Seulement mots commençant par';
	self.LblWholeWords = 'Seulement mots entiers';
	self.LblCaseSensitive = 'Respecter majuscules et minuscules';
	self.LblExcludeEnums = 'Ignorer énumérateurs';
	self.LblNotAssigned = '(sans attribution de valeur)';
	self.LblPrevious = 'Dernier';
	self.LblNext = 'Prochain';
	self.LblPreviousStep = 'Au précédent';
	self.LblNextStep = 'Au suivant';
	self.LblGo = 'Démarrer';
	self.LblAll = 'Tous';
	self.LblHitCount = 'Score';
	self.LblRelateAs = "Relier comme";
	self.LblSource = "Sujet";
	self.LblTarget = "Objet";
	self.LblEligibleSources = "Ressources éligible comme "+	self.LblSource;
	self.LblEligibleTargets = "Ressources éligible comme "+	self.LblTarget;
	self.LblSaveRelationAsSource = 'Relier ressource comme '+LblSource;
	self.LblSaveRelationAsTarget = 'Relier ressource comme '+LblTarget;
	self.LblIcon = 'Symbole';
	self.LblCreation = 'Création';
	self.LblCreateLink1 = "&#x2776;&#160;Affirmation désirée";
	self.LblCreateLink2 = "&#x2777;&#160;Ressource à relier";
	self.LblReferences = "Références";
	self.LblInherited = "hérité";
	self.LblMaxLength = "Longueur max.";
	self.LblMinValue = "Valeur min.";
	self.LblMaxValue = "Valeur max.";
	self.LblAccuracy = "Décimales";
	self.LblEnumValues = "Valeurs (sép. par virgules)";
	self.LblSingleChoice = "Choix unique";
	self.LblMultipleChoice = "Choix multiple";
	self.LblDirectLink = "Lien direct";

	self.BtnLogin = '<span class="glyphicon glyphicon-log-in"></span>&#160;Se connecter';
	self.BtnLogout = '<span class="glyphicon glyphicon-log-out"></span>&#160;Se déconnecter';
	self.BtnProfile = 'Profile';
	self.BtnBack = 'Retour';
	self.BtnCancel = 'Annuler';
	self.BtnCancelImport = "Interrompre";
	self.BtnApply = 'Appliquer';
	self.BtnDelete = '<span class="glyphicon glyphicon-remove"></span>&#160;Effacer';
	self.BtnDeleteObject = '<span class="glyphicon glyphicon-remove"></span>&#160;Effacer la ressource avec ses references';
	self.BtnDeleteObjectRef = '<span class="glyphicon glyphicon-remove"></span>&#160;Effacer cette reference de ressource';
	self.BtnImport = '<span class="glyphicon glyphicon-import"></span>&#160;Importer';
	self.BtnCreate = '<span class="glyphicon glyphicon-import"></span>&#160;Créer';
	self.BtnReplace = '<span class="glyphicon glyphicon-import"></span>&#160;Remplacer';
	self.BtnAdopt = '<span class="glyphicon glyphicon-import"></span>&#160;Adopter';
	self.BtnUpdate = '<span class="glyphicon glyphicon-import"></span>&#160;'+	self.LblUpdate;
//	self.BtnImportSpecif = '<span class="glyphicon glyphicon-import"></span>&#160;SpecIF';
//	self.BtnImportReqif = '<span class="glyphicon glyphicon-import"></span>&#160;ReqIF';
//	self.BtnImportXls = '<span class="glyphicon glyphicon-import"></span>&#160;xlsx';
//	self.BtnProjectFromTemplate = "Créer un projet avec métadonnées ReqIF";
	self.BtnRead = '<span class="glyphicon glyphicon-eye-open"></span>&#160;Lire';
	self.BtnExport = '<span class="glyphicon glyphicon-export"></span>&#160;Exporter';
//	self.BtnExportSpecif = '<span class="glyphicon glyphicon-export"></span>&#160;SpecIF';
//	self.BtnExportReqif = '<span class="glyphicon glyphicon-export"></span>&#160;ReqIF';
	self.BtnAdd = '<span class="glyphicon glyphicon-plus"></span>&#160;Ajouter';
	self.BtnAddUser = '<span class="glyphicon glyphicon-plus"></span>&#160;Utilisateur';
	self.BtnAddProject = '<span class="glyphicon glyphicon-plus"></span>&#160;'+	self.LblProject;
	self.BtnAddSpec = '<span class="glyphicon glyphicon-plus"></span>&#160;Arborescence';
	self.BtnAddFolder = '<span class="glyphicon glyphicon-plus"></span>&#160;Dossier';
	self.BtnAddAttribute = '<span class="glyphicon glyphicon-plus"></span>&#160;Attribut';
	self.BtnAddTypeComment = '<span class="glyphicon glyphicon-plus"></span>&#160;Classes pour commentaires';
	self.BtnClone = '<span class="glyphicon glyphicon-duplicate"></span>&#160;Clone';
	self.BtnEdit = '<span class="glyphicon glyphicon-pencil"></span>&#160;Modifier';
	self.BtnSave = '<span class="glyphicon glyphicon-save"></span>&#160;Enregistrer';
	self.BtnSaveRole = '<span class="glyphicon glyphicon-save"></span>&#160;Enregistrer rôle';
	self.BtnSaveAttr = '<span class="glyphicon glyphicon-save"></span>&#160;Enregistrer attribut';
	self.BtnInsert = '<span class="glyphicon glyphicon-save"></span>&#160;Enregistrer';
	self.BtnInsertSuccessor = '<span class="glyphicon glyphicon-save"></span>&#160;Enregistrer après';
	self.BtnInsertChild = '<span class="glyphicon glyphicon-save"></span>&#160;Enregistrer en dessous';
	self.BtnSaveRelation = '<span class="glyphicon glyphicon-save"></span>&#160;Enregistrer affirmation';
	self.BtnSaveItem = '<span class="glyphicon glyphicon-save"></span>&#160;Enregistrer ~A';
	self.BtnDetails = 'Détails';
	self.BtnAddRole = '<span class="glyphicon glyphicon-plus" ></span>&#160;Rôle';
	self.BtnFileSelect = '<span class="glyphicon glyphicon-plus" ></span>&#160;Choisir un fichier ...';
	self.BtnPrevious = '<span class="glyphicon glyphicon-chevron-up"></span>&#160;'+	self.LblPrevious;
	self.BtnNext = '<span class="glyphicon glyphicon-chevron-down"></span>&#160;'+	self.LblNext;
	self.BtnGo = 	self.IcoGo+'&#160;'+	self.LblGo;
	self.BtnFilterReset = 	self.IcoFilter+'&#160;Neuf';
	self.BtnSelectHierarchy = "Choix d'une arborescence";

// Tabs:
	self.TabAll = '<span class="glyphicon glyphicon-list"></span>';   
	self.TabUserList = '<span class="glyphicon glyphicon-list"></span>&#160;Utilisateurs';
	self.TabProjectList = '<span class="glyphicon glyphicon-list"></span>&#160;Projets';
//	self.TabProjectDetails = '<span class="glyphicon glyphicon-pencil"></span>&#160;Attributs';  // métadonnées
	self.TabUserDetails = '<span class="glyphicon glyphicon-pencil"></span>&#160;Attributs';
	self.TabProjectUsers = '<span class="glyphicon glyphicon-user"></span>&#160;Utilisateurs';
	self.TabUserProjects = '<span class="glyphicon glyphicon-book"></span>&#160;Projets';
	self.TabPermissions = '<span class="glyphicon glyphicon-lock"></span>&#160;Autorisations';
	self.TabTypes = '<span class="glyphicon glyphicon-cog"></span>&#160;'+	self.LblTypes;
	self.TabDataTypes = '<span class="glyphicon glyphicon-cog"></span>&#160;'+	self.LblDataTypes;
	self.TabSpecTypes = '<span class="glyphicon glyphicon-cog"></span>&#160;'+	self.LblResourceClasses;
	self.TabObjectTypes = '<span class="glyphicon glyphicon-cog"></span>&#160;'+	self.LblResourceClasses;
	self.TabRelationTypes = '<span class="glyphicon glyphicon-cog"></span>&#160;'+	self.LblRelationTypes;
//	self.TabRelGroupTypes = '<span class="glyphicon glyphicon-cog"></span>&#160;'+	self.LblRelGroupTypes;
	self.TabSpecificationTypes = '<span class="glyphicon glyphicon-cog"></span>&#160;'+	self.LblSpecificationTypes;
//	self.TabRifTypes = '<span class="glyphicon glyphicon-cog"></span>&#160;'+	self.LblRifTypes;
	self.TabTable = '<span class="glyphicon glyphicon-th"></span>&#160;Table';
	self.TabDocument = '<span class="glyphicon glyphicon-book"></span>&#160;Document';
	self.TabFind = '<span class="glyphicon glyphicon-search"></span>&#160;Recherche';
	self.TabFilter = 	self.IcoFilter+'&#160;Filtre';
	self.TabPage = '<span class="glyphicon glyphicon-file"></span>&#160;Page';
	self.TabRevisions = '<span class="glyphicon glyphicon-grain"></span>&#160;Révisions';
	self.TabTimeline = '<span class="glyphicon glyphicon-film"></span>&#160;Chronologie';
	self.TabRelations = '<span class="glyphicon glyphicon-link"></span>&#160;Affirmations';
	self.TabSort = '<span class="glyphicon glyphicon-magnet"></span>&#160;Triage';
	self.TabAttachments = '<span class="glyphicon glyphicon-paperclip"></span>&#160;Images et fichiers';
	self.TabComments = '<span class="glyphicon glyphicon-comment"></span>&#160;Commentaires';
	self.TabReports = '<span class="glyphicon glyphicon-stats"></span>&#160;Rapports';

// Functions:
	self.FnProjectCreate = '<span class="glyphicon glyphicon-plus"></span>&#160;Projet';
	self.FnProjectImport = '<span class="glyphicon glyphicon-import"></span>&#160;Importer projet';
//	self.FnImportReqif = '<span class="glyphicon glyphicon-import"></span>&#160;Importer ReqIF';
//	self.FnImportCsv = '<span class="glyphicon glyphicon-import"></span>&#160;Importer CSV';
//	self.FnImportXls = '<span class="glyphicon glyphicon-import"></span>&#160;XLS Import';
//	self.FnProjectFromTemplate = '<span class="glyphicon glyphicon-plus"></span>&#160;Projet avec métadonnées';
	self.FnRefresh = '<span class="glyphicon glyphicon-refresh"></span>&#160;Actualiser';
	self.FnRead = '<span class="glyphicon glyphicon-eye-open"></span>';
	self.FnOpen = 	self.FnRead;
	self.FnUpdate = '<span class="glyphicon glyphicon-wrench"></span>';
	self.FnDelete = '<span class="glyphicon glyphicon-remove"></span>';
	self.FnRemove = 	self.FnDelete;

// ReqIF attribute names (replace any '.' by '_', so 'ReqIF.Text' becomes 'ReqIF_Text ):
	self.ReqIF_ForeignID = 'Identifiant';
	self.ReqIF_ChapterName = 'Titre';
	self.ReqIF_Name = 'Titre';
	self.ReqIF_Text = 'Texte';
	self.ReqIF_ForeignCreatedOn = 	self.LblCreatedAt;
	self.ReqIF_ForeignCreatedBy = 	self.LblCreatedBy;
	self.ReqIF_ForeignCreatedThru = 	self.LblCreatedThru;
	self.ReqIF_ForeignModifiedOn = 	self.LblModifiedAt;
	self.ReqIF_ForeignModifiedBy = 	self.LblModifiedBy;
	self.ReqIF_Revision = 	self.LblRevision;
	self.ReqIF_Description = 	self.LblDescription;
	self.ReqIF_ChangeDescription = 'Description de la modification';
	self.ReqIF_Project = 	self.LblProject;
	self.ReqIF_ForeignState = 	self.LblState;
	self.ReqIF_Category = 	self.LblCategory;
	self.ReqIF_Prefix = 'Préfixe';
	self.ReqIF_FitCriteria = "Critères d'acceptation";
	self.ReqIF_AssociatedFiles = 'Fichiers';
	self.ReqIF_ChapterNumber = 'Numéro de chapitre';   // shouldn't be used, as an object cannot (should not) know its position in the outline
// Dublin Core (DCMI) attribute names:
	self.DC_title =
	self.dcterms_title = "Titre";
	self.DC_description =
	self.dcterms_description = "Description";
	self.DC_identifier =
	self.dcterms_identifier = 	self.LblIdentifier;
	self.DC_type =
	self.dcterms_type = "Type d'élément";
	self.DC_creator =
	self.dcterms_creator = "Auteur";
	self.DC_source =
	self.dcterms_source = "Source";
	self.DC_subject =
	self.dcterms_subject = "Mots-clé";
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
	self.oslc_rm_implements = "realise";
	self.oslc_rm_implementedBy = "realisé par";
	self.oslc_rm_validates = "valides";
	self.oslc_rm_validatedBy = "est validé de";
//	self.oslc_rm_decomposes = "decomposes";
//	self.oslc_rm_decomposedBy = "is decomposed by";
//	self.oslc_rm_constrainedBy = "";
//	self.oslc_rm_constrains = "";
// SpecIF entity, relation and attribute names
	self.SpecIF_Heading = "Intitulé";
	self.SpecIF_Headings = "Intitulés";
	self.SpecIF_Name = 	self.LblName;
//	self.SpecIF_Names = "Namen";
	self.SpecIF_Folder = "Dossier";   // deprecated, use SpecIF:Heading
	self.SpecIF_Folders = "Dossiers"; // deprecated, use SpecIF:Headings
	self.SpecIF_Chapter = "Chapitre"; // deprecated, use SpecIF:Heading
	self.SpecIF_Chapters = "Chapitres";// deprecated, use SpecIF:Headings
	self.SpecIF_Paragraph = "Section";
	self.SpecIF_Paragraphs = "Sections";
	self.SpecIF_Information = "Information";// deprecated, use SpecIF:Paragraph
	self.SpecIF_Diagram = "Diagramme";
	self.SpecIF_Diagrams = "Diagrammes";
	self.SpecIF_View = "Diagramme";		// deprecated
	self.SpecIF_Views = "Diagrammes";	// deprecated
	self.FMC_Plan = "Plan";
	self.FMC_Plans = "Plans";
	self.SpecIF_Object = 
	self.SpecIF_Resource = "Ressource";
	self.SpecIF_Objects = 
	self.SpecIF_Resources = "Ressources";
	self.SpecIF_Relation = 
	self.SpecIF_Statement = "Affirmation";
	self.SpecIF_Relations = 
	self.SpecIF_Statements = "Affirmations";
	self.SpecIF_Property = "Attribut";
	self.SpecIF_Properties = "Attributs";
	self.FMC_Actor = "Acteur";
	self.FMC_Actors = "Acteurs";
	self.FMC_State = "État";
	self.FMC_States = "États";
	self.FMC_Event = "Évenement";
	self.FMC_Events = "Évenements";
	self.SpecIF_Feature = "Marque";
	self.SpecIF_Features = "Marques";
	self.SpecIF_Requirement =
	self.IREB_Requirement = "Exigence";
	self.SpecIF_Requirements = 
	self.IREB_Requirements = "Exigences";
	self.IREB_RequirementType = self.LblType;
	self.IREB_RequirementTypeFunction = 
	self.IREB_FunctionalRequirement = "Exigence de Fonction ou 'User Story'";
	self.IREB_RequirementTypeQuality =
	self.IREB_QualityRequirement = "Exigence de Qualité";
	self.IREB_RequirementTypeConstraint =
	self.IREB_Constraint = "Contrainte";
	self.SpecIF_BusinessProcess = 'Processus'; 
	self.SpecIF_BusinessProcesses = 'Processus';
	self.SpecIF_Rationale = "Motivation";
	self.SpecIF_Note = "Remarque";
	self.SpecIF_Notes = "Remarques";
	self.SpecIF_Comment = "Commentaire";
	self.SpecIF_Comments = "Commentaires";
	self.SpecIF_Issue = "Problème";
	self.SpecIF_Issues = "Problèmes";
	self.SpecIF_Outline =
	self.SpecIF_Hierarchy = "Arborescence";
	self.SpecIF_Outlines =
	self.SpecIF_Hierarchies = "Arborescences";
	self.SpecIF_Glossary = "Élements de modèle (Glossaire)";
	self.SpecIF_Annotations = "Annotations";
	self.SpecIF_Collection = "Collection ou Groupe";
	self.SpecIF_Collections = "Collections et Groupes";
	self.SpecIF_Vote = "Evaluation";
	self.SpecIF_Votes = "Evaluations";
	self.SpecIF_Perspective = "Perspective";
	self.SpecIF_Discipline = "Discipline";
	self.SpecIF_Effort = "Effort";
	self.SpecIF_Risk = 
	self.IREB_Risk = "Risque";
	self.SpecIF_Benefit = "Bénéfice";
	self.SpecIF_Damage = "Dommage";
	self.SpecIF_Probability = "Probabilité";
	self.SpecIF_shows = "montre";
	self.SpecIF_contains = "contient";
	self.oslc_rm_satisfiedBy = "satisfait par";
	self.oslc_rm_satisfies =
	self.SpecIF_satisfies =
	self.IREB_satisfies = "satisfait";
	self.SpecIF_modifies =
	self.SpecIF_stores = "écrit et lit";
	self.SpecIF_reads = "lit";
	self.SpecIF_writes = "écrit";
	self.SpecIF_sendsTo = "émets à";
	self.SpecIF_receivesFrom = "reçoit de";
	self.SpecIF_influences = "influence";
	self.SpecIF_follows = "succèdes à";
	self.SpecIF_precedes = "precède";
	self.SpecIF_signals = "signale";
	self.SpecIF_triggers = "déclenche";
	self.SpecIF_dependsOn = "depend de";
	self.SpecIF_realizes = "realises";
	self.SpecIF_serves = "rends service à";
	self.SpecIF_refines =
	self.IREB_refines = "affine";
	self.IREB_refinedBy = "est affiné de";
	self.SpecIF_duplicates = "reprend";
	self.SpecIF_contradicts = "contredit";
	self.SpecIF_isAssignedTo =
	self.SpecIF_isAssociatedWith =
	self.SysML_isAssociatedWith = "est associé avec";
	self.SysML_isAllocatedTo = "est éxecuté par";
	self.SysML_includes = "inclut";
	self.SysML_extends = "élargit";
	self.SpecIF_isDerivedFrom = 
	self.SysML_isDerivedFrom = "est dérivé de";
	self.SpecIF_isComposedOf = 
	self.SysML_isComposedOf = "est composé de";
	self.SpecIF_isAggregatedBy =
	self.SysML_isAggregatedBy = "est aggregé de";
	self.SpecIF_isGeneralisationOf = 
	self.SysML_isGeneralisationOf = "est generalisé de";
	self.SpecIF_isSpecializationOf =
	self.SpecIF_isSpecialisationOf = 
	self.SysML_isSpecialisationOf = "est specialisé de";
	self.SpecIF_isSynonymOf = "est synonyme de";
	self.SpecIF_isInverseOf = "est l'inverse de";
	self.SpecIF_inheritsFrom = "hérite de";
	self.SpecIF_refersTo = "concerne";
	self.SpecIF_commentRefersTo = "concerne";
	self.SpecIF_issueRefersTo = "concerne";
	self.SpecIF_includes = "inclures";
	self.SpecIF_excludes = "exclures";
	self.SpecIF_mentions = "évoque";
	self.SpecIF_sameAs =
	self.owl_sameAs = "est identique à";
	self.SpecIF_Id = 	self.LblIdentifier;
	self.SpecIF_Type = 	self.LblType;
	self.SpecIF_Notation = "Notation";
//	self.SpecIF_Stereotype = 
//	self.SpecIF_SubClass = "Sous-classe";
	self.SpecIF_Category = 	self.LblCategory;
	self.SpecIF_Status = 	self.LblState;
	self.SpecIF_State = 	self.LblState;			// DEPRECATED
	self.SpecIF_Priority = 	self.LblPriority;
	self.SpecIF_Milestone = "Jalon";
	self.SpecIF_DueDate = "Délai";
	self.SpecIF_Icon = "Symbole";
	self.SpecIF_Tag = "Mot-clé";
	self.SpecIF_Tags = "Mots-clés";
	self.SpecIF_UserStory = "User-Story";
//	self.SpecIF_Creation = "";
	self.SpecIF_Instantiation = "Instanciation";
	self.SpecIF_Origin = "Origine";
	self.SpecIF_Source = 	self.LblSource;
	self.SpecIF_Target = 	self.LblTarget;
//	self.SpecIF_Author = "Auteur";
//	self.SpecIF_Authors = "Auteurs";
	self.IREB_Stakeholder = "Stakeholder";
	self.SpecIF_Responsible = "Responsable";
	self.SpecIF_Responsibles = "Responsables";
// attribute names used by the Interaction Room:
	self.IR_Annotation = "Annotation";
	self.IR_refersTo = 	self.SpecIF_refersTo;
	self.IR_approves = "approves";
	self.IR_opposes = "retoques";
	self.IR_inheritsFrom = 	self.SpecIF_inheritsFrom;
// for oem-supplier agreement as defined by the "Hersteller-Initiative-Software":
	self.HIS_OemStatus = 'OEM-Status';
	self.HIS_OemComment = 'OEM-Comment';
	self.HIS_SupplierStatus = 'Supplier-Status';
	self.HIS_SupplierComment = 'Supplier-Comment';
// attribute names used by DocBridge Resource Director:
	self.DBRD_ChapterName = 'Titre';
	self.DBRD_Name = 'Titre';
	self.DBRD_Text = 'Texte';
// attribute names used by Atego Exerpt with RIF 1.1a:
	self.Object_Heading = 	self.ReqIF_Name;
	self.VALUE_Object_Heading = 	self.ReqIF_Name;
	self.Object_Text = 	self.ReqIF_Text;
	self.VALUE_Object_Text = 	self.ReqIF_Text;
	self.Object_ID = 	self.ReqIF_ForeignID;
	self.VALUE_Object_ID = 	self.ReqIF_ForeignID;
	self.SpecIF_priorityHigh = "haut";
	self.SpecIF_priorityRatherHigh = "plutôt haut";
	self.SpecIF_priorityMedium = "moyen";
	self.SpecIF_priorityRatherLow = "plutôt bas";
	self.SpecIF_priorityLow = "bas";
	self.SpecIF_sizeXL = "très grand";
	self.SpecIF_sizeL = "grand";
	self.SpecIF_sizeM = "moyen";
	self.SpecIF_sizeS = "petit";
	self.SpecIF_sizeXS = "très petit";
	self.SpecIF_rejected = "00_rejected";
	self.SpecIF_initial = "10_initial";
	self.SpecIF_drafted = "20_drafted";
	self.SpecIF_submitted = "30_submitted";
	self.SpecIF_approved = "40_approved";
	self.SpecIF_ready = "50_ready";
	self.SpecIF_done = "60_done";
	self.SpecIF_validated = "70_validated";
	self.SpecIF_released = "80_released";
	self.SpecIF_deprecated = "88_deprecated";
	self.SpecIF_withdrawn = "90_withdrawn";

// Messages:
	self.MsgConfirm = "Confirmez, s'il vous plaît:";
	self.MsgConfirmDeletion = "Effacer '~A'?";
	self.MsgConfirmObjectDeletion = "Effacer la ressource '<b>~A</b>' ?";
	self.MsgConfirmUserDeletion = "Effacer l'utilisateur '<b>~A</b>' ?";
	self.MsgConfirmProjectDeletion = "Effacer le projet '<b>~A</b>' ?";
	self.MsgConfirmSpecDeletion = "Effacer l'arborescence '<b>~A</b>' avec tout les references de ressource?";
	self.MsgConfirmRoleDeletion = "Effacer le rôle '<b>~A</b>' ?";
	self.MsgConfirmFolderDeletion = "Effacer le dossier '<b>~A</b>' ?";
	self.MsgInitialLoading = "Téléchargement de l'indexe en cours ...";
	self.MsgNoProjectLoaded = 'Aucun projet chargé.';
	self.MsgNoProject = 'Aucun projet trouvé.';
	self.MsgNoUser = 'Aucun utilisateur trouvé.';
	self.MsgNoObject = 'Aucune ressource choisi.';
	self.MsgCreateResource = "Créer une ressource";
	self.MsgCloneResource = "Cloner une ressource";
	self.MsgUpdateResource = 	self.LblUpdate+" une ressource";
	self.MsgDeleteResource = "Effacer une ressource";
	self.MsgCreateStatement = "Créer une affirmation";
	self.MsgOtherProject = "Response tardive; entre temps, un autre projet a été choisi.";
	self.MsgWaitPermissions = 'Téléchargement des autorisations en cours ...';
	self.MsgImportReqif = "Types de fichiers valides: *.reqifz, *.reqif, *.zip et *.xml. Le contenu doit correspondre au schéma ReqIF 1.0+, RIF 1.1a ou RIF 1.2. Le téléchargement peut durer quelques minutes dans le cas de très gros fichiers.";
	self.MsgImportSpecif = "Types de fichiers valides: *.specifz et *.specif. Le contenu doit correspondre au schéma SpecIF 0.10.4+. En cas de très gros fichiers, le téléchargement peut durer quelques minutes.";
	self.MsgImportBpmn = "Type de fichier valide est *.bpmn. Le contenu doit correspondre au schéma BPMN 2.0 XML. Le téléchargement peut durer quelques minutes.";
	self.MsgImportXls = "Types de fichiers valides: *.xls, *.xlsx et *.csv. Le téléchargement peut durer quelques minutes dans le cas de très gros fichiers.";
	self.MsgExport = "Un fichier zip-comprimé au format choisi sera créé. Le téléchargement peut durer quelques minutes dans le cas de très gros projets; le navigateur va enregistrer le fichier comme configuré.";
	self.MsgLoading = 'Téléchargement en cours ...';
	self.MsgSearching = 'Recherche en cours ...';
	self.MsgObjectsProcessed = '~A ressources analysé. ';
	self.MsgObjectsFound = '~A ressources trouvé.';
	self.MsgNoMatchingObjects = 'Aucune ressource trouvé.';
	self.MsgNoRelatedObjects = "Cette ressource n'a pas d'affirmations.";
	self.MsgNoComments = "Cette ressource n'a pas de commentaires.";
	self.MsgNoFiles = 'Aucun fichier trouvé.';
	self.MsgAnalyzing = 'Analyse en cours ...';
	self.MsgNoReports = 'Aucun rapport pour ce projet.';
	self.MsgTypeNoObjectType = "Ajoutez au moins une classe de ressource, sinon il est impossible de créer une ressource.";
	self.MsgTypeNoAttribute = "Ajoutez au moins un attribut, sinon le type n'est pas utile.";
	self.MsgNoObjectTypeForManualCreation = "Les ressources ne peuvent pas être créés, parce que vous n'avez pas de permission ou parce que il n'y a pas de type de ressource pouvant être créé manuellement.";
	self.MsgFilterClogged = "Filtre trôp restreint - au moins un critère n'est peut pas être rempli.";
	self.MsgCredentialsUnknown = 'Utilisateur inconnu ou mot de passe erroné.';
	self.MsgUserMgmtNeedsAdminRole = "Adressez-vous à l'administrateur pour gérer les utilisateurs et leur rôle.";
	self.MsgProjectMgmtNeedsAdminRole = "Adressez-vous à l'administrateur pour gérer les projets, leurs utilisateurs et autorisations.";
	self.MsgImportSuccessful = "Importation de '~A' achevée.";
	self.MsgImportDenied = "Import refusé: Le projet '~A' est en cours d'utilisation ou le schema n'est pas respecté.";
	self.MsgImportFailed = "Import interrompu à cause d'une erreur.";
	self.MsgImportAborted = "Import interrompu par l'utilisateur.";
	self.MsgChooseRoleName = "Choisissez un nom de rôle, s'il vous plaît:";
	self.MsgIdConflict = "Existe déja - '~A' ne peut pas être créé.";
	self.MsgRoleNameConflict = "Existe déja - rôle '~A' ne peut pas être créé.";
	self.MsgUserNameConflict = "Existe déja - l'utilisateur '~A' ne peut pas être créé.";
	self.MsgFileApiNotSupported = "Ce navigateur ne permet pas l'accès aux fichiers. Choisissez un navigateur plus récent.";
	self.MsgDoNotLoadAllObjects = "Il n'est pas recommandé de charger tous les ressources en une seule demande.";
	self.MsgReading = "Lire";
	self.MsgCreating = "Créer";
	self.MsgUploading = "Transmettre";
	self.MsgImporting = "Importer";
	self.MsgBrowserSaving = "Le navigateur enregistres le fichier comme configuré.";
	self.MsgSuccess = "Succès!";
	self.MsgSelectImg = "Choisissez ou chargez un image:";
	self.MsgImgWidth = "Largeur de l'image [px]";
	self.MsgSelectResClass = "Choisissez une "+	self.LblResourceClass;
	self.MsgSelectStaClass = "Choisissez une "+	self.LblStatementClass;
	self.MsgNoEligibleRelTypes = "Aucune affirmation défini pour ce type de ressource.";
	self.MsgClickToNavigate = "Double-cliquer une ressource pour y naviguer:";
	self.MsgClickToDeleteRel = "Double-cliquer une ressource pour supprimer l'affirmation respective:";
	self.MsgNoSpec = "Aucune arborescence trouvé.";
	self.MsgTypesCommentCreated = 'Les types pour commentaires ont été créés.';
	self.MsgOutlineAdded = "L'arborescence à été ajoutée au debut - consolidez l'existante avec la nouvelle, si vous desirez";
	self.MsgLoadingTypes = 'Transmets types';
	self.MsgLoadingFiles = 'Transmets images et fichiers';
	self.MsgLoadingObjects = 'Transmets ressources';
	self.MsgLoadingRelations = 'Transmets affirmations';
	self.MsgLoadingHierarchies = "Transmets l'arborescences";
	self.MsgProjectCreated = 'Projet cré avec succes';
	self.MsgProjectUpdated = 'Project mis à jour avec succes';
	self.MsgNoneSpecified = 'vide';

// Error messages:
	self.Error = "Erreur";
	self.Err403Forbidden = "Vous n'avez pas les permissions requises pour cet information.";
	self.Err403NoProjectFolder = 'Votre rôle ne permet pas de mettre à jour au moins un projet concerné.';
//	self.Err403NoProjectUpdate = 'Votre rôle ne permet pas de mettre à jour ce projet.';
	self.Err403NoProjectDelete = "Votre rôle ne permet pas d'effacer ce projet.";
	self.Err403NoUserDelete = "Votre rôle ne permet pas d'effacer des utilisateurs.";
	self.Err403NoRoleDelete = "Votre rôle ne permet pas d'effacer des rôles.";
	self.Err404NotFound = "Élement n'a pas été trouvé.";
	self.ErrNoItem = "Élement '~A' n'a pas été trouvé.";
	self.ErrNoObject = "Ressource '~A' n'a pas été trouvé.";
	self.ErrNoSpec = "Ce projet n'a pas d'arborescence; il faut en créer au moins une.";
	self.ErrInvalidFile = 'Fichier non valide ou erroné.';
	self.ErrInvalidFileType = "Type de fichier '~A' non valide.";
	self.ErrInvalidAttachment = "Type de fichier non valide. Choisissez entre ~A.";
	self.ErrInvalidFileReqif = "Type de fichier '~A' non valide. Choisissez '*.reqifz', '*.reqif', '*.zip' ou '*.xml'.";
	self.ErrInvalidFileSpecif = "Type de fichier '~A' non valide. Choisissez '*.specifz' ou '*.specif'.";
	self.ErrInvalidFileBpmn = "Type de fichier '~A' non valide. Choisissez '*.bpmn'.";
	self.ErrInvalidFileTogaf = "Type de fichier '~A' non valide. Choisissez '*.xml'.";
	self.ErrInvalidFileXls = "Type de fichier '~A' non valide. Choisissez '*.xlsx', '*.xls', ou '*.csv'.";
//	self.ErrInvalidFileElic = "Type de fichier '~A' non valide. Choisissez '*.elic_signed.xml'.";
	self.ErrUpload = 'Erreur pendant le téléchargement.';
	self.ErrImport = "Erreur pendant l'import.";
	self.ErrImportTimeout = "Temps limite dépassé lors de l'import.";
	self.ErrCommunicationTimeout = "Temps limite dépassé lors de demande de serveur";
	self.ErrInvalidData = 'Données nocives ou non valides.';
	self.ErrInvalidContent = 'Données non valides; très probablement contenu nocif ou structure XHTML erronée.';
	self.ErrInvalidRoleName = "Nom de rôle '~A' non valide.";
	self.ErrUpdateConflict = "Votre modification est en conflit avec une modification d'un autre utilisateur.";
	self.ErrInconsistentPermissions = "Les permissions sont contradictoires, s'il vous plaît contactez l'administrateur.";
	self.ErrObjectNotEligibleForRelation = "Cettes ressources ne peuvent pas être reliées avec l'affirmation choisie.";
	self.Err400TypeIsInUse = "Impossible d'effacer ce type, parce qu'il est utilisé."
	self.Err402InsufficientLicense = "La license déposée ne suffit pas pour cette opération.";

//	self.monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre' ];
//	self.monthAbbrs = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juill.', 'août', 'sept.', 'oct.', 'nov.', 'déc.' ];

// App icons and titles:
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
	self.LblHome = 'Bienvenue!';
	self.LblProjects = 'Projets';
	self.LblSystemAdministration = 'Configuration';
	self.LblUserAdministration = 'Utilisateurs';
	self.LblProjectAdministration = 'Types & Permissions';   // for the browser tabs - no HTML!
	self.LblSpecifications = 'Contenu';
	self.LblReader = 'Lecteur SpecIF';
	self.LblEditor = 'Editeur SpecIF';
	self.LblSupport = 'Support';
	self.AppHome = 	self.IcoHome+'&#160;'+	self.LblHome;
	self.AppSystemAdministration = 	self.IcoSystemAdministration+'&#160;Spécification interactive: '+	self.LblSystemAdministration;
	self.AppUserAdministration = 	self.IcoUserAdministration+'&#160;Spécification interactive: '+	self.LblUserAdministration;
	self.AppProjectAdministration = 	self.IcoProjectAdministration+'&#160;Spécification interactive: '+	self.LblProjectAdministration;
	self.AppSpecifications = 	self.IcoSpecifications+'&#160;Spécification interactive: '+	self.LblSpecifications;
	self.AppReader = 	self.IcoReader+'&#160;'+	self.LblReader;
	self.AppImport = 	self.IcoImport+'&#160;Import';
	self.AppLocal = 	self.IcoSpecifications+'&#160;'+	self.LblEditor;
	self.AppSupport = 	self.IcoSupport+'&#160;'+	self.LblSupport;
};
