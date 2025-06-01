/**
 * Professional Order Number Generator
 * Generates unique order numbers with various formats
 */

export interface OrderNumberConfig {
  prefix?: string;
  includeDate?: boolean;
  includeTime?: boolean;
  sequenceLength?: number;
  format?: 'standard' | 'compact' | 'detailed' | 'custom';
  customTemplate?: string;
}

export class OrderNumberGenerator {
  private static instance: OrderNumberGenerator;
  private generatedNumbers: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): OrderNumberGenerator {
    if (!OrderNumberGenerator.instance) {
      OrderNumberGenerator.instance = new OrderNumberGenerator();
    }
    return OrderNumberGenerator.instance;
  }

  /**
   * Generate a professional order number
   */
  public generateOrderNumber(config: OrderNumberConfig = {}): string {
    const {
      prefix = 'RB',
      includeDate = true,
      includeTime = false,
      sequenceLength = 4,
      format = 'standard'
    } = config;

    let orderNumber: string;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      orderNumber = this.createOrderNumber(prefix, includeDate, includeTime, sequenceLength, format);
      attempts++;
    } while (this.generatedNumbers.has(orderNumber) && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      // Fallback with timestamp to ensure uniqueness
      orderNumber = `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }

    this.generatedNumbers.add(orderNumber);
    return orderNumber;
  }

  /**
   * Create order number based on format
   */
  private createOrderNumber(
    prefix: string,
    includeDate: boolean,
    includeTime: boolean,
    sequenceLength: number,
    format: string
  ): string {
    const now = new Date();
    
    switch (format) {
      case 'standard':
        return this.createStandardFormat(prefix, now, sequenceLength);
      
      case 'compact':
        return this.createCompactFormat(prefix, now, sequenceLength);
      
      case 'detailed':
        return this.createDetailedFormat(prefix, now, includeTime, sequenceLength);
      
      default:
        return this.createStandardFormat(prefix, now, sequenceLength);
    }
  }

  /**
   * Standard format: RB-20240601-0001
   */
  private createStandardFormat(prefix: string, date: Date, sequenceLength: number): string {
    const dateStr = this.formatDate(date, 'YYYYMMDD');
    const sequence = this.generateSequence(sequenceLength);
    return `${prefix}-${dateStr}-${sequence}`;
  }

  /**
   * Compact format: RB240601001
   */
  private createCompactFormat(prefix: string, date: Date, sequenceLength: number): string {
    const dateStr = this.formatDate(date, 'YYMMDD');
    const sequence = this.generateSequence(sequenceLength);
    return `${prefix}${dateStr}${sequence}`;
  }

  /**
   * Detailed format: RB-2024-06-01-14-30-0001
   */
  private createDetailedFormat(prefix: string, date: Date, includeTime: boolean, sequenceLength: number): string {
    const dateStr = this.formatDate(date, 'YYYY-MM-DD');
    const timeStr = includeTime ? `-${this.formatTime(date)}` : '';
    const sequence = this.generateSequence(sequenceLength);
    return `${prefix}-${dateStr}${timeStr}-${sequence}`;
  }

  /**
   * Format date according to pattern
   */
  private formatDate(date: Date, pattern: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (pattern) {
      case 'YYYYMMDD':
        return `${year}${month}${day}`;
      case 'YYMMDD':
        return `${String(year).slice(-2)}${month}${day}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      default:
        return `${year}${month}${day}`;
    }
  }

  /**
   * Format time (HH-MM)
   */
  private formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}-${minutes}`;
  }

  /**
   * Generate sequence number
   */
  private generateSequence(length: number): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * Math.pow(10, length));
    const combined = parseInt(String(timestamp).slice(-length)) + random;
    return String(combined % Math.pow(10, length)).padStart(length, '0');
  }

  /**
   * Generate order number with custom business logic
   */
  public generateBusinessOrderNumber(sellerId?: string): string {
    const prefix = 'RB';
    const now = new Date();
    const dateStr = this.formatDate(now, 'YYYYMMDD');
    
    // Add seller identifier if provided (take first 2 chars of seller ID)
    const sellerCode = sellerId ? sellerId.slice(-2).toUpperCase() : '';
    
    // Generate unique sequence
    const sequence = this.generateUniqueSequence();
    
    return `${prefix}-${dateStr}-${sellerCode}${sequence}`;
  }

  /**
   * Generate unique sequence with collision detection
   */
  private generateUniqueSequence(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 9999);
    const sequence = String((timestamp % 10000) + random).slice(-4).padStart(4, '0');
    return sequence;
  }

  /**
   * Validate order number format
   */
  public validateOrderNumber(orderNumber: string): boolean {
    // Basic validation patterns
    const patterns = [
      /^[A-Z]{2,4}-\d{8}-\d{4}$/, // Standard: RB-20240601-0001
      /^[A-Z]{2,4}\d{6}\d{3,4}$/, // Compact: RB240601001
      /^[A-Z]{2,4}-\d{4}-\d{2}-\d{2}(-\d{2}-\d{2})?-\d{4}$/, // Detailed
    ];

    return patterns.some(pattern => pattern.test(orderNumber));
  }

  /**
   * Get suggested order number formats
   */
  public getSuggestedFormats(): { format: string; example: string; description: string }[] {
    const now = new Date();
    
    return [
      {
        format: 'standard',
        example: this.createStandardFormat('RB', now, 4),
        description: 'Standard format with date and sequence'
      },
      {
        format: 'compact',
        example: this.createCompactFormat('RB', now, 3),
        description: 'Compact format without separators'
      },
      {
        format: 'detailed',
        example: this.createDetailedFormat('RB', now, true, 4),
        description: 'Detailed format with date and time'
      }
    ];
  }

  /**
   * Clear generated numbers cache (for testing)
   */
  public clearCache(): void {
    this.generatedNumbers.clear();
  }

  /**
   * Check if order number was generated by this instance
   */
  public isGenerated(orderNumber: string): boolean {
    return this.generatedNumbers.has(orderNumber);
  }
}

// Export singleton instance
export const orderNumberGenerator = OrderNumberGenerator.getInstance();

// Export convenience functions
export const generateOrderNumber = (config?: OrderNumberConfig): string => {
  return orderNumberGenerator.generateOrderNumber(config);
};

export const generateBusinessOrderNumber = (sellerId?: string): string => {
  return orderNumberGenerator.generateBusinessOrderNumber(sellerId);
};

export const validateOrderNumber = (orderNumber: string): boolean => {
  return orderNumberGenerator.validateOrderNumber(orderNumber);
}; 