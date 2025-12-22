'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Star, TrendingUp, Award, Users, Trash2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

const PLATFORMS = [
  { value: 'google', label: 'Google', color: 'bg-blue-100 text-blue-800' },
  { value: 'yelp', label: 'Yelp', color: 'bg-red-100 text-red-800' },
  { value: 'facebook', label: 'Facebook', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'homeadvisor', label: 'HomeAdvisor', color: 'bg-orange-100 text-orange-800' },
  { value: 'angieslist', label: "Angi", color: 'bg-green-100 text-green-800' },
  { value: 'nextdoor', label: 'Nextdoor', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'other', label: 'Other', color: 'bg-slate-100 text-slate-800' },
];

interface Review {
  id: string;
  rating: number;
  platform: string;
  reviewText?: string;
  reviewerName?: string;
  reviewDate: string;
  isVerified: boolean;
  job?: {
    jobNumber: string;
    clientName: string;
  };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  fiveStarCount: number;
  fiveStarPct: number;
  distribution: Record<number, number>;
}

function StarRating({ rating, size = 'default' }: { rating: number; size?: 'default' | 'large' }) {
  const sizeClass = size === 'large' ? 'h-6 w-6' : 'h-4 w-4';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [formData, setFormData] = useState({
    rating: 5,
    platform: 'google',
    reviewerName: '',
    reviewText: '',
    reviewDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, [filterPlatform]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (filterPlatform !== 'all') params.append('platform', filterPlatform);

      const res = await fetch(`/api/reviews?${params}`);
      const data = await res.json();
      setReviews(data.reviews || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setDialogOpen(false);
      setFormData({ rating: 5, platform: 'google', reviewerName: '', reviewText: '', reviewDate: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (error) {
      console.error('Error saving review:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    try {
      await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reviews & Reputation</h1>
          <p className="text-slate-500">Track and manage customer reviews</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Review</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Review</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Rating</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({...formData, rating: star})}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          star <= formData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300 hover:text-yellow-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Platform</Label>
                <Select value={formData.platform} onValueChange={(v) => setFormData({...formData, platform: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reviewer Name (optional)</Label>
                <Input
                  value={formData.reviewerName}
                  onChange={(e) => setFormData({...formData, reviewerName: e.target.value})}
                  placeholder="John D."
                />
              </div>
              <div>
                <Label>Review Date</Label>
                <Input
                  type="date"
                  value={formData.reviewDate}
                  onChange={(e) => setFormData({...formData, reviewDate: e.target.value})}
                />
              </div>
              <div>
                <Label>Review Text (optional)</Label>
                <Textarea
                  value={formData.reviewText}
                  onChange={(e) => setFormData({...formData, reviewText: e.target.value})}
                  placeholder="What did the customer say?"
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full">Save Review</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Average Rating</p>
                <p className="text-3xl font-bold">{stats?.averageRating.toFixed(1) || '0.0'}</p>
                <StarRating rating={Math.round(stats?.averageRating || 0)} />
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-5 w-5 text-yellow-600 fill-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Total Reviews</p>
                <p className="text-3xl font-bold">{stats?.totalReviews || 0}</p>
                <p className="text-xs text-slate-400">All platforms</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">5-Star Reviews</p>
                <p className="text-3xl font-bold">{stats?.fiveStarCount || 0}</p>
                <p className="text-xs text-green-600">{stats?.fiveStarPct.toFixed(0) || 0}% of total</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-500">Review Rate</p>
                <p className="text-3xl font-bold">--</p>
                <p className="text-xs text-slate-400">per completed job</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Rating Distribution</CardTitle>
          <CardDescription>Breakdown of reviews by star rating</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats?.distribution[rating] || 0;
              const percentage = stats?.totalReviews ? (count / stats.totalReviews) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-20">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-slate-500 w-16 text-right">{count} ({percentage.toFixed(0)}%)</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Reviews</CardTitle>
              <CardDescription>All customer reviews</CardDescription>
            </div>
            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {PLATFORMS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reviews.length > 0 ? reviews.map((review) => {
              const platform = PLATFORMS.find(p => p.value === review.platform);
              return (
                <div key={review.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <StarRating rating={review.rating} />
                      <Badge className={platform?.color}>{platform?.label}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">
                        {format(new Date(review.reviewDate), 'MMM d, yyyy')}
                      </span>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(review.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  {review.reviewerName && (
                    <p className="font-medium text-slate-900">{review.reviewerName}</p>
                  )}
                  {review.reviewText && (
                    <p className="text-slate-600 mt-1">{review.reviewText}</p>
                  )}
                  {review.job && (
                    <p className="text-sm text-slate-400 mt-2">
                      Job #{review.job.jobNumber} - {review.job.clientName}
                    </p>
                  )}
                </div>
              );
            }) : (
              <div className="text-center text-slate-500 py-8">
                No reviews yet. Click "Add Review" to track customer feedback.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
