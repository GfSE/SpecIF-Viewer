"use strict";
/*!	Transform SysML XMI to SpecIF
    - Parse the XMI file
    - Extract both model-elements and semantic relations in SpecIF Format
    - Model elements with same type and title are NOT consolidated by this transformation
    
    (C)copyright enso managers gmbh (http://www.enso-managers.de)
    Author: se@enso-managers.de
    License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de

    References:
    [1] S.Friedenthal et al: A Practical Guide to SysML, The MK/OMG Press, Third Edition
*/
function sysml2specif(xmi, options) {
    "use strict";
    const idResourceClassDiagram = app.ontology.getClassId("resourceClass", "SpecIF:View"), idResourceClassState = app.ontology.getClassId("resourceClass", "FMC:State"), idResourceClassPackage = app.ontology.getClassId("resourceClass", "uml:Package"), idResourceClassDefault = app.ontology.getClassId("resourceClass", "SpecIF:ModelElement"), idStatementClassContains = app.ontology.getClassId("statementClass", "SpecIF:contains"), idStatementClassHasPart = app.ontology.getClassId("statementClass", "dcterms:hasPart"), idStatementClassComprises = app.ontology.getClassId("statementClass", "uml:Composition"), idStatementClassAggregates = app.ontology.getClassId("statementClass", "uml:Aggregation"), idStatementClassSpecializes = app.ontology.getClassId("statementClass", "uml:Specialization"), idStatementClassRealizes = app.ontology.getClassId("statementClass", "uml:Realization"), idStatementClassServes = app.ontology.getClassId("statementClass", "SpecIF:serves"), idStatementClassAssociatedWith = app.ontology.getClassId("statementClass", "uml:Association"), idStatementClassCommunicatesWith = app.ontology.getClassId("statementClass", "FMC:communicatesWith"), idStatementClassHandles = app.ontology.getClassId("statementClass", "SpecIF:handles"), idStatementClassProvides = app.ontology.getClassId("statementClass", "SpecIF:provides"), idStatementClassConsumes = app.ontology.getClassId("statementClass", "SpecIF:consumes"), idStatementClassShows = app.ontology.getClassId("statementClass", "SpecIF:shows"), idStatementClassDefault = app.ontology.getClassId("statementClass", "SpecIF:relates");
    if (typeof (options) != 'object' || !options.fileName)
        throw Error("Programming Error: Cameo import gets no parameter options");
    let opts = Object.assign({
        mimeType: "application/vnd.xmi+xml",
        fileDate: new Date().toISOString()
    }, options);
    var parser = new DOMParser(), xmiDoc = parser.parseFromString(xmi, "text/xml");
    if (validateCameo(xmiDoc))
        return new resultMsg(0, '', 'object', cameo2specif(xmiDoc, opts));
    return new resultMsg(899, 'Cameo Import: Input file is not supported');
    function cameo2specif(xmi, opts) {
        function makeMap(att) {
            let top = xmi.getElementsByTagName('xmi:XMI')[0], map = new Map();
            Array.from(top.children, (ch) => {
                let base = ch.getAttribute(att);
                if (base) {
                    if (att == "base_Property")
                        map.set(base, { tag: ch.tagName, dir: ch.getAttribute("direction") });
                    else
                        map.set(base, ch.tagName);
                }
                ;
            });
            return map;
        }
        let classStereotypes = makeMap("base_Class"), abstractionStereotypes = makeMap("base_Abstraction"), propertyStereotypes = makeMap("base_Property"), flowProperties = new Map(), models = xmi.getElementsByTagName('uml:Model'), packgs = xmi.getElementsByTagName('uml:Package'), modDoc = models.length > 0 ? models[0] : packgs[0], spD = app.ontology.generateSpecifClasses({ domains: ["SpecIF:DomainBase", "SpecIF:DomainSystemModelIntegration"] }), usedElements = [], specializations = [], associationEnds = [], abstractions = [], portL = [], connectors = [];
        spD.id = modDoc.getAttribute("xmi:id");
        spD.title = [{ text: modDoc.getAttribute("name") }];
        parseElements(modDoc, { package: '', nodes: spD.hierarchies });
        specializations = specializations
            .filter(validateStatement);
        spD.resources
            .forEach((me) => {
            if (me["class"].id == idResourceClassDefault) {
                let sTy = classStereotypes.get(me.id);
                if (sTy) {
                    if (sTy == "sysml:InterfaceBlock") {
                        me["class"] = LIB.makeKey(idResourceClassState);
                        console.info("Cameo Import: Reassigning class '" + idResourceClassState + "' to  model-element " + me.id + " with title " + LIB.valueByTitle(me, CONFIG.propClassTitle, spD));
                    }
                    ;
                    let prp = LIB.propByTitle(me, CONFIG.propClassType, spD);
                    if (prp) {
                        prp.values = [[{ text: sTy }]];
                        console.info("Cameo Import: Assigning stereotype '" + sTy + "' to  model-element " + me.id + " with title " + LIB.valueByTitle(me, CONFIG.propClassTitle, spD));
                    }
                    ;
                }
                ;
                let rC = generalizingResourceClassOf(me);
                if (rC && rC.id != idResourceClassDefault) {
                    me["class"] = LIB.makeKey(rC.id);
                    console.info("Cameo Import: Re-assigning class " + rC.id + " to model-element " + me.id + " with title " + LIB.valueByTitle(me, CONFIG.propClassTitle, spD));
                    return;
                }
                ;
            }
            ;
            return;
            function generalizingResourceClassOf(r) {
                let spL = specializations.filter((sp) => {
                    return sp.subject.id == r.id;
                });
                if (spL.length > 1)
                    console.warn("Cameo Import: Model-elment with id " + me.id + " specializes " + spL.length + " classes");
                for (var sp of spL) {
                    let gE = LIB.itemByKey(spD.resources, sp.object), ti = LIB.titleFromProperties(gE.properties, spD.propertyClasses, { targetLanguage: "default" }), rC = LIB.itemByTitle(spD.resourceClasses, ti);
                    if (rC)
                        return rC;
                    rC = generalizingResourceClassOf(gE);
                    if (rC)
                        return rC;
                }
                ;
            }
        });
        abstractions = abstractions
            .filter(validateStatement)
            .map((a) => {
            let sTy = abstractionStereotypes.get(a.id);
            if (sTy) {
                let sC = LIB.itemByTitle(spD.statementClasses, sTy);
                if (sC) {
                    a['class'] = LIB.makeKey(sC.id);
                    console.info("Cameo Import: Re-assigning class " + sC.id + " with title " + sTy + " to statement " + a.id);
                }
                else {
                    let prp = {
                        class: LIB.makeKey("PC-Type"),
                        values: [[{ text: sTy }]]
                    };
                    LIB.addProperty(a, prp);
                    console.info("Cameo Import: Assigning stereotype " + sTy + " to statement " + a.id);
                }
                ;
            }
            ;
            return a;
        });
        portL.forEach((p) => {
            let ibId = p.interfaceBlock, dir = flowProperties.get(ibId), acc;
            switch (dir) {
                case 'in':
                    p.resource.properties.push({
                        class: "PC-UmlFlowdirection",
                        values: [[{ text: p.isConjugated ? 'out' : 'in' }]]
                    });
                    acc = p.isConjugated ? idStatementClassProvides : idStatementClassConsumes;
                    spD.statements.push({
                        id: CONFIG.prefixS + simpleHash(p.resource.id + acc + ibId),
                        class: LIB.makeKey(acc),
                        subject: LIB.makeKey(p.resource),
                        object: LIB.makeKey(ibId),
                        changedAt: opts.fileDate
                    });
                    break;
                case 'out':
                    p.resource.properties.push({
                        class: "PC-UmlFlowdirection",
                        values: [[{ text: p.isConjugated ? 'in' : 'out' }]]
                    });
                    acc = p.isConjugated ? idStatementClassConsumes : idStatementClassProvides;
                    spD.statements.push({
                        id: CONFIG.prefixS + simpleHash(p.resource.id + acc + ibId),
                        class: LIB.makeKey(acc),
                        subject: LIB.makeKey(p.resource),
                        object: LIB.makeKey(ibId),
                        changedAt: opts.fileDate
                    });
                    break;
                case 'inout':
                    p.resource.properties.push({
                        class: "PC-UmlFlowdirection",
                        values: [[{ text: 'inout' }]]
                    });
                    spD.statements.push({
                        id: CONFIG.prefixS + simpleHash(p.resource.id + idStatementClassHandles + ibId),
                        class: LIB.makeKey(idStatementClassHandles),
                        subject: LIB.makeKey(p.resource),
                        object: LIB.makeKey(ibId),
                        changedAt: opts.fileDate
                    });
            }
            ;
        });
        connectors.forEach((co) => {
            let port0 = LIB.itemById(portL, co.ends[0]), port1 = LIB.itemById(portL, co.ends[1]), p0serves = LIB.valueByTitle(port0.resource, 'uml:is_Service', spD) == 'true', p1serves = LIB.valueByTitle(port1.resource, 'uml:is_Service', spD) == 'true';
            console.debug('connector', co, port0, port1, p0serves, p1serves);
            if (p0serves && !p1serves) {
                spD.statements.push({
                    id: co.id,
                    class: LIB.makeKey(idStatementClassServes),
                    subject: LIB.makeKey(port0.id),
                    object: LIB.makeKey(port1.id),
                    changedAt: opts.fileDate
                });
                return;
            }
            ;
            if (!p0serves && p1serves) {
                spD.statements.push({
                    id: co.id,
                    class: LIB.makeKey(idStatementClassServes),
                    subject: LIB.makeKey(port1.id),
                    object: LIB.makeKey(port0.id),
                    changedAt: opts.fileDate
                });
                return;
            }
            ;
            spD.statements.forEach((st) => {
                if (st['class'].id == idStatementClassComprises) {
                    console.debug('comprises',st,port0.parent,port1.parent);
					if (st.subject.id == port0.parent.id && st.object.id == port1.parent.id) {
                        spD.statements.push({
                            id: co.id,
                            class: LIB.makeKey(idStatementClassServes),
                            subject: LIB.makeKey(p0serves && p1serves ? port1.id : port0.id),
                            object: LIB.makeKey(p0serves && p1serves ? port0.id : port1.id),
                            changedAt: opts.fileDate
                        });
                        return;
                    }
                    ;
                    if (st.subject.id == port1.parent.id && st.object.id == port0.parent.id) {
                        spD.statements.push({
                            id: co.id,
                            class: LIB.makeKey(idStatementClassServes),
                            subject: LIB.makeKey(p0serves && p1serves ? port0.id : port1.id),
                            object: LIB.makeKey(p0serves && p1serves ? port1.id : port0.id),
                            changedAt: opts.fileDate
                        });
                        return;
                    }
                    ;
                }
                ;
            });
        });
        spD.statements = spD.statements
            .concat(abstractions)
            .concat(specializations)
            .concat(usedElements);
        let prevLength;
        do {
            prevLength = spD.statements.length;
            spD.statements = spD.statements
                .filter(validateStatement);
        } while (prevLength > spD.statements.length);
        console.debug('SysML', spD, opts);
        return spD;
        function parseElements(parent, params) {
            Array.from(parent.children, (ch) => {
                let r, nd;
                switch (ch.tagName) {
                    case "packagedElement":
                        switch (ch.getAttribute("xmi:type")) {
                            case "uml:DataType":
                                r = makeResource(ch);
                                r["class"] = LIB.makeKey(idResourceClassDefault);
                                spD.resources.push(r);
                                nd = makeNode(r, params.package);
                                params.nodes.push(nd);
                        }
                        ;
                }
                ;
            });
            Array.from(parent.children, (ch) => {
                let r, nd;
                switch (ch.tagName) {
                    case "xmi:Extension":
                        makeDiagrams(ch, params);
                        break;
                    case "packagedElement":
                        switch (ch.getAttribute("xmi:type")) {
                            case 'uml:Package':
                                r = makeResource(ch);
                                r["class"] = LIB.makeKey(idResourceClassPackage);
                                spD.resources.push(r);
                                nd = makeNode(r, params.package);
                                params.nodes.push(nd);
                                parseElements(ch, { package: r.id, nodes: nd.nodes });
                                break;
                            case 'uml:Class':
                                parseClass(ch, params);
                                break;
                            case "uml:DataType":
                                break;
                            case "uml:Association":
                            case "uml:Abstraction":
                            case "uml:Realization":
                                break;
                            case "uml:Profile":
                                break;
                            case "uml:ProfileApplication":
                            case "uml:Usage":
                                break;
                        }
                        ;
                }
                ;
            });
            Array.from(parent.children, (ch) => {
                switch (ch.tagName) {
                    case "xmi:Extension":
                        break;
                    case "packagedElement":
                        let ty = ch.getAttribute("xmi:type");
                        switch (ty) {
                            case 'uml:Package':
                            case 'uml:Class':
                            case "uml:DataType":
                                break;
                            case "uml:Association":
                                parseAssociation(ch);
                                break;
                            case "uml:Abstraction":
                                let sbj = ch.getElementsByTagName('client')[0].getAttribute("xmi:idref"), obj = ch.getElementsByTagName('supplier')[0].getAttribute("xmi:idref");
                                abstractions.push({
                                    id: ch.getAttribute("xmi:id"),
                                    class: LIB.makeKey(idStatementClassDefault),
                                    subject: LIB.makeKey(sbj),
                                    object: LIB.makeKey(obj),
                                    changedAt: opts.fileDate
                                });
                                break;
                            case "uml:Realization":
                                let sbjR = ch.getElementsByTagName('client')[0].getAttribute("xmi:idref"), objR = ch.getElementsByTagName('supplier')[0].getAttribute("xmi:idref"), staR = {
                                    id: ch.getAttribute("xmi:id"),
                                    class: LIB.makeKey(idStatementClassRealizes || idStatementClassAssociatedWith),
                                    subject: LIB.makeKey(sbjR),
                                    object: LIB.makeKey(objR),
                                    changedAt: opts.fileDate
                                };
                                spD.statements.push(staR);
                                break;
                            case "uml:Profile":
                                break;
                            case "uml:ProfileApplication":
                            case "uml:Usage":
                                break;
                            default:
                                console.info("Cameo Import: Skipping the packagedElement", ch, "with name", ch.getAttribute("name"), "and type", ty, ".");
                        }
                        ;
                }
                ;
            });
            function parseClass(ch, params) {
                let r2 = makeResource(ch), rC = LIB.itemByTitle(spD.resourceClasses, ch.getAttribute("name"));
                if (rC) {
                    r2["class"] = LIB.makeKey(rC.id);
                    console.info("Cameo Import: Assigning class " + rC.id + " to model-element " + r2.id + " with title " + r2.properties[0].values[0][0].text);
                }
                else {
                    r2["class"] = LIB.makeKey(idResourceClassDefault);
                }
                ;
                spD.resources.push(r2);
                let nd2 = makeNode(r2, params.package), nextLevel = { package: params.package, nodes: nd2.nodes };
                params.nodes.push(nd2);
                if (params.package)
                    spD.statements.push({
                        id: CONFIG.prefixS + simpleHash(params.package + idStatementClassContains + r2.id),
                        class: LIB.makeKey(idStatementClassContains),
                        subject: LIB.makeKey(params.package),
                        object: LIB.makeKey(r2.id),
                        changedAt: opts.fileDate
                    });
                Array.from(ch.children, (ch2) => {
                    switch (ch2.tagName) {
                        case "xmi:Extension":
                            makeDiagrams(ch2, nextLevel);
                            break;
                        case 'generalization':
                            specializations.push({
                                id: ch2.getAttribute("xmi:id"),
                                class: LIB.makeKey(idStatementClassSpecializes),
                                subject: LIB.makeKey(r2.id),
                                object: LIB.makeKey(ch2.getAttribute("general")),
                                changedAt: opts.fileDate
                            });
                            break;
                        case 'ownedAttribute':
                            parseOwnedAttribute(ch2, { parent: r2 });
                            break;
                        case 'ownedConnector':
                            let cId = ch2.getAttribute("xmi:id"), ports = Array.from(ch2.getElementsByTagName("end"), (ch3) => {
                                return ch3.getAttribute("role");
                            });
                            if (ports.length < 2) {
                                console.error("uml:Connector " + cId + " has too few ends");
                                return;
                            }
                            ;
                            if (ports.length > 2) {
                                console.error("uml:Connector " + cId + " has too many ends");
                                return;
                            }
                            ;
                            connectors.push({ id: cId, ends: [ports[0], ports[1]] });
                            break;
                        case 'nestedClassifier':
                            parseClass(ch2, nextLevel);
                    }
                });
                function parseOwnedAttribute(oA, params) {
                    let pId, ac, ty, ag, ti, nm, cl;
                    switch (oA.getAttribute("xmi:type")) {
                        case "uml:Property":
                            pId = oA.getAttribute("xmi:id");
                            ac = oA.getAttribute("association");
                            ty = oA.getAttribute("type");
                            ag = oA.getAttribute("aggregation");
                            if (ac && ty) {
                                cl = ag == "composite" ? idStatementClassComprises : (ag == "shared" ? idStatementClassAggregates : undefined);
                                nm = oA.getAttribute("name");
                                if (nm) {
                                    spD.resources.push({
                                        id: pId,
                                        class: LIB.makeKey(idResourceClassDefault),
                                        properties: [{
                                                class: LIB.makeKey("PC-Name"),
                                                values: [[{ text: nm }]]
                                            }, {
                                                class: LIB.makeKey("PC-Type"),
                                                values: [[{ text: "uml:Class" }]]
                                            }],
                                        changedAt: opts.fileDate
                                    });
                                    specializations.push({
                                        id: CONFIG.prefixS + simpleHash(pId + idStatementClassSpecializes + ty),
                                        class: LIB.makeKey(idStatementClassSpecializes),
                                        subject: LIB.makeKey(pId),
                                        object: LIB.makeKey(ty),
                                        changedAt: opts.fileDate
                                    });
                                    ty = pId;
                                }
                                ;
                                associationEnds.push({
                                    id: pId,
                                    associationId: oA.getAttribute("association"),
                                    associationType: LIB.makeKey(cl),
                                    thisEnd: LIB.makeKey(params.parent.id),
                                    otherEnd: LIB.makeKey(ty)
                                });
                                usedElements
                                    .filter((e) => {
                                    return e.object.id == pId;
                                })
                                    .forEach((e) => {
                                    makeStatementShows(e.subject.id, ty);
                                });
                            }
                            else if (classStereotypes.get(params.parent.id) == "sysml:InterfaceBlock") {
                                if (ty) {
                                    spD.statements.push({
                                        id: pId,
                                        class: LIB.makeKey(idStatementClassDefault),
                                        subject: LIB.makeKey(params.parent.id),
                                        object: LIB.makeKey(ty),
                                        properties: [{
                                                class: LIB.makeKey("PC-Type"),
                                                values: [[{ text: "has data type" }]]
                                            }],
                                        changedAt: opts.fileDate
                                    });
                                }
                                else {
                                }
                                ;
                                let stT = propertyStereotypes.get(pId);
                                if (stT && stT.dir)
                                    flowProperties.set(params.parent.id, stT.dir);
                            }
                            else {
                                console.info("Cameo Import: Skipping the " + oA.getAttribute("xmi:type") + " with id " + pId + ".");
                            }
                            ;
                            break;
                        case "uml:Port":
                            pId = oA.getAttribute("xmi:id");
                            ty = oA.getAttribute("type");
                            nm = oA.getAttribute("name");
                            ti = LIB.titleFromProperties(params.parent.properties, spD.propertyClasses, { targetLanguage: "default" });
                            let prt = {
                                id: pId,
                                class: LIB.makeKey("RC-UmlPort"),
                                properties: [{
                                        class: LIB.makeKey("PC-Name"),
                                        values: [[{ text: (ti ? ti + " Port " + nm : nm) }]]
                                    }, {
                                        class: LIB.makeKey("PC-Type"),
                                        values: [[{ text: "uml:Port" }]]
                                    }, {
                                        class: LIB.makeKey("PC-UmlIsservice"),
                                        values: [oA.getAttribute("isService") || "true"]
                                    }],
                                changedAt: opts.fileDate
                            };
                            spD.resources.push(prt);
                            spD.statements.push({
                                id: CONFIG.prefixS + simpleHash(params.parent.id + idStatementClassHasPart + pId),
                                class: LIB.makeKey(idStatementClassHasPart),
                                subject: LIB.makeKey(params.parent.id),
                                object: LIB.makeKey(pId),
                                changedAt: opts.fileDate
                            });
                            portL.push({ id: prt.id, resource: prt, interfaceBlock: ty, isConjugated: oA.getAttribute("isConjugated") == 'true', parent: params.parent });
                    }
                    ;
                }
                ;
            }
            function parseAssociation(el) {
                let nm = el.getAttribute("name"), prpL, aId = el.getAttribute("xmi:id"), aEnds = associationEnds.filter(aE => aE.associationId == aId);
                if (nm)
                    prpL = [{
                            class: LIB.makeKey("PC-Type"),
                            values: [[{ text: nm }]]
                        }];
                if (aEnds.length == 1) {
                    spD.statements.push({
                        id: aId,
                        class: LIB.makeKey(aEnds[0].associationType || idStatementClassAssociatedWith),
                        properties: nm ? prpL : undefined,
                        subject: LIB.makeKey(aEnds[0].thisEnd),
                        object: LIB.makeKey(aEnds[0].otherEnd),
                        changedAt: opts.fileDate
                    });
                }
                else if (aEnds.length == 2) {
                    let cl, sbj, obj;
                    if (aEnds[1].associationType) {
                        cl = aEnds[1].associationType;
                        sbj = aEnds[1].thisEnd;
                        obj = aEnds[1].otherEnd;
                    }
                    else {
                        cl = aEnds[0].associationType || idStatementClassAssociatedWith;
                        sbj = aEnds[0].thisEnd;
                        obj = aEnds[0].otherEnd;
                    }
                    ;
                    spD.statements.push({
                        id: aId,
                        class: LIB.makeKey(cl),
                        properties: nm ? prpL : undefined,
                        subject: LIB.makeKey(sbj),
                        object: LIB.makeKey(obj),
                        changedAt: opts.fileDate
                    });
                }
                else if (aEnds.length < 1) {
                    console.error("Cameo Import: Too few association ends found; must be 2 and is " + aEnds.length);
                    console.info("Cameo Import: Skipping the uml:Association with id " + aId + ", because it is not referenced by a uml:Class.");
                }
                else if (aEnds.length > 2) {
                    console.error("Cameo Import: Too many association ends found; must be 2 and is " + aEnds.length);
                    console.info("Cameo Import: Skipping the uml:Association with id " + aId + ", because it is not referenced by a uml:Class.");
                }
                ;
            }
        }
        function makeDiagrams(el, params) {
            Array.from(el.getElementsByTagName('ownedDiagram'), (oD) => {
                let dg = oD.getElementsByTagName('diagram:DiagramRepresentationObject')[0];
                let r = {
                    id: oD.getAttribute("xmi:id"),
                    class: LIB.makeKey(idResourceClassDiagram),
                    properties: [{
                            class: LIB.makeKey("PC-Name"),
                            values: [[{ text: oD.getAttribute("name") }]]
                        }, {
                            class: LIB.makeKey("PC-Type"),
                            values: [[{ text: oD.getAttribute("xmi:type") }]]
                        }, {
                            class: LIB.makeKey("PC-Notation"),
                            values: [[{ text: dg.getAttribute("type") }]]
                        }],
                    changedAt: opts.fileDate
                };
                if (params.package)
                    spD.statements.push({
                        id: CONFIG.prefixS + simpleHash(params.package + idStatementClassContains + r.id),
                        class: LIB.makeKey(idStatementClassContains),
                        subject: LIB.makeKey(params.package),
                        object: LIB.makeKey(r.id),
                        changedAt: opts.fileDate
                    });
                Array.from(dg.getElementsByTagName('usedElements'), uE => makeStatementShows(r.id, uE.innerHTML));
                spD.resources.push(r);
                params.nodes.push({
                    id: CONFIG.prefixN + simpleHash(params.package + r.id),
                    resource: LIB.makeKey(r.id),
                    changedAt: opts.fileDate
                });
            });
        }
        ;
        function makeResource(el, pars) {
            let r = {
                id: el.getAttribute("xmi:id"),
                properties: [{
                        class: LIB.makeKey("PC-Name"),
                        values: [[{ text: pars && pars.name ? pars.name : el.getAttribute("name") }]]
                    }, {
                        class: LIB.makeKey("PC-Type"),
                        values: [[{ text: el.getAttribute("xmi:type") }]]
                    }],
                changedAt: opts.fileDate
            };
            addDesc(r, el);
            return r;
        }
        function makeNode(r, pck) {
            let nd = {
                id: CONFIG.prefixN + simpleHash(pck + r.id),
                resource: LIB.makeKey(r.id),
                nodes: [],
                changedAt: opts.fileDate
            };
            return nd;
        }
        function addDesc(r, el) {
            Array.from(el.getElementsByTagName('ownedComment'), (oC, i) => {
                if (i > 0) {
                    console.warn("Element " + r.id + " has more than one comment/description.");
                    return;
                }
                ;
                let desc = oC.getAttribute("body");
                if (desc)
                    r.properties.push({
                        class: LIB.makeKey("PC-Description"),
                        values: [[{ text: desc }]]
                    });
            });
        }
        function makeStatementShows(sbj, obj) {
            let stId = CONFIG.prefixS + simpleHash(sbj + idStatementClassShows + obj);
            if (LIB.indexById(usedElements, stId) < 0)
                usedElements.push({
                    id: stId,
                    class: LIB.makeKey(idStatementClassShows),
                    subject: LIB.makeKey(sbj),
                    object: LIB.makeKey(obj),
                    changedAt: opts.fileDate
                });
        }
        function validateStatement(st, idx, stL) {
            if (LIB.isKey(st.subject) && LIB.isKey(st.object)) {
                let stC = LIB.itemByKey(spD.statementClasses, st["class"]), list = spD.resources.concat(stL), sbj = LIB.itemByKey(list, st.subject), obj = LIB.itemByKey(list, st.object), valid = sbj && obj;
                if (!stC) {
                    console.warn("Cameo Import: Class " + st["class"].id + " for statement " + st.id + " not found.");
                    return false;
                }
                ;
                if (!valid)
                    console.info("Cameo Import: Skipping", stC.title, "statement " + st.id + ", because " + (sbj ? ("object " + st.object.id) : ("subject " + st.subject.id)) + " isn't listed as resource resp. statement.");
                else {
                    valid = ((!stC.subjectClasses || LIB.referenceIndex(stC.subjectClasses, sbj["class"]) > -1)
                        && (!stC.objectClasses || LIB.referenceIndex(stC.objectClasses, obj["class"]) > -1));
                    if (!valid)
                        console.info("Cameo Import: Skipping", stC.title, "statement " + st.id + " with subject", sbj, " and object", obj, ", because they violate the statementClass.");
                }
                ;
                return valid;
            }
            ;
            console.warn("Cameo Import: Skipping statement " + st.id + ", because subject or object is undefined.");
            return false;
        }
    }
    function validateCameo(xmi) {
        return xmi.getElementsByTagName('xmi:exporter')[0].innerHTML.includes("MagicDraw")
            && xmi.getElementsByTagName('xmi:exporterVersion')[0].innerHTML.includes("19.0");
    }
}
