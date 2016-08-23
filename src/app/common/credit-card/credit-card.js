angular.module('ordercloud-credit-card', [])

    .factory('CreditCardService', CreditCardService)

;

function CreditCardService($q, $resource, toastr, authorizeneturl, OrderCloud) {
    return {
        Create: Create,
        Update: Update,
        Delete: Delete,
        ExistingCardAuthCapture: ExistingCardAuthCapture,
        SingleUseAuthCapture: SingleUseAuthCapture,
        RefundTransaction: RefundTransaction,
        VoidTransaction: VoidTransaction
    };
    //Use this function to create a new credit card for an existing customer profile or create a new credit card and a new payment profile at the same time.
    function Create(card) {
        var dfd = $q.defer();
        var token = OrderCloud.As().Auth.ReadToken();
        var cc = {
            "BuyerID": OrderCloud.BuyerID.Get(),
            "OrderID": null,
            "TransactionType": "createCreditCard",
            "Amount": null,
            "CardDetails": {
                "PaymentID": null,
                "CreditCardID": null,
                "CardholderName": card.CardholderName,
                "CardType": card.CardType,
                "CardNumber": card.CardNumber,
                "ExpirationDate": card.ExpMonth + card.ExpYear,
                "CardCode": card.CVV
            }
        };
        $resource(authorizeneturl, {}, {authorize: {method: 'POST', headers: {'Authorization': 'Bearer ' + token, 'Content-type': 'application/json'}}}).authorize(cc).$promise
            .then(function(response){
                if(response.messages && response.messages.resultCode && response.messages.resultCode == 'Error') {
                    toastr.info('Sorry, something went wrong. Please check your card data and try again');
                } else if(response.Error) {
                    toastr.info('Sorry, something went wrong. Please try again');
                } else {
                    toastr.success('Your card has been created', 'Success');
                }
                dfd.resolve(response);
            })
            .catch(function(){
                toastr.info('Sorry, something went wrong. Please try again');
                dfd.resolve(response);
            });
        return dfd.promise;
    }

    //Use this function to update a credit card for an existing customer profile.
    function Update(card) {
        var dfd = $q.defer();
        var token = OrderCloud.As().Auth.ReadToken();
        var cc = {
            "BuyerID": OrderCloud.BuyerID.Get(),
            "OrderID": null,
            "TransactionType": "updateCreditCard",
            "Amount": null,
            "CardDetails": {
                "PaymentID": null,
                "CardNumber": 'XXXX' + card.PartialAccountNumber,
                "CardholderName": card.CardholderName,
                "CreditCardID": card.ID,
                "CardType": card.CardType,
                "ExpirationDate": card.ExpMonth + card.ExpYear
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
        var token = OrderCloud.As().Auth.ReadToken();
        var cc = {
            "BuyerID": OrderCloud.BuyerID.Get(),
            "OrderID": null,
            "TransactionType": "deleteCreditCard",
            "Amount": null,
            "CardDetails": {
                "PaymentID": null,
                "CreditCardID": card.ID,
                "CardType": null,
                "CardNumber": null,
                "ExpirationDate": null,
                "CardCode": null
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
        var token = OrderCloud.As().Auth.ReadToken();
        var cc = {
            "BuyerID": OrderCloud.BuyerID.Get(),
            "OrderID": order.ID,
            "TransactionType": "authCaptureTransaction",
            "Amount": order.Total,
            "CardDetails": {
                "PaymentID": null,
                "CreditCardID": card.ID,
                "CardType": null,
                "CardNumber": null,
                "ExpirationDate": null,
                "CardCode": card.CVV
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
                dfd.resolve();
            })
            .catch(function(){
                toastr.info('Sorry, something went wrong. Please try again')
            });
        return dfd.promise;
    }

    //Use this function to authorize a credit card payment and capture funds for a transaction (on order submit). One time use card, does not save.
    function SingleUseAuthCapture(card, order) {
        var dfd = $q.defer();
        var token = OrderCloud.As().Auth.ReadToken();
        var cc = {
            "BuyerID": OrderCloud.BuyerID.Get(),
            "OrderID": order.ID,
            "TransactionType": "authOnlyTransaction",
            "Amount": order.Total,
            "CardDetails": {
                "PaymentID": null,
                "CreditCardID": null,
                "CardType": card.CardType,
                "CardNumber": card.CardNumber,
                "ExpirationDate": card.ExpMonth + card.ExpYear,
                "CardCode": card.CVV
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
                        "BuyerID": OrderCloud.BuyerID.Get(),
                        "OrderID": order.ID,
                        "TransactionType": "priorAuthCaptureTransaction",
                        "Amount": order.Total,
                        "CardDetails": {
                            "PaymentID": response.PaymentID,
                            "CreditCardID": null,
                            "CardType": null,
                            "CardNumber": null,
                            "ExpirationDate": null,
                            "CardCode": null
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
    //Use this function to create PARTIAL refunds. Use the VoidTransaction method to refund an entire order
    function RefundTransaction(card, order, amount) {
        var dfd = $q.defer();
        var token = OrderCloud.As().Auth.ReadToken();
        var cc = {
            "BuyerID": OrderCloud.BuyerID.Get(),
            "OrderID": order.ID,
            "TransactionType": "refundTransaction",
            "Amount": amount,
            "CardDetails": {
                "PaymentID": card.paymentID,
                "CreditCardID": card.ID != null ? card.ID : null,
                "CardType": null,
                "CardNumber": card.cardNumber != null ? card.cardNumber : null,
                "ExpirationDate": card.ExpMonth != null && card.ExpYear !=null ? card.ExpMonth + card.ExpYear : null,
                "CardCode": null
            }
        };
        //refund partial payment
        $resource(authorizeneturl, {}, {authorize: {method: 'POST', headers: {'Authorization': 'Bearer ' + token, 'Content-type': 'application/json'}}}).authorize(cc).$promise
            .then(function(response){
                if(response.messages && response.messages.resultCode && response.messages.resultCode == 'Error') {
                    toastr.info('Sorry, something went wrong. Please try again');
                } else  if(response.Error) {
                    toastr.info('Sorry, something went wrong. Please try again');
                }
                dfd.resolve();
            })
            .catch(function(){
                toastr.info('Sorry, something went wrong. Please try again')
            });
        return dfd.promise;
    }
    //Use this function to create FULL refunds. Use the RefundTransaction method to refund a partial order amount
    function VoidTransaction(card, order, amount) {
        var dfd = $q.defer();
        var token = OrderCloud.As().Auth.ReadToken();
        var cc = {
            "BuyerID": OrderCloud.BuyerID.Get(),
            "OrderID": order.ID,
            "TransactionType": "refundTransaction",
            "Amount": amount,
            "CardDetails": {
                "PaymentID": card.paymentID,
                "CreditCardID": card.ID != null ? card.ID : null,
                "CardType": null,
                "CardNumber": card.cardNumber != null ? card.cardNumber : null,
                "ExpirationDate": card.ExpMonth != null && card.ExpYear !=null ? card.ExpMonth + card.ExpYear : null,
                "CardCode": null
            }
        };
        //refund full payment
        $resource(authorizeneturl, {}, {authorize: {method: 'POST', headers: {'Authorization': 'Bearer ' + token, 'Content-type': 'application/json'}}}).authorize(cc).$promise
            .then(function(response){
                if(response.messages && response.messages.resultCode && response.messages.resultCode == 'Error') {
                    toastr.info('Sorry, something went wrong. Please try again');
                } else  if(response.Error) {
                    toastr.info('Sorry, something went wrong. Please try again');
                }
                dfd.resolve();
            })
            .catch(function(){
                toastr.info('Sorry, something went wrong. Please try again')
            });
        return dfd.promise;
    }
}