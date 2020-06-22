/*	iLaH: Excel (XLS) import 
	Dependencies: jQuery 3.0+, sheetjs
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de            
*/

// Constructor for XLS import:
// (A module constructor is needed, because there is an access to parent's data via 'self')
modules.construct({
	name: 'ioXls'
}, function(self) {
	"use strict";
	// the mode for creating a new project:
	var	fDate,		// the file modification date
		data,		// the SpecIF data structure for xls content
		xDO;
		
	self.init = function() {
		self.resourceClass = '';
		return true
	};

	self.verify = function( f ) {
//		console.debug( 'file', f );

			function isXls( fname ) {
				return fname.endsWith('.xlsx') || fname.endsWith('.xls') || fname.endsWith('.csv') 
			}
				
		if ( !isXls(f.name) ) {
			message.show( i18n.phrase('ErrInvalidFileXls', f.name) );
			return
		};
//		console.debug( 'file', f );
		if( f.lastModified ) {
			fDate = new Date(f.lastModified).toISOString();
//			console.debug( 'file.lastModified', fDate )
			return f
		};
		if( f.lastModifiedDate ) {
			// this is deprecated, but at the time of coding, Edge does not support the above, yet:
			fDate = new Date(f.lastModifiedDate).toISOString();
//			console.debug( 'file.lastModifiedDate', fDate )
			return f
		};
		// take the actual date as a final fall back
		fDate = new Date().toISOString();
//		console.debug( 'file', f, fDate );
		return f
	};
	self.toSpecif = function( buf ) {
		// import an Excel file from a buffer:
		self.abortFlag = false;
		xDO = $.Deferred();
		
		xDO.notify('Transforming Excel to SpecIF',10); 
		// Transform the XLSX-data to SpecIF:
		data = xslx2specif( buf, self.parent.projectName, fDate );
		xDO.resolve( data );

		return xDO
	};
	self.abort = function() {
		app.cache.abort();
		self.abortFlag = true
	};
	return self

function xslx2specif( buf, pN, chAt ) {
	"use strict";
	// requires sheetjs

		function BaseTypes() {
			this.dataTypes = [{
			  id: "DT-Text",
			  title: "Plain Text",  // dataType for XLS columns with text content
			  description: "A text string",
			  maxLength: CONFIG.maxStringLength,
			  type: "xs:string",
			  changedAt: "2016-05-26T08:59:00+02:00"
		/*	},{
			  id: "DT-ShortString",
			  title: "String["+CONFIG.textThreshold+"]",
			  description: "String with max. length "+CONFIG.textThreshold,
			  type: "xs:string",
			  maxLength: CONFIG.textThreshold,
			  changedAt: "2016-05-26T08:59:00+02:00"
			},{
			  id: "DT-FormattedText",
			  title: "Formatted Text",
			  description: "XHTML formatted text.",
			  maxLength: CONFIG.maxStringLength,
			  type: "xhtml",
			  changedAt: "2016-05-26T08:59:00+02:00" */
			},{ 
			  id: "DT-DateTime",  
			  title: "Date or Timestamp",  // dataType for XLS columns with dateTime content
			  description: "Date or Timestamp in ISO-Format",
			  type: "xs:dateTime",
			  changedAt: "2016-05-26T08:59:00+02:00"
			},{ 
			  id: "DT-Boolean",
			  title: "Boolean",  // dataType for XLS columns with boolean content
			  description: "The Boolean data type.",
			  type: "xs:boolean",
			  changedAt: "2016-05-26T08:59:00+02:00"
			},{ 
			  id: "DT-Integer",
			  title: "Integer",  // dataType for XLS columns with integer content
			  description: "A numerical integer value from -32768 to 32768.",
			  type: "xs:integer",
			  "minInclusive": CONFIG.minInteger,
			  "maxInclusive": CONFIG.maxInteger,
			  changedAt: "2016-05-26T08:59:00+02:00"
			},{ 
			  id: "DT-Real",
			  title: "Real",  // dataType for XLS columns with real content
			  description: "A floating point number (double) with 5 fraction digits.",
			  type: "xs:double",
			  "fractionDigits": CONFIG.maxAccuracy,
			  "minInclusive": CONFIG.minReal,
			  "maxInclusive": CONFIG.maxReal,
			  changedAt: "2016-05-26T08:59:00+02:00"
			}];	
			this.propertyClasses = [];	
			this.resourceClasses = [{	
				id: resClassId( CONFIG.resClassFolder ),
				title: CONFIG.resClassFolder,			// specType for folders (e.g. representing sheets) 
				isHeading: true,
				description: 'Resource class for folders',
				instantiation: ["auto","user"],
				changedAt: chAt
			}];
			this.statementClasses = []
		}
		function PropClass( str, ti, dT ) { 
			this.id = propClassId( str );
			this.title = ti;
			this.dataType = 'DT-'+dT;		// like baseTypes[i].id
			this.changedAt = chAt
		}
		function propClassId( str ) { 
			// must be able to find it just knowing the ws-name and the column index:
			return 'PC-'+str.simpleHash()
		}
		function ResClass( nm, ti ) { 
			this.id = resClassId( nm );
			this.title = vocabulary.resource.specif(ti);
			this.description = 'For resources specified per line of an excel sheet';
			this.instantiation = ["auto","user"];
			this.propertyClasses = [];
			this.changedAt = chAt
		}
		function resClassId( ti ) { 
			return 'RC-'+ti.toSpecifId()
		}
		function StaClass( ti ) { 
			this.id = staClassId( ti );
			this.title = ti;
			this.description = 'For statements created by columns whose title is declared as a statement';
			this.instantiation = ["auto","user"];
			// No subjectClasses or objectClasses means all are allowed.
			// Cannot specify any, as we don't know the resourceClasses.
			this.changedAt = chAt
		}
		function staClassId( ti ) { 
			return 'SC-'+ti.toSpecifId()
		}
	function transformSheet(idx) {
			function colIdx( colN ) {
				// transform column name to column index, e.g. 'C'->3 or 'AB'->28
				let idx=0,f=1;
				for( var i=colN.length-1; i>-1; i-- ) {
					idx += f*(colN.charCodeAt(i)-64);
					f *= 26
				};
				return idx
			}
			function colName( colI ) {
				// get the column name from an index: 4->'D', 27->'AA'
				function cName( idx, res) {
					if( idx<1 ) return res;
					let r = idx % 26,
						f = (idx-r)/26;
					res = String.fromCharCode(r+64) + res;
					return cName( f, res )
				}
				return cName(colI,'')
			}
			function coord( addr ) {
				// create a coordinate from a cell name: 'C4' becomes {col:3,row:4}
				let res = addr.match(/([A-Z]+)([0-9]+)/);  // res[1] is column name, res[2] is line index
				return {col:colIdx(res[1]),row:parseInt(res[2])}
			}
	/*		function cellName( coord ) {
				return colName(coord.col)+coord.row
			}  */
			function isDateTime( cell ) {
//				console.debug('cell:',cell);
				return cell && cell.t=='d' 
			}
			function isNumber( cell ) {
				return cell && cell.t=='n'
			}
			function isInt( cell ) {
				return isNumber( cell ) && Number.isInteger( parseFloat(cell.v) )
			}
			function isReal( cell ) {
				return isNumber( cell ) && !Number.isInteger( parseFloat(cell.v) )
			}
			function isBool( cell ) {
				return cell && (cell.v.isTrue() || cell.v.isFalse() || cell.t=='b')
			}
	/*		function isStr( cell ) {
				return cell && cell.t=='s'
			}
			function isXHTML( cell ) {
				return cell && cell.t=='s' && ....
			}  */			
			function titleFromProps( obj ) {
					function tIdx( obj ) {
						// Find the index of the property to be used as title.
						// First, check the configured headings:
						for( var a=0,A=obj.properties.length;a<A;a++ ) {
							if( CONFIG.headingProperties.indexOf( obj.properties[a].title )>-1 ) return a
						};
						// If nothing has been found, check the configured titles:
						for( a=0,A=obj.properties.length;a<A;a++ ) {
							if( CONFIG.titleProperties.indexOf( obj.properties[a].title )>-1 ) return a
						};
						return -1
					}
				// get the title from the properties:
				if( obj.properties ) {
					// 1. look for a property serving as title:
					let ti = tIdx( obj );
					if( ti>-1 ) {  // found!
						// Remove all formatting for the title, as the app's format shall prevail.
						// Before, remove all marked deletions (as prepared be diffmatchpatch).
						// ToDo: Check, whether this is at all called in a context where deletions and insertions are marked ..
						return obj.properties[ti].value.stripHTML()
					};
					// 2. otherwise, look for an id-property:
					for( var a=0,A=obj.properties.length;a<A;a++ ) {
						if( CONFIG.idProperties.indexOf( obj.properties[a].title )>-1 ) 
							return obj.properties[a].value.stripHTML()
					} 
				};
				return ''
			}
			function createFld( sh ) {
				if( sh.lastCell.row-sh.firstCell.row<1 ) return;   // skip, if there are no resources

					function getVal( dT, cell ) {
						// malicious content will be removed upon import.
						if( !cell ) return '';
//						console.debug( 'getVal', cell, dT );
						switch( dT ) {
							case 'xs:dateTime': return cell.v.toISOString();
							case 'xs:integer':
							case 'xs:double':	return cell.v.toString();
							case 'xs:string':
							case 'xhtml':		return cell.v;
							// we have found earlier that it is a valid boolean, so all values not beeing true are false:
							case 'xs:boolean':	return cell.v.isTrue().toString()  
						};
						return ''
					}
					function createR( ws, l ) {
						// create a resource:
						var res = {
								// id will be set later on using the visibleId, if provided.
								// title will be set according to the properties, later on.
								class: resClassId( ws.resClassName ),
								properties: [],
								changedAt: chAt
							};
						let c, C, cell, rC, pC, dT, id, stL=[], ti, obL, oInner;
						for( c=ws.firstCell.col,C=ws.lastCell.col+1; c<C; c++ ) {		// an attribute per column ...
							cell = ws.data[colName(c)+l];
//							console.debug('createR',c,colName(c)+l,cell);
							if( cell ) {											// ... if it has content
								rC = itemById( specif.resourceClasses, resClassId(ws.resClassName) );
								pC = itemById( specif.propertyClasses, propClassId(ws.name+c) );
								
							//	if( pC && CONFIG.statementClasses.indexOf(pC.title)<0 ) {
								if( pC ) {
									// it is a property:
//									console.debug('createR - property',pC);
									dT = itemById(specif.dataTypes,pC.dataType);

									// Find the value to be taken as resource identifier.
									// id is the first identifier found as declared in CONFIG.idProperties;
									// the first id value found will prevail:
									if( !id && CONFIG.idProperties.indexOf(pC.title)>-1 ) id = getVal( dT.type, cell );
									// ToDo: Consider to select the id property beforehand and not over and over again for every resource/row.

									res.properties.push({
										title: pC.title,	// needed for titleFromProps()
										class: pC.id,
										value: getVal( dT.type, cell )
									})
								} else {
									// it is a statement:
									ti = ws.data[colName(c)+ws.firstCell.row].v;  // column title in the first line of the same column
									obL = cell.v.split(",");
//									console.debug('createR - statement',ti,obL);
									obL.forEach( (ob)=>{
										oInner = RE.quote.exec( ob );
										if( oInner && oInner.length>2 ) {
											stL.push({
										//		id: undefined,  	// defined further down, when the resource's id has been determined
												title: ti,
												class: staClassId( ti ),	// make id from column title
										//		subject: undefined,	// defined further down, when the resource's id has been determined
												objectToFind: oInner[1] || oInner[2],  // for content in double and single quotes
												// just a placeholder for passing the schema-check,
												// it will be replaced with a resource.id when importing.
												// Remember that the constraint-check on the statement.object must be disabled.
												object: CONFIG.placeholder, 
												changedAt: chAt
											})
										}
									})
								}
							}
						};
						if( res.properties.length>0 ) {
						/*	// Check and warn, if the property classes are not unique:
							let cL=[], pC;
							res.properties.forEach( function(p) {
								pC = p['class'];
								if( cL.indexOf(pC)>-1 ) 
									console.warn('The property class '+pC+' of element '+res.id+' is occurring more than once.');
								cL.push( pC )
							});  */
							
							// Build an id from the worksheet-name plus the value of the declared id attribute
							// or generate a new id, otherwise.
							// An id is needed to recognize the resource when updating.
							// So, if a resource has no id attribute, it gets a new id 
							// and consequently a new resource will be created instead of updating the existing.
							if( id ) {
								// An id has been specified
								res.id = 'R-'+(ws.name+id).simpleHash();
								if( indexById( specif.resources, res.id )>-1 ) {
									// The specified id is not unique,
									// it will be modified deterministically based on the number of occurrences of that same id:
									// see https://stackoverflow.com/questions/19395257/how-to-count-duplicate-value-in-an-array-in-javascript
									dupIdL.push(id);
									let counts = {};
									dupIdL.forEach( (x)=>{ counts[x] = (counts[x]||0)+1 });
									console.warn('The user-defined identifier',id,'is occurring',counts[id]+1,'times.');
//									console.debug('dupId',id,simpleClone(dupIdL),counts[id]);
									res.id = 'R-'+(ws.name+id+counts[id]).simpleHash()
								}
							} else {
								// No id specified, so a random value must be generated. 
								// No chance to update the element later on!
								res.id = genID('R-')
							};
							res.title = titleFromProps( res );
//							console.debug('xls-resource',res);
							// add the hierarchy entry to the tree:
							hTree.nodes.push({ 
								id: 'N-'+(res.id+hTree.nodes.length).simpleHash(),
								resource: res.id,
								changedAt: chAt
							}); 
							// add the resource to the list:
							specif.resources.push(res);
							// store any statements only if the resource is stored, as well
							// that's why it is here and not outside the 'if' block:
							if( stL.length>0 ) {
								stL.forEach( (st)=>{ st.id = 'S-'+(res.id+st.title+st.objectToFind).simpleHash(); st.subject = res.id } );
								specif.statements = specif.statements.concat(stL)
							}
						}
					}
		
				// Processing of createFld:
				// Create folder resource:
				var fld = {
						id: 'F-'+(pN+sh.name+CONFIG.resClassFolder).simpleHash(),
						title: sh.name,
						class: resClassId( CONFIG.resClassFolder ),
						changedAt: chAt
					};
//				console.debug( 'createFld:', fld );
				specif.resources.push( fld );

				// Create the hierarchy entry for the folder containing all resources of the current worksheet:
				var hTree = { 
						id: sh.hid, 
						resource: fld.id,
						nodes: [],
						changedAt: chAt
					},
					dupIdL=[];  // list of duplicate resource ids 
					
				// Create the resources:
				for( var l=sh.firstCell.row+1,L=sh.lastCell.row+1;l<L;l++) {	// every line except the first carrying the attribute names
//					console.debug('resource', l, sh );
					createR( sh, l )
				};
				// add the hierarchy tree:
				specif.hierarchies[0].nodes.push( hTree )
			}

			function addPropClasses( ws, pCL ) { 
				// build a list of propertyClasses for the given worksheet; default type is "TEXT";
				// a complete propertyClass is added to pCL per column which is not titled with a statement title
				// and a corresponding list of propertyClass ids is returned for the resourceClass.
				var pCIdL=[], // list of propertyClass ids found on this worksheet
					vL,pC;
				for( var c=ws.firstCell.col,C=ws.lastCell.col+1;c<C;c++ ) {			// every column
					vL=[];
					// add all values of the current column to a list:
					for( var r=ws.firstCell.row,R=ws.lastCell.row+1;r<R;r++) {		// every line
						vL.push( ws.data[ colName(c)+r ])							
					};
					pC = addPropClass( c, vL );
//					console.debug( 'addPropClasses', vL, pC );
					if( pC ) { 
						cacheE( pCL, pC ); // add it to propertyClasses, avoid duplicates
						pCIdL.push( pC.id )  // add it to the resourceClass' propertyClasses
					}
				};
				return pCIdL;

				function addPropClass( cX, valL ) {	
					// Determine the data type of all values of the column starting with the second row (= second list entry).
					// If all are equal, the data type is assumed; by default it is 'TEXT'.
					// Some values may be null, i.e. no value.
						
						function compatibleClasses( a, b ) {
							return isDateTime(a) && isDateTime(b)
									|| isNumber(a) && isNumber(b)
									|| isBool(a) && isBool(b)
									// no need to compare strings, as this is the default
						}

					// the cell value in the first line is the title, either of a property or a statement:
					let ti = valL[0]?(valL[0].w || valL[0].v):i18n.MsgNoneSpecified,
						pC;
//					console.debug( 'addPropClass 1', ti );

					// Skip, if it is a statement title
					// (the check is done here - and not a level above - because here we know the title value):
					if( CONFIG.statementClasses.indexOf( ti )>-1 ) return;

					// else, it is a property:
					ti = vocabulary.property.specif( ti );  // translate the title to standard term
					
					// cycle through the list as long as one of the values is undefined/null OR both are equal,
					// start with the second line:
					for( var i=1, I=valL.length; i<I && ( !pC || !valL[i] || compatibleClasses( pC, valL[i] )); i++ ) {
						if( !pC && valL[i] 								// catch the first valid cell
							 || isInt(pC) && isReal(valL[i]) ) { 
								pC = valL[i] 							// take least restrictive number format
						};
//						console.debug('addPropClass 2',i,I,pC,valL[i])
					};
					// the loop has ended early, i.e. the types are not compatible for all lines>0:
					if( i<I || !pC )		return new PropClass( ws.name+cX, ti, 'Text' );
					// else, the types are equal for all lines>0:
				//	if( isXHTML(pC) ) 		return new PropClass( ws.name+cX, ti, 'FormattedText' );				
					if( isDateTime(pC) ) 	return new PropClass( ws.name+cX, ti, 'DateTime' );				
					if( isReal(pC) ) 		return new PropClass( ws.name+cX, ti, 'Real' );				
					if( isInt(pC) ) 		return new PropClass( ws.name+cX, ti, 'Integer' );				
					if( isBool(pC) ) 		return new PropClass( ws.name+cX, ti, 'Boolean' );	
					// by default:
					return new PropClass( ws.name+cX, ti, 'Text' )
				}
			}
			function addStaClasses( ws, sCL ) { 
				// build a list of statementClasses:
				var ti,sC;
				for( var c=ws.firstCell.col,C=ws.lastCell.col+1;c<C;c++ ) {			// every column
					ti = ws.data[ colName(c)+ws.firstCell.row ];  					// value of first line
					ti = ti.w || ti.v;
					// Add statementClass, if it is declared as such and if it is not yet listed:
					if( indexById(sCL,staClassId(ti))<0 && CONFIG.statementClasses.indexOf( ti )>-1 ) {
						sC = new StaClass( ti );
//						console.debug( 'addStaClasses', ti, sC );
						sCL.push( sC )
					}
				}
			}

		// Processing of transformSheet(idx):
//		console.debug( 'sheetName:', wb.SheetNames[idx] );
//		console.info('Creating types'); 
		
		var ws = {
			name: wb.SheetNames[idx],			// the name of the selected sheet (first has index '0'!)
			data: wb.Sheets[wb.SheetNames[idx]],
			// ToDo: Check if the type name does not yet exist. Should not occur as Excel does not allow equal sheet names in a file.
			hid: 'H-'+(pN+wb.SheetNames[idx]).simpleHash()	// the hierarchy ID of the folder carrying all resources of the selected sheet
		};
		ws.range = ws.data["!ref"]; 				// e.g. A1:C25
//		console.debug( 'sheet', ws );
		
		if( ws.range ) {							
			// only if the sheet has content:
			ws.resClassName = CONFIG.resClassXlsRow+' ('+ws.name+')';
			ws.firstCell = coord(ws.range.split(":")[0]);
			ws.lastCell = coord(ws.range.split(":")[1]);

			// 3.1 Create a resourceClass per XLS-sheet so that a resource can be created per XLS-row:
			var rC = new ResClass( ws.resClassName, self.resourceClass || CONFIG.resClassXlsRow );
			// Create a property class for each column using the names specified in line 1:
			rC.propertyClasses = addPropClasses( ws, specif.propertyClasses );
//			console.debug('rC',rC);
			specif.resourceClasses.push(rC);
			addStaClasses( ws, specif.statementClasses );
			
			// 3.2 Create a folder with the resources of this worksheet:
			createFld( ws )
		}
	}

	// Processing of xslx2specif:
//	console.info( 'js-xlsx version', XLSX.version );
	// Import an excel file:
	// - wb is the whole workbook, consisting of 1 to several worksheets
	// - ws is a worksheet
	let xDta = new Uint8Array(buf),
		wb = XLSX.read(xDta, {type:'array', cellDates:true, cellStyles:true}),	// the excel content, i.e. "workbook"
		wsCnt = wb.SheetNames.length;		// number of sheets in the workbook

	// Extract resourceClass in [square brackets] or (round brackets), if they are at the end of the filename,
	let resL = /\s*(?:\(|\[)([a-zA-Z0-9:_\-].+?)(?:\)|\])$/.exec( pN );
	if( Array.isArray(resL) && resL.length>1 ) self.resourceClass = resL[1];

	console.info( 'SheetNames: '+wb.SheetNames+' ('+wsCnt+')' );
//	console.debug('workbook',pN,wb,self.resourceClass);

	// Transform the worksheets to SpecIF:
	// 1 Create the project:
	var specif = new BaseTypes();
	specif.id = 'dummy';	// must be string to satisfy the schema
	specif.title = pN;
	specif.generator = "Excel";
	specif.$schema = 'https://specif.de/v1.0/schema.json'
	// the root folder resource:
	specif.resources = [{
		id: 'R-'+pN.toSpecifId(),
		title: pN,
		class: resClassId( CONFIG.resClassFolder ),
		changedAt: chAt
	}];
	specif.statements = [];

	// 2 Create the specification (hierarchy root) for the file:
	specif.hierarchies = [{
		id: 'H-'+pN.toSpecifId(),
		resource: 'R-'+pN.toSpecifId(),
		nodes: [],
		changedAt: chAt
	}];
	specif.changedAt = chAt;	

	// 3 Transform the xls data to SpecIF:
	for( var l=0; l<wsCnt; l++ )
		transformSheet(l);

//	console.info('SpecIF created from '+pN+' (Excel)');
	console.debug('SpecIF',specif);
	return specif
}	// end of xlsx2specif

});
