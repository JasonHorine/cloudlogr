var mongoose = require('mongoose');  // must do this before using it makes mongoose available here
var request = require('request');
// var parse = require('csv-parse');  // was used with eWON
// var babyparse = require('babyparse');  // was used with eWON

var ScheduleSchema = new mongoose.Schema({  // create a schema
  user: { type: String, required: true },
  email: {type: String},
  dataAddress: {
    type: Number,
    required: true },
  dataTagname: String,
  dataPollRate: {
   type: Number,
   min: 3000, // 3 seconds
   max: 60000, // 60 seconds, actual max possible is 2147483647, ~28 days
   required: true },
  dataPollingState: Boolean, // process sets or resets this when polling changes
  dataPollingStateReq: Boolean, // user sets this to request a change to the state
  data: [{   // each read is saved as one element in this array
    value: Number,  // the value retrieved, if any
    inlet: Boolean,
    outlet: Boolean,
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
  console.log("startPolling: started polling")
};


// call to read from eWON, called from .startPolling at an interval
// if dataPollingStateReq is found to be false:
// -set dataPollingState to false
// -clearInterval to stop the polling
ScheduleSchema.methods.pollEwon = function pollEwon(){
  console.log("pollEwon: running")
  var self = this;
  Schedule.findOne( { user: self.user, dataAddress: self.dataAddress }, 'dataPollingStateReq', function(err, schedule){
      if (err) console.log('pollEwon: could not find user: Jason.  Error: ' + err);
      else{
        // response.send('the schedule is: ' + schedule); works
        // response.render('tank', [ {schedule: "I'm schedule"}, {header: "I'm header"} ]);
        if (schedule.dataPollingStateReq === true){
          console.log("pollEwon: calling readEwonOnce")
          // self.readEwonOnce();
          self.readMockOnce();
        }
        else {
          clearInterval(self.timerID); // shut down the polling
          Schedule.findOneAndUpdate( { user: 'Jason' }, { dataPollingState: false }, { new: false }, function(err, schedule){ // set the flag in the database that polling has stopped
            console.log("pollEwon: server polling stopped");
          });
        }
      };
  });
};

// this method added after eWON free access expired
// call to generate one simulated data point, save to DB and execute callback (response)
ScheduleSchema.methods.readMockOnce = function readMockOnce(callback){ // callback is executed at end
  console.log('starting readMockOnce');
  Schedule.findOne( { user: 'Jason' }, function(err, schedule){ // get the previous reading
    if (err){
      console.log('error reading DB: ' + err);
      return (err);
    } else { // calculate the new value to store and return
      var clock = new Date();
      var lastEntry = schedule.data.slice(-1)[0];
      //var elapsed = clock - lastEntry.timestamp; // dif between now and last entry in milliseconds
      //var maxElapsed = 1800000; // 30 minutes in milliseconds
      //(elapsed > maxElapsed) ? elapsed = maxElapsed : elapsed = elapsed; // clamp elapsed to 30 minutes, tends to peg a rail upon waking otherwise
      var lastValue = lastEntry.value;
      var centerBias = 0
      // create a bias to tend to drive the result toward the center, 50
      if (lastEntry.value > 50){
        centerBias = -0.55;
      } else {
        centerBias = -0.45;
      };
      //value = lastEntry.value + ((Math.random() + centerBias) * 0.000278 * elapsed); // Assume vessel takes 2hr to fill or drain. (720,000ms).  This formula sets that as the maximum rate of change possible.  Change is randomized with pos and neg equally likely.
      value = lastEntry.value + ((Math.random() + centerBias) * 10);
      (value > 100) ? value = 100 : value = value; // clamp to <=
      (value < 0) ? value = 0 : value = value; // clamp to >= 0
      var data = { // the new data entry object for the DB
        value: value,
        timestamp: clock,
        status: true,
        statusCode: 200,
        eWONMessage: null
      };
      Schedule.findOneAndUpdate( { user: 'Jason' }, { $push: { data: data }}, { new: true }, function(err, schedule){ // after write, database returns schedule
          if (err){
            console.log('could not find user: Jason.  Error: ' + err);
          } else {
            console.log('mock data saved');
            if (callback){ //if a callback was provided, use it, will be 'response'
              schedule.data = schedule.data.reverse();
              callback.send({data: schedule.data.slice(0, 10), dataPollingStateReq: schedule.dataPollingStateReq, dataPollingState: schedule.dataPollingState, dataPollRate: schedule.dataPollRate});
            } else { // if no callback provided, return schedule
              return schedule;
            }
          };
      });
    }
  });
};

// used for eWON access, no longer functional
// call to generate one eWON data point, save to DB and execute callback (response)
// ScheduleSchema.methods.readEwonOnce = function readEwonOnce(callback){ // callback is executed at end
//   console.log('starting readEwonOnce, logging in');
//   request('https://m2web.talk2m.com/t2mapi/login?' + // login to get t2msession
//     't2maccount=' + process.env.EWON_ACCOUNT +
//     '&t2musername=' + process.env.EWON_USER_ID +
//     '&t2mpassword=' + process.env.EWON_USER_PASSWORD +
//     '&t2mdeveloperid=' + process.env.EWON_DEV_ID, function (error, response, body) { // execute this when a session ID is returned
//       if (!error && response.statusCode == 200) {  // if no error
//         var bodyJson = JSON.parse(body);
//         var eWONSessionID = bodyJson.t2msession; // save the session ID
//         console.log('requesting data');
//         request('https://m2web.talk2m.com/t2mapi/get/sample/rcgi.bin/ParamForm?' + // get tags
//           'AST_Param=$dtIV$ftT' +
//           '&t2maccount=' + process.env.EWON_ACCOUNT +
//           '&t2musername=' + process.env.EWON_USER_ID +
//           '&t2mpassword=' + process.env.EWON_USER_PASSWORD +
//           '&t2mdeveloperid=' + process.env.EWON_DEV_ID +
//           '&t2mdeviceusername=' + process.env.EWON_DEVICE_USERNAME +
//           '&t2mdevicepassword=' + process.env.EWON_DEVICE_PASSWORD +
//           '&t2msession=' + eWONSessionID, function (error, response, body) {
//             if (!error && response.statusCode == 200) { // if no error... should record error instead if it exists
//               parse(body, {delimiter: ';'}, function(err, output){
//                 var value = output[3][2];
//                 // console.log('get tags response parse: ' + output);
//                 // console.log('tags response value: ' + value);
//                 var clock = new Date();
//                 var data = {
//                   value: value,
//                   timestamp: clock,
//                   status: true,
//                   statusCode: 200,
//                   eWONMessage: null
//                 };
//                 Schedule.findOneAndUpdate( { user: 'Jason' }, { $push: { data: data }}, { new: true }, function(err, schedule){ // after write, database returns schedule
//                   if (err){
//                     console.log('could not find user: Jason.  Error: ' + err);
//                   } else {
//                     console.log('data saved');
//                     if (callback){ //if a callback was provided, use it
//                       callback.redirect('/tank'); // response.redirect
//                     } else { // if no callback provided, return schedule
//                       return schedule;
//                     }
//                   };
//                 });
//                 request('https://m2web.talk2m.com/t2mapi/logout?' + // log out routine
//                   'name=sample' + // hard-coded variabsle, should come from database
//                   '&t2mdeveloperid=' + process.env.EWON_DEV_ID +
//                   '&t2msession=' + eWONSessionID, function (error, response, body) {
//                     if (error){
//                       console.log('logout error: ' + error);
//                       console.log('logout error: response: ' + response);
//                       console.log('logout error: body: ' + body);
//                     } else {
//                       console.log('logout success');
//                     };
//                   });

//               });
//             }else{
//               console.log('get tags error: ' + error);
//               console.log('get tags error: response: ' + response);
//               console.log('get tags error: body: ' + body);
//             }
//         });
//       }else{
//         console.log('login error: ' + error);
//         console.log('login error: response: ' + response);
//         console.log('login error: body: ' + body);
//       }
//     });
// };


//https://docs.mongodb.org/manual/reference/operator/update/push/

var Schedule = mongoose.model('Schedule', ScheduleSchema);

// Make this available to our other files

module.exports = Schedule;
