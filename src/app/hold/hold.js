angular.module( 'orderCloud' )

	.config( HoldConfig )
	.controller( 'HoldCtrl', HoldController );

function HoldConfig( $stateProvider ) {
	$stateProvider
		.state( 'hold', {
			parent: 'base',
			url: '/hold/:orderID',
			templateUrl: 'hold/templates/hold.tpl.html',
			controller: 'HoldCtrl',
			controllerAs: 'hold'
		})
}


function HoldController($scope, $stateParams) {
	var vm = this;
	console.log("ID", $stateParams.ID);
	console.log("orderID", $stateParams.orderID);
}
