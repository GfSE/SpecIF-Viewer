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
	sbjClasses: string;
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
				this.sbjClasses = 'subjectTypes';
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
				this.sbjClasses = 'subjectClasses';
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
	// @ts-ignore - id is set in toInt()
	id: SpecifId;
	// @ts-ignore - $schema is set in toInt()
	$schema: string;
	title?: SpecifMultiLanguageText;
	description?: SpecifMultiLanguageText;
	language?: string;
	generator?: string;
	generatorVersion?: string;
	rights?: SpecifRights;
	createdAt?: SpecifDateTime;
	createdBy?: SpecifCreatedBy;

	dataTypes: SpecifDataType[] = [];
	propertyClasses: SpecifPropertyClass[] = [];
	resourceClasses: SpecifResourceClass[] = [];
	statementClasses: SpecifStatementClass[] = [];
	files: IFileWithContent[] = [];
	resources: SpecifResource[] = [];   		// list of resources as referenced by the hierarchies
	statements: SpecifStatement[] = [];
	hierarchies: SpecifNode[] = [];    	// listed specifications (aka hierarchies, outlines) of the project.

	constructor() {
	}
	isValid(spD?: any): boolean {
		if (!spD) spD = this;
		return typeof (spD.id) == 'string' && spD.id.length > 0;
	}
	set(spD: any, opts?: any): Promise<CSpecIF> {
		return new Promise(
			(resolve, reject) => {
				if (opts && opts.noCheck) {
					this.toInt(spD);
					resolve(this)
				}
				else {
					// check *after* transformation:
					this.toInt(spD);
					this.check(this, opts)
					.then(
						() => { resolve(this) },
						reject
					)
				};
				/*	this.check(spD,opts)
					.then(
						(nD) => { this.toInt(nD); resolve(this) },
						reject
					) */
			}
		);
	} 
	get(opts?: any): Promise<SpecIF> {
		/*	// Add a resource as hierarchyRoot, if needed.
			// It is assumed,
			// - that in general SpecIF data do not have a hierarchy root with meta-data.
			// - that ReqIF specifications (=hierarchyRoots) are transformed to regular resources on input.

				function aHierarchyHasNoRoot(dta: SpecIF): boolean {
					for (var i = dta.hierarchies.length - 1; i > -1; i--) {
						let r = LIB.itemByKey(dta.resources, dta.hierarchies[i].resource);
						if (!r) {
							throw Error("Hierarchy '"+dta.hierarchies[i].id+"' is corrupt");
						};
						let prpV = LIB.valuesByTitle(r, CONFIG.propClassType, dta),
							rC = LIB.itemByKey(dta.resourceClasses, r['class']);
						// The type of the hierarchy root can be specified by a property titled CONFIG.propClassType
						// or by the title of the resourceClass:
						if ((!prpV || CONFIG.hierarchyRoots.indexOf(prpV) < 0)
							&& (!rC || CONFIG.hierarchyRoots.indexOf(rC.title) < 0))
							return true;
					};
					return false;
				} 
			let spD = this;
			if (opts && opts.createHierarchyRootIfMissing && aHierarchyHasNoRoot(spD)) {

				console.info("Added a hierarchyRoot");
				standardTypes.addTo("resourceClass", { id: "RC-Folder" }, spD);

				// ToDo: Let the program derive the referenced class ids from the above
				standardTypes.addTo("propertyClass", { id: "PC-Type" }, spD);
				standardTypes.addTo("propertyClass", { id: "PC-Description" }, spD);
				standardTypes.addTo("propertyClass", { id: "PC-Name" }, spD);
				standardTypes.addTo("dataType", { id: "DT-ShortString" }, spD);
				standardTypes.addTo("dataType", { id: "DT-Text" }, spD);

				var res: SpecifResource = {
					id: 'R-' + simpleHash(spD.id),
					class: LIB.makeKey("RC-Folder"),
					properties: [{
						class: { id: "PC-Name" },
						values: [LIB.makeMultiLanguageText(spD.title)]
					}, {
						class: { id: "PC-Type"},
						values: [LIB.makeMultiLanguageText(CONFIG.resClassOutline)]
					}],
					changedAt: spD.createdAt || new Date().toISOString()
				};
				// Add a description property only if it has a value:
				if (spD.description)
					LIB.addProp(res, {
						class: { id: "PC-Description"},
						values: [spD.description]
					});
				spD.resources.push(r2ext(res));
				// create a new root instance:
				spD.hierarchies = [{
					id: "H-" + res.id,
					resource: LIB.keyOf(res),
					// .. and add the previous hierarchies as children:
					nodes: spD.hierarchies,
					changedAt: res.changedAt
				}];
			};  */

		if (opts && opts.v10)
			return this.toExt_v10(opts);
		return this.toExt(opts);
	}
	private check(spD?: SpecIF, opts?: any): Promise<SpecIF> {
		// Check the SpecIF data for schema compliance and consistency;
		if (!spD) spD = this;
		return new Promise(
			(resolve, reject) => {

				let checker: any;

				if (this.isValid(spD)) {
					// 1. Get the "official" routine for checking schema and constraints
					//    - where already loaded checking routines are replaced by the newly loaded ones
					//    - use $.ajax() with options since it is more flexible than $.getScript
					//    - the first (relative) URL is for debugging within a local clone of Github
					//    - both of the other (absolute) URLs are for a production environment
					if (spD['$schema'] && !spD['$schema'].includes('v1.0')) {
						// for data sets according to schema v1.1 and later;
						// get the constraint checker locally, if started locally in the debug phase:
						import(window.location.href.startsWith('file:/') ? '../../SpecIF/schema-and-checker/check/CCheck.mjs'
								: 'https://specif.de/v' + /\/(?:v|specif-)([0-9]+\.[0-9]+)\//.exec(spD['$schema'])[1] + '/CCheck.mjs')
						.then(modChk => {
							// 2. Get the specified schema file:
							getSchema();
							// 3. Instantiate checker:
							checker = new modChk.CCheck();
						})
						.catch(handleError);
					}
					else {
						throw Error("Inexpected check of SpecIF data set < v1.1");
				/*		// for data sets up until schema v1.0;
						// not any more needed, because the import data is checked *after* transformation to v1.1:
						$.ajax({
							dataType: "script",
							cache: true,
							url: 'https://specif.de/v1.0/CCheck.min.js' // older versions are covered by v1.0/check.js
						})
						.done(() => {
							// 2. Get the specified schema file:
							getSchema();
							// 3. Instantiate checker:
							// @ts-ignore - 'CCheck' has just been loaded dynamically:
							checker = new CCheck();
						})
						.fail(handleError); */
					} 
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
						let sma = JSON.parse(LIB.ab2str(xhr.response));
						// Override meta-schema until we get to work "https://json-schema.org/draft/2019-09/schema#";
						// the schema check itself does not need the features of the newer one,
						// but a future check of values xs:duration in the constraint-check does:
						sma['$schema'] = "http://json-schema.org/draft-04/schema#";

						// @ts-ignore - checkSchema() is defined in check.js loaded at runtime
						let rc: xhrMessage = checker.checkSchema(spD, { schema: sma });
						if (rc.status == 0) {
							// 2. Check further constraints:
							// @ts-ignore - checkConstraints() is defined in check.js loaded at runtime
							rc = checker.checkConstraints(spD, opts);
							if (rc.status == 0) {
								resolve(spD);
								return;
							}
						};
					/*	// older versions of the checking routine don't set the responseType:
						if (typeof (rc.responseText) == 'string' && rc.responseText.length > 0)
							rc.responseType = 'text';  */
						reject(rc);
					}
					else
						throw Error( 'Standard routines checkSchema and/or checkConstraints are not available.' );
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
				function getSchema() {
					LIB.httpGet({
						// @ts-ignore - 'specifVersion' is defined for versions <1.0
						url: (spD['$schema'] || 'https://specif.de/v' + spD.specifVersion + '/schema'),
						responseType: 'arraybuffer',
						withCredentials: false,
						done: handleResult,
						fail: handleError
					});
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

		console.info("References are imported *without* revision to ascertain that updates of the referenced element do not break the link."
					+" (References without revision always relate to the latest revision of the referenced element.)");

		// Differences when using forAll() instead of [..].map():
		// - tolerates missing input list (not all are mandatory for SpecIF)
		// - suppresses undefined list items in the result, so in effect forAll() is a combination of .map() and .filter().
		try {
			this.dataTypes = LIB.forAll( spD.dataTypes, dT2int );
			this.propertyClasses = LIB.forAll( spD.propertyClasses, pC2int );
			this.resourceClasses = LIB.forAll( spD[names.rClasses], rC2int );
			this.statementClasses = LIB.forAll(spD[names.sClasses], sC2int);
			// for data-sets <v0.10.8
		//	if (names.hClasses && Array.isArray(spD[names.hClasses]))
			if (names.hClasses)
				this.resourceClasses = this.resourceClasses.concat( LIB.forAll( spD[names.hClasses], hC2int ));
			this.files = LIB.forAll(spD.files, f2int);
			this.resources = LIB.forAll( spD.resources, r2int );
			this.statements = LIB.forAll( spD.statements, s2int );
			this.hierarchies = LIB.forAll( spD.hierarchies, h2int );

			// Transform data with schema <v1.1.
			// dataType.type: 'xs:enumeration' and 'xhtml' --> 'xs:string';
			// do it here at the end so that the original type is available for the whole transformation:
			this.dataTypes = LIB.forAll( this.dataTypes,
				(dT:SpecifDataType) => {
					switch( dT.type ) {
						// @ts-ignore - can appear in SpecIF <v1.1:
						case 'xs:enumeration':
						// @ts-ignore - can appear in SpecIF <v1.1:
						case "xhtml":
							dT.type = SpecifDataTypeEnum.String;
						// If this has become now a redundant dataType, 
						// it will be removed later through 'deduplicate()'.
					};
					return dT;
                }
			);
		}
		catch (e) {
			let txt = "Error when importing the project '" + spD.title + "'";
			console.log(txt);
			message.show({ status: 999, statusText: txt }, { severity: 'danger' });
			return; // undefined 
		};

		// header information provided only in case of project creation, but not in case of project update:
		if (spD.rights) this.rights = { title: spD.rights.title, url: spD.rights.url };
		if (spD.generator) this.generator = spD.generator;
		if (spD.generatorVersion) this.generatorVersion = spD.generatorVersion;
		if (spD.createdBy) {
			this.createdBy = spD.createdBy;
			if (spD.createdBy.email && spD.createdBy.email.value)
				this.createdBy.email = spD.createdBy.email.value;
		};
		if (spD.createdAt) this.createdAt = spD.createdAt;
		if (spD.description) this.description = makeMultiLanguageText(spD.description);
		if (spD.title) this.title = makeMultiLanguageText(spD.title);
		this.id = spD.id;
		this.$schema = 'https://specif.de/v' + CONFIG.specifVersion + '/schema.json';
		return;

//		console.debug('specif.toInt',simpleClone(this));

		// common for all items:
		function i2int(iE:any) {
			var oE: any = {
				id: iE.id,
				changedAt: LIB.addTimezoneIfMissing(iE.changedAt)
			};
			if (iE.description) oE.description = makeMultiLanguageText(iE.description);
			// revision is a number up until v0.10.6 and a string thereafter:
			if (iE.revision) oE.revision = typeof (iE.revision) == 'number' ? iE.revision.toString() : iE.revision;
			if (iE.replaces) oE.replaces = iE.replaces;
			if (iE.changedBy) oE.changedBy = iE.changedBy;
	//		console.debug('item 2int',iE,oE);
			return oE
		}
		// a data type:
		function dT2int(iE:any): SpecifDataType {
			var oE: any = i2int(iE);
			oE.title = makeTitle(iE.title);

			// up until v1.0, there was a special dataType 'xs:enumeration' just for strings,
			// starting v1.1 every dataType except 'xs:boolean' can have enumerated values
			oE.type = iE.type == "xs:enumeration" ? SpecifDataTypeEnum.String : iE.type;

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
					// oE.type "xhtml" will be replaced later on to "xs:string".
					// If this becomes a redundant dataType,
					// it will be removed later through 'deduplicate()'.
					// no break
				case "xs:string":
					if (typeof (iE.maxLength) == 'number')
						oE.maxLength = iE.maxLength;
			};
			// Look for enumerated values;
			// starting with v1.1 every dataType except xs:boolean may have enumerated values:
			if (iE.enumeration)
				oE.enumeration = iE.enumeration;
			// up until v1.0 there is a dedicated dataType "xs:enumeration":
			if (iE.values)
				oE.enumeration = LIB.forAll(iE.values, (v: any): SpecifEnumeratedValue => {
					// 'v.title' until v0.10.6, 'v.value' thereafter;
					// 'v.value' can be a string or a multilanguage text.
					return {
						id: v.id,
					//	value: typeof (v.value) == 'string' || typeof (v.value) == 'object' ? v.value : v.title  // works also for v.value==''
					//	value: typeof (v.value) == 'object' ? v.value
					//		: (typeof (v.value) == 'string' ? { text: v.value } : { text: v.title }) // works also for v.value==''
						value: Array.isArray(v.value) ? v.value
							: [{ text: v.value || v.title || '' }] // v.value or v.title is a string; works also for v.value==''
					}
				});
			if (iE.multiple) oE.multiple = true;

//			console.debug('dataType 2int',iE);
			return oE
		}
		// a property class:
		function pC2int(iE: any): SpecifPropertyClass {
			var oE: any = i2int(iE);
			oE.title = makeTitle(iE.title);  // an input file may have titles which are not from the SpecIF vocabulary.

			// For the time being, suppress any revision to make sure that a dataType update doesn't destroy the reference.
			// ToDo: Reconsider once we have a backend with multiple revisions ...
		//	oE.dataType = LIB.makeKey(iE.dataType);
			oE.dataType = LIB.makeKey(iE.dataType.id || iE.dataType);
			let dT: SpecifDataType = LIB.itemByKey(self.dataTypes, oE.dataType);
//			console.debug('pC2int',iE,dT);

			// The default values:
			if (iE.value || iE.values)
				oE.values = makeValues(iE, dT);
		/*	// SpecIF <v1.1:
			if (iE.value)
				switch (dT.type) {
					// @ts-ignore - can appear in SpecIF <v1.1 and will be replaced at the end of transformation:
					case "xhtml":
					case SpecifDataTypeEnum.String:
						oE.values = [makeMultiLanguageText(iE.value,dT.type)];
						break;
					default:
						oE.values = [LIB.cleanValue(iE.value)];
				};
			// SpecIF >v1.0:
			if (iE.values) oE.values = iE.values;  */

			// include the property only, if it is different from the dataType's:
			if (iE.multiple && !dT.multiple) oE.multiple = true;

//			console.debug('propClass 2int',iE,oE);
			return oE;
		}
		// common for all instance classes:
		function aC2int(iE:any) {
			var oE: any = i2int(iE);
			oE.title = makeTitle(iE.title);

			if (iE['extends']) oE['extends'] = LIB.makeKey(iE['extends'].id || iE['extends']);	// 'extends' is a reserved word starting with ES5
			if (iE.icon) oE.icon = iE.icon;
			if (iE.creation) oE.instantiation = iE.creation;	// deprecated, for compatibility
			if (iE.instantiation) oE.instantiation = iE.instantiation;
			if (oE.instantiation) {
				let idx = oE.instantiation.indexOf('manual');	// deprecated
				if (idx > -1) oE.instantiation.splice(idx, 1, 'user')
			};
			// Up until v0.10.5, the pClasses themselves are listed, starting v0.10.6 references are listed:
			if (Array.isArray(iE[names.pClasses]) && iE[names.pClasses].length > 0) {
				if (typeof (iE[names.pClasses][0]) == 'object' && iE[names.pClasses][0].dataType == undefined) {
					// It is a propertyClass reference according to v1.1:
					// For the time being, suppress any revision to make sure that a class update doesn't destroy the reference.
					// ToDo: Reconsider once we have a backend with multiple revisions ...
					oE.propertyClasses = iE.propertyClasses.map((pC: SpecifKey) => { return LIB.makeKey(pC.id) });
				}
				else if (typeof (iE[names.pClasses][0]) == 'string') {
					// it is a propertyClass reference according to v1.0 (and some versions before that);
					// make a list of pClasses according to v1.1:
					// For the time being, suppress any revision to make sure that a class update doesn't destroy the reference.
					// ToDo: Reconsider once we have a backend with multiple revisions ...
					oE.propertyClasses = iE[names.pClasses].map((el: any): SpecifKey => { return LIB.makeKey(el.id || el) });
				//	oE.propertyClasses = LIB.makeKeyL(iE[names.pClasses]);
				}
				else {
					// it is a full-fledged propertyClass in one of the oldest SpecIF versions:
					oE.propertyClasses = [];
					iE[names.pClasses].forEach((e: any): void => {
						// Store the pClasses at the top level;
						// redundant pClasses will be deduplicated, later:
						let pC = pC2int(e);
						self.propertyClasses.push(pC);
						// Add to a list with pClass references, here:
						// For the time being, suppress any revision to make sure that a class update doesn't destroy the reference.
						// ToDo: Reconsider once we have a backend with multiple revisions ...
						oE.propertyClasses.push(LIB.makeKey(pC.id));
					})
				};
			}
			else
				oE.propertyClasses = [];
//			console.debug('anyClass 2int',iE,oE);
			return oE
		}
		// a resource class:
		function rC2int(iE: SpecifResourceClass): SpecifResourceClass|undefined {
			var oE: any = aC2int(iE);

			// If "iE.isHeading" is defined, use it:
			if (typeof (iE.isHeading) == 'boolean') {
				oE.isHeading = iE.isHeading;
			}
			else if (iE.title == 'SpecIF:Heading') {
				// take care of older data without "isHeading":
				oE.isHeading = true;
			}
			else {
				// look for a property class being configured in CONFIG.headingProperties:
				let pC;
				for (var a = oE.propertyClasses.length - 1; a > -1; a--) {
					pC = LIB.itemByKey(self.propertyClasses, oE.propertyClasses[a]);
					if (CONFIG.headingProperties.includes(pC.title)) {
						oE.isHeading = true;
						break;
					};
				};
			};
//			console.debug('resourceClass 2int',iE,oE);
			if (oE.propertyClasses.length >0 )
				return oE;
			console.warn('Skipping the resourceClass with id="' + iE.id + '" on import, because it does not specify any propertyClasses.');
		// return undefined ... and the element will not be listed in the list of resourceClasses
		}
		// a statementClass:
		function sC2int(iE:any): SpecifStatementClass {
			var oE: SpecifStatementClass = aC2int(iE);
			if (iE.isUndirected) oE.isUndirected = iE.isUndirected;
			// For the time being, suppress any revision to make sure that a class update doesn't destroy the reference.
			// ToDo: Reconsider once we have a backend with multiple revisions ...
			if (iE[names.sbjClasses])
				oE.subjectClasses = iE[names.sbjClasses].map( (el: any): SpecifKey => { return LIB.makeKey(el.id || el) });
			//	oE.subjectClasses = LIB.makeKeyL(iE[names.sbjClasses]);
			if (iE[names.objClasses])
				oE.objectClasses = iE[names.objClasses].map( (el: any): SpecifKey => { return LIB.makeKey(el.id || el) });
			//	oE.objectClasses = LIB.makeKeyL(iE[names.objClasses]);
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
		function p2int(iE: any): SpecifProperty {
			// @ts-ignore - 'values'will be added later:
			var oE: SpecifProperty = {
					// no id
					// For the time being, suppress any revision to make sure that a class update doesn't destroy the reference.
					// ToDo: Reconsider once we have a backend with multiple revisions ...
					class: LIB.makeKey(iE[names.pClass].id || iE[names.pClass])
				//	class: LIB.makeKey(iE[names.pClass])
				},
				dT = LIB.dataTypeOf(oE["class"], self);
//			console.debug('p2int', iE, dT);

			oE.values = makeValues(iE, dT);

			// properties do not have their own revision and change info
//			console.debug('propValue 2int',iE,pT,oE);
			return oE
		}
		// common for all resources or statements:
		function a2int(iE:any): SpecifInstance {
			// For the time being, suppress any revision to make sure that a class update doesn't destroy the reference.
			// ToDo: Reconsider once we have a backend with multiple revisions ...
			let eCkey = iE.subject ? LIB.makeKey(iE[names.sClass].id || iE[names.sClass])
									: LIB.makeKey(iE[names.rClass].id || iE[names.rClass]);

			var	oE: any = {
					id: iE.id,
					class: eCkey,
					changedAt: LIB.addTimezoneIfMissing(iE.changedAt)
				};
			if (iE.alternativeIds) oE.alternativeIds = iE.alternativeIds;
			if (iE.changedBy) oE.changedBy = iE.changedBy;

			// revision is a number up until v0.10.6 and a string thereafter:
			if (iE.revision) oE.revision = typeof (iE.revision) == 'number' ? iE.revision.toString() : iE.revision;
			if (iE.replaces) oE.replaces = iE.replaces;

			// resources must have a title, but statements may come without:
			if (iE.properties && iE.properties.length > 0)
				oE.properties = LIB.forAll(iE.properties, (e: any): SpecifProperty => { return p2int(e) });

	 		// Are there resources with description, but without description property?
			// See tutorial 2 "Related Terms": https://github.com/GfSE/SpecIF/blob/master/tutorials/v1.0/02_Related-Terms.md
			// In this case, add a title and description property each as required by SpecIF v1.1 (no more native title and description):
			[
				{ name: 'description', nativePrp: iE.description, tiL: CONFIG.descProperties, dTid: "DT-Text", pCid: "PC-Description" },
				{ name: 'title', nativePrp: iE.title, tiL: CONFIG.titleProperties, dTid: "DT-ShortString", pCid: "PC-Name"}
			].forEach(
				(pD) => {
					if (pD.nativePrp && propertyMissing(pD.tiL, oE)) {
						// Add title resp. description property to element:
						LIB.addProp(oE, {
							class: { id: getPropertyClassId(pD, eCkey) },
							values: [makeMultiLanguageText(pD.nativePrp) ]
						});
						console.info("Added a "+pD.name+" property to element with id '" + oE.id + "'");
					};
                }
			);

//			console.debug('a2int',iE,simpleClone(oE));
			return oE

			function propertyMissing(L:string[],el: any): boolean {
				if (Array.isArray(el.properties))
					for (var p of el.properties) {
						if (L.includes(LIB.propTitleOf(p['class'], self.propertyClasses)))
							// SpecIF assumes that any title/description property *replaces* the resource's native property.
							// There is no consideration of the content.
							// It is expected that title/descriptions with multiple languages have been reduced, before.
							return false; // title resp. description property is available
					};
				return true; // no array or no title/description property
			}
			function getPropertyClassId(pDef:any, iCk: any): string {
				// Return the id of a suitable propertyClass - if there is none, create it:
				// - pDef.tiL is a list of suitable propertyClass titles
				// - eCk is the key of an resource resp statement class
				// --> to decide whether the class has a propertyClass with a title listed in pDef.tiL.

				let iC = LIB.itemByKey((iE.subject ? self.statementClasses : self.resourceClasses), iCk);

				// First check whether there is a suitable propertyClass:
				for (var pCk of iC.propertyClasses) {
					let pC = LIB.itemByKey(self.propertyClasses, pCk);
					if (pC && pDef.tiL.includes(pC.title))
						return pC.id
				};
				// No suitable propertyClass is listed in iC.propertyClasses, so create what's needed:

				// a. add dataType, if not yet defined:
				standardTypes.addTo("dataType", { id: pDef.dTid }, self);
				// b. add property class, if not yet defined:
				standardTypes.addTo("propertyClass", { id: pDef.pCid }, self);
				// c. Add propertyClass to element class:
				LIB.addPCReference(iC, { id: pDef.pCid });
				return pDef.pCid
			}
		}
		// a resource:
		function r2int(iE: any): SpecifResource {
			var oE: SpecifResource = a2int(iE) as SpecifResource;
//			console.debug('resource 2int',iE,simpleClone(oE));
			return oE
		}
		// a statement:
		function s2int(iE:any): SpecifStatement {
			var oE: SpecifStatement = a2int(iE) as SpecifStatement;
			// SpecIF allows subjects and objects with id alone or with  a key (id+revision):
			// keep original and normalize to id+revision for display:
			oE.subject = LIB.makeKey(iE.subject.id || iE.subject );
			oE.object = LIB.makeKey(iE.object.id || iE.object );

			// special feature to import statements to complete,
			// used for example by the XLS import:
		/*	// @ts-ignore - subjectToLink is implementation-specific for a-posteriori completion of statements
			if (iE.subjectToLink) oE.subjectToLink = iE.subjectToLink;  */
			// @ts-ignore - objectToLink is implementation-specific for a-posteriori completion of statements
			if (iE.objectToLink) oE.objectToLink = iE.objectToLink;
//			console.debug('statement 2int',iE,oE);
			return oE
		}
		// a hierarchy:
		function h2int(iE: any): SpecifNode {
			// the properties are stored with a resource, while the hierarchy is stored as a node with reference to that resource:
			var oE: SpecifNode;
			if (names.hClasses) {
				// up until v0.10.6, transform hierarchy root to a regular resource:
				var iR = a2int(iE) as SpecifResource;
				// For the time being, suppress any revision to make sure that a class update doesn't destroy the reference.
				// ToDo: Reconsider once we have a backend with multiple revisions ...
				// @ts-ignore - if execution gets here, 'names.hClass' is defined:
				iR['class'] = LIB.makeKey(iE[names.hClass].id || iE[names.hClass]);
			//	iR['class'] = LIB.makeKey(iE[names.hClass]);
				self.resources.push(iR);

				// ... and add a link to the hierarchy:
				oE = {
					id: 'N-' + iR.id,
					resource: LIB.keyOf( iR ),
					changedAt: LIB.addTimezoneIfMissing(iE.changedAt || spD.changedAt) || new Date().toISOString()
				};
				if (iE.revision) oE.revision = typeof (iE.revision) == 'number' ? iE.revision.toString() : iE.revision;
				if (iE.changedBy) oE.changedBy = iE.changedBy;
			}
			else {
				// starting v0.10.8:
				oE = i2int(iE);
				oE.resource = LIB.makeKey(iE.resource.id || iE.resource);
				// only for internal use - not needed for external imports:
				if (iE.predecessor)
					oE.predecessor = LIB.makeKey(iE.predecessor.id || iE.predecessor);
			};

			// SpecIF allows resource references with id alone or with a key (id+revision):
			oE.nodes = LIB.forAll(iE.nodes, n2int);
//			console.debug('hierarchy 2int',iE,oE);
			return oE;

			// a hierarchy node:
			function n2int(iE:any): SpecifNode {
				var oE: SpecifNode = {
						id: iE.id,
						// For the time being, suppress any revision to make sure that a resource update doesn't destroy the reference.
						// ToDo: Reconsider once we have a backend with multiple revisions ...
						resource: LIB.makeKey(iE.resource.id || iE.resource),
						changedAt: LIB.addTimezoneIfMissing(iE.changedAt || spD.changedAt) || new Date().toISOString()
					};
				if (iE.revision) oE.revision = typeof (iE.revision) == 'number' ? iE.revision.toString() : iE.revision;
				if (iE.changedBy) oE.changedBy = iE.changedBy;
				if (iE.nodes) oE.nodes = LIB.forAll(iE.nodes, n2int);
				return oE;
			}
		}
		// a file:
		function f2int(iE:any): SpecifFile {
			var oE = i2int(iE);
			// The title is usually 'path/filename.ext';
			// but sometimes a Windows path is given ('\') -> transform it to web-style ('/'):
			oE.title = iE.title ? makeTitle(iE.title).replace(/\\/g, '/') : iE.id;
			if (iE.revision) oE.revision = typeof (iE.revision) == 'number' ? iE.revision.toString() : iE.revision;
			// store the blob and it's type:
			if (iE.blob) {
				oE.type = iE.blob.type || iE.type || LIB.attachment2mediaType(oE.title);
				oE.blob = iE.blob;
			}
			else if (iE.dataURL) {
				oE.type = iE.type || LIB.attachment2mediaType(oE.title);
				oE.dataURL = iE.dataURL;
			}
			else
				oE.type = iE.type;
			return oE
		}
		// utilities:
		function makeTitle(ti: any): string {
			// In <v1.1, titles can be simple strings or multi-language text objects;
			// in >v1.0, native titles can only be stings (in fact SpecifText).
			// So, in case of multi-language text, choose the default language:
			return LIB.cleanValue( typeof(ti)=='string'? ti : ti[0].text );
		}
		function makeValues(iE: any, dT: SpecifDataType): SpecifValues {
			if (Array.isArray(iE.values)) {
				// it is SpecIF > v1.0:
				return iE.values.map(
					(val) => {
						if (dT.enumeration) {
							return val;
						};
						switch (dT.type) {
							// we are using the transformed dataTypes, but the base dataTypes are still original;
							case SpecifDataTypeEnum.String:
								// To make the import more robust, string values are transformed to a multiLanguageText:
								if (typeof (val) == 'string')
									return LIB.makeMultiLanguageText(LIB.uriBack2slash(LIB.cleanValue(val)));

								// For SpecIF >v1.0, it is always a multilanguageText according to the constraints:
								return LIB.forAll(val,
									(singleLang: any) => {
										// sometimes a Windows path is given ('\') -> transform it to web-style ('/'):
										singleLang.text = LIB.uriBack2slash(LIB.cleanValue(singleLang.text));
										return singleLang;
									});
							case SpecifDataTypeEnum.DateTime:
								return LIB.addTimezoneIfMissing(LIB.cleanValue(val));
							default:
								// According to the schema, all property values are represented by a string
								// and internally they are stored as string as well to avoid inaccuracies
								// by multiple transformations:
								return LIB.cleanValue(val);
						};
					}
				);
			};
			if (LIB.isString(iE.value) || LIB.isMultiLanguageText(iE.value)) {
				// it is SpecIF < v1.1:
				switch (dT.type) {
					// we are using the transformed dataTypes, but the base dataTypes are still original;
					case SpecifDataTypeEnum.String:
					// @ts-ignore - "xhtml" can appear in SpecIF <v1.1 and will be replaced at the end of transformation:
					case "xhtml":
				/*	// @ts-ignore - "xs:enumeration" can appear in SpecIF <v1.1 and will be replaced at the end of transformation:
					case "xs:enumeration":  has already been replaced by "xs:string", in fact */
						// in SpecIF <v1.1 enumerations are implictly of base-type xs:string:
						if (dT.enumeration) {
							// in SpecIF <1.1 multiple enumeration ids were in a comma-separated list;
							// starting v1.1 they are separate list items:
							let vL: string[] = LIB.cleanValue(iE.value).split(',');
							return LIB.forAll(vL, (v: string) => { return v.trim() });
						}
						else {
							let vL = Array.isArray(iE.value) ?
								// multiple languages:
								LIB.forAll(iE.value,
									(val: any) => {
										// sometimes a Windows path is given ('\') -> transform it to web-style ('/'):
										val.text = LIB.uriBack2slash(LIB.cleanValue(val.text));
										return val;
									})
								// single language:
								// sometimes a Windows path is given ('\') -> transform it to web-style ('/'):
								: LIB.uriBack2slash(LIB.cleanValue(iE.value));
							// @ts-ignore - dT is in fact a string:
							return [makeMultiLanguageText(vL, dT.type)];
						};
					// break - all branches end with return;
					case SpecifDataTypeEnum.DateTime:
						return [LIB.addTimezoneIfMissing(LIB.cleanValue(iE.value))];
					default:
						// According to the schema, all property values are represented by a string
						// and internally they are stored as string as well to avoid inaccuracies
						// by multiple transformations:
						return [LIB.cleanValue(iE.value)];
				};
			}
			else
				throw Error("Invalid property with class " + iE[names.pClass] + ".");
		}
		function makeMultiLanguageText(iE: any, baseType?:string): SpecifMultiLanguageText {
			return (typeof (iE) == 'string' ?
				( baseType == "xhtml" ?
					[{ text: LIB.cleanValue(iE), format: "xhtml" }]
					: [{ text: LIB.cleanValue(iE) }]
				)
				: LIB.cleanValue(iE) );
        }
	}
	private toExt(opts?: any): Promise<SpecIF> {
		// transform self.data to SpecIF following defined options;
		// a clone is delivered.
		// if opts.targetLanguage has no value, all available languages are kept.

//		console.debug('toExt', this, opts );
		// transform internal data to SpecIF:
		return new Promise(
			(resolve, reject) => {
				var pend = 0,
					// @ts-ignore - the missing attributes will come below:
					spD: SpecIF = {
						id: this.id,
						title: LIB.languageValueOf(this.title, opts),
						$schema: 'https://specif.de/v' + CONFIG.specifVersion + '/schema.json',
						generator: app.title,
						generatorVersion: CONFIG.appVersion,
						createdAt: new Date().toISOString()
					};

				// if opts.targetLanguage is defined, create a multilanguageText with the selected language, only:
				if (LIB.multiLanguageTextHasContent(this.description)) spD.description = LIB.makeMultiLanguageText(LIB.languageValueOf(this.description, opts));
				if (this.language) spD.language = this.language;

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
						email: app.me.email
					};
					if (app.me.organization)
						spD.createdBy.org = { organizationName: app.me.organization };
				}
				else {
					if (this.createdBy && this.createdBy.email ) {
						spD.createdBy = {
							familyName: this.createdBy.familyName,
							givenName: this.createdBy.givenName,
							email: this.createdBy.email
						};
						if (this.createdBy.org && this.createdBy.org.organizationName)
							spD.createdBy.org = this.createdBy.org;
					};
					// else: don't add createdBy without data
				};

				// Now start to assemble the SpecIF output:
				spD.dataTypes = LIB.forAll(this.dataTypes, dT2ext);
				spD.propertyClasses = LIB.forAll(this.propertyClasses, pC2ext);
				spD.resourceClasses = LIB.forAll(this.resourceClasses, rC2ext);
				spD.statementClasses = LIB.forAll(this.statementClasses, sC2ext);
				spD.files = [];
				for( var f of this.files ) {
					pend++;
					f2ext(f)
					.then(
						(oF: IFileWithContent) =>{
							spD.files.push(oF);
							if (--pend < 1) finalize();
						},
						reject
					);
				};
				spD.resources = LIB.forAll((this.resources), r2ext);
				spD.statements = LIB.forAll(this.statements, s2ext);
				spD.hierarchies = LIB.forAll(this.hierarchies, n2ext); 

				if (pend < 1) finalize();  // no files, so finalize right away
				return;

				function finalize() {
					// ToDo: schema and consistency check (if we want to detect any programming errors)
//					console.debug('specif.toExt exit',spD);
					resolve(spD);
				}

				// common for all items:
				function i2ext(iE:any) {
					var oE:any = {
						id: iE.id,
						changedAt: iE.changedAt
					};
					// most items must have a title, but resources and statements come without:
					if (iE.title) oE.title = LIB.titleOf(iE, opts);
					// if opts.targetLanguage is defined, create a multilanguageText with the selected language, only:
					if (LIB.multiLanguageTextHasContent(iE.description)) oE.description = LIB.makeMultiLanguageText(LIB.languageValueOf(iE.description, opts));
					if (iE.revision) oE.revision = iE.revision;
					if (iE.replaces) oE.replaces = iE.replaces;
					if (iE.changedBy) oE.changedBy = iE.changedBy;
					if (iE.createdAt) oE.createdAt = iE.createdAt;
					if (iE.createdBy) oE.createdBy = iE.createdBy;
					return oE;
				}
				// a data type:
				function dT2ext(iE: SpecifDataType) {
					var oE: SpecifDataType = i2ext(iE);
					oE.type = iE.type;
					switch (iE.type) {
						case SpecifDataTypeEnum.Double:
							if (iE.fractionDigits) oE.fractionDigits = iE.fractionDigits;
						case SpecifDataTypeEnum.Integer:
							if (typeof (iE.minInclusive) == 'number') oE.minInclusive = iE.minInclusive;
							if (typeof (iE.maxInclusive) == 'number') oE.maxInclusive = iE.maxInclusive;
							break;
						case SpecifDataTypeEnum.String:
							if (iE.maxLength) oE.maxLength = iE.maxLength;
					};
					// Look for enumerated values;
					// every dataType except xs:boolean may have enumerated values:
					if (iE.enumeration) {
						if (opts.targetLanguage)
							// reduce to the language specified:
							oE.enumeration = iE.enumeration.map( (v: any) => { return { id: v.id, value: LIB.makeMultiLanguageText(LIB.languageValueOf(v.value, opts)) } })
						else
							oE.enumeration = iE.enumeration;
					};
					if (iE.multiple) oE.multiple = true;

					return oE
				}
				// a property class:
				function pC2ext(iE: SpecifPropertyClass) {
					var oE: SpecifPropertyClass = i2ext(iE);
					if (iE.values) oE.values = iE.values;  // default values
					oE.dataType = iE.dataType;

					let dT = LIB.itemByKey(spD.dataTypes, iE.dataType);

					/* With SpecIF, he 'multiple' property should be defined at dataType level
					*  and can be overridden at propertyType level.
					*  	dT.multiple 	pT.multiple 	pT.multiple		effect
					*  ---------------------------------------------------------
					*	undefined		undefined 		undefined		false
					* 	false			undefined		undefined		false
					* 	true			undefined		undefined		true
					* 	undefined		false			undefined		false
					* 	false			false			undefined		false
					* 	true 			false			false			false
					* 	undefined		true 			true			true
					* 	false			true 			true			true
					* 	true 			true 			undefined		true
					*  Include the property only, if is different from the dataType's: */
					if (iE.multiple && !dT.multiple) oE.multiple = true;
						//	else if (iE.multiple == false && dT.multiple) oE.multiple = false
					return oE
				}
				// common for all instance classes:
				function aC2ext(iE:any) {
					var oE = i2ext(iE);
					if (iE.icon) oE.icon = iE.icon;
					if (iE.instantiation) oE.instantiation = iE.instantiation;
					// @ts-ignore - index is ok:
					if (iE['extends']) oE['extends'] = iE['extends'];
					if (iE.propertyClasses && iE.propertyClasses.length > 0) oE.propertyClasses = iE.propertyClasses;
					return oE
				}
				// a resource class:
				function rC2ext(iE: SpecifResourceClass) {
					var oE: SpecifResourceClass = aC2ext(iE) as SpecifResourceClass;
					// Include "isHeading" in SpecIF only if true:
					if (iE.isHeading) oE.isHeading = true;
					// resourceClasses must have a list of propertyClasses with at least one element:
					if (Array.isArray(oE.propertyClasses) && oE.propertyClasses.length > 0)
						return oE;
					// else (shouldn't arrive here, at all):
					console.error('Skipping resourceClass with id="'+iE.id+'" on export, because it does not specify any propertyClasses.');
					// return undefined ... and the element will not be listed in the list of resourceClasses
				}
				// a statement class:
				function sC2ext(iE: SpecifStatementClass) {
					var oE: SpecifStatementClass = aC2ext(iE) as SpecifStatementClass;
					if (iE.isUndirected) oE.isUndirected = iE.isUndirected;
					if (iE.subjectClasses && iE.subjectClasses.length > 0) oE.subjectClasses = iE.subjectClasses;
					if (iE.objectClasses && iE.objectClasses.length > 0) oE.objectClasses = iE.objectClasses;
					return oE
				}
				// a property:
				function p2ext(iE: SpecifProperty) {
					// skip empty properties:
					if (!iE.values || iE.values.length<1) return;

					// Skip certain properties;
					// - if a hidden property is defined with value, it is suppressed only if it has this value
					// - if the value is undefined, the property is suppressed in all cases
					let pC: SpecifPropertyClass = LIB.itemByKey(spD.propertyClasses, iE['class']);
					if (Array.isArray(opts.skipProperties)) {
						for (var sP of opts.skipProperties) {
							if (sP.title == pC.title && (sP.value == undefined || sP.value == LIB.displayValueOf(iE.values[0], opts))) return;
						};
					};

					var oE: SpecifProperty = {
						class: iE['class'],
						values: []
					};

					// According to the schema, all property values are represented by a string
					// and we want to store them as string to avoid inaccuracies by multiple transformations.
					let dT: SpecifDataType = LIB.itemByKey(spD.dataTypes, pC.dataType);
					if (dT.type == SpecifDataTypeEnum.String && !dT.enumeration) {
						// Special treatment of string values:
						if (opts.targetLanguage) {
							// Reduce all values to the selected language; is used for
							// - generation of human readable documents
							// - formats not supporting multiple languages:
							let txt;
							// Cycle through all values:
							for (var v of iE.values) {
								if (RE.vocabularyTerm.test(txt)) {
									txt = LIB.languageValueOf(v, opts);
									if( opts.lookupValues ) txt = i18n.lookup(txt);
								}
								else {
									if (CONFIG.excludedFromFormatting.includes(pC.title)) {
										// if it is e.g. a title, remove all formatting:
										txt = LIB.languageValueOf(v, opts)
											.replace(/^\s+/, "")   // remove any leading whiteSpace
											.stripHTML();
									}
									else {
										// Transform to HTML, if possible;
										// especially for publication, for example using WORD format:
										txt = LIB.languageValueOf(v, opts)
											.replace(/^\s+/, "")  // remove any leading whiteSpace
											.makeHTML(opts)
											.replace(/<br ?\/>\n/g, "<br/>");
										// replace filetypes of linked images:
										if (opts.allDiagramsAsImage)
											txt = refDiagramsAsImg(txt);
									};
								};
								oE.values.push(LIB.makeMultiLanguageText(txt));
							};
							return oE;
						};
						// else, keep all languages and replace filetypes of linked images;
						// this is the case when creating specif.html, where opts.allDiagramsAsImage without opts.targetLanguage is set:
						if (opts.allDiagramsAsImage) {
							let lL;
							// Cycle through all values:
							for (var v of iE.values) {
								lL = [];
								// Cycle through all languages of a value v:
								for (var l of v as SpecifMultiLanguageText)
									lL.push(l.language ? { text: refDiagramsAsImg(l.text), language: l.language } : { text: refDiagramsAsImg(l.text) });
								oE.values.push(lL);
							};
							return oE;
						};
					};
					// else, keep the complete data structure:
					oE.values = iE.values;
//					console.debug('p2ext',iE,LIB.languageValueOf( iE.value, opts ),oE.value);
					return oE;

					function refDiagramsAsImg(val: string): string {
						// Replace all links to application files like BPMN by links to SVG images:
						let replaced = false;
						// @ts-ignore - $0 is never read, but must be specified anyways
						val = val.replace(RE.tagObject, ($0: string, $1: string, $2: string) => {
//								console.debug('#a', $0, $1, $2);
							if ($1) $1 = $1.replace(RE.attrType, ($4:string, $5:string) => {
//								console.debug('#b', $4, $5);
								// ToDo: Further application file formats ... once in use.
								// Use CONFIG.applTypes ... once appropriate.
								if (["application/bpmn+xml"].includes($5)) {
									replaced = true;
									return 'type="image/svg+xml"'
								}
								else
									return $4;
							});
							// @ts-ignore - $6 is never read, but must be specified anyways
							if (replaced) $1 = $1.replace(RE.attrData, ($6: string, $7: string) => {
//								console.debug('#c', $6, $7);
								return 'data="' + $7.fileName() + '.svg"'
							});
							return '<object ' + $1 + $2;
						});
						return val;
                    }
				}
				// common for all instances:
				function a2ext(iE:any) {
					var oE = i2ext(iE);
//					console.debug('a2ext',iE,opts);
					// resources and hierarchies usually have individual titles, and so we will not lookup:
					// @ts-ignore - index is ok:
					oE['class'] = iE['class'];
					if (iE.alternativeIds) oE.alternativeIds = iE.alternativeIds;

				//	let pL = opts.showEmptyProperties ? normalizeProperties(iE, spD) : iE.properties;
					let pL = iE.properties;
					if (pL && pL.length > 0) oE.properties = LIB.forAll(pL, p2ext);
					return oE;
				}
				// a resource:
				function r2ext(iE: SpecifResource) {
					var oE: SpecifResource = a2ext(iE);
					// a resource title shall never be looked up (translated);
					// for example in case of the vocabulary the terms would disappear:

//					console.debug('resource2ext',iE,oE);
					return oE;
				}
				// a statement:
				function s2ext(iE: SpecifStatement) {
				/*	// Skip statements with an open end;
					// At the end it will be checked, wether all referenced resources resp. statements are listed:
					if (!iE.subject || iE.subject.id == CONFIG.placeholder
						|| !iE.object || iE.object.id == CONFIG.placeholder
					) return;  */

					// The statements usually do use a vocabulary item (and not have an individual title),
					// so we lookup, if so desired, e.g. when exporting to ePub:
					var oE: SpecifStatement = a2ext(iE);

					oE.subject = iE.subject;
					oE.object = iE.object;

					return oE;
				}
				// a hierarchy node:
				function n2ext(iN: SpecifNode) {
//					console.debug( 'n2ext', iN );
					// just take the non-redundant properties (omit 'title', for example):
					let oN: SpecifNode = {
						id: iN.id,
						resource: iN.resource,
						changedAt: iN.changedAt
					};
					
					if (iN.nodes && iN.nodes.length > 0)
						oN.nodes = LIB.forAll(iN.nodes, n2ext);
					if (iN.revision)
						oN.revision = iN.revision;
					return oN
				}
				// a file:
				function f2ext(iE: IFileWithContent): Promise<IFileWithContent> {
					return new Promise(
						(resolve, reject) => {
//							console.debug('f2ext',iE,opts)

							if (!opts || !opts.allDiagramsAsImage || CONFIG.imgTypes.includes(iE.type) ) {
							/*	var oE: IFileWithContent = {
									id: iE.id,
									title: iE.title,
									type: iE.type,
									changedAt: iE.changedAt
								};
								if (iE.revision) oE.revision = iE.revision;
								if (iE.changedBy) oE.changedBy = iE.changedBy;
								if (iE.blob) oE.blob = iE.blob;
								if (iE.dataURL) oE.dataURL = iE.dataURL;
								resolve(oE); */
								resolve(iE);
							}
							else {
								// Transform to an image:
								// Remember to also replace any referencing links in property values!
								switch (iE.type) {
									case 'application/bpmn+xml':
										// Read and render BPMN as SVG:
										LIB.blob2text(iE, (txt: string) => {
											bpmn2svg(txt).then(
												(result) => {
													let nFileName = iE.title.fileName() + '.svg';
													resolve({
														//	blob: new Blob([result.svg], { type: "image/svg+xml; charset=utf-8" }),
														blob: new Blob([result.svg], { type: "image/svg+xml" }),
														id: 'F-' + simpleHash(nFileName),
														title: nFileName,
														type: 'image/svg+xml',
														changedAt: iE.changedAt
													} as IFileWithContent )
												},
												reject
											)
										});
										break;
									default:
										console.warn("Cannot transform file '" + iE.title + "' of type '" + iE.type + "' to an image.");
										resolve({
											id: 'F-' + simpleHash(iE.title),
											title: iE.title,
											changedAt: iE.changedAt
										} as IFileWithContent)
								};
							};
						}
					);
				}
			}
		)
	}
	private toExt_v10(opts?: any): Promise<SpecIF> {
		// transform self.data to SpecIF v1.0 following defined options;
		// a clone is delivered.
		// if opts.targetLanguage has no value, all available languages are kept.

//		console.debug('toExt_v10', this, opts );
		// v1.0 uses less multilanguageText, so v1.1+ multilanguageText must be reduced in many places:
		const myLang = { targetLanguage: opts.targetLanguage || this.language || 'en' };
		// transform internal data to SpecIF:
		return new Promise(
			(resolve, reject) => {
				var pend = 0,
					// @ts-ignore - the missing attributes will come below:
					spD: SpecIF = {
						id: this.id,
						title: LIB.languageValueOf(this.title, myLang),
						$schema: 'https://specif.de/v1.0/schema.json',
						generator: app.title,
						generatorVersion: CONFIG.appVersion,
						createdAt: new Date().toISOString()
					};

				if (LIB.multiLanguageTextHasContent(this.description)) spD.description = LIB.languageValueOf(this.description, myLang);
				if (this.language) spD.language = this.language;

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
						// @ts-ignore - correct with v1.0
						email: { value: app.me.email, type: "text/html" }
					};
					if (app.me.organization)
						spD.createdBy.org = { organizationName: app.me.organization };
				}
				else {
					if (this.createdBy && this.createdBy.email) {
						spD.createdBy = {
							familyName: this.createdBy.familyName,
							givenName: this.createdBy.givenName,
							// @ts-ignore - correct with v1.0
							email: { value: this.createdBy.email, type: "text/html" }
						};
						if (this.createdBy.org && this.createdBy.org.organizationName)
							spD.createdBy.org = this.createdBy.org;
					};
					// else: don't add createdBy without data
				};

				// Now start to assemble the SpecIF output:
				spD.dataTypes = LIB.forAll(this.dataTypes, dT2ext);
				spD.propertyClasses = LIB.forAll(this.propertyClasses, pC2ext);
				spD.resourceClasses = LIB.forAll(this.resourceClasses, rC2ext);
				spD.statementClasses = LIB.forAll(this.statementClasses, sC2ext);
				spD.files = [];
				for (var f of this.files) {
					pend++;
					f2ext(f)
						.then(
							(oF: IFileWithContent) => {
								spD.files.push(oF);
								if (--pend < 1) finalize();
							},
							reject
						);
				};
				spD.resources = LIB.forAll((this.resources), r2ext);
				spD.statements = LIB.forAll(this.statements, s2ext);
				spD.hierarchies = LIB.forAll(this.hierarchies, n2ext);

				if (pend < 1) finalize();  // no files, so finalize right away
				return;

				function finalize() {
					// ToDo: schema and consistency check (if we want to detect any programming errors)
					console.debug('specif.toExt_v10 exit', spD);
					resolve(spD);
				}

				// common for all items:
				function i2ext(iE: any) {
					var oE: any = {
						id: iE.id,
						changedAt: iE.changedAt
					};
					// most items must have a title, but resources and statements come without:
					if (iE.title) oE.title = LIB.titleOf(iE, opts);
					if (LIB.multiLanguageTextHasContent(iE.description)) oE.description = LIB.languageValueOf(iE.description, myLang);
					if (iE.revision) oE.revision = iE.revision;
					if (iE.replaces) oE.replaces = iE.replaces;
					if (iE.changedBy) oE.changedBy = iE.changedBy;
					if (iE.createdAt) oE.createdAt = iE.createdAt;
					if (iE.createdBy) oE.createdBy = iE.createdBy;
					return oE;
				}
				// a data type:
				function dT2ext(iE: SpecifDataType) {
					var oE: SpecifDataType = i2ext(iE);
					switch (iE.type) {
						case SpecifDataTypeEnum.Double:
							if (iE.fractionDigits) oE.fractionDigits = iE.fractionDigits;
						case SpecifDataTypeEnum.Integer:
							if (typeof (iE.minInclusive) == 'number') oE.minInclusive = iE.minInclusive;
							if (typeof (iE.maxInclusive) == 'number') oE.maxInclusive = iE.maxInclusive;
							break;
						case SpecifDataTypeEnum.String:
							if (iE.maxLength) oE.maxLength = iE.maxLength;
					};
					// Look for enumerated values:
					// - every dataType except xs:boolean may have enumerated values
					// - in v1.0 there are only enumerated values of type xs:string, so any other type is lost
					if (iE.enumeration) {
						// reduce to the language specified:
						// @ts-ignore - values does exist with v1.0
						oE.values = LIB.forAll(
							iE.enumeration,
							(v: any) => {
								return { id: v.id, value: (opts.lookupValues ? i18n.lookup(LIB.languageValueOf(v.value, myLang)): LIB.languageValueOf(v.value, myLang)) }
							}
						);
						// @ts-ignore - OK with v1.0
						oE.type = 'xs:enumeration';
					}
					else
						oE.type = iE.type;
					if (iE.multiple) oE.multiple = true;

					return oE
				}
				// a property class:
				function pC2ext(iE: SpecifPropertyClass) {
					var oE: SpecifPropertyClass = i2ext(iE);
					if (iE.values) oE.values = iE.values;  // default values
					oE.dataType = iE.dataType;

					let dT = LIB.itemByKey(spD.dataTypes, iE.dataType);

					/* With SpecIF, he 'multiple' property should be defined at dataType level
					*  and can be overridden at propertyType level.
					*  	dT.multiple 	pT.multiple 	pT.multiple		effect
					*  ---------------------------------------------------------
					*	undefined		undefined 		undefined		false
					* 	false			undefined		undefined		false
					* 	true			undefined		undefined		true
					* 	undefined		false			undefined		false
					* 	false			false			undefined		false
					* 	true 			false			false			false
					* 	undefined		true 			true			true
					* 	false			true 			true			true
					* 	true 			true 			undefined		true
					*  Include the property only, if is different from the dataType's: */
					if (iE.multiple && !dT.multiple) oE.multiple = true;
					//	else if (iE.multiple == false && dT.multiple) oE.multiple = false
					return oE
				}
				// common for all instance classes:
				function aC2ext(iE: any) {
					var oE = i2ext(iE);
					if (iE.icon) oE.icon = iE.icon;
					if (iE.instantiation) oE.instantiation = iE.instantiation;
					// @ts-ignore - index is ok:
					if (iE['extends']) oE['extends'] = iE['extends'];
					if (iE.propertyClasses && iE.propertyClasses.length > 0) oE.propertyClasses = iE.propertyClasses;
					return oE
				}
				// a resource class:
				function rC2ext(iE: SpecifResourceClass) {
					var oE: SpecifResourceClass = aC2ext(iE) as SpecifResourceClass;
					// Include "isHeading" in SpecIF only if true:
					if (iE.isHeading) oE.isHeading = true;
					return oE
				}
				// a statement class:
				function sC2ext(iE: SpecifStatementClass) {
					var oE: SpecifStatementClass = aC2ext(iE) as SpecifStatementClass;
					if (iE.isUndirected) oE.isUndirected = iE.isUndirected;
					if (iE.subjectClasses && iE.subjectClasses.length > 0) oE.subjectClasses = iE.subjectClasses;
					if (iE.objectClasses && iE.objectClasses.length > 0) oE.objectClasses = iE.objectClasses;
					return oE
				}
				// a property:
				function p2ext(iE: SpecifProperty) {
					// skip empty properties:
					if (!iE.values || iE.values.length < 1) return;

					// Skip certain properties;
					// - if a hidden property is defined with value, it is suppressed only if it has this value
					// - if the value is undefined, the property is suppressed in all cases
					let pC: SpecifPropertyClass = LIB.itemByKey(spD.propertyClasses, iE['class']);
					if (Array.isArray(opts.skipProperties)) {
						for (var sP of opts.skipProperties) {
							if (sP.title == pC.title && (sP.value == undefined || sP.value == LIB.displayValueOf(iE.values[0], opts))) return;
						};
					};

					if (iE.values.length > 1)
						console.warn('When transforming to SpecIF v1.0, only the first value of a property of class ' + iE['class'] + ' has been taken.');

					// @ts-ignore - no 'values' in case of v1.0
					var oE: SpecifProperty = {
						class: iE['class']
					};

					// According to the schema, all property values are represented by a string
					// and we want to store them as string to avoid inaccuracies by multiple transformations.
					let dT: SpecifDataType = LIB.itemByKey(spD.dataTypes, pC.dataType);
				//	if ([SpecifDataTypeEnum.String,'xhtml'].includes(dT.type)) {
					if (dT.type == SpecifDataTypeEnum.String && !dT.enumeration) {
						// Special treatment of string values:
						let v = iE.values[0] as SpecifMultiLanguageText;
						if (opts.targetLanguage) {
							// Reduce all values to the selected language; is used for
							// - generation of human readable documents
							// - formats not supporting multiple languages:

							// Take the first value, as v1.0 supports only one value:
							let txt = LIB.languageValueOf(v, opts)
								.replace(/^\s+/, "");   // remove any leading whiteSpace

							if (!RE.vocabularyTerm.test(txt)) {
								if (CONFIG.excludedFromFormatting.includes(pC.title)) {
									// if it is e.g. a title, remove all formatting:
									txt = txt
										.stripHTML();
								}
								else {
									// Transform to HTML, if possible;
									// especially for publication, for example using WORD format:
									txt = txt
										.makeHTML(opts)
										.replace(/<br ?\/>\n/g, "<br/>");
									// replace filetypes of linked images:
									if (opts.allDiagramsAsImage)
										txt = refDiagramsAsImg(txt);
								};
							};
							// @ts-ignore - OK for v1.0
							oE.value = opts.lookupValues? i18n.lookup(txt) : txt;

						/*	if (LIB.isHTML(txt))
								// @ts-ignore - OK for v1.0
								dT.type = 'xhtml'
							else
								// Cycle through all languageValues and check for format attribute:
								for (var l of v) {
									// @ts-ignore - OK for v1.0
									if (l.format == 'xhtml') dT.type = 'xhtml';
									break;
								}; */
						}
						else {
							// Keep all languages and possibly replace filetypes of linked images:
							// @ts-ignore - OK for v1.0
							oE.value = [];
							// Cycle through all languages of a value v:
							// - Keep text and language
							// - Ignore format, as it is not acceptable for v1.0 here 
							// - the language attribute is required in v1.0, whereas in v1.1 only if multiple languages are present
							for (var l of v)
								// @ts-ignore - OK for v1.0
								oE.value.push({ text: refDiagramsAsImg(l.text), language: l.language || '?'});
							//	oE.value.push(l.language ? { text: refDiagramsAsImg(l.text), language: l.language || '?' } : { text: refDiagramsAsImg(l.text) });
						};
						return oE;
					};
					// else, take the first value, as v1.0 supports only one value:
					// @ts-ignore - OK for v1.0
					oE.value = iE.values[0];
//					console.debug('p2ext',iE,LIB.languageValueOf( iE.value, opts ),oE.value);
					return oE;

					function refDiagramsAsImg(val: string): string {
						if (!opts || !opts.allDiagramsAsImage) return val;

						// Replace all links to application files like BPMN by links to SVG images:
						let replaced = false;
						// @ts-ignore - $0 is never read, but must be specified anyways
						val = val.replace(RE.tagObject, ($0: string, $1: string, $2: string) => {
//							console.debug('#a', $0, $1, $2);
							if ($1) $1 = $1.replace(RE.attrType, ($4: string, $5: string) => {
//								console.debug('#b', $4, $5);
								// ToDo: Further application file formats ... once in use.
								// ToDo: Use CONFIG.applTypes ... if appropriate.
								if (["application/bpmn+xml"].includes($5)) {
									replaced = true;
									return 'type="image/svg+xml"'
								}
								else
									return $4;
							});
							// @ts-ignore - $6 is never read, but must be specified anyways
							if (replaced) $1 = $1.replace(RE.attrData, ($6: string, $7: string) => {
//								console.debug('#c', $6, $7);
								return 'data="' + $7.fileName() + '.svg"'
							});
							return '<object ' + $1 + $2;
						});
						return val;
					}
				}
				// common for all instances:
				function a2ext(iE: any) {
					var oE = i2ext(iE);
//					console.debug('a2ext',iE,opts);
					// resources and hierarchies usually have individual titles, and so we will not lookup:
					// @ts-ignore - index is ok:
					oE['class'] = iE['class'];
					if (iE.alternativeIds) oE.alternativeIds = iE.alternativeIds;

					//	let pL = opts.showEmptyProperties ? normalizeProperties(iE, spD) : iE.properties;
					let pL = iE.properties;
					if (pL && pL.length > 0) oE.properties = LIB.forAll(pL, p2ext);
					return oE;
				}
				// a resource:
				function r2ext(iE: SpecifResource) {
					var oE: SpecifResource = a2ext(iE);
					// a resource title shall never be looked up (translated);
					// for example in case of the vocabulary the terms would disappear:

					// @ts-ignore - 'title' is required in case of v1.0
					oE.title = '';
//					console.debug('resource2ext',iE,oE);
					return oE;
				}
				// a statement:
				function s2ext(iE: SpecifStatement) {
					/*	// Skip statements with an open end;
						// At the end it will be checked, wether all referenced resources resp. statements are listed:
						if (!iE.subject || iE.subject.id == CONFIG.placeholder
							|| !iE.object || iE.object.id == CONFIG.placeholder
						) return;  */

					// The statements usually do use a vocabulary item (and not have an individual title),
					// so we lookup, if so desired, e.g. when exporting to ePub:
					var oE: SpecifStatement = a2ext(iE);

					oE.subject = iE.subject;
					oE.object = iE.object;

					return oE;
				}
				// a hierarchy node:
				function n2ext(iN: SpecifNode) {
					//					console.debug( 'n2ext', iN );
					// just take the non-redundant properties (omit 'title', for example):
					let oN: SpecifNode = {
						id: iN.id,
						resource: iN.resource,
						changedAt: iN.changedAt
					};

					if (iN.nodes && iN.nodes.length > 0)
						oN.nodes = LIB.forAll(iN.nodes, n2ext);
					if (iN.revision)
						oN.revision = iN.revision;
					return oN
				}
				// a file:
				function f2ext(iE: IFileWithContent): Promise<IFileWithContent> {
					return new Promise(
						(resolve, reject) => {
							//							console.debug('f2ext',iE,opts)

							if (!opts || !opts.allDiagramsAsImage || CONFIG.imgTypes.includes(iE.type)) {
								/*	var oE: IFileWithContent = {
										id: iE.id,
										title: iE.title,
										type: iE.type,
										changedAt: iE.changedAt
									};
									if (iE.revision) oE.revision = iE.revision;
									if (iE.changedBy) oE.changedBy = iE.changedBy;
									if (iE.blob) oE.blob = iE.blob;
									if (iE.dataURL) oE.dataURL = iE.dataURL;
									resolve(oE); */
								resolve(iE);
							}
							else {
								// Transform to an image:
								// Remember to also replace any referencing links in property values!
								switch (iE.type) {
									case 'application/bpmn+xml':
										// Read and render BPMN as SVG:
										LIB.blob2text(iE, (txt: string) => {
											bpmn2svg(txt).then(
												(result) => {
													let nFileName = iE.title.fileName() + '.svg';
													resolve({
														//	blob: new Blob([result.svg], { type: "image/svg+xml; charset=utf-8" }),
														blob: new Blob([result.svg], { type: "image/svg+xml" }),
														id: 'F-' + simpleHash(nFileName),
														title: nFileName,
														type: 'image/svg+xml',
														changedAt: iE.changedAt
													} as IFileWithContent)
												},
												reject
											)
										});
										break;
									default:
										/*	console.warn("Cannot transform file '" + iE.title + "' of type '" + iE.type + "' to an image.");
											resolve(); */
										reject({ status: 999, statusText: "Cannot transform file '" + iE.title + "' of type '" + iE.type + "' to an image." })
								};
							};
						}
					);
				}
			}
		)
	}
}
