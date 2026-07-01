-- ==========================================
-- IAMED - GESTÃO FINANCEIRA E CONTÁBIL
-- Contas a Pagar/Receber, Fluxo Caixa, Conciliação, DRE, Impostos, etc.
-- ==========================================

DROP TABLE IF EXISTS accounting_entries CASCADE;
DROP TABLE IF EXISTS chart_of_accounts CASCADE;
DROP TABLE IF EXISTS exchange_rates CASCADE;
DROP TABLE IF EXISTS sales_book CASCADE;
DROP TABLE IF EXISTS purchase_book CASCADE;
DROP TABLE IF EXISTS tax_calculations CASCADE;
DROP TABLE IF EXISTS income_statements CASCADE;
DROP TABLE IF EXISTS cost_centers CASCADE;
DROP TABLE IF EXISTS bank_reconciliations CASCADE;
DROP TABLE IF EXISTS cash_flow_projections CASCADE;
DROP TABLE IF EXISTS accounts_receivable CASCADE;
DROP TABLE IF EXISTS accounts_payable CASCADE;

CREATE TABLE accounts_payable (
  id TEXT PRIMARY KEY, description TEXT NOT NULL, supplier TEXT NOT NULL, ruc TEXT, category TEXT NOT NULL,
  amount NUMERIC(12,0) NOT NULL, due_date DATE NOT NULL, days_overdue INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('a_vencer', 'vencido', 'pago', 'cancelado')),
  payment_date DATE, dte_number TEXT, cost_center TEXT, notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE accounts_receivable (
  id TEXT PRIMARY KEY, description TEXT NOT NULL, patient_name TEXT NOT NULL, insurance_name TEXT, category TEXT NOT NULL,
  amount NUMERIC(12,0) NOT NULL, due_date DATE NOT NULL, days_overdue INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('a_vencer', 'vencido', 'recebido', 'cancelado')),
  receipt_date DATE, dte_number TEXT, cost_center TEXT, notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE cash_flow_projections (
  id TEXT PRIMARY KEY, date DATE NOT NULL, type TEXT NOT NULL CHECK (type IN ('realizado', 'projetado')),
  income NUMERIC(12,0) NOT NULL, expense NUMERIC(12,0) NOT NULL, balance NUMERIC(12,0) NOT NULL,
  accumulated NUMERIC(12,0) NOT NULL, notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE bank_reconciliations (
  id TEXT PRIMARY KEY, bank_name TEXT NOT NULL, account_number TEXT NOT NULL, statement_date DATE NOT NULL,
  bank_balance NUMERIC(12,0) NOT NULL, book_balance NUMERIC(12,0) NOT NULL, difference NUMERIC(12,0) DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('pendente', 'conciliado', 'divergente')),
  entries JSONB DEFAULT '[]'::JSONB, last_reconciled DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE cost_centers (
  id TEXT PRIMARY KEY, name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('unidade', 'especialidade', 'profissional')),
  parent_id TEXT, budget NUMERIC(12,0) DEFAULT 0, spent NUMERIC(12,0) DEFAULT 0,
  revenue NUMERIC(12,0) DEFAULT 0, active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE income_statements (
  id TEXT PRIMARY KEY, period TEXT NOT NULL,
  revenue_consultas NUMERIC(12,0) DEFAULT 0, revenue_exames NUMERIC(12,0) DEFAULT 0,
  revenue_procedimentos NUMERIC(12,0) DEFAULT 0, revenue_internacao NUMERIC(12,0) DEFAULT 0,
  revenue_outros NUMERIC(12,0) DEFAULT 0, revenue_total NUMERIC(12,0) DEFAULT 0,
  cost_insumos NUMERIC(12,0) DEFAULT 0, cost_pessoal NUMERIC(12,0) DEFAULT 0,
  cost_operacional NUMERIC(12,0) DEFAULT 0, cost_ocupacional NUMERIC(12,0) DEFAULT 0,
  cost_total NUMERIC(12,0) DEFAULT 0, gross_profit NUMERIC(12,0) DEFAULT 0,
  expenses_admin NUMERIC(12,0) DEFAULT 0, expenses_marketing NUMERIC(12,0) DEFAULT 0,
  expenses_tax NUMERIC(12,0) DEFAULT 0, expenses_financial NUMERIC(12,0) DEFAULT 0,
  expenses_total NUMERIC(12,0) DEFAULT 0, net_income NUMERIC(12,0) DEFAULT 0,
  irp NUMERIC(12,0) DEFAULT 0, iva NUMERIC(12,0) DEFAULT 0, net_income_after_tax NUMERIC(12,0) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE tax_calculations (
  id TEXT PRIMARY KEY, period TEXT NOT NULL,
  tax_type TEXT NOT NULL CHECK (tax_type IN ('IVA', 'IRE', 'IRP', 'IDU')),
  taxable_base NUMERIC(12,0) NOT NULL, tax_rate NUMERIC(5,2) NOT NULL, tax_amount NUMERIC(12,0) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('calculado', 'declarado', 'pago')),
  due_date DATE NOT NULL, payment_date DATE, notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE purchase_book (
  id TEXT PRIMARY KEY, dte_number TEXT NOT NULL, supplier TEXT NOT NULL, ruc TEXT, date DATE NOT NULL,
  timbrado TEXT NOT NULL, invoice_type TEXT NOT NULL,
  taxable_5 NUMERIC(12,0) DEFAULT 0, taxable_10 NUMERIC(12,0) DEFAULT 0,
  iva_5 NUMERIC(12,0) DEFAULT 0, iva_10 NUMERIC(12,0) DEFAULT 0, total NUMERIC(12,0) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE sales_book (
  id TEXT PRIMARY KEY, dte_number TEXT NOT NULL, patient_name TEXT NOT NULL, ruc TEXT, date DATE NOT NULL,
  timbrado TEXT NOT NULL, invoice_type TEXT NOT NULL,
  taxable_5 NUMERIC(12,0) DEFAULT 0, taxable_10 NUMERIC(12,0) DEFAULT 0,
  iva_5 NUMERIC(12,0) DEFAULT 0, iva_10 NUMERIC(12,0) DEFAULT 0, total NUMERIC(12,0) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE exchange_rates (
  id TEXT PRIMARY KEY, currency TEXT NOT NULL CHECK (currency IN ('USD', 'ARS', 'BRL', 'EUR')),
  buy_rate NUMERIC(12,2) NOT NULL, sell_rate NUMERIC(12,2) NOT NULL, date DATE NOT NULL, source TEXT DEFAULT 'BCP',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE chart_of_accounts (
  id TEXT PRIMARY KEY, code TEXT NOT NULL, name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ativo', 'passivo', 'patrimonio', 'receita', 'despesa', 'custo')),
  level INTEGER NOT NULL, parent_code TEXT, balance NUMERIC(12,0) DEFAULT 0, active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE accounting_entries (
  id TEXT PRIMARY KEY, date DATE NOT NULL, description TEXT NOT NULL,
  account_debit TEXT NOT NULL, account_credit TEXT NOT NULL, amount NUMERIC(12,0) NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('faturamento', 'recebimento', 'pagamento', 'devolucao', 'ajuste')),
  document_number TEXT, cost_center TEXT, notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS Policies
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_book ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_book ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON accounts_payable FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON accounts_payable FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON accounts_receivable FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON accounts_receivable FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON cash_flow_projections FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON cash_flow_projections FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON bank_reconciliations FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON bank_reconciliations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON cost_centers FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON cost_centers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON income_statements FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON income_statements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON tax_calculations FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON tax_calculations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON purchase_book FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON purchase_book FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON sales_book FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON sales_book FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON exchange_rates FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON exchange_rates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON chart_of_accounts FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON chart_of_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read access" ON accounting_entries FOR SELECT USING (true);
CREATE POLICY "Allow authenticated changes" ON accounting_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
