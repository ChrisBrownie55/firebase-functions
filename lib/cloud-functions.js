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
const _ = require("lodash");
const WILDCARD_REGEX = new RegExp('{[^/{}]*}', 'g');
/** Change describes a change of state - "before" represents the state prior
 * to the event, "after" represents the state after the event.
 */
class Change {
    constructor(before, after) {
        this.before = before;
        this.after = after;
    }
}
exports.Change = Change;
(function (Change) {
    function reinterpretCast(x) {
        return x;
    }
    /** Factory method for creating a Change from a `before` object and an `after` object. */
    function fromObjects(before, after) {
        return new Change(before, after);
    }
    Change.fromObjects = fromObjects;
    /** Factory method for creating a Change from a JSON and an optional customizer function to be
     * applied to both the `before` and the `after` fields.
     */
    function fromJSON(json, customizer = reinterpretCast) {
        let before = _.assign({}, json.before);
        if (json.fieldMask) {
            before = applyFieldMask(before, json.after, json.fieldMask);
        }
        return Change.fromObjects(customizer(before || {}), customizer(json.after || {}));
    }
    Change.fromJSON = fromJSON;
    /** @internal */
    function applyFieldMask(sparseBefore, after, fieldMask) {
        let before = _.assign({}, after);
        let masks = fieldMask.split(',');
        _.forEach(masks, mask => {
            const val = _.get(sparseBefore, mask);
            if (typeof val === 'undefined') {
                _.unset(before, mask);
            }
            else {
                _.set(before, mask, val);
            }
        });
        return before;
    }
    Change.applyFieldMask = applyFieldMask;
})(Change = exports.Change || (exports.Change = {}));
/** @internal */
function makeCloudFunction({ provider, eventType, triggerResource, service, dataConstructor = (raw) => raw.data, handler, contextOnlyHandler, before = () => {
    return;
}, after = () => {
    return;
}, legacyEventType, opts = {}, labels = {}, }) {
    let cloudFunction;
    let cloudFunctionNewSignature = (data, context) => {
        if (legacyEventType && context.eventType === legacyEventType) {
            // v1beta1 event flow has different format for context, transform them to new format.
            context.eventType = provider + '.' + eventType;
            context.resource = {
                service: service,
                name: context.resource,
            };
        }
        let event = {
            data,
            context,
        };
        if (provider === 'google.firebase.database') {
            context.authType = _detectAuthType(event);
            if (context.authType !== 'ADMIN') {
                context.auth = _makeAuth(event, context.authType);
            }
            else {
                delete context.auth;
            }
        }
        if (triggerResource() == null) {
            Object.defineProperty(context, 'params', {
                get: () => {
                    throw new Error('context.params is not available when using the handler namespace.');
                },
            });
        }
        else {
            context.params = context.params || _makeParams(context, triggerResource);
        }
        before(event);
        let promise;
        if (labels && labels['deployment-scheduled']) {
            // Scheduled function do not have meaningful data, so exclude it
            promise = contextOnlyHandler(context);
        }
        else {
            const dataOrChange = dataConstructor(event);
            promise = handler(dataOrChange, context);
        }
        if (typeof promise === 'undefined') {
            console.warn('Function returned undefined, expected Promise or value');
        }
        return Promise.resolve(promise)
            .then(result => {
            after(event);
            return result;
        })
            .catch(err => {
            after(event);
            return Promise.reject(err);
        });
    };
    if (process.env.X_GOOGLE_NEW_FUNCTION_SIGNATURE === 'true') {
        cloudFunction = cloudFunctionNewSignature;
    }
    else {
        cloudFunction = (raw) => {
            let context;
            // In Node 6 runtime, function called with single event param
            let data = _.get(raw, 'data');
            if (isEvent(raw)) {
                // new eventflow v1beta2 format
                context = _.cloneDeep(raw.context);
            }
            else {
                // eventflow v1beta1 format
                context = _.omit(raw, 'data');
            }
            return cloudFunctionNewSignature(data, context);
        };
    }
    Object.defineProperty(cloudFunction, '__trigger', {
        get: () => {
            if (triggerResource() == null) {
                return {};
            }
            let trigger = _.assign(optsToTrigger(opts), {
                eventTrigger: {
                    resource: triggerResource(),
                    eventType: legacyEventType || provider + '.' + eventType,
                    service,
                },
            });
            if (!_.isEmpty(labels)) {
                trigger.labels = labels;
            }
            return trigger;
        },
    });
    cloudFunction.run = handler || contextOnlyHandler;
    return cloudFunction;
}
exports.makeCloudFunction = makeCloudFunction;
function isEvent(event) {
    return _.has(event, 'context');
}
function _makeParams(context, triggerResourceGetter) {
    if (context.params) {
        // In unit testing, user may directly provide `context.params`.
        return context.params;
    }
    if (!context.resource) {
        // In unit testing, `resource` may be unpopulated for a test event.
        return {};
    }
    let triggerResource = triggerResourceGetter();
    let wildcards = triggerResource.match(WILDCARD_REGEX);
    let params = {};
    if (wildcards) {
        let triggerResourceParts = _.split(triggerResource, '/');
        let eventResourceParts = _.split(context.resource.name, '/');
        _.forEach(wildcards, wildcard => {
            let wildcardNoBraces = wildcard.slice(1, -1);
            let position = _.indexOf(triggerResourceParts, wildcard);
            params[wildcardNoBraces] = eventResourceParts[position];
        });
    }
    return params;
}
function _makeAuth(event, authType) {
    if (authType === 'UNAUTHENTICATED') {
        return null;
    }
    return {
        uid: _.get(event, 'context.auth.variable.uid'),
        token: _.get(event, 'context.auth.variable.token'),
    };
}
function _detectAuthType(event) {
    if (_.get(event, 'context.auth.admin')) {
        return 'ADMIN';
    }
    if (_.has(event, 'context.auth.variable')) {
        return 'USER';
    }
    return 'UNAUTHENTICATED';
}
function optsToTrigger(opts) {
    let trigger = {};
    if (opts.regions) {
        trigger.regions = opts.regions;
    }
    if (opts.timeoutSeconds) {
        trigger.timeout = opts.timeoutSeconds.toString() + 's';
    }
    if (opts.memory) {
        const memoryLookup = {
            '128MB': 128,
            '256MB': 256,
            '512MB': 512,
            '1GB': 1024,
            '2GB': 2048,
        };
        trigger.availableMemoryMb = _.get(memoryLookup, opts.memory);
    }
    if (opts.schedule) {
        trigger.schedule = opts.schedule;
    }
    return trigger;
}
exports.optsToTrigger = optsToTrigger;
