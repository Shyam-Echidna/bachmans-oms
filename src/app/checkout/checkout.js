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
        data: {
            loadingMessage: 'Preparing for Checkout'
        },
		views: {
			'': {
				templateUrl: 'checkout/templates/checkout.tpl.html',
				controller: 'checkoutCtrl',
				controllerAs: 'checkout',
                resolve: {
                    SavedCreditCards: function(OrderCloud) {
                        return OrderCloud.As().Me.ListCreditCards(null, 1, 100);
                    },
                    Order: function(CurrentOrder) {
                        return CurrentOrder.Get();
                    },
                    OrderLineItems: function(OrderCloud, Order) {
                        return OrderCloud.As().LineItems.List(Order.ID)
                    },
                    ProductInfo: function(OrderCloud, LineItemHelpers, OrderLineItems) {
                        return LineItemHelpers.GetProductInfo(OrderLineItems.Items)
                    },
                    TakeOrderOffHold: function(BuildOrderService, Order, OrderLineItems) {
                        return BuildOrderService.OrderOnHoldRemove(OrderLineItems.Items, Order.ID)
                    },
                    GetBuyerDetails: function(BuildOrderService) {
                        return BuildOrderService.GetBuyerDtls()
                    },
                    GetTax: function(TaxService, Order) {
                        return TaxService.GetTax(Order.ID);
                    }
                }
			},
			'checkouttop@checkout': {
				templateUrl: 'checkout/templates/checkout.top.tpl.html'
			},
			'checkoutbottom@checkout': {
				templateUrl: 'checkout/templates/checkout.bottom.tpl.html'
			}     
		}
	});
}

function checkoutController($scope, $state, Underscore, Order, OrderLineItems,ProductInfo, GetBuyerDetails, GetTax, CreditCardService, TaxService, AddressValidationService, SavedCreditCards, OrderCloud, $stateParams, BuildOrderService, $q, AlfrescoFact) {
	var vm = this;
	vm.logo=AlfrescoFact.logo;
    vm.order = Order;
    vm.orderID = Order.ID;
    vm.order.TaxInfo = GetTax;
    vm.lineItems = OrderLineItems.Items;
    vm.buyerDtls = GetBuyerDetails;
    vm.buyerDtls.xp.deliveryChargeAdjReasons.unshift("---select---");
    vm.paymentOption = 'CreditCard';
    vm.lineTotalQty = Underscore.reduce(Underscore.pluck(vm.lineItems, 'Quantity'), function(memo, num){ return memo + num; }, 0);
    vm.lineTotalSubTotal = Underscore.reduce(Underscore.pluck(vm.lineItems, 'LineTotal'), function(memo, num){ return memo + num; }, 0);
    vm.creditCardsList = SavedCreditCards.Items;
    vm.seluser = $stateParams.ID;
    vm.AvoidMultipleDelryChrgs = [];
	vm.oneAtATime = true;
	vm.opened = false;
	var dt = new Date();
	$scope.dt = new Date();//today
	var today = dt.getMonth()+1+"/"+dt.getDate()+"/"+dt.getFullYear();
	dt = new Date();
	$scope.tom = new Date(dt.setDate(dt.getDate() + 1));//tomorrow
	vm.initDate = new Date();//day after tomorrow
	var tomorrow = $scope.tom;
	tomorrow = tomorrow.getMonth()+1+"/"+tomorrow.getDate()+"/"+tomorrow.getFullYear();
	vm.status = {
		delInfoOpen : true,
		paymentOpen : false,
		reviewOpen : false,
		isFirstDisabled: false
	};

    vm.getRecipientSubTotal = function(lineitems) {
            return Underscore.pluck(lineitems, 'LineTotal').reduce(function(prev, current) {
                return prev + current;
            }, 0);
    };

    vm.getRecipientTax = function(lineitems) {
        angular.forEach(lineitems, function(item){
            var line = Underscore.findWhere(GetTax.TaxLines, {LineNo: item.ID});
            item.TaxCost = line.Tax;
        });
        return Underscore.pluck(lineitems, 'TaxCost').reduce(function(prev, current) {
            return prev + current;
        }, 0);
    };

    vm.submitOrder = function() {
        if(vm.paymentOption === 'CreditCard' && vm.selectedCard) {
            CreditCardService.ExistingCardAuthCapture(vm.selectedCard, vm.order)
                .then(function(){
                    OrderCloud.Orders.Submit(vm.orderID)
                        .then(function(){
                            TaxService.CollectTax(vm.orderID)
                                .then(function(){
                                    $state.go('orderConfirmation' , {userID: vm.order.FromUserID ,ID: vm.orderID});
                                })
                        });
                });
        } else {
            OrderCloud.Orders.Submit(vm.orderID)
                .then(function(){
                    TaxService.CollectTax(vm.orderID)
                        .then(function(){
                            $state.go('orderConfirmation' , {userID: vm.order.FromUserID ,ID: vm.orderID});
                        })
                });
        }
    };

	vm.Grouping = function(data){
		var orderDtls = {"subTotal":0,"deliveryCharges":0};
		vm.orderDtls = {};
		vm.deliveryInfo = data;
		var dt,locale = "en-us",dat,index=0;
		var groups = _.groupBy(data, function(obj){
			dt = new Date(obj.xp.deliveryDate);
			var deliverySum=0;
			//obj.xp.deliveryDate = dt.toLocaleString(locale, { month: "long" })+" "+dt.getDate()+", "+dt.getFullYear();
			dat = dt.getMonth()+1+"/"+dt.getDate()+"/"+dt.getFullYear();
			BuildOrderService.GetPhoneNumber(obj.ShippingAddress.Phone).then(function(res){
				obj.ShippingAddress.Phone1 = res[0];
				obj.ShippingAddress.Phone2 = res[1];
				obj.ShippingAddress.Phone3 = res[2];
			});
			obj.ShippingAddress.deliveryDate = obj.xp.deliveryDate;
			obj.ShippingAddress.lineID = obj.ID;
			if(obj.xp.deliveryFeesDtls)
				obj.ShippingAddress.deliveryPresent = true;
			vm.AvoidMultipleDelryChrgs.push(obj.ShippingAddress);
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
			angular.forEach(obj.xp.deliveryFeesDtls, function(val, key){
				deliverySum += parseFloat(val);
			},true);
			if(deliverySum > 250){
				line.xp.Discount = deliverySum - 250;
				deliverySum = 250;
			}
			orderDtls.deliveryCharges += deliverySum;
			//orderDtls.deliveryCharges = obj.xp.deliveryCharges;
			return obj.ShippingAddress.FirstName + ' ' + obj.ShippingAddress.LastName;
		});
		vm.AvoidMultipleDelryChrgs = _.uniq(vm.AvoidMultipleDelryChrgs, 'lineID');
		vm.orderDtls.subTotal = orderDtls.subTotal;
		vm.orderDtls.deliveryCharges = orderDtls.deliveryCharges;
		vm.orderDtls.SpendingAccounts = {};
		//$scope.orderDtls.Total = orderDtls.subTotal + orderDtls.deliveryCharges;
		OrderCloud.As().Orders.Patch(vm.order.ID, {"ID": vm.order.ID, "ShippingCost": orderDtls.deliveryCharges}).then(function(res){
            vm.order = res;
        });
		vm.recipientsGroup = groups;
		vm.recipients = [];
		for(var n in groups){
			vm.recipients.push(n);
		}
	};

    vm.Grouping(ProductInfo);
	vm.payment = function(line,index) {
        AddressValidationService.Validate(line.ShippingAddress).then(function(response){
			if(response.ResultCode == 'Success') {
				var validatedAddress = response.Address;
				var zip = validatedAddress.PostalCode.substring(0, 5);
				line.ShippingAddress.Zip = parseInt(zip);
				line.ShippingAddress.Street1 = validatedAddress.Line1;
				line.ShippingAddress.Street2 = null;
				line.ShippingAddress.City = validatedAddress.City;
				line.ShippingAddress.State = validatedAddress.Region;
				if (vm.delInfoRecipient[index + 1] != null) {
					vm.delInfoRecipient[index + 1] = true;
				} else {
					vm.status.delInfoOpen = false;
					vm.status.paymentOpen = true;
					vm.status.isFirstDisabled = true;
				}
				vm.lineDtlsSubmit(line);
				vm.Grouping(vm.deliveryInfo);
			}
			else{
				alert("Address not found...");
			}
        });
	};
	vm.review = function(){
		vm.status.delInfoOpen = false;
		vm.status.paymentOpen = false;
		vm.status.reviewOpen = true;
	};
	vm.lineDtlsSubmit = function(line){
		var params = {
			"FirstName":line.ShippingAddress.FirstName,"LastName":line.ShippingAddress.LastName,"Street1":line.ShippingAddress.Street1,"Street2":line.ShippingAddress.Street2,"City":line.ShippingAddress.City,"State":line.ShippingAddress.State,"Zip":line.ShippingAddress.Zip,"Phone":line.ShippingAddress.Phone,"Country":"US"
		};
		var common = {}, deliverySum=0;
		if(this.cardMsg != true && line.xp.CardMessage){
			common = {"CardMessage":{
				"line1":line.xp.CardMessage.line1,"line2":line.xp.CardMessage.line2,"line3":line.xp.CardMessage.line3,"line4":line.xp.CardMessage.line4
				}
			};
		}
		if(line.xp.deliveryRun=='Run4'){
			if(!line.xp.deliveryFeesDtls)
				line.xp.deliveryFeesDtls = {};
			line.xp.deliveryFeesDtls.PriorityDelivery = vm.buyerDtls.xp.DeliveryRuns[0].Run4.charge;
		}
		angular.forEach(line.xp.deliveryFeesDtls, function(val, key){
			deliverySum += parseFloat(val);
		});
		if(deliverySum > 250){
			line.xp.Discount = deliverySum - 250;
			deliverySum = 250;
		}
		line.xp.TotalCost = deliverySum+(parseFloat(line.Quantity)*parseFloat(line.UnitPrice));
		//line.xp.addressType = line.addressTypeD;
		if(line.selectedAddrID){
			//params = _.extend(common,{"deliveryNote":line.xp.deliveryNote,"deliveryDate":line.xp.deliveryDate,"deliveryCharges":line.xp.deliveryCharges,"addressType":line.xp.addressType,"deliveryCharges": line.xp.deliveryCharges,"TotalCost": parseFloat(line.xp.deliveryCharges)+(parseFloat(line.Quantity)*parseFloat(line.UnitPrice))});
			if(line.xp.deliveryChargeAdjReason == "---select---")
				delete line.xp.deliveryChargeAdjReason;
			OrderCloud.As().LineItems.Patch(vm.order.ID, line.ID, {"ShippingAddressID":line.selectedAddrID,"xp":line.xp}).then(function(res){
				$scope.onLoadCheckout();
			});
		}else{
			/*OrderCloud.As().LineItems.SetShippingAddress(vm.order.ID, line.ID, params).then(function(data){
				params = _.extend(common,{"deliveryNote":line.xp.deliveryNote,"deliveryDate":line.xp.deliveryDate,"deliveryCharges":line.xp.deliveryCharges,"addressType":line.xp.addressType,"deliveryCharges": line.xp.deliveryCharges,"TotalCost": parseFloat(line.xp.deliveryCharges)+(parseFloat(line.Quantity)*parseFloat(line.UnitPrice))});
				if(line.xp.deliveryChargeAdjReason != "---select---")
					params.deliveryChargeAdjReason = line.xp.deliveryChargeAdjReason;
				OrderCloud.As().LineItems.Patch(vm.order.ID, line.ID, {"xp":params}).then(function(res){
					$scope.onLoadCheckout();
				});
			});*/
			line.ShipFromAddressID = 'testShipFrom';
			OrderCloud.As().LineItems.Update(vm.order.ID, line.ID, line).then(function(dat){
				OrderCloud.As().LineItems.SetShippingAddress(vm.order.ID, line.ID, line.ShippingAddress).then(function(data){
					if(line.xp.Status){
						OrderCloud.As().Orders.Patch(vm.order.ID, {"xp": {"Status": line.xp.Status}}).then(function(res){
							console.log("Order Status OnHold Updated.......");
							$scope.onLoadCheckout();
							alert("Data submitted successfully");
						});
					}else{
						$scope.onLoadCheckout();
						alert("Data submitted successfully");
					}
				});
			});
		}
	};
	vm.viewAddrBook = function(Index){
		vm['isAddrShow'+Index] = true;
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
	vm.reviewAddress = function(){
		$scope.usercard = {};
		//console.log("$scope.seluser", $scope.seluser);
		OrderCloud.CreditCards.ListAssignments(null, $scope.seluser).then(function(assign){
			OrderCloud.CreditCards.Get(assign.Items[0].CreditCardID).then(function(data){
				$scope.usercard = data;
			});
		})
	};
	vm.UpdateAddress = function(addr, index){
		var $this = this;
		addr.Phone = "("+addr.Phone1+") "+addr.Phone2+"-"+addr.Phone3;
		var addrValidate = {
			"addressLine1": addr.Street1, 
			"addressLine2": addr.Street2,
			"zipcode": addr.Zip, 
			"country": "US"
		};
		if(addrValidate){
			AddressValidationService.Validate(line.ShippingAddress).then(function(response){
				if(response.ResultCode == 'Success') {
					var validatedAddress = response.Address;
					var zip = validatedAddress.PostalCode.substring(0, 5);
					addr.Zip = parseInt(zip);
					addr.Street1 = validatedAddress.Line1;
					addr.Street2 = null;
					addr.City = validatedAddress.City;
					addr.State = validatedAddress.Region;
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
							vm['isDeliAddrShow'+index] = false;
						});
					});
				}else{
					alert("Address Not Found........");
				}
			});
		}
	};
	vm.CreateAddress = function(line, index){
		var $this = this, params, addrValidate;
		//var params = {"FirstName":line.FirstName,"LastName":line.LastName,"Street1":line.Street1,"Street2":line.Street2,"City":line.City,"State":line.State,"Zip":line.Zip,"Phone":"("+line.Phone1+") "+line.Phone2+"-"+line.Phone3,"Country":"US"};
		line.Phone = "("+line.Phone1+") "+line.Phone2+"-"+line.Phone3;
		line.Country = "US";
		addrValidate = {
			"addressLine1": line.Street1, 
			"addressLine2": line.Street2,
			"zipcode": line.Zip, 
			"country": "US"
		};
		if(addrValidate){
			AddressValidationService.Validate(line.ShippingAddress).then(function(response){
				if(response.ResultCode == 'Success'){
					var validatedAddress = response.Address;
					var zip = validatedAddress.PostalCode.substring(0, 5);
					line.Zip = parseInt(zip);
					line.Street1 = validatedAddress.Line1;
					line.Street2 = null;
					line.City = validatedAddress.City;
					line.State = validatedAddress.Region;
					OrderCloud.Addresses.Create(line).then(function(data){
						data.Zip = parseInt(data.Zip);
						BuildOrderService.GetPhoneNumber(data.Phone).then(function(res){
							data.Phone1 = res[0];
							data.Phone2 = res[1];
							data.Phone3 = res[2];
						});
						$scope.addressesList.push(data);
						$this.limit = $scope.addressesList.length;
						params = {"AddressID": data.ID, "UserID": vm.order.FromUserID, "IsBilling": false, "IsShipping": true};
						OrderCloud.Addresses.SaveAssignment(params).then(function(res){
							console.log("Address saved for the user....!" +res);
						});
						$this['showNewAddress'+index] = false;
					});
				}else{
					alert("Address Not Found........");
				}
			});
		}
	};
	vm.viewMore = function(){
		this.limit = $scope.addressesList.length;
	};
	vm.newAddress = function(Index){
		$scope['showNewAddress'+Index] = true;
	};
	vm.deliveryAddr = function(Index){
		vm['isDeliAddrShow'+Index] = true;
	};
	//$scope.deliveryOrStore = 1;
	vm.fromStoreOrOutside = 1;
	var storesData;
	vm.getStores = function(line){
		if(!vm.storeNames){
			BuildOrderService.GetStores().then(function(res){
				storesData = res.data.stores;
				vm.storeNames = Underscore.pluck(res.data.stores, 'storeName');
			});
		}
		if(line){
			/*if(line.deliveryOrStore==2){
				line.xp.addressType = "Will Call";
				line.xp.addressType = "Will Call";
			}*/
			if(line.xp.addressType == "Will Call" && line.willSearch){
				vm.getDeliveryCharges(line);
			}
		}
	};
	vm.getStores();
	vm.addStoreAddress = function(item, line){
		var filt = _.filter(storesData, function(row){
			return _.indexOf([item],row.storeName) > -1;
		});
		if(line.ShippingAddress == null)
			line.ShippingAddress = {};
		//store.ShippingAddress.FirstName = filt[0].storeName;
		//store.ShippingAddress.LastName = filt[0].storeName;
		line.ShippingAddress.Street1 = filt[0].storeAddress;
		//store.ShippingAddress.Street2 = filt[0].Street2;
		line.ShippingAddress.City = filt[0].city;
		line.ShippingAddress.State = filt[0].state;
		line.ShippingAddress.Zip = parseInt(filt[0].zipCode);
		BuildOrderService.GetPhoneNumber(filt[0].phoneNumber).then(function(res){
			line.ShippingAddress.Phone1 = res[0];
			line.ShippingAddress.Phone2 = res[1];
			line.ShippingAddress.Phone3 = res[2];
		});
		vm.getDeliveryCharges(line);
	};
	vm.changeAddrType = function(line){
		//line.xp.addressType = line.addressTypeD;
		/*if(line.xp.addressType != "Will Call"){
			line.deliveryOrStore = 1;
		}else{
			line.deliveryOrStore = 2;
		}*/
		vm.getDeliveryCharges(line);
		/*if(addressType == "Hospital" && !vm.HospitalNames){
			vm.GetAllList("Hospitals");
		}
		if(addressType == "Funeral" && !vm.FuneralNames){
			vm.GetAllList("FuneralHome");
		}
		if(addressType == "Church" && !vm.ChurchNames){
			vm.GetAllList("Church");
		}
		if(addressType == "School" && !vm.SchoolNames){
			vm.GetAllList("School");
		}*/
	}
	vm.getDeliveryCharges = function(line){
		vm.NoDeliveryFees = false;
		angular.forEach(vm.AvoidMultipleDelryChrgs, function(val, key){
			val.deliveryDate = new Date(val.deliveryDate);
			line.xp.deliveryDate = new Date(line.xp.deliveryDate);
			var dt1 = (("0" + (val.deliveryDate.getMonth()+1)).slice(-2))+"-"+(("0" + val.deliveryDate.getDate()).slice(-2))+"-"+val.deliveryDate.getFullYear();
			var dt2 = (("0" + (line.xp.deliveryDate.getMonth()+1)).slice(-2))+"-"+(("0" + line.xp.deliveryDate.getDate()).slice(-2))+"-"+line.xp.deliveryDate.getFullYear();
			if(dt1 == dt2 && val.Zip == line.ShippingAddress.Zip && (val.Street1).split(/(\d+)/g)[1] == (line.ShippingAddress.Street1).split(/(\d+)/g)[1] && val.deliveryPresent && val.lineID != line.ID){
				vm.NoDeliveryFees = true;
			}
		}, true);
		if(line.ShippingAddress){
			/*BuildOrderService.getCityState(line.ShippingAddress.Zip).then(function(res){
				line.ShippingAddress.City = res.City;
				line.ShippingAddress.State = res.State;
			});*/
			var addrValidate = {
				"addressLine1": line.ShippingAddress.Street1, 
				"addressLine2": line.ShippingAddress.Street2,
				"zipcode": line.ShippingAddress.Zip, 
				"country": "US"
			};
		}
		var deliverySum = 0, DeliveryMethod, dt;
		angular.forEach(line.xp.deliveryFeesDtls, function(val, key){
			deliverySum += parseFloat(val);
		});
		delete line.xp.Discount;
		if(deliverySum > 250){
			line.xp.Discount = deliverySum - 250;
			deliverySum = 250;
		}
		line.xp.TotalCost = deliverySum+(parseFloat(line.Quantity)*parseFloat(line.UnitPrice));
		if(line.xp.addressType == "Will Call"){
			DeliveryMethod = "InStorePickUp";
			dt = undefined;
			delete line.xp.deliveryFeesDtls;
		}else{
			if(line.xp.DeliveryMethod == "DirectShip"){
				DeliveryMethod = "DirectShip";
			}
		}
		if(addrValidate){
			 AddressValidationService.Validate(line.ShippingAddress).then(function(res){
				if(res.ResultCode == 'Success') {
					var validatedAddress = res.Address;
					var zip = validatedAddress.PostalCode.substring(0, 5);
					line.ShippingAddress.Zip = parseInt(zip);
					line.ShippingAddress.Street1 = validatedAddress.Line1;
					line.ShippingAddress.Street2 = null;
					line.ShippingAddress.City = validatedAddress.City;
					line.ShippingAddress.State = validatedAddress.Region;
					if(line.ShippingAddress.City == "Minneapolis" || line.ShippingAddress.City == "Saint Paul"){
						DeliveryMethod = "LocalDelivery";
						dt = line.xp.deliveryDate;
					}else{
						DeliveryMethod = "UPS";
						dt = undefined;
						if(DeliveryMethod=="UPS" && line.xp.DeliveryMethod=="Mixed")
							console.log("Don't delete deliveryFeesDtls");
						else
							delete line.xp.deliveryFeesDtls;
					}
					if(line.xp.DeliveryMethod == "DirectShip" && DeliveryMethod != "UPS"){
						DeliveryMethod = "DirectShip";
						dt = line.xp.deliveryDate;
					}
					if(line.xp.DeliveryMethod == "Mixed"){
						DeliveryMethod = "Mixed";
						dt = line.xp.deliveryDate;
					}
					/*if(line.xp.deliveryFeesDtls && (res.data.Address.City != "Minneapolis" || res.data.Address.City != "Saint Paul")){
						DeliveryMethod = line.xp.DeliveryMethod;
						dt = undefined;
					}*/
					if(line.ShippingAddress.City != "Minneapolis" && line.ShippingAddress.City != "Saint Paul"){
						DeliveryMethod = "UPS";
						dt = undefined;
						if(DeliveryMethod=="UPS" && line.xp.DeliveryMethod=="Mixed")
							console.log("Don't delete deliveryFeesDtls");
						else
							delete line.xp.deliveryFeesDtls;
					}
					if(line.xp.DeliveryMethod == "Courier"){
						DeliveryMethod = "Courier";
						dt = line.xp.deliveryDate;
					}
					if(line.xp.DeliveryMethod == "USPS"){
						DeliveryMethod = "USPS";
						dt = line.xp.deliveryDate;
					}
					if(line.xp.addressType == "Will Call"){
						DeliveryMethod = "InStorePickUp";
						dt = undefined;
						delete line.xp.deliveryFeesDtls;
					}
					if(DeliveryMethod=="UPS" && line.xp.DeliveryMethod=="Mixed" ){
						alert("Faster Delivery Is Only Local Delivery...!");
					}else{
						vm.GetDeliveryChrgs(line, DeliveryMethod, dt).then(function(){
							console.log("linedata", line);
							if(vm.NoDeliveryFees == true){
								delete line.xp.deliveryFeesDtls;
								line.xp.deliveryCharges = 0;
								line.xp.TotalCost = parseFloat(line.Quantity)*parseFloat(line.UnitPrice);
							}
						});
					}
				}else{
					alert("Address not found...!");
				}
			});
		}
	};
	vm.GetDeliveryChrgs = function(line, DeliveryMethod, dt){
		var d = $q.defer();
		if(dt){
			BuildOrderService.GetPreceedingZeroDate(dt).then(function(res){
				BuildOrderService.CompareDate(res).then(function(data){
					vm.DeliveryMethodChrgs(line, DeliveryMethod, data, d);
				});
			});
		}else{
			vm.DeliveryMethodChrgs(line, DeliveryMethod, "undefined", d);
		}
		return d.promise;
	}
	vm.DeliveryMethodChrgs = function(line, DeliveryMethod, data, d){
		BuildOrderService.GetDeliveryOptions(line, DeliveryMethod).then(function(res){
			var obj = {};
			if(res['UPS'] && !res['LocalDelivery'] && !res['Mixed'] && !res['InStorePickUp'] && !res['USPS'] && !res['DirectShip'] && !res['Courier']){
				DeliveryMethod = "UPS";
			}
			if(data != "1" && DeliveryMethod == "LocalDelivery"){
				delete res.LocalDelivery.SameDayDelivery;
			}
			angular.forEach(res[DeliveryMethod], function(val, key){
				obj[key] = val;
			}, true);
			line.xp.deliveryFeesDtls = obj;
			line.xp.TotalCost = 0;
			line.xp.deliveryCharges = 0;
			angular.forEach(line.xp.deliveryFeesDtls, function(val, key){
				line.xp.TotalCost += parseFloat(val);
				line.xp.deliveryCharges += parseFloat(val);
			});
			//delete line.xp.Discount;
			if(line.xp.TotalCost > 250){
				line.xp.Discount = line.xp.TotalCost - 250;
				line.xp.TotalCost = 250;
			}	
			line.xp.TotalCost = line.xp.TotalCost + (line.Quantity * line.UnitPrice);
			d.resolve("1");
		});
	}
	vm.selectedAddr = function(line,addr){
		if(addr.isAddrOpen){
			line.selectedAddrID = addr.ID;
			//var del = _.findWhere(vm.buyerDtls.xp.ZipCodes, {zip: addr.Zip.toString()});
			//line.xp.deliveryCharges = del.DeliveryCharge;
			//line.xp.TotalCost = parseFloat(line.xp.deliveryCharges) + (parseFloat(line.Quantity) * parseFloat(line.UnitPrice));
			line.xp.deliveryChargeAdjReason = vm.buyerDtls.xp.deliveryChargeAdjReasons[0];
		}
		else
			delete line.selectedAddrID;
	};
	//------Date picker starts----------
	vm.dateSelect = function(text,line,index){
		text = text+index;
		vm['data'+index]=text;
		line.dateVal = {};
		if(text.indexOf("dt") > -1)
			line.xp.deliveryDate = $scope.dt;
		else if(text.indexOf("tom") > -1)
			line.xp.deliveryDate = new Date($scope.tom);
		vm.getDeliveryCharges(line);
	};
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
			$scope.datePickerLine.xp.deliveryDate = $scope.tom;
			$scope.datePickerLine.dateVal = {};
		}	
		else{
			if($scope.datePickerLine){
				$scope.datePickerLine.dateVal = {"Month":dateVar.getMonth()+1,"Date":dateVar.getDate(),"Year":dateVar.getFullYear()};
				$scope.datePickerLine.xp.deliveryDate = dateVar;
				vm['data'+$scope.datePickerLine.index] = "selDate"+$scope.datePickerLine.index;	
			}				
		}
		if($scope.datePickerLine)
			vm.getDeliveryCharges($scope.datePickerLine);
	}, true);
	//----------Date picker ends------------------
	$scope.cancelOrder = function(){
		OrderCloud.As().Orders.Cancel(vm.order.ID).then(function(data){
			console.log("Order cancelled successfully");
		});
	};
	$scope.saveForLater = function(note){
		OrderCloud.As().Orders.ListOutgoing(null, null, $stateParams.ID, null, null, "FromUserID").then(function(res){
			/*var filt = _.filter(res.Items, function(row){
				return _.indexOf([vm.order.FromUserID],row.FromUserID) > -1;
			});*/
			angular.forEach(res.Items,function(val, key){
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
	vm.closePopover = function () {
		vm.showDeliveryToolTip = false;
	};
	$scope.gotobuildorder = function(){
		$state.go('buildOrder', {showOrdersummary: true}, {reload:true});
    };
	vm.deliveryInfoEdit = function(e){
		e.preventDefault();
		e.stopPropagation();
		vm.status.isFirstDisabled='false';
		vm.status.delInfoOpen='true';
	};
	vm.deliveryAdj = function(line){
		if(!line.xp.deliveryChargeAdjReason)
			line.xp.deliveryChargeAdjReason = vm.buyerDtls.xp.deliveryChargeAdjReasons[0];
	};
	vm.addressTypeSelect = function(line){
		if(line.xp && line.xp.addressType=="Will Call"){
			vm.getStores(line);
		}
		/*else
			line.deliveryOrStore = 1;*/
		
		var filt = _.filter($scope.storeNames, function(row,index){
			return _.indexOf([line.xp.storeName],row.storeName) > -1;
		});
		if(filt.length!=0)
			line.selected = $scope.storeNames[parseInt(filt[0].id)];
		else
			line.selected = $scope.storeNames[0];
		//line.addressTypeD = line.xp.addressType;
	};
	$scope.GetCityState = function(addr){
		/*BuildOrderService.getCityState(addr.Zip).then(function(res){
			addr.City = res.City;
			addr.State = res.State;
		});*/
		AddressValidationService.Validate(addr).then(function(res){
			if(res.ResultCode == 'Success') {
				addr.City = res.Address.City;
				addr.State = res.Address.Region;
			}
		});
	}
	vm.ApplyCoupon = function(coupon, orderDtls){
		OrderCloud.UserGroups.ListUserAssignments(null, $stateParams.ID).then(function(res){
			OrderCloud.Coupons.ListAssignments(coupon, null, res.Items[0].UserGroupID).then(function(res){
				OrderCloud.Coupons.Get(res.Items[0].CouponID).then(function(res1){
					BuildOrderService.CompareDate().then(function(dt){
						if(new Date(res1.StartDate) <= new Date(dt) && new Date(res1.ExpirationDate) >= new Date(dt)){
							//orderDtls.Total = orderDtls.Total - res1.UsagesRemaining;
							orderDtls.SpendingAccounts.CouponCharges = res1.UsagesRemaining;
							vm.SumSpendingAccChrgs(orderDtls);
						}else{
							alert("Coupon Expired.....");
						}
					});	
				});
			}).catch(function(err){
				alert("Coupon not found.....");
			});
		});
		/*OrderCloud.Coupons.ListAssignments(null, $stateParams.ID).then(function(res){
			angular.forEach(res.Items, function(val, key){
				OrderCloud.Coupons.Get(val.CouponID).then(function(res1){
					if(res1.Code == coupon){
						BuildOrderService.CompareDate().then(function(dt){
							if(new Date(res1.StartDate) <= new Date(dt) && new Date(res1.ExpirationDate) >= new Date(dt)){
								orderDtls.Total = orderDtls.Total - res1.UsagesRemaining;
								orderDtls.CouponCharges = res1.UsagesRemaining;
								res1.UsagesRemaining = 0;
								OrderCloud.Coupons.Update(val.CouponID, res1).then(function(res2){
									console.log("coupon applied...");
								});
							}else{
								alert("Coupon Expired.....");
							}
						});	
					}else{
						alert("Coupon not found.....");
					}	
				});
			}, true);
		});*/
	}
	vm.ApplySpendingAccCharges = function(obj, model, customCharges, orderDtls, type){
		var dat;
		if(model != 'Full'){
			//orderDtls.Total = orderDtls.Total - customCharges;
			dat = customCharges;
		}else{
			//orderDtls.Total = orderDtls.Total - obj.Balance;
			dat = obj.Balance;
		}
		if(type=="Bachman Charges")
			orderDtls.SpendingAccounts.BachmansCharges = dat;
		if(type=="Purple Perks")
			orderDtls.SpendingAccounts.PurplePerk = dat;
		vm.SumSpendingAccChrgs(orderDtls);		
	}
	vm.SumSpendingAccChrgs = function(orderDtls){
		var sum=0;
		angular.forEach(orderDtls.SpendingAccounts, function(val, key){
			if(key!="ChequeNo")
				sum = sum + val;
		}, true);
		if(_.isEmpty(orderDtls.SpendingAccounts)){
			vm.order.Total = vm.order.Subtotal + vm.order.ShippingCost;
		}else{
			vm.order.Total = vm.order.Subtotal + vm.order.ShippingCost - sum;
		}
	}
	vm.deleteSpendingAcc = function(orderDtls, ChargesType){
		delete orderDtls.SpendingAccounts[ChargesType];
		vm.SumSpendingAccChrgs(orderDtls);
	}
	vm.PayByChequeOrCash = function(orderDtls){
		if(vm.PayCashCheque=='PayCash'){
			orderDtls.SpendingAccounts.PaidCash = vm.txtPayCash;
			delete orderDtls.SpendingAccounts.ChequeCharges;
			delete orderDtls.SpendingAccounts.ChequeNo;
		}else if(vm.PayCashCheque=='PayCheque'){
			orderDtls.SpendingAccounts.ChequeCharges = vm.txtChequeAmt;
			orderDtls.SpendingAccounts.ChequeNo = vm.txtChequeNumber;
			delete orderDtls.SpendingAccounts.PaidCash;
		}
		vm.SumSpendingAccChrgs(orderDtls);		
	}
	vm.RedeemGiftCard = function(CardNo, orderDtls){
		OrderCloud.UserGroups.ListUserAssignments(null, $stateParams.ID).then(function(res){
			OrderCloud.SpendingAccounts.ListAssignments(CardNo, null, res.Items[0].UserGroupID).then(function(res1){
				if(res1.Items.length > 0){
					OrderCloud.SpendingAccounts.Get(res1.Items[0].SpendingAccountID).then(function(data){
						vm.UserSpendingAcc[data.Name] = data;
						orderDtls.SpendingAccounts.GiftCardCharges = data.Balance;
						vm.SumSpendingAccChrgs(orderDtls);
					});
				}else{
					alert("Gift Card Not Found...!");
				}	
			});
		});
	}
	vm.UserSpendingAccounts = function(){
		OrderCloud.SpendingAccounts.ListAssignments(null, $stateParams.ID).then(function(res){
			vm.UserSpendingAcc = {};
			angular.forEach(res.Items, function(val, key){
				OrderCloud.SpendingAccounts.Get(val.SpendingAccountID).then(function(data){
					vm.UserSpendingAcc[data.Name] = data;
				});
			},true);
		});
	}
	vm.UserSpendingAccounts();
}