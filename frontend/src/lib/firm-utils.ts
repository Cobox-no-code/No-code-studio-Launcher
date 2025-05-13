/**
 * Utility functions for handling firm changes
 */

/**
 * Set the current firm in localStorage and trigger a firm change event
 * @param {string} firmId - The ID of the firm to set
 * @param {string} firmName - The name of the firm to set
 * @param {string} country - The country of the firm (optional)
 */
export const setCurrentFirm = (firmId:any, firmName:any, country :any) => {
    // Set firm data in localStorage
    localStorage.setItem('firmId', firmId)
    localStorage.setItem('firmName', firmName)
    
    if (country) {
      localStorage.setItem('firmCountry', country)
    }
    
    // Dispatch a custom event to notify components of the change
    const event = new Event('firmChanged')
    window.dispatchEvent(event)
    
    // Also trigger a storage event for cross-tab synchronization
    window.dispatchEvent(new Event('storage'))
  }
  
  /**
   * Clear the current firm from localStorage and trigger a firm change event
   */
  export const clearCurrentFirm = () => {
    // Remove firm data from localStorage
    localStorage.removeItem('firmId')
    localStorage.removeItem('firmName')
    localStorage.removeItem('firmCountry')
    
    // Dispatch a custom event to notify components of the change
    const event = new Event('firmChanged')
    window.dispatchEvent(event)
    
    // Also trigger a storage event for cross-tab synchronization
    window.dispatchEvent(new Event('storage'))
    
  }