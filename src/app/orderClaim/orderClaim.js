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
			controller: 'OrderClaimCtrl',
			controllerAs: 'orderClaim',
			resolve:{
				Order:function($q, $stateParams, OrderCloud){
					var d=$q.defer();
					OrderCloud.Users.GetAccessToken($stateParams.userID, impersonation)
					.then(function(data) {
						OrderCloud.Auth.SetImpersonationToken(data['access_token']);
						OrderCloud.As().Orders.ListOutgoing(null, null, $stateParams.userID, null, 100, "FromUserID", null, {"Status":"Completed"}).then(function(assignOrders){
							d.resolve(assignOrders);
						})
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
	var refundarr=[];
	vm.uname=$stateParams.name;
	vm.orderID=$stateParams.orderID;
	vm.refund=Buyer.xp.Refunds;
	var totalCost = 0;
	vm.selectresolution="";
	vm.orderclaimarr = [];
	OrderCloud.As().LineItems.List(Order.Items[0].ID).then(function(res){
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
			vm.orderclaimarr.push(orderSummary);
		}
	}
	vm.completeclaim = function(orderID){
		var refundclaimobj={};
		OrderCloud.As().Orders.Get(orderID).then(function(res){
			for(var i=0; i<vm.orderclaimarr.length; i++){
				var refund ={
						"ID":"refund_"+vm.orderclaimarr[i].ID, 
						"LineItem":{
							"LineItemID":vm.orderclaimarr[i].ID, "ReasonCode":vm.orderclaimarr[i].selectcode, "ClaimResolution":vm.orderclaimarr[i].selectresolution, "Reason":vm.orderclaimarr[i].descp, "Amount":50, "Date":new Date()
						}
					};
				refundarr.push(refund);
			}
			refundclaimobj={"Refunds":refundarr};
			var match=angular.extend({},res.xp,refundclaimobj);
			OrderCloud.Orders.Patch(orderID,{"xp":match});
			var orderParams = {"Type": "Standard", "xp":{"OrderSource":"OMS","Claim": true,"Refunds":refundarr}};
			OrderCloud.As().Orders.Create(orderParams).then(function(res1){
				for (var i=0; i<vm.orderclaimarr.length; i++) {
					delete vm.orderclaimarr[i].ID;
					var line1=vm.orderclaimarr[i];
					var orderParams1=angular.extend({},line1.xp,orderParams.xp.Refunds[i]);
					delete vm.orderclaimarr[i].xp;
					var finalxp=angular.extend({},vm.orderclaimarr[i],{"xp":orderParams1});
					OrderCloud.As().LineItems.Create(res1.ID, finalxp).then(function(da){
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
			});
		})
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