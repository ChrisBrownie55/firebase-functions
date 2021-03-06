import { CloudFunction, EventContext } from '../cloud-functions';
/**
 * Handle all updates (including rollbacks) that affect a Remote Config project.
 * @param handler A function that takes the updated Remote Config template
 * version metadata as an argument.
 */
export declare function onUpdate(handler: (version: TemplateVersion, context: EventContext) => PromiseLike<any> | any): CloudFunction<TemplateVersion>;
/** Builder used to create Cloud Functions for Remote Config. */
export declare class UpdateBuilder {
    private triggerResource;
    private opts;
    /**
     * Handle all updates (including rollbacks) that affect a Remote Config
     * project.
     * @param handler A function that takes the updated Remote Config template
     * version metadata as an argument.
     */
    onUpdate(handler: (version: TemplateVersion, context: EventContext) => PromiseLike<any> | any): CloudFunction<TemplateVersion>;
}
/**
 * Interface representing a Remote Config template version metadata object that
 * was emitted when the project was updated.
 */
export interface TemplateVersion {
    /** The version number of the updated Remote Config template. */
    versionNumber: number;
    /** When the template was updated in format (ISO8601 timestamp). */
    updateTime: string;
    /** Metadata about the account that performed the update. */
    updateUser: RemoteConfigUser;
    /** A description associated with the particular Remote Config template. */
    description: string;
    /** The origin of the caller. */
    updateOrigin: string;
    /** The type of update action that was performed. */
    updateType: string;
    /**
     * The version number of the Remote Config template that was rolled back to,
     * if the update was a rollback.
     */
    rollbackSource?: number;
}
export interface RemoteConfigUser {
    name?: string;
    email: string;
    imageUrl?: string;
}
