'use strict';

describe('Service: com', function () {

  // load the service's module
  beforeEach(module('strategycanvasFrontendApp'));

  // instantiate service
  var com;
  beforeEach(inject(function (_com_) {
    com = _com_;
  }));

  it('should do something', function () {
    expect(!!com).toBe(true);
  });

});
