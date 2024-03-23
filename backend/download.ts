import ytdl from "ytdl-core";
import fs from "fs";
import {mergeAV} from "./video_processing";


/**
 * Downloads video and audio with provided video ID from YouTube at highest applicable resolution, and merges them with
 *  mergeAV
 * @param videoId
 * @returns Promise of path of outputted video
 */
export async function downloadAndMerge(videoId: string): Promise<string> {
    try {
        const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);

        console.log('Video download started.\nAudio download started.');

        const videoFormat = ytdl.chooseFormat(info.formats, {quality: "highestvideo"});
        const outputVideoPath = `${videoId}_video.mp4`;
        const outputVideoStream = fs.createWriteStream(outputVideoPath);

        const audioFormat = ytdl.chooseFormat(info.formats, {quality: "highestaudio"});
        const outputAudioPath = `${videoId}_audio.mp4`;
        const outputAudioStream = fs.createWriteStream(outputAudioPath);

        await Promise.all([
            new Promise((resolve, reject) => {
                ytdl.downloadFromInfo(info, {format: videoFormat}).pipe(outputVideoStream);
                outputVideoStream.on('finish', (resolve));
                outputVideoStream.on('error', reject);
            }),
            new Promise((resolve, reject) => {
                ytdl.downloadFromInfo(info, {format: audioFormat}).pipe(outputAudioStream);
                outputAudioStream.on('finish', resolve);
                outputAudioStream.on('error', reject);
            })
        ]);

        console.log('Video and audio download complete.');
        console.log('Merging audio and video...');
        return new Promise(async (resolve, reject) => {
            const path = await mergeAV({
                videoFile: outputVideoPath,
                audioFile: outputAudioPath,
                outputFile: `${videoId}.mp4`
            });
            resolve(path);
        })


    } catch (error) {
        console.error('Error during download or merge:', error);
        return new Promise((reject) => {
            reject(String(error));
        })
    }
}