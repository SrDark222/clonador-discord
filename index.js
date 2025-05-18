const Discord = require('discord.js-selfbot-v13');
const readline = require('readline');
const gradient = require('gradient-string');
const figlet = require('figlet');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(res => rl.question(gradient.pastel(q), res));

// Título hacker estilo Kali Linux fixo
const titulo = `
@@@@@@@  @@@        @@@@@@   @@@  @@@  @@@@@@@@  @@@@@@@      @@@  @@@    @@@
@@@@@@@@  @@@       @@@@@@@@  @@@@ @@@  @@@@@@@@  @@@@@@@@     @@@  @@@   @@@@
!@@       @@!       @@!  @@@  @@!@!@@@  @@!       @@!  @@@     @@!  @@@  @@@!!
!@!       !@!       !@!  !@!  !@!!@!@!  !@!       !@!  @!@     !@!  @!@    !@!
!@!       @!!       @!@  !@!  @!@ !!@!  @!!!:!    @!@!!@!      @!@  !@!    @!@
!!!       !!!       !@!  !!!  !@!  !!!  !!!!!:    !!@!@!       !@!  !!!    !@!
:!!       !!:       !!:  !!!  !!:  !!!  !!:       !!: :!!      :!:  !!:    !!:
:!:        :!:      :!:  !:!  :!:  !:!  :!:       :!:  !:!      ::!!:!     :!:
 ::: :::   :: ::::  ::::: ::   ::   ::   :: ::::  ::   :::       ::::      :::
 :: :: :  : :: : :   : :  :   ::    :   : :: ::    :   : :        :         ::
`;

// Função para mostrar o título sempre
function mostrarTitulo() {
  console.clear();
  console.log(gradient.neon(titulo));
  console.log(gradient.vice('\n[HACKER-KALI-SELFBOT]\n'));
}

// Função de confirmação pra não fechar sem permissão
async function confirmarSaida() {
  const resp = await ask('\nDeseja realmente sair? (s/n): ');
  if (resp.toLowerCase() === 's') {
    console.log(gradient.cristal('\nSaindo... Até a próxima, chefe!\n'));
    process.exit(0);
  } else {
    return false;
  }
}

// Menu principal interativo
async function menuPrincipal(client) {
  while (true) {
    mostrarTitulo();
    console.log(gradient.morning('[1] Clonar categoria e mensagens'));
    console.log(gradient.morning('[2] Trocar nome da categoria destino'));
    console.log(gradient.morning('[3] Sair do script'));
    const opcao = await ask('\nEscolha uma opção: ');

    if (opcao === '1') {
      await executarClone(client);
    } else if (opcao === '2') {
      await trocarNomeCategoria(client);
    } else if (opcao === '3') {
      const sair = await confirmarSaida();
      if (sair === false) continue;
    } else {
      console.log(gradient.passion('\nOpção inválida. Tente novamente.\n'));
      await new Promise(r => setTimeout(r, 1500));
    }
  }
}

// Função para realizar clonagem (igual seu código original)
async function executarClone(client) {
  const idServerOrigem = await ask('[?] ID DO SERVIDOR DE ORIGEM: ');
  const idCategoriaOrigem = await ask('[?] ID DA CATEGORIA DE ORIGEM: ');
  const idServerDestino = await ask('[?] ID DO SERVIDOR DESTINO: ');
  const idCategoriaDestino = await ask('[?] ID DA CATEGORIA DESTINO: ');

  const origem = await client.guilds.fetch(idServerOrigem).catch(() => null);
  const destino = await client.guilds.fetch(idServerDestino).catch(() => null);

  if (!origem || !destino) {
    console.log(gradient.cristal('\n❌ Servidores inválidos.'));
    await pause();
    return;
  }

  const catOrigem = origem.channels.cache.get(idCategoriaOrigem);
  const catDestino = destino.channels.cache.get(idCategoriaDestino);

  if (!catOrigem || !catDestino) {
    console.log(gradient.cristal('\n❌ Categorias inválidas.'));
    await pause();
    return;
  }

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
          console.log(gradient.passion(`[-] Erro ao enviar: ${err.message}`));
        }

        await new Promise(r => setTimeout(r, 1300));
      }

    } catch (err) {
      console.log(gradient.summer(`[-] Falha ao clonar canal ${canal.name}: ${err.message}`));
    }
  }

  console.log(gradient.fruit('\n✅ CLONAGEM CONCLUÍDA!'));
  await pause();
}

// Função para trocar nome da categoria destino (separado pra menu)
async function trocarNomeCategoria(client) {
  const idServerDestino = await ask('[?] ID DO SERVIDOR DESTINO: ');
  const idCategoriaDestino = await ask('[?] ID DA CATEGORIA DESTINO: ');
  const novoNomeCategoriaDestino = await ask('[?] NOVO NOME DA CATEGORIA DESTINO: ');

  const destino = await client.guilds.fetch(idServerDestino).catch(() => null);
  if (!destino) {
    console.log(gradient.cristal('\n❌ Servidor destino inválido.'));
    await pause();
    return;
  }

  const catDestino = destino.channels.cache.get(idCategoriaDestino);
  if (!catDestino) {
    console.log(gradient.cristal('\n❌ Categoria destino inválida.'));
    await pause();
    return;
  }

  await catDestino.setName(novoNomeCategoriaDestino);
  console.log(gradient.fruit(`\n✅ Nome da categoria alterado para: ${novoNomeCategoriaDestino}`));
  await pause();
}

// Função para pausar e esperar o usuário pressionar ENTER
async function pause() {
  await ask('\nPressione ENTER para voltar ao menu...');
}

(async () => {
  mostrarTitulo();
  const token = await ask('\n[?] COLE SEU TOKEN: ');

  const client = new Discord.Client();
  try {
    await client.login(token);
  } catch {
    console.log(gradient.cristal('\n❌ TOKEN INVÁLIDO. ENCERRANDO.'));
    process.exit(1);
  }

  client.on('ready', async () => {
    console.log(gradient.instagram(`\n[+] SELF BOT LOGADO COMO ${client.user.tag}\n`));
    await menuPrincipal(client);
  });
})();
