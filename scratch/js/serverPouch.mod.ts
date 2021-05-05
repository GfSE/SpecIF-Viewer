/*! PouchDB Library for Javascript.
    Dependencies: jQuery 3.0 and later, pouchdb
    (C)copyright 2010-2020 enso managers gmbh (http://www.enso-managers.de)
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
    Author: se@enso-managers.de, Berlin
    We appreciate any correction, comment or contribution!
*/

moduleManager.construct({
    name: "serverPouch"
}, (self)=>{
    "use strict";

    var db = null,
        remoteCouch = false;
    const reservedRoleNames = [ i18n.LblRoleGeneralAdmin, i18n.LblRoleProjectAdmin, i18n.LblRoleUserAdmin, i18n.LblRoleReader, i18n.LblRoleReqif ],
        sep = "|";
        
/////////////////////
    self.init = function( pr ) {
        console.debug("init server");
//        self.abortFlag = false;
        self.selectedPrj = {}

        self.type = 'PouchDB';
        remoteCouch = false; 
        // https://pouchdb.com/2014/06/17/12-pro-tips-for-better-code-with-pouchdb.html
        db = new PouchDB('SpecIF');
/*      db.changes({
          since: 'now',
          live: true
        }).on('change', showTodos) */
    };

/////////////////////
    self.projects = function() { 
        var self = this;
            
        self.read = function() {
            // return a list of projects with their meta information:
            return readL( 'project', 'all' )
        };
        return self
    };

    self.project = function( prj ) { 
        var self = this;
        self.selectedPrj = {id: prj.id};
/*        self.create = function() { 
            // create a project with metadata and types: 
            return new Promise( (resolve,reject)=>{
                    nP = {
                        id: prj.id,
                        title: prj.title,
                        description: prj.description,
                        tool: prj.tool
                    };
                createE('project', nP)
                .then( (r)=>{
                    return createL('dataType', prj.dataTypes)
                })
                .then( (r,t,s)=>{
                    return createL('propertyClass', prj.propertyClasses)
                })
                .then( (r,t,s)=>{
                    return createL('resourceClass', prj.resourceClasses)
                })
                .then( (r,t,s)=>{
                    return createL('statementClass', prj.statementClasses)
                })
                .then( resolve )
                .catch( reject )
            })
        };
        self.read = function() { 
            // read the project metadata, the types and the hierarchies, which are kept in a cache:
            if( !prj || !prj.id ) return null;
            console.debug( 'server.project.read - project.id: ', prj.id);
            return new Promise( (resolve,reject)=>{
                var pend = 6;
                readE( 'project', prj )
                .then( (pr)=>{
                    // read all categories in parallel:
                    readL( 'dataType', 'all' )
                    .then( ( dTs )=>{
                            pr.dataTypes = dTs;
//                            console.debug( 'dataTypes read: ', pr );
                            finalize( pr )
                        },
                        reject
                    );
                    readL( 'propertyClass', 'all' )
                    .then( ( pCs )=>{
                            pr.propertyClasses = pCs;
//                            console.debug( 'hierarchy types read: ', pr );
                            finalize( pr )
                        }, 
                        reject 
                    );
                    readL( 'resourceClass', 'all' )
                    .then( ( rCs )=>{
                            pr.resourceClasses = rCs;
//                            console.debug( 'resource types read: ', pr );
                            finalize( pr )
                        }, 
                        reject 
                    );
                    readL( 'statementClass', 'all' )
                    .then( ( sCs )=>{
                            pr.statementClasses    = sCs;
//                            console.debug( 'statement types read: ', pr );
                            finalize( pr )
                        }, 
                        reject 
                    );
                    readL( 'hierarchy', 'all' )
                    .then( ( hL )=>{
                            pr.specs = hL;
//                            console.debug( 'hierarchies read: ', pr );
                            finalize( pr )
                        }, 
                        reject 
                    );
                    readL( 'file', 'all' )
                    .then( ( fL )=>{
                            pr.files = fL;
//                            console.debug( 'hierarchies read: ', pr );
                            finalize( pr )
                        },
                        reject 
                    );
                })
                .catch( reject )
            
                function finalize( prj ) {
                    if( --pend<1 ) resolve( prj, '', {status:200} )        // result, textStatus, xhr
                }
            })
        };
        self.update = function() { 
            // update the project header attributes:
            var nP = {
                    id: prj.id,
                    title: prj.title,
                    description: prj.description,
                    tool: prj.tool
                };
            return updateE( 'project', nP )
        };
        self.remove = function() { 
            // delete a project with all its content:
            return new Promise( (resolve,reject)=>{
                // delete all elements of the current project:
                deleteL('file', 'all')
                .then( ()=>{
                    return deleteL('hierarchy', 'all')
                })
                .then( ()=>{
                    return deleteL('statement', 'all')
                })
                .then( ()=>{
                    return deleteL('resource', 'all')
                })
                .then( ()=>{
                    return deleteL('statementClass', 'all')
                })
                .then( ()=>{
                    return deleteL('resourceClass', 'all')
                })
                .then( ()=>{
                    return deleteL('propertyClass', 'all')
                })
                .then( ()=>{
                    return deleteL('dataType', 'all')
                })
                .then( ()=>{
                    return deleteE('project', self.selectedPrj)
                })
                .then( resolve )
                .catch( reject )
            })
        }; 

/////////////////////        
        self.createContent = function( ctg, item ) {
//            console.debug('server.createContent',ctg,item);
            return Array.isArray(item)?createL( ctg, item ):createE( ctg, item )
        };
        self.readContent = function( ctg, item ) {
//            console.debug('server.readContent',ctg,item);
            // return a list of specified items, a single specified item or a list of items satisfying a condition:
            return Array.isArray(item)?readL( ctg, item ):item.id?readE( ctg, item ):readL( ctg, 'all', item )
        };
        self.updateContent = function( ctg, item ) {
            console.debug('server.updateContent',ctg,item)
            return Array.isArray(item)?updateL( ctg, item ):updateE( ctg, item )
        };
        self.deleteContent = function( ctg, item ) {
            return Array.isArray(item)?deleteL( ctg, item ):deleteE( ctg, item )
        };
        self.readRevisions = function( ctg, item ) {
            return Array.isArray(item)?null:revisionsE( ctg, item )
        };

        // prevent any create, update and delete operations, requires project-admin or general-admin role:
        self.lock = function() {
            // until unlocked again, items returned by the server will have the property 'readOnly="true"' (as far as implemented)
            return PUT( projectsURL+'/'+prj.id+'/lock.json' )
        };
        self.unlock = function() {
            return PUT( projectsURL+'/'+prj.id+'/unlock.json' )
        };
*/        return self
    };    // end of function self.project()
    
/////////////////////        
    // ToDo: implement mine().roles().read() ... 
/*    self.me = function() {
        // Manage the profile and the project roles of the current user.
        var self = this;
        self.read = function() {
            // dummy data for the time being:
            var dta = {
                userName: 'userName',
                firstName: 'firstName',
                lastName: 'lastName',
                email: 'email',
                organizations: [ { name: 'organization' } ],
                generalAdmin: true,
                projectRoles: []
            };
            // Returns {userName: un, .., projects: [{id: id, role: rl}, ..], organizations: [{ name: xy }, ..]}
            return new Promise( (resolve,reject)=>{
                resolve( dta, '', {status: 200} )
            })
        };
        self.update = function() {
            // the server supports only one org per user, so far:
            if( usr.organizations.length ) usr.organization = usr.organizations[0].name;
            usr.organizations = undefined;
            return PUT( CONFIG.serverURL+'/me.json', usr )
        };
        return self
    };  
    self.users = function() { 
        // ToDo: allow a parameter with a list of users for which results are returned similar to self.objects()....
//        console.debug('users');
        var self = this;
        self.read = function() { 
            return GET( usersURL+'.json' )
                    .done( function(dta) { 
                        dta.users = forAll( dta.values, transform.user.fromServer );
                        dta.users.sort(function(laurel, hardy) { 
                            laurel = laurel.userName.toLowerCase();
                            hardy = hardy.userName.toLowerCase();
                            return laurel == hardy ? 0 : (laurel < hardy ? -1 : 1) 
                        });
                        delete dta.values
                    })
        };
        return self
    };
    self.usersWithRoles = function() { 
//            console.debug('usersWithRoles');
            var self = this;
            self.read = function() { 
//                console.debug('users.roles.read');
                return GET( CONFIG.serverURL+'/usersWithRoles.json' )
                    .done( function(dta) { 
                        // Simplify the structure of the server response
                        // Returns { users: [{userName: un, .., projectRoles: [{id: id, role: rl}, ..]}, ..]}
                        // List only those projects for which the user has a role.
                        dta.users = forAll( dta.values, transform.user.fromServer );
                        dta.users.sort(function(laurel, hardy) { 
                            laurel = laurel.userName.toLowerCase();
                            hardy = hardy.userName.toLowerCase();
                            return laurel == hardy ? 0 : (laurel < hardy ? -1 : 1) 
                        });
                        delete dta.values
                    })
            };
            return self
    };
    self.user = function( usr ) { 
        // Manage the profile and the project roles of the specified user:
        var self = this;
//        console.debug('user',usr);
        self.create = function() {
            // the server supports only one org per user, so far:
            usr.organization = usr.organizations[0].name;
            delete usr.organizations;
            usr.admin = usr.generalAdmin;
            delete usr.generalAdmin;
            return POST( usersURL+".json", usr )
        };
        self.read = function() {
            // returns a user as {userName: name, organization: [org, ..], ... }
//            console.debug( 'user.read', usr );
            var urDO = $.Deferred(); 
            GET( usersURL+"/"+usr.userName+".json" )
                .done( function(dta, textStatus, xhr) {
                    // Returns {userName: un, .., projects: [{id: id, role: rl}, ..], organizations: [{ name: xy }, ..]}
                    urDO.resolve( transform.user.fromServer( dta ), textStatus, xhr );
                })
                .fail( urDO.reject );
            return urDO
        };
        self.update = function() {
            if( usr.userName==CONFIG.userNameAnonymous ) return null;
            // the server supports only one org per user, so far:
            if( usr.organizations.length ) usr.organization = usr.organizations[0].name;
            delete usr.organizations;
            usr.admin = usr.generalAdmin;
            delete usr.generalAdmin;
            return POST( usersURL+"/"+usr.userName+".json", usr )
        };
        self.remove = function() { 
            return DELETE( usersURL+"/"+usr.userName+".json" )
        };
        self.roles = function() {
            var self = this;
            self.read = function() {
                // Returns {userName: un, .., projectRoles: [{id: prjID, role: rl}, ..]}
                // Only those projects are listed for which the user has a role, but not the others.
                return self.usersWithRoles().read()
                    .done( function(dta) {
                        // Filter the project roles of the specified user:
                        for( var i=0, I=dta.users.length; i<I; i++ ) {  // iterate users
                            if( dta.users[i].userName === usr ) {   
                                dta.user = dta.users[i];
                            };
                        };
                        delete dta.users
                    });
            };
            return self
        };
        return self
    };    // end of self.user()
    self.organizations = function() { 
        var self = this;
        self.read = function() {
            var self = this;
        };
        return self
    };
    self.organization = function( org ) { 
        var self = this;
        self.read = function() {
            var self = this;
        };
        self.users = function() {
            var self = this;
            self.read = function() {
                var self = this;
            };
            return self
        };
        return self
    };
*/        

/////////////////////
/*    self.login = function( un, pw ) {
        var lDO = $.Deferred();
        return lDO
    };
    self.logout = function() {
    };
*/
/////////////////////        
    self.abort = function() {
//        self.abortFlag = true
    };
        
/*        // ++++++++++++++++++++++++++
        function createL( ctg, eL ) {
//          console.debug('createL',ctg,eL);
            if( ctg=='node' ) return null;  // not supported
            return new Promise( (resolve,reject)=>{
                if( eL && eL.length>0 ) {
                    let nL = forAll(eL, (e)=>{ return dbE( ctg, e ) });
//                  console.debug('createL',ctg,eL,nL);
                    db.bulkDocs( nL )
                        .then( function(res) {
//                          console.debug('Create done:', res );
                            resolve( res, '', {status:201} )        // result, textStatus, xhr
                        })
                        .catch( function(err) {
//                          console.debug('Read-list fail:', err );
                            reject( {status:411, statusText:'Creating list in DB failed'} )
                        });
                } else {
                    resolve( [], '', {status:201} )        // result, textStatus, xhr
                }
            })
        }
        function createE( ctg, el ) {
            if( !ctg || !el ) return null;
//          console.debug('createE',ctg,el);
            if( ctg=='node' ) return null;  // not supported
            
            return new Promise( (resolve,reject)=>{
                db.put( dbE( ctg, el ) )
                .then( (res)=>{
//                  console.debug('Create done:', res );
                    resolve( res, '', {status:201} )        // result, textStatus, xhr
                })
                .catch( (err)=>{
//                  console.debug('Create fail:', err );
                    reject( {status:411, statusText:'Creating element in DB failed'} )
                })
            })
        }
        function readL( ctg, sel, opts ) {
            if( ctg=='node' ) return null;  // not supported
            if( !opts ) opts = {};
//            console.debug('readL', ctg, sel, opts );
            // get the documents of the given category
            // - 'all'
            // - listed by id: [ id1, id2, .., idN ]
            // - query resource: { class: id }
            // - query statement: { resource: id }
            return new Promise( (resolve,reject)=>{
                if( sel==='all' ) {
                    // return a list of items satisfying a condition:
                    var path = dbPath(ctg),
                        options = {
                            include_docs: true,
                            startkey: path,
                            endkey: path+'\ufff0'
                    };
                    if( ctg=='file' ) {
                        options.attachments = true;
                        options.binary = true
                    }; 
//                    console.debug('readL 2', options );
                    db.allDocs(options)
                    .then( (res)=>{
//                        console.debug('Read-list done:', clone(res) );
                        if( opts ) {
                            // filter the result list according to the specified conditions:
                            let i=null;
                            switch( ctg ) {
                                case 'statement':
                                    if( opts.resource )
                                        // keep all relations which have the specified resource as subject/source or object/target:
                                        for( i=res.rows.length-1;i>-1;i-- ) {
                                            // disregard the subject and object revision for now:
                                            if( res.rows[i].doc.subject.id!=opts.resource.id && res.rows[i].doc.object.id!=opts.resource.id )
                                                res.rows.splice(i,1)
                                        };
                                    // no break
                                case 'resource':
                                case 'hierarchy':
                                    if( opts.type )
                                        // keep all instances of the specified specType/classclass:
                                        for( i=res.rows.length-1;i>-1;i-- ) {
                                            if( res.rows[i].doc['class']!=opts['class'] )
                                                res.rows.splice(i,1)
                                        }
                            }
                        };
//                        console.debug('Read-list done:', res );
                        resolve( specifL( ctg, res ), '', {status:200} )        // result, textStatus, xhr
                    })
                    .catch( (err)=>{
//                        console.debug('Read-list fail:', err );
                        reject( {status:411, statusText:'Reading list from DB failed'} )
                    });
                    return
                };
                // else:
                if( Array.isArray(sel) ) {
                    // return a list of specified items:
                    if( sel.length>0 ) {
                        var options = {
                                include_docs: true,
                                keys: forAll( sel, function(e) { return dbId(ctg,e) } )
                        };
                        if( ctg=='file' ) {
                            options.attachments = true;
                            options.binary = true
                        }; 
//                        console.debug('readL 3', options );
                        db.allDocs(options)
                        .then( function(res) {
//                          console.debug('readL done:', res );
                            resolve( specifL( ctg, res ), '', {status:200} )        // result, textStatus, xhr
                        })
                        .catch( function(err) {
//                          console.debug('readL fail:', err );
                            reject( {status:411, statusText:'Reading list from DB failed'} )
                        });
                    } else {
                        resolve([],'',{status: 200})
                    };
                    return
                };
                // default: 
                console.error('Invalid parameter when reading from DB');
                reject( {status:412, statusText:'Invalid parameter when reading from DB'} )
            })
        }
        function readE( ctg, el, opts ) {
            if( ctg=='node' ) return null;  // not supported
            if( !opts ) opts = {};
//            console.debug('readE', ctg, el, opts );
            if( el.revision ) opts.rev = el.revision;
            if( ctg=='file' ) {
                opts.attachments = true;
                opts.binary = true
            };
//          console.debug('readE',ctg,el,opts);
            return new Promise( (resolve,reject)=>{
                db.get( dbId(ctg,el), opts )
                .then( (res)=>{
//                  console.debug('readE done:', res );
                    resolve( specifE( ctg, res ), '', {status:200} )        // result, textStatus, xhr
                })
                .catch( (err)=>{
//                  console.debug('Reading element from DB failed:', err );
                    reject( {status:411, statusText:'Reading element from DB failed'} )
                })
            })
        } */
        function updateL( ctg, eL ) {
            // Update a list of elements,
            // be sure to read the elements shortly before updating them so as to minimize the risk of conflicts:
//            console.debug('updateL',ctg,eL);
        /*    if( ctg=='node' ) return null;  // not supported

            var nL = forAll( eL, (e)=>{ let n = dbE( ctg, e ); n._rev=e.revision; return n } );
//            console.debug('updateL',ctg,eL,nL);
            // .. and submit the updated elements:
            return db.bulkDocs( nL ) */
            
        /*    original code:
            let nL=[], i, I;
            // assuming that both length and sequence of eL and dL are equal:
            for( i=0,I=dL.length;i<I;i++ ) {
                nL.push( dbE( ctg, eL[i] ) );        // in readL wird _id --> id und hier wieder zur?ck gewandelt ...
                //  add _rev property to every list element:
                nL[i]._rev = eL[i].revision
            };
//            console.debug('updateL',ctg,eL,nL);
            // .. and submit the updated elements:
            var uPr = $.Deferred();
            db.bulkDocs( nL )
                .then( function(res) {
//                    console.debug('Update-list done:', res );
                    uPr.resolve( res, '', {status:200} )        // result, textStatus, xhr
                })
                .catch( function(err) {
//                    console.debug('Update-list fail:', err );
                    uPr.reject( {status:414, statusText:'Update-list failed'} )
                })
            return uPr */ 
        }
        function updateE( ctg, el ) {
            // Update an element,
            // be sure to read the element shortly before updating it so as to minimize the risk of conflicts:
//            console.debug('updateE 0', ctg, el );
            if( ctg=='node' ) return null;  // not supported

            let nE = dbE( ctg, el );
            nE._rev = el.revision;
//            console.debug('updateE', ctg, el, nE );
            return db.put( nE )
            
        /*    original code:
            return new Promise( (resolve,reject)=>{
                let nE = dbE( ctg, el );
                nE._rev = el.revision;
                console.debug('updateE', ctg, el, nE );
                db.put( nE )
                    .then( function() { 
                        console.debug('updateE done',ctg);
                        resolve( null, '', {status:200} ) 
                    })
                    .catch( function(err) {
                        console.debug('updateE fail:',ctg,err );
                        reject( {status:414, statusText:'Updating element in DB failed'} ) 
                    })
            }) */
        }
/*        function deleteL( ctg, eL ) {
            // delete a list of elements:
//            console.debug('deleteL',ctg,eL);
            if( ctg=='node' ) return null;  // not supported
            return new Promise( (resolve,reject)=>{
                readL( ctg, eL )        // get the latest revisions. ToDo: omit?
                    .then( ( dL )=>{
                        let nL = forAll(dL, (el)=>{
                                                el._deleted = true;
                                                return dbE( ctg, el )        // in readL wird _id --> id und hier wieder zur?ck gewandelt ...
                                        });
//                        console.debug('deleteL',ctg,eL,nL);
                        db.bulkDocs( nL )
                            .then( (res)=>{
//                                console.debug('Delete-list done:', res );
                                resolve( res, '', {status:200} )        // result, textStatus, xhr
                            })
                            .catch( (err)=>{
//                                console.debug('Delete-list fail:', err );
                                reject( {status:414, statusText:'Delete-list failed'} )
                            })
                    })
                    .catch( reject )
            })
        }
        function deleteE( ctg, el ) {
            // delete an element:
            if( ctg=='node' ) return null;  // not supported
            return new Promise( (resolve,reject)=>{
                db.get( dbId(ctg,el) )
                    .then( (doc)=>{
//                        console.debug('db.get done:', doc );
                        return db.remove( doc._id, doc._rev )
                    })
                    .then( ()=>{ 
//                        console.debug('db.remove done');
                        resolve( undefined, '', {status:200} ) 
                    })
                    .catch( (err)=>{
//                        console.debug('deleteE fail:', err );
                        reject( {status:413, statusText:'Deleting from DB failed'} ) 
                    })
            })
        }
        function revisionsE( ctg, item ) {
//            console.debug('revisionsE', ctg, item);
            return new Promise( (resolve,reject)=>{
                var    opts = {
                        revs_info: true
                    };
                readE(ctg,item,opts)
                .then( (rL)=>{
                    var vL = [];
                    for( var i=0, I=rL._revs_info.length; i<I; i++ )
                        if( rL._revs_info[i].status=='available' ) vL.push( { id:rL.id, revision:rL._revs_info[i].rev } );
                    resolve( vL, '', {status:200} ) 
                })
                .catch( reject )
            })
        }

//        function dbPath( ctg, cls ) {    // category, class
        function dbPath( ctg ) {
            // Create a database key component for the category;
            // must allow a unique selection upon read:
            let pId = self.selectedPrj.id+sep;
            // the path contains the specType/class in case of instances to allow queries per class:
        //    cls = ((typeof cls == 'string' && cls!='all')?cls+sep:'');
            switch( ctg ) {
                case 'dataType':         return pId+'TD'+sep;
                case 'propertyClass':    return pId+'CH'+sep;
                case 'resourceClass':     return pId+'CR'+sep;
                case 'statementClass':     return pId+'CS'+sep;
        //        case 'resource':         return pId+'R'+sep+cls;
        //        case 'statement':         return pId+'S'+sep+cls;
        //        case 'hierarchy':         return pId+'H'+sep+cls;
        // Basically the idea is not bad to include the class into the db-Id, as it allows to directly retrieve all instances of a certain class.
        // However, we only have the instance ids in the hierarchy and so we cannot retrieve a single instance before we find out its class.
                case 'resource':         return pId+'R'+sep;
                case 'statement':         return pId+'S'+sep;
                case 'hierarchy':         return pId+'H'+sep;
                case 'file':            return pId+'F'+sep;
                case 'project':            return 'P'+sep;
        //        case 'all':                return pId;
            };
            return null
        } */
        function dbId( ctg, e ) {
            // construct a compound-id in a way that most DB-queries can be made without an index;
            // the element's id is always at the end:
        /*    var cls=null;
            switch( ctg ) {
                case 'resource':
                case 'statement':
                case 'hierarchy':
                    cls = e.specType;
            };
            return dbPath(ctg,cls)+e.id  */
            return dbPath(ctg)+e.id
        }
        function specifId( id ) { 
            // remove all additional info from the compound-id to obtain the real SpecIF-id,
            // which is always at the end:
            id = id.split(sep);
            return id[id.length-1]
        }
        function dbE( ctg, e ) { 
            // transform a SpecIF element to a db element:
//            console.debug('dbE',e);
            var n = clone(e);  // the cached items must remain unchanged
            n._id = dbId( ctg, e );
            delete n.id;
        //    n.category = ctg;
            switch( ctg ) {
        /*        case 'hierarchy':
                    delete n.resourceRefs;
                    break; */
                case 'file':
                    if( e.blob ) {
                        // create an attachment:
                        n._attachments = {};
                        n._attachments[e.id] = { content_type: e.blob.type || e.type, data: e.blob };
                        delete n.type
                    }
            };
//            console.debug('dbE',ctg,e,n);
            return n
        }
        function clone( o ) { 
            // applied to all elements before storing in the DB to avoid that any modification affects the elements themselves.
            // does only work, if none of the property values are references or functions:
                function clonePr(p) {
                    return ( typeof(p) == 'object' )? clone(p) : p
                }
            var n={};
            for( var p in o ) {
                // skip certain properties, they will be recreated upon reading the document:
                // - especially the permissions ('upd','del','cre','rea') must be set for the user at that point in time,
                // - 'parent','predecessor','hierarchy' are specified to insert a node, but are not any more necessary once inserted,
                // - 'blob' will be stored as attachment.
                if( ['upd','del','blob','resourceRefs','cre','rea','revision','parent','predecessor','hierarchy'].indexOf(p)>-1 ) 
                    continue;
                // else
                if( Array.isArray(o[p]) ) {
                    n[p] = [];
                    for( var i=0, I=o[p].length;i<I;i++ )
                        n[p].push( clonePr(o[p][i]) );
                    continue
                };
                // else
                n[p] = clonePr(o[p])
            };
//            console.debug('clone',o,n);
            return n
        }
        function specifE( ctg, e ) { 
            // transform a db element to a SpecIF element:
//            console.debug('specifE',e);
            e.id = specifId(e._id); 
            delete e._id; 
            e.revision = e._rev;
            delete e._rev; 
            let adm = userProfile.iAmAdmin()
            e.del = e.upd = adm;
            switch( ctg ) {
                case 'propertyClass':
                case 'resourceClass':
                case 'statementClass':
                    if( e.attributeTypes ) {
                        let ai=null, i=null;
                        for( i=e.attributeTypes.length-1;i>-1;i-- ) {
                            ai = e.attributeTypes[i];
                            ai.cre = ai.del = ai.rea = ai.upd = adm
                        }
                    };
                    // no break
                case 'project':
                    e.cre = e.rea = adm;
                    break;
                case 'hierarchy':
                    e.resourceRefs = referencedResources( e );
                case 'resource':
                case 'statement':
                    // missing attributes are added shortly before displaying, if so desired.
                    if( e.attributes )
                        for( var i=e.attributes.length-1;i>-1;i-- ) {
                            if( isHiddenAttr(e.attributes[i].longName) )
                                // hide, if configured in CONFIG.hiddenAttributes:
                                e.attributes.splice(i,1)
                            else
                                e.attributes[i].del = e.attributes[i].upd = adm
                        }
                    break;
                case 'file':
                    e.blob = e._attachments[e.id].data;
                    e.type = e._attachments[e.id].content_type;
                    delete e._attachments
            };
            return e
        }
        function specifL( ctg, l ) { 
            // transform a db list to a SpecIF list:
            return forAll( l.rows, function(e) { return specifE( ctg, e.doc ) } )
        }
        function isHiddenAttr( pN ) {  // pN is a property name/title
            // ToDo: The property title may not be defined; the propertyClass' title shall then be used.
            return ( CONFIG.hiddenAttributes.indexOf( pN.toJsId() )>-1 ) // is hidden, if it is configured in the list
        }
        function referencedResources( sp ) {
            // return a flat list of resource references, e.g. for the reports:
            // 'sp' is a spec with jqTree made from a RIF/ReqIF spec (aka outline) with links to the objects.
            var oRefs = [];

                function getElements( jqT ) {
                    for( var j=0, J=jqT.length; j<J; j++) {
                        oRefs.push( jqT[j].ref );
                        if(    jqT[j].children.length )  
                            getElements( jqT[j].children ) // next level, if it exists
                    };
                    return jqT
                }
            if( sp.children && sp.children.length ) {
                // get the first level children, then recursively their's:
                getElements( sp.children )    // skip the root node with the name of the spec
            };
            return oRefs
        }
/*        // Assure that the server will not reject the following data for formal reasons:
        self.validateUserName = function(un) { 
//            var re = /^[A-Z0-9ยง$_\-]+$/i;  // including the dash
            let re = /^[A-Z0-9ยง$_]+$/i;
            return re.test(un)
        };
        self.validatePassword = function(pw) { 
            let re = /^[A-Z0-9*#ยง$_\-]{5,}$/i;  // at least 5 chars
            return re.test(pw)
        };
        self.validateEmail = function(eml) { 
            return !eml || RE.Email.test(eml)  // allowed is no e-mail address or a correct one
        };
        self.validateRoleName = function(rn) { 
            // the roleName must be different from any rolename defined in the server:
            if( !rn ) return false;
            rn = rn.toUpperCase();
            if( serverReservedRoleNames.indexOf( rn )>-1 ) return false;
            if( reservedRoleNames.indexOf( rn )>-1 ) return false;
            // the roleName must use only certain characters:
            var re = /^[A-Z0-9ยง$_\-]+$/i;  // including the dash
            return re.test(rn)
        }; 
        self.isReservedRoleName = function( rN ) {
            if( !rN ) return false;
            return reservedRoleNames.indexOf( rN )>-1;
        };
        self.equivalentRoleName = function( rN ) {
            if( !rN ) return false;
            var idx = serverReservedRoleNames.indexOf( rN.toUpperCase() );
            if( idx>-1 ) return reservedRoleNames[idx]; 
            return rN
        }; */
    return self
})    // end of constructor function Server
