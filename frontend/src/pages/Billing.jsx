import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { getMedicines, getCustomers, createSale, createCustomer } from '../services/api';
import { Plus, Trash2, ShoppingCart, Printer } from 'lucide-react';

export default function Billing() {
  const [medicines, setMedicines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedMed, setSelectedMed] = useState('');
  const [qty, setQty] = useState(1);
  const [customerId, setCustomerId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(18);
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  useEffect(() => {
    getMedicines({ limit: 1000 }).then(r => setMedicines(r.data.data || [])).catch(console.error);
    getCustomers().then(r => setCustomers(r.data || [])).catch(console.error);
  }, []);

  const addToCart = () => {
    const med = medicines.find(m => m.id === selectedMed);
    if (!med) return;
    if (qty < 1 || qty > med.stock) { alert(`Stock available: ${med.stock}`); return; }
    const existing = cart.findIndex(c => c.medicine_id === med.id);
    if (existing > -1) {
      const nc = [...cart];
      nc[existing].quantity += qty;
      nc[existing].subtotal = nc[existing].quantity * med.selling_price;
      setCart(nc);
    } else {
      setCart([...cart, { medicine_id: med.id, name: med.name, price: med.selling_price, quantity: qty, subtotal: med.selling_price * qty }]);
    }
    setSelectedMed(''); setQty(1);
  };

  const removeFromCart = (idx) => setCart(cart.filter((_, i) => i !== idx));

  const subtotal = cart.reduce((a, c) => a + c.subtotal, 0);
  const discountAmt = (subtotal * discount) / 100;
  const taxAmt = ((subtotal - discountAmt) * tax) / 100;
  const total = subtotal - discountAmt + taxAmt;

  const handleCheckout = async () => {
    if (cart.length === 0) { alert('Cart is empty'); return; }
    if (!customerId) { alert('Please select or create a customer'); return; }
    setLoading(true);
    try {
      const payload = {
        customer_id: customerId,
        medicines: cart.map(c => ({ medicine_id: c.medicine_id, quantity: c.quantity, price: c.price })),
        total_amount: parseFloat(total.toFixed(2))
      };
      const res = await createSale(payload);
      const cust = customers.find(c => c.id === customerId);
      setInvoice({ ...res.data, customer: cust, cart: [...cart], subtotal, discount, discountAmt, tax, taxAmt, total });
      setCart([]); setCustomerId('');
    } catch (err) {
      alert(err?.response?.data?.detail || 'Checkout failed');
    } finally { setLoading(false); }
  };

  const handleAddCustomer = async () => {
    if (!newCustName || !newCustPhone) return;
    try {
      const res = await createCustomer({ name: newCustName, phone: newCustPhone });
      setCustomers(prev => [...prev, res.data]);
      setCustomerId(res.data.id);
      setNewCustName(''); setNewCustPhone('');
    } catch { alert('Failed to add customer'); }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1" style={{ marginLeft: '260px' }}>
        <Navbar title="Billing" />
        <main className="p-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Medicine selector */}
            <div className="lg:col-span-2 space-y-4">
              <div className="card">
                <h3 className="font-semibold text-white mb-4">Add to Cart</h3>
                <div className="flex flex-wrap gap-3">
                  <select id="bill-med-select" className="input-field flex-1" value={selectedMed} onChange={e => setSelectedMed(e.target.value)}>
                    <option value="">Select Medicine...</option>
                    {medicines.map(m => (
                      <option key={m.id} value={m.id}>{m.name} — ₹{m.selling_price} ({m.stock} left)</option>
                    ))}
                  </select>
                  <input type="number" min="1" className="input-field" style={{ width: 90 }} value={qty} onChange={e => setQty(parseInt(e.target.value))} />
                  <button id="cart-add-btn" onClick={addToCart} className="btn-primary flex items-center gap-1"><Plus size={16} /> Add</button>
                </div>
              </div>

              {/* Cart table */}
              <div className="card">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><ShoppingCart size={18} /> Cart</h3>
                {cart.length === 0 ? (
                  <p className="text-center py-8" style={{ color: '#475569' }}>Cart is empty — add some medicines</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ color: '#64748b', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                        <th className="text-left py-2">Medicine</th>
                        <th className="text-right py-2">Qty</th>
                        <th className="text-right py-2">Unit Price</th>
                        <th className="text-right py-2">Subtotal</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item, idx) => (
                        <tr key={idx} className="table-row border-b" style={{ borderColor: 'rgba(99,102,241,0.06)' }}>
                          <td className="py-3 text-white">{item.name}</td>
                          <td className="text-right" style={{ color: '#94a3b8' }}>{item.quantity}</td>
                          <td className="text-right" style={{ color: '#94a3b8' }}>₹{item.price}</td>
                          <td className="text-right font-semibold text-white">₹{item.subtotal.toFixed(2)}</td>
                          <td className="text-right pl-3">
                            <button onClick={() => removeFromCart(idx)}><Trash2 size={15} style={{ color: '#f87171' }} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Right: Summary */}
            <div className="space-y-4">
              <div className="card">
                <h3 className="font-semibold text-white mb-3">Customer</h3>
                <select id="bill-customer-select" className="input-field text-sm mb-3" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                  <option value="">Select customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                </select>
                <div className="border-t pt-3" style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
                  <p className="text-xs mb-2" style={{ color: '#64748b' }}>Or add new customer</p>
                  <input className="input-field text-sm mb-2" placeholder="Name" value={newCustName} onChange={e => setNewCustName(e.target.value)} />
                  <input className="input-field text-sm mb-2" placeholder="Phone" value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} />
                  <button onClick={handleAddCustomer} className="btn-secondary text-sm w-full">Add Customer</button>
                </div>
              </div>

              <div className="card">
                <h3 className="font-semibold text-white mb-4">Order Summary</h3>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between" style={{ color: '#94a3b8' }}><span>Subtotal</span><span className="text-white">₹{subtotal.toFixed(2)}</span></div>
                  <div className="flex items-center justify-between" style={{ color: '#94a3b8' }}>
                    <span>Discount (%)</span>
                    <input type="number" min="0" max="100" className="input-field text-right" style={{ width: 70 }} value={discount} onChange={e => setDiscount(Number(e.target.value))} />
                  </div>
                  <div className="flex items-center justify-between" style={{ color: '#94a3b8' }}>
                    <span>Tax GST (%)</span>
                    <input type="number" min="0" max="100" className="input-field text-right" style={{ width: 70 }} value={tax} onChange={e => setTax(Number(e.target.value))} />
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-white text-base" style={{ borderColor: 'rgba(99,102,241,0.15)' }}>
                    <span>Total</span><span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
                <button id="checkout-btn" onClick={handleCheckout} disabled={loading || cart.length === 0} className="btn-primary w-full py-3">
                  {loading ? 'Processing...' : 'Complete Sale'}
                </button>
              </div>
            </div>
          </div>

          {/* Invoice modal */}
          {invoice && (
            <div className="modal-backdrop">
              <div className="modal-content" style={{ maxWidth: 560 }}>
                <div className="text-center mb-6">
                  <div className="text-2xl font-bold text-white">PharmaCare</div>
                  <div className="text-xs mt-1" style={{ color: '#64748b' }}>INVOICE • {new Date(invoice.created_at).toLocaleString('en-IN')}</div>
                </div>
                <div className="mb-4" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  <strong className="text-white">Customer:</strong> {invoice.customer?.name} ({invoice.customer?.phone})
                </div>
                <table className="w-full text-sm mb-4">
                  <thead><tr style={{ color: '#64748b', borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
                    <th className="text-left py-1">Item</th><th className="text-right">Qty</th><th className="text-right">Price</th><th className="text-right">Total</th>
                  </tr></thead>
                  <tbody>{invoice.cart.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(99,102,241,0.06)' }}>
                      <td className="py-2 text-white">{c.name}</td>
                      <td className="text-right" style={{ color: '#94a3b8' }}>{c.quantity}</td>
                      <td className="text-right" style={{ color: '#94a3b8' }}>₹{c.price}</td>
                      <td className="text-right font-semibold text-white">₹{c.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}</tbody>
                </table>
                <div className="space-y-1 text-sm border-t pt-3" style={{ borderColor: 'rgba(99,102,241,0.15)', color: '#94a3b8' }}>
                  <div className="flex justify-between"><span>Subtotal</span><span>₹{invoice.subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Discount ({invoice.discount}%)</span><span>-₹{invoice.discountAmt.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>GST ({invoice.tax}%)</span><span>+₹{invoice.taxAmt.toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold text-white text-base border-t pt-2" style={{ borderColor: 'rgba(99,102,241,0.15)' }}>
                    <span>TOTAL</span><span>₹{invoice.total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => window.print()} className="btn-secondary flex-1 flex items-center justify-center gap-2"><Printer size={15} /> Print</button>
                  <button onClick={() => setInvoice(null)} className="btn-primary flex-1">Done</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
