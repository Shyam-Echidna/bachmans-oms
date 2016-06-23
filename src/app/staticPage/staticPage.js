angular.module( 'orderCloud' )

	.config( staticPageConfig )
	.controller( 'staticPageCtrl', staticPageController )
	.controller( 'aboutCtrl', aboutController )
	.controller( 'termsConditionsCtrl', termsConditionsController )
	.controller( 'supportCtrl', supportController )
	.controller( 'contactCtrl', contactController )

;

function staticPageConfig( $stateProvider ) {
	$stateProvider
		.state( 'staticPage', {
			parent: 'base',
			url: '/about',
			templateUrl: 'staticPage/templates/about.tpl.html',
			controller: 'aboutCtrl',
			controllerAs: 'about'
		})
		.state( 'staticPage.about', {
			parent: 'base',
			url: '/about',
			templateUrl: 'staticPage/templates/about.tpl.html',
			controller: 'aboutCtrl',
			controllerAs: 'about'
		})
		.state( 'staticPage.termsConditions', {
			parent: 'base',
			url: '/termsConditions',
			templateUrl: 'staticPage/templates/termsConditions.tpl.html',
			controller: 'termsConditionsCtrl',
			controllerAs: 'termsConditions'
		})
		.state( 'staticPage.support', {
			parent: 'base',
			url: '/support',
			templateUrl: 'staticPage/templates/support.tpl.html',
			controller: 'supportCtrl',
			controllerAs: 'support'
		})
		.state( 'staticPage.contact', {
			parent: 'base',
			url: '/contact',
			templateUrl: 'staticPage/templates/contact.tpl.html',
			controller: 'contactCtrl',
			controllerAs: 'contact'
		})
}

function staticPageController( ) {
	var vm = this;
}
function aboutController( ) {
	var vm = this;
}
function termsConditionsController( ) {
	var vm = this;
}
function supportController( ) {
	var vm = this;
}
function contactController( ) {
	var vm = this;
}