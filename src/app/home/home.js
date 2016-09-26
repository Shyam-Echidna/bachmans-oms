angular.module( 'orderCloud' )

	.config( HomeConfig )
	.controller( 'HomeCtrl', HomeController )

function HomeConfig( $stateProvider ) {
	$stateProvider
		.state( 'home', {
			parent: 'base',
			url: '/home',
			templateUrl: 'home/templates/home.tpl.html',
			data: {
				loadingMessage: 'Loading...'
			},
			controller: 'HomeCtrl',
			controllerAs: 'home',
			resolve: {
                /*OrderList: function(OrderCloud, $q) {
					var arr = {};
					var dd = $q.defer();
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
						dd.resolve(arr);
						console.log("ppppppppppppppppp",data);
						 
					});
                    return dd.promise;
                },*/
				/*OrdersOnHold: function(OrderCloud, $q){
					var dd=$q.defer(), onholdorders = [], onholdordersobj = {};
					OrderCloud.Shipments.List(null, null, null, null, null, null, {"xp.Status":"OnHold"}).then(function(res){
						angular.forEach(res.Items, function(res, key){
							angular.forEach(res.Items, function(res1, key1){
								OrderCloud.Orders.Get(res1.OrderID).then(function(data){
									onholdordersobj={"ID":data.ID,"DateCreated":data.DateCreated,"FromUserFirstName":data.FromUserFirstName,"Occassions":"","WireStatusCode":"Wire Status Code","CSRID":data.xp.CSRID};
									onholdorders.push(onholdordersobj);
								});
							},true);
						},true);
						dd.resolve(onholdorders);
					});
					return dd.promise;
                },*/
                /*ShipmentList: function(OrderCloud) {
                    return OrderCloud.Shipments.List();
                },*/
				PromotionsList:function(OrderCloud, $q, Underscore){
					return OrderCloud.Promotions.List(null,1, 100).then(function(promo){
					var totalCount = promo.Meta.TotalCount;
						var result=_.sortBy(promo.Items, function(data){ return data.xp.DateCreated; });
						return [result.reverse(), totalCount];
					});
				}
				/*,
                LineItemList: function($stateParams, LineItems) {
                    return LineItems.List('5u_UJNKj902oIbW3Ya16Ew');
                }*/
            }
		});
}

function HomeController($sce, $rootScope, $state, $compile, $log, Underscore, $scope, OrderCloud,$q, PromotionsList) {
	var vm = this;
	vm.showcalendarModal = false;
	vm.showpromotionsmodal = false;
	OrderCloud.Auth.RemoveImpersonationToken();
	//$scope.events=[];
    //$scope.events = EventList.events;
	vm.promotionsList=PromotionsList[0];
	//console.log("dataaaaaaaaaa", $scope.events);
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
	var onholdorders = [];
	OrderCloud.Shipments.List(null, null, null, null, null, null, {"xp.Status":"OnHold"}).then(function(res){
		angular.forEach(res.Items, function(res, key){
			angular.forEach(res.Items, function(res1, key1){
				OrderCloud.Orders.Get(res1.OrderID).then(function(res2){
					console.log(res2);
					OrderCloud.LineItems.Get(res1.OrderID,res1.LineItemID).then(function(res3){
						if(!res3.xp)
							res3.xp = {};
						if(!res2.xp)
							res2.xp = {};	
						onholdorders.push({"ID":res.ID,"OrderID":res1.OrderID,"LineItemID":res1.LineItemID,"DateCreated":res2.DateCreated,"FromUserFirstName":res2.FromUserFirstName,"Destination":res3.xp.addressType,"WireStatusCode":res3.xp.WireService,"CSRID":res2.xp.CSRID});
					})
				})
				//onholdorders.push(OrderCloud.Orders.Get(res1.OrderID));
			},true);
		},true);
		vm.onHold = onholdorders;
	});
	console.log(vm.onHold);
	$scope.gridOptions = {
	  data: 'home.onHold',
	  enableSorting: true,
	  columnDefs: [
	   { name: 'ID', displayName:'Shipment'},
	   { name: 'DateCreated', displayName:'Order Placed On', cellTemplate: '<div class="data_cell">{{row.entity.DateCreated | date:grid.appScope.dateFormat}}</div>', width:"14.2%"},
	   { name: 'FromUserFirstName', displayName:'Sender Name',width:"14.2%"},
	   { name: 'Destination', displayName:'Destination',width:"14.2%"},
	   { name: 'WireStatusCode', displayName:'Wire Status Code',width:"14.2%"},
	   { name: 'CSRID', displayName:'CSR ID',width:"14.2%"},
	   { name: 'ShippingCost', displayName:'', cellTemplate: '<div class="data_cell" ui-sref="hold({ID:row.entity.ID,LineItemID:row.entity.LineItemID,OrderID:row.entity.OrderID})"><a> <i class="fa fa-upload"></i> Open Order</a></div>', width:"14.2%"}
	  ]
	 };
	//vm.saved = OrderList.saved;
	OrderCloud.Orders.ListOutgoing(null, null, null, null, null, null, null, {"xp.SavedOrder.Flag":true}).then(function(data){
		vm.saved=data.Items;
	});
	$scope.user='User';
	$scope.CSRAdminData = {
		data: 'home.saved',
		enableFiltering: true,
	  enableSorting: false,
	  columnDefs: [ 
		{ name: 'xp.SavedOrder.Name', displayName:'Order Name', filter: {placeholder: 'Search order'}},
		{ name: 'FromUserFirstName', displayName:'Customer', enableFiltering:true},
		{ name: 'Delete', displayName:'', enableFiltering:false, cellTemplate: '<div class="data_cell"><a popover-trigger="none" popover-is-open="grid.appScope.showDeliveryToolTip[row.entity.ID]" ng-click="grid.appScope.showDeliveryToolTip[row.entity.ID] = !grid.appScope.showDeliveryToolTip[row.entity.ID]" uib-popover-template="grid.appScope.deleteAddress.templateUrl" popover-placement="bottom"><img src="../assets/images/icons-svg/cancel.svg">Delete</a></div><script type="text/ng-template" id="deleteAddress.html"><div click-outside="grid.appScope.closePopover()"><h2>Delete this Address</h2><button type="button" ng-click="grid.appScope.deleteOrder(row)">DELETE</button><button type="button" ng-click="grid.appScope.cancelPopUp()">CANCEL</button></div></script>', width: "15%"},
		{ name: 'openOrder', displayName:'', enableFiltering:false, cellTemplate: '<div class="data_cell" ui-sref="buildOrder({ID:row.entity.FromUserID,SearchType:grid.appScope.user,orderID:row.entity.ID})"><a> <i class="fa fa-upload"></i> Open Order</a></div>', width: "15.2%"}
	  ]
	};
	var ticket = localStorage.getItem("alf_ticket");
	// HomeService.GetPromoInfo(ticket).then(function(res){
		// vm.PromoInformation=[];
		// for(var i=3;i<res.items.length;i++){
			// vm.PromoInfo = $sce.trustAsResourceUrl(alfrescoURL+res.items[i].contentUrl+"?alf_ticket="+ticket);
			// vm.PromoInformation.push(vm.PromoInfo);

		// }
	// });
	
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
	$scope.saveCalendar=function(){
		var arr={}, events=[], dfr = $q.defer();
			$scope.events=[];
			$scope.dayClick = function( date, allDay, jsEvent, view ){
    	alert("with date selction");
    };
    //with this you can handle the click on the events
    $scope.eventClick = function(event){  
      // console.log(event);
		$state.go('buildOrder',{ID:event.id,SearchType:'Workshop'});
    };
    $scope.renderView = function(view){  
        var monthArr = ["January","February","March", "April","May","June","July","August", "September","October","November","December"];  
        var prevMonth = new Date(view.calendar.getDate()).getMonth()-1;
        var nxtMonth =  new Date(view.calendar.getDate()).getMonth()+1;

        $('.fc-icon-right-single-arrow').text(monthArr[nxtMonth >= 12 ? 0: nxtMonth]);
        $('.fc-icon-left-single-arrow').text(monthArr[prevMonth <= -1 ? 11: prevMonth]);

       //  $('.fc-event-container').closest('table').find('thead tr td').eq($('.fc-event-container').);
    };
		OrderCloud.Categories.ListProductAssignments('WorkshopsEvents', null, 1 ,100).then(function(assign){
			angular.forEach(assign.Items, function(res, key){
				events.push(OrderCloud.Products.Get(res.ProductID));
			},true);
			$q.all(events).then(function(result){
				var count=1,events = [];
				angular.forEach(result, function(data, key){
					if(!_.isEmpty(data.xp)){
						if(data.xp.EventDate!=null){
							events.push({
								id: data.ID,
								title: data.Name,
								start: new Date(data.xp.EventDate),
								//end : new Date(cat.xp.EndDate) // Uncomment if we have date range 
								productcode : data.xp.ProductCode,
								description: data.Description,
								startTime:data.xp.Slot.StartTime,
								endTime:data.xp.Slot.EndTime
							})
						}
					}
					if(count==assign.Items.length){
						var groupName=_.groupBy(events, function(value){
							return value.start;
						});
						var data;
						var result=[];
						var cont=1;
						var keys = Object.keys(groupName);
						angular.forEach(groupName, function(val){
							data=_.uniq(val, function(item){
								return item.productcode;
							});
							result = _.union(result, data);
							if(cont==keys.length){
								//var sort=_.sortBy(result, function(o) { return o.start; });
								//sort.reverse();
								//arr["events"]=result;
								dfr.resolve(result);
								$scope.events=result;
								console.log("$scope.events", $scope.events);
								/* config object */
								$scope.uiConfig = {
								  calendar:{
									editable: false,
									header:{
										left: 'prev',
										center: 'title',
										right: 'next',
										buttonIcons: false
									},
									dayClick: $scope.dayClick,
									eventClick: $scope.eventClick,
									viewRender: $scope.renderView,
									eventLimit: 2, // If you set a number it will hide the items
									eventLimitText: "Show All",
									columnFormat: {
									   month: 'dddd'
									}
									}
								};
								 $('#calendar').fullCalendar('today');
								/* event sources array*/
								$scope.eventSources = [$scope.events];
								console.log("arr", arr["events"]);
							}
							cont++;
							console.log("result", result);
						});
					}
					count++;
				},true);
			});
	});
		vm.showcalendarModal = !vm.showcalendarModal;
	}
	$scope.viewpromotions=function(){
		vm.page = 1;
		vm.showpromotionsmodal = !vm.showpromotionsmodal;
	}
	  	$scope.totalItems = PromotionsList[1];
		$scope.currentPage = 1;
		$scope.itemsPerPage = 10;
    vm.setPagingData=function(page) {
		vm.page=page;
       }
	}
/*
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
*/