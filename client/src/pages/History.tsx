import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Eye, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HistoryEntry {
  id: number;
  date: string;
  time: string;
  activityType: string;
  description: string;
  values: string;
}

export default function History() {
  const [activityType, setActivityType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingEntry, setViewingEntry] = useState<HistoryEntry | null>(null);
  const { toast } = useToast();

  // Fetch history entries
  const { data, isLoading } = useQuery({
    queryKey: ['/api/history', { activityType, dateFrom, dateTo, page: currentPage }],
  });

  const historyEntries = data?.entries || [];
  const totalEntries = data?.total || 0;
  const entriesPerPage = data?.perPage || 10;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);

  const handleExport = async () => {
    try {
      const response = await apiRequest('GET', `/api/history/export?activityType=${activityType}&dateFrom=${dateFrom}&dateTo=${dateTo}`);
      
      // Create and download CSV
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `lukes-fit-track-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Your history data has been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: `Failed to export data: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Activity History</h2>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="activity-type">
                Activity Type
              </label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger id="activity-type">
                  <SelectValue placeholder="All Activities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="weight">Weight Entries</SelectItem>
                  <SelectItem value="nutrition">Nutrition Entries</SelectItem>
                  <SelectItem value="workout">Workout Entries</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="date-from">
                From Date
              </label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="date-to">
                To Date
              </label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            
            <div className="flex items-end">
              <Button 
                className="w-full" 
                variant="outline" 
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                  setActivityType("all");
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* History Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Activity Log</CardTitle>
          <Button onClick={handleExport} className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Activity Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Values</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : historyEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No history entries found. Start tracking your activities to build your history!
                    </TableCell>
                  </TableRow>
                ) : (
                  historyEntries.map((entry: HistoryEntry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{entry.time}</TableCell>
                      <TableCell>
                        <span className={
                          entry.activityType === 'weight' ? 'text-yellow-600' :
                          entry.activityType === 'nutrition' ? 'text-primary' :
                          entry.activityType === 'workout' ? 'text-green-600' : ''
                        }>
                          {entry.activityType.charAt(0).toUpperCase() + entry.activityType.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell>{entry.values}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewingEntry(entry)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * entriesPerPage + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * entriesPerPage, totalEntries)}
                  </span>{" "}
                  of <span className="font-medium">{totalEntries}</span> results
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Detail Modal */}
      {viewingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">Activity Details</h3>
              <Button variant="ghost" size="icon" onClick={() => setViewingEntry(null)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Date</p>
                  <p className="text-base">{viewingEntry.date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Time</p>
                  <p className="text-base">{viewingEntry.time}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500">Activity Type</p>
                <p className="text-base capitalize">{viewingEntry.activityType}</p>
              </div>
              
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="text-base">{viewingEntry.description}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Values</p>
                <p className="text-base">{viewingEntry.values}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
