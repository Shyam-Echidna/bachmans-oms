angular.module( 'orderCloud' )
	.config( OrderClaimConfig )
	.controller( 'OrderClaimCtrl', OrderClaimController )
	.controller( 'orderClaimPopupCtrl', orderClaimPopupController );

var impersonation = {
	"ClientID": "8836BE8D-710A-4D2D-98BF-EDBE7227E3BB",
	"Claims": ["FullAccess"]
};

function OrderClaimConfig( $stateProvider ) {
	$stateProvider
		.state( 'orderClaim', {
			parent: 'base',
			url: '/orderClaim/:userID/:name/:orderID',
			templateUrl: 'orderClaim/templates/orderClaim.tpl.html',
			views: {
				'': {
					templateUrl: 'orderClaim/templates/orderClaim.tpl.html',
					controller:'OrderClaimCtrl',
					controllerAs: 'orderClaim'
				},
				'orderclaimsummary@orderClaim': {
					templateUrl: 'orderClaim/templates/orderClaimSummary.tpl.html'
				},
				'orderclaimhead@orderClaim': {
					templateUrl: 'orderClaim/templates/orderClaimHead.tpl.html'
				}/*,
				'orderclaimfooter@orderClaim': {
					templateUrl: 'orderClaim/templates/orderClaimFooter.tpl.html'
				}*/
			},
			resolve:{
				Order:function($q, $stateParams, OrderCloud){
					var d=$q.defer();
					OrderCloud.Users.GetAccessToken($stateParams.userID, impersonation)
					.then(function(data) {
						OrderCloud.Auth.SetImpersonationToken(data['access_token']);
						/*OrderCloud.As().Orders.ListOutgoing(null, null, $stateParams.userID, null, 100, "FromUserID", null, {"Status":"Completed"}).then(function(assignOrders){
							d.resolve(assignOrders);
						});*/
						OrderCloud.As().Orders.Get($stateParams.orderID).then(function(assignOrders){
							d.resolve(assignOrders);
						});
					})	
					return d.promise;
				},
				Buyer:function(buyerid, OrderCloud, $q){
					var d=$q.defer();
					OrderCloud.Buyers.Get(buyerid).then(function(res){
						d.resolve(res);
					})
					return d.promise;
				}
			}
		})
}
function OrderClaimController($scope, $stateParams, OrderCloud, Buyer, Order, LineItemHelpers, $uibModal) {
	var vm = this;
	vm.orderclaimsummaryshow=false;
	var refundarr=[];
	var refundclaimobj={};
	vm.uname=$stateParams.name;
	vm.orderID=$stateParams.orderID;
	vm.refund=Buyer.xp.Refunds;
	var totalCost = 0;
	vm.selectresolution="";
	vm.orderclaimarr1 = [];
	OrderCloud.As().LineItems.List(Order.ID).then(function(res){
		$scope.val=res;
		LineItemHelpers.GetProductInfo(res.Items).then(function(data){
			data = _.groupBy(data, function(value){
				if(value.ShippingAddress != null){
					//totalCost += value.xp.TotalCost;
					return value.ShippingAddress.FirstName + ' ' + value.ShippingAddress.LastName + ' ' + value.ShippingAddress.Zip;
				}
			});
			//angular.element(document.getElementById("order-checkout")).scope().orderTotal = totalCost;
			delete data.undefined;
			vm.groups = data;
			vm.lineVal = [];
			$scope.lineTotal = {};
			for(var n in data){
				vm.lineVal.push(n);
				$scope.lineTotal[n] = _.reduce(_.pluck(data[n], 'LineTotal'), function(memo, num){ return memo + num; }, 0);
			}
		});
	});
	vm.selectorderclaims = function(orderSummary){
		if(orderSummary.checkclaim==true){
			vm.orderclaimarr1.push(orderSummary);
			vm.orderclaimarr=_.uniq(vm.orderclaimarr1);
			console.log(vm.orderclaimarr);
		}
	}
	vm.continueclaim = function(){
		if(vm.orderclaimsummaryshow==false){
			vm.orderclaimsummaryshow=true;
			for(var i=0; i<vm.orderclaimarr.length; i++){
				var refund ={
						"ID":"refund_"+vm.orderclaimarr[i].ID, 
						"LineItem":{
							"LineItemID":vm.orderclaimarr[i].ID, "ReasonCode":vm.orderclaimarr[i].selectcode, "ClaimResolution":vm.orderclaimarr[i].selectresolution, "Reason":vm.orderclaimarr[i].descp, "Amount":50, "Date":new Date()
						}
					};
				refundarr.push(refund);
				vm.Item_Refund_Amount=vm.Item_Refund_Amount+vm.orderclaimarr[i].LineTotal;
				vm.Delivery_Refund=vm.Delivery_Refund+vm.orderclaimarr[i].xp.deliveryCharges;
				vm.Tax_Refund=vm.Tax_Refund+vm.orderclaimarr[i].xp.Tax;
			}
			refundclaimobj={"Refunds":refundarr};
			vm.orderclaimsummaryfunc(vm.orderclaimarr);
		}
	}
	vm.completeclaim = function(orderID){
		var refundclaimobj={};
		console.log(vm.orderclaimarr);
		vm.Item_Refund_Amount=0;
		vm.Delivery_Refund=0;
		vm.Tax_Refund=0;
		if(vm.orderclaimsummaryshow==false){
			vm.orderclaimsummaryshow=true;
			refundclaimobj={"Refunds":refundarr};
			vm.orderclaimsummaryfunc(vm.orderclaimarr);
		}
		else{
			OrderCloud.As().Orders.Get(orderID).then(function(res){
				/*for(var i=0; i<vm.orderclaimarr.length; i++){
					var refund ={
							"ID":"refund_"+vm.orderclaimarr[i].ID, 
							"LineItem":{
								"LineItemID":vm.orderclaimarr[i].ID, "ReasonCode":vm.orderclaimarr[i].selectcode, "ClaimResolution":vm.orderclaimarr[i].selectresolution, "Reason":vm.orderclaimarr[i].descp, "Amount":50, "Date":new Date()
							}
						};
					refundarr.push(refund);
				}*/
				vm.neworder = res;
				
				var match=angular.extend({},res.xp,refundclaimobj);
				OrderCloud.Orders.Patch(orderID,{"xp":match});
				var orderParams = {"Type": "Standard", "xp":{"OrderSource":"OMS","Claim": true,"Refunds":refundarr}};
				OrderCloud.As().Orders.Create(orderParams).then(function(res1){
					var claimorderid=res1.ID+"_CL";
					console.log(claimorderid);
					OrderCloud.As().Orders.Patch(res1.ID,{"ID":claimorderid}).then(function(res2){
						for (var i=0; i<vm.orderclaimarr.length; i++) {
							delete vm.orderclaimarr[i].ID;
							var line1=vm.orderclaimarr[i];
							var orderParams1=angular.extend({},line1.xp,orderParams.xp.Refunds[i]);
							delete vm.orderclaimarr[i].xp;
							var finalxp=angular.extend({},vm.orderclaimarr[i],{"xp":orderParams1});
							OrderCloud.As().LineItems.Create(res2.ID, finalxp).then(function(da){
								console.log(da);
								OrderCloud.As().Me.ListCreditCards(null, 1, 100).then(function(cards){
									vm.creditCardsList = cards.Items;
								});
								if(vm.creditCardsList.Items.length==0){
									console.log("test");
								}
								else{
									CreditCardService.RefundTransaction(null, res1.ID, res1.Total)
					                .then(function(resp4){
										if(resp4.ResponseBody.messages.resultCode != "Error"){
											alert("resp4.ResponseBody.messages.resultCode ")
										}else{
											/*vm.TransactionError = resp4.ResponseBody.messages.message[0].text;
											d.resolve("0");*/
											alert("TransactionError");
										}
					                });
								}
								$uibModal.open({
						            templateUrl: 'orderClaim/templates/orderClaimPopup.tpl.html',
						            controller: 'orderClaimPopupCtrl',
						            controllerAs: 'orderClaimPopup',
						            resolve: {
						            	ClaimResolution: function(){
						            		return da.xp.LineItem.ClaimResolution;
						            	},
						            	userID: function($stateParams){
						            		return $stateParams.userID;
						            	}
						            }
						        });
							})
						}
					})
				});
			})
		}
	}
	vm.orderclaimsummaryfunc=function(data){
		console.log(data);
		data = _.groupBy(data, function(value){
				if(value.ShippingAddress != null){
					//totalCost += value.xp.TotalCost;
					return value.ShippingAddress.FirstName + ' ' + value.ShippingAddress.LastName + ' ' + value.ShippingAddress.Zip;
				}
			});
			//angular.element(document.getElementById("order-checkout")).scope().orderTotal = totalCost;
			delete data.undefined;
			vm.groupsummary = data;
			vm.lineValsummary = [];
			$scope.lineTotalsummary = {};
			for(var n in data){
				vm.lineValsummary.push(n);
				$scope.lineTotalsummary[n] = _.reduce(_.pluck(data[n], 'LineTotal'), function(memo, num){ return memo + num; }, 0);
			}
	}
}
function orderClaimPopupController($scope, ClaimResolution, userID, $uibModalInstance){
	var vm = this;
	vm.claimResolution = ClaimResolution;
	if(vm.claimResolution=="Full Refund"){
		alert("Full Refund");
	}
	else if(vm.claimResolution=="Partial Refund"){
		alert("Partial Refund");
	}
	else if(vm.claimResolution=="Full Refund w/Replacement"){
		alert("Full Refund w/Replacement");
	}
	else if(vm.claimResolution=="Partial Refund w/Replacement"){
		alert("Partial Refund w/Replacement");
	}
	else if(vm.claimResolution=="Replacement to Original Value"){
		alert("Replacement to Original Value");
	}
	else if(vm.claimResolution=="Replacement Upgraded"){
		alert("Replacement Upgraded");
	}
	else{
		alert("Gift Card Given");
	}
	vm.userID=userID;
	console.log(vm.claimResolution);
	vm.cancel=function() {
        $uibModalInstance.dismiss('cancel');
    };
}