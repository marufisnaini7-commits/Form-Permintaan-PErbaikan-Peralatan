/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PartItem {
  no: number; // 1 to 10
  name: string;
  qty: string;
  note: string;
}

export interface RepairRequest {
  id: string; // Unique ID (e.g., job order number or UUID)
  noJobOrder: string;
  tglPermintaan: string;
  dilaporkanOleh: string;
  
  // Identitas Infrastruktur
  namaAlat: string;
  typeAlat: string;
  nomerAlat: string;
  lokasiAlat: string;
  kmHmSaatIni: string;
  
  // Keluhan
  keluhanUraian: string;
  
  // Tanda Tangan Tahap 1
  diketahuiOleh: string; // Diketahui oleh (Atasan/Supervisor)
  dimintaOleh: string;   // Diminta oleh (Pelapor)
  
  // Disposisi
  disposisiRencana: string;
  disposisiDibuatDiterimaOleh: string; // Dibuat / Diterima oleh
  
  // Tindakan Perbaikan
  tindakanPerbaikan: string;
  kmHmSelanjutnya: string;
  dikerjakanOleh: string; // Dikerjakan oleh (Teknisi)
  
  // Uraian Perbaikan / Penggantian Part (1 to 10)
  parts: PartItem[];
  
  // Pemeriksaan
  diperiksaOleh: string; // Diperiksa Oleh
  
  // Status Alur Kerja
  status: 'Draft' | 'Permintaan' | 'Disposisi' | 'Selesai';
  
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  googleAppsScriptUrl: string;
  bkhitLogoUrl: string;
}
