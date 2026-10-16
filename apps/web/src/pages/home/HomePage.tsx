import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BedDouble, Bell, Building2, ChevronRight, Home, MapPin, Menu, Search, ShieldCheck, Sparkles, Star, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { listingsAPI } from '../../api/listings';
import { locationsAPI } from '../../api/locations';
import { useAuthStore } from '../../store/authStore';

interface FeaturedListing {
  id: string;
  title: string;
  area: string;
  city: string;
  rent: number;
  bedrooms: number;
  rentalDuration: string;
  images?: Array<{ url: string }>;
}

export default function HomePage() {
  const [city, setCity] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const roles = user?.roles ?? (user?.role ? [user.role] : []);
  const homePath = roles.includes('LANDLORD') ? '/landlord' : '/tenant';
  const featuredListings = useQuery({
    queryKey: ['listings', 'home-featured'],
    queryFn: () => listingsAPI.getAll<FeaturedListing>({ limit: 3 }),
  });
  const cityQuery = useQuery({
    queryKey: ['locations', 'cities'],
    queryFn: () => locationsAPI.cities(),
  });
  const browseTo = `/listings${city ? `?city=${encodeURIComponent(city)}` : ''}`;

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Rentra home">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--green)] text-white"><Home size={20} /></span>
            <span className="text-[22px] font-bold tracking-tight">rentra<span className="text-[var(--green-soft)]">.</span></span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-[var(--text2)] md:flex">
            <a href="#homes" className="transition hover:text-[var(--green)]">Find a home</a>
            <a href="#how-it-works" className="transition hover:text-[var(--green)]">How it works</a>
            <a href="#trust" className="transition hover:text-[var(--green)]">Why Rentra</a>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            {isAuthenticated ? <>
              <Link to="/favorites" className="rounded-full px-3 py-2.5 text-sm font-semibold text-[var(--text2)] hover:bg-[var(--surface2)]">Favorites</Link>
              <Link to={homePath} className="rounded-full px-3 py-2.5 text-sm font-semibold text-[var(--text2)] hover:bg-[var(--surface2)]">My Rentra</Link>
              <button onClick={logout} className="rounded-full border border-[var(--border2)] px-4 py-2.5 text-sm font-semibold text-[var(--text2)]">Log out</button>
            </> : <>
              <Link to="/favorites" className="rounded-full px-3 py-2.5 text-sm font-semibold text-[var(--text2)] hover:bg-[var(--surface2)]">Favorites</Link>
              <Link to="/login" className="rounded-full px-4 py-2.5 text-sm font-semibold text-[var(--text2)] hover:bg-[var(--surface2)]">Log in</Link>
              <Link to="/register" className="rounded-full bg-[var(--green)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--green-hover)]">Get started <ArrowRight className="ml-1 inline" size={15} /></Link>
            </>}
          </div>
          <button className="rounded-lg p-2 text-[var(--text2)] transition hover:bg-[var(--surface2)] md:hidden" onClick={() => setMobileMenu(!mobileMenu)} aria-label={mobileMenu ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenu}>{mobileMenu ? <X /> : <Menu />}</button>
        </div>
        {mobileMenu && <div className="grid gap-1 border-t border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-[var(--text)] md:hidden"><a className="rounded-lg px-3 py-2 hover:bg-[var(--surface2)]" href="#homes" onClick={() => setMobileMenu(false)}>Find a home</a><Link className="rounded-lg px-3 py-2 hover:bg-[var(--surface2)]" to="/favorites" onClick={() => setMobileMenu(false)}>Favorites</Link>{isAuthenticated ? <><Link className="rounded-lg px-3 py-2 hover:bg-[var(--surface2)]" to={homePath} onClick={() => setMobileMenu(false)}>My Rentra</Link><button className="rounded-lg px-3 py-2 text-left hover:bg-[var(--surface2)]" onClick={() => { logout(); setMobileMenu(false); }}>Log out</button></> : <><Link className="rounded-lg px-3 py-2 hover:bg-[var(--surface2)]" to="/login" onClick={() => setMobileMenu(false)}>Log in</Link><Link className="rounded-lg bg-[var(--green)] px-3 py-2 text-white" to="/register" onClick={() => setMobileMenu(false)}>Create account</Link></>}</div>}
      </header>

      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-20 bg-[var(--green-dim)]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[var(--green-dim)] via-[var(--green-dim)]/95 to-[var(--green-dim)]/30 lg:to-transparent" />
        <div className="absolute inset-y-0 right-0 -z-20 hidden w-[56%] bg-cover bg-center lg:block" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=90')" }} />
        <div className="mx-auto grid min-h-[590px] max-w-7xl items-center px-5 py-16 lg:grid-cols-[1fr_0.85fr] lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border2)] bg-[var(--surface)]/75 px-3.5 py-2 text-xs font-semibold text-[var(--green)]"><Sparkles size={14} /> Pakistan ka smarter rental platform</span>
            <h1 className="mt-6 text-[42px] font-semibold leading-[1.08] tracking-[-0.045em] sm:text-6xl">A place to call home.<br /><span className="text-[var(--green-soft)]">A rental you can trust.</span></h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[var(--text2)] sm:text-lg">Find verified places, connect directly with landlords, and keep your whole renting journey in one simple place.</p>
            <form onSubmit={(event) => { event.preventDefault(); navigate(browseTo); }} className="mt-8 flex max-w-[620px] flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[var(--shadow)] sm:flex-row sm:items-center">
              <label className="flex min-h-12 flex-1 items-center gap-3 px-3"><MapPin size={19} className="shrink-0 text-[var(--green-soft)]" /><span className="min-w-0 flex-1"><span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text3)]">Location</span><input value={city} onChange={(event) => setCity(event.target.value)} placeholder="City, area or neighbourhood" className="w-full bg-transparent text-sm font-medium text-[var(--text)] outline-none placeholder:font-normal placeholder:text-[var(--text3)]" /></span></label>
              <button className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--green)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--green-hover)]"><Search size={17} /> Search homes</button>
            </form>
            {!!cityQuery.data?.length && <div className="mt-5 flex flex-wrap gap-2 text-xs text-[var(--text2)]"><span className="mr-1 self-center">Explore cities:</span>{cityQuery.data.slice(0, 5).map((item) => <button key={item.id} onClick={() => setCity(item.name)} className="rounded-full border border-[var(--border2)] bg-[var(--surface)]/65 px-3 py-1.5 transition hover:border-[var(--green-soft)] hover:text-[var(--green)]">{item.name}</button>)}</div>}
            <div className="mt-8 text-sm text-[var(--text2)]"><strong className="text-[var(--text)]">Rent with clarity.</strong> Move in with confidence.</div>
          </div>
          <div className="hidden justify-end lg:flex"><div className="w-[275px] rounded-2xl border border-[var(--border)] bg-[var(--surface)]/90 p-5"><Building2 className="text-[var(--green)]" size={28} /><p className="mt-4 text-xs text-[var(--text3)]">Browse homes that are</p><p className="mt-1 text-lg font-semibold">currently listed on Rentra</p><Link to="/listings" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--green)]">Explore listings <ArrowRight size={15} /></Link></div></div>
        </div>
      </section>

      <section id="homes" className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--green-soft)]">A good place to start</p><h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-[38px]">Homes worth coming home to</h2><p className="mt-2 text-sm text-[var(--text3)]">Published listings currently available on Rentra.</p></div><Link to="/listings" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--green)] hover:gap-2">See all homes <ArrowRight size={16} /></Link></div>
        {featuredListings.isPending ? <p className="mt-8 text-sm text-[var(--text3)]">Loading current listings...</p> : featuredListings.isError ? <div role="alert" className="mt-8 text-sm text-[var(--red)]">Current listings could not be loaded. <button onClick={() => void featuredListings.refetch()} className="underline">Retry</button></div> : featuredListings.data?.data.length ? <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{featuredListings.data.data.map((listing) => <Link key={listing.id} to={`/listings/${listing.id}`} className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] transition hover:-translate-y-1"><div className="h-56 overflow-hidden bg-[var(--surface2)]">{listing.images?.[0]?.url ? <img src={listing.images[0].url} alt={listing.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center text-sm text-[var(--text3)]">No property image</div>}</div><div className="p-4"><p className="flex items-center gap-1 text-xs text-[var(--text3)]"><MapPin size={13} />{[listing.area, listing.city].filter(Boolean).join(', ')}</p><h3 className="mt-2 font-semibold">{listing.title}</h3><div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3"><p><strong className="text-lg text-[var(--green)]">Rs. {listing.rent.toLocaleString()}</strong><span className="text-xs text-[var(--text3)]"> / {listing.rentalDuration.toLowerCase().replace('_', ' ')}</span></p><span className="flex items-center gap-1 text-xs text-[var(--text2)]"><BedDouble size={14} />{listing.bedrooms}</span></div></div></Link>)}</div> : <p className="mt-8 text-sm text-[var(--text3)]">There are no published listings to show right now.</p>}
      </section>

      <section id="trust" className="border-y border-[var(--border)] bg-[var(--surface2)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-8 lg:py-20"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--green-soft)]">Renting, with the guesswork removed</p><h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-[38px]">The details matter.<br />We help you feel sure.</h2><p className="mt-4 max-w-md text-sm leading-6 text-[var(--text2)]">From the first viewing to the monthly rent, Rentra keeps the important things clear for both tenants and landlords.</p><Link to="/register" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--green)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--green-hover)]">Explore Rentra <ArrowRight size={16} /></Link></div><div className="grid gap-3 sm:grid-cols-2">{[{ icon: <ShieldCheck />, title: 'Verified listings', body: 'Review and verification tools help build confidence in a property.' }, { icon: <Building2 />, title: 'One rental workspace', body: 'Applications, agreements, payments and maintenance, all together.' }, { icon: <Bell />, title: 'Helpful updates', body: 'See messages, application changes and reminders in one place.' }, { icon: <Star />, title: 'Trust on both sides', body: 'Profiles and reviews help tenants and landlords make informed choices.' }].map((item) => <div key={item.title} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--green-dim)] text-[var(--green-soft)]">{item.icon}</span><h3 className="mt-4 text-sm font-semibold">{item.title}</h3><p className="mt-1.5 text-xs leading-5 text-[var(--text3)]">{item.body}</p></div>)}</div></div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20"><div className="text-center"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--green-soft)]">Simple by design</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">From search to settled</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--text3)]">A straightforward flow that works for people looking for a home and people listing one.</p></div><div className="mt-10 grid gap-4 md:grid-cols-3">{[{ n:'01', title:'Find the right place', text:'Search by city and area, explore listings, and save the homes you like.' },{ n:'02', title:'Connect and agree', text:'Send a rental request, message the landlord, and manage your agreement.' },{ n:'03', title:'Stay on top of it', text:'Follow payments, maintenance and updates from your own dashboard.' }].map((item) => <div key={item.n} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"><span className="text-xs font-bold tracking-widest text-[var(--green-soft)]">{item.n}</span><h3 className="mt-4 text-lg font-semibold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-[var(--text3)]">{item.text}</p><ChevronRight className="mt-5 text-[var(--green-soft)]" size={19} /></div>)}</div></section>

      <section className="px-5 pb-16"><div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-3xl bg-[var(--green)] px-6 py-10 text-white sm:flex-row sm:items-center sm:justify-between sm:px-10"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">Your next chapter starts here</p><h2 className="mt-2 text-2xl font-semibold sm:text-3xl">Ready to find a place that feels right?</h2><p className="mt-2 text-sm text-white/85">Join Rentra and make renting a little easier.</p></div><Link to="/register" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--green)] hover:bg-[var(--surface2)]">Create your account <ArrowRight size={16} /></Link></div></section>

      <footer className="border-t border-[var(--border)] px-5 py-6"><div className="mx-auto flex max-w-7xl flex-col gap-3 text-xs text-[var(--text3)] sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} Rentra · Better renting starts here.</span><span className="flex gap-5"><Link to="/contact" className="hover:text-[var(--green)]">Contact</Link><Link to="/login" className="hover:text-[var(--green)]">Log in</Link></span></div></footer>
    </main>
  );
}
