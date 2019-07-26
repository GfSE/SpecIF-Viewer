/* 	Log into a special account CONFIG.userNameAnonymous/CONFIG.passwordAnonymous.  The server must have a corresponding user, of course.
	The adminstrators must take care that only roles and content are made available to this user which may be accessed publicly.
	The idea is to publish some content, e.g. documentation, without the need to login.
	Derived from profileUser.xxxx.mod.html - it serves the same API calls and is supposed to replace it when appropriate.
*/

modules.construct({
	name: 'profileAnonymous'
}, function(self) {
	"use strict";
	// ToDo: Get rid of all dependencies except server.
/*	var returnView = null;
	function returnToCaller() {
		self.hide();
		returnView()
	}  */

	self.loggedin = false;
	self.generalAdmin = false; 	// current user is global admin?
	self.projectRoles = [];  	// list with projects and roles of the current user.
	
	self.init = function( opt ) {
//		console.debug('me.init',opt);
	//	returnView = opt.callback
		return true
	};
	self.clear = function() {
		self.loggedin = false;
		self.generalAdmin = false;
		self.projectRoles = []
	};
	self.login = function() {
		var pDO = $.Deferred();
		self.loggedin = true;
		pDO.resolve();
		return pDO
/*		console.info( 'Login: '+CONFIG.userNameAnonymous );
		return server.login( CONFIG.userNameAnonymous, CONFIG.passwordAnonymous )   // server must have a user profile with these credentials
			.done(function(rsp) {
				self.loggedin = true;
				returnToCaller()  ???
			})
			.fail(function(rsp) {
				self.loggedin = false;
				message.show( i18n.MsgCredentialsUnknown, 'warning', CONFIG.messageDisplayTimeNormal );
				console.info( "login '"+un+"': "+i18n.MsgCredentialsUnknown )
			})  */
	};
	self.logout = function() {
		self.loggedin = false;
//		server.logout()
	};
	self.read = function() {
//		console.debug('me.read');
		var pDO = $.Deferred();
		self.loggedin = true;
		pDO.resolve();
		return pDO
/*		return server.me().read()
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
	self.isGeneralAdmin = function() {
		// The current user is generalAdmin:
		return false
	};
	self.isAdmin = function(prj) { 
		// The current user is projectAdmin for the specified project or generalAdmin:
		return false
	};
/*	self.adminCnt = function() { 
		// return the number of times, where the current user is project admin or generalAdmin:
		return 0
	};
*/	return self;
});
