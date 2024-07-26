/* 	Provide i18ns and messages in a certain language, in this case 'Fran�ais' (fr).
	The result can be obtained by reference of:
	- yourVarName.MsgText (in most cases, when there are only characters allowed for js variable names)
	- yourVarName.lookup('MsgName', 'param')
	- In the messages defined below, '~A' can be inserted at the location where a call parameter shall be placed.

	Search Icons: https://fontawesome.com/v4.7/icons/
*/
function LanguageTextsFr() {
    var self:any = {};
	self.lookup = function (lb: string, pA: string): string {
		// replace a variable '~A' with pA, if available:
		if (lb) {
			// toJsId(): first replace '.' '-' '(' ')' and white-space by '_'
			let res = self[lb.toJsId()] || lb;
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
	self.LblAll = "Tous";
	self.LblAllObjects = "Tous les ressources";
	self.LblOntology = "Ontologie";
	self.LblImport = 'Importer';
	self.LblExport = 'Exporter';
	self.LblExportReqif = 'Exporter fichier ReqIF';
	self.LblExportSpecif = 'Exporter fichier SpecIF';
	self.LblAdminister = 'Administrer';
	self.LblCreate = 'Cr�er';
	self.LblRead = 'Lire';
	self.LblUpdate = 'Mettre � jour';
	self.LblUpdateProject = "Mettre � jour les attributs du projet";
	self.LblUpdateSpec = "Mettre � jour les attributs de l'arborescence";
	self.LblUpdateTypes = 'Mettre � jour les types & permissions';
	self.LblUpdateObject = "Mettre � jour cette ressource";
	self.LblDelete = 'Effacer';
	self.LblDeleteProject = 'Effacer ce project';
	self.LblDeleteType = 'Effacer ce type';
	self.LblDeleteObject = 'Effacer cette ressource';
	self.LblDeleteAttribute = 'Effacer cet attribut';
	self.LblDeleteRelation = 'Effacer affirmation';
	self.LblDeleteRole = 'Effacer ce r�le';
	self.LblAdd = 'Cr�er';
	self.LblAddItem = 'Cr�er ~A';
	self.LblAddProject = "Cr�er un projet";
	self.LblAddType = "Cr�er un type";
	self.LblAddDataType = "Cr�er un type de donn�es";
	self.LblAddObjType = "Cr�er un type de ressources";
	self.LblAddRelType = "Cr�er un type d'affirmations";
	self.LblAddSpcType = "Cr�er un type d'arborescence";
	self.LblAddTypeComment = 'Cr�er les types pour commentaires';
	self.LblAddObject = "Cr�er une ressource";
	self.LblAddRelation = "Cr�er une affirmation";
	self.LblAddAttribute = "Cr�er un attribut";
	self.LblAddUser = "Cr�er un utilisateur";
	self.LblAddComment = 'Commenter';
	self.LblAddCommentTo = "Ajouter un commentaire � '~A':";
	self.LblAddCommentToObject = 'Commenter cette ressource';
	self.LblAddFolder = "Cr�er un dossier";
	self.LblAddSpec = "Cr�er une arborescence";
	self.LblClone = 'Cloner';
	self.LblCloneObject = 'Cloner cette ressource';
	self.LblCloneType = 'Cloner ce type';
	self.LblCloneSpec = 'Cloner cet arborescence';
	self.LblUserName = "Nom d'utilisateur";
	self.LblPassword = 'Mot de passe';
	self.LblTitle = 'Titre';
	self.LblProject = 'Projet';
	self.LblName = 'Nom';
	self.LblFirstName = 'Pr�nom';
	self.LblLastName = 'Nom';
	self.LblOrganizations = 'Organisation';  // until multiple orgs per user are supported
	self.LblEmail = 'e-mail';
	self.LblFileName = 'Nom de fichier';
/*	self.LblRoleGeneralAdmin = 'GENERAL-ADMIN';
	self.LblRoleProjectAdmin = 'PROJECT-ADMIN';
	self.LblRoleUserAdmin = 'USER-ADMIN';
	self.LblRoleReader = "SpecIF:Reader";
//	self.LblRoleReqif = 'REQIF'; */
	self.LblGlobalActions = 'Actions';
	self.LblItemActions = 'Actions';
	self.LblIdentifier = "Identifiant";
	self.LblProjectName = 'Nom de projet';
	self.LblDescription = 'Description';
	self.LblState = 'Statut';
	self.LblPriority = 'Priorit�';
	self.LblCategory = 'Cat�gorie';
	self.LblAttribute = 'Attribut';
	self.LblAttributes = 'Attributs';
	self.LblAttributeValueRange = "Plage de valeurs";
	self.LblAttributeValues = "Valeurs";
	self.LblAttributeValue = "Valeur";
	self.LblTool = "Outil auteur";
	self.LblMyRole = 'Mon r�le';
	self.LblRevision = 'R�vision';
	self.LblCreatedAt = 'Cr�� le';
	self.LblCreatedBy = 'Cr�� par';
	self.LblCreatedThru = 'Cr�� par';
	self.LblModifiedAt = 'Modifi� le';
	self.LblModifiedBy = 'Modifi� par';
	self.LblProjectDetails = 'Attributs';
//	self.LblProjectUsers = self.IcoUser+'&#160;Utilisateur de ce projet';
//	self.LblOtherUsers = 'Autres utilisateurs';
//	self.LblUserProjects = self.IcoSpecification+'&#160;Projets de cet utilisateur';
//	self.LblOtherProjects = 'Autres projets';
	self.LblType = 'Type';
	self.LblTypes = 'Types';
	self.LblDataTypes = 'Types de donn�es';
	self.LblDataType = 'Type de donn�es';
	self.LblDataTypeTitle = 'Nom de type de donn�es';
	self.LblSpecTypes = "Types";
	self.LblSpecType = "Type";
	self.LblResourceClass = "Classe de ressource";
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
	self.LblSecondaryFiltersForObjects = 	self.IcoFilter+"&#160;Filtres � facette pour '~A'";
	self.LblPermissions = 'Autorisations';
	self.LblRoles = 'R�les';
	self.LblFormat = 'Format';
	self.LblOptions = 'Options';
	self.LblFileFormat = 'Format de fichier';
	self.modelElements = '�lements de mod�le';
	self.withOtherProperties = "avec les autres attributs";
	self.showEmptyProperties = 'attributs vides inclus';
	self.withStatements = 'avec relations (affirmations)';
	self.elementsWithIcons = 'avec symboles';
	self.elementsWithOrdernumbers = "avec num�ro d'ordre";
	self.LblStringMatch = 'Recherche de <mark>texte</mark>';
	self.LblWordBeginnings = 'Seulement mots commen�ant par';
	self.LblWholeWords = 'Seulement mots entiers';
	self.LblCaseSensitive = 'Respecter majuscules et minuscules';
	self.LblExcludeEnums = 'Ignorer �num�rateurs';
	self.LblNotAssigned = '(sans attribution de valeur)';
	self.LblPrevious = 'Dernier';
	self.LblNext = 'Prochain';
	self.LblPreviousStep = 'Au pr�c�dent';
	self.LblNextStep = 'Au suivant';
//	self.LblGo = 'D�marrer';
	self.LblHitCount = 'Score';
	self.LblRelateAs = "Relier comme";
	self.LblSource = "Sujet";
	self.LblTarget = "Objet";
	self.LblEligibleSources = "Ressources �ligible comme "+	self.LblSource;
	self.LblEligibleTargets = "Ressources �ligible comme "+	self.LblTarget;
	self.LblSaveRelationAsSource = 'Relier ressource comme '+self.LblSource;
	self.LblSaveRelationAsTarget = 'Relier ressource comme '+self.LblTarget;
	self.LblIcon = 'Symbole';
	self.LblCreation = 'Cr�ation';
	self.LblCreateLink1 = "&#x2776;&#160;Affirmation d�sir�e";
	self.LblCreateLink2 = "&#x2777;&#160;Ressource � relier";
	self.LblReferences = "R�f�rences";
	self.LblInherited = "h�rit�";
	self.LblMaxLength = "Longueur max.";
	self.LblMinValue = "Valeur min.";
	self.LblMaxValue = "Valeur max.";
	self.LblAccuracy = "D�cimales";
	self.LblEnumValues = "Valeurs (s�p. par virgules)";
	self.LblSingleChoice = "Choix unique";
	self.LblMultipleChoice = "Choix multiple";
	self.LblDirectLink = "Lien direct";

//	self.BtnLogin = '<span class="glyphicon glyphicon-log-in"></span>&#160;Se connecter';
//	self.BtnLogout = '<span class="glyphicon glyphicon-log-out"></span>&#160;Se d�connecter';
	self.BtnProfile = 'Profile';
	self.BtnBack = self.LblPreviousStep;
	self.BtnCancel = 'Annuler';
	self.BtnCancelImport = "Interrompre";
	self.BtnApply = 'Appliquer';
	self.BtnDelete = self.IcoDelete+'&#160;Effacer';
	self.BtnDeleteObject = self.IcoDelete+'&#160;Effacer la ressource avec ses references';
	self.BtnDeleteObjectRef = self.IcoDelete+'&#160;Effacer cette reference de ressource';
	self.BtnImport = self.IcoImport + '&#160;Importer';
	self.BtnCreate = self.IcoImport + '&#160;Cr�er';
	self.BtnReplace = self.IcoImport + '&#160;Remplacer';
	self.BtnAdopt = self.IcoImport + '&#160;Adopter';
	self.BtnUpdate = self.IcoImport + '&#160;' + self.LblUpdate;
	self.BtnUpdateObject = self.IcoSave + '&#160;' + self.LblUpdate;
//	self.BtnImportSpecif = self.IcoImport+'&#160;SpecIF';
//	self.BtnImportReqif = self.IcoImport+'&#160;ReqIF';
//	self.BtnImportXls = self.IcoImport+'&#160;xlsx';
//	self.BtnProjectFromTemplate = "Cr�er un projet avec m�tadonn�es ReqIF";
	self.BtnRead = self.IcoRead+'&#160;Lire';
	self.BtnExport = self.IcoExport + '&#160;Exporter';
//	self.BtnExportSpecif = self.IcoExport+'&#160;SpecIF';
//	self.BtnExportReqif = self.IcoExport+'&#160;ReqIF';
	self.BtnAdd = self.IcoAdd+'&#160;Ajouter';
	self.BtnAddUser = self.IcoAdd+'&#160;Utilisateur';
	self.BtnAddProject = self.IcoAdd+'&#160;'+	self.LblProject;
	self.BtnAddSpec = self.IcoAdd+'&#160;Arborescence';
	self.BtnAddFolder = self.IcoAdd+'&#160;Dossier';
	self.BtnAddAttribute = self.IcoAdd+'&#160;Attribut';
	self.BtnAddTypeComment = self.IcoAdd+'&#160;Classes pour commentaires';
	self.BtnClone = self.IcoClone +'&#160;Clone';
	self.BtnEdit = self.IcoEdit+'&#160;Modifier';
	self.BtnSave = self.IcoSave+'&#160;Enregistrer';
	self.BtnSaveRole = self.IcoSave+'&#160;Enregistrer r�le';
	self.BtnSaveAttr = self.IcoSave+'&#160;Enregistrer attribut';
	self.BtnInsert = self.IcoAdd+'&#160;Enregistrer';
	self.BtnInsertSuccessor = self.IcoAdd+'&#160;Enregistrer apr�s';
	self.BtnInsertChild = self.IcoAdd+'&#160;Enregistrer en dessous';
	self.BtnSaveRelation = self.IcoSave+'&#160;Enregistrer affirmation';
	self.BtnSaveItem = self.IcoSave+'&#160;Enregistrer ~A';
	self.BtnDetails = 'D�tails';
	self.BtnAddRole = self.IcoAdd +'&#160;R�le';
	self.BtnFileSelect = self.IcoAdd +'&#160;Choisir un fichier ...';
//	self.BtnPrevious = self.IcoPrevious+'&#160;' + self.LblPrevious;
//	self.BtnNext = self.IcoNext+'&#160;' + self.LblNext;
//	self.BtnGo = self.IcoGo+'&#160;'+self.LblGo;
	self.BtnFilterReset = 	self.IcoFilter+'&#160;Neuf';
	self.BtnSelectHierarchy = "Choix d'une arborescence";

// Tabs:
/*	self.TabAll = '<span class="glyphicon glyphicon-list"></span>';   
	self.TabUserList = '<span class="glyphicon glyphicon-list"></span>&#160;Utilisateurs';
	self.TabProjectList = '<span class="glyphicon glyphicon-list"></span>&#160;Projets';
//	self.TabProjectDetails = self.IcoEdit+'&#160;Attributs';  // m�tadonn�es
	self.TabUserDetails = self.IcoEdit +'&#160;Attributs';
	self.TabProjectUsers = self.IcoUser+'&#160;Utilisateurs';
	self.TabUserProjects = self.IcoSpecification+'&#160;Projets';
	self.TabPermissions = '<span class="glyphicon glyphicon-lock"></span>&#160;Autorisations';
	self.TabTypes = self.IcoType+'&#160;'+	self.LblTypes;
	self.TabDataTypes = self.IcoType+'&#160;'+	self.LblDataTypes; */
/*	self.TabSpecTypes = self.IcoType+'&#160;'+	self.LblResourceClasses;
	self.TabObjectTypes = self.IcoType+'&#160;'+	self.LblResourceClasses;
	self.TabRelationTypes = self.IcoType+'&#160;'+	self.LblRelationTypes;
//	self.TabRelGroupTypes = self.IcoType+'&#160;'+	self.LblRelGroupTypes;
	self.TabSpecificationTypes = self.IcoType+'&#160;'+	self.LblSpecificationTypes;
//	self.TabRifTypes = self.IcoType+'&#160;'+	self.LblRifTypes;
	self.TabTable = '<span class="glyphicon glyphicon-th"></span>&#160;Table'; */
	self.TabDocument = self.IcoSpecification+'&#160;Document';
//	self.TabFind = self.IcoFind+'&#160;Recherche';
	self.TabFilter = self.IcoFilter+'&#160;Filtre';
//	self.TabPage = '<span class="glyphicon glyphicon-file"></span>&#160;Page';
//	self.TabRevisions = '<span class="glyphicon glyphicon-grain"></span>&#160;R�visions';
//	self.TabTimeline = '<span class="glyphicon glyphicon-film"></span>&#160;Chronologie';
	self.TabRelations = self.IcoRelation +'&#160;Relations';
//	self.TabSort = '<span class="glyphicon glyphicon-magnet"></span>&#160;Triage';
//	self.TabAttachments = '<span class="glyphicon glyphicon-paperclip"></span>&#160;Images et fichiers';
//	self.TabComments = self.IcoComment+'&#160;Commentaires';
	self.TabReports = self.IcoReport +'&#160;Rapports';

// Functions:
//	self.FnProjectCreate = self.IcoAdd+'&#160;Projet';
//	self.FnProjectImport = self.IcoImport+'&#160;Importer projet';
//	self.FnImportReqif = self.IcoImport+'&#160;Importer ReqIF';
//	self.FnImportCsv = self.IcoImport+'&#160;Importer CSV';
//	self.FnImportXls = self.IcoImport+'&#160;XLS Import';
//	self.FnProjectFromTemplate = self.IcoAdd+'&#160;Projet avec m�tadonn�es';
//	self.FnRefresh = '<span class="glyphicon glyphicon-refresh"></span>&#160;Actualiser';
	self.FnOpen =
	self.FnRead = self.IcoRead;
	self.FnUpdate = self.IcoAdminister;
//	self.FnRemove =
	self.FnDelete = self.IcoDelete;

// Messages:
	self.MsgIntro = 'Vous �tes nouveau ici? Lisez une br�ve <a href="' + CONFIG.QuickStartGuideEn + '" target="_blank" rel="noopener">introduction en anglais</a>, si vous le souhaitez.';
	self.MsgConfirm = "Confirmez, s'il vous pla�t:";
	self.MsgConfirmDeletion = "Effacer '~A'?";
	self.MsgConfirmObjectDeletion = "Effacer la ressource '<b>~A</b>' ?";
	self.MsgConfirmUserDeletion = "Effacer l'utilisateur '<b>~A</b>' ?";
	self.MsgConfirmProjectDeletion = "Effacer le projet '<b>~A</b>' ?";
	self.MsgConfirmSpecDeletion = "Effacer l'arborescence '<b>~A</b>' avec tout les references de ressource?";
	self.MsgConfirmRoleDeletion = "Effacer le r�le '<b>~A</b>' ?";
	self.MsgConfirmFolderDeletion = "Effacer le dossier '<b>~A</b>' ?";
	self.MsgInitialLoading = "T�l�chargement de l'indexe en cours ...";
	self.MsgNoProjectLoaded = 'Aucun projet charg�.';
	self.MsgNoProject = 'Aucun projet trouv�.';
	self.MsgNoUser = 'Aucun utilisateur trouv�.';
	self.MsgNoObject = 'Aucune ressource choisi.';
	self.MsgCreateResource = "Cr�er une ressource";
	self.MsgCloneResource = "Cloner une ressource";
	self.MsgUpdateResource = 	self.LblUpdate+" une ressource";
	self.MsgDeleteResource = "Effacer une ressource";
	self.MsgCreateStatement = "Cr�er une affirmation";
	self.MsgOtherProject = "Response tardive; entre temps, un autre projet a �t� choisi.";
	self.MsgWaitPermissions = 'T�l�chargement des autorisations en cours ...';
	self.MsgForRole = 'pour r�le ';
/*	self.MsgImportReqif = "Types de fichiers valides: *.reqifz, *.reqif, *.zip et *.xml. Le contenu doit correspondre au sch�ma ReqIF 1.0+, RIF 1.1a ou RIF 1.2. Le t�l�chargement peut durer quelques minutes dans le cas de tr�s gros fichiers."; */
	self.MsgImportReqif = "Types de fichiers valides: *.reqif ou *.reqifz. Le contenu doit correspondre au sch�ma ReqIF 1.0+. Le t�l�chargement peut durer quelques minutes dans le cas de tr�s gros fichiers.";
	self.MsgImportSpecif = "Types de fichiers valides:  *.specif, *.specif.zip et *.specifz. Le contenu doit correspondre au sch�ma SpecIF 0.10.4+. En cas de tr�s gros fichiers, le t�l�chargement peut durer quelques minutes.";
	self.MsgImportBpmn = "Type de fichier valide est *.bpmn. Le contenu doit correspondre au sch�ma BPMN 2.0 XML. Le t�l�chargement peut durer quelques minutes.";
	self.MsgImportXls = "Types de fichiers valides: *.xls, *.xlsx et *.csv. Le t�l�chargement peut durer quelques minutes dans le cas de tr�s gros fichiers.";
	self.MsgExport = "Un fichier au format choisi sera cr��. L'exportation prend quelques secondes ou jusqu'� plusieurs minutes dans le cas de fichiers tr�s volumineux; votre navigateur web enregistrera le fichier en fonction de ses param�tres.";
	self.MsgLoading = 'T�l�chargement en cours ...';
	self.MsgSearching = 'Recherche en cours ...';
	self.MsgObjectsProcessed = '~A ressources analys�. ';
	self.MsgObjectsFound = '~A ressources trouv�.';
	self.MsgNoMatchingObjects = 'Aucune ressource trouv�.';
	self.MsgNoRelatedObjects = "Cette ressource n'a pas d'affirmations.";
	self.MsgNoComments = "Cette ressource n'a pas de commentaires.";
	self.MsgNoFiles = 'Aucun fichier trouv�.';
	self.MsgAnalyzing = 'Analyse en cours ...';
	self.MsgNoReports = 'Aucun rapport pour ce projet.';
	self.MsgTypeNoObjectType = "Ajoutez au moins une classe de ressource, sinon il est impossible de cr�er une ressource.";
	self.MsgTypeNoAttribute = "Ajoutez au moins un attribut, sinon le type n'est pas utile.";
	self.MsgNoObjectTypeForManualCreation = "Les ressources ne peuvent pas �tre cr��s, parce que vous n'avez pas de permission ou parce que il n'y a pas de type de ressource pouvant �tre cr�� manuellement.";
	self.MsgFilterClogged = "Filtre tr�p restreint - au moins un crit�re n'est peut pas �tre rempli.";
	self.MsgCredentialsUnknown = 'Utilisateur inconnu ou mot de passe erron�.';
	self.MsgUserMgmtNeedsAdminRole = "Adressez-vous � l'administrateur pour g�rer les utilisateurs et leur r�le.";
	self.MsgProjectMgmtNeedsAdminRole = "Adressez-vous � l'administrateur pour g�rer les projets, leurs utilisateurs et autorisations.";
	self.MsgImportSuccessful = "Importation de '~A' achev�e.";
	self.MsgImportDenied = "Import refus�: Le projet '~A' est en cours d'utilisation ou le schema n'est pas respect�.";
	self.MsgImportFailed = "Import interrompu � cause d'une erreur.";
	self.MsgImportAborted = "Import interrompu par l'utilisateur.";
	self.MsgChooseRoleName = "Choisissez un nom de r�le, s'il vous pla�t:";
	self.MsgIdConflict = "Existe d�ja - '~A' ne peut pas �tre cr��.";
	self.MsgRoleNameConflict = "Existe d�ja - r�le '~A' ne peut pas �tre cr��.";
	self.MsgUserNameConflict = "Existe d�ja - l'utilisateur '~A' ne peut pas �tre cr��.";
	self.MsgFileApiNotSupported = "Ce navigateur ne permet pas l'acc�s aux fichiers. Choisissez un navigateur plus r�cent.";
	self.MsgDoNotLoadAllObjects = "Il n'est pas recommand� de charger tous les ressources en une seule demande.";
	self.MsgReading = "Lire";
	self.MsgCreating = "Cr�er";
	self.MsgUploading = "Transmettre";
	self.MsgImporting = "Importer";
	self.MsgBrowserSaving = "Le navigateur enregistres le fichier comme configur�.";
	self.MsgSuccess = "Succ�s!";
	self.MsgSelectImg = "Choisissez ou chargez un image:";
	self.MsgImgWidth = "Largeur de l'image [px]";
	self.MsgSelectResClass = "Choisissez une "+	self.LblResourceClass;
	self.MsgSelectStaClass = "Choisissez une "+	self.LblStatementClass;
	self.MsgNoEligibleRelTypes = "Aucune affirmation d�fini pour ce type de ressource.";
	self.MsgClickToNavigate = "Double-cliquer une ressource pour y naviguer:";
	self.MsgClickToDeleteRel = "Double-cliquer une ressource pour supprimer l'affirmation respective:";
	self.MsgNoSpec = "Aucune arborescence trouv�.";
	self.MsgTypesCommentCreated = 'Les types pour commentaires ont �t� cr��s.';
	self.MsgOutlineAdded = "L'arborescence � �t� ajout�e au debut - consolidez l'existante avec la nouvelle, si vous desirez";
	self.MsgLoadingTypes = 'Transmets types';
	self.MsgLoadingFiles = 'Transmets images et fichiers';
	self.MsgLoadingObjects = 'Transmets ressources';
	self.MsgLoadingRelations = 'Transmets affirmations';
	self.MsgLoadingHierarchies = "Transmets l'arborescences";
	self.MsgProjectCreated = 'Projet cr� avec succes';
	self.MsgProjectUpdated = 'Project mis � jour avec succes';
	self.MsgNoneSpecified = 'vide';

// Error messages:
	self.Error = "Erreur";
	self.Err403Forbidden = "Vous n'avez pas les permissions requises pour cet information.";
	self.Err403NoProjectFolder = 'Votre r�le ne permet pas de mettre � jour au moins un projet concern�.';
//	self.Err403NoProjectUpdate = 'Votre r�le ne permet pas de mettre � jour ce projet.';
	self.Err403NoProjectDelete = "Votre r�le ne permet pas d'effacer ce projet.";
	self.Err403NoUserDelete = "Votre r�le ne permet pas d'effacer des utilisateurs.";
	self.Err403NoRoleDelete = "Votre r�le ne permet pas d'effacer des r�les.";
	self.Err404NotFound = "�lement n'a pas �t� trouv�.";
	self.ErrNoItem = "�lement '~A' n'a pas �t� trouv�.";
	self.ErrNoObject = "Ressource '~A' n'a pas �t� trouv�.";
	self.ErrNoSpec = "Ce projet n'a pas d'arborescence; il faut en cr�er au moins une.";
	self.ErrInvalidFile = 'Fichier non valide ou erron�.';
	self.ErrInvalidFileType = "Type de fichier '~A' non valide.";
	self.ErrInvalidAttachment = "Type de fichier non valide. Choisissez entre ~A.";
	self.ErrInvalidFileReqif = "Type de fichier '~A' non valide. Choisissez '*.reqif' ou '*.reqifz'.";
	self.ErrInvalidFileSpecif = "Type de fichier '~A' non valide. Choisissez '*.specif.zip', '*.specifz' ou '*.specif'.";
	self.ErrInvalidFileBpmn = "Type de fichier '~A' non valide. Choisissez '*.bpmn'.";
	self.ErrInvalidFileTogaf = "Type de fichier '~A' non valide. Choisissez '*.xml'.";
	self.ErrInvalidFileXls = "Type de fichier '~A' non valide. Choisissez '*.xlsx', '*.xls', ou '*.csv'.";
//	self.ErrInvalidFileElic = "Type de fichier '~A' non valide. Choisissez '*.elic_signed.xml'.";
	self.ErrUpload = 'Erreur pendant le t�l�chargement.';
	self.ErrImport = "Erreur pendant l'import.";
	self.ErrImportTimeout = "Temps limite d�pass� lors de l'import.";
	self.ErrCommunicationTimeout = "Temps limite d�pass� lors de demande de serveur";
	self.ErrInvalidData = 'Donn�es nocives ou non valides.';
	self.ErrInvalidContent = 'Donn�es non valides; tr�s probablement contenu nocif ou structure XHTML erron�e.';
	self.ErrInvalidRoleName = "Nom de r�le '~A' non valide.";
	self.ErrUpdateConflict = "Votre modification est en conflit avec une modification d'un autre utilisateur.";
	self.ErrInconsistentPermissions = "Les permissions sont contradictoires, s'il vous pla�t contactez l'administrateur.";
	self.ErrObjectNotEligibleForRelation = "Cettes ressources ne peuvent pas �tre reli�es avec l'affirmation choisie.";
	self.Err400TypeIsInUse = "Impossible d'effacer ce type, parce qu'il est utilis�."
	self.Err402InsufficientLicense = "La license d�pos�e ne suffit pas pour cette op�ration.";

//	self.monthNames = ['janvier', 'f�vrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'ao�t', 'septembre', 'octobre', 'novembre', 'd�cembre' ];
//	self.monthAbbrs = ['janv.', 'f�vr.', 'mars', 'avr.', 'mai', 'juin', 'juill.', 'ao�t', 'sept.', 'oct.', 'nov.', 'd�c.' ];

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
//	self.LblHome = 'Bienvenue!';
//	self.LblProjects = 'Projets';
//	self.LblSystemAdministration = 'Configuration';
//	self.LblUserAdministration = 'Utilisateurs';
//	self.LblProjectAdministration = 'Types & Permissions';   // for the browser tabs - no HTML!
//	self.LblSpecifications = 'Contenu';
	self.LblReader = 'Lecteur SpecIF';
	self.LblReviewer = 'SpecIF R�vu du ' + self.SpecIF_Supplier;
	self.LblEditor = 'Int�grateur de Mod�les et Editeur SpecIF';
//	self.LblSupport = 'Support';
//	self.AppHome = self.IcoHome+'&#160;'+self.LblHome;
//	self.AppSystemAdministration = self.IcoSystemAdministration+'&#160;Sp�cification interactive: '+self.LblSystemAdministration;
//	self.AppUserAdministration = self.IcoUserAdministration+'&#160;Sp�cification interactive: '+self.LblUserAdministration;
//	self.AppProjectAdministration = self.IcoProjectAdministration+'&#160;Sp�cification interactive: '+self.LblProjectAdministration;
//	self.AppSpecifications = self.IcoSpecifications+'&#160;Sp�cification interactive: '+self.LblSpecifications;
//	self.AppReader = 	self.IcoReader+'&#160;'+	self.LblReader;
//	self.AppImport = 	self.IcoImport+'&#160;Import';
//	self.AppLocal = 	self.IcoSpecifications+'&#160;'+	self.LblEditor;
//	self.AppSupport = 	self.IcoSupport+'&#160;'+	self.LblSupport;
	return self;
};
