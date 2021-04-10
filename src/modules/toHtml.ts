/*! SpecIF to HTML with embedded SpecIF transformation
	Dependencies: 
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	Author: se@enso-managers.de, Berlin
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
*/

function toHtmlDoc( pr, pars ) {
	// Transform pr to HTML with embedded SpecIF transformation,
	// where pr is a SpecIF data in JSON format (not the internal cache).
	// Attention: The SpecIF data as JSON may not contain any apostrophes 
	// (must be replaced by &apos; for example).

	// consider to use: https://gist.github.com/loilo/92220c23567d6ed085a28f2c3e84e311

	return new Promise( (resolve, reject)=>{
		var pend = 0;
		if( pr.files )
			pr.files.forEach( (f)=>{
//				console.debug('zip a file',f);
				if( f.blob ) {

					pend++;
					switch( f.type ) {
						case 'image/svg+xml':
						/*	// see: https://css-tricks.com/lodge/svg/09-svg-data-uris/
							// see: https://css-tricks.com/probably-dont-base64-svg/
							blob2text( f, 
								(r)=>{ 
									f.dataURL = "data:image/svg+xml;utf8,"+r;
									delete f.blob;
									if( --pend<1 ) resolve( make( pr ) );
								}
							);
							break; */
						case 'image/png':
						case 'image/x-png':
						case 'image/jpeg':
						case 'image/jpg':
						case 'image/gif':
                            blob2dataURL( f, 
								(r)=>{
									// perhaps there is a more elegant way to apply the type to the dataURL,
									// but it works:
									f.dataURL = r.replace(/application\/octet-stream/,f.type);
									delete f.blob;
									if (--pend < 1) resolve(make(pr));
								}, 
								0
							);
                            break;
						case 'application/bpmn+xml':
							delete f.blob;
							console.warn( "BPMN file '"+f.title+"'has arrived, but should not arrive at toHTML(); it has been deleted." );
							if (--pend < 1) resolve(make(pr));
							break;
						default:
							let errT = 'Cannot transform diagram '+f.title+' of unknown type: '+f.type;
							console.warn( errT );
							reject({status:999,statusText:errT});
					};
				};
			}); 
		if( pend<1 ) {
			// continue right away if there is nothing to transform:
			return resolve( make( pr ) );
		};
	});

	function make(pr): String {
		pr = JSON.stringify( pr )
		.replace(/\\/g,"\\\\")
		.replace(/'/g,"&apos;")
		.replace(/"/g, '\\"');
		return '<!DOCTYPE html>'
			+	'<html>'
			+	'<head>'
			+		'<meta http-equiv="content-type" content="text/html; charset=utf-8" />'
			+		'<meta http-equiv="expires" content="0" />'
			+		'<meta name="viewport" content="width=device-width, initial-scale=1.0" />'
			+		'<title>SpecIF View</title>'
			+	'</head>'
			+	'<body>'
			+		'<div id="app" class="noOverflow" >'
			+			'<div id="pageHeader" >'
			+				'<div id="logo" ></div>'
			+				'<div id="pageSelector" class="btn-group btn-group-md pageActions" ></div>'
			+				'<div id="spinner" ></div>'
			+				'<div id="pageTitle" class="pageTitle" ></div>'
			+			'</div>'
			+		'</div>'
			+	'<script type="text/javascript">'
			+		'var cdn = \''+pars.cdn+'\','
			+ 			'data = \''+pr+'\';'
					// Get four fundamental libraries in parallel, then initialize the moduleManager using 'modules.init' ..
					// see https://www.sitepoint.com/community/t/window-load-function-getscript-not-jquery/195657/3
			+			'function getScript(url) {'
			+				'var el = document.createElement("script");'
			+				'el.onload = function () {'
			+					'if (--pend < 1)'
			+						'modules.init("embeddedSpecif", {path:cdn});' 	
			+				'};'
			+				'el.src = url;'
			+				'document.body.appendChild(el)'
			+			'}'
			+			'function addFavicon(r) {'
			+				'let link = document.createElement("link");'
			+				'link.rel = r;'
			+				'link.href = cdn+"vendor/assets/icons/favicon.ico";'
			+				'link.type = "image/x-icon";'
			+				'document.head.appendChild(link);'
			+			'}'
			+		'let pend = 4;'
			+		'getScript("https://code.jquery.com/jquery-3.5.1.min.js");'
			+		'getScript(cdn+"config/definitions.js?" + Date.now().toString());'
			+		'getScript(cdn+"config/moduleManager.js?" + Date.now().toString());'
			+		'getScript(cdn+"embedded.js?" + Date.now().toString());'
			+		'addFavicon("shortcut icon");'
			+		'addFavicon("icon");'
			+	'</script>'
			+	'<noscript>'
			+		'<p>The execution of JavaScript is disabled by your browser or the server.</p>'
			+	'</noscript>'
			+	'</body>'
			+	'</html>';
	}
}
