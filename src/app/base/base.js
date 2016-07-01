angular.module( 'orderCloud' )

    .config( BaseConfig )
    .factory('BaseService', BaseService)
    .factory('GlobalObjectService', GlobalObjectService)
    .controller('BaseCtrl', BaseController)
    .controller('BaseLeftCtrl', BaseLeftController)
    .controller('BaseTopCtrl', BaseTopController)
    .controller('BaseDownCtrl', BaseDownController)
    .controller('BuildOrderTopCtrl', BuildOrderTopController)
    .factory('AlfrescoFact', AlfrescoFact)
;

function BaseConfig( $stateProvider ) {
    $stateProvider
        .state( 'base', {
            url: '',
            abstract: true,
            templateUrl:'base/templates/base.tpl.html',
            views: {
                '': {
                    templateUrl: 'base/templates/base.tpl.html',
                    controller: 'BaseCtrl',
                    controllerAs: 'base'
                },
                'top@base': {
                    templateUrl: 'base/templates/base.top.tpl.html',
                    controller: 'BaseTopCtrl',
                    controllerAs: 'baseTop'
                },
                'left@base': {
                    templateUrl: 'base/templates/base.left.tpl.html',
                    controller: 'BaseLeftCtrl',
                    controllerAs: 'baseLeft'
                },
                'down@base': {
                    templateUrl: 'base/templates/base.down.tpl.html',
                    controller: 'BaseDownCtrl',
                    controllerAs: 'baseDown'
                }
            },
            resolve: {
                CurrentUser: function($q, $state, OrderCloud) {
                    var dfd = $q.defer();
                    OrderCloud.Me.Get()
                        .then(function(data) {
                            dfd.resolve(data);
                        })
                        .catch(function(){
                            OrderCloud.Auth.RemoveToken();
                            OrderCloud.Auth.RemoveImpersonationToken();
                            OrderCloud.BuyerID.Set(null);
                            $state.go('login');
                            dfd.resolve();
                        });
                    return dfd.promise;
                },
                ComponentList: function($state, $q, Underscore, CurrentUser) {
                    var deferred = $q.defer();
                    var nonSpecific = ['Products', 'Specs', 'Price Schedules', 'Admin Users'];
                    var components = {
                        nonSpecific: [],
                        buyerSpecific: []
                    };
                    angular.forEach($state.get(), function(state) {
                        if (!state.data || !state.data.componentName) return;
                        if (nonSpecific.indexOf(state.data.componentName) > -1) {
                            if (Underscore.findWhere(components.nonSpecific, {Display: state.data.componentName}) == undefined) {
                                components.nonSpecific.push({
                                    Display: state.data.componentName,
                                    StateRef: state.name
                                });
                            }
                        } else {
                            if (Underscore.findWhere(components.buyerSpecific, {Display: state.data.componentName}) == undefined) {
                                components.buyerSpecific.push({
                                    Display: state.data.componentName,
                                    StateRef: state.name
                                });
                            }
                        }
                    });
                    deferred.resolve(components);
                    return deferred.promise;
                },
                Tree: function (BaseService) {
                    return BaseService.GetCategoryTree();
                },
                UserList: function (OrderCloud) {
                    return OrderCloud.Users.List();
                },
                ProductList: function (OrderCloud) {
                    return OrderCloud.Products.List();
                },
                Alfrescoticket: function (AlfrescoFact) {
                    return AlfrescoFact.Get().then(function (data) {
                        console.log(data);
                        var ticket = data.data.ticket;
                        localStorage.setItem("alf_ticket", ticket);
                        return ticket;
                    });
                }
            }
        });
}

function BaseService($q, $localForage, Underscore, OrderCloud) {
    var service = {
 
        GetCategoryTree: _getCategoryTree,
        GetProductList: _getProductList
    };
 
    function _getCategoryTree() {
        var tree = [];
        var categories = [];
        var deferred = $q.defer();
        var queue = [];
 
        OrderCloud.Categories.List(null, 1, 100, null, null, null, null,'all').then(function(data) {
            console.log(data);
            categories = categories.concat(data.Items);
            for (var i = 2; i <= data.Meta.TotalPages; i++) {
                queue.push(OrderCloud.Categories.List(null, i, 100,  null, null, null, null, 'all'));
            }
            $q.all(queue).then(function(results) {
                angular.forEach(results, function(result) {
                    categories = categories.concat(result.Items);
                });
                //deferred.resolve(categories);       
                function _getnode(node) {
                    var children = Underscore.where(categories, { ParentID: node.ID});
                    if (children.length > 0) {
                        node.children = children;
                        angular.forEach(children, function(child) {
                            return _getnode(child);
                        });
                    } else {
                        node.children = [];
                    }
 
                    return node;
                }
                angular.forEach(Underscore.where(categories, { ParentID: null}), function(node) {
                    tree.push(_getnode(node));
                });
            });
            deferred.resolve(tree);
        });
        return deferred.promise;
    }
    
    function _getProductList() {
        return OrderCloud.Products.List();
    }
    return service;
}

function BaseController(CurrentUser, defaultErrorMessageResolver, ProductList, AlfrescoFact, $scope) {
    var vm = this;
    vm.currentUser = CurrentUser;
	$scope.search = {
        'query' : '',
        'hits' : []
    };
    defaultErrorMessageResolver.getErrorMessages().then(function (errorMessages) {
        errorMessages['customPassword'] = 'Password must be at least eight characters long and include at least one letter and one number';
        //regex for customPassword = ^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!$%@#£€*?&]{8,}$
        errorMessages['positiveInteger'] = 'Please enter a positive integer';
        //regex positiveInteger = ^[0-9]*[1-9][0-9]*$
        errorMessages['ID_Name'] = 'Only Alphanumeric characters, hyphens and underscores are allowed';
        //regex ID_Name = ([A-Za-z0-9\-\_]+)
        errorMessages['confirmpassword'] = 'Your passwords do not match';
        errorMessages['noSpecialChars'] = 'Only Alphanumeric characters are allowed';
    });
	vm.product = ProductList;
    AlfrescoFact.Get().then(function (data) {
        console.log(data);
        var ticket = data.data.ticket;
        localStorage.setItem("alf_ticket", ticket);
    });
    vm.isopen = false;
    $scope.status = {
        open1: true,
        open1: false
    };
    $scope.status = {
        open2: true,
        open2: false
    };
    $scope.status = {
        open3: true,
        open3: false
    };
	$scope.switchSearch = 'customer';
    $scope.selectChange = function (confirmed) {
        $scope.switchSearch = confirmed;
        // $scope.search.query = "";
        console.log("qqueryyyyy", $scope.search.query);
    };
}

function BaseLeftController(ComponentList) {
    var vm = this;
    vm.catalogItems = ComponentList.nonSpecific;
    vm.organizationItems = ComponentList.buyerSpecific;
	vm.isCollapsed = true;
}

function BaseTopController($scope, Tree, UserList) {
    var vm = this;
	vm.tree = Tree;
    vm.userlist = UserList;
	vm.numRecords = 10;
    vm.page = 1;
	vm.next = function(){
        vm.page = vm.page + 1;
    };
    vm.back = function(){
        vm.page = vm.page - 1;
    };
}

function BaseDownController() {
    var vm = this;
}
 
function BuildOrderTopController() {
    var vm = this;
}
 
function AlfrescoFact($http, $q) {
    var service = {
        Get: _get
    };
    return service;
 
    function _get() {
        var data = {
 
            username: "admin",
            password: "echidna"
        };
        var defferred = $q.defer();
 
        $http({
            method: 'POST',
            dataType: "json",
            url: "http://103.227.151.31:8080/alfresco/service/api/login",
            data: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
 
        }).success(function (data, status, headers, config) {
 
            defferred.resolve(data);
        }).error(function (data, status, headers, config) {
            defferred.reject(data);
        });
        return defferred.promise;
    }
}
 
function GlobalObjectService() {
    var searchList;
    var service = {
        GetSearchObject: _getSearchObject,
        SetSearchObject: _setSearchObject
    };
 
    function _getSearchObject() {
        return searchList;
    }
 
    function _setSearchObject(obj) {
        searchList = obj;
    }
 
    return service;
}
