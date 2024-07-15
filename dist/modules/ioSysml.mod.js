"use strict";
/*!	SysML import and export
    Dependencies:
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    Author: se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/
moduleManager.construct({
    name: 'ioSysml'
}, function (self) {
    var fDate, fName, zipped, mime, errNoXMIFile = new resultMsg(897, 'No XMI file found in the container.'), errInvalidXML = new resultMsg(898, 'XMI data is not valid XML.');
    self.init = function (options) {
        mime = undefined;
        return true;
    };
    self.verify = function (f) {
        function sysmlFile2mediaType(fname) {
            if (fname.endsWith('.mdzip')) {
                zipped = true;
                return 'application/zip';
            }
            ;
            return '';
        }
        fName = f.name.split('\\').pop().split('/').pop();
        if (f.lastModified) {
            fDate = new Date(f.lastModified).toISOString();
        }
        else {
            fDate = new Date().toISOString();
        }
        ;
        mime = sysmlFile2mediaType(f.name);
        if (mime)
            return true;
        message.show(i18n.lookup('ErrInvalidFileSysml', f.name));
        return false;
    };
    self.toSpecif = function (buf) {
        let sDO = $.Deferred(), modelL = [], packgL = [], resL = [], pend = 0, xOpts = {
            fileName: fName,
            fileDate: fDate,
            titleLength: CONFIG.maxTitleLength,
            textLength: CONFIG.maxStringLength,
            modelElementClasses: app.ontology.modelElementClasses
        };
        self.abortFlag = false;
        if (zipped) {
            new JSZip().loadAsync(buf)
                .then((zip) => {
                modelL = zip.filter((relPath, file) => { return file.name.endsWith('.uml_model.model'); });
                packgL = zip.filter((relPath, file) => { return file.name.endsWith('.uml_model.shared_model'); });
                if (modelL.length < 1) {
                    sDO.reject(errNoXMIFile);
                    return;
                }
                ;
                if (modelL.length > 1) {
                    console.warn("SysML Import: More than one model file found in container");
                }
                ;
                console.debug('iospecif.toSpecif 1', modelL, packgL);
                pend = packgL.length + 1;
                zip.file(modelL[0].name).async("string")
                    .then(xlate);
                for (var p of packgL) {
                    zip.file(p.name).async("string")
                        .then(xlate);
                }
                ;
            });
        }
        else {
            sDO.reject(new resultMsg(899, 'SysML Import: Input file is not supported'));
        }
        ;
        return sDO;
        function xlate(xmi) {
            if (!LIB.validXML(xmi)) {
                sDO.reject(errInvalidXML);
                return;
            }
            ;
            let result = sysml2specif(xmi, xOpts);
            if (result.status != 0) {
                sDO.reject(result);
                return;
            }
            ;
            resL.push(result.response);
            if (--pend < 1)
                sDO.resolve(resL);
        }
    };
    self.abort = function () {
        self.abortFlag = true;
    };
    return self;
});
