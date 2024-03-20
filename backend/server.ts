import ytdl from 'ytdl-core';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import mergeAV from './merge';
import {cacheVideo, checkForCachedData} from "./caching";
const app = express();
const port = 3000;
app.use(cors());

app.get('/api/youtube-downloader/download', async (req, res) => {
  console.log('GET /api/youtube-downloader/download, id', req.query.id);
  const videoId = req.query.id;
  if (videoId === undefined) {
    res.sendStatus(404);
  } else {
    // @ts-ignore
    if (await checkForCachedData(videoId, '/media/leoli/cache_drive')) {
      res.sendFile(`/media/leoli/cache_drive/${videoId}.mp4`);
    } else {
      // @ts-ignore
      downloadAndMerge(videoId).then((result) => {
        res.sendFile(`${videoId}.mp4`, {root: __dirname});
        // @ts-ignore
        cacheVideo(videoId, '/media/leoli/cache_drive').then((result) => {
          if (result) {
            console.log(`Cached video ${videoId}`);
            fs.unlink(`${__dirname}/${videoId}.mp4`, (err) => {
              if (err) {
                console.error(err);
              } else {
                console.log(`Removed video ${__dirname}/${videoId}`);
              }
            })
          }
        });
      });
    }
  }
})


async function downloadAndMerge(videoId: string) {
  try {
    const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);

    console.log('Video download started.\nAudio download started.');

    const videoFormat = ytdl.chooseFormat(info.formats, { quality: "highestvideo" });
    const outputVideoPath = `${videoId}_video.mp4`;
    const outputVideoStream = fs.createWriteStream(outputVideoPath);

    const audioFormat = ytdl.chooseFormat(info.formats, { quality: "highestaudio" });
    const outputAudioPath = `${videoId}_audio.mp4`;
    const outputAudioStream = fs.createWriteStream(outputAudioPath);

    await Promise.all([
      new Promise((resolve, reject) => {
        ytdl.downloadFromInfo(info, { format: videoFormat }).pipe(outputVideoStream);
        outputVideoStream.on('finish', (resolve));
        outputVideoStream.on('error', reject);
      }),
      new Promise((resolve, reject) => {
        ytdl.downloadFromInfo(info, { format: audioFormat }).pipe(outputAudioStream);
        outputAudioStream.on('finish', resolve);
        outputAudioStream.on('error', reject);
      })
    ]);

    console.log('Video and audio download complete.');
    console.log('Merging audio and video...');

    await mergeAV({ videoFile: outputVideoPath, audioFile: outputAudioPath, outputFile: `${videoId}.mp4` });
    

  } catch (error) {
    console.error('Error during download or merge:', error);
  }
}

app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});