import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function downloadOrderPdf(order: any, items: any[]) {
  const doc = new jsPDF()
  const today = new Date().toLocaleDateString('fr-FR')

  doc.setFontSize(22); doc.setTextColor(183, 110, 121)
  doc.text('ESTABRAK', 14, 22)
  doc.setFontSize(9); doc.setTextColor(120, 120, 120)
  doc.text('Mode Musulmane Premium — Tunisie', 14, 28)

  doc.setFontSize(14); doc.setTextColor(30, 30, 30)
  doc.text(`Commande ${order.order_number}`, 14, 42)
  doc.setFontSize(10)
  doc.text(`Date : ${today}`, 14, 50)
  doc.text(`Statut : ${order.status}`, 14, 56)

  doc.setFontSize(12); doc.text('Cliente', 14, 70)
  doc.setFontSize(10)
  doc.text(`${order.customer_first_name} ${order.customer_last_name}`, 14, 78)
  doc.text(`${order.customer_phone}${order.customer_whatsapp ? ' / WA: ' + order.customer_whatsapp : ''}`, 14, 84)
  doc.text(`${order.address}, ${order.city}`, 14, 90)

  autoTable(doc, {
    startY: 100,
    head: [['Produit', 'Variante', 'Qté', 'PU (DT)', 'Total (DT)']],
    body: items.map((it: any) => [
      it.product_name,
      it.variant_attributes ? Object.values(it.variant_attributes).filter((v) => typeof v === 'string').join(' / ') : '—',
      String(it.quantity),
      Number(it.unit_price).toFixed(2),
      Number(it.total).toFixed(2),
    ]),
    headStyles: { fillColor: [183, 110, 121], textColor: 255 },
    styles: { fontSize: 9 },
  })

  const finalY = (doc as any).lastAutoTable.finalY + 10
  doc.setFontSize(10); doc.setTextColor(30, 30, 30)
  doc.text(`Sous-total : ${Number(order.subtotal).toFixed(2)} DT`, 130, finalY)
  if (Number(order.discount_amount) > 0) doc.text(`Remise : -${Number(order.discount_amount).toFixed(2)} DT`, 130, finalY + 6)
  doc.text(`Livraison : ${Number(order.shipping_fee).toFixed(2)} DT`, 130, finalY + 12)
  doc.setFontSize(12); doc.setTextColor(183, 110, 121)
  doc.text(`TOTAL : ${Number(order.total).toFixed(2)} DT`, 130, finalY + 22)

  doc.save(`ESTABRAK-${order.order_number}.pdf`)
}