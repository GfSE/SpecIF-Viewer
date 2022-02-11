/*!	User profile - simple implementation without identity and permissions.
	Dependencies: -
	(C)copyright enso managers gmbh (http://www.enso-managers.de)
	License and terms of use: Apache 2.0 (http://www.apache.org/licenses/LICENSE-2.0)
	Author: se@enso-managers.de, Berlin
	We appreciate any correction, comment or contribution via e-mail to maintenance@specif.de
    .. or even better as Github issue (https://github.com/GfSE/SpecIF-Viewer/issues)
*/
/*  Log into a special account CONFIG.userNameAnonymous/CONFIG.passwordAnonymous.  The server must have a corresponding user, of course.
	The adminstrators must take care that only roles and content are made available to this user which may be accessed publicly.
	The idea is to publish some content, e.g. documentation, without the need to login.
	Derived from profileUser.xxxx.mod.js - it serves the same API calls and is supposed to replace it when appropriate.
*/

// This will be merged with the basic declaration of IModule in moduleManager.ts:
// interface IModule {
interface IMe extends IModule {
	login(): Promise<void>;
	logout(): void;
	read(): Promise<void>;
	isAdmin(): boolean;
	isGeneralAdmin(): boolean;
}
moduleManager.construct({
	name: 'profileAnonymous'
}, function(self:IMe) {
	"use strict";

	self.init = function():boolean {
//		console.debug('me.init',opt);
		self.clear();
		return true;
	};
	self.clear = function():void {
		self.loggedin = false;
		self.generalAdmin = false; 	// current user is global admin?
		self.projectRoles = []; 	// list with projects and roles of the current user.
	};
	self.login = function():Promise<void> {
/*		console.info( 'Login: '+CONFIG.userNameAnonymous );
		if( app.server ) 
			return app.server.login( CONFIG.userNameAnonymous, CONFIG.passwordAnonymous )   // server must have a user profile with these credentials
				.done(function(rsp) {
					self.loggedin = true
				})
				.fail(function(rsp) {
					self.loggedin = false;
					message.show( i18n.MsgCredentialsUnknown, 'warning', CONFIG.messageDisplayTimeNormal );
					console.warn( "login '"+un+"': "+i18n.MsgCredentialsUnknown )
				})  
		// else: */
		return new Promise( 
			(resolve)=>{
				self.loggedin = true;
				resolve();
			}
		)
	};
	self.logout = function():void {
		self.loggedin = false;
//		server.logout()
	};
	self.read = function (): Promise<void> {
//		console.debug('me.read');
		return self.login()
/*		-- originally: --
		return server.me().read()
		.done( function(rsp) {
			self.projectRoles = rsp.projectRoles;
			self.loggedin = true;
		})
		.fail(function(xhr) {
//			console.debug( 'readMe failed: '+xhr.status );
			switch( xhr.status ) {
				case 401:  // Unauthorized
//					message.show( xhr );
					self.login();
					break;
				default:
					message.show( xhr );					
					self.logout();
			}
		})  */
	};
	self.isGeneralAdmin = function():boolean {
		// The current user is generalAdmin:
		return self.generalAdmin
	};
	self.isAdmin = function():boolean { 
		// The current user is projectAdmin for the specified project or generalAdmin:
		return self.generalAdmin
	};
/*	self.adminCnt = function() { 
		// return the number of times, where the current user is project admin or generalAdmin:
		return 0
	};
*/	return self;
});
