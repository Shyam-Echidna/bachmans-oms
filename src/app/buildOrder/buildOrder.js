angular.module( 'orderCloud' )
	.config( buildOrderConfig )
	.factory( 'BuildOrderService', BuildOrderService)
	.controller( 'buildOrderCtrl', buildOrderController )
	.controller( 'BuildOrderTopCtrl', buildOrderTopController )
	.controller( 'BuildOrderLeftCtrl', buildOrderLeftController )
	.controller( 'BuildOrderRightCtrl', buildOrderRightController )
	.controller( 'BuildOrderDownCtrl', buildOrderDownController )
	.controller( 'BuildOrderPDPCtrl', buildOrderPDPController )
	.controller( 'BuildOrderPLPCtrl', buildOrderPLPController )
	.controller( 'BuildOrderSummaryCtrl', buildOrderSummaryController )
	.directive('modal', function () {
		return {
			template: '<div class="modal fade">' + 
			'<div class="modal-dialog">' + 
			'<div class="modal-content">' + 
			'<div class="modal-header">' + 
			'<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' + 
			'<h4 class="modal-title">{{ title }}</h4>' + 
			'</div>' + 
			'<div class="modal-body" ng-transclude></div>' + 
			'</div>' + 
			'</div>' + 
			'</div>',
			restrict: 'E',
			transclude: true,
			replace:true,
			scope:true,
			link: function postLink(scope, element, attrs) {
				scope.title = attrs.title;
				scope.$watch(attrs.visible, function(value){
					if(value == true)
						$(element).modal('show');
					else
						$(element).modal('hide');
				});
				$(element).on('shown.bs.modal', function(){
					scope.$apply(function(){
						scope.$parent[attrs.visible] = true;
					});
				});
				$(element).on('hidden.bs.modal', function(){
					scope.$apply(function(){
						scope.$parent[attrs.visible] = false;
						if(scope.$parent.buildOrder){
							scope.$parent.buildOrder.guestUserModal = false;
							scope.$parent.buildOrderRight.OrderConfirmPopUp = false;
						}
						//scope.$parent.checkout.getShippingAddressModal = false;
						//scope.$parent.checkout.getBillingAddressModal = false;
					});
				});
			}
		};
	}).directive("maxLength", function() {
		return {
			restrict: "A",
			link: function(scope, elem, attrs) {
				var limit = parseInt(attrs.maxLength);
				angular.element(elem).on("keypress", function(e) {
					if (this.value.length == limit){
						e.preventDefault();
						$(this).next().focus();
					}	
					if (this.value.length == (limit-1)){
						$(this).next().focus();
					}
				});
			}
		}
	});
var impersonation = {
	"ClientID": "8836BE8D-710A-4D2D-98BF-EDBE7227E3BB",
	"Claims": ["FullAccess"]
};
function buildOrderConfig( $stateProvider ) {
	$stateProvider
	.state( 'buildOrder', {
		parent: 'base',
		url: '/buildOrder/:SearchType/:ID/:prodID/:orderID/:orderDetails',
		templateUrl:'buildOrder/templates/buildOrder.tpl.html',
		data: {
            loadingMessage: 'LOADING'
        },
		params: {
			showOrdersummary: false,
			prodID:{
				value: "",
				squash: true
			}
		},
		views: {
			'': {
				templateUrl: 'buildOrder/templates/buildOrder.tpl.html',
				controller:'buildOrderCtrl',
				controllerAs: 'buildOrder'
			},
			'buildorderpdp@buildOrder': {
				templateUrl: 'buildOrder/templates/buildOrder.pdp.tpl.html',
				controller: 'BuildOrderPDPCtrl',
				controllerAs: 'buildOrderPDP'
			},
			'buildorderplp@buildOrder': {
				templateUrl: 'buildOrder/templates/buildOrder.plp.tpl.html',
				controller: 'BuildOrderPLPCtrl',
				controllerAs: 'buildOrderPLP'
			},
			'buildordertop@buildOrder': {
				templateUrl: 'buildOrder/templates/buildOrder.top.tpl.html',
				controller: 'BuildOrderTopCtrl',
				controllerAs: 'buildOrderTop'
			},
			'buildorderdown@buildOrder': {
				templateUrl: 'buildOrder/templates/buildOrder.down.tpl.html',
				controller: 'BuildOrderDownCtrl',
				controllerAs: 'buildOrderDown'
			},
			'buildorderleft@buildOrder': {
				templateUrl: 'buildOrder/templates/buildOrder.left.tpl.html',
				controller: 'BuildOrderLeftCtrl',
				controllerAs: 'buildOrderLeft'
			},
			'buildorderright@buildOrder': {
				templateUrl: 'buildOrder/templates/buildOrder.right.tpl.html',
				controller: 'BuildOrderRightCtrl',
				controllerAs: 'buildOrderRight'
			},
			'buildordersummary@buildOrder': {
				templateUrl: 'buildOrder/templates/buildOrder.orderSummary.tpl.html',
				controller: 'BuildOrderSummaryCtrl',
				controllerAs: 'buildordersummary'
			},
			'buildorderorderhistorydetails@buildOrder': {
				templateUrl: 'buildOrder/templates/buildOrder.orderHistoryDetails.tpl.html',
				controller: 'BuildOrderSummaryCtrl',
				controllerAs: 'buildordersummary'
			}
		},
		resolve: {
			Order: function($rootScope, $q, $state, toastr, $stateParams, CurrentOrder, OrderCloud) {
				if($stateParams.SearchType != 'Products' && $stateParams.SearchType != 'BuildOrder' && $stateParams.SearchType != 'plp' && $stateParams.SearchType!='Workshop'){
					var d = $q.defer();
					OrderCloud.Users.GetAccessToken($stateParams.ID, impersonation)
						.then(function(data) {
							OrderCloud.Auth.SetImpersonationToken(data['access_token']);
							OrderCloud.As().Me.ListOutgoingOrders(null, 1, 100, null, null, {"Status":"Unsubmitted"}).then(function(res){
								if(res.Items.length != 0){
									CurrentOrder.Set(res.Items[0].ID);
									d.resolve(res.Items[0]);
								}else{
									d.resolve();
								}
							});
						});
						return d.promise;
					}
			},
			SearchData: function($q, $stateParams, $state, OrderCloud, Order) {
				var arr = {}, d = $q.defer();
				if($stateParams.SearchType == "User"){
					OrderCloud.Users.Get($stateParams.ID).then(function(data){
						arr["user"] = data.Username;
						arr["ID"] =data.ID;
						arr["Notes"] = data.xp.Notes;
						OrderCloud.As().Me.ListAddresses().then(function(res){
							angular.forEach(res.Items, function(val, key) {
								if(val.xp != null){
									if(val.xp.IsDefault)
										arr["address"] = val;
								}
							}, true);
							d.resolve(arr);
						});
					});  
				}else{
					arr["productID"]=$stateParams.ID;
					d.resolve(arr);
				}
				return d.promise;
			},
			spendingAccounts:function($q, $state, $stateParams, OrderCloud){
				var arr = [], spendingAcc = {}, filterPurple;
				if($stateParams.SearchType != 'Products' && $stateParams.SearchType != 'BuildOrder' && $stateParams.SearchType != 'plp' && $stateParams.SearchType != 'Workshop'){
					var dfd = $q.defer();
					OrderCloud.SpendingAccounts.ListAssignments(null, $stateParams.ID).then(function(assign){
						angular.forEach(assign.Items, function(value, key) {
							OrderCloud.SpendingAccounts.Get(value.SpendingAccountID).then(function(spendingacc){
								arr.push(spendingacc);
								filterPurple = _.filter(arr, function(row){
									return _.indexOf(["Purple Perks"],row.Name) > -1;
								});
								if((filterPurple.length) > 0){
									dfd.resolve(filterPurple);
								}
							});
						}, true);
						if((assign.Items.length)==0){		
							dfd.resolve();		
						}
					});
					return dfd.promise;
				}
			},
			ProductImages: function (BuildOrderService, $q) {
				var ticket = localStorage.getItem("alf_ticket"), dfr = $q.defer();
				BuildOrderService.GetProductImages(ticket).then(function(imgList){
					dfr.resolve(imgList.items);
				});
				return dfr.promise;
			},

			productList: function (OrderCloud, $stateParams, BuildOrderService, $q, ProductImages, algolia) {
				if($stateParams.SearchType == 'plp' || $stateParams.SearchType == 'Products'|| $stateParams.SearchType == 'BuildOrder' || $stateParams.SearchType =='Workshop'){
					var dfr = $q.defer();
					OrderCloud.Users.GetAccessToken('gby8nYybikCZhjMcwVPAiQ', impersonation).then(function(data) {
						OrderCloud.Auth.SetImpersonationToken(data['access_token']);
						if($stateParams.SearchType == 'plp'){
							// return OrderCloud.As().Me.ListProducts(null, 1, 100, null, null, null, $stateParams.ID).then(function(res){
								// var ticket = localStorage.getItem("alf_ticket"), prodList = BuildOrderService.GetProductList(res.Items, ProductImages);
									// dfr.resolve(prodList);
							// });
							var client = algolia.Client('31LAEMRXWG', '600b3cc15477fd21c5931d1bfbb36b3d');
								var index = client.initIndex('products');
								var search = {
									'query' : '',
									'hits' : []
								};
								search.query=$stateParams.ID;
								index.search(search.query).then(function searchSuccess(content) {
									if(content.hits.length>0){
										BuildOrderService.GetProductList(content.hits, ProductImages).then(function(catProducts){
											dfr.resolve(catProducts);
										});
									}
							})
						}
						else if($stateParams.SearchType =='Workshop'){
							OrderCloud.As().Me.GetProduct($stateParams.ID).then(function(prod){
								OrderCloud.As().Me.ListProducts(null, null, null, null, null, {"xp.ProductCode":prod.xp.ProductCode}).then(function(res){
									var ticket = localStorage.getItem("alf_ticket");
									BuildOrderService.GetProductList(res.Items, ProductImages).then(function(prodList){
										dfr.resolve(prodList);
									});
								});
							});
						}else{
							dfr.resolve();
						}
					});
					return dfr.promise;
				}
			 },
			CstDateTime: function ($q, BuildOrderService){
				var dfr = $q.defer();
				BuildOrderService.CompareDate().then(function(dt){
					dfr.resolve(new Date(dt.datetime));
				});
				return dfr.promise;
			}
		}
	});
}

function buildOrderController($scope, $rootScope, $state, $controller, $stateParams, ProductList, LineItemHelpers, $q, BuildOrderService, $timeout, OrderCloud, SearchData, algolia, CurrentOrder, alfrescoURL, Underscore, ProductImages, productList, AlfrescoFact) {
	var vm = this;
	vm.upselloverlay=false;
	vm.selected = undefined;
	vm.hidePdpblock=false;
	if($stateParams.SearchType == 'Workshop'){
			vm.hidePdpblock=true;
	}
	$scope.search = {
        'query' : '',
        'hits' : []
    };
    //vm.ID1= $stateParams.ID;
	vm.productSearchData = [];
	vm.showPDP = false;
	$scope.hideSearchBox=false;
	$scope.showOrdersummary = $stateParams.showOrdersummary;
	$scope.hideActiveSummary = true;
	$scope.showplp = true;
	$scope.gotoCheckout=function(){
		if($scope.showOrdersummary == true){
			if($stateParams.SearchType == 'Products' || $stateParams.SearchType == 'BuildOrder'){
				vm.guestUserModal =! vm.guestUserModal;
			}else{
				$state.go('checkout', {ID:$stateParams.ID}, {reload:true});	
			}
		}
	};
	$scope.selectVarients = function(txt,index){
		//vm.productDetails.varientsOption = vm.productDetails.sizeval+"_"+vm.productDetails.colorval;
		/*var filt = _.filter(vm.fullProductsData, function(row){
			if(_.indexOf([vm.productDetails.sizeval], row.xp.Specs_Options.Cont_Size) > -1 && _.indexOf([vm.productDetails.colorval], row.xp.Specs_Options.Color) > -1){
				return row;
			}
		});
		//vm.productDetails.individualProd = filt;
		vm.productDetails.ID = filt[0].ID;
		vm.productDetails.Name = filt[0].Name;
		vm.productDetails.Description = filt[0].Description;
		if(vm.productDetails.editProducts){
			angular.forEach(vm.productDetails.editProducts, function(row, index){
				row.ProductID = filt[0].ID;
			},true);
		}
		OrderCloud.Products.ListAssignments(filt[0].ID).then(function(res){
			OrderCloud.PriceSchedules.Get(res.Items[0].StandardPriceScheduleID).then(function(res2){
				vm.productDetails.prodPrice = res2.PriceBreaks[0].Price;
			});
		});
	
		if(txt != "upsell"){
			vm.productDetails.varientsOption = vm.productDetails.sizeval+"_"+vm.productDetails.colorval;
			var filt = _.findWhere(vm.productDetails.listOptions, {ID: vm.productDetails.varientsOption});
			vm.productDetails.prodPrice = filt.PriceMarkup;
		}else{
			vm.UpsellProdDtls.varientsOption = vm.UpsellProdDtls.UpsellCarousel[index].data.sizeval+"_"+vm.UpsellProdDtls.UpsellCarousel[index].data.colorval;
			var filt = _.findWhere(vm.UpsellProdDtls.UpsellCarousel[index].data.listOptions, {ID: vm.UpsellProdDtls.varientsOption});
			vm.UpsellProdDtls.UpsellCarousel[index].data.prodPrice = filt.PriceMarkup;
		}*/
	};
	function displayProduct(filt){
		//vm.productDetails.individualProd = filt;
		vm.productDetails.ID = filt[0].ID;
		vm.productDetails.Name = filt[0].Name;
		vm.productDetails.Description = filt[0].Description;
		vm.productDetails.imgUrl=filt[0].imgUrl;
		vm.productDetails.prodPrice=filt[0].StandardPriceSchedule.PriceBreaks[0].Price;
	}
	$scope.OrderSummary=function(){
		angular.element(document.getElementById("oms-plp-right")).scope().buildOrderRight.OrderConfirmPopUp = false;
		$scope.ordersumry();
		$scope.hideSearchBox=true;
		$scope.showOrdersummary = true;
		vm.showPDP = false;
		$scope.showplp = false;
	};
	if($stateParams.orderDetails){
		$scope.hideSearchBox=true;
		$scope.orderDetails=true;
	}
	$scope.BacktoOrder = function(){
		angular.element(document.getElementById("oms-plp-right")).scope().buildOrderRight.getLineItems();
		$scope.showOrdersummary = false;
		$scope.hideSearchBox=false;
	}
	$scope.backTocreate=function(){
		$scope.hideSearchBox=false;
		$scope.orderDetails=false;
	}
	$scope.ordersumry = function () {
		console.log($scope);
		angular.element(document.getElementById("order-summary")).scope().$parent.buildordersummary.orderSummaryShow();
	};
	console.log('stateparams', $stateParams);
	vm.productdata = function(prodID, varientOptions, line){
		$scope.pdpID = BuildOrderService.GetProductID(prodID);
		console.log($scope.pdpID);
		vm.showPDP = true;
		/*BuildOrderService.GetProductDetails(prodID).then(function(result){
			vm.productDetails = result;
			if(varientOptions){
				$timeout(function(){
					vm.productDetails.sizeval = varientOptions.Size;
					vm.productDetails.colorval = varientOptions.Color;
				},300);	
				var filt = _.findWhere(vm.productDetails.listOptions, {ID: varientOptions.Size+"_"+varientOptions.Color});
				vm.productDetails.prodPrice = filt.PriceMarkup;
				vm.productDetails.editProducts = line;
			}
			delete $scope.Categories;
			delete $scope.CategoryItemsSimilar;
		});*/
		vm.productDetails = {};
		if(varientOptions){
			/*$timeout(function(){
				vm.productDetails.sizeval = varientOptions.Size;
				vm.productDetails.colorval = varientOptions.Color;
			},300);*/
			vm.productDetails.editProducts = line;
			prodID = line[0].Product.ID;
		}
		OrderCloud.Products.Get(prodID).then(function(res1){
			vm.productDetails.ID = res1.ID;
			vm.productDetails.Name = res1.Name;
			vm.productDetails.Description = res1.Description;
			OrderCloud.Products.List(null, null, null, null, null, {"xp.SequenceNumber":res1.xp.SequenceNumber}).then(function(res2){
				vm.fullProductsData = res2.Items;
				var size = [],color = [];
				angular.forEach(res2.Items, function(val, key){
					if(val.xp){
						if(val.xp.Specs_Options){
							size.push(val.xp.Specs_Options.Cont_Size);
							color.push(val.xp.Specs_Options.Color);
						}	
					}	
				},true);
				vm.productDetails.options = {"Color":_.uniq(color), "Size":_.uniq(size)};
				$timeout(function(){
					if(vm.productDetails.editProducts && vm.productDetails.editProducts[0].Product.xp.Specs_Options){
						vm.productDetails.sizeval = vm.productDetails.editProducts[0].Product.xp.Specs_Options.Cont_Size;
						vm.productDetails.colorval = vm.productDetails.editProducts[0].Product.xp.Specs_Options.Color;
					}
					$scope.selectVarients();
				},1000);
			});
		});
		vm.DeliveryType = false;
		//vm.isCourier = false;
		vm.Courier = false;
		vm.DirectShip = false;
		//vm.isFaster = false;
		vm.Faster = false;
		vm.GiftCard = false;
		if($stateParams.SearchType != 'Products' && $stateParams.SearchType != 'BuildOrder' && $stateParams.SearchType != 'plp' && $stateParams.SearchType!='Workshop'){
			OrderCloud.Categories.ListProductAssignments(null, prodID).then(function(res){
				OrderCloud.Categories.Get(res.Items[0].CategoryID).then(function(res2){
					if(res2.xp.DeliveryChargesCatWise.DeliveryMethods.DirectShip){
						vm.DirectShip = true;
					}
					if(res2.xp.DeliveryChargesCatWise.DeliveryMethods.Mixed){
						vm.Faster = true;
					}
					if(res2.Name == "Gift Cards"){
						vm.GiftCard = true;
					}
					if(res2.xp.DeliveryChargesCatWise.DeliveryMethods.Courier == true){
						vm.Courier = true;
					}
				});	
			});
		}
	};
	if($stateParams.SearchType == 'Products' || $stateParams.SearchType == 'BuildOrder'){
		vm.disable=true;
		if($stateParams.ID==""){
			console.log("********************", $scope.$parent.base.list);
			vm.searchList=$scope.$parent.base.list;
			vm.searchTxt=$scope.$parent.base.searchval;
		}
		else{
			vm.productdata($stateParams.ID);
		}
	}
	if($stateParams.SearchType == 'plp'){
		vm.disable=true;
	}
	/*if($stateParams.prodID!=""){
		vm.productdata($stateParams.prodID);
	}*/
	/*----Upsell Data----*/
	vm.upsell = true;
	vm.similar = true;
	vm.upsellToggle = function(upsell) {
		var tempArr = [];
		vm.upselloverlay=true;
		vm.upsell = vm.upsell === false ? true: false;
		vm.similar = true;
		if(!vm.Categories){
			OrderCloud.Products.Get("cat2_cat12_prod2").then(function(data) {
				var cats = [];
				vm.Categories = [];
				vm.UpsellDtls = data;
				_.filter(vm.UpsellDtls.xp.Upsell, function (row) {
					_.each(row, function( val, key ) {
						cats.push(key);
					});
				});
				angular.forEach(cats, function(line, index){
					//tempArr.push(OrderCloud.Categories.Get(line));
					tempArr.push(OrderCloud.Categories.Get("c1_c9_c1"));
				},true);
				$q.all(tempArr).then(function(res){
					angular.forEach(res, function(r){
						vm.Categories.push({"ID":r.ID, "Name":r.Name});
					},true);
					vm.getCategoriesItems(vm.Categories[0].ID, 0);
				});
			});
		}
	};
	vm.getCategoriesItems = function(catID) {
		catID = "c1_c1";// dummy
		vm.CategoryItemsUpsell = [];
		var upsel, tempArr = [];
		var catData = _.find(vm.UpsellDtls.xp.Upsell, function (row) {
			if(row[catID]){
				upsel = row[catID];
				return true;
			}
		});
		angular.forEach(upsel, function(row){
			tempArr.push(OrderCloud.Products.Get(row));
		}, true);	
		$q.all(tempArr).then(function(res1){
			angular.forEach(res1, function(r){
				vm.CategoryItemsUpsell.push({"ID":r.ID,"Name":r.Name,"Price":25,"Description":r.Description});
			}, true);
			$('#owl-carousel-upsell').trigger('destroy.owl.carousel');
			$('#owl-carousel-upsell').find('.owl-stage-outer').children().unwrap();
			setTimeout(function(){
				$("#owl-carousel-upsell").owlCarousel({
					items:4,
					center:false,
					loop: false,
					nav:true,
					navText: ['<span class="events-arrow-prev" aria-hidden="true"></span>','<span class="events-arrow-next" aria-hidden="true"></span>'],
					onInitialized: function(data){
						console.log("====",data);
					}
				});
			},0);
		});
			
		/*angular.forEach(upsel, function(row, index){
			OrderCloud.Products.Get(row).then(function(res1) {
				//OrderCloud.Products.ListAssignments(res1.ID).then(function(res2) {
					//OrderCloud.PriceSchedules.Get(res2.Items[0].StandardPriceScheduleID).then(function(data) {
						vm.CategoryItemsUpsell.push({"ID":res1.ID,"Name":res1.Name,"Price":25,"Description":res1.Description});
						//if((index+1) == 2){
							$('#owl-carousel-upsell').trigger('destroy.owl.carousel');
							$('#owl-carousel-upsell').find('.owl-stage-outer').children().unwrap();
							setTimeout(function(){
								$("#owl-carousel-upsell").owlCarousel({
									items:4,
									center:false,
									loop: false,
									nav:true,
									navText: ['<span class="events-arrow-prev" aria-hidden="true"></span>','<span class="events-arrow-next" aria-hidden="true"></span>'],
									onInitialized: function(data){
										console.log("====",data);
									}
								});
							},600);
						//}	
					//});
				//});	
			});
		},true);*/
	};
	
	vm.similarToggle = function(similar) {
		vm.similar = vm.similar === false ? true: false;
		vm.upsell = true;
		var tempArr = [];
		if(!vm.CategoryItemsSimilar){
			vm.CategoryItemsSimilar = [];
			OrderCloud.Products.Get("cat2_cat12_prod2").then(function(data) {
				angular.forEach(data.xp.Cross, function(row, index){
					tempArr.push(OrderCloud.Products.Get(row));
				},true);
				$q.all(tempArr).then(function(res){
					angular.forEach(res, function(r){
						vm.CategoryItemsSimilar.push({"ID":r.ID,"Name":r.Name,"Price":30,"Description":r.Description});
					},true);
					$('#owl-carousel-upsell').trigger('destroy.owl.carousel').removeClass('owl-carousel');
					$('#owl-carousel-upsell').find('.owl-stage-outer').children().unwrap();
					setTimeout(function(){
						$("#owl-carousel-similar").owlCarousel({
							items:4,
							center:false,
							loop: false,
							nav:true,
							navText: ['<span class="events-arrow-prev" aria-hidden="true"></span>','<span class="events-arrow-next" aria-hidden="true"></span>']
						});
					},0);
				});
			});
		}	
	};
	
	vm.UpsellSimilar = false;
	vm.UpsellProductItem = function(prodID, arr){
		vm.UpsellProdDtls = {};
		vm.UpsellProdDtls.UpsellCarousel = [];
		vm.UpsellSimilar = true;
		angular.forEach(arr, function(row,index){
			BuildOrderService.GetProductDetails("30_30A_30BARB_575").then(function(result){
				var result = {"data":result};
				vm.UpsellProdDtls.UpsellCarousel.push(result);
				if((index+1) == 2){
					$('#pdpCarouselView').trigger('destroy.owl.carousel');
					$('#pdpCarouselView').find('.owl-stage-outer').children().unwrap();
					setTimeout(function(){
						$("#pdpCarouselView").owlCarousel({
							items:1,
							center: false,
							loop: false,
							nav: true,
							navText: ['<span class="events-arrow-prev" aria-hidden="true"></span>','<span class="events-arrow-next" aria-hidden="true"></span>']	
						});
						$('.owl-item').css('display','inline-block');
					},600);
				}
			});
		},true);
	}
	
	vm.gotopdp = function(){
		vm.UpsellSimilar = false;
	}
	/*----End of Upsell Data----*/
	$scope.gotoplp = function(){
		vm.showPDP = false;
		if($stateParams.SearchType == 'Products' && $stateParams.ID != '' && $stateParams.SearchType != 'BuildOrder'){
			vm.searchSeqList=vm.fullProductsData;
		}
		if($stateParams.SearchType == 'Workshop' && vm.hidePdpblock==true){
			vm.hidePdpblock=false;
		}
	}
	$scope.AddtoCart = function(prodID, baseImg, varientsOption){
		var DeliveryMethod;
		if(vm.DirectShip)
			DeliveryMethod = "DirectShip";
		if(vm.DeliveryType=="Faster Delivery")
			DeliveryMethod = "Mixed";
		if(vm.GiftCard)
			DeliveryMethod = "USPS";
		if(vm.DeliveryType=="Courier")
			DeliveryMethod = "Courier";
		angular.element(document.getElementById("oms-plp-right")).scope().beforeAddToCart(prodID, DeliveryMethod, baseImg);
	};
	$scope.show = false;
	$scope.showmenu = false;
	$scope.toggleMenu = function(event) {
		$scope.showmenu = !($scope.showmenu);
		event.stopPropagation();
	};
	window.onclick = function() {
		if ($scope.showmenu) {
		$scope.showmenu = false;
		$scope.$apply();
		}
	}
	$scope.oneAtATime = true;
	$scope.oneAtATimeSub = true;
	/*vm.selectUser = function(user){	
		vm.showDetails=user;		
		$scope.showUser=true;
	}		
	vm.openUser=function(user){
		vm.guestUserModal = !vm.guestUserModal;
		console.log("..", SearchData.productID);
		$state.go($state.current, {ID:user,SearchType:'User',prodID:SearchData.productID}, {reload:true});
	}*/
	vm.createUser=function(newUser, createaddr){		
		$scope.showModal = !$scope.showModal;		
		var newUser={"Username":newUser.Username,"Password":newUser.Password,"FirstName":newUser.FirstName, "LastName":newUser.LastName, "Email":newUser.Email, "Phone":newUser.Phone, "Active":true, "Phone":"("+newUser.Phone1+") "+newUser.Phone2+"-"+newUser.Phone3, "SecurityProfileID": '65c976de-c40a-4ff3-9472-b7b0550c47c3', "xp":{"Notes":[]}};		
		OrderCloud.Users.Create(newUser).then(function(user){		
			var params = {"CompanyName":createaddr.CompanyName,"FirstName":newUser.FirstName,"LastName":newUser.LastName,"Street1":createaddr.Street1,"Street2":createaddr.Street2,"City":createaddr.City,"State":createaddr.State,"Zip":createaddr.Zip,"Country":createaddr.Country,"Phone":newUser.Phone, "xp":{"IsDefault" :createaddr.IsDefault}};		
		OrderCloud.Addresses.Create(params).then(function(data){		
			data.Zip = parseInt(data.Zip);		
			console.log("address created",data);		
			var assign = {"AddressID": data.ID,"UserID": user.ID,"IsBilling": createaddr.IsBilling,"IsShipping": createaddr.IsShipping};		
		OrderCloud.Addresses.SaveAssignment(assign).then(function(res){		
			$state.go($state.current, {ID:user.ID,SearchType:'User',prodID:SearchData.productID}, {reload:true});		
			console.log("Address saved for the user....!" +res);		
		});		
		})		
		});		
	}
	vm.searchType=$stateParams.SearchType;
	console.log("productList", productList);
    if($stateParams.SearchType=='plp'){
        vm.catList=productList;
        console.log("vm.catList", vm.catList);
    }
    // Function to get colors for selected size
    vm.selectVarients = function (selectedSize, $index) {
        DisplaySelectedColor(selectedSize, $index);
    };
    // function to retrieve images for selected size and color
    vm.selectColor = function ($index, color) {
        DisplaySelectedSize(color, $index);
    }
    function DisplayColors(prodcuts, IsObjectRequired) {
        console.log("All Product", prodcuts);
        var unique = {};
        var distinct = [];
        var distinctObj = [];
        for (var i in prodcuts) {
            if (typeof (prodcuts[i].xp) !== 'undefined') {
                if (typeof (unique[prodcuts[i].xp.SpecsOptions.Color]) == "undefined") {
                    distinct.push(prodcuts[i].xp.SpecsOptions.Color);
                    distinctObj.push(prodcuts[i]);
                }
                unique[prodcuts[i].xp.SpecsOptions.Color] = 0;
            }
        }
        if (IsObjectRequired)
            return distinctObj;
        else
            return distinct;
 
    }
 
    // FUnction to display all available sizes
    function DisplaySizes(prodcuts, IsObjectRequired) {
        console.log("All Product", prodcuts);
        var unique = {};
        var distinct = [];
        var distinctObj = [];
        for (var i in prodcuts) {
            if (typeof (prodcuts[i].xp) !== 'undefined') {
                if (typeof (unique[prodcuts[i].xp.SpecsOptions.Size]) == "undefined") {
                    distinct.push(prodcuts[i].xp.SpecsOptions.Size);
                    distinctObj.push(prodcuts[i]);
                }
                unique[prodcuts[i].xp.SpecsOptions.Size] = 0;
            }
        }
        if (IsObjectRequired)
            return distinctObj;
        else
            return distinct;
    }
    var availableColors, availableSizes = [];
    var activeProduct = null;
    $scope.radio = { selectedSize: -1, selectedColor: -1 };
    vm.isopen = false;
    vm.SelectExtra = function(selectedExtra, $event){
      $('.dropdown.open button p').text(selectedExtra);
    }
	GetAttributeImages();
	function GetAttributeImages() {
		var tkt = localStorage.getItem("alf_ticket");
		BuildOrderService.GetAttributeImages(tkt).then(function(imgList){
			vm.attributeImgs=imgList;
			console.log("vm.attributeImgs", vm.attributeImgs);
		});
	}
	vm.prouctsList=function(e){
		if($stateParams.SearchType == 'BuildOrder'){
			OrderCloud.Products.List(null, 1, 100, null, null, {"xp.ProductCode":e.ProductCode}).then(function(res){
				console.log(res);
				BuildOrderService.GetProductList(res.Items, ProductImages).then(function(prodList){
					vm.seqProducts=prodList;
					var selectedProd=_.where(vm.seqProducts, {"ID":e.ID});
					vm.showProduct(selectedProd[0]);
				 });
			});
		}
		else{
			OrderCloud.As().Me.ListProducts(null, 1, 100, null, null, {"xp.ProductCode":e.ProductCode}).then(function(res){
				BuildOrderService.GetProductList(res.Items, ProductImages).then(function(prodList){
					vm.seqProducts=prodList;
					var podID=e.ID;
					podID=podID.toString();
					var selectedProd=_.where(vm.seqProducts, {"ID":podID});
					vm.showProduct(selectedProd[0]);
				 });
			});
		}
	}
	vm.productsseqList=function(e){
		OrderCloud.As().Me.ListProducts(null, 1, 100, null, null, {"xp.ProductCode":e.xp.ProductCode}).then(function(res){
			BuildOrderService.GetProductList(res.Items, ProductImages).then(function(prodList){
				vm.seqProducts=prodList;
				vm.showProduct(e);
			 });
		 });
	}
    // Function to get selected product
    // Function to get selected product
    vm.showProduct=function(e){
		var alfticket = localStorage.getItem("alf_ticket");
		vm.selectedKey=[];
        if($stateParams.SearchType == 'plp'){
 			vm.fullProductsData=vm.seqProducts;
			_.filter(vm.fullProductsData, function(obj) {
                if(_.indexOf([obj.xp.IsBaseProduct]== true) && obj.xp.IsBaseProduct){
					vm.articles=obj.xp.Articles;
					vm.selectedSpecification=obj.xp.Attributes;
					vm.selectedWarranty=obj.xp.Warranty;
					angular.forEach(obj.xp.KeyAttributes, function(value, key) {
					var attImg=Underscore.where(vm.attributeImgs.items, {title: key});
					vm.selectedKey.push({
						url:alfrescoURL + attImg[0].contentUrl + "?alf_ticket=" + alfticket,
						attribute:value
						})
					});
				}
			});
        }
        else if($stateParams.SearchType == 'Products' || $stateParams.SearchType == 'BuildOrder'){
			vm.fullProductsData=vm.seqProducts;
			vm.selectedKey=[];
			_.filter(vm.fullProductsData, function(obj) {
                if(_.indexOf([obj.xp.IsBaseProduct]== true) && obj.xp.IsBaseProduct){
						vm.articles=obj.xp.Articles;
						vm.selectedSpecification=obj.xp.Attributes;
						vm.selectedWarranty=obj.xp.Warranty;
						angular.forEach(obj.xp.KeyAttributes, function(value, key) {
						var attImg=Underscore.where(vm.attributeImgs.items, {title: key});
						vm.selectedKey.push({
							url:alfrescoURL+ attImg[0].contentUrl + "?alf_ticket=" + alfticket,
							attribute:value
							})
						});
					}
				});
        }
		else if(vm.hidePdpblock==true){
			//$scope.fullEventsProductsData=productList;
			vm.fullEventsData=_.groupBy(productList, function(value){
				return value.xp.EventDate;
			});
			vm.eventsLimit = Object.keys(vm.fullEventsData);
			vm.limit=1;
			console.log("groupName", vm.fullEventsData);
		}
		else{
			vm.fullProductsData=vm.seqProducts;
			_.filter(vm.fullProductsData, function(obj) {
                if(_.indexOf([obj.xp.IsBaseProduct]== true) && obj.xp.IsBaseProduct){
					vm.articles=obj.xp.Articles;
					vm.selectedSpecification=obj.xp.Attributes;
					vm.selectedWarranty=obj.xp.Warranty;
					angular.forEach(obj.xp.KeyAttributes, function(value, key) {
					var attImg=Underscore.where(vm.attributeImgs.items, {title: key});
					vm.selectedKey.push({
						url:alfrescoURL + attImg[0].contentUrl + "?alf_ticket=" + alfticket,
						attribute:value
						})
					});
				}
			});
		}
		if(vm.hidePdpblock==false){
		vm.DeliveryType = false;
		//vm.isCourier = false;
		vm.Courier = false;
		vm.DirectShip = false;
		//vm.isFaster = false;
		vm.Faster = false;
		vm.GiftCard = false;
		OrderCloud.Categories.ListProductAssignments(null, e.ID).then(function(res){
			OrderCloud.Categories.Get(res.Items[0].CategoryID).then(function(res2){
				if(res2.xp.DeliveryChargesCatWise.DeliveryMethods.DirectShip){
					vm.DirectShip = true;
				}
				if(res2.xp.DeliveryChargesCatWise.DeliveryMethods.Mixed){
					vm.Faster = true;
				}
				if(res2.Name == "Gift Cards"){
					vm.GiftCard = true;
				}
				if(res2.xp.DeliveryChargesCatWise.DeliveryMethods.Courier == true){
					vm.Courier = true;
				}
			});	
		});
		vm.productExtras=extraProducts();
			$scope.radio.selectedColor = e.xp.SpecsOptions.Color;
			availableColors = DisplayColors(vm.fullProductsData, true);
			vm.allColors = availableColors;
			var selectedColorHold = angular.copy(availableColors);
			DisplaySelectedSize(e.xp.SpecsOptions.Color, _.findIndex(selectedColorHold, function (item) { 
				if(e.xp.SpecsOptions.Color === null || e.xp.SpecsOptions.Color === null){
					return item.xp.SpecsOptions.Color == e.xp.SpecsOptions.Color 
				}else{
					return item.xp.SpecsOptions.Color.toLowerCase() == e.xp.SpecsOptions.Color.toLowerCase() 
				}
           })
           );
		   $scope.radio.selectedSize = e.xp.SpecsOptions.Size;
			vm.productTitle = e.Name;
			vm.prodDesription = e.Description;
			availableSizes = DisplaySizes(vm.fullProductsData, true);
			vm.allSizes = availableSizes;
			var selectedSizeHold = angular.copy(availableSizes);
			DisplaySelectedColor(e.xp.SpecsOptions.Size, _.findIndex(selectedSizeHold, function (item) { 
				if(e.xp.SpecsOptions.Size === null || e.xp.SpecsOptions.Size === null){
				  return item.xp.SpecsOptions.Size == e.xp.SpecsOptions.Size 
				}else{
				 return item.xp.SpecsOptions.Size.toLowerCase() == e.xp.SpecsOptions.Size.toLowerCase() 
				}
			   })
			   );
			vm.showPDP = true;
		}
		else{
			vm.DisplayEvent(e);
			vm.showPDP = true;
		}

    }
    if($stateParams.SearchType == 'Products' || $stateParams.SearchType == 'BuildOrder'){
        vm.disable=true;
        vm.searchTxt=$scope.$parent.base.searchval;
        if($stateParams.ID==""){
            vm.searchList=$scope.$parent.base.searchList;
        }
        else{
            var selectedProd=_.where($scope.$parent.base.searchList, {"ID":$stateParams.ID});
			vm.prouctsList(selectedProd[0]);
        }
    }
    function DisplaySelectedColor(selectedSize, $index) {
        vm.selectedSizeIndex = $index;
        // vm.selectedProductIndex = -1;
        var prodFiltered = _.filter(vm.fullProductsData, function (_obj) {
            if(_obj.xp.SpecsOptions.Size === null || selectedSize === null){
                return (_obj.xp.SpecsOptions.Size == selectedSize)
            }else{
                return (_obj.xp.SpecsOptions.Size == selectedSize || _obj.xp.SpecsOptions.Size.toLowerCase() == selectedSize)
            }
        });
        var imAvailableColors = angular.copy(availableColors);
        prodFiltered = DisplayColors(prodFiltered, false);
        prodFiltered = _.filter(imAvailableColors, function (color) {
            if (_.contains(prodFiltered, color.xp.SpecsOptions.Color)) {
                color.isNotAvailable = false;
                return color;
            }
            else {
                color.isNotAvailable = true;
                return color;
            }
        });
        vm.allColors = prodFiltered;
        if ($scope.radio.selectedSize != -1 && $scope.radio.selectedColor != -1) {
            var selectedSku = _.filter(vm.fullProductsData, function (_obj) {
                return ((_obj.xp.SpecsOptions.Size == $scope.radio.selectedSize || _obj.xp.SpecsOptions.Size.toLowerCase() == $scope.radio.selectedSize) && (_obj.xp.SpecsOptions.Color == $scope.radio.selectedColor || _obj.xp.SpecsOptions.Color.toLowerCase() == $scope.radio.selectedColor))
            });
            if (selectedSku.length == 1) {
                activeProduct = selectedSku[0];
                // if (activeProduct) {
                    // GetDeliveryMethods(activeProduct.ID);
                // }
                DisplayProduct(selectedSku[0]);
            } else {
                console.log('PDP PRODUCT ERROR :: ', selectedSku);
            }
        }
		else if($stateParams.SearchType == 'Workshop' && vm.hidePdpblock==true && $scope.radio.selectedSize != -1){
            var selectedSku = _.filter(vm.fullProductsData, function (_obj) {
                return ((_obj.xp.SpecsOptions.Size == $scope.radio.selectedSize))
            });
				activeProduct = selectedSku[0];
				DisplayProduct(selectedSku[0]);
		}
    }
    function DisplayProduct(selectedSku) {
        vm.productTitle = selectedSku.Name;
        vm.prodDesription = selectedSku.Description;
        vm.selectedProductId = selectedSku.ID;
        vm.selectedProductImg=selectedSku.baseImage;
        vm.changeImg=angular.copy(selectedSku.baseImage);
        vm.selectedalternativeImg=selectedSku.alternativeImg;
    }
	vm.DisplayEvent=function(selectedSku) {
        vm.productTitle = selectedSku.Name;
        vm.prodDesription = selectedSku.Description;
        vm.selectedProductId = selectedSku.ID;
        vm.selectedProductImg=selectedSku.baseImage;
		vm.selectedPrice=selectedSku.StandardPriceSchedule.PriceBreaks;
    }
	vm.showAll=function(){
		var keys = Object.keys(vm.fullEventsData);
		vm.limit=keys.length;
	}
    vm.changeImage=function(img){
        vm.changeImg=img;
    }
    function DisplaySelectedSize(color, $index) {
        var colorFiltered = _.filter(vm.fullProductsData, function (_obj) { // filters SKU with  selected color
            if(_obj.xp.SpecsOptions.Color === null || color === null){
                return (_obj.xp.SpecsOptions.Color == color)
            }else{
                return (_obj.xp.SpecsOptions.Color.toLowerCase() == color.toLowerCase())
            }
        });
        colorFiltered = DisplaySizes(colorFiltered, false); // sizes availavle for seelcted color 
        var imAvailableSizes = angular.copy(availableSizes); //copy for all available sizes
        colorFiltered = _.filter(imAvailableSizes, function (size) { // Adds isNotAvailable attribute for Sizes based on selected dolor
            if (_.contains(colorFiltered, size.xp.SpecsOptions.Size)) {
                size.isNotAvailable = false;
                return size;
            }
            else {
                size.isNotAvailable = true;
                return size;
            }
        });
        vm.allSizes = colorFiltered; // bind the sizes to DOM
        vm.selectedProductIndex = $index; // Active state for selected color
        if ($scope.radio.selectedSize != -1 && $scope.radio.selectedColor != -1) { // change prodcut if size and color is selected
            var selectedSku = _.filter(vm.fullProductsData, function (_obj) {
                return ((_obj.xp.SpecsOptions.Size == $scope.radio.selectedSize || _obj.xp.SpecsOptions.Size.toLowerCase() == $scope.radio.selectedSize) && (_obj.xp.SpecsOptions.Color == $scope.radio.selectedColor || _obj.xp.SpecsOptions.Color.toLowerCase() == $scope.radio.selectedColor))
            });
            console.log("selectedSku", selectedSku);
            if (selectedSku.length == 1) {
                //console.log(selectedSku[0]);
                activeProduct = selectedSku[0];
                // if (activeProduct) {
                    // GetDeliveryMethods(activeProduct.ID);
                // }
                DisplayProduct(selectedSku[0]); // displays selected product info
            } else {
 
                console.log('PDP PRODUCT ERROR ::', selectedSku);
            }
        }
    }
    function extraProducts() {
        var ticket = localStorage.getItem("alf_ticket");
        console.log("ProductImages", ProductImages);
        var imageData = BuildOrderService.GetExtras();
        var res = Object.keys(imageData).map(function (key) { return imageData[key] });
        var imgcontentArray = [];
        for (var i = 0; i < res.length; i++) {
            for (var j = 0; j < res[i].length; j++) {
                angular.forEach(Underscore.where(ProductImages, { title: res[i][j].Skuid }), function (node) {
                    node.contentUrl = alfrescoURL + node.contentUrl + "?alf_ticket=" + ticket;
                    imgcontentArray.push(node);
                });
                res[i][j].imgContent = imgcontentArray;
                imgcontentArray = [];
            }
        }
        return res;
    }
	// vm.gotoSearchPlp=function(prodCode){
		// var ticket = localStorage.getItem("alf_ticket");
		// BuildOrderService.GetProductImages(ticket).then(function(imagesList){
			// OrderCloud.Users.GetAccessToken('gby8nYybikCZhjMcwVPAiQ', impersonation)
			// .then(function(data) {
				// OrderCloud.Auth.SetImpersonationToken(data['access_token']);
					// OrderCloud.As().Me.ListProducts(null, 1, 100, null, null, {"xp.SequenceNumber":prodCode}).then(function(res){
						// BuildOrderService.GetProductList(res.Items, imagesList.items).then(function(prodList){
						// vm.searchTxt=$scope.$parent.base.searchval;
						// vm.searchList=prodList;
						// vm.showPDP = false;
						// console.log("vm.searchList", vm.searchList);
					// });
				// })
			// })
		// })
		// console.log("prodCodeprodCode", prodCode);
	// }
	if($stateParams.SearchType =='Workshop'){
		vm.showPDP = true;
		var selectedProd=_.where(productList, {"ID":$stateParams.ID});
        vm.showProduct(selectedProd[0]);
	}
	vm.cleardata=function(){
		if(vm.searchSeqList)
		vm.searchSeqList='';
		else if(vm.searchList)
		vm.searchList='';
		else if(vm.catList)
		vm.catList='';
	}
}

function buildOrderTopController($scope, $stateParams,$rootScope, AlfrescoFact) {
	var vm = this;
	vm.logo=AlfrescoFact.logo;
	$scope.showmenu = false;
	$scope.toggleMenu = function(event) {
		$scope.showmenu = !($scope.showmenu);
		event.stopPropagation();
	};
	window.onclick = function() {
		if ($scope.showmenu) {
			$scope.showmenu = false;
			$scope.$apply();
		}
	}
	$scope.clickevent= function(){
		$rootScope.fff = "iuoistgosi";
	}
}

function buildOrderDownController($scope, $stateParams) {
	var vm = this;
	vm.ToolTip = {
		templateUrl: 'CancelOrderToolTip.html'
	};
	vm.closePopover = function () {
		vm.ShowCancelOrderToolTip = false;
	};
	vm.CancelToolTip = function(){
		vm.ShowCancelOrderToolTip = true;
	};
	vm.cancelOrder = function () {
		angular.element(document.getElementById("oms-plp-right")).scope().cancelOrder();
	};
	$scope.saveLaterPopup = function () {
		$scope.showModal = !$scope.showModal;
	};
	$scope.saveForLater = function (note) {
		angular.element(document.getElementById("oms-plp-right")).scope().saveForLater(note);
		$scope.showModal = !$scope.showModal;
	};
	vm.SaveAllLineItems = function(){
		angular.element(document.getElementById("oms-plp-right")).scope().buildOrderRight.SaveAllLineItems();
	};
	$scope.showModal = false;
}

function buildOrderLeftController($scope, $stateParams, spendingAccounts, SearchData, OrderCloud) {
	var vm = this;
	var arr ={};
	vm.list = SearchData;
	vm.spendingAccounts= spendingAccounts;
	$scope.notedata = vm.list.Notes;
	$scope.addNote= function(){
		$scope.notedata.push({ Date: new Date(), Description:$scope.note.descp});
		$scope.notel = {"Notes":$scope.notedata};
		OrderCloud.Users.Patch($stateParams.ID,{"xp":$scope.notel});
	}
	$scope.remove = function(index){
		$scope.notedata.splice(index, 1);
		$scope.note2 = {"Notes":$scope.notedata};
		OrderCloud.Users.Patch($stateParams.ID,{"xp":$scope.note2});
	};
	$scope.noteinput = function(){
		$scope.show = !($scope.show);
	};
	$scope.note = {
		date: new Date(),
		descp:""
	};
	$scope.show = false;
	$scope.status = {
		isFirstOpen: false
	};
	$scope.deleteNote = {
		templateUrl: 'deleteNote.html',
	};
	$scope.closePopover = function () {
		$scope.showDeliveryToolTip = false;
	};
	$scope.cancelPopUp = function () {
		this.$parent.showDeliveryToolTip = false;
	};
}

function buildOrderRightController($scope, $q, $stateParams, OrderCloud, Order, LineItemHelpers, TaxService, AddressValidationService, CurrentOrder, BuildOrderService, $cookieStore, CstDateTime) {
	var vm = this;
	vm.isOpen = {};
	vm.CancelDeleteToolTip = {};
	vm.order = Order;
	$scope.showDeliveryMethods = {
		templateUrl: 'AddRecipientDelMethods.html'
	};
	$scope.closePopover = function (index) {
		vm.DeliveryType = undefined;
		_.find(vm, function(v, k) {
			if (k.indexOf('showDeliveryToolTip') > -1) {
				vm[k] = false;
			}
		});
	};
	$scope.cancelPopUp = function (prodID, DeliveryMethod, index) {
		vm['showDeliveryToolTip'+index] = false;
		vm.DeliveryType = undefined;
		if(DeliveryMethod=='Default')
			DeliveryMethod = undefined;
		$scope.createListItem(prodID, DeliveryMethod);
	};
	vm.GetDeliveryMethods = function(prodID, index){
		vm.Faster = false;
		vm.Courier = false;
		vm.GiftCard = false;
		vm.DirectShip = false;
		vm.ActiveOrderCartLoader = OrderCloud.Categories.ListProductAssignments(null, prodID).then(function(res1){
			vm.ActiveOrderCartLoader = OrderCloud.Categories.Get(res1.Items[0].CategoryID).then(function(res2){
				if(res2.xp.DeliveryChargesCatWise.DeliveryMethods.Mixed){
					vm.Faster = true;
					vm['showDeliveryToolTip'+index] = true;
				}
				if(res2.xp.DeliveryChargesCatWise.DeliveryMethods.Courier == true && !res2.xp.DeliveryChargesCatWise.DeliveryMethods.DirectShip){
					vm.Courier = true;
					vm['showDeliveryToolTip'+index] = true;
				}
				if(res2.xp.DeliveryChargesCatWise.DeliveryMethods.DirectShip)
					$scope.createListItem(prodID, "DirectShip");
				if(res2.Name == "Gift Cards")
					$scope.createListItem(prodID, "USPS");
				if(res2.Name != "Gift Cards" && !res2.xp.DeliveryChargesCatWise.DeliveryMethods.DirectShip && !res2.xp.DeliveryChargesCatWise.DeliveryMethods.Courier && !res2.xp.DeliveryChargesCatWise.DeliveryMethods.Mixed){
					$scope.createListItem(prodID);
				}	
			});
		});	
	};
	/*$scope.buildOrderItems = function(prodID, DeliveryMethod, baseImg){
		var buildorderPdp = angular.element(document.getElementById("buildOrder-pdp-container")).scope().$parent.$parent.$parent.buildOrder.productDetails;
		console.log(buildorderPdp);
		if($stateParams.prodID != null || $stateParams.orderID != ""){
			if(buildorderPdp){
				if(!buildorderPdp.editProducts){
					$scope.createListItem(prodID, DeliveryMethod);
				}else{
					angular.forEach(buildorderPdp.editProducts, function(row,index){
						OrderCloud.As().LineItems.Get(vm.order.ID, row.ID).then(function(data){
							OrderCloud.As().LineItems.Delete(vm.order.ID, data.ID).then(function(res){
								data.ProductID = row.ProductID;
								console.log("data",data);
								OrderCloud.As().LineItems.Create(vm.order.ID, data.ID, data).then(function(res){
									if((index+1) == (buildorderPdp.editProducts).length){
										delete buildorderPdp.editProducts;
										vm.getLineItems();
									}	
								});
							});
						});
					},true);
				}
			}else{
				$scope.createListItem(prodID, DeliveryMethod, baseImg);
			}
		}
		$scope.createListItem(prodID, DeliveryMethod, baseImg);
	};*/
	$scope.beforeAddToCart = function(prodID, DeliveryMethod, baseImg){
		if(!vm.order){
			OrderCloud.Me.ListOutgoingOrders(null, 1, 100, null, null, {"Status":"Unsubmitted"}).then(function(res){
				if(res.Items.length != 0){
					CurrentOrder.Set(res.Items[0].ID);
					vm.order = res.Items[0];
					$scope.createListItem(prodID, DeliveryMethod, baseImg);
				}else{
					var orderParams = {"Type":"Standard","xp":{"OrderSource":"OMS","CSRID":$cookieStore.get('OMS.CSRID')}};
					if($stateParams.SearchType == 'Products' || $stateParams.SearchType == 'BuildOrder'){
						console.log(OrderCloud.Auth.ReadToken());
						BuildOrderService.AdminLogin().then(function(res){
    						console.log("token==",res);
    						angular.element(document.getElementById("order-summary")).scope().$parent.buildordersummary.token = res.access_token;
    						OrderCloud.As().Orders.Create(orderParams).then(function(res1){
    							CurrentOrder.Set(res1.ID);
								vm.order = res1;
								if($stateParams.SearchType == 'Products' || $stateParams.SearchType == 'BuildOrder'){
									angular.element(document.getElementById("order-summary")).scope().$parent.buildordersummary.order = res1;	
								}
								$scope.createListItem(prodID, DeliveryMethod, baseImg);
							});
						});
					}else{
						OrderCloud.As().Orders.Create(orderParams).then(function(res){
							CurrentOrder.Set(res.ID);
							vm.order = res;
							$scope.createListItem(prodID, DeliveryMethod, baseImg);
						});
					}
				}
			});
		}else{
			$scope.createListItem(prodID, DeliveryMethod, baseImg);
		}
	};
	$scope.createListItem = function(prodID, DeliveryMethod, baseImg){
		var lineItemParams = {"ProductID": prodID,"Quantity": 1,"xp":{"TotalCost":0}};
		if(DeliveryMethod)
			lineItemParams.xp.DeliveryMethod = DeliveryMethod;
		vm.ActiveOrderCartLoader = BuildOrderService.GetDeliveryOptions(lineItemParams, DeliveryMethod).then(function(res){
			//BuildOrderService.CompareDate().then(function(dat){
			if(!res['UPS'] && !res['LocalDelivery'] && !res['Mixed'] && res['InStorePickUp'] && !res['USPS'] && !res['DirectShip'] && !res['Courier']){
				lineItemParams.xp.deliveryFeesDtls = res['InStorePickUp'];
			}
			lineItemParams.xp.MinDate = res.MinDate;
			lineItemParams.xp.ProductImageUrl = baseImg;
			if($stateParams.SearchType=='Products' || $stateParams.SearchType == 'BuildOrder'){
				vm.ActiveOrderCartLoader = OrderCloud.LineItems.Create(vm.order.ID, lineItemParams).then(function(res){
					lineItemParams.xp.TotalCost = lineItemParams.xp.TotalCost + (res.UnitPrice * res.Quantity);
					vm.ActiveOrderCartLoader = OrderCloud.LineItems.Patch(vm.order.ID, res.ID, lineItemParams).then(function(res2){
						vm.getLineItems();
						vm.isOpen[res.ID] = true;
					});
				});
			}
			else{
				vm.ActiveOrderCartLoader = OrderCloud.As().LineItems.Create(vm.order.ID, lineItemParams).then(function(res){
					lineItemParams.xp.TotalCost = lineItemParams.xp.TotalCost + (res.UnitPrice * res.Quantity);
					vm.ActiveOrderCartLoader = OrderCloud.As().LineItems.Patch(vm.order.ID, res.ID, lineItemParams).then(function(res2){
						vm.getLineItems();
						vm.isOpen[res.ID] = true;
					});
				});
			}
			//});
		});
	};
	vm.deleteListItem = function(e, listItemID){
		e.preventDefault();
		e.stopPropagation();
		vm.CancelDeleteToolTip[listItemID] = false;
		vm.ActiveOrderCartLoader = OrderCloud.As().LineItems.Delete(vm.order.ID, listItemID).then(function(res){
			vm.getLineItems();
			vm.lineItemForm[listItemID].$setPristine();
		});
	};
	vm.getLineItems = function(){
		if(vm.order.Status == "Unsubmitted" && vm.order != undefined){
			if($stateParams.SearchType=="Products" && $stateParams.SearchType == 'BuildOrder'){
				vm.ActiveOrderCartLoader = OrderCloud.LineItems.List(vm.order.ID).then(function(res){
					vm.AvoidMultipleDelryChrgs = [];	
					vm.ActiveOrderCartLoader = LineItemHelpers.GetProductInfo(res.Items).then(function(data) {
						vm.OrderConfirmGrouping = _.groupBy(data, function(value){
							if(value.ShippingAddress!=null)
								return value.ShippingAddress.FirstName + ' ' + value.ShippingAddress.LastName + ' ' + value.ShippingAddress.Zip + ' ' + (value.ShippingAddress.Street1).split(/(\d+)/g)[1] + ' ' + value.xp.DeliveryMethod + ' ' + value.xp.deliveryDate;
						});
						angular.forEach(angular.copy(vm.OrderConfirmGrouping), function(val, key){
							if(val[0].ShippingAddress!=null){
								val[0].LineTotal = _.reduce(_.pluck(val, 'LineTotal'), function(memo, num){ return memo + num; }, 0);
								val[0].xp.deliveryCharges = _.reduce(_.map(val, function(item){return item.xp.deliveryCharges;}), function(memo, num){ return memo + num; }, 0);
								val[0].xp.Tax = _.reduce(_.map(val, function(item){return item.xp.Tax;}), function(memo, num){ return memo + num; }, 0);
								val[0].xp.TotalCost = _.reduce(_.map(val, function(item){return item.xp.TotalCost;}), function(memo, num){ return memo + num; }, 0);
							}	
						}, true);
						data = _.groupBy(data, function(obj){
							return obj.ProductID;
						});
						BuildOrderService.OrderOnHoldRemove(res.Items, vm.order.ID).then(function(dt){
							console.log("Order OnHold Removed....");
						});
						vm.lineItemProducts = [];
						vm.activeOrders = data;
						$scope.prodQty = {};
						angular.forEach(data,function(val1, key1){
							vm.lineItemProducts.push(key1);
							$scope.prodQty[key1] = _.reduce(_.pluck(data[key1], 'Quantity'), function(memo, num){ return memo + num; }, 0);
							angular.forEach(vm.activeOrders[key1],function(val, key){
								if(val.ShippingAddress && val.xp.deliveryFeesDtls){
									val.ShippingAddress.deliveryDate = val.xp.deliveryDate;
									val.ShippingAddress.lineID = val.ID;
									val.ShippingAddress.DeliveryMethod = val.xp.DeliveryMethod;
									vm.AvoidMultipleDelryChrgs.push(val.ShippingAddress);
								}
								var dt;
								val.xp.MinDays = {};
								/*if(val.xp.addressType == "Church")
									val.churchSearch = val.ShippingAddress.CompanyName;
								if(val.xp.addressType == "Funeral")
									val.funeralSearch = val.ShippingAddress.CompanyName;	
								if(val.xp.addressType == "Hospital")
									val.hosSearch = val.ShippingAddress.CompanyName;
								if(val.xp.addressType == "Cemetery")
									val.cemeterySearch = val.ShippingAddress.CompanyName;*/
									
								if(val.xp.deliveryDate){
									var dat = angular.copy(CstDateTime);
									dat.setHours(0, 0, 0, 0);
									if(new Date(val.xp.deliveryDate) < dat)
										delete val.xp.deliveryDate;
									else
										val.xp.deliveryDate = new Date(val.xp.deliveryDate);
								}
								if(val.xp.MinDate){
									angular.forEach(val.xp.MinDate, function(val1, key1){
										dt = angular.copy(CstDateTime);
										dt = dt.setDate(dt.getDate() + val1);
										val.xp.MinDays[key1] = new Date(dt);
									}, true);
									val.xp.MinDays['MinToday'] = new Date(angular.copy(CstDateTime));
									if(val.xp.MinDate.LocalDelivery){
										dt = angular.copy(CstDateTime);
										//dt.setHours(0, 0, 0, 0);
										if(dt.getHours() >= 12)
											dt = dt.setDate(dt.getDate() + val.xp.MinDate.LocalDelivery + 1);
										else
											dt = dt.setDate(dt.getDate() + val.xp.MinDate.LocalDelivery);
										val.xp.MinDays['MinToday'] = new Date(dt);
									}	
								}else{
									dt = angular.copy(CstDateTime);
									val.xp.MinDate = {};
									if(dt.getHours() >= 12)
											val.xp.MinDays['MinToday'] = dt.setDate(dt.getDate() + 1);
									else
										val.xp.MinDays['MinToday'] = dt;
								}
								val.varientsOptions = {};
								if(val.Product.xp != null && val.Product.xp.Specs_Options){
									val.varientsOptions.Size = val.Product.xp.Specs_Options.Cont_Size;
									val.varientsOptions.Color = val.Product.xp.Specs_Options.Color;
								}
								if(val.ShippingAddress!=null){
									BuildOrderService.GetPhoneNumber(val.ShippingAddress.Phone).then(function(res){
										val.ShippingAddress.Phone1 = res[0];
										val.ShippingAddress.Phone2 = res[1];
										val.ShippingAddress.Phone3 = res[2];
									});
									val.ShippingAddress.Zip = parseInt(val.ShippingAddress.Zip);
								}
								//if(val.xp.deliveryDate)
									//val.xp.deliveryDate = new Date(val.xp.deliveryDate);
								if(!val.xp.addressType)
									val.xp.addressType = "Residence";
								if(val.xp.addressType=="InStorePickUp"){
									val.xp.pickupDate = new Date(val.xp.pickupDate);
									val.willSearch = val.ShippingAddress.CompanyName;
								}
							});
						});
					});
				    vm.ActiveOrderCartLoader = BuildOrderService.PatchOrder(vm.order.ID, res).then(function(data){
						angular.element(document.getElementById("order-checkout")).scope().orderTotal = data.Total;
						vm.orderTotal = data.Total;
						vm.order = data;
					});
				});
			}
			else{
				vm.ActiveOrderCartLoader = OrderCloud.As().LineItems.List(vm.order.ID).then(function(res){
					vm.AvoidMultipleDelryChrgs = [];	
					vm.ActiveOrderCartLoader = LineItemHelpers.GetProductInfo(res.Items).then(function(data) {
						vm.OrderConfirmGrouping = _.groupBy(data, function(value){
							if(value.ShippingAddress!=null)
								return value.ShippingAddress.FirstName + ' ' + value.ShippingAddress.LastName + ' ' + value.ShippingAddress.Zip + ' ' + (value.ShippingAddress.Street1).split(/(\d+)/g)[1] + ' ' + value.xp.DeliveryMethod + ' ' + value.xp.deliveryDate;
						});
						angular.forEach(angular.copy(vm.OrderConfirmGrouping), function(val, key){
							if(val[0].ShippingAddress!=null){
								val[0].LineTotal = _.reduce(_.pluck(val, 'LineTotal'), function(memo, num){ return memo + num; }, 0);
								val[0].xp.deliveryCharges = _.reduce(_.map(val, function(item){return item.xp.deliveryCharges;}), function(memo, num){ return memo + num; }, 0);
								val[0].xp.Tax = _.reduce(_.map(val, function(item){return item.xp.Tax;}), function(memo, num){ return memo + num; }, 0);
								val[0].xp.TotalCost = _.reduce(_.map(val, function(item){return item.xp.TotalCost;}), function(memo, num){ return memo + num; }, 0);
							}	
						}, true);
						data = _.groupBy(data, function(obj){
							return obj.ProductID;
						});
						BuildOrderService.OrderOnHoldRemove(res.Items, vm.order.ID).then(function(dt){
							console.log("Order OnHold Removed....");
						});
						vm.lineItemProducts = [];
						vm.activeOrders = data;
						$scope.prodQty = {};
						angular.forEach(data,function(val1, key1){
							vm.lineItemProducts.push(key1);
							$scope.prodQty[key1] = _.reduce(_.pluck(data[key1], 'Quantity'), function(memo, num){ return memo + num; }, 0);
							angular.forEach(vm.activeOrders[key1],function(val, key){
								if(val.ShippingAddress && val.xp.deliveryFeesDtls){
									val.ShippingAddress.deliveryDate = val.xp.deliveryDate;
									val.ShippingAddress.lineID = val.ID;
									val.ShippingAddress.DeliveryMethod = val.xp.DeliveryMethod;
									vm.AvoidMultipleDelryChrgs.push(val.ShippingAddress);
								}
								var dt;
								val.xp.MinDays = {};
								/*if(val.xp.addressType == "Church")
									val.churchSearch = val.ShippingAddress.CompanyName;
								if(val.xp.addressType == "Funeral")
									val.funeralSearch = val.ShippingAddress.CompanyName;	
								if(val.xp.addressType == "Hospital")
									val.hosSearch = val.ShippingAddress.CompanyName;
								if(val.xp.addressType == "Cemetery")
									val.cemeterySearch = val.ShippingAddress.CompanyName;*/
									
								if(val.xp.deliveryDate){
									var dat = angular.copy(CstDateTime);
									dat.setHours(0, 0, 0, 0);
									if(new Date(val.xp.deliveryDate) < dat)
										delete val.xp.deliveryDate;
									else
										val.xp.deliveryDate = new Date(val.xp.deliveryDate);
								}
								if(val.xp.MinDate){
									angular.forEach(val.xp.MinDate, function(val1, key1){
										dt = angular.copy(CstDateTime);
										dt = dt.setDate(dt.getDate() + val1);
										val.xp.MinDays[key1] = new Date(dt);
									}, true);
									val.xp.MinDays['MinToday'] = new Date(angular.copy(CstDateTime));
									if(val.xp.MinDate.LocalDelivery){
										dt = angular.copy(CstDateTime);
										//dt.setHours(0, 0, 0, 0);
										if(dt.getHours() >= 12)
											dt = dt.setDate(dt.getDate() + val.xp.MinDate.LocalDelivery + 1);
										else
											dt = dt.setDate(dt.getDate() + val.xp.MinDate.LocalDelivery);
										val.xp.MinDays['MinToday'] = new Date(dt);
									}	
								}else{
									dt = angular.copy(CstDateTime);
									val.xp.MinDate = {};
									if(dt.getHours() >= 12)
											val.xp.MinDays['MinToday'] = dt.setDate(dt.getDate() + 1);
									else
										val.xp.MinDays['MinToday'] = dt;
								}
								val.varientsOptions = {};
								if(val.Product.xp != null && val.Product.xp.Specs_Options){
									val.varientsOptions.Size = val.Product.xp.Specs_Options.Cont_Size;
									val.varientsOptions.Color = val.Product.xp.Specs_Options.Color;
								}
								if(val.ShippingAddress!=null){
									BuildOrderService.GetPhoneNumber(val.ShippingAddress.Phone).then(function(res){
										val.ShippingAddress.Phone1 = res[0];
										val.ShippingAddress.Phone2 = res[1];
										val.ShippingAddress.Phone3 = res[2];
									});
									val.ShippingAddress.Zip = parseInt(val.ShippingAddress.Zip);
								}
								//if(val.xp.deliveryDate)
									//val.xp.deliveryDate = new Date(val.xp.deliveryDate);
								if(!val.xp.addressType)
									val.xp.addressType = "Residence";
								if(val.xp.addressType=="InStorePickUp"){
									val.xp.pickupDate = new Date(val.xp.pickupDate);
									val.willSearch = val.ShippingAddress.CompanyName;
								}
							});
						});
					});
				    vm.ActiveOrderCartLoader = BuildOrderService.PatchOrder(vm.order.ID, res).then(function(data){
						angular.element(document.getElementById("order-checkout")).scope().orderTotal = data.Total;
						vm.orderTotal = data.Total;
						vm.order = data;
					});
				});
			}
		}else{
			/*OrderCloud.As().Orders.ListOutgoing(null, null, $stateParams.ID, null, null, "FromUserID").then(function(assignOrders){
				var data = [];
				data = _.where(assignOrders.Items, {"FromUserID":$stateParams.ID});
				if(data.length == 0){
					var orderParams = {"Type": "Standard", "xp":{"OrderSource":"OMS"}};
					OrderCloud.As().Orders.Create(orderParams).then(function(res){
						CurrentOrder.Set(res.ID);
						vm.order = res;
						vm.getLineItems();
					});
				}else{
					var createOrder = true;
					angular.forEach(data, function(row, index){
						if(row.Status == "Unsubmitted"){
							createOrder = false;
							CurrentOrder.Set(row.ID);
							vm.order = row;
							vm.getLineItems();
						} 
					},true);
					if(createOrder == true){
						var orderParams = {"Type": "Standard", "xp":{"OrderSource":"OMS"}};
						OrderCloud.As().Orders.Create(orderParams).then(function(res){
							CurrentOrder.Set(res.ID);
							vm.order = res;
							vm.getLineItems();
						});
					}
				}
			});*/
		}
	};
	if($stateParams.SearchType!="Products" && $stateParams.SearchType != 'plp' && $stateParams.SearchType != 'BuildOrder')
		vm.getLineItems();
	$scope.cancelOrder = function(){
		OrderCloud.As().Orders.Cancel(vm.order.ID).then(function(data){
			vm.order = data;
			vm.getLineItems();
		});
	};
	$scope.saveForLater = function(note){
		OrderCloud.As().Me.ListOutgoingOrders(null, 1, 100, null, null, {"Status":"Unsubmitted"}).then(function(res){
			angular.forEach(res.Items,function(val, key){
				if(val.FromUserID == $stateParams.ID && val.ID == vm.order.ID){
					OrderCloud.As().Orders.Patch(vm.order.ID,{"xp":{"SavedOrder":{"Name":note,"Flag":true}}}).then(function(res1){
						console.log("saved order successfully/removed");
					});
				}else if(val.FromUserID == $stateParams.ID && val.ID != vm.order.ID && val.xp.SavedOrder){
					OrderCloud.As().Orders.Patch(val.ID,{"xp":{"SavedOrder":{"Flag":false}}}).then(function(res2){
						console.log("saved order successfully/removed");
					});
				}
			});
		});
	};
	vm.lineDtlsSubmit = function(LineItemLists, index){
		angular.forEach(vm.isOpen, function(val, key){
			vm.isOpen[key] = false;
		}, true);
		var deliverySum, tempArr = [], OrderOnHold;
		angular.forEach(LineItemLists, function(row, key){
			deliverySum = 0;
			vm.lineItemForm[row.ID].$setPristine();
			angular.forEach(vm.HighLightErrors, function(val, key){
				if(key==row.ID){
					val.formError = false;
					delete vm.HighLightErrors[key];
				}
			}, true);
			if(row.visible == true)
				delete row.xp.CardMessage;
			row.ShippingAddress.Phone = "("+row.ShippingAddress.Phone1+") "+row.ShippingAddress.Phone2+"-"+row.ShippingAddress.Phone3;
			angular.forEach(row.xp.deliveryFeesDtls, function(val, key){
				deliverySum += parseFloat(val);
			});
			delete row.xp.Discount;
			delete row.xp.MinDays;
			if(deliverySum > 250){
				row.xp.Discount = deliverySum - 250;
				deliverySum = 250;
			}
			if(row.xp.Tax)
				row.xp.TotalCost = deliverySum + (parseFloat(row.Quantity) * parseFloat(row.UnitPrice)) + row.xp.Tax;
			if(row.xp.addressType != "Hospital" && row.xp.addressType != "Funeral"){
				delete row.xp.PatientFName;
				delete row.xp.PatientLName;
			}
			if(row.xp.addressType=="InStorePickUp"){
				delete row.xp.deliveryDate;
				row.ShippingAddress.CompanyName = row.willSearch;
				row.xp.DeliveryMethod = "InStorePickUp";
				delete row.xp.deliveryFeesDtls;
				delete row.xp.deliveryCharges;
			}else{
				delete row.xp.pickupDate;
			}
			row.ShipFromAddressID = "testShipFrom";
			tempArr.push(OrderCloud.As().LineItems.Update(vm.order.ID, row.ID, row));
		}, true);
		vm.ActiveOrderCartLoader = $q.all(tempArr).then(function(res1){
			tempArr = [];
			angular.forEach(res1, function(val, key){
				var row1 = _.findWhere(LineItemLists, {ID: val.ID});
				tempArr.push(OrderCloud.As().LineItems.SetShippingAddress(vm.order.ID, val.ID, row1.ShippingAddress));
				if(val.xp.Status || val.OutgoingWire){
					OrderOnHold = true;
				}
			}, true);
			if(OrderOnHold){
				OrderCloud.As().Orders.Patch(vm.order.ID, {"xp": {"Status": "OnHold","CSRID":$cookieStore.get('OMS.CSRID')}});
			}	
			vm.ActiveOrderCartLoader = $q.all(tempArr).then(function(res2){
				vm.ActiveOrderCartLoader = TaxService.GetTax(vm.order.ID).then(function(res3){
					tempArr = [];
					angular.forEach(res3.ResponseBody.TaxLines, function(val, key){
						var row = _.findWhere(res1, {ID: val.LineNo});
						row.xp.deliveryCharges = 0;
						_.filter(row.xp.deliveryFeesDtls, function(val){
							row.xp.deliveryCharges += parseFloat(val);
						});
						row.TotalCost = _.reduce(_.pluck(row, 'deliveryFeesDtls'), function(memo, num){ return memo + num; }, 0);
						tempArr.push(OrderCloud.As().LineItems.Patch(vm.order.ID, val.LineNo, {"xp":{"Tax":val.Tax, "TotalCost":row.xp.deliveryCharges+row.LineTotal+val.Tax, "deliveryCharges": row.xp.deliveryCharges}}));
					}, true);
					vm.ActiveOrderCartLoader = $q.all(tempArr).then(function(res4){
						vm.getLineItems();
						vm.OrderConfirmPopUp = !vm.OrderConfirmPopUp;
					});
				});
			});
		});
		
		/*OrderCloud.As().LineItems.Update(vm.order.ID, line.ID, line).then(function(){
			OrderCloud.As().LineItems.SetShippingAddress(vm.order.ID, line.ID, line.ShippingAddress).then(function(){
				if((LineItemLists.length-1) > index){
					vm.lineDtlsSubmit(LineItemLists, index+1);
				}else{
					TaxService.GetTax(vm.order.ID).then(function(res){
						var count=0;
						angular.forEach(res.ResponseBody.TaxLines, function(val, key){
							var row = _.findWhere(LineItemLists, {ID: val.LineNo});
							row.xp.deliveryCharges = 0;
							_.filter(row.xp.deliveryFeesDtls, function(val){
								row.xp.deliveryCharges += parseFloat(val);
							});
							row.TotalCost = _.reduce(_.pluck(row, 'deliveryFeesDtls'), function(memo, num){ return memo + num; }, 0);
							OrderCloud.As().LineItems.Patch(vm.order.ID, val.LineNo, {"xp":{"Tax":val.Tax, "TotalCost":row.xp.deliveryCharges+row.LineTotal+val.Tax, "deliveryCharges": row.xp.deliveryCharges}}).then(function(response){
								count++;
								if(res.ResponseBody.TaxLines.length == count){
									vm.getLineItems();
									vm.OrderConfirmPopUp = !vm.OrderConfirmPopUp;
								}
							});
						}, true);
					});
				}
				if(line.xp.Status || line.OutgoingWire){
					OrderCloud.As().Orders.Patch(vm.order.ID, {"xp": {"Status": "OnHold","CSRID":$cookieStore.get('OMS.CSRID')}}).then(function(){
						console.log("Order Status OnHold Updated.......");
					});
				}
			});
		});*/
	};
	vm.GetDeliveryChrgs = function(line, DeliveryMethod, dt){
		var d = $q.defer();
		if(dt){
			BuildOrderService.GetPreceedingZeroDate(dt).then(function(res){
				BuildOrderService.CompareDate(res).then(function(data){
					vm.DeliveryMethodChrgs(line, DeliveryMethod, data, d);
				});
			});
		}else{
			vm.DeliveryMethodChrgs(line, DeliveryMethod, "undefined", d);
		}
		return d.promise;
	}
	vm.DeliveryMethodChrgs = function(line, DeliveryMethod, data, d){
		BuildOrderService.GetDeliveryOptions(line, DeliveryMethod).then(function(res){
			var obj = {};
			if(res['UPS'] && !res['LocalDelivery'] && !res['Mixed'] && !res['InStorePickUp'] && !res['USPS'] && !res['DirectShip'] && !res['Courier']){
				DeliveryMethod = "UPS";
			}
			if(data != "1" && DeliveryMethod == "LocalDelivery"){
				delete res.LocalDelivery.SameDayDelivery;
			}
			angular.forEach(res[DeliveryMethod], function(val, key){
				obj[key] = val;
			}, true);
			line.xp.deliveryFeesDtls = obj;
			if(!line.xp.DeliveryMethod)
				line.xp.DeliveryMethod = DeliveryMethod;
			line.xp.TotalCost = 0;
			angular.forEach(line.xp.deliveryFeesDtls, function(val, key){
				line.xp.TotalCost += parseFloat(val);
			});
			//delete line.xp.Discount;
			if(line.xp.TotalCost > 250){
				line.xp.Discount = line.xp.TotalCost - 250;
				line.xp.TotalCost = 250;
			}	
			line.xp.TotalCost = line.xp.TotalCost + (line.Quantity * line.UnitPrice);
			d.resolve("1");
		});
	}
	vm.updateProdNote = function(index,note,prodID,line){
		this.$parent.activeOrders[line][0].Product.xp.productNote = note;
		this.$parent['readOnly'+index] = false;
		OrderCloud.Products.Patch(prodID,{"xp":{"productNote":note}}).then(function(data){
			
		});
	};
	vm.showNoteField = function(index){
		vm['prodNoteShow'+index] = true;
		vm['readOnly'+index] = true;
	};
	vm.viewAddrBook = function(line){
		vm.recipFields = line;
		$scope.showModal = !$scope.showModal;
		OrderCloud.As().Me.ListAddresses().then(function(res){
			vm.addressesList = res.Items;
		});
	};
	vm.GetAboveAddresses = function(line){
		vm.TempAddressBook = [];
		angular.forEach(angular.copy(vm.activeOrders), function(val, key){
			angular.forEach(val, function(val1, key1){
				vm.TempAddressBook.push(val1.ShippingAddress);
			}, true);
		}, true);
		vm.TempAddressBook = _.uniq(vm.TempAddressBook, function(item, key, a){
			if(item!=null)
				return item.Street1;
		});
		vm.recipFields = line;
		$scope.showAboveRecipientModal = !$scope.showAboveRecipientModal;
	}
	vm.getBookAddress = function(addressData, TempAddr){
		if(vm.recipFields.ShippingAddress==null)
			vm.recipFields.ShippingAddress = {};
		/*vm.recipFields.ShippingAddress.FirstName = addressData.FirstName;
		vm.recipFields.ShippingAddress.LastName = addressData.LastName;
		vm.recipFields.ShippingAddress.City = addressData.City;
		vm.recipFields.ShippingAddress.State = addressData.State;
		vm.recipFields.ShippingAddress.Zip = parseInt(addressData.Zip);
		vm.recipFields.ShippingAddress.Street1 = addressData.Street1;
		vm.recipFields.ShippingAddress.Street2 = addressData.Street2;*/
		vm.recipFields.ShippingAddress = addressData;
		vm.recipFields.ShippingAddress.Zip = parseInt(addressData.Zip);
		//$scope.addressType = "Residence";
		if(TempAddr=="TempAddr")
			$scope.showAboveRecipientModal = !$scope.showAboveRecipientModal;
		else	
			$scope.showModal = !$scope.showModal;
		if(addressData.Phone){
			BuildOrderService.GetPhoneNumber(addressData.Phone).then(function(res){
				vm.recipFields.ShippingAddress.Phone1 = res[0];
				vm.recipFields.ShippingAddress.Phone2 = res[1];
				vm.recipFields.ShippingAddress.Phone3 = res[2];
			});
		}
		vm.getDeliveryCharges(vm.recipFields);
	};
	$scope.showModal = false;
	$scope.showAboveRecipientModal = false;
	var storesData;
	BuildOrderService.GetStores().then(function(res){
		storesData = res;
		$scope.storeNames = _.pluck(res, 'CompanyName');
	});
	
	$scope.storesDtls = function(item){
		var store = this.$parent.$parent.$parent.lineitem;
		var filt = _.filter(storesData, function(row){
			return _.indexOf([item],row.CompanyName) > -1;
		});
		if(store.ShippingAddress == null)
			store.ShippingAddress = {};
		store.ShippingAddress = filt[0];
		store.ShippingAddress.Zip = parseInt(filt[0].Zip);
		/*store.ShippingAddress.Street1 = filt[0].storeAddress;
		store.ShippingAddress.City = filt[0].city;
		store.ShippingAddress.State = filt[0].state;
		store.ShippingAddress.Zip = parseInt(filt[0].zipCode);
		store.ShippingAddress.Country = filt[0].Country;*/
		BuildOrderService.GetPhoneNumber(store.ShippingAddress.Phone).then(function(res){
			store.ShippingAddress.Phone1 = res[0];
			store.ShippingAddress.Phone2 = res[1];
			store.ShippingAddress.Phone3 = res[2];
		});
		vm.getDeliveryCharges(store);
	};
	vm.AllDtls = function(item, line){
		var list;
		if(line.xp.addressType=="Hospital")
			list = vm.HospitalsList;
		if(line.xp.addressType=="School")
			list = vm.SchoolsList;
		if(line.xp.addressType=="Funeral"){
			list = vm.FuneralsList;
			delete line.churchSearch;
		}	
		if(line.xp.addressType=="Church"){
			list = vm.ChurchsList;
			delete line.funeralSearch;
		}
		if(line.xp.addressType=="Cemetery"){
			list = vm.CemeterysList;
		}
		var filt = _.filter(list, function(row){
			return _.indexOf([item],row.CompanyName) > -1;
		});
		if(line.ShippingAddress==null)
			line.ShippingAddress={};
		line.ShippingAddress.Street1 = filt[0].Street1;
		line.ShippingAddress.Street2 = filt[0].Street2;
		line.ShippingAddress.City = filt[0].City;
		line.ShippingAddress.State = filt[0].State;
		line.ShippingAddress.Zip = parseInt(filt[0].Zip);
		line.ShippingAddress.Country = filt[0].Country;
		BuildOrderService.GetPhoneNumber(filt[0].Phone).then(function(res){
			line.ShippingAddress.Phone1 = res[0];
			line.ShippingAddress.Phone2 = res[1];
			line.ShippingAddress.Phone3 = res[2];
		});
		vm.getDeliveryCharges(line);
	};
	var deliveryCharges, SameDate;
	BuildOrderService.GetBuyerDtls().then(function(res){
		deliveryCharges = res.xp.ZipCodes;
	});
	vm.changeAddrType = function(addressType, line){
		//line.xp.addressType = addressType;
		vm.lineItemForm[line.ID].$setPristine();
		if(addressType != "InStorePickUp" || line.willSearch){
			vm.getDeliveryCharges(line);
		}
		if(addressType == "Hospital" && !vm.HospitalNames){
			vm.GetAllList("Hospitals");
		}
		if(addressType == "Funeral" && !vm.FuneralNames){
			vm.GetAllList("FuneralHome");
		}
		if(addressType == "Church" && !vm.ChurchNames){
			vm.GetAllList("Church");
		}
		if(addressType == "School" && !vm.SchoolNames){
			vm.GetAllList("School");
		}
		if(addressType == "Cemetery" && !vm.CemeteryNames){
			vm.GetAllList("Cemetery");
		}
	}
	vm.GetAllList = function(AddrType){
		BuildOrderService.GetHosChurchFuneral(AddrType).then(function(res){
			console.log(res);
			if(AddrType=="Hospital"  || AddrType=="Hospitals"){
				vm.HospitalNames = res.data.Names;
				vm.HospitalsList = res.data.List;
			}
			if(AddrType=="FuneralHome" || AddrType=="Funeral"){
				vm.FuneralNames = res.data.Names;
				vm.FuneralsList = res.data.List;
			}
			if(AddrType=="Church"){
				vm.ChurchNames = res.data.Names;
				vm.ChurchsList = res.data.List;
			}
			if(AddrType=="School"){
				vm.SchoolNames = res.data.Names;
				vm.SchoolsList = res.data.List;
			}
			if(AddrType=="Cemetery"){
				vm.CemeteryNames = res.data.Names;
				vm.CemeterysList = res.data.List;
			}
		});
	}
	
	vm.DateSelected = function(line){
		if(line.xp.deliveryDate){
			if(line.xp.deliveryDate != SameDate){
				SameDate = line.xp.deliveryDate;
				vm.getDeliveryCharges(line);
			}
		}	
	}
	vm.getDeliveryCharges = function(line, form){
		vm.NoDeliveryFees = false;
		angular.forEach(vm.AvoidMultipleDelryChrgs, function(val, key){
			val.deliveryDate = new Date(val.deliveryDate);
			var dt2, dt1;
			dt1 = (("0" + (val.deliveryDate.getMonth()+1)).slice(-2))+"-"+(("0" + val.deliveryDate.getDate()).slice(-2))+"-"+val.deliveryDate.getFullYear();
			if(line.xp.deliveryDate)
				dt2 = (("0" + (line.xp.deliveryDate.getMonth()+1)).slice(-2))+"-"+(("0" + line.xp.deliveryDate.getDate()).slice(-2))+"-"+line.xp.deliveryDate.getFullYear();
			if(dt1 == dt2 && val.Zip == line.ShippingAddress.Zip && (val.Street1).split(/(\d+)/g)[1] == (line.ShippingAddress.Street1).split(/(\d+)/g)[1] && val.lineID != line.ID && val.DeliveryMethod == line.xp.DeliveryMethod){
				vm.NoDeliveryFees = true;
			}
		}, true);
		var deliverySum = 0, DeliveryMethod, dt;
		delete line.xp.Discount;
		if(deliverySum > 250){
			line.xp.Discount = deliverySum - 250;
			deliverySum = 250;
		}
		if(line.xp.addressType == "InStorePickUp"){
			DeliveryMethod = "InStorePickUp";
			dt = undefined;
			delete line.xp.deliveryFeesDtls;
		}else{
			if(line.xp.DeliveryMethod == "DirectShip"){
				DeliveryMethod = "DirectShip";
			}
		}
		vm.ActiveOrderCartLoader = AddressValidationService.Validate(line.ShippingAddress).then(function(res){
			if(res.ResponseBody.ResultCode == 'Success') {
				form.invalidAddress = false;
				var validatedAddress = res.ResponseBody.Address;
				var zip = validatedAddress.PostalCode.substring(0, 5);
				line.ShippingAddress.Zip = parseInt(zip);
				line.ShippingAddress.Street1 = validatedAddress.Line1;
				line.ShippingAddress.Street2 = null;
				line.ShippingAddress.City = validatedAddress.City;
				line.ShippingAddress.State = validatedAddress.Region;
				line.ShippingAddress.Country = validatedAddress.Country;
				if(line.ShippingAddress.City == "Minneapolis" || line.ShippingAddress.City == "Saint Paul"){
					DeliveryMethod = "LocalDelivery";
					dt = line.xp.deliveryDate;
				}else{
					DeliveryMethod = "UPS";
					dt = undefined;
					if(DeliveryMethod=="UPS" && line.xp.DeliveryMethod=="Mixed")
						console.log("Don't delete deliveryFeesDtls");
					else
						delete line.xp.deliveryFeesDtls;
				}
				if(line.xp.DeliveryMethod == "DirectShip" && DeliveryMethod != "UPS"){
					DeliveryMethod = "DirectShip";
					dt = line.xp.deliveryDate;
				}
				if(line.xp.DeliveryMethod == "Mixed"){
					DeliveryMethod = "Mixed";
					dt = line.xp.deliveryDate;
				}
				if(line.ShippingAddress.City != "Minneapolis" && line.ShippingAddress.City != "Saint Paul"){
					DeliveryMethod = "UPS";
					dt = undefined;
					if(DeliveryMethod=="UPS" && line.xp.DeliveryMethod=="Mixed")
						console.log("Don't delete deliveryFeesDtls");
					else
						delete line.xp.deliveryFeesDtls;
				}
				if(line.xp.DeliveryMethod == "Courier"){
					DeliveryMethod = "Courier";
					dt = line.xp.deliveryDate;
				}
				if(line.xp.DeliveryMethod == "USPS"){
					DeliveryMethod = "USPS";
					dt = line.xp.deliveryDate;
				}
				if(line.xp.addressType == "InStorePickUp"){
					DeliveryMethod = "InStorePickUp";
					dt = undefined;
					delete line.xp.deliveryFeesDtls;
				}
				if(DeliveryMethod=="UPS" && line.xp.DeliveryMethod=="Mixed" ){
					alert("Faster Delivery Is Only Local Delivery...!");
				}else{
					vm.ActiveOrderCartLoader = vm.GetDeliveryChrgs(line, DeliveryMethod, dt).then(function(){
						line.xp.DeliveryMethod = DeliveryMethod;
						angular.forEach(line.xp.deliveryFeesDtls, function(val, key){
							deliverySum += parseFloat(val);
						});
						line.xp.TotalCost = parseFloat(line.Quantity)*parseFloat(line.UnitPrice);
						if(vm.NoDeliveryFees == true){
							delete line.xp.deliveryFeesDtls;
							if(line.xp.Tax)
								line.xp.TotalCost = line.xp.TotalCost+line.xp.Tax;
						}else{
							line.xp.TotalCost = deliverySum+line.xp.TotalCost;
							if(line.xp.Tax)
								line.xp.TotalCost = line.xp.TotalCost+line.xp.Tax;
						}
						vm.AvoidMultipleDelryChrgs = [];
						vm.lineItemProducts = [];
						angular.forEach(vm.activeOrders,function(val1, key1){
							vm.lineItemProducts.push(key1);
							angular.forEach(vm.activeOrders[key1],function(val, key){
								if(val.ShippingAddress && val.xp.deliveryFeesDtls){
									val.ShippingAddress.deliveryDate = val.xp.deliveryDate;
									val.ShippingAddress.lineID = val.ID;
									val.ShippingAddress.DeliveryMethod = val.xp.DeliveryMethod;
									vm.AvoidMultipleDelryChrgs.push(val.ShippingAddress);
								}
							}, true);
						}, true);
					});
				}
			}else{
				form.invalidAddress = true;
				//alert("Address not found...!");
			}
		});
	};
	$scope.editProduct = function(line){
		angular.element(document.getElementById("buildOrder-pdp-container")).scope().$parent.$parent.$parent.buildOrder.productdata(line[0].ProductID, line[0].varientsOptions, line);
	};
	/*vm.GetSearchedVal = function(lineitems){
		if(lineitems.xp.addressType=="School")
			lineitems.schSearch = lineitems.xp.SearchedName;
		if(lineitems.xp.addressType=="Funeral" || lineitems.xp.addressType=="Church")
			lineitems.churchSearch = lineitems.xp.SearchedName;	
		if(lineitems.xp.addressType=="Hospital")
			lineitems.hosSearch = lineitems.xp.SearchedName;		
	}*/
	vm.SaveAllLineItems = function(){
		var LineItemLists = [], arr = [], arr2 = [], arr3 = [];
		angular.forEach(vm.activeOrders, function(val, key){
			LineItemLists = _.union(LineItemLists, val);
		});
		vm.HighLightErrors = {};
		angular.forEach(vm.lineItemForm, function(val, key){
			if(val!=undefined){
				val.$submitted = true;
				arr.push(val.$valid);
				arr2.push(val.$pristine);
				arr3.push(val.invalidAddress);
				if(!val.$valid || val.invalidAddress){
					val.formError = true;
					vm.HighLightErrors[key] = val;
				}else{
					val.formError = false;
				}
			}
		},true);
		if(!_.contains(arr, false) && _.contains(arr2, false) && !_.contains(arr3, true)){
			vm.lineDtlsSubmit(LineItemLists, 0);
		}
		if(!_.contains(arr2, false) && !_.contains(arr, false)){
			vm.OrderConfirmPopUp = !vm.OrderConfirmPopUp;
		}
	};
	vm.DeleteToolTip = {
		templateUrl: 'DeleteToolTip.html'
	};
	vm.closeDeletePopover = function (e, lineID) {
		e.preventDefault();
		e.stopPropagation();
		vm.CancelDeleteToolTip[lineID] = false;
	};
	vm.closeOusideClick = function () {
		vm.CancelDeleteToolTip[vm.OutsideClickToolTipIndex] = false;
	};
	vm.DeleteToolTipPopOver = function(e, lineID){
		e.preventDefault();
		e.stopPropagation();
		vm.closeOusideClick();
		vm.CancelDeleteToolTip[lineID] = true;
		vm.OutsideClickToolTipIndex = lineID;
	};
}

function buildOrderPLPController(productList, $stateParams) {
	var vm = this;
	/*console.log("productList", productList);
	if($stateParams.SearchType=='plp'){
		vm.catList=productList;
		console.log("vm.catList", vm.catList);
	}*/
}

function buildOrderPDPController($scope, $sce, alfrescoAccessURL) {
	var vm = this;
	vm.upselloverlay=false;
	vm.viewCareGuide = false;
	$scope.viewCareGuide=function(){
		vm.viewCareGuide = !vm.viewCareGuide;
	}
	vm.getArticle=function(data){
		vm.articleURL="", vm.articleImgURL="";
		var alfticket = localStorage.getItem("alfrescoTicket");

		vm.articleURL=$sce.trustAsResourceUrl(alfrescoAccessURL+data+"?alf_ticket="+alfticket);
		// var file=data.substring(data.lastIndexOf("/") + 1, data.length);
		// var imgName= file.substring(0, file.lastIndexOf(".") + 0);
		// var str1 = data.substr(0, data.lastIndexOf("/"));
		// var str2 = str1.substring(str1.lastIndexOf("/") + 1, str1.length);
		// var str3 =alfrescoAccessURL+"/getArticleData/nodes.json?id="+str2+"&alf_ticket="+alfticket;
		// console.log("result", str3);
		// $http.get(str3).then(function(assign) {
			// var assign=assign.data.displayPath;
			// var str4 = assign.substring(assign.lastIndexOf("Bachmans Quick Start/") + 0, assign.length);
			// var url=alfrescoAccess+ str4 + "/Media"+"?alf_ticket="+alfticket;
			// $http.get(url).then(function(res) {
				// Underscore.filter(res.data.items, function(row){
					// if((row.nodeType=="ws:image") && (row.fileName==imgName+".jpg")){
						// console.log("rrrrl", alfrescoAccessURL+"/"+row.contentUrl+"?alf_ticket="+alfticket);
						// vm.articleImgURL=$sce.trustAsResourceUrl(alfrescoAccessURL+"/"+row.contentUrl+"?alf_ticket="+alfticket);
					// }
				// })
			// })
		// });
	}
}
  
function buildOrderSummaryController($scope, $state, ocscope, buyerid, $cookieStore, $stateParams, $exceptionHandler, Order, CurrentOrder, AddressValidationService, LineItemHelpers, OrderCloud, $http, BuildOrderService, $q, SearchData, $sce) {
    var vm = this;
    if($stateParams.SearchType != 'Products' && $stateParams.SearchType != 'BuildOrder' && $stateParams.SearchType != 'plp' && $stateParams.SearchType!='Workshop'){
		vm.order = Order;
	}
	else if($stateParams.SearchType == 'Products' || $stateParams.SearchType == 'BuildOrder'){
		vm.order=angular.element(document.getElementById("BuildOrderRightNav")).scope().buildOrderRight.order;
	}
	vm.selectUser = function(user){	
		vm.showDetails=user;		
		$scope.showUser=true;
	}
	/*vm.openUser=function(data){
		console.log(data);
		angular.element(document.getElementById("buildorder")).scope().$parent.buildOrder.guestUserModal=false;
		var anonymoustoken=angular.element(document.getElementById("oms-plp-right")).scope().buildOrderRight.anonymoustoken;
		console.log("..", SearchData.productID);
		var credentials={"Username": data.Username, "Password":data.Password};
		if($stateParams.SearchType == 'Products'){
			var anonUserToken = OrderCloud.Auth.ReadToken();
			console.log(anonUserToken);
			OrderCloud.Users.GetAccessToken(data.ID, impersonation)
				.then(function(res) {
					console.log(res);
					OrderCloud.Auth.SetImpersonationToken(res['access_token']);
					OrderCloud.Orders.TransferTempUserOrder(anonymoustoken)
	                    .then(function(res1){
	                    	console.log(res1);
	                    })
				})
			//$state.go('checkout', {ID:$stateParams.ID}, {reload:true});
		}
		//$state.go($state.current, {ID:user,SearchType:'User',prodID:SearchData.productID}, {reload:true});
	}*/
	vm.openUser=function(data){
        var tokenrequest={
			"ClientID": "8836BE8D-710A-4D2D-98BF-EDBE7227E3BB",
			"Claims": [
				ocscope
			]
		}
		var anonymoustoken=$cookieStore.get("OMS.impersonation.token");
        OrderCloud.Users.GetAccessToken(data.ID, tokenrequest).then(function(buyertoken){
        	console.log("buyertoken",buyertoken);
        	$http({
	            method: 'PUT',
	            dataType: "json",
	            url: "https://api.ordercloud.io/v1/buyers/"+buyerid+"/orders?tempUserToken="+anonymoustoken,
	            headers: {
	            	'Authorization':'Bearer '+ buyertoken.access_token,
	                'Content-Type': 'application/json'
	            }
	        }).success(function (data3, status, headers, config) {
	        	angular.element(document.getElementById("buildorder")).scope().$parent.buildOrder.guestUserModal=false;
				var anonymoustoken=$cookieStore.get("OMS.impersonation.token");
				OrderCloud.As().Orders.Get(vm.order.ID).then(function(resp){
					console.log(resp);
					$stateParams.ID=resp.FromUserID;
					$state.go('checkout', {ID:$stateParams.ID}, {reload:true});
				})
				console.log("..", anonymoustoken);
				console.log("alfresco successssss", data3);
				//$state.go('checkout', {ID:$stateParams.ID}, {reload:true});
	        }).error(function (data, status, headers, config) {
				console.log("alfresco error",data3);
	        });
        })
		/*$http({

                method: 'POST',
                dataType:"json",
                url:  "https://auth.ordercloud.io/oauth/token",
                data: data1

            }).success(function (data1, status, headers, config) {
				//return data.access_token;
				//OrderCloud.Auth.SetToken(data.access_token);
				console.log("data1",data1);
				var admintoken=data1;
				var buyerdata = {
					"ClientID": "8836BE8D-710A-4D2D-98BF-EDBE7227E3BB",
					"Claims": ["FullAccess"]
				};
				$http({

	                method: 'POST',
	                dataType:"json",
	                url:  "https://api.ordercloud.io/v1/buyers/"+buyerid+"/users/"+data.ID+"/accesstoken",
	                headers: {
	                	'Authorization': 'Bearer '+ admintoken.access_token,
		                'Content-Type': 'application/json'
		            },
		            data: buyerdata
	            }).success(function (data2, status, headers, config) {
					//return data.access_token;
					//OrderCloud.Auth.SetToken(data.access_token);
					console.log("data2",data2);
					$http({
			            method: 'PUT',
			            dataType: "json",
			            url: "https://api.ordercloud.io/v1/buyers/"+buyerid+"/orders?tempUserToken="+anonymoustoken,
			            headers: {
			            	'Authorization':'Bearer '+ data2.access_token,
			                'Content-Type': 'application/json'
			            }
			        }).success(function (data3, status, headers, config) {
			        	angular.element(document.getElementById("buildorder")).scope().$parent.buildOrder.guestUserModal=false;
						var anonymoustoken=$cookieStore.get("OMS.impersonation.token");
						console.log("..", anonymoustoken);
						console.log("alfresco successssss", data3);
			        }).error(function (data, status, headers, config) {
					console.log("alfresco error",data3);
			        });
					var admintoken=data;
	            }).error(function (data2, status, headers, config) {
	                console.log("data2",data2);
	            });

            }).error(function (data, status, headers, config) {
                console.log("data1",data);
            });*/
		
		//$state.go($state.current, {ID:user,SearchType:'User',prodID:SearchData.productID}, {reload:true});
	}
	vm.statechange = function(){
		angular.element(document.getElementById("buildorder")).scope().$parent.buildOrder.guestUserModal=false;
		$stateParams.ID=vm.order.FromUserID;
		if($stateParams.SearchType == 'Products' || $stateParams.SearchType == 'BuildOrder'){
			$state.go('checkout', {ID:$stateParams.ID}, {reload:true});
		}
	}
	console.log(vm.order);
	vm.grouping = function(data){
		var totalCost = 0;
		vm.AvoidMultipleDelryChrgs = [];
		BuildOrderService.OrderOnHoldRemove(data, vm.order.ID).then(function(dt){
			console.log("Order OnHold Removed....");
		});
		data = _.groupBy(data, function(value){
			if(value.ShippingAddress != null){
				totalCost += value.xp.TotalCost;
				value.xp.deliveryCharges = 0;
				angular.forEach(value.xp.deliveryFeesDtls, function(val, key){
					value.xp.deliveryCharges += parseFloat(val);
				});
				value.ShippingAddress.deliveryDate = value.xp.deliveryDate;
				value.ShippingAddress.lineID = value.ID;
				value.ShippingAddress.DeliveryMethod = value.xp.DeliveryMethod;
				value.xp.ProductImageUrl = $sce.trustAsResourceUrl(value.xp.ProductImageUrl);
				if(value.xp.deliveryFeesDtls)
					value.ShippingAddress.deliveryPresent = true;
				vm.AvoidMultipleDelryChrgs.push(value.ShippingAddress);
				return value.ShippingAddress.FirstName + ' ' + value.ShippingAddress.LastName + ' ' + value.ShippingAddress.Zip + ' ' + (value.ShippingAddress.Street1).split(/(\d+)/g)[1] + ' ' + value.xp.DeliveryMethod + ' ' + value.xp.deliveryDate;
			}
		});
		//angular.element(document.getElementById("order-checkout")).scope().orderTotal = totalCost;
		delete data.undefined;
		$scope.lineVal = [];
		$scope.lineTotal = {};
		vm.TotalCost = {};
		vm.TotalTax = {};
		for(var n in data){
			$scope.lineVal.push(n);
			$scope.lineTotal[n] = _.reduce(_.pluck(data[n], 'LineTotal'), function(memo, num){ return memo + num; }, 0);
			vm.TotalCost[n] = 0;
			vm.TotalTax[n] = 0;
			var totalcost = 0;
			_.each(data[n], function(val,index){
				vm.TotalCost[n] += val.xp.deliveryCharges+val.xp.Tax+val.LineTotal;
				vm.TotalTax[n] += parseFloat(val.xp.Tax);
				if(val.xp.deliveryFeesDtls){
					data[n] = _.reject(data[n], val);
					data[n].unshift(val);
				}
			});
			data[n][0].TotalCost = vm.TotalCost[n];
			data[n][0].TotalTax = vm.TotalTax[n];
		}
		vm.groups = _.toArray(data);
	};
	vm.orderSummaryShow = function(order){
		if(vm.order){
			console.log(vm.order);
			vm.OrderSummaryLoader = OrderCloud.As().LineItems.List(vm.order.ID).then(function(res){
				vm.OrderSummaryLoader = LineItemHelpers.GetProductInfo(res.Items).then(function(data){
					vm.grouping(data);
				});
				BuildOrderService.PatchOrder(vm.order.ID, res).then(function(data){
					angular.element(document.getElementById("order-checkout")).scope().orderTotal = data.Total;
				});
			});
		}
	};
	vm.orderSummaryShow();
    vm.deleteProduct = function(lineitem) {
		vm.OrderSummaryLoader = OrderCloud.As().LineItems.Delete(vm.order.ID, lineitem.ID).then(function() {
			vm.orderSummaryShow();
		}).catch(function(ex) {
			$exceptionHandler(ex);
		});
    };
	var deliveryCharges;
	BuildOrderService.GetBuyerDtls().then(function(res){
		deliveryCharges = res.xp.ZipCodes;
	});
	
	vm.lineDtlsSubmit = function(recipient, index){
		var line = recipient[index];
		OrderCloud.Products.Patch(line.Product.ID, {"xp":{"productNote":line.Product.xp.productNote}}).then(function(){
			
		});
		if(this.visible == true)
			delete line.xp.CardMessage;
		var deliverySum = 0;
		angular.forEach(line.xp.deliveryFeesDtls, function(val, key){
			deliverySum += parseFloat(val);
		});
		delete line.xp.Discount;
		if(deliverySum > 250){
			line.xp.Discount = deliverySum - 250;
			deliverySum = 250;
		}
		if(line.xp.Tax)
			line.xp.TotalCost = deliverySum+(parseFloat(line.Quantity)*parseFloat(line.UnitPrice))+line.xp.Tax;
		/*if(line.xp.addressType=="Residence" || !line.xp.addressType || line.xp.addressType=="Business"){
			delete line.xp.PatientFName;
			delete line.xp.PatientLName;
			delete line.xp.pickupDate;
		}else if(line.xp.addressType=="Hospital" || line.xp.addressType=="School" || line.xp.addressType=="Church" || line.xp.addressType=="Funeral"){
			delete line.xp.pickupDate;
			line.xp.SearchedName = line.hosSearch;
			if(line.xp.addressType=="Funeral" || line.xp.addressType=="Church")
				line.xp.SearchedName = line.churchSearch;
			if(line.xp.addressType=="School")
				line.xp.SearchedName = line.schSearch;
		}
		if(line.xp.addressType=="InStorePickUp"){
			delete line.xp.PatientFName;
			delete line.xp.PatientLName;
			delete line.xp.deliveryDate;
			line.xp.storeName = line.willSearch;
		}*/
		line.ShipFromAddressID = "testShipFrom";
        vm.OrderSummaryLoader = AddressValidationService.Validate(line.ShippingAddress)
            .then(function(response){
                if(response.ResponseBody.ResultCode == 'Success') {
                    var validatedAddress = response.ResponseBody.Address;
                    var zip = validatedAddress.PostalCode.substring(0, 5);
                    /*vm.groups[index][0].ShippingAddress.Zip = parseInt(zip);
                    vm.groups[index][0].ShippingAddress.Street1 = validatedAddress.Line1;
                    vm.groups[index][0].ShippingAddress.Street2 = null;
                    vm.groups[index][0].ShippingAddress.City = validatedAddress.City;
                    vm.groups[index][0].ShippingAddress.State = validatedAddress.Region;*/
                    line.ShippingAddress.Zip = parseInt(zip);
                    line.ShippingAddress.Street1 = validatedAddress.Line1;
                    line.ShippingAddress.Street2 = null;
                    line.ShippingAddress.City = validatedAddress.City;
                    line.ShippingAddress.State = validatedAddress.Region;
					line.ShippingAddress.Country = validatedAddress.Country;
                }
                vm.OrderSummaryLoader = OrderCloud.As().LineItems.Update(vm.order.ID, line.ID, line)
                    .then(function(){
                        vm.OrderSummaryLoader = OrderCloud.As().LineItems.SetShippingAddress(vm.order.ID, line.ID, line.ShippingAddress)
                            .then(function(){
                                if((recipient.length)-1 > index){
                                    vm.lineDtlsSubmit(recipient, index+1);
                                }else{
                                    vm.orderSummaryShow();
                                }
                        });
                });
        });
	};

	vm.GetDeliveryChrgs = function(line, DeliveryMethod, dt){
		var d = $q.defer();
		if(dt){
			BuildOrderService.GetPreceedingZeroDate(dt).then(function(res){
				BuildOrderService.CompareDate(res).then(function(data){
					vm.DeliveryMethodChrgs(line, DeliveryMethod, data, d);
				});
			});
		}else{
			vm.DeliveryMethodChrgs(line, DeliveryMethod, "undefined", d);
		}
		return d.promise;
	}
	vm.DeliveryMethodChrgs = function(line, DeliveryMethod, data, d){
		BuildOrderService.GetDeliveryOptions(line, DeliveryMethod).then(function(res){
			var obj = {};
			if(res['UPS'] && !res['LocalDelivery'] && !res['Mixed'] && !res['InStorePickUp'] && !res['USPS'] && !res['DirectShip'] && !res['Courier']){
				DeliveryMethod = "UPS";
			}
			if(data != "1" && DeliveryMethod == "LocalDelivery"){
				delete res.LocalDelivery.SameDayDelivery;
			}
			angular.forEach(res[DeliveryMethod], function(val, key){
				obj[key] = val;
			}, true);
			line.xp.deliveryFeesDtls = obj;
			if(!line.xp.DeliveryMethod)
				line.xp.DeliveryMethod = DeliveryMethod;
			line.xp.TotalCost = 0;
			line.xp.deliveryCharges = 0;
			angular.forEach(line.xp.deliveryFeesDtls, function(val, key){
				line.xp.TotalCost += parseFloat(val);
				line.xp.deliveryCharges += parseFloat(val);
			});
			//delete line.xp.Discount;
			if(line.xp.TotalCost > 250){
				line.xp.Discount = line.xp.TotalCost - 250;
				line.xp.TotalCost = 250;
			}	
			line.xp.TotalCost = line.xp.TotalCost + (line.Quantity * line.UnitPrice);
			d.resolve("1");
		});
	}
	
	vm.getDeliveryCharges = function(array, index){
		var line = array[index];
		line.ShippingAddress = array[0].ShippingAddress;
		vm.NoDeliveryFees = false;
		angular.forEach(vm.AvoidMultipleDelryChrgs, function(val, key){
			val.deliveryDate = new Date(val.deliveryDate);
			line.xp.deliveryDate = new Date(line.xp.deliveryDate);
			var dt1 = (("0" + (val.deliveryDate.getMonth()+1)).slice(-2))+"-"+(("0" + val.deliveryDate.getDate()).slice(-2))+"-"+val.deliveryDate.getFullYear();
			var dt2 = (("0" + (line.xp.deliveryDate.getMonth()+1)).slice(-2))+"-"+(("0" + line.xp.deliveryDate.getDate()).slice(-2))+"-"+line.xp.deliveryDate.getFullYear();
			if(dt1 == dt2 && val.Zip == line.ShippingAddress.Zip && (val.Street1).split(/(\d+)/g)[1] == (line.ShippingAddress.Street1).split(/(\d+)/g)[1] && val.deliveryPresent && val.lineID != line.ID && val.DeliveryMethod == line.xp.DeliveryMethod){
				vm.NoDeliveryFees = true;
			}
		}, true);
		var deliverySum = 0, DeliveryMethod, dt;
		delete line.xp.Discount;
		if(deliverySum > 250){
			line.xp.Discount = deliverySum - 250;
			deliverySum = 250;
		}
		if(line.xp.addressType == "InStorePickUp"){
			DeliveryMethod = "InStorePickUp";
			dt = undefined;
			delete line.xp.deliveryFeesDtls;
		}else{
			if(line.xp.DeliveryMethod == "DirectShip"){
				DeliveryMethod = "DirectShip";
			}
		}
		AddressValidationService.Validate(line.ShippingAddress).then(function(res){
			if(res.ResponseBody.ResultCode == 'Success') {
				var validatedAddress = res.ResponseBody.Address;
				var zip = validatedAddress.PostalCode.substring(0, 5);
				line.ShippingAddress.Zip = parseInt(zip);
				line.ShippingAddress.Street1 = validatedAddress.Line1;
				line.ShippingAddress.Street2 = null;
				line.ShippingAddress.City = validatedAddress.City;
				line.ShippingAddress.State = validatedAddress.Region;
				line.ShippingAddress.Country = validatedAddress.Country;
				if(line.ShippingAddress.City == "Minneapolis" || line.ShippingAddress.City == "Saint Paul"){
					DeliveryMethod = "LocalDelivery";
					dt = line.xp.deliveryDate;
				}else{
					DeliveryMethod = "UPS";
					dt = undefined;
					if(DeliveryMethod=="UPS" && line.xp.DeliveryMethod=="Mixed")
						console.log("Don't delete deliveryFeesDtls");
					else
						delete line.xp.deliveryFeesDtls;
				}
				if(line.xp.DeliveryMethod == "DirectShip" && DeliveryMethod != "UPS"){
					DeliveryMethod = "DirectShip";
					dt = line.xp.deliveryDate;
				}
				if(line.xp.DeliveryMethod == "Mixed"){
					DeliveryMethod = "Mixed";
					dt = line.xp.deliveryDate;
				}
				if(line.ShippingAddress.City != "Minneapolis" && line.ShippingAddress.City != "Saint Paul"){
					DeliveryMethod = "UPS";
					dt = undefined;
					if(DeliveryMethod=="UPS" && line.xp.DeliveryMethod=="Mixed")
						console.log("Don't delete deliveryFeesDtls");
					else
						delete line.xp.deliveryFeesDtls;
				}
				if(line.xp.DeliveryMethod == "Courier"){
					DeliveryMethod = "Courier";
					dt = line.xp.deliveryDate;
				}
				if(line.xp.DeliveryMethod == "USPS"){
					DeliveryMethod = "USPS";
					dt = line.xp.deliveryDate;
				}
				if(line.xp.addressType == "InStorePickUp"){
					DeliveryMethod = "InStorePickUp";
					dt = undefined;
					delete line.xp.deliveryFeesDtls;
				}
				if(DeliveryMethod=="UPS" && line.xp.DeliveryMethod=="Mixed" ){
					alert("Faster Delivery Is Only Local Delivery...!");
				}else{
					vm.GetDeliveryChrgs(line, DeliveryMethod, dt).then(function(){
						angular.forEach(line.xp.deliveryFeesDtls, function(val, key){
							deliverySum += parseFloat(val);
						});
						line.xp.TotalCost = parseFloat(line.Quantity)*parseFloat(line.UnitPrice)+line.xp.Tax;
						if(vm.NoDeliveryFees == true){
							delete line.xp.deliveryFeesDtls;
							line.xp.deliveryCharges = 0;
							line.xp.TotalCost = parseFloat(line.Quantity)*parseFloat(line.UnitPrice);
						}else{
							line.xp.TotalCost = line.xp.TotalCost+deliverySum;
						}
						if(_.isEmpty(line.xp.deliveryFeesDtls))
							delete line.xp.deliveryFeesDtls;
						var arr = [];
						angular.forEach(vm.groups, function(val){
							arr = _.union(arr, val);
						}, true);
						if((array.length)-1 > index)
							vm.getDeliveryCharges(array, index+1);
						else
							vm.grouping(arr);
					});
				}
			}else{
				alert("Address not found...!");
			}
		});
	};	
	vm.EditSaveCharges = function(array){
		var line = array[0];
		line.EditCharges = !line.EditCharges;
		if(!line.EditCharges)
			vm.lineDtlsSubmit(array, 0);
	}
	//}
}

function BuildOrderService( $q, $window, $stateParams, ocscope, buyerid, OrderCloud, $http, alfrescoOmsUrl, alfrescoURL, Underscore, $cookieStore, GetCstTime) {
    var upselldata = [];
    var crossdata = [];
    var productdetail = [];
    var optionvalues = [];
    var productID;
    var service = {
		GetProductDetails: _getProductDetails,
		GetUpsellDetails: _getUpsellDetails,
		GetCrossDetails: _getCrossDetails,
		GetProductID: _getProductID,
		GetSpendingAccount: _getSpendingAccount,
		GetPhoneNumber: _GetPhoneNumber,
		GetDeliveryOptions: _GetDeliveryOptions,
		GetBuyerDtls: _GetBuyerDtls,
		CompareDate: _CompareDate,
		GetPreceedingZeroDate: _GetPreceedingZeroDate,
		GetHosChurchFuneral: _GetHosChurchFuneral,
		GetStores: _GetStores,
		OrderOnHoldRemove: _OrderOnHoldRemove,
		PatchOrder: _PatchOrder,
		GetProductImages: _getProductImages,
		GetProductList:_getProductList,
		GetSeqProd:_getSeqProd,
		GetExtras:_getExtras,
		AdminLogin: _adminLogin,
		GetAttributeImages:_getAttributeImages
    }
    function _adminLogin(){
    	var data = $.param({
            grant_type: 'client_credentials',
            scope: ocscope,
            client_id: '8836BE8D-710A-4D2D-98BF-EDBE7227E3BB'

        });
        var defferred = $q.defer();
        $http({
                method: 'POST',
                dataType:"json",
                url:  "https://auth.ordercloud.io/oauth/token",
                data: data,
                headers: {
                    'Content-Type': 'application/json'
                }

            }).success(function (data, status, headers, config) {
				//return data.access_token;
				//OrderCloud.Auth.SetToken(data.access_token);
				OrderCloud.Auth.SetImpersonationToken(data.access_token);
                defferred.resolve(data);
            }).error(function (data, status, headers, config) {
                defferred.reject(data);
            });
            return defferred.promise;
    }
	function _getProductDetails(data) {
		var deferred = $q.defer();
		OrderCloud.Products.Get(data).then(function(list) {
			console.log('pdp',list);
			productdetail = list;
			if(productdetail.Type == "VariableText"){
				OrderCloud.Specs.ListProductAssignments(null, list.ID).then(function(data){
					productdetail.specID = data.Items[0].SpecID;
					OrderCloud.Specs.ListOptions(data.Items[0].SpecID).then(function(res){
						productdetail.listOptions = res.Items;
						var size = data.Items[0].SpecID.split('_');
						var len = size.length,obj2 = {}, options = [];
						var  w = [];
						for (var i=0;i<len;i++){
							w[size[i+1]] = [];
						}
						var filt = _.filter(res.Items, function(row,index){
							_.each(row.Value.split('_'), function(val,index){
								w[size[index+1]].push(val);
							});
						}); 
						for (var i=1;i<len;i++){
							var obj = {};
							obj.Type = size[i];
							obj.Option = _.uniq(w[size[i]]);
							options.push(obj);
						}
						productdetail.options = options;
						console.log(JSON.stringify(productdetail));
						productdetail.varientsOption = options[0].Option[0]+"_"+options[1].Option[0];
						var filt = _.findWhere(productdetail.listOptions, {ID: productdetail.varientsOption});
						productdetail.prodPrice = filt.PriceMarkup;
						deferred.resolve(productdetail);
					});
				});
			}
		});
		return deferred.promise;
	}
	
    function _getProductID(ID) {
		productID = ID;
		console.log(productID);
		return productID;
    }
	
    function _getSpendingAccount(data) {
		var deferred = $q.defer();
		OrderCloud.SpendingAccounts.ListAssignments(null, data).then(function(list) {
			deferred.resolve(list);
		});
		return deferred.promise;
    }

    function _getUpsellDetails(prodID) {
		var deferred = $q.defer();
		OrderCloud.Products.Get(prodID).then(function(data) {
			var upsellproddata = [];
			angular.forEach(data.xp.Upsell, function(cat1, key1){
				for(var i = 0;i< Object.keys(cat1).length;i++){
					var catQue = [];
					catQue.push((function () {
						var d = $q.defer();
						OrderCloud.Categories.Get(Object.keys(cat1)).then(function(catdata){
							d.resolve(catdata);
						})
						return d.promise;
					})());
					$q.all(catQue).then(function(res){
						//alert(JSON.stringify(res));
					});
				}
			})
			deferred.resolve(upsellproddata);
		});
		return deferred.promise;
    }

    function _getCrossDetails(prodID){
		var deferred = $q.defer();
		OrderCloud.Products.Get(prodID).then(function(data){
			var crossdata = [];
			angular.forEach(data.xp.Cross, function(cat1, key1){
				OrderCloud.Products.Get(cat1).then(function(data){
					crossdata.push(data);
				})
			})
			deferred.resolve(crossdata);
		});
		return deferred.promise;
    }
	
	function _GetPhoneNumber(phn){
		var d = $q.defer();
		var arr = [];
		var init = phn.indexOf('(');
		var fin = phn.indexOf(')');
		arr.push(parseInt(phn.substr(init+1,fin-init-1)));
		init = phn.indexOf(')');
		fin = phn.indexOf('-');
		arr.push(parseInt(phn.substr(init+1,fin-init-1)));
		init = phn.indexOf('-');
		arr.push(parseInt(phn.substr(init+1,phn.length)));
		d.resolve(arr);
		return d.promise;
	}
	
	function _GetDeliveryOptions(line, DeliveryMethod){
		var d = $q.defer();
		OrderCloud.Categories.ListProductAssignments(null, line.ProductID).then(function(res1){
			OrderCloud.Categories.Get(res1.Items[0].CategoryID).then(function(res2){
				var key = {},MinDate = {};
				line.xp.NoInStorePickUp = true;
				if(res2.xp.DeliveryChargesCatWise.DeliveryMethods['InStorePickUp']){
					line.xp.NoInStorePickUp = false;
				}
				_.each(res2.xp.DeliveryChargesCatWise.DeliveryMethods, function (v, k) {
					if (v.MinDays){
						MinDate[k] = v.MinDays;
						key['MinDate'] = MinDate;
					}
					if(k=="UPS" && v['Boolean']==true){
						key[k]={};
					}
					if(k=="USPS" && v['Boolean']==true){
						key[k]={};
					}
					if(k=="InStorePickUp"){
						key[k]={};
					}
					_.each(v, function(v1, k1){
						var obj = {};
						if(v1['Boolean'] == true){
							if(k == "Mixed" && line.Quantity < 50){
								
							}else{
								obj[k1]=v1['Value'];
								key[k] = obj;
							}
						}
					});
				});
				if(key['UPS'] && !key['LocalDelivery'] && !key['Mixed'] && !key['InStorePickUp'] && !key['USPS'] && !key['DirectShip'] && !key['Courier']){
					DeliveryMethod = "UPS";
				}
				if(!key['UPS'] && !key['LocalDelivery'] && !key['Mixed'] && key['InStorePickUp'] && !key['USPS'] && !key['DirectShip'] && !key['Courier']){
					line.xp.NoDeliveryExInStore = true;
					line.xp.addressType = "InStorePickUp";
				}
				delete line.xp.Status;
				if(DeliveryMethod=="UPS" && !key['UPS'])
					line.xp.Status = "OnHold";
				_GetBuyerDtls().then(function(dt){
					if(DeliveryMethod == "LocalDelivery"){
						if(!key.LocalDelivery)
							key.LocalDelivery = {};
						key.LocalDelivery.StandardDelivery = dt.xp.Shippers.LocalDelivery.StandardDelivery;
						key.LocalDelivery.SameDayDelivery = dt.xp.Shippers.LocalDelivery.SameDayDelivery;
					}else if(DeliveryMethod == "InStorePickUp"){
						//key.InStorePickUp = dt.xp.Shippers.InStorePickUp;
						//d.resolve(key);
					}else if(DeliveryMethod == "UPS"){
						//key.UPS = {};
						if(key.UPS)
							key.UPS.UPSCharges = dt.xp.Shippers.UPS.UPSCharges;
					}else if(DeliveryMethod == "DirectShip"){
						key.DirectShip.StandardDelivery = dt.xp.Shippers.DirectShip.StandardDelivery;
					}else if(DeliveryMethod == "Mixed"){
						if(!key.Mixed)
							key['Mixed'] = {};
						key.Mixed.StandardDelivery = dt.xp.Shippers.Mixed.StandardDelivery;
					}else if(DeliveryMethod == "USPS"){
						key.USPS = {};
						key.USPS.USPSCharges = dt.xp.Shippers.USPS.USPSCharges;
					}else if(DeliveryMethod == "Courier"){
						key.Courier = {};
						key.Courier.CourierCharges = dt.xp.Shippers.Courier.OMS;
					}
					d.resolve(key);
				});
			});
		});
		return d.promise;
	}
	function _GetBuyerDtls(){
		var d = $q.defer();
		OrderCloud.Buyers.Get().then(function(res){
			d.resolve(res);
		});
		return d.promise;
	}
	function _CompareDate(endDate){
		var d = $q.defer();
		/*$.ajax({
			method:"GET",
			dataType:"json",
			contentType: "application/json",
			url:GetCstTime
		}).success(function(res){
			if(endDate == res.date)
				d.resolve("1");
			else
				d.resolve(res);
		}).error(function(err){
			console.log("err"+err);
		});*/
		d.resolve("1");
		return d.promise;
	}
	function _GetPreceedingZeroDate(dt){
		var d = $q.defer(), date;
		dt = new Date(dt);
		dt = (("0" + (dt.getMonth()+1)).slice(-2))+"-"+(("0" + dt.getDate()).slice(-2))+"-"+dt.getFullYear();
		d.resolve(dt);
		return d.promise;
	}
	function _GetHosChurchFuneral(type){
		var d = $q.defer();
		OrderCloud.Addresses.List(null,null,null,null,null,{"ID":type+"-*"}).then(function(res){
			var dtls = _.pluck(res.Items, 'CompanyName');
			d.resolve({"data": {"Names": dtls, "List": res.Items}});
		});
		return d.promise;
	}
	function _GetStores(){
		var d = $q.defer();
		OrderCloud.Addresses.List(null, 1, 100, null, null, {"ID":"Store-*"}).then(function(res){
			d.resolve(res.Items);
		});
		/*$http.get('https://api.myjson.com/bins/4wsk2').then(function(res){
			d.resolve(res);
		});*/
		return d.promise;
	}
	function _OrderOnHoldRemove(data, ID){
		var d = $q.defer(), OrderOnHold = _.pluck(data, 'xp');
		OrderOnHold = _.pluck(OrderOnHold, 'Status');
		if(OrderOnHold.indexOf("OnHold") == -1){
			if($stateParams.SearchType == 'Products' || $stateParams.SearchType == 'BuildOrder'){
				OrderCloud.Orders.Patch(ID, {"xp": {"Status": "","CSRID":$cookieStore.get('OMS.CSRID')}}).then(function(res){
					d.resolve(res);
				});
			}
			else{
				OrderCloud.As().Orders.Patch(ID, {"xp": {"Status": "","CSRID":$cookieStore.get('OMS.CSRID')}}).then(function(res){
					d.resolve(res);
				});
			}
		}else{
			d.resolve();
		}
		return d.promise;
	}
	function _PatchOrder(orderID, data){
		var d = $q.defer(), delChrgs = 0;
		angular.forEach(data.Items, function(val, key){
			angular.forEach(val.xp.deliveryFeesDtls, function(val1, key1){
				delChrgs += parseFloat(val1);
			},true);
		},true);
		if($stateParams.SearchType == 'Products' || $stateParams.SearchType == 'BuildOrder'){
			OrderCloud.Orders.Patch(orderID, {ShippingCost: delChrgs}).then(function(res){
				d.resolve(res);
			});
		}
		else{
			OrderCloud.As().Orders.Patch(orderID, {ShippingCost: delChrgs}).then(function(res){
				d.resolve(res);
			});
		}
		return d.promise;
	}
	function _getProductImages(ticket) {
        var d = $q.defer();
		//console.log("ticket" + ticket + "alfrescoOmsUrl:" + alfrescoOmsUrl );
        $http({
            method: 'GET',
            dataType: "json",
            url: alfrescoOmsUrl + "Media/Products?alf_ticket=" + ticket,
            headers: {
                'Content-Type': 'application/json'
            }
        }).success(function (data, status, headers, config) {
            d.resolve(data);
			//console.log("alfresco successssss");
        }).error(function (data, status, headers, config) {
			//console.log("alfresco error");
            d.reject(data);
        });
        return d.promise;
    }
	function _getAttributeImages(ticket) {
        var d = $q.defer();
		//console.log("ticket" + ticket + "alfrescoOmsUrl:" + alfrescoOmsUrl );
        $http({
            method: 'GET',
            dataType: "json",
            url: alfrescoOmsUrl + "Attributes?alf_ticket=" + ticket,
            headers: {
                'Content-Type': 'application/json'
            }
        }).success(function (data, status, headers, config) {
            d.resolve(data);
			//console.log("alfresco successssss");
        }).error(function (data, status, headers, config) {
			//console.log("alfresco error");
            d.reject(data);
        });
        return d.promise;
    }
	function _getProductList(res, productImages){
		var d = $q.defer(), ticket = localStorage.getItem("alf_ticket"), data, imgUrl;      
		data = Underscore.filter(res, function(row){
			imgUrl = Underscore.filter(productImages, function(row1){
				return row1.title.indexOf(row.ID) != -1;
			});
			// console.log("alternative", alternative);
			if(imgUrl.length > 0){
				var podID=row.ID, baseImage;
				podID=podID.toString();
				//var baseImage = Underscore.where(imgUrl, {title: row.ID});
				Underscore.filter(imgUrl, function(row1){
					if(row1.title.indexOf(podID) != -1)
					{
						row.baseImage = alfrescoURL + row1.contentUrl + "?alf_ticket=" + ticket;
					}
				});
				// if(baseImage.length > 0){
					// row.baseImage = alfrescoURL + baseImage[0].contentUrl + "?alf_ticket=" + ticket;
				// }
				//console.log("row.baseImage", row.baseImage);
				row.alternativeImg = [];
				angular.forEach(imgUrl, function(value, key) {
					row.alternativeImg.push(alfrescoURL + value.contentUrl + "?alf_ticket=" + ticket);
					//console.log("row.alternativeImg", row.alternativeImg);
				});
				return row.alternativeImg;
				//return row.alternativeImg=alfrescoURL + imgUrl[0].contentUrl + "?alf_ticket=" + ticket;
			}else
				return row;
		});
		d.resolve(data);
		return d.promise;
	}
	function _getSeqProd(sequence) {
		var vs = this, d = $q.defer(), arr = [];
		vs.listAllProducts = function(){
			angular.forEach(sequence, function(seqId, key){
				arr.push(OrderCloud.As().Me.ListProducts(null, 1, 100, null, null, {"xp.ProductCode":seqId}));
			},true);
			$q.all(arr).then(function(result){
				arr = [];
				angular.forEach(result, function(res){
					arr = _.union(arr, res.Items);
				},true);
				d.resolve(arr);
			});
		};
		if($stateParams.SearchType != 'Products' && $stateParams.SearchType != 'BuildOrder' && $stateParams.SearchType!=undefined && $stateParams.SearchType!='Workshop'){
				vs.listAllProducts();
		}else{
			OrderCloud.Users.GetAccessToken('gby8nYybikCZhjMcwVPAiQ', impersonation)
			.then(function(data) {
				OrderCloud.Auth.SetImpersonationToken(data['access_token']);
				vs.listAllProducts();
			});
		}
		return d.promise;
	}
	function _getExtras() {
		var data = {
			"Balloons": [
				{
					"Skuid": "bal_1",
					"Title": "Balloon Orange",
					"Price": "$4.99",
					"CategoryName": "Balloons"
				},
				{
					"Skuid": "bal_2",
					"Title": "Balloon Red",
					"Price": "$5.99",
					"CategoryName": "Balloons"
				},
				{
					"Skuid": "bal_3",
					"Title": "Balloon Blue",
					"Price": "$6.99",
					"CategoryName": "Balloons"
				},
				{
					"Skuid": "bal_4",
					"Title": "Balloon Pink",
					"Price": "$7.99",
					"CategoryName": "Balloons"
				}
			],
			"Plush": [
				{
					"Skuid": "plush_1",
					"Title": "Flora Frog 12'",
					"Price": "$5.99",
					"CategoryName": "Plush"
				},
				{
					"Skuid": "plush_2",
					"Title": " Stuffed Animal- FTD",
					"Price": "$5.99",
					"CategoryName": "Plush"
				},
				{
					"Skuid": "plush_3",
					"Title": " Baabsy Lamb",
					"Price": "$5.99",
					"CategoryName": "Plush"
				},
				{
					"Skuid": "plush_4",
					"Title": " Lin Lin Panda",
					"Price": "$5.99",
					"CategoryName": "Plush"
				}
			],
			"Sweets": [
				{
					"Skuid": "sweet_1",
					"Title": " Chocolate Stars",
					"Price": "$4.99",
					"CategoryName": "Sweets"
				},
				{
					"Skuid": "sweet_2",
					"Title": "Bittersweet chocolate",
					"Price": "$4.99",
					"CategoryName": "Sweets"
				},
				{
					"Skuid": "sweet_3",
					"Title": "Milk chocolate",
					"Price": "$4.99",
					"CategoryName": "Sweets"
				},
				{
					"Skuid": "sweet_4",
					"Title": "Chocolate Daisies",
					"Price": "$4.99",
					"CategoryName": "Sweets"
				}
			]
		}
		return data;
	}
    return service;
}