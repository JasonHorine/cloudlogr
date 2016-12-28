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

describe('API V2 tests:', function(){
  describe('Start polling', function(){
    it('Returns an object with polling: true.');
  }),
  describe('Stop polling', function(){
    it('Returns an object with polling: false.');
  }),
  describe('Change poll rate.', function(){
    it('Returns an object with pollRate at new rate.');
  }),
  describe('Get one reading (.get /api/v2/oneReading)', function(){
    it('Returns database in body, without errors.', function(done){
      request('http://localhost:3000/api/v2/oneReading', function(error, response, body) {
        assert(body && !error, 'Missing body or recieved an error response.');
        done();
      })
    });
  }),
  describe('Get all readings (.get /api/v2/data)', function(){
    it('Returns database in body, without errors.', function(done){
      request('http://localhost:3000/api/v2/data', function(error, response, body) {
        assert(body && !error, 'Missing body or recieved an error response.');
        done();
      })
    })
  })
})
