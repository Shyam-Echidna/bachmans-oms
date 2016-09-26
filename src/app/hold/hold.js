angular.module( 'orderCloud' )

	.config( HoldConfig )
	.controller( 'HoldCtrl', HoldController );

function HoldConfig( $stateProvider ) {
	$stateProvider
		.state( 'hold', {
			parent: 'base',
			url: '/hold/:ID/:OrderID/:LineItemID',
			templateUrl: 'hold/templates/hold.tpl.html',
			controller: 'HoldCtrl',
			controllerAs: 'hold',
			resolve:{
				Order: function(OrderCloud, $q, $stateParams, LineItemHelpers){
					var dd=$q.defer();
					var arr=[];
					console.log($stateParams);
					OrderCloud.LineItems.Get($stateParams.OrderID,$stateParams.LineItemID).then(function(data){
						console.log(data);
						arr.push(data);
						LineItemHelpers.GetProductInfo(arr).then(function(data1){
							dd.resolve(data);
						})
					})
					/*OrderCloud.Orders.ListOutgoing(null, null, $stateParams.orderID).then(function(res){
						console.log(res);
						OrderCloud.LineItems.List(res.Items[0].ID, null, null, null, null, null, {"xp.Status":'OnHold'}).then(function(data){
							console.log(data);
							LineItemHelpers.GetProductInfo(data.Items).then(function(data1){
								dd.resolve(data);
							})
							//dd.resolve(data);
						})
					})*/
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


function HoldController($scope, $state, $stateParams, Order, WiredProduct, OrderCloud, LineItemHelpers, Underscore) {
	var vm = this;
	vm.onholdlineitems=[];
	vm.onholdlineitems.push(Order);
	vm.onholdlineitems1=vm.onholdlineitems;
	vm.wiredproducts=WiredProduct;
	vm.wireserviceopt=null;
	vm.deliveryinfo=vm.onholdlineitems1;
	console.log("test",$scope.gridOptions);
	vm.addItem=function(){
		vm.selectSKU =! vm.selectSKU;
		$scope.gridOptions.columnDefs[0].visible=true;
		$scope.gridApi.core.refresh();
		console.log("test",$scope.gridOptions);
		//$scope.gridOptions.gridApi.core.refresh();
	}
	vm.removeItem=function(){
		if(vm.deliveryinfo==null/* || vm.wireserviceopt==null*/){
			alert("Please select a lineitem or wireservice Option");
		}
		else{
			console.log(vm.deliveryinfo);
			console.log(vm.onholdlineitems);
			var prod= Underscore.filter(vm.onholdlineitems,function(item){return item.ID!=vm.deliveryinfo.ID});
			console.log(prod);
			vm.onholdlineitems=prod;
		}
	}
	vm.florist=function(florist){
		console.log(florist);
		if(florist=="Teleflora"){
			alert("Teleflora");
			vm.wireservice=florist;
			OrderCloud.Buyers.Get().then(function(res){
				console.log(res);
				vm.floristdata=res.xp.Floristdetails;
			})
		}
		else if(florist=="FTD"){
			alert("FTD");
		}
		else{
			alert("Select Wired Service Method");
		}
	}
	/*OrderCloud.Orders.ListOutgoing(null, null, $stateParams.orderID, null, null, 'ID').then(function(res){
		console.log(res);
		OrderCloud.LineItems.List(res.Items[0].ID, null, null, null, null, null, {"xp.Status":'OnHold'}).then(function(data){
			console.log(data);
			LineItemHelpers.GetProductInfo(data.Items).then(function(data1){
				console.log('1234567890',data);
				$scope.gridOptions.data=data.Items;
			})
			//dd.resolve(data);
		})
	})*/
	vm.selectFlorist=function(){
		alert("hi");
		console.log(vm.selectFloristshow);
		vm.selectFloristshow =! vm.selectFloristshow;
	}
	$scope.gridOptions = {
		data: 'hold.onholdlineitems1',
		enableSorting: true,
		enableFiltering: true,
		enableCellEditOnFocus: true,
		columnDefs: [
			{ name: 'selectradio ', displayName:' ',visible: false, cellTemplate: '<div class="data_cell"><input type="radio" name="holdlineitem" ng-click="grid.appScope.showlineitem(row.entity)" /></div>'},
			{ name: 'ID', displayName:'Inventory Status',enableFiltering: true},
			{ name: 'ProductID', displayName:'SKU Code', enableCellEdit:true},
			{ name: 'Product.Name', displayName:'Product Name'},
			{ name: 'BillingAddress', displayName:'SKU Option'},
			{ name: 'Price', displayName:'List Price',cellTemplate: '<div class="data_cell">{{row.entity.UnitPrice|currency}}</div>'},
			{ name: 'Quantity', displayName:'Qty.'},
			{ name: 'xp.TotalCost', displayName:'Invoice Price'},
			{ name: 'ShippingCost', displayName:'Item Discount'},
			{ name: 'ShippingCost', displayName:'Additional Item Information'}
		]
	};
	 $scope.gridOptions.onRegisterApi = function(gridApi){
	 	console.log(gridApi);
          //set gridApi on scope
          $scope.gridApi = gridApi;
          gridApi.edit.on.afterCellEdit($scope,function(rowEntity, colDef, newValue, oldValue){
            //$scope.msg.lastCellEdited = 'edited row id:' + rowEntity.id + ' Column:' + colDef.name + ' newValue:' + newValue + ' oldValue:' + oldValue ;
            alert('Column: ' + colDef.name + ' ID: ' + rowEntity.id + ' Name: ' + rowEntity.name + ' Age: ' + rowEntity.age)
            $scope.$apply();
          });
        };
	$scope.gridskuopt = {
		data: 'hold.wiredproducts.Items',
		enableSorting: true,
		enableFiltering: true,
		enableRowSelection:true,
		columnDefs: [
			{ name: 'checkbox', displayName:'', cellTemplate: '<div class="data_cell"><input type="radio" name="dummyprod" ng-click="grid.appScope.dummyprod(row.entity)" /></div>'},
			{ name: 'ID', displayName:'SKU Code',enableCellEdit:true,enableFiltering: true},
			{ name: 'Name', displayName:'Product Name',enableCellEdit:true,enableFiltering: true},
			{ name: 'ProductID', displayName:'List Price',enableCellEdit:true}
		]
	};
	/*$scope.gridskuopt.onRegisterApi = function(gridApi){
	 	console.log("gridskuopt",gridApi);
          //set gridApi on scope
          $scope.gridApi = gridApi;
          gridApi.edit.on.afterCellEdit($scope,function(rowEntity, colDef, newValue, oldValue){
            //$scope.msg.lastCellEdited = 'edited row id:' + rowEntity.id + ' Column:' + colDef.name + ' newValue:' + newValue + ' oldValue:' + oldValue ;
            alert('Column: ' + colDef.name + ' ID: ' + rowEntity.id + ' Name: ' + rowEntity.name + ' Age: ' + rowEntity.age)
            $scope.$apply();
          });
        };*/
        console.log("floristdata",vm.floristdata);
	$scope.gridfloristopt = {
		data: 'hold.floristdata',
		enableFiltering: true,
		enableSorting: true,
		columnDefs: [
			{ name: 'checkbox', cellTemplate: '<div class="data_cell"><input type="radio" name="dummyprod" ng-click="grid.appScope.addflorist(row.entity)" /></div>'},
			{ name: 'floristStatus', displayName:'Florist Status', },
			{ name: 'floristCode', displayName:'Florist Code'},
			{ name: 'floristName', displayName:'Florist Name',enableFiltering: true},
			{ name: 'Address', displayName:'Address'},
			{ name: 'zipCode', displayName:'Zip code'},
			{ name: 'Notes', displayName:'Notes'}
		]
	};

	$scope.addflorist=function(data){
		console.log(data);
		vm.selectedflorist=data;
	}

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
			vm.onholdlineitems1.push(vm.dummyproduct);
			console.log("zxczxc",vm.onholdlineitems1);
			//$state.reload();
			$scope.gridApi.core.refresh();
		}
		else{
			alert("enter");
		}
	}
	vm.unhold=function(){
		alert("unhold");
		OrderCloud.LineItems.Get($stateParams.orderID,vm.onholdlineitems[0].ID).then(function(res){
			console.log(res);
			var oldxp=res.xp;
			var newxp={"florist":vm.selectedflorist,"wireservice":vm.wireservice};
			var finalxp=angular.extend({},oldxp,newxp);
			console.log(finalxp);
			OrderCloud.LineItems.Patch($stateParams.orderID,res.ID,{"xp":finalxp}).then(function(res1){
				console.log(res1);
			})
		})
	}
}
