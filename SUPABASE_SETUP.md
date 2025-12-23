# Como Resetar o Supabase - PaintPro

## Arquivo Principal
Use o arquivo `supabase_reset_complete.sql` para resetar o banco de dados.

---

## Passo a Passo

### Passo 1: Acesse o SQL Editor
1. Va para [app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto
3. Clique em **SQL Editor** no menu lateral

### Passo 2: Execute o Reset Completo
1. Abra o arquivo `supabase_reset_complete.sql`
2. Copie TODO o conteudo
3. Cole no SQL Editor
4. Clique em **Run** (ou Ctrl+Enter)

### Passo 3: Verifique
Va em **Table Editor** e confirme que as tabelas foram criadas:

**Core (Multi-tenant):**
- Organization
- User
- UserOrganization
- Session
- Invitation

**Equipe:**
- TeamMember (com `defaultCommissionPct`)
- Subcontractor (com `defaultPayoutPct`)

**CRM:**
- Lead
- Estimate
- EstimateLineItem
- EstimateSignature

**Jobs:**
- Job (com 30+ campos de painting)

**Marketing:**
- WeeklySales
- MarketingSpend

**EOS/Traction:**
- VTO
- Rock
- Todo
- Issue
- Seat
- Meeting
- ScorecardMetric
- ScorecardEntry
- PeopleAnalyzer

**Configuracoes:**
- BusinessSettings (com campos financeiros)
- CompanyEstimateSettings

**Pricing:**
- RoomPrice
- ExteriorPrice
- Addon

**Portfolio:**
- PortfolioImage

**AI:**
- AIConversation
- AIMessage

---

## Dados de Exemplo

O script inclui dados de exemplo:

**Usuario Demo:**
- Email: `admin@paintpro.com`
- Senha: `demo123`

**Organizacao Demo:**
- Nome: Demo Painting Co
- Plano: Pro

**Equipe Demo:**
- 3 Team Members (com comissao 5%)
- 3 Subcontractors (com payout 60%)

**Jobs Demo:**
- 3 jobs de exemplo

---

## Variaveis de Ambiente

Certifique-se de que `.env` tem:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

Pegue essas chaves em: **Project Settings > API**

---

## Arquivos SQL Disponiveis

| Arquivo | Descricao | Usar? |
|---------|-----------|-------|
| `supabase_reset_complete.sql` | Schema completo v5.0 - Painting Contractor | **SIM** |
| `supabase_reset_saas.sql` | Schema generico SaaS (DESATUALIZADO) | NAO |
| `supabase_schema.sql` | Schema antigo | NAO |
| `supabase_add_percentages.sql` | Migracao parcial | NAO |

---

## Troubleshooting

### Erro 500 ao criar TeamMember ou Subcontractor
**Causa:** Tabela nao tem as colunas `defaultCommissionPct` ou `defaultPayoutPct`
**Solucao:** Execute `supabase_reset_complete.sql`

### Usuario nao consegue fazer login
**Causa:** Tabela User ou Session esta vazia/incorreta
**Solucao:** Execute `supabase_reset_complete.sql`

### Dados nao aparecem
**Causa:** organizationId nao esta sendo passado
**Solucao:** Verifique se o cookie `paintpro_org_id` esta sendo definido

---

## Tabelas Criticas

### TeamMember
```sql
"id" TEXT PRIMARY KEY
"organizationId" TEXT NOT NULL
"name" TEXT NOT NULL
"email" TEXT
"phone" TEXT
"role" TEXT DEFAULT 'both' -- sales, pm, both
"defaultCommissionPct" NUMERIC DEFAULT 5  -- CRITICO
"color" TEXT DEFAULT '#3B82F6'
"isActive" BOOLEAN DEFAULT true
```

### Subcontractor
```sql
"id" TEXT PRIMARY KEY
"organizationId" TEXT NOT NULL
"name" TEXT NOT NULL
"email" TEXT
"phone" TEXT
"specialty" TEXT DEFAULT 'both' -- interior, exterior, both
"defaultPayoutPct" NUMERIC DEFAULT 60  -- CRITICO
"color" TEXT DEFAULT '#10B981'
"isActive" BOOLEAN DEFAULT true
```

### BusinessSettings
```sql
"id" TEXT PRIMARY KEY
"organizationId" TEXT NOT NULL
"companyName" TEXT
"subPayoutPct" NUMERIC DEFAULT 60       -- CRITICO
"subMaterialsPct" NUMERIC DEFAULT 15    -- CRITICO
"subLaborPct" NUMERIC DEFAULT 45        -- CRITICO
"minGrossProfitPerJob" NUMERIC DEFAULT 900
"targetGrossMarginPct" NUMERIC DEFAULT 40
"defaultDepositPct" NUMERIC DEFAULT 30
"arTargetDays" INTEGER DEFAULT 7
```
