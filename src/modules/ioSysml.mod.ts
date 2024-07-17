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
		zipped: boolean,
		mime: string,
	//	iOpts: any,  // import options
	//	errNoOptions = new resultMsg(896, 'No options or no mediaTypes defined.'),
		errNoXMIFile = new resultMsg(897, 'No XMI file found in the container.'),
		errInvalidXML = new resultMsg(898, 'XMI data is not valid XML.');
	self.init = function (options: any):boolean {
		mime = undefined;
	//	iOpts = options;
		return true;
	};
	self.verify = function( f ):boolean {
	
			function sysmlFile2mediaType( fname:string ):string {
				if (fname.endsWith('.mdzip')) {
					zipped = true;
					return 'application/zip';
				};
			//	if( fname.endsWith('.xmi') || fname.endsWith('.xml') ) return 'application/vnd.xmi+xml';
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
		// Transform UML/SysML XMI to SpecIF for import:
		// buf is an array-buffer containing reqif data:
		//		console.debug('ioSysml.toSpecif');
		//self.abortFlag = false;
		let sDO = $.Deferred(),
			modelL = [],
			packgL = [],
			resL: SpecIF[] = [],
			pend = 0,
			xOpts = {  // transformation options
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
			};

		self.abortFlag = false;
		if (zipped) {
			// @ts-ignore - JSZIP is loaded at runtime
			new JSZip().loadAsync(buf)
				.then((zip: any) => {
					// @ts-ignore - all's fine, no need to re-declare the zip interface.
					modelL = zip.filter((relPath, file) => { return file.name.endsWith('.uml_model.model') });
					// @ts-ignore - all's fine, no need to re-declare the zip interface.
					packgL = zip.filter((relPath, file) => { return file.name.endsWith('.uml_model.shared_model') });

					if (modelL.length < 1) {
						sDO.reject(errNoXMIFile);
						return;
					};
					if (modelL.length > 1) {
						console.warn("SysML Import: More than one model file found in container");
					};
//					console.debug('ioSysml.toSpecif 1',modelL,packgL);

					// transform all uml/sysml model files found:
					pend = packgL.length + 1;
					zip.file(modelL[0].name).async("string")
						.then(xlate);
					for (var p of packgL) {
						zip.file(p.name).async("string")
							.then( xlate );
					};
				});
		}
		else {
			// Selected file is not zipped
			sDO.reject(new resultMsg(899, 'SysML Import: Input file is not supported'));

			// ToDo: Cut-off UTF-8 byte-order-mask ( 3 bytes xEF xBB xBF ) at the beginning of the file, if present. ??

		/*	let str = LIB.ab2str(buf);
			if (str && LIB.validXML(str)) {
				// @ts-ignore - sysml2Specif() is loaded at runtime
				var result = sysml2specif( str, xOpts );
				if (result.status == 0)
					sDO.resolve(result.response)
				else
					sDO.reject(result);
			}
			else {
				sDO.reject(errInvalidXML);
			} */
		};

		return sDO;

		function xlate(xmi: string) {
			// Check if data is valid XML:
			// Please note:
			// - the file may have a UTF-8 BOM
			// - all property values are encoded as string, even if boolean, integer or double.

			if (!LIB.validXML(xmi)) {
				//console.debug(xmi)
				sDO.reject(errInvalidXML);
				return;
			};
			// XML data is valid:
			// @ts-ignore - sysml2specif() is loaded at runtime
			let result = sysml2specif(xmi, xOpts);
			if (result.status != 0) {
				//console.debug(xmi)
				sDO.reject(result);
				return;
			};
			// SysML data is valid:
			resL.push(result.response);

			if (--pend < 1)
				sDO.resolve(resL);
		}
	};
/*	self.fromSpecif = function(pr:SpecIF):string {
		// pr is SpecIF data in JSON format (not the internal cache),
		// xlate pr to RDF:
		
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
