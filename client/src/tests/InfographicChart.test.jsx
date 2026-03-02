import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import InfographicChart from '../components/movie/InfographicChart';

describe('InfographicChart', () => {
    it('shows empty state when total is 0', () => {
        render(<InfographicChart distribution={{ skip: 0, considerable: 0, goForIt: 0, excellent: 0 }} percentages={{ skip: 0, considerable: 0, goForIt: 0, excellent: 0 }} total={0} />);
        expect(screen.getByText(/no reviews yet/i)).toBeInTheDocument();
    });

    it('renders the chart when there are reviews', () => {
        const dist = { skip: 5, considerable: 3, goForIt: 10, excellent: 20 };
        const pct = { skip: 13, considerable: 8, goForIt: 26, excellent: 53 };
        render(<InfographicChart distribution={dist} percentages={pct} total={38} />);
        // Centre label shows total count
        expect(screen.getByText('38')).toBeInTheDocument();
        // Legend labels
        expect(screen.getByText('Skip')).toBeInTheDocument();
        expect(screen.getByText('Excellent')).toBeInTheDocument();
    });
});
