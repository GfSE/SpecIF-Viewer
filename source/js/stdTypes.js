///////////////////////////////
/*	Standard type definitions with methods. 
	When all registered modules are ready, a callback function is executed to start or continue the application.
	Dependencies: jQuery 3.2 and later, reqifserver, cache.
	(C)copyright 2010-2018 enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.com, Berlin
	License: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de            
*/
		
	// The standard types for comments:
	// 	A list with all data-, object- and relation-types needed for the comments according to specif schema.
	// 	For the time being, the addComment dialog (in specifications-*.html) is hard-coded for the current type definitions.  
	function CommentTypes() {
		let did = genID('DT-'), oid = genID('RT-'), rid = genID('ST-');
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
	};

	// a constructor for standard types:
	function StdTypes( prj, types ) {
		// types: specif object with types to be created if not yet present.
		if( !prj || !types ) return null;
//		console.debug('StdTypes',prj,types);

		var self = this;
		
		self.available = function() {  
			// Return true if all types are available.
			// Must compare by unique name, because the id may vary.
			return containsByName( prj.dataTypes, types.dataTypes )
				&& containsByName( prj.resourceClasses, types.resourceClasses )
				&& containsByName( prj.statementClasses, types.statementClasses )
				&& containsByName( prj.hierarchyClasses, types.hierarchyClasses )
		};

		self.update = function() {
			// add or update the new types to the project.
			// Update by creating with a new id, because an id may not be reused;
			// as the server does not allow type updates, yet.
			return prj.update(types)
			.fail( function(st) {
				console.error('type update has failed '+st.status)
			})
		};
//		console.debug('StdTypes done')
		return self
	};
