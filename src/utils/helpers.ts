/**
 * Format date and time for display
 * @param dateString - Date string to format
 * @returns Formatted date and time string in Vietnamese locale
 */
export const FORMAT_DATE_TIME = (dateString: string): string => {
  try {
    if (!dateString) {
      console.warn('FORMAT_DATE_TIME: Empty date string provided');
      return 'N/A';
    }

    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('FORMAT_DATE_TIME: Invalid date:', dateString);
      return dateString;
    }
    
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', dateString);
    return dateString || 'N/A';
  }
} 