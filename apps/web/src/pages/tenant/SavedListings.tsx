import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import Pill from '../../components/ui/Pill';

interface SavedListing {
  id: string;
  title: string;
  location: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  landlordTrust: number;
  savedDate: string;
  emoji: string;
}

const savedListings: SavedListing[] = [
  { id: '1', title: '2 Bedroom Flat', location: 'Gulberg III, Lahore', price: 22000, beds: 2, baths: 1, sqft: 850, landlordTrust: 95, savedDate: '2 days ago', emoji: '🏢' },
  { id: '2', title: '3 Bed House', location: 'Model Town, Lahore', price: 35000, beds: 3, baths: 2, sqft: 1200, landlordTrust: 88, savedDate: '5 days ago', emoji: '🏗️' },
  { id: '3', title: 'Studio Flat', location: 'DHA Phase 5, Lahore', price: 31000, beds: 1, baths: 1, sqft: 550, landlordTrust: 92, savedDate: '1 week ago', emoji: '🏠' },
];

export default function SavedListings() {
  const { isDark } = useTheme();

  return (
    <div>
      <div className="mb-6">
        <h1 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
          Saved Listings ⭐
        </h1>
        <p className={`text-[13px] ${isDark ? 'text-[#555]' : 'text-gray-600'} mt-1`}>Apni pasand ke listings dekho</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {savedListings.map(listing => (
          <Card key={listing.id}>
            <div className="flex gap-4">
              <div className="text-4xl">{listing.emoji}</div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{listing.title}</h3>
                    <p className={`text-sm ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>{listing.location}</p>
                  </div>
                  <Pill variant="green">
                    Rs {listing.price.toLocaleString()}
                  </Pill>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mb-3 text-[12px]">
                  <div>
                    <span className={`${isDark ? 'text-[#555]' : 'text-gray-500'}`}>{listing.beds} Beds</span>
                  </div>
                  <div>
                    <span className={`${isDark ? 'text-[#555]' : 'text-gray-500'}`}>{listing.baths} Baths</span>
                  </div>
                  <div>
                    <span className={`${isDark ? 'text-[#555]' : 'text-gray-500'}`}>{listing.sqft} SQFT</span>
                  </div>
                  <div>
                    <span className="text-yellow-500">⭐ {listing.landlordTrust}% Trust</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-mono ${isDark ? 'text-[#555]' : 'text-gray-500'}`}>
                    Saved {listing.savedDate}
                  </span>
                  <div className="flex gap-2">
                    <button className={`text-[12px] px-3 py-1.5 rounded transition-colors ${
                      isDark 
                        ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}>
                      View Details
                    </button>
                    <button className={`text-[12px] px-3 py-1.5 rounded transition-colors ${
                      isDark 
                        ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}>
                      Unsave
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {savedListings.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <p className={`text-sm ${isDark ? 'text-[#555]' : 'text-gray-500'}`}>
              Koi listings save nahi kiye ho abhi. 🔍
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
