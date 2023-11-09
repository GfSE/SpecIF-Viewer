/*!	iLaH: Excel (XLS) import 
	Dependencies: jQuery 3.0+, sheetjs
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/

// Constructor for XLS import:
// (A module constructor is needed, because there is an access to parent's data via 'self.parent...')
moduleManager.construct({
	name: 'ioXls'
}, function (self: ITransform) {
	"use strict";
	// the mode for creating a new project:
	var fDate: string,		// the file modification date
		ontologyStatementClasses:string[] = [];
		
	self.init = function (): boolean {
        // Get the list of terms for a statementClass;
		// XLS colums with one of these terms will be transformed to statements rather than properties:
		// ToDo: Get only the specializations of "SpecIF:ModelRelation".
		ontologyStatementClasses = app.ontology.getTerms('statementClass');
		return true;
	};

	self.verify = function( f ):boolean {
//		console.debug( 'file', f );

			function isXls( fname:string ):boolean {
				return fname.endsWith('.xlsx') || fname.endsWith('.xlsm') || fname.endsWith('.xls') || fname.endsWith('.csv') 
			}
				
		if ( !isXls(f.name) ) {
			message.show( i18n.lookup('ErrInvalidFileXls', f.name) );
			return false;
		};
//		console.debug( 'file', f );

		// Remember the file modification date:
		if( f.lastModified ) {
			fDate = new Date(f.lastModified).toISOString()
		}
		else {
			// Take the actual date as a final fall back.
			// Date() must get *no* parameter here; 
			// an undefined value causes an error and a null value brings the UNIX start date:
			fDate = new Date().toISOString()
		};
//		console.debug( 'file', f, fDate );
		return true;
	};
	self.toSpecif = function (buf: ArrayBuffer):JQueryDeferred<SpecIF> {
		// import an Excel file from a buffer:
		self.abortFlag = false;
		var xDO = $.Deferred();
		
	//	xDO.notify('Transforming Excel to SpecIF',10); 
		// Transform the XLSX-data to SpecIF:
		let data = xlsx2specif(buf, self.parent.projectName, fDate);
		xDO.resolve( data );

		return xDO
	};
	self.fromSpecif = function (pr: SpecIF, opts?: any) {
	//	console.debug('toXls', pr);
		specif2xlsx(pr,opts);
	};
	self.abort = function():void {
		app.projects.abort();
		self.abortFlag = true
	};
	return self;

function xlsx2specif(buf: ArrayBuffer, pN:string, chAt:string):SpecIF {
	"use strict";
	// requires sheetjs

	interface ICell {
		t: string;
		w: string;
		v: string|number|boolean|Date;
	}
	class Coord {
		col: number;
		row: number;
		constructor(addr: string) {
			// create a coordinate from a cell name: 'C4' becomes {col:3,row:4}
			let res = addr.match(/([A-Z]+)(\d+)/);  // res[1] is column name, res[2] is line index
			if ( !Array.isArray(res) || !res[1] || !res[2] )
				throw Error("Incomplete input data: Cell without address!");
			this.col = colIdx(res[1]);
			this.row = parseInt(res[2]);
		}
	}
	class Worksheet {
		name: string;
		data: any;
		resClass: string;
		hid: string;
		range: string;
		// @ts-ignore - the isValid-flag is only true, if firstCell and lastCell are defined:
		firstCell: Coord;
		// @ts-ignore - the isValid-flag is only true, if firstCell and lastCell are defined:
		lastCell: Coord;
		isValid = false;
		constructor(wsN: string) {
			this.name = wsN;			// the name of the selected sheet (first has index '0'!)
			this.data = wb.Sheets[wsN],
			this.resClass = resClassId( pN + '-' + wsN );

			// ToDo: Check if the type name does not yet exist. Should not occur as Excel does not allow equal sheet names in a file.
			this.hid = 'H-' + simpleHash(pN + wsN)	// the hierarchy ID of the folder carrying all resources of the selected sheet
			this.range = this.data["!ref"]; 	// e.g. A1:C25
			if (this.range) {
				let splittedRange = this.range.split(":");
				if (splittedRange.length > 1) {
					// only if the sheet has content:
					this.firstCell = new Coord(splittedRange[0]);
					this.lastCell = new Coord(splittedRange[1]);
					this.isValid = true;
				};
			};
		}
	}
	class BaseTypes implements SpecIF {
		id: SpecifId;
		title: SpecifMultiLanguageText;
		generator: string;
		$schema: SpecifMetaSchema;
		dataTypes: SpecifDataType[];
		propertyClasses: SpecifPropertyClass[];
		resourceClasses: SpecifResourceClass[];
		statementClasses: SpecifStatementClass[];
		resources: SpecifResource[];
		statements: SpecifStatement[];
		hierarchies: SpecifNode[];
		constructor(prjName:string) {
			this.id = 'XLS-' + prjName.toSpecifId();
			this.title = LIB.makeMultiLanguageValue(prjName);
			this.generator = "xlsx2specif";
			this.$schema = 'https://specif.de/v1.1/schema.json';
			this.dataTypes = [
				app.standards.get("dataType", { id: "DT-ShortString" }) as SpecifDataType,
				app.standards.get("dataType", { id: "DT-Text" }) as SpecifDataType,
				app.standards.get("dataType", { id: "DT-DateTime" }) as SpecifDataType,
				app.standards.get("dataType", { id: "DT-Boolean" }) as SpecifDataType,
				app.standards.get("dataType", { id: "DT-Integer" }) as SpecifDataType,
				app.standards.get("dataType", { id: "DT-Real" }) as SpecifDataType
			];
			this.propertyClasses = [
				app.standards.get("propertyClass", { id: "PC-Name" }) as SpecifPropertyClass,
				app.standards.get("propertyClass", { id: "PC-Description" }) as SpecifPropertyClass,
				app.standards.get("propertyClass", { id: "PC-Diagram" }) as SpecifPropertyClass,
				app.standards.get("propertyClass", { id: "PC-Type" }) as SpecifPropertyClass
			];
			this.resourceClasses = [
				app.standards.get("resourceClass", { id: "RC-Paragraph" }) as SpecifResourceClass,
				app.standards.get("resourceClass", { id: "RC-Folder" }) as SpecifResourceClass
			];
			// user-created instances are not checked for visibility:
			this.resourceClasses[0].instantiation = [SpecifInstantiation.User];
			this.statementClasses = [];
			this.resources = [];
			this.statements = [];
			this.hierarchies = [];
		}
	}
	function dataTypeId( str:string ):string { 
		// must be able to find it just knowing the ws-name and the column index:
		return CONFIG.prefixDT + simpleHash(str);
	}
	class PropClass {
		id: string;
		title: string;
		dataType: SpecifKey;
		changedAt: string;
		constructor (nm: string, ti: string, dT: string) {
			this.id = propClassId(nm);
			this.title = ti;
			this.dataType = LIB.makeKey(CONFIG.prefixDT + dT);		// like baseTypes[i].id
			this.changedAt = chAt;
		}
	}
	function propClassId( str:string ):string { 
		// must be able to find it just knowing the ws-name and the column index:
		return CONFIG.prefixPC + simpleHash(str);
	}
	class ResClass {
		id: string;
		title: string;
		description: SpecifMultiLanguageText;
	//	icon?: string;    .. add during import
		instantiation: SpecifInstantiation[];
		propertyClasses: SpecifKeys;
		changedAt: string;
		constructor(nm: string, ti: string) {
			this.id = nm;
			this.title = ti;
	//		let ic = CONFIG.icons.get(this.title);
	//		if (ic) this.icon = ic;
			this.description = LIB.makeMultiLanguageValue('For resources specified per line of an excel sheet');
			this.instantiation = [SpecifInstantiation.User];  // user-created instances are not checked for visibility
			this.propertyClasses = [];
			this.changedAt = chAt;
		}
	}
	function resClassId( str:string ):string { 
		return CONFIG.prefixRC + simpleHash(str);
	}
	class StaClass {
		id: string;
		title: string;
		description: SpecifMultiLanguageText;
		instantiation: SpecifInstantiation[];
	//	propertyClasses: SpecifPropertyClass[];  --> no individual statement names used here
		changedAt: string;
		constructor(ti: string) {
			this.title = ti;
			this.id = staClassId(this.title);
			this.description = LIB.makeMultiLanguageValue('For statements created by columns whose title is declared as a statement');
			this.instantiation = [SpecifInstantiation.User];  // user-created instances are not checked for visibility
			// No subjectClasses or objectClasses means all are allowed.
			// Cannot specify any, as we don't know the resourceClasses.
		//	this.propertyClasses = [LIB.makeKey("PC-Name")];  
			this.changedAt = chAt;
		}
	}
	function staClassId( str:string ):string { 
		return CONFIG.prefixSC + simpleHash(str);
	}
	function colName( colI:number ):string {
		// get the column name from an index: 4->'D', 27->'AA'
		function cName( idx:number, res:string):string {
			if( idx<1 ) return res;
			let r = idx % 26,
				f = (idx-r)/26;
			res = String.fromCharCode(r+64) + res;
			return cName(f, res);
		}
		return cName(colI,'');
	}
	function cellName(col: number, row: number): string {
		return colName(col) + row;
	}
	function colIdx(colN: string): number {
		// transform column name to column index, e.g. 'C'->3 or 'AB'->28
		let idx = 0, f = 1;
		for (var i = colN.length - 1; i > -1; i--) {
			idx += f * (colN.charCodeAt(i) - 64);
			f *= 26;
		};
		return idx;
	}

	function collectMetaData(ws:Worksheet):void {
		if (ws && ws.isValid) {
			// Process all worksheets with a sheet name in (brackets):
			switch (ws.name) {
				// It is assumed that all lists of enumerated values are defined on a worksheet named:
				case "(Enumerations)":
					let c: number,
						r: number,
						cell: ICell,
						dT: SpecifDataType,
						pC: SpecifPropertyClass;
					for (c = ws.firstCell.col; c < ws.lastCell.col + 1; c++) {
						// skip, if there is no name = content in the first row:
						cell = ws.data[cellName(c, ws.firstCell.row)];
						if (!cell || !cell.v) continue;

						dT = { id: dataTypeId(ws.name + c), title: '', type: SpecifDataTypeEnum.String, enumeration: [], changedAt: chAt };
						pC = { id: propClassId(ws.name + c), title: '', dataType: LIB.keyOf(dT), changedAt: chAt };
						for (r = ws.firstCell.row; r < ws.lastCell.row + 1; r++) {
							cell = ws.data[cellName(c, r)];
							//						console.debug( 'cell',c,r,cell );
							if (r == ws.firstCell.row) {
								// title in the first row;
								// if the title corresponds to the property (column) name of a worksheet with data,
								// this data column will assume the enumeration type:
								pC.title = dT.title = (cell && cell.t == 's' ? cell.v as string : '')
							}
							else {
								// enumerated values in the following rows:
								if (cell && cell.t == 's' && cell.v)
									// @ts-ignore - dT is defined
									dT.enumeration.push({
										id: dT.id + '-' + r,
										value: LIB.makeMultiLanguageValue(cell.v as string)
									});
							};
						};
						// Add dataType and propertyClass, if title and values are defined:
						// @ts-ignore - dT is defined
						if (dT.title && dT.enumeration.length > 0) {
							specifData.dataTypes.push(dT);
							specifData.propertyClasses.push(pC);
						};
					};
				// skip all worksheets with other names; they will be processed by transformData()
			}
		}
	}

	function transformData(ws: Worksheet): void {
		if (ws && ws.isValid) {
			// Skip all bracketed sheetnames, e.g. "(Enumerations)" or "(Setup)":
			if (ws.name.indexOf("(") == 0 && ws.name.indexOf(")") == ws.name.length - 1) return;

			function isDateTime(cell: ICell): boolean {
				//				console.debug('isDateTime:',cell);
				return cell && (cell.t == 'd' || cell.t == 's' && LIB.isIsoDateTime(cell.v as string));
			}
			/*	function isNumber(cell: ICell ):boolean {
					return cell && (cell.t == 'n' || cell.t == 's' && RE.Number.test(cell.v as string));
				} */
			function isInt(cell: ICell): boolean {
				return cell && (cell.t == 'n' && Number.isInteger(cell.v as number) || (cell.t == 's' && RE.Integer.test(cell.v as string)));
			}
			function isReal(cell: ICell): boolean {
				return cell && (cell.t == 'n' && !Number.isInteger(cell.v as number) || (cell.t == 's' && RE.Real().test(cell.v as string)));
			}
			function isBool(cell: ICell): boolean {
				//				console.debug('isBool',cell);
				return cell && (cell.t == 'b' || cell.t == 's' && (LIB.isTrue(cell.v as string) || LIB.isFalse(cell.v as string)));
			}
			function isStr(cell: ICell): boolean {
				// @ts-ignore - in this case cell.v is a string and has a length:
				return cell && cell.t == 's' && cell.v.length > 0;
			}
			/*	function titleFromProps( res:SpecifResource ):string {
	//				console.debug( 'titleFromProps', res );
					// get the title from the properties:
					if( res.properties ) {
						let a: number,
							pC: SpecifPropertyClass;
						// first try to find a property with title listed in CONFIG.titleProperties:
						for ( a=res.properties.length-1; a>-1; a--) {
							pC = LIB.itemByKey(specifData.propertyClasses as SpecifItem[], res.properties[a]['class']);
							if ( pC && CONFIG.titleProperties.indexOf(pC.title) > -1 )
								return res.properties[a].value.stripHTML();
						};
						// then try to find a property with title listed in CONFIG.idProperties:
						for ( a=res.properties.length-1; a>-1; a--) {
							pC = LIB.itemByKey(specifData.propertyClasses as SpecifItem[], res.properties[a]['class']);
							if (pC && CONFIG.idProperties.indexOf(pC.title) > -1 )
								return res.properties[a].value.stripHTML();
						};
					};
					return '';
				} */
			function createFld(sh: Worksheet): void {
				if (sh.lastCell.row - sh.firstCell.row < 1) return;   // skip, if there are no resources

				// Processing of createFld:
				// Create folder resource:
				var fld: SpecifResource = {
					id: 'R-' + simpleHash(pN + sh.name + CONFIG.resClassFolder),
					class: LIB.makeKey("RC-Folder"),
					properties: [{
						class: LIB.makeKey("PC-Name"),
						values: [LIB.makeMultiLanguageValue(sh.name)]
					}],
					changedAt: chAt
				};
				//				console.debug( 'createFld:', fld );
				specifData.resources.push(fld);

				// Create the hierarchy entry for the folder containing all resources of the current worksheet:
				var hTree: SpecifNode = {
					id: sh.hid,
					resource: LIB.keyOf(fld),
					nodes: [],
					changedAt: chAt
				},
					dupIdL: string[] = [];  // list of duplicate resource ids 

				// Create the resources:
				for (var l = sh.firstCell.row + 1, L = sh.lastCell.row + 1; l < L; l++) {	// every line except the first carrying the attribute names
					//					console.debug('resource', l, sh );
					createRes(sh, l)
				};
				// add the hierarchy tree:
				// @ts-ignore - hTree is defined
				specifData.hierarchies[0].nodes.push(hTree);
				return;

				function createRes(ws: Worksheet, row: number): void {
					// Create a resource and store it in specifData.resources;
					// if a statement is found in a column, store it in specifData.statements (pretty obvious, isn't it):

					function getVal(dT: SpecifDataType, cell: ICell): string {
						// dT is the target dataType; 
						// it is the least restrictive type for all values in the column.
						// A single cell however, can have a more specific dataType.
						// Malicious content will be removed upon import.
						//								console.debug( 'getVal', cell, dT );
						if (cell && cell.v && dT)
							if (dT.enumeration) {
								// Return the id of the enumerated value found in cell.v,
								// where an enumerated value can only have a single language:
								for (var eV of dT.enumeration)
									// @ts-ignore - 'text' exists (only) for dataType 'string'
									if ((eV.value[0].text || eV.value[0]) == cell.v) return eV.id;
								return '';
							};
						// else:
						switch (dT.type) {
							case SpecifDataTypeEnum.String:
								switch (cell.t) {
									case "s": return cell.v as string;
									case "d": return (cell.v as Date).toISOString();
									case "n": return (cell.v as number).toString();
									case "b": return (cell.v as boolean).toString();
								};
							case SpecifDataTypeEnum.DateTime:
								switch (cell.t) {
									case "d": return (cell.v as Date).toISOString();
									case "s":
										// Can only get here in case of a native property;
										// the value will be checked later on, so there is no need to log a warning.
										if (LIB.isIsoDateTime(cell.v))
											return cell.v as string;
										//	console.warn(ws.name + ", row " + row + ": Cell value '" + cell.v + "' is an invalid dateTime value");
										return '';
								};
							case SpecifDataTypeEnum.Integer:
							case SpecifDataTypeEnum.Double:
								switch (cell.t) {
									case "n": return (cell.v as number).toString();
									case "s": return cell.v as string;
								};
							// we have found earlier that it is a valid boolean,
							// so all values not beeing true are false:
							case SpecifDataTypeEnum.Boolean:
								switch (cell.t) {
									case "b": return (cell.v as boolean).toString();
									case "s": return LIB.isTrue(cell.v as string).toString();
								};
						};
						return '';
					}

					// The resource to create:
					// @ts-ignore - id and title will be defined further down
					var res: Resource = {
						// id will be set later on using the visibleId, if provided.
						// title will be set according to the properties, later on.
						class: LIB.makeKey(ws.resClass),
						properties: [],
						changedAt: chAt
					};

					let c: number, C: number,
						cell: ICell,
						val: string,
						//	rC,
						pC: SpecifPropertyClass,
						dT: SpecifDataType, id,
						stL: IIncompleteStatement[] = [],
						pTi: string;
					for (c = ws.firstCell.col, C = ws.lastCell.col + 1; c < C; c++) {	// an attribute per column ...
						cell = ws.data[cellName(c, ws.firstCell.row)];   // column title in the first row
						pTi = cell && cell.v ? (cell.v as string).trim() : '';
						// skip the column, if it has no title (value in the first row):
						if (!pTi) continue;

						cell = ws.data[cellName(c, row)];

						//							console.debug('createRes',pTi,c,cellName(c,row),cell);
						if (cell && cell.v) {
							// the cell has content:

							// Use native property, if appropriate:
							if (CONFIG.nativeProperties.has(pTi)) {
								pC = CONFIG.nativeProperties.get(pTi); // here, pC is actually not a real propertyClass, but serving it's role ...
								// @ts-ignore - the first parameter of getVal() has all information needed for proper transformation
								val = getVal({ type: pC.type }, cell);
								// @ts-ignore - check is defined in this case
								if (pC.check(val)) {
									// @ts-ignore - name is defined in this case
									res[pC.name] = val;
									// @ts-ignore - name is defined in this case
									console.info(ws.name + ", row " + row + ": '" + pTi + "' with value '" + val + "' has been mapped to the native property '" + pC.name + "'");
								}
								else
									console.warn(ws.name + ", row " + row + ": Cell value '" + cell.v + "' is invalid for the given native property '" + pTi + "'");
								continue;
							};

							pC = LIB.itemById(specifData.propertyClasses as SpecifItem[], propClassId(ws.name + c));
							//								console.debug('create p',c,cellName(c,row),cell,rC,pC);
							if (pC) {
								// It is a specifically created property type (with neither native nor enumerated dataType):
								dT = LIB.itemByKey(specifData.dataTypes as SpecifItem[], pC.dataType);
								val = getVal(dT, cell);

								// Find the property value to be taken as resource identifier.
								// id is the first identifier found as declared in CONFIG.idProperties;
								// the first id value found will prevail:
								if (!id && CONFIG.idProperties.indexOf(pC.title) > -1) id = val;

								if (dT.maxLength && (dT.maxLength < val.length)) {
									val = val.slice(0, dT.maxLength);
									console.warn('Text of cell ' + cellName(c, row) + ' on sheet ' + sh.name + ' has been truncated because it is too long')
								};
								//									console.debug( 'other than enumerated dataType',cell,pC,dT,val,typeof(val) );
								// Include the property only if it has a significant value:
								if (val)
									res.properties.push({
										class: LIB.keyOf(pC),
										values: [(dT.type == SpecifDataTypeEnum.String) ? LIB.makeMultiLanguageValue(val) : val]
									});
							}
							else {
								pC = LIB.itemByTitle(specifData.propertyClasses as SpecifItem[], pTi);
								if (pC) {
									// It is a property with enumerated dataType; only a defined value will be used.
									// Thus, if a cell contains a value which is not listed in the type, it will be ignored:
									val = getVal(LIB.itemByKey(specifData.dataTypes as SpecifItem[], pC.dataType), cell);
									//										console.debug( 'enumerated dataType',cell,pTi,pC,val,typeof(val) );
									if (val)
										res.properties.push({
											class: LIB.keyOf(pC),
											values: [val]
										})
									else
										console.warn('Suppressed undefined enumerated value in cell ' + cellName(c, row) + ' of worksheet ' + ws.name);
								}
								else {
									// It is a statement:
									let obL = cell.w.split(",");  // cell.w is always a string
									// If there is no comma, obL has just one element. 
									if (obL.length < 2)
										// See whether semicolons are used as a separator, instead:
										obL = cell.w.split(";");
									//										console.debug('createRes - statement',pTi,obL);
									obL.forEach((ob: string) => {
										let oInner: string[] = RE.inQuotes.exec(ob),
											res2l: string;
										if (oInner && oInner.length > 2) {
											// a string in quotes has been found
											res2l = oInner[1] || oInner[2];
										}
										else {
											res2l = ob.trim();
										};
										if (res2l.length > CONFIG.titleLinkMinLength - 1)
											stL.push({
												//	id: undefined,  	// defined further down, when the resource's id has been determined
												class: LIB.makeKey(staClassId(pTi)),	// make id from column title
												//	subject: undefined,	// defined further down, when the resource's id has been determined
												// just an object placeholder for passing the schema-check,
												// it will be replaced with a resource key when importing.
												// Remember to disable the constraint-check on the statement.object.
												object: LIB.makeKey(CONFIG.placeholder),
												resourceToLink: res2l,  // content in double or single quotes
												changedAt: chAt
											} as IIncompleteStatement);
									});
								};
							};
						};
					};
					if (res.properties.length > 0) {
						/*	// Check and warn, if the property classes are not unique:
							let cL=[], pC;
							res.properties.forEach( function(p) {
								pC = p['class'];
								if( cL.indexOf(pC)>-1 ) 
									console.warn('The property class '+pC+' of element '+res.id+' is occurring more than once.');
								cL.push( pC )
							});  */

						// Build a resource id from the worksheet-name plus the value of the user-specified id attribute
						// or generate a generic id, otherwise.
						// An id is needed to recognize the resource when updating.
						// So, if a resource has no id attribute, it gets a new id on every import
						// and consequently a new resource will be created during import instead of updating the existing.
						if (id) {
							// An id has been specified
							res.id = 'R-' + simpleHash(ws.name + id);
							if (LIB.indexById(specifData.resources, res.id) > -1) {
								// The specified id is not unique,
								// it will be modified deterministically based on the number of occurrences of that same id:
								// see https://stackoverflow.com/questions/19395257/how-to-count-duplicate-value-in-an-array-in-javascript
								dupIdL.push(id);
								let counts: any = {};
								dupIdL.forEach((x: string) => { counts[x] = (counts[x] || 0) + 1 });
								console.warn('The user-defined identifier', id, 'is occurring', counts[id] + 1, 'times.');
								//									console.debug('dupId',id,simpleClone(dupIdL),counts[id]);
								// modify the id of any duplicate specified user-assigned id,
								// as an id must be unique, of course:
								res.id = 'R-' + simpleHash(ws.name + id + counts[id]);
							};
						}
						else {
							// No id specified, so a random value must be generated. 
							// No chance to update the element later on!
							res.id = LIB.genID('R-');
						};
						//							console.debug('xls-resource',res);

						// add the hierarchy entry to the tree:
						// @ts-ignore - hTree is defined
						hTree.nodes.push({
							// @ts-ignore - hTree is defined
							id: 'N-' + simpleHash(res.id + hTree.nodes.length),
							resource: LIB.keyOf(res),
							changedAt: chAt
						});
						// add the resource to the list:
						specifData.resources.push(res);
						// the resource has been stored, so any statement can be stored, as well:
						if (stL.length > 0) {
							stL.forEach((st) => {
								st.id = 'S-' + simpleHash(res.id + st['class'].id + st.resourceToLink);
								st.subject = LIB.keyOf(res)
							});
							specifData.statements = specifData.statements.concat(stL);
						}
					}
				}
			}

			function getPropClasses(ws: Worksheet) {
				// build a list of propertyClasses for the given worksheet;
				// a complete propertyClass is added to pCL per column which is not titled with a statement title
				// and a corresponding list of propertyClass ids is returned for the resourceClass.
				var pCs: SpecifKeys = [], // list of propertyClass keys found on this worksheet
					pC: SpecifPropertyClass,
					dT: SpecifDataType,
					c: number, C: number,
					cell: ICell,
					noTitleFound = true,
					pTi: string;
				for (c = ws.firstCell.col, C = ws.lastCell.col + 1; c < C; c++) {		// every column
					// Check whether it is an enumerated dataType:
					cell = ws.data[cellName(c, ws.firstCell.row)];
					pTi = cell && cell.v ? (cell.v as string).trim() : '';
					// Process only columns with title, skip the others:
					if (pTi) {
						// 1. A native property will be used, if possible, so no propertyClass is created:
						if (CONFIG.nativeProperties.has(pTi))
							continue;
						// 2. Find out, whether its a (previously created) enumerated dataType:
						pC = LIB.itemByTitle(specifData.propertyClasses as SpecifItem[], pTi);
						if (pC && pC.id) {
							dT = LIB.itemByKey(specifData.dataTypes as SpecifItem[], pC.dataType);
							if (dT && dT.enumeration) {
								//								console.debug( 'enum found: ', cell, pTi, pC );
								// The current column has an enumeration dataType;
								// use the corresponding propertyClass:
								pCs.push(LIB.keyOf(pC));
								continue;
							};
						};
						// 3. It is neither a native nor an enumerated dataType, 
						//    so we find out which dataType is appropriate:
						// @ts-ignore - yes, pC may be undefined, that's why there is an if-block further down:
						pC = getPropClass(c);
						// .. and create the propertyClass:
						if (pC) {
							LIB.cacheE(specifData.propertyClasses, pC); // add it to propertyClasses, avoid duplicates
							pCs.push(LIB.keyOf(pC));  // add the key to the resourceClass' propertyClasses
						};
					};
				};
				return pCs;

				function getPropClass(cX: number): SpecifPropertyClass | undefined {
					// Determine the data type of all values of the column starting with the second row (= second list entry).
					// If all are equal, the data type is assumed; by default it is 'ShortString'.
					// Some cell values may be undefined.
					const defaultC = 'ShortString';

					// add all values of the current column to a list:
					let valL = [],
						r: number,
						R: number;
					for (r = ws.firstCell.row, R = ws.lastCell.row + 1; r < R; r++) {		// every line
						valL.push(ws.data[cellName(cX, r)]);
					};

					// the cell value in the first line is the title, either of a property or a statement:
					let pTi = valL[0] ? (valL[0].w || valL[0].v) : '',
						pC = '',
						nC = '';
					//					console.debug( 'getPropClass 1', pTi, valL );

					// Skip, if there is no column heading or if it is a statement title,
					// (the check is done here - and not a level above - because here we know the title value):
					if (!pTi || ontologyStatementClasses.includes(pTi)) return;
					// else, it is a property:

					// Only one property shall be the resource's title;
					// the first one found shall prevail:
					let xTi = pTi,  // translate the title to standard term
						isNoTi = xTi != CONFIG.propClassTitle;
					if (noTitleFound || isNoTi) {
						pTi = xTi;
						noTitleFound = noTitleFound && isNoTi;
					};

					// Cycle through all elements of the column and select the most restrictive type,
					// start with the last and stop with the second line:
					for (var i = valL.length - 1; i > 0; i--) {
						nC = classOf(valL[i]);
						//						console.debug('getPropClass 2',i,pC,valL[i],nC);
						if (nC.length < 1) continue;
						if (!pC) { pC = nC; continue };
						if (pC == nC) continue;
						if (pC == 'Real' && nC == 'Integer') continue;
						if (pC == 'Integer' && nC == 'Real') { pC = 'Real'; continue };
						// else: the classes are not equal, take the least restrictive:
						pC = defaultC;
					};
					// Assign a longer text field for descriptions:
					if (CONFIG.descProperties.includes(pTi)) pC = 'Text';

					// Assign a longer text field for columns with cells having a longer text;
					if (pC == 'ShortString') {   // specifically 'ShortString', not defaultC !!
						let maxL = 0,
							multLines = false;
						// determine the max length of the column values and if there are multiple lines:
						for (var i = valL.length - 1; i > 0; i--) {
							maxL = Math.max(maxL, valL[i] && valL[i].v ? valL[i].v.length : 0);
							multLines = multLines || valL[i] && typeof (valL[i].v) == 'string' && valL[i].v.indexOf('\n') > -1
						};
						// if so, choose a text property:
						//						console.debug( 'getPropClass 3',maxL,multLines );
						if (maxL > CONFIG.textThreshold || multLines)
							pC = 'Text'
					};
					//					console.debug( 'getPropClass 4',valL[i],pC );
					return new PropClass(ws.name + cX, pTi, pC || defaultC) as SpecifPropertyClass;

					function classOf(cell: ICell): string {
						if (isBool(cell)) return 'Boolean';
						if (isInt(cell)) return 'Integer';
						if (isReal(cell)) return 'Real';
						if (isDateTime(cell)) return 'DateTime'
						if (isStr(cell)) return defaultC;
						return '';
					}
				}
			}
			function getStaClasses(ws: Worksheet, sCL: SpecifStatementClass[]): void {
				// build a list of statementClasses:
				var sTi, sC: SpecifStatementClass;
				for (var c = ws.firstCell.col, C = ws.lastCell.col + 1; c < C; c++) {		// every column
					sTi = ws.data[cellName(c, ws.firstCell.row)];  			// value of first line
					// Skip columns without title;
					// in Excel 'deleted' cells are different from 'empty' cells,
					// so we need to take a look at the actual values:
					if (sTi) {
						sTi = sTi.w || sTi.v;
						// Add statementClass, if it is declared as such and if it is not yet listed:
						if (sTi && LIB.indexById(sCL, staClassId(sTi)) < 0 && ontologyStatementClasses.includes(sTi)) {
							sC = new StaClass(sTi);
							//							console.debug( 'getStaClasses', sTi, sC );
							sCL.push(sC)
						};
					};
				};
			}

			//		console.debug( 'sheetName:', ws.name );

			// Processing of transformData():
			if (ws.range) {
				// The sheet has content:

				// 3.1 Create a resourceClass per XLS-sheet:
				// The resourceClass' title is taken from the worksheet name, project name or a default is applied;
				// any local name will be transformed to the preferred ontology term during import (if defined):
				var rC = new ResClass(ws.resClass, inBracketsAtEnd(ws.name) || inBracketsAtEnd(pN) || CONFIG.resClassXlsRow);
				// Add a property class for each column using the names specified in line 1:
				rC.propertyClasses = getPropClasses(ws);
				//			console.debug('rC',rC);
				specifData.resourceClasses.push(rC);
				getStaClasses(ws, specifData.statementClasses);

				// 3.2 Create a folder with the resources of this worksheet:
				createFld(ws);
			}
		}
	}

	// Processing of xlsx2specif:
//	console.info( 'js-xlsx version', XLSX.version );
	// Import an excel file:
	// - wb is the whole workbook, consisting of 1 to several worksheets
	// - ws is a worksheet
	let xDta = new Uint8Array(buf),
		// @ts-ignore - 'XLSX' is loaded at runtime
		wb = XLSX.read(xDta, {type:'array', cellDates:true, cellStyles:true}),	// the excel content, i.e. "workbook"
		wsCnt = wb.SheetNames.length;		// number of sheets in the workbook

	console.info( 'SheetNames: '+wb.SheetNames+' ('+wsCnt+')' );
//	console.debug('workbook',pN,wb);

	// Transform the worksheets to SpecIF:
	// 1. Create the project:
	var specifData:SpecIF = new BaseTypes(pN);
	// the root folder resource:
	specifData.resources.push({
		id: 'R-' + pN.toSpecifId(),
		class: LIB.makeKey("RC-Folder"),
		properties: [{
			class: LIB.makeKey("PC-Name"),
			values: [ LIB.makeMultiLanguageValue(pN )]
		}, {
			class: LIB.makeKey("PC-Type"),
			values: [ LIB.makeMultiLanguageValue(CONFIG.resClassOutline )]
		}],
		changedAt: chAt
	});

	// 2. Create the specification (hierarchy root) for the file:
	specifData.hierarchies.push({
		id: 'H-' + pN.toSpecifId(),
		resource: LIB.makeKey('R-' + pN.toSpecifId() ),
		nodes: [],
		changedAt: chAt
	});

	let idx: number;
	// 3. Collect meta-data such as enumerated types 
	//    in a first pass through all worksheets,
	//    as worksheets with meta-data can be at any position:
	for( idx=0; idx<wsCnt; idx++ )
		collectMetaData( new Worksheet( wb.SheetNames[idx] ));

	// 4. In a second pass, transform the xls data to SpecIF:
	for( idx=0; idx<wsCnt; idx++ )
		transformData( new Worksheet( wb.SheetNames[idx] ));

//	console.info('SpecIF created from '+pN+' (Excel)');
//	console.debug('SpecIF',specifData);
	return specifData;

	function inBracketsAtEnd(str: string): string | undefined {
		// Extract resourceClass in (round brackets) or [square brackets]:
		//	let resL = /\s*(?:\(|\[)([a-zA-Z\d:_\-].+?)(?:\)|\])$/.exec( pN );
		let resL = RE.inBracketsAtEnd.exec(str);
		if (Array.isArray(resL) && resL.length > 1)
			return resL[1] || resL[2];
	}
}	// end of xlsx2specif

function specif2xlsx(data: SpecIF, opts?: any): void {
	console.debug('toXlsx', data, opts);
	// @ts-ignore - 'XLSX' is loaded at runtime
	const wb = XLSX.utils.book_new();

	// Fill all resources in a table according to the hierarchies.
	let selPrj = app.projects.selected,
		cData = selPrj.cache,
		pend = 0,
		// add first line of the table with propertyClass titles:
		// ToDo: 
		// - sequence shall be title, descriptions, other
		// - add native properties order, changedBy, changedAt
		sheet = [
			data.propertyClasses.map(
				(pC) => {
					return pC.title
				}
			)
		];
	LIB.iterateNodes(
		// Iterate all hierarchies except the one for unreferenced resources:
		(cData.get("hierarchy", selPrj.hierarchies) as SpecifNodes)
			.filter(
				(h: SpecifNode) => {
					return LIB.typeOf(h.resource, cData) != CONFIG.resClassUnreferencedResources
				}
			),
		// ... and extract the property values of the resources referenced in the hierarchies;
		// where every resource results in a line of the table:
		(nd: SpecifNode) => {
			pend++;
			//				console.debug('2xlsx',pend,nd.resource);
			// Read asynchronously, so that the cache has the chance to reload from the server.
			// - The sequence may differ from the hierarchy one's due to varying response times.
			// - A resource will be listed several times, if it appears several times in the hierarchies.
			selPrj.readItems('resource', [nd.resource])
				.then(
					(rL: SpecifResource[]) => {
						// Add the resource's property values 
						// in the sequence of the columns = sequence of propertyClasses:
						// ToDo: 
						// - sequence shall be title, descriptions, other
						// - add native properties order, changedBy, changedAt
						sheet.push(
							prpValues(rL[0]) // rL should have exactly one element
						);

						if (--pend < 1) {  // all done
							// 1. Add a sheet with all resources in the sequence of the hierarchy:
							// @ts-ignore - 'XLSX' is loaded at runtime
							const ws = XLSX.utils.aoa_to_sheet(sheet);
							// @ts-ignore - 'XLSX' is loaded at runtime
							XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

							// 2. Add a sheet with all enumerated values per dataType:

							// 3. Write the workbook to file:
							// @ts-ignore - 'XLSX' is loaded at runtime
							XLSX.writeFile(wb, opts.fileName + ".xlsx", { compression: true });
							//	app.busy.reset();
							if (typeof (opts.done) == "function") opts.done();
						}
					},
					LIB.stdError
				);
			return true; // continue and descend into deeper levels
		}
	);
	return;

	function prpValues(res: SpecifResource) {
		// Return a list of the resource's property values
		let prpL = [];
		for (var pC of data.propertyClasses) {
			let p = findPrp(res.properties, pC);
			// @ts-ignore
			let pVal = p ? p.values[0][0].text || p.values[0] : undefined;
			//    console.debug('prpValues 2', p, pVal);
			if (p && p.values.length > 1)
				console.info("Only first property value exported to xlsx.");

			// lookup if it is an enumerated value:
			let dT = LIB.itemByKey(data.dataTypes, pC.dataType);
			if (pVal && dT && dT.enumeration) {
				let v = LIB.itemById(dT.enumeration, pVal);
			//	pVal = typeOf(v.value)=='string'? v.value : v.value[0]['text'];
				pVal = LIB.isMultiLanguageValue(v.value) ? v.value[0]['text'] : v.value;
			};

			prpL.push(pVal);
		};
		return prpL;
		function findPrp(prpL:SpecifProperty[], pC:SpecifPropertyClass) {
			// Find the property in prpL referencing the propertyClass pC
			for (var p of prpL) {
				if (LIB.references(p['class'], pC)) return p;
			}
			// else return 'undefined' resulting in an empty table cell.
		}
	}

	/*   function isArrayWithContent(array) {
			return (Array.isArray(array) && array.length > 0);
		};
	   
		function escapeSpecialCharaters(string) {
			return string.replace("\\","\\\\").replace(/\\([\s\S])|(')/g, "\\$1$2").replace(/\n/g, "\\n");
		}; */

}

});
