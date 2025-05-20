import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { 
    CheckCircle2, 
    FileDown, 
    FileSpreadsheet, 
    FileText, 
    X 
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BulkDisputeUploadModalProps {
    open?: boolean;
    onClose?: () => void;
    onUpload: (file: File) => Promise<void>;
}

const BulkDisputeUploadModal = ({ open = false, onClose = () => {}, onUpload }: BulkDisputeUploadModalProps) => {
    
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.size <= 10 * 1024 * 1024) { // 10MB limit
            setSelectedFile(file);
        } else if (file) {
            toast.error("File size should be less than 10MB");
        }
    };

    const handleSave = async () => {
        if (!selectedFile) return;

        try {
            setIsUploading(true);
            await onUpload(selectedFile);
            toast.success("Dispute report uploaded successfully!");
            onClose();
        } catch (error) {
            console.error("Error uploading file:", error);
            toast.error("Failed to upload dispute report");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownloadSample = (format: 'csv' | 'excel') => {
        try {
            // Create a link element to trigger download
            const link = document.createElement('a');
            
            if (format === 'csv') {
                link.href = '/docs/weight_dispute_template.csv';
                link.download = 'weight_dispute_template.csv';
            } else {
                link.href = '/docs/weight_dispute_template.xlsx';
                link.download = 'weight_dispute_template.xlsx';
            }
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.success(`${format.toUpperCase()} template downloaded`);
        } catch (error) {
            console.error("Download error:", error);
            toast.error("Failed to download sample template");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        Upload Dispute Report
                    </DialogTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="text-sm text-gray-600">
                        <p>Upload a file containing weight disputes for processing. Download a sample template to ensure your data is in the correct format.</p>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex items-baseline justify-between">
                            <label className="text-base font-medium">
                                Select File<span className="text-red-500">*</span>
                            </label>
                            <span className="text-sm text-gray-500">
                                Upto 10MB
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                className="w-32"
                                onClick={() => document.getElementById("dispute-file-upload")?.click()}
                            >
                                Choose file
                            </Button>
                            <span className="text-sm text-gray-500">
                                {selectedFile ? selectedFile.name : "No file chosen"}
                            </span>
                            <input
                                type="file"
                                id="dispute-file-upload"
                                className="hidden"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileChange}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Supported file formats: .xlsx, .xls, .csv
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    <FileDown className="h-4 w-4" />
                                    Sample file
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDownloadSample('csv')}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    <span>CSV Format</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownloadSample('excel')}>
                                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                                    <span>Excel Format</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-600 border-0"
                        >
                            Close
                        </Button>
                        <Button
                            variant="purple"
                            onClick={handleSave}
                            disabled={!selectedFile || isUploading}
                            className="flex items-center gap-2"
                        >
                            {isUploading ? (
                                <>
                                    <span className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Upload Dispute
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BulkDisputeUploadModal;