/* global require, describe, it */
/* jshint expr: true, node: true,  esnext : true*/
'use strict';

var chai = require('chai');
var expect = chai.expect;
var helper = require('../utils/helper.js');
var _ = require('underscore');


describe('helpers test suite', function suite() {
    describe('parseCutomizedRoles tests', function suite() {
        it ('should be able to parse custom roles correctly', function  () {
            var input = 'm1:1,m2:2,m3:1,m4:2|o1:1,o2:2,o3:4';
            var result = helper.getCommaSeperatedRolesFromCustomFormat(input);
            var actualResult = 'm1,m2,m2,m3,m4,m4,o1,o2,o2,o3,o3,o3,o3';
            expect(result).to.equal(actualResult);
        });

        it ('should be able to skip malformed elements and parse rest of the custom roles correctly', function  () {
            var input = 'm1:1,:m2:2,m3:1,m4:2|o1:1,o2:2,o3::4';
            var result = helper.getCommaSeperatedRolesFromCustomFormat(input);
            var actualResult = 'm1,m3,m4,m4,o1,o2,o2';
            expect(result).to.equal(actualResult);
        });
    });
    
    describe('fillArray tests', function suite() {
        it ('should be able to fill array correctly', function  () {
            var result = helper.fillArray('test', 2);
            result = result.concat(helper.fillArray('test2', 5));
            result = result.concat(helper.fillArray('test3', 10));

            var assertObj =  _.countBy(result, _.identity);
            expect(assertObj.test).to.equal(2);
            expect(assertObj.test2).to.equal(5);
            expect(assertObj.test3).to.equal(10);
        });
    });
});