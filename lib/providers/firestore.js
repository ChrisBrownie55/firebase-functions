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
const path_1 = require("path");
const _ = require("lodash");
const firebase = require("firebase-admin");
const apps_1 = require("../apps");
const cloud_functions_1 = require("../cloud-functions");
const encoder_1 = require("../encoder");
/** @internal */
exports.provider = 'google.firestore';
/** @internal */
exports.service = 'firestore.googleapis.com';
/** @internal */
exports.defaultDatabase = '(default)';
let firestoreInstance;
/**
 * Select the Firestore document to listen to for events.
 * @param path Full database path to listen to. This includes the name of
 * the collection that the document is a part of. For example, if the
 * collection is named "users" and the document is named "Ada", then the
 * path is "/users/Ada".
 */
function document(path) {
    return _documentWithOpts(path, {});
}
exports.document = document;
/** @internal */
// Multiple namespaces are not yet supported by Firestore.
function namespace(namespace) {
    return _namespaceWithOpts(namespace, {});
}
exports.namespace = namespace;
/** @internal */
// Multiple databases are not yet supported by Firestore.
function database(database) {
    return _databaseWithOpts(database, {});
}
exports.database = database;
/** @internal */
function _databaseWithOpts(database = exports.defaultDatabase, opts) {
    return new DatabaseBuilder(database, opts);
}
exports._databaseWithOpts = _databaseWithOpts;
/** @internal */
function _namespaceWithOpts(namespace, opts) {
    return _databaseWithOpts(exports.defaultDatabase, opts).namespace(namespace);
}
exports._namespaceWithOpts = _namespaceWithOpts;
/** @internal */
function _documentWithOpts(path, opts) {
    return _databaseWithOpts(exports.defaultDatabase, opts).document(path);
}
exports._documentWithOpts = _documentWithOpts;
class DatabaseBuilder {
    /** @internal */
    constructor(database, opts) {
        this.database = database;
        this.opts = opts;
    }
    namespace(namespace) {
        return new NamespaceBuilder(this.database, this.opts, namespace);
    }
    document(path) {
        return new NamespaceBuilder(this.database, this.opts).document(path);
    }
}
exports.DatabaseBuilder = DatabaseBuilder;
class NamespaceBuilder {
    /** @internal */
    constructor(database, opts, namespace) {
        this.database = database;
        this.opts = opts;
        this.namespace = namespace;
    }
    document(path) {
        return new DocumentBuilder(() => {
            if (!process.env.GCLOUD_PROJECT) {
                throw new Error('process.env.GCLOUD_PROJECT is not set.');
            }
            let database = path_1.posix.join('projects', process.env.GCLOUD_PROJECT, 'databases', this.database);
            return path_1.posix.join(database, this.namespace ? `documents@${this.namespace}` : 'documents', path);
        }, this.opts);
    }
}
exports.NamespaceBuilder = NamespaceBuilder;
function _getValueProto(data, resource, valueFieldName) {
    if (_.isEmpty(_.get(data, valueFieldName))) {
        // Firestore#snapshot_ takes resource string instead of proto for a non-existent snapshot
        return resource;
    }
    let proto = {
        fields: _.get(data, [valueFieldName, 'fields'], {}),
        createTime: encoder_1.dateToTimestampProto(_.get(data, [valueFieldName, 'createTime'])),
        updateTime: encoder_1.dateToTimestampProto(_.get(data, [valueFieldName, 'updateTime'])),
        name: _.get(data, [valueFieldName, 'name'], resource),
    };
    return proto;
}
/** @internal */
function snapshotConstructor(event) {
    if (!firestoreInstance) {
        firestoreInstance = firebase.firestore(apps_1.apps().admin);
    }
    let valueProto = _getValueProto(event.data, event.context.resource.name, 'value');
    let readTime = encoder_1.dateToTimestampProto(_.get(event, 'data.value.readTime'));
    return firestoreInstance.snapshot_(valueProto, readTime, 'json');
}
exports.snapshotConstructor = snapshotConstructor;
/** @internal */
// TODO remove this function when wire format changes to new format
function beforeSnapshotConstructor(event) {
    if (!firestoreInstance) {
        firestoreInstance = firebase.firestore(apps_1.apps().admin);
    }
    let oldValueProto = _getValueProto(event.data, event.context.resource.name, 'oldValue');
    let oldReadTime = encoder_1.dateToTimestampProto(_.get(event, 'data.oldValue.readTime'));
    return firestoreInstance.snapshot_(oldValueProto, oldReadTime, 'json');
}
exports.beforeSnapshotConstructor = beforeSnapshotConstructor;
function changeConstructor(raw) {
    return cloud_functions_1.Change.fromObjects(beforeSnapshotConstructor(raw), snapshotConstructor(raw));
}
class DocumentBuilder {
    /** @internal */
    constructor(triggerResource, opts) {
        this.triggerResource = triggerResource;
        this.opts = opts;
        // TODO what validation do we want to do here?
    }
    /** Respond to all document writes (creates, updates, or deletes). */
    onWrite(handler) {
        return this.onOperation(handler, 'document.write', changeConstructor);
    }
    /** Respond only to document updates. */
    onUpdate(handler) {
        return this.onOperation(handler, 'document.update', changeConstructor);
    }
    /** Respond only to document creations. */
    onCreate(handler) {
        return this.onOperation(handler, 'document.create', snapshotConstructor);
    }
    /** Respond only to document deletions. */
    onDelete(handler) {
        return this.onOperation(handler, 'document.delete', beforeSnapshotConstructor);
    }
    onOperation(handler, eventType, dataConstructor) {
        return cloud_functions_1.makeCloudFunction({
            handler,
            provider: exports.provider,
            eventType,
            service: exports.service,
            triggerResource: this.triggerResource,
            legacyEventType: `providers/cloud.firestore/eventTypes/${eventType}`,
            dataConstructor,
            opts: this.opts,
        });
    }
}
exports.DocumentBuilder = DocumentBuilder;
