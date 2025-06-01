import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { 
    generateOrderNumber, 
    generateBusinessOrderNumber, 
    validateOrderNumber,
    orderNumberGenerator,
    OrderNumberConfig 
} from '@/utils/orderNumberGenerator';

export const OrderNumberDemo: React.FC = () => {
    const [generatedNumbers, setGeneratedNumbers] = useState<string[]>([]);
    const [currentFormat, setCurrentFormat] = useState<'standard' | 'compact' | 'detailed'>('standard');
    const [customPrefix, setCustomPrefix] = useState<string>('RB');
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    const generateSampleNumbers = async () => {
        setIsGenerating(true);
        
        try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
            
            const configs: OrderNumberConfig[] = [
                { format: 'standard', prefix: customPrefix },
                { format: 'compact', prefix: customPrefix },
                { format: 'detailed', prefix: customPrefix, includeTime: true },
            ];

            const newNumbers = configs.map(config => generateOrderNumber(config));
            const businessNumber = generateBusinessOrderNumber('seller123');
            
            setGeneratedNumbers([...newNumbers, businessNumber]);
            toast.success('Order numbers generated successfully!');
        } catch (error) {
            toast.error('Failed to generate order numbers');
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (orderNumber: string) => {
        navigator.clipboard.writeText(orderNumber);
        toast.success('Order number copied to clipboard!', {
            description: orderNumber
        });
    };

    const validateSampleNumber = (orderNumber: string) => {
        return validateOrderNumber(orderNumber);
    };

    const getFormatDescription = (orderNumber: string) => {
        if (orderNumber.includes('-') && orderNumber.split('-').length === 3) {
            return 'Standard Format';
        } else if (!orderNumber.includes('-')) {
            return 'Compact Format';
        } else if (orderNumber.split('-').length > 3) {
            return 'Detailed Format';
        }
        return 'Business Format';
    };

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" />
                    Professional Order Number Generator Demo
                </CardTitle>
                <CardDescription>
                    Showcase of the automatic order number generation system with different formats and validation
                </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
                {/* Configuration Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="prefix">Custom Prefix</Label>
                        <Input
                            id="prefix"
                            value={customPrefix}
                            onChange={(e) => setCustomPrefix(e.target.value.toUpperCase())}
                            placeholder="Enter prefix (e.g., RB, ORD)"
                            maxLength={4}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="format">Preferred Format</Label>
                        <Select value={currentFormat} onValueChange={(value: any) => setCurrentFormat(value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="standard">Standard (RB-20240601-0001)</SelectItem>
                                <SelectItem value="compact">Compact (RB2406010001)</SelectItem>
                                <SelectItem value="detailed">Detailed (RB-2024-06-01-14-30-0001)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Generate Button */}
                <div className="flex justify-center">
                    <Button 
                        onClick={generateSampleNumbers}
                        disabled={isGenerating}
                        className="px-8"
                    >
                        {isGenerating ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Generate Sample Numbers
                            </>
                        )}
                    </Button>
                </div>

                {/* Generated Numbers Display */}
                {generatedNumbers.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Generated Order Numbers</h3>
                        <div className="grid gap-3">
                            {generatedNumbers.map((orderNumber, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <code className="text-lg font-mono font-bold text-blue-600">
                                                {orderNumber}
                                            </code>
                                            <Badge variant={validateSampleNumber(orderNumber) ? "default" : "destructive"}>
                                                {validateSampleNumber(orderNumber) ? (
                                                    <>
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        Valid
                                                    </>
                                                ) : (
                                                    'Invalid'
                                                )}
                                            </Badge>
                                            <Badge variant="outline">
                                                {getFormatDescription(orderNumber)}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Generated: {new Date().toLocaleString()}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(orderNumber)}
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Format Examples */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Available Formats</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {orderNumberGenerator.getSuggestedFormats().map((format, index) => (
                            <Card key={index} className="p-4">
                                <div className="space-y-2">
                                    <Badge variant="outline" className="mb-2">
                                        {format.format.charAt(0).toUpperCase() + format.format.slice(1)}
                                    </Badge>
                                    <code className="block text-sm font-mono bg-gray-100 p-2 rounded">
                                        {format.example}
                                    </code>
                                    <p className="text-xs text-gray-600">
                                        {format.description}
                                    </p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Features List */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">🚀 Professional Features</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>✅ Automatic generation on form load</li>
                        <li>✅ Collision detection and uniqueness guarantee</li>
                        <li>✅ Multiple professional formats (Standard, Compact, Detailed)</li>
                        <li>✅ Always protected - no accidental edits</li>
                        <li>✅ Format validation and warnings</li>
                        <li>✅ Seller ID integration for business logic</li>
                        <li>✅ Regenerate functionality with visual feedback</li>
                        <li>✅ Tooltip guidance and user education</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}; 