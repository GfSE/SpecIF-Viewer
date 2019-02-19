/*	ReqIF Server: Object Table.
	Dependencies: jQuery, http://https://datatables.net/
	(C)copyright 2010-2017 enso managers gmbh (http://www.enso-managers.com)
	Author: se@enso-managers.com, Berlin
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de            
*/

function ObjectTable() {
	"use strict";
	var self = this;
//	var returnView = null;
	self.columns = [];  // the column descriptors
	var isOpen = false;

	function allCols() {

		let cols = [
			{ /*"title": i18n.LblOrder,*/ "data": "order", "type":"hierarchical", "defaultContent": "" },   
			{ "title": i18n.LblTitle+' / '+i18n.LblDescription, "data": "titleAndDescr", "type":"title", "defaultContent": "" } 
			// types 'hierarchical' and 'title' are self-defined datatypes with respective sorting routines.
		];
		// Add columns for all attributes of all spec-object-types:
		let ln=null,ti=null,oT=null,a=null,A=null;
		for( var s=0,S=myProject.objTypes.length;s<S;s++ ) {
			// ToDo: find the columns in case of a RIF file.
			oT = myProject.objTypes[s];
			for( a=0,A=oT.attributeTypes.length;a<A;a++ ) {
				ln=oT.attributeTypes[a].longName;
				ti=titleOf(oT.attributeTypes[a]);
				// only for attributes which are not a title or a description (already contained in column "titleAndDescr")
				// .. and only if it is a new column (there isn't any with the same name, yet):
				// ToDo: Exclude only the first title attribute, the active one.
				if( CONFIG.titleAttributes.indexOf( ln )<0   
					&& CONFIG.descriptionAttributes.indexOf( ln )<0 
					&& indexBy(cols, 'data', ln.toJsId() )<0 ) {
//						console.debug( s, a, ti );
						cols.push({ 
							title: ti,
							data: ln.toJsId(),
							visible: false,    // set true, if there is content in at least one row
							defaultContent: ""
						})
				}
			}
		};

//		console.debug( 'col.l', cols );
		return cols
	}
	function col2idx( cols ) {
		// transform a list of column names to a list of column indexes:
		var idxs = [];
		for( var j=0, J=self.columns.length; j<J; j++) {
			if( cols.indexOf( self.columns[j].data )>-1 ) idxs.push( j )
		};
//		console.debug('col2idx',idxs);
		return idxs
	}

	// Standard module interface methods:
	self.open = function( cb ) {
		self.columns = allCols();
		if( isOpen ) return;
		// else:
		isOpen = true;
//		if( $.isFunction(cb) ) returnView = cb;   // callback

		let css = document.createElement('style');
		css.innerHTML = 
			// reduce the size of the diagrams in this view:
			'#objectTable div.forImage object, #objectTable div.forImage img { max-width: 160px }\n'
			// override dataTables.css:
			+ 'table.dataTable thead th, table.dataTable tbody td, '
			+ 'table.dataTable thead td, table.dataTable tbody th '
			+		'{ padding: 0.4em; }\n'
			+ 'label { font-weight: normal; }\n'
			+ '.dataTables_wrapper .dataTables_length, .dataTables_wrapper .dataTables_filter,'
			+ '.dataTables_wrapper .dataTables_info, .dataTables_wrapper .dataTables_processing,'
			+ '.dataTables_wrapper .dataTables_paginate '
			+ 		'{ font-size: 90%; color: #23527c; }\n' /* bootstrap brand-primary */
			+ '.dataTables_wrapper .dataTables_paginate .paginate_button '
			+		'{ padding: 0.2em 1em; color: #23527c; }\n' 
			+ '.dataTables_wrapper .dataTables_info '
			+		'{ padding-top: 0.5em; }\n';
			/*  div.dt-buttons { float: left; margin-right: 0.8em;}*/
		document.head.appendChild(css); // append in head

		$( '#table' ).append(
			'<div id="objectTableT" >'
		+		'<table id="objectTable" cellpadding="0" cellspacing="0" border="0" class="display font-sm" ></table>'
		+	'</div>'
		)

		self.dtable = initTable()
	};
	self.clear = function() {
		self.columns = []
		// ToDo: delete table.
	};
	self.hide = function() {
		projects.busy.set( false )
	};
	self.close = function() {
		isOpen = false;
		self.hide();
		self.clear()
	};
/*	// here, the only way to get out is by selecting another tab.
	function returnOnSuccess() {
		self.hide();
		self.clear();
		returnView();
	};
*/	// This is a sub-module to specs, so use its return method
	function handleError(xhr) {
		self.hide();
		self.clear();
		stdError(xhr,specs.returnToCaller)
	}
		
	self.show = function() {
//		console.debug( 'Entering showTable' );
		if( myProject==null || myProject.selectedSpec==null ) return false;
		// Todo: Save the position of the slider and restore it (currently the table is shown from the beginning after an update).

		var visCols = [];  // list of visible columns

		self.dtable.clear();
		specs.updateHistory();
		projects.busy.set( true );

		// It is assumed that the cache is full upon entry.
/*		if( !myProject.selectedSpec.objectsLoaded || myProject.loading() ) { 
			setTimeout(function() {self.show()}, 200);  // retry later
			console.debug( CONFIG.objectTable, {status: 10, statusText: 'Still loading, retry in 100 ms.'});
			return // skip operation for now
		};
*/
			function appendRow( oR ) {
				myProject.readContent( 'object', {id: oR.ref} )
					.done(function(rsp) {
						var obj={
							id: rsp.id,
							order: oR.order,    // in table view multiple occurrences of the same object have their own instance with their respective order numbers.
							titleAndDescr: ''
						};
						
						let clAtts = classifyProps(rsp),
							att=null;
//						console.debug('clAtts',rsp,clAtts);
						// In case there is no explicit value in a title attribute, don't show anything in the table.
						// This happens regularly in DOORS/Exerpt exports.
						if( clAtts.title ) {
							if( clAtts.specType.isHeading )
								obj.titleAndDescr = '<div class="chapterTitle">'+clAtts.title+'</div>' 
							else
								obj.titleAndDescr = '<div class="objectTitle">'+(CONFIG.addIconToInstance?clAtts.title.addIcon( clAtts.specType.icon ):clAtts.title)+'</div>'
						};

						for( var d=0,D=clAtts.descriptions.length; d<D; d++ ) {
							att = clAtts.descriptions[d];
							obj.titleAndDescr += contentOf( clAtts, att )
						};
						
						var col= null;
						for( var a=0,A=clAtts.otherAttributes.length; a<A; a++ ) {
							att = clAtts.otherAttributes[a];
							// take the attribute title to relate the data to the column:
							col = att.longName.toJsId();  
							obj[col] = contentOf( clAtts, att );
							// add column, if it is new and has a value:
							if( hasContent(att.content) && visCols.indexOf( col )<0 ) 
								visCols.push( col )
						};
						
//						console.debug( 'dtable.row.add', obj, visCols );
						// add a row per object:
						self.dtable.row.add( obj );
						if( --pend<1 ) {  // all done
							// update the display when all objects have been received:
//							console.debug( 'visCols', visCols );
							self.dtable.columns( col2idx( visCols ) ).visible( true, false );  // listed columns visible, no redrawCalculations
							self.dtable.rows().invalidate().draw();
							projects.busy.set( false )
						}
					})
					.fail( handleError )
			}

		// Get every object referenced in the tree:
		let oRefs=[];
		specs.tree.get().iterate(
			function(nd) {
				oRefs.push( nd );
				return true  // continue iterating
			}
		);
		
		let pend=oRefs.length;
		if( pend<1 ) {
			self.dtable.rows().invalidate().draw();
			projects.busy.set( false );
			return
		};
		// else update the table:
		for( var i=0, I=oRefs.length; i<I; i++ ) {
			appendRow( oRefs[i] )
		}
	};
	function tableHeightRaw() {
		return ($('#main').height()-getOuterHeight('#specsHeader')-102+'px')
	};
/*	self.tableHeight = function() {
		return ($('#main').height()-getOuterHeight('#specsHeader')-getOuterHeight('#dataTables_scrollHead')-106+'px')
	};
*/
	function initTable() {
		let langF = "./i18n/datatables-en.i18n.json";
		if( browser.language == 'de' ) langF = "./i18n/datatables-de.i18n.json";
		if( browser.language == 'fr' ) langF = "./i18n/datatables-fr.i18n.json";

		jQuery.extend( jQuery.fn.dataTableExt.oSort, {
			// the sorting routines for the hierarchical chapter ordering (type 'hierarchical'):
			"hierarchical-pre": function ( a ) {
				var x=null;
				let m = a.split("."),
					item=null;
				// limited to chapter count per level <1000
				for( var i=0, I=m.length; i<I; i++) {
					item = m[i];
					if(item.length == 1) {
						x += "00" + item
					}
					else if(item.length == 2) {
						x += "0" + item
					}
					else {
						x += item
					}
				};
				return x
			},
			"hierarchical-asc": function ( a, b ) {
				return ((a < b) ? -1 : ((a > b) ? 1 : 0))
			},
			"hierarchical-desc": function ( a, b ) {
				return ((a < b) ? 1 : ((a > b) ? -1 : 0))
			},
			// the sorting routines for the column 'title and description' (type 'title'):
			"title-pre": function ( a ) {
				return a.stripHTML().substr(0,20)
			},
			"title-asc": function ( a, b ) {
				return ((a < b) ? -1 : ((a > b) ? 1 : 0))
			},
			"title-desc": function ( a, b ) {
				return ((a < b) ? 1 : ((a > b) ? -1 : 0))
			}
		} );
		
		// set table options and get the instance:
		var table = $('#objectTable').DataTable( {
/*			// First trials with csv export went fine, but it still needs to be explored how to control the separator used (',' vs. ';' vs. tab).
			// The first trials with the excel export have not been very promising, see https://datatables.net/forums/discussion/31773/how-can-the-datatype-of-fields-be-controlled-while-exporting-to-excel#latest
			// Therefore the effort to use the datatables buttons component is stopped in favor of a direct import/export using js-xlsx.
			dom: 'Blftip',
			buttons: [
//				'copyHtml5',
				{ extend: 'excelHtml5', text: '&#8599;&#160;Excel' },
//				'pdfHtml5',
				{ extend: 'csvHtml5', text: '&#8599;&#160;CSV' }
			],		
*/			lengthMenu: [ [ -1, 100, 30, 10 ], [ i18n.LblAll, 100, 30, 10 ] ],
			language: { "url": langF },
			columns: self.columns,
//			data: self.objects,
			scrollY: tableHeightRaw(),
			scrollCollapse: false } );

		// adjust the table height (needs elements of the table itself, so this cannot be done when initializing):
//		$('#dataTables_scrollBody').css({height: self.tableHeight()})

		// register click handler for row:
		$('#objectTable tbody').on('click', 'tr', function () {
			let data = table.row( this ).data();
//			console.debug( 'cl', data );
			// a row has been clicked: show the detail view of the object.
			specs.showTab( CONFIG.objectDetails );  
			specs.selectNodeByRef( {id: data.id} )	
			// changing the tree node triggers an event, by which the display is refreshed
		});
		return table
	};
		
	return self
};
var objectTable = new ObjectTable();
