<script lang="ts">
  const api_server = 'http://leoli.local:3000';
  const youtubeUrlRegex = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;

  async function download_video(url: string) {
    alert(url);
    if (youtubeUrlRegex.test(url)) {
      const match = url.match(youtubeUrlRegex);
      if (match && match[1]) {
        const id = match[1];
        try {
          const response = await fetch(`${api_server}/api/youtube-downloader/download?id=${id}`);

          if (response.ok) {
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${id}.mp4`;
            document.body.appendChild(link);
            link.click();
            link.remove();
          } else {
            console.error("Download failed:", response.status);
          }
        } catch (error) {
          console.error("Error communicating with server:", error);
        }
      }
    } else {
      alert('Invalid URL');
    }
  }

</script>

<main>
  <form on:submit|preventDefault={(event) => download_video(event.target.video_id.value)}>
    <input type="text" name="video_id" placeholder="Enter Video ID">
    <button type="submit">Download</button>
  </form>

</main>