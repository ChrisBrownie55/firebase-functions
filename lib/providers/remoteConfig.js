"use strict";
// The MIT License (MIT)
//
// Copyright (c) 2018 Firebase
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
Object.defineProperty(exports, "__esModule", { value: true });
const cloud_functions_1 = require("../cloud-functions");
/** @internal */
exports.provider = 'google.firebase.remoteconfig';
/** @internal */
exports.service = 'firebaseremoteconfig.googleapis.com';
/**
 * Handle all updates (including rollbacks) that affect a Remote Config project.
 * @param handler A function that takes the updated Remote Config template
 * version metadata as an argument.
 */
function onUpdate(handler) {
    return _onUpdateWithOpts(handler, {});
}
exports.onUpdate = onUpdate;
/** @internal */
function _onUpdateWithOpts(handler, opts) {
    const triggerResource = () => {
        if (!process.env.GCLOUD_PROJECT) {
            throw new Error('process.env.GCLOUD_PROJECT is not set.');
        }
        return `projects/${process.env.GCLOUD_PROJECT}`;
    };
    return new UpdateBuilder(triggerResource, opts).onUpdate(handler);
}
exports._onUpdateWithOpts = _onUpdateWithOpts;
/** Builder used to create Cloud Functions for Remote Config. */
class UpdateBuilder {
    /** @internal */
    constructor(triggerResource, opts) {
        this.triggerResource = triggerResource;
        this.opts = opts;
    }
    /**
     * Handle all updates (including rollbacks) that affect a Remote Config
     * project.
     * @param handler A function that takes the updated Remote Config template
     * version metadata as an argument.
     */
    onUpdate(handler) {
        return cloud_functions_1.makeCloudFunction({
            handler,
            provider: exports.provider,
            service: exports.service,
            triggerResource: this.triggerResource,
            eventType: 'update',
            opts: this.opts,
        });
    }
}
exports.UpdateBuilder = UpdateBuilder;
