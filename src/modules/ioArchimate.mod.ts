/*!	iLaH: Open Exchange file import 
	Dependencies: jQuery 3.0+
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de            
*/

// Constructor for Archimate Open-Exchange import:
// (A module constructor is needed, because there is an access to parent's data via 'self')
moduleManager.construct({
	name: 'ioArchimate'
}, function(self:IModule):IModule {
	"use strict";
	var fDate: string,		// the file modification date
		fName: string,
		data: SpecIF,		// the SpecIF data structure for xls content
		bDO;

	self.init = function (): boolean {
		return true
	};

	self.verify = function( f ):boolean {

			function isArchimate( fname:string ):boolean {
				// ToDo: Briefly check for Archimate content
				return fname.endsWith('.xml') 
			}
				
		if ( !isArchimate(f.name) ) {
			message.show( i18n.lookup('ErrInvalidFileTogaf', f.name) );
			return false;
		};
//		console.debug( 'file', f );
		// remove directory path:
		// see https://stackoverflow.com/questions/423376/how-to-get-the-file-name-from-a-full-path-using-javascript
		fName = f.name.split('\\').pop().split('/').pop();
		
		// Remember the file modification date:
		if( f.lastModified ) {
			fDate = new Date(f.lastModified).toISOString()
		} else {
			if( f.lastModifiedDate )
				// this is deprecated, but at the time of coding Edge does not support 'lastModified', yet:
				fDate = new Date(f.lastModifiedDate).toISOString()
			else
				// Take the actual date as a final fall back.
				// Date() must get *no* parameter here; 
				// an undefined value causes an error and a null value brings the UNIX start date:
				fDate = new Date().toISOString()
		};
//		console.debug( 'file', f, fDate );
		return true;
	},

	self.toSpecif = function (buf: ArrayBuffer): JQueryDeferred<SpecIF> {
		// import an Archimate Open-Exchange file (XML) from a buffer:
		self.abortFlag = false;
		bDO = $.Deferred();

		bDO.notify('Transforming Archimate Open Exchange to SpecIF',10); 
		// @ts-ignore - Archimate2Specif() is loaded at runtime
		data = Archimate2Specif( ab2str(buf),
							{ 
								fileName: fName, 
								fileDate: fDate, 
								titleLength: CONFIG.textThreshold,
								descriptionLength: CONFIG.maxStringLength,
								strGlossaryType: CONFIG.resClassGlossary,
								strGlossaryFolder: CONFIG.resClassGlossary,
								strActorFolder: "FMC:Actors",
								strStateFolder: "FMC:States",
								strEventFolder: "FMC:Events",
								strCollectionFolder: "SpecIF:Collections",
						//		strAnnotationFolder: "SpecIF:Annotations",
						//		strRoleType: "SpecIF:Role",
								// the property names to hide a document as used at Vattenfall:
								hiddenDiagramProperties: ["Report:View:Hide","Report:View:Hide:Diagram"]
							}); 
//		console.debug('ioArchimate.toSpecif', self.parent.projectName, data );
		if( typeof(data)=='object' && data.id )
			bDO.resolve( data )
		else
			bDO.reject({ status:999, statusText:'Input file could not be transformed to SpecIF'});

		return bDO;
	};
	self.abort = function():void {
		app.cache.abort();
		self.abortFlag = true;
	};
	return self;
});
