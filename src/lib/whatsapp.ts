export const WHATSAPP_CONTACT = {
  name: "Thakur Yograj",
  phone: "918959568262",
  displayPhone: "+91 89595 68262",
};

export function getWhatsAppOrderUrl(params?: {
  productName?: string;
  price?: string | number;
  quantity?: number;
  currencySymbol?: string;
  note?: string;
}) {
  const { productName, price, quantity = 1, currencySymbol = "₹", note } = params || {};
  let message = `Hello ${WHATSAPP_CONTACT.name}, I would like to place an order! 🙏\n\n`;

  if (productName) {
    message += `📦 *Product:* ${productName}\n`;
    if (quantity > 1) {
      message += `🔢 *Quantity:* ${quantity}\n`;
    }
    if (price) {
      message += `💰 *Price:* ${typeof price === "number" ? `${currencySymbol}${price}` : price}\n`;
    }
  }

  if (note) {
    message += `📝 *Note:* ${note}\n`;
  }

  message += `\nPlease share delivery, payment, and confirmation details.`;

  return `https://wa.me/${WHATSAPP_CONTACT.phone}?text=${encodeURIComponent(message)}`;
}
