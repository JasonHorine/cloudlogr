// any verb to /tank is handled here

var express = require('express');
var router = express.Router();
module.exports = router;
var Schedule = require('../models/schedule');
var request = require('request');
var parse = require('csv-parse');
var babyparse = require('babyparse');

// router.get('/', function(request, response) { // a get to /tank
//   Schedule.findOne( { user: 'Jason' }, function(err, schedule){
//     if (err) response.send('could not find user: Jason.  Error: ' + err);
//     else{
//       // response.send('the schedule is: ' + schedule); works
//       // response.render('tank', [ {schedule: "I'm schedule"}, {header: "I'm header"} ]);
//       response.render('tank', { schedule: schedule, header: "I'm header" });
//       // render tank.ejs, send entire schedule data
//     };
//   });
// });

router.get('/', function(req, res, next) {
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
            if (!error && response.statusCode == 200) { // if no error
              parse(body, {delimiter: ';'}, function(err, output){
                var value = output[3][2];
                // console.log('get tags response parse: ' + output);
                // console.log('tags response value: ' + value);
                request('https://m2web.talk2m.com/t2mapi/logout?' + // log out routine
                  'name=sample' + // hard-coded variabsle, should come from database
                  '&t2mdeveloperid=' + process.env.EWON_DEV_ID +
                  '&t2msession=' + eWONSessionID, function (error, response, body) {
                    if (!error && response.statusCode == 200) { // if log out good,
                      var clock = new Date();
                      Schedule.findOneAndUpdate( { user: 'Jason' }, { $push: { data: {
                        value: value,
                        timestamp: clock,
                        status: true,
                        statusCode: 200,
                        eWONMessage: null
                      }}}, function(err, schedule){ // after write, database returns schedule
                        if (err) response.send('could not find user: Jason.  Error: ' + err);
                        else{
                          // response.send('the schedule is: ' + schedule); works
                          res.render('tank', { schedule: schedule });
                        };
                      });

                    }else{
                      console.log('logout error: ' + error);
                      console.log('logout error: response: ' + response);
                      console.log('logout error: body: ' + body);
                    }
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
});



// // process.env.EWON_DEV_ID  ...eWON environment variables
// // process.env.EWON_ACCOUNT
// // process.env.EWON_USER_ID
// // process.env.EWON_USER_PASSWORD
// // MyPassword_99

// // device user: jason
// // device password: jason
// // device internet connection: 10.0.0.2
// // device VPN connection: 10.220.161.5

//----------------------------------------------//
//    API route to create a new Schedule        //
//----------------------------------------------//
// this route creates a Schedule object. It is not available via the UI yet
// attributes are currently hard-coded, would be brought in as form fields
// in a *large form, not good UX!
// what would be required to allow the user to create a Schedule?
// how would it be validated before saving it?
// would need to check the address against the API's data


router.post('/newSchedule', function(request, response) {
  var clock = new Date(); // set 'clock' as the current time of the server
  var newSchedule = Schedule({ //create a new Schedule model
    user: 'Jason',
    email: 'outbackdog@gmail.com',
    dataAddress: 500, // not being used with current route
    dataTagname: "Tank_3_gal.",
    dataPollRate: 10000,
    dataPollingState: false
  });
  newSchedule.startPolling();
  newSchedule.save(function(err, schedule){ // err is returned if error, else updated schedule is
        if (err) res.send(err);
        else {
          response.send('Schedule saved!' + schedule + ' newSchedule = ' + newSchedule);
          console.log("new schedule saved to DB");
        };
  });
});

router.post('/startPolling', function(request, response) {
  Schedule.findOneAndUpdate( { user: 'Jason' }, { dataPollingState: true }, {new: true}, function(err, schedule){ // after write, database returns schedule
      // err is returned if error, else updated schedule is
      if (err) res.send(err);
      else {
        schedule.startPolling();
        response.send('hit startPolling. dataPollingState is now: ' + schedule.dataPollingState);
        console.log('hit startPolling. dataPollingState is now: ' + schedule.dataPollingState);
      };
    });
});

router.post('/stopPolling', function(request, response) { // change dataPollingState to false in DB
  Schedule.findOneAndUpdate( { user: 'Jason' }, { dataPollingState: false }, { new: true }, function(err, schedule){ // after write, database returns schedule
      // err is returned if error, else updated schedule is
      if (err) console.log(err);
      else {
        response.send('hit stopPolling. dataPollingState is now: ' + schedule.dataPollingState);
        console.log('hit stopPolling. dataPollingState is now: ' + schedule.dataPollingState);
      };
  });

});

// // route is not complete nor tested
// // for changing the poll rate of a Schedule
// router.post('/changePoll', function(request, response, next) {
//   // this sends the ‘body’ data to the view for testing
//   //res.send(request.body);
//   var user = request.body.user;  // used for query
//   var dataAddress = request.body.dataAddress; // used for query
//   var pollRate = request.body.pollRate; // new value to write
//   if (pollRate < 5000 || pollRate > 2147483647){ // if pollRate is invalid
//     response.send('pollRate bad');
//   }
//   else{ // if pollRate is valid, find the matching schedule and write it
//     // find first with this user and dataAddress, update pollRate
//     Schedule.findOneAndUpdate({ $and: [ { user: user }, { dataAddress: dataAddress } ] }, { pollRate: pollRate }, function(err, schedule) {
//       if (err) console.log(err); //if pollRate is not written to DB
//       else { //if pollRate is written to the DB
//         console.log('pollRate updated by user: ' + schedule.user);

//       };
//     });
//   };
// });

// router.post('/dummyDataStart', function(request, response, next){
//   var user = request.body.user;  // used for query
//   var dataAddress = request.body.dataAddress; // used for query
// })


  //----------------------------------------------//
  //  the object to instantiate for the Schedule: //
  //----------------------------------------------//
// function buildABear(user, dataAddress){
//   Schedule.findOne({ user: user, dataAddress: dataAddress },
//     { user: 1, dataTagname: 1, dataPollRate: 1, dataPollingState: 1, }, function(err, schedule){
//       var schedule = new PollData(schedule);
//     }
// }

// function PollData(schedule){  //constructor for GetData objects <2147483648
//   // get all the config variables from the DB and assign to the instance
//   var dbRetrieve = Schedule.findOne({ user: user, dataAddress: dataAddress },
//     { user: 1, dataTagname: 1, dataPollRate: 1, dataPollingState: 1, });


//   this.user = dbRetrieve.user;
//   this.dataTagname = dbRetrieve.dataTagname;
//   this.dataPollRate = dbRetrieve.dataPollRate;
//   this.dataPollingState = dbRetrieve.dataPollingState;
// };
// // call to start polling eWON
// PollData.prototype.startPolling = function(){
//   this.dataPollingState = true; // keeping track of the status of the object
//   var self = this; // need self in next line due to scope inside function
//   //calling set interval returns a timerID, store it, used by clearInterval
//   this.timerID = setInterval(function(){ self.readEwon(); }, this.msInterval);
//   this.writeConfig(); // save the state to the DB
// };
// // call to stop polling eWON
// PollData.prototype.stopPolling = function(){ // this method stops the polling
//   this.dataPollingState = false; // keeping track of the status of the object
//   clearInterval(this.timerID); // stops the event
//   this.writeConfig();
// };

// // call to read from eWON, called from .startPolling at an interval
// PollData.prototype.readEwon = function(){ // this method polls
//   // poll the data
//   // emit the data on socket.io if connection exists
//   // write the result to the database, it returns the object
//   // var xyz = findOneAndUpdate...
//   // return xyz // return the database object back to the caller
// };

// // call to write to the eWON process inputs
// // returns null or error
// //PollData.prototype.writeEwon = function(fillValve, drainValve){
//   // code here :)
// //}
// // call to get all info for this schedule from the DB
// //PollData.prototype.getDBData = function(){
//   // code here :)
// //}
// // call to append DB with one data point
// // returns the
// PollData.prototype.appendToDBData = function(){
//   Schedule.update(
//     { _id: this._id },
//     { $push: { data: {
//       // value: Number,  // the value retrieved, if any
//       // timestamp: Date,  // MongoDB cannot stamp the time at this level, provide it in route
//       // status: Boolean, // eWON returns true or false
//       // statusCode: Number, // eWON will return code only if not good
//       // eWONMessage: String // eWON will return text only if not good
//   } } }
// )
// }
// // call to change the polling rate
// // returns pollRate or null if rate is bad
// PollData.prototype.changePollRate = function(newPollRate){
//   if (this.validatePollRate){ // if newpollRate is valid
//     if (this.dataPollingState) { // if currently polling, set wasPolling, stop polling
//       var wasPolling = true;
//       this.stopPolling();
//     };
//     this.pollRate = newPollRate; // change poll rate in the instance
//     this.writeConfig(this); // save the instance variables to the database
//     return this.pollRate; // respond to the caller with new pollRate to show that it's done
//     wasPolling ? this.startPolling(); // if it wasPolling, start polling again
//   }
//   // if newPollRate was invalid
//   else {
//     return null;
//   }
// }
// // call to validate the poll rate is acceptable to use
// PollData.prototype.validatePollRate = function(newPollRate){
//   if (2147483647 > newPollRate && newPollRate > 10000){
//     return true;
//   }
//   else {
//     return false;
//   }
// }
// // call to write all config settings of this instance to the database
// PollData.prototype.writeConfig = function()
//   // find the record based on matching its id
//   Schedule.findOneAndUpdate({ _id: this._id } , { //update the following
//     user: this.user,
//     email: this.email,
//     dataAddress: this.dataAddress,
//     dataTagname: this.dataTagname,
//     dataPollRate: this.dataPollRate,
//     dataPollingState: this.dataPollingState,
//     pollRate: this.pollRate,
//      }, function(err, schedule) {
//       if (err) console.log(err); //if write fails
//       else { //if pollRate is written to the DB
//         console.log('config updated by user: ' + this.user);
//       };
//     });
