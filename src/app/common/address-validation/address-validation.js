angular.module('ordercloud-address-validation', [])

    .factory('AddressValidationService', AddressValidationService)

;

function AddressValidationService($q, $resource, avalaraaddressurl, OrderCloud) {
    return {
        Validate: Validate
    };
    function Validate(address) {
        var dfd = $q.defer();
        var token = OrderCloud.As().Auth.ReadToken();
        var addressToValidate = {
            "addressline1": address.Street1,
            "addressline2": address.Street2 != null && address.Street2 != "" ? address.Street2 : null,
            "city": address.City,
            "zipcode": address.Zip,
            "country": address.Country
        };
        $resource(avalaraaddressurl, {}, {
            authorize: {
                method: 'POST',
                headers: {'Authorization': 'Bearer ' + token, 'Content-type': 'application/json'}
            }
        }).authorize(addressToValidate).$promise
            .then(function (response) {
                dfd.resolve(response);
            })
            .catch(function (response) {
                dfd.reject(response);
            });
        return dfd.promise;
    }
}
