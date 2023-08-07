import {promisify} from "util";
import * as fs from "fs";
import {exClient} from "./Client";
import {client} from "../app";
import {Logger} from "../plugins/common/logger";
import {Guild} from "discord.js";

import * as sqlite3 from "sqlite3";


type Nullable<T> = {
    [K in keyof T]?: T[K];
};

//----------------server property-----------------//

export type ServerPropertyType = {
    player: {
        volume: string;
    }
    administrator?: string[];
    prefix: string;
    notice: string;
    inviteRoom: string;
}

interface DBServerPropertyType {
    id: string;
    player_volume: string;
    prefix: string;
    notice: string;
    inviteRoom: string;
}

type ServerPropertyTypeList = {
    [key: string]: ServerPropertyType
}

//----------------user property-----------------//

export type UserPropertyType = {
    game: {
        tfze: {
            win: number;
            lose: number;
            score: number;
        }
        fishing: {
            win: number;
            lose: number;
            score: number;
        }
        board: {
            win: number;
            lose: number;
            score: number;
        },
        money: number;
    },
    level: number;
    friendship: number;
}

interface DBUserPropertyType {
    id: string;
    game_tfze: string;
    game_fishing: string;
    game_board: string;
    game_money: string;
    level: number;
    friendship: number;
}

//-----------------------------------------------//

const readdir = promisify(fs.readdir);
sqlite3.verbose();

export class ServerProperty {
    private static DATA_PATH = "./db/data/database"
    private static SERVER_DATA_PATH = `${this.DATA_PATH}/server.db`;

    public static async get(id: string): Promise<DBServerPropertyType | void> {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(this.SERVER_DATA_PATH);
            db.get(
                'SELECT * FROM serverData WHERE id = ?',
                [id],
                (err, row: DBServerPropertyType) => {
                    if (err) {
                        Logger.error(err);
                        reject(err);
                    } else if (!row) {
                        Logger.error("row is null");
                        reject("row is null");
                    } else {
                        resolve(row);
                        db.close((closeErr) => {
                            if (closeErr) {
                                Logger.error('Error closing the database:', closeErr.message);
                            }
                        });
                    }
                }
            );
        });
    }

    public static async load(client: exClient) {
        const fileList = await readdir(this.DATA_PATH);
        if (!fileList.includes("server.db")) {
            await Promise.all(client.guilds.cache.map(async (value: Guild, key: string) => {
                await this.set(value.id); // save 함수가 비동기 함수이므로 await 사용
            }));
            Logger.warn("Property not loaded");
        } else {
            const db = new sqlite3.Database(this.SERVER_DATA_PATH);

            db.all(
                'SELECT * FROM serverData',
                (err, rows: DBServerPropertyType[]) => {
                    if (err) {
                        console.error(err);
                    } else {
                        const idList = client.guilds.cache.map(e => e.id);
                        rows.forEach((row: DBServerPropertyType) => {
                            if (!idList.includes(String(row.id))) {
                                this.set(row.id); // 데이터가 없는 경우만 저장
                            }
                        });
                        Logger.debug(rows);
                    }
                    db.close((err) => {
                        if (err) {
                            Logger.error('Error closing the database:', err.message);
                        } else {
                            Logger.info("Property loaded");
                            Logger.info('Database connection closed.');
                        }
                    });
                }
            );
        }
    }

    public static async fromJSON(json: ServerPropertyTypeList) {
        const db = new sqlite3.Database(this.SERVER_DATA_PATH);
        db.all(
            `SELECT id FROM serverData`,
            (err, rows: { id: string }[]) => {
                if (err) {
                    console.error(err);
                } else {
                    const idList = rows.map(e => e.id);
                    Object.keys(json).forEach((key: string) => {
                        if (!idList.includes(key)) {
                            this.set(key); // 데이터가 없는 경우만 저장
                        } else {
                            Logger.warn(`${key} is already exist`);
                            Logger.debug(json[key]);
                            this.save(key, json[key]);
                        }
                    });
                }
                db.close((err) => {
                    if (err) {
                        Logger.error('Error closing the database:', err.message);
                    } else {
                        Logger.info("Successfully loaded from JSON");
                        Logger.info('Database connection closed.');
                    }
                });
            }
        )
    }

    public static async set(id: string, data?: ServerPropertyType) {
        const json: ServerPropertyType =
            data // data가 있으면 data를, 없으면 기본값을 사용
            ??
            {
                player: {
                    volume: "100"
                },
                prefix: "!",
                notice: '',
                inviteRoom: ''
            };

        const db = new sqlite3.Database(this.SERVER_DATA_PATH);

        // 테이블 생성 및 데이터 삽입 쿼리 실행
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS serverData (
                    id TEXT PRIMARY KEY,
                    player_volume TEXT,
                    prefix TEXT,
                    notice TEXT,
                    inviteRoom TEXT
                )
            `);

            db.run(`
                INSERT INTO serverData (
                    id,
                    player_volume,
                    prefix,
                    notice,
                    inviteRoom
                ) VALUES (?, ?, ?, ?, ?)
                `,
                [id, json.player.volume, json.prefix, json.notice, json.inviteRoom]
            );
        });

        // 데이터베이스 연결 닫기
        db.close((err) => {
            if (err) {
                Logger.error('Error closing the database:', err.message);
            } else {
                Logger.info('Database connection closed.');
            }
        });
    }


    public static async save(id: string, data: Nullable<ServerPropertyType>) {
        const db = new sqlite3.Database(this.SERVER_DATA_PATH);

        // UPDATE 쿼리를 작성하기 전에 기존 데이터를 먼저 가져옵니다.
        const existingData: ServerPropertyType | null = await new Promise<ServerPropertyType | null>((resolve, reject) => {
            db.get('SELECT * FROM serverData WHERE id = ?', [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row as ServerPropertyType | null);
                }
            });
        });

        if (!existingData) {
            db.run(
                `
                INSERT INTO serverData (id, player_volume, prefix, notice, inviteRoom)
                VALUES (?, ?, ?, ?, ?)
                `,
                [id, data.player?.volume, data.prefix, data.notice, data.inviteRoom]
            );
        } else {
            db.run(
                `
                UPDATE serverData SET
                    player_volume = ?,
                    prefix = ?,
                    notice = ?,
                    inviteRoom = ?
                WHERE id = ?
                `,
                [
                    data.player?.volume || existingData.player.volume,
                    data.prefix || existingData.prefix,
                    data.notice || existingData.notice,
                    data.inviteRoom || existingData.inviteRoom,
                    id
                ]
            );
        }

        db.close((err) => {
            if (err) {
                Logger.error('Error closing the database:', err.message);
            } else {
                Logger.info('Database connection closed.');
            }
        });
    }

}

export class UserProperty {
    private static DATA_PATH = "./db/data/database"
    private static USER_DATA_PATH = `${this.DATA_PATH}/user.db`;

    public static async get(id: string) {
        if (!fs.existsSync(this.USER_DATA_PATH)) {
            await this.init();
        }
        const db = new sqlite3.Database(this.USER_DATA_PATH);
        const data: DBUserPropertyType | undefined = await new Promise<DBUserPropertyType | undefined>((resolve, reject) => {
            db.get('SELECT * FROM userData WHERE id = ?', [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    if (!row)
                        resolve(undefined)
                    else
                        resolve(row as DBUserPropertyType);
                }
            });
        });

        db.close((err) => {
            if (err) {
                Logger.error('Error closing the database:', err.message);
            } else {
                Logger.info('Database connection closed.');
            }
        });
        if (!data)
            return undefined;
        else
            return {
                game: {
                    tfze: JSON.parse(data?.game_tfze || "{}"),
                    fishing: JSON.parse(data?.game_fishing || "{}"),
                    board: JSON.parse(data?.game_board || "{}"),
                    money: data?.game_money || 1000,
                },
                level: data?.level || 0,
                friendship: data?.friendship || 0,
            };
    }

    public static async init() {
        const db = new sqlite3.Database(this.USER_DATA_PATH);
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS userData (
                    id TEXT PRIMARY KEY,
                    game_tfze TEXT,
                    game_fishing TEXT,
                    game_board TEXT,
                    game_money INTEGER,
                    level INTEGER,
                    friendship INTEGER
                )
            `);
        });
        db.close((err) => {
            if (err) {
                Logger.error('Error closing the database:', err.message);
            } else {
                Logger.info('Database connection closed.');
            }
        });
    }

    public static async set(id: string) {
        const json: UserPropertyType = {
            game: {
                tfze: {
                    win: 0,
                    lose: 0,
                    score: 0
                },
                fishing: {
                    win: 0,
                    lose: 0,
                    score: 0
                },
                board: {
                    win: 0,
                    lose: 0,
                    score: 0
                },
                money: 1000,
            },
            level: 0,
            friendship: 0,
        }
        const db = new sqlite3.Database(this.USER_DATA_PATH);

        // 테이블 생성 및 데이터 삽입 쿼리 실행
        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS userData (
                    id TEXT PRIMARY KEY,
                    game_tfze TEXT,
                    game_fishing TEXT,
                    game_board TEXT,
                    game_money TEXT,
                    level INTEGER,
                    friendship INTEGER
                )
                    
           `);

            db.run(`
                INSERT INTO userData (
                    id,
                    game_tfze,
                    game_fishing,
                    game_board,
                    game_money,
                    level,
                    friendship
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [id, JSON.stringify(json.game.tfze), JSON.stringify(json.game.fishing), JSON.stringify(json.game.board), json.game.money, json.level, json.friendship]
            );
        });

        // 데이터베이스 연결 닫기
        db.close((err) => {
            if (err) {
                Logger.error('Error closing the database:', err.message);
            } else {
                Logger.info('Database connection closed.');
            }
        });

        return json;
    }

    public static async save(id: string, data: Nullable<UserPropertyType>) {
        const db = new sqlite3.Database(this.USER_DATA_PATH);

        // UPDATE 쿼리를 작성하기 전에 기존 데이터를 먼저 가져옵니다.
        const existingData: UserPropertyType | null = await new Promise<UserPropertyType | null>((resolve, reject) => {
            db.get('SELECT * FROM userData WHERE id = ?', [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row as UserPropertyType | null);
                }
            });
        });

        if (!existingData) {
            db.run(
                `
                INSERT INTO userData (id, game_tfze, game_fishing, game_board, game_money, level, friendship)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                `,
                [id, data.game?.tfze, data.game?.fishing, data.game?.board, data.game?.money, data.level, data.friendship]
            );
        } else {
            db.run(
                `
                UPDATE userData SET
                    game_tfze = ?,
                    game_fishing = ?,
                    game_board = ?,
                    game_money = ?,
                    level = ?,
                    friendship = ?
                WHERE id = ?
                `,
                [
                    data.game?.tfze || existingData.game.tfze,
                    data.game?.fishing || existingData.game.fishing,
                    data.game?.board || existingData.game.board,
                    data.game?.money || existingData.game.money,
                    data.level || existingData.level,
                    data.friendship || existingData.friendship,
                    id
                ]
            );
        }

        db.close((err) => {
            if (err) {
                Logger.error('Error closing the database:', err.message);
            } else {
                Logger.info('Database connection closed.');
            }
        });
    }


}