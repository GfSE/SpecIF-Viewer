/*	ReqIF Server: Reports.
	Dependencies: jQuery, bootstrap
	(C)copyright 2010-2018 enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de            
*/
function Reports() {
	"use strict";
	var self = this;
//	var returnView = null;

/*	The report descriptors for display, two examples:
		{	title: 'Anforderung: Priorit&auml;t',
			subject: 'resource',
			scaleMin: 0,
			scaleMax: 120,
			datasets: [
				{ label: 'low', count: 80, color: '#1690d8' } ,	
				{ label: 'medium', count: 120, color: '#1f72c3' },	
				{ label: 'high', count: 40, color: '#1a48aa' }
			]
		},
		{	title: 'Anforderung: Status',
			subject: 'enumValue',
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
	self.list = [];  // the list of report panels

	// Standard module interface methods:
	self.init = function() {
//		console.debug('reports.init');
		self.list = []
	};
	self.clear = function() {
		self.list = []
	};
	self.hide = function() {
		$('#'+CONFIG.reports).empty();
		busy.reset()
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
		stdError(xhr,specs.returnToCaller)
	}
	function showNotice(txt) {
		$('#'+CONFIG.reports).html('<div class="notice-default" >'+txt+'</div>');
	}

	// standard module entry:
	self.show = function( prj ) {
		if( typeof(prj)!='object' || !prj.selectedHierarchy ) return false;

//		console.debug('reports.show');
		self.list = [];

		if( prj.selectedHierarchy.flatL.length<1 ) {
			showNotice(i18n.MsgNoReports);
			busy.reset();
			return true  // nothing to do ....
		};
		
		// Get the statistics of the specification:
		// - number of items per resourceClass (resources and statements)
		// - per enumerated property: number of resources with any of the enumerated values
		// - ToDo: number of items changed in the last day, week, month, year 
		// For now, all items are statistically analyzed at client side.

		busy.set();
		showNotice(i18n.MsgAnalyzing);

			function addResourceClassReport( pr ) {
				// Add a report with a counter per resourceClass:
				var oTR = {
						title: i18n.LblSpecTypes,
						subject: 'resource',
						pid: pr.id,
						scaleMin: 0,
						scaleMax: 0,
						datasets: []
					};

				pr.resourceClasses.forEach( function( rC ) {
							// Add a counter for each resourceClass
							if( CONFIG.excludedFromTypeFiltering.indexOf(rC.title)<0 )
								oTR.datasets.push({
									label: titleOf(rC),
									id: rC.id,
									count: 0,
									color: '#1690d8' 
								})
				});
				self.list.push(oTR)
			}

		addResourceClassReport( prj );  // must be on the first position

/*			var addStatementClassReport = function( prj ) {
				// Add a report with a counter per statementClass:
				// ToDo: cannot build a report based on statementClass, because there is no easy way to get all statements (yet)
			};

		addStatementClassReport( prj );
*/					
			function addEnumeratedValueReports( prj ) {
				function addPossibleValues(pC,r) {
					// Look up the dataType and create a counter for all possible enumerated values:
					for( var d=0, D=prj.dataTypes.length; d<D; d++ ) {
						if( prj.dataTypes[d].id == pC.dataType ) {
							prj.dataTypes[d].values.forEach( function(val) {
								// add a counter for resources whose properties have a certain value (one per enumerated value)
								r.datasets.push({  
									label: val.title, 
									id: val.id,
									count: 0,    // resource count with a certain property value
									color: '#1a48aa'
								})
							});
							// add a counter for resources whose properties are without value:
							r.datasets.push(  
								{ label: i18n.LblNotAssigned, 
								id: 'notAssigned',
								count: 0,	// resource count without an property value
								color: '#ffff00' }
							);
							return true  // no need to iterate the remaining dataTypes
						}
					};
					return false  // this should never happen ...
				}

				// Add a report with a counter per enumerated property of all resource types:
				prj.resourceClasses.forEach( function(rC) {
					rC.propertyClasses.forEach( function(pC) {
						if( itemById( prj.dataTypes, pC.dataType ).type=='xs:enumeration' ) {
							var aVR = {
									title: titleOf(rC)+': '+titleOf(pC),
									subject: 'enumValue',
									pid: prj.id,	// pid: project-id
									tid: rC.id, 	// tid: type-id
									aid: pC.id, 	// aid: property-id
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
		addEnumeratedValueReports( prj );

/*			var addBooleaenValueReports = function( prj ) {
			// ToDo
			};
		addBooleanValueReports( prj );  */

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
			function evalResource( obj ) {
//				console.log( 'evalResource', self.list, obj );
										
				// a) The histogram of resource types; it is the first report panel:
				let j = indexById( self.list[0].datasets, obj['class'] );
//				console.log( 'evalResource j', obj, j );
				if( j>-1 ) incVal( 0,j );

				// b) The histograms of all enumerated properties:
				let sT = itemById( prj.resourceClasses, obj['class'] );
				// there is a report for every enumerated resourceClass:
				let dT=null,oa=null,i=null,ct=null;
				sT.propertyClasses.forEach( function(pC) {
					dT = itemById( prj.dataTypes, pC.dataType );
					if( dT.type!='xs:enumeration' ) return;
					// find the report panel:
					i = indexBy( self.list, 'aid', pC.id );
//					console.log( 'evalResource i', pC, i );
					if( i>-1 ) { 
						// report panel found; it is assumed it is of type 'xs:enumeration'.
						// check whether obj has an property of this type:
						oa = itemBy( obj.properties, 'class', pC.id );
						if( oa && oa.value.trim().length ) {  
							// has a value:
//							console.log( 'evalResource a', oa );
							ct = oa.value.split(',');
							ct.forEach( function(val) { 
								// find the bar which corresponds to the property values
								j = indexBy( self.list[i].datasets, 'id', val.trim() );
//								console.log( 'evalResource z', ct, j );
								if( j>-1 ) { incVal( i,j ) } // property value found
							})
						} else {
							// no property or no value, thus unAssigned:
							incVal( i, self.list[i].datasets.length-1 )  // increment the last (unAssigned)
						}
					}
				})
			}

		var pend=prj.selectedHierarchy.flatL.length;
		prj.selectedHierarchy.flatL.forEach( function(rid) {
			prj.readContent( 'resource', {id: rid})
				.done(function(rsp) {
					evalResource( rsp );
					if( --pend<1 ) {  // all done:
						if( self.list.length>0 )
							$('#'+CONFIG.reports).html( renderReports( removeEmptyReports( self.list )) )
						else
							showNotice(i18n.MsgNoReports);
						busy.reset()
					}
				})
				.fail( handleError )
		});
		return

		function renderReports(list) {
			var rs =	'<div class="row" >';
			let li,ds,s,S,lb;
			for( var i=0,I=list.length;i<I;i++) {
				li=list[i];
				rs +=		'<div class="col-sm-6 col-md-4 col-lg-3" style="background-color:#f4f4f4; border-right: 4px solid #ffffff; border-bottom: 4px solid #ffffff; height: '+panelHeight(list)+'">'
					+			'<h4>'+li.title+'</h4>'
					+			'<table style="width:100%; font-size:90%">'
					+				'<tbody>';
				for( s=0,S=li.datasets.length;s<S;s++) {
					ds = li.datasets[s];
					lb = ds.count>0? '<a onclick="reports.countClicked('+i+','+s+')">'+ds.label+'</a>' : ds.label;
					rs += 				'<tr>'
						+					'<td style="width:35%; padding:0.2em; white-space: nowrap">'+lb+'</td>'
						+					'<td style="width:15%; padding:0.2em" class="text-right">'+ds.count+'</td>'
						+					'<td style="padding:0.2em">'
						+						'<div style="background-color:#1a48aa; height: 0.5em; border-radius: 0.2em; width: '+barLength(li,ds)+'" />'
						+					'</td>'
						+				'</tr>'
				};
				rs +=				'</tbody>'
					+			'</table>'
					+		'</div>'
			};
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
	//		if( i0<0 || i1<0 || i0 > self.list[i1].datasets.length-1 ) return null;
			if( i0<0 || i1<0 ) return null;	
			return ( self.list[i1].datasets[i0].color )
		}
		function self.barStyle( i1, i0 ) {
	//		if( i0<0 || i1<0 || i0 > self.list[i1].datasets.length-1 ) return null;
			if( i0<0 || i1<0 ) return null;	
			return ( 'width: '+barLength()+'; background-color: '+self.barColor()+'; height: 0.5em; border-radius: 0.2em' )
		} */
	};

	self.countClicked = function( rX, cX ) {
		// an entry in a report panel has been clicked, 
		// so assemble a corresponding filter list to show them in the filter module:
		var fL = [{subject: 'textSearch', pid: prj.id}];   // fL: filter list
		let itm = self.list[rX];
		switch( itm.subject ) {
			case 'resource':
				fL.push({subject: 'resource', pid: itm.pid, values: [itm.datasets[cX].id]});
				break;
			case 'enumValue':
				fL.push({subject: 'resource', pid: itm.pid, values: [itm.tid]});  // pid: project-id
				fL.push({subject: 'enumValue', tid: itm.tid, aid: itm.aid, values: [itm.datasets[cX].id]})  // tid: type-id
		};
//		console.debug( 'countClicked', itm, cX, fL );
		// show the resources:
		specs.showFilter( fL )
	};

	return self
};
var reports = new Reports();
