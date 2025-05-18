const Discord = require('discord.js-selfbot-v13');
const readline = require('readline');
const gradient = require('gradient-string');
const figlet = require('figlet');
const chalk = require('chalk');
const axios = require('axios');
const FormData = require('form-data');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(res => rl.question(q, res));
const sleep = ms => new Promise(res => setTimeout(res, ms));

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
!@!       !@!       !@!  @!@  !@!!@!@!  !@!       !@!  @!@     !@!  @!@    !@!
!@!       @!!       @!@  !@!  @!@ !!@!  @!!!:!    @!@!!@!      @!@  !@!    @!@
!!!       !!!       !@!  !!!  !@!  !!!  !!!!!:    !!@!@!       !@!  !!!    !@!
:!!       !!:       !!:  !!!  !!:  !!!  !!:       !!: :!!      :!:  !!:    !!:
:!:        :!:      :!:  !:!  :!:  !:!  :!:       :!:  !:!      ::!!:!     :!:
 ::: :::   :: ::::  ::::: ::   ::   ::   :: ::::  ::   :::       ::::      :::
 :: :: :  : :: : :   : :  :   ::    :   : :: ::    :   : :        :         ::
`;

const mostrarTitulo = async () => {
  console.clear();
  console.log(gradient.pastel.multiline(titulo));
  await sleep(1500);  // delay para não bugar ascii
};

async function uploadFileIO(url, filename) {
  try {
    // Baixa arquivo da url
    const response = await axios.get(url, { responseType: 'arraybuffer' });

    const form = new FormData();
    form.append('file', Buffer.from(response.data), filename);

    // Upload para file.io
    const { data } = await axios.post('https://file.io/?expires=14d', form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity
    });

    if (data.success) return data.link;
    else throw new Error('Upload failed: ' + JSON.stringify(data));
  } catch (err) {
    console.error('Erro no upload file.io:', err.message);
    return null;
  }
}

(async () => {
  await mostrarTitulo();

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
    await mostrarTitulo();
    console.log(gradient.instagram(`\n[+] SELF BOT LOGADO COMO ${client.user.tag}`));

    const origem = await client.guilds.fetch(idServerOrigem).catch(() => null);
    const destino = await client.guilds.fetch(idServerDestino).catch(() => null);

    if (!origem || !destino) {
      console.log('\n❌ Servidores inválidos.');
      process.exit();
    }

    const catOrigem = origem.channels.cache.get(idCategoriaOrigem);
    const catDestino = destino.channels.cache.get(idCategoriaDestino);

    if (!catOrigem || !catDestino) {
      console.log('\n❌ Categorias inválidas.');
      process.exit();
    }

    await catDestino.setName(novoNomeCategoriaDestino);

    const canais = origem.channels.cache
      .filter(c => c.parentId === idCategoriaOrigem)
      .sort((a, b) => a.position - b.position);

    for (const [_, canal] of canais) {
      try {
        const novoCanal = await destino.channels.create(canal.name, {
          type: canal.type,
          parent: catDestino.id
        });

        const msgs = await canal.messages.fetch({ limit: 50 });

        for (const msg of msgs.reverse().values()) {
          let content = msg.content || '';

          if (msg.attachments.size > 0) {
            for (const a of msg.attachments.values()) {
              if (a.size <= 9990000) {
                content += `\n${a.url}`;
              } else {
                // Faz upload do arquivo grande no file.io
                const linkFileIO = await uploadFileIO(a.url, a.name);
                if (linkFileIO) content += `\n${linkFileIO}`;
                else content += `\n[IGNORADO: ${a.name} >10MB upload falhou]`;
              }
            }
          }

          try {
            await novoCanal.send(content || '[mensagem vazia]');
            console.log(gradient.morning(`[+1] ${canal.name}: Mensagem clonada`));
          } catch (err) {
            console.log(gradient.passion(`[-] Erro ao enviar: ${err.message}`));
          }

          await sleep(1300);
        }

      } catch (err) {
        console.log(gradient.summer(`[-] Falha ao clonar canal ${canal.name}: ${err.message}`));
      }
    }

    console.log(gradient.fruit('\n✅ CLONAGEM CONCLUÍDA!'));
    process.exit();
  });
})();
