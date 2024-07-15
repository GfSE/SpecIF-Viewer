"use strict";
/*!	SpecIF import
    Dependencies: jQuery 3.1+
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    Author: se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/
moduleManager.construct({
    name: 'ioSpecif'
}, (self) => {
    "use strict";
    let zipped, opts;
    const errNoOptions = new resultMsg(899, 'Programming flaw: No options or no mediaTypes defined.'), errNoSpecif = new resultMsg(901, 'No SpecIF file in the specifz container.'), errInvalidJson = new resultMsg(900, 'SpecIF data is not valid JSON.');
    self.init = (options) => {
        opts = options;
        return true;
    };
    self.verify = (f) => {
        if (f.name.endsWith('.specif')) {
            zipped = false;
            return true;
        }
        ;
        if (f.name.endsWith('.specifz') || f.name.endsWith('.specif.zip')) {
            zipped = true;
            return true;
        }
        ;
        try {
            message.show(i18n.lookup('ErrInvalidFileSpecif', f.name), { severity: 'warning' });
        }
        catch (err) {
            alert(f.name + ' has invalid file type.');
        }
        ;
        return false;
    };
    self.toSpecif = (buf) => {
        self.abortFlag = false;
        var zDO = $.Deferred();
        if (zipped) {
            new JSZip().loadAsync(buf)
                .then((zip) => {
                let fileL = zip.filter((relPath, file) => { return file.name.endsWith('.specif'); }), data;
                if (fileL.length < 1) {
                    zDO.reject(errNoSpecif);
                    return zDO;
                }
                ;
                zip.file(fileL[0].name).async("string")
                    .then((dta) => {
                    try {
                        data = JSON.parse(LIB.trimJson(dta));
                        data.files = [];
                        if (opts && typeof (opts.mediaTypeOf) == 'function') {
                            fileL = zip.filter((relPath, file) => { return !file.name.endsWith('.specif'); });
                            if (fileL.length > 0) {
                                let pend = 0;
                                fileL.forEach((aFile) => {
                                    if (aFile.dir)
                                        return false;
                                    let fType = opts.mediaTypeOf(aFile.name);
                                    if (!fType)
                                        return false;
                                    pend++;
                                    zip.file(aFile.name).async("blob")
                                        .then((f) => {
                                        data.files.push({
                                            blob: f,
                                            id: 'F-' + simpleHash(aFile.name),
                                            title: aFile.name,
                                            type: fType,
                                            changedAt: aFile.date.toISOString()
                                        });
                                        if (--pend < 1)
                                            zDO.resolve(data);
                                    });
                                });
                                if (pend < 1)
                                    zDO.resolve(data);
                            }
                            else {
                                zDO.resolve(data);
                            }
                        }
                        else {
                            console.warn(errNoOptions.statusText);
                            zDO.resolve(data);
                        }
                        ;
                    }
                    catch (err) {
                        zDO.reject(errInvalidJson);
                    }
                    ;
                });
            });
        }
        else {
            try {
                var data = JSON.parse(LIB.trimJson(LIB.ab2str(buf)));
                zDO.resolve(data);
            }
            catch (err) {
                zDO.reject(errInvalidJson);
            }
            ;
        }
        ;
        return zDO;
    };
    self.abort = () => {
        self.abortFlag = true;
    };
    return self;
});
