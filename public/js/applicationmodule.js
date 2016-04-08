//var app = angular.module('myapp',[]);

// JavaScript File

var app = angular.module('myapp',['ngRoute']);

app.config(function($routeProvider){
$routeProvider

    .when("/posting",
    { 
      templateUrl: "views/posting.html",
      controller: 'DropdownController'
      
    })
    .when("/specificposting",
    {
        templateUrl: "views/specificposting.html",
        controller: 'DropdownController'
        
    })
    .when("/posttracking",
    {
      templateUrl: "views/posttracking.html",
      controller: 'DropdownController'
    })
    .otherwise({ redirectTo: '/' });
});

