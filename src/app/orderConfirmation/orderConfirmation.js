angular.module( 'orderCloud' )
	.config( OrderConfirmationConfig )
	.controller( 'OrderConfirmationCtrl', OrderConfirmationController );
function OrderConfirmationConfig( $stateProvider ) {
	$stateProvider
		.state( 'orderConfirmation', {
			parent: 'base',
			url: '/orderConfirmation/:userID/:ID',
			templateUrl: 'orderConfirmation/templates/orderConfirmation.tpl.html',
			controller: 'OrderConfirmationCtrl',
			controllerAs: 'orderConfirmation'
		})
}
function OrderConfirmationController($stateParams, OrderCloud) {
	var vm =this;
	vm.order={};
	vm.order.ID=$stateParams.ID;
	OrderCloud.Users.Get($stateParams.userID).then(function(user){
		vm.order.email= user.Email;
	});
}