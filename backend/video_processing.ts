import ffmpeg from 'fluent-ffmpeg';
import cliProgress from "cli-progress";

interface MergeOptions {
    videoFile: string;
    audioFile: string;
    outputFile: string;
}

interface VideoEncodingOptions {
    videoFile: string;
    outputFile: string;
    outputResolution: [number, number];
    outputFPS: number;
}

/**
 * Merges a provided audio file with a provided video file.
 * Re-encodes audio, but not video
 * @param options The options to use
 * @returns Promise of path of outputted video
 */
const mergeAV = (options: MergeOptions): Promise<string> => {
    const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    bar.start(100, 0);

    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(options.videoFile)
            .input(options.audioFile)
            .output(options.outputFile)
            .outputOption('-threads 4')
            .videoCodec('copy')
            .audioCodec('aac')
            .on('progress', (progress) => {
                bar.update(Math.round(progress.percent));
            })
            .on('error', (err) => {
                console.error('Error during AV merging:', err);
                reject(err);
            })
            .on('end', () => {
                console.log('\nSuccessfully merged AV');
                resolve(`${__dirname}/${options.outputFile}`);
            })
            .run();
    });
};

/**
 * Re-encodes a provided video with provided options
 * @param options Options to re-encode video with
 * @returns Promise of path of outputted video
 */
const reEncodeVideo = (options: VideoEncodingOptions): Promise<string> => {
    console.log(`Re-encoding video: ${options.videoFile}`)
    const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    bar.start(100, 0);
    return new Promise((resolve, reject) => {
        ffmpeg()

            .input(options.videoFile)
            .output(options.outputFile)
            .withSize(`${options.outputResolution[0]}x${options.outputResolution[1]}`)
            .fps(options.outputFPS)
            .on('end', () => {
                console.log('\nSuccessfully re-encoded video');
                resolve(options.outputFile);
            })
            .on('progress', (progress) => {
                bar.update(Math.round(progress.percent));
            })
            .run()
    })
}
/**
 * Calculates the width of a video provided a height and optional aspect ratio
 * @param inputHeight The height of the video
 * @param aspectRatio Optional: the video aspect ratio
 * @returns Calculated resolution
 */
const calculateResolution = (inputHeight: number, aspectRatio: [number, number]=[16, 9]): [number, number] => {
    return [inputHeight * aspectRatio[0] / aspectRatio[1], inputHeight];
}

export {mergeAV, reEncodeVideo, calculateResolution};
