/*	helper functions for iLaH.
	Dependencies: jQuery 3.0
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de 
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)

 	Attention: 
	- Do NOT minify this module with the Google Closure Compiler. At least the RegExp in jsIdOf() will be modified to yield wrong results, e.g. falsely replaces 'u' by '_'.
*/ 

const Lib: any = {};
interface IFieldOptions {
	tagPos?: string;  // 'left', 'none'
	typ?: string;     // 'line', 'area' for textField
	classes?: string; // CSS classes
	handle?: string;  // event handler
}
function textField(tag: string, val: string, opts?: IFieldOptions): string {  
	// assemble a form for text input or display:
	//	console.debug('textField 1',tag,val,typ,fn);
	if (!opts) opts = {} as IFieldOptions;
	if (typeof (opts.tagPos) != 'string') opts.tagPos = 'left';

	val = typeof(val)=='string'? Lib.noCode( val ) : '';

	let fn = (typeof (opts.handle) == 'string' && opts.handle.length > 0)? ' oninput="' + opts.handle + '"' : '',
		sH = simpleHash(tag),
		fG: string,
		aC: string;
	if (typeof (opts.typ) == 'string' && ['line', 'area'].indexOf(opts.typ)>-1 ) 	
			fG = '<div id="'+sH+'" class="form-group form-active" >'    // for input field
	else	fG = '<div class="attribute" >';				// for display field

	switch( opts.tagPos ) {
		case 'none':
			aC = 'attribute-wide';
			break;
		case 'left':
			fG += '<div class="attribute-label" >'+tag+'</div>';
			aC = 'attribute-value';
			break;
		default:
			throw Error("Invalid display option '"+opts.tagPos+"' when showing a textField");
	};
	switch( opts.typ ) {
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
function setTextValue( tag:string, val:string ):void {
	let el = document.getElementById('field' + simpleHash(tag));
	if( el && el.nodeName && el.nodeName.toLowerCase()=='div' ) { el.innerHTML = val; return };
	// @ts-ignore - .value is in fact accessible
	if( el ) el.value = val;
}
function setTextFocus( tag:string ):void {
	let el = document.getElementById('field' + simpleHash(tag));
	if( el ) el.focus()
}
function setTextState( tag:string, state:string ):boolean {
	if( ['has-success','has-error'].indexOf(state)<0 ) throw Error("Invalid state '"+state+"'");
	let el = $('#' + simpleHash(tag));
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
function textValue( tag:string ):string {
	// get the input value:
	try {
		// @ts-ignore - .value is in fact accessible
		return Lib.noCode(document.getElementById('field' + simpleHash(tag)).value) || '';
	} catch(e) {
		return '';
	}
}
function getTextLength( tag:string ):number {
	// get length the input value:
	try {
		return textValue( tag ).length;
	} catch(e) {
		return -1;
	}
}

interface IBox {
	id: string;
	title: string;
	description?: string;
	checked?: boolean;
	type?: string;
}
function radioField(tag: string, entries: IBox[], opts?: IFieldOptions): string {
	// assemble an input field for a set of radio buttons:
	if (!opts) opts = {} as IFieldOptions;
	if (typeof(opts.tagPos) != 'string') opts.tagPos = 'left';
	if (typeof(opts.classes) != 'string') opts.classes = 'form-active';
	let rB: string,
		fn = ( typeof(opts.handle)=='string' && opts.handle.length>0 )?	' onclick="'+opts.handle+'"' : '';
	switch( opts.tagPos ) {
		case 'none': 
			rB = 	'<div class="form-group '+(opts.classes||'')+'">'
				+		'<div class="radio" >';
			break;
		case 'left': 
			rB = 	'<div class="form-group '+(opts.classes||'')+'">'
				+		'<div class="attribute-label" >'+tag+'</div>'
				+		'<div class="attribute-value radio" >';
			break;
		default:
			throw Error("Invalid display option '" + opts.tagPos + "' when showing a radioField");
	};
	// zero or one checked entry is allowed:
	let found = false, temp:boolean; 
	entries.forEach( (e)=>{
		temp = found || e!.checked;
		if( found && e.checked )
			e.checked = false; // only the first check will remain
		found = temp;
	});
	// render options:
	let tp:string,
		nm = simpleHash(tag);
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
function radioValue( tag:string ):string {
	// get the selected radio button, it is the index number as string:
	return $('input[name="radio' + simpleHash(tag)+'"]:checked').attr('value') || '';	// works even if none is checked
}
function checkboxField(tag: string, entries: IBox[], opts?: IFieldOptions): string {
	// assemble an input field for a set of checkboxes:
	if (!opts) opts = {} as IFieldOptions;
	if (typeof(opts.tagPos)!='string') opts.tagPos = 'left';
	if (typeof(opts.classes) != 'string') opts.classes = 'form-active';
	let cB: string,
		fn = (typeof (opts.handle) == 'string' && opts.handle.length > 0) ? ' onclick="' + opts.handle + '"' : '';
	switch( opts.tagPos ) {
		case 'none': 
			cB = 	'<div class="form-group '+(opts.classes||'')+'">'
				+		'<div class="checkbox" >';
			break;
		case 'left': 
			cB = 	'<div class="form-group '+(opts.classes||'')+'">'
				+		'<div class="attribute-label" >'+tag+'</div>'
				+		'<div class="attribute-value checkbox" >';
			break;
		default:
			throw Error("Invalid display option '" + opts.tagPos + "' when showing a checkboxField");
	};
	// render options:
	let tp: string, nm = simpleHash(tag);
	entries.forEach( (e,i)=>{
		tp = e.type?'&#160;('+e.type+')':'';   // add type in brackets, if available
		cB +=			'<label>'
			+				'<input type="checkbox" name="checkbox'+nm+'" value="'+(e.id||i)+'"'+(e.checked?' checked':'')+fn+' />'
			+				'<span '+(e.description? ('data-toggle="popover" title="'+e.description+'" '):'')+'>'+e.title+tp+'</span>'
			+			'</label><br />'
	});
	cB +=			'</div>'
			+	'</div>';
	return cB;
}
function checkboxValues( tag:string ):string[] {
	// get the selected check boxes as array with indices:
	let chd = $('input[name="checkbox' + simpleHash(tag)+'"]:checked');
	var resL = [];
	for( var i=0, I=chd.length; i<I; i++ ) {	// chd is an object, not an array
		// @ts-ignore - .value is in fact accessible
		resL.push( chd[i].value );
	};
	return resL;
}
function booleanField( tag:string, val:boolean, opts?:any ):string {
//	console.debug('booleanField',tag,val);
	let fn:string;
	if( opts && typeof(opts.handle)=='string' && opts.handle.length>0 )	
			fn = ' onclick="'+opts.handle+'"'
	else 	fn = '';
	return 	'<div class="form-group form-active">'
		+		'<div class="attribute-label" >'+tag+'</div>'
		+		'<div class="attribute-value checkbox" >'
		+			'<label>'
		+ '<input type="checkbox" name="boolean' + simpleHash(tag)+'"'+(val?' checked':'')+fn+' />'
		+			'</label><br />'
		+		'</div>'
		+	'</div>'
}
function booleanValue( tag:string ):boolean {
	let chd = $('input[name="boolean' + simpleHash(tag)+'"]:checked');
	return chd.length>0;
}

function tagId(str:string):string {
	return 'X-' + simpleHash(str)
}
function setStyle( sty:string ):void {
	let css = document.createElement('style');
	css.innerHTML = sty;
	document.head.appendChild(css); // append to head
}

class xhrMessage {
	status: number;
	statusText?: string;
	responseType?: string;
	responseText?: string;
	constructor(st: number, sTxt?: string, rTyp?: string, rTxt?: string) {
		this.status = st;
		this.statusText = sTxt;
		this.responseType = rTyp;
		this.responseText = rTxt;
	}
}
// standard error handler:
Lib.logMsg = (xhr: xhrMessage): void =>{
	console.log(xhr.statusText + " (" + xhr.status + (xhr.responseType == 'text' ? "): " + xhr.responseText : ")"));
}
Lib.stdError = (xhr: xhrMessage, cb?:Function): void =>{
//	console.debug('stdError',xhr);
	// clone, as xhr.responseText ist read-only:
	let xhrCl = new xhrMessage(xhr.status, xhr.statusText, xhr.responseType, xhr.responseType=='text'? xhr.responseText : '');
	
	switch( xhr.status ) {
		case 0:
		case 200:
		case 201:
			return; // some server calls end up in the fail trail, even though all went well.
		case 401:  // unauthorized
			app.me.logout();
			break;
		case 402:  // payment required - insufficient license
			// avoid TypeError: setting getter-only property "responseText" 
			// ('Object.assign({},..) does not work properly for some reason)
			xhrCl.responseType = 'text';
			xhrCl.responseText = i18n.Err402InsufficientLicense;
			message.show(xhrCl);
			break;
		case 403:  // forbidden
			// avoid TypeError: setting getter-only property "responseText"
			xhrCl.responseType = 'text';
			xhrCl.responseText = i18n.Err403Forbidden;
			message.show(xhrCl);
			break;
		case 404:  // not found
			// avoid TypeError: setting getter-only property "responseText"
			xhrCl.responseType = 'text';
			xhrCl.responseText = i18n.Err404NotFound;
			message.show(xhrCl);
			break;
	/*	case 500:
			// avoid TypeError: setting getter-only property "responseText"
			message.show( Object.assign({}, xhr, { statusText = i18n.ErrInvalidData, responseText: '' }), {severity:'danger'});
		//	x.statusText = i18n.ErrInvalidData;
		//	x.responseText = '';
		//	message.show( x, {severity:'danger'} );
			break;
		case 996:  // server request queue flushed
			break;  
		case 995:  // server request timeout  
			// no break  */
		default:
			message.show( xhr );
	};
	// log original values:
	Lib.logMsg(xhr);
	if( typeof(cb)=='function' ) cb();
};
// standard message box:
 class Message {
	// construct a message-box:
	pend: number;

	constructor() {
		this.pend = 0;
		$('#app').prepend('<div id="message" ></div>');
	}
	hide():void {
		$('#message')
			.empty()
			.hide();
		this.pend = 0;  // can be called internally or externally
	}
	private remove():void {
		if( --this.pend<1 )
			this.hide();
	}
	show( msg:xhrMessage|string, opts?:any ):void {
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
				this.hide();
				return;
			case 'object': 
				if( msg.status ) {
					// msg is an jqXHR object:
					msg = (msg.statusText || i18n.Error)
						+ " (" + msg.status
						+ ((msg.responseType == 'text' || typeof (msg.responseText) == 'string') && msg.responseText.length>0 ? 
							"): " + msg.responseText : ")");

					if( !opts.severity ) opts.severity = msg.status<202? 'success' : 'danger';
					break;
				};
			default:
				console.error(msg, ' is an invalid message.');
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
			this.pend++;
			// works only with the so-called lambda-function around this.remove ...,
			// just 'this.remove' does not work either:
			setTimeout( ()=>{ this.remove() }, opts.duration)
		}
		// else: static message until it is over-written
	}
};

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

			// @ts-ignore . in this case it is defined
		hH = $('#pageHeader').outerHeight(true)
			// @ts-ignore . in this case it is defined
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

type Item = DataType | PropertyClass | ResourceClass | StatementClass | Resource | Statement | SpecifNode | SpecifFile;
type Instance = Resource | Statement;
function indexById(L:any[],id:string):number {
	if( L && id ) {
		// given an ID of an item in a list, return it's index:
		id = id.trim();
		for( var i=L.length-1;i>-1;i-- )
			if( L[i].id==id ) return i   // return list index 
	};
	return -1;
}
function itemById(L:any[],id:string):any {
//	console.debug('+',L,id,(L && id));
	if( L && id ) {
		// given the ID of an item in a list, return the item itself:
		id = id.trim();
		for( var i=L.length-1;i>-1;i-- )
			if( L[i].id==id ) return L[i]   // return list item
	};
}
function indexByTitle(L:any[],ti:string):number {
	if( L && ti ) {
		// given a title of an item in a list, return it's index:
		for( var i=L.length-1;i>-1;i-- )
			if( L[i].title==ti ) return i   // return list index
	};
	return -1;
}
function itemByTitle(L:any[],ti:string):any {
	if( L && ti ) {
		// given a title of an item in a list, return the item itself:
		for( var i=L.length-1;i>-1;i-- )
			if( L[i].title==ti ) return L[i];   // return list item
	};
}
function indexBy(L:any[], p:string, s:string ):number {
	if( L && p && s ) {
		// Return the index of an element in list 'L' whose property 'p' equals searchterm 's':
		// hand in property and searchTerm as string !
		for (var i = L.length - 1; i > -1; i--)
			// @ts-ignore - the addressing via string is perfectly acceptable
			if( L[i][p]==s ) return i;
	};
	return -1;
}
function itemBy(L:any[], p:string, s:string ):any {
	if( L && p && s ) {
		// Return the element in list 'L' whose property 'p' equals searchterm 's':
	//	s = s.trim();
		for( var i=L.length-1;i>-1;i-- )
			// @ts-ignore - the addressing via string is perfectly acceptable
			if( L[i][p]==s ) return L[i];   // return list item
	};
}
Lib.containsById = (cL:any[], L: Item[] ):boolean =>{
	if (!cL || !L) throw Error("Missing Array");
	// return true, if all items in L are contained in cL (cachedList),
	// where L may be an array or a single item:
	return Array.isArray(L)?containsL( cL, L ):indexById( cL, L.id )>-1;

	function containsL(cL:any[], L: Item[] ):boolean {
		for( var i=L.length-1;i>-1;i-- )
			if ( indexById( cL, L[i].id )<0 ) return false;
		return true;
	}
} 
/* Lib.containsByTitle = (cL:any[], L: Item[] ):boolean =>{
	if (!cL || !L) throw Error("Missing Array");
	// return true, if all items in L are contained in cL (cachedList):
	return Array.isArray(L)?containsL( cL, L ):( indexByTitle( cL, L.title )>-1 );
	
	function containsL(cL: Item[], L: Item[] ):boolean {
		for( var i=L.length-1;i>-1;i-- )
			if ( indexByTitle( cL, L[i].title )<0 ) return false;
		return true;
	}
} */
Lib.cmp = ( i:string, a:string ):number =>{
	if( !i ) return -1;
	if( !a ) return 1;
	i = i.toLowerCase();
	a = a.toLowerCase();
	return i==a? 0 : (i<a? -1 : 1);
}
Lib.sortByTitle = ( L:any ):void =>{
	L.sort( 
		(bim,bam)=>{ return Lib.cmp( bim.title, bam.title ) }
	);
}
Lib.sortBy = ( L:any[], fn:(arg0:object)=>string ):void =>{
	L.sort( 
		(bim, bam) => { return Lib.cmp( fn(bim), fn(bam) ) }
	);
}
Lib.forAll = ( L:any[], fn:(arg0:any)=>any ):Array<any> =>{
	// return a new list with the results from applying the specified function to all items of input list L;
	// differences when compared to Array.map():
	// - tolerates missing L
	// - suppresses undefined list items in the result, so in effect forAll is a combination of .map() and .filter().
	if(!L) return [];
	var nL = [];
	L.forEach( (e)=>{ var r=fn(e); if(r) nL.push(r) } );
	return nL;
}

// Add a leading icon to a title:
// use only for display, don't add to stored variables.
Lib.addIcon = (str: string, ic: string): string =>{
	if (ic) return ic + '&#xa0;' + str;
	return str;
}
Lib.cacheE = ( L:Array<object>, e:object ):number =>{  // ( list, entry )
	// add or update the item e in a list L:
	let n = typeof(e)=='object'? indexById( L, e.id ) : L.indexOf(e);
	// add, if not yet listed:
	if (n < 0) {
		L.push(e);
		return L.length - 1;
	};
	// update, if newer:
//	if ( L[n].changedAt && e.changedAt && new Date(L[n].changedAt)<new Date(e.changedAt) )
		L[n] = e;
	return n;
}
Lib.cacheL = ( L:Array<object>, es:Array<object> ):boolean =>{  // ( list, entries )
	// add or update the items es in a list L:
	es.forEach((e) => { Lib.cacheE(L, e) })
	// this operation cannot fail:
	return true;
}
Lib.uncacheE = ( L:Array<object>, e:object ):number =>{  // ( list, entry )
	// remove the item e from a list L:
	let n = typeof(e)=='object'? indexById( L, e.id ) : L.indexOf(e);
	if( n>-1 ) L.splice(n,1);  // remove, if found
	return n;
}
Lib.uncacheL = ( L:Array<object>, es:Array<object> ):boolean =>{  // ( list, entries )
	// remove the items es from a list L:
	let done = true;
	es.forEach((e) => { done = done && Lib.uncacheE(L, e) > -1 });
	return done;
}
	
// http://stackoverflow.com/questions/10726909/random-alpha-numeric-string-in-javascript
Lib.genID = (pfx:string):string =>{
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

// Add new operations to the String.prototype:
interface String {
	jsIdOf: Function;
	specifIdOf: Function;
	linkifyURLs: Function;
	ctrl2HTML: Function;
	stripHTML: Function;
	stripCtrl: Function;
	makeHTML: Function;
	escapeRE: Function;
	escapeXML: Function;
	escapeHTML: Function;
	escapeHTMLTags: Function;
	escapeHTMLEntities: Function;
	unescapeHTMLTags: Function;
	unescapeHTMLEntities: Function;
	fileName: Function;
	fileExt: Function;
}
// Make a valid js variable/property name; replace disallowed characters by '_':
String.prototype.jsIdOf = function():string {
	return this.replace( /[-:\.\,\s\(\)\[\]\/\\#�%]/g, '_' );
};
// Make an id conforming with ReqIF and SpecIF:
String.prototype.specifIdOf = function():string {
	return this.replace( /[^_0-9a-zA-Z]/g, '_' );
};
/*
function truncate(l:number):string {
	var t = this.substring(0,l-1);
//	if( t.length<this.length ) t += '&#8230;'; // &hellip;, i.e.three dots
	if( t.length<this.length ) t += '...';  // must work also in non-html fields
	return t;
}
String.prototype.reduceWhiteSpace = function():string {
// Reduce white space to a single blank:
	return this.replace( /[\s]{2,}/g, ' ' )
}; 
String.prototype.log = function(m:string):string {
	console.debug( m, this );
	return this
}; */
String.prototype.stripHTML = function():string {
	// strip html, but don't use a regex to impede cross-site-scripting (XSS) attacks:
	return $("<dummy/>").html(this).text().trim() || '';
};
/*
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
String.prototype.stripCtrl = function():string {
// Remove js/json control characters from HTML-Text or other:
	return this.replace( /\b|\f|\n|\r|\t|\v/g, '' );
}
String.prototype.ctrl2HTML = function():string {
// Convert js/json control characters (new line) to HTML-tags and remove the others:
	return this.replace( /\r|\f/g, '' )
				.replace( /&#x0{0,3}a;/gi, '' )
				.replace(/\t/g, '&#160;&#160;&#160;&#160;' )  // nbsp
				.replace( /\n/g, '<br />' )
				.replace( /&#x0{0,3}d;/gi, '<br />' );
};
String.prototype.makeHTML = function(opts?:any):string {
	// Note: HTML embedded in markdown is not supported, because isHTML() will return 'true'.
	if (typeof (opts) == 'object' && opts.makeHTML) {
		let newS = this
			.linkifyURLs(opts)
			.replace(/--(?:&gt;|>)/g, '&#8594;')  // &rarr;
			.replace(/(?:&lt;|<)--/g, '&#8592;');  // &larr;
		/*	// Dont't convert markdown, if the text begins and ends with a XHTML tag:
			if( /^\s*<.+>\s*$/.test(str) )
				return newS; */
		// @ts-ignore - 'window.markdown' is defined, if loaded
		if (CONFIG.convertMarkdown && window.markdown) {
			// don't interpret the '+' as list item, but do so with '�' and '•',
			// transform arrows assembled by characters to special arrow characters:
			// @ts-ignore - 'window.markdown' is defined, if loaded
			return window.markdown.render(newS
				.replace(/\+ /g, '&#x2b; ') // don't transform '+' to list item
			//	.replace(/� /g, '* ')
				.replace(/• /g, '* ')
			);
		};
		return '<div>' + newS.ctrl2HTML() + '</div>';
	};
	return this as string;
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

Lib.toHTML = (str: string): string => {
	// Escape HTML characters and convert js/json control characters (new line etc.) to HTML-tags:
	return str.escapeHTML().ctrl2HTML()
}
// https://stackoverflow.com/questions/15458876/check-if-a-string-is-html-or-not
Lib.isHTML = (str: string): boolean => {
	let doc = new DOMParser().parseFromString(str, "text/html");
	return Array.from(doc.body.childNodes).some(node => node.nodeType == 1)
}
Lib.escapeInnerHtml = ( str:string ):string =>{
	// escape text except for HTML tags:
	var out = "";

	// @ts-ignore - $0 is never read, but must be specified anyways
	str = str.replace(RE.innerHtmlTag, function ($0, $1, $2, $3, $4) {
		// $1: inner text (before the next tag)
		// $2: start of opening tag '<' or closing tag '</'
		// $3: any of the tokens listed in tokenGroup (see definitions.ts)
		// $4: the rest of the tag including '>' or '/>'
//		console.debug('escapeInner', $0, $1, $2, $3, $4);

		// escape the inner text and keep the tag:
		out += $1.escapeXML() + $2 + $3 + $4; 

		// consume the matched piece of str:
		return '';
	});
	// process the remainder (the text after the last tag) or the whole text if there was no tag:
	out += str.escapeXML();
	return out;
} 
// Escape characters for Regex expression (https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions)
String.prototype.escapeRE = function():string { return this.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }; // $& means the whole matched string
// Escape characters for JSON string: 
//String.prototype.escapeJSON = function() { return this.replace(/["]/g, '\\$&') }; // $& means the whole matched string

String.prototype.escapeXML = function():string {
// escape XML characters:
	return this.replace(/["'&<>]/g, ($0)=>{
		return "&#" + {"&":"38", "<":"60", ">":"62", '"':"34", "'":"39"}[$0] + ";";
	});
};
String.prototype.escapeHTML = function():string {
// escape HTML characters:
	return this.replace(/[&<>"'`=\/]/g, ($0)=>{
		return "&#" + {"&":"38", "<":"60", ">":"62", '"':"34", "'":"39", "`":"x60", "=":"x3D", "/":"x2F"}[$0] + ";";
	});
};
String.prototype.unescapeHTMLTags = function():string {
//  Unescape known HTML-tags:
	if( Lib.isHTML(this as string) ) return this as string;
	// @ts-ignore - $0 is never read, but must be specified anyways
	return Lib.noCode(this.replace(RE.escapedHtmlTag, ($0,$1,$2,$3)=>{
		return '<'+$1+$2+$3+'>';
	}));
};
// see: https://stackoverflow.com/questions/1912501/unescape-html-entities-in-javascript
String.prototype.unescapeHTMLEntities = function():string {
	// unescape HTML encoded entities (characters):
	var el = document.createElement('div');
	return Lib.noCode(this.replace(/\&#?x?[0-9a-z]+;/gi, (enc)=>{
        el.innerHTML = enc;
        return el.innerText;
	}));
};
/*// better: https://stackoverflow.com/a/34064434/5445 but strips HTML tags.
String.prototype.unescapeHTMLEntities = function() {
	var doc = new DOMParser().parseFromString(input, "text/html");
    return Lib.noCode( doc.documentElement.textContent )
};*/

// Add a link to an isolated URL:
String.prototype.linkifyURLs = function( opts?:any ):string {
	// perform the operation, unless specifically disabled:
	if( typeof(opts)=='object' && opts.linkifyURLs )
		return this.replace( RE.URI,  
			// @ts-ignore - $6, $7, $8 are never read, but must be specified anyways
			( $0, $1, $2, $3, $4, $5, $6, $7, $8, $9 )=>{
				// all links which do not start with "http" are considered local by most browsers:
				if( !$2.startsWith('http') ) $2 = 'https://'+$2;  // starts with "www." then according to RE.URI
			/*	// we must encode the URI, but to avoid that an already encoded URI is corrupted, we first decode it
				// under the assumption that decoding a non-encoded URI does not cause a change.
				// This does not work if a non-encoded URI contains '%'.
				return $1+'<a href="'+encodeURI(decodeURI($2))+'" >'+(opts&&opts.label? opts.label:$3+($4||'')+$5)+'</a>'+$9 */
				return $1+'<a href="'+$2+'" target="_blank" >'+(opts&&opts.label? opts.label:$3+($4||'')+$5)+'</a>'+$9;
			});
	return this as string;
};
String.prototype.fileExt = function():string {
	// return the file extension only:
	return this.substring(this.lastIndexOf('.') + 1);
/*	// see https://stackoverflow.com/questions/190852/how-can-i-get-file-extensions-with-javascript/12900504#12900504
	return fname.slice((fname.lastIndexOf(".") - 1 >>> 0) + 2); */
};
String.prototype.fileName = function():string {
	// return the filename without extension:
	return this.substring( 0, this.lastIndexOf('.') )
};
Lib.trimJson = (str:string):string =>{
	// trim all characters outside the outer curly brackets, which may include the UTF-8 byte-order-mask: 
	return str.substring( str.indexOf('{'), str.lastIndexOf('}')+1 )
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
	return hex;
}; */

Lib.ab2str = (buf): string =>{
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
Lib.str2ab = (str:string) =>{
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
Lib.blob2dataURL = (file, fn: Function, timelag?: number): void =>{
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
Lib.blob2text = (file, fn: Function, timelag?: number): void => {
	if (!file || !file.blob) return;
	const reader = new FileReader();
	reader.addEventListener('loadend', (e) => { fn(e.target.result, file.title, file.type) });
	if (typeof (timelag) == 'number' && timelag > 0)
		setTimeout(() => {
			reader.readAsText(file.blob);
		}, timelag);
	else
		reader.readAsText(file.blob);
};
Lib.uriBack2slash = (str:string):string =>{
    return str.replace( /<(?:object[^>]+?data=|img[^>]+?href=)"([^"]+)"[^>]*?\/?>/g, 
		($0)=>{
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
Lib.noCode = ( s:string ):string =>{
	if( s ) {
		// just suppress the whole content, if there are inacceptable/evil tags or properties, do NOT try to repair it.
		// <img src="bogus" onerror=alert('4711') />
		if( /<[^>]+\son[a-z]+=[^>]+>/i.test( s ) ) { log(911); return '' };   // all event callbacks within HTML tags
		if( /<script[^>]*>[\s\S]*<\/script[^>]*>/i.test( s ) ) { log(912); return '' };
		if( /<style[^>]*>[\s\S]*<\/style[^>]*>/i.test( s ) ) { log(913); return '' };
		if( /<embed[^>]*>[\s\S]*<\/embed[^>]*>/i.test( s ) ) { log(914); return '' };
		if( /<iframe[^>]*>[\s\S]*<\/iframe[^>]*>/i.test( s ) ) { log(915); return '' };
	};
	return s;
	function log(c:number):void {
		console.log("'"+s+"' is considered harmful ("+c+") and has been suppressed");
	}
}
Lib.cleanValue = (o: string | ValueElement[]): string | ValueElement[] => {
	// remove potential malicious code from a value which may be supplied in several languages:
	if( typeof(o)=='string' ) return Lib.noCode( o ); 
	if( Array.isArray(o) ) return Lib.forAll( o, ( val )=>{ val.text = Lib.noCode(val.text); return val } );
	return '';  // unexpected input (programming error with all likelihood
}
Lib.attachment2mediaType = ( fname:string ):string|undefined =>{
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
//	return undefined;
}
Lib.localDateTime = (iso:string):string =>{
	if( typeof(iso)=='string' ) {
		// ToDo: calculate offset of time-zone ... or use one of the libraries ..
		if( iso.length>15 ) return (iso.substr(0,10)+' '+iso.substr(11,5)+'h');
		if( iso.length>9 ) return (iso.substr(0,10));
	};
	return '';
}

// Make a very simple hash code from a string:
// http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
function simpleHash(str: string): string {
	for (var r = 0, i = 0; i < str.length; i++) r = (r << 5) - r + str.charCodeAt(i), r &= r;
	return r as unknown as string;
};
function simpleClone( o ): any {
	// "deep" clone;
	// does only work, if none of the property values are functions:
		function cloneProp(p) {
			return ( typeof(p) == 'object' )? simpleClone(p) : p;
		}
	if( typeof(o)=='object' ) {
		var n: any;
		if (Array.isArray(o))
			n=[];
		else
			n={};
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
/*
// ToDo: try prms = location.hash
// see: https://www.w3schools.com/jsref/prop_loc_hash.asp
class IUrlParams {
//	uid?: string;
	import?: string;
	mode?: string;
	project?: string;
	item?: string;
	node?: string;
	view?: string;
}
	// Keys for the query parameters - if changed, existing links will end up in default view:
//	CONFIG.keyUId = 'uid';	// userId
	CONFIG.keyImport = 'import';
	CONFIG.keyMode = 'mode';
	CONFIG.keyProject = 'project';	// projectId
	CONFIG.keyItem = 'item';
	CONFIG.keyNode = 'node';
	CONFIG.keyView = 'view';	// dialog
	CONFIG.urlParamTags = [CONFIG.keyImport,CONFIG.keyMode,CONFIG.keyProject,CONFIG.keyItem,CONFIG.keyNode,CONFIG.keyView];

function getUrlParams(opts?: any): IUrlParams {
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
		var pO = new IUrlParams;
		h = h.split(opts.separator);
		h.forEach( (p)=>{
			p = p.split('=');
			// remove enclosing quotes from the value part:
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
*/
// ToDo: try prms = location.hash
// see: https://www.w3schools.com/jsref/prop_loc_hash.asp
function getUrlParams(opts?:any):any {
	// Get the url parameters contained in the 'fragment' according to RFC2396:
	if( typeof(opts)!='object' ) opts = {};
	if( typeof(opts.start)!='string' ) opts.start = '#';
	if( typeof(opts.separator)!='string' ) opts.separator = ';'

	let p = document.URL.split(opts.start);
	if( !p[1] ) return {};
	return parse( decodeURI(p[1]) );

	function parse( h:any ):any {
		if( !h ) return {};
		if ( h.charAt(0) == '/') h = h.substr(1);	// remove leading slash
		var pO = {};
		h = h.split(opts.separator);
		h.forEach( (p)=>{
			p = p.split('=');
			// remove enclosing quotes from the value part:
			if( p[1] && ['"',"'"].indexOf(p[1][0])>-1 ) p[1] = p[1].substr(1,p[1].length-2);
			// look for specific tokens, only:
			if (CONFIG.urlParamTags.indexOf(p[0]) > -1)
				// @ts-ignore - indexing is ok:
				pO[p[0]] = p[1];
			else
				console.warn("Unknown URL-Parameter '",p[0],"' found.");
		});
		return pO;
	}
}
function setUrlParams(actSt:any):void {
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
Lib.httpGet = (params:any):void =>{
	// https://blog.garstasio.com/you-dont-need-jquery/
	// https://www.sitepoint.com/guide-vanilla-ajax-without-jquery/
	var xhr = new XMLHttpRequest();
	xhr.open('GET', params.url, true);
	if( params.withCredentials ) xhr.withCredentials = true;
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
