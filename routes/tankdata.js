// any verb to /tank is handled here

var express = require('express');
var router = express.Router();
module.exports = router;
var Schedule = require('../models/schedule');
var request = require('request');
var parse = require('csv-parse');
var babyparse = require('babyparse');
var moment = require('moment');


router.get('/', function(req, res, next) {
  Schedule.findOne( { user: 'Jason' }, function(err, schedule){ // get entry with user: Jason from DB
    if (schedule) {
      res.render('tank', { schedule: schedule, moment: moment });
    } else { response.send('could not find user: Jason.  Error: ' + err);
      // response.send('the schedule is: ' + schedule); works
    };
  });
});

router.get('/about', function(req, res, next) {  //
  res.render('about.ejs');
});
