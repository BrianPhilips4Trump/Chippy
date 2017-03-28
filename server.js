console.log("This code is designed to present to run on localhost/bluemix/heroku with the relevant hostname:port");
console.log("./routes/server_nodejs/platform.js: to set specific values such as bluemix url etc.");

var host_uri = "localhost"; // 

var express = require('express');
var fs = require('fs');  // for certs
var os = require('os');
var https = require('https'); 
var http  = require('http');  
var compression = require('compression');
var toobusy = require('toobusy-js'); 
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;          // NB
var bodyParser = require('body-parser'); 
// you can research all the commented out features and 'npm install --save' as required
var helmet = require('helmet'); // Helmet helps you secure your Express apps by setting various HTTP headers. It's not a silver bullet, but it can help!
var path = require('path');
//var logger = require('morgan');
 
// developer code
var platform = require('./routes/server_nodejs/platform.js');
var runtime = platform.configure(); 
var secrets  = require('./secrets.js');   

//console.log(secrets.mongodb.connectionStr());
 
var FoodItemsOnMenu;

var myCollections = {};
var mDB;

 mDB = secrets.mongodb.connectionStr(); // cloud // these two lines can be improved how?
//mDB = secrets.mongodb.connectionStrLocalhost();

// could move the connect string settings to secrets
var db = MongoClient.connect(mDB, function(err, db) {
    if(err)
        throw err;
    console.log("connected to the mongoDB at: " + runtime.mongodb);
    
	
	//myCollection = db.collection('FoodItemsOnMenu'); // creates the collection if it does not exist
	myCollections.FoodItemsOnMenu = db.collection('FoodItemsOnMenu'); 
    myCollections.specials = db.collection('specials'); 
    	myCollections.orders = db.collection('orders'); 

	
	myCollections.FoodItemsOnMenu = db.collection('FoodItemsOnMenu'); 
	
	// proof of concept only with courses, lets add some data, use robmongo do check it works.
	
	
});
 
var connectionListener = false;

var app = express();
//app.use(logger('dev'));  // log every request to the console   morgan 	
app.use(compression()); // must be first, GZIP all assets https://www.sitepoint.com/5-easy-performance-tweaks-node-js-express/
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(helmet()); // by default - removes:  ; adds: X-Frame-Options:SAMEORIGIN
 
app.use(function(req, res, next) {  // HAS TO BE FIRST   middleware which blocks requests when we're too busy 
  if (toobusy()) {
     res.status(503).send("<p><p>&nbsp&nbsp<h1>The server is busy, please try later, possibly in about 30 seconds.</h1>");
  } else {
    next();
  }
});

console.log(runtime);
	
if (runtime.isLocalHost) {  
 // windows if openssl installed
 // set OPENSSL_CONF=C:\Program Files (x86)\OpenSSL-Win32\bin\openssl.cfg
 // C:\Program Files (x86)\OpenSSL-Win32\bin\openssl genrsa -out test-key.pem 1024
 
// test ssl keys with openssl installed - Google for your platform  https://www.openssl.org/
// openssl genrsa -out test-key.pem 1024 
// openssl req -new -key test-key.pem -out certrequest.csr
// openssl x509 -req -in certrequest.csr -signkey test-key.pem -out test-cert.pem	
		console.log("*** Using temp SSL keys on the nodejs server");
	 	var privateKey   = fs.readFileSync('ssl/test-key.pem');
	 	var certificate  = fs.readFileSync('ssl/test-cert.pem'); 

	//	var credentials = {key: privateKey, cert: certificate};	
		
    // use local self-signed cert
    var localCertOptions = { 
        key: privateKey, 
        cert: certificate, 
        requestCert: false, 
        rejectUnauthorized: false 
    }; 		
		
    https.createServer (localCertOptions, app).listen (runtime.port, function () { 
	   console.log(new Date().toISOString());
       console.log (runtime.architecture + ' server startup ok on port: ' + runtime.port); 
    }); 
				
} else { // not local, its in the cloud somewhere bluemix/heroku

	app.set('port', runtime.port);
	
    if (runtime.architecture === "bluemix")
	{
	    // cloud loads certs and establish secure connection
		app.listen(runtime.port, function() {			
		    console.log (runtime.architecture + ' server startup ok on port: ' + runtime.port); 
		}); 
	}
	else 
		if (runtime.architecture === "heroku")
	{ 
		app.listen(runtime.port, function() {
		    console.log (runtime.architecture + ' server startup ok on port: ' + runtime.port); 
		}); 			
	}		
}    
 
app.enable('trust proxy');
 
app.use (function (req, res, next) {  // req.protocol
        if (req.secure) {
                next(); // request was via https, so do no special handling
        } else {
                // request was via unsecure http, so redirect to https
				console.log("redirecting from http to https");
                res.redirect('https://' + req.headers.host + req.url);
        }
});

app.use( // public client pages  THIS FINDS _ngClient/index.html
			"/", //the URL throught which you want to access   static content
			express.static(__dirname + '/_ngClient')  //where your static content is located in your filesystem
				); 
app.use( // alias to third party js code etc
			"/js_thirdparty", //the URL throught which you want to access   content
			express.static(__dirname + '/js_thirdparty')  
				); 				
console.log(__dirname + '/_ngClient');

app.all('/*', function(req, res, next) {
    // CORS headers,     the * means any client can consume the service???
    res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    // Set custom headers for CORS;
    res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token');
    if (req.method == 'OPTIONS') {
        res.status(200).end();
    } else {
        next(); 
    }
});  
 
// middleware is performed before hitting the route handler proper (must pass middleware logic) 
// causes two authenications app.all('/api/v1/admin/*', [require('./middlewares/validateRequest').validateRequest]);
//app.all('/api/v1/*', [require('./routes/middlewares/validateRequest').validateRequest]);

function findFoodItemsOnMenu(findOptions, cb) {
        myCollections.FoodItemsOnMenu.find(findOptions).toArray(cb);
    }
 
function getFoodItemsOnMenu(req, res, findOptions, cb) {
  	findFoodItemsOnMenu( findOptions,  function(err, results) {	 
	if(err)
		{	// throw err;
			console.log("error:");
			console.log(err.message);
			res.status(404);
			res.json({"error": err.message});
		} 
	// console.log(results);		 
	res.status(200);
	res.json(results);	
	});
    } 



function findOrders(findOptions, cb) {
        myCollections.orders.find(findOptions).toArray(cb);
    }
 
function getOrders(req, res, findOptions, cb) {
  	findOrders( findOptions,  function(err, results) {	 
	if(err)
		{	// throw err;
			console.log("error:");
			console.log(err.message);
			res.status(404);
			res.json({"error": err.message});
		} 
	// console.log(results);		 
	res.status(200);
	res.json(results);	
	});
    } 

app.delete('/api/v1/orderitem/:_id', function(req, res) {  
    console.log('DELETE /api/v1/orderitem');
	console.log(req.params._id);
	myCollections.orders.deleteOne({  
        _id  :  ObjectID(req.params._id)} , 
                                   
    function(err, result) {
    if(err)
	{   // throw err;
		console.log("error:");
		console.log(err.message);
		res.status(404);
		res.json({"error": err.message});		
	}        
    if(!err) 
       console.log("FoodItemOnMenu entry deleted");
   	   res.status(200);
	   console.log(JSON.stringify(result))
	   res.json(result);	    
	});			
});
	
app.put('/api/v1/FoodItemOnMenu', function(req, res) {   
    console.log('PUT /api/v1/FoodItemOnMenu');
	console.log(req.body);
	myCollections.FoodItemsOnMenu.insert(req.body, function(err, result) {
    if(err)
	{   // throw err;
		console.log("error:");
		console.log(err.message);
		res.status(404);
		res.json({"error": err.message});		
	}       
    if(!err) 
       console.log("FoodItemOnMenu entry saved");
   	   res.status(200);
	   res.json(result);	    
	});		
});	


app.put('/api/v1/orderitem', function(req, res) {   
    console.log('PUT /api/v1/orderitem');
	console.log(req.body);
    var _id = req.body._id;
    delete req.body._id;
    myCollections.orders.update({
        "_id": ObjectID(_id)
        
    })
	myCollections.orders.insert(req.body, function(err, result) {
    if(err)
	{   // throw err;
		console.log("error:");
		console.log(err.message);
		res.status(404);
		res.json({"error": err.message});		
	}       
    if(!err) 
       console.log("FoodItemOnMenu entry saved");
   	   res.status(200);
	   res.json(result);	    
	});		
});

app.post('/api/v1/FoodItemOnMenu', function(req, res) {   // update a FoodItemOnMenu
    console.log('POST /api/v1/FoodItemOnMenu');
	console.log(req.body);	
	var _id = req.body._id;
	delete req.body._id;
	myCollections.FoodItemsOnMenu.update({"_id" : ObjectID(_id)},req.body,{}, function(err, result) {
    if(err)
	{ 	// throw err;
		console.log("error:");
		console.log(err.message);
		res.status(404);
		res.json({"error": err.message});		
	}        
    if(!err) 
       console.log("FoodItemOnMenu entry saved");
   	   res.status(200);
	   res.json(result);	    
	});	
});




app.post('/api/v1/orders', function (req, res) { // need the post method to pass filters in the body

    console.log('POST /api/v1/basket');

    var findOptions = {};

    // these checks could be normalised to a function
    if (req.body.name) {
        findOptions.name = {
            $eq: req.body.name
        };
    }
    if (req.body.price) {
        findOptions.price = {
            $eq: parseInt(req.body.price)
        };
    }
     if (req.body.catagory) {
        findOptions.catagory = {
            $eq: req.body.catagory
        };
    }

    console.log(findOptions)
    getOrders(req, res, findOptions);
});
	
app.get('/api/v1/orders', function(req, res) { // allows a browser url call 
    console.log('GET /api/v1/orders');
	 
	var findOptions = {};
	
	getFoodItemsOnMenu(req,res,findOptions);
});
app.get('/api/v1/FoodItemsOnMenu', function(req, res) { // allows a browser url call 
    console.log('GET /api/v1/FoodItemsOnMenu');
	 
	var findOptions = {};
	
	getFoodItemsOnMenu(req,res,findOptions);
});

app.post('/api/v1/FoodItemsOnMenu', function(req, res) { // need the post method to pass filters in the body  
    console.log('POST /api/v1/FoodItemsOnMenu');
	 
	var findOptions = {};
	
	// these checks could be normalised to a function
	if (req.body.course) 
	{
		findOptions.course = {$eq : req.body.course};
	}
	if (req.body.year) 
	{
		findOptions.year = {$eq : parseInt( req.body.year )};
	}	
	console.log(findOptions)
	getFoodItemsOnMenu(req,res,findOptions);
});

//===============================================================================================================================
//===============================Specials========================================================================================
app.post('/api/v1/specials', function (req, res) { // need the post method to pass filters in the body

    console.log('POST /api/v1/specials');

    var findOptions = {};

    // these checks could be normalised to a function
    if (req.body.name) {
        findOptions.name = {
            $eq: req.body.name
        };
    }
    if (req.body.price) {
        findOptions.price = {
            $eq: parseInt(req.body.price)
        };
    }
     if (req.body.catagory) {
        findOptions.catagory = {
            $eq: req.body.catagory
        };
    }

    console.log(findOptions)
    getSpecials(req, res, findOptions);
});


function findSpecials(findOptions, cb) {
        myCollections.specials.find(findOptions).toArray(cb);
    }
 
function getSpecials(req, res, findOptions, cb) {
  	findSpecials( findOptions,  function(err, results) {	 
	if(err)
		{	// throw err;
			console.log("error:");
			console.log(err.message);
			res.status(404);
			res.json({"error": err.message});
		} 
	// console.log(results);		 
	res.status(200);
	res.json(results);	
	});
    } 

app.post('/api/v1/loadspecials', function(req, res) { // API restful semantic issues i.e. loadFoodItemsOnMenu
    console.log('POST /api/v1/loadspecials');
    
   var specials = [{
            "catagory": "Burgers",
            "name": "1/4 Pounder with Cheese and Chips ",
            "price": 5
		},
        {
             "catagory": "Chicken",
            "name": "Chicken Fillet Burger and Chips ",
            "price": 5
		},
        {
            
           "catagory": "Chicken",
            "name": "Snack Box :- 2 Pieces of Chicken and Chips ",
            "price": 5
		},
        {
             "catagory": "Burgers",
            "name": "Double Cheese Burger and Chips  ",
            "price": 5
		},
        {
             "catagory": "Fish",
            "name": "Fish Box :- Plaice and Chips ",
            "price": 6
		},
        {
             "catagory": "Chicken",
            "name": "6 Nuggets, 2 Plain Sausages and Chips ",
            "price": 5
		},
         {
            "catagory": "Burgers",
            "name": "2 Chips / 2 Plain Burgers / 2 Plain Sausages / Six Nuggets ",
            "price": 10
		}];
		
	 
	var errorFlag = false;  // can use for feedback
	var insertCount = 0;
	
	specials.forEach( function (arrayItem)
	{
		myCollections.specials.insert( arrayItem, function(err, result) {
			if(err)
			{
				errorFlag = true;
			}
			insertCount++;
		});
	});	 
	var result = {'errorFlag' : errorFlag , 'insertCount' : insertCount};
	console.log(result)
	res.status(200);
	res.json(result); 
});

	
//========================================================================================

app.post('/api/v1/loadOrders', function(req, res) { // API restful semantic issues i.e. loadFoodItemsOnMenu
    console.log('POST /api/v1/loadOrders');
    
    var ordersz = [];
		
	 
	var errorFlag = false;  // can use for feedback
	var insertCount = 0;
	
	ordersz.forEach( function (arrayItem)
	{
		myCollections.orders.insert( arrayItem, function(err, result) {
			if(err)
			{
				errorFlag = true;
			}
			insertCount++;
		});
	});	 
	var result = {'errorFlag' : errorFlag , 'insertCount' : insertCount};
	console.log(result)
	res.status(200);
	res.json(result); 
});







app.post('/api/v1/loadFoodItemsOnMenu', function(req, res) { // API restful semantic issues i.e. loadFoodItemsOnMenu
    console.log('POST /api/v1/loadFoodItemsOnMenu');
    
	var fooditems = [
        {
            "category": "Chips",
            "name": "Small",
            "price": 2.50
		},
        {
            "category": "Chips",
            "name": "Large",
            "price": 3.00
		},
        {
            "category": "Chips",
            "name": "Family Box",
            "price": 7.00
		},
        {
            "category": "Sausages",
            "name": "Plain",
            "price": 0.50
		},
        {
            "category": "Sausages",
            "name": "Large",
            "price": 1.00
		},
        {
            "category": "Sausages",
            "name": "Battered",
            "price": 1.50
		},
        {
            "category": "Burgers",
            "name": "Plain Burger",
            "price": 2.50
		},
        {
            "category": "Burgers",
            "name": "Cheese Burger",
            "price": 3.00
		},
        {
            "category": "Burgers",
            "name": "Double Cheese Burger",
            "price": 3.50
		},
        {
            "category": "Burgers",
            "name": "1/4 Pounder",
            "price": 4.00
		},
        {
            "category": "Burgers",
            "name": "1/4 Pounder with Chesse",
            "price": 4.50
		},
        {
            "category": "Chicken",
            "name": "Chicken Piece",
            "price": 2.00
		},
        {
            "category": "Chicken",
            "name": "6 Nuggets",
            "price": 3.00
		},
        {
            "category": "Chicken",
            "name": "8 Nuggets",
            "price": 3.50
		},
        {
            "category": "Chicken",
            "name": "10 Nuggets",
            "price": 4.00
		},
        {
            "category": "Chicken",
            "name": "Chicken Fillet Burger",
            "price": 4.00
		},
        {
            "category": "Chicken",
            "name": "Snack Box",
            "price": 6.00
		},
        {
            "category": "Fish",
            "name": "Cod",
            "price": 3.00
		},
        {
            "category": "Fish",
            "name": "Haddock",
            "price": 3.50
		},
        {
            "category": "Fish",
            "name": "Plaice",
            "price": 4.00
		},
         {
            "category": "Fish",
            "name": "Fish Box (Plaice)",
            "price": 7.00
		}
	];
      
		
	 
	var errorFlag = false;  // can use for feedback
	var insertCount = 0;
	
	fooditems.forEach( function (arrayItem)
	{
		myCollections.FoodItemsOnMenu.insert( arrayItem, function(err, result) {
			if(err)
			{
				errorFlag = true;
			}
			insertCount++;
		});
	});	 
	var result = {'errorFlag' : errorFlag , 'insertCount' : insertCount};
	console.log(result)
	res.status(200);
	res.json(result); 
});

app.delete('/api/v1/deleteFoodItemsOnMenu', function(req, res) {  
    console.log('DELETE /api/v1/loadFoodItemsOnMenu');
	var errorFlag = false;  // can use for feedback
	try {
		myCollections.FoodItemsOnMenu.deleteMany( {}, function(err, result)
		{
		  var resJSON = JSON.stringify(result);
			console.log(resJSON);
			console.log(result.result.n);
			res.status(200);
			res.json(resJSON);			
		});
	} catch (e) {
			console.log(e);
			res.status(404);
			res.json({});			   
	}	
});


app.delete('/api/v1/deleteorders', function(req, res) {  
    console.log('DELETE /api/v1/loadFoodItemsOnMenu');
	var errorFlag = false;  // can use for feedback
	try {
		myCollections.orders.deleteMany( {}, function(err, result)
		{
		  var resJSON = JSON.stringify(result);
			console.log(resJSON);
			console.log(result.result.n);
			res.status(200);
			res.json(resJSON);			
		});
	} catch (e) {
			console.log(e);
			res.status(404);
			res.json({});			   
	}	
});


// if all the server rest type route paths are mapped in index.js
// app.use('/', require('./routes')); // will load/use index.js by default from this folder

// If no route is matched by now, it must be a 404
app.use(function(req, res, next) {
	console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%");
    var err = new Error('Route Not Found, are you using the correct http verb / is it defined?');
    err.status = 404;		 
    next(err);
});
  