"use strict";
/*!	Show SpecIF data
    Dependencies: jQuery, jqTree, bootstrap
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    Author: se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)

    ToDo: This module is lousy coding with lots of historical burden --> redo!
*/
RE.titleLink = new RegExp(CONFIG.titleLinkBegin + '(.+?)' + CONFIG.titleLinkEnd, 'g');
class CPropertyToShow {
    constructor(prp, rC) {
        for (var a in prp)
            this[a] = prp[a];
        this.cData = app.projects.cache;
        this.selPrj = app.projects.selected;
        this.pC = this.cData.get("propertyClass", [this['class']])[0];
        this.dT = this.cData.get("dataType", [this.pC.dataType])[0];
        this.title = LIB.titleOf(this.pC, { targetLanguage: 'default' });
        if (this.dT.enumeration) {
            this.enumIdL = [].concat(prp.values);
            this.values = this.values.map((v) => LIB.itemById(this.dT.enumeration, v).value);
        }
        ;
        let iPrm = LIB.itemBy(this.selPrj.myPermissions, 'item', this.pC.id);
        if (iPrm)
            this.pC.permissionVector = iPrm.permissionVector;
        else {
            iPrm = LIB.itemBy(this.selPrj.myPermissions, 'item', rC.id);
            if (iPrm)
                this.pC.permissionVector = iPrm.permissionVector;
            else {
                iPrm = LIB.itemBy(this.selPrj.myPermissions, 'item', this.selPrj.id);
                if (iPrm)
                    this.pC.permissionVector = iPrm.permissionVector;
                else
                    this.pC.permissionVector = noPermission;
            }
        }
    }
    allValues(opts) {
        var str = '';
        if (this.dT.type == XsDataType.String) {
            let lV;
            if (opts && opts.targetLanguage) {
                this.values.forEach((v, i) => {
                    lV = LIB.languageTextOf(v, opts);
                    str += (i < 1 ? '' : ', ') + (opts.lookupValues ? app.ontology.localize(lV, opts) : lV);
                });
                return str.replace(/^\s+/, "");
            }
            ;
            throw Error("When displaying a property value with dataType string, a target language must be specified.");
        }
        ;
        this.values.forEach((v, i) => { str += (i < 1 ? '' : ', ') + v; });
        return str;
    }
    isVisible(opts) {
        return (CONFIG.hiddenProperties.indexOf(this.title) < 0
            && (CONFIG.showEmptyProperties || LIB.hasContent(this.allValues(opts))));
    }
    get(options) {
        let opts = Object.assign({
            titleLinking: false,
            lookupValues: false,
            targetLanguage: this.selPrj.language,
            clickableElements: false,
            linkifyURLs: false,
            renderFiles: false,
            unescapeHTMLTags: false,
            makeHTML: false
        }, options);
        let ct;
        switch (this.dT.type) {
            case XsDataType.String:
                ct = this.allValues(opts);
                if (opts.unescapeHTMLTags)
                    ct = ct.unescapeHTMLTags();
                if (opts.renderFiles)
                    ct = this.renderFile(ct, opts);
                if (this.pC.format == SpecifTextFormat.Xhtml)
                    ct = ct.makeHTML(opts);
                ct = this.titleLinks(ct, opts);
                break;
            case XsDataType.DateTime:
                ct = opts.localDateTime ? LIB.localDateTime(this.values[0]) : this.values[0];
                break;
            default:
                ct = this.allValues(opts);
        }
        ;
        return ct;
    }
    titleLinks(str, opts) {
        if (opts.keepTitleLinkingPatterns)
            return str;
        if (!CONFIG.titleLinking || !opts.titleLinking)
            return str.replace(RE.titleLink, (match, $1, $2) => { return $1 + $2; });
        let replaced = false;
        do {
            replaced = false;
            str = str.replace(RE.titleLink, (match, $1, $2) => {
                replaced = true;
                if ($1.length < CONFIG.titleLinkMinLength)
                    return $1 + $2;
                let m = $1.toLowerCase(), cR, ti, rC, target;
                app.specs.tree.iterate((nd) => {
                    cR = LIB.itemByKey(this.cData.resources, nd.ref);
                    ti = this.cData.instanceTitleOf(cR, opts);
                    if (!ti || m != ti.toLowerCase())
                        return true;
                    rC = LIB.itemByKey(this.cData.resourceClasses, cR['class']);
                    if (opts.titleLinkTargets.indexOf(rC.title) < 0)
                        return true;
                    target = cR;
                    return false;
                });
                if (target)
                    return lnk(target, $1) + $2;
                return '<span style="color:#D82020">' + $1 + '</span>' + $2;
            });
        } while (replaced);
        return str;
        function lnk(r, t) {
            return '<a onclick="app[CONFIG.objectList].relatedItemClicked(\'' + r.id + '\')">' + t + '</a>';
        }
    }
    renderFile(txt, opts) {
        if (typeof (opts) != 'object')
            opts = {};
        if (opts.imgClass == undefined)
            opts.imgClass = 'forImage';
        let re = {
            xhtmlAttrType: /(type="[^"]+")/,
            xhtmlAttrData: /data="([^"]+)"/
        };
        function getType(str) {
            let t = re.xhtmlAttrType.exec(str);
            if (Array.isArray(t) && t.length > 0)
                return (' ' + t[1]);
            return '';
        }
        function getUrl(str) {
            let l = re.xhtmlAttrData.exec(str);
            if (Array.isArray(l) && l.length > 0)
                return l[1];
            return '';
        }
        function getAttr(anm, str) {
            let re = new RegExp(anm + '="([^"]+)"', ''), l = re.exec(str);
            if (Array.isArray(l) && l.length > 0)
                return l[1];
            return '';
        }
        function makeStyle(w, h) {
            return (h || w) ? ' style="' + (h ? 'height:' + h + '; ' : '') + (w ? 'width:' + w + '; ' : '') + '"' : '';
        }
        var repStrings = [];
        txt = txt.replace(RE.tagNestedObjects, ($0, $1, $2, $3, $4) => {
            let u1 = getUrl($1), u2 = getUrl($2), w2 = getAttr("width", $2), h2 = getAttr("height", $2), d = $4 || u1;
            if (!u1)
                console.warn('No file reference found in ' + $0);
            if (!u2)
                console.warn('No image reference found in ' + $0);
            let f1 = new CFileWithContent(LIB.itemByTitle(this.cData.files, u1)), f2 = new CFileWithContent(LIB.itemByTitle(this.cData.files, u2));
            if (f1 && f1.hasContent()) {
                if (f2 && f2.hasContent()) {
                    repStrings.push('<div id="' + tagId(u1) + '"></div>');
                    f1.renderDownloadLink('<div class="' + opts.imgClass + ' ' + tagId(u2) + '"'
                        + makeStyle(w2, h2)
                        + '></div>', opts);
                    f2.renderImage($.extend({}, opts, { timelag: opts.timelag * 1.2 }));
                }
                else {
                    repStrings.push('<span class="' + tagId(u1) + '"></span>');
                    f1.renderDownloadLink(d, opts);
                }
                ;
                return 'aBra§kadabra' + (repStrings.length - 1) + '§';
            }
            else {
                return '<div class="notice-danger" >File missing: ' + d + '</div>';
            }
        });
        txt = txt.replace(RE.tagSingleObject, ($0, $1, $2, $3) => {
            let u1 = getUrl($1), t1 = getType($1), w1 = getAttr("width", $1), h1 = getAttr("height", $1);
            if (!u1)
                console.warn('No image or link found in ' + $0);
            let e = u1 ? u1.fileExt() : undefined;
            if (!e)
                return $0;
            let d = $3 || u1, hasImg = false;
            e = e.toLowerCase();
            let f1 = new CFileWithContent(LIB.itemByTitle(this.cData.files, u1));
            if ((!f1 || !f1.hasContent()) && u1 && CONFIG.applExtensions.includes(e)) {
                for (var i = 0, I = CONFIG.imgExtensions.length; (!f1 || !f1.hasContent()) && i < I; i++) {
                    u1 = u1.fileName() + '.' + CONFIG.imgExtensions[i];
                    f1 = new CFileWithContent(LIB.itemByTitle(this.cData.files, u1));
                }
                ;
            }
            ;
            if (f1 && f1.hasContent()) {
                if (f1.canBeRenderedAsImage()) {
                    hasImg = true;
                    d = '<div class="' + opts.imgClass + ' ' + tagId(u1) + '"'
                        + makeStyle(w1, h1)
                        + '></div>';
                    f1.renderImage(opts);
                }
                else if (f1.canBeDownloaded()) {
                    hasImg = true;
                    if (app.embedded)
                        f1.renderDownloadLink(d, opts);
                    else
                        f1.renderDownloadLink('<img src="' + CONFIG.imgURL + '/' + e + '-icon.png" type="image/png" alt="[ ' + e + ' ]" />', opts);
                    d = '<div id="' + tagId(u1) + '" ' + CONFIG.fileIconStyle + '></div>';
                }
                else {
                    d = '<span>' + d + '</span>';
                }
            }
            else {
                d = '<div class="notice-danger" >File missing: ' + d + '</div>';
            }
            ;
            if (hasImg)
                repStrings.push(d);
            else
                repStrings.push('<a href="' + u1 + '"' + t1 + ' >' + d + '</a>');
            return 'aBra§kadabra' + (repStrings.length - 1) + '§';
        });
        txt = txt.replace(RE.tagA, ($0, $1, $2) => {
            var u1 = getAttr('href', $1), e = u1 ? u1.fileExt() : undefined;
            if (!e)
                return $0;
            if (CONFIG.officeExtensions.indexOf(e.toLowerCase()) < 0)
                return $0;
            var t1 = getType($1);
            if (!$2) {
                var d = u1.split('/');
                $2 = d[d.length - 1];
            }
            ;
            e = '<img src="' + CONFIG.imgURL + '/' + e + '-icon.png" type="image/png" />';
            return ('<a href="' + u1 + '" ' + t1 + ' target="_blank" >' + e + '</a>');
        });
        txt = txt.replace(/aBra§kadabra(\d+)§/g, ($0, $1) => {
            return repStrings[$1];
        });
        return txt;
    }
}
class CResourceToShow {
    constructor(el) {
        this.hasPropertyWithUpdatePermission = false;
        this.selPrj = app.projects.selected;
        this.cData = this.selPrj.cache;
        this.id = el.id;
        this['class'] = el['class'];
        this.rC = LIB.getExtendedClasses(this.cData.get("resourceClass", "all"), [el['class']])[0];
        this.revision = el.revision;
        this.language = el.language || this.selPrj.language;
        this.order = el.order;
        this.revision = el.revision;
        this.replaces = el.replaces;
        this.changedAt = el.changedAt;
        this.changedBy = el.changedBy;
        this.other = LIB.forAll(el.properties, (p) => { return new CPropertyToShow(p, this.rC); });
        let a = LIB.titleIdx(this.other, this.cData.propertyClasses);
        if (a > -1) {
            this.title = this.other.splice(a, 1)[0];
        }
        ;
        this.descriptions = [];
        for (a = this.other.length - 1; a > -1; a--) {
            if (CONFIG.descProperties.includes(this.other[a].title)) {
                this.descriptions.unshift(this.other.splice(a, 1)[0]);
            }
        }
        ;
        let iPrm = LIB.itemBy(this.selPrj.myPermissions, 'item', this.rC.id);
        if (iPrm)
            this.rC.permissionVector = iPrm.permissionVector;
        else {
            iPrm = LIB.itemBy(this.selPrj.myPermissions, 'item', this.selPrj.id);
            if (iPrm)
                this.rC.permissionVector = iPrm.permissionVector;
            else
                this.rC.permissionVector = noPermission;
        }
        ;
        for (var pC of this.cData.get('propertyClass', this.rC.propertyClasses)) {
            let iPrm = LIB.itemBy(this.selPrj.myPermissions, 'item', pC.id);
            if (iPrm)
                pC.permissionVector = iPrm.permissionVector;
            else {
                iPrm = LIB.itemBy(this.selPrj.myPermissions, 'item', this.rC.id);
                if (iPrm)
                    pC.permissionVector = iPrm.permissionVector;
                else {
                    iPrm = LIB.itemBy(this.selPrj.myPermissions, 'item', this.selPrj.id);
                    if (iPrm)
                        pC.permissionVector = iPrm.permissionVector;
                    else
                        pC.permissionVector = noPermission;
                }
            }
            ;
            if (pC.permissionVector.U) {
                this.hasPropertyWithUpdatePermission = true;
                break;
            }
        }
        ;
    }
    isEqual(res) {
        return res && this.id == res.id && this.changedAt == res.changedAt;
    }
    isUserInstantiated() {
        return (!Array.isArray(this.rC.instantiation)
            || this.rC.instantiation.includes(SpecifInstantiation.User));
    }
    renderAttr(lbl, val, cssCl) {
        cssCl = cssCl ? ' ' + cssCl : '';
        return '<div class="attribute' + cssCl + '">'
            + (lbl ? '<div class="attribute-label" >' + lbl + '</div><div class="attribute-value" >'
                : '<div class="attribute-wide" >')
            + val
            + '</div>'
            + '</div>';
    }
    renderTitle(opts) {
        if (!this.title || !this.title.values)
            return '';
        let ti = LIB.displayValueOf(this.title.values[0], Object.assign({}, opts, { lookupValues: this.rC.isHeading, stripHTML: true }));
        if (this.rC.isHeading) {
            return '<div class="chapterTitle" >' + (this.order ? this.order + '&#160;' : '') + ti + '</div>';
        }
        ;
        return '<div class="objectTitle" >' + (CONFIG.addIconToInstance ? LIB.addIcon(ti, this.rC.icon) : ti) + '</div>';
    }
    listEntry() {
        if (!this.id)
            return '<div class="notice-default">' + i18n.MsgNoObject + '</div>';
        const clickable = ['#' + CONFIG.objectList, '#' + CONFIG.objectDetails].includes(app.specs.selectedView()), opts = {
            clickableElements: clickable,
            linkifyURLs: clickable,
            unescapeHTMLTags: true,
            makeHTML: true,
            renderFiles: true,
            lookupTitles: true,
            lookupValues: true,
            targetLanguage: this.language,
            localDateTime: true,
            rev: this.revision
        }, optsDesc = Object.assign({
            titleLinking: clickable,
            titleLinkTargets: app.standards.titleLinkTargets()
        }, opts);
        var rO = '<div class="listEntry">'
            + '<div class="content-main">';
        switch (app.specs.selectedView()) {
            case '#' + CONFIG.objectFilter:
            case '#' + CONFIG.objectList:
                rO += '<div onclick="app.specs.itemClicked(\'' + this.id + '\')">'
                    + this.renderTitle(opts)
                    + '</div>';
                break;
            default:
                rO += this.renderTitle(opts);
        }
        ;
        this.descriptions.forEach((prp) => {
            if (prp.isVisible(opts)) {
                rO += this.renderAttr('', prp.get(optsDesc));
            }
        });
        rO += '</div>'
            + '<div class="content-other">';
        rO += this.renderAttr(app.ontology.localize('SpecIF:Resource', opts), LIB.titleOf(this.rC, opts), 'attribute-condensed');
        this.other.forEach((prp) => {
            if (prp.isVisible(opts)) {
                rO += this.renderAttr(LIB.titleOf(prp, opts), prp.get(opts), 'attribute-condensed');
            }
        });
        rO += '</div>'
            + '</div>';
        return rO;
    }
}
class CResourcesToShow {
    constructor() {
        this.list = [];
    }
    push(r) {
        this.list.push(new CResourceToShow(r));
        return true;
    }
    append(rL) {
        rL.forEach((r) => {
            this.push(r);
        });
        return true;
    }
    set(idx, r) {
        if (this.list[idx].isEqual(r)) {
            return false;
        }
        ;
        this.list[idx] = new CResourceToShow(r);
        return true;
    }
    update(rL) {
        if (rL.length == this.list.length) {
            var chg = false;
            for (var i = rL.length - 1; i > -1; i--)
                chg = this.set(i, rL[i]) || chg;
            return chg;
        }
        else {
            this.list.length = 0;
            this.append(rL);
            return true;
        }
    }
    updateSelected(r) {
        if (this.list.length > 0)
            return this.set(0, r);
        else
            return this.push(r);
    }
    selected() {
        return this.list[0];
    }
    exists(rId) {
        for (var i = this.list.length - 1; i > -1; i--)
            if (this.list[i].id == rId)
                return true;
        return false;
    }
    render() {
        if (this.list.length < 1)
            return '<div class="notice-default" >' + i18n.MsgNoMatchingObjects + '</div>';
        var rL = '';
        this.list.forEach((v) => {
            rL += v ? v.listEntry() : '';
        });
        return rL;
    }
}
class CFileWithContent {
    constructor(f) {
        for (var a in f)
            this[a] = f[a];
    }
    hasBlob() {
        return !!this.blob && this.blob.size > 0;
    }
    hasDataURL() {
        return !!this.dataURL && this.dataURL.length > 0;
    }
    hasContent() {
        return this.title && this.title.length > 0 && (this.hasBlob() || this.hasDataURL());
    }
    canBeRenderedAsImage() {
        return ['png', 'svg', 'bpmn', 'jpg', 'jpeg', 'gif'].includes(this.title.fileExt().toLowerCase());
    }
    canBeDownloaded() {
        return CONFIG.officeExtensions.concat(CONFIG.applExtensions).includes(this.title.fileExt().toLowerCase());
    }
    renderDownloadLink(txt, opts) {
        function addL(r, fTi, fTy) {
            document.getElementById(tagId(fTi)).innerHTML =
                '<a href="' + r + '" type="' + fTy + '" download="' + fTi.baseName() + '" >' + txt + '</a>';
        }
        if (typeof (opts) != 'object')
            opts = {};
        if (typeof (opts.timelag) != 'number')
            opts.timelag = CONFIG.imageRenderingTimelag;
        if (this.hasBlob())
            LIB.blob2dataURL(this, addL, opts.timelag);
        else if (this.hasDataURL())
            setTimeout(() => { addL(this.dataURL, this.title, this.type); }, opts.timelag);
        else
            throw Error('Neither Blob nor DataURL found when preparing a download link.');
    }
    renderImage(opts) {
        if (typeof (opts) != 'object')
            opts = {};
        if (typeof (opts.timelag) != 'number')
            opts.timelag = CONFIG.imageRenderingTimelag;
        if (!this.blob && !this.dataURL) {
            setTimeout(() => {
                Array.from(document.getElementsByClassName(tagId(this.title)), (el) => { el.innerHTML = '<div class="notice-danger" >Image missing: ' + this.title + '</div>'; });
            }, opts.timelag);
            return;
        }
        ;
        if (this.dataURL) {
            setTimeout(() => {
                Array.from(document.getElementsByClassName(tagId(this.title)), (el) => {
                    let ty = /data:([^;]+);/.exec(this.dataURL);
                    el.innerHTML = '<object data="' + this.dataURL
                        + '" type="' + (ty[1] || this.type) + '"'
                        + ' >' + this.title + '</object>';
                });
            }, opts.timelag);
            return;
        }
        ;
        switch (this.type) {
            case 'image/png':
            case 'image/x-png':
            case 'image/jpeg':
            case 'image/jpg':
            case 'image/gif':
                this.showRaster(opts);
                break;
            case 'image/svg+xml':
                this.showSvg(opts);
                break;
            case 'application/bpmn+xml':
                this.showBpmn(opts);
                break;
            default:
                console.warn('Cannot show diagram ' + this.title + ' of unknown type: ', this.type);
        }
    }
    ;
    showRaster(opts) {
        LIB.blob2dataURL(this, (r, fTi, fTy) => {
            Array.from(document.getElementsByClassName(tagId(fTi)), (el) => {
                el.innerHTML = '<img src="' + r
                    + '" type="' + fTy + '"'
                    + ' alt="' + fTi + '" />';
            });
        }, opts.timelag);
    }
    showSvg(opts) {
        LIB.blob2text(this, displaySVGeverywhere, opts.timelag);
        return;
        function itemBySimilarId(L, id) {
            id = id.trim();
            for (var i = L.length - 1; i > -1; i--)
                if (L[i].id.includes(id))
                    return L[i];
        }
        function itemBySimilarTitle(L, ti) {
            ti = ti.trim();
            for (var i = L.length - 1; i > -1; i--)
                if (L[i].title.includes(ti))
                    return L[i];
        }
        function displaySVGeverywhere(r, fTi) {
            let svg = {
                locs: document.getElementsByClassName(tagId(fTi)),
                img: r
            }, dataURLs = [], rE = /(<image .* xlink:href=\")(.+)(\".*\/>)/g, ef, mL, pend = 0;
            while ((mL = rE.exec(r)) != null) {
                if (mL[2].startsWith('data:'))
                    continue;
                if (LIB.indexById(dataURLs, mL[2]) > -1)
                    continue;
                ef = itemBySimilarTitle(app.projects.selected.cache.files, mL[2]);
                if (ef && ef.blob) {
                    pend++;
                    LIB.blob2dataURL(ef, (r, fTi) => {
                        dataURLs.push({
                            id: fTi,
                            val: r
                        });
                        if (--pend < 1) {
                            svg.img = svg.img.replace(rE, ($0, $1, $2, $3) => {
                                let dURL = itemBySimilarId(dataURLs, $2);
                                return dURL ? $1 + dURL.val + $3 : "";
                            });
                            displayAll(svg);
                        }
                    });
                }
            }
            ;
            if (pend < 1) {
                displayAll(svg);
            }
            ;
            return;
            function displayAll(svg) {
                Array.from(svg.locs, (loc) => {
                    loc.innerHTML = svg.img;
                    addViewBoxIfMissing(loc);
                    if (opts && opts.clickableElements)
                        registerClickEls(loc);
                });
            }
        }
        function addViewBoxIfMissing(svg) {
            for (var el of svg.childNodes) {
                if (el && el.outerHTML && el.outerHTML.startsWith('<svg')) {
                    if (el.getAttribute("viewBox"))
                        return;
                    let w = el.getAttribute('width').replace(/px$/, ''), h = el.getAttribute('height').replace(/px$/, '');
                    el.setAttribute("viewBox", '0 0 ' + w + ' ' + h);
                    return;
                }
            }
        }
        function registerClickEls(svg) {
            if (!CONFIG.clickableModelElements || CONFIG.clickElementClasses.length < 1)
                return;
            svg.clkEls = [];
            CONFIG.clickElementClasses.forEach((cl) => {
                svg.clkEls = svg.clkEls.concat(Array.from(svg.getElementsByClassName(cl)));
            });
            svg.clkEls.forEach((clkEl) => {
                clkEl.setAttribute("style", "cursor:pointer;");
                clkEl.addEventListener("dblclick", function () {
                    let eId = this.className.baseVal.split(' ')[1];
                    eId = correspondingPlan(eId);
                    $("#details").empty();
                    app.specs.showTree.set();
                    app.specs.tree.selectNodeByRef(LIB.makeKey(eId), true);
                    document.getElementById(CONFIG.objectList).scrollTop = 0;
                });
                clkEl.addEventListener("mouseover", function () {
                    let eId = this.className.baseVal.split(' ')[1], selPrj = app.projects.selected, clsPrp = new CResourceToShow(itemBySimilarId(selPrj.cache.resources, eId)), ti = LIB.languageTextOf(clsPrp.title.values[0], { targetLanguage: selPrj.language }), dsc = '';
                    clsPrp.descriptions.forEach((d) => {
                        dsc += d.get({ unescapeHTMLTags: true, makeHTML: d.pC.format == SpecifTextFormat.Xhtml, renderFiles: true });
                    });
                    if (dsc.stripCtrl().stripHTML()) {
                        $("#details").html('<div style="font-size:120%;margin-bottom:0.3em">'
                            + (CONFIG.addIconToInstance ? LIB.addIcon(ti, clsPrp.rC.icon) : ti)
                            + '</div>'
                            + dsc);
                        app.specs.showTree.set(false);
                    }
                });
                clkEl.addEventListener("mouseout", function () {
                    $("#details").empty();
                    app.specs.showTree.set();
                });
            });
            return svg;
            function correspondingPlan(id) {
                if (CONFIG.selectCorrespondingDiagramFirst) {
                    let cacheData = app.projects.selected.cache, ti = cacheData.instanceTitleOf(itemBySimilarId(cacheData.resources, id), opts), rT;
                    for (var i = cacheData.resources.length - 1; i > -1; i--) {
                        rT = LIB.itemByKey(cacheData.resourceClasses, cacheData.resources[i]['class']);
                        if (CONFIG.diagramClasses.includes(rT.title)
                            && cacheData.instanceTitleOf(cacheData.resources[i], opts) == ti) {
                            if (app[CONFIG.objectList].resources.selected()
                                && app[CONFIG.objectList].resources.selected().id == cacheData.resources[i].id)
                                return id;
                            else
                                return cacheData.resources[i].id;
                        }
                        ;
                    }
                    ;
                }
                ;
                return id;
            }
        }
    }
    showBpmn(opts) {
        LIB.blob2text(this, (t, fTi) => {
            bpmn2svg(t)
                .then((result) => {
                Array.from(document.getElementsByClassName(tagId(fTi)), (el) => { el.innerHTML = result.svg; });
            }, (err) => {
                console.error('BPMN-Viewer could not deliver SVG', err);
            });
        }, opts.timelag);
    }
}
moduleManager.construct({
    name: CONFIG.specifications
}, (self) => {
    let myName = self.loadAs, myFullName = 'app.' + myName;
    self.selectedView = () => {
        return self.ViewControl.selected.view;
    };
    self.emptyTab = (tab) => {
        app.busy.reset();
        $(tab).empty();
    };
    self.init = () => {
        let h = '<div id="specLeft" class="paneLeft" style="position:relative">'
            + '<div id="navBtns" class="btn-group-vertical btn-group-sm" style="position:absolute;top:4px;right:12px;z-index:900">'
            + '<button class="btn btn-default" onclick="' + myFullName + '.tree.moveUp()" data-toggle="popover" title="' + i18n.LblPrevious + '" >' + i18n.IcoPrevious + '</button>'
            + '<button class="btn btn-default" onclick="' + myFullName + '.tree.moveDown()" data-toggle="popover" title="' + i18n.LblNext + '" >' + i18n.IcoNext + '</button>'
            + '</div>'
            + '<div id="hierarchy" class="pane-tree" ></div>'
            + '<div id="details" class="pane-details" ></div>'
            + '</div>';
        if (self.selector)
            $(self.selector).after(h);
        else
            $(self.view).prepend(h);
        self.tree = new Tree({
            loc: '#hierarchy',
            dragAndDrop: app.title != i18n.LblReader,
            eventHandlers: {
                'select': (event) => {
                    self.tree.selectedNode = event.node;
                    document.getElementById(CONFIG.objectList).scrollTop = 0;
                    self.refresh();
                },
                'open': () => {
                    if (self.selectedView() == '#' + CONFIG.objectList)
                        self.refresh();
                },
                'close': () => {
                    if (self.selectedView() == '#' + CONFIG.objectList)
                        self.refresh();
                },
                'move': (event) => {
                    function moveNode(movedNd, target) {
                        function toSpecIF(mNd) {
                            var nd = {
                                id: mNd.id,
                                resource: mNd.ref,
                                changedAt: chd
                            }, ch = mNd.children.map(toSpecIF);
                            if (ch.length > 0)
                                nd.nodes = ch;
                            return nd;
                        }
                        let chd = new Date().toISOString(), h = toSpecIF(movedNd);
                        for (var p in target) {
                            h[p] = target[p].id;
                        }
                        ;
                        self.selPrj.createItems('node', [h])
                            .then(() => {
                            self.tree.numberize();
                            self.reworkTree();
                            document.getElementById(CONFIG.objectList).scrollTop = 0;
                            self.refresh();
                        }, LIB.stdError);
                    }
                    app.busy.set();
                    self.selPrj.deleteItems('node', [LIB.keyOf(event.move_info.moved_node)])
                        .then(() => {
                        if (/after/.test(event.move_info.position)) {
                            moveNode(event.move_info.moved_node, { predecessor: event.move_info.target_node });
                        }
                        else if (/inside/.test(event.move_info.position)) {
                            moveNode(event.move_info.moved_node, { parent: event.move_info.target_node });
                        }
                        else {
                            moveNode(event.move_info.moved_node, { parent: event.move_info.target_node.parent });
                        }
                        ;
                    }, LIB.stdError);
                }
            }
        });
        self.showLeft = new State({
            showWhenSet: ['#specLeft'],
            hideWhenSet: []
        });
        self.showTree = new State({
            showWhenSet: ['#hierarchy', '#navBtns'],
            hideWhenSet: ['#details']
        });
        refreshReqCnt = 0;
        return true;
    };
    self.clear = () => {
        self.tree.clear();
        refreshReqCnt = 0;
        app.projects.clear();
        app.busy.reset();
    };
    self.hide = () => {
        app.busy.reset();
    };
    self.updateTree = (opts, spc) => {
        if (!spc)
            spc = self.cData.hierarchies;
        self.tree.saveState();
        self.tree.set(LIB.forAll(spc, toJqTreeWithoutRoot));
        self.tree.numberize();
        self.tree.restoreState();
        return;
        function toJqTreeWithoutRoot(iE) {
            let r = LIB.itemByKey(self.cData.resources, iE.resource), ty = LIB.valueByTitle(r, CONFIG.propClassType, self.cData);
            if (ty == CONFIG.hierarchyRoot)
                return LIB.forAll(iE.nodes, toJqTree);
            return toJqTree(iE);
        }
        function toJqTree(iE) {
            let r = LIB.itemByKey(self.cData.resources, iE.resource);
            var oE = {
                id: iE.id,
                name: self.cData.instanceTitleOf(r, Object.assign({}, opts, { neverEmpty: true })),
                ref: iE.resource,
                children: LIB.forAll(iE.nodes, toJqTree)
            };
            return oE;
        }
    };
    self.show = (opts) => {
        self.selPrj = app.projects.selected;
        if (!(self.selPrj && self.selPrj.isLoaded()))
            console.warn("No selected project on entry of spec.show()");
        self.cData = self.selPrj.cache;
        $('#pageTitle').html(LIB.languageTextOf(self.selPrj.title, { targetLanguage: self.selPrj.language }));
        app.busy.set();
        let uP = opts.urlParams, fNd = self.tree.firstNode();
        opts.targetLanguage = self.selPrj.language;
        opts.lookupValues = true;
        if (!fNd
            || !self.cData.has("resource", [fNd.ref])
            || uP && uP[CONFIG.keyProject] && uP[CONFIG.keyProject] != self.selPrj.id)
            self.tree.clear();
        if (self.cData.length("hierarchy") > 0) {
            self.selPrj.readItems('hierarchy', self.selPrj.hierarchies, { reload: true })
                .then((rsp) => {
                let nd;
                self.updateTree(opts, rsp);
                if (uP && uP[CONFIG.keyNode]) {
                    nd = self.tree.selectNodeById(uP[CONFIG.keyNode]);
                }
                ;
                if (!nd && uP && uP[CONFIG.keyItem]) {
                    nd = self.tree.selectNodeByRef(uP[CONFIG.keyItem]);
                }
                ;
                if (!nd)
                    nd = self.tree.selectedNode;
                if (!nd)
                    nd = self.tree.selectFirstNode();
                if (nd)
                    self.tree.openNode(nd);
            }, LIB.stdError);
        }
    };
    var refreshReqCnt = 0;
    self.refresh = (params) => {
        refreshReqCnt++;
        setTimeout(() => {
            if (--refreshReqCnt < 1)
                self.doRefresh(params);
        }, CONFIG.noMultipleRefreshWithin);
    };
    self.doRefresh = (parms) => {
        self.ViewControl.selected.show(parms);
    };
    self.reworkTree = () => {
        self.selPrj.createFolderWithGlossary({ addGlossary: true })
            .then(() => {
            return self.selPrj.createFolderWithUnreferencedResources({ addUnreferencedResources: true });
        })
            .then(() => {
            self.updateTree({
                lookupTitles: true,
                targetLanguage: self.selPrj.language
            });
            self.doRefresh({ forced: true });
        })
            .catch(LIB.stdError);
    };
    self.itemClicked = (rId) => {
        if (['#' + CONFIG.objectRevisions, '#' + CONFIG.comments].includes(self.selectedView()))
            return;
        if (self.tree.selectedNode.ref != rId) {
            self.tree.selectNodeByRef(LIB.makeKey(rId));
            document.getElementById(CONFIG.objectList).scrollTop = 0;
            self.tree.openNode();
        }
        ;
        if (self.selectedView() != '#' + CONFIG.objectList)
            moduleManager.show({ view: '#' + CONFIG.objectList });
    };
    return self;
});
moduleManager.construct({
    view: '#' + CONFIG.objectList
}, (self) => {
    var myName = self.loadAs, myFullName = 'app.' + myName, selPrj, selRes;
    self.resCreClasses = [];
    self.resCre = false;
    self.resources = new CResourcesToShow();
    self.init = () => {
        return true;
    };
    self.clear = () => {
        self.resources.init();
    };
    self.hide = () => {
        $(self.view).empty();
    };
    self.show = (opts) => {
        self.parent.showLeft.set();
        self.parent.showTree.set();
        selPrj = app.projects.selected;
        if (typeof (opts) != 'object')
            opts = {};
        opts.targetLanguage = selPrj.language;
        opts.lookupTitles = true;
        app.busy.set();
        if (!self.parent.tree.selectedNode)
            self.parent.tree.selectFirstNode();
        var nL;
        getPermissionsPrj();
        getNextResources()
            .then(renderNextResources, (err) => {
            if (err.status == 744) {
                self.parent.tree.selectFirstNode();
                getNextResources()
                    .then(renderNextResources, handleErr);
            }
            else {
                handleErr(err);
            }
        });
        return;
        function getNextResources() {
            var nd = self.parent.tree.selectedNode, oL = [];
            nL = [];
            if (nd && !opts.urlParams)
                setUrlParams({
                    project: selPrj.id,
                    view: self.view,
                    node: nd.id
                });
            for (var i = CONFIG.objToGetCount - 1; nd && i > -1; i--) {
                oL.push(nd.ref);
                nL.push(nd);
                nd = nd.getNextVisibleNode();
            }
            ;
            return selPrj.readItems('resource', oL);
        }
        function renderNextResources(rL) {
            for (var i = rL.length - 1; i > -1; i--)
                rL[i].order = nL[i].order;
            if (self.resources.update(rL) || opts && opts.forced) {
                $(self.view).html(self.resources.render());
            }
            ;
            selRes = self.resources.selected();
            $(self.view).prepend(actionBtns());
            app.busy.reset();
        }
        function handleErr(err) {
            LIB.stdError(err);
            app.busy.reset();
        }
        function actionBtns() {
            var rB = '<div class="btn-group" style="position:absolute;top:4px;right:4px;z-index:900">';
            if (self.resCre && (!selRes || selRes.isUserInstantiated()))
                rB += '<button class="btn btn-success" onclick="' + myFullName + '.editResource(\'create\')" '
                    + 'data-toggle="popover" title="' + i18n.LblAddObject + '" >' + i18n.IcoAdd + '</button>';
            else
                rB += '<button disabled class="btn btn-default" >' + i18n.IcoAdd + '</button>';
            if (!selRes)
                return rB + '</div>';
            if (self.resCre && selRes.isUserInstantiated())
                rB += '<button class="btn btn-success" onclick="' + myFullName + '.editResource(\'clone\')" '
                    + 'data-toggle="popover" title="' + i18n.LblCloneObject + '" >' + i18n.IcoClone + '</button>';
            else
                rB += '<button disabled class="btn btn-default" >' + i18n.IcoClone + '</button>';
            if (selRes.hasPropertyWithUpdatePermission)
                rB += '<button class="btn btn-default" onclick="' + myFullName + '.editResource(\'update\')" '
                    + 'data-toggle="popover" title="' + i18n.LblUpdateObject + '" >' + i18n.IcoEdit + '</button>';
            else
                rB += '<button disabled class="btn btn-default" >' + i18n.IcoEdit + '</button>';
            rB += '<button disabled class="btn btn-default" >' + i18n.IcoComment + '</button>';
            if (selRes.rC.permissionVector.D && selRes.isUserInstantiated())
                rB += '<button class="btn btn-danger" onclick="' + myFullName + '.deleteNode()" '
                    + 'data-toggle="popover" title="' + i18n.LblDeleteObject + '" >' + i18n.IcoDelete + '</button>';
            else
                rB += '<button disabled class="btn btn-default" >' + i18n.IcoDelete + '</button>';
            return rB + '</div>';
        }
        ;
        function getPermissionsPrj() {
            if (app.title != i18n.LblReader) {
                self.resCreClasses.length = 0;
                selPrj.cache.get('resourceClass', selPrj.resourceClasses)
                    .forEach((rC) => {
                    let iPrm = LIB.itemBy(selPrj.myPermissions, 'item', rC.id);
                    if (iPrm)
                        rC.permissionVector = iPrm.permissionVector;
                    else {
                        iPrm = LIB.itemBy(selPrj.myPermissions, 'item', selPrj.id);
                        if (iPrm)
                            rC.permissionVector = iPrm.permissionVector;
                        else
                            rC.permissionVector = noPermission;
                    }
                    ;
                    if (rC.permissionVector.C && (!rC.instantiation || rC.instantiation.includes(SpecifInstantiation.User)))
                        self.resCreClasses.push(rC.id);
                });
                self.resCre = self.resCreClasses.length > 0;
            }
            ;
        }
    };
    self.editResource = (mode) => {
        if (app[CONFIG.resourceEdit]) {
            app[CONFIG.resourceEdit].show({ eligibleResourceClasses: self.resCreClasses, mode: mode });
        }
        else {
            throw Error("\'editResource\' clicked, but module '" + CONFIG.resourceEdit + "' is not ready.");
        }
    };
    self.deleteNode = () => {
        new BootstrapDialog({
            title: i18n.MsgConfirm,
            type: BootstrapDialog.TYPE_DANGER,
            message: i18n.lookup('MsgConfirmObjectDeletion', self.parent.tree.selectedNode.name),
            buttons: [{
                    label: i18n.BtnCancel,
                    action: (thisDlg) => {
                        thisDlg.close();
                    }
                }, {
                    label: i18n.BtnDeleteObjectRef,
                    action: (thisDlg) => {
                        delNd(self.parent.tree.selectedNode);
                        thisDlg.close();
                    }
                }]
        })
            .open();
        return;
        function delNd(nd) {
            console.info("Deleting tree object '" + nd.name + "'.");
            self.parent.tree.selectNode(nd.getNextSibling());
            app.projects.selected.deleteItems('node', [LIB.makeKey(nd)])
                .then(self.parent.reworkTree, LIB.stdError);
        }
    };
    self.relatedItemClicked = (rId) => {
        self.parent.tree.selectNodeByRef(LIB.makeKey(rId));
        document.getElementById(CONFIG.objectList).scrollTop = 0;
    };
    return self;
});
moduleManager.construct({
    view: '#' + CONFIG.relations
}, (self) => {
    var myName = self.loadAs, myFullName = 'app.' + myName, selPrj, cacheData, selRes, net, modeStaDel = false;
    self.staCreClasses = { subjectClasses: [], objectClasses: [] };
    self.staCre = false;
    self.staDel = false;
    self.init = () => {
        return true;
    };
    self.hide = () => {
        $(self.view).empty();
    };
    self.show = (opts) => {
        self.parent.showLeft.set();
        self.parent.showTree.set();
        selPrj = app.projects.selected;
        cacheData = selPrj.cache;
        if (typeof (opts) != 'object')
            opts = {};
        opts.targetLanguage = selPrj.language;
        opts.lookupTitles =
            opts.lookupValues = true;
        if (!self.parent.tree.selectedNode)
            self.parent.tree.selectFirstNode();
        if (!self.parent.tree.selectedNode) {
            self.parent.emptyTab(self.view);
            return;
        }
        ;
        app.busy.set();
        var nd = self.parent.tree.selectedNode;
        if (nd && !opts.urlParams)
            setUrlParams({
                project: selPrj.id,
                view: self.view,
                node: nd.id
            });
        selPrj.readStatementsOf(nd.ref, { dontCheckStatementVisibility: aDiagramWithoutShowsStatementsForEdges(), asSubject: true, asObject: true })
            .then((sL) => {
            net = new CGraph({ resources: [nd.ref] });
            sL.forEach(cacheNet);
            return selPrj.readItems('resource', net.resources);
        })
            .then((rResL) => {
            rResL.forEach((r) => { cacheMinRes(net, r); });
            selRes = LIB.itemByKey(rResL, nd.ref);
            getPermissions(selRes);
            return getMentionsRels(selRes, opts);
        })
            .then((stL) => {
            if (!modeStaDel)
                stL.forEach(cacheNet);
            renderStatements(net);
            $(self.view).prepend(linkBtns());
            app.busy.reset();
        })
            .catch((xhr) => {
            LIB.stdError(xhr);
            app.busy.reset();
        });
        return;
        function cacheMinRes(N, r) {
            N.add({ resources: [{ id: r.id, title: (cacheData.instanceTitleOf(r, Object.assign({}, opts, { addIcon: true, neverEmpty: true }))) }] });
        }
        function cacheMinSta(N, s) {
            let ti = LIB.titleOf(s, opts)
                || LIB.valueByTitle(s, CONFIG.propClassType, cacheData, opts)
                || LIB.classTitleOf(s['class'], cacheData.statementClasses, opts);
            N.add({ statements: [{ id: s.id, title: ti, subject: s.subject.id, object: s.object.id }] });
        }
        function cacheNet(s) {
            if (CONFIG.hiddenStatements.includes(s.title || LIB.classTitleOf(s['class'], cacheData.statementClasses, {})))
                return;
            cacheMinSta(net, s);
            cacheMinRes(net, (nd.ref.id == s.subject.id ? s.object : s.subject));
        }
        function getMentionsRels(selR, opts) {
            return new Promise((resolve, reject) => {
                if (!CONFIG.findMentionedObjects || !selR)
                    resolve([]);
                let staL = [], pend = 0, localOpts = Object.assign({}, opts, { addIcon: false }), selTi = cacheData.instanceTitleOf(selR, localOpts), refPatt, selPatt = new RegExp((CONFIG.titleLinkBegin + selTi.escapeRE() + CONFIG.titleLinkEnd), "i");
                self.parent.tree.iterate((nd) => {
                    pend++;
                    selPrj.readItems('resource', [nd.ref])
                        .then((rL) => {
                        let refR = rL[0], refTi = cacheData.instanceTitleOf(refR, localOpts), dT;
                        if (refTi && refTi.length > CONFIG.titleLinkMinLength - 1 && refR.id != selR.id) {
                            refPatt = new RegExp((CONFIG.titleLinkBegin + refTi.escapeRE() + CONFIG.titleLinkEnd), "i");
                            selR.properties.forEach((p) => {
                                if (p.values.length > 0) {
                                    dT = LIB.dataTypeOf(p['class'], cacheData);
                                    if (dT && dT.type == XsDataType.String && !dT.enumeration) {
                                        if (refPatt.test(LIB.languageTextOf(p.values[0], localOpts)) && notListed(staL, selR, refR)) {
                                            staL.push({
                                                title: CONFIG.staClassMentions,
                                                subject: selR,
                                                object: refR
                                            });
                                        }
                                    }
                                }
                            });
                            refR.properties.forEach((p) => {
                                dT = LIB.dataTypeOf(p['class'], cacheData);
                                if (dT && dT.type == XsDataType.String && !dT.enumeration) {
                                    if (selPatt.test(LIB.languageTextOf(p.values[0], localOpts)) && notListed(staL, refR, selR)) {
                                        staL.push({
                                            title: CONFIG.staClassMentions,
                                            subject: refR,
                                            object: selR
                                        });
                                    }
                                }
                            });
                        }
                        ;
                        if (--pend < 1) {
                            resolve(staL);
                        }
                        ;
                    }, reject);
                    return true;
                });
            });
            function notListed(L, s, o) {
                for (var l of L) {
                    if (l.subject.id == s.id && l.object.id == o.id)
                        return false;
                }
                ;
                return true;
            }
        }
        ;
        function aDiagramWithoutShowsStatementsForEdges() {
            let res, isNotADiagram, noDiagramFound = true;
            return LIB.iterateNodes(cacheData.get('hierarchy', selPrj.hierarchies), (nd) => {
                res = cacheData.get('resource', [nd.resource])[0];
                isNotADiagram = !CONFIG.diagramClasses.includes(LIB.classTitleOf(res['class'], cacheData.resourceClasses));
                noDiagramFound = noDiagramFound && isNotADiagram;
                return (isNotADiagram
                    || LIB.hasType(res, CONFIG.diagramTypesHavingShowsStatementsForEdges, cacheData));
            }) || noDiagramFound;
        }
    };
    function linkBtns() {
        if (!selRes)
            return '';
        var rB = '<div id="linkBtns" class="btn-group" style="position:absolute;top:4px;right:4px;z-index:900">';
        if (modeStaDel)
            return rB + '<button class="btn btn-default" onclick="' + myFullName + '.toggleModeStaDel()" >' + i18n.BtnCancel + '</button></div>';
        if (app.title != i18n.LblReader && self.staCre)
            rB += '<button class="btn btn-success" onclick="' + myFullName + '.linkResource()" '
                + 'data-toggle="popover" title="' + i18n.LblAddRelation + '" >' + i18n.IcoAdd + '</button>';
        else
            rB += '<button disabled class="btn btn-default" >' + i18n.IcoAdd + '</button>';
        if (app.title != i18n.LblReader && net.statements.length > 0)
            rB += '<button class="btn btn-danger ' + (modeStaDel ? 'active' : '') + '" onclick="' + myFullName + '.toggleModeStaDel()" '
                + 'data-toggle="popover" title="' + i18n.LblDeleteRelation + '" >' + i18n.IcoDelete + '</button>';
        else
            rB += '<button disabled class="btn btn-default" >' + i18n.IcoDelete + '</button>';
        return rB + '</div>';
    }
    function getPermissions(res) {
        if (app.title != i18n.LblReader && res) {
            self.staCreClasses.subjectClasses.length = 0;
            self.staCreClasses.objectClasses.length = 0;
            selPrj.cache.statementClasses.forEach((sC) => {
                if (!sC.instantiation || sC.instantiation.includes(SpecifInstantiation.User)) {
                    if (!sC.subjectClasses || LIB.indexByKey(sC.subjectClasses, res['class']) > -1)
                        self.staCreClasses.subjectClasses.push(LIB.keyOf(sC));
                    if (!sC.objectClasses || LIB.indexByKey(sC.objectClasses, res['class']) > -1)
                        self.staCreClasses.objectClasses.push(LIB.keyOf(sC));
                }
                ;
            });
            self.staCre = self.staCreClasses.subjectClasses.length > 0 || self.staCreClasses.objectClasses.length > 0;
        }
    }
    function renderStatements(net) {
        if (net.statements.length < 1) {
            $(self.view).html('<div class="notice-default">' + i18n.MsgNoRelatedObjects + '</div>');
            modeStaDel = false;
            return;
        }
        ;
        let graphOptions = new CGraphOptions({
            canvas: self.view.substring(1),
            titleProperties: CONFIG.titleProperties,
            onDoubleClick: (evt) => {
                if (typeof (evt.target.resource) == 'string')
                    app[myName].relatedItemClicked(evt.target.resource, evt.target.statement);
            },
            focusColor: CONFIG.focusColor,
            nodeColor: modeStaDel ? '#ef9a9a' : '#afcbef'
        });
        net.show(graphOptions);
        $(self.view).prepend('<div style="position:absolute;left:4px;z-index:900">'
            + (modeStaDel ? '<span class="notice-danger" >' + i18n.MsgClickToDeleteRel
                : '<span class="notice-default" >' + i18n.MsgClickToNavigate)
            + '</span></div>');
    }
    self.linkResource = () => {
        if (app[CONFIG.resourceLink]) {
            app[CONFIG.resourceLink].show({ eligibleStatementClasses: self.staCreClasses });
        }
        else {
            throw Error("\'linkResource\' clicked, but module '" + CONFIG.resourceLink + "' is not ready.");
        }
    };
    self.toggleModeStaDel = () => {
        modeStaDel = !modeStaDel;
        self.parent.doRefresh({ forced: true });
    };
    self.relatedItemClicked = (rId, sId) => {
        if (modeStaDel) {
            selPrj.deleteItems('statement', [LIB.makeKey(sId)])
                .then(() => { self.parent.doRefresh({ forced: true }); }, LIB.stdError);
        }
        else {
            self.parent.tree.selectNodeByRef(LIB.makeKey(rId));
            document.getElementById(CONFIG.objectList).scrollTop = 0;
        }
        ;
    };
    return self;
});
