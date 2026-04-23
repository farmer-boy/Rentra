import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';

const AREA_RENT_REFERENCE: Record<string, { min: number; max: number; recommended: number }> = {
  'Gulberg III': { min: 20000, max: 50000, recommended: 35000 },
  'DHA Phase 5': { min: 30000, max: 80000, recommended: 55000 },
  'Johar Town': { min: 15000, max: 40000, recommended: 27000 },
  'Model Town': { min: 18000, max: 45000, recommended: 30000 },
  'Ichra': { min: 12000, max: 35000, recommended: 22000 },
};

interface PostPropertyForm {
  propertyType: string;
  city: string;
  area: string;
  address: string;
  monthlyRent: string;
  securityDeposit: string;
  bedrooms: string;
  areaSize: string;
  description: string;
  photos: File[];
}

export default function TenantPostProperty() {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState<PostPropertyForm>({
    propertyType: '',
    city: '',
    area: '',
    address: '',
    monthlyRent: '',
    securityDeposit: '',
    bedrooms: '',
    areaSize: '',
    description: '',
    photos: [],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const canProceed = (): boolean => {
    return (
      formData.propertyType &&
      formData.city &&
      formData.area &&
      formData.address &&
      formData.monthlyRent &&
      formData.securityDeposit &&
      formData.bedrooms &&
      formData.areaSize &&
      formData.description.length >= 20
    );
  };

  return (
    <>
      <div className="mb-6">
        <h1 className={`text-lg font-bold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Post Your Property
        </h1>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Enter property details and let AI verify everything
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Card>
            <h2 className={`text-base font-bold mb-5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Property Details
            </h2>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Property Type
                    </label>
                    <select
                      aria-label="Property Type"
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 text-sm rounded-lg border backdrop-blur-sm transition-all duration-300 ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white focus:border-green-400 focus:ring-green-500/30'
                          : 'bg-white/50 border-gray-400 text-gray-900 focus:border-green-500 focus:ring-green-500/20'
                      }`}
                    >
                      <option value="">Select</option>
                      <option value="flat">Flat</option>
                      <option value="room">Room</option>
                      <option value="house">House</option>
                      <option value="studio">Studio</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      City
                    </label>
                    <select
                      aria-label="City"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 text-sm rounded-lg border backdrop-blur-sm transition-all duration-300 ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white focus:border-green-400 focus:ring-green-500/30'
                          : 'bg-white/50 border-gray-400 text-gray-900 focus:border-green-500 focus:ring-green-500/20'
                      }`}
                    >
                      <option value="">Select</option>
                      <option value="Lahore">Lahore</option>
                      <option value="Karachi">Karachi</option>
                      <option value="Islamabad">Islamabad</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Area / Mohalla
                  </label>
                  <select
                    aria-label="Area / Mohalla"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 text-sm rounded-lg border backdrop-blur-sm transition-all duration-300 ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white focus:border-green-400 focus:ring-green-500/30'
                        : 'bg-white/50 border-gray-400 text-gray-900 focus:border-green-500 focus:ring-green-500/20'
                    }`}
                  >
                    <option value="">Select Area</option>
                    {Object.keys(AREA_RENT_REFERENCE).map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Complete Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Street number, house number..."
                    className={`w-full px-3 py-2 text-sm rounded-lg border backdrop-blur-sm transition-all duration-300 ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-green-400 focus:ring-green-500/30'
                        : 'bg-white/50 border-gray-400 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Monthly Rent (Rs)
                    </label>
                    <input
                      type="number"
                      name="monthlyRent"
                      value={formData.monthlyRent}
                      onChange={handleInputChange}
                      placeholder="e.g. 25000"
                      className={`w-full px-3 py-2 text-sm rounded-lg border backdrop-blur-sm transition-all duration-300 ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-green-400 focus:ring-green-500/30'
                          : 'bg-white/50 border-gray-400 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Security Deposit (Rs)
                    </label>
                    <input
                      type="number"
                      name="securityDeposit"
                      value={formData.securityDeposit}
                      onChange={handleInputChange}
                      placeholder="e.g. 50000"
                      className={`w-full px-3 py-2 text-sm rounded-lg border backdrop-blur-sm transition-all duration-300 ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-green-400 focus:ring-green-500/30'
                          : 'bg-white/50 border-gray-400 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Bedrooms
                    </label>
                    <select
                      aria-label="Number of Bedrooms"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 text-sm rounded-lg border backdrop-blur-sm transition-all duration-300 ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white focus:border-green-400 focus:ring-green-500/30'
                          : 'bg-white/50 border-gray-400 text-gray-900 focus:border-green-500 focus:ring-green-500/20'
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
                    <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Area (SQFT)
                    </label>
                    <input
                      type="number"
                      name="areaSize"
                      value={formData.areaSize}
                      onChange={handleInputChange}
                      placeholder="e.g. 800"
                      className={`w-full px-3 py-2 text-sm rounded-lg border backdrop-blur-sm transition-all duration-300 ${
                        isDark
                          ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-green-400 focus:ring-green-500/30'
                          : 'bg-white/50 border-gray-400 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Detailed description about property..."
                    rows={3}
                    className={`w-full px-3 py-2 text-sm rounded-lg border backdrop-blur-sm resize-none transition-all duration-300 ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-green-400 focus:ring-green-500/30'
                        : 'bg-white/50 border-gray-400 text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-green-500/20'
                    }`}
                  />
                </div>

                <button
                  disabled={!canProceed()}
                  className={`w-full py-2 text-sm rounded-lg font-semibold tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                    canProceed()
                      ? isDark
                        ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg shadow-green-500/30'
                        : 'bg-gradient-to-r from-green-500 to-green-400 hover:from-green-600 hover:to-green-500 text-white shadow-lg shadow-green-400/30'
                      : isDark
                        ? 'bg-gray-700 text-gray-500'
                        : 'bg-gray-300 text-gray-500'
                  }`}
                >
                  Continue → AI Scan
                </button>
              </div>
            </Card>
          </div>

          <div>
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🤖</span>
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  AI Pre-Check
                </h3>
              </div>

              <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Our AI will automatically verify:
              </p>

              <div className="space-y-3">
                <div className={`p-3 rounded-lg border backdrop-blur-sm ${
                  isDark
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white/30 border-gray-400/50'
                }`}>
                  <div className="flex items-start gap-2">
                    <span className="text-xl">📸</span>
                    <div>
                      <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Photos are authentic (not stolen)
                      </p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        AI will check if photos match property description
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-3 rounded-lg border backdrop-blur-sm ${
                  isDark
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white/30 border-gray-400/50'
                }`}>
                  <div className="flex items-start gap-2">
                    <span className="text-xl">💰</span>
                    <div>
                      <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Price is competitive for the area
                      </p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        AI will compare with market rates in your area
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-3 rounded-lg border backdrop-blur-sm ${
                  isDark
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white/30 border-gray-400/50'
                }`}>
                  <div className="flex items-start gap-2">
                    <span className="text-xl">👤</span>
                    <div>
                      <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Account posting frequency is normal
                      </p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        AI will verify your posting patterns are legitimate
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`p-3 rounded-lg border backdrop-blur-sm ${
                  isDark
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white/30 border-gray-400/50'
                }`}>
                  <div className="flex items-start gap-2">
                    <span className="text-xl">✍️</span>
                    <div>
                      <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Description is genuine
                      </p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        AI will check if description matches the property details
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`mt-4 p-3 rounded-lg border ${
                isDark
                  ? 'bg-green-500/10 border-green-500/40 text-green-300'
                  : 'bg-green-50/80 border-green-200/60 text-green-800'
              }`}>
                <p className="text-xs font-semibold flex items-start gap-2">
                  <span>✅</span>
                  <span>Your listing will go live after AI verification is complete</span>
                </p>
              </div>
            </Card>
          </div>
        </div>
    </>
  );
}

