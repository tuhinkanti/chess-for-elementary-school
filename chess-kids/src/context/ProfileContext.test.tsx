import { render, screen, act } from '@testing-library/react';
import { ProfileProvider } from './ProfileContext';
import { useProfile } from '../hooks/useProfile';
import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: function(key: string) {
      return store[key] || null;
    },
    setItem: function(key: string, value: string) {
      store[key] = value.toString();
    },
    clear: function() {
      store = {};
    },
    removeItem: function(key: string) {
      delete store[key];
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

const TestComponent = () => {
  const {
    profiles,
    currentProfile,
    createProfile,
    selectProfile,
    addStars,
    currentProgress
  } = useProfile();

  return (
    <div>
      <div data-testid="current-profile-name">{currentProfile?.name || 'No Profile'}</div>
      <div data-testid="stars">{currentProgress.stars}</div>
      <button onClick={() => createProfile('Alice', 'avatar1')}>Create Alice</button>
      <button onClick={() => createProfile('Bob', 'avatar2')}>Create Bob</button>

      <div data-testid="profile-list">
        {profiles.map(p => (
          <button key={p.id} onClick={() => selectProfile(p.id)} data-testid={`select-${p.name}`}>
            Select {p.name}
          </button>
        ))}
      </div>

      <button onClick={() => addStars(1)}>Add Star</button>
    </div>
  );
};

describe('ProfileContext Functional', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should create, select profiles and update progress correctly', async () => {
    const { getByText, getByTestId } = render(
      <ProfileProvider>
        <TestComponent />
      </ProfileProvider>
    );

    expect(getByTestId('current-profile-name')).toHaveTextContent('No Profile');

    // Create Alice
    await act(async () => {
      getByText('Create Alice').click();
    });

    expect(getByTestId('current-profile-name')).toHaveTextContent('Alice');

    // Add star to Alice
    await act(async () => {
      getByText('Add Star').click();
    });
    expect(getByTestId('stars')).toHaveTextContent('1');

    // Create Bob
    await act(async () => {
      getByText('Create Bob').click();
    });
    expect(getByTestId('current-profile-name')).toHaveTextContent('Bob');
    expect(getByTestId('stars')).toHaveTextContent('0');

    // Add star to Bob
    await act(async () => {
      getByText('Add Star').click();
    });
    await act(async () => {
      getByText('Add Star').click();
    });
    expect(getByTestId('stars')).toHaveTextContent('2');

    // Select Alice again
    await act(async () => {
      getByTestId('select-Alice').click();
    });

    expect(getByTestId('current-profile-name')).toHaveTextContent('Alice');
    expect(getByTestId('stars')).toHaveTextContent('1'); // Should persist

    // Select Bob again
    await act(async () => {
      getByTestId('select-Bob').click();
    });

    expect(getByTestId('current-profile-name')).toHaveTextContent('Bob');
    expect(getByTestId('stars')).toHaveTextContent('2'); // Should persist
  });
});
