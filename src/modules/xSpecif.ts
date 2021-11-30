/*!	Transformation Library for SpecIF data for import to and export from the internal data structure.
	Dependencies: jQuery 3.5+
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
	// Transform a SpecIF data-set of several versions to the internal representation of the SpecIF Viewer/Editor
	// and also transform it back to a SpecIF data-set of the most recent version.
	id = '';
	$schema = '';
	title = '';
	description = '';
	generator = '';
	generatorVersion = '';
	rights: any = {};
	createdAt = '';
	createdBy: CreatedBy;

	dataTypes: DataType[] = [];
	propertyClasses: PropertyClass[] = [];
	resourceClasses: ResourceClass[] = [];
	statementClasses: StatementClass[] = [];
	files: IFileWithContent[] = [];
	resources: Resource[] = [];   		// list of resources as referenced by the hierarchies
	statements: Statement[] = [];
	hierarchies: SpecifNode[] = [];    	// listed specifications (aka hierarchies, outlines) of the project.

	constructor() {
	}
	isValid(spD?: any): boolean {
		if (!spD) spD = this;
		return typeof (spD.id) == 'string' && spD.id.length > 0;
	}
	set(spD:any,opts?:any) {
		return new Promise(
			(resolve, reject) => {
				if (opts && opts.noCheck) {
					this.toInt(spD);
					resolve(this)
				}
				else
					this.check(spD,opts)
						.then(
							(nD) => { this.toInt(nD); resolve(this) },
							reject
						)
			}
		);
	} 
	private check(spD: SpecIF, opts?: any): Promise<SpecIF> {
		// Check the SpecIF data for schema compliance and consistency;
		// 'this' isn't modified, so it is used before 'toInt' is called:
		return new Promise(
			(resolve, reject) => {
				let checker: any;

				if (typeof (spD) == 'object') {
					// 1a. Get the "official" routine for checking schema and constraints
					//    - where already loaded checking routines are replaced by the newly loaded ones
					//    - use $.ajax() with options since it is more flexible than $.getScript
					//    - the first (relative) URL is for debugging within a local clone of Github
					//    - both of the other (absolute) URLs are for a production environment
					$.ajax({
						dataType: "script",
						cache: true,
						url: (spD['$schema'] && spD['$schema'].indexOf('v1.0') < 0 ?
							(window.location.href.startsWith('file:/') ? '../../SpecIF/check/CCheck.min.js'
								: 'https://specif.de/v' + /\/(?:v|specif-)([0-9]+\.[0-9]+)\//.exec(spD['$schema'])[1] + '/CCheck.min.js')
							: 'https://specif.de/v1.0/CCheck.min.js') // older versions are covered by v1.0/check.js
					})
					.done(() => {
						// 2. Get the specified schema file:
						Lib.httpGet({
							// @ts-ignore - 'specifVersion' is defined for versions <1.0
							url: (spD['$schema'] || 'https://specif.de/v' + spD.specifVersion + '/schema'),
							responseType: 'arraybuffer',
							withCredentials: false,
							done: handleResult,
							fail: handleError
						});
						// 1b. Instantiate checker:
						// @ts-ignore - 'CCheck' has just been loaded dynamically:
						checker = new CCheck();
					})
					.fail(handleError);
				}
				else {
					reject({ status: 999, statusText: 'No SpecIF data to check' });
				};
				return;

				function handleResult(xhr: XMLHttpRequest) {
					// @ts-ignore - checkSchema() and checkConstraints() are defined in check.js loaded at runtime
					if (typeof (checker.checkSchema) == 'function' && typeof (checker.checkConstraints) == 'function') {
						//						console.debug('schema', xhr);
						// 1. check data against schema:
						// @ts-ignore - checkSchema() is defined in check.js loaded at runtime
						let rc: xhrMessage = checker.checkSchema(spD, { schema: JSON.parse(Lib.ab2str(xhr.response)) });
						if (rc.status == 0) {
							// 2. Check further constraints:
							// @ts-ignore - checkConstraints() is defined in check.js loaded at runtime
							rc = checker.checkConstraints(spD, opts);
							if (rc.status == 0) {
								resolve(spD);
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
							let v = spD.specifVersion ? 'version ' + spD.specifVersion : 'with Schema ' + spD['$schema'];
							xhr = { status: 903, statusText: 'SpecIF ' + v + ' is not supported by the program!' };
						// no break
						default:
							reject(xhr);
					};
				}
			}
		);
	}
	private toInt(spD: any):void {
		if (!this.isValid(spD)) return;

		// transform SpecIF to internal data;
		// no data of app.cache is modified.
		// It is assumed that spD has passed the schema and consistency check.
//		console.debug('set',simpleClone(spD));
		let self = this,
			names = new CSpecifItemNames(spD.specifVersion);

		// Differences when using forAll() instead of [..].map():
		// - tolerates missing input list (not all are mandatory for SpecIF)
		// - suppresses undefined list items in the result, so in effect forAll() is a combination of .map() and .filter().
		try {
			this.dataTypes = Lib.forAll( spD.dataTypes, dT2int );
			this.propertyClasses = Lib.forAll(spD.propertyClasses, pC2int );
			this.resourceClasses = Lib.forAll( spD[names.rClasses], rC2int );
			this.statementClasses = Lib.forAll( spD[names.sClasses], sC2int );
			if (names.hClasses)
				this.resourceClasses = this.resourceClasses.concat( Lib.forAll( spD[names.hClasses], hC2int ));
			this.resources = Lib.forAll( spD.resources, r2int );
			this.statements = Lib.forAll( spD.statements, s2int );
			this.hierarchies = Lib.forAll( spD.hierarchies, h2int );
			this.files = Lib.forAll( spD.files, f2int )
		}
		catch (e) {
			let txt = "Error when importing the project '" + spD.title + "'";
			console.log(txt);
			message.show({ status: 999, statusText: txt }, { severity: 'danger' });
			return; // undefined 
		};

		// header information provided only in case of project creation, but not in case of project update:
		if (spD.generator) this.generator = spD.generator;
		if (spD.generatorVersion) this.generatorVersion = spD.generatorVersion;
		if (spD.createdBy) this.createdBy = spD.createdBy;
		if (spD.createdAt) this.createdAt = spD.createdAt;
		if (spD.description) this.description = spD.description;
		if (spD.title) this.title = spD.title;
		if (spD.id) this.id = spD.id;

//		console.debug('specif.toInt',simpleClone(this));

		function i2int(iE:any) {
			// common for all items:
			var oE: any = {
				id: iE.id,
				changedAt: iE.changedAt
			};
			if (iE.description) oE.description = Lib.cleanValue(iE.description);
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
	//		console.debug('item 2int',iE,oE);
			return oE
		}
		// a data type:
		function dT2int(iE:any): DataType {
			var oE: any = i2int(iE);
			oE.title = Lib.cleanValue(iE.title);
			oE.type = iE.type;
			switch (iE.type) {
				case "xs:double":
					oE.fractionDigits = iE[names.frct];
					oE.minInclusive = iE[names.minI];
					oE.maxInclusive = iE[names.maxI];
					break;
				case "xs:integer":
					oE.minInclusive = iE[names.minI];
					oE.maxInclusive = iE[names.maxI];
					break;
				case "xhtml":
				case "xs:string":
					if (typeof (iE.maxLength) == 'number')
						oE.maxLength = iE.maxLength;
					break;
				case "xs:enumeration":
					if (iE.values)
						oE.values = Lib.forAll(iE.values, (v): EnumeratedValue => {
							// 'v.title' until v0.10.6, 'v.value' thereafter;
							// 'v.value' can be a string or a multilanguage object.
							return {
								id: v.id,
								value: typeof (v.value) == 'string' || typeof (v.value) == 'object' ? v.value : v.title  // works also for v.value==''
							}
						})
			};
//			console.debug('dataType 2int',iE);
			return oE
		}
		// a property class:
		function pC2int(iE: PropertyClass): PropertyClass {
			var oE: any = i2int(iE);
			oE.title = Lib.cleanValue(iE.title);	// an input file may have titles which are not from the SpecIF vocabulary.
			if (iE.description) oE.description = Lib.cleanValue(iE.description);
			if (iE.value) oE.value = Lib.cleanValue(iE.value);
			oE.dataType = iE.dataType;
			let dT: DataType = itemById(self.dataTypes, iE.dataType);
//			console.debug('pC2int',iE,dT);
			switch (dT.type) {
				case 'xs:enumeration':
					// include the property only, if it is different from the dataType's:
					if (iE.multiple && !dT.multiple) oE.multiple = true
					else if (iE.multiple == false && dT.multiple) oE.multiple = false
			};
//			console.debug('propClass 2int',iE,oE);
			return oE
		}
		// common for all instance classes:
		function aC2int(iE:any) {
			var oE: any = i2int(iE);
			oE.title = Lib.cleanValue(iE.title);
			if (iE['extends']) oE._extends = iE['extends'];	// 'extends' is a reserved word starting with ES5
			if (iE.icon) oE.icon = iE.icon;
			if (iE.creation) oE.instantiation = iE.creation;	// deprecated, for compatibility
			if (iE.instantiation) oE.instantiation = iE.instantiation;
			if (oE.instantiation) {
				let idx = oE.instantiation.indexOf('manual');	// deprecated
				if (idx > -1) oE.instantiation.splice(idx, 1, 'user')
			};
			// Up until v0.10.5, the pClasses themself are listed, starting v0.10.6 their ids are listed as a string.
			if (Array.isArray(iE[names.pClasses]) && iE[names.pClasses].length > 0)
				if (typeof (iE[names.pClasses][0]) == 'string')
					// copy the list of pClasses' ids:
					oE.propertyClasses = iE.propertyClasses
				else {
					// internally, the pClasses are stored like in v0.10.6.
					oE.propertyClasses = [];
					iE[names.pClasses].forEach((e: PropertyClass) => {
						// Store the pClasses at the top level:
						self.propertyClasses.push(pC2int(e));
						// Add to a list with pClass' ids, here:
						oE.propertyClasses.push(e.id)
					})
				}
			else
				oE.propertyClasses = [];
//			console.debug('anyClass 2int',iE,oE);
			return oE
		}
		// a resource class:
		function rC2int(iE: ResourceClass): ResourceClass {
			var oE: any = aC2int(iE);

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
				if (typeof (pC) == 'string') pC = itemById(self.propertyClasses, pC);
				if (CONFIG.headingProperties.indexOf(pC.title) > -1) {
					oE.isHeading = true;
					break
				}
			};
//			console.debug('resourceClass 2int',iE,oE);
			return oE
		}
		// a statementClass:
		function sC2int(iE:any): StatementClass {
			var oE: StatementClass = aC2int(iE);
			if (iE.isUndirected) oE.isUndirected = iE.isUndirected;
			if (iE[names.subClasses]) oE.subjectClasses = iE[names.subClasses];
			if (iE[names.objClasses]) oE.objectClasses = iE[names.objClasses];
//			console.debug('statementClass 2int',iE,oE);
			return oE
		}
		// a hierarchyClass:
		function hC2int(iE:any) {
			// hierarchyClasses (used up until v0.10.6) are stored as resourceClasses,
			// later on, the hierarchy-roots will be stored as resources referenced by a node:
			var oE = aC2int(iE);
			oE.isHeading = true;
//			console.debug('hierarchyClass 2int',iE,oE);
			return oE
		}
		// a property:
		function p2int(iE:any): Property {
			var dT: DataType = dataTypeOf(self, iE[names.pClass]),
				oE: Property = {
					// no id
					class: iE[names.pClass]
				};
			if (iE.title) oE.title = Lib.cleanValue(iE.title);
			if (iE.description) oE.description = Lib.cleanValue(iE.description);

			switch (dT.type) {
				case 'xs:string':
				case 'xhtml':
					oE.value = Lib.cleanValue(iE.value);
					oE.value = Array.isArray(oE.value) ?
						// multiple languages:
						Lib.forAll(oE.value,
							(val) => {
								val.text = Lib.uriBack2slash(val.text);
								return val;
							})
						// single language:
						: Lib.uriBack2slash(oE.value);
					break;
				default:
					// According to the schema, all property values are represented by a string
					// and internally they are stored as string as well to avoid inaccuracies
					// by multiple transformations:
					oE.value = Lib.cleanValue(iE.value);
			};
			// properties do not have their own revision and change info
//			console.debug('propValue 2int',iE,pT,oE);
			return oE
		}
		// common for all instances:
		function a2int(iE:any): Instance {
			var oE = i2int(iE), eC;
			// resources must have a title, but statements may come without:
			if (iE.title)
				oE.title = Lib.cleanValue(iE.title);
			if (iE.properties && iE.properties.length > 0)
				oE.properties = Lib.forAll(iE.properties, (e: any): Property => { return p2int(e) });

	 		// Are there resources with description, but without description property?
			// See tutorial 2 "Related Terms": https://github.com/GfSE/SpecIF/blob/master/tutorials/v1.0/02_Related-Terms.md
			// In this case, add a description property to hold the description as required by SpecIF v1.1:
			if (descPropertyNeeded(oE)) {
				// There is an attempt to add the types in every loop ... which is hardly efficient.
				// However, that way they are only added, if needed.
				console.info("Adding a description property to element with id '" + oE.id + "'");
				// a. add dataType, if not yet defined:
				standardTypes.addTo("dataType", "DT-Text", self);
				// b. add property class, if not yet defined:
				standardTypes.addTo("propertyClass", "PC-Description", self);
				// c. Add propertyClass to element class:
				eC = iE.subject ? itemById(self.statementClasses, iE[names.sClass])
						: itemById(self.resourceClasses, iE[names.rClass]);
				addPCReference(eC, "PC-Description");
				// d. Add description property to element;
				addP(oE, {
					class: "PC-Description",
					value: oE.description
				});
			};

			// Similarly, add a title property if missing:
			if (titlePropertyNeeded(oE)) {
				// There is an attempt to add the types in every loop ... which is hardly efficient.
				// However, that way they are only added, if needed.
				console.info("Adding a title property to element with id '" + oE.id + "'");
				// a. add dataType, if not yet defined:
				standardTypes.addTo("dataType", "DT-ShortString", self);
				// b. add property class, if not yet defined:
				standardTypes.addTo("propertyClass", "PC-Name", self);
				// c. Add propertyClass to element class:
				eC = iE.subject ? itemById(self.statementClasses, iE[names.sClass])
						: itemById(self.resourceClasses, iE[names.rClass]);
				addPCReference(eC, "PC-Name");
				// d. Add title property to element;
				addP(oE, {
					class: "PC-Name",
					// no title is required in case of statements; it's class' title applies by default:
					value: oE.title
				});
			};

//			console.debug('a2int',iE,simpleClone(oE));
			return oE

			function titlePropertyNeeded(el): boolean {
				if (el.title && el.title.length > 0) {
					if (Array.isArray(el.properties))
						for (var i = el.properties.length - 1; i > -1; i--) {
							let ti = propTitleOf(el.properties[i], self);
							if (CONFIG.titleProperties.indexOf(ti) > -1)
								// SpecIF assumes that any title property *replaces* the element's title,
								// so we just look for the case of *no* title property.
								// There is no consideration of the content.
								// It is expected that titles with multiple languages have been reduced, before.
								return false; // title property is available
						};
					return true;
				};
				return false; // no title, thus no property needed
			}
			function descPropertyNeeded(el) {
				if (el.description && el.description.length > 0) {
					if (Array.isArray(el.properties))
						for (var i = el.properties.length - 1; i > -1; i--) {
							if (CONFIG.descProperties.indexOf(propTitleOf(el.properties[i], self)) > -1)
								// SpecIF assumes that any description property *replaces* the resource's description,
								// so we just look for the case of a resource description and *no* description property.
								// There is no consideration of the content.
								// It is expected that descriptions with multiple languages have been reduced, before.
								return false; // description property is available
						};
					return true; // no array or no description property
				};
				return false; // no description, thus no property needed
			}
		}
		// a resource:
		function r2int(iE:any): Resource {
			var oE: Resource = a2int(iE) as Resource;
			oE['class'] = iE[names.rClass];
//			console.debug('resource 2int',iE,simpleClone(oE));
			return oE
		}
		// a statement:
		function s2int(iE:any): Statement {
			var oE: Statement = a2int(iE) as Statement;
			oE['class'] = iE[names.sClass];
			// SpecIF allows subjects and objects with id alone or with  a key (id+revision):
			// keep original and normalize to id+revision for display:
			//	if( iE.isUndirected ) oE.isUndirected = iE.isUndirected;
			oE.subject = iE.subject;
			oE.object = iE.object;

			// special feature to import statements to complete,
			// used for example by the XLS or ReqIF import:
			if (iE.subjectToFind) oE.subjectToFind = iE.subjectToFind;
			if (iE.objectToFind) oE.objectToFind = iE.objectToFind;
//			console.debug('statement 2int',iE,oE);
			return oE
		}
		// a hierarchy:
		function h2int(eH: SpecifNode) {
			// the properties are stored with a resource, while the hierarchy is stored as a node with reference to that resource:
			var iH: any;
			if (names.hClasses) {
				// up until v0.10.6, transform hierarchy root to a regular resource:
				var iR:Resource = a2int(eH) as Resource;
				//  ... and add a link to the hierarchy:
				iH = {
					id: 'N-' + iR.id,
					resource: iR.id,
					changedAt: eH.changedAt
				};
				iR['class'] = eH[names.hClass];
				self.resources.push(iR);

				if (eH.revision) iH.revision = eH.revision.toString()
			}
			else {
				// starting v0.10.8:
				iH = i2int(eH);
				iH.resource = eH.resource
			};

			// SpecIF allows resource references with id alone or with  a key (id+revision):
			iH.nodes = Lib.forAll(eH.nodes, n2int);
//			console.debug('hierarchy 2int',eH,iH);
			return iH

			// a hierarchy node:
			function n2int(eN) {
				switch (typeof (eN.revision)) {
					case 'number':
						eN.revision = eN.revision.toString()
				};
				Lib.forAll(eN.nodes, n2int);
				return eN
			}
		}
		// a file:
		function f2int(iF) {
			var oF = i2int(iF);
			oF.title = iF.title ? iF.title.replace(/\\/g, '/') : iF.id;
			// store the blob and it's type:
			if (iF.blob) {
				oF.type = iF.blob.type || iF.type || Lib.attachment2mediaType(iF.title);
				oF.blob = iF.blob;
			}
			else if (iF.dataURL) {
				oF.type = iF.type || Lib.attachment2mediaType(iF.title);
				oF.dataURL = iF.dataURL;
			}
			else
				oF.type = iF.type;
			return oF
		}
	}
	toExt(opts?: any): Promise<SpecIF> {
		// transform self.data to SpecIF following defined options;
		// a clone is delivered.
		// if opts.targetLanguage has no value, all available languages are kept.

//		console.debug('toExt', this, opts );
		// transform internal data to SpecIF:
		return new Promise(
			(resolve, reject) => {
				var pend = 0,
					spD: SpecIF = {
						id: this.id,
						title: languageValueOf(this.title, opts),
						$schema: 'https://specif.de/v' + CONFIG.specifVersion + '/schema.json',
						generator: app.title,
						generatorVersion: CONFIG.appVersion,
						createdAt: new Date().toISOString()
					};

				if (this.description) spD.description = languageValueOf(this.description, opts);

				if (this.rights && this.rights.title && this.rights.url)
					spD.rights = this.rights;
				else
					spD.rights = {
						title: "Creative Commons 4.0 CC BY-SA",
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
				spD.dataTypes = Lib.forAll(this.dataTypes, dT2ext);
				spD.propertyClasses = Lib.forAll(this.propertyClasses, pC2ext);
				spD.resourceClasses = Lib.forAll(this.resourceClasses, rC2ext);
				spD.statementClasses = Lib.forAll(this.statementClasses, sC2ext);
				spD.resources = Lib.forAll((opts.allResources ? this.resources : collectResourcesByHierarchy(this)), r2ext);
				spD.statements = Lib.forAll(this.statements, s2ext);
				spD.hierarchies = Lib.forAll(this.hierarchies, n2ext);
				spD.files = [];
				this.files.forEach( (f) => {
					pend++;
					f2ext(f)
						.then(
							(oF) =>{
								spD.files.push(oF);
								if (--pend < 1) finalize();
							},
							reject
						);
				});
				if (pend < 1) finalize();  // no files, so finalize right away
				return;

				function finalize() {
					// Check whether all statements reference resources or statements, which are listed.
					// Obviously this check can only be done at the end ..
					let lenBefore: number;
					do {
						lenBefore = spD.statements.length;
						spD.statements = spD.statements.filter(
							(s) => {
								return (indexById(spD.resources, Lib.idOf(s.subject)) > -1
									|| indexById(spD.statements, Lib.idOf(s.subject)) > -1)
									&& (indexById(spD.resources, Lib.idOf(s.object)) > -1
										|| indexById(spD.statements, Lib.idOf(s.object)) > -1)
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
						standardTypes.addTo("resourceClass", "RC-HierarchyRoot", spD);

						// ToDo: Let the program derive the referenced class ids from the above
						standardTypes.addTo("propertyClass", "PC-Type", spD);
						standardTypes.addTo("propertyClass", "PC-Description", spD);
						standardTypes.addTo("propertyClass", "PC-Name", spD);
						standardTypes.addTo("dataType", "DT-ShortString", spD);
						standardTypes.addTo("dataType", "DT-Text", spD);

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
					//				console.debug('specif.toExt exit',spD);
					resolve(spD);
				}

				function aHierarchyHasNoRoot(dta: SpecIF): boolean {
					for (var i = dta.hierarchies.length - 1; i > -1; i--) {
						let hR = itemById(dta.resources, dta.hierarchies[i].resource);
						if (!hR) {
							throw Error("Hierarchy '"+dta.hierarchies[i].id+"' is corrupt");
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
				function i2ext(iE:any) {
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
								oE.values = Lib.forAll(iE.values, (val) => { return { id: val.id, value: languageValueOf(val.value, opts) } })
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
				function aC2ext(iE:any) {
					var oE = i2ext(iE);
					if (iE.icon) oE.icon = iE.icon;
					if (iE.instantiation) oE.instantiation = iE.instantiation;
					if (iE._extends) oE['extends'] = iE._extends;
					if (iE.propertyClasses && iE.propertyClasses.length > 0) oE.propertyClasses = iE.propertyClasses;
					return oE
				}
				// a resource class:
				function rC2ext(iE: ResourceClass) {
					var oE: ResourceClass = aC2ext(iE) as ResourceClass;
					// Include "isHeading" in SpecIF only if true:
					if (iE.isHeading) oE.isHeading = true;
					return oE
				}
				// a statement class:
				function sC2ext(iE: StatementClass) {
					var oE: StatementClass = aC2ext(iE) as StatementClass;
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
					if (opts.lookupLanguage && opts.targetLanguage ) {
						// reduce to the selected language; is used for generation of human readable documents
						// or for formats not supporting multiple languages:
						let dT: DataType = dataTypeOf(spD, iE['class']);
						if (['xs:string', 'xhtml'].indexOf(dT.type) > -1) {
							if (opts.makeHTML && CONFIG.excludedFromFormatting.indexOf(iE.title || pC.title) <0) {
								// Transform to HTML, if possible;
								// especially for publication, for example using WORD format:
								oE.value = languageValueOf(iE.value, opts)
									.replace(/^\s+/, "")  // remove any leading whiteSpace
									.makeHTML(opts)
									.replace(/<br ?\/>\n/g, "<br/>");

								oE.value = refDiagramsAsImg(oE.value);
							}
							else {
								// if it is e.g. a title, remove all formatting:
								oE.value = languageValueOf(iE.value, opts)
									.replace(/^\s+/, "")   // remove any leading whiteSpace
									.stripHTML();
							};
							// return 'published' data structure (single language, ...):
//							console.debug('p2ext',iE,languageValueOf( iE.value, opts ),oE.value);
							return oE;
						};
					};
					// else, keep full data structure:
					if (Array.isArray(iE.value)) {
						// Just to avoid the climbing through list and objects, unless necessary:
						if (opts.allDiagramsAsImage) {
							oE.value = [];
							iE.value.forEach(
								(iV) => {
									oE.value.push({ text: refDiagramsAsImg(iV.text), language: iV.language })
								}
							);
						}
						else
							// no replacement of links:
							oE.value = iE.value;
					}
					else
						// iE.value is a string:
						oE.value = refDiagramsAsImg(iE.value);
					return oE;

					function refDiagramsAsImg(val: string): string {
						if (opts.allDiagramsAsImage) {
							// Replace all links to application files like BPMN by links to SVG images:
							let replaced = false;
							// @ts-ignore - $0 is never read, but must be specified anyways
							val = val.replace(RE.tagObject, ($0, $1, $2) => {
//								console.debug('#a', $0, $1, $2);
								if ($1) $1 = $1.replace(RE.attrType, ($4, $5) => {
//									console.debug('#b', $4, $5);
									// ToDo: Further application file formats ... once in use.
									// Use CONFIG.applTypes ... once appropriate.
									if (["application/bpmn+xml"].indexOf($5) > -1) {
										replaced = true;
										return 'type="image/svg+xml"'
									}
									else
										return $4;
								});
								// @ts-ignore - $6 is never read, but must be specified anyways
								if (replaced) $1 = $1.replace(RE.attrData, ($6, $7) => {
//									console.debug('#c', $6, $7);
									return 'data="' + $7.fileName() + '.svg"'
								});
								return '<object ' + $1 + $2;
							});
						};
						return val;
                    }

				/*	// According to the schema, all property values are represented by a string
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
					return oE; */
				}
				// common for all instances:
				function a2ext(iE:any) {
					var oE = i2ext(iE);
//					console.debug('a2ext',iE,opts);
					// resources and hierarchies usually have individual titles, and so we will not lookup:
					oE['class'] = iE['class'];
					if (iE.alternativeIds) oE.alternativeIds = iE.alternativeIds;
					if (iE.properties && iE.properties.length > 0) oE.properties = Lib.forAll(iE.properties, p2ext);
					return oE;
				}
				// a resource:
				function r2ext(iE: Resource) {
					var oE: Resource = a2ext(iE);
					// a resource title shall never be looked up (translated);
					// for example in case of the vocabulary the terms would disappear:

//					console.debug('resource2ext',iE,oE);
					return oE;
				}
				// a statement:
				function s2ext(iE: Statement) {
					// Skip statements with an open end;
					// At the end it will be checked, wether all referenced resources resp. statements are listed:
					if (!iE.subject || Lib.idOf(iE.subject) == CONFIG.placeholder
						|| !iE.object || Lib.idOf(iE.object) == CONFIG.placeholder
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
						oE.subject = Lib.idOf(iE.subject);
						oE.object = Lib.idOf(iE.object);
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
//					console.debug( 'n2ext', iN );
					// just take the non-redundant properties (omit 'title', for example):
					let oN: SpecifNode = {
						id: iN.id,
						// for the time being, multiple revisions are not supported:
						//                            supply only the id, but not a key
						//                            |                           supply key or id
						resource: opts.revisionDate? Lib.idOf(iN.resource) : iN.resource,
						changedAt: iN.changedAt
					};
					
					if (iN.nodes && iN.nodes.length > 0)
						oN.nodes = Lib.forAll(iN.nodes, n2ext);
					if (iN.revision)
						oN.revision = iN.revision;
					return oN
				}
				// a file:
				function f2ext(iF: IFileWithContent): Promise<IFileWithContent> {
					return new Promise(
						(resolve, reject) => {
//							console.debug('f2ext',iF,opts)

							if (!opts || !opts.allDiagramsAsImage || CONFIG.imgTypes.indexOf(iF.type) > -1 ) {
								var oF: IFileWithContent = {
									id: iF.id,
									title: iF.title,
									type: iF.type,
									changedAt: iF.changedAt
								};
								if (iF.revision) oF.revision = iF.revision;
								if (iF.changedBy) oF.changedBy = iF.changedBy;
//								if( iF.createdAt ) oF.createdAt = iF.createdAt;
//								if( iF.createdBy ) oF.createdBy = iF.createdBy;
								if (iF.blob) oF.blob = iF.blob;
								if (iF.dataURL) oF.dataURL = iF.dataURL;
								resolve(oF);
							}
							else {
								// Transform to an image:
								// Remember to also replace any referencing links in property values!
								switch (iF.type) {
									case 'application/bpmn+xml':
										// Read and render BPMN as SVG:
										Lib.blob2text(iF, (txt: string) => {
											bpmn2svg(txt).then(
												(result) => {
													let nFileName = iF.title.fileName() + '.svg';
													resolve({
														//	blob: new Blob([result.svg], { type: "image/svg+xml; charset=utf-8" }),
														blob: new Blob([result.svg], { type: "image/svg+xml" }),
														id: 'F-' + simpleHash(nFileName),
														title: nFileName,
														type: 'image/svg+xml',
														changedAt: iF.changedAt
													} as IFileWithContent )
												},
												reject
											)
										});
										break;
									default:
										reject({status:999,statusText:"Cannot transform file '"+iF.title+"' of type '"+iF.type+"' to an image."})
								};
							};
						}
					);
				}
			}
		)
	}
}
