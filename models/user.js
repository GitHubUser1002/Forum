var mongoose = require('mongoose');

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
 
var UserSchema = new Schema({
    strategy            : {type:String, required:true}
  , emailAddress        : {type:String, required:true}
  , displayName         : {type:String, required:true}
  , creationDate        : {type:Date, default:Date.now}
  , updatedDate         : {type:Date, default:Date.now}
});

var User = mongoose.model('User', UserSchema);

module.exports = User;