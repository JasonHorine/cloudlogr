var mongoose = require('mongoose');  // must do this before using it makes mongoose available here

var ScheduleSchema = new mongoose.Schema({  // create a schema
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

ScheduleSchema.methods.startPolling = function startPolling(){
  // test what happens when calling while already running.
  // might leave the old setInterval running and spin up a second!
  this.timerID = null;
  this.dataPollingState = true; // keeping track of the status of the object
  var self = this; // need self in next line due to scope
  //calling set interval returns a timerID, store it, used by clearInterval
  this.timerID = setInterval(function(){ self.readEwon(); }, this.dataPollRate);
  // this.writeConfig(); // save the state to the DB (need to be callback?)
  console.log("started polling")
};

ScheduleSchema.methods.stopPolling = function stopPolling(){ // this method stops the polling
    this.dataPollingState = false; // keeping track of the status for server restart
    clearInterval(this.timerID); // stops the event
    this.timerID = null; // used in startPolling to check state
    // this.writeConfig(); // save the state to the DB (need to be callback?)
    console.log("stopped polling")
  };
  // call to read from eWON, called from .startPolling at an interval
ScheduleSchema.methods.readEwon = function readEwon(){ // this method polls
  console.log("I represent a data poll from " + this.timerID +"ms");
  // poll the data
  // emit the data on socket.io if connection exists
  // write the result to the database, it returns the object
  // var xyz = findOneAndUpdate...
  // return xyz // return the database object back to the caller
  };


//https://docs.mongodb.org/manual/reference/operator/update/push/

var Schedule = mongoose.model('Schedule', ScheduleSchema);

// Make this available to our other files

module.exports = Schedule;
