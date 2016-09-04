/* global require, describe, it */
/* jshint expr: true, node: true,  esnext : true*/
'use strict';

const chai = require('chai');
const expect = chai.expect;
const helper = require('../utils/helper.js');
const _ = require('underscore');

const constants = require('../lib/constants');
const ROLE_MANDATORY = constants.ROLE_MANDATORY;
const ROLE_OPTIONAL = constants.ROLE_OPTIONAL;

describe('helpers test suite', function suite() {
    describe('parseCutomizedRoles tests', function suite() {
        it('should be able to parse custom roles correctly', function () {
            let input = 'm1:1,m2:2,m3:1,m4:2|o1:1,o2:2,o3:4';
            let result = helper.getCommaSeperatedRolesFromCustomFormat(input);
            expect(result).to.deep.equal({
                [ROLE_MANDATORY] : ["m1", "m2", "m2", "m3", "m4", "m4"],
                [ROLE_OPTIONAL] : ["o1", "o2", "o2", "o3", "o3", "o3", "o3"]
            });
        });

        it('should be able to skip malformed elements and parse rest of the custom roles correctly', function () {
            let input = 'm1:1,:m2:2,m3:1,m4:2|o1:1,o2:2,o3::4';
            let result = helper.getCommaSeperatedRolesFromCustomFormat(input);
            expect(result).to.deep.equal({
                [ROLE_MANDATORY] : ["m1", "m3", "m4", "m4"],
                [ROLE_OPTIONAL] : ["o1", "o2", "o2"]
            });
        });
    });

    describe('getComputedRoleResult tests', function suite() {
        it('should be able to copute a comma seperated list roles correctly', function () {
            let roles = {
                [ROLE_MANDATORY] : ["m1", "m2", "m2", "m3", "m4", "m4"],
                [ROLE_OPTIONAL] : ["o1", "o2", "o2", "o3", "o3", "o3", "o3"]
            };
            let user_count = 9;

            //TODO expected to have all mandatory roles and atleast 3 optional roles.
        });

        it('should be able to copute a comma seperated list from 1 set each of mandatory & optional roles correctly', function () {
            let roles = {
                [ROLE_MANDATORY] : ["m1", "m2", "m2", "m3", "m4", "m4"],
                [ROLE_OPTIONAL] : ["o1", "o2", "o2", "o3", "o3", "o3", "o3"]
            };
            let user_count = 5;

            //TODO expected to have all mandatory roles and no optional roles.
        });
    });

    describe('fillArray tests', function suite() {
        it('should be able to fill array correctly', function () {
            let result = helper.fillArray('test', 2);
            result = result.concat(helper.fillArray('test2', 5));
            result = result.concat(helper.fillArray('test3', 10));

            let assertObj = _.countBy(result, _.identity);
            expect(assertObj.test).to.equal(2);
            expect(assertObj.test2).to.equal(5);
            expect(assertObj.test3).to.equal(10);
        });
    });
});