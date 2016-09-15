angular.module('orderCloud')
    .factory('ConstantContact', ConstantContact)
;

function ConstantContact($q, $http, urls) {
    var service = {
        GetListOfSubscriptions: _listSubscriptions,
        GetSpecifiedContact:_getContact,
        CreateContact:_createContact,
        UpdateContact:_updateContact,
        SetSubscription:_settingSubscriptions
    };

    var uri = {
        "GSL":"getContactList",
        "GSS":"getSpecificContact",
        "CS":"createConstantContact",
        "US":"updateContact",
        "SS":"updateConstantContactList"
    }

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

    function _listSubscriptions() {
       return makeAPICall('GET', uri.GSL, null);
    };

    function _getContact(params) {
        return makeAPICall('POST', uri.GSS, params);
    };

    function _createContact(params) {
        return makeAPICall('POST', uri.CS, params);
    };

    function _updateContact(params) {
        return makeAPICall('PUT', uri.US, params);
    };

    function _settingSubscriptions(params) {
        return makeAPICall('PUT', uri.SS, params);
    };
    
    return service;
}
