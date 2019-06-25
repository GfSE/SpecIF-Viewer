function toEpub( data, opts ) {
	"use strict";
	// Accepts data-sets according to SpecIF v0.10.4 or v0.11.2 and later.
	// Copyright: adesso AG (http://adesso.de)
	// License: Apache 2.0 (http://www.apache.org/licenses/)
	// Dependencies: 
	// - jszip ( https://github.com/Stuk/jszip ), 
	// - fileSaver ( https://github.com/eligrey/FileSaver.js ), 
	// ePub Tutorials: 
	// - https://www.ibm.com/developerworks/xml/tutorials/x-epubtut/index.html
	// - http://www.jedisaber.com/eBooks/formatsource.shtml
	// ToDo: Embed font with sufficient UTF-8 coverage: http://www.dpc-consulting.org/epub-praxis-fonts-einbinden-und-verwenden/
	// ToDo: Control pagination: http://www.dpc-consulting.org/epub-praxis-seitenumbruche-steuern-und-elemente-zusammenhalten/

	// Check for missing options:
	if ( !opts ) opts = {};
	if( !opts.metaFontSize ) opts.metaFontSize = '70%';	
	if( !opts.metaFontColor ) opts.metaFontColor = '#0071B9';	// adesso blue
	if( !opts.linkFontColor ) opts.linkFontColor = '#0071B9';
//	if( !opts.linkFontColor ) opts.linkFontColor = '#005A92';	// darker
	if( typeof(opts.linkNotUnderlined)!='boolean' ) opts.linkNotUnderlined = false;
	if( typeof(opts.preferPng)!='boolean' ) opts.preferPng = true;
	opts.epubImgPath = 'Images/';
		
	// All required parameters are available, so we can begin:
	let i=null, I=null,
		ePub = toXhtml( data, opts );
	
	ePub.fileName = data.title;
	ePub.mimetype = 'application/epub+zip';
//	console.debug( 'files', data.files );

//	ePub.cover = undefined;
	ePub.styles = 	
				'body { margin-top:2%; margin-right:2%; margin-bottom:2%; margin-left:2%; font-family:Arial,sans-serif; font-size:100%; font-weight: normal; } \n'
		+		'div, p { text-align: justify; margin: 0.6em 0em 0em 0em; } \n'
		+		'div.title { text-align: center; font-size:200%; margin-top:3.6em } \n'
		+		'.inline-label { font-size: 90%; font-style: italic; margin-top:0.9em; } \n'
		+		'p.metaTitle { color: '+opts.metaFontColor+'; font-size: 90%; font-style: italic; margin-top:0.9em; } \n'
		+		'a { color: '+opts.linkFontColor+'; '+(opts.linkNotUnderlined?'text-decoration: none; ':'')+'} \n'
		+		'table.propertyTable, table.statementTable { color: '+opts.metaFontColor+'; width:100%; border-top: 1px solid #DDDDDD; border-collapse:collapse; margin: 0.6em 0em 0em 0em; padding: 0;} \n'
		+		'table.propertyTable td, table.statementTable td { font-size: '+opts.metaFontSize+'; border-bottom:  1px solid #DDDDDD; border-collapse:collapse; margin: 0; padding: 0em 0.2em 0em 0.2em; } \n'
		+		'td.propertyTitle, td.statementTitle { font-style: italic; } \n'
		+		'table.stdInlineWithBorder, table.doors-table { width:100%; border: 1px solid #DDDDDD; border-collapse:collapse; vertical-align:top; margin: 0; padding: 0; } \n'
		+		'table.stdInlineWithBorder th, table.stdInlineWithBorder td, table.doors-table th, table.doors-table td { border: 1px solid  #DDDDDD; margin: 0; padding: 0 0.1em 0 0.1em; font-size: 90% } \n'
//		+		'h5 { font-family:Arial,sans-serif; font-size:110%; font-weight: normal; margin: 0.6em 0em 0em 0em; } \n'
		+		'h4 { font-family:Arial,sans-serif; font-size:120%; font-weight: normal; margin: 0.6em 0em 0em 0em; page-break-after: avoid; } \n'
		+		'h3 { font-family:Arial,sans-serif; font-size:140%; font-weight: normal; margin: 0.9em 0em 0em 0em; page-break-after: avoid; } \n'
		+		'h2 { font-family:Arial,sans-serif; font-size:160%; font-weight: normal; margin: 1.2em 0em 0em 0em; page-break-after: avoid; } \n'
		+		'h1 { font-family:Arial,sans-serif; font-size:180%; font-weight: normal; margin: 1.8em 0em 0em 0em; page-break-after: avoid; } \n';
	ePub.container = 
				'<?xml version="1.0" encoding="UTF-8"?>'
		+		'<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">'
		+			'<rootfiles>'
		+				'<rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>'
		+			'</rootfiles>'
		+		'</container>';
	ePub.content = 
				'<?xml version="1.0" encoding="UTF-8"?>'
		+		'<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="2.0" >'
		+		'<metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">'
		+			'<dc:identifier id="BookID" opf:scheme="UUID">SpecIF-'+data.id+'</dc:identifier>'	
		+			'<dc:title>'+data.title+'</dc:title>'
		+			'<dc:creator opf:role="aut">'+(typeof(data.createdBy.familyName)=='string'&&data.createdBy.familyName.length>0?data.createdBy.familyName+', ':'')+(typeof(data.createdBy.givenName)=='string'?data.createdBy.givenName:'')+'</dc:creator>'
		+			'<dc:publisher>'+(typeof(data.createdBy.org)=='object'?data.createdBy.org.organizationName:'')+'</dc:publisher>'
		+			'<dc:language>en-US</dc:language>'
		+			'<dc:rights>'+data.rights.title+'</dc:rights>'
		+		'</metadata>'
		+		'<manifest>'
		+			'<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml" />'
		+			'<item id="styles" href="Styles/styles.css" media-type="text/css" />'
//		+			'<item id="pagetemplate" href="page-template.xpgt" media-type="application/vnd.adobe-page-template+xml" />'
//		+			'<item id="titlepage" href="Text/title.xhtml" media-type="application/xhtml+xml" />';
	ePub.sections.forEach( function(s,i) {
		ePub.content += '<item id="sect'+i+'" href="Text/sect'+i+'.xhtml" media-type="application/xhtml+xml" />'
	});
	ePub.images.forEach( function(f,i) {
		ePub.content += '<item id="img'+i+'" href="'+opts.epubImgPath+f.id+'" media-type="'+f.type+'"/>'
	});

	ePub.content += '</manifest>'
		+		'<spine toc="ncx">'
//		+			'<itemref idref="titlepage" />'
	ePub.sections.forEach( function(s,i) {
		ePub.content += '<itemref idref="sect'+i+'" />'
	});
	ePub.content += '</spine>'
		+		'</package>';

	ePub.toc = 	
				'<?xml version="1.0" encoding="UTF-8"?>'
		+		'<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">'
		+		'<head>'
		+			'<meta name="dtb:uid" content="SpecIF-'+data.id+'"/>'	
		+			'<meta name="dtb:depth" content="1"/>'				// Verschachtelungstiefe
		+			'<meta name="dtb:totalPageCount" content="0"/>'
		+			'<meta name="dtb:maxPageNumber" content="0"/>'
		+		'</head>'
		+		'<docTitle>'
		+			'<text>'+data.title+'</text>'
		+		'</docTitle>'
	// http://epubsecrets.com/nesting-your-toc-in-the-ncx-file-and-the-nookkindle-workaround.php
		+		'<navMap>'
/*		+			'<navPoint id="tocTitlepage" playOrder="1">'
		+				'<navLabel><text>Title Page</text></navLabel>'
		+				'<content src="Text/title.xhtml"/>'
		+			'</navPoint>'
*/
	ePub.headings.forEach( function(h,i) {
		// Build a table of content;
		// not all readers support nested ncx, so we provide a flat list.
		// Some tutorials have proposed to indent the title instead, but this does not work, as leading whitespace seems to be ignored.
		ePub.toc += 	'<navPoint id="tocHd'+i+'" playOrder="'+(i+1)+'">'
			+				'<navLabel><text>'+h.title+'</text></navLabel>'
			+				'<content src="Text/sect'+h.section+'.xhtml#'+h.id+'"/>'
			+			'</navPoint>'
	});
	ePub.toc +=	'</navMap>'
		+		'</ncx>';
		
//	console.debug('ePub',ePub);
	storeEpub(ePub);
	return

////////////////////////////////////
	function storeEpub( ePub ) {
		let zip = new JSZip(),
			i=null, I=null;
			
//		console.debug('storeEpub',ePub);
		zip.file( "mimetype", ePub.mimetype );
		zip.file( "META-INF/container.xml", ePub.container );
		zip.file( "OEBPS/content.opf", ePub.content );

		// Add the table of contents:
		zip.file( "OEBPS/toc.ncx", ePub.toc );
		
		// Add the styles:
		if( ePub.styles ) 
			zip.file( "OEBPS/Styles/styles.css", ePub.styles );
		
		// Add a title page:
	//	zip.file( "OEBPS/Text/title.xhtml", ePub.title );
		// Add a XHTML-file per hierarchy:
		ePub.sections.forEach( function(s,i) {
			zip.file( "OEBPS/Text/sect"+i+".xhtml", s )
		});

//		console.debug('files',ePub.images,data.files);
		// Add the images:
		ePub.images.forEach( function(f) {
		//	let img = itemById(data.files, f.id);
		//	if( img && img.id && img.blob )
				zip.file( "OEBPS/"+opts.epubImgPath+f.id, f.blob )
		//	else
		//		console.warn('No image file found for ',f.id)
		});
		// finally store the ePub file in a zip container:
		zip.generateAsync({
				type: "blob"
			})
			.then(
				function(blob) {
//					console.debug('storing ',ePub.fileName+".epub");
					saveAs(blob, ePub.fileName+".epub");
					if( typeof(opts.done)=="function" ) opts.done()
				}, 
				function(error) {
//					console.debug("cannot store ",ePub.fileName+".epub");
					if( typeof(opts.fail)=="function" ) opts.fail({status:299,statusText:"Cannot store "+ePub.fileName+".epub"})
				}
			);
		return

		// ---------- helper -----------
		function itemById(L,id) {
			if(!L||!id) return null;
			// given the ID of an element in a list, return the element itself:
			id = id.trim();
			for( var i=L.length-1;i>-1;i-- )
				if( L[i].id === id ) return L[i];   // return list item
			return null
		}
	}
}
