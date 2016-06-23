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
				}
			}
		})
}


function CustInfoController($scope, $exceptionHandler, $stateParams, $state, UserList, spendingAccounts, creditCard, OrderCloud) {
	var vm = this;
	vm.list = UserList;
	vm.spendingAcc=spendingAccounts;
	console.log(vm.list);
	console.log(UserList);
	console.log(vm.list.defaultAddr);
	console.log(vm.list.addresses);
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

}