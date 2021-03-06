"use strict";
// The MIT License (MIT)
//
// Copyright (c) 2017 Firebase
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
Object.defineProperty(exports, "__esModule", { value: true });
const cloud_functions_1 = require("../cloud-functions");
/** @internal */
exports.provider = 'google.pubsub';
/** @internal */
exports.service = 'pubsub.googleapis.com';
/** Select Cloud Pub/Sub topic to listen to.
 * @param topic Name of Pub/Sub topic, must belong to the same project as the function.
 */
function topic(topic) {
    return _topicWithOpts(topic, {});
}
exports.topic = topic;
/** @internal */
function _topicWithOpts(topic, opts) {
    if (topic.indexOf('/') !== -1) {
        throw new Error('Topic name may not have a /');
    }
    return new TopicBuilder(() => {
        if (!process.env.GCLOUD_PROJECT) {
            throw new Error('process.env.GCLOUD_PROJECT is not set.');
        }
        return `projects/${process.env.GCLOUD_PROJECT}/topics/${topic}`;
    }, opts);
}
exports._topicWithOpts = _topicWithOpts;
function schedule(schedule) {
    return _scheduleWithOpts(schedule, {});
}
exports.schedule = schedule;
class ScheduleBuilder {
    /** @internal */
    constructor(schedule, opts) {
        this.schedule = schedule;
        this.opts = opts;
        this._opts = Object.assign({ schedule }, opts);
    }
    retryConfig(config) {
        this._opts.schedule.retryConfig = config;
        return this;
    }
    timeZone(timeZone) {
        this._opts.schedule.timeZone = timeZone;
        return this;
    }
    onRun(handler) {
        const triggerResource = () => {
            if (!process.env.GCLOUD_PROJECT) {
                throw new Error('process.env.GCLOUD_PROJECT is not set.');
            }
            return `projects/${process.env.GCLOUD_PROJECT}/topics`; // The CLI will append the correct topic name based on region and function name
        };
        const cloudFunction = cloud_functions_1.makeCloudFunction({
            contextOnlyHandler: handler,
            provider: exports.provider,
            service: exports.service,
            triggerResource: triggerResource,
            eventType: 'topic.publish',
            opts: this._opts,
            labels: { 'deployment-scheduled': 'true' },
        });
        return cloudFunction;
    }
}
exports.ScheduleBuilder = ScheduleBuilder;
/** @internal */
function _scheduleWithOpts(schedule, opts) {
    return new ScheduleBuilder({ schedule }, opts);
}
exports._scheduleWithOpts = _scheduleWithOpts;
/** Builder used to create Cloud Functions for Google Pub/Sub topics. */
class TopicBuilder {
    /** @internal */
    constructor(triggerResource, opts) {
        this.triggerResource = triggerResource;
        this.opts = opts;
    }
    /** Handle a Pub/Sub message that was published to a Cloud Pub/Sub topic */
    onPublish(handler) {
        return cloud_functions_1.makeCloudFunction({
            handler,
            provider: exports.provider,
            service: exports.service,
            triggerResource: this.triggerResource,
            eventType: 'topic.publish',
            dataConstructor: raw => new Message(raw.data),
            opts: this.opts,
        });
    }
}
exports.TopicBuilder = TopicBuilder;
/**
 * A Pub/Sub message.
 *
 * This class has an additional .json helper which will correctly deserialize any
 * message that was a JSON object when published with the JS SDK. .json will throw
 * if the message is not a base64 encoded JSON string.
 */
class Message {
    constructor(data) {
        [this.data, this.attributes, this._json] = [
            data.data,
            data.attributes || {},
            data.json,
        ];
    }
    get json() {
        if (typeof this._json === 'undefined') {
            this._json = JSON.parse(new Buffer(this.data, 'base64').toString('utf8'));
        }
        return this._json;
    }
    toJSON() {
        return {
            data: this.data,
            attributes: this.attributes,
        };
    }
}
exports.Message = Message;
