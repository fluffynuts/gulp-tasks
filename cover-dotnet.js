var gulp = requireModule('gulp-with-help'),
    dotCover = requireModule('gulp-dotcover');
gulp.task('cover-dotnet', 'Runs tests from projects matching *.Tests with DotCover coverage', function() {
    return gulp.src('**/*.Tests.dll')
             .pipe(dotCover({
                 debug: false,
                 architecture: 'x86',
                 exclude: ['FluentMigrator.*',
                            'PeanutButter.*',
                            'AutoMapper',
                            'AutoMapper.*',
                            'WindsorTestHelpers.*',
                            'MvcTestHelpers',
                            'TestUtils']
             }));
});

