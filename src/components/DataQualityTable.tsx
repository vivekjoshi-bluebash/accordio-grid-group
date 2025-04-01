import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ColDef, GridReadyEvent, ICellRendererParams } from 'ag-grid-community';
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Edit } from 'lucide-react';

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
  const { value, data } = props;
  
  // Determine color based on severity
  let color = 'text-green-500';
  if (data.severityLevel === 'High') {
    color = 'text-red-500';
  } else if (data.severityLevel === 'Medium') {
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

// Custom renderer for group cells
const GroupCellRenderer = (props: ICellRendererParams) => {
  const { node } = props;
  const expanded = node.expanded;

  return (
    <div className="flex items-center">
      {expanded ? <ChevronDown className="mr-2" /> : <ChevronUp className="mr-2" />}
      <span>{props.value}</span>
    </div>
  );
};

// Mock data for the grid
const mockData = [
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
  const gridRef = useRef<AgGridReact>(null);
  const [rowData, setRowData] = useState<any[]>([]);
  const [recordsPerPage, setRecordsPerPage] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const flattenData = useCallback(() => {
    let result: any[] = [];
    mockData.forEach((group) => {
      // Add the group header as a row with a special type
      result.push({
        id: group.groupName,
        isGroup: true,
        groupName: group.groupName,
        expanded: false
      });
      
      // Add children with a reference to the parent group
      group.children.forEach((child) => {
        result.push({
          ...child,
          isGroup: false,
          groupParent: group.groupName
        });
      });
    });
    return result;
  }, []);

  useEffect(() => {
    const data = flattenData();
    setRowData(data);
    setTotalRecords(mockData.reduce((acc, group) => acc + group.children.length, 0));
    setTotalPages(Math.ceil(data.length / recordsPerPage));
  }, [recordsPerPage, flattenData]);

  const toggleGroup = (groupName: string) => {
    setRowData(prevRows => {
      const updatedRows = [...prevRows];
      const groupIndex = updatedRows.findIndex(row => row.id === groupName);
      
      if (groupIndex !== -1) {
        // Toggle the expanded state
        const isExpanded = !updatedRows[groupIndex].expanded;
        updatedRows[groupIndex] = { ...updatedRows[groupIndex], expanded: isExpanded };
        
        // Show/hide children based on expanded state
        updatedRows.forEach((row, index) => {
          if (!row.isGroup && row.groupParent === groupName) {
            updatedRows[index] = { ...row, hidden: !isExpanded };
          }
        });
      }
      
      return updatedRows;
    });
  };

  const columnDefs: ColDef[] = [
    { 
      headerCheckboxSelection: true,
      checkboxSelection: params => !params.data?.isGroup,
      width: 50,
      headerName: '',
      field: 'checkbox'
    },
    { 
      headerName: 'Issue ID', 
      field: 'id',
      width: 100,
      cellRenderer: params => {
        if (params.data?.isGroup) {
          return (
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => toggleGroup(params.data.id)}
            >
              {params.data.expanded ? 
                <ChevronDown className="h-5 w-5 mr-2" /> : 
                <ChevronUp className="h-5 w-5 mr-2" />
              }
              <span className="font-medium">{params.data.groupName}</span>
            </div>
          );
        }
        return params.value;
      }
    },
    { headerName: 'Source', field: 'source', width: 100 },
    { headerName: 'System Name', field: 'systemName', width: 150 },
    { headerName: 'Site ID', field: 'siteId', width: 120 },
    { headerName: 'Subject ID', field: 'subjectId', width: 120 },
    { headerName: 'Study ID', field: 'studyId', width: 120 },
    { headerName: 'Folder/Visit', field: 'folder', width: 120 },
    { headerName: 'Status', field: 'status', width: 150 },
    { 
      headerName: 'Quality Score', 
      field: 'qualityScore', 
      width: 150,
      cellRenderer: QualityScoreRenderer
    },
    { headerName: 'Severity Level', field: 'severityLevel', width: 150 },
    { 
      headerName: 'Action', 
      field: 'action', 
      width: 100,
      cellRenderer: ActionCellRenderer
    }
  ];

  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
  }), []);

  // AG Grid's row class rules to style rows
  const rowClassRules = {
    'bg-gray-100': (params: any) => params.data?.isGroup,
    'hidden': (params: any) => params.data?.hidden
  };

  const onGridReady = (params: GridReadyEvent) => {
    // Initially, hide all child rows
    setRowData(prevRows => 
      prevRows.map(row => ({
        ...row,
        hidden: !row.isGroup
      }))
    );
  };

  const handlePageChange = (pageNum: number) => {
    setCurrentPage(pageNum);
  };

  const handleRecordsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRecordsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

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
        <div className="ag-theme-alpine w-full" style={{ height: '600px' }}>
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            rowClassRules={rowClassRules}
            onGridReady={onGridReady}
            suppressRowClickSelection={true}
            rowSelection="multiple"
          />
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
              {(currentPage - 1) * recordsPerPage + 1}-
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
