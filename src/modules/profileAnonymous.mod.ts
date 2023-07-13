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
	userName: string;
	administrator: boolean;
	projectRoles: SpecifProjectRole[];
	login(): Promise<IMe>;
	logout(): void;
	myRole(prj: SpecifId): string;
	isAdministrator(): boolean;
}
/* class CProjectRole implements SpecifProjectRole {
	project: SpecifId = '';
	role: string = '';
	constructor(prj: SpecifId, rl: string) {
		this.project = prj;
		this.role = rl
	}
} */
moduleManager.construct({
	name: 'profileAnonymous'
}, function(self:IMe) {
	"use strict";

	self.init = function():boolean {
//		console.debug('me.init',opt);
		self.clear();

		// list with projects and roles of the current user:
		self.projectRoles = [
			{
				project: "any", // default
				role: "Reader"
			} as SpecifProjectRole
		];

		return true;
	};
	self.clear = function():void {
		self.loggedin = false;
		self.userName = CONFIG.userNameAnonymous;
		self.userPassword = CONFIG.passwordAnonymous;
		self.administrator = false; 	// current user is global admin?
		self.projectRoles = [];
	};
	self.login = function():Promise<IMe> {
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
				resolve(self)
			}
		)
	};
	self.myRole = function(prj: SpecifId): string {
		// first look for the specified project:
		let pR = LIB.itemBy(self.projectRoles, 'project', prj);
		if (pR) return pR.role;

		// finally look for a default:
		pR = LIB.itemBy(self.projectRoles, 'project', 'any');
		if (pR) return pR.role;
		throw Error('User profile of '+self.userName+' has no role.')
	};
/*	self.read = function (): Promise<IMe> {
//		console.debug('me.read');
		return new Promise(
			(resolve,reject) => {
				if (self.loggedin)
					resolve(self)
				else {
					self.clear();
					reject()
                }
			}
		)
		-- originally: --
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
		}) 
	}; */
	self.logout = function (): void {
		self.loggedin = false;
		//		server.logout()
	};
	self.isAdministrator = function():boolean {
		// The current user is generalAdmin:
		return self.administrator
	};
	return self;
});
