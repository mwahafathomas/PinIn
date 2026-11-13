import { jsPDF } from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { OrderRecord } from '../services/ordersService';
import { BusinessInfo } from '../services/businessInfoService';

export function extractPaymentMethod(deliveryString?: string): string {
  if (!deliveryString) return 'Card';
  const match = deliveryString.match(/\[Method:\s*([^\]]+)\]/i);
  if (match && match[1]) return match[1].trim();
  if (/capitec/i.test(deliveryString)) return 'Capitec Pay';
  if (/ozow/i.test(deliveryString)) return 'Ozow';
  if (/eft/i.test(deliveryString)) return 'EFT';
  return 'Card';
}

export function formatInvoiceAddress(order: OrderRecord): string {
  const parts = [
    order.streetAddressLine1,
    order.streetAddressLine2,
    order.cityTown,
    order.province,
    order.postalCode,
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(', ');
  }

  if (order.delivery) {
    return order.delivery.replace(/\[Method:\s*[^\]]+\]/i, '').replace(/^Delivery to:\s*/i, '').trim();
  }

  return 'Standard Delivery Address';
}

export interface InvoiceDownloadResult {
  success: boolean;
  message: string;
  uri?: string;
}

/**
 * Builds a clean, official PDF invoice using jsPDF.
 * On Capacitor APK, saves to Documents + Downloads via @capacitor/filesystem and opens @capacitor/share.
 * Falls back to custom WebView bridge or browser doc.save() on web.
 */
export async function downloadInvoice(
  order: OrderRecord,
  info: BusinessInfo
): Promise<InvoiceDownloadResult> {
  const cleanOrderNum = String(order.orderNumber || order.id || '1001')
    .replace(/^PIN-/i, '')
    .replace(/^#/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '');
  const fileName = `Invoice-${cleanOrderNum || '1001'}.pdf`;
  const invoiceNum = order.invoiceNumber || `INV-${cleanOrderNum || '1001'}`;
  const paymentMethod = extractPaymentMethod(order.delivery);
  const deliveryAddress = formatInvoiceAddress(order);

  const items = (order.items && order.items.length > 0)
    ? order.items
    : [
        {
          itemBought: order.itemBought || 'Order Item',
          itemPrice: order.itemPrice || order.price || '0',
          quantity: order.quantity || 1,
          size: 'Standard',
        },
      ];

  const subtotal = items.reduce(
    (sum, i) => sum + (Number(i.itemPrice) || 0) * (Number(i.quantity) || 1),
    0
  );

  const computedDelivery = order.deliveryFee !== undefined
    ? Number(order.deliveryFee)
    : Math.max(0, Number(order.price || 0) - subtotal);
  const deliveryFeeDisplay = computedDelivery > 0 ? `R${computedDelivery.toFixed(2)}` : 'Free';
  const grandTotal = Number(order.price || subtotal + computedDelivery).toFixed(2);

  // Initialize jsPDF A4 (595.28 x 841.89 pt)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const margin = 40;
  const pageWidth = 595.28;
  const contentWidth = pageWidth - margin * 2;
  let currentY = 50;

  // Header Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(17, 24, 39); // #111827
  doc.text('Pin', margin, currentY);
  const pinWidth = doc.getTextWidth('Pin');
  doc.setTextColor(45, 142, 222); // #2D8EDE
  doc.text('In', margin + pinWidth, currentY);

  // TAX INVOICE title on the right
  doc.setFontSize(14);
  doc.setTextColor(107, 114, 128);
  doc.text('TAX INVOICE', pageWidth - margin, currentY, { align: 'right' });

  // Blue accent line under header
  currentY += 15;
  doc.setDrawColor(45, 142, 222);
  doc.setLineWidth(2.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 25;

  // Split section: Business & Invoice details (Left) vs Customer details (Right)
  const colWidth = (contentWidth - 20) / 2;
  const rightColX = margin + colWidth + 20;
  const topBlockStartY = currentY;

  // Left Column - Invoice Meta & Business Info
  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.text('INVOICE NUMBER:', margin, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text(invoiceNum, margin + 110, currentY);

  currentY += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.text('ORDER NUMBER:', margin, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text(order.orderNumber, margin + 110, currentY);

  currentY += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.text('INVOICE DATE:', margin, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text(order.dateBought || new Date().toISOString().split('T')[0], margin + 110, currentY);

  currentY += 16;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.8);
  doc.line(margin, currentY, margin + colWidth, currentY);
  currentY += 14;

  const renderInfoRow = (label: string, value?: string) => {
    if (!value) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128);
    doc.text(label, margin, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    const splitVal = doc.splitTextToSize(value, colWidth - 95);
    doc.text(splitVal, margin + 95, currentY);
    currentY += Math.max(14, splitVal.length * 11);
  };

  renderInfoRow('Business name:', info.business_name);
  renderInfoRow('Address:', info.address);
  renderInfoRow('Telephone:', info.telephone_number);
  renderInfoRow('VAT No:', info.vat_no);
  renderInfoRow('REG No:', info.reg_no);
  renderInfoRow('Website:', info.website);

  const leftBottomY = currentY;

  // Right Column - Customer Info
  let rightY = topBlockStartY;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text('CUSTOMER INFORMATION', rightColX, rightY);

  rightY += 16;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.8);
  doc.line(rightColX, rightY - 6, pageWidth - margin, rightY - 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(156, 163, 175);
  doc.text('CUSTOMER NAME:', rightColX, rightY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text(order.buyerName || order.username || 'Customer', rightColX, rightY + 20);

  rightY += 38;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(156, 163, 175);
  doc.text('DELIVERY ADDRESS:', rightColX, rightY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  const addressLines = doc.splitTextToSize(deliveryAddress, colWidth);
  doc.text(addressLines, rightColX, rightY + 14);

  // Table starts below highest block
  currentY = Math.max(leftBottomY, rightY + 14 + addressLines.length * 12) + 20;

  // Section: Items Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text('ITEMS', margin, currentY);

  currentY += 10;
  // Table Header Background
  doc.setFillColor(243, 244, 246);
  doc.rect(margin, currentY, contentWidth, 22, 'F');

  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);
  doc.text('Item name', margin + 8, currentY + 15);
  doc.text('Size', margin + 250, currentY + 15);
  doc.text('Qty', margin + 330, currentY + 15, { align: 'center' });
  doc.text('VAT', margin + 410, currentY + 15, { align: 'center' });
  doc.text('Price', pageWidth - margin - 8, currentY + 15, { align: 'right' });

  currentY += 24;

  // Table Body Rows
  items.forEach((item) => {
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY + 20, pageWidth - margin, currentY + 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(17, 24, 39);
    const itemTitle = doc.splitTextToSize(item.itemBought, 230);
    doc.text(itemTitle, margin + 8, currentY + 13);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(75, 85, 99);
    doc.text(item.size || 'Standard', margin + 250, currentY + 13);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(String(item.quantity || 1), margin + 330, currentY + 13, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(156, 163, 175);
    doc.text('-', margin + 410, currentY + 13, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    const itemTotal = (Number(item.itemPrice || 0) * Number(item.quantity || 1)).toFixed(2);
    doc.text(`R${itemTotal}`, pageWidth - margin - 8, currentY + 13, { align: 'right' });

    currentY += Math.max(22, itemTitle.length * 13 + 4);
  });

  currentY += 12;

  // Totals Box
  const totalsBoxX = pageWidth - margin - 220;
  const totalsBoxWidth = 220;

  const renderTotalLine = (label: string, val: string, isBold = false, isAccent = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 11 : 9);
    doc.setTextColor(isAccent ? 45 : 75, isAccent ? 142 : 85, isAccent ? 222 : 99);
    doc.text(label, totalsBoxX, currentY);
    doc.text(val, pageWidth - margin - 8, currentY, { align: 'right' });
    currentY += 16;
  };

  renderTotalLine('Delivery fee:', deliveryFeeDisplay);
  renderTotalLine('Subtotal:', `R${subtotal.toFixed(2)}`);

  // Line above total
  doc.setDrawColor(45, 142, 222);
  doc.setLineWidth(1.5);
  doc.line(totalsBoxX, currentY - 6, pageWidth - margin, currentY - 6);

  renderTotalLine('Total:', `R${grandTotal}`, true, true);
  renderTotalLine('Payment method:', paymentMethod);

  // Thank you message at footer
  currentY += 28;
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.8);
  doc.setLineDashPattern([3, 3], 0);
  doc.line(margin + 50, currentY, pageWidth - margin - 50, currentY);
  doc.setLineDashPattern([], 0);

  currentY += 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(45, 142, 222);
  doc.text('Thank you for shopping with PinIn!', pageWidth / 2, currentY, { align: 'center' });

  const dataUri = doc.output('datauristring');
  const pdfBase64 = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;

  // 1. Capacitor Native APK path (@capacitor/filesystem + @capacitor/share)
  if (Capacitor.isNativePlatform()) {
    try {
      try {
        const permStatus = await Filesystem.checkPermissions();
        if (permStatus.publicStorage !== 'granted') {
          await Filesystem.requestPermissions();
        }
      } catch {
        // Ignore if scoped storage does not require explicit publicStorage runtime prompt
      }

      // Save to Documents directory
      let resultUri: string | undefined;
      let savedLocation = `Documents/${fileName}`;

      try {
        const result = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Documents,
          recursive: true,
        });
        resultUri = result.uri;
      } catch (docError) {
        console.warn('Directory.Documents write failed, falling back to Cache:', docError);
        const cacheResult = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Cache,
          recursive: true,
        });
        resultUri = cacheResult.uri;
        savedLocation = fileName;
      }

      // For Android - also save to Downloads via ExternalStorage
      let savedToDownloads = false;
      try {
        await Filesystem.writeFile({
          path: `Download/${fileName}`,
          data: pdfBase64,
          directory: Directory.ExternalStorage,
          recursive: true,
        });
        savedToDownloads = true;
      } catch {
        // Fallback if ExternalStorage is restricted on Android 11+
      }

      // Also trigger optional native Android JavaScriptInterface bridge if present
      const androidObj = (window as any).Android;
      if (androidObj && typeof androidObj.saveInvoice === 'function') {
        try {
          androidObj.saveInvoice(pdfBase64, fileName);
          savedToDownloads = true;
        } catch (bridgeErr) {
          console.warn('Android native bridge invoice save notice:', bridgeErr);
        }
      }

      // Show Share dialog so user can Save As / Open / Send
      if (resultUri) {
        try {
          await Share.share({
            title: fileName,
            text: `Invoice ${invoiceNum}`,
            url: resultUri,
            dialogTitle: 'Save or Share Invoice',
          });
        } catch (shareErr: any) {
          const errMsg = String(shareErr?.message || '').toLowerCase();
          if (!errMsg.includes('cancel') && !errMsg.includes('dismiss')) {
            console.warn('Share sheet notice:', shareErr);
          }
        }
      }

      return {
        success: true,
        message: savedToDownloads
          ? `Invoice saved to Documents/${fileName} and Downloads`
          : `Invoice saved to ${savedLocation}`,
        uri: resultUri,
      };
    } catch (err: any) {
      console.error('APK invoice download failed:', err);
      return {
        success: false,
        message: `Download failed: ${err?.message || 'Unable to save invoice PDF'}`,
      };
    }
  }

  // 2. Non-Capacitor Android WebView JavaScriptInterface bridge fallback
  const androidObj = (window as any).Android;
  if (androidObj && typeof androidObj.saveInvoice === 'function') {
    try {
      androidObj.saveInvoice(pdfBase64, fileName);
      return {
        success: true,
        message: `Invoice saved to Downloads/${fileName}`,
      };
    } catch (err: any) {
      console.warn('Android native invoice save notice:', err);
      return {
        success: false,
        message: `Download failed: ${err?.message || 'Android bridge error'}`,
      };
    }
  }

  // 3. Standard Web Browser download
  try {
    doc.save(fileName);
    return {
      success: true,
      message: `Downloaded ${fileName}`,
    };
  } catch (err: any) {
    console.error('Web invoice download failed:', err);
    return {
      success: false,
      message: `Download failed: ${err?.message || 'Unable to download PDF'}`,
    };
  }
}
