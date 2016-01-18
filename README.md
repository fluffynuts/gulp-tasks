# gulpy
Some gulp tasks and utilities for building and testing .net and Javascript projects, favouring convention over configuration.


## How to use this?

This is a starting-point which you can use (and track) to get gulp building your project fairly painlessly.
Here's what you do:

1) add this repo as a submodule of your repo, at the root level
2) copy the start/gulpfile.js to the root of your repo
3) override tasks by copying them to a new folder in parallel to the gulp-tasks folder, called override-tasks
    - edit them to your heart's content: you only have to edit the ones you want to change. 

Available tasks (at time of writing) include:

* default
    * this is the default task invoked if you just run gulp from the commandline. It should just contain a sequence of tasks to run for the default build
* build
    * builds all Visual Studio solutions\*
* clean
    * invokes the 'Clean' target in all Visual Studio solutions\*
* karma
    * runs karma in continuous testing mode\*\*
* test-javascript
    * runs karma in a single-run mode, recording coverage\*\*
* git-submodules
    * attempts to update all git submodules with the latest (HEAD) from the repositories they point at. Think along the lines of svn:externals
* nuget-restore
    * attempts to restore all nuget packages for all solutions\*. Requires nuget.exe in your path by default.
* sonar
    * attempts to run sonar in your project folder. Note that this task is highly dependant on a path to sonar, so you'll probably want to modify it to point at where you have Sonar installed.
* test-dotnet
    * attempts to run nunit tests from all Test projects, using a convention-over-configuration method: All assemblies that it can find which end in .Tests.dll are candidates for testing -- the ones selected must reside in the Debug build output of a corresponding project folder, ie SomeProject.Tests/bin/Debug/SomeProject.Tests.dll. The task will also look one up from this if the Debug folder isn't found, so you can use this against test projects which are Web projects at heart. \*\*\*
* cover-dotnet
    * attempts to run dotcover on your test assemblies. You will most likely want to edit this task to add exclusions for external libraries and such that your test project is using.


\* That can be found in the current folder or any descendant folders
\*\* Looking for (presently) a karma.conf.js in the same folder as the gulpfile. There are plans to make this task also seek out karma.conf.js files in descendant folders but the actual need hasn't arisen yet.
\*\*\* These tasks attempt to find the highest stable releases of their dependancies (dotcover.exe and nunit-console-{platform}.exe) according to default install paths by default.

## Convention over configuration

These tasks were designed to cater, unedited, for the majority of build requirements, for example:
* One main .sln file (though I don't see any reason multiple would be an issue)
* Test assemblies are named {Project}.Tests.dll
* karma.conf.js lives alongside your gulpfile (if running JavaScript tests)
* msbuild is set to build in x86 output using tools version 4.0 for Mono compatibility

However, these (and other) assumptions may not fit your needs. The ethos of the project is that, in
providing smaller task files, you can select only the ones you want and make changes to them if you
need to to suit your needs. If you really want to merge in upstream changes, it should be an easy
task because of the separation. It should also be easy to extend with your own tasks -- just add them
to the gulp-tasks folder and reference them in your default pipeline to have them run by default.

## Kudos

All of this is only possible because of Node, Gulp and all of the contributions for tasks and modules.
Before attempting to write your own pipelining module for Gulp, look online -- someone has quite
likely already done it. But if you *must*, then I highly recommend having a look at the 
gulp-nunit-runner module: it was the basis that I ripped off for the gulp-dotcover module (which I
probably should try to get into official npm sources at some point, but for now, it lives
under gulp-tasks/modules)
