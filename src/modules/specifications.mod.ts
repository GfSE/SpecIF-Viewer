/*!	Show SpecIF data
	Dependencies: jQuery, jqTree, bootstrap
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de 
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/

interface ISpecs extends IModule {
	selectedView(): string;
	emptyTab(tab: string): void;
	updateTree: Function;
	refresh: Function;
	doRefresh: Function;
	itemClicked: Function;
}

RE.titleLink = new RegExp(CONFIG.titleLinkBegin.escapeRE() + '(.+?)' + CONFIG.titleLinkEnd.escapeRE(), 'g');
class CPropertyToShow implements SpecifProperty {
	id?: string;
	title?: SpecifMultiLanguageText[] | string;
	description?: SpecifMultiLanguageText[] | string;
	// @ts-ignore - presence of 'class' is checked by the schema on import
	class: SpecifKey;
	private pData: CCache;
	private pC: SpecifPropertyClass;
	private dT: SpecifDataType;
	replaces?: string[];
	revision?: string;
	// @ts-ignore - presence of 'value' is checked by the schema on import
	values: SpecifValues;
	constructor(prp: SpecifProperty) {
		// @ts-ignore - index is ok:
		for (var a in prp) this[a] = prp[a];

		this.pData = app.cache.selectedProject.data;
		// @ts-ignore - 'class' is in fact initialized, above:
		this.pC = LIB.itemByKey(this.pData.propertyClasses, this['class']);
		this.dT = LIB.itemByKey(this.pData.dataTypes, this.pC['dataType']);

		// by default, use the propertyClass' title:
		// An input data-set may have titles which are not from the SpecIF vocabulary;
		// replace the result with a preferred vocabulary term:
		this.title = vocabulary.property.specif(this.pC.title);

		if (this.dT.enumeration) 
			this.values = this.lookupEnumeratedValues();
	}
	private lookupEnumeratedValues() {
		// replace identifiers of enumerated values by their value as defined in the dataType:
		var oL: SpecifValues = [];
		this.values.forEach(
			(v: SpecifValue): void => {
				oL.push(LIB.itemById(this.dT.enumeration, v).value);
			});
//		console.debug('#2', simpleClone(oL));
		return oL;
	}
	private allValuesByLanguage(opts: any): string {
		// Return all values in the language specified;
		// it is assumed that the values in case of an enumeration have already been looked up:
		var str = '';
		if (this.dT.type == SpecifDataTypeEnum.String) {
			if (opts && opts.targetLanguage) {
				/*	if (this.dT.enumeration) {
						let v: SpecifMultiLanguageText;
						this.values.forEach((id) => {
							v = LIB.itemById(this.dT.enumeration, id).value;
							str += LIB.languageValueOf(v, opts);
						});
					}
					else */
				this.values.forEach((v: any, i: number) => { str += (i == 0 ? '' : ', ') + LIB.languageValueOf(v, opts); });
				return str;
			};
			// else
			throw Error("When displaying property values, a target language must be specified.");
		};
		// else, all data types except string:
		this.values.forEach((v: any, i: number) => { str += (i == 0 ? '' : ', ') + v; });
		return str;

		/*	let ct = '',
				eV;
			console.debug('enumValueOf',dT,val,opts);
			dT.enumeration.forEach( (v,i)=>{
				eV = LIB.languageValueOf( LIB.itemById(dT.enumeration,v).value, opts );
				// If 'eV' is an id, replace it by the corresponding value, otherwise don't change:
				// For example, when an object is from a search hitlist or from a revision list,
				// the value ids of an ENUMERATION have already been replaced by the corresponding titles.
				if (opts && opts.lookupValues)
					eV = i18n.lookup(eV);
				ct += (i == 0 ? '' : ', ') + (eV ? eV : v);
			});
			return ct; */
    }
	isVisible(opts: any): boolean {
		return (CONFIG.hiddenProperties.indexOf(this.title)<0 // not listed as hidden
			&& (CONFIG.showEmptyProperties || LIB.hasContent(this.allValuesByLanguage(opts))))
	}
	get( opts: any): string {
		if (typeof (opts) != 'object') opts = {};
		if (typeof (opts.titleLinking) != 'boolean') opts.titleLinking = false;
		if (!opts.targetLanguage) opts.targetLanguage = browser.language;
		if (!Array.isArray(opts.titlelLinkTargets)) opts.titleLinkTargets = CONFIG.titleLinkTargets;

		if (typeof (opts.clickableElements) != 'boolean') opts.clickableElements = false;
		if (typeof (opts.linkifyURLs) != 'boolean') opts.linkifyURLs = false;
		// some environments escape the tags on export, e.g. camunda / in|flux:
		if (typeof (opts.unescapeHTMLTags) != 'boolean') opts.unescapeHTMLTags = false;
		// markup to HTML:
		if (typeof (opts.makeHTML) != 'boolean') opts.makeHTML = false;
		if (typeof (opts.lookupValues) != 'boolean') opts.lookupValues = false;

		// Malicious content has been removed upon import ( specif.toInt() ).
		let ct: string;
//		console.debug('*',this,this.dT);
		switch (this.dT.type) {
			case SpecifDataTypeEnum.String:
				// remove any leading whiteSpace:
				ct = this.allValuesByLanguage(opts).replace(/^\s+/, "");
				if (opts.lookupValues)
					ct = i18n.lookup(ct);
				if (opts.unescapeHTMLTags)
					ct = ct.unescapeHTMLTags();
				// Apply formatting only if not listed:
				if (CONFIG.excludedFromFormatting.indexOf(this.title) < 0)
					ct = ct.makeHTML(opts);
				ct = this.renderFile(ct, opts);   // show the diagrams
				ct = this.titleLinks(ct, opts);
				break;
			case SpecifDataTypeEnum.DateTime:
				ct = LIB.localDateTime(this.value);
				break;
			default:
				ct = this.value;
		};
	/*	// Add 'double-angle quotation' in case of stereotype values:
		if( CONFIG.stereotypeProperties.indexOf(this.title)>-1 )
			ct = '&#x00ab;'+ct+'&#x00bb;'; */
		return ct;
	}

	private titleLinks(str: string, opts: any): string {
		// Transform sub-strings with dynamic linking pattern to internal links.
		// Syntax:
		// - A resource title between CONFIG.titleLinkBegin and CONFIG.titleLinkEnd will be transformed to a link to that resource.
		// - Icons in front of titles are ignored
		// - Titles shorter than 4 characters are ignored
		// - see: https://www.mediawiki.org/wiki/Help:Links

		// in certain situations, just remove the dynamic linking pattern from the text:
		if (!CONFIG.titleLinking || !opts.titleLinking)
			// @ts-ignore - $0 is never read, but must be specified anyways
			return str.replace(RE.titleLink, ($0, $1) => { return $1 });

	/*	let date1 = new Date();
		let n1 = date1.getTime(); */

		// else, find all dynamic link patterns in the current property and replace them by a link, if possible:
		let replaced = false;
		do {
			replaced = false;
			str = str.replace(RE.titleLink,
				// @ts-ignore - $0 is never read, but must be specified anyways
				($0, $1) => {
					replaced = true;
					// disregard links being too short:
					if ($1.length < CONFIG.titleLinkMinLength) return $1;
					let m = $1.toLowerCase(), cR: SpecifResource, ti: string, rC:SpecifResourceClass, target: SpecifResource;
					// is ti a title of any resource?
					app.specs.tree.iterate((nd: jqTreeNode) => {
						cR = LIB.itemByKey(app.cache.selectedProject.data.resources, nd.ref);
						// avoid self-reflection:
						//	if(ob.id==cR.id) return true;
						ti = LIB.elementTitleOf(cR, opts);
						if (!ti || m != ti.toLowerCase()) return true;  // continue searching

						// disregard link targets which aren't diagrams nor model elements:
						rC = LIB.itemByKey(app.cache.selectedProject.data.resourceClasses, cR['class']);
						if (opts.titleLinkTargets.indexOf(rC.title) < 0) return true;  // continue searching

						// the titleLink content equals a resource's title, remember the first occurrence:
						target = cR;
						return false; // found, stop searching!
					});
					// replace it with a link in case of a match:
					if (target)
						return lnk(target, $1);
					// The dynamic link has NOT been matched/replaced, so mark it:
					return '<span style="color:#D82020">' + $1 + '</span>'
				}
			)
		} while (replaced);

	/*	let date2 = new Date();
		let n2 = date2.getTime(); 
		console.info( 'dynamic linking in ', n2-n1,'ms' ) */
		return str;

		function lnk(r: SpecifResource, t: string): string {
//			console.debug('lnk',r,t,'app['+CONFIG.objectList+'].relatedItemClicked(\''+r.id+'\')');
			return '<a onclick="app[CONFIG.objectList].relatedItemClicked(\'' + r.id + '\')">' + t + '</a>'
		}
	}
	renderFile(txt: string, opts?: any): string {
	/*	Formerly fileRef.toGUI()
		Properly handle file references in XHTML-Text. 
		- An image is to be displayed 
		- a file is to be downloaded
		- an external hyperlink is to be included
	*/
		if (typeof (opts) != 'object') opts = {};
	//	if (opts.projId == undefined) opts.projId = app.cache.selectedProject.id;
	//	if( opts.rev==undefined ) opts.rev = 0;
		if (opts.imgClass == undefined) opts.imgClass = 'forImage'	// regular size

	/*	function addFilePath( u ) {
			if( /^https?:\/\/|^mailto:/i.test( u ) ) {
				// don't change an external link starting with 'http://', 'https://' or 'mailto:'
				return u;
			};
			// else, add relative path:
			return URL.createObjectURL( LIB.itemById( app.cache.selectedProject.data.files, u ).blob );
		}  */
		function getType(str: string): string {
			let t = /(type="[^"]+")/.exec(str);
			if (Array.isArray(t) && t.length > 0) return (' ' + t[1]);
			return '';
		}
		function getUrl(str: string): string | undefined {
			let l = /data="([^"]+)"/.exec(str);  // url in l[1]
			// return null, because an URL is expected in any case:
			if (Array.isArray(l) && l.length > 0) return l[1]
			//						.replace(/\\/g,'/'); // is now handled during import
			//	return undefined
		}
	/*	function getPrp( pnm:string, str:string ):string|undefined {
			// get the value of XHTML property 'pnm':
			let re = new RegExp( pnm+'="([^"]+)"', '' ),
				l = re.exec(str);
			if( Array.isArray(l)&&l.length>0 ) return l[0];
		//	return undefined
		} */
		function getPrpVal(pnm: string, str: string): string | undefined {
			// get the value of XHTML property 'pnm':
			let re = new RegExp(pnm + '="([^"]+)"', ''),
				l = re.exec(str);
			if (Array.isArray(l) && l.length > 0) return l[1];
			//	return undefined
		}
		function makeStyle(w: string, h: string): string {
			// compose a style property, if there are such parameters,
			// return empty string, otherwise:
			return (h || w) ? ' style="' + (h ? 'height:' + h + '; ' : '') + (w ? 'width:' + w + '; ' : '') + '"' : '';
		//	return ' style="' + (h ? 'height:' + h + '; ' : '') + (w ? 'width:' + w + '; ' : '') + ' position:relative;"';
		}

		// Prepare a file reference for viewing and editing:
//		console.debug('toGUI 0: ', txt);
		var repStrings = [];   // a temporary store for replacement strings

		// 1. transform two nested objects to link+object resp. link+image:
		txt = txt.replace(RE.tagNestedObjects,
			// @ts-ignore - $3 is never read, but must be specified anyways
			($0, $1, $2, $3, $4) => {       // description is $4, $3 is not used
				let u1 = getUrl($1),  	// the primary file
					//	t1 = getType( $1 ), 
					//	w1 = getPrp("width", $1 ),
					//	h1 = getPrp("height", $1 ),
					u2 = getUrl($2), 		// the preview image
					//	t2 = getType( $2 ),
					w2 = getPrpVal("width", $2),
					h2 = getPrpVal("height", $2),
					d = $4 || u1;		// If there is no description, use the name of the link object

//				console.debug('fileRef.toGUI nestedObject: ', $0,'|', $1,'|', $2,'|', $3,'|', $4,'||', u1,'|', t1,'|', w1, h1,'|', u2,'|', t2,'|', w2, h2,'|', d );
				if (!u1) console.warn('no file found in '+$0);
				if (!u2) console.warn('no image found in '+$0);
			//	u1 = addFilePath(u1);
			//	u2 = addFilePath(u2);

				let f1 = new CFileWithContent(itemByTitle(app.cache.selectedProject.data.files, u1)),
					f2 = new CFileWithContent(itemByTitle(app.cache.selectedProject.data.files, u2));

				if (f1.hasContent()) {

					if (f2.hasContent()) {
						// take f1 to download and f2 to display:

//						console.debug('tagId',tagId(u2));
						// first add the element to which the file to download will be added:
						repStrings.push('<div id="' + tagId(u1) + '"></div>');
						// now add the image as innerHTML:
						f1.renderDownloadLink(
							'<div class="' + opts.imgClass + ' ' + tagId(u2) + '"'
							+ makeStyle(w2, h2)
							+ '></div>',
					/*		// add a button to enlarge the diagram in the top-right corner:
							'<div class="' + opts.imgClass + ' ' + tagId(u2) + '"'
							+ makeStyle(w2, h2)
							+ '></div>',
					 										*/
							opts
						);
						// Because an image must be added after the enclosing link, for example, the timelag is increased a little:
						f2.renderImage($.extend({}, opts, { timelag: opts.timelag * 1.2 }));
					}
					else {
						// nothing to display, so ignore f2:

						// first add the element to which the attachment will be added:
						repStrings.push('<span class="' + tagId(u1) + '"></span>');
						// now add the download link with file as data-URL:
						f1.renderDownloadLink(d, opts);
					};
					return 'aBra§kadabra' + (repStrings.length - 1) + '§';

				}
				else {
					return '<div class="notice-danger" >File missing: ' + d + '</div>'
				};
			}
		);
//		console.debug('fileRef.toGUI 1: ', txt);

		// 2. transform a single object to link+object resp. link+image:
		txt = txt.replace(RE.tagSingleObject,   //  comprehensive tag or tag pair
			// @ts-ignore - $2 is never read, but must be specified anyways
			($0, $1, $2, $3) => {
			//	var pairedImgExists = ( url )=>{
			//		// ToDo: check actually ...
			//		return true
			//	};

				let u1 = getUrl($1),
					t1 = getType($1),
					w1 = getPrpVal("width", $1),
					h1 = getPrpVal("height", $1);

				let e = u1? u1.fileExt() : undefined;
				if (!e) return $0     // no change, if no extension found

				// $3 is the description between the tags <object></object>:
				let d = $3 || u1,
					hasImg = false;
				e = e.toLowerCase();
//				console.debug('fileRef.toGUI singleObject: ', $0,'|', $1,'|', $2,'|', $3,'||', u1,'|', t1 );

			//	u1 = addFilePath(u1);
				if (!u1) console.warn('no image or link found in '+$0);
				let f1 = new CFileWithContent(itemByTitle(app.cache.selectedProject.data.files, u1));

				// sometimes the application files (BPMN or other) have been replaced by images;
				// this is for example the case for *.specif.html files:
				if (!f1.hasContent() && u1 && CONFIG.applExtensions.indexOf(e) > -1) {
					for (var i = 0, I = CONFIG.imgExtensions.length; !f1 && i < I; i++) {
						u1 = u1.fileName() + '.' + CONFIG.imgExtensions[i];
						f1 = new CFileWithContent(itemByTitle(app.cache.selectedProject.data.files, u1));
					};
				};
				// ... cannot happen any more now, is still here for compatibility with older files only.

				if (CONFIG.imgExtensions.indexOf(e) > -1 || CONFIG.applExtensions.indexOf(e) > -1) {
					// it is an image, show it:
					// Only an <object ..> allows for clicking on svg diagram elements with embedded links:
//					console.debug('fileRef.toGUI 2a found: ', f1, u1 );
					if (f1.hasContent()) {
						hasImg = true;
						// Create the DOM element to which the image will be added:
						//	d= '<span class="'+opts.imgClass+' '+tagId(u1)+'"></span>';
						d = '<div class="' + opts.imgClass + ' ' + tagId(u1) + '"'
							+ makeStyle(w1, h1)
							+ '></div>';
				/*		// add a button to enlarge the diagram in the top-right corner:
				 		d = '<div class="' + opts.imgClass + ' ' + tagId(u1) + '"'
							+ makeStyle(w1, h1)
							+ '><button class="btn btn-success" style="position:absolute;right:0;z-index:900;" >N</button></div>'; */
//						console.debug('img opts',f1,opts);
						// Add the image as innerHTML:
						f1.renderImage(opts);
					}
					else {
						d = '<div class="notice-danger" >Image missing: ' + d + '</div>'
					};
				}
				else if (CONFIG.officeExtensions.indexOf(e) > -1) {
					// it is an office file, show an icon plus filename:
					if (f1.hasContent()) {
						hasImg = true;

						// Add the download link:
						if (app.embedded)
							// In case of *.specif.html the icons are not available:
							f1.renderDownloadLink(d, opts);
						else
							// download link with icon indicating the file-type:
							f1.renderDownloadLink('<img src="' + CONFIG.imgURL + '/' + e + '-icon.png" type="image/png" alt="[ ' + e + ' ]" />', opts);

						// Create the DOM element to which the attachment will be added:
						d = '<div id="' + tagId(u1) + '" ' + CONFIG.fileIconStyle + '></div>';
					}
					else {
						d = '<div class="notice-danger" >File missing: ' + d + '</div>'
					};
				}
				else {
				/*	switch (e) {
						case 'ole':
							// It is an ole-file, so add a preview image;
							// in case there is no preview image, the browser will display d holding the description
							// IE: works, if preview is PNG, but a JPG is not displayed (perhaps because of wrong type ...)
							// 		But in case of IE it appears that even with correct type a JPG is not shown by an <object> tag
							// ToDo: Check if there *is* a preview image and which type it has, use an <img> tag.
							if (f1.hasContent()) {
								hasImg = true;
							//	d = '<object data="'+u1.fileName()+'.png" type="image/png" >'+d+'</object>';
								d = '<img src="' + u1.fileName() + '.png" type="image/png" alt="' + d + '" />';
							}
							else {
								d = '<div class="notice-danger" >File missing: ' + d + '</div>'
							};
							// ToDo: Offer a link for downloading the file
							break;
						default:  */
							// last resort is to take the filename:
							d = '<span>' + d + '</span>';
						// ToDo: Offer a link for downloading the file
				//	};
				};

				// finally add the link and an enclosing div for the formatting:
				// avoid that a pattern is processed twice.

				// insert a placeholder and replace it with the prepared string at the end ...
				if (hasImg)
					repStrings.push(d)
				else
					repStrings.push('<a href="' + u1 + '"' + t1 + ' >' + d + '</a>');

				return 'aBra§kadabra' + (repStrings.length - 1) + '§';
			}
		);
//		console.debug('fileRef.toGUI 2: ', txt);

		// 3. process a single link:
		txt = txt.replace(RE.tagA,
			($0, $1, $2) => {
				var u1 = getPrpVal('href', $1),
					e = u1? u1.fileExt() : undefined;
//				console.debug( $1, $2, u1, e );
				if (!e) return $0     // no change, if no extension found

				/*	if( /(<object|<img)/g.test( $2 ) ) 
						return $0;		// no change, if an embedded object or image */

				if (CONFIG.officeExtensions.indexOf(e.toLowerCase()) < 0)
					return $0;	// no change, if not an office file

				// it is an office file, add an icon:
				var t1 = getType($1);
				if (!$2) {
					var d = u1.split('/');  // the last element is a filename with extension
					$2 = d[d.length - 1]   // $2 is now the filename with extension
				};
				//				u1 = addFilePath(u1);

				// add an icon:
				e = '<img src="' + CONFIG.imgURL + '/' + e + '-icon.png" type="image/png" />'

				// finally returned the enhanced link:
				return ('<a href="' + u1 + '" ' + t1 + ' target="_blank" >' + e + '</a>')
			}
		);
//		console.debug('fileRef.toGUI 3: ', txt);

		// Now, at the end, replace the placeholders with the respective strings,
		txt = txt.replace(/aBra§kadabra([0-9]+)§/g,
			// @ts-ignore - $0 is never read, but must be specified anyways
			($0, $1) => {
				return repStrings[$1]
			});
//		console.debug('fileRef.toGUI result: ', txt);
		return txt
	}
}
class CResourceToShow {
	id: string;
	class: SpecifKey;
	private pData: CCache;
	private rC: SpecifResourceClass;
	isHeading: boolean;
	order: string;
	revision?: string;
	replaces?: string[];
	title: CPropertyToShow;
	descriptions: CPropertyToShow[];
	other: CPropertyToShow[];
	changedAt: string;
	changedBy?: string;
	constructor(el: SpecifResource) {
		// add missing (empty) properties and classify properties into title, descriptions and other;
		// for resources.
		this.pData = app.cache.selectedProject.data;

		this.id = el.id;
		this['class'] = el['class'];
		this.rC = LIB.itemByKey(this.pData.resourceClasses, el['class']) as SpecifResourceClass;
		this.isHeading = false; // will be set further down if appropriate
		this.revision = el.revision;
		this.order = el.order;
		this.revision = el.revision;
		this.replaces = el.replaces;
		this.changedAt = el.changedAt;
		this.changedBy = el.changedBy;
		this.descriptions = [];

		// create a new list by copying the elements (do not copy the list ;-):
		this.other = this.normalizeProps(el);

		// Now, all properties are listed in this.other;
		// in the following, the properties used as title and description will be identified
		// and moved from this.other to this.title resp. this.descriptions:

		// a) Find and set the configured title:
		let a = LIB.titleIdx(this.other, this.pData);
		if (a > -1) {  // found!
			this.title = this.other.splice(a, 1)[0];
	/*	}
		else {
			// In certain cases (SpecIF hierarchy root, comment or ReqIF export),
			// there is no title propertyClass;
			// then create a property without class.
			// If the instance is a statement, a title is optional, so it is only created for resources (ToDo):
			// @ts-ignore - 'class' is omitted on purpose to indicate that it is an 'artificial' value
			this.title = { title: CONFIG.propClassTitle, value: el.title || '' }; */
		};
		this.isHeading = this.rC.isHeading
			|| CONFIG.headingProperties.indexOf(this.rC.title) > -1;

		// b) Check the configured descriptions:
		// We must iterate backwards, because we alter the list of other.
		// ToDo: use this.other.filter()
		for (a = this.other.length - 1; a > -1; a--) {
			if (CONFIG.descProperties.indexOf(this.other[a].title) > -1) {
				// To keep the original order of the properties, the unshift() method is used.
				this.descriptions.unshift(this.other.splice(a, 1)[0]);
			};
		};

	/*	// c) In certain cases (SpecIF hierarchy root, comment or ReqIF export),
		//    there is no description propertyClass;
		if (this.descriptions.length < 1 && el.description )
			this.descriptions.push(new CPropertyToShow({ title: CONFIG.propClassDesc, value: el.description }));  */
//		console.debug( 'classifyProps 2', simpleClone(this) );
	}
	private normalizeProps(el: SpecifResource): CPropertyToShow[] {
		// el: original instance (resource or statement)
		// Create a list of properties in the sequence of propertyClasses of the respective class.
		// Use those provided by the instance's properties and fill in missing ones with default (no) values.
		// Property classes must be unique!

		// check uniqueness of property classes:
		if (el.properties) {
			let idL: string[] = [],
				pCid: string;
			el.properties.forEach((p: SpecifProperty) => {
				pCid = p['class'].id;
				if (idL.indexOf(pCid)<0)
					idL.push(pCid);
				else
					console.warn('The property class ' + pCid + ' of element ' + el.id + ' is occurring more than once.');
			});
		};

		let p: SpecifProperty,
			pCs: SpecifKeys,
			nL: CPropertyToShow[] = [],
			// iCs: instance class list (resourceClasses or statementClasses),
			// the existence of subject (or object) let's us recognize that it is a statement:
		//	iCs = el.subject ? this.pData.statementClasses : this.pData.resourceClasses,
			iCs = this.pData.resourceClasses,
			iC = this.rC;
		// build a list of propertyClass identifiers including the extended class':
	//	pCs = iC._extends ? LIB.itemByKey(iCs, iC._extends).propertyClasses || [] : [];
	//	pCs = pCs.concat(LIB.itemByKey(iCs, el['class']).propertyClasses || []);
		pCs = iC._extends ? LIB.itemByKey(iCs, iC._extends).propertyClasses : [];
		pCs = pCs.concat(iC.propertyClasses);
		// add the properties in sequence of the propertyClass identifiers:
		pCs.forEach((pC: SpecifKey):void => {
			// skip hidden properties:
			if (CONFIG.hiddenProperties.indexOf(pC.id) > -1) return;
			// assuming that the property classes are unique:
			p = LIB.itemBy(el.properties, 'class', pC)
				|| LIB.createProp(this.pData.propertyClasses, pC);
			if (p) {
				nL.push(new CPropertyToShow(p));
			}
		});
//		console.debug('normalizeProps result',simpleClone(nL));
		return nL; // normalized property list
	}
	isEqual(res: SpecifResource): boolean {
		return res && this.id == res.id && this.changedAt == res.changedAt;
    }
	isUserInstantiated(): boolean {
		return (!Array.isArray(this['class'].instantiation)
			|| this['class'].instantiation.indexOf(SpecifInstantiation.User) > -1)
	}
	private renderAttr(lbl: string, val: string, cssCl: string): string {
		// show a string value with or without label:
		// ToDo: Create a class for attributes ..
		cssCl = cssCl ? ' ' + cssCl : '';
		if (typeof (val) == 'string')
			val = LIB.noCode(val)
		else val = '';

		// assemble a label:value pair resp. a wide value field for display:
		val = (lbl ? '<div class="attribute-label" >' + lbl + '</div><div class="attribute-value" >' : '<div class="attribute-wide" >') + val + '</div>';
		return '<div class="attribute' + cssCl + '">' + val + '</div>';
	}
	renderTitle(opts?: any): string {
//		console.debug('renderTitle', simpleClone(this), simpleClone(this.title),opts);
		if (!this.title || !this.title.values) return '';
		// Remove all formatting for the title, as the app's format shall prevail.
		// ToDo: remove all marked deletions (as prepared be diffmatchpatch), see deformat()
		// Assuming that a title property has only a single value:
		let ti = LIB.languageValueOf(this.title.values[0], opts);
		if (this.isHeading) {
			// lookup titles only, if it is a heading; those may have vocabulary terms to translate;
			// whereas the individual elements may mean the vocabulary term as such (example: vocabulary):
			if (opts && opts.lookupTitles)
				ti = i18n.lookup(ti);
			// it is assumed that a heading never has an icon:
			return '<div class="chapterTitle" >' + (this.order ? this.order + '&#160;' : '') + ti + '</div>';
		};
		// else: is not a heading:
		// take title and add icon, if configured:
		return '<div class="objectTitle" >' + (CONFIG.addIconToInstance ? LIB.addIcon(ti, this['class'].icon) : ti) + '</div>';
	}
	renderChangeInfo(): string {
		if (!this.revision) return '';  // the view may be faster than the data, so avoid an error
		var chI = '';
		switch (app.specs.selectedView()) {
			case '#' + CONFIG.objectRevisions:
				chI = this.renderAttr(i18n.LblRevision, this.revision, 'attribute-condensed');
				// no break
			case '#' + CONFIG.comments:
				chI += this.renderAttr(i18n.LblModifiedAt, LIB.localDateTime(this.changedAt), 'attribute-condensed')
					+ this.renderAttr(i18n.LblModifiedBy, this.changedBy, 'attribute-condensed');
			//	default: no change info!			
		};
		return chI;
	}
	listEntry(options?: any): string {
		if (!this.id) return '<div class="notice-default">' + i18n.MsgNoObject + '</div>';
		// Create HTML for a list entry:

		var opts = options ? simpleClone(options) : {};
		opts.targetLanguage = browser.language;
		opts.titleLinking
			= opts.clickableElements
			= opts.linkifyURLs
			= ['#' + CONFIG.objectList, '#' + CONFIG.objectDetails].indexOf(app.specs.selectedView()) > -1;
		// ToDo: Consider to make it a user option:
		opts.unescapeHTMLTags = true;
		// ToDo: Make it a user option:
		opts.makeHTML = true;
		opts.lookupValues = true;
		opts.lookupTitles = true;
		opts.rev = this.revision;

		var rO = '<div class="listEntry">'
			+ '<div class="content-main">';

		// 1 Fill the main column:
		// 1.1 The title:
		switch (app.specs.selectedView()) {
			case '#' + CONFIG.objectFilter:
			case '#' + CONFIG.objectList:
				// move item to the top, if the title is clicked:
				rO += '<div onclick="app.specs.itemClicked(\'' + this.id + '\')">'
					+ this.renderTitle(opts)
					+ '</div>';
				break;
			default:
				rO += this.renderTitle(opts);
		};

		// 1.2 The description properties:
		this.descriptions.forEach((prp: CPropertyToShow): void => {
			if (prp.isVisible(opts)) {
				rO += '<div class="attribute attribute-wide">' + prp.get(opts) + '</div>'
			}
		});
		rO += '</div>'  // end of content-main
			+ '<div class="content-other">';

		/*	// 2 Add elementActions:
			switch( app.specs.selectedView() ) {
				case '#'+CONFIG.comments:
					rO += 	'<div class="btn-group btn-group-xs" style="margin-top:3px; position:absolute;right:1.6em" >';
					if( this.del )
						rO +=	'<button onclick="app.specs.delComment(\''+this.id+'\')" class="btn btn-danger" >'+i18n.IcoDelete+'</button>'
					else
						rO +=	'<button disabled class="btn btn-default btn-xs" >'+i18n.IcoDelete+'</button>';
					rO +=	'</div>'
			//		break;
			//	default:
					// nothing, so far
			}; */

		// 3 Fill a separate column to the right
		// 3.1 The remaining properties:
		this.other.forEach((prp: CPropertyToShow): void => {
			if (prp.isVisible(opts)) {
				rO += this.renderAttr(LIB.titleOf(prp, opts), prp.get(opts), 'attribute-condensed');
			};
		});
		// 3.2 The type info:
		// 3.3 The change info depending on selectedView:
		rO += this.renderChangeInfo();
		rO += '</div>'	// end of content-other
			+ '</div>';  // end of listEntry

		return rO;  // return rendered resource for display
	}
/*	self.details = function() {
		// for the list view, where title and text are shown in the main column and the others to the right.
		if( !this.id ) return '<div class="notice-default">'+i18n.MsgNoObject+'</div>';
	
		// Create HTML for a detail view:
		// 1 The title:
		var rO = this.renderTitle( opts );
		// 2 The description properties:
		this.descriptions.forEach( function(prp) {
//			console.debug('details.descr',prp.value);
			if( LIB.hasContent(prp.value) ) {
				var opts = {
				//		titleLinking: [CONFIG.objectList, CONFIG.objectDetails].indexOf(app.specs.selectedView())>-1,
						titleLinking: true,
						clickableElements: true,
						linkifyURLs: true
					};
				rO += 	'<div class="attribute attribute-wide">'+propertyValueOf(self.toShow,prp,opts)+'</div>'
			}
		});
		// 3 The remaining properties:
		this.other.forEach( function( prp ) {
//			console.debug('details.other',prp.value);
			rO += this.renderAttr( LIB.titleOf(prp,opts), propertyValueOf(self.toShow,prp,opts) )
		});
		// 4 The type info:
		rO += this.renderAttr( i18n.lookup("SpecIF:Type"), LIB.titleOf( self.toShow['class'], opts ) );
		// 5 The change info depending on selectedView:
		rO += this.renderChangeInfo();
//		console.debug( 'CResource.details', self.toShow, rO );
		return rO  // return rendered resource for display
	};  */
}

/*	function deformat( txt ) {
		// Remove all HTML-tags from 'txt',
		// but keep all marked deletions and insertions (as prepared be diffmatchpatch):
		// ToDo: consider to use this function only in the context of showing revisions and filter results,
		// 		 ... and to use a similar implementation which does not save the deletions and insertions, otherwise.
		let mL = [], dL = [], iL = [];
		txt = txt.replace(/<del[^<]+<\/del>/g, function($0) {
										dL.push($0);
										return 'hoKu§pokus'+(dL.length-1)+'#'
									});
		txt = txt.replace(/<ins[^<]+<\/ins>/g, function($0) {
										iL.push($0);
										return 'siM§alabim'+(iL.length-1)+'#'
									});
		txt = txt.replace(/<mark[^<]+<\/mark>/g, function($0) {
										mL.push($0);
										return 'abRakad@bra'+(mL.length-1)+'#'
									});
		// Remove all formatting for the title, as the app's format shall prevail:
		txt = stripHTML(txt);
		// Finally re-insert the deletions and insertions with their tags:
		// ToDo: Remove any HTML-tags within insertions and deletions
		if(mL.length) txt = txt.replace( /abRakad@bra([0-9]+)#/g, function( $0, $1 ) { return mL[$1] });
		if(iL.length) txt = txt.replace( /siM§alabim([0-9]+)#/g, function( $0, $1 ) { return iL[$1] });
		if(dL.length) txt = txt.replace( /hoKu§pokus([0-9]+)#/g, function( $0, $1 ) { return dL[$1] });
		return txt
	}  */
class CResourcesToShow {
	private opts = {
		lookupTitles: true,
		targetLanguage: browser.language
	};
	values: CResourceToShow[];

	constructor() {
		this.values = [];
	}
	push(r: SpecifResource): boolean {
		// append a resource to the list:
		this.values.push(new CResourceToShow(r));
		return true;  // a change has been effected
	}
	append(rL: SpecifResource[]): void {
		// append a list of resources:
		rL.forEach((r) => {
			this.push(r);
		});
		return true;  // a change has been effected
	}
	set(idx:number, r: SpecifResource): boolean {
		if (this.values[idx].isEqual(r)) {
			// assume that no change has happened:
//			console.debug('object.set: no change');
			return false;  // no change
		};
		this.values[idx] = new CResourceToShow(r);
		return true;		// has changed
	}
	update(rL: SpecifResource[]): boolean {
		// update this.values with rL and return 'true' if a change has been effected:
		if (rL.length == this.values.length) {
			// there is a chance no change is necessary:
			var chg = false;
			for (var i = rL.length - 1; i > -1; i--)
				// set() must be on the left, so that it is executed for every list item:
				chg = this.set(i,rL[i]) || chg;
			return chg;
		}
		else {
			// there will be a change anyways:
			this.values.length = 0;
			this.append(rL);
			return true;
		};
	}
	updateSelected(r: SpecifResource): boolean {
		// update the first item (= selected resource), if it exists, or create it;
		// return 'true' if a change has been effected:
		if (this.values.length > 0)
			return this.set(0,r);
		else
			return this.push(r);
	}
	selected(): CResourceToShow {
		// return the selected resource; it is the first in the list by design:
		return this.values[0];
	}
	exists(rId: string): boolean {
		for (var i = this.values.length - 1; i > -1; i--)
			if (this.values[i].id == rId) return true;
		return false;
	}
	render(): string {
		// generate HTML representing the resource list:
		if (this.values.length < 1)
			return '<div class="notice-default" >' + i18n.MsgNoMatchingObjects + '</div>';
		// else:
		var rL = '';
		// render list of resources
		this.values.forEach((v: CResourceToShow) => {
			rL += v ? v.listEntry(this.opts) : '';
		});
		return rL;	// return rendered resource list
	}
}
class CFileWithContent implements IFileWithContent {
	// @ts-ignore - presence of 'title' is checked by the schema on import
	title: SpecifMultiLanguageText[] | string;
	description?: SpecifMultiLanguageText[] | string;
	// @ts-ignore - presence of 'type' is checked by the schema on import
	type: string;
	blob?: Blob;
	dataURL?: string;
	// @ts-ignore - presence of 'id' is checked by the schema on import
	id: string;
	replaces?: string[];
	revision?: string;
	// @ts-ignore - presence of 'changedAt' is checked by the schema on import
	changedAt: string;
	changedBy?: string;
	constructor(f: IFileWithContent) {
		// @ts-ignore - index is ok:
		for (var a in f) this[a] = f[a];
    }
	hasBlob(): boolean {
		return this.blob && this.blob.size > 0;
	}
	hasDataURL(): boolean {
		return this.dataURL && this.dataURL.length > 0;
	}
	hasContent(): boolean {
		return this.hasBlob() || this.hasDataURL();
	}
	renderDownloadLink(txt: string, opts?: any): void {
		function addL(r: string, fTi: string, fTy: string): void {
			// add link with icon to DOM using an a-tag with data-URL:
			document.getElementById(tagId(fTi)).innerHTML =
				'<a href="' + r + '" type="' + fTy + '" download="' + fTi + '" >' + txt + '</a>';
		}

		// Attention: the element with id 'f.id' has not yet been added to the DOM when execution arrives here;
		// increase the timelag between building the DOM and rendering the images, if necessary.
		if (typeof (opts) != 'object') opts = {};
		if (typeof (opts.timelag) != 'number') opts.timelag = CONFIG.imageRenderingTimelag;

		// Add the download link of the attachment as innerHTML:
		// see: https://developer.mozilla.org/en-US/docs/Web/API/File/Using_files_from_web_applications
		// see: https://blog.logrocket.com/programmatic-file-downloads-in-the-browser-9a5186298d5c/ 
		if (this.hasBlob())
			LIB.blob2dataURL(this, addL, opts.timelag);
		else
			// assuming that dataURL has content:
			setTimeout(() => { addL(this.dataURL,this.title,this.type) }, opts.timelag);
	}
	renderImage(opts?: any): void {

		// Attention: the element with id 'this.id' has not yet been added to the DOM when execution arrives here;
		// increase the timelag between building the DOM and rendering the images, if necessary.
		if (typeof (opts) != 'object') opts = {};
		if (typeof (opts.timelag) != 'number') opts.timelag = CONFIG.imageRenderingTimelag;

		if (!this.blob && !this.dataURL) {
			setTimeout(() => {
				Array.from(document.getElementsByClassName(tagId(this.title)),
					(el) => { el.innerHTML = '<div class="notice-danger" >Image missing: ' + this.title + '</div>' }
				);
			}, opts.timelag)
			return;
		};
		// ToDo: in case of a server, the blob itself must be fetched first ...

		if (this.dataURL) {
			setTimeout(() => {
				// add image to DOM using an image-tag with data-URI:
				Array.from(document.getElementsByClassName(tagId(this.title)),
					(el) => {
						let ty = /data:([^;]+);/.exec(this.dataURL);
						el.innerHTML = '<object data="' + this.dataURL
							+ '" type="' + (ty[1] || this.type) + '"'
							/*		+ (opts.w ? ' ' + opts.w : '')
									+ (opts.h ? ' ' + opts.h : '') */
							+ ' >' + this.title + '</object>';
					});
			}, opts.timelag);
			return;
		};
		// else: the data is a blob

		switch (this.type) {
			case 'image/png':
			case 'image/x-png':
			case 'image/jpeg':
			case 'image/jpg':
			case 'image/gif':
				this.showRaster(opts);
				break;
			case 'image/svg+xml':
				this.showSvg(opts);
				break;
			case 'application/bpmn+xml':
				this.showBpmn(opts);
				break;
			default:
				console.warn('Cannot show diagram ' + this.title + ' of unknown type: ', this.type);
		};
	//	return undefined;
	// end of renderImage()
	};
	private showRaster(opts: any): void {
		LIB.blob2dataURL(this, (r: string, fTi: string, fTy: string): void => {
			// add image to DOM using an image-tag with data-URI:
			Array.from(document.getElementsByClassName(tagId(fTi)),
				(el) => {
					el.innerHTML = '<img src="' + r
						+ '" type="' + fTy + '"'
						/*		+ (opts.w ? ' ' + opts.w : '')
								+ (opts.h ? ' ' + opts.h : '') */
						+ ' alt="' + fTi + '" />';
					/*	// set a grey background color for images with transparency:
						(el)=>{el.innerHTML = '<img src="'+r+'" type="'+fTy+'" alt="'+fTi+'" style="background-color:#DDD;"/>'} */
				}
			);
		}, opts.timelag);
	}
	private showSvg(opts: any): void {
		// Read and render SVG:
		LIB.blob2text(this, displaySVGeverywhere, opts.timelag)
		return;

		function itemBySimilarId(L: any[], id: string):any | undefined {
			// return the list element having an id similar to the specified one:
			id = id.trim();
			for (var i = L.length - 1; i > -1; i--)
				// is id a substring of L[i].id?
				// @ts-ignore - L[i] does exist, if execution gets here
				if (L[i].id.indexOf(id) > -1) return L[i];   // return list item
			//	return undefined
		}
		function itemBySimilarTitle(L: SpecifItem[], ti: string): SpecifItem|undefined {
			// return the list element having a title similar to the specified one:
			ti = ti.trim();
			for (var i = L.length - 1; i > -1; i--)
				// is ti a substring of L[i].title?
				// @ts-ignore - L[i] does exist, if execution gets here
				if (L[i].title.indexOf(ti) > -1) return L[i];   // return list item
			//	return undefined
		}
		//	function displaySVGeverywhere(r,fTi,fTy) {
		function displaySVGeverywhere(r: string, fTi: string): void {
			// Load pixel images embedded in SVG,
			// see: https://stackoverflow.com/questions/6249664/does-svg-support-embedding-of-bitmap-images
			// see: https://css-tricks.com/lodge/svg/09-svg-data-uris/
			// see: https://css-tricks.com/probably-dont-base64-svg/
			// view-source:https://dev.w3.org/SVG/profiles/1.1F2/test/svg/struct-image-04-t.svg
			let svg = {
					// the locations where the svg shall be added:
					locs: document.getElementsByClassName(tagId(fTi)),
					// the SVG image with or without embedded images:
					img: r
				},
				dataURLs:any[] = [],	// temporary list of embedded images
				// RegExp for embedded images,
				// e.g. in ARCWAY-generated SVGs: <image x="254.6" y="45.3" width="5.4" height="5.9" xlink:href="name.png"/>
				rE = /(<image .* xlink:href=\")(.+)(\".*\/>)/g,
				ef: CFileWithContent,
				mL:string[],
				pend = 0;		// the count of embedded images waiting for transformation

			// process all image references within the SVG image one by one:
			// see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec
			while ((mL = rE.exec(r)) != null) {
				// skip all images already provided as data-URLs:
				if (mL[2].startsWith('data:')) continue;
				// avoid transformation of redundant images:
				if (LIB.indexById(dataURLs, mL[2]) > -1) continue;
				ef = itemBySimilarTitle(app.cache.selectedProject.data.files, mL[2]);
				if (ef && ef.blob) {
					pend++;
//					console.debug('SVG embedded file',mL[2],ef,pend);
					// transform file to data-URL and display, when done:
					LIB.blob2dataURL(ef, (r: string, fTi: string): void => {
						dataURLs.push({
							id: fTi,
							val: r
						});
//						console.debug('last dataURL',pend,dataURLs[dataURLs.length-1],svg);
						if (--pend < 1) {
							// all embedded images have been transformed,
							// replace references by dataURLs and add complete image to DOM:
							// @ts-ignore - $0 is never read, but must be specified anyways
							svg.img = svg.img.replace(rE, ($0, $1, $2, $3) => {
								let dURL = itemBySimilarId(dataURLs, $2);
								// replace only if dataURL is available:
								return dURL ? $1 + dURL.val + $3 : "";
							});
							displayAll(svg);
						};
					});
				};
			};
			if (pend < 1) {
				// there are no embedded images, so display right away:
				displayAll(svg);
			};
			return;

			function displayAll(svg): void {
				Array.from(svg.locs,
					(loc) => {
						loc.innerHTML = svg.img;
						if (opts && opts.clickableElements) registerClickEls(loc)
					}
				);
			}
		}
		// see http://tutorials.jenkov.com/svg/scripting.html
		function registerClickEls(svg): void {
			if (!CONFIG.clickableModelElements || CONFIG.clickElementClasses.length < 1) return;
//			console.debug('registerClickEls',svg);
			addViewBoxIfMissing(svg);

			// now collect all clickable elements:
			svg.clkEls = [];
			// For all elements in CONFIG.clickElementClasses:
			// Note that .getElementsByClassName() returns a HTMLCollection, which is not an array and thus has neither concat nor slice methods.
			// 	Array.prototype.slice.call() converts the HTMLCollection to a regular array, 
			//  see http://stackoverflow.com/questions/24133231/concatenating-html-object-arrays-with-javascript
			// 	Array.from() converts the HTMLCollection to a regular array, 
			//  see https://hackernoon.com/htmlcollection-nodelist-and-array-of-objects-da42737181f9
			CONFIG.clickElementClasses.forEach((cl:string) => {
				svg.clkEls = svg.clkEls.concat(Array.from(svg.getElementsByClassName(cl)));
			});
//			console.debug(svg.clkEls, typeof(svg.clkEls))
			svg.clkEls.forEach((clkEl) => {
				// set cursor for clickable elements:
				clkEl.setAttribute("style", "cursor:pointer;");

				// see https://www.quirksmode.org/js/events_mouse.html
				// see https://www.quirksmode.org/dom/events/
				clkEl.addEventListener("dblclick",
					// do *not* define the handler using ()=>{}, because 'this' is undefined in the function body:
					function () {
						// ToDo: So far, this only works with ARCWAY generated SVGs.
						let eId = this.className.baseVal.split(' ')[1];		// ARCWAY-generated SVG: second class is element id
						// If there is a diagram with the same name as the resource with eId, show it (unless it is currently shown):
						eId = correspondingPlan(eId);
						// delete the details to make sure that images of the click target are shown,
						// otherwise there will be more than one image container with the same id:
						$("#details").empty();
						app.specs.showTree.set();
						// jump to the click target:
						app.specs.tree.selectNodeByRef(eId, true);  // true: 'similar'; id must be a substring of nd.ref
						// ToDo: In fact, we are either in CONFIG.objectDetails or CONFIG.objectList
						document.getElementById(CONFIG.objectList).scrollTop = 0;
					}
				);

				// Show the description of the element under the cursor to the left:
				clkEl.addEventListener("mouseover",
					// do *not* define the handler using ()=>{}, because 'this' is undefined in the function body:
					function () {
						// ToDo: So far, this only works with ARCWAY generated SVGs.
						//	evt.target.setAttribute("style", "stroke:red;"); 	// works, but is not beautiful
						let eId = this.className.baseVal.split(' ')[1],		// id is second class
							clsPrp = new CResourceToShow(itemBySimilarId(app.cache.selectedProject.data.resources, eId)),
							ti = LIB.languageValueOf(clsPrp.title.values[0], { targetLanguage: browser.language }),
							dsc = '';
						clsPrp.descriptions.forEach((d) => {
							// to avoid an endless recursive call, the property shall neither have titleLinks nor clickableElements
							dsc += d.get({ unescapeHTMLTags: true, makeHTML: true })
						});
						// display details only, if there is a description - so no titles without description:
						if (dsc.stripCtrl().stripHTML()) {
							// Remove the dynamic linking pattern from the text:
							$("#details").html('<div style="font-size:120%;margin-bottom:0.3em">'
								+ (CONFIG.addIconToInstance ? LIB.addIcon(ti, clsPrp['class'].icon) : ti)
								+ '</div>'
								+ dsc);
							app.specs.showTree.set(false);
						}
					}
				);
				clkEl.addEventListener("mouseout",
					function () {
						//	evt.target.setAttribute("style", "cursor:default;"); 
						$("#details").empty();
						app.specs.showTree.set();
					}
				);
			});
			return svg;

			function correspondingPlan(id: string): string {
				// In case a graphic element is clicked, usually the resp. element (resource) with it's properties is shown.
				// This routine checks whether there is a plan with the same name to show that plan instead of the element.
				if (CONFIG.selectCorrespondingDiagramFirst) {
					// replace the id of a resource by the id of a diagram carrying the same title:
					let cacheData = app.cache.selectedProject.data,
						ti = LIB.elementTitleOf(itemBySimilarId(cacheData.resources, id), opts),
						rT: SpecifResourceClass;
					for (var i = cacheData.resources.length - 1; i > -1; i--) {
						rT = LIB.itemByKey(cacheData.resourceClasses, cacheData.resources[i]['class']);
						if (CONFIG.diagramClasses.indexOf(rT.title) < 0) continue;
						// else, it is a resource representing a diagram:
						if (LIB.elementTitleOf(cacheData.resources[i], opts) == ti) {
							// found: the diagram carries the same title 
							if (app[CONFIG.objectList].resources.selected()
								&& app[CONFIG.objectList].resources.selected().id == cacheData.resources[i].id)
								// the searched plan is already selected, thus jump to the element: 
								return id;
							else
								return cacheData.resources[i].id;	// the corresponding diagram's id
						};
					};
				};
				return id;	// no corresponding diagram found
			}
			// Add a viewBox in a SVG, if missing (e.g. in case of BPMN diagrams from Signavio and Bizagi):
			// see: https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/viewBox
			// see: https://webdesign.tutsplus.com/tutorials/svg-viewport-and-viewbox-for-beginners--cms-30844
			// see: https://www.mediaevent.de/tutorial/svg-viewbox-koordinaten.html
			function addViewBoxIfMissing(svg): void {
				let el;
				for (var i = 0, I = svg.childNodes.length; i < I; i++) {
					el = svg.childNodes[i];
//					console.debug('svg',svg,el,el.outerHTML);
					// look for '<svg .. >' tag with its properties, often but not always the first child node:
					if (el && el.outerHTML && el.outerHTML.startsWith('<svg')) {
						if (el.getAttribute("viewBox")) return;  // all is fine, nothing to do

						// no viewbox property, so add it:
						let w = el.getAttribute('width').replace(/px$/, ''),
							h = el.getAttribute('height').replace(/px$/, '');
						/*	// get rid of 'px':
							// ToDo: perhaps this is a little too simple ...
							if( w.endsWith('px') ) w = w.slice(0,-2);
							if( h.endsWith('px') ) h = h.slice(0,-2); */
						el.setAttribute("viewBox", '0 0 ' + w + ' ' + h);
						return;
					};
				};
			}
		}
	}
	private showBpmn(opts: any): void {
		// Read and render BPMN:
		LIB.blob2text(this, (t: string, fTi: string) => {
			bpmn2svg(t)
				.then(
					(result) => {
//						console.debug('SVG',result);
						Array.from(document.getElementsByClassName(tagId(fTi)),
							(el) => { el.innerHTML = result.svg }
						);
					},
					(err) => {
						console.error('BPMN-Viewer could not deliver SVG', err);
					}
				);
		}, opts.timelag);
	}
}

// Construct the specifications controller:
moduleManager.construct({
	name: CONFIG.specifications
}, (self: ISpecs) =>{
	// This module and view is responsible for the selection tabs and the navigation tree which are shared by several sub-views.
	
	let myName = self.loadAs,
		myFullName = 'app.'+myName;

	self.selectedView = ():string =>{
//		console.debug('selectedView',self.ViewControl.selected.view);
		return self.ViewControl.selected.view;
	};
	self.emptyTab = ( tab:string ):void =>{
		app.busy.reset();
	//	$( '#specNotice' ).empty();
		// but show the buttons anyways, so the user can create the first resource:
	//	$( '#specActions' ).empty();
		$( tab ).empty();
	};

	// standard module interface:
	self.init = ():boolean =>{
		// initialize the module:
//		console.debug( 'specs.init', self );
		
		//  Add the left panel for tree or details and the up/down buttons to the DOM:
		let h = '<div id="specLeft" class="paneLeft" style="position:relative">'
			+ '<div id="navBtns" class="btn-group-vertical btn-group-sm" style="position:absolute;top:4px;right:12px;z-index:900">'
			+ '<button class="btn btn-default" onclick="' + myFullName + '.tree.moveUp()" data-toggle="popover" title="' + i18n.LblPrevious + '" >' + i18n.IcoPrevious + '</button>'
			+ '<button class="btn btn-default" onclick="' + myFullName + '.tree.moveDown()" data-toggle="popover" title="' + i18n.LblNext + '" >' + i18n.IcoNext + '</button>'
			+ '</div>'
			+	'<div id="hierarchy" class="pane-tree" ></div>'
			+	'<div id="details" class="pane-details" ></div>'
			+ '</div>';
		/*	+ '<div id="specCtrl" class="contentCtrl" >'
		//	+	'<div id="specNotice" class="contentNotice" ></div>'
		//	+	'<div id="specActions" class="btn-group contentActions" ></div>'
		//	+ '</div>'; */
		if (self.selector)
			$(self.selector).after(h);
		else
			$(self.view).prepend(h);

		// Construct jqTree,
		// holds the hierarchy tree (or outline):
		self.tree = new Tree({
			loc: '#hierarchy',
			dragAndDrop: app.title!=i18n.LblReader,
			eventHandlers: {
				// some of the events as defined by jqTree with their handlers:
				'select':  
					// when a node is clicked or traversed by up/down keys
					(event):void =>{  // The clicked node is 'event.node'
						// just update the node handle (don't use self.tree.selectNode() ... no need to update the tree ;-):
//						console.debug('tree.select',event);
						self.tree.selectedNode = event.node;
						// @ts-ignore - ElementById 'CONFIG.objectList' does exist
						document.getElementById(CONFIG.objectList).scrollTop = 0;
						self.refresh()
					},
				'open':
					// when a node is opened, but not when an opened node receives an open command
					():void =>{  // The clicked node is 'event.node', but we don't care
						// refresh is only needed in document view:
//						console.debug('tree.open',event);
						if( self.selectedView()=='#'+CONFIG.objectList ) self.refresh()
					},
				'close':
					// when a node is closed, but not when a closed node receives a close command
					():void =>{  // The clicked node is 'event.node', but we don't care
						// refresh is only needed in document view:
//						console.debug('tree.close',event);
						if( self.selectedView()=='#'+CONFIG.objectList ) self.refresh()
					},
				'move':
					(event):void =>{
						// event: A node, potentially with children, has been moved by drag'n'drop.

						interface ITargetNode {
							parent?: string;
							predecessor?: string;
                        }
						function moveNode(movedNd, target: ITargetNode ):void {
//								console.debug( 'move: ', movedNd.name, target );
								let chd = new Date().toISOString();
								app.cache.selectedProject.createContent( 'node', toSpecIF(movedNd,target) )
								.then( 
									()=>{
										self.tree.numberize();
//										console.debug( self.tree.selectedNode.name, event.move_info.moved_node.name );
										// @ts-ignore - ElementById 'CONFIG.objectList' does exist
										document.getElementById(CONFIG.objectList).scrollTop = 0;
										self.refresh();
									},
									LIB.stdError 
								);
								return;

								function toSpecIF(mNd: jqTreeNode, tgt: ITargetNode): INodeWithPosition {
									// transform from jqTree node to SpecIF node:
									var nd: INodeWithPosition = {
										//	id: LIB.genID('N-'),
											id: mNd.id,
											resource: mNd.ref,
											changedAt: chd
										},
										ch = mNd.children.map( toSpecIF );
									if( ch.length>0 ) nd.nodes = ch;
									// copy predecessor or parent:
									if (tgt)
										// @ts-ignore - index is ok:
										for (var p in tgt) { nd[p] = tgt[p].id };
									return nd;
								}
							}
						
						app.busy.set();
						// 1. Delete the moved node with all its children:
						app.cache.selectedProject.deleteContent( 'node', LIB.keyOf(event.move_info.moved_node) )
						.then( 
							()=>{
//								console.debug('delete node done',event)
								// 2. Move the entry including any sub-tree to the new position
								//  - Update the server, where the tree entries get new ids.
								//  - Update the moved tree entries with the new id corresponding with the server.
								let are = /after/,
									ire = /inside/;
								if( are.test(event.move_info.position) ) {
									// (a) event.move_info.position=='position after': 
									//     The node is dropped between two nodes.
									moveNode( event.move_info.moved_node, {predecessor:event.move_info.target_node} );
								}
								else if (ire.test(event.move_info.position)) {
									// (b) event.move_info.position=='position inside': 
									//     The node is dropped on a target node without children or before the first node in a folder.
									moveNode( event.move_info.moved_node, {parent:event.move_info.target_node} );
								}
								else {
									// (c) event.move_info.position=='position before': 
									//     The node is dropped before the first node in the tree:
									moveNode( event.move_info.moved_node, {parent:event.move_info.target_node.parent} );
								};
							},
							LIB.stdError 
						);
					}
			}
		});
		// controls whether the left panel with the tree or details is shown or not:
		self.showLeft = new State({
			showWhenSet: ['#specLeft'],
			hideWhenSet: []
		});
		// controls whether the left panel shows tree or details (when showLeft is true):
		self.showTree = new State({
			showWhenSet: ['#hierarchy','#navBtns'],
			hideWhenSet: ['#details']
		});
	//	self.typesComment = null;
	//	self.typesComment = new StdTypes( app.cache.selectedProject.data, new CommentTypes() );  // types needed for commenting, defined in stdTypes-*.js
	//	self.dmp = new diff_match_patch();	// to compare the revisions and mark changes
		refreshReqCnt = 0;
		
		return true;
	};
	self.clear = ():void =>{
		self.tree.clear();
		refreshReqCnt = 0;
		app.cache.clear();
		app.busy.reset();
	};
	// module entry 'self.show()' see further down
	// module exit;
	// called by the parent's view controller:
	self.hide = ():void =>{
//		console.debug( 'specs.hide' );
		// don't delete the page with $(self.view).empty(), as the structure is built in init()
		app.busy.reset();
	}; 

/*	function handleError(xhr:xhrMessage):void {
		console.debug( 'handleError', xhr );
		self.clear();
		switch( xhr.status ) {
			case 0:
			case 200:
			case 201:
				return; // some calls end up in the fail trail, even though all went well.
			default:
				LIB.stdError(xhr);
		}
	} 
	function setPermissions( nd ) {
			function noPerms() {
				self.resCln = false;
				self.staCre = false;
			}
		if( !nd ) { noPerms(); return };
		
		var r = LIB.itemById( app.cache.selectedProject.data.resources, nd.ref );
		if( r ) {
			// self.resCre is set when resCreClasses are filled ...
			self.resCln = self.resCreClasses.indexOf( r['class'] )>-1;
			// give permission to an admin, anyway:
//			self.resCln = ( LIB.indexById( self.resCreClasses, r['class'] )>-1 || me.isAdmin(app.cache.selectedProject.data) )

			// Set the permissions to enable or disable the create statement buttons;
			// a statement can be created, if the selected resource's type is listed in subjectClasses or objectClasses of any statementClass:
				function mayHaveStatements( selR ) {
//					if( selR ) console.debug( 'selR', selR );
//					console.debug( 'staCreClasses', self.staCreClasses );
					// iterate all statements for which the user has instantiation rights
					var creR = null;  
					self.staCreClasses.forEach( function(sT) {   
						creR = LIB.itemById( app.cache.selectedProject.data.statementClasses, sT );
//						console.debug( 'mayHaveStatements', self.staCreClasses[s], creR, selR['class'] );
						if( 
							// if creation mode is not specified or 'user' is listed, the statement may be applied to this resource:
							( !creR.instantiation || creR.instantiation.indexOf( 'user' )>-1 )
							// if subjectClasses or objectClasses are not specified or the type of the selected resource is listed, the statement may be applied to this resource:
							&& ((!creR.subjectClasses || creR.subjectClasses.indexOf( selR['class'] )>-1 
								|| !creR.objectClasses || creR.objectClasses.indexOf( selR['class'] )>-1 ))
						) return true   // at least one statement is available for this resource for which the user has creation rights
					});
					return false  // no statement is available for this resource for which the user has creation rights
				};
			self.staCre = mayHaveStatements( r )
		} 
		else {
			noPerms()
		}
	}  */

	self.updateTree = function ( opts:any, spc? ):void {
		// Load the SpecIF hierarchies to a jqTree,
		// a dialog (tab) with the tree (#hierarchy) must be visible.

		// undefined parameters are replaced by default values:
		if( !spc ) spc = self.pData.hierarchies;
//		console.debug( 'updateTree', simpleClone(spc), simpleClone(self.pData), opts );

		let tr;
		// Replace the tree:
		if( Array.isArray( spc ) )
			tr = LIB.forAll( spc, toChild );
		else
			tr = [toChild(spc)];
		
		// load the tree:
		self.tree.saveState();
		self.tree.set(tr);
		self.tree.numberize();
		self.tree.restoreState();
		return;

		// -----------------
		function toChild( iE ) {
			// transform SpecIF hierarchy to jqTree:
			let r:SpecifResource = LIB.itemByKey( self.pData.resources, iE.resource );
//			console.debug('toChild',iE.resource,r);
			var oE:jqTreeNode = {
				id: iE.id,
				// ToDo: take the referenced resource's title, replace XML-entities by their UTF-8 character:
				name: LIB.elementTitleOf(r,opts,self.pData), 
				ref: iE.resource
			};
			oE.children = LIB.forAll( iE.nodes, toChild );
			return oE;
		}
	};

	// The module entry;
	// called by the parent's view controller:
	self.show = function( opts:any ):void {
//		console.debug( CONFIG.specifications, 'show', opts );
		if( !(app.cache.selectedProject && app.cache.selectedProject.isLoaded() ) )
			throw Error("No selected project on entry of spec.show()");
		
		$('#pageTitle').html( app.cache.selectedProject.title );
		app.busy.set();
	//	$( self.view ).html( '<div class="notice-default">'+i18n.MsgInitialLoading+'</div>' );
	//	$('#specNotice').empty();

 		let uP = opts.urlParams,
			fNd = self.tree.firstNode(),
			nd: jqTreeNode;
		self.pData = app.cache.selectedProject.data;

		// Select the language options at project level, also for subordinated views such as filter and reports:
		self.targetLanguage = opts.targetLanguage = browser.language;
		opts.lookupTitles = true;
				
		// Initialize the tree, unless
		// - URL parameters are specified where the project is equal to the loaded one
		// - just a view is specifed without URL parameters (coming from another page)
		if( !fNd
			|| !self.pData.has("resource", [fNd.ref] )  // condition is probably too weak
			|| uP && uP[CONFIG.keyProject] && uP[CONFIG.keyProject]!=app.cache.selectedProject.id )
			self.tree.clear();
		
//		console.debug('show 1',uP,self.tree.selectedNode);
		// assuming that all initializing is completed (project and types are loaded), 
		// get and show the specs:
		if (self.pData.length("hierarchy")>0 ) {
			// ToDo: Get the hierarchies one by one, so that the first is shown as quickly as possible;
			// each might be coming from a different source (in future):
			app.cache.selectedProject.readContent( 'hierarchy', "all", {reload:true} )
			.then( 
				(rsp)=>{
//					console.debug('load',rsp);
					// undefined parameters will be replaced by default value:
					self.updateTree( opts, rsp );

					// all hierarchies have been loaded;
					// try to select the requested node:
					if( uP && uP.node ) {
						nd = self.tree.selectNodeById( uP[CONFIG.keyNode] )
					};
					// node has priority over item (usually only one of them is specified ;-):
					if( !nd && uP && uP.item ) {
						nd = self.tree.selectNodeByRef( uP[CONFIG.keyItem] )
					};
					// if none is specified, take the node which is already selected:
					if( !nd ) nd = self.tree.selectedNode;
					// no or unknown resource specified; select first node:
					if( !nd ) nd = self.tree.selectFirstNode();
					if (nd) {
						self.tree.openNode(nd);
					}
					else {
						// tree is empty:
						if (!self.resCre) {
							// Warn, if there are no resource classes for user instantiation:
							message.show(i18n.MsgNoObjectTypeForManualCreation, { duration: CONFIG.messageDisplayTimeLong });
							return;
						};
					};
				},
				LIB.stdError
			);
		}
		else {
			// the project has no spec:
			$( self.view ).html( '<div class="notice-danger">'+i18n.MsgNoSpec+'</div>' );
			app.busy.reset();
			if (!self.resCre) {
				// Warn, if there are no resource classes for user instantiation:
				message.show(i18n.MsgNoObjectTypeForManualCreation, { duration: CONFIG.messageDisplayTimeLong });
				return;
			};
		};
	};

	// Multiple refresh requests in a short time are consolidated to a single refresh at the end.
	// This reduces the server traffic and the screen updates considerably, 
	// for example if the user quickly traverses the tree. 
	// Do finally refresh, if there has been no further request in a certain time period.
	var refreshReqCnt = 0;
	self.refresh = ( params:any ):void =>{
		// refresh the content, only;
		// primarily provided for showing changes made by this client:
			function tryRefresh():void {
				if( --refreshReqCnt<1 ) self.doRefresh( params )
			}
		refreshReqCnt++;
		setTimeout( tryRefresh, CONFIG.noMultipleRefreshWithin )
	};
	self.doRefresh = ( parms:any ):void =>{
		// Refresh the view;
		// this routine is called in the following situations:
		// - user clicks in the tree
		// - cache update is signalled
		// --> Don't disturb the user in case of the editing views ('objectEdit', 'linker').
//		console.debug('doRefresh',parms);

	//	$('#specNotice').empty();
	
		// update the current view:
		self.ViewControl.selected.show( parms );
	};

/* ++++++++++++++++++++++++++++++++
	Functions called by GUI events 
*/
	self.itemClicked = ( rId:string ):void =>{
		if( ['#'+CONFIG.objectRevisions, '#'+CONFIG.comments].indexOf( self.selectedView() )>-1 ) return;
//		console.debug('#0',rId);

		// When a resource is clicked in the list (main row), select it and move it to the top.
		// If it is a resource with children (folder with content), assure it is open.
		// If it is already selected, at the top and open, then close it.
		// So, after first selecting a node, it ends always up open at the top,
		//     with further clicks it toggles between opened and closed.
	//	self.selectTab(CONFIG.objectList);  // itemClicked can be called from the hitlist ..
		if( self.tree.selectedNode.ref != rId ) {
			// different node: select it and open it:
//			console.debug('#1',rId,self.tree.selectedNode);
			self.tree.selectNodeByRef( rId );
			// @ts-ignore - ElementById 'CONFIG.objectList' does exist
			document.getElementById(CONFIG.objectList).scrollTop = 0;
			// changing the tree node triggers an event, by which 'self.refresh' will be called.
			self.tree.openNode();
			// opening a node triggers an event, by which 'self.refresh' will be called.
		}
		else {
			if( self.tree.selectedNode.children.length>0 ) {
//				console.debug('#2',rId,self.tree.selectedNode);
				// open the node if closed, close it if open:
				self.tree.toggleNode();
				// opening or closing a node triggers an event, by which 'self.refresh' will be called.
			}
		};
		if( self.selectedView() != '#'+CONFIG.objectList ) 
			moduleManager.show({ view: '#'+CONFIG.objectList });
	};
/*	self.addComment = ()=>{
//		console.debug( 'addComment', self.tree.selectedNode );
		var cT = itemByName( self.pData.resourceClasses, CONFIG.resClassComment ),
			rT = itemByName( self.pData.statementClasses, CONFIG.staClassCommentRefersTo );
		if( !cT || !rT ) return null;
		
		var newC = {}, 
			newId = LIB.genID('R-');
		app.cache.selectedProject.initResource( cT )
			.done( function(rsp) {
				// returns an initialized resource of the requested type:
				newC = rsp;
				newC.id = newId
			})
			.fail( handleError );
		
		// ToDo: The dialog is hard-coded for the currently defined allClasses for comments (stdTypes-*.js).  Generalize!
		var txtLbl = i18n.lookup( CONFIG.propClassDesc ),
			txtPrC = itemByName( cT.propertyClasses, CONFIG.propClassDesc );
		var dT = LIB.itemById( self.pData.dataTypes, txtPrC.dataType );

		new BootstrapDialog({
			title: i18n.lookup( 'LblAddCommentTo', self.tree.selectedNode.name ),
			type: 'type-success',
			message: function (thisDlg) {
				var form = $('<form id="attrInput" role="form" ></form>');
				form.append( $(textField( txtLbl, '', {typ:'area'} )) );
				return form 
			},
			buttons: [{
				label: i18n.BtnCancel,
				action: function(thisDlg){ thisDlg.close() }
			},{ 	
				label: i18n.BtnSave,
				cssClass: 'btn-success', 
				action: function (thisDlg) {
					// 1. get comment text
					newC.properties[0].value = textValue(txtLbl).substr(0,dT.maxLength);
//					newC.title = ....	// an instance-specific name (or title)

//					console.info( 'saving comment', newC );
					app.cache.selectedProject.createContent( 'resource', newC )
						.done( function(newO) {
							var newR = {
								subject: { id: newId, revision: 0 },
								object: { id: self.tree.selectedNode.ref, revision: 0 },
								class: rT.id,
								title: CONFIG.staClassCommentRefersTo
//								description: ''
							};
//							console.info( 'saving statement', newR );
							app.cache.selectedProject.createContent( 'statement', newR )
								.done( self.refresh )
								.fail( handleError )
						})
						.fail( handleError )
				
					thisDlg.close()
				}
			}]
		})
		.init()
	};
	self.delComment = (el)=>{
//		console.debug('delComment',id);
		app.busy.set();
		var pend=2;
		app.cache.selectedProject.readStatementsOf({id:el}) // {showComments:true} ?
			.done( function(rL) {
				// delete all statements of the comment - should just be one, currently:
//				console.debug('deleteComment',rL.statements,el);
				app.cache.selectedProject.deleteContent('statement',rL)
					.done( function(dta, textStatus, xhr) { 
						if( --pend<1 ) self.refresh()
					})
					.fail( handleError );
				// and delete the resource, as well:
				app.cache.selectedProject.deleteContent('resource',{id:el})
					.done( function(dta, textStatus, xhr) { 
						if( --pend<1 ) self.refresh()
					})
					.fail( handleError )
			})
	};
*/

	return self
});


// Construct the controller for resource listing ('Document View'):
moduleManager.construct({
	view:'#'+CONFIG.objectList
}, (self:IModule) =>{
	// Construct an object for displaying a hierarchy of resources:

	var myName = self.loadAs,
		myFullName = 'app.'+myName,
		cacheData: CSpecIF,		// the cached project data
		selRes: CResourceToShow;	// the currently selected resource

	// Permissions for resources:
	self.resCreClasses = [];  // all resource classes, of which the user can create new instances. Identifiers are stored, as they are invariant when the cache is updated.
	self.resCre = false; 	// controls whether resp. button is enabled; true if the user has permission to create resources of at least one type.
	self.resCln = false;	//  " , true if the user has permission to create a resource like the selected one.
//	self.filCre = false;
//	self.cmtCre = false;
//	self.cmtDel = false;

	self.resources = new CResourcesToShow(); 	// flat-listed resources for display, is a small subset of app.cache.selectedProject.data.resources
//	self.comments = new CResourcesToShow();  	// flat-listed comments for display
//	self.files = new Files();			// files for display
		
	self.init = (): boolean => {
		return true;
	};
	self.clear = ():void =>{
	//	selectResource(null);
		self.resources.init();
	//	self.comments.init();
	//	self.modeCmtDel = false;
	};
	self.hide = ():void =>{
//		console.debug(CONFIG.objectList, 'hide');
		$( self.view ).empty()
	};
	self.show = ( opts:any ):void =>{
		// Show the next resources starting with the selected one:
//		console.debug(CONFIG.objectList, 'show', opts);

		self.parent.showLeft.set();
		self.parent.showTree.set();
		cacheData = app.cache.selectedProject.data;
		
		// Select the language options at project level:
		if( typeof( opts ) != 'object' ) opts = {};
		opts.targetLanguage = browser.language;
		opts.lookupTitles = true;
				
		app.busy.set();
	/*	if( self.resources.values.length<1 )
			$( self.view ).html( '<div class="notice-default" >'+i18n.MsgLoading+'</div>' ); */

		if( !self.parent.tree.selectedNode ) self.parent.tree.selectFirstNode();
//		console.debug(CONFIG.objectList, 'show', self.parent.tree.selectedNode);

		var nL; // list of hierarchy nodes, must survive the promise

		getNextResources()
		.then( 
			renderNextResources,
			(err)=>{
				if( err.status==744 ) {
					// A previously selected node is not any more available 
					// with the latest revision of the project:
					self.parent.tree.selectFirstNode();
					getNextResources()
					.then(
						renderNextResources,
						handleErr
					);
				}
				else {
					handleErr( err );
				};
			}
		);
		return;
		
		function getNextResources():Promise<SpecifResource[]> {
			var nd = self.parent.tree.selectedNode,
				oL = [];  // id list of the resources to view
			nL = [];  // list of hierarchy nodes
					
			getPermissions();
			
			// Update browser history, if it is a view change or item selection, 
			// but not navigation in the browser history:
			if( nd && !(opts && opts.urlParams) ) 
				setUrlParams({
					project: cacheData.id,
					view: self.view.substr(1),	// remove leading hash
					node: nd.id,
					item: nd.ref
				}); 

			// lazy loading: only a few resources are loaded from the server starting with the selected node
			// only visible tree nodes are collected in oL (excluding those in closed folders ..), 
			// so the main column corresponds with the tree.
			for( var i=0, I=CONFIG.objToGetCount; i<I && nd; i++ ) {
				oL.push( nd.ref );  // nd.ref is the id of a resource to show
				nL.push( nd );
				nd = nd.getNextNode();   // get next visible tree node
			};

			return app.cache.selectedProject.readContent( 'resource', oL )
		}
		function renderNextResources(rL: SpecifResource[]): void {
			// Format the titles with numbering:
			for( var i=rL.length-1; i>-1; i-- )
				rL[i].order = nL[i].order;
	
			// Update the view list, if changed:
			// Note that the list is always changed, when execution gets here,
			// unless in a multi-user configuration with server and auto-update enabled.
			if( self.resources.update( rL ) || opts && opts.forced ) {
				// list value has changed in some way:
			//	setPermissions( self.parent.tree.selectedNode );  // use the newest revision to get the permissions ...
				$( self.view ).html( self.resources.render() );
			};
			// the currently selected resource:
			selRes = self.resources.selected();
			$( self.view ).prepend( actionBtns() );
			app.busy.reset();
		}
		function handleErr(err):void {
			LIB.stdError( err );
			app.busy.reset();
		}
		function actionBtns():string {
			// render buttons:
//			console.debug( 'actionBtns', selRes, self.resCre );

			var rB = '<div class="btn-group" style="position:absolute;top:4px;right:4px;z-index:900">';
//			console.debug( 'actionBtns', self.parent.tree.rootNode() );

		/*	if( selRes )
				// Create a 'direct link' to the resource (the server renders the resource without client app):
				rB += '<a class="btn btn-link" href="'+CONFIG.serverURL+'/projects/'+cacheData.id+'/specObjects/'
						+self.resources.selected().value.id+'">'+i18n.LblDirectLink+'</a>';  
		*/	
			// Add the create button depending on the current user's permissions:
			// In order to create a resource, the user needs permission to create one or more resource types PLUS 
			// a permission to update the hierarchy:
		//	if( self.resCre && cacheData.selectedHierarchy.upd )
			// ToDo: Respect the user's permission to change the hierarchy
			// ToDo: Don't allow creation of elements in automatically created branches like the glossary
			if( self.resCre && (!selRes || selRes.isUserInstantiated()) )
				rB += '<button class="btn btn-success" onclick="'+myFullName+'.editResource(\'create\')" '
						+'data-toggle="popover" title="'+i18n.LblAddObject+'" >'+i18n.IcoAdd+'</button>'
			else
				rB += '<button disabled class="btn btn-default" >'+i18n.IcoAdd+'</button>';

			if( !selRes )
				// just show the create-button (nothing to update or delete):
				return rB + '</div>';

			// Add the clone button depending on the current user's permissions:
		//	if( self.resCln && cacheData.selectedHierarchy.upd )
			if( self.resCre && selRes.isUserInstantiated() )
				rB += '<button class="btn btn-success" onclick="'+myFullName+'.editResource(\'clone\')" '
						+'data-toggle="popover" title="'+i18n.LblCloneObject+'" >'+i18n.IcoClone+'</button>'
			else
				rB += '<button disabled class="btn btn-default" >'+i18n.IcoClone+'</button>';

			// Add the update and delete buttons depending on the current user's permissions for the selected resource:
			/*	function propUpd() {
					// check whether at least one property is editable:
					console.debug('#',selRes);
					if( selRes.other )
						for( var a=selRes.other.length-1;a>-1;a-- ) {
							if( !selRes.other[a].permissions || selRes.other[a].permissions.upd ) return true   // true, if at least one property is editable
						};
					return false
				}  */
		//	if( propUpd() )    // relevant is whether at least one property is editable, obj.upd is not of interest here. No hierarchy-related permission needed.
			if (app.title != i18n.LblReader && (!selRes.permissions || selRes.permissions.upd))
				rB += '<button class="btn btn-default" onclick="' + myFullName + '.editResource(\'update\')" '
						+'data-toggle="popover" title="'+i18n.LblUpdateObject+'" >'+i18n.IcoEdit+'</button>'
			else
				rB += '<button disabled class="btn btn-default" >'+i18n.IcoEdit+'</button>';

			// Add the commenting button, if all needed types are available and if permitted:
		/*	if( self.cmtCre )
				rB += '<button class="btn btn-default" onclick="'+myFullName+'.addComment()" '
						+'data-toggle="popover" title="'+i18n.LblAddCommentToObject+'" >'+i18n.IcoComment+'</button>';
			else */
				rB += '<button disabled class="btn btn-default" >'+i18n.IcoComment+'</button>';

			// The delete button is shown, if a hierarchy entry can be deleted.
			// The confirmation dialog offers the choice to delete the resource as well, if the user has the permission.
			if (app.title != i18n.LblReader && (!selRes.permissions || selRes.permissions.del) && selRes.isUserInstantiated() )
				rB += '<button class="btn btn-danger" onclick="'+myFullName+'.deleteNode()" '
						+'data-toggle="popover" title="'+i18n.LblDeleteObject+'" >'+i18n.IcoDelete+'</button>';
			else
				rB += '<button disabled class="btn btn-default" >'+i18n.IcoDelete+'</button>';

//			console.debug('actionBtns',rB+'</div>');
			return rB+'</div>'	// return rendered buttons for display
		};
		function getPermissions():void {
			// No permissions beyond read, if it is the viewer:
			if( app.title!=i18n.LblReader ) {
				self.resCreClasses.length = 0;
			
				// using the cached allClasses:
				// a) identify the resource and statement types which can be created by the current user:
				app.cache.selectedProject.data.resourceClasses.forEach( (rC)=>{
					// list all resource types, for which the current user has permission to create new instances
					// ... and which allow manual instantiation:
					// store the type's id as it is invariant, when app.cache.selectedProject.data.allClasses is updated
				//	if( rC.cre && (!rC.instantiation || rC.instantiation.indexOf('user')>-1) )
					// ToDo: Respect the current user's privileges:
					if( !rC.instantiation || rC.instantiation.indexOf(SpecifInstantiation.User)>-1 )
						self.resCreClasses.push( rC.id )
				});
				// b) set the permissions for the edit buttons:
				self.resCre = self.resCreClasses.length>0
			};
			
			/*	self.filCre = app.cache.selectedProject.data.cre;
				let cT = itemByName( app.cache.selectedProject.data.resourceClasses, CONFIG.resClassComment ),
					rT = itemByName( app.cache.selectedProject.data.statementClasses, CONFIG.staClassCommentRefersTo );
				self.cmtCre = ( self.typesComment && self.typesComment.available() && cT.cre && rT.cre );
				self.cmtDel = ( self.typesComment && self.typesComment.available() && cT.del && rT.del )  */

//			console.debug('permissions',self.resCreClasses)
		}
	};
/*	self.cmtBtns = ()=>{
		if( !self.selectedView()=='#'+CONFIG.comments || !self.resources.selected().value ) return '';
		// Show the commenting button, if all needed types are available and if permitted:
		if( self.cmtCre )
			return '<button class="btn btn-default" onclick="'+myFullName+'.addComment()" '
					+'data-toggle="popover" title="'+i18n.LblAddCommentToObject+'" >'+i18n.IcoComment+'</button>';
		else
			return '<button disabled class="btn btn-default" >'+i18n.IcoComment+'</button>'
	}; */

/* ++++++++++++++++++++++++++++++++
	Functions called by GUI events 
*/
	self.editResource = ( mode:string ):void =>{
		// Enter edit mode: load the edit template:
		// The button for this function is enabled only if the current user has edit permission.

		if( app[CONFIG.resourceEdit] ) {
//			console.debug('#',mode);
			// the resource editor has no 'official' view and is thus not controlled by ViewControl,
			// therefore we call show() directly:
			app[CONFIG.resourceEdit].show( {eligibleResourceClasses:self.resCreClasses,mode:mode} );
		}
		else {
		/*	// ToDo: Lazy loading, 
			// Load the edit module, if not yet available:  */
			throw Error("\'editResource\' clicked, but module '"+CONFIG.resourceEdit+"' is not ready.");
		};
	}; 
	self.deleteNode = ():void =>{
		// Delete the selected node and its children.
		// The resources are dereferenced, or optionally deleted, themselves.
		// @ts-ignore - BootstrapDialog() is loaded at runtime
		new BootstrapDialog({
			title: i18n.MsgConfirm,
			// @ts-ignore - BootstrapDialog() is loaded at runtime
			type: BootstrapDialog.TYPE_DANGER,
			message: i18n.lookup( 'MsgConfirmObjectDeletion', self.parent.tree.selectedNode.name ),
			buttons: [{
				label: i18n.BtnCancel,
				action: (thisDlg: any)=>{
					thisDlg.close();
				}
			},{
				label: i18n.BtnDeleteObjectRef,
				action: (thisDlg: any)=>{
					delNd( self.parent.tree.selectedNode );
					thisDlg.close();
				}
		/*	},{
				label: i18n.BtnDeleteObject,
				// This button is enabled, if the user has permission to delete the referenced resource,
				// ?? and if the resource has no further references in any tree:
				cssClass: 'btn-danger' +(enableDel(self.parent.tree.selectedNode.ref)?'':' disabled'), 
				action: function (thisDlg) {
					// the selected resource's instantiation must be "user" 
//					console.debug( "Deleting resource '"+self.parent.tree.selectedNode.name+"'." );
					delNd( self.parent.tree.selectedNode );
			//		delRes( self.parent.tree.selectedNode.ref );
					thisDlg.close();
				} */
			}]
		})
		.open();
		return;
		
	/*	function enableDel( resId ) {
		// Check, if the specified resource can be deleted.
		// ToDo: also check permission via self.resources.selected().value.del
//			console.debug('enableDel',selRes,resId,selResIsUserInstantiated());
            return selRes.id == resId  // should always be the case ..
				// only resources under "user" control can be deleted:
                && selResIsUserInstantiated();
		}
		function delRes( resId ) {
			// Delete the resource 
			// - only if it is not referenced by another hierarchy node as well.
			// - and if it is under "user" control
			// In addition, if it is a diagram, 
			// - identify all it's "shows" relations
			// - delete all resources and statements shown by the diagram, 
			//   -- only if they are not shown by another diagram as well
			//   -- if they are *not* under "user" control.
			// - delete all it's "shows" relations
			// Note that older data sets do not use "shows" relations for statements and in this case the statements are left untouched;
			// in other words: If a user wants to potentially delete statements which are shown by a diagram to be deleted,
			// it is necessary to provide "shows" statements also for statements.
			// ?? ToDo: delete the resource with all other references ...
			app.cache.selectedProject.deleteContent( "resource", {id:resId} )
				.catch( LIB.stdError );
			// Delete all statements related to this resource:
			app.cache.selectedProject.readStatementsOf( {id:resId} )
				.then( 
					(staL)=>{
						console.debug( 'delRes statements', staL);
					},
					LIB.stdError 
				);
		} */
		function delNd(nd: jqTreeNode): void {
			// Delete the hierarchy node and all it's children. 
			console.info( "Deleting tree object '"+nd.name+"'." );

			// 1. Step away from tbe node to delete:
//			console.debug('deleteNode',nd,nd.getNextSibling());
			self.parent.tree.selectNode( nd.getNextSibling() ); 

			// 2. Delete the hierarchy entry with all its children in cache and server:
			app.cache.selectedProject.deleteContent( 'node', LIB.keyOf(nd) )
				.then( 
					()=>{
						// If a diagram has been deleted, build a new glossary with elements 
						// which are shown by any of the remaining diagrams:
						app.cache.selectedProject.createFolderWithGlossary({addGlossary:true} )
							.then( 
								()=>{  
									// undefined parameters will be replaced by default value:
									self.parent.updateTree({
										targetLanguage: browser.language,
										lookupTitles: true
									});
									self.parent.doRefresh({forced:true})
								},
								LIB.stdError 
							)
					},
					LIB.stdError 
				);
		}
	};
/*	self.deleteResource = ()=>{
		// Delete the selected resource, all tree nodes and their children.
		// very dangerous ....
	};  */
	self.relatedItemClicked = ( rId:string ):void =>{
//		console.debug( 'relatedItemClicked', rId );
		// Jump to resource rId:
		self.parent.tree.selectNodeByRef( LIB.makeKey(rId) );
		// changing the tree node triggers an event, by which 'self.refresh' will be called.
		// @ts-ignore - ElementById 'CONFIG.objectList' does exist
		document.getElementById(CONFIG.objectList).scrollTop = 0;
	};
	return self;
});
// Construct the controller for displaying the statements ('Statement View'):
moduleManager.construct({
	view:'#'+CONFIG.relations
}, (self:IModule) =>{
	// Render the statements of a selected resource:

	var myName = self.loadAs,
		myFullName = 'app.' + myName,
		cacheData: CSpecIF,		// the cached data
		selRes:CResourceToShow,		// the currently selected resource
		net,
		modeStaDel = false;	// controls what the resource links in the statements view will do: jump or delete statement

	// Permissions for resources and statements:
	self.staCreClasses = {subjectClasses:[],objectClasses:[]};  // all statement classes, of which the user can create new instances. Identifiers are stored, as they are invariant when the cache is updated.
	self.staCre = false;
	self.staDel = false;
		
	self.init = function (): boolean {
		return true;
	}
	self.hide = function():void {
		$( self.view ).empty()
	};
	self.show = function( opts?:any ):void {
		self.parent.showLeft.set();
		self.parent.showTree.set();
		cacheData = app.cache.selectedProject.data;

		// Select the language options at project level:
		if( typeof( opts ) != 'object' ) opts = {};
		opts.targetLanguage = self.targetLanguage = browser.language;
		opts.lookupTitles = self.lookupTitles = true;
	//	opts.revisionDate = new Date().toISOString();
		// If in delete mode, provide the name of the delete function as string:
	//	opts.fnDel = modeStaDel? myFullName+'.deleteStatement()':'';
	
		// The tree knows the selected resource; if not take the first:
		if( !self.parent.tree.selectedNode ) self.parent.tree.selectFirstNode();
		// quit, because the tree is empty:
		if( !self.parent.tree.selectedNode ) { self.parent.emptyTab( self.view ); return };

		// else: the tree has entries:
		app.busy.set();
	//	$( self.view ).html( '<div class="notice-default" >'+i18n.MsgLoading+'</div>' );

		// ToDo: Redraw only if the selected node has changed, to avoid a flicker.
		var nd = self.parent.tree.selectedNode;
						
		// Update browser history, if it is a view change or item selection, 
		// but not navigation in the browser history:
		if( !opts.urlParams ) 
			setUrlParams({
				project: cacheData.id,
				view: self.view.substr(1),	// without leading hash
				node: nd.id
			//	item: nd.ref
			}); 

		app.cache.selectedProject.readStatementsOf(nd.ref, { dontCheckStatementVisibility: aDiagramWithoutShowsStatementsForEdges(cacheData)} )
		.then( 
			(sL:SpecifStatement[])=>{
				// sL is the list of statements involving the selected resource.

				// First, initialize the list and add the selected resource:
				net = { resources: [nd.ref], statements: [] };
				// Store all related resources while avoiding duplicate entries,
				// the title attribute will be undefined, 
				// but we are interested only in the resource id at this point:
				sL.forEach( cacheNet );

				// Obtain the titles (labels) of all resources in the list.
				// The titles may not be defined in a tree node and anyways don't have the icon, 
				// therefore obtain the title from the referenced resources.
				// Since the resources are cached, this is not too expensive.
				app.cache.selectedProject.readContent( 'resource', net.resources )
				.then( 
					(rResL:SpecifResource[])=>{   
						// rResL is a list of the selected plus it's related resources

						// Assuming that the sequence may be arbitrary:
						selRes = LIB.itemByKey(rResL,nd.ref);
						getPermissions( selRes );

						// Now get the titles with icon of the resources,
						// as the sequence of list items in net.resources is maintained, 
						// the selected resource will be the first element in the list: 
						rResL.forEach( (r:SpecifResource)=>{ cacheMinRes( net.resources, r ) });
					
						// finally add the 'mentions' statements:
						getMentionsRels(selRes,opts)
						.then( 
							(stL)=>{
								stL.forEach( cacheNet );
//								console.debug('local net',stL,net);
								renderStatements( net );
								$( self.view ).prepend( linkBtns() ); 
								app.busy.reset();
							},
							handleErr
						);
					},
					handleErr
				/*	(xhr)=>{
						switch( xhr.status ) {
							case 404:   // related resource(s) not found, just ignore it
								break;
							default:
								LIB.stdError(xhr);
						}
						app.busy.reset();	
					} */
				);
			},
			handleErr
		);
		return;

		function handleErr(xhr: xhrMessage): void {
			LIB.stdError(xhr);
			app.busy.reset();
		}
		function cacheMinRes(L:SpecifResource[],r:SpecifResource):void {
			// cache the minimal representation of a resource;
			// r may be a resource, a key pointing to a resource or a resource-id;
			// note that the sequence of items in L is always maintained:
			LIB.cacheE( L, { id: r.id, title: LIB.elementTitleOf( r, $.extend({},opts,{addIcon:true}), cacheData )});
		}
		function cacheMinSta(L:SpecifStatement[],s:SpecifStatement):void {
			// cache the minimal representation of a statement;
			// s is a statement:
			LIB.cacheE(L, { id: s.id, title: staClassTitleOf(s, cacheData, opts), subject: s.subject.id, object: s.object.id} );
		}
		function cacheNet(s:SpecifStatement):void {
			// skip hidden statements:
			if (CONFIG.hiddenStatements.indexOf( staClassTitleOf(s, cacheData, opts) )>-1 ) return;

			// store the statements in the net:
			cacheMinSta( net.statements, s );
//			console.debug( 'cacheNet 1', s, simpleClone(net) );

			// collect the related resources:
			if( LIB.equalKey(s.subject, nd.ref) ) {
				// the selected node is a subject, so the related resource is an object,
				// list it, but only once:
				cacheMinRes( net.resources, s.object );
			}
			else {
				// the related resource is a subject,
				// list it, but only once:
				cacheMinRes( net.resources, s.subject );
			}
		}
		function getMentionsRels(selR: SpecifResource, opts: any):Promise<SpecifStatement[]> {
			// selR is the currently selected resource.
			
			return new Promise( (resolve,reject):void =>{	
				// Search all resource text properties and detect where another resource's title is referenced.
				// Only findings with marks for dynamic linking are taken.
				// Add a statement for each finding for display; do not save any of these statements in the server.
				if( !CONFIG.findMentionedObjects || !selR ) 
					resolve([]);
//				console.debug('getMentionsRels',selR,opts);
			/*	// There is no need to have a statementClass ... at least currently:
				var rT = itemByName( cacheData.statementClasses, CONFIG.staClassMentions );
				if( !rT ) return;  */

				let staL: SpecifStatement[] = [],	// a list of artificial statements; these are not stored in the server
					pend = 0,
					localOpts = $.extend({}, opts, { addIcon: false }),  // no icons when searching titles
					selTi = LIB.elementTitleOf(selR, localOpts),
					refPatt: RegExp,
					// assumption: the dynamic link tokens don't need to be HTML-escaped:
					selPatt = new RegExp( (CONFIG.titleLinkBegin+selTi+CONFIG.titleLinkEnd).escapeRE(), "i" );

				// Iterate the tree ... 
				self.parent.tree.iterate((nd: jqTreeNode) => {
					// The server delivers a tree with nodes referencing only resources for which the user has read permission,
					// so there is no need to check permissions, here:
					pend++;
					app.cache.selectedProject.readContent('resource', nd.ref )
					.then( 
						(rL:SpecifResource[])=>{   
							// refR is a resource referenced in a hierarchy
							let refR: SpecifResource = rL[0],
								refTi = LIB.elementTitleOf(refR, localOpts),
								dT: SpecifDataType;
//							console.debug('self.parent.tree.iterate',refR,refTi,pend);
							if( refTi && refTi.length>CONFIG.titleLinkMinLength-1 && refR.id!=selR.id ) {
								// ToDo: Search in a native description field ... not only in properties ...

								// 1. The titles of other resource's found in the selected resource's texts 
								//    result in a 'this mentions other' statement (selected resource is subject):
								refPatt = new RegExp( (CONFIG.titleLinkBegin+refTi+CONFIG.titleLinkEnd).escapeRE(), "i" );
								if( selR.properties )
									selR.properties.forEach( (p)=>{
										// assuming that the dataTypes are always cached:
										dT = LIB.dataTypeOf(p['class'], cacheData);
										// considering only text-properties except enumerated values,
										// because it is not expected that type information references instance data
										// and also we would need to explicitly look up the enumerated value, first:
										if (dT && dT.type==SpecifDataTypeEnum.String && !dT.enumeration) {
												// add, if the iterated resource's title appears in the selected resource's property ..
												// and if it is not yet listed:
												if (refPatt.test( LIB.languageValueOf(p.values[0],localOpts )) && notListed( staL, selR, refR ) ) {
													staL.push({
														title: 	CONFIG.staClassMentions,
											//			class:	// no class indicates also that the statement cannot be deleted
														subject:	selR,
														object:		refR
													})
												}
										}
									});
								// 2. The selected resource's title found in other resource's texts 
								//    result in a 'other mentions this' statement (selected resource is object):
								if( refR.properties )
									refR.properties.forEach( (p)=>{
										// assuming that the dataTypes are always cached:
										switch (LIB.dataTypeOf(p['class'], cacheData ).type ) {
											case SpecifDataTypeEnum.String:
											case 'xhtml':	
												// add, if the selected resource's title appears in the iterated resource's property ..
												// and if it is not yet listed:
												if( selPatt.test( p.value ) && notListed( staL,refR,selR ) ) {
													staL.push({
														title: 	CONFIG.staClassMentions,
											//			class:	// no class indicates also that the statement cannot be deleted
														subject:	refR,
														object:		selR
													})
												}
										}
									});
							};
							if( --pend<1 ) resolve(staL)
						},
						reject
					);
					return true;
				})
			})
			
			function notListed( L:SpecifStatement[],s,t ):boolean {
				for( var i=L.length-1;i>-1;i--  ) {
					if( L[i].subject.id==s.id && L[i].object.id==t.id ) return false;
				};
				return true;
			}
		};
		function aDiagramWithoutShowsStatementsForEdges(dta: SpecIF): boolean {
			// Return true, if there is at least one diagram, for which statements do not have 'shows' statements (older transformators);
			// return false, if all resources 'and' visible statements have 'shows' statements for all diagrams (newer tranformators).
			// Corner case: No diagram at all returns true, also.
			let res: SpecifResource, pV: string, isNotADiagram: boolean, noDiagramFound = true;
			return LIB.iterateNodes(dta.hierarchies,
				(nd:SpecifNode): boolean => {
					// get the referenced resource:
					res = LIB.itemByKey(dta.resources, nd.resource);
					// find the property defining the type:
					pV = LIB.valuesByTitle(res, CONFIG.propClassType, dta);
					// Remember whether at least one diagram has been found:
					isNotADiagram = CONFIG.diagramClasses.indexOf(resClassTitleOf(res, dta)) < 0;
					noDiagramFound = noDiagramFound && isNotADiagram;
					// continue (return true) until a diagram is found *without* ShowsStatementsForEdges:
					return (isNotADiagram
						|| CONFIG.diagramTypesHavingShowsStatementsForEdges.indexOf(pV) > -1)
				}
			) || noDiagramFound;
		}
	}; 

	function linkBtns():string {
		if( !selRes ) return '';
		var rB = '<div id="linkBtns" class="btn-group" style="position:absolute;top:4px;right:4px;z-index:900">';

		if (modeStaDel) 
			return rB+'<button class="btn btn-default" onclick="'+myFullName+'.toggleModeStaDel()" >'+i18n.BtnCancel+'</button></div>';

//		console.debug( 'linkBtns', self.staCre );

		if( app.title!=i18n.LblReader && self.staCre )
			rB += '<button class="btn btn-success" onclick="'+myFullName+'.linkResource()" '
					+'data-toggle="popover" title="'+i18n.LblAddRelation+'" >'+i18n.IcoAdd+'</button>';
		else
			rB += '<button disabled class="btn btn-default" >'+i18n.IcoAdd+'</button>';

		if( app.title!=i18n.LblReader && net.statements.length>0 && (!selRes.permissions || selRes.permissions.del) )
			rB += '<button class="btn btn-danger '+(modeStaDel?'active':'')+'" onclick="'+myFullName+'.toggleModeStaDel()" '
					+'data-toggle="popover" title="'+i18n.LblDeleteRelation+'" >'+i18n.IcoDelete+'</button>';
		else
			rB += '<button disabled class="btn btn-default" >'+i18n.IcoDelete+'</button>';

		return rB+'</div>';	// return rendered buttons for display
	}
	function getPermissions( res:SpecifResource ):void {
		// No permissions beyond read, if it is the viewer:
		if( app.title!=i18n.LblReader && res ) {
			self.staCreClasses.subjectClasses.length = 0;
			self.staCreClasses.objectClasses.length = 0;

			// a) identify the resource and statement types which can be created by the current user:
			app.cache.selectedProject.data.statementClasses.forEach( 
				(sC)=>{
					// list all statement types, for which the current user has permission to create new instances:
					// ... and which allow user instantiation:
					// store the classes' ids as it is invariant, when app.cache.selectedProject.data.allClasses is updated
//					console.debug('staCreClasses',sC,res['class']);
				//	if( sC.cre && (!sC.instantiation || sC.instantiation.indexOf('user')>-1) ) 
					if (!sC.instantiation || sC.instantiation.indexOf(SpecifInstantiation.User)>-1 ) {
						if( !sC.subjectClasses || sC.subjectClasses.indexOf( res['class'] )>-1 ) 
							self.staCreClasses.subjectClasses.push( sC.id );	// all statementClasses eligible for the currently selected resource
						if( !sC.objectClasses || sC.objectClasses.indexOf( res['class'] )>-1 )
							self.staCreClasses.objectClasses.push( sC.id );		// all statementClasses eligible for the currently selected resource
					};
				}
			);
			// b) set the permissions for the edit buttons:
			self.staCre = self.staCreClasses.subjectClasses.length>0 || self.staCreClasses.objectClasses.length>0;
		};
//		console.debug('permissions',res,self.staCreClasses,self.staCre);
	}
	function renderStatements( net ):void {
		// net contains resources and statements as a SpecIF data-set for graph rendering,
		// where the selected resource is the first element in the resources list.

		if( net.statements.length<1 ) {
			$( self.view ).html( '<div class="notice-default">'+i18n.MsgNoRelatedObjects+'</div>' );
			modeStaDel = false;
			return;
		};

//		console.debug('renderStatements',net);

		let graphOptions: GraphOptions = {
				index: 0,
				canvas: self.view.substr(1),	// without leading hash
				titleProperties: CONFIG.titleProperties,
				onDoubleClick: ( evt )=>{
	//				console.debug('Double Click on:',evt);
					if( evt.target.resource && (typeof(evt.target.resource)=='string') ) 
						app[myName].relatedItemClicked(evt.target.resource,evt.target.statement);
						// changing the tree node triggers an event, by which 'self.refresh' will be called.
				},
				focusColor: CONFIG.focusColor
			};
		if( modeStaDel )
			graphOptions.nodeColor = '#ef9a9a';
//		console.debug('showStaGraph',net,graphOptions);
		app.statementsGraph.show(net, graphOptions);

		$(self.view).prepend('<div style="position:absolute;left:4px;z-index:900">'
			+ (modeStaDel? '<span class="notice-danger" >' + i18n.MsgClickToDeleteRel 
						: '<span class="notice-default" >' + i18n.MsgClickToNavigate )
			+ '</span></div>');
	}
/*	function renderStatementsTable( sGL, opts ) {
		// Render a table with all statements grouped by type:
	//	if( !self.toShow.id ) return '<div class="notice-default">'+i18n.MsgNoObject+'</div>';
		if( typeof(opts)!='object' ) opts = {};
	//	if( typeof(fnDel)!='boolean' ) opts.fnDel: false

		// opts.fnDel is a name of a delete function to call. If provided, it is assumed that we are in delete mode.
		// ToDo: The 'mentions' statements shall not be for deletion, and not appear to be for deletion (in red)
		if( opts.fnDel ) 
			var rT = '<div style="color: #D82020;" >'  // render table with the resource's statements in delete mode
		else
			var rT = '<div>';  // render table with the resource's statements in display mode
		rT += self.toShow.renderTitle( opts );	// rendered statements
		if( sGL.length>0 ) {
//			console.debug( sGL.length, sGL );
			if( opts.fnDel ) 
				rT += '<div class="notice-danger" style="margin-bottom:0.4em" >'+i18n.MsgClickToDeleteRel+'</div>';
			rT += '<table id="relationsTable" class="table table-condensed listEntry" ><tbody>';
			let relG=null;
			sGL.forEach( function(sG) {
				if( sG.rGs.length ) {
					// Show a table row with a group of statements where the selected resource is the object.
					// First, get the relevant properties and get the title of the related subject (subject object), in particular:
					relG=[];
					sG.rGs.forEach( function(s) {
						relG.push({
							id: s.id,
							sId: s.subject.id,
							sT: elementTitleWithIcon(s.subject,opts),
							computed: !s['class']
						});
					});
					// Then, sort the statements by title of the subject in descending order, as the loop further down iterates backwards:
					relG.sort( function(fix, foxi) { 
									let i = fix.sT.toLowerCase(),
										o = foxi.sT.toLowerCase();
									return i==o ? 0 : (i>o ? -1 : 1) 
					});
					rT += '<tr><td>';
					// The list of subject resources:
					relG.forEach( function(sc) {
						// Do not linkify, if the statement cannot be deleted (since it is not stored in the server).
						if( opts.fnDel && sc.computed )
							rT += sc.sT+'<br />'
						else
							rT += '<a onclick="app[CONFIG.objectList].relatedItemClicked(\''+sc.sId+'\', \''+sc.id+'\')">'+sc.sT+'</a><br />'
					});
					// Title and object are the same for all statements in this list:
					rT += '</td><td style="vertical-align: middle"><i>'+LIB.titleOf(sG.rGs[0],opts)+'</i></td>';
					rT += '<td style="vertical-align: middle"><span>'+elementTitleWithIcon(sG.rGs[0].object,opts)+'</span></td></tr>'
				};
				if( sG.rGt.length ) {
					// Show a table row with a group of statements where the selected resource is the subject (subject).
					// First, get the relevant properties and get the title of the related object, in particular:
					relG=[];
					sG.rGt.forEach( function(s) {
						relG.push({
							id: s.id,
							tId: s.object.id,
							tT: elementTitleWithIcon(s.object,opts),
							computed: !s['class']
						});
					});
					// Then, sort the statements by title of the object title in descending order, as the loop further down iterates backwards:
					relG.sort( function(dick, doof) { 
									let i = dick.tT.toLowerCase(),
									    o = doof.tT.toLowerCase();
									return i==o?0:(i>o?-1:1) 
					});
					// Title and subject are the same for all statements in this list:
					rT += '<tr><td style="vertical-align: middle"><span>'+elementTitleWithIcon(sG.rGt[0].subject,opts)+'</span></td>';
					rT += '<td style="vertical-align: middle"><i>'+LIB.titleOf(sG.rGt[0],opts)+'</i></td><td>';
					// The list of resources:
					relG.forEach( function(tg) {
						if( opts.fnDel && tg.computed )
							rT += tg.tT+'<br />'
						else
							rT += '<a onclick="app[CONFIG.objectList].relatedItemClicked(\''+tg.tId+'\', \''+tg.id+'\')">'+tg.tT+'</a><br />'
					});
					rT += '</td></tr>'
				}
			});
			rT += 	'</tbody></table>';
			if( opts.fnDel ) 
				rT += '<div class="doneBtns"><button class="btn btn-default btn-sm" onclick="'+opts.fnDel+'" >'+i18n.BtnCancel+'</button></div>'
		} 
		else {
			rT += '<div class="notice-default">'+i18n.MsgNoRelatedObjects+'</div>'
		};
		rT += '</div>';
		return rT  // return rendered statement table for display
	}  */

/* ++++++++++++++++++++++++++++++++
	Functions called by GUI events 
*/
	self.linkResource = function():void {
		// enter edit mode: load the edit template:
		// The button to which this function is bound is enabled only if the current user has edit permission.

		if( app[CONFIG.resourceLink] ) {
//			console.debug('#',mode);
			// the resource linker has no 'official' view and is thus not controlled by ViewControl,
			// therefore we call show() directly:
			app[CONFIG.resourceLink].show( {eligibleStatementClasses:self.staCreClasses} );
		}
		else {
		/*	// ToDo: Lazy loading, 
			// Load the edit module, if not yet available:  */
			throw Error("\'linkResource\' clicked, but module '"+CONFIG.resourceLink+"' is not ready.");
		};
	}; 
	self.toggleModeStaDel = function():void {
		// modeStaDel controls what the resource links in the statement view will do: jump or delete statement
		modeStaDel = !modeStaDel;  // toggle delete mode for statements
//		console.debug( 'toggle delete statement mode:', modeStaDel);
		$( '#linkBtns' ).remove();
		renderStatements( net );
		$(self.view).prepend(linkBtns());
	};
	self.relatedItemClicked = function( rId:string, sId:string ):void {
		// Depending on the delete statement mode ('modeStaDel'), either select the clicked resource or delete the statement.
//		console.debug( 'relatedItemClicked', rId, sId, modeStaDel, LIB.itemById( app.cache.selectedProject.data.statements, sId ) );
		if( modeStaDel ) {
			// Delete the statement between the selected resource and rId;
			// but delete only a statement which is stored in the server, i.e. if it is cached:
			app.cache.selectedProject.deleteContent('statement', LIB.makeKey(sId) )
			.then(
				self.parent.doRefresh({forced:true}),
				LIB.stdError
			);
		}
		else { 
			// Jump to resource rId:
			self.parent.tree.selectNodeByRef( LIB.makeKey(rId) );
			// changing the tree node triggers an event, by which 'self.refresh' will be called.
			// @ts-ignore - ElementById 'CONFIG.objectList' does exist
			document.getElementById(CONFIG.objectList).scrollTop = 0;
		};
	};
	return self;
});
