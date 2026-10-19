import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Camera,
  Check,
  CreditCard,
  Flame,
  LockKeyhole,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Video,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { boostAPI, type BoostOrder, type BoostProduct } from '../../api/boost';
import { getApiErrorMessage } from '../../api/api-error';

type ProductGroup = 'Listings' | 'Credits';
type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  group: ProductGroup;
  icon: LucideIcon;
  tone: string;
  recommended?: boolean;
};

const productPresentation: Record<string, { icon: LucideIcon; tone: string }> = {
  listing: { icon: BadgeCheck, tone: 'bg-primary-soft text-primary' },
  'hot-listing': { icon: Flame, tone: 'bg-warning-soft text-warning' },
  'super-hot-listing': { icon: Zap, tone: 'bg-danger-soft text-danger' },
  'refresh-credits': { icon: RefreshCw, tone: 'bg-info-soft text-info' },
  'story-ad-credits': { icon: Sparkles, tone: 'bg-primary-soft text-primary' },
  'photography-credits': { icon: Camera, tone: 'bg-info-soft text-info' },
  'videography-credits': { icon: Video, tone: 'bg-warning-soft text-warning' },
};

type Cart = Record<string, number>;
type CheckoutStep = 'catalog' | 'checkout';

const formatPrice = (amount: number) => `Rs. ${amount.toLocaleString('en-PK')}`;

export default function RentraBoost() {
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [cart, setCart] = useState<Cart>({});
  const [step, setStep] = useState<CheckoutStep>('catalog');
  const [gatewayNotice, setGatewayNotice] = useState(false);
  const [order, setOrder] = useState<BoostOrder | null>(null);
  const [orderError, setOrderError] = useState('');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const idempotencyKey = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    boostAPI.getCatalog()
      .then(({ items }) => {
        if (!active) return;
        setProducts(items.map((product: BoostProduct) => ({
          ...product,
          ...(productPresentation[product.id] ?? {
            icon: Sparkles,
            tone: 'bg-primary-soft text-primary',
          }),
        })));
        setCatalogError('');
      })
      .catch((error: unknown) => {
        if (active) {
          setCatalogError(getApiErrorMessage(error, 'Boost products could not be loaded.'));
        }
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });
    return () => { active = false; };
  }, []);

  const cartItems = products
    .filter((product) => (cart[product.id] ?? 0) > 0)
    .map((product) => ({ product, quantity: cart[product.id] }));
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  const total = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );
  const summaryItems = order
    ? order.items.map((item) => ({
        id: item.id,
        name: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      }))
    : cartItems.map(({ product, quantity }) => ({
        id: product.id,
        name: product.name,
        quantity,
        unitPrice: product.price,
        lineTotal: product.price * quantity,
      }));
  const summaryItemCount = summaryItems.reduce(
    (count, item) => count + item.quantity,
    0,
  );

  const updateQuantity = (productId: string, amount: number) => {
    setOrder(null);
    setOrderError('');
    idempotencyKey.current = null;
    setCart((current) => {
      const nextQuantity = Math.min(20, (current[productId] ?? 0) + amount);
      const next = { ...current };
      if (nextQuantity <= 0) delete next[productId];
      else next[productId] = nextQuantity;
      return next;
    });
  };

  const removeFromCart = (productId: string) => {
    setOrder(null);
    setOrderError('');
    idempotencyKey.current = null;
    setCart((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  };

  const handlePayNow = () => {
    setGatewayNotice(true);
  };

  const handleProceedToPayment = async () => {
    setOrderError('');
    setCreatingOrder(true);
    try {
      const requestKey = idempotencyKey.current ?? crypto.randomUUID();
      idempotencyKey.current = requestKey;
      const createdOrder = order ?? await boostAPI.createOrder(
        cartItems.map(({ product, quantity }) => ({
          productId: product.id,
          quantity,
        })),
        requestKey,
      );
      setOrder(createdOrder);
      setGatewayNotice(false);
      setStep('checkout');
    } catch (error) {
      setOrderError(getApiErrorMessage(error, 'Your boost order could not be created.'));
    } finally {
      setCreatingOrder(false);
    }
  };

  const OrderSummary = () => (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-text">Order summary</h2>
        <span className="rounded-full bg-surface2 px-2.5 py-1 text-xs font-semibold text-text-muted">
          {summaryItemCount} {summaryItemCount === 1 ? 'item' : 'items'}
        </span>
      </div>
      <div className="my-4 border-t border-border" />
      {summaryItems.length ? (
        <div className="space-y-4">
          {summaryItems.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-text">{item.name}</p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {item.quantity} × {formatPrice(item.unitPrice)}
                </p>
              </div>
              <span className="shrink-0 font-semibold text-text">
                {formatPrice(item.lineTotal)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-5 text-center">
          <ShoppingBag className="mx-auto mb-2 text-text-muted" size={24} />
          <p className="text-sm font-medium text-text">Your cart is empty</p>
          <p className="mt-1 text-xs text-text-muted">Add a boost to get started.</p>
        </div>
      )}
      <div className="my-4 border-t border-border" />
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-muted">Subtotal</span>
        <span className="font-semibold text-text">{formatPrice(order?.subtotal ?? total)}</span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-bold text-text">Total</span>
        <span className="text-lg font-extrabold text-primary">{formatPrice(order?.total ?? total)}</span>
      </div>
      {step === 'catalog' ? (
        <button
          type="button"
          onClick={() => void handleProceedToPayment()}
          disabled={!totalItems || creatingOrder || catalogLoading || Boolean(catalogError)}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-contrast transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creatingOrder ? 'Creating order…' : 'Proceed to payment'} <ArrowRight size={16} />
        </button>
      ) : (
        <button
          type="button"
          onClick={handlePayNow}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-contrast transition hover:bg-primary-hover"
        >
          <LockKeyhole size={15} /> Pay now · {formatPrice(order?.total ?? total)}
        </button>
      )}
      {gatewayNotice && (
        <p role="alert" className="mt-3 rounded-xl border border-warning/30 bg-warning-soft p-3 text-xs leading-5 text-text">
          Secure online payment is not connected yet. No charge was made and no boost was activated.
        </p>
      )}
      {orderError && (
        <p role="alert" className="mt-3 rounded-xl border border-danger/30 bg-danger-soft p-3 text-xs leading-5 text-text">
          {orderError}
        </p>
      )}
      <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-text-muted">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-primary" />
        Secure payment processing will be enabled when a payment provider is connected.
      </p>
    </section>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-8">
      <header className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Grow your reach</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-text sm:text-3xl">Rentra Boost</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">
              Promote your properties and reach more renters with listing placements and professional media services.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-primary-soft px-3 py-2 text-xs font-semibold text-text">
            <ShieldCheck size={16} /> Trusted property promotion
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className={`rounded-full px-3 py-1.5 ${step === 'catalog' ? 'bg-primary text-primary-contrast' : 'bg-surface2 text-text-muted'}`}>1. Choose boosts</span>
          <span className="text-text-muted">/</span>
          <span className={`rounded-full px-3 py-1.5 ${step === 'checkout' ? 'bg-primary text-primary-contrast' : 'bg-surface2 text-text-muted'}`}>2. Checkout</span>
        </div>
      </header>

      {step === 'catalog' ? (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="space-y-5">
            {catalogLoading && (
              <p role="status" className="rounded-xl border border-border bg-surface p-4 text-sm text-text-muted">
                Loading Boost products…
              </p>
            )}
            {catalogError && (
              <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-text">
                {catalogError}
                <button
                  type="button"
                  onClick={() => {
                    setCatalogLoading(true);
                    setCatalogError('');
                    boostAPI.getCatalog().then(({ items }) => {
                      setProducts(items.map((product) => ({
                        ...product,
                        ...(productPresentation[product.id] ?? {
                          icon: Sparkles,
                          tone: 'bg-primary-soft text-primary',
                        }),
                      })));
                    }).catch((error: unknown) => {
                      setCatalogError(getApiErrorMessage(error, 'Boost products could not be loaded.'));
                    }).finally(() => setCatalogLoading(false));
                  }}
                  className="ml-2 font-semibold underline"
                >
                  Retry
                </button>
              </div>
            )}
            {!catalogLoading && !catalogError && products.length === 0 && (
              <p role="alert" className="rounded-xl border border-border bg-surface p-4 text-sm text-text-muted">
                No Boost products are currently available.
              </p>
            )}
            {(['Listings', 'Credits'] as const).map((group) => (
              <section key={group} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
                <div className="border-b border-border px-4 py-4 sm:px-5">
                  <h2 className="font-bold text-text">{group}</h2>
                  <p className="mt-1 text-xs text-text-muted">
                    {group === 'Listings'
                      ? 'Choose a 30-day listing placement.'
                      : 'Credits can be applied to listings you have already posted.'}
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {products.filter((product) => product.group === group).map((product) => {
                    const Icon = product.icon;
                    const quantity = cart[product.id] ?? 0;
                    return (
                      <article key={product.id} className="flex flex-wrap items-center gap-4 px-4 py-4 transition-colors hover:bg-surface2/50 sm:flex-nowrap sm:px-5">
                        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${product.tone}`}>
                          <Icon size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-text">{product.name}</h3>
                            {product.recommended && (
                              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">Recommended</span>
                            )}
                          </div>
                          <p className="mt-1 text-xs leading-5 text-text-muted">{product.description}</p>
                          {product.id === 'photography-credits' || product.id === 'videography-credits' ? (
                            <p className="mt-1 text-[11px] text-text-muted">Available in Karachi, Lahore &amp; Islamabad.</p>
                          ) : null}
                        </div>
                        <div className="flex w-full shrink-0 items-center justify-between gap-3 sm:w-auto sm:flex-col sm:items-end">
                          <span className="text-sm font-bold text-text">{formatPrice(product.price)}</span>
                          {quantity ? (
                            <div className="flex items-center gap-1 rounded-lg border border-border p-1">
                              <button type="button" aria-label={`Remove one ${product.name}`} onClick={() => updateQuantity(product.id, -1)} className="grid h-7 w-7 place-items-center rounded-md text-text-muted hover:bg-surface2"><Minus size={14} /></button>
                              <span className="min-w-6 text-center text-xs font-bold text-text">{quantity}</span>
                              <button type="button" aria-label={`Add one ${product.name}`} disabled={quantity >= 20} onClick={() => updateQuantity(product.id, 1)} className="grid h-7 w-7 place-items-center rounded-md text-text-muted hover:bg-surface2 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={14} /></button>
                              <button type="button" aria-label={`Remove ${product.name} from cart`} onClick={() => removeFromCart(product.id)} className="ml-1 grid h-7 w-7 place-items-center rounded-md text-danger hover:bg-danger-soft"><Trash2 size={14} /></button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => updateQuantity(product.id, 1)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-contrast transition hover:bg-primary-hover">
                              <Plus size={14} /> Add to cart
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
          <div className="lg:sticky lg:top-5"><OrderSummary /></div>
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-7">
            <button
              type="button"
              onClick={() => {
                setGatewayNotice(false);
                setStep('catalog');
              }}
              className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-text-muted transition hover:text-text"
            >
              <ArrowLeft size={16} /> Back to boosts
            </button>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary"><CreditCard size={20} /></span>
              <div>
                <h2 className="font-bold text-text">Payment method</h2>
                <p className="text-xs text-text-muted">Choose how you would like to pay.</p>
              </div>
            </div>
            {order && (
              <div className="mt-5 rounded-xl border border-border bg-surface2 p-4 text-sm">
                <p className="font-semibold text-text">Order saved: {order.id}</p>
                <p className="mt-1 text-xs text-text-muted">
                  Status: Pending payment. This order is not paid and no boosts have been activated.
                </p>
              </div>
            )}
            <div className="mt-5 rounded-xl border border-primary/40 bg-primary-soft/40 p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface text-primary"><CreditCard size={18} /></span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text">Credit or debit card</p>
                  <p className="mt-0.5 text-xs text-text-muted">Visa, Mastercard and local cards</p>
                </div>
                <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-contrast"><Check size={13} /></span>
              </div>
            </div>
            <div className="mt-5 flex gap-3 rounded-xl border border-warning/30 bg-warning-soft p-4">
              <LockKeyhole size={18} className="mt-0.5 shrink-0 text-warning" />
              <div>
                <h3 className="text-sm font-semibold text-text">Secure card checkout is not connected yet</h3>
                <p className="mt-1 text-xs leading-5 text-text-muted">
                  Your card details should only be entered in a verified payment provider’s secure checkout. Rentra has no provider configured, so this preview does not request or store card numbers or security codes.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handlePayNow}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-contrast transition hover:bg-primary-hover"
            >
              <LockKeyhole size={15} /> Pay now · {formatPrice(total)}
            </button>
            {gatewayNotice && (
              <p role="alert" className="mt-3 rounded-xl border border-warning/30 bg-warning-soft p-3 text-xs leading-5 text-text">
                Payment is unavailable until a secure provider is configured. No charge was made and your selected boosts remain in the cart.
              </p>
            )}
            <p className="mt-4 text-center text-xs text-text-muted">Your order will only be activated after a verified payment.</p>
          </section>
          <div className="lg:sticky lg:top-5"><OrderSummary /></div>
        </div>
      )}
    </div>
  );
}
