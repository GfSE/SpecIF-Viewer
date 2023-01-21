/*!	Standard type definitions with methods. 
	Dependencies: -
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	Author: se@enso-managers.com, Berlin
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/

class StandardTypes {
	dataTypes:SpecifDataType[] = [{
		id: "DT-ShortString",
		title: "String [" + CONFIG.textThreshold + "]" ,
		description: [{ text: "String with length " + CONFIG.textThreshold }],
		type: SpecifDataTypeEnum.String,
		maxLength: CONFIG.textThreshold,
		changedAt: "2016-05-26T08:59:00+02:00"
	},{
		id: "DT-Text",
		title: "Plain or formatted Text",
		description: [{ text: "A text string, plain, or formatted with XHTML or markdown" }],
		type: SpecifDataTypeEnum.String,
		changedAt: "2021-02-14T08:59:00+02:00"
	},{ 
		id: "DT-DateTime",  
		title: "Date or Timestamp",
		description: [{ text: "Date or timestamp in ISO-8601 format" }],
		type: SpecifDataTypeEnum.DateTime,
		changedAt: "2016-05-26T08:59:00+02:00"
	},{ 
		id: "DT-Boolean",
		title: "Boolean",
		description: [{ text: "The Boolean data type." }],
		type: SpecifDataTypeEnum.Boolean,
		changedAt: "2016-05-26T08:59:00+02:00"
	},{ 
		id: "DT-Integer",
		title: "Integer",
		description: [{ text: "A numerical integer value from -32768 to 32768." }],
		type: SpecifDataTypeEnum.Integer,
		minInclusive: CONFIG.minInteger,
		maxInclusive: CONFIG.maxInteger,
	    changedAt: "2016-05-26T08:59:00+02:00"
	},{ 
		id: "DT-Real",
		title: "Real",
		description: [{ text: "A floating point number (double)." }],
		type: SpecifDataTypeEnum.Double,
		fractionDigits: CONFIG.maxAccuracy,
		minInclusive: CONFIG.minReal,
		maxInclusive: CONFIG.maxReal,
		changedAt: "2021-02-14T08:59:00+02:00"
	}];
	propertyClasses:SpecifPropertyClass[] = [{
		id: "PC-Name",
		title: CONFIG.propClassTitle,
		description: [{ text: "The element's name or title." }],
		dataType: { id: "DT-ShortString" },
		changedAt: "2016-05-26T08:59:00+02:00"
	}, {
		id: "PC-Description",
		title: CONFIG.propClassDesc,
		dataType: { id: "DT-Text" },
		changedAt: "2016-05-26T08:59:00+02:00"
	}, {
		id: "PC-Diagram",
		title: CONFIG.resClassDiagram,
		dataType: { id: "DT-Text" },
		changedAt: "2016-05-26T08:59:00+02:00"
	},{
		id: "PC-Type",
		title: CONFIG.propClassType,
		dataType: { id: "DT-ShortString" },
		changedAt: "2016-05-26T08:59:00+02:00"
	}];
	resourceClasses:SpecifResourceClass[] = [{
		id: "RC-Folder",
		title: CONFIG.resClassFolder,
		description: [{ text: "Folder with title and text for chapters or descriptive paragraphs." }],
		isHeading: true,
		instantiation: [SpecifInstantiation.Auto, SpecifInstantiation.User],
		propertyClasses: [{ id: "PC-Name" }, { id: "PC-Description" }, { id: "PC-Type" }],
		changedAt: "2016-05-26T08:59:00+02:00"
	},{
        id: "RC-Paragraph",
		title: CONFIG.resClassParagraph,
		description: [{ text: "Information with title and text for descriptive paragraphs." }],
		instantiation: [SpecifInstantiation.Auto, SpecifInstantiation.User],
		propertyClasses: [{ id: "PC-Name" },{ id: "PC-Description" }, { id: "PC-Type" }],
		changedAt: "2020-12-04T18:59:00+01:00"
	}];
/*	statementClasses: SpecifStatementClass[] = [{
		id: "SC-mentions",
		title: CONFIG.staClassMentions,
		instantiation: ['internal'],  // this value is not defined by the schema
		changedAt: "2022-06-05T18:59:00+01:00"
	}];  */
	// The sequence is such that every list's elements have references only to list elements above:
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
		for (var ctg of this.listName.keys())
			fn(ctg, this.listName.get(ctg));
		return this.listName.size;
    }
	get(ctg: string, key: SpecifKey, chAt?: string): SpecifItem {
		// Get the element of the given category: 
		// @ts-ignore - yes, the index can be undefined:
		var item: SpecifItem = LIB.itemByKey(this[this.listName.get(ctg)], key);
		if (item) {
			// shield any subsequent change from the templates available here:
			item = simpleClone(item);
			if (chAt) item.changedAt = chAt;
			return item;
		};
		throw Error("No standard type with id '" + key.id + "' and revision '" + key.id +"' of category '"+ctg+"'");
	}
/*	getByTitle(ctg: string, ti: string, chAt?: string): SpecifItem | undefined {
		var item: SpecifItem = LIB.itemByTitle(this[this.listName.get(ctg)], ti);
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
	addTo(ctg: string, key: SpecifKey, dta: SpecIF): void {
		// Add an element (e.g. class) to it's list, if not yet defined:

		// 1. Get the name of the list, e.g. 'dataType' -> 'dataTypes':
		// @ts-ignore - yes, the result can be undefined:
		let lN: string = this.listName.get(ctg),
			item = this.get(ctg, key);

		// ToDo: For avoiding duplicates, The checking for the id is not sufficient;
		// if the existing element has an equal id, but different content,
		// the resulting SpecIF data-set is not consistent.

		// 2. Create it, if not yet available:
		if (item) {
			// @ts-ignore - index is ok:
			if (Array.isArray(dta[lN])) {
				// add the type, but avoid duplicates:
				// @ts-ignore - index is ok:
				if (LIB.indexByKey(dta[lN], key) < 0)
					// @ts-ignore - yes, the object can be undefined:
					dta[lN].unshift( item );
			}
			else {
				// create the list with the item:
				// @ts-ignore - index is ok:
				dta[lN] = [item];
			};
		}
		else
			throw Error("Can't find item with id '"+key.id+"' and revision '"+key.revision+"' in standard types.")
	}
};


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