/*!	Transformation Library for SpecIF data.
	Dependencies: jQuery
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de 
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/

class CSpecifItemNames {
	// SpecIF item names for all supported import versions 
	rClasses: string;
	sClasses: string;
	hClasses?: string;
	pClasses: string;
	subClasses: string;
	objClasses: string;
	rClass: string;
	sClass: string;
	hClass?: string;
	pClass: string;
	frct: string;
	minI: string;
	maxI: string;
	constructor(ver?: string) {
		switch (ver) {
			case '0.10.7':
				throw Error("Version " + ver + " is not supported.");
			case '0.10.2':
			case '0.10.3':
				this.rClasses = 'resourceTypes';
				this.sClasses = 'statementTypes';
				this.hClasses = 'hierarchyTypes';
				this.pClasses = 'propertyTypes';
				this.subClasses = 'subjectTypes';
				this.objClasses = 'objectTypes';
				this.rClass = 'resourceType';
				this.sClass = 'statementType';
				this.hClass = 'hierarchyType';
				this.pClass = 'propertyType';
				break;
			case '0.10.4':
			case '0.10.5':
			case '0.10.6':
			case '0.11.2':
				this.hClasses = 'hierarchyClasses';
				this.hClass = 'class';
				// no break
			default:
				// for v0.10.8, v0.11.8 and v1.0+:
				this.rClasses = 'resourceClasses';
				this.sClasses = 'statementClasses';
				this.pClasses = 'propertyClasses';
				this.subClasses = 'subjectClasses';
				this.objClasses = 'objectClasses';
				this.rClass = 'class';
				this.sClass = 'class';
				this.pClass = 'class'
		};
		if (typeof(ver)=='string' && ver.startsWith('0.')) {
			// for all versions <1.0:
			this.frct = 'accuracy';
			this.minI = 'min';
			this.maxI = 'max'
		}
		else {
			// starting SpecIF v1.0:
			this.frct = 'fractionDigits';
			this.minI = 'minInclusive';
			this.maxI = 'maxInclusive'
		};
	}
}
class CSpecIF implements SpecIF {
	// Internal representation of a SpecIF data-set/project.
	// ToDo: Needs rework to separate the I/O transformation from the caching functions.
	names: CSpecifItemNames;  // SpecIF attribute names for all supported import versions 

	id: string;
	$schema: string;
	title: string;
	description: string;
	generator: string;
	generatorVersion: string;
	rights: any;
	myRole: RoleEnum;
	cre: boolean;
	upd: boolean;
	del: boolean;
	exp: boolean;
	locked: boolean;		// the server has locked the project ( readOnly )
	createdAt: string;
	createdBy: CreatedBy;

	dataTypes: DataType[];
	propertyClasses: PropertyClass[];
	resourceClasses: ResourceClass[];
	statementClasses: StatementClass[];
	resources: Resource[];   	// list of resources as referenced by the hierarchies
	statements: Statement[];
	hierarchies: SpecifNode[];    	// listed specifications (aka hierarchies, outlines) of the project.
	files: IFileWithContent[];
	constructor(spD?:any) {
		this.names = new CSpecifItemNames();
		if (spD && spD.id) {
			this.toInt(spD);
		}
		else {
			this.id = '';
			this.$schema = '';
			this.title = '';
			this.description = '';
			this.generator = '';
			this.generatorVersion = '';
			this.rights = {};
			this.myRole = RoleEnum.Reader;
			this.cre = false;
			this.upd = false;
			this.del = false;
			this.exp = false;
			this.locked = false;		// the server has locked the project ( readOnly )
			this.createdAt = '';
			this.createdBy = undefined;

			this.dataTypes = [];
			this.propertyClasses = [];
			this.resourceClasses = [];
			this.statementClasses = [];
			this.resources = [];   		// list of resources as referenced by the hierarchies
			this.statements = [];
			this.hierarchies = [];    	// listed specifications (aka hierarchies, outlines) of the project.
			this.files = [];
		};
	}
	isValid(): boolean {
		return typeof(this.id)=='string' && this.id.length > 0;
    }
	setMeta(dta: SpecIF): void {
		this.id = dta.id;
		this.title = dta.title;
		this.description = dta.description;
		this.generator = dta.generator;
		this.generatorVersion = dta.generatorVersion;
		this.myRole = i18n.LblRoleProjectAdmin;
		//	this.cre = this.upd = this.del = this.exp = app.title!=i18n.LblReader;
		this.cre = this.upd = this.del = app.title != i18n.LblReader;
		this.exp = true;
		this.locked = app.title == i18n.LblReader;
		this.createdAt = dta.createdAt;
		this.createdBy = dta.createdBy;
	}
	toInt(spD: any):void {
		// transform SpecIF to internal data;
		// no data of app.cache is modified.
		// It is assumed that spD has passed the schema and consistency check.
//		console.debug('set',simpleClone(spD));
		this.names = new CSpecifItemNames(spD.specifVersion);

		// Differences when using forAll() instead of [..].map():
		// - tolerates missing input list (not all are mandatory for SpecIF)
		// - suppresses undefined list items in the result, so in effect forAll() is a combination of .map() and .filter().
		try {
			this.dataTypes = forAll( spD.dataTypes, (e: any) => { return this.dT2int(e) });
			this.propertyClasses = forAll( spD.propertyClasses, (e: any) => { return this.pC2int(e) });	// starting v0.10.6
			this.resourceClasses = forAll( spD[this.names.rClasses], (e: any) => { return this.rC2int(e) });
			this.statementClasses = forAll( spD[this.names.sClasses], (e: any) => { return this.sC2int(e) });
			if (this.names.hClasses)
				this.resourceClasses = this.resourceClasses.concat( forAll( spD[this.names.hClasses], (e: any) => { return this.hC2int(e) }));
			this.resources = forAll( spD.resources, (e: any) => { return this.r2int(e) });
			this.statements = forAll( spD.statements, (e: any) => { return this.s2int(e) });
			this.hierarchies = forAll( spD.hierarchies, (e: any) => { return this.h2int(e) });
			this.files = forAll( spD.files, (e: any) => { return this.f2int(e) })
		}
		catch (e) {
			let txt = "Error when importing the project '" + spD.title + "'";
			console.log(txt);
			message.show({ status: 999, statusText: txt }, { severity: 'danger' });
			return; // undefined 
		};

		// header information provided only in case of project creation, but not in case of project update:
		if (spD.id) this.id = spD.id;
		if (spD.title) this.title = spD.title;
		if (spD.description) this.description = spD.description;
		if (spD.generator) this.generator = spD.generator;
		if (spD.generatorVersion) this.generatorVersion = spD.generatorVersion;
		if (spD.createdBy) this.createdBy = spD.createdBy;
		if (spD.createdAt) this.createdAt = spD.createdAt;

//		console.debug('specif.toInt',simpleClone(this));
	}
	private i2int(iE) {
		// common for all items:
		var oE: any = {
			id: iE.id,
			changedAt: iE.changedAt
		};
		if (iE.description) oE.description = cleanValue(iE.description);
		// revision is a number up until v0.10.6 and a string thereafter:
		switch (typeof (iE.revision)) {
			case 'number':
				oE.revision = iE.revision.toString();	// for <v0.10.8
				break;
			case 'string':
				oE.revision = iE.revision
		};
		if (iE.replaces) oE.replaces = iE.replaces;
		if (iE.changedBy) oE.changedBy = iE.changedBy;
		if (iE.createdAt) oE.createdAt = iE.createdAt;
		if (iE.createdBy) oE.createdBy = iE.createdBy;
		//				console.debug('item 2int',iE,oE);
		return oE
	}
	// a data type:
	private dT2int(iE): DataType {
		var oE: any = this.i2int(iE);
		oE.title = cleanValue(iE.title);
		oE.type = iE.type;
		switch (iE.type) {
			case "xs:double":
				oE.fractionDigits = iE[this.names.frct];
				oE.minInclusive = iE[this.names.minI];
				oE.maxInclusive = iE[this.names.maxI];
				break;
			case "xs:integer":
				oE.minInclusive = iE[this.names.minI];
				oE.maxInclusive = iE[this.names.maxI];
				break;
			case "xhtml":
			case "xs:string":
				if (typeof (iE.maxLength) == 'number')
					oE.maxLength = iE.maxLength;
				break;
			case "xs:enumeration":
				if (iE.values)
					oE.values = forAll(iE.values, (v): EnumeratedValue => {
						// 'v.title' until v0.10.6, 'v.value' thereafter;
						// 'v.value' can be a string or a multilanguage object.
						return {
							id: v.id,
							value: typeof (v.value) == 'string' || typeof (v.value) == 'object' ? v.value : v.title  // works also for v.value==''
						}
					})
		};
		//				console.debug('dataType 2int',iE);
		return oE
	}
	// a property class:
	private pC2int(iE: PropertyClass): PropertyClass {
		var oE: any = this.i2int(iE);
		oE.title = cleanValue(iE.title);	// an input file may have titles which are not from the SpecIF vocabulary.
		if (iE.description) oE.description = cleanValue(iE.description);
		if (iE.value) oE.value = cleanValue(iE.value);
		oE.dataType = iE.dataType;
		let dT: DataType = itemById(this.dataTypes, iE.dataType);
		//				console.debug('pC2int',iE,dT);
		switch (dT.type) {
			case 'xs:enumeration':
				// include the property only, if it is different from the dataType's:
				if (iE.multiple && !dT.multiple) oE.multiple = true
				else if (iE.multiple == false && dT.multiple) oE.multiple = false
		};
		//				console.debug('propClass 2int',iE,oE);
		return oE
	}
	// common for all instance classes:
	private aC2int(iE) {
		var oE: any = this.i2int(iE);
		oE.title = cleanValue(iE.title);
		if (iE['extends']) oE._extends = iE['extends'];	// 'extends' is a reserved word starting with ES5
		if (iE.icon) oE.icon = iE.icon;
		if (iE.creation) oE.instantiation = iE.creation;	// deprecated, for compatibility
		if (iE.instantiation) oE.instantiation = iE.instantiation;
		if (oE.instantiation) {
			let idx = oE.instantiation.indexOf('manual');	// deprecated
			if (idx > -1) oE.instantiation.splice(idx, 1, 'user')
		};
		// Up until v0.10.5, the pClasses themself are listed, starting v0.10.6 their ids are listed as a string.
		if (Array.isArray(iE[this.names.pClasses]) && iE[this.names.pClasses].length > 0)
			if (typeof (iE[this.names.pClasses][0]) == 'string')
				// copy the list of pClasses' ids:
				oE.propertyClasses = iE.propertyClasses
			else {
				// internally, the pClasses are stored like in v0.10.6.
				oE.propertyClasses = [];
				iE[this.names.pClasses].forEach((e: PropertyClass) => {
					// Store the pClasses at the top level:
					this.propertyClasses.push(this.pC2int(e));
					// Add to a list with pClass' ids, here:
					oE.propertyClasses.push(e.id)
				})
			}
		else
			oE.propertyClasses = [];
		//				console.debug('anyClass 2int',iE,oE);
		return oE
	}
	// a resource class:
	private rC2int(iE: ResourceClass): ResourceClass {
		var oE: any = this.aC2int(iE);

		// If "iE.isHeading" is defined, use it:
		if (typeof (iE.isHeading) == 'boolean') {
			oE.isHeading = iE.isHeading;
			return oE
		};
		// else: take care of older data without "isHeading":
		if (iE.title == 'SpecIF:Heading') {
			oE.isHeading = true;
			return oE
		};
		// else: look for a property class being configured in CONFIG.headingProperties
		let pC;
		for (var a = oE.propertyClasses.length - 1; a > -1; a--) {
			pC = oE.propertyClasses[a];
			// look up propertyClass starting v0.101.6:
			if (typeof (pC) == 'string') pC = itemById(this.propertyClasses, pC);
			if (CONFIG.headingProperties.indexOf(pC.title) > -1) {
				oE.isHeading = true;
				break
			}
		};
		//				console.debug('resourceClass 2int',iE,oE);
		return oE
	}
	// a statementClass:
	private sC2int(iE): StatementClass {
		var oE: StatementClass = this.aC2int(iE);
		if (iE.isUndirected) oE.isUndirected = iE.isUndirected;
		if (iE[this.names.subClasses]) oE.subjectClasses = iE[this.names.subClasses];
		if (iE[this.names.objClasses]) oE.objectClasses = iE[this.names.objClasses];
		//				console.debug('statementClass 2int',iE,oE);
		return oE
	}
	// a hierarchyClass:
	private hC2int(iE) {
		// hierarchyClasses (used up until v0.10.6) are stored as resourceClasses,
		// later on, the hierarchy-roots will be stored as resources referenced by a node:
		var oE = this.aC2int(iE);
		oE.isHeading = true;
		//				console.debug('hierarchyClass 2int',iE,oE);
		return oE
	}
	// a property:
	private p2int(iE): Property {
		var dT: DataType = dataTypeOf(this, iE[this.names.pClass]),
			oE: Property = {
				// no id
				class: iE[this.names.pClass]
			};
		if (iE.title) oE.title = cleanValue(iE.title);
		if (iE.description) oE.description = cleanValue(iE.description);

		switch (dT.type) {
			case 'xs:string':
			case 'xhtml':
				oE.value = cleanValue(iE.value);
				oE.value = Array.isArray(oE.value) ?
					// multiple languages:
					forAll(oE.value,
						(val) => {
							val.text = uriBack2slash(val.text);
							return val;
						})
					// single language:
					: uriBack2slash(oE.value);
				break;
			default:
				// According to the schema, all property values are represented by a string
				// and internally they are stored as string as well to avoid inaccuracies
				// by multiple transformations:
				oE.value = cleanValue(iE.value);
		};
		// properties do not have their own revision and change info
//		console.debug('propValue 2int',iE,pT,oE);
		return oE
	}
	// common for all instances:
	private a2int(iE): Instance {
		var oE = this.i2int(iE);
		// resources must have a title, but statements may come without:
		if (iE.title)
			oE.title = cleanValue(iE.title);
		if (iE.properties && iE.properties.length > 0)
			oE.properties = forAll( iE.properties, (e: any): Property => { return this.p2int(e) });
//		console.debug('a2int',iE,simpleClone(oE));
		return oE
	}
	// a resource:
	private r2int(iE): Resource {
		var oE: Resource = this.a2int(iE);
		oE['class'] = iE[this.names.rClass];
//		console.debug('resource 2int',iE,simpleClone(oE));
		return oE
	}
	// a statement:
	private s2int(iE): Statement {
		var oE = this.a2int(iE);
		oE['class'] = iE[this.names.sClass];
		// SpecIF allows subjects and objects with id alone or with  a key (id+revision):
		// keep original and normalize to id+revision for display:
		//	if( iE.isUndirected ) oE.isUndirected = iE.isUndirected;
		oE.subject = iE.subject;
		oE.object = iE.object;

		// special feature to import statements to complete,
		// used for example by the XLS or ReqIF import:
		if (iE.subjectToFind) oE.subjectToFind = iE.subjectToFind;
		if (iE.objectToFind) oE.objectToFind = iE.objectToFind;
//		console.debug('statement 2int',iE,oE);
		return oE
	}
	// a hierarchy:
	private h2int(eH: SpecifNode) {
		// the properties are stored with a resource, while the hierarchy is stored as a node with reference to that resource:
		if (this.names.hClasses) {
			// up until v0.10.6, transform hierarchy root to a regular resource:
			var iR = this.a2int(eH),
				//  ... and add a link to the hierarchy:
				iH = {
					id: 'N-' + iR.id,
					resource: iR.id,
					changedAt: eH.changedAt
				};
			iR['class'] = eH[this.names.hClass];
			this.resources.push(iR);

			if (eH.revision) iH.revision = eH.revision.toString()
		}
		else {
			// starting v0.10.8:
			var iH = this.i2int(eH);
			iH.resource = eH.resource
		};

		// SpecIF allows resource references with id alone or with  a key (id+revision):
		iH.nodes = forAll(eH.nodes, n2int);
//		console.debug('hierarchy 2int',eH,iH);
		return iH

		// a hierarchy node:
		function n2int(eN) {
			switch (typeof (eN.revision)) {
				case 'number':
					eN.revision = eN.revision.toString()
			};
			forAll(eN.nodes, n2int);
			return eN
		}
	}
	// a file:
	private f2int(iF) {
		var oF = this.i2int(iF);
		oF.title = iF.title ? iF.title.replace(/\\/g, '/') : iF.id;
		// store the blob and it's type:
		if (iF.blob) {
			oF.type = iF.blob.type || iF.type || attachment2mediaType(iF.title);
			oF.blob = iF.blob;
		}
		else if (iF.dataURL) {
			oF.type = iF.type || attachment2mediaType(iF.title);
			oF.dataURL = iF.dataURL;
		}
		else
			oF.type = iF.type;
		return oF
	}
	toExt( opts?: any ):SpecIF {
		// transform self.data to SpecIF;
		// if opts.targetLanguage has no value, all available languages are kept.

//		console.debug('toExt', this, opts );
		// transform internal data to SpecIF:
		var spD: SpecIF = {
			id: this.id,
			title: languageValueOf(this.title, opts),
			$schema: 'https://specif.de/v' + CONFIG.specifVersion + '/schema.json',
			generator: app.title,
			generatorVersion: CONFIG.appVersion,
			createdAt: new Date().toISOString()
		};

		if (this.description) spD.description = languageValueOf(this.description, opts);

		if (this.rights && this.rights.title && this.rights.url) {
			spD.rights = this.rights;
			if (!this.type) spD.type = "dcterms:rights";
		}
		else
			spD.rights = {
				title: "Creative Commons 4.0 CC BY-SA",
				type: "dcterms:rights",
				url: "https://creativecommons.org/licenses/by-sa/4.0/"
			};

		if (app.me && app.me.email) {
			spD.createdBy = {
				familyName: app.me.lastName,
				givenName: app.me.firstName,
				email: { type: "text/html", value: app.me.email }
			};
			if (app.me.organization)
				spD.createdBy.org = { organizationName: app.me.organization };
		}
		else {
			if (this.createdBy && this.createdBy.email && this.createdBy.email.value) {
				spD.createdBy = {
					familyName: this.createdBy.familyName,
					givenName: this.createdBy.givenName,
					email: { type: "text/html", value: this.createdBy.email.value }
				};
				if (this.createdBy.org && this.createdBy.org.organizationName)
					spD.createdBy.org = this.createdBy.org;
			};
			// else: don't add createdBy without data
		};

		// Now start to assemble the SpecIF output:
		if (this.dataTypes && this.dataTypes.length > 0)
			spD.dataTypes = forAll(this.dataTypes, dT2ext);
		if (this.propertyClasses && this.propertyClasses.length > 0)
			spD.propertyClasses = forAll(this.propertyClasses, pC2ext);
		spD.resourceClasses = forAll(this.resourceClasses, rC2ext);
		spD.statementClasses = forAll(this.statementClasses, sC2ext);
		spD.resources = forAll((opts.allResources ? this.resources : collectResourcesByHierarchy(this)), r2ext);
		spD.statements = forAll(this.statements, s2ext);
		spD.hierarchies = forAll(this.hierarchies, n2ext);
		if (this.files && this.files.length > 0)
			spD.files = forAll(this.files, f2ext);

		// Check whether all statements reference resources or statements, which are listed.
		// Obviously this check can only be done at the end ..
		let lenBefore: number;
		do {
			lenBefore = spD.statements.length;
			spD.statements = spD.statements.filter(
				(s) => {
					return (indexById(spD.resources, itemIdOf(s.subject)) > -1
						|| indexById(spD.statements, itemIdOf(s.subject)) > -1)
						&& (indexById(spD.resources, itemIdOf(s.object)) > -1
							|| indexById(spD.statements, itemIdOf(s.object)) > -1)
				}
			);
			console.info("Suppressed " + (lenBefore - spD.statements.length) + " statements, because subject or object are not listed.");
		}
		while (spD.statements.length < lenBefore);

		// Add a resource as hierarchyRoot, if needed.
		// It is assumed, 
		// - that in general SpecIF data do not have a hierarchy root with meta-data.
		// - that ReqIF specifications (=hierarchyRoots) are transformed to regular resources on input.
		function outlineTypeIsNotHidden(hPL?): boolean {
			if (!hPL || hPL.length < 1) return true;
			for (var i = hPL.length - 1; i > -1; i--) {
				if (hPL[i].title == CONFIG.propClassType
					&& (typeof (hPL[i].value) != 'string' || hPL[i].value == CONFIG.resClassOutline))
					return false;
			};
			return true;
		}
		if (opts.createHierarchyRootIfNotPresent && aHierarchyHasNoRoot(spD)) {

			console.info("Adding a hierarchyRoot");
			addE("resourceClass", "RC-HierarchyRoot", spD);

			// ToDo: Let the program derive the referenced class ids from the above
			addE("propertyClass", "PC-Type", spD);
			addE("propertyClass", "PC-Description", spD);
			addE("propertyClass", "PC-Name", spD);
			addE("dataType", "DT-ShortString", spD);
			addE("dataType", "DT-Text", spD);

			var res = {
				id: 'R-' + simpleHash(spD.id),
				title: spD.title,
				class: "RC-HierarchyRoot",
				properties: [{
					class: "PC-Name",
					value: spD.title
				}],
				changedAt: spD.createdAt
			};
			// Add the resource type, if it is not hidden:
			let rC = itemById(spD.resourceClasses, "RC-HierarchyRoot");
			if (outlineTypeIsNotHidden(opts.hiddenProperties)) {
				addP(res, {
					class: "PC-Type",
					value: rC.title // should be CONFIG.resClassOutline
				});
			};
			// Add a description property only if it has a value:
			if (spD.description)
				addP(res, {
					class: "PC-Description",
					value: spD.description
				});
			spD.resources.push(r2ext(res));
			// create a new root instance:
			spD.hierarchies = [{
				id: "H-" + res.id,
				resource: res.id,
				// .. and add the previous hierarchies as children:
				nodes: spD.hierarchies,
				changedAt: spD.changedAt
			}];
		};

		// ToDo: schema and consistency check (if we want to detect any programming errors)
		//		console.debug('specif.toExt exit',spD);
		return spD

		function aHierarchyHasNoRoot(dta: SpecIF): boolean {
			for (var i = dta.hierarchies.length - 1; i > -1; i--) {
				let hR = itemById(dta.resources, dta.hierarchies[i].resource);
				if (!hR) {
					throw Error("Hierarchy '", dta.hierarchies[i].id, "' is corrupt");
				};
				let prpV = valByTitle(hR, CONFIG.propClassType, dta),
					hC = itemById(dta.resourceClasses, hR['class']);
				// The type of the hierarchy root can be specified by a property titled CONFIG.propClassType
				// or by the title of the resourceClass:
				if ((!prpV || CONFIG.hierarchyRoots.indexOf(prpV) < 0)
					&& (!hC || CONFIG.hierarchyRoots.indexOf(hC.title) < 0))
					return true;
			};
			return false;
		}
		// common for all items:
		function i2ext(iE) {
			var oE = {
				id: iE.id,
				changedAt: iE.changedAt
			};
			// most items must have a title, but statements may come without:
			if (iE.title) oE.title = titleOf(iE, opts);
			if (iE.description) oE.description = languageValueOf(iE.description, opts);
			if (iE.revision) oE.revision = iE.revision;
			if (iE.replaces) oE.replaces = iE.replaces;
			if (iE.changedBy) oE.changedBy = iE.changedBy;
			if (iE.createdAt) oE.createdAt = iE.createdAt;
			if (iE.createdBy) oE.createdBy = iE.createdBy;
			return oE;
		}
		// a data type:
		function dT2ext(iE: DataType) {
			var oE: DataType = i2ext(iE);
			oE.type = iE.type;
			switch (iE.type) {
				case "xs:double":
					if (iE.fractionDigits) oE.fractionDigits = iE.fractionDigits;
				case "xs:integer":
					if (typeof (iE.minInclusive) == 'number') oE.minInclusive = iE.minInclusive;
					if (typeof (iE.maxInclusive) == 'number') oE.maxInclusive = iE.maxInclusive;
					break;
				case "xhtml":
				case "xs:string":
					if (iE.maxLength) oE.maxLength = iE.maxLength;
					break;
				case "xs:enumeration":
					if (opts.targetLanguage)
						// reduce to the language specified:
						oE.values = forAll(iE.values, (val) => { return { id: val.id, value: languageValueOf(val.value, opts) } })
					else
						oE.values = iE.values
			};
			return oE
		}
		// a property class:
		function pC2ext(iE: PropertyClass) {
			var oE: PropertyClass = i2ext(iE);
			if (iE.value) oE.value = iE.value;  // a default value
			oE.dataType = iE.dataType;
			let dT = itemById(spD.dataTypes, iE.dataType);
			switch (dT.type) {
				case 'xs:enumeration':
					// With SpecIF, he 'multiple' property should be defined at dataType level
					// and can be overridden at propertyType level.
					// 	dT.multiple 	aTs.multiple 	aTs.multiple	effect
					// ---------------------------------------------------------
					//	undefined		undefined 		undefined		false
					//	false			undefined		undefined		false
					//	true			undefined		undefined		true
					//	undefined		false			undefined		false
					//	false			false			undefined		false
					//	true 			false			false			false
					//	undefined		true 			true			true
					//	false			true 			true			true
					//	true 			true 			undefined		true
					// Include the property only, if is different from the dataType's:
					if (iE.multiple && !dT.multiple) oE.multiple = true
					else if (iE.multiple == false && dT.multiple) oE.multiple = false
			};
			return oE
		}
		// common for all instance classes:
		function aC2ext(iE) {
			var oE = i2ext(iE);
			if (iE.icon) oE.icon = iE.icon;
			if (iE.instantiation) oE.instantiation = iE.instantiation;
			if (iE._extends) oE['extends'] = iE._extends;
			if (iE.propertyClasses.length > 0) oE.propertyClasses = iE.propertyClasses;
			return oE
		}
		// a resource class:
		function rC2ext(iE: ResourceClass) {
			var oE: ResourceClass = aC2ext(iE);
			// Include "isHeading" in SpecIF only if true:
			if (iE.isHeading) oE.isHeading = true;
			return oE
		}
		// a statement class:
		function sC2ext(iE: StatementClass) {
			var oE: StatementClass = aC2ext(iE);
			if (iE.isUndirected) oE.isUndirected = iE.isUndirected;
			if (iE.subjectClasses && iE.subjectClasses.length > 0) oE.subjectClasses = iE.subjectClasses;
			if (iE.objectClasses && iE.objectClasses.length > 0) oE.objectClasses = iE.objectClasses;
			return oE
		}
		// a property:
		function p2ext(iE: Property) {
			// skip empty properties:
			if (!iE.value) return;

			// skip hidden properties:
			let pC: PropertyClass = itemById(spD.propertyClasses, iE['class']);
			if (Array.isArray(opts.hiddenProperties)) {
				//	CONFIG.hiddenProperties.forEach( (hP)=>{
				opts.hiddenProperties.forEach((hP) => {
					if (hP.title == (iE.title || pC.title) && (hP.value == undefined || hP.value == iE.value)) return;
				});
			};

			var oE: Property = {
				// no id
				class: iE['class']
			};
			if (iE.title) {
				// skip the property title, if it is equal to the propertyClass' title:
				let ti = titleOf(iE, opts);
				if (ti != pC.title) oE.title = ti;
			};
			if (iE.description) oE.description = languageValueOf(iE.description, opts);

			// According to the schema, all property values are represented by a string
			// and we want to store them as string to avoid inaccuracies by multiple transformations:
			if (opts.targetLanguage) {
				// reduce to the selected language; is used for generation of human readable documents
				// or for formats not supporting multiple languages:
				let dT: DataType = dataTypeOf(spD, iE['class']);
				switch (dT.type) {
					case 'xs:string':
					case 'xhtml':
						if (opts.targetLanguage) {
							if (CONFIG.excludedFromFormatting.indexOf(iE.title || pC.title) > -1)
								// if it is e.g. a title, remove all formatting:
								oE.value = stripHTML(languageValueOf(iE.value, opts)
									// remove any leading whiteSpace:
									.replace(/^\s+/, ""));
							else
								// otherwise transform to HTML, if possible;
								// especially for publication, for example using WORD format:
								oE.value = languageValueOf(iE.value, opts)
									// remove any leading whiteSpace:
									.replace(/^\s+/, "")
									.makeHTML(opts)
									.replace(/<br ?\/>\n/g, "<br/>");

							//								console.debug('p2ext',iE,languageValueOf( iE.value, opts ),oE.value);
							break;
						};
					// else: no break - return the original value
					default:
						//	in case of 'xs:enumeration', 
						//  an id of the dataType's value is given, so it can be taken directly:
						oE.value = iE.value;
				};
			}
			else {
				// for SpecIF export, keep full data structure:
				oE.value = iE.value;
			};
			// properties do not have their own revision and change info; the parent's apply.
			return oE;
		}
		// common for all instances:
		function a2ext(iE) {
			var oE = i2ext(iE);
			//				console.debug('a2ext',iE,opts);
			// resources and hierarchies usually have individual titles, and so we will not lookup:
			oE['class'] = iE['class'];
			if (iE.alternativeIds) oE.alternativeIds = iE.alternativeIds;
			if (iE.properties && iE.properties.length > 0) oE.properties = forAll(iE.properties, p2ext);
			return oE;
		}
		// a resource:
		function r2ext(iE: Resource) {
			var oE: Resource = a2ext(iE);
			//				console.debug('resource 2int',iE,oE);
			return oE;
		}
		// a statement:
		function s2ext(iE: Statement) {
			//				console.debug('statement2ext',iE.title);
			// Skip statements with an open end;
			// At the end it will be checked, wether all referenced resources resp. statements are listed:
			if (!iE.subject || itemIdOf(iE.subject) == CONFIG.placeholder
				|| !iE.object || itemIdOf(iE.object) == CONFIG.placeholder
			) return;

			// The statements usually do use a vocabulary item (and not have an individual title),
			// so we lookup, if so desired, e.g. when exporting to ePub:
			var oE: Statement = a2ext(iE);

			// Skip the title, if it is equal to the statementClass' title;
			// ToDo: remove limitation of single language.
			if (oE.title && typeof (oE.title) == "string") {
				let sC = itemById(spD.statementClasses, iE['class']);
				if (typeof (sC.title) == "string" && oE.title == sC.title)
					delete oE.title;
			};

			//	if( iE.isUndirected ) oE.isUndirected = iE.isUndirected;
			// for the time being, multiple revisions are not supported:
			if (opts.revisionDate) {
				// supply only the id, but not a key:
				oE.subject = itemIdOf(iE.subject);
				oE.object = itemIdOf(iE.object);
			}
			else {
				// supply key or id:
				oE.subject = iE.subject;
				oE.object = iE.object;
			};
			return oE;
		}
		// a hierarchy node:
		function n2ext(iN: SpecifNode) {
			//				console.debug( 'n2ext', iN );
			// just take the non-redundant properties (omit 'title', for example):
			let eN: SpecifNode = {
				id: iN.id,
				changedAt: iN.changedAt
			};
			// for the time being, multiple revisions are not supported:
			if (opts.revisionDate) {
				// supply only the id, but not a key:
				eN.resource = itemIdOf(iN.resource)
			}
			else {
				// supply key or id:
				eN.resource = iN.resource
			};
			if (iN.nodes && iN.nodes.length > 0)
				eN.nodes = forAll(iN.nodes, n2ext);
			if (iN.revision)
				eN.revision = iN.revision;
			return eN
		}
		// a file:
		function f2ext(iF: IFileWithContent) {
			var eF:SpecifFile = {
				id: iF.id,  // is the distinguishing/relative part of the URL
				title: iF.title,
				type: iF.type
			};
			if (iF.blob) eF.blob = iF.blob;
			if (iF.revision) eF.revision = iF.revision;
			eF.changedAt = iF.changedAt;
			if (iF.changedBy) eF.changedBy = iF.changedBy;
			//			if( iF.createdAt ) eF.createdAt = iF.createdAt;
			//			if( iF.createdBy ) eF.createdBy = iF.createdBy;
			return eF
		}
	}
	private cacheNode(e: INodeWithPosition): boolean {
		// add or replace a node in a hierarchy;
		// e may specify a predecessor or parent, the former prevails if both are specified
		// - if there is no predecessor or it isn't found, insert as first element
		// - if no parent is specified or the parent isn't found, insert at root level

		// 1. Delete the node, if it exists somewhere to prevent
		//    that there are multiple nodes with the same id;
		//    Thus, 'cacheNode' is in fact a 'move':
		this.uncache('node', { id: e.id });

		// 2. Insert the node, if the predecessor exists somewhere:
		if (iterateNodes(this.hierarchies,
			// continue searching until found:
			(nd: SpecifNode) => { return nd.id != e.predecessor },
			// insert the node after the predecessor:
			(ndL: SpecifNode[]) => {
				let i = indexById(ndL as Item[], e.predecessor);
				if (i > -1) ndL.splice(i + 1, 0, e);
			}
		))
			return true;

		// 3. Insert the node, if the parent exists somewhere:
		if (iterateNodes(this.hierarchies,
			// continue searching until found:
			(nd: SpecifNode) => {
				if (nd.id == e['parent']) {
					if (!Array.isArray(nd.nodes)) nd.nodes = [];
					// we will not find a predecessor at this point any more,
					// so insert as first element of the children:
					nd.nodes.unshift(e);
					return false; // stop searching
				};
				return true;  // continue searching
			}
			// no list function
		)
		) return true;

		// 4. insert the node as first root element, otherwise:
		this.hierarchies.unshift(e);
		return false;
	}
	cache(ctg: string, item: Item[] | Item): void {
		if (!item || Array.isArray(item) && item.length < 1)
			return;
		// If item is a list, all elements must have the same category.
		let fn = Array.isArray(item) ? cacheL : cacheE;
		switch (ctg) {
			case 'hierarchy':
			case 'dataType':
			case 'propertyClass':
			case 'resourceClass':
			case 'statementClass':
				// @ts-ignore - addressing is perfectly ok
				fn(this[standardTypes.listNameOf(ctg)], item);
				return;
			case 'resource':
			case 'statement':
			case 'file':
				if (app.cache.cacheInstances) {
					// @ts-ignore - addressing is perfectly ok
					fn(this[standardTypes.listNameOf(ctg)], item);
				};
				return;
			case 'node':
				if (Array.isArray(item))
					throw Error("No list of nodes supported.");
				//				console.debug('cache',ctg,item);
				this.cacheNode(item as INodeWithPosition);
				return
			default:
				throw Error("Invalid category '" + ctg + "'.");
		};
		// all cases have a return statement ..

	}
	readCache(ctg: string, itm: Item[] | Item | string): Item[] {
		// Read an item from cache, unless 'reload' is specified.
		// - itm can be single or a list,
		// - each element can be an object with attribute id or an id string
		// @ts-ignore - addressing is perfectly ok
		let cch: Item[] = this[standardTypes.listNameOf(ctg)],
			idx: number;

		if (itm == 'all') {
			// return all cached items asynchronously:
			return simpleClone(cch);	// return a new list with the original elements
		};

		if (Array.isArray(itm)) {
			let allFound = true, i = 0, I = itm.length;
			var rL: Item[] = [];
			while (allFound && i < I) {
				idx = indexById(cch, itm[i].id || itm[i]);
				if (idx > -1) {
					rL.push(cch[idx]);
					i++;
				} else {
					allFound = false;
				}
			};
			if (allFound) {
				//				console.debug( 'readCache array - allFound', cch, itm );
				return rL;
			} else {
				return [];
			};
		}
		else {
			// is a single item:
			idx = indexById(cch, itm.id || itm);
			if (idx > -1) {
				return [cch[idx]]
			} else {
				return [];
			}
		};
		//		console.debug('readCache - not found', ctg, itm);
	}
	uncache(ctg: string, item: Item): boolean | undefined {
		if (!item) return;
		let fn = Array.isArray(item) ? uncacheL : uncacheE;
		switch (ctg) {
			case 'hierarchy':
			case 'dataType':
			case 'propertyClass':
			case 'resourceClass':
			case 'statementClass':
				// @ts-ignore - addressing is perfectly ok
				return fn(this[standardTypes.listNameOf(ctg)], item);
			case 'resource':
			case 'statement':
			case 'file':
				if (app.cache.cacheInstances)
					// @ts-ignore - addressing is perfectly ok
					return fn(this[standardTypes.listNameOf(ctg)], item);
				return;
			case 'node':
				if (Array.isArray(item))
					item.forEach((el: SpecifNode) => { delNodes(this.hierarchies, el) })
				else
					delNodes(this.hierarchies, item as SpecifNode);
				return;
			/*	default: return; // programming error */
		};
		// all cases have a return statement ..

		function delNodes(L: SpecifNode[], el: SpecifNode): void {
			// Delete all nodes specified by the element;
			// if el is the node, 'id' will be used to identify it (obviously at most one node),
			// and if el is the referenced resource, 'resource' will be used to identify all referencing nodes.
			if (Array.isArray(L))
				for (var h = L.length - 1; h > -1; h--) {
					if (L[h].id == el.id || L[h].resource == el.resource) {
						L.splice(h, 1);
						break;	// can't delete any children
					};
					// step down, if the node hasn't been deleted:
					delNodes(L[h].nodes as SpecifNode[], el);
				};
		}
	}
}

const specif = {
	check: (data: SpecIF, opts?: any): Promise<SpecIF> => {
		// Check the SpecIF data for schema compliance and consistency;
		// no data of app.cache is modified:
		return new Promise(
			(resolve,reject)=>{

				if (typeof (data) == 'object') {

					// 1. Get the "official" routine for checking schema and constraints
					//    - where already loaded checking routines are replaced by the newly loaded ones
					//    - use $.ajax() with options since it is more flexible than $.getScript
					//    - the first (relative) URL is for debugging within a local clone of Github
					//    - both of the other (absolute) URLs are for a production environment
					$.ajax({
						dataType: "script",
						cache: true,
						url: (data['$schema'] && data['$schema'].indexOf('v1.0')<0 ?
												(window.location.href.startsWith('file:/') ? '../../SpecIF/check/check.js'
												: 'https://specif.de/v' + /\/(?:v|specif-)([0-9]+\.[0-9]+)\//.exec(data['$schema'])[1] + '/check.min.js' )
												: 'https://specif.de/v1.0/check.js' ) // older versions are covered by v1.0/check.js
					})
					.done( ()=>{
						// 2. Get the specified schema file:
						httpGet({
							// @ts-ignore - 'specifVersion' is defined for versions <1.0
							url: (data['$schema'] || 'https://specif.de/v' + data.specifVersion + '/schema'),
							responseType: 'arraybuffer',
							withCredentials: false,
							done: handleResult,
							fail: handleError
						});
					})
					.fail(handleError);  
				}
				else {
					reject({ status: 999, statusText: 'No SpecIF data to check' });
				};
				return;

				function handleResult(xhr: XMLHttpRequest) {
					if (typeof (checkSchema) == 'function' && typeof (checkConstraints) == 'function') {
//						console.debug('schema', xhr);
						// 1. check data against schema:
						// @ts-ignore - checkSchema() is defined in check.js loaded at runtime
						let rc: xhrMessage = checkSchema(data, { schema: JSON.parse(ab2str(xhr.response)) });
						if (rc.status == 0) {
							// 2. Check further constraints:
							// @ts-ignore - checkConstraints() is defined in check.js loaded at runtime
							rc = checkConstraints(data, opts);
							if (rc.status == 0) {
								resolve(data);
							}
							else {
								reject(rc);
							};
						}
						else {
							// older versions of the checking routine don't set the responseType:
							if (typeof (rc.responseText) == 'string' && rc.responseText.length > 0)
								rc.responseType = 'text';
							reject(rc);
						};
					}
					else {
						reject({ status: 999, statusText: 'Standard routines checkSchema and checkConstraints are not available.' });
					}
				}
				function handleError(xhr: xhrMessage) {
					switch (xhr.status) {
						case 404:
							// @ts-ignore - 'specifVersion' is defined for versions <1.0
							let v = data.specifVersion ? 'version ' + data.specifVersion : 'with Schema ' + data['$schema'];
							xhr = { status: 903, statusText: 'SpecIF ' + v + ' is not supported by the program!' };
						// no break
						default:
							reject(xhr);
					};
				}
			}
		);
	}
}
