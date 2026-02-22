'use client';

import { useState } from 'react';

interface ReviewCard {
  /** Reviewer name. */
  name: string;
  /** Star rating 1-5. */
  rating: number;
  /** Review text / testimonial. */
  text: string;
  /** Optional reviewer title or location. */
  subtitle?: string;
  /** Optional date string. */
  date?: string;
}

interface ReviewsProps {
  /** Array of review items. */
  reviews: ReviewCard[];
  /** Section heading. */
  heading?: string;
  /** CSS class for the wrapper. */
  className?: string;
}

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="star-rating flex gap-0.5" aria-label={`Rating: ${rating} out of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          className={`h-5 w-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.368-2.448a1 1 0 00-1.176 0l-3.368 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
        </svg>
      ))}
    </div>
  );
}

/**
 * Customer reviews / testimonials section.
 *
 * Displays star ratings, review text, and reviewer info.
 * Supports expandable "show more" when there are many reviews.
 */
export function Reviews({
  reviews,
  heading = 'Customer Reviews',
  className = '',
}: ReviewsProps) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? reviews : reviews.slice(0, 3);

  if (reviews.length === 0) return null;

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className={`reviews ${className}`}>
      <div className="mb-6 flex items-center gap-4">
        <h2 className="text-xl font-semibold">{heading}</h2>
        <div className="flex items-center gap-2">
          <StarRating rating={Math.round(avg)} />
          <span className="text-sm text-[var(--color-text-secondary)]">
            {avg.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayed.map((review, idx) => (
          <div key={`${review.name}-${idx}`} className="review-card rounded-xl border border-[var(--color-border)] bg-white p-5">
            <StarRating rating={review.rating} />
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-primary)]">
              &ldquo;{review.text}&rdquo;
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-bold text-white">
                {review.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{review.name}</p>
                {review.subtitle && (
                  <p className="text-xs text-[var(--color-text-secondary)]">{review.subtitle}</p>
                )}
                {review.date && (
                  <p className="text-xs text-[var(--color-text-secondary)]">{review.date}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {reviews.length > 3 && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            {showAll ? 'Show less' : `Show all ${reviews.length} reviews`}
          </button>
        </div>
      )}
    </div>
  );
}
