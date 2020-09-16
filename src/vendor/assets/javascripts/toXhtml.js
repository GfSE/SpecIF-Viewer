function toXhtml( data, opts ) {
	"use strict";
	// Accepts data-sets according to SpecIF v0.10.4 or v0.11.2 and later.
	// Copyright: adesso AG (http://adesso.de)
	// License: Apache 2.0 (http://www.apache.org/licenses/)
	// Limitations:
	// - HTML ids are made from resource ids, so multiple reference of a resource results in mutiple occurrences of the same id.
	// - Title links are only correct if they reference objects in the same SpecIF hierarchy (hence, the same xhtml file)
	// - Accepts data-sets according to SpecIF v0.10.8 and later.
	// - All values must be strings, the language must be selected before calling this function, i.e. languageValues as permitted by the schema are not supported!

	// Reject versions < 0.10.8:
	if( data.specifVersion ) {
		let v = data.specifVersion.split('.');
		if( v.length<2 || (10000*parseInt(v[0],10)+100*parseInt(v[1],10)+parseInt(v[2]||0,10))<1008 ) {
			if (typeof(opts.fail)=='function' )
				opts.fail({status:904,statusText:"SpecIF Version < v0.10.8 is not supported."})
			else
				console.error("SpecIF Version < v0.10.8 is not supported.");
			return
		}
	};
	
	// Check for missing options:
	if( typeof(opts)!='object' ) return null;;
	if( typeof(opts.classifyProperties)!='function') {
		if (typeof(opts.fail)=='function' )
			opts.fail({status:904,statusText:"Programming error: function 'opts.classifyProperties' is undefined."})
		else
			console.error("Programming error: function 'opts.classifyProperties' is undefined.");
		return
	};
	if( !opts.dataTypeString ) opts.dataTypeString = 'xs:string';
	if( !opts.dataTypeXhtml ) opts.dataTypeXhtml = 'xhtml';
	if( !opts.dataTypeEnumeration ) opts.dataTypeEnumeration = 'xs:enumeration';

	if( typeof(opts.showEmptyProperties)!='boolean' ) opts.showEmptyProperties = false;
	if( typeof(opts.hasContent)!='function' ) opts.hasContent = hasContent;
	if( typeof(opts.lookup)!='function' ) opts.lookup = function(str) { return str };
	// If a hidden property is defined with value, it is suppressed only if it has this value;
	// if the value is undefined, the property is suppressed in all cases.
	if( !opts.hiddenProperties ) opts.hiddenProperties = [];
	if( !opts.stereotypeProperties ) opts.stereotypeProperties = ['UML:Stereotype'];	

	// If no label is provided, the respective properties are skipped:
	if( opts.propertiesLabel ) opts.propertiesLabel = opts.lookup( opts.propertiesLabel );	
	if( opts.statementsLabel ) opts.statementsLabel = opts.lookup( opts.statementsLabel );	
	if( !opts.titleLinkBegin ) opts.titleLinkBegin = '\\[\\[';		// must escape javascript AND RegEx
	if( !opts.titleLinkEnd ) opts.titleLinkEnd = '\\]\\]';			// must escape javascript AND RegEx
	if( typeof opts.titleLinkMinLength!='number' ) opts.titleLinkMinLength = 3;	
	opts.addTitleLinks = opts.titleLinkBegin && opts.titleLinkEnd && opts.titleLinkMinLength>0;
	if( typeof(opts.RE)!='object' ) opts.RE = {};
	if( !opts.RE.AmpersandPlus ) opts.RE.AmpersandPlus = new RegExp( '&(.{0,8})', 'g' );
	if( !opts.RE.XMLEntity ) opts.RE.XMLEntity = new RegExp( '&(amp|gt|lt|apos|quot|#x[0-9a-fA-F]{1,4}|#[0-9]{1,5});/', '');
	if( opts.titleLinkBegin && opts.titleLinkEnd )
		opts.RE.TitleLink = new RegExp( opts.titleLinkBegin+'(.+?)'+opts.titleLinkEnd, 'g' );

	const nbsp = '&#160;'; // non-breakable space

	// A single comprehensive <object .../> or tag pair <object ...>..</object>.
	// Limitation: the innerHTML may not have any tags.
	// The [^<] assures that just the single object is matched. With [\\s\\S] also nested objects match for some reason.
	const reSO = '<object([^>]+)(/>|>([^<]*?)</object>)',
		reSingleObject = new RegExp( reSO, 'g' );
	// Two nested objects, where the inner is a comprehensive <object .../> or a tag pair <object ...>..</object>:
	// .. but nothing useful can be done in a WORD file with the outer object ( for details see below in splitRuns() ).
	const reNO = '<object([^>]+)>[\\s]*'+reSO+'([\\s\\S]*)</object>',
		reNestedObjects = new RegExp( reNO, 'g' );

	// All required parameters are available, so we can begin.
	var xhtml = {
			headings: [],		// used to build the ePub table of contents
			sections: [],		// the xhtml files for the title and each chapter=section
			images: []			// the referenced images
		};

	// Create a title page as xhtml-file and add it as first section:
	xhtml.sections.push(
			xhtmlOf({ 
				title: escapeXML(data.title),
				body: '<div class="title">'+escapeXML(data.title)+'</div>'
			})
	);
	
	// For each SpecIF hierarchy, create a xhtml-file and add it as subsequent section:
	const firstHierarchySection = xhtml.sections.length;  // index of the next section number
	data.hierarchies.forEach( function(h,hi) {
		pushHeading( h.title, {nodeId: h.id, level: 1} );
		xhtml.sections.push(
			xhtmlOf({ 
				title: escapeXML(data.title),
				body: renderHierarchy( h, hi, 1 )
			})
		)
	});

//	console.debug('xhtml',xhtml);
	return xhtml
	
	// ---------------
	function pushHeading( t, pars ) {	// title, parameters
		xhtml.headings.push({
				id: pars.nodeId,
				title: t,
				section: xhtml.sections.length,  // the index of the section in preparation (once it is pushed)
				level: pars.level
		})
	}
	function titleOf( r, pars, opts ) { // resource, resourceClass, parameters, options
		// render the resource title
		// designed for use also by statements.

		// depending on the context, r['class'] is an class object or a class id:
		let rC = r['class'].id? r['class'] : itemBy( data.resourceClasses, 'id', r['class'] );
		let ti = escapeXML( r.title ),
			ic = rC.icon;
		if( typeof(ic)!='string' ) ic = '';
		if( ic ) ic += nbsp; // non-breakable space
		if( !pars || pars.level<1 ) return (ti?ic+ti:'');
		if( rC.isHeading ) pushHeading( ti, pars );
		let l = pars.level==1? 1:rC.isHeading? 2:3;
		if( !ti ) return '';
		return '<h'+l+' id="'+pars.nodeId+'">'+(ti?ic+ti:'')+'</h'+l+'>'
	}
	function statementsOf( r, hi, opts ) { // resource, options
		// render the statements (relations) about the resource in a table
		if( !opts.statementsLabel ) return '';
		let sts={}, cid, oid, sid, noSts=true;
		// Collect statements by type:
		data.statements.forEach( function(st) {
			cid = st['class'];  // statement class id
			// SpecIF v0.10.x: subject/object without revision, v0.11.y: with revision
			sid = st.subject.id || st.subject;
			oid = st.object.id || st.object;
			if( sid==r.id || oid==r.id ) {
				// the statement us about the resource:
				noSts = false;
				// create a list of statements with that type, unless it exists already:
				if( !sts[cid] ) sts[cid] = {subjects:[],objects:[]};
				// add the resource to the list, assuming that it can be either subject or object, but not both:
				if( sid==r.id ) sts[cid].objects.push( itemBy(data.resources,'id',oid) )
				else sts[cid].subjects.push( itemBy(data.resources,'id',sid) )
			}
		});
//		console.debug( 'statements', r.title, sts );
//		if( Object.keys(sts).length<1 ) return '';
		if( noSts ) return '';
		// else, there are statements to render:
		let ct = '<p class="metaTitle">'+opts.statementsLabel+'</p>',
			sTi;
		ct += '<table class="statementTable"><tbody>';
		for( cid in sts ) {
			// we don't have (and don't need) the individual statement, just the class:
			sTi = opts.lookup( itemBy(data.statementClasses,'id',cid).title );

			// 3 columns:
			if( sts[cid].subjects.length>0 ) {
				ct += '<tr><td>';
				sts[cid].subjects.forEach( function(s) {
//					console.debug('s',s,itemBy( data.resourceClasses,'id',s['class']))
					ct += '<a href="'+anchorOf( s, hi )+'">'+titleOf( s, null, opts )+'</a><br/>'
				});
				ct += '</td><td class="statementTitle">'+sTi;
				ct += '</td><td>'+titleOf( r, null, opts );
				ct += '</td></tr>'
			};
			if( sts[cid].objects.length>0 ) {
				ct += '<tr><td>'+titleOf( r, null, opts );
				ct += '</td><td class="statementTitle">'+sTi+'</td><td>';
				sts[cid].objects.forEach( function(o) {
					ct += '<a href="'+anchorOf( o, hi )+'">'+titleOf( o, null, opts )+'</a><br/>'
				});
				ct += '</td></tr>'
			}
		};
		return ct + '</tbody></table>'
	}
	function anchorOf( res, hi ) {
		// Find the hierarchy node id for a given resource;
		// the first occurrence is returned:
		let m=null, M=null, y=null, n=null, N=null, ndId=null;
		for( m=0, M=data.hierarchies.length; m<M; m++ ) {
			// for all hierarchies starting with the current one 'hi', the index of the top-level loop:
			y = (m+hi) % M;  
//			console.debug( 'nodes', m, y, data.hierarchies );
			if( data.hierarchies[y].nodes )
				for( n=0, N=data.hierarchies[y].nodes.length; n<N; n++ ) {
					ndId = nodeByRef( data.hierarchies[y].nodes[n] );
//					console.debug('ndId',n,ndId);
					if( ndId ) return ndId		// return node id
				}
		};
		return null;	// not found
		
		function nodeByRef( nd ) {
			let ndId=null;
			if( nd.resource==res.id ) return 'sect'+(y+firstHierarchySection)+'.xhtml#'+nd.id;  // fully qualified anchor including filename
			if( nd.nodes )
				for( var t=0, T=nd.nodes.length; t<T; t++ ) {
					ndId = nodeByRef( nd.nodes[t] );
//					console.debug('ndId2',n,ndId);
					if( ndId ) return ndId
				};
			return null
		}
	}
	function propertyClassOf( pCid ) {
		return itemBy(data.propertyClasses,'id',pCid)
	}
	function propertiesOf( r, hi, opts ) {
		// render the resource's properties with title and value as xhtml:
		// designed for use also by statements.

		// depending on the context, r['class'] is an class object or a class id:
		let rC = r['class'].id? r['class'] : itemBy( data.resourceClasses, 'id', r['class'] );
		
//		console.debug('propertiesOf',r, rC, hi, opts);
		// return the content of all properties, sorted by description and other properties:
		let c1='', rows='', rt, hPi;
		r.descriptions.forEach( function(prp) {
			c1 += '<p>'+propertyValueOf( prp, hi )+'</p>'
		});
		// Skip the remaining properties, if no label is provided:
//		console.debug('#1',c1)
		if( !opts.propertiesLabel || r.isHeading ) return c1;
		
		// Finally, list the remaining properties with property title (name) and value:
		r.other.forEach( function(prp) {
			// the property title or it's class's title:
			if( opts.hasContent(prp.value) || opts.showEmptyProperties ) {
				rt = opts.lookup( prp.title || propertyClassOf( prp['class'] ).title );
				rows += '<tr><td class="propertyTitle">'+rt+'</td><td>'+propertyValueOf( prp, hi )+'</td></tr>'
			}
		});
		// Add a property 'SpecIF:Type':
//		if( rC.title )
//			rows += '<tr><td class="propertyTitle">SpecIF:Type</td><td>'+rC.title+'</td></tr>';

		if( !rows ) return c1;	// no other properties
		return c1+'<p class="metaTitle">'+opts.propertiesLabel+'</p><table class="propertyTable"><tbody>'+rows+'</tbody></table>'

		// ---------------
		function fileRef( txt, opts ) {
			if( !opts ) return txt;
		//	if( opts.rev==undefined ) opts.rev = 0;
			if( opts.imgExtensions==undefined ) opts.imgExtensions = [ 'png', 'jpg', 'svg', 'gif', 'jpeg' ];
			if( opts.applExtensions==undefined ) opts.applExtensions = [ 'bpmn' ];
		//	if( opts.clickableElements==undefined ) opts.clickableElements = false;
			
				function getUrl( str ) {
					// get the URL:
					var l = /(href|data)="([^"]+)"/.exec( str );  // url in l[2]
					// return null, because an URL is expected in any case:
					if( l == null ) { return undefined };    
					return l[2].replace('\\','/')
				}
				function withoutPath( str ) {
					str = str.replace('\\','/');
					return str.substring(str.lastIndexOf('/')+1)
				}
				function fileName( str ) {
					str = str.replace('\\','/');
					return str.substring( 0, str.lastIndexOf('.') )
				}
				function fileNameWithPath( u ) {
					// Unfortunately some (or even most) ePub-Readers do not support subfolders for images,
					// so we need to generate a GUID and to store all files in a single folder.
					return '../'+opts.epubImgPath+'F-'+u.simpleHash()
				}
				function pushReferencedFile( f ) {
					// avoid duplicate entries:
					if( indexBy( xhtml.images, 'title', f.title )<0 ) {
						if( f.blob ) {
							xhtml.images.push({
								id: 'F-'+f.title.simpleHash(),
						//		id: f.id,
						//		title: f.title,  // is the distinguishing/relative part of the URL
								blob: f.blob,
								type: f.type
							})
						} else {
							console.warn('No image file found for ',f.title)
						}
					}
				}

			// Prepare a file reference for viewing and editing:
//			console.debug('fileRef 0: ', txt);
				
			// 1. Transform two nested objects to link+object resp. link+image:
			// a) Especially OLE-Objects from DOORS are coming in this format; the outer object is the OLE, the inner is the preview image.
			//    The inner object can be a tag pair <object .. >....</object> or comprehensive tag <object .. />.
			//		Sample data from french branch of a japanese car OEM:
			//			<object data=\"OLE_AB_4b448d054fad33a1_23_2100028c0d_28000001c9__2bb521e3-8a8c-484d-988a-62f532b73612_OBJECTTEXT_0.ole\" type=\"text/rtf\">
			//				<object data=\"OLE_AB_4b448d054fad33a1_23_2100028c0d_28000001c9__2bb521e3-8a8c-484d-988a-62f532b73612_OBJECTTEXT_0.png\" type=\"image/png\">OLE Object</object>
			//			</object>
			//		Sample data from ReX:
			//			<object data=\"Tabelle mit WordPics_Partner1/4_Object_Text_0.ole\" type=\"application/oleobject\">\n   
			//				<object data=\"Tabelle mit WordPics_Partner1/4_Object_Text_0.png\" type=\"image/png\">OLE Object</object>\n 
			//			</object>
			//		Sample from ProSTEP ReqIF Implementation Guide:
			//			<xhtml:object data="files/powerpoint.rtf" height="96" type="application/rtf" width="96">
			//				<xhtml:object data="files/powerpoint.png" height="96" type="image/png" 	width="96">
			//					This text is shown if alternative image can't be shown
			//				</xhtml:object>
			//			</xhtml:object>
			// b) But there is also the case where the outer object is a link and the inner object is an image:
			//          <object data=\"https://adesso.de\" ><object data=\"files_and_images/Logo-adesso.png\" type=\"image/png\" />Project Information</object>

		//	txt = txt.replace( /<object([^>]+)>[\s\S]*?<object([^>]+)(\/>|>([\s\S]*?)<\/object>)[\s\S]*?<\/object>/g,   
			txt = txt.replace( reNestedObjects,   
				function( $0, $1, $2, $3, $4 ) {        // description is $4
					let u1 = getUrl( $1 ),  			// the primary information
//						t1 = getType( $1 ), 
						u2 = getUrl( $2 ), 				// the preview image
//						s2 = getStyle( $2 ), 
//						t2 = getType( $2 ),
						e = extOf(u2);	// get the file extension

					if( !e ) return $0

					// If there is no description, use the name of the link target:
					let d = escapeXML(withoutPath( $4 || u1 )); // $4 is the description between object tags

					return findBestFile( u2, e, d )
				}
			);
//			console.debug('fileRef 1: ', txt);  
				
			// 2. Transform a single object to link+object resp. link+image:
			//      For example, the ARCWAY Cockpit export uses this pattern:
			//			<object data=\"files_and_images\\27420ffc0000c3a8013ab527ca1b71f5.svg\" name=\"27420ffc0000c3a8013ab527ca1b71f5.svg\" type=\"image/svg+xml\"/>
			txt = txt.replace( reSingleObject,   //  comprehensive tag or tag pair
				function( $0, $1, $2, $3 ){ 
					let u1 = getUrl( $1 ), 
				//		s1 = getStyle( $1 ), 
				//		t1 = getType( $1 ),
						e = extOf(u1);	// get the file extension

					if( !e ) return $0

					// $3 is the description between the tags <object></object>:
					let d = escapeXML(withoutPath( $3 || u1 ));
					e = e.toLowerCase();
//					console.debug( 'url:', u1, ', ext:', e, ', alt:', d );

					// If it is an application file, look for a preview image:
					if( opts.applExtensions.indexOf( e )>-1 ) {  
							let noPreview = true;
							// replace by preview image, if possible:
							for( var i=data.files.length-1; noPreview && i>-1; i-- ) {
								if( data.files[i].title.indexOf( fileName(u1) )>-1 ) {
									u1 = data.files[i].title;
									e = extOf(u1).toLowerCase();
									noPreview = false;
//									console.debug('*0', u1, e);
								}
							};
							if( noPreview )
								// in absence of an image, just show the description:
								return '<span>'+d+'</span>' 
							// else we have an image to show
					};
					return findBestFile( u1, e, d )
				}
			);	
//			console.debug('fileRef result: ', txt);
			return txt

				function findBestFile( ti, ext, alt ) {
					// ToDo: Check whether the referenced file exists

					if( opts.imgExtensions.indexOf( ext )>-1 ) {  
						// it is an image, show it:

						// if the type is svg and if png is preferred and available, replace it:
						if( ( ti.indexOf('svg')>-1 ) && opts.preferPng )
							ti = fileName(ti)+'.png';
						
						pushReferencedFile( itemBy( data.files, 'title', ti ) );
						return '<img src="'+fileNameWithPath(ti)+'" style="max-width:100%" alt="'+alt+'" />'
					};
					// as a last resort, just show the description:
					return '<span>'+alt+'</span>'  
				}
		}
		function titleLinks( str, hi, opts ) {
			// Transform sub-strings with dynamic linking pattern to internal links.
			// Syntax:
			// - A resource (object) title between CONFIG.dynLinkBegin and CONFIG.dynLinkEnd will be transformed to a link to that resource.
			// - Icons in front of titles are ignored
			// - Titles shorter than 4 characters are ignored
			// - see: https://www.mediawiki.org/wiki/Help:Links

			// in certain situations, remove the dynamic linking pattern from the text:
			if( !opts.addTitleLinks )
				return str.replace( opts.RE.TitleLink, function( $0, $1 ) { return $1 } )
				
			// else, find all dynamic link patterns in the current property and replace them by a link, if possible:
			str = str.replace( opts.RE.TitleLink, 
				function( $0, $1 ) { 
//					if( $1.length<opts.titleLinkMinLength ) return $1;
					let m=$1.toLowerCase(), cR, ti;
					// is ti a title of any resource?
					for( var x=data.resources.length-1;x>-1;x-- ) {
						cR = data.resources[x];
									
						// avoid self-reflection:
//						if(ob.id==cR.id) continue;

						// get the pure title text:
						ti = cR.title;

						// disregard objects whose title is too short:
						if( !ti || ti.length<opts.titleLinkMinLength ) continue;

						// if the titleLink content equals a resource's title, replace it with a link:
						if(m==ti.toLowerCase()) return '<a href="'+anchorOf(cR,hi)+'">'+$1+'</a>'
					};
					// The dynamic link has NOT been matched/replaced, so mark it:
					return '<span style="color:#D82020">'+$1+'</span>'
				}
			);
			return str
		}
		function propertyValueOf( prp, hi ) {
			if( !prp.value ) return '';
			// return the value of a single property:
//			console.debug('propertyValueOf',prp,hi);
			if(prp['class']) {
				let dT = itemBy( data.dataTypes, 'id', propertyClassOf(prp['class']).dataType );
				switch( dT.type ) {
					case opts.dataTypeEnumeration:
						let ct = '',
							eV = null,
							st = opts.stereotypeProperties.indexOf(prp.title)>-1,
							vL = prp.value.split(',');  // in case of ENUMERATION, content carries comma-separated value-IDs
						for( var v=0,V=vL.length;v<V;v++ ) {
							eV = itemBy(dT.values,'id',vL[v]);
							// If 'eV' is an id, replace it by title, otherwise don't change:
							// Add 'double-angle quotation' in case of SubClass values.
							if( eV ) ct += (v==0?'':', ')+(st?('&#x00ab;'+opts.lookup(eV.value)+'&#x00bb;'):opts.lookup(eV.value))
							else ct += (v==0?'':', ')+vL[v] // ToDo: Check whether this case can occur
						};
						return escapeXML( ct );
					case opts.dataTypeXhtml:
						return titleLinks( fileRef( replaceLt(prp.value), opts ), hi, opts );
					case opts.dataTypeString:
						return titleLinks( escapeXML( prp.value ), hi, opts )
				}
			};
			// for all other dataTypes or when there no dataType:
			return escapeXML( prp.value )					
		}
	}
	function renderHierarchy( nd, hi, lvl ) {
		// For each of the children of specified hierarchy node 'nd', 
		// write a paragraph for the referenced resource:
	//	if( !nd.nodes || nd.nodes.length<1 ) return '';
		
		let r = itemBy( data.resources, 'id', nd.resource ), // the referenced resource
			params={
				nodeId: nd.id,
				level: lvl
			};

		r = opts.classifyProperties( r, data );
//		console.debug('renderHierarchy',r);
		var ch = 	titleOf( r, params, opts )
				+	propertiesOf( r, hi, opts )
				+	statementsOf( r, hi, opts );

		if( nd.nodes )
			nd.nodes.forEach( function(n) {
				ch += renderHierarchy( n, hi, lvl+1 )		// next level
			});
		return ch
	}
	function xhtmlOf( doc ) {
		// make a xhtml file content from the elements provided:
//		console.debug('xhtmlOf',doc);
		return	'<?xml version="1.0" encoding="UTF-8"?>'
		+		'<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">'
		+		'<html xmlns="http://www.w3.org/1999/xhtml">'
		+			'<head>'
		+				'<link rel="stylesheet" type="text/css" href="../Styles/styles.css" />'
		+				'<title>'+doc.title+'</title>'
		+			'</head>'
		+			'<body>'
		+				doc.body
		+			'</body>'
		+		'</html>'
	}

	// ---------- helper -----------
	function itemBy( L, p, s ) {
		if( L && p && s ) {
			// given the ID of an element in a list, return the element itself:
		//	s = s.trim();
			for( var i=L.length-1;i>-1;i-- )
				if( L[i][p]==s ) return L[i]   // return list item
		};
		return
	}
	function indexBy( L, p, s ) {
		if( L && p && s ) {
			// Return the index of an element in list 'L' whose property 'p' equals searchterm 's':
			// hand in property and searchTerm as string !
			for( var i=L.length-1;i>-1;i-- )
				if( L[i][p]==s ) return i
		};
		return -1
	}
	function hasContent( str ) {
		// check whether str has content or a reference:
		if( !str ) return false;
		return str.replace(/<[^>]+>/g, '').trim().length>0	// strip HTML and trim
			|| /<object[^>]+(\/>|>[\s\S]*?<\/object>)/.test(str)
			|| /<img[^>]+(\/>|>[\s\S]*?<\/img>)/.test(str)
			|| /<a[^>]+>[\s\S]*?<\/a>/.test(str)
	}
	function replaceLt( txt ) {
		// remove '<' where it does not belong to a tag;
		// Beware that (as of today) the MS-Edge ePub-Reader is not up to the standards !
		// Also 'Sigil' issues a wrong error message on opening a document with other special chars
		// which are permitted according to the specs.
		return txt.replace( /<([^a-z//]{1})/g, function($0,$1) {return '&lt;'+$1} )
	}
	function escapeXML( s ) {
		if( !s ) return '';
		return s.replace( opts.RE.AmpersandPlus, function($0,$1) {
				// 1. Replace &, unless it belongs to an XML entity:
				if( opts.RE.XMLEntity.test($0) ) {
					// no replacement:
					return $0
				} else {
					// encode the '&' and add the remainder of the pattern:
					return '&#38;'+$1
				}
			})
			.replace(/[<>"']/g, function($0) {
				// 2. Replace <, >, " and ':
				return "&#" + {"<":"60", ">":"62", '"':"34", "'":"39"}[$0] + ";";
			})
	}
	function extOf( str ) {
		// get the file extension without the '.':
		return str.substring( str.lastIndexOf('.')+1 )
	}  
}