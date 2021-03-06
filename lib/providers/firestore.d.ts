import * as firebase from 'firebase-admin';
import { CloudFunction, Change, EventContext } from '../cloud-functions';
export declare type DocumentSnapshot = firebase.firestore.DocumentSnapshot;
/**
 * Select the Firestore document to listen to for events.
 * @param path Full database path to listen to. This includes the name of
 * the collection that the document is a part of. For example, if the
 * collection is named "users" and the document is named "Ada", then the
 * path is "/users/Ada".
 */
export declare function document(path: string): DocumentBuilder;
export declare class DatabaseBuilder {
    private database;
    private opts;
    namespace(namespace: string): NamespaceBuilder;
    document(path: string): DocumentBuilder;
}
export declare class NamespaceBuilder {
    private database;
    private opts;
    private namespace?;
    document(path: string): DocumentBuilder;
}
export declare class DocumentBuilder {
    private triggerResource;
    private opts;
    /** Respond to all document writes (creates, updates, or deletes). */
    onWrite(handler: (change: Change<DocumentSnapshot>, context: EventContext) => PromiseLike<any> | any): CloudFunction<Change<DocumentSnapshot>>;
    /** Respond only to document updates. */
    onUpdate(handler: (change: Change<DocumentSnapshot>, context: EventContext) => PromiseLike<any> | any): CloudFunction<Change<DocumentSnapshot>>;
    /** Respond only to document creations. */
    onCreate(handler: (snapshot: DocumentSnapshot, context: EventContext) => PromiseLike<any> | any): CloudFunction<DocumentSnapshot>;
    /** Respond only to document deletions. */
    onDelete(handler: (snapshot: DocumentSnapshot, context: EventContext) => PromiseLike<any> | any): CloudFunction<DocumentSnapshot>;
    private onOperation;
}
