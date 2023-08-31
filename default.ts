(function() {
    const
        gulp = requireModule<Gulp>("gulp"),
        gutil = requireModule<GulpUtil>("gulp-util"),
        runSequence = requireModule<RunSequence>("run-sequence");

    gulp.task("default", "Purges, updates git submodules, builds, covers dotnet", function() {
        runSequence("purge", "build", "cover-dotnet", "generate-reports", function(err: any) {
            return new Promise<void>(function(resolve, reject) {
                if (err) {
                    gutil.log(gutil.colors.red(gutil.colors.bold(err)));
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    });
})();
