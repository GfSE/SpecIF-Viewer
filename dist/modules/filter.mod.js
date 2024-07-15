"use strict";
/*!	iLAH: Resource Filters.
    Dependencies: jQuery, bootstrap
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    Author: se@enso-managers.de, Berlin
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/
var FilterCategory;
(function (FilterCategory) {
    FilterCategory["textSearch"] = "textSearch";
    FilterCategory["resourceClass"] = "resourceClass";
    FilterCategory["statementClass"] = "statementClass";
    FilterCategory["enumValue"] = "enumValue";
})(FilterCategory || (FilterCategory = {}));
var SearchOption;
(function (SearchOption) {
    SearchOption["wordBeginnings"] = "wordBeginnings";
    SearchOption["wholeWords"] = "wholeWords";
    SearchOption["caseSensitive"] = "caseSensitive";
})(SearchOption || (SearchOption = {}));
moduleManager.construct({
    name: CONFIG.objectFilter
}, (self) => {
    let myName = self.loadAs, myFullName = 'app.' + myName, selPrj, displayOptions, chgCnt = 0;
    self.filters = [];
    self.secondaryFilters;
    const reR = '([\\s\\S]*?)('
        + '<b>|</b>|<i>|</i>|<em>|</em>|<span[^>]*>|</span>|<br ?/>'
        + '|<div[^>]*>|</div>|<div ?/>'
        + '|<p[^>]*>|</p>'
        + '|<ul[^>]*>|</ul>'
        + '|<ol[^>]*>|</ol>'
        + '|<li[^>]*>|</li>'
        + '|<table[^>]*>|<thead[^>]*>|<tbody[^>]*>|<tfoot[^>]*>|<tr[^>]*>|<tr[^>]*>|<th[^>]*>|<td[^>]*>'
        + '|</table>|</thead>|</tbody>|</tfoot>|</tr>|</tr>|</th>|</td>'
        + '|' + tagA
        + '|' + tagImg
        + '|' + tagNO
        + '|' + tagSO
        + ')', reRun = new RegExp(reR, 'g');
    self.init = () => {
        self.filters = [];
        self.secondaryFilters = undefined;
        let h = '<div id="filterLeft" class="paneLeft">'
            + '<div id="primaryFilters" class="pane-filter" ></div>'
            + '</div>'
            + '<div id="filterCtrl" class="contentCtrl" >'
            + '<div class="btn-group" >'
            + '<button class="btn btn-default" onclick="app.' + self.loadAs + '.resetClicked()" >' + i18n.BtnFilterReset + '</button>'
            + '</div>'
            + '<div id="filterNotice" class="notice-default contentNotice" ></div>'
            + '</div>'
            + '<div id="hitlist" class="content" style="padding-top:44px"></div>';
        $(self.view).html(h);
        return true;
    };
    self.clear = () => {
        chgCnt = 0;
        self.secondaryFilters = undefined;
        $('#filterNotice').empty();
        self.filters.length = 0;
        app.busy.reset();
    };
    self.hide = () => {
        $('#hitlist').empty();
        self.clear();
    };
    function handleError(xhr) {
        self.clear();
        LIB.stdError(xhr);
    }
    ;
    self.show = (opts) => {
        $('#filterNotice').empty();
        selPrj = app.projects.selected;
        if (typeof (opts) != 'object')
            opts = {};
        displayOptions = {
            lookupTitles: true,
            lookupValues: true,
            targetLanguage: selPrj.language
        };
        if (self.filters.length < 1 || opts.filters || opts.forced)
            build(opts);
        if (isClogged()) {
            message.show(i18n.lookup('MsgFilterClogged'));
            return;
        }
        ;
        if (!opts.urlParams)
            setUrlParams({
                project: selPrj.id,
                view: self.view
            });
        self.parent.showLeft.set(false);
        let fps = '';
        for (var f of self.filters) {
            fps += '<div class="panel panel-default panel-filter" >'
                + '<h4>' + f.title + '</h4>';
            switch (f.category) {
                case FilterCategory.textSearch:
                    fps += renderTextFilterSettings(f);
                    break;
                case FilterCategory.resourceClass:
                case FilterCategory.enumValue:
                    fps += renderEnumFilterSettings(f);
            }
            ;
            fps += '</div>';
        }
        ;
        $('#primaryFilters').html(fps);
        setFocus(i18n.LblStringMatch);
        let tr = self.parent.tree.get();
        if (!tr || tr.length < 1) {
            app.busy.reset();
            return;
        }
        ;
        doFilter();
    };
    function doFilter() {
        app.busy.set();
        $('#hitlist').empty();
        let pend = 0, hitCnt = 0, visited = [];
        LIB.iterateNodes(selPrj.cache.get("hierarchy", selPrj.hierarchies)
            .filter((h) => {
            return LIB.typeOf(h.resource, selPrj.cache) != CONFIG.resClassUnreferencedResources;
        }), (nd) => {
            pend++;
            selPrj.readItems('resource', [nd.resource])
                .then((rL) => {
                let hit = match(new CResourceToShow(rL[0]));
                if (hit && !visited.includes(hit.id)) {
                    hitCnt++;
                    visited.push(hit.id);
                    $('#hitlist').append(hit.listEntry());
                }
                ;
                if (--pend < 1) {
                    $('#filterNotice').html('<div class="notice-default" >' + i18n.LblHitCount + ': ' + hitCnt + '</div>');
                    app.busy.reset();
                }
            }, handleError);
            return true;
        });
    }
    function match(res) {
        function matchResClass(f) {
            for (var o of f.options) {
                if (o.checked && o.id == res['class'].id)
                    return true;
            }
            ;
            return false;
        }
        function matchSearchString(f) {
            if (f.searchString.length == 0)
                return true;
            let str = f.searchString.escapeRE();
            if (isChecked(f.options, SearchOption.wholeWords)) {
                str = '\\b' + str + '\\b';
            }
            else if (isChecked(f.options, SearchOption.wordBeginnings))
                str = '\\b' + str;
            let patt = new RegExp(str, isChecked(f.options, SearchOption.caseSensitive) ? '' : 'i'), p;
            if (matchStr(res.title))
                return true;
            for (p of res.descriptions)
                if (matchStr(p))
                    return true;
            for (p of res.other) {
                if (matchStr(p))
                    return true;
            }
            ;
            return false;
            function matchStr(prp) {
                let localOptions = Object.assign({}, displayOptions, {
                    lookupValues: prp.pC.title != CONFIG.propClassTerm
                });
                return patt.test(prp.get(localOptions));
            }
        }
        function matchEnumValue(f) {
            if (f.scope && f.scope != res['class'].id)
                return true;
            switch (f.category) {
                case FilterCategory.enumValue:
                    let rp = LIB.referenceItemBy(res.other, 'class', f.propClass);
                    if (!rp || rp.values.length < 1)
                        return f.options[f.options.length - 1].checked && f.options[f.options.length - 1].id == CONFIG.notAssigned;
                    for (var o of f.options) {
                        if (o.checked && rp.enumIdL.includes(o.id))
                            return true;
                    }
                    ;
            }
            ;
            return false;
        }
        function matchAndMark(f) {
            switch (f.category) {
                case FilterCategory.resourceClass:
                    if (matchResClass(f))
                        return res;
                    return;
                case FilterCategory.enumValue:
                    if (matchEnumValue(f))
                        return res;
                    return;
                case FilterCategory.textSearch:
                    if (matchSearchString(f)) {
                        if (f.searchString.length > 2) {
                            let rgxS = new RegExp(f.searchString.escapeRE(), isChecked(f.options, SearchOption.caseSensitive) ? 'g' : 'gi');
                            res.title.values = markValL(res.title, rgxS);
                            res.descriptions = res.descriptions.map((rp) => {
                                rp.values = markValL(rp, rgxS);
                                return rp;
                            });
                            res.other = res.other.map((rp) => {
                                rp.values = markValL(rp, rgxS);
                                return rp;
                            });
                        }
                        ;
                        return res;
                    }
                    ;
            }
            ;
            return;
            function markValL(prp, re) {
                let mV;
                return prp.values.map((v) => {
                    let localOptions = Object.assign({}, displayOptions, {
                        lookupValues: prp.pC.title != CONFIG.propClassTerm
                    });
                    mV = mark(LIB.displayValueOf(v, localOptions), re);
                    return prp.dT.type == XsDataType.String ? LIB.makeMultiLanguageValue(mV) : mV;
                });
                function mark(txt, re) {
                    let markedText = '';
                    txt = txt.replace(reRun, ($0, $1, $2) => {
                        if ($1.stripHTML().length > 0)
                            $1 = $1.replace(re, ($a) => { return '<mark>' + $a + '</mark>'; });
                        markedText += $1 + $2;
                        return '';
                    });
                    if (txt.stripHTML().length > 0)
                        markedText += txt.replace(re, ($a) => { return '<mark>' + $a + '</mark>'; });
                    return markedText;
                }
            }
        }
        function isChecked(opts, id) {
            let opt = LIB.itemById(opts, id);
            return (opt && opt.checked);
        }
        for (var i = 0, I = self.filters.length; res && i < I; i++) {
            res = matchAndMark(self.filters[i]);
        }
        ;
        return res;
    }
    function isClogged() {
        if (!self.filters.length)
            return false;
        let rCL = [];
        function checkResourceClass(f) {
            for (var o of f.options) {
                if (o.checked)
                    rCL.push(o.id);
            }
            ;
            return !rCL.length;
        }
        ;
        function checkPropertyValue(f) {
            if (f.scope && rCL.indexOf(f.scope) < 0)
                return false;
            switch (f.category) {
                case FilterCategory.enumValue:
                    for (var o of f.options) {
                        if (o.checked)
                            return false;
                    }
                    ;
            }
            ;
            return true;
        }
        ;
        var clogged = false;
        for (var f of self.filters) {
            switch (f.category) {
                case FilterCategory.resourceClass:
                    clogged = clogged || checkResourceClass(f);
                    break;
                case FilterCategory.enumValue: clogged = clogged || checkPropertyValue(f);
            }
            ;
        }
        ;
        return clogged;
    }
    function addEnumValueFilters(def) {
        function allEnumValues(pC, vL) {
            var boxes = [], dT = selPrj.cache.get("dataType", [LIB.makeKey(pC.dataType)])[0];
            if (dT && Array.isArray(dT.enumeration)) {
                for (var v of dT.enumeration) {
                    boxes.push({
                        title: app.ontology.localize(LIB.languageTextOf(v.value, displayOptions), displayOptions),
                        id: v.id,
                        checked: vL.includes(v.id)
                    });
                }
                ;
                boxes.push({
                    title: i18n.LblNotAssigned,
                    id: CONFIG.notAssigned,
                    checked: (!vL || vL.includes(CONFIG.notAssigned))
                });
                return boxes;
            }
            ;
            throw Error("Invalid Data: Missing or malformed dataType");
        }
        function addEnumFilter(rC, pC, vals) {
            for (var f of self.filters) {
                if ((f.dataType == pC.dataType)
                    && (f.scope == rC.id))
                    return;
            }
            ;
            var eVF = {
                title: LIB.titleOf(rC, displayOptions) + ': ' + LIB.titleOf(pC, displayOptions),
                category: FilterCategory.enumValue,
                primary: false,
                scope: rC.id,
                propClass: LIB.keyOf(pC),
                dataType: pC.dataType,
                options: allEnumValues(pC, vals)
            };
            self.filters.push(eVF);
        }
        if (def && def.category == FilterCategory.enumValue) {
            var rC = LIB.getExtendedClasses(selPrj.cache.get("resourceClass", "all"), [def.rCk])[0], pC;
            rC.propertyClasses.forEach((pck) => {
                pC = selPrj.cache.get("propertyClass", [pck])[0];
                if ((def.pCk && LIB.references(def.pCk, pC))
                    || (!def.pCk && selPrj.cache.get("dataType", [pC.dataType])[0].enumeration)) {
                    addEnumFilter(rC, pC, def.selected);
                }
                ;
            });
        }
        ;
    }
    function build(settings) {
        self.filters.length = 0;
        function addTextSearchFilter(pre) {
            var flt = {
                title: i18n.LblStringMatch,
                category: FilterCategory.textSearch,
                primary: true,
                scope: selPrj.id,
                searchString: pre && pre.searchString ? pre.searchString : '',
                options: [
                    { id: SearchOption.wordBeginnings, title: i18n.LblWordBeginnings, checked: pre && pre.options.indexOf(SearchOption.wordBeginnings) > -1 },
                    { id: SearchOption.wholeWords, title: i18n.LblWholeWords, checked: pre && pre.options.indexOf(SearchOption.wholeWords) > -1 },
                    { id: SearchOption.caseSensitive, title: i18n.LblCaseSensitive, checked: pre && pre.options.indexOf(SearchOption.caseSensitive) > -1 }
                ]
            };
            self.filters.push(flt);
        }
        if (settings && settings.filters && Array.isArray(settings.filters)) {
            var idx = LIB.indexBy(settings.filters, 'category', FilterCategory.textSearch);
            if (idx > -1)
                addTextSearchFilter(settings.filters[idx]);
        }
        else {
            addTextSearchFilter();
        }
        ;
        function addResourceClassFilter(pre) {
            var oTF = {
                title: app.ontology.localize("SpecIF:Resource", { targetLanguage: browser.language, plural: true }),
                category: FilterCategory.resourceClass,
                primary: true,
                scope: selPrj.id,
                options: []
            };
            selPrj.cache.get("resourceClass", selPrj.resourceClasses)
                .forEach((rC) => {
                if (!CONFIG.excludedFromTypeFiltering.includes(rC.title)
                    && (!Array.isArray(rC.instantiation)
                        || rC.instantiation.includes(SpecifInstantiation.Auto)
                        || rC.instantiation.includes(SpecifInstantiation.User))) {
                    oTF.options.push({
                        title: LIB.titleOf(rC, displayOptions),
                        id: rC.id,
                        checked: (pre && pre.selected) ? pre.selected.includes(rC.id) : true
                    });
                }
            });
            self.filters.push(oTF);
        }
        if (settings && settings.filters && Array.isArray(settings.filters)) {
            var idx = LIB.indexBy(settings.filters, 'category', FilterCategory.resourceClass);
            if (idx > -1)
                addResourceClassFilter(settings.filters[idx]);
        }
        else {
            addResourceClassFilter();
        }
        ;
        if (settings && settings.filters && Array.isArray(settings.filters)) {
            settings.filters.forEach((s) => {
                if (s.category == FilterCategory.enumValue)
                    addEnumValueFilters(s);
            });
        }
        ;
    }
    function renderTextFilterSettings(flt) {
        return makeTextField(flt.title, flt.searchString, { tagPos: 'none', typ: 'line', handle: myFullName + '.goClicked()' })
            + renderEnumFilterSettings(flt);
    }
    function renderEnumFilterSettings(flt) {
        return makeCheckboxField(flt.title, flt.options, { tagPos: 'none', classes: '', handle: myFullName + '.goClicked()' });
    }
    self.goClicked = () => {
        self.secondaryFilters = undefined;
        self.filters.forEach((f) => {
            switch (f.category) {
                case FilterCategory.textSearch:
                    f.searchString = textValue(f.title);
                case FilterCategory.resourceClass:
                case FilterCategory.enumValue:
                    let checkedL = checkboxValues(f.title);
                    f.options.forEach((o) => {
                        o.checked = checkedL.includes(o.id);
                    });
            }
            ;
        });
        chgCnt++;
        setTimeout(() => {
            if (--chgCnt < 1)
                doFilter();
        }, CONFIG.noMultipleRefreshWithin);
    };
    self.resetClicked = () => {
        self.clear();
        self.show();
    };
    return self;
});
