'use strict';

describe('Service: localDS', function () {

  // load the service's module
  beforeEach(module('strategycanvasFrontendApp'));

  // instantiate service
  var localDS;
  beforeEach(inject(function (_localDS_) {
    localDS = _localDS_;
  }));

  it('should do something', function () {
    expect(!!localDS).toBe(true);
  });

});
