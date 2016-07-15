// ordercloud search starts

// angular.module('ordercloud-search', []);
// angular.module('ordercloud-search')

    // .directive( 'ordercloudSearch', ordercloudSearch)
    // .controller( 'ordercloudSearchCtrl', ordercloudSearchCtrl)
    // .factory( 'TrackSearch', trackSearchService )
// ;

// function ordercloudSearch () {
    // return {
        // scope: {
            // placeholder: '@',
            // servicename: "@",
            // controlleras: "="
        // },
        // restrict: 'E',
        // templateUrl: 'common/search/templates/search.tpl.html',
        // controller: 'ordercloudSearchCtrl',
        // controllerAs: 'ocSearch',
        // replace: true
    // }
// }

// function ordercloudSearchCtrl($timeout, $scope, OrderCloud, TrackSearch) {
    // $scope.searchTerm = null;
    // if ($scope.servicename) {
        // var var_name = $scope.servicename.replace(/([a-z])([A-Z])/g, '$1 $2');
        // $scope.placeholder = "Search " + var_name + '...';
        // var Service = OrderCloud[$scope.servicename];
    // }
    // var searching;
    // $scope.$watch('searchTerm', function(n,o) {
        // if (n == o) {
            // if (searching) $timeout.cancel(searching);
        // } else {
            // if (searching) $timeout.cancel(searching);
            // searching = $timeout(function() {
                // n == '' ? n = null : angular.noop();
                // TrackSearch.SetTerm(n);
                // if($scope.servicename === 'Orders' && $scope.placeholder=='Search orders') {
                    // if (!$scope.controlleras.searchfunction) {
                        // Service.ListIncoming(null, null, n)
                            // .then(function (data){
                                // $scope.controlleras.list = data;
                            // });
                    // }
                    // else {
                        // $scope.controlleras.searchfunction($scope.searchTerm)
                            // .then(function (data){
                                // $scope.controlleras.list = data;
                            // });
                    // }
                // }
                // else if ($scope.servicename === 'SpendingAccounts') {
                    // if (!$scope.controlleras.searchfunction) {
                        // Service.List(n, null, null, null, null, {'RedemptionCode': '!*'})
                            // .then(function (data){
                                // $scope.controlleras.list = data;
                            // });
                    // }
                    // else {
                        // $scope.controlleras.searchfunction($scope.searchTerm)
                            // .then(function (data){
                                // $scope.controlleras.list = data;
                            // });
                    // }
                // }
                // else if ($scope.servicename === 'Shipments') {
                    // if (!$scope.controlleras.searchfunction) {
                        // Service.List(null, n, null, null)
                            // .then(function (data) {
                                // $scope.controlleras.list = data;
                            // });
                    // }
                    // else {
                        // $scope.controlleras.searchfunction($scope.searchTerm)
                            // .then(function (data){
                                // $scope.controlleras.list = data;
                            // });
                    // }
                // }
				// else if($scope.servicename === 'Orders' && $scope.placeholder=='Search recipient') {
                    // console.log($scope);
					// var arr={};
					// var ordr=[];
					// var shipAddr=[];
                    // if (!$scope.controlleras.searchfunction) {
                        // Service.ListIncoming(null,null,null,null,100)
                            // .then(function (data){
								// angular.forEach(data.Items, function(value, key) {
									// console.log("list value",value);
										// ordr.push(value.FromUserFirstName + " " + value.FromUserLastName);
										// OrderCloud.LineItems.List(value.ID,null ,null, null, null, null, {'ShippingAddress.FirstName':n}).then(function(lineitems){
											// // angular.forEach(lineitems.Items, function(value, key) {
													 // // shipAddr.push(lineitems.ShippingAddress);
													// // // console.log("lineitems value", shipAddr);
													// // $scope.controlleras.list = shipAddr;
													// // console.log("ppppppp", shipAddr);
													
											// // });
											// shipAddr.push(lineitems);
											// console.log("lineitems value", shipAddr);
									// });
								// });
								// console.log("lineitems value", shipAddr);
                                // // $scope.controlleras.list = data;
                            // });
									// arr["sender"]=ordr;
									// arr["shipAddress"]=shipAddr;
									// console.log("senderr value",arr);
								// console.log("shipAddress value outside", arr["shipAddress"]);
                    // }
                    // else {
                        // $scope.controlleras.searchfunction($scope.searchTerm)
                            // .then(function (data){
                                // $scope.controlleras.list = data;
                                // console.log($scope.controlleras.list);
                            // });
                    // }
                // }
                // else if($scope.servicename === 'Products'){
                    // if (!$scope.controlleras.searchfunction) {
                        // Service.List(n, null, null,"Name")
                            // .then(function (data){
                                // $scope.controlleras.prodlist = data;
                                // console.log($scope.controlleras.prodlist);
								// $scope.controlleras.searchVal = $scope.searchTerm;
                            // });
                    // }
                    // else {
                        // $scope.controlleras.searchfunction($scope.searchTerm)
                            // .then(function (data){
                                // $scope.controlleras.prodlist = data;
                            // });
                    // }
                // }
				// else if($scope.servicename === 'Users' && $scope.placeholder=='Search phone number'){
                    // if (!$scope.controlleras.searchfunction) {
                        // Service.List(n, null, null,"Phone")
                            // .then(function (data){
                               // $scope.controlleras.list = data;
                            // });
                    // }
                    // else {
                        // $scope.controlleras.searchfunction($scope.searchTerm)
                            // .then(function (data){
                                // $scope.controlleras.list = data;
                            // });
                    // }
                // }
                // else {
                    // if (!$scope.controlleras.searchfunction) {
                        // Service.List(n)
                            // .then(function (data){
                                // $scope.controlleras.list = data;
                            // });
                    // }
                    // else {
                        // $scope.controlleras.searchfunction($scope.searchTerm)
                            // .then(function (data){
                                // $scope.controlleras.list = data;
                            // });
                    // }
                // }

            // }, 300);
        // }
    // });
// }

// function trackSearchService() {
    // var service = {
        // SetTerm: _setTerm,
        // GetTerm: _getTerm
    // };

    // var term = null;

    // function _setTerm(value) {
        // term = value;
    // }

    // function _getTerm() {
        // return term;
    // }

    // return service;
// }



// algolia search starts
angular.module('ordercloud-search', []);
angular.module('ordercloud-search')

    .directive( 'ordercloudSearch', ordercloudSearch)
    .controller( 'ordercloudSearchCtrl', ordercloudSearchCtrl)
    .factory( 'TrackSearch', trackSearchService )
;

function ordercloudSearch () {
    return {
        scope: {
            placeholder: '@',
            servicename: "@",
            controlleras: "="
        },
        restrict: 'E',
        templateUrl: 'common/search/templates/search.tpl.html',
        controller: 'ordercloudSearchCtrl',
        controllerAs: 'ocSearch',
        replace: true
    }
}

function ordercloudSearchCtrl($timeout, $scope, TrackSearch, OrderCloud, algolia ) {
    var searching;	
	if($scope.servicename!='address'){
		var client = algolia.Client('31LAEMRXWG', '600b3cc15477fd21c5931d1bfbb36b3d');
		$scope.index = client.initIndex($scope.servicename);
		$scope.search = {
			'query' : '',
			'hits' : []
		};
		// $scope.$watch('searchTerm', function(n,o) {
			// if (n == o) {
				// if (searching) $timeout.cancel(searching);
			// } else {
		$scope.$watch('search.query', function(n,o) {
			$scope.controlleras.qeueryLength=$scope.search.query.length;
			if($scope.search.query.length==0){
				$scope.controlleras.list=="";
			}
			$scope.controlleras.searchval=$scope.search.query;
			console.log("qqqqqqqq", $scope.controlleras.searchval);
			if (n == o) {
				if (searching) $timeout.cancel(searching);
			} else {
				if (searching) $timeout.cancel(searching);
				searching = $timeout(function() {
					n == '' ? n = null : angular.noop();
					TrackSearch.SetTerm(n);
			$scope.index.search($scope.search.query)
			.then(function searchSuccess(content) {
				console.log(content);
				// if($scope.switchSearch=='phone'){
					// index.setSettings({
					// attributesToIndex: ['PhoneNumber']
					// },
					// function(err, content) {
					  // if(err)
					  // {
						// console.log("error", err);
					  // }
					// })
				// }
				// else{
					// index.setSettings({
					// attributesToIndex: ['Username', 'FirstName', 'LastName']
					// },
					// function(err, content) {
					  // if(err)
					  // {
						// console.log("error", err);
					  // }
					// })
				// }
				// add content of search results to scope for display in view
				
				$scope.controlleras.list = content.hits;
				console.log("dddddd", $scope.controlleras.list);
			}, function searchFailure(err) {
				console.log(err);
			});
				}, 300);
			}
		});
	}
	if($scope.servicename=='Addresses'){
		var impersonation = {
			"ClientID": "8836BE8D-710A-4D2D-98BF-EDBE7227E3BB",
			"Claims": ["FullAccess"]
		};
		if ($scope.servicename) {
			var var_name = $scope.servicename.replace(/([a-z])([A-Z])/g, '$1 $2');
			$scope.placeholder = "Search " + var_name + '...';
			var Service = OrderCloud[$scope.servicename];
		}
		var searching;
		$scope.$watch('search.query', function(n,o) {
		$scope.controlleras.qeueryLength=$scope.search.query.length;
			if (n == o) {
				if (searching) $timeout.cancel(searching);
			} else {
				if (searching) $timeout.cancel(searching);
				searching = $timeout(function() {
					n == '' ? n = null : angular.noop();
					TrackSearch.SetTerm(n);
					if($scope.servicename === 'Addresses') {
						OrderCloud.Users.GetAccessToken($scope.$parent.addressBook.dd, impersonation)
						.then(function(data) {
							OrderCloud.Auth.SetImpersonationToken(data['access_token']);
							if (!$scope.controlleras.searchfunction) {
								OrderCloud.As().Me.ListAddresses(n)
									.then(function (data){
										$scope.controlleras.searchedAddr = data;
										console.log("kkkkkkk", $scope.controlleras.searchedAddr);
									});
							}
							else {
								$scope.controlleras.searchfunction($scope.searchTerm)
									.then(function (data){
										$scope.controlleras.searchedAddr = data;
									});
							}
						})
					}
					else {
						if (!$scope.controlleras.searchfunction) {
							Service.List(n)
								.then(function (data){
									$scope.controlleras.searchedAddr = data;
								});
						}
						else {
							$scope.controlleras.searchfunction($scope.searchTerm)
								.then(function (data){
									$scope.controlleras.searchedAddr = data;
								});
						}
					}

				}, 300);
			}
			});
	}
}

function trackSearchService() {
    var service = {
        SetTerm: _setTerm,
        GetTerm: _getTerm
    };

    var term = null;

    function _setTerm(value) {
        term = value;
    }

    function _getTerm() {
        return term;
    }

    return service;
}

