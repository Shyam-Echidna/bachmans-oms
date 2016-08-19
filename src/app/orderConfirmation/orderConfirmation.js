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
function OrderConfirmationController($stateParams, OrderCloud, $http, PMCStoresURL) {
	var vm =this;
	vm.order={};
	vm.order.ID=$stateParams.ID;
	OrderCloud.Users.Get($stateParams.userID).then(function(user){
		vm.order.email= user.Email;
		vm.CSRStoreID = user.xp.CSRStoreID;
		vm.SelectStore = vm.CSRStoreID;
	});
	vm.GetPMCStores = function(){
		$http.get(PMCStoresURL).success(function(res){
			vm.StoresList = res;
		}).error(function(err){
			console.log(err);
		});
	};
	vm.GetCSRStore = function(){
		vm.SelectStore = vm.CSRStoreID;
	};
	vm.Print = function(){
		alert("Printed");
	};
}