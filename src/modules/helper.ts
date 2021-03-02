/*	helper functions for iLaH.
	Dependencies: jQuery 3.0
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution!     

 	Attention: 
	- Do NOT minify this module with the Google Closure Compiler. At least the RegExp in toJsId will be modified to yield wrong results, e.g. falsely replaces 'u' by '_'.
*/ 

function renderProp( lbl:string, val:string, cssCl:string ):string {
	// show a property value:
	cssCl = cssCl ? ' '+cssCl : '';
	if( typeof(val)=='string' ) 
			val = noCode( val )
	else	val = '';
	
	// assemble a label:value pair resp. a wide value field for display:
	val = (lbl?'<div class="attribute-label" >'+lbl+'</div><div class="attribute-value" >':'<div class="attribute-wide" >')+val+'</div>';
	return '<div class="attribute'+cssCl+'">'+val+'</div>';
}
function DialogForm():object {
	// Construct an object performing the key-by-key input checking on an input form;
	// check *all* fields on a key-stroke and return the overall result.
	var self:any = {};
	self.list = [];  // the list of parameter-sets, each for checking a certain input field.
	self.init = function():void {
		self.list.length = 0;
	};
	self.addField = function( elementId:string, dT ):void {
		// Add a parameter-set for checking an input field;
		// - 'elementId' is the id of the HTML input element
		// - 'dataType' is the dataType of the property
		self.list.push( { label:elementId, dataType:dT } );
	};
	self.check = function():boolean {
		// Perform tests on all registered input fields; is designed to be called on every key-stroke.
		let val:string, ok:boolean, allOk = true;
		self.list.forEach( (cPs)=>{
			// cPs holds the parameters for checking a single property resp. input field.
			// Get the input value:
			val = textValue( cPs.label );
			// Perform the test depending on the type:
			// In case of a title or description it may happen, that there is no dataType (tutorial "Related Terms":
            switch ( cPs.dataType? cPs.dataType.type : "xs:string" ) {
				case 'xs:string':
				case 'xhtml':
					ok = !cPs.dataType || cPs.dataType.maxLength==undefined || val.length<=cPs.dataType.maxLength;
					break;
				case 'xs:double':
					ok = val.length<1 || RE.Real(cPs.dataType.fractionDigits).test(val)&&val>=cPs.dataType.minInclusive&&val<=cPs.dataType.maxInclusive;
					break;
				case 'xs:integer':
					ok = val.length<1 || RE.Integer.test(val)&&val>=cPs.dataType.minInclusive&&val<=cPs.dataType.maxInclusive;
					break;
				case 'xs:dateTime':
					ok = val.length<1 || RE.IsoDate.test(val);
				// no need to check enumeration
			};
			setTextState( cPs.label, ok? 'has-success':'has-error' );
			allOk = allOk && ok;
//			console.debug( 'DialogForm.check: ', cPs, val );
		});
		return allOk;
	};
	return self;
}
function textField( lbl, val:string, typ:string, fn:string ):string|null {  
	// assemble a form for text input:
//	console.debug('textField 1',lbl,val,typ,fn);
	if( typeof(lbl)=='string' ) lbl = {label:lbl,display:'left'};
	if( typeof(val)=='string' ) 
			val = noCode( val );
	else 	val = '';

	if( typeof(fn)=='string' && fn.length>0 )	
			fn = ' oninput="'+fn+'"';
	else 	fn = '';

	let sH = lbl.label.simpleHash(), fG:string, aC:string;
	if( typeof(typ)=='string' && ['line','area'].indexOf(typ)>-1 ) 	
			fG = '<div id="'+sH+'" class="form-group form-active" >'    // for input field
	else	fG = '<div class="attribute" >';				// for display field

//	console.debug('textField 2',lbl.label,val,typ,fn,fG);
	switch( lbl.display ) {
		case 'none':
			aC = 'attribute-wide';
			break;
		case 'left':
			fG += '<div class="attribute-label" >'+lbl.label+'</div>';
			aC = 'attribute-value';
			break;
		default:
			return null; // should never be the case
	};
	switch( typ ) {
		case 'line':
			fG += 	'<div class="'+aC+'">'
				+		(val.indexOf('\n')<0? '<input type="text" id="field'+sH+'" class="form-control"'+fn+' value="'+val+'" />'
						: '<textarea id="field'+sH+'" class="form-control" rows="2"'+fn+'>'+val+'</textarea>')
				+	'</div>'; 
			break;
		case 'area':
			fG += 	'<div class="'+aC+'">' +
						'<textarea id="field'+sH+'" class="form-control" rows="7"'+fn+'>'+val+'</textarea>' +
					'</div>'; 
			break;
		default:
			// display the value:
			fG += 	'<div id="field'+sH+'" class="'+aC+'" >'+val+'</div>';
	};
	fG += 	'</div>';
	return fG;
}
function setTextValue( lbl:string, val:string ):void {
	let el = document.getElementById('field'+lbl.simpleHash());
	if( el && el.nodeName && el.nodeName.toLowerCase()=='div' ) { el.innerHTML = val; return };
	if( el ) el.value = val;
}
function setTextFocus( lbl:string ):void {
	let el = document.getElementById('field'+lbl.simpleHash());
	if( el ) el.focus()
}
function setTextState( lbl:string, state:string ):boolean {
	if( ['has-success','has-error'].indexOf(state)<0 ) return null;
	let el = $('#'+lbl.simpleHash());
	if( !el ) return false;
	if( el.hasClass('has-error') ) {
		if( state=='has-success' ) {
			el.removeClass('has-error').addClass('has-success');
			return true;
		} else
			return false;	// no change
	};
	if( el.hasClass('has-success') ) {
		if( state=='has-error' ) {
			el.removeClass('has-success').addClass('has-error');
			return true;
		} else
			return false;	// no change
	};
	// else, has neither class:
	el.addClass(state);
	return true;
}
function textValue( lbl:string ):string {
	// get the input value:
	try {
		return noCode(document.getElementById('field'+lbl.simpleHash()).value) || '';
	} catch(e) {
		return '';
	}
}
function getTextLength( lbl:string ):number {
	// get length the input value:
	try {
		return textValue( lbl ).length;
	} catch(e) {
		return -1;
	}
}
				
function radioField( lbl:string|object, entries:Array<object>, opts?:object ):string|null {
	// assemble an input field for a set of radio buttons:
	if( typeof(lbl)=='string' ) lbl = {label:lbl,display:'left',classes:'form-active'}; // for compatibility
	let rB:string, fn:string;
	if( opts && typeof(opts.handle)=='string' && opts.handle.length>0 )	
			fn = ' onclick="'+opts.handle+'"'
	else 	fn = '';
	switch( lbl.display ) {
		case 'none': 
			rB = 	'<div class="form-group '+(lbl.classes||'')+'">'
				+		'<div class="radio" >';
			break;
		case 'left': 
			rB = 	'<div class="form-group '+(lbl.classes||'')+'">'
				+		'<div class="attribute-label" >'+lbl.label+'</div>'
				+		'<div class="attribute-value radio" >';
			break;
		default:
			return null; // should never be the case
	};
	// zero or one checked entry is allowed:
	let found = false, temp:boolean; 
	entries.forEach( (e)=>{
		temp = found || e.checked;
		if( found && e.checked )
			e.checked = false; // only the first check will remain
		found = temp;
	});
	// render options:
	let tp, nm=lbl.label.simpleHash();
	entries.forEach( (e,i)=>{
		tp = ( e.type )?'&#160;('+e.type+')':'';   // add type in brackets, if available
		rB +=			'<label>'
			+				'<input type="radio" name="radio'+nm+'" value="'+(e.id||i)+'"'+(e.checked?' checked':'')+fn+' />'
			+				'<span '+(e.description? ('data-toggle="popover" title="'+e.description+'" '):'')+'>'+e.title+tp+'</span>'
			+			'</label><br />'
	});
	rB +=			'</div>'
		+		'</div>';
	return rB;
}
function radioValue( lbl:string ):string {
	// get the selected radio button, it is the index number as string:
	return 	$('input[name="radio'+lbl.simpleHash()+'"]:checked').attr('value') || '';	// works even if none is checked
}
function checkboxField( lbl:string|object, entries:Array<object>, opts?:object ):string {
	// assemble an input field for a set of checkboxes:
	if( typeof(lbl)=='string' ) lbl = {label:lbl,display:'left',classes:'form-active'}; // for compatibility
	let cB:string, fn:string;
	if( opts && typeof(opts.handle)=='string' && opts.handle.length>0 )	
			fn = ' onclick="'+opts.handle+'"';
	else 	fn = '';
	switch( lbl.display ) {
		case 'none': 
			cB = 	'<div class="form-group '+(lbl.classes||'')+'">'
				+		'<div class="checkbox" >';
			break;
		case 'left': 
			cB = 	'<div class="form-group '+(lbl.classes||'')+'">'
				+		'<div class="attribute-label" >'+lbl.label+'</div>'
				+		'<div class="attribute-value checkbox" >';
			break;
		default:
			return ''; // should never be the case 
	};
	// render options:
	let tp:string, nm=lbl.label.simpleHash();
	entries.forEach( (e,i)=>{
		tp = e.type?'&#160;('+e.type+')':'';   // add type in brackets, if available
		cB +=			'<label>'
			+				'<input type="checkbox" name="checkbox'+nm+'" value="'+(e.id||i)+'"'+(e.checked?' checked':'')+fn+' />'
			+				'<span '+(e.description? ('data-toggle="popover" title="'+e.description+'" '):'')+'>'+e.title+tp+'</span>'
			+			'</label><br />'
	});
	cB +=			'</div>'
			+	'</div>';
	return cB
}
function checkboxValues( lbl:string ) {
	// get the selected check boxes as array with indices:
	let chd = $('input[name="checkbox'+lbl.simpleHash()+'"]:checked');
	var resL = [];
	for( var i=0, I=chd.length; i<I; i++ ) {	// chd is an object, not an array
		resL.push( chd[i].value );
	};
	return resL;
}
function booleanField( lbl:string, val, opts? ):string {
//	console.debug('booleanField',lbl,val);
	let fn:string;
	if( opts && typeof(opts.handle)=='string' && opts.handle.length>0 )	
			fn = ' onclick="'+opts.handle+'"'
	else 	fn = '';
	return 	'<div class="form-group form-active">'
		+		'<div class="attribute-label" >'+lbl+'</div>'
		+		'<div class="attribute-value checkbox" >'
		+			'<label>'
		+				'<input type="checkbox" name="boolean'+lbl.simpleHash()+'"'+(val?' checked':'')+fn+' />'
		+			'</label><br />'
		+		'</div>'
		+	'</div>'
}
function booleanValue( lbl:string ):boolean {
	let chd = $('input[name="boolean'+lbl.simpleHash()+'"]:checked');
	return chd.length>0;
}

function tagId(str:string):string {
	return 'X-'+str.simpleHash()
}
function setStyle( sty:string ):void {
		let css = document.createElement('style');
		css.innerHTML = sty;
		document.head.appendChild(css); // append to head
}

// standard error handler:
function stdError( xhr, cb? ):void {
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
			return; // some server calls end up in the fail trail, even though all went well.
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
			message.show( xhrCl );
	};
	// log original values:
	console.error( xhr.statusText + " (" + xhr.status + (xhr.responseType=='text'?"): "+xhr.responseText : ")") );
	if( typeof(cb)=='function' ) cb();
};
/*	// standard logger:
	function stdLog( fS, xhr ) {
		if( xhr ) {
			switch (xhr.status) {
				case 200:
				case 201:
				case 401:
					console.debug( fS+"/"+ (xhr.statusText||i18n.Error) + " (" + xhr.status + ")" );
					break;
				default:
					console.debug( fS+"/"+ (xhr.statusText||i18n.Error) + " (" + xhr.status + (xhr.responseText?"): "+xhr.responseText:")") )
			};
		} else {
					console.debug( fS );			
		};
	};
*/
// standard message box:
var message = function() {
	"use strict";
	// constructor for message-box:
	var self:any = {};
	let pend = 0;

	function init():void {
		$('#app').prepend('<div id="message" ></div>');
	};
	self.hide = ():void=>{
		$('#message')
			.empty()
			.hide();
		pend = 0;  // can be called internally or externally
	};
	function remove():void {
		if( --pend<1 )
			self.hide();
	}
	self.show = ( msg, opts ):void=>{
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
			setTimeout( remove, opts.duration)
		}
		// else: static message until it is over-written
	};
	init();
	return self;
}();

function doResize():void {
	// Resizes DOM-tree elements to fit in the current browser window.
	// In effect it is assured that correct vertical sliders are shown.

//	console.debug( 'doResize', $('#app').height(), getOuterHeight('#specsHeader') ); 
	
	// reduce by the padding; it is assumed that only padding-top is set and that it is equal for content and contentWide:
	// consider that there may be no element of type content or contentWide at a given instant.
	// see: https://stackoverflow.com/questions/3437786/get-the-size-of-the-screen-current-web-page-and-browser-window
	let wH = window.innerHeight
			|| document.documentElement.clientHeight
			|| document.body.clientHeight,

		hH = $('#pageHeader').outerHeight(true)
			+ $('.nav-tabs').outerHeight(true),
		pH = wH-hH;
//	console.debug( 'doResize', hH, pH, vP );

	$('.content').outerHeight( pH );
	$('.contentWide').outerHeight( pH );
	$('.pane-tree').outerHeight( pH );
	$('.pane-details').outerHeight( pH );
	$('.pane-filter').outerHeight( pH );

	// adjust the vertical position of the contentActions:
	$('.contentCtrl').css( "top", hH );
/*	return
	
	function getNavbarHeight() {
		return $('#navbar').css("height")
	} */
}
function bindResizer():void {
	// adapt the display in case the window is being resized:
	$(window).resize( ()=>{
//		console.debug('resize'); 
		doResize();
	});
}

function indexById(L:Array<object>,id:string):number {
	if( L && id ) {
		// given an ID of an item in a list, return it's index:
		id = id.trim();
		for( var i=L.length-1;i>-1;i-- )
			if( L[i].id==id ) return i   // return list index 
	};
	return -1;
}
function itemById(L:Array<object>,id:string):object|undefined {
//	console.debug('+',L,id,(L && id));
	if( L && id ) {
		// given the ID of an item in a list, return the item itself:
		id = id.trim();
		for( var i=L.length-1;i>-1;i-- )
			if( L[i].id==id ) return L[i]   // return list item
	};
}
function indexByTitle(L:Array<object>,ti:string):number {
	if( L && ti ) {
		// given a title of an item in a list, return it's index:
		for( var i=L.length-1;i>-1;i-- )
			if( L[i].title==ti ) return i   // return list index
	};
	return -1;
}
function itemByTitle(L:Array<object>,ti:string):object|undefined {
	if( L && ti ) {
		// given a title of an item in a list, return the item itself:
		for( var i=L.length-1;i>-1;i-- )
			if( L[i].title==ti ) return L[i];   // return list item
	};
}
function indexBy( L:Array<object>, p:string, s:string ):number {
	if( L && p && s ) {
		// Return the index of an element in list 'L' whose property 'p' equals searchterm 's':
		// hand in property and searchTerm as string !
		for( var i=L.length-1;i>-1;i-- )
			if( L[i][p]==s ) return i;
	};
	return -1;
}
function itemBy( L:Array<object>, p:string, s:string ):object|undefined {
	if( L && p && s ) {
		// Return the element in list 'L' whose property 'p' equals searchterm 's':
	//	s = s.trim();
		for( var i=L.length-1;i>-1;i-- )
			if( L[i][p]==s ) return L[i];   // return list item
	};
}
function containsById( cL, L ):boolean|null {
	if(!L) return null;
	// return true, if all items in L are contained in cL (cachedList),
	// where L may be an array or a single item:
	return Array.isArray(L)?containsL( cL, L ):indexById( cL, L.id )>-1;

	function containsL( cL, L ):boolean {
		for( var i=L.length-1;i>-1;i-- )
			if ( indexById( cL, L[i].id )<0 ) return false;
		return true;
	}
}
function containsByTitle( cL, L ):boolean|null {
	if(!L) return null;
	// return true, if all items in L are contained in cL (cachedList):
	return Array.isArray(L)?containsL( cL, L ):( indexByTitle( cL, L.title )>-1 );
	
	function containsL( cL, L ) {
		for( var i=L.length-1;i>-1;i-- )
			if ( indexByTitle( cL, L[i].title )<0 ) return false;
		return true;
	}
}
function cmp( i:string, a:string ):number {
	if( !i ) return -1;
	if( !a ) return 1;
	i = i.toLowerCase();
	a = a.toLowerCase();
	return i==a? 0 : (i<a? -1 : 1);
}
function sortByTitle( L:Array<object> ) {
	return L.sort( 
		(bim,bam)=>{ return cmp( bim.title, bam.title ) }
	);
}
function sortBy( L:Array<object>, fn:(object)=>string ):void {
	return L.sort( 
		(bim,bam)=>{ return cmp( fn(bim), fn(bam) ) }
	);
}
function forAll( L:Array<object>, fn ) {
	// return a new list with the results from applying the specified function to all items of input list L:
	if(!L) return [];
	var nL = [];
	L.forEach( (e)=>{ var r=fn(e); if(r) nL.push(r) } );
	return nL;
}

function addE( ctg:string, id:string, pr? ):void {
	// Add an element (e.g. class) to it's list, if not yet defined:
	if( !pr ) pr = app.cache.selectedProject.data;
	
	// get the name of the list, e.g. 'dataType' -> 'dataTypes':
	let lN:string = app.standardTypes.listNameOf(ctg);
	// create it, if not yet available:
	if (!Array.isArray(pr[lN]))
		pr[lN] = [];
	// add the type, but avoid duplicates:
	if( indexById( pr[lN], id )<0 ) 
		pr[lN].unshift( app.standardTypes.get(ctg,id) );
} 
function addPC( eC:object, id:string ):void {
	// Add the propertyClass-id to an element class (eC), if not yet defined:
	let lN = 'propertyClasses';
	if (Array.isArray(eC[lN])) {
		// Avoid duplicates:
		if( eC[lN].indexOf( id )<0 ) 
			eC[lN].unshift( id );
	} else {
		eC[lN] = [id];
	};
} 
function addP( el:object, prp:object ):void {
	// Add the property to an element (el):
	if (Array.isArray(el['properties']))
		el['properties'].unshift( prp );
	else
		el['properties'] = [prp];
}
function cacheE( L:Array<object>, e:object ):number {  // ( list, entry )
	// add or update the item e in a list L:
	let n = typeof(e)=='object'? indexById( L, e.id ) : L.indexOf(e);
	if( n<0 ) { L.push( e ); return L.length-1 };  // add, if not yet listed 
	L[n] = e; return n; // update otherwise
}
function cacheL( L:Array<object>, es:Array<object> ):void {  // ( list, entries )
	// add or update the items es in a list L:
	es.forEach( (e)=>{ cacheE( L, e ) } )
}
function uncacheE( L:Array<object>, e:object ):number {  // ( list, entry )
	// remove the item e from a list L:
	let n = typeof(e)=='object'? indexById( L, e.id ) : L.indexOf(e);
	if( n>-1 ) L.splice(n,1);  // remove, if found
	return n;
}
function uncacheL( L:Array<object>, es:Array<object> ):void {  // ( list, entries )
	// remove the items es from a list L:
	es.forEach( (e)=>{ uncacheE( L, e ) } );
}
	
// Add a leading icon to a title:
// use only for display, don't add to stored variables.
String.prototype.addIcon = function( ic:string ):string {
	if( ic ) return ic+'&#xa0;'+this;
	return this;
};
// http://stackoverflow.com/questions/10726909/random-alpha-numeric-string-in-javascript
function genID(pfx:string):string {
	if( !pfx || pfx.length<1 ) { pfx = 'ID_' };
	let re = /^[A-Za-z_]/;
	if( !re.test(pfx) ) { pfx = '_'+pfx };   // prefix must begin with a letter or '_'
	
	let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var result = '';
	for( var i=CONFIG.genIdLength; i>0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
	return pfx+result;
}
/*	
// http://stackoverflow.com/questions/10726909/random-alpha-numeric-string-in-javascript:
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
String.prototype.toJsId = function():string { 
	return this.replace( /[-:\.\,\s\(\)\[\]\/\\#�%]/g, '_' ); 
};
// Make an id conforming with ReqIF and SpecIF:
String.prototype.toSpecifId = function():string { 
	return this.replace( /[^_0-9a-zA-Z]/g, '_' ); 
};

// Make a very simple hash code from a string:
// http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
String.prototype.simpleHash = function():string {for(var r=0,i=0;i<this.length;i++)r=(r<<5)-r+this.charCodeAt(i),r&=r;return r};
	
/* from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith */	
if (!String.prototype.startsWith) {
	String.prototype.startsWith = function(searchString:string, pos?:number):boolean {
		pos = pos || 0;
		return this.lastIndexOf(searchString, pos) === pos
	};
};
/* from https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith */
if (!String.prototype.endsWith) {
	String.prototype.endsWith = function(searchString:string, pos?:number):boolean {
      let subjectString = this.toString();
      if (pos===undefined || pos > subjectString.length) {
        pos = subjectString.length
      };
      pos -= searchString.length;
      let lastIndex = subjectString.indexOf(searchString, pos);
      return lastIndex!==-1 && lastIndex===pos
	};
};
String.prototype.truncate = function(l:number):string {
	var t = this.substring(0,l-1);
//	if( t.length<this.length ) t += '&#8230;'; // &hellip;, i.e.three dots
	if( t.length<this.length ) t += '...';  // must work also in non-html fields
	return t;
};
/*String.prototype.reduceWhiteSpace = function():string {
// Reduce white space to a single blank:
	return this.replace( /[\s]{2,}/g, ' ' )
}; 
String.prototype.log = function(m:string):string {
	console.debug( m, this );
	return this
}; */
String.prototype.stripCtrl = function():string {
// Remove js/json control characters from HTML-Text or other:
	return this.replace( /\b|\f|\n|\r|\t|\v/g, '' );
};
String.prototype.ctrl2HTML = function():string {
// Convert js/json control characters (new line) to HTML-tags and remove the others:
	return this.replace( /\r|\f/g, '' )
				.replace( /&#x0{0,3}a;/gi, '' )
				.replace( /\t/g, '&nbsp;&nbsp;&nbsp;' )
				.replace( /\n/g, '<br />' )
				.replace( /&#x0{0,3}d;/gi, '<br />' );
};
String.prototype.toHTML = function():string {
// Escape HTML characters and convert js/json control characters (new line etc.) to HTML-tags:
	return this.escapeHTML().ctrl2HTML()
};
// https://stackoverflow.com/questions/15458876/check-if-a-string-is-html-or-not
function isHTML(str:string):boolean {
  let doc = new DOMParser().parseFromString(str, "text/html");
  return Array.from(doc.body.childNodes).some(node => node.nodeType==1)
}
function makeHTML(str:string,opts?):string {
	// Note: HTML embedded in markdown is not supported, because isHTML() will return 'true'.
	if( typeof(opts)=='object' && !opts.makeHTML ) 
		return str;
	let newS = str.ctrl2HTML()
			.linkifyURLs( opts )
			.replace(/--(?:&gt;|>)/g,'&#8594;')  // &rarr;
			.replace(/(?:&lt;|<)--/g,'&#8592;');  // &larr;
/*	// Dont't convert markdown, if the text begins and ends with a XHTML tag:
	if( /^\s*<.+>\s*$/.test(str) )
		return newS; */
	if( CONFIG.convertMarkdown && app.markdown ) {
		// don't interpret the '+' as list item, but do so with '�' and '•',
		// transform arrows assembled by characters to special arrow characters:
		return app.markdown.render( str
			.replace(/\+ /g,'&#x2b; ') // '+'
			.replace(/� /g,'* ')
			.replace(/• /g,'* ')
		);
//		.linkifyURLs( opts )
	};
	return '<div>'+newS+'</div>';
} 

/* String.prototype.utf8ToXmlChar = function():string {
	let i = this.length,
		aRet = [];
	while (i--) {
		let iC = this[i].charCodeAt(0);
		if (iC < 65 || iC > 127 || (iC > 90 && iC < 97)) aRet[i] = '&#' + iC + ';';
		else aRet[i] = this[i];
	};
	return aRet.join('');
}
String.prototype.xmlChar2utf8 = function():string {
		this = this.replace(/&#x([0-9a-fA-F]+);/g, function(match, numStr) {
			return String.fromCharCode(parseInt(numStr, 16))
		});
		return this.replace(/&#([0-9]+);/g, function(match, numStr) {
			return String.fromCharCode(parseInt(numStr, 10))
		})
} */

function escapeInner( str:string ):string {
	var out = "";
	str = str.replace( RE.innerTag, function($0,$1,$2,$3) {
		// $1: inner text (before the next tag)
		// $2: start of opening tag '<' or closing tag '</'
		// $3: rest of the tag
		// escape the inner text and keep the tag:
		out += $1.escapeXML() + $2 + $3;
		// consume the matched piece of str:
		return '';
	});
	// process the remainder (the text after the last tag or the whole text if there was no tag:
	out += str.escapeXML();
	return out;
} 
// Escape characters for Regex expression (https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions)
String.prototype.escapeRE = function():string { return this.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }; // $& means the whole matched string
// Escape characters for JSON string: 
//String.prototype.escapeJSON = function() { return this.replace(/["]/g, '\\$&') }; // $& means the whole matched string
// escape HTML characters:
String.prototype.escapeXML = function():string {
	return this.replace(/["'&<>]/g, ($0)=>{
		return "&#" + {"&":"38", "<":"60", ">":"62", '"':"34", "'":"39"}[$0] + ";";
	});
};
String.prototype.escapeHTML = function():string {
	return this.replace(/[&<>"'`=\/]/g, ($0)=>{
		return "&#" + {"&":"38", "<":"60", ">":"62", '"':"34", "'":"39", "`":"x60", "=":"x3D", "/":"x2F"}[$0] + ";";
	});
};
String.prototype.unescapeHTMLTags = function():string {
//  Unescape known HTML-tags:
	if( isHTML(this) ) return this;
	return noCode(this.replace(/&lt;(\/?)(p|div|br|b|i|em|span|ul|ol|li|a|table|thead|tbody|tfoot|th|td)(.*?\/?)&gt;/g, ($0,$1,$2,$3)=>{
		return '<'+$1+$2+$3+'>';
	}));
};
// see: https://stackoverflow.com/questions/1912501/unescape-html-entities-in-javascript
String.prototype.unescapeHTMLEntities = function():string {
	// unescape HTML encoded entities (characters):
	var el = document.createElement('div');
	return noCode(this.replace(/\&#?x?[0-9a-z]+;/gi, (enc)=>{
        el.innerHTML = enc;
        return el.innerText;
	}));
};
/*// better: https://stackoverflow.com/a/34064434/5445 but strips HTML tags.
String.prototype.unescapeHTMLEntities = function() {
	var doc = new DOMParser().parseFromString(input, "text/html");
    return noCode( doc.documentElement.textContent )
};*/
if (!String.prototype.stripHTML) {
	String.prototype.stripHTML = function():string {
		// strip html, but don't use a regex to impede cross-site-scripting (XSS) attacks:
		return $("<dummy/>").html( this ).text().trim() || '';
	};
};
/**
 * Returns the text from a HTML string
 * see: https://ourcodeworld.com/articles/read/376/how-to-strip-html-from-a-string-extract-only-text-content-in-javascript
 * 
 * @param {html} String The html string to strip
 *
function stripHtml(html){
	// Create a new div element
	var temp = document.createElement("div");
	// Set the HTML content with the providen
	temp.innerHTML = html;
	// Retrieve the text property of the element (cross-browser support)
	return temp.textContent || temp.innerText || "";
} */

// Add a link to an isolated URL:
String.prototype.linkifyURLs = function( opts?:object ):string {
	// perform the operation, unless specifically disabled:
	if( typeof(opts)=='object' && !opts.linkifyURLs ) return this;
	return this.replace( RE.URI,  
		( $0, $1, $2, $3, $4, $5, $6, $7, $8, $9 )=>{ 
			// all links which do not start with "http" are considered local by most browsers:
			if( !$2.startsWith('http') ) $2 = 'https://'+$2;  // starts with "www." then according to RE.URI
		/*	// we must encode the URI, but to avoid that an already encoded URI is corrupted, we first decode it
			// under the assumption that a decoding a non-encoded URI does not cause a change.
			// This does not work if a non-encoded URI contains '%'.
			return $1+'<a href="'+encodeURI(decodeURI($2))+'" >'+(opts&&opts.label? opts.label:$3+($4||'')+$5)+'</a>'+$9 */
			return $1+'<a href="'+$2+'" target="_blank" >'+(opts&&opts.label? opts.label:$3+($4||'')+$5)+'</a>'+$9;
		});
};

String.prototype.fileExt = function():string {
	// return the file extension only:
	return this.substring( this.lastIndexOf('.')+1 )
};
String.prototype.fileName = function():string {
	// return the filename without extension:
	return this.substring( 0, this.lastIndexOf('.') )
};
String.prototype.isTrue = function():boolean {
	return CONFIG.valuesTrue.indexOf( this.toLowerCase().trim() )>-1
};
String.prototype.isFalse = function():boolean {
	return CONFIG.valuesFalse.indexOf( this.toLowerCase().trim() )>-1
};
String.prototype.trimJSON = function():string {
	// trim all characters outside the outer curly brackets, which may include the UTF-8 byte-order-mask: 
	let si = this.indexOf('{'),
		li = this.lastIndexOf('}');
	return this.substring(si,li+1)
};

/*	
String.prototype.removeBOM = function():string {
	// remove the byte order mask from a UTF-8 coded string
	// ToDo: Any whitespace between BOM and JSON is not taken care of.
	// ToDo: The BOM may be "FE FF" in certain representations.
	return this.replace( /^(\xEF\xBB\xBF)?({[\s\S]*})/, ($0,$1,$2)=>{return $2} )
};

function toHex(str) {
	var hex='', nV='';
	for(var i=0;i<str.length;i++) {
		nV = str.charCodeAt(i).toString(16);
		hex += nV.length>1?''+nV:'0'+nV
	};
	return hex
}

if (!String.prototype.includes) {
  String.prototype.includes = function(search, start) {
    'use strict';
    if (typeof(start) !== 'number') {
      start = 0;
    }
    
    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
};
// https://tc39.github.io/ecma262/#sec-array.prototype.includes
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    value: function(searchElement, fromIndex) {

      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      // 1. Let O be ? ToObject(this value).
      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If len is 0, return false.
      if (len === 0) {
        return false;
      }

      // 4. Let n be ? ToInteger(fromIndex).
      //    (If fromIndex is undefined, this step produces the value 0.)
      var n = fromIndex | 0;

      // 5. If n = 0, then
      //  a. Let k be n.
      // 6. Else n < 0,
      //  a. Let k be len + n.
      //  b. If k < 0, let k be 0.
      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      function sameValueZero(x, y) {
        return x === y || (typeof(x) === 'number' && typeof(y) === 'number' && isNaN(x) && isNaN(y));
      }

      // 7. Repeat, while k < len
      while (k < len) {
        // a. Let elementK be the result of ? Get(O, ! ToString(k)).
        // b. If SameValueZero(searchElement, elementK) is true, return true.
        if (sameValueZero(o[k], searchElement)) {
          return true;
        }
        // c. Increase k by 1. 
        k++;
      }

      // 8. Return false
      return false;
    }
  });
};
// https://tc39.github.io/ecma262/#sec-array.prototype.find
if (!Array.prototype.find) {
  Object.defineProperty(Array.prototype, 'find', {
    value: function(predicate) {
     // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof(predicate) !== 'function') {
        throw new TypeError('predicate must be a function');
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      var thisArg = arguments[1];

      // 5. Let k be 0.
      var k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, � kValue, k, O �)).
        // d. If testResult is true, return kValue.
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return kValue;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return undefined.
      return undefined;
    },
    configurable: true,
    writable: true
  });
};
// Production steps of ECMA-262, Edition 6, 22.1.2.1
if (!Array.from) {
  Array.from = ( function() {
    var toStr = Object.prototype.toString;
    var isCallable = function(fn) {
      return typeof(fn) === 'function' || toStr.call(fn) === '[object Function]';
    };
    var toInteger = function(value) {
      var number = Number(value);
      if (isNaN(number)) { return 0; }
      if (number === 0 || !isFinite(number)) { return number; }
      return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
    };
    var maxSafeInteger = Math.pow(2, 53) - 1;
    var toLength = function(value) {
      var len = toInteger(value);
      return Math.min(Math.max(len, 0), maxSafeInteger);
    };

    // The length property of the from method is 1.
    return function from(arrayLike) {
      // 1. Let C be the this value.
      var C = this;

      // 2. Let items be ToObject(arrayLike).
      var items = Object(arrayLike);

      // 3. ReturnIfAbrupt(items).
      if (arrayLike == null) {
        throw new TypeError('Array.from requires an array-like object - not null or undefined');
      }

      // 4. If mapfn is undefined, then let mapping be false.
      var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
      var T;
      if (typeof(mapFn) !== 'undefined') {
        // 5. else
        // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
        if (!isCallable(mapFn)) {
          throw new TypeError('Array.from: when provided, the second argument must be a function');
        }

        // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
        if (arguments.length > 2) {
          T = arguments[2];
        }
      }

      // 10. Let lenValue be Get(items, "length").
      // 11. Let len be ToLength(lenValue).
      var len = toLength(items.length);

      // 13. If IsConstructor(C) is true, then
      // 13. a. Let A be the result of calling the [[Construct]] internal method 
      // of C with an argument list containing the single item len.
      // 14. a. Else, Let A be ArrayCreate(len).
      var A = isCallable(C) ? Object(new C(len)) : new Array(len);

      // 16. Let k be 0.
      var k = 0;
      // 17. Repeat, while k < len� (also steps a - h)
      var kValue;
      while (k < len) {
        kValue = items[k];
        if (mapFn) {
          A[k] = typeof(T) === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
        } else {
          A[k] = kValue;
        }
        k += 1;
      }
      // 18. Let putStatus be Put(A, "length", len, true).
      A.length = len;
      // 20. Return A.
      return A;
    };
  }());
};*/

function ab2str(buf):string {
	// Convert arrayBuffer to string:
	// UTF-8 character table: http://www.i18nqa.com/debug/utf8-debug.html
	// or: https://bueltge.de/wp-content/download/wk/utf-8_kodierungen.pdf
//	try {
		// see https://developers.google.com/web/updates/2014/08/Easier-ArrayBuffer-String-conversion-with-the-Encoding-API
		// DataView is a wrapper on top of the ArrayBuffer.
		let dataView = new DataView(buf),
		// The TextDecoder interface is documented at http://encoding.spec.whatwg.org/#interface-textdecoder
			decoder = new TextDecoder('utf-8');
		return decoder.decode(dataView);
/*	} catch (e) {
		// see https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
		// for vintage browsers such as IE
		// Known problem: Special chars like umlaut are not properly converted.
		return String.fromCharCode.apply(null, new Uint8Array(buf));
	}; */
}
function str2ab(str:string) {
	// Convert string to arrayBuffer:
//	try {
		let encoder = new TextEncoder();
		return encoder.encode(str).buffer;		
/*	} catch (e) {
		// for vintage browsers such as IE
		var buf = new ArrayBuffer(str.length);
		var bufView = new Uint8Array(buf);
		for (var i=0, I=str.length; i<I; i++) {
			bufView[i] = str.charCodeAt(i);
		};
		return buf;
	}; */
}
// see: https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications
// see: https://blog.logrocket.com/programmatic-file-downloads-in-the-browser-9a5186298d5c/ 
// see: https://css-tricks.com/lodge/svg/09-svg-data-uris/
function blob2dataURL(file,fn,timelag?):void {
	if( !file || !file.blob ) return;
	const reader = new FileReader();
	reader.addEventListener('loadend', (e)=>{ fn(e.target.result,file.title,file.type) });
	if( typeof(timelag)=='number' && timelag>0 )
		setTimeout( ()=>{
			reader.readAsDataURL(file.blob);
		}, timelag )
	else
		reader.readAsDataURL(file.blob);
} 
function blob2text(file,fn,timelag?):void {
	if( !file || !file.blob ) return;
	const reader = new FileReader();
	reader.addEventListener('loadend', (e)=>{ fn(e.target.result,file.title,file.type) });
	if( typeof(timelag)=='number' && timelag>0 )
		setTimeout( ()=>{
			reader.readAsText(file.blob);
		}, timelag );
	else
		reader.readAsText(file.blob);
}
function uriBack2slash(str:string):string {
    return str.replace( /<(?:object[^>]+?data=|img[^>]+?href=)"([^"]+)"[^>]*?\/?>/g, 
		($0, $1)=>{
			return $0.replace( /(?:data=|href=)"([^"]+)"/g, 
				($0)=>{
					return $0.replace(/\\/g, '/');
				}
			);
		}
	);
}
		
// not good enough, but better than nothing:
// see https://www.owasp.org/index.php/XSS_%28Cross_Site_Scripting%29_Prevention_Cheat_Sheet
// do not implement as chainable function, because a string object is created. 
function noCode( s:string ):string {
	if( s ) {
		// just suppress the whole content, if there are inacceptable/evil tags or properties, do NOT try to repair it.
		// <img src="bogus" onerror=alert('4711') />
		if( /<[^>]+\son[a-z]+=[^>]+>/i.test( s ) ) { log(911); return null };   // all event callbacks within HTML tags
		if( /<script[^>]*>[\s\S]*<\/script[^>]*>/i.test( s ) ) { log(912); return null };
		if( /<style[^>]*>[\s\S]*<\/style[^>]*>/i.test( s ) ) { log(913); return null };
		if( /<embed[^>]*>[\s\S]*<\/embed[^>]*>/i.test( s ) ) { log(914); return null };
		if( /<iframe[^>]*>[\s\S]*<\/iframe[^>]*>/i.test( s ) ) { log(915); return null };
	};
	return s;
	function log(c:string) {
		console.error('Considered harmful ('+c+'):',s);
	}
}
function cleanValue( o:string|Array<object> ):string|Array<object> {
	// remove potential malicious code from a value which may be supplied in several languages:
	if( typeof(o)=='string' ) return noCode( o ); 
	if( Array.isArray(o) ) return forAll( o, ( val )=>{ val.text = noCode(val.text); return val } );
	return '';  // unexpected input (programming error with all likelihood
}
/*
// Based on https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
if (!Array.isArray) {
    Array.isArray = (obj)=>{
        return Object.prototype.toString.call(obj) === "[object Array]";
    };
};
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger
if (!Number.isInteger) {
	Number.isInteger = (val)=>{
		return typeof(val)==='number' && isFinite(val) && Math.floor(val) === val;
	};
};
// function float2int(val) { return parseInt(val) };
*/
function attachment2mediaType( fname:string ):string|undefined {
	let t = fname.fileExt();  // get the extension excluding '.'
	if( t ) {
		// the sequence of mediaTypes in xTypes corresponds to the sequence of extensions in xExtensions:
		let ti = CONFIG.imgExtensions.indexOf( t.toLowerCase() );
		if( ti>-1 ) return CONFIG.imgTypes[ ti ];
		ti = CONFIG.officeExtensions.indexOf( t.toLowerCase() );
		if( ti>-1 ) return CONFIG.officeTypes[ ti ];
		ti = CONFIG.applExtensions.indexOf( t.toLowerCase() );
		if( ti>-1 ) return CONFIG.applTypes[ ti ];
	};
//	return; undefined
}
/*
function image2mediaType( fname ) {
	let t = fname.fileExt();  // get the extension excluding '.'
	if( !t ) return;
	let ti = CONFIG.imgExtensions.indexOf( t.toLowerCase() );
	if( ti>-1 ) return CONFIG.imgTypes[ ti ];
//	return; undefined
}
*/
function localDateTime(iso:string):string {
	if( typeof(iso)=='string' ) {
		// ToDo: calculate offset of time-zone ... or use one of the libraries ..
		if( iso.length>15 ) return (iso.substr(0,10)+' '+iso.substr(11,5)+'h');
		if( iso.length>9 ) return (iso.substr(0,10));
	};
	return '';
}

function simpleClone( o ) { 
	// "deep" clone;
	// does only work, if none of the property values are functions:
		function cloneProp(p) {
			return ( typeof(p) == 'object' )? simpleClone(p) : p;
		}
	if( typeof(o)=='object' ) {
		if( Array.isArray(o) )
			var n=[];
		else
			var n={};
		for( var p in o ) {
			if( Array.isArray(o[p]) ) {
				n[p] = [];
				o[p].forEach( (op)=>{
					n[p].push( cloneProp(op) );
				});
				continue;
			};
			// else
			n[p] = cloneProp(o[p]);
		};
		return n;
	};
	return o;
}
function hasUrlParams():boolean {
	let p = document.URL.split('#');
	return ( p[1] && p[1].length>0 );
/*	( p[1] && p[1].length>0 ) return '#';
	p = document.URL.split('?');   no queries, yet
	if( p[1] && p[1].length>0 ) return '?';
	return false; */
}
// ToDo: try prms = location.hash
// see: https://www.w3schools.com/jsref/prop_loc_hash.asp
function getUrlParams(opts?:object):object {
	// Get the url parameters contained in the 'fragment' according to RFC2396:
	if( typeof(opts)!='object' ) opts = {};
	if( typeof(opts.start)!='string' ) opts.start = '#';
	if( typeof(opts.separator)!='string' ) opts.separator = ';'

	let p = document.URL.split(opts.start);
	if( !p[1] ) return {};
	p = decodeURI(p[1]);
	if( p[0]=='/' ) p = p.substr(1);	// remove leading slash
	return parse( p );

	function parse( h:string ):object {
		if( !h ) return {};
		var pO = {};
		h = h.split(opts.separator);
		h.forEach( (p)=>{
			p = p.split('=');
			// remove enclosures from the value part:
			if( p[1] && ['"',"'"].indexOf(p[1][0])>-1 ) p[1] = p[1].substr(1,p[1].length-2);
			// look for specific tokens, only:
			if( CONFIG.urlParamTags.indexOf(p[0])>-1 )
				pO[p[0]] = p[1];
			else
				console.warn("Unknown URL-Parameter '",p[0],"' found.");
		});
		return pO;
	}
}
function setUrlParams(actSt:object):void {
	// update browser history, if changed:
	if( !browser.supportsHtml5History || !actSt ) return;

	let quO = getUrlParams();
//	console.debug( 'setUrlParams', quO, actSt );
	// don't update, if unchanged or no project selected:
	if( quO.project == actSt.project
		&& quO[CONFIG.keyView] == actSt.view
		&&	(quO[CONFIG.keyNode] == actSt.node
			|| !actSt.item 
			|| quO[CONFIG.keyItem] == actSt.item ) ) {
//		console.debug('setUrlParams - quit');
		return;
	};
	
	let path = window.location.pathname.split('/'),  // get the path in pieces
		newParams = path[path.length-1],   	// last element is 'appname.html' (without URL params)
		is='=',sep=';';

	newParams += '#'
				+ CONFIG.keyView+is+actSt.view
				+ (actSt.project? sep+CONFIG.keyProject+is+actSt.project : "")
				+ (actSt.node? sep+CONFIG.keyNode+is+actSt.node : (actSt.item? sep+CONFIG.keyItem+is+actSt.item : ''));

	// update the browser history:
	history.pushState('','',newParams);
}
function clearUrlParams():void {
	if( !browser.supportsHtml5History || !hasUrlParams() ) return;
	
	let path = window.location.pathname.split('/');  // get the path in pieces
//	console.debug( 'clearUrlParams', path );
	history.pushState('','',path[path.length-1]);    // last element is 'appname.html' without url parameters;
}
function httpGet(params:object):void {
	// https://blog.garstasio.com/you-dont-need-jquery/
	// https://www.sitepoint.com/guide-vanilla-ajax-without-jquery/
	var xhr = new XMLHttpRequest();
	xhr.open('GET', params.url, true);
	if( params.withCredentials ) xhr.withCredentials = "true";
	// https://stackoverflow.com/a/42916772/2214
	xhr.responseType = params.responseType;
	xhr.onreadystatechange = function() {
//		console.debug('xhr',this.readyState,this)
		if ( this.readyState<4 ) return;
		if ( this.readyState==4 ) {
			switch( this.status ) {
				case 200:
				case 201:
					// done:
					if( typeof(params.done)=="function" ) params.done(this);
					break;
				default:
					// done with error:
					if( typeof(params.fail)=="function" ) params.fail(this);
			};
		};
		// continue in case of success and error:
		if( typeof(params.then)=="function" ) params.then();
	};
	xhr.send(null);
}
