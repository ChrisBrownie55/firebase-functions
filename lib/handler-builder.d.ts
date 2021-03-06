import * as express from 'express';
import * as analytics from './providers/analytics';
import * as auth from './providers/auth';
import * as crashlytics from './providers/crashlytics';
import * as database from './providers/database';
import * as firestore from './providers/firestore';
import * as https from './providers/https';
import * as pubsub from './providers/pubsub';
import * as remoteConfig from './providers/remoteConfig';
import * as storage from './providers/storage';
import { CloudFunction, EventContext, HttpsFunction } from './cloud-functions';
export declare class HandlerBuilder {
    constructor();
    readonly https: {
        /**
         * Handle HTTP requests.
         * @param handler A function that takes a request and response object,
         * same signature as an Express app.
         */
        onRequest: (handler: (req: express.Request, resp: express.Response) => void) => HttpsFunction;
        /**
         * Declares a callable method for clients to call using a Firebase SDK.
         * @param handler A method that takes a data and context and returns a value.
         */
        onCall: (handler: (data: any, context: https.CallableContext) => any) => HttpsFunction;
    };
    readonly database: {
        /**
         * Selects a database instance that will trigger the function.
         * If omitted, will pick the default database for your project.
         */
        readonly instance: {
            readonly ref: database.RefBuilder;
        };
        /**
         * Select Firebase Realtime Database Reference to listen to.
         *
         * This method behaves very similarly to the method of the same name in the
         * client and Admin Firebase SDKs. Any change to the Database that affects the
         * data at or below the provided `path` will fire an event in Cloud Functions.
         *
         * There are three important differences between listening to a Realtime
         * Database event in Cloud Functions and using the Realtime Database in the
         * client and Admin SDKs:
         * 1. Cloud Functions allows wildcards in the `path` name. Any `path` component
         *    in curly brackets (`{}`) is a wildcard that matches all strings. The value
         *    that matched a certain invocation of a Cloud Function is returned as part
         *    of the `context.params` object. For example, `ref("messages/{messageId}")`
         *    matches changes at `/messages/message1` or `/messages/message2`, resulting
         *    in  `context.params.messageId` being set to `"message1"` or `"message2"`,
         *    respectively.
         * 2. Cloud Functions do not fire an event for data that already existed before
         *    the Cloud Function was deployed.
         * 3. Cloud Function events have access to more information, including information
         *    about the user who triggered the Cloud Function.
         */
        readonly ref: database.RefBuilder;
    };
    readonly firestore: {
        /**
         * Listen for events on a Firestore document. A Firestore document contains a set of
         * key-value pairs and may contain subcollections and nested objects.
         */
        readonly document: firestore.DocumentBuilder;
        /** @internal */
        readonly namespace: firestore.DocumentBuilder;
        /** @internal */
        readonly database: firestore.DocumentBuilder;
    };
    readonly crashlytics: {
        /**
         * Handle events related to Crashlytics issues. An issue in Crashlytics is an
         * aggregation of crashes which have a shared root cause.
         */
        readonly issue: crashlytics.IssueBuilder;
    };
    readonly remoteConfig: {
        /**
         * Handle all updates (including rollbacks) that affect a Remote Config
         * project.
         * @param handler A function that takes the updated Remote Config template
         * version metadata as an argument.
         */
        onUpdate: (handler: (version: remoteConfig.TemplateVersion, context: EventContext) => any) => CloudFunction<remoteConfig.TemplateVersion>;
    };
    readonly analytics: {
        /**
         * Select analytics events to listen to for events.
         */
        readonly event: analytics.AnalyticsEventBuilder;
    };
    readonly storage: {
        /**
         * The optional bucket function allows you to choose which buckets' events to handle.
         * This step can be bypassed by calling object() directly, which will use the default
         * Cloud Storage for Firebase bucket.
         */
        readonly bucket: storage.ObjectBuilder;
        /**
         * Handle events related to Cloud Storage objects.
         */
        readonly object: storage.ObjectBuilder;
    };
    readonly pubsub: {
        /**
         * Select Cloud Pub/Sub topic to listen to.
         */
        readonly topic: pubsub.TopicBuilder;
    };
    readonly auth: {
        /**
         * Handle events related to Firebase authentication users.
         */
        readonly user: auth.UserBuilder;
    };
}
export declare let handler: HandlerBuilder;
