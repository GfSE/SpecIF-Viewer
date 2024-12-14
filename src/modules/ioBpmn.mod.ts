/*!	iLaH: BPMN import 
	Dependencies: jQuery 3.0+
	(C)copyright enso managers gmbh (http://enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/

// Constructor for BPMN import:
// (A module constructor is needed, because there is an access to parent's data via 'self')
moduleManager.construct({
	name: 'ioBpmn'
}, function(self:ITransform) {

	var options: any,
		fDate: string,		// the file modification date
		fName:string,
		data,		// the SpecIF data structure for BPMN content
		bDO;

	self.init = function (opts?: any): boolean {
		options = opts;

		// Create a DOM element for the bpmnViewer outside of the visible area:
		$('#app').after('<div id="bpmnView"></div>');

		return true;
	};

	self.verify = function (f:File): boolean {

		function isBpmn(fname:string): boolean {
			return fname.endsWith('.bpmn')
		}

		if (!isBpmn(f.name)) {
			message.show(i18n.lookup('ErrInvalidFileBpmn', f.name));
			return false;
		};
		//		console.debug( 'file', f );
		// remove directory path:
		// see https://stackoverflow.com/questions/423376/how-to-get-the-file-name-from-a-full-path-using-javascript
		// @ts-ignore - in practice fname is always defined:
		fName = f.name.split('\\').pop().split('/').pop();

		// Remember the file modification date:
		if (f.lastModified) {
			fDate = new Date(f.lastModified).toISOString();
		}
		else {
			// Take the actual date as a final fall back.
			// Date() must get *no* parameter here; 
			// an undefined value causes an error and a null value brings the UNIX start date:
			fDate = new Date().toISOString();
		};
		//		console.debug( 'file', f, fDate );
		return true;
	};
	self.toSpecif = function (buf: ArrayBuffer): JQueryDeferred<SpecIF> {
		// import a BPMN file from a buffer:
		self.abortFlag = false;
		bDO = $.Deferred();

		let mMime = "application/bpmn+xml",
			xml = LIB.ab2str(buf),
			iName = fName.fileName() + '.svg',
			iMime = 'image/svg+xml';

	//	bDO.notify('Transforming BPMN to SpecIF',10); 
		// @ts-ignore - BPMN2Specif() is loaded at runtime
		data = BPMN2Specif(
				xml,
				{ 
					imgName: iName, 
					imgMime: iMime,
					modified: fDate, 
					titleLength: CONFIG.maxTitleLength,
					textLength: CONFIG.maxStringLength,
				//	strAnnotationFolder: "SpecIF:Annotations",
					strRoleType: CONFIG.resClassRole,
					strConditionType: CONFIG.resClassCondition,
					strBusinessProcessType: CONFIG.resClassProcess,
					strBusinessProcessesType: CONFIG.resClassProcesses,
					strBusinessProcessFolder: CONFIG.resClassProcesses
				}
		);

		// Optionally include the original BPMN file itself:
		if( options.ingest.includes("source"))
			data.files.push({
				id: 'F-' + simpleHash(fName),
				title: fName,
				blob: new Blob([xml], { type: mMime }),
				type: mMime,
				changedAt: fDate
			} as SpecifFile);

		// Include a SVG image of the process:
		bpmn2svg(xml).then(
			(result) => {
				data.files.push({
					id: 'F-' + simpleHash(iName),
					title: iName,
					//	blob: new Blob([result.svg], { type: "image/svg+xml; charset=utf-8" }),
					blob: new Blob([result.svg], { type: iMime }),
					type: iMime,
					changedAt: fDate
				} as SpecifFile);

				finalize();
			},
			bDO.reject
		);
		return bDO

		function finalize() {
		//	console.debug('input.prjName', self.parent.projectName, data );
			if (typeof (data) == 'object' && data.id)
				bDO.resolve(data)
			else
				bDO.reject(new resultMsg(999, 'Input file could not be transformed to SpecIF'));
		}
	};
	self.abort = function() {
		app.projects.abort();
		self.abortFlag = true
	};
	return self;

	// For displaying BPMN, see:
	// https://github.com/bpmn-io/bpmn-js-examples/tree/master/pre-packaged
	// https://bpmn.io/blog/posts/2014-bpmn-js-viewer-is-here.html
	// https://forum.bpmn.io/t/how-to-get-svg-object-from-viewer/1948
	// https://forum.bpmn.io/t/saving-bpmn-and-svg-to-a-website-rather-than-download/210
	// https://github.com/bpmn-io/bpmn-js-callbacks-to-promises
	// https://www.pleus.net/blog/?p=2142
	function bpmn2svg(xml: string): Promise<any> {
		// transform the BPMN-XML and render the diagram,
		return new Promise((resolve, reject) => {
			// create viewer instance:
			// @ts-ignore - BpmnJS() is loaded at runtime
			var bpmnViewer = new BpmnJS({ container: '#bpmnView' });

			bpmnViewer.importXML(xml)
				.then(
					() => {
						/*		// access viewer components:
								var canvas = bpmnViewer.get('canvas');
								// set viewport: ToDo
								// zoom to fit full viewport:
								canvas.zoom('fit-viewport')  */

						resolve(bpmnViewer.saveSVG())
					}
				)
				.catch(reject)
				.finally(
					() => {
						$('#bpmnView').empty()
					}
				)
		})
	}
});
