angular.module('orderCloud')
    .factory('ConstantContact', ConstantContact)
;

function ConstantContact($q, $http, urls) {
    var service = {
        GetListOfSubscriptions: _listSubscriptions,
        CreateContact:_createContact,
        UpdateContact:_updateContact,
        GetSpecifiedContact:_getContact
    };

    function makeAPICall(method, uri, params){
        var deffer = $q.defer();
        $http({
            method: method,
            url: urls.constantContactBaseUrl + uri,
            data:params
        }).then(function successCallback(response) {
            deffer.resolve(response);
        }, function errorCallback(response) {
            deffer.reject(response);
        });
        return deffer.promise;
    }

    function _listSubscriptions(uri) {
        return makeAPICall('GET', uri, null);
    };

    function _getContact(uri, params) {
        return makeAPICall('POST', uri, params);
    };

    function _createContact(uri, params) {
        return makeAPICall('POST', uri, params);
    };

    function _updateContact(uri, params) {
        return makeAPICall('POST', uri, params);
    };

    return service;
}
