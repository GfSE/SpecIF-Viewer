"use strict";
/*!	iLaH: Open Exchange file import
    Dependencies: jQuery 3.0+
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    Author: se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/
moduleManager.construct({
    name: 'ioArchimate'
}, function (self) {
    var fDate, fName, data, bDO;
    self.init = function () {
        return true;
    };
    self.verify = function (f) {
        function isArchimate(fname) {
            return fname.endsWith('.xml');
        }
        if (!isArchimate(f.name)) {
            message.show(i18n.lookup('ErrInvalidFileTogaf', f.name));
            return false;
        }
        ;
        fName = f.name.split('\\').pop().split('/').pop();
        if (f.lastModified) {
            fDate = new Date(f.lastModified).toISOString();
        }
        else {
            fDate = new Date().toISOString();
        }
        ;
        return true;
    },
        self.toSpecif = function (buf) {
            self.abortFlag = false;
            bDO = $.Deferred();
            data = Archimate2Specif(LIB.ab2str(buf), {
                fileName: fName,
                fileDate: fDate,
                titleLength: CONFIG.maxTitleLength,
                textLength: CONFIG.maxStringLength,
                hiddenDiagramProperties: ["Report:View:Hide", "Report:View:Hide:Diagram"]
            });
            if (typeof (data) == 'object' && data.id)
                bDO.resolve(data);
            else
                bDO.reject(new resultMsg(999, 'Input file could not be transformed to SpecIF'));
            return bDO;
        };
    self.abort = function () {
        app.projects.abort();
        self.abortFlag = true;
    };
    return self;
});
