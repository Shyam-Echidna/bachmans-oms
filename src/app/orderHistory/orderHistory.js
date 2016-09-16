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
			url: '/orderHistory/:userID/:orderId',
			templateUrl: 'orderHistory/templates/orderHistory.tpl.html',
			controller: 'OrderHistoryCtrl',
			controllerAs: 'orderHistory',
			resolve:{
				Order:function($q, $stateParams, OrderCloud){
					console.log("dddd", $stateParams);
					var d=$q.defer();
					OrderCloud.Users.GetAccessToken($stateParams.userID, impersonation)
					.then(function(data) {
							var completedOdr=[];
							OrderCloud.Auth.SetImpersonationToken(data['access_token']);
							if($stateParams.orderId!=""){
								console.log("trueeeeeeeeee");
								OrderCloud.As().Me.GetOrder($stateParams.orderId).then(function(res){
									completedOdr.push(res);
									d.resolve(completedOdr);
								})
							}
							else{
								OrderCloud.As().Me.ListOutgoingOrders().then(function(assignOrders){
								completedOdr=_.reject(assignOrders.Items,function(obj){
									return _.indexOf([obj.Status],'Unsubmitted') > -1
								});
									console.log("completedOrders", completedOdr);
									d.resolve(completedOdr);
								})
							}
					})	
					return d.promise;
				}
			}
		})
}
function OrderHistoryController($scope, $stateParams, Order) {
	var vm = this;
	vm.order=Order;
	if(vm.order.length>0){
		console.log("oredr", vm.order);
		$scope.uname=Order[0].FromUserFirstName + " " + Order[0].FromUserLastName;
		console.log("vm.uname", vm.uname);
		$scope.userID=$stateParams.userID;
		$scope.searchType='User';
		$scope.dateFormat="dd/MM/yyyy";
		$scope.gridHistory = {
			data: 'orderHistory.order',
			enableSorting: true,
			columnDefs: [
				{ name: 'ID', displayName:'Shipment Number', cellTemplate: '<div class="data_cell" ui-sref="buildOrder({ID:grid.appScope.userID,SearchType:grid.appScope.searchType,orderID:row.entity.ID,orderDetails:true})">{{row.entity.ID}}</div>', width:"16.5%"},
				{ name: 'DateCreated', displayName:'Order Placed On', cellTemplate: '<div class="data_cell">{{row.entity.DateCreated | date:grid.appScope.dateFormat}}</div>', width:"16.5%"},
				{ name: 'Occasion', displayName:'Occasion', width:"16.5%"},
				{ name: 'Total', displayName:'Total', cellTemplate: '<div class="data_cell">{{row.entity.Total | currency:$}}</div>', width:"16.5%"},
				{ name: 'xp.Status', displayName:'Order Status', width:"16.5%"},
				{ name: 'orderClaim', displayName:'', cellTemplate: '<div class="data_cell"><button ui-sref="orderClaim({userID:grid.appScope.userID, name:grid.appScope.uname, orderID:row.entity.ID})">Create Order Claim</button></div>', width:"16.5%"}
		]
	}
	}
}