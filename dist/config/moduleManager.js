"use strict";
/*!	A simple module loader and object (singleton) factory.
    When all registered modules are ready, a callback function is executed to start or continue the application.
    Dependencies: jQuery 3.1 and later.
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    Author: se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/
class ViewControl {
    constructor() {
        this.list = [];
    }
    exists(v) {
        return LIB.indexBy(this.list, 'view', v) > -1;
    }
    add(v) {
        this.list.push(v);
        $(v.view).hide();
    }
    show(params) {
        if (typeof (params) != 'object')
            throw Error("moduleManager.show() needs a parameter.");
        let v, s;
        this.list.forEach((le) => {
            v = $(le.view);
            s = $(le.selectedBy);
            if (params.view == le.view) {
                this.selected = le;
                s.addClass('active');
                v.show();
                if (typeof (params.content) == 'string') {
                    v.html(params.content);
                    return;
                }
                ;
                if (typeof (le.show) == 'function') {
                    params.forced = true;
                    le.show(params);
                    return;
                }
            }
            else {
                s.removeClass('active');
                v.hide();
                if (typeof (le.hide) == 'function') {
                    le.hide();
                    return;
                }
            }
        });
        if (typeof (doResize) == 'function') {
            doResize();
        }
    }
    hide(v) {
        if (typeof (v) == 'string' && this.exists(v)) {
            $(v).hide();
            return;
        }
        ;
        if (this.selected) {
            $(this.selected.view).hide();
            $(this.selected.selectedBy).removeClass('active');
            this.selected = undefined;
        }
        ;
    }
}
class Browser {
    constructor() {
        this.language = navigator.language;
        console.info("Browser Language is '" + this.language + "'.");
        this.supportsHtml5History = Boolean(window.history && window.history.pushState);
        if (!this.supportsHtml5History)
            console.info("Browser does not support HTML5 History");
        this.supportsCORS = $.support.cors;
        if (!this.supportsCORS)
            console.info("Browser does not support CORS");
        this.supportsFileAPI = Boolean(window.File && window.FileReader && window.FileList && window.Blob);
    }
    isIE() {
        return /MSIE |rv:11.0/i.test(navigator.userAgent);
    }
}
var app, browser, i18n, message, moduleManager = function () {
    var self = {};
    let callWhenReady, loadPath = './';
    self.init = (opts) => {
        browser = new Browser();
        if (browser.isIE()) {
            let txt = 'Stopping: The web-browser Internet Explorer is not supported.';
            console.error(txt);
            alert(txt);
            return;
        }
        ;
        if (opts && opts.path)
            loadPath = opts.path;
        self.registered = [];
        self.ready = [];
        loadL(['bootstrap', 'font', 'types', 'i18n', 'tree'], { done: init2 });
        return;
        function init2() {
            let modL = ['helper', 'helperTree', 'bootstrapDialog', 'mainCSS', 'ioOntology', 'standards', "xSpecif"];
            if (CONFIG.convertMarkdown)
                modL.push('markdown');
            loadL(modL, {
                done: () => {
                    app = window['SpecifApp']();
                    app.busy = new State({
                        showWhenSet: ['#spinner'],
                        hideWhenSet: ['.pageActions', '.contentActions']
                    });
                    bindResizer();
                }
            });
        }
        function loadL(L, opts) {
            if (opts && typeof (opts.done) == "function")
                callWhenReady = opts.done;
            else
                callWhenReady = undefined;
            L.forEach((e) => { loadModule(e); });
        }
    };
    function register(mod) {
        if (self.registered.includes(mod)) {
            console.warn("WARNING: Did not reload module '" + mod + "'.");
            return false;
        }
        ;
        self.registered.push(mod);
        return true;
    }
    self.load = (tr, opts) => {
        self.tree = tr;
        if (opts && typeof (opts.done) == "function")
            callWhenReady = opts.done;
        ld(tr);
        return;
        function ld(e) {
            if (e.view && e.parent) {
                let c = e.viewClass ? 'class="' + e.viewClass + '" ' : '', d = '<div id="' + e.view.substring(1) + '" ' + c + ' style="display:none;"></div>';
                $(e.parent.view).append(d);
            }
            ;
            if (e.name) {
                loadModule(e);
            }
            ;
            if (e.children) {
                loadChildren(e);
            }
            ;
            return;
            function loadChildren(e) {
                if (e.selector) {
                    e.ViewControl = new ViewControl();
                    if ($(e.selector).length < 1) {
                        let s = '';
                        switch (e.selectorType) {
                            case 'btns':
                                s = '<div id="' + e.selector.substring(1) + '" class="btn-group" ></div>';
                                break;
                            default:
                                s = '<ul id="' + e.selector.substring(1) + '" role="tablist" class="nav nav-tabs"></ul>';
                        }
                        ;
                        $(e.view).append(s);
                    }
                    ;
                    let id = null, lbl = null;
                    e.children.forEach(function (ch) {
                        if (ch.view) {
                            if (!ch.selectedBy) {
                                throw Error("Module '" + ch.name + "' must have both properties 'view' and 'selectedBy' or none.");
                            }
                            ;
                            e.ViewControl.add(ch);
                            id = ch.selectedBy.substring(1);
                            lbl = ch.label || id;
                            switch (e.selectorType) {
                                case 'btns':
                                    $(e.selector).append('<button id="' + id + '" type="button" class="btn btn-default" onclick="moduleManager.show({view:\'' + ch.view + '\'})" >' + lbl + '</button>');
                                    break;
                                default:
                                    $(e.selector).append('<li id="' + id + '" onclick="moduleManager.show({view:\'' + ch.view + '\'})"><a>' + lbl + '</a></li>');
                            }
                            ;
                        }
                        ;
                        if (ch.action) {
                            if (!ch.selectedBy) {
                                throw Error("Module '" + ch.name + "' must have both properties 'action' and 'selectedBy' or none.");
                            }
                            ;
                            id = ch.selectedBy.substring(1);
                            lbl = ch.label || id;
                            switch (e.selectorType) {
                                case 'btns':
                                    $(e.selector).append('<button id="' + id + '" type="button" class="btn btn-default" onclick="' + ch.action + '" >' + lbl + '</button>');
                                    break;
                                default:
                                    throw Error("Action'" + lbl + "' needs a parent selector of type 'btns'.");
                            }
                            ;
                        }
                        ;
                    });
                }
                ;
                e.children.forEach((c) => {
                    c.parent = e;
                    ld(c);
                });
            }
        }
    };
    self.construct = (defs, constructorFn) => {
        let mo = findModule(self.tree, defs.name || defs.view);
        if (!mo)
            throw Error(defs.name ? "'" + defs.name + "' is not a defined module name" : "'" + defs.view + "' is not a defined view");
        $.extend(mo, defs);
        if (!mo.loadAs)
            mo.loadAs = mo.name || mo.view.substring(1);
        constructorFn(mo);
        app[mo.loadAs] = mo;
        if (defs.name && self.registered.includes(defs.name))
            setReady(defs.name);
    };
    self.show = (params) => {
        if (typeof (params) != 'object')
            throw Error("Undefined target view.");
        let mo = findModule(self.tree, params.view);
        if (!mo || !mo.parent.ViewControl)
            throw Error("'" + params.view + "' is not a defined view");
        setViewFromRoot(mo, params);
        setViewToLeaf(mo, params);
        return;
        function setViewFromRoot(le, pars) {
            if (le.parent.selectedBy) {
                setViewFromRoot(le.parent, Object.assign({}, pars, { view: le.parent.view }));
            }
            ;
            le.parent.ViewControl.show(pars);
        }
        function setViewToLeaf(le, pars) {
            function findDefault(vL) {
                for (var i = vL.length - 1; i > -1; i--) {
                    if (vL[i].isDefault)
                        return vL[i];
                }
                ;
                return vL[0];
            }
            if (le.ViewControl && le.ViewControl.list.length > 0) {
                let ch = findDefault(le.ViewControl.list);
                le.ViewControl.show(Object.assign({}, pars, { view: ch.view }));
                setViewToLeaf(ch, pars);
            }
        }
    };
    self.isReady = (mod) => {
        return self.ready.includes(mod);
    };
    return self;
    function initModuleTree(h) {
        function it(e) {
            if (typeof (e.init) == 'function')
                e.init();
            if (e.children)
                e.children.forEach((c) => { it(c); });
        }
        if (h) {
            it(h);
        }
    }
    function findModule(tr, token) {
        let m = undefined;
        if (Array.isArray(tr)) {
            for (var i = tr.length - 1; !m && i > -1; i--) {
                m = find(tr[i]);
            }
            ;
        }
        else {
            m = find(tr);
        }
        ;
        return m;
        function find(e) {
            if (e.name == token || e.view == token)
                return e;
            if (e.children) {
                let m = findModule(e.children, token);
                if (m)
                    return m;
            }
        }
    }
    function loadModule(mod) {
        var module = typeof (mod) == 'string' ? { name: mod } : mod;
        if (register(module.name)) {
            loadAfterRequiredModules(module, ldM);
        }
        ;
        return;
        function ldM(mod) {
            switch (mod) {
                case "font":
                    getCss("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.1/font/bootstrap-icons.css");
                    setReady(mod);
                    return true;
                case "bootstrap":
                    getCss("https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.4.1/css/bootstrap.min.css");
                    getCss("https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.4.1/css/bootstrap-theme.min.css");
                    getScript('https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.4.1/js/bootstrap.min.js');
                    return true;
                case "bootstrapDialog":
                    getCss("https://cdnjs.cloudflare.com/ajax/libs/bootstrap3-dialog/1.35.4/css/bootstrap-dialog.min.css");
                    getScript('https://cdnjs.cloudflare.com/ajax/libs/bootstrap3-dialog/1.35.4/js/bootstrap-dialog.min.js');
                    return true;
                case "tree":
                    getCss("https://cdnjs.cloudflare.com/ajax/libs/jqtree/1.8.3/jqtree.css");
                    getScript('https://cdnjs.cloudflare.com/ajax/libs/jqtree/1.8.3/tree.jquery.js');
                    return true;
                case "fileSaver":
                    getScript('https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js');
                    return true;
                case "zip":
                    getScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
                    return true;
                case "jsonSchema":
                    getScript('https://cdnjs.cloudflare.com/ajax/libs/ajv/4.11.8/ajv.min.js');
                    return true;
                case "excel":
                    getScript('https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js');
                    return true;
                case "bpmnViewer":
                    getScript('https://unpkg.com/bpmn-js@17.2.2/dist/bpmn-viewer.production.min.js');
                    return true;
                case "graphViz":
                    getScript('https://cdnjs.cloudflare.com/ajax/libs/vis-network/9.1.6/standalone/umd/vis-network.min.js');
                    return true;
                case "markdown":
                    getScript('https://cdn.jsdelivr.net/npm/markdown-it@13.0.2/dist/markdown-it.min.js')
                        .done(() => { window.markdown = window.markdownit({ html: true, xhtmlOut: true, breaks: true, linkify: false }); });
                    return true;
                case "mainCSS":
                    getCss(loadPath + 'assets/stylesheets/SpecIF.default.css');
                    setReady(mod);
                    return true;
                case "types":
                    getScript(loadPath + 'types/specif.types.js');
                    return true;
                case "i18n":
                    switch (browser.language.slice(0, 2)) {
                        case 'de':
                            getScript(loadPath + 'config/locales/iLaH-de.i18n.js')
                                .done(() => { i18n = LanguageTextsDe(); });
                            break;
                        case 'fr':
                            getScript(loadPath + 'config/locales/iLaH-fr.i18n.js')
                                .done(() => { i18n = LanguageTextsFr(); });
                            break;
                        default: getScript(loadPath + 'config/locales/iLaH-en.i18n.js')
                            .done(() => { i18n = LanguageTextsEn(); });
                    }
                    ;
                    return true;
                case "helper":
                    getScript(loadPath + 'modules/helper.js')
                        .done(() => { message = new CMessage(); });
                    return true;
                case "standards":
                    getScript(loadPath + 'modules/standards.js');
                    return true;
                case 'ioOntology':
                    getScript(loadPath + 'modules/ioOntology.js');
                    return true;
                case "Ontology":
                    getOntology();
                    return true;
                case "helperTree":
                    getScript(loadPath + 'modules/helperTree.js');
                    return true;
                case "xSpecif":
                    getScript(loadPath + 'modules/xSpecif.js');
                    return true;
                case "cache":
                    loadModule("Ontology");
                    getScript(loadPath + 'modules/cache.mod.js');
                    return true;
                case "profileAnonymous":
                    getScript(loadPath + 'modules/profileAnonymous.mod.js');
                    return true;
                case 'toHtml':
                    loadModule('fileSaver');
                    getScript(loadPath + 'modules/specif2html.js');
                    return true;
                case "toXhtml":
                    getScript(loadPath + 'assets/javascripts/toXhtml.js');
                    return true;
                case "toEpub":
                    loadModule('toXhtml');
                    getScript(loadPath + 'assets/javascripts/toEpub.js');
                    return true;
                case "toOxml":
                    getScript(loadPath + 'assets/javascripts/toOxml.js');
                    return true;
                case "toTurtle":
                    getScript(loadPath + 'modules/specif2turtle.js');
                    return true;
                case 'bpmn2specif':
                    getScript(loadPath + 'assets/javascripts/BPMN2SpecIF.js');
                    return true;
                case 'archimate2specif':
                    getScript(loadPath + 'assets/javascripts/archimate2SpecIF.js');
                    return true;
                case "sysml2specif":
                    getScript(loadPath + 'modules/sysml2specif.js');
                    return true;
                case 'reqif2specif':
                    getScript(loadPath + 'assets/javascripts/reqif2specif.js');
                    return true;
                case 'vicinityGraph':
                    loadModule('graphViz');
                    getScript(loadPath + 'modules/graph.js');
                    return true;
                case "about":
                    getScript(loadPath + 'modules/about.mod.js');
                    return true;
                case 'importAny':
                    loadModule('zip');
                    loadModule('jsonSchema');
                    getScript(loadPath + 'modules/importAny.mod.js');
                    return true;
                case 'ioSpecif':
                    getScript(loadPath + 'modules/ioSpecif.mod.js');
                    return true;
                case 'ioDdpSchema':
                    getScript(loadPath + 'modules/ioDdpSchema.mod.js');
                    return true;
                case 'ioReqif':
                    loadModule('reqif2specif');
                    getScript(loadPath + 'modules/ioReqif.mod.js');
                    return true;
                case 'ioXls':
                    loadModule('excel');
                    getScript(loadPath + 'modules/ioXls.mod.js');
                    return true;
                case 'ioBpmn':
                    loadModule('bpmn2specif');
                    loadModule('bpmnViewer');
                    getScript(loadPath + 'modules/ioBpmn.mod.js');
                    return true;
                case 'ioArchimate':
                    loadModule('archimate2specif');
                    getScript(loadPath + 'modules/ioArchimate.mod.js');
                    return true;
                case 'ioSysml':
                    loadModule('sysml2specif');
                    getScript(loadPath + 'modules/ioSysml.mod.js');
                    return true;
                case CONFIG.specifications:
                    getScript(loadPath + 'modules/specifications.mod.js');
                    return true;
                case CONFIG.reports:
                    getScript(loadPath + 'modules/reports.mod.js');
                    return true;
                case CONFIG.objectFilter:
                    getScript(loadPath + 'modules/filter.mod.js');
                    return true;
                case CONFIG.resourceEdit:
                    getScript(loadPath + 'modules/resourceEdit.mod.js');
                    return true;
                case CONFIG.resourceLink:
                    getScript(loadPath + 'modules/resourceLink.mod.js');
                    return true;
                default:
                    console.warn("Module loader: Module '" + mod + "' is unknown.");
                    return false;
            }
        }
        function bust(url) {
            return url + (url.startsWith(loadPath) ? "?" + CONFIG.appVersion : "");
        }
        function getCss(url) {
            $('head').append('<link rel="stylesheet" type="text/css" href="' + bust(url) + '" />');
        }
        function getScript(url, options) {
            let settings = $.extend(options || {}, {
                dataType: "script",
                cache: true,
                url: bust(url)
            });
            if (url.indexOf('.mod.') > 0)
                return $.ajax(settings);
            else
                return $.ajax(settings)
                    .done(() => { setReady(module.name); });
        }
        function getOntology() {
            LIB.httpGet({
                url: (window.location.href.startsWith('http') || window.location.href.endsWith('.specif.html') ?
                    CONFIG.ontologyURL
                    : '../../SpecIF/vocabulary/Ontology.specif') + "?" + new Date().toISOString(),
                responseType: 'arraybuffer',
                withCredentials: false,
                done: (xhr) => {
                    let ont = JSON.parse(LIB.ab2str(xhr.response));
                    app.ontology = new COntology(ont);
                    setReady(module.name);
                },
                fail: LIB.stdError
            });
        }
        function loadAfterRequiredModules(mod, fn) {
            if (!Array.isArray(mod.requires) || LIB.containsAllStrings(self.ready, mod.requires))
                fn(mod.name);
            else
                setTimeout(function () { loadAfterRequiredModules(mod, fn); }, 33);
        }
    }
    function setReady(mod) {
        if (self.ready.indexOf(mod) < 0) {
            self.ready.push(mod);
            console.info(mod + " loaded (" + self.ready.length + "/" + self.registered.length + ")");
        }
        else {
            throw Error("Module '" + mod + "' cannot be set 'ready' more than once");
        }
        ;
        if (self.registered.length === self.ready.length) {
            initModuleTree(self.tree);
            console.info("All " + self.ready.length + " modules loaded --> ready!");
            if (typeof (callWhenReady) == 'function')
                callWhenReady();
            else
                throw Error("No callback provided to continue after module loading.");
        }
        ;
    }
}();
class State {
    constructor(opts) {
        this.state = false;
        this.showWhenSet = Array.isArray(opts.showWhenSet) ? opts.showWhenSet : [];
        this.hideWhenSet = Array.isArray(opts.hideWhenSet) ? opts.hideWhenSet : [];
    }
    set(flag) {
        switch (flag) {
            case false:
                this.reset();
                break;
            case undefined:
            case true:
                this.state = true;
                this.hideWhenSet.forEach((v) => {
                    $(v).hide();
                });
                this.showWhenSet.forEach((v) => {
                    $(v).show();
                });
        }
        ;
    }
    reset() {
        this.state = false;
        this.showWhenSet.forEach((v) => {
            $(v).hide();
        });
        this.hideWhenSet.forEach((v) => {
            $(v).show();
        });
    }
    get() {
        return this.state;
    }
}
function doResize() {
    let wH = window.innerHeight
        || document.documentElement.clientHeight
        || document.body.clientHeight, hH = $('#pageHeader').outerHeight(true)
        + $('.nav-tabs').outerHeight(true), pH = wH - hH;
    $('.content').outerHeight(pH);
    $('.contentWide').outerHeight(pH);
    $('.pane-tree').outerHeight(pH);
    $('.pane-details').outerHeight(pH);
    $('.pane-filter').outerHeight(pH);
    $('.contentCtrl').css("top", hH);
}
function bindResizer() {
    $(window).resize(() => {
        doResize();
    });
}
