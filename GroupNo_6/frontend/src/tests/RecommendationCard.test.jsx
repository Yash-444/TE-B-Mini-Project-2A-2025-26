import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RecommendationCard from '../components/RecommendationCard';

const mockOutfit = {
  id: '1',
  name: 'Test Outfit',
  category: 'Topwear',
  imageUrl: 'https://example.com/image.jpg',
  tags: ['casual', 'comfortable'],
  priceRange: 'mid',
  styleScore: 8.5
};

const mockHandlers = {
  onLike: jest.fn(),
  onSave: jest.fn(),
  onView: jest.fn()
};

describe('RecommendationCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders outfit information correctly', () => {
    render(
      <RecommendationCard
        outfit={mockOutfit}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Test Outfit')).toBeInTheDocument();
    expect(screen.getByText('Topwear')).toBeInTheDocument();
    expect(screen.getByText('casual')).toBeInTheDocument();
    expect(screen.getByText('8.5')).toBeInTheDocument();
  });

  it('handles like button click', async () => {
    render(
      <RecommendationCard
        outfit={mockOutfit}
        {...mockHandlers}
      />
    );

    const likeButton = screen.getByRole('button', { name: /like/i });
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(mockHandlers.onLike).toHaveBeenCalledWith(mockOutfit);
    });
  });

  it('handles save button click', async () => {
    render(
      <RecommendationCard
        outfit={mockOutfit}
        {...mockHandlers}
      />
    );

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockHandlers.onSave).toHaveBeenCalledWith(mockOutfit);
    });
  });

  it('shows fallback image on image error', () => {
    render(
      <RecommendationCard
        outfit={{ ...mockOutfit, imageUrl: 'broken-url' }}
        {...mockHandlers}
      />
    );

    const image = screen.getByAltText('Test Outfit');
    fireEvent.error(image);

    expect(image.src).toContain('unsplash.com');
  });

  it('displays liked state correctly', () => {
    render(
      <RecommendationCard
        outfit={mockOutfit}
        isLiked={true}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Liked')).toBeInTheDocument();
  });
});
