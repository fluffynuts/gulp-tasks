"use strict";
var gulp = require('gulp'),
	jshint = require('gulp-jshint'),
	filter = require('gulp-filter'),
	mocha = require('gulp-mocha');

gulp.task('lint', function () {
	return gulp.src('**/*.js')
		.pipe(filter(['*', '!node_modules/**/*']))
		.pipe(jshint({node: true}))
		.pipe(jshint.reporter('default'));
});

gulp.task('test', gulp.series('lint'), function () {
	gulp.src('test/*.js', {read: false})
		.pipe(mocha({reporter: 'spec', ui: 'bdd'}));
});

gulp.task('default', gulp.series('test'), function() {
	return Promise.resolve();
});

gulp.task('watch', function () {
	gulp.watch(['**/*.js', '!node_modules/**/*.js'], ['test']);
});

