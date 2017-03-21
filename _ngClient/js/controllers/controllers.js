var appControllers = angular.module('appControllers', []);
 

  appControllers.controller('PlaceboCtrl', ['$rootScope','$scope'  ,
        function($rootScope,$scope) {
      // a global controller in case needed
          console.log("PlaceboCtrl"); 

      		$rootScope.recaptchaCodeAvailable = false;			
 
 		}]); // PlaceboCtrl
 
appControllers.controller('HomeCtrl', ['$scope' ,
		function($scope) {
			
			$scope.name= "AngularNode101";
	 
		}]); // HomeCtrl
	
 


    
   






appControllers.controller('AboutCtrl', [  '$scope', '$resource', '$http',  '$q', 'nrzLightify',
    function( $scope, $resource,  $http, $q, nrzLightify) {
      $scope.filterData = {};
        
        $scope.payForOrder = function() // load many
		{ // add test data
		    $scope.asynchWait = true;		
			$http.delete('/api/v1/deleteorders', {}).then(function success (response) {  	
			                    // var result = {'errorFlag' : errorFlag , 'insertCount' : insertCount};
								displayOrders({});
								$scope.asynchWait = false;
								nrzLightify({ type: 'success', text: 'Your order is on the way to you sir'  }, 3000);
							}, function errorCallback(error) {
								$scope.asynchWait = false;
                               nrzLightify({ type: 'danger', text: 'there was a problem with processsing the order'  }, 3000);						 						 
						}); 			 
		}
      
      $scope.loadOrders = function() // load many
		{ // add test data
		    $scope.asynchWait = true;
			$http.post('/api/v1/loadorders', {}).then(function success (response) {  	
			                    // var result = {'errorFlag' : errorFlag , 'insertCount' : insertCount};
								displayOrders({});
								$scope.asynchWait = false;
								nrzLightify({ type: 'success', text: 'orders loaded'  }, 3000);
							}, function errorCallback(error) {
								$scope.asynchWait = false;
                               nrzLightify({ type: 'danger', text: 'orders load error'  }, 3000);						 						 
						}); 
          
          
		}
      
      function getOrders()
      {
          return $http.post('/api/v1/orders', $scope.filterData);
      }
      var aPromise;
      
      function displayOrders(filters)
      {
          aPromise = getOrders(filters);
          aPromise.then(function(response)
                       {
              $scope.orders = response.data;
              
          },
            function error(error) {
              $scope.orders = [];
              
          } );
      }
      
      displayOrders({});
  
  }]); // AboutCtrl		
	
	
appControllers.controller('FoodItemsOnMenuCtrol', [  '$scope', '$resource', '$http',  '$q', 'nrzLightify',
    function( $scope, $resource,  $http, $q, nrzLightify) {
		
		var correctIndex; // ng-repeat orderBy order different to the underlying source array
		var editMode;		
		
		$scope.editingFoodItemOnMenu = false;		
		$scope.asynchWait = false;
		$scope.filterData = {};
		$scope.newFoodItemOnMenuRaw = {"json" : ""};
		$scope.editId = null;
        $scope.orderItemRaw = {json: ""};
				 
		$scope.requeryFoodItemsOnMenu = function(filters)
		{	 
			displayFoodItemsOnMenu(filters);
		}

		$scope.reset = function()
		{
			$scope.filterData = {};
			displayFoodItemsOnMenu({});
		}
	
		$scope.deleteFoodItemsOnMenu = function(index,id, FoodItemOnMenu)
		{
			correctIndex =   $scope.FoodItemsOnMenu.indexOf(FoodItemOnMenu);
			$http.delete('/api/v1/FoodItemOnMenu/'+ id).then(function success (response) {  	
			                    $scope.FoodItemsOnMenu.splice(correctIndex, 1);
								nrzLightify({ type: 'success', text: 'FoodItemOnMenu deleted'  }, 3000);	
							}, function errorCallback(error) {
                               	nrzLightify({ type: 'danger', text: 'FoodItemOnMenu deletion error'  }, 3000);				 						 
						}); 				
		}
        
        $scope.add2Order = function(index,id,food)
		{
            console.log(food);
                $http.put('/api/v1/orderitem', food).then(function success (response) {  									
								$scope.orderItemRaw = {"json" : ""};										
								nrzLightify({ type: 'success', text: 'item inserted to Order'  }, 3000);	
							}, function errorCallback(error) {
                               nrzLightify({ type: 'danger', text: 'basket item insertion error'  }, 3000);							 						 
						}); 
           
		}
        
        
       
        
      $scope.loadOrders = function() // load many
		{ // add test data
		    $scope.asynchWait = true;
			$http.post('/api/v1/loadorders', {}).then(function success (response) {  	
			                    // var result = {'errorFlag' : errorFlag , 'insertCount' : insertCount};
								
								$scope.asynchWait = false;
								nrzLightify({ type: 'success', text: 'basket loaded'  }, 3000);
							}, function errorCallback(error) {
								$scope.asynchWait = false;
                               nrzLightify({ type: 'danger', text: 'basket load error'  }, 3000);						 						 
						}); 
          
          
		}
    
		$scope.insertFoodItemOnMenu2 = function() // v2
		{
			$http.put('/api/v1/FoodItemOnMenu', $scope.newFoodItemOnMenuRaw.json).then(function success (response) {  									
								$scope.newFoodItemOnMenuRaw = {"json" : ""};										
								nrzLightify({ type: 'success', text: 'FoodItemOnMenu inserted'  }, 3000);	
						
            }, function errorCallback(error) {
                               	nrzLightify({ type: 'danger', text: 'FoodItemOnMenu insertion error'  }, 3000);						 						 
						}); 		
		}	

		$scope.insertFoodItemOnMenu = function(newFoodItemOnMenu) // v1
		{
			$http.put('/api/v1/FoodItemOnMenu', newFoodItemOnMenu).then(function success (response) {  									
								$scope.newFoodItemOnMenuRaw = {"json" : ""};										
								nrzLightify({ type: 'success', text: 'FoodItemOnMenu inserted'  }, 3000);	
							}, function errorCallback(error) {
                               nrzLightify({ type: 'danger', text: 'FoodItemOnMenu insertion error'  }, 3000);							 						 
						}); 		
		}
		
		
		$scope.loadFoodItemOnMenu = function() // load many
		{ // add test data
		    $scope.asynchWait = true;
			$http.post('/api/v1/loadFoodItemsOnMenu', {}).then(function success (response) {  	
			                    // var result = {'errorFlag' : errorFlag , 'insertCount' : insertCount};
								displayFoodItemsOnMenu({});
								$scope.asynchWait = false;
								nrzLightify({ type: 'success', text: 'FoodItemOnMenu loaded'  }, 3000);
							}, function errorCallback(error) {
								$scope.asynchWait = false;
                               nrzLightify({ type: 'danger', text: 'FoodItemOnMenu load error'  }, 3000);						 						 
						}); 			 
		}	

		$scope.deleteFoodItemsOnMenu = function() // load many
		{ // add test data
		    $scope.asynchWait = true;		
			$http.delete('/api/v1/deleteFoodItemsOnMenu', {}).then(function success (response) {  	
			                    // var result = {'errorFlag' : errorFlag , 'insertCount' : insertCount};
								displayFoodItemsOnMenu({});
								$scope.asynchWait = false;
								nrzLightify({ type: 'success', text: 'FoodItemOnMenu deleted'  }, 3000);
							}, function errorCallback(error) {
								$scope.asynchWait = false;
                               nrzLightify({ type: 'danger', text: 'FoodItemOnMenu deletion error'  }, 3000);						 						 
						}); 			 
		}	 
		
		function getFoodItemsOnMenu()
		{
			/*
			// you would use this style if chaining i.e. return deferred and resolve/reject as late as possible
			var deferred = $q.defer();
			return $http.get('/api/v1/FoodItemsOnMenu', { })  // returns a promise 
						.then(function success (response) {  					
								deferred.resolve(response.data);
							}, function errorCallback(error) {
 
								deferred.reject(error);								 
						});	
			return deferred.promise;	
			*/
     
         return $http.post('/api/v1/FoodItemsOnMenu', $scope.filterData); 			
		}		
 		
		var aPromise;
		
		
		function displayFoodItemsOnMenu(filters)
		{ 		
			aPromise = getFoodItemsOnMenu(filters);
			
			aPromise.then(function(response) 
						  {
							$scope.FoodItemsOnMenu = response.data;
						  },
						  function error(error)
						  {
							  $scope.FoodItemsOnMenu = [];					  
						  });
		}
			
		$scope.getTemplate = function (FoodItemOnMenu) {
			//if (contact.id === $scope.model.selected.id) return 'edit';
			//else return 'display';
			return 'displayFoodItemsOnMenu';
		};		
		
		$scope.cancelFoodItemOnMenuEdit = function()
		{
			$scope.edittingFoodItemOnMenu = false;
		}
 		
		$scope.editFoodItemOnMenu = function(index,id,FoodItemOnMenu)
		{
			$scope.editTitle = "Edit FoodItemOnMenu";
			editMode = "existing";
			$scope.editingFoodItemOnMenu = true;
			correctIndex =   $scope.FoodItemsOnMenu.indexOf(FoodItemOnMenu);
			$scope.editData = angular.copy($scope.FoodItemsOnMenu[correctIndex]);
			$scope.editData.index = index + 1;
			$scope.editData._id = id;
		}	

		$scope.saveFoodItemOnMenu = function()
		{
			$scope.editingFoodItemOnMenu = false;
			
			if (editMode === "existing")
			{
			var dataToSave = angular.copy($scope.editData);
			delete dataToSave.index;
			$http.post('/api/v1/FoodItemOnMenu', dataToSave).then(function success (response) {  	
			                    $scope.FoodItemsOnMenu[correctIndex] = $scope.editData;
								$scope.asynchWait = false;
								nrzLightify({ type: 'success', text: 'FoodItemOnMenu saved'  }, 3000);
							}, function errorCallback(error) {
								$scope.asynchWait = false;
                               nrzLightify({ type: 'danger', text: 'FoodItemOnMenu save error'  }, 3000);					 						 
						}); 
            }		
            else
			{
				delete $scope.editData.index;
				$scope.insertFoodItemOnMenu($scope.editData); // put operation
			}				
		}		
		
		$scope.newFoodItemOnMenu = function()
		{
			$scope.editTitle = "New FoodItemOnMenu";
			editMode = "new";
			$scope.editingFoodItemOnMenu = true;
			correctIndex =   -1;
			$scope.editData = {};
			$scope.editData.index = -1;
			$scope.editData._id = null;			
		}
		
		displayFoodItemsOnMenu({}); // load the FoodItemOnMenu at the start
		nrzLightify({ type: 'success', text: 'FoodItemOnMenu loaded'  }, 6000);	
 
		}]); // FoodItemsOnMenuCtrol
 