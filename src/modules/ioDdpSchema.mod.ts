/*!	DDP-Schema import
	Dependencies: -
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)

	Limitations:
	- It is assumed that all text values within the provided SpecIF data set have only a single language,
	  so a "SpecifMultiLanguageText" array has a single entry only.
	
*/

// Constructor for DDP-Schema import:
// (A module constructor is needed, because there is an access to parent's data via 'self.parent..')
moduleManager.construct({
	name: 'ioDdpSchema'
}, (self:ITransform) =>{
	"use strict";
	let
/*		opts: any,
		mime,
		zipped:boolean,
//		template,	// a new Id is given and user is asked to input a project-name
		errNoOptions = new xhrMessage( 896, 'No options or no mediaTypes defined.' ),
		errNoDdpSchemaFile = new xhrMessage( 897, 'No DDP-Schema file in the reqifz container.' ),
        //errInvalidJson = { status: 900, statusText: 'SpecIF data is not valid JSON.' }, */
		errInvalidXML = new xhrMessage(898, 'DDP Schema is not valid XML.'),
		errTransformationFailed = new xhrMessage(999, 'Input file could not be transformed to SpecIF.');
		
	self.init = (/*options:any*/):boolean =>{
	//	mime = undefined;
	//	opts = options;
		return true;
	};

	self.verify = ( f:File ):boolean =>{
			// Verify the type (and eventually the content) of a DDP Schema import file:
	
	/*		function ddpSchemaFile2mediaType( fname:string ):string|undefined {
				if( fname.endsWith('.reqifz') || fname.endsWith('.reqif.zip') ) {
					zipped = true;
					return 'application/zip';
				};
				if( fname.endsWith('.reqif') ) {
					zipped = false;
					return 'application/xml';
				};
				return; // undefined
			}
				
		mime = reqifFile2mediaType( f.name );
		if ( mime )
			return true;
		// else:
		message.show( i18n.lookup('ErrInvalidFileReqif', f.name) );
		return false; */

			function isDdpSchema(fname: string): boolean {
				// importAny let's us import only files with this extension, so this should always succeed:
				return fname.endsWith('.xsd') 
			}
				
		// ToDo: Briefly check for DDP-Schema content
		if ( !isDdpSchema(f.name) ) {
			message.show( i18n.lookup('ErrInvalidFile', f.name) );
			return false;
		};
		return true;
	};
	self.toSpecif = (buf: ArrayBuffer): JQueryDeferred<SpecIF> => {
		// Transform DDP-Schema to SpecIF for import:
		// buf is an array-buffer containing reqif data:
//		console.debug('ioDdpSchema.toSpecif');
		//self.abortFlag = false;
		let dDO = $.Deferred(),
			xsd = LIB.ab2str(buf);

		if (LIB.validXML(xsd)) {
			let data = ddpSchema2specif(xsd /*, self.parent.projectName, fDate*/);

			//		console.debug('ioArchimate.toSpecif', self.parent.projectName, data );
			if (typeof (data) == 'object' && data.id)
				dDO.resolve(data)
			else
				dDO.reject(errTransformationFailed);
        }
		else
			dDO.reject(errInvalidXML);

		return dDO;
	};
/*	self.fromSpecif = ( pr:SpecIF, opts?:any ):string =>{
	}; */
	self.abort = ():void =>{
//		app.projects.abort();
//		server.project().cancelImport();
		self.abortFlag = true;
	};
	return self;

	function ddpSchema2specif(xsd: string /*, pN:string, pchAt: string */): SpecIF {
		"use strict";

		// Transform the content of the "Dictionary.xsd" file provided by prostep iViP on 2023-03-10.
		var spD = app.ontology.makeTemplate();
		spD.title = [{ text: "prostep iViP Collaboration Datamodel Schema" }];
		spD.description = [{ text: "prostep iViP Collaboration Datamodel Schema Version 2.0 created 10.03.2023 08:09:28 by Michael Kirsch, :em engineering methods AG on behalf of prostep iViP Association" }];
		spD.id = "P-DDP-Schema-V20";
		spD.createdAt = "2023-03-10T08:09:28-02:00";
		spD.dataTypes = [
			// most general data type must come first:
			app.standards.get("dataType", { id: "DT-Text" }) as SpecifDataType,
			app.standards.get("dataType", { id: "DT-ShortString" }) as SpecifDataType,
			app.standards.get("dataType", { id: "DT-DateTime" }) as SpecifDataType,
			app.standards.get("dataType", { id: "DT-Boolean" }) as SpecifDataType,
			app.standards.get("dataType", { id: "DT-Integer" }) as SpecifDataType,
			app.standards.get("dataType", { id: "DT-Real" }) as SpecifDataType,
			app.standards.get("dataType", { id: "DT-AnyURI" }) as SpecifDataType
		];
	/*	Currently the deduplication doesn't work with these, anyways:
		spD.propertyClasses = [
			app.standards.get("propertyClass", { id: "PC-Name" }) as SpecifPropertyClass,
			app.standards.get("propertyClass", { id: "PC-Description" }) as SpecifPropertyClass,
			app.standards.get("propertyClass", { id: "PC-Diagram" }) as SpecifPropertyClass,
			app.standards.get("propertyClass", { id: "PC-Type" }) as SpecifPropertyClass
		]; */

		let parser = new DOMParser(),
			xsdDoc = parser.parseFromString(xsd, "text/xml");

		// Extract the dictionaryEntities from the DictionaryEntitiesCollection in the upper part of the schema file
		let dictionaryEntities = Array.from(xsdDoc.getElementsByTagName('xs:schema')[0].children)
			.filter((ch) => { return ch.tagName == "xs:complexType"; })
			.filter((ch) => { return ch.getAttribute("name") == "DictionaryEntitiesCollection" });

		dictionaryEntities = Array.from(dictionaryEntities[0].children[0].children);
//		console.debug('dictionaryEntities', dictionaryEntities);
		dictionaryEntities.forEach(
			(d) => {
				let dE = d.children[0].children[0].children[0];
				// dE is the dictionaryEntity, now.

				let ti = dE.getAttribute("name") || "",
					rC = {
						id: "RC-" + simpleHash(ti),
						title: ti,
						description: getDesc(dE),
						instantiation: ["auto", "user"],
						propertyClasses: [],
						changedAt: spD.createdAt
					};
				let attC = dE.getElementsByTagName('xs:complexContent'),
					atts = attC[0].children[0].children;
				let prpL = (atts && atts.length == 1) ? Array.from(atts[0].getElementsByTagName('xs:element')) : [];
//				console.debug('d', dE, atts/*,seq*/, prpL);
				prpL.forEach((prp) => {
					let ti = prp.getAttribute("ref") || prp.getAttribute("name") || "",
						id = "PC-" + simpleHash(ti),
						ty = prp.getAttribute("type") || "xs:string",
						dT = LIB.itemBy(spD.dataTypes, "type", ty);
					if (dT) {
						let pC = {
							id: id,
							title: ti,
							description: getDesc(prp),
							dataType: { id: dT.id },
							changedAt: spD.createdAt
						};
						LIB.cacheE(spD.propertyClasses, pC);
						LIB.cacheE(rC.propertyClasses, { id: id });
					}
					else
						console.warn('Unknown data type', ty);
				});
				LIB.cacheE(spD.resourceClasses, rC);
			}
		);

/*		// Extract the dictionary entities from the top-level list of <complexType in the lower part of the schema file;
 *		// Note: The dictionaryEntities don't have annotations/documentation, here
		let dictionaryEntities = Array.from(xsdDoc.getElementsByTagName('xs:schema')[0].children)
				.filter((ch) => { return ch.tagName == "xs:complexType" })
				// ToDo: filter those which are listed in DictionaryEntitiesCollection - this is quick and dirty:
				.filter((ch) => {
					return ![
						"DictionaryEntitiesCollection",
						"DictionaryEntity",
						"customAttribute",
						"DictionaryRelationsCollection",
						"DictionaryEntityRef",
						"DictionaryRelation",
						"string",
						"SourceEntitiesCollection",
						"SourceEntityRef",
						"SourceRelationsCollection",
						"Relation"
					].includes(ch.getAttribute("name"))
				});
		//	.filter((cpxT)=>{ return cpxT.getAttribute("name")=="DictionaryEntitiesCollection"});

		//        console.debug('ddp', xsdDoc, dictionaryEntities);
	//	console.debug('#',Array.from(xsdDoc.getElementsByTagName('xs:element')));

		dictionaryEntities.forEach(
			(dE) => {
				let ti = dE.getAttribute("name"),
					rC = {
						id: "RC-" + simpleHash(ti),
						title: ti,
						instantiation: ["auto", "user"],
						propertyClasses: [],
						changedAt: spD.createdAt
					};

				// Look for the properties:
				let atts = dE.children[0],
					seq = atts ? Array.from(atts.getElementsByTagName('xs:sequence')) : undefined;
				//	chc = atts ? Array.from(atts.getElementsByTagName('xs:choice')) : undefined;
				//	ch = atts? Array.from(atts.children) : undefined;
				//				console.debug('atts',atts,seq,seq.length,chc,chc.length);

				let prpL = (seq && seq.length == 1) ? Array.from(seq[0].getElementsByTagName('xs:element')) : [];
				//				console.debug('prpL',prpL);

				prpL.forEach(
					(prp) => {
						let ti = prp.getAttribute("ref") || prp.getAttribute("name"),
							id = "PC-" + simpleHash(ti),
							ty = prp.getAttribute("type") || "xs:string",
							dT = LIB.itemBy(spD.dataTypes, "type", ty);
						//	console.debug('prp',ti,ty,dT);
						if (dT) {
							let pC = {
								id: id,
								title: ti,
								description: getDesc(prp),
								dataType: { id: dT.id },
								changedAt: spD.createdAt
							};
							LIB.cacheE(spD.propertyClasses, pC);
							LIB.cacheE(rC.propertyClasses, { id: id });
						}
						else
							console.warn('Unknown data type', ty);
					}
				);
				LIB.cacheE(spD.resourceClasses, rC);
			}
		); */

		console.debug('spD', spD);
		return spD;

		function getDesc(el: any): SpecifMultiLanguageText {
		//	let docL = Array.from(el.getElementsByTagName('xs:documentation'));  ... yields all subordinated elements in case of an entity
			// assuming that the 'annotation' is first subordinated element:
			let docL = el.children && el.children.length>0 ? Array.from(el.children[0].children) : [];
			return docL.map(
				(doc:any) => {
					return {
						text: doc.innerHTML,
						language: doc.getAttribute("xml:lang")
					} as SpecifLanguageText
				}
			);
		}
	}
});
