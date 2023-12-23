import fs from "fs";
import {PassThrough} from "stream";
import {VoiceManager} from "../discord/voice";
import ffmpeg from "fluent-ffmpeg";
import {Logger} from "../common/logger";

interface RadioOptions {
    [key: string]: string;
}

export class Radio {

    private guildId: string;
    private url: string = "";
    private url_list: RadioOptions;

    constructor(guildId: string) {
        this.guildId = guildId;
        this.url_list = JSON.parse(fs.readFileSync('./db/data/json/radio_cache.json', 'utf-8'));
    }

    public async playRadio(name: string) {
        try {
            if (this.url_list[name]) {
                this.url = this.url_list[name];
            } else {
                return false;
            }
            Logger.debug(`[Radio] ${name} ${this.url}`);
            const stream = <PassThrough>ffmpeg()
                .input(this.url)
                .inputOptions(['-reconnect 1', '-reconnect_streamed 1', '-reconnect_at_eof 1', '-reconnect_delay_max 2'])
                .inputFormat('hls')
                .outputOptions(['-c:v copy', '-c:a copy'])
                .audioCodec('libmp3lame')
                .pipe();
            VoiceManager.play(this.guildId, stream);
        } catch (error) {
            Logger.error(error);
            return false;
        }
    }

}
