const Discord = require('discord.js-selfbot-v13');
const readline = require('readline');
const gradient = require('gradient-string');
const figlet = require('figlet');
const chalk = require('chalk');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(q, res));
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
!@!       !@!       !@!  @!@  !@!!@!@!  !@!       !@!  @!@     !@!  @!@    !@!
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

  client.on('ready', async () => {
    mostrarTitulo();
    console.log(gradient.instagram(`\n[+] SELF BOT LOGADO COMO ${client.user.tag}`));

    const origem = client.guilds.cache.get(idServerOrigem);
    const destino = client.guilds.cache.get(idServerDestino);

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

    await catDestino.setName(novoNomeCategoriaDestino);

    const canais = origem.channels.cache
      .filter(c => c.parentId === idCategoriaOrigem && (c.type === 0 || c.type === 5)) // text or announcement
      .sort((a, b) => a.rawPosition - b.rawPosition);

    for (const canal of canais.values()) {
      try {
        const novoCanal = await destino.channels.create(canal.name, {
          type: canal.type,
          parent: catDestino.id
        });

        const msgs = await canal.messages.fetch({ limit: 50 }).catch(() => null);
        if (!msgs) continue;

        const mensagens = Array.from(msgs.values()).reverse();
        for (const msg of mensagens) {
          let content = msg.content || '';

          if (msg.attachments.size > 0) {
            for (const a of msg.attachments.values()) {
              if (a.size <= 9990000) {
                content += `\n[Arquivo: ${a.name}] ${a.url}`;
              } else {
                content += `\n[IGNORADO: ${a.name} acima de 10MB]`;
              }
            }
          }

          try {
            await novoCanal.send(content || '[mensagem vazia]');
            console.log(gradient.morning(`[+1] ${canal.name}: Mensagem clonada`));
          } catch (err) {
            console.log(gradient.passion(`[-] Erro ao enviar mensagem: ${err.message}`));
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

  client.login(token).catch(() => {
    console.log(gradient.cristal('\n❌ TOKEN INVÁLIDO. ENCERRANDO.'));
    process.exit();
  });
})();
