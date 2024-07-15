"use strict";
/*!	iLaH: BPMN import
    Dependencies: jQuery 3.0+
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    Author: se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/
moduleManager.construct({
    name: 'ioBpmn'
}, function (self) {
    var fDate, fName, data, bDO;
    $('#app').after('<div id="bpmnView"></div>');
    self.init = function () {
        return true;
    };
    self.verify = function (f) {
        function isBpmn(fname) {
            return fname.endsWith('.bpmn');
        }
        if (!isBpmn(f.name)) {
            message.show(i18n.lookup('ErrInvalidFileBpmn', f.name));
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
    };
    self.toSpecif = function (buf) {
        self.abortFlag = false;
        bDO = $.Deferred();
        data = BPMN2Specif(LIB.ab2str(buf), {
            fileName: fName,
            fileDate: fDate,
            titleLength: CONFIG.maxTitleLength,
            textLength: CONFIG.maxStringLength,
            strRoleType: CONFIG.resClassRole,
            strConditionType: CONFIG.resClassCondition,
            strBusinessProcessType: CONFIG.resClassProcess,
            strBusinessProcessesType: CONFIG.resClassProcesses,
            strBusinessProcessFolder: CONFIG.resClassProcesses
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
function bpmn2svg(xml) {
    return new Promise((resolve, reject) => {
        var bpmnViewer = new BpmnJS({ container: '#bpmnView' });
        bpmnViewer.importXML(xml)
            .then(() => {
            resolve(bpmnViewer.saveSVG());
        })
            .catch(reject)
            .finally(() => {
            $('#bpmnView').empty();
        });
    });
}
