import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/client';

const PROPERTY_TYPES = ['House', 'Apartment', 'Flat', 'Portion', 'Room', 'Hostel', 'Hotel', 'Guest House', 'Studio', 'Farmhouse', 'PG / Paying Guest', 'Shared Room'];
const IMAGE_CATEGORIES = ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Balcony', 'Building Exterior', 'Parking'];

interface PostPropertyForm {
  propertyType: string;
  title: string;
  country: string;
  province: string;
  city: string;
  area: string;
  blockSector: string;
  address: string;
  monthlyRent: string;
  securityDeposit: string;
  bedrooms: string;
  areaSize: string;
  description: string;
  rules: string;
  imageUrl: string;
  amenities: string;
  photos: File[];
}

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDark: boolean;
}

const SearchableSelect = ({ options, value, onChange, placeholder = 'Search...', isDark }: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-sm rounded-lg border-2 backdrop-blur-sm transition-all duration-300 text-left flex items-center justify-between ${
          isDark
            ? 'bg-[#1a2332] border-[#2d3e52] text-white hover:bg-[#1f2938] hover:border-[#3a4a63]'
            : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-gray-300'
        } ${value ? 'font-medium' : 'text-gray-500'}`}
      >
        <span>{value || placeholder}</span>
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <div className={`absolute top-full left-0 right-0 mt-1 border-2 rounded-lg shadow-lg z-50 backdrop-blur-sm ${
          isDark
            ? 'bg-[#1a2332] border-[#2d3e52]'
            : 'bg-white border-gray-200'
        }`}>
          <input
            type="text"
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full px-3 py-2 border-b-2 text-sm transition-all ${
              isDark
                ? 'bg-[#1a2332] border-[#2d3e52] text-white placeholder-gray-500 focus:outline-none focus:ring-0'
                : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0'
            }`}
          />
          <div className="max-h-48 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full px-3 py-2 text-sm text-left transition-all ${
                    value === opt
                      ? isDark
                        ? 'bg-green-600/40 text-green-300 font-semibold'
                        : 'bg-green-100 text-green-800 font-semibold'
                      : isDark
                        ? 'text-white hover:bg-[#2d3e52]'
                        : 'text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {opt}
                </button>
              ))
            ) : (
              <div className={`px-3 py-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function LandlordPostProperty() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<PostPropertyForm>({
    propertyType: '',
    title: '',
    country: '',
    province: '',
    city: '',
    area: '',
    blockSector: '',
    address: '',
    monthlyRent: '',
    securityDeposit: '',
    bedrooms: '',
    areaSize: '',
    description: '',
    rules: '',
    imageUrl: '',
    amenities: '',
    photos: [],
  });

  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const canProceed = (): boolean => {
    const isValid: boolean = !!(
      formData.propertyType &&
      formData.title &&
      formData.country &&
      formData.province &&
      formData.city &&
      formData.area &&
      formData.address &&
      formData.monthlyRent &&
      formData.securityDeposit &&
      formData.bedrooms &&
      formData.areaSize &&
      formData.description.length >= 20
    );
    return isValid;
  };

  const submitProperty = async () => {
    if (!canProceed()) return;
    setSubmitting(true);
    try {
      const response = await api.post('/listings', {
        title: formData.title,
        description: formData.description,
        rules: formData.rules,
        propertyType: ({
          'PG / Paying Guest': 'PG',
          'Shared Room': 'SHARED_ROOM',
          'Guest House': 'GUEST_HOUSE',
          Farmhouse: 'FARMHOUSE',
          Hotel: 'HOTEL',
        } as Record<string, string>)[formData.propertyType] ?? formData.propertyType.toUpperCase(),
        country: formData.country,
        province: formData.province,
        city: formData.city,
        area: formData.area,
        blockSector: formData.blockSector,
        address: formData.address,
        rent: Number(formData.monthlyRent),
        deposit: Number(formData.securityDeposit),
        bedrooms: Number(formData.bedrooms),
        bathrooms: 1,
        sqft: Number(formData.areaSize),
        imageUrl: formData.imageUrl || undefined,
        amenities: formData.amenities.split(',').map((item) => item.trim()).filter(Boolean),
      });
      const listingId = response.data.data.id;
      for (const [index, photo] of formData.photos.entries()) {
        const upload = new FormData();
        upload.append('file', photo);
        upload.append('altText', IMAGE_CATEGORIES[index] ?? `Property image ${index + 1}`);
        upload.append('sortOrder', String(index));
        await api.post(`/listings/${listingId}/images/upload`, upload, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      toast.success('Property submitted for admin verification');
      navigate('/landlord');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Property could not be submitted');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-[#0f0f0f] via-[#1a1a2e] to-[#0f0f0f]' : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            📌 Post Your Property
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Enter your property details and submit them for admin review.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Property Details */}
          <div className="lg:col-span-3">
            <Card>
              <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Property Details
              </h2>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Country
                    </label>
                    <input name="country" value={formData.country} onChange={handleInputChange} className="w-full px-3 py-2 text-sm rounded-lg border" />
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Province
                    </label>
                    <input name="province" value={formData.province} onChange={handleInputChange} className="w-full px-3 py-2 text-sm rounded-lg border" />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Property images</label>
                  <input type="file" accept="image/*" multiple onChange={(event) => setFormData((current) => ({ ...current, photos: Array.from(event.target.files ?? []).slice(0, 12) }))} className="w-full text-sm" />
                  {formData.photos.length > 0 && <div className="mt-2 grid grid-cols-4 gap-2">{formData.photos.map((photo, index) => <div key={`${photo.name}-${index}`} className="relative"><img src={URL.createObjectURL(photo)} alt={IMAGE_CATEGORIES[index] ?? photo.name} className="h-16 w-full rounded object-cover" /><span className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 text-[9px] text-white">{IMAGE_CATEGORIES[index] ?? `Image ${index + 1}`}</span></div>)}</div>}
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Property Title</label>
                  <input name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. University Boys Hostel" className="w-full px-3 py-2 text-sm rounded-lg border" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Property Type
                    </label>
                    <SearchableSelect
                      options={PROPERTY_TYPES}
                      value={formData.propertyType}
                      onChange={(val) => setFormData(prev => ({ ...prev, propertyType: val }))}
                      placeholder="Search property..."
                      isDark={isDark}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      City
                    </label>
                    <input name="city" value={formData.city} onChange={handleInputChange} placeholder="Enter city" className="w-full px-3 py-2 text-sm rounded-lg border" />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Area / Mohalla
                  </label>
                  <input name="area" value={formData.area} onChange={handleInputChange} placeholder="Enter area or mohalla" className="w-full px-3 py-2 text-sm rounded-lg border" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div><label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Amenities</label><input name="amenities" value={formData.amenities} onChange={handleInputChange} placeholder="WiFi, Parking, Security" className="w-full px-3 py-2 text-sm rounded-lg border" /></div>
                  <div><label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Image URL</label><input name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} placeholder="https://..." className="w-full px-3 py-2 text-sm rounded-lg border" /></div>
                </div>

                <div><label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Rules</label><textarea name="rules" value={formData.rules} onChange={handleInputChange} placeholder="No smoking, family preferred..." rows={2} className="w-full px-3 py-2 text-sm rounded-lg border" /></div>

                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Block / Sector
                  </label>
                  <input name="blockSector" value={formData.blockSector} onChange={handleInputChange} placeholder="e.g. Block H" className="w-full px-3 py-2 text-sm rounded-lg border" />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Complete Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Street number, house number..."
                    className={`w-full px-3 py-2 text-sm rounded-lg border-2 backdrop-blur-sm transition-all duration-300 ${
                      isDark
                        ? 'bg-[#1a2332] border-[#2d3e52] text-white placeholder-gray-400 focus:border-green-400'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Monthly Rent (Rs)
                    </label>
                    <input
                      type="number"
                      name="monthlyRent"
                      value={formData.monthlyRent}
                      onChange={handleInputChange}
                      placeholder="e.g. 25000"
                      className={`w-full px-3 py-2 text-sm rounded-lg border-2 backdrop-blur-sm transition-all duration-300 ${
                        isDark
                          ? 'bg-[#1a2332] border-[#2d3e52] text-white placeholder-gray-400 focus:border-green-400'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Security Deposit (Rs)
                    </label>
                    <input
                      type="number"
                      name="securityDeposit"
                      value={formData.securityDeposit}
                      onChange={handleInputChange}
                      placeholder="e.g. 50000"
                      className={`w-full px-3 py-2 text-sm rounded-lg border-2 backdrop-blur-sm transition-all duration-300 ${
                        isDark
                          ? 'bg-[#1a2332] border-[#2d3e52] text-white placeholder-gray-400 focus:border-green-400'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Bedrooms
                    </label>
                    <select
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 text-sm rounded-lg border-2 backdrop-blur-sm transition-all duration-300 ${
                        isDark
                          ? 'bg-[#1a2332] border-[#2d3e52] text-white focus:border-green-400'
                          : 'bg-white border-gray-200 text-gray-900 focus:border-green-500'
                      }`}
                    >
                      <option value="">Select</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4+</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Area (SQFT)
                    </label>
                    <input
                      type="number"
                      name="areaSize"
                      value={formData.areaSize}
                      onChange={handleInputChange}
                      placeholder="e.g. 800"
                      className={`w-full px-3 py-2 text-sm rounded-lg border-2 backdrop-blur-sm transition-all duration-300 ${
                        isDark
                          ? 'bg-[#1a2332] border-[#2d3e52] text-white placeholder-gray-400 focus:border-green-400'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Description (20+ characters)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Detailed description about property..."
                    rows={3}
                    className={`w-full px-3 py-2 text-sm rounded-lg border-2 backdrop-blur-sm resize-none transition-all duration-300 ${
                      isDark
                        ? 'bg-[#1a2332] border-[#2d3e52] text-white placeholder-gray-400 focus:border-green-400'
                        : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-green-500'
                    }`}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void submitProperty()}
                  disabled={!canProceed() || submitting}
                  className={`w-full mt-3 py-2 rounded-lg text-xs font-bold ${canProceed() && !submitting ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                >
                  {submitting ? 'Submitting...' : 'Submit for admin verification'}
                </button>
              </div>
            </Card>
          </div>

          {/* Right: Submission information */}
          <div className="lg:col-span-2">
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📋</span>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Listing review
                </h3>
              </div>

              <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Submitted properties are saved as unpublished and pending review.
              </p>
              <div className={`p-3 rounded-lg text-xs leading-relaxed ${
                isDark
                  ? 'bg-blue-500/10 border border-blue-500/30 text-blue-200'
                  : 'bg-blue-50/80 border border-blue-200/60 text-blue-900'
              }`}>
                <p>
                  Listings are not automatically published. The API does not currently provide AI checks or an estimated review time.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
