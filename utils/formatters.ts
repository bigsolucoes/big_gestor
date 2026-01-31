
export const formatCurrency = (
    value: number | undefined | null, 
    privacyModeEnabled: boolean | undefined, 
    currencySymbol: string = 'R$'
  ): string => {
    if (value === undefined || value === null) {
      return privacyModeEnabled ? `${currencySymbol} ••••••` : `${currencySymbol} 0,00`;
    }
    
    if (privacyModeEnabled) {
      return `${currencySymbol} ••••••`;
    }
    
    return `${currencySymbol} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  export const formatDate = (dateString: string | undefined | null, options?: Intl.DateTimeFormatOptions): string => {
    // 1. Check for null, undefined, or empty string
    if (!dateString || dateString.trim() === '') {
        return '---';
    }

    try {
      // Handle simple YYYY-MM-DD strings explicitly to avoid timezone shifts
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
         const [year, month, day] = dateString.split('-').map(Number);
         // Create date at noon to be safe from timezone offsets
         const safeDate = new Date(year, month - 1, day, 12, 0, 0);
         return safeDate.toLocaleDateString('pt-BR', options || { year: 'numeric', month: 'short', day: 'numeric' });
      }

      const date = new Date(dateString);

      // 2. Check if the date object is strictly valid
      if (isNaN(date.getTime())) {
          console.warn("Invalid date encountered:", dateString);
          return 'Data Inválida';
      }

      // 3. Success
      return date.toLocaleDateString('pt-BR', options || { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      console.warn("Error formatting date:", dateString, e);
      return '---';
    }
  };
