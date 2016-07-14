angular.module( 'orderCloud' )

	.config( CustInfoConfig )
	.controller( 'CustInfoCtrl', CustInfoController )
;

function CustInfoConfig( $stateProvider ) {
	$stateProvider
		.state( 'custInfo', {
			parent: 'base',
			url: '/custInfo',
			templateUrl: 'custInfo/templates/custInfo.tpl.html',
			controller: 'CustInfoCtrl',
			controllerAs: 'custInfo',
            params: {
                ID:null                
            },
			resolve: {
                UserList: function( OrderCloud, $stateParams, $state, $q) {
                    var arr={};
					var dfr = $q.defer();
                    console.log($stateParams);
                    OrderCloud.Users.Get($stateParams.ID).then(function(data){
					  console.log("dsbhsbhsb", data);
					  arr["user"] = data;
					 // Addresses.ListAssignments('pyAS_zcYkkGWpdeNbvjz1Q').then(function(assign){
						// console.log("assignnn",assign);
						// dfr.resolve(arr);
					 // });
					 console.log("userssss", arr);
					   console.log(arr);
						OrderCloud.Addresses.ListAssignments(null,arr.user.ID).then(function(addrList){
						var addr = {};
						angular.forEach(addrList.Items, function(value, key) {
								OrderCloud.Addresses.Get(value.AddressID).then(function(address){
								// log.push(key + ': ' + final);
								addr[key]=address;
								console.log(addr);
								if(address.xp.IsDefault){
									arr["defaultAddr"]=address;
								}
							 });
							}, addr);
							arr["addresses"] = addr;
							console.log("addresses", arr);
						 
					 });
					 dfr.resolve(arr);
					 console.log(arr);
                    });
                    console.log(arr);
                    return dfr.promise;
                },
				spendingAccounts:function($q, $state, $stateParams, OrderCloud){
					var dfd = $q.defer();
					var arr=[];
					var spendingAcc={};
				    OrderCloud.SpendingAccounts.ListAssignments(null, $stateParams.ID).then(function(assign){
					console.log("spending acoount iddddd:", assign);
						angular.forEach(assign.Items, function(value, key) {
						OrderCloud.SpendingAccounts.Get(value.SpendingAccountID).then(function(spendingacc){
							arr.push(spendingacc);
                            var filterPurple = _.filter(arr, function(row){
                                return _.indexOf(["Purple Perks"],row.Name) > -1;
                            });
                            var filterCharges = _.filter(arr, function(row){
                                return _.indexOf(["Bachman Charges"],row.Name) > -1;
                            });
                            spendingAcc.purple=filterPurple[0];
                            spendingAcc.charges=filterCharges[0];
						})
						});
						 console.log("spending final:", spendingAcc);
						 dfd.resolve(spendingAcc);
					  })
					  
					  return dfd.promise;
				},
				creditCard:function($q, $state, $stateParams, OrderCloud){
					var dfd=$q.defer();
					OrderCloud.CreditCards.ListAssignments(null, $stateParams.ID).then(function(assign){
						console.log("datadatadatadata", assign);
						angular.forEach(assign.Items, function(value, key) {
							OrderCloud.CreditCards.Get(value.CreditCardID).then(function(data){
								console.log("cardddddds",data);
									dfd.resolve(data);
							});
						});
						if(assign.Items.length==0){
							dfd.resolve();
						}
					});
					return dfd.promise;
				},
				userSubscription:function($q, ConstantContact, Underscore, OrderCloud, $stateParams ){
					var dfr=$q.defer();

						var ConstantContactId;
						 OrderCloud.Users.Get($stateParams.ID).then(function(data){
							ConstantContactId=data.xp.ConstantContact.ID;
						 })
						ConstantContact.GetListOfSubscriptions().then(function(subscriptionList){
							var params = {
								"ConstantContactId": ConstantContactId
							}
							ConstantContact.GetSpecifiedContact(params).then(function(res){
							 if(res.data.lists) {
								var userSubIds = Underscore.pluck(res.data.lists, "id");
								angular.forEach(subscriptionList.data, function (subscription) {
									if (userSubIds.indexOf(subscription.id) > -1) {
										subscription.Checked = true;	
									}
									dfr.resolve(subscriptionList.data);
									console.log("subscriptionList.data", subscriptionList.data);
								})
							}
							});
						});
						return dfr.promise;
				}
			}
		})
}


function CustInfoController($scope, $exceptionHandler, $stateParams, $state, UserList, spendingAccounts, creditCard, OrderCloud, userSubscription, Underscore, ConstantContact) {
	var vm = this;
	vm.list = UserList;
	vm.subscribedList=userSubscription;
	console.log("vm.subscribedLis", vm.subscribedList);
	vm.spendingAcc=spendingAccounts;
	vm.creditCard=creditCard;
	console.log("spendingAccounts", spendingAccounts);
	console.log("vm.purple", vm.purple);
	console.log("vm.charges", vm.charges);
	console.log("vm.Account", vm.creditCard);
	  var userid = vm.list.user.ID;
	  $scope.showModal = false;
	 console.log(userid);
	 if(vm.list.user.TermsAccepted != null) {
         vm.list.TermsAccepted = true;
		 console.log(vm.list.TermsAccepted);
    }	
     vm.Submit = function() {
		var today = new Date();
        vm.list.user.TermsAccepted = today;
		OrderCloud.Users.Update(userid, vm.list.user).then(function(){
			OrderCloud.Addresses.Update(vm.list.user.xp.DefaultAddress,vm.list.defaultAddr).then(function(){
				$state.go('custInfo', {}, {reload:true});
			})
		})
          .catch(function(ex) {
                 $exceptionHandler(ex)
            });
     }
	$scope.ok=function(){
		OrderCloud.Users.Update(userid, vm.list.user).then(function(){
			alert("Password changed");
		})
		.catch(function(ex) {
                 $exceptionHandler(ex)
        });
	}
	$scope.viewChangePassword = function(){
		$scope.showModal = !$scope.showModal;
	}
	vm.updateSubscription= function(){
		var SubList = Underscore.filter(vm.subscribedList, function (subscription) {
			  return  subscription.Checked  == true;
		})
		var params = {
			"id": vm.list.user.xp.ConstantContact.ID,
			"lists": SubList,
			"email_addresses": [{ "email_address": vm.list.user.Email}]
		}
		ConstantContact.UpdateContact(params).then(function(res){
			console.log("subscribedListparams", res);
		});
	}
}