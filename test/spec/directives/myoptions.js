'use strict';

describe('Directive: myOptions', function () {

  // load the directive's module
  beforeEach(module('strategycanvasFrontendApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<my-options></my-options>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the myOptions directive');
  }));
});
