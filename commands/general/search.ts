import {Command} from "../../structures/Command";
import {
    AttachmentBuilder,
    CommandInteraction,
    CommandInteractionOptionResolver,
    EmbedBuilder,
    Message,
    SlashCommandBuilder
} from "discord.js";
import {ParseMinecraft} from "../../plugins/common/parsing";
import {Artiva} from "../../plugins/image/Artiva";
import {PagedButton} from "../../plugins/discord/buttonPage";
import {LoRAResponse} from "../../plugins/image/types/InfoLoRATypes";


function exec_Minecraft(interaction: CommandInteraction | Message, id: string) {
    ParseMinecraft.parseInfo(id).then(async (data) => {
        if(!data){
            await interaction.reply("존재하지 않는 유저입니다");
            return;
        }
        const bodyImage = await ParseMinecraft.resizeImage(await ParseMinecraft.createFrontImageFromSkin(data.properties[0].decrypted!!.textures.SKIN.url), 16);
        const file = new AttachmentBuilder(bodyImage, {name: data.name + ".png"});
        const embed = new EmbedBuilder()
            .setTitle(`${data.properties[0].decrypted!!.profileName}님의 마인크래프트 프로필`)
            .setImage(`attachment://${data.name}.png`)
            .setColor("#0000ff")
            .addFields(
                [
                    {
                        name: "닉네임",
                        value: data.name,
                        inline: false
                    },
                    {
                        name: "UUID",
                        value: data.id,
                        inline: false
                    },
                    {
                        name: "스킨",
                        value: `[[Link]](${data.properties[0].decrypted!!.textures.SKIN.url})`,
                        inline: false
                    },
                    {
                        name: "망토",
                        value: data.properties[0].decrypted!!.textures.CAPE ? `[[Link]](${ data.properties[0].decrypted!!.textures.CAPE.url})` : "없음",
                        inline: false
                    }
                ]
            )
        await interaction.reply({
            embeds: [embed],
            files: [file]
        });

    })
}

async function exec_LoRA(interaction: CommandInteraction | Message, name: string) {
    if(!(interaction instanceof Message)) await interaction.deferReply();
    const data = await Artiva.getLora(name);
    const getEmbed = async (page: number,data:LoRAResponse[]) => {
        return new EmbedBuilder()
            .setTitle(`${name}에 대한 로라`)
            .setColor("#0000ff")
            .setImage(await Artiva.getLoraImage(data[page].external_url))
            .addFields(
                [
                    {
                        name: "ID",
                        value: data[page].id,
                        inline: false
                    },
                    {
                        name: "이름",
                        value: data[page].name,
                        inline: false
                    },
                    {
                        name: "예시",
                        value: data[page].example,
                        inline: false
                    },
                    {
                        name: "링크",
                        value: `${data[page].external_url}`,
                        inline: false
                    }
                ]
            )
    }
    if(!data){
        if(!(interaction instanceof Message)) await interaction.editReply("존재하지 않는 로라입니다");
        else await interaction.reply("존재하지 않는 로라입니다");
        return;
    }
    const page = new PagedButton({
        start: 1,
        end: data.length,
        showIndex: true,
    }).options({
        embeds: [await getEmbed(0,data)],
    }).on("pageUpdate", async (page,original,index) => {
        await page.edit({
            embeds: [await getEmbed(index-1,data)],
        });
    });
    await page.send(interaction);
}
export default new Command({
    interaction: {
        data: new SlashCommandBuilder()
            .setName('search')
            .setNameLocalizations({
                "ko": "검색"
            })
            .setDescription('검색')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('minecraft')
                    .setNameLocalizations({
                        "ko": "마크"
                    })
                    .setDescription('마크 프로필 검색')
                    .addStringOption(option =>
                        option.setName('nickname')
                            .setDescription('검색어')
                            .setRequired(true)
                    )
            )
            .addSubcommand(subcommand =>
                subcommand
                    .setName('lora')
                    .setNameLocalizations({
                        "ko": "로라"
                        })
                    .setDescription('로라 정보 검색')
                    .addStringOption(option =>
                        option.setName('name')
                            .setDescription('검색어')
                            .setRequired(true)
                    )
            ),
        async execute(interaction: CommandInteraction) {
            const option = (interaction.options as CommandInteractionOptionResolver);
            switch (option.getSubcommand()) {
                case "minecraft":
                    try{
                        const nickname = option.getString("nickname", true);
                        const result = await ParseMinecraft.parseUUID(nickname);
                        if (result) {
                            exec_Minecraft(interaction, result);
                        } else {
                            await interaction.reply("존재하지 않는 닉네임입니다.");
                        }
                    } catch (e) {
                        await interaction.reply("존재하지 않는 닉네임입니다.");
                    }
                    break; // 마크
                case "lora":
                    try{
                        const name = option.getString("name", true);
                        await exec_LoRA(interaction, name);
                    } catch (e) {
                        await interaction.reply("존재하지 않는 로라입니다.");
                    }
            }

        },
    },
    message: {
        data: {
            name: "search",
            description: "검색",
        },
        async execute(message) {

        }
    }
});