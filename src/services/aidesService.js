const API_BASE_URL = typeof window !== 'undefined' ? '/api/v1' : (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '') + '/api/v1';

export const aidesService = {
  /**
   * Calcule les aides pour un profil utilisateur
   * @param {Object} profile
   * @returns {Promise<Object>}
   */
  calculateAides: async (profile) => {
    try {
      const response = await fetch(`${API_BASE_URL}/aides/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur serveur: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error (aidesService):', error);
      throw error;
    }
  }
};
