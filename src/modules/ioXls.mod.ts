/*!	iLaH: Excel (XLS) import 
	Dependencies: jQuery 3.0+, sheetjs
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de            
*/

// Constructor for XLS import:
// (A module constructor is needed, because there is an access to parent's data via 'self.parent...')
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

		// Remember the file modification date:
		if( f.lastModified ) {
			fDate = new Date(f.lastModified).toISOString()
		} else {
			if( f.lastModifiedDate )
				// this is deprecated, but at the time of coding Edge does not support 'lastModified', yet:
				fDate = new Date(f.lastModifiedDate).toISOString()
			else
				// Take the actual date as a final fall back.
				// Date() must get *no* parameter here; 
				// an undefined value causes an error and a null value brings the UNIX start date:
				fDate = new Date().toISOString()
		};
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
			this.dataTypes = [
				app.standardTypes.get("dataType","DT-ShortString"),
				app.standardTypes.get("dataType","DT-Text"),
				app.standardTypes.get("dataType","DT-DateTime"),
				app.standardTypes.get("dataType","DT-Boolean"),
				app.standardTypes.get("dataType","DT-Integer"),
				app.standardTypes.get("dataType","DT-Real")
			];	
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
		function dataTypeId( str ) { 
			// must be able to find it just knowing the ws-name and the column index:
			return 'DT-'+str.simpleHash()
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
		function cellName( col, row ) {
			return colName(col)+row
		}

	function collectMetaData(ws) {
		if( !ws ) return;
		switch( ws.name ) {
			// It is assumed that all lists of enumerated values are defined on a worksheet named:
			case "(Enumerations)":
				let c,r,cell,dT,pC;
				for( c=ws.firstCell.col; c<ws.lastCell.col+1; c++ ) {
					dT = { id: dataTypeId( ws.name+c ), type: "xs:enumeration", values: [], changedAt: chAt };
					pC = { id: propClassId( ws.name+c ), dataType: dT.id, changedAt: chAt };
					for( r=ws.firstCell.row; r<ws.lastCell.row+1; r++ ) {
						cell = ws.data[cellName(c,r)];
//						console.debug( 'cell',c,r,cell );
						if( r==ws.firstCell.row ) {
							// title in the first row;
							// if the title corresponds to the property (column) name of a worksheet with data,
							// this data column will assume the enumeration type:
							pC.title = dT.title = (cell&&cell.t=='s'? cell.v : '')
						} else {
							// enumerated values in the following rows:
							if( cell&&cell.t=='s'&&cell.v )
								dT.values.push({
									id: dT.id+'-'+r,
									value: cell.v
								})
						}
					};
					// Add dataType and propertyClass, if title and values are defined:
					if( dT.title && dT.values.length>0 ) {
						specif.dataTypes.push( dT );
						specif.propertyClasses.push( pC )
					}
				}
		}
	}

	function transformData(ws) {
		if( !ws ) return;

			function isDateTime( cell ) {
//				console.debug('isDateTime:',cell);
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
//				console.debug('isBool',cell);
				return cell && ( cell.t=='b' || typeof(cell.v)=='string' && ( cell.v.isTrue() || cell.v.isFalse() ) )
			}
			function isStr( cell ) {
				return cell && cell.t=='s'
			}
		/*	function isXHTML( cell ) {
				return cell && cell.t=='s' && ....
			}  */			
			function titleFromProps( res ) {
//				console.debug( 'titleFromProps', res );
				// get the title from the properties:
				if( res.properties ) {
					let a,A,pC;
					for( a=0,A=res.properties.length;a<A;a++ ) {
						pC = itemById( specif.propertyClasses, res.properties[a]['class'] );
						// in many cases, this is perhaps faster than the concatenation of the lists:
						if( pC
						&& (CONFIG.headingProperties.indexOf( pC.title )>-1
							|| CONFIG.titleProperties.indexOf( pC.title )>-1 
							|| CONFIG.idProperties.indexOf( pC.title )>-1 )) return res.properties[a].value.stripHTML()
					}
				};
				return ''
			}
			function createFld( sh ) {
				if( sh.lastCell.row-sh.firstCell.row<1 ) return;   // skip, if there are no resources

					function createR( ws, row ) {
						// create a resource:

							function getVal( dT, cell ) {
								// dT is the target dataType; 
								// it is the least restrictive type for all values in the column.
								// A single cell however, can have a more specific dataType.
								// Malicious content will be removed upon import.
//								console.debug( 'getVal', cell, dT );
								if( cell && dT ) 
									switch( dT.type ) {
										case 'xs:string':
										case 'xhtml':		
											switch( cell.t ) {
												case "s": 	return cell.v;
												case "d":	return cell.v.toISOString();
												case "n":	return cell.v.toString();
											}
										case 'xs:dateTime': return cell.v.toISOString();
										case 'xs:integer':
										case 'xs:double':	return cell.v.toString();
										// we have found earlier that it is a valid boolean, 
										// so all values not beeing true are false:
										case 'xs:boolean':	return cell.v.isTrue().toString()
										case 'xs:enumeration':
															let eV = itemBy( dT.values, 'value', cell.v );
															return (eV? eV.id : undefined )
									};
								return ''
							}

						var res = {
								// id will be set later on using the visibleId, if provided.
								// title will be set according to the properties, later on.
								class: resClassId( ws.resClassName ),
								properties: [],
								changedAt: chAt
							};

						let c, C, cell, val, rC, pC, dT, id, stL=[], ti, obL, oInner;
						for( c=ws.firstCell.col,C=ws.lastCell.col+1; c<C; c++ ) {	// an attribute per column ...
							cell = ws.data[cellName(c,row)];
//							console.debug('createR',c,cellName(c,row),cell);
							if( cell && cell.v!=undefined ) {									// ... if it has content
								rC = itemById( specif.resourceClasses, resClassId(ws.resClassName) );

								pC = itemById( specif.propertyClasses, propClassId(ws.name+c) );
//								console.debug('create p',c,cellName(c,row),cell,rC,pC);
								if( pC ) {
									// it is a property with other than enumerated dataType:
									dT = itemById(specif.dataTypes,pC.dataType);
									val = getVal( dT, cell );

									// Find the property value to be taken as resource identifier.
									// id is the first identifier found as declared in CONFIG.idProperties;
									// the first id value found will prevail:
									if( !id && CONFIG.idProperties.indexOf(pC.title)>-1 ) id = val;

									if( dT.maxLength && (dT.maxLength < val.length) ) {
										val = val.slice(0,dT.maxLength);
										console.warn('Text of cell '+cellName(c,row)+' on sheet '+sh.name+' has been truncated because it is too long')
									};
//									console.debug( 'other than enumerated dataType',cell,pC,dT,val,typeof(val) );
									// Inclule the property only if it has a significant value:
									if( val ) 
										res.properties.push({
											title: pC.title,	// needed for titleFromProps()
											class: pC.id,
											value: val
										})
								} else {
									ti = ws.data[cellName(c,ws.firstCell.row)].v;  // column title in the first line of the same column
									pC = itemByTitle( specif.propertyClasses, ti );
									if( pC ) {
										// it is a property with enumerated dataType; only a defined value will be used.
										// Thus, if a cell contains a value which is not listed in the type, it will be ignored:
										val = getVal( itemById(specif.dataTypes,pC.dataType), cell );
//										console.debug( 'enumerated dataType',cell,ti,pC,val,typeof(val) );
										if( val ) 
											res.properties.push({
												class: pC.id,
												value: val
											})
									} else {
										// it is a statement:
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
							
							// Build an id from the worksheet-name plus the value of the user-specified id attribute
							// or generate a new id, otherwise.
							// An id is needed to recognize the resource when updating.
							// So, if a resource has no id attribute, it gets a new id on every import
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
									// modify the id of any duplicate specified user-assigned id,
									// as an id must be unique, of course:
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

			function getPropClasses( ws, pCL ) { 
				// build a list of propertyClasses for the given worksheet;
				// a complete propertyClass is added to pCL per column which is not titled with a statement title
				// and a corresponding list of propertyClass ids is returned for the resourceClass.
				var pCs=[], // list of propertyClass ids found on this worksheet
					pC,dT,c,C,cell,ti;
				for( c=ws.firstCell.col,C=ws.lastCell.col+1;c<C;c++ ) {			// every column
					// Check whether it is an enumerated dataType:
					cell = ws.data[ cellName(c,ws.firstCell.row) ];
					ti = cell?(cell.v):'';
					if( ti ) {
						pC = itemByTitle( specif.propertyClasses, ti );
						if( pC&&pC.id ) {
							dT = itemById( specif.dataTypes, pC.dataType );
							if( dT && dT.type=="xs:enumeration" ) {
//								console.debug( 'enum found: ', cell, ti, pC );
								// The current column has an enumeration dataType;
								// use the corresponding propertyClass:
								pCs.push( pC.id );
								continue
							}
						}
					};
					// It is not an enumerated dataType, 
					// so we find out which dataType is appropriate:
					pC = getPropClass( c );
					if( pC ) { 
						cacheE( pCL, pC ); // add it to propertyClasses, avoid duplicates
						pCs.push( pC.id )  // add it to the resourceClass' propertyClasses
					}
				};
				return pCs;

				function getPropClass( cX ) {	
					// Determine the data type of all values of the column starting with the second row (= second list entry).
					// If all are equal, the data type is assumed; by default it is 'ShortString'.
					// Some cell values may be undefined.
					const defaultC = 'ShortString';
						
					// add all values of the current column to a list:
					let valL=[],r,R;
					for( r=ws.firstCell.row,R=ws.lastCell.row+1;r<R;r++) {		// every line
						valL.push( ws.data[ cellName(cX,r) ] )							
					};

					// the cell value in the first line is the title, either of a property or a statement:
					let ti = valL[0]?(valL[0].w || valL[0].v):i18n.MsgNoneSpecified,
						pC,nC,i;
//					console.debug( 'getPropClass 1', ti, valL );

					// Skip, if it is a statement title
					// (the check is done here - and not a level above - because here we know the title value):
					if( CONFIG.statementClasses.indexOf( ti )>-1 ) return;

					// else, it is a property:
					ti = vocabulary.property.specif( ti );  // translate the title to standard term
					
					// Cycle through all elements of the column and select the most restrictive type,
					// start with the last and stop with the second line:
					for( i=valL.length-1; i>0; i-- ) {
						nC = classOf(valL[i]);
//						console.debug('getPropClass 2',i,pC,valL[i],nC);
						if( !nC ) continue;
						if( !pC ) { pC = nC; continue };
						if( pC==nC ) continue;
						if( pC=='Real' && nC=='Integer' ) continue;
						if( pC=='Integer' && nC=='Real' ) { pC = 'Real'; continue };
						// else: the classes are not equal, take the least restrictive:
						pC = defaultC
					};
					// Assign a longer text field for descriptions:
					if( CONFIG.descProperties.indexOf( ti )>-1 ) pC = 'Text';

					// Assign a longer text field for columns with cells having a longer text:
					if( pC=='ShortString' ) {
						let maxL=0, multLines=false;
						// determine the max length of the column values and if there are multiple lines:
						for( i=valL.length-1; i>0; i-- ) {
							maxL = Math.max( maxL, valL[i]&&valL[i].v? valL[i].v.length : 0 );
							multLines = multLines || valL[i]&&typeof(valL[i].v)=='string'&&valL[i].v.indexOf('\n')>-1
						};
						// if so, choose a text property:
//						console.debug( 'getPropClass 3',maxL,multLines );
						if( maxL>CONFIG.textThreshold || multLines ) 
							pC = 'Text'
					};
//					console.debug( 'getPropClass 4',valL[i],pC );
					return new PropClass( ws.name+cX, ti, pC || defaultC );

						function classOf( cell ) {
							if( isBool(cell) ) return 'Boolean';
							if( isInt(cell) ) return 'Integer';
							if( isReal(cell) ) return 'Real';
							if( isDateTime(cell) ) return 'DateTime'
						//	if( isXHTML(cell) ) return 'FormattedText';
							if( isStr(cell) ) return defaultC
							// else return undefined
						}
				}
			}
			function getStaClasses( ws, sCL ) { 
				// build a list of statementClasses:
				var ti,sC;
				for( var c=ws.firstCell.col,C=ws.lastCell.col+1;c<C;c++ ) {			// every column
					ti = ws.data[ cellName(c,ws.firstCell.row) ];  					// value of first line
					ti = ti.w || ti.v;
					// Add statementClass, if it is declared as such and if it is not yet listed:
					if( indexById(sCL,staClassId(ti))<0 && CONFIG.statementClasses.indexOf( ti )>-1 ) {
						sC = new StaClass( ti );
//						console.debug( 'getStaClasses', ti, sC );
						sCL.push( sC )
					}
				}
			}

		// Processing of transformData(wsN):
//		console.debug( 'sheetName:', ws.name );

		// Skip all bracketed sheetnames, e.g. "(Enumerations)" or "(Setup)":
		if( ws.name.indexOf("(")==0 && ws.name.indexOf(")")==ws.name.length-1 ) return;
		
		if( ws.range ) {							
			// only if the sheet has content:
			ws.resClassName = CONFIG.resClassXlsRow+' ('+ws.name+')';

			// 3.1 Create a resourceClass per XLS-sheet so that a resource can be created per XLS-row:
			var rC = new ResClass( ws.resClassName, self.resourceClass || CONFIG.resClassXlsRow );
			// Create a property class for each column using the names specified in line 1:
			rC.propertyClasses = getPropClasses( ws, specif.propertyClasses );
//			console.debug('rC',rC);
			specif.resourceClasses.push(rC);
			getStaClasses( ws, specif.statementClasses );
			
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

	// Extract resourceClass in [square brackets] or (round brackets), 
	// if they are at the end of the filename:
	let resL = /\s*(?:\(|\[)([a-zA-Z0-9:_\-].+?)(?:\)|\])$/.exec( pN );
	if( Array.isArray(resL) && resL.length>1 ) self.resourceClass = resL[1];

	console.info( 'SheetNames: '+wb.SheetNames+' ('+wsCnt+')' );
//	console.debug('workbook',pN,wb,self.resourceClass);

	// Transform the worksheets to SpecIF:
	// 1. Create the project:
	var specif = new BaseTypes();
	specif.id = 'XLS-'+pN.toSpecifId();
	specif.title = pN;
	specif.generator = "xslx2specif";
	specif.$schema = 'https://specif.de/v1.0/schema.json'
	// the root folder resource:
	specif.resources = [{
		id: 'R-'+pN.toSpecifId(),
		title: pN,
		class: resClassId( CONFIG.resClassFolder ),
		changedAt: chAt
	}];
	specif.statements = [];

	// 2. Create the specification (hierarchy root) for the file:
	specif.hierarchies = [{
		id: 'H-'+pN.toSpecifId(),
		resource: 'R-'+pN.toSpecifId(),
		nodes: [],
		changedAt: chAt
	}];
	specif.changedAt = chAt;	

	let idx;
	// 3. Collect meta-data such as enumerated types 
	//    in a first pass through all worksheets,
	//    as worksheets with meta-data can be at any position:
	for( idx=0; idx<wsCnt; idx++ )
		collectMetaData( worksheet( wb.SheetNames[idx] ) );

	// 4. In a second pass, transform the xls data to SpecIF:
	for( idx=0; idx<wsCnt; idx++ )
		transformData( worksheet( wb.SheetNames[idx] ) );

//	console.info('SpecIF created from '+pN+' (Excel)');
	console.debug('SpecIF',specif);
	return specif

		function worksheet(wsN) {
			var ws = {
				name: wsN,			// the name of the selected sheet (first has index '0'!)
				data: wb.Sheets[wsN],
				// ToDo: Check if the type name does not yet exist. Should not occur as Excel does not allow equal sheet names in a file.
				hid: 'H-'+(pN+wsN).simpleHash()	// the hierarchy ID of the folder carrying all resources of the selected sheet
			};
			ws.range = ws.data["!ref"]; 	// e.g. A1:C25
			if( ws.range ) {							
				// only if the sheet has content:
				ws.firstCell = coord(ws.range.split(":")[0]);
				ws.lastCell = coord(ws.range.split(":")[1]);
				return ws
			}
		}
}	// end of xlsx2specif

});
