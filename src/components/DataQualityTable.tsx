import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ColDef, GridReadyEvent, ICellRendererParams } from 'ag-grid-community';
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Edit } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

// Custom cell renderer for the action column
const ActionCellRenderer = (props: ICellRendererParams) => {
  return (
    <div className="flex justify-center">
      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
        <Edit className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Custom cell renderer for quality score with gauge visualization
const QualityScoreRenderer = (props: ICellRendererParams) => {
  // Safely access data properties with optional chaining
  const value = props.value;
  const severityLevel = props.data?.severityLevel;
  
  // Determine color based on severity
  let color = 'text-green-500';
  if (severityLevel === 'High') {
    color = 'text-red-500';
  } else if (severityLevel === 'Medium') {
    color = 'text-yellow-500';
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
          <line x1="18" y1="18" x2="28" y2="18" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
    </div>
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

  // Calculate total pages and records
  useEffect(() => {
    const recordCount = mockData.reduce((acc, group) => acc + group.children.length, 0);
    setTotalRecords(recordCount);
    setTotalPages(Math.ceil(mockData.length / recordsPerPage));
  }, [recordsPerPage]);

  const toggleGroup = (groupName: string) => {
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
    return mockData.slice(startIndex, endIndex);
  }, [currentPage, recordsPerPage]);

  return (
    <div className="flex flex-col">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
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
          {visibleGroups.map((group) => (
            <Collapsible 
              key={group.groupName} 
              open={expandedGroups[group.groupName]} 
              onOpenChange={() => toggleGroup(group.groupName)}
              className="border-b"
            >
              <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center">
                  {expandedGroups[group.groupName] ? (
                    <ChevronDown className="h-5 w-5 mr-2" />
                  ) : (
                    <ChevronUp className="h-5 w-5 mr-2" />
                  )}
                  <span className="font-medium">{group.groupName}</span>
                </div>
                <span className="text-sm text-gray-500">
                  ({group.children.length} records)
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-4 bg-gray-50">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Issue ID</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>System Name</TableHead>
                        <TableHead>Site ID</TableHead>
                        <TableHead>Subject ID</TableHead>
                        <TableHead>Study ID</TableHead>
                        <TableHead>Folder/Visit</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Quality Score</TableHead>
                        <TableHead>Severity Level</TableHead>
                        <TableHead className="w-[80px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.children.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.id}</TableCell>
                          <TableCell>{record.source}</TableCell>
                          <TableCell>{record.systemName}</TableCell>
                          <TableCell>{record.siteId}</TableCell>
                          <TableCell>{record.subjectId}</TableCell>
                          <TableCell>{record.studyId}</TableCell>
                          <TableCell>{record.folder}</TableCell>
                          <TableCell>{record.status}</TableCell>
                          <TableCell>
                            <QualityScoreRenderer value={record.qualityScore} data={record} />
                          </TableCell>
                          <TableCell>{record.severityLevel}</TableCell>
                          <TableCell>
                            <ActionCellRenderer />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
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
    </div>
  );
};
