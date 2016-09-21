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
            let input = 'm1-1,m2-2,m3-1,m4-2|o1-1,o2-2,o3-4';
            let result = helper.getCommaSeperatedRolesFromCustomFormat(input);
            expect(result).to.deep.equal({
                [ROLE_MANDATORY]: ["m1", "m2", "m2", "m3", "m4", "m4"],
                [ROLE_OPTIONAL]: ["o1", "o2", "o2", "o3", "o3", "o3", "o3"]
            });
        });

        it('should be able to skip malformed elements and parse rest of the custom roles correctly', function () {
            let input = 'm1-1,-m2-2,m3-1,m4-2|o1-1,o2-2,o3--4';
            let result = helper.getCommaSeperatedRolesFromCustomFormat(input);
            expect(result).to.deep.equal({
                [ROLE_MANDATORY]: ["m1", "m3", "m4", "m4"],
                [ROLE_OPTIONAL]: ["o1", "o2", "o2"]
            });
        });
    });

    describe('getComputedRoleResult tests', function suite() {
        it('should be able to compute a comma seperated list of roles correctly', function () {
            let userCount = 9;
            let roles = {
                [ROLE_MANDATORY]: ["m1", "m2", "m2", "m3", "m4", "m4"],
                [ROLE_OPTIONAL]: ["o1", "o2", "o2", "o3", "o3", "o3", "o3"]
            };

            
            var result = helper.getComputedRoleResult(roles, userCount);
            expect(result).to.have.lengthOf(userCount);
            expect(result).to.include("m1");
            expect(result).to.include("m2");
            expect(result).to.include("m3");
            expect(result).to.include("m4");
        });

        it('should assign roles in such a way that optional roles are filled in remianing slots.', function () {
            let userCount = 10;
            let roles = {
                [ROLE_MANDATORY]: ["m1", "m2", "m2", "m3", "m4", "m4"],
                [ROLE_OPTIONAL]: ["o1", "o2", "o3", "o4", "o5", "o6", "o7", "o8", "o9"]
            };
            var result = helper.getComputedRoleResult(roles, userCount);
            expect(_.intersection(result, roles[ROLE_OPTIONAL])).to.have.lengthOf((userCount - roles[ROLE_MANDATORY].length));
        });

        it('should be able to compute a comma seperated list from 1 set each of mandatory & optional roles correctly', function () {
            let userCount = 6;
            let roles = {
                [ROLE_MANDATORY]: ["m1", "m2", "m2", "m3", "m4", "m4"],
                [ROLE_OPTIONAL]: ["o1", "o2", "o2", "o3", "o3", "o3", "o3"]
            };

            var result = helper.getComputedRoleResult(roles, userCount);
            expect(result).to.deep.equal(["m1", "m2", "m2", "m3", "m4", "m4"]);
        });

        it('should be able to assign all roles from optional when there are no mandatory roles', function () {
            let userCount = 4;
            let roles = {
                [ROLE_MANDATORY]: [],
                [ROLE_OPTIONAL]: ["o1", "o2", "o2", "o3", "o3", "o3", "o3"]
            };
            var result = helper.getComputedRoleResult(roles, userCount);
            expect(result).to.have.lengthOf(userCount);
            expect(result).to.include("o3"); //can't check for anything else.
        });
        
        it('should return no roles if there are no users', function () {
            let userCount = 0;
            let roles = {
                [ROLE_MANDATORY]: ["m1", "m2", "m2"],
                [ROLE_OPTIONAL]: ["o1", "o2", "o2"]
            };
            expect(function () {
                helper.getComputedRoleResult(roles, userCount);
            }).to.throw(Error, 'No users found. Cannot generate roles.');
        });

        it("Throw error when num fo roles sent arent sufficient to start a game.", function () {
            let userCount = 9;
            let roles = {
                [ROLE_MANDATORY]: ["m1", "m1"],
                [ROLE_OPTIONAL]: ["o2", "o2"]
            };
            expect(function () {
                helper.getComputedRoleResult(roles, userCount);
            }).to.throw(Error, 'Total Number of roles[' + (_.flatten([roles[ROLE_MANDATORY], roles[ROLE_OPTIONAL]]).length) + '] possible doesnt match the number of users[' +
              userCount + '] in this channel. Retry with start command');
        });


        it('should be able to just return mandatory roles when more than sufficient mandatory roles are there', function () {
            let userCount = 4;
            let roles = {
                [ROLE_MANDATORY]: ["m1", "m2", "m2", "m3"],
                [ROLE_OPTIONAL]: ["o1", "o2", "o2"]
            };

            var result = helper.getComputedRoleResult(roles, userCount);
           expect(result).to.deep.equal(["m1", "m2", "m2", "m3"]);
        });

        it('should be able to return random roles if mandatoryr roles are greater than usercount', function () {
            let userCount = 4;
            let roles = {
                [ROLE_MANDATORY]: ["m1", "m2", "m2", "m3", "m4", "m5", "m3","m2"],
                [ROLE_OPTIONAL]: ["o1", "o2", "o2"]
            };

            var result = helper.getComputedRoleResult(roles, userCount);
            console.log(result);
            expect(result.length).to.equal(userCount);
            expect(result).to.not.include("o1");
            expect(result).to.not.include("o2");
            expect(result).to.not.include("o3");
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