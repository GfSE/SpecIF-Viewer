/*!	iLAH: Resource Filters.
	Dependencies: jQuery, bootstrap
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	We appreciate any correction, comment or contribution!          
*/
/*	Resource filtering
	// Primary or top-level filters apply to resources of all classes (scope: project), whereas
	//    secondary filters are 'applicable', only if the corresponding resource class (scope: resourceClass) is selected.
	// The filter lets a resource pass, if all primary filters plus all applicable secondary filters discover a match (conjunction of filter criteria).
	// The filter architecture and algorithms (filterList, filterMatch and isClogged) support any combination of filters and selections. 
	//    However, the GUI restricts the possible configurations towards more ease-of-use.
	// The filters are built dynamically based on the project's classes. 
	// If a filter for an ENUMERATION has only one option, it is omitted, as it is not useful.

	Have a look at some example filter descriptors similar to those built dynamically when entering the module with show():
	For example: If OT-Req is included in the filtering, all it's secondary filters (scope: OT-Req) must match, otherwise the examined resource is discarded:
		[{ 
			title: 'String Match',
			category: 'textSearch',
			primary: true,
			scope: 'projectId',  
			baseType: 'xs:string',
			// All resources will pass, if no searchString is specified:
			searchString: '',
			options: [
				{title:'Word Beginnings', id:'wordBeginnings', checked:false},
				{title:'Whole Words', id:'wholeWords', checked:false},
				{title:'Case Sensitive', id:'caseSensitive', checked:true},
				{title:'Exclude Enums', id:'excludeEnums', checked:false}
			]
		},{ 
			title: 'Resource Class',
			category: 'resourceClass',
			primary: true,
			scope: 'projectId',  
			baseType: 'xs:enumeration',
			options: [  // example - the actual content is generated from the data model:
				// Only resources with type 'Requirement' will pass:
				{title:'Plan', id:'RC-Pln', checked:false},
				{title:'Model Element', id:'RC-MEl', checked:false},
				{title:'Requirement', id:'RC-Req', checked:true},
				{title:'Folder', id:'RC-Fld', checked:false},
				{title:'Comment', id:'RC-Cmt', checked:false}
			] 
		},{ 
			title: 'Priority',
			category: 'propertyValue',
			primary: false,
			scope: 'RC-Req',   // this is a sub-filter for a property of a resource of type OT-Req
			propClass: 'PC-Req-Priority,
			dataType: 'DT-Priority',
			baseType: 'xs:enumeration',
			options: [  // example - the actual content is generated from the data model:
				// Only resources with priority 'high' will pass:
				{title:'1_high', id:'V-Req-Prio-0', checked:true},
				{title:'2_medium', id:'V-Req-Prio-1', checked:false},
				{title:'3_low', id:'V-Req-Prio-2', checked:false},
				{title:'(not assigned)', id:'', checked:false}   // catches resource properties without a value (empty value list).
			]
		},{ 
			title: 'Status',
			category: 'propertyValue',
			primary: false,
			scope: 'RC-Req',   // this is a sub-filter for a property of a resource of type OT-Req
			propClass: 'PC-Req-Status,
			dataType: 'DT-Status',
			baseType: 'xs:enumeration',
			options: [  // example - the actual content is generated from the data model:
				// All resources will pass, so this filter is without effect:
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
}, (self)=>{
	"use strict";

	let myName = self.loadAs,
		myFullName = 'app.'+myName,
		pData = self.parent,
		prj,dta,
		displayOptions = {};
		
	self.filterList = [];  // keep the filter descriptors for display and sequential execution
	self.secondaryFilters;  // default: show resources (hit-list)

	// Construct a Regex to isolate content from XHTML-tags:
	const reA = '<a([^>]+)>([\\s\\S]*?)</a>',
		// A single comprehensive <img .../>:
		reI = '<img([^>]+)/>',
		// A single comprehensive <object .../> or tag pair <object ...>..</object>.
		// Limitation: the innerHTML may not have any tags.
		// The [^<] assures that just the single object is matched. With [\\s\\S] also nested objects match for some reason.
		reSO = '<object([^>]+)(/>|>([^<]*?)</object>)',
		// Two nested objects, where the inner is a comprehensive <object .../> or a tag pair <object ...>..</object>:
		reNO = '<object([^>]+)>[\\s]*'+reSO+'([\\s\\S]*)</object>',
		reR = '([\\s\\S]*?)('
			+	'<b>|</b>|<i>|</i>|<em>|</em>|<span[^>]*>|</span>|<br ?/>'
			+	'|<div[^>]*>|</div>|<div ?/>'
			+	'|<p[^>]*>|</p>'
			+	'|<ul[^>]*>|</ul>'
			+	'|<ol[^>]*>|</ol>'
			+	'|<li[^>]*>|</li>'
			+	'|<table[^>]*>|<thead[^>]*>|<tbody[^>]*>|<tfoot[^>]*>|<tr[^>]*>|<tr[^>]*>|<th[^>]*>|<td[^>]*>'
			+	'|</table>|</thead>|</tbody>|</tfoot>|</tr>|</tr>|</th>|</td>'
			+	'|'+reA
			+	'|'+reI
			// The nested object pattern must be checked before the single object pattern:
			+	'|'+reNO
			+	'|'+reSO
	//		+	(opts.addTitleLinks? '|'+opts.titleLinkBegin+'.+?'+opts.titleLinkEnd : '')
			+	')',
		reRun = new RegExp(reR,'g');
		
	// Standard module interface methods:
	self.init = ()=>{
//		console.debug( 'filters.init' );
		self.filterList = []
		self.secondaryFilters = undefined;

		// The left panel on this page (only for this view):
		let h = '<div id="filterLeft" class="paneLeft">'
	//		+		'<div id="clicklist" class="pane-tree" ></div>'
			+		'<div id="primaryFilters" class="pane-filter" ></div>'
			+	'</div>'
			+	'<div id="filterCtrl" class="contentCtrl" >'
			+		'<div id="navBtns" class="btn-group btn-group-sm" >'
			+			'<button class="btn btn-default" onclick="app.'+self.loadAs+'.resetClicked()" >'+i18n.BtnFilterReset+'</button>'
	//		+			'<button class="btn btn-default" onclick="app.'+self.loadAs+'.goClicked()" >'+i18n.BtnGo+'</button>'
			+		'</div>'
			+		'<div id="filterNotice" class="notice-default contentNotice" ></div>'
			+		'<div id="filterActions" class="btn-group btn-group-sm contentActions" ></div>'
			+	'</div>'
			+	'<div id="hitlist" class="content" ></div>';
		$(self.view).html( h )
	};
	self.clear = ()=>{
		self.secondaryFilters = undefined;
		$('#filterNotice').empty();
		self.filterList.length = 0;
		app.busy.reset()
	};
	self.hide = ()=>{
//		console.debug( 'filter.hide' );
		// don't delete the page with $(self.view).empty(), as the structure is built in init()
		$( '#hitlist' ).empty();
		self.clear()
	};
	function handleError(xhr) {
		self.clear();
		// This is a sub-module to specs, so use its return method:
		stdError(xhr)
	};

	// standard module entry:
	self.show = ( opts )=>{   // optional urlParams or filter settings
//		console.debug( 'filter.show', opts, self.filterList );
		if( typeof( opts ) != 'object' ) opts = {};
		prj = app.cache.selectedProject;
		dta = prj.data;
		pData.showLeft.reset();
		$('#filterNotice').empty();

        displayOptions.targetLanguage = pData.targetLanguage;
        displayOptions.lookupTitles = true;
        displayOptions.lookupValues = true;

		// build filterList from the specTypes when executed for the first time:
		if( self.filterList.length<1 || opts.filters || opts.forced ) 
			build( opts );  

		// Now start the evaluation based on the current filter settings:
		if( isClogged() ) { 
			message.show(i18n.phrase('MsgFilterClogged') ); 
			return
		};
//		console.debug('filter.show',opts,self.filterList);

		// Update browser history, if it is a view change, 
		// but not navigation in the browser history:
		if( !opts.urlParams ) 
			setUrlParams({
				project: dta.id,
				view: self.view.substr(1)	// remove leading hash
			}); 

		// Show the panels with filter settings to the left:
		let fps = '';
		self.filterList.forEach( (f)=>{
			fps += '<div class="panel panel-default panel-filter" >'
				+	'<h4>'+f.title+'</h4>';
			switch( f.baseType ) {
				case 'xs:string': 
						fps += renderTextFilterSettings( f );
						break;
				case 'xs:enumeration': 
						fps += renderEnumFilterSettings( f )
			};
			fps += '</div>'
		});
		$('#primaryFilters').html( fps );
		setTextFocus(i18n.LblStringMatch); 

		let tr = pData.tree.get();
		if( !tr || tr.length<1 ) {
		//	showNotice(i18n.MsgNoReports);
//			console.debug('filter nothing to do',tr);
			app.busy.reset();
			return true  // nothing to do ....
		};
//		console.debug('filter something to do',tr);
		doFilter();
	};

	function doFilter() {
		// Get every resource referenced in the hierarchy tree and try whether it is a match.
		app.busy.set();
	//	$('#hitlist').html( '<div class="notice-default" >'+i18n.MsgSearching+'</div>' );
		$('#hitlist').empty();

		// Iterate all hierarchies of the project to build the hitlist of resources matching all filter criteria:
		let pend=0, h, hCnt=0;
		pData.tree.iterate( 
			(nd)=>{
				pend++;
//				console.debug('tree.iterate',pend,nd.ref);
				// Read asynchronously, so that the cache has the chance to reload from the server.
				// - The sequence may differ from the hierarchy one's due to varying response times.
				// - A resource may be listed several times, if it appears several times in the hierarchies.
				prj.readContent( 'resource', {id: nd.ref} )
				.then(
					(rsp)=>{
						h = match( new Resource(rsp) );
//						console.debug('tree.iterate',self.filterList,pend,rsp,h);
						if( h )	{
							hCnt++;
							$('#hitlist').append( h.listEntry() )
						};
						if( --pend<1 ) {  // all done
							$('#filterNotice').html( '<div class="notice-default" >'+i18n.LblHitCount+': '+hCnt+'</div>' );
							app.busy.reset()
						}
					},
					handleError
				);
				return true // descend into deeper levels
			}
		)
	}
	function match(res) {
		// Return true, if 'res' matches all applicable filter criteria ... or if no filter is active.
		// Note that res is not a SpecIF resource, but an object prepared for viewing built using classifyProps()!
		// - If an enumerated property is missing, the resource does NOT match.
		// - In case all filers match, the resource is returned with marked values (if appropriate). 
		// - All resources pass, if there is no filter.

			function matchResClass(f) {   
				// primary filter applying to all resources:
				for( var j=f.options.length-1; j>-1; j--){ 
//					console.debug('matchResClass',f.options[j],res);
					if( f.options[j].checked && f.options[j].id==res.toShow['class'].id ) return true
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
				if( isChecked( f.options, 'wholeWords' )) {
					str = '\\b'+str+'\\b';
				} else {
					if( isChecked( f.options, 'wordBeginnings' )) {str = '\\b'+str};
				};
				
				let dummy = str,   // otherwise nothing is found, no idea why.
					patt = new RegExp( str, isChecked( f.options, 'caseSensitive' )? '':'i' ), 
					dT, a;
				if( matchStr( res.toShow.title, {type:'xs:string'} ) ) return true;
				for( a=res.toShow.descriptions.length-1; a>-1; a-- )
					if( matchStr( res.toShow.descriptions[a], {type:'xhtml'} ) ) return true;
				for( a=res.toShow.other.length-1; a>-1; a-- ) {
					// for each property test whether it contains 'str':
					dT = dataTypeOf( dta, res.toShow.other[a]['class'] );
//					console.debug('matchSearchString',f,res.toShow.other[a],dT,f.options);
					if( matchStr( res.toShow.other[a], dT ) ) return true;
				};
				return false;  // not found

				function matchStr( prp, dT ) {
//					console.debug('matchStr',prp,dT.type);
					switch( dT.type ) {
						case 'xs:enumeration':
							// only if enumerated values are included in the search:
							if( !isChecked( f.options, 'excludeEnums' )) {
								if( patt.test( enumValueOf(dT,prp.value,displayOptions) ) ) return true;
							};
							break;
						case 'xhtml':
						case 'xs:string':
							if( patt.test( languageValueOf(prp.value,displayOptions).stripHTML() )) return true; 
							break;
						default:
							if( patt.test( languageValueOf(prp.value,displayOptions) )) return true;
					};
				}
			}
			function matchPropValue(f) {   
				// secondary filter applying to resources of a certain resourceClass
				// 'f' is 'not applicable', 
				// - if the examined resource has a resourceClass unequal to the scope of the specified filter 'f'
				if( f.scope && f.scope!=res.toShow['class'].id ) return true;
				
//				console.debug( 'matchPropValue', f, res );

				// The filter is 'applicable': 
				// a match must be found, otherwise the filter returns 'false' (res will be excluded).
				// 
				switch ( f.baseType ) {
					case 'xs:enumeration':
						// Assuming that there is max. one property per resource with the class specified by the filter,
						// and also assuming that any property with enumerated value will only be found in the 'other' list:
						let oa = itemBy( res.toShow.other, 'class', f.propClass ), // select the concerned property by class
							no = f.options[f.options.length-1].checked && f.options[f.options.length-1].id==CONFIG.notAssigned;
						// If the resource does not have a property of the specified class,
						// it is a match only if the filter specifies CONFIG.notAssigned:
//						console.debug('matchPropValue',f,oa,no);
						if( !oa.value ) return no;
						
						// return 'true' only if there is a match between any resource property value and the specified filter option 'box':
						let ct = oa.value.trim(),
							cL, z, j;
						// works with single-valued and multiple-valued ENUMERATIONs:
						for( j=f.options.length-1; j>-1; j--) { 
							if( !f.options[j].checked ) continue;
							// try to match for every checked option (logical OR):
							if( ct.length>0 ) {
								cL = ct.split(',');	// this is a list of value ids
								// - if any selected id in the options list is contained in the property values list:
								for( z=cL.length-1; z>-1; z-- ) { 
//										console.debug( 'match', f.options[j].title, oa.valueIDs[z] );
									if( f.options[j].id==cL[z].trim() ) return true
								}
							} else {
								// the resource property has no value:
								if( f.options[j].id==CONFIG.notAssigned ) return true;
								if( f.options[j].id.length<1 ) return true
							}
						};
				//		break;
				//	default:
				};
				// no match has been found:
				return false;
			}
			function matchAndMark( f ) {
//				console.debug( 'matchAndMark', f, res.toShow.title );
				switch( f.category ) {
					case 'resourceClass': 
						if( matchResClass(f) ) return res; // don't mark in this case
						return; // undefined
					case 'propertyValue': 
//						console.debug( 'matchAndMark', f, res.toShow.title );
						if( matchPropValue(f) ) return res; // don't mark in this case, either
						return; // undefined
				/*		if( matchPropValue(f) ) {
							console.debug( 'attValueMatched' );
							// mark matching properties of resources within scope:
							// ToDo: correct error - in case of a DOORS project it has been observed that wrong text is marked.
							//    (very short property titles cause a marking within formatting tags, which destroys them.)
							//     Another problem exists, when a property title contains literally a filter title (=property value). Then, the property title is falsely marked.
							//     --> Don't mark within XHTML tags and property titles, mark only property values.
							//     --> Only mark property values which are EQUAL to the filter title.
							//     Preliminary solution: title must be longer than 4 characters, otherwise the property will not be marked.
							if( f.scope == res.toShow['class'] ) { 
								var rgxA;
								for( var o=0, O=f.options.length; o<O; o++ ) {
									if( f.options[o].checked && f.options[o].title.length>4 ) {
										rgxA = RegExp( '('+f.options[o].title+')', 'g' );

										for( var a=0, A=res.toShow.other.length; a<A; a++ ){
											if( f.dataType == res.toShow.other[a].dataType )
												mO.properties[a].value = res.toShow.other[a].value.replace( rgxA, ( $0, $1 )=>{ return '<mark>'+$1+'</mark>' } )
										}
									}
								}
							};
							return true
						}; 
						return false;  */
					case 'textSearch': 
						if( matchSearchString(f) ) {
//							console.debug('matchSearchString',f,res);
							// mark matching strings:
							// ToDo: correct error: with option 'wholeWord', all findings are marked no matter it is a whole word or not. 
							//   (The hitlist is correct, but also matches within a word are marked).
							// ToDo: Similarly, when 'word beginnings only' are searched, all matches are marked, not only the word beginnings.
							if( f.searchString.length>1 ) {  // don't mark single characters
								let rgxS = new RegExp( f.searchString.escapeRE(), isChecked( f.options, 'caseSensitive' )? 'g':'gi' ),
								    lE, i;
								
								lE = res.toShow.title;
								lE.value = mark( languageValueOf(lE.value,displayOptions), rgxS );
								// Clone the marked list elements for not modifying the original resources:
								for( i= res.toShow.descriptions.length-1; i>-1; i-- ) {
									lE = res.toShow.descriptions[i];
									res.toShow.descriptions.splice( i, 1, {
											title: lE.title,  // for sorting the property into the columns
											class: lE['class'],
											value: mark( languageValueOf(lE.value,displayOptions), rgxS )
									})
								}; 
								for( i= res.toShow.other.length-1; i>-1; i-- ) {
									lE = res.toShow.other[i];
									res.toShow.other.splice( i, 1, {
											title: lE.title,  // for sorting the property into the columns
											class: lE['class'],
											value: mark( languageValueOf(lE.value,displayOptions), rgxS )
									}); 
								};
							};
//							console.debug('hit resource',res);
							return res
						}; 
							return // undefined
				}
				
				function mark( txt, re ) {
					// Mark the txt, but spare XHTML-tags.
					
					// 1. txt is iteratively processed until the first tag or tag pair,
					//    where the text before the tag is appropriately marked,
					let markedText = '';
					txt = txt.replace( reRun, ($0,$1,$2)=>{
							// $1 is the string before ... and
							// $2 is the first identified tag or tag pair.

//							console.debug( '$0,$1,$2',$0,$1,$2 );
							// 1. mark the preceding text:
							if( $1.stripHTML().length>0 )
								$1 = $1.replace( re, ($a)=>{ return '<mark>'+$a+'</mark>' });
							markedText += $1+$2;
							// consume txt:
							return ''  
						});
					// 2. finally mark the remainder (the rest of the txt not consumed before):
					if( txt.stripHTML().length>0 )
						markedText += txt.replace( re, ($a)=>{ return '<mark>'+$a+'</mark>' });
					return markedText
				}
			}
			function isChecked( opts, id ) {
				let opt = itemById( opts, id );
				return( opt && opt.checked )
			}
		
//		console.debug('match',res);

		// Top-level: for the given resource, apply all filters (cycle through all elements of the filter list),
		// work the filterList from the beginning backwards, so that the primary filters are evaluated first.
		// 'res' accumulates all markings without changing the original resource value in the project data (cache).
		// If a filter is not passed, the result is 'undefined' and the loop is terminated.
		for( var i=0, I=self.filterList.length; res && i<I; i++) { 
			res = matchAndMark( self.filterList[i] )
		};
		return res
	}
	function isClogged() {
		// Return 'true', if the user's filter settings cannot produce any hit (empty hit-list due to overly restrictive settings):
		// All top level filters must allow results plus all secondary filters per selected resourceClass
		if( !self.filterList.length ) return false;   // all resources pass, if there is no filter.
		let rCL = [];  // all resource classes included in the search

			function checkResourceClass(f) {   // project scope applies to all resources:
				// top-level filter, at least one option must be checked:
				// This filter must be in front of depending secondary filters (to avoid a two-pass check):
				f.options.forEach( (o)=>{ 
					if( o.checked ) rCL.push(o.id)
				}); 
				return !rCL.length   // returns true, if no box is checked, i.e. the filter is clogged.
			};
			function checkPropertyValue(f) {   // 
				// 'f' is 'not applicable', if the scope of the specified filter 'f' is not contained in rCL:
//				console.debug( f.scope, simpleClone(rCL), rCL.indexOf(f.scope) );
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
		// must iterate with ascending index, because rCL is filled by checkResourceClass():
		for( var i=0, I=self.filterList.length; !clogged && i<I; i++) {   
			// stop iterating right away if known it is clogged.
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
		
			function allEnumValues(pC, vL) {
				var boxes = [], v, V;
				// Look up the baseType and include all possible enumerated values:
				for( var d=0, D=dta.dataTypes.length; d<D; d++ ) {
					if( dta.dataTypes[d].id === pC.dataType ) {
						dta.dataTypes[d].values.forEach( (v)=>{
							// the checkboxes for the secondary filter selector per enum value:
							var box = {
									title: i18n.lookup( languageValueOf( v.value, displayOptions )), 
									id: v.id, 
									checked: true
								};
							if( vL ) { box.checked = vL.indexOf( v.id )>-1 };
							boxes.push( box )
						});
						// add one more option for the case 'value not assigned':
						boxes.push({ 
								title: i18n.LblNotAssigned, 
								id: CONFIG.notAssigned, 			// matches resource properties without a value (empty value list).
								checked: (!vL || vL.indexOf(CONFIG.notAssigned)>-1)
							}); 
						return boxes  // no need to iterate the remaining dataTypes
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
						return // undefined									
				};
				
				// Construct the filter descriptor and add it to the list of filters:
				var eVF = { 
					title: titleOf(rC,displayOptions)+': '+titleOf(pC,displayOptions),
					category: 'propertyValue',
					primary: false,
					scope: rC.id, 
					propClass: pC.id,
					dataType: pC.dataType,
					baseType: 'xs:enumeration',
					options: allEnumValues( pC, vals )
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
			var rC = itemById( dta.resourceClasses, def.rCid ),
				pC;
//			console.debug( 'rC', def, rC );
			rC.propertyClasses.forEach( (pcid)=>{
				pC = itemById( dta.propertyClasses, pcid );
//				if( pcid==def.pCid && itemById( dta.dataTypes, pC.dataType ).type == 'xs:enumeration' ) {
				if( (def.pCid && pC.id==def.pCid )   // we can assume that def.pCid == 'xs:enumeration'
					|| (!def.pCid && itemById( dta.dataTypes, pC.dataType ).type=='xs:enumeration')) {
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
					scope: dta.id,
					baseType: 'xs:string',
			//		baseType: ['xs:string','xhtml'],
					searchString: pre&&pre.searchString? pre.searchString : '',
					options: [
						{ id: 'wordBeginnings', title: i18n.LblWordBeginnings, checked: pre&&pre.options.indexOf('wordBeginnings')>-1 },
						{ id: 'wholeWords', title: i18n.LblWholeWords, checked: pre&&pre.options.indexOf('wholeWords')>-1 },
						{ id: 'caseSensitive', title: i18n.LblCaseSensitive, checked: pre&&pre.options.indexOf('caseSensitive')>-1 },
						{ id: 'excludeEnums', title: i18n.LblExcludeEnums, checked: pre&&pre.options.indexOf('excludeEnums')>-1 }
					]
				};
//				console.debug('addTextSearchFilter',flt);
				self.filterList.push( flt );
			}
		if( settings && settings.filters && Array.isArray(settings.filters) ) {
			var idx = indexBy( settings.filters, 'category', 'textSearch');
			// a) include a text search module, if there is a respective element with or without preset values:
			if( idx>-1 ) 
				addTextSearchFilter( settings.filters[idx];
			// do not include a text search filter if there are settings.filters without a respective entry
		} else {
			// b) include a default text search if there is no settings.filters
			addTextSearchFilter();
		};

			function addResourceClassFilter( pre ) {
				// Add a filter with a checkbox for each 'resourceClass',
				// pre is a resource with filter settings like {category: 'resourceClass', options: ['title1','title2']}
//				console.debug( 'addResourceClassFilter', pre );
				var oTF = {   // the primary filter criterion 'resource type'
						title: i18n.TabSpecTypes,
						category: 'resourceClass',
						primary: true,
						scope: dta.id,
						baseType: 'xs:enumeration',
						options: [] 
					};
				dta.resourceClasses.forEach( ( rC )=>{
					if( CONFIG.excludedFromTypeFiltering.indexOf( rC.title )>-1 ) return;  // skip
					
					var box = { 
							title: titleOf( rC, displayOptions ),
							id: rC.id,
							checked: true
						};   // set selection by default
					// if there are preset options, set the select flag accordingly:
					if( pre && pre.options ) { 
						box.checked = pre.options.indexOf( rC.id )>-1
					};
					oTF.options.push( box );
				});
				self.filterList.push(oTF);
			}
		// The resourceClassFilter must be in front of all depending secondary filters:
		if( settings && settings.filters && Array.isArray(settings.filters) ) {
			var idx = indexBy( settings.filters, 'category', 'resourceClass');
			// a) include the filter modules, if there is a settings.filters:
			if( idx>-1 ) 
				addResourceClassFilter( settings.filters[idx] );
			// do not include a text search filter if there is a settings.filters without a respective entry
		} else {
			// b) include a default text search if there is no settings.filters
			addResourceClassFilter();
		};

/*			function addDateTimeFilter() {
			// ToDo
			};
		addDateTimeFilter();  			
*/
		// Add the secondary filters contained in the settings.filters to the list:
		if( settings && settings.filters && Array.isArray(settings.filters) ) {
			settings.filters.forEach( (s)=>{
				if( s.category == 'enumValue' )
					addEnumValueFilters( s );
			})
		};
		// Secondary filters are also added to the list on request via addEnumValueFilters().
	}
/*	function mayHaveSecondaryFilters( rCid ) {  // rCid is resource class id
		// Check if a resourceClass (or statementClass ) has a property with enumerated values,
		// so that a secondary facet filter can be built
	//	var rC = itemById( dta.allClasses, rCid ),
		var rC = itemById( dta.resourceClasses, rCid ),
			pC;  
		for( var i=rC.propertyClasses.length-1; i>-1; i-- ) {
			// if the class has at least one property with enums
			// ToDo: same with boolean
			pC = itemById( dta.propertyClasses, rC.propertyClasses[i] );
			if( itemById( dta.dataTypes, pC.dataType ).type=='xs:enumeration' ) return true
		};
		return false
	}; */
	function renderTextFilterSettings( flt ) {
		// render a single panel for text search settings:
		return textField( {label:flt.title,display:'none'}, flt.searchString, 'line', myFullName+'.goClicked()' )
			+	renderEnumFilterSettings( flt );
	}
	function renderEnumFilterSettings( flt ) {
		// render a single panel for enum filter settings:
		return checkboxField( {label:flt.title,display:'none',classes:''}, flt.options, {handle:myFullName+'.goClicked()'} );
	}
	function getTextFilterSettings( flt ) {
		return { category: flt.category, searchString: textValue(flt.title), options: checkboxValues(flt.title) };
	}
	self.goClicked = ()=>{  // go!
		self.secondaryFilters = undefined;

		// read filter settings and update the filterlist:
		self.filterList.forEach( (f)=>{
			let checkedL = checkboxValues(f.title);
			switch( f.category ) {
				case 'textSearch': 
					f.searchString = textValue(f.title);
					// no break
				case 'resourceClass':
				case 'propertyValue':
					f.options.forEach( (o)=> {
						o.checked = checkedL.indexOf( o.id )>-1
					});
			};
		});
//		console.debug( 'goClicked', self.filterList, fL );
		doFilter();
	};
	self.resetClicked = ()=>{  
		// reset filters:
		self.clear();
		self.show();
	};
/*	self.secondaryFiltersClicked = ( oT )={
		// toggle between the hitlist and the secondary filter settings:
//		console.debug( 'secondaryFiltersClicked', oT );
		if( self.secondaryFilters==oT ) {
			self.goClicked()
		} else {
			addEnumValueFilters({category: 'enumValue', rCid: oT.id});  // rCid: type-id
			self.secondaryFilters = oT
		}
	};
	self.itemClicked =  ( itm )=>{
//		console.debug( 'item clicked', itm );
		// Jump to the page view of the clicked resource:
		pData.showTab( CONFIG.objectDetails );  
		pData.selectNodeByRef( itm.value() )
		// changing the tree node triggers an event, by which 'self.refresh' will be called.
	}; 
*/	
	return self;
});
