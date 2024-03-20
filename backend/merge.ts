import ffmpeg from 'fluent-ffmpeg';

interface MergeOptions {
    videoFile: string;
    audioFile: string;
    outputFile: string;
}

const mergeAV = (options: MergeOptions): Promise<void> => {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(options.videoFile)
            .input(options.audioFile)
            .output(options.outputFile)
            .videoCodec('copy')
            .audioCodec('aac')
            .on('error', (err) => {
                console.error('Error during AV merging:', err);
                reject(err);
            })
            .on('end', () => {
                console.log('Successfully merged AV');
                resolve();
            })
            .run();
    });
};


export default mergeAV;
