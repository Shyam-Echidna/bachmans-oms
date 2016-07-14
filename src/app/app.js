angular.module( 'orderCloud', [
        'ngSanitize',
        'ngAnimate',
        'ngMessages',
        'ngTouch',
        'ui.tree',
        'ui.router',
        'ui.bootstrap',
        'orderCloud.sdk',
	'LocalForageModule',
        'toastr',
        'jcs-autoValidate',
        'ordercloud-infinite-scroll',
        'ordercloud-buyer-select',
        'ordercloud-search',
        'ordercloud-assignment-helpers',
        'ordercloud-paging-helpers',
        'ordercloud-auto-id',
        'ordercloud-credit-card',
        'ordercloud-current-order',
        'ordercloud-address',
        'ordercloud-lineitems',
        'ordercloud-geography',
		'ui.bootstrap.typeahead',
        'ui.grid',
        'ui.grid.infiniteScroll',
        'ui.grid.edit',
		'algoliasearch'
    ])

    .run( SetBuyerID )
    .config( Routing )
    .config( ErrorHandling )
    .config( Interceptor )
    .controller( 'AppCtrl', AppCtrl )
    .config(DatePickerConfig)
    .constant('urls', {
        constantContactBaseUrl:"https://Four51TRIAL104401.jitterbit.net/Bachmans_Dev/"
    })
;

function DatePickerConfig(uibDatepickerConfig, uibDatepickerPopupConfig){
    uibDatepickerConfig.showWeeks = false;
    uibDatepickerPopupConfig.showButtonBar = false;
}

function SetBuyerID( OrderCloud, buyerid ) {
    OrderCloud.BuyerID.Get() ? angular.noop() : OrderCloud.BuyerID.Set(buyerid);
}

function Routing( $urlRouterProvider, $urlMatcherFactoryProvider, $locationProvider ) {
    $urlMatcherFactoryProvider.strictMode(false);
    $urlRouterProvider.otherwise( '/home' );
    $locationProvider.html5Mode(true);
}

function ErrorHandling( $provide ) {
    $provide.decorator('$exceptionHandler', handler);

    function handler( $delegate, $injector ) {
        return function( ex, cause ) {
            $delegate(ex, cause);
            $injector.get('toastr').error(ex.data ? (ex.data.error || (ex.data.Errors ? ex.data.Errors[0].Message : ex.data)) : ex.message, 'Error');
        };
    }
}

function AppCtrl( $rootScope, $state, $http, appname, LoginService, toastr, $ocMedia, localdeliverytimeurl ) {
    var vm = this;
    vm.name = appname;
    vm.title = appname;
    vm.showLeftNav = true;
    vm.$state = $state;
    vm.$ocMedia = $ocMedia;

    vm.datepickerOptions = {
        showWeeks: false,
        showButtonBar: false
    }

    vm.toggleLeftNav = function() {
        vm.showLeftNav = !vm.showLeftNav;
    };

    vm.logout = function() {
        LoginService.Logout();
    };

    $rootScope.$on('$stateChangeSuccess', function(e, toState) {
		if(toState.name == 'buildOrder'){
			vm.headerstat = true;
		}
		else if(toState.name == 'checkout'){
			vm.headerstat = true;
		}
		else{
			vm.headerstat = false;
		}
		if (toState.data && toState.data.componentName) {
			vm.title = appname + ' - ' + toState.data.componentName
		} else {
			vm.title = appname;
		}
    });

    $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {
        console.log(error);
    });

    $rootScope.$on('OC:AccessInvalidOrExpired', function() {
        LoginService.RememberMe();
    });
    $rootScope.$on('OC:AccessForbidden', function(){
        toastr.warning("I'm sorry, it doesn't look like you have permission to access this page.", 'Warning:');
    })
	$.ajax({
	    method:"GET",
		dataType:"json",
		contentType: "application/json",
		url:localdeliverytimeurl
		}).success(function(data){
			console.log(data);
			vm.cstTime = new Date(data.datetime);
		}).error(function(data){
			console.log(data);
		})
}

function Interceptor( $httpProvider ) {
    $httpProvider.interceptors.push(function($q, $rootScope) {
        return {
            'responseError': function(rejection) {
                if (rejection.config.url.indexOf('ordercloud.io') > -1 && rejection.status == 401) {
                    $rootScope.$broadcast('OC:AccessInvalidOrExpired');
                }
                if (rejection.config.url.indexOf('ordercloud.io') > -1 && rejection.status == 403){
                    $rootScope.$broadcast('OC:AccessForbidden');
                }
                return $q.reject(rejection);
            }
        };
    });
}
