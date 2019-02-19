<script type="text/javascript">
/*	iLAH: Resource Filters.
	Dependencies: jQuery, bootstrap
	(C)copyright 2010-2018 enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de            
*/
// Resource filtering
	// Primary or top-level filters apply to resources of all classes (scope: project), whereas
	//    secondary filters are 'applicable', only if the corresponding resource class (scope: specType) is selected.
	// The filter lets an resource pass, if all primary filters plus all applicable secondary filters discover a match (conjunction of filter criteria).
	// The filter architecture and algorithms (filterList, filterMatch and isClogged) support any combination of filters and selections. 
	//    However, the GUI restricts the possible configurations towards more ease-of-use.
	// The filters are built dynamically based on the project's classes. 
	// If a filter for an ENUMERATION has only one option, it is omitted, as it is not useful.

/*	Have a look at some example filter descriptors similar to those built dynamically when entering the module with show():
	For example: If OT-Req is included in the filtering, all it's secondary filters (scope: OT-Req) must match, otherwise the examined resource is discarded:
		[{ 
			label: 'String Match',
			subject: 'resourceClass',
			primary: true,
			scope: 'projectId',  
			baseType: 'xs:string',
			searchString: '',
			wordBeginnings: false,
			wholeWords: false,
			caseSensitive: false,
			includeEnums: true 
		},{ 
			label: 'Resource Type',
			subject: 'resourceClass',
			primary: true,
			scope: 'projectId',  
			baseType: 'xs:enumeration',
			options: [  // example - the actual content is generated from the data model:
				{label:'Plan', id:'OT-Pln', selected:false},
				{label:'Model Element', id:'OT-MEl', selected:false},
				{label:'Requirement', id:'OT-Req', selected:false},
				{label:'Folder', id:'OT-Fld', selected:false},
				{label:'Comment', id:'OT-Cmt', selected:false}
			] 
		},{ 
			label: 'Priority',
			subject: 'propertyValue',
			primary: false,
			scope: 'OT-Req',   // this is a sub-filter for a property of a resource of type OT-Req
			attrType: 'AT-Req-Priority,
			dataType: 'DT-Priority',
			baseType: 'xs:enumeration',
			options: [  // example - the actual content is generated from the data model:
				{label:'1_high', id:'V-Req-Prio-0', selected:true},
				{label:'2_medium', id:'V-Req-Prio-1', selected:true},
				{label:'3_low', id:'V-Req-Prio-2', selected:true},
				{label:'(not assigned)', id:'', selected:true}   // catches resource properties without a value (empty value list).
			]
		},{ 
			label: 'Status',
			subject: 'propertyValue',
			primary: false,
			scope: 'OT-Req',   // this is a sub-filter for a property of a resource of type OT-Req
			attrType: 'AT-Req-Status,
			dataType: 'DT-Status',
			baseType: 'xs:enumeration',
			options: [  // example - the actual content is generated from the data model:
				{label:'00_na', id:'V-Req-Status-0', selected:true},
				{label:'00_redundant', id:'V-Req-Status-1', selected:true},
				{label:'00_rejected', id:'V-Req-Status-2', selected:true},
				{label:'10_initial', id:'V-Req-Status-3', selected:true},
				{label:'20_drafted', id:'V-Req-Status-4', selected:true},
				{label:'30_submitted', id:'V-Req-Status-5', selected:true},
				{label:'40_approved', id:'V-Req-Status-7', selected:true},
				{label:'60_completed', id:'V-Req-Status-8', selected:true},
				{label:'70_tested', id:'V-Req-Status-9', selected:true},
				{label:'80_released', id:'V-Req-Status-10', selected:true},
				{label:'90_withdrawn', id:'V-Req-Status-11', selected:true},
				{label:'(not assigned)', id:'', selected:true}  // catches resource properties without a value (empty value list).
			]
		}];
*/		
	function filterVM() {
        var self = this;
//		var returnView = null;
		self.filterList = [];  // keep the filter descriptors for display and sequential execution
		self.showSecondaryFilters = null;  // default: show resources (hit-list)

		// Standard module interface methods:
		self.init = function( cb ) {
//			if( $.isFunction(cb) ) returnView = cb;   // callback
			self.showSecondaryFilters( null )
		};
		self.clear = function() {
			self.showSecondaryFilters( null );
		//	$('#hitCount').empty();
			self.filterList.length = 0;
			specs.resources.init()
		};
		self.hide = function() {
			busy.reset()
		};
/*		// here, the only way to get out is by selecting another tab.
		function returnOnSuccess() {
			self.hide();
			self.clear();
			returnView()
		};
*/		// This is a sub-module to specs, so use its return method
		function handleError(xhr) {
			self.hide();
			self.clear();
			stdError(xhr,specs.returnToCaller)
		};

		// standard module entry:
		self.show = function( settings ) {   // optional filter settings
//			console.debug( 'filterView.show', settings );

			setContentHeight();
		//	$('#hitCount').empty();

			// build filterList from the specTypes when executed for the first time:
			if( settings || !self.filterList.length ) 
				build( settings );  

			// Now start the evaluation based on the current filter settings:
			if( isClogged() ) { 
				message.show(i18n.phrase('MsgFilterClogged') ); 
				return
			};

//			specs.updateHistory();

			// It is assumed that the cache is full upon entry.
/*			if( !myProject.selectedHierarchy.objectsLoaded || myProject.loading() ) { 
				setTimeout(function() {self.show(settings)}, 200);  // retry later
				console.info( CONFIG.objectFilter, {status: 10, statusText: 'Still loading, retry in 100 ms.'});
				return // skip operation for now
			};
*/
			// Get every resource referenced in resourceRefs and try whether it is a match.
			// If so, the resource is added to specs.resources:
			specs.resources.init();
			var pend=myProject.selectedHierarchy.flatL.length;
			if( pend<1 ) {
				busy.reset();
				return
			};

			// else update the hitlist:
			busy.set();
			$('#hitList').html( '<div class="notice-default" >'+i18n.MsgSearching+'</div>' );

//			console.debug('filter.show',myProject.selectedHierarchy.flatL);
			myProject.selectedHierarchy.flatL.forEach( function(r) {
				myProject.readContent( 'resource', {id: r} )
					.done(function(rsp) {
						// match() builds the hitlist in the background:
						if( match( rsp ) && specs.resources.values.length<CONFIG.objToShowCount+1 ) {	
							// show the first hits immediately, but avoid updating the view too often:
							$('#hitList').html( specs.resources.render() )  	
						};
						if( --pend<1 ) {  // all done
							if( specs.resources.values.length>CONFIG.objToShowCount )  
								// show the final list, unless it has been rendered already:
								$('#hitList').html( specs.resources.render() );	
							if( specs.resources.values.length<1 )  
								$('#hitList').html( '<div class="notice-default" >'+i18n.MsgNoMatchingObjects+'</div>' );	
						//	$('#hitCount').html(i18n.phrase('MsgObjectsFound',specs.resources.values.length));
							busy.reset()
						}
					})
					.fail( handleError )
			})
		};
		
		function match(obj) {
			// Return true, if 'obj' matches all applicable filter criteria ... or if no filter is active.
			// If an enumerated property is missing, the obj does NOT match.
			// Matches are appended to specs.resource.
			// all resources pass, if there is no filter.

				function matchSpecType(f) {   // primary filter applying to all resources:
					for( var j=f.options.length-1; j>-1; j--){ 
						if( f.options[j].selected && f.options[j].id === obj.specType ) return true
					};
					return false
				}
				function matchSearchString(f) {   // primary filter applying to all resources (unless it has no property with strings or text):
					if( f.searchString.length==0 ) return true;   // save the time, the regex below would finish just alike .... 

					// ToDo: Parse the search string, separate terms and run the RegEX for each ....
					let str = f.searchString.escapeRE();
					
	/*				// ToDo: escape other special characters in f.searchString:
					str = str.replace( "'", "\'" );
					str = str.replace( '"', '\"' );
					str = str.replace( '.', '\.' );
	//				str = str.replace( '(', '\(' );   // geht nicht
	//				str = str.replace( /(/g, '\(' );  // geht nicht: Problem ist nicht die Klammer selbst, sondern ein unvollständiges Klammerpaar
	//				str = str.replace( /)/g, '\)' );
	*/ 
					// ToDo: 'schlie' and 'schließ' in 'schließlich' are erroneously considered a whole word (as 'ß' is no regex word-character)
					if( f.wholeWords ) {str = '\\b'+str+'\\b'}
					else {if( f.wordBeginnings ) {str = '\\b'+str}};

					let dummy = str,   // otherwise nothing is found, no idea why.
						patt = new RegExp( str, f.caseSensitive?'':'i' ), 
						oa=null, dT=null;
					for( var a=obj.properties.length-1; a>-1; a-- ){
						oa = obj.properties[a];
						// for each obj property test whether it contains 'str':
						dT = dataTypeOf( myProject.dataTypes, sT, oa.propertyClass );
						// in case of oa we have a property 'dataType':
//						dT = itemById( myProject.dataTypes, oa.dataType );
//						console.debug('matchSearchString',f,oa,obj.properties[a],dT);
						switch( dT.type ) {
							case 'xhtml':
								if( patt.test( oa.content.stripHTML() )) return true; // if found return, continue searching, otherwise
								break;
							case 'xs:enumeration':
								// only if the filter option 'include enumerated values' is checked:
								if( f.includeEnums ) {
									oa.content = enumValStr(dT,oa);
									if( patt.test( oa.content ) ) return true  // if found return, continue searching, otherwise
								};
								break;
							default:
								if( patt.test( oa.content ) ) return true; // if found return, continue searching, otherwise
								break
						}
					};
					return false  // not found
				}
				function matchAttrValue(f) {   // secondary filter applying to resources of a certain specType
					// 'f' is 'not applicable', 
					// - if the examined 'obj' has a specType unequal to the scope of the specified filter 'f'
					if( f.scope && f.scope!=obj.specType ) return true;
					
//					console.debug( 'matchAttrValue', f, obj );

					// The filter is 'applicable': 
					// a match must be found, otherwise the filter returns 'false' (the obj will be excluded):
					switch ( f.baseType ) {
						case 'xs:enumeration':
							let oa = itemBy( obj.properties, 'propertyClass', f.attrType ), // the concerned property
								no = f.options[f.options.length-1].selected && f.options[f.options.length-1].id=='notAssigned';
							// If the resource does not have a property of the specified class,
							// it is a match only if the filter specifies 'notAssigned':
							console.debug('matchAttrValue',f,oa);
							if( !oa ) return no;
							
							// return 'true' only if there is a match between any resource property value and the specified filter option 'opt':
//							console.debug('matchAttrValue',f,oa);
							let ct = oa.content.trim(),
								cL=null, z=null, j=null;
							// works with single-valued and multiple-valued ENUMERATIONs:
							for( j=f.options.length-1; j>-1; j--) { 
								if( !f.options[j].selected ) continue;
								// try to match for every selected option (logical OR):
								if( ct.length>0 ) {
									cL = ct.split(',');	// this is a list of value ids
									// - if any selected id in the options list is contained in the property values list:
									for( z=cL.length-1; z>-1; z-- ) { 
//										console.debug( 'match', f.options[j].label, oa.valueIDs[z] );
										if( f.options[j].id==cL[z].trim() ) return true
									}
								} else {
									// the resource property has no value:
									if( f.options[j].id=='notAssigned' ) return true;
									if( f.options[j].id.length<1 ) return true
								}
							};
//							break;
//						default:
					};
					// no match has been found:
					return false
				}
				function matchAndMark( f ) {
//					console.debug( 'matchAndMark', f );
					switch( f.subject ) {
						case 'resourceClass': 
							if( matchSpecType(f) ) return obj; // don't mark in this case
							return null;
						case 'propertyValue': 
							if( matchAttrValue(f) ) return obj; // don't mark in this case, either
							return null;
	/*						if( matchAttrValue(f) ) {
								console.debug( 'attValueMatched' );
								// mark matching properties of resources within scope:
								// ToDo: correct error - in case of a DOORS project it has been observed that wrong text is marked.
								//    (very short property titles cause a marking within formatting tags, which destroys them.)
								//     Another problem exists, when a property label contains literally a filter label (=property value). Then, the property label is falsely marked.
								//     --> Don't mark within (X)HTML tags and property titles, mark only property values.
								//     --> Only mark property values which are EQUAL to the filter label.
								//     Preliminary solution: label must be longer than 4 characters, otherwise the property will not be marked.
								if( f.scope == obj.specType ) { 
									var rgxA;
									for( var o=0, O=f.options.length; o<O; o++ ) {
										if( f.options[o].selected && f.options[o].label.length>4 ) {
											rgxA = RegExp( '('+f.options[o].label+')', 'g' );

											for( var a=0, A=obj.properties.length; a<A; a++ ){
												if( f.dataType == obj.properties[a].dataType )
													mO.properties[a].content = obj.properties[a].content.replace( rgxA, function( $0, $1 ){ return '<mark>'+$1+'</mark>' } )
											}
										}
									}
								};
								return true
							}; 
							return false;
	*/					case 'textSearch': 
							if( matchSearchString(f) ) {
	//							console.debug('matchSearchString',obj);
								// mark matching strings:
								// ToDo: correct error: with option 'whole word', all findings are marked no matter it is a whole word or not. 
								//   (The hitlist is correct, but also matches within a word are marked).
								// ToDo: Similarly, when 'word beginnings only' are searched, all matches are marked, not only the word beginnings.
								// ToDo: XHTML - Don't mark within a link ... it is destroyed.
								if( f.searchString.length>0 ) {
									let rgxS = new RegExp( f.searchString, f.caseSensitive?'g':'gi' ), oa=null;
									// Clone the resource for marking the matches in the text:
									var mO = {  // marked resource
										id: obj.id,
										title: obj.title,
										specType: obj.specType,
										properties: []
										};
									for( var a=0, A=obj.properties.length; a<A; a++ ) {
										oa = obj.properties[a];
										mO.properties.push({
											title: oa.title,  // needed for sorting the property into the columns
											propertyClass: oa.propertyClass,
											content: oa.content.replace( rgxS, function( $0 ){ return '<mark>'+$0+'</mark>' } )
										})
									}; 
									return mO
								};
								return obj
							}; 
							return null
					}
				}
			
//			console.debug('match',obj);
			let sT = itemById( myProject.resourceClasses, obj.specType );

			// top-level: for the given resource, apply all filters (cycle through all elements of the filter list):
			var hit = true;
			for( var i=self.filterList.length-1; hit && i>-1; i--) { 
				// every applicable filter in the list must finish true for a match (otherwise the resource will be discarded):
				hit = matchAndMark( self.filterList[i] )
			};
			if( hit ) {
//				console.debug( 'mO', JSON.stringify( mO ));
				specs.resources.push( hit )
			};
			return !!hit
		}
		function isClogged() {
			// Return 'true', if the user's filter settings cannot produce any hit (empty hit-list due to overly restrictive settings):
			// All top level filters must allow results plus all secondary filters per selected specType
			if( !self.filterList.length ) return false;   // all resources pass, if there is no filter.
			let spcTypes = [];  // all specTypes included in the search
			function checkSpecType(f) {   // project scope applies to all resources:
				// top-level filter, at least one option must be checked:
				// This filter must be in front of depending secondary filters (to avoid a two-pass check):
				for( var j=0, J=f.options.length; j<J; j++){ 
					if( f.options[j].selected ) spcTypes.push(f.options[j].id)
				}; 
				return !spcTypes.length   // returns true, if no box is checked, i.e. the filter is clogged.
			};
			function checkPropertyValue(f) {   // 
				// 'f' is 'not applicable', if the scope of the specified filter 'f' is not contained in spcTypes:
//				console.debug( f.scope, spcTypes.indexOf(f.scope) );
				if( f.scope && spcTypes.indexOf(f.scope)<0 ) return false;  // not applicable -> not clogged

				switch( f.baseType ) {
					case 'xs:enumeration':
						for( var j=f.options.length-1; j>-1; j--){ 
							if( f.options[j].selected ) return false  // at least one checked -> not clogged
						};
						break
				};
				return true // returns true, if the filter is clogged.
			};
			
			// top-level:
			var clogged = false;  // initialize
			for( var i=self.filterList.length-1; !clogged && i>-1; i--) {   // stop iterating right away if known it is clogged.
				// 
				switch( self.filterList[i].subject ) {
					case 'resourceClass': clogged = clogged || checkSpecType(self.filterList[i]); break;
					case 'propertyValue': clogged = clogged || checkPropertyValue(self.filterList[i]); break;
					case 'textSearch': break   // cannot be clogged
				}
			};
			return clogged  // returns false, if hits are possible.
		}
		
		function addEnumValueFilters( settings ) { 
			// filter settings are like {subject: 'enumValue', tnm: 'type.title', anm: 'attr.title', values: ['title1','title2']}
//			console.debug( 'addEnumValueFilters', settings );
			
				function addEnumFilters( pre ) { 
					// This is called per resource type. 
					// Each ENUMERATION property gets a filter module:
					
					function possibleValues(attrT, vL) {
						var opts = [], v=null, V=null;
						// Look up the baseType and include all possible enumerated values:
						for( var d=0, D=myProject.dataTypes.length; d<D; d++ ) {
							if( myProject.dataTypes[d].id === attrT.dataType ) {
								for( v=0, V=myProject.dataTypes[d].values.length; v<V; v++ ) {
									var opt = {
											label:myProject.dataTypes[d].values[v].title, 
											id:myProject.dataTypes[d].values[v].id, 
											selected:true
										};
									if( vL ) { opt.selected = vL.indexOf( myProject.dataTypes[d].values[v].id )>-1 };
//									console.debug( 'opt', opt );
									opts.push( opt )
								};
								// add one more option for the case 'value not assigned':
								opts.push({ 
										label: i18n.LblNotAssigned, 
										id: 'notAssigned', 			// matches resource properties without a value (empty value list).
										selected: (!vL || vL.indexOf('notAssigned')>-1)
									}); 
								return opts  // no need to iterate the remaining dataTypes
							}
						};
						return null  // this should never happen ...
					}
					function addEnumFilter( aT, vals ) {
//						console.debug( 'addEnumFilter', aT, vals );
						
						var eVF = {};
							
						// skip, if the filter is already in the list:
						for( var i=self.filterList.length-1; i>-1; i--) {
							if ((self.filterList[i].dataType === aT.dataType) &&
								( self.filterList[i].scope === sT.id )) 
								return null;										
						};
						
						// Construct the filter descriptor and add it to the list of filters:
						eVF = { 
							label: titleOf(aT),
							subject: 'propertyValue',
							primary: false,
							scope: sT.id, 
							attrType: aT.id,
							dataType: aT.dataType,
							baseType: 'xs:enumeration'
						};
						eVF.options = possibleValues( aT, vals );
//						console.debug( 'eVF', eVF );
						self.filterList.push(eVF)
					}

					var sT = itemById( myProject.resourceClasses, pre.tid );
//					console.debug( 'sT', pre, sT );
					for( var a=0, A=sT.propertyClasses.length; a<A; a++ ) {
//						if( sT.propertyClasses[a].id == pre.aid && itemById( myProject.dataTypes, sT.propertyClasses[a].dataType ).type == 'xs:enumeration' ) {
						if( (pre.aid && sT.propertyClasses[a].id == pre.aid )   // we can assume that baseType == 'xs:enumeration'
							|| (!pre.aid && itemById( myProject.dataTypes, sT.propertyClasses[a].dataType ).type == 'xs:enumeration')) {
							addEnumFilter( sT.propertyClasses[a], pre.values )
						}
					}
				}
					
			// start working, now:
			if( settings ) {
				// for the specTypes listed in settings:
				if( settings.subject == 'enumValue' ) {
						// Add the filters for the specified specType:
						addEnumFilters( settings );
				}
/*			} else {
				// if no specType is specified, add the filters for all specTypes:
				for( var t=0, T=myProject.specTypes.length; t<T; t++ ) {
						// The switch isn't necessary, if the program is correct ... but let's make it defensive:
						switch( myProject.specTypes[t].category ) {
							case 'resourceClass':
								// add a filter for each ENUMERATION property of a 'resourceClass'
								addEnumFilters( myProject.specTypes[t] );
								break;
//							case 'statementClass': 	
//							case 'hierarchyClass':	
//								break;
//							default:				
//								// RIF types without category - no distinction between types for resources, relations and hierarchies.
						}
				}
*/			}
		};
		// Build the filter list based on the project's data model:
		function build( settings ) {
			// settings is a list with filter types and values to build a specific filter list.
//			console.debug( 'build', settings );

			self.filterList.length = 0;

				function addTextSearchFilter( pre ) {
					// pre is a resource with filter settings like {subject: 'textSearch', searchString: 'string'}
					var flt =
						{ label: i18n.LblStringMatch,  // this filter is available for all projects independently of their data-structure
						subject: 'textSearch',
						primary: true,
						scope: myProject.id,  // the project  (not quite right, because only the selected spec will be searched).
						baseType: 'xs:string',
//						baseType: ['xs:string','xhtml'],
						searchString: '',
						wordBeginnings: false,
						wholeWords: false,
						caseSensitive: false,
						includeEnums: true };
					if( pre ) {
						if( pre.searchString ) flt.searchString = pre.searchString
					};
					self.filterList.push( flt )
				};
			if( settings && Array.isArray(settings) ) {
				var idx = indexBy( settings, 'subject', 'textSearch');
				// a) include a text search module, if there is a respective element with or without preset values:
				if( idx>-1 ) 
					addTextSearchFilter( settings[idx] )
				// do not include a text search filter if there are settings without a respective entry
			} else {
				// b) include a default text search if there are no settings
				addTextSearchFilter()
			};

				function addSpecTypeFilter( pre ) {
					// add a filter with a selector for each 'resourceClass':
					// pre is a resource with filter settings like {subject: 'resourceClass', pid: 'id', values: ['title1','title2']}
//					console.debug( 'addSpecTypeFilter', pre );
					var oTF = {   // the primary filter criterion 'resource type'
							label: i18n.TabSpecTypes,
							subject: 'resourceClass',
							primary: true,
							scope: myProject.id,  // the project  (not quite right, because only the selected spec will be searched).
							baseType: 'xs:enumeration',
							options: [] 
						};
					for( var t=0, T=myProject.specTypes.length; t<T; t++ ) {
						if( CONFIG.excludedFromTypeFiltering.indexOf( myProject.specTypes[t].title )>-1 ) { continue };  // skip
						
//						console.debug( myProject.specTypes[t].title );
						switch( myProject.specTypes[t].category ) {
							case 'statementClass': 	
							case 'hierarchyClass':	
								break;
							case 'resourceClass': 		
								// Add an option for each 'resourceClass'
							default:				
								// RIF types without category - no distinction between types for resources, relations and hierarchies.
								// Add an option for each RIF SPEC-TYPE:
								// ToDo: Check which types are used for resources and include only those as options (don't show irrelevant options)
								var opt =  
									{ label: titleOf(myProject.specTypes[t]),
									id: myProject.specTypes[t].id,
									selected: true};   // set initial selection
								// if there are preset values, set the select flag accordingly:
								if( pre && pre.values ) { opt.selected = pre.values.indexOf( myProject.specTypes[t].id )>-1 };
								oTF.options.push( opt )
						}
					};

					// a filter with a single option will never exclude a resource from the hit-list (or all of them), 
					// therefore it is omitted, unless it has secondary filters:
					if( oTF.options.length>1 || self.mayHaveSecondaryFilters( oTF.options[0].id )) {
						self.filterList.push(oTF)
					}
				};
			// The specTypeFilter must be in front of all depending secondary filters:
			if( settings && Array.isArray(settings) ) {
				var idx = indexBy( settings, 'subject', 'resourceClass');
				// a) include the filter modules, if there are settings:
				if( idx>-1 ) 
					addSpecTypeFilter( settings[idx] )
				// do not include a text search filter if there are settings without a respective entry
			} else {
				// b) include a default text search if there are no settings
				addSpecTypeFilter()  
			};

/*				function addDateTimeFilter() {
				// ToDo
				};
			addDateTimeFilter();  			
*/
			// Add the secondary filters contained in the settings to the list:
			if( settings && Array.isArray(settings) ) {
				settings.forEach( function(s) {
					if( s.subject == 'enumValue' )
						addEnumValueFilters( s )
				})
			}
			// Secondary filters are also added to the list on request via addEnumValueFilters().
		}
/*		function renderSecondaryFilters() {
			var sF = '<h3>'+i18n.phrase( 'LblSecondaryFiltersForObjects', showSecondaryFilters().label )+'</h3>';
			for( var f=0,F=filterList.length; f<F; f++ ) {
				if(!filterList[f].primary && filterList[f].baseType=='xs:enumeration' && filterList[f].scope==self.showSecondaryFilters().id ) {
					sF += 	'<div class="panel panel-default panel-filter" >' +
								'<h4>'+filterList[f].label+'</h4>' +
								'<div class="form-group" >';
					for( var o=0;O=filterList[f].options.length; o<O; o++) {
						sF +=		'<div style="margin-bottom: 2px" >' +
										'<input type="checkbox" data-bind="enable: $parent.options.length>1, checked: selected" />' +
										'<span>'+filterList[f].options[o].label+'</span>' +
									'</div>'
					}
					sF += 		'</div>' +
							'</div>'
				}
			}
			return sF
		}
*/		
		self.mayHaveSecondaryFilters = function( tId ) {  // tId is resource class id
			var spT = itemById( myProject.specTypes, tId );  
			for( var i=spT.propertyClasses.length-1; i>-1; i-- ) {
				// if the class has at least one property with enums
				// ToDo: same with boolean
				if( itemById( myProject.dataTypes, spT.propertyClasses[i].dataType ).type=='xs:enumeration' ) return true
			};
			return false
		};
		self.secondaryFiltersClicked = function( oT ) {
			// toggle between the hitlist and the secondary filter settings:
//			console.debug( 'secondaryFiltersClicked', oT );
			if( self.showSecondaryFilters()==oT ) {
				self.goClicked()
			} else {
				addEnumValueFilters({subject: 'enumValue', tid: oT.id});  // tid: type-id
				self.showSecondaryFilters( oT )
			}
		};
		self.goClicked = function() {  // go!
			self.showSecondaryFilters( null );
			specs.resources.init();
			return self.show()
		};
		self.resetClicked = function() {  // reset filters!
			self.clear();
			self.show()
		};
		self.itemClicked =  function( itm ) {
//			console.debug( 'item clicked', itm );
			// Jump to the page view of the clicked resource:
			specs.showTab( CONFIG.objectDetails );  
			specs.selectNodeByRef( itm.value() )
			// changing the tree node triggers an event, by which 'self.refresh' will be called.
		};
		
		return self;
	};
	var filterView = new filterVM();
	ko.applyBindings( filterView, $('#objectFilterT')[0] );
	
</script>
/*
<div id="objectFilterT" >
	<div id="primaryFilters" class="selection" >
		<div class="primaryFilters">

	<!-- ko foreach: filterList -->
		<!-- ko if: (primary && baseType=='xs:string') -->
			<div class="panel panel-default panel-filter" >
				<h4 data-bind="html: label"></h4>
				<div class="form-group">
					<div style="margin-bottom: 8px">
						<input type="text" id="inputSearchString" data-bind="textInput: searchString" class="form-control input-sm" />
					</div>
					<div>
						<input type="checkbox" data-bind="checked: wordBeginnings"></input>
						<span data-bind="html: i18n.LblWordBeginnings"></span>
					</div>
					<div>
						<input type="checkbox" data-bind="checked: wholeWords"></input>
						<span data-bind="html: i18n.LblWholeWords"></span>
					</div>
					<div>
						<input type="checkbox" data-bind="checked: caseSensitive"></input>
						<span data-bind="html: i18n.LblCaseSensitive"></span>
					</div>
					<div>
						<input type="checkbox" data-bind="checked: includeEnums"></input>
						<span data-bind="html: i18n.LblIncludeEnums"></span>
					</div>
				</div>
			</div>
		<!-- /ko -->
		<!-- ko if: (primary && baseType=='xs:enumeration') -->
			<div class="panel panel-default panel-filter" >
				<h4 data-bind="html: label"></h4>
				<div class="form-group" >
				<!-- ko foreach: options -->
					<div style="margin-bottom: 4px" >
						<!-- ko if: $parents[1].mayHaveSecondaryFilters( id ) -->
							<button data-bind="click: function(){$parents[1].secondaryFiltersClicked( $data )}, html: i18n.IcoFilter" class="btn btn-default btn-xs pull-right" />
						<!-- /ko -->
							<input type="checkbox" data-bind="enable: $parent.options.length>1, checked: selected" />
							<span data-bind="html: label" />
					</div>
				<!-- /ko -->
				</div>
			</div>
		<!-- /ko -->
	<!-- /ko -->
		</div>
	</div>   <!--  id="primaryFilters"   -->

		<div class="btn-group btn-group-sm contentCtrl">
			<button data-bind="click: resetClicked, html: i18n.BtnFilterReset" class="btn btn-default btn-sm" ></button>
			<button data-bind="click: goClicked, html: i18n.BtnGo" class="btn btn-default btn-sm" ></button>
			<span id="hitCount" class="btn notice-default contentNotice" /> 
		</div>

	<!-- ko if: showSecondaryFilters -->
		<div id="secondaryFilters" class="content" >
				<h3 data-bind="html: i18n.phrase( 'LblSecondaryFiltersForObjects', showSecondaryFilters().label )"></h3>
		<!-- ko foreach: filterList -->
			<!-- ko if: (!primary && baseType=='xs:enumeration' && scope==$parent.showSecondaryFilters().id ) -->
				<div class="panel panel-default panel-filter" >
					<h4 data-bind="html: label"></h4>
					<div class="form-group" >
					<!-- ko foreach: options -->
						<div style="margin-bottom: 2px" >
							<input type="checkbox" data-bind="enable: $parent.options.length>1, checked: selected" />
							<span data-bind="html: label" />
						</div>
					<!-- /ko -->
					</div>
				</div>
			<!-- /ko -->
		<!-- /ko -->
		</div>  <!-- id="secondaryFilters" -->
	<!-- /ko -->
	<!-- ko ifnot: showSecondaryFilters -->
		<div id="hitList" class="content" ></div>
	<!-- /ko -->

</div>   <!-- id="objectFilterT" -->
*/