"use strict";
/*!	RDF import and export
    Dependencies:
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    Author: se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/
moduleManager.construct({
    name: 'ioRdf'
}, function (self) {
    var mime;
    self.init = function () {
        return true;
    };
    self.verify = function (f) {
        function rdfFile2mediaType(fname) {
            if (fname.endsWith('.rdf') || fname.endsWith('.xml'))
                return 'application/rdf+xml';
            return '';
        }
        mime = rdfFile2mediaType(f.name);
        if (mime)
            return true;
        message.show(i18n.lookup('ErrInvalidFileRdf', f.name));
        return false;
    };
    self.abort = function () {
        self.abortFlag = true;
    };
    return self;
});
