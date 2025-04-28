'use client'

import React from 'react';
import SwaggerUI from "swagger-ui-react";
import 'swagger-ui-react/swagger-ui.css';
import './styles.css';


const DocumentationPage = () => {
  return (
    <div className="min-h-screen text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Documentation</h1>
        <div id="swagger-container" className="bg-gray-800 p-4 text-white rounded-lg shadow-lg">
          <SwaggerUI url="/swagger.json"/>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;
