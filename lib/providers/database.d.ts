import { CloudFunction, EventContext, Change } from '../cloud-functions';
import * as firebase from 'firebase-admin';
/**
 * Selects a database instance that will trigger the function.
 * If omitted, will pick the default database for your project.
 * @param instance The Realtime Database instance to use.
 */
export declare function instance(instance: string): InstanceBuilder;
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
export declare function ref(path: string): RefBuilder;
export declare class InstanceBuilder {
    private instance;
    private opts;
    ref(path: string): RefBuilder;
}
/** Builder used to create Cloud Functions for Firebase Realtime Database References. */
export declare class RefBuilder {
    private apps;
    private triggerResource;
    private opts;
    /** Respond to any write that affects a ref. */
    onWrite(handler: (change: Change<DataSnapshot>, context: EventContext) => PromiseLike<any> | any): CloudFunction<Change<DataSnapshot>>;
    /** Respond to update on a ref. */
    onUpdate(handler: (change: Change<DataSnapshot>, context: EventContext) => PromiseLike<any> | any): CloudFunction<Change<DataSnapshot>>;
    /** Respond to new data on a ref. */
    onCreate(handler: (snapshot: DataSnapshot, context: EventContext) => PromiseLike<any> | any): CloudFunction<DataSnapshot>;
    /** Respond to all data being deleted from a ref. */
    onDelete(handler: (snapshot: DataSnapshot, context: EventContext) => PromiseLike<any> | any): CloudFunction<DataSnapshot>;
    private onOperation;
    private changeConstructor;
}
export declare class DataSnapshot {
    private app?;
    instance: string;
    private _ref;
    private _path;
    private _data;
    private _childPath;
    constructor(data: any, path?: string, // path will be undefined for the database root
    app?: firebase.app.App, instance?: string);
    /** Ref returns a reference to the database with full admin access. */
    readonly ref: firebase.database.Reference;
    readonly key: string;
    val(): any;
    exportVal(): any;
    getPriority(): string | number | null;
    exists(): boolean;
    child(childPath: string): DataSnapshot;
    forEach(action: (a: DataSnapshot) => boolean): boolean;
    hasChild(childPath: string): boolean;
    hasChildren(): boolean;
    numChildren(): number;
    /**
     * Prints the value of the snapshot; use '.previous.toJSON()' and '.current.toJSON()' to explicitly see
     * the previous and current values of the snapshot.
     */
    toJSON(): Object;
    private _checkAndConvertToArray;
    private _dup;
    private _fullPath;
}
