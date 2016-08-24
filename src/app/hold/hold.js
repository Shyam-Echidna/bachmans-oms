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
				Order: function(OrderCloud, $q, $stateParams, LineItemHelpers){
					var dd=$q.defer();
					OrderCloud.Orders.ListOutgoing(null, null, $stateParams.orderID, null, null, 'ID').then(function(res){
						console.log(res);
						OrderCloud.LineItems.List(res.Items[0].ID, null, null, null, null, null, {"xp.Status":'OnHold'}).then(function(data){
							console.log(data);
							LineItemHelpers.GetProductInfo(data.Items).then(function(data1){
								dd.resolve(data);
							})
							//dd.resolve(data);
						})
					})
					return dd.promise;
				},
				WiredProduct: function(OrderCloud, $q){
					var dd=$q.defer();
					OrderCloud.Products.List(null, null, null, null, null, {"xp.WireService": true}).then(function(res){
						console.log(res);
						/*OrderCloud.LineItems.List(res.Items[0].ID, null, null, null, null, null, {"xp.Status":'OnHold'}).then(function(data){
							console.log(data);
							LineItemHelpers.GetProductInfo(data.Items).then(function(data1){
								dd.resolve(data);
							})
							//dd.resolve(data);
						})*/
						dd.resolve(res);
					})
					return dd.promise;
				}
			}
		})
}


function HoldController($scope, $stateParams, Order, WiredProduct) {
	var vm = this;
	vm.onholdlineitems=Order.Items;
	vm.wiredproducts=WiredProduct;
	vm.wireserviceopt=null;
	console.log(vm.onholdlineitems);
	vm.addItem=function(){
		if(vm.deliveryinfo==null/* || vm.wireserviceopt==null*/){
			alert("Please select a lineitem or wireservice Option");
		}
		else{
			vm.selectSKU =! vm.selectSKU;
		}
	}
	$scope.selectFlorist=function(){
		vm.selectFlorist =! vm.selectFlorist;
	}
	$scope.gridOptions = {
		data: 'hold.onholdlineitems',
		enableSorting: true,
		columnDefs: [
			{ name: 'selectradio ', displayName:' ', cellTemplate: '<div class="data_cell"><input type="radio" name="holdlineitem" ng-click="grid.appScope.showlineitem(row.entity)" /></div>'},
			{ name: 'ID', displayName:'Inventory Status'},
			{ name: 'ProductID', displayName:'SKU Code'},
			{ name: 'Product.Name', displayName:'Product Name'},
			{ name: 'BillingAddress', displayName:'SKU Option'},
			{ name: 'Price', displayName:'List Price',cellTemplate: '<div class="data_cell">{{row.entity.UnitPrice|currency}}</div>'},
			{ name: 'Quantity', displayName:'Qty.'},
			{ name: 'xp.TotalCost', displayName:'Invoice Price'},
			{ name: 'ShippingCost', displayName:'Item Discount'},
			{ name: 'ShippingCost', displayName:'Additional Item Information'}
		]
	};
	$scope.gridskuopt = {
		data: 'hold.wiredproducts.Items',
		enableSorting: true,
		columnDefs: [
			{ name: 'checkbox', displayName:'', cellTemplate: '<div class="data_cell"><input type="radio" name="dummyprod" ng-click="grid.appScope.dummyprod(row.entity)" /></div>'},
			{ name: 'ID', displayName:'SKU Code'},
			{ name: 'Name', displayName:'Product Name'},
			{ name: 'ProductID', displayName:'List Price'}
		]
	};

	$scope.showlineitem=function(lineitem){
		console.log("lineitem", lineitem);
		vm.deliveryinfo=lineitem;
	}

	$scope.dummyprod=function(prod){
		console.log("prod", prod);
		vm.dummyproduct=prod;
	}
	vm.adddummy = function(){
		if(vm.dummyproduct!=null){
			vm.selectSKU =! vm.selectSKU;
			console.log(vm.dummyproduct);
			console.log(vm.onholdlineitems);
			vm.onholdlineitems.push(vm.dummyproduct);
			console.log("zxczxc",vm.onholdlineitems);
			$state.reload();
		}
		else{
			alert("enter");
		}
	}
}
