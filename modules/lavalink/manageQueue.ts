import { client } from "../../app";
import { LavalinkResponse, Node, Track, Player } from "shoukaku";
import { secondsToTime } from "../common/extras";
import { queueManager } from './playerEvent';
import { CompareVideo } from "./compareVideo";
import { TextBasedChannel } from "discord.js";

export const queue:Map<string,Queue> = new Map();

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
Array.prototype.ranPick = function() {
  return this[Math.floor(Math.random() * this.length)];
};
export interface embedType{
    name:string;
    videoDuration:string;
    author:string;
    url:string;
    id:string;
}
export interface embType{
    color: number;
    title: string;
    thumbnail: {
        url: string;
    };
    fields: {
        name: string;
        value: string;
        inline: boolean;
    }[];
    timestamp: string;
    footer: { text:string; icon_url:string; }
}
export interface returnType{
    desc?:any;
    embed?:embType;
    metadata?:Track;
}
export interface playlistOption{
    url:string;
    name:string;
    track:string;
    embed:embType;
    status:number;
}
type killOption = () => void;
export interface queueOption {
    option: {
        sendRoom: string;
        playRoom: string;
        playRepeat: number;
        playShuffle: number;
        playRecommend: number;
        playVolume:number;
        playNextOption:boolean;
    }
    playList: playlistOption[];
    rowPlaylist:Array<Track>;
    killList:killOption[];
    player?:Player;

}

export class Queue{
    public data:queueOption;
    public guildId:string;

    constructor(channelId:string,guildId:string,voiceChannelId:string){
        this.guildId = guildId;
        this.data = {
            option:{
                sendRoom:channelId,
                playRoom:voiceChannelId,
                playRepeat:0,
                playShuffle:0,
                playRecommend:0,
                playVolume:100,
                playNextOption:true,
            },
            playList:<playlistOption[]>[],
            rowPlaylist:<Track[]>[],
            killList:<killOption[]>[]
        }
    }

    private checkPlay(){
        if (client.shoukaku.players.has(this.guildId)){
            return false;
        } else {
            return true;
        }
    }

    private resolveNode(): Node | undefined {
        return client.shoukaku.getNode();
    }

    private embedSet(data:embedType,isRecommend?:boolean):embType {
        const newEmbed = Object.assign({},embed);
        newEmbed.title = `${isRecommend ? "✅":"🎶"} | ${data.name}`;
        newEmbed.color = isRecommend ? 0x36eb87:0x426cf5
        newEmbed.fields[0].value = data.videoDuration;
        newEmbed.fields[1].value = `${data.author}`;
        newEmbed.fields[2].value = `[링크](${data.url})`;
        newEmbed.thumbnail.url = `https://i.ytimg.com/vi/${data.id}/mqdefault.jpg`;
        newEmbed.timestamp = new Date().toISOString();
        newEmbed.footer.text = isRecommend ? "추천 기능으로 자동 추가됨":"";
        newEmbed.footer.icon_url = '';
        return newEmbed;
    }

    private addEmbed(metadata:Track,status:number,isRecommend?:boolean):embType {
        const emb = this.embedSet({
            name:metadata.info.title,
            videoDuration:secondsToTime(Math.round(metadata.info.length/1000)),
            author:metadata.info.author,
            url:metadata.info.uri,
            id:metadata.info.identifier
        },isRecommend)
        const embedData:playlistOption = {
            url:metadata.info.uri,
            name:metadata.info.title,
            track:metadata.track,
            embed: emb,
            status:status
        }
        this.data.playList.push(JSON.parse(JSON.stringify(embedData)))
        return emb;
    }

    private async recommendPlay():Promise<embType|undefined> {
        if(!this.data.player) return;
        let index:number = 1;
        let accurate:number = 0;
        const newSearch = await this.search(this.data.playList.filter(e=>e.status === 2)[0].url) as Track[];
        const compareVid = await new CompareVideo().getRecommend(newSearch[0],this.data.playList)
        const searched = await this.search(compareVid) as Track[];
        /** 
        do{
            const compareVid = new CompareVideo().compareVideo(newSearch[index],this.data.playList)
            accurate = compareVid;
            index++;
            if(index > newSearch.length){
                index = 1;
                accurate = -1;
            }
            console.log(accurate);
        } while(accurate > 0.8)
        */
        const embData = this.addEmbed(searched[0],2,true);
        this.data.playList.filter(e=>e.status === 2)[0].status = 0;
        this.data.player!!.playTrack({ track:searched[0].track });
        (<TextBasedChannel>client.channels.cache.get(this.data.option.sendRoom)).send({embeds:[embData]})
        return embData;
    }

    public async search(search_or_link:string):Promise<Track []|null>{
        const node = this.resolveNode()!!;
        const urlRegex = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/;
        const isUrl = urlRegex.test(search_or_link);
        let searchResult: LavalinkResponse | null;
        if (isUrl)
            searchResult = await node.rest.resolve(search_or_link);
        else
            searchResult = await node.rest.resolve(`ytsearch:${search_or_link}`);

        if (!searchResult?.tracks.length) {
            return null;
        }
        return searchResult.tracks;
    }

    public async play(search_or_link:string|Track):Promise<returnType|undefined>{
        const node = this.resolveNode();
        if (!node)
            return;
        let metadata:Track|null;
        if(typeof search_or_link === "string"){
            metadata = (<Track[]> await this.search(search_or_link)).shift()!!;
        } else {
            metadata = search_or_link;
        }

        if(this.checkPlay()){

            const player = await node.joinChannel({
                guildId: this.guildId,
                shardId: 0,
                channelId: this.data.option.playRoom
            });

            await player.playTrack({ track: metadata.track }); 

            this.data.player = player;
            this.data.rowPlaylist.push(metadata)

            new queueManager(this).event();
            const embData = this.addEmbed(metadata,2);
            return { desc:"new",embed:embData, metadata:metadata };

        } else {
            const embData = this.addEmbed(metadata,1);
            this.add(metadata)
            return { desc:"add",embed:embData, metadata:metadata };
        }
    }

    public async add(search_or_link:string|Track):Promise<Track|undefined>{
        const node = this.resolveNode();
        if (!node)
            return;
        if (this.data.rowPlaylist.length <= 0)
            return;
        let metadata:Track|null;
        if(typeof search_or_link === "string"){
            metadata = (<Track[]> await this.search(search_or_link)).shift()!!;
        } else {
            metadata = search_or_link;
        }
        this.data.rowPlaylist.push(metadata!!);
        return metadata!!;
    }

    public stop():boolean {
        if(!this.data.player) return false;
        this.resolveNode()!!.leaveChannel(this.guildId);
        client.shoukaku.players.delete(this.guildId);
        queue.delete(this.guildId);
        return true;
    }

    public async next():Promise<void> {
        if(this.data.playList.length === 0) return;

        const lengthCheck1 = (_this:Queue) => _this.data.playList.filter(e => e.status === 1).length <= 0;
        const lengthCheck2 = (_this:Queue) => _this.data.playList.filter(e=> e.status === 3).length <= 0;

        function normalPlay(_this:Queue):void{
            if(_this.data.playList.filter(e=>e.status === 3).length === 1){
                _this.data.player!!.playTrack({ track:_this.data.playList.filter(e=>e.status === 3)[0].track })
                _this.data.playList.filter(e=>e.status === 3)[0].status = 2;
            }
            else if(_this.data.option.playShuffle){  
                _this.data.playList.filter(e=>e.status === 1).ranPick().status = 3;
            } else {
                _this.data.playList.filter(e=>e.status === 1)[0].status = 3;
            }
            _this.data.playList.filter(e=>e.status === 2)[0].status = 0;
            _this.data.playList.filter(e=>e.status === 3)[0].status = 2;
            _this.data.player!!.playTrack({ track:_this.data.playList.filter(e=>e.status === 2)[0].track });

        }
        function playNext(_this:Queue):void {
            switch (_this.data.option.playRepeat) {
                case 0:
                    if (lengthCheck1(_this)&&lengthCheck2(_this)) {
                        _this.stop();
                        break;
                    } else {
                        normalPlay(_this);
                        break;
                    }
                case 1:
                    if (lengthCheck1(_this)&&lengthCheck2(_this)) {
                        _this.data.playList.forEach(e => e.status = 1);
                        _this.data.playList.filter(e => e.status === 1)[0].status = 2;
                        _this.data.player!!.playTrack({ track:_this.data.playList.filter(e=>e.status === 2)[0].track });
                        break;
                    } else {
                        normalPlay(_this);
                        break;
                    }
                case 2:
                    _this.data.player!!.playTrack({ track:_this.data.playList.filter(e=>e.status === 2)[0].track });
                    break;
            }
        }

        if (this.data.option.playRecommend) {
            if (!lengthCheck1(this)||!lengthCheck2(this)) {
                playNext(this);
            } else {
                await this.recommendPlay(); 
            }
        } else {
            playNext(this);
        }
        
    }

    public skip():embType|undefined {
        if(!this.data.player) return;
        const nowPlayingData = Object.assign({},this.data.playList.filter(e=>e.status > 1)[0].embed)
        this.data.player.stopTrack();
        return nowPlayingData;
    }

    public volume(vol?:number):number|undefined {
        if(!this.data.player) return;
        if(!vol) return this.data.option.playVolume;
        this.data.option.playVolume = vol;
        this.data.player.setVolume(vol/1000);
        return vol;
    }

    public pause():boolean|undefined {
        if(!this.data.player) return;
        if(this.data.player.paused){
            this.data.player.setPaused(false)
            return false;
        } else {
            this.data.player.setPaused(true)
            return true;
        }
    }
}