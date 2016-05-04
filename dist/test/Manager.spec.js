"use strict";
require('source-map-support').install();
require('reflect-metadata');
require('expectations');
var DynamoDBStore_1 = require('../DynamoDBStore');
var index_1 = require('../index');
var Log = require('../log');
var Constants_1 = require('../Constants');
var log = Log.create(__filename);
log.info('Starting test suite');
var Fixtures = null;
var store = null;
function reset(syncModels, endpoint) {
    // Init dynamo type
    // using local
    store = new DynamoDBStore_1.DynamoDBStore();
    var opts = {
        dynamoEndpoint: endpoint,
        prefix: "test_" + process.env.USER + "_",
        syncModels: syncModels,
        store: store
    };
    if (!endpoint)
        delete opts['endpoint'];
    delete require['./fixtures/index'];
    return index_1.Manager.reset().then(function () {
        log.info('Manager reset, now init');
    })
        .then(function () { return index_1.Manager.init(opts); })
        .then(function () {
        Fixtures = require('./fixtures/index');
    });
}
describe('dynotype', function () {
    /**
     * Test for valid decorations
     */
    describe('Decorators', function () {
        beforeEach(function () {
            return reset(false, Constants_1.LocalEndpoint);
        });
        it('decorates a new model', function () {
            var test1 = new Fixtures.Test1();
            var constructorFn = test1.constructor.prototype;
            expect(constructorFn).toBe(Fixtures.Test1.prototype);
            var attrData = Reflect.getOwnMetadata(Constants_1.DynoAttrKey, constructorFn), modelData = Reflect.getOwnMetadata(Constants_1.DynoModelKey, constructorFn);
            expect(attrData.length).toEqual(3);
            expect(modelData.attrs.length).toEqual(3);
        });
        /**
         * Creates a valid table definition
         */
        it('Creates a valid table def', function () {
            new Fixtures.Test1();
            var modelOpts = index_1.Manager.findModelOptionsByClazz(Fixtures.Test1);
            var tableDef = store.tableDefinition(modelOpts.clazzName);
            expect(tableDef.KeySchema.length).toBe(2);
            expect(tableDef.AttributeDefinitions.length).toBe(2);
            expect(tableDef.AttributeDefinitions[0].AttributeName).toBe('id');
            expect(tableDef.AttributeDefinitions[0].AttributeType).toBe('S');
        });
    });
    describe('Client connects and works', function () {
        beforeEach(function () {
            return reset(true, Constants_1.LocalEndpoint);
        });
        it("Can create a table for a model", function (done) {
            var test1 = new Fixtures.Test1();
            return index_1.Manager.start().then(function () {
                expect(store.availableTables.length).toBe(1);
                done();
            }).catch(done);
        });
    });
});

//# sourceMappingURL=Manager.spec.js.map
