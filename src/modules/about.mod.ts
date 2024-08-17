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
		// Update browser history, if it is a view change or item selection, 
		// but not navigation in the browser history:
		if (!(opts && opts.urlParams))
			setUrlParams({
				view: self.view.substring(1)    // remove leading hash
			});

		$('#pageTitle').html(app.title);
		// see: https://stackoverflow.com/questions/17710039/full-page-iframe
		$('#about').html(
			'<iframe id="aboutFrame" '
			+ 'src="./index.html" '
			+ 'title="About SpecIF Apps" '
			+ 'style="width: 100%; border: none; margin: 0; padding: 0; height: 100%;" '
			+ '/>'
		);
	};
	return self;
});
