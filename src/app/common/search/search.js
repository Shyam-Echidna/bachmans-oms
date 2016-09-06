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
			attribute:'@',
            controlleras: "="
        },
        restrict: 'E',
        templateUrl: 'common/search/templates/search.tpl.html',
        controller: 'ordercloudSearchCtrl',
        controllerAs: 'ocSearch',
        replace: true
    }
}

function ordercloudSearchCtrl($state, $timeout, $scope, TrackSearch, OrderCloud, algolia, Underscore, BuildOrderService) {
    var searching, vm = this;
	$scope.clearData=function(){
		$scope.search.query="";
		if($scope.servicename=='Addresses'){
			$scope.controlleras.searchedAddr.Items="";
		}
		else
			$scope.controlleras.list="";
	}
	if($scope.servicename!='address'){
		var client = algolia.Client('31LAEMRXWG', '600b3cc15477fd21c5931d1bfbb36b3d');
		$scope.index = client.initIndex($scope.servicename);
		$scope.search = {
			'query' : '',
			'hits' : []
		};
		if($scope.servicename=='products'){
			var ticket = localStorage.getItem("alf_ticket");
			BuildOrderService.GetProductImages(ticket).then(function(imagesList){
				vm.imagesList=imagesList.items;
			})
		}
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
				// $scope.SearchResults= function(seqId){
					// var ticket = localStorage.getItem("alf_ticket");
					// BuildOrderService.GetProductImages(ticket).then(function(imagesList){
						// BuildOrderService.GetSeqProd(seqId).then(function(res){
							// // seqList = _.union(seqList, res);
							// if(res.length==0){
								// $scope.controlleras.list="";
								// $state.go('buildOrder',{SearchType:'Products'});
							// }
							// else {
								// console.log("imagesList", imagesList);
								// BuildOrderService.GetProductList(res, imagesList.items).then(function(prodList){
									// $scope.controlleras.searchList=prodList;
									// if($scope.attribute=='buildorder-search'){
										// $scope.controlleras.buildorderSearch=prodList;
									// }
									// if($scope.placeholder=="Search products"){
										// $state.go('buildOrder',{SearchType:'Products'});
									// }
								// });
							// }
						// });	
					// })
				// }
				// if($scope.servicename=='products' && $scope.attribute=='buildorder-search'){
					// var seqId=[];
					// var searchedProdId=Underscore.pluck(content.hits, "SequenceNumber");
					// seqId=_.union(seqId, searchedProdId);
					// $scope.SearchResults(seqId);
				// }
				// else{
					// $scope.controlleras.list = content.hits;
				// }
				if($scope.servicename=='products' && $scope.attribute=='buildorder-search'){
					var ticket = localStorage.getItem("alf_ticket");
						BuildOrderService.GetProductList(content.hits, vm.imagesList).then(function(prodList){
							$scope.controlleras.buildorderSearch=prodList;
					})
				}
				else if($scope.servicename=='products'){
					var ticket = localStorage.getItem("alf_ticket");
						BuildOrderService.GetProductList(content.hits, vm.imagesList).then(function(prodList){
							$scope.controlleras.searchList=prodList;
						})
				}
				else{
					$scope.controlleras.list = content.hits;
				}
				console.log("dddddd", $scope.controlleras.list);
				// $scope.showProducts = function(){
					// // var seqList=[];
					// var seqId=[];
					// if($scope.placeholder=="Search products"){
						// var searchedProdId=Underscore.pluck(content.hits, "SequenceNumber");
						// seqId=_.union(seqId, searchedProdId);
						// console.log("seqIdseqId", seqId);
						// if(seqId.length>0){
							// $scope.SearchResults(seqId);
						// }
						// else{
							// $scope.controlleras.list="";
							// $state.go('buildOrder',{SearchType:'Products'});
						// }
					// }
				// }
				$scope.showProducts = function(){
					if($scope.placeholder=="Search products" && $scope.servicename=='products'){
						var ticket = localStorage.getItem("alf_ticket");
							BuildOrderService.GetProductList(content.hits, vm.imagesList).then(function(prodList){
								$scope.controlleras.searchList=prodList;
								$state.go('buildOrder',{SearchType:'Products'});
							})
					}
				}
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

