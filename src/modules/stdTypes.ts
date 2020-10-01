/*!	Standard type definitions with methods. 
	Dependencies: -
	(C)copyright 2010-2018 enso managers gmbh (http://www.enso-managers.de)
	License: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	Author: se@enso-managers.com, Berlin
	We appreciate any correction, comment or contribution!
*/
		
/*  ToDo: REWORK FOR v0.10.8:
	// The standard types for comments:
	// 	A list with all data-, object- and relation-types needed for the comments according to specif schema.
	// 	For the time being, the addComment dialog (in specifications-*.html) is hard-coded for the current type definitions.  
	function CommentTypes() {
		let did = genID('DT-'), oid = genID('RC-'), rid = genID('SC-');
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
	} */
	function GlossaryItems() {
		var self=this;
		let dTid = genID('DT-'), rCid = genID('RC-'), sCid = genID('SC-'),
			pC1id = genID('PC-'), pC3id = genID('PC-'), rId
			time = new Date().toISOString();
		self.title = 'Types and a folder instance for a glossary';
		self.specifVersion = '0.10.8';
		self.dataTypes = [{
			id: dTid,
			title: CONFIG.dataTypeComment,
			type: "xs:string",
			maxLength: CONFIG.textThreshold,
			changedAt: time
		}];
		self.propertyClasses = [{
			id: pC1id,
			title: CONFIG.attrTypeTitle,
			dataType: dTid,		// ID of the dataType defined before
			changedAt: time
	/*	}, {
			id: genID('PC-'),
			title: attrTypeText,
			dataType: dTid,		
			changedAt: time */
		}, { 
			id: pC3id,
			title: CONFIG.attrTypeType,
			dataType: dTid,		// ID of the dataType defined before
			changedAt: time
		}];
		self.resourceClasses = [{
			id: rCid,
			title: CONFIG.spcTypeGlossary,
			description: "Comment referring to a model element ('resource' in general).",
			instantiation: ["auto"],
			propertyClasses: [pC1id,pC3id],
			changedAt: time
		}];
		self.resources = [{
			id: genID('R-'),
			title: i18n.lookup(CONFIG.spcTypeGlossary),
			class: rCid,
			properties: [{
				class: pC1id,
				value: i18n.lookup(CONFIG.spcTypeGlossary)
			}, {
				class: pC3id,
				value: CONFIG.spcTypeGlossary
			}],
			changedAt: time
		}];
		return self
	}

	// a constructor for standard types:
	function StdTypes( prj, types ) {
		// types: specif object with types to be created if not yet present.
		console.debug('StdTypes',prj,types);
		if( !prj || !types ) return null;
//		console.debug('StdTypes',prj,types);

		var self = this;
		
	/*	ToDo: REWORK
		self.available = function() {  
			// Return true if all types are available.
			// Must compare by unique name, because the id may vary.
			return containsByTitle( prj.dataTypes, types.dataTypes )
				&& containsByTitle( prj.resourceClasses, types.resourceClasses )
				&& containsByTitle( prj.statementClasses, types.statementClasses )
		};  */

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
