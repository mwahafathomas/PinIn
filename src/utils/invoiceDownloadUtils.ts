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
    // Strip "[Method: ...]" if present
    return order.delivery.replace(/\[Method:\s*[^\]]+\]/i, '').replace(/^Delivery to:\s*/i, '').trim();
  }

  return 'Standard Delivery Address';
}

export function generateInvoiceHtml(order: OrderRecord, info: BusinessInfo): string {
  const invoiceNum = order.invoiceNumber || order.orderNumber.replace('PIN-', 'INV-');
  const paymentMethod = extractPaymentMethod(order.delivery);
  const deliveryAddress = formatInvoiceAddress(order);

  const items = (order.items && order.items.length > 0)
    ? order.items
    : [
        {
          itemBought: order.itemBought,
          itemPrice: order.itemPrice || order.price,
          quantity: order.quantity || 1,
          size: 'Standard',
        },
      ];

  const subtotal = items.reduce(
    (sum, i) => sum + (Number(i.itemPrice) || 0) * (Number(i.quantity) || 1),
    0
  );

  const itemsRows = items.map((item, idx) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111827;">
        ${item.itemBought}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: #4b5563;">
        ${item.size || 'Standard'}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #111827; font-weight: 600;">
        ${item.quantity || 1}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280;">
        -
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 700; color: #111827;">
        R${Number(item.itemPrice || 0).toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoiceNum} - PinIn</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f9fafb; color: #1f2937; padding: 24px; line-height: 1.5; font-size: 13px; }
    .invoice-card { max-width: 720px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
    .header-bar { display: flex; align-items: center; justify-content: space-between; padding-bottom: 18px; border-bottom: 2px solid #2D8EDE; }
    .app-brand { font-size: 26px; font-weight: 900; color: #111827; }
    .app-brand span { color: #2D8EDE; }
    .app-icon { width: 44px; height: 44px; object-fit: contain; border-radius: 8px; }
    .split-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 20px 0; border-bottom: 1px solid #e5e7eb; }
    .col-left { border-right: 1px solid #e5e7eb; padding-right: 20px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; }
    .info-label { color: #6b7280; font-weight: 500; }
    .info-value { color: #111827; font-weight: 700; text-align: right; }
    .divider { border-top: 1px solid #e5e7eb; margin: 12px 0; }
    .section-title { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #111827; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
    th { background: #f3f4f6; color: #374151; font-weight: 700; text-align: left; padding: 10px; border-bottom: 1px solid #d1d5db; }
    .totals-box { margin-top: 16px; padding-top: 14px; border-top: 1px solid #e5e7eb; display: flex; flex-direction: column; gap: 6px; }
    .total-row { display: flex; justify-content: space-between; font-size: 13px; color: #4b5563; }
    .grand-total { font-size: 16px; font-weight: 900; color: #111827; border-top: 2px solid #2D8EDE; padding-top: 8px; margin-top: 4px; }
    .thank-you { text-align: center; margin-top: 28px; padding-top: 18px; border-top: 1px dashed #d1d5db; font-size: 14px; font-weight: 800; color: #2D8EDE; }
    @media print {
      body { background: #ffffff; padding: 0; }
      .invoice-card { border: none; box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header-bar">
      <div>
        <div class="app-brand">Pin<span>In</span></div>
        <div style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Tax Invoice</div>
      </div>
      <div>
        <img class="app-icon" src="${info.app_icon_url || '/PinIn-app-icon.png'}" alt="PinIn App Icon" onerror="this.style.display='none'" />
      </div>
    </div>

    <div class="split-grid">
      <div class="col-left">
        <div class="info-row"><span class="info-label">Invoice number:</span><span class="info-value">${invoiceNum}</span></div>
        <div class="info-row"><span class="info-label">Order number:</span><span class="info-value">${order.orderNumber}</span></div>
        <div class="info-row"><span class="info-label">Invoice date:</span><span class="info-value">${order.dateBought}</span></div>
        
        <div class="divider"></div>

        <div class="info-row"><span class="info-label">Business name:</span><span class="info-value">${info.business_name}</span></div>
        <div class="info-row"><span class="info-label">Address:</span><span class="info-value" style="max-width: 180px;">${info.address}</span></div>
        <div class="info-row"><span class="info-label">Telephone:</span><span class="info-value">${info.telephone_number}</span></div>
        <div class="info-row"><span class="info-label">VAT No:</span><span class="info-value">${info.vat_no}</span></div>
        <div class="info-row"><span class="info-label">REG No:</span><span class="info-value">${info.reg_no}</span></div>
        <div class="info-row"><span class="info-label">Website:</span><span class="info-value">${info.website}</span></div>
      </div>

      <div>
        <div class="section-title">Customer Information</div>
        <div class="info-row"><span class="info-label">Customer name:</span><span class="info-value">${order.buyerName || order.username || 'Customer'}</span></div>
        <div class="info-row"><span class="info-label">Delivery address:</span><span class="info-value" style="max-width: 180px;">${deliveryAddress}</span></div>
      </div>
    </div>

    <div style="padding-top: 18px;">
      <div class="section-title">Items</div>
      <table>
        <thead>
          <tr>
            <th>Item name</th>
            <th>Size</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: center;">VAT</th>
            <th style="text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="totals-box">
        <div class="total-row"><span>Delivery fee:</span><span style="font-weight: 700;">Free</span></div>
        <div class="total-row"><span>Subtotal:</span><span style="font-weight: 700;">R${subtotal.toFixed(2)}</span></div>
        <div class="total-row grand-total"><span>Total:</span><span style="color: #2D8EDE;">R${Number(order.price || 0).toFixed(2)}</span></div>
        <div class="total-row" style="margin-top: 6px; font-size: 11px;"><span>Payment method:</span><span style="font-weight: 700;">${paymentMethod}</span></div>
      </div>
    </div>

    <div class="thank-you">Thank you for shopping with PinIn!</div>
  </div>
</body>
</html>`;
}

export function downloadInvoice(order: OrderRecord, info: BusinessInfo): void {
  const htmlContent = generateInvoiceHtml(order, info);
  const invoiceNum = order.invoiceNumber || order.orderNumber.replace('PIN-', 'INV-');
  const filename = `PinIn-Invoice-${invoiceNum}.html`;

  try {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);
  } catch (err) {
    console.error('Download invoice failed:', err);
    // Fallback: open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  }
}
