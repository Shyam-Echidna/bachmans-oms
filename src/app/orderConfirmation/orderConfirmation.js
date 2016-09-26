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
			controllerAs: 'orderConfirmation',
			views: {
				'': {
					templateUrl: 'orderConfirmation/templates/orderConfirmation.tpl.html'
				},
				'orderConfirmationtop@orderConfirmation': {
					templateUrl: 'orderConfirmation/templates/orderConfirmation.top.tpl.html'
				}
			}
		})
}
function OrderConfirmationController($stateParams, OrderCloud, $http, PMCStoresURL, OrderPrintURL) {
	var vm = this;
	vm.order = {};
	vm.order.ID = $stateParams.ID;
	OrderCloud.Users.Get($stateParams.userID).then(function(user){
		vm.order.email= user.Email;
		vm.CSRStoreID = user.xp.CSRStoreID;
		vm.SelectStore = vm.CSRStoreID;
		vm.GetPMCStores();
	});
	vm.GetPMCStores = function(){
		$http.get(PMCStoresURL).success(function(res){
			vm.StoresList = res;
			vm.GetPrinters(vm.CSRStoreID);
		}).error(function(err){
			console.log(err);
		});
	};
	vm.GetCSRStore = function(){
		vm.SelectStore = vm.CSRStoreID;
		vm.GetPrinters(vm.CSRStoreID);
	};
	vm.GetPrinters = function(storeName){
		vm.SelectStore = storeName
		vm.SelectPrinter = "Select Printer";
		vm.printers = _.filter(vm.StoresList, function(row){
			return _.indexOf([storeName], row.storeName) > -1;
		});
	};
	vm.Print = function(){
		var params = [
			{
				"orderId": $stateParams.ID,
				"lineItem": ""
			}
		];
		$http.post(OrderPrintURL+vm.SelectStore, params).success(function(res){
			console.log("Print sent to printer.."+res);
		});
	};
}