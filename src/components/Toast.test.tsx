import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Toast } from './Toast';

describe('Toast', () => {
  it('renders nothing when message is null', () => {
    const { container } = render(<Toast message={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the message text when present', () => {
    render(<Toast message="Photo ajoutée !" />);
    expect(screen.getByText('Photo ajoutée !')).toBeInTheDocument();
  });
});
