import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role, location, ci, professionalId } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, senha e nome são obrigatórios' },
        { status: 400 }
      );
    }

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY não configurado' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if system_user already exists for this professional or email
    if (professionalId) {
      const { data: existingByProf } = await supabaseAdmin
        .from('system_users')
        .select('id')
        .eq('professional_id', professionalId)
        .limit(1);
      if (existingByProf && existingByProf.length > 0) {
        return NextResponse.json(
          { error: 'Já existe um usuário vinculado a este profissional' },
          { status: 400 }
        );
      }
    }

    // Check if email already exists in auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let authUserId: string;
    let userId: string;

    // Generate sequential ID: usr_1, usr_2, etc.
    const { data: existingSysUsers } = await supabaseAdmin.from('system_users').select('id');
    const numericIds = (existingSysUsers || []).map((u: any) => {
      const match = u.id.match(/^usr_(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const nextIdNum = Math.max(...numericIds, 0) + 1;
    userId = `usr_${nextIdNum}`;

    if (existingUser) {
      // User already exists in Auth, just create system_users entry
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
        return NextResponse.json({ error: insertError.message }, { status: 400 });
      }
    } else {
      // Create new auth user
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
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      authUserId = authData.user.id;
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
        console.error('Error inserting into system_users:', insertError);
      }
    }

    return NextResponse.json({
      user: { id: userId, auth_user_id: authUserId },
      message: existingUser ? 'Usuário vinculado ao Auth existente' : 'Usuário criado com sucesso no Supabase Auth',
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
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

    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não configurado' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Update system_users table
    const { error: updateError } = await supabaseAdmin.from('system_users').update({
      ci,
      system_role: role,
      location,
      professional_id: professionalId || null,
      status,
    }).eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Also update auth user if auth_user_id exists
    const { data: sysUser } = await supabaseAdmin.from('system_users').select('auth_user_id').eq('id', id).single();
    if (sysUser?.auth_user_id) {
      const updateData: any = { user_metadata: { full_name: name, role, location, ci } };
      if (password) updateData.password = password;
      await supabaseAdmin.auth.admin.updateUserById(sysUser.auth_user_id, updateData);
    }

    return NextResponse.json({ message: 'Usuário atualizado com sucesso' });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: error?.message || 'Erro interno do servidor' }, { status: 500 });
  }
}