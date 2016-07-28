angular.module('ordercloud-tax', [])

    .factory('TaxService', TaxService)

;

function TaxService($q, $resource, avalarataxurl, OrderCloud) {
    return {
        GetTax: GetTax,
        CollectTax: CollectTax
    };
    function GetTax(orderID) {
        var dfd = $q.defer();
        var token = OrderCloud.As().Auth.ReadToken();
        var requestTax = {
            "buyerID": OrderCloud.BuyerID.Get(),
            "orderID": orderID,
            taxRequestType: 'estimateTax'
        };
        $resource(avalarataxurl, {}, {
            authorize: {
                method: 'POST',
                headers: {'Authorization': 'Bearer ' + token, 'Content-type': 'application/json'}
            }
        }).authorize(requestTax).$promise
            .then(function (response) {
                dfd.resolve(response);
            })
            .catch(function (response) {
                dfd.reject(response);
            });
        return dfd.promise;
    }
    function CollectTax(orderID) {
        var dfd = $q.defer();
        var token = OrderCloud.As().Auth.ReadToken();
        var requestTax = {
            "buyerID": OrderCloud.BuyerID.Get(),
            "orderID": orderID,
            "taxRequestType": 'collectTax'
        };
        $resource(avalarataxurl, {}, {
            authorize: {
                method: 'POST',
                headers: {'Authorization': 'Bearer ' + token, 'Content-type': 'application/json'}
            }
        }).authorize(requestTax).$promise
            .then(function (response) {
                dfd.resolve(response);
            })
            .catch(function (response) {
                dfd.reject(response);
            });
        return dfd.promise;
    }
}
