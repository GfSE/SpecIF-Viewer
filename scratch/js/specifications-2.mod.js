"use strict";
/*!	Show SpecIF data
    Dependencies: jQuery, jqTree, bootstrap
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    Author: se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
*/
RE.titleLink = new RegExp(CONFIG.dynLinkBegin.escapeRE() + '(.+?)' + CONFIG.dynLinkEnd.escapeRE(), 'g');
class CPropertyToShow {
    constructor(prp) {
        for (var a in prp)
            this[a] = prp[a];
    }
    isVisible(opts) {
        return (CONFIG.hiddenProperties.indexOf(this.title) < 0
            && (CONFIG.showEmptyProperties || hasContent(languageValueOf(this.value, opts))));
    }
    get(opts) {
        if (typeof (opts) != 'object')
            opts = {};
        if (typeof (opts.dynLinks) != 'boolean')
            opts.dynLinks = false;
        if (typeof (opts.clickableElements) != 'boolean')
            opts.clickableElements = false;
        if (typeof (opts.linkifyURLs) != 'boolean')
            opts.linkifyURLs = false;
        if (typeof (opts.unescapeHTMLTags) != 'boolean')
            opts.unescapeHTMLTags = false;
        if (typeof (opts.makeHTML) != 'boolean')
            opts.makeHTML = false;
        if (typeof (opts.lookupValues) != 'boolean')
            opts.lookupValues = false;
        let pData = app.cache.selectedProject.data, dT = dataTypeOf(pData, this['class']), ct;
        switch (dT.type) {
            case TypeEnum.XsString:
            case TypeEnum.XHTML:
                ct = languageValueOf(this.value, opts).replace(/^\s+/, "");
                if (opts.lookupValues)
                    ct = i18n.lookup(ct);
                if (opts.unescapeHTMLTags)
                    ct = ct.unescapeHTMLTags();
                if (CONFIG.excludedFromFormatting.indexOf(propTitleOf(this, pData)) < 0)
                    ct = ct.makeHTML(opts);
                ct = this.renderFile(ct, opts);
//				console.debug('#',ct);
            //    ct = this.titleLinks(ct, opts);
                break;
            case TypeEnum.XsDateTime:
                ct = localDateTime(this.value);
                break;
            case TypeEnum.XsEnumeration:
                ct = enumValueOf(dT, this.value, opts);
                break;
            default:
                ct = this.value;
        }
        ;
        return ct;
    }
    titleLinks(str, opts) {
        if (!CONFIG.dynLinking || !opts.dynLinks)
            return str.replace(RE.titleLink, ($0, $1) => { return $1; });
        let replaced = false;
        do {
            replaced = false;
            str = str.replace(RE.titleLink, ($0, $1) => {
                replaced = true;
                if ($1.length < CONFIG.dynLinkMinLength)
                    return $1;
                let m = $1.toLowerCase(), cO = null, ti, target = null, notFound = true;
                app.specs.tree.iterate((nd) => {
                    cO = itemById(app.cache.selectedProject.data.resources, nd.ref);
                    ti = elementTitleOf(cO, opts);
                    if (notFound && ti && m == ti.toLowerCase()) {
                        notFound = false;
                        target = cO;
                    }
                    ;
                    return notFound;
                });
                if (target)
                    return lnk(target, $1);
                return '<span style="color:#D82020">' + $1 + '</span>';
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
        if (opts.projId == undefined)
            opts.projId = app.cache.selectedProject.data.id;
        if (opts.imgClass == undefined)
            opts.imgClass = 'forImage';
        function getType(str) {
            let t = /(type="[^"]+")/.exec(str);
            if (Array.isArray(t) && t.length > 0)
                return (' ' + t[1]);
            return '';
        }
        function getUrl(str) {
            let l = /data="([^"]+)"/.exec(str);
            if (Array.isArray(l) && l.length > 0)
                return l[1];
        }
        function getPrpVal(pnm, str) {
            let re = new RegExp(pnm + '="([^"]+)"', ''), l = re.exec(str);
            if (Array.isArray(l) && l.length > 0)
                return l[1];
        }
        function makeStyle(w, h) {
        //    return (h || w) ? ' style="' + (h ? 'height:' + h + '; ' : '') + (w ? 'width:' + w + '; ' : '') + '"' : '';
            return ' style="' + (h ? 'height:' + h + '; ' : '') + (w ? 'width:' + w + '; ' : '') + ' position:relative;"';
        }
//		console.debug('0',txt);
        var repStrings = [];
        txt = txt.replace(RE.tagNestedObjects, ($0, $1, $2, $3, $4) => {
            let u1 = getUrl($1), u2 = getUrl($2), w2 = getPrpVal("width", $2), h2 = getPrpVal("height", $2), d = $4 || u1;
            if (!u1)
                console.warn('no file found in', $0);
            if (!u2)
                console.warn('no image found in', $0);
            let f1 = new CFileWithContent(itemByTitle(app.cache.selectedProject.data.files, u1)), f2 = new CFileWithContent(itemByTitle(app.cache.selectedProject.data.files, u2));
            if (f1.hasContent()) {
                if (f2.hasContent()) {
                    repStrings.push('<div id="' + tagId(u1) + '"></div>');
                    f1.renderDownloadLink(
					//	'<button class="btn btn-success" style="position:absolute;right:0;z-index:900;" >N</button>'
					//	'<button class="btn btn-success" style="display:inline-block;float:right;z-index:900;" >N</button>'
						'<button class="btn btn-sm btn-default" style="position:relative;top:2px;right:2px;z-index:900;" ><i class="fa fa-expand"></i></button>'
						+ '<div class="' + opts.imgClass + ' ' + tagId(u2) + '"'
                        + makeStyle(w2, h2)
                        + '></div>', opts);
					//	+ '><button class="btn btn-success" style="position:absolute;right:0;z-index:900;" >N</button></div>', opts);
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
            ;
        });
        txt = txt.replace(RE.tagSingleObject, ($0, $1, $2, $3) => {
            let u1 = getUrl($1), t1 = getType($1), w1 = getPrpVal("width", $1), h1 = getPrpVal("height", $1);
            let e = u1.fileExt();
            if (!e)
                return $0;
            let d = $3 || u1, hasImg = false;
            e = e.toLowerCase();
            if (!u1)
                console.info('no image found');
            let f1 = new CFileWithContent(itemByTitle(app.cache.selectedProject.data.files, u1));
            if (!f1.hasContent() && CONFIG.applExtensions.indexOf(e) > -1) {
                for (var i = 0, I = CONFIG.imgExtensions.length; !f1 && i < I; i++) {
                    u1 = u1.fileName() + '.' + CONFIG.imgExtensions[i];
                    f1 = new CFileWithContent(itemByTitle(app.cache.selectedProject.data.files, u1));
                }
                ;
            }
            ;
            if (CONFIG.imgExtensions.indexOf(e) > -1 || CONFIG.applExtensions.indexOf(e) > -1) {
                if (f1.hasContent()) {
                    hasImg = true;
                //    d = '<button class="btn btn-success" style="position:absolute;right:0;z-index:900;" >N</button>'
				//		+ '<div class="' + opts.imgClass + ' ' + tagId(u1) + '"'
                //      + '></div>';
					d = '<div class="' + opts.imgClass + ' ' + tagId(u1) + '"'
                        + makeStyle(w1, h1)
						+ '><button class="btn btn-sm btn-default" style="position:absolute;top:2px;right:2px;z-index:900;" ><i class="fa fa-expand"></i></button></div>';
                    f1.renderImage(opts);
                }
                else {
                    d = '<div class="notice-danger" >Image missing: ' + d + '</div>';
                }
                ;
            }
            else if (CONFIG.officeExtensions.indexOf(e) > -1) {
                if (f1.hasContent()) {
                    hasImg = true;
                    if (app.embedded)
                        f1.renderDownloadLink(d, opts);
                    else
                        f1.renderDownloadLink('<img src="' + CONFIG.imgURL + '/' + e + '-icon.png" type="image/png" alt="[ ' + e + ' ]" />', opts);
                    d = '<div id="' + tagId(u1) + '" ' + CONFIG.fileIconStyle + '></div>';
                }
                else {
                    d = '<div class="notice-danger" >File missing: ' + d + '</div>';
                }
                ;
            }
            else {
                switch (e) {
                    case 'ole':
                        hasImg = true;
                        d = '<img src="' + u1.fileName() + '.png" type="image/png" alt="' + d + '" />';
                        break;
                    default:
                        d = '<span>' + d + '</span>';
                }
                ;
            }
            ;
            if (hasImg)
                repStrings.push(d);
            else
                repStrings.push('<a href="' + u1 + '"' + t1 + ' >' + d + '</a>');
            return 'aBra§kadabra' + (repStrings.length - 1) + '§';
        });
        txt = txt.replace(RE.tagA, ($0, $1, $2) => {
            var u1 = getPrpVal('href', $1), e = u1.fileExt();
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
	//	console.debug('4',repStrings);
        txt = txt.replace(/aBra§kadabra([0-9]+)§/g, ($0, $1) => {
            return repStrings[$1];
        });
        return txt;
    }
}
class CResourceToShow {
    constructor(el, pData) {
        if (!pData)
            pData = app.cache.selectedProject.data;
        this.id = el.id;
        this['class'] = itemById(pData.resourceClasses, el['class']);
        this.isHeading = false;
        this.revision = el.revision;
        this.order = el.order;
        this.revision = el.revision;
        this.replaces = el.replaces;
        this.changedAt = el.changedAt;
        this.changedBy = el.changedBy;
        this.descriptions = [];
        this.other = this.normalizeProps(el, pData);
        let a = titleIdx(this.other, pData);
        if (a > -1) {
            this.title = this.other[a];
            this.other.splice(a, 1);
            if (!this.title.value && el.title)
                this.title.value = el.title;
        }
        else {
            this.title = { title: CONFIG.propClassTitle, value: el.title || '' };
        }
        ;
        this.isHeading = this['class'].isHeading
            || CONFIG.headingProperties.indexOf(this['class'].title) > -1
            || CONFIG.headingProperties.indexOf(this.title.title) > -1;
        for (a = this.other.length - 1; a > -1; a--) {
            if (CONFIG.descProperties.indexOf(propTitleOf(this.other[a], pData)) > -1) {
                this.descriptions.unshift(this.other[a]);
                this.other.splice(a, 1);
            }
            ;
        }
        ;
    }
    normalizeProps(el, dta) {
        if (el.properties) {
            let cL = [], pC;
            el.properties.forEach((p) => {
                pC = p['class'];
                if (cL.indexOf(pC) < 0)
                    cL.push(pC);
                else
                    console.warn('The property class ' + pC + ' of element ' + el.id + ' is occurring more than once.');
            });
        }
        ;
        let p, pCs, nL = [], iCs = dta.resourceClasses, iC = itemById(iCs, el['class']);
        pCs = iC._extends ? itemById(iCs, iC._extends).propertyClasses || [] : [];
        pCs = pCs.concat(itemById(iCs, el['class']).propertyClasses || []);
        pCs.forEach((pCid) => {
            if (CONFIG.hiddenProperties.indexOf(pCid) > -1)
                return;
            p = itemBy(el.properties, 'class', pCid)
                || createProp(dta.propertyClasses, pCid);
            if (p) {
                p.title = vocabulary.property.specif(propTitleOf(p, dta));
                nL.push(new CPropertyToShow(p));
            }
        });
        return nL;
    }
    isEqual(res) {
        return res && this.id == res.id && this.changedAt == res.changedAt;
    }
    renderAttr(lbl, val, cssCl) {
        cssCl = cssCl ? ' ' + cssCl : '';
        if (typeof (val) == 'string')
            val = noCode(val);
        else
            val = '';
        val = (lbl ? '<div class="attribute-label" >' + lbl + '</div><div class="attribute-value" >' : '<div class="attribute-wide" >') + val + '</div>';
        return '<div class="attribute' + cssCl + '">' + val + '</div>';
    }
    renderTitle(opts) {
        if (!this.title || !this.title.value)
            return '';
        let ti = languageValueOf(this.title.value, opts);
        if (this.isHeading) {
            if (opts && opts.lookupTitles)
                ti = i18n.lookup(ti);
            return '<div class="chapterTitle" >' + (this.order ? this.order + nbsp : '') + ti + '</div>';
        }
        ;
        return '<div class="objectTitle" >' + (CONFIG.addIconToInstance ? addIcon(ti, this['class'].icon) : ti) + '</div>';
    }
    renderChangeInfo() {
        if (!this.revision)
            return '';
        var rChI = '';
        switch (app.specs.selectedView()) {
            case '#' + CONFIG.objectRevisions:
                rChI = this.renderAttr(i18n.LblRevision, this.revision, 'attribute-condensed');
            case '#' + CONFIG.comments:
                rChI += this.renderAttr(i18n.LblModifiedAt, localDateTime(this.changedAt), 'attribute-condensed')
                    + this.renderAttr(i18n.LblModifiedBy, this.changedBy, 'attribute-condensed');
        }
        ;
        return rChI;
    }
    listEntry(options) {
        if (!this.id)
            return '<div class="notice-default">' + i18n.MsgNoObject + '</div>';
        var opts = options ? simpleClone(options) : {};
        opts.dynLinks
            = opts.clickableElements
                = opts.linkifyURLs
                    = ['#' + CONFIG.objectList, '#' + CONFIG.objectDetails].indexOf(app.specs.selectedView()) > -1;
        opts.unescapeHTMLTags = true;
        opts.makeHTML = true;
        opts.lookupValues = true;
        opts.lookupTitles = true;
        opts.rev = this.revision;
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
//				console.debug('###',prp.get(opts));
                rO += '<div class="attribute attribute-wide">' + prp.get(opts) + '</div>';
            }
        });
        rO += '</div>'
            + '<div class="content-other">';
        this.other.forEach((prp) => {
            if (prp.isVisible(opts)) {
                rO += this.renderAttr(titleOf(prp, opts), prp.get(opts), 'attribute-condensed');
            }
            ;
        });
        rO += this.renderChangeInfo();
        rO += '</div>'
            + '</div>';
        return rO;
    }
}
class CResourcesToShow {
    constructor() {
        this.opts = {
            lookupTitles: true,
            targetLanguage: browser.language
        };
        this.values = [];
    }
    push(r) {
        this.values.push(new CResourceToShow(r));
        return true;
    }
    append(rL) {
        rL.forEach((r) => {
            this.push(r);
        });
        return true;
    }
    set(idx, r) {
        if (this.values[idx].isEqual(r)) {
            return false;
        }
        ;
        this.values[idx] = new CResourceToShow(r);
        return true;
    }
    update(rL) {
        if (rL.length == this.values.length) {
            var chg = false;
            for (var i = rL.length - 1; i > -1; i--)
                chg = this.set(i, rL[i]) || chg;
            return chg;
        }
        else {
            this.values.length = 0;
            this.append(rL);
            return true;
        }
        ;
    }
    updateSelected(r) {
        if (this.values.length > 0)
            return this.set(0, r);
        else
            return this.push(r);
    }
    selected() {
        return this.values[0];
    }
    exists(rId) {
        for (var i = this.values.length - 1; i > -1; i--)
            if (this.values[i].id == rId)
                return true;
        return false;
    }
    render() {
        if (this.values.length < 1)
            return '<div class="notice-default" >' + i18n.MsgNoMatchingObjects + '</div>';
        var rL = '';
        this.values.forEach((v) => {
            rL += v ? v.listEntry(this.opts) : '';
        });
//		console.debug('##',rL);
        return rL;
    }
}
class CFileWithContent {
    constructor(f) {
        for (var a in f)
            this[a] = f[a];
    }
    hasBlob() {
        return this.blob && this.blob.size > 0;
    }
    hasDataURL() {
        return this.dataURL && this.dataURL.length > 0;
    }
    hasContent() {
        return this.hasBlob() || this.hasDataURL();
    }
    renderDownloadLink(txt, opts) {
        function addL(r, fTi, fTy) {
            document.getElementById(tagId(fTi)).innerHTML =
                '<a href="' + r + '" type="' + fTy + '" download="' + fTi + '" >' + txt + '</a>';
        }
        if (typeof (opts) != 'object')
            opts = {};
        if (typeof (opts.timelag) != 'number')
            opts.timelag = CONFIG.imageRenderingTimelag;
        if (this.hasBlob())
            blob2dataURL(this, addL, opts.timelag);
        else
            setTimeout(() => { addL(this.dataURL, this.title, this.type); }, opts.timelag);
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
        ;
    }
    ;
    showRaster(opts) {
        blob2dataURL(this, (r, fTi, fTy) => {
            Array.from(document.getElementsByClassName(tagId(fTi)), (el) => {
                el.innerHTML += '<img src="' + r
                    + '" type="' + fTy + '"'
                    + ' alt="' + fTi + '" />';
            });
        }, opts.timelag);
    }
    showSvg(opts) {
        blob2text(this, displaySVGeverywhere, opts.timelag);
        return;
        function itemBySimilarId(L, id) {
            id = id.trim();
            for (var i = L.length - 1; i > -1; i--)
                if (L[i].id.indexOf(id) > -1)
                    return L[i];
        }
        function itemBySimilarTitle(L, ti) {
            ti = ti.trim();
            for (var i = L.length - 1; i > -1; i--)
                if (L[i].title.indexOf(ti) > -1)
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
                if (indexById(dataURLs, mL[2]) > -1)
                    continue;
                ef = itemBySimilarTitle(app.cache.selectedProject.data.files, mL[2]);
                if (ef && ef.blob) {
                    pend++;
                    blob2dataURL(ef, (r, fTi) => {
                        dataURLs.push({
                            id: fTi,
                            val: r
                        });
                        if (--pend < 1) {
                            svg.img = svg.img.replace(rE, ($0, $1, $2, $3) => {
                                let dURL = itemBySimilarId(dataURLs, $2);
                                if (dURL)
                                    return $1 + dURL.val + $3;
                                else
                                    return '';
                            });
                            displayAll(svg);
                        }
                        ;
                    });
                }
                ;
            }
            ;
            if (pend < 1) {
                displayAll(svg);
            }
            ;
            return;
            function displayAll(svg) {
                Array.from(svg.locs, (loc) => {
                    loc.innerHTML += svg.img;
                    if (opts && opts.clickableElements)
                        registerClickEls(loc);
                });
            }
        }
        function registerClickEls(svg) {
            if (!CONFIG.clickableModelElements || CONFIG.clickElementClasses.length < 1)
                return;
            addViewBoxIfMissing(svg);
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
                    app.specs.showTree.set(true);
                    app.specs.tree.selectNodeByRef(eId, true);
                    document.getElementById(CONFIG.objectList).scrollTop = 0;
                });
                clkEl.addEventListener("mouseover", function () {
                    let eId = this.className.baseVal.split(' ')[1], clsPrp = new CResourceToShow(itemBySimilarId(app.cache.selectedProject.data.resources, eId)), ti = languageValueOf(clsPrp.title.value), dsc = '';
                    clsPrp.descriptions.forEach((d) => {
                        dsc += d.get({ unescapeHTMLTags: true, makeHTML: true });
                    });
                    if (stripHTML(stripCtrl(dsc))) {
                        $("#details").html('<span style="font-size:120%">'
                            + (CONFIG.addIconToInstance ? addIcon(ti, clsPrp['class'].icon) : ti)
                            + '</span>\n'
                            + dsc);
                        app.specs.showTree.set(false);
                    }
                });
                clkEl.addEventListener("mouseout", function () {
                    $("#details").empty();
                    app.specs.showTree.set(true);
                });
            });
            return svg;
            function correspondingPlan(id) {
                if (CONFIG.selectCorrespondingDiagramFirst) {
                    let cacheData = app.cache.selectedProject.data, ti = elementTitleOf(itemBySimilarId(cacheData.resources, id), opts), rT;
                    for (var i = cacheData.resources.length - 1; i > -1; i--) {
                        rT = itemById(cacheData.resourceClasses, cacheData.resources[i]['class']);
                        if (CONFIG.diagramClasses.indexOf(rT.title) < 0)
                            continue;
                        if (elementTitleOf(cacheData.resources[i], opts) == ti) {
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
            function addViewBoxIfMissing(svg) {
                let el;
                for (var i = 0, I = svg.childNodes.length; i < I; i++) {
                    el = svg.childNodes[i];
                    if (el && el.outerHTML && el.outerHTML.startsWith('<svg')) {
                        if (el.getAttribute("viewBox"))
                            return;
                        let w = el.getAttribute('width').replace(/px$/, ''), h = el.getAttribute('height').replace(/px$/, '');
                        el.setAttribute("viewBox", '0 0 ' + w + ' ' + h);
                        return;
                    }
                    ;
                }
                ;
            }
        }
    }
    showBpmn(opts) {
        blob2text(this, (t, fTi) => {
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
        $('#contentNotice').empty();
        $('#contentActions').empty();
        $(tab).empty();
    };
    self.init = () => {
        let h = '<div id="specLeft" class="paneLeft" style="position:relative">'
            + '<div id="navBtns" class="btn-group-vertical btn-group-sm" style="position:absolute;top:2px;right:12px;z-index:900">'
            + '<button class="btn btn-default" onclick="' + myFullName + '.tree.moveUp()" data-toggle="popover" title="' + i18n.LblPrevious + '" >' + i18n.IcoPrevious + '</button>'
            + '<button class="btn btn-default" onclick="' + myFullName + '.tree.moveDown()" data-toggle="popover" title="' + i18n.LblNext + '" >' + i18n.IcoNext + '</button>'
            + '</div>'
            + '<div id="hierarchy" class="pane-tree" ></div>'
            + '<div id="details" class="pane-details" ></div>'
            + '</div>'
            + '<div id="specCtrl" class="contentCtrl" >'
            + '<div id="contentNotice" class="contentNotice" ></div>'
            + '<div id="contentActions" class="btn-group btn-group-sm contentActions" ></div>'
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
                        let chd = new Date().toISOString();
                        app.cache.selectedProject.createContent('node', toSpecIF(movedNd, target))
                            .then(() => {
                            self.tree.numberize();
                            document.getElementById(CONFIG.objectList).scrollTop = 0;
                            self.refresh();
                        }, stdError);
                        return;
                        function toSpecIF(mNd, tgt) {
                            var nd = {
                                id: mNd.id,
                                resource: mNd.ref,
                                changedAt: chd
                            }, ch = mNd.children.map(toSpecIF);
                            if (ch.length > 0)
                                nd.nodes = ch;
                            if (tgt)
                                for (var p in tgt) {
                                    nd[p] = tgt[p].id;
                                }
                            ;
                            return nd;
                        }
                    }
                    app.busy.set();
                    app.cache.selectedProject.deleteContent('node', { id: event.move_info.moved_node.id })
                        .then(() => {
                        let are = /after/, ire = /inside/;
                        if (are.test(event.move_info.position)) {
                            moveNode(event.move_info.moved_node, { predecessor: event.move_info.target_node });
                        }
                        else if (ire.test(event.move_info.position)) {
                            moveNode(event.move_info.moved_node, { parent: event.move_info.target_node });
                        }
                        else {
                            moveNode(event.move_info.moved_node, { parent: event.move_info.target_node.parent });
                        }
                        ;
                    }, stdError);
                }
            }
        });
        self.showLeft = new State({
            showWhenSet: ['#specLeft', '#specCtrl'],
            hideWhenSet: []
        });
        self.showTree = new State({
            showWhenSet: ['#hierarchy','#navBtns'],
            hideWhenSet: ['#details']
        });
        refreshReqCnt = 0;
        return true;
    };
    self.clear = () => {
        self.tree.init();
        refreshReqCnt = 0;
        app.cache.clear();
        app.busy.reset();
    };
    self.hide = () => {
        app.busy.reset();
    };
    self.updateTree = function (opts, spc, pData) {
        if (!pData)
            pData = app.cache.selectedProject.data;
        if (!spc)
            spc = pData.hierarchies;
        let tr;
        if (Array.isArray(spc))
            tr = forAll(spc, toChild);
        else
            tr = [toChild(spc)];
        self.tree.saveState();
        self.tree.set(tr);
        self.tree.numberize();
        self.tree.restoreState();
        return;
        function toChild(iE) {
            let r = itemById(pData.resources, iE.resource);
            var oE = {
                id: iE.id,
                name: elementTitleOf(r, opts, pData),
                ref: iE.resource.id || iE.resource
            };
            oE.children = forAll(iE.nodes, toChild);
            if (iE.revision)
                oE.revision = iE.revision;
            oE.changedAt = iE.changedAt;
            return oE;
        }
    };
    self.show = function (opts) {
        if (!(app.cache.selectedProject && app.cache.selectedProject.data && app.cache.selectedProject.data.id)) {
            throw Error("No selected project on entry of spec.show()");
        }
        ;
        $('#pageTitle').html(app.cache.selectedProject.data.title);
        app.busy.set();
        $('#contentNotice').empty();
        let uP = opts.urlParams, fNd = self.tree.firstNode(), nd;
        self.targetLanguage = opts.targetLanguage = browser.language;
        opts.lookupTitles = true;
        if (!fNd
            || indexById(app.cache.selectedProject.data.resources, fNd.ref) < 0
            || uP && uP[CONFIG.keyProject] && uP[CONFIG.keyProject] != app.cache.selectedProject.data.id)
            self.tree.init();
        if (app.cache.selectedProject.data.hierarchies && app.cache.selectedProject.data.hierarchies.length > 0) {
            app.cache.selectedProject.readContent('hierarchy', app.cache.selectedProject.data.hierarchies, { reload: true })
                .then((rsp) => {
                self.updateTree(opts, rsp);
                if (uP && uP.node) {
                    nd = self.tree.selectNodeById(uP[CONFIG.keyNode]);
                }
                ;
                if (!nd && uP && uP.item) {
                    nd = self.tree.selectNodeByRef(uP[CONFIG.keyItem]);
                }
                ;
                if (!nd)
                    nd = self.tree.selectedNode;
                if (!nd)
                    nd = self.tree.selectFirstNode();
                if (nd) {
                    self.tree.openNode(nd);
                }
                else {
                    if (!self.resCre) {
                        message.show(i18n.MsgNoObjectTypeForManualCreation, { duration: CONFIG.messageDisplayTimeLong });
                        return;
                    }
                    ;
                }
                ;
            }, stdError);
        }
        else {
            $('#contentNotice').html('<div class="notice-danger">' + i18n.MsgNoSpec + '</div>');
            app.busy.reset();
        }
        ;
    };
    var refreshReqCnt = 0;
    self.refresh = (params) => {
        function tryRefresh() {
            if (--refreshReqCnt < 1)
                self.doRefresh(params);
        }
        refreshReqCnt++;
        setTimeout(tryRefresh, CONFIG.noMultipleRefreshWithin);
    };
    self.doRefresh = (parms) => {
        $('#contentNotice').empty();
        self.ViewControl.selected.show(parms);
    };
    self.itemClicked = (rId) => {
        if (['#' + CONFIG.objectRevisions, '#' + CONFIG.comments].indexOf(self.selectedView()) > -1)
            return;
        if (self.tree.selectedNode.ref != rId) {
            self.tree.selectNodeByRef(rId);
            document.getElementById(CONFIG.objectList).scrollTop = 0;
            self.tree.openNode(self.tree.selectedNode);
        }
        else {
            if (self.tree.selectedNode.children.length > 0) {
                self.tree.toggleNode(self.tree.selectedNode);
            }
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
    var myName = self.loadAs, myFullName = 'app.' + myName, pData = self.parent, cacheData, selRes;
    self.resCreClasses = [];
    self.resCre = false;
    self.resCln = false;
    self.resources = new CResourcesToShow();
    function selResIsUserInstantiated() {
        return selRes
            && (!Array.isArray(selRes['class'].instantiation)
                || selRes['class'].instantiation.indexOf('user') > -1);
    }
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
        pData.showLeft.set();
        pData.showTree.set();
        cacheData = app.cache.selectedProject.data;
        if (typeof (opts) != 'object')
            opts = {};
        opts.targetLanguage = browser.language;
        opts.lookupTitles = true;
        app.busy.set();
        if (!pData.tree.selectedNode)
            pData.tree.selectFirstNode();
        var nL;
        getNextResources()
            .then(renderNextResources, (err) => {
            if (err.status == 744) {
                pData.tree.selectFirstNode();
                getNextResources()
                    .then(renderNextResources, handleErr);
            }
            else {
                handleErr(err);
            }
            ;
        });
        return;
        function getNextResources() {
            var nd = pData.tree.selectedNode, oL = [];
            nL = [];
            getPermissions();
            if (nd && !(opts && opts.urlParams))
                setUrlParams({
                    project: cacheData.id,
                    view: self.view.substr(1),
                    node: nd.id,
                    item: nd.ref
                });
            for (var i = 0, I = CONFIG.objToGetCount; i < I && nd; i++) {
                oL.push({ id: nd.ref });
                nL.push(nd);
                nd = nd.getNextNode();
            }
            ;
            return app.cache.selectedProject.readContent('resource', oL);
        }
        function renderNextResources(rL) {
            for (var i = rL.length - 1; i > -1; i--)
                rL[i].order = nL[i].order;
            if (self.resources.update(rL) || opts && opts.forced) {
			//	console.debug('##',self.resources.render());
                $(self.view).html(self.resources.render());
            }
            ;
            selRes = self.resources.selected();
            $('#contentActions').html(actionBtns());
            app.busy.reset();
        }
        function handleErr(err) {
            stdError(err);
            app.busy.reset();
        }
        function actionBtns() {
            var isUserNode = selResIsUserInstantiated(), rB = '<div class="btn-group" >';
            if (self.resCre)
                rB += '<button class="btn btn-success" onclick="' + myFullName + '.editResource(\'create\')" '
                    + 'data-toggle="popover" title="' + i18n.LblAddObject + '" >' + i18n.IcoAdd + '</button>';
            else
                rB += '<button disabled class="btn btn-default" >' + i18n.IcoAdd + '</button>';
            if (!selRes)
                return rB + '</div>';
            if (self.resCre)
                rB += '<button class="btn btn-success" onclick="' + myFullName + '.editResource(\'clone\')" '
                    + 'data-toggle="popover" title="' + i18n.LblCloneObject + '" >' + i18n.IcoClone + '</button>';
            else
                rB += '<button disabled class="btn btn-default" >' + i18n.IcoClone + '</button>';
            if (app.title != i18n.LblReader && (!selRes.permissions || selRes.permissions.upd))
                rB += '<button class="btn btn-default" onclick="' + myFullName + '.editResource(\'update\')" '
                    + 'data-toggle="popover" title="' + i18n.LblUpdateObject + '" >' + i18n.IcoUpdate + '</button>';
            else
                rB += '<button disabled class="btn btn-default" >' + i18n.IcoUpdate + '</button>';
            rB += '<button disabled class="btn btn-default" >' + i18n.IcoComment + '</button>';
            if (app.title != i18n.LblReader && (!selRes.permissions || selRes.permissions.del) && isUserNode)
                rB += '<button class="btn btn-danger" onclick="' + myFullName + '.deleteNode()" '
                    + 'data-toggle="popover" title="' + i18n.LblDeleteObject + '" >' + i18n.IcoDelete + '</button>';
            else
                rB += '<button disabled class="btn btn-default" >' + i18n.IcoDelete + '</button>';
            return rB + '</div>';
        }
        ;
        function getPermissions() {
            if (app.title != i18n.LblReader) {
                self.resCreClasses.length = 0;
                app.cache.selectedProject.data.resourceClasses.forEach((rC) => {
                    if (!rC.instantiation || rC.instantiation.indexOf(Instantiation.User) > -1)
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
        ;
    };
    self.deleteNode = () => {
        new BootstrapDialog({
            title: i18n.MsgConfirm,
            type: BootstrapDialog.TYPE_DANGER,
            message: i18n.lookup('MsgConfirmObjectDeletion', pData.tree.selectedNode.name),
            buttons: [{
                    label: i18n.BtnCancel,
                    action: (thisDlg) => {
                        thisDlg.close();
                    }
                }, {
                    label: i18n.BtnDeleteObjectRef,
                    action: (thisDlg) => {
                        delNd(pData.tree.selectedNode);
                        thisDlg.close();
                    }
                }]
        })
            .open();
        return;
        function delNd(nd) {
            console.info("Deleting tree object '" + nd.name + "'.");
            pData.tree.selectNode(nd.getNextSibling());
            app.cache.selectedProject.deleteContent('node', { id: nd.id })
                .then(() => {
                app.cache.selectedProject.createFolderWithGlossary(cacheData, { addGlossary: true })
                    .then(() => {
                    pData.updateTree({
                        targetLanguage: browser.language,
                        lookupTitles: true
                    });
                    pData.doRefresh({ forced: true });
                }, stdError);
            }, stdError);
        }
    };
    self.relatedItemClicked = (rId) => {
        pData.tree.selectNodeByRef(rId);
        document.getElementById(CONFIG.objectList).scrollTop = 0;
    };
    return self;
});
moduleManager.construct({
    view: '#' + CONFIG.relations
}, (self) => {
    var myName = self.loadAs, myFullName = 'app.' + myName, pData = self.parent, cacheData, selRes, net, modeStaDel = false;
    self.staCreClasses = { subjectClasses: [], objectClasses: [] };
    self.staCre = false;
    self.staDel = false;
    self.init = function () {
        return true;
    };
    self.hide = function () {
        $(self.view).empty();
    };
    self.show = function (opts) {
        pData.showLeft.set();
        pData.showTree.set();
        cacheData = app.cache.selectedProject.data;
        if (typeof (opts) != 'object')
            opts = {};
        opts.targetLanguage = self.targetLanguage = browser.language;
        opts.lookupTitles = self.lookupTitles = true;
        if (!pData.tree.selectedNode)
            pData.tree.selectFirstNode();
        if (!pData.tree.selectedNode) {
            pData.emptyTab(self.view);
            return;
        }
        ;
        app.busy.set();
        var nd = pData.tree.selectedNode;
        if (!opts.urlParams)
            setUrlParams({
                project: cacheData.id,
                view: self.view.substr(1),
                node: nd.id,
                item: nd.ref
            });
        app.cache.selectedProject.readStatementsOf({ id: nd.ref }, { dontCheckStatementVisibility: aDiagramWithoutShowsStatementsForEdges(cacheData) })
            .then((sL) => {
            net = { resources: [{ id: nd.ref }], statements: [] };
            sL.forEach(cacheNet);
            app.cache.selectedProject.readContent('resource', net.resources)
                .then((rResL) => {
                selRes = itemById(rResL, nd.ref);
                getPermissions(selRes);
                rResL.forEach((r) => { cacheMinRes(net.resources, r); });
                getMentionsRels(selRes, opts)
                    .then((stL) => {
                    stL.forEach(cacheNet);
                    renderStatements(net);
                    $('#contentActions').html(linkBtns());
                    app.busy.reset();
                }, handleErr);
            }, handleErr);
        }, handleErr);
        return;
        function handleErr(xhr) {
            stdError(xhr);
            app.busy.reset();
        }
        function cacheMinRes(L, r) {
            cacheE(L, { id: itemIdOf(r), title: elementTitleOf(r, $.extend({}, opts, { addIcon: true }), cacheData) });
        }
        function cacheMinSta(L, s) {
            cacheE(L, { id: s.id, title: staClassTitleOf(s, cacheData, opts), subject: itemIdOf(s.subject), object: itemIdOf(s.object) });
        }
        function cacheNet(s) {
            if (CONFIG.hiddenStatements.indexOf(staClassTitleOf(s, cacheData, opts)) > -1)
                return;
            cacheMinSta(net.statements, s);
            if (itemIdOf(s.subject) == nd.ref) {
                cacheMinRes(net.resources, s.object);
            }
            else {
                cacheMinRes(net.resources, s.subject);
            }
        }
        function getMentionsRels(selR, opts) {
            return new Promise((resolve, reject) => {
                if (!CONFIG.findMentionedObjects || !selR)
                    resolve([]);
                let staL = [], pend = 0, localOpts = $.extend({}, opts, { addIcon: false }), selTi = elementTitleOf(selR, localOpts), refPatt, selPatt = new RegExp((CONFIG.dynLinkBegin + selTi + CONFIG.dynLinkEnd).escapeRE(), "i");
                pData.tree.iterate((nd) => {
                    pend++;
                    app.cache.selectedProject.readContent('resource', { id: nd.ref })
                        .then((rL) => {
                        let refR = rL[0], refTi = elementTitleOf(refR, localOpts);
                        if (refTi && refTi.length > CONFIG.dynLinkMinLength - 1 && refR.id != selR.id) {
                            refPatt = new RegExp((CONFIG.dynLinkBegin + refTi + CONFIG.dynLinkEnd).escapeRE(), "i");
                            if (selR.properties)
                                selR.properties.forEach((p) => {
                                    switch (dataTypeOf(cacheData, p['class']).type) {
                                        case TypeEnum.XsString:
                                        case TypeEnum.XHTML:
                                            if (refPatt.test(p.value) && notListed(staL, selR, refR)) {
                                                staL.push({
                                                    title: CONFIG.staClassMentions,
                                                    subject: selR,
                                                    object: refR
                                                });
                                            }
                                    }
                                });
                            if (refR.properties)
                                refR.properties.forEach((p) => {
                                    switch (dataTypeOf(cacheData, p['class']).type) {
                                        case TypeEnum.XsString:
                                        case TypeEnum.XHTML:
                                            if (selPatt.test(p.value) && notListed(staL, refR, selR)) {
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
                        if (--pend < 1)
                            resolve(staL);
                    }, reject);
                    return true;
                });
            });
            function notListed(L, s, t) {
                for (var i = L.length - 1; i > -1; i--) {
                    if (itemIdOf(L[i].subject) == s.id && itemIdOf(L[i].object) == t.id)
                        return false;
                }
                ;
                return true;
            }
        }
        ;
        function aDiagramWithoutShowsStatementsForEdges(dta) {
            let res, pV, isNotADiagram, noDiagramFound = true;
            return iterateNodes(dta.hierarchies, (nd) => {
                res = itemById(dta.resources, nd.resource);
                pV = valByTitle(res, CONFIG.propClassType, dta);
                isNotADiagram = CONFIG.diagramClasses.indexOf(resClassTitleOf(res, dta)) < 0;
                noDiagramFound = noDiagramFound && isNotADiagram;
                return (isNotADiagram
                    || CONFIG.diagramTypesHavingShowsStatementsForEdges.indexOf(pV) > -1);
            }) || noDiagramFound;
        }
    };
    function linkBtns() {
        if (!selRes)
            return '';
        if (modeStaDel)
            return '<div class="btn-group btn-group-sm" ><button class="btn btn-default" onclick="' + myFullName + '.toggleModeStaDel()" >' + i18n.BtnCancel + '</button></div>';
        var rB = '<div class="btn-group btn-group-sm" >';
        if (app.title != i18n.LblReader && self.staCre)
            rB += '<button class="btn btn-success" onclick="' + myFullName + '.linkResource()" '
                + 'data-toggle="popover" title="' + i18n.LblAddRelation + '" >' + i18n.IcoAdd + '</button>';
        else
            rB += '<button disabled class="btn btn-default" >' + i18n.IcoAdd + '</button>';
        if (app.title != i18n.LblReader && net.statements.length > 0 && (!selRes.permissions || selRes.permissions.del))
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
            app.cache.selectedProject.data.statementClasses.forEach((sC) => {
                if (!sC.instantiation || sC.instantiation.indexOf(Instantiation.User) > -1) {
                    if (!sC.subjectClasses || sC.subjectClasses.indexOf(res['class']) > -1)
                        self.staCreClasses.subjectClasses.push(sC.id);
                    if (!sC.objectClasses || sC.objectClasses.indexOf(res['class']) > -1)
                        self.staCreClasses.objectClasses.push(sC.id);
                }
                ;
            });
            self.staCre = self.staCreClasses.subjectClasses.length > 0 || self.staCreClasses.objectClasses.length > 0;
        }
        ;
    }
    function renderStatements(net) {
        if (net.statements.length < 1) {
            $(self.view).html('<div class="notice-default">' + i18n.MsgNoRelatedObjects + '</div>');
            modeStaDel = false;
            return;
        }
        ;
        if (modeStaDel)
            $('#contentNotice').html('<span class="notice-danger" >' + i18n.MsgClickToDeleteRel + '</span>');
        else
            $('#contentNotice').html('<span class="notice-default" >' + i18n.MsgClickToNavigate + '</span>');
        let graphOptions = {
            index: 0,
            canvas: self.view.substr(1),
            titleProperties: CONFIG.titleProperties,
            onDoubleClick: (evt) => {
                if (evt.target.resource && (typeof (evt.target.resource) == 'string'))
                    app[myName].relatedItemClicked(evt.target.resource, evt.target.statement);
            },
            focusColor: CONFIG.focusColor
        };
        if (modeStaDel)
            graphOptions.nodeColor = '#ef9a9a';
        app.statementsGraph.show(net, graphOptions);
    }
    self.linkResource = function () {
        if (app[CONFIG.resourceLink]) {
            app[CONFIG.resourceLink].show({ eligibleStatementClasses: self.staCreClasses });
        }
        else {
            throw Error("\'linkResource\' clicked, but module '" + CONFIG.resourceLink + "' is not ready.");
        }
        ;
    };
    self.toggleModeStaDel = function () {
        modeStaDel = !modeStaDel;
        $('#contentActions').html(linkBtns());
        renderStatements(net);
    };
    self.relatedItemClicked = function (rId, sId) {
        if (modeStaDel) {
            app.cache.selectedProject.deleteContent('statement', { id: sId })
                .then(pData.doRefresh({ forced: true }), stdError);
        }
        else {
            pData.tree.selectNodeByRef(rId);
            document.getElementById(CONFIG.objectList).scrollTop = 0;
        }
        ;
    };
    return self;
});
