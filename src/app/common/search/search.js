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

function ordercloudSearchCtrl($timeout, $scope, OrderCloud, TrackSearch) {
    $scope.searchTerm = null;
    if ($scope.servicename) {
        var var_name = $scope.servicename.replace(/([a-z])([A-Z])/g, '$1 $2');
        $scope.placeholder = "Search " + var_name + '...';
        var Service = OrderCloud[$scope.servicename];
    }
    var searching;
    $scope.$watch('searchTerm', function(n,o) {
        if (n == o) {
            if (searching) $timeout.cancel(searching);
        } else {
            if (searching) $timeout.cancel(searching);
            searching = $timeout(function() {
                n == '' ? n = null : angular.noop();
                TrackSearch.SetTerm(n);
                if($scope.servicename === 'Orders' && $scope.placeholder=='Search orders') {
                    if (!$scope.controlleras.searchfunction) {
                        Service.ListIncoming(null, null, n)
                            .then(function (data){
                                $scope.controlleras.list = data;
                            });
                    }
                    else {
                        $scope.controlleras.searchfunction($scope.searchTerm)
                            .then(function (data){
                                $scope.controlleras.list = data;
                            });
                    }
                }
                else if ($scope.servicename === 'SpendingAccounts') {
                    if (!$scope.controlleras.searchfunction) {
                        Service.List(n, null, null, null, null, {'RedemptionCode': '!*'})
                            .then(function (data){
                                $scope.controlleras.list = data;
                            });
                    }
                    else {
                        $scope.controlleras.searchfunction($scope.searchTerm)
                            .then(function (data){
                                $scope.controlleras.list = data;
                            });
                    }
                }
                else if ($scope.servicename === 'Shipments') {
                    if (!$scope.controlleras.searchfunction) {
                        Service.List(null, n, null, null)
                            .then(function (data) {
                                $scope.controlleras.list = data;
                            });
                    }
                    else {
                        $scope.controlleras.searchfunction($scope.searchTerm)
                            .then(function (data){
                                $scope.controlleras.list = data;
                            });
                    }
                }
				else if($scope.servicename === 'Orders' && $scope.placeholder=='Search recipient') {
                    console.log($scope);
					var arr={};
					var ordr=[];
					var shipAddr=[];
                    if (!$scope.controlleras.searchfunction) {
                        Service.ListIncoming(null,null,null,null,100)
                            .then(function (data){
								angular.forEach(data.Items, function(value, key) {
									console.log("list value",value);
										ordr.push(value.FromUserFirstName + " " + value.FromUserLastName);
										OrderCloud.LineItems.List(value.ID,null ,null, null, null, null, {'ShippingAddress.FirstName':n}).then(function(lineitems){
											// angular.forEach(lineitems.Items, function(value, key) {
													 // shipAddr.push(lineitems.ShippingAddress);
													// // console.log("lineitems value", shipAddr);
													// $scope.controlleras.list = shipAddr;
													// console.log("ppppppp", shipAddr);
													
											// });
											shipAddr.push(lineitems);
											console.log("lineitems value", shipAddr);
									});
								});
								console.log("lineitems value", shipAddr);
                                // $scope.controlleras.list = data;
                            });
									arr["sender"]=ordr;
									arr["shipAddress"]=shipAddr;
									console.log("senderr value",arr);
								console.log("shipAddress value outside", arr["shipAddress"]);
                    }
                    else {
                        $scope.controlleras.searchfunction($scope.searchTerm)
                            .then(function (data){
                                $scope.controlleras.list = data;
                                console.log($scope.controlleras.list);
                            });
                    }
                }
                else if($scope.servicename === 'Products'){
                    if (!$scope.controlleras.searchfunction) {
                        Service.List(n, null, null,"Name")
                            .then(function (data){
                                $scope.controlleras.prodlist = data;
                                console.log($scope.controlleras.prodlist);
								$scope.controlleras.searchVal = $scope.searchTerm;
                            });
                    }
                    else {
                        $scope.controlleras.searchfunction($scope.searchTerm)
                            .then(function (data){
                                $scope.controlleras.prodlist = data;
                            });
                    }
                }
				else if($scope.servicename === 'Users' && $scope.placeholder=='Search phone number'){
                    if (!$scope.controlleras.searchfunction) {
                        Service.List(n, null, null,"Phone")
                            .then(function (data){
                               $scope.controlleras.list = data;
                            });
                    }
                    else {
                        $scope.controlleras.searchfunction($scope.searchTerm)
                            .then(function (data){
                                $scope.controlleras.list = data;
                            });
                    }
                }
                else {
                    if (!$scope.controlleras.searchfunction) {
                        Service.List(n)
                            .then(function (data){
                                $scope.controlleras.list = data;
                            });
                    }
                    else {
                        $scope.controlleras.searchfunction($scope.searchTerm)
                            .then(function (data){
                                $scope.controlleras.list = data;
                            });
                    }
                }

            }, 300);
        }
    });
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

