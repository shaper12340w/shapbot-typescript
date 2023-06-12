import { CommandData,MessageCommandData } from "./Client";

export class Command {
    constructor(commandOptions: CommandData) {
        Object.assign(this, commandOptions);
    }
}
export class MessageCommand {
    constructor(commandOptions: MessageCommandData) {
        Object.assign(this, commandOptions);
    }
}
