import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { emailTemplateSchema, type EmailTemplateValues, smsTemplateSchema, type SMSTemplateValues, emailSettingsSchema, type EmailSettingsValues, smsSettingsSchema, type SMSSettingsValues, type SystemConfigValues } from "@/lib/validations/notification";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Mail, MessageSquare, Smartphone, Globe, Check, Settings2 } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const EMAIL_METHODS = [
    { value: "php", label: "PHP Mail" },
    { value: "smtp", label: "SMTP" },
    { value: "sendgrid", label: "SendGrid" },
    { value: "mailjet", label: "Mailjet" },
] as const;


const SMS_METHODS = [
    { value: "nexmo", label: "Nexmo" },
    { value: "Clickatell", label: "Clickatell" },
    { value: "Message Brid", label: "Message Brid" },
    { value: "Infobip", label: "Infobip" },
] as const;


const NOTIFICATION_TEMPLATES = [
    {
        name: "Default Template",
        subject: "{{subject}}",
    },
    {
        name: "Manager Create",
        subject: "Manager created",
    },
    {
        name: "Password - Reset - Code",
        subject: "Password Reset",
    },
    {
        name: "Password - Reset - Confirmation",
        subject: "You have reset your password",
    },
    {
        name: "Staff Create",
        subject: "Staff Create Courier lab",
    },
    {
        name: "Support - Reply",
        subject: "Reply Support Ticket",
    },
];

const NotificationSettings = () => {
    const [activeTemplate, setActiveTemplate] = useState<"email" | "sms" | null>("email");
    const [testMailOpen, setTestMailOpen] = useState(false);
    const [testSMSOpen, setTestSMSOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("global");

    const emailForm = useForm<EmailTemplateValues>({
        resolver: zodResolver(emailTemplateSchema),
        defaultValues: {
            emailSentFromName: "",
            emailSentFromEmail: "no-reply@courierlab.com",
            emailBody: `<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!DOCTYPE html>
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{site_name}}</title>
<style type="text/css">
    @media screen {
        @font-face { font-family: 'Source Sans Pro'; }
    }
    body { background-color: #f0f0f0; }
    table { border-spacing: 0; }
    td { padding: 0; }
    img { border: 0; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f0f0f0; padding-bottom: 40px; }
    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; font-family: sans-serif; }
    .two-columns { padding: 0; }
    .two-columns .column { width: 100%; max-width: 300px; display: inline-block; vertical-align: top; }
    .three-columns { text-align: center; font-size: 0; padding: 15px 0 25px; }
    .three-columns .column { width: 100%; max-width: 200px; display: inline-block; vertical-align: top; }
    .three-columns .padding { padding: 15px; }
    .three-columns .content { font-size: 15px; line-height: 20px; }
    .two-columns.last { padding: 15px 0; }
    .two-columns .padding { padding: 20px; }
    .two-columns .content { font-size: 15px; line-height: 20px; }
    .button { background-color: #1e90ff; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 5px; font-weight: bold; }
    .button-dark { background-color: #111111; }
    h3 { color: #111111; }
</style>

<center class="wrapper">
    <table class="main" width="100%">
        <tr>
            <td style="padding: 20px;">
                <table width="100%">
                    <tr>
                        <td style="text-align: center;">
                            <img src="logo.png" alt="Logo" width="165" title="Logo">
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="padding: 20px;">
                <h2 style="margin-bottom: 20px;">Hello {{fullname}} ({{username}})</h2>
                <p style="margin-bottom: 20px;">{{message}}</p>
            </td>
        </tr>
    </table>
</center>`,
        },
    });

    const smsForm = useForm<SMSTemplateValues>({
        resolver: zodResolver(smsTemplateSchema),
        defaultValues: {
            smsSentFrom: "CourierLab",
            smsBody: "Hi {{fullname}} ({{username}}) {{message}}",
        },
    });

    const testMailForm = useForm({
        defaultValues: {
            email: "",
        },
    });

    const emailSettingsForm = useForm<EmailSettingsValues>({
        resolver: zodResolver(emailSettingsSchema),
        defaultValues: {
            emailMethod: "php",
        },
    });

    const smsSettingsForm = useForm<SMSSettingsValues>({
        resolver: zodResolver(smsSettingsSchema),
        defaultValues: {
            smsMethod: "nexmo",
            apiKey: "",
            apiSecret: "",
        },
    });

    const testSMSForm = useForm({
        defaultValues: {
            mobile: "",
        },
    });

    const systemConfigForm = useForm<SystemConfigValues>({
        defaultValues: {
            emailNotification: true,
            smsNotification: true,
            languageOption: true,
        },
    });

    const onEmailSubmit = (data: EmailTemplateValues) => {
        toast.success("Email template updated successfully");
        console.log(data);
    };

    const onSMSSubmit = (data: SMSTemplateValues) => {
        toast.success("SMS template updated successfully");
        console.log(data);
    };

    const onTestMailSubmit = () => {
        toast.success("Test email sent successfully");
        setTestMailOpen(false);
        testMailForm.reset();
    };

    const onEmailSettingsSubmit = (data: EmailSettingsValues) => {
        toast.success("Email settings updated successfully");
        console.log(data);
    };

    const onSMSSettingsSubmit = (data: SMSSettingsValues) => {
        toast.success("SMS settings updated successfully");
        console.log(data);
    };

    const onTestSMSSubmit = () => {
        toast.success("Test SMS sent successfully");
        setTestSMSOpen(false);
        testSMSForm.reset();
    };

    const onSystemConfigSubmit = (data: SystemConfigValues) => {
        toast.success("System configuration updated successfully");
        console.log(data);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl lg:text-2xl font-semibold">
                    Notification Settings
                </h1>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="w-full overflow-auto scrollbar-hide">
                    <TabsList className="w-max min-w-full bg-white border-b rounded-none h-auto p-0 justify-start">
                        <div className="flex">
                            <TabsTrigger
                                value="global"
                                className="data-[state=active]:border-b-2 border-b-2 border-transparent data-[state=active]:border-main rounded-none px-4"
                            >
                                <Globe className="size-4 mr-2" />
                                Global Template
                            </TabsTrigger>
                            <TabsTrigger
                                value="email"
                                className="data-[state=active]:border-b-2 border-b-2 border-transparent data-[state=active]:border-main rounded-none px-4"
                            >
                                <Mail className="size-4 mr-2" />
                                Email Setting
                            </TabsTrigger>
                            <TabsTrigger
                                value="sms"
                                className="data-[state=active]:border-b-2 border-b-2 border-transparent data-[state=active]:border-main rounded-none px-4"
                            >
                                <MessageSquare className="size-4 mr-2" />
                                SMS Setting
                            </TabsTrigger>
                            <TabsTrigger
                                value="templates"
                                className="data-[state=active]:border-b-2 border-b-2 border-transparent data-[state=active]:border-main rounded-none px-4"
                            >
                                <Smartphone className="size-4 mr-2" />
                                Notification Templates
                            </TabsTrigger>
                            <TabsTrigger
                                value="configuration"
                                className="data-[state=active]:border-b-2 border-b-2 border-transparent data-[state=active]:border-main rounded-none px-4"
                            >
                                <Settings2 className="size-4 mr-2" />
                                Configuration
                            </TabsTrigger>
                        </div>
                    </TabsList>
                </div>

                <TabsContent value="global" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="p-6">
                            <Button
                                variant={activeTemplate === "email" ? "default" : "outline"}
                                className="w-full justify-start gap-2 h-auto py-4"
                                onClick={() => setActiveTemplate("email")}
                            >
                                <Mail className="size-5" />
                                Email Template
                            </Button>
                        </Card>
                        <Card className="p-6">
                            <Button
                                variant={activeTemplate === "sms" ? "default" : "outline"}
                                className="w-full justify-start gap-2 h-auto py-4"
                                onClick={() => setActiveTemplate("sms")}
                            >
                                <MessageSquare className="size-5" />
                                SMS Template
                            </Button>
                        </Card>
                    </div>

                    {activeTemplate === "email" && (
                        <div className="mt-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    <Form {...emailForm}>
                                        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
                                            <FormField
                                                control={emailForm.control}
                                                name="emailSentFromName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Email Sent From - Name <span className="text-red-500">*</span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={emailForm.control}
                                                name="emailSentFromEmail"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Email Sent From - Email <span className="text-red-500">*</span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={emailForm.control}
                                                name="emailBody"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            Email Body <span className="text-red-500">*</span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                {...field}
                                                                className="font-mono text-sm h-[400px]"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <Button type="submit" className="w-full bg-[#6366F1] hover:bg-[#5659D9]">
                                                Submit
                                            </Button>
                                        </form>
                                    </Form>
                                </div>

                                <div className="space-y-6">
                                    <Form {...smsForm}>
                                        <form onSubmit={smsForm.handleSubmit(onSMSSubmit)} className="space-y-6">
                                            <FormField
                                                control={smsForm.control}
                                                name="smsSentFrom"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            SMS Sent From <span className="text-red-500">*</span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={smsForm.control}
                                                name="smsBody"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>
                                                            SMS Body <span className="text-red-500">*</span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                {...field}
                                                                className="font-mono text-sm h-[200px]"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <Button type="submit" className="w-full bg-[#6366F1] hover:bg-[#5659D9]">
                                                Submit
                                            </Button>
                                        </form>
                                    </Form>
                                </div>
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="email" className="mt-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                Email Notification Settings
                            </h2>
                            <Button
                                variant="primary"
                                onClick={() => setTestMailOpen(true)}
                            >
                                <Mail className="mr-2 size-4" />
                                Send Test Mail
                            </Button>
                        </div>

                        <Form {...emailSettingsForm}>
                            <form onSubmit={emailSettingsForm.handleSubmit(onEmailSettingsSubmit)} className="space-y-4">
                                <FormField
                                    control={emailSettingsForm.control}
                                    name="emailMethod"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Email Send Method <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select email method" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {EMAIL_METHODS.map((method) => (
                                                        <SelectItem
                                                            key={method.value}
                                                            value={method.value}
                                                        >
                                                            {method.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit" variant="primary" className="w-full">
                                    Submit
                                </Button>
                            </form>
                        </Form>
                    </div>
                </TabsContent>

                <TabsContent value="sms" className="mt-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                SMS Notification Settings
                            </h2>
                            <Button
                                variant="primary"
                                onClick={() => setTestSMSOpen(true)}
                            >
                                <MessageSquare className="mr-2 size-4" />
                                Send Test SMS
                            </Button>
                        </div>

                        <Form {...smsSettingsForm}>
                            <form onSubmit={smsSettingsForm.handleSubmit(onSMSSettingsSubmit)} className="space-y-4">
                                <FormField
                                    control={smsSettingsForm.control}
                                    name="smsMethod"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                SMS Send Method <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select SMS method" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {SMS_METHODS.map((method) => (
                                                        <SelectItem
                                                            key={method.value}
                                                            value={method.value}
                                                        >
                                                            {method.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-4">
                                    <h3 className="font-medium">API Configuration</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={smsSettingsForm.control}
                                            name="apiKey"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        API Key <span className="text-red-500">*</span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={smsSettingsForm.control}
                                            name="apiSecret"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        API Secret <span className="text-red-500">*</span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input type="password" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <Button type="submit" variant="primary" className="w-full">
                                    Submit
                                </Button>
                            </form>
                        </Form>
                    </div>
                </TabsContent>

                <TabsContent value="templates" className="mt-6">
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                Notification Templates
                            </h2>
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Template Name</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {NOTIFICATION_TEMPLATES.map((template) => (
                                        <TableRow key={template.name}>
                                            <TableCell>{template.name}</TableCell>
                                            <TableCell>{template.subject}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="bg-[#6366F1] hover:bg-[#5659D9] text-white"
                                                    >
                                                        <Mail className="size-4 mr-2" />
                                                        Email
                                                        <Check className="size-4 ml-1" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white"
                                                    >
                                                        <MessageSquare className="size-4 mr-2" />
                                                        SMS
                                                        <Check className="size-4 ml-1" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="configuration" className="mt-6">
                    <div className="space-y-6">
                        <Form {...systemConfigForm}>
                            <form onSubmit={systemConfigForm.handleSubmit(onSystemConfigSubmit)} className="space-y-6">
                                <div className="rounded-lg border overflow-hidden divide-y">
                                    <div className="p-6 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium">Email Notification</h3>
                                                <p className="text-sm text-gray-500">
                                                    If you enable this module, the system will send emails to users where needed. Otherwise, no email will be sent.
                                                    <span className="text-red-500 ml-1">So be sure before disabling this module that, the system doesn't need to send any emails.</span>
                                                </p>
                                            </div>
                                            <FormField
                                                control={systemConfigForm.control}
                                                name="emailNotification"
                                                render={({ field }) => (
                                                    <FormItem>
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
                                    </div>

                                    <div className="p-6 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium">SMS Notification</h3>
                                                <p className="text-sm text-gray-500">
                                                    If you enable this module, the system will send SMS to users where needed. Otherwise, no SMS will be sent.
                                                    <span className="text-red-500 ml-1">So be sure before disabling this module that, the system doesn't need to send any SMS.</span>
                                                </p>
                                            </div>
                                            <FormField
                                                control={systemConfigForm.control}
                                                name="smsNotification"
                                                render={({ field }) => (
                                                    <FormItem>
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
                                    </div>

                                    <div className="p-6 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium">Language Option</h3>
                                                <p className="text-sm text-gray-500">
                                                    Enable or disable language selection option for users.
                                                </p>
                                            </div>
                                            <FormField
                                                control={systemConfigForm.control}
                                                name="languageOption"
                                                render={({ field }) => (
                                                    <FormItem>
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
                                    </div>
                                </div>

                                <Button type="submit" variant="primary" className="w-full">
                                    Submit
                                </Button>
                            </form>
                        </Form>
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog open={testMailOpen} onOpenChange={setTestMailOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Test Email Setup</DialogTitle>
                    </DialogHeader>
                    <Form {...testMailForm}>
                        <form onSubmit={testMailForm.handleSubmit(onTestMailSubmit)} className="space-y-4">
                            <FormField
                                control={testMailForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Sent to
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="email"
                                                placeholder="Email Address"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full"
                            >
                                Submit
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={testSMSOpen} onOpenChange={setTestSMSOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Test SMS Setup</DialogTitle>
                    </DialogHeader>
                    <Form {...testSMSForm}>
                        <form onSubmit={testSMSForm.handleSubmit(onTestSMSSubmit)} className="space-y-4">
                            <FormField
                                control={testSMSForm.control}
                                name="mobile"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Sent to
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="tel"
                                                placeholder="Mobile Number"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full"
                            >
                                Submit
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default NotificationSettings; 