angular.module( 'orderCloud' )
	.config( OrderClaimConfig )
	.controller( 'OrderClaimCtrl', OrderClaimController );

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
					console.log("dddd", $stateParams);
					var d=$q.defer();
					OrderCloud.Users.GetAccessToken($stateParams.userID, impersonation)
					.then(function(data) {
						OrderCloud.Auth.SetImpersonationToken(data['access_token']);
						OrderCloud.As().Orders.ListOutgoing(null, null, $stateParams.userID, null, 100, "FromUserID", null, {"Status":"Completed"}).then(function(assignOrders){
							console.log("assignOrders", assignOrders);
							d.resolve(assignOrders);
						})
					})	
					return d.promise;
				},
				Buyer:function(buyerid, OrderCloud, $q){
					var d=$q.defer();
					OrderCloud.Buyers.Get(buyerid).then(function(res){
						console.log(res);
						d.resolve(res);
					})
					return d.promise;
				}
			}
		})
}
function OrderClaimController($scope, $stateParams, OrderCloud, Buyer, Order, LineItemHelpers) {
	var vm = this;
	vm.uname=$stateParams.name;
	vm.orderID=$stateParams.orderID;
	vm.refund=Buyer.xp.Refunds;
	console.log(vm.refund);
	console.log("lineitem1212",Order);
	var totalCost = 0;
	vm.selectresolution="";
	vm.orderclaimarr = [];
	OrderCloud.As().LineItems.List(Order.Items[0].ID).then(function(res){
		console.log("res", res);
		$scope.val=res;
		LineItemHelpers.GetProductInfo(res.Items).then(function(data){
			data = _.groupBy(data, function(value){
				if(value.ShippingAddress != null){
					//totalCost += value.xp.TotalCost;
					return value.ShippingAddress.FirstName + ' ' + value.ShippingAddress.LastName + ' ' + value.ShippingAddress.Zip;
				}
			});
			console.log("data",data);
			//angular.element(document.getElementById("order-checkout")).scope().orderTotal = totalCost;
			delete data.undefined;
			$scope.groups = data;
			$scope.lineVal = [];
			$scope.lineTotal = {};
			for(var n in data){
				$scope.lineVal.push(n);
				$scope.lineTotal[n] = _.reduce(_.pluck(data[n], 'LineTotal'), function(memo, num){ return memo + num; }, 0);
			}
			console.log('lineTotal',$scope.lineTotal);
		});
	});
	vm.selectorderclaims = function(orderSummary){
		if(orderSummary.checkclaim==true){
			vm.orderclaimarr.push(orderSummary);
		}
		console.log("orderclaimarr", vm.orderclaimarr, orderSummary);
	}
	vm.completeclaim = function(orderID){
		var refundarr=[];
		var refundclaimobj={};
		OrderCloud.Orders.Get(orderID).then(function(res){
			for(var i=0; i<vm.orderclaimarr.length; i++){
				var refund ={
						"ID":"refund_"+vm.orderclaimarr[i].ID, 
						"LineItem":{
							"LineItemID":vm.orderclaimarr[i].ID, "ReasonCode":vm.orderclaimarr[i].selectcode, "ClaimResolution":vm.orderclaimarr[i].selectresolution, "Reason":vm.orderclaimarr[i].descp, "Amount":50, "Date":new Date()
						}
					};
				/*var refund={
					res.xp+','+[
						{
							"ID":"refund_"+vm.orderclaimarr[i].ID, 
							"LineItem":{
								"LineItemID":vm.orderclaimarr[i].ID, "ReasonCode":vm.orderclaimarr.selectcode, "ClaimResolution":vm.orderclaimarr.selectresolution, "Reason":vm.orderclaimarr.descp, "Amount":50, "Date":new Date()
							}
						}
					]
				};*/
				refundarr.push(refund);
				console.log(refund);
			}
			refundclaimobj={"Refund":refundarr};
			console.log(JSON.stringify(refundclaimobj));
			var match=angular.extend({},res.xp,refundclaimobj);
			console.log(JSON.stringify(match));
			OrderCloud.Orders.Patch(orderID,{"xp":match});
			var orderParams = {"Type": "Standard", "xp":{"OrderSource":"OMS"}};
			OrderCloud.As().Orders.Create(orderParams).then(function(res1){
												console.log(res1);
											});
		})

	}
}