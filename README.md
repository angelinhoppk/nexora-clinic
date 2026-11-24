# Lavra Clinic — Plataforma SaaS White-Label para Clínicas

Plataforma web responsiva para clínicas médicas desenvolvida pela **Lavra**, composta por um site institucional white-label e um painel administrativo integrado ao **Supabase** (PostgreSQL, Auth e Row Level Security).

## Estrutura do projeto

### Site Institucional (Público)
- `index.html`: Estrutura semântica da página institucional pública.
- `styles.css`: Estilos responsivos e variáveis CSS personalizáveis do site público.
- `config.js`: Configuração centralizada da clínica (marca, logotipo, cores, contatos, especialidades, profissionais e credenciais públicas do Supabase).
- `script.js`: Aplicação segura das configurações via DOM, navegação mobile, carregamento das especialidades e profissionais do banco e envio do agendamento público.

### Painel Administrativo (Restrito)
- `admin.html`: Tela de login administrativo e painel de gestão (Dashboard, Agendamentos, Profissionais e Especialidades).
- `admin.css`: Identidade visual e responsividade do painel administrativo.
- `admin.js`: Autenticação com Supabase Auth v2, validação de vínculo em `clinic_members`, carregamento de métricas e operações CRUD protegidas por RLS.

## Como configurar o Supabase

1. Acesse o painel do seu projeto no **Supabase**.
2. Vá em **Project Settings > API** (ou **API Keys / Data API**).
3. Abra o arquivo `config.js` e preencha o bloco `supabase`:
   - `url`: Cole a **Project URL** do projeto.
   - `publishableKey`: Cole a **Publishable key** (ou **anon public**).
4. **Regra de segurança:** Nunca insira chaves `service_role` ou `secret` no `config.js` ou em qualquer arquivo do frontend.

## Como personalizar a identidade visual (White-Label)

1. Abra o arquivo `config.js`.
2. Altere os campos em `window.LAVRA_CLINIC_CONFIG`:
   - `clinic`: nome da clínica, composição do logotipo textual, título e descrição SEO.
   - `logo`: escolha entre monograma (`type: "monogram"`) ou imagem externa/local (`type: "image"` com `imageUrl`).
   - `colors`: cores primárias e secundárias em hexadecimal (`#102b46`, etc.), aplicadas automaticamente tanto no site público quanto no painel administrativo.
   - `contact`: telefone, WhatsApp, e-mail, endereço e horários.

## Como executar localmente

1. Abra a pasta do projeto no **Visual Studio Code**.
2. Utilize a extensão **Live Server** (clique com o botão direito em `index.html` ou `admin.html` e selecione **Open with Live Server**) para rodar via servidor local (`http://127.0.0.1:5500`), garantindo o funcionamento adequado da persistência de sessão do Supabase Auth.

## Arquitetura e Segurança (Multi-Tenant)

- **Isolamento por clínica:** Todas as tabelas (`clinics`, `clinic_members`, `specialties`, `professionals` e `appointments`) operam com **Row Level Security (RLS)** ativado.
- **Identificação segura da clínica:** O painel nunca confia em parâmetros de URL ou armazenamento local para definir o `clinic_id`. Após o login, `admin.js` consulta `clinic_members` usando o `user_id` autenticado e obtém o `clinic_id` autorizado diretamente do banco.
- **Agendamento público (`index.html`):** com `booking.mode: "supabase"`, o site fala apenas com a Edge Function `public-booking` (código em `supabase/functions/public-booking/`). Ela identifica a clínica pelo `booking.clinicSlug`, devolve só dados públicos (nome, especialidades, profissionais) e grava solicitações após validar tudo no servidor (campos, data, especialidade da própria clínica, limite de envios por telefone e campo-armadilha contra robôs). O visitante não tem permissão de leitura nem de escrita direta nas tabelas.
- **Exclusões:** somente usuários com papel `admin` em `clinic_members` podem excluir registros (regra garantida pelo RLS).

## Créditos

Produto desenvolvido pela **Lavra**.