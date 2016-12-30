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

var newestReading = {}; //
describe('API V2 tests:', function(){
  describe('Start polling', function(){
    it('Returns an object with polling: true.');
  }),
  describe('Stop polling', function(){
    it('Returns an object with polling: false.');
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
