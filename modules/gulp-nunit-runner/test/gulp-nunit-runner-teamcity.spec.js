const fs = require("fs"),
	path = require("path"),
	testFile = path.join(__dirname, "teamcity.xml"),
	teamcity = require("../lib/teamcity");

describe('teamcity', function() {

    it('should generate TeamCity service messages', function() {

			const log = teamcity(fs.readFileSync(testFile, "utf8")).map(
				line => line.replace(/\|r/g, "").replace(/\|n/g, "")
			);

			expect(log[0]).toEqual('##teamcity[testSuiteStarted name=\'mock-assembly.dll\']');
            expect(log[1]).toEqual('##teamcity[testSuiteStarted name=\'NUnit\']');
                expect(log[2]).toEqual('##teamcity[testSuiteStarted name=\'Tests\']');
                    expect(log[3]).toEqual('##teamcity[testSuiteStarted name=\'Assemblies\']');
                        expect(log[4]).toEqual('##teamcity[testSuiteStarted name=\'MockTestFixture\']');
                            expect(log[5]).toEqual('##teamcity[testStarted name=\'NUnit.Tests.Assemblies.MockTestFixture.FailingTest\']');
                                expect(log[6]).toEqual('##teamcity[testFailed name=\'NUnit.Tests.Assemblies.MockTestFixture.FailingTest\' message=\'Intentional failure\' details=\'at NUnit.Tests.Assemblies.MockTestFixture.FailingTest()\']');
                            expect(log[7]).toEqual('##teamcity[testFinished name=\'NUnit.Tests.Assemblies.MockTestFixture.FailingTest\' duration=\'16\']');
                            expect(log[8]).toEqual('##teamcity[testStarted name=\'NUnit.Tests.Assemblies.MockTestFixture.InconclusiveTest\']');
                                expect(log[9]).toEqual('##teamcity[testFailed name=\'NUnit.Tests.Assemblies.MockTestFixture.InconclusiveTest\' message=\'No valid data\']');
                            expect(log[10]).toEqual('##teamcity[testFinished name=\'NUnit.Tests.Assemblies.MockTestFixture.InconclusiveTest\' duration=\'0\']');
                            expect(log[11]).toEqual('##teamcity[testStarted name=\'NUnit.Tests.Assemblies.MockTestFixture.MockTest1\']');
                            expect(log[12]).toEqual('##teamcity[testFinished name=\'NUnit.Tests.Assemblies.MockTestFixture.MockTest1\' duration=\'0\']');
                            expect(log[13]).toEqual('##teamcity[testStarted name=\'NUnit.Tests.Assemblies.MockTestFixture.MockTest2\']');
                            expect(log[14]).toEqual('##teamcity[testFinished name=\'NUnit.Tests.Assemblies.MockTestFixture.MockTest2\' duration=\'0\']');
                            expect(log[15]).toEqual('##teamcity[testStarted name=\'NUnit.Tests.Assemblies.MockTestFixture.MockTest3\']');
                            expect(log[16]).toEqual('##teamcity[testFinished name=\'NUnit.Tests.Assemblies.MockTestFixture.MockTest3\' duration=\'16\']');
                            expect(log[17]).toEqual('##teamcity[testIgnored name=\'NUnit.Tests.Assemblies.MockTestFixture.MockTest4\' message=\'ignoring this test method for now\']');
                            expect(log[18]).toEqual('##teamcity[testStarted name=\'NUnit.Tests.Assemblies.MockTestFixture.TestWithException\']');
                                expect(log[19]).toEqual('##teamcity[testFailed name=\'NUnit.Tests.Assemblies.MockTestFixture.TestWithException\' message=\'System.ApplicationException : Intentional Exception\' details=\'at NUnit.Tests.Assemblies.MockTestFixture.MethodThrowsException()at NUnit.Tests.Assemblies.MockTestFixture.TestWithException()\']');
                            expect(log[20]).toEqual('##teamcity[testFinished name=\'NUnit.Tests.Assemblies.MockTestFixture.TestWithException\' duration=\'0\']');
                            expect(log[21]).toEqual('##teamcity[testStarted name=\'NUnit.Tests.Assemblies.MockTestFixture.TestWithManyProperties\']');
                            expect(log[22]).toEqual('##teamcity[testFinished name=\'NUnit.Tests.Assemblies.MockTestFixture.TestWithManyProperties\' duration=\'0\']');
                        expect(log[23]).toEqual('##teamcity[testSuiteFinished name=\'MockTestFixture\']');
                    expect(log[24]).toEqual('##teamcity[testSuiteFinished name=\'Assemblies\']');
                    expect(log[25]).toEqual('##teamcity[testSuiteStarted name=\'BadFixture\']');
                    expect(log[26]).toEqual('##teamcity[testSuiteFinished name=\'BadFixture\']');
                    expect(log[27]).toEqual('##teamcity[testSuiteStarted name=\'FixtureWithTestCases\']');
                        expect(log[28]).toEqual('##teamcity[testSuiteStarted name=\'GenericMethod\']');
                            expect(log[29]).toEqual('##teamcity[testStarted name=\'NUnit.Tests.FixtureWithTestCases.GenericMethod<Int32>(2,4)\']');
                            expect(log[30]).toEqual('##teamcity[testFinished name=\'NUnit.Tests.FixtureWithTestCases.GenericMethod<Int32>(2,4)\' duration=\'0\']');
                            expect(log[31]).toEqual('##teamcity[testStarted name=\'NUnit.Tests.FixtureWithTestCases.GenericMethod<Double>(9.2d,11.7d)\']');
                            expect(log[32]).toEqual('##teamcity[testFinished name=\'NUnit.Tests.FixtureWithTestCases.GenericMethod<Double>(9.2d,11.7d)\' duration=\'0\']');
                        expect(log[33]).toEqual('##teamcity[testSuiteFinished name=\'GenericMethod\']');
                        expect(log[34]).toEqual('##teamcity[testSuiteStarted name=\'MethodWithParameters\']');
                            expect(log[35]).toEqual('##teamcity[testStarted name=\'NUnit.Tests.FixtureWithTestCases.MethodWithParameters(2,2)\']');
                            expect(log[36]).toEqual('##teamcity[testFinished name=\'NUnit.Tests.FixtureWithTestCases.MethodWithParameters(2,2)\' duration=\'0\']');
                            expect(log[37]).toEqual('##teamcity[testStarted name=\'NUnit.Tests.FixtureWithTestCases.MethodWithParameters(9,11)\']');
                            expect(log[38]).toEqual('##teamcity[testFinished name=\'NUnit.Tests.FixtureWithTestCases.MethodWithParameters(9,11)\' duration=\'0\']');
                        expect(log[39]).toEqual('##teamcity[testSuiteFinished name=\'MethodWithParameters\']');
                    expect(log[40]).toEqual('##teamcity[testSuiteFinished name=\'FixtureWithTestCases\']');
                    expect(log[41]).toEqual('##teamcity[testSuiteStarted name=\'GenericFixture<T>\']');
                        expect(log[42]).toEqual('##teamcity[testSuiteStarted name=\'GenericFixture<Double>(11.5d)\']');
                            expect(log[43]).toEqual('##teamcity[testStarted name=\'NUnit.Tests.GenericFixture<Double>(11.5d).Test1\']');
                            expect(log[44]).toEqual('##teamcity[testFinished name=\'NUnit.Tests.GenericFixture<Double>(11.5d).Test1\' duration=\'0\']');
                            expect(log[45]).toEqual('##teamcity[testStarted name=\'NUnit.Tests.GenericFixture<Double>(11.5d).Test2\']');
                            expect(log[46]).toEqual('##teamcity[testFinished name=\'NUnit.Tests.GenericFixture<Double>(11.5d).Test2\' duration=\'0\']');
                        expect(log[47]).toEqual('##teamcity[testSuiteFinished name=\'GenericFixture<Double>(11.5d)\']');
                        expect(log[48]).toEqual('##teamcity[testSuiteStarted name=\'GenericFixture<Int32>(5)\']');
                            expect(log[49]).toEqual('##teamcity[testStarted name=\'NUnit.Tests.GenericFixture<Int32>(5).Test1\']');
                            expect(log[50]).toEqual('##teamcity[testFinished name=\'NUnit.Tests.GenericFixture<Int32>(5).Test1\' duration=\'0\']');
                            expect(log[51]).toEqual('##teamcity[testStarted name=\'NUnit.Tests.GenericFixture<Int32>(5).Test2\']');
                            expect(log[52]).toEqual('##teamcity[testFinished name=\'NUnit.Tests.GenericFixture<Int32>(5).Test2\' duration=\'0\']');
                        expect(log[53]).toEqual('##teamcity[testSuiteFinished name=\'GenericFixture<Int32>(5)\']');
                    expect(log[54]).toEqual('##teamcity[testSuiteFinished name=\'GenericFixture<T>\']');
                    expect(log[55]).toEqual('##teamcity[testSuiteStarted name=\'IgnoredFixture\']');
                        expect(log[56]).toEqual('##teamcity[testIgnored name=\'NUnit.Tests.IgnoredFixture.Test1\']');
                        expect(log[57]).toEqual('##teamcity[testIgnored name=\'NUnit.Tests.IgnoredFixture.Test2\']');
                        expect(log[58]).toEqual('##teamcity[testIgnored name=\'NUnit.Tests.IgnoredFixture.Test3\']');
                    expect(log[59]).toEqual('##teamcity[testSuiteFinished name=\'IgnoredFixture\']');
                    expect(log[60]).toEqual('##teamcity[testSuiteStarted name=\'ParameterizedFixture\']');
                        expect(log[61]).toEqual('##teamcity[testSuiteStarted name=\'ParameterizedFixture(42)\']');
                            expect(log[62]).toEqual('##teamcity[testStarted name=\'NUnit.Tests.ParameterizedFixture(42).Test1\']');
                            expect(log[63]).toEqual('##teamcity[testFinished name=\'NUnit.Tests.ParameterizedFixture(42).Test1\' duration=\'0\']');
                            expect(log[64]).toEqual('##teamcity[testStarted name=\'NUnit.Tests.ParameterizedFixture(42).Test2\']');
                            expect(log[65]).toEqual('##teamcity[testFinished name=\'NUnit.Tests.ParameterizedFixture(42).Test2\' duration=\'0\']');
                        expect(log[66]).toEqual('##teamcity[testSuiteFinished name=\'ParameterizedFixture(42)\']');
                        expect(log[67]).toEqual('##teamcity[testSuiteStarted name=\'ParameterizedFixture(5)\']');
                            expect(log[68]).toEqual('##teamcity[testStarted name=\'NUnit.Tests.ParameterizedFixture(5).Test1\']');
                            expect(log[69]).toEqual('##teamcity[testFinished name=\'NUnit.Tests.ParameterizedFixture(5).Test1\' duration=\'0\']');
                            expect(log[70]).toEqual('##teamcity[testStarted name=\'NUnit.Tests.ParameterizedFixture(5).Test2\']');
                            expect(log[71]).toEqual('##teamcity[testFinished name=\'NUnit.Tests.ParameterizedFixture(5).Test2\' duration=\'0\']');
                        expect(log[72]).toEqual('##teamcity[testSuiteFinished name=\'ParameterizedFixture(5)\']');
                    expect(log[73]).toEqual('##teamcity[testSuiteFinished name=\'ParameterizedFixture\']');
                    expect(log[74]).toEqual('##teamcity[testSuiteStarted name=\'Singletons\']');
                        expect(log[75]).toEqual('##teamcity[testSuiteStarted name=\'OneTestCase\']');
                            expect(log[76]).toEqual('##teamcity[testStarted name=\'NUnit.Tests.Singletons.OneTestCase.TestCase\']');
                            expect(log[77]).toEqual('##teamcity[testFinished name=\'NUnit.Tests.Singletons.OneTestCase.TestCase\' duration=\'0\']');
                        expect(log[78]).toEqual('##teamcity[testSuiteFinished name=\'OneTestCase\']');
                    expect(log[79]).toEqual('##teamcity[testSuiteFinished name=\'Singletons\']');
                    expect(log[80]).toEqual('##teamcity[testSuiteStarted name=\'TestAssembly\']');
                        expect(log[81]).toEqual('##teamcity[testSuiteStarted name=\'MockTestFixture\']');
                            expect(log[82]).toEqual('##teamcity[testStarted name=\'NUnit.Tests.TestAssembly.MockTestFixture.MyTest\']');
                            expect(log[83]).toEqual('##teamcity[testFinished name=\'NUnit.Tests.TestAssembly.MockTestFixture.MyTest\' duration=\'0\']');
                        expect(log[84]).toEqual('##teamcity[testSuiteFinished name=\'MockTestFixture\']');
                    expect(log[85]).toEqual('##teamcity[testSuiteFinished name=\'TestAssembly\']');
                expect(log[86]).toEqual('##teamcity[testSuiteFinished name=\'Tests\']');
            expect(log[87]).toEqual('##teamcity[testSuiteFinished name=\'NUnit\']');
        expect(log[88]).toEqual('##teamcity[testSuiteFinished name=\'mock-assembly.dll\']');

    });
});
