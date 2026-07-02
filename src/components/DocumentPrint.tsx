/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RepairRequest, PartItem } from '../types';
import LogoBkhit from './LogoBkhit';
import { Printer, Download, ArrowLeft, ExternalLink } from 'lucide-react';

interface DocumentPrintProps {
  request: RepairRequest;
  onBack: () => void;
}

export default function DocumentPrint({ request, onBack }: DocumentPrintProps) {
  // Pad the parts list to exactly 10 items
  const filledParts = request.parts || [];
  const partsList: PartItem[] = Array.from({ length: 10 }, (_, index) => {
    const existing = filledParts.find(p => p.no === index + 1);
    return existing || { no: index + 1, name: '', qty: '', note: '' };
  });

  const getFullHTML = () => {
    const element = document.getElementById('print-sheet-bkhit');
    if (!element) return '';

    // Strip out any internal style tags if present
    const rawHTML = element.innerHTML;
    const innerHTMLClean = rawHTML.replace(/<style[\s\S]*?<\/style>/gi, '');

    return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Order - ${request.noJobOrder || 'No_Job_Order'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      background-color: #f1f5f9;
      color: #000000;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10px;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .no-print-bar {
      width: 100%;
      background: #0f172a;
      color: white;
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      position: sticky;
      top: 0;
      z-index: 9999;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .no-print-bar h1 {
      margin: 0;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    .btn-print {
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 12px;
      cursor: pointer;
      margin-right: 8px;
      transition: background 0.2s;
    }
    .btn-print:hover { background: #1d4ed8; }

    .btn-close {
      background: #475569;
      color: white;
      border: none;
      padding: 8px 14px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-close:hover { background: #334155; }

    .print-sheet-wrapper {
      padding: 20px;
      width: 100%;
      display: flex;
      justify-content: center;
    }

    .print-container {
      width: 210mm;
      min-height: 297mm;
      background: white;
      padding: 10mm;
      box-sizing: border-box;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    }

    table {
      border-collapse: collapse;
      width: 100%;
    }
    
    .border-2 { border: 2px solid #000; }
    .border { border: 1px solid #000; }
    .border-b-2 { border-bottom: 2px solid #000; }
    .border-b { border-bottom: 1px solid #000; }
    .border-r { border-right: 1px solid #000; }
    
    /* Utility Styles */
    .flex { display: flex; }
    .items-start { align-items: flex-start; }
    .items-center { align-items: center; }
    .items-end { align-items: flex-end; }
    .flex-1 { flex: 1 1 0%; }
    .shrink-0 { flex-shrink: 0; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .font-semibold { font-weight: 600; }
    .font-normal { font-weight: normal; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, monospace; }
    .font-sans { font-family: Arial, Helvetica, sans-serif; }
    
    .text-\[8\.5px\] { font-size: 8.5px; }
    .text-\[9px\] { font-size: 9px; }
    .text-\[10px\] { font-size: 10px; }
    .text-\[12px\] { font-size: 12px; }
    .text-\[13px\] { font-size: 13px; }
    .text-\[\#E65100\] { color: #E65100; }
    
    .p-1 { padding: 4px; }
    .p-2 { padding: 8px; }
    .pl-4 { padding-left: 16px; }
    .px-1 { padding-left: 4px; padding-right: 4px; }
    .pb-0\.5 { padding-bottom: 2px; }
    .pr-4 { padding-right: 16px; }
    .pr-6 { padding-right: 24px; }
    
    .mb-1 { margin-bottom: 4px; }
    .mb-2 { margin-bottom: 8px; }
    .mb-8 { margin-bottom: 32px; }
    .mt-0\.5 { margin-top: 2px; }
    .mt-1 { margin-top: 4px; }
    .mt-2 { margin-top: 8px; }
    .mt-3 { margin-top: 12px; }
    .mt-4 { margin-top: 16px; }

    .my-2 { margin-top: 8px; margin-bottom: 8px; }

    .w-full { width: 100%; }
    .w-\[18\%\] { width: 18%; }
    .w-\[35\%\] { width: 35%; }
    .w-\[200px\] { width: 200px; }
    .w-\[140px\] { width: 140px; }
    .w-\[180px\] { width: 180px; }
    .w-\[20px\] { width: 20px; }
    .w-\[24px\] { width: 24px; }
    
    .min-h-\[18px\] { min-height: 18px; }
    .h-\[18px\] { height: 18px; }
    .uppercase { text-transform: uppercase; }
    .underline { text-decoration: underline; }
    .tracking-wide { letter-spacing: 0.025em; }
    .tracking-wider { letter-spacing: 0.05em; }
    .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .gap-x-6 { column-gap: 24px; }
    .gap-y-1 { row-gap: 4px; }
    .space-y-1 > * + * { margin-top: 4px; }
    .space-y-3\.5 > * + * { margin-top: 14px; }
    .space-x-2 > * + * { margin-left: 8px; }
    .space-x-12 > * + * { margin-left: 48px; }

    @page {
      size: A4 portrait;
      margin: 5mm;
    }

    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .no-print, .no-print-bar {
        display: none !important;
      }
      .print-sheet-wrapper {
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
      }
      .print-container {
        width: 100% !important;
        min-height: auto !important;
        padding: 0 !important;
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <h1>Dokumen Permintaan Perbaikan Equipment - BKHIT Papua Barat Daya</h1>
    <div>
      <button class="btn-print" onclick="window.print()">🖨️ Cetak / Print Sekarang</button>
      <button class="btn-close" onclick="window.close()">✕ Tutup Tab</button>
    </div>
  </div>

  <div class="print-sheet-wrapper">
    <div class="print-container" id="print-sheet-bkhit">
      ${innerHTMLClean}
    </div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.print();
        } catch(e) {
          console.error(e);
        }
      }, 500);
    });
  </script>
</body>
</html>`;
  };

  const handlePrint = () => {
    // If running inside an iframe (like AI Studio dev preview frame),
    // calling window.print directly may be suppressed or blocked by sandbox.
    // We seamlessly open in a new tab which triggers auto-print.
    const isIframe = window.self !== window.top;

    if (isIframe) {
      handleOpenNewWindow();
      return;
    }

    // Otherwise trigger native window.print() directly
    try {
      window.print();
    } catch (e) {
      console.error('Direct print failed, fallback to new tab', e);
      handleOpenNewWindow();
    }
  };

  const handleOpenNewWindow = () => {
    const html = getFullHTML();
    if (!html) return;

    const win = window.open('', '_blank');
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
    } else {
      alert('Browser memblokir popup window. Mohon aktifkan izin popup di browser Anda.');
    }
  };

  const handleDownloadHTML = () => {
    const html = getFullHTML();
    if (!html) return;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Job_Order_${request.noJobOrder || 'No_Job_Order'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDateIndonesia = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Control panel (Hidden on printing) */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border-2 border-slate-200 shadow-md print:hidden">
        <button
          onClick={onBack}
          className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border-2 border-slate-200 rounded-lg hover:bg-slate-50 transition flex items-center space-x-2 cursor-pointer w-full lg:w-auto justify-center"
        >
          <ArrowLeft size={15} />
          <span>Kembali ke List</span>
        </button>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={handleDownloadHTML}
            className="flex-1 sm:flex-initial px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition shadow-sm hover:shadow flex items-center justify-center space-x-2 cursor-pointer border-2 border-slate-700"
            title="Unduh file HTML dokumen cetak"
          >
            <Download size={15} />
            <span>Unduh File Dokumen</span>
          </button>

          <button
            onClick={handleOpenNewWindow}
            className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm hover:shadow flex items-center justify-center space-x-2 cursor-pointer border-2 border-emerald-500"
            title="Buka dokumen di jendela baru untuk dicetak"
          >
            <ExternalLink size={15} />
            <span>Cetak di Tab Baru</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-initial px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-sm hover:shadow flex items-center justify-center space-x-2 cursor-pointer border-2 border-blue-500"
            title="Cetak dokumen langsung"
          >
            <Printer size={15} />
            <span>Cetak Langsung</span>
          </button>
        </div>
      </div>


      {/* Sheet Container for Browser View */}
      <div className="bg-slate-150 p-0 sm:p-8 rounded-xl overflow-x-auto flex justify-center border-2 border-slate-200 print:bg-white print:border-none print:p-0 shadow-inner">
        
        {/* Real Document Sheet (A4 Dimensions simulation) */}
        <div 
          className="bg-white text-black p-[10mm] w-[210mm] min-h-[297mm] shadow-xl print:shadow-none print:p-0 relative font-sans text-[10px]" 
          id="print-sheet-bkhit"
        >
          {/* Outer Border Box enclosing entire document */}
          <div className="border-2 border-black w-full text-[10px]">
            {/* 1. TOP HEADER TABLE */}
            <table className="w-full border-b-2 border-black border-collapse">
              <tbody>
                <tr className="border-b border-black">
                  {/* Logo */}
                  <td className="w-[18%] border-r border-black p-2 text-center align-middle">
                    <LogoBkhit size={68} className="mx-auto" />
                  </td>
                  {/* Institution Header Text */}
                  <td colSpan={2} className="p-1 text-center align-middle">
                    <div className="font-bold text-[12px] leading-tight uppercase">
                      BALAI KARANTINA HEWAN IKAN DAN TUMBUHAN
                    </div>
                    <div className="font-bold text-[13px] leading-tight uppercase">
                      PAPUA BARAT DAYA
                    </div>
                    <div className="text-[8.5px] leading-tight mt-0.5 font-medium">
                      Jalan Selat Sunda (Kompleks Bandara DEO), Sorong – Papua Barat Daya 98417
                    </div>
                    <div className="text-[8.5px] leading-tight font-medium">
                      Telp/Fax (0951) 321220
                    </div>
                    <div className="text-[8.5px] leading-tight font-medium underline">
                      https://karantinaindonesia.go.id/papuabaratdaya
                    </div>
                  </td>
                </tr>

                {/* ISO & MANAJEMEN ROW */}
                <tr>
                  <td colSpan={2} className="border-r border-black p-0 align-top">
                    <div className="p-1 text-center font-bold text-[8.5px] border-b border-black">
                      FORMULIR TERINTEGRASI<br />
                      SNI ISO 9001:2015, SNI ISO 37001:2016 DAN SNI ISO 45001:2018
                    </div>
                    <div className="p-1 text-center font-bold text-[9px] uppercase tracking-wider">
                      SISTEM MANAJEMEN TERINTEGRASI
                    </div>
                  </td>
                  <td className="w-[35%] p-0 align-top">
                    <table className="w-full text-[8px] border-collapse">
                      <tbody>
                        <tr className="border-b border-black">
                          <td className="p-1 border-r border-black font-medium w-[45%]">No. Dokumen</td>
                          <td className="p-1">: FT.PBD.7.1.3.2.4</td>
                        </tr>
                        <tr className="border-b border-black">
                          <td className="p-1 border-r border-black font-medium">Terbitan/Revisi</td>
                          <td className="p-1">: 01/00</td>
                        </tr>
                        <tr>
                          <td className="p-1 border-r border-black font-medium">Tgl. Terbit/Revisi</td>
                          <td className="p-1">: 12-07-2024/-</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 2. TITLE BANNER */}
            <div className="border-b-2 border-black py-1 text-center">
              <h2 className="text-[12px] font-bold text-[#E65100] uppercase tracking-wide">
                PERMINTAAN PERBAIKAN PERALATAN
              </h2>
            </div>

            {/* 3. IDENTITAS & REQUEST FIELDS */}
            <table className="w-full border-b-2 border-black border-collapse text-[10px]">
              <tbody>
                <tr className="border-b border-black">
                  <td className="w-[200px] p-1 font-normal">No Job Order</td>
                  <td className="p-1 font-bold">: {request.noJobOrder || ''}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="p-1 font-normal">Tgl Permintaan Perbaikan</td>
                  <td className="p-1">: : {formatDateIndonesia(request.tglPermintaan) || ''}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="p-1 font-normal">Dilaporkan Oleh</td>
                  <td className="p-1">: {request.dilaporkanOleh || ''}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="p-1 font-normal">Identitas Infrastruktur</td>
                  <td className="p-1">:</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="p-1 pl-4 font-normal">a. Nama</td>
                  <td className="p-1">: {request.namaAlat || ''}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="p-1 pl-4 font-normal">b. Type</td>
                  <td className="p-1">: {request.typeAlat || ''}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="p-1 pl-4 font-normal">c. Nomer</td>
                  <td className="p-1">: {request.nomerAlat || ''}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="p-1 pl-4 font-normal">d. Lokasi Alat</td>
                  <td className="p-1">: {request.lokasiAlat || ''}</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="p-1 pl-4 font-normal">e. Km / Hour meter saat ini</td>
                  <td className="p-1">: {request.kmHmSaatIni || ''}</td>
                </tr>
              </tbody>
            </table>

            {/* 4. KELUHAN / URAIAN KERUSAKAN */}
            <div className="border-b-2 border-black p-2">
              <div className="flex mb-1">
                <span className="w-[200px]">Keluhan / Uraian Kerusakan</span>
                <span>:</span>
              </div>

              {/* Lined lines area */}
              <div className="space-y-3.5 my-2">
                <div className="border-b border-black min-h-[18px] px-1 text-[10px]">
                  {request.keluhanUraian || ''}
                </div>
                <div className="border-b border-black h-[18px]"></div>
                <div className="border-b border-black h-[18px]"></div>
              </div>

              <div className="flex justify-end mt-4 text-center">
                <div className="flex space-x-12 pr-4 text-[10px]">
                  <div className="w-[140px]">
                    <p className="mb-8 font-normal">Diketahui oleh :</p>
                    <p className="font-normal">( {request.diketahuiOleh ? request.diketahuiOleh : '..........................'} )</p>
                  </div>
                  <div className="w-[140px]">
                    <p className="mb-8 font-normal">Diminta oleh :</p>
                    <p className="font-normal">( {request.dimintaOleh ? request.dimintaOleh : '..........................'} )</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. DISPOSISI / RENCANA TINDAKAN PERBAIKAN */}
            <div className="border-b-2 border-black p-2">
              <div className="font-normal mb-1">Disposisi / Rencana Tindakan Perbaikan</div>

              <div className="space-y-3.5 my-2">
                <div className="border-b border-black min-h-[18px] px-1 text-[10px]">
                  {request.disposisiRencana || ''}
                </div>
                <div className="border-b border-black h-[18px]"></div>
                <div className="border-b border-black h-[18px]"></div>
              </div>

              <div className="flex justify-end mt-4 text-center">
                <div className="w-[180px] pr-4 text-[10px]">
                  <p className="mb-8 font-normal">Dibuat / Diterima oleh :</p>
                  <p className="font-normal">( {request.disposisiDibuatDiterimaOleh ? request.disposisiDibuatDiterimaOleh : '..........................'} )</p>
                </div>
              </div>
            </div>

            {/* 6. TINDAKAN PERBAIKAN */}
            <div className="border-b-2 border-black p-2">
              <div className="font-normal mb-1">Tindakan Perbaikan</div>

              <div className="space-y-3.5 my-2">
                <div className="border-b border-black min-h-[18px] px-1 text-[10px]">
                  {request.tindakanPerbaikan || ''}
                </div>
                <div className="border-b border-black h-[18px]"></div>
                <div className="border-b border-black h-[18px]"></div>
              </div>

              <div className="flex justify-between items-end mt-3 text-[10px]">
                <div className="flex items-center space-x-2">
                  <span>f. Km / Hour meter selanjutnya</span>
                  <span>:</span>
                  <span className="font-bold underline">{request.kmHmSelanjutnya || ''}</span>
                </div>
                <div className="w-[180px] text-center pr-4">
                  <p className="mb-8 font-normal">Dikerjakan oleh :</p>
                  <p className="font-normal">( {request.dikerjakanOleh ? request.dikerjakanOleh : '..........................'} )</p>
                </div>
              </div>
            </div>

            {/* 7. URAIAN PERBAIKAN / PENGGANTIAN PART */}
            <div className="p-2">
              <div className="font-normal mb-2">Uraian Perbaikan / Penggantian Part</div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                {/* Left Column 1..5 */}
                <div className="space-y-1">
                  {partsList.slice(0, 5).map((part) => (
                    <div key={part.no} className="flex border-b border-black pb-0.5 text-[10px]">
                      <span className="w-[20px]">{part.no}.</span>
                      <span className="flex-1 truncate">
                        {part.name ? `${part.name} ${part.qty ? `(${part.qty})` : ''} ${part.note ? `- ${part.note}` : ''}` : ''}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Right Column 6..10 */}
                <div className="space-y-1">
                  {partsList.slice(5, 10).map((part) => (
                    <div key={part.no} className="flex border-b border-black pb-0.5 text-[10px]">
                      <span className="w-[24px]">{part.no}.</span>
                      <span className="flex-1 truncate">
                        {part.name ? `${part.name} ${part.qty ? `(${part.qty})` : ''} ${part.note ? `- ${part.note}` : ''}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end mt-4 text-center">
                <div className="w-[180px] pr-4 text-[10px]">
                  <p className="mb-8 font-normal">Diperiksa Oleh :</p>
                  <p className="font-normal">( {request.diperiksaOleh ? request.diperiksaOleh : '..........................'} )</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
