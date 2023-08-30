(function() {
    interface MockModule {
        mock(mod: string, implementation: any): void;
        resetMocks(): void;
    }
    const
        requireModule = require("./require-module") as MockModule;
    function mockModule(mod: string, implementation: any): void {
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
