function toXhtml( data, opts ) {
	"use strict";
	// Accepts data-sets according to SpecIF v0.10.4 or v0.11.2 and later.
	// Copyright: adesso AG (http://adesso.de)
	// License: Apache 2.0 (http://www.apache.org/licenses/)
	// Limitations:
	// - HTML ids are made from resource ids, so multiple reference of a resource results in mutiple occurrences of the same id.
	// - Title links are only correct if they reference objects in the same SpecIF hierarchy (hence, the same xhtml file)

	// Check for missing options:
	if( typeof(opts)!='object' ) opts = {};
	if( typeof(opts.classifyProperties)!='function' && typeof(opts.fail)=='function' ) {
		opts.fail({status:904,statusText:'function opts.classifyProperties is undefined.'});
		return
	};
	if( typeof(opts.translateTitles)!='boolean' ) opts.translateTitles = false;
	if( !opts.translateTitles || typeof(opts.translate)!='function' ) {
		opts.translate = function(str) { return str }
	};
	// If a hidden property is defined with value, it is suppressed only if it has this value;
	// if the value is undefined, the property is suppressed in all cases.
	if( !opts.hiddenProperties ) opts.hiddenProperties = [];
	if( !opts.stereotypeProperties ) opts.stereotypeProperties = ['SpecIF:Stereotype'];	

	// If no lable is provided, the respective properties are skipped:
	if( opts.propertiesLabel && opts.translateTitles ) opts.propertiesLabel = opts.translate( opts.propertiesLabel );	
	if( opts.statementsLabel && opts.translateTitles ) opts.statementsLabel = opts.translate( opts.statementsLabel );	
	if( !opts.titleLinkBegin ) opts.titleLinkBegin = '\\[\\[';		// must escape javascript AND RegEx
	if( !opts.titleLinkEnd ) opts.titleLinkEnd = '\\]\\]';			// must escape javascript AND RegEx
	if( typeof opts.titleLinkMinLength!='number' ) opts.titleLinkMinLength = 3;	
	opts.addTitleLinks = opts.titleLinkBegin && opts.titleLinkEnd && opts.titleLinkMinLength>0;
	if( typeof(opts.RE)!='object' ) opts.RE = {};
	if( opts.titleLinkBegin && opts.titleLinkEnd )
		opts.RE.TitleLink = new RegExp( opts.titleLinkBegin+'(.+?)'+opts.titleLinkEnd, 'g' );

	// All required parameters are available, so we can begin.
	var xhtml = {
			headings: [],		// used to build the ePub table of contents
			sections: [],		// the xhtml files for the title and each chapter=section
			images: []			// the referenced images
		};
	
	// Create a title page as xhtml-file and add it as first section:
	xhtml.sections.push(
			xhtmlOf({ 
				title: data.title,
				sect: null,
				body: '<div class="title">'+data.title+'</div>'
			})
	);
	
	// For each SpecIF hierarchy, create a xhtml-file and add it as subsequent section:
	let firstHierarchySection = xhtml.sections.length;  // index of the next section number
	data.hierarchies.forEach( function(h,hi) {
		pushHeading( h.title, {nodeId: h.id, level: 1} );
		xhtml.sections.push(
			xhtmlOf({ 
				title: data.title,
				sect: h,
				body: renderHierarchy( h, hi, 1 )
			})
		)
	});

//	console.debug('xhtml',xhtml);
//	return { result: xhtml, status: 200, statusText: 'OK!' };
	return xhtml
	
	// ---------------
	function pushHeading( t, pars ) {	// title, parameters
		xhtml.headings.push({
				id: pars.nodeId,
				title: t,
				section: xhtml.sections.length,  // the index of the section in preparation (before it is pushed)
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
		if( ic ) ic += '&#160;'; // non-breakable space
		if( !pars || pars.level<1 ) return (ti?ic+ti:'');
		if( rC.isHeading ) pushHeading( ti, pars );
		let l = rC.isHeading?2:3;
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
			sTi = opts.translate( itemBy(data.statementClasses,'id',cid).title );
/*			// 5 columns:
			ct += '<tr><td>';
			sts[cid].subjects.forEach( function(r2) {
//				console.debug('r2',r2,itemBy( data.resourceClasses,'id',r2['class']))
				ct += '<a href="#'+r2.id+'">'+titleOf( r2, null, opts )+'</a><br/>'
			};
			ct += '</td><td class="statementTitle">'+(sts[cid].subjects.length>0?sTi:'');
			ct += '</td><td>'+titleOf( r, null, opts );
			ct += '</td><td class="statementTitle">'+(sts[cid].objects.length>0?sTi:'')+'</td><td>';
			sts[cid].objects.forEach( function(r2) {
				ct += '<a href="#'+r2.id+'">'+titleOf( r2, null, opts )+'</a><br/>'
			};
			ct += '</td></tr>'
*/
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
			c1 += valOf( prp, hi )
		});
		// Skip the remaining properties, if no label is provided:
//		console.debug('#1',c1)
		if( !opts.propertiesLabel ) return c1;
		
		// Finally, list the remaining properties with property title (name) and value:
		r.other.forEach( function(prp) {
			// the property title or it's class's title:
			rt = opts.translate( prp.title || propertyClassOf( prp['class'] ).title );
			rows += '<tr><td class="propertyTitle">'+rt+'</td><td>'+valOf( prp, hi )+'</td></tr>'
		});
		// Add a property 'SpecIF:Type':
//		if( rC.title )
//			rows += '<tr><td class="propertyTitle">SpecIF:Type</td><td>'+rC.title+'</td></tr>';

		if( !rows ) return c1;	// no other properties
		return c1+'<p class="metaTitle">'+opts.propertiesLabel+'</p><table class="propertyTable"><tbody>'+rows+'</tbody></table>'

		// ---------------
		function isEmpty( str ) {
			// checks whether str has content or a file reference:
			return str.replace(/<[^>]+>/g, '').trim().length<1	// strip HTML and trim
				&& !/<object[^>]+(\/>|>[\s\S]*?<\/object>)/.test(str)
				&& !/<img[^>]+(\/>|>[\s\S]*?<\/img>)/.test(str)
		}
		function fileRef( txt, opts ) {
			if( !opts ) return txt;
	//		if( opts.rev==undefined ) opts.rev = 0;
			if( opts.imgExtensions==undefined ) opts.imgExtensions = [ 'png', 'jpg', 'svg', 'gif', 'jpeg' ];
	//		if( opts.clickableElements==undefined ) opts.clickableElements = false;
			
				function getType( str ) {
					var t = /type="([^"]+)"/.exec( str );
					if( t==null ) return '';
					return (' '+t[1])
				}
/*				function getStyle( str ) {
					var s = /(style="[^"]+")/.exec( str );
					if( s==null ) return '';  
					return (' '+s[1])
				}
*/				function getUrl( str ) {
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
				function addEpubPath( u ) {
					// Unfortunately some (or even most) ePub-Readers do not support subfolders for images,
					// so we need to generate a GUID and to store all files in a single folder.
					// The hashcode includes path, filename and extension:
					return '../'+opts.epubImgPath+hashCode(u)
//					return '../'+opts.epubImgPath+withoutPath( u )
				}
				function pushReferencedFile( f ) {
					// avoid duplicate entries:
					if( indexBy( xhtml.images, 'id', f.id )<0 ) {
						xhtml.images.push({
							id: hashCode(f.title),					
							title: f.title,  // is the distinguishing/relative part of the URL
							blob: f.blob,
							type: f.type
						})
					} else {
						console.warn('No image file found for ',f.title)
					}
				}

			// Prepare a file reference for viewing and editing:
//			console.debug('fromServer 0: ', txt);
				
			// 1. transform two nested objects to link+object resp. link+image:
			//    Especially OLE-Objects from DOORS are coming in this format; the outer object is the OLE, the inner is the preview image.
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
			txt = txt.replace( /<object([^>]+)>[\s\S]*?<object([^>]+)(\/>|>([\s\S]*?)<\/object>)[\s\S]*?<\/object>/g,   
				function( $0, $1, $2, $3, $4 ) {        // description is $4
					let u1 = getUrl( $1 ),  			// the primary information
//						t1 = getType( $1 ), 
						u2 = getUrl( $2 ), 				// the preview image
//						s2 = getStyle( $2 ), 
//						t2 = getType( $2 ),
						fi;
					// If there is no description, use the name of the link target:
					$4 = $4 || u1; // $4 is now the description between object tags

					fi = itemBy( data.files, 'title', u2 ); // we assume that the referenced file exists
					// ToDo: Check whether the referenced file exists
					
					// if the type is svg, png is preferred and available, replace it:
					if( u2.indexOf('svg')>-1 && opts.preferPng ) {
						fi = itemBy( data.files, 'title', fileName(u2)+'.png' )
					};

//					console.debug('*1',u2,fi);
					pushReferencedFile( fi );
//					console.debug( 'r1', $0, $4, u1, i2, u2, t2 );
					return'<img src="'+addEpubPath(fi.title)+'" style="max-width:100%" alt="'+$4+'" />'
//					return'<div class="forImage"><object data="'+addEpubPath(u2)+'"'+t2+s2+' >'+$4+'</object></div>'
				}
			);
//			console.debug('fromServer 1: ', txt);
				
			// 2. transform a single object to link+object resp. link+image:
			//      For example, the ARCWAY Cockpit export uses this pattern:
			//			<object data=\"files_and_images\\27420ffc0000c3a8013ab527ca1b71f5.svg\" name=\"27420ffc0000c3a8013ab527ca1b71f5.svg\" type=\"image/svg+xml\"/>
			txt = txt.replace( /<object([^>]+)(\/>|>([\s\S]*?)<\/object>)/g,   //  comprehensive tag or tag pair
				function( $0, $1, $2, $3 ){ 
					let u1 = getUrl( $1 ), 
//						s1 = getStyle( $1 ), 
						t1 = getType( $1 ),
						i1,
						fi;

					// get the file extension:
					let e = extOf(u1);
					if( !e ) return $0

					// $3 is the description between the tags <object></object>:
					let d = withoutPath( $3 || u1 );
						
					e = e.toLowerCase();
//					console.debug( $0, $1, 'url: ', u1, 'ext: ', e );

					fi = itemBy( data.files, 'title', u1 ); // we assume that the referenced file exists
					// ToDo: Check whether the referenced file exists
					
//					console.debug('*0',data.files,u1,fi);
					if( opts.imgExtensions.indexOf( e )>-1 ) {  
						// it is an image, show it:

						// if the type is svg, png is preferred and available, replace it:
						if( u1.indexOf('svg')>-1 && opts.preferPng ) {
							fi = itemBy( data.files, 'title', fileName(u1)+'.png' ) || fi
						};
						
//						console.debug('*2',u1,fi);
						pushReferencedFile( fi );
						d = '<img src="'+addEpubPath(fi.title)+'" style="max-width:100%" alt="'+d+'" />'
//						d = '<object data="'+addEpubPath(u1)+'"'+t1+s1+' >'+d+'</object>
					} else {
						// if the type is ole, png is available, replace it:
						if( u1.indexOf('ole')>-1 ) {
							fi = itemBy( data.files, 'title', fileName(u1)+'.png' )
						};
						if( fi ) {  
							// It is an ole-file, so add a preview image;
//							console.debug('*3',u2,fi);
							pushReferencedFile( fi );
							d = '<img src="'+addEpubPath(fi.title)+'" style="max-width:100%" alt="'+d+'" />'
//							d = '<object data="'+addEpubPath( fileName(u1) )+'.png" type="image/png" >'+d+'</object>'
						} else {
							// in absence of an image, just show the description:
							d = '<span>'+d+'</span>'  
						}
					};
					return d
				}
			);	
//			console.debug('fileRef result: ', txt);
			return txt
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
		function valOf( prp, hi ) {
			if( !prp.value ) return '';
			// return the value of a single property:
//			console.debug('valOf',prp,hi);
			if(prp['class']) {
				let dT = itemBy( data.dataTypes, 'id', propertyClassOf(prp['class']).dataType );
				switch( dT.type ) {
					case 'xs:enumeration':
						let ct = '',
							eV = null,
							st = opts.stereotypeProperties.indexOf(prp.title)>-1,
							vL = prp.value.split(',');  // in case of ENUMERATION, content carries comma-separated value-IDs
						for( var v=0,V=vL.length;v<V;v++ ) {
							eV = itemBy(dT.values,'id',vL[v].trim());
							// If 'eV' is an id, replace it by title, otherwise don't change:
							// Add 'double-angle quotation' in case of stereotype values.
							if( eV ) ct += (v==0?'':', ')+(st?('&#x00ab;'+eV.value+'&#x00bb;'):eV.value)
							else ct += (v==0?'':', ')+vL[v]
						};
						return escapeXML( ct );
					case 'xhtml':
						return titleLinks( fileRef( replaceLt(prp.value), opts ), hi, opts );
					case 'xs:string':
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
		return	'<?xml version="1.0" encoding="UTF-8"?>'
		+		'<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">'
		+		'<html xmlns="http://www.w3.org/1999/xhtml">'
		+			'<head>'
		+				'<link rel="stylesheet" type="text/css" href="../Styles/styles.css" />'
		+				'<title>'+doc.title+'</title>'
		+			'</head>'
		+			'<body>'
		+	(doc.sect&&doc.sect.title?	'<h1'+(doc.sect.id?' id="'+doc.sect.id+'"':'')+'>'+doc.sect.title+'</h1>' : '')
		+				doc.body
		+			'</body>'
		+		'</html>'
	}

	// ---------- helper -----------
	function itemBy( L, p, s ) {
		if(!L||!p||!s) return undefined;
		// given the ID of an element in a list, return the element itself:
//		id = id.trim();
		for( var i=L.length-1;i>-1;i-- )
			if( L[i][p]==s ) return L[i];   // return list item
		return undefined
	}
	function indexBy( L, p, s ) {
		if(!L||!p||!s) return -1;
		// Return the index of an element in list 'L' whose property 'p' equals searchterm 's':
		// hand in property and searchTerm as string !
		for( var i=L.length-1;i>-1;i-- )
			if( L[i][p]==s ) return i;
		return -1
	}
	function replaceLt( txt ) {
		// remove '<' where it is neither an opening or closing tag.
		// Beware that the MS-Edge ePub-Reader is not up to the standards !
		return txt.replace( /<([^a-z//]{1})/g, function($0,$1) {return '&lt;'+$1} )
	}
	function escapeXML( s ) {
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
				return "&" + {"<":"#60", ">":"#62", '"':"#34", "'":"#39"}[$0] + ";";
			})
	}
	function extOf( str ) {
		// get the file extension without the '.':
		return str.substring( str.lastIndexOf('.')+1 )
	}
	// Make a very simple hash code from a string:
	// http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
	function hashCode(s) {for(var r=0,i=0;i<s.length;i++)r=(r<<5)-r+s.charCodeAt(i),r&=r;return r}
}
