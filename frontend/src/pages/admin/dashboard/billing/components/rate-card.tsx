import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Calculator, Download, Eye, Plus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';


interface UploadedRateCard {
  id: string;
  name: string;
  uploadedAt: Date;
  fileName: string;
}

const RateCard = () => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedRateCard, setSelectedRateCard] = useState<UploadedRateCard | null>(null);
  const [rateCardName, setRateCardName] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedRateCards, setUploadedRateCards] = useState<UploadedRateCard[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const stats = [
    { title: "Total Rates", amount: uploadedRateCards.length.toString(), icon: <Calculator className="size-5" /> },
    { title: "Active Rates", amount: "0", icon: <Calculator className="size-5" /> },
    { title: "Expiring Rates", amount: "0", icon: <Calculator className="size-5" /> },
    { title: "Service Types", amount: "0", icon: <Calculator className="size-5" /> }
  ];

  const handleExport = () => {
    // Define headers matching the exact format in the image
    const headers = [
      "Mode/Zone",
      // WITHIN CITY columns
      "Base", "Additional", "Rto",
      // WITHIN STATE columns
      "Base", "Additional", "Rto",
      // METRO TO METRO columns
      "Base", "Additional", "Rto",
      // REST OF INDIA columns
      "Base", "Additional", "Rto",
      // NORTH EAST, J&K columns
      "Base", "Additional", "Rto",
      // COD columns
      "COD", "COD%"
    ];

    // Add the zone headers as the first row
    const zoneHeaders = [
      "",
      "WITHIN CITY", "", "",
      "WITHIN STATE", "", "",
      "METRO TO METRO", "", "",
      "REST OF INDIA", "", "",
      "NORTH EAST,J&K", "", "",
      "COD", ""
    ];

    // Sample data matching the image format exactly
    const data = [
      [
        "Bluedart air-0.50",
        "37", "36", "37",
        "45", "43", "45",
        "48", "47", "48",
        "49", "48", "49",
        "64", "62", "64",
        "35", "1.50"
      ],
      [
        "Delhivery surface-0.50",
        "32", "30", "32",
        "34", "32", "34",
        "46", "43", "46",
        "49", "46", "49",
        "68", "64", "68",
        "35", "1.75"
      ],
      [
        "Delhivery surface-10.00",
        "189", "22", "189",
        "235", "26", "235",
        "271", "29", "271",
        "313", "33", "313",
        "367", "40", "367",
        "35", "1.75"
      ],

      [
        "EcomExpress surface-0.50",
        "30", "28", "30",
        "36", "30", "36",
        "41", "34", "41",
        "44", "40", "44",
        "51", "45", "51",
        "30", "1.50"
      ],
      [
        "Ekart air-0.50",
        "31", "29", "31",
        "33", "31", "33",
        "38", "36", "38",
        "40", "38", "40",
        "45", "43", "45",
        "30", "1.50"
      ],
      [
        "Ekart express-0.50",
        "31", "29", "31",
        "34", "31", "34",
        "38", "36", "38",
        "40", "38", "40",
        "46", "43", "46",
        "30", "1.20"
      ],
      [
        "Xpressbees air-0.50",
        "27", "16", "25",
        "27", "16", "25",
        "37", "34", "37",
        "51", "40", "43",
        "55", "47", "47",
        "27", "1.18"
      ],
      [
        "Xpressbees surface-0.50",
        "27", "16", "25",
        "27", "16", "25",
        "34", "32", "32",
        "40", "35", "38",
        "47", "27", "43",
        "27", "1.18"
      ],
      [
        "Xpressbees surface-1.00",
        "40", "30", "36",
        "40", "30", "36",
        "50", "32", "44",
        "58", "35", "51",
        "69", "38", "60",
        "27", "1.18"
      ]
    ];

    // Export Excel with proper formatting to match the image
    const ws = XLSX.utils.aoa_to_sheet([zoneHeaders, headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rate Card");

    // Apply styles to match the image
    // Set column widths
    const colWidths = [20, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
    ws['!cols'] = colWidths.map(width => ({ width }));

    // Set merged cells for zone headers
    ws['!merges'] = [
      { s: { r: 0, c: 1 }, e: { r: 0, c: 3 } }, // WITHIN CITY
      { s: { r: 0, c: 4 }, e: { r: 0, c: 6 } }, // WITHIN STATE
      { s: { r: 0, c: 7 }, e: { r: 0, c: 9 } }, // METRO TO METRO
      { s: { r: 0, c: 10 }, e: { r: 0, c: 12 } }, // REST OF INDIA
      { s: { r: 0, c: 13 }, e: { r: 0, c: 15 } }, // NORTH EAST,J&K
    ];

    XLSX.writeFile(wb, `rate-card-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!uploadedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    if (!rateCardName.trim()) {
      toast.error("Please enter a name for the rate card");
      return;
    }

    // Create a new uploaded rate card entry
    const newRateCard: UploadedRateCard = {
      id: Date.now().toString(),
      name: rateCardName,
      uploadedAt: new Date(),
      fileName: uploadedFile.name
    };

    setUploadedRateCards([...uploadedRateCards, newRateCard]);
    setUploadModalOpen(false);
    setRateCardName("");
    setUploadedFile(null);

    toast.success("Rate card uploaded successfully");
  };

  const handleViewRateCard = (rateCard: UploadedRateCard) => {
    setSelectedRateCard(rateCard);
    setViewModalOpen(true);
  };

  const handleDeleteRateCard = (id: string) => {
    setUploadedRateCards(uploadedRateCards.filter(card => card.id !== id));
    toast.success("Rate card deleted successfully");
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-[#BCDDFF] p-4 rounded-lg"
          >
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">
                {stat.title}
              </h3>
              <div className="flex items-center gap-2">
                {stat.icon}
                <span className="text-lg font-semibold">
                  {stat.amount}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rate Cards Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Rate Card Management</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              className="gap-2"
              onClick={() => setUploadModalOpen(true)}
            >
              <Plus className="size-4" />
              Add Rate Card
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleExport}
              title="Download template rate card"
            >
              <Download className="size-4" />
              Download Template
            </Button>
          </div>
        </div>

        {uploadedRateCards.length > 0 ? (
          <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader className="bg-[#F4F2FF] h-12">
                <TableRow className="hover:bg-[#F4F2FF]">
                  <TableHead className="text-black">
                    Rate Card Name
                  </TableHead>
                  <TableHead className="text-black">
                    File Name
                  </TableHead>
                  <TableHead className="text-black">
                    Uploaded Date
                  </TableHead>
                  <TableHead className="text-black">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploadedRateCards.map((rateCard) => (
                  <TableRow key={rateCard.id} className="h-12">
                    <TableCell className="font-medium">
                      {rateCard.name}
                    </TableCell>
                    <TableCell>
                      {rateCard.fileName}
                    </TableCell>
                    <TableCell>
                      {rateCard.uploadedAt.toLocaleString()}
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        onClick={() => handleViewRateCard(rateCard)}
                        title="View Rate Card"
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        onClick={() => handleDeleteRateCard(rateCard.id)}
                        title="Delete Rate Card"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="border rounded-md p-8 text-center bg-gray-50">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <h3 className="text-lg font-medium text-gray-700 mb-1">No rate cards uploaded</h3>
            <p className="text-gray-500 mb-4">Upload a rate card to get started</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                variant="primary"
                className="gap-2"
                onClick={() => setUploadModalOpen(true)}
              >
                <Plus className="size-4" />
                Add Rate Card
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleExport}
                title="Download template rate card"
              >
                <Download className="size-4" />
                Download Template
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Rate Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Rate Card Name</Label>
              <Input
                id="name"
                placeholder="Enter rate card name"
                value={rateCardName}
                onChange={(e) => setRateCardName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">Upload Excel File</Label>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  id="file"
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  variant="outline"
                  className="w-full justify-center gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {uploadedFile ? "Change File" : "Select File"}
                </Button>
              </div>
              {uploadedFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {uploadedFile.name}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setUploadModalOpen(false);
                setRateCardName("");
                setUploadedFile(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={!uploadedFile || !rateCardName.trim()}
            >
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Rate Card Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-6xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedRateCard?.name}
              <span className="text-sm text-muted-foreground ml-2">
                (Uploaded: {selectedRateCard?.uploadedAt.toLocaleString()})
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-auto mt-4 h-full">
            <div className="min-w-[1000px]">
              <table className="w-full border-collapse text-[12px]">
                {/* Main Headers */}
                <thead>
                  <tr>
                    <th className="bg-[#34105A] text-white font-medium p-1.5 border border-white w-[150px]" rowSpan={2}>
                      Mode/Zone
                    </th>
                    <th className="bg-[#34105A] text-white font-medium p-1.5 border border-white text-center" colSpan={3}>
                      WITHIN CITY
                    </th>
                    <th className="bg-[#34105A] text-white font-medium p-1.5 border border-white text-center" colSpan={3}>
                      WITHIN STATE
                    </th>
                    <th className="bg-[#34105A] text-white font-medium p-1.5 border border-white text-center" colSpan={3}>
                      METRO TO METRO
                    </th>
                    <th className="bg-[#34105A] text-white font-medium p-1.5 border border-white text-center" colSpan={3}>
                      REST OF INDIA
                    </th>
                    <th className="bg-[#34105A] text-white font-medium p-1.5 border border-white text-center" colSpan={3}>
                      NORTH EAST,J&K
                    </th>
                    <th className="bg-[#34105A] text-white font-medium p-1.5 border border-white text-center">
                      COD
                    </th>
                    <th className="bg-[#34105A] text-white font-medium p-1.5 border border-white text-center">
                      COD%
                    </th>
                  </tr>

                  {/* Sub Headers */}
                  <tr>
                    {/* WITHIN CITY */}
                    <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                      <div className="text-center">Base</div>
                    </th>
                    <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                      <div className="text-center">Additional</div>
                    </th>
                    <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                      <div className="text-center">Rto</div>
                    </th>
                    {/* WITHIN STATE */}
                    <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                      <div className="text-center">Base</div>
                    </th>
                    <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                      <div className="text-center">Additional</div>
                    </th>
                    <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                      <div className="text-center">Rto</div>
                    </th>
                    {/* METRO TO METRO */}
                    <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                      <div className="text-center">Base</div>
                    </th>
                    <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                      <div className="text-center">Additional</div>
                    </th>
                    <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                      <div className="text-center">Rto</div>
                    </th>
                    {/* REST OF INDIA */}
                    <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                      <div className="text-center">Base</div>
                    </th>
                    <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                      <div className="text-center">Additional</div>
                    </th>
                    <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                      <div className="text-center">Rto</div>
                    </th>
                    {/* NORTH EAST,J&K */}
                    <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                      <div className="text-center">Base</div>
                    </th>
                    <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                      <div className="text-center">Additional</div>
                    </th>
                    <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                      <div className="text-center">Rto</div>
                    </th>
                    {/* COD and COD% */}
                    <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                      <div className="text-center">COD</div>
                    </th>
                    <th className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white w-[60px]">
                      <div className="text-center">COD%</div>
                    </th>
                  </tr>
                </thead>

                {/* Table Body - Sample Data */}
                <tbody>
                  {/* Sample data rows that match the image */}
                  {[
                    {
                      mode: "Bluedart air-0.50",
                      withinCity: { base: "37", additional: "36", rto: "37" },
                      withinState: { base: "45", additional: "43", rto: "45" },
                      metroToMetro: { base: "48", additional: "47", rto: "48" },
                      restOfIndia: { base: "49", additional: "48", rto: "49" },
                      northEastJK: { base: "64", additional: "62", rto: "64" },
                      cod: "35",
                      codPercent: "1.50"
                    },
                    {
                      mode: "Delhivery surface-0.50",
                      withinCity: { base: "32", additional: "30", rto: "32" },
                      withinState: { base: "34", additional: "32", rto: "34" },
                      metroToMetro: { base: "46", additional: "43", rto: "46" },
                      restOfIndia: { base: "49", additional: "46", rto: "49" },
                      northEastJK: { base: "68", additional: "64", rto: "68" },
                      cod: "35",
                      codPercent: "1.75"
                    },
                    {
                      mode: "Delhivery surface-10.00",
                      withinCity: { base: "189", additional: "22", rto: "189" },
                      withinState: { base: "235", additional: "26", rto: "235" },
                      metroToMetro: { base: "271", additional: "29", rto: "271" },
                      restOfIndia: { base: "313", additional: "33", rto: "313" },
                      northEastJK: { base: "367", additional: "40", rto: "367" },
                      cod: "35",
                      codPercent: "1.75"
                    },

                    {
                      mode: "EcomExpress surface-0.50",
                      withinCity: { base: "30", additional: "28", rto: "30" },
                      withinState: { base: "36", additional: "30", rto: "36" },
                      metroToMetro: { base: "41", additional: "34", rto: "41" },
                      restOfIndia: { base: "44", additional: "40", rto: "44" },
                      northEastJK: { base: "51", additional: "45", rto: "51" },
                      cod: "30",
                      codPercent: "1.50"
                    },
                    {
                      mode: "Ekart air-0.50",
                      withinCity: { base: "31", additional: "29", rto: "31" },
                      withinState: { base: "33", additional: "31", rto: "33" },
                      metroToMetro: { base: "38", additional: "36", rto: "38" },
                      restOfIndia: { base: "40", additional: "38", rto: "40" },
                      northEastJK: { base: "45", additional: "43", rto: "45" },
                      cod: "30",
                      codPercent: "1.50"
                    },
                    {
                      mode: "Ekart express-0.50",
                      withinCity: { base: "31", additional: "29", rto: "31" },
                      withinState: { base: "34", additional: "31", rto: "34" },
                      metroToMetro: { base: "38", additional: "36", rto: "38" },
                      restOfIndia: { base: "40", additional: "38", rto: "40" },
                      northEastJK: { base: "46", additional: "43", rto: "46" },
                      cod: "30",
                      codPercent: "1.20"
                    },
                    {
                      mode: "Xpressbees air-0.50",
                      withinCity: { base: "27", additional: "16", rto: "25" },
                      withinState: { base: "27", additional: "16", rto: "25" },
                      metroToMetro: { base: "37", additional: "34", rto: "37" },
                      restOfIndia: { base: "51", additional: "40", rto: "43" },
                      northEastJK: { base: "55", additional: "47", rto: "47" },
                      cod: "27",
                      codPercent: "1.18"
                    },
                    {
                      mode: "Xpressbees surface-0.50",
                      withinCity: { base: "27", additional: "16", rto: "25" },
                      withinState: { base: "27", additional: "16", rto: "25" },
                      metroToMetro: { base: "34", additional: "32", rto: "32" },
                      restOfIndia: { base: "40", additional: "35", rto: "38" },
                      northEastJK: { base: "47", additional: "27", rto: "43" },
                      cod: "27",
                      codPercent: "1.18"
                    },
                    {
                      mode: "Xpressbees surface-1.00",
                      withinCity: { base: "40", additional: "30", rto: "36" },
                      withinState: { base: "40", additional: "30", rto: "36" },
                      metroToMetro: { base: "50", additional: "32", rto: "44" },
                      restOfIndia: { base: "58", additional: "35", rto: "51" },
                      northEastJK: { base: "69", additional: "38", rto: "60" },
                      cod: "27",
                      codPercent: "1.18"
                    }
                  ].map((row, index) => (
                    <tr key={index} className={cn(
                      "text-center",
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    )}>
                      <td className="bg-[#9D80C0] text-white font-medium p-1.5 border border-white">
                        {row.mode}
                      </td>
                      {/* WITHIN CITY */}
                      <td className="p-1.5 border border-gray-200 bg-[#DFDBF0]">
                        {row.withinCity.base}
                      </td>
                      <td className="p-1.5 border border-gray-200 bg-[#DFDBF0]">
                        {row.withinCity.additional}
                      </td>
                      <td className="p-1.5 border border-gray-200 bg-[#DFDBF0]">
                        {row.withinCity.rto}
                      </td>
                      {/* WITHIN STATE */}
                      <td className="p-1.5 border border-gray-200">
                        {row.withinState.base}
                      </td>
                      <td className="p-1.5 border border-gray-200">
                        {row.withinState.additional}
                      </td>
                      <td className="p-1.5 border border-gray-200">
                        {row.withinState.rto}
                      </td>
                      {/* METRO TO METRO */}
                      <td className="p-1.5 border border-gray-200 bg-[#DFDBF0]">
                        {row.metroToMetro.base}
                      </td>
                      <td className="p-1.5 border border-gray-200 bg-[#DFDBF0]">
                        {row.metroToMetro.additional}
                      </td>
                      <td className="p-1.5 border border-gray-200 bg-[#DFDBF0]">
                        {row.metroToMetro.rto}
                      </td>
                      {/* REST OF INDIA */}
                      <td className="p-1.5 border border-gray-200">
                        {row.restOfIndia.base}
                      </td>
                      <td className="p-1.5 border border-gray-200">
                        {row.restOfIndia.additional}
                      </td>
                      <td className="p-1.5 border border-gray-200">
                        {row.restOfIndia.rto}
                      </td>
                      {/* NORTH EAST,J&K */}
                      <td className="p-1.5 border border-gray-200 bg-[#DFDBF0]">
                        {row.northEastJK.base}
                      </td>
                      <td className="p-1.5 border border-gray-200 bg-[#DFDBF0]">
                        {row.northEastJK.additional}
                      </td>
                      <td className="p-1.5 border border-gray-200 bg-[#DFDBF0]">
                        {row.northEastJK.rto}
                      </td>
                      {/* COD and COD% */}
                      <td className="p-1.5 border border-gray-200">
                        {row.cod}
                      </td>
                      <td className="p-1.5 border border-gray-200">
                        {row.codPercent}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setViewModalOpen(false);
                setSelectedRateCard(null);
              }}
            >
              Close
            </Button>
            <Button
              variant="primary"
              className="gap-2"
              onClick={() => {
                handleExport();
                setViewModalOpen(false);
                setSelectedRateCard(null);
              }}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RateCard;
