/*	SpecIF: Link Resources.
	Dependencies: jQuery, bootstrap
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de  
*/

// Construct the resource editor:
modules.construct({
	name: CONFIG.resourceLink
}, function(self) {
	"use strict";

	let myName = self.loadAs,
		myFullName = 'app.'+myName,
		pData = self.parent,	// the parent's data
		cData,					// the cached data
		opts;					// the processing options
	//	toEdit;					// the classified properties to edit


	self.eligibleSCL=[];		// all eligible statementClasses
	self.selResStatements=[];	// all statement of the selected resourceClasses
	self.allResources=[];		// all resources referenced in the tree

	self.init = ()=>{
//		console.debug('resourceEdit.init')
		self.clear()
	};
	self.clear = ()=>{
		self.eligibleSCL.length=0;
		self.selResStatements.length=0;
		self.allResources.length=0;
	};
	// The module entry;
	self.show = ( options )=>{

		self.clear();
		cData = app.cache.selectedProject.data;
		opts = simpleClone( options );
	//	opts.selNodeId = self.parent.tree.selectedNode.id;
		opts.lookupTitles = true;
		opts.targetLanguage = browser.language;
		opts.addIcon = true;

		app.cache.selectedProject.readContent( 'resource', pData.tree.selectedNode.ref )
		.then( 
			(res)=>{
				self.selRes = res;
				createStatement( opts )
			},
			stdError
		);

//		console.debug('resourceLink.show',opts);
		// Note: Here ES6 promises will be used. 
		// see https://codeburst.io/a-simple-guide-to-es6-promises-d71bacd2e13a 

		return;
		
		function createStatement( opts ) {		
			// Let the user choose the class of the resource to be created later on:
//			console.debug('createStatement',opts);
			let pend = 3;  // the number of parallel requests
				
			// 1. get the eligible statementClasses and all referenced resources in parallel and then create the desired statement:
			self.eligibleSCL.length=0;
			opts.eligibleStatementClasses.subjectClasses.concat(opts.eligibleStatementClasses.objectClasses).forEach( (sCId)=>{
				cacheE( self.eligibleSCL, sCId )  // avoid duplicates
			});
			app.cache.selectedProject.readContent( 'statementClass', self.eligibleSCL )
			.then( 
				(list)=>{
					self.eligibleSCL = list;  // now self.eligibleSCL contains the full statementClasses
					selectResource()
				}, 
				stdError
			);

			// 2. collect all statements of the originally selected resource to avoid duplication:
			app.cache.selectedProject.readStatementsOf( {id: self.selRes.id} )
			.then(
				(list)=>{
					self.selResStatements = list;
					selectResource()
				},
				stdError
			);
			
			// 3. collect all referenced resources avoiding duplicates:
			self.allResources.length=0;
			iterateNodes( cData.hierarchies, 
				(nd)=>{
					cacheE( self.allResources, nd.resource );
					return true // continue until the end
				}
			);
			app.cache.selectedProject.readContent( 'resource', self.allResources )
			.then( 
				(list)=>{
					// Sort the resources:
					list.sort( function(dick,doof) { 
								return elementTitleOf(dick,opts,cData).toLowerCase()<elementTitleOf(doof,opts,cData).toLowerCase()? -1 : 1 
					});
					//	self.allResources = simpleClone( list );
					self.allResources = list;  // now self.allResources contains the full resources
					selectResource()
				}, 
				stdError
			);
			return

			function selectResource() {
				console.debug('sCL, rL',self.eligibleSCL, self.allResources, pend );
				if( --pend<1 ) {
					// all parallel requests are done,
					// store a clone and get the title to display:
					let staClasses = forAll( self.eligibleSCL, (sC)=>{ return {title:titleOf(sC,{lookupTitles:true}),description:languageValueOf(sC.description,opts)}} );
					staClasses[0].checked = true;
//						console.debug('#2',simpleClone(staClasses));
					let dlg = new BootstrapDialog({
						title: i18n.MsgCreateStatement,
						type: 'type-primary',
						size: BootstrapDialog.SIZE_WIDE,
						// initialize the dialog:
						onshown: ()=>{ app[myName].filterClicked() },
						message: (thisDlg)=>{
							var form = '<table style="width:100%"><tbody><tr style="vertical-align:top"><td style="width:50%">'
									+ radioForm( i18n.LblStatementClass, staClasses, {handle:myFullName+'.filterClicked()'} )
								//	+ textForm( i18n.LblStringMatch,'','line' )
									+ textForm( i18n.TabFind,'','line',myFullName+'.filterClicked()' )
									+ '</td><td><div id="resCandidates" class="panel panel-default" style="max-height:'+($('#app').outerHeight(true)-210)+'px; overflow:auto" >'
									+ '</div></td></tr></tbody></table>';
							return $( form ) 
						},
						buttons: [{
								label: i18n.BtnCancel,
								action: (thisDlg)=>{ 
//									console.debug('action cancelled');
									thisDlg.close() 
								}
							},{ 	
								id: 'btn-modal-saveResourceAsSubject',
								label: i18n.LblSaveRelationAsSource,
								cssClass: 'btn-success', 
								action: (thisDlg)=>{
									self.saveStatement({secondAs:'subject'})
									.then(
										()=>{
											pData.doRefresh({forced:true})
										},
										stdError
									);
									thisDlg.close()
								}  
							},{ 	
								id: 'btn-modal-saveResourceAsObject',
								label: i18n.LblSaveRelationAsTarget,
								cssClass: 'btn-success', 
								action: (thisDlg)=>{
									self.saveStatement({secondAs:'object'})
									.then(
										()=>{
											pData.doRefresh({forced:true})
										},
										stdError
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
	self.hide = ()=>{
		self.clear()
	};

/* ++++++++++++++++++++++++++++++++
	Functions called by GUI events 
*/
	self.filterClicked = ()=>{
//		console.debug('click!', radioValue( i18n.LblStatementClass ));
		self.selectedStatementClass = self.eligibleSCL[ radioValue( i18n.LblStatementClass ) ];
		setTextFocus(i18n.TabFind); 
		let	eligibleRs = '',
			searchStr = textValue(i18n.TabFind),
			reTi = new RegExp( searchStr.escapeRE(), 'i' );  // don't use 'gi' - works only every other time.

		// among all statements of the originally selected resource (selRes), filter all those of the given class:
		let sL = self.selResStatements.filter( (s)=>{ return s['class']==self.selectedStatementClass.id } );
		self.allResources.forEach( 
			(res,i)=>{
				if( 
					// no reflexive statements are allowed:
					res.id!=self.selRes.id
					// res is not eligible, if it is already related with selRes by a statement of the same class:
					&& indexBy( sL, 'subject', res.id )<0
					&& indexBy( sL, 'object', res.id )<0
					// res must be eligible as subject or object and contain the searchStr:
					&& ( candidateMayBeObject( self.selectedStatementClass, res )
						|| candidateMayBeSubject( self.selectedStatementClass, res ) )) {
							let ti = desperateTitleOf(res,opts,cData);
							if( reTi.test(ti) ) 
								// then add an entry in the selection list:
								eligibleRs += '<div id="cand-'+i+'" class="candidates" onclick="'+myFullName+'.itemClicked(\''+i+'\')">'+ti+'</div>'
				}
			}
		);
		document.getElementById("resCandidates").innerHTML = eligibleRs || i18n.MsgNoMatchingObjects;
		// disable the 'save' buttons:
		document.getElementById("btn-modal-saveResourceAsObject").disabled = true;
		document.getElementById("btn-modal-saveResourceAsSubject").disabled = true
	};
	self.itemClicked = (idx)=>{
//		console.debug('click!',idx);

		// remove focus from previously selected candidate:
		if( self.selectedCandidate && self.selectedCandidate.resource.id!=self.allResources[idx].id ) {
			self.selectedCandidate.div.style.background = 'white';
			self.selectedCandidate.div.style.color = 'black'
		};

		// set focus to new candidate:
		let el = document.getElementById("cand-"+idx);
		el.style.background = '#1690D8';
		el.style.color = 'white';

		// remember new candidate, both the resource and the GUI-element:
		self.selectedCandidate = {resource:self.allResources[idx],div:el};

		// enable the appropriate save buttons
		// (a) the selected candidate may be a object:
		let btn = document.getElementById("btn-modal-saveResourceAsObject");
		if( candidateMayBeObject( self.selectedStatementClass, self.selectedCandidate.resource ) ) {
			btn.disabled = false;
			// show the statement to create in a popup:
			btn.setAttribute("data-toggle","popover");
			btn.setAttribute("title", "'"+desperateTitleOf(self.selRes,opts,cData) +"' "
										+ titleOf(self.selectedStatementClass,opts,cData) +" '"
										+ desperateTitleOf(self.selectedCandidate.resource,opts,cData) +"'" )
		} else {
			btn.disabled = true
		}; 
	/*	unfortunately the popup content keeps the first text and is not updated on selecting another candidate:
		let btn = $("#btn-modal-saveResourceAsObject");
		if( candidateMayBeObject( self.selectedStatementClass, self.selectedCandidate.resource ) ) {
			console.debug( 'candidateMayBeSubject', self.selectedCandidate.resource );
			btn.prop('disabled',false);
			// show the statement to create in a popup:
			btn.attr("data-toggle","popover");
			btn.popover({
				trigger:"hover",
				placement:"top"
				html: true,
				content: "'"+desperateTitleOf(self.selRes,opts,cData) +"' "
							+ '<i>'+titleOf(self.selectedStatementClass,opts,cData) +"</i> '"
							+ desperateTitleOf(self.selectedCandidate.resource,opts,cData) +"'" 
			})
		} else {
			btn.prop('disabled',true)
		}; */

		// (b) the selected candidate may be an subject:
		btn = document.getElementById("btn-modal-saveResourceAsSubject");
		if( candidateMayBeSubject( self.selectedStatementClass, self.selectedCandidate.resource ) ) {
			btn.disabled = false;
			// show the statement to create in a popup:
			btn.setAttribute("data-toggle","popover");
			btn.setAttribute("title", "'"+desperateTitleOf(self.selectedCandidate.resource,opts,cData) +"' "
										+ titleOf(self.selectedStatementClass,opts,cData) +" '"
										+ desperateTitleOf(self.selRes,opts,cData) +"'" )
		} else {
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
							+ '<i>'+titleOf(self.selectedStatementClass,opts,cData) +"</i> '"
							+ desperateTitleOf(self.selRes,opts,cData) +"'"
			})
		} else {
			btn.prop('disabled',true)
		}  */
	};
	self.saveStatement = (dir)=>{
//		console.debug('saveStatement',self.selRes, self.selectedStatementClass, self.selectedCandidate.resource,dir.secondAs);
		return app.cache.selectedProject.createContent( 'statement', {
									id:genID('S-'),
									class: self.selectedStatementClass.id,
									subject: ( dir.secondAs=='object'? self.selectedCandidate.resource.id : self.selRes.id ),
									object: ( dir.secondAs=='object'? self.selRes.id : self.selectedCandidate.resource.id ),
									changedAt: new Date().toISOString()
								}
		)
	};
	function candidateMayBeObject( sC, res ) {
		// no *bjectClasses means all resourceClasses are permissible as *bject:
		return ( !sC.subjectClasses || sC.subjectClasses.indexOf( self.selRes['class'] )>-1 )
			&& ( !sC.objectClasses || sC.objectClasses.indexOf(res['class'])>-1 )
	}
	function candidateMayBeSubject( sC, res ) {
		// no *bjectClasses means all resourceClasses are permissible as *bject:
		return ( !sC.objectClasses || sC.objectClasses.indexOf( self.selRes['class'] )>-1 )
			&& ( !sC.subjectClasses || sC.subjectClasses.indexOf(res['class'])>-1 )
	}
	return self
})
