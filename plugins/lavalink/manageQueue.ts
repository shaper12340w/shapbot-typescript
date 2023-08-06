import {client} from "../../app";
import {LavalinkResponse, LoadType, Node, Player, PlaylistResult, SearchResult, Track, TrackResult} from "shoukaku";
import {secondsToTime} from "../common/extras";
import {queueManager} from './playerEvent';
import {CompareVideo} from "./compareVideo";
import {APIEmbed, TextBasedChannel} from "discord.js";
import {Logger} from "../common/logger";
import * as config from "../../structures/Configs"
import {ServerProperty} from "../../structures/Property";


export const queue: Map<string, Queue> = new Map();

const embed = {
    color: 0x426cf5,
    title: '🎶',
    thumbnail: {
        url: '',
    },
    fields: [
        {
            name: '재생시간',
            value: '',
            inline: true,
        },
        {
            name: '채널',
            value: '',
            inline: true,
        },
        {
            name: '링크',
            value: '',
            inline: true,
        },
    ],
    timestamp: new Date().toISOString(),
    footer: {
        text: '',
        icon_url: '',
    },
};
declare global {
    interface Array<T> {
        ranPick(): T;
    }
}
Array.prototype.ranPick = function () {
    return this[Math.floor(Math.random() * this.length)];
};

export interface embedType {
    name: string;
    videoDuration: string;
    author: string;
    url: string;
    id: string;
    image: string;
}

export interface returnType {
    desc?: any;
    embed?: APIEmbed;
    metadata?: Track;
}

export interface playlistOption {
    url: string;
    name: string;
    track: string;
    embed: APIEmbed;
    status: number;
}

type killOption = () => void;

export interface queueOption {
    option: {
        sendRoom: string;
        playRoom: string;
        playRepeat: number;
        playShuffle: number;
        playRecommend: number;
        playVolume: number;
        playNextOption: boolean;
    }
    playList: playlistOption[];
    rowPlaylist: Array<Track>;
    killList: killOption[];
    player?: Player;
    timer?: NodeJS.Timeout;
}

interface SearchPlatform {
  youtube: string;
  soundcloud: string;
  spotify: string;
  [key: string]: string;
}


export class Queue {
    public data: queueOption;
    public guildId: string;

    constructor(channelId: string, guildId: string, voiceChannelId: string) {
        this.guildId = guildId;
        this.data = {
            option: {
                sendRoom: channelId,
                playRoom: voiceChannelId,
                playRepeat: 0,
                playShuffle: 0,
                playRecommend: 0,
                playVolume: 100,
                playNextOption: true,
            },
            playList: <playlistOption[]>[],
            rowPlaylist: <Track[]>[],
            killList: <killOption[]>[]
        }
    }

    private checkPlay() {
        return !client.shoukaku.players.has(this.guildId);
    }

    private resolveNode(): Node | undefined {
        return client.shoukaku.getIdealNode();
    }

    public async getTrack(track: string): Promise<Track | undefined> {
        return await this.resolveNode()!!.rest.decode(track);
    }

    private embedSet(data: embedType, isRecommend?: boolean): APIEmbed {
        const newEmbed: APIEmbed = Object.assign({}, embed);
        newEmbed.title = `${isRecommend ? "✅" : "🎶"} | ${data.name}`;
        newEmbed.color = isRecommend ? 0x36eb87 : 0x426cf5
        newEmbed.fields!![0].value = data.videoDuration;
        newEmbed.fields!![1].value = `${data.author}`;
        newEmbed.fields!![2].value = `[링크](${data.url})`;
        newEmbed.thumbnail!!.url = data.image;
        newEmbed.footer!!.text = isRecommend ? "추천 기능으로 자동 추가됨" : "";
        newEmbed.footer!!.icon_url = '';
        return newEmbed;
    }

    private addEmbed(metadata: Track, status: number, isRecommend?: boolean): APIEmbed {
        const emb = this.embedSet({
            name: metadata.info.title,
            videoDuration: secondsToTime(Math.round(metadata.info.length / 1000)),
            author: metadata.info.author,
            url: metadata.info.uri!!,
            id: metadata.info.identifier,
            image: metadata.info.artworkUrl!!,
        }, isRecommend)
        const embedData: playlistOption = {
            url: metadata.info.uri!!,
            name: metadata.info.title,
            track: metadata.encoded,
            embed: emb,
            status: status
        }
        this.data.playList.push(JSON.parse(JSON.stringify(embedData)))
        return emb;
    }

    private async recommendPlay(): Promise<APIEmbed | void> {
        try {
            if (!this.data.player) return;
            const newSearch = await this.getTrack(this.data.playList.filter(e => e.status === 2)[0].track) as Track;
            const compareVid = await new CompareVideo().getRecommend(newSearch, this.data.playList)
            const searched = (await this.search(compareVid!!) as TrackResult | PlaylistResult).data;
            let lastResult: Track | undefined;
            if (Array.isArray(searched))
                lastResult = searched[0]
            else if (searched)
                lastResult = searched as Track
            else {
                (<TextBasedChannel>client.channels.cache.get(this.data.option.sendRoom)).send('`추천 곡이 없어, 일시정지 되었습니다')
                return;
            }
            const embData = this.addEmbed(lastResult!!, 2, true);
            this.data.playList.filter(e => e.status === 2)[0].status = 0;
            await this.data.player!!.playTrack({track: lastResult!!.encoded});
            (<TextBasedChannel>client.channels.cache.get(this.data.option.sendRoom)).send({embeds: [embData]})
            return embData;
        } catch (e) {
            (<TextBasedChannel>client.channels.cache.get(this.data.option.sendRoom)).send("`추천영상을 불러오던 도중 에러가 발생했어요`");
            this.pause();
            Logger.error(e);
        }

    }

    public async search(search_or_link: string, searchType?: string): Promise<LavalinkResponse | undefined> {
        const node = this.resolveNode()!!
        const isUrl =
            config.regex.youtube.YOUTUBE_VIDEO_URL.test(search_or_link) ||
            config.regex.youtube.YOUTUBE_PLAYLIST_URL.test(search_or_link) ||
            config.regex.youtube.YOUTUBE_MUSIC_URL.test(search_or_link) ||
            config.regex.soundcloud.SOUNDCLOUD_URL_REGEX.test(search_or_link)
        const searchPlatform: SearchPlatform = {"youtube": "ytsearch", "soundcloud": "scsearch", "spotify": "spsearch"};
        let searchResult: LavalinkResponse | undefined;
        if (isUrl)
            searchResult = await node.rest.resolve(search_or_link);
        else
            searchResult = await node.rest.resolve(`${searchPlatform[searchType ?? "youtube"]}:${search_or_link}`);
        return searchResult;
    }

    public async play(track: Track): Promise<returnType> {

        if (this.checkPlay()) {

            const player = await client.shoukaku.joinVoiceChannel({
                guildId: this.guildId,
                shardId: 0,
                channelId: this.data.option.playRoom,
            });

            await player.playTrack({track: track.encoded});

            this.data.player = player;
            this.data.rowPlaylist.push(track)

            new queueManager(this).event();
            const embData = this.addEmbed(track, 2);
            return {desc: "new", embed: embData, metadata: track};

        } else {
            if (this.data.player!!.paused) {
                this.skip()
                this.pause()
            }
            const embData = this.addEmbed(track, 1);
            await this.add(track)
            return {desc: "add", embed: embData, metadata: track};
        }
    }

    public async trackPlay(track: Track[]) {
        const list = [...track];
        const firstReturn = await this.play(list.shift()!!);
        if (firstReturn.desc === "new" || firstReturn.desc === "add") {
            list.forEach(async trak => { if(!trak) return; await this.play(trak)});
        }
    }

    public async playing() {
        const data: APIEmbed = this.data.playList.filter(e => e.status === 2)[0].embed;
        const timeToString = (time: number) => secondsToTime(Math.round(time / 1000));
        const line = "⏤".repeat(13);
        const currentPosition = this.data.player!!.position;
        const videoLength = (<Track>await this.getTrack(this.data.player!!.track!!)).info.length;
        const position = currentPosition / videoLength;
        const index = Math.floor(position * line.length);
        data.footer!!.text = "⟫" + line.slice(0, index) + 'ㅇ' + line.slice(index) + `⟪ (${timeToString(currentPosition)}/${timeToString(videoLength)})`;
        data.timestamp = undefined;
        return data;
    }

    public async add(track: Track): Promise<Track | undefined> {

        const node = this.resolveNode();

        if (!node)
            return;
        if (this.data.rowPlaylist.length <= 0)
            return;
        this.data.rowPlaylist.push(track);
        return track!!;
    }

    public async stop(): Promise<boolean> {
        if (!this.data.player) return false;
        await client.shoukaku.leaveVoiceChannel(this.guildId);
        client.shoukaku.players.delete(this.guildId);
        queue.delete(this.guildId);
        return true;
    }

    public async next(): Promise<void> {
        if (this.data.playList.length === 0) return;

        const lengthCheck1 = (_this: Queue) => _this.data.playList.filter(e => e.status === 1).length <= 0;
        const lengthCheck2 = (_this: Queue) => _this.data.playList.filter(e => e.status === 3).length <= 0;

        function normalPlay(_this: Queue): void {
            if (_this.data.playList.filter(e => e.status === 3).length === 1) {
                _this.data.player!!.playTrack({track: _this.data.playList.filter(e => e.status === 3)[0].track})
                _this.data.playList.filter(e => e.status === 3)[0].status = 2;
            } else if (_this.data.option.playShuffle) {
                _this.data.playList.filter(e => e.status === 1).ranPick().status = 3;
            } else {
                _this.data.playList.filter(e => e.status === 1)[0].status = 3;
            }
            _this.data.playList.filter(e => e.status === 2)[0].status = 0;
            _this.data.playList.filter(e => e.status === 3)[0].status = 2;
            _this.data.player!!.playTrack({track: _this.data.playList.filter(e => e.status === 2)[0].track});

        }

        function playNext(_this: Queue): void {
            switch (_this.data.option.playRepeat) {
                case 0:
                    if (lengthCheck1(_this) && lengthCheck2(_this)) {
                        _this.stop();
                        break;
                    } else {
                        normalPlay(_this);
                        break;
                    }
                case 1:
                    if (lengthCheck1(_this) && lengthCheck2(_this)) {
                        _this.data.playList.forEach(e => e.status = 1);
                        _this.data.playList.filter(e => e.status === 1)[0].status = 2;
                        _this.data.player!!.playTrack({track: _this.data.playList.filter(e => e.status === 2)[0].track});
                        break;
                    } else {
                        normalPlay(_this);
                        break;
                    }
                case 2:
                    _this.data.player!!.playTrack({track: _this.data.playList.filter(e => e.status === 2)[0].track});
                    break;
            }
        }

        if (this.data.option.playRecommend) {
            if (!lengthCheck1(this) || !lengthCheck2(this)) {
                playNext(this);
            } else {
                await this.recommendPlay();
            }
        } else {
            playNext(this);
        }

    }

    public skip(): APIEmbed | undefined {
        if (!this.data.player) return;
        const nowPlayingData = Object.assign({}, this.data.playList.filter(e => e.status > 1)[0].embed)
        this.data.player.stopTrack();
        return nowPlayingData;
    }

    public volume(vol?: number): number | undefined {
        if (!this.data.player) return;
        if (!vol) return this.data.option.playVolume;
        this.data.option.playVolume = vol;
        this.data.player.setFilterVolume(vol / 100);
        return vol;
    }

    public pause(): boolean | undefined {
        if (!this.data.player) return;
        if (this.data.player.paused) {
            this.data.player.setPaused(false)
            return false;
        } else {
            this.data.player.setPaused(true)
            return true;
        }
    }
}