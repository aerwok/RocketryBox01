import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface BulkNDRUploadModalProps {
    open: boolean;
    onClose: () => void;
    onUpload: (file: File) => Promise<void>;
}

const BulkNDRUploadModal = ({ open, onClose, onUpload }: BulkNDRUploadModalProps) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.size <= 10 * 1024 * 1024) { // 10MB limit
            setSelectedFile(file);
        } else {
            toast.error("File size should be less than 10MB");
        }
    };

    const handleSave = async () => {
        if (!selectedFile) return;

        try {
            setIsUploading(true);
            await onUpload(selectedFile);
            toast.success("NDR data uploaded successfully");
            onClose();
        } catch (error) {
            console.error("Error uploading file:", error);
            toast.error("Failed to upload NDR data");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        Bulk NDR upload
                    </DialogTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
                        onClick={onClose}
                    >
                        <XIcon className="h-4 w-4" />
                    </Button>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <div className="flex items-baseline justify-between">
                            <label className="text-base font-medium">
                                Select File
                            </label>
                            <span className="text-sm text-gray-500">
                                (Optional): Upto 10MB
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                className="w-32"
                                onClick={() => document.getElementById("ndr-file-upload")?.click()}
                            >
                                Choose file
                            </Button>
                            <span className="text-sm text-gray-500">
                                {selectedFile ? selectedFile.name : "No file chosen"}
                            </span>
                            <input
                                type="file"
                                id="ndr-file-upload"
                                className="hidden"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
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
                        >
                            {isUploading ? "Uploading..." : "Save"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BulkNDRUploadModal; 