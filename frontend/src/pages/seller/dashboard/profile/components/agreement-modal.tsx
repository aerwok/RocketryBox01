import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgreementVersion {
    version: string;
    docLink: string;
    acceptanceDate: string;
    publishedOn: string;
    ipAddress: string;
    status: "Accepted" | "Pending" | "Rejected";
    content?: {
        serviceProvider: {
            name: string;
            address: string;
            email: string;
        };
        merchant: {
            name: string;
            address: string;
            email: string;
        };
        merchantBusiness: string;
        serviceProviderBusiness: string[];
    };
}

interface AgreementModalProps {
    isOpen: boolean;
    onClose: () => void;
    agreement: AgreementVersion | null;
    onAccept?: (agreement: AgreementVersion) => void;
    onReject?: (agreement: AgreementVersion) => void;
}

const AgreementModal = ({ isOpen, onClose, agreement, onAccept, onReject }: AgreementModalProps) => {
    if (!agreement) return null;

    const handleAccept = () => {
        if (onAccept) {
            onAccept(agreement);
            onClose();
        }
    };

    const handleReject = () => {
        if (onReject) {
            onReject(agreement);
            onClose();
        }
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={onClose}
        >
            <DialogContent
                className="max-w-4xl max-h-[80vh] overflow-y-auto"
                showCloseButton={false}
            >
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl">
                            Merchant Agreement
                        </DialogTitle>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <p className="text-sm">
                        This Merchant Agreement (the "Agreement") is made on {new Date(agreement.publishedOn).toLocaleString()}
                        <br />
                        and effective from {new Date(agreement.publishedOn).toLocaleString()}
                    </p>

                    <div className="space-y-4">
                        <h3 className="font-semibold">
                            BY AND BETWEEN:
                        </h3>

                        <p className="text-sm">
                            {agreement.content?.serviceProvider.name}, a company incorporated under the Companies Act,2013,
                            <br />
                            and having its registered Office at {agreement.content?.serviceProvider.address},
                            <br />
                            duly represented by its Authorized Signatory having official E-Mail {agreement.content?.serviceProvider.email}
                            <br />
                            (hereinafter referred to as "Service Provider" which expression shall, unless it be repugnant to the subject or context thereof,
                            <br />
                            mean and include its successors-in-interest, affiliates and assigns) of the FIRST PARTY
                        </p>

                        <h3 className="font-semibold">
                            AND
                        </h3>

                        <p className="text-sm">
                            {agreement.content?.merchant.name}, a Private Limited Company
                            <br />
                            and having its registered office at {agreement.content?.merchant.address},
                            <br />
                            duly represented by its Authorized Signatory having official E Mail {agreement.content?.merchant.email}
                            <br />
                            (hereinafter referred to as "Merchant" which expression shall, unless it be repugnant to the subject or context thereof,
                            <br />
                            mean and include its successors-in-interest, affiliates and permitted assigns) of the SECOND PARTY
                        </p>

                        <p className="text-sm">
                            Service Provider and Merchant are individually referred to as a "Party" and collectively as the "Parties".
                        </p>

                        <h3 className="font-semibold">
                            WHEREAS
                        </h3>

                        <ul className="list-disc pl-6 space-y-2 text-sm">
                            <li>
                                The Merchant is involved in the {agreement.content?.merchantBusiness} business, among other things.
                            </li>

                            <li>
                                The Service Provider is involved in the following verticals of logistics:
                                <br />
                                {agreement.content?.serviceProviderBusiness.map((business, index) => (
                                    <span key={index}>
                                        {business}
                                        {index < (agreement.content?.serviceProviderBusiness.length || 0) - 1 ? ', ' : ''}
                                        {index === (agreement.content?.serviceProviderBusiness.length || 0) - 2 ? ' and ' : ''}
                                    </span>
                                ))}
                            </li>
                        </ul>
                    </div>
                </div>

                <DialogFooter className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                        Agreement Status: <span className={cn(
                            agreement.status === "Accepted" ? "text-green-600" : 
                            agreement.status === "Rejected" ? "text-red-600" : 
                            "text-yellow-600"
                        )}>{agreement.status}</span>
                    </div>
                    <div className="flex gap-2">
                        {agreement.status === "Pending" && (
                            <>
                                <Button
                                    variant="outline"
                                    className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                                    onClick={handleAccept}
                                >
                                    <Check className="h-4 w-4 mr-1" />
                                    Accept Agreement
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleReject}
                                >
                                    Reject Agreement
                                </Button>
                            </>
                        )}
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AgreementModal; 