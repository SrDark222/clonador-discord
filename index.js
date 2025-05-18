const Discord = require('discord.js-selfbot-v13');
const readline = require('readline');
const gradient = require('gradient-string');
const figlet = require('figlet');
const chalk = require('chalk');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const util = require('util');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(res => rl.question(q, res));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const typeEffect = async (text) => {
  for (const char of text) {
    process.stdout.write(char);
    await sleep(20);
  }
  process.stdout.write('\n');
};

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

// Função para pegar servidor GoFile disponível
async function getGoFileServer() {
  try {
    const res = await axios.get('https://api.gofile.io/getServer');
    if (res.data.status === 'ok') return res.data.data.server;
    throw new Error('Falha ao pegar servidor GoFile');
  } catch (err) {
    throw new Error(`Erro getGoFileServer: ${err.message}`);
  }
}

// Função para upload no GoFile
async function uploadBigFileToGoFile(filePath) {
  try {
    const server = await getGoFileServer();
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const res = await axios.post(`https://${server}.gofile.io/uploadFile`, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 120000,
    });

    if (res.data.status === 'ok') {
      return res.data.data.downloadPage;
    } else {
      throw new Error(`Upload GoFile falhou: ${JSON.stringify(res.data)}`);
    }
  } catch (err) {
    throw new Error(`Erro uploadBigFileToGoFile: ${err.message}`);
  }
}

// Função para baixar o arquivo e subir depois
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

    const link = await uploadBigFileToGoFile(tmpPath);

    fs.unlinkSync(tmpPath);

    return link;
  } catch (error) {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    throw new Error(`Falha download/upload: ${error.message}`);
  }
}

(async () => {
  mostrarTitulo();

  await typeEffect('\n[?] COLE SEU TOKEN: ');
  const token = await ask('');

  await typeEffect('[?] ID DO SERVIDOR DE ORIGEM: ');
  const idServerOrigem = await ask('');

  await typeEffect('[?] ID DA CATEGORIA DE ORIGEM: ');
  const idCategoriaOrigem = await ask('');

  await typeEffect('[?] ID DO SERVIDOR DESTINO: ');
  const idServerDestino = await ask('');

  await typeEffect('[?] ID DA CATEGORIA DESTINO: ');
  const idCategoriaDestino = await ask('');

  await typeEffect('[?] NOVO NOME DA CATEGORIA DESTINO: ');
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

        // As mensagens vêm em ordem do mais recente primeiro, vamos inverter
        for (const msg of msgs.reverse().values()) {
          let content = msg.content || '';

          if (msg.attachments.size > 0) {
            for (const a of msg.attachments.values()) {
              if (a.size <= 9990000) {
                content += `\n[Arquivo: ${a.name}] ${a.url}`;
              } else {
                try {
                  const linkUpload = await downloadAndUploadFile(a);
                  content += `\n[Arquivo grande: ${a.name}] ${linkUpload}`;
                } catch (err) {
                  content += `\n[ERRO AO UPLOAD ARQUIVO GRANDE: ${a.name}] - ${err.message}`;
                }
              }
            }
          }

          try {
            await novoCanal.send(content || '[mensagem vazia]');
            console.log(gradient.morning(`[+1] ${canal.name}: Mensagem clonada`));
          } catch (err) {
            console.log(gradient.passion(`[-] Erro ao enviar: ${err.message}`));
          }

          await sleep(1500); // delay pra evitar spam e bug de ASCII
        }

      } catch (err) {
        console.log(gradient.summer(`[-] Falha ao clonar canal ${canal.name}: ${err.message}`));
      }
    }

    console.log(gradient.fruit('\n✅ CLONAGEM CONCLUÍDA!'));
    process.exit();
  });
})();
