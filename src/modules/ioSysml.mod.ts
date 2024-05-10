/*!	SysML import and export
	Dependencies: 
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/

// Constructor for RDF import and export:
// (A module constructor is needed, because there is an access to parent's data via 'self.parent..')
moduleManager.construct({
	name: 'ioSysml'
}, function(self:ITransform) {

	var fDate: string,		// the file modification date
		fName: string,
		data,		// the SpecIF data structure for xls content
		mime: string;
	self.init = function():boolean {
		return true;
	};
	self.verify = function( f ):boolean {
	
			function sysmlFile2mediaType( fname:string ):string {
				if( fname.endsWith('.xmi') || fname.endsWith('.xml') ) return 'application/vnd.xmi+xml';
				return '';
			}
				
		// remove directory path:
		// see https://stackoverflow.com/questions/423376/how-to-get-the-file-name-from-a-full-path-using-javascript
		// @ts-ignore - in practice fname is always defined:
		fName = f.name.split('\\').pop().split('/').pop();

		// Remember the file modification date:
		if (f.lastModified) {
			fDate = new Date(f.lastModified).toISOString()
		}
		else {
			// Take the actual date as a final fall back.
			// Date() must get *no* parameter here; 
			// an undefined value causes an error and a null value brings the UNIX start date:
			fDate = new Date().toISOString()
		};

		mime = sysmlFile2mediaType(f.name);
		if ( mime ) 
			return true;
		// else:
		message.show( i18n.lookup('ErrInvalidFileSysml', f.name) );
		return false;
	};
	self.toSpecif = function (buf: ArrayBuffer): JQueryDeferred<SpecIF> {
		// import an Excel file from a buffer:
		self.abortFlag = false;
		var sDO = $.Deferred();

		//	sDO.notify('Transforming Excel to SpecIF',10); 
		// Transform the XMI-data to SpecIF:
		data = sysml2specif(
			LIB.ab2str(buf),
			{
			//	projectName: self.parent.projectName,
				fileName: fName,
				fileDate: fDate,
				titleLength: CONFIG.maxTitleLength,
				textLength: CONFIG.maxStringLength,
				modelElementClasses: app.ontology.modelElementClasses
				//	strAnnotationFolder: "SpecIF:Annotations",
				//	strRoleType: CONFIG.resClassRole,
				//	strConditionType: CONFIG.resClassCondition,
				//  strBusinessProcessType: CONFIG.resClassProcess,
				//  strBusinessProcessesType: CONFIG.resClassProcesses,
				//  strBusinessProcessFolder: CONFIG.resClassProcesses
			}
		);
		if (data)
			sDO.resolve(data)
		else
			sDO.reject(new xhrMessage(999,"Invalid XMI-File: exporter must be MagicDraw 19.0"));			;

		return sDO
	};
/*	self.fromSpecif = function(pr:SpecIF):string {
		// pr is SpecIF data in JSON format (not the internal cache),
		// transform pr to RDF:
		
//		console.debug( 'ioRdf.fromSpecif', simpleClone(pr) );
		
		var xml = '';

		return xml;
	}; */
	self.abort = function():void {
//		app.projects.abort();
		self.abortFlag = true
	};
	return self;
});
