const { spawn } = require('child_process');
require('dotenv').config();

// Configurações da câmera
const IP = process.env.IP || '192.168.1.100';
const USER = process.env.USER || 'admin';
const PASS = process.env.PASS || 'admin';
const PORT = '554';

// URLs RTSP para testar com câmeras Intelbras
const urls = [
  `rtsp://${USER}:${PASS}@${IP}:${PORT}/onvif1`,
  `rtsp://${USER}:${PASS}@${IP}:${PORT}/live`,
  `rtsp://${USER}:${PASS}@${IP}:${PORT}/live/ch0`,
  `rtsp://${USER}:${PASS}@${IP}:${PORT}/live/ch00_0`,
];

console.log('Testando conectividade com câmera Intelbras IM7 FullColor...');
console.log('IP:', IP);
console.log('Usuário:', USER);
console.log('Porta:', PORT);

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

async function testAllUrls() {
  console.log('\n=== TESTE DE CONECTIVIDADE ===\n');
  
  for (const url of urls) {
    const result = await testUrl(url);
    if (result.success) {
      console.log(`\n🎉 URL FUNCIONANDO: ${result.url}`);
      console.log('Use esta URL no seu arquivo de configuração!');
      return result.url;
    }
  }
  
  console.log('\n❌ Nenhuma URL funcionou. Verifique:');
  console.log('1. Se o IP da câmera está correto');
  console.log('2. Se as credenciais estão corretas');
  console.log('3. Se a câmera está na mesma rede');
  console.log('4. Se o ffmpeg está instalado');
  
  return null;
}

// Executa o teste
testAllUrls().then((workingUrl) => {
  if (workingUrl) {
    console.log('\n✅ Teste concluído com sucesso!');
  } else {
    console.log('\n❌ Teste falhou. Verifique as configurações.');
  }
  process.exit(0);
}); 