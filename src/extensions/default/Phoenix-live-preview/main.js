/*
 * GNU AGPL-3.0 License
 *
 * Copyright (c) 2021 - present core.ai . All rights reserved.
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
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets */
//jshint-ignore:no-start

define(function (require, exports, module) {
    let ExtensionUtils     = brackets.getModule("utils/ExtensionUtils"),
        WorkspaceManager   = brackets.getModule("view/WorkspaceManager"),
        AppInit            = brackets.getModule("utils/AppInit"),
        ProjectManager     = brackets.getModule("project/ProjectManager"),
        EditorManager      = brackets.getModule("editor/EditorManager"),
        Strings            = brackets.getModule("strings"),
        Mustache           = brackets.getModule("thirdparty/mustache/mustache"),
        utils = require('utils');


    // Templates
    var panelHTML       = require("text!panel.html");
    ExtensionUtils.loadStyleSheet(module, "extension-store.css");

    // jQuery objects
    var $icon,
        $iframe,
        $panel;

    // Other vars
    var panel;

    function _setPanelVisibility(isVisible) {
        if (isVisible) {
            $icon.toggleClass("active");

            panel.show();

        } else {
            $icon.toggleClass("active");
            panel.hide();
        }
    }

    function _toggleVisibility() {
        let visible = !panel.isVisible();
        _setPanelVisibility(visible);
    }

    function _setTitle(fileName) {
        let message = Strings.LIVE_DEV_SELECT_FILE_TO_PREVIEW;
        if(fileName){
            message = `${fileName} - ${Strings.LIVE_DEV_STATUS_TIP_OUT_OF_SYNC}`;
        }
        document.getElementById("panel-live-preview-title").textContent = `${message}`;
    }

    async function _createExtensionPanel() {
        let templateVars = {
            Strings: Strings,
            livePreview: Strings.LIVE_DEV_STATUS_TIP_OUT_OF_SYNC
        };
        const PANEL_MIN_SIZE = 50;
        $icon = $("#toolbar-go-live");
        $icon.click(_toggleVisibility);
        $panel = $(Mustache.render(panelHTML, templateVars));
        $iframe = $panel.find("#panel-live-preview-frame");
        $iframe[0].onload = function () {
            $iframe.attr('srcdoc', null);
        };
        let previewDetails = await utils.getPreviewDetails();
        $iframe.attr('src', previewDetails.URL);

        panel = WorkspaceManager.createPluginPanel("live-preview-panel", $panel, PANEL_MIN_SIZE, $icon);

        WorkspaceManager.recomputeLayout(false);
        _setTitle(previewDetails.filePath);
    }

    let savedScrollPositions = {};
    async function _loadPreview(force) {
        if(panel.isVisible()){
            let scrollX = $iframe[0].contentWindow.scrollX;
            let scrollY = $iframe[0].contentWindow.scrollY;
            let currentSrc = $iframe[0].src;
            savedScrollPositions[currentSrc] = {
                scrollX: scrollX,
                scrollY: scrollY
            };
            // panel-live-preview-title
            let previewDetails = await utils.getPreviewDetails();
            let newSrc = encodeURI(previewDetails.URL);
            $iframe[0].onload = function () {
                if(currentSrc === newSrc){
                    $iframe[0].contentWindow.scrollTo(scrollX, scrollY);
                } else {
                    let savedPositions = savedScrollPositions[newSrc];
                    if(savedPositions){
                        $iframe[0].contentWindow.scrollTo(savedPositions.scrollX, savedPositions.scrollY);
                    }
                }
            };
            if(currentSrc !== newSrc || force){
                $iframe.attr('src', previewDetails.URL);
                _setTitle(previewDetails.filePath);
            }
        }
    }

    function _projectFileChanges(evt, changedFile) {
        if(changedFile.fullPath !== '/fs/app/state.json'){
            // we are getting this change event somehow.
            // bug, investigate why we get this change event as a project file change.
            _loadPreview(true);
        }
    }

    AppInit.appReady(function () {
        _createExtensionPanel();
        ProjectManager.on(ProjectManager.EVENT_PROJECT_OPEN, _loadPreview);
        ProjectManager.on(ProjectManager.EVENT_PROJECT_FILE_CHANGED, _projectFileChanges);
        EditorManager.on("activeEditorChange", _loadPreview);
        // We always show the live preview panel on startup if there is a preview file
        setTimeout(async ()=>{
            let previewDetails = await utils.getPreviewDetails();
            if(previewDetails.filePath){
                // only show if there is some file to preview and not the default no-preview preview on startup
                _setPanelVisibility(true);
            }
        }, 1000);
    });
});

