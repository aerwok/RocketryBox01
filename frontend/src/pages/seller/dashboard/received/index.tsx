import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileSpreadsheet, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { bulkOrderService } from "@/services/bulkOrder.service";

interface UploadedFile {
    name: string;
    size: number;
    status: 'uploading' | 'success' | 'error';
    progress: number;
    error?: string;
}

interface ReceivedOrder {
    awb: string;
    receivedAt: string;
    receivedBy: string;
    status: string;
    notes: string;
    items: {
        name: string;
        sku: string;
        quantity: number;
        price: number;
        condition: string;
        notes: string;
    }[];
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

const SellerReceivedPage = () => {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const [receivedOrders, setReceivedOrders] = useState<ReceivedOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchReceivedOrders();
    }, []);

    const fetchReceivedOrders = async () => {
        try {
            setIsLoading(true);
            const response = await bulkOrderService.getReceivedOrders();
            if (response.success) {
                setReceivedOrders(response.data);
            } else {
                toast.error(response.message || 'Failed to fetch received orders');
            }
        } catch (error) {
            console.error('Error fetching received orders:', error);
            toast.error('Failed to fetch received orders');
        } finally {
            setIsLoading(false);
        }
    };

    const validateFile = (file: File): string | null => {
        if (file.size > MAX_FILE_SIZE) {
            return `File size exceeds 5MB limit`;
        }
        if (!['.xls', '.xlsx', '.csv'].some(ext => file.name.toLowerCase().endsWith(ext))) {
            return `Invalid file format. Only .xls, .xlsx, and .csv files are allowed`;
        }
        return null;
    };

    const handleFileSelect = async (files: FileList | null) => {
        if (!files) return;

        const newFiles: UploadedFile[] = [];
        const validFiles: File[] = [];

        // Validate files first
        for (const file of Array.from(files)) {
            const error = validateFile(file);
            if (error) {
                newFiles.push({
                    name: file.name,
                    size: file.size,
                    status: 'error',
                    progress: 0,
                    error
                });
            } else {
                validFiles.push(file);
                newFiles.push({
                    name: file.name,
                    size: file.size,
                    status: 'uploading',
                    progress: 0
                });
            }
        }

        setUploadedFiles(prev => [...prev, ...newFiles]);

        // Upload valid files
        for (let i = 0; i < validFiles.length; i++) {
            const file = validFiles[i];
            const fileIndex = uploadedFiles.length + i;

            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await bulkOrderService.uploadBulkOrder(file, (progress: number) => {
                    setUploadedFiles(prev => {
                        const updated = [...prev];
                        updated[fileIndex] = {
                            ...updated[fileIndex],
                            progress,
                            status: progress === 100 ? 'success' : 'uploading'
                        };
                        return updated;
                    });
                });

                if (!response.success) {
                    throw new Error(response.message || 'Failed to upload file');
                }

                setUploadedFiles(prev => {
                    const updated = [...prev];
                    updated[fileIndex] = {
                        ...updated[fileIndex],
                        status: 'success',
                        progress: 100
                    };
                    return updated;
                });

                toast.success(`File ${file.name} uploaded successfully!`);
            } catch (error) {
                console.error('Error uploading file:', error);
                setUploadedFiles(prev => {
                    const updated = [...prev];
                    updated[fileIndex] = {
                        ...updated[fileIndex],
                        status: 'error',
                        error: error instanceof Error ? error.message : 'Failed to upload file'
                    };
                    return updated;
                });
                toast.error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const handleDownloadSample = async () => {
        try {
            const response = await bulkOrderService.downloadSampleTemplate();
            if (response.success) {
                // Create a blob from the response data
                const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'received_orders_template.xlsx';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success("Sample file downloaded successfully!");
            } else {
                throw new Error(response.message || 'Failed to download sample file');
            }
        } catch (error) {
            console.error("Error downloading sample file:", error);
            toast.error("Failed to download sample file");
        }
    };

    const removeFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-xl lg:text-2xl font-semibold">
                    Received Orders
                </h1>
                <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleDownloadSample}
                >
                    <Download className="h-4 w-4" />
                    Download Sample Template
                </Button>
            </div>

            <Card className="shadow-none border-none">
                <CardHeader>
                    <CardTitle>
                        Upload File
                    </CardTitle>
                    <CardDescription>
                        Upload your file in Excel format (.xls, .xlsx, .csv)
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div
                        className={`relative border-2 border-dashed rounded-lg p-8 ${
                            dragActive
                                ? "border-violet-500 bg-violet-50"
                                : "border-gray-300 bg-gray-50"
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            multiple
                            accept=".xls,.xlsx,.csv"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => handleFileSelect(e.target.files)}
                        />
                        <div className="text-center">
                            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                                Drag and drop your files here, or click to browse
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                Supported formats: .xls, .xlsx, .csv (Max 5MB per file)
                            </p>
                        </div>
                    </div>

                    {uploadedFiles.length > 0 && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>File Name</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Progress</TableHead>
                                    <TableHead className="w-[100px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {uploadedFiles.map((file, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="flex items-center gap-2">
                                            <FileSpreadsheet className="h-4 w-4 text-violet-500" />
                                            {file.name}
                                        </TableCell>
                                        <TableCell>
                                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                file.status === 'success' ? 'bg-green-100 text-green-800' :
                                                file.status === 'error' ? 'bg-red-100 text-red-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                                {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                                            </span>
                                            {file.error && (
                                                <p className="text-xs text-red-500 mt-1">{file.error}</p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Progress value={file.progress} className="w-[100px]" />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeFile(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    <div className="mt-4 text-sm text-gray-500">
                        <p className="font-medium">
                            Instructions:
                        </p>
                        <ul className="list-disc list-inside space-y-1 mt-2">
                            <li>
                                File should be in Excel format (.xls, .xlsx) or CSV format
                            </li>
                            <li>
                                Maximum file size allowed is 5MB
                            </li>
                            <li>
                                Make sure to follow the sample format for successful upload
                            </li>
                            <li>
                                All required fields must be filled
                            </li>
                            <li>
                                Format should have column 'awb' with AWB numbers
                            </li>
                        </ul>
                    </div>

                    {isLoading ? (
                        <div className="text-center py-4">
                            <p>Loading received orders...</p>
                        </div>
                    ) : receivedOrders.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>AWB</TableHead>
                                    <TableHead>Received At</TableHead>
                                    <TableHead>Received By</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {receivedOrders.map((order) => (
                                    <TableRow key={order.awb}>
                                        <TableCell>{order.awb}</TableCell>
                                        <TableCell>{new Date(order.receivedAt).toLocaleString()}</TableCell>
                                        <TableCell>{order.receivedBy}</TableCell>
                                        <TableCell>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                                order.status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {order.items.map((item, index) => (
                                                <div key={index} className="text-sm">
                                                    {item.name} ({item.quantity}) - {item.condition}
                                                </div>
                                            ))}
                                        </TableCell>
                                        <TableCell>{order.notes}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-4">
                            <p>No received orders found</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default SellerReceivedPage; 