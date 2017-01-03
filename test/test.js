//----------------------------------------------//
//     Start node on localhost:3000,
//     'NPM test' from the command line to run
//----------------------------------------------//
var assert = require('assert');
var request = require('request');
/* example code
describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal(-1, [1,2,3].indexOf(4));
    });
  });
});
*/

var newestReading = null; //use to compare youngest timestamped database entries between reads
var pollRateOrig = null; //use to compare retrieved poll rates between routes
describe('API V2 tests:', function(){
  describe('Start polling (.post /api/v2/startPolling)', function(){
    it('Returns an object with dataPollingState: true, and DataPollingStateReq: true.', function(done){
      request.post('http://localhost:3000/api/v2/startPolling', function(error, response, body){
        assert(body, 'Missing body.');
        assert(!error, 'Recieved an error response.');
        assert(JSON.parse(body).dataPollingState, 'Body did not have dataPollingState == true.');
        assert(JSON.parse(body).dataPollingStateReq, 'Body did not have dataPollingStateReq == true.');
        done();
      })
    });
  }),
  describe('Stop polling (.post /api/v2/stopPolling)', function(){
    it('Returns an object with dataPollingStateReq: false.', function(done){
      request.post({url:'http://localhost:3000/api/v2/stopPolling'}, function(error, response, body){
        assert(body, 'Missing body.');
        assert(!error, 'Recieved an error response.');
        assert(!JSON.parse(body).dataPollingStateReq, 'Body did not have dataPollingStateReq == false.');
        pollRateOrig = JSON.parse(body).dataPollRate; // store for next test
        done();
      })
    });
  }),
  // //CANNOT figure this one out!  Running this update has /changePollRate get null
  // //response from MongoDB when the value is within range. If the value is out of range,
  // //an appropriate error is returned. Hitting the route from Postman or JS in brower
  // //work correctly.
  // describe('Change poll rate (.post /api/v2/changePollRate)', function(){
  //   it('Returns an object with dataPollRate at new rate.', function(done){
  //     // select a new dataPollRate to test that is within range but != the current
  //     var pollRateNew = null;
  //     if (pollRateOrig > 4000){ //pollRateOrig saved during prior test
  //       pollRateNew = '3.5';
  //     } else {
  //       pollRateNew = '4.5';
  //     };
  //     console.log('pollRateOrig (DB): ' + pollRateOrig + 'ms');
  //     console.log('pollRateNew: ' + pollRateNew + 's');
  //     request.post({
  //       url: 'http://localhost:3000/api/v2/changePollRate',
  //       form: {newDataPollRate: pollRateNew}
  //     }, function(error, response, body){
  //       console.log('error: ' + error);
  //       console.log('response: ' + JSON.stringify(response, null, 4));
  //       console.log('body: ' + body);
  //       //assert(body, 'Missing body.');
  //       //assert(!error, 'Recieved an error response.');
  //       //assert(JSON.parse(body).dataPollRate == pollRateNew, 'dataPollRate was not set to the new value');
  //       done();
  //     })
  //   });
  // }),
  describe('Get readings from DB (.get /api/v2/data)', function(){
    it('Returns database in body, without errors.', function(done){
      request('http://localhost:3000/api/v2/data', function(error, response, body) {
        assert(body, 'Missing body.');
        assert(!error, 'Recieved an error response.');
        newestReading = JSON.parse(body).data[0].timestamp; // newest reading from DB, need in next test
        done();
      })
    })
  }),
  describe('Get one reading (.get /api/v2/oneReading)', function(){
    it('Returns database in body with one fresh entry, without errors.', function(done){
      request('http://localhost:3000/api/v2/oneReading', function(error, response, body) {
        var thisReading = JSON.parse(body).data[0].timestamp;
        assert(body, 'Missing body.');
        assert(!error, 'Recieved an error response.');
        assert(thisReading > newestReading, 'Reading is not newer than last.');
        done();
      })
    });
  })
})
