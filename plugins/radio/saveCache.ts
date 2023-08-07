import axios from "axios";
import fs from "fs";
import {Logger} from "../common/logger";

export class ManageRadio {
    public static async downloadFile(url: string, path: string) {
        try {
            const response = await axios({
                method: 'get',
                url: url,
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(path);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });
        } catch (error) {
            Logger.error('Download failed:', error);
        }
    }

    public static async downloadFiles(urls: string[], names: string[], path: string) {
        try {
            await Promise.all(urls.map(async (url, index) => {
                const filename = Buffer.from(names[index]).toString("base64") + ".pls";
                const destination = `${path}/${filename}`;
                await this.downloadFile(url, destination);
            }));
            return true;
        } catch (error) {
            return false;
        }
    }

    public static init() {
        const list = require('../../db/data/json/radioList.json');
        const notM3u8List = Object.keys(list)
            .filter((key) => {
                const link = list[key];
                if (link.includes('pls')) {
                    return true;
                }
            })
        const notM3u8LinkList = notM3u8List
            .map((key) => {
                return list[key] as string;
            });
        return this.downloadFiles(notM3u8LinkList, notM3u8List, './db/cache/radio').then((result) => {
            const fileList = fs.readdirSync('./db/cache/radio');
            fileList.forEach((file) => {
                const fileString = fs.readFileSync(`./db/cache/radio/${file}`, 'utf-8');
                const m3u8Link = fileString.split('\n')[1].replace("File1=", "");
                const title = fileString.split('\n')[2].replace("Title1=", "");
                list[title] = m3u8Link;
            })
            for (const key in list) {
                if (list[key].endsWith(".pls")) {
                    delete list[key];
                }
            }
            fs.writeFileSync('./db/data/json/radio_cache.json', JSON.stringify(list, null, 2));
            return true;
        }).catch((error) => {
            Logger.error(error);
            return false;
        });
    }
}