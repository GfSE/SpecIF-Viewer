/* 	Short Description of the SpecIF Viewer with a List of all used libraries and their respective licenses.
*/

modules.construct({
	name: 'about'
}, function(self) {
	"use strict";

	self.init = function( opts ) {
//		console.debug('me.init',opt);
		return true
	};
	self.clear = function() {
		$('#about').empty()
	};
	self.hide = function() {
		self.clear()
	};
	self.show = function( opts ) {
		let isEditor = app.label==i18n.LblEditor;

		// Update browser history, if it is a view change or item selection, 
		// but not navigation in the browser history:
		if( !(opts && opts.urlParams) ) 
			setUrlParams({
				view: self.view.substr(1)	// remove leading hash
			}); 

		$('#pageTitle').html( app.productTitle );
		$('#about').html(
			'<div class="col-md-6" style="padding-right:0.4em; padding-left:0.4em;">'
		+   '<p>An app for your web-browser to view'+(isEditor? ', edit':'')+' and transform system specifications.</p>'
		+	'<p>SpecIF is the \'Specification Integration Facility\'. It\'s purpose is to combine partial specifications from different tools in a single model to allow</p>'
		+	'<ul>'
		+	'<li>to search, navigate and audit partial results in a common context,</li>'
		+	'<li>to exchange model information between organizations and tools.</li>'
		+	'</ul>'
		+	'<p>Please have a look at the <a href="https://specif.de" target="_blank">SpecIF Homepage</a> for further information.</p>'
		+	'<p>Version: '+app.productVersion+' supporting SpecIF up to version '+app.specifVersion+'.</p>'
		+	'<p>License: <a href="https://github.com/GfSE/SpecIF-Viewer/blob/master/LICENSE" target="_blank">Apache 2.0</a></p>'
	//	+	'<p>Please press \'<a href="http://reqif.de/index.php/contact/articles/reqif-message.html" target="_blank">Support</a>\' to file a request for assistance.</p>'
		+	'<h4>Features</h4>'
		+		'<ul>'
		+		  "<li>Import 'specif' and 'specifz' file with schema and consistency check</li>"
		+		  "<li>Import 'reqif' file (planned)</li>"
		+		  "<li>Import MS-Excel 'XLSX', 'XLS' and 'CSV' file</li>"
		+		  "<li>Import 'BPMN-XML' file</li>"
		+		  "<li>Import from an URL or the local file system</li>"
		+		  "<li>Browse the content ('resources') along any supplied hierarchy</li>"
		+ (isEditor? "<li>Create, clone and update resources with an input form derived from the respective resource class</li>":"")
		+ (isEditor? "<li>Move single nodes and subtrees in the hierarchy by drag'n'drop</li>":"")
		+		  "<li>Inspect the semantic net ('statements')</li>"
		+ (isEditor? "<li>Create statements according to the options defined in the statement classes</li>":"")
		+ (isEditor? "<li>Delete selected resources and statements</li>":"")
		+		  "<li>Filter using text fragments ('full text search'), resource types or enumerated property values</li>"
		+		  "<li>Report some model-based statistics, such as used resource types or used property enumerated values</li>"
		+		  "<li>Export 'specifz' file</li>"
		+		  "<li>Export 'reqifz' file</li>"
		+		  "<li>Export 'ePub' file</li>"
		+		  "<li>Export MS-Word OOXML file</li>"
		+		'</ul>'
		+	'<h4>Compatibility</h4>'
		+		'<ul>'
		+		  "<li>Mozilla Firefox</li>"
		+		  "<li>Google Chromium and Chrome</li>"
		+		  "<li>Apple Safari</li>"
		+		  "<li>Opera</li>"
		+		  "<li>Microsoft Edge <em>(beware of performance issues in case of bigger models)</em></li>"
		+		  "<li>Microsoft Internet Explorer is <em>not</em> supported</li>"
		+		'</ul>'
		+	'</div>'
		+	'<div class="col-md-6" style="padding-right:0.4em; padding-left:0.4em;">'
		+	'<h4>Credits</h4>'
		+	'<p>The web-apps have been built with the open source components listed below. These are fine pieces of software '
		+				'and we gratefully thank the contributors for their effort.'
	//	+				'and we gratefully thank the contributors for their effort. Our policy is to donate 12% of our revenues made with'
	//	+				'the SpecIF Apps to these projects ... and we hope that our software will be useful to many people, as well.'
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
		+ (modules.isReady('markdown')?
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
		+			'<td>Display networks and networks consisting of nodes and edges ... '
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
		+		'</tr>'  */
		+		'<tr>'
		+			'<td>jQuery</td>'
		+			'<td></td>'
		+			'<td>jQuery makes things like HTML document traversal and manipulation, event handling, animation, and Ajax '
		+				'much simpler ... <a href="https://jquery.com/" target="_blank">more</a></td>'
		+			'<td><a href="https://jquery.org/license/" target="_blank">MIT</a></td>'
		+		'</tr>'
		+		'<tr>'
		+			'<td>Bootstrap</td>'
		+			'<td></td>'
		+			'<td>Front-end component library for responsive, mobile-first projects on the web ... '
		+				'<a href="http://getbootstrap.com/" target="_blank">more</a></td>'
		+			'<td><a href="https://github.com/twbs/bootstrap/blob/master/LICENSE" target="_blank">MIT</a></td>'
		+		'</tr>'
		+ (modules.isReady('diff')?
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
