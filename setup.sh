#!/data/data/com.termux/files/usr/bin/bash

echo -e "\n[+] Atualizando pacotes..."
pkg update -y && pkg upgrade -y

echo -e "\n[+] Instalando git e nodejs..."
pkg install git nodejs -y

echo -e "\n[+] Clonando o projeto do GitHub..."
git clone https://github.com/SrDark222/clonador-discord.git

cd clonador-discord

echo -e "\n[+] Instalando dependências..."
npm install

echo -e "\n[+] Iniciando o script..."
npm start
