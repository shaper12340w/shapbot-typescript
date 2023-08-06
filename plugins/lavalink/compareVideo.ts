import {Track} from "shoukaku";
import * as ytdl from "ytdl-core";
import {SoundcloudScrapper,SoundCloudTrack} from "./soundcloudScrapper"
import {CompareString} from "../common/compare";
import {playlistOption} from "./manageQueue";
import {Logger} from "../common/logger";

const delay = (ms: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export class CompareVideo extends CompareString {
    constructor() {
        super()
    }

    private youtubeURI(uri: string): string | boolean {
        const pattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/)?([A-Za-z0-9_-]{11})/;
        const match = uri.match(pattern);
        if (match) {
            const videoId = match[1];
            return videoId;
        } else {
            return false
        }
    }

    public async getRecommend(track: Track, list: playlistOption[], time?: number): Promise<string | void> {
        const matchTime = time ?? 3600;
        if (track.info.sourceName === "youtube") {
            const getInfo = await ytdl.getInfo(track.info!!.uri!!);
            const relatedVideos = getInfo.related_videos;
            const result = relatedVideos.find((info: ytdl.relatedVideo) => {
                if (!info.isLive) //라이브 아님
                    if (info.length_seconds!! < matchTime) //시간 제한
                        if (info.id !== track.info.identifier) //재생중인 곡과 같은 곡은 X
                            if (!list.find(e => e.url.includes(info.id!!))) //재생목록에 있는 곡 X
                                return info;
            })
            if (result)
                return "https://www.youtube.com/watch?v=" + result.id;
            else
                throw new Error("No related videos found.")
        } else if (track.info.sourceName === "soundcloud") {
            const regex = /tracks:(\d+)/;
            const matchResult = track.info.identifier.match(regex);
            if (matchResult) {
                const trackId = matchResult[1];
                Logger.debug("Track ID: "+ trackId);
            } else {
                Logger.error("Track ID not found.");
                return;
            }
            const track_id = matchResult!![1]
            const relatedVideos = await SoundcloudScrapper.findRelated(track_id) as SoundCloudTrack[]
            const result = relatedVideos.find((info:SoundCloudTrack)=>{
                if (info.duration/1000 < matchTime)
                    if (String(info.id) !== track_id)
                        if(!list.find(e=>e.url.includes(info.permalink_url)))
                            return info
            })
            if(result)
                return result.permalink_url
            else
                throw new Error("No related videos found.")
        }

    }

}