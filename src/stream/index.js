const rtsp = require('rtsp-relay');
const { connect } = require("../onvif/connect");

async function provideStream (app, ip, {user="admin", pass="admin", port="554"})
{
  const { proxy, scriptUrl } = rtsp(app);

  const url = await connect (ip, {user, pass});
  console.log("ONVIF", url);

  const handler = proxy({
    url: `rtsp://${user}:${pass}@${ip}:${port}/onvif1`,//onvif1
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