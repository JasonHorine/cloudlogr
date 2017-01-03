// any verb to /api/v2 is handled here

var express = require('express');
var router = express.Router();
module.exports = router;
var Schedule = require('../../models/schedule');
var request = require('request');

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
      //console.log("new schedule saved to DB");
    };
  });
});

//----------------------------------------------//
//    API route to start polling
//----------------------------------------------//
router.post('/startPolling', function(request, response) {
  // check for dataPollingState == false, if found:
  // -change dataPollingState = true
  // -change dataPollingStateReq = true
  // -start polling if findOne returns a database object
  Schedule.findOneAndUpdate( { user: 'Jason' }, { dataPollingState: true, dataPollingStateReq: true }, {new: true}, function(err, schedule){ // after write, database returns schedule
      // err is returned if error, else updated schedule is
      // console.log(schedule);
      if (schedule){ // if update worked, start polling
        schedule.readMockOnce(response); // read immediately and send reading as the response
        schedule.startPolling(); // start polling, first will be in dataPollRate ms
        //console.log('Hit startPolling. dataPollingState is now: ' + schedule.dataPollingState);
        //response.send({dataPollingStateReq: schedule.dataPollingStateReq, dataPollingState: schedule.dataPollingState, dataPollRate: schedule.dataPollRate}); // send polling stats;
      } else {
        //console.log('Hit startPolling.  Err: ' + err);
        response.send('no schedule');
      }
    });
});


//----------------------------------------------//
//    API route to stop polling
//----------------------------------------------//
router.post('/stopPolling', function(request, response) { // change dataPollingStateReq to false in DB
  Schedule.findOneAndUpdate( { user: 'Jason' }, { dataPollingStateReq: false }, { new: true }, function(err, schedule){ // after write, database returns schedule
      // err is returned if error, else updated schedule is
      if (schedule){ // if a matching schedule is found in the DB,
        response.send({dataPollingStateReq: schedule.dataPollingStateReq, dataPollingState: schedule.dataPollingState, dataPollRate: schedule.dataPollRate});
        //console.log('hit stopPolling. dataPollingStateReq is now: ' + schedule.dataPollingStateReq);
      }
      else {
        response.send(false);
        //console.log('hit stopPolling. dataPollingStateReq is now: ' + schedule.dataPollingStateReq);
      };
  });
});


//----------------------------------------------//
//    API route to change poll rate
//----------------------------------------------//
// post to /api/vi/changePollRate with newDataPollRate: in body
// error handling (rate & state) is enforced in the browser
router.post('/changePollRate', function(request, response) {
  //response.send(request.body);
  //console.log('\nhit /changePollRate');
  //console.log('request: ' + request);
  //console.log('request.body: ' + JSON.stringify(request.body, null, 4));
  //console.log('request.body.newDataPollRate: ' + request.body.newDataPollRate);
  //console.log('typeOf newDataPollRate: ' + typeof request.body.newDataPollRate);
  Schedule.findOneAndUpdate( { user: 'Jason', dataPollingState: false },
    { dataPollRate: request.body.newDataPollRate * 1000 },
    { new: true, runValidators: true }, function(err, schedule){ // after write, database returns schedule
      if (schedule){ // if write success
        //console.log('updated. dataPollRate is now: ' + schedule.dataPollRate + 'ms');
        response.send({dataPollRate: schedule.dataPollRate});
      } else if (err){ // if an error is returned
        //console.log('did not update, error: ' + err);
        response.send({error: err});
      } else {
        //console.log('no error, no schedule returned');
      };
  });
});


//----------------------------------------------//
//    API route to get one reading
//----------------------------------------------//
// hit via AJAX call
 router.get('/oneReading', function(request, response){
   Schedule.findOne( { user: 'Jason' }, function(err, schedule){ // get entry with user: Jason from DB
     if (schedule) {
       // schedule.readEwonOnce(response); // will read eWON, save the data to the DB and redirect to /tank
       schedule.readMockOnce(response); // SPA behavior gets one reading and returns data to AJAX call from brower, which redraws the table
     } else { response.send('could not find user: Jason.  Error: ' + err);
       // response.send('the schedule is: ' + schedule); works
     };
   });
 });


//----------------------------------------------//
//    API route to get database readings        //
//----------------------------------------------//
router.get('/data', function(request, response){
  Schedule.findOne( { user: 'Jason' }, function(err, schedule){ // get entry with user: Jason from DB
    if (schedule) {
      schedule.data = schedule.data.reverse();
      response.send({data: schedule.data.slice(0, 10), dataPollingStateReq: schedule.dataPollingStateReq, dataPollingState: schedule.dataPollingState, dataPollRate: schedule.dataPollRate});  // send elements 0-9
    } else { response.send('could not find user: Jason.  Error: ' + err);
    };
  });
});


//----------------------------------------------//
//    API route to reset schedule flags         //
//----------------------------------------------//
router.post('/resetFlags', function(request, response) {
  //response.send(request.body);
  Schedule.findOneAndUpdate( { user: 'Jason' }, { dataPollingState: false, dataPollingStateReq: false }, function(err, schedule){ // after write, database returns schedule
      // err is returned if error, else updated schedule is
    response.redirect('/tank');
  });
});

//----------------------------------------------//
//    API route to update settings of schedule  //
//----------------------------------------------//


//----------------------------------------------//
//    API route to change the process inputs    //  open or close valves
//----------------------------------------------//
