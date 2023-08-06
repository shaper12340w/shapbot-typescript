import { Logger } from "../common/logger";
import axios from 'axios';
import * as tf from '@tensorflow/tfjs-node';
import * as nsfw from 'nsfwjs';
import * as jpeg from 'jpeg-js';
import sharp from 'sharp';

export class ImageNSFWCheck {
    private static loadData?:nsfw.NSFWJS
    private static async loadModel(){
        const result = await nsfw.load('file://./db/data/nsfwjs/model.json',{size: 299});
        ImageNSFWCheck.loadData = result;
    }
    private static async getImageBufferFromURL(url:string) {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);
            return buffer;
        } catch (error) {
            Logger.error(error);
            return null;
        }
    }

    private static async changeImageToJPG(img:Buffer){
        try{
            const image = await sharp(img).jpeg().toBuffer();
            return image;
        }catch(e:unknown){
            Logger.error(e)
        }
    }
    private static async convert(img:Buffer){
        const image = await jpeg.decode(img, { useTArray: true })

        const numChannels = 3
        const numPixels = image.width * image.height
        const values = new Int32Array(numPixels * numChannels)

        for (let i = 0; i < numPixels; i++)
            for (let c = 0; c < numChannels; ++c)
                values[i * numChannels + c] = image.data[i * 4 + c]

        return tf.tensor3d(values, [image.height, image.width, numChannels], 'int32')
    }

    public static async checkNSFW(url:string){
        try{
            if(!this.loadData) await this.loadModel();
            const imageBuffer:Buffer = await this.getImageBufferFromURL(url) as Buffer;
            const jpgBuffer:Buffer = await this.changeImageToJPG(imageBuffer) as Buffer
            const mainData:tf.Tensor3D = await this.convert(jpgBuffer);
            const predictions = await this.loadData!!.classify(mainData);
            mainData.dispose();

            return predictions;

        }catch(e:unknown){
            Logger.error(e)
        }
    }
}