angular.module('ordercloud-credit-card', [])

    .factory('CreditCardService', CreditCardService)

;

function CreditCardService($q, $resource, toastr, authorizeneturl, OrderCloud) {
    return {
        Create: Create,
        Update: Update,
        Delete: Delete,
        ExistingCardAuthCapture: ExistingCardAuthCapture,
        SingleUseAuthCapture: SingleUseAuthCapture
    };
    //Use this function to create a new credit card for an existing customer profile or create a new credit card and a new payment profile at the same time.
    function Create(card) {
        var dfd = $q.defer();
        var token = OrderCloud.Auth.ReadToken();
        var cc = {
            "buyerID": OrderCloud.BuyerID.Get(),
            "orderID": null,
            "transactionType": "createCreditCard",
            "amount": null,
            "cardDetails": {
                "paymentID": null,
                "creditCardID": null,
                "cardholderName": card.CardholderName,
                "cardType": card.CardType,
                "cardNumber": card.CardNumber,
                "expirationDate": card.ExpMonth + card.ExpYear,
                "cardCode": card.CVV
            }
        };
        $resource(authorizeneturl, {}, {authorize: {method: 'POST', headers: {'Authorization': 'Bearer ' + token, 'Content-type': 'application/json'}}}).authorize(cc).$promise
            .then(function(response){
                if(response.messages && response.messages.resultCode && response.messages.resultCode == 'Error') {
                    toastr.info('Sorry, something went wrong. Please check your card data and try again');
                } else  if(response.Error) {
                    toastr.info('Sorry, something went wrong. Please try again');
                } else {
                    toastr.success('Your card has been created', 'Success');
                }
                dfd.resolve();
            })
            .catch(function(){
                toastr.info('Sorry, something went wrong. Please try again');
                dfd.resolve();
            });
        return dfd.promise;
    }

    //Use this function to update a credit card for an existing customer profile.
    function Update(card) {
        var dfd = $q.defer();
        var token = OrderCloud.Auth.ReadToken();
        var cc = {
            "buyerID": OrderCloud.BuyerID.Get(),
            "orderID": null,
            "transactionType": "updateCreditCard",
            "amount": null,
            "cardDetails": {
                "paymentID": null,
                "cardNumber": 'XXXX' + card.PartialAccountNumber,
                "cardholderName": card.CardholderName,
                "creditCardID": card.ID,
                "cardType": card.CardType,
                "expirationDate": card.ExpMonth + card.ExpYear
            }
        };
        $resource(authorizeneturl, {}, {authorize: {method: 'POST', headers: {'Authorization': 'Bearer ' + token, 'Content-type': 'application/json'}}}).authorize(cc).$promise
            .then(function(response){
                console.log(response);
                if((response.messages && response.messages.resultCode && response.messages.resultCode == 'Error')) {
                    toastr.info('Sorry, something went wrong. Please try again');
                } else  if(response.Error) {
                    toastr.info('Sorry, something went wrong. Please try again');
                }
                else {
                    toastr.success('Your card has been updated', 'Success');
                }
                dfd.resolve();
            })
            .catch(function(){
                toastr.info('Sorry, something went wrong. Please try again');
                dfd.resolve();
            });
        return dfd.promise;
    }

    //Use this function to delete a credit card from an existing customer profile.
    function Delete(card) {
        var dfd = $q.defer();
        var token = OrderCloud.Auth.ReadToken();
        var cc = {
            "buyerID": OrderCloud.BuyerID.Get(),
            "orderID": null,
            "transactionType": "deleteCreditCard",
            "amount": null,
            "cardDetails": {
                "paymentID": null,
                "creditCardID": card.ID,
                "cardType": null,
                "cardNumber": null,
                "expirationDate": null,
                "cardCode": null
            }
        };
        var deleteCard = confirm('Are you sure you want to delete this card?');
        if(deleteCard) {
            $resource(authorizeneturl, {}, {authorize: {method: 'POST', headers: {'Authorization': 'Bearer ' + token, 'Content-type': 'application/json'}}}).authorize(cc).$promise
                .then(function(response){
                    if(response.messages && response.messages.resultCode && response.messages.resultCode == 'Error') {
                        toastr.info('Sorry, something went wrong. Please try again');
                    } else  if(response.Error) {
                        toastr.info('Sorry, something went wrong. Please try again');
                    } else {
                        toastr.success('Your card has been deleted', 'Success');
                    }
                    dfd.resolve();
                })
                .catch(function(){
                    toastr.info('Sorry, something went wrong. Please try again')
                    dfd.resolve();
                });
        } else {
            toastr.info('Your card was not deleted.')
        }
        return dfd.promise;
    }

    //Use this function to authorize payment and capture funds for a transaction (on order submit) for an existing credit card.
    //To authorize payment and capture funds on a new card (not one time use), first call the Create method, then call this method.
    function ExistingCardAuthCapture(card, order) {
        var dfd = $q.defer();
        var token = OrderCloud.Auth.ReadToken();
        var cc = {
            "buyerID": OrderCloud.BuyerID.Get(),
            "orderID": order.ID,
            "transactionType": "authCaptureTransaction",
            "amount": order.Total,
            "cardDetails": {
                "paymentID": null,
                "creditCardID": card.ID,
                "cardType": null,
                "cardNumber": null,
                "expirationDate": null,
                "cardCode": card.CVV
            }
        };
        //authorize and capture payment
        $resource(authorizeneturl, {}, {authorize: {method: 'POST', headers: {'Authorization': 'Bearer ' + token, 'Content-type': 'application/json'}}}).authorize(cc).$promise
            .then(function(response){
                if(response.messages && response.messages.resultCode && response.messages.resultCode == 'Error') {
                    toastr.info('Sorry, something went wrong. Please try again');
                } else  if(response.Error) {
                    toastr.info('Sorry, something went wrong. Please try again');
                }
            })
            .catch(function(){
                toastr.info('Sorry, something went wrong. Please try again')
            });
        return dfd.promise;
    }

    //Use this function to authorize a credit card payment and capture funds for a transaction (on order submit). One time use card, does not save.
    function SingleUseAuthCapture(card, order) {
        var dfd = $q.defer();
        var token = OrderCloud.Auth.ReadToken();
        var cc = {
            "buyerID": OrderCloud.BuyerID.Get(),
            "orderID": order.ID,
            "transactionType": "authOnlyTransaction",
            "amount": order.Total,
            "cardDetails": {
                "paymentID": null,
                "creditCardID": null,
                "cardType": card.CardType,
                "cardNumber": card.CardNumber,
                "expirationDate": card.ExpMonth + card.ExpYear,
                "cardCode": card.CVV
            }
        };
        //authorize payment
        $resource(authorizeneturl, {}, {authorize: {method: 'POST', headers: {'Authorization': 'Bearer ' + token, 'Content-type': 'application/json'}}}).authorize(cc).$promise
            .then(function(response){
                if(response.messages && response.messages.resultCode && response.messages.resultCode == 'Error') {
                    toastr.info('Sorry, something went wrong. Please try again');
                } else  if(response.Error) {
                    toastr.info('Sorry, something went wrong. Please try again');
                } else {
                    cc = {
                        "buyerID": OrderCloud.BuyerID.Get(),
                        "orderID": order.ID,
                        "transactionType": "priorAuthCaptureTransaction",
                        "amount": order.Total,
                        "cardDetails": {
                            "paymentID": response.PaymentID,
                            "creditCardID": null,
                            "cardType": null,
                            "cardNumber": null,
                            "expirationDate": null,
                            "cardCode": null
                        }
                    };
                    //capture payment
                    $resource(authorizeneturl, {}, {authorize: {method: 'POST', headers: {'Authorization': 'Bearer ' + token, 'Content-type': 'application/json'}}}).authorize(cc).$promise
                        .then(function(){
                            if(response.messages && response.messages.resultCode && response.messages.resultCode == 'Error') {
                                toastr.info('Sorry, something went wrong. Please try again');
                            } else  if(response.Error) {
                                toastr.info('Sorry, something went wrong. Please try again');
                            }
                            dfd.resolve();
                        })
                        .catch(function(){
                            toastr.info('Sorry, something went wrong. Please try again')
                            dfd.resolve();
                        });
                }
            })
            .catch(function(){
                toastr.info('Sorry, something went wrong. Please try again')
            });
        return dfd.promise;
    }
}