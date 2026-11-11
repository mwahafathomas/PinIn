import { jsPDF } from 'jspdf';
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

/**
 * Builds a clean, official PDF invoice using jsPDF.
 * Output file name: PinIn-Invoice-#ORDER_ID.pdf (e.g. PinIn-Invoice-#1234.pdf)
 * Directly interfaces with Android native bridge window.Android.saveInvoice(base64Data, fileName)
 * when running inside the Android APK.
 */
export function downloadInvoice(order: OrderRecord, info: BusinessInfo): void {
  const cleanOrderNum = String(order.orderNumber || order.id || '1001')
    .replace(/^PIN-/i, '')
    .replace(/^#/, '');
  const fileName = `PinIn-Invoice-#${cleanOrderNum}.pdf`;
  const invoiceNum = order.invoiceNumber || `INV-${cleanOrderNum}`;
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

  // Native Android JavaScriptInterface Bridge check (Step 3 & 4)
  const androidObj = (window as any).Android;
  if (androidObj && typeof androidObj.saveInvoice === 'function') {
    try {
      const dataUri = doc.output('datauristring');
      const base64Data = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;
      androidObj.saveInvoice(base64Data, fileName);
      return;
    } catch (err) {
      console.warn('Android native invoice save notice:', err);
    }
  }

  // Standard Web Download fallback (Step 2)
  doc.save(fileName);
}
