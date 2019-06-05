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
/*	modeCre = {
		id: 'create',
		title: 'Create a new project with the given id',
		description: "The entities ('resources') will be created as specified in a folder per worksheet."
	};
*/	// the modes for selection when an import is encountered which is already loaded:
	var	modes = [{
			id: 'update',
			title: "Update changed entities of a project with the same name. All entities (worksheet lines) must have an 'id' property with a unique value; otherwise a new instance of the entity will be created.",
			description: "New entities ('resources') will be created, modified ones will be superseded and the hierarchy will be replaced."
		},{
			id: 'replace',
			title: 'Replace the project with the same name',
			description: 'Existing content will be lost.'
		},{
			id: 'clone',
			title: 'Create a new instance of the project with a new id',
			description: 'There will be two projects with the existing and the new content.'
		}],
		mode = null,		// selected mode (how to import)
		fDate = null,		// the file modification date
		data = null,		// the SpecIF data structure for xls content
		xDO = null;
		
	self.init = function() {
		return true
	};

	self.verify = function( f ) {
//		console.debug( 'file', f.name );

			function isXls( fname ) {
				return fname.endsWith('.xlsx') || fname.endsWith('.xls') || fname.endsWith('.csv') 
			}
				
		if ( !isXls(f.name) ) {
			message.show( i18n.phrase('ErrInvalidFileXls', f.name) );
			return null
		};
//		console.debug( 'file', f );
		if( f.lastModified ) {
			fDate = new Date(f.lastModified);
			fDate = fDate.toISOString();
//			console.debug( 'file.lastModified', fDate )
			return f
		};
		if( f.lastModifiedDate ) {
			// this is deprecated, but at the time of coding, Edge does not support the above, yet:
			fDate = new Date(f.lastModifiedDate);
			fDate = fDate.toISOString();
//			console.debug( 'file.lastModifiedDate', fDate )
			return f
		};
		// take the actual date as a final fall back
		fDate = new Date();
		fDate = fDate.toISOString();
//		console.debug( 'date', fDate );
		return f
	};
	self.toSpecif = function( buf ) {
		// import an Excel file from a buffer:
		self.abortFlag = false;
		xDO = $.Deferred();
		
		xDO.notify('Transforming Excel to SpecIF',10); 
//		console.debug('input.prjName', self.parent.projectName );
		data = xslx2specif( buf, self.parent.projectName , fDate );
		xDO.resolve( data );

		return xDO
	};
	self.abort = function() {
		myProject.abort();
		self.abortFlag = true
	};
	return self

function xslx2specif( buf, pN, chgAt ) {
	"use strict";
	// requires sheetjs

		function BaseTypes() {
			this.dataTypes = [{
				id: 'DT-Text-8192',
				title: 'Text',  		// dataType for XLS columns with text content
				description: "String with length 8192",
				maxLength: 8192,
				type: "xs:string",
				changedAt: chgAt
			},{ 
				id: 'DT-Date-time',
				title: 'ISO Date-time',	// dataType for XLS columns with date-time content
				description: "Date or Timestamp in ISO-Format",
				type: 'xs:dateTime',
				changedAt: chgAt
			},{ 
				id: 'DT-Boolean',
				title: 'Boolean',  		// dataType for XLS columns with boolean content
				description: "Boolean value",
				type: 'xs:boolean',
				changedAt: chgAt
			},{ 
				id: 'DT-Integer',
				title: 'Integer',  		// dataType for XLS columns with integer content
				description: "Integer value",
				min: CONFIG.minInteger,
				max: CONFIG.maxInteger,
				type: 'xs:integer',
				changedAt: chgAt
			},{ 
				id: 'DT-Real',
				title: 'Real',  		// dataType for XLS columns with real content
				description: "Real value",
				min: CONFIG.minReal,
				max: CONFIG.maxReal,
				accuracy: CONFIG.maxAccuracy,
				type: 'xs:double',
				changedAt: chgAt
			},{	
				id: 'DT-Title-string',
				title: 'Title String',	// dataType for resource titles
				description: "String type with length 96",
				maxLength: CONFIG.textThreshold,
				type: "xs:string",
				changedAt: chgAt
			}];	
			this.resourceClasses = [{	
				id: resTypeId( CONFIG.objTypeFolder ),
				title: CONFIG.objTypeFolder,			// specType for folders (e.g. representing sheets) 
				description: 'Resource type for folders',
				instantiation: ["auto","user"],
				propertyClasses: [{
					id: 'PT-'+(CONFIG.objTypeFolder).toSpecifId()+'-title',
					title: CONFIG.attrTypeTitle,
					description: 'Folder title',
					dataType: 'DT-Title-string',
					changedAt: chgAt
				}],
				changedAt: chgAt
			}];
			this.statementClasses = [];
			this.hierarchyClasses = [{	
				id: 'HT-'+CONFIG.spcTypeOutline.toSpecifId(),
				title: CONFIG.spcTypeOutline,			// specType for folders (e.g. representing sheets) 
				description: 'Hierarchy type for outlines',
				instantiation: ["auto","user"],
				changedAt: chgAt
			}]
		}
		function ResType( lN ) { 
			this.id = resTypeId( lN );
			this.title = lN;
			this.description = 'For resources specified per line of an excel sheet';
			this.instantiation = ["auto","user"];
			this.propertyClasses = [];
			this.changedAt = chgAt
		}
		function resTypeId( lN ) { 
			return 'RT-'+lN.toSpecifId()
		}
		function PropType( ws, lN, dT ) { 
			this.id = 'PT-'+(ws+lN+dT).simpleHash();
			this.title = lN;
			this.dataType = 'DT-'+dT;		// like baseTypes[i].id
			this.changedAt = chgAt
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
				// get the column name from an index: 4 becomes 'D', 27 becomes 'AA'
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
	//			console.debug('cell:',cell);
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
						return obj.properties[ti].value.stripHTML().trim()
					};
					// 2. otherwise, find a description and take the beginning:
					// find a description and take the beginning:
					for( var a=0,A=obj.properties.length;a<A;a++ ) {
						if( CONFIG.descProperties.indexOf( obj.properties[a].title )>-1 ) 
							return obj.properties[a].value.stripHTML().truncate( CONFIG.maxTitleLength )
					}
				};
				return ''
			}
			function createFld( sh ) {
				if( sh.lastCell.row-sh.firstCell.row<1 ) return;   // skip, if there are no resources

/*					function isoOf( xlsDate ) {
						// https://gist.github.com/christopherscott/2782634
						let d = new Date((parseFloat(xlsDate) - 25567 - 2)*86400*1000);
						d = d.toISOString();
						// omit the time, if it is 00:00:00, i.e. if the dateTime value is an integer:
						return ( Number.isInteger(parseFloat(xlsDate))?d.substr(0,10):d )
					}
*/					function getVal( dT, cell ) {
						if( !cell ) return '';
//						console.debug( 'getVal', cell, dT );
						switch( dT ) {
							case 'xs:dateTime': return cell.v.toISOString();
							case 'xs:integer':
							case 'xs:double':	return cell.v.toString();
							case 'xs:string':
							case 'xhtml':		return noCode(cell.v);
							// we have found earlier that it is a valid boolean, so all values not beeing true are false:
							case 'xs:boolean':	return cell.v.isTrue().toString()  
						};
						return ''
					}
					function createRes( ws, l ) {
						var res = {
//								title: 'XLS Line',   // ... title will be set according to the properties, later on.
								class: resTypeId( ws.resTypeName ),
								properties: [],
								changedAt: chgAt
							};
						let cell=null, aT=null, dT=null, id=null;
						for( var c=ws.firstCell.col,C=ws.lastCell.col+1;c<C;c++) {		// an attribute per column ...
							cell = ws.data[colName(c)+l];
							if( cell ) {												// ... if it has content
								aT = itemById(specif.resourceClasses,resTypeId( ws.resTypeName )).propertyClasses[c-1];		// types begin with index 0
								dT = itemById(specif.dataTypes,aT.dataType);

								// Find the value to be taken as resource identifier:
								// id is the first identifier found as declared in CONFIG.idProperties:
//								id = id || CONFIG.idProperties.indexOf(aT.title)<0?null:getVal( dT.type, cell );  // does not work for some reason.
								if( !id ) id = CONFIG.idProperties.indexOf(aT.title)<0?null:getVal( dT.type, cell );
								// ToDo: Consider whether it is better to select the id property beforehand and not over and over again for every resource.

//								console.debug( 'createRes-cell', ws.resTypeName, aT, dT, cell, getVal( dT.type, cell) );
								res.properties.push({
									title: aT.title,
									class: aT.id,
									value: getVal( dT.type, cell )
								})
							}
						};
						if( res.properties.length>0 ) {
							// Build an id from the worksheet-name plus the value of the declared id attribute
							// or generate a new id, otherwise.
							// An id is needed to recognize the resource when updating.
							// So, if a resource has no id attribute, it gets a new id 
							// and consequently a new resource will be created instead of updating the existing.
							// The constraint check will detect repeated (non-unique) ids.
							// ToDo: Prevent the use of duplicate ids right here.
							res.id = id?'R-'+(ws.name+id).simpleHash():genID('R-');
							res.title = titleFromProps( res );
//							console.debug('xls-resource',res);
							// add the hierarchy entry to the tree:
							hTree.nodes.push({ 
								id: 'N-'+(res.id+hTree.nodes.length).simpleHash(),
								resource: res.id,
								changedAt: chgAt
							}); 
							// add the resource to the list:
							specif.resources.push(res)
						}
					}
		
				// Processing of createFld:
				// Create folder resource:
				var fld = {
						id: 'F-'+(sh.name+CONFIG.objTypeFolder).simpleHash(),
						title: sh.name,
						class: resTypeId( CONFIG.objTypeFolder ),
						properties: [{
							title: CONFIG.attrTypeTitle,
							class: 'PT-'+(CONFIG.objTypeFolder).toSpecifId()+'-title',
							value: sh.name
						}],
						changedAt: chgAt
					};
//				console.debug( 'createFld:', fld );
				specif.resources.push( fld );

				// Create the hierarchy entry for the folder containing all resources of the current worksheet:
				var hTree = { 
					id: sh.hid, 
					resource: fld.id,
					nodes: [],
					changedAt: chgAt
				}; 
					
				// Create the resources:
				for( var l=sh.firstCell.row+1,L=sh.lastCell.row+1;l<L;l++) {	// every line except the first carrying the attribute names
//					console.debug('resource', l, sh );
					createRes( sh, l )
				};
				// add the hierarchy tree:
				specif.hierarchies[0].nodes.push( hTree )
			}

			function getPropType( col ) {	
				// Determine the data type of all values of the column starting with the second row (= second list entry).
				// If all are equal, the data type is assumed; by default it is 'TEXT'.
				// Some values may be null, i.e. no value.
					
					function compatibleTypes( a, b ) {
						var e =	isDateTime(a) && isDateTime(b)
								|| isNumber(a) && isNumber(b)
								|| isBool(a) && isBool(b);
								// no need to compare strings, as this is the default
//						console.debug('compatibleTypes',a,b,e)
						return e
					}
				
				let ti = col[0]?(col[0].w || col[0].v):i18n.MsgNoneSpecified,		// the cell value in the first line is the property title
					aT=null;
//				console.debug( 'getPropType 1', ti );
				// cycle through the list as long as one of the values is undefined/null OR both are equal:
				for( var i=1, I=col.length; i<I && ( !aT || !col[i] || compatibleTypes( aT, col[i] )); i++ ) {
					if( !aT && col[i] 								// catch the first valid cell
						 || isInt(aT) && isReal(col[i]) ) { 
							aT = col[i] 							// take least restrictive number format
					};
//					console.debug('getPropType 2',i,I,aT,col[i])
				};
				// the loop has ended early, i.e. the types are not compatible for all lines>0:
				if( i<I || !aT )		return new PropType( ws.name, ti, 'Text-8192' );
				// else, the types are equal for all lines>0:
//				if( isXHTML(aT) ) 		return new PropType( ws.name, ti, 'XLS Formatted Text' );				
				if( isDateTime(aT) ) 	return new PropType( ws.name, ti, 'Date-time' );				
				if( isReal(aT) ) 		return new PropType( ws.name, ti, 'Real' );				
				if( isInt(aT) ) 		return new PropType( ws.name, ti, 'Integer' );				
				if( isBool(aT) ) 		return new PropType( ws.name, ti, 'Boolean' );	
				// per default:
				return new PropType( ws.name, ti, 'Text-8192' )
			}
			function getPropTypes( ws ) { 
				// build a list of types; default is "TEXT"
				var types=[],col=null,aT=null;
				for( var c=ws.firstCell.col,C=ws.lastCell.col+1;c<C;c++ ) {			// every column
					col=[];
					// add all values of the current column to a list:
					for( var r=ws.firstCell.row,R=ws.lastCell.row+1;r<R;r++) {		// every line
						col.push( ws.data[ colName(c)+r ])							
					};
//					console.debug( 'col', col );
					types.push( getPropType( col ) )
				};
//				console.debug( 'types', types );
				return types
			}

		// Processing of transformSheet(idx):
//		console.debug( 'sheetName:', wb.SheetNames[idx] );
//		console.info('Creating types'); 
		
		var ws = {
			name: wb.SheetNames[idx],			// the name of the selected sheet (first has index '0'!)
			data: wb.Sheets[wb.SheetNames[idx]],
			// ToDo: Check if the type name does not yet exist. Should not occur as Excel does not allow equal sheet names in a file.
			hid: 'H-'+wb.SheetNames[idx].simpleHash()	// the hierarchy ID of the folder carrying all resources of the selected sheet
		};
		ws.range = ws.data["!ref"]; 				// e.g. A1:C25
//		console.debug( 'sheet', ws );
		
		if( ws.range ) {							
			// only if the sheet has content:
			ws.resTypeName = CONFIG.objTypeXlsRow+' ('+ws.name+')';
			ws.firstCell = coord(ws.range.split(":")[0]);
			ws.lastCell = coord(ws.range.split(":")[1]);

			// 3.1 Create a resourceType per XLS-sheet so that a resource can be created per XLS-row:
			var ot = new ResType( ws.resTypeName );
			// Create a property class for each column using the names specified in line 1:
			ot.propertyClasses = getPropTypes( ws );
//			console.debug('ot',ot);
			specif.resourceClasses.push(ot);
			
			// 3.2 Create a folder with the resources of this XLS-sheet:
			createFld( ws )
		}
	}

	// Processing of xslx2specif:
//	console.info( 'js-xlsx version', XLSX.version );
	// Import an excel file:
	let xDta = new Uint8Array(buf);
    var wb = XLSX.read(xDta, {type:'array', cellDates:true, cellStyles:true});	// the excel content, i.e. "workbook"
//	let wb = XLSX.read(buf, {type: 'binary', cellDates:true, cellStyles:true}); // the excel content, i.e. "workbook"
	let wsCnt = wb.SheetNames.length;		// number of sheets in the workbook
	console.info( 'SheetNames: '+wb.SheetNames+' ('+wsCnt+')' );

	// Transform the worksheets to SpecIF:
	// 1 Create the project:
	var specif = new BaseTypes;
	specif.id = 'dummy';	// must be string to satisfy the schema
	specif.title = pN;
	specif.generator = "Excel";
	specif.specifVersion = '0.10.4';
	specif.resources = [];
	specif.statements = [];

	// 2 Create the specification (hierarchy root) for the file:
	specif.hierarchies = [{
		id: 'H-'+pN.toSpecifId(),
		title: pN,
		class: 'HT-'+CONFIG.spcTypeOutline.toSpecifId(),
		nodes: [],
		changedAt: chgAt
	}];
	specif.changedAt = chgAt;	

	// 3 Transform the xls data to SpecIF:
	for( var l=0; l<wsCnt; l++ )
		transformSheet(l);

//	console.info('SpecIF created');
//	console.debug('SpecIF',specif);
	return specif
}	// end of xlsx2specif

});
