'use client';

import React, { useState } from 'react';
import { Building2, Edit2, Trash2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { useModuleId } from '@/hooks/useModuleId';
import { supabase } from '@/lib/supabaseClient';
import { AdminFinanceModuleProps, Location, ClinicalRoom } from './AdminContext';
import { useFormValidation, groupErrorsByPath } from '@/lib/validation';
import { locationSchema, clinicalRoomSchema } from '@/lib/validation/schemas';
import { FormErrorSummary } from '@/components/forms';

export function LocationsTab({
  locations,
  setLocations,
  clinicalRooms,
  setClinicalRooms,
  addAuditLog,
  mode = 'both',
}: Pick<AdminFinanceModuleProps, 'addAuditLog'> & {
  locations: Location[];
  setLocations: React.Dispatch<React.SetStateAction<Location[]>>;
  clinicalRooms: ClinicalRoom[];
  setClinicalRooms: React.Dispatch<React.SetStateAction<ClinicalRoom[]>>;
  mode?: 'locations' | 'rooms' | 'both';
}) {
  const { t } = useI18n();
  const genModuleId = useModuleId();

  const [locName, setLocName] = useState('');
  const [locAddress, setLocAddress] = useState('');
  const [locPhone, setLocPhone] = useState('');
  const [locCity, setLocCity] = useState('');
  const [locStatus, setLocStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [editingLocId, setEditingLocId] = useState<string | null>(null);

  const [roomName, setRoomName] = useState('');
  const [roomLocation, setRoomLocation] = useState('');
  const [roomStatus, setRoomStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);

  const resetLocForm = () => {
    setEditingLocId(null);
    setLocName('');
    setLocAddress('');
    setLocPhone('');
    setLocCity('');
    setLocStatus('ativo');
  };

  const resetRoomForm = () => {
    setEditingRoomId(null);
    setRoomName('');
    setRoomLocation('');
    setRoomStatus('ativo');
  };

  const { errors: locErrors, validate: validateLoc, clearErrors: clearLocErrors } = useFormValidation(locationSchema);
  const { errors: roomErrors, validate: validateRoom, clearErrors: clearRoomErrors } = useFormValidation(clinicalRoomSchema);

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateLoc({ name: locName, address: locAddress, city: locCity, phone: locPhone, status: locStatus });
    if (!result.success) return;

    if (editingLocId) {
      const updated: Location = { id: editingLocId, name: locName, address: locAddress, city: locCity, phone: locPhone, status: locStatus };
      setLocations((prev) => prev.map((l) => (l.id === editingLocId ? updated : l)));
      if (supabase) {
        await supabase.from('locations').update(updated as unknown as Record<string, unknown>).eq('id', editingLocId);
      }
      addAuditLog('Atualizou Local', locName);
    } else {
      const newLoc: Location = { id: await genModuleId('loc'), name: locName, address: locAddress, city: locCity, phone: locPhone, status: locStatus };
      setLocations((prev) => [...prev, newLoc]);
      if (supabase) {
        await supabase.from('locations').insert({ ...newLoc, created_at: new Date().toISOString() });
      }
      addAuditLog('Cadastrou Local', locName);
    }
    resetLocForm();
    clearLocErrors();
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateRoom({ name: roomName, location_id: roomLocation, status: roomStatus });
    if (!result.success) return;

    if (editingRoomId) {
      const updated: ClinicalRoom = { id: editingRoomId, name: roomName, type: 'consultório', location_id: roomLocation, status: roomStatus, capacity: 1, equipment: [] };
      setClinicalRooms((prev) => prev.map((r) => (r.id === editingRoomId ? updated : r)));
      if (supabase) {
        await supabase.from('clinical_rooms').update(updated as unknown as Record<string, unknown>).eq('id', editingRoomId);
      }
      addAuditLog('Atualizou Sala', roomName);
    } else {
      const newRoom: ClinicalRoom = { id: await genModuleId('room'), name: roomName, type: 'consultório', location_id: roomLocation, status: roomStatus, capacity: 1, equipment: [] };
      setClinicalRooms((prev) => [...prev, newRoom]);
      if (supabase) {
        await supabase.from('clinical_rooms').insert({ ...newRoom, created_at: new Date().toISOString() });
      }
      addAuditLog('Cadastrou Sala', roomName);
    }
    resetRoomForm();
    clearRoomErrors();
  };

  const locFieldErrors = groupErrorsByPath(locErrors);
  const roomFieldErrors = groupErrorsByPath(roomErrors);

  const showLocations = mode === 'both' || mode === 'locations';
  const showRooms = mode === 'both' || mode === 'rooms';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Location form */}
      {showLocations && (
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs lg:col-span-1 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Building2 className="w-5 h-5 text-teal-600" />
          <h3 className="font-semibold text-slate-800 text-base">
            {editingLocId ? t('fin_edit_location', 'app') : t('fin_new_location', 'app')}
          </h3>
        </div>
        <form onSubmit={handleSaveLocation} className="space-y-3 text-xs font-sans">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nome da Sede *</label>
            <input
              type="text"
              value={locName}
              onChange={(e) => setLocName(e.target.value)}
              placeholder="Ex: Sede Central"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Endereço *</label>
            <input
              type="text"
              value={locAddress}
              onChange={(e) => setLocAddress(e.target.value)}
              placeholder="Av. Principal 1234"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Cidade *</label>
              <input
                type="text"
                value={locCity}
                onChange={(e) => setLocCity(e.target.value)}
                placeholder="Asunción"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Telefone *</label>
              <input
                type="text"
                value={locPhone}
                onChange={(e) => setLocPhone(e.target.value)}
                placeholder="+595 21 123456"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
            <select
              value={locStatus}
              onChange={(e) => setLocStatus(e.target.value as 'ativo' | 'inativo')}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs transition">
              {editingLocId ? t('app_save', 'app') : t('app_register', 'app')}
            </button>
            {editingLocId && (
              <button type="button" onClick={resetLocForm} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition">
                {t('app_cancel', 'app')}
              </button>
            )}
          </div>
        </form>
      </div>
      )}

      <div className={`space-y-3 ${showLocations ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
        {/* Locations list */}
        {showLocations && (
        <>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Locais Cadastrados ({locations.length})
          </h3>
        </div>
        <div className="space-y-2">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className={`p-4 bg-slate-50 hover:bg-slate-100/70 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs transition ${loc.status === 'inativo' ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-slate-800 text-sm">{loc.name}</p>
                  <p className="text-slate-500 font-medium">
                    {loc.address}
                    {loc.city ? `, ${loc.city}` : ''}
                  </p>
                  {loc.phone && <p className="text-slate-400 text-[10px]">{loc.phone}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded border ${loc.status === 'ativo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}
                >
                  {loc.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </span>
                <button
                  onClick={() => {
                    setEditingLocId(loc.id);
                    setLocName(loc.name);
                    setLocAddress(loc.address || '');
                    setLocPhone(loc.phone || '');
                    setLocCity(loc.city || '');
                    setLocStatus((loc.status as 'ativo' | 'inativo') || 'ativo');
                  }}
                  className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition cursor-pointer"
                  title={t('fin_btn_edit', 'app')}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    const roomsCount = clinicalRooms.filter((r) => r.location_id === loc.id).length;
                    const msg =
                      roomsCount > 0
                        ? t('fin_confirm_delete_location_with_rooms', 'app')
                            .replace('{name}', loc.name)
                            .replace('{count}', String(roomsCount))
                        : t('fin_confirm_delete_location', 'app').replace('{name}', loc.name);
                    if (typeof window !== 'undefined' && confirm(msg)) {
                      setClinicalRooms((prev) => prev.filter((r) => r.location_id !== loc.id));
                      setLocations((prev) => prev.filter((l) => l.id !== loc.id));
                      if (supabase) {
                        supabase.from('clinical_rooms').delete().eq('location_id', loc.id).then(({ error }) => {
                          if (error) console.error('Erro ao excluir salas:', error.message, error);
                        });
                        supabase.from('locations').delete().eq('id', loc.id).then(({ error }) => {
                          if (error) console.error('Erro ao excluir sede:', error.message, error);
                        });
                      }
                      addAuditLog('Removeu Local', loc.name);
                    }
                  }}
                  className="p-2 rounded-lg hover:bg-rose-50 text-rose-500 transition cursor-pointer"
                  title={t('fin_btn_remove', 'app')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        </>
        )}

        {/* Room form */}
        {showRooms && (
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-800 text-base">
              {editingRoomId ? t('fin_edit_room', 'app') : t('fin_new_room', 'app')}
            </h3>
          </div>
          <form onSubmit={handleSaveRoom} className="space-y-3 text-xs font-sans">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Sede *</label>
                <select value={roomLocation} onChange={(e) => setRoomLocation(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <option value="">Selecione...</option>
                  {locations
                    .filter((l) => l.status === 'ativo')
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nome da Sala *</label>
                <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="Ex: Sala 101" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                <select value={roomStatus} onChange={(e) => setRoomStatus(e.target.value as 'ativo' | 'inativo')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition">
                {editingRoomId ? t('app_save', 'app') : t('app_register', 'app')}
              </button>
              {editingRoomId && (
                <button type="button" onClick={resetRoomForm} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition">
                  {t('app_cancel', 'app')}
                </button>
              )}
            </div>
          </form>
        </div>
        )}

        {/* Rooms list */}
        {showRooms && (
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4" /> Salas Clínicas ({clinicalRooms.length})
          </h3>
          <div className="space-y-2">
            {clinicalRooms.map((room) => {
              const loc = locations.find((l) => l.id === room.location_id);
              return (
                <div
                  key={room.id}
                  className={`p-3 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between text-xs ${room.status === 'inativo' ? 'opacity-60' : ''}`}
                >
                  <div>
                    <p className="font-bold text-slate-800">{room.name}</p>
                    <p className="text-slate-500 text-[10px]">{loc?.name || 'Sede não definida'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded border ${room.status === 'ativo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}
                    >
                      {room.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </span>
                    <button
                      onClick={() => {
                        setEditingRoomId(room.id);
                        setRoomName(room.name);
                        setRoomLocation(room.location_id || '');
                        setRoomStatus((room.status as 'ativo' | 'inativo') || 'ativo');
                      }}
                      className="p-1.5 rounded hover:bg-slate-200 text-slate-600 hover:text-slate-800"
                      title={t('fin_btn_edit', 'app')}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined' && confirm(t('fin_confirm_delete_room', 'app').replace('{name}', room.name))) {
                          setClinicalRooms((prev) => prev.filter((r) => r.id !== room.id));
                          if (supabase) {
                            supabase.from('clinical_rooms').delete().eq('id', room.id).then(({ error }) => {
                              if (error) console.error('Erro ao excluir sala:', error.message, error);
                            });
                          }
                          addAuditLog('Removeu Sala', room.name);
                        }
                      }}
                      className="p-1.5 rounded hover:bg-rose-50 text-rose-500"
                      title={t('fin_btn_remove', 'app')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
            {clinicalRooms.length === 0 && (
              <div className="text-center py-6 text-slate-400 font-semibold text-xs">Nenhuma sala cadastrada.</div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
