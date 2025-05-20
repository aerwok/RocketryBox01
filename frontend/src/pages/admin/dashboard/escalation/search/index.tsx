import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const AdminEscalationSearchPage = () => {
    return (
        <div className="flex flex-col gap-4 max-w-xl">
            <div className="flex items-end gap-4">
                <div className="flex-1">
                    <Input
                        type="text"
                        placeholder="Search By Escalation ID"
                        className="h-10 text-lg"
                    />
                </div>
                <Button
                    variant="primary"
                    size="lg"
                    className="h-10 px-8 text-lg"
                >
                    Search
                </Button>
            </div>
        </div>
    );
};

export default AdminEscalationSearchPage;
