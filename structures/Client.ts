import {
    Message,
    Events,
    Client,
    GatewayIntentBits,
    Collection,
    SharedNameAndDescription, SharedSlashCommandOptions, CommandInteraction, AutocompleteInteraction
} from "discord.js";
import {LavaManager} from "../plugins/lavalink/lavalinkInit"
import {setSlashCommands} from "./deploy-command";
import {ServerProperty, ServerPropertyType} from "./Property"
import readdirp from "readdirp";
import {readdirSync} from "fs";
import {Shoukaku} from "shoukaku";
import {Logger} from "../plugins/common/logger";

export interface CommandData {
    interaction: {
        data: SharedNameAndDescription | SharedSlashCommandOptions;
        execute?: (interaction: CommandInteraction) => any;
        autocomplete?: (interaction: AutocompleteInteraction) => any;
    };
    message: {
        data: MCData;
        execute?: (message: Message, args: string, options?: string) => any;
    };
    execute?: (message: Message|CommandInteraction, args?: string, options?: string) => any;

}

export type MCData = {
    name: string;
    duplicatedData?: string[];
    description?: string;
}

export interface EventData {
    name: Events | string;
    run: (...anything: any) => any;
}

export class exClient extends Client {
    public commands: Collection<string, CommandData["interaction"]> = new Collection();
    public messageCommands: Collection<string, CommandData["message"]> = new Collection();
    public commonCommands: Collection<string, CommandData["execute"]> = new Collection();
    public serverProperty: Map<string, ServerPropertyType> = new Map();
    public shoukaku: Shoukaku = new LavaManager(this).initShoukaku();

    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildInvites,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildPresences,
                GatewayIntentBits.MessageContent
            ]
        });
    }

    public async start() {
        await this.login(process.env.botToken);
        await this.loadProperties();
        await this.registerModules();
        await this.registerEvents();
        await setSlashCommands();
    }

    private fileRead(commandsPath: string): Promise<Error | string[]> {
        return new Promise((resolve, reject) => {
            const fileList: string[] = [];
            readdirp(commandsPath, {
                fileFilter: ["!*.d.ts", "*.ts", "*.js"],
                type: "files"
            })
                .on("data", (entry: any) => {
                    fileList.push(entry.fullPath);
                })
                .on("error", (err) => {
                    reject(err);
                })
                .on("end", (err: any) => {
                    if (fileList.length === 0) {
                        reject(new Error("No files found"));
                    } else {
                        resolve(fileList);
                    }
                });
        });
    }

    private async loadProperties() {
        Logger.info("Loading properties...");
        try {
            Logger.info("Loading properties from backup...");
            const jsonList = readdirSync('./db/backup');
            if (jsonList.includes("serverProperty.json")) {
                const json = require(`../db/backup/serverProperty.json`);
                await ServerProperty.load(this);
                await ServerProperty.fromJSON(json);
            } else {
                Logger.warn("No backup found, loading from default...");
                await ServerProperty.load(this);
            }
        } catch (e) {
            Logger.error(e);
            await ServerProperty.load(this);
        }
    }

    private async registerCommands(filePath: string) {
        const commandData = require(filePath).default;
        this.commands.set(commandData.interaction.data.name, commandData.interaction);
        this.messageCommands.set(commandData.message.data.name, commandData.message);
        this.commonCommands.set(commandData.interaction.data.name, commandData.execute);
        Logger.debug(`[ Loaded Command : ${commandData.interaction.data.name} ]`,`Executes : [ Interaction : ${Boolean(commandData.interaction.execute)} | Message : ${Boolean(commandData.message.execute)} | Common : ${Boolean(commandData.execute)} ]`)
    }

    private async registerModules() {
        // Commands
        const commandFiles = await this.fileRead("./commands") as string[];
        commandFiles.forEach(file => {
            this.registerCommands(file);
        });
    }

    private async registerEvents() {
        // Events
        const eventFiles = await this.fileRead("./events") as string[];
        eventFiles.forEach(async file => {
            const eventData = require(file).default;
            this.on(eventData.name, eventData.run)
        })
    }
}
