import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function extractError(err: unknown): string {
  if (!err) return 'Erro desconhecido';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message || err.name || String(err);
  if (typeof err === 'object' && err !== null) {
    const obj = err as Record<string, unknown>;
    const msg = obj.message ?? obj.msg ?? obj.error ?? obj.error_description ?? obj.error_id;
    if (typeof msg === 'string' && msg && msg !== '{}') return msg;
    if (typeof msg === 'object' && msg !== null && Object.keys(msg).length > 0) return JSON.stringify(msg);
    try {
      const seen = new WeakSet();
      const raw = JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) return '[Circular]';
          seen.add(value);
        }
        return value;
      });
      if (raw && raw !== '{}' && raw !== 'null') return raw;
    } catch {}
    try { const s = String(err); return s !== '[object Object]' ? s : 'Erro desconhecido'; } catch { return 'Erro desconhecido'; }
  }
  return String(err);
}

export async function GET(req: NextRequest) {
  try {
    const professionalId = req.nextUrl.searchParams.get('professional_id');

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase URL ou Service Role Key não configurados' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (professionalId) {
      const { data, error } = await supabaseAdmin
        .from('system_users')
        .select('id')
        .eq('professional_id', professionalId);
      if (error) {
        console.error('[GET /api/admin/users] professionalId lookup error:', extractError(error));
        return NextResponse.json({ error: `Erro ao buscar usuários vinculados: ${extractError(error)}` }, { status: 500 });
      }
      return NextResponse.json({
        count: data?.length ?? 0,
        ids: (data ?? []).map((u) => u.id as string),
      });
    }

    const { data, error } = await supabaseAdmin.from('system_users').select('*').order('created_at', { ascending: true });
    if (error) {
      console.error('[GET /api/admin/users] list error:', extractError(error));
      return NextResponse.json({ error: `Erro ao listar usuários: ${extractError(error)}` }, { status: 500 });
    }
    return NextResponse.json({ users: data ?? [] });
  } catch (error: unknown) {
    console.error('List users error:', error);
    return NextResponse.json({ error: extractError(error) || 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role, location, ci, professionalId } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, senha e nome são obrigatórios' },
        { status: 400 }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase URL ou Service Role Key não configurados' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (professionalId) {
      const { data: existingByProf, error: profCheckError } = await supabaseAdmin
        .from('system_users')
        .select('id')
        .eq('professional_id', professionalId)
        .limit(1);
      if (profCheckError) {
        console.error('[POST /api/admin/users] profCheckError:', extractError(profCheckError));
        return NextResponse.json(
          { error: `Erro ao verificar profissional: ${extractError(profCheckError)}` },
          { status: 500 }
        );
      }
      if (existingByProf && existingByProf.length > 0) {
        return NextResponse.json(
          { error: 'Já existe um usuário vinculado a este profissional' },
          { status: 400 }
        );
      }
    }

    const { data: existingUsers, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();
    if (listUsersError) {
      console.error('[POST /api/admin/users] listUsersError:', extractError(listUsersError));
      return NextResponse.json(
        { error: `Erro ao listar usuários auth: ${extractError(listUsersError)}` },
        { status: 500 }
      );
    }
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      const { data: linked } = await supabaseAdmin
        .from('system_users')
        .select('id')
        .eq('auth_user_id', existingUser.id)
        .limit(1);
      if (linked && linked.length > 0) {
        return NextResponse.json(
          { error: 'Este e-mail já possui um usuário do sistema vinculado' },
          { status: 400 }
        );
      }
    }

    const { data: nextId, error: rpcError } = await supabaseAdmin.rpc('next_system_user_id');
    if (rpcError || !nextId) {
      console.error('[POST /api/admin/users] rpcError:', extractError(rpcError));
      return NextResponse.json(
        { error: `Falha ao gerar ID de usuário: ${extractError(rpcError) || 'RPC retornou vazio'}` },
        { status: 500 }
      );
    }
    const userId: string = nextId;

    let authUserId: string;

    if (existingUser) {
      authUserId = existingUser.id;
      const { error: insertError } = await supabaseAdmin.from('system_users').insert({
        id: userId,
        auth_user_id: authUserId,
        professional_id: professionalId || null,
        ci,
        system_role: role,
        location,
        permissions: [],
        status: 'ativo',
      });
      if (insertError) {
        console.error('[POST /api/admin/users] insertError (existing auth user):', extractError(insertError));
        return NextResponse.json({ error: `Erro ao inserir system_users: ${extractError(insertError)}` }, { status: 400 });
      }
    } else {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: name,
          role,
          location,
          ci,
          professional_id: professionalId,
        },
      });

      if (authError) {
        console.error('[POST /api/admin/users] authError raw:', authError);
        console.error('[POST /api/admin/users] authError msg:', (authError as any)?.message);
        const errMsg = (authError as any)?.message || String(authError) || '';
        let userMsg = 'Erro ao criar usuário na autenticação';
        if (errMsg.includes('RetryableFetch') || errMsg.includes('fetch')) {
          userMsg = 'Erro de conexão com o Supabase Auth. Verifique se o projeto está ativo no painel do Supabase.';
        } else if (errMsg.includes('already') || errMsg.includes('registered')) {
          userMsg = 'Este e-mail já está registrado no Supabase Auth.';
        } else if (errMsg.includes('password') || errMsg.includes('Password')) {
          userMsg = `Erro de senha: ${errMsg}`;
        } else if (errMsg) {
          userMsg = `Erro auth: ${errMsg}`;
        }
        return NextResponse.json({ error: userMsg }, { status: 400 });
      }

      authUserId = authData.user.id;
      const insertPayload = {
        id: userId,
        auth_user_id: authUserId,
        professional_id: professionalId || null,
        ci,
        system_role: role,
        location,
        permissions: [],
        status: 'ativo',
      };
      console.log('[POST /api/admin/users] about to insert:', JSON.stringify(insertPayload));
      const { error: insertError } = await supabaseAdmin.from('system_users').insert(insertPayload);

      if (insertError) {
        console.error('[POST /api/admin/users] insertError:', extractError(insertError));
        return NextResponse.json(
          { error: `Auth criado, mas falhou ao inserir system_users: ${extractError(insertError)}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      user: { id: userId, auth_user_id: authUserId },
      message: existingUser ? 'Usuário vinculado ao Auth existente' : 'Usuário criado com sucesso no Supabase Auth',
    });
  } catch (error: unknown) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: extractError(error) || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, email, name, role, location, ci, professionalId, status, password } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase URL ou Service Role Key não configurados' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: updateError } = await supabaseAdmin.from('system_users').update({
      ci,
      system_role: role,
      location,
      professional_id: professionalId || null,
      status,
    }).eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: extractError(updateError) }, { status: 400 });
    }

    const { data: sysUser } = await supabaseAdmin.from('system_users').select('auth_user_id').eq('id', id).single();
    if (sysUser?.auth_user_id) {
      const updateData: any = { user_metadata: { full_name: name, role, location, ci } };
      if (password) updateData.password = password;
      if (status === 'inativo' || status === 'bloqueado') {
        updateData.ban_duration = '876000h';
      } else if (status === 'ativo') {
        updateData.ban_duration = 'none';
      }
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(sysUser.auth_user_id, updateData);
      if (authUpdateError) {
        console.error('[PUT /api/admin/users] authUpdateError:', extractError(authUpdateError));
        if (status === 'inativo' || status === 'bloqueado') {
          return NextResponse.json(
            { error: `Usuário atualizado na tabela, mas falhou ao bloquear acesso no Auth: ${extractError(authUpdateError)}` },
            { status: 400 }
          );
        }
      }
    }

    return NextResponse.json({ message: 'Usuário atualizado com sucesso' });
  } catch (error: unknown) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: extractError(error) || 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase URL ou Service Role Key não configurados' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: sysUser, error: fetchError } = await supabaseAdmin
      .from('system_users')
      .select('auth_user_id')
      .eq('id', id)
      .single();
    if (fetchError) {
      console.error('[DELETE /api/admin/users] fetchError:', extractError(fetchError));
      return NextResponse.json({ error: `Erro ao buscar usuário: ${extractError(fetchError)}` }, { status: 400 });
    }

    if (sysUser?.auth_user_id) {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(sysUser.auth_user_id);
      if (authDeleteError) {
        console.error('[DELETE /api/admin/users] authDeleteError:', extractError(authDeleteError));
        return NextResponse.json(
          { error: `Falha ao excluir usuário do Auth: ${extractError(authDeleteError)}` },
          { status: 400 }
        );
      }
    }

    const { error: deleteError } = await supabaseAdmin.from('system_users').delete().eq('id', id);
    if (deleteError) {
      console.error('[DELETE /api/admin/users] deleteError:', extractError(deleteError));
      return NextResponse.json({ error: `Erro ao excluir usuário do sistema: ${extractError(deleteError)}` }, { status: 400 });
    }

    return NextResponse.json({ message: 'Usuário excluído com sucesso' });
  } catch (error: unknown) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: extractError(error) || 'Erro interno do servidor' }, { status: 500 });
  }
}
