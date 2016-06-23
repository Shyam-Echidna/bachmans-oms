angular.module( 'orderCloud' )
    .config( checkoutConfig )
    .controller( 'checkoutCtrl', checkoutController )
	.directive('modalr', function () {
		return {
			template: '<div class="modal fade">' + 
			'<div class="modal-dialog">' + 
			'<div class="modal-content">' + 
			'<div class="modal-header">' + 
			'<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' + 
			'<h4 class="modal-title">{{ title }}</h4>' + 
			'</div>' + 
			'<div class="modal-body" ng-transclude></div>' + 
			'</div>' + 
			'</div>' + 
			'</div>',
			restrict: 'E',
			transclude: true,
			replace:true,
			scope:true,
			link: function postLink(scope, element, attrs) {
				scope.title = attrs.title;
				scope.$watch(attrs.visible, function(value){
					if(value == true)
						$(element).modal('show');
					else
						$(element).modal('hide');
				});
				$(element).on('shown.bs.modal', function(){
					scope.$apply(function(){
						scope.$parent.vm.showModal = true;
					});
				});
				$(element).on('hidden.bs.modal', function(){
					scope.$apply(function(){
						scope.$parent.vm.showModal = false;
					});
				});
			}
		};
	})
	.directive('clickOutside', function ($parse, $timeout) {
	  return {
		link: function (scope, element, attrs) {
		  function handler(event) {
			if(!$(event.target).closest(element).length) {
			  scope.$apply(function () {
				if(scope.$parent.showDeliveryToolTip == true)
					scope.$parent.showDeliveryToolTip = false;
				$parse(attrs.clickOutside)(scope);
			  });
			}
		  }
		  $timeout(function () {
			$(document).on("click", handler);
		  });
		  scope.$on("$destroy", function () {
			$(document).off("click", handler);
		  });
		}
	  }
	});
	
function checkoutConfig( $stateProvider ) {
	$stateProvider
	.state( 'checkout', {
		parent: 'base',
		url: '/checkout/:ID',
		templateUrl:'checkout/templates/checkout.tpl.html',            
		views: {
			'': {
				templateUrl: 'checkout/templates/checkout.tpl.html'
			},
			'checkouttop@checkout': {
				templateUrl: 'checkout/templates/checkout.top.tpl.html'
			},
			'checkoutbottom@checkout': {
				templateUrl: 'checkout/templates/checkout.bottom.tpl.html'
			}     
		},
		controller: 'checkoutCtrl',
		controllerAs: 'checkout'
	});
}

function checkoutController($scope, LineItemHelpers, $http, CurrentOrder, OrderCloud, $stateParams, BuildOrderService) {
	var vm = this;
	$scope.oneAtATime = true;
	$scope.status = {
		delInfoOpen : true,
		paymentOpen : false,
		reviewOpen : false,
		isFirstDisabled: false
	};
	$scope.seluser = $stateParams.ID;
	console.log('1234567890', $stateParams);
	$scope.onLoadCheckout = function(){
		CurrentOrder.Get()
		.then(function(order) {
			vm.order = order;
			console.log("ssss",vm.order);
			$scope.orderID = order.ID;
			$scope.oredrUserID = order.FromUserID;
			OrderCloud.As().LineItems.List(vm.order.ID).then(function(res){
			$scope.lineTotalQty = _.reduce(_.pluck(res.Items, 'Quantity'), function(memo, num){ return memo + num; }, 0);
			$scope.lineTotalSubTotal = _.reduce(_.pluck(res.Items, 'LineTotal'), function(memo, num){ return memo + num; }, 0);
			LineItemHelpers.GetProductInfo(res.Items)
				.then(function(data) {
					var orderDtls = {"subTotal":0,"deliveryCharges":0};
					$scope.orderDtls = {};
					$scope.deliveryInfo = data;
					var dt,locale = "en-us",dat,index=0;
					var groups = _.groupBy(data, function(obj){
						dt = new Date(obj.xp.deliveryDate);
						//obj.xp.deliveryDate = dt.toLocaleString(locale, { month: "long" })+" "+dt.getDate()+", "+dt.getFullYear();
						dat = dt.getMonth()+1+"/"+dt.getDate()+"/"+dt.getFullYear();
						BuildOrderService.GetPhoneNumber(obj.ShippingAddress.Phone).then(function(res){
							obj.ShippingAddress.Phone1 = res[0];
							obj.ShippingAddress.Phone2 = res[1];
							obj.ShippingAddress.Phone3 = res[2];
						});
						if(dat==today)
							vm['data'+index] = "dt"+index;
						else if(dat==tomorrow)
							vm['data'+index] = "tom"+index;
						else{
							obj.dateVal = {"Month":dt.getMonth()+1,"Date":dt.getDate(),"Year":dt.getFullYear()};
							vm['data'+index] = "selDate"+index;
						}
						index++;
						orderDtls.subTotal += parseFloat(obj.LineTotal);
						orderDtls.deliveryCharges += parseFloat(obj.xp.deliveryCharges);
						return obj.ShippingAddress.FirstName + ' ' + obj.ShippingAddress.LastName;
					});
					$scope.orderDtls.subTotal = orderDtls.subTotal;
					$scope.orderDtls.deliveryCharges = orderDtls.deliveryCharges;
					$scope.orderDtls.Total = orderDtls.subTotal + orderDtls.deliveryCharges;
					$scope.recipientsGroup = groups;
					$scope.recipients = [];
					for(var n in groups){
						$scope.recipients.push(n);
					}
				});	
			});
			BuildOrderService.GetBuyerDtls().then(function(res){
				res.xp.deliveryChargeAdjReasons.unshift("---select---");
				$scope.buyerDtls = res;
			});
		});
	};
	$scope.onLoadCheckout();
	$scope.payment = function(line,index){
		var $this = this;
		var addrValidate = {
			"addressLine1": line.ShippingAddress.Street1, 
			"addressLine2": line.ShippingAddress.Street2,
			"zipcode": line.ShippingAddress.Zip, 
			"country": "US"
		};
		BuildOrderService.addressValidation(addrValidate).then(function(res){
			if(res.data.ResultCode == "Success"){
				if($this.$parent.$parent.$$nextSibling!=null){
					$this.$parent.$parent.$$nextSibling.delInfoRecipient[index+1] = true;
				}else{
					$scope.status.delInfoOpen = false;
					$scope.status.paymentOpen = true;
					$scope.status.isFirstDisabled=true;
				}
				$scope.lineDtlsSubmit(line);
			}else{
				alert("Address not found...");
			}
		});
	};
	$scope.review = function(){
		$scope.status.delInfoOpen = false;
		$scope.status.paymentOpen = false;
		$scope.status.reviewOpen = true;
	};
	$scope.lineDtlsSubmit = function(line){
		var params = {
			"FirstName":line.ShippingAddress.FirstName,"LastName":line.ShippingAddress.LastName,"Street1":line.ShippingAddress.Street1,"Street2":line.ShippingAddress.Street2,"City":line.ShippingAddress.City,"State":line.ShippingAddress.State,"Zip":line.ShippingAddress.Zip,"Phone":line.ShippingAddress.Phone,"Country":"US"
		};
		var common = {
			"CardMessage":{
				"line1":line.xp.CardMessage.line1,"line2":line.xp.CardMessage.line2,"line3":line.xp.CardMessage.line3,"line4":line.xp.CardMessage.line4
			}
		};
		if(this.cardMsg == true)
			common = {};
		if(line.xp.deliveryRun)
			common.deliveryRun = line.xp.deliveryRun;
		
		if(line.selectedAddrID){
			params = _.extend(common,{"deliveryNote":line.xp.deliveryNote,"deliveryDate":line.xp.deliveryDate,"deliveryCharges":line.xp.deliveryCharges,"addressType":line.xp.addressType,"deliveryCharges": line.xp.deliveryCharges,"TotalCost": parseFloat(line.xp.deliveryCharges)+(parseFloat(line.Quantity)*parseFloat(line.UnitPrice))});
			if(line.xp.deliveryChargeAdjReason != "---select---")
				params.deliveryChargeAdjReason = line.xp.deliveryChargeAdjReason;
			OrderCloud.As().LineItems.Patch(vm.order.ID, line.ID, {"ShippingAddressID":line.selectedAddrID,"xp":params}).then(function(res){
				$scope.onLoadCheckout();
			});
		}else{
			OrderCloud.As().LineItems.SetShippingAddress(vm.order.ID, line.ID, params).then(function(data){
				params = _.extend(common,{"deliveryNote":line.xp.deliveryNote,"deliveryDate":line.xp.deliveryDate,"deliveryCharges":line.xp.deliveryCharges,"addressType":line.xp.addressType,"deliveryCharges": line.xp.deliveryCharges,"TotalCost": parseFloat(line.xp.deliveryCharges)+(parseFloat(line.Quantity)*parseFloat(line.UnitPrice))});
				if(line.xp.deliveryChargeAdjReason != "---select---")
					params.deliveryChargeAdjReason = line.xp.deliveryChargeAdjReason;
				OrderCloud.As().LineItems.Patch(vm.order.ID, line.ID, {"xp":params}).then(function(res){
					$scope.onLoadCheckout();
				});
			});
		}
	};
	$scope.viewAddrBook = function(Index){
		$scope['isAddrShow'+Index] = true;
		this.limit = 3;
		$scope.addressesList = [];
		OrderCloud.Addresses.ListAssignments(null,vm.order.FromUserID).then(function(data){
			OrderCloud.Users.Get(vm.order.FromUserID).then(function(defAddress){
				$scope.defualtAddressID = defAddress.xp.DefaultAddress;
				angular.forEach(data.Items, function(val, key){
					OrderCloud.Addresses.Get(val.AddressID).then(function(res){
						res.Zip = parseInt(res.Zip);
						BuildOrderService.GetPhoneNumber(res.Phone).then(function(res){
							res.Phone1 = res[0];
							res.Phone2 = res[1];
							res.Phone3 = res[2];
						});
						if($scope.defualtAddressID == res.ID)
							$scope.addressesList.unshift(res);
						else
							$scope.addressesList.push(res);
					});
				});
			});
		});
	};
	$scope.reviewAddress = function(){
		$scope.userAddr = {};
		OrderCloud.Users.Get(vm.order.FromUserID).then(function(assign){
			OrderCloud.Addresses.Get(assign.xp.DefaultAddress).then(function(data){
				$scope.userAddr.address = data;
			});
			OrderCloud.CreditCards.ListAssignments(null, vm.order.FromUserID).then(function(assign){
				OrderCloud.CreditCards.Get('CWf5x-ZlLUeIFz6b0O16HQ').then(function(data){
					$scope.userAddr.card = data;
				});
			})
		});
	};
	$scope.UpdateAddress = function(addr, index){
		addr.Phone = "("+addr.Phone1+")"+addr.Phone2+"-"+addr.Phone3;
		OrderCloud.Addresses.Update(addr.ID,addr).then(function(res){
			var params = {"AddressID": res.ID,"UserID": vm.order.FromUserID,"IsBilling": false,"IsShipping": true};
			OrderCloud.Addresses.SaveAssignment(params).then(function(data){
				$scope.addressesList = _.map($scope.addressesList, function(obj){
					if(obj.ID == addr.ID) {
						obj.FirstName = res.FirstName;
						obj.LastName = res.LastName;
						obj.Street1 = res.Street1;
						obj.Street2 = res.Street2;
						obj.City = res.City;
						obj.State = res.State;
						obj.Zip = parseInt(res.Zip);
						BuildOrderService.GetPhoneNumber(res.Phone).then(function(res){
							obj.Phone1 = res[0];
							obj.Phone2 = res[1];
							obj.Phone3 = res[2];
						});
					}
					return obj;
				});
			});
		});
		this['isDeliAddrShow'+index] = false;
	};
	$scope.CreateAddress = function(line, index){
		var $this = this;
		var params = {"FirstName":line.FirstName,"LastName":line.LastName,"Street1":line.Street1,"Street2":line.Street2,"City":line.City,"State":line.State,"Zip":line.Zip,"Phone":"("+line.Phone1+")"+line.Phone2+"-"+line.Phone3,"Country":"US"};
		OrderCloud.Addresses.Create(params).then(function(data){
			data.Zip = parseInt(data.Zip);
			BuildOrderService.GetPhoneNumber(data.Phone).then(function(res){
				data.Phone1 = res[0];
				data.Phone2 = res[1];
				data.Phone3 = res[2];
			});
			$scope.addressesList.push(data);
			$this.limit = $scope.addressesList.length;
			params = {"AddressID": data.ID,"UserID": vm.order.FromUserID,"IsBilling": false,"IsShipping": true};
			OrderCloud.Addresses.SaveAssignment(params).then(function(res){
				console.log("Address saved for the user....!" +res);
			});
		});
		this['showNewAddress'+index] = false;
	};
	$scope.viewMore = function(){
		this.limit = $scope.addressesList.length;
	};
	$scope.newAddress = function(Index){
		$scope['showNewAddress'+Index] = true;
	};
	$scope.deliveryAddr = function(Index){
		this['isDeliAddrShow'+Index] = true;
	};
	$scope.deliveryOrStore = 1;
	$scope.fromStoreOrOutside = 1;
	$scope.getStores = function(line){
		if(!$scope.storeNames){
			$http.get('https://api.myjson.com/bins/4wsk2').then(function(res){
				res.data.stores.unshift({"storeName":"---select---"});
				$scope.storeNames = res.data.stores;
			});
		}
	};
	$scope.getStores();
	$scope.selectedAddr = function(line,addr){
		if(addr.isAddrOpen){
			line.selectedAddrID = addr.ID;
			var del = _.findWhere($scope.buyerDtls.xp.ZipCodes, {zip: addr.Zip.toString()});
			line.xp.deliveryCharges = del.DeliveryCharge;
			line.xp.TotalCost = parseFloat(line.xp.deliveryCharges)+(parseFloat(line.Quantity)*parseFloat(line.UnitPrice));
			line.xp.deliveryChargeAdjReason = $scope.buyerDtls.xp.deliveryChargeAdjReasons[0];
		}	
		else
			delete line.selectedAddrID;
	};
	//------Date picker starts----------
	$scope.dateSelect = function(text,line,index){
		vm['data'+index]=text;
		line.dateVal = {};
		if(text.indexOf("dt") > -1)
			line.xp.deliveryDate = $scope.dt;
		else if(text.indexOf("tom") > -1)
			line.xp.deliveryDate = new Date($scope.tom);
	};
	vm.opened = false;
	var dt = new Date();
	$scope.dt = new Date();//today
	var today = $scope.dt.getMonth()+1+"/"+$scope.dt.getDate()+"/"+$scope.dt.getFullYear();
	$scope.tom = dt.setDate(dt.getDate() + 1);//tomorrow
	$scope.initDate = new Date();//day after tomorrow
	var tomorrow = new Date($scope.tom);
	tomorrow = tomorrow.getMonth()+1+"/"+tomorrow.getDate()+"/"+tomorrow.getFullYear();
	vm.toggle = function(line,index){
		vm.opened = true;
		$scope.datePickerLine = line;
		//$scope.datePickerLine.vmData = vmData;
		$scope.datePickerLine.index = index;
	};
	$scope.datePicker = {date:null};
	$scope.$watch('datePicker.date', function(){
		var dateVar = new Date($scope.datePicker.date);
		var date1 = dateVar.getMonth()+1+"/"+dateVar.getDate()+"/"+dateVar.getFullYear();
		if(today==date1){
			vm['data'+$scope.datePickerLine.index] = "dt"+$scope.datePickerLine.index;
			$scope.datePickerLine.xp.deliveryDate = $scope.dt;
			$scope.datePickerLine.dateVal = {};
		}
		else if(tomorrow==date1){
			vm['data'+$scope.datePickerLine.index] = "tom"+$scope.datePickerLine.index;
			$scope.datePickerLine.xp.deliveryDate = new Date($scope.tom);
			$scope.datePickerLine.dateVal = {};
		}	
		else{
			if($scope.datePickerLine){
				$scope.datePickerLine.dateVal = {"Month":dateVar.getMonth()+1,"Date":dateVar.getDate(),"Year":dateVar.getFullYear()};
				$scope.datePickerLine.xp.deliveryDate = dateVar;
				vm['data'+$scope.datePickerLine.index] = "selDate"+$scope.datePickerLine.index;	
			}				
		}	
	}, true);
	//----------Date picker ends------------------
	$scope.cancelOrder = function(){
		OrderCloud.As().Orders.Cancel(vm.order.ID).then(function(data){
			console.log("Order cancelled successfully");
		});
	};
	$scope.saveForLater = function(note){
		OrderCloud.As().Orders.ListOutgoing().then(function(res){
			var filt = _.filter(res.Items, function(row){
				return _.indexOf([vm.order.FromUserID],row.FromUserID) > -1;
			});
			angular.forEach(filt,function(val, key){
				if(val.FromUserID == vm.order.FromUserID && val.ID == vm.order.ID){
					OrderCloud.As().Orders.Patch(vm.order.ID,{"xp":{"SavedOrder":{"Name":note,"Flag":true}}}).then(function(res1){
						console.log("saved order successfully/removed");
					});
				}else if(val.FromUserID == vm.order.FromUserID && val.ID != vm.order.ID && val.xp.SavedOrder){
					OrderCloud.As().Orders.Patch(val.ID,{"xp":{"SavedOrder":{"Flag":false}}}).then(function(res2){
						console.log("saved order successfully/removed");
					});
				}
			});
		});
	};
	vm.showModal = false;
	vm.saveLaterPopup = function () {
        vm.showModal = !vm.showModal;
    };
	vm.modifyDeliveryPopover = {
		templateUrl: 'modifyDeliveryTemplate.html'
    };
	$scope.closePopover = function () {
		$scope.showDeliveryToolTip = false;
	};
	$scope.gotobuildorder = function(){
		$state.go('buildOrder', {showOrdersummary: true}, {reload:true});
    };
	$scope.deliveryInfoEdit = function(e,status){
		e.preventDefault();
		e.stopPropagation();
		status.isFirstDisabled='false';
		status.delInfoOpen='true';
	};
	$scope.deliveryAdj = function(line){
		if(!line.xp.deliveryChargeAdjReason)
			line.xp.deliveryChargeAdjReason = $scope.buyerDtls.xp.deliveryChargeAdjReasons[0];
	};
	$scope.addressTypeSelect = function(line){
		line.addressTypeD = line.xp.addressType;
		if(line.xp.addressType=="Will Call"){
			line.deliveryOrStore = 2;
			$scope.getStores(line);
		}	
		else
			line.deliveryOrStore = 1;
		
		var filt = _.filter($scope.storeNames, function(row,index){
			return _.indexOf([line.xp.storeName],row.storeName) > -1;
		});
		if(filt.length!=0)
			line.selected = $scope.storeNames[parseInt(filt[0].id)];
		else
			line.selected = $scope.storeNames[0];
	};
}