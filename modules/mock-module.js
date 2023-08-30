"use strict";
(function () {
    const requireModule = require("./require-module");
    function mockModule(mod, implementation) {
        requireModule.mock(mod, implementation);
    }
    function resetMocks() {
        requireModule.resetMocks();
    }
    module.exports = {
        mockModule,
        resetMocks
    };
})();
