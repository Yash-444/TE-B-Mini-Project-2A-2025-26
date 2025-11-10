const getPrices = require('./utils/readPrices');

app.post('/api/calculate-pricing', (req, res) => {
  const selectedItems = req.body.selected_items || [];
  getPrices((allPrices) => {
    let subtotal = 0;
    // Match selected items with prices from CSV
    const enrichedItems = selectedItems.map((item) => {
      const found = allPrices.find(f => f.id === String(item.id));
      if (found) {
        subtotal += Number(found.price_inr) * item.quantity;
        return { ...item, ...found, itemTotal: Number(found.price_inr) * item.quantity };
      }
      return item;
    });
    const tax = subtotal * 0.08;
    const shipping = subtotal > 0 ? 50 : 0;
    const total = subtotal + tax + shipping;
    res.json({
      success: true,
      pricing: {
        items: enrichedItems,
        subtotal,
        tax,
        shipping,
        total
      }
    });
  });
});
