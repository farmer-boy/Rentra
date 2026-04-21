import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import Card from '../../components/ui/Card';
import Pill from '../../components/ui/Pill';

interface Review {
  id: string;
  landlordName: string;
  property: string;
  rating: number;
  comment: string;
  date: string;
  emoji: string;
}

interface TenantRating {
  id: string;
  category: string;
  value: number;
  description: string;
}

const myReviews: Review[] = [
  {
    id: '1',
    landlordName: 'Ahmed Khan',
    property: '2 Bed Flat, Gulberg III',
    rating: 5,
    comment: 'Ahmed bhai bahut ache hain, property maintained hai, aur sirf rent ke baare mein hasad nahi',
    date: '2026-04-10',
    emoji: '⭐',
  },
  {
    id: '2',
    landlordName: 'Fatima Ali',
    property: 'Studio, DHA Ph 5',
    rating: 4,
    comment: 'Dev repairs mein thora slow hain, par overall achaa experience',
    date: '2026-03-28',
    emoji: '⭐',
  },
];

const myRatings: TenantRating[] = [
  {
    id: '1',
    category: 'Payment History',
    value: 95,
    description: 'Hmesh on-time payments',
  },
  {
    id: '2',
    category: 'Property Care',
    value: 88,
    description: 'Property ko acha rakhte ho',
  },
  {
    id: '3',
    category: 'Communication',
    value: 92,
    description: 'Issues quickly report karte ho',
  },
  {
    id: '4',
    category: 'Trust Score',
    value: 90,
    description: 'Verified tenant with good history',
  },
];

export default function ReviewsAndRatings() {
  const { isDark } = useTheme();
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="mb-6">
        <h1 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
          My Reviews & Ratings ⭐
        </h1>
        <p className={`text-[13px] ${isDark ? 'text-[#555]' : 'text-gray-600'} mt-1`}>Apni reviews aur overall rating dekho</p>
      </div>

      {/* Overall Rating Card */}
      <Card className="mb-6">
        <div className="text-center py-6">
          <div className="text-6xl mb-2">⭐</div>
          <div className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            {(myRatings.reduce((a, b) => a + b.value, 0) / myRatings.length).toFixed(1)}
          </div>
          <p className={`text-sm ${isDark ? 'text-[#555]' : 'text-gray-600'} mt-2`}>
            {myRatings.length} categories rated
          </p>
        </div>
      </Card>

      {/* Rating Breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {myRatings.map(rating => (
          <Card key={rating.id}>
            <div className="mb-2 flex justify-between items-center">
              <h3 className={`text-[12px] font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                {rating.category}
              </h3>
              <span className="text-lg text-yellow-500">{rating.value}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-yellow-500 rounded-full transition-all"
                style={{ width: `${rating.value}%` }}
              />
            </div>
            <p className={`text-[11px] ${isDark ? 'text-[#555]' : 'text-gray-500'}`}>
              {rating.description}
            </p>
          </Card>
        ))}
      </div>

      {/* Reviews Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            Reviews I've Given ({myReviews.length})
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`text-[12px] px-3 py-1.5 rounded font-semibold transition-all ${
              isDark
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {showForm ? 'Cancel' : 'Write Review'}
          </button>
        </div>

        {showForm && (
          <Card className="mb-4">
            <form className="space-y-4">
              <div>
                <label className={`block text-[12px] font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Select Landlord
                </label>
                <select
                  aria-label="Select Landlord"
                  className={`w-full px-3 py-2 text-sm rounded border ${
                    isDark
                      ? 'bg-[#1f1f1f] border-white/10 text-white'
                      : 'bg-gray-50 border-gray-300 text-black'
                  } focus:outline-none focus:border-green-500`}
                >
                  <option>Ahmed Khan (Gulberg III)</option>
                  <option>Fatima Ali (DHA Ph 5)</option>
                </select>
              </div>

              <div>
                <label className={`block text-[12px] font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Rating (1-5 stars)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button
                      key={i}
                      type="button"
                      className="text-2xl hover:scale-110 transition-transform"
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-[12px] font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Your Review
                </label>
                <textarea
                  placeholder="Share your experience..."
                  rows={3}
                  className={`w-full px-3 py-2 text-sm rounded border resize-none ${
                    isDark
                      ? 'bg-[#1f1f1f] border-white/10 text-white placeholder-[#666]'
                      : 'bg-gray-50 border-gray-300 text-black placeholder-gray-500'
                  } focus:outline-none focus:border-green-500`}
                />
              </div>

              <button
                type="submit"
                className={`w-full py-2 rounded font-semibold text-sm ${
                  isDark
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                } transition-colors`}
              >
                Post Review
              </button>
            </form>
          </Card>
        )}

        <div className="space-y-4">
          {myReviews.map(review => (
            <Card key={review.id}>
              <div className="flex gap-3 mb-3">
                <div className="text-2xl">{review.emoji}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-black'}`}>
                        {review.landlordName}
                      </h3>
                      <p className={`text-[11px] ${isDark ? 'text-[#555]' : 'text-gray-600'}`}>
                        {review.property}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-yellow-500">
                        {'⭐'.repeat(review.rating)}
                      </div>
                      <p className={`text-[10px] font-mono ${isDark ? 'text-[#555]' : 'text-gray-500'}`}>
                        {review.date}
                      </p>
                    </div>
                  </div>
                  <p className={`text-[12px] ${isDark ? 'text-[#aaa]' : 'text-gray-700'} mt-2`}>
                    {review.comment}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
