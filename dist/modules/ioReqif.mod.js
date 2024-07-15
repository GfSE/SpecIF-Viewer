"use strict";
/*!	ReqIF import and export
    Dependencies: -
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    Author: se@enso-managers.de, Berlin
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)

    Limitations:
    - It is assumed that all text values within the provided SpecIF data set have only a single language,
      so a "SpecifMultiLanguageText" array has a single entry only.
    - SpecIF v1.1 supports multiple values per property, but ReqIF does not.
      For the time being, only the first value is picked for transformation.
    
    ToDo:
    - escapeXML the content. See toXHTML.ts.
    - transform dataType anyURI to xhtml
    - if a referenced file is not PNG, an alternative PNG and text must be supplied according to the ReqIF schematron.
    - test whether the ReqIF import and export support a roundtrip; neither loss nor growth is acceptable.
*/
moduleManager.construct({
    name: 'ioReqif'
}, (self) => {
    "use strict";
    let mime, zipped, opts, errNoOptions = new resultMsg(896, 'No options or no mediaTypes defined.'), errNoReqifFile = new resultMsg(897, 'No ReqIF file found in the reqifz container.'), errInvalidXML = new resultMsg(898, 'ReqIF data is not valid XML.');
    self.init = (options) => {
        mime = undefined;
        opts = options;
        return true;
    };
    self.abortFlag = false;
    self.verify = (f) => {
        function reqifFile2mediaType(fname) {
            if (fname.endsWith('.reqifz') || fname.endsWith('.reqif.zip')) {
                zipped = true;
                return 'application/zip';
            }
            ;
            if (fname.endsWith('.reqif')) {
                zipped = false;
                return 'application/xml';
            }
            ;
            return;
        }
        mime = reqifFile2mediaType(f.name);
        if (mime)
            return true;
        message.show(i18n.lookup('ErrInvalidFileReqif', f.name));
        return false;
    };
    self.toSpecif = (buf) => {
        let zDO = $.Deferred(), fileL = [], resL = [], pend = 0;
        if (zipped) {
            new JSZip().loadAsync(buf)
                .then((zip) => {
                fileL = zip.filter((relPath, file) => { return file.name.endsWith('.reqif'); });
                if (fileL.length < 1) {
                    zDO.reject(errNoReqifFile);
                    return;
                }
                ;
                pend = fileL.length;
                for (var i = fileL.length - 1; i > -1; i--) {
                    zip.file(fileL[i].name).async("string")
                        .then((dta) => {
                        if (!LIB.validXML(dta)) {
                            zDO.reject(errInvalidXML);
                            return;
                        }
                        ;
                        let result = reqif2Specif(dta);
                        if (result.status != 0) {
                            zDO.reject(result);
                            return;
                        }
                        ;
                        resL.unshift(result.response);
                        if (--pend < 1)
                            if (opts && typeof (opts.mediaTypeOf) == 'function') {
                                fileL = zip.filter((relPath, file) => { return !file.name.endsWith('.reqif'); });
                                if (fileL.length > 0) {
                                    resL[0].files = [];
                                    pend = fileL.length;
                                    fileL.forEach((aFile) => {
                                        if (aFile.dir) {
                                            pend--;
                                            return false;
                                        }
                                        ;
                                        let type = opts.mediaTypeOf(aFile.name);
                                        if (!type) {
                                            pend--;
                                            return false;
                                        }
                                        ;
                                        zip.file(aFile.name).async("blob")
                                            .then((f) => {
                                            resL[0].files.push({
                                                blob: f,
                                                id: 'F-' + simpleHash(aFile.name),
                                                title: aFile.name,
                                                type: type,
                                                changedAt: aFile.date.toISOString()
                                            });
                                            if (--pend < 1)
                                                zDO.resolve(resL);
                                        });
                                    });
                                    if (pend < 1)
                                        zDO.resolve(resL);
                                }
                                else {
                                    zDO.resolve(resL);
                                }
                                ;
                            }
                            else {
                                console.error(errNoOptions.statusText);
                                zDO.resolve(resL);
                            }
                    });
                }
            });
        }
        else {
            let str = LIB.ab2str(buf);
            if (LIB.validXML(str)) {
                var result = reqif2Specif(str);
                if (result.status == 0)
                    zDO.resolve(result.response);
                else
                    zDO.reject(result);
            }
            else {
                zDO.reject(errInvalidXML);
            }
        }
        ;
        return zDO;
    };
    self.fromSpecif = (pr, opts) => {
        if (typeof (opts) != 'object')
            opts = {};
        if (!Array.isArray(opts.hierarchyRoots))
            opts.hierarchyRoots = ['SpecIF:Outline', 'SpecIF:HierarchyRoot', 'SpecIF:Hierarchy', 'SpecIF:BillOfMaterials'];
        const RE_hasDiv = /^<([a-z]{1,6}:)?div>.+<\/([a-z]{1,6}:)?div>$/, RE_class = / class=\"[^\"]+\"/g, RE_objectName = /(<object[^>]*) name=\"[^\"]+\"/g, RE_objectId = /(<object[^>]*) id=\"[^\"]+\"/g, RE_aTarget = /(<a[^>]*) target=\"[^\"]+\"/g, date = new Date().toISOString(), ns = 'xhtml';
        const dTFormattedText = {
            id: "DT-FormattedText",
            title: "XHTML formatted text",
            description: [{ text: "This dataType is beyond SpecIF; it has been added by ioReqif specifically for the SpecIF to ReqIF transformation." }],
            type: "xhtml",
            changedAt: "2020-11-06T08:59:00+02:00"
        };
        function specializeClassToFormattedText(ctg, eC) {
            function withHtml(L, k) {
                for (var l of L) {
                    if (l.properties)
                        for (var prp of l.properties) {
                            if (LIB.equalKey(prp['class'], k) && LIB.isHTML(prp.values[0][0].text))
                                return true;
                        }
                }
                ;
                return false;
            }
            if (eC.propertyClasses) {
                let eL = ctg == 'statementClass' ?
                    pr.statements.filter((sta) => { return LIB.references(sta['class'], eC); })
                    : pr.resources.filter((res) => { return LIB.references(res['class'], eC); }), pC;
                eC.propertyClasses.forEach((pCk) => {
                    pC = LIB.itemByKey(pr.propertyClasses, pCk);
                    if ((LIB.itemByKey(pr.dataTypes, pC.dataType).type == XsDataType.String) && withHtml(eL, pCk)) {
                        console.info("Specializing data type to formatted text for propertyClass with id '" + pC.id + " and title '" + pC.title + "'");
                        pC.dataType = LIB.makeKey(dTFormattedText.id);
                        pC.format = "xhtml";
                        LIB.cacheE(pr.dataTypes, dTFormattedText);
                    }
                });
            }
        }
        pr.resourceClasses.forEach((rC) => { specializeClassToFormattedText('resourceClass', rC); });
        pr.statementClasses.forEach((sC) => { specializeClassToFormattedText('statementClass', sC); });
        var xml = '<?xml version="1.0" encoding="UTF-8"?>'
            + '<REQ-IF xmlns="http://www.omg.org/spec/ReqIF/20110401/reqif.xsd" xmlns:' + ns + '="http://www.w3.org/1999/xhtml">'
            + '<THE-HEADER>'
            + '<REQ-IF-HEADER IDENTIFIER="' + pr.id + '">'
            + '<COMMENT></COMMENT>'
            + '<CREATION-TIME>' + date + '</CREATION-TIME>'
            + '<REQ-IF-TOOL-ID></REQ-IF-TOOL-ID>'
            + '<REQ-IF-VERSION>1.0</REQ-IF-VERSION>'
            + '<SOURCE-TOOL-ID>' + (pr.generator || '') + '</SOURCE-TOOL-ID>'
            + '<TITLE>' + pr.title + '</TITLE>'
            + '</REQ-IF-HEADER>'
            + '</THE-HEADER>'
            + '<CORE-CONTENT>'
            + '<REQ-IF-CONTENT>'
            + '<DATATYPES>';
        if (pr.dataTypes)
            pr.dataTypes.forEach((dT) => {
                if (dT.enumeration) {
                    xml += '<DATATYPE-DEFINITION-ENUMERATION ' + commonAttsOf(dT) + '>' +
                        '<SPECIFIED-VALUES>';
                    dT.enumeration.forEach((val, i) => {
                        xml += '<ENUM-VALUE IDENTIFIER="' + val.id + '" LONG-NAME="' + (Array.isArray(val.value) ? val.value[0].text : val.value) + '" LAST-CHANGE="' + dateTime(dT) + '" >' +
                            '<PROPERTIES><EMBEDDED-VALUE KEY="' + i + '" OTHER-CONTENT="" /></PROPERTIES>' +
                            '</ENUM-VALUE>';
                    });
                    xml += '</SPECIFIED-VALUES>' +
                        '</DATATYPE-DEFINITION-ENUMERATION>';
                    return;
                }
                ;
                switch (dT.type) {
                    case XsDataType.Boolean:
                        xml += '<DATATYPE-DEFINITION-BOOLEAN ' + commonAttsOf(dT) + '/>';
                        break;
                    case XsDataType.Integer:
                        xml += '<DATATYPE-DEFINITION-INTEGER ' + commonAttsOf(dT)
                            + ' MAX="' + (typeof (dT.maxInclusive) == 'number' ? dT.maxInclusive : CONFIG.maxInteger)
                            + '" MIN="' + (typeof (dT.minInclusive) == 'number' ? dT.minInclusive : CONFIG.minInteger)
                            + '" />';
                        break;
                    case XsDataType.Double:
                        xml += '<DATATYPE-DEFINITION-REAL ' + commonAttsOf(dT)
                            + ' MAX="' + (typeof (dT.maxInclusive) == 'number' ? dT.maxInclusive : CONFIG.maxReal)
                            + '" MIN="' + (typeof (dT.minInclusive) == 'number' ? dT.minInclusive : CONFIG.minReal)
                            + '" ACCURACY="' + (typeof (dT.fractionDigits) == 'number' ? dT.fractionDigits : CONFIG.maxAccuracy)
                            + '" />';
                        break;
                    case XsDataType.DateTime:
                        xml += '<DATATYPE-DEFINITION-DATE ' + commonAttsOf(dT) + '/>';
                        break;
                    case XsDataType.AnyURI:
                    case XsDataType.Duration:
                        let info = JSON.stringify({ SpecIF_DataType: dT.type });
                        if (LIB.isMultiLanguageValue(dT.description) && dT.description.length > 0)
                            dT.description[0].text += '\n' + info;
                        else
                            dT.description = LIB.makeMultiLanguageValue(info);
                    case XsDataType.String:
                        xml += '<DATATYPE-DEFINITION-STRING ' + commonAttsOf(dT) + ' MAX-LENGTH="' + (dT.maxLength || CONFIG.maxStringLength) + '" />';
                        break;
                    case 'xhtml':
                        xml += '<DATATYPE-DEFINITION-XHTML ' + commonAttsOf(dT) + '/>';
                        break;
                    default:
                        console.error('Error: unknown dataType: ' + dT.type);
                }
            });
        xml += '</DATATYPES>'
            + '<SPEC-TYPES>';
        class separatedHierarchyClasses {
            constructor() {
                this.objTypes = [];
                this.spcTypes = [];
                this.objects = [];
            }
        }
        ;
        let separatedHC = new separatedHierarchyClasses;
        function prepObj(n) {
            let r = LIB.itemByKey(pr.resources, n.resource), rC = LIB.itemByKey(pr.resourceClasses, r['class']);
            if (LIB.indexById(separatedHC.objTypes, rC.id) < 0) {
                if (rC['extends']) {
                    let anc = LIB.itemByKey(pr.resourceClasses, rC['extends']);
                    if (Array.isArray(anc.propertyClasses)) {
                        if (Array.isArray(rC.propertyClasses))
                            rC.propertyClasses = anc.propertyClasses.concat(rC.propertyClasses);
                        else
                            rC.propertyClasses = anc.propertyClasses;
                    }
                    ;
                }
                ;
                separatedHC.objTypes.push(rC);
            }
            ;
            if (LIB.indexById(separatedHC.objects, r.id) < 0)
                separatedHC.objects.push(r);
        }
        pr.hierarchies.forEach((h) => {
            if (h.nodes)
                h.nodes.forEach((n) => {
                    iterate(n, prepObj);
                });
        });
        pr.hierarchies.forEach((h) => {
            let hR = LIB.itemByKey(pr.resources, h.resource), hC = LIB.itemByKey(pr.resourceClasses, hR['class']);
            if (LIB.referenceIndexBy(separatedHC.objects, 'class', hC) > -1) {
                hC = simpleClone(hC);
                hC.id = LIB.replacePrefix(CONFIG.prefixHC, hC.id);
            }
            ;
            if (LIB.indexById(separatedHC.spcTypes, hC.id) < 0)
                separatedHC.spcTypes.push(hC);
            h.id = hR.id;
            h['class'] = LIB.keyOf(hC);
            if (hR.properties)
                h.properties = hR.properties;
        });
        separatedHC.objTypes.forEach((oT) => {
            xml += '<SPEC-OBJECT-TYPE ' + commonAttsOf(oT) + '>'
                + attrTypesOf(oT)
                + '</SPEC-OBJECT-TYPE>';
        });
        if (pr.statementClasses)
            pr.statementClasses.forEach((sC) => {
                xml += '<SPEC-RELATION-TYPE ' + commonAttsOf(sC) + '>'
                    + attrTypesOf(sC)
                    + '</SPEC-RELATION-TYPE>';
            });
        separatedHC.spcTypes.forEach((hC) => {
            xml += '<SPECIFICATION-TYPE ' + commonAttsOf(hC) + '>'
                + attrTypesOf(hC)
                + '</SPECIFICATION-TYPE>';
        });
        xml += '</SPEC-TYPES>'
            + '<SPEC-OBJECTS>';
        separatedHC.objects.forEach((r) => {
            xml += '<SPEC-OBJECT ' + commonAttsOf(r) + '>'
                + '<TYPE><SPEC-OBJECT-TYPE-REF>' + r['class'].id + '</SPEC-OBJECT-TYPE-REF></TYPE>'
                + attsOf(r)
                + '</SPEC-OBJECT>';
        });
        xml += '</SPEC-OBJECTS>'
            + '<SPEC-RELATIONS>';
        pr.statements.forEach((s) => {
            if (LIB.indexByKey(pr.resources, s.object) > -1 && LIB.indexByKey(pr.resources, s.subject) > -1) {
                s.title = LIB.itemByKey(pr.statementClasses, s['class']).title;
                xml += '<SPEC-RELATION ' + commonAttsOf(s) + '>'
                    + '<TYPE><SPEC-RELATION-TYPE-REF>' + s['class'].id + '</SPEC-RELATION-TYPE-REF></TYPE>'
                    + attsOf(s)
                    + '<SOURCE><SPEC-OBJECT-REF>' + s.subject.id + '</SPEC-OBJECT-REF></SOURCE>'
                    + '<TARGET><SPEC-OBJECT-REF>' + s.object.id + '</SPEC-OBJECT-REF></TARGET>'
                    + '</SPEC-RELATION>';
            }
            ;
        });
        xml += '</SPEC-RELATIONS>'
            + '<SPECIFICATIONS>';
        pr.hierarchies.forEach((h) => {
            xml += '<SPECIFICATION ' + commonAttsOf(h) + '>'
                + '<TYPE><SPECIFICATION-TYPE-REF>' + h['class'].id + '</SPECIFICATION-TYPE-REF></TYPE>'
                + attsOf(h)
                + childrenOf(h)
                + '</SPECIFICATION>';
        });
        xml += '</SPECIFICATIONS>'
            + '<SPEC-RELATION-GROUPS></SPEC-RELATION-GROUPS>'
            + '</REQ-IF-CONTENT>'
            + '</CORE-CONTENT>'
            + '<TOOL-EXTENSIONS></TOOL-EXTENSIONS>'
            + '</REQ-IF>';
        return xml;
        function dateTime(e) {
            return e.changedAt || pr.createdAt || date;
        }
        function commonAttsOf(e) {
            return 'IDENTIFIER="' + e.id + (e.title ? '" LONG-NAME="' + e.title.stripHTML().escapeXML() : '') + (e.description && e.description[0] && e.description[0].text ? '" DESC="' + e.description[0].text.stripHTML().escapeXML() : '') + '" LAST-CHANGE="' + dateTime(e) + '"';
        }
        function attrTypesOf(eC) {
            if (!eC.propertyClasses || eC.propertyClasses.length < 1)
                return '<SPEC-ATTRIBUTES></SPEC-ATTRIBUTES>';
            var xml = '<SPEC-ATTRIBUTES>';
            eC.propertyClasses.forEach((pCk) => {
                let pC = LIB.itemByKey(pr.propertyClasses, pCk), dT = LIB.itemByKey(pr.dataTypes, pC.dataType), adId = simpleHash(eC.id + pC.id);
                if (dT.enumeration) {
                    xml += '<ATTRIBUTE-DEFINITION-ENUMERATION IDENTIFIER="PC-' + adId + '" LONG-NAME="' + pC.title + '" MULTI-VALUED="' + multipleChoice(pC, pr) + '" LAST-CHANGE="' + dateTime(pC) + '">'
                        + '<TYPE><DATATYPE-DEFINITION-ENUMERATION-REF>' + dT.id + '</DATATYPE-DEFINITION-ENUMERATION-REF></TYPE>'
                        + '</ATTRIBUTE-DEFINITION-ENUMERATION>';
                }
                else {
                    switch (dT.type) {
                        case XsDataType.Boolean:
                            xml += '<ATTRIBUTE-DEFINITION-BOOLEAN IDENTIFIER="PC-' + adId + '" LONG-NAME="' + pC.title + '" LAST-CHANGE="' + dateTime(pC) + '">'
                                + '<TYPE><DATATYPE-DEFINITION-BOOLEAN-REF>' + dT.id + '</DATATYPE-DEFINITION-BOOLEAN-REF></TYPE>'
                                + '</ATTRIBUTE-DEFINITION-BOOLEAN>';
                            break;
                        case XsDataType.Integer:
                            xml += '<ATTRIBUTE-DEFINITION-INTEGER IDENTIFIER="PC-' + adId + '" LONG-NAME="' + pC.title + '" LAST-CHANGE="' + dateTime(pC) + '">'
                                + '<TYPE><DATATYPE-DEFINITION-INTEGER-REF>' + dT.id + '</DATATYPE-DEFINITION-INTEGER-REF></TYPE>'
                                + '</ATTRIBUTE-DEFINITION-INTEGER>';
                            break;
                        case XsDataType.Double:
                            xml += '<ATTRIBUTE-DEFINITION-REAL IDENTIFIER="PC-' + adId + '" LONG-NAME="' + pC.title + '" LAST-CHANGE="' + dateTime(pC) + '">'
                                + '<TYPE><DATATYPE-DEFINITION-REAL-REF>' + dT.id + '</DATATYPE-DEFINITION-REAL-REF></TYPE>'
                                + '</ATTRIBUTE-DEFINITION-REAL>';
                            break;
                        case XsDataType.String:
                            xml += '<ATTRIBUTE-DEFINITION-STRING IDENTIFIER="PC-' + adId + '" LONG-NAME="' + pC.title + '" LAST-CHANGE="' + dateTime(pC) + '">'
                                + '<TYPE><DATATYPE-DEFINITION-STRING-REF>' + dT.id + '</DATATYPE-DEFINITION-STRING-REF></TYPE>'
                                + '</ATTRIBUTE-DEFINITION-STRING>';
                            break;
                        case 'xhtml':
                            xml += '<ATTRIBUTE-DEFINITION-XHTML IDENTIFIER="PC-' + adId + '" LONG-NAME="' + pC.title + '" LAST-CHANGE="' + dateTime(pC) + '">'
                                + '<TYPE><DATATYPE-DEFINITION-XHTML-REF>' + dT.id + '</DATATYPE-DEFINITION-XHTML-REF></TYPE>'
                                + '</ATTRIBUTE-DEFINITION-XHTML>';
                            break;
                        case XsDataType.DateTime:
                            xml += '<ATTRIBUTE-DEFINITION-DATE IDENTIFIER="PC-' + adId + '" LONG-NAME="' + pC.title + '" LAST-CHANGE="' + dateTime(pC) + '">'
                                + '<TYPE><DATATYPE-DEFINITION-DATE-REF>' + dT.id + '</DATATYPE-DEFINITION-DATE-REF></TYPE>'
                                + '</ATTRIBUTE-DEFINITION-DATE>';
                            break;
                    }
                }
            });
            return xml + '</SPEC-ATTRIBUTES>';
        }
        function attsOf(me) {
            if (!me || !me.properties || me.properties.length < 1)
                return '<VALUES></VALUES>';
            var xml = '<VALUES>';
            me.properties.forEach((prp) => {
                let pC = LIB.itemByKey(pr.propertyClasses, prp['class']), dT = LIB.itemByKey(pr.dataTypes, pC.dataType), adId = simpleHash(me['class'].id + prp['class'].id);
                if (dT.enumeration) {
                    xml += '<ATTRIBUTE-VALUE-ENUMERATION>'
                        + '<DEFINITION><ATTRIBUTE-DEFINITION-ENUMERATION-REF>PC-' + adId + '</ATTRIBUTE-DEFINITION-ENUMERATION-REF></DEFINITION>'
                        + '<VALUES>';
                    prp.values.forEach((v) => {
                        xml += '<ENUM-VALUE-REF>' + v + '</ENUM-VALUE-REF>';
                    });
                    xml += '</VALUES>'
                        + '</ATTRIBUTE-VALUE-ENUMERATION>';
                }
                else {
                    switch (dT.type) {
                        case XsDataType.Boolean:
                            xml += '<ATTRIBUTE-VALUE-BOOLEAN THE-VALUE="' + prp.values[0] + '">'
                                + '<DEFINITION><ATTRIBUTE-DEFINITION-BOOLEAN-REF>PC-' + adId + '</ATTRIBUTE-DEFINITION-BOOLEAN-REF></DEFINITION>'
                                + '</ATTRIBUTE-VALUE-BOOLEAN>';
                            break;
                        case XsDataType.Integer:
                            xml += '<ATTRIBUTE-VALUE-INTEGER THE-VALUE="' + prp.values[0] + '">'
                                + '<DEFINITION><ATTRIBUTE-DEFINITION-INTEGER-REF>PC-' + adId + '</ATTRIBUTE-DEFINITION-INTEGER-REF></DEFINITION>'
                                + '</ATTRIBUTE-VALUE-INTEGER>';
                            break;
                        case XsDataType.Double:
                            xml += '<ATTRIBUTE-VALUE-REAL THE-VALUE="' + prp.values[0] + '">'
                                + '<DEFINITION><ATTRIBUTE-DEFINITION-REAL-REF>PC-' + adId + '</ATTRIBUTE-DEFINITION-REAL-REF></DEFINITION>'
                                + '</ATTRIBUTE-VALUE-REAL>';
                            break;
                        case XsDataType.String:
                            xml += '<ATTRIBUTE-VALUE-STRING THE-VALUE="' + prp.values[0][0].text.stripHTML().escapeXML() + '">'
                                + '<DEFINITION><ATTRIBUTE-DEFINITION-STRING-REF>PC-' + adId + '</ATTRIBUTE-DEFINITION-STRING-REF></DEFINITION>'
                                + '</ATTRIBUTE-VALUE-STRING>';
                            break;
                        case 'xhtml':
                            let hasDiv = RE_hasDiv.test(prp.values[0][0].text), txt = LIB.escapeInnerHtml(prp.values[0][0].text)
                                .replace(RE_class, () => {
                                return '';
                            })
                                .replace(RE_aTarget, ($0, $1) => {
                                return $1;
                            })
                                .replace(RE_objectId, ($0, $1) => {
                                return $1;
                            })
                                .replace(RE_objectName, ($0, $1) => {
                                return $1;
                            })
                                .replace(RE.tag, ($0, $1, $2) => {
                                return $1 + ns + ':' + $2;
                            });
                            xml += '<ATTRIBUTE-VALUE-XHTML>'
                                + '<DEFINITION><ATTRIBUTE-DEFINITION-XHTML-REF>PC-' + adId + '</ATTRIBUTE-DEFINITION-XHTML-REF></DEFINITION>'
                                + '<THE-VALUE>' + (hasDiv ? '' : '<' + ns + ':div>') + txt + (hasDiv ? '' : '</' + ns + ':div>') + '</THE-VALUE>'
                                + '</ATTRIBUTE-VALUE-XHTML>';
                            break;
                        case XsDataType.DateTime:
                            xml += '<ATTRIBUTE-VALUE-DATE THE-VALUE="' + prp.values[0] + '">'
                                + '<DEFINITION><ATTRIBUTE-DEFINITION-DATE-REF>PC-' + adId + '</ATTRIBUTE-DEFINITION-DATE-REF></DEFINITION>'
                                + '</ATTRIBUTE-VALUE-DATE>';
                            break;
                    }
                }
            });
            return xml + '</VALUES>';
        }
        function childrenOf(el) {
            if (!el.nodes || el.nodes.length < 1)
                return '';
            var xml = '<CHILDREN>';
            el.nodes.forEach((ch) => {
                xml += '<SPEC-HIERARCHY IDENTIFIER="' + (ch.id || CONFIG.prefixN + ch.resource) + (ch.title ? '" LONG-NAME="' + ch.title : '') + '" LAST-CHANGE="' + (ch.changedAt || el.changedAt) + '">'
                    + '<OBJECT><SPEC-OBJECT-REF>' + ch.resource.id + '</SPEC-OBJECT-REF></OBJECT>'
                    + childrenOf(ch)
                    + '</SPEC-HIERARCHY>';
            });
            return xml + '</CHILDREN>';
        }
        function iterate(tree, fn) {
            fn(tree);
            if (tree.nodes)
                tree.nodes.forEach((n) => {
                    iterate(n, fn);
                });
        }
        function multipleChoice(pC, prj) {
            return (typeof (pC.multiple) == 'boolean' ? pC.multiple : !!LIB.itemByKey(prj.dataTypes, pC.dataType).multiple);
        }
    };
    self.abort = () => {
        self.abortFlag = true;
    };
    return self;
});
