(function () {
  try {
    const env = require("./env");
    const { baseName, chopExtension } = requireModule<PathUtils>("path-utils");
    const testPrefixesPerTarget = new Map();

    function resolveTestPrefixFor(target: string) {
      const
        basename = chopExtension(baseName(target)),
        targetProject = basename.toLowerCase();
      if (testPrefixesPerTarget.has(target)) {
        return testPrefixesPerTarget
          .get(target);
      }
      const
        config = env.resolveArray("DOTNET_TEST_PREFIXES");

      for (const item of config) {
        const [ project, prefix ] = item.split(":");
        if (project.toLowerCase() === targetProject) {
          testPrefixesPerTarget.set(targetProject, prefix);
          return prefix;
        }
      }

      testPrefixesPerTarget.set(targetProject, "");
      return "";
    }

    module.exports = {
      resolveTestPrefixFor
    };
  } catch (e) {
    console.error(`unable to set up test-utils: ${e}`);
  }
})();
