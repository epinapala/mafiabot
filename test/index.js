var expect = require('chai').expect,
    mafiabot = require('..');

describe('mafiabot', function() {
  it('should say hello', function(done) {
    expect(mafiabot()).to.equal('Hello, world');
    done();
  });
});
