import * as alsong from 'alsong-lyrics'
import {getSubtitles, LanguageList, SubtitleLine} from 'youtube-captions-scraper'
import {APIEmbed, EmbedBuilder, Message} from "discord.js";
import {Queue} from "./manageQueue";
import {Logger} from "../common/logger";

export class LyricsHelper {

    public static latency: number = 0;
    public static messageList: Map<string, Message | null> = new Map();

    private static delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private static changeToMillisecond(time: string): number {
        const mil = (Number(time.split(".")[1]) ?? 0)
        const total = time
            .split(".")[0]
            .split(":")
            .reverse()
            .map((e, i) => {
                switch (i) {
                    case 0:
                        return (Number(e) ?? 0) * 1000;
                    case 1:
                        return (Number(e) ?? 0) * 1000 * 60;
                    case 2:
                        return (Number(e) ?? 0) * 1000 * 60 * 60;
                    case 3:
                        return (Number(e) ?? 0) * 1000 * 60 * 60 * 24;
                    default:
                        return 0;
                }
            })
            .reduce((acc, cur) => acc + cur, 0);
        return total + mil;
    }

    private static transformSubtitle(originalSubtitle:alsong.Lyrics[],delay:number):SubtitleLine[] {
        function calculateDur(currentTime:string, nextTime:string) {
            const currentStart = LyricsHelper.changeToMillisecond(currentTime);
            const nextStart = LyricsHelper.changeToMillisecond(nextTime);

            return nextStart - currentStart;
        }

        const modifiedSubtitle = originalSubtitle.map((item, index, array) => {
            const start = String((LyricsHelper.changeToMillisecond(item.time) - delay) / 1000);
            const dur = String((index < array.length - 1 ? calculateDur(item.time, array[index + 1].time) : 0) / 1000);
            const text = item.text.join('\n');

            return {
                start,
                dur,
                text,
            } as SubtitleLine;
        });

        return modifiedSubtitle;
    }

    public static async getLyrics(guildId: string, queue: Queue): Promise<SubtitleLine[] | undefined> {
        const sendedMessage = LyricsHelper.messageList.get(guildId)!!
        const start = performance.now();
        try {
            const playingData = (await queue.playStatusList()).playing;
            const author = playingData.track!!.info.author.replace(" - Topic", '')
            switch (playingData.track!!.info.sourceName) {
                case "youtube":
                    const getCaption = await LyricsHelper.getYoutubeCaption(playingData.track!!.info.identifier,start);
                    if (getCaption) {
                        return getCaption
                    } else {
                        throw new Error("가사가 없습니다")
                    }
                default:
                    const firstValue = await alsong.getLyricsSearchFirst(author, playingData.track!!.info.title);
                    const getResult = await alsong.getLyricsFromID(firstValue.lyricID);
                    const delayStack = performance.now() - start + LyricsHelper.latency;
                    return LyricsHelper.transformSubtitle(getResult.lyric, delayStack);
            }
        } catch (e) {
            Logger.error(e)
            await sendedMessage.edit({embeds: [new EmbedBuilder().setColor("#ff3434").setDescription("❌ 가사가 없습니다")]})
        }
    }

    public static async getYoutubeCaption(videoId: string,first:number = 0) {
        const langList = ["ko", "en", "jp", undefined] as LanguageList[];
        for (let i = 0; i < langList.length; i++) {
            try {
                const getSubtitle = await getSubtitles({videoID: videoId, lang: langList[i]});
                const delay = performance.now() - first;
                const result = getSubtitle.map((item) => {
                    return {
                        ...item,
                        start: String(Number(item.start) - ((delay+LyricsHelper.latency) / 1000)),
                    }
                })
                return result;
            } catch (e) {
            }
        }
        return null;
    }

    public static async editLyrics(guildId: string, queue: Queue) {
    const lyricsList = await LyricsHelper.getLyrics(guildId, queue);

    if (lyricsList) {
        const sendedMessage = LyricsHelper.messageList.get(guildId)!!;
        const start = performance.now(); // 시작 시간 측정
        await sendedMessage.edit({
            embeds: [
                new EmbedBuilder()
                    .setTitle("🎵 가사")
                    .setDescription((await queue.playStatusList()).playing.track!!.info.title)
                    .setFooter({ text: `1/${lyricsList.length}` })
                    .setColor("#ff3434"),
            ],
        });

        await LyricsHelper.delay(Number(lyricsList[0].start) * 1000 - LyricsHelper.latency)

        for (let i = 0; i < lyricsList.length; i++) {
            if (LyricsHelper.messageList.get(guildId)) {

                sendedMessage.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("🎵 가사")
                            .setDescription(lyricsList[i].text)
                            .setFooter({ text: `${i + 1}/${lyricsList.length}` })
                            .setColor("#ff3434"),
                    ],
                });
                const duration = (
                    lyricsList[i + 1]
                    ? (
                        Number(lyricsList[i + 1].start) < 0
                            ? 0
                            : Number(lyricsList[i + 1].start)
                    ) - (
                        Number(lyricsList[i].start) < 0
                        ? 0
                        :Number(lyricsList[i].start)
                    )
                    : 0
                ) * 1000
                const mediateTime =  queue.data.player!!.position - Number(lyricsList[i].start) * 1000;
                await LyricsHelper.delay(duration - mediateTime/2.5);
                Logger.debug(mediateTime)
            }
        }
    } else {
        const sendedMessage = LyricsHelper.messageList.get(guildId)!!
        await sendedMessage.edit({embeds: [new EmbedBuilder().setColor("#ff3434").setDescription("❌ 가사가 없습니다")]})
    }
}



}

/**
 *
 * 계획
 *
 * 1. 핑 계산
 * 2. 메세지 리턴값 가져오기
 * 3. 가사 검색 => 없으면 수정 X 있을경우만
 *
 * 1. 디코 핑 계산
 * 2. 가사 가져오기
 * 3. 메세지 수정하기
 *
 **/
