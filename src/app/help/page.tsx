import React from 'react';

const HelpPage = () => (
  <div className="min-h-screen p-5">
    <div className="max-w-4xl mx-auto rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">How to Submit Your Plot Data for Deforestation Analysis</h2>
      
      <p className="mb-3">
        Follow these steps to submit your plot data in various formats. Our system will analyze your submission to determine if there&apos;s any deforestation activity.
      </p>

      <ol className="list-decimal ml-5 mb-4">
        <li className="mb-2">Log in to your account and navigate to the &apos;Submit Plot&apos; section.</li>
        <li className="mb-2">Choose the format in which you want to submit your plot data (e.g., CSV, GeoJSON, Shapefile).</li>
        <li className="mb-2">Upload your plot data file. Ensure that the data is accurate and up to date.</li>
        <li className="mb-2">Provide any additional information or context about the plot in the designated text box.</li>
        <li className="mb-2">Click on &apos;Submit&apos; to send your data for analysis.</li>
      </ol>

      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
        <p><strong>Note:</strong> The analysis might take a few minutes to complete. You will receive a notification once the analysis is done.</p>
      </div>

      <p className="mb-3">
        If you encounter any issues or need further assistance, please contact our support team.
      </p>

      <button type="button" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Contact Support
      </button>
    </div>
  </div>
);

export default HelpPage;
