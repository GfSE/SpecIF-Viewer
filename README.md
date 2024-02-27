# SpecIF Model-Integrator, Editor and Viewer [![Build Status](https://travis-ci.org/GfSE/SpecIF-Viewer.svg?branch=master)](https://travis-ci.org/GfSE/SpecIF-Viewer)
An app for your web-browser to view, edit\* and transform system specifications. (Features of the SpecIF Editor are marked with an asterisk\*).

SpecIF is the 'Specification Integration Facility'. It's purpose is to combine partial specifications from different tools in a single model to allow
- to search, navigate and audit partial results in a common context
- to exchange model information between organizations and tools.

Please have a look at the [SpecIF Homepage](https://specif.de) for further information.

## Features
- Import 'specif' and 'specif.zip' file with schema and consistency check
- Import 'reqif' and 'reqifz' file (experimental)
- Import MS-Excel 'XLSX', 'XLS' and 'CSV' file
- Import 'BPMN-XML' file
- Import ArchiMate Open-Exchange (experimental)
- Import from an URL or the local file system
- Merge models of different tools and notations*
- Browse the content ('resources') along the supplied hierarchy
- Display model-element details when hovering over a representation on a diagram (in case of SVG images with annotated model-element identifier)
- Create, clone and update resources with an input form derived from the respective resource class*
- Move single nodes and subtrees in the hierarchy by drag'n'drop*
- Inspect the semantic net ('statements')
- Create statements according to the options defined in the statement classes*
- Delete selected resources and statements*
- Filter using text fragments ('full text search'), resource classes or enumerated property values
- Report some model-based statistics, such as used resource classes or used property enumerated values
- Export 'html' file with embedded SpecIF data
- Export 'specif.zip' file
- Export 'reqifz' file (Requirements Interchange Format)
- Export 'Turtle' file (experimental)
- Export 'ePub' file
- Export MS-Word OOXML file

## Compatibility
- Mozilla Firefox
- Google Chromium and Chrome
- Microsoft Edge
- Apple Safari _(beware of performance issues in case of bigger models)_
- Opera
- Microsoft Internet Explorer is _not any more_ supported

## Maturity
The software code is a reference implementation and has not been designed for high data volume and other production requirements. 
Any contribution to this collaborative effort is highly welcome!

## Demonstration
The app has been installed for demonstration
- View the [dimmer example](https://specif.de/apps/view#import=../examples/Dimmer.specifz) in SpecIF format,
- View a [BPMN example](https://specif.de/apps/view#import=../examples/Fahrtbeginn.bpmn) in BPMN 2.0 XML format,
- View a [XLSX example](https://specif.de/apps/view#import=../examples/Requirements.xlsx) in XSLX format,
- View the [SpecIF Vocabulary](https://specif.de/apps/view#import=../examples/Vocabulary.specifz) in SpecIF format,
- Start the [viewer](https://specif.de/apps/view) to load and view your own files.
- Start the [editor](https://specif.de/apps/edit) to load and edit your own files.

The installation provided for your convenience is neither intended to be highly available nor scalable.
You may use the [latest release](https://github.com/GfSE/SpecIF-Viewer/releases) of the software for 
your own installation, see below.

## Compatibility
- Mozilla Firefox
- Google Chromium and Chrome
- Microsoft Edge
- Opera
- Apple Safari _(beware of performance issues in case of bigger models)_
- Microsoft Internet Explorer is _not any more_ supported

## Installation
For any purpose other than demonstration please install the latest [release](https://github.com/GfSE/SpecIF-Viewer/releases) 
on a web server of your choice. Just unpack the files and load 'yourPath/view' or 'yourPath/edit' with a web-browser.

## Running the App Locally
First, make sure you have NodeJS and NPM installed.

Then, install all dependencies:
```bash
  npm install
```

After installing all dependencies, run the build script:
```bash
  npm run start
```

### On Windows

After creating the build directory with the executables, you may start the local web-server:
```
  http-server
```

- Then, navigate to localhost -> build -> view.html to open the SpecIF Viewer 
- Temporarily deactivate ```Cross-Origin Restrictions``` and ```Local File Restrictions``` in your browser, if you encounter a blank screen.
Make sure to re-activate these settings, later.

## Acknowledgements
This work has been sponsored by [enso-managers gmbh](http://enso-managers.de) and [adesso SE](http://adesso.de), both Berlin.

The SpecIF web-apps have been built with the open source components listed below. These are fine pieces of software 
and we gratefully thank the contributors for their effort.

<table class="table table-condensed">
<thead>
<tr>
	<th width="15%">Library</th><th>Author</th><th>Description</th><th>License</th>
</tr>
</thead>
<tbody>
<tr>
	<td>AJV</td>
	<td><a href="https://github.com/epoberezkin" target="_blank">Evgeny Poberezkin</a></td>
	<td>Another JSON Schema Validator ... <a href="https://github.com/epoberezkin/ajv" target="_blank">more</a></td>
	<td><a href="https://github.com/epoberezkin/ajv/blob/master/LICENSE" target="_blank">MIT</a></td>
</tr>
<tr>
	<td>jqTree</td>
	<td><a href="https://github.com/mbraak" target="_blank">Marco Braak</a></td>
	<td>A tree with collapsible branches and drag\'n\'drop support 
		for rearranging chapters and paragraphs ... <a href="http://mbraak.github.io/jqTree/" target="_blank">more</a></td>
	<td><a href="https://github.com/mbraak/jqTree/blob/master/LICENSE" target="_blank">Apache 2.0</a></td>
</tr>
<tr>
	<td>markdown-it</td>
	<td><a href="https://github.com/Kirill89" target="_blank">Kirill</a>,&nbsp;<a href="https://github.com/puzrin" target="_blank">Vitaly Puzrin</a>,&nbsp;<a href="https://github.com/rlidwka" target="_blank">Alex Kocharin</a></td>
	<td>Markdown parser, done right. 100% CommonMark support, extensions, syntax plugins & high speed ... <a href="https://markdown-it.github.io/" target="_blank">more</a></td>
	<td><a href="https://github.com/jonschlinkert/remarkable/blob/master/LICENSE" target="_blank">MIT</a></td>
</tr> 
<tr>
	<td>JSZip</td>
	<td><a href="https://github.com/Stuk" target="_blank">Stuart Knightley, David Duponchel, Franz Buchinger, António Afonso</a></td>
	<td>A library for creating, reading and editing .zip files ... <a href="https://github.com/Stuk/jszip" target="_blank">more</a></td>
	<td><a href="https://github.com/Stuk/jszip/blob/master/LICENSE.markdown" target="_blank">MIT</a></td>
</tr>
<tr>
	<td>FileSaver</td>
	<td><a href="http://eligrey.com/" target="_blank">Eli Grey</a></td>
	<td>Save files to the local file system ... <a href="https://github.com/eligrey/FileSaver.js/" target="_blank">more</a></td>
	<td><a href="https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md" target="_blank">MIT</a></td>
</tr>
<tr>
	<td>BPMN-Viewer</td>
	<td></td>
	<td>A BPMN 2.0 rendering toolkit and web modeler ... <a href="https://bpmn.io/toolkit/bpmn-js/" target="_blank">more</a></td>
	<td><a href="https://github.com/bpmn-io/bpmn-js/blob/develop/LICENSE" target="_blank">bpmn.io</a></td>
</tr>
<tr>
	<td>vis.js Network</td>
	<td></td>
	<td>Display networks consisting of nodes and edges ... 
		<a href="https://visjs.github.io/vis-network/docs/network/" target="_blank">more</a></td>
	<td><a href="http://www.apache.org/licenses/LICENSE-2.0" target="_blank">Apache 2.0</a> or 
		<a href="http://opensource.org/licenses/MIT" target="_blank">MIT</a></td>
</tr>
<tr>
	<td>js-xlsx</td>
	<td></td>
	<td>Excel parser and writer ... <a href="https://github.com/SheetJS/js-xlsx" target="_blank">more</a></td>
	<td><a href="https://github.com/SheetJS/js-xlsx/blob/master/LICENSE" target="_blank">Apache 2.0</a></td>
</tr>
<tr>
	<td>jQuery</td>
	<td></td>
	<td>jQuery makes things like HTML document traversal and manipulation, event handling, animation 
		and Ajax much simpler ... <a href="https://jquery.com/" target="_blank">more</a></td>
	<td><a href="https://jquery.org/license/" target="_blank">MIT</a></td>
</tr>
<tr>
	<td>Bootstrap Icons</td>
	<td></td>
	<td>Free, high quality, open source icon library with over 1,800 icons. 
		Use them with or without Bootstrap in any project ... <a href="https://icons.getbootstrap.com/" target="_blank">more</a></td>
	<td><a href="https://github.com/twbs/bootstrap/blob/master/LICENSE" target="_blank">MIT</a></td>
</tr>
<tr>
	<td>Bootstrap</td>
	<td></td>
	<td>Front-end component library for responsive, mobile-first projects on the web ... 
		<a href="http://getbootstrap.com/" target="_blank">more</a></td>
	<td><a href="https://github.com/twbs/bootstrap/blob/master/LICENSE" target="_blank">MIT</a></td>
</tr>
<tr>
	<td>diff-match-patch</td>
	<td></td>
	<td>A library for text comparison, matching and patching ... 
		<a href="https://code.google.com/p/google-diff-match-patch/" target="_blank">more</a></td>
	<td><a href="http://www.apache.org/licenses/LICENSE-2.0" target="_blank">Apache 2.0</a></td>
</tr>
</tbody>
</table>
