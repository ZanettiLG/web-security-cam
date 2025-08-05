const { spawn } = require('child_process');
require('dotenv').config();
const { search, connect } = require('./src/onvif');

// Configurações da câmera
const camera = {
  ip: '192.168.3.31',
  user: 'admin',
  pass: 'Cazape1248',
  port: '554',
}

async function testUrl(url) {
  return new Promise((resolve) => {
    console.log(`\nTestando URL: ${url}`);
    
    const ffmpeg = spawn('ffmpeg', [
      '-nostdin',
      '-rtsp_transport', 'tcp',
      '-i', url,
      '-t', '5', // Testa por 5 segundos
      '-f', 'null',
      '-'
    ]);

    let hasOutput = false;

    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Stream mapping') || output.includes('frame=')) {
        hasOutput = true;
        console.log('✅ Conexão estabelecida! Stream detectado.');
      }
    });

    ffmpeg.on('close', (code) => {
      if (hasOutput) {
        console.log('✅ URL funcionando!');
        resolve({ url, success: true });
      } else {
        console.log('❌ Falha na conexão');
        resolve({ url, success: false });
      }
    });

    ffmpeg.on('error', (err) => {
      console.log('❌ Erro:', err.message);
      resolve({ url, success: false });
    });
  });
}

const main = async () => {
  const onvif = await connect("http://192.168.3.31:5000/onvif/device_service", {user: camera.user, pass: camera.pass});
  console.log(onvif);
  const workingUrl = await testUrl(onvif);

  if (workingUrl) {
    console.log('\n✅ Teste concluído com sucesso!');
  } else {
    console.log('\n❌ Teste falhou. Verifique as configurações.');
  }
  process.exit(0);
}

main();