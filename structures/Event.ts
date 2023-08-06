import { EventData } from "./Client";

export class Event {
    constructor(eventOptions: EventData) {
        Object.assign(this, eventOptions);
    }
}
