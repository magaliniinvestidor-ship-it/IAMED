-- Políticas RLS para persistência de segurança do Módulo 14
-- login_attempts: precisa de insert anônimo (falha de login ocorre sem sessão) e delete autenticado (Limpar Log)

CREATE POLICY "Allow anon insert login_attempts" ON public.login_attempts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated delete login_attempts" ON public.login_attempts
    FOR DELETE TO authenticated USING (true);