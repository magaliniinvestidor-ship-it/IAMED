'use client';

import React, { useState } from 'react';
import { Building2, DoorOpen, Edit2, Plus, Trash2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { supabase } from '@/lib/supabaseClient';
import { AdminFinanceModuleProps, Location, ClinicalRoom } from './AdminContext';
import { useFormValidation } from '@/lib/validation';
import { locationSchema, clinicalRoomSchema } from '@/lib/validation/schemas';
import { FormErrorSummary } from '@/components/forms';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ROOM_TYPES = [
  'consultório',
  'quarto',
  'enfermaria',
  'sala de exame',
  'sala de procedimento',
  'sala de cirurgia',
  'sala de parto',
  'sala de recuperação',
  'sala de reabilitação',
  'uti',
  'berçário',
  'laboratório',
  'farmácia',
  'escritório',
  'recepção',
  'posto de enfermagem',
  'central de materiais',
  'área de descanso',
  'necrotério',
];

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

  const genLocationId = async (): Promise<string> => {
    if (!supabase) {
      console.error('Supabase não inicializado para gerar ID de sede');
      return 'loc_0001';
    }
    const { data, error } = await supabase.rpc('next_location_id');
    if (error || !data) {
      console.error('Erro ao gerar ID de sede via RPC:', error?.message);
      return 'loc_0001';
    }
    return data as string;
  };

  const genRoomId = async (): Promise<string> => {
    if (!supabase) {
      console.error('Supabase não inicializado para gerar ID de sala');
      return 'room_0001';
    }
    const { data, error } = await supabase.rpc('next_room_id');
    if (error || !data) {
      console.error('Erro ao gerar ID de sala via RPC:', error?.message);
      return 'room_0001';
    }
    return data as string;
  };

  const roomTypeOptions = Array.from(
    new Set([...ROOM_TYPES, ...clinicalRooms.map((r) => r.type).filter(Boolean)])
  );

  const [locName, setLocName] = useState('');
  const [locAddress, setLocAddress] = useState('');
  const [locPhone, setLocPhone] = useState('');
  const [locCity, setLocCity] = useState('');
  const [locStatus, setLocStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [editingLocId, setEditingLocId] = useState<string | null>(null);
  const [showLocForm, setShowLocForm] = useState(false);

  const [roomName, setRoomName] = useState('');
  const [roomLocation, setRoomLocation] = useState('');
  const [roomType, setRoomType] = useState('');
  const [showRoomTypeCustom, setShowRoomTypeCustom] = useState(false);
  const [roomTypeCustom, setRoomTypeCustom] = useState('');
  const [roomCapacity, setRoomCapacity] = useState<number>(1);
  const [roomEquipment, setRoomEquipment] = useState('');
  const [roomStatus, setRoomStatus] = useState<'ativo' | 'inativo' | 'manutenção'>('ativo');
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [showRoomForm, setShowRoomForm] = useState(false);

  const resetLocForm = () => {
    setEditingLocId(null);
    setLocName('');
    setLocAddress('');
    setLocPhone('');
    setLocCity('');
    setLocStatus('ativo');
  };

  const openNewLoc = () => {
    resetLocForm();
    clearLocErrors();
    setShowLocForm(true);
  };

  const openEditLoc = (loc: Location) => {
    setEditingLocId(loc.id);
    setLocName(loc.name);
    setLocAddress(loc.address || '');
    setLocPhone(loc.phone || '');
    setLocCity(loc.city || '');
    setLocStatus((loc.status as 'ativo' | 'inativo') || 'ativo');
    clearLocErrors();
    setShowLocForm(true);
  };

  const resetRoomForm = () => {
    setEditingRoomId(null);
    setRoomName('');
    setRoomLocation('');
    setRoomType('');
    setShowRoomTypeCustom(false);
    setRoomTypeCustom('');
    setRoomCapacity(1);
    setRoomEquipment('');
    setRoomStatus('ativo');
  };

  const openNewRoom = () => {
    resetRoomForm();
    clearRoomErrors();
    setShowRoomForm(true);
  };

  const openEditRoom = (room: ClinicalRoom) => {
    setEditingRoomId(room.id);
    setRoomName(room.name);
    setRoomLocation(room.location_id || '');
    setRoomStatus((room.status as 'ativo' | 'inativo' | 'manutenção') || 'ativo');
    setRoomType(room.type || '');
    setShowRoomTypeCustom(false);
    setRoomCapacity(room.capacity ?? 1);
    setRoomEquipment((room.equipment || []).join(', '));
    clearRoomErrors();
    setShowRoomForm(true);
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
      const newLoc: Location = { id: await genLocationId(), name: locName, address: locAddress, city: locCity, phone: locPhone, status: locStatus };
      setLocations((prev) => [...prev, newLoc]);
      if (supabase) {
        await supabase.from('locations').insert({ ...newLoc, created_at: new Date().toISOString() });
      }
      addAuditLog('Cadastrou Local', locName);
    }
    resetLocForm();
    clearLocErrors();
    setShowLocForm(false);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveType = showRoomTypeCustom ? roomTypeCustom.trim() : roomType;
    const equipmentList = roomEquipment.split(',').map((s) => s.trim()).filter(Boolean);
    const result = validateRoom({ name: roomName, location_id: roomLocation, type: effectiveType, capacity: roomCapacity, equipment: equipmentList, status: roomStatus });
    if (!result.success) return;

    if (editingRoomId) {
      const existing = clinicalRooms.find((r) => r.id === editingRoomId);
      const updated: ClinicalRoom = {
        id: editingRoomId,
        name: roomName,
        type: effectiveType,
        location_id: roomLocation,
        status: roomStatus,
        capacity: roomCapacity,
        equipment: equipmentList.length > 0 ? equipmentList : (existing?.equipment || []),
      };
      setClinicalRooms((prev) => prev.map((r) => (r.id === editingRoomId ? updated : r)));
      if (supabase) {
        await supabase.from('clinical_rooms').update(updated as unknown as Record<string, unknown>).eq('id', editingRoomId);
      }
      addAuditLog('Atualizou Sala', roomName);
    } else {
      const newRoom: ClinicalRoom = {
        id: await genRoomId(),
        name: roomName,
        type: effectiveType,
        location_id: roomLocation,
        status: roomStatus,
        capacity: roomCapacity,
        equipment: equipmentList,
      };
      setClinicalRooms((prev) => [...prev, newRoom]);
      if (supabase) {
        await supabase.from('clinical_rooms').insert({ ...newRoom, created_at: new Date().toISOString() });
      }
      addAuditLog('Cadastrou Sala', roomName);
    }
    resetRoomForm();
    clearRoomErrors();
    setShowRoomForm(false);
  };

  const showLocations = mode === 'both' || mode === 'locations';
  const showRooms = mode === 'both' || mode === 'rooms';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        {showLocations && showRooms && (
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-600" /> {t('fin_locations_rooms_title', 'app')}
          </h3>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {showLocations && (
            <button
              onClick={openNewLoc}
              className="flex items-center gap-2 py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" /> {t('fin_new_location', 'app')}
            </button>
          )}
          {showRooms && (
            <button
              onClick={openNewRoom}
              className="flex items-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" /> {t('fin_new_room', 'app')}
            </button>
          )}
        </div>
      </div>

      {/* Location modal */}
      {showLocForm && showLocations && (
        <Dialog open={showLocForm} onOpenChange={(open) => { if (!open) { resetLocForm(); setShowLocForm(false); } }}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-white rounded-2xl shadow-xl border-0">
            <DialogHeader>
              <DialogTitle className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                {editingLocId ? t('fin_edit_location', 'app') : t('fin_new_location', 'app')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveLocation} noValidate className="space-y-3 text-xs font-sans">
          {locErrors.length > 0 && <FormErrorSummary errors={locErrors} />}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{t('fin_location_name_label', 'app')}</label>
            <input
              type="text"
              value={locName}
              onChange={(e) => setLocName(e.target.value)}
              placeholder={t('fin_location_name_placeholder', 'app')}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{t('fin_location_address_label', 'app')}</label>
            <input
              type="text"
              value={locAddress}
              onChange={(e) => setLocAddress(e.target.value)}
              placeholder={t('fin_location_address_placeholder', 'app')}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{t('fin_location_city_label', 'app')}</label>
              <input
                type="text"
                value={locCity}
                onChange={(e) => setLocCity(e.target.value)}
                placeholder={t('fin_location_city_placeholder', 'app')}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{t('fin_location_phone_label', 'app')}</label>
              <input
                type="text"
                value={locPhone}
                onChange={(e) => setLocPhone(e.target.value)}
                placeholder={t('fin_location_phone_placeholder', 'app')}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{t('fin_status_label', 'app')}</label>
            <select
              value={locStatus}
              onChange={(e) => setLocStatus(e.target.value as 'ativo' | 'inativo')}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            >
              <option value="ativo">{t('fin_active', 'app')}</option>
              <option value="inativo">{t('fin_inactive', 'app')}</option>
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs transition">
              {editingLocId ? t('app_save', 'app') : t('app_register', 'app')}
            </button>
            <button type="button" onClick={() => { resetLocForm(); setShowLocForm(false); }} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition">
              {t('app_cancel', 'app')}
            </button>
          </div>
        </form>
          </DialogContent>
        </Dialog>
      )}

      <div className="space-y-5">
        {/* Locations list */}
        {showLocations && (
        <>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4" /> {t('fin_registered_locations', 'app')} ({locations.length})
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
                  {loc.status === 'ativo' ? t('fin_active', 'app') : t('fin_inactive', 'app')}
                </span>
                <button
                  onClick={() => openEditLoc(loc)}
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

        {/* Room modal */}
        {showRoomForm && showRooms && (
        <Dialog open={showRoomForm} onOpenChange={(open) => { if (!open) { resetRoomForm(); setShowRoomForm(false); } }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white rounded-2xl shadow-xl border-0">
            <DialogHeader>
              <DialogTitle className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-indigo-600" />
                {editingRoomId ? t('fin_edit_room', 'app') : t('fin_new_room', 'app')}
              </DialogTitle>
            </DialogHeader>
          <form onSubmit={handleSaveRoom} noValidate className="space-y-3 text-xs font-sans">
          {roomErrors.length > 0 && <FormErrorSummary errors={roomErrors} />}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1">{t('fin_room_location_label', 'app')}</label>
              <select value={roomLocation} onChange={(e) => setRoomLocation(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <option value="">{t('fin_select_placeholder', 'app')}</option>
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('fin_room_name_label', 'app')}</label>
                <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder={t('fin_room_name_placeholder', 'app')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('fin_status_label', 'app')}</label>
                <select value={roomStatus} onChange={(e) => setRoomStatus(e.target.value as 'ativo' | 'inativo' | 'manutenção')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <option value="ativo">{t('fin_active', 'app')}</option>
                  <option value="inativo">{t('fin_inactive', 'app')}</option>
                  <option value="manutenção">{t('fin_status_maintenance', 'app')}</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('fin_room_type_label', 'app')} *</label>
                <select value={showRoomTypeCustom ? '__other__' : roomType} onChange={(e) => {
                  if (e.target.value === '__other__') {
                    setShowRoomTypeCustom(true);
                    setRoomType('');
                    setRoomTypeCustom('');
                  } else {
                    setShowRoomTypeCustom(false);
                    setRoomType(e.target.value);
                  }
                }} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <option value="">{t('fin_select_placeholder', 'app')}</option>
                  {roomTypeOptions.map((rt) => (
                    <option key={rt} value={rt}>{rt}</option>
                  ))}
                  <option value="__other__">{t('fin_room_type_other', 'app')}</option>
                </select>
                {showRoomTypeCustom && (
                  <input type="text" value={roomTypeCustom} onChange={(e) => setRoomTypeCustom(e.target.value)} placeholder={t('fin_room_type_custom_placeholder', 'app')} className="mt-2 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                )}
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('fin_room_capacity_label', 'app')} *</label>
                <input type="text" inputMode="numeric" value={roomCapacity} onChange={(e) => setRoomCapacity(Number(e.target.value))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('fin_room_equipment_label', 'app')}</label>
                <input type="text" value={roomEquipment} onChange={(e) => setRoomEquipment(e.target.value)} placeholder={t('fin_room_equipment_placeholder', 'app')} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition">
                {editingRoomId ? t('app_save', 'app') : t('app_register', 'app')}
              </button>
              <button type="button" onClick={() => { resetRoomForm(); setShowRoomForm(false); }} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition">
                {t('app_cancel', 'app')}
              </button>
            </div>
          </form>
          </DialogContent>
        </Dialog>
        )}

        {/* Rooms list */}
        {showRooms && (
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Building2 className="w-4 h-4" /> {t('fin_clinical_rooms_title', 'app')} ({clinicalRooms.length})
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
                    <p className="text-slate-500 text-[10px]">{loc?.name || t('fin_room_location_undefined', 'app')}</p>
                    <p className="text-slate-400 text-[9px]">
                      {room.type} {room.capacity ? `· ${t('fin_room_capacity_short', 'app')} ${room.capacity}` : ''} {room.equipment && room.equipment.length > 0 ? `· ${room.equipment.join(', ')}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                        room.status === 'ativo'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : room.status === 'manutenção'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {room.status === 'ativo' ? t('fin_active', 'app') : room.status === 'manutenção' ? t('fin_status_maintenance', 'app') : t('fin_inactive', 'app')}
                    </span>
                    <button
                      onClick={() => openEditRoom(room)}
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
              <div className="text-center py-6 text-slate-400 font-semibold text-xs">{t('fin_no_rooms_registered', 'app')}</div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
