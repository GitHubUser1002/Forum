var mongoose = require('mongoose');

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
 
var UserLocationSchema = new Schema({
    locationKey             : {type:ObjectId, required:true, ref: 'Location'}
  , userKey                 : {type:ObjectId, required:true, ref: 'User'}
  , updatedDate             : {type:Date, default:Date.now}
});

var UserLocation = mongoose.model('UserLocation', UserLocationSchema);

module.exports = UserLocation;