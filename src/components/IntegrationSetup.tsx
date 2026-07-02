/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, Copy, Check, ExternalLink, Settings, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface IntegrationSetupProps {
  gasUrl: string;
  onSaveUrl: (url: string) => void;
  onSync: () => Promise<void>;
  isSyncing: boolean;
}

export default function IntegrationSetup({
  gasUrl,
  onSaveUrl,
  onSync,
  isSyncing,
}: IntegrationSetupProps) {
  const [urlInput, setUrlInput] = useState(gasUrl);
  const [copied, setCopied] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const scriptCode = `// =========================================================================
// GOOGLE APPS SCRIPT FOR BKHIT PAPUA BARAT DAYA REPAIR FORM INTEGRATION
// =========================================================================
// Petunjuk Penggunaan:
// 1. Buka Google Sheets baru atau yang sudah ada.
// 2. Klik menu "Ekstensi" -> "Apps Script".
// 3. Hapus kode default, lalu paste seluruh kode di bawah ini.
// 4. Klik ikon Save (Disket).
// 5. Jalankan fungsi "setupSheet" sekali untuk membuat struktur sheet otomatis.
// 6. Klik "Terapkan" (Deploy) -> "Penerapan Baru" (New Deployment).
// 7. Pilih tipe: "Aplikasi Web" (Web App).
// 8. Atur:
//    - Terapkan sebagai: "Saya" (Your email).
//    - Siapa yang memiliki akses: "Siapa saja" (Anyone).
// 9. Salin URL Aplikasi Web yang diberikan, lalu paste ke formulir konfigurasi aplikasi ini.

var SHEET_NAME = "PerbaikanAlat";

function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    var headers = [
      "ID", "No Job Order", "Tgl Permintaan", "Dilaporkan Oleh",
      "Nama Alat", "Type Alat", "Nomer Alat", "Lokasi Alat", "Km Hm Saat Ini",
      "Keluhan Uraian", "Diketahui Oleh", "Diminta Oleh",
      "Disposisi Rencana", "Disposisi Dibuat Diterima Oleh",
      "Tindakan Perbaikan", "Km Hm Selanjutnya", "Dikerjakan Oleh",
      "Parts JSON", "Diperiksa Oleh", "Status", "Created At", "Updated At"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#dcfce7");
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      setupSheet();
      sheet = ss.getSheetByName(SHEET_NAME);
    }
    
    var data = JSON.parse(e.postData.contents);
    var action = data.action; // 'create' atau 'update'
    var item = data.data;
    
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    if (action === 'create' || !item.id) {
      var rowData = [];
      var newId = item.id || ("JO-" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd") + "-" + Math.floor(Math.random() * 1000));
      item.id = newId;
      
      for (var i = 0; i < headers.length; i++) {
        var header = headers[i];
        rowData.push(getFieldValueByHeader(item, header));
      }
      sheet.appendRow(rowData);
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Data berhasil disimpan ke Google Sheet", data: item }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      var idColIndex = headers.indexOf("ID") + 1;
      var lastRow = sheet.getLastRow();
      var rowIndex = -1;
      
      if (lastRow > 1) {
        var idRange = sheet.getRange(2, idColIndex, lastRow - 1, 1).getValues();
        for (var r = 0; r < idRange.length; r++) {
          if (idRange[r][0].toString() === item.id.toString()) {
            rowIndex = r + 2;
            break;
          }
        }
      }
      
      if (rowIndex !== -1) {
        for (var i = 0; i < headers.length; i++) {
          var header = headers[i];
          var colIndex = i + 1;
          sheet.getRange(rowIndex, colIndex).setValue(getFieldValueByHeader(item, header));
        }
        return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Data berhasil diperbarui di Google Sheet", data: item }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        var rowData = [];
        for (var i = 0; i < headers.length; i++) {
          var header = headers[i];
          rowData.push(getFieldValueByHeader(item, header));
        }
        sheet.appendRow(rowData);
        return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Data tidak ditemukan, baris baru ditambahkan", data: item }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      setupSheet();
      sheet = ss.getSheetByName(SHEET_NAME);
    }
    
    // Check if test parameter is passed
    if (e.parameter.test === '1') {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Koneksi Apps Script Berhasil Terhubung!" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var rowsRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    var list = [];
    
    for (var r = 0; r < rowsRange.length; r++) {
      var row = rowsRange[r];
      var item = {};
      for (var c = 0; c < headers.length; c++) {
        var header = headers[c];
        item[getFieldKeyByHeader(header)] = row[c];
      }
      
      if (item.parts && typeof item.parts === "string" && item.parts.trim() !== "") {
        try {
          item.parts = JSON.parse(item.parts);
        } catch(err) {
          item.parts = createDefaultParts();
        }
      } else {
        item.parts = createDefaultParts();
      }
      list.push(item);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: list }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getFieldValueByHeader(item, header) {
  switch (header) {
    case "ID": return item.id || "";
    case "No Job Order": return item.noJobOrder || "";
    case "Tgl Permintaan": return item.tglPermintaan || "";
    case "Dilaporkan Oleh": return item.dilaporkanOleh || "";
    case "Nama Alat": return item.namaAlat || "";
    case "Type Alat": return item.typeAlat || "";
    case "Nomer Alat": return item.nomerAlat || "";
    case "Lokasi Alat": return item.lokasiAlat || "";
    case "Km Hm Saat Ini": return item.kmHmSaatIni || "";
    case "Keluhan Uraian": return item.keluhanUraian || "";
    case "Diketahui Oleh": return item.diketahuiOleh || "";
    case "Diminta Oleh": return item.dimintaOleh || "";
    case "Disposisi Rencana": return item.disposisiRencana || "";
    case "Disposisi Dibuat Diterima Oleh": return item.disposisiDibuatDiterimaOleh || "";
    case "Tindakan Perbaikan": return item.tindakanPerbaikan || "";
    case "Km Hm Selanjutnya": return item.kmHmSelanjutnya || "";
    case "Dikerjakan Oleh": return item.dikerjakanOleh || "";
    case "Parts JSON": return item.parts ? JSON.stringify(item.parts) : "[]";
    case "Diperiksa Oleh": return item.diperiksaOleh || "";
    case "Status": return item.status || "Draft";
    case "Created At": return item.createdAt || new Date().toISOString();
    case "Updated At": return item.updatedAt || new Date().toISOString();
    default: return "";
  }
}

function getFieldKeyByHeader(header) {
  switch (header) {
    case "ID": return "id";
    case "No Job Order": return "noJobOrder";
    case "Tgl Permintaan": return "tglPermintaan";
    case "Dilaporkan Oleh": return "dilaporkanOleh";
    case "Nama Alat": return "namaAlat";
    case "Type Alat": return "typeAlat";
    case "Nomer Alat": return "nomerAlat";
    case "Lokasi Alat": return "lokasiAlat";
    case "Km Hm Saat Ini": return "kmHmSaatIni";
    case "Keluhan Uraian": return "keluhanUraian";
    case "Diketahui Oleh": return "diketahuiOleh";
    case "Diminta Oleh": return "dimintaOleh";
    case "Disposisi Rencana": return "disposisiRencana";
    case "Disposisi Dibuat Diterima Oleh": return "disposisiDibuatDiterimaOleh";
    case "Tindakan Perbaikan": return "tindakanPerbaikan";
    case "Km Hm Selanjutnya": return "kmHmSelanjutnya";
    case "Dikerjakan Oleh": return "dikerjakanOleh";
    case "Parts JSON": return "parts";
    case "Diperiksa Oleh": return "diperiksaOleh";
    case "Status": return "status";
    case "Created At": return "createdAt";
    case "Updated At": return "updatedAt";
    default: return header.replace(/\\s+/g, "");
  }
}

function createDefaultParts() {
  var arr = [];
  for (var i = 1; i <= 10; i++) {
    arr.push({ no: i, name: "", qty: "", note: "" });
  }
  return arr;
}
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveUrl(urlInput);
  };

  const handleTestConnection = async () => {
    if (!urlInput) {
      setTestStatus('error');
      setTestMessage('Tolong masukkan URL Google Apps Script Web App terlebih dahulu.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Menghubungi Web App...');

    try {
      // Append parameter test=1 to avoid loading full list
      const testUrl = `${urlInput}${urlInput.includes('?') ? '&' : '?'}test=1`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        mode: 'cors',
      });
      
      const result = await response.json();
      if (result.status === 'success') {
        setTestStatus('success');
        setTestMessage(result.message || 'Koneksi Berhasil! Aplikasi terhubung dengan Google Sheets.');
      } else {
        setTestStatus('error');
        setTestMessage(result.message || 'Gagal terhubung. Pastikan Apps Script telah di-deploy dengan benar.');
      }
    } catch (error) {
      console.error(error);
      // Frequently Web Apps block direct CORS for GET on custom parameters or redirect issues.
      // We should advise the user that if GET CORS fails but script is correct, it might still write data via POST.
      setTestStatus('error');
      setTestMessage(
        'Gagal melakukan tes otomatis karena proteksi CORS browser. Namun, jangan khawatir! Selama Anda mengonfigurasi Deployment "Anyone" (Siapa saja) di Apps Script, data form akan tetap bisa disimpan dan di-sync secara normal.'
      );
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="integration-setup-view">
      {/* Kiri: Form URL & Sinkronisasi */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700 border border-slate-200">
              <Settings size={22} id="icon-settings-integration" />
            </div>
            <div>
              <h2 className="font-display font-bold text-slate-800 text-lg">Konfigurasi Jembatan</h2>
              <p className="text-xs text-slate-500">Hubungkan formulir ke Google Sheets</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                URL Google Apps Script Web App
              </label>
              <input
                type="url"
                className="w-full text-xs px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white focus:border-blue-600 transition font-mono"
                placeholder="https://script.google.com/macros/s/.../exec"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                URL ini didapatkan setelah Anda menerapkan (deploy) Apps Script Anda sebagai Web App.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow flex items-center justify-center space-x-2 cursor-pointer border-2 border-blue-500"
                id="btn-save-integration-url"
              >
                <Database size={16} />
                <span>Simpan URL</span>
              </button>
              
              <button
                type="button"
                onClick={handleTestConnection}
                className="flex-1 py-2 px-4 bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer"
                id="btn-test-integration-connection"
              >
                <RefreshCw size={16} className={testStatus === 'testing' ? 'animate-spin' : ''} />
                <span>Tes Koneksi</span>
              </button>
            </div>
          </form>

          {/* Test Status feedback */}
          {testStatus !== 'idle' && (
            <div className={`mt-4 p-3.5 rounded-xl border-2 text-xs flex gap-2.5 ${
              testStatus === 'success' 
                ? 'bg-blue-50 border-blue-300 text-blue-800' 
                : testStatus === 'error' 
                ? 'bg-amber-50 border-amber-300 text-amber-800' 
                : 'bg-slate-50 border-slate-300 text-slate-800'
            }`} id="test-connection-status-container">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-display font-bold mb-0.5">
                  {testStatus === 'success' ? 'Koneksi Berhasil' : testStatus === 'error' ? 'Informasi Koneksi' : 'Menguji Koneksi'}
                </p>
                <p className="leading-relaxed font-mono">{testMessage}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sync panel */}
        <div className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database size={18} className="text-blue-600" />
              <h3 className="font-display font-bold text-slate-800 text-sm">Status Sinkronisasi</h3>
            </div>
            <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
              gasUrl 
                ? 'bg-blue-50 text-blue-700 border-2 border-blue-200' 
                : 'bg-slate-100 text-slate-600 border-2 border-slate-300'
            }`}>
              {gasUrl ? 'TERKONEKSI' : 'MODE OFFLINE'}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {gasUrl 
              ? 'Aplikasi terhubung dengan database Google Sheets Anda. Formulir baru atau pembaruan akan disinkronisasikan langsung.' 
              : 'Saat ini aplikasi bekerja dalam mode Offline (Penyimpanan Lokal Browser). Anda dapat mendesain form, melihat draft, dan melakukan print formulir secara lokal. Hubungkan ke Google Sheets untuk backup cloud.'}
          </p>

          {gasUrl && (
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition border-2 border-blue-200 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              id="btn-sync-now-integration"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'MENYINKRONKAN...' : 'SINKRONKAN SEKARANG'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Kanan: Petunjuk & Copy Code */}
      <div className="lg:col-span-7 bg-white p-6 rounded-xl border-2 border-slate-200 shadow-sm space-y-4 flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles size={18} className="text-blue-500 animate-pulse" />
            <h2 className="font-display font-bold text-slate-800 text-base">Panduan Pemasangan Google Sheets</h2>
          </div>
          <button
            onClick={copyToClipboard}
            className="text-xs px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border-2 border-slate-200 rounded-lg transition flex items-center space-x-1.5 cursor-pointer font-bold"
            id="btn-copy-apps-script-code"
          >
            {copied ? (
              <>
                <Check size={13} className="text-blue-600" />
                <span className="text-blue-600 font-bold">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                <span>Salin Kode</span>
              </>
            )}
          </button>
        </div>

        {/* Steps List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 pb-3 border-b-2 border-slate-100">
          <div className="space-y-2">
            <div className="flex gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] shrink-0 border border-blue-100">1</span>
              <span>Buat <strong>Google Sheets baru</strong> di Drive Anda.</span>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] shrink-0 border border-blue-100">2</span>
              <span>Buka menu <strong>Ekstensi &gt; Apps Script</strong>.</span>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] shrink-0 border border-blue-100">3</span>
              <span>Paste kode di kanan, lalu klik ikon <strong>Save (Disket)</strong>.</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] shrink-0 border border-blue-100">4</span>
              <span>Jalankan fungsi <strong>setupSheet</strong> di editor agar tabel terbuat.</span>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] shrink-0 border border-blue-100">5</span>
              <span>Klik <strong>Deploy &gt; Penerapan Baru</strong>, pilih tipe <strong>Aplikasi Web</strong>.</span>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] shrink-0 border border-blue-100">6</span>
              <span>Akses diset ke <strong>Siapa saja (Anyone)</strong>, lalu salin URL Web App-nya.</span>
            </div>
          </div>
        </div>

        {/* Code display panel */}
        <div className="flex-1 bg-slate-900 rounded-xl p-4 overflow-hidden relative border-2 border-slate-850 flex flex-col h-[280px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
            <span className="text-[10px] font-mono text-slate-400">code.gs — Google Apps Script</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-blue-400 animate-pulse" />
          </div>
          <pre className="text-[11px] font-mono text-blue-400 overflow-y-auto overflow-x-auto flex-1 leading-normal select-all">
            {scriptCode}
          </pre>
        </div>
      </div>
    </div>
  );
}
