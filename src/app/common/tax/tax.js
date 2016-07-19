angular.module('ordercloud-tax', [])

    .factory('TaxService', TaxService)

;

function TaxService($q, $resource, avalarataxurl, OrderCloud) {
    return {
        GetTax: GetTax
    };
    function GetTax(orderID) {
        var dfd = $q.defer();
        var token = OrderCloud.As().Auth.ReadToken();
        var requestTax = {
            "buyerID": OrderCloud.BuyerID.Get(),
            "orderID": orderID
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
