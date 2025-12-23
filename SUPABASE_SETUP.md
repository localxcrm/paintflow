# Como Resetar o Supabase

## Opção 1: Via Dashboard do Supabase (Recomendado)

### Passo 1: Acesse o SQL Editor
1. Vá para [app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. Clique em **SQL Editor** no menu lateral

### Passo 2: Execute o Reset
1. Copie todo o conteúdo de `supabase_reset.sql`
2. Cole no SQL Editor
3. Clique em **Run** (ou Ctrl+Enter)

### Passo 3: Execute o Schema
1. Copie todo o conteúdo de `supabase_schema.sql`
2. Cole no SQL Editor
3. Clique em **Run** (ou Ctrl+Enter)

### Passo 4: Verifique
Vá em **Table Editor** e confirme que as tabelas foram criadas:
- User
- Session
- TeamMember
- Subcontractor
- Job
- JobPhoto
- PaymentHistory
- MarketingSpend
- KnowledgeArticle
- Rock
- VTO
- BusinessSettings

---

## Opção 2: Via Supabase CLI

```bash
# Conectar ao projeto
npx supabase login

# Executar reset
npx supabase db reset --linked
```

---

## Estrutura das Tabelas

### Core
- **User** - Usuários do sistema
- **Session** - Sessões de login

### Team
- **TeamMember** - Vendedores e PMs
- **Subcontractor** - Subcontratados

### Jobs
- **Job** - Trabalhos/projetos
- **JobPhoto** - Fotos antes/depois
- **PaymentHistory** - Histórico de pagamentos

### Marketing
- **MarketingSpend** - Gastos de marketing por fonte/mês

### Knowledge
- **KnowledgeArticle** - SOPs e documentação

### EOS/Traction
- **Rock** - Metas trimestrais
- **VTO** - Visão (metas anuais)
- **BusinessSettings** - Configurações do negócio

---

## Dados de Exemplo

O schema já inclui dados de exemplo:
- 3 Team Members (Mike, Sarah, Tom)
- 3 Subcontractors
- 4 Jobs de exemplo
- Gastos de marketing de Nov/Dez
- 2 artigos de conhecimento

---

## Variáveis de Ambiente

Certifique-se de que `.env` tem:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

Pegue essas chaves em: **Project Settings > API**
