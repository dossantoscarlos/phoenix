/*
 * GNU AGPL-3.0 License
 *
 * Copyright (c) 2021 - present core.ai . All rights reserved.
 * Original work Copyright (c) 2012 - 2021 Adobe Systems Incorporated. All rights reserved.
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License
 * for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see https://opensource.org/licenses/AGPL-3.0.
 *
 */

/*global describe, it, expect, beforeAll, afterAll, awaitsFor, awaitsForDone */

define(function (require, exports, module) {
    // Recommended to avoid reloading the integration test window Phoenix instance for each test.

    const SpecRunnerUtils     = require("spec/SpecRunnerUtils"),
        Strings             = require("strings");

    const testPath = SpecRunnerUtils.getTestPath("/spec/JSUtils-test-files");

    let FileViewController,     // loaded from brackets.test
        ProjectManager,         // loaded from brackets.test;
        MainViewManager,
        TaskManager,
        StatusBar,
        PreferencesManager,
        CommandManager,
        Commands,
        testWindow,
        brackets;


    describe("integration:TaskManager integration tests", function () {

        beforeAll(async function () {
            // do not use force option in brackets core integration tests. Tests are assumed to reuse the existing
            // test window instance for fast runs.
            testWindow = await SpecRunnerUtils.createTestWindowAndRun();
            brackets            = testWindow.brackets;
            FileViewController  = brackets.test.FileViewController;
            ProjectManager      = brackets.test.ProjectManager;
            MainViewManager     = brackets.test.MainViewManager;
            CommandManager      = brackets.test.CommandManager;
            Commands            = brackets.test.Commands;
            TaskManager         = brackets.test.TaskManager;
            StatusBar           = brackets.test.StatusBar;
            PreferencesManager  = brackets.test.PreferencesManager;

            await SpecRunnerUtils.loadProjectInTestWindow(testPath);
        }, 30000);

        afterAll(async function () {
            FileViewController  = null;
            ProjectManager      = null;
            testWindow = null;
            brackets = null;
            TaskManager = null;
            StatusBar = null;
            PreferencesManager = null;
            // comment out below line if you want to debug the test window post running tests
            await SpecRunnerUtils.closeTestWindow();
        }, 30000);

        function createAndTestSingleTask() {
            const task = TaskManager.addNewTask("title", "message");
            expect(testWindow.$("#status-tasks").is(":visible")).toBeTrue();
            task.close();
            expect(testWindow.$("#status-tasks").is(":visible")).toBeFalse();
        }

        it("Should task manager show in status bar for open file in project", async function () {
            await awaitsForDone(
                FileViewController.openAndSelectDocument(
                    testPath + "/simple.js",
                    FileViewController.PROJECT_MANAGER
                ));
            createAndTestSingleTask();
        });

        it("Should task manager show in status bar if no file in project", async function () {
            await awaitsForDone(CommandManager.execute(Commands.FILE_CLOSE_ALL, { _forceClose: true }),
                "closing all file");
            createAndTestSingleTask();
        });

        it("Should task manager show if legacy statusbar.showBusyIndicator", async function () {
            expect(testWindow.$("#status-tasks").is(":visible")).toBeFalse();
            StatusBar.showBusyIndicator();
            expect(testWindow.$("#status-tasks .btn-status-bar").is(":visible")).toBeTrue();
            testWindow.$("#status-tasks .btn-status-bar").click();
            expect(testWindow.$(".dropdown-status-bar").text()
                .includes(Strings.STATUSBAR_TASKS_UNKNOWN_EXTENSION_TASK)).toBeTrue();
            StatusBar.hideBusyIndicator();
            expect(testWindow.$("#status-tasks").is(":visible")).toBeFalse();
        });

        it("Should show popup on clicking statusbar", async function () {
            const task = TaskManager.addNewTask("title", "message");
            testWindow.$("#status-tasks .btn-status-bar").click();
            expect(testWindow.$(".dropdown-status-bar").is(":visible")).toBeTrue();
            expect(testWindow.$(".dropdown-status-bar").text().includes("title")).toBeTrue();
            expect(testWindow.$(".dropdown-status-bar").text().includes("message")).toBeTrue();
            task.close();
            expect(testWindow.$(".dropdown-status-bar").is(":visible")).toBeFalse();
        });

        it("Should add two tasks and show popup on clicking statusbar", async function () {
            const task1 = TaskManager.addNewTask("title1", "message1");
            const task2 = TaskManager.addNewTask("title2", "message2");
            testWindow.$("#status-tasks .btn-status-bar").click();
            expect(testWindow.$(".dropdown-status-bar").is(":visible")).toBeTrue();
            expect(testWindow.$(".dropdown-status-bar").text().includes("title1")).toBeTrue();
            expect(testWindow.$(".dropdown-status-bar").text().includes("message1")).toBeTrue();
            expect(testWindow.$(".dropdown-status-bar").text().includes("title2")).toBeTrue();
            expect(testWindow.$(".dropdown-status-bar").text().includes("message2")).toBeTrue();
            task1.close();
            expect(testWindow.$(".dropdown-status-bar").text().includes("title1")).toBeFalse();
            expect(testWindow.$(".dropdown-status-bar").text().includes("message1")).toBeFalse();
            expect(testWindow.$(".dropdown-status-bar").text().includes("title2")).toBeTrue();
            expect(testWindow.$(".dropdown-status-bar").text().includes("message2")).toBeTrue();
            task2.close();
            expect(testWindow.$(".dropdown-status-bar").is(":visible")).toBeFalse();
        });

        it("Should show/hide spinner icon", async function () {
            PreferencesManager.setViewState("StatusBar.HideSpinner", false);
            const task = TaskManager.addNewTask("title", "message");
            // click on task icon to open the popup
            testWindow.$("#status-tasks .btn-status-bar").click();
            expect(testWindow.$(".dropdown-status-bar").is(":visible")).toBeTrue();
            expect(testWindow.$("#status-tasks .spinner").is(":visible")).toBeTrue();
            // click on the hide spinner option which is at 2nd position with this setup
            testWindow.$('a[data-index="2"]').click();
            expect(testWindow.$("#status-tasks .spinner").is(":visible")).toBeFalse();

            // click on task icon to open the popup
            testWindow.$("#status-tasks .btn-status-bar").click();
            expect(testWindow.$(".dropdown-status-bar").is(":visible")).toBeTrue();
            testWindow.$('a[data-index="2"]').click();
            expect(testWindow.$("#status-tasks .spinner").is(":visible")).toBeTrue();

            task.close();
        });

        it("Should be able to change title, message, icon when popup is open", async function () {
            const task = TaskManager.addNewTask("title", "message", "oldImage");
            testWindow.$("#status-tasks .btn-status-bar").click();
            expect(testWindow.$(".dropdown-status-bar").is(":visible")).toBeTrue();
            task.setTitle("newTitle");
            expect(task.getTitle()).toBe("newTitle");
            task.setMessage("newMessage");
            expect(task.getMessage()).toBe("newMessage");
            task.setIconHTML("<image>testImage</image>");
            expect(testWindow.$(".dropdown-status-bar").text().includes("newTitle")).toBeTrue();
            expect(testWindow.$(".dropdown-status-bar").text().includes("newMessage")).toBeTrue();
            expect(testWindow.$(".dropdown-status-bar").text().includes("testImage")).toBeTrue();
            task.close();
            expect(testWindow.$(".dropdown-status-bar").is(":visible")).toBeFalse();
        });

        function getProgressPercent() {
            return Math.round((testWindow.$(".dropdown-status-bar .progress").width() /
                testWindow.$(".dropdown-status-bar .progress").parent().width()) * 100);
        }

        it("Should be able to add with progress percent", async function () {
            const progressPercent= 34;
            const task = TaskManager.addNewTask("title", "message", "oldImage", {
                progressPercent: progressPercent
            });
            testWindow.$("#status-tasks .btn-status-bar").click();
            expect(testWindow.$(".dropdown-status-bar").is(":visible")).toBeTrue();
            expect(getProgressPercent()).toBe(progressPercent);
            expect(testWindow.$(".dropdown-status-bar .progress").hasClass('progress-bar-foreground')).toBeTrue();
            task.close();
            expect(testWindow.$(".dropdown-status-bar").is(":visible")).toBeFalse();
        });

        it("Should be able to change progress percent when popup is open", async function () {
            const task = TaskManager.addNewTask("title", "message", "oldImage");
            testWindow.$("#status-tasks .btn-status-bar").click();
            expect(testWindow.$(".dropdown-status-bar").is(":visible")).toBeTrue();
            expect(testWindow.$(".dropdown-status-bar .progress").hasClass('progress-bar-foreground-pulse')).toBeTrue();
            task.setProgressPercent(0);
            expect(getProgressPercent()).toBe(100);
            expect(testWindow.$(".dropdown-status-bar .progress").hasClass('progress-bar-foreground-pulse')).toBeTrue();
            task.setProgressPercent(10);
            expect(getProgressPercent()).toBe(10);
            task.setProgressPercent(70);
            expect(getProgressPercent()).toBe(70);
            expect(testWindow.$(".dropdown-status-bar .progress").hasClass('progress-bar-foreground')).toBeTrue();
            task.close();
            expect(testWindow.$(".dropdown-status-bar").is(":visible")).toBeFalse();
        });

        it("Should be able to change progress percent when popup is closed", async function () {
            const task = TaskManager.addNewTask("title", "message", "oldImage");
            task.setProgressPercent(70);
            testWindow.$("#status-tasks .btn-status-bar").click();
            expect(testWindow.$(".dropdown-status-bar").is(":visible")).toBeTrue();

            expect(getProgressPercent()).toBe(70);
            expect(testWindow.$(".dropdown-status-bar .progress").hasClass('progress-bar-foreground')).toBeTrue();
            task.close();
            expect(testWindow.$(".dropdown-status-bar").is(":visible")).toBeFalse();
        });

        it("Should be able to set progress to success", async function () {
            const task = TaskManager.addNewTask("title", "message");
            task.setSucceded();
            testWindow.$("#status-tasks .btn-status-bar").click();
            expect(testWindow.$(".dropdown-status-bar").is(":visible")).toBeTrue();
            expect(getProgressPercent()).toBe(100);
            expect(testWindow.$(".dropdown-status-bar .progress").hasClass('progress-bar-foreground-success')).toBeTrue();
            task.close();
            expect(testWindow.$(".dropdown-status-bar").is(":visible")).toBeFalse();
        });

        it("Should be able to set progress to failed", async function () {
            const task = TaskManager.addNewTask("title", "message");
            task.setFailed();
            testWindow.$("#status-tasks .btn-status-bar").click();
            expect(testWindow.$(".dropdown-status-bar").is(":visible")).toBeTrue();
            expect(getProgressPercent()).toBe(100);
            expect(testWindow.$(".dropdown-status-bar .progress").hasClass('progress-bar-foreground-failure')).toBeTrue();
            task.close();
            expect(testWindow.$(".dropdown-status-bar").is(":visible")).toBeFalse();
        });

        it("Should be able to reset progress after task failed", async function () {
            const task = TaskManager.addNewTask("title", "message");
            task.setFailed();
            testWindow.$("#status-tasks .btn-status-bar").click();
            expect(testWindow.$(".dropdown-status-bar").is(":visible")).toBeTrue();
            expect(getProgressPercent()).toBe(100);
            expect(testWindow.$(".dropdown-status-bar .progress").hasClass('progress-bar-foreground-failure')).toBeTrue();

            // now try to set progress to reset the failure
            task.setProgressPercent(70);
            expect(getProgressPercent()).toBe(70);
            expect(testWindow.$(".dropdown-status-bar .progress").hasClass('progress-bar-foreground')).toBeTrue();

            task.close();
            expect(testWindow.$(".dropdown-status-bar").is(":visible")).toBeFalse();
        });

        const iconMapShow = {
            ".close-icon": "showStopIcon",
            ".pause-icon": "showPauseIcon",
            ".play-icon": "showPlayIcon",
            ".retry-icon": "showRestartIcon"
        };
        const iconMapHide = {
            ".close-icon": "hideStopIcon",
            ".pause-icon": "hidePauseIcon",
            ".play-icon": "hidePlayIcon",
            ".retry-icon": "hideRestartIcon"
        };
        function testIcons(iconClass, showFn, hideFn) {
            const task = TaskManager.addNewTask("title", "message");
            task.setFailed();
            testWindow.$("#status-tasks .btn-status-bar").click();
            expect(testWindow.$(".dropdown-status-bar").is(":visible")).toBeTrue();

            expect(testWindow.$(`.dropdown-status-bar ${iconClass}`).is(":visible")).toBeFalse();
            task[showFn]("tooltip");
            expect(testWindow.$(`.dropdown-status-bar ${iconClass}`).is(":visible")).toBeTrue();
            task[hideFn]();
            expect(testWindow.$(`.dropdown-status-bar ${iconClass}`).is(":visible")).toBeFalse();
            task[showFn]("tooltip changed");
            expect(testWindow.$(`.dropdown-status-bar ${iconClass}`).is(":visible")).toBeTrue();
            expect(testWindow.$(`.dropdown-status-bar ${iconClass}`).attr("title")).toBe("tooltip changed");

            task.close();
            expect(testWindow.$(".dropdown-status-bar").is(":visible")).toBeFalse();
        }

        for(let iconClass of Object.keys(iconMapShow)){
            it(`Should be able to show and hide ${iconClass} button`, function(){
                testIcons(iconClass, iconMapShow[iconClass], iconMapHide[iconClass]);
            });
        }
    });
});