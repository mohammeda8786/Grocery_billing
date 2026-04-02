import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 8000,
});

const initialProductState = {
  name: '',
  ratePerKg: 0,
  ratePerPadi: 0,
};

function formatCurrency(value) {
  return `₹${value.toFixed(2)}`;
}

function clampNumber(value, minimum = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : minimum;
}

function getTamilUnit(unit) {
  if (unit === 'KG') return 'கிலோ';
  if (unit === 'PADI') return 'படி';
  return unit;
}

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.total, 0), [cart]);
  const totalAmount = Math.max(0, subtotal - discount);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/api/products');
      setProducts(response.data);
    } catch (err) {
      console.error(err);
      setError('Unable to load products.');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product, weightType = 'KG') => {
    setError('');
    setCart((previous) => {
      const exists = previous.some(
        (item) => item.name === product.name && item.weightType === weightType
      );
      if (exists) {
        return previous;
      }

      const newItem = {
        id: `${product._id}-${weightType}-${Date.now()}`,
        productId: product._id,
        name: product.name,
        tamilName: product.tamilName || product.name,
        weightType,
        rate: weightType === 'PADI' ? product.ratePerPadi : product.ratePerKg,
        quantity: 1,
        ratePerKg: product.ratePerKg,
        ratePerPadi: product.ratePerPadi,
        total: weightType === 'PADI' ? product.ratePerPadi : product.ratePerKg,
      };

      return [...previous, newItem];
    });
  };

  const handleProductClick = (product) => {
    const matchingItems = cart.filter((item) => item.name === product.name);
    const hasKG = matchingItems.some((item) => item.weightType === 'KG');
    const hasPADI = matchingItems.some((item) => item.weightType === 'PADI');

    if (matchingItems.length === 0) {
      setSelectedProduct(product);
      return;
    }

    if (matchingItems.length === 1) {
      if (!hasKG) {
        addToCart(product, 'KG');
        return;
      }
      if (!hasPADI) {
        addToCart(product, 'PADI');
        return;
      }
    }

    window.alert('Item already exists in bill');
    setError('Item already exists in bill');
  };

  const confirmWeightSelection = (weightType) => {
    if (!selectedProduct) return;
    addToCart(selectedProduct, weightType);
    setSelectedProduct(null);
  };

  const closeWeightSelection = () => setSelectedProduct(null);

  const updateQuantity = (index, value) => {
    setCart((previous) => {
      const updated = [...previous];
      const item = { ...updated[index] };
      item.quantity = Math.max(1, Math.floor(clampNumber(value)));
      item.total = clampNumber(item.rate * item.quantity);
      updated[index] = item;
      return updated;
    });
  };

  const updateRate = (index, value) => {
    setCart((previous) => {
      const updated = [...previous];
      const item = { ...updated[index] };
      item.rate = clampNumber(value);
      item.total = clampNumber(item.rate * item.quantity);
      updated[index] = item;
      return updated;
    });
  };

  const updateWeightType = (index, value) => {
    setCart((previous) => {
      const updated = [...previous];
      const item = { ...updated[index] };
      const newRate = value === 'PADI' ? item.ratePerPadi : item.ratePerKg;
      item.weightType = value;
      item.rate = newRate;
      item.total = clampNumber(item.rate * item.quantity);
      updated[index] = item;
      return updated;
    });
  };

  const removeItem = (id) => {
    setCart((previous) => previous.filter((item) => item.id !== id));
  };

  const clearStatus = () => {
    setStatus('');
    setError('');
  };

  const validatePhone = (value) => /^[0-9]{10}$/.test(value);

  const handleSendBill = async () => {
    clearStatus();

    if (cart.length === 0) {
      setError('Add at least one bill item before sending.');
      return;
    }

    if (!customerName.trim()) {
      setError('Enter customer name.');
      return;
    }

    if (!validatePhone(phone)) {
      setError('Enter a valid 10-digit phone number.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        phone,
        customerName: customerName.trim(),
        items: cart.map(({ name, tamilName, rate, quantity, weightType, total }) => ({
          name,
          tamilName,
          rate,
          quantity,
          weightType,
          total,
        })),
        totalAmount,
      };

      const response = await api.post('/send-bill', payload);
      const whatsappLink = response.data.whatsappLink;
      setStatus('Bill ready. Opening WhatsApp...');
      window.open(whatsappLink, '_blank');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to send bill.');
    } finally {
      setLoading(false);
    }
  };

  const setQuickDiscount = (value) => {
    setDiscount((prev) => {
      const next = prev === value ? 0 : value;
      return Math.min(Math.max(next, 0), subtotal);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-20 rounded-3xl border border-slate-200 bg-white/95 px-4 py-4 shadow-soft backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-600">Weekly Market Billing</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">Grocery / Pulses Shop</h1>
            </div>
            <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700">Mobile first</div>
          </div>


          {error && (
            <div className="mt-4 rounded-3xl bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">{error}</div>
          )}
          {status && (
            <div className="mt-4 rounded-3xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">{status}</div>
          )}
        </header>

        <main className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <section className="space-y-5">
            <div className="rounded-3xl bg-white p-4 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Products</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                  {products.length} items
                </span>
              </div>

              {loading ? (
                <div className="rounded-3xl bg-slate-50 p-10 text-center text-slate-500">Loading products…</div>
              ) : products.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 p-10 text-center text-slate-500">No products found.</div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {products.map((product) => (
                    <div
                      key={product._id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleProductClick(product)}
                      className="flex cursor-pointer flex-col items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center shadow-sm transition hover:border-sky-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    >
                      <div>
                        <p className="text-lg font-semibold">{product.tamilName || product.name}</p>
                        {product.tamilName && product.name !== product.tamilName && (
                          <p className="mt-2 text-sm text-slate-500">{product.name}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleProductClick(product);
                        }}
                        className="mt-4 w-full rounded-3xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl bg-white p-4 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Billing Cart</h2>
                <span className="text-sm text-slate-500">Editable prices & units</span>
              </div>

              {cart.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 p-10 text-center text-slate-500">Add items to the cart to start billing.</div>
              ) : (
                <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                  <table className="min-w-full border-collapse text-center text-sm">
                    <thead>
                      <tr className="border-b border-slate-300 text-base font-semibold">
                        <th className="px-3 py-3">பொருள்</th>
                        <th className="px-3 py-3">அளவு</th>
                        <th className="px-3 py-3">அளவீடு</th>
                        <th className="px-3 py-3">விலை</th>
                        <th className="px-3 py-3">மொத்தம்</th>
                        <th className="px-3 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item, index) => (
                        <tr key={item.id} className="border-b border-slate-200">
                          <td className="px-3 py-4 text-left align-middle text-base font-medium text-slate-800">
                            {item.tamilName || item.name}
                          </td>
                          <td className="px-3 py-4 align-middle">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(index, e.target.value)}
                              className="mx-auto w-20 rounded-3xl border border-slate-300 bg-white px-3 py-2 text-center text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                            />
                          </td>
                          <td className="px-3 py-4 align-middle">
                            <select
                              value={item.weightType}
                              onChange={(e) => updateWeightType(index, e.target.value)}
                              className="mx-auto w-24 rounded-3xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                            >
                              <option value="KG">{getTamilUnit('KG')}</option>
                              <option value="PADI">{getTamilUnit('PADI')}</option>
                            </select>
                          </td>
                          <td className="px-3 py-4 align-middle">
                            <input
                              type="number"
                              min="0"
                              value={item.rate}
                              onChange={(e) => updateRate(index, e.target.value)}
                              className="mx-auto w-24 rounded-3xl border border-slate-300 bg-white px-3 py-2 text-center text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                            />
                          </td>
                          <td className="px-3 py-4 align-middle font-semibold text-slate-700">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="px-3 py-4 align-middle">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="rounded-3xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-4 flex flex-col gap-2 rounded-3xl bg-slate-100 px-4 py-4 text-right text-base font-semibold text-slate-800 sm:flex-row sm:justify-between sm:text-left">
                    <span className="text-sm text-slate-600">மொத்த தொகை:</span>
                    <span className="text-lg">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-3xl bg-white p-4 shadow-soft">
              <h2 className="text-lg font-semibold">Customer</h2>
              <p className="mt-2 text-sm text-slate-500">Enter phone number to send bill.</p>
              <label className="mt-4 block text-sm font-medium text-slate-700">
                Name
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-4 text-lg outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                />
              </label>

              <label className="mt-4 block text-sm font-medium text-slate-700">
                Phone
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  placeholder="10-digit number"
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-4 text-lg outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                />
              </label>
            </div>

            <div className="rounded-3xl bg-white p-4 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Bill Summary</h2>
                  <p className="text-sm text-slate-500">Review totals before sending.</p>
                </div>
              </div>

              <div className="space-y-3 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
                <div className="border-t border-slate-200 pt-4 text-base font-semibold">
                  <div className="flex justify-between">
                    <span>Total</span>
                    <span>{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[5, 10].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setQuickDiscount(value)}
                    className={`rounded-3xl px-4 py-3 text-sm font-semibold transition ${discount === value ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    -{value}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSendBill}
                disabled={loading}
                className="mt-4 w-full rounded-3xl bg-sky-600 px-4 py-4 text-lg font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Preparing bill…' : 'Send Bill'}
              </button>
            </div>

            <div className="rounded-3xl bg-white p-4 shadow-soft">
              <h2 className="text-lg font-semibold">Tips</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>Tap any product card to add it to the bill instantly.</li>
                <li>Edit the rate directly when bargaining.</li>
                <li>Switch between KG and PADI instantly.</li>
              </ul>
            </div>
          </aside>
        </main>

        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-semibold">Select unit for {selectedProduct.tamilName || selectedProduct.name}</h3>
              {selectedProduct.tamilName && (
                <p className="mt-2 text-sm text-slate-500">{selectedProduct.tamilName}</p>
              )}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => confirmWeightSelection('KG')}
                  className="rounded-3xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700"
                >
                  KG
                </button>
                <button
                  type="button"
                  onClick={() => confirmWeightSelection('PADI')}
                  className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  PADI
                </button>
              </div>
              <button
                type="button"
                onClick={closeWeightSelection}
                className="mt-4 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
