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
				templateUrl: 'checkout/templates/checkout.tpl.html',
				controller: 'checkoutCtrl',
				controllerAs: 'checkout'
			},
			'checkouttop@checkout': {
				templateUrl: 'checkout/templates/checkout.top.tpl.html',
				controller: 'checkoutCtrl',
				controllerAs: 'checkout'
			},
			'checkoutbottom@checkout': {
				templateUrl: 'checkout/templates/checkout.bottom.tpl.html',
				controller: 'checkoutCtrl',
				controllerAs: 'checkout'
			}     
		}
	});
}

function checkoutController($scope, LineItemHelpers, $http, CurrentOrder, OrderCloud, $stateParams, BuildOrderService, $q, AlfrescoFact) {
	var vm = this;
	vm.logo=AlfrescoFact.logo;
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
				vm.AvoidMultipleDelryChrgs = [];
				LineItemHelpers.GetProductInfo(res.Items).then(function(data) {
						$scope.Grouping(data);
				});
				BuildOrderService.OrderOnHoldRemove(res.Items, vm.order.ID).then(function(dt){
					console.log("Order OnHold Removed....");
				});
			});
			BuildOrderService.GetBuyerDtls().then(function(res){
				res.xp.deliveryChargeAdjReasons.unshift("---select---");
				$scope.buyerDtls = res;
			});
		});
	};
	$scope.onLoadCheckout();
	$scope.Grouping = function(data){
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
				orderDtls.deliveryCharges += parseFloat(val);
			},true);
			//orderDtls.deliveryCharges = obj.xp.deliveryCharges;
			return obj.ShippingAddress.FirstName + ' ' + obj.ShippingAddress.LastName;
		});
		vm.AvoidMultipleDelryChrgs = _.uniq(vm.AvoidMultipleDelryChrgs, 'lineID');
		$scope.orderDtls.subTotal = orderDtls.subTotal;
		$scope.orderDtls.deliveryCharges = orderDtls.deliveryCharges;
		//$scope.orderDtls.Total = orderDtls.subTotal + orderDtls.deliveryCharges;
		OrderCloud.As().Orders.Patch(vm.order.ID, {"ID": vm.order.ID, "xp": {"TotalCost": orderDtls.subTotal + orderDtls.deliveryCharges}}).then(function(res){
            $scope.orderDtls.Total = res.xp.TotalCost;
        });
		$scope.recipientsGroup = groups;
		$scope.recipients = [];
		for(var n in groups){
			$scope.recipients.push(n);
		}
	}
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
				$scope.Grouping($scope.deliveryInfo);
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
		var common = {};
		if(this.cardMsg != true && line.xp.CardMessage){
			common = {"CardMessage":{
				"line1":line.xp.CardMessage.line1,"line2":line.xp.CardMessage.line2,"line3":line.xp.CardMessage.line3,"line4":line.xp.CardMessage.line4
				}
			};
		}	
		if(line.xp.deliveryRun)
			common.deliveryRun = line.xp.deliveryRun;
		line.xp.addressType = line.addressTypeD;
		if(line.selectedAddrID){
			params = _.extend(common,{"deliveryNote":line.xp.deliveryNote,"deliveryDate":line.xp.deliveryDate,"deliveryCharges":line.xp.deliveryCharges,"addressType":line.addressTypeD,"deliveryCharges": line.xp.deliveryCharges,"TotalCost": parseFloat(line.xp.deliveryCharges)+(parseFloat(line.Quantity)*parseFloat(line.UnitPrice))});
			if(line.xp.deliveryChargeAdjReason != "---select---")
				params.deliveryChargeAdjReason = line.xp.deliveryChargeAdjReason;
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
			
			OrderCloud.As().LineItems.Update(vm.order.ID, line.ID, line).then(function(dat){
				OrderCloud.As().LineItems.SetShippingAddress(vm.order.ID, line.ID, line.ShippingAddress).then(function(data){
					if(line.xp.Status){
						OrderCloud.As().Orders.Patch(vm.order.ID, {"xp": {"Status": line.xp.Status}}).then(function(res){
							console.log("Order Status OnHold Updated.......");
							//$scope.onLoadCheckout();
							alert("Data submitted successfully");
						});
					}else{
						//$scope.onLoadCheckout();
						alert("Data submitted successfully");
					}
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
		var $this = this;
		addr.Phone = "("+addr.Phone1+")"+addr.Phone2+"-"+addr.Phone3;
		var addrValidate = {
			"addressLine1": addr.Street1, 
			"addressLine2": addr.Street2,
			"zipcode": addr.Zip, 
			"country": "US"
		};
		if(addrValidate){
			BuildOrderService.addressValidation(addrValidate).then(function(res){
				if(res.data.ResultCode == "Success"){
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
							$this['isDeliAddrShow'+index] = false;
						});
					});
				}else{
					alert("Address Not Found........");
				}
			});
		}
	};
	$scope.CreateAddress = function(line, index){
		var $this = this, params, addrValidate;
		//var params = {"FirstName":line.FirstName,"LastName":line.LastName,"Street1":line.Street1,"Street2":line.Street2,"City":line.City,"State":line.State,"Zip":line.Zip,"Phone":"("+line.Phone1+")"+line.Phone2+"-"+line.Phone3,"Country":"US"};
		line.Phone = "("+line.Phone1+")"+line.Phone2+"-"+line.Phone3;
		line.Country = "US";
		addrValidate = {
			"addressLine1": line.Street1, 
			"addressLine2": line.Street2,
			"zipcode": line.Zip, 
			"country": "US"
		};
		if(addrValidate){
			BuildOrderService.addressValidation(addrValidate).then(function(res){
				if(res.data.ResultCode == "Success"){
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
	var storesData;
	$scope.getStores = function(line){
		if(!$scope.storeNames){
			BuildOrderService.GetStores().then(function(res){
				storesData = res.data.stores;
				$scope.storeNames = _.pluck(res.data.stores, 'storeName');
			});
		}
		if(line){
			if(line.deliveryOrStore==2){
				line.addressTypeD = "Will Call";
				line.xp.addressType = "Will Call";
			}
			if(line.addressTypeD == "Will Call" && line.willSearch){
				$scope.getDeliveryCharges(line);
			}
		}
	};
	$scope.getStores();
	$scope.addStoreAddress = function(item, line){
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
		$scope.getDeliveryCharges(line);
	};
	$scope.changeAddrType = function(line){
		line.xp.addressType = line.addressTypeD;
		if(line.addressTypeD != "Will Call"){
			line.deliveryOrStore = 1;
		}else{
			line.deliveryOrStore = 2;
		}
		$scope.getDeliveryCharges(line);
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
	$scope.getDeliveryCharges = function(line){
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
			BuildOrderService.getCityState(line.ShippingAddress.Zip).then(function(res){
				line.ShippingAddress.City = res.City;
				line.ShippingAddress.State = res.State;
			});
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
			BuildOrderService.addressValidation(addrValidate).then(function(res){
				if(res.data.ResultCode == "Success"){
					if(res.data.Address.City == "Minneapolis" || res.data.Address.City == "Saint Paul"){
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
					if(res.data.Address.City != "Minneapolis" && res.data.Address.City != "Saint Paul"){
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
	$scope.selectedAddr = function(line,addr){
		if(addr.isAddrOpen){
			line.selectedAddrID = addr.ID;
			//var del = _.findWhere($scope.buyerDtls.xp.ZipCodes, {zip: addr.Zip.toString()});
			//line.xp.deliveryCharges = del.DeliveryCharge;
			//line.xp.TotalCost = parseFloat(line.xp.deliveryCharges) + (parseFloat(line.Quantity) * parseFloat(line.UnitPrice));
			line.xp.deliveryChargeAdjReason = $scope.buyerDtls.xp.deliveryChargeAdjReasons[0];
		}
		else
			delete line.selectedAddrID;
	};
	//------Date picker starts----------
	$scope.dateSelect = function(text,line,index){
		text = text+index;
		vm['data'+index]=text;
		line.dateVal = {};
		if(text.indexOf("dt") > -1)
			line.xp.deliveryDate = $scope.dt;
		else if(text.indexOf("tom") > -1)
			line.xp.deliveryDate = new Date($scope.tom);
		$scope.getDeliveryCharges(line);	
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
		if($scope.datePickerLine)
			$scope.getDeliveryCharges($scope.datePickerLine);
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
	$scope.GetCityState = function(addr){
		BuildOrderService.getCityState(addr.Zip).then(function(res){
			addr.City = res.City;
			addr.State = res.State;
		});
	}
	vm.ApplyCoupon = function(coupon, orderDtls){
		OrderCloud.Coupons.ListAssignments(null, $stateParams.ID).then(function(res){
			angular.forEach(res.Items, function(val, key){
				OrderCloud.Coupons.Get(val.CouponID).then(function(res1){
					if(res1.Code == coupon){
						BuildOrderService.CompareDate().then(function(dt){
							if(new Date(res1.StartDate) <= new Date(dt) && new Date(res1.ExpirationDate) >= new Date(dt)){
								orderDtls.Total = orderDtls.Total - res1.UsagesRemaining;
								orderDtls.CouponCharges = res1.UsagesRemaining;
								/*res1.UsagesRemaining = 0;
								OrderCloud.Coupons.Update(val.CouponID, res1).then(function(res2){
									console.log("coupon applied...");
								});*/
							}else{
								alert("Coupon Expired.....");
							}
						});	
					}else{
						alert("Coupon not found.....");
					}	
				});
			}, true);
		});
	}
	/*vm.ApplyCoupon = function(){
		OrderCloud.SpendingAccounts.ListAssignments(null, $stateParams.ID).then(function(res){
			vm.SpendingAccounts = res.Items;
		});
	}*/
}