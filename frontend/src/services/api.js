import { API_URL } from '../config';

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: 'Unknown error',
      details: 'No error details available'
    }));
    
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      errorData
    });
    
    throw new Error(errorData.error || 'API request failed');
  }
  return response.json();
};

export const api = {
  async getCandidates() {
    const response = await fetch('/api/candidates');
    if (!response.ok) {
      throw new Error('Failed to fetch candidates');
    }
    return response.json();
  },

  async vote(data) {
    const response = await fetch('/api/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to vote');
    }
    
    return response.json();
  },

  async checkVote(telegramUserId) {
    const response = await fetch(`/api/check-vote/${telegramUserId}`);
    if (!response.ok) {
      throw new Error('Failed to check vote status');
    }
    const data = await response.json();
    return data.hasVoted;
  },

  async getVotingStatus() {
    const response = await fetch('/api/voting/status');
    if (!response.ok) {
      throw new Error('Failed to fetch voting status');
    }
    return response.json();
  }
}; 