import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Plus, Trash2, Package, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog";
import * as XLSX from 'xlsx';
import { ServiceFactory } from "@/services/service-factory";

interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    price: number;
    stock: number;
    status: "Active" | "Inactive";
    lastUpdated: string;
}

const SellerProductsPage = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortConfig, setSortConfig] = useState<{
        key: keyof Product;
        direction: "asc" | "desc";
    } | null>(null);
    const [open, setOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch products from API
    const fetchProducts = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await ServiceFactory.seller.product.getProducts();
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to fetch products');
            }

            setProducts(response.data);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to load products. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    // Load products on component mount
    useEffect(() => {
        fetchProducts();
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleSort = (key: keyof Product) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === "asc" ? "desc" : "asc",
        }));
    };

    const handleDelete = (productId: string) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            setProductToDelete(product);
            setDeleteDialogOpen(true);
        }
    };

    const confirmDelete = async () => {
        if (productToDelete) {
            try {
                setIsLoading(true);
                const response = await ServiceFactory.seller.product.delete(productToDelete.id);
                
                if (!response.success) {
                    throw new Error(response.message || 'Failed to delete product');
                }

                setProducts(prevProducts => 
                    prevProducts.filter(p => p.id !== productToDelete.id)
                );
                toast.success(`Product "${productToDelete.name}" deleted successfully.`);
            } catch (err) {
                console.error('Error deleting product:', err);
                toast.error('Failed to delete product. Please try again.');
            } finally {
                setIsLoading(false);
                setDeleteDialogOpen(false);
                setProductToDelete(null);
            }
        }
    };

    const handleAddNewProduct = () => {
        setOpen(true);
    };

    const handleUpload = async () => {
        if (!fileInputRef.current?.files?.length) {
            toast.error('Please select a file to upload');
            return;
        }

        const file = fileInputRef.current.files[0];
        const formData = new FormData();
        formData.append('file', file);

        try {
            setIsLoading(true);
            const response = await ServiceFactory.seller.product.import(formData);
            
            if (!response.success) {
                throw new Error(response.message || 'Failed to import products');
            }

            toast.success('Products imported successfully');
            fetchProducts();
            setOpen(false);
        } catch (err) {
            console.error('Error uploading products:', err);
            toast.error('Failed to import products. Please check your file format and try again.');
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSampleFile = () => {
        const workbook = XLSX.utils.book_new();
        const headers = [
            "Product Name", 
            "SKU", 
            "Category", 
            "Price", 
            "Stock", 
            "Status", 
            "Last Updated"
        ];
        
        const sampleData = [
            headers,
            ["Premium Laptop", "LAP001", "Electronics", "49999", "50", "Active", "2024-03-25"],
            ["Wireless Mouse", "MOU001", "Accessories", "1799", "100", "Active", "2024-03-25"]
        ];
        
        const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sample Products");
        XLSX.writeFile(workbook, "sample_products_sheet.xlsx");
        
        toast.success("Sample file downloaded successfully!");
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;
        if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
        if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
        return 0;
    });

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-xl lg:text-2xl font-semibold">
                    Products SKU
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Package className="size-4" />
                    <span>Manage your product inventory</span>
                </div>
            </div>

            <div className="space-y-4">
                {/* Search and Actions */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-[300px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Search products..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={handleSearch}
                            />
                        </div>
                    </div>
                    <Button className="w-full lg:w-auto" onClick={handleAddNewProduct}>
                        <Plus className="size-4 mr-2" />
                        Add New Product
                    </Button>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogContent className="max-w-lg w-full rounded-xl shadow-lg p-6" showCloseButton={false}>
                            <DialogHeader>
                                <DialogTitle className="text-lg font-semibold">UPLOAD SKU</DialogTitle>
                                <DialogClose asChild>
                                    <button className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-xl">&times;</button>
                                </DialogClose>
                            </DialogHeader>
                            <div className="flex flex-col gap-4 mt-2">
                                <label className="font-medium text-sm">Upload Excel <span className="text-red-500">*</span></label>
                                <div className="flex flex-col gap-3 items-stretch">
                                    <input 
                                        ref={fileInputRef} 
                                        type="file" 
                                        accept=".xlsx,.xls" 
                                        className="border rounded px-2 py-1 flex-1 min-w-0"
                                        disabled={isLoading}
                                    />
                                    <div className="flex gap-2 mt-2 sm:mt-0">
                                        <Button 
                                            type="button" 
                                            className="bg-green-500 hover:bg-green-600 text-white flex gap-1 items-center px-4 py-2 rounded-md shadow-none" 
                                            onClick={handleUpload}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                                            {isLoading ? 'Uploading...' : 'Upload'}
                                        </Button>
                                        <Button 
                                            type="button" 
                                            className="bg-yellow-400 hover:bg-yellow-500 text-white flex gap-1 items-center px-4 py-2 rounded-md shadow-none" 
                                            onClick={handleSampleFile}
                                            disabled={isLoading}
                                        >
                                            <Plus className="size-4" /> Download Template
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Products Table */}
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead
                                    className="cursor-pointer"
                                    onClick={() => handleSort("name")}
                                >
                                    Product Name
                                    {sortConfig?.key === "name" && (
                                        <span className="ml-1">
                                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                                        </span>
                                    )}
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer"
                                    onClick={() => handleSort("sku")}
                                >
                                    SKU
                                    {sortConfig?.key === "sku" && (
                                        <span className="ml-1">
                                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                                        </span>
                                    )}
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer"
                                    onClick={() => handleSort("category")}
                                >
                                    Category
                                    {sortConfig?.key === "category" && (
                                        <span className="ml-1">
                                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                                        </span>
                                    )}
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer"
                                    onClick={() => handleSort("price")}
                                >
                                    Price
                                    {sortConfig?.key === "price" && (
                                        <span className="ml-1">
                                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                                        </span>
                                    )}
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer"
                                    onClick={() => handleSort("stock")}
                                >
                                    Stock
                                    {sortConfig?.key === "stock" && (
                                        <span className="ml-1">
                                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                                        </span>
                                    )}
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer"
                                    onClick={() => handleSort("status")}
                                >
                                    Status
                                    {sortConfig?.key === "status" && (
                                        <span className="ml-1">
                                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                                        </span>
                                    )}
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer"
                                    onClick={() => handleSort("lastUpdated")}
                                >
                                    Last Updated
                                    {sortConfig?.key === "lastUpdated" && (
                                        <span className="ml-1">
                                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                                        </span>
                                    )}
                                </TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8">
                                        <div className="flex items-center justify-center">
                                            <Loader2 className="size-6 animate-spin text-gray-500 mr-2" />
                                            <span className="text-gray-500">Loading products...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : error ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-red-500">
                                        {error}
                                    </TableCell>
                                </TableRow>
                            ) : sortedProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                        No products found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedProducts.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>{product.sku}</TableCell>
                                        <TableCell>{product.category}</TableCell>
                                        <TableCell>₹{product.price.toLocaleString()}</TableCell>
                                        <TableCell>{product.stock}</TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    product.status === "Active"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                }`}
                                            >
                                                {product.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>{product.lastUpdated}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(product.id)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    disabled={isLoading}
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="max-w-md rounded-xl shadow-lg">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold">Confirm Delete</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        {productToDelete && (
                            <p className="text-gray-700">
                                Are you sure you want to delete "<span className="font-medium">{productToDelete.name}</span>"? This action cannot be undone.
                            </p>
                        )}
                    </div>
                    <DialogFooter className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="size-4 animate-spin mr-2" />
                                    Deleting...
                                </>
                            ) : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SellerProductsPage; 