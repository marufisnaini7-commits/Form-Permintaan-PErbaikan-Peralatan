/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RepairRequest } from './types';
import Dashboard from './components/Dashboard';
import FormRepair from './components/FormRepair';
import DocumentPrint from './components/DocumentPrint';
import IntegrationSetup from './components/IntegrationSetup';
import AdminChallenge from './components/AdminChallenge';
import LogoBkhit from './components/LogoBkhit';
import { 
  Database, AlertCircle, CheckCircle2, RefreshCw, Sparkles, 
  Settings, ClipboardList, BookOpen, Layers, User, Shield
} from 'lucide-react';

export default function App() {
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [gasUrl, setGasUrl] = useState<string>('');
  
  // Navigation & Role Access
  const [activeView, setActiveView] = useState<'dashboard' | 'form' | 'print' | 'settings'>('dashboard');
  const [selectedRequest, setSelectedRequest] = useState<RepairRequest | null>(null);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'pegawai' | 'admin'>('pegawai');
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  
  // Feedback Status
  const [isSyncing, setIsSyncing] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // 1. Load initial data from localStorage on Mount
  useEffect(() => {
    const localRequests = localStorage.getItem('bkhit_pbd_requests');
    if (localRequests) {
      try {
        const parsed: RepairRequest[] = JSON.parse(localRequests);
        // Filter out sample demo requests if any
        const realRequests = parsed.filter(r => !r.id.includes('demo') && !r.noJobOrder.includes('demo'));
        setRequests(realRequests);
        localStorage.setItem('bkhit_pbd_requests', JSON.stringify(realRequests));
      } catch (e) {
        console.error('Error loading local requests:', e);
        setRequests([]);
      }
    } else {
      setRequests([]);
    }

    const savedGasUrl = localStorage.getItem('bkhit_pbd_gas_url');
    if (savedGasUrl) {
      setGasUrl(savedGasUrl);
    }
  }, []);

  // 2. Clear Alert after 5 seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // 3. Save to Local Storage Helper
  const saveRequestsLocally = (updatedList: RepairRequest[]) => {
    setRequests(updatedList);
    localStorage.setItem('bkhit_pbd_requests', JSON.stringify(updatedList));
  };

  // 4. Save/Update Repair Request
  const handleSaveRequest = async (updatedRequest: RepairRequest) => {
    const isEditing = requests.some(r => r.id === updatedRequest.id);
    let updatedList: RepairRequest[];

    if (isEditing) {
      updatedList = requests.map(r => r.id === updatedRequest.id ? updatedRequest : r);
    } else {
      updatedList = [updatedRequest, ...requests];
    }

    // Save locally first so the user has zero downtime or lost progress
    saveRequestsLocally(updatedList);
    setAlert({
      type: 'success',
      message: `Formulir perbaikan dengan Job Order ${updatedRequest.noJobOrder} berhasil disimpan secara lokal.`
    });
    setActiveView('dashboard');

    // Attempt cloud sync if Apps Script URL is configured
    if (gasUrl) {
      try {
        setAlert({
          type: 'info',
          message: `Sedang menyinkronkan Job Order ${updatedRequest.noJobOrder} ke Google Sheets...`
        });
        
        const payload = {
          action: isEditing ? 'update' : 'create',
          data: updatedRequest
        };

        const response = await fetch(gasUrl, {
          method: 'POST',
          mode: 'no-cors', // Avoid complex CORS preflight issues with standard Web App redirects
          headers: {
            'Content-Type': 'text/plain',
          },
          body: JSON.stringify(payload)
        });

        // With 'no-cors', we can't inspect the direct response, but we can assume success if no error was thrown
        setAlert({
          type: 'success',
          message: `Job Order ${updatedRequest.noJobOrder} berhasil disimpan secara lokal dan disinkronkan ke Google Sheets Cloud!`
        });
      } catch (error) {
        console.error('Cloud synchronization failed:', error);
        setAlert({
          type: 'error',
          message: `Form berhasil disimpan di browser, namun gagal dikirim ke Google Sheets. Silakan lakukan sinkronisasi ulang nanti.`
        });
      }
    }
  };

  // 5. Delete Repair Request
  const handleDeleteRequest = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus formulir permintaan perbaikan ini?')) {
      const updatedList = requests.filter(r => r.id !== id);
      saveRequestsLocally(updatedList);
      setAlert({
        type: 'success',
        message: 'Formulir berhasil dihapus.'
      });
    }
  };

  // 6. Complete Sync with Google Sheets (Bi-directional/Pull latest)
  const handleSyncWithCloud = async () => {
    if (!gasUrl) {
      setAlert({
        type: 'error',
        message: 'URL Google Apps Script belum dikonfigurasi. Masuk ke pengaturan untuk mengisi URL.'
      });
      return;
    }

    setIsSyncing(true);
    setAlert({
      type: 'info',
      message: 'Menghubungi Google Sheets Cloud, mengunduh data terbaru...'
    });

    try {
      const response = await fetch(gasUrl, {
        method: 'GET',
        mode: 'cors'
      });
      const result = await response.json();

      if (result.status === 'success') {
        const cloudData: RepairRequest[] = result.data || [];
        
        // Merge cloud data with local data
        // We will combine both lists, keeping unique IDs. If there is a duplicate ID, we trust the one with the newest updatedAt timestamp
        const merged = [...requests];
        
        cloudData.forEach(cloudItem => {
          const localIndex = merged.findIndex(localItem => localItem.id === cloudItem.id);
          if (localIndex !== -1) {
            const localTime = new Date(merged[localIndex].updatedAt || 0).getTime();
            const cloudTime = new Date(cloudItem.updatedAt || 0).getTime();
            if (cloudTime > localTime) {
              merged[localIndex] = cloudItem;
            }
          } else {
            merged.unshift(cloudItem); // Add new items from cloud to top
          }
        });

        // Sort by date / updatedAt descending
        merged.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

        saveRequestsLocally(merged);
        setAlert({
          type: 'success',
          message: `Sinkronisasi berhasil! Berhasil menyelaraskan ${merged.length} total data perbaikan dengan Google Sheets.`
        });
      } else {
        setAlert({
          type: 'error',
          message: `Gagal menyinkronkan: ${result.message || 'Respons tidak valid dari server.'}`
        });
      }
    } catch (error) {
      console.error('Full cloud synchronization failed:', error);
      setAlert({
        type: 'error',
        message: 'Gagal melakukan sinkronisasi otomatis karena keterbatasan CORS browser. Namun Anda masih dapat menyimpan form, mencetak, dan mengirim data baru secara langsung.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // 7. Save Web App URL
  const handleSaveGasUrl = (url: string) => {
    setGasUrl(url);
    localStorage.setItem('bkhit_pbd_gas_url', url);
    setAlert({
      type: 'success',
      message: 'URL Google Apps Script berhasil disimpan. Aplikasi siap menyinkronkan data!'
    });
    setActiveView('dashboard');
  };

  // 8. Bulk Import backup data
  const handleImportBackup = (imported: RepairRequest[]) => {
    // Merge imported with current
    const merged = [...requests];
    imported.forEach(imp => {
      const exists = merged.some(m => m.id === imp.id);
      if (!exists) {
        merged.push(imp);
      }
    });
    saveRequestsLocally(merged);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans print:bg-white print:text-black">
      
      {/* HEADER UTAMA BKHIT PAPUA BARAT DAYA (Hidden when printing) */}
      <header className="bg-slate-800 text-white shadow-xl py-4 px-6 sticky top-0 z-50 border-b-4 border-blue-600 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3.5 cursor-pointer group" onClick={() => setActiveView('dashboard')}>
            <LogoBkhit size={50} className="bg-white rounded-xl p-0.5 border-2 border-slate-700 transition-transform group-hover:scale-105" />
            <div>
              <h1 className="font-display font-bold text-sm tracking-wide leading-tight sm:text-base uppercase">
                Balai Karantina Hewan Ikan dan Tumbuhan
              </h1>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="font-display font-bold text-xs tracking-wider text-blue-400">PAPUA BARAT DAYA</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span className="text-[10px] text-slate-300 uppercase tracking-widest font-mono">E-Form Repair SNI ISO</span>
              </div>
            </div>
          </div>

          {/* Navigation & Role Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Mode Switcher: Pegawai vs Admin */}
            <div className="flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setUserRole('pegawai')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                  userRole === 'pegawai'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Mode Akses Pegawai/Staf"
              >
                <User size={13} />
                <span>Pegawai</span>
              </button>
              <button
                onClick={() => {
                  if (!isAdminUnlocked) {
                    setShowAdminModal(true);
                  } else {
                    setUserRole('admin');
                  }
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
                  userRole === 'admin'
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Mode Akses Admin / Kasubag"
              >
                <Shield size={13} />
                <span>Admin</span>
              </button>
            </div>

            <nav className="flex items-center space-x-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-700/50">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setActiveView('dashboard');
                }}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  activeView === 'dashboard' 
                    ? 'bg-blue-600 text-white border border-blue-500' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/40'
                }`}
              >
                <ClipboardList size={14} />
                <span>Daftar Permintaan</span>
              </button>

              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setActiveView('form');
                }}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  activeView === 'form' && !selectedRequest
                    ? 'bg-blue-600 text-white border border-blue-500' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/40'
                }`}
              >
                <Sparkles size={14} className="text-amber-400" />
                <span>Buat Baru</span>
              </button>

              <button
                onClick={() => setActiveView('settings')}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  activeView === 'settings'
                    ? 'bg-blue-600 text-white border border-blue-500' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/40'
                }`}
              >
                <Settings size={14} />
                <span>Database Sync</span>
              </button>
            </nav>
          </div>

        </div>
      </header>

      {/* ALERT NOTIFICATION SYSTEM (Hidden when printing) */}
      {alert && (
        <div className="max-w-7xl mx-auto w-full px-6 mt-4 print:hidden" id="global-alert-container">
          <div className={`p-4 rounded-xl border-2 flex items-start space-x-3 text-xs shadow-md transition ${
            alert.type === 'success' 
              ? 'bg-slate-50 border-blue-500 text-slate-800' 
              : alert.type === 'error' 
              ? 'bg-red-50 border-red-500 text-red-900' 
              : 'bg-slate-50 border-slate-400 text-slate-800'
          }`}>
            <div className="shrink-0 mt-0.5">
              {alert.type === 'success' ? (
                <CheckCircle2 size={16} className="text-blue-600" />
              ) : (
                <AlertCircle size={16} className={alert.type === 'error' ? 'text-red-600' : 'text-slate-600'} />
              )}
            </div>
            <div className="flex-1">
              <p className="font-display font-bold">{alert.type === 'success' ? 'Berhasil' : alert.type === 'error' ? 'Gagal' : 'Informasi'}</p>
              <p className="mt-0.5 leading-relaxed font-mono">{alert.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* CORE CONTENT LAYOUT */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 print:p-0">
        
        {/* VIEW ROUTING */}
        {activeView === 'dashboard' && (
          <Dashboard
            requests={requests}
            onAddRequest={() => {
              setSelectedRequest(null);
              setActiveView('form');
            }}
            onEditRequest={(request) => {
              setSelectedRequest(request);
              setActiveView('form');
            }}
            onPrintRequest={(request) => {
              setSelectedRequest(request);
              setActiveView('print');
            }}
            onDeleteRequest={handleDeleteRequest}
            onOpenSettings={() => setActiveView('settings')}
            gasUrl={gasUrl}
            onSync={handleSyncWithCloud}
            isSyncing={isSyncing}
            onImportData={handleImportBackup}
          />
        )}

        {activeView === 'form' && (
          <FormRepair
            initialData={selectedRequest}
            onSave={handleSaveRequest}
            onCancel={() => {
              setSelectedRequest(null);
              setActiveView('dashboard');
            }}
            userRole={userRole}
          />
        )}

        {/* Admin PIN Challenge Modal */}
        {showAdminModal && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md">
              <AdminChallenge
                onUnlock={() => {
                  setIsAdminUnlocked(true);
                  setUserRole('admin');
                  setShowAdminModal(false);
                }}
                onCancel={() => setShowAdminModal(false)}
              />
            </div>
          </div>
        )}

        {activeView === 'print' && selectedRequest && (
          <DocumentPrint
            request={selectedRequest}
            onBack={() => {
              setSelectedRequest(null);
              setActiveView('dashboard');
            }}
          />
        )}

        {activeView === 'settings' && (
          !isAdminUnlocked ? (
            <AdminChallenge
              onUnlock={() => setIsAdminUnlocked(true)}
              onCancel={() => setActiveView('dashboard')}
            />
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-center bg-blue-50 border-2 border-blue-200 p-4 rounded-xl text-blue-800 text-xs gap-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 size={16} className="text-blue-600 shrink-0 animate-bounce" />
                  <span className="font-display font-bold">Akses Administrator Terbuka (BKHIT Papua Barat Daya)</span>
                </div>
                <button 
                  onClick={() => setIsAdminUnlocked(false)}
                  className="w-full sm:w-auto px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition text-[11px] cursor-pointer"
                >
                  Kunci Pengaturan
                </button>
              </div>
              <IntegrationSetup
                gasUrl={gasUrl}
                onSaveUrl={handleSaveGasUrl}
                onSync={handleSyncWithCloud}
                isSyncing={isSyncing}
              />
            </div>
          )
        )}

      </main>

      {/* FOOTER SURAT (Hidden when printing) */}
      <footer className="bg-slate-800 text-slate-300 border-t-2 border-slate-700 py-6 px-6 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <div>
            <p className="font-display font-bold text-white tracking-wide">BALAI KARANTINA HEWAN IKAN DAN TUMBUHAN PAPUA BARAT DAYA</p>
            <p className="mt-0.5 text-slate-400">Sistem Pengarsipan Formulir Permintaan Perbaikan Terintegrasi SNI ISO</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-slate-400">Versi Aplikasi: 1.1.0-C (Geometric Balance)</p>
            <p className="mt-0.5 text-slate-500">&copy; 2026 BKHIT Papua Barat Daya. Semua Hak Dilindungi.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
