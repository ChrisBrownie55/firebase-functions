import { CloudFunction, EventContext, ScheduleRetryConfig } from '../cloud-functions';
/** Select Cloud Pub/Sub topic to listen to.
 * @param topic Name of Pub/Sub topic, must belong to the same project as the function.
 */
export declare function topic(topic: string): TopicBuilder;
export declare function schedule(schedule: string): ScheduleBuilder;
export declare class ScheduleBuilder {
    private schedule;
    private opts;
    private _opts;
    retryConfig(config: ScheduleRetryConfig): ScheduleBuilder;
    timeZone(timeZone: string): ScheduleBuilder;
    onRun(handler: (context: EventContext) => PromiseLike<any> | any): CloudFunction<{}>;
}
/** Builder used to create Cloud Functions for Google Pub/Sub topics. */
export declare class TopicBuilder {
    private triggerResource;
    private opts;
    /** Handle a Pub/Sub message that was published to a Cloud Pub/Sub topic */
    onPublish(handler: (message: Message, context: EventContext) => PromiseLike<any> | any): CloudFunction<Message>;
}
/**
 * A Pub/Sub message.
 *
 * This class has an additional .json helper which will correctly deserialize any
 * message that was a JSON object when published with the JS SDK. .json will throw
 * if the message is not a base64 encoded JSON string.
 */
export declare class Message {
    readonly data: string;
    readonly attributes: {
        [key: string]: string;
    };
    private _json;
    constructor(data: any);
    readonly json: any;
    toJSON(): any;
}
