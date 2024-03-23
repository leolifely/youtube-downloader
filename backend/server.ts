import express from 'express';
import cors from 'cors';
import fs from 'fs';
import {cacheVideo, checkForCachedData} from "./caching";
import {downloadAndMerge} from "./download";
import {calculateResolution, reEncodeVideo} from "./video_processing";

const app = express();
const port = 3000;
app.use(cors());

app.get('/api/youtube-downloader/download', async (req, res) => {
  console.log('GET /api/youtube-downloader/download, id', req.query.id);
  const videoId = req.query.id;
  const resolution = Number(req.query.resolution);
  const fps = Number(req.query.fps);
  if (videoId === undefined) {
    res.sendStatus(404);
  } else {
    // @ts-ignore
    if (await checkForCachedData(videoId, '/media/leoli/cache_drive')) {
      console.log(`Using cached video /media/leoli/cache_drive/${videoId}.mp4`);
      res.sendFile(`/media/leoli/cache_drive/${videoId}.mp4`);
    } else {
      // @ts-ignore
      downloadAndMerge(videoId).then(async (result) => {
        console.log(result)
        if (resolution !== undefined) {
          const fullResolution = calculateResolution(resolution);

          res.sendFile(await reEncodeVideo({
            videoFile: result,
            outputFile: `${videoId}_${resolution}p.mp4`,
            outputResolution: fullResolution,
            outputFPS: fps
          }), {root: __dirname});

        } else {
          res.sendFile(`${videoId}.mp4`, {root: __dirname});
        }
        // @ts-ignore
        cacheVideo(videoId, '/media/leoli/cache_drive').then((result) => {
          if (result) {
            console.log(`Cached video ${videoId} at /media/leoli/cache_drive/${videoId}.mp4`);
            /*fs.unlink(`${__dirname}/${videoId}.mp4`, (err) => {
              if (err) {
                console.error(err);
              } else {
                console.log(`Removed video ${__dirname}/${videoId}.mp4`);
              }
            })*/
          }
        });
      });
    }
  }
})


app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});