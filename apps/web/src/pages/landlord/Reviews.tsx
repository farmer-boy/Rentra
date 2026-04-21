import { Star, MessageCircle } from 'lucide-react';
import Card from '../../components/ui/Card';

interface Review {
  id: string;
  reviewerName: string;
  reviewerRole: string;
  rating: number;
  text: string;
  date: string;
  property: string;
  category: string;
}

const LandlordReviews = () => {
  const reviews: Review[] = [
    {
      id: '1',
      reviewerName: 'John Smith',
      reviewerRole: 'Tenant',
      rating: 5,
      text: 'Excellent landlord! Responsive to issues, professional, and maintains the property well. Highly recommended for anyone looking to rent.',
      date: '2024-03-20',
      property: 'Modern 2BR Apartment Downtown',
      category: 'Communication',
    },
    {
      id: '2',
      reviewerName: 'Sarah Johnson',
      reviewerRole: 'Tenant',
      rating: 5,
      text: 'Wonderful experience renting from them. The property is well-maintained and the landlord is very accommodating. Would definitely rent again!',
      date: '2024-03-15',
      property: 'Spacious 3BR House with Backyard',
      category: 'Property Maintenance',
    },
    {
      id: '3',
      reviewerName: 'Michael Brown',
      reviewerRole: 'Tenant',
      rating: 4,
      text: 'Good landlord overall. Property is nice and maintenance requests are handled promptly. Minor issues with communication sometimes.',
      date: '2024-02-28',
      property: 'Spacious 3BR House with Backyard',
      category: 'Overall',
    },
  ];

  const averageRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Reviews</h1>
        <p className="text-gray-600 dark:text-gray-300">See what your tenants are saying about you</p>
      </div>

      {/* Overall Rating Summary */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Overall Rating</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="text-5xl font-bold text-gray-900 dark:text-white">{averageRating}</div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={i < Math.round(parseFloat(averageRating)) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                  />
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Based on {reviews.length} reviews</p>
          </div>
          <div className="text-right">
            <div className="inline-flex flex-col items-end space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{rating}★</span>
                  <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${(reviews.filter(r => r.rating === rating).length / reviews.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-6">{reviews.filter(r => r.rating === rating).length}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Recent Reviews</h3>
        {reviews.map((review) => (
          <Card key={review.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{review.reviewerName}</h4>
                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                    {review.reviewerRole}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <MessageCircle size={14} className="inline mr-1" />
                  {review.property}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                  />
                ))}
                <span className="ml-2 font-semibold text-gray-900 dark:text-white">{review.rating}</span>
              </div>
            </div>

            <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">{review.text}</p>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
              <span>Category: {review.category}</span>
              <span>{new Date(review.date).toLocaleDateString()}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LandlordReviews;
