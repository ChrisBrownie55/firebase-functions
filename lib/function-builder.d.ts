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
import { CloudFunction, EventContext, Schedule } from './cloud-functions';
declare type Memory = '128MB' | '256MB' | '512MB' | '1GB' | '2GB';
/**
 * Configure the regions that the function is deployed to.
 * @param regions One of more region strings.
 * For example: `functions.region('us-east1')` or `functions.region('us-east1', 'us-central1')`
 */
export declare function region(...regions: string[]): FunctionBuilder;
/**
 * Configure runtime options for the function.
 * @param runtimeOptions Object with 2 optional fields:
 * 1. `timeoutSeconds`: timeout for the function in seconds, possible values are 0 to 540
 * 2. `memory`: amount of memory to allocate to the function,
 *    possible values are:  '128MB', '256MB', '512MB', '1GB', and '2GB'.
 */
export declare function runWith(runtimeOptions: RuntimeOptions): FunctionBuilder;
export interface RuntimeOptions {
    timeoutSeconds?: number;
    memory?: Memory;
}
export interface DeploymentOptions {
    regions?: string[];
    timeoutSeconds?: number;
    memory?: Memory;
    schedule?: Schedule;
}
export declare class FunctionBuilder {
    private options;
    constructor(options: DeploymentOptions);
    /**
     * Configure the regions that the function is deployed to.
     * @param regions One or more region strings.
     * For example: `functions.region('us-east1')`  or `functions.region('us-east1', 'us-central1')`
     */
    region(...regions: string[]): FunctionBuilder;
    /**
     * Configure runtime options for the function.
     * @param runtimeOptions Object with 2 optional fields:
     * 1. timeoutSeconds: timeout for the function in seconds, possible values are 0 to 540
     * 2. memory: amount of memory to allocate to the function, possible values are:
     * '128MB', '256MB', '512MB', '1GB', and '2GB'.
     */
    runWith(runtimeOptions: RuntimeOptions): FunctionBuilder;
    readonly https: {
        /**
         * Handle HTTP requests.
         * @param handler A function that takes a request and response object,
         * same signature as an Express app.
         */
        onRequest: (handler: (req: https.Request, resp: express.Response) => void) => import("./cloud-functions").HttpsFunction;
        /**
         * Declares a callable method for clients to call using a Firebase SDK.
         * @param handler A method that takes a data and context and returns a value.
         */
        onCall: (handler: (data: any, context: https.CallableContext) => any) => import("./cloud-functions").TriggerAnnotated & ((req: express.Request, resp: express.Response) => void) & import("./cloud-functions").Runnable<any>;
    };
    readonly database: {
        /**
         * Selects a database instance that will trigger the function.
         * If omitted, will pick the default database for your project.
         * @param instance The Realtime Database instance to use.
         */
        instance: (instance: string) => database.InstanceBuilder;
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
         * @param ref Path of the database to listen to.
         */
        ref: (path: string) => database.RefBuilder;
    };
    readonly firestore: {
        /**
         * Select the Firestore document to listen to for events.
         * @param path Full database path to listen to. This includes the name of
         * the collection that the document is a part of. For example, if the
         * collection is named "users" and the document is named "Ada", then the
         * path is "/users/Ada".
         */
        document: (path: string) => firestore.DocumentBuilder;
        /** @internal */
        namespace: (namespace: string) => firestore.NamespaceBuilder;
        /** @internal */
        database: (database: string) => firestore.DatabaseBuilder;
    };
    readonly crashlytics: {
        /**
         * Handle events related to Crashlytics issues. An issue in Crashlytics is an
         * aggregation of crashes which have a shared root cause.
         */
        issue: () => crashlytics.IssueBuilder;
    };
    readonly analytics: {
        /**
         * Select analytics events to listen to for events.
         * @param analyticsEventType Name of the analytics event type.
         */
        event: (analyticsEventType: string) => analytics.AnalyticsEventBuilder;
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
    readonly storage: {
        /**
         * The optional bucket function allows you to choose which buckets' events to handle.
         * This step can be bypassed by calling object() directly, which will use the default
         * Cloud Storage for Firebase bucket.
         * @param bucket Name of the Google Cloud Storage bucket to listen to.
         */
        bucket: (bucket?: string) => storage.BucketBuilder;
        /**
         * Handle events related to Cloud Storage objects.
         */
        object: () => storage.ObjectBuilder;
    };
    readonly pubsub: {
        /** Select Cloud Pub/Sub topic to listen to.
         * @param topic Name of Pub/Sub topic, must belong to the same project as the function.
         */
        topic: (topic: string) => pubsub.TopicBuilder;
        schedule: (schedule: string) => pubsub.ScheduleBuilder;
    };
    readonly auth: {
        /**
         * Handle events related to Firebase authentication users.
         */
        user: () => auth.UserBuilder;
    };
}
export {};
