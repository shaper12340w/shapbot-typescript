import { CommandData } from "./Client";

export class Command {
    constructor(commandOptions: CommandData) {
        Object.assign(this, commandOptions);
    }
}