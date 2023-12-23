import {Queue, queue} from "./manageQueue";
import {Logger} from "../common/logger";
import {ServerProperty} from "../../structures/Property";
import {client} from "../../app";
import {EmbedBuilder, TextChannel} from "discord.js";
import {LyricsHelper} from "./lyrics";

export class queueManager {
    private queue: Queue;
    private guildId: string;

    constructor(queue: Queue) {
        this.queue = queue;
        this.guildId = queue.guildId;
    }

    private async nextPlay(): Promise<void> {
        console.log(queue.get(this.guildId)!!.data.option.playNextOption)
        this.queue!!.data!!.killList.forEach(e => e());
        this.queue!!.data!!.killList = [];
        clearTimeout(this.queue.data.timer);
        this.queue!!.data!!.timer = undefined;
        if (!queue.get(this.guildId)!!.data.option.playNextOption) queue.get(this.guildId)!!.data.option.playNextOption = true;
        else {
            if(await this.queue!!.next()){
                this.setLiveUpdate()
                this.lyricUpdate()
            } else {
                LyricsHelper.messageList.set(this.guildId,null)
            }
            try {
                queue.get(this.guildId)!!.data.killList.forEach(e => e());
            } catch (err: unknown) {
                Logger.error(err);
            }
        }
    }

    public async init(): Promise<void> {
        this.setLiveUpdate();
        this.lyricUpdate()
        this.event();
    }

    public async setLiveUpdate(): Promise<void> {
        if ((await ServerProperty.get(this.guildId))!!.player.lyrics) {
            const sendRoom = (await client.guilds.cache.get(this.guildId)!!.channels.fetch(this.queue.data.option.sendRoom))!! as TextChannel
            const firstTime = new Date().getTime();
            const res = await sendRoom.send({embeds: [new EmbedBuilder().setColor("#f2ff75").setDescription("🕒 로딩중이니 잠시 기다려 주세요")]})
            const secondTime = new Date().getTime();
            LyricsHelper.latency += secondTime - firstTime;
            LyricsHelper.messageList.set(this.guildId, res);
        }
    }

    private async lyricUpdate() {
        if ((await ServerProperty.get(this.guildId))!!.player.lyrics) {
            LyricsHelper.editLyrics(this.guildId, this.queue);
        }
    }


    public event(): void {

        this.queue!!.data!!.player!!.on("start", async () => {
            this.queue.data.option.playVolume = Number((await ServerProperty.get(this.guildId))!!.player.volume);
            await this.queue!!.data!!.player!!.setFilterVolume(this.queue.data.option.playVolume / 100);
        })
        this.queue!!.data!!.player!!.on("end", async () => {
            await this.nextPlay();
        })
        this.queue!!.data!!.player!!.on("stuck", async () => {
            await this.nextPlay();
        })
        this.queue!!.data!!.player!!.on("closed", e => {
            this.queue.stop();
            Logger.warn(e)
        })

    }
}