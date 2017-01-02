//----------------------------------------------//
//    'NPM test' from the command line to run
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

var newestReading = {}; //use to compare youngest timestamped database entries between reads
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
      request.post('http://localhost:3000/api/v2/stopPolling', function(error, response, body){
        assert(body, 'Missing body.');
        assert(!error, 'Recieved an error response.');
        assert(!JSON.parse(body).dataPollingStateReq, 'Body did not have dataPollingStateReq == false.');
        done();
      })
    });
  }),
  describe('Change poll rate.', function(){
    it('Returns an object with pollRate at new rate.');
    // console.log('dataPollRate from DB: ' + JSON.parse(body).dataPollRate);
  }),
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
