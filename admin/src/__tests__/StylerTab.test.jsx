import { render, screen } from '@testing-library/react';
import StylerTab from '../components/StylerTab';
import { describe, it, expect } from 'vitest';

describe('StylerTab', () => {
    it('renders style settings', () => {
        const mockSettings = {
            primary_color: '#000000',
            border_radius: 5
        };

        render(<StylerTab settings={mockSettings} onChange={() => { }} />);

        expect(screen.getByText(/Result Background/i)).toBeInTheDocument();
        expect(screen.getByText(/Border Radius/i)).toBeInTheDocument();
    });
});
