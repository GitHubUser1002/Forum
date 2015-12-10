var mongoose = require('mongoose');

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
 
var MessageSchema = new Schema({
    locationKey         : {type:ObjectId, required:true, ref: 'Location'}
  , parentMessageKey    : {type:ObjectId, required:false, ref: 'Message'}
  , userKey             : {type:ObjectId, required:true, ref: 'User'}
  , body                : {type:String, default:true}
  , timeStamp           : {type:Date, default:Date.now}
});

var Message = mongoose.model('Message', MessageSchema);

module.exports = Message;