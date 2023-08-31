"use strict";
(function () {
    const gulp = requireModule("gulp");
    /*
      Installs tooling into the solution folder, into the `tools` folder, or, if specified
      by the BUILD_TOOLS_FOLDER environment variable, there instead (in case you already have
      a `tools` folder which would cause confusion).
  
      If you don't need this step at all, copy this to your `local-tasks` folder and remove
      the dependency on "default-tools-installer".
  
      If you want the default functionality in addition to other functionality, have a look
      at how `default-tools-installer` works and implement your own custom logic inside the
      body of this task, copied off to your `local-tasks` folder
    */
    gulp.task("install-tools", "Installs the default tools for dotnet development", ["default-tools-installer"], () => {
        // replace this line with custom tooling installation
        return Promise.resolve();
    });
})();
