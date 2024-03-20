import fs from 'fs';
const fsPromises = fs.promises;
import path from 'path'

export async function checkForCachedData(videoId: string, cacheDrive: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        if (fs.existsSync(`${cacheDrive}/${videoId}.mp4`)) {
            resolve(true);
        } else {
            resolve(false);
        }
    });
}

export async function cacheVideo(videoId: string, cacheDrive: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        fs.copyFile(`./${videoId}.mp4`, `${cacheDrive}/${videoId}.mp4`, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    });
}

export async function cleanVideoCache(cacheDrive: string, maxUsedSpace: number): Promise<number> {
    return new Promise<number>(async (resolve, reject) => {
        try {
            await fsPromises.access(cacheDrive);
        } catch (error) {
            reject(error);
        }

        await manageDirectorySize(cacheDrive, maxUsedSpace);

        let totalSize = 0;
        let filesInCache = 0;

        async function getFilesInDirectory(dir: string): Promise<void> {
            const dirents = await fsPromises.readdir(dir, { withFileTypes: true });
            for (const dirent of dirents) {
                const filePath = path.join(dir, dirent.name);
                if (dirent.isDirectory()) {
                    await getFilesInDirectory(filePath);
                } else {
                    const stats = await fsPromises.stat(filePath);
                    totalSize += stats.size;
                    filesInCache++;
                }
            }
        }

        await getFilesInDirectory(cacheDrive);

        const spaceFreed = maxUsedSpace - totalSize;
        resolve(spaceFreed);
    })
}

async function manageDirectorySize(directoryPath: string, maxSize: number): Promise<void> {
    let totalSize = 0;
    let files: { path: string; mtimeMs: number; size: number; }[] = [];

    async function getFiles(dir: string): Promise<void> {
        const dirents = await fsPromises.readdir(dir, { withFileTypes: true });
        for (const dirent of dirents) {
            const filePath = path.join(dir, dirent.name);
            if (dirent.isDirectory()) {
                await getFiles(filePath);
            } else {
                const stats = await fsPromises.stat(filePath);
                totalSize += stats.size;
                files.push({path: filePath, mtimeMs: stats.mtimeMs, size: stats.size});
            }
        }
    }

    await getFiles(directoryPath);

    if (totalSize > maxSize) {
        files.sort((a, b) => a.mtimeMs - b.mtimeMs);

        while (totalSize > maxSize) {
            const fileToDelete = files.shift();
            if (fileToDelete) {
                await fsPromises.unlink(fileToDelete.path);
                totalSize -= fileToDelete.size;
                console.log(`Deleted ${fileToDelete.path}`);
            }
        }
    }
}
