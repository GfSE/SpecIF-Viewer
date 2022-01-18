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
}, function (self: IModule) {
	"use strict";
	// the mode for creating a new project:
	var fDate: string;		// the file modification date
		
	self.init = function():boolean {
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
		return true;
	};
	self.toSpecif = function (buf: ArrayBuffer):JQueryDeferred<SpecIF> {
		// import an Excel file from a buffer:
		self.abortFlag = false;
		var xDO = $.Deferred();
		
		xDO.notify('Transforming Excel to SpecIF',10); 
		// Transform the XLSX-data to SpecIF:
		let data = xslx2specif(buf, self.parent.projectName, fDate);
		xDO.resolve( data );

		return xDO
	};
	self.toXls = function (pr: SpecIF, options: any):void {
		console.debug('toXls', pr);
		options.done();
		specif2xlsx (pr);
	}; 
	self.abort = function():void {
		app.cache.abort();
		self.abortFlag = true
	};
	return self;


function specif2xlsx (pr: SpecIF)
{   
	// arrays live as long specif2xlsx runs
	var topLinePclassIds: string[]=[];
	var topLineTitles: string[]=[];
	var lineItems: string [];
	var aoaArray= [];
	var hierarchyLevel = 0;
    var orderNo: number []= [0,0,0,0,0,0,0];
		
	var nodes  =  [] ;
	var hierLevel = [];
	var wb = XLSX.utils.book_new(); // Create Workbook
	var ws = XLSX.utils.aoa_to_sheet([]);
	var resFile: Resource	;
	
	function buildTopline ()
	{
	// Create Workbook and Build topline from all Property Classes plus OrderNo
			
		resFile  = itemById (pr.resources, pr.hierarchies[0].resource as string);
		
		wb = XLSX.utils.book_new(); // Create Workbook
		ws = XLSX.utils.aoa_to_sheet([]);		
		wb.Props = 
		{
			Title:    resFile.title + 'complete.xlsx',
			Subject: "Export SpecIF to XLSX Format",
			Author:  "Winfried Reichardt"
		}
		// console.debug ( "TopLineTitleIds ", pr.propertyClasses.length, pr.propertyClasses[0], topLinePclassIds, topLineTitles );	
	    topLinePclassIds  = [] ; // empty public arrays 
		topLineTitles = [];
		aoaArray = [["OrderNo","OrderString","ResourceId","ResClass"],[]]; // Make it 2 Dimensional for XLSX.utils.sheet_add_aoa
		
		for (let i = 0 ; i< pr.propertyClasses.length; i++)  //copy property Class ID strings
		{	
			topLinePclassIds.push( pr.propertyClasses[i].id as string);
			console.debug ( "Propertyclasses", topLinePclassIds);
			topLineTitles.push ( pr.propertyClasses[i].title as string);
			aoaArray[0].push ( pr.propertyClasses[i].title as string);
		};
		//console.debug ( "buildToplines ", topLinePclassIds, topLineTitles,aoaArray );	
		XLSX.utils.sheet_add_aoa(ws, aoaArray,{origin: 0}); // add as topline of Worksheet
	
	} // end function buildTopline	
	

	function iterateHierarchy ()
	{
	Lib.iterateNodes(
		pr.hierarchies,
		// continue searching until found:
		(nd: SpecifNode) => {
			console.debug ("for each node ", nd.id , nd.resource)
			
			return true;  // continue searching
		},
		(ndL: SpecifNode) => {
			console.debug ("branch end ", ndL.id , ndL.resource)
			
			return true;  // continue searching
		}
		// no list function
	)
	}// end function IterateHierarchy

//--------------------------
	
	function fillWsFromResource (pr : SpecIF, ws : any, resId : string, line : number )
    {
		
		var i =0, j=0;   	
		//console.debug ( "fillWsFromResource line ", resId);             
		var res : Resource = itemById( pr.resources, resId as string );// the resource referenced by this node
		let resIdx = indexById (pr.resources, resId as string); // Index id	
		//console.debug ( "fillWsFromResoure ", res.title, " Index ", resIdx , resId, res.class, line );
		lineItems = []; //clear line
		if (line == 0) // if firstline, also write topline of XlsWorksheet
		{
			
			// Build lineArray and fill according to fields IDs in ResourceClass
			topLinePclassIds  = [] ; // empty arrays 
			topLineTitles = []; 
			var pClassItem : PropertyClass;
				
				let hRC3 = itemById( pr.resourceClasses, res.class as string );
				//console.debug ( "ResourceClass ",res.id, res.class, hRC3 );
				for (i = 0 ; i< hRC3.propertyClasses.length; i++)  //copy property Class ID strings
				{	
					topLinePclassIds[i] = hRC3.propertyClasses[i];
				    console.debug ( "Propertyclasses", topLinePclassIds[i]);
				
					pClassItem = itemById( pr.propertyClasses, topLinePclassIds[i] );
					topLineTitles[i] = pClassItem.title as string;
					
				};
				// console.debug ( "TopLineTitleIds ", topLinePclassIds, topLineTitles );
				
				
				for (i=0;i<topLineTitles.length;i++){
					aoaArray [0].push(topLineTitles[i]);
				}
				//console.debug("fillWsTopline aoaArray", aoaArray);
				
				XLSX.utils.sheet_add_aoa(ws, aoaArray,{origin: 0});  //Shall be written as Top Line
				aoaArray = [[''],[]]; // Clear and make it 2 Dimensional for XLSX.utils.sheet_add_aoa
				// console.debug ("res.properties.len", res.properties.length, topLinePclassIds);
		}; // end of line==0: Only build topline once at the beginning of each Excel Worksheet
					
		// Fill line Array	
			
		// console.debug ("res.properties.len", res.properties.length, topLinePclassIds.length);
		for (i=0;i<res.properties.length;i++)
		{
			var writeIdx = topLinePclassIds.indexOf (res.properties[i].class as string );
			// console.debug ("resProp.class",writeIdx, res.properties[i].class,topLinePclassIds.length );
			// console.debug ("resProp.class",writeIdx, res.properties[i].class,topLinePclassIds.length, res.properties[i].value);
			if (writeIdx < topLinePclassIds.length) // Index is within bounds
			{
				lineItems[writeIdx]=res.properties[i].value as string;
				
				// Replace Enumeration ID with Datatype Enumeration Value
	        
				let propertyClass = itemById (pr.propertyClasses, res.properties[i].class as string);
				// console.debug ("propertyClass  ", propertyClass, propertyClass.dataType);
				if (propertyClass != undefined) 
				{
					let DTItem = itemById( pr.dataTypes, propertyClass.dataType);
		    
					// console.debug ("DTItem ", res.properties[i].value, DTItem);
					if (DTItem.values != undefined) 
					{
						// Find the Enum Value for Enum ID
						for (j=0; j< DTItem.values.length; j++)
						{
							// console.debug ( "for loop datatype Values ", res.properties[i].value, DTItem.values[j].id);
							if (res.properties[i].value == DTItem.values[j].id)
							{
								// console.debug ( "Datatype Values ", DTItem.values[j].value, j , DTItem.values, writeIdx);
								lineItems [writeIdx]= DTItem.values[j].value; // Write Enum Value
							}
							else
							{
								// console.debug ( "Datatype Values not eq ", res.properties[i].value , DTItem.values[j].id, j , DTItem.values);
							};
						}; // end for j
							
						let enumIdx = indexById (DTItem.values, res.properties[i].value as string);
						//console.debug ( "Enum Value ", DTItem.values, DTItem.values[enumIdx].value, res.properties[i].value , enumIdx);
										
					}; //end ifDTItem.values
				}; // end propertyClass defined
			} // index within boundws
			else
			{
				//console.debug ( "PropertyClassID not found " );
			};
			
			//console.debug ( "LineItems", lineItems );
		};	// end for i 
		
		for (i=0;i<lineItems.length;i++)
		{
			aoaArray [0].push(lineItems[i]);
		};
		
		XLSX.utils.sheet_add_aoa(ws, aoaArray,{origin: -1}); // add a line at the end
		// console.debug ("Append intern WS", ws, aoaArray );
	
    }; // end function fillWsFromResoure
	
	
	function traverseTree ()
	{
	// Function to traverse tree without recursion
	// for all  nodes in tree
	// function traverse_tree(root)
	// Push the current node onto the stack
		
		var hLevelOld = hierarchyLevel;
		var hLevelMax = hierarchyLevel;
		
		// Stack to store the nodes
		// root.orderNo = orderNo;
		nodes.push(pr.hierarchies[0]);
		hierLevel.push (hierarchyLevel);
	
		// Loop while the stack is not empty
		while (nodes.length != 0)
		{
			// Store the current node and pop
			// it from the stack
			
			var curr  = nodes.pop();
			//console.debug ("nodespop ", curr);
			var currHierLevel= hierLevel.pop();
			// Current node has been traversed
			if (curr != null)
			{
				hierarchyLevel = currHierLevel;
				orderNo [hierarchyLevel]++;
				// console.debug("current node", currHierLevel , curr.id, curr.resource,orderNo ,hLevelOld);
				if (hLevelOld > hierarchyLevel)
				{  // hierarchy Level became smaller, set lower numbers to 0
					for (i=hierarchyLevel+1;i<orderNo.length;i++)
					{
						orderNo [i]=0;
					}
					
				}
				hLevelOld=hierarchyLevel;
				let resourceFound = itemById( pr.resources, curr.resource );
				let orderNumber = 0; 
				let j = 1;
				for (i=orderNo.length-1;i>0;i--)
				{
					orderNumber = orderNumber + orderNo[i]*j; // build a sortable Number
					j=j*100;
				}
				let orderString2 = orderNo.toString ();
				// console.debug ("outp",orderNumber, orderString2, resourceFound.title, resourceFound.class); 
				// Init aoaArray and push OrderNo, re-use aoaArray from fillWsFromResource
				aoaArray = [[orderNumber,orderString2,resourceFound.id,resourceFound.class],[]]; // Make it 2 Dimensional for XLSX.utils.sheet_add_aoa

				fillWsFromResource (pr,ws, resourceFound.id as string , 2 ); // only resourceFound may be necessary ?
				
				if (curr.nodes != undefined)
				{ // further subnodes exist
				
					//console.debug("hcLevel ", curr.id, curr.nodes.length, hierarchyLevel, hLevelOld);
					
					// Store all the children of
					// current node from right to left.
					for(var i = curr.nodes.length - 1;i >= 0; i--)
					{  // for
						if (i == curr.nodes.length - 1) // increase hierarchyLevel at beginning of loop
						{
							hierarchyLevel++;
							if (hierarchyLevel>hLevelMax)
							{
								hLevelMax = hierarchyLevel; // remember highest Level
							}
						}
									
						//console.debug ("push ",curr.nodes[i].id, curr.nodes[i]);				
						nodes.push(curr.nodes[i]);
						//console.debug ("nodes ", nodes);
						hierLevel.push (hierarchyLevel);
						
					} // end for
				} // end further subnodes exist
			}
		}
		//console.debug ("hierarchy max ",hLevelMax);
		XLSX.utils.book_append_sheet(wb, ws, "resourcesCompleteTable"); //append worksheet to Workbook
	} // end function traverseTree
	
    function exportEnumerations()
	{
		// write Worksheet (Enumerations)
		ws = XLSX.utils.aoa_to_sheet([]); // empty Worksheet
		// Clear and make 2 Dimensional for XLSX.utils.sheet_add_aoa
		
		var aoaArray1 = new Array();

        for ( let i = 0; i < pr.dataTypes.length; i++) 
		{
            aoaArray1[i] = new Array();
            for (let j = 0; j < 12; j++)
			{
                   aoaArray1[i][j] = '';
            }
        }
		
		let columnNo = undefined;
		//let i : number , n: number= 0; 
		for (let i=0; i< pr.dataTypes.length;i++)
		{
		//For all  dataTypes  with have values defined
			
			// console.debug ("dataType enum ", i, pr.dataTypes[i].values, pr.dataTypes[i].title );
			if ( pr.dataTypes[i].values != undefined)
			{
				// If first entry found i.e. Column-No == Undefined then
				if (columnNo == undefined)
				{
				
				// Create Worksheet "(Enumerations)"
				columnNo = 0;
				
				}; // end first entry and columnNo undefined
				//write title (Column-No)
				// console.debug ("datatype val",pr.dataTypes[i].values.length, pr.dataTypes[i].values[0].value )
				aoaArray1 [0][columnNo]=(pr.dataTypes[i].title);
				//write all Values (Column-No)
				for (let n=0; n< pr.dataTypes[i].values.length;n++)
				{ 
					// console.debug ("dataType values ", n , pr.dataTypes[i].values[n].value, aoaArray);
					aoaArray1 [n+1][columnNo]=(pr.dataTypes[i].values[n].value);
				}; // end for n 
				// console.debug ("dataType values1 ", n , pr.dataTypes[i].values[0].value, pr.dataTypes[i].title );
				
				//Increment Column-No 
				columnNo++;
			} ; // end dataTypes have values defined
		};//End For all dataTypes
		// console.debug (" enumerations found",columnNo, );
		if (columnNo != undefined)
		{   // append worksheet only, if there were datatypes with values defined
			XLSX.utils.sheet_add_aoa(ws, aoaArray1); // add whole content of page to worksheet
			//console.debug("Enums",aoaArray1);
			XLSX.utils.book_append_sheet(wb, ws, "(Enumerations)"); //append worksheet to Workbook
			//console.debug("Enums ws",wb,ws);
		};
	} // end function exportEnumerations		
	
	function exportHierXls ()
	{
		pr.hierarchies.forEach( function(h) {  //assume, that there is always at least one hierarchie
			
			resFile = itemById (pr.resources, h.resource as string);
			let xlsFileName = resFile.title;
			wb = XLSX.utils.book_new();  // Create Workbook
			ws = XLSX.utils.aoa_to_sheet([]);		

				wb.Props = {
					Title:    resFile.title + 'xlsx',
					Subject: "Export SpecIF to XLSX Format",
					Author:  "Winfried Reichardt"
				}
				// console.debug ("Workbook created " +resFile.title + 'xlsx');
	
			//console.debug ("Workbook ",xlsFileName + '.xlsx'); // hier nur Workbookname !!
			if (h.nodes != null) { // if h.nodes exist
				h.nodes.forEach (function (h1) 
				{  // h.nodes for each XLSX Workbook
					var xlsLine = 0;
					var resid1  = h1.resource;
					let hR1 = itemById( pr.resources, resid1 as string );// the resource referenced by this node
					// let iR1 = indexById (pr.resources, resid1 as string); // Index id		
					// console.debug ( "Workbook1 ", hR1.title +'.xlsx', " WBIndex1 ", iR1 , hR1.id,  );	// resource id and title
					wb = XLSX.utils.book_new(); // Create Workbook
					
					wb.Props = {
						Title:    hR1.title + 'xlsx',
						Subject: "Export SpecIF to XLSX Format",
						Author:  "Winfried Reichardt"
						
					};
					console.debug ("Workbook created " +hR1.title + 'xlsx');
					
					if (h1.nodes != null) { // check, whether h1.nodes exists
						
						h1.nodes.forEach (function (h2)
						{	// for each Worksheet 
							ws = XLSX.utils.aoa_to_sheet([]); // empty Worksheet	
	
							var resid2  = h2.resource;
							let hR2 = itemById( pr.resources, resid2 as string );// the resource referenced by this node
							let iR2 = indexById (pr.resources, resid2 as string); // Index id		
							//console.debug ( hR2, iR2 , hR2.id, hR2.title );	// resource id and sheetname
						
							console.debug ( "Worksheet ", hR2.title, " WsIndex ", iR2 , hR2.id,  );	// resource id and title
							
							if (  h2.nodes != null ) 
							{ // check, if h2.nodes exists
								//h2.nodes.forEach (function (h3) 
								for (xlsLine =0;xlsLine<h2.nodes.length;xlsLine++)
								{  // for each line
									fillWsFromResource (pr,ws, h2.nodes[xlsLine].resource as string , xlsLine);
								}; // for xlsLine
								XLSX.utils.book_append_sheet(wb, ws, hR2.title); //append worksheet to Workbook
							} // end if h2.nodes exists
							else
							{ // content is in res.properties
	
							};
	
						}); // h1.nodes for each Worksheet  end
						//---------------------------------------------------------------
						exportEnumerations ();
						//console.debug ("exportHier writeFile", wb, ws);
						XLSX.writeFile(wb, hR1.title + '.xlsx' );
					}// end if h1.nodes exists 
					else
					{ // h1.nodes does not exists : no Worksheet
						// console.debug ("no Worksheet");
					};
				}); // h.nodes end h: for each XLSX Workbook
			
			} // end If h.nodes exists
			else
			{ // h.node does not exist
				//console.debug ("empty Worksheet");
				XLSX.utils.book_append_sheet(wb, ws,"Table1"); //append default empty worksheet to Workbook
				exportEnumerations ();
				XLSX.writeFile(wb, resFile.title + '.xlsx' ); // attempt to write wb to filename to local directory or download in browser 
			}; // end of check whether h.nodes exist 
		
		}); // pr.hierarchies end
	} //end function exportHierXls

	function exportStatements ()
	{
		ws = XLSX.utils.aoa_to_sheet([]);
		console.debug ( "Statements ", pr.statements.length );	
	 	aoaArray = [["OrderNo","StatementId","Subject","Class","Object"],[]]; // Make it 2 Dimensional for XLSX.utils.sheet_add_aoa
		XLSX.utils.sheet_add_aoa(ws, aoaArray,{origin: 0}); // add as topline of Worksheet
	    //aoaArray[0][0] = "OrderNo";
		for (let i = 0 ; i< pr.statements.length; i++)  //copy property Class ID strings
		{	
			aoaArray = [[i, pr.statements[i].id, pr.statements[i].subject,pr.statements[i].class, pr.statements[i].object],[]]; 
			XLSX.utils.sheet_add_aoa(ws, aoaArray,{origin: -1}); // add as new line to Worksheet
		};
		XLSX.utils.book_append_sheet(wb, ws, "(Statements)"); //append worksheet to Workbook
	
	} // end function exportStatements	
	

	// Create Workbook and Build topline of resourcesCompleteTable from all Property Classes plus OrderNo:
	buildTopline ();
	
	// traverse the hierarchie tree , generate Ordernumber and 
	// put it with all properties of resources in resourcesCompleteTable:
	traverseTree ();
	
	// optional for test purposes print all resources of hierarchie tree with a different algorithm:
	//iterateHierarchy ();
	
    // export statements 
	exportStatements ();
	
    // export enumerations should be included in exportHierXls ()
    exportEnumerations ();
	
	// Write just one Workbook with Resources, Statements and Enumerations
	// console.debug ("writeFile ", resFile.title);
	XLSX.writeFile(wb, resFile.title + '.xlsx' );

	// Export in Format ready for import again
	exportHierXls ();

} // end function specif2xlsx

function xslx2specif(buf: ArrayBuffer, pN:string, chAt:string):SpecIF {
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
			let res = addr.match(/([A-Z]+)([0-9]+)/);  // res[1] is column name, res[2] is line index
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
		firstCell: Coord;
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
				// only if the sheet has content:
				this.firstCell = new Coord(this.range.split(":")[0]);
				this.lastCell = new Coord(this.range.split(":")[1]);
				this.isValid = true;
			};
		}
	}
	class BaseTypes {
		dataTypes: DataType[];
		propertyClasses: PropertyClass[];
		resourceClasses: ResourceClass[];
		statementClasses: StatementClass[];
		resources: Resource[];
		statements: Statement[];
		hierarchies: SpecifNode[];
		constructor() {
			this.dataTypes = [
				standardTypes.get("dataType", "DT-ShortString") as DataType,
				standardTypes.get("dataType", "DT-Text") as DataType,
				standardTypes.get("dataType", "DT-DateTime") as DataType,
				standardTypes.get("dataType", "DT-Boolean") as DataType,
				standardTypes.get("dataType", "DT-Integer") as DataType,
				standardTypes.get("dataType", "DT-Real") as DataType
			];
			this.propertyClasses = [
				standardTypes.get("propertyClass", "PC-Name") as PropertyClass,
				standardTypes.get("propertyClass", "PC-Description") as PropertyClass,
				standardTypes.get("propertyClass", "PC-Type") as PropertyClass
			];
			this.resourceClasses = [
				standardTypes.get("resourceClass", "RC-Folder") as ResourceClass
			];
			// user-created instances are not checked for visibility:
			this.resourceClasses[0].instantiation = [Instantiation.User];
			this.statementClasses = [];
			this.resources = [];
			this.statements = [];
			this.hierarchies = [];
		}
	}
	function dataTypeId( str:string ):string { 
		// must be able to find it just knowing the ws-name and the column index:
		return 'DT-' + simpleHash(str);
	}
	class PropClass {
		id: string;
		title: string;
		dataType: string;
		changedAt: string;
		constructor (nm: string, ti: string, dT: string) {
			this.id = propClassId(nm);
			//	ti = vocabulary.property.specif(ti); has already be translated before calling
			this.title = ti;
			this.dataType = 'DT-' + dT;		// like baseTypes[i].id
			this.changedAt = chAt;
		}
	}
	function propClassId( str:string ):string { 
		// must be able to find it just knowing the ws-name and the column index:
		return 'PC-' + simpleHash(str);
	}
	class ResClass {
		id: string;
		title: string;
		description: string;
		icon?: string;
		instantiation: Instantiation[];
		propertyClasses: PropertyClass[];
		changedAt: string;
		constructor(nm: string, ti: string) {
			this.id = nm;
			this.title = vocabulary.resource.specif(ti);
			let ic = CONFIG.icons.get(this.title);
			if (ic) this.icon = ic;
			this.description = 'For resources specified per line of an excel sheet';
			this.instantiation = [Instantiation.User];  // user-created instances are not checked for visibility
			this.propertyClasses = [];
			this.changedAt = chAt;
		}
	}
	function resClassId( str:string ):string { 
		return 'RC-' + simpleHash(str);
	}
	class StaClass {
		id: string;
		title: string;
		description: string;
		instantiation: Instantiation[];
		changedAt: string;
		constructor(ti: string) {
			this.title = vocabulary.statement.specif(ti);
			this.id = staClassId(this.title);
			this.description = 'For statements created by columns whose title is declared as a statement';
			this.instantiation = [Instantiation.User];  // user-created instances are not checked for visibility
			// No subjectClasses or objectClasses means all are allowed.
			// Cannot specify any, as we don't know the resourceClasses.
			this.changedAt = chAt;
		}
	}
	function staClassId( str:string ):string { 
		return 'SC-' + simpleHash(str);
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
		if (!ws || !ws.isValid) return;
		// Process all worksheets with a sheet name in (brackets):
		switch( ws.name ) {
			// It is assumed that all lists of enumerated values are defined on a worksheet named:
			case "(Enumerations)":
				let c: number,
					r: number,
					cell: ICell,
					dT:DataType,
					pC:PropertyClass;
				for (c = ws.firstCell.col; c < ws.lastCell.col + 1; c++) {
					// skip, if there is no name = content in the first row:
					cell = ws.data[cellName(c, ws.firstCell.row)];
					if (!cell || !cell.v) continue;

					dT = { id: dataTypeId(ws.name + c), title: '', type: TypeEnum.XsEnumeration, values: [], changedAt: chAt };
					pC = { id: propClassId( ws.name+c ), title: '', dataType: dT.id, changedAt: chAt };
					for( r=ws.firstCell.row; r<ws.lastCell.row+1; r++ ) {
						cell = ws.data[cellName(c,r)];
//						console.debug( 'cell',c,r,cell );
						if( r==ws.firstCell.row ) {
							// title in the first row;
							// if the title corresponds to the property (column) name of a worksheet with data,
							// this data column will assume the enumeration type:
							pC.title = dT.title = (cell&&cell.t=='s'? cell.v as string : '')
						}
						else {
							// enumerated values in the following rows:
							if( cell&&cell.t=='s'&&cell.v )
								dT.values.push({
									id: dT.id+'-'+r,
									value: cell.v as string
								});
						};
					};
					// Add dataType and propertyClass, if title and values are defined:
					if( dT.title && dT.values.length>0 ) {
						specifData.dataTypes.push( dT );
						specifData.propertyClasses.push(pC);
					};
				};
			// skip all worksheets with other names; they will be processed by transformData()
		};
	}

	function transformData(ws:Worksheet):void {
		if (!ws || !ws.isValid) return;
		// Skip all bracketed sheetnames, e.g. "(Enumerations)" or "(Setup)":
		if (ws.name.indexOf("(") == 0 && ws.name.indexOf(")") == ws.name.length - 1) return;

			function isDateTime(cell: ICell): boolean {
//				console.debug('isDateTime:',cell);
				return cell && (cell.t == 'd' || cell.t == 's' && RE.IsoDate.test(cell.v as string) );
			}
			function isNumber(cell: ICell ):boolean {
				//return cell && cell.t=='n';
				if (cell == undefined) {return true};
				
				var floatCell: number = parseFloat (cell.v as string);
				if (Number.isNaN (floatCell) ) 
				{return false;} 
				else
				{ 
				   cell.t = "n";
				   cell.v = floatCell; 
				   /*console.debug('isNumber',cell, floatCell, typeof cell == 'number', 
				   typeof floatCell == 'number', "int ", Number.isInteger (cell.v as number), 
				   "bool ", typeof cell == 'boolean'); */
				  
				   return true;
			    }
		    }

		/* 2021-11-26 New implementation on branch 'develop':
			function isInt(cell: ICell): boolean {
				return cell && (cell.t=='n' && Number.isInteger(cell.v as number) || (cell.t=='s' && RE.Integer.test(cell.v as string)));
			}
			function isReal(cell: ICell): boolean {
				return cell && (cell.t=='n' && !Number.isInteger(cell.v as number) || (cell.t=='s' && RE.Real().test(cell.v as string)));
			}
			function isBool(cell: ICell): boolean {
//				console.debug('isBool',cell);
				return cell && (cell.t == 'b' || cell.t == 's' && (isTrue(cell.v as string) || isFalse(cell.v as string) ) );
			}
		*/
			function isInt(cell: ICell): boolean {
				if (cell == undefined) {return true};
				return isNumber( cell ) && Number.isInteger( cell.v as number );
			}
			function isReal(cell: ICell): boolean {
				if (cell == undefined) {return true};
				return isNumber(cell) && !Number.isInteger( cell.v as number );
			}
			function isBool(cell: ICell): boolean {
				if (cell == undefined) {return true};
				// console.debug('isBool',cell, cell.v );
                
				return cell && ( typeof (cell.v) == 'string' && (isTrue(cell.v as string) || isFalse(cell.v as string) ) );

			}
			function isStr(cell: ICell): boolean {
				return cell && cell.t=='s' && cell.v.length>0;
			}
		    /*	function isXHTML( cell ):boolean {
				return cell && cell.t=='s' && ....
			}  */			
			function titleFromProps( res:Resource ):string {
//				console.debug( 'titleFromProps', res );
				// get the title from the properties:
				if( res.properties ) {
					let a: number,
						pC: PropertyClass;
					// first try to find a property with title listed in CONFIG.titleProperties:
                    for ( a=res.properties.length-1; a>-1; a--) {
						pC = itemById(specifData.propertyClasses as Item[], res.properties[a]['class'] as string);
                        if ( pC && CONFIG.titleProperties.indexOf(pC.title) > -1 )
							return res.properties[a].value.stripHTML();
                    };
					// then try to find a property with title listed in CONFIG.idProperties:
                    for ( a=res.properties.length-1; a>-1; a--) {
						pC = itemById(specifData.propertyClasses as Item[], res.properties[a]['class'] as string);
                        if (pC && CONFIG.idProperties.indexOf(pC.title) > -1 )
							return res.properties[a].value.stripHTML();
                    };
				};
				return '';
			}
			function createFld(sh: Worksheet): void {
				if( sh.lastCell.row-sh.firstCell.row<1 ) return;   // skip, if there are no resources

					function createRes(ws: Worksheet, row:number): void {
						// Create a resource and store it in specifData.resources;
						// if a statement is found in a column, store it in specifData.statements (pretty obvious, isn't it):

							function getVal(dT: DataType, cell: ICell): string {
								// dT is the target dataType; 
								// it is the least restrictive type for all values in the column.
								// A single cell however, can have a more specific dataType.
								// Malicious content will be removed upon import.
//								console.debug( 'getVal', cell, dT );
								if( cell && dT ) 
									switch( dT.type ) {
										case 'xs:string':
										case 'xhtml':
											switch (cell.t) {
												case "s": return cell.v as string;
												case "d": return (cell.v as Date).toISOString();
												case "n": return (cell.v as number).toString();
												case "b": return (cell.v as boolean).toString();
											};
										case 'xs:dateTime':
											switch (cell.t) {
												case "d": return (cell.v as Date).toISOString();
												case "s":
													// Can only get here in case of a native property;
													// the value will be checked later on, so there is no need to log a warning.
													if (RE.IsoDate.test(cell.v))
														return cell.v as string;
												//	console.warn(ws.name + ", row " + row + ": Cell value '" + cell.v + "' is an invalid dateTime value");
													return '';
											};
										case 'xs:integer':
										case 'xs:double': 
											switch (cell.t) {
												case "n": return (cell.v as number).toString();
												case "s": return cell.v as string;
											};
										// we have found earlier that it is a valid boolean,
										// so all values not beeing true are false:
										case 'xs:boolean':
											switch (cell.t) {
												case "b": return (cell.v as boolean).toString();
												case "s": return isTrue(cell.v as string).toString();
											};
										case 'xs:enumeration':
											let eV = itemBy( dT.values, 'value', cell.v );
											return (eV? eV.id : "" )
									};
								return '';
							}

						// The resource to create:
						// @ts-ignore - id and title will be defined further down
						var res: Resource = {
								// id will be set later on using the visibleId, if provided.
								// title will be set according to the properties, later on.
								class: ws.resClass,
								properties: [],
								changedAt: chAt
							};

						let c:number, C:number,
							cell: ICell,
							val: string,
						//	rC,
							pC: PropertyClass,
							dT: DataType, id,
							stL: Statement[] = [],
							pTi: string,
							obL:string[],
							oInner:string[];
						for (c = ws.firstCell.col, C = ws.lastCell.col + 1; c < C; c++) {	// an attribute per column ...
							cell = ws.data[cellName(c, ws.firstCell.row)];   // column title in the first row
							pTi = cell ? (cell.v as string).trim() : '';
							// skip the column, if it has no title (value in the first row):
							if ( !pTi ) continue;

							cell = ws.data[cellName(c, row)];

							// console.debug('createRes',pTi,c,cellName(c,row),cell);
							if (cell && cell.v) {
								// the cell has content:
								// console.debug('nativeProp has ',pTi);
								// Use native property, if appropriate:
								if (CONFIG.nativeProperties.has(pTi)) {
									pC = CONFIG.nativeProperties.get(pTi); // here, pC is actually not a real propertyClass, but serving it's role ...
									// @ts-ignore - the first parameter of getVal() has all information needed for proper transformation
									val = getVal({ type: pC.type }, cell);
									// @ts-ignore - check is defined in this case
									// console.debug('nativeProp found',pTi,pC,val);
									if (pC.check(val)) {
										// @ts-ignore - name is defined in this case
										res[pC.name] = val;
										// @ts-ignore - name is defined in this case
										//console.debug(ws.name + ", row " + row + ": '"+pTi+"' with value '" + val + "' has been mapped to the native property '" + pC.name + "'");
									}
									else
									{
										//console.debug(ws.name + ", row " + row + ": Cell value '" + cell.v + "' is invalid for the given native property '" + pTi + "'");
									};
									continue;
								};

								pC = itemById( specifData.propertyClasses as Item[], propClassId(ws.name+c) );
								//console.debug('create p',c,cellName(c,row),cell,rC,pC);
								if( pC ) {
									// it is a specifically created property type (with neither native nor enumerated dataType):
									dT = itemById(specifData.dataTypes as Item[],pC.dataType);
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
										//	title: pC.title,
											class: pC.id,
											value: val
										});
								}
								else {
									pC = itemByTitle( specifData.propertyClasses as Item[], pTi );
									if( pC ) {
										// it is a property with enumerated dataType; only a defined value will be used.
										// Thus, if a cell contains a value which is not listed in the type, it will be ignored:
										val = getVal(itemById(specifData.dataTypes as Item[],pC.dataType as string), cell );
//										console.debug( 'enumerated dataType',cell,pTi,pC,val,typeof(val) );
										if( val ) 
											res.properties.push({
												class: pC.id,
												value: val
											})
										else
											console.warn('Suppressed undefined enumerated value in cell ' + cellName(c, row)+' of worksheet '+ws.name);
									}
									else {
										// it is a statement:
										obL = (cell.v as string).split(",");
	//									console.debug('createRes - statement',pTi,obL);
										obL.forEach( (ob:string)=>{
											oInner = RE.inQuotes.exec( ob );
											if( oInner && oInner.length>2 ) {
												stL.push({
											//		id: undefined,  	// defined further down, when the resource's id has been determined
													title: pTi,
													class: staClassId( pTi ),	// make id from column title
											//		subject: undefined,	// defined further down, when the resource's id has been determined
													objectToFind: oInner[1] || oInner[2],  // for content in double and single quotes
													// just a placeholder for passing the schema-check,
													// it will be replaced with a resource.id when importing.
													// Remember that the constraint-check on the statement.object must be disabled.
													object: CONFIG.placeholder, 
													changedAt: chAt
												});
											};
										});
									};
								};
							};
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
								res.id = 'R-' + simpleHash(ws.name+id);
								if( indexById( specifData.resources, res.id )>-1 ) {
									// The specified id is not unique,
									// it will be modified deterministically based on the number of occurrences of that same id:
									// see https://stackoverflow.com/questions/19395257/how-to-count-duplicate-value-in-an-array-in-javascript
									dupIdL.push(id);
									let counts:any = {};
									dupIdL.forEach( (x:string)=>{ counts[x] = (counts[x]||0)+1 });
									console.warn('The user-defined identifier',id,'is occurring',counts[id]+1,'times.');
//									console.debug('dupId',id,simpleClone(dupIdL),counts[id]);
									// modify the id of any duplicate specified user-assigned id,
									// as an id must be unique, of course:
									res.id = 'R-' + simpleHash(ws.name+id+counts[id]);
								};
							}
							else {
								// No id specified, so a random value must be generated. 
								// No chance to update the element later on!
								res.id = Lib.genID('R-');
							};
							res.title = titleFromProps( res );
							// accept only resources with title:
							if( res.title ) {
//								console.debug('xls-resource',res);
								// add the hierarchy entry to the tree:
								hTree.nodes.push({ 
									id: 'N-' + simpleHash(res.id+hTree.nodes.length),
									resource: res.id,
									changedAt: chAt
								}); 
								// add the resource to the list:
								specifData.resources.push(res);
								// the resource has been stored, so any statement can be stored, as well:
								if( stL.length>0 ) {
									stL.forEach((st) => { st.id = 'S-' + simpleHash(res.id+st.title+st.objectToFind); st.subject = res.id } );
									specifData.statements = specifData.statements.concat(stL);
								};
							};
						};
					}
		
				// Processing of createFld:
				// Create folder resource:
				var fld:Resource = {
						id: 'R-' + simpleHash(pN+sh.name+CONFIG.resClassFolder),
						title: sh.name,
						class: "RC-Folder",
						properties: [{
							class: "PC-Name",
							value: sh.name
						}],
						changedAt: chAt
					};
//				console.debug( 'createFld:', fld );
				specifData.resources.push( fld );

				// Create the hierarchy entry for the folder containing all resources of the current worksheet:
				var hTree = { 
						id: sh.hid, 
						resource: fld.id,
						nodes: [],
						changedAt: chAt
					},
					dupIdL:string[] = [];  // list of duplicate resource ids 
					
				// Create the resources:
				for( var l=sh.firstCell.row+1,L=sh.lastCell.row+1;l<L;l++) {	// every line except the first carrying the attribute names
//					console.debug('resource', l, sh );
					createRes( sh, l )
				};
				// add the hierarchy tree:
				specifData.hierarchies[0].nodes.push( hTree );
			}

			function getPropClasses(ws: Worksheet): string[] { 
				// build a list of propertyClasses for the given worksheet;
				// a complete propertyClass is added to pCL per column which is not titled with a statement title
				// and a corresponding list of propertyClass ids is returned for the resourceClass.
				var pCs: string[] = [], // list of propertyClass ids found on this worksheet
					pC: PropertyClass,
					dT: DataType,
					c: number, C: number,
					cell: ICell,
					noTitleFound = true,
					pTi: string;
				for( c=ws.firstCell.col,C=ws.lastCell.col+1;c<C;c++ ) {		// every column
					// Check whether it is an enumerated dataType:
					cell = ws.data[ cellName(c,ws.firstCell.row) ];
					pTi = cell? (cell.v as string).trim() : '';
					// Process only columns with title, skip the others:
					if (pTi) {
						// 1. A native property will be used, if possible, so no propertyClass is created:
						if (CONFIG.nativeProperties.has(pTi))
							continue;
						// 2. Find out, whether its a (previously created) enumerated dataType:
						pC = itemByTitle( specifData.propertyClasses as Item[], pTi );
						if (pC && pC.id) {
							dT = itemById(specifData.dataTypes as Item[], pC.dataType as string);
							if( dT && dT.type=="xs:enumeration" ) {
//								console.debug( 'enum found: ', cell, pTi, pC );
								// The current column has an enumeration dataType;
								// use the corresponding propertyClass:
								pCs.push( pC.id );
								continue;
							};
						};
						// 3. It is neither a native nor an enumerated dataType, 
						//    so we find out which dataType is appropriate:
						pC = getPropClass(c);
						// .. and create the propertyClass:
						if( pC ) { 
							Lib.cacheE( specifData.propertyClasses, pC ); // add it to propertyClasses, avoid duplicates
							pCs.push(pC.id);  // add the key to the resourceClass' propertyClasses
						};
					};
				};
				return pCs;

				function getPropClass( cX:number ):PropertyClass|undefined {	
					// Determine the data type of all values of the column starting with the second row (= second list entry).
					// If all are equal, the data type is assumed; by default it is 'ShortString'.
					// Some cell values may be undefined.
					const defaultC = 'ShortString';
						
					// add all values of the current column to a list:
					let valL = [],
						r:number,
						R:number;
					for( r=ws.firstCell.row,R=ws.lastCell.row+1;r<R;r++) {		// every line
						valL.push( ws.data[ cellName(cX,r) ] );
					};

					// the cell value in the first line is the title, either of a property or a statement:
					let pTi = valL[0] ? (valL[0].w || valL[0].v) : '',
						pC = '',
						nC = '',
						i: number;
//					console.debug( 'getPropClass 1', pTi, valL );

					// Skip, if there is no column heading or if it is a statement title,
					// (the check is done here - and not a level above - because here we know the title value):
					if (!pTi || CONFIG.statementClasses.indexOf( vocabulary.statement.specif(pTi) )>-1 ) return;
					// else, it is a property:

					// Only one property shall be the resource's title;
					// the first one found shall prevail:
					let xTi = vocabulary.property.specif(pTi),  // translate the title to standard term
						isNoTi = xTi != CONFIG.propClassTitle;
					if ( noTitleFound || isNoTi ) {
						pTi = xTi;
						noTitleFound = noTitleFound && isNoTi; 
					};
					
					// Cycle through all elements of the column and select the most restrictive type,
					// start with the last and stop with the second line:
					for( i=valL.length-1; i>0; i-- ) {
						nC = classOf(valL[i]);
   					    // console.debug('getPropClass 2',i,pC,valL[i],nC);
						if( nC.length<1 ) continue;

				/* 2021-11-26 Implementation on branch 'develop':
						if( !pC ) { pC = nC; continue };
						if( pC==nC ) continue;
						if( pC=='Real' && nC=='Integer' ) continue;
						if( pC=='Integer' && nC=='Real' ) { pC = 'Real'; continue };
						// else: the classes are not equal, take the least restrictive:
						pC = defaultC;
				*/
						if (pC == defaultC) { continue };
						if (nC == defaultC) {pC = defaultC; continue };
						if (!pC && nC == 'Boolean') {pC = 'Boolean'; continue }; //  empty fields are rated boolean in nC
						if (( !pC || pC == 'Boolean' || pC == 'DateTime' ) && nC == 'DateTime' ) {pC = 'DateTime'; continue};
						if (( !pC || pC == 'Boolean' ) && nC == 'Integer' ) {pC = 'Integer'; continue};
						if (( !pC || pC == 'Boolean' || pC == 'Integer' ) && nC=='Real' ) {pC = 'Real'; continue};
												
					};
					// Assign a longer text field for descriptions:
					if( CONFIG.descProperties.indexOf( pTi )>-1 ) pC = 'Text';

					// Assign a longer text field for columns with cells having a longer text;
					if (pC == 'ShortString') {   // specifically 'ShortString', not defaultC !!
						let maxL = 0,
							multLines = false;
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
					return new PropClass( ws.name+cX, pTi, pC || defaultC );

						function classOf(cell: ICell): string {
							if( isDateTime(cell) ) return 'DateTime';
							if( isBool(cell) ) return 'Boolean';
							if( isInt(cell) ) return 'Integer';
							if( isReal(cell) ) return 'Real';
							if (isStr(cell)) return defaultC;
							return '';
						}
				}
			}
			function getStaClasses(ws: Worksheet, sCL: StatementClass[]): void { 
				// build a list of statementClasses:
				var sTi,sC:StatementClass;
				for( var c=ws.firstCell.col,C=ws.lastCell.col+1;c<C;c++ ) {		// every column
					sTi = ws.data[ cellName(c,ws.firstCell.row) ];  			// value of first line
					// Skip columns without title;
					// in Excel 'deleted' cells are different from 'empty' cells,
					// so we need to take a look at the actual values:
					if( sTi ) {
						sTi = sTi.w || sTi.v;
						// Add statementClass, if it is declared as such and if it is not yet listed:
						if( sTi && indexById(sCL,staClassId(sTi))<0 && CONFIG.statementClasses.indexOf( sTi )>-1 ) {
							sC = new StaClass( sTi );
	//						console.debug( 'getStaClasses', sTi, sC );
							sCL.push( sC )
						};
					};
				};
			}

//		console.debug( 'sheetName:', ws.name );
		
		// Processing of transformData():
		if( ws.range ) {
			// The sheet has content:

			// 3.1 Create a resourceClass per XLS-sheet:
			// The resourceClass' title is taken from the worksheet name, project name or a default is applied:
			var rC = new ResClass(ws.resClass, inBracketsAtEnd(ws.name) || inBracketsAtEnd(pN) || CONFIG.resClassXlsRow );
			// Add a property class for each column using the names specified in line 1:
			rC.propertyClasses = getPropClasses( ws );
//			console.debug('rC',rC);
			specifData.resourceClasses.push(rC);
			getStaClasses( ws, specifData.statementClasses );
			
			// 3.2 Create a folder with the resources of this worksheet:
			createFld(ws);
		};
	}

	// Processing of xslx2specif:
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
	// @ts-ignore - Basetypes() has not all required attributes of SpecIF; they are added later on
	var specifData:SpecIF = new BaseTypes();
	specifData.id = 'XLS-' + pN.specifIdOf();
	specifData.title = pN;
	specifData.generator = "xslx2specif";
	specifData.$schema = 'https://specif.de/v1.0/schema.json'
	// the root folder resource:
	specifData.resources.push({
		id: 'R-' + pN.specifIdOf(),
		title: pN,
		class: "RC-Folder",
		properties: [{
			class: "PC-Name",
			value: pN
		}],
		changedAt: chAt
	});

	// 2. Create the specification (hierarchy root) for the file:
	specifData.hierarchies.push({
		id: 'H-' + pN.specifIdOf(),
		resource: 'R-' + pN.specifIdOf(),
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

}	// end of xlsx2specif

	function isTrue(str: string): boolean {
		return CONFIG.valuesTrue.indexOf(str.toLowerCase().trim()) > -1;
	}
	function isFalse(str: string): boolean {
		return CONFIG.valuesFalse.indexOf(str.toLowerCase().trim()) > -1;
	}
	function inBracketsAtEnd(str:string):string|undefined {
		// Extract resourceClass in (round brackets) or [square brackets]:
	//	let resL = /\s*(?:\(|\[)([a-zA-Z0-9:_\-].+?)(?:\)|\])$/.exec( pN );
		let resL = RE.inBracketsAtEnd.exec(str);
		if (Array.isArray(resL) && resL.length > 1)
			return resL[1] || resL[2];
    }
});
