import * as XLSX from 'xlsx';
import { ERROR_MESSAGES } from './validation';

export interface ExcelValidationError {
    row: number;
    column: string;
    message: string;
}

export interface ExcelValidationResult {
    isValid: boolean;
    errors: ExcelValidationError[];
    data: any[];
}

export class ExcelValidator {
    private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static readonly ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];
    private static readonly MAX_ROWS = 1000;

    static validateFile(file: File): string | null {
        // Check file size
        if (file.size > this.MAX_FILE_SIZE) {
            return 'File size should not exceed 5MB';
        }

        // Check file extension
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!this.ALLOWED_EXTENSIONS.includes(extension)) {
            return 'Only Excel files (.xlsx, .xls) are allowed';
        }

        return null;
    }

    static async validateExcelData(
        file: File,
        config: Array<{
            name: string;
            required: boolean;
            type: 'string' | 'number' | 'date' | 'email' | 'phone';
            minLength?: number;
            maxLength?: number;
            pattern?: RegExp;
            customValidation?: (value: any) => boolean;
            customErrorMessage?: string;
        }>
    ): Promise<ExcelValidationResult> {
        try {
            const workbook = await this.readExcelFile(file);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // Validate number of rows
            if (data.length > this.MAX_ROWS) {
                return {
                    isValid: false,
                    errors: [{
                        row: 0,
                        column: 'ALL',
                        message: `Maximum ${this.MAX_ROWS} rows allowed`
                    }],
                    data: []
                };
            }

            const errors: ExcelValidationError[] = [];
            const validatedData: any[] = [];

            // Skip header row
            for (let i = 1; i < data.length; i++) {
                const row = data[i] as unknown[];
                const rowErrors: ExcelValidationError[] = [];

                // Validate each column
                config.forEach((colConfig, index) => {
                    const value = row[index];
                    const columnName = XLSX.utils.encode_col(index);

                    // Check required fields
                    if (colConfig.required && (value === undefined || value === null || value === '')) {
                        rowErrors.push({
                            row: i + 1,
                            column: columnName,
                            message: `${colConfig.name} is required`
                        });
                        return;
                    }

                    // Skip validation if value is empty and not required
                    if (value === undefined || value === null || value === '') {
                        return;
                    }

                    // Type validation
                    switch (colConfig.type) {
                        case 'number':
                            if (isNaN(Number(String(value)))) {
                                rowErrors.push({
                                    row: i + 1,
                                    column: columnName,
                                    message: `${colConfig.name} must be a number`
                                });
                            }
                            break;

                        case 'date':
                            if (isNaN(Date.parse(String(value)))) {
                                rowErrors.push({
                                    row: i + 1,
                                    column: columnName,
                                    message: `${colConfig.name} must be a valid date`
                                });
                            }
                            break;

                        case 'email':
                            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                            if (!emailPattern.test(String(value))) {
                                rowErrors.push({
                                    row: i + 1,
                                    column: columnName,
                                    message: `${colConfig.name} must be a valid email address`
                                });
                            }
                            break;

                        case 'phone':
                            const phonePattern = /^\+?[\d\s-]{10,}$/;
                            if (!phonePattern.test(String(value))) {
                                rowErrors.push({
                                    row: i + 1,
                                    column: columnName,
                                    message: `${colConfig.name} must be a valid phone number`
                                });
                            }
                            break;
                    }

                    // Length validation
                    if (colConfig.minLength && String(value).length < colConfig.minLength) {
                        rowErrors.push({
                            row: i + 1,
                            column: columnName,
                            message: `${colConfig.name} must be at least ${colConfig.minLength} characters`
                        });
                    }

                    if (colConfig.maxLength && String(value).length > colConfig.maxLength) {
                        rowErrors.push({
                            row: i + 1,
                            column: columnName,
                            message: `${colConfig.name} must not exceed ${colConfig.maxLength} characters`
                        });
                    }

                    // Pattern validation
                    if (colConfig.pattern && !colConfig.pattern.test(String(value))) {
                        rowErrors.push({
                            row: i + 1,
                            column: columnName,
                            message: colConfig.customErrorMessage || `${colConfig.name} has invalid format`
                        });
                    }

                    // Custom validation
                    if (colConfig.customValidation && !colConfig.customValidation(value)) {
                        rowErrors.push({
                            row: i + 1,
                            column: columnName,
                            message: colConfig.customErrorMessage || `${colConfig.name} is invalid`
                        });
                    }
                });

                if (rowErrors.length === 0) {
                    validatedData.push(row);
                } else {
                    errors.push(...rowErrors);
                }
            }

            return {
                isValid: errors.length === 0,
                errors,
                data: validatedData
            };
        } catch (error) {
            console.error('Excel validation error:', error);
            return {
                isValid: false,
                errors: [{
                    row: 0,
                    column: 'ALL',
                    message: ERROR_MESSAGES.FILE_PROCESSING_ERROR
                }],
                data: []
            };
        }
    }

    private static async readExcelFile(file: File): Promise<XLSX.WorkBook> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    resolve(workbook);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = (error) => reject(error);
            reader.readAsArrayBuffer(file);
        });
    }
} 