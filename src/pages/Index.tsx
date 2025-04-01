
import React, { useState, useEffect } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { DataQualityTable } from '@/components/DataQualityTable';
import { Button } from "@/components/ui/button";
import { Layout } from '@/components/Layout';

const Index = () => {
  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Data Quality Issues</h1>
        <DataQualityTable />
      </div>
    </Layout>
  );
};

export default Index;
