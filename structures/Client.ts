import {
    Events,
    Client,
    GatewayIntentBits,
    Collection,
    SharedNameAndDescription, SharedSlashCommandOptions, CommandInteraction
} from "discord.js";
import { LavaManager } from "../modules/lavalink/lavalinkInit"
import { setSlashCommands } from "../deploy-command";
import * as readdirp from "readdirp";
import { Shoukaku } from "shoukaku";

export interface CommandData {
    data: SharedNameAndDescription|SharedSlashCommandOptions;
    execute: (interaction:CommandInteraction) => any;
}
export interface EventData {
    name: Events|string;
    run: (...anything:any)=>any;
}
interface jsonData {
    name: string;
    path: string;
}

export class exClient extends Client {
    public commands: Collection<string, CommandData> = new Collection();
    public commandList: jsonData[] = [];
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

    public start() {
        this.registerModules();
        this.registerEvents();
        this.login(process.env.botToken);
        setSlashCommands();
    }
    private fileRead(commandsPath: string):Promise<Error|string[]> {
        return new Promise((resolve, reject) => {
            const fileList: string[] = [];
    
            readdirp(commandsPath, { fileFilter: "*.ts" })
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
        this.commandList.push({"name":commandData.data.name,"path":filePath})
        this.commands.set(commandData.data.name, commandData);
    }

    private async registerModules() {
        // Commands
        const commandFiles = await this.fileRead("./commands") as string[];
        commandFiles.forEach(file=>{
            this.registerCommands(file);
        })
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
