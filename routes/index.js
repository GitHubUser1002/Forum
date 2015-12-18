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

var message = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras efficitur, nibh sit amet pharetra facilisis, odio mauris ultricies velit, vitae finibus justo eros a diam. Pellentesque gravida sagittis bibendum. Suspendisse suscipit dignissim quam, sed placerat orci tincidunt eget. Nullam egestas leo sed facilisis eleifend. Cras mollis nisl sed auctor consectetur. Nullam augue est, varius laoreet enim at, lacinia pretium ipsum. Nulla interdum vulputate augue nec tristique. Fusce semper, nisi sed sollicitudin cursus, sapien sem venenatis quam, non rutrum tortor nisi sit amet dui. Ut mollis sem a lorem finibus, at vehicula lectus accumsan. Vestibulum egestas diam velit, egestas dapibus nibh tristique vitae. Nullam interdum tincidunt viverra. Vivamus in risus diam.\nVestibulum faucibus sapien auctor dolor commodo, eu posuere mi congue. Etiam ut purus diam. Sed erat lectus, accumsan quis nisl id, faucibus consequat nibh. Nullam quis elementum libero, ut ornare purus. Sed leo mauris, consectetur sit amet auctor vel, ornare et nunc. Ut euismod posuere augue, sed laoreet nisi aliquet a. In velit elit, mattis at nisi in, pellentesque egestas est. Aenean consectetur ornare ex, sed tempus nisi ultricies id. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.\nAenean eget tempor nunc. Nunc eget porta enim. Ut malesuada ornare pretium. Sed non dui quis nibh fermentum tristique. Nunc quis neque vehicula, faucibus augue id, maximus dui. In ut turpis eu turpis porttitor fringilla. Etiam eu metus sed sem dictum lobortis congue a magna. Nam eu sem mattis, scelerisque mi vehicula, mattis libero. Aliquam non ornare mi. Maecenas commodo accumsan facilisis. Vivamus ornare sed dui sit amet semper. Pellentesque nec pharetra velit.\nQuisque feugiat ullamcorper erat, id condimentum ex placerat eget. Sed sed eros eros. Proin venenatis tempus venenatis. Morbi efficitur euismod eros, at maximus nibh fermentum at. Suspendisse a libero at magna dignissim fermentum. Nunc ut tortor dui. Aliquam facilisis laoreet orci a luctus. Cras tempor quam eu nisl efficitur, ac aliquet nibh posuere. Sed sed lectus aliquam, euismod ligula et, suscipit justo. Donec bibendum vitae velit a egestas. Aliquam erat volutpat.\nNulla eget odio sollicitudin, gravida nisl sit amet, porttitor mi. Mauris nec eros mollis, eleifend felis eget, finibus felis. Vivamus ac urna auctor, facilisis nulla ut, eleifend mauris. Sed efficitur enim non facilisis pellentesque. Cras lacinia varius tempus. Nulla eu dictum odio. Sed id odio non urna fringilla laoreet. Morbi vitae arcu lacinia, finibus dui eu, tempus est. Quisque vitae tempus lacus. Cras ullamcorper quam vel diam eleifend eleifend.";

/* GET home page. */
router.get('/', function (req, res) {
    var hostname = req.headers.host;
    var forumurl = "/auth/google";
    var forumtext = "Login";
    if (req.isAuthenticated())  {
        forumurl = "/forum";
        forumtext = "Forum";
    }
    res.render('index', { title: 'forum', url : 'http://' + hostname.replace(':'+(process.env.PORT || 3000), ''), content: message, homeclass:"active", forumurl:forumurl, forumtext:forumtext });
});

router.get('/forum', function (req, res) {
    //console.log(req.user);
    var hostname = req.headers.host;
    res.render('forum', { title: 'forum', url : 'http://' + hostname.replace(':'+(process.env.PORT || 3000), ''), forumclass:"active", forumurl:"/forum", forumtext:"Forum" });
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