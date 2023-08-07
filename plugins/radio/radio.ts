import fs from "fs";
import {AudioPlayerStatus} from "@discordjs/voice";
import {PassThrough} from "stream";
import {VoiceManager} from "../discord/voice";
import m3u8stream from "m3u8stream";
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

            const _this = this;

            let duration: number = 20;

            const createStream = () => {
                const stream = new PassThrough({
                    highWaterMark: 1024 * 512,
                });
                stream._destroy = () => {
                    stream.destroyed = true;
                };
                return stream;
            };
            const pipeAndSetEvents = (req: m3u8stream.Stream, stream: PassThrough) => {
                // Forward events from the request to the stream.
                [
                    'abort', 'request', 'response', 'error', 'redirect', 'retry', 'reconnect',
                ].forEach(event => {
                    req.prependListener(event, stream.emit.bind(stream, event));
                });
                req.pipe(stream, {end: true});
            };

            let seenSegments = new Set();

            function process() {
                function process() {
                    const stream = createStream();
                    const req = m3u8stream(_this.url, {
                        begin: Date.now()+100
                    });
                    req.on('progress', (segment, totalSegments) => {
                        if (!seenSegments.has(segment.num)) {
                            seenSegments.add(segment.num);
                            stream.emit('progress', segment.size, segment.num, totalSegments);
                        }
                    });
                    pipeAndSetEvents(req, stream);
                    VoiceManager.play(_this.guildId, stream);
                }

                process();
                const interval = setInterval(process, duration * 1000);

            }

            setImmediate(process);


            return true;
        } catch (error) {
            Logger.error(`[Radio] Error playing radio: ${error}`);
            return false;
        }
    }

}
