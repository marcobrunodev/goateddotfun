# Configuração Azure Static Web Apps

## Passos para configurar o deploy:

### 1. Criar o recurso no Azure Portal

1. Acesse [Azure Portal](https://portal.azure.com)
2. Clique em "Create a resource"
3. Procure por "Static Web App"
4. Clique em "Create"
5. Configure:
   - **Resource Group**: Crie um novo ou use existente
   - **Name**: Nome único para sua app (ex: goatdotask)
   - **Plan type**: Free
   - **Region**: Escolha a mais próxima
   - **Source**: GitHub
   - **GitHub Account**: Faça login com sua conta
   - **Organization**: Selecione sua org/usuário
   - **Repository**: goatdotask
   - **Branch**: main
   - **Build Presets**: Custom
   - **App location**: /apps/site
   - **API location**: (deixe vazio)
   - **Output location**: dist

### 2. Obter o API Token

Após criar o recurso:
1. Vá para o recurso criado no Azure Portal
2. No menu lateral, clique em "Manage deployment token"
3. Copie o token

### 3. Adicionar o token ao GitHub

1. Vá para Settings do seu repositório no GitHub
2. Clique em "Secrets and variables" > "Actions"
3. Clique em "New repository secret"
4. Nome: `AZURE_STATIC_WEB_APPS_API_TOKEN`
5. Value: Cole o token copiado do Azure
6. Clique em "Add secret"

### 4. Fazer o deploy

O deploy será automático quando você:
- Fizer push na branch main
- Abrir/atualizar um Pull Request

### URLs

Após o deploy, sua aplicação estará disponível em:
- URL principal: `https://<nome-da-app>.azurestaticapps.net`
- URLs de preview para PRs: `https://<nome-da-app>-<numero-pr>.azurestaticapps.net`

## Comandos úteis

```bash
# Build local para testar
cd apps/site
npm run build

# Preview do build local
npm run preview
```