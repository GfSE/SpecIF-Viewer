# SpecIF Viewer and Editor [![Build Status](https://travis-ci.org/GfSE/SpecIF-Viewer.svg?branch=master)](https://travis-ci.org/GfSE/SpecIF-Viewer)
An app for your web-browser to view, edit\* and transform system specifications. (Features of the SpecIF Editor are marked with an asterisk\*).

SpecIF is the 'Specification Integration Facility'. It's purpose is to combine partial specifications from different tools in a single model to allow
- to search, navigate and audit partial results in a common context
- to exchange model information between organizations and tools.

Please have a look at the [SpecIF Homepage](https://specif.de) for further information.

## Features
- Import 'specif' and 'specifz' file with schema and consistency check
- Import 'reqif' file (planned)
- Import MS-Excel 'XLSX', 'XLS' and 'CSV' file
- Import 'BPMN-XML' file
- Import Archimate Open-Exchange (experimental)
- Import from an URL or the local file system
- Browse the content ('resources') along the supplied hierarchy
- Create, clone and update resources with an input form derived from the respective resource class*
- Move single nodes and subtrees in the hierarchy by drag'n'drop*
- Inspect the semantic net ('statements')
- Create statements according to the options defined in the statement classes*
- Delete selected resources and statements*
- Filter using text fragments ('full text search'), resource types or enumerated property values
- Report some model-based statistics, such as used resource types or used property enumerated values
- Export 'specifz' file
- Export 'reqif' file
- Export 'ePub' file
- Export MS-Word OOXML file

## Demonstration
The app has been installed for demonstration
- View the [dimmer example](https://specif.de/apps/view#import=../examples/Dimmer.specifz) in SpecIF format,
- View a [BPMN example](https://specif.de/apps/view#import=../examples/Fahrtbeginn.bpmn) in BPMN 2.0 XML format,
- View a [XLSX example](https://specif.de/apps/view#import=../examples/Requirements.xlsx) in XSLX format,
- View the [SpecIF Vocabulary](https://specif.de/apps/view#import=../examples/Vocabulary.specifz) in SpecIF format,
- Start the [viewer](https://specif.de/apps/view) to load and view your own files.
- Start the [editor](https://specif.de/apps/edit) to load and edit your own files.

## Compatibility
- Mozilla Firefox
- Google Chromium and Chrome
- Apple Safari _(beware of performance issues in case of bigger models)_
- Opera
- Microsoft Edge _(beware of performance issues in case of bigger models)_
- Microsoft Internet Explorer is _not any more_ supported

## Installation
For any purpose other than demonstration please install the latest [release](https://github.com/GfSE/SpecIF-Viewer/releases) on a web server of your choice. Just unpack the files and load 'yourPath/view' or 'yourPath/edit' with a web-browser.

## Running the App Locally
First, make sure, that you have NodeJS and NPM installed.

Then, install all dependencies:
```bash
  npm install
```

After installing all dependencies, run the build script:
```bash
  npm run start
```

### On Windows

After creating the build directory, you may start the local web-server:
```
  http-server
```

- Then, navigate to localhost -> build -> view.html to open the SpecIF Viewer 
- Temporarily deactivate ```Cross-Origin Restrictions``` and ```Local File Restrictions``` in your browser, if you encounter a blank screen.
Make sure to re-activate these settings, later.

## Acknowledgements
This work has been sponsored by [enso-managers gmbh](http://enso-managers.de) and [adesso SE](http://adesso.de), both Berlin
