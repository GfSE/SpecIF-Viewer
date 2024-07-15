"use strict";
/*!	GUI and control for all importers
    Dependencies: jQuery 3.1+, bootstrap 3.1
    Copyright enso managers gmbh (http://enso-managers.de)
    Author: se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/
moduleManager.construct({
    name: 'importAny'
}, function (self) {
    const importModes = [{
            id: 'create',
            title: 'Create a new project with the given id',
            desc: 'All types, objects, relations and hierarchies will be created as specified.',
            label: i18n.BtnCreate
        }, {
            id: 'clone',
            title: 'Create a new instance of the project with a new id',
            desc: 'There will be two projects with the existing and the new content.',
            label: i18n.BtnClone
        }, {
            id: 'replace',
            title: 'Replace the project having the same id',
            desc: 'Existing content will be lost.',
            label: i18n.BtnReplace
        }, {
            id: 'adopt',
            title: 'Add the new project without effect on the existing one',
            desc: 'Add diagrams and adopt any existing resource having an identical name.',
            label: i18n.BtnAdopt
        }, {
            id: 'update',
            title: 'Update the project with new or changed content',
            desc: 'New objects will be created, modified ones will be superseded.',
            label: i18n.BtnUpdate
        }];
    const formats = [{
            id: 'specif',
            name: 'ioSpecif',
            desc: 'Specification Integration Facility',
            label: 'SpecIF',
            extensions: [".specif", ".specifz", ".specif.zip"],
            help: i18n.MsgImportSpecif,
            opts: { mediaTypeOf: LIB.attachment2mediaType, doCheck: ['statementClass.subjectClasses', 'statementClass.objectClasses'] }
        }, {
            id: 'archimate',
            name: 'ioArchimate',
            desc: 'ArchiMate Open Exchange',
            label: 'ArchiMate®',
            extensions: [".xml"],
            help: "Experimental: Import an ArchiMate Open Exchange file (*.xml) and add the diagrams (*.png or *.svg) to their respective resources using the 'edit' function.",
            opts: { mediaTypeOf: LIB.attachment2mediaType }
        }, {
            id: 'bpmn',
            name: 'ioBpmn',
            desc: 'Business Process',
            label: 'BPMN',
            extensions: [".bpmn"],
            help: i18n.MsgImportBpmn
        }, {
            id: 'sysml',
            name: 'ioSysml',
            desc: 'System Modeling Language',
            label: 'SysML',
            extensions: [".mdzip"],
            help: "Experimental: Import an XMI file from Cameo v19.0."
        }, {
            id: 'reqif',
            name: 'ioReqif',
            desc: 'Requirement Interchange Format',
            label: 'ReqIF',
            extensions: [".reqif", ".reqifz"],
            help: i18n.MsgImportReqif,
            opts: { multipleMode: "adopt", mediaTypeOf: LIB.attachment2mediaType, dontCheck: ["statement.subject", "statement.object"] }
        }, {
            id: 'xls',
            name: 'ioXls',
            desc: 'MS Excel® Spreadsheet',
            label: 'Excel®',
            extensions: [".xlsx", ".xls", ".csv"],
            help: i18n.MsgImportXls,
            opts: { dontCheck: ["statement.object"] }
        }];
    self.projectName = '';
    self.format = undefined;
    var showFileSelect, importMode = { id: 'replace' }, myFullName = 'app.' + self.loadAs, urlP, importing = false, cacheLoaded = false, allValid = false;
    self.clear = function () {
        $('input[type=file]').val('');
        setTextValue(i18n.LblFileName, '');
        setTextValue(i18n.LblProjectName, '');
        self.file = { name: '' };
        self.projectName = '';
        setProgress('', 0);
        setImporting(false);
        app.busy.reset();
        self.enableActions();
    };
    self.init = function () {
        if (!browser.supportsFileAPI) {
            message.show(i18n.MsgFileApiNotSupported, { severity: 'danger' });
            return false;
        }
        ;
        let h = '<div style="max-width:768px; margin-top:1em">'
            + '<div class="fileSelect" style="display:none;" >'
            + '<div class="attribute-label" style="vertical-align:top; font-size:140%; padding-top:0.2em" >' + i18n.LblImport + '</div>'
            + '<div class="attribute-value" >'
            + '<div id="formatSelector" class="btn-group" style="margin: 0 0 0.4em 0" ></div>'
            + '<div id="helpImport" style="margin: 0 0 0.4em 0" ></div>'
            + '<div id="fileSelectBtn" class="btn btn-default btn-fileinput" style="margin: 0 0 0.8em 0" ></div>'
            + '</div>'
            + '</div>'
            + '<form id="formNames" class="form-horizontal" role="form"></form>'
            + '<div class="fileSelect" style="display:none;" >'
            + '<div class="attribute-label" ></div>'
            + '<div class="attribute-value" >'
            + '<div id="modeSelector" class="btn-group" style="margin: 0 0 0.4em 0" >'
            + function () {
                let btns = '';
                importModes.forEach(function (b) {
                    btns += '<button id="' + b.id + 'Btn" onclick="' + myFullName + '.importLocally(\'' + b.id + '\')" data-toggle="popover" title="' + b.title + '" class="btn btn-primary">' + b.label + '</button>';
                });
                return btns;
            }()
            + '</div>'
            + '</div>'
            + '</div>'
            + '<div>'
            + '<div class="attribute-label" ></div>'
            + '<div class="attribute-value" >'
            + '<div class="pull-right" >'
            + '<button id="cancelBtn" onclick="' + myFullName + '.abort()" class="btn btn-danger btn-xs">' + i18n.BtnCancelImport + '</button>'
            + '</div>'
            + '<div id="progress" class="progress" >'
            + '<div class="progress-bar progress-bar-primary" ></div>'
            + '</div>'
            + '</div>'
            + '</div>'
            + '<div style="padding-top:2em">'
            + '<div class="attribute-label" ></div>'
            + '<div class="attribute-value" >' + i18n.MsgIntro + '</div>'
            + '</div>'
            + '</div>';
        $(self.view).prepend(h);
        self.clear();
        self.setFormat('specif');
        importMode = { id: 'replace' };
        showFileSelect = new State({
            showWhenSet: ['.fileSelect'],
            hideWhenSet: []
        });
        return true;
    };
    self.show = function (opts) {
        if (!opts)
            opts = {};
        $('#pageTitle').html(app.title);
        function getFormat(uParms) {
            for (var f of formats) {
                if (f.extensions.includes('.' + uParms[CONFIG.keyImport].fileExt()) && moduleManager.isReady(f.name))
                    return f;
            }
            ;
        }
        urlP = opts.urlParams;
        if (urlP && urlP[CONFIG.keyImport]) {
            importMode = { id: urlP[CONFIG.keyMode] || 'replace' };
            self.file.name = urlP[CONFIG.keyImport];
            self.format = getFormat(urlP);
            if (self.format && app[self.format.name]) {
                app[self.format.name].init(self.format.opts);
                if (app[self.format.name].verify({ name: urlP[CONFIG.keyImport] })) {
                    let rF = makeTextField(i18n.LblFileName, self.file.name);
                    $("#formNames").html(rF);
                    self.projectName = self.file.name.fileName();
                    setImporting(true);
                    LIB.httpGet({
                        url: urlP[CONFIG.keyImport] + '?' + Date.now().toString(),
                        responseType: 'arraybuffer',
                        withCredentials: false,
                        done: function (result) {
                            app[self.format.name].toSpecif(result.response)
                                .progress(setProgress)
                                .done(handleResult)
                                .fail(handleError);
                        },
                        fail: handleError
                    });
                    return;
                }
            }
            ;
            message.show(i18n.lookup('ErrInvalidFileType', self.file.name), { severity: 'error' });
            self.clear();
            self.show();
            return;
        }
        ;
        self.setFormat('specif');
        let str = '';
        formats.forEach(function (s) {
            if (moduleManager.isReady(s.name)) {
                if (typeof (app[s.name].toSpecif) == 'function' && typeof (app[s.name].verify) == 'function') {
                    str += '<button id="formatSelector-' + s.id + '" onclick="' + myFullName + '.setFormat(\'' + s.id + '\')" class="btn btn-default' + (self.format.id == s.id ? ' active' : '') + '" data-toggle="popover" title="' + s.desc + '">' + s.label + '</button>';
                }
                else {
                    str += '<button disabled class="btn btn-default" data-toggle="popover" title="' + s.desc + '">' + s.label + '</button>';
                }
                ;
            }
            ;
        });
        $('#formatSelector').html(str);
        showFileSelect.set();
        setImporting(false);
    };
    self.hide = function () {
        app.busy.reset();
    };
    self.setFormat = function (fId) {
        if (importing || !fId)
            return;
        if (typeof (self.format) == 'object' && fId != self.format.id)
            $('#formatSelector-' + self.format.id).removeClass('active');
        if (typeof (self.format) != 'object' || fId != self.format.id) {
            $('#formatSelector-' + fId).addClass('active');
            self.format = LIB.itemById(formats, fId);
        }
        ;
        app[self.format.name].init(self.format.opts);
        let rF = makeTextField(i18n.LblFileName, '');
        if (fId == 'xls')
            rF += makeTextField(i18n.LblProjectName, self.projectName, { typ: 'line', handle: myFullName + '.enableActions()' });
        $('#helpImport').html(self.format.help);
        $("#formNames").html(rF);
        $("#fileSelectBtn").html('<span>' + i18n.BtnFileSelect + '</span>'
            + '<input id="importFile" type="file" accept="' + self.format.extensions.toString() + '" onchange="' + myFullName + '.pickFiles()" />');
        self.enableActions();
    };
    function checkState() {
        let pnl = getTextLength(i18n.LblProjectName) > 0;
        cacheLoaded = typeof (app.projects) == 'object' && typeof (app.projects.selected) == 'object' && app.projects.selected.isLoaded();
        allValid = self.file && self.file.name.length > 0 && (self.format.id != 'xls' || pnl);
        setTextState(i18n.LblProjectName, pnl ? 'has-success' : 'has-error');
    }
    ;
    self.enableActions = function () {
        checkState();
        try {
            document.getElementById("createBtn").disabled = !allValid || cacheLoaded;
            document.getElementById("cloneBtn").disabled = true;
            document.getElementById("updateBtn").disabled =
                document.getElementById("adoptBtn").disabled =
                    document.getElementById("replaceBtn").disabled = !allValid || !cacheLoaded;
        }
        catch (e) {
            console.error("importAny: enabling actions has failed (" + e + ").");
        }
        ;
    };
    function setImporting(st) {
        importing = st;
        app.busy.set(st);
        checkState();
        try {
            document.getElementById("fileSelectBtn").disabled = st;
            document.getElementById("createBtn").disabled = st || !allValid || cacheLoaded;
            document.getElementById("cloneBtn").disabled = true;
            document.getElementById("updateBtn").disabled =
                document.getElementById("adoptBtn").disabled =
                    document.getElementById("replaceBtn").disabled = st || !allValid || !cacheLoaded;
            document.getElementById("cancelBtn").disabled = !st;
        }
        catch (e) {
            console.error("importAny: setting state 'importing' has failed (" + e + ").");
        }
        ;
    }
    self.pickFiles = function () {
        let f = document.getElementById("importFile").files[0];
        if (app[self.format.name].verify(f)) {
            self.file = f;
            setTextValue(i18n.LblFileName, f.name);
            if (self.format.id == 'xls' && getTextLength(i18n.LblProjectName) < 1) {
                self.projectName = self.file.name.fileName();
                setTextValue(i18n.LblProjectName, self.projectName);
                setFocus(i18n.LblProjectName);
            }
            ;
            self.enableActions();
        }
        else {
            self.clear();
        }
    };
    self.importLocally = function (mode) {
        if (importing || !mode)
            return;
        setImporting(true);
        importMode = { id: mode };
        setProgress(i18n.MsgReading, 10);
        self.projectName = textValue(i18n.LblProjectName);
        readFile(self.file, app[self.format.name].toSpecif);
        return;
        function readFile(f, fn) {
            let rdr = new FileReader();
            rdr.onload = (evt) => {
                if (evt.target && evt.target.result)
                    fn(evt.target.result)
                        .progress(setProgress)
                        .done(handleResult)
                        .fail(handleError);
            };
            rdr.readAsArrayBuffer(f);
        }
    };
    function terminateWithSuccess() {
        message.show(i18n.lookup('MsgImportSuccessful', self.file.name), { severity: "success", duration: CONFIG.messageDisplayTimeShort });
        setTimeout(function () {
            self.clear();
            if (urlP)
                delete urlP[CONFIG.keyImport];
            moduleManager.show({ view: '#' + (app.title == "check" ? CONFIG.importAny : (urlP && urlP[CONFIG.keyView] ? urlP[CONFIG.keyView] : CONFIG.specifications)), urlParams: urlP });
        }, CONFIG.showTimelag);
    }
    function handleError(xhr) {
        self.clear();
        LIB.stdError(xhr);
        self.show();
    }
    function handleResult(data) {
        var resQ = [], resIdx = 0;
        if (Array.isArray(data)) {
            resQ = data;
            handle(resQ.shift(), resIdx);
        }
        else {
            resQ.length = 0;
            handle(data, 0);
        }
        ;
        return;
        function handleNext() {
            if (resQ.length > 0)
                handle(resQ.shift(), ++resIdx);
            else
                terminateWithSuccess();
        }
        function handle(dta, idx) {
            setProgress(importMode.id + ' project', 20);
            let opts = self.format.opts || {};
            opts.mode = idx < 1 ? importMode.id : opts.multipleMode || 'update';
            opts.normalizeTerms = true;
            opts.deduplicate =
                opts.addGlossary =
                    opts.addUnreferencedResources = resQ.length < 1;
            switch (opts.mode) {
                case 'create':
                case 'replace':
                    opts.collectProcesses = false;
                    app.projects.create(dta, opts)
                        .progress(setProgress)
                        .done(handleNext)
                        .fail(handleError);
                    break;
                case 'update':
                    opts.collectProcesses = false;
                    app.projects.selected.update(dta, opts)
                        .progress(setProgress)
                        .done(handleNext)
                        .fail(handleError);
                    break;
                case 'adopt':
                    opts.collectProcesses = true;
                    app.projects.selected.adopt(dta, opts)
                        .progress(setProgress)
                        .done(handleNext)
                        .fail(handleError);
            }
            ;
            console.info(importMode.id + ' project ' + (dta.title ? (typeof (dta.title) == 'string' ? dta.title : LIB.languageTextOf(dta.title, { targetLanguage: browser.language })) : dta.id));
        }
        ;
    }
    ;
    function setProgress(msg, perc) {
        $('#progress .progress-bar').css('width', perc + '%').html(msg);
    }
    self.abort = function () {
        console.info('abort pressed');
        app[self.format.name].abort();
        app.projects.selected.abort();
    };
    return self;
});
