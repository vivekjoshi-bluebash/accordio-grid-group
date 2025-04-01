
import React from 'react';
import { DataQualityTable } from '@/components/DataQualityTable';
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
