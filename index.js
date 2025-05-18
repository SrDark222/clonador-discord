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
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const titulo = `
 @@@@@@@  @@@        @@@@@@   @@@  @@@  @@@@@@@@  @@@@@@@      @@@  @@@    @@@
@@@@@@@@  @@@       @@@@@@@@  @@@@ @@@  @@@@@@@@  @@@@@@@@     @@@  @@@   @@@@
!@@       @@!       @@!  @@@  @@!@!@@@  @@!       @@!  @@@     @@!  @@@  @@@!!
!@!       !@!       !@!  @!@  !@!!@!@!  !@!       !@!  !@!     !@!  @!@    !@!
!@!       @!!       @!@  !@!  @!@ !!@!  @!!!:!    @!@!!@!      @!@  !@!    @!@
!!!       !!!       !@!  !!!  !@!  !!!  !!!!!:    !!@!@!       !@!  !!!    !@!
:!!       !!:       !!:  !!!  !!:  !!!  !!:       !!: :!!      :!:  !!:    !!:
:!:        :!:      :!:  !:!  :!:  !:!  :!:       :!:  !:!      ::!!:!     :!:
 ::: :::   :: ::::  ::::: ::   ::   ::   :: ::::  ::   :::       ::::      :::
 :: :: :  : :: : :   : :  :   ::    :   : :: ::    :   : :        :         ::
`;

const mostrarTitulo = () => {
  console.clear();
  console.log(gradient.pastel.multiline(titulo));
};

// API tradução via LibreTranslate
async function traduzirParaPortugues(texto) {
  if (!texto || texto.trim() === '') return '';

  try {
    const res = await axios.post('https://libretranslate.de/translate', {
      q: texto,
      source: 'auto',
      target: 'pt',
      format: 'text'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    return res.data.translatedText;
  } catch (err) {
    // Se der erro na tradução, retorna o texto original para não travar
    return texto;
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

// Baixa o arquivo e sobe pro catbox
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

  console.log('\n[?] COLE SEU TOKEN: ');
  const token = await ask('');

  console.log('[?] ID DO SERVIDOR DE ORIGEM: ');
  const idServerOrigem = await ask('');

  console.log('[?] ID DA CATEGORIA DE ORIGEM: ');
  const idCategoriaOrigem = await ask('');

  console.log('[?] ID DO SERVIDOR DESTINO: ');
  const idServerDestino = await ask('');

  console.log('[?] ID DA CATEGORIA DESTINO: ');
  const idCategoriaDestino = await ask('');

  console.log('[?] NOVO NOME DA CATEGORIA DESTINO: ');
  const novoNomeCategoriaDestino = await ask('');

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

        // Mensagens do mais velho para o mais novo
        for (const msg of msgs.reverse().values()) {
          let content = msg.content || '';

          if (msg.attachments.size > 0) {
            for (const a of msg.attachments.values()) {
              if (a.size <= 9990000) {
                content += `\n[${a.name}](${a.url})`;
              } else {
                try {
                  const linkUpload = await downloadAndUploadFile(a);
                  content += `\n[${a.name}](${linkUpload})`;
                } catch (err) {
                  content += `\nERRO AO UPLOAD ARQUIVO GRANDE: ${err.message}`;
                }
              }
            }
          }

          // Traduz o conteúdo antes de enviar
          const conteudoTraduzido = await traduzirParaPortugues(content);

          try {
            await novoCanal.send(conteudoTraduzido || '[mensagem vazia]');
            console.log(gradient.morning(`[+1] ${canal.name}: Mensagem clonada e traduzida`));
          } catch (err) {
            console.log(gradient.passion(`[-] Erro ao enviar: ${err.message}`));
          }

          await sleep(1500);
        }

      } catch (err) {
        console.log(gradient.summer(`[-] Falha ao clonar canal ${canal.name}: ${err.message}`));
      }
    }

    console.log(gradient.fruit('\n✅ CLONAGEM E TRADUÇÃO CONCLUÍDAS!'));
    process.exit();
  });
})();
