'use strict';

describe('Filter: symbolPath', function () {

  // load the filter's module
  beforeEach(module('strategycanvasFrontendApp'));

  // initialize a new instance of the filter before each test
  var symbolPath;
  beforeEach(inject(function ($filter) {
    symbolPath = $filter('symbolPath');
  }));

  it('should return the input prefixed with "symbolPath filter:"', function () {
    var text = 'angularjs';
    expect(symbolPath(text)).toBe('symbolPath filter: ' + text);
  });

});
