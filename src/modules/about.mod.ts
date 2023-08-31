/*!	Short Description of the SpecIF Viewer with a List of all used libraries and their respective licenses.
	Dependencies: jQuery
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	Author: se@enso-managers.de, Berlin
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/

moduleManager.construct({
	name: 'about'
}, function(self:IModule) {

	self.init = function():boolean {
//		console.debug('me.init',opts);
		return true
	};
	self.clear = function():void {
		$('#about').empty()
	};
	self.hide = function():void {
		self.clear()
	};
	self.show = function( opts?:any ):void {
		const isEditor = app.title == i18n.LblEditor,
			isReviewer = app.title == i18n.LblReviewer,
			padding = '16px'; // = margin-right of logo, see css

		// Update browser history, if it is a view change or item selection, 
		// but not navigation in the browser history:
		if( !(opts && opts.urlParams) ) 
			setUrlParams({
				view: self.view.substr(1)	// remove leading hash
			}); 

		$('#pageTitle').html( app.title );
		$('#about').html(
			'<div class="col-md-6" style="padding-right:'+padding+'; padding-left:'+padding+';">'
			+ '<p>An app for your web-browser to ' + (isEditor ? 'integrate, edit and transform' : (isReviewer? 'review' : 'view'))+' system specifications.</p>'
		+	'<p>SpecIF is the \'Specification Integration Facility\'. It\'s purpose is to combine partial specifications from different tools in a single model to allow</p>'
		+	'<ul>'
		+	'<li>to search, navigate and audit partial results in a common context,</li>'
		+	'<li>to exchange model information between organizations and tools.</li>'
		+	'</ul>'
		+	'<p>The <a href="https://specif.de" target="_blank">SpecIF Homepage</a> provides further information.</p>'
		+	'<p>The software code published on <a href="https://github.com/GfSE/SpecIF-Viewer" target="_blank">github.com</a>'
		+		' is a reference implementation and has not been designed for high data volume and other production requirements.' 
		+		' The installation provided for your convenience at <a href="https://specif.de/apps/'+(isEditor? 'edit':'view')+'" target="_blank">https://specif.de/apps/'+(isEditor? 'edit':'view')+'</a>'
		+		' is neither intended to be highly available nor scalable.'
		+		' You may use the <a href="https://github.com/GfSE/SpecIF-Viewer/releases" target="_blank">latest release</a> of the software for your own installation.'
		+		' Any contribution to this collaborative effort is highly welcome!'
		+	'</p>'
		+	'<p>Version: '+CONFIG.appVersion+' supporting SpecIF up to version '+CONFIG.specifVersion+'.</p>'
		+	'<p>License: <a href="https://github.com/GfSE/SpecIF-Viewer/blob/master/LICENSE" target="_blank">Apache 2.0</a></p>'
		+	'<h3>Features</h3>'
		+ '<ul>'
			+ (isReviewer ?
				  "<li>Display SpecIF data embedded in an HTML-file</li>"
				: 
				  "<li>Import 'specif' and 'specif.zip' file with schema and consistency check</li>"
				+ (moduleManager.isReady('ioReqif')? "<li>Import 'reqif' and 'reqifz' file</li>":"")
			// So far, editing is needed in case of Achimate for manually adding the diagrams ..
				+ (isEditor && moduleManager.isReady('ioArchimate')? "<li>Import ArchiMate Open-Exchange file</li>":"")
				+ (moduleManager.isReady('ioXls')? "<li>Import MS-Excel 'XLSX', 'XLS' and 'CSV' file</li>":"")
				+ (moduleManager.isReady('ioBpmn') ? "<li>Import 'BPMN-XML' file</li>" : "")
				+ "<li>Import from an URL or the local file system</li>"
			)
		+ (isEditor ? "<li>Merge models of different tools and notations</li>" : "")
		+		  "<li>Browse the content ('resources') along any supplied hierarchy</li>"
		+		  "<li>Display model-element details when hovering over a representation on a diagram (in case of SVG images with annotated model-element identifier)</li>"
		+ (isEditor? "<li>Create, clone and update resources with an input form derived from the respective resource class</li>":"")
		+ (isEditor? "<li>Move single nodes and subtrees in the hierarchy by drag'n'drop</li>":"")
		+ (isReviewer ? "<li>Edit properties for review status and comment according to the Stakeholder Request Clarification (SRC) process by prostep IVIP</li>" : "")
		+		  "<li>Inspect the semantic net ('statements')</li>"
		+ (isEditor? "<li>Create statements according to the options defined in the statement classes</li>":"")
		+ (isEditor? "<li>Delete selected resources and statements</li>":"")
		+		  "<li>Filter using text fragments ('full text search'), resource classes or enumerated property values</li>"
		+		  "<li>Report some model-based statistics, such as used resource classes or used property enumerated values</li>"
		+ (isEditor && moduleManager.isReady('toHtml')? "<li>Export 'html' file with embedded SpecIF data</li>":"")
		+ (isEditor? "<li>Export 'specif.zip' file</li>":"")
		+ (isEditor && moduleManager.isReady('reqif2specif')? "<li>Export 'reqifz' file</li>":"")
		+ (isEditor && moduleManager.isReady('toTurtle')? "<li>Export 'Turtle' file <em>(experimental)</em></li>":"")
		+ (isEditor && moduleManager.isReady('toEpub')? "<li>Export 'ePub' file</li>":"")
		+ (isEditor && moduleManager.isReady('toOxml')? "<li>Export MS-Word OOXML file</li>":"")
		+		'</ul>'
		+	'<h3>Compatibility</h3>'
		+		'<ul>'
		+		  "<li>Mozilla Firefox</li>"
		+		  "<li>Google Chromium and Chrome</li>"
		+		  "<li>Microsoft Edge</li>"
		+		  "<li>Opera</li>"
		+		  "<li>Apple Safari <em>(beware of performance issues in case of bigger models)</em></li>"
		+		  "<li>Microsoft Internet Explorer is <em>not any more</em> supported</li>"
		+		'</ul>'
		+	'</div>'
		+	'<div class="col-md-6" style="padding-right:'+padding+'; padding-left:'+padding+';">'
		+	'<h3>Support</h3>'
		+	'<p>'
		+		'In case you discover a conceptual inconsistency, a software bug or a flaw in documentation,'
		+		' we appreciate if you open an <a href="https://github.com/GfSE/SpecIF-Viewer/issues" target="_blank">issue</a>'
		+		' ... or simply send an e-mail with a concise description and test-data to'
		+		' <a href="mailto:maintenance@specif.de">maintenance(at)specif.de</a>.'
		+		' We are highly interested to supply high-quality concepts and useful software.'
		+	'</p>'
		+	'<h3>Credits and License Information</h3>'
		+	'<p>The SpecIF web-apps have been built with the open source components listed below. These are fine pieces of software'
		+		' and we gratefully thank the contributors for their effort.'
	/*	+		' Our policy is to donate 12% of our revenues made with'
		+		' the SpecIF Apps to these projects ... and we hope that our software will be useful to many people, as well.'  */
		+	'</p>'
		+	'<table class="table table-condensed">'
		+	'<thead>'
		+		'<tr>'
		+		'<th width="15%">Library</th><th>Author</th><th>Description</th><th>License</th>'
		+		'</tr>'
		+	'</thead>'
		+	'<tbody>'
		+		'<tr>'
		+			'<td>AJV</td>'
		+			'<td><a href="https://github.com/epoberezkin" target="_blank">Evgeny Poberezkin</a></td>'
		+			'<td>Another JSON Schema Validator ... <a href="https://github.com/epoberezkin/ajv" target="_blank">more</a></td>'
		+			'<td><a href="https://github.com/epoberezkin/ajv/blob/master/LICENSE" target="_blank">MIT</a></td>'
		+		'</tr>'
		+		'<tr>'
		+			'<td>jqTree</td>'
		+			'<td><a href="https://github.com/mbraak" target="_blank">Marco Braak</a></td>'
		+			'<td>A tree with collapsible branches and drag\'n\'drop support '
		+				'for rearranging chapters and paragraphs ... <a href="http://mbraak.github.io/jqTree/" target="_blank">more</a></td>'
		+			'<td><a href="https://github.com/mbraak/jqTree/blob/master/LICENSE" target="_blank">Apache 2.0</a></td>'
		+		'</tr>'
		+ (moduleManager.isReady('markdown')?
	/*			'<tr>'
			+		'<td>remarkable</td>'
			+		'<td><a href="https://github.com/jonschlinkert" target="_blank">Jon Schlinkert</a></td>'
			+		'<td>Markdown parser, done right. Commonmark support, extensions, syntax plugins, high speed ... <a href="https://github.com/jonschlinkert/remarkable" target="_blank">more</a></td>'
			+		'<td><a href="https://github.com/jonschlinkert/remarkable/blob/master/LICENSE" target="_blank">MIT</a></td>'
			+	'</tr>' */
				'<tr>'
			+		'<td>markdown-it</td>'
			+		'<td><a href="https://github.com/Kirill89" target="_blank">Kirill</a>,&nbsp;<a href="https://github.com/puzrin" target="_blank">Vitaly Puzrin</a>,&nbsp;<a href="https://github.com/rlidwka" target="_blank">Alex Kocharin</a></td>'
			+		'<td>Markdown parser, done right. 100% CommonMark support, extensions, syntax plugins & high speed ... <a href="https://markdown-it.github.io/" target="_blank">more</a></td>'
			+		'<td><a href="https://github.com/jonschlinkert/remarkable/blob/master/LICENSE" target="_blank">MIT</a></td>'
			+	'</tr>' 
			:   '')
		+		'<tr>'
		+			'<td>JSZip</td>'
		+			'<td><a href="https://github.com/Stuk" target="_blank">Stuart Knightley, David Duponchel, Franz Buchinger, António Afonso</a></td>'
		+			'<td>A library for creating, reading and editing .zip files ... <a href="https://github.com/Stuk/jszip" target="_blank">more</a></td>'
		+			'<td><a href="https://github.com/Stuk/jszip/blob/master/LICENSE.markdown" target="_blank">MIT</a></td>'
		+		'</tr>'
		+		'<tr>'
		+			'<td>FileSaver</td>'
		+			'<td><a href="http://eligrey.com/" target="_blank">Eli Grey</a></td>'
		+			'<td>Save files to the local file system ... <a href="https://github.com/eligrey/FileSaver.js/" target="_blank">more</a></td>'
		+			'<td><a href="https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md" target="_blank">MIT</a></td>'
		+		'</tr>'
		+		'<tr>'
		+			'<td>BPMN-Viewer</td>'
		+			'<td></td>'
		+			'<td>A BPMN 2.0 rendering toolkit and web modeler ... <a href="https://bpmn.io/toolkit/bpmn-js/" target="_blank">more</a></td>'
		+			'<td><a href="https://github.com/bpmn-io/bpmn-js/blob/develop/LICENSE" target="_blank">bpmn.io</a></td>'
		+		'</tr>'
		+		'<tr>'
		+			'<td>vis.js Network</td>'
		+			'<td></td>'
		+			'<td>Display networks consisting of nodes and edges ... '
		+				'<a href="https://visjs.github.io/vis-network/docs/network/" target="_blank">more</a></td>'
		+			'<td><a href="http://www.apache.org/licenses/LICENSE-2.0" target="_blank">Apache 2.0</a> or '
		+				'<a href="http://opensource.org/licenses/MIT" target="_blank">MIT</a></td>'
		+		'</tr>'
		+		'<tr>'
		+			'<td>js-xlsx</td>'
		+			'<td></td>'
		+			'<td>Excel parser and writer ... <a href="https://github.com/SheetJS/js-xlsx" target="_blank">more</a></td>'
		+			'<td><a href="https://github.com/SheetJS/js-xlsx/blob/master/LICENSE" target="_blank">Apache 2.0</a></td>'
		+		'</tr>'
	/*	+		'<tr>'
		+			'<td>DataTables</td>'
		+			'<td></td>'
		+			'<td>DataTables is a highly flexible tool adding advanced interaction controls to any HTML table ... '
		+				'<a href="http://www.datatables.net" target="_blank">more</a></td>'
		+			'<td><a href="http://www.datatables.net/license/mit" target="_blank">MIT</a></td>'
		+		'</tr>'  
		+		'<tr>'
		+			'<td>Font Awesome</td>'
		+			'<td></td>'
		+			'<td>Font Awesome gives you scalable vector icons that can instantly be customized — size, color, drop shadow, '
		+				'and anything that can be done with the power of CSS ... <a href="https://fontawesome.com/v4.7/" target="_blank">more</a></td>'
		+			'<td><a href="https://fontawesome.com/v4.7/license/" target="_blank">SIL OFL 1.1</a></td>'
		+		'</tr>' */
		+		'<tr>'
		+			'<td>jQuery</td>'
		+			'<td></td>'
		+			'<td>jQuery makes things like HTML document traversal and manipulation, event handling, animation '
		+				'and Ajax much simpler ... <a href="https://jquery.com/" target="_blank">more</a></td>'
		+			'<td><a href="https://jquery.org/license/" target="_blank">MIT</a></td>'
		+		'</tr>'
		+		'<tr>'
		+			'<td>Bootstrap Icons</td>'
		+			'<td></td>'
		+			'<td>Free, high quality, open source icon library with over 1,800 icons. '
		+				'Use them with or without Bootstrap in any project ... <a href="https://icons.getbootstrap.com/" target="_blank">more</a></td>'
		+			'<td><a href="https://github.com/twbs/bootstrap/blob/master/LICENSE" target="_blank">MIT</a></td>'
		+		'</tr>'
		+		'<tr>'
		+			'<td>Bootstrap</td>'
		+			'<td></td>'
		+			'<td>Front-end component library for responsive, mobile-first projects on the web ... '
		+				'<a href="http://getbootstrap.com/" target="_blank">more</a></td>'
		+			'<td><a href="https://github.com/twbs/bootstrap/blob/master/LICENSE" target="_blank">MIT</a></td>'
		+		'</tr>'
		+ (moduleManager.isReady('diff')?
				'<tr>'
			+		'<td>diff-match-patch</td>'
			+		'<td></td>'
			+		'<td>A library for text comparison, matching and patching ... '
			+			'<a href="https://code.google.com/p/google-diff-match-patch/" target="_blank">more</a></td>'
			+		'<td><a href="http://www.apache.org/licenses/LICENSE-2.0" target="_blank">Apache 2.0</a></td>'
			+	'</tr>'
			:   '')
		+	'</tbody>'
		+	'</table>'
		+	'</div>'
		)
	};
	return self;
});
