import { Shoukaku, Connectors } from "shoukaku";
import { Client } from "discord.js";
import {Logger} from "../common/logger";

export class LavaManager {

    private nodes = [
        {
            name: "localhost",
            url: "localhost:2334",
            auth: "shaper12340w"
        }
    ];

    private client: Client;

    constructor(client: Client) {
        this.client = client;
    }

    public initShoukaku(): Shoukaku {
        const shoukaku = new Shoukaku(new Connectors.DiscordJS(this.client), this.nodes);
        shoukaku.on("error", (_, error) => {
            Logger.error(error);
        });
        return shoukaku;
    }
}