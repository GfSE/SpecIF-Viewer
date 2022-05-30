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
	id:SpecifId = '';
	$schema = '';
	title?: SpecifMultiLanguageText = [{ text: '' }];
	description?: SpecifMultiLanguageText = [{ text: '' }];
	generator? = '';
	generatorVersion? = '';
	rights?: any = {};
	// @ts-ignore - will be set by 'toInt()', if available in the input data:
	createdAt?: SpecifDateTime;
	// @ts-ignore - will be set by 'toInt()', if available in the input data:
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
		// 'this' isn't modified, so it shall be invoked before 'toInt' is called:
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
							(window.location.href.startsWith('file:/') ? '../../SpecIF-Schema/check/CCheck.js'  // take it locally ..
								// or load it from the homepage, otherwise:
								: 'https://specif.de/v' + /\/(?:v|specif-)([0-9]+\.[0-9]+)\//.exec(spD['$schema'])[1] + '/CCheck.min.js')
							: 'https://specif.de/v1.0/CCheck.min.js') // older versions are covered by v1.0/check.js
					})
					.done(() => {
						// 2. Get the specified schema file:
						LIB.httpGet({
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
						throw Error( 'Standard routines checkSchema and checkConstraints are not available.' );
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
		if (spD.createdBy) this.createdBy = spD.createdBy;
		if (spD.createdAt) this.createdAt = spD.createdAt;
		if (spD.description) this.description = makeMultiLanguageText(spD.description);
		if (spD.title) this.title = makeMultiLanguageText(spD.title);
		this.id = spD.id;

//		console.debug('specif.toInt',simpleClone(this));

		// common for all items:
		function i2int(iE:any) {
			var oE: any = {
				id: iE.id,
				changedAt: iE.changedAt
			};
			if (iE.description) oE.description = makeMultiLanguageText(iE.description);
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
	//		console.debug('item 2int',iE,oE);
			return oE
		}
		// a data type:
		function dT2int(iE:any): SpecifDataType {
			var oE: any = i2int(iE);
			oE.title = makeTitle(iE.title);

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
					// oE.type will be replaced later on to "xs:string".
					// If this becomes a redundant dataType,
					// it will be removed later through 'deduplicate()'.
					// no break
				case "xs:string":
					if (typeof (iE.maxLength) == 'number')
						oE.maxLength = iE.maxLength;
			};
			// Look for enumerated values;
			// up until v1.0 there is a dedicated dataType "xs:enumeration" and
			// starting with v1.1 every dataType except xs:boolean may have enumerated values:
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

//			console.debug('dataType 2int',iE);
			return oE
		}
		// a property class:
		function pC2int(iE: any): SpecifPropertyClass {
			var oE: any = i2int(iE);
			oE.title = makeTitle(iE.title);  // an input file may have titles which are not from the SpecIF vocabulary.

			oE.dataType = LIB.makeKey(iE.dataType);
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
			if (iE.multiple && !dT.multiple) oE.multiple = true
			else if (iE.multiple == false && dT.multiple) oE.multiple = false;

//			console.debug('propClass 2int',iE,oE);
			return oE;
		}
		// common for all instance classes:
		function aC2int(iE:any) {
			var oE: any = i2int(iE);
			oE.title = makeTitle(iE.title);

			if (iE['extends']) oE._extends = iE['extends'];	// 'extends' is a reserved word starting with ES5
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
					// it is a propertyClass reference according to v1.1:
					oE.propertyClasses = iE.propertyClasses;
				}
				else if (typeof (iE[names.pClasses][0]) == 'string') {
					// it is a propertyClass reference according to v1.0 (and some versions before that);
					// make a list of pClasses according to v1.1:
					oE.propertyClasses = LIB.makeKeyL(iE[names.pClasses]);
				}
				else {
					// it is a full-fledged propertyClass in one of the oldest SpecIF versions:
					oE.propertyClasses = [];
					iE[names.pClasses].forEach((e: any): void => {
						// Store the pClasses at the top level;
						// redundant pClasses will be deduplicated, later:
						self.propertyClasses.push(pC2int(e));
						// Add to a list with pClass references, here:
						oE.propertyClasses.push(LIB.keyOf(e));
					})
				};
			}
			else
				oE.propertyClasses = [];
//			console.debug('anyClass 2int',iE,oE);
			return oE
		}
		// a resource class:
		function rC2int(iE: SpecifResourceClass): SpecifResourceClass {
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
				pC = LIB.itemByKey(self.propertyClasses, oE.propertyClasses[a]);
				if (CONFIG.headingProperties.indexOf(pC.title) > -1) {
					oE.isHeading = true;
					break;
				};
			};
//			console.debug('resourceClass 2int',iE,oE);
			return oE
		}
		// a statementClass:
		function sC2int(iE:any): SpecifStatementClass {
			var oE: SpecifStatementClass = aC2int(iE);
			if (iE.isUndirected) oE.isUndirected = iE.isUndirected;
			if (iE[names.sbjClasses])
				oE.subjectClasses = LIB.makeKeyL(iE[names.sbjClasses]);
			if (iE[names.objClasses])
				oE.objectClasses = LIB.makeKeyL(iE[names.objClasses]);
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
					class: LIB.makeKey(iE[names.pClass])
				},
				dT: SpecifDataType = LIB.dataTypeOf(oE["class"], self);
//			console.debug('p2int', iE, dT);

			oE.values = makeValues(iE, dT);

			// properties do not have their own revision and change info
//			console.debug('propValue 2int',iE,pT,oE);
			return oE
		}
		// common for all resources or statements:
		function a2int(iE:any): SpecifInstance {
		//	var oE = i2int(iE),
			var	oE: any = {
					id: iE.id,
			//		class: LIB.makeKey(iE.subject ? iE[names.sClass] : iE[names.rClass]),
					changedAt: iE.changedAt
				};
			//	eC = iE.subject ? LIB.itemByKey(self.statementClasses, oE["class"])
			//					: LIB.itemByKey(self.resourceClasses, oE["class"]);

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

			// resources must have a title, but statements may come without:
			if (iE.alternativeIds) oE.alternativeIds = iE.alternativeIds;
			if (iE.properties && iE.properties.length > 0)
				oE.properties = LIB.forAll(iE.properties, (e: any): SpecifProperty => { return p2int(e) });

	 		// Are there resources with description, but without description property?
			// See tutorial 2 "Related Terms": https://github.com/GfSE/SpecIF/blob/master/tutorials/v1.0/02_Related-Terms.md
			// In this case, add a description property to hold the description as required by SpecIF v1.1:
			if (iE.description && descPropertyMissing(oE)) {
				// There is an attempt to add the types in every loop ... which is hardly efficient.
				// However, that way they are only added, if needed.
				// a. add dataType, if not yet defined:
				standardTypes.addTo("dataType", { id: "DT-Text" }, self);
				// b. add property class, if not yet defined:
				standardTypes.addTo("propertyClass", { id: "PC-Description" }, self);
				// c. Add propertyClass to element class:
				addPCReference(eC(), { id: "PC-Description" });
				// d. Add description property to element;
				addP(oE, {
					class: { id: "PC-Description" },
					values: [ makeMultiLanguageText(iE.description) ]
				});
				console.info("Added a description property to element with id '" + oE.id + "'");
			};

			// Similarly, add a title property if missing:
			if (iE.title && titlePropertyMissing(oE)) {
				// There is an attempt to add the types in every loop ... which is hardly efficient.
				// However, that way they are only added, if needed.
				// a. add dataType, if not yet defined:
				standardTypes.addTo("dataType", { id: "DT-ShortString" }, self);
				// b. add property class, if not yet defined:
				standardTypes.addTo("propertyClass", { id: "PC-Name"}, self);
				// c. Add propertyClass to element class:
				addPCReference(eC(), { id: "PC-Name" });
				// d. Add title property to element;
				addP(oE, {
					class: { id:"PC-Name" },
					// no title is required in case of statements; it's class' title applies by default:
					values: [ makeMultiLanguageText(iE.title) ]
				});
				console.info("Added a title property to element with id '" + oE.id + "'");
			};

//			console.debug('a2int',iE,simpleClone(oE));
			return oE

			function eC(): SpecifResourceClass | SpecifStatementClass {
				return iE.subject ? LIB.itemByKey(self.statementClasses, LIB.makeKey(iE[names.sClass]))
								: LIB.itemByKey(self.resourceClasses, LIB.makeKey(iE[names.rClass]));
            }
			function titlePropertyMissing(el: any): boolean {
				if (Array.isArray(el.properties))
					for (var i = el.properties.length - 1; i > -1; i--) {
						let ti = LIB.propTitleOf(el.properties[i], self);
						if (CONFIG.titleProperties.indexOf(ti) > -1)
							// SpecIF assumes that any title property *replaces* the element's title,
							// so we just look for the case of *no* title property.
							// There is no consideration of the content.
							// It is expected that titles with multiple languages have been reduced, before.
							return false; // title property is available
					};
				return true;
			}
			function descPropertyMissing(el:any): boolean {
				if (Array.isArray(el.properties))
					for (var i = el.properties.length - 1; i > -1; i--) {
						if (CONFIG.descProperties.indexOf(LIB.propTitleOf(el.properties[i], self)) > -1)
							// SpecIF assumes that any description property *replaces* the resource's description,
							// so we just look for the case of a resource description and *no* description property.
							// There is no consideration of the content.
							// It is expected that descriptions with multiple languages have been reduced, before.
							return false; // description property is available
					};
				return true; // no array or no description property
			}
		}
		// a resource:
		function r2int(iE: any): SpecifResource {
			var oE: SpecifResource = a2int(iE) as SpecifResource;
			oE['class'] = LIB.makeKey(iE[names.rClass]);
//			console.debug('resource 2int',iE,simpleClone(oE));
			return oE
		}
		// a statement:
		function s2int(iE:any): SpecifStatement {
			var oE: SpecifStatement = a2int(iE) as SpecifStatement;
			oE['class'] = LIB.makeKey( iE[names.sClass] );
			// SpecIF allows subjects and objects with id alone or with  a key (id+revision):
			// keep original and normalize to id+revision for display:
			//	if( iE.isUndirected ) oE.isUndirected = iE.isUndirected;
			oE.subject = LIB.makeKey( iE.subject );
			oE.object = LIB.makeKey( iE.object );

			// special feature to import statements to complete,
			// used for example by the XLS or ReqIF import:
			// @ts-ignore - subjectToFind is implementation-specific for a-posteriori completion of statements
			if (iE.subjectToFind) oE.subjectToFind = LIB.makeKey(iE.subjectToFind);
			// @ts-ignore - objectToFind is implementation-specific for a-posteriori completion of statements
			if (iE.objectToFind) oE.objectToFind = LIB.makeKey(iE.objectToFind);
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
				// @ts-ignore - if execution gets here, 'names.hClass' is defined:
				iR['class'] = LIB.makeKey(iE[names.hClass]);
				self.resources.push(iR);

				// ... and add a link to the hierarchy:
				oE = {
					id: 'N-' + iR.id,
					resource: LIB.keyOf( iR ),
					changedAt: iE.changedAt
				};
				if (iE.revision) oE.revision = iE.revision.toString();
				if (iE.changedBy) oE.changedBy = iE.changedBy;
			}
			else {
				// starting v0.10.8:
				oE = i2int(iE);
				oE.resource = LIB.makeKey( iE.resource )
			};

			// SpecIF allows resource references with id alone or with a key (id+revision):
			oE.nodes = LIB.forAll(iE.nodes, n2int);
//			console.debug('hierarchy 2int',iE,oE);
			return oE;

			// a hierarchy node:
			function n2int(iE:any): SpecifNode {
				var oE: SpecifNode = {
						id: iE.id,
						resource: LIB.makeKey(iE.resource),
						changedAt: iE.changedAt
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
				return iE.values;
			}
			else if (LIB.isString(iE.value) || LIB.isMultiLanguageText(iE.value)) {
				// it is SpecIF < v1.1:
				switch (dT.type) {
					// we are using the transformed dataTypes, but the base dataTypes are still original;
					case SpecifDataTypeEnum.String:
					// @ts-ignore - "xhtml" can appear in SpecIF <v1.1 and will be replaced at the end of transformation:
					case "xhtml":
					// @ts-ignore - "xs:enumeration" can appear in SpecIF <v1.1 and will be replaced at the end of transformation:
					case "xs:enumeration":
						// in SpecIF <v1.1 there are only enumerations of base-type xs:string:
						if (dT.enumeration) {
							// in SpecIF <1.1 multiple enumeration ids were in a comma-separated list;
							// starting v1.1 they are separate list items:
							let vL: string[] = LIB.cleanValue(iE.value).split(',');
							return LIB.forAll(vL, (v: string) => { return v.trim() });
/*							let nL = LIB.forAll(vL, (v: string) => { return v.trim() })
							console.debug('makeValues',iE.value,nL);
							return nL; */
						}
						else {
							let vL = Array.isArray(iE.value) ?
								// multiple languages:
								LIB.forAll(iE.value,
									(val: any) => {
										// sometimes a Windows path is given ('\') -> transform it to web-style ('/'):
										val.text = LIB.uriBack2slash(val.text);
										return val;
									})
								// single language:
								// sometimes a Windows path is given ('\') -> transform it to web-style ('/'):
								: LIB.uriBack2slash(iE.value);
							// @ts-ignore - dT is in fact a string:
							return [makeMultiLanguageText(vL, dT.type)];
						};
					// break - all branches end with return;
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
	toExt(opts?: any): Promise<SpecIF> {
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

				if (this.description) spD.description = LIB.languageValueOf(this.description, opts);

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
				spD.resources = LIB.forAll((opts.allResources ? this.resources : collectResourcesByHierarchy(this)), r2ext);
				spD.statements = LIB.forAll(this.statements, s2ext);
				spD.hierarchies = LIB.forAll(this.hierarchies, n2ext);

				if (pend < 1) finalize();  // no files, so finalize right away
				return;

				function finalize() {
					// Check whether all statements reference resources or statements, which are listed.
					// As statements can be removed which may be referenced themselves,
					// the checking must be repeated until no statements are removed any more:
					let lenBefore: number;
					do {
						lenBefore = spD.statements.length;
						spD.statements = spD.statements.filter(
							(s) => {
								return (LIB.indexById(spD.resources, s.subject.id) > -1
									|| LIB.indexById(spD.statements, s.subject.id) > -1)
									&& (LIB.indexById(spD.resources, s.object.id) > -1
										|| LIB.indexById(spD.statements, s.object.id) > -1)
							}
						);
						console.info("Suppressed " + (lenBefore - spD.statements.length) + " statements, because subject or object are not listed.");
					}
					while (spD.statements.length < lenBefore);

					// Add a resource as hierarchyRoot, if needed.
					// It is assumed, 
					// - that in general SpecIF data do not have a hierarchy root with meta-data.
					// - that ReqIF specifications (=hierarchyRoots) are transformed to regular resources on input.
					if (opts.createHierarchyRootIfMissing && aHierarchyHasNoRoot(spD)) {

						console.info("Added a hierarchyRoot");
						standardTypes.addTo("resourceClass", { id: "RC-Folder" }, spD);

						// ToDo: Let the program derive the referenced class ids from the above
						standardTypes.addTo("propertyClass", { id: "PC-Type" }, spD);
						standardTypes.addTo("propertyClass", { id: "PC-Description" }, spD);
						standardTypes.addTo("propertyClass", { id: "PC-Name" }, spD);
						standardTypes.addTo("dataType", { id: "DT-ShortString" }, spD);
						standardTypes.addTo("dataType", { id: "DT-Text" }, spD);

						var res = {
							id: 'R-' + simpleHash(spD.id),
							title: spD.title,
							class: "RC-Folder",
							properties: [{
								class: { id: "PC-Name" },
								values: [spD.title]
							}, {
								class: { id: "PC-Type"},
								values: [CONFIG.resClassOutline]
							}],
							changedAt: spD.createdAt || new Date().toISOString()
						};
						// Add a description property only if it has a value:
						if (spD.description)
							addP(res, {
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
					};

					// ToDo: schema and consistency check (if we want to detect any programming errors)
//					console.debug('specif.toExt exit',spD);
					resolve(spD);
				}

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
			/*	function normalizeProperties(el: SpecifResource, dta:SpecIF): SpecifProperty[] {
					// el: original instance (resource or statement)
					// Create a list of properties in the sequence of propertyClasses of the respective class.
					// Use those provided by the instance's properties and fill in missing ones with default (no) values.
					// Property classes must be unique!

					// check uniqueness of property classes:
					if (el.properties) {
						let idL: string[] = [],
							pCid: string;
						el.properties.forEach((p: SpecifProperty) => {
							pCid = p['class'].id;
							if (idL.indexOf(pCid) < 0)
								idL.push(pCid);
							else
								console.warn('The property class ' + pCid + ' of element ' + el.id + ' is occurring more than once.');
						});
					};

					let p: SpecifProperty,
						pCs: SpecifKeys,
						nL: SpecifProperty[] = [],
						// iCs: instance class list (resourceClasses or statementClasses),
						// the existence of subject (or object) let's us recognize that it is a statement:
						// @ts-ignore - existance of subject is checked to find out whether it is a resource or statement
						iCs = el.subject ? dta.statementClasses : dta.resourceClasses,
						iC = LIB.itemByKey(iCs, el['class']);

					// build a list of propertyClass identifiers including the extended class':
					pCs = iC._extends ? LIB.itemByKey(iCs, iC._extends).propertyClasses : [];
					pCs = pCs.concat(iC.propertyClasses);

					// add the properties in sequence of the propertyClass identifiers:
					pCs.forEach((pC: SpecifKey): void => {
						// skip hidden properties:
						if (CONFIG.hiddenProperties.indexOf(pC.id) > -1) return;
						// assuming that the property classes are unique:
						p = LIB.itemBy(el.properties, 'class', pC);
						nL.push(p || { class: pC, values: [] })
					});
//					console.debug('normalizeProps result',simpleClone(nL));
					return nL; // normalized property list
				} */
				// common for all items:
				function i2ext(iE:any) {
					var oE:any = {
						id: iE.id,
						changedAt: iE.changedAt
					};
					// most items must have a title, but statements may come without:
					if (iE.title) oE.title = LIB.titleOf(iE, opts);
					if (iE.description) oE.description = LIB.languageValueOf(iE.description, opts);
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
					//	case "xhtml":
						case SpecifDataTypeEnum.String:
							if (iE.maxLength) oE.maxLength = iE.maxLength;
					};
					// Look for enumerated values;
					// up until v1.0 there is a dedicated dataType "xs:enumeration" and
					// starting with v1.1 every dataType except xs:boolean may have enumerated values:
					if (iE.values) {
						if (opts.targetLanguage)
							// reduce to the language specified:
							oE.values = LIB.forAll(iE.values, (val:any) => { return { id: val.id, value: LIB.languageValueOf(val.value, opts) } })
						else
							oE.values = iE.values;
					};

					return oE
				}
				// a property class:
				function pC2ext(iE: SpecifPropertyClass) {
					var oE: SpecifPropertyClass = i2ext(iE);
					if (iE.value) oE.value = iE.value;  // a default value
					oE.dataType = iE.dataType;
					let dT = LIB.itemByKey(spD.dataTypes, iE.dataType);
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
					// @ts-ignore - index is ok:
					if (iE._extends) oE['extends'] = iE._extends;
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
					if (!iE.values || iE.values.length<1) return;

					// skip hidden properties:
					let pC: SpecifPropertyClass = LIB.itemByKey(spD.propertyClasses, iE['class']);
					if (Array.isArray(opts.hiddenProperties)) {
						opts.hiddenProperties.forEach((hP) => {
							if (hP.title == (iE.title || pC.title) && (hP.value == undefined || hP.value == iE.value)) return;
						});
					};

					var oE: SpecifProperty = {
						// no id
						class: iE['class']
					};
					if (iE.title) {
						// skip the property title, if it is equal to the propertyClass' title:
						let ti = LIB.titleOf(iE, opts);
						if (ti != pC.title) oE.title = ti;
					};
					if (iE.description) oE.description = LIB.languageValueOf(iE.description, opts);

					// According to the schema, all property values are represented by a string
					// and we want to store them as string to avoid inaccuracies by multiple transformations:
					if (opts.targetLanguage ) {
						// reduce to the selected language; is used for generation of human readable documents
						// or for formats not supporting multiple languages:
						let dT: SpecifDataType = LIB.dataTypeOf(iE['class'], spD);
						if ([SpecifDataTypeEnum.String].indexOf(dT.type) > -1) {
							if (CONFIG.excludedFromFormatting.indexOf(iE.title || pC.title) <0) {
								// Transform to HTML, if possible;
								// especially for publication, for example using WORD format:
								oE.value = LIB.languageValueOf(iE.value, opts)
									.replace(/^\s+/, "")  // remove any leading whiteSpace
									.makeHTML(opts)
									.replace(/<br ?\/>\n/g, "<br/>");

								oE.value = refDiagramsAsImg(oE.value);
							}
							else {
								// if it is e.g. a title, remove all formatting:
								oE.value = LIB.languageValueOf(iE.value, opts)
									.replace(/^\s+/, "")   // remove any leading whiteSpace
									.stripHTML();
							};
							// return 'published' data structure (single language, ...):
//							console.debug('p2ext',iE,LIB.languageValueOf( iE.value, opts ),oE.value);
							return oE;
						};
					};
					// else, the keep full data structure:
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
							val = val.replace(RE.tagObject, ($0: string, $1: string, $2: string) => {
//								console.debug('#a', $0, $1, $2);
								if ($1) $1 = $1.replace(RE.attrType, ($4:string, $5:string) => {
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
								if (replaced) $1 = $1.replace(RE.attrData, ($6: string, $7: string) => {
//									console.debug('#c', $6, $7);
									return 'data="' + $7.fileName() + '.svg"'
								});
								return '<object ' + $1 + $2;
							});
						};
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
					// Skip statements with an open end;
					// At the end it will be checked, wether all referenced resources resp. statements are listed:
					if (!iE.subject || iE.subject.id == CONFIG.placeholder
						|| !iE.object || iE.object.id == CONFIG.placeholder
					) return;

					// The statements usually do use a vocabulary item (and not have an individual title),
					// so we lookup, if so desired, e.g. when exporting to ePub:
					var oE: SpecifStatement = a2ext(iE);

				//	if( iE.isUndirected ) oE.isUndirected = iE.isUndirected;
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

							if (!opts || !opts.allDiagramsAsImage || CONFIG.imgTypes.indexOf(iE.type) > -1 ) {
								var oE: IFileWithContent = {
									id: iE.id,
									title: iE.title,
									type: iE.type,
									changedAt: iE.changedAt
								};
								if (iE.revision) oE.revision = iE.revision;
								if (iE.changedBy) oE.changedBy = iE.changedBy;
								if (iE.blob) oE.blob = iE.blob;
								if (iE.dataURL) oE.dataURL = iE.dataURL;
								resolve(oE);
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
										reject({status:999,statusText:"Cannot transform file '"+iE.title+"' of type '"+iE.type+"' to an image."})
								};
							};
						}
					);
				}
			}
		)
	}
}
