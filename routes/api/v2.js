// any verb to /api/v2 is handled here

var express = require('express');
var router = express.Router();
module.exports = router;
var Schedule = require('../../models/schedule');
var request = require('request');
var parse = require('csv-parse');
var babyparse = require('babyparse');


//----------------------------------------------//
//    API route to create a new Schedule        //
//----------------------------------------------//
// this route creates a Schedule object. It is not available via the UI yet
// attributes are currently hard-coded, would be brought in as form fields
// in a *large form, not good UX!
// what would be required to allow the user to create a Schedule?
// how would it be validated before saving it?
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


//----------------------------------------------//
//    API route to start polling                //
//----------------------------------------------//
router.post('/startPolling', function(request, response) {
  // check for dataPollingState == false, if found change to true and start polling, if not found, error
  Schedule.findOneAndUpdate( { user: 'Jason', dataPollingState: false }, { dataPollingState: true }, {new: true}, function(err, schedule){ // after write, database returns schedule
      // err is returned if error, else updated schedule is
      // console.log(schedule);
      if (schedule){ // if update worked, start polling
        schedule.readEwonOnce(); // read immediately
        schedule.startPolling(); // start polling, first will be in dataPollRate ms
        console.log('hit startPolling. dataPollingState is now: ' + schedule.dataPollingState);
      };
      response.redirect('/tank');
    });
});


//----------------------------------------------//
//    API route to stop polling                 //
//----------------------------------------------//
router.post('/stopPolling', function(request, response) { // change dataPollingState to false in DB
  Schedule.findOneAndUpdate( { user: 'Jason' }, { dataPollingState: false }, { new: true }, function(err, schedule){ // after write, database returns schedule
      // err is returned if error, else updated schedule is
      if (schedule){ // if a matching schedule is found in the DB,
        response.redirect('/tank');
        console.log('hit stopPolling. dataPollingState is now: ' + schedule.dataPollingState);
      }
      else {
        response.send(false);
        console.log('hit stopPolling. dataPollingState is now: ' + schedule.dataPollingState);
      };
  });
});


//----------------------------------------------//
//    API route to change poll rate             //
//----------------------------------------------//
// post to /api/vi/changePollRate with newDataPollRate: in body
// if not already polling, change poll rate and return new poll rate
// if already polling, return 'stop polling before changing the rate'
// if a bad poll rate is specified, return 'bad poll rate'
router.post('/changePollRate', function(request, response) {
  //response.send(request.body);
  Schedule.findOneAndUpdate( { user: 'Jason', dataPollingState: false }, { dataPollRate: request.body.newDataPollRate }, { new: true, runValidators: true }, function(err, schedule){ // after write, database returns schedule
      // err is returned if error, else updated schedule is
      response.redirect('/tank');
      if (schedule){ // if the write succeeded
        console.log('hit changePollRate. dataPollRtate is now: ' + schedule.dataPollRate);
      } else {
        console.log('hit changePollRate. did not update');
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
