angular.module( 'orderCloud' )
	.config( OrderClaimConfig )
	.controller( 'OrderClaimCtrl', OrderClaimController );
function OrderClaimConfig( $stateProvider ) {
	$stateProvider
		.state( 'orderClaim', {
			parent: 'base',
			url: '/orderClaim/:userID/:name',
			templateUrl: 'orderClaim/templates/orderClaim.tpl.html',
			controller: 'OrderClaimCtrl',
			controllerAs: 'orderClaim'
		})
}
function OrderClaimController($scope) {

}