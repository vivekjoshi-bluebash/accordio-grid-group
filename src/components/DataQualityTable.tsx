
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ICellRendererParams } from 'ag-grid-community';
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Edit, MoreHorizontal, Ungroup, Pencil } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Define custom interfaces for our data types
interface GroupData {
  groupName: string;
  children: IssueData[];
}

interface IssueData {
  id: string;
  source: string;
  systemName: string;
  siteId: string;
  subjectId: string;
  studyId: string;
  folder: string;
  status: string;
  qualityScore: number;
  severityLevel: string;
}

// Create a custom interface for cell renderer props that extends ICellRendererParams
interface CellRendererProps extends Partial<ICellRendererParams> {
  data?: IssueData;
  value?: any;
  valueFormatted?: any;
  node?: any;
  rowIndex?: number;
  eGridCell?: HTMLElement;
  eParentOfValue?: HTMLElement;
  api?: any;
  columnApi?: any;
  colDef?: any;
  column?: any;
  frameworkComponentInstance?: any;
}

// Custom cell renderer for the action column
const ActionCellRenderer = (props: CellRendererProps) => {
  return (
    <div className="flex justify-center">
      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
        <Edit className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Custom cell renderer for quality score with gauge visualization
const QualityScoreRenderer = (props: CellRendererProps) => {
  // Safely access data properties with optional chaining
  const value = props.value;
  const severityLevel = props.data?.severityLevel;
  
  // Determine color based on severity
  let color = 'text-green-500';
  if (severityLevel === 'High') {
    color = 'text-red-500';
  } else if (severityLevel === 'Medium') {
    color = 'text-yellow-500';
  } else if (severityLevel === 'Low') {
    color = 'text-green-500';
  }

  return (
    <div className="flex items-center">
      <div className={`w-12 h-12 relative ${color}`}>
        <svg viewBox="0 0 36 36" className="w-full h-full">
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="#eee"
            strokeWidth="3"
          />
          <path
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="75, 100"
          />
          <text x="18" y="20" textAnchor="middle" fill="currentColor" fontSize="8">
            {value}
          </text>
          <line x1="18" y1="18" x2="28" y2="18" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
};

// Folder link renderer
const FolderLinkRenderer = (props: CellRendererProps) => {
  const folder = props.value;
  
  return (
    <a href="#" className="text-blue-600 hover:underline font-medium">
      {folder}
    </a>
  );
};

// System name renderer
const SystemNameRenderer = (props: CellRendererProps) => {
  const systemName = props.value;
  
  return (
    <a href="#" className="text-blue-600 hover:underline font-medium">
      {systemName}
    </a>
  );
};

// Mock data for the grid
const mockData: GroupData[] = [
  {
    groupName: 'AE Grouped By User (Varsha Kishore (Varsha.k))',
    children: [
      { id: '21', source: 'EDC', systemName: 'US629', siteId: '901-022', subjectId: 'Maxis-01', studyId: 'Study001', folder: 'AE', status: 'Open', qualityScore: 75, severityLevel: 'High' },
      { id: '51', source: 'EDC', systemName: 'FR320', siteId: '901-022', subjectId: 'Maxis-01', studyId: 'Study001', folder: 'AE', status: 'Open', qualityScore: 75, severityLevel: 'High' },
      { id: '31', source: 'EDC', systemName: 'FR320', siteId: '901-022', subjectId: 'Maxis-01', studyId: 'Study001', folder: 'AE', status: 'Open', qualityScore: 75, severityLevel: 'High' },
    ]
  },
  {
    groupName: 'Cross System (Grouped By System)',
    children: [
      { id: '30', source: 'Lab', systemName: 'AM-832', siteId: '901-022', subjectId: 'Maxis-01', studyId: 'Study001', folder: 'ECG', status: 'Review Pending', qualityScore: 75, severityLevel: 'High' },
    ]
  },
  {
    groupName: 'Cross Domain (Grouped By System)',
    children: [
      { id: '25', source: 'EDC', systemName: 'DG-729', siteId: '901-022', subjectId: 'Maxis-01', studyId: 'Study001', folder: 'DM', status: 'Closed', qualityScore: 45, severityLevel: 'Low' },
      { id: '26', source: 'EDC', systemName: 'DG-729', siteId: '901-022', subjectId: 'Maxis-01', studyId: 'Study001', folder: 'DM', status: 'Query Raised', qualityScore: 45, severityLevel: 'Low' },
      { id: '27', source: 'EDC', systemName: 'DG-729', siteId: '901-022', subjectId: 'Maxis-01', studyId: 'Study001', folder: 'DM', status: 'Re-query', qualityScore: 45, severityLevel: 'Low' },
    ]
  }
];

export const DataQualityTable = () => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [recordsPerPage, setRecordsPerPage] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [groupData, setGroupData] = useState<GroupData[]>(mockData);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<string>("");
  const [newGroupName, setNewGroupName] = useState<string>("");
  const [isUngroupDialogOpen, setIsUngroupDialogOpen] = useState(false);

  // Initialize all groups as collapsed
  useEffect(() => {
    const initialExpandedState: Record<string, boolean> = {};
    groupData.forEach(group => {
      initialExpandedState[group.groupName] = false;
    });
    setExpandedGroups(initialExpandedState);
  }, [groupData]);

  // Calculate total pages and records
  useEffect(() => {
    const recordCount = groupData.reduce((acc, group) => acc + group.children.length, 0);
    setTotalRecords(recordCount);
    setTotalPages(Math.ceil(groupData.length / recordsPerPage));
  }, [recordsPerPage, groupData]);

  const toggleGroup = (groupName: string) => {
    console.log('Toggling group:', groupName);
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const handlePageChange = (pageNum: number) => {
    setCurrentPage(pageNum);
  };

  const handleRecordsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRecordsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Get visible groups for current page
  const visibleGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return groupData.slice(startIndex, endIndex);
  }, [currentPage, recordsPerPage, groupData]);

  // Handle rename group
  const handleRenameClick = (groupName: string) => {
    setCurrentGroup(groupName);
    setNewGroupName(groupName);
    setIsRenameDialogOpen(true);
  };

  // Handle ungroup option
  const handleUngroupClick = (groupName: string) => {
    setCurrentGroup(groupName);
    setIsUngroupDialogOpen(true);
  };

  // Complete the rename operation
  const handleRenameComplete = () => {
    if (newGroupName.trim()) {
      setGroupData(prev => 
        prev.map(group => 
          group.groupName === currentGroup 
            ? { ...group, groupName: newGroupName.trim() } 
            : group
        )
      );
      toast.success("Group renamed successfully.");
    }
    setIsRenameDialogOpen(false);
  };

  // Complete the ungroup operation
  const handleUngroupComplete = () => {
    // In a real app, this would contain logic to ungroup the selected group
    // For this demo, we'll just show a success message
    toast.success("Group ungrouped successfully.");
    setIsUngroupDialogOpen(false);
  };

  return (
    <div className="flex flex-col">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
          <h2 className="text-xl font-semibold">Data Quality Issues</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Open
            </Button>
            <Button variant="outline" size="sm">
              Answer
            </Button>
            <Button variant="outline" size="sm">
              Requery
            </Button>
            <Button variant="outline" size="sm">
              Close
            </Button>
            <Button variant="outline" size="sm">
              Cancel
            </Button>
            <Button variant="outline" size="sm">
              Reopen
            </Button>
          </div>
        </div>
        <div className="w-full">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox />
                </TableHead>
                <TableHead className="w-[80px]">Issue ID</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>System Name</TableHead>
                <TableHead>Site ID</TableHead>
                <TableHead>Subject ID</TableHead>
                <TableHead>Study ID</TableHead>
                <TableHead>Folder/Visit</TableHead>
                <TableHead>Form/Domain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Quality Score</TableHead>
                <TableHead>Severity Level</TableHead>
                <TableHead className="w-[80px]">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleGroups.map((group) => (
                <React.Fragment key={group.groupName}>
                  {/* Group Header Row */}
                  <TableRow className="hover:bg-gray-100 cursor-pointer">
                    <TableCell colSpan={13} className="p-0">
                      <Collapsible 
                        open={expandedGroups[group.groupName] || false} 
                        onOpenChange={() => toggleGroup(group.groupName)}
                      >
                        <div className="w-full flex items-center justify-between hover:bg-gray-50 cursor-pointer">
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center grow py-4 pl-4">
                              {expandedGroups[group.groupName] ? (
                                <ChevronUp className="h-5 w-5 mr-2" />
                              ) : (
                                <ChevronDown className="h-5 w-5 mr-2" />
                              )}
                              <span className="font-medium">{group.groupName}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                ({group.children.length} records)
                              </span>
                            </div>
                          </CollapsibleTrigger>
                          <div className="pr-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleUngroupClick(group.groupName)}>
                                  <Ungroup className="mr-2 h-4 w-4" />
                                  <span>Ungroup</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRenameClick(group.groupName)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  <span>Rename</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <CollapsibleContent>
                          {group.children.map((record) => (
                            <TableRow key={record.id} className="hover:bg-gray-50">
                              <TableCell className="pl-10">
                                <Checkbox />
                              </TableCell>
                              <TableCell>{record.id}</TableCell>
                              <TableCell>{record.source}</TableCell>
                              <TableCell>
                                <SystemNameRenderer value={record.systemName} data={record} />
                              </TableCell>
                              <TableCell>
                                <a href="#" className="text-blue-600 hover:underline font-medium">
                                  {record.siteId}
                                </a>
                              </TableCell>
                              <TableCell>{record.subjectId}</TableCell>
                              <TableCell>{record.studyId}</TableCell>
                              <TableCell>
                                <FolderLinkRenderer value={record.folder} data={record} />
                              </TableCell>
                              <TableCell></TableCell>
                              <TableCell>{record.status}</TableCell>
                              <TableCell>
                                <QualityScoreRenderer value={record.qualityScore} data={record} />
                              </TableCell>
                              <TableCell className={
                                record.severityLevel === 'High' ? 'text-red-500' : 
                                record.severityLevel === 'Medium' ? 'text-yellow-500' : 
                                'text-green-500'
                              }>
                                {record.severityLevel}
                              </TableCell>
                              <TableCell>
                                <ActionCellRenderer data={record} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Records per page:</span>
            <select 
              value={recordsPerPage}
              onChange={handleRecordsPerPageChange}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value={8}>8</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-600 ml-4">
              {Math.min((currentPage - 1) * recordsPerPage + 1, totalRecords)}-
              {Math.min(currentPage * recordsPerPage, totalRecords)} of {totalRecords} records
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              <input 
                type="text" 
                value={currentPage}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value > 0 && value <= totalPages) {
                    handlePageChange(value);
                  }
                }}
                className="border rounded w-12 text-center py-1"
              />
              <span className="text-sm text-gray-600">of {totalPages}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Group</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Enter new name for the group"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={handleRenameComplete}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ungroup Dialog */}
      <Dialog open={isUngroupDialogOpen} onOpenChange={setIsUngroupDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ungroup Selections</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to ungroup "{currentGroup}"?</p>
          </div>
          <DialogFooter>
            <Button 
              variant="destructive"
              onClick={handleUngroupComplete}
            >
              Ungroup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
