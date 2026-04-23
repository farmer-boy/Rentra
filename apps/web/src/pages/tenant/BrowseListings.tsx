import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import Pill from '../../components/ui/Pill';

interface Listing {
  id: string;
  title: string;
  location: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  status: 'verified' | 'flagged' | 'pending';
  emoji: string;
}

const listings: Listing[] = [
  { id: '1', title: '2 Bedroom Flat', location: 'Gulberg III, Lahore', price: 22000, beds: 2, baths: 1, sqft: 850, status: 'verified', emoji: '🏢' },
  { id: '2', title: 'Single Room', location: 'Johar Town, Lahore', price: 9500, beds: 1, baths: 1, sqft: 300, status: 'verified', emoji: '🏠' },
  { id: '3', title: '3 Bed House', location: 'Model Town, Lahore', price: 35000, beds: 3, baths: 2, sqft: 1200, status: 'flagged', emoji: '🏗️' },
  { id: '4', title: 'Studio Flat', location: 'DHA Phase 5, Lahore', price: 31000, beds: 0, baths: 1, sqft: 600, status: 'pending', emoji: '🏢' },
  { id: '5', title: 'Room Share (2 Boys)', location: 'Ichra, Lahore', price: 8000, beds: 1, baths: 1, sqft: 200, status: 'verified', emoji: '🏠' },
  { id: '6', title: '2 Bed Upper Portion', location: 'Faisal Town, Lahore', price: 18000, beds: 2, baths: 1, sqft: 700, status: 'verified', emoji: '🏢' },
];

export default function BrowseListings() {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const statusStyles = {
    verified: <Pill variant="green">✓ AI Verified</Pill>,
    flagged: <Pill variant="red">⚠ AI Flagged</Pill>,
    pending: <Pill variant="yellow">⏳ Pending</Pill>,
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className={`text-xl font-extrabold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Browse Listings 🏠</h2>
        <p className={`text-[13px] ${isDark ? 'text-gray-700' : 'text-gray-500'}`}>Available rental properties in Lahore</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2 md:gap-3 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="🔍 Search area or property..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`flex-1 min-w-0 md:min-w-64 ${isDark ? 'bg-[#1f1f1f] border-white/10 text-white placeholder-[#666]' : 'bg-white border-gray-400 text-black placeholder-gray-400'} border rounded-lg px-4 py-2 text-[13px] outline-none focus:border-green-500 transition-colors`}
        />
        <button className={`px-4 py-2 ${isDark ? 'bg-[#1f1f1f] border-white/10 text-gray-300 hover:text-white hover:bg-[#2a2a2a]' : 'bg-white border-gray-400 text-black hover:bg-gray-100'} border rounded-lg text-[13px] font-semibold transition-colors`}>All</button>
        <button className={`px-4 py-2 ${isDark ? 'bg-[#1f1f1f] border-white/10 text-gray-300 hover:text-white hover:bg-[#2a2a2a]' : 'bg-white border-gray-400 text-black hover:bg-gray-100'} border rounded-lg text-[13px] font-semibold transition-colors`}>Flat</button>
        <button className={`px-4 py-2 ${isDark ? 'bg-[#1f1f1f] border-white/10 text-gray-300 hover:text-white hover:bg-[#2a2a2a]' : 'bg-white border-gray-400 text-black hover:bg-gray-100'} border rounded-lg text-[13px] font-semibold transition-colors`}>Room</button>
        <button className={`px-4 py-2 ${isDark ? 'bg-[#1f1f1f] border-white/10 text-gray-300 hover:text-white hover:bg-[#2a2a2a]' : 'bg-white border-gray-400 text-black hover:bg-gray-100'} border rounded-lg text-[13px] font-semibold transition-colors`}>House</button>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {listings.map((listing) => (
          <Card key={listing.id} className="cursor-pointer transition-all hover:-translate-y-0.5">
            <div className={`h-32 ${isDark ? 'bg-[#1f1f1f]' : 'bg-gray-100'} rounded-lg flex items-center justify-center text-4xl mb-3 relative`}>
              {listing.emoji}
              <div className="absolute top-2 left-2 text-[10px] font-mono font-bold px-2 py-1 rounded">
                {statusStyles[listing.status]}
              </div>
            </div>
            <h3 className={`font-bold text-[14px] mb-1 ${isDark ? 'text-white' : 'text-black'}`}>{listing.title}</h3>
            <p className={`text-[12px] mb-2 ${isDark ? 'text-gray-700' : 'text-gray-500'}`}>📍 {listing.location}</p>
            <p className="text-[15px] font-extrabold text-green-500 mb-2">
              Rs {listing.price.toLocaleString()} <span className={`text-[11px] ${isDark ? 'text-gray-700' : 'text-gray-500'}`}>/ month</span>
            </p>
            <div className={`flex gap-3 text-[11px] ${isDark ? 'text-gray-700' : 'text-gray-500'}`}>
              <span>🛏 {listing.beds} Bed{listing.beds !== 1 ? 's' : ''}</span>
              <span>🚿 {listing.baths} Bath</span>
              <span>📐 {listing.sqft} sqft</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}


