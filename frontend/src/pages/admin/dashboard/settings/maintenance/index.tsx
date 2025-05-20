import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import MDEditor from "@uiw/react-md-editor";
import { Upload, X, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MaintenanceValues, maintenanceSchema } from "@/lib/validations/maintenance";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const MaintenanceSettings = () => {
    const [preview, setPreview] = useState<string>("");
    const [startDate, setStartDate] = useState<Date>();
    const [endDate, setEndDate] = useState<Date>();

    const form = useForm<MaintenanceValues>({
        resolver: zodResolver(maintenanceSchema),
        defaultValues: {
            isEnabled: false,
            image: "",
            content: "",
            whitelistedIPs: [],
            customCSS: "",
            customJS: "",
            analyticsEnabled: false,
        },
    });

    const onSubmit = (data: MaintenanceValues) => {
        toast.success("Maintenance settings updated successfully");
        console.log(data);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
                form.setValue("image", reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setPreview("");
        form.setValue("image", "");
    };

    const handleIPAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const input = e.currentTarget;
            const ip = input.value.trim();
            if (ip && /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip)) {
                const currentIPs = form.getValues("whitelistedIPs") || [];
                form.setValue("whitelistedIPs", [...currentIPs, ip]);
                input.value = "";
            } else {
                toast.error("Please enter a valid IP address");
            }
        }
    };

    const handleIPRemove = (ipToRemove: string) => {
        const currentIPs = form.getValues("whitelistedIPs") || [];
        form.setValue("whitelistedIPs", currentIPs.filter(ip => ip !== ipToRemove));
    };

    return (
        <div className="space-y-6" data-color-mode="light">
            <div className="flex items-center justify-between">
                <h1 className="text-xl lg:text-2xl font-semibold">
                    Maintenance Mode
                </h1>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Side */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="rounded-lg border p-6 space-y-4">
                                <FormField
                                    control={form.control}
                                    name="isEnabled"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between space-y-0">
                                            <div className="space-y-0.5">
                                                <FormLabel className="font-medium">
                                                    Status
                                                </FormLabel>
                                                <FormDescription>
                                                    Enable or disable maintenance mode
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="analyticsEnabled"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between space-y-0">
                                            <div className="space-y-0.5">
                                                <FormLabel className="font-medium">
                                                    Analytics
                                                </FormLabel>
                                                <FormDescription>
                                                    Track maintenance page visits
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="rounded-lg border">
                                <div className="p-6 space-y-4">
                                    <h3 className="font-medium">Image</h3>
                                    <FormField
                                        control={form.control}
                                        name="image"
                                        render={() => (
                                            <FormItem>
                                                <FormControl>
                                                    <div className="relative">
                                                        {preview ? (
                                                            <div className="relative aspect-video rounded-lg overflow-hidden">
                                                                <img
                                                                    src={preview}
                                                                    alt="Preview"
                                                                    className="object-cover w-full h-full"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={handleRemoveImage}
                                                                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm hover:bg-neutral-100"
                                                                >
                                                                    <X className="size-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-4 relative">
                                                                <input
                                                                    type="file"
                                                                    accept="image/png,image/jpeg,image/jpg"
                                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                                    onChange={handleImageUpload}
                                                                />
                                                                <Upload className="size-8 text-muted-foreground" />
                                                                <p className="text-sm text-muted-foreground">
                                                                    Supported Files: .png, .jpg, .jpeg
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Image will be resized into 1200x800px
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="rounded-lg border">
                                <div className="p-6 space-y-4">
                                    <h3 className="font-medium">Scheduled Maintenance</h3>
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="scheduledStart"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Start Date</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "w-full pl-3 text-left font-normal",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value ? (
                                                                        format(new Date(field.value), "PPP")
                                                                    ) : (
                                                                        <span>Pick a date</span>
                                                                    )}
                                                                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <CalendarComponent
                                                                mode="single"
                                                                selected={startDate}
                                                                onSelect={(date) => {
                                                                    setStartDate(date);
                                                                    field.onChange(date?.toISOString());
                                                                }}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="scheduledEnd"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>End Date</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "w-full pl-3 text-left font-normal",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value ? (
                                                                        format(new Date(field.value), "PPP")
                                                                    ) : (
                                                                        <span>Pick a date</span>
                                                                    )}
                                                                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto p-0" align="start">
                                                            <CalendarComponent
                                                                mode="single"
                                                                selected={endDate}
                                                                onSelect={(date) => {
                                                                    setEndDate(date);
                                                                    field.onChange(date?.toISOString());
                                                                }}
                                                                initialFocus
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border">
                                <div className="p-6 space-y-4">
                                    <h3 className="font-medium">IP Whitelist</h3>
                                    <FormField
                                        control={form.control}
                                        name="whitelistedIPs"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <div className="space-y-4">
                                                        <Input
                                                            placeholder="Enter IP address and press Enter"
                                                            onKeyDown={handleIPAdd}
                                                        />
                                                        <div className="flex flex-wrap gap-2">
                                                            {field.value?.map((ip) => (
                                                                <div
                                                                    key={ip}
                                                                    className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full"
                                                                >
                                                                    <span>{ip}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleIPRemove(ip)}
                                                                        className="text-muted-foreground hover:text-foreground"
                                                                    >
                                                                        <X className="size-3" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Side */}
                        <div className="lg:col-span-8 space-y-6">
                            <div className="rounded-lg border">
                                <div className="p-6 space-y-4 h-full flex flex-col">
                                    <h3 className="font-medium">
                                        Description
                                    </h3>
                                    <FormField
                                        control={form.control}
                                        name="content"
                                        render={({ field }) => (
                                            <FormItem className="h-full">
                                                <FormControl className="h-full">
                                                    <MDEditor
                                                        value={field.value}
                                                        onChange={(value) => field.onChange(value || "")}
                                                        preview="edit"
                                                        className="!border-0 min-h-full h-full flex-1"
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="rounded-lg border">
                                <div className="p-6 space-y-4">
                                    <h3 className="font-medium">Custom Code</h3>
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="customCSS"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Custom CSS</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            {...field}
                                                            placeholder="Enter custom CSS"
                                                            className="font-mono text-sm h-[200px]"
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="customJS"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Custom JavaScript</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            {...field}
                                                            placeholder="Enter custom JavaScript"
                                                            className="font-mono text-sm h-[200px]"
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button type="submit" variant="primary" className="w-full">
                        Submit
                    </Button>
                </form>
            </Form>
        </div>
    );
};

export default MaintenanceSettings;