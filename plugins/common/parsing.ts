import axios from 'axios'
import {createCanvas, loadImage} from 'canvas';
import * as _PNG from 'pngjs';
import {pipeline} from 'stream';
import {promisify} from "util";

const pixels = require('image-pixels');
const PNG = _PNG.PNG;
const pipelineAsync = promisify(pipeline);

interface PlayerProperty {
    name: string;
    value: string;
    decrypted?: PlayerValue;
    signature?: string;
}

interface PlayerData {
    id: string;
    name: string;
    properties: PlayerProperty[];
}

interface PlayerTextures {
    SKIN: {
        url: string;
    };
    CAPE?: {
        url: string;
    };
}

interface PlayerValue {
    timestamp: number; // 자바 시간으로 밀리초
    profileId: string; // 프로파일 UUID
    profileName: string; // 플레이어 이름
    isPublic: boolean; // true 혹은 false
    textures: PlayerTextures;
}

interface Coords {
    xMin: number;
    yMin: number;
    xMax?: number;
    yMax?: number;
}

interface SkinOffsets {
    source: Coords;
    out: Coords;
}

interface SkinOffsetsMap {
    [key: string]: SkinOffsets;
}


export class ParseMinecraft {
    static readonly headSize = {
        width: 8,
        height: 8,
    };
    static readonly frontSize = {
        width: 16,
        height: 32,
    };
        static readonly skinOffs: SkinOffsetsMap = {
        head: {
            source: {xMin: 8, yMin: 8},
            out: {xMin: 4, xMax: 11, yMin: 0, yMax: 7},
        },
        lHand: {
            source: {xMin: 44, yMin: 20},
            out: {xMin: 0, xMax: 3, yMin: 8, yMax: 19},
        },
        body: {
            source: {xMin: 20, yMin: 20},
            out: {xMin: 4, xMax: 11, yMin: 8, yMax: 19},
        },
        rHand: {
            source: {xMin: 44, yMin: 20},
            out: {xMin: 12, xMax: 15, yMin: 8, yMax: 19},
        },
        lLeg: {
            source: {xMin: 4, yMin: 20},
            out: {xMin: 4, xMax: 7, yMin: 20, yMax: 31},
        },
        rLeg: {
            source: {xMin: 4, yMin: 20},
            out: {xMin: 8, xMax: 11, yMin: 20, yMax: 31},
        },
        cl_Head: {
            source: {xMin: 40, yMin: 8},
            out: {xMin: 4, xMax: 11, yMin: 0, yMax: 7},
        },

        cl_body: {
            source: {xMin: 20, yMin: 36},
            out: {xMin: 4, xMax: 11, yMin: 8, yMax: 19},
        },

        cl_lHand: {
            source: {xMin: 44, yMin: 36},
            out: {xMin: 0, xMax: 3, yMin: 8, yMax: 19},
        },

        cl_rHand: {
            source: {xMin: 52, yMin: 52},
            out: {xMin: 12, xMax: 15, yMin: 8, yMax: 19},
        },
        cl_lLeg: {
            source: {xMin: 4, yMin: 36},
            out: {xMin: 4, xMax: 7, yMin: 20, yMax: 31},
        },
        cl_rLeg: {
            source: {xMin: 4, yMin: 52},
            out: {xMin: 8, xMax: 11, yMin: 20, yMax: 31},
        },
    };
    public static async parseUUID(nickname: string): Promise<string | void> {
        try {
            const response = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${nickname}?at=0`);
            return response.data.id;
        } catch (e) {
            return void 0;
        }
    }

    public static async parseInfo(UUID: string) {
        try {
            const response = await axios.get(`https://sessionserver.mojang.com/session/minecraft/profile/${UUID}`);
            const data = response.data as PlayerData;
            const value = JSON.parse(Buffer.from(data.properties[0].value, "base64").toString('utf8')) as PlayerValue;
            data.properties[0].decrypted = value;
            return data;
        } catch (e) {
            return void 0;
        }

    }

    static async downloadImageToBuffer(imageUrl: string): Promise<Buffer> {
        try {
            const response = await axios.get(imageUrl, {responseType: 'arraybuffer'});
            return Buffer.from(response.data, 'binary');
        } catch (error: unknown) {
            throw new Error(`Error downloading image: ${(error as Error).message}`);
        }
    }

    static async extractImageToMatrix(skinPath: Buffer): Promise<Array<Array<[number, number, number, number]>>> {
        const arrayImage: Array<[number, number, number, number]> = [];

        const data = [...(await pixels(skinPath)).data];

        while (data.length !== 0) {
            arrayImage.push([data[0], data[1], data[2], data[3]]);
            data.splice(0, 4);
        }

        const matrixImage: Array<Array<[number, number, number, number]>> = new Array(64);
        for (let i = 0; i < matrixImage.length; i++) matrixImage[i] = new Array(64);

        for (let i = 0, y = 0, x = 0; i < arrayImage.length; i++) {
            matrixImage[y][x] = arrayImage[i];

            if (x === 63) {
                x = 0;
                y++;
            } else x++;
        }

        return matrixImage;
    }

    static async createFrontImageFromSkin(skinPath: Buffer | string): Promise<Buffer> {
        if (typeof skinPath === 'string') skinPath = await ParseMinecraft.downloadImageToBuffer(skinPath);
        const imageMatrix = await ParseMinecraft.extractImageToMatrix(skinPath);

        let rawData: Array<Array<[number, number, number, number]>> = new Array(32);

        for (let i = 0; i < rawData.length; i++) {
            rawData[i] = new Array(16);
            rawData[i].fill([0, 0, 0, 0]);
        }

        for (const keys in ParseMinecraft.skinOffs) {
            let mx = ParseMinecraft.skinOffs[keys].out.xMin,
                my = ParseMinecraft.skinOffs[keys].out.yMin,
                rx = ParseMinecraft.skinOffs[keys].source.xMin,
                ry = ParseMinecraft.skinOffs[keys].source.yMin;

            if (keys === 'rHand' || keys === 'rLeg') {
                for (mx = ParseMinecraft.skinOffs[keys].out.xMax!, my, rx, ry; my <= ParseMinecraft.skinOffs[keys].out.yMax! && mx >= ParseMinecraft.skinOffs[keys].out.xMin; mx--, rx++) {
                    rawData[my][mx] = imageMatrix[ry][rx];

                    if (mx === ParseMinecraft.skinOffs[keys].out.xMin) {
                        my++;
                        ry++;

                        mx = ParseMinecraft.skinOffs[keys].out.xMax! + 1;
                        rx = ParseMinecraft.skinOffs[keys].source.xMin - 1;
                    }
                }
                continue;
            }

            for (let mx = ParseMinecraft.skinOffs[keys].out.xMin, my = ParseMinecraft.skinOffs[keys].out.yMin, rx = ParseMinecraft.skinOffs[keys].source.xMin, ry = ParseMinecraft.skinOffs[keys].source.yMin; my <= ParseMinecraft.skinOffs[keys].out.yMax! && mx <= ParseMinecraft.skinOffs[keys].out.xMax!; mx++, rx++) {
                if (imageMatrix[ry][rx] !== undefined && imageMatrix[ry][rx][3] !== 0) {
                    rawData[my][mx] = imageMatrix[ry][rx];
                }

                if (mx === ParseMinecraft.skinOffs[keys].out.xMax) {
                    my++;
                    ry++;

                    mx = ParseMinecraft.skinOffs[keys].out.xMin - 1;
                    rx = ParseMinecraft.skinOffs[keys].source.xMin - 1;
                }
            }
        }
        const imageData = new Uint8ClampedArray(rawData.flat(2));
        const png = new PNG({width: ParseMinecraft.frontSize.width, height: ParseMinecraft.frontSize.height});

        png.data = Buffer.from(imageData);

        const chunks: Uint8Array[] = [];

        const pngStream = png.pack();

        await pipelineAsync(
            pngStream,
            async function* (source) {
                for await (const chunk of source) {
                    chunks.push(chunk);
                    yield chunk;
                }
            }
        );

        return Buffer.concat(chunks);
    }

    static async createHeadImageFromSkin(skinPath: Buffer | string): Promise<Buffer> {
        if (typeof skinPath === 'string') skinPath = await ParseMinecraft.downloadImageToBuffer(skinPath);
        const imageMatrix = await ParseMinecraft.extractImageToMatrix(skinPath);

        const rawData: Array<[number, number, number, number]> = [];

        for (let x = 8, y = 8; x <= 15 && y <= 15; x++) {
            rawData.push(imageMatrix[y][x]);

            if (x === 15) {
                y++;
                x = 7;
            }
        }

        for (let x = 40, y = 8, i = 0; x <= 47 && y <= 15; x++, i++) {
            if (imageMatrix[y][x] !== undefined && imageMatrix[y][x][3] !== 0) rawData[i] = imageMatrix[y][x];

            if (x === 47) {
                y++;
                x = 39;
            }
        }

        const imageData = new Uint8ClampedArray(rawData.flat(2));
        const png = new PNG({width: ParseMinecraft.headSize.width, height: ParseMinecraft.headSize.height});
        png.data = Buffer.from(imageData);

        const chunks: Uint8Array[] = [];

        const pngStream = png.pack();

        await pipelineAsync(
            pngStream,
            async function* (source) {
                for await (const chunk of source) {
                    chunks.push(chunk);
                    yield chunk;
                }
            }
        );

        return Buffer.concat(chunks);
    }

    static async resizeImage(buffer: Buffer, mutiplier: number): Promise<Buffer> {

        const skin = await loadImage(buffer);
        const inputWidth = skin.width;
        const inputHeight = skin.height;

        const canvas = createCanvas(inputWidth, inputHeight);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(skin, 0, 0, inputWidth, inputHeight);

        const imageData = ctx.getImageData(0, 0, inputWidth, inputHeight);
        const pixels = imageData.data;

        const faceRGBValues = [];

        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];

            faceRGBValues.push({r, g, b, a});
        }

        const outputWidth = inputWidth * mutiplier;
        const outputHeight = inputHeight * mutiplier;
        const faceImageCanvas = createCanvas(outputWidth, outputHeight);
        const faceImageCtx = faceImageCanvas.getContext('2d');

        faceImageCtx.fillStyle = 'rgba(0, 0, 0, 0)'; // 투명 배경 설정
        faceImageCtx.fillRect(0, 0, outputWidth, outputHeight);

        const pixelWidth = outputWidth / inputWidth;
        const pixelHeight = outputHeight / inputHeight;

        let pixelIndex = 0;

        for (let y = 0; y < inputHeight; y++) {
            for (let x = 0; x < inputWidth; x++) {
                const {r, g, b, a} = faceRGBValues[pixelIndex];
                faceImageCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
                faceImageCtx.fillRect(x * pixelWidth, y * pixelHeight, pixelWidth, pixelHeight);
                pixelIndex++;
            }
        }

        // 얼굴 이미지 반환
        return faceImageCanvas.toBuffer();
    }
}


