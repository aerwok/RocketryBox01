import { Input } from "@/components/ui/input";
import { FileSpreadsheet, UploadCloud } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    maxSize?: number;
}

const FileUpload = ({ onFileSelect, accept = ".xls,.xlsx,.csv", maxSize = 5 }: FileUploadProps) => {

    const [dragActive, setDragActive] = useState<boolean>(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const validateFile = (file: File) => {
        const fileType = file.name.split('.').pop()?.toLowerCase();
        const validTypes = accept.split(',').map(type => type.replace('.', '').toLowerCase());

        if (!validTypes.includes(fileType || '')) {
            toast.error(`Invalid file type. Please upload ${accept} files only`);
            return false;
        }

        const fileSize = file.size / (1024 * 1024); // Convert to MB
        if (fileSize > maxSize) {
            toast.error(`File size should be less than ${maxSize}MB`);
            return false;
        }

        return true;
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

        const file = e.dataTransfer.files[0];
        if (file && validateFile(file)) {
            setSelectedFile(file);
            onFileSelect(file);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (validateFile(file)) {
                setSelectedFile(file);
                onFileSelect(file);
            }
        }
    };

    return (
        <div className="w-full">
            <div
                className={`relative border-2 border-dashed rounded-lg p-6 ${dragActive
                    ? "border-violet-500 bg-violet-50"
                    : "border-gray-300 bg-gray-50"
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <Input
                    type="file"
                    accept={accept}
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center">
                    {selectedFile ? (
                        <div className="flex items-center justify-center gap-2">
                            <FileSpreadsheet className="h-8 w-8 text-violet-500" />
                            <div>
                                <p className="text-sm font-medium">
                                    {selectedFile.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                                Drag and drop your file here, or click to browse
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                Supported formats: {accept} (Max {maxSize}MB)
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FileUpload; 