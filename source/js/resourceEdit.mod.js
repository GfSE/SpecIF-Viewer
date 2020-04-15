/*	SpecIF: Resource Edit.
	Dependencies: jQuery, bootstrap
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	Author: se@enso-managers.de, Berlin
	We appreciate any correction, comment or contribution via e-mail to support@reqif.de  
*/

// Construct the resource editor:
modules.construct({
	name: CONFIG.resourceEdit
}, function(self) {
	"use strict";

	let myName = self.loadAs,
		myFullName = 'app.'+myName,
		pData = self.parent,	// the parent's data
		cData,					// the cached data
		opts,					// the processing options
		toEdit,					// the classified properties to edit
		selNd;					// the selected tree node
	self.newRes;				// the resource to edit
	self.newFiles = [];			// collect uploaded files before committing the change

	self.init = function() {
//		console.debug('resourceEdit.init')
		self.clear()
	};
	self.clear = function() {
		self.newFiles.length = 0
	};

	let msgBtns = {
		cancel: {
				label: i18n.BtnCancel,
				action: function(thisDlg){ 
					console.debug('action cancelled');
					thisDlg.close() 
				}
			},
		update: { 	
				label: i18n.BtnUpdate,
				cssClass: 'btn-success', 
				action: function(thisDlg) {
					save('update');
					thisDlg.close()
				}  
			},	
		insertAfter: {
				label: i18n.BtnInsertSuccessor,
				cssClass: 'btn-success', 
				action: function(thisDlg) {
					save('insertAfter');
					thisDlg.close()
				}  
			},
		insertBelow: { 	
				label: i18n.BtnInsertChild,
				cssClass: 'btn-success', 
				action: function(thisDlg) {
					save('insertBelow');
					thisDlg.close()
				}  
			}
	};
	function save(mode) {
		let p, 
			pend=2, // minimally 2 calls with promise
			// The properties of toEdit are complete in contrast to the original self.newRes:
			allProps = toEdit.descriptions.concat(toEdit.other),
			chD = new Date().toISOString();  // changedAt
		for( var a=allProps.length-1;a>-1;a-- ) {
			p = allProps[a];
			// delete any title property, as the resource's native title has been set:
			if( CONFIG.titleProperties.concat(CONFIG.headingProperties).indexOf(propTitleOf(p,cData))>-1 ) {
//				console.debug('delete',p);
				allProps.properties.splice(a,1);
				continue
			};
			// Skip the diagrams, as they are directly updated if the user uploads a new file:
			if( CONFIG.diagramClasses.indexOf(propTitleOf(p,cData))>-1 ) {
//				console.debug('skip',p);
				continue
			};
			console.debug( 'save',mode, p, getP( p ) );
			p.value = getP( p );
		//	itemBy( allProps, 'class', p['class'] ).value = getP( p )
		};
		console.debug( 'save allProps', allProps );
		// set the resource's native title:
		self.newRes.title = textValue( i18n.lookup(CONFIG.propClassTitle) );
		// suppress empty properties:
		self.newRes.properties = forAll( allProps, function(p) { if( hasContent(p.value) ) return p });
		self.newRes.changedAt = chD;
		switch( mode ) {
			case 'update':
				app.cache.selectedProject.updateContent( 'resource', self.newRes )
					.then( finalize, stdError );
				break;
			case 'insertAfter':
				app.cache.selectedProject.createContent( 'resource', self.newRes )
					.then( finalize, stdError );
				pend++;
				app.cache.selectedProject.createContent( 'node', {id:genID('N-'),resource:self.newRes.id,changedAt:chD,predecessor:opts.selResId} )
					.then( finalize, stdError );
				break;
			case 'insertBelow':
				app.cache.selectedProject.createContent( 'resource', self.newRes )
					.then( finalize, stdError );
				pend++;
				app.cache.selectedProject.createContent( 'node', {id:genID('N-'),resource:self.newRes.id,changedAt:chD,parent:opts.selResId} )
					.then( finalize, stdError );
		};
		// has no effect, if newFiles is empty:
		app.cache.selectedProject.createContent( 'file', self.newFiles )
			.then( finalize, stdError );
		return;
			
		function finalize() {	
			if(--pend<1) {
				pData.updateTree();
				selNd = pData.tree.selectedNode;
				switch( mode ) {
					case 'insertAfter':
						console.debug('nd',selNd,pData.tree.selectedNode)
						pData.tree.selectNode( selNd.getNextSibling() ); 
						break;
					case 'insertBelow':
						pData.tree.openNode( selNd );
						pData.tree.selectNode( selNd.getNextNode() )   // go to next visible tree node
				};  
				pData.doRefresh({forced:true})
			}
		}
		function getP(p) {
			// Get the value of a property:
			// ToDo: Works only, if all propertyClasses are always cached:
			let pC = itemById( cData.propertyClasses, p['class'] ),
				dT = itemById( cData.dataTypes, pC.dataType ),
				opts = {
					lookupTitles: true,
					targetLanguage: browser.language
				};
			switch( dT.type ) {
				case 'xs:dateTime':
				case 'xs:string':
				case 'xhtml':
					// The diagrams are skipped in the calling layer.
//					console.debug( '*',p,textValue( titleOf(p,opts) ) );
					return textValue( titleOf(p,opts) );
				case 'xs:enumeration':
//					console.debug('xs:enumeration',p,pC,separatedValues,vals);
					if( typeof(pC.multiple)=='boolean'? pC.multiple : dT.multiple ) {
//						console.debug( '*',p,checkboxValues( titleOf(p,opts) ).toString() );
						return checkboxValues( titleOf(p,opts) ).toString()
					} else {
//						console.debug( '*',p,radioValue( titleOf(p,opts) ) );
						return radioValue( titleOf(p,opts) )
					};
				case 'xs:boolean':
					return checkboxValues( titleOf(p,opts) ).toString();
				case 'xs:integer':
				case 'xs:double':
					return '' /* ToDo */
			}
		}
	}

	// The module entry;
	// called by the parent's view controller:
	self.show = function( options ) {

		self.clear();
		opts = simpleClone( options );
		cData = app.cache.selectedProject.data;
		selNd = pData.tree.selectedNode;

		console.debug('resourceEdit.show',opts);
		// Note: Here ES6 promises will be used. 
		// see https://codeburst.io/a-simple-guide-to-es6-promises-d71bacd2e13a 
		switch( opts.mode ) {
			case 'create':
				getResClass()
				.then(
					(rC)=>{ 
						app.cache.selectedProject.createResource(rC)
						.then( 
							(r)=>{
//								console.debug( '#', opts.mode, r );
								opts.selResId = self.parent.tree.selectedNode.id;
								self.newRes = simpleClone(r);
								opts.dialogTitle = i18n.MsgCreateResource;
								opts.msgBtns = [
									msgBtns.cancel,
									msgBtns.insertAfter,
									msgBtns.insertBelow
								];
								editResource(r)
							}, 
							stdError
						)
					},
					stdError
				);
				break;
			case 'clone':
			case 'update':
//				console.debug('~',nd);
				app.cache.selectedProject.readContent( 'resource', selNd.ref )
					.done( function(r) {
					//	app.cache.selectedProject.readContent( 'resourceClass', r['class'] )
					//		.done( function(rC) {
								// create a clone to collect the changed values before committing:
								opts.selResId = r.id;
								self.newRes = simpleClone(r);
								if( opts.mode=='clone' ) {
									self.newRes.id = genID('R-');
									opts.dialogTitle = i18n.MsgCloneResource,
									opts.msgBtns = [
										msgBtns.cancel,
										msgBtns.insertAfter,
										msgBtns.insertBelow
									]
								} else {
									opts.dialogTitle = i18n.MsgUpdateResource;
									opts.msgBtns = [
										msgBtns.cancel,
										msgBtns.update
									]
								}; 
								editResource(self.newRes)
					//		})
					//		.fail( stdError )
					})
					.fail( stdError );
		};
		
		return;
		
		function editResource(res) {
			// Edit/update the resources properties:
//			console.debug( 'editResource', res, simpleClone(cData.resourceClasses) );
			toEdit = classifyProps( res, cData );
			let dlg = new BootstrapDialog({
				title: opts.dialogTitle,
			//	type: 'type-success',
				type: 'type-primary',
				size: BootstrapDialog.SIZE_WIDE,
				message: function (thisDlg) {
					var form = '<form id="attrInput" role="form" class="form-horizontal" ></form>';
						form += textForm( i18n.lookup(CONFIG.propClassTitle), toEdit.title, 'line' );
						toEdit.descriptions.forEach( function(d) {
							form += editP(d)
						});
						toEdit.other.forEach( function(p) {
							form +=editP(p)
						});
					return $( form ) 
				},
				buttons: opts.msgBtns
			})
			.open();
			return
			
			function editP(p) {
				// Return a form element for a property:
				// ToDo: Works only, if all propertyClasses are always cached:
				let pC = itemById( cData.propertyClasses, p['class'] ),
					dT = itemById( cData.dataTypes, pC.dataType ),
					opts = {
						lookupTitles: true,
						targetLanguage: browser.language,
						imgClass: 'forImagePreview'
					};
				switch( dT.type ) {
					case 'xs:string':
					case 'xhtml':
						if( CONFIG.diagramClasses.indexOf(propTitleOf(p,cData))>-1 ) {
							// it is a diagram reference:
							return renderDiagram(p,opts)
						} else {
							// it is a text (in case of xhtml, it may contain a diagram reference:
							return textForm( titleOf(p,opts), languageValueOf(p.value,opts), (dT.maxLength&&dT.maxLength>CONFIG.textThreshold)? 'area' : 'line' )
						};
					case 'xs:enumeration':
						let separatedValues = p.value.split(','),
							vals = forAll( dT.values, function(v) { return {title:languageValueOf(v.value,opts),id:v.id,checked:separatedValues.indexOf(v.id)>-1} });
//						console.debug('xs:enumeration',p,pC,separatedValues,vals);
						if( typeof(pC.multiple)=='boolean'? pC.multiple : dT.multiple ) {
							return checkboxForm( titleOf(p,opts), vals )
						} else {
							return radioForm( titleOf(p,opts), vals )
						};
					case 'xs:dateTime':
						return textForm( titleOf(p,opts), p.value, 'line' );
					case 'xs:boolean':
						return checkboxInput( titleOf(p,opts), {checked:p.value=='true'} )
					case 'xs:integer':
					case 'xs:double':
						return '' /* ToDo */
				};
				return

				function renderDiagram(p,opts) {
					console.debug('renderDiagram',p);
					return '<div class="form-group form-active" >'
						+ 		'<div class="attribute-label" >'+titleOf(p,opts)+'</div>'
						+ 		'<div class="attribute-value">'
						+			itemBtns(p)
									// Add a container based on the propertyClass (which should be unique and since there is usually no property-id), 
									// so that the user can update and delete the diagram later on:
						+			'<div id="'+tagId(p['class'])+'">'+fileRef.toGUI( p.value, opts )+'</div>'
						+		'</div>'
						+ '</div>'
					
					function itemBtns(p) {
						// p['class'] is used to identify the property; 
						// it is supposed to be unique in the resource's properties
						// and at most one resource is edited in this session at any point in time.
						var bts = 	'<div class="btn-group btn-group-sm pull-right" >';
						if( !p.permissions || p.permissions.upd ) {
							bts +=			'<span class="btn btn-default btn-fileinput">' +
												'<span>'+i18n.IcoUpdate+'</span>' +
												'<input id="file'+p['class'].simpleHash()+'" type="file" onchange="'+myFullName+'.updateDiagram(\''+p['class']+'\')" />' + 
											'</span>'
						};  
						if( !p.permissions || p.permissions.del ) {
							bts +=			'<button class="btn btn-danger" data-toggle="popover" '
								+ 'onclick="'+myFullName+'.removeDiagram(\''+p['class']+'\')" title="'+i18n.LblDelete+'">'+i18n.IcoDelete+'</button>'
						};
						bts +=			'</div>';
						return bts
					}
				}
			}
		}
		function getResClass() {		
			// Let the user choose the class of the resource to be created later on:
			return new Promise((resolve, reject) => {	
				app.cache.selectedProject.readContent( 'resourceClass', forAll( opts.eligibleResourceClasses, function(rCId){return {id:rCId}} ))
					.done( function(rCL) {
						// store a clone and get the title to display:
						let resClasses = forAll( simpleClone( rCL ), function(rC) { rC.title=titleOf(rC,{lookupTitles:true}); return rC } );
						resClasses[0].checked = true;
//						console.debug('#2',simpleClone(cData.resourceClasses));
						let dlg = new BootstrapDialog({
							title: i18n.MsgSelectResClass,
							type: 'type-success',
						//	type: 'type-primary',
						//	size: BootstrapDialog.SIZE_WIDE,
							message: function (thisDlg) {
								var form = '<form id="attrInput" role="form" class="form-horizontal" ></form>';
									form += radioForm( i18n.LblResourceClass, resClasses );
								return $( form ) 
							},
							buttons: [{
									label: i18n.BtnCancel,
									action: function(thisDlg){ 
										reject({status:0,statusText:'Create Resource cancelled by the user'});
										thisDlg.close() 
									}
								},{ 	
									label: i18n.LblNextStep,
									cssClass: 'btn-success', 
									action: function (thisDlg) {
										resolve( itemById( resClasses, radioValue( i18n.LblResourceClass )));
										thisDlg.close()
									}  
								}]
						})
						.open()
					})
					.fail( reject )
			})
		}
	};
	self.updateDiagram = function(cId) {
        let f = document.getElementById("file"+cId.simpleHash()).files[0];
//		console.debug('updateDiagram',cId,f.name);
		readFile( f, function(data) {
				// "<div><p class=\"inline-label\">Plan:</p><p><object type=\"image/svg+xml\" data=\"files_and_images\\50f2e49a0029b1a8016ea6a5f78ff594.svg\">Arbeitsumgebung</object></p></div>"
				let fType = f.type||opts.mediaTypeOf(f.name),
					fName = 'files_and_images/'+f.name,
					newFile = { blob:data, id:'F-'+fName.simpleHash(), title:fName, type: fType, changedAt: new Date( f.lastModified || f.lastModifiedDate ).toISOString() };
				itemBy(toEdit.descriptions.concat(toEdit.other), 'class', cId ).value = '<object data="'+fName+'" type="'+fType+'">'+fName+'</object>';
				self.newFiles.push( newFile );
				document.getElementById(tagId(cId)).innerHTML = '<div class="forImagePreview '+tagId(fName)+'">'+fileRef.render( newFile )+'</div>'
		});
		return;
		
		function readFile( f, fn ) {
			const rdr = new FileReader();
			rdr.onload = function() {
				fn( new Blob([rdr.result], { type: f.type }) )
			};
			rdr.readAsArrayBuffer( f )
		}
	};
	self.removeDiagram = function(cId) {
//		console.debug('removeDiagram',cId,self.newRes);
		itemBy(self.newRes.properties, 'class', cId ).value = '';
		document.getElementById(tagId(cId)).innerHTML = ''
	};
	self.hide = function() {
	};
	return;
})

