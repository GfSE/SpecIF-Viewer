/*!	SpecIF Class-based Reports.
	Dependencies: jQuery, bootstrap
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/
/*	The report descriptors for display, two examples:
		{	title: 'Anforderung: Priorit&auml;t',
			category: 'resourceClass',
			scaleMin: 0,
			scaleMax: 120,
			datasets: [
				{ label: 'low', count: 80, color: CONFIG.focusColor } ,	
				{ label: 'medium', count: 120, color: '#1f72c3' },	
				{ label: 'high', count: 40, color: '#1a48aa' }
			]
		},
		{	title: 'Anforderung: Status',
			category: 'enumValue',
			scaleMin: 0,
			scaleMax: 1000,
			datasets: [
				{ label: '30_vorgelegt', count: 245, color: CONFIG.focusColor } ,	
				{ label: '40_genehmigt', count: 12, color: '#1f72c3' },	
				{ label: '60_fertig', count: 890, color: '#1a48aa' },
				{ label: '80_freigegeben', count: 180, color: '#000000' }
			]
		},	 ...

	The server or the server interface lib is responsible for analysing the project and for collecting the data.
*/		

/* Limitations:
 * - Works only, if a project does not use multiple revisions of a resourceClass and propertyClass
 */
interface ReportDataset {
	label: string,
	id: string,
	count: number,
	color: string
}
interface Report {
	title: string,
	category: FilterCategory,
	pid: string,
	rCk?: SpecifKey,
	pCk?: SpecifKey,
	scaleMin: number,
	scaleMax: number,
	datasets: ReportDataset[]
}

moduleManager.construct({
	name: CONFIG.reports
}, function(self:IModule) {
	"use strict";
	var selPrj: CProject;
	self.list = [];  // the list of reports

	// Standard module interface methods:
	self.init = function() {
//		console.debug('reports.init');
		self.list = []
	};
	self.clear = function() {
		self.list = [];
		app.busy.reset()
	};
	self.hide = function() {
//		console.debug( 'reports.hide' );
		$(self.view).empty();
		self.clear()
	};
	function handleError(xhr: xhrMessage): void {
		self.hide();
		self.clear();
		// This is a sub-module to specs, so use its return method:
		LIB.stdError(xhr,self.parent.returnToCaller)
	}
	function showNotice(txt:string) {
		$('#'+CONFIG.reports).html('<div class="notice-default" >'+txt+'</div>');
	}

	// standard module entry:
	self.show = function(options:any) {
//		console.debug('reports.show');
		selPrj = app.projects.selected;
		self.parent.showLeft.reset();  // no panel to the left

		// Language options have been selected at project level:
		let opts = Object.assign(
			{
				targetLanguage: selPrj.language,
				lookupTitles: true,
				lookupValues: true
			},
			options
		);

		self.list = [];

		let tr = self.parent.tree.get();
		if( !tr || tr.length<1 ) {
			showNotice(i18n.MsgNoReports);
			app.busy.reset();
			return true  // nothing to do ....
		};
		
		// Get the statistics of the specification:
		// - number of items per resourceClass (resources and statements)
		// - per enumerated property: number of resources with any of the enumerated values
		// - ToDo: number of items changed in the last day, week, month, year 
		// For now, all items are statistically analyzed at client side.

		// Update browser history, if it is a view change, 
		// but not navigation in the browser history:
		if( !opts || !opts.urlParams ) 
			setUrlParams({
				project: selPrj.id,
				view: self.view.substring(1)	// remove leading hash
			}); 

		app.busy.set();
		showNotice(i18n.MsgAnalyzing);

			function addResourceClassReport() {
				// Add a report with a counter per resourceClass:
				var rCR: Report = {
						title: app.ontology.localize("SpecIF:Resource", { targetLanguage: browser.language, plural: true }),
						category: FilterCategory.resourceClass,
						pid: selPrj.id,
						scaleMin: 0,
						scaleMax: 0,
						datasets: []
					};
				selPrj.cache.get("resourceClass", selPrj.resourceClasses)
				.forEach(
					(rC) => {
						// Add a counter for each resourceClass which is either "auto" or "user" instantiated:
						// @ts-ignore - here, rC is a SpecifResourceClass and has a title
						if (!CONFIG.excludedFromTypeFiltering.includes(rC.title)
							// @ts-ignore - here, rC is a SpecifResourceClass and has a property 'instantiation'
							&& (!Array.isArray(rC.instantiation) || rC.instantiation.includes(SpecifInstantiation.Auto) || rC.instantiation.includes(SpecifInstantiation.User))) {
							rCR.datasets.push({
								label: LIB.titleOf(rC, opts),
								id: rC.id,
								count: 0,
								color: CONFIG.focusColor
							})
						}
					}
				);
				self.list.push(rCR)
			}
		addResourceClassReport();  // must be on the first position

			function addStatementClassReport() {
				// Add a report with a counter per statementClass:
				var sCR: Report = {
						title: app.ontology.localize("SpecIF:Statement", { targetLanguage: browser.language, plural: true }),
						category: FilterCategory.statementClass,
						pid: selPrj.id,
						scaleMin: 0,
						scaleMax: 0,
						datasets: []
					};
				selPrj.cache.get("statementClass", selPrj.statementClasses)
				.forEach(
					(sC) => {
						// Add a counter for each statementClass
						// @ts-ignore - here, rC is a SpecifStatemenrClass and has a property 'instantiation'
						if( !Array.isArray(sC.instantiation) || sC.instantiation.includes(SpecifInstantiation.Auto) || sC.instantiation.includes(SpecifInstantiation.User) )
							sCR.datasets.push({
								label: LIB.titleOf(sC,opts),
								id: sC.id,
								count: 0,
								color: CONFIG.focusColor 
							})
					}
				);
				self.list.push(sCR)
			}
		addStatementClassReport();  // must be on the second position
					
			function addEnumeratedValueReports() {
				function possibleValues(dt: SpecifDataType) {
					// Create a counter for all possible enumerated values:
					var dL: ReportDataset[] = [];
					dt.enumeration.forEach( (enV) =>{
						// add a counter for resources whose properties have a certain value (one per enumerated value)
						dL.push({  
							label: LIB.displayValueOf( enV.value, opts ), 
							id: enV.id,
							count: 0,    // resource count with a certain property value
							color: '#1a48aa'
						})
					});
					// add a counter for resources whose properties are without value:
					dL.push({
						label: i18n.LblNotAssigned,
						id: CONFIG.notAssigned,
						count: 0,	// resource count without a property value
						color: '#ffff00' }
					);
					return dL;
				}

				// Add a report with a counter per enumerated property of all resource types:
				let pC, dT;
			//	selPrj.cache.get("resourceClass", selPrj.resourceClasses).forEach(
				LIB.getExtendedClasses(selPrj.cache.get("resourceClass", "all"), selPrj.resourceClasses).forEach(
					(rC: SpecifResourceClass) => {
						rC.propertyClasses.forEach(
							(pck) => {
								pC = selPrj.cache.get("propertyClass", [pck])[0] as SpecifPropertyClass;
								dT = selPrj.cache.get("dataType", [pC.dataType])[0] as SpecifDataType;
								if( dT.enumeration ) {
									var aVR: Report = {
											title: LIB.titleOf(rC,opts)+': '+LIB.titleOf(pC,opts),
											category: FilterCategory.enumValue,
											pid: selPrj.id,	// project-id
											rCk: LIB.keyOf(rC), 	// resourceClass key
											pCk: pck, 	// propertyClass key
											scaleMin: 0,
											scaleMax: 0,
											datasets: possibleValues(dT)
										};
									self.list.push(aVR)
								}
							}
						)
					}
				)
			}
		addEnumeratedValueReports();

	/*		function addBooleaenValueReports() {
			// ToDo
			}
		addBooleanValueReports();  */

			function incVal(rep: Report, j: number): void {
				rep.datasets[j].count++;
				rep.scaleMax = Math.max(rep.scaleMax, rep.datasets[j].count)
			}
			function evalResource( res:SpecifResource ): void {
//				console.debug( 'evalResource', self.list, res );
					function findEnumPanel(rL: Report[], rC: SpecifKey,pC:SpecifKey) {
						for (var i = rL.length - 1; i > -1; i--) {
							if (rL[i].category == FilterCategory.enumValue
								&& LIB.references(rC, rL[i].rCk)
								&& LIB.references(pC, rL[i].pCk))
									return i;
						};
						return -1;
					}

				// a) The histogram of resource classes; it is the first report panel:
				let rCk = res['class'],
					j = LIB.indexById( self.list[0].datasets, rCk.id );
//				console.debug( 'evalResource j', res, j );
				if (j > -1) incVal(self.list[0], j)
				else throw Error("Did not find a report panel for resourceClass with id:"+rCk.id);

				// b) A report (histogram) for each enumerated property:
				let rC = LIB.getExtendedClasses(selPrj.cache.get("resourceClass","all"), [rCk])[0] as SpecifResourceClass,
					pC: SpecifPropertyClass,
					dT: SpecifDataType,
					rp: SpecifProperty,  // resource property
					i: number;
				rC.propertyClasses.forEach((pCk) => {
					pC = selPrj.cache.get("propertyClass", [pCk])[0] as SpecifPropertyClass;
					dT = selPrj.cache.get("dataType", [pC.dataType])[0] as SpecifDataType;
					if (dT.enumeration && dT.enumeration.length > 0) {
						// find the report panel:
						i = findEnumPanel(self.list, rCk, pCk);
//						console.debug( 'evalResource i', pC, i );
						if (i > -1) {
							// report panel found; it is assumed it is of type 'enumValue'.
							rp = LIB.itemBy(res.properties, 'class', pCk);
							// check whether the resource has a property of this type:
							if (rp && rp.values.length>0) {
								// has a value:
//								console.debug( 'evalResource a', rp );
								rp.values.forEach((val) => {
									// find the bar which corresponds to the property value:
									j = LIB.indexById(self.list[i].datasets, val);
//									console.debug( 'evalResource z', ct, j );
									if (j > -1) { incVal(self.list[i], j) } // property value found
								})
							}
							else {
								// no property or no value, thus unAssigned:
								incVal(self.list[i], self.list[i].datasets.length - 1)  // increment the last (unAssigned)
							}
						}
					//	else throw Error("Did not find a report panel for enumValue with id:" + rCk.id);
					}
				})
			}
			function evalStatement(st: SpecifStatement): void {
				let sCk = st['class'],
					j = LIB.indexById(self.list[1].datasets, sCk.id);
				if (j > -1) incVal(self.list[1], j)
				else throw Error("Did not find a report panel for resourceClass with id:" + sCk.id);
			}

//		console.debug('report panels', self.list);
		// we must go through the tree because we want to consider only resources referenced by the selected project,
		// ... and we must avoid to evaluate any resource more than once:
		let pend = 0,
			visited: SpecifId[] = []; // list all evaluated resources

		LIB.iterateNodes(
			// iterate all hierarchies except the one for unreferenced resources:
			(selPrj.cache.get("hierarchy", selPrj.hierarchies) as SpecifNodes)
				.filter(
					(h: SpecifNode) => {
						return LIB.typeOf(h.resource, selPrj.cache) != CONFIG.resClassUnreferencedResources
					}
				),
			(nd: SpecifNode) => {
				if( visited.includes(nd.resource.id) ) return; 

				// else not yet evaluated:
				visited.push(nd.resource.id); // memorize all evaluated resources

				pend++;
				// timelag>0 assures that 'all done' section is executed only once in case the resource is found in the cache:
				selPrj.readItems( 'resource', [nd.resource], {reload:false,timelag:10} )	
				.then(
					(resL) => {
						evalResource(resL[0] as SpecifResource);
						if (--pend < 1) { finalize() }   // all done
					},
					handleError
				);
				pend++;
				selPrj.readStatementsOf(nd.resource, {asSubject:true} )
				.then(
					(staL) => {
//						console.debug('staL', staL);
						for( var sta of staL )
							evalStatement(sta as SpecifStatement);
						if (--pend < 1) { finalize() }   // all done
					},
					handleError
				);
				return true // continue iterating
			}
		);
		return;

		function finalize() {
			self.list = removeEmptyReports(self.list);
			//						console.debug('self-list',self.list);
			if (self.list.length > 0)
				$(self.view).html(renderReports(self.list))
			else
				showNotice(i18n.MsgNoReports);
			app.busy.reset()
        }
		function removeEmptyReports(rL: Report[]): Report[] {
			return rL.filter( (r: Report) =>{
				for (var s of r.datasets) {
					if (s.count > 0) return true
				};
				return false
			})
		}
		function renderReports(list:Report[]):string {
			var rs =	'<div class="row" >';
			let lb;
			list.forEach( (li:Report,i:number) =>{
				rs +=		'<div class="col-sm-6 col-md-4 col-lg-3" style="background-color:#f4f4f4; border-right: 4px solid #ffffff; border-top: 4px solid #ffffff; padding-right:0.4em; padding-left:0.4em; height: '+panelHeight(list)+'">'
					+			'<h4>'+li.title+'</h4>'
					+			'<table style="width:100%; font-size:90%">'
					+				'<tbody>';
				li.datasets.forEach( (ds:ReportDataset,s:number) =>{
					lb = (li.category != FilterCategory.statementClass && ds.count>0)? '<a onclick="app.'+self.loadAs+'.facetClicked('+i+','+s+')">'+ds.label+'</a>' : ds.label;
					rs += 				'<tr>'
						+					'<td style="width:35%; padding:0.2em; white-space: nowrap">'+lb+'</td>'
						+					'<td style="width:15%; padding:0.2em" class="text-right">'+ds.count+'</td>'
						+					'<td style="padding:0.2em">'
						+						'<div style="background-color:#1a48aa; height: 0.5em; border-radius: 0.2em; width: '+barLength(li,ds)+'" />'
						+					'</td>'
						+				'</tr>'
				});
				rs +=				'</tbody>'
					+			'</table>'
					+		'</div>'
			});
			rs += 		'</div>';
			return rs;

			function panelHeight(L: Report[]): string {
				// Determine panel height.
				// So far, all panels get the same size depending on the longest dataset.
				let maxSets = 0;
				L.forEach((p) => {
					maxSets = Math.max(maxSets, p.datasets.length)
				});
				return ((1.1 + maxSets) * 1.67 + 'em')
			}
			function barLength(rp: Report, ds: ReportDataset): string {
				if (rp && ds) {
					if (ds.count <= rp.scaleMin) return '0%';
					let val = Math.max(Math.min(ds.count, rp.scaleMax), rp.scaleMin);
					return ((val - rp.scaleMin) / (rp.scaleMax - rp.scaleMin) * 100 + '%')
				};
				throw Error("Programming Error: Invalid report count or scale")
			}
		/*	function self.barColor( i1, i0 ) {
			//	if( i0<0 || i1<0 || i0 > self.list[i1].datasets.length-1 ) return null;
				if( i0<0 || i1<0 ) return null;
				return ( self.list[i1].datasets[i0].color )
			}
			function self.barStyle( i1, i0 ) {
			//	if( i0<0 || i1<0 || i0 > self.list[i1].datasets.length-1 ) return null;
				if( i0<0 || i1<0 ) return null;
				return ( 'width: '+barLength()+'; background-color: '+self.barColor()+'; height: 0.5em; border-radius: 0.2em' )
			} */
		}
	};

	self.facetClicked = function( rX:number, cX:number ) {
		// An entry in a report panel has been clicked, 
		// so assemble a corresponding filter list to show them in the filter module.
		// Add the primary filters in any case, even if they don't get a constraint.
		var rep:Report = self.list[rX],
			fL: IFilterDefinition[] = [];
//		console.debug( 'facetClicked', rX, cX, self.list, rep );
		switch( rep.category ) {
			case FilterCategory.resourceClass:
				fL.push({ category: FilterCategory.resourceClass, selected: [rep.datasets[cX].id]});
				break;
		/*	case FilterCategory.statementClass:
				// cannot filter by 'statement', yet
				// in fact, cannot get here, because the statement class name does not have a link
				return; */
			case FilterCategory.enumValue:
				fL.push({ category: FilterCategory.resourceClass, selected: [rep.rCk.id] });  // rCk.id: resourceClass id
				fL.push({ category: FilterCategory.enumValue, rCk: rep.rCk, pCk: rep.pCk, selected: [rep.datasets[cX].id]})
		};
//		console.debug( 'facetClicked', rep, cX, fL );
		// show the resources:
		moduleManager.show( { view:'#'+CONFIG.objectFilter, filters:fL } )
		// ToDo: query the filter view, don't just assemble it.
	};

	return self;
});
