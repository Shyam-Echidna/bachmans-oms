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
					 var dfr = $q.defer();
						/*OrderCloud.Addresses.ListAssignments(null,$stateParams.ID).then(function(addrList){
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
						*/
						OrderCloud.As().Me.ListAddresses(null, 1, 100).then(function(addrList){
							dfr.resolve(addrList);
							console.log("addrList", addrList);
						})
						
						return dfr.promise;
                }
				}
		})
}


function AddressBookController($scope, $http, $state, $stateParams, $location, $anchorScroll, AddressBook, OrderCloud, BuildOrderService, AddressValidationService) {
	var vm=this;
	vm.list=AddressBook.Items;
	vm.searchedAddr;
	var prevIndex;
	vm.defaultEdit=false;
	vm.defaultAddr=_.filter(vm.list, function(obj) {
		return _.indexOf([obj.xp.IsDefault], true) > -1
	});
	console.log("vm.defaultAddr", vm.defaultAddr);
	vm.getLocation=function(){
		AddressValidationService.Validate($scope.addr).then(function(res){
			$scope.addr.City = res.Address.City;
			$scope.addr.State = res.Address.Region;
		});
	}
	vm.getLoactionEdit=function(){
		AddressValidationService.Validate(vm.editAddr).then(function(res){
			vm.editAddr.City = res.Address.City;
			vm.editAddr.State = res.Address.Region;
		});
	}
	$scope.CreateAddress = function(line){
		var $this = this;
		if(line.xp==null)
			line.xp = {};
			line.xp.IsDefault=false;
		line.Phone = "("+line.Phone1+") "+line.Phone2+"-"+line.Phone3;
		line.xp.NickName = line.NickName;
			AddressValidationService.Validate(line).then(function(res){
				var validatedAddress = res.Address;
				var zip = validatedAddress.PostalCode.substring(0, 5);
				line.Zip = parseInt(zip);
				line.Street1 = validatedAddress.Line1;
				line.Street2 = null;
				line.City = validatedAddress.City;
				line.State = validatedAddress.Region;
				line.Country = validatedAddress.Country;
				if(res.ResultCode == 'Success') {
					/*
					OrderCloud.Addresses.Create(line).then(function(data){
					data.Zip = parseInt(data.Zip);
						var params = {"AddressID": data.ID,"UserID": $stateParams.ID,"IsBilling": false,"IsShipping": true};
							OrderCloud.Addresses.SaveAssignment(params).then(function(res){
							$state.go('addressBook', {}, {reload:true});
							console.log("Address saved for the user....!" +res);
						});
					}) */
					OrderCloud.As().Me.CreateAddress(line).then(function(addrList){
							addAddr=!addAddr;
							vm.list.push(addrList);
					})
					}else{
						alert("enter valid address to save..");
					}
			});
	}
	vm.makeDefault=function(address){
		_.filter(vm.list, function(row){
		// return _.indexOf([true],row.xp.IsDefault) > -1;
			if(row.xp.IsDefault){
				var	data =false;
				row.xp.IsDefault = !row.xp.IsDefault; 
					vm.default(row,data);
				}
		});
		var	dataNew = true;
		address.xp.IsDefault = true;
		vm.default(address, dataNew);
	}
	vm.default= function(row, obj){
		//var row=obj;
		//var data=dataVal;
		// var oldDefault = {
			// "FirstName":row.FirstName, "LastName":row.LastName, "Street1":row.Street1, "Street2":row.Street2,"City":row.City, "State":row.State, "Zip":row.Zip, "Phone":row.Phone, "Country": row.Country, "xp":data
		// };
		OrderCloud.As().Me.PatchAddress(row.ID, {"xp":{"IsDefault" :obj}}).then(function(res){
		//console.log("addressaddressaddress111111111", res);
			//$state.go('addressBook', {}, {reload:true});
			//vm.list.unshift(res);
			//vm.defaultAddr = [];
			if(row.xp.IsDefault){
				vm.defaultAddr[0]=row;
			}
			
		})
	}
	vm.editAddress = function(editAddr, index){
		vm.defaultEdit=true;
		if(index != null){
			vm.defaultEdit=false;
		}
		vm['showedit' + vm.prevIndex] = false;
		vm.prevIndex=angular.copy(index);
		vm['showedit' + index] = true;
		vm.editAddr=angular.copy(editAddr);
		$scope.showedit=false;
		vm.stateData=vm.editAddr.State;
		vm.contact={};
		var phn = vm.editAddr.Phone;
		BuildOrderService.GetPhoneNumber(vm.editAddr.Phone).then(function(res){
			vm.contact.Phone1 = res[0];
			vm.contact.Phone2 = res[1];
			vm.contact.Phone3 = res[2];
		});
	}
	vm.closeShowedit=function(index){
		vm['showedit'+index]=false;
	}
	vm.saveAddress = function(saveAddr, contact){
		saveAddr.Phone = "("+contact.Phone1+") "+contact.Phone2+"-"+contact.Phone3;
		console.log("saveAddr.Phone", saveAddr.Phone);
			AddressValidationService.Validate(saveAddr).then(function(res){
				var validatedAddress = res.Address;
				var zip = validatedAddress.PostalCode.substring(0, 5);
				saveAddr.Zip = parseInt(zip);
				saveAddr.Street1 = validatedAddress.Line1;
				saveAddr.Street2 = null;
				saveAddr.City = validatedAddress.City;
				saveAddr.State = validatedAddress.Region;
				saveAddr.Country = validatedAddress.Country;
				if(res.ResultCode == "Success"){
					/*OrderCloud.Addresses.Update(saveAddr.ID, saveAddr).then(function(){
						$state.go('addressBook', {}, {reload:true});
					})
					*/
					OrderCloud.As().Me.UpdateAddress(saveAddr.ID, saveAddr).then(function(addrList){
						$state.go('addressBook', {}, {reload:true});
					})
				}
				else{
					alert("address not found");
				}
		})
	}
	vm.deleteAddr =function(addrID){
		OrderCloud.As().Me.DeleteAddress(addrID, true).then(function(){
			$state.go('addressBook', {}, {reload:true});
		});
	}
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
