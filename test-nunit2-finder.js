var finder = require("./modules/testutil-finder").nunit2Finder;
var result = finder("/bin/nunit-console.exe", {});
console.log(result);
