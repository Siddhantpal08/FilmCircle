import { useState } from 'react';
import { reviewService } from '../../services';

const OPINIONS = [
    { key: 'skip', emoji: '⏭️', label: 'Skip' },
    { key: 'considerable', emoji: '🤔', label: 'Considerable' },
    { key: 'goForIt', emoji: '✅', label: 'Go For It' },
    { key: 'excellent', emoji: '⭐', label: 'Excellent' },
];

export default function ReviewButtons({ movieId, existingReview, onUpdate }) {
    const [selected, setSelected] = useState(existingReview?.opinion || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleClick = async (opinion) => {
        if (loading) return;
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            if (existingReview || selected) {
                // update existing review
                const reviewId = existingReview?._id;
                if (reviewId) {
                    await reviewService.update(reviewId, { opinion });
                } else {
                    await reviewService.submit({ movieId, opinion });
                }
                setSuccess('Review updated!');
            } else {
                await reviewService.submit({ movieId, opinion });
                setSuccess('Review submitted!');
            }
            setSelected(opinion);
            if (onUpdate) onUpdate();
        } catch (err) {
            const msg = err.response?.data?.message;
            if (err.response?.status === 409 && err.response?.data?.reviewId) {
                // Has existing review — try updating it
                try {
                    await reviewService.update(err.response.data.reviewId, { opinion });
                    setSelected(opinion);
                    setSuccess('Review updated!');
                    if (onUpdate) onUpdate();
                } catch {
                    setError('Could not update review.');
                }
            } else {
                setError(msg || 'Failed to submit review.');
            }
        } finally {
            setLoading(false);
            setTimeout(() => setSuccess(''), 2500);
        }
    };

    return (
        <div>
            <div className="review-btn-grid">
                {OPINIONS.map(({ key, emoji, label }) => (
                    <button
                        key={key}
                        id={`opinion-${key}`}
                        className={`opinion-btn ${selected === key ? `active-${key}` : ''}`}
                        onClick={() => handleClick(key)}
                        disabled={loading}
                    >
                        <span style={{ fontSize: '1.4rem' }}>{emoji}</span>
                        <span>{label}</span>
                    </button>
                ))}
            </div>
            {error && <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ marginTop: '0.75rem' }}>✓ {success}</div>}
            <style>{`
        .review-btn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-top: 0.75rem; }
        .opinion-btn { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; padding: 0.75rem; }
      `}</style>
        </div>
    );
}
