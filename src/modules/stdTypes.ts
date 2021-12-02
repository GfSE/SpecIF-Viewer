/*!	Standard type definitions with methods. 
	Dependencies: -
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	Author: se@enso-managers.com, Berlin
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/

class StandardTypes {
	dataTypes:DataType[] = [{
		id: "DT-ShortString",
		title: "String ["+CONFIG.textThreshold+"]",
		description: "String with length "+CONFIG.textThreshold,
		type: TypeEnum.XsString,
		maxLength: CONFIG.textThreshold,
		changedAt: "2016-05-26T08:59:00+02:00"
	},{
		id: "DT-Text",
		title: "Plain or formatted Text",
		description: "A text string, plain, or formatted with XHTML or markdown",
		type: TypeEnum.XsString,
		changedAt: "2021-02-14T08:59:00+02:00"
	},{
		// DEPRECATED for SpecIF, but needed for ReqIF:
		id: "DT-FormattedText",
		title: "XHTML-formatted Text",
		type: TypeEnum.XHTML,
		changedAt: "2016-05-26T08:59:00+02:00"
	},{ 
		id: "DT-DateTime",  
		title: "Date or Timestamp",
		description: "Date or Timestamp in ISO-Format",
		type: TypeEnum.XsDateTime,
		changedAt: "2016-05-26T08:59:00+02:00"
	},{ 
		id: "DT-Boolean",
		title: "Boolean",
		description: "The Boolean data type.",
		type: TypeEnum.XsBoolean,
		changedAt: "2016-05-26T08:59:00+02:00"
	},{ 
		id: "DT-Integer",
		title: "Integer",
		description: "A numerical integer value from -32768 to 32768.",
		type: TypeEnum.XsInteger,
		minInclusive: CONFIG.minInteger,
		maxInclusive: CONFIG.maxInteger,
	    changedAt: "2016-05-26T08:59:00+02:00"
	},{ 
		id: "DT-Real",
		title: "Real",
		description: "A floating point number (double).",
		type: TypeEnum.XsDouble,
		fractionDigits: CONFIG.maxAccuracy,
		minInclusive: CONFIG.minReal,
		maxInclusive: CONFIG.maxReal,
		changedAt: "2021-02-14T08:59:00+02:00"
	}];
	propertyClasses:PropertyClass[] = [{
		id: "PC-Name",
		title: CONFIG.propClassTitle,
		description: "The element's name or title.",
		dataType: "DT-ShortString",
		changedAt: "2016-05-26T08:59:00+02:00"
	}, {
		id: "PC-Description",
		title: CONFIG.propClassDesc,
		dataType: "DT-Text",
		changedAt: "2016-05-26T08:59:00+02:00"
	}, {
		// DEPRECATED for SpecIF, but needed for ReqIF:
		id: "PC-FormattedText",
		title: CONFIG.propClassDesc,
		dataType: "DT-FormattedText",
		changedAt: "2020-11-06T08:59:00+02:00"
	}, {
		id: "PC-Diagram",
		title: CONFIG.resClassDiagram,
		dataType: "DT-Text",
	//	dataType: "DT-FormattedText",
		changedAt: "2016-05-26T08:59:00+02:00"
	},{
		id: "PC-Type",
		title: CONFIG.propClassType,
		dataType: "DT-ShortString",
		changedAt: "2016-05-26T08:59:00+02:00"
	}];
	resourceClasses:ResourceClass[] = [{
		id: "RC-Folder",
		title: CONFIG.resClassFolder,
		description: "Folder with title and text for chapters or descriptive paragraphs.",
		isHeading: true,
		instantiation: [Instantiation.Auto, Instantiation.User],
		propertyClasses: ["PC-Name","PC-Description","PC-Type"],
		changedAt: "2016-05-26T08:59:00+02:00"
	},{
        id: "RC-Paragraph",
        title: "SpecIF:Paragraph",
        description: "Information with title and text for descriptive paragraphs.",
		instantiation: [Instantiation.Auto, Instantiation.User],
		propertyClasses: ["PC-Name","PC-Description","PC-Type"],
		changedAt: "2020-12-04T18:59:00+01:00"
    },{
		id: "RC-HierarchyRoot",
		title: CONFIG.resClassOutline,
		description: "Metadata of a document outline (hierarchy).",
		instantiation: [Instantiation.Auto],
		propertyClasses: ["PC-Name","PC-Description","PC-Type"],
		changedAt: "2016-05-26T08:59:00+02:00"
	}];
	// The sequence is such that every list's elements have only references to list elements above:
	listName = new Map([
		['dataType', "dataTypes"],
		['propertyClass', "propertyClasses"],
		['resourceClass', "resourceClasses"],
		['statementClass', "statementClasses"],
		['file', "files"],
		['resource', "resources"],
		['statement', "statements"],
		['hierarchy', "hierarchies"]
	])

	iterateLists(fn: Function): number {
		// Perform the function fn for each list defined above:
		for (var le of this.listName.keys())
			fn(le, this.listName.get(le));
		return this.listName.size;
    }
	get(ctg: string, id: string, chAt?: string): Item | undefined {
		// Get the element of the given category: 
		var item: Item = itemById(this[this.listName.get(ctg)], id);
		if (item) {
			// shield any subsequent change from the templates available here:
			item = simpleClone(item);
			if (chAt) item.changedAt = chAt;
			return item;
		};
	}
/*	getByTitle(ctg: string, ti: string, chAt?: string): Item | undefined {
		var item: Item = itemByTitle(this[this.listName.get(ctg)], ti);
		if (item) {
			// shield any subsequent change from the templates available here:
			item = simpleClone(item);
			if (chAt) item.changedAt = chAt;
			return item;
		};
	}
	listNameOf(ctg:string):string {
		// Return the cache name for a given category:
		if (this.listName.has(ctg))
			return this.listName.get(ctg) as string;
		throw Error("Invalid category '"+ctg+"'");
	} */
	addTo(ctg: string, id: string, pr?): void {
		// Add an element (e.g. class) to it's list, if not yet defined:
		if (!pr) pr = app.cache.selectedProject.data;

		// get the name of the list, e.g. 'dataType' -> 'dataTypes':
		let lN: string = this.listName.get(ctg);
		// create it, if not yet available:
		if (Array.isArray(pr[lN])) {
			// add the type, but avoid duplicates:
			if (indexById(pr[lN], id) < 0)
				pr[lN].unshift( this.get(ctg, id) );
		}
		else {
			pr[lN] = [this.get(ctg, id)];
		};
	}
};

function addPCReference(eC: ResourceClass|StatementClass, id: string): void {
	// Add the propertyClass-id to an element class (eC), if not yet defined:
	if (Array.isArray(eC.propertyClasses)) {
		// Avoid duplicates:
		if (eC.propertyClasses.indexOf(id) < 0)
			eC.propertyClasses.unshift(id);
	}
	else {
		eC.propertyClasses = [id];
	};
}
function addP(el:Resource|Statement, prp: Property): void {
	// Add the property to an element (el):
	if (Array.isArray(el.properties))
		el.properties.unshift(prp);
	else
		el.properties = [prp];
}

/*  ToDo: REWORK FOR v0.10.8:
	// The standard types for comments:
	// 	A list with all data-, object- and relation-types needed for the comments according to specif schema.
	// 	For the time being, the addComment dialog (in specifications-*.html) is hard-coded for the current type definitions.  
	function CommentTypes() {
		let did = LIB.genID('DT-'), oid = LIB.genID('RC-'), rid = LIB.genID('SC-');
		this.title = 'Types for comments';
		this.specifVersion = '0.10.4';
		this.dataTypes = [{
			id: did,
			title: CONFIG.dataTypeComment,
			description: "String type with length 1024 for comment text",
			type: "xs:string",
			maxLength: 1024
		}];
		this.resourceClasses = [{
			id: oid,
			title: CONFIG.objTypeComment,
			description: "Comment referring to a model element ('resource' in general).",
			instantiation: ["auto"],
			propertyClasses: [{	
				title: CONFIG.attrTypeText,
				description: 'Property-type for comment text',
				dataType: did		// ID of the dataType defined before
			}]
		}];
		this.statementClasses = [{
			id: rid,
			title: CONFIG.relTypeCommentRefersTo,
			description: "Comment refers to a model element ('resource' in general).",
			instantiation: ["auto"],
			subjectClasses: [oid]	// only resources of type with id=oid are eligible
//			objectClasses: []		// no objectClasses property means 'all resources are eligible' (like ReqIF standard)
		}]
//		console.debug('CommentTypes done')
	} 

	// a constructor for standard types:
	function StdTypes( prj, types ) {
		// types: specif object with types to be created if not yet present.
		console.debug('StdTypes',prj,types);
		if( !prj || !types ) return null;
//		console.debug('StdTypes',prj,types);

		var self = this;
		
	//	ToDo: REWORK
	//	self.available = function() {  
	//		// Return true if all types are available.
	//		// Must compare by unique name, because the id may vary.
	//		return LIB.containsByTitle( prj.dataTypes, types.dataTypes )
	//			&& LIB.containsByTitle( prj.resourceClasses, types.resourceClasses )
	//			&& LIB.containsByTitle( prj.statementClasses, types.statementClasses )
	//	};

		self.add = function() {
			// add or update the new types to the project.
			// Update by creating with a new id, because an id may not be reused;
			// as the server does not allow type updates, yet.
			return prj.update(types,{mode:'adopt',addGlossary:false})
			.fail( function(st) {
				console.error('type update has failed '+st.status)
			})
		};
		self.add();
//		console.debug('StdTypes done')
		return self
	}
*/