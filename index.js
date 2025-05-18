const Discord = require('discord.js-selfbot-v13');
const readline = require('readline');
const gradient = require('gradient-string');
const figlet = require('figlet');
const chalk = require('chalk');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(res => rl.question(q, res));

const asciiArt = `
$$$$$$$\\  $$\\   $$\\ $$$$$$$$\\ $$$$$$\\ $$\\   $$\\             
$$  __$$\\ $$ | $$  |\\____$$  |\\_$$  _|$$$\\  $$ |            
$$ |  $$ |$$ |$$  /     $$  /   $$ |  $$$$\\ $$ |            
$$ |  $$ |$$$$$  /     $$  /    $$ |  $$ $$\\$$ |            
$$ |  $$ |$$  $$<     $$  /     $$ |  $$ \\$$$$ |            
$$ |  $$ |$$ |\\$$\\   $$  /      $$ |  $$ |\\$$$ |            
$$$$$$$  |$$ | \\$$\\ $$$$$$$$\\ $$$$$$\\ $$ | \\$$ |            
\\_______/ \\__|  \\__|\\________|\\______|\\__|  \\__|            
                                                            
                                                            
                                                            
                        $$$$$$$\\   $$$$$$\\                  
                        $$  __$$\\ $$  __$$\\                 
                        $$ |  $$ |$$ /  $$ |                
                        $$ |  $$ |$$ |  $$ |                
                        $$ |  $$ |$$ |  $$ |                
                        $$ |  $$ |$$ |  $$ |                
                        $$$$$$$  | $$$$$$  |                
                        \\_______/  \\______/                 
                                                            
                                                            
                                                            
                              $$$$$$$\\  $$$$$$\\   $$$$$$\\  
                              \\__$$  __|$$  __$$\\ $$  __$$\\ 
                                 $$ |   $$ /  \\__|$$ /  \\__|
                                 $$ |   $$ |      $$ |      
                                 $$ |   $$ |      $$ |      
                                 $$ |   $$ |  $$\\ $$ |  $$\\ 
                                 $$ |   \\$$$$$$  |\\$$$$$$  |
                                 \\__|    \\______/  \\______/
`;

const mostrarTitulo = () => {
  console.clear();
  console.log(gradient.pastel.multiline(asciiArt));
};

// Detecta idioma do texto com LibreTranslate
async function detectarIdioma(texto) {
  try {
    const res = await axios.post('https://libretranslate.de/detect', { q: texto }, { timeout: 10000 });
    if (res.data && res.data.length > 0) {
      return res.data[0].language; // ex: 'en', 'fr'
    }
    return 'en'; // fallback
  } catch {
    return 'en';
  }
}

// Tradução usando MyMemory API com idioma detectado e limite de 470 chars
async function traduzirParaPortugues(texto) {
  if (!texto || texto.trim() === '') return '';

  const textoCortado = texto.length > 470 ? texto.slice(0, 470) : texto;

  const idiomaOrigem = await detectarIdioma(textoCortado);

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textoCortado)}&langpair=${idiomaOrigem}|pt`;
    console.log(chalk.blue(`[API] Traduzindo (${idiomaOrigem} -> pt)...`));
    const res = await axios.get(url, { timeout: 60000 });
    if (res.data && res.data.responseData && res.data.responseData.translatedText) {
      console.log(chalk.green('[API] Tradução OK.'));
      return res.data.responseData.translatedText;
    } else {
      console.log(chalk.red('[API] Resposta inválida da tradução.'));
      return textoCortado;
    }
  } catch (err) {
    console.log(chalk.red(`[API] Erro na tradução: ${err.message}`));
    return textoCortado;
  }
}

// Upload arquivo grande pro catbox
async function uploadBigFileToCatbox(filePath) {
  try {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', fs.createReadStream(filePath));

    const res = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 120000,
    });

    if (res.status === 200 && res.data.startsWith('https://')) {
      return res.data.trim();
    } else {
      throw new Error('Falha no upload do arquivo');
    }
  } catch (err) {
    throw new Error(`Erro uploadBigFileToCatbox: ${err.message}`);
  }
}

// Baixa e sobe pro catbox
async function downloadAndUploadFile(attachment) {
  const tmpPath = `./temp_${attachment.id}_${attachment.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  try {
    const writer = fs.createWriteStream(tmpPath);
    const response = await axios({
      url: attachment.url,
      method: 'GET',
      responseType: 'stream',
      timeout: 60000,
    });

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    const link = await uploadBigFileToCatbox(tmpPath);
    fs.unlinkSync(tmpPath);
    return link;
  } catch (error) {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    throw new Error(`Falha download/upload: ${error.message}`);
  }
}

(async () => {
  mostrarTitulo();

  const token = await ask('\n[?] COLE SEU TOKEN: ');
  const idServerOrigem = await ask('[?] ID DO SERVIDOR DE ORIGEM: ');
  const idCategoriaOrigem = await ask('[?] ID DA CATEGORIA DE ORIGEM: ');
  const idServerDestino = await ask('[?] ID DO SERVIDOR DESTINO: ');
  const idCategoriaDestino = await ask('[?] ID DA CATEGORIA DESTINO: ');
  const novoNomeCategoriaDestino = await ask('[?] NOVO NOME DA CATEGORIA DESTINO: ');

  const client = new Discord.Client();

  client.login(token).catch(() => {
    console.log(gradient.cristal('\n❌ TOKEN INVÁLIDO. ENCERRANDO.'));
    process.exit();
  });

  client.on('ready', async () => {
    mostrarTitulo();
    console.log(gradient.instagram(`\n[+] SELF BOT LOGADO COMO ${client.user.tag}`));

    const origem = await client.guilds.fetch(idServerOrigem).catch(() => null);
    const destino = await client.guilds.fetch(idServerDestino).catch(() => null);

    if (!origem || !destino) {
      console.log(chalk.red('\n❌ Servidores inválidos.'));
      process.exit();
    }

    const catOrigem = origem.channels.cache.get(idCategoriaOrigem);
    const catDestino = destino.channels.cache.get(idCategoriaDestino);

    if (!catOrigem || !catDestino) {
      console.log(chalk.red('\n❌ Categorias inválidas.'));
      process.exit();
    }

    try {
      await catDestino.setName(novoNomeCategoriaDestino);
    } catch {
      console.log(chalk.red('\n❌ Falha ao renomear categoria destino.'));
    }

    const canais = origem.channels.cache
      .filter(c => c.parentId === idCategoriaOrigem)
      .sort((a, b) => a.position - b.position);

    for (const [_, canal] of canais) {
      try {
        const novoCanal = await destino.channels.create(canal.name, {
          type: canal.type,
          parent: catDestino.id,
        });
        console.log(gradient.vice(`[>] Clonando canal: ${canal.name}`));

        const msgs = await canal.messages.fetch({ limit: 50 });

        for (const msg of msgs.reverse().values()) {
          let content = msg.content || '';

          // Substitui tags tipo #123456789012345678 pelo novo ID do canal
          content = content.replace(/#(\d{17,19})/g, `#${novoCanal.id}`);

          // Traduz o conteúdo limitado a 470 caracteres
          const traducao = await traduzirParaPortugues(content);

          // Se mensagem tem anexos
          if (msg.attachments.size > 0) {
            for (const a of msg.attachments.values()) {
              if (a.size <= 9990000) {
                // Link direto pequeno
                content += `\n[${a.name}](${a.url})`;
              } else {
                // Arquivo grande, upload no catbox
                try {
                  const linkUpload = await downloadAndUploadFile(a);
                  content += `\n[${a.name}](${linkUpload})`;
     }
