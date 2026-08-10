const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
const fs = require('fs');

// We will just use the ffmpeg command on a non-existent file to see if it's an option parsing error.
const inputPath = 'dummy_real.mp4';
const outputPath = 'dummy_compressed.mp4';

// File already exists

console.log('Testing ffmpeg command...');
ffmpeg(inputPath)
  .outputOptions([
    '-c:v libx264',
    '-crf 28',
    '-preset fast',
    '-vf scale=-2:min(720\\,ih)'
  ])
  .on('start', (commandLine) => {
    console.log('Spawned Ffmpeg with command: ' + commandLine);
  })
  .on('end', () => {
    console.log('Compression successful');
  })
  .on('error', (err, stdout, stderr) => {
    console.error('Error:', err.message);
    console.error('FFmpeg stderr:', stderr);
  })
  .save(outputPath);
