/*************************************************************************** 
Description:Controller for Login/Authentication
***************************************************************************/ 
 app.controller('logincontroller',function($scope,$location,$http,$window,$rootScope)
 {
  
  //alert("logincontroller") ;
  $scope.message ='ECE9065b';
  $scope.loginStatus=false;
  $scope.showDropdown=false;
  $scope.authcode='';
  $scope.email='';
  $scope.name='';
  $scope.picture='';
  $rootScope.PostText = '';
  
  /* facebook variables */
  $scope.FB_CheckBoxState = false;
  $scope.FB_LoginState = false;
  $scope.FBToken = '';
  
  /* LinkedIn variables */
  $scope.LinkedIn_CheckBoxState = false;
  $scope.LinkedIn_LoginState = false;
  $scope.LinkedIn_Token = '';
  
  /* Twitter variables */
  $scope.Twitter_CheckBoxState = false;  

  /* FaceBook JDK for Login Initialization */
    window.fbAsyncInit = function() {
        FB.init({
          appId      : '1699813373601633',
          xfbml      : true,
          version    : 'v2.5'
        });
      };
    
    (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "//connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
    
  
  /* Google Login */  
  $scope.login = function()
  {
    $scope.authentication();
  }
  
  /* Google Authentication Logic */
  $scope.authentication = function ()
  {
    auth2.grantOfflineAccess({'redirect_uri': 'postmessage'}).then(function(resp) 
    {
     $scope.authcode = resp.code;
     console.log($scope.authcode);
     $http.get('/AccessCode',{params:{"code": $scope.authcode}})
        .success(function(response){
         $scope.loginStatus=true;
         console.log("data from server = " + response); 
         var data=JSON.parse(response); 
         
        console.log("Email = " + data.email);
        console.log("Name = " + data.name); 
        console.log("Given Name = " + data.given_name); 
        console.log("Family Name = " + data.family_name); 
        console.log("Picture link = " + data.picture);
        
        $scope.email=data.email;
        $scope.name=data.name;
        $scope.picture=data.picture;
        $location.path("/posting"); 
        });
    }); 
  };  
 
  /* Logout */  
  $scope.logout= function()
  {
      FB.getLoginStatus(function(ret) {
      console.log("authresponse = " + ret.authResponse + "status = " + ret.status)
      if(ret.authResponse) {
          FB.logout(function(response) {
          });
      }
      
      if (FB.getAccessToken() != null) {
          FB.logout(function(response) {
          });
      }
      
    });
    
    $scope.loginStatus=false;
    $scope.email='';
    $location.path('/');
    
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
      console.log('User signed out.');
    });
    
  }

  
  /* Facebook Login */
  $scope.Facebooklogin=function() {
      
      //alert ( "In Facebooklogin..." );

      //Offer to login only if not connected

        FB.login(function(response) {
      	// handle the response
      	console.log(response);
      	
      	if (response.authResponse) {
      		//alert ( "connected" );
      		
      		var access_token =   FB.getAuthResponse()['accessToken'];
          console.log('Access Token = '+ access_token);
          $scope.FBToken = access_token;
          
          $scope.FB_LoginState = true;
      	} 
      	else {
      		  alert ( "Not connected" );
      	 }
    	  }, {scope:'user_posts,public_profile,email,publish_actions'});        
      
  }
  
  //Facebook Logout
  $scope.Facebooklogout=function() {
    FB.getLoginStatus(function(ret) {
      console.log("authresponse = " + ret.authResponse + "status = " + ret.status)
      if(ret.authResponse) {
          FB.logout(function(response) {
          });
      }
      
      if (FB.getAccessToken() != null) {
          FB.logout(function(response) {
          });
      }
      
    });  
  }

  //LinkedIn Login
  $scope.LinkedInlogin=function() {
      
      console.log( "In LinkedInlogin..." );

       var client_id="77gkwg6n9s1mxl";
       var redirect_uri="https://hshrinkh-ece9065-finalproject-himans.c9users.io";
       var url="https://www.linkedin.com/uas/oauth2/authorization?response_type=code&client_id="+client_id+
       "&redirect_uri="+redirect_uri+"&state=STATE&scope=r_basicprofile,w_share,rw_company_admin";
       
       var linkedInWindow = window.open(url,"","resizable=yes,width=600,height=400,toolbar=no,titlebar=no,menubar=no,scrollbars=yes");
       var timer = setInterval(checkWindow2, 1000); 

  function checkWindow2() {

  try {
     var linkedin_url = linkedInWindow.location.href;
     
     console.log(linkedin_url);

      linkedInWindow.close();
      
      if(linkedin_url === undefined) {
        console.log("linkedin_url undefined");
        return false;
      }
          
      var urlArray = linkedin_url.split( '=' );
      console.log("1-> " + urlArray[1]);
      var linkedinCode=urlArray[1].split('&');
      console.log("2-> " +linkedinCode[0]);
      var linkedinCODE=linkedinCode[0];
            
      clearInterval(timer);
                   
      //Linken In Oauth 2 Login getting Access Token from server
      $http({
              method : "POST",
              url : '/api/linkedinLogin/',
              data: { code: linkedinCODE }
            }).then(function mySucces(response) {
                 
                console.log("Access Token = " + response.data);
                $scope.LinkedIn_Token=response.data;
                $scope.LinkedIn_LoginState = true;
                console.log("LinkedIn Login Complete");
      
              }, function myError(response) {
                 $scope.message = "Error";
            });
                   
     }catch(e){
         console.log(e);
     }
  } } 
  
  //Twitter Login
  $scope.Twitterlogin=function() {
      
      console.log( "Twitter Login..." );
      
      var url = '';

      $http({
              method : "POST",
              url : '/TwitterAuth'
            }).then(function mySucces(response) {
                console.log("Twitter Login URL = " + response.data);
                 var url = response.data;
              }, function myError(response) {
                 $scope.message = "Error";
            });      


      {
       console.log("Twitter Login URL = " + url);
/*        
       var Twitter_Window = window.open(url,"","resizable=yes,width=600,height=400,toolbar=no,titlebar=no,menubar=no,scrollbars=yes");
       var twitter_timer = setInterval(checkWindow3, 1000);
*/       
      }


  function checkWindow3() {

  try {
     var twitter_url = Twitter_Window.location.href;
     
     console.log(twitter_url);
      
      if(twitter_url == undefined) {
        console.log("twitter_url undefined");
        return false;
      }
      
      var urlArray = twitter_url.split( '=' );
      console.log("1-> " + urlArray[1]);
      var TwitterCode=urlArray[1].split('&');
      console.log("2-> " +TwitterCode[0]);
      var TwitterCODE=TwitterCode[0];
      
      Twitter_Window.close();
      clearInterval(twitter_timer);
                   
     }catch(e){
         console.log(e);
     }
  } 
  }   
});   



/*************************************************************************** 
Description:Controller for Selecting page through drop down
***************************************************************************/ 
app.controller('DropdownController', function($scope,$location)
{
  //alert("DropdownController") ;
  $scope.selectOption = function(selectedvalue)
  {  
    $location.path('/' + $scope.selectedvalue);
  };

});

/*************************************************************************** 
Description:Controller for Posting page
***************************************************************************/
app.controller('PostController',function($scope,$location,$http,$window,$rootScope)
{
  //alert("In PostController");
  
  $scope.addPost = function()
  {
    var x = document.getElementById("myTextarea").value;
    console.log(x);
    //alert ("TextArea = " + x);
    //alert("Email = " +  $scope.email);
    
    console.log("FB_CheckBoxState = " + $scope.FB_CheckBoxState + "LinkedIn_CheckBoxState = " + $scope.LinkedIn_CheckBoxState + "Twitter_CheckBoxState = " + $scope.Twitter_CheckBoxState);
    console.log("FB_Token = " + $scope.FBToken );
    console.log("LinkedIn_Token = " + $scope.LinkedIn_Token );
    
    /* Check if at least one of the checkBox is checked */    
    if (( $scope.FB_CheckBoxState == false ) && ($scope.LinkedIn_CheckBoxState == false) && ($scope.Twitter_CheckBoxState == false)) {
      alert("None of the checkbox are selected. Please select at atleast one to Post ");
    } 
    else {
      $http({
        method : "POST",
        url : '/User/'+ $scope.email,
        data: { email: $scope.email, TextContent: x, 
                FB_State : $scope.FB_CheckBoxState, 
                LinkedIn_State: $scope.LinkedIn_CheckBoxState, 
                Twitter_State: $scope.Twitter_CheckBoxState,
                FB_Token : $scope.FBToken,
                LinkedIn_access_code : $scope.LinkedIn_Token
        }
      }).then(function mySucces(response) {
           
           console.log(response.data);
           
           var myview = angular.fromJson(response.data);
           console.log(myview);
           //alert("Post success");

        }, function myError(response) {
           $scope.message = "Error";
      });
    }
    
    //$location.path("/posttracking"); 
  }
  

  
});


/*************************************************************************** 
Description:Controller for Post-Tracking page
***************************************************************************/    
app.controller('PostTrackingController',function($scope,$location,$http,$window,$rootScope)
{

    //alert("In PostTrackingController");
    
    //alert("Email = " +  $scope.email);
      $http({
        method : "GET",
         url : '/User/'+ $scope.email,
      }).then(function mySucces(response) {
        
        console.log("response = " + response);
        console.log("Post = " + JSON.stringify(response));
        
  
        $scope.list = response.data;
        console.log("List = " + JSON.stringify($scope.list));
        
        $scope.radio = "";
        
        $scope.pageNumber = 0;
        $scope.Text =  $scope.list.Post;
        console.log("$scope.Text = " + $scope.Text);
        
        $scope.setPageNumber = function(index) {
            $scope.pageNumber = index;
            $scope.Text = $scope.list[index].Post;
            $rootScope.PostText= $scope.list[index].Post;
        }

        }, function myError(response) {
           $scope.message = "Error";
      });


      /* Delete Post */
      $scope.DeletePost = function()
      {
        
        //alert("Email = " +  $scope.email);
        console.log("radio = " + $scope.radio);
        console.log("radio = " + $rootScope.PostText);
        console.log("FB_CheckBoxState = " + $scope.FB_CheckBoxState + "LinkedIn_CheckBoxState = " + $scope.LinkedIn_CheckBoxState + "Twitter_CheckBoxState = " + $scope.Twitter_CheckBoxState);
        console.log("FB_Token = " + $scope.FBToken );
        
        $http({
          method : "DELETE",
          url : '/User/'+ $scope.email+'/'+$scope.radio,
          data: { 
                FB_State : $scope.FB_CheckBoxState, 
                LinkedIn_State: $scope.LinkedIn_CheckBoxState, 
                Twitter_State: $scope.Twitter_CheckBoxState,
                FB_Token : $scope.FBToken
          }          
         
        }).then(function mySucces(response) {
             
             console.log("Delete success" + response.data);
             
              $http({
                method : "GET",
                 url : '/User/'+ $scope.email,
              }).then(function mySucces(response) {
                
                console.log("response = " + response);
                console.log("Post = " + JSON.stringify(response));
                
          
                $scope.list = response.data;
                console.log("List = " + JSON.stringify($scope.list));
                
                $scope.radio = "";
                
                $scope.pageNumber = 0;
                $scope.Text =  $scope.list.Post;
                console.log("$scope.Text = " + $scope.Text);
                
                $scope.setPageNumber = function(index) {
                    $scope.pageNumber = index;
                    $scope.Text = $scope.list[index].Post;
                    $rootScope.PostText= $scope.list[index].Post;
                }
        
                }, function myError(response) {
                   $scope.message = "Error";
              });           
  
          }, function myError(response) {
             $scope.message = "Error";
        });
      };
      
     $scope.ViewPostComment = function()
     {
      $location.path('/specificposting');
     }      
});


/*************************************************************************** 
Description:Controller for Commetn Tracking page
***************************************************************************/    
app.controller('SpecificPostingController',function($scope,$location,$http,$window,$rootScope)
{
  
  console.log("Text = " + $rootScope.PostText);
  console.log("Token = " + $scope.FBToken);
  
  $scope.CommentList = '';
/*        
  $http({
        method : "GET",
        url : '/Comments/'+ $rootScope.PostText +'/'+ $scope.FBToken
      }).then(function mySucces(response) {
           console.log(response.data);
           
        }, function myError(response) {
           console.log(response.data);
      }); 
*/      
});