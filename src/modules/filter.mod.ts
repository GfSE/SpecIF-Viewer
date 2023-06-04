/*!	iLAH: Resource Filters.
	Dependencies: jQuery, bootstrap
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/
/*	Resource filtering
	// Primary or top-level filters apply to resources of all classes (scope: project), whereas
	//    secondary filters are 'applicable', only if the corresponding resource class (scope: resourceClass) is selected.
	// The filter lets a resource pass, if all primary filters plus all applicable secondary filters discover a match (conjunction of filter criteria).
	// The filter architecture and algorithms (filters, filterMatch and isClogged) support any combination of filters and selections. 
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
			// All resources will pass, if no searchString is specified:
			searchString: '',
			options: [
				{title:'Word Beginnings', id:'wordBeginnings', checked:false},
				{title:'Whole Words', id:'wholeWords', checked:false},
				{title:'Case Sensitive', id:'caseSensitive', checked:true}
			//	{title:'Exclude Enums', id:'excludeEnums', checked:false}
			]
		},{ 
			title: 'Resource Class',
			category: 'resourceClass',
			primary: true,
			scope: 'projectId',  
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
			category: 'enumValue',
			primary: false,
			scope: 'RC-Req',   // this is a sub-filter for a property of a resource of type RC-Req
			propClass: 'PC-Req-Priority,
			dataType: 'DT-Priority',
			options: [  // example - the actual content is generated from the data model:
				// Only resources with priority 'high' will pass:
				{title:'1_high', id:'V-Req-Prio-0', checked:true},
				{title:'2_medium', id:'V-Req-Prio-1', checked:false},
				{title:'3_low', id:'V-Req-Prio-2', checked:false},
				{title:'(not assigned)', id:'', checked:false}   // catches resource properties without a value (empty value list).
			]
		},{ 
			title: 'Status',
			category: 'enumValue',
			primary: false,
			scope: 'RC-Req',   // this is a sub-filter for a property of a resource of type OT-Req
			propClass: 'PC-Req-Status',
			dataType: 'DT-Status',
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
enum FilterCategory {
	textSearch = 'textSearch',
	resourceClass = 'resourceClass',
	enumValue = 'enumValue'
}
enum SearchOption {
	wordBeginnings = 'wordBeginnings',
	wholeWords = 'wholeWords',
	caseSensitive = 'caseSensitive'
//	excludeEnums = 'excludeEnums'
}
interface IFilter {
	title: string,
	category: FilterCategory,
	primary: boolean,
	scope: string,     
	propClass?: SpecifKey,
	dataType?: SpecifKey,
	searchString?: string,
	options?: IBox[]
}
// Limitation: Works only, if a project does not use multiple revisions of a resourceClass and propertyClass:
interface IFilterDefinition {
	category: FilterCategory,
	rCk?: SpecifKey,
	pCk?: SpecifKey,
	selected: SpecifId[]		// enumeration.id or resourceClass.id
}

moduleManager.construct({
	name: CONFIG.objectFilter
}, (self: IModule) => {

	let myName = self.loadAs,
		myFullName = 'app.' + myName,
		selPrj: CProject,
		cData: CCache,
		displayOptions: any;

	self.filters = [];  // keep the filter descriptors for display and sequential execution
	self.secondaryFilters;  // default: show resources (hit-list)

	// Construct a Regex to isolate content from XHTML-tags:
	const
		// A single comprehensive <img .../>:
	//	reI = '<img ([^>]+)/>',
		// A single comprehensive <object .../> or tag pair <object ...>..</object>.
		// Limitation: the innerHTML may not have any tags.
		// The [^<] assures that just the single object is matched. With [\\s\\S] also nested objects match for some reason.
	//	reSO = '<object ([^>]+)(/>|>([^<]*?)</object>)',
		// Two nested objects, where the inner is a comprehensive <object .../> or a tag pair <object ...>..</object>:
	//	reNO = '<object ([^>]+)>[\\s]*' + reSO + '([\\s\\S]*)</object>',
		reR = '([\\s\\S]*?)('
			+ '<b>|</b>|<i>|</i>|<em>|</em>|<span[^>]*>|</span>|<br ?/>'
			+ '|<div[^>]*>|</div>|<div ?/>'
			+ '|<p[^>]*>|</p>'
			+ '|<ul[^>]*>|</ul>'
			+ '|<ol[^>]*>|</ol>'
			+ '|<li[^>]*>|</li>'
			+ '|<table[^>]*>|<thead[^>]*>|<tbody[^>]*>|<tfoot[^>]*>|<tr[^>]*>|<tr[^>]*>|<th[^>]*>|<td[^>]*>'
			+ '|</table>|</thead>|</tbody>|</tfoot>|</tr>|</tr>|</th>|</td>'
			+ '|' + tagA
			+ '|' + tagImg
			// The nested object pattern must be checked before the single object pattern:
			+ '|' + tagNO
			+ '|' + tagSO
			//		+	(opts.addTitleLinks? '|'+opts.titleLinkBegin+'.+?'+opts.titleLinkEnd : '')
			+ ')',
		reRun = new RegExp(reR, 'g');

	// Standard module interface methods:
	self.init = (): boolean => {
		//		console.debug( 'filters.init' );
		self.filters = [];
		self.secondaryFilters = undefined;

		// The left panel on this page (only for this view):
		let h = '<div id="filterLeft" class="paneLeft">'
			//		+		'<div id="clicklist" class="pane-tree" ></div>'
			+ '<div id="primaryFilters" class="pane-filter" ></div>'
			+ '</div>'
			+ '<div id="filterCtrl" class="contentCtrl" >'
			+ '<div class="btn-group" >'
			+ '<button class="btn btn-default" onclick="app.' + self.loadAs + '.resetClicked()" >' + i18n.BtnFilterReset + '</button>'
			+ '</div>'
			+ '<div id="filterNotice" class="notice-default contentNotice" ></div>'
			//		+		'<div id="filterActions" class="btn-group contentActions" ></div>'
			+ '</div>'
			+ '<div id="hitlist" class="content" style="padding-top:44px"></div>';
		$(self.view).html(h);
		return true;
	};
	self.clear = (): void => {
		self.secondaryFilters = undefined;
		$('#filterNotice').empty();
		self.filters.length = 0;
		app.busy.reset();
	};
	self.hide = (): void => {
		//		console.debug( 'filter.hide' );
		// don't delete the page with $(self.view).empty() to preserve the structure built in init()
		$('#hitlist').empty();
		self.clear();
	};
	function handleError(xhr: xhrMessage): void {
		self.clear();
		// This is a sub-module to specs, so use its return method:
		LIB.stdError(xhr);
	};

	// standard module entry:
	self.show = (opts?: any): void => {   // optional urlParams or filter settings
//		console.debug( 'filter.show', opts, self.filters );
		$('#filterNotice').empty();

		selPrj = app.projects.selected;
		cData = selPrj.cache;

		if (typeof (opts) != 'object') opts = {};
		displayOptions = {
		//	lookupTitles: true,
		//	lookupValues: true,
			targetLanguage: selPrj.language
		};

		// build filter list from the specTypes when executed for the first time:
		if (self.filters.length < 1 || opts.filters || opts.forced)
			build(opts);

		// Now start the evaluation based on the current filter settings:
		if (isClogged()) {
			message.show(i18n.lookup('MsgFilterClogged'));
			return;
		};
//		console.debug('filter.show',opts,self.filters);

		// Update browser history, if it is a view change, 
		// but not navigation in the browser history:
		if (!opts.urlParams)
			setUrlParams({
				project: selPrj.id,
				view: self.view.substr(1)	// remove leading hash
			});

		// Show the panels with filter settings to the left:
		self.parent.showLeft.set(false);
		let fps = '';
		for (var f of self.filters) {
			fps += '<div class="panel panel-default panel-filter" >'
				+ '<h4>' + f.title + '</h4>';
			switch (f.category) {
				case FilterCategory.textSearch:
					fps += renderTextFilterSettings(f);
					break;
				case FilterCategory.resourceClass:
				case FilterCategory.enumValue:
					fps += renderEnumFilterSettings(f);
			};
			fps += '</div>';
		};
		$('#primaryFilters').html(fps);
		setFocus(i18n.LblStringMatch);

		let tr = self.parent.tree.get();
		if (!tr || tr.length < 1) {
			//	showNotice(i18n.MsgNoReports);
			//			console.debug('filter nothing to do',tr);
			app.busy.reset();
			return;  // nothing to do ...
		};
		//		console.debug('filter something to do',tr);
		doFilter();
	};

	function doFilter(): void {
		// Get every resource referenced in the hierarchy tree and try whether it is a match.
		app.busy.set();
		//	$('#hitlist').html( '<div class="notice-default" >'+i18n.MsgSearching+'</div>' );
		$('#hitlist').empty();

		// Iterate all hierarchies of the project to build the hitlist of resources matching all filter criteria:
		let pend = 0, h: CResourceToShow, hitCnt = 0;
		self.parent.tree.iterate(
			(nd: jqTreeNode) => {
				pend++;
//				console.debug('tree.iterate',pend,nd.ref);
				// Read asynchronously, so that the cache has the chance to reload from the server.
				// - The sequence may differ from the hierarchy one's due to varying response times.
				// - A resource may be listed several times, if it appears several times in the hierarchies.
				selPrj.readItems('resource', [nd.ref])
					.then(
						(rL) => {
							h = match(new CResourceToShow(rL[0] as SpecifResource));
//							console.debug('tree.iterate',self.filters,pend,rsp[0],h);
							if (h) {
								hitCnt++;
								$('#hitlist').append(h.listEntry());
							};
							if (--pend < 1) {  // all done
								$('#filterNotice').html('<div class="notice-default" >' + i18n.LblHitCount + ': ' + hitCnt + '</div>');
								app.busy.reset();
							}
						},
						handleError
					);
				return true; // descend into deeper levels
			}
		);
	}
	function match(res: CResourceToShow): CResourceToShow {
		// Return true, if 'res' matches all applicable filter criteria ... or if no filter is active.
		// Note that res is not a SpecIF resource, but an object prepared for viewing built using classifyProps()!
		// - If an enumerated property is missing, the resource does NOT match.
		// - In case all filers match, the resource is returned with marked values (if appropriate). 
		// - All resources pass, if there is no filter.

			function matchResClass(f: IFilter): boolean {
				// primary filter applying to all resources:
				// @ts-ignore . in this case it is defined
				for (var o of f.options) {
//					console.debug('matchResClass',f.options[j],res);
					if (o.checked && o.id == res['class'].id) return true;
				};
				return false;
			}
			function matchSearchString(f: IFilter): boolean {   // primary filter applying to all resources (unless it has no property with strings or text):
				// @ts-ignore . in this case it is defined
				if (f.searchString.length == 0) return true;   // save the time, the regex below would finish just alike ....

				// ToDo: Parse the search string, separate terms and run the RegEX for each ....
				// @ts-ignore . in this case it is defined
				let str = f.searchString.escapeRE();

				/*				// ToDo: escape other special characters in f.searchString:
								str = str.replace( "'", "\'" );
								str = str.replace( '"', '\"' );
								str = str.replace( '.', '\.' );
				//				str = str.replace( '(', '\(' );   // geht nicht
				//				str = str.replace( /(/g, '\(' );  // geht nicht: Problem ist nicht die Klammer selbst, sondern ein unvollständiges Klammerpaar
				//				str = str.replace( /)/g, '\)' );
				*/
				// ToDo: 'schlie' and 'lich' in 'schließlich' are erroneously considered a whole word (as 'ß' is no regex word-character)
				//       Similarly any Umlaut.
				if (isChecked(f.options, SearchOption.wholeWords)) {
					str = '\\b' + str + '\\b';
				}
				else if (isChecked(f.options, SearchOption.wordBeginnings))
					str = '\\b' + str;

				let // dummy = str,   // otherwise nothing is found, no idea why.
					patt = new RegExp(str, isChecked(f.options, SearchOption.caseSensitive) ? '' : 'i'),
					p: CPropertyToShow;

				// Remember: As CPropertyToShow, all enumerated values of p have already been looked up ...
				if (matchStr(res.title,res.rC.isHeading)) return true;
				for (p of res.descriptions)
					if (matchStr(p)) return true;
				for (p of res.other) {
					// for each property test whether it contains 'str':
//					console.debug('matchSearchString',f,res.other[a],dT,f.options);
					if (matchStr(p)) return true;
				};
				return false;  // not found

				function matchStr(prp: CPropertyToShow, isHeading?:boolean): boolean {
//					console.debug('matchStr',prp,prp.get());
					// In case of a title, the value shall only be looked up in case of a heading
					// - Certain folder titles are specified with a vocabulary term --> lookup
					// - In case of an ontology, term titles *are* vocabulary terms --> do not look up
					let localOptions = simpleClone(displayOptions);
				//	localOptions.lookupValues = isHeading || prp.pC.title != CONFIG.propClassTitle;

					return patt.test(prp.get(localOptions));
				}
			}
			function matchPropValue(f: IFilter): boolean {
				// secondary filter applying to resources of a certain resourceClass
				// 'f' is 'not applicable', 
				// - if the examined resource has a resourceClass unequal to the scope of the specified filter 'f'
				if (f.scope && f.scope != res['class'].id) return true;

//				console.debug( 'matchPropValue', f, res );

				// The filter is 'applicable': 
				// a match must be found, otherwise the filter returns 'false' (res will be excluded).
				switch (f.category) {
					case FilterCategory.enumValue:
						// Assuming that there is max. one property per resource with the class specified by the filter,
						// and also assuming that any property with enumerated value will only be found in the 'other' list:

						// select the concerned resource property by class:
						let rp = LIB.referenceItemBy(res.other, 'class', f.propClass);

						// If the resource does not have a property of the specified class,
						// it is a match only if the filter specifies CONFIG.notAssigned:
//						console.debug('matchPropValue',f,rp,no);
						if (!rp || rp.values.length < 1)
							return f.options[f.options.length - 1].checked && f.options[f.options.length - 1].id == CONFIG.notAssigned;

						// return 'true' only if there is a match between any resource property value and the specified filter option 'box':
					//	let v;
						// works with single-valued and multiple-valued ENUMERATIONs:
						// @ts-ignore . in this case it is defined
						for (var o of f.options) {
							if (o.checked && rp.enumIdL.includes(o.id)) return true;
					/*		if (!o.checked) continue;
							// try to match for every checked option (logical OR):
							for (v of rp.enumIdL) {
//								console.debug( 'match', f.options[j].title, oa.valueIDs[z] );
								if (o.id == v) return true;
							}; */

					/*		if (rp.values.length > 0) {
								// - if any selected id in the options list is contained in the property values list:
								for (v of rp.values) {
//									console.debug( 'match', f.options[j].title, rp.valueIDs[z] );
									if (o.id == LIB.displayValueOf(v)) return true;
								};
							}
							else {
								// the resource property has no value:
								if (o.id == CONFIG.notAssigned) return true;
								if (o.id.length < 1) return true;
							};  */
						};
					//		break;
					//	default:
				};
				// no match has been found:
				return false;
			}
			function matchAndMark(f: IFilter) {
//				console.debug( 'matchAndMark', f, res.title );
				switch (f.category) {
					case FilterCategory.resourceClass:
						if (matchResClass(f)) return res; // don't mark in this case
						return; // undefined
					case FilterCategory.enumValue:
//						console.debug( 'matchAndMark', f, res.title );
						if (matchPropValue(f)) return res; // don't mark in this case, either
						return; // undefined
					/*	if( matchPropValue(f) ) {
//							console.debug( 'attValueMatched' );
							// mark matching properties of resources within scope:
							// ToDo: correct error - in case of a DOORS project it has been observed that wrong text is marked.
							//    (very short property titles cause a marking within formatting tags, which destroys them.)
							//     Another problem exists, when a property title contains literally a filter title (=property value). Then, the property title is falsely marked.
							//     --> Don't mark within XHTML tags and property titles, mark only property values.
							//     --> Only mark property values which are EQUAL to the filter title.
							//     Preliminary solution: title must be longer than 4 characters, otherwise the property will not be marked.
							if( f.scope == res['class'] ) { 
								var rgxA;
								for( var o=0, O=f.options.length; o<O; o++ ) {
									if( f.options[o].checked && f.options[o].title.length>4 ) {
										rgxA = RegExp( '('+f.options[o].title+')', 'g' );

										for( var a=0, A=res.other.length; a<A; a++ ){
											if( f.dataType == res.other[a].dataType )
												mO.properties[a].value = res.other[a].value.replace( rgxA, ( $0, $1 )=>{ return '<mark>'+$1+'</mark>' } )
										}
									}
								}
							};
							return true;
						}; 
						return false;  */
					case FilterCategory.textSearch:
						if (matchSearchString(f)) {
//							console.debug('matchSearchString',f,res);
							// mark matching strings:
							// ToDo: correct error: with option 'wholeWord', all findings are marked no matter it is a whole word or not. 
							//   (The hitlist is correct, but also matches within a word are marked).
							// ToDo: Similarly, when 'word beginnings only' are searched, all matches are marked, not only the word beginnings.
							// @ts-ignore . in this case it is defined
							if (f.searchString.length > 2) {  // don't mark very short substrings
								// @ts-ignore - in this case it is defined
								let rgxS = new RegExp(f.searchString.escapeRE(), isChecked(f.options, SearchOption.caseSensitive) ? 'g' : 'gi');

								res.title.values = markValL(res.title, rgxS, res.rC.isHeading);
								res.descriptions = res.descriptions.map((rp: CPropertyToShow) => {
									rp.values = markValL(rp, rgxS);
									return rp;
									/*	return new CPropertyToShow({
											class: rp['class'],
											values: markValL(rp.values, rgxS)
										}); */
								});
								res.other = res.other.map((rp: CPropertyToShow) => {
									rp.values = markValL(rp, rgxS);
									return rp;
									/*	return new CPropertyToShow({
											class: rp['class'],
											values: markValL(rp.values,rgxS)
										}); */
								});
							};
//							console.debug('hit resource',res);
							return res;
						};
				};
				return; // undefined

				function markValL(prp:CPropertyToShow, re: RegExp, isHeading?:boolean): SpecifValues {
					//	return [LIB.makeMultiLanguageValue(mark(LIB.languageTextOf(valL[0], displayOptions), re))];
					let mV:string;
					return prp.values.map((v) => {
						// In case of a title, the value shall only be looked up in case of a heading
						// - Certain folder titles are specified with a vocabulary term --> lookup
						// - In case of an ontology, term titles *are* vocabulary terms --> do not look up
						let localOptions = simpleClone(displayOptions);
					//	localOptions.lookupValues = isHeading || prp.pC.title != CONFIG.propClassTitle;

						mV = mark(LIB.displayValueOf(v, localOptions), re);
						return prp.dT.type == SpecifDataTypeEnum.String ? LIB.makeMultiLanguageValue(mV) : mV;
					});

						function mark(txt: string, re: RegExp): string {
							// Mark the txt, but spare XHTML-tags.

							// 1. txt is iteratively processed until the first tag or tag pair,
							//    where the text before the tag is appropriately marked,
							let markedText = '';
							// @ts-ignore - $0 is not used, but must me declared anyhow.
							txt = txt.replace(reRun, ($0, $1, $2) => {
								// $1 is the string before ... and
								// $2 is the first identified tag or tag pair.

//								console.debug( '$0,$1,$2',$0,$1,$2 );
								// 1. mark the preceding text:
								if ($1.stripHTML().length > 0)
									$1 = $1.replace(re, ($a:string) => { return '<mark>' + $a + '</mark>' });
								markedText += $1 + $2;
								// consume txt:
								return ''
							});
							// 2. finally mark the remainder (the rest of the txt not consumed before):
							if (txt.stripHTML().length > 0)
								markedText += txt.replace(re, ($a) => { return '<mark>' + $a + '</mark>' });
							return markedText
						}
				}
			}
			function isChecked( opts:any, id:SearchOption ):boolean {
				let opt = LIB.itemById( opts, id );
				return( opt && opt.checked )
			}
		
//		console.debug('match',res);

		// Top-level: for the given resource, apply all filters (cycle through all elements of the filter list),
		// work the filter list from the beginning backwards, so that the primary filters are evaluated first.
		// 'res' accumulates all markings without changing the original resource value in the project data (cache).
		// If a filter is not passed, the result is 'undefined' and the loop is terminated.
		for (var i = 0, I = self.filters.length; res && i < I; i++) {
			res = matchAndMark(self.filters[i]);
		};
		return res;
	}
	function isClogged():boolean {
		// Return 'true', if the user's filter settings cannot produce any hit (empty hit-list due to overly restrictive settings):
		// All top level filters must allow results plus all secondary filters per selected resourceClass
		if( !self.filters.length ) return false;   // all resources pass, if there is no filter.
		let rCL:string[] = [];  // all resource classes included in the search

			function checkResourceClass(f:IFilter):boolean {   // project scope applies to all resources:
				// top-level filter, at least one option must be checked:
				// This filter must be in front of depending secondary filters (to avoid a two-pass check):
				// @ts-ignore . in this case it is defined
				for( var o of f.options ) {
					if( o.checked ) rCL.push(o.id);
				}; 
				return !rCL.length;   // returns true, if no box is checked, i.e. the filter is clogged.
			};
			function checkPropertyValue(f:IFilter):boolean {   // 
				// 'f' is 'not applicable', if the scope of the specified filter 'f' is not contained in rCL:
//				console.debug( f.scope, simpleClone(rCL), rCL.indexOf(f.scope) );
				if( f.scope && rCL.indexOf(f.scope)<0 ) return false;  // not applicable -> not clogged

				switch (f.category) {
					case FilterCategory.enumValue:
						// @ts-ignore . in this case it is defined
						for( var o of f.options ) {
							if( o.checked ) return false  // at least one checked -> not clogged
						};
					//	break;
				};
				return true; // returns true, if the filter is clogged.
			};
		
		// top-level:
		var clogged = false;  // initialize
		// must iterate with ascending index, because rCL is filled by checkResourceClass():
		for( var f of self.filters ) {   
			// stop iterating right away if known it is clogged.
			switch( f.category ) {
				case FilterCategory.resourceClass: clogged = clogged || checkResourceClass(f); break;
			//	case FilterCategory.statementClass: ....
				case FilterCategory.enumValue: clogged = clogged || checkPropertyValue(f);
			//	FilterCategory.textSearch cannot contribute to clogging
			};
		};
		return clogged;  // returns false, if hits are possible.
	}

	function addEnumValueFilters(def: IFilterDefinition): void {
		// def is like {category: 'enumValue', rCk: resourceClass-key, pCk: propertyClass-key, selected: ['chapterTitle','objectTitle']}
//		console.debug( 'addEnumValueFilters', def );

			function allEnumValues(pC: SpecifPropertyClass, vL: SpecifId[]) {
				var boxes: IBox[] = [],
					dT = cData.get( "dataType", [LIB.makeKey(pC.dataType)])[0] as SpecifDataType;
				// Include all possible enumerated values:
				if (dT && Array.isArray(dT.enumeration)) {
					for( var v of dT.enumeration ) {
						// the checkboxes for the secondary filter selector per enum value:
					/*	var box: IBox = {
								title: i18n.lookup( LIB.languageTextOf( v.value, displayOptions )), 
								id: v.id,
								checked: vL.includes(v.id)
					//			checked: true
							};
					//	if( vL ) { box.checked = vL.includes( v.id ) };
						boxes.push( box ) */
						boxes.push({
							title: i18n.lookup(LIB.languageTextOf(v.value, displayOptions)),
							id: v.id,
							checked: vL.includes(v.id)
						})
					};
					// add one more option for the case 'value not assigned':
					boxes.push({ 
							title: i18n.LblNotAssigned, 
							id: CONFIG.notAssigned, 			// matches resource properties without a value (empty value list).
							checked: (!vL || vL.includes(CONFIG.notAssigned))
						}); 
					return boxes;  // no need to iterate the remaining dataTypes
				};
				throw Error("Invalid Data: Missing or malformed dataType");
			}
			function addEnumFilter( rC:SpecifResourceClass, pC:SpecifPropertyClass, vals:SpecifId[] ):void {
//				console.debug( 'addEnumFilter', aT, vals );
				
				// skip, if the filter is already in the list:
				for( var f of self.filters ) {
					if (( f.dataType==pC.dataType )
						&& ( f.scope==rC.id )) 
						return // undefined									
				};
				
				// Construct the filter descriptor and add it to the list of filters:
				var eVF: IFilter = {
					title: LIB.titleOf(rC,displayOptions)+': '+LIB.titleOf(pC,displayOptions),
					category: FilterCategory.enumValue,
					primary: false,
					scope: rC.id, 
					propClass: LIB.keyOf(pC),
					dataType: pC.dataType,
					options: allEnumValues( pC, vals )
				};
//				console.debug( 'eVF', eVF );
				self.filters.push(eVF)
			}
				
		// start working, now:
		if (def && def.category == FilterCategory.enumValue ) {
			// Add the filters for the specified resourceClass:
			// def.category: 'enumValue' translates to filter list.category: 'enumValue'
//			console.debug('addEnumValueFilters',def);
			// This is called per resourceClass. 
			// Each ENUMERATION property gets a filter module:
			var rC = cData.get("resourceClass", [def.rCk])[0] as SpecifResourceClass,
				pC: SpecifPropertyClass;
//			console.debug( 'rC', def, rC );
			rC.propertyClasses.forEach( (pck)=>{
				pC = cData.get("propertyClass", [pck] )[0] as SpecifPropertyClass;
				if ((def.pCk && LIB.references(def.pCk,pC))   // we can assume that def.pCk is an enumeration
					|| (!def.pCk && (cData.get("dataType", [pC.dataType])[0] as SpecifDataType).enumeration)) {
					addEnumFilter( rC, pC, def.selected )
				};
			});
		};
	}
	// Build the filter list based on the project's data model:
	function build( settings?:any ):void {
		// settings is a list with filter types and options to build a specific filter list.
//		console.debug( 'build', settings );

		self.filters.length = 0;

			function addTextSearchFilter( pre?:any ) {
				// pre is a resource with filter settings like {category: 'textSearch', searchString: 'string'}
				var flt:IFilter = {
					title: i18n.LblStringMatch,  // this filter is available for all projects independently of their data-structure
					category: FilterCategory.textSearch,
					primary: true,
					scope: selPrj.id,
					searchString: pre&&pre.searchString? pre.searchString : '',
					options: [
						{ id: SearchOption.wordBeginnings, title: i18n.LblWordBeginnings, checked: pre && pre.options.indexOf(SearchOption.wordBeginnings)>-1 },
						{ id: SearchOption.wholeWords, title: i18n.LblWholeWords, checked: pre && pre.options.indexOf(SearchOption.wholeWords)>-1 },
						{ id: SearchOption.caseSensitive, title: i18n.LblCaseSensitive, checked: pre && pre.options.indexOf(SearchOption.caseSensitive)>-1 }
			//			{ id: SearchOption.excludeEnums, title: i18n.LblExcludeEnums, checked: pre&&pre.options.indexOf(SearchOption.excludeEnums)>-1 }
					]
				};
//				console.debug('addTextSearchFilter',flt);
				self.filters.push( flt );
			}
		if( settings && settings.filters && Array.isArray(settings.filters) ) {
			var idx = LIB.indexBy(settings.filters, 'category', FilterCategory.textSearch);
			// a) include a text search module, if there is a respective element with or without preset values:
			if( idx>-1 ) 
				addTextSearchFilter( settings.filters[idx]);
			// do not include a text search filter if there are settings.filters without a respective entry
		}
		else {
			// b) include a default text search if there is no settings.filters
			addTextSearchFilter();
		};

			function addResourceClassFilter( pre?:any ):void {
				// Add a filter with a checkbox for each 'resourceClass',
				// pre is a resource with filter settings like {category: 'resourceClass', options: ['chapterTitle','objectTitle']}
				//				console.debug( 'addResourceClassFilter', pre );
				var oTF: IFilter = {   // the primary filter criterion 'resource type'
						title: i18n.TabSpecTypes,
						category: FilterCategory.resourceClass,
						primary: true,
						scope: selPrj.id,
						options: [] 
				};
				(cData.get("resourceClass", selPrj.resourceClasses) as SpecifResourceClass[]).forEach((rC) => {
					if (	!CONFIG.excludedFromTypeFiltering.includes(rC.title)
						&& (!Array.isArray(rC.instantiation) || rC.instantiation.includes(SpecifInstantiation.Auto) || rC.instantiation.includes(SpecifInstantiation.User))) {
						oTF.options.push({
							title: LIB.titleOf(rC, displayOptions),
							id: rC.id,
							// if there are preset options, set the select flag accordingly:
							checked: (pre && pre.selected) ? pre.selected.indexOf(rC.id) > -1 : true
						});
					}
				});
				self.filters.push(oTF);
			}
		// The resourceClassFilter must be in front of all depending secondary filters:
		if( settings && settings.filters && Array.isArray(settings.filters) ) {
			var idx = LIB.indexBy(settings.filters, 'category', FilterCategory.resourceClass);
			// a) include the filter modules, if there is a settings.filters:
			if( idx>-1 ) 
				addResourceClassFilter( settings.filters[idx] );
			// do not include a text search filter if there is a settings.filters without a respective entry
		}
		else {
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
			(settings.filters as IFilterDefinition[]).forEach( (s)=>{
				if (s.category == FilterCategory.enumValue )
					addEnumValueFilters( s );
			})
		};
	}
/*	function mayHaveSecondaryFilters( rCk ) {  // rCk is resource class key
		// Check if a resourceClass (or statementClass ) has a property with enumerated values,
		// so that a secondary facet filter can be built
		var rC = itemByKey( cData.resourceClasses, rCk ),
			pC;  
		for( var i=rC.propertyClasses.length-1; i>-1; i-- ) {
			// if the class has at least one property with enums
			// ToDo: same with boolean
			pC = itemById( cData.propertyClasses, rC.propertyClasses[i] );
			if( itemById( cData.dataTypes, pC.dataType ).type=='xs:enumeration' ) return true
		};
		return false
	}; */
	function renderTextFilterSettings( flt:IFilter ):string {
		// render a single panel for text search settings:
		return makeTextField(flt.title, flt.searchString, { tagPos:'none', typ:'line', handle:myFullName+'.goClicked()'} )
			+	renderEnumFilterSettings( flt );
	}
	function renderEnumFilterSettings( flt:IFilter ):string {
		// render a single panel for enum filter settings:
		return makeCheckboxField(flt.title, flt.options, { tagPos:'none', classes:'',handle:myFullName+'.goClicked()'} );
	}
/*	function getTextFilterSettings( flt ) {
		return { category: flt.category, searchString: textValue(flt.title), options: checkboxValues(flt.title) };
	} */
	self.goClicked = ():void =>{  // go!
		self.secondaryFilters = undefined;

		// read filter settings and update the filterlist:
		self.filters.forEach( (f:IFilter)=>{
			switch( f.category ) {
				case FilterCategory.textSearch:
					f.searchString = textValue(f.title);
					// no break
				case FilterCategory.resourceClass:
				case FilterCategory.enumValue:
					let checkedL = checkboxValues(f.title);
					f.options.forEach( (o)=> {
						o.checked = checkedL.includes( o.id );
					});
			};
		});
//		console.debug( 'goClicked', self.filters, fL );
		doFilter();
	};
	self.resetClicked = ():void =>{  
		// reset filters:
		self.clear();
		self.show();
	};
/*	self.secondaryFiltersClicked = ( oT )=>{
		// toggle between the hitlist and the secondary filter settings:
//		console.debug( 'secondaryFiltersClicked', oT );
		if( self.secondaryFilters==oT ) {
			self.goClicked()
		} 
		else {
			addEnumValueFilters({category: FilterCategory.enumValue, rCk: LIB.keyOf(oT)});  // rCk: resourceClass key
			self.secondaryFilters = oT;
		}
	};
	self.itemClicked =  ( itm )=>{
//		console.debug( 'item clicked', itm );
		// Jump to the page view of the clicked resource:
		self.parent.showTab( CONFIG.objectDetails );  
		self.parent.selectNodeByRef( itm.value() );
		// changing the tree node triggers an event, by which 'self.refresh' will be called.
	}; 
*/	
	return self;
});
