// JavaScript File
var express = require('express');
var app = express();
var request = require("request"); 
var bodyParser = require('body-parser');
var FB = require('fb');
var async = require('async');
var passport = require('passport');
var Twitter = require('twitter');
var session = require("client-sessions");
var FacebookStrategy = require('passport-facebook').Strategy;
var LinkedInStrategy = require('passport-linkedin').Strategy;

// configure body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  cookieName: 'session',
  secret: 'Secret',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
  ephemeral: true
}));

/*************************************************************************** 
Database related initialtization/Configurations

Schema defined
Model defined
Mongoose Initialized and configured

***************************************************************************/
var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

var Schema = mongoose.Schema;

//define the schema
var UserPostSchema   = new Schema({
    email           : String,
    Post            : String,
    FB_PostId       : String,
    LinkedIn_PostId : String,
    Twitter_PostId  : String
});


var UserPost = mongoose.model('UserPost', UserPostSchema);

mongoose.connect('mongodb://localhost:27017/test', function(err) {
  if (err) {
    console.log(err);
  } else {
    console.log('Connected to mongodb!');
  }
});

var g_FBAccessToken = '';

/*************************************************************************** 
Description: Passport session setup
***************************************************************************/

/*
app.use(session({
  resave: false,
  saveUninitialized: true,
  secret: 'SECRET'
}));
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
*/
app.use(express.static(__dirname + "/public"));

/*
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new LinkedInStrategy({
    consumerKey: '77gkwg6n9s1mxl',
    consumerSecret: 'GfJr66AL4O4ETis8',
    callbackURL: 'https://hshrinkh-ece9065-finalproject-himans.c9users.io/auth/linkedin/callback'
},
function(token, refreshToken, profile, done) {
    process.nextTick(function () {
        console.log("token = " + token);
        console.log("token = " + profile);
        return done(null, profile);
    });
  console.log("token1 = " + token);
  console.log("profile1 = " + profile);
  return done(null, profile);
}));
*/

/*************************************************************************** 
Description:
This function is called when access code is received from front end

Actions:
1. Use the access code to get the user profile
2. Store the information in the database
***************************************************************************/
app.get('/AccessCode', function(req, res) 
{
    //res.send(req.param('code'));

    var token_request='code='+req.param('code')+ 
    '&client_id='+ '393434344852-sblmi2dn59dpnb0mnds3sv8cdrgisam9.apps.googleusercontent.com' + 
    '&client_secret='+ 'lgTUEi2nI_X0IegiuYRnvS0y' + 
    '&redirect_uri=https://hshrinkh-ece9065-finalproject-himans.c9users.io'+ 
    '&grant_type=authorization_code';
    
    console.log("Make Request: " + token_request); 

    /* POST Request to Google to exchange temporary code for access_token */
    request({ 
    method: 'POST', 
    headers: {'Content-length': token_request.length, 'Content-type':'application/x-www-form-urlencoded'}, 
    uri:'https://accounts.google.com/o/oauth2/token', 
    body: token_request
    }, 
    function(error, response, body)
    { 
        if(error) 
        { 
            console.log(error); 
        } 
        else 
        {
            
            console.log("Success in Loggin In"); 
            
            /* Parse the response from Google */
            var data=JSON.parse(body);
    
            /* Request to Google API to extract user's profile */
            request({
                url: 'https://www.googleapis.com/userinfo/v2/me',
                qs: {access_token: data.access_token}, //Query string data
                method: 'GET', //Specify the method
            }, 
            function(error, response, body)
            {
                if(error) 
                {
                    console.log(error);
                } 
                else 
                {
                    //Success Case for Googple API use
                    
                    //Parse the response from Google
                    var data=JSON.parse(body); 
                    
                    //Print the received data
                    console.log("Email = " + data.email);
                    console.log("Name = " + data.name); 
                    console.log("Given Name = " + data.given_name); 
                    console.log("Family Name = " + data.family_name); 
                    console.log("Picture link = " + data.picture); 
                    res.json(body);
                }
            });
        }
        
    });
});

/*************************************************************************** 
Description:
This function will return the list of all users
***************************************************************************/
app.get('/User', function(req, res) {
  console.log("Got a GET request at-->" + Date());
  
  UserPost.find(function(err, posts) {
        if (err) {
          console.log(err);
          res.send(err);
        }

        res.json(posts);
        });
});

/*************************************************************************** 
Description:
This function will return the record for a particular user
***************************************************************************/
app.get('/User/:email', function (req, res) {
    
    console.log("Got a Single GET request at-->" + Date());
    console.log("email = "+ req.params.email);
    
    if (( req.params.email == undefined ) || ( req.params.email == undefined ))
    {
        res.json({ message: 'Undefine Error' });
        return;
    }
    
        
    if (req.params.email) {
        UserPost.find({ email: req.params.email }, function (err, docs) {
            if (err) {
		       console.log(err);
        	}
        	else {
        		console.log(docs);
        		res.json(docs);
        	}
        });
    }
});


/*************************************************************************** 
Description:
This function will add the post for a particular user
***************************************************************************/
app.post('/User/:email', function (req, res) {
 
    var tmpFaceBookPostId = '';
    var tmpLinkedInPostId = '';
    var tmpTwitterPostId = '';
    
    console.log("Got a Update POST request at-->" + Date());
    
    var PostText = req.body.TextContent;
    var EmailId = req.body.email;
    
    if (( EmailId == null ) || ( PostText == null ))
    {
        res.json({ message: 'Error' });
        return;
    }
    
    console.log("Text= " + PostText + " Email = " + EmailId + " FB_State = " + req.body.FB_State + " LinkedIn_State = " + req.body.LinkedIn_State + " Twitter_State = " + req.body.Twitter_State );

    async.waterfall([
        function(callback)
        {
            /* Check if post is meant for FaceBook */
            if( req.body.FB_State == true )
            {
                console.log('FB Received Token =' + req.body.FB_Token);
            	
            	var FBAccessToken = req.body.FB_Token;
            	g_FBAccessToken = FBAccessToken;
            	
            	//Inspection endpoint API call
             	var token_request='input_token='+ FBAccessToken +
             					  '&access_token=1699813373601633|af5c145272efacb0c8459c7aa9e91b77';
                
                request({ 
                method: 'GET', 
                uri:'https://graph.facebook.com/debug_token?'+token_request
                }, 
                function(error, response, body)
                { 
                    if(error) 
                    { 
                        console.log(error); 
                    } 
                    else 
                    {
                        console.log("Success in Verifying the token"); 
                        
                        /* Parse the response from Google */
                        console.log("body = " + body );
                        
                        var Recvdata=JSON.parse(body);
                        
                        console.log("is_valid = " + Recvdata.data.is_valid );
                      	if ( Recvdata.data.is_valid == true ) 
                      	{
                      		console.log("Token is Valid ");
                      	}
                    }
                    
                });                
                /* Post in FaceBook */
                FB.setAccessToken(FBAccessToken);
                //console.log('FB Access Token =' + FBAccessToken);
            }
            callback(null, 'one');
            
        },
        function(arg1,callback)
        {
            if( req.body.FB_State == true )
            {            
                  FB.api('me/feed', 'post', { message: PostText }, function (res) {
             
                  if(!res || res.error) {
                    console.log(!res ? 'error occurred' : res.error);
                    return;
                  }
                  
                  console.log('Post Id: ' + res.id);
                  tmpFaceBookPostId = res.id;
                  console.log('In Post2FaceBook() tmpFaceBookPostId = ' + tmpFaceBookPostId);
                  callback(null, 'two');                
                });
            }
            else
            {
                callback(null, 'two');
            }
        },
        function(arg1,callback)
        {
            /* Check if post is meant for LinkedIn */
            if( req.body.LinkedIn_State == true )
            {   
                console.log("LinkedAccessToken = " + req.body.LinkedIn_access_code);

                var linkedin_access_token=req.body.LinkedIn_access_code;  

                var message=PostText;
                
                console.log("message = " + message);
                
                var Url = 'https://api.linkedin.com/v1/people/~/shares?oauth2_access_token=' + linkedin_access_token+'&format=json';
                var params = {
                 "comment": message,
                 "visibility":{
                  "code":"anyone"
                 }
                 
                };
                
                //Function to Post Message to linkedin
                request.post(Url,
                {
                 body: params,
                 json: true
                }, function (err, response, body) {
                 
                if (err) {
                    console.log(err);
                } else {
                    console.log("LinkedIn Body = " + JSON.stringify(response));
        	        console.log("LinkedIn Body = " + JSON.stringify(response.body));
        	        console.log("updateKey = " + response.body.updateKey);
        	        console.log("updateUrl = " + response.body.updateUrl);
        	        tmpLinkedInPostId = response.body.updateKey;
                  }
                 callback(null, 'three'); 
                 });
            }
            else
            {
                callback(null, 'three');
            }
        },       
        function(arg1,callback)
        {

            console.log("Add the new post");
            
            // create a new instance of the UserPost model
            var tmpUserPost = new UserPost();      
            
            tmpUserPost.email = EmailId;
            tmpUserPost.Post = PostText;
            tmpUserPost.FB_PostId = tmpFaceBookPostId;
            tmpUserPost.LinkedIn_PostId = tmpLinkedInPostId;
            tmpUserPost.Twitter_PostId = tmpTwitterPostId;
            
            // save the record
            tmpUserPost.save(function(err) {
                if (err) {
                    console.log(err);
                    res.json({ message: err });
                } else {
                    console.log('Post Updated Success');
                    res.json({ message: 'Post Updated' });
                }
            }); 
            
            callback(null, 'done');
        }
        ],function(){
        //When everything is done return back to caller.
        //callback();
    });
});

   
    
/*************************************************************************** 
Description:
This function will delete a particular post for a user
***************************************************************************/
app.delete('/User/:email/:postId', function (req, res) {
   console.log("Got a Single DELETE request at-->" + Date());
   console.log("Id = " +req.params.postId + " Email =" + req.params.email);
  
    var Id = req.params.postId;
    var EmailId = req.params.email;
    
    if (( EmailId == null ) || ( Id == null ))
    {
        res.json({ message: 'NULL Error' });
        return;
    }
    
    if (( EmailId == undefined ) || ( Id == undefined ))
    {
        res.json({ message: 'Undefined Error' });
        return;
    }    
    console.log('FB Access Token =' + req.body.FB_Token);
    console.log(" FB_State = " + req.body.FB_State + " LinkedIn_State = " + req.body.LinkedIn_State + " Twitter_State = " + req.body.Twitter_State );

    var postId = '';
    
    async.waterfall([
        function(callback)
        {
            //Set Access Token
            var FBAccessToken = g_FBAccessToken; //req.body.FB_Token;
            FB.setAccessToken(FBAccessToken);
            console.log("called FB.setAccessToken");
            callback(null, 'one');
        },
        function(arg1,callback)
        {
            UserPost.find({ _id : Id }, function (err, docs) {
                if (err) {
    		       console.log(err);
            	}
            	else {
            	    console.log("docs = " + docs);
            	    
            	    postId = docs[0].FB_PostId;
              	    //console.log("docs.Post = " + docs[0].Post);
            	    //console.log("docs.FB_PostId = " + docs[0].FB_PostId);
                }
            	//callback(null, 'two');
            	callback(null, 'done');
             });
        },
        function(arg1,callback)
        {
            console.log("called FB.api->delete")
            FB.api(postId, 'delete', function (res) {
              if(!res || res.error) {
                console.log(!res ? 'error occurred' : res.error);
                return;
              }
              console.log('FB Post was deleted');
              callback(null, 'three');
            });
        },        
        function(arg1,callback)
        {
            UserPost.findOneAndRemove({ _id : Id }, function (err, docs) {
                if (err) {
    		       console.log(err);
    		       return;
            	}
            	else {
                }
            	callback(null, 'done');
             });          
        }
        ],function(){
        //When everything is done return back to caller.
        //callback();
    });

});

// Get the token
app.post('/Token/:token_id', function(req, res) {
	
	console.log('Received Token =' + req.params.token_id);
	
	var FBAccessToken = req.params.token_id;
	
	//Inspection endpoint API call
 	var token_request='input_token='+req.params.token_id+
 					  '&access_token=1699813373601633|af5c145272efacb0c8459c7aa9e91b77';
    
    request({ 
    method: 'GET', 
    uri:'https://graph.facebook.com/debug_token?'+token_request
    }, 
    function(error, response, body)
    { 
        if(error) 
        { 
            console.log(error); 
        } 
        else 
        {
            console.log("Success in Verifying the token"); 
            
            /* Parse the response from Google */
            console.log("body = " + body );
            
            var Recvdata=JSON.parse(body);
            
            console.log("is_valid = " + Recvdata.data.is_valid );
          	if ( Recvdata.data.is_valid == true ) 
          	{
          		console.log("Token is Valid ");
          	}
        }
        
    });
});

app.post('/api/linkedinPost', function(req, res) {
    console.log ( "In /api/linkedinPost...");

});

app.post('/api/linkedinLogin', function(req, res) {
//Passing Authorization Code for getting Access Token  
    console.log ( "In /api/linkedinLogin...");

    var code = req.body.code;
    console.log("Code = " + code);

    var Client_ID = '77gkwg6n9s1mxl';
    var client_secret = 'GfJr66AL4O4ETis8';
    
    var token_request='grant_type=authorization_code&code='+code+
    '&redirect_uri=https://hshrinkh-ece9065-finalproject-himans.c9users.io&client_id='+Client_ID+
    '&client_secret='+client_secret;
    
    var request_length = token_request.length;
    console.log("requesting: "+token_request);
    
   //After getting Access Token server is sending request to obtain profile information
     request({
      
         method: 'POST',
          headers: {'Content-length': request_length, 'Content-type':'application/x-www-form-urlencoded'},
          uri:'https://www.linkedin.com/uas/oauth2/accessToken',
          body: token_request
        
     }, function(error, response, body){
    if(error) {
        console.log(error);
    } else {
        console.log("Authentication Successful");
        console.log(response.statusCode, body);
        var data=JSON.parse(body);
        console.log("Access Token = " + data.access_token);
        var access_token=data.access_token;
        res.send(access_token);
        
    }
    });
});


/* Twitter */
var OAuth = require('oauth').OAuth
  , oauth = new OAuth(
      "https://api.twitter.com/oauth/request_token",
      "https://api.twitter.com/oauth/access_token",
      "Sl6taWeV1D7m38MP5ryeoaxfM",
      "6VB7C4ZuRwIGEIktwzQigViyiREC8dBUqoamrf2zhdPxmSPVJF",
      "1.0",
      "https://hshrinkh-ece9065-finalproject-himans.c9users.io/twittercallback",
      "HMAC-SHA1"
);  
    
app.post('/TwitterAuth', function(req, res, body) {
 
  console.log("Received request for authentication for twitter ");
  oauth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
    if (error) {
      console.log(error);
      res.send("Authentication Failed!");
    }
    else {
      req.session.oauth = {
        token: oauth_token,
        token_secret: oauth_token_secret
      };

      var twitterUrl='https://twitter.com/oauth/authenticate?oauth_token='+oauth_token;
      
      console.log("oauth = " + req.session.oauth);
      console.log("oauth_token = " + oauth_token);
      console.log("twitterUrl = " + twitterUrl);
      res.send(twitterUrl);
    }
  });
 
});

app.get('/twittercallback', function(req, res, next) {
 
  console.log("Twitter Callback received ");
  if (req.session.oauth) {
      
    req.session.oauth.verifier = req.query.oauth_verifier;
    var oauth_data = req.session.oauth;
 
    oauth.getOAuthAccessToken(
      oauth_data.token,
      oauth_data.token_secret,
      oauth_data.verifier,
      function(error, oauth_access_token, oauth_access_token_secret, results) {
        if (error) {
          console.log(error);
          res.send("Error!");
        }
        else {
          console.log("Token = " + oauth_access_token );
          console.log("Secret = " + oauth_access_token_secret );     
          res.json({ 
              oauth_access_token: oauth_access_token,
              access_token_secret: oauth_access_token_secret
          });
        }
      }
    );
  }
  else {
      console.log("Error: Twitter Callback ");
      res.send('Error Login');
  }
 
});


/*************************************************************************** 
Description:
This function will reteive a comments for a particular post
***************************************************************************/
app.get('/Comments/:text/:Token', function (req, res) {
    
	console.log("Request for comments");
	console.log("Text = "+ req.params.text);
	console.log("FB Token = " + req.params.Token);
	var PostId = '';

    if (req.params.text) {
        UserPost.find({ Post: req.params.text }, function (err, docs) {
            if (err) {
		       console.log(err);
        	}
        	else {
        		console.log("result =" + docs);
        		var data=JSON.parse(docs);
        		PostId = data.FB_PostId;
        		console.log("PostId =" + PostId);        		
        	}
        });
    }



    request({ 
    method: 'GET', 
    uri:'https://graph.facebook.com/'+ PostId + "/comments"
    }, 
    function(error, response, body)
    { 
        if(error) 
        { 
            console.log(error); 
        } 
        else 
        {
            console.log("body = " + JSON.stringify(body) );
            console.log("response = " + JSON.stringify(response) );
        }
    });

 
    res.send('Done');
}); 

app.listen(process.env.PORT);