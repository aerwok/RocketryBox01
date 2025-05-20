import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ArrowUpDown } from "lucide-react";
import { useState, useEffect } from "react";
import AgreementModal from "./agreement-modal";
import { toast } from "sonner";
import { ServiceFactory } from "@/services/service-factory";

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

interface AgreementProps {
    onSave: () => void;
}

const Agreement = ({ onSave }: AgreementProps) => {
    const [agreementVersions, setAgreementVersions] = useState<AgreementVersion[]>([]);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [selectedVersion, setSelectedVersion] = useState<AgreementVersion | null>(null);
    const [sortConfig, setSortConfig] = useState<{
        key: keyof AgreementVersion;
        direction: 'asc' | 'desc';
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchAgreements();
    }, []);

    const fetchAgreements = async () => {
        try {
            setIsLoading(true);
            const response = await ServiceFactory.seller.profile.getAgreements();
            if (!response.success) {
                throw new Error(response.message || 'Failed to fetch agreements');
            }
            setAgreementVersions(response.data);
        } catch (error) {
            console.error('Error fetching agreements:', error);
            toast.error('Failed to fetch agreements');
        } finally {
            setIsLoading(false);
        }
    };

    const handleView = (agreement: AgreementVersion) => {
        setSelectedVersion(agreement);
        setIsModalOpen(true);
    };

    const handleAccept = async (agreement: AgreementVersion) => {
        try {
            const response = await ServiceFactory.seller.profile.acceptAgreement(agreement.version);
            if (!response.success) {
                throw new Error(response.message || 'Failed to accept agreement');
            }
            
            setAgreementVersions(prevVersions => 
                prevVersions.map(version => 
                    version.version === agreement.version 
                        ? { ...version, status: "Accepted", acceptanceDate: new Date().toLocaleDateString() }
                        : version
                )
            );
            toast.success("Agreement accepted successfully");
            onSave();
        } catch (error) {
            console.error('Error accepting agreement:', error);
            toast.error("Failed to accept agreement");
        }
    };

    const handleReject = async (agreement: AgreementVersion) => {
        try {
            const response = await ServiceFactory.seller.profile.rejectAgreement(agreement.version);
            if (!response.success) {
                throw new Error(response.message || 'Failed to reject agreement');
            }
            
            setAgreementVersions(prevVersions => 
                prevVersions.map(version => 
                    version.version === agreement.version 
                        ? { ...version, status: "Rejected", acceptanceDate: new Date().toLocaleDateString() }
                        : version
                )
            );
            toast.success("Agreement rejected");
            onSave();
        } catch (error) {
            console.error('Error rejecting agreement:', error);
            toast.error("Failed to reject agreement");
        }
    };

    const handleSort = (key: keyof AgreementVersion) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const sortedData = [...agreementVersions].sort((a, b) => {
        if (!sortConfig) return 0;

        const { key, direction } = sortConfig;
        const aValue = a[key] ?? '';
        const bValue = b[key] ?? '';
        
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleDownload = async (version: string) => {
        try {
            const response = await ServiceFactory.seller.profile.downloadAgreement(version);
            if (!response.success) {
                throw new Error(response.message || 'Failed to download agreement');
            }

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `agreement-${version}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading agreement:', error);
            toast.error('Failed to download agreement');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 overflow-hidden">
            <div className="w-[calc(100vw-4rem)] lg:w-full -mr-4 lg:mr-0">
                <div className="w-full overflow-x-auto scrollbar-hide">
                    <div className="rounded-lg border scrollbar-hide">
                        <Table>
                            <TableHeader className="bg-[#F4F2FF] h-12">
                                <TableRow className="hover:bg-[#F4F2FF]">
                                    <TableHead onClick={() => handleSort('version')} className="cursor-pointer text-black min-w-[170px] whitespace-nowrap">
                                        Agreement Version <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                    </TableHead>
                                    <TableHead onClick={() => handleSort('docLink')} className="cursor-pointer text-black min-w-[100px] whitespace-nowrap">
                                        Doc Link <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                    </TableHead>
                                    <TableHead onClick={() => handleSort('acceptanceDate')} className="cursor-pointer text-black min-w-[140px] whitespace-nowrap">
                                        Acceptance Date <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                    </TableHead>
                                    <TableHead onClick={() => handleSort('publishedOn')} className="cursor-pointer text-black min-w-[140px] whitespace-nowrap">
                                        Published On <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                    </TableHead>
                                    <TableHead onClick={() => handleSort('ipAddress')} className="cursor-pointer text-black min-w-[130px] whitespace-nowrap">
                                        IP Address <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                    </TableHead>
                                    <TableHead onClick={() => handleSort('status')} className="cursor-pointer text-black min-w-[120px] whitespace-nowrap">
                                        Status <ArrowUpDown className="inline h-4 w-4 ml-1" />
                                    </TableHead>
                                    <TableHead className="text-black min-w-[120px] whitespace-nowrap">
                                        Action
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedData.map((agreement, index) => (
                                    <TableRow key={index} className="h-12">
                                        <TableCell className="whitespace-nowrap">
                                            {agreement.version}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <Button
                                                variant="link"
                                                className="p-0 h-auto font-normal"
                                                onClick={() => handleView(agreement)}
                                            >
                                                {agreement.docLink}
                                            </Button>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {agreement.acceptanceDate}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {agreement.publishedOn}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            {agreement.ipAddress}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <span className={cn(
                                                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                                                agreement.status === "Accepted"
                                                    ? "bg-purple-100 text-purple-800"
                                                    : agreement.status === "Rejected"
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-yellow-100 text-yellow-800"
                                            )}>
                                                {agreement.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleView(agreement)}
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleDownload(agreement.version)}
                                                >
                                                    Download
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            <AgreementModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                agreement={selectedVersion}
                onAccept={handleAccept}
                onReject={handleReject}
            />
        </div>
    );
};

export default Agreement; 