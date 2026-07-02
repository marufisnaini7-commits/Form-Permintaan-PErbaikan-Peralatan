/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RepairRequest, PartItem } from '../types';
import { 
  Save, ClipboardList, PenTool, CheckCircle, HelpCircle, ArrowRight, 
  User, Settings, Info, Lock, ShieldCheck, AlertTriangle, Clock, Shield
} from 'lucide-react';

interface FormRepairProps {
  initialData?: RepairRequest | null;
  onSave: (data: RepairRequest) => void;
  onCancel: () => void;
  userRole?: 'pegawai' | 'admin';
}

export default function FormRepair({ initialData, onSave, onCancel, userRole = 'pegawai' }: FormRepairProps) {
  const [activeTab, setActiveTab] = useState<'request' | 'execution'>('request');
  const [formData, setFormData] = useState<RepairRequest>({
    id: '',
    noJobOrder: '',
    tglPermintaan: '',
    dilaporkanOleh: '',
    namaAlat: '',
    typeAlat: '',
    nomerAlat: '',
    lokasiAlat: '',
    kmHmSaatIni: '',
    keluhanUraian: '',
    diketahuiOleh: '',
    dimintaOleh: '',
    disposisiRencana: '',
    disposisiDibuatDiterimaOleh: '',
    tindakanPerbaikan: '',
    kmHmSelanjutnya: '',
    dikerjakanOleh: '',
    parts: Array.from({ length: 10 }, (_, i) => ({ no: i + 1, name: '', qty: '', note: '' })),
    diperiksaOleh: '',
    status: 'Draft',
    createdAt: '',
    updatedAt: '',
  });

  // Role & Workflow permissions
  const isAdmin = userRole === 'admin';
  const isNew = !initialData;
  const isDraft = formData.status === 'Draft';
  const isPermintaan = formData.status === 'Permintaan';
  const isDisposisi = formData.status === 'Disposisi' || (formData.status as string) === 'Disetujui';
  const isSelesai = formData.status === 'Selesai';

  // 1. Isian Awal Permintaan (Tahap 1): Pegawai hanya bisa isi jika Baru atau Draft.
  // Setelah diajukan, pegawai TIDAK BISA mengedit isiannya kembali.
  const canEditInitial = isAdmin || isNew || isDraft;

  // 2. Disposisi Rencana: Khusus Admin / Kasubag / PPK
  const canEditDisposisi = isAdmin;

  // 3. Uraian Perbaikan / Part / Tindakan (Tahap 2):
  // Terbuka untuk Pegawai/Teknisi HANYA jika permohonan telah DISETUJU / DIDISPOSISI atau SELESAI.
  const canEditExecution = isAdmin || isDisposisi || isSelesai;

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      const existingParts = initialData.parts || [];
      const parts: PartItem[] = Array.from({ length: 10 }, (_, i) => {
        const found = existingParts.find(p => p.no === i + 1);
        return found || { no: i + 1, name: '', qty: '', note: '' };
      });
      setFormData({ ...initialData, parts });
      
      // Auto open execution tab if in Disposisi / Disetujui or Selesai status
      if (initialData.status === 'Disposisi' || (initialData.status as string) === 'Disetujui' || initialData.status === 'Selesai') {
        setActiveTab('execution');
      }
    } else {
      const today = new Date().toISOString().split('T')[0];
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const generatedJobOrder = `JO-PBD-${today.replace(/-/g, '')}-${randomSuffix}`;
      
      setFormData({
        id: crypto.randomUUID(),
        noJobOrder: generatedJobOrder,
        tglPermintaan: today,
        dilaporkanOleh: '',
        namaAlat: '',
        typeAlat: '',
        nomerAlat: '',
        lokasiAlat: '',
        kmHmSaatIni: '',
        keluhanUraian: '',
        diketahuiOleh: '',
        dimintaOleh: '',
        disposisiRencana: '',
        disposisiDibuatDiterimaOleh: '',
        tindakanPerbaikan: '',
        kmHmSelanjutnya: '',
        dikerjakanOleh: '',
        parts: Array.from({ length: 10 }, (_, i) => ({ no: i + 1, name: '', qty: '', note: '' })),
        diperiksaOleh: '',
        status: 'Permintaan',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'dilaporkanOleh' && !prev.dimintaOleh) {
        updated.dimintaOleh = value;
      }
      return updated;
    });
  };

  const handlePartChange = (index: number, field: keyof PartItem, value: string) => {
    setFormData(prev => {
      const updatedParts = [...prev.parts];
      updatedParts[index] = {
        ...updatedParts[index],
        [field]: value
      };
      return { ...prev, parts: updatedParts };
    });
  };

  const handleSubmit = (statusOverride?: 'Draft' | 'Permintaan' | 'Disposisi' | 'Selesai') => {
    let finalStatus = formData.status;

    if (statusOverride) {
      finalStatus = statusOverride;
    } else if (isNew || isDraft) {
      finalStatus = 'Permintaan'; // Submitting new request -> Permintaan
    } else if (isDisposisi && activeTab === 'execution') {
      finalStatus = 'Selesai'; // Submitting execution work -> Selesai
    }
    
    const finalData: RepairRequest = {
      ...formData,
      status: finalStatus,
      updatedAt: new Date().toISOString()
    };
    onSave(finalData);
  };

  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 shadow-md overflow-hidden" id="form-repair-editor">
      
      {/* Header Form */}
      <div className="px-6 py-4 bg-slate-800 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-4 border-blue-600">
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <h2 className="font-display text-lg font-bold tracking-tight">
              {initialData ? 'Formulir Perbaikan Equipment' : 'Permintaan Perbaikan Baru'}
            </h2>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
              isAdmin ? 'bg-amber-500 text-slate-950 font-mono' : 'bg-blue-600 text-white'
            }`}>
              {isAdmin ? 'Akses: Admin' : 'Akses: Pegawai'}
            </span>
          </div>
          <p className="text-xs text-slate-300 font-mono flex items-center gap-2">
            <span>Job Order: <strong className="text-white">{formData.noJobOrder}</strong></span>
            <span>•</span>
            <span>Status: <strong className="text-amber-300 uppercase">{formData.status}</strong></span>
          </p>
        </div>

        {/* Admin Quick Status Control */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {isAdmin && (
            <div className="flex items-center space-x-1 bg-slate-900/80 p-1.5 rounded-lg border border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase px-1">Status:</span>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded border border-slate-600 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="Permintaan">1. Diajukan (Permintaan)</option>
                <option value="Disposisi">2. Disetujui (Disposisi)</option>
                <option value="Selesai">3. Selesai (Diperbaiki)</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          )}

          <div className="flex gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={onCancel}
              className="px-3.5 py-1.5 text-xs font-bold bg-slate-900/40 hover:bg-slate-900/60 border border-slate-600 text-slate-100 rounded-lg transition cursor-pointer"
            >
              Batal
            </button>

            {/* Submit / Save Buttons based on role & active tab */}
            {canEditInitial && (
              <button
                type="button"
                onClick={() => handleSubmit('Draft')}
                className="px-3.5 py-1.5 text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition border border-slate-600 cursor-pointer"
              >
                Simpan Draft
              </button>
            )}

            {/* Admin Quick Approve / Disposisi if currently Permintaan */}
            {isAdmin && isPermintaan && (
              <button
                type="button"
                onClick={() => handleSubmit('Disposisi')}
                className="px-3.5 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition shadow-sm cursor-pointer border border-purple-500 flex items-center space-x-1"
                title="Setujui permohonan & buka akses perbaikan untuk pegawai"
              >
                <ShieldCheck size={14} />
                <span>Disetujui / Disposisi</span>
              </button>
            )}

            {/* Pegawai Action Buttons when in Execution Tab */}
            {!isAdmin && isDisposisi && activeTab === 'execution' ? (
              <>
                <button
                  type="button"
                  onClick={() => handleSubmit('Disposisi')}
                  className="px-3.5 py-1.5 text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition border border-slate-600 cursor-pointer flex items-center space-x-1.5"
                >
                  <Save size={14} />
                  <span>Simpan Progress</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit('Selesai')}
                  className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition shadow-sm cursor-pointer border border-emerald-500 flex items-center space-x-1.5"
                >
                  <CheckCircle size={14} />
                  <span>Selesai Perbaikan</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-sm cursor-pointer border border-blue-500 flex items-center space-x-1.5"
              >
                <Save size={14} />
                <span>
                  {isAdmin 
                    ? 'Simpan Perubahan' 
                    : (isNew || isDraft ? 'Ajukan Permintaan' : 'Simpan Form')}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b-2 border-slate-200 bg-slate-50">
        <button
          type="button"
          onClick={() => setActiveTab('request')}
          className={`flex-1 sm:flex-initial px-6 py-3.5 text-xs font-bold transition flex items-center justify-center space-x-2 border-b-2 cursor-pointer ${
            activeTab === 'request'
              ? 'border-blue-600 text-blue-700 bg-white font-display'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          id="tab-request-phase1"
        >
          <ClipboardList size={16} />
          <span>1. Permintaan & Disposisi</span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-md text-[10px] bg-blue-50 text-blue-700 font-bold border border-blue-200">
            TAHAP AWAL
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('execution')}
          className={`flex-1 sm:flex-initial px-6 py-3.5 text-xs font-bold transition flex items-center justify-center space-x-2 border-b-2 cursor-pointer ${
            activeTab === 'execution'
              ? 'border-blue-600 text-blue-700 bg-white font-display'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          id="tab-execution-phase2"
        >
          <PenTool size={16} />
          <span>2. Tindakan & Suku Cadang</span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-md text-[10px] bg-purple-50 text-purple-700 font-bold border border-purple-200">
            TAHAP LANJUTAN
          </span>
        </button>
      </div>

      {/* Form Content */}
      <div className="p-6">
        {/* Tab 1: PERMINTAAN & DISPOSISI */}
        {activeTab === 'request' && (
          <div className="space-y-6" id="form-phase-1-inputs">
            
            {/* Workflow Notice Banner */}
            {!canEditInitial && (
              <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl text-xs text-amber-900 flex items-center space-x-2.5">
                <Lock size={18} className="text-amber-600 shrink-0" />
                <p className="leading-relaxed">
                  <strong>Formulir Dikunci (Telah Diajukan):</strong> Pegawai tidak dapat mengubah isian awal permintaan perbaikan setelah diajukan. Hubungi Administrator jika perlu perbaikan data awal.
                </p>
              </div>
            )}

            {/* Metadata Ringkas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border-2 border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">No. Job Order</label>
                <input
                  type="text"
                  name="noJobOrder"
                  value={formData.noJobOrder}
                  onChange={handleInputChange}
                  disabled={!canEditInitial}
                  className="w-full text-xs px-3 py-2 border-2 border-slate-200 rounded-lg bg-white font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="Auto-generated"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tgl Permintaan Perbaikan</label>
                <input
                  type="date"
                  name="tglPermintaan"
                  value={formData.tglPermintaan}
                  onChange={handleInputChange}
                  disabled={!canEditInitial}
                  className="w-full text-xs px-3 py-2 border-2 border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dilaporkan Oleh</label>
                <input
                  type="text"
                  name="dilaporkanOleh"
                  value={formData.dilaporkanOleh}
                  onChange={handleInputChange}
                  disabled={!canEditInitial}
                  className="w-full text-xs px-3 py-2 border-2 border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="Nama pelapor..."
                  required
                />
              </div>
            </div>

            {/* Identitas Infrastruktur */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center space-x-1.5 font-display">
                <span className="w-1.5 h-3.5 bg-blue-600 rounded-sm" />
                <span>Identitas Infrastruktur</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">a. Nama Alat / Sarana</label>
                  <input
                    type="text"
                    name="namaAlat"
                    value={formData.namaAlat}
                    onChange={handleInputChange}
                    disabled={!canEditInitial}
                    className="w-full text-xs px-3 py-2 border-2 border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                    placeholder="Contoh: AC Aula, Mobil Dinas"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">b. Type / Model</label>
                  <input
                    type="text"
                    name="typeAlat"
                    value={formData.typeAlat}
                    onChange={handleInputChange}
                    disabled={!canEditInitial}
                    className="w-full text-xs px-3 py-2 border-2 border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                    placeholder="Contoh: Panasonic 1.5PK, Toyota Hilux"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">c. Nomer Serial / Inventaris</label>
                  <input
                    type="text"
                    name="nomerAlat"
                    value={formData.nomerAlat}
                    onChange={handleInputChange}
                    disabled={!canEditInitial}
                    className="w-full text-xs px-3 py-2 border-2 border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                    placeholder="Nomer seri / plat nomor"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">d. Lokasi Alat</label>
                  <input
                    type="text"
                    name="lokasiAlat"
                    value={formData.lokasiAlat}
                    onChange={handleInputChange}
                    disabled={!canEditInitial}
                    className="w-full text-xs px-3 py-2 border-2 border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                    placeholder="Contoh: Ruang Pelayanan, Garasi"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">e. Km / Hour Meter Saat Ini</label>
                  <input
                    type="text"
                    name="kmHmSaatIni"
                    value={formData.kmHmSaatIni}
                    onChange={handleInputChange}
                    disabled={!canEditInitial}
                    className="w-full text-xs px-3 py-2 border-2 border-slate-200 rounded-lg bg-white text-slate-800 font-mono focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                    placeholder="Contoh: 124.500 KM / 560 Jam"
                  />
                </div>
              </div>
            </div>

            {/* Keluhan / Kerusakan */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center space-x-1.5 font-display">
                <span className="w-1.5 h-3.5 bg-blue-600 rounded-sm" />
                <span>Keluhan / Uraian Kerusakan</span>
              </h3>
              <textarea
                name="keluhanUraian"
                value={formData.keluhanUraian}
                onChange={handleInputChange}
                disabled={!canEditInitial}
                rows={4}
                className="w-full text-xs p-3.5 border-2 border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 text-slate-850 leading-relaxed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="Deskripsikan keluhan, kegagalan fungsi, atau bagian yang rusak secara mendetail..."
                required
              />
            </div>

            {/* Otorisasi Awal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border-2 border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Diminta oleh (Pelapor)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User size={14} />
                  </span>
                  <input
                    type="text"
                    name="dimintaOleh"
                    value={formData.dimintaOleh}
                    onChange={handleInputChange}
                    disabled={!canEditInitial}
                    className="w-full text-xs pl-9 pr-3 py-2 border-2 border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                    placeholder="Nama Pegawai yang meminta"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Diketahui oleh (Atasan Langsung)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User size={14} />
                  </span>
                  <input
                    type="text"
                    name="diketahuiOleh"
                    value={formData.diketahuiOleh}
                    onChange={handleInputChange}
                    disabled={!canEditInitial}
                    className="w-full text-xs pl-9 pr-3 py-2 border-2 border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                    placeholder="Nama Atasan / Kasubag"
                  />
                </div>
              </div>
            </div>

            {/* Disposisi */}
            <div className="border-2 border-slate-200 p-4 rounded-xl bg-slate-50/50">
              <div className="flex items-center space-x-1.5 mb-3">
                <span className="w-1.5 h-3.5 bg-blue-600 rounded-sm" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-display">
                  Disposisi / Rencana Tindakan Perbaikan
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                  isAdmin ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-slate-200 text-slate-600 border-slate-300'
                }`}>
                  {isAdmin ? 'Otorisasi Admin / Kasubag / PPK' : 'Khusus Akses Admin'}
                </span>
              </div>
              <textarea
                name="disposisiRencana"
                value={formData.disposisiRencana}
                onChange={handleInputChange}
                disabled={!canEditDisposisi}
                rows={3}
                className="w-full text-xs p-3.5 border-2 border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 text-slate-850 leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                placeholder={isAdmin ? "Masukkan disposisi atau arahan tindakan perbaikan (misal: panggil teknisi luar, atau kerjakan internal)..." : "Bagian disposisi diisi khusus oleh Admin / Atasan."}
              />
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="max-w-md">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Disposisi Dibuat / Diterima Oleh :</label>
                  <input
                    type="text"
                    name="disposisiDibuatDiterimaOleh"
                    value={formData.disposisiDibuatDiterimaOleh}
                    onChange={handleInputChange}
                    disabled={!canEditDisposisi}
                    className="w-full text-xs px-3 py-2 border-2 border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                    placeholder="Nama Supervisor / Pejabat Pembuat Komitmen"
                  />
                </div>
              </div>
            </div>

            {/* Next Tab Prompt */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('execution');
                  // scroll editor to top smoothly
                  document.getElementById('form-repair-editor')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-bold transition flex items-center space-x-2 cursor-pointer border-2 border-blue-200"
              >
                <span>Lanjut ke Tindakan Perbaikan</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: TINDAKAN & SUKU CADANG */}
        {activeTab === 'execution' && (
          <div className="space-y-6" id="form-phase-2-inputs">
            
            {/* Info / Workflow Alert Box */}
            {!canEditExecution ? (
              <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl text-xs text-amber-900 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-display font-bold text-amber-950 text-sm mb-0.5">
                      Permohonan Menunggu Disetujui / Didisposisi
                    </p>
                    <p className="leading-relaxed">
                      Bagian Uraian Perbaikan dan Penggantian Part baru dapat diisi oleh Pegawai / Teknisi setelah permohonan ini <strong>DISETUJUI / DIDISPOSISI</strong> oleh Admin / Kasubag.
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleSubmit('Disposisi')}
                    className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition text-xs flex items-center space-x-1 cursor-pointer shadow-xs"
                  >
                    <ShieldCheck size={14} />
                    <span>Setujui Sekarang</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-display font-bold text-emerald-950 mb-0.5">
                    Akses Tindakan Perbaikan Terbuka (Status: {formData.status})
                  </p>
                  <p className="leading-relaxed">
                    Permohonan telah disetujui / didisposisi! Silakan isi rincian pengerjaan tindakan perbaikan serta suku cadang/spare part yang diganti di bawah ini.
                  </p>
                </div>
              </div>
            )}

            {/* Tindakan Perbaikan */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center space-x-1.5 font-display">
                <span className="w-1.5 h-3.5 bg-blue-600 rounded-sm" />
                <span>Uraian Tindakan Perbaikan</span>
              </h3>
              <textarea
                name="tindakanPerbaikan"
                value={formData.tindakanPerbaikan}
                onChange={handleInputChange}
                disabled={!canEditExecution}
                rows={4}
                className="w-full text-xs p-3.5 border-2 border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500 text-slate-850 leading-relaxed disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                placeholder={canEditExecution ? "Uraikan tindakan teknis yang telah dikerjakan untuk memperbaiki kerusakan..." : "Akses dikunci hingga status didisposisi oleh Admin."}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">f. Km / Hour Meter Selanjutnya (Setelah Perbaikan)</label>
                  <input
                    type="text"
                    name="kmHmSelanjutnya"
                    value={formData.kmHmSelanjutnya}
                    onChange={handleInputChange}
                    disabled={!canEditExecution}
                    className="w-full text-xs px-3 py-2 border-2 border-slate-200 rounded-lg bg-white text-slate-800 font-mono focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                    placeholder="Contoh: 124.520 KM / 565 Jam"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Dikerjakan oleh (Teknisi / Pihak Ketiga)</label>
                  <input
                    type="text"
                    name="dikerjakanOleh"
                    value={formData.dikerjakanOleh}
                    onChange={handleInputChange}
                    disabled={!canEditExecution}
                    className="w-full text-xs px-3 py-2 border-2 border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                    placeholder="Nama Teknisi pelaksana"
                  />
                </div>
              </div>
            </div>

            {/* Uraian Penggantian Part */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 font-display">
                  <span className="w-1.5 h-3.5 bg-blue-600 rounded-sm" />
                  <span>Uraian Perbaikan / Penggantian Part (Maks. 10 Item)</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Format SNI ISO FT.PBD.7.1.3.2.4</span>
              </div>

              <div className="overflow-x-auto rounded-lg border-2 border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800 text-white font-bold uppercase tracking-wider font-display border-b-2 border-slate-900">
                    <tr>
                      <th className="py-2.5 px-3 w-[8%] text-center border-r border-slate-700">No</th>
                      <th className="py-2.5 px-3 w-[55%] border-r border-slate-700">Uraian / Nama Part</th>
                      <th className="py-2.5 px-3 w-[15%] text-center border-r border-slate-700">Jumlah</th>
                      <th className="py-2.5 px-3 w-[22%]">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-slate-100">
                    {formData.parts.map((part, index) => (
                      <tr key={part.no} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-400 border-r border-slate-100">{part.no}</td>
                        <td className="py-1 px-2 border-r border-slate-100">
                          <input
                            type="text"
                            value={part.name}
                            onChange={(e) => handlePartChange(index, 'name', e.target.value)}
                            disabled={!canEditExecution}
                            className="w-full text-xs px-2.5 py-1.5 bg-slate-50/50 hover:bg-white focus:bg-white border-2 border-transparent hover:border-slate-200 focus:border-blue-500 rounded-lg focus:outline-none transition text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                            placeholder="Nama suku cadang..."
                          />
                        </td>
                        <td className="py-1 px-2 border-r border-slate-100">
                          <input
                            type="text"
                            value={part.qty}
                            onChange={(e) => handlePartChange(index, 'qty', e.target.value)}
                            disabled={!canEditExecution}
                            className="w-[80px] mx-auto text-center text-xs px-2 py-1.5 bg-slate-50/50 hover:bg-white focus:bg-white border-2 border-transparent hover:border-slate-200 focus:border-blue-500 rounded-lg focus:outline-none transition font-mono text-slate-800 font-bold disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                            placeholder="Qty"
                          />
                        </td>
                        <td className="py-1 px-2">
                          <input
                            type="text"
                            value={part.note}
                            onChange={(e) => handlePartChange(index, 'note', e.target.value)}
                            disabled={!canEditExecution}
                            className="w-full text-xs px-2.5 py-1.5 bg-slate-50/50 hover:bg-white focus:bg-white border-2 border-transparent hover:border-slate-200 focus:border-blue-500 rounded-lg focus:outline-none transition text-slate-800 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                            placeholder="Catatan..."
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pemeriksa Akhir */}
            <div className="bg-slate-50 p-4 rounded-xl border-2 border-slate-200 max-w-md">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Diperiksa Oleh :</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-450">
                  <User size={14} />
                </span>
                <input
                  type="text"
                  name="diperiksaOleh"
                  value={formData.diperiksaOleh}
                  onChange={handleInputChange}
                  disabled={!canEditExecution}
                  className="w-full text-xs pl-9 pr-3 py-2.5 border-2 border-slate-200 rounded-lg bg-white text-slate-850 focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                  placeholder="Nama Pemeriksa / Pejabat Pembuat Komitmen"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">
                Pastikan pengerjaan telah dikonfirmasikan sebelum diajukan ke pemeriksa.
              </p>
            </div>
          </div>
        )}

        {/* Footer controls inside the card */}
        <div className="mt-8 pt-4 border-t-2 border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
          <div className="text-xs text-slate-400 flex items-center font-mono">
            <span>Terakhir diperbarui: {formData.updatedAt ? new Date(formData.updatedAt).toLocaleString('id-ID') : 'Belum pernah'}</span>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 sm:flex-initial px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 border-2 border-slate-200 rounded-lg transition cursor-pointer"
            >
              Kembali
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('Draft')}
              className="flex-1 sm:flex-initial px-5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition border-2 border-slate-200 cursor-pointer"
            >
              Simpan Draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="flex-1 sm:flex-initial px-6 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-sm hover:shadow flex items-center justify-center space-x-1.5 cursor-pointer border-2 border-blue-500"
            >
              <Save size={14} />
              <span>{activeTab === 'execution' ? 'Selesaikan & Kirim' : 'Kirim Permintaan'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
