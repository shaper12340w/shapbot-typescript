import {joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource,AudioPlayer,StreamType} from "@discordjs/voice";
import {CommandInteraction, GuildMember, Interaction, Message} from "discord.js";
import {Readable} from "stream";
export class VoiceManager {

    public static queue: Map<string, AudioPlayer> = new Map();
    public static join(interaction_or_message: CommandInteraction | Message) {
        const voiceChannel = (<GuildMember>interaction_or_message.member!!).voice.channel
        if (!voiceChannel) {
            return interaction_or_message.reply({
                content: "음성 채널에 먼저 들어가주세요",
                ephemeral: true
            })
        }
        return joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: interaction_or_message.guild!!.id,
            adapterCreator: interaction_or_message.guild!!.voiceAdapterCreator,
        });
    }

    public static get(guildId: string) {
        return getVoiceConnection(guildId);
    }

    public static leave(guildId: string): boolean {
        const connection = this.get(guildId);
        if (connection) {
            connection.destroy();
            this.queue.delete(guildId);
            return true;
        } else
            return false;
    }

    public static play(guildId: string, stream:Readable) {
        const connection = this.get(guildId);
        if(!this.queue.has(guildId)) {
            const player = createAudioPlayer();
            this.queue.set(guildId, player);
        }
        if (connection) {
            const audioResource = createAudioResource(stream,{
                inputType: StreamType.Arbitrary,
                inlineVolume: true
            });
            this.queue.get(guildId)!!.play(audioResource)
            connection.subscribe(this.queue.get(guildId)!!)
            return true
        } else
            return false;
    }
}