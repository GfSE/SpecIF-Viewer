/*    helper functions for iLaH.
    Dependencies: jQuery 3.0
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    Author: se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)

     Attention:
    - Do NOT minify this module with the Google Closure Compiler. At least the RegExp in toJsId() will be modified to yield wrong results, e.g. falsely replaces 'u' by '_'.
*/

const LIB: any = {};

interface INodeWithPosition extends SpecifNode {
    parent?: string;
    predecessor?: string;
}
// For example, ioXLS uses incomplete links which are late attached using hookStatements:
interface IIncompleteStatement extends SpecifStatement {
    resourceToLink: string; // is the title of a resource
}
interface IFieldOptions {
    tagPos?: string;  // 'left', 'none' ('above')
    typ?: string;     // 'line', 'area' for makeTextField
    classes?: string; // CSS classes
    handle?: string;  // event handler
    hint?: SpecifValue; // further explanation in a popup
}
function popOver(dsc?: SpecifValue ):string {
    return (dsc ? (' data-toggle="popover" title="' + LIB.displayValueOf(dsc, { targetLanguage: browser.language, stripHTML: true }) + '" ') : '')
}
function makeTextField(tag: string, val: string, opts?: IFieldOptions): string {  
    // assemble a dialog field for text input or display:
//    console.debug('makeTextField 1',tag,val,typ,fn);
    if (!opts) opts = {} as IFieldOptions;
    if (typeof (opts.tagPos) != 'string') opts.tagPos = 'left';

    let fn = (typeof (opts.handle) == 'string' && opts.handle.length > 0)? ' oninput="' + opts.handle + '"' : '',
        sH = simpleHash(tag),
        fG: string,
        aC: string;
    if (opts.typ && ['line', 'area'].includes(opts.typ) )
        fG = '<div id="'+sH+'" class="form-group form-active" >'    // input field
    else
        fG = '<div class="attribute" >';                // display field

    switch( opts.tagPos ) {
        case 'none':
            aC = 'attribute-wide';
            break;
        case 'left':
            fG += '<div class="attribute-label"' + popOver(opts.hint) + '>' + tag +'</div>';
            aC = 'attribute-value';
            break;
        default:
            throw Error("Invalid display option '"+opts.tagPos+"' when showing a text form");
    };

    val = LIB.noCode(val || '').unescapeJSON();  // dateTime properties can be undefined ... perhaps others as well.
    switch (opts.typ) {
        case 'line':
            fG += '<div class="' + aC + '">'
                + (val.includes('\n') ?
                    '<textarea id="field' + sH + '" class="form-control" rows="2"' + fn + '>' + val + '</textarea>'
                    : '<input type="text" id="field' + sH + '" class="form-control"' + fn + ' value="' + val + '" />')
                + '</div>';
            break;
        case 'area':
            fG += '<div class="' + aC + '">'
                +   '<textarea id="field' + sH + '" class="form-control" rows="7"' + fn + '>' + val + '</textarea>'
                + '</div>';
            break;
        default:
            // display the value:
            fG += '<div id="field' + sH + '" class="' + aC + '" >' + val + '</div>';
    };
    fG += '</div>';
    return fG;
}
function setTextValue( tag:string, val:string ):void {
    val = LIB.noCode(val || '').unescapeJSON();
    // For now, just take care of the first value:
    let el = document.getElementById('field' + simpleHash(tag));
    if (el && el.nodeName && el.nodeName.toLowerCase() == 'div') {
        el.innerHTML = val;
        return
    };
    // @ts-ignore - .value is in fact accessible
    if( el ) el.value = val;
}
function setFocus( tag:string ):void {
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
        }
        else
            return false;    // no change
    };
    if( el.hasClass('has-success') ) {
        if( state=='has-error' ) {
            el.removeClass('has-success').addClass('has-error');
            return true;
        }
        else
            return false;    // no change
    };
    // else, has neither class:
    el.addClass(state);
    return true;
}
function textValue( tag:string ):string {
    // get the input value:
    try {
        // @ts-ignore - .value is in fact accessible
        return LIB.noCode(document.getElementById('field' + simpleHash(tag)).value).escapeJSON() || '';
    } catch(e) {
        return '';
    }
}
function getTextLength( tag:string ):number {
    // get length the input value:
    try {
        return textValue( tag ).length;
    } 
    catch(e) {
        return -1;
    }
}

interface IBox {
    id: string;
    title: string;
    description?: SpecifValue;
    checked?: boolean;
    type?: string;
}
function makeRadioField(tag: string, entries: IBox[], opts?: IFieldOptions): string {
    // assemble an input field for a set of radio buttons:
    if (!opts) opts = {} as IFieldOptions;

    switch (opts.typ) {
        case 'display':
            return '<div class="attribute ' + (opts.classes || '') + '">'
                + '<div class="attribute-label"' + popOver(opts.hint) + '>' + tag + '</div>'
                + '<div class="attribute-value" >'
                + function () {
                    let vals = '';
                    entries.forEach((e) => {
                        vals += (e.checked ? (vals.length>0 ? ', ' : '') + e.title : '')
                    });
                    return vals;
                }()
                + '</div>'
                + '</div>';
    };

    // radiobuttons to edit the value:
    if (typeof (opts.tagPos) != 'string') opts.tagPos = 'left';
    if (typeof (opts.classes) != 'string') opts.classes = 'form-active';
    let rB = '<div class="form-group ' + (opts.classes || '') + '">',
        fn = ( typeof(opts.handle)=='string' && opts.handle.length>0 )?    ' onclick="'+opts.handle+'"' : '';
    switch( opts.tagPos ) {
        case 'none': 
            rB +=        '<div class="radio" >';
            break;
        case 'left': 
            rB += '<div class="attribute-label"' + popOver(opts.hint) + '>' + tag + '</div>'
                +        '<div class="attribute-value radio" >';
            break;
        default:
            throw Error("Invalid display option '" + opts.tagPos + "' when showing a radio form");
    };
    // zero or one checked entry is allowed:
    let found = false, temp:boolean; 
    entries.forEach((e: IBox): void => {
        temp = found || !!e.checked;
        if( found && e.checked )
            e.checked = false; // only the first check will remain
        found = temp;
    });
    // render options:
    entries.forEach( (e,i)=>{
        rB +=            '<label>'
            +                '<input type="radio" name="radio'+simpleHash(tag)+'" value="'+(e.id||i)+'"'+(e.checked?' checked':'')+fn+' />'
            + '<span ' + popOver(e.description) + '>'
            +                    e.title
            +                    ( e.type? '&#160;(' + e.type + ')' : '')   // add type in brackets, if available
            +                '</span>'
            +            '</label><br />'
    });
    rB +=            '</div>'
        +        '</div>';
    return rB;
}
function radioValue( tag:string ):string {
    // get the selected radio button, it is the index number as string:
    return $('input[name="radio' + simpleHash(tag)+'"]:checked').attr('value') || '';    // works even if none is checked
}
function makeCheckboxField(tag: string, entries: IBox[], opts?: IFieldOptions): string {
    // assemble an input field for a set of checkboxes:
    if (!opts) opts = {} as IFieldOptions;

    switch (opts.typ) {
        case 'display':
            return '<div class="attribute ' + (opts.classes || '') + '">'
                + '<div class="attribute-label"' + popOver(opts.hint) + '>' + tag + '</div>'
                + '<div class="attribute-value" >'
                +   function () {
                        let vals = '';
                        entries.forEach((e) => {
                            vals += (e.checked ? (vals.length > 0 ? ', ' : '') + e.title : '')
                        });
                        return vals;
                    }()
                + '</div>'
                + '</div>';
    };

    // checkbox to edit the values:
    if (typeof (opts.tagPos) != 'string') opts.tagPos = 'left';
    if (typeof (opts.classes) != 'string') opts.classes = 'form-active';
    let cB = '<div class="form-group ' + (opts.classes || '') + '">',
        fn = (typeof (opts.handle) == 'string' && opts.handle.length > 0) ? ' onclick="' + opts.handle + '"' : '';
    switch( opts.tagPos ) {
        case 'none': 
            cB +=        '<div class="checkbox" >';
            break;
        case 'left': 
            cB += '<div class="attribute-label"' + popOver(opts.hint) + '>' + tag + '</div>'
                +        '<div class="attribute-value checkbox" >';
            break;
        default:
            throw Error("Invalid display option '" + opts.tagPos + "' when showing a checkbox form");
    };
    // render options:
    entries.forEach( (e,i)=>{
        cB +=            '<label>'
            +                '<input type="checkbox" name="checkbox'+simpleHash(tag)+'" value="'+(e.id||i)+'"'+(e.checked?' checked':'')+fn+' />'
            + '<span ' + popOver(e.description) + '>'
            +                       e.title
            +                       (e.type ? '&#160;(' + e.type + ')' : '')   // add type in brackets, if available
            +                   '</span>'
            +            '</label><br />'
    });
    cB +=            '</div>'
            +    '</div>';
    return cB;
}
function checkboxValues( tag:string ):string[] {
    // get the selected check boxes as array:
    let chd = $('input[name="checkbox' + simpleHash(tag)+'"]:checked');
    var resL:string[] = [];
    Array.from(chd, (el) => {
        // @ts-ignore - .value is in fact accessible
        resL.push(el.value);
    });
    return resL;
}
function makeBooleanField( tag:string, val:boolean, opts?: IFieldOptions ):string {
    // assemble an input field for a boolean value:
    if (!opts) opts = {} as IFieldOptions;
//    console.debug('makeBooleanField',tag,val);
    let fn = '';
    if( typeof(opts.handle)=='string' && opts.handle.length>0 )    
        fn = ' onclick="' + opts.handle + '"';
    switch (opts.typ) {
        case 'display':
            return '<div class="attribute">'
                + '<div class="attribute-label"' + popOver(opts.hint) + '>' + tag + '</div>'
                + '<div class="attribute-value">' + (val ? 'true' : 'false') + '</div>'
                + '</div>';
        default:
            return '<div class="form-group form-active">'
                + '<div class="attribute-label"' + popOver(opts.hint) + '>' + tag + '</div>'
                + '<div class="attribute-value checkbox" >'
                + '<label>'
                + '<input type="checkbox" name="boolean' + simpleHash(tag) + '"' + (val ? ' checked' : '') + fn + ' />'
                + '</label><br />'
                + '</div>'
                + '</div>'
    }
}
function booleanValue( tag:string ):boolean {
    let chd = $('input[name="boolean' + simpleHash(tag)+'"]:checked');
    return chd.length>0;
}

function tagId(str:string):string {
    return 'X-' + simpleHash(str||'')
}
function setStyle( sty:string ):void {
    let css = document.createElement('style');
    css.innerHTML = sty;
    document.head.appendChild(css); // append to head
}
interface IDialogField {
    label: string;
    dataType: SpecifDataType;
}
class CCheckDialogInput {
    // Construct an object performing the key-by-key input checking on an input form;
    // on a key-stroke check *all* fields and return the overall result.

    list: IDialogField[];  // the list of parameter-sets, each for checking a certain input field.
    constructor() {
        this.list = [] as IDialogField[];
    }
    addField(elementId: string, dT: SpecifDataType): void {
        // Add a parameter-set for checking an input field;
        // - 'elementId' is the id of the HTML input element
        // - 'dataType' is the dataType of the property
        this.list.push({ label: elementId, dataType: dT });
    };
    check(): boolean {
        // Perform tests on all registered input fields; is designed to be called on every key-stroke.
        let val: string, ok: boolean, allOk = true;
        this.list.forEach((cPs) => {
            // cPs holds the parameters for checking a single property resp. input field.
            // Get the input value:
            val = textValue(cPs.label);
            // Perform the test depending on the type:
            switch (cPs.dataType.type) {
                case XsDataType.String:
                    //    case 'xhtml':
                    ok = cPs.dataType.maxLength == undefined || val.length <= cPs.dataType.maxLength;
                    break;
                case XsDataType.Double:
                    ok = val.length < 1
                        || RE.Real(cPs.dataType.fractionDigits).test(val)
                        && !(typeof (cPs.dataType.minInclusive) == 'number' && parseFloat(val) < cPs.dataType.minInclusive)
                        && !(typeof (cPs.dataType.maxInclusive) == 'number' && parseFloat(val) > cPs.dataType.maxInclusive);
                    break;
                case XsDataType.Integer:
                    ok = val.length < 1
                        || RE.Integer.test(val)
                        && !(typeof (cPs.dataType.minInclusive) == 'number' && parseFloat(val) < cPs.dataType.minInclusive)
                        && !(typeof (cPs.dataType.maxInclusive) == 'number' && parseFloat(val) > cPs.dataType.maxInclusive);
                    break;
                case XsDataType.DateTime:
                    ok = val.length < 1 || LIB.isIsoDateTime(val);
                // no need to check enumeration
            };
            setTextState(cPs.label, ok ? 'has-success' : 'has-error');
            allOk = allOk && ok;
//            console.debug( 'CCheckDialogInput.check: ', cPs, val );
        });
        return allOk;
    }
}

// see: https://javascript.info/xmlhttprequest
class xhrMessage {
    status: number;
    statusText: string;
    responseType?: string;
    responseText?: string;
    constructor(st: number, sTxt: string, rTyp?: string, rTxt?: string) {
        this.status = st;
        this.statusText = sTxt;
        this.responseType = rTyp;
        this.responseText = rTxt;
    }
    asString():string {
        return this.statusText + " (" + this.status + (this.responseType == 'text' ? "): " + this.responseText : ")")
    }
    log() {
        console.log(this.asString());
        return this;  // make it chainable
    }
    warn() {
        console.warn(this.asString());
        return this;  // make it chainable
    }
}
/*LIB.logMsg = (xhr: xhrMessage): void =>{
    console.log(xhr.statusText + " (" + xhr.status + (xhr.responseType == 'text' ? "): " + xhr.responseText : ")"));
}*/
// standard error handler:
LIB.stdError = (xhr: xhrMessage, cb?:Function): void =>{
//    console.debug('stdError',xhr);
    // clone, as xhr.responseText ist read-only:
    let xhrCl = new xhrMessage(xhr.status, xhr.statusText, xhr.responseType, xhr.responseType=='text'? xhr.responseText : '');
    
    switch( xhr.status ) {
        case 0:
        case 200:
        case 201:
            return;
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
    /*    case 500:
            // avoid TypeError: setting getter-only property "responseText"
            message.show( Object.assign({}, xhr, { statusText = i18n.ErrInvalidData, responseText: '' }), {severity:'danger'});
        //    x.statusText = i18n.ErrInvalidData;
        //    x.responseText = '';
        //    message.show( x, {severity:'danger'} );
            break;
        case 996:  // server request queue flushed
            break;  
        case 995:  // server request timeout  
            // no break  */
        default:
            message.show( xhr );
    };
    xhrCl.log();
    if( typeof(cb)=='function' ) cb();
};
// standard message box:
 class CMessage {
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
                // remove any past message from the page, if the string is empty:
                this.hide();
                return;
            case 'object': 
                if( msg.status ) {
                    // msg is an jqXHR object:
                    if (!opts.severity) opts.severity = msg.status < 202 ? 'success' : 'danger';

                /*    msg = (msg.statusText || i18n.Error)
                        + " (" + msg.status
                        + ((msg.responseType == 'text' || typeof (msg.responseText) == 'string') && msg.responseText.length > 0 ?
                            "): " + msg.responseText : ")"); */

                    msg = (msg.statusText || i18n.Error)
                        + " (" + msg.status
                        + ( msg.responseText ? "): " + msg.responseText : ")");
                    break;  // the switch, not the if ;-)
                };
            default:
                console.error(msg, ' is an invalid message.');
                return;
        };
        // now, msg is definitively of type 'string'.

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

type SpecifItem = SpecifDataType | SpecifPropertyClass | SpecifResourceClass | SpecifStatementClass | SpecifResource | SpecifStatement | SpecifNode | SpecifFile;
type SpecifClass = SpecifDataType | SpecifPropertyClass | SpecifResourceClass | SpecifStatementClass;
type SpecIFItemWithNativeTitle = SpecifDataType | SpecifPropertyClass | SpecifResourceClass | SpecifStatementClass | SpecifNode | SpecifFile;
type SpecifInstance = SpecifResource | SpecifStatement;
LIB.isKey = (el: any): boolean => {
    return typeof (el) == 'object' && el.id;
}
LIB.keyOf = (itm: SpecifItem): SpecifKey => {
    // create a key from an item by selective cloning:
    return itm.revision ? { id: itm.id, revision: itm.revision } : { id: itm.id };
}
LIB.makeKey = (el: any): SpecifKey => {
    // create a key from an id string used in earlier SpecIF versions
    // and support the case where a full key has already been used:
    return typeof (el) == 'string' ? { id: el } : LIB.keyOf(el);
}
LIB.replacePrefix = (newPrefix: string, id: string) => {
    return id.replace(
        RE.isolatePrefix,
        // @ts-ignore - match and $1 must be present, even if not used.
        (match, $1, $2) => {
            return newPrefix + $2;
        }
    );
}
LIB.containsAllKeys = (refL: SpecifKeys, newL: SpecifKeys): boolean => {
    // return true, if all elements of newL are contained in refL;
    // sequence does not matter:
    if (Array.isArray(refL) && Array.isArray(newL)) {
        // first a quick check:
        if (refL.length < newL.length)
            return false;
        // then a full check:
        for (var nE of newL)
            if (LIB.indexByKey(refL, nE) < 0) return false;
        return true;
    };
    throw Error("Both input parameters must be an array.");
}
LIB.equalKey = (refE: any, newE: any): boolean => {
    // Return true if both keys are equivalent;
    // this applies if only an id is given or a key with id and revision:
    return refE.id == newE.id && refE.revision == newE.revision;
}
LIB.equalKeyL = (refL: any[], newL: any[]): boolean => {
    // return true, if both lists have equal members:
    // no or empty lists are allowed and considerated equal:
    let rArr = Array.isArray(refL) && refL.length > 0,
        nArr = Array.isArray(newL) && newL.length > 0;
    if (!rArr && !nArr) return true;
    if (!rArr && nArr
        || rArr && !nArr
        || refL.length != newL.length) return false;
    // the sequence may differ:
    return LIB.containsAllKeys(refL,newL);
}
LIB.equalValue = (refV: SpecifValue, newV: SpecifValue): boolean => {
    // Return true if both values are equivalent:
    if (typeof (refV) != typeof (newV)) return false;
    if (LIB.isString(refV))
        return refV == newV;
    if (LIB.isMultiLanguageValue(refV))
        // @ts-ignore - these attributes are defined with SpecifMultiLanguageText
        return refV.text == newV.text && refV.language == newV.language && refV.format == newV.format;
    return false;
}
LIB.equalValues = (refVL: SpecifValues, newVL: SpecifValues): boolean => {
    // Return true if both value lists are equivalent;
    // sequence matters:
    if (refVL.length != newVL.length) return false;
    for (var i = newVL.length - 1; i > -1; i--)
        if (!LIB.equalValue(refVL[i], newVL[i])) return false;
    return true;
}
LIB.equalBoolean = (rB: boolean, nB: boolean): boolean => {
    return (rB && nB || !rB && !nB);
}
LIB.equalDT = (refE: SpecifDataType, newE: SpecifDataType): boolean =>{
    // return true, if reference and new dataType are equal:
    if (refE.type != newE.type) return false;
    // Perhaps we must also look at the title ..
    switch (refE.type) {
        case XsDataType.Double:
            if (refE.fractionDigits != newE.fractionDigits) return false;
            // no break;
        case XsDataType.Integer:
            if (refE.minInclusive != newE.minInclusive || refE.maxInclusive != newE.maxInclusive) return false;
            break;
        case XsDataType.String:
            if (refE.maxLength != newE.maxLength) return false;
    };
    if (!Array.isArray(refE.enumeration) && !Array.isArray(newE.enumeration)) return true;
    if (Array.isArray(refE.enumeration) != Array.isArray(newE.enumeration)
        || refE.enumeration.length != newE.enumeration.length) return false;
    // refE and newE have a property 'enumeration' with equal length:
    for (var i = newE.enumeration.length - 1; i > -1; i--) {
        // assuming that the values don't matter:
        if (LIB.indexById(refE.enumeration, newE.enumeration[i].id) < 0) return false;
    };
    // the list of enumerated values *is* equal,
    // finally the multiple flag must be equal:
    return LIB.equalBoolean(refE.multiple, newE.multiple)
}
LIB.equalPC = (refE: SpecifPropertyClass, newE: SpecifPropertyClass): boolean =>{
    // return true, if reference and new propertyClass are equal.

    // In Archimate export from ADOIT it may happen, that there are more than 1 propertyDefinitions
    // with the same data type and name are used by the same resourceClass --> Avoid deduplication.

    // Default values must also be congruent:
    if (Array.isArray(refE.values) != Array.isArray(newE.values)) return false;
    return refE.title == newE.title
        && LIB.equalKey(refE.dataType, newE.dataType)
        && (!Array.isArray(refE.values) && !Array.isArray(newE.values)
            || LIB.equalValues(refE.values, newE.values))
        && LIB.equalBoolean(refE.multiple, newE.multiple);
}
LIB.equalRC = (refE: SpecifResourceClass, newE: SpecifResourceClass): boolean =>{
    // return true, if reference and new resourceClass are equal:
    return refE.title == newE.title
        && LIB.equalBoolean(refE.isHeading, newE.isHeading)
        && LIB.equalKeyL(refE.propertyClasses, newE.propertyClasses)
    //	&& LIB.equalKeyL( refE.instantiation, newE.instantiation )
    // --> the instantiation setting of the reference shall prevail
}
LIB.equalSC = (refE: SpecifStatementClass, newE: SpecifStatementClass): boolean =>{
    // return true, if reference and new statementClass are equal:
    return refE.title == newE.title
        && LIB.equalKeyL(refE.propertyClasses, newE.propertyClasses)
        && eqSCL(refE.subjectClasses, newE.subjectClasses)
        && eqSCL(refE.objectClasses, newE.objectClasses)
        && LIB.isEqualStringL(refE.instantiation, newE.instantiation);

    function eqSCL(rL: any, nL: any): boolean {
        //			console.debug('eqSCL',rL,nL);
        // return true, if both lists have equal members,
        // in this case we allow also less specified statementClasses
        // (for example, when a statement is created from an Excel sheet):
        if (!Array.isArray(nL)) return true;
        // no or empty lists are allowed and considerated equal:
        return LIB.equalKeyL(rL, nL);
        /*	let rArr = Array.isArray(rL) && rL.length > 0,
                nArr = Array.isArray(nL) && nL.length > 0;
            if (!rArr && nArr
                || rL.length != nL.length) return false;
            // the sequence may differ:
            for (var i = rL.length - 1; i > -1; i--)
                if (LIB.indexByKey(nL, rL[i]) < 0) return false;
            return true; */
    }
}

LIB.isString = (el: any): boolean => {
    return typeof (el) == 'string';
}
LIB.isIsoDateTime = (val: string): boolean => {
    return RE.IsoDateTime.test(val);
/*    To do this, checker must be loaded at initialization time;
 *    // in fact this is too restrictive, as right-truncated data is not accepted.
    return checker.checkSchema(
        { value: val },
        {
            schema: {
                "$id": "https://specif.de/v1.1/dateTime/schema#",
                "$schema": "http://json-schema.org/draft-04/schema#",
            //    "$schema": "https://json-schema.org/draft/2019-09/schema#",
                "type": "object",
                "properties": {
                    "value": { "type": "string", "format": "date-time" }
                }
            }
        }
    ).status > 0 */
}
LIB.isEqualStringL = (refL: any[], newL: any[]): boolean => {
        // return true, if both lists have equal members:
        // no or empty lists are allowed and considerated equal:
        let rArr = Array.isArray(refL) && refL.length > 0,
            nArr = Array.isArray(newL) && newL.length > 0;
        if (!rArr && !nArr) return true;
        if (!rArr && nArr
            || rArr && !nArr
            || refL.length != newL.length) return false;
        // the sequence may differ:
        for (var lE of refL )
            if (newL.indexOf(lE) < 0) return false;
        return true;
}
/* Not yet readily developed:
interface IClassifiedProperties {
    title: CPropertyToShow;
    descriptions: CPropertyToShow[];
    other: CPropertyToShow[];
}
LIB.classifyProperties = (el: SpecifResource, data: SpecIF): void => {
    let clPr: IClassifiedProperties,
        rC = LIB.itemByKey(data.resourceClasses, el['class']); this.selPrj.readExtendedClasses("resourceClass", [el['class']])[0] as SpecifResourceClass

    // Initially all properties are stored in data.other;
    // further down the title and description properties are identified and moved:
    // create a new list by copying the elements (do not copy the list ;-):
    clPr.other = el.properties.map( (p: SpecifProperty) => { return new CPropertyToShow(p, rC) });

	// Now, all properties are listed in data.other;
	// in the following, the properties used as title and description will be identified
	// and moved from data.other to data.title resp. data.descriptions:

    // a) Find and set the configured title:
    let a = LIB.titleIdx(data.other, data.propertyClasses);
    if (a > -1) {  // found!
        // .. in case of a title a single value is expected, so select it:
        data.title = data.other.splice(a, 1)[0];
    //	}
//  else {
        // In certain cases (SpecIF hierarchy root, comment or ReqIF export),
        // there is no title propertyClass;
        // then create a property without class.
        // If the instance is a statement, a title is optional, so it is only created for resources (ToDo):
        // @ts-ignore - 'class' is omitted on purpose to indicate that it is an 'artificial' value
//      data.title = { title: CONFIG.propClassTitle, value: el.title || '' };
    };

    // b) Check the configured descriptions:
    // We must iterate backwards, because we alter the list of other.
    data.descriptions = [];
    for (a = data.other.length - 1; a > -1; a--) {
        // to decide whether it is a description, use the original title of the resp. propertyClass
        if (CONFIG.descProperties.includes(data.other[a].title)) {
            // To keep the original order of the properties, the unshift() method is used.
            data.descriptions.unshift(data.other.splice(a, 1)[0]);
        }
    };
    return clPr;
} */

LIB.hasContent = (pV: string): boolean => {
    // must be a string with the value of the selected language.
    if (typeof (pV) != "string"
        || /^.{0,2}(?:no entry|empty).{0,2}$/.test(pV.toLowerCase())
    ) return false;
    return pV.stripHTML().length > 0
        || RE.tagSingleObject.test(pV) // covers nested object tags, as well
        || RE.tagImg.test(pV)
        || RE.tagA.test(pV)
}
LIB.isMultiLanguageValue = (L: any[]): boolean => {
    if (Array.isArray(L)) {
        let hasMultipleLanguages = L.length > 1;
        for (var i = L.length - 1; i > -1; i--) {
            let lE = L[i];
            // SpecifMultilanguageText is a list of objects {text:"the text value", language:"IETF language tag"}.
            // If there are multiple language values, all except the first (=default) must have a language property:
            if (typeof (lE["text"]) != "string" || (hasMultipleLanguages && i>0 && (typeof (lE.language) != "string" || lE.language.length < 2)))
                return false;
        };
        return true;
    };
    return false;
}
LIB.multiLanguageValueHasContent = (L: any[]): boolean => {
    return L && L.length > 0 && LIB.isMultiLanguageValue(L) && LIB.hasContent(L[0]["text"]);
}
LIB.makeMultiLanguageValue = (el: any, opts?: any): SpecifMultiLanguageText => {
    if (typeof (el) == 'string') {
        return opts && opts.language ? [{ text: el, language: opts.language }] : [{ text: el }];
    };
    return  LIB.isMultiLanguageValue( el )? el : undefined;
}
LIB.languageValueOf = (val: SpecifMultiLanguageText, opts?: any): SpecifLanguageText | undefined => {
    // Return the language value in the specified target language .. or the first value in the list by default.

    if (!LIB.isMultiLanguageValue(val)) {
        console.error("Value must be a multi-language text: ",val);
        throw Error("Programming Error: Value must be a multi-language text.")
    };

    // ... is a multiLanguageText, but may be empty:
    if (val.length < 1) return;

    let lVs = val.filter((v: any): boolean => {
        return v.language && opts && opts.targetLanguage.toLowerCase() == v.language.toLowerCase();
    });
    // lVs should have none or one elements; any additional ones are simply ignored:
    if (lVs.length > 0) return lVs[0];

    // next try a little less stringently:
    lVs = val.filter((v: any): boolean => {
        return v.language && opts && opts.targetLanguage && opts.targetLanguage.slice(0, 2).toLowerCase() == v.language.slice(0, 2).toLowerCase();
    });
    // lVs should have none or one elements; any additional ones are simply ignored:
    if (lVs.length > 0) return lVs[0];

    if (opts && opts.dontReturnDefaultValue)
        return;

    // As a final resourt take the first element in the original list of values:
    return val[0]
}
LIB.languageTextOf = (val: SpecifMultiLanguageText, opts?: any): SpecifMultiLanguageText | string => {
    // Return the text in the specified target language .. or in the first value in the list by default.

    // if opts.targetLanguage is undefined, keep all language options:
    if (!opts || !opts.targetLanguage) return val;

    let langV = LIB.languageValueOf(val, opts);
    return (langV ? langV['text'] : '');
}
LIB.selectTargetLanguage = (val: SpecifMultiLanguageText, opts?: any): SpecifMultiLanguageText | undefined => {
    // if opts.targetLanguage is defined, create a multilanguageText with the selected language, only:
    return LIB.makeMultiLanguageValue(LIB.languageTextOf(val, opts), opts)
}
LIB.displayValueOf = (val: SpecifValue, opts?: any): string => {
    // for display, any vocabulary term is translated to the selected language;
    // a lookup is only necessary for values of dataType xs:string, which is always a multiLanguageText:
    if (LIB.isMultiLanguageValue(val)) {
        let v = LIB.languageTextOf(val, opts);
        if (opts.lookupValues) v = app.ontology.localize(v,opts);
        return opts.stripHTML ? v.stripHTML() : v
    };
    return val as string
}
LIB.valuesByTitle = (itm: SpecifInstance, pNs: string[], dta: SpecIF | CSpecIF | CCache): SpecifValues => {
    // Return the values of all resource's (or statement's) properties with a title listed in pNs;
    // replace references to enumerated values by the corresponding values:
    // ToDo: return the class's default value, if available.
//    console.debug('valuesByTitle',dta,itm,pN);
    let valL: SpecifValues = [];
    if (itm.properties) {
        let dT: SpecifDataType,
            pC: SpecifPropertyClass;
        for (var p of itm.properties) {
            pC = LIB.itemByKey(dta.propertyClasses, p['class']);
            for (var pN of pNs) {
                if (pC && pC.title==pN) {
                    dT = LIB.itemByKey(dta.dataTypes, pC.dataType) as SpecifDataType;
                    if (dT) {
                        valL = valL.concat( dT.enumeration ?
                            p.values.map((v) => { return LIB.itemById(dT.enumeration, v).value })
                            : p.values
                        )
                    }
                }
            }
        }
    };
    return valL;
}
LIB.valueByTitle = (el: SpecifInstance, ti: string, dta: SpecIF | CSpecIF | CCache, opts?:any): string => {
    // Return the first value of el's property with title ti:
    let lOpts = Object.assign( { targetLanguage: 'default' }, opts ),
        pVL = LIB.valuesByTitle(el, [ti], dta);
    return pVL.length > 0 ? LIB.displayValueOf(pVL[0], lOpts) : undefined;
}
LIB.enumeratedValuesOf = (dTk: SpecifDataType|SpecifKey, dta?:SpecIF):string[] => {
    // List the enumerated values of a dataType.
    // - If a fully specified dataType is handed in, take it.
    // - Otherwise look it up from the list of dataTypes.
    // @ts-ignore - when dTk.type exists, it is assumed that dTk is a fully specified dataType
    var dT = dTk.type ? dTk : LIB.itemByKey((dta ? dta.dataTypes : app.projects.selected.cache.get('dataType', app.projects.selected.dataTypes)), dTk),
        oL = [];
    if (dT.enumeration)
        for (var v of dT.enumeration) {
            oL.push(LIB.languageTextOf(v.value, { targetLanguage: 'default' }));
        };
    return oL;
}
LIB.mostRecent = (L: SpecifItem[], k: SpecifKey): SpecifItem => {
    // call indexByKey without revision to get the most recent revision:
    return L[LIB.indexByKey(L, { id: k.id })];
}
LIB.duplicateId = (dta: any, id: string): boolean => {
    // check whether there is an item with the same id in dta:
    if (dta.id == id) return true;
    for (var i in dta) {
        if (Array.isArray(dta[i])) {
            for (var j = dta[i].length - 1; j > -1; j--) {
                if (LIB.duplicateId(dta[i][j], id)) return true;
            };
        };
    };
    return false;
}
LIB.indexBy = (L: any[], p: string, k: SpecifKey | string): number => {
    if (L && p && k) {
        // Return the index of an element in list 'L' whose property 'p' is referenced by key 'k':
        // ToDo: true, only if n is the *latest* revision in case k.revision is undefined ...
        for (var i = L.length - 1; i > -1; i--)
            if (LIB.isKey(k) ? LIB.references(k, L[i][p]) : L[i][p] == k)
                return i; // return list index
    };
    return -1;
};
LIB.itemBy = (L: any[], p: string, k: SpecifKey | string): any => {
    if (L && p && k) {
        // Return the element in list 'L' whose property 'p' equals key 'k' od id 'k' (in case of a string):
        // ToDo: true, only if n is the *latest* revision in case k.revision is undefined ...
        for (var l of L)
            if (LIB.isKey(k) ? LIB.references(k, l[p]) : l[p] == k)
                return l; // return list item
    };
};
/* LIB.indexBy = (L: any[], p: string, st: string): number => {
    if (L && p && st ) {
        // given a title of an item in a list, return it's index:
        for( var i=L.length-1;i>-1;i-- )
            if( L[i][p]==st ) return i   // return list index
    };
    return -1;
}
LIB.itemBy = (L: any[], p: string, st: string): any => {
    if (L && p && st) {
        // given a title of an item in a list, return the item itself:
        for (var l of L)
            if (l[p] == st) return l;   // return list item
    }
    // else return undefined
}*/
LIB.indexById = (L:any[],id:string):number => {
    if( L && id ) {
        // given an ID of an item in a list, return it's index:
        id = id.trim();
        for( var i=L.length-1;i>-1;i-- )
            if( L[i].id==id ) return i   // return list index 
    };
    return -1;
}
LIB.itemById = (L:any[],id:string):any => {
//    console.debug('+',L,id,(L && id));
    if( L && id ) {
        // given the ID of an item in a list, return the item itself:
        id = id.trim();
        for( var i=L.length-1;i>-1;i-- )
            if( L[i].id==id ) return L[i]   // return list item
    }
}
/*LIB.indexByTitle = (L: SpecIFItemWithNativeTitle[],ti:string):number => {
    if( L && ti ) {
        // given a title of an item in a list, return it's index:
        for( var i=L.length-1;i>-1;i-- )
            if( L[i].title==ti ) return i   // return list index
    };
    return -1;
} */
LIB.itemByTitle = (L: SpecIFItemWithNativeTitle[],ti:string):any => {
    if( L && ti ) {
        // given a title of an item in a list, return the item itself:
        for( var l of L )
            if( l.title==ti ) return l;   // return list item
    }
    // else return undefined
}
LIB.indexByKey = (L: SpecifItem[], k: SpecifKey): number => {
    // Return the index of item in L referenced by key k:
    //  - If an item in list (L) has no specified revision, a reference key may not specify a revision.
    //  - If L has multiple elements with same id, where one of them has no revision, indexByKey cannot identify a unique item.
    //  - If k has no revision, the item in L having the latest revision (not 'replaced' by any other) applies.
    //  - If there are >1 latest revisions (>1 branches), the more recent one prevails (ToDo: acceptable rule ??)
    //  - If k has a revision, the item in L having an an equal or the next lower revision applies.
    //  - The uniqueness of keys has been checked, before.
    // Note that referenceIndex does the inverse: it returns the index of the list item which is referencing k.

    // Find all items with the same id:
    let itemsWithEqId = LIB.forAll(
        // filter the input list and add the index to the elements;
        // add index without changing L and it's items:
        L,
        (e: SpecifItem, i: number) => {
            if (e.id == k.id)
                return { idx: i, rev: e.revision, chAt: e.changedAt }
        }
    );
    if (itemsWithEqId.length < 1) return -1; // no element with the specified id

    if (itemsWithEqId.length == 1) {
        if (!k.revision || itemsWithEqId[0].rev == k.revision)
            return itemsWithEqId[0].idx
        else
            return -1; // revisions don't match (this should not occur)
    };

    // itemsWithEqId.length is >1.
    for (let itm of itemsWithEqId) {
        // this constraint has been checked during import, but let us ckeck again to detect any error which may have happened, since:
        if( !itm.rev )
            console.error("Item with id '" + k.id + "' occurs more than once, where at least one does not have a specified revision.");
    };

    if (k.revision) {
        // Find the element with equal revision:
        let itemsWithEqRev = itemsWithEqId.filter((e: any) => { return e.rev == k.revision });
        if (itemsWithEqRev.length < 1) return -1;  // there is no element with the requested revision
        if (itemsWithEqRev.length == 1) return itemsWithEqRev[0].idx;
        throw Error("There are >1 items with the same id '" + k.id + "' and revision '" + k.revision + "'.");
    }
    else {
        // Look for the latest revision in itemsWithEqId;
        // expected is a single revision which is not replaced by another:

        // Get a list with all those items which are not replaced by another:
        let itemsNotReplaced = itemsWithEqId.filter(
            (i: any) => {
                for (let itm of itemsWithEqId) {
                    if (Array.isArray(L[itm.idx].replaces) && L[itm.idx].replaces.includes(i.rev))
                        return false;
                }
                return true;
            }
        );
        if (itemsNotReplaced.length == 1)
            return itemsNotReplaced[0].idx; // the newest revision of a single branch
        if (itemsNotReplaced.length < 1)
            throw Error("There is a cyclic reference within " + JSON.stringify(L) + "'.");

        console.info("There are multiple branches; no item returned for " + JSON.stringify(k) + ".");
        return -1;  // could not determine the newest revision
    };

/*
    if (itemsWithEqId.length == 1 && !itemsWithEqId[0].rev) {
        // a single item without revision has been found:
        if (k.revision) return -1; // revisions don't match (this should not occur)
        return itemsWithEqId[0].idx // both the found element and the key have no revision
    };
    // The elements in itemsWithEqId have a revision:
    // If there are more than one and the constraint checker was happy, they must have a revision.
    if (k.revision) {
        // Find the element with equal revision:
        let itemsWithEqRev = itemsWithEqId.filter((e: any) => { return e.rev == k.revision });
        // With the project data being constraint checked, itemsWithEqRev.length can be 0 or 1:
        if (itemsWithEqRev.length < 1) return -1;  // there is no element with the requested revision
        if (itemsWithEqRev.length < 2) return itemsWithEqRev[0].idx;
        throw Error("There are >1 items with the same id '" + k.id + "' and revision '" + k.revision + "'.");
    };

    // The key has no revision and so the latest shall be returned.
    // Sort revisions in the order of creation; the latest first:
    itemsWithEqId.sort((laurel: any, hardy: any) => { return hardy.changedAt - laurel.changedAt });
    return itemsWithEqId[0].idx; // return the index of the latest revision */
}
LIB.itemByKey = (L: SpecifItem[], k: SpecifKey): any => {
    // Return the item in L with key k 
    let i = LIB.indexByKey(L, k);
    if (i > -1) return L[i]; // return the latest revision
    //    return undefined
}
LIB.references = (n: SpecifKey, k: SpecifKey): boolean => {
    // true, if n references k.
    return LIB.isKey(k) && LIB.isKey(n) && k.id == n.id && (!n.revision || k.revision == n.revision);
    // ToDo: in case n.revision is undefined, the result shall be true only if n is the *newest* revision
}
LIB.referenceIndex = (L: SpecifKeys, k: SpecifKey): number => {
    // return the index of the item in L referencing k.
    // Note that indexByKey does the inverse: it returns the index of the list item which is referenced by k.
    for (var i = L.length-1; i > -1; i--)
        if (LIB.references(L[i], k)) return i;
    return -1;
}
/* LIB.referenceItem = (N: SpecifKeys, k: SpecifKey): number => {
    // return the item in N referencing k.
    let i = LIB.referenceIndex(N, k);
    if (i > -1) return N[i]; // return the latest revision
    //    return undefined
} */
LIB.referenceIndexBy = (L: any[], p: string, k: SpecifKey) => {
    // return the index of the item in L whose property p is referencing k.
    if (L && p && k) {
        for (var i = L.length - 1; i > -1; i--)
            if (LIB.references(L[i][p], k)) return i;
    };
    return -1;
};
LIB.referenceItemBy = (L: any[], p: string, k: SpecifKey) => {
    // return the item in L whose property p is referencing k.
    let i = LIB.referenceIndexBy(L, p, k);
    //    console.debug('##',L,p,k,i);
    if (i > -1) return L[i];
    //    return undefined
};
LIB.containsById = (cL:any[], L: SpecifItem|SpecifItem[] ):boolean =>{
    if (!cL || !L) throw Error("Missing Input Parameter");
    // return true, if all items in L are contained in cL (cachedList),
    // where L may be an array or a single item:
    return Array.isArray(L)?containsL( cL, L ):LIB.indexById( cL, L.id )>-1;

    function containsL(cL:any[], L: SpecifItem[] ):boolean {
        for( var i=L.length-1;i>-1;i-- )
            if ( LIB.indexById( cL, L[i].id )<0 ) return false;
        return true;
    }
} 
/* LIB.containsByTitle = (cL:any[], L: SpecifItem[] ):boolean =>{
    if (!cL || !L) throw Error("Missing Array");
    // return true, if all items in L are contained in cL (cachedList):
    return Array.isArray(L)?containsL( cL, L ):( indexByTitle( cL, L.title )>-1 );
    
    function containsL(cL: SpecifItem[], L: SpecifItem[] ):boolean {
        for( var i=L.length-1;i>-1;i-- )
            if ( indexByTitle( cL, L[i].title )<0 ) return false;
        return true;
    }
} */
LIB.containsAllStrings = (refL: string[], newL: string[]): boolean => {
    for (var i = newL.length - 1; i > -1; i--)
        if (refL.indexOf(newL[i]) < 0) return false;
    return true;
}
LIB.addPCReference = (eC: SpecifResourceClass | SpecifStatementClass, key: SpecifKey): void => {
    // Add the propertyClass-id to an element class (eC), if not yet defined:
    if (Array.isArray(eC.propertyClasses)) {
        // Avoid duplicates:
        if (LIB.indexById(eC.propertyClasses, key.id) < 0
            || LIB.indexByKey(eC.propertyClasses, key) < 0)
            eC.propertyClasses.unshift(key);
        // else: reference with equal id and revision is already present.
    }
    else {
        eC.propertyClasses = [key];
    }
}
LIB.addProp = (el: SpecifResource | SpecifStatement, prp: SpecifProperty): void => {
    // Add the property to an element (el):
    if (Array.isArray(el.properties))
        el.properties.unshift(prp);
    else
        el.properties = [prp];
};
LIB.addClassesTo = (term: string, dta: SpecIF): SpecifClass | undefined => {
    // Add an element (e.g. class) to it's list, if not yet defined:
    // ToDo: Check for revision! It can happen that a class is considered available, but a reference with revision fails.

    // 1. Get the class corresponding to the term plus all required ones:
    // @ts-ignore - yes, the result can be undefined:
    let items = app.ontology.generateSpecifClasses({ terms: [term], delta: true, referencesWithoutRevision: true /*, adoptOntologyDataTypes: true */ }),
        item: SpecifClass;
    console.debug("Adding classes for '" + term + "':", items);

    // ToDo: For avoiding duplicates, the checking for the id is not sufficient;
    // if the existing element has an equal id, but different content,
    // the resulting SpecIF data-set is not consistent.

    // 2. Create it, if not yet available:
    for (var Ln of ['dataTypes', 'propertyClasses', 'resourceClasses', 'statementClasses']) {
        // add the type, but avoid duplicates:
        // @ts-ignore - index is ok:
        LIB.cacheL(dta[Ln], items[Ln]);

        // obtain the requested class;
        // there should be exactly one element in 'items':
        let idx = LIB.indexBy(dta[Ln], 'title', term);
        if (idx > -1)
            item = dta[Ln][idx];
    };
    if (!item)
        console.error('No class found for term ' + term + '.');
    return item;
};
LIB.getClassesWithParents = (L: SpecifClass[], clK: SpecifKey) => {
    // Return a list with classes, the ancestors first and the requested class last.
    // Applies to resourceClasses and statementClasses;
    // classes are always cached, so there is no need for a call with promise.
    let resL: SpecifClass[] = [],
        cK = simpleClone(clK);  // avoid side-effect in calling routine
    do {
        let c = LIB.itemByKey(L, cK);
        if (c) {
            // The propoerties of the extending (parent's) class first:
            // @ts-ignore - checking for extends, because it doesn't exist on all elements
            cK = c['extends'];
            resL.unshift(c);
        }
        else {
        //    console.error('Programming Error: Did not find extending class ' + cK.id);
        //    cK = undefined;
            throw Error('Did not find extending class ' + cK.id);
        };
    } while (cK);
    return resL;
}
LIB.getExtendedClasses = (cL: SpecifClass[], toGet: SpecifKeys) => {
    // Applies to resourceClasses and statementClasses;
    // classes are always cached, so there is no need for a call with promise.
    let resL: any = [];
    for (var clk of toGet) {
        resL.push(extendClass(clk))
    };
    return resL;

    function extendClass(k: SpecifKey) {
        let rC: any = {};
        LIB.getClassesWithParents(cL, k)
            // A list with classes is returned, the ancestors first and the requested class last.
            // - Starting with most general, copy to and potentially overwrite the attributes of rC
            // - Also the list of eligible subjectClasses and objectClasses are overwritten,
            //   because it is assumed that more specialized statementClasses have fewer eligible subjectClasses and objectClasses
            // - Just the propertyClasses are collected along the line of ancestors ... as usual in object oriented programming.
            .forEach(
                (c: SpecifItem) => {
                    for (let att in c) {
                        //	if (["propertyClasses", "subjectClasses", "objectClasses"].includes(att) && Array.isArray(c[att]) && Array.isArray(rC[att]))
                        // @ts-ignore - indexing an object with a string is perfectly OK
                        if (["propertyClasses"].includes(att) && Array.isArray(c[att]) && Array.isArray(rC[att]))
                            // @ts-ignore - indexing an object with a string is perfectly OK
                            LIB.cacheL(rC[att], c[att])
                        else
                            // @ts-ignore - indexing an object with a string is perfectly OK
                            rC[att] = c[att]
                    }
                }
            );
        delete rC['extends'];
        return rC
    }
}

LIB.cmp = (i: string, a: string): number => {
    if( !i ) return -1;
    if( !a ) return 1;
    i = i.toLowerCase();
    a = a.toLowerCase();
    return i==a? 0 : (i<a? -1 : 1);
}
LIB.sortByTitle = ( L:any ):void =>{
    L.sort( 
        (bim:any,bam:any)=>{ return LIB.cmp( bim.title, bam.title ) }
    )
}
LIB.sortBy = ( L:any[], fn:(arg0:object)=>string ):void =>{
    L.sort( 
        (bim, bam) => { return LIB.cmp( fn(bim), fn(bam) ) }
    )
}
LIB.forAll = ( L:any[], fn:(el:any,idx:number)=>any ):any[] =>{
    // return a new list with the results from applying the specified function to all items of input list L;
    // differences when compared to Array.map():
    // - tolerates missing L
    // - appends not only items, but also lists (if the supplied function returns a list)
    // - suppresses undefined list items in the result, so in effect forAll is a combination of .map() and .filter().
    if(!L) return [];
    var nL:any[] = [];
    L.forEach((el, idx) => { 
		var r = fn(el, idx); 
		if (r) {
			if(Array.isArray(r))
			//	nL = nL.concat(r)
                nL.push(...r)
			else
				nL.push(r);
		};
	});
    return nL;
}

// Add a leading icon to a title:
// use only for display, don't add to stored variables.
LIB.addIcon = (str: string, ic: string): string =>{
    if (ic) return ic + '&#xa0;' + str;
    return str;
}
LIB.cacheE = ( L:Array<any>, e:any ):number =>{  // ( list, entry )
    // add or update the item e in a list L,
    // where the list can have string elements or objects with id:
    let n = typeof (e) == 'string' ? L.indexOf(e) : LIB.indexById(L, e.id);
    if (e.predecessor) {
        let p = typeof (e.predecessor) == 'string' ? L.indexOf(e.predecessor) : LIB.indexById(L, e.predecessor.id);
        delete e.predecessor;
        if (p > -1) {
            // predecessor found; 
            // move or insert the element:
            if (n > -1)
                L.splice(n, 1);
            L.splice(p + 1, 0, e);
            return p + 1;
        }
    };
    if (n > -1) {
        L[n] = e;
        return n;
    }
    else
        L.push(e);
    return L.length - 1;

/*    let n = typeof (e)=='string' ? L.indexOf(e) : LIB.indexById( L, e.id );
    // add, if not yet listed:
    if (n < 0) {
        // insert. if not found:
        if (e.predecessor) {
            n = typeof (e.predecessor) == 'string' ? L.indexOf(e.predecessor) : LIB.indexById(L, e.predecessor.id);
            delete e.predecessor;
            if (n > -1) {
                L.splice(n + 1, 0, e);
                return n+1;
            }
        };
        L.push(e);
        return L.length - 1;
    };
    // update, if found:
    L[n] = e;
    return n; */
}
LIB.cacheL = ( L:Array<any>, es:Array<any> ):boolean =>{  // ( list, entries )
    // add or update the items es in a list L:
    for (var e of es)
        LIB.cacheE(L, e);
    // this operation cannot fail:
    return true;
}
LIB.uncacheE = ( L:Array<any>, e:any ):number =>{  // ( list, entry )
    // remove the item e from a list L:
    let n = LIB.isKey(e)? LIB.indexByKey( L, e ) : L.indexOf(e);
    if( n>-1 ) L.splice(n,1);  // remove, if found
    return n;
}
LIB.uncacheL = ( L:Array<any>, es:Array<any> ):boolean =>{  // ( list, entries )
    // remove the items es from a list L:
    let ok = true;
    es.forEach((e) => { ok = ok && LIB.uncacheE(L, e) > -1 });
    return ok;
}
    
// http://stackoverflow.com/questions/10726909/random-alpha-numeric-string-in-javascript
LIB.genID = (pfx?:string):string =>{
    if( !pfx || pfx.length<1 ) { pfx = 'ID_' };
    if( !RE.Id.test(pfx) ) { pfx = '_'+pfx };   // prefix must begin with a letter or '_'
    
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
    toJsId: Function;
    toSpecifId: Function;
    toCamelCase: Function;
    linkifyURLs: Function;
    ctrl2HTML: Function;
    stripHTML: Function;
    stripCtrl: Function;
    makeHTML: Function;
    escapeRE: Function;
    escapeJSON: Function;
    unescapeJSON: Function;
    escapeXML: Function;
    escapeHTML: Function;
    escapeHTMLTags: Function;
    escapeHTMLEntities: Function;
    unescapeHTMLTags: Function;
    unescapeHTMLEntities: Function;
    fileName: Function;
    baseName: Function;
    fileExt: Function;
}
String.prototype.toCamelCase = function() {
    let str = this.replace(/[^a-z\d \:\.]/ig, ''), parts, res = '';
    // Check for separators in the sequence of priority:
    if (str.includes(':'))
        parts = str.split(':')
    else if (str.includes('.'))
        parts = str.split('.')
    else if (str.includes(' '))
        parts = str.split(' ')
    else if (str.includes('-'))
        parts = str.split('-')
    else if (str.includes('_'))
        parts = str.split('_')
    else
        return this;

    for (let p of parts) {
        p = p.replace(/[ _\-\.]/g, ''); // remove any other separator (which shouldn't be there, but to tolerate any meaningless user input)
        for (let i = 0, I = p.length; i < I; i++) res += i == 0 ? p[i].toUpperCase() : p[i].toLowerCase();
    };
    return res
/*// see: https://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case
    return this
//        .replace(/[^a-z ]/ig, '')
        .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
            if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
            return index === 0 ? match.toLowerCase() : match.toUpperCase();
        }
    ); */
};
// Make a valid js variable/property name; replace disallowed characters by '_':
String.prototype.toJsId = function():string {
    return this.replace( /[-:\.\,\s\(\)\[\]\/\\#�%]/g, '_' );
};
// Make an id conforming with SpecIF v1.0+:
// ToDo: Check ReqIF compatibility
String.prototype.toSpecifId = function (): string {
    // Mirror the pattern for SpecifId defined in schema.json
    return (/[^_a-zA-Z]/.test(this[0]) ? '_' : '') + this.replace( /[^_a-zA-Z\d.-]/g, '_' );
};
/*
function truncate(l:number):string {
    var t = this.substring(0,l-1);
//    if( t.length<this.length ) t += '&#8230;'; // &hellip;, i.e.three dots
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
    return $("<dummy/>").html(this as string).text().trim() || '';
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
    return this.replace( /\n|\r|\t|\b|\f|\v/g, '' );
//  return str.replace(/[\u0009\u000a\u000c]|\n|\r|\t|\b|\f|\v/g, '');
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
        //    .replace(/(?:<<|&lt;&lt;)/g, '&#xAB;')   // &laquo;
        //    .replace(/(?:>>|&gt;&gt;)/g, '&#xBB;')  // &raquo;
            .replace(/--(?:&gt;|>)/g, '&#8594;')   // &rarr;
            .replace(/(?:&lt;|<)--/g, '&#8592;')  // &larr;
            .replace(/(?:&reg|\(R\))/g, '&#174;')  // registered;
            .replace(/(?:&copy|\(C\))/g, '&#169;');  // copyright;
        /*    // Dont't convert markdown, if the text begins and ends with a XHTML tag:
            if( /^\s*<.+>\s*$/.test(str) )
                return newS; */
        // @ts-ignore - 'window.markdown' is defined, if loaded
        if (CONFIG.convertMarkdown && window.markdown) {
            // don't interpret the '+' as list item, but do so with '�' and '•',
            // transform arrows assembled by characters to special arrow characters:
            // @ts-ignore - 'window.markdown' is defined, if loaded
            return window.markdown.render(
                newS
                .replace(/\+ /g, '&#x2b; ') // don't transform '+' to list item
            //    .replace(/� /g, '* ')
                .replace(/• /g, '* ')
            );
        };
        return '<div>' + newS.ctrl2HTML() + '</div>';
    };
    return this as string;
} 

/**
 * Convert all forbidden chars to html unicode
 * @param str String to be checked
 * @returns {string} cleaned string
 */
/* String.prototype.utf8ToXmlChar = function():string {
    let i = this.length,
        aRet = [];
    while (i--) {
        let iC = this[i].charCodeAt(0);
        if (iC < 65 || iC > 127 || (iC > 90 && iC < 97)) aRet[i] = '&#' + iC + ';';
        else aRet[i] = this[i];
    };
    return aRet.join('');
} */

LIB.xmlChar2utf8 = (str: string):string => {
    // Convert html numeric character encoding to utf8
    // @ts-ignore - match is not used, but must be declared anyhow.
    str = str.replace(/&#x([\da-fA-F]+);/g, function (match, numStr) {
        return String.fromCharCode(parseInt(numStr, 16))
    });
    // @ts-ignore - match is not used, but must be declared anyhow.
    return str.replace(/&#(\d+);/g, function (match, numStr) {
        return String.fromCharCode(parseInt(numStr, 10))
    })
}


LIB.toHTML = (str: string): string => {
    // Escape HTML characters and convert js/json control characters (new line etc.) to HTML-tags:
    return str.escapeHTML().ctrl2HTML()
}
// https://stackoverflow.com/questions/15458876/check-if-a-string-is-html-or-not
LIB.isHTML = (str: string): boolean => {
    let doc = new DOMParser().parseFromString(str, "text/html");
    return Array.from(doc.body.childNodes).some(node => node.nodeType == 1)
}
LIB.escapeInnerHtml = ( str:string ):string =>{
    // escape text except for HTML tags:
    var out = "";

    // @ts-ignore - $0 is never read, but must be specified anyways
    str = str.replace(RE.innerHtmlTag, function ($0, $1, $2, $3, $4) {
        // $1: inner text (before the next tag)
        // $2: start of opening tag '<' or closing tag '</'
        // $3: any of the tokens listed in tagsHtml (see definitions.ts)
        // $4: the rest of the tag including '>' or '/>'
//        console.debug('escapeInner', $0, $1, $2, $3, $4);

        // escape the inner text and keep the tag:
        out += $1.escapeXML() + $2 + $3 + $4; 

        // consume the matched piece of str:
        return '';
    });
    // process the remainder (the text after the last tag) or the whole text if there was no tag:
    out += str.escapeXML();
    return out;
}
/*LIB.escapeFileName = (str: string): string => {
    return str.replace()
} */
// Escape characters for Regex expression (https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions)
String.prototype.escapeRE = function (): string {
    return this.replace(/[.*+?^${}()|[\]\\]/g, '\$&')   // $& means the whole matched string
}; 
// Escape characters for JSON string: 
String.prototype.escapeJSON = function () {
    return this.replace(/["\\]/g, '\$&')    // $& means the whole matched string
            .replace(/\u000A/g, '\n')
            .replace(/\u0009/g, '\t')
            .replace(/\[\u0000-\u001F]/g, '')
};
String.prototype.unescapeJSON = function () {
    return this.replace(/\\"/g, '"')
            .replace(/\n/g, '&#x0A;')
            .replace(/\t/g, '&#x09;')
};

String.prototype.escapeXML = function():string {
// escape XML characters:
    // @ts-ignore - $0 is never read, but must be listed anyways
    return this.replace(
                RE.AmpersandPlus,
                ($0, $1) => {
                    // 1. Replace &, unless it belongs to an XML entity:
                    if (RE.XMLEntity.test($0))
                        // no replacement:
                        return $0;
                    // else, encode the '&' and add the remainder of the pattern:
                    return '&#38;' + $1;
                }
            )
            .replace(
                /[<>"']/g,
                ($0) => {
                    // 2. Replace <, >, " and ':
                    return "&#" + { "<": "60", ">": "62", '"': "34", "'": "39" }[$0] + ";";
                }
            )
/*    return this.replace(/&([^#])/g, ($0, $1) => { // only '&' which are not starting a XML entity
                return '&#38;' + $1
            })
            .replace(/["'<>]/g, ($0) => {
                return "&#" + { "<": "60", ">": "62", '"': "34", "'": "39" }[$0] + ";"
            }) */
};
String.prototype.escapeHTML = function():string {
// escape HTML characters:
    return this.replace(/[&<>"'`=\/]/g, ($0)=>{
        return "&#" + {"&":"38", "<":"60", ">":"62", '"':"34", "'":"39", "`":"x60", "=":"x3D", "/":"x2F"}[$0] + ";";
    })
};
String.prototype.unescapeHTMLTags = function():string {
//  Unescape known HTML-tags:
    if( LIB.isHTML(this as string) ) return this as string;
    // @ts-ignore - $0 is never read, but must be specified anyways
    return LIB.noCode(this.replace(RE.escapedHtmlTag, ($0,$1,$2,$3)=>{
        return '<'+$1+$2+$3+'>';
    }));
};
// see: https://stackoverflow.com/questions/1912501/unescape-html-entities-in-javascript
String.prototype.unescapeHTMLEntities = function():string {
    // unescape HTML encoded characters:
    var el = document.createElement('div');
    return LIB.noCode(this.replace(/\&#?x?[\da-z]+;/gi, (enc)=>{
        el.innerHTML = enc;
        return el.innerText;
    }));
};
/*// better: https://stackoverflow.com/a/34064434/5445 but strips HTML tags.
String.prototype.unescapeHTMLEntities = function() {
    var doc = new DOMParser().parseFromString(input, "text/html");
    return LIB.noCode( doc.documentElement.textContent )
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
            /*    // we must encode the URI, but to avoid that an already encoded URI is corrupted, we first decode it
                // under the assumption that decoding a non-encoded URI does not cause a change.
                // This does not work if a non-encoded URI contains '%'.
                return $1+'<a href="'+encodeURI(decodeURI($2))+'" >'+(opts&&opts.label? opts.label:$3+($4||'')+$5)+'</a>'+$9 */
                return $1+'<a href="'+$2+'" target="_blank" >'+(opts&&opts.label? opts.label:$3+($4||'')+$5)+'</a>'+$9;
            });
    return this as string;
};
String.prototype.fileExt = function():string {
    // return the file extension excluding '.':
    let idx = this.lastIndexOf('.');
    return idx<0? '' : this.substring(idx+1);
/*    // see https://stackoverflow.com/questions/190852/how-can-i-get-file-extensions-with-javascript/12900504#12900504
    return fname.slice((fname.lastIndexOf(".") - 1 >>> 0) + 2); */
};
String.prototype.baseName = function(): string {
    // return the filename with extension and without the path:
    return this.substring(this.lastIndexOf('/') + 1)
};
String.prototype.fileName = function():string {
    // return the filename without extension:
    let idx = this.lastIndexOf('.');
    return this.substring(0, idx < 0 ? this.length : idx);
};
LIB.addFileExtIfMissing = (fn: string, ext: string): string => {
    return fn == fn.fileName() ? fn + ext : fn;
};
LIB.addTimezoneIfMissing = (dt:string):string => {
    if (typeof(dt)=='string') {
        // ReqIF data generated by PTC Integrity has been observed to have timestamps without timezone.
        // If date and time are specified, but no timezone, add "Z" for Greenwich time:
        if (!RE.hasTimezone.test(dt)) {
            console.info("Added missing time-zone to " + dt);
            return dt + "Z";
        };
    };
    return dt;
};
LIB.trimJson = (str: string): string => {
    // trim all characters outside the outer curly brackets, which may include the UTF-8 byte-order-mask: 
    return str.substring( str.indexOf('{'), str.lastIndexOf('}')+1 )
};
LIB.isTrue = (str: string): boolean =>{
    return str && CONFIG.valuesTrue.includes(str.toLowerCase().trim());
}
LIB.isFalse = (str: string): boolean =>{
    return str && CONFIG.valuesFalse.includes(str.toLowerCase().trim());
}

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

LIB.ab2str = (buf: ArrayBuffer): string => {
    // Convert arrayBuffer to string:
    // UTF-8 character table: http://www.i18nqa.com/debug/utf8-debug.html
    // or: https://bueltge.de/wp-content/download/wk/utf-8_kodierungen.pdf
//    try {
        // see https://developers.google.com/web/updates/2014/08/Easier-ArrayBuffer-String-conversion-with-the-Encoding-API
        // DataView is a wrapper on top of the ArrayBuffer.
        let dataView = new DataView(buf),
        // The TextDecoder interface is documented at http://encoding.spec.whatwg.org/#interface-textdecoder
            decoder = new TextDecoder('utf-8');
        return decoder.decode(dataView);
/*    } catch (e) {
        // see https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
        // for vintage browsers such as IE
        // Known problem: Special chars like umlaut are not properly converted.
        return String.fromCharCode.apply(null, new Uint8Array(buf));
    }; */
}
LIB.str2ab = (str: string): ArrayBuffer => {
    // Convert string to arrayBuffer:
//    try {
        let encoder = new TextEncoder();
        return encoder.encode(str).buffer;        
/*    } catch (e) {
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
LIB.blob2dataURL = (file: SpecifFile, fn: Function, timelag?: number): void => {
    if (!file || !file.blob) return;
    const reader = new FileReader();
    // @ts-ignore - yes, result can be 'null'
    reader.addEventListener('loadend', (e) => { fn(e.target.result, file.title, file.type) });
    if (typeof (timelag) == 'number' && timelag > 0)
        setTimeout(() => {
            // @ts-ignore - existence of blob is checked above
            reader.readAsDataURL(file.blob);
        }, timelag)
    else
        reader.readAsDataURL(file.blob);
};
LIB.blob2text = (file: SpecifFile, fn: Function, timelag?: number): void => {
    if (!file || !file.blob) return;
    const reader = new FileReader();
    // @ts-ignore - yes, result can be 'null'
    reader.addEventListener('loadend', (e) => { fn(e.target.result, file.title, file.type) });
    if (typeof (timelag) == 'number' && timelag > 0)
        setTimeout(() => {
            // @ts-ignore - existence of blob is checked above
            reader.readAsText(file.blob);
        }, timelag);
    else
        reader.readAsText(file.blob);
};
LIB.validXML = (xml: string): boolean => {
    let parser = new DOMParser();
    let xmlDoc = parser.parseFromString(xml, "text/xml");
    return xmlDoc.getElementsByTagName('parsererror').length < 1
}
LIB.uriBack2slash = (str: string): string => {
	// Sometimes a Windows path is given containing '\' -> transform it to web-style ('/');
    // replace back-slashes to slashes in all object and img tags:
    return str.replace(/<(?:object[^>]+?data=|img[^>]+?href=)"([^"]+)"[^>]*?\/?>/g,
        ($0) => {
            return $0.replace(/(?:data=|href=)"([^"]+)"/g,
                ($0) => {
                    return $0.replace(/\\/g, '/');
                }
            )
        }
    )
};
        
// not good enough, but better than nothing:
// see https://www.owasp.org/index.php/XSS_%28Cross_Site_Scripting%29_Prevention_Cheat_Sheet
// do not implement as chainable function, because a string object is created. 
LIB.noCode = ( s:string ):string =>{
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
        console.warn("'"+s+"' is considered harmful ("+c+") and has been suppressed");
    }
}
LIB.cleanValue = (o: any): string | SpecifMultiLanguageText[] => {
    // remove potential malicious code from a value which may be supplied in several languages:
    if (typeof (o) == 'string') return LIB.noCode(o);
    // It must be a multiLanguageText, here:
    if (Array.isArray(o)) return LIB.forAll(o, (val:any) => { val.text = LIB.noCode(val.text); return val });
    throw Error('Unexpected input to LIB.cleanValue: Programming error with all likelihood');
}
LIB.attachment2mediaType = ( fname:string ):string|undefined =>{
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
//    return undefined;
}
LIB.localDateTime = (iso:string):string =>{
//    if( typeof(iso)=='string' ) {
        // ToDo: calculate offset of time-zone ... or use one of the libraries ..
        if( iso.length>11 ) return (iso.substring(0,10)+' '+iso.substring(11,16)+'h');
        return (iso.substring(0,10));
//    };
//    return '';
}

LIB.httpGet = (params:any):void =>{
    // https://blog.garstasio.com/you-dont-need-jquery/
    // https://www.sitepoint.com/guide-vanilla-ajax-without-jquery/
    var xhr = new XMLHttpRequest();
    xhr.open('GET', params.url, true);
    if( params.withCredentials ) xhr.withCredentials = true;
    // https://stackoverflow.com/a/42916772/2214
    xhr.responseType = params.responseType;
    xhr.onreadystatechange = function() {
//        console.debug('xhr',this.readyState,this)
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

LIB.isReferencedByHierarchy = (itm: SpecifKey, H?: SpecifNode[]): boolean => {
    // Check whether a resource is referenced by the hierarchy:
    // ToDo: The following is only true, if there is a single project in the cache (which is the case currently)
    if (!H) H = app.projects.selected.cache.hierarchies;
    return LIB.iterateNodes(H, (nd: SpecifNode) => { return nd.resource.id != itm.id; });
    //    return LIB.iterateNodes(H, (nd: SpecifNode) => { return !LIB.references(nd.resource, itm); });  // doesn'twork
    //    return LIB.iterateNodes(H, (nd: SpecifNode) => { return !LIB.references(nd.resource, {id:itm.id,revision:itm.revision}); });  // doesn'twork
}
LIB.referencedResources = (rL: SpecifResource[], h: SpecifNode[]): SpecifResource[] => {
    // Collect all resources referenced by the given hierarchy:
    // ToDo: The following is only true, if there is a single project in the cache (which is the case currently)
    var crL: SpecifResource[] = [];
    LIB.iterateNodes(h, (nd: SpecifNode) => { LIB.cacheE(crL, LIB.itemByKey(rL, nd.resource)); return true });
    return crL;
}
LIB.referencedResourcesByClass = (rL: SpecifResource[], h: SpecifNode[], rCIdL: string[]): SpecifResource[] => {
    // Collect all resources from a hierarchy which belong to one of the classes in rCIdL. 
    let crL: SpecifResource[] = [];
    (LIB.iterateNodes(
        h,
        (nd: SpecifNode) => {
            // Replace ids by their elements:
            let r = LIB.itemById(rL, nd.resource.id);
            // Collect those resources having a class in the list:
            if (r && rCIdL.includes(r['class'].id)) {
                crL.push(r)
            };
            return true; // continue to iterate
        }
    ))
    return crL;
}

LIB.dataTypeOf = (key: SpecifKey, prj: SpecIF): SpecifDataType => {
    // Given a propertyClass key, return it's dataType:
    if (LIB.isKey(key)) {
        let dT = LIB.itemByKey(prj.dataTypes, LIB.itemByKey(prj.propertyClasses, key).dataType);
        //       |                            get propertyClass
        //        get dataType
        if (dT)
            return dT
        else
            throw Error("dataType of '" + key.id + "' not found in SpecIF data-set with id " + prj.id);
    };
    // else:
    // happens, if filter replaces an enumeration property by its value - property has no class in this case:
    return { type: XsDataType.String } as SpecifDataType; // by default
}
LIB.iterateNodes = (tree: SpecifNode[] | SpecifNode, eFn: Function, lFn?: Function): boolean => {
    // Iterate a SpecIF hierarchy or a branch of a hierarchy.
    // Do NOT use with a tree for display (jqTree).
    // 1. Execute eFn for every node of the tree as long as eFn returns true;
    //    return true as a whole, if iterating is finished early.
    //    For example, if eFn tests for a certain attribute value of a tree node,
    //    iterateNodes() ends with true, as soon as the test is positive (cont is false).
    // 2. Call lFn at the end of treating all elements of a folder (list),
    //    for example to eliminate duplicates.
    let cont = true;
    if (Array.isArray(tree)) {
    //    for (var i = tree.length - 1; cont && (i > -1); i--) {
        for (var i = 0, I = tree.length; cont && (i < I); i++) {
            cont = !LIB.iterateNodes(tree[i], eFn, lFn);
        };
        if (typeof (lFn) == 'function') lFn(tree);
    }
    else {
        cont = eFn(tree);
        if (cont && tree.nodes) {
            cont = !LIB.iterateNodes(tree.nodes, eFn, lFn);
        };
    };
    return !cont;
}
LIB.createProp = (pC: SpecifPropertyClass | SpecifPropertyClass[], key?: SpecifKey): SpecifProperty => {
    // Create an empty property from the supplied class;
    // the propertyClass may be supplied by the first parameter
    // or will be selected from the propertyClasses list using the supplied key:
    let _pC = Array.isArray(pC) ? LIB.itemByKey(pC, key) : pC;
    //    console.debug('createProp',pC,key);
    return {
        class: LIB.keyOf(_pC),
        // supply default value if available:
        values: _pC.values || []
        //    permissions: pC.permissions||{cre:true,rea:true,upd:true,del:true}
    };
}
LIB.propByTitle = (itm: SpecifInstance, pN: string, dta: SpecIF | CSpecIF | CCache): SpecifProperty | undefined => {
    // Return the property of itm with title pN.
    // If it doesn't exist, create it,
    // if there is no propertyClass with that title either, return undefined.

    // Look for the propertyClasses pCs of the item's class iC:
    // ToDo: Add statementClasses, as soon as needed.
    var iC: SpecifResourceClass = LIB.itemByKey(dta.resourceClasses, itm['class']),
        prp: SpecifProperty;
//    console.debug('propByTitle',dta,itm,pN,iC);
    for (var pC of dta.propertyClasses) {
        if (LIB.indexByKey(iC.propertyClasses, pC) > -1     // pC is used by the item's class iC
            && pC.title == pN) {                        // pC has the specified title
            // take the existing property, if it exists;
            // the property's title is not necessarily present:
            prp = LIB.itemBy(itm.properties, 'class', pC);
            if (prp) return prp;
            // else create a new one from the propertyClass:
            prp = LIB.createProp(pC);
            itm.properties.push(prp);
            return prp;
        };
    };
    //    return undefined
}
LIB.titleOf = (item: SpecIFItemWithNativeTitle, opts?: any): string => {
    // Pick up the native title of any item except resource and statement;
    // return either the target language or the target namespace according to the options:
    if( item )
        return (opts && opts.lookupTitles ?
            (opts.targetLanguage ?
                app.ontology.localize(item.title, opts)
              : app.ontology.changeNamespace(item.title, opts)
            /*    : (opts.targetNamespaces && opts.targetNamespaces.length>0 ?
                    app.ontology.changeNamespace(item.title, opts)
                    : item.title
                ) */
            )
            : item.title);
    throw Error("Programming error: Input parameter 'item' is not defined");
}
LIB.classTitleOf = (iCkey: SpecifKey, cL: SpecifClass[], opts?: any): string | undefined => {
    // Return the item's class title,
    // where item can be a resource, a statement or a property:
    let iC = LIB.itemByKey(cL, iCkey);
    if( iC )
        return LIB.titleOf(iC, opts);
}
LIB.hasResClass = (r: SpecifResource, pNs: string[], dta: SpecIF | CSpecIF | CCache): boolean => {
    // Has the class of res a title listed in pNs?
    return pNs.includes(LIB.classTitleOf(r['class'], dta.resourceClasses));
}
LIB.hasType = (r: SpecifResource | SpecifStatement, pNs: string[], dta: SpecIF | CSpecIF | CCache, opts?: any): boolean => {
    // Has the resource or statement a type property with a value listed in pNs? 
    // It is assumed that a type property has no more than one value, so the first is taken if available. 
    if (r) {
        let pVs = LIB.valuesByTitle(r, [CONFIG.propClassType], dta);
        if (pVs.length > 0) {
            return pNs.includes(LIB.displayValueOf(pVs[0], Object.assign({ targetLanguage: 'default' }, opts)))
        };
        return false;
    };
    throw Error("Programming Error: No resource or statement specified");
    // return false;
}
LIB.titleIdx = (pL: SpecifProperty[] | undefined, pCs: SpecifPropertyClass[]): number => {
    // Find the index of the property to be used as title.
    // The result depends on the current user - only the properties with read permission are taken into consideration.
    // This works for title strings and multi-language title objects.

    // The first property which is found in the list of headings or titles is chosen:
    if (Array.isArray(pL) && pL.length>0) {
    //    if (!pCs) pCs = app.projects.selected.cache.propertyClasses;
        for (var a = 0, A = pL.length; a < A; a++) {
         //   let pt = vocabulary.property.specif(LIB.classTitleOf(pL[a]['class'], pCs));
            let pt = LIB.classTitleOf(pL[a]['class'], pCs);
            // Check the configured headings and titles:
            if (CONFIG.titleProperties.includes(pt)) return a;
        }
    };
    return -1;
}
LIB.getTitleFromProperties = (pL: SpecifProperty[] | undefined, pCs: SpecifPropertyClass[], opts: any): string => {
    // look for a property serving as title:
    let idx = LIB.titleIdx(pL,pCs);
    if (idx > -1) {  // found!
        /*    // Remove all formatting for the title, as the app's format shall prevail.
            // Before, remove all marked deletions (as prepared be diffmatchpatch) explicitly with the contained text.
            // ToDo: Check, whether this is at all called in a context where deletions and insertions are marked ..
            // (also, change the regex with 'greedy' behavior allowing HTML-tags between deletion marks).
            if( moduleManager.ready.includes( 'diff' ) )
                return pL[idx].value.replace(/<del[^<]+<\/del>/g,'').stripHTML(); */

        // For now, let's try without replacements; so far this function is called before the filters are applied,
        // perhaps this needs to be reconsidered, once the revisions list is featured again:
//        console.debug('getTitleFromProperties', idx, pL[idx], op, LIB.languageTextOf( pL[idx].value,op ) );
        let ti = LIB.languageTextOf(pL[idx].values[0], opts).stripHTML();
        if (ti) return (opts && opts.lookupValues ? app.ontology.localize(ti, opts) : ti);
    };
    return '';
}
LIB.typeOf = (rK: SpecifResource, dta: SpecIF): string => {
    // Take the resource or look it up by key and return its type:
    let r = rK["class"]? rK : LIB.itemByKey(dta.resources, rK),
        // Return the value of the property with title "dcterms:type":
        pVL = LIB.valuesByTitle(r, [CONFIG.propClassType], dta);
    return pVL.length > 0 ? LIB.displayValueOf(pVL[0], { targetLanguage: 'default' }) : undefined
}

// Make a very simple hash code from a string:
// http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
// also see: https://gist.github.com/iperelivskiy/4110988
// also see: https://www.partow.net/programming/hashfunctions/index.html
function simpleHash(str: string): number {
    for (var r = 0, i = 0; i < str.length; i++) r = (r << 5) - r + str.charCodeAt(i), r &= r;
    // add offset to avoid negative numbers; r is 10 characters long:
    return 10000000000 + r
}
function simpleClone(o: any): any {
    // "deep" clone
    // - functions and null are returned 'undefined'
    // - ToDo: consider cases 'Date', 'String', 'Number', 'Boolean' all being an 'object'
    //   (however none of these are currently used in this software)
    // see https://www.w3schools.com/js/js_typeof.asp
    function cloneProp(p: any) {
        return (typeof (p) == 'object') ? simpleClone(p) : p;
    }
    if (o != null) {
        // a Blob is an object, but treat it as a whole further down:
        if (typeof (o) == 'object' && !(o instanceof Blob)) {
            var n: any;
            if (Array.isArray(o))
                n = [];
            else
                n = {};
            for (var p in o) {
                if (Array.isArray(o[p])) {
                    n[p] = [];
                    o[p].forEach(
                        (op: any) => { n[p].push(cloneProp(op)); }
                    );
                    continue;
                };
                // else
                n[p] = cloneProp(o[p]);
            };
            return n;
        };
        if (typeof (o) != 'function')
            // arriving here, o is a scalar/atomic value or a Blob
            return o;
        // arriving here, o is a function
    };
    // here, only a 'function' or a 'null' value should arrive ... returning 'undefined'
}

function hasUrlParams(): boolean {
    let p = document.URL.split('#');
    return (!!p[1] && p[1].length > 0);
    /*    ( p[1] && p[1].length>0 ) return '#';
        p = document.URL.split('?');   no queries, yet
        if( p[1] && p[1].length>0 ) return '?';
        return false; */
}
// ToDo: try prms = location.hash
// see: https://www.w3schools.com/jsref/prop_loc_hash.asp
function getUrlParams(opts?: any): any {
    // Get the url parameters contained in the 'fragment' according to RFC2396:
    if (typeof (opts) != 'object') opts = {};
    if (typeof (opts.start) != 'string') opts.start = '#';
    if (typeof (opts.separator) != 'string') opts.separator = ';'

    let p = document.URL.split(opts.start);
    if (!p[1]) return {};
    return parse(decodeURI(p[1]));

    function parse(h: string): any {
        if (!h) return {};
        if (h.charAt(0) == '/') h = h.substring(1);    // remove leading slash
        var pO = {};
        h.split(opts.separator).forEach(
            (p: any) => {
                p = p.split('=');
                // remove enclosing quotes from the value part:
                if (p[1] && ['"', "'"].includes(p[1][0])) p[1] = p[1].substring(1, p[1].length - 1);
                // look for specific tokens, only:
                if (CONFIG.urlParamTags.includes(p[0]))
                    // @ts-ignore - indexing is ok:
                    pO[p[0]] = p[1];
                else
                    console.warn("Unknown URL-Parameter '", p[0], "' found.");
            }
        );
        return pO;
    }
}
function setUrlParams(actSt: any): void {
    // update browser history, if changed:
    if (!browser.supportsHtml5History || !actSt) return;

    let quO = getUrlParams();
    //    console.debug( 'setUrlParams', quO, actSt );
    // don't update, if unchanged or no project selected:
    if (quO.project == actSt.project
        && quO[CONFIG.keyView] == actSt.view
        && quO[CONFIG.keyNode] == actSt.node
    /*    && (quO[CONFIG.keyNode] == actSt.node
            || !actSt.item
            || quO[CONFIG.keyItem] == actSt.item
           )  */
    ) {
        //        console.debug('setUrlParams - quit');
        return;
    };

    let path = window.location.pathname.split('/'),  // get the path in pieces
        newParams = path[path.length - 1],       // last element is 'appname.html' (without URL params)
        is = '=', sep = ';';

    newParams += '#'
        + CONFIG.keyView + is + actSt.view
        + (actSt.project ? sep + CONFIG.keyProject + is + actSt.project : "")
        + (actSt.node ? sep + CONFIG.keyNode + is + actSt.node : (actSt.item ? sep + CONFIG.keyItem + is + actSt.item : ''));

    // update the browser history:
    history.pushState('', '', newParams);
}
function clearUrlParams(): void {
    if (!browser.supportsHtml5History || !hasUrlParams()) return;

    let path = window.location.pathname.split('/');  // get the path in pieces
    //    console.debug( 'clearUrlParams', path );
    history.pushState('', '', path[path.length - 1]);    // last element is 'appname.html' without url parameters;
}
/*
class CUrlParams {
//    uid?: string;
    import?: string;
    mode?: string;
    project?: string;
    item?: string;
    node?: string;
    view?: string;
}
    // Keys for the query parameters - if changed, existing links will end up in default view:
//    CONFIG.keyUId = 'uid';    // userId
    CONFIG.keyImport = 'import';
    CONFIG.keyMode = 'mode';
    CONFIG.keyProject = 'project';    // projectId
    CONFIG.keyItem = 'item';
    CONFIG.keyNode = 'node';
    CONFIG.keyView = 'view';    // dialog
    CONFIG.urlParamTags = [CONFIG.keyImport,CONFIG.keyMode,CONFIG.keyProject,CONFIG.keyItem,CONFIG.keyNode,CONFIG.keyView];

function getUrlParams(opts?: any): IUrlParams {
    // Get the url parameters contained in the 'fragment' according to RFC2396:
    if( typeof(opts)!='object' ) opts = {};
    if( typeof(opts.start)!='string' ) opts.start = '#';
    if( typeof(opts.separator)!='string' ) opts.separator = ';'

    let p = document.URL.split(opts.start);
    if( !p[1] ) return {};
    p = decodeURI(p[1]);
    if( p[0]=='/' ) p = p.substring(1);    // remove leading slash
    return parse( p );

    function parse( h:string ):object {
        if( !h ) return {};
        var pO = new IUrlParams;
        h = h.split(opts.separator);
        h.forEach( (p)=>{
            p = p.split('=');
            // remove enclosing quotes from the value part:
            if( p[1] && ['"',"'"].includes(p[1][0]) ) p[1] = p[1].substring(1,p[1].length-1);
            // look for specific tokens, only:
            if( CONFIG.urlParamTags.includes(p[0]) )
                pO[p[0]] = p[1];
            else
                console.warn("Unknown URL-Parameter '",p[0],"' found.");
        });
        return pO;
    }
}
*/
