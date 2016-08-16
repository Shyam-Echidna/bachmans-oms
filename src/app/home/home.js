angular.module( 'orderCloud' )

	.config( HomeConfig )
	.controller( 'HomeCtrl', HomeController )
	.factory( 'HomeService', HomeService);

function HomeConfig( $stateProvider ) {
	$stateProvider
		.state( 'home', {
			parent: 'base',
			url: '/home',
			templateUrl: 'home/templates/home.tpl.html',
			controller: 'HomeCtrl',
			controllerAs: 'home',
			resolve: {
                OrderList: function(OrderCloud, $q) {
					var arr={};
					var dd=$q.defer();
						// OrderCloud.Orders.ListOutgoing(null, null, null, i, 100).then(function(data){
							// console.log("searched order", data);
							// arr.saved=_.filter(data.Items, function(obj) {
								// console.log(i);
								// if(data.Items.xp)
								// if(data.xp.SavedOrder)
									// return _.indexOf([obj.xp.SavedOrder.Flag], true) > -1
							// });
							// arr.onHold=_.filter(data.Items, function(obj){
								// if(data.Items.xp)
								// if(data.xp.Status)
									// return _.indexOf([obj.xp.Status], "OnHold") > -1
							// });
							// dd.resolve(arr);
						// });
					OrderCloud.Orders.ListOutgoing(null, null, null, null, null, null, null, {"xp.SavedOrder.Flag":true}).then(function(data){
						arr.saved=data.Items;
						console.log("ppppppppppppppppp",data);
						 
					})
					OrderCloud.Orders.ListOutgoing(null, null, null, null, null, null, null, {"xp.Status":'OnHold'}).then(function(response){
							arr.onHold=response.Items;
							console.log("responsepp",response);
						 dd.resolve(arr);
					})
					
					//console.log("aaaaaa", arr);
                    return dd.promise;
                },
                /*ShipmentList: function(OrderCloud) {
                    return OrderCloud.Shipments.List();
                },*/
				EventList:function(OrderCloud, $q){
					var arr={};
					var events=[];
					var dfr = $q.defer();
					OrderCloud.Categories.Get('c10').then(function(res){
						arr["name"]=res.Name;
						console.log("77777777", arr["name"]);
					});
					OrderCloud.Categories.ListProductAssignments('c10').then(function(assign){
						angular.forEach(assign.Items, function(res, key1){
							OrderCloud.Products.Get(res.ProductID).then(function(data){
								events.push(data);
								console.log("9999999", arr["events"]);
							})
						})
						arr["events"]=events;
						dfr.resolve(arr);
					});
						return dfr.promise;
				}
				
				/*,
                LineItemList: function($stateParams, LineItems) {
                    return LineItems.List('5u_UJNKj902oIbW3Ya16Ew');
                }*/
            }
		})
}


function HomeController($sce, $rootScope, $state, $compile, HomeService, Underscore, OrderList, $scope, alfrescoURL, OrderCloud, EventList) {
	var vm = this;
	OrderCloud.Auth.RemoveImpersonationToken();
	vm.eventList=EventList;
	console.log("dataaaaaaaaaa", vm.eventList);
	var log = [];
	$scope.dateFormat="dd/MM/yyyy";
	//holdorders = ShipmentList.Items;
	/*
	console.log('LineItemList', LineItemList);*/
	/*angular.forEach(holdorders, function(value, key) {
	  this.push(key + ': ' + value);
	  console.log(ShipmentList);
	}, log);*/
	/*angular.forEach(Underscore.where(LineItems.Get, { ParentID: null}), function(node) {
        tree.push(_getnode(node));
    });*/
    $scope.deleteOrder = function(row){
		OrderCloud.Orders.Delete(row.entity.ID).then(function(data){
			$state.reload();
		});
	};
	/*angular.forEach(Underscore.where(ShipmentList.Items, 'Mallik_ship'), function() {
        console.log(this);
    });
    angular.forEach(ShipmentList.Items, function(lineitem, index) {
        console.log(lineitem);
    });*/
	console.log("OrderList", OrderList);
    vm.onHold = OrderList.onHold;
	$scope.gridOptions = {
		data: 'home.onHold',
		enableSorting: true,
		columnDefs: [
			{ name: 'ID', displayName:'Shipment'},
			{ name: 'DateCreated', displayName:'Order Placed On', cellTemplate: '<div class="data_cell">{{row.entity.DateCreated | date:grid.appScope.dateFormat}}</div>'},
			{ name: 'FromUserFirstName', displayName:'Sender Name'},
			{ name: 'BillingAddress', displayName:'Occassions'},
			{ name: 'Totl', displayName:'Wire Status Code'},
			{ name: 'xp.CSRID', displayName:'CSR ID'},
			{ name: 'ShippingCost', displayName:'', cellTemplate: '<div class="data_cell" ui-sref="buildOrder({ID:row.entity.FromUserID,SearchType:grid.appScope.user,orderID:row.entity.ID})"><a> <i class="fa fa-upload"></i> Open Order</a></div>', width:"15%"}
		]
	};
	vm.saved = OrderList.saved;
	$scope.user='User';
	$scope.CSRAdminData = {
		data: 'home.saved',
		enableFiltering: true,
	  enableSorting: false,
	  columnDefs: [ 
		{ name: 'xp.SavedOrder.Name', displayName:'Order Name', filter: {placeholder: 'Search order'}},
		{ name: 'FromUserFirstName', displayName:'Customer', enableFiltering:false},
		{ name: 'Delete', displayName:'', enableFiltering:false, cellTemplate: '<div class="data_cell"><a popover-trigger="none" popover-is-open="grid.appScope.showDeliveryToolTip" ng-click="grid.appScope.showDeliveryToolTip = !grid.appScope.showDeliveryToolTip" uib-popover-template="grid.appScope.deleteAddress.templateUrl" popover-placement="bottom"><img src="../assets/images/icons-svg/cancel.svg">Delete</a></div><script type="text/ng-template" id="deleteAddress.html"><div click-outside="grid.appScope.closePopover()"><h2>Delete this Address</h2><button type="button" ng-click="grid.appScope.deleteOrder(row)">DELETE</button><button type="button" ng-click="grid.appScope.cancelPopUp()">CANCEL</button></div></script>', width: "15%"},
		{ name: 'openOrder', displayName:'', enableFiltering:false, cellTemplate: '<div class="data_cell" ui-sref="buildOrder({ID:row.entity.FromUserID,SearchType:grid.appScope.user,orderID:row.entity.ID})"><a> <i class="fa fa-upload"></i> Open Order</a></div>', width: "15.2%"}
	  ]
	};
	var ticket = localStorage.getItem("alf_ticket");
	HomeService.GetPromoInfo(ticket).then(function(res){
		vm.PromoInformation=[];
		for(var i=3;i<res.items.length;i++){
			vm.PromoInfo = $sce.trustAsResourceUrl(alfrescoURL+res.items[i].contentUrl+"?alf_ticket="+ticket);
			vm.PromoInformation.push(vm.PromoInfo);

		}
	});
	$scope.deleteAddress = {
        templateUrl: 'deleteAddress.html',
    }
	$scope.closePopover = function () {
        this.showDeliveryToolTip = false;
    };
    $scope.cancelPopUp = function () {
		console.log("dataaaaaaaaaaaaaa");
        this.showDeliveryToolTip = false;
    };
}

function HomeService( $q, $http, alfrescoURL) {
	var service = {		
		GetPromoInfo:_getPromoInfo
	};

	function _getPromoInfo(ticket) {
		var defferred = $q.defer();
		var ticket = localStorage.getItem("alf_ticket"); 
		$http({
			method: 'GET',
			dataType:"json",
			url: alfrescoURL+"slingshot/doclib/doclist/documents/site/bachmans-storefront/documentLibrary/HomePage/Promotions?alf_ticket="+ticket,
			headers: {
				'Content-Type': 'application/json'
			}
		}).success(function (data, status, headers, config) {              
			defferred.resolve(data);
		}).error(function (data, status, headers, config) {
			defferred.reject(data);
		});
		return defferred.promise;
	}
	return service;
}