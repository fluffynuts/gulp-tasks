(function() {
    const
        gulp = requireModule<Gulp>("gulp"),
        env = requireModule<Env>("env"),
        { runTests } = requireModule<TestDotNetLogic>("test-dotnet-logic");
    gulp.task(
        "test-dotnet",
        `Runs all tests in your solution via nunit-cli or dotnet test`,
        [ "build" ],
        runTests
    );

    gulp.task(
        "quick-test-dotnet",
        `Tests whatever test assemblies have been recently built *`,
        runTests
    );

    const myTasks = [ "test-dotnet", "quick-test-dotnet" ],
        myVars = [
            "BUILD_CONFIGURATION",
            "DOTNET_CORE",
            "TEST_INCLUDE",
            "TEST_EXCLUDE",
            "MAX_NUNIT_AGENTS",
            "MAX_CONCURRENCY",
            "BUILD_REPORT_XML",
            "NUNIT_ARCHITECTURE",
            "NUNIT_LABELS",
            "TEST_VERBOSITY",
            "DOTNET_TEST_PARALLEL",
            "DOTNET_PARALLEL_STAGGER_MS",
            "RETAIN_TEST_DIAGNOSTICS"
        ];
    env.associate(myVars, myTasks);

})();
