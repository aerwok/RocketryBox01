import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UploadIcon } from "lucide-react";
import { useState, useEffect } from 'react';
import { useBulkOrder } from '@/hooks/useBulkOrder';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { ServiceFactory } from '@/services/service-factory';

const gridData = [
    // Grid 1
    [
        { column: "Order Id *", valueDescription: "NT0075 (Your store order-number)" },
        { column: "Payment Type*", valueDescription: "COD/PAID/REV" },
        { column: "Order Date*", valueDescription: "2022/07/20" },
        { column: "Shipping Full Name*", valueDescription: "Sangeeta Singh" },
        { column: "Shipping Company Name", valueDescription: "Test Company" },
        { column: "Shipping Address Line1*", valueDescription: "Shipping address - 1" },
        { column: "Shipping Address Line2*", valueDescription: "Shipping address - 2" },
        { column: "Shipping Contact Number*", valueDescription: "8989898989" },
        { column: "Shipping City*", valueDescription: "New Delhi" },
        { column: "Shipping Pincode*", valueDescription: "110062" },
        { column: "Billing Full Name", valueDescription: "Test" }
    ],
    // Grid 2
    [
        { column: "Billing Company Name", valueDescription: "Test Company" },
        { column: "Billing Address1", valueDescription: "Test Billing address - 1" },
        { column: "Billing Address2", valueDescription: "Test Billing address - 2" },
        { column: "Billing City", valueDescription: "New Delhi" },
        { column: "Billing Pincode", valueDescription: "122001" },
        { column: "Billing GST", valueDescription: "22AAAAA0000A1Z5" },
        { column: "Package Weight*", valueDescription: "0.5Kg" },
        { column: "Package Length*", valueDescription: "10" },
        { column: "Package Height*", valueDescription: "10" },
        { column: "Package Width*", valueDescription: "3Kg (Total Weight)" },
        { column: "Purchase Amount*", valueDescription: "1000" }
    ],
    // Grid 3
    [
        { column: "SKU1", valueDescription: "DLR_RED (Product-1 SKU)" },
        { column: "Product Name1*", valueDescription: "T-shirt - 32 Red" },
        { column: "Quantity1*", valueDescription: "1" },
        { column: "Item Weight1*", valueDescription: "0.5Kg" },
        { column: "Item Price1*", valueDescription: "230" },
        { column: "SKU2", valueDescription: "DLR_GRN" },
        { column: "Product Name2", valueDescription: "T-shirt - 32 Green" },
        { column: "Quantity2", valueDescription: "1" },
        { column: "Item Weight2", valueDescription: "0.5Kg" },
        { column: "Item Price2", valueDescription: "100" }
    ],
    // Grid 4
    [
        { column: "SKU3", valueDescription: "DLR_BLU (Product-3 SKU)" },
        { column: "Product Name3", valueDescription: "T-shirt - 32 Blue" },
        { column: "Quantity3", valueDescription: "3" },
        { column: "Item Weight3", valueDescription: "1.5Kg" },
        { column: "Item Price3", valueDescription: "290" },
        { column: "SKU4", valueDescription: "DLR_YLO" },
        { column: "Product Name4", valueDescription: "T-shirt - 32 Yellow" },
        { column: "Quantity4", valueDescription: "10" },
        { column: "Item Weight4", valueDescription: "0.5Kg" },
        { column: "Item Price4", valueDescription: "100" }
    ]
];

const BulkOrdersPage = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploadHistory, setUploadHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { 
        isUploading, 
        isDownloading, 
        uploadProgress,
        uploadBulkOrder, 
        downloadTemplate 
    } = useBulkOrder();

    // Fetch upload history
    const fetchUploadHistory = async () => {
        setIsLoading(true);
        try {
            const response = await ServiceFactory.seller.bulkOrders.getUploadHistory();
            if (response.success) {
                setUploadHistory(response.data);
            } else {
                toast.error(response.message || 'Failed to fetch upload history');
            }
        } catch (error) {
            console.error('Error fetching upload history:', error);
            toast.error('Failed to fetch upload history');
        } finally {
            setIsLoading(false);
        }
    };

    // Download error file
    const handleDownloadErrorFile = async (uploadId: number) => {
        try {
            const response = await ServiceFactory.seller.bulkOrders.downloadErrorFile(uploadId);
            if (response.success) {
                // Handle file download
                const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `error_file_${uploadId}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                toast.error(response.message || 'Failed to download error file');
            }
        } catch (error) {
            console.error('Error downloading error file:', error);
            toast.error('Failed to download error file');
        }
    };

    // Toggle show/hide details
    const handleToggleDetails = async (uploadId: number) => {
        try {
            const response = await ServiceFactory.seller.bulkOrders.toggleUploadDetails(uploadId);
            if (response.success) {
                // Refresh the upload history to get updated show/hide state
                fetchUploadHistory();
            } else {
                toast.error(response.message || 'Failed to toggle details');
            }
        } catch (error) {
            console.error('Error toggling details:', error);
            toast.error('Failed to toggle details');
        }
    };

    useEffect(() => {
        fetchUploadHistory();
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const selectedFile = event.target.files[0];
            if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error('File size should not exceed 5MB');
                return;
            }
            if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
                toast.error('Only Excel files (.xlsx, .xls) are allowed');
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error('Please select a file to upload');
            return;
        }

        try {
            await uploadBulkOrder(file, [
                // Grid 1
                { name: 'Order Id', required: true, type: 'string' },
                { name: 'Payment Type', required: true, type: 'string' },
                { name: 'Order Date', required: true, type: 'date' },
                { name: 'Shipping Full Name', required: true, type: 'string' },
                { name: 'Shipping Company Name', required: false, type: 'string' },
                { name: 'Shipping Address Line1', required: true, type: 'string' },
                { name: 'Shipping Address Line2', required: true, type: 'string' },
                { name: 'Shipping Contact Number', required: true, type: 'phone' },
                { name: 'Shipping City', required: true, type: 'string' },
                { name: 'Shipping Pincode', required: true, type: 'string' },
                { name: 'Billing Full Name', required: false, type: 'string' },
                
                // Grid 2
                { name: 'Billing Company Name', required: false, type: 'string' },
                { name: 'Billing Address1', required: false, type: 'string' },
                { name: 'Billing Address2', required: false, type: 'string' },
                { name: 'Billing City', required: false, type: 'string' },
                { name: 'Billing Pincode', required: false, type: 'string' },
                { name: 'Billing GST', required: false, type: 'string' },
                { name: 'Package Weight', required: true, type: 'number' },
                { name: 'Package Length', required: true, type: 'number' },
                { name: 'Package Height', required: true, type: 'number' },
                { name: 'Package Width', required: true, type: 'number' },
                { name: 'Purchase Amount', required: true, type: 'number' },
                
                // Grid 3 - Product 1
                { name: 'SKU1', required: false, type: 'string' },
                { name: 'Product Name1', required: true, type: 'string' },
                { name: 'Quantity1', required: true, type: 'number' },
                { name: 'Item Weight1', required: true, type: 'number' },
                { name: 'Item Price1', required: true, type: 'number' },
                
                // Grid 3 - Product 2
                { name: 'SKU2', required: false, type: 'string' },
                { name: 'Product Name2', required: false, type: 'string' },
                { name: 'Quantity2', required: false, type: 'number' },
                { name: 'Item Weight2', required: false, type: 'number' },
                { name: 'Item Price2', required: false, type: 'number' },
                
                // Grid 4 - Product 3
                { name: 'SKU3', required: false, type: 'string' },
                { name: 'Product Name3', required: false, type: 'string' },
                { name: 'Quantity3', required: false, type: 'number' },
                { name: 'Item Weight3', required: false, type: 'number' },
                { name: 'Item Price3', required: false, type: 'number' },
                
                // Grid 4 - Product 4
                { name: 'SKU4', required: false, type: 'string' },
                { name: 'Product Name4', required: false, type: 'string' },
                { name: 'Quantity4', required: false, type: 'number' },
                { name: 'Item Weight4', required: false, type: 'number' },
                { name: 'Item Price4', required: false, type: 'number' }
            ]);
            // Refresh upload history after successful upload
            fetchUploadHistory();
        } catch (error) {
            console.error('Upload error:', error);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold">
                Bulk Order Upload
            </h1>

            <Card className="shadow-none">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <Input
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                            className="flex-1"
                            disabled={isUploading}
                        />
                        <div className="flex gap-2">
                            <Button 
                                variant="primary"
                                onClick={handleUpload}
                                disabled={!file || isUploading}
                            >
                                <UploadIcon className="size-4 mr-1.5" />
                                {isUploading ? 'Uploading...' : 'Upload'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={downloadTemplate}
                                disabled={isDownloading}
                            >
                                {isDownloading ? 'Downloading...' : 'Download Sample Excel'}
                            </Button>
                        </div>
                    </div>
                    {isUploading && (
                        <div className="mt-4">
                            <Progress value={uploadProgress} className="h-2" />
                            <p className="text-sm text-gray-500 mt-1">
                                Uploading: {Math.round(uploadProgress)}%
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="shadow-none">
                <CardHeader className="bg-main/10">
                    <CardTitle className="text-lg font-medium text-main text-center">
                        Upload History
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="font-semibold">Upload Date</TableHead>
                                    <TableHead className="font-semibold">Original File</TableHead>
                                    <TableHead className="font-semibold">Success Count</TableHead>
                                    <TableHead className="font-semibold">Error Count</TableHead>
                                    <TableHead className="font-semibold">Blank Count</TableHead>
                                    <TableHead className="font-semibold">Total Count</TableHead>
                                    <TableHead className="font-semibold">Error File</TableHead>
                                    <TableHead className="font-semibold">
                                        <Button variant="link" className="px-0" onClick={fetchUploadHistory}>
                                            Show All
                                        </Button>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-4">
                                            Loading upload history...
                                        </TableCell>
                                    </TableRow>
                                ) : uploadHistory.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-4">
                                            No upload history found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    uploadHistory.map((upload) => (
                                        <TableRow key={upload.id}>
                                            <TableCell>{upload.uploadDate}</TableCell>
                                            <TableCell>{upload.originalFile}</TableCell>
                                            <TableCell>{upload.successCount}</TableCell>
                                            <TableCell>{upload.errorCount}</TableCell>
                                            <TableCell>{upload.blankCount}</TableCell>
                                            <TableCell>{upload.totalCount}</TableCell>
                                            <TableCell>
                                                {upload.errorFile !== '-' ? (
                                                    <Button
                                                        variant="link"
                                                        className="p-0 h-auto text-purple-700"
                                                        onClick={() => handleDownloadErrorFile(upload.id)}
                                                    >
                                                        {upload.errorFile}
                                                    </Button>
                                                ) : (
                                                    upload.errorFile
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="link"
                                                    className="p-0 h-auto text-purple-700"
                                                    onClick={() => handleToggleDetails(upload.id)}
                                                >
                                                    {upload.showHide}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-none">
                <CardHeader className="bg-main/10">
                    <CardTitle className="text-lg font-medium text-main text-center">
                        Sample File Description
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                        {gridData.map((grid, gridIndex) => (
                            <div key={gridIndex} className="border rounded">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="font-semibold">
                                                Column
                                            </TableHead>
                                            <TableHead className="font-semibold">
                                                Value/Description
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {grid.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="whitespace-nowrap">
                                                    {item.column}
                                                </TableCell>
                                                <TableCell>
                                                    {item.valueDescription}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default BulkOrdersPage;
