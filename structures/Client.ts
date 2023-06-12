import {
    Message,
    Events,
    Client,
    GatewayIntentBits,
    Collection,
    SharedNameAndDescription, SharedSlashCommandOptions, CommandInteraction
} from "discord.js";
import { LavaManager } from "../modules/lavalink/lavalinkInit"
import { setSlashCommands } from "./deploy-command";
import { ManageProperty, serverPropertyDataType } from "./Property"
import * as readdirp from "readdirp";
import { Shoukaku } from "shoukaku";

export interface CommandData {
    data: SharedNameAndDescription|SharedSlashCommandOptions;
    execute: (interaction:CommandInteraction) => any;
}

export type MCData = {
    name: string;
    duplicatedData?:string[];
    description?: string;
}
export interface MessageCommandData {
    data:MCData;
    execute: (message:Message, args:string, options?:string) => any;
}

export interface EventData {
    name: Events|string;
    run: (...anything:any)=>any;
}

export class exClient extends Client {
    public commands: Collection<string, CommandData> = new Collection();
    public messageCommands: Collection<string, MessageCommandData> = new Collection();
    public serverProperty: Map<string,serverPropertyDataType> = new Map();
    public shoukaku: Shoukaku = new LavaManager(this).initShoukaku();

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildInvites,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });
    }

    public async start() {
        await this.login(process.env.botToken);
        await this.registerModules();
        await this.registerEvents();
        await setSlashCommands();
        await ManageProperty.getFile(this);
    }
    
    private fileRead(commandsPath: string):Promise<Error|string[]> {
        return new Promise((resolve, reject) => {
            const fileList: string[] = [];
            readdirp(commandsPath, { fileFilter: ["*.ts","*.js"] })
                .on("data", (entry) => {
                    fileList.push(entry.fullPath);
                })
                .on("error", (err) => {
                    reject(err);
                })
                .on("end", () => {
                    if (fileList.length === 0) {
                        reject(new Error("No files found"));
                    } else {
                        resolve(fileList);
                    }
                });
        });
    }
    private async registerCommands(filePath: string) {
        const commandData = (await import(filePath)).default;
        this.commands.set(commandData.data.name, commandData);
    }

    private async registerMessageCommands(filePath: string) {
        const commandData = (await import(filePath)).default;
        this.messageCommands.set(commandData.data.name, commandData);
    }

    private async registerModules() {
        // Commands
        const commandFiles = await this.fileRead("./commands") as string[];
        commandFiles.forEach(file=>{
            this.registerCommands(file);
        });
        const messageCommandFiles = await this.fileRead("./messageCommands") as string[];
        messageCommandFiles.forEach(file=>{
            this.registerMessageCommands(file);
        });
    }

    private async registerEvents(){
        // Events
        const eventFiles = await this.fileRead("./events") as string[];
        eventFiles.forEach(async file=>{
            const eventData = (await import(file)).default;
            this.on(eventData.name,eventData.run)
        })
    }
}
