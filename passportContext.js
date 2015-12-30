var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var config = require('./config');

var GOOGLE_CLIENT_ID = config.googleClientId;
var GOOGLE_CLIENT_SECRET = config.googleClientSecret;

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Google profile is
//   serialized and deserialized.
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {    
    done(null, obj);
});

var mongoose = require('mongoose');

var User = require('./models/user.js');

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
},
  function (accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
        process.nextTick(function () {
            User.findOne({ emailAddress: profile.emails[0].value, strategy: 'Google' }, function (err, user) {
                if (err) {
                    console.log(err); 
                }
                else if (user) {
                    console.log(user.displayName + ' logged in!'); // Space Ghost is a talk show host.
                    
                    if (user.avatarUrl != profile._json['image']['url']) {
                        user.avatarUrl = profile._json['image']['url'];
                        User.update({ _id : user._id }, user, { upsert : true }, function(err) {
                            if (err) console.log(err);
                        });
                    }
                }
                else {
                    var newUser = new User({
                        strategy : 'Google',
                        emailAddress : profile.emails[0].value,
                        displayName : profile.displayName,
                        avatarUrl : profile._json['image']['url']
                    });
                    newUser.save(function (err) {
                        if (!err) {
                            console.log('New user created');
                            //console.log(newUser);
                        } 
                        else console.log(err);
                    });
                }      
            });
    });
    
    // To keep the example simple, the user's Google profile is returned to
    // represent the logged-in user.  In a typical application, you would want
    // to associate the Google account with a user record in your database,
    // and return that user instead.

    return done(null, profile);
}
));


module.exports = passport;