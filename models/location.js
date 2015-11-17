var mongoose = require('mongoose');

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;
 
var LocationSchema = new Schema({
    city                : {type:String, required:true}
  , county              : {type:String, required:true}
  , state               : {type:String, required:true}
  , country             : {type:String, required:true}
  , postalCode          : {type:String, required:true}
});

var Location = mongoose.model('Location', LocationSchema);

module.exports = Location;