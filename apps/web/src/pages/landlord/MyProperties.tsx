import { useState } from 'react';
import { Edit2, Trash2, Pause, Play, MapPin, Bed, Bath, Ruler } from 'lucide-react';
import Card from '../../components/ui/Card';

interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  status: 'active' | 'paused' | 'rented';
  tenants: number;
  image: string;
}

const MyProperties = () => {
  const [properties] = useState<Property[]>([
    {
      id: '1',
      title: 'Modern 2BR Apartment Downtown',
      location: 'Downtown, City Center',
      price: 2500,
      beds: 2,
      baths: 2,
      sqft: 950,
      status: 'active',
      tenants: 1,
      image: 'https://images.unsplash.com/photo-1545324418-cc51a28b72d5?w=500&h=300&fit=crop',
    },
    {
      id: '2',
      title: 'Cozy Studio with Garden',
      location: 'Residential Area',
      price: 1500,
      beds: 1,
      baths: 1,
      sqft: 450,
      status: 'paused',
      tenants: 0,
      image: 'https://images.unsplash.com/photo-1574431768632-424cf02e8580?w=500&h=300&fit=crop',
    },
    {
      id: '3',
      title: 'Spacious 3BR House with Backyard',
      location: 'Suburbs',
      price: 3200,
      beds: 3,
      baths: 2,
      sqft: 1500,
      status: 'rented',
      tenants: 2,
      image: 'https://images.unsplash.com/photo-1570129477492-45ea003d79d6?w=500&h=300&fit=crop',
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'rented':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Properties</h1>
        <p className="text-gray-600 dark:text-gray-300">Manage and edit your property listings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {properties.map((property) => (
          <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {/* Image */}
            <div className="h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden relative">
              <img src={property.image} alt={property.title} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(property.status)}`}>
                  {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{property.title}</h3>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <MapPin size={14} className="mr-1" />
                  {property.location}
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <Bed size={14} className="mr-1" />
                  {property.beds} bed{property.beds !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <Bath size={14} className="mr-1" />
                  {property.baths} bath{property.baths !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <Ruler size={14} className="mr-1" />
                  {property.sqft} sqft
                </div>
              </div>

              {/* Price & Tenants */}
              <div className="border-t border-gray-400 dark:border-gray-700 pt-3 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Monthly Rent</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">${property.price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Current Tenants</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{property.tenants}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                <button className="flex items-center justify-center gap-1 p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition text-xs font-semibold">
                  <Edit2 size={14} />
                  Edit
                </button>
                <button className="flex items-center justify-center gap-1 p-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-200 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800 transition text-xs font-semibold">
                  {property.status === 'paused' ? <Play size={14} /> : <Pause size={14} />}
                  {property.status === 'paused' ? 'Active' : 'Pause'}
                </button>
                <button className="flex items-center justify-center gap-1 p-2 bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-200 rounded hover:bg-purple-200 dark:hover:bg-purple-800 transition text-xs font-semibold">
                  View
                </button>
                <button title="Delete property" className="flex items-center justify-center gap-1 p-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800 transition text-xs font-semibold">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MyProperties;

