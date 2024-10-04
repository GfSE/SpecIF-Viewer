/*!	Create and return an XHTML document using SpecIF data.

	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de
	License and terms of use: Apache 2.0 (https://apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
	.. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)

	Limitations:
	- HTML ids are made from resource ids, so multiple reference of a resource results in mutiple occurrences of the same id.
	- Title links are only correct if they reference objects in the same SpecIF hierarchy (hence, the same xhtml file)
	- Accepts data-sets according to SpecIF v1.1.
	- All values must be strings, the language must be selected before calling this function, i.e. languageValues as permitted by the schema are not supported!
	- There must only be one revision per resource or statement

	ToDo also:
	- move the title linking to the export filter
*/

function toXhtml( data, options ) {
	"use strict";

	// Reject versions < 1.1:
	if (!data['$schema'] || data['$schema'].includes('v1.0')) {
		let eTxt = "SpecIF Version < v1.1 is not supported.";
		if (typeof (opts.fail) == 'function')
			opts.fail({ status: 904, statusText: eTxt })
		else
			console.error(eTxt);
		return
	};

	let opts = Object.assign(
		{
			showEmptyProperties: false,
			addIcon: true,
			addOrder: false,
		//	hasContent: hasContent,
		//	titleLinkTargets: ['FMC:Actor', 'FMC:State', 'FMC:Event', 'SpecIF:Collection', 'SpecIF:Diagram', 'SpecIF:View', 'FMC:Plan'],
			titleProperties: ['dcterms:title'],
			descriptionProperties: ['dcterms:description', 'SpecIF:Diagram', 'SpecIF:View'],
			stereotypeProperties: ['uml:Stereotype'],
			titleLinkBegin: '\\[\\[',	// must escape javascript AND RegEx
			titleLinkEnd: '\\]\\]',		// must escape javascript AND RegEx
			titleLinkMinLength: 3,
			RE: {
				AmpersandPlus: new RegExp('&(.{0,8})', 'g'),
				XMLEntity: new RegExp('&(amp|gt|lt|apos|quot|#x[\da-fA-F]{1,4}|#\d{1,5});/', ''),

			}
		},
		options
	);
	opts.addTitleLinks = opts.titleLinkBegin && opts.titleLinkEnd && opts.titleLinkMinLength > 0;
	if (opts.addTitleLinks)
		opts.RE.TitleLink = new RegExp(opts.titleLinkBegin + '(.+?)' + opts.titleLinkEnd, 'g');

	const
		nbsp = '&#160;', // non-breakable space
		tagStr = "(<\\/?)([a-z]{1,10}( [^<>]+)?\\/?>)",
	//	RE_tag = new RegExp( tagStr, 'g' ),
		RE_inner_tag = new RegExp( "([\\s\\S]*?)"+tagStr, 'g' ),

	//	dataTypeXhtml = 'xhtml',
	//	dataTypeEnumeration = 'xs:enumeration',
		dataTypeString = 'xs:string';

	// A single comprehensive <object .../> or tag pair <object ...>..</object>.
	// Limitation: the innerHTML may not have any tags.
	// The [^<] assures that just the single object is matched. With [\\s\\S] also nested objects match for some reason.
	const
		reSO = '<object ([^>]+)(/>|>(.*?)</object>)',
		reSingleObject = new RegExp( reSO, 'g' ),
	// Two nested objects, where the inner is a comprehensive <object .../> or a tag pair <object ...>..</object>:
	// .. but nothing useful can be done in a WORD file with the outer object ( for details see below in splitRuns() ).
		reNO = '<object([^>]+)>[\\s]*' + reSO + '([\\s\\S]*?)</object>',
		reNestedObjects = new RegExp( reNO, 'g' );

	// All required parameters are available, so we can begin.
	var xhtml = {
			headings: [],		// used to build the ePub table of contents
			sections: [],		// the xhtml files for the title and each chapter=section
			images: []			// the referenced images
		},
		prTi = escapeXML(languageValueOf(data.title));

	// Create a title page as xhtml-file and add it as first section:
	xhtml.sections.push(
			makeXhtmlFile({ 
				title: prTi,
				body: '<div class="title">'+prTi+'</div>'
			})
	);
	
	// For each SpecIF hierarchy, create a xhtml-file and add it as subsequent section:
	const firstHierarchySection = xhtml.sections.length;  // index of the next section number
	data.nodes.forEach(
		(h, i) => {
			pushHeading( h.title, {nodeId: h.id, level: 1} );
			xhtml.sections.push(
				makeXhtmlFile({ 
					title: prTi,
					body: renderHierarchy( h, i, 1, '' )
				})
			)
		}
	);

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
	function titleOf( itm, pars, opts ) { // resource, resourceClass, parameters, options
		// render the resource or statement title

		// First, find and set the configured title:
		let a = titleIdx(itm.properties), ti;
		// The title property may be present, but empty, when opts.showEmptyProperties is set:
		if (a > -1 && itm.properties[a].values.length > 0) {  // found!
			// Remove all formatting for the title, as the app's format shall prevail.
			// Before, remove all marked deletions (as prepared be diffmatchpatch).
			// A title property should have just one value:
			ti = stripHtml(languageValueOf(itm.properties[a].values[0]));
		}
		else {
			// In case of a statement, use the class' title by default:
			ti = classTitleOf(itm);
		};

		ti = escapeXML(ti);
		if( !ti ) return '';
			
		// if itm has a 'subject', it is a statement:
		let cL = itm.subject? data.statementClasses : data.resourceClasses,
			eC = itemById( cL, itm['class'] );
		
		// add icon, if specified:
		ti = (opts.addIcon && eC && eC.icon ? eC.icon + nbsp + nbsp : '') + ti;

		// add order number, if specified:
		ti = (opts.addOrder && pars ? pars.order + nbsp + nbsp : '') + ti;

		if( !pars || typeof(pars.level)!='number' || pars.level<1 ) return ti;

		if( eC&&eC.isHeading ) pushHeading( ti, pars );
		let lvl = pars.level==1? 1 : (eC&&eC.isHeading? 2:3);
		return '<h'+lvl+' id="'+pars.nodeId+'">'+ti+'</h'+lvl+'>';
				
		function titleIdx( aL ) {
			// Find the index of the property to be used as title.
			// The result depends on the current user - only the properties with read permission are taken into consideration
			if( Array.isArray( aL ) )
				for( var a=0,A=aL.length;a<A;a++ ) {
					// First, check the configured title properties:
					if( opts.titleProperties.includes( prpTitleOf(aL[a]) ) ) return a;
				};
			return -1
		}
	}
	function statementsOf( r, hi, opts ) { // resource, options
		// render the statements (relations) about the resource in a table
		if( !opts.statementsLabel ) return '';
		
		let sts={}, cid, oid, sid, relatedR, noSts=true;
		// Collect statements by type:
		data.statements.forEach( function(st) {
			cid = titleOf( st, undefined, opts );
		/*	// all statements having the same class are clustered:
			cid = st['class']; */
			// SpecIF v0.10.x: subject/object without revision, v0.11.y: with revision
			sid = st.subject.id || st.subject;
			oid = st.object.id || st.object;
			if (sid == r.id || oid == r.id) {    // only statements with Resource r
				// create a list of statements with that type, unless it exists already:
				if (!sts[cid]) sts[cid] = { subjects: [], objects: [] };
				// add the resource to the list, knowing that it can be either subject or object, but not both:
				if (sid == r.id) {
					relatedR = itemById(data.resources, oid);
					if (relatedR) {
						sts[cid].objects.push(relatedR);
						noSts = false;
					};
				}
				else {
					relatedR = itemById(data.resources, sid);
					if (relatedR) {
						sts[cid].subjects.push(relatedR);
						noSts = false;
					};
				};
			};
		});
//		console.debug( 'statements', r.title, sts );
//		if( Object.keys(sts).length<1 ) return '';
		if( noSts ) return '';	// no statements ...
		
		// else, there are statements to render:
		// The heading:
		let ct = '<p class="metaTitle">' + opts.statementsLabel + '</p>';
	//		sTi;
		ct += '<table class="statementTable"><tbody>';
		for( cid in sts ) {

			// 3 columns:
			if( sts[cid].subjects.length>0 ) {
				ct += '<tr><td>';
				sts[cid].subjects.forEach( function(s) {
//					console.debug('s',s,itemById( data.resourceClasses,s['class']))
					ct += '<a href="'+anchorOf( s, hi )+'">'+titleOf( s, undefined, opts )+'</a><br/>'
				});
				ct += '</td><td class="statementTitle">'+cid;
			//	ct += '</td><td class="statementTitle">'+sTi;
				ct += '</td><td>'+titleOf( r, undefined, opts );
				ct += '</td></tr>'
			};
			if( sts[cid].objects.length>0 ) {
				ct += '<tr><td>'+titleOf( r, undefined, opts );
				ct += '</td><td class="statementTitle">' + cid + '</td><td>';
			//	ct += '</td><td class="statementTitle">'+sTi+'</td><td>';
				sts[cid].objects.forEach( function(o) {
					ct += '<a href="'+anchorOf( o, hi )+'">'+titleOf( o, undefined, opts )+'</a><br/>'
				});
				ct += '</td></tr>'
			}
		};
		return ct + '</tbody></table>'
	}
	function anchorOf( res, hi ) {
		// Find the hierarchy node id for a given resource;
		// the first occurrence is returned.
		// - 'hi' is an offset where to start searching.
		let y, ndId;
		for( var m=0, M=data.nodes.length; m<M; m++ ) {
			// for all nodes starting with the current one 'hi', the index of the top-level loop:
			y = (m+hi) % M;  
			ndId = nodeByRef( data.nodes[y] );
			if( ndId ) return ndId		// return node id
		};
		return;	// not found
		
		function nodeByRef( nd ) {
			if ((nd.resource.id || nd.resource) == res.id)
				return 'sect' + (y + firstHierarchySection) + '.xhtml#' + nd.id;  // fully qualified anchor including filename
			if (nd.nodes) {
				let ndId;
				for (var n of nd.nodes) {
					ndId = nodeByRef(n);
					if (ndId) return ndId
				};
			};
			return null;
		}
	}
	function propertiesOf( r, hi, opts ) {
		// render the resource's properties with title and value as xhtml:
		// designed for use also by statements.

	//	let rC = itemById( data.resourceClasses, r['class'] );
		
//		console.debug('propertiesOf',r, rC, hi, opts);
		// return the content of all properties, sorted by description and other properties:
		let c1='', rows='',
			descriptions=[], other=[];
		
		if( r.properties ) {
			r.properties.forEach( (p)=>{
				if( opts.descriptionProperties.indexOf( prpTitleOf(p) )>-1 ) {
					descriptions.push(p);
				} else {
					// Disregard the title properties, here:
					if( opts.titleProperties.indexOf( prpTitleOf(p) )<0 )
						other.push(p);
				}
			});
		};

		if( descriptions.length>0 )
			descriptions.forEach( (p)=>{
				c1 += '<p>'+propertyValuesOf( p, hi )+'</p>';
			})
		else
			if( r.description ) c1 += '<p>'+propertyValuesOf( r.description, hi )+'</p>';

		// Skip the remaining properties, if no label is provided:
//		console.debug('#1',c1)
		if( !opts.propertiesLabel || other.length<1 ) return c1;
		
		// Finally, list the remaining properties with property title (name) and value:
		other.forEach( function(p) {
			// the property title or its class' title:
			if( p.values.length>0 || opts.showEmptyProperties ) {
				rows += '<tr><td class="propertyTitle">' + prpTitleOf(p)+'</td><td>'+propertyValuesOf( p, hi )+'</td></tr>'
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
					return '../' + opts.epubImgPath + 'F-' + simpleHash(u)
				}
				function pushReferencedFile( f ) {
					if( f && f.blob ) {
						// avoid duplicate entries:
						if( indexByTitle( xhtml.images, f.title )<0 ) {
							xhtml.images.push({
								id: 'F-' + simpleHash(f.title),
							//	id: f.id,
							//	title: f.title,  // is the distinguishing/relative part of the URL
								blob: f.blob,
								type: f.type
							})
						};
						// file is present in xhtml.images:
						return true;
					};
					// else:
					return false;
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
					if( opts.applExtensions.includes( e ) ) {  
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
						
						if( pushReferencedFile( itemByTitle( data.files, ti )) )
							return '<img src="'+fileNameWithPath(ti)+'" style="max-width:100%" alt="'+alt+'" />';
					};
					// else:
					console.warn('No image file found for ',ti);
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
					let m=$1.toLowerCase(), cR, ti, rC;
					// is ti a title of any resource?
					for( var x=data.resources.length-1;x>-1;x-- ) {
						cR = data.resources[x];
									
					/*	// avoid self-reflection:
						if(ob.id==cR.id) continue;
					*/
						// get the pure title text:
						ti = titleOf(cR, undefined, Object.assign({}, opts, { addIcon: false }));

						// disregard objects whose title is too short:
						if( !ti || ti.length<opts.titleLinkMinLength ) continue;

					/*	// disregard link targets which aren't diagrams nor model elements:
						rC = itemById(data.resourceClasses, cR['class']);
						if (opts.titleLinkTargets.indexOf(rC.title) < 0) continue;  */

						// if the titleLink content equals a resource's title, replace it with a link:
						if(m==ti.toLowerCase()) return '<a href="'+anchorOf(cR,hi)+'">'+$1+'</a>'
					};
					// The dynamic link has NOT been matched/replaced, so mark it:
					return '<span style="color:#D82020">'+$1+'</span>'
				}
			);
			return str
		}
		function propertyValuesOf( prp, hi ) {
//			if( !prp.values || prp.values.length<0 ) return '';
			// return the value of a single property:
//			console.debug('propertyValuesOf',prp,hi);
			let pC = itemById(data.propertyClasses, prp['class']),
				dT = itemById(data.dataTypes, pC.dataType);
			if (dT.enumeration) {
				let ct = '';
				for (var v of prp.values) {
					// multiple values in a comma-separated string;
					// string values should have just a single language (already filtered during export):
					switch (dT.type) {
						case dataTypeString:
							ct += (ct.length == 0 ? '' : ', ') + itemById(dT.enumeration, v).value[0]['text'];
							break;
						default:
							ct += (ct.length == 0 ? '' : ', ') + itemById(dT.enumeration, v).value;
					}
				};
				return escapeXML(ct);
			};
			// else
			let ct = '';
			switch (dT.type) {
				case dataTypeString:
					for (var v of prp.values) {
						// string values should have just a single language (already filtered during export):
						ct += titleLinks(fileRef(escapeInner(v[0]['text']), opts), hi, opts);
					};
					break;
				default:
					for (var v of prp.values) {
						// multiple values in a comma-separated string:
						ct += (ct.length == 0 ? '' : ', ') + escapeXML(v);
					}
			};
			return ct;
		/*	if(prp['class']) {
				let pC = itemById(data.propertyClasses, prp['class']),
					dT = itemById(data.dataTypes, pC.dataType);
				switch( dT.type ) {
					case dataTypeEnumeration:
						let ct = '',
							eV = null,
							st = opts.stereotypeProperties.indexOf(prp.title)>-1,
							vL = prp.value.split(',');  // in case of ENUMERATION, content carries comma-separated value-IDs
						for( var v=0,V=vL.length;v<V;v++ ) {
							eV = itemById(dT.values,vL[v]);
							// If 'eV' is an id, replace it by title, otherwise don't change:
							// Add 'double-angle quotation' in case of SubClass values.
							if (eV) ct += (v == 0 ? '' : ', ') + (st ? ('&#x00ab;' + eV.value + '&#x00bb;') : eV.value)
							else ct += (v==0?'':', ')+vL[v] // ToDo: Check whether this case can occur
						};
						return escapeXML( ct );
					case dataTypeString:
					//	return titleLinks( escapeXML( prp.value ), hi, opts );
					case dataTypeXhtml:
						return titleLinks( fileRef( escapeInner(prp.value), opts ), hi, opts );
				}
			};
			// for all other dataTypes or when there no dataType:
			return escapeXML( prp.value ) */			
		}
	}
	function renderHierarchy( nd, idx, lvl, ord ) {
		// For each of the children of specified hierarchy node 'nd', 
		// write a paragraph for the referenced resource:
	//	if( !nd.nodes || nd.nodes.length<1 ) return '';
		
		let r = itemById( data.resources, nd.resource ), // the referenced resource
			params = {
				level: lvl,
				order: ord + (ord.length > 0 ? '.' : '') + (idx + 1),
				nodeId: nd.id
			};

//		console.debug('renderHierarchy',r);
		var ch = 	titleOf( r, params, opts )
				+	propertiesOf( r, idx, opts )
				+	statementsOf( r, idx, opts );

		if( nd.nodes )
			nd.nodes.forEach( (n,i) => {
				ch += renderHierarchy( n, i, lvl+1, params.order )		// next level
			});
		return ch
	}
	function makeXhtmlFile( doc ) {
		// make a xhtml file content from the elements provided:
//		console.debug('makeXhtmlFile',doc);
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
/*	function indexById(L, key) {
		if (L && key) {
			// given an ID of an item in a list, return it's index:
			let id = key.id || key;
			//	id = id.trim();
			for (var i = L.length - 1; i > -1; i--)
				if (L[i].id == id) return i   // return list index 
		};
		return -1
	} */
	function itemById(L, key) {
		if (L && key) {
			// given the ID of an element in a list, return the element itself:
			let id = key.id || key;
			//	id = id.trim();
			for (var i = L.length - 1; i > -1; i--)
				if (L[i].id === id) return L[i];   // return list item
		};
		//	return undefined
	}
	function itemByTitle(L, ln) {
		if (L && ln) {
			// given a title of an element in a list, return the element itself:
			for (var i = L.length - 1; i > -1; i--)
				if (L[i].title == ln) return L[i];   // return list item
		};
		//	return undefined
	}
	function indexByTitle( L, s ) {
		if( L && s ) {
			// Return the index of an element in list 'L' whose property 'p' equals searchterm 's':
			// hand in property and searchTerm as string !
			for( var i=L.length-1;i>-1;i-- )
				if( L[i].title==s ) return i;
		};
		return -1;
	}
	function prpTitleOf( prp ) {
		// get the title of a resource/statement property as defined by itself or it's class:
		return prp.title || itemById(data.propertyClasses, prp['class']).title;
	}
	function classTitleOf( el ) {
		/*	// get the title of a resource or statement as defined by itself or it's class;
			// el is a statement, if it has a subject:
			return itemById(el.subject ? data.statementClasses : data.resourceClasses, el['class']).title */
		// get the title of a statement as defined by it's class;
		// el is a statement, if it has a subject:
		return el.subject ? itemById(data.statementClasses, el['class']).title : '';
	}
	function languageValueOf(val) {
		// assuming that only the desired language has already been selected during export:
		return (typeof (val) == 'string' ? val : val[0].text)
	}
/*	function hasContent( str ) {
		// Check whether str has content or a reference:
		if( !str ) return false;
		return str.replace(/<[^>]+>/g, '').trim().length>0	// strip HTML and trim
			|| /<object[^>]+(\/>|>[\s\S]*?<\/object>)/.test(str)
			|| /<img[^>]+(\/>|>[\s\S]*?<\/img>)/.test(str)
			|| /<a[^>]+>[\s\S]*?<\/a>/.test(str);
	} */
	function escapeXML( s ) {
		if( !s ) return '';
		return s.replace( opts.RE.AmpersandPlus, function($0,$1) {
				// 1. Replace &, unless it belongs to an XML entity:
				if( opts.RE.XMLEntity.test($0) )
					// no replacement:
					return $0;
				// else, encode the '&' and add the remainder of the pattern:
				return '&#38;'+$1;
			})
			.replace(/[<>"']/g, function($0) {
				// 2. Replace <, >, " and ':
				return "&#" + {"<":"60", ">":"62", '"':"34", "'":"39"}[$0] + ";";
			});
	}
	function escapeInner( str ) {
		var out = "";
		str = str.replace( RE_inner_tag, function($0,$1,$2,$3) {
			// $1: inner text (before the next tag)
			// $2: start of opening tag '<' or closing tag '</'
			// $3: rest of the tag
			// escape the inner text and keep the tag:
			out += escapeXML($1) + $2 + $3;
			return '';
		});
		// process the remainder (the text after the last tag or the whole text if there was no tag:
		out += escapeXML(str);
		return out;
	} 
	/**
	 * Returns the text from a HTML string
	 * see: https://ourcodeworld.com/articles/read/376/how-to-strip-html-from-a-string-extract-only-text-content-in-javascript
	 * 
	 * @param {html} String The html string to strip
	 */
	function stripHtml(html){
		var temp = document.createElement("div");
		// Set the HTML content with the providen
		temp.innerHTML = html;
		// Retrieve the text property of the element (cross-browser support)
		return temp.textContent || temp.innerText || "";
	}
	// Make a very simple hash code from a string:
	// http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
	function simpleHash(str) { for (var r = 0, i = 0; i < str.length; i++)r = (r << 5) - r + str.charCodeAt(i), r &= r; return r }
	function extOf( str ) {
		// get the file extension without the '.':
		return str.substring( str.lastIndexOf('.')+1 );
	}  
}
