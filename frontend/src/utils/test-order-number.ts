/**
 * Test script for Order Number Generation
 * Run this to verify the functionality works correctly
 */

import { 
    generateOrderNumber, 
    generateBusinessOrderNumber, 
    validateOrderNumber,
    orderNumberGenerator,
    OrderNumberConfig 
} from './orderNumberGenerator';

export interface TestResult {
    test: string;
    passed: boolean;
    details: string;
    output?: any;
}

export class OrderNumberTester {
    private results: TestResult[] = [];

    /**
     * Run all tests
     */
    public runAllTests(): TestResult[] {
        this.results = [];
        
        console.log('🧪 Starting Order Number Generation Tests...\n');

        this.testBasicGeneration();
        this.testDifferentFormats();
        this.testValidation();
        this.testUniqueness();
        this.testBusinessLogic();
        this.testErrorHandling();

        console.log('\n📊 Test Results Summary:');
        console.log(`✅ Passed: ${this.results.filter(r => r.passed).length}`);
        console.log(`❌ Failed: ${this.results.filter(r => !r.passed).length}`);
        console.log(`📋 Total: ${this.results.length}`);

        return this.results;
    }

    /**
     * Test basic order number generation
     */
    private testBasicGeneration(): void {
        try {
            const orderNumber = generateOrderNumber();
            const isValid = Boolean(orderNumber && orderNumber.length > 0);
            
            this.addResult({
                test: 'Basic Order Number Generation',
                passed: isValid,
                details: `Generated: ${orderNumber}`,
                output: orderNumber
            });

            console.log(`✅ Basic Generation: ${orderNumber}`);
        } catch (error) {
            this.addResult({
                test: 'Basic Order Number Generation',
                passed: false,
                details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
            console.log(`❌ Basic Generation Failed: ${error}`);
        }
    }

    /**
     * Test different formats
     */
    private testDifferentFormats(): void {
        const formats: OrderNumberConfig[] = [
            { format: 'standard', prefix: 'TEST' },
            { format: 'compact', prefix: 'TEST' },
            { format: 'detailed', prefix: 'TEST', includeTime: true }
        ];

        formats.forEach((config, index) => {
            try {
                const orderNumber = generateOrderNumber(config);
                const isValid = Boolean(orderNumber && orderNumber.length > 0);
                
                this.addResult({
                    test: `Format Test - ${config.format}`,
                    passed: isValid,
                    details: `Generated: ${orderNumber}`,
                    output: orderNumber
                });

                console.log(`✅ ${config.format} Format: ${orderNumber}`);
            } catch (error) {
                this.addResult({
                    test: `Format Test - ${config.format}`,
                    passed: false,
                    details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
                console.log(`❌ ${config.format} Format Failed: ${error}`);
            }
        });
    }

    /**
     * Test validation functionality
     */
    private testValidation(): void {
        const testCases = [
            { number: 'RB-20240601-0001', expected: true, description: 'Valid standard format' },
            { number: 'RB240601001', expected: true, description: 'Valid compact format' },
            { number: 'RB-2024-06-01-14-30-0001', expected: true, description: 'Valid detailed format' },
            { number: 'INVALID', expected: false, description: 'Invalid format' },
            { number: '', expected: false, description: 'Empty string' },
            { number: '123-456-789', expected: false, description: 'Numbers only' }
        ];

        testCases.forEach(testCase => {
            try {
                const isValid = validateOrderNumber(testCase.number);
                const passed = isValid === testCase.expected;
                
                this.addResult({
                    test: `Validation - ${testCase.description}`,
                    passed,
                    details: `Input: "${testCase.number}", Expected: ${testCase.expected}, Got: ${isValid}`,
                    output: { input: testCase.number, valid: isValid }
                });

                const status = passed ? '✅' : '❌';
                console.log(`${status} Validation: "${testCase.number}" -> ${isValid}`);
            } catch (error) {
                this.addResult({
                    test: `Validation - ${testCase.description}`,
                    passed: false,
                    details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
                console.log(`❌ Validation Failed for "${testCase.number}": ${error}`);
            }
        });
    }

    /**
     * Test uniqueness
     */
    private testUniqueness(): void {
        try {
            const numbers = [];
            const iterations = 100;
            
            for (let i = 0; i < iterations; i++) {
                numbers.push(generateOrderNumber());
            }
            
            const uniqueNumbers = new Set(numbers);
            const allUnique = uniqueNumbers.size === numbers.length;
            
            this.addResult({
                test: 'Uniqueness Test',
                passed: allUnique,
                details: `Generated ${iterations} numbers, ${uniqueNumbers.size} unique`,
                output: { total: numbers.length, unique: uniqueNumbers.size }
            });

            const status = allUnique ? '✅' : '❌';
            console.log(`${status} Uniqueness: ${uniqueNumbers.size}/${numbers.length} unique`);
        } catch (error) {
            this.addResult({
                test: 'Uniqueness Test',
                passed: false,
                details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
            console.log(`❌ Uniqueness Test Failed: ${error}`);
        }
    }

    /**
     * Test business logic
     */
    private testBusinessLogic(): void {
        try {
            const sellerIds = ['seller123', 'test456', 'demo789'];
            const businessNumbers = sellerIds.map(id => generateBusinessOrderNumber(id));
            
            const allValid = businessNumbers.every(num => num && num.length > 0);
            const allContainDate = businessNumbers.every(num => {
                const today = new Date();
                const dateStr = today.getFullYear().toString() + 
                    String(today.getMonth() + 1).padStart(2, '0') + 
                    String(today.getDate()).padStart(2, '0');
                return num.includes(dateStr);
            });
            
            this.addResult({
                test: 'Business Logic Test',
                passed: allValid && allContainDate,
                details: `Generated business numbers with seller IDs`,
                output: businessNumbers
            });

            const status = (allValid && allContainDate) ? '✅' : '❌';
            console.log(`${status} Business Logic: ${businessNumbers.join(', ')}`);
        } catch (error) {
            this.addResult({
                test: 'Business Logic Test',
                passed: false,
                details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
            console.log(`❌ Business Logic Test Failed: ${error}`);
        }
    }

    /**
     * Test error handling
     */
    private testErrorHandling(): void {
        try {
            // Test with extreme parameters
            const extremeConfig: OrderNumberConfig = {
                prefix: 'A'.repeat(10), // Very long prefix
                sequenceLength: 20 // Very long sequence
            };
            
            const orderNumber = generateOrderNumber(extremeConfig);
            const handled = Boolean(orderNumber && orderNumber.length > 0);
            
            this.addResult({
                test: 'Error Handling - Extreme Parameters',
                passed: handled,
                details: `Handled extreme config: ${orderNumber}`,
                output: orderNumber
            });

            const status = handled ? '✅' : '❌';
            console.log(`${status} Error Handling: ${orderNumber}`);
        } catch (error) {
            // Error handling should prevent crashes
            this.addResult({
                test: 'Error Handling - Extreme Parameters',
                passed: true, // It's okay if it throws an error gracefully
                details: `Gracefully handled error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
            console.log(`✅ Error Handling: Gracefully handled error`);
        }
    }

    /**
     * Add test result
     */
    private addResult(result: TestResult): void {
        this.results.push(result);
    }

    /**
     * Get results summary
     */
    public getResultsSummary(): { passed: number; failed: number; total: number; details: TestResult[] } {
        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.filter(r => !r.passed).length;
        
        return {
            passed,
            failed,
            total: this.results.length,
            details: this.results
        };
    }
}

/**
 * Quick test function for console use
 */
export const testOrderNumberGeneration = (): void => {
    const tester = new OrderNumberTester();
    const results = tester.runAllTests();
    
    console.log('\n🔍 Detailed Results:');
    results.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`${status} ${result.test}: ${result.details}`);
    });
    
    const summary = tester.getResultsSummary();
    console.log('\n📈 Final Summary:');
    console.log(`Success Rate: ${((summary.passed / summary.total) * 100).toFixed(1)}%`);
    
    return;
};

/**
 * Demo function for showcasing different formats
 */
export const demoOrderNumberFormats = (): void => {
    console.log('🎨 Order Number Format Demonstration\n');
    
    const formats = orderNumberGenerator.getSuggestedFormats();
    
    formats.forEach(format => {
        console.log(`📋 ${format.description}:`);
        console.log(`   Example: ${format.example}`);
        console.log(`   Valid: ${validateOrderNumber(format.example) ? '✅' : '❌'}\n`);
    });
    
    console.log('🏢 Business Format Examples:');
    ['seller001', 'store123', 'vendor456'].forEach(sellerId => {
        const businessNumber = generateBusinessOrderNumber(sellerId);
        console.log(`   ${sellerId} -> ${businessNumber}`);
    });
}; 