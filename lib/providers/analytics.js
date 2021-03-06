"use strict";
// The MIT License (MIT)
//
// Copyright (c) 2017 Firebase
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const cloud_functions_1 = require("../cloud-functions");
/** @internal */
exports.provider = 'google.analytics';
/** @internal */
exports.service = 'app-measurement.com';
/**
 * Select analytics events to listen to for events.
 * @param analyticsEventType Name of the analytics event type.
 */
function event(analyticsEventType) {
    return _eventWithOpts(analyticsEventType, {});
}
exports.event = event;
/** @internal */
function _eventWithOpts(analyticsEventType, opts) {
    return new AnalyticsEventBuilder(() => {
        if (!process.env.GCLOUD_PROJECT) {
            throw new Error('process.env.GCLOUD_PROJECT is not set.');
        }
        return ('projects/' + process.env.GCLOUD_PROJECT + '/events/' + analyticsEventType);
    }, opts);
}
exports._eventWithOpts = _eventWithOpts;
/**
 * The Firebase Analytics event builder interface.
 *
 * Access via [`functions.analytics.event()`](functions.analytics#event).
 */
class AnalyticsEventBuilder {
    /** @internal */
    constructor(triggerResource, opts) {
        this.triggerResource = triggerResource;
        this.opts = opts;
    }
    /**
     * Event handler that fires every time a Firebase Analytics event occurs.
     *
     * @param {!function(!functions.Event<!functions.analytics.AnalyticsEvent>)}
     *   handler Event handler that fires every time a Firebase Analytics event
     *   occurs.
     *
     * @return {!functions.CloudFunction<!functions.analytics.AnalyticsEvent>} A
     *   Cloud Function you can export.
     */
    onLog(handler) {
        const dataConstructor = (raw) => {
            return new AnalyticsEvent(raw.data);
        };
        return cloud_functions_1.makeCloudFunction({
            handler,
            provider: exports.provider,
            eventType: 'event.log',
            service: exports.service,
            legacyEventType: `providers/google.firebase.analytics/eventTypes/event.log`,
            triggerResource: this.triggerResource,
            dataConstructor,
            opts: this.opts,
        });
    }
}
exports.AnalyticsEventBuilder = AnalyticsEventBuilder;
/**
 * Interface representing a Firebase Analytics event that was logged for a specific user.
 */
class AnalyticsEvent {
    /** @internal */
    constructor(wireFormat) {
        this.params = {}; // In case of absent field, show empty (not absent) map.
        if (wireFormat.eventDim && wireFormat.eventDim.length > 0) {
            // If there's an eventDim, there'll always be exactly one.
            let eventDim = wireFormat.eventDim[0];
            copyField(eventDim, this, 'name');
            copyField(eventDim, this, 'params', p => _.mapValues(p, unwrapValue));
            copyFieldTo(eventDim, this, 'valueInUsd', 'valueInUSD');
            copyFieldTo(eventDim, this, 'date', 'reportingDate');
            copyTimestampToString(eventDim, this, 'timestampMicros', 'logTime');
            copyTimestampToString(eventDim, this, 'previousTimestampMicros', 'previousLogTime');
        }
        copyFieldTo(wireFormat, this, 'userDim', 'user', dim => new UserDimensions(dim));
    }
}
exports.AnalyticsEvent = AnalyticsEvent;
/**
 * Interface representing the user who triggered the events.
 */
class UserDimensions {
    /** @internal */
    constructor(wireFormat) {
        // These are interfaces or primitives, no transformation needed.
        copyFields(wireFormat, this, [
            'userId',
            'deviceInfo',
            'geoInfo',
            'appInfo',
        ]);
        // The following fields do need transformations of some sort.
        copyTimestampToString(wireFormat, this, 'firstOpenTimestampMicros', 'firstOpenTime');
        this.userProperties = {}; // With no entries in the wire format, present an empty (as opposed to absent) map.
        copyField(wireFormat, this, 'userProperties', r => _.mapValues(r, p => new UserPropertyValue(p)));
        copyField(wireFormat, this, 'bundleInfo', r => new ExportBundleInfo(r));
        // BUG(36000368) Remove when no longer necessary
        /* tslint:disable:no-string-literal */
        if (!this.userId && this.userProperties['user_id']) {
            this.userId = this.userProperties['user_id'].value;
        }
        /* tslint:enable:no-string-literal */
    }
}
exports.UserDimensions = UserDimensions;
/**
 * Predefined or custom properties stored on the client side.
 */
class UserPropertyValue {
    /** @internal */
    constructor(wireFormat) {
        copyField(wireFormat, this, 'value', unwrapValueAsString);
        copyTimestampToString(wireFormat, this, 'setTimestampUsec', 'setTime');
    }
}
exports.UserPropertyValue = UserPropertyValue;
/**
 * Interface representing the bundle in which these events were uploaded.
 */
class ExportBundleInfo {
    /** @internal */
    constructor(wireFormat) {
        copyField(wireFormat, this, 'bundleSequenceId');
        copyTimestampToMillis(wireFormat, this, 'serverTimestampOffsetMicros', 'serverTimestampOffset');
    }
}
exports.ExportBundleInfo = ExportBundleInfo;
function copyFieldTo(from, to, fromField, toField, transform = _.identity) {
    if (from[fromField] !== undefined) {
        to[toField] = transform(from[fromField]);
    }
}
function copyField(from, to, field, transform = _.identity) {
    copyFieldTo(from, to, field, field, transform);
}
function copyFields(from, to, fields) {
    for (let field of fields) {
        copyField(from, to, field);
    }
}
// The incoming payload will have fields like:
// {
//   'myInt': {
//     'intValue': '123'
//   },
//   'myDouble': {
//     'doubleValue': 1.0
//   },
//   'myFloat': {
//     'floatValue': 1.1
//   },
//   'myString': {
//     'stringValue': 'hi!'
//   }
// }
//
// The following method will remove these four types of 'xValue' fields, flattening them
// to just their values, as a string:
// {
//   'myInt': '123',
//   'myDouble': '1.0',
//   'myFloat': '1.1',
//   'myString': 'hi!'
// }
//
// Note that while 'intValue' will have a quoted payload, 'doubleValue' and 'floatValue' will not. This
// is due to the encoding library, which renders int64 values as strings to avoid loss of precision. This
// method always returns a string, similarly to avoid loss of precision, unlike the less-conservative
// 'unwrapValue' method just below.
function unwrapValueAsString(wrapped) {
    let key = _.keys(wrapped)[0];
    return _.toString(wrapped[key]);
}
// Ditto as the method above, but returning the values in the idiomatic JavaScript type (string for strings,
// number for numbers):
// {
//   'myInt': 123,
//   'myDouble': 1.0,
//   'myFloat': 1.1,
//   'myString': 'hi!'
// }
//
// The field names in the incoming xValue fields identify the type a value has, which for JavaScript's
// purposes can be divided into 'number' versus 'string'. This method will render all the numbers as
// JavaScript's 'number' type, since we prefer using idiomatic types. Note that this may lead to loss
// in precision for int64 fields, so use with care.
const xValueNumberFields = ['intValue', 'floatValue', 'doubleValue'];
function unwrapValue(wrapped) {
    let key = _.keys(wrapped)[0];
    let value = unwrapValueAsString(wrapped);
    return _.includes(xValueNumberFields, key) ? _.toNumber(value) : value;
}
// The JSON payload delivers timestamp fields as strings of timestamps denoted in microseconds.
// The JavaScript convention is to use numbers denoted in milliseconds. This method
// makes it easy to convert a field of one type into the other.
function copyTimestampToMillis(from, to, fromName, toName) {
    if (from[fromName] !== undefined) {
        to[toName] = _.round(from[fromName] / 1000);
    }
}
// The JSON payload delivers timestamp fields as strings of timestamps denoted in microseconds.
// In our SDK, we'd like to present timestamp as ISO-format strings. This method makes it easy
// to convert a field of one type into the other.
function copyTimestampToString(from, to, fromName, toName) {
    if (from[fromName] !== undefined) {
        to[toName] = new Date(from[fromName] / 1000).toISOString();
    }
}
