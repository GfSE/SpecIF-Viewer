"use strict";
function SpecifApp() {
    "use strict";
    var self = {};
    self.moduleTree = {
        view: '#app',
        selector: '#pageSelector',
        selectorType: 'btns',
        children: [{
                name: 'profileAnonymous',
                loadAs: 'me'
            }, {
                name: 'cache',
                loadAs: 'projects'
            }, {
                name: 'importAny',
                view: '#' + CONFIG.importAny,
                viewClass: 'contentWide',
                label: i18n.BtnImport,
                selectedBy: '#selectImport',
                children: [{
                        name: 'ioSpecif'
                    }, {
                        name: 'ioArchimate'
                    }, {
                        name: 'ioReqif'
                    }, {
                        name: 'ioBpmn'
                    }, {
                        name: 'ioXls'
                    }]
            }, {
                name: 'about',
                view: '#about',
                viewClass: 'contentWide',
                label: i18n.IcoAbout,
                selectedBy: '#selectAbout'
            }]
    };
    self.init = function () {
        document.title = self.title = "check";
        window.addEventListener("hashchange", self.show);
        moduleManager.load(self.moduleTree, { done: self.login });
    };
    self.login = function () {
        console.info(self.title + " " + CONFIG.appVersion + " started!");
        self.me.read()
            .then(self.show, self.logout);
    };
    self.show = function () {
        var uP = getUrlParams(), v;
        if (!self[CONFIG.projects].selected
            || !self[CONFIG.projects].selected.isLoaded()
            || uP[CONFIG.keyProject] && uP[CONFIG.keyProject] != self[CONFIG.projects].selected.id
            || uP[CONFIG.keyImport] && uP[CONFIG.keyImport].length > 0)
            v = '#' + CONFIG.importAny;
        else
            v = '#' + (uP[CONFIG.keyView] || CONFIG.specifications);
        moduleManager.show({ view: v, urlParams: uP });
    };
    self.export = function () {
        if (self[CONFIG.projects].selected && self[CONFIG.projects].selected.isLoaded())
            self[CONFIG.projects].selected.chooseFormatAndExport();
        else
            message.show(i18n.MsgNoProjectLoaded, { severity: 'warning', duration: CONFIG.messageDisplayTimeShort });
    };
    self.logout = function () {
        self.me.logout();
        self.hide();
    };
    self.hide = function () {
    };
    self.init();
    return self;
}
