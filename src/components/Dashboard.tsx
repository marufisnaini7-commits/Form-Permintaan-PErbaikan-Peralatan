/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RepairRequest } from '../types';
import { 
  Search, Plus, Printer, Edit, Trash2, Calendar, User, MapPin, 
  CheckCircle, Clock, AlertTriangle, FileText, Database, 
  Upload, Download, HelpCircle, FileCheck2, Filter
} from 'lucide-react';

interface DashboardProps {
  requests: RepairRequest[];
  onAddRequest: () => void;
  onEditRequest: (request: RepairRequest) => void;
  onPrintRequest: (request: RepairRequest) => void;
  onDeleteRequest: (id: string) => void;
  onOpenSettings: () => void;
  gasUrl: string;
  onSync: () => Promise<void>;
  isSyncing: boolean;
  onImportData: (data: RepairRequest[]) => void;
}

export default function Dashboard({
  requests,
  onAddRequest,
  onEditRequest,
  onPrintRequest,
  onDeleteRequest,
  onOpenSettings,
  gasUrl,
  onSync,
  isSyncing,
  onImportData,
}: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showBackupInfo, setShowBackupInfo] = useState(false);

  // Filter requests
  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      (req.noJobOrder || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.namaAlat || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.dilaporkanOleh || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.lokasiAlat || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-slate-100 text-slate-600 border-2 border-slate-300">
            <Clock size={11} />
            <span>DRAFT</span>
          </span>
        );
      case 'Permintaan':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-amber-50 text-amber-700 border-2 border-amber-300">
            <FileText size={11} />
            <span>PERMINTAAN</span>
          </span>
        );
      case 'Disposisi':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-purple-50 text-purple-700 border-2 border-purple-300">
            <AlertTriangle size={11} />
            <span>DISPOSISI</span>
          </span>
        );
      case 'Selesai':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border-2 border-blue-300">
            <CheckCircle size={11} />
            <span>SELESAI</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-slate-50 text-slate-700 border-2 border-slate-300">
            <span>{status.toUpperCase()}</span>
          </span>
        );
    }
  };

  const handleExport = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(requests, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `bkhit_pbd_repair_requests_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onImportData(parsed);
            alert(`Berhasil mengimpor ${parsed.length} data permintaan.`);
          } else {
            alert('Format file tidak valid. Harus berupa file JSON array.');
          }
        } catch (error) {
          alert('Terjadi kesalahan saat membaca file JSON.');
        }
      };
    }
  };

  const formatDateString = (isoString: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Permintaan</p>
            <p className="text-2xl font-bold text-slate-800 mt-1 font-mono">{requests.length}</p>
          </div>
          <div className="p-3 bg-slate-100 rounded-lg text-slate-600 border border-slate-200">
            <FileText size={20} id="stat-total-icon" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Baru / Diajukan</p>
            <p className="text-2xl font-bold text-blue-600 mt-1 font-mono">
              {requests.filter(r => r.status === 'Permintaan').length}
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600 border border-blue-200">
            <Clock size={20} id="stat-pending-icon" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dalam Disposisi</p>
            <p className="text-2xl font-bold text-purple-600 mt-1 font-mono">
              {requests.filter(r => r.status === 'Disposisi').length}
            </p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600 border border-purple-200">
            <AlertTriangle size={20} id="stat-disposition-icon" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border-2 border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Selesai Diperbaiki</p>
            <p className="text-2xl font-bold text-slate-700 mt-1 font-mono">
              {requests.filter(r => r.status === 'Selesai').length}
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg text-slate-700 border border-slate-300">
            <FileCheck2 size={20} id="stat-completed-icon" />
          </div>
        </div>
      </div>

      {/* Control Panel (Search, Filter, Actions) */}
      <div className="bg-white p-5 rounded-xl border-2 border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:bg-white transition"
              placeholder="Cari No Job Order, nama alat, pelapor, lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Quick Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center space-x-1 bg-slate-100 border-2 border-slate-200 rounded-xl p-1">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  statusFilter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setStatusFilter('Draft')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  statusFilter === 'Draft' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Draft
              </button>
              <button
                onClick={() => setStatusFilter('Permintaan')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  statusFilter === 'Permintaan' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Diajukan
              </button>
              <button
                onClick={() => setStatusFilter('Selesai')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  statusFilter === 'Selesai' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Selesai
              </button>
            </div>

            {/* Sync trigger */}
            {gasUrl && (
              <button
                onClick={onSync}
                disabled={isSyncing}
                className="p-2.5 bg-slate-50 hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-800 rounded-xl transition cursor-pointer flex items-center space-x-1.5"
                title="Sinkronisasi Google Sheets"
                id="btn-sync-dashboard"
              >
                <Database size={15} className={isSyncing ? 'animate-spin text-blue-600' : ''} />
                <span className="text-xs font-semibold hidden sm:inline">Sync</span>
              </button>
            )}

            {/* Config Button */}
            <button
              onClick={onOpenSettings}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 text-slate-700 rounded-xl transition cursor-pointer flex items-center space-x-1.5"
              title="Konfigurasi Integrasi"
              id="btn-config-integration-dashboard"
            >
              <Database size={15} className="text-blue-600" />
              <span className="text-xs font-semibold hidden sm:inline">Database</span>
            </button>

            {/* Create Button */}
            <button
              onClick={onAddRequest}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md hover:shadow-lg flex items-center space-x-1.5 cursor-pointer border-2 border-blue-500"
              id="btn-create-request-dashboard"
            >
              <Plus size={15} />
              <span>Buat Permintaan</span>
            </button>
          </div>

        </div>

        {/* Backup / Restore bar */}
        <div className="pt-2 border-t-2 border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-blue-400 animate-pulse" />
            <span className="font-medium">Penyimpanan: {gasUrl ? 'Google Sheets Cloud' : 'Browser Lokal (Offline)'}</span>
          </div>
          
          <div className="flex items-center space-x-3 font-semibold">
            <button
              onClick={handleExport}
              className="hover:text-blue-600 transition flex items-center space-x-1 cursor-pointer"
              title="Download backup file"
            >
              <Download size={13} />
              <span>Ekspor Backup</span>
            </button>
            <label className="hover:text-blue-600 transition flex items-center space-x-1 cursor-pointer">
              <Upload size={13} />
              <span>Impor Backup</span>
              <input
                 type="file"
                 accept=".json"
                 onChange={handleImport}
                 className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Grid List of Job Orders */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white border-2 border-slate-200 rounded-xl p-12 text-center max-w-xl mx-auto shadow-md" id="empty-dashboard-container">
          <FileText className="mx-auto text-slate-300 mb-4" size={56} />
          <h3 className="font-display font-bold text-slate-800 text-base mb-1.5">Tidak Ada Data Permintaan</h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            Saat ini belum ada formulir permintaan perbaikan peralatan yang sesuai dengan kriteria pencarian atau filter Anda.
          </p>
          <button
            onClick={onAddRequest}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition inline-flex items-center space-x-2 cursor-pointer border-2 border-blue-500 shadow-sm"
          >
            <Plus size={14} />
            <span>Mulai Buat Formulir</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="request-cards-grid">
          {filteredRequests.map((req) => (
            <div 
              key={req.id} 
              className="bg-white border-2 border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-blue-500 transition-all flex flex-col justify-between group h-full relative"
              id={`request-card-${req.id}`}
            >
              {/* Card Top */}
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                    {req.noJobOrder}
                  </span>
                  {getStatusBadge(req.status)}
                </div>

                <h3 className="font-display font-bold text-slate-800 text-sm group-hover:text-blue-600 transition line-clamp-1">
                  {req.namaAlat || 'Nama Alat Tidak Diisi'}
                </h3>
                
                <div className="mt-2.5 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <User size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">Pelapor: <span className="font-semibold">{req.dilaporkanOleh || '-'}</span></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar size={13} className="text-slate-400 shrink-0" />
                    <span>Tgl: {formatDateString(req.tglPermintaan)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">Lokasi: {req.lokasiAlat || '-'}</span>
                  </div>
                </div>

                {/* Keluhan preview */}
                <div className="mt-3.5 pt-3.5 border-t border-slate-100">
                  <p className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider mb-1">Keluhan / Kerusakan:</p>
                  <p className="text-xs text-slate-700 line-clamp-2 italic leading-relaxed font-sans bg-slate-50 p-2 rounded border border-slate-100">
                    "{req.keluhanUraian || 'Tidak ada deskripsi keluhan.'}"
                  </p>
                </div>
              </div>

              {/* Card Bottom / Action Buttons */}
              <div className="mt-6 pt-4 border-t-2 border-slate-100 flex items-center justify-between gap-1">
                <button
                  onClick={() => onDeleteRequest(req.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer border border-transparent hover:border-red-100"
                  title="Hapus Permintaan"
                  id={`btn-delete-request-${req.id}`}
                >
                  <Trash2 size={15} />
                </button>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => onEditRequest(req)}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1"
                    title="Edit/Isi Tindakan"
                    id={`btn-edit-request-${req.id}`}
                  >
                    <Edit size={13} />
                    <span>Ubah / Isi</span>
                  </button>

                  <button
                    onClick={() => onPrintRequest(req)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 text-blue-800 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1"
                    title="Print / Cetak Formulir"
                    id={`btn-print-request-${req.id}`}
                  >
                    <Printer size={13} />
                    <span>Print</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
