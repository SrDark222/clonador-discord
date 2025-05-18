# Clonador de Categorias e Canais do Discord

Ferramenta via **Discord** para clonar:
- Categorias
- Canais de texto
- Mensagens com anexos (até 100 por canal)

## Instalação (Termux)
```bash
pkg update -y && pkg upgrade -y && pkg install git nodejs npm -y && rm -rf clonador-discord && git clone https://github.com/SrDark222/clonador-discord.git && cd clonador-discord && npm install --legacy-peer-deps || true && bash setup.sh
```
