const rtsp = require('rtsp-relay');
const RtspServer = require('node-rtsp-stream');
const {uuid} = require('../utils');
const { connect } = require("../onvif/connect");
const records = require("./records");

async function provideStream (app, ip, {user="admin", pass="admin", port="554"})
{
  const { proxy, scriptUrl } = rtsp(app);

  const url = await connect (ip, {user, pass});
  console.log("ONVIF", url);

  const filePath = "../records/" + uuid() + ".mp4";
  const videoUrl = `rtsp://${user}:${pass}@${ip}:${port}/onvif1`;
  
  /* // Configurações do servidor RTSP
  const rtspServer = new RtspServer({
    name: 'stream',
    cameras: {
      cam1: {
        url: url, // URL do stream RTSP
        ffmpeg: '/usr/bin/ffmpeg', // Caminho para o binário ffmpeg
        resolution: '640x480', // Resolução do vídeo
        quality: 3, // Qualidade do vídeo (0 a 31)
        // Outras opções ffmpeg podem ser especificadas aqui
      },
    },
  }); */

  /* rtspServer.start(); */

  records.start(url, filePath);

  const handler = proxy({
    url: videoUrl,//onvif1
    // if your RTSP stream need credentials, include them in the URL as above
    verbose: true,
  });

  app.ws('/api/stream', handler);

  app.use("/", async (req, res) =>
    res.send(`
        <canvas id='canvas' style="
          width: 	960px;
          height: 540px;
        " ></canvas>
    
        <script src='${scriptUrl}'></script>
        <script>
        loadPlayer({
            url: 'ws://' + location.host + '/api/stream',
            canvas: document.getElementById('canvas')
        });
        </script>
    `),
  );

  return;
}

module.exports = {provideStream}