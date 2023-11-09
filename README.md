# SpecIF Model-Integrator, Editor and Viewer [![Build Status](https://travis-ci.org/GfSE/SpecIF-Viewer.svg?branch=master)](https://travis-ci.org/GfSE/SpecIF-Viewer)
An app for your web-browser to view, edit\* and transform system specifications. (Features of the SpecIF Editor are marked with an asterisk\*).

SpecIF is the 'Specification Integration Facility'. It's purpose is to combine partial specifications from different tools in a single model to allow
- to search, navigate and audit partial results in a common context
- to exchange model information between organizations and tools.

Please have a look at the [SpecIF Homepage](https://specif.de) for further information.

## Features
- Import 'specif' and 'specif.zip' file with schema and consistency check
- Import 'reqif' an 'reqifz' file (experimental)
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
