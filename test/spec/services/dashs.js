'use strict';

describe('Service: dashs', function () {

  // load the service's module
  beforeEach(module('strategycanvasFrontendApp'));

  // instantiate service
  var dashs;
  beforeEach(inject(function (_dashs_) {
    dashs = _dashs_;
  }));

  it('should do something', function () {
    expect(!!dashs).toBe(true);
  });

});
