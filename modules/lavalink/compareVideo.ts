import { Track } from "shoukaku";
import * as ytdl from "ytdl-core";
import { CompareString } from "../common/compare";
import { playlistOption } from "./manageQueue";

const delay = (ms:number) => {
    return new Promise((resolve)=>{
       setTimeout(resolve,ms);
    });
 }

export class CompareVideo extends CompareString{
    constructor(){
        super()
    }
    private youtubeURI(uri:string):string | boolean {
        const pattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/)?([A-Za-z0-9_-]{11})/;
        const match = uri.match(pattern);
        if (match) {
            const videoId = match[1];
            return videoId;
        } else {
            return false
        }
    }
    public async getRecommend(track:Track,list:playlistOption[],time?:number):Promise<string|void> {
        const matchTime = time ?? 3600;
        const getInfo = await ytdl.getInfo(track.info.uri);
        const relatedVideos = getInfo.related_videos;
        const result = relatedVideos.find((info:ytdl.relatedVideo)=>{
            if(!info.isLive&&info.length_seconds!! < matchTime&&info.id !== track.info.identifier)
                return info
        })
        if(result)
            return "https://www.youtube.com/watch?v="+result.id;

    }

}