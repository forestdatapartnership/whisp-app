import React from "react";

export default function UpdateNoticePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="rounded-lg shadow-lg p-6 md:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">WHISP API Update Notice</h1>
          <p className="text-gray-500 mt-2">Important changes to our API services</p>
          <p className="text-gray-500 mt-2">21 July, 2025</p>
        </div>

        <div className="prose max-w-none">
          <p className="text-lg">
            We would like to inform our users of upcoming changes to the WHISP API that will affect how you interact with the API.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">What&apos;s Changing:</h2>
          
          <ul className="list-disc pl-6 space-y-3">
            <li>
              <strong>User Authentication Required:</strong> All API requests will now require a registered user account.
            </li>
            
            <li>
              <strong>API Key Required:</strong> You must include the API key in the <code>x-api-key</code> header in your requests.
            </li>
            
            <li>
              <strong>Default Response Format:</strong> The API will now return responses in GeoJSON format by default.
            </li>
            
            <li>
              <strong>Official Client Library:</strong> The API will now use the <code>openforis-whisp</code> package and its corresponding output.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">What&apos;s Not Changing:</h2>
          
          <ul className="list-disc pl-6 space-y-3">
            <li>
              <strong>Privacy and Security:</strong> Polygons are not logged or persisted.
            </li>
            
            <li>
              <strong>Data Anonymization:</strong> Data sent to Google Earth Engine is anonymized.
            </li>
            
            <li>
              <strong>Input Flexibility:</strong> GeoJSON, WKT, and GeoIDs (if available) input formats are still allowed.
            </li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">New Endpoint Structure:</h2>
          <p>You can now submit data using the following endpoints:</p>
          
          <ul className="list-disc pl-6 space-y-2">
            <li><code>/api/submit/geojson</code></li>
            <li><code>/api/submit/wkt</code></li>
            <li><code>/api/submit/geo-ids</code></li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">Legacy Output Compatibility:</h2>
          <p>
            If needed, you will be able to receive the legacy response format by including <code>x-legacy-format: true</code> in the header of your POST request.
          </p>
          
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
            <p className="text-yellow-700">
              The old endpoints will continue to function temporarily but will be deprecated soon. Please transition to the new structure and authentication requirements as soon as possible.
            </p>
          </div>

          <p className="mt-6">
            For more details, refer to the updated API documentation and see the PyPI site for the package.
          </p>

          <div className="mt-8 pt-4 border-t border-gray-200">
            <p>
              Thank you for your continued support.
              <br />
              Best regards,
              <br />
              <strong>The WHISP Team</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}