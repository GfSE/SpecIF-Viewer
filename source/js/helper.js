///////////////////////////////
/*	helper functions for Javascript.
	Dependencies: jQuery 3.0, bootstrap 3.
	(C)copyright 2010-2017 enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License: Apache 2.0 (https://apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de            

 	Attention: 
	- Do NOT minify this module with the Google Closure Compiler. At least the RegExp in toJsId will be modified to yield wrong results, e.g. falsely replaces 'u' by '_'.
*/

function attrV( lbl, val, cssCl ) {
	// assemble a label:value pair resp. a wide value field for display:
	cssCl = cssCl ? ' '+cssCl : '';
	if( typeof(val)=='string' ) 
			val = noCode( val.ctrl2HTML() )
	else	val = '';
	
	val = (lbl?'<div class="attribute-label" >'+lbl+'</div><div class="attribute-value" >':'<div class="attribute-content" >')+val+'</div>'
	return '<div class="attribute'+cssCl+'">'+val+'</div>'
}
function textInput( lbl, val, typ, fn ) {  
	// assemble a form for text input:
//	console.debug('textInput 1',lbl,val,typ,fn);
	if( typeof(val)=='string' ) 
			val = noCode( val )
	else 	val = '';

	if( typeof(fn)=='string' && fn.length>0 )	
			fn = ' oninput="'+fn+'"'
	else 	fn = '';

	let sH = lbl.simpleHash();
	if( typeof(typ)=='string' && ['line','area'].indexOf(typ)>-1 ) 	
			var fG = '<div id="'+sH+'" class="form-group form-active" >'    // for input field
	else	var fG = '<div class="attribute" >';				// for display field

//	console.debug('textInput 2',lbl,val,typ,fn,fG);
	fG += '<div class="attribute-label" >'+lbl+'</div>';
	switch( typ ) {
		case 'line':
			fG += 	'<div class="attribute-value">' +
						'<input type="text" id="field'+sH+'" class="form-control input-sm"'+fn+' value="'+val+'" />' +
					'</div>'; 
			break;
		case 'area':
			fG += 	'<div class="attribute-value">' +
						'<textarea id="field'+sH+'" class="form-control" rows="7"'+fn+'>'+val+'</textarea>' +
					'</div>'; 
			break;
		default:
			// display the value:
			fG += 	'<div id="field'+sH+'" class="attribute-value" style="font-size: 90%" >'+val.ctrl2HTML()+'</div>';
	};
	fG += 	'</div>';
	return fG
}
function setTextValue( lbl, val ) {
	let el = document.getElementById('field'+lbl.simpleHash());
	if( el && el.nodeName && el.nodeName.toLowerCase()=='div' ) { el.innerHTML = val; return };
	if( el ) el.value = val
}
function setTextFocus( lbl ) {
	let el = document.getElementById('field'+lbl.simpleHash());
	if( el ) el.focus()
}
function setTextState( lbl, state ) {
	if( ['has-success','has-error'].indexOf(state)<0 ) return null;
	let el = $('#'+lbl.simpleHash());
	if( !el ) return false;
	if( el.hasClass('has-error') ) {
		if( state=='has-success' ) {
			el.removeClass('has-error').addClass('has-success');
			return true
		} else
			return false	// no change
	};
	if( el.hasClass('has-success') ) {
		if( state=='has-error' ) {
			el.removeClass('has-success').addClass('has-error');
			return true
		} else
			return false	// no change
	};
	// else, has neither class:
	el.addClass(state);
	return true
}
function getTextValue( lbl ) {
	// get the input value:
	try {
		return noCode(document.getElementById('field'+lbl.simpleHash()).value)
	} catch(e) {
		return null
	}
}
function getTextLength( lbl ) {
	// get length the input value:
	try {
		return getTextValue( lbl ).length
	} catch(e) {
		return null
	}
}
				
function radioInput( lbl, opts ) {
	// assemble the form for a set of radio buttons:
	var rB = 	'<div class="row form-group form-active">' +
					'<label class="col-sm-3 control-label input-sm" >'+lbl+'</label>' +
					'<div class="col-sm-9 radio" >';
	let tp, chd;
	for( var i=0,I=opts.length;i<I;i++ ) {
		chd = (i==0)?'checked ':'';  // initialize with first option
		tp = ( opts[i].type )?'&#160;('+opts[i].type+')':'';   // add type in brackets, if available
		rB +=			'<div>' +
							'<label>' +
								'<input type="radio" name="radio'+lbl.simpleHash()+'" value="'+i+'" '+chd+'/>' +
								'<span data-toggle="popover" title="'+opts[i].description+'" >'+(opts[i].title||titleOf(opts[i]))+tp+'</span>' +
							'</label><br />' +
						'</div>'
	};
	rB +=			'</div>' +
				'</div>';
	return rB
}
function radioValue( lbl ) {
	// get the selected radio button, it is the index number as string:
//	let prB = $('input[name="radio'+lbl.simpleHash()+'"]:checked');
//	console.debug( 'radioValue',prB, prB.attr('value'), typeof prB.attr('value'), prB[0].value, typeof prB[0].value );
//	return 	$('input[name="radio'+lbl.simpleHash()+'"]:checked').attr('value')	// works nicely
	return 	$('input[name="radio'+lbl.simpleHash()+'"]:checked')[0].value
}
function checkboxInput( lbl, opts ) {
	var cB = 	'<div class="row form-group form-active">' +
					'<label class="col-sm-3 control-label input-sm" >'+lbl+'</label>' +
					'<div class="col-sm-9 checkbox" >';
	let tp;
	for( var i=0,I=opts.length;i<I;i++ ) {
		tp = ( opts[i].type )?'&#160;('+opts[i].type+')':'';   // add type in brackets, if available
		cB +=			'<div>' +
							'<label>' +
								'<input type="checkbox" name="checkbox'+lbl.simpleHash()+'" value="'+i+'" />' +
								'<span data-toggle="popover" title="'+opts[i].description+'" >'+(opts[i].title||titleOf(opts[i]))+tp+'</span>' +
							'</label><br />' +
						'</div>'
	};
	cB +=			'</div>' +
				'</div>';
	return cB
}
function checkboxValues( lbl ) {
	// get the selected check boxes as array with indices:
	let chd = $('input[name="checkbox'+lbl.simpleHash()+'"]:checked'),
		i,I=chd.length;
	var resL = [];
	for( i=0;i<I;i++ )
		resL.push( chd[i].value );
	return resL
}
function setStyle( sty ) {
		let css = document.createElement('style');
		css.innerHTML = sty;
		document.head.appendChild(css) // append to head
}

// standard error handler:
function stdError( xhr, cb ) {
	"use strict";
//	console.debug('stdError',xhr);
	// clone, as xhr.responseText ist read-only:
	let xhrCl = {
		status: xhr.status,
		statusText: xhr.statusText,
		responseType: xhr.responseType,
		responseText: xhr.responseType=='text'? xhr.responseText : ''
	};	
	switch( xhr.status ) {
		case 0:
		case 200:
		case 201:
			return; // some calls end up in the fail trail, even though all went well.
		case 401:  // unauthorized
			userProfile.logout();
			break;
		case 402:  // payment required - insufficient license
			xhrCl.responseText = i18n.Err402InsufficientLicense;
			message.show( xhrCl );
			break;
		case 403:  // forbidden
			xhrCl.responseText = i18n.Err403Forbidden;
			message.show( xhrCl );
			break;
		case 404:  // not found
			xhrCl.responseText = i18n.Err404NotFound;
			message.show( xhrCl );
			break;
		case 500:
			xhrCl.statusText = i18n.ErrInvalidData;
			xhrCl.responseText = '';
			message.show( xhrCl, {severity:'danger'} );
			break;
		case 995:  // server request timeout
			message.show( xhrCl );
			break;
		case 996:  // server request queue flushed
			break;
		default:
			message.show( xhrCl )
	};
	// log original values:
	console.error( xhr.statusText + " (" + xhr.status + (xhr.responseType=='text'?"): "+xhr.responseText : ")") );
	if( $.isFunction(cb) ) cb()
};
/*	// standard logger:
	function stdLog( fS, xhr ) {
		if( xhr ) {
			switch (xhr.status) {
				case 200:
				case 201:
				case 401:
					console.log( fS+"/"+ (xhr.statusText||i18n.Error) + " (" + xhr.status + ")" );
					break;
				default:
					console.log( fS+"/"+ (xhr.statusText||i18n.Error) + " (" + xhr.status + (xhr.responseText?"): "+xhr.responseText:")") )
			};
		} else {
					console.log( fS );			
		};
	};
*/
// standard message box:
function Message() {
	"use strict";
	// constructor for message-box:
	var self = this;
	let pend = 0;

	function init() {
		$('#app').prepend('<div id="message" ></div>')
	};
	self.hide = function() {
		$('#message')
			.empty()
			.hide();
		pend = 0  // can be called internally or externally
	};
	function remove() {
		if( --pend<1 )
			self.hide()
	}
	self.show = function( msg, opts ) {
		// msg: message string or jqXHR object
		// opts.severity: severity with a value listed below 
		// opts.duration: time in ms before fading out
		if( !opts )
			opts = {};
		switch( typeof(msg) ) {
			case 'string': 
				if( msg.length>0 )
					// the message is a string:
					break;
				// delete the message, if an empty string is provided:
				self.hide();
				return;
			case 'object': 
				if( msg.status ) {
					// msg is an jqXHR object:
					msg = (msg.statusText||i18n.Error) + " (" + msg.status + (msg.responseType=='text'?"): "+msg.responseText : ")");
					if( !opts.severity ) opts.severity = msg.status<202? 'success' : 'danger';
					break
				};
			default:
				console.error(msg,'is an invalid message.');
				return;
		};
		// now, msg is of type 'string'.

		if( !opts.severity || ['success', 'info', 'warning', 'error', 'danger'].indexOf(opts.severity)<0 ) // severities as known by bootstrap plus "error"
			opts.severity = 'warning';
		if( opts.severity == 'error' ) 
			opts.severity = 'danger';
		if( !opts.duration || typeof(opts.duration)!='number' )
			opts.duration = CONFIG.messageDisplayTimeNormal;

		$('#message')
			.html('<div class="alert alert-'+opts.severity+'" role="alert" >'+msg+'</div>')
			.show();
		
		if( opts.duration>10 ) {
			pend++;
			setTimeout(function() {remove()}, opts.duration)
		}
		// else: static message until it is over-written
	};
	init();
	return self
};
message = new Message();

function setContentHeight( opt ) {
	// Resizes DOM-tree elements to fit in the current browser window.
	// In effect it is assured that correct vertical sliders are shown.

//	console.debug( 'setContentHeight', $('#app').height(), getOuterHeight('#specsHeader') ); 
	
	// reduce by the padding; it is assumed that only padding-top is set and that it is equal for content and contentWide:
	// consider that there may be no element of type content or contentWide at a given instant.
	// see: https://stackoverflow.com/questions/3437786/get-the-size-of-the-screen-current-web-page-and-browser-window
	let wH = window.innerHeight
			|| document.documentElement.clientHeight
			|| document.body.clientHeight,

		hH = $('#pageHeader').outerHeight(true)
			+ $('.nav-tabs').outerHeight(true),
		pH = wH-hH;
	//	pH = $('#app').height()-hH, // the remaining space below the header and tabs
	//	pC = getCssVal($('.content').css("padding-top"))	// the padding of the container for content
	//		|| getCssVal($('.contentWide').css("padding-top")),	// yields same result in case there is no .content
	//	pS = getCssVal($('.selection').css("padding-top")),

	//	hC = pH+'px',  		// the available height for the content container
	//	hT = pH-pS-8+'px',	// the available height for the tree
	//	hF = pH-pS+'px',	// the available height for the filters
	//	vP = hH+8+'px';
//	console.debug( 'setContentHeight', hH, pH, vP );

	$('.content').outerHeight( pH );
	$('.contentWide').outerHeight( pH );
	$('.panel-tree').outerHeight( pH );
	$('.panel-details').outerHeight( pH );
//	$('.primaryFilters').height( hF );

	// adjust the vertical position of the contentActions:
	$('.contentCtrl').css( "top", hH );
	return
	
	function getCssVal(str) {
		return parseInt(str,10)  // cut off unit at the end and transform to integer value
	}
/*	function getNavbarHeight() {
		return $('#navbar').css("height")
	} */
}

function bindResizer() {
	// correct display in case the window has been resized:
	$(window).resize(function() {
//		console.log('resize'); 
		setContentHeight();
	})
}

	function indexById(L,id) {
		if(!L||!id) return -1;
		// given an ID of an element in a list, return it's index:
		id = id.trim();
		for( var i=L.length-1;i>-1;i-- )
			if( L[i].id === id ) return i;   // return list index 
		return -1
	}
	function itemById(L,id) {
		if(!L||!id) return null;
		// given the ID of an element in a list, return the element itself:
		id = id.trim();
		for( var i=L.length-1;i>-1;i-- )
			if( L[i].id === id ) return L[i];   // return list item
		return null
	}
	function indexByName(L,ln) {
		if(!L||!ln) return -1;
		// given a longName of an element in a list, return it's index:
		for( var i=L.length-1;i>-1;i-- )
			if( L[i].longName === ln ) return i;   // return list index
		return -1
	}
	function itemByName(L,ln) {
		if(!L||!ln) return null;
		// given a longName of an element in a list, return the element itself:
		for( var i=L.length-1;i>-1;i-- )
			if( L[i].longName === ln ) return L[i];   // return list item
		return null
	}
	function indexBy( L, p, s ) {
		if(!L||!p||!s) return -1;
		// Return the index of an element in list 'L' whose property 'p' equals searchterm 's':
		// hand in property and searchTerm as string !
		for( var i=L.length-1;i>-1;i-- )
			if (L[i][p] === s) return i;
		return -1
	}
	function itemBy( L, p, s ) {
		if(!L||!p||!s) return -1;
		// Return an element in list 'L' whose property 'p' equals searchterm 's':
		// hand in property and searchTerm as string !
		for( var i=L.length-1;i>-1;i-- )
			if (L[i][p] === s) return L[i];
		return null
	}
	function containsById( cL, L ) {
		if(!L) return null;
		// return true, if all elements in L are contained in cL (cachedList),
		// where L may be an array or a single item:
		return Array.isArray(L)?containsL( cL, L ):indexById( cL, L.id )>-1
		
		function containsL( cL, L ) {
			for( var i=L.length-1;i>-1;i-- )
				if ( indexById( cL, L[i].id )<0 ) return false;
			return true
		}
	}
	function containsByName( cL, L ) {
		if(!L) return null;
		// return true, if all elements in L are contained in cL (cachedList):
		return Array.isArray(L)?containsL( cL, L ):( indexByName( cL, L.longName )>-1 )
		
		function containsL( cL, L ) {
			for( var i=L.length-1;i>-1;i-- )
				if ( indexByName( cL, L[i].longName )<0 ) return false;
			return true
		}
	}
	function forAll( L, fn ) {
		// return a new list with the results from applying the specified function to all elements of input list L:
		if(!L) return [];
		var nL = [];
		L.forEach( function(e){ var r=fn(e); if(r) nL.push(r) } );
		return nL
	}
	
	function cacheE( L, e ) {  // ( list, entry )
		// add or update the element e in a list L:
		let n = indexById( L, e.id );
		if( n<0 ) { L.push( e ); return L.length-1 };  // add, if not yet listed 
		L[n] = e; return n // update otherwise
	}
	function cacheL( L, es ) {  // ( list, entries )
		// add or update the elements es in a list L:
		es.forEach( function(e) { cacheE( L, e ) } )
	}
	function uncacheE( L, e ) {  // ( list, entry )
		// remove the element e from a list L:
		let n = indexById( L, e.id );
		if( n>-1 ) L.splice(n,1)  // remove, if found
	}
	function uncacheL( L, es ) {  // ( list, entries )
		// remove the elements es from a list L:
		es.forEach( function(e) { uncacheE( L, e ) } )
	}
	function removeFromArray( A, e ) {
		let i=A.indexOf(e);
		if( i>-1 ) A.splice(i,1)
	};
	
	// http://stackoverflow.com/questions/10726909/random-alpha-numeric-string-in-javascript
	function genID(pfx) {
		if( !pfx || pfx.length<1 ) { pfx = 'ID_' };
		let re = /^[A-Za-z_]/;
		if( !re.test(pfx) ) { pfx = '_'+pfx };   // prefix must begin with a letter or '_'
		
		let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		var result = '';
		for( var i=CONFIG.genIdLength; i>0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
		return pfx+result
	}
/*	// http://stackoverflow.com/questions/10726909/random-alpha-numeric-string-in-javascript:
	function genID() { var s=Math.random().toString(36).slice(2); return s.length===16 ? s : genID(); }
	// http://stackoverflow.com/questions/1349404/generate-a-string-of-5-random-characters-in-javascript
	function genID() {
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for( var i=0; i<16; i++ )
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		return text;
	}
*/

	// Make a valid js variable/property name; replace disallowed characters by '_':
	String.prototype.toJsId = function() { 
		if( this ) return this.replace( /[-:\.\,\s\(\)\[\]\/\\#°%]/g, '_' ); 
		return null
	};
	// Make an id conforming with ReqIF and SpecIF:
	String.prototype.toSpecifId = function() { 
		if( this ) return this.replace( /[^_0-9a-zA-Z]/g, '_' ); 
		return null
	};

	// Make a very simple hash code from a string:
	// http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
	String.prototype.simpleHash = function(){for(var r=0,i=0;i<this.length;i++)r=(r<<5)-r+this.charCodeAt(i),r&=r;return r};
	
/* from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith */	
if (!String.prototype.startsWith) {
	String.prototype.startsWith = function(searchString, position) {
		position = position || 0;
		return this.lastIndexOf(searchString, position) === position
	}
};
/* from https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith */
if (!String.prototype.endsWith) {
	String.prototype.endsWith = function(searchString, position) {
      let subjectString = this.toString();
      if (position === undefined || position > subjectString.length) {
        position = subjectString.length
      };
      position -= searchString.length;
      let lastIndex = subjectString.indexOf(searchString, position);
      return lastIndex !== -1 && lastIndex === position
	}
};
	String.prototype.truncate = function(l) {
		var t = this.substring(0,l-1);
//		if( t.length < this.length ) t += '&#8230;'; // &hellip;, i.e.three dots
		if( t.length < this.length ) t += '...';  // must work also in non-html fields
		return t
	};
	String.prototype.reduceWhiteSpace = function() {
	// Reduce white space to a single blank:
		return this.replace( /[\s]{2,}/g, ' ' )
	};
	String.prototype.stripCtrl = function() {
	// Remove js/json control characters from HTML-Text or other:
		return this.replace( /\r|\n|\f/g, '' ).replace( /\t/g, ' ' )
	};
	String.prototype.ctrl2HTML = function() {
	// Convert js/json control characters (new line) to HTML-tags and remove the others:
		return this.replace( /\r|\f/g, '' ).replace( /\t/g, ' ' ).replace( /\n/g, '<br />' )
	};
	String.prototype.toHTML = function() {
	// Escape HTML characters and convert js/json control characters (new line etc.) to HTML-tags:
		return this.escapeHTML().ctrl2HTML()
	};
	String.prototype.utf8ToXmlChar = function() {
		let i = this.length,
			aRet = [];
		while (i--) {
			let iC = this[i].charCodeAt(0);
			if (iC < 65 || iC > 127 || (iC > 90 && iC < 97)) aRet[i] = '&#' + iC + ';';
			else aRet[i] = this[i];
		}
		return aRet.join('');
	}
/*	String.prototype.xmlChar2utf8 = function() {
		this = this.replace(/&#x([0-9a-fA-F]+);/g, function (match, numStr) {
			return String.fromCharCode(parseInt(numStr, 16))
		});
		return this.replace(/&#([0-9]+);/g, function (match, numStr) {
			return String.fromCharCode(parseInt(numStr, 10))
		})
	} */
if (!String.prototype.stripHTML) {
	String.prototype.stripHTML = function() {
		// don't use a regex to strip html to impede cross-site-scripting (XSS) attacks
		return $("<dummy/>").html( this ).text()
	}
};

	// Escape characters for Regex expression (https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions)
	String.prototype.escapeRE = function() { return this.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }; // $& means the whole matched string
//	String.prototype.escapeRE = function() { return this.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") };
	// Escape characters for JSON string: 
	String.prototype.escapeJSON = function() { return this.replace(/["]/g, '\\$&') }; // $& means the whole matched string
	// escape HTML characters:
	String.prototype.escapeXML = function() {
		return this.replace(/["'&<>]/g, function($0) {
			return "&" + {"&":"#38", "<":"#60", ">":"#62", '"':"#34", "'":"#39"}[$0] + ";";
		})
	};
	String.prototype.escapeHTML = function() {
		return this.replace(/[&<>"'`=\/]/g, function($0) {
			return "&" + {"&":"#38", "<":"#60", ">":"#62", '"':"#34", "'":"#39", "`":"#x60", "=":"#x3D", "/":"#x2F"}[$0] + ";";
		})
	};

	// Add a leading icon to a title:
	// use only for display, don't add to stored variables.
	String.prototype.addIcon = function( ic ) {
		if( ic ) return ic+'&#xa0;'+this;
		return this
	};

	// Add a link to an isolated URL:
	String.prototype.linkifyURLs = function() {
		return this.replace( RE.URL,  
			function( $0, $1, $2, $3, $4, $5, $6, $7, $8 ){ 
				// all links which do not start with "http" are considered local by most browsers:
				if( !$2.startsWith('http') ) $2 = 'http://'+$2;  // starts with "www." then according to RE.URL
				return $1+'<a href="'+$2+'" >'+$2+'</a>'+$8
			})
	};	

	String.prototype.fileExt = function() {
		// return the file extension without the '.':
		return this.substring( this.lastIndexOf('.')+1 )
//		let e = RE.FileExt.exec(this);    // extension excluding '.'
//		if( e==null ) return null;
//		return e[1]
	};
	String.prototype.fileName = function() {
		let e = RE.FileName.exec(this);  // name excluding '.'
		if( e==null ) return null;
		return e[1]
	};
	String.prototype.isTrue = function() {
		return CONFIG.valuesTrue.indexOf( this.toLowerCase().trim() )>-1
	};
	String.prototype.isFalse = function() {
		return CONFIG.valuesFalse.indexOf( this.toLowerCase().trim() )>-1
	};
	String.prototype.trimJSON = function() {
		// trim all characters outside the outer curly brackets, which may include the UTF-8 byte-order-mask: 
		let si = this.indexOf('{'),
			li = this.lastIndexOf('}');
		return this.substring(si,li+1)
	};
/*	String.prototype.removeBOM = function() {
		// remove the byte order mask from a UTF-8 coded string
		// ToDo: Any whitespace between BOM and JSON is not taken care of.
		// ToDo: The BOM may be "FE FF" in certain representations.
		return this.replace( /^(\xEF\xBB\xBF)?({[\s\S]*})/, function($0,$1,$2) {return $2} )
	};
	function toHex(str) {
		var hex='', nV='';
		for( var i=0;i<str.length;i++) {
			nV = str.charCodeAt(i).toString(16);
			hex += nV.length>1?''+nV:'0'+nV
		};
		return hex
	}				
*/
	// Convert arrayBuffer from and to string:
	function buf2str(buf) {
		// UTF-8 character table: http://www.i18nqa.com/debug/utf8-debug.html
		// or: https://bueltge.de/wp-content/download/wk/utf-8_kodierungen.pdf
		try {
			// see https://developers.google.com/web/updates/2014/08/Easier-ArrayBuffer-String-conversion-with-the-Encoding-API
			// DataView is a wrapper on top of the ArrayBuffer.
			var dataView = new DataView(buf);
			// The TextDecoder interface is documented at http://encoding.spec.whatwg.org/#interface-textdecoder
			var decoder = new TextDecoder('utf-8');
			return decoder.decode(dataView)
		} catch (e) {
			// see https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
			// for vintage browsers such as IE
			// Known problem: Special chars like umlaut are not properly converted.
			return String.fromCharCode.apply(null, new Uint8Array(buf))
		}
	}
	function str2buf(str) {
		try {
			let encoder = new TextEncoder();
			return encoder.encode(str)		
		} catch (e) {
			var buf = new ArrayBuffer(str.length);
			var bufView = new Uint8Array(buf);
			for (var i=0, I=str.length; i<I; i++) {
				bufView[i] = str.charCodeAt(i)
			};
			return buf
		}
	}
			
	// not good enough, but better than nothing:
	// see https://www.owasp.org/index.php/XSS_%28Cross_Site_Scripting%29_Prevention_Cheat_Sheet
	// do not implement as chainable function, because a string object is created. 
	function noCode( s ) {
		if( s ) {
			// just suppress the whole content, if there are inacceptable/evil tags or properties, do NOT try to repair it.
			// <img src="bogus" onerror=alert('4711') />
			if( /<[^>]+\son[a-z]+=[^>]+>/i.test( s ) ) { log(911); return null };   // all event callbacks within HTML tags
			if( /<script[^>]*>[\s\S]*<\/script[^>]*>/i.test( s ) ) { log(912); return null };
			if( /<style[^>]*>[\s\S]*<\/style[^>]*>/i.test( s ) ) { log(913); return null };
			if( /<embed[^>]*>[\s\S]*<\/embed[^>]*>/i.test( s ) ) { log(914); return null };
			if( /<iframe[^>]*>[\s\S]*<\/iframe[^>]*>/i.test( s ) ) { log(915); return null }
		};
		return s
		
		function log(c) {
			console.error('Considered harmful ('+c+'):',s)
		}
	}

// Based on https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
if (! Array.isArray) {
    Array.isArray = function(obj) {
        return Object.prototype.toString.call(obj) === "[object Array]"
    }
}
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger
if (!Number.isInteger) {
	Number.isInteger = function(val) {
		return typeof(val)==='number' && isFinite(val) && Math.floor(val) === val
	}
};

	function attachment2mediaType( fname ) {
		let t = fname.fileExt();  // get the extension excluding '.'
		if( !t ) return null;
		let ti = CONFIG.imgExtensions.indexOf( t.toLowerCase() );
		if( ti>-1 ) return CONFIG.imgTypes[ ti ]
		ti = CONFIG.officeExtensions.indexOf( t.toLowerCase() );
		if( ti>-1 ) return CONFIG.officeTypes[ ti ]
		return null
	}
	function image2mediaType( fname ) {
		let t = fname.fileExt();  // get the extension excluding '.'
		if( !t ) return null;
		let ti = CONFIG.imgExtensions.indexOf( t.toLowerCase() );
		if( ti>-1 ) return CONFIG.imgTypes[ ti ]
		return null
	}
	
	function float2int(val) { return parseInt(val) };
	function localDateTime(iso) {
		if( !iso ) return '';
		// ToDo: calculate offset of time-zone ... or use one of the libraries ..
		if( iso.length>15 ) return (iso.substr(0,10)+' '+iso.substr(11,5)+'h');
		if( iso.length>9 ) return (iso.substr(0,10));
		return ''
	}

function simpleClone( o ) { 
	// "deep" clone;
	// does only work, if none of the property values are references or functions:
		function clonePr(p) {
			return ( typeof(p) == 'object' )? simpleClone(p) : p
		}
	var n={};
	for( var p in o ) {
		if( Array.isArray(o[p]) ) {
			n[p] = [];
			o[p].forEach( function(op) {
				n[p].push( clonePr(op) )
			});
			continue
		};
		// else
		n[p] = clonePr(o[p])
	};
	return n
}
function hasUrlParams() {
	let p = document.URL.split('#');
	if( p[1] && p[1].length>0 ) return true;
	p = document.URL.split('?');
	if( p[1] && p[1].length>0 ) return true;
	return false
}
// ToDo: try prms = location.hash
// see: https://www.w3schools.com/jsref/prop_loc_hash.asp
function getHashParams() {
	// Get the hash string:
	let p = document.URL.split('#');
	if( !p[1] ) return {};
	p = decodeURI(p[1]);
	if( p[0]=='/' ) {p = p.substr(1)};	// remove leading slash
	return parse( p )

	function parse( h ) {
		if( !h ) return {};
		var pO = {};
		h = h.split(';');
		h.forEach( function(p) {
			p = p.split('=');
			// remove enclosures from the value part:
			if( p[1][0]=='"' || p[1][0]=="'" ) { p[1] = p[1].substr(1,p[1].length-2) };
			// could say pO[p[0]] = p[1], but it is preferred to look for specific tokens:
			switch( p[0] ) {
				case 'import': pO.import = p[1]
			}
		});
		return pO
	}
}
function clearUrlParams() {
	if( !browser.supportsHtml5History || !hasUrlParams() ) return;
	
	var path = window.location.pathname.split('/');  // get the path in pieces
	history.pushState(null,null,path[path.length-1])    // last element is 'appname.html' without url parameters;
};
function httpGet(parms) {
	// https://blog.garstasio.com/you-dont-need-jquery/
	// https://www.sitepoint.com/guide-vanilla-ajax-without-jquery/
	var xhr = new XMLHttpRequest();
	xhr.open('GET', parms.url, true);
	if( parms.withCredentials ) xhr.withCredentials = "true";
	// https://stackoverflow.com/a/42916772/2214
	xhr.responseType = parms.responseType;
	xhr.onreadystatechange = function () {
//		console.debug('xhr',this.readyState,this)
		if (this.readyState<4 ) return;
		if ( this.readyState==4 ) {
			switch( this.status ) {
				case 200:
				case 201:
					// done without error:
					if( typeof(parms.done)=="function" ) parms.done(this);
					break;
				default:
					// done with error:
					if( typeof(parms.fail)=="function" ) parms.fail(this)
			}
		};
		// continue in case of success and error:
		if( typeof(parms.then)=="function" ) parms.then()	
	};
	xhr.send(null)
}
