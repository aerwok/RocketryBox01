import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDownIcon, PhoneIcon } from "lucide-react";

interface TechIssue {
    id: string;
    escId: string;
    escTime: string;
    escCloseDate: string;
    seller: {
        name: string;
        id: string;
    };
    time: string;
    action: string;
}

const TECH_ISSUES_DATA: TechIssue[] = [];

const AdminTechIssuesPage = () => {
    return (
        <div className="space-y-6">

            {/* Status Tabs */}
            <Tabs defaultValue="all" className="w-full relative z-0">
                <div className="absolute bottom-0 left-0 w-full h-px bg-border -z-10"></div>
                <TabsList className="w-full justify-start bg-transparent rounded-none h-auto p-0 space-x-6 z-10 overflow-x-auto">
                    <TabsTrigger
                        value="all"
                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 pb-2"
                    >
                        ALL
                    </TabsTrigger>
                    <TabsTrigger
                        value="new"
                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 pb-2"
                    >
                        New(54)
                    </TabsTrigger>
                    <TabsTrigger
                        value="followup"
                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 pb-2"
                    >
                        Follow up (0)
                    </TabsTrigger>
                    <TabsTrigger
                        value="seller-replied"
                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 pb-2"
                    >
                        Seller Replied (0)
                    </TabsTrigger>
                    <TabsTrigger
                        value="re-opened"
                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 pb-2"
                    >
                        Re-Opened (0)
                    </TabsTrigger>
                    <TabsTrigger
                        value="assigned"
                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 pb-2"
                    >
                        Assigned (0)
                    </TabsTrigger>
                    <TabsTrigger
                        value="pending"
                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 pb-2"
                    >
                        Pending from seller (0)
                    </TabsTrigger>
                    <TabsTrigger
                        value="closed"
                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 pb-2"
                    >
                        Closed (15)
                    </TabsTrigger>
                    <TabsTrigger
                        value="canceled"
                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 pb-2"
                    >
                        Canceled (0)
                    </TabsTrigger>
                    <TabsTrigger
                        value="deleted"
                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 pb-2"
                    >
                        Deleted (0)
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px] min-w-[50px]">
                                <Checkbox />
                            </TableHead>
                            <TableHead className="min-w-[100px]">
                                ESC ID
                            </TableHead>
                            <TableHead className="min-w-[150px]">
                                ESC TIME
                            </TableHead>
                            <TableHead className="min-w-[150px]">
                                ESC CLOSE DATE
                            </TableHead>
                            <TableHead className="min-w-[200px]">
                                SELLER
                            </TableHead>
                            <TableHead className="min-w-[100px]">
                                Time
                            </TableHead>
                            <TableHead className="min-w-[100px]">
                                Action
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {TECH_ISSUES_DATA.map((issue) => (
                            <TableRow key={issue.id}>
                                <TableCell>
                                    <Checkbox />
                                </TableCell>
                                <TableCell>
                                    {issue.escId}
                                </TableCell>
                                <TableCell>
                                    {issue.escTime}
                                </TableCell>
                                <TableCell>
                                    {issue.escCloseDate}
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <div>
                                            {issue.seller.name}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Seller No.{issue.seller.id}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {issue.time}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm">
                                            Remarks
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <PhoneIcon className="size-3" />
                                            <ChevronDownIcon className="size-3 ml-0.5" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default AdminTechIssuesPage; 