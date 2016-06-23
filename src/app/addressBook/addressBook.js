angular.module( 'orderCloud' )

	.config( AddressBookConfig )
	.controller( 'AddressBookCtrl', AddressBookController )

function AddressBookConfig( $stateProvider ) {
	$stateProvider
		.state( 'addressBook', {
			parent: 'base',
			url: '/addressBook',
			templateUrl: 'addressBook/templates/addressBook.tpl.html',
			controller: 'AddressBookCtrl',
			controllerAs: 'addressBook',
			params: {
                ID:null                
            },
			resolve: {
                AddressBook: function(OrderCloud, $stateParams, $state, $q) {
                    var arr={};
					 var dfr = $q.defer()
						OrderCloud.Addresses.ListAssignments(null,$stateParams.ID).then(function(addrList){
						//console.log(JSON.stringify(addrList.Items));
						var addr = [];
						angular.forEach(addrList.Items, function(value, key) {
							OrderCloud.Addresses.Get(value.AddressID).then(function(address){
								// log.push(key + ': ' + final);
								addr.push(address);
							 });
							}, addr);
							arr["addresses"] = addr;
							console.log("addresesssssss", arr["addresses"]);
							dfr.resolve(arr);
						});
						return dfr.promise;
                }
				}
		})
}


function AddressBookController($scope, $http, $state, $stateParams, $location, $anchorScroll, AddressBook, OrderCloud) {
	var vm=this;
	vm.list=AddressBook;
	console.log("vm.listvm.list", vm.list);
	console.log("vm.listvm.list.addresses", vm.list.addresses);
	$scope.CreateAddress = function(line){
		var $this = this;
		var params = {"FirstName":line.FirstName,"LastName":line.LastName,"Street1":line.Street1,"Street2":line.Street2,"City":line.City,"State":line.State,"Zip":line.Zip,"Phone":"("+line.Phone1+")"+line.Phone2+"-"+line.Phone3,"Country":"IN", "xp":{}};
		OrderCloud.Addresses.Create(params).then(function(data){
		data.Zip = parseInt(data.Zip);
		
		params = {"AddressID": data.ID,"UserID": $stateParams.ID,"IsBilling": false,"IsShipping": true};
		OrderCloud.Addresses.SaveAssignment(params).then(function(res){
			$state.go('addressBook', {}, {reload:true});
			console.log("Address saved for the user....!" +res);
		});
		})
	}
	vm.makeDefault=function(address){
		_.filter(vm.list.addresses, function(row){
		// return _.indexOf([true],row.xp.IsDefault) > -1;
			if(row.xp.IsDefault){
			var	data ={
				"IsDefault" :false
			};
			vm.default(data,row);
			}
		});
		var	data = {
				"IsDefault" :true
			};
		vm.default(data,address);
	}
	vm.default= function(dataVal,obj){
			var row=obj;
			var data=dataVal;
			var oldDefault = {
				"FirstName":row.FirstName, "LastName":row.LastName, "Street1":row.Street1, "Street2":row.Street2,"City":row.City, "State":row.State, "Zip":row.Zip, "Phone":row.Phone, "Country": row.Country, "xp":data
			};
			OrderCloud.Addresses.Update(row.ID, oldDefault).then(function(){
			console.log("addressaddressaddress111111111", row);
				$state.go('addressBook', {}, {reload:true});
			})
		}
	vm.editAddress = function(editAddr, editAddress){
		vm.editAddr=editAddr;
		$scope.showedit=false;
		vm.stateData=vm.editAddr.State;
		vm.contact={};
		var phn = vm.editAddr.Phone;
		var init = phn.indexOf('(');
		var fin = phn.indexOf(')');
		vm.contact.Phone1 = parseInt(phn.substr(init+1,fin-init-1));
		init = phn.indexOf(')');
		fin = phn.indexOf('-');
		vm.contact.Phone2 = parseInt(phn.substr(init+1,fin-init-1));
		init = phn.indexOf('-');
		vm.contact.Phone3 = parseInt(phn.substr(init+1,phn.length));
		console.log("vm.contact.Phone1"+ " " + vm.contact.Phone1 + " " +"vm.contact.Phone2"+ " " +vm.contact.Phone2 + " " + "vm.contact.Phone3" + " " + vm.contact.Phone3);
		$location.hash('top');
        $anchorScroll();
	}
	vm.saveAddress = function(saveAddr, contact){
			saveAddr.Phone = "("+contact.Phone1+")"+contact.Phone2+"-"+contact.Phone3;
			console.log("saveAddr.Phone", saveAddr.Phone);
			OrderCloud.Addresses.Update(saveAddr.ID, saveAddr).then(function(){
				$state.go('addressBook', {}, {reload:true});
			})
	}
	vm.deleteAddr =function(addrID){
		OrderCloud.Addresses.Delete(addrID, true).then(function(){
			$state.go('addressBook', {}, {reload:true});
		});
	}
	vm.stateSelected = function(stateSelected){
		vm.stateData=stateSelected;
	};
	$scope.deleteAddress = {
        templateUrl: 'deleteAddress.html',
    }
    $scope.closePopover = function () {
        $scope.showDeliveryToolTip = false;
    };
    $scope.cancelPopUp = function () {
        this.$parent.showDeliveryToolTip = false;
    };
};
