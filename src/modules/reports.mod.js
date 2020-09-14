/*	SpecIF Class-based Reports.
	Dependencies: jQuery, bootstrap
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de            

	The report descriptors for display, two examples:
		{	title: 'Anforderung: Priorit&auml;t',
			category: 'resourceClass',
			scaleMin: 0,
			scaleMax: 120,
			datasets: [
				{ label: 'low', count: 80, color: '#1690d8' } ,	
				{ label: 'medium', count: 120, color: '#1f72c3' },	
				{ label: 'high', count: 40, color: '#1a48aa' }
			]
		},
		{	title: 'Anforderung: Status',
			category: 'enumValue',
			scaleMin: 0,
			scaleMax: 1000,
			datasets: [
				{ label: '30_vorgelegt', count: 245, color: '#1690d8' } ,	
				{ label: '40_genehmigt', count: 12, color: '#1f72c3' },	
				{ label: '60_fertig', count: 890, color: '#1a48aa' },
				{ label: '80_freigegeben', count: 180, color: '#000000' }
			]
		},	 ...

	The server or the server interface lib is responsible for analysing the project and for collecting the data.
*/		
modules.construct({
	name: CONFIG.reports
}, function(self) {
	"use strict";
	var pData,prj,dta;
	self.list = [];  // the list of report panels

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
	function handleError(xhr) {
		self.hide();
		self.clear();
		// This is a sub-module to specs, so use its return method:
		stdError(xhr,pData.returnToCaller)
	}
	function showNotice(txt) {
		$('#'+CONFIG.reports).html('<div class="notice-default" >'+txt+'</div>');
	}

	// standard module entry:
	self.show = function(opts) {
//		console.debug('reports.show');
		prj = app.cache.selectedProject;
		dta = prj.data;
		pData = self.parent;
		pData.showLeft.reset();

		// Language options have been selected at project level:
		opts.targetLanguage = self.parent.targetLanguage;
		opts.lookupTitles = self.parent.lookupTitles;

		self.list = [];

		let tr = pData.tree.get();
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
				project: dta.id,
				view: self.view.substr(1)	// remove leading hash
			}); 

		app.busy.set();
		showNotice(i18n.MsgAnalyzing);

			function addResourceClassReport( pr ) {
				// Add a report with a counter per resourceClass:
				var rCR = {
						title: i18n.LblResourceClasses,
						category: 'resourceClass',
						pid: pr.id,
						scaleMin: 0,
						scaleMax: 0,
						datasets: []
					};
				pr.resourceClasses.forEach( function( rC ) {
							// Add a counter for each resourceClass
							if( CONFIG.excludedFromTypeFiltering.indexOf(rC.title)<0 )
								rCR.datasets.push({
									label: titleOf(rC,opts),
									id: rC.id,
									count: 0,
									color: '#1690d8' 
								})
				});
				self.list.push(rCR)
			}
		addResourceClassReport( dta );  // must be on the first position

	/*		function addStatementClassReport( prj ) {
				// Add a report with a counter per statementClass:
				var sCR = {
						title: i18n.LblStatementClasses,
						category: 'statementClass',
						pid: pr.id,
						scaleMin: 0,
						scaleMax: 0,
						datasets: []
					};
				pr.statementClasses.forEach( function( sC ) {
							// Add a counter for each resourceClass
							if( CONFIG.excludedFromTypeFiltering.indexOf(sC.title)<0 )
								sCR.datasets.push({
									label: titleOf(sC,opts),
									id: sC.id,
									count: 0,
									color: '#1690d8' 
								})
				});
				self.list.push(sCR)
			}
		addStatementClassReport( dta );  */
					
			function addEnumeratedValueReports( prj ) {
				function addPossibleValues(pC,rep) {
					// Look up the dataType and create a counter for all possible enumerated values:
					for( var d=0, D=prj.dataTypes.length; d<D; d++ ) {
						if( prj.dataTypes[d].id == pC.dataType ) {
							prj.dataTypes[d].values.forEach( function(val) {
								// add a counter for resources whose properties have a certain value (one per enumerated value)
								rep.datasets.push({  
									label: i18n.lookup( languageValueOf( val.value, opts )), 
									id: val.id,
									count: 0,    // resource count with a certain property value
									color: '#1a48aa'
								})
							});
							// add a counter for resources whose properties are without value:
							rep.datasets.push(  
								{ label: i18n.LblNotAssigned, 
								id: CONFIG.notAssigned,
								count: 0,	// resource count without an property value
								color: '#ffff00' }
							);
							return true  // no need to iterate the remaining dataTypes
						}
					};
					return false  // this should never happen ...
				}

				// Add a report with a counter per enumerated property of all resource types:
				let pC;
				dta.resourceClasses.forEach( function(rC) {
					rC.propertyClasses.forEach( function(id) {
						pC = itemById( dta.propertyClasses, id );
						if( itemById( dta.dataTypes, pC.dataType ).type=='xs:enumeration' ) {
							var aVR = {
									title: titleOf(rC,opts)+': '+titleOf(pC,opts),
									category: 'enumValue',
									pid: dta.id,	// pid: project-id
									rCid: rC.id, 	// rCid: resourceClass-id
									pCid: id, 		// pCid: propertyClass-id
									scaleMin: 0,
									scaleMax: 0,
									datasets: []
								};
							addPossibleValues(pC,aVR);
							self.list.push(aVR)
						}
					})
				})
			}
		addEnumeratedValueReports( dta );

	/*		function addBooleaenValueReports( prj ) {
			// ToDo
			}
		addBooleanValueReports( dta );  */

			function incVal( i,j ) {
				self.list[i].datasets[j].count++;
				self.list[i].scaleMax = Math.max( self.list[i].scaleMax, self.list[i].datasets[j].count )
			}
			function removeEmptyReports( rpL ) {
					function hasCounts( rp ) {
						for( var s=rp.datasets.length-1; s>-1; s-- ) {
							if( rp.datasets[s].count>0 ) return true
						};
						return false
					}
				return rpL.filter( function(rp) {
					return hasCounts(rp)
				})
			}
			function evalResource( res ) {
//				console.debug( 'evalResource', self.list, res );
					function findPanel(pL,rep,p) {
						for( var i=pL.length-1;i>-1;i--  ) {
							if( pL[i].rCid==rep && pL[i].pCid==p ) return i
						};
						return -1
					}
										
				// a) The histogram of resource classes; it is the first report panel:
				let rId = res['class'],
					j = indexById( self.list[0].datasets, rId );
//				console.debug( 'evalResource j', res, j );
				if( j>-1 ) incVal( 0,j );

				// b) The histograms of all enumerated properties:
				let rC = itemById( dta.resourceClasses, rId );
				// there is a report for every enumerated resourceClass:
				let dT=null,oa=null,i=null,ct=null,pC;
				rC.propertyClasses.forEach( function(pId) {
					pC = itemById( dta.propertyClasses, pId );
					dT = itemById( dta.dataTypes, pC.dataType );
					if( dT.type!='xs:enumeration' ) return;
					// find the report panel:
					i = findPanel(self.list,rId,pId);
//					console.debug( 'evalResource i', pC, i );
					if( i>-1 ) { 
						// report panel found; it is assumed it is of type 'xs:enumeration'.
						// check whether the resource has a property of this type:
						oa = itemBy( res.properties, 'class', pId );
						if( oa && oa.value.trim().length ) {  
							// has a value:
//							console.debug( 'evalResource a', oa );
							ct = oa.value.split(',');
							ct.forEach( function(val) { 
								// find the bar which corresponds to the property values
								j = indexById( self.list[i].datasets, val.trim() );
//								console.debug( 'evalResource z', ct, j );
								if( j>-1 ) { incVal( i,j ) } // property value found
							})
						} else {
							// no property or no value, thus unAssigned:
							incVal( i, self.list[i].datasets.length-1 )  // increment the last (unAssigned)
						}
					}
				})
			}

//		console.debug('report panels', self.list);
		// we must go through the tree because not all resources may be cached,
		// but we must avoid to evaluate every resource more than once:
		let pend=0, visitedR=[];
		pData.tree.iterate( function(nd) {
			if( visitedR.indexOf(nd.ref)>-1 ) return; 
			// not yet evaluated:
			pend++;
			visitedR.push(nd.ref); // memorize all resources already evaluated
			// timelag>0 assures that 'all done' section is executed only once in case the resource is found in the cache:
			prj.readContent( 'resource', {id: nd.ref}, {reload:false,timelag:10} )	
			.then(
				(rsp)=>{
					evalResource( rsp );
					if( --pend<1 ) {  // all done:
						self.list = removeEmptyReports( self.list );
//						console.debug('self-list',self.list);
						if( self.list.length>0 )
							$(self.view).html( renderReports( self.list ) )
						else
							showNotice(i18n.MsgNoReports);
						app.busy.reset()
					}
				},
				handleError
			);
		//	prj.readStatementsOf( {id: nd.ref}, false )
		//		.done(function(rsp) {
		//		})
		//		.fail( handleError ); 
			return true // continue iterating
		});
		return

		function renderReports(list) {
			var rs =	'<div class="row" >';
			let lb;
			list.forEach( function(li,i) {
				rs +=		'<div class="col-sm-6 col-md-4 col-lg-3" style="background-color:#f4f4f4; border-right: 4px solid #ffffff; border-top: 4px solid #ffffff; padding-right:0.4em; padding-left:0.4em; height: '+panelHeight(list)+'">'
					+			'<h4>'+li.title+'</h4>'
					+			'<table style="width:100%; font-size:90%">'
					+				'<tbody>';
				li.datasets.forEach( function(ds,s) {
					lb = ds.count>0? '<a onclick="app.'+self.loadAs+'.countClicked('+i+','+s+')">'+ds.label+'</a>' : ds.label;
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
			return rs
		}
		function panelHeight(L) {
			// Determine panel height.
			// So far, all panels get the same size depending on the longest dataset.
			let maxSets = 0;
			L.forEach( function(p) {
				maxSets = Math.max( maxSets, p.datasets.length )
			});
			return ( 3+maxSets*1.8+'em' )
		}
		function barLength( rp, ds ) {
			if( !rp || !ds ) return null;	
			if( ds.count <= rp.scaleMin ) return '0%';
			let val = Math.max( Math.min( ds.count, rp.scaleMax ), rp.scaleMin);
			return ( (val-rp.scaleMin)/(rp.scaleMax-rp.scaleMin)*100+'%' )
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
	};

	self.countClicked = function( rX, cX ) {
		// An entry in a report panel has been clicked, 
		// so assemble a corresponding filter list to show them in the filter module.
		// Add the primary filters in any case, even if they don't get a constraint.
		var itm = self.list[rX],
		//	fL = [{category: 'textSearch'}];   // fL: filter list
			fL = [];
//		console.debug( 'countClicked', rX, cX, self.list, itm );
		switch( itm.category ) {
			case 'resourceClass':
				fL.push({category: 'resourceClass', options: [itm.datasets[cX].id]});
				break;
		//	case 'statementClass':
			// cannot filter by 'statement', yet
			case 'enumValue':
				fL.push({category: 'resourceClass', options: [itm.rCid]});  // pid: project-id
				fL.push({category: 'enumValue', rCid: itm.rCid, pCid: itm.pCid, options: [itm.datasets[cX].id]})  // rCid: type-id
		};
//		console.debug( 'countClicked', itm, cX, fL );
		// show the resources:
		modules.show( { newView:'#'+CONFIG.objectFilter, filters:fL } )
		// ToDo: query the filter view, don't just assemble it.
	};

	return self
});
