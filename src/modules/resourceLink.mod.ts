/*!	SpecIF: Link Resources.
	Dependencies: jQuery, bootstrap
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	Author: se@enso-managers.de, Berlin
	We appreciate any correction, comment or contribution!
*/

// Construct the resource editor:
moduleManager.construct({
	name: CONFIG.resourceLink
}, (self:IModule) =>{
	"use strict";

	let myName = self.loadAs,
		myFullName = 'app.'+myName,
		pData = self.parent,	// the parent's data
		cData: CSpecIF,			// the cached data
		selRes:SpecifResource,		// the currently selected resource
		opts:any;				// the processing options

	self.eligibleSCL =[];		// all eligible statementClasses
	self.selResStatements=[];	// all statements of the selected resource
	self.allResources=[];		// all resources referenced in the tree

	function candidateMayBeObject(sC: SpecifStatementClass, res: SpecifResource): boolean {
		// no *bjectClasses means all resourceClasses are permissible as *bject:
		return (!sC.subjectClasses || sC.subjectClasses.indexOf(selRes['class']) > -1)
			&& (!sC.objectClasses || sC.objectClasses.indexOf(res['class']) > -1)
	}
	function candidateMayBeSubject(sC: SpecifStatementClass, res: SpecifResource): boolean {
		// no *bjectClasses means all resourceClasses are permissible as *bject:
		return (!sC.objectClasses || sC.objectClasses.indexOf(selRes['class']) > -1)
			&& (!sC.subjectClasses || sC.subjectClasses.indexOf(res['class']) > -1)
	}

	self.init = (): boolean => {
//		console.debug('resourceEdit.init')
		self.clear();
		return true;
	};
	self.clear = ():void =>{
		self.eligibleSCL.length=0;
		self.selResStatements.length=0;
		self.allResources.length=0;
	};
	// The module entry;
	self.show = ( options:any ):void =>{

		self.clear();
		cData = app.cache.selectedProject.data;
		opts = simpleClone( options );
		opts.lookupTitles = true;
		opts.targetLanguage = browser.language;
		opts.addIcon = true;

		app.cache.selectedProject.readContent( 'resource', pData.tree.selectedNode.ref )
		.then( 
			(rL:SpecifResource[])=>{
				selRes = rL[0];
				createStatement( opts )
			},
			LIB.stdError
		);

//		console.debug('resourceLink.show',opts);
		// Note: Here ES6 promises will be used. 
		// see https://codeburst.io/a-simple-guide-to-es6-promises-d71bacd2e13a 

		return;
		
		function createStatement( opts ):void {		
			// Let the user choose the class of the resource to be created later on:
//			console.debug('createStatement',opts);
			let pend = 3;  // the number of parallel requests
				
			// 1. get the eligible statementClasses and all referenced resources in parallel and then create the desired statement:
			self.eligibleSCL.length=0;
			opts.eligibleStatementClasses.subjectClasses.concat(opts.eligibleStatementClasses.objectClasses).forEach( (sCId)=>{
				LIB.cacheE( self.eligibleSCL, sCId )  // avoid duplicates
			});
			app.cache.selectedProject.readContent( 'statementClass', self.eligibleSCL )
			.then( 
				(list:SpecifStatementClass[])=>{
					self.eligibleSCL = list;  // now self.eligibleSCL contains the full statementClasses
					chooseResourceToLink()
				}, 
				LIB.stdError
			);

			// 2. collect all statements of the originally selected resource to exclude them from selection:
			app.cache.selectedProject.readStatementsOf( {id: selRes.id} )
			.then(
				(list:SpecifStatement[])=>{
					self.selResStatements = list;
					chooseResourceToLink()
				},
				LIB.stdError
			);
			
			// 3. collect all referenced resources avoiding duplicates:
			self.allResources.length=0;
			LIB.iterateNodes( cData.hierarchies, 
				(nd:SpecifNode)=>{
					LIB.cacheE( self.allResources, nd.resource );
					// self.allResources contains the resource ids
					return true // iterate the whole tree
				}
			);
			app.cache.selectedProject.readContent( 'resource', self.allResources )
			.then( 
				(list:SpecifResource[])=>{
					
					// Sort the resources:
					LIB.sortBy( 
							list, 
							(el)=>{ return elementTitleOf(el,opts,cData) } 
					);
					self.allResources = list;
					// now self.allResources contains the full resources
					chooseResourceToLink()
				}, 
				LIB.stdError
			);
			return

			function chooseResourceToLink():void {
//				console.debug('sCL, rL',self.eligibleSCL, self.allResources, pend );
				if( --pend<1 ) {
					// all parallel requests are done,
					// store a clone and get the title to display:
					let staClasses = LIB.forAll( 
							self.eligibleSCL, 
							(sC)=>{ return {title:titleOf(sC,{lookupTitles:true}),description:languageValueOf(sC.description,opts)}} 
						);
					staClasses[0].checked = true;
//					console.debug('#2',simpleClone(staClasses));
					// @ts-ignore - BootstrapDialog() is loaded at runtime
					new BootstrapDialog({
						title: i18n.MsgCreateStatement,
						type: 'type-primary',
						// @ts-ignore - BootstrapDialog() is loaded at runtime
						size: BootstrapDialog.SIZE_WIDE,
						// initialize the dialog:
						onshown: ()=>{ app[myName].filterClicked() },
					//	message: (thisDlg)=>{
						message: () =>{
							var form = '<div class="row" style="margin: 0 -4px 0 -4px">'
									+	'<div class="col-sm-12 col-md-6" style="padding: 0 4px 0 4px"><div class="panel panel-default panel-options" style="margin-bottom:0">'
					//		var form = '<table style="width:100%"><tbody><tr style="vertical-align:top"><td style="width:50%; padding-right:0.4em">'
									+ radioField( i18n.LblStatementClass, staClasses, {handle:myFullName+'.filterClicked()'} )
									+ textField( i18n.TabFilter,'',{typ:'line', handle:myFullName+'.filterClicked()'} )
									+	'</div></div>'
									+	'<div class="col-sm-12 col-md-6" style="padding: 0 4px 0 4px"><div class="panel panel-default panel-options" style="margin-bottom:0">'
					//				+ '</td><td style="padding-left:0.4em">'
									+ '<div id="resCandidates" style="max-height:'+($('#app').outerHeight(true)-220)+'px; overflow:auto" >'
									+ '</div>'
									+ '</div></div>'
					//				+ '</td></tr></tbody></table>';
							return $( form ) 
						},
						buttons: [{
							label: i18n.BtnCancel,
							action: (thisDlg: any)=>{
								thisDlg.close() 
							}
						}, {
							id: 'btn-modal-saveResourceAsSubject',
							label: i18n.IcoAdd +'&#160;'+i18n.LblSaveRelationAsSource,
							cssClass: 'btn-success', 
							action: (thisDlg: any)=>{
								self.saveStatement({secondAs:'subject'})
								.then(
									()=>{
										pData.doRefresh({forced:true})
									},
									LIB.stdError
								);
								thisDlg.close()
							}  
						},{ 	
							id: 'btn-modal-saveResourceAsObject',
							label: i18n.IcoAdd +'&#160;'+i18n.LblSaveRelationAsTarget,
							cssClass: 'btn-success', 
							action: (thisDlg: any)=>{
								self.saveStatement({secondAs:'object'})
								.then(
									()=>{
										pData.doRefresh({forced:true})
									},
									LIB.stdError
								);
								thisDlg.close()
							}  
						}]
					})
					.open()	
				}
			}
		}
	};
	self.hide = ():void =>{
		self.clear()
	};

/* ++++++++++++++++++++++++++++++++
	Functions called by GUI events 
*/
	self.filterClicked = ():void =>{
//		console.debug('click!', radioValue( i18n.LblStatementClass ));
		self.selectedStatementClass = self.eligibleSCL[ radioValue( i18n.LblStatementClass ) ];
		setFocus(i18n.TabFilter); 
		let	eligibleRs = '',
			searchStr = textValue(i18n.TabFilter),
			reTi = new RegExp( searchStr.escapeRE(), 'i' );  // don't use 'gi' - works only every other time.

		// among all statements of the originally selected resource (selRes), filter all those of the given class:
		let sL = self.selResStatements.filter( (s)=>{ return s['class']==self.selectedStatementClass.id } );
		self.allResources.forEach( 
			(res:SpecifResource,i:number)=>{
				if( 
					// no reflexive statements are allowed:
					res.id!=selRes.id
					// res is not eligible, if it is already related with selRes by a statement of the same class:
					&& LIB.indexBy( sL, 'subject', res.id )<0
					&& LIB.indexBy( sL, 'object', res.id )<0
					// res must be eligible as subject or object and contain the searchStr:
					&& ( candidateMayBeObject( self.selectedStatementClass, res )
						|| candidateMayBeSubject( self.selectedStatementClass, res ) )) {
					//		let ti = desperateTitleOf(res,opts,cData);
							let ti = elementTitleOf(res,opts,cData);
							if( reTi.test(ti) ) 
								// then add an entry in the selection list:
								eligibleRs += '<div id="cand-'+i+'" class="candidates" onclick="'+myFullName+'.itemClicked(\''+i+'\')">'+ti+'</div>'
				}
			}
		);
		document.getElementById("resCandidates").innerHTML = eligibleRs || "<em>"+i18n.MsgNoMatchingObjects+"</em>";
		// disable the 'save' buttons:
		// @ts-ignore - .disabled is an accessible attribute
		document.getElementById("btn-modal-saveResourceAsObject").disabled = true;
		// @ts-ignore - .disabled is an accessible attribute
		document.getElementById("btn-modal-saveResourceAsSubject").disabled = true
	};
	self.itemClicked = (idx:number):void =>{
//		console.debug('click!',idx);

		// remove focus from previously selected candidate:
		if( self.selectedCandidate && self.selectedCandidate.resource.id!=self.allResources[idx].id ) {
			self.selectedCandidate.div.style.background = 'white';
			self.selectedCandidate.div.style.color = 'black'
		};

		// set focus to new candidate:
		let el = document.getElementById("cand-"+idx);
		el.style.background = CONFIG.focusColor;
		el.style.color = 'white';

		// remember new candidate, both the resource and the GUI-element:
		self.selectedCandidate = {resource:self.allResources[idx],div:el};

		// enable the appropriate save buttons
		// (a) the selected candidate may be a object:
		let btn = document.getElementById("btn-modal-saveResourceAsObject");
		if( candidateMayBeObject( self.selectedStatementClass, self.selectedCandidate.resource ) ) {
			// @ts-ignore - .disabled is an accessible attribute
			btn.disabled = false;
			// show the statement to create in a popup:
			btn.setAttribute("data-toggle","popover");
		/*	btn.setAttribute("title", "'"+desperateTitleOf(selRes,opts,cData) +"' "
										+ titleOf(self.selectedStatementClass,opts) +" '"
										+ desperateTitleOf(self.selectedCandidate.resource,opts,cData) +"'" ) */
			btn.setAttribute("title", "'"+elementTitleOf(selRes,opts,cData) +"' "
										+ titleOf(self.selectedStatementClass,opts) +" '"
										+ elementTitleOf(self.selectedCandidate.resource,opts,cData) +"'" )
		}
		else {
			// @ts-ignore - .disabled is an accessible attribute
			btn.disabled = true
		}; 

		// (b) the selected candidate may be an subject:
		btn = document.getElementById("btn-modal-saveResourceAsSubject");
		if( candidateMayBeSubject( self.selectedStatementClass, self.selectedCandidate.resource ) ) {
			// @ts-ignore - .disabled is an accessible attribute
			btn.disabled = false;
			// show the statement to create in a popup:
			btn.setAttribute("data-toggle","popover");
		/*	btn.setAttribute("title", "'"+desperateTitleOf(self.selectedCandidate.resource,opts,cData) +"' "
										+ titleOf(self.selectedStatementClass,opts) +" '"
										+ desperateTitleOf(selRes,opts,cData) +"'" ) */
			btn.setAttribute("title", "'"+elementTitleOf(self.selectedCandidate.resource,opts,cData) +"' "
										+ titleOf(self.selectedStatementClass,opts) +" '"
										+ elementTitleOf(selRes,opts,cData) +"'" ) 
		}
		else {
			// @ts-ignore - .disabled is an accessible attribute
			btn.disabled = true
		}; 
	/*	unfortunately the popup content keeps the first text and is not updated on selecting another candidate:
		btn = $("#btn-modal-saveResourceAsSubject");
		if( candidateMayBeSubject( self.selectedStatementClass, self.selectedCandidate.resource ) ) {
			console.debug( 'candidateMayBeObject', self.selectedCandidate.resource );
			btn.prop('disabled',false);
			// show the statement to create in a popup:
			btn.attr("data-toggle","popover");
			btn.popover({
				trigger:"hover",
				placement:"top",
				html: true,
				content: "'"+desperateTitleOf(self.selectedCandidate.resource,opts,cData) +"' "
							+ '<i>'+titleOf(self.selectedStatementClass,opts) +"</i> '"
							+ desperateTitleOf(selRes,opts,cData) +"'"
			})
		} else {
			btn.prop('disabled',true)
		}  */
	};
	self.saveStatement = (dir):void =>{
//		console.debug('saveStatement',selRes, self.selectedStatementClass, self.selectedCandidate.resource,dir.secondAs);
		return app.cache.selectedProject.createContent( 'statement', {
									id: LIB.genID('S-'),
									class: self.selectedStatementClass.id,
									subject: ( dir.secondAs=='object'? selRes.id : self.selectedCandidate.resource.id ),
									object: ( dir.secondAs=='object'? self.selectedCandidate.resource.id : selRes.id ),
									changedAt: new Date().toISOString()
								}
		)
	};
	return self
})
