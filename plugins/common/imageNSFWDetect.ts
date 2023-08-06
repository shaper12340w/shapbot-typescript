import axios from 'axios';
import * as tf from '@tensorflow/tfjs-node';
import * as nsfw from 'nsfwjs';
import * as jpeg from 'jpeg-js';
import sharp from 'sharp';

export class ImageNSFWCheck {
    private static async getImageBufferFromURL(url:string) {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(response.data);
            return buffer;
        } catch (error) {
            console.error('Error while fetching image:', error);
            return null;
        }
    }

    private static async changeImageToJPG(img:Buffer){
        try{
            const image = await sharp(img).jpeg().toBuffer();
            return image;
        }catch(e:unknown){
            console.error(e)
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
            const imageBuffer:Buffer = await this.getImageBufferFromURL(url) as Buffer;
            const jpgBuffer:Buffer = await this.changeImageToJPG(imageBuffer) as Buffer
            const mainData:tf.Tensor3D = await this.convert(jpgBuffer);
            const loadData:nsfw.NSFWJS = await nsfw.load('file://./db/data/model.json',{size: 299});
            const predictions = await loadData.classify(mainData);
            mainData.dispose();
            return predictions;

        }catch(e:unknown){
            console.error(e)
        }
    }
}