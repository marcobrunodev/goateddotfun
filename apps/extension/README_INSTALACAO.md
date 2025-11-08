# 🚀 Como Instalar a Extensão

## Passo 1: Build da Extensão

```bash
npm run dev
```

Isso vai:
- Compilar a extensão
- Criar a pasta `.output/chrome-mv3-dev/`
- Abrir o Chrome automaticamente (pode estar vazio, é normal!)

## Passo 2: Carregar no Chrome

### Opção 1: Usar o Chrome que abriu automaticamente

1. Na janela do Chrome que abriu, digite na barra de endereço:
   ```
   chrome://extensions/
   ```

2. Ative o **"Modo do desenvolvedor"** (toggle no canto superior direito)

3. A extensão já deve aparecer na lista! Se não:
   - Clique em **"Carregar sem compactação"**
   - Selecione a pasta:
     ```
     apps/extension/.output/chrome-mv3-dev
     ```

### Opção 2: Usar seu Chrome normal

1. Abra o Chrome normalmente

2. Vá para `chrome://extensions/`

3. Ative o **"Modo do desenvolvedor"**

4. Clique em **"Carregar sem compactação"**

5. Navegue até:
   ```
   /Users/marcobrunodev/github/w3b3gg/goatdotask/apps/extension/.output/chrome-mv3-dev
   ```

6. Clique em **"Selecionar"**

## Passo 3: Testar no Twitter/X

1. Abra o Twitter: https://twitter.com ou https://x.com

2. Encontre um tweet com uma wallet Solana, ou crie um tweet de teste:
   ```
   Testando wallet: 7EqQdEUXxE8hLKBcE2JH9Q8BpZG7x6VJhvPmXE7XuQNo
   ```

3. Você verá um **botão roxo** (estilo Phantom) aparecer ao lado do tweet!

4. Funcionalidades do botão:
   - 📋 Copiar endereço da wallet
   - 🔗 Abrir no Solscan Explorer

## 🐛 Problemas Comuns

### A extensão não aparece na lista
- Certifique-se que o `npm run dev` terminou de compilar
- Verifique se a pasta `.output/chrome-mv3-dev` existe
- Recarregue a página de extensões (F5)

### O botão não aparece nos tweets
- Certifique-se que o tweet contém um endereço válido de wallet Solana (32-44 caracteres)
- Abra o Console do Chrome (F12) e veja se há erros
- Recarregue a página do Twitter

### Hot Reload (desenvolvimento)
Com `npm run dev` rodando:
- Mudanças no código são aplicadas automaticamente
- Se algo não funcionar, clique em "Recarregar" na página de extensões

## 📂 Estrutura da Extensão

```
apps/extension/
├── entrypoints/
│   ├── content/           # Script que roda no Twitter/X
│   ├── background.ts      # Background script
│   └── popup/             # Popup da extensão
├── components/
│   ├── WalletButton.tsx   # Botão que aparece nos tweets
│   └── ui/                # Componentes shadcn/ui
├── utils/
│   └── solana.ts          # Validação de wallets
└── .output/
    └── chrome-mv3-dev/    # ← PASTA PARA CARREGAR NO CHROME
```

## 🎨 Cores da Phantom Wallet

A extensão usa as cores oficiais da Phantom:
- Roxo principal: `#ab9ff2`
- Preto: `#1c1c1c`
- Branco: `#ffffff`

---

**Dúvidas?** Abra o Console (F12) e verifique os logs!
