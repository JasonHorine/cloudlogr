var mongoose = require('mongoose');  // must do this before using it makes mongoose available here

var scheduleSchema = new mongoose.Schema({  // create a schema
  user: { type: String, required: true },
  email: {type: String},
  dataAddress: {
    type: Number,
    required: true },
  dataTagname: String,
  dataPollRate: {
   type: Number,
   min: 5000, // 5 seconds
   max: 2147483647, // ~28 days
   required: true },
  dataPollingState: Boolean,
  data: [{   // each read is saved as one element in this array
    value: Number,  // the value retrieved, if any
    timestamp: Date,  // MongoDB cannot stamp the time at this level, provide it in route
    status: Boolean, // eWON returns true or false
    statusCode: Number, // eWON will return code only if not good
    eWONMessage: String // eWON will return text only if not good
  }]
});

//https://docs.mongodb.org/manual/reference/operator/update/push/

var Schedule = mongoose.model('Schedule', scheduleSchema);

// Make this available to our other files

module.exports = Schedule;
