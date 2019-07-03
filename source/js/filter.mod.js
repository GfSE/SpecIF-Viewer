/*	iLAH: Resource Filters.
	Dependencies: jQuery, bootstrap
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de            
*/
// Resource filtering
	// Primary or top-level filters apply to resources of all classes (scope: project), whereas
	//    secondary filters are 'applicable', only if the corresponding resource class (scope: resourceClass) is selected.
	// The filter lets a resource pass, if all primary filters plus all applicable secondary filters discover a match (conjunction of filter criteria).
	// The filter architecture and algorithms (filterList, filterMatch and isClogged) support any combination of filters and selections. 
	//    However, the GUI restricts the possible configurations towards more ease-of-use.
	// The filters are built dynamically based on the project's classes. 
	// If a filter for an ENUMERATION has only one option, it is omitted, as it is not useful.

/*	Have a look at some example filter descriptors similar to those built dynamically when entering the module with show():
	For example: If OT-Req is included in the filtering, all it's secondary filters (scope: OT-Req) must match, otherwise the examined resource is discarded:
		[{ 
			title: 'String Match',
			category: 'textSearch',
			primary: true,
			scope: 'projectId',  
			baseType: 'xs:string',
			searchString: '',
			wordBeginnings: false,
			wholeWords: false,
			caseSensitive: false,
			excludeEnums: false 
		},{ 
			title: 'Resource Class',
			category: 'resourceClass',
			primary: true,
			scope: 'projectId',  
			baseType: 'xs:enumeration',
			options: [  // example - the actual content is generated from the data model:
				{title:'Plan', id:'OT-Pln', checked:false},
				{title:'Model Element', id:'OT-MEl', checked:false},
				{title:'Requirement', id:'OT-Req', checked:false},
				{title:'Folder', id:'OT-Fld', checked:false},
				{title:'Comment', id:'OT-Cmt', checked:false}
			] 
		},{ 
			title: 'Priority',
			category: 'propertyValue',
			primary: false,
			scope: 'OT-Req',   // this is a sub-filter for a property of a resource of type OT-Req
			propClass: 'AT-Req-Priority,
			dataType: 'DT-Priority',
			baseType: 'xs:enumeration',
			options: [  // example - the actual content is generated from the data model:
				{title:'1_high', id:'V-Req-Prio-0', checked:true},
				{title:'2_medium', id:'V-Req-Prio-1', checked:true},
				{title:'3_low', id:'V-Req-Prio-2', checked:true},
				{title:'(not assigned)', id:'', checked:true}   // catches resource properties without a value (empty value list).
			]
		},{ 
			title: 'Status',
			category: 'propertyValue',
			primary: false,
			scope: 'OT-Req',   // this is a sub-filter for a property of a resource of type OT-Req
			propClass: 'AT-Req-Status,
			dataType: 'DT-Status',
			baseType: 'xs:enumeration',
			options: [  // example - the actual content is generated from the data model:
				{title:'00_na', id:'V-Req-Status-0', checked:true},
				{title:'00_redundant', id:'V-Req-Status-1', checked:true},
				{title:'00_rejected', id:'V-Req-Status-2', checked:true},
				{title:'10_initial', id:'V-Req-Status-3', checked:true},
				{title:'20_drafted', id:'V-Req-Status-4', checked:true},
				{title:'30_submitted', id:'V-Req-Status-5', checked:true},
				{title:'40_approved', id:'V-Req-Status-7', checked:true},
				{title:'60_completed', id:'V-Req-Status-8', checked:true},
				{title:'70_tested', id:'V-Req-Status-9', checked:true},
				{title:'80_released', id:'V-Req-Status-10', checked:true},
				{title:'90_withdrawn', id:'V-Req-Status-11', checked:true},
				{title:'(not assigned)', id:'', checked:true}  // catches resource properties without a value (empty value list).
			]
		}];
*/		
modules.construct({
	name: CONFIG.objectFilter
}, function(self) {
	"use strict";
//	var returnView = null;
	self.filterList = [];  // keep the filter descriptors for display and sequential execution
	self.secondaryFilters = null;  // default: show resources (hit-list)

	// Standard module interface methods:
	self.init = function( cb ) {
//		console.debug( 'filters.init' );
//		if( $.isFunction(cb) ) returnView = cb;   // callback
		self.secondaryFilters = undefined;

/*		<div class="btn-group btn-group-sm contentCtrl">
			<button data-bind="click: resetClicked, html: i18n.BtnFilterReset" class="btn btn-default btn-sm" ></button>
			<button data-bind="click: goClicked, html: i18n.BtnGo" class="btn btn-default btn-sm" ></button>
			<span id="hitCount" class="btn notice-default contentNotice" /> 
		</div>*/
		
		// the left panel on this page (only for this view):
		let h = '<div class="paneLeft">'
	//		+		'<div id="clicklist" class="pane-tree" />'
			+		'<div id="primaryFilters" class="pane-filter" />'
			+	'</div>'
			+	'<div class="contentCtrl" >'
			+		'<div id="navBtns" class="btn-group btn-group-sm" >'
			+			'<button class="btn btn-default" onclick="app.filter.resetClicked()" >'+i18n.BtnFilterReset+'</button>'
			+			'<button class="btn btn-default" onclick="app.filter.goClicked()" >'+i18n.BtnGo+'</button>'
			+		'</div>'
			+		'<div id="contentNotice" class="notice-default sscontentNotice" />'
			+		'<div id="contentActions" class="btn-group btn-group-sm contentActions" />'
			+	'</div>'
			+	'<div id="hitlist" class="content" />';
		$(self.view).html( h );

	/*	// controls whether the left panel shows the hitlist or the filters:
		self.showTree = new State({
			showWhenSet: ['#filters'],
			hideWhenSet: ['#clicklist']
		});  */
	};
	self.clear = function() {
		self.secondaryFilters = undefined;
	//	$('#hitCount').empty();
		self.filterList.length = 0;
		app.specs.resources.init()
	};
	self.hide = function() {
		app.busy.reset()
	};
/*	// here, the only way to get out is by selecting another tab.
	function returnOnSuccess() {
		self.hide();
		self.clear();
		returnView()
	};
*/	// This is a sub-module to specs, so use its return method
	function handleError(xhr) {
		self.hide();
		self.clear();
		stdError(xhr,app.specs.returnToCaller)
	};

	// standard module entry:
	self.show = function( settings ) {   // optional filter settings
//		console.debug( 'filters.show', settings );

		setContentHeight();
	//	$('#hitCount').empty();

		// build filterList from the specTypes when executed for the first time:
		if( settings&&settings.defs || self.filterList.length<1 ) 
			build( settings );  

		// Now start the evaluation based on the current filter settings:
		if( isClogged() ) { 
			message.show(i18n.phrase('MsgFilterClogged') ); 
			return
		};
//		console.debug('filters.show',settings,self.filterList);

		// Show the panels with filter settings to the left:
		let fps = '';
		self.filterList.forEach( function(f) {
			fps += '<div class="panel panel-default panel-filter" >'
				+	'<h4>'+f.title+'</h4>';
			switch( f.baseType ) {
				case 'xs:string': 
						fps += 	renderTextFilterSettings( f );
						break;
				case 'xs:enumeration': 
						fps += 	renderEnumFilterSettings( f )
			};
			fps += '</div>'
		});
		$('#primaryFilters').html( fps );

//		app.specs.updateHistory();

		// Get every resource referenced in the hierarchy tree and try whether it is a match.
		// If so, the resource is added to app.specs.resources:
		let tr = app.specs.tree.get();
		if( !tr || tr.length<1 ) {
		//	showNotice(i18n.MsgNoReports);
			app.busy.reset();
			return true  // nothing to do ....
		};

		// else update the hitlist:
		app.specs.resources.init();
		app.busy.set();
		$('#hitList').html( '<div class="notice-default" >'+i18n.MsgSearching+'</div>' );
		let pend = 0;
		app.specs.tree.iterate( function(nd) {
			// Read asynchronously, so that the cache has the chance to reload from the server.
			pend++;
//			console.debug('tree.iterate',pend,nd.ref);
			app.cache.readContent( 'resource', {id: nd.ref} )
				.done(function(rsp) {
					// match() builds the hitlist (app.specs.resources) in the background:
					if( match( rsp ) && app.specs.resources.values.length<CONFIG.objToShowCount ) {	
						// show the first hits immediately, but avoid updating the view too often:
						$('#hitlist').html( app.specs.resources.render() )  	
					};
					if( --pend<1 ) {  // all done
						if( app.specs.resources.values.length>CONFIG.objToShowCount )  
							// show the final list, unless it has been rendered already:
							$('#hitlist').html( app.specs.resources.render() );	
						if( app.specs.resources.values.length<1 )  
							$('#hitlist').html( '<div class="notice-default" >'+i18n.MsgNoMatchingObjects+'</div>' );	
					//	$('#hitCount').html(i18n.phrase('MsgObjectsFound',app.specs.resources.values.length));
						app.busy.reset()
					}
				})
				.fail( handleError );
			return true // descend into deeper levels
		})
	};
	
	function match(res) {
		// Return true, if 'res' matches all applicable filter criteria ... or if no filter is active.
		// If an enumerated property is missing, the resource does NOT match.
		// Matches are appended to app.specs.resource.
		// all resources pass, if there is no filter.

			function matchResClass(f) {   
				// primary filter applying to all resources:
				for( var j=f.options.length-1; j>-1; j--){ 
//					console.debug('matchResClass',f,f.options[j]);
					if( f.options[j].checked && f.options[j].id==res['class'] ) return true
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
				for( var a=res.properties.length-1; a>-1; a-- ){
					oa = res.properties[a];
					// for each property test whether it contains 'str':
					dT = dataTypeOf( app.cache, oa['class'] );
					// in case of oa we have a property 'dataType':
//					dT = itemById( app.cache.dataTypes, oa.dataType );
//					console.debug('matchSearchString',f,oa,dT);
					switch( dT.type ) {
						case 'xhtml':
							if( patt.test( oa.value.stripHTML() )) return true; // if found return, continue searching, otherwise
							break;
						case 'xs:enumeration':
							// only if enumerated values are included in the search:
							if( !f.excludeEnums ) {
								if( patt.test( enumValStr(dT,oa) ) ) return true  // if found return, continue searching, otherwise
							};
							break;
						default:
							if( patt.test( oa.value ) ) return true; // if found return, continue searching, otherwise
							break
					}
				};
				return false  // not found
			}
			function matchPropValue(f) {   
				// secondary filter applying to resources of a certain resourceClass
				// 'f' is 'not applicable', 
				// - if the examined resource has a resourceClass unequal to the scope of the specified filter 'f'
				if( f.scope && f.scope!=res['class'] ) return true;
				
//				console.debug( 'matchPropValue', f, res );

				// The filter is 'applicable': 
				// a match must be found, otherwise the filter returns 'false' (res will be excluded):
				switch ( f.baseType ) {
					case 'xs:enumeration':
						let oa = itemBy( res.properties, 'class', f.propClass ), // the concerned property
							no = f.options[f.options.length-1].checked && f.options[f.options.length-1].id=='notAssigned';
						// If the resource does not have a property of the specified class,
						// it is a match only if the filter specifies 'notAssigned':
//						console.debug('matchPropValue',f,oa,no);
						if( !oa ) return no;
						
						// return 'true' only if there is a match between any resource property value and the specified filter option 'opt':
						let ct = oa.value.trim(),
							cL=null, z=null, j=null;
						// works with single-valued and multiple-valued ENUMERATIONs:
						for( j=f.options.length-1; j>-1; j--) { 
							if( !f.options[j].checked ) continue;
							// try to match for every checked option (logical OR):
							if( ct.length>0 ) {
								cL = ct.split(',');	// this is a list of value ids
								// - if any selected id in the options list is contained in the property values list:
								for( z=cL.length-1; z>-1; z-- ) { 
//									console.debug( 'match', f.options[j].title, oa.valueIDs[z] );
									if( f.options[j].id==cL[z].trim() ) return true
								}
							} else {
								// the resource property has no value:
								if( f.options[j].id=='notAssigned' ) return true;
								if( f.options[j].id.length<1 ) return true
							}
						};
//						break;
//					default:
				};
				// no match has been found:
				return false
			}
			function matchAndMark( f ) {
//				console.debug( 'matchAndMark', f );
				switch( f.category ) {
					case 'resourceClass': 
						if( matchResClass(f) ) return hit; // don't mark in this case
						return undefined;
					case 'propertyValue': 
						if( matchPropValue(f) ) return hit; // don't mark in this case, either
						return undefined;
/*						if( matchPropValue(f) ) {
							console.debug( 'attValueMatched' );
							// mark matching properties of resources within scope:
							// ToDo: correct error - in case of a DOORS project it has been observed that wrong text is marked.
							//    (very short property titles cause a marking within formatting tags, which destroys them.)
							//     Another problem exists, when a property title contains literally a filter title (=property value). Then, the property title is falsely marked.
							//     --> Don't mark within (X)HTML tags and property titles, mark only property values.
							//     --> Only mark property values which are EQUAL to the filter title.
							//     Preliminary solution: title must be longer than 4 characters, otherwise the property will not be marked.
							if( f.scope == res['class'] ) { 
								var rgxA;
								for( var o=0, O=f.options.length; o<O; o++ ) {
									if( f.options[o].checked && f.options[o].title.length>4 ) {
										rgxA = RegExp( '('+f.options[o].title+')', 'g' );

										for( var a=0, A=res.properties.length; a<A; a++ ){
											if( f.dataType == res.properties[a].dataType )
												mO.properties[a].value = res.properties[a].value.replace( rgxA, function( $0, $1 ){ return '<mark>'+$1+'</mark>' } )
										}
									}
								}
							};
							return true
						}; 
						return false;
*/					case 'textSearch': 
						if( matchSearchString(f) ) {
//							console.debug('matchSearchString',f,res);
							// mark matching strings:
							// ToDo: correct error: with option 'whole word', all findings are marked no matter it is a whole word or not. 
							//   (The hitlist is correct, but also matches within a word are marked).
							// ToDo: Similarly, when 'word beginnings only' are searched, all matches are marked, not only the word beginnings.
							// ToDo: XHTML - Don't mark within a link ... it is destroyed.
							if( f.searchString.length>0 ) {
								let rgxS = new RegExp( f.searchString, f.caseSensitive?'g':'gi' );
								// Clone the resource for marking the matches in the text:
								var mO = {  // marked resource
									id: hit.id,
									title: hit.title,
									class: hit['class'],
									properties: []
									};
								hit.properties.forEach( function( hP ) {
									mO.properties.push({
										title: hP.title,  // for sorting the property into the columns
										class: hP['class'],
										value: hP.value.replace( rgxS, function( $0 ){ return '<mark>'+$0+'</mark>' } )
									})
								}); 
//								console.debug(mO)
								return mO
							};
							return hit
						}; 
						return undefined
				}
			}
		
//		console.debug('match',res);

		// Top-level: for the given resource, apply all filters (cycle through all elements of the filter list),
		// work the filterList from the beginning backwards, so that the primary filters are evaluated first.
		// 'hit' accumulates all markings without changing the original resource 'res'.
		// If a filter is not passed, the result is 'undefined' and the loop is terminated.
		var hit = res;
		for( var i=0,I=self.filterList.length; typeof(hit)!='undefined' && i<I; i++) { 
			hit = matchAndMark( self.filterList[i] )
//			console.debug( 'hit', i, hit );
		};
		if( hit ) {
			// Add the marked resource to the result list for display,
			// but avoid duplicate entries:
			if( !app.specs.resources.exists(hit.id) )
				app.specs.resources.push( hit )
		};
		return !!hit
	}
	function isClogged() {
		// Return 'true', if the user's filter settings cannot produce any hit (empty hit-list due to overly restrictive settings):
		// All top level filters must allow results plus all secondary filters per selected resourceClass
		if( !self.filterList.length ) return false;   // all resources pass, if there is no filter.
		let rCL = [];  // all resource classes included in the search

			function checkResourceClass(f) {   // project scope applies to all resources:
				// top-level filter, at least one option must be checked:
				// This filter must be in front of depending secondary filters (to avoid a two-pass check):
				f.options.forEach( function(o) { 
					if( o.checked ) rCL.push(o.id)
				}); 
				return !rCL.length   // returns true, if no box is checked, i.e. the filter is clogged.
			};
			function checkPropertyValue(f) {   // 
				// 'f' is 'not applicable', if the scope of the specified filter 'f' is not contained in rCL:
//				console.debug( f.scope, rCL.indexOf(f.scope) );
				if( f.scope && rCL.indexOf(f.scope)<0 ) return false;  // not applicable -> not clogged

				switch( f.baseType ) {
					case 'xs:enumeration':
						for( var j=f.options.length-1; j>-1; j--){ 
							if( f.options[j].checked ) return false  // at least one checked -> not clogged
						};
						break
				};
				return true // returns true, if the filter is clogged.
			};
		
		// top-level:
		var clogged = false;  // initialize
		for( var i=self.filterList.length-1; !clogged && i>-1; i--) {   // stop iterating right away if known it is clogged.
			switch( self.filterList[i].category ) {
				case 'resourceClass': clogged = clogged || checkResourceClass(self.filterList[i]); break;
			//	case 'statementClass': ....
				case 'propertyValue': clogged = clogged || checkPropertyValue(self.filterList[i]); 
			//	'textSearch' cannot contribute to clogging
			}
		};
		return clogged  // returns false, if hits are possible.
	}
	
	function addEnumValueFilters( def ) { 
		// def is like {category: 'enumValue', rCid: 'resourceClass.title', pCid: 'propertyClass.title', values: ['title1','title2']}
//		console.debug( 'addEnumValueFilters', def );
		
			function possibleValues(pC, vL) {
				var opts = [], v=null, V=null;
				// Look up the baseType and include all possible enumerated values:
				for( var d=0, D=app.cache.dataTypes.length; d<D; d++ ) {
					if( app.cache.dataTypes[d].id === pC.dataType ) {
						app.cache.dataTypes[d].values.forEach( function(v) {
							var opt = {
									title: v.value, 
									id: v.id, 
									checked: true
								};
							if( vL ) { opt.checked = vL.indexOf( v.id )>-1 };
//							console.debug( 'opt', opt );
							opts.push( opt )
						});
						// add one more option for the case 'value not assigned':
						opts.push({ 
								title: i18n.LblNotAssigned, 
								id: 'notAssigned', 			// matches resource properties without a value (empty value list).
								checked: (!vL || vL.indexOf('notAssigned')>-1)
							}); 
						return opts  // no need to iterate the remaining dataTypes
					}
				};
				return null  // this should never happen ...
			}
			function addEnumFilter( rC, pC, vals ) {
//				console.debug( 'addEnumFilter', aT, vals );
				
				// skip, if the filter is already in the list:
				for( var i=self.filterList.length-1; i>-1; i--) {
					if (( self.filterList[i].dataType==pC.dataType )
						&& ( self.filterList[i].scope==rC.id )) 
						return undefined									
				};
				
				// Construct the filter descriptor and add it to the list of filters:
				var eVF = { 
					title: titleOf(rC)+': '+titleOf(pC),
					category: 'propertyValue',
					primary: false,
					scope: rC.id, 
					propClass: pC.id,
					dataType: pC.dataType,
					baseType: 'xs:enumeration',
					options: possibleValues( pC, vals )
				};
//				console.debug( 'eVF', eVF );
				self.filterList.push(eVF)
			}
				
		// start working, now:
		if( def && def.category=='enumValue' ) {
			// Add the filters for the specified resourceClass:
			// def.category: 'enumValue' translates to filterList.category: 'propertyValue' && filterlist.baseType: 'xs.enumeration'
//			console.debug('addEnumValueFilters',def);
			// This is called per resourceClass. 
			// Each ENUMERATION property gets a filter module:
			var rC = itemById( app.cache.resourceClasses, def.rCid ),
				pC;
//			console.debug( 'rC', def, rC );
			rC.propertyClasses.forEach( function(pcid) {
				pC = itemById( app.cache.propertyClasses, pcid );
//				if( pcid==def.pCid && itemById( app.cache.dataTypes, pC.dataType ).type == 'xs:enumeration' ) {
				if( (def.pCid && pC.id==def.pCid )   // we can assume that def.pCid == 'xs:enumeration'
					|| (!def.pCid && itemById( app.cache.dataTypes, pC.dataType ).type=='xs:enumeration')) {
					addEnumFilter( rC, pC, def.options )
				}
			})
		}
	};
	// Build the filter list based on the project's data model:
	function build( settings ) {
		// settings is a list with filter types and options to build a specific filter list.
//		console.debug( 'build', settings );

		self.filterList.length = 0;

			function addTextSearchFilter( pre ) {
				// pre is a resource with filter settings like {category: 'textSearch', searchString: 'string'}
				var flt = {
					title: i18n.LblStringMatch,  // this filter is available for all projects independently of their data-structure
					category: 'textSearch',
					primary: true,
					scope: app.cache.id,
					baseType: 'xs:string',
			//		baseType: ['xs:string','xhtml'],
					searchString: pre&&pre.searchString? pre.searchString : '',
					wordBeginnings: pre&&pre.options.indexOf('wordBeginnings')>-1,
					wholeWords: pre&&pre.options.indexOf('wholeWords')>-1,
					caseSensitive: pre&&pre.options.indexOf('caseSensitive')>-1,
					excludeEnums: pre&&pre.options.indexOf('excludeEnums')>-1 
				};
//				console.debug('addTextSearchFilter',flt);
				self.filterList.push( flt )
			}
		if( settings && settings.defs && Array.isArray(settings.defs) ) {
			var idx = indexBy( settings.defs, 'category', 'textSearch');
			// a) include a text search module, if there is a respective element with or without preset values:
			if( idx>-1 ) 
				addTextSearchFilter( settings.defs[idx] )
			// do not include a text search filter if there are settings.defs without a respective entry
		} else {
			// b) include a default text search if there is no settings.defs
			addTextSearchFilter()
		};

			function addResourceClassFilter( pre ) {
				// Add a filter with a selector for each 'resourceClass',
				// pre is a resource with filter settings like {category: 'resourceClass', options: ['title1','title2']}
//				console.debug( 'addResourceClassFilter', pre );
				var oTF = {   // the primary filter criterion 'resource type'
						title: i18n.TabSpecTypes,
						category: 'resourceClass',
						primary: true,
						scope: app.cache.id,
						baseType: 'xs:enumeration',
						options: [] 
					};
				app.cache.resourceClasses.forEach( function( rC ) {
					if( CONFIG.excludedFromTypeFiltering.indexOf( rC.title )>-1 ) return;  // skip
					
//					console.debug( rC.title );
					var opt =  
						{ title: titleOf(rC),
						id: rC.id,
						checked: true};   // set selection by default
					// if there are preset options, set the select flag accordingly:
					if( pre && pre.options ) { 
						opt.checked = pre.options.indexOf( rC.id )>-1
					};
					oTF.options.push( opt )
				});

				// a filter with a single option will never exclude a resource from the hit-list (or all of them), 
				// therefore it is omitted, unless it has secondary filters:
				if( oTF.options.length>1 || mayHaveSecondaryFilters( oTF.options[0].id )) {
					self.filterList.push(oTF)
				}
			}
		// The resourceClassFilter must be in front of all depending secondary filters:
		if( settings && settings.defs && Array.isArray(settings.defs) ) {
			var idx = indexBy( settings.defs, 'category', 'resourceClass');
			// a) include the filter modules, if there is a settings.defs:
			if( idx>-1 ) 
				addResourceClassFilter( settings.defs[idx] )
			// do not include a text search filter if there is a settings.defs without a respective entry
		} else {
			// b) include a default text search if there is no settings.defs
			addResourceClassFilter()  
		};

/*			function addDateTimeFilter() {
			// ToDo
			};
		addDateTimeFilter();  			
*/
		// Add the secondary filters contained in the settings.defs to the list:
		if( settings && settings.defs && Array.isArray(settings.defs) ) {
			settings.defs.forEach( function(s) {
				if( s.category == 'enumValue' )
					addEnumValueFilters( s )
			})
		}
		// Secondary filters are also added to the list on request via addEnumValueFilters().
	}
	function mayHaveSecondaryFilters( rCid ) {  // rCid is resource class id
		var rC = itemById( app.cache.allClasses, rCid ),
			pC;  
		for( var i=rC.propertyClasses.length-1; i>-1; i-- ) {
			// if the class has at least one property with enums
			// ToDo: same with boolean
			pC = itemById( app.cache.propertyClasses, rC.propertyClasses[i] );
			if( itemById( app.cache.dataTypes, pC.dataType ).type=='xs:enumeration' ) return true
		};
		return false
	};
	function renderTextFilterSettings( flt ) {
		// render a single panel for text search settings:
		return textInput( {label:flt.title,display:'none'}, flt.searchString, 'line' )
			+	checkboxInput( {label:flt.title,display:'none',classes:''}, [
					{ title: i18n.LblWordBeginnings, id: 'wordBeginnings', checked: flt.wordBeginnings },
					{ title: i18n.LblWholeWords, id: 'wholeWords', checked: flt.wholeWords },
					{ title: i18n.LblCaseSensitive, id: 'caseSensitive', checked: flt.caseSensitive },
					{ title: i18n.LblExcludeEnums, id: 'excludeEnums', checked: flt.excludeEnums } 
				])
	}
	function renderEnumFilterSettings( flt ) {
		// render a single panel for enum filter settings:
		return checkboxInput( {label:flt.title,display:'none',classes:''}, flt.options )
	}
	function getTextFilterSettings( flt ) {
		return { category: flt.category, searchString: textValue(flt.title), options: checkboxValues(flt.title) }
	}
	function getEnumFilterSettings( flt ) {
	/*	let resL = checkboxValues(flt.title);
		flt.options.forEach( function (o) {
			o.checked = resL.indexOf( o.id )>-1
		}) */
//		console.debug( resL, flt );
		return checkboxValues(flt.title)
	}
	self.goClicked = function() {  // go!
		self.secondaryFilters = undefined;
		app.specs.resources.init();

		// read filter settings:
		var fL = [];
		self.filterList.forEach( function(f) {
			switch( f.category ) {
				case 'textSearch': 
					fL.push( getTextFilterSettings( f ) );
					break;
				case 'resourceClass':
					fL.push({category: f.category, options: getEnumFilterSettings( f )}) 
					break;
				case 'propertyValue':
					// def.category: 'enumValue' translates to filterList.category: 'propertyValue' && filterlist.baseType: 'xs:enumeration'
					fL.push({category: 'enumValue', rCid: f.scope, pCid: f.propClass, options: getEnumFilterSettings( f )})  // rCid: type-id
			}	
		});
//		console.debug( 'goClicked', self.filterList, fL );
		// don't need newView, as it is already shown:
		return self.show( { defs:fL } )
	};
	self.resetClicked = function() {  
		// reset filters:
		self.clear();
		self.show()
	};
/*	self.secondaryFiltersClicked = function( oT ) {
		// toggle between the hitlist and the secondary filter settings:
//		console.debug( 'secondaryFiltersClicked', oT );
		if( self.secondaryFilters==oT ) {
			self.goClicked()
		} else {
			addEnumValueFilters({category: 'enumValue', rCid: oT.id});  // rCid: type-id
			self.secondaryFilters = oT
		}
	};
	self.itemClicked =  function( itm ) {
//		console.debug( 'item clicked', itm );
		// Jump to the page view of the clicked resource:
		app.specs.showTab( CONFIG.objectDetails );  
		app.specs.selectNodeByRef( itm.value() )
		// changing the tree node triggers an event, by which 'self.refresh' will be called.
	}; 
*/	
	return self
});
