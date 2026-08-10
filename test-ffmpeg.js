const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
const fs = require('fs');

console.log('ffmpeg path:', ffmpegInstaller.path);

// Create a dummy text file to simulate an input (this will fail as it's not a video, but it will show if ffmpeg executes)
// Actually it's better to test if ffmpeg can be executed at all.
ffmpeg.getAvailableCodecs((err, codecs) => {
  if (err) {
    console.error('Error getting codecs:', err.message);
  } else {
    console.log('Codecs available, ffmpeg is working.');
  }
});
