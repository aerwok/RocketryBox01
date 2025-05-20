import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface UploadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    onUpload: (file: File) => void;
}

const UploadModal = ({ open, onOpenChange, title, onUpload }: UploadModalProps) => {

    const [dragActive, setDragActive] = useState<boolean>(false);

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

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onUpload(e.dataTransfer.files[0]);
            onOpenChange(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            onUpload(e.target.files[0]);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {title}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div
                        className={cn(
                            "relative rounded-lg border-2 border-dashed p-8 text-center",
                            dragActive ? "border-[#2B4EA8] bg-blue-50" : "border-gray-300"
                        )}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            id="file-upload"
                            onChange={handleChange}
                        />
                        <div className="flex flex-col items-center">
                            <img
                                src="/icons/upload.svg"
                                alt="Upload"
                                className="h-auto w-12"
                            />
                            <p className="mt-4 text-sm font-medium">
                                Drag your file(s) to start uploading
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                OR
                            </p>
                            <label
                                htmlFor="file-upload"
                                className="mt-2 cursor-pointer rounded-lg border-2 border-main bg-white px-3 py-1.5 text-sm font-medium text-main hover:bg-main/10"
                            >
                                Browse files
                            </label>
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                        Only support pdf files
                    </p>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default UploadModal; 