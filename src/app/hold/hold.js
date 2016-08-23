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
			controllerAs: 'hold',
			resolve:{
				Order: function(OrderCloud, $q, $stateParams){
					var dd=$q.defer();
					OrderCloud.Orders.ListOutgoing(null, null, $stateParams.orderID, null, null, 'ID').then(function(res){
						console.log(res);
						OrderCloud.LineItems.List(res.Items[0].ID, null, null, null, null, null, {"xp.Status":'OnHold'}).then(function(data){
							console.log(data);
							dd.resolve(data);
						})
					})
					return dd.promise;
				}
			}
		})
}


function HoldController($scope, $stateParams, Order) {
	var vm = this;
	vm.onholdlineitems=Order;
	console.log(vm.onholdlineitems);
	$scope.gridOptions = {
		data: 'hold.onholdlineitems.Items',
		enableSorting: true,
		columnDefs: [
			{ name: '"Allocated"', displayName:'Inventory Status'},
			{ name: 'DateCreated', displayName:'Order Placed On', cellTemplate: '<div class="data_cell">{{row.entity.DateCreated | date:grid.appScope.dateFormat}}</div>'},
			{ name: 'FromUserFirstName', displayName:'Sender Name'},
			{ name: 'BillingAddress', displayName:'Occassions'},
			{ name: 'Totl', displayName:'Wire Status Code'},
			{ name: 'xp.CSRID', displayName:'CSR ID'},
			{ name: 'ShippingCost', displayName:'', cellTemplate: '<div class="data_cell" ui-sref="hold({orderID:row.entity.ID})"><a> <i class="fa fa-upload"></i> Open Order</a></div>', width:"15%"}
		]
	};
}
