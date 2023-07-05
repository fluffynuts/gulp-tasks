# gulp-tasks
### A gulp starter-pack
---



Some gulp tasks and utilities for building and testing .net and Javascript projects, favouring convention over configuration.
     * Disclaimer: yes, I realise that this is a very opinionated take on the problem. *
           * Feel free to submit requests (or better yet, pull requests) *


## How to use this?

This is a starting-point which you can use (and track) to get gulp building your project fairly painlessly.
Here's what you do:

1. add this repo as a submodule of your repo, at the root level
2. copy `start/gulpfile.js` to the root of your repo
3. run `node gulpfile.js` in the root of your repo. This should guide you through:
    - initializing a `package.json` with your repo's details
    - installing the node modules required by `gulp-tasks` to run
    - setting up two npm scripts:
      - `gulp` which can be used to run gulp commands without a globally-installed gulp. Simply do something like `npm run gulp {taskname}`
      - `test` which will run the `test-dotnet` task from `gulp-tasks`
4. if you know some gulp, you may augment tasks by creating new tasks in the `local-tasks` folder parallel to the `gulp-tasks` folder
5. override provided tasks by copying them to the `local-tasks` folder
    - edit them to your heart's content: you only have to edit the ones you want to change.
6. First time: run `npm install` to install required modules
7. Either:
    - run `node node_modules/gulp/bin/gulp.js` OR
    - install gulp globally with `npm install -g gulp` and then run `gulp`

## Assumptions
1. You're using MSBuild to build your stuff and Visual Studio for development (at least somewhere, so you get .sln files)
- You're using NUnit for testing
- You're using (or capable of installing) dotCover CLI (not required, but used by default)


## What's in the box?

Available tasks (at time of writing) include:

- default
    - this is the default task invoked if you just run gulp from the commandline. It should just contain a sequence of tasks to run for the default build
    - the default will attempt:
        * purge: remove all binary artifacts in bin and obj folders
        * git-submodules: pull latest for any submodules
        * install nuget packages for all solutions in the repo
        * install tooling required by shell `install-tools` task
        * build: msbuild your solution(s): all .sln files in the repo
        * cover-dotnet: run all NUnit tests through dotCover (searches for dotCover and NUnit in
            expected locations)
        * run shell `generate-reports` task to output pretty reports.
- build
    - builds all Visual Studio solutions\*
- clean
    - invokes the 'Clean' target in all Visual Studio solutions\*
- test-javascript
    - runs karma in a single-run mode, recording coverage\*\*
- git-submodules
    - attempts to update all git submodules with the latest (HEAD) from the repositories they
        point at. Think along the lines of svn:externals
- nuget-restore
    - attempts to restore all nuget packages for all solutions\*. Will download it's own
    `nuget.exe` unless you specify otherwise.
- test-dotnet
    - (currently) attempts to run nunit tests from all Test projects, using a
        convention-over-configuration method: All assemblies that it can find which end in
        .Tests.dll are candidates for testing -- the ones selected must reside in the Debug build
        output of a corresponding project folder, ie
        `SomeProject.Tests/bin/Debug/SomeProject.Tests.dll`. The task will also look one up from
        this if the Debug folder isn't found, so you can use this against test projects which are
        Web projects at heart. \*\*\*
- cover-dotnet
    - attempts to run tests with coverage on your test assemblies. You will most likely want to
      edit this task to add exclusions for external libraries and such that your test project is
      using, though the defaults are sane. Will attempt to find installed or local dotCover
      or OpenCover to run coverage with
- install-tools (now a default part of the pipeline - see the `install-tools.js` file for information on how to disable this task, if it's not interesting to you)
    - install local build tools to the tools/ folder in your solution (by default, can be overridden by the BUILD_TOOLS_FOLDER environment variable)
    - depends on `default-tools-installer`, providing:
        - nunit.console
        - opencover
        - reportgenerator
- shell tasks (have no default behavior, but hook into the build pipeline):
    - generate-reports
        - generate reports after building
        - you can get sane behavior by creating a local task which depends on
            `default-report-generator` which uses reportgenerator to give
            html coverage reports.


\* That can be found in the current folder or any descendant folders
\*\* Looking for (presently) a karma.conf.js in the same folder as the gulpfile. There are plans to make this task also seek out karma.conf.js files in descendant folders but the actual need hasn't arisen yet.
\*\*\* These tasks attempt to find the highest stable releases of their dependancies (dotcover.exe and nunit-console-{platform}.exe) according to default install paths by default.

## Shell tasks
Shell tasks do nothing out of the box. You have to opt into the default behavior or write your
own. If you think that the default behavior is what you want, create a task which simply depends
on the default behavior. For example, if you want local tooling and reports out of the box, you
could create `local-tasks/use-default-tasks.js` with:
```
const gulp = requireModule("gulp");
gulp.task("generate-reports", "Generate coverage reports", ["default-report-generator"]);
```

The default behaviors here are left out so as not to interfere with existing users. `install-tools` has been included by default now that I find I need it more often than not. Anyone who updates their reference to `gulp-tasks` and sees extra stuff being done should follow the instructions in `install-tools.js`.

## Using modules from `gulp-tasks`
If you want to use any of the modules found under `gulp-tasks/modules`, make use of the
globally-available `requireModule` function. Some available modules include:
- `gulp`
    - uses `gulp-help` (for v3 gulp) to provide a modified `gulp` where a second parameter can
        be provided to give useful help. Read more on the `gulp-help` documentation.
- `http-client`
    - provides a simple async http downloading class
- `spawn`, `exec`
    - provides fairly safe ways to start processes on Windows
- others can be seen in use in provided tasks

## Convention over configuration

These tasks were designed to cater, unedited, for the majority of build requirements\*, for example:
- One main .sln file (if you have multiple, *all* are built -- override in your own build.js)
- Test assemblies are named {Project}.Tests.dll (this is important: the test assembly collector will be quite stoic about it)
- karma.conf.js lives alongside your gulpfile (if running JavaScript tests)
- msbuild is set to build in x86 output using tools version 4.0 for Mono compatibility

However, these (and other) assumptions may not fit your needs. The ethos of the project is that, in
providing smaller task files, you can select only the ones you want and make changes to them if you
need to to suit your needs. If you really want to merge in upstream changes, it should be an easy
task because of the separation. It should also be easy to extend with your own tasks -- just add them
to the gulp-tasks folder and reference them in your default pipeline to have them run by default.


## Kudos

All of this is only possible because of Node, Gulp and all of the contributions for tasks and modules,
not to mention NUnit and dotCover (both free and excellent).
Before attempting to write your own pipelining module for Gulp, look online -- someone has quite
likely already done it. But if you *must*, then I highly recommend having a look at the
gulp-nunit-runner module: it was the basis that I ripped off for the gulp-dotnetcover module (which I
probably should try to get into official npm sources at some point, but for now, it lives
under gulp-tasks/modules)
