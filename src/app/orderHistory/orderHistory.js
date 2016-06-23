angular.module( 'orderCloud' )

	.config( OrderHistoryConfig )
	.controller( 'OrderHistoryCtrl', OrderHistoryController );
	
var impersonation = {
	"ClientID": "8836BE8D-710A-4D2D-98BF-EDBE7227E3BB",
	"Claims": ["FullAccess"]
};
function OrderHistoryConfig( $stateProvider ) {
	$stateProvider
		.state( 'orderHistory', {
			parent: 'base',
			url: '/orderHistory/:userID/:name',
			templateUrl: 'orderHistory/templates/orderHistory.tpl.html',
			controller: 'OrderHistoryCtrl',
			controllerAs: 'orderHistory',
			resolve:{
				Order:function($q, $stateParams, OrderCloud){
					console.log("dddd", $stateParams);
					var d=$q.defer();
					OrderCloud.Users.GetAccessToken($stateParams.userID, impersonation)
					.then(function(data) {
							OrderCloud.Auth.SetImpersonationToken(data['access_token']);
							OrderCloud.As().Me.ListOutgoingOrders().then(function(assignOrders){
								console.log("assignOrders", assignOrders);
								d.resolve(assignOrders);
							})
					})	
					return d.promise;
				}
			}
		})
}
function OrderHistoryController($scope, $stateParams, Order) {
	var vm = this;
	vm.uname=$stateParams.name;
	$scope.userID=$stateParams.userID;
	$scope.searchType='User';
	vm.order=Order;
	console.log("oredr", vm.order);
	$scope.dateFormat="dd/MM/yyyy";
	$scope.gridHistory = {
		data: 'orderHistory.order.Items',
		enableSorting: true,
		columnDefs: [
			{ name: 'ID', displayName:'Shipment Number', cellTemplate: '<div class="data_cell" ui-sref="buildOrder({ID:grid.appScope.userID,SearchType:grid.appScope.searchType,orderID:row.entity.ID,orderDetails:true})">{{row.entity.ID}}</div>'},
			{ name: 'DateCreated', displayName:'Order Placed On', cellTemplate: '<div class="data_cell">{{row.entity.DateCreated | date:grid.appScope.dateFormat}}</div>'},
			{ name: 'Occasion', displayName:'Occasion'},
			{ name: 'Total', displayName:'Total', cellTemplate: '<div class="data_cell">{{row.entity.Total | currency:$}}</div>'},
			{ name: 'Status', displayName:'Order Status'},
			{ name: 'orderClaim', displayName:'', cellTemplate: '<div class="data_cell"><button>Create Order Claim</button></div>'}
	]
}
}