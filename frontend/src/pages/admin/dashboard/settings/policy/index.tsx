import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Edit, Search, Trash2, Plus, FileText, Clock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const POLICY_TEMPLATES = [
    { value: "default", label: "Default Template" },
    { value: "custom", label: "Custom Template" },
];

const POLICIES = [
    {
        id: 1,
        title: "Refund Policy",
        slug: "refund-policy",
        isPublished: true,
        requiredForSignup: true,
        lastUpdated: "2024-03-20",
        version: "1.0.0",
    },
    {
        id: 2,
        title: "Terms of Service",
        slug: "terms-of-service",
        isPublished: true,
        requiredForSignup: true,
        lastUpdated: "2024-03-20",
        version: "1.0.0",
    },
    {
        id: 3,
        title: "Privacy Policy",
        slug: "privacy-policy",
        isPublished: true,
        requiredForSignup: true,
        lastUpdated: "2024-03-20",
        version: "1.0.0",
    },
];

const PolicySettings = () => {
    const navigate = useNavigate();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
    const [selectedPolicy, setSelectedPolicy] = useState<typeof POLICIES[0] | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");

    const handleEdit = (policy: typeof POLICIES[0]) => {
        navigate(`/admin/dashboard/settings/policy/${policy.slug}/edit`);
    };

    const handleDelete = (policy: typeof POLICIES[0]) => {
        setSelectedPolicy(policy);
        setDeleteDialogOpen(true);
    };

    const handleCreate = () => {
        navigate("/admin/dashboard/settings/policy/create");
    };

    const confirmDelete = () => {
        if (selectedPolicy) {
            toast.success("Policy deleted successfully");
            setDeleteDialogOpen(false);
            setSelectedPolicy(null);
        }
    };

    const filteredPolicies = POLICIES.filter(policy =>
        policy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        policy.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl lg:text-2xl font-semibold">
                    Policy Pages
                </h1>
                <div className="flex items-center gap-4">
                    <Button variant="outline" className="gap-2" onClick={handleCreate}>
                        <Plus className="size-4" />
                        Add New
                    </Button>
                    <Select defaultValue="1">
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Template" />
                        </SelectTrigger>
                        <SelectContent>
                            {POLICY_TEMPLATES.map((template) => (
                                <SelectItem key={template.value} value={template.value}>
                                    {template.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="primary">
                        Import
                    </Button>
                </div>
            </div>

            <div className="flex items-center bg-neutral-100 px-4 h-10 rounded-lg">
                <Search className="text-muted-foreground size-4" />
                <Input
                    placeholder="Search policies..."
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="rounded-lg border overflow-hidden">
                <Table>
                    <TableHeader className="bg-[#6366F1]">
                        <TableRow>
                            <TableHead className="text-white">
                                SL
                            </TableHead>
                            <TableHead className="text-white">
                                Title
                            </TableHead>
                            <TableHead className="text-white">
                                Status
                            </TableHead>
                            <TableHead className="text-white">
                                Required
                            </TableHead>
                            <TableHead className="text-white">
                                Last Updated
                            </TableHead>
                            <TableHead className="text-white">
                                Version
                            </TableHead>
                            <TableHead className="text-white text-right">
                                Action
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPolicies.map((policy) => (
                            <TableRow key={policy.id}>
                                <TableCell>
                                    {policy.id}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <FileText className="size-4 text-muted-foreground" />
                                        {policy.title}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={policy.isPublished ? "default" : "secondary"}>
                                        {policy.isPublished ? "Published" : "Draft"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={policy.requiredForSignup ? "default" : "outline"}>
                                        {policy.requiredForSignup ? "Required" : "Optional"}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="size-4" />
                                        {policy.lastUpdated}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {policy.version}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="bg-[#6366F1] hover:bg-[#5659D9] text-white gap-2"
                                            onClick={() => handleEdit(policy)}
                                        >
                                            <Edit className="size-4" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="bg-red-500 hover:bg-red-600 text-white gap-2"
                                            onClick={() => handleDelete(policy)}
                                        >
                                            <Trash2 className="size-4" />
                                            Remove
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Are you sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the policy
                            "{selectedPolicy?.title}" and remove its data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default PolicySettings;
