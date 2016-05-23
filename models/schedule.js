var mongoose = require('mongoose');  // must do this before using it makes mongoose available here
var request = require('request');
var parse = require('csv-parse');
var babyparse = require('babyparse');

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
  this.timerID = setInterval(function(){ self.pollEwon(); }, this.dataPollRate);
  // this.writeConfig(); // save the state to the DB (need to be callback?)
  console.log("started polling")
};


// call to read from eWON, called from .startPolling at an interval
ScheduleSchema.methods.pollEwon = function pollEwon(){
  console.log("pollEwon running")
  var self = this;
  Schedule.findOne( { user: self.user, dataAddress: self.dataAddress }, 'dataPollingState', function(err, schedule){
      if (err) console.log('pollEwon could not find user: Jason.  Error: ' + err);
      else{
        // response.send('the schedule is: ' + schedule); works
        // response.render('tank', [ {schedule: "I'm schedule"}, {header: "I'm header"} ]);
        if (schedule.dataPollingState === true){
          console.log("pollEwon calling readEwonOnce")
          self.readEwonOnce();
        }
        else {
          clearInterval(self.timerID);
          console.log("pollEwon stopped polling")
        }
      };
  });
  // poll the data
  // emit the data on socket.io if connection exists
  // write the result to the database, it returns the object
  // var xyz = findOneAndUpdate...
  // return xyz // return the database object back to the caller
};

ScheduleSchema.methods.readEwonOnce = function readEwonOnce(){
  request('https://m2web.talk2m.com/t2mapi/login?' + // login to get t2msession
    't2maccount=' + process.env.EWON_ACCOUNT +
    '&t2musername=' + process.env.EWON_USER_ID +
    '&t2mpassword=' + process.env.EWON_USER_PASSWORD +
    '&t2mdeveloperid=' + process.env.EWON_DEV_ID, function (error, response, body) { // execute this when a session ID is returned
      if (!error && response.statusCode == 200) {  // if no error
        var bodyJson = JSON.parse(body);
        var eWONSessionID = bodyJson.t2msession; // save the session ID
        request('https://m2web.talk2m.com/t2mapi/get/sample/rcgi.bin/ParamForm?' + // get tags
          'AST_Param=$dtIV$ftT' +
          '&t2maccount=' + process.env.EWON_ACCOUNT +
          '&t2musername=' + process.env.EWON_USER_ID +
          '&t2mpassword=' + process.env.EWON_USER_PASSWORD +
          '&t2mdeveloperid=' + process.env.EWON_DEV_ID +
          '&t2mdeviceusername=' + process.env.EWON_DEVICE_USERNAME +
          '&t2mdevicepassword=' + process.env.EWON_DEVICE_PASSWORD +
          '&t2msession=' + eWONSessionID, function (error, response, body) {
            if (!error && response.statusCode == 200) { // if no error... should record error instead if it exists
              parse(body, {delimiter: ';'}, function(err, output){
                var value = output[3][2];
                // console.log('get tags response parse: ' + output);
                // console.log('tags response value: ' + value);
                var clock = new Date();
                Schedule.findOneAndUpdate( { user: 'Jason' }, { $push: { data: {
                  value: value,
                  timestamp: clock,
                  status: true,
                  statusCode: 200,
                  eWONMessage: null
                }}}, {new: true}, function(err, schedule){ // after write, database returns schedule
                  if (err){
                    console.log('could not find user: Jason.  Error: ' + err);
                  } else {
                    // response.send('the schedule is: ' + schedule); works
                    // res.render('tank', { schedule: schedule });
                    console.log('got data via readEwonOnce into DB');
                    return schedule;
                  };
                });
                request('https://m2web.talk2m.com/t2mapi/logout?' + // log out routine
                  'name=sample' + // hard-coded variabsle, should come from database
                  '&t2mdeveloperid=' + process.env.EWON_DEV_ID +
                  '&t2msession=' + eWONSessionID, function (error, response, body) {
                    if (error){
                      console.log('logout error: ' + error);
                      console.log('logout error: response: ' + response);
                      console.log('logout error: body: ' + body);
                    } else {
                      console.log('logout success');
                    };
                  });
              });
            }else{
              console.log('get tags error: ' + error);
              console.log('get tags error: response: ' + response);
              console.log('get tags error: body: ' + body);
            }
        });
      }else{
        console.log('login error: ' + error);
        console.log('login error: response: ' + response);
        console.log('login error: body: ' + body);
      }
    });
};


//https://docs.mongodb.org/manual/reference/operator/update/push/

var Schedule = mongoose.model('Schedule', ScheduleSchema);

// Make this available to our other files

module.exports = Schedule;
