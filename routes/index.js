var express = require('express');
var router = express.Router();
var passport = require('passport');
var config = require('../config');
var authentication = require('../authentication');
var bodyParser = require('body-parser');
var request = require('request');
var Location = require('../models/location.js');
var UserLocation = require('../models/userLocation.js');
var User = require('../models/user.js');

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

/* GET home page. */
router.get('/', function (req, res) {
    var hostname = req.headers.host;
    res.render('index', { title: 'Express', url : 'http://' + hostname.replace(':'+(process.env.PORT || 3000), '')  });
});

router.get('/forum', function (req, res) {
    //console.log(req.user);
    var hostname = req.headers.host;
    res.render('forum', { title: 'forum', url : 'http://' + hostname.replace(':'+(process.env.PORT || 3000), '') });
});

router.post('/RecordPosition', function (req, res) {
    if (req.user && req.body){
        req.user.coords = req.body;
        
        request('https://maps.googleapis.com/maps/api/geocode/json?latlng='+req.user.coords.latitude+','+req.user.coords.longitude+'&location_type=ROOFTOP&result_type=street_address&key=AIzaSyCTHOVv9sY9LzXvdL-c2fPYWUt9imTSlFA', 
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var city = JSON.parse(body).results[0].address_components[2].long_name;
                    var county = JSON.parse(body).results[0].address_components[3].long_name;
                    var state = JSON.parse(body).results[0].address_components[4].long_name;
                    var country = JSON.parse(body).results[0].address_components[5].long_name;
                    var postalCode = JSON.parse(body).results[0].address_components[6].long_name;
                    
                    Location.findOne({ city:city, county:county, country:country, state:state, postalCode:postalCode }, function (err, loc) {
                        if (err) {
                            console.log(err); 
                            return;
                        }
                        else if (loc) {
                            //console.log(loc.postalCode + ' exists!'); // Space Ghost is a talk show host.
                            req.user.location = loc;
                        }
                        else {
                            var location = new Location({
                                city:city, county:county, country:country, state:state, postalCode:postalCode
                            });
                            location.save(function (err) {
                                if (!err) {
                                    console.log('Location saved');
                                    //console.log(location);
                                } 
                                else console.log(err);
                            });
                            req.user.location = location;
                        }      
                        
                        User.findOne({ emailAddress: req.user.emails[0].value, strategy: 'Google' }, function (err, user) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            else if (!user) {
                                console.lof(req.user.emails[0].value + ' not found!');
                                return;
                            }
                            else { 
                                //console.log('Found user, ' + req.user.emails[0].value);
                                UserLocation.findOne({ userKey: user._id }, function(err, userLocation) {
                                    if (err) {
                                        console.log(err);
                                        return;
                                    }
                                    else if (userLocation) {
                                        User.update({userKey: user._id}, {
                                            locationKey: req.user.location._id, 
                                            updatedDate: Date.Now
                                        }, function(err, numberAffected, rawResponse) {
                                           //console.log('Updated: ' + userLocation);
                                        });
                                        
                                    }
                                    else {
                                        var userLocation = new UserLocation({
                                           locationKey:req.user.location._id, userKey:user._id 
                                        });
                                        userLocation.save(function(err) {
                                           if (err) {
                                               console.log(err);
                                           } else {
                                               //console.log('Saved ' + userLocation);
                                           }
                                        });
                                    }
                                });
                            }
                        });
                        
                    });
                    
                    //console.log(JSON.parse(body).results[0].address_components) // Show the HTML for the Google homepage. 
                }
        });
    }
    //console.log(req.user);
});

module.exports = router;