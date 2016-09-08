angular.module( 'orderCloud' )
    .config( checkoutConfig )
    .controller( 'checkoutCtrl', checkoutController )
	.factory('checkoutService', checkoutService)
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
                    },
					GetCstDateTime: function(BuildOrderService){
						return BuildOrderService.CompareDate();
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

function checkoutController($scope, $state, Underscore, Order, OrderLineItems,ProductInfo, GetBuyerDetails, GetTax, CreditCardService, TaxService, AddressValidationService, SavedCreditCards, OrderCloud, $stateParams, BuildOrderService, $q, AlfrescoFact, $http, checkoutService, LineItemHelpers, PurplePerkEagle, GiftCardEagle, GetCstDateTime) {
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
	var dt = new Date(angular.copy(GetCstDateTime.datetime));
	$scope.dt = new Date(angular.copy(GetCstDateTime.datetime));//today
	vm.CardExpYears = [];
	for(var i=0; i<11; i++){
		vm.CardExpYears.push(dt.getFullYear()+i);
	}
	var today = dt.getMonth()+1+"/"+dt.getDate()+"/"+dt.getFullYear();
	dt = new Date(angular.copy(GetCstDateTime.datetime));
	$scope.tom = new Date(dt.setDate(dt.getDate() + 1));//tomorrow
	vm.initDate = new Date(angular.copy(GetCstDateTime.datetime));//day after tomorrow
	var tomorrow = $scope.tom;
	tomorrow = tomorrow.getMonth()+1+"/"+tomorrow.getDate()+"/"+tomorrow.getFullYear();
	vm.status = {
		delInfoOpen : true,
		paymentOpen : false,
		reviewOpen : false,
		isFirstDisabled: false,
		isSecondDisabled: false
	};

    vm.getRecipientSubTotal = function(lineitems) {
		return Underscore.pluck(lineitems, 'LineTotal').reduce(function(prev, current) {
			return prev + current;
		}, 0);
    };

    vm.getRecipientTax = function(lineitems) {
        angular.forEach(lineitems, function(item){
            var line = Underscore.findWhere(GetTax.ResponseBody.TaxLines, {LineNo: item.ID});
            item.TaxCost = line.Tax;
        });
        return Underscore.pluck(lineitems, 'TaxCost').reduce(function(prev, current) {
            return prev + current;
        }, 0);
    };

    vm.submitOrder = function(card, billingAddress) {
		if(vm.addCard){
			checkoutService.AddCreditCard(card, billingAddress, vm).then(function(res1){
				if(res1=="1"){
					checkoutService.SpendingAccountsRedeemtion(vm.orderDtls.SpendingAccounts).then(function(res2){
						if(res2=="1"){
							checkoutService.CreditCardPayment(vm).then(function(res3){
								if(res3=="1"){
									console.log("-========>");
								}
							});
						}
					});
				}
			});
		}else{
			checkoutService.SpendingAccountsRedeemtion(vm.orderDtls.SpendingAccounts).then(function(res1){
				if(res1=="1"){
					checkoutService.CreditCardPayment(vm).then(function(res2){
						if(res2=="1"){
							console.log("-========>");
						}
					});
				}
			});
		}
		/*var PaymentType, TempStoredArray = [], dat = new Date();
		angular.forEach(vm.orderDtls.SpendingAccounts, function(val, key){
			PaymentType = {"Type":"SpendingAccount", "SpendingAccountID":val.ID, "Description": key, "Amount": val.Amount, "xp":null};
			if(key == "Cheque" || key == "PaidCash"){
				PaymentType.Type = "PurchaseOrder";
				delete PaymentType.ID;
				if(key == "Cheque")
					PaymentType.xp = {"ChequeNo": val.ChequeNo};
			}
			TempStoredArray.push(OrderCloud.Payments.Create(vm.order.ID, PaymentType));
		}, true);
		$q.all(TempStoredArray).then(function(result){
			TempStoredArray = [];
			angular.forEach(result, function(val, key){
				TempStoredArray.push(OrderCloud.Payments.CreateTransaction(vm.order.ID, val.ID, {"Type": val.Type, "DateExecuted": (dat.getMonth()+1)+"/"+dat.getDate()+"/"+dat.getFullYear(), "Amount":val.Amount, "xp": null}));
			}, true);
			$q.all(TempStoredArray).then(function(result2){
				console.log("===========>>>"+result2);
			});
		});*/
        /*if(vm.selectedCard && vm.order.Total > 0) {
            CreditCardService.ExistingCardAuthCapture(vm.selectedCard, vm.order)
                .then(function(res){
					if(res.ResponseBody.messages.resultCode != "Error"){
						OrderCloud.Orders.Submit(vm.orderID)
							.then(function(){
								TaxService.CollectTax(vm.orderID)
									.then(function(){
										$state.go('orderConfirmation' , {userID: vm.order.FromUserID ,ID: vm.orderID});
									})
							});
					}	
                });
        } else if(!vm.selectedCard && vm.order.Total > 0) {
			CreditCardService.SingleUseAuthCapture(vm.card, vm.order)
                .then(function(res){
					if(res.ResponseBody.messages.resultCode != "Error"){
						OrderCloud.Orders.Submit(vm.orderID)
							.then(function(){
								TaxService.CollectTax(vm.orderID)
									.then(function(){
										$state.go('orderConfirmation' , {userID: vm.order.FromUserID ,ID: vm.orderID});
									})
							});
					}		
				});	
        } else{
			OrderCloud.Orders.Submit(vm.orderID)
				.then(function(){
					TaxService.CollectTax(vm.orderID)
						.then(function(){
							$state.go('orderConfirmation' , {userID: vm.order.FromUserID ,ID: vm.orderID});
						})
				});
        }*/
    };
	vm.deleteCreditCard = function(){
		var card = {"ID":""};
		CreditCardService.Delete(card).then(function(res){
			console.log("deleted credit card....."+res);
		});
	};
	vm.getBillingAddress = function(card){
		OrderCloud.As().Me.GetAddress(card.xp.BillingAddressID).then(function(res) {
			card.BillingAddress = res;
		});
	};
	vm.EditBillingAddress = function(billingAddress, index, form){
		form.$submitted = true;
		billingAddress.Phone = "("+billingAddress.Phone1+") "+billingAddress.Phone2+"-"+billingAddress.Phone3;
		AddressValidationService.Validate(billingAddress).then(function(res){
			if(res.ResponseBody.ResultCode == 'Success') {
				form.invalidAddress = false;
				var validatedAddress = res.ResponseBody.Address;
				var zip = validatedAddress.PostalCode.substring(0, 5);
				billingAddress.Zip = parseInt(zip);
				billingAddress.Street1 = validatedAddress.Line1;
				billingAddress.Street2 = null;
				billingAddress.City = validatedAddress.City;
				billingAddress.State = validatedAddress.Region;
				billingAddress.Country = validatedAddress.Country;
				OrderCloud.As().Me.UpdateAddress(billingAddress.ID, billingAddress).then(function(res){
					vm['EditBillAddress'+index] = !vm['EditBillAddress'+index];
				});
			}else{
				form.invalidAddress = true;
				//alert("Address not found...");
			}
		});		
	};
	vm.ShowEditBillingAddress = function(billingAddress, index){
		BuildOrderService.GetPhoneNumber(billingAddress.Phone).then(function(res){
			billingAddress.Phone1 = res[0];
			billingAddress.Phone2 = res[1];
			billingAddress.Phone3 = res[2];
		});
		vm['EditBillAddress'+index] = !vm['EditBillAddress'+index];
	};
	vm.showAddressModal = function(modal, index){
		vm[modal] = !vm[modal];
	};
	/*vm.assignBillingAddress = function(billingAddress, modal){
		BuildOrderService.GetPhoneNumber(billingAddress.Phone).then(function(res) {
			billingAddress.Phone1 = res[0];
			billingAddress.Phone2 = res[1];
			billingAddress.Phone3 = res[2];
		});
		vm.billingAddress = billingAddress;
		vm[modal] = !vm[modal];
	};*/
	vm.ValidateAddress = function(billingAddress, form){
		AddressValidationService.Validate(billingAddress).then(function(res){
			if(res.ResponseBody.ResultCode == 'Success') {
				form.invalidAddress = false;
				var validatedAddress = res.ResponseBody.Address;
				var zip = validatedAddress.PostalCode.substring(0, 5);
				billingAddress.Zip = parseInt(zip);
				billingAddress.Street1 = validatedAddress.Line1;
				billingAddress.Street2 = null;
				billingAddress.City = validatedAddress.City;
				billingAddress.State = validatedAddress.Region;
				billingAddress.Country = validatedAddress.Country;
			}else{
				form.invalidAddress = true;
				//alert("Address not found...");
			}
		});	
	};
	vm.Grouping = function(data){
		var orderDtls = {"subTotal":0,"deliveryCharges":0};
		vm.orderDtls = {};
		vm.deliveryInfo = data;
		var dt,locale = "en-us",dat,index=0;
		var groups = _.groupBy(data, function(obj){
			dt = new Date(obj.xp.deliveryDate);
			var deliverySum=0;
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
			return obj.ShippingAddress.FirstName + ' ' + obj.ShippingAddress.LastName + ' ' + obj.ShippingAddress.Zip + ' ' + (obj.ShippingAddress.Street1).split(/(\d+)/g)[1] + ' ' + obj.xp.DeliveryMethod + ' ' + obj.xp.deliveryDate;
		});
		vm.AvoidMultipleDelryChrgs = _.uniq(vm.AvoidMultipleDelryChrgs, 'lineID');
		vm.orderDtls.subTotal = orderDtls.subTotal;
		vm.orderDtls.deliveryCharges = orderDtls.deliveryCharges;
		vm.orderDtls.SpendingAccounts = {};
		OrderCloud.As().Orders.Patch(vm.order.ID, {"ID": vm.order.ID, "ShippingCost": orderDtls.deliveryCharges}).then(function(res){
            vm.order = res;
        });
		for(var n in groups){
			_.each(groups[n], function(val){
				if(val.xp.deliveryFeesDtls){
					groups[n] = _.reject(groups[n], val);
					groups[n].unshift(val);
				}
			});
		}
		vm.recipientsGroup = groups;
		vm.recipients = [];
		vm.ShipmentsPromise = [];
		for(var n in groups){
			var items = [], Status = null;
			vm.recipients.push(n);
			angular.forEach(groups[n], function(val, key){
				items.push({"OrderID": vm.order.ID, "LineItemID": val.ID, "QuantityShipped": val.Quantity});
				if(val.xp.Status == "OnHold")
					Status = {"Status":"OnHold"};
			}, true);
			vm.ShipmentsPromise.push(OrderCloud.Shipments.Create({"Items":items, "xp":Status}));
		}
		
	};
    vm.Grouping(ProductInfo);
	vm.ProceedToPayment = function(lineitems,index, form) {
		form.$submitted = true;
		if(form.$valid && !form.invalidAddress){
			if (vm.delInfoRecipient[index + 1] != null) {
				vm.delInfoRecipient[index + 1] = true;
			} else{
				vm.status.delInfoOpen = false;
				vm.status.paymentOpen = true;
				vm.status.isFirstDisabled = true;
				vm.status.isSecondDisabled = false;
				vm.deliveryInfoDone = true;
			}
			vm.delInfoTab[index+1]=false;
			vm.lineDtlsSubmit(lineitems,0);
		}
	};
	vm.ProceedToReview = function(billingform, creditcardform){
		if(creditcardform){
			billingform.$submitted = true;
			creditcardform.$submitted = true;
			if(billingform.$valid && creditcardform.$valid && vm.card.ExpMonth!="MM" && vm.card.ExpYear!="YYYY"){
				vm.paymentDone = true;
				vm.status.delInfoOpen = false;
				vm.status.paymentOpen = false;
				vm.status.reviewOpen = true;
				vm.status.isSecondDisabled = true;
				vm.status.isThirdDisabled = false;
			}
		}
		if(vm.selectedCard.cvvform){
			if(vm.selectedCard.cvvform.$invalid){
				vm.selectedCard.cvvform.$submitted = true;
			}else{
				vm.paymentDone = true;
				vm.status.delInfoOpen = false;
				vm.status.paymentOpen = false;
				vm.status.reviewOpen = true;
				vm.status.isSecondDisabled = true;
				vm.status.isThirdDisabled = false;
			}
		}
	};
	vm.lineDtlsSubmit = function(lineitems, index){
		var line = lineitems[index];
		line.ShippingAddress = lineitems[0].ShippingAddress;
		var deliverySum = 0;
		if(line.cardMsg != true){
			delete line.xp.CardMessage;
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
		line.xp.TotalCost = deliverySum+(parseFloat(line.Quantity)*parseFloat(line.UnitPrice))+line.TaxCost;
		if(line.selectedAddrID){
			if(line.xp.deliveryChargeAdjReason == "---select---")
				delete line.xp.deliveryChargeAdjReason;
			OrderCloud.As().LineItems.Patch(vm.order.ID, line.ID, {"ShippingAddressID":line.selectedAddrID,"xp":line.xp}).then(function(res){
				if((lineitems.length)-1 > index){
					vm.lineDtlsSubmit(lineitems, index+1);
				}else{
					OrderCloud.As().LineItems.List(vm.order.ID).then(function(res){
						LineItemHelpers.GetProductInfo(res.Items).then(function(res2){
							vm.Grouping(res2);
						});
					});
				}
			});
		}else{
			line.ShipFromAddressID = 'testShipFrom';
			OrderCloud.As().LineItems.Update(vm.order.ID, line.ID, line).then(function(dat){
				OrderCloud.As().LineItems.SetShippingAddress(vm.order.ID, line.ID, line.ShippingAddress).then(function(data){
					if(line.xp.Status){
						OrderCloud.As().Orders.Patch(vm.order.ID, {"xp": {"Status": line.xp.Status}}).then(function(res){
							if((lineitems.length)-1 > index){
								vm.lineDtlsSubmit(lineitems, index+1);
							}
						});
					}else{
						if((lineitems.length)-1 > index){
							vm.lineDtlsSubmit(lineitems, index+1);
						}
					}
				});
			});
		}
	};
	vm.viewAddrBook = function(Index, line){
		vm['isAddrShow'+Index] = true;
		line.limit = 3;
		$scope.addressesList = [];
		OrderCloud.As().Me.ListAddresses().then(function(data){
			OrderCloud.Me.Get().then(function(defAddress){
				angular.forEach(data.Items, function(val, key){
					val.Zip = parseInt(val.Zip);
					var defualtAddressID;
					if(defAddress.xp)
						defualtAddressID = defAddress.xp.DefaultAddress;
					BuildOrderService.GetPhoneNumber(val.Phone).then(function(res){
						val.Phone1 = res[0];
						val.Phone2 = res[1];
						val.Phone3 = res[2];
					});
					if(defualtAddressID == val.ID)
						$scope.addressesList.unshift(val);
					else
						$scope.addressesList.push(val);
				});
			});
		});
	};
	vm.reviewAddress = function(){
		$scope.usercard = {};
		OrderCloud.CreditCards.ListAssignments(null, $scope.seluser).then(function(assign){
			OrderCloud.CreditCards.Get(assign.Items[0].CreditCardID).then(function(data){
				$scope.usercard = data;
			});
		})
	};
	vm.UpdateAddress = function(addr, index, form){
		form.$submitted = true;
		var $this = this;
		addr.Phone = "("+addr.Phone1+") "+addr.Phone2+"-"+addr.Phone3;
		AddressValidationService.Validate(addr).then(function(response){
			if(response.ResponseBody.ResultCode == 'Success') {
				form.invalidAddress = false;
				var validatedAddress = response.ResponseBody.Address;
				var zip = validatedAddress.PostalCode.substring(0, 5);
				addr.Zip = parseInt(zip);
				addr.Street1 = validatedAddress.Line1;
				addr.Street2 = null;
				addr.City = validatedAddress.City;
				addr.State = validatedAddress.Region;
				addr.Country = validatedAddress.Country;
				line.Shipping = true;
				if(!form.invalidAddress && form.$valid){
					OrderCloud.Addresses.Update(addr.ID,addr).then(function(res){
						var params = {"AddressID": res.ID,"UserID": vm.order.FromUserID,"IsBilling": false,"IsShipping": true};
						OrderCloud.Addresses.SaveAssignment(params).then(function(data){
							$scope.addressesList = _.map($scope.addressesList, function(obj){
								if(obj.ID == addr.ID) {
									obj = res;
									obj.Zip = parseInt(obj.Zip);
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
				}	
			}else{
				form.invalidAddress = true;
			}
		});
	};
	vm.CreateAddress = function(line, index, form){
		form.$submitted = true;
		line.Phone = "("+line.Phone1+") "+line.Phone2+"-"+line.Phone3;
		AddressValidationService.Validate(line).then(function(response){
			if(response.ResponseBody.ResultCode == 'Success'){
				form.invalidAddress = false;
				var validatedAddress = response.ResponseBody.Address;
				var zip = validatedAddress.PostalCode.substring(0, 5);
				line.Zip = parseInt(zip);
				line.Street1 = validatedAddress.Line1;
				line.Street2 = validatedAddress.Line2;
				line.City = validatedAddress.City;
				line.State = validatedAddress.Region;
				line.Country = validatedAddress.Country;
				line.Shipping = true;
				if(!form.invalidAddress && form.$valid){
					OrderCloud.Me.CreateAddress(line).then(function(data){
						data.Zip = parseInt(data.Zip);
						BuildOrderService.GetPhoneNumber(data.Phone).then(function(res){
							data.Phone1 = res[0];
							data.Phone2 = res[1];
							data.Phone3 = res[2];
						});
						$scope.addressesList.push(data);
						line.limit = $scope.addressesList.length;
						vm.newAddress(index);
					});
				}	
			}else{
				form.invalidAddress = true;
			}
		});
	};
	vm.viewMore = function(line){
		if(line.limit == 3)
			line.limit = $scope.addressesList.length;
		else
			line.limit = 3;
	};
	vm.newAddress = function(Index){
		$scope['showNewAddress'+Index] = !$scope['showNewAddress'+Index];
	};
	vm.deliveryAddr = function(Index){
		vm['isDeliAddrShow'+Index] = true;
	};
	vm.back = function(Index){
		vm['isAddrShow'+Index] = false;
	}
	//$scope.deliveryOrStore = 1;
	vm.fromStoreOrOutside = 1;
	var storesData;
	vm.getStores = function(line){
		if(!vm.storeNames){
			BuildOrderService.GetStores().then(function(res){
				storesData = res;
				vm.storeNames = Underscore.pluck(res, 'CompanyName');
			});
		}
		if(line){
			if(line.xp.addressType == "InStorePickUp"){
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
		line.ShippingAddress.Street1 = filt[0].storeAddress;
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
		vm.getDeliveryCharges(line);
	}
	vm.getDeliveryCharges = function(line, form){
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
		if(line.xp.addressType == "InStorePickUp"){
			DeliveryMethod = "InStorePickUp";
			dt = undefined;
			delete line.xp.deliveryFeesDtls;
		}else{
			if(line.xp.DeliveryMethod == "DirectShip"){
				DeliveryMethod = "DirectShip";
			}
		}
		 AddressValidationService.Validate(line.ShippingAddress).then(function(res){
			if(res.ResponseBody.ResultCode == 'Success') {
				form.invalidAddress = false;
				var validatedAddress = res.ResponseBody.Address;
				var zip = validatedAddress.PostalCode.substring(0, 5);
				line.ShippingAddress.Zip = parseInt(zip);
				line.ShippingAddress.Street1 = validatedAddress.Line1;
				line.ShippingAddress.Street2 = null;
				line.ShippingAddress.City = validatedAddress.City;
				line.ShippingAddress.State = validatedAddress.Region;
				line.ShippingAddress.Country = validatedAddress.Country;
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
				if(line.xp.addressType == "InStorePickUp"){
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
				form.invalidAddress = true;
				//alert("Address not found...!");
			}
		});
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
		vm.getDeliveryCharges(line, vm.lineItemForm[line.ID]);
	};
	vm.toggle = function(line,index){
		vm.opened = true;
		$scope.datePickerLine = line;
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
			vm.getDeliveryCharges($scope.datePickerLine, vm.lineItemForm[$scope.datePickerLine.ID]);
	}, true);
	//----------Date picker ends------------------
	$scope.cancelOrder = function(){
		OrderCloud.As().Orders.Cancel(vm.order.ID).then(function(data){
			console.log("Order cancelled successfully");
		});
	};
	$scope.saveForLater = function(note){
		OrderCloud.As().Orders.ListOutgoing(null, null, $stateParams.ID, null, null, "FromUserID").then(function(res){
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
		//vm.status.isFirstDisabled = false;
		vm.status.delInfoOpen = true;
	};
	vm.paymentInfoEdit = function(e){
		e.preventDefault();
		e.stopPropagation();
		//vm.status.isSecondDisabled = false;
		vm.status.paymentOpen = true;
	};
	vm.deliveryAdj = function(line){
		if(!line.xp.deliveryChargeAdjReason)
			line.xp.deliveryChargeAdjReason = vm.buyerDtls.xp.deliveryChargeAdjReasons[0];
	};
	vm.addressTypeSelect = function(line){
		if(line.xp && line.xp.addressType=="InStorePickUp"){
			vm.getStores(line);
		}
		/*else
			line.deliveryOrStore = 1;*/
		
		var filt = _.filter(vm.storeNames, function(row,index){
			return _.indexOf([line.ShippingAddress.CompanyName],row.CompanyName) > -1;
		});
		if(filt.length!=0)
			line.selected = vm.storeNames[parseInt(filt[0].id)];
		else
			line.selected = vm.storeNames[0];
		//line.addressTypeD = line.xp.addressType;
	};
	$scope.GetCityState = function(addr){
		AddressValidationService.Validate(addr).then(function(res){
			if(res.ResponseBody.ResultCode == 'Success') {
				addr.City = res.ResponseBody.Address.City;
				addr.State = res.ResponseBody.Address.Region;
				addr.Country = res.ResponseBody.Address.Country;
			}
		});
	}
	vm.ApplyCoupon = function(coupon, orderDtls){
		OrderCloud.As().Orders.AddPromotion(vm.order.ID, coupon).then(function(data){
			vm.promoerror = "Promotions Applied";
			vm.SumSpendingAccChrgs(orderDtls);
			OrderCloud.As().Orders.Get(vm.order.ID).then(function(res){
				vm.order = res;
			});
		}).catch(function(response){
			vm.promoerror = response.data.Errors[0].Message;
		});
		/*OrderCloud.UserGroups.ListUserAssignments(null, $stateParams.ID).then(function(res){
			OrderCloud.Coupons.ListAssignments(coupon, null, res.Items[0].UserGroupID).then(function(res){
				OrderCloud.Coupons.Get(res.Items[0].CouponID).then(function(res1){
					BuildOrderService.CompareDate().then(function(dt){
						if(new Date(res1.StartDate) <= new Date(dt.date) && new Date(res1.ExpirationDate) >= new Date(dt.date)){
							vm.orderDtls.SpendingAccounts.Coupon = {"ID":res1.ID, "Amount":res1.UsagesRemaining};
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
		OrderCloud.Coupons.ListAssignments(null, $stateParams.ID).then(function(res){
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
	};
	vm.ApplySpendingAccCharges = function(obj, model, customCharges, orderDtls, type){
		var dat;
		if(model != 'Full'){
			dat = customCharges;
		}else{
			dat = obj.Balance;
		}
		if(type=="Bachman Charges")
			vm.orderDtls.SpendingAccounts.BachmansCharges = {"ID":obj.ID, "Amount":dat};
		if(type=="Purple Perks")
			vm.orderDtls.SpendingAccounts.PurplePerks = {"ID":obj.ID, "Amount":dat};
		vm.SumSpendingAccChrgs(orderDtls);	
	};
	vm.SumSpendingAccChrgs = function(orderDtls){
		var sum=0;
		angular.forEach(vm.orderDtls.SpendingAccounts, function(val, key){
			//if(key!="Cheque")
			sum = sum + parseInt(val.Amount);
		}, true);
		if(_.isEmpty(vm.orderDtls.SpendingAccounts)){
			vm.order.Total = vm.order.Subtotal + vm.order.ShippingCost + vm.order.TaxCost + vm.order.PromotionDiscount;
		}else{
			vm.order.Total = vm.order.Subtotal + vm.order.ShippingCost - sum + vm.order.TaxCost + vm.order.PromotionDiscount;
		}
	};
	vm.deleteSpendingAcc = function(orderDtls, ChargesType){
		delete vm.orderDtls.SpendingAccounts[ChargesType];
		vm.SumSpendingAccChrgs(orderDtls);
	};
	vm.RemoveCoupon = function(){
		OrderCloud.As().Orders.ListPromotions(vm.order.ID).then(function(res1){
			OrderCloud.As().Orders.RemovePromotion(vm.order.ID, res1.Items[0].Code).then(function(res2){
				vm.SumSpendingAccChrgs(vm.orderDtls);
				OrderCloud.As().Orders.Get(vm.order.ID).then(function(res3){
					vm.order = res3;
				});
			});
		});	
	};
	vm.PayByChequeOrCash = function(orderDtls){
		if(vm.PayCashCheque=='PayCash'){
			vm.orderDtls.SpendingAccounts.PaidCash = {"Amount":vm.txtPayCash};
			delete vm.orderDtls.SpendingAccounts.Cheque;
		}else if(vm.PayCashCheque=='PayCheque'){
			vm.orderDtls.SpendingAccounts.Cheque = {"ChequeNo":vm.txtChequeNumber, "Amount":vm.txtChequeAmt};
			delete vm.orderDtls.SpendingAccounts.PaidCash;
		}
		vm.SumSpendingAccChrgs(orderDtls);		
	};
	vm.RedeemGiftCard = function(CardNo, orderDtls){
		var params = {
			"transactionDate":"",
			"customerNumber":$stateParams.ID,
			"cardNumber":"2147443647",
			"transactionAmountFromF51":"",
			"four51TimeStamp":""
		};
		OrderCloud.SpendingAccounts.Get(CardNo).then(function(data){
			vm.InvalidGiftCard = false;
			if(data.xp.RedeemDate)
				data.xp.RedeemDate = new Date(data.xp.RedeemDate);
			else
				data.xp.RedeemDate = new Date(angular.copy(GetCstDateTime.datetime));
			params.four51TimeStamp = data.xp.RedeemDate.getFullYear()+"-"+(data.xp.RedeemDate.getMonth()+1)+"-"+data.xp.RedeemDate.getDate()+" "+data.xp.RedeemDate.getHours()+":"+data.xp.RedeemDate.getMinutes()+":"+data.xp.RedeemDate.getSeconds();
			params.transactionAmountFromF51 = data.Balance;
			$http.post(GiftCardEagle, params).success(function(res2){
				if(res2.LatestValue != data.Balance)
					data.Balance = res2.LatestValue;
				vm.UserSpendingAcc[data.Name] = data;
				vm.orderDtls.SpendingAccounts.GiftCard = {"ID":data.ID, "Amount":data.Balance};
				vm.SumSpendingAccChrgs(orderDtls);
			});
		}).catch(function(err){
			vm.InvalidGiftCard = true;
		});
	};
	vm.UserSpendingAccounts = function(){
		OrderCloud.SpendingAccounts.ListAssignments(null, $stateParams.ID).then(function(res){
			vm.UserSpendingAcc = {};
			var params = {
				"transactionDate":"",
				"customerNumber":$stateParams.ID,
				"cardNumber":"2147443647",
				"transactionAmountFromF51":"",
				"four51TimeStamp":""
			}, TempStoredArray = [];
			angular.forEach(res.Items, function(val, key){
				TempStoredArray.push(OrderCloud.SpendingAccounts.Get(val.SpendingAccountID));
			}, true);
			$q.all(TempStoredArray).then(function(result1){
				TempStoredArray = [];
				angular.forEach(result1, function(val, key){
					if(val.xp.RedeemDate)
						val.xp.RedeemDate = new Date(val.xp.RedeemDate);
					else
						val.xp.RedeemDate = new Date(angular.copy(GetCstDateTime.datetime));
					params.four51TimeStamp = val.xp.RedeemDate.getFullYear()+"-"+(val.xp.RedeemDate.getMonth()+1)+"-"+val.xp.RedeemDate.getDate()+" "+val.xp.RedeemDate.getHours()+":"+val.xp.RedeemDate.getMinutes()+":"+val.xp.RedeemDate.getSeconds();
					params.transactionAmountFromF51 = val.Balance;
					if(val.Name == "Purple Perks")
						TempStoredArray.push($http.post(PurplePerkEagle, params));
					if(val.Name == "Bachman Charges")
						vm.UserSpendingAcc[val.Name] = val;
				}, true);
				$q.all(TempStoredArray).then(function(result2){
					angular.forEach(result2, function(val, key){
						var row = _.findWhere(result1, {ID: val.config.data.cardNumber});
						if(val.data.LatestValue != row.Balance)
							row.Balance = val.data.LatestValue;
						vm.UserSpendingAcc[row.Name] = row;
					}, true);
				});
			});
		});
	};
	vm.UserSpendingAccounts();
}

function checkoutService(CreditCardService, $q, OrderCloud, $state, TaxService){
	var service = {
		GetCardType: _getCardType,
		AddCreditCard : _addCreditCard,
		SpendingAccountsRedeemtion : _spendingAccountsRedeemtion,
		CreditCardPayment : _creditCardPayment
	};
	function _getCardType(CardNumber){
		var cards = {
			"Electron": /^(4026|417500|4405|4508|4844|4913|4917)\d+$/,
			"Maestro": /^(5018|5020|5038|5612|5893|6304|6759|6761|6762|6763|0604|6390)\d+$/,
			"Dankort": /^(5019)\d+$/,
			"Interpayment": /^(636)\d+$/,
			"Unionpay": /^(62|88)\d+$/,
			"Visa": /^4[0-9]{12}(?:[0-9]{3})?$/,
			"MasterCard": /^5[1-5][0-9]{14}$/,
			"AmericanExpress": /^3[47][0-9]{13}$/,
			"Diners": /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/,
			"Discover": /^6(?:011|5[0-9]{2})[0-9]{12}$/,
			"Jcb": /^(?:2131|1800|35\d{3})\d{11}$/
		}, defferred = $q.defer();
		for(var key in cards) {
			if(cards[key].test(CardNumber)) {
				defferred.resolve(key);
			}
		}
		return defferred.promise;
	}
	function _addCreditCard(card, billingAddress, vm){
		var d = $q.defer();
		card = angular.copy(card);
		card.ExpMonth = card.ExpMonth.substring(0, 2);
		card.ExpYear = card.ExpYear.toString();
		card.ExpYear = card.ExpYear.substring(2, 4);
		billingAddress.Phone = "("+billingAddress.Phone1+") "+billingAddress.Phone2+"-"+billingAddress.Phone3;
		billingAddress.Country = "US";
		billingAddress.Billing = true;
		delete billingAddress.ID;
		_getCardType(card.CardNumber).then(function(cardtype){
			card.CardType = cardtype;
			CreditCardService.Create(card).then(function(res){
				if(res.ResponseBody.ID){
					OrderCloud.As().Me.CreateAddress(billingAddress).then(function(res1) {
						OrderCloud.As().Me.PatchCreditCard(res.ResponseBody.ID, {"xp":{"BillingAddressID":res1.ID}}).then(function(res2) {
							console.log(res2);
						});
					});
					d.resolve("1");
				}else{
					vm.TransactionError = res.messages;
					d.resolve("0");
				}	
			});
		});
		return d.promise;
	}
	function _spendingAccountsRedeemtion(SpendingAccounts){
		var PaymentType, TempStoredArray = [], dat = new Date(angular.copy(GetCstDateTime.datetime)), d = $q.defer();
		angular.forEach(SpendingAccounts, function(val, key){
			PaymentType = {"Type":"SpendingAccount", "SpendingAccountID":val.ID, "Description": key, "Amount": val.Amount, "xp":null};
			if(key == "Cheque" || key == "PaidCash"){
				PaymentType.Type = "PurchaseOrder";
				delete PaymentType.ID;
				if(key == "Cheque")
					PaymentType.xp = {"ChequeNo": val.ChequeNo};
			}
			TempStoredArray.push(OrderCloud.Payments.Create(vm.order.ID, PaymentType));
		}, true);
		$q.all(TempStoredArray).then(function(result){
			TempStoredArray = [];
			angular.forEach(result, function(val, key){
				TempStoredArray.push(OrderCloud.Payments.CreateTransaction(vm.order.ID, val.ID, {"Type": val.Type, "DateExecuted": (dat.getMonth()+1)+"/"+dat.getDate()+"/"+dat.getFullYear(), "Amount":val.Amount, "xp": null}));
			}, true);
			$q.all(TempStoredArray).then(function(result2){
				console.log("===========>>>"+result2);
				d.resolve("1");
			});
		});
		return d.promise;
	}
	function _creditCardPayment(vm){
		var d = $q.defer();
		if(vm.selectedCard!="createcreditcard" && vm.order.Total > 0) {
            CreditCardService.ExistingCardAuthCapture(vm.selectedCard, vm.order)
                .then(function(res){
					if(res.ResponseBody.messages.resultCode != "Error"){
						OrderCloud.Orders.Submit(vm.orderID)
							.then(function(){
								TaxService.CollectTax(vm.orderID)
									.then(function(){
										$q.all(vm.ShipmentsPromise).then(function(results){
											d.resolve("1");
											$state.go('orderConfirmation' , {userID: vm.order.FromUserID ,ID: vm.orderID});
										});
									});
							});
					}else{
						vm.TransactionError = res.ResponseBody.messages.message[0].text;
						d.resolve("0");
					}
                });
        } else if(vm.selectedCard=="createcreditcard" && vm.order.Total > 0) {
			vm.card.ExpMonth = vm.card.ExpMonth.substring(0, 2);
			vm.card.ExpYear = vm.card.ExpYear.toString();
			vm.card.ExpYear = vm.card.ExpYear.substring(2, 4);
			_getCardType(vm.card.CardNumber).then(function(cardtype){
				vm.card.CardType = cardtype;
			});
			CreditCardService.SingleUseAuthCapture(vm.card, vm.order)
                .then(function(res){
					if(res.ResponseBody.messages.resultCode != "Error"){
						OrderCloud.Orders.Submit(vm.orderID)
							.then(function(){
								TaxService.CollectTax(vm.orderID)
									.then(function(){
										d.resolve("1");
										$state.go('orderConfirmation' , {userID: vm.order.FromUserID ,ID: vm.orderID});
									})
							});
					}else{
						vm.TransactionError = res.ResponseBody.messages.message[0].text;
						d.resolve("0");
					}
				});	
        } else{
			OrderCloud.Orders.Submit(vm.orderID)
				.then(function(){
					TaxService.CollectTax(vm.orderID)
						.then(function(){
							d.resolve("1");
							$state.go('orderConfirmation' , {userID: vm.order.FromUserID ,ID: vm.orderID});
						})
				});
        }
		return d.promise;
	}
	return service;
}