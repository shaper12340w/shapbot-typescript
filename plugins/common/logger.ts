import {getToday} from "./extras";
import chalk from "chalk";
import * as config from "../../structures/Configs"
import * as util from "util";
import fs from "fs";


const colors = {
    info: chalk.hex('#009cf0'),
    debug: chalk.hex("#00a420"),
    warn: chalk.hex("#d5e128"),
    error: chalk.bold.red
}

function isJSON(value: any) {
    try {
        JSON.parse(value);
        return true;
    } catch (error: unknown) {
        return false;
    }
}

type logType = "info" | "debug" | "warn" | "error";

export class Logger {
    private static change(desc: any[], type: logType) {
        return desc.map(e => {
            const str = function () {
                if (typeof e === "string")
                    return e
                else if (isJSON(e))
                    return JSON.stringify(JSON.parse(e), null, 3)
                else
                    return util.inspect(e);
            }
            const currentTime = getToday() + " "
            const logString = (type?: string) => (type ? `[${type}]` : "") + currentTime + (str() + "\n").replace(/\n/g, `\n${(type ? `[${type}]` : "")}${currentTime}`);
            this.saveFile(logString(type), type);
            return logString(type);
        }).join("\n")
    }

    private static saveFile(str: string, type: logType) {
        fs.appendFile(
            `./db/data/files/${type}.txt`,
            "\n" + str,
            (error) => {
                if (error) throw error;
            }
        );
    }

    public static info(...desc: any) {
        console.log(colors.info(this.change(desc, "info")))
    }

    public static debug(...desc: any) {
        const data = colors.debug(this.change(desc, "debug"));
        if (config.bot.showDebug)
            console.debug(data)
    }

    public static warn(...desc: any) {
        console.warn(colors.warn(this.change(desc, "warn")))
    }

    public static error(...desc: any) {
        console.error(colors.error(this.change(desc, "error")))
    }
}
